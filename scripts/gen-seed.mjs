// Lê o products.ts do projeto Quimiprol/MaxClean e gera o INSERT da tabela
// produtos (categoria "Limpeza") para o banco do BG Atacado.
import { readFileSync, writeFileSync } from "node:fs";

const SRC =
  "C:/Users/gabri/OneDrive/Desktop/Quimiprol/clean-shop-connect-main/src/data/products.ts";

const text = readFileSync(SRC, "utf8");

// Isola o array `export const products: Product[] = [ ... ];`
const start = text.indexOf("export const products");
const arrOpen = text.indexOf("[", start);
const arrClose = text.indexOf("\n];", arrOpen);
const body = text.slice(arrOpen + 1, arrClose);

// Quebra em blocos de objeto top-level { ... }
const blocks = [];
let depth = 0;
let cur = "";
for (const ch of body) {
  if (ch === "{") {
    if (depth === 0) cur = "";
    depth++;
  }
  if (depth > 0) cur += ch;
  if (ch === "}") {
    depth--;
    if (depth === 0) blocks.push(cur);
  }
}

const field = (block, name) => {
  const m = block.match(new RegExp(`${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? m[1].replace(/\\"/g, '"') : null;
};

const sqlStr = (v) => (v == null ? "NULL" : `'${v.replace(/'/g, "''")}'`);

const rows = [];
for (const b of blocks) {
  const id = field(b, "id");
  if (!id) continue;
  const name = field(b, "name");
  const description = field(b, "description");
  const priceM = b.match(/price:\s*([\d.]+)/);
  const price = priceM ? priceM[1] : "0";
  // image pode ser string literal "..." ou uma variável importada (asset local)
  const imgM = b.match(/image:\s*"((?:[^"\\]|\\.)*)"/);
  const image = imgM ? imgM[1] : null; // asset local -> NULL
  rows.push(
    `  (${sqlStr(id)}, ${sqlStr(name)}, ${sqlStr(description)}, 'Limpeza', ${price}, ${sqlStr(image)}, 'un', true)`,
  );
}

const sql = `-- Seed: produtos Quimiprol + MaxClean na categoria "Limpeza" (BG Atacado)
-- Gerado a partir do catálogo do projeto clean-shop-connect.
-- sku = id original do produto (idempotente via ON CONFLICT).
insert into public.produtos (sku, nome, descricao, categoria, preco, imagem_url, unidade, ativo)
values
${rows.join(",\n")}
on conflict (sku) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  categoria = excluded.categoria,
  preco = excluded.preco,
  imagem_url = excluded.imagem_url,
  unidade = excluded.unidade,
  ativo = excluded.ativo;
`;

const OUT =
  "C:/Users/gabri/OneDrive/Documentos/BG-ATACADO/supabase/migrations/20260614120100_seed_produtos_limpeza.sql";
writeFileSync(OUT, sql, "utf8");
console.log(`Gerados ${rows.length} produtos -> ${OUT}`);
