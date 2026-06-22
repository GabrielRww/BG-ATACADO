import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  Minus,
  Plus,
  MessageCircle,
  Loader2,
} from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import type { Produto, Variante } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { brl, WHATS_NUMBER } from "@/lib/pedidos";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoPage,
});

const precoPublico = (x: { preco: number; preco_cupom?: number | null }) =>
  x.preco_cupom ?? x.preco;

// Tira o sufixo de volumes do nome ("Detergente 5L | 2L" -> "Detergente").
function nomeLimpo(nome: string) {
  return nome
    .replace(
      /\s+\d+(?:[.,]\d+)?\s*(?:L|Kg|g|ml)(?:\s*\|\s*\d+(?:[.,]\d+)?\s*(?:L|Kg|g|ml))*\s*$/i,
      "",
    )
    .trim();
}

async function fetchProduto(id: string): Promise<Produto | null> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*, produto_variantes(volume, preco, preco_cupom, ordem)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Produto) ?? null;
}

function Header() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="container-wide flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="BG Atacado" width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5" />
          <div className="font-display tracking-tight text-xl font-bold text-foreground">BG Atacado</div>
        </Link>
        <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary-dark transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    </header>
  );
}

function ProdutoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: p, isLoading, isError } = useQuery({
    queryKey: ["produto", id],
    queryFn: () => fetchProduto(id),
  });

  const variantes = useMemo(
    () => [...(p?.produto_variantes ?? [])].sort((a, b) => a.ordem - b.ordem),
    [p],
  );
  const [sel, setSel] = useState(0);
  const [qtd, setQtd] = useState(1);

  const variante: Variante | undefined = variantes[sel];
  const preco = p ? (variante ? precoPublico(variante) : precoPublico(p)) : 0;
  const temPreco = preco > 0;
  const temSeletor = variantes.length > 1;

  function adicionar() {
    if (!p || !temPreco) return;
    addItem(
      {
        produto_id: p.id,
        nome: nomeLimpo(p.nome),
        variante: variante && variante.volume.toLowerCase() !== "único" ? variante.volume : null,
        preco_unit: preco,
        imagem_url: p.imagem_url,
      },
      qtd,
    );
    navigate({ to: "/carrinho" });
  }

  const whatsapp = p
    ? `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(
        `Olá! Tenho interesse no produto *${nomeLimpo(p.nome)}*${variante && variante.volume.toLowerCase() !== "único" ? ` ${variante.volume}` : ""}. Pode me passar mais informações?`,
      )}`
    : "#";

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-primary-dark" size={28} />
        </div>
      ) : isError || !p ? (
        <div className="container-wide py-24 text-center text-muted-foreground">
          <Package size={44} className="mx-auto mb-3 opacity-50" />
          Produto não encontrado.
          <div className="mt-6">
            <Link to="/" className="btn-primary inline-flex">Voltar à loja</Link>
          </div>
        </div>
      ) : (
        <section className="container-wide py-10">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Imagem */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="rounded-3xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden aspect-square flex items-center justify-center"
            >
              {p.imagem_url ? (
                <img src={p.imagem_url} alt={nomeLimpo(p.nome)} className="h-full w-full object-contain p-8" />
              ) : (
                <Package size={72} className="text-muted-foreground" />
              )}
            </motion.div>

            {/* Info */}
            <div>
              {p.subcategoria && (
                <span className="text-[11px] uppercase tracking-wide text-primary-dark/70 font-semibold">{p.subcategoria}</span>
              )}
              <h1 className="mt-1 font-display tracking-tight font-bold text-2xl sm:text-3xl text-foreground">
                {nomeLimpo(p.nome)}
              </h1>
              {p.marca && <p className="mt-1 text-sm text-muted-foreground">{p.marca}</p>}

              {p.descricao && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{p.descricao}</p>
              )}

              {/* Seletor de volume */}
              {temSeletor && (
                <div className="mt-6">
                  <span className="text-xs font-semibold text-foreground/70">Volume</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variantes.map((vr, i) => {
                      const ativo = i === sel;
                      return (
                        <button
                          key={vr.volume}
                          type="button"
                          onClick={() => setSel(i)}
                          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold border transition-colors ${
                            ativo ? "text-white border-transparent" : "text-foreground/70 border-black/10 hover:border-primary-dark/40"
                          }`}
                          style={ativo ? { background: "var(--color-primary-dark)" } : undefined}
                        >
                          {vr.volume}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preço */}
              <div className="mt-6">
                {temPreco ? (
                  <div className="font-display font-bold text-3xl" style={{ color: "var(--color-primary-dark)" }}>
                    {brl(preco)}
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-muted-foreground">Preço a consultar</div>
                )}
              </div>

              {/* Ações */}
              {temPreco ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-xl ring-1 ring-black/10 overflow-hidden">
                    <button onClick={() => setQtd((q) => Math.max(1, q - 1))} className="px-3 py-2.5 hover:bg-secondary" aria-label="Diminuir">
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold">{qtd}</span>
                    <button onClick={() => setQtd((q) => q + 1)} className="px-3 py-2.5 hover:bg-secondary" aria-label="Aumentar">
                      <Plus size={16} />
                    </button>
                  </div>
                  <button onClick={adicionar} className="btn-primary flex-1 min-w-[200px] justify-center">
                    <ShoppingCart size={18} /> Adicionar ao carrinho
                  </button>
                </div>
              ) : (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--color-whatsapp)" }}>
                  <MessageCircle size={18} /> Consultar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
