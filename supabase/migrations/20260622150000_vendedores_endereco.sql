-- Endereço do vendedor (usado no cadastro com CEP automático).
alter table public.vendedores
  add column if not exists cidade   text,
  add column if not exists cep      text,
  add column if not exists endereco text,
  add column if not exists bairro   text,
  add column if not exists uf       text;
