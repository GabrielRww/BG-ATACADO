-- Variantes de volume por produto (ex.: 2L, 5L, 50L) com preço varejo BG.
create table if not exists public.produto_variantes (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  volume      text not null,
  preco       numeric(10,2) not null default 0,
  ordem       integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists produto_variantes_produto_idx
  on public.produto_variantes (produto_id);
create unique index if not exists produto_variantes_unq
  on public.produto_variantes (produto_id, volume);

alter table public.produto_variantes enable row level security;

-- Leitura pública (catálogo)
drop policy if exists "variantes_select_publico" on public.produto_variantes;
create policy "variantes_select_publico"
  on public.produto_variantes for select
  using (true);

-- Escrita só autenticado (admin)
drop policy if exists "variantes_admin_insert" on public.produto_variantes;
create policy "variantes_admin_insert"
  on public.produto_variantes for insert to authenticated with check (true);

drop policy if exists "variantes_admin_update" on public.produto_variantes;
create policy "variantes_admin_update"
  on public.produto_variantes for update to authenticated using (true);

drop policy if exists "variantes_admin_delete" on public.produto_variantes;
create policy "variantes_admin_delete"
  on public.produto_variantes for delete to authenticated using (true);
