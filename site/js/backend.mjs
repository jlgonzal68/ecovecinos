import { safeFilename, isPDFMaterial } from "./core.mjs";

export async function connectBackend(config) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
  const { createClient } = await import("../vendor/supabase.mjs");
  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
      storageKey: "ecovecinos-auth",
    },
  });
  return client;
}
export function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}
export function userMessage(error) {
  const text = String(error?.message || error || "");
  if (/Invalid login credentials/i.test(text))
    return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(text))
    return "Verifica tu correo antes de entrar. Revisa también la carpeta de spam.";
  if (/rate limit|too many|over_email_send_rate_limit/i.test(text))
    return "Se alcanzó el límite temporal de correos. Inténtalo más tarde.";
  if (/Email address not authorized/i.test(text))
    return "El envío de correos aún está limitado a pruebas. Contacta con la organización.";
  if (/row-level security|permission denied|JWT|not enrolled/i.test(text))
    return "Tu sesión no permite esta acción. Entra con una cuenta inscrita y correo verificado.";
  if (/Failed to fetch|NetworkError|fetch failed/i.test(text))
    return "No se pudo conectar con el servicio. Revisa tu conexión e inténtalo otra vez.";
  return text || "No fue posible completar esta acción.";
}
export async function identity(client) {
  if (!client) return { user: null, enrolled: false, admin: false };
  const user = unwrap(await client.auth.getUser())?.user;
  if (!user || !user.email_confirmed_at)
    return { user: null, enrolled: false, admin: false };
  const admin = Boolean(unwrap(await client.rpc("is_admin")));
  const enrollment = unwrap(
    await client
      .from("enrollments")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  return { user, enrolled: Boolean(enrollment), admin };
}
export async function downloadMaterial(client, config, material, progress) {
  if (!isPDFMaterial(material)) throw new Error("El aula solo permite descargar materiales PDF.");
  if (!material.paths?.length)
    throw new Error("Este material todavía no se ha cargado.");
  const parts = [];
  for (let i = 0; i < material.paths.length; i++) {
    progress?.(`Descargando parte ${i + 1} de ${material.paths.length}…`);
    const signed = unwrap(
      await client.storage
        .from(config.bucket)
        .createSignedUrl(material.paths[i], 120),
    );
    const response = await fetch(signed.signedUrl, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok)
      throw new Error(
        "No se pudo descargar el archivo privado. Vuelve a iniciar sesión.",
      );
    parts.push(await response.blob());
  }
  const blob = new Blob(parts, {
    type: material.mime_type || "application/octet-stream",
  });
  if (blob.size !== material.bytes)
    throw new Error("La descarga está incompleta. Inténtalo de nuevo.");
  if (material.sha256 && crypto.subtle) {
    progress?.("Verificando la integridad del material…");
    const hash = [
      ...new Uint8Array(
        await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
      ),
    ]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    if (hash !== material.sha256)
      throw new Error(
        "La integridad del archivo no coincide con el original. No se guardó la descarga.",
      );
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename(material.filename);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function uploadMaterial(
  client,
  config,
  file,
  entry,
  category,
  progress,
) {
  if (!isPDFMaterial(entry) || !/\.pdf$/i.test(file?.name || ""))
    throw new Error("Solo se permite cargar el material original en formato PDF.");
  const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw new Error("El archivo no contiene una cabecera PDF válida.");
  const maximum = 40 * 1024 * 1024;
  const folder = `${entry.id}/${crypto.randomUUID()}`;
  const paths = [];
  const sha256 = [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  const count = Math.ceil(file.size / maximum);
  try {
    for (let i = 0; i < count; i++) {
      const path = `${folder}/${i.toString().padStart(3, "0")}-${entry.slug}`;
      progress?.(`Cargando parte ${i + 1} de ${count}…`);
      unwrap(
        await client.storage
          .from(config.bucket)
          .upload(path, file.slice(i * maximum, (i + 1) * maximum), {
            contentType: "application/octet-stream",
            upsert: false,
          }),
      );
      paths.push(path);
    }
    const row = {
      id: entry.id,
      title: entry.title,
      filename: file.name,
      format: entry.format,
      category,
      bytes: file.size,
      sha256,
      paths,
      mime_type: "application/pdf",
    };
    unwrap(await client.from("materials").upsert(row, { onConflict: "id" }));
    return row;
  } catch (error) {
    if (paths.length) await client.storage.from(config.bucket).remove(paths);
    throw error;
  }
}
