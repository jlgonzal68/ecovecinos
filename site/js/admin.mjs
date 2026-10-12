import { lessons } from "./course.mjs";
import {
  escapeHTML as e,
  videoProvider,
  sourceCategory,
  formatBytes,
  isPDFMaterial,
} from "./core.mjs";
import { unwrap, userMessage, uploadMaterial } from "./backend.mjs";

export async function mountAdmin({
  state,
  preview,
  notice,
  applySettings,
  renderVideos,
}) {
  const root = document.querySelector("#admin-content");
  const s = state.settings;
  if (!preview) {
    try {
      state.videos = unwrap(
        await state.client.from("videos").select("*").order("position"),
      );
    } catch (error) {
      notice("#admin-notice", userMessage(error), true);
      return;
    }
  }
  const disabled = preview ? "disabled" : "";
  root.innerHTML = `<div class="admin-grid"><section class="admin-block"><h3>Información del curso</h3><form id="settings-form"><label>Fechas del curso<input name="course_dates" value="${e(s.course_dates)}" placeholder="Por definir" maxlength="300" ${disabled}></label><label>Lugar de los talleres<input name="course_place" value="${e(s.course_place)}" placeholder="Por definir" maxlength="300" ${disabled}></label><label>Responsable del tratamiento de datos<input name="privacy_controller" value="${e(s.privacy_controller)}" maxlength="200" ${disabled}></label><label>Contacto para solicitudes de privacidad<input name="privacy_contact" value="${e(s.privacy_contact)}" maxlength="200" ${disabled}></label><label>Dirección de contacto<input name="privacy_address" value="${e(s.privacy_address)}" maxlength="500" ${disabled}></label><label>Teléfono<input name="privacy_phone" value="${e(s.privacy_phone)}" maxlength="100" ${disabled}></label><label>Plazo o criterio de conservación de datos<input name="privacy_retention" value="${e(s.privacy_retention)}" maxlength="500" ${disabled}></label><label>Procedimiento para atender solicitudes de privacidad<input name="privacy_procedure" value="${e(s.privacy_procedure)}" maxlength="1000" ${disabled}></label><label class="checkbox-label"><input name="privacy_approved" type="checkbox" ${s.privacy_approved ? "checked" : ""} ${disabled}><span>El responsable ha aprobado la política y sus datos completos</span></label><label class="checkbox-label"><input name="registration_open" type="checkbox" ${s.registration_open ? "checked" : ""} ${disabled}><span>Abrir inscripción (solo tras configurar correo y privacidad)</span></label><button class="button full" ${disabled}>Guardar información</button></form></section><section class="admin-block"><h3>Video previo a una lección</h3><form id="video-form"><input type="hidden" name="id"><label>Lección<select name="lesson_id" ${disabled}>${lessons
    .filter((l) => l.type === "teoria")
    .map((l) => `<option value="${l.id}">0${l.number} · ${e(l.title)}</option>`)
    .join(
      "",
    )}</select></label><label>Título del recurso<input name="title" required maxlength="150" ${disabled}></label><label>Enlace de YouTube, Instagram o Facebook<input name="url" type="url" required placeholder="https://…" maxlength="2048" ${disabled}></label><label>Orden de aparición<input name="position" type="number" min="0" max="999" value="0" ${disabled}></label><label class="checkbox-label"><input name="published" type="checkbox" checked ${disabled}><span>Mostrar el enlace en la web pública</span></label><button class="button full" ${disabled}>Guardar video</button><button type="button" id="cancel-video-edit" class="quiet-button" hidden>Cancelar edición</button></form><div id="admin-video-list"></div></section></div><section class="admin-block"><h3>Materiales privados</h3><p>Selecciona una versión PDF del inventario original. Los archivos grandes se dividen en partes privadas de 40 MiB y se reconstruyen al descargarlos.</p><form id="upload-form"><label>Material del inventario<select name="entry" ${disabled}>${state.catalog.filter(isPDFMaterial).map((r) => `<option value="${e(r.id)}">${e(r.filename)} · ${formatBytes(r.bytes)}</option>`).join("")}</select></label><label>Archivo original<input name="file" type="file" accept=".pdf,application/pdf" required ${disabled}></label><button class="button" ${disabled}>Cargar a almacenamiento privado ↗</button></form><p class="section-note">Se comprueban nombre y extensión. La aplicación calcula SHA-256 para verificar las descargas. Las cargas anteriores no se borran al actualizar un material.</p></section>`;
  const list = document.querySelector("#admin-video-list");
  function listVideos() {
    list.innerHTML = state.videos.length
      ? state.videos
          .map(
            (v) =>
              `<div class="admin-list-row"><div><p><strong>${e(v.title)}</strong></p><small>${e(v.lesson_id)} · ${v.published ? "Visible" : "Oculto"} · ${e(videoProvider(v.url) || "Enlace inválido")}</small></div><button data-edit-video="${e(v.id)}" ${disabled}>Editar</button></div>`,
          )
          .join("")
      : '<p class="section-note">Aún no hay videos. No se han añadido enlaces de ejemplo.</p>';
  }
  listVideos();
  if (preview) return;
  document
    .querySelector("#settings-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const f = event.currentTarget;
      const button = f.querySelector("button");
      button.disabled = true;
      try {
        const row = {
          course_dates: f.elements.course_dates.value.trim(),
          course_place: f.elements.course_place.value.trim(),
          privacy_controller: f.elements.privacy_controller.value.trim(),
          privacy_contact: f.elements.privacy_contact.value.trim(),
          privacy_address: f.elements.privacy_address.value.trim(),
          privacy_phone: f.elements.privacy_phone.value.trim(),
          privacy_retention: f.elements.privacy_retention.value.trim(),
          privacy_procedure: f.elements.privacy_procedure.value.trim(),
          registration_open: f.elements.registration_open.checked,
          privacy_approved: f.elements.privacy_approved.checked,
        };
        if (
          row.registration_open &&
          (!row.privacy_approved ||
            !row.privacy_controller ||
            !row.privacy_contact ||
            !row.privacy_address ||
            !row.privacy_phone ||
            !row.privacy_retention ||
            !row.privacy_procedure)
        )
          throw new Error(
            "Aprueba la política y completa responsable, contacto, conservación y procedimiento de privacidad antes de abrir inscripciones.",
          );
        unwrap(
          await state.client.from("course_settings").update(row).eq("id", 1),
        );
        state.settings = { ...state.settings, ...row };
        applySettings();
        notice("#admin-notice", "Información guardada.");
      } catch (error) {
        notice("#admin-notice", userMessage(error), true);
      } finally {
        button.disabled = false;
      }
    });
  const videoForm = document.querySelector("#video-form");
  function resetVideo() {
    videoForm.reset();
    videoForm.elements.id.value = "";
    document.querySelector("#cancel-video-edit").hidden = true;
  }
  list.addEventListener("click", (event) => {
    const target = event.target.closest("[data-edit-video]");
    if (!target) return;
    const v = state.videos.find((x) => x.id === target.dataset.editVideo);
    if (!v) return;
    for (const key of ["id", "lesson_id", "title", "url", "position"])
      videoForm.elements[key].value = v[key];
    videoForm.elements.published.checked = v.published;
    document.querySelector("#cancel-video-edit").hidden = false;
    videoForm.elements.title.focus();
  });
  document
    .querySelector("#cancel-video-edit")
    .addEventListener("click", resetVideo);
  videoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = event.currentTarget;
    const button = f.querySelector("button");
    button.disabled = true;
    try {
      const url = f.elements.url.value.trim();
      if (!videoProvider(url))
        throw new Error(
          "Usa un enlace HTTPS válido de YouTube, Instagram o Facebook.",
        );
      const row = {
        lesson_id: f.elements.lesson_id.value,
        title: f.elements.title.value.trim(),
        url,
        position: Number(f.elements.position.value),
        published: f.elements.published.checked,
      };
      if (f.elements.id.value)
        unwrap(
          await state.client
            .from("videos")
            .update(row)
            .eq("id", f.elements.id.value),
        );
      else unwrap(await state.client.from("videos").insert(row));
      state.videos = unwrap(
        await state.client.from("videos").select("*").order("position"),
      );
      listVideos();
      renderVideos();
      resetVideo();
      notice("#admin-notice", "Enlace guardado.");
    } catch (error) {
      notice("#admin-notice", userMessage(error), true);
    } finally {
      button.disabled = false;
    }
  });
  document
    .querySelector("#upload-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const f = event.currentTarget;
      const button = f.querySelector("button");
      const entry = state.catalog.find((r) => r.id === f.elements.entry.value);
      const file = f.elements.file.files[0];
      if (!entry || !file) return;
      if (!isPDFMaterial(entry)) { notice("#admin-notice", "Solo se admiten materiales PDF.", true); return; }
      if (file.name !== entry.filename) {
        notice(
          "#admin-notice",
          "Selecciona el archivo original que corresponde al material elegido.",
          true,
        );
        return;
      }
      button.disabled = true;
      try {
        await uploadMaterial(
          state.client,
          state.config,
          file,
          entry,
          sourceCategory(entry.filename),
          (text) => notice("#admin-notice", text),
        );
        notice("#admin-notice", `${file.name} cargado de forma privada.`);
        f.elements.file.value = "";
      } catch (error) {
        notice("#admin-notice", userMessage(error), true);
      } finally {
        button.disabled = false;
      }
    });
}
