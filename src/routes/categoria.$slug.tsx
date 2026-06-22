import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Search, Package, Loader2, ShoppingCart } from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { categoriaPorSlug, type CategoriaInfo } from "@/lib/categorias";
import { useCart } from "@/lib/cart";

const WHATS_NUMBER = "5554991242948";
const WHATS_LINK = `https://wa.me/${WHATS_NUMBER}`;
const PAGE = 48;

export const Route = createFileRoute("/categoria/$slug")({
  beforeLoad: ({ params }) => {
    if (!categoriaPorSlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const cat = categoriaPorSlug(params.slug);
    return {
      meta: [
        { title: `${cat?.nome ?? "Categoria"} — BG Atacado` },
        {
          name: "description",
          content: `Confira os itens de ${cat?.nome ?? "nossa loja"} na BG Atacado. Peça pelo WhatsApp.`,
        },
      ],
    };
  },
  component: CategoriaPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Preço público = tabela cupom (consumidor); fallback p/ o legado `preco`.
const precoPublico = (p: Produto) => p.preco_cupom ?? p.preco;

function whatsappLink(p: Produto) {
  const pp = precoPublico(p);
  const preco = pp > 0 ? ` (${brl(pp)})` : "";
  const msg = `Olá! Tenho interesse no produto *${p.nome}*${preco}. Pode me passar mais informações?`;
  return `${WHATS_LINK}?text=${encodeURIComponent(msg)}`;
}

// Remove caracteres que quebrariam o filtro do PostgREST.
const sanitize = (s: string) => s.replace(/[,()*%]/g, " ").trim();

type Pagina = { itens: Produto[]; total: number; proximo: number | null };

async function fetchPagina(nome: string, termo: string, offset: number): Promise<Pagina> {
  let q = supabase
    .from("produtos")
    .select("*", { count: "exact" })
    .eq("categoria", nome)
    .eq("ativo", true);
  const t = sanitize(termo);
  if (t) q = q.ilike("nome", `%${t}%`);
  q = q
    .order("subcategoria", { ascending: true, nullsFirst: false })
    .order("nome")
    .range(offset, offset + PAGE - 1);
  const { data, error, count } = await q;
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

function CatalogHeader({ cat }: { cat: CategoriaInfo }) {
  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="container-wide flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="BG Atacado" width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5" />
          <div className="leading-tight">
            <div className="font-display tracking-tight text-xl font-bold text-foreground">BG Atacado</div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">{cat.nome}</div>
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
        {p.subcategoria && (
          <span className="text-[10px] uppercase tracking-wide text-primary-dark/70 font-semibold">{p.subcategoria}</span>
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

function CategoriaPage() {
  const { slug } = Route.useParams();
  const cat = categoriaPorSlug(slug)!;
  const [busca, setBusca] = useState("");
  const termo = useDebounce(busca, 350);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["categoria", cat.nome, termo],
      queryFn: ({ pageParam }) => fetchPagina(cat.nome, termo, pageParam),
      initialPageParam: 0,
      getNextPageParam: (last) => last.proximo,
    });

  const itens = data?.pages.flatMap((p) => p.itens) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <CatalogHeader cat={cat} />

      {/* Hero */}
      <section className="relative overflow-hidden py-16" style={{ background: "linear-gradient(135deg, #1A5C3A 0%, #2E8B57 100%)" }}>
        <div className="absolute inset-0 dot-grid opacity-[0.06] text-white" aria-hidden="true" />
        <div className="container-wide relative text-white text-center max-w-2xl mx-auto">
          <h1 className="font-display tracking-tight font-bold text-3xl sm:text-4xl lg:text-5xl">
            {cat.nome}
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Escolha o item e fale com a gente direto no WhatsApp.
          </p>
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar item..."
              className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-lg outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>
        </div>
      </section>

      <section className="container-wide py-14">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} /> Carregando...
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Não foi possível carregar os itens agora.</p>
            <a href={WHATS_LINK} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
              <MessageCircle size={18} /> Falar no WhatsApp
            </a>
          </div>
        )}

        {!isLoading && !isError && total === 0 && (
          <div className="text-center py-16 max-w-md mx-auto">
            <Package size={44} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="font-display font-bold text-xl">
              {termo ? "Nenhum item encontrado" : "Catálogo em montagem"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {termo ? "Tente outro termo de busca." : "Os itens desta categoria ainda estão sendo cadastrados."}
            </p>
          </div>
        )}

        {!isLoading && !isError && total > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {total} {total === 1 ? "item" : "itens"}
              {termo ? ` para “${termo}”` : ""}
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

      {/* CTA */}
      <section className="container-wide pb-20">
        <div className="rounded-3xl px-8 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row items-center gap-6 justify-between" style={{ background: "linear-gradient(120deg, #1A5C3A 0%, #2E8B57 100%)" }}>
          <div className="text-white text-center md:text-left">
            <h3 className="font-display tracking-tight text-2xl sm:text-3xl font-bold">Não encontrou o que precisava?</h3>
            <p className="text-white/80 mt-1">Fale conosco pelo WhatsApp :)</p>
          </div>
          <a href={WHATS_LINK} target="_blank" rel="noreferrer" className="btn-light btn-shine">
            <MessageCircle size={18} /> (54) 99124-2948
          </a>
        </div>
      </section>
    </main>
  );
}
