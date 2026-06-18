import { readFileSync } from "node:fs";

const txt = readFileSync("C:/Users/gabri/Downloads/produtos.csv", "utf8");

// Parser CSV simples com aspas.
function parseCSV(s) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(txt);
const header = rows[0];
const data = rows.slice(1).filter((r) => r.length > 4 && r[0] !== "");
console.log("Total de produtos:", data.length);

const GRUPO = 4;
const counts = new Map();
for (const r of data) {
  const g = (r[GRUPO] || "(vazio)").trim();
  counts.set(g, (counts.get(g) || 0) + 1);
}
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
console.log("Grupos distintos (GRUPO_NOME):", sorted.length);
console.log("--- todos os grupos (nome | qtd) ---");
for (const [g, n] of sorted) console.log(`${n}\t${g}`);
