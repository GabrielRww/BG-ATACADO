-- Passo 1/2: pedidos (carrinho do cliente final E pedidos do vendedor)
create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  numero           bigserial,
  origem           text not null default 'site',     -- 'site' | 'vendedor'
  status           text not null default 'pendente', -- pendente | visto | concluido | cancelado
  -- cliente
  cliente_nome     text,
  cliente_telefone text,
  cliente_doc      text,                             -- CPF/CNPJ
  -- endereço
  cep              text,
  endereco         text,
  numero_end       text,
  bairro           text,
  cidade           text,
  uf               text,
  complemento      text,
  -- vendedor (quando origem='vendedor')
  vendedor_id      uuid,
  vendedor_nome    text,
  -- opções / observações
  tabela_preco     text,                             -- cupom | revenda | empresa
  forma_pagamento  text,                             -- cartao_entrega | cupom | pix | boleto
  tipo_fiscal      text,                             -- cupom | nota
  entrega          text,
  observacao       text,
  total            numeric(10,2) not null default 0,
  created_at       timestamptz not null default now()
);

create table if not exists public.pedido_itens (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references public.pedidos(id) on delete cascade,
  produto_id  uuid,
  nome        text not null,
  variante    text,
  preco_unit  numeric(10,2) not null default 0,
  quantidade  integer not null default 1,
  subtotal    numeric(10,2) not null default 0
);

create index if not exists pedidos_status_idx  on public.pedidos (status);
create index if not exists pedidos_created_idx on public.pedidos (created_at desc);
create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

-- Qualquer um (cliente do site, anon) pode CRIAR pedido. Só admin (autenticado) lê/edita.
drop policy if exists "pedidos_insert_publico" on public.pedidos;
create policy "pedidos_insert_publico" on public.pedidos for insert with check (true);
drop policy if exists "pedidos_admin_select" on public.pedidos;
create policy "pedidos_admin_select" on public.pedidos for select to authenticated using (true);
drop policy if exists "pedidos_admin_update" on public.pedidos;
create policy "pedidos_admin_update" on public.pedidos for update to authenticated using (true);
drop policy if exists "pedidos_admin_delete" on public.pedidos;
create policy "pedidos_admin_delete" on public.pedidos for delete to authenticated using (true);

drop policy if exists "itens_insert_publico" on public.pedido_itens;
create policy "itens_insert_publico" on public.pedido_itens for insert with check (true);
drop policy if exists "itens_admin_select" on public.pedido_itens;
create policy "itens_admin_select" on public.pedido_itens for select to authenticated using (true);
drop policy if exists "itens_admin_delete" on public.pedido_itens;
create policy "itens_admin_delete" on public.pedido_itens for delete to authenticated using (true);
