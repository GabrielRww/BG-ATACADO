import { readFileSync } from "node:fs";
const txt = readFileSync("C:/Users/gabri/Downloads/produtos.csv", "utf8");
function parseCSV(s){const rows=[];let row=[],f="",q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'){if(s[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===","){row.push(f);f="";}else if(c==="\n"){row.push(f);rows.push(row);row=[];f="";}else if(c==="\r"){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows;}
const rows = parseCSV(txt).slice(1).filter(r=>r.length>6&&r[0]!=="");
const alvo = process.argv.slice(2).map(s=>s.toUpperCase());
for (const g of alvo) {
  const amostra = rows.filter(r=>(r[4]||"").trim().toUpperCase()===g).slice(0,6);
  console.log(`\n### ${g} (${rows.filter(r=>(r[4]||"").trim().toUpperCase()===g).length})`);
  for (const r of amostra) console.log(`  - ${r[1]}  [sub: ${r[6]||"-"}]`);
}
