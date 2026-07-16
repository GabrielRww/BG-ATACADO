-- Corrige produtos cadastrados pelo admin que não apareciam no site.
--
-- Causa: o seed 20260614120100 gravou categoria = 'Limpeza', mas a lista
-- canônica do app (src/lib/categorias.ts) usa 'Material de Limpeza' — que é o
-- valor que o admin grava. A página /limpeza filtrava pelo literal antigo, então
-- os 40 produtos criados pelo admin (ALCOOL GEL 70PC, AGUA SANITARIA...) ficavam
-- invisíveis no catálogo, sem nenhum erro: o filtro só devolvia zero linhas.

-- ── 1) Junta o legado do seed na categoria canônica ──────────────────
update public.produtos
set categoria = 'Material de Limpeza'
where categoria = 'Limpeza';

-- ── 2) Trava contra categoria órfã ───────────────────────────────────
-- Um valor fora da lista canônica esconde o produto do site silenciosamente.
-- Com o check, a gravação falha na hora em vez de sumir com o produto.
-- ATENÇÃO: ao adicionar uma categoria em src/lib/categorias.ts, adicione-a
-- também aqui numa migration nova, senão o cadastro dela é recusado.
alter table public.produtos
  drop constraint if exists produtos_categoria_valida;

alter table public.produtos
  add constraint produtos_categoria_valida
  check (categoria is null or categoria in (
    'Material Gráfico',
    'Material de Limpeza',
    'Linha Informática',
    'Linha Escritório',
    'Material Escolar',
    'Embalagens Alimentícias',
    'Alimentos'
  ));
