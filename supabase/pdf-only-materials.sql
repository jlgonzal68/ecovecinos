-- ECO-VECINOS: biblioteca exclusivamente PDF, sin borrar originales ni objetos.
-- Aplicar una vez sobre el proyecto existente; repetir es seguro.
begin;
alter table public.materials add column if not exists published boolean not null default true;
update public.materials set published=false
where format <> 'PDF' or filename !~* '\.pdf$';

alter policy materials_read on public.materials using (
  published and format='PDF' and filename ~* '\.pdf$'
  and (public.is_enrolled() or public.is_admin())
);
alter policy materials_admin on public.materials
using (public.is_admin())
with check (public.is_admin() and format='PDF' and filename ~* '\.pdf$');
alter policy ecovecinos_private_read on storage.objects using (
  bucket_id='ecovecinos-materiales'
  and (public.is_admin() or (public.is_enrolled() and exists (
    select 1 from public.materials m
    where m.published and m.format='PDF' and m.filename ~* '\.pdf$'
      and storage.objects.name=any(m.paths)
  )))
);
commit;
-- Inventario actual: publicados PDF, archivados y objetos conservados.
select count(*) filter (where published and format='PDF' and filename ~* '\.pdf$') as pdf_publicados,
       count(*) filter (where not published) as archivados,
       sum(bytes) filter (where published and format='PDF' and filename ~* '\.pdf$') as bytes_pdf,
       (select count(*) from storage.objects where bucket_id='ecovecinos-materiales') as objetos_conservados
from public.materials;
