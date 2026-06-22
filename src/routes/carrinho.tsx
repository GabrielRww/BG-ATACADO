import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Package,
} from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { useCart } from "@/lib/cart";
import {
  brl,
  salvarPedido,
  whatsappHref,
  type DadosPedido,
  type FormaPagamento,
  type TipoFiscal,
} from "@/lib/pedidos";

export const Route = createFileRoute("/carrinho")({
  component: CarrinhoPage,
});

type FormState = {
  nome: string;
  telefone: string;
  tipo_fiscal: TipoFiscal;
  forma_pagamento: FormaPagamento;
  entrega: string;
  observacao: string;
};

const FORM_VAZIO: FormState = {
  nome: "",
  telefone: "",
  tipo_fiscal: "cupom",
  forma_pagamento: "pix",
  entrega: "",
  observacao: "",
};

function Header() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="container-wide flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="BG Atacado" width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5" />
          <div className="font-display tracking-tight text-xl font-bold text-foreground">BG Atacado</div>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary-dark transition-colors">
          <ArrowLeft size={16} /> Continuar comprando
        </Link>
      </div>
    </header>
  );
}

function CarrinhoPage() {
  const { items, updateQtd, removeItem, clear, totalPrice } = useCart();
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<{ href: string } | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function finalizar() {
    setErro(null);
    if (items.length === 0) return;
    if (!form.nome.trim() || !form.telefone.trim()) {
      setErro("Preencha seu nome e telefone para finalizar.");
      return;
    }
    setEnviando(true);
    const dados: DadosPedido = {
      origem: "site",
      cliente_nome: form.nome.trim(),
      cliente_telefone: form.telefone.trim(),
      tabela_preco: "cupom",
      tipo_fiscal: form.tipo_fiscal,
      forma_pagamento: form.forma_pagamento,
      entrega: form.entrega.trim() || null,
      observacao: form.observacao.trim() || null,
    };
    try {
      await salvarPedido(dados, items);
      const href = whatsappHref(dados, items);
      window.open(href, "_blank");
      clear();
      setEnviado({ href });
    } catch (e) {
      setErro("Não foi possível enviar o pedido: " + (e as Error).message);
    }
    setEnviando(false);
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container-wide py-24 text-center max-w-lg mx-auto">
          <CheckCircle2 size={56} className="mx-auto mb-4 text-[var(--color-whatsapp,#25D366)]" />
          <h1 className="font-display font-bold text-2xl">Pedido enviado!</h1>
          <p className="mt-2 text-muted-foreground">
            Recebemos seu pedido e abrimos o WhatsApp pra você confirmar. Se a janela não abriu, use o botão abaixo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={enviado.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--color-whatsapp,#25D366)" }}>
              <MessageCircle size={18} /> Abrir WhatsApp
            </a>
            <Link to="/" className="btn-ghost">Voltar à loja</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container-wide py-10">
        <h1 className="font-display font-bold text-2xl sm:text-3xl mb-6">Seu carrinho</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag size={44} className="mx-auto mb-3 opacity-50" />
            Seu carrinho está vazio.
            <div className="mt-6">
              <Link to="/" className="btn-primary inline-flex">Ver produtos</Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Itens */}
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.key} className="flex gap-3 bg-white rounded-2xl ring-1 ring-black/5 p-3">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary/50 overflow-hidden flex items-center justify-center">
                    {i.imagem_url ? (
                      <img src={i.imagem_url} alt={i.nome} className="h-full w-full object-contain" />
                    ) : (
                      <Package size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug">
                      {i.nome}
                      {i.variante ? <span className="text-muted-foreground"> · {i.variante}</span> : null}
                    </h3>
                    <p className="font-display font-bold mt-0.5" style={{ color: "var(--color-primary-dark)" }}>{brl(i.preco_unit)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center rounded-lg ring-1 ring-black/10 overflow-hidden">
                        <button onClick={() => updateQtd(i.key, i.quantidade - 1)} className="px-2.5 py-1.5 hover:bg-secondary" aria-label="Diminuir"><Minus size={14} /></button>
                        <span className="w-9 text-center text-sm font-medium">{i.quantidade}</span>
                        <button onClick={() => updateQtd(i.key, i.quantidade + 1)} className="px-2.5 py-1.5 hover:bg-secondary" aria-label="Aumentar"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeItem(i.key)} className="ml-auto p-2 rounded-lg text-foreground/50 hover:bg-red-50 hover:text-red-600" aria-label="Remover"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-semibold text-sm">{brl(i.preco_unit * i.quantidade)}</div>
                </div>
              ))}
              <button onClick={clear} className="text-sm text-red-600 hover:underline">Limpar carrinho</button>
            </div>

            {/* Resumo + checkout */}
            <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5 lg:sticky lg:top-24 space-y-4">
              <div className="flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span style={{ color: "var(--color-primary-dark)" }}>{brl(totalPrice)}</span>
              </div>

              <div className="space-y-3 border-t pt-4">
                <Campo label="Seu nome *">
                  <input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome completo" className="inp" />
                </Campo>
                <Campo label="Telefone / WhatsApp *">
                  <input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(54) 9 9999-9999" className="inp" />
                </Campo>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Tipo fiscal">
                    <select value={form.tipo_fiscal} onChange={(e) => set("tipo_fiscal", e.target.value as TipoFiscal)} className="inp">
                      <option value="cupom">Cupom fiscal</option>
                      <option value="nota">Nota fiscal</option>
                    </select>
                  </Campo>
                  <Campo label="Pagamento">
                    <select value={form.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value as FormaPagamento)} className="inp">
                      <option value="pix">PIX</option>
                      <option value="cartao_entrega">Cartão na entrega</option>
                      <option value="cupom">Cupom</option>
                      <option value="boleto">Boleto</option>
                    </select>
                  </Campo>
                </div>

                {form.forma_pagamento === "pix" && (
                  <p className="text-[11px] rounded-lg bg-secondary px-3 py-2 text-foreground/70">A chave PIX será enviada no WhatsApp após a confirmação.</p>
                )}

                <Campo label="Entrega (endereço / observações)">
                  <textarea value={form.entrega} onChange={(e) => set("entrega", e.target.value)} rows={2} placeholder="Ex.: Rua X, 123 — Centro. Entregar pela manhã." className="inp resize-none" />
                </Campo>
                <Campo label="Observação">
                  <textarea value={form.observacao} onChange={(e) => set("observacao", e.target.value)} rows={2} placeholder="Alguma observação do pedido?" className="inp resize-none" />
                </Campo>
              </div>

              {erro && <p className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{erro}</p>}

              <button onClick={finalizar} disabled={enviando} className="btn-primary w-full justify-center disabled:opacity-60">
                {enviando ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                Finalizar pedido
              </button>
              <p className="text-[11px] text-center text-muted-foreground">O pedido é registrado e enviado pro nosso WhatsApp pra confirmação.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
