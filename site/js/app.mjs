import { lessons, defaultSettings, categoryLabels } from "./course.mjs";
import {
  escapeHTML as e,
  videoProvider,
  validateRegistration,
  formatBytes,
  sourceCategory,
  localPreview,
  registrationReady,
  passwordSetupRequested,
} from "./core.mjs";
import {
  connectBackend,
  identity,
  unwrap,
  userMessage,
  downloadMaterial,
} from "./backend.mjs";
import { mountAdmin } from "./admin.mjs";

const $ = (selector) => document.querySelector(selector);
const state = {
  config: {},
  settings: { ...defaultSettings },
  client: null,
  catalog: [],
  videos: [],
  materials: [],
  user: null,
  enrolled: false,
  admin: false,
  authMode: "signup",
  preview: false,
  libraryPreview: false,
};
let toastTimer;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5500);
}
function notice(selector, text, error = false) {
  const node = $(selector);
  node.textContent = text;
  node.classList.toggle("error", error);
}
function openDialog(id) {
  const dialog = $(id);
  if (!dialog.open) dialog.showModal();
}
function closeDialog(id) {
  $(id).close();
}
function applySettings() {
  $("#course-dates").textContent = state.settings.course_dates || "Por definir";
  $("#course-place").textContent = state.settings.course_place || "Por definir";
}
function renderLessons(type = "teoria") {
  $("#lesson-grid").innerHTML = lessons
    .filter((l) => l.type === type)
    .map(
      (l) =>
        `<article class="lesson-card ${l.color}"><div class="card-top"><span class="lesson-number">0${l.number}</span><span class="duration">${l.hours} horas</span></div><p class="card-kicker">${type === "teoria" ? "LECCIÓN TEÓRICA · VIRTUAL" : "TALLER PRÁCTICO · PRESENCIAL"}</p><h3>${e(l.title)}</h3><p>${e(type === "teoria" ? l.objective : l.short)}</p><button class="card-link" data-lesson="${l.id}" aria-label="Ver ${e(l.title)}">Explorar ${type === "teoria" ? "lección" : "taller"} <span aria-hidden="true">↗</span></button></article>`,
    )
    .join("");
  $("#lesson-grid").setAttribute(
    "aria-labelledby",
    type === "teoria" ? "tab-teoria" : "tab-taller",
  );
}
function showLesson(id) {
  const l = lessons.find((item) => item.id === id);
  if (!l) return;
  $("#lesson-content").innerHTML =
    `<p class="eyebrow">${l.type === "teoria" ? "LECCIÓN TEÓRICA" : "TALLER PRÁCTICO"} 0${l.number} · ${l.hours} HORAS</p><h2>${e(l.title)}</h2><p>${e(l.objective)}</p><h3>Lo que trabajaremos</h3><ul>${l.topics.map((t) => `<li>${e(t)}</li>`).join("")}</ul>${l.agenda ? `<h3>Agenda de la lección</h3>${l.agenda.map(([time, title]) => `<div class="agenda-row"><strong>${time}</strong><span>${e(title)}</span></div>`).join("")}` : ""}${l.materials ? `<h3>Materiales de trabajo</h3><p>${e(l.materials)}</p>` : ""}<p class="source-note">Contenido basado en ${e(l.source)}</p><button class="button full" data-auth="signup">Inscribirme al curso completo ↗</button>`;
  openDialog("#lesson-dialog");
}
function renderVideos() {
  $("#video-grid").innerHTML = lessons
    .filter((l) => l.type === "teoria")
    .map((l) => {
      const videos = state.videos.filter(
        (v) => v.lesson_id === l.id && v.published && videoProvider(v.url),
      );
      return `<article class="video-card"><div class="video-thumbnail"><span class="video-index">ANTES DE LA LECCIÓN 0${l.number}</span><span class="play" aria-hidden="true">▷</span></div><div class="video-card-content"><h3>${e(l.short)}</h3>${videos.length ? videos.map((v) => `<a href="${e(v.url)}" target="_blank" rel="noopener noreferrer">${e(v.title)} <span aria-hidden="true">↗</span><p>${e(videoProvider(v.url))}</p></a>`).join("") : "<p>El administrador añadirá los videos de esta lección próximamente.</p>"}</div></article>`;
    })
    .join("");
}
function showPrivacy() {
  const s = state.settings;
  $("#privacy-content").innerHTML =
    `<p class="notice">${s.privacy_approved ? "Política aprobada por el responsable." : "Borrador pendiente de aprobación. Las inscripciones permanecen cerradas."}</p><p><strong>Finalidad:</strong> gestionar tu inscripción al curso gratuito ECO-VECINOS, verificar tu correo y darte acceso a los materiales.</p><p><strong>Datos:</strong> nombre y correo electrónico. La contraseña se gestiona en Supabase Auth; no se muestra al administrador.</p><p><strong>Responsable:</strong> ${e(s.privacy_controller || "Pendiente de definir antes de abrir inscripciones.")}</p><p><strong>Contacto para consultas y solicitudes sobre tus datos:</strong> ${e(s.privacy_contact || "Pendiente de definir.")}</p><p><strong>Dirección de contacto:</strong> ${e(s.privacy_address || "Pendiente")}</p><p><strong>Teléfono:</strong> ${e(s.privacy_phone || "Pendiente")}</p><p>El sitio utiliza una arquitectura estática para GitHub Pages. Supabase gestionará las cuentas, las inscripciones y los archivos privados. No utilizamos tu información para publicidad.</p><p>La sesión de acceso se conserva en este navegador hasta cerrarla; no compartas la sesión en equipos públicos. Las fuentes tipográficas se alojan en este mismo sitio, sin solicitudes a Google Fonts. Los videos solo se cargan al abrir sus enlaces en las plataformas externas.</p><p><strong>Tus derechos:</strong> conocer, actualizar y corregir tus datos; solicitar prueba de tu consentimiento y conocer su uso; pedir revocación o supresión cuando proceda. Puedes acudir a la Superintendencia de Industria y Comercio después de agotar el trámite ante el responsable. La eliminación de la cuenta puede terminar el acceso al aula.</p><p><strong>Conservación:</strong> ${e(s.privacy_retention || "Pendiente de confirmar por la organización.")}</p><p><strong>Procedimiento para solicitudes sobre tus datos:</strong> ${e(s.privacy_procedure || "Pendiente de confirmar por la organización.")}</p><p><a href="./privacidad.md" target="_blank" rel="noopener noreferrer">Leer la política completa de tratamiento de datos</a></p><p><small>Versión del aviso: ${e(s.privacy_version)}. ${registrationReady(state.config, s) ? "" : "Las inscripciones están deshabilitadas hasta completar la configuración y el aviso de privacidad."}</small></p>`;
  openDialog("#privacy-dialog");
}
function setAuthMode(mode) {
  state.authMode = mode;
  const signup = mode === "signup",
    reset = mode === "reset",
    recovery = mode === "recovery";
  $("#auth-title").innerHTML = signup
    ? "Un paso hacia<br>un hogar circular."
    : recovery
      ? "Elige una nueva<br>contraseña."
      : reset
        ? "Recupera tu<br>acceso al aula."
        : "Tu comunidad.<br>Tu aula.";
  $("#name-label").hidden = !signup;
  $("#auth-form").elements.name.required = signup;
  $("#password-label").hidden = reset;
  $("#auth-form").elements.password.required = !reset;
  $("#auth-form").elements.password.autocomplete = signup
    ? "new-password"
    : recovery
      ? "new-password"
      : "current-password";
  $("#auth-form").elements.password.minLength = signup || recovery ? 12 : 1;
  $("#auth-form").elements.email.parentElement.hidden = recovery;
  $("#auth-form").elements.email.required = !recovery;
  $("#consent-label").hidden = !signup;
  $("#auth-tabs").hidden = reset || recovery;
  $("#forgot-password").hidden = signup || reset || recovery;
  $("#auth-submit").textContent = signup
    ? "Crear mi cuenta gratuita ↗"
    : reset
      ? "Enviarme un enlace de recuperación"
      : recovery
        ? "Guardar nueva contraseña"
        : "Entrar a mi aula →";
  $('[data-auth-mode="signup"]').classList.toggle("active", signup);
  $('[data-auth-mode="login"]').classList.toggle("active", mode === "login");
  $("#password-help").textContent =
    signup || recovery ? "Mínimo 12 caracteres." : "";
  const ready =
    state.client &&
    (!signup || registrationReady(state.config, state.settings));
  $("#auth-submit").disabled = !ready;
  notice(
    "#auth-notice",
    !state.client
      ? "Vista previa: Supabase aún no está conectado. Este formulario no guarda ni envía datos."
      : signup && !ready
        ? "La organización todavía está completando el aviso de privacidad y la configuración de inscripción."
        : "",
  );
}
function showAuth(mode = "signup") {
  for (const id of ["#lesson-dialog", "#classroom-dialog", "#admin-dialog"])
    if ($(id).open) closeDialog(id);
  $("#auth-form").reset();
  setAuthMode(mode);
  openDialog("#auth-dialog");
}
async function refreshIdentity() {
  try {
    Object.assign(state, await identity(state.client));
  } catch {
    state.user = null;
    state.enrolled = false;
    state.admin = false;
  }
  $("#access-state").textContent = state.enrolled
    ? "Tu correo está verificado. Entra para consultar y descargar tus materiales."
    : "Inscríbete gratuitamente y verifica tu correo para acceder a los materiales.";
}
async function authSubmit(event) {
  event.preventDefault();
  if (!state.client) return;
  const form = event.currentTarget;
  const input = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    password: form.elements.password.value,
    consent: form.elements.consent.checked,
  };
  if (state.authMode === "signup") {
    if (!registrationReady(state.config, state.settings)) return;
    const error = validateRegistration(input);
    if (error) {
      notice("#auth-notice", error, true);
      return;
    }
  }
  const button = $("#auth-submit");
  button.disabled = true;
  const redirect = new URL("./", location.href).href;
  try {
    if (state.authMode === "signup") {
      unwrap(
        await state.client.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            emailRedirectTo: redirect,
            data: {
              full_name: input.name,
              consent_version: state.settings.privacy_version,
            },
          },
        }),
      );
      notice(
        "#auth-notice",
        "Si esta dirección puede registrarse, recibirás un correo de verificación. Abre su enlace para completar la inscripción y acceder al aula. Revisa también spam.",
      );
      form.elements.password.value = "";
    } else if (state.authMode === "login") {
      unwrap(
        await state.client.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        }),
      );
      await refreshIdentity();
      if (!state.enrolled && !state.admin)
        throw new Error(
          "Tu cuenta no tiene una inscripción activa. Contacta con la organización.",
        );
      closeDialog("#auth-dialog");
      await showClassroom(false);
      form.reset();
    } else if (state.authMode === "reset") {
      unwrap(
        await state.client.auth.resetPasswordForEmail(input.email, {
          redirectTo: redirect,
        }),
      );
      notice(
        "#auth-notice",
        "Si el correo tiene una cuenta, recibirás un enlace para restablecer tu contraseña.",
      );
    } else if (state.authMode === "recovery") {
      if (input.password.length < 12)
        throw new Error("La contraseña debe tener al menos 12 caracteres.");
      unwrap(await state.client.auth.updateUser({ password: input.password }));
      form.reset();
      closeDialog("#auth-dialog");
      toast("Contraseña actualizada.");
      await refreshIdentity();
    }
  } catch (error) {
    notice("#auth-notice", userMessage(error), true);
  } finally {
    button.disabled = false;
  }
}
function renderMaterials() {
  const needle = $("#resource-search").value.toLowerCase().trim();
  const category = $("#resource-category").value;
  const list = state.libraryPreview
    ? state.catalog.map((r) => ({ ...r, category: sourceCategory(r.filename) }))
    : state.materials;
  const rows = list.filter(
    (r) =>
      (!category || r.category === category) &&
      `${r.title} ${r.filename}`.toLowerCase().includes(needle),
  );
  $("#resource-list").innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<article class="resource-row"><span class="format-icon">${e(r.format)}</span><div><h3>${e(r.title)}</h3><p>${e(categoryLabels[r.category] || "Material")} · ${formatBytes(r.bytes)} · ${e(r.filename)}</p></div><button data-download="${e(r.id)}" ${state.libraryPreview ? "disabled" : ""}>${state.libraryPreview ? "Pendiente de carga" : "Descargar ↓"}</button></article>`,
        )
        .join("")
    : '<p class="empty-state">No hay materiales que coincidan. Si el catálogo está vacío, la organización aún no ha cargado los archivos.</p>';
}
async function showClassroom(preview = false) {
  if (preview && !state.preview) return;
  if (!preview) {
    await refreshIdentity();
    if (!state.enrolled && !state.admin) {
      showAuth("login");
      return;
    }
  }
  state.libraryPreview = preview;
  $("#resource-search").value = "";
  $("#resource-category").value = "";
  $("#aula-title").textContent = preview
    ? "Vista previa de la biblioteca"
    : "Mi biblioteca";
  $("#logout-button").hidden = preview;
  notice(
    "#aula-notice",
    preview
      ? "Vista de revisión, sin sesión ni acceso privado. Los 22 archivos originales están inventariados; las descargas se activarán después de cargarlos en Supabase."
      : "Cargando tus materiales privados…",
  );
  openDialog("#classroom-dialog");
  if (!preview)
    try {
      state.materials = unwrap(
        await state.client
          .from("materials")
          .select("*")
          .order("category")
          .order("title"),
      );
      notice(
        "#aula-notice",
        "Correo verificado. Solo los participantes inscritos pueden descargar estos archivos.",
      );
    } catch (error) {
      state.materials = [];
      notice("#aula-notice", userMessage(error), true);
    }
  renderMaterials();
}
async function download(id, button) {
  if (state.libraryPreview || !state.client) return;
  const material = state.materials.find((m) => m.id === id);
  if (!material) return;
  button.disabled = true;
  try {
    await downloadMaterial(state.client, state.config, material, (text) =>
      notice("#aula-notice", text),
    );
    notice("#aula-notice", "Descarga verificada y preparada para guardar.");
  } catch (error) {
    notice("#aula-notice", userMessage(error), true);
  } finally {
    button.disabled = false;
  }
}
async function showAdmin() {
  await refreshIdentity();
  if (!state.admin) {
    if (state.preview && !state.client) {
      openDialog("#admin-dialog");
      notice(
        "#admin-notice",
        "Vista previa: no hay sesión administrativa. Las funciones reales se habilitan después de configurar Supabase y asignar al administrador.",
      );
      await mountAdmin({
        state,
        preview: true,
        notice,
        applySettings,
        renderVideos,
      });
      return;
    }
    showAuth("login");
    toast("La administración requiere una cuenta autorizada.");
    return;
  }
  openDialog("#admin-dialog");
  notice(
    "#admin-notice",
    "Acceso administrativo verificado. Los cambios se guardan en Supabase.",
  );
  await mountAdmin({
    state,
    preview: false,
    notice,
    applySettings,
    renderVideos,
  });
}
function bindEvents() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-close")) button.closest("dialog").close();
    if (button.dataset.auth) showAuth(button.dataset.auth);
    if (button.dataset.lesson) showLesson(button.dataset.lesson);
    if (button.dataset.authMode) setAuthMode(button.dataset.authMode);
    if (button.dataset.download) download(button.dataset.download, button);
  });
  document.querySelectorAll("[data-type]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-type]").forEach((b) => {
        b.setAttribute("aria-selected", String(b === tab));
        b.tabIndex = b === tab ? 0 : -1;
      });
      renderLessons(tab.dataset.type);
    });
    tab.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = $(
          "#" + (tab.id === "tab-teoria" ? "tab-taller" : "tab-teoria"),
        );
        next.click();
        next.focus();
      }
    });
  });
  $("#auth-form").addEventListener("submit", authSubmit);
  $("#forgot-password").addEventListener("click", () => setAuthMode("reset"));
  $("#privacy-button").addEventListener("click", showPrivacy);
  $("#consent-privacy").addEventListener("click", showPrivacy);
  $("#enter-classroom").addEventListener("click", () => showClassroom(false));
  $("#preview-classroom").addEventListener("click", () => showClassroom(true));
  $("#admin-button").addEventListener("click", showAdmin);
  $("#resource-search").addEventListener("input", renderMaterials);
  $("#resource-category").addEventListener("change", renderMaterials);
  $("#logout-button").addEventListener("click", async () => {
    try {
      unwrap(await state.client.auth.signOut());
      closeDialog("#classroom-dialog");
      await refreshIdentity();
      state.materials = [];
      $("#resource-list").replaceChildren();
      toast("Sesión cerrada.");
    } catch (error) {
      notice("#aula-notice", userMessage(error), true);
    }
  });
  $("#menu-toggle").addEventListener("click", () => {
    const open = $("#main-nav").classList.toggle("open");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
  });
  $("#main-nav").addEventListener("click", (event) => {
    if (event.target.closest("a,button")) {
      $("#main-nav").classList.remove("open");
      $("#menu-toggle").setAttribute("aria-expanded", "false");
    }
  });
}
async function initialize() {
  const recoveryRequested = passwordSetupRequested(location.hash);
  renderLessons();
  renderVideos();
  applySettings();
  bindEvents();
  for (const [key, title] of Object.entries(categoryLabels)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = title;
    $("#resource-category").append(option);
  }
  try {
    const [configResponse, catalogResponse] = await Promise.all([
      fetch("./config.json"),
      fetch("./catalog.json"),
    ]);
    if (!configResponse.ok || !catalogResponse.ok)
      throw new Error("No se pudo cargar la configuración local.");
    state.config = await configResponse.json();
    state.catalog = await catalogResponse.json();
    state.preview = localPreview(state.config, location.hostname);
    $("#preview-banner").hidden = !state.preview;
    $("#preview-classroom").hidden = !state.preview;
    state.client = await connectBackend(state.config);
    if (state.client) {
      state.client.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY")
          setTimeout(() => showAuth("recovery"), 0);
        else if (["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED"].includes(event))
          setTimeout(refreshIdentity, 0);
      });
      const settings = unwrap(
        await state.client
          .from("course_settings")
          .select("*")
          .eq("id", 1)
          .single(),
      );
      state.settings = { ...defaultSettings, ...settings };
      state.videos = unwrap(
        await state.client
          .from("videos")
          .select("*")
          .eq("published", true)
          .order("position"),
      );
      applySettings();
      renderVideos();
      await refreshIdentity();
      if (recoveryRequested && state.user) showAuth("recovery");
    }
  } catch (error) {
    toast(userMessage(error));
  }
}
initialize();
