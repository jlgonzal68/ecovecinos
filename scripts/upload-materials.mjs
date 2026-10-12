import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { sourceCategory, isPDFMaterial } from "../site/js/core.mjs";

const base = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sourceArg = args.indexOf("--source");
const source =
  sourceArg >= 0 ? resolve(args[sourceArg + 1]) : resolve(base, "..");
const dryRun = args.includes("--dry-run");
const config = JSON.parse(
  await readFile(resolve(base, "site/config.json"), "utf8"),
);
const catalog = JSON.parse(
  await readFile(resolve(base, "site/catalog.json"), "utf8"),
);
const originals = [];
for (const entry of catalog) {
  if (!isPDFMaterial(entry)) throw new Error("El catálogo de carga solo admite PDF.");
  const bytes = await readFile(resolve(source, entry.filename));
  if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error(`Cabecera PDF inválida: ${entry.filename}`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== entry.bytes || sha256 !== entry.sha256)
    throw new Error(
      `El original no coincide con el inventario: ${entry.filename}`,
    );
  originals.push(entry);
}
console.log(
  `Validación completa: ${originals.length} archivos originales, ${originals.reduce((n, r) => n + r.bytes, 0)} bytes; SHA-256 correcto.`,
);
if (dryRun) {
  console.log("Modo de validación: no se ha conectado ni escrito en Supabase.");
  process.exit(0);
}
if (!config.supabaseUrl || !config.supabaseAnonKey)
  throw new Error(
    "Completa la configuración pública de Supabase antes de cargar.",
  );
if (!process.env.ECO_ADMIN_EMAIL || !process.env.ECO_ADMIN_PASSWORD)
  throw new Error(
    "Configura ECO_ADMIN_EMAIL y ECO_ADMIN_PASSWORD en tu entorno local privado. No incluyas estas credenciales en GitHub ni en mensajes.",
  );
const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
function ok(result) {
  if (result.error) throw result.error;
  return result.data;
}
const { user } = ok(
  await client.auth.signInWithPassword({
    email: process.env.ECO_ADMIN_EMAIL,
    password: process.env.ECO_ADMIN_PASSWORD,
  }),
);
if (!user?.email_confirmed_at || !ok(await client.rpc("is_admin")))
  throw new Error("Se requiere una cuenta administrativa verificada.");
const mime = { PDF: "application/pdf" };
try {
  for (const entry of originals) {
    const data = await readFile(resolve(source, entry.filename));
    const size = 40 * 1024 * 1024;
    const paths = [];
    const folder = `${entry.id}/${randomUUID()}`;
    try {
      for (let offset = 0; offset < data.length; offset += size) {
        const index = Math.floor(offset / size);
        const path = `${folder}/${String(index).padStart(3, "0")}-${entry.slug}`;
        ok(
          await client.storage
            .from(config.bucket)
            .upload(
              path,
              data.subarray(offset, Math.min(offset + size, data.length)),
              { contentType: "application/octet-stream", upsert: false },
            ),
        );
        paths.push(path);
      }
      ok(
        await client
          .from("materials")
          .upsert(
            {
              id: entry.id,
              title: entry.title,
              filename: entry.filename,
              format: entry.format,
              category: sourceCategory(entry.filename),
              bytes: entry.bytes,
              sha256: entry.sha256,
              paths,
              mime_type: mime[entry.format] || "application/octet-stream",
            },
            { onConflict: "id" },
          ),
      );
      console.log(
        `Cargado de forma privada: ${entry.filename} (${paths.length} parte(s)).`,
      );
    } catch (error) {
      if (paths.length) await client.storage.from(config.bucket).remove(paths);
      throw error;
    }
  }
} finally {
  await client.auth.signOut();
}
console.log("Carga finalizada. Las versiones anteriores no han sido borradas.");
