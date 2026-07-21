import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Search, Package, Loader2, ShoppingCart } from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { brl, WHATS_NUMBER } from "@/lib/pedidos";

const WHATS_LINK = `https://wa.me/${WHATS_NUMBER}`;
const PAGE = 48;
// Abaixo disso a busca não dispara: evita varrer a tabela inteira com 1 letra.
const MIN_TERMO = 2;

type BuscaSearch = { q: string };

export const Route = createFileRoute("/busca")({
  // `q` na URL deixa a busca compartilhável e sobrevive ao refresh/voltar.
  validateSearch: (search: Record<string, unknown>): BuscaSearch => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Busca — BG Atacado" },
      { name: "description", content: "Busque qualquer produto do catálogo da BG Atacado pelo nome." },
    ],
  }),
  component: BuscaPage,
});

// Preço público = tabela cupom (consumidor); fallback p/ o legado `preco`.
const precoPublico = (p: Produto) => p.preco_cupom ?? p.preco;

// Remove caracteres que quebrariam o filtro do PostgREST.
const sanitize = (s: string) => s.replace(/[,()*%]/g, " ").trim();

function whatsappLink(p: Produto) {
  const pp = precoPublico(p);
  const preco = pp > 0 ? ` (${brl(pp)})` : "";
  const msg = `Olá! Tenho interesse no produto *${p.nome}*${preco}. Pode me passar mais informações?`;
  return `${WHATS_LINK}?text=${encodeURIComponent(msg)}`;
}

type Pagina = { itens: Produto[]; total: number; proximo: number | null };

// Busca global por nome, em TODAS as categorias (só produtos ativos).
// Cada palavra digitada precisa aparecer no nome, em qualquer ordem: "post-it
// neon" acha "BLOCO POST-IT 038X050 C/4 NEON 3M". ilikes encadeados no mesmo
// campo são combinados com AND pelo PostgREST — é o que dá esse comportamento.
async function fetchPagina(termo: string, offset: number): Promise<Pagina> {
  const palavras = sanitize(termo).split(/\s+/).filter(Boolean).slice(0, 6);
  let q = supabase
    .from("produtos")
    .select("*", { count: "exact" })
    .eq("ativo", true);
  for (const palavra of palavras) q = q.ilike("nome", `%${palavra}%`);
  const { data, error, count } = await q
    .order("nome")
    .range(offset, offset + PAGE - 1);
  if (error) throw error;
  const itens = (data ?? []) as Produto[];
  const proximo = offset + PAGE < (count ?? 0) ? offset + PAGE : null;
  return { itens, total: count ?? 0, proximo };
}

function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function BuscaHeader() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="container-wide flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="BG Atacado" width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5" />
          <div className="leading-tight">
            <div className="font-display tracking-tight text-xl font-bold text-foreground">BG Atacado</div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">Busca no catálogo</div>
          </div>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary-dark transition-colors">
          <ArrowLeft size={16} /> Voltar à home
        </Link>
      </div>
    </header>
  );
}

