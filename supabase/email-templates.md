# Correos de autenticación de ECO-VECINOS

## Estado de producción

Gmail SMTP está habilitado y se comprobó la recepción real del administrador y la verificación de un participante. Remitente: **ECO-VECINOS <jlgonzal68@gmail.com>**. Contacto administrativo y de privacidad: `josegonzalezm@correo.itm.edu.co`.

Configuración: `smtp.gmail.com`, puerto `465`, usuario `jlgonzal68@gmail.com`, intervalo mínimo de 60 segundos por usuario. Jose ingresó personalmente la contraseña de aplicación en Supabase. Nunca usar ni publicar la contraseña principal ni copiar la contraseña SMTP al repositorio.

La Site URL y el retorno autorizado son `https://jlgonzal68.github.io/ecovecinos/`. Después de completar las pruebas se retiró el retorno local temporal. No hay comodines globales. Se mantiene confirmación de correo obligatoria y mínimo de 12 caracteres tanto en formulario como en servidor. La inscripción está habilitada y el flujo real de participante y descarga privada se comprobó.

Las siguientes son **plantillas españolas listas para aplicar o editar** en Supabase Authentication. No se afirma que hayan sustituido las plantillas actuales del panel. Mantener `{{ .ConfirmationURL }}`: Supabase genera el enlace para cada mensaje; no poner contraseñas, tokens fijos o enlaces personales en el HTML.

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

## Precauciones

El SMTP predeterminado de Supabase restringe destinatarios y no debe sustituir Gmail sin revisar sus límites. Gmail comparte cuotas con el uso normal del buzón y no es un servicio ilimitado. No desactivar confirmación de correo para resolver cuotas; configurar CAPTCHA solo si el responsable dispone de un proveedor autorizado.

No se usa SMTP2GO: rechazó Gmail y bloqueó la verificación individual de `josegonzalez@itm.edu.co` por DMARC. No se modificaron DNS ni protecciones institucionales.

Fuentes: [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [autenticación por contraseña](https://supabase.com/docs/guides/auth/passwords), [Google: contraseñas de aplicación](https://support.google.com/accounts/answer/185833?hl=es).
