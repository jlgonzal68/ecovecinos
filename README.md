# ECO-VECINOS · De residuo a recurso

[**Visitar el sitio publicado**](https://jlgonzal68.github.io/ecovecinos/)

Sitio del curso gratuito de gestión de residuos de la Urbanización Altamira, basado en `ECO-VECINOS.pdf` y los materiales suministrados: **4 lecciones teóricas de 2 horas y 4 talleres prácticos de 3 horas**, 20 horas en total. Las fechas, el lugar y los videos permanecen por completar; no se presentan datos ficticios.

## Estado comprobado — 12 de octubre de 2026

- Diseño revisado y aprobado por el propietario, con **Source Sans Pro** para el cuerpo y **Montserrat** para títulos; fuentes alojadas localmente.
- Logo horizontal azul ITM en la esquina superior izquierda, sin deformación.
- Proyecto real de Supabase conectado, seis tablas con RLS y almacenamiento privado.
- **22 materiales** cargados, con catálogo y tamaños comprobados. La reunión interna de instructores queda excluida del aula y del repositorio.
- Gmail SMTP configurado con el remitente `jlgonzal68@gmail.com`. El propietario confirmó recepción y completó el acceso por correo; la contraseña de aplicación está únicamente en Supabase.
- Cuenta administrativa verificada y rol asignado a `josegonzalezm@correo.itm.edu.co`; panel real disponible. Se probó una descarga privada con verificación de tamaño y SHA-256.
- Política de privacidad y contactos aprobados. **Las inscripciones generales permanecen cerradas** hasta completar las comprobaciones de publicación y del flujo de participante.
- Despliegue de GitHub Pages mediante una acción **manual**, no al subir código.
- Primera publicación completada con HTTPS mediante GitHub Actions. La publicación contiene solo `site/`; los materiales no se copian a GitHub Pages.

Las pruebas de administrador no sustituyen la prueba completa de una inscripción nueva de participante en producción.

## Ejecutar y comprobar

Requiere Node.js 20 o superior:

```sh
npm ci
npm run build
npm test
npm start
```

Abrir `http://127.0.0.1:4321/ecovecinos/`. El servidor sirve exclusivamente `site/`, nunca originales ni archivos de trabajo. Las pruebas PostgreSQL usan PGlite en memoria y no alteran Supabase. El cliente oficial se empaqueta en `site/vendor/supabase.mjs`; no se carga desde un CDN.

La revisión visual se ejecuta con `npm run test:ui` y utiliza Microsoft Edge local (`channel: msedge`). Intercepta la configuración para permanecer desconectada del backend real. En otros equipos puede instalarse ese navegador o adaptarse explícitamente la opción de Chromium. `npm run check:materials` verifica los originales disponibles en la ruta local del propietario sin escribir en Supabase; no funcionará en un clon que no contenga esos originales.

## Backend y seguridad

`supabase/schema.sql` sirve para instalar **una sola vez en un proyecto nuevo y vacío**. No volver a ejecutarlo sobre el proyecto del curso ya aprovisionado. Define perfiles, inscripciones, administradores, videos, configuración y catálogo; usa RLS y un bucket privado `ecovecinos-materiales`.

La inscripción se genera en servidor al verificar el correo, siempre que el alta se haya realizado con inscripción abierta, nombre válido y consentimiento de la versión vigente. Las cuentas sin inscripción o rol administrativo no pueden descargar materiales. El rol administrativo no se puede autoasignar desde la web; `supabase/assign-admin.sql` exige una cuenta verificada y el correo elegido por el propietario.

`site/config.json` contiene únicamente la URL del proyecto y una **clave publicable**, además del nombre del bucket y las rutas de la web. No incluir claves `service_role`, claves secretas, contraseñas SMTP, contraseñas de cuenta ni tokens de administración. La clave publicable no sustituye RLS.

Gmail SMTP utiliza `smtp.gmail.com`, puerto 465 y una contraseña de aplicación ingresada personalmente por el propietario. Se mantiene activada la confirmación de correo y el intervalo mínimo de 60 segundos por usuario. Gmail tiene límites compartidos con el uso normal del buzón; no es un servicio de envío ilimitado. Ver `supabase/email-templates.md`. Las plantillas HTML de ese archivo están listas para aplicar; no se afirma que ya hayan sustituido las plantillas reales de Supabase.

La URL prevista de producción es `https://jlgonzal68.github.io/ecovecinos/`. Durante las pruebas se autorizó también el retorno exacto `http://127.0.0.1:4321/ecovecinos/`, sin comodines. Retirarlo de Auth cuando deje de necesitarse. La revisión de biblioteca solo se habilita en localhost; no da descargas privadas y no aparece en GitHub Pages.

## Administración y materiales

El panel permite completar fechas y lugar, gestionar la apertura de inscripción, añadir enlaces de YouTube, Instagram o Facebook previos a cada lección teórica, y cargar materiales privados. No se han inventado videos, fechas ni contactos docentes.

Los 22 materiales suman **65.217.839 bytes**. Puede usarse el panel o `scripts/upload-materials.mjs` para cargas autorizadas. Se compara SHA-256 al descargar. Una nueva carga no borra versiones anteriores; cualquier limpieza requiere decisión del administrador. La grabación `02.10.2026_PresentacionTDG_REC.mp4` es una reunión interna de instructores y permanece fuera del aula, del almacenamiento docente y de todos los catálogos públicos.

## GitHub Pages

El repositorio público autorizado es [jlgonzal68/ecovecinos](https://github.com/jlgonzal68/ecovecinos). Subir solo el código, el logo y las fuentes con sus licencias. `.gitignore` excluye originales, `.work/`, `outputs/`, `node_modules/`, archivos de entorno y credenciales.

Configurar Pages para **GitHub Actions** y ejecutar manualmente `.github/workflows/pages.yml` después de autorizar la publicación. El despliegue sube exclusivamente `site/`. Verificar después HTTPS, rutas, tipografía, logo, lectura de configuración y denegación anónima de los materiales. Mantener inscripción cerrada hasta comprobar el flujo de participante con una cuenta y consentimiento reales.

## Privacidad y límites

Responsable y contacto aprobados: **Jose Gonzalez**, `josegonzalezm@correo.itm.edu.co`. Dirección: Calle 73 # 76A - 354, Bloque i, Piso 2, Departamento de Ciencias Ambientales y de la Construcción. Teléfono: 6044405100 ext 5807. Política completa en `site/privacidad.md`.

Se conservan cuentas no verificadas hasta 30 días y cuentas verificadas durante el curso y hasta 12 meses tras su última sesión, con las excepciones legales documentadas de la política. La revisión es manual mensual; **no se ha configurado borrado automático**. Consultas y reclamos se atienden conforme a los plazos aprobados de la Ley 1581 de 2012. `privacy_approved=true`; `registration_open=false` mientras se completan pruebas.

Los planes gratuitos de los proveedores tienen cuotas y restricciones de disponibilidad. No se contrató un plan de pago ni se ofrece garantía de disponibilidad por usar un alojamiento gratuito. Documentación: [Supabase Pricing](https://supabase.com/pricing), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Storage y RLS](https://supabase.com/docs/guides/storage/security/access-control), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Fidelidad a los originales

Los PDF y documentos complementarios se leyeron y se inventariaron con SHA-256; no se incluyen en el repositorio público. Se conservaron los originales sin corregirlos silenciosamente. El material teórico contiene una discrepancia química respecto al taller 4; la web utiliza la advertencia común **no mezclar limpiadores** sin reproducir aquella explicación. El cronograma detallado del taller 3 suma 200 minutos, aunque el programa y el requerimiento fijan 3 horas: se mantiene la duración de 3 horas sin fabricar un cronograma alternativo. Directorio y mapa incluyen ejemplos y casillas pendientes que no se presentan como rutas o puntos reales.
