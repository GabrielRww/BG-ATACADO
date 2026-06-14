-- Colunas extras para o cadastro livre de itens pelo admin.
alter table public.produtos add column if not exists subcategoria text;
alter table public.produtos add column if not exists marca text;

-- Bucket público para imagens dos produtos enviadas pelo admin.
insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do nothing;

-- Storage policies: leitura pública, escrita só autenticado.
drop policy if exists "catalogo_public_read" on storage.objects;
create policy "catalogo_public_read"
  on storage.objects for select
  using (bucket_id = 'catalogo');

drop policy if exists "catalogo_auth_insert" on storage.objects;
create policy "catalogo_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo');

drop policy if exists "catalogo_auth_update" on storage.objects;
create policy "catalogo_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'catalogo');

drop policy if exists "catalogo_auth_delete" on storage.objects;
create policy "catalogo_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo');
