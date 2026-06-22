import { supabase } from "./supabase";
import type { CartItem } from "./cart";

export const WHATS_NUMBER = "5554991242948";

export type TabelaPreco = "cupom" | "revenda" | "empresa";
export type FormaPagamento = "cartao_entrega" | "cupom" | "pix" | "boleto";
export type TipoFiscal = "cupom" | "nota";

export type DadosPedido = {
  origem?: "site" | "vendedor";
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  cliente_doc?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero_end?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  complemento?: string | null;
  vendedor_id?: string | null;
  vendedor_nome?: string | null;
  tabela_preco?: TabelaPreco | null;
  forma_pagamento?: FormaPagamento | null;
  tipo_fiscal?: TipoFiscal | null;
  entrega?: string | null;
  observacao?: string | null;
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const LABEL_PAGAMENTO: Record<FormaPagamento, string> = {
  cartao_entrega: "Cartão na entrega",
  cupom: "Cupom",
  pix: "PIX",
  boleto: "Boleto",
};
const LABEL_FISCAL: Record<TipoFiscal, string> = {
  cupom: "Cupom fiscal",
  nota: "Nota fiscal",
};

// Insere pedido + itens. Gera o id no cliente (anon não tem SELECT).
export async function salvarPedido(
  dados: DadosPedido,
  itens: CartItem[],
): Promise<string> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const total = itens.reduce((s, i) => s + i.preco_unit * i.quantidade, 0);

  const { error } = await supabase.from("pedidos").insert({
    id,
    origem: dados.origem ?? "site",
    ...dados,
    total,
  });
  if (error) throw error;

  const rows = itens.map((i) => ({
    pedido_id: id,
    produto_id: i.produto_id,
    nome: i.nome,
    variante: i.variante ?? null,
    preco_unit: i.preco_unit,
    quantidade: i.quantidade,
    subtotal: i.preco_unit * i.quantidade,
  }));
  const { error: e2 } = await supabase.from("pedido_itens").insert(rows);
  if (e2) throw e2;

  return id;
}

// Monta a mensagem de WhatsApp do pedido.
export function mensagemWhatsApp(dados: DadosPedido, itens: CartItem[]): string {
  const total = itens.reduce((s, i) => s + i.preco_unit * i.quantidade, 0);
  const linhas: string[] = ["*Novo pedido — BG Atacado*", ""];

  if (dados.vendedor_nome) linhas.push(`*Vendedor:* ${dados.vendedor_nome}`);
  if (dados.cliente_nome) linhas.push(`*Cliente:* ${dados.cliente_nome}`);
  if (dados.cliente_telefone) linhas.push(`*Telefone:* ${dados.cliente_telefone}`);
  if (dados.cliente_doc) linhas.push(`*CPF/CNPJ:* ${dados.cliente_doc}`);

  const end = [
    dados.endereco,
    dados.numero_end && `nº ${dados.numero_end}`,
    dados.bairro,
    dados.cidade && dados.uf ? `${dados.cidade}/${dados.uf}` : dados.cidade,
    dados.cep && `CEP ${dados.cep}`,
    dados.complemento,
  ]
    .filter(Boolean)
    .join(", ");
  if (end) linhas.push(`*Endereço:* ${end}`);

  linhas.push("", "*Itens:*");
  for (const i of itens) {
    const vol = i.variante ? ` ${i.variante}` : "";
    linhas.push(
      `• ${i.quantidade}x ${i.nome}${vol} — ${brl(i.preco_unit * i.quantidade)}`,
    );
  }
  linhas.push("", `*Total: ${brl(total)}*`);

  if (dados.tipo_fiscal) linhas.push(`*Tipo fiscal:* ${LABEL_FISCAL[dados.tipo_fiscal]}`);
  if (dados.forma_pagamento)
    linhas.push(`*Pagamento:* ${LABEL_PAGAMENTO[dados.forma_pagamento]}`);
  if (dados.entrega) linhas.push(`*Entrega:* ${dados.entrega}`);
  if (dados.observacao) linhas.push(`*Observação:* ${dados.observacao}`);

  return linhas.join("\n");
}

export function whatsappHref(dados: DadosPedido, itens: CartItem[]): string {
  return `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(
    mensagemWhatsApp(dados, itens),
  )}`;
}
