import { readFileSync, writeFileSync } from "node:fs";

const CSV = "C:/Users/gabri/Downloads/produtos.csv";
const APPLY = process.argv.includes("--apply"); // só gera NDJSON quando passado

// De-para: GRUPO_NOME (exato) -> categoria do site
const MAP = {
  // Linha Escritório
  "PASTA": "Linha Escritório", "FITA": "Linha Escritório", "IMPRESSOS": "Linha Escritório",
  "CANETAS": "Linha Escritório", "ETIQUETA": "Linha Escritório", "DIVERSOS": "Linha Escritório",
  "ENVELOPE": "Linha Escritório", "CALCULADORA": "Linha Escritório", "PORTA": "Linha Escritório",
  "GRAMPEADOR": "Linha Escritório", "AGENDAS": "Linha Escritório", "CON - TACT": "Linha Escritório",
  "MARCA TEXTO": "Linha Escritório", "QUADRO": "Linha Escritório", "LAPISEIRA": "Linha Escritório",
  "BOBINA": "Linha Escritório", "BANDEIRA": "Linha Escritório", "SUPORTE": "Linha Escritório",
  "CORRETOR": "Linha Escritório", "ESTILETE": "Linha Escritório", "PERFURADOR": "Linha Escritório",
  "CLIPS": "Linha Escritório", "PRANCHETA": "Linha Escritório", "BANDEJA": "Linha Escritório",
  "GRAMPO": "Linha Escritório", "CRACHA": "Linha Escritório", "PEGADOR": "Linha Escritório",
  "REGISTRADOR": "Linha Escritório", "CARBONO": "Linha Escritório", "APAGADOR": "Linha Escritório",
  "LACRES": "Linha Escritório", "BARBANTE": "Linha Escritório", "ALMOFADA": "Linha Escritório",
  "LAMINA P/ESTILETE": "Linha Escritório", "FICHARIO": "Linha Escritório", "MOLHA DEDO": "Linha Escritório",
  "ARQUIVO MORTO": "Linha Escritório", "ELASTICO": "Linha Escritório", "INDICE": "Linha Escritório",
  "JOANINHA": "Linha Escritório", "CARIMBO": "Linha Escritório", "FICHA": "Linha Escritório",
  "FORMULARIO": "Linha Escritório", "ALFINETES": "Linha Escritório", "ESPETO P/PAPEIS": "Linha Escritório",
  "COLCHETE": "Linha Escritório",
  // Material Escolar
  "CADERNOS": "Material Escolar", "JOGO": "Material Escolar", "PINCEL": "Material Escolar",
  "LAPIS": "Material Escolar", "TINTA": "Material Escolar", "BALAO": "Material Escolar",
  "ESTOJO": "Material Escolar", "APONTADOR": "Material Escolar", "MASSA DE MODELAR": "Material Escolar",
  "GLITER": "Material Escolar", "TESOURA": "Material Escolar", "BORRACHA": "Material Escolar",
  "REGUA": "Material Escolar", "LANCHEIRA": "Material Escolar", "ISOPOR": "Material Escolar",
  "GIZ": "Material Escolar", "ENFEITES NATAL": "Material Escolar", "CARTOLINA": "Material Escolar",
  "PALITOS": "Material Escolar", "GRAFITE": "Material Escolar", "COMPASSO": "Material Escolar",
  "SPRAY DECORATIVO": "Material Escolar", "CORDA P/VIOLAO": "Material Escolar", "ALBUM": "Material Escolar",
  "ESPATULA": "Material Escolar", "FOLHA": "Material Escolar", "TRANSFERIDOR": "Material Escolar",
  "ESQUADRO": "Material Escolar", "VERNIZ": "Material Escolar", "LETRAS": "Material Escolar",
  "LANTEJOLA": "Material Escolar", "BRINQUEDO": "Material Escolar", "COLA": "Material Escolar",
  // Material Gráfico
  "PAPEL": "Material Gráfico", "ENCADERNACAO": "Material Gráfico", "CORTADEIRA": "Material Gráfico",
  // Linha Informática
  "CARTUCHO": "Linha Informática", "CD-RW": "Linha Informática", "TRANSPARENCIA": "Linha Informática",
  // Embalagens Alimentícias
  "EMBALAGENS": "Embalagens Alimentícias", "SAQUINHO P/PRESENTE": "Embalagens Alimentícias",
  "PLASTICO": "Embalagens Alimentícias",
  // Material de Limpeza
  "ESPANADOR": "Material de Limpeza",
  // Alimentos (7ª categoria)
  "ALIMENTOS": "Alimentos",
};

function parseCSV(s){const rows=[];let row=[],f="",q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'){if(s[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===","){row.push(f);f="";}else if(c==="\n"){row.push(f);rows.push(row);row=[];f="";}else if(c==="\r"){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows;}

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()).trim();

const rows = parseCSV(readFileSync(CSV, "utf8")).slice(1).filter((r) => r.length > 24 && r[0] !== "");

const perCat = {}, unmapped = new Map(), skusVistos = new Set();
let precoZero = 0, dupSku = 0;
const out = [];
for (const r of rows) {
  const grupo = (r[4] || "").trim();
  const cat = MAP[grupo];
  if (!cat) { unmapped.set(grupo, (unmapped.get(grupo) || 0) + 1); continue; }
  const sku = (r[0] || "").trim();
  if (skusVistos.has(sku)) { dupSku++; continue; }
  skusVistos.add(sku);
  perCat[cat] = (perCat[cat] || 0) + 1;
  const preco = parseFloat(r[23] || "0") || 0;
  if (preco === 0) precoZero++;
  out.push({
    sku,
    nome: r[1].trim(),
    categoria: cat,
    subcategoria: titleCase(grupo),
    marca: (r[13] || "").trim() || null,
    unidade: (r[10] || "").trim() || null,
    estoque: Math.round(parseFloat(r[24] || "0") || 0),
    preco,
    ativo: true,
  });
}

console.log("TOTAL no CSV:", rows.length, "| mapeados:", out.length);
console.log("\n--- produtos por categoria ---");
for (const [c, n] of Object.entries(perCat).sort((a,b)=>b[1]-a[1])) console.log(`${String(n).padStart(5)}  ${c}`);
if (unmapped.size) { console.log("\n--- GRUPOS NÃO MAPEADOS (vão ficar de fora) ---"); for (const [g,n] of unmapped) console.log(`${n}\t${g}`); }
console.log(`\nProdutos com preço 0: ${precoZero} | SKUs duplicados ignorados: ${dupSku}`);

if (APPLY) {
  writeFileSync("C:/Users/gabri/OneDrive/Documentos/BG-ATACADO/scripts/import.ndjson", out.map((p)=>JSON.stringify(p)).join("\n"), "utf8");
  console.log(`\nNDJSON gerado: ${out.length} produtos.`);
}
