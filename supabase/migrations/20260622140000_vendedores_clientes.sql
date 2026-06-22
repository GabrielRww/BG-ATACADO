-- Passo 2: vendedores (com aprovação do admin) e clientes cadastrados por eles.
create table if not exists public.vendedores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references auth.users(id) on delete cascade,
  nome       text not null,
  telefone   text,
  ativo      boolean not null default false,  -- admin aprova
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.vendedores(id) on delete set null,
  nome        text not null,
  telefone    text,
  doc         text,                            -- CPF/CNPJ
  cep         text,
  endereco    text,
  numero_end  text,
  bairro      text,
  cidade      text,
  uf          text,
  complemento text,
  created_at  timestamptz not null default now()
);

create index if not exists clientes_vendedor_idx on public.clientes (vendedor_id);

alter table public.vendedores enable row level security;
alter table public.clientes  enable row level security;

-- Modelo de confiança igual ao de produtos: tudo liberado p/ autenticado.
-- (insert de vendedor também p/ autenticado, pois o vendedor cria sua própria linha no cadastro)
drop policy if exists "vendedores_auth_all" on public.vendedores;
create policy "vendedores_auth_all" on public.vendedores
  for all to authenticated using (true) with check (true);

drop policy if exists "clientes_auth_all" on public.clientes;
create policy "clientes_auth_all" on public.clientes
  for all to authenticated using (true) with check (true);
