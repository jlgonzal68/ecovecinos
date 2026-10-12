-- ECO-VECINOS · ejecutar una vez en un proyecto Supabase nuevo.
-- No contiene claves ni usuarios administrativos predeterminados.
begin;
create table public.course_settings (
  id integer primary key check (id = 1),
  course_dates text not null default '',
  course_place text not null default '',
  privacy_controller text not null default '',
  privacy_contact text not null default '',
  privacy_address text not null default '',
  privacy_phone text not null default '',
  privacy_retention text not null default '',
  privacy_procedure text not null default '',
  privacy_approved boolean not null default false,
  privacy_version text not null default '2026-10-12',
  registration_open boolean not null default false,
  check (not registration_open or (privacy_approved and length(trim(privacy_controller)) > 0 and length(trim(privacy_contact)) > 0 and length(trim(privacy_address)) > 0 and length(trim(privacy_phone)) > 0 and length(trim(privacy_retention)) > 0 and length(trim(privacy_procedure)) > 0))
);
insert into public.course_settings(id,privacy_controller,privacy_contact,privacy_address,privacy_phone,privacy_retention,privacy_procedure,privacy_approved) values (1,'Jose Gonzalez','josegonzalezm@correo.itm.edu.co','Calle 73 # 76A - 354, Bloque i, Piso 2, Departamento de Ciencias Ambientales y de la Construcción','6044405100 ext 5807','Cuentas no verificadas: 30 días desde la solicitud. Cuentas verificadas: durante el curso y hasta 12 meses tras la última sesión. Después, supresión de datos identificables salvo obligación legal documentada o reclamo pendiente. Revisión manual mensual; no hay borrado automático activado.','Solicitudes a josegonzalezm@correo.itm.edu.co para consulta, corrección, revocación o supresión, verificando al titular con los datos mínimos. Consultas: 10 días hábiles, prorrogables hasta 5 más con aviso. Reclamos: 15 días hábiles desde el día siguiente a la recepción, prorrogables hasta 8 más con aviso. Registrar y resolver conforme a los artículos 14 y 15 de la Ley 1581 de 2012.',true);
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 100),
  email text not null,
  consent_version text,
  consent_at timestamptz,
  signup_eligible boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  enrolled_at timestamptz not null default now()
);
create table public.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null check (lesson_id in ('teoria-1','teoria-2','teoria-3','teoria-4')),
  title text not null check (length(trim(title)) between 1 and 150),
  url text not null check (length(url) <= 2048 and url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be|instagram\.com|facebook\.com|fb\.watch)/'),
  position integer not null default 0 check(position between 0 and 999),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.materials (
  id text primary key,
  title text not null,
  filename text not null,
  format text not null,
  category text not null,
  bytes bigint not null check(bytes > 0),
  sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
  paths text[] not null check(cardinality(paths) between 1 and 100),
  mime_type text not null default 'application/octet-stream',
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.administrators a join auth.users u on u.id=a.user_id where a.user_id=auth.uid() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false));
$$;
create function public.is_enrolled() returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.enrollments e join auth.users u on u.id=e.user_id where e.user_id=auth.uid() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false));
$$;
revoke all on function public.is_admin(), public.is_enrolled() from public;
grant execute on function public.is_admin(), public.is_enrolled() to anon, authenticated;

create function public.sync_course_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.course_settings%rowtype;
begin
  select * into s from public.course_settings where id=1;
  if tg_op = 'INSERT' then
    insert into public.profiles(user_id,full_name,email,consent_version,consent_at,signup_eligible)
      values(new.id,left(trim(coalesce(new.raw_user_meta_data->>'full_name','')),100),coalesce(new.email,''),new.raw_user_meta_data->>'consent_version',
        case when new.raw_user_meta_data->>'consent_version'=s.privacy_version then now() else null end,
        s.registration_open and new.raw_user_meta_data->>'consent_version'=s.privacy_version and length(trim(coalesce(new.raw_user_meta_data->>'full_name',''))) between 2 and 100);
  end if;
  if new.email_confirmed_at is not null and not coalesce(new.is_anonymous,false) then
    insert into public.enrollments(user_id)
      select p.user_id from public.profiles p where p.user_id=new.id and p.signup_eligible and p.consent_at is not null
      on conflict(user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_course_user() from public,anon,authenticated;
create trigger ecovecinos_signup after insert on auth.users for each row execute function public.sync_course_user();
create trigger ecovecinos_verify after update of email_confirmed_at on auth.users for each row execute function public.sync_course_user();

alter table public.course_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
alter table public.administrators enable row level security;
alter table public.videos enable row level security;
alter table public.materials enable row level security;

grant usage on schema public to anon,authenticated;
grant select on public.course_settings,public.videos to anon,authenticated;
grant select on public.profiles,public.enrollments,public.administrators,public.materials to authenticated;
grant update on public.course_settings to authenticated;
grant insert,update,delete on public.videos,public.materials to authenticated;
revoke insert,update,delete on public.profiles,public.enrollments,public.administrators from anon,authenticated;

create policy settings_read on public.course_settings for select to anon,authenticated using(true);
create policy settings_admin on public.course_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy profiles_read on public.profiles for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy enrollment_read on public.enrollments for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy administrator_read on public.administrators for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy videos_read on public.videos for select to anon,authenticated using(published or public.is_admin());
create policy videos_admin on public.videos for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy materials_read on public.materials for select to authenticated using(public.is_enrolled() or public.is_admin());
create policy materials_admin on public.materials for all to authenticated using(public.is_admin()) with check(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit) values('ecovecinos-materiales','ecovecinos-materiales',false,52428800);
create policy ecovecinos_private_read on storage.objects for select to authenticated using(
  bucket_id='ecovecinos-materiales' and (public.is_admin() or (public.is_enrolled() and exists(select 1 from public.materials m where storage.objects.name=any(m.paths))))
);
create policy ecovecinos_private_insert on storage.objects for insert to authenticated with check(bucket_id='ecovecinos-materiales' and public.is_admin());
create policy ecovecinos_private_update on storage.objects for update to authenticated using(bucket_id='ecovecinos-materiales' and public.is_admin()) with check(bucket_id='ecovecinos-materiales' and public.is_admin());
create policy ecovecinos_private_delete on storage.objects for delete to authenticated using(bucket_id='ecovecinos-materiales' and public.is_admin());
commit;
