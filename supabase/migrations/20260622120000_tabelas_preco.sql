-- Passo 3: tabelas de preço (revenda / cupom-consumidor / empresa-NF+boleto)
-- Adiciona 3 preços em produtos e produto_variantes. Nulo = "a consultar".
-- Preço público padrão = cupom (consumidor final). Backfill: preco atual -> preco_cupom.

alter table public.produtos
  add column if not exists preco_revenda numeric(10,2),
  add column if not exists preco_cupom   numeric(10,2),
  add column if not exists preco_empresa numeric(10,2);

alter table public.produto_variantes
  add column if not exists preco_revenda numeric(10,2),
  add column if not exists preco_cupom   numeric(10,2),
  add column if not exists preco_empresa numeric(10,2);

-- Backfill: o preço atual vira o de cupom (consumidor = público).
update public.produtos
  set preco_cupom = preco
  where preco_cupom is null and preco > 0;

update public.produto_variantes
  set preco_cupom = preco
  where preco_cupom is null and preco > 0;
