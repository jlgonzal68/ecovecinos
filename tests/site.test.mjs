import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  escapeHTML,
  videoProvider,
  validateRegistration,
  localPreview,
  registrationReady,
  sourceCategory,
} from "../site/js/core.mjs";
import { lessons, defaultSettings } from "../site/js/course.mjs";
import { createPreviewServer, publicPath } from "../scripts/serve.mjs";

test("Invitación y recuperación solicitan contraseña; otros enlaces no", async () => {
  const core = await import("../site/js/core.mjs");
  assert.equal(core.passwordSetupRequested?.("#type=invite"), true);
  assert.equal(core.passwordSetupRequested?.("#type=recovery"), true);
  for (const hash of ["", "#curso", "#type=signup", "#type=magiclink", "#type=other"])
    assert.equal(core.passwordSetupRequested(hash), false);
});

test("Ocho sesiones: 4×2 horas teóricas + 4×3 horas prácticas = 20", () => {
  assert.equal(lessons.length, 8);
  assert.equal(lessons.filter((l) => l.type === "teoria").length, 4);
  assert.equal(lessons.filter((l) => l.type === "taller").length, 4);
  assert.equal(
    lessons.reduce((sum, l) => sum + l.hours, 0),
    20,
  );
  for (const l of lessons) {
    assert.equal(l.hours, l.type === "teoria" ? 2 : 3);
    assert.ok(l.source.includes("ECO-VECINOS.pdf"));
    if (l.agenda)
      assert.equal(
        l.agenda.reduce((sum, [t]) => sum + parseInt(t), 0),
        120,
      );
  }
});
test("Las fuentes incluyen taller 1, 2, 3 y 4 y el mapa", () => {
  for (const l of lessons.filter((l) => l.type === "taller"))
    assert.ok(l.source.includes("Taller"));
  assert.ok(lessons[7].source.includes("Mapa de rutas"));
});
test("Escapar contenido externo evita inyección HTML", () => {
  assert.equal(
    escapeHTML("<script>\"&'</script>"),
    "&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;",
  );
});
test("Solo enlaces HTTPS de las tres plataformas autorizadas", () => {
  for (const url of [
    "https://youtube.com/watch?v=x",
    "https://youtu.be/x",
    "https://instagram.com/reel/x",
    "https://facebook.com/watch/x",
    "https://fb.watch/x",
  ])
    assert.ok(videoProvider(url));
  for (const url of [
    "javascript:alert(1)",
    "http://youtube.com/watch",
    "https://youtube.com.evil.test/x",
    "https://youtube.com@evil.test/x",
    "https://evil.test/youtube.com",
    "https://youtube.com:8080/x",
    "https://attacker@youtube.com/x",
    "not-a-url",
  ])
    assert.equal(videoProvider(url), null);
});
test("Registro exige nombre, correo, contraseña y consentimiento", () => {
  const input = {
    name: "Participante de prueba",
    email: "test@example.org",
    password: "contraseña-prueba-2026",
    consent: true,
  };
  assert.equal(validateRegistration(input), null);
  assert.ok(validateRegistration({ ...input, consent: false }));
  assert.ok(validateRegistration({ ...input, password: "corta" }));
  assert.ok(validateRegistration({ ...input, email: "invalido" }));
  assert.ok(validateRegistration({ ...input, name: "x" }));
});
test("La revisión del aula no puede habilitarse en GitHub Pages", () => {
  assert.equal(localPreview({ localPreview: true }, "127.0.0.1"), true);
  assert.equal(localPreview({ localPreview: true }, "localhost"), true);
  assert.equal(
    localPreview({ localPreview: true }, "jlgonzal68.github.io"),
    false,
  );
});
test("Registro permanece cerrado sin configuración real y aviso completo", () => {
  assert.equal(registrationReady({}, defaultSettings), false);
  const config = {
    supabaseUrl: "https://test.supabase.co",
    supabaseAnonKey: "public-key",
  };
  assert.equal(
    registrationReady(config, {
      ...defaultSettings,
      registration_open: true,
      privacy_controller: "Organización",
      privacy_contact: "Contacto",
      privacy_approved: false,
    }),
    false,
  );
  assert.equal(
    registrationReady(config, {
      ...defaultSettings,
      registration_open: true,
      privacy_controller: "Organización",
      privacy_contact: "Contacto",
      privacy_retention: "Criterio confirmado",
      privacy_procedure: "Procedimiento confirmado",
      privacy_approved: true,
    }),
    true,
  );
});
test("Catálogo incluye todos los 22 archivos y sus huellas, sin contenido", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../site/catalog.json", import.meta.url), "utf8"),
  );
  assert.equal(catalog.length, 22);
  assert.equal(
    catalog.reduce((sum, x) => sum + x.bytes, 0),
    65217839,
  );
  for (const x of catalog) {
    assert.match(x.sha256, /^[0-9a-f]{64}$/);
    assert.ok(!x.text);
    assert.ok(!x.content);
    assert.ok(sourceCategory(x.filename));
  }
  assert.equal(new Set(catalog.map((x) => x.id)).size, 22);
  const dir = await readdir(new URL("../site/", import.meta.url), {
    recursive: true,
  });
  assert.equal(dir.filter((n) => /\.(pdf|docx|pptx|mp4)$/i.test(n)).length, 0);
});
test("El servidor limita las rutas a site y bloquea traversal", () => {
  for (const p of [
    "/../ECO-VECINOS.pdf",
    "/%2e%2e/.work/sources/inventory.json",
    "/ecovecinos/../../.env",
    "/%2e%2e%5c.env",
  ])
    assert.equal(publicPath(p), null);
  assert.ok(publicPath("/ecovecinos/"));
  assert.ok(publicPath("/style.css"));
});
test("HTTP sirve raíz y ruta de proyecto, y no sirve originales", async () => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of [
      "/",
      "/ecovecinos/",
      "/js/app.mjs",
      "/ecovecinos/catalog.json",
    ])
      assert.equal((await fetch(origin + path)).status, 200);
    for (const path of [
      "/ECO-VECINOS.pdf",
      "/.work/sources/inventory.json",
      "/supabase/schema.sql",
      "/config.env",
    ])
      assert.equal((await fetch(origin + path)).status, 404);
    assert.equal((await fetch(origin + "/", { method: "POST" })).status, 405);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("La grabación de instructores queda excluida de la biblioteca", async () => {
  const rows = JSON.parse(
    await readFile(new URL("../site/catalog.json", import.meta.url), "utf8"),
  );
  assert.ok(
    rows.every(
      (x) => x.format !== "MP4" && !x.filename.includes("PresentacionTDG"),
    ),
  );
});

test("Política aprobada conserva cerrada la inscripción hasta activar servicios", () => {
  assert.equal(defaultSettings.privacy_controller, "Jose Gonzalez");
  assert.equal(
    defaultSettings.privacy_contact,
    "josegonzalezm@correo.itm.edu.co",
  );
  assert.equal(defaultSettings.privacy_approved, true);
  assert.equal(
    registrationReady(
      { supabaseUrl: "https://test.supabase.co", supabaseAnonKey: "public" },
      { ...defaultSettings, registration_open: false },
    ),
    false,
  );
});

test("Registro exige dirección y teléfono de contacto", () => {
  const c = {
    supabaseUrl: "https://test.supabase.co",
    supabaseAnonKey: "public",
  };
  const settings = { ...defaultSettings, registration_open: true };
  assert.equal(registrationReady(c, settings), true);
  assert.equal(
    registrationReady(c, { ...settings, privacy_address: "" }),
    false,
  );
  assert.equal(registrationReady(c, { ...settings, privacy_phone: "" }), false);
});
