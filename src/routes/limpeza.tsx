import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Search, Package, Sparkles } from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import type { Produto, Variante } from "@/lib/types";

const WHATS_NUMBER = "5554991242948";
const WHATS_LINK = `https://wa.me/${WHATS_NUMBER}`;

export const Route = createFileRoute("/limpeza")({
  head: () => ({
    meta: [
      { title: "Linha de Limpeza — BG Atacado" },
      {
        name: "description",
        content:
          "Catálogo completo da linha de limpeza da BG Atacado: detergentes, desinfetantes, amaciantes, automotiva e muito mais. Peça pelo WhatsApp.",
      },
    ],
  }),
  component: LimpezaPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Remove o sufixo de volumes do nome (ex.: "Detergente Neutro 5L | 2L | 50L"
// -> "Detergente Neutro"), já que o volume é mostrado no seletor.
function nomeLimpo(nome: string) {
  return nome
    .replace(
      /\s+\d+(?:[.,]\d+)?\s*(?:L|Kg|g|ml)(?:\s*\|\s*\d+(?:[.,]\d+)?\s*(?:L|Kg|g|ml))*\s*$/i,
      "",
    )
    .trim();
}

function whatsappLink(p: Produto, v?: Variante) {
  const vol = v && v.volume.toLowerCase() !== "único" ? ` ${v.volume}` : "";
  const preco = v ? ` (${brl(v.preco)})` : p.preco ? ` (a partir de ${brl(p.preco)})` : "";
  const msg = `Olá! Tenho interesse no produto *${nomeLimpo(p.nome)}${vol}*${preco}. Pode me passar mais informações?`;
  return `${WHATS_LINK}?text=${encodeURIComponent(msg)}`;
}

async function fetchProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*, produto_variantes(volume, preco, ordem)")
    .eq("categoria", "Limpeza")
    .eq("ativo", true)
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Produto[];
}

function CatalogHeader() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="container-wide flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="BG Atacado"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5"
          />
          <div className="leading-tight">
            <div className="font-display tracking-tight text-xl font-bold text-foreground">
              BG Atacado
            </div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
              Linha de Limpeza
            </div>
          </div>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary-dark transition-colors"
        >
          <ArrowLeft size={16} /> Voltar à home
        </Link>
      </div>
    </header>
  );
}

function ProductCard({ p }: { p: Produto }) {
  const variantes = useMemo(
    () => [...(p.produto_variantes ?? [])].sort((a, b) => a.ordem - b.ordem),
    [p.produto_variantes],
  );
  const [sel, setSel] = useState(0);
  const variante = variantes[sel];
  const precoAtual = variante ? variante.preco : p.preco;
  const temSeletor = variantes.length > 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square bg-secondary/40 overflow-hidden">
        {p.imagem_url ? (
          <img
            src={p.imagem_url}
            alt={nomeLimpo(p.nome)}
            loading="lazy"
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package size={48} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display tracking-tight font-bold text-[15px] leading-snug text-foreground line-clamp-2">
          {nomeLimpo(p.nome)}
        </h3>
        {p.descricao && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {p.descricao}
          </p>
        )}

        {/* Seletor de volume */}
        {temSeletor && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {variantes.map((vr, i) => {
              const ativo = i === sel;
              return (
                <button
                  key={vr.volume}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
                    ativo
                      ? "text-white border-transparent"
                      : "text-foreground/70 border-black/10 hover:border-primary-dark/40"
                  }`}
                  style={ativo ? { background: "var(--color-primary-dark)" } : undefined}
                >
                  {vr.volume}
                </button>
              );
            })}
          </div>
        )}

        {/* Preço */}
        <div className="mt-3 flex-1 flex items-end">
          {precoAtual > 0 && (
            <div>
              {!temSeletor && (
                <span className="text-[10px] text-muted-foreground block leading-none">
                  {variante && variante.volume.toLowerCase() !== "único"
                    ? variante.volume
                    : "preço"}
                </span>
              )}
              <span
                className="font-display font-bold text-lg leading-tight"
                style={{ color: "var(--color-primary-dark)" }}
              >
                {brl(precoAtual)}
              </span>
            </div>
          )}
        </div>

        <a
          href={whatsappLink(p, variante)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: "var(--color-whatsapp)" }}
        >
          <MessageCircle size={16} /> Comprar no WhatsApp
        </a>
      </div>
    </motion.article>
  );
}

function LimpezaPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["produtos", "Limpeza"],
    queryFn: fetchProdutos,
  });

  const produtos = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.descricao ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <main className="min-h-screen bg-background">
      <CatalogHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden py-16"
        style={{ background: "linear-gradient(135deg, #1A5C3A 0%, #2E8B57 100%)" }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.06] text-white" aria-hidden="true" />
        <div className="container-wide relative text-white text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/15">
            <Sparkles size={14} /> Linha de Limpeza
          </span>
          <h1 className="mt-5 font-display tracking-tight font-bold text-3xl sm:text-4xl lg:text-5xl">
            Produtos de limpeza para casa, lavanderia e automotiva
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Escolha o produto e finalize seu pedido direto no nosso WhatsApp.
          </p>

          <div className="mt-8 relative max-w-md mx-auto">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto (ex.: detergente, amaciante...)"
              className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-lg outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>
        </div>
      </section>

      {/* Grade */}
      <section className="container-wide py-14">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden"
              >
                <div className="aspect-square bg-secondary/50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-full" />
                  <div className="h-9 bg-secondary rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              Não foi possível carregar os produtos agora. Fale conosco pelo
              WhatsApp.
            </p>
            <a
              href={WHATS_LINK}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-flex"
            >
              <MessageCircle size={18} /> Falar no WhatsApp
            </a>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {produtos.length}{" "}
              {produtos.length === 1 ? "produto" : "produtos"}
              {search ? ` para “${search}”` : ""}
            </p>
            {produtos.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {produtos.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA */}
      <section className="container-wide pb-20">
        <div
          className="rounded-3xl px-8 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row items-center gap-6 justify-between"
          style={{ background: "linear-gradient(120deg, #1A5C3A 0%, #2E8B57 100%)" }}
        >
          <div className="text-white text-center md:text-left">
            <h3 className="font-display tracking-tight text-2xl sm:text-3xl font-bold">
              Não encontrou o que precisava?
            </h3>
            <p className="text-white/80 mt-1">Fale conosco pelo WhatsApp :)</p>
          </div>
          <a
            href={WHATS_LINK}
            target="_blank"
            rel="noreferrer"
            className="btn-light btn-shine"
          >
            <MessageCircle size={18} /> (54) 99124-2948
          </a>
        </div>
      </section>
    </main>
  );
}
