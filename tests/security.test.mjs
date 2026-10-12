import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const ids = {
  unverified: "00000000-0000-4000-8000-000000000001",
  student: "00000000-0000-4000-8000-000000000002",
  other: "00000000-0000-4000-8000-000000000003",
  admin: "00000000-0000-4000-8000-000000000004",
  closed: "00000000-0000-4000-8000-000000000005",
};
async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
    create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text);
    alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to anon,authenticated;`);
  await db.exec(
    await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    `update public.course_settings set privacy_controller='Responsable de prueba',privacy_contact='contacto@example.org',privacy_retention='Criterio de prueba',privacy_procedure='Procedimiento de prueba',privacy_approved=true,registration_open=true;`,
  );
  for (const [key, id] of Object.entries(ids)) {
    if (key === "closed") continue;
    await db.query(
      `insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,$3,$4)`,
      [
        id,
        `${key}@example.org`,
        key === "unverified" ? null : "2026-10-12T15:00:00Z",
        JSON.stringify({
          full_name: `Cuenta ${key}`,
          consent_version: "2026-10-12",
        }),
      ],
    );
  }
  await db.query("insert into public.administrators(user_id) values($1)", [
    ids.admin,
  ]);
  await db.exec(`insert into public.materials(id,title,filename,format,category,bytes,sha256,paths) values('test','Guía','guia.pdf','PDF','general',10,repeat('a',64),array['test/guia.pdf']);
    insert into storage.objects(bucket_id,name) values('ecovecinos-materiales','test/guia.pdf'),('ecovecinos-materiales','orphan.pdf');
    insert into public.videos(lesson_id,title,url,published) values('teoria-1','Visible','https://youtu.be/test',true),('teoria-1','Oculto','https://youtu.be/hidden',false);`);
  await db.exec(`insert into public.materials(id,title,filename,format,category,bytes,sha256,paths) values('legacy','Original editable','guia.docx','DOCX','general',10,repeat('b',64),array['test/guia.docx']);
    insert into storage.objects(bucket_id,name) values('ecovecinos-materiales','test/guia.docx');`);
  await db.exec(await readFile(new URL('../supabase/pdf-only-materials.sql', import.meta.url), 'utf8'));
  // La migración es idempotente y no destruye los originales.
  await db.exec(await readFile(new URL('../supabase/pdf-only-materials.sql', import.meta.url), 'utf8'));
  return db;
}
async function as(db, role, id, fn) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

test("PostgreSQL: esquema, verificación de correo y RLS", async (t) => {
  const db = await setup();
  try {
    await t.test(
      "No se inscribe una cuenta sin correo verificado",
      async () => {
        assert.equal(
          (
            await db.query(
              "select * from public.enrollments where user_id=$1",
              [ids.unverified],
            )
          ).rows.length,
          0,
        );
      },
    );
    await t.test("Confirmar correo inscribe exactamente una vez", async () => {
      await db.query(
        "update auth.users set email_confirmed_at=now() where id=$1",
        [ids.unverified],
      );
      await db.query(
        "update auth.users set email_confirmed_at=now() where id=$1",
        [ids.unverified],
      );
      assert.equal(
        (
          await db.query("select * from public.enrollments where user_id=$1", [
            ids.unverified,
          ])
        ).rows.length,
        1,
      );
    });
    await t.test("Anónimo no lee materiales ni objetos privados", async () => {
      await as(db, "anon", null, async () => {
        await assert.rejects(
          db.query("select * from public.materials"),
          /permission denied/,
        );
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.videos")).rows.length,
          1,
        );
      });
    });
    await t.test(
      "Alumno verificado descarga solo objetos del catálogo y no ve perfiles ajenos",
      async () => {
        await as(db, "authenticated", ids.student, async () => {
          assert.equal(
            (await db.query("select * from public.materials")).rows.length,
            1,
          );
          assert.equal(
            (await db.query("select * from storage.objects")).rows.length,
            1,
          );
          assert.equal(
            (await db.query("select * from public.profiles")).rows.length,
            1,
          );
          assert.equal(
            (await db.query("select * from public.videos")).rows.length,
            1,
          );
        });
      },
    );
    await t.test("Material editable archivado no se lee ni descarga por participantes", async () => {
      assert.equal((await db.query("select published from public.materials where id='legacy'")).rows[0].published, false);
      await as(db, "authenticated", ids.student, async () => {
        assert.equal((await db.query("select * from public.materials where id='legacy'")).rows.length, 0);
        assert.equal((await db.query("select * from storage.objects where name='test/guia.docx'")).rows.length, 0);
      });
      await as(db, "authenticated", ids.admin, async () => {
        await assert.rejects(db.query("insert into public.materials(id,title,filename,format,category,bytes,sha256,paths) values('new-word','Word','nuevo.docx','DOCX','general',10,repeat('a',64),array['nuevo.docx'])"), /row-level security/);
      });
    });
    await t.test(
      "Alumno no se convierte en administrador ni modifica inscripciones",
      async () => {
        await as(db, "authenticated", ids.student, async () => {
          await assert.rejects(
            db.query("insert into public.administrators(user_id) values($1)", [
              ids.student,
            ]),
            /permission denied/,
          );
          await assert.rejects(
            db.query("insert into public.enrollments(user_id) values($1)", [
              ids.closed,
            ]),
            /permission denied/,
          );
          await assert.rejects(
            db.query("update public.profiles set signup_eligible=true"),
            /permission denied/,
          );
        });
      },
    );
    await t.test("Alumno no publica videos ni carga archivos", async () => {
      await as(db, "authenticated", ids.student, async () => {
        await assert.rejects(
          db.query(
            "insert into public.videos(lesson_id,title,url) values('teoria-1','Ataque','https://youtu.be/x')",
          ),
          /row-level security/,
        );
        await assert.rejects(
          db.query(
            "insert into storage.objects(bucket_id,name) values('ecovecinos-materiales','ataque')",
          ),
          /row-level security/,
        );
        assert.equal(
          (
            await db.query(
              "update public.course_settings set course_place='Cambio no autorizado' returning *",
            )
          ).rows.length,
          0,
        );
      });
    });
    await t.test(
      "Revocar verificación bloquea la lectura aunque exista inscripción",
      async () => {
        await db.query(
          "update auth.users set email_confirmed_at=null where id=$1",
          [ids.other],
        );
        await as(db, "authenticated", ids.other, async () => {
          assert.equal(
            (await db.query("select * from public.materials")).rows.length,
            0,
          );
          assert.equal(
            (await db.query("select * from storage.objects")).rows.length,
            0,
          );
        });
      },
    );
    await t.test("Administrador verificado puede editar y cargar", async () => {
      await as(db, "authenticated", ids.admin, async () => {
        assert.equal(
          (await db.query("select * from public.videos")).rows.length,
          2,
        );
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          3,
        );
        await db.query(
          "update public.course_settings set course_dates='Fecha de prueba'",
        );
        await db.query(
          "insert into public.videos(lesson_id,title,url) values('teoria-2','Prueba','https://instagram.com/reel/x')",
        );
        await db.query(
          "insert into storage.objects(bucket_id,name) values('ecovecinos-materiales','nuevo.pdf')",
        );
      });
    });
    await t.test("No se abren inscripciones con aviso incompleto", async () => {
      await assert.rejects(
        db.exec("update public.course_settings set privacy_retention=''"),
        /check constraint/,
      );
    });
    await t.test(
      "Cuenta creada con inscripción cerrada no obtiene materiales al verificar",
      async () => {
        await db.exec(
          "update public.course_settings set registration_open=false",
        );
        await db.query(
          "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)",
          [
            ids.closed,
            "closed@example.org",
            JSON.stringify({
              full_name: "Prueba cerrada",
              consent_version: "2026-10-12",
            }),
          ],
        );
        assert.equal(
          (
            await db.query(
              "select * from public.enrollments where user_id=$1",
              [ids.closed],
            )
          ).rows.length,
          0,
        );
        await as(db, "authenticated", ids.closed, async () => {
          assert.equal(
            (await db.query("select * from storage.objects")).rows.length,
            0,
          );
        });
      },
    );
    await t.test(
      "El bucket permanece privado y rechaza URLs de otros dominios",
      async () => {
        assert.equal(
          (
            await db.query(
              "select public from storage.buckets where id='ecovecinos-materiales'",
            )
          ).rows[0].public,
          false,
        );
        await assert.rejects(
          db.query(
            "insert into public.videos(lesson_id,title,url) values('teoria-1','Ataque','https://youtube.com.evil.test/x')",
          ),
          /check constraint/,
        );
      },
    );
  } finally {
    await db.close();
  }
});