function ProductCard({ p }: { p: Produto }) {
  const { addItem } = useCart();
  const preco = precoPublico(p);
  function adicionar() {
    addItem({ produto_id: p.id, nome: p.nome, preco_unit: preco, imagem_url: p.imagem_url });
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <Link to="/produto/$id" params={{ id: p.id }} className="relative block aspect-square bg-secondary/40 overflow-hidden">
        {p.imagem_url ? (
          <img src={p.imagem_url} alt={p.nome} loading="lazy" className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package size={44} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {p.categoria && (
          <span className="text-[10px] uppercase tracking-wide text-primary-dark/70 font-semibold">
            {p.categoria}
            {p.subcategoria ? ` · ${p.subcategoria}` : ""}
          </span>
        )}
        <Link to="/produto/$id" params={{ id: p.id }} className="mt-0.5 font-display tracking-tight font-bold text-[14px] leading-snug text-foreground line-clamp-2 hover:text-primary-dark transition-colors">
          {p.nome}
        </Link>
        {p.marca && <span className="text-[11px] text-muted-foreground mt-0.5">{p.marca}</span>}
        <div className="mt-3 flex-1 flex items-end">
          {preco > 0 && (
            <span className="font-display font-bold text-lg leading-tight" style={{ color: "var(--color-primary-dark)" }}>
              {brl(preco)}
            </span>
          )}
        </div>
        {preco > 0 ? (
          <div className="mt-3 flex gap-2">
            <Link to="/produto/$id" params={{ id: p.id }} className="inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 ring-black/10 text-foreground/70 hover:border-primary-dark/40 transition-colors">
              Ver
            </Link>
            <button type="button" onClick={adicionar} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "var(--color-primary-dark)" }}>
              <ShoppingCart size={16} /> Adicionar
            </button>
          </div>
        ) : (
          <a href={whatsappLink(p)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "var(--color-whatsapp)" }}>
            <MessageCircle size={16} /> Consultar no WhatsApp
          </a>
        )}
      </div>
    </motion.article>
  );
}

function BuscaPage() {
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const [busca, setBusca] = useState(q);
  const termo = useDebounce(busca.trim(), 350);
  const ativo = termo.length >= MIN_TERMO;

  // Mantém a URL (?q=) em sincronia com o que foi digitado — sem realimentar o
  // input, então não há loop. Deixa a busca compartilhável e o "voltar" coerente.
  useEffect(() => {
    if (termo !== q) {
      navigate({ to: "/busca", search: termo ? { q: termo } : { q: "" }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo]);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["busca", termo],
      queryFn: ({ pageParam }) => fetchPagina(termo, pageParam),
      initialPageParam: 0,
      getNextPageParam: (last) => last.proximo,
      enabled: ativo,
    });

  const itens = data?.pages.flatMap((p) => p.itens) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <BuscaHeader />

      {/* Hero + campo de busca */}
      <section className="relative overflow-hidden py-16" style={{ background: "linear-gradient(135deg, #1A5C3A 0%, #2E8B57 100%)" }}>
        <div className="absolute inset-0 dot-grid opacity-[0.06] text-white" aria-hidden="true" />
        <div className="container-wide relative text-white text-center max-w-2xl mx-auto">
          <h1 className="font-display tracking-tight font-bold text-3xl sm:text-4xl lg:text-5xl">
            Buscar produtos
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Digite o nome do produto e encontre em todo o catálogo.
          </p>
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: caneta, post-it, papel A4..."
              className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-lg outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>
        </div>
      </section>

      <section className="container-wide py-14">
        {!ativo && (
          <div className="text-center py-16 max-w-md mx-auto text-muted-foreground">
            <Search size={44} className="mx-auto mb-4 opacity-50" />
            <p>Digite pelo menos {MIN_TERMO} letras para buscar.</p>
          </div>
        )}

        {ativo && isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} /> Buscando...
          </div>
        )}

        {ativo && isError && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Não foi possível buscar agora.</p>
            <a href={WHATS_LINK} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
              <MessageCircle size={18} /> Falar no WhatsApp
            </a>
          </div>
        )}

        {ativo && !isLoading && !isError && total === 0 && (
          <div className="text-center py-16 max-w-md mx-auto">
            <Package size={44} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="font-display font-bold text-xl">Nenhum produto encontrado</h2>
            <p className="mt-2 text-muted-foreground">
              Tente outro termo — ex.: parte do nome, marca ou tipo do produto.
            </p>
          </div>
        )}

        {ativo && !isLoading && !isError && total > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {total} {total === 1 ? "resultado" : "resultados"} para “{termo}”
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {itens.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn-primary inline-flex disabled:opacity-60"
                >
                  {isFetchingNextPage ? <Loader2 size={18} className="animate-spin" /> : null}
                  Carregar mais ({itens.length} de {total})
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
