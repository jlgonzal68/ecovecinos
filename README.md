# ECO-VECINOS · De residuo a recurso

[**Visitar el sitio publicado**](https://jlgonzal68.github.io/ecovecinos/) · [Código en GitHub](https://github.com/jlgonzal68/ecovecinos)

Curso gratuito de gestión de residuos de la Urbanización Altamira, basado en `ECO-VECINOS.pdf` y los materiales suministrados: **4 lecciones teóricas de 2 horas y 4 talleres prácticos de 3 horas**, 20 horas en total. Fechas, lugar y videos permanecen por completar; no se presentan datos ficticios.

## Estado comprobado — 12 de octubre de 2026

- Diseño aprobado: **Source Sans Pro** para el cuerpo y **Montserrat** Medium, SemiBold y Bold para títulos; fuentes y licencias alojadas localmente.
- Logo horizontal azul ITM en la esquina superior izquierda, sin deformación.
- Sitio publicado con HTTPS mediante **GitHub Actions manual**. El despliegue contiene únicamente `site/`.
- Supabase real conectado: seis tablas con RLS y almacenamiento privado, con **22 materiales** y tamaños comprobados. La reunión de instructores queda excluida.
- Gmail SMTP con remitente `jlgonzal68@gmail.com`; contraseña de aplicación ingresada personalmente en Supabase, nunca incluida en archivos.
- Administrador verificado: `josegonzalezm@correo.itm.edu.co`. Panel real y descarga privada con tamaño y SHA-256 comprobados.
- **Inscripción habilitada**, con consentimiento y confirmación de correo obligatorios. Se completó una inscripción real de participante: acceso automático a los 22 materiales y descarga DOCX con integridad comprobada. Esa cuenta no abrió el panel administrativo.
- Mínimo de contraseña de **12 caracteres**, tanto en el formulario como en el servidor.

## Ejecutar y comprobar

Requiere Node.js 20 o superior:

```sh
npm ci
npm run build
npm test
npm start
```

Abrir `http://127.0.0.1:4321/ecovecinos/`. El servidor sirve exclusivamente `site/`, nunca originales ni archivos de trabajo. Las pruebas PostgreSQL usan PGlite en memoria y no alteran Supabase. El cliente oficial se empaqueta en `site/vendor/supabase.mjs`, sin CDN.

`npm run test:ui` utiliza Microsoft Edge local (`channel: msedge`) e intercepta la configuración para quedar desconectado de producción. En otro equipo puede instalarse ese navegador o adaptarse explícitamente Chromium. `npm run check:materials` verifica los originales en la ruta del propietario sin escribir en Supabase; no funciona en un clon sin esos originales.

## Backend y seguridad

`supabase/schema.sql` instala **una sola vez en un proyecto nuevo y vacío**. No volver a ejecutarlo en el proyecto del curso ya aprovisionado. Define perfiles, inscripciones, administradores, videos, configuración y catálogo, con RLS y bucket privado `ecovecinos-materiales`.

La inscripción se genera en servidor al verificar correo, si el alta se realizó con inscripción abierta, nombre válido y consentimiento de la versión vigente. Sin inscripción o rol administrativo no se descargan materiales. El administrador no se autoasigna desde la web; `supabase/assign-admin.sql` exige cuenta verificada y el correo autorizado.

`site/config.json` contiene solo URL del proyecto, **clave publicable**, bucket y rutas. No incluir `service_role`, claves secretas, contraseñas SMTP, contraseñas de cuentas ni tokens administrativos. La clave publicable no sustituye RLS.

Gmail SMTP usa `smtp.gmail.com`, puerto 465, contraseña de aplicación e intervalo mínimo de 60 segundos por usuario. Se mantiene confirmación de correo y se deshabilitan sesiones anónimas. Gmail y Supabase tienen límites de envío; no son ilimitados. Las plantillas de `supabase/email-templates.md` están listas para aplicar; no se afirma que hayan sustituido las plantillas actuales de Supabase.

La Site URL y el retorno autorizado son `https://jlgonzal68.github.io/ecovecinos/`. Tras las pruebas se retiró de Auth el retorno temporal `http://127.0.0.1:4321/ecovecinos/`. La vista local sigue sirviendo para desarrollar, pero los correos vuelven a producción mientras no se autorice otro retorno. La revisión desconectada de biblioteca solo se habilita en localhost y nunca da descargas privadas.

## Administración y materiales

En la web pública, pulsar **Administración** al pie e iniciar sesión con `josegonzalezm@correo.itm.edu.co` y la contraseña del aula, no la de Google ni la SMTP. Si se está usando una cuenta de participante, cambiar de cuenta para administrar.

El panel permite completar fechas y lugar, abrir o cerrar inscripción, añadir enlaces de YouTube, Instagram o Facebook previos a cada lección teórica y cargar materiales privados. No se han inventado videos, fechas ni contactos docentes.

Los 22 materiales suman **65.217.839 bytes**. Pueden cargarse desde el panel o `scripts/upload-materials.mjs`. Al descargar se comprueba SHA-256. Nuevas cargas no borran versiones anteriores; cualquier limpieza requiere decisión del administrador. `02.10.2026_PresentacionTDG_REC.mp4` es una reunión interna de instructores, fuera del aula, almacenamiento docente y catálogos públicos.

## GitHub Pages

Repositorio: [jlgonzal68/ecovecinos](https://github.com/jlgonzal68/ecovecinos). Publicar solo código, logo y fuentes con sus licencias. `.gitignore` excluye originales, `.work/`, `outputs/`, `node_modules/`, archivos de entorno y credenciales.

Pages está configurado para **GitHub Actions**. Para actualizar la web, comprobar los cambios y ejecutar manualmente `.github/workflows/pages.yml`. Subir código no lo despliega automáticamente. Se verificaron HTTPS, recursos, tipografía, logo, seis tamaños de pantalla, bloqueo anónimo de materiales y el flujo real de participante.

## Privacidad y límites

Responsable: **Jose Gonzalez**, `josegonzalezm@correo.itm.edu.co`. Domicilio: Calle 73 # 76A - 354, Bloque i, Piso 2, Departamento de Ciencias Ambientales y de la Construcción. Teléfono: 6044405100 ext 5807. Política en `site/privacidad.md`.

Cuentas no verificadas: hasta 30 días. Cuentas verificadas: durante el curso y hasta 12 meses tras su última sesión, con las excepciones documentadas. La revisión es mensual y manual; **no se configuró borrado automático**. Consultas y reclamos según los plazos aprobados de la Ley 1581 de 2012. Estado de entrega: `privacy_approved=true`, `registration_open=true`; el administrador puede cambiar la apertura.

No se contrataron planes de pago ni se garantiza disponibilidad continua de planes gratuitos. Documentación: [Supabase Pricing](https://supabase.com/pricing), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Storage y RLS](https://supabase.com/docs/guides/storage/security/access-control), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Fidelidad a los originales

PDF y documentos complementarios leídos e inventariados con SHA-256, nunca incluidos en el repositorio público. Los originales no se corrigieron silenciosamente. La web conserva la advertencia común **no mezclar limpiadores**, sin reproducir una discrepancia química entre teoría y taller 4. El cronograma detallado del taller 3 suma 200 minutos aunque programa y encargo fijan 3 horas: se mantienen 3 horas sin inventar otra distribución. Directorio y mapa contienen ejemplos y campos pendientes, no contactos ni rutas comprobados.
