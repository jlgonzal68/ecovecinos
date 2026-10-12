-- Ejecutar desde SQL Editor después de crear y verificar la cuenta del administrador.
-- Correo confirmado por el propietario el 12 de octubre de 2026.
-- Concede acceso a materiales y edición del curso solo tras crear y verificar esa cuenta.
insert into public.administrators(user_id)
select id from auth.users
where email = 'josegonzalezm@correo.itm.edu.co'
  and email_confirmed_at is not null
  and not coalesce(is_anonymous,false)
on conflict(user_id) do nothing;

-- Verificar que se asignó exactamente el usuario esperado.
select u.email, a.user_id from public.administrators a join auth.users u on u.id=a.user_id;
