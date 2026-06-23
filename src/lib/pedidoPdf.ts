import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/bg-logo.png";
import { brl, type DadosPedido } from "./pedidos";
import type { CartItem } from "./cart";

// Dados da empresa no cabeçalho da cotação.
// TODO: confirmar CNPJ e endereço reais da BG com o cliente.
export const EMPRESA = {
  nome: "BG Atacado",
  endereco: "Passo Fundo / RS",
  cnpj: "",
};

function toDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const LBL_PAG: Record<string, string> = {
  cartao_entrega: "Cartão na entrega", cupom: "Cupom", pix: "PIX", boleto: "Boleto",
};
const LBL_FISCAL: Record<string, string> = { cupom: "Cupom fiscal", nota: "Nota fiscal" };
const LBL_TAB: Record<string, string> = {
  cupom: "Cupom / consumidor", revenda: "Revenda", empresa: "Empresa (NF)",
};

// Gera e baixa a Cotação em PDF (layout estilo distribuidora, com logo da BG).
export async function gerarPedidoPDF(
  dados: DadosPedido,
  itens: CartItem[],
  opts?: { numero?: number | string },
): Promise<string> {
  const doc = new jsPDF();
  const total = itens.reduce((s, i) => s + i.preco_unit * i.quantidade, 0);
  const W = doc.internal.pageSize.getWidth();

  // ── Cabeçalho ──
  const logo = await toDataUrl(logoUrl);
  if (logo) doc.addImage(logo, "PNG", 14, 12, 22, 22);
  const hx = logo ? 40 : 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(EMPRESA.nome.toUpperCase(), hx, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let hy = 24;
  doc.text(EMPRESA.endereco, hx, hy); hy += 5;
  if (EMPRESA.cnpj) { doc.text(`CNPJ: ${EMPRESA.cnpj}`, hx, hy); hy += 5; }
  doc.setTextColor(0);

  // ── Cotação + cliente ──
  let y = Math.max(40, hy + 4);
  doc.setFillColor(232);
  doc.rect(14, y - 5, 24, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Cotação", 16, y);
  doc.setFont("helvetica", "normal");
  const clienteLinha = [dados.cliente_nome, dados.cliente_doc, dados.cliente_telefone]
    .filter(Boolean).join("  •  ");
  doc.text(`Cliente: ${clienteLinha || "—"}`, 42, y);
  y += 6;
  if (dados.vendedor_nome) { doc.text(`Vendedor: ${dados.vendedor_nome}`, 42, y); y += 6; }
  const end = [
    dados.endereco, dados.numero_end && `nº ${dados.numero_end}`, dados.bairro,
    dados.cidade && dados.uf ? `${dados.cidade}/${dados.uf}` : dados.cidade,
    dados.cep && `CEP ${dados.cep}`, dados.complemento,
  ].filter(Boolean).join(", ");
  if (end) { doc.text(`Endereço: ${end}`, 14, y); y += 6; }

  // ── Imagens dos itens (carrega antes da tabela) ──
  const imgs: Record<string, string> = {};
  await Promise.all(
    itens.map(async (i) => {
      if (i.imagem_url) {
        const d = await toDataUrl(i.imagem_url);
        if (d) imgs[i.key] = d;
      }
    }),
  );
  const temImg = Object.keys(imgs).length > 0;

  // ── Tabela de itens ──
  autoTable(doc, {
    startY: y + 2,
    head: [["", "Código", "Produto", "Emb.", "Preço", "Quant.", "Subtotal"]],
    body: itens.map((i) => [
      "",
      i.sku ?? "",
      `${i.nome}${i.variante ? ` (${i.variante})` : ""}`,
      i.unidade ? i.unidade.toUpperCase() : "UN",
      brl(i.preco_unit),
      String(i.quantidade),
      brl(i.preco_unit * i.quantidade),
    ]),
    headStyles: { fillColor: [26, 92, 58], fontSize: 8, halign: "center" },
    styles: { fontSize: 8, valign: "middle", minCellHeight: temImg ? 16 : 8 },
    columnStyles: {
      0: { cellWidth: temImg ? 16 : 0.1 },
      1: { cellWidth: 18 },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "center" },
      6: { halign: "right" },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const item = itens[data.row.index];
        const d = item && imgs[item.key];
        if (d) {
          const s = 13;
          doc.addImage(d, "PNG", data.cell.x + 1.5, data.cell.y + (data.cell.height - s) / 2, s, s);
        }
      }
    },
  });

  // ── Totais ──
  // @ts-expect-error lastAutoTable é injetado pelo plugin
  let fy = (doc.lastAutoTable?.finalY ?? y) + 8;
  const tot = (label: string, val: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, W - 60, fy, { align: "right" });
    doc.text(val, W - 14, fy, { align: "right" });
    fy += bold ? 7 : 6;
  };
  tot("Subtotal", brl(total));
  tot("Frete", brl(0));
  tot("Valor Total", brl(total), true);

  // ── Observações ──
  fy += 4;
  doc.setFontSize(9);
  const obs = (label: string, val?: string | null) => {
    if (!val) return;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 14, fy);
    const w = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    const txt = doc.splitTextToSize(String(val), W - 28 - w);
    doc.text(txt, 14 + w, fy);
    fy += 6 * (Array.isArray(txt) ? txt.length : 1);
  };
  if (dados.tabela_preco) obs("Tabela", LBL_TAB[dados.tabela_preco] ?? dados.tabela_preco);
  if (dados.tipo_fiscal) obs("Tipo fiscal", LBL_FISCAL[dados.tipo_fiscal] ?? dados.tipo_fiscal);
  if (dados.forma_pagamento) obs("Pagamento", LBL_PAG[dados.forma_pagamento] ?? dados.forma_pagamento);
  if (dados.entrega) obs("Entrega", dados.entrega);
  if (dados.observacao) obs("Observação", dados.observacao);

  const nome = `cotacao-bg${opts?.numero ? `-${opts.numero}` : ""}.pdf`;
  doc.save(nome);
  return nome;
}

