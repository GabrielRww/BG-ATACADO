// Gera a migration de variantes (volume -> preço varejo BG) a partir dos
// dados transcritos dos prints da tabela de revenda da BG.
import { writeFileSync } from "node:fs";

// sku -> lista de [volume, precoVarejo] na ordem de exibição (menor->maior)
const DATA = {
  "arom-1": [["500ml", 25.0]],
  "arom-2": [["500ml", 25.0]],
  "arom-3": [["500ml", 25.0]],
  "auto-1": [["60ml", 18.0]],
  "auto-2": [["60ml", 18.0]],
  "auto-3": [["2L", 18.0], ["5L", 35.8], ["50L", 318.0]],
  "auto-4": [["500g", 35.8], ["3,5L", 180.0]],
  "auto-6": [["5L", 45.5], ["50L", 416.91]],
  "auto-7": [["500g", 22.5]],
  "auto-8": [["500ml", 15.3], ["5L", 72.0]],
  "auto-10": [["500ml", 28.6], ["5L", 178.1]],
  "auto-12": [["5L", 37.7], ["50L", 336.27]],
  "casa-1": [["Único", 35.9]],
  "casa-2": [["Único", 35.9]],
  "casa-3": [["5L", 33.8]],
  "casa-4": [["5L", 33.8]],
  "casa-5": [["5L", 33.8]],
  "casa-6": [["1L", 24.7], ["5L", 39.0], ["50L", 329.72]],
  "casa-7": [["1L", 24.7], ["5L", 39.0]],
  "casa-8": [["2L", 11.7], ["5L", 23.4], ["50L", 196.56]],
  "casa-9": [["2L", 11.7], ["5L", 23.4], ["50L", 196.56]],
  "casa-10": [["2L", 11.7], ["5L", 23.4], ["50L", 196.56]],
  "casa-11": [["2L", 11.7], ["5L", 23.4], ["50L", 196.56]],
  "casa-12": [["2L", 11.7], ["5L", 23.4], ["50L", 196.56]],
  "casa-13": [["2L", 14.3], ["5L", 28.6], ["50L", 246.83]],
  "casa-14": [["2L", 14.3], ["5L", 28.6], ["50L", 246.83]],
  "casa-15": [["2L", 18.2], ["5L", 36.4]],
  "casa-16": [["1L", 24.7], ["5L", 36.4]],
  "casa-17": [["5L", 28.6]],
  "casa-18": [["5L", 28.6]],
  "casa-19": [["5L", 28.6]],
  "casa-20": [["5L", 28.6]],
  "casa-21": [["5L", 28.6]],
  "casa-22": [["5L", 28.6]],
  "casa-23": [["5L", 28.6]],
  "casa-24": [["1L", 24.7], ["5L", 39.0], ["50L", 349.23]],
  "casa-25": [["5L", 32.5]],
  "casa-26": [["5L", 32.5]],
  "casa-27": [["500g", 26.0]],
  "maos-1": [["2L", 19.5], ["5L", 37.7]],
  "maos-2": [["2L", 19.5], ["5L", 37.7]],
  "maos-3": [["2L", 19.5], ["5L", 37.7]],
  "lav-1": [["2L", 7.8], ["5L", 15.6], ["50L", 118.44]],
  "lav-2": [["5L", 26.0], ["50L", 182.4]],
  "lav-3": [["2L", 15.6], ["5L", 32.5], ["50L", 283.1]],
  "lav-4": [["2L", 11.7], ["5L", 24.7], ["50L", 208.77]],
  "lav-5": [["2L", 11.7], ["5L", 24.7], ["50L", 179.2]],
  "lav-6": [["1L", 20.8]],
  "lav-7": [["1L", 20.8]],
  "lav-8": [["1L", 20.8]],
  "lav-9": [["2L", 14.3], ["5L", 28.6], ["50L", 246.83]],
  "lav-10": [["2L", 11.7], ["5L", 24.7], ["50L", 208.77]],
  "lav-11": [["2L", 11.7], ["5L", 24.7], ["50L", 208.77]],
  "lav-12": [["2L", 19.5], ["5L", 39.0], ["50L", 349.23]],
  "lav-13": [["2L", 18.2], ["5L", 37.7], ["50L", 335.47]],
  "lav-14": [["2L", 18.2], ["5L", 37.7], ["50L", 335.47]],
  "lav-15": [["2L", 18.2], ["5L", 37.7], ["50L", 335.47]],
  "lav-16": [["500g", 28.6]],
  "lav-17": [["1Kg", 33.5]],
  "lp-1": [["2L", 15.6], ["5L", 31.2], ["50L", 272.72]],
  "lp-2": [["2L", 15.0], ["5L", 31.0], ["50L", 270.0]],
  "lp-3": [["5L", 50.7], ["50L", 466.24]],
  "lp-4": [["5L", 27.0]],
  "pet-1": [["2L", 15.6], ["5L", 32.5]],
};

const esc = (s) => s.replace(/'/g, "''");
const rows = [];
for (const [sku, variants] of Object.entries(DATA)) {
  variants.forEach(([volume, preco], i) => {
    rows.push(`  ('${esc(sku)}', '${esc(volume)}', ${preco.toFixed(2)}, ${i + 1})`);
  });
}

const sql = `-- Seed: variantes (volume -> preço varejo BG) — tabela de revenda BG Atacado
-- Gerado de scripts/gen-variantes.mjs (dados dos prints "Revendedor BG preço").
-- Idempotente: limpa as variantes existentes e reinsere casando por sku.
delete from public.produto_variantes;

insert into public.produto_variantes (produto_id, volume, preco, ordem)
select p.id, v.volume, v.preco, v.ordem
from (
  values
${rows.join(",\n")}
) as v(sku, volume, preco, ordem)
join public.produtos p on p.sku = v.sku;

-- preço base do produto = menor variante (usado em "a partir de" e ordenação)
update public.produtos p
set preco = sub.menor
from (
  select produto_id, min(preco) as menor
  from public.produto_variantes
  group by produto_id
) sub
where p.id = sub.produto_id;
`;

const OUT =
  "C:/Users/gabri/OneDrive/Documentos/BG-ATACADO/supabase/migrations/20260614120300_seed_variantes_bg.sql";
writeFileSync(OUT, sql, "utf8");
const total = rows.length;
console.log(`Gerados ${total} variantes (${Object.keys(DATA).length} produtos) -> ${OUT}`);
