# Correos de autenticación de ECO-VECINOS

Configurar un SMTP propio en Supabase Authentication antes de abrir inscripciones. El SMTP predeterminado restringe destinatarios a miembros del equipo y limita el envío; no sirve para inscribir al público. Verificar el remitente con su proveedor y configurar SPF/DKIM/DMARC cuando corresponda. Las credenciales SMTP se ingresan en Supabase, nunca en la web ni en GitHub.

## Confirmación de inscripción

Asunto: Confirma tu correo para ECO-VECINOS

```html
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Confirma tu correo</title></head>
<body style="font-family:Arial,sans-serif;color:#162d25;line-height:1.6">
<h1 style="font-size:24px">Confirma tu correo</h1>
<p>Se solicitó una cuenta para acceder al curso gratuito ECO-VECINOS con esta dirección.</p>
<p><a href="{{ .ConfirmationURL }}">Verificar mi correo y completar la inscripción</a></p>
<p>Si no solicitaste esta cuenta, ignora este mensaje.</p>
</body></html>
```

## Recuperación de contraseña

Asunto: Restablece tu contraseña de ECO-VECINOS

```html
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Restablece tu contraseña</title></head>
<body style="font-family:Arial,sans-serif;color:#162d25;line-height:1.6">
<h1 style="font-size:24px">Restablece tu contraseña</h1>
<p>Se solicitó restablecer la contraseña de tu cuenta ECO-VECINOS.</p>
<p><a href="{{ .ConfirmationURL }}">Elegir una nueva contraseña</a></p>
<p>Si no solicitaste este cambio, ignora este mensaje.</p>
</body></html>
```

Configurar Site URL y Redirect URLs con la URL final de GitHub Pages, incluida la carpeta `/ecovecinos/`. Durante pruebas locales autorizar únicamente la URL local que se esté usando; no dejar comodines globales. Mantener activada la confirmación de correo y establecer mínimo 12 caracteres para contraseña. Configurar CAPTCHA si la organización dispone de un proveedor; no desactivar la confirmación para solucionar límites de correo.

Fuentes: [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [autenticación por contraseña](https://supabase.com/docs/guides/auth/passwords).

## Decisión del propietario

Remitente elegido: ECO-VECINOS <jlgonzal68@gmail.com>. Correo administrativo y contacto de privacidad: josegonzalezm@correo.itm.edu.co. El propietario eligió Gmail SMTP y guardó personalmente la contraseña de aplicación en Supabase. Se comprobó por recarga que el SMTP está habilitado, con `smtp.gmail.com`, puerto `465`, usuario `jlgonzal68@gmail.com` e intervalo mínimo de 60 segundos por usuario. Nunca usar ni publicar la contraseña principal ni copiar la contraseña de aplicación al repositorio.

Supabase creó una cuenta invitada para el administrador designado y aceptó una petición de recuperación con retorno a `http://127.0.0.1:4321/ecovecinos/`, añadida como URL exacta permitida para la prueba. La URL prevista de producción sigue siendo `https://jlgonzal68.github.io/ecovecinos/`. No se añadieron comodines. La aceptación de las solicitudes no prueba la recepción del mensaje ni el funcionamiento completo del acceso: esos pasos requieren comprobación con el propietario.

La primera invitación utiliza la URL prevista de producción, que aún no se ha publicado. Para esta prueba, usar el **último correo de recuperación**, que solicita el retorno local. Después de publicar, retirar el retorno local si deja de necesitarse. Las inscripciones permanecen cerradas mientras se comprueban recepción, verificación, contraseña, rol administrativo y descarga autenticada. Los textos HTML anteriores son plantillas listas para aplicar; no se afirma que hayan sustituido las plantillas reales del panel.

No se utilizará SMTP2GO: su interfaz rechazó el Gmail y bloqueó la verificación individual de `josegonzalez@itm.edu.co` por DMARC. No se modificaron DNS ni protecciones del ITM. Gmail tiene límites compartidos con el uso normal del buzón y no es un servicio de envío ilimitado.