// Catálogo virtual em PDF (grade de produtos com foto/nome/preço) p/ o vendedor mostrar ao cliente.
export async function gerarCatalogoPDF(
  produtos: { nome: string; imagem_url?: string | null; preco: number }[],
  opts?: { tabelaLabel?: string },
): Promise<string> {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Cabeçalho
  const logo = await toDataUrl(logoUrl);
  if (logo) doc.addImage(logo, "PNG", 14, 10, 18, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Catálogo de Produtos", logo ? 36 : 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`${EMPRESA.nome}${opts?.tabelaLabel ? ` • ${opts.tabelaLabel}` : ""}`, logo ? 36 : 14, 24);
  doc.setTextColor(0);

  // Pré-carrega imagens
  const imgs = await Promise.all(
    produtos.map((p) => (p.imagem_url ? toDataUrl(p.imagem_url) : Promise.resolve(null))),
  );

  const cols = 3;
  const gap = 6;
  const m = 14;
  const cellW = (W - m * 2 - gap * (cols - 1)) / cols;
  const imgH = cellW;
  const cellH = imgH + 18;
  let x = m;
  let y = 34;
  let col = 0;

  for (let i = 0; i < produtos.length; i++) {
    if (col === 0 && y + cellH > H - m) {
      doc.addPage();
      y = 18;
    }
    const p = produtos[i];
    // moldura
    doc.setDrawColor(225);
    doc.roundedRect(x, y, cellW, cellH, 2, 2);
    // imagem
    const d = imgs[i];
    if (d) {
      try { doc.addImage(d, "PNG", x + 4, y + 3, cellW - 8, imgH - 6); } catch { /* ignora */ }
    }
    // nome
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const nomeTxt = doc.splitTextToSize(p.nome, cellW - 6).slice(0, 2);
    doc.text(nomeTxt, x + 3, y + imgH + 2);
    // preço
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 92, 58);
    doc.text(p.preco > 0 ? brl(p.preco) : "Consultar", x + 3, y + cellH - 3);
    doc.setTextColor(0);

    col++;
    x += cellW + gap;
    if (col === cols) { col = 0; x = m; y += cellH + gap; }
  }

  const nome = "catalogo-bg.pdf";
  doc.save(nome);
  return nome;
}
