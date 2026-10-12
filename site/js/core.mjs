export function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function videoProvider(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port)
      return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (["youtube.com", "m.youtube.com", "youtu.be"].includes(host))
      return "YouTube";
    if (["instagram.com", "m.instagram.com"].includes(host)) return "Instagram";
    if (["facebook.com", "m.facebook.com", "fb.watch"].includes(host))
      return "Facebook";
    return null;
  } catch {
    return null;
  }
}
export function validateRegistration({ name, email, password, consent }) {
  if (!name || name.trim().length < 2 || name.trim().length > 100)
    return "Escribe tu nombre (entre 2 y 100 caracteres).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ""))
    return "Escribe un correo electrónico válido.";
  if (!password || password.length < 12 || password.length > 128)
    return "Utiliza una contraseña de 12 a 128 caracteres.";
  if (!consent)
    return "Debes leer y aceptar el aviso de privacidad para inscribirte.";
  return null;
}
export function formatBytes(bytes) {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}
export function safeFilename(name) {
  return String(name).replace(/[\\/\x00-\x1f]/g, "_");
}
export function isPDFMaterial(material) {
  return Boolean(material && material.format === "PDF" && /\.pdf$/i.test(material.filename || ""));
}
export function passwordSetupRequested(hash = "") {
  const type = new URLSearchParams(String(hash).replace(/^#/, "")).get("type");
  return type === "recovery" || type === "invite";
}
export function localPreview(config, hostname) {
  return (
    Boolean(config.localPreview) &&
    ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
  );
}
export function registrationReady(config, settings) {
  return Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    settings.privacy_controller &&
    settings.privacy_contact &&
    settings.privacy_address &&
    settings.privacy_phone &&
    settings.privacy_retention &&
    settings.privacy_procedure &&
    settings.registration_open &&
    settings.privacy_approved,
  );
}
export function sourceCategory(filename) {
  if (/Taller1|Taller 1|Ficha-Taller1/i.test(filename)) return "taller-1";
  if (/Taller 2/i.test(filename)) return "taller-2";
  if (/Taller3/i.test(filename)) return "taller-3";
  if (/Taller 4/i.test(filename)) return "taller-4";
  if (/Teorico/i.test(filename)) return "teoria";
  if (/Directorio|Mapa|RutaResiduos/i.test(filename)) return "rutas";
  if (/Encuesta/i.test(filename)) return "cierre";
  return "general";
}
