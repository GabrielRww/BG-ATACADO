import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Search, Package } from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { categoriaPorSlug, type CategoriaInfo } from "@/lib/categorias";

const WHATS_NUMBER = "5554991242948";
const WHATS_LINK = `https://wa.me/${WHATS_NUMBER}`;

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

function whatsappLink(p: Produto) {
  const preco = p.preco > 0 ? ` (${brl(p.preco)})` : "";
  const msg = `Olá! Tenho interesse no produto *${p.nome}*${preco}. Pode me passar mais informações?`;
  return `${WHATS_LINK}?text=${encodeURIComponent(msg)}`;
}

async function fetchPorCategoria(nome: string): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("categoria", nome)
    .eq("ativo", true)
    .order("subcategoria", { ascending: true, nullsFirst: false })
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Produto[];
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
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square bg-secondary/40 overflow-hidden">
        {p.imagem_url ? (
          <img src={p.imagem_url} alt={p.nome} loading="lazy" className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package size={44} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display tracking-tight font-bold text-[15px] leading-snug text-foreground line-clamp-2">
          {p.nome}
        </h3>
        {p.marca && <span className="text-[11px] text-muted-foreground mt-0.5">{p.marca}</span>}
        {p.descricao && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>
        )}
        <div className="mt-3 flex-1 flex items-end">
          {p.preco > 0 && (
            <span className="font-display font-bold text-lg leading-tight" style={{ color: "var(--color-primary-dark)" }}>
              {brl(p.preco)}
            </span>
          )}
        </div>
        <a
          href={whatsappLink(p)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: "var(--color-whatsapp)" }}
        >
          <MessageCircle size={16} /> {p.preco > 0 ? "Comprar no WhatsApp" : "Consultar no WhatsApp"}
        </a>
      </div>
    </motion.article>
  );
}

function CategoriaPage() {
  const { slug } = Route.useParams();
  const cat = categoriaPorSlug(slug)!;
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["produtos", "categoria", cat.nome],
    queryFn: () => fetchPorCategoria(cat.nome),
  });

  // Filtra por busca e agrupa por subcategoria preservando a ordem do banco.
  const grupos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data ?? []).filter(
      (p) =>
        !q ||
        p.nome.toLowerCase().includes(q) ||
        (p.descricao ?? "").toLowerCase().includes(q) ||
        (p.marca ?? "").toLowerCase().includes(q),
    );
    const map = new Map<string, Produto[]>();
    for (const p of list) {
      const key = p.subcategoria?.trim() || "Outros";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [data, search]);

  const total = grupos.reduce((n, [, items]) => n + items.length, 0);

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item..."
              className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-lg outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>
        </div>
      </section>

      <section className="container-wide py-14">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Carregando...
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
              {search ? "Nenhum item encontrado" : "Catálogo em montagem"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {search
                ? "Tente outro termo de busca."
                : "Os itens desta categoria ainda estão sendo cadastrados. Fale conosco que ajudamos pelo WhatsApp."}
            </p>
            {!search && (
              <a href={WHATS_LINK} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
                <MessageCircle size={18} /> Falar no WhatsApp
              </a>
            )}
          </div>
        )}

        {!isLoading && !isError && total > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-8">
              {total} {total === 1 ? "item" : "itens"}
              {search ? ` para “${search}”` : ""}
            </p>
            <div className="space-y-12">
              {grupos.map(([sub, items]) => (
                <div key={sub}>
                  <h2 className="font-display tracking-tight font-bold text-xl mb-5 flex items-center gap-3">
                    {sub}
                    <span className="h-px flex-1 bg-black/10" />
                    <span className="text-sm font-normal text-muted-foreground">{items.length}</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {items.map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
