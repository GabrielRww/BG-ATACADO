-- Tabela de catálogo de produtos — BG Atacado
create table if not exists public.produtos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  descricao     text,
  categoria     text,
  sku           text unique,                       -- código/referência do produto
  preco         numeric(10,2) not null default 0,  -- preço de venda
  unidade       text default 'un',                 -- un, cx, fardo, kg...
  qtd_por_caixa integer,                            -- itens por embalagem (atacado)
  qtd_minima    integer default 1,                 -- pedido mínimo
  estoque       integer default 0,
  imagem_url    text,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices úteis para o catálogo
create index if not exists produtos_categoria_idx on public.produtos (categoria);
create index if not exists produtos_ativo_idx on public.produtos (ativo);

-- Mantém updated_at sempre atualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists produtos_set_updated_at on public.produtos;
create trigger produtos_set_updated_at
  before update on public.produtos
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.produtos enable row level security;

-- Leitura pública (catálogo visível a todos)
drop policy if exists "produtos_select_publico" on public.produtos;
create policy "produtos_select_publico"
  on public.produtos for select
  using (true);

-- Escrita apenas para usuários autenticados (admin do cliente)
drop policy if exists "produtos_admin_insert" on public.produtos;
create policy "produtos_admin_insert"
  on public.produtos for insert to authenticated with check (true);

drop policy if exists "produtos_admin_update" on public.produtos;
create policy "produtos_admin_update"
  on public.produtos for update to authenticated using (true);

drop policy if exists "produtos_admin_delete" on public.produtos;
create policy "produtos_admin_delete"
  on public.produtos for delete to authenticated using (true);
