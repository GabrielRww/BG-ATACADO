import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Loader2, LogOut, Plus, Pencil, Trash2, Upload, X, Package, ImageIcon, ExternalLink, Layers, Save,
  ClipboardList, Users, Check, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";

import { createClient } from "@supabase/supabase-js";

import logo from "@/assets/bg-logo.png";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { CATEGORIAS } from "@/lib/auth";
import { useVendedor } from "@/lib/vendedor";
import type { Produto } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — BG Atacado" }] }),
  component: AdminPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Faz upload de uma imagem para o Storage e devolve a URL pública.
async function uploadParaStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("catalogo").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("catalogo").getPublicUrl(path).data.publicUrl;
}

type FormState = {
  id: string | null;
  nome: string;
  categoria: string;
  subcategoria: string;
  marca: string;
  descricao: string;
  preco_revenda: string;
  preco_cupom: string;
  preco_empresa: string;
  imagem_url: string;
  ativo: boolean;
};

const FORM_VAZIO: FormState = {
  id: null,
  nome: "",
  categoria: CATEGORIAS[0],
  subcategoria: "",
  marca: "",
  descricao: "",
  preco_revenda: "",
  preco_cupom: "",
  preco_empresa: "",
  imagem_url: "",
  ativo: true,
};

// "12,50" / "12.50" -> 12.5 ; vazio -> null
const parsePreco = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const PAGE_ADMIN = 300; // produtos por página no admin

async function fetchProdutosAdmin(
  categoria: string,
  busca: string,
  pagina: number,
): Promise<{ itens: Produto[]; total: number }> {
  let q = supabase.from("produtos").select("*", { count: "exact" });
  if (categoria) q = q.eq("categoria", categoria);
  const t = busca.trim().replace(/[%,()*]/g, " ");
  if (t) q = q.ilike("nome", `%${t}%`);
  const from = pagina * PAGE_ADMIN;
  const { data, error, count } = await q.order("nome").range(from, from + PAGE_ADMIN - 1);
  if (error) throw error;
  return { itens: (data ?? []) as Produto[], total: count ?? 0 };
}

function AdminPage() {
  const navigate = useNavigate();
  const { session, vendedor, loading } = useVendedor();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
    else if (vendedor) navigate({ to: "/vendedor" }); // vendedor não acessa o admin
  }, [loading, session, vendedor, navigate]);

  if (loading || !session || vendedor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary-dark" size={28} />
      </div>
    );
  }

  return <AdminPanel email={session.user.email ?? ""} />;
}

function AdminPanel({ email }: { email: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filtroCat, setFiltroCat] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaDeb, setBuscaDeb] = useState("");
  const [pagina, setPagina] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setBuscaDeb(busca), 300);
    return () => clearTimeout(id);
  }, [busca]);
  useEffect(() => { setPagina(0); }, [filtroCat, buscaDeb]);
  const [selSet, setSelSet] = useState<Set<string>>(new Set());
  const toggleSel = (id: string) => setSelSet((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  useEffect(() => { setSelSet(new Set()); }, [filtroCat, buscaDeb, pagina]);
  const { data: pageData, isLoading } = useQuery({
    queryKey: ["admin", "produtos", filtroCat, buscaDeb, pagina],
    queryFn: () => fetchProdutosAdmin(filtroCat, buscaDeb, pagina),
  });
  const produtos = pageData?.itens;
  const total = pageData?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_ADMIN));
  const paginacao = total > PAGE_ADMIN ? (
    <div className="flex items-center justify-between gap-2 mb-3 text-sm">
      <span className="text-muted-foreground">
        {pagina * PAGE_ADMIN + 1}–{Math.min((pagina + 1) * PAGE_ADMIN, total)} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={pagina === 0} onClick={() => setPagina((p) => Math.max(0, p - 1))} className="btn-ghost disabled:opacity-40" aria-label="Anterior"><ChevronLeft size={16} /></button>
        <span className="font-medium">Pág. {pagina + 1}/{totalPaginas}</span>
        <button type="button" disabled={pagina >= totalPaginas - 1} onClick={() => setPagina((p) => p + 1)} className="btn-ghost disabled:opacity-40" aria-label="Próxima"><ChevronRight size={16} /></button>
      </div>
    </div>
  ) : null;

  const [modo, setModo] = useState<"individual" | "lote">("individual");
  const [aba, setAba] = useState<"catalogo" | "pedidos" | "vendedores">("catalogo");
  const { data: pendentes } = useQuery({
    queryKey: ["admin", "pedidos", "pendentes"],
    queryFn: async () => {
      const { count } = await supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente");
      return count ?? 0;
    },
  });
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImg, setEnviandoImg] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editando = form.id !== null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
    qc.invalidateQueries({ queryKey: ["produtos"] });
  };

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  async function uploadImagem(file: File) {
    setEnviandoImg(true);
    setMsg(null);
    try {
      const url = await uploadParaStorage(file);
      set("imagem_url", url);
    } catch (e) {
      setMsg("Falha ao enviar imagem: " + (e as Error).message);
    }
    setEnviandoImg(false);
  }

  function editar(p: Produto) {
    setModo("individual");
    setForm({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria ?? CATEGORIAS[0],
      subcategoria: p.subcategoria ?? "",
      marca: p.marca ?? "",
      descricao: p.descricao ?? "",
      preco_revenda: p.preco_revenda != null ? String(p.preco_revenda) : "",
      preco_cupom:
        p.preco_cupom != null ? String(p.preco_cupom) : p.preco ? String(p.preco) : "",
      preco_empresa: p.preco_empresa != null ? String(p.preco_empresa) : "",
      imagem_url: p.imagem_url ?? "",
      ativo: p.ativo,
    });
    setMsg(null);
    // Não rola pro topo: o formulário é fixo (sticky) e atualiza no lugar,
    // mantendo a posição do usuário na lista.
  }

  function cancelar() {
    setForm(FORM_VAZIO);
    setMsg(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setMsg("Informe o nome do produto.");
      return;
    }
    setSalvando(true);
    setMsg(null);
    const pCupom = parsePreco(form.preco_cupom);
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      subcategoria: form.subcategoria.trim() || null,
      marca: form.marca.trim() || null,
      descricao: form.descricao.trim() || null,
      preco_revenda: parsePreco(form.preco_revenda),
      preco_cupom: pCupom,
      preco_empresa: parsePreco(form.preco_empresa),
      // legado: mantém `preco` = cupom (preço público) p/ compatibilidade.
      preco: pCupom ?? 0,
      imagem_url: form.imagem_url || null,
      ativo: form.ativo,
    };
    const { error } = form.id
      ? await supabase.from("produtos").update(payload).eq("id", form.id)
      : await supabase.from("produtos").insert(payload);
    setSalvando(false);
    if (error) {
      setMsg("Erro ao salvar: " + error.message);
      return;
    }
    setMsg(form.id ? "Produto atualizado!" : "Produto cadastrado!");
    cancelar();
    invalidar();
  }

  async function excluir(p: Produto) {
    if (!window.confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) {
      setMsg("Erro ao excluir: " + error.message);
      return;
    }
    if (form.id === p.id) cancelar();
    invalidar();
  }

  async function excluirSelecionados() {
    if (selSet.size === 0) return;
    if (!window.confirm(`Excluir ${selSet.size} produto(s) selecionado(s)? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("produtos").delete().in("id", [...selSet]);
    if (error) { setMsg("Erro ao excluir: " + error.message); return; }
    setSelSet(new Set());
    invalidar();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="container-wide flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="font-display font-bold text-lg">Painel do Catálogo</div>
              <div className="text-[11px] text-muted-foreground">{email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-ghost hidden sm:inline-flex">
              <ExternalLink size={16} /> Ver site
            </Link>
            <button onClick={logout} className="btn-ghost">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-wide py-8">
        {/* Abas principais */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-secondary p-1 max-w-xl mb-6">
          {([
            ["catalogo", "Catálogo", Package, 0],
            ["pedidos", "Pedidos", ClipboardList, pendentes ?? 0],
            ["vendedores", "Vendedores", Users, 0],
          ] as const).map(([a, label, Icon, badge]) => (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-sm font-semibold transition-colors ${
                aba === a ? "bg-white shadow-sm text-primary-dark" : "text-foreground/60"
              }`}
            >
              <Icon size={15} /> {label}
              {badge > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{badge}</span>
              )}
            </button>
          ))}
        </div>

        {aba === "pedidos" && <PedidosView />}
        {aba === "vendedores" && <VendedoresView />}

        {aba === "catalogo" && (<>
        {/* Alternador de modo (some ao editar) */}
        {!editando && (
          <div className="flex gap-1 rounded-xl bg-secondary p-1 max-w-sm mb-6">
            {([["individual", "Individual", Plus], ["lote", "Em lote", Layers]] as const).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                onClick={() => { setModo(m); setMsg(null); }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  modo === m ? "bg-white shadow-sm text-primary-dark" : "text-foreground/60"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        )}

        {modo === "lote" && !editando ? (
          <BulkEditor onSaved={invalidar} totalAtual={total} />
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
            {/* Formulário individual */}
            <form
              onSubmit={salvar}
              className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg">
                  {editando ? "Editar produto" : "Novo produto"}
                </h2>
                {editando && (
                  <button type="button" onClick={cancelar} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Imagem */}
              <div>
                <label className="text-sm font-medium text-foreground/80">Imagem</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary/50 ring-1 ring-black/5 overflow-hidden flex items-center justify-center">
                    {form.imagem_url ? (
                      <img src={form.imagem_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImagem(f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={enviandoImg}
                      className="btn-ghost w-full justify-center"
                    >
                      {enviandoImg ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {enviandoImg ? "Enviando..." : "Enviar imagem"}
                    </button>
                    {form.imagem_url && (
                      <button
                        type="button"
                        onClick={() => set("imagem_url", "")}
                        className="mt-1.5 text-xs text-red-600 hover:underline"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Campo label="Nome *">
                <input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Caneta esferográfica azul" className="inp" />
              </Campo>

              <Campo label="Categoria">
                <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className="inp">
                  {CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Subcategoria">
                  <input value={form.subcategoria} onChange={(e) => set("subcategoria", e.target.value)} placeholder="Ex.: Escrita" className="inp" />
                </Campo>
                <Campo label="Marca">
                  <input value={form.marca} onChange={(e) => set("marca", e.target.value)} placeholder="Ex.: BIC" className="inp" />
                </Campo>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground/80">Tabelas de preço (opcional)</label>
                <div className="mt-1.5 space-y-2">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <span className="text-xs text-foreground/70">Cupom / consumidor <span className="text-muted-foreground">(preço do site)</span></span>
                    <input inputMode="decimal" value={form.preco_cupom} onChange={(e) => set("preco_cupom", e.target.value)} placeholder="0,00" className="inp w-28 text-right" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <span className="text-xs text-foreground/70">Revenda <span className="text-muted-foreground">(CNPJ revende)</span></span>
                    <input inputMode="decimal" value={form.preco_revenda} onChange={(e) => set("preco_revenda", e.target.value)} placeholder="0,00" className="inp w-28 text-right" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <span className="text-xs text-foreground/70">Empresa <span className="text-muted-foreground">(NF + boleto)</span></span>
                    <input inputMode="decimal" value={form.preco_empresa} onChange={(e) => set("preco_empresa", e.target.value)} placeholder="0,00" className="inp w-28 text-right" />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Vazio = "a consultar". O site público mostra o preço de <b>cupom</b>.</p>
              </div>

              <Campo label="Descrição">
                <textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={3} placeholder="Detalhes do produto..." className="inp resize-none" />
              </Campo>

              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" checked={form.ativo} onChange={(e) => set("ativo", e.target.checked)} className="h-4 w-4 accent-[var(--color-primary-dark)]" />
                Ativo (visível no site)
              </label>

              {msg && (
                <p className="text-sm rounded-lg px-3 py-2 bg-secondary text-foreground/80">{msg}</p>
              )}

              <button type="submit" disabled={salvando} className="btn-primary w-full justify-center disabled:opacity-60">
                {salvando ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {editando ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </form>

            {/* Lista */}
            <section>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <h2 className="font-display font-bold text-xl shrink-0">
                  Produtos <span className="text-muted-foreground font-normal text-base">({total})</span>
                </h2>
                <div className="flex flex-1 flex-wrap gap-2 sm:justify-end">
                  <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} className="inp w-auto py-2">
                    <option value="">Todas as categorias</option>
                    {CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="inp w-auto py-2" />
                </div>
              </div>
              {paginacao}

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary-dark" size={26} />
                </div>
              ) : !produtos || produtos.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Package size={40} className="mx-auto mb-3 opacity-50" />
                  {filtroCat || buscaDeb ? "Nenhum produto encontrado com esse filtro." : "Nenhum produto ainda. Cadastre o primeiro ao lado."}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={produtos.length > 0 && produtos.every((p) => selSet.has(p.id))}
                        onChange={(e) => setSelSet(e.target.checked ? new Set(produtos.map((p) => p.id)) : new Set())}
                        className="h-4 w-4 accent-[var(--color-primary-dark)]"
                      />
                      Selecionar todos desta página
                    </label>
                    {selSet.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{selSet.size} selec.</span>
                        <button onClick={excluirSelecionados} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
                          <Trash2 size={15} /> Excluir selecionados
                        </button>
                      </div>
                    )}
                  </div>
                  {produtos.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl ring-1 ring-black/5 p-2.5 hover:shadow-sm transition-shadow">
                      <input
                        type="checkbox"
                        checked={selSet.has(p.id)}
                        onChange={() => toggleSel(p.id)}
                        className="h-4 w-4 shrink-0 accent-[var(--color-primary-dark)]"
                      />
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-secondary/50 overflow-hidden flex items-center justify-center">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt="" loading="lazy" className="h-full w-full object-contain" />
                        ) : (
                          <Package size={20} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{p.nome}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.categoria}
                          {p.subcategoria ? ` · ${p.subcategoria}` : ""}
                          {p.marca ? ` · ${p.marca}` : ""}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {(() => {
                          const pc = p.preco_cupom ?? p.preco;
                          return pc > 0 ? (
                            <div className="text-sm font-semibold" style={{ color: "var(--color-primary-dark)" }}>{brl(pc)}</div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground">a consultar</div>
                          );
                        })()}
                        {!p.ativo && <span className="text-[10px] text-amber-600">inativo</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => editar(p)} className="p-2 rounded-lg text-foreground/60 hover:bg-secondary hover:text-primary-dark" aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => excluir(p)} className="p-2 rounded-lg text-foreground/60 hover:bg-red-50 hover:text-red-600" aria-label="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {produtos && produtos.length > 0 && paginacao}
            </section>
          </div>
        )}
        </>)}
      </div>
    </main>
  );
}

// ── Cadastro em lote: várias linhas, cada uma com sua categoria/preço/imagem ──

type LinhaLote = {
  _id: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  marca: string;
  preco: string;
  imagem_url: string;
  enviando: boolean;
};

let _seq = 0;
const novaLinha = (categoria: string): LinhaLote => ({
  _id: `l${++_seq}`,
  nome: "",
  categoria,
  subcategoria: "",
  marca: "",
  preco: "",
  imagem_url: "",
  enviando: false,
});

function BulkEditor({ onSaved, totalAtual }: { onSaved: () => void; totalAtual?: number }) {
  const [catPadrao, setCatPadrao] = useState<string>(CATEGORIAS[0]);
  const [linhas, setLinhas] = useState<LinhaLote[]>(() => [novaLinha(CATEGORIAS[0]), novaLinha(CATEGORIAS[0]), novaLinha(CATEGORIAS[0])]);
  const [colar, setColar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setLinha = (id: string, patch: Partial<LinhaLote>) =>
    setLinhas((ls) => ls.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  const addLinha = () => setLinhas((ls) => [...ls, novaLinha(catPadrao)]);
  const removeLinha = (id: string) =>
    setLinhas((ls) => (ls.length > 1 ? ls.filter((l) => l._id !== id) : ls));

  async function uploadImg(id: string, file: File) {
    setLinha(id, { enviando: true });
    setMsg(null);
    try {
      const url = await uploadParaStorage(file);
      setLinha(id, { imagem_url: url, enviando: false });
    } catch (e) {
      setLinha(id, { enviando: false });
      setMsg("Falha no upload: " + (e as Error).message);
    }
  }

  function adicionarDaLista() {
    const nomes = colar.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (!nomes.length) return;
    setLinhas((ls) => {
      const base = ls.filter((l) => l.nome.trim() || l.imagem_url || l.preco);
      return [...base, ...nomes.map((n) => ({ ...novaLinha(catPadrao), nome: n }))];
    });
    setColar("");
  }

  const validas = linhas.filter((l) => l.nome.trim());

  async function salvarTodos() {
    if (!validas.length) {
      setMsg("Preencha o nome de pelo menos um produto.");
      return;
    }
    setSalvando(true);
    setMsg(null);
    const rows = validas.map((l) => {
      const pc = l.preco ? Number(l.preco.replace(",", ".")) : null;
      return {
        nome: l.nome.trim(),
        categoria: l.categoria,
        subcategoria: l.subcategoria.trim() || null,
        marca: l.marca.trim() || null,
        preco_cupom: pc,
        preco: pc ?? 0,
        imagem_url: l.imagem_url || null,
        ativo: true,
      };
    });
    const { error } = await supabase.from("produtos").insert(rows);
    setSalvando(false);
    if (error) {
      setMsg("Erro ao salvar: " + error.message);
      return;
    }
    setMsg(`✅ ${rows.length} ${rows.length === 1 ? "produto cadastrado" : "produtos cadastrados"}!`);
    setLinhas([novaLinha(catPadrao), novaLinha(catPadrao), novaLinha(catPadrao)]);
    onSaved();
  }

  return (
    <div className="space-y-5">
      {/* Atalho: colar vários nomes */}
      <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
        <h2 className="font-display font-bold text-lg mb-1">Cadastro em lote</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione vários produtos e salve todos de uma vez. Cada produto pode ter sua própria categoria, preço e imagem.
        </p>
        <div className="grid sm:grid-cols-[1fr_220px] gap-3 items-end">
          <Campo label="Colar vários nomes (um por linha ou separados por vírgula)">
            <textarea
              value={colar}
              onChange={(e) => setColar(e.target.value)}
              rows={2}
              placeholder="Caneta azul, Lápis preto, Borracha..."
              className="inp resize-none"
            />
          </Campo>
          <div className="space-y-2">
            <Campo label="Categoria das novas linhas">
              <select value={catPadrao} onChange={(e) => setCatPadrao(e.target.value)} className="inp">
                {CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </Campo>
            <button type="button" onClick={adicionarDaLista} disabled={!colar.trim()} className="btn-ghost w-full justify-center disabled:opacity-50">
              <Plus size={16} /> Adicionar à lista
            </button>
          </div>
        </div>
      </div>

      {/* Grade de produtos */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {linhas.map((l, i) => (
          <div key={l._id} className="relative rounded-2xl ring-1 ring-black/5 bg-white p-3.5 shadow-sm">
            <button
              type="button"
              onClick={() => removeLinha(l._id)}
              className="absolute right-2 top-2 p-1.5 rounded-lg text-foreground/40 hover:bg-red-50 hover:text-red-600"
              aria-label="Remover"
            >
              <X size={16} />
            </button>
            <div className="flex gap-3">
              <label className="h-20 w-20 shrink-0 cursor-pointer rounded-xl bg-secondary/50 ring-1 ring-black/5 overflow-hidden flex items-center justify-center text-muted-foreground hover:ring-primary-dark/40 transition">
                {l.enviando ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : l.imagem_url ? (
                  <img src={l.imagem_url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <ImageIcon size={20} className="mx-auto" />
                    <span className="text-[9px] block mt-0.5">foto</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImg(l._id, f);
                  }}
                />
              </label>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={l.nome}
                  onChange={(e) => setLinha(l._id, { nome: e.target.value })}
                  placeholder={`Nome do produto ${i + 1} *`}
                  className="inp"
                />
                <select value={l.categoria} onChange={(e) => setLinha(l._id, { categoria: e.target.value })} className="inp">
                  {CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={l.subcategoria} onChange={(e) => setLinha(l._id, { subcategoria: e.target.value })} placeholder="Subcategoria" className="inp" />
                  <input value={l.marca} onChange={(e) => setLinha(l._id, { marca: e.target.value })} placeholder="Marca" className="inp" />
                </div>
                <input inputMode="decimal" value={l.preco} onChange={(e) => setLinha(l._id, { preco: e.target.value })} placeholder="Preço cupom (opcional)" className="inp" />
              </div>
            </div>
          </div>
        ))}

        {/* Card "adicionar" */}
        <button
          type="button"
          onClick={addLinha}
          className="rounded-2xl border-2 border-dashed border-black/10 text-muted-foreground hover:border-primary-dark/40 hover:text-primary-dark transition flex flex-col items-center justify-center gap-2 min-h-[140px]"
        >
          <Plus size={24} />
          <span className="text-sm font-semibold">Adicionar produto</span>
        </button>
      </div>

      {/* Barra de salvar (fixa no rodapé) */}
      <div className="sticky bottom-4 z-30">
        <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-lg p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            {msg ? (
              <span className="text-foreground/80">{msg}</span>
            ) : (
              <span className="text-muted-foreground">
                <b className="text-foreground">{validas.length}</b> produto(s) prontos para cadastrar
                {typeof totalAtual === "number" ? ` · ${totalAtual} no catálogo` : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={salvarTodos}
            disabled={salvando || validas.length === 0}
            className="btn-primary justify-center disabled:opacity-60 shrink-0"
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar todos ({validas.length})
          </button>
        </div>
      </div>
    </div>
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

// ── Pedidos ──

type PedidoItem = { id: string; nome: string; variante: string | null; preco_unit: number; quantidade: number; subtotal: number };
type Pedido = {
  id: string; numero: number; origem: string; status: string;
  cliente_nome: string | null; cliente_telefone: string | null; cliente_doc: string | null;
  cep: string | null; endereco: string | null; numero_end: string | null; bairro: string | null;
  cidade: string | null; uf: string | null; complemento: string | null;
  vendedor_nome: string | null; tabela_preco: string | null; forma_pagamento: string | null;
  tipo_fiscal: string | null; entrega: string | null; observacao: string | null;
  total: number; created_at: string; pedido_itens: PedidoItem[];
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-amber-100 text-amber-800" },
  visto: { label: "Visto", cls: "bg-blue-100 text-blue-800" },
  concluido: { label: "Concluído", cls: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};
const LBL_PAG: Record<string, string> = { cartao_entrega: "Cartão na entrega", cupom: "Cupom", pix: "PIX", boleto: "Boleto" };
const LBL_FISCAL: Record<string, string> = { cupom: "Cupom fiscal", nota: "Nota fiscal" };
const LBL_TAB: Record<string, string> = { cupom: "Cupom/consumidor", revenda: "Revenda", empresa: "Empresa (NF)" };

function PedidosView() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, pedido_itens(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Pedido[];
    },
  });

  async function mudarStatus(id: string, status: string) {
    await supabase.from("pedidos").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "pedidos"] });
    qc.invalidateQueries({ queryKey: ["admin", "pedidos", "pendentes"] });
  }
  async function excluir(id: string) {
    if (!window.confirm("Excluir este pedido?")) return;
    await supabase.from("pedidos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "pedidos"] });
    qc.invalidateQueries({ queryKey: ["admin", "pedidos", "pendentes"] });
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-dark" size={26} /></div>;
  if (!data || data.length === 0) return <div className="text-center py-20 text-muted-foreground"><ClipboardList size={40} className="mx-auto mb-3 opacity-50" />Nenhum pedido ainda.</div>;

  return (
    <div className="space-y-4">
      {data.map((p) => {
        const end = [p.endereco, p.numero_end && `nº ${p.numero_end}`, p.bairro, p.cidade && p.uf ? `${p.cidade}/${p.uf}` : p.cidade, p.cep && `CEP ${p.cep}`, p.complemento].filter(Boolean).join(", ");
        const st = STATUS[p.status] ?? STATUS.pendente;
        return (
          <div key={p.id} className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold">Pedido #{p.numero}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-secondary text-foreground/70">{p.origem === "vendedor" ? "Vendedor" : "Site"}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</span>
            </div>

            <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {p.vendedor_nome && <div><b>Vendedor:</b> {p.vendedor_nome}</div>}
              {p.cliente_nome && <div><b>Cliente:</b> {p.cliente_nome}</div>}
              {p.cliente_telefone && <div><b>Telefone:</b> {p.cliente_telefone}</div>}
              {p.cliente_doc && <div><b>CPF/CNPJ:</b> {p.cliente_doc}</div>}
              {end && <div className="sm:col-span-2"><b>Endereço:</b> {end}</div>}
              {p.tabela_preco && <div><b>Tabela:</b> {LBL_TAB[p.tabela_preco] ?? p.tabela_preco}</div>}
              {p.tipo_fiscal && <div><b>Fiscal:</b> {LBL_FISCAL[p.tipo_fiscal] ?? p.tipo_fiscal}</div>}
              {p.forma_pagamento && <div><b>Pagamento:</b> {LBL_PAG[p.forma_pagamento] ?? p.forma_pagamento}</div>}
              {p.entrega && <div className="sm:col-span-2"><b>Entrega:</b> {p.entrega}</div>}
              {p.observacao && <div className="sm:col-span-2"><b>Obs:</b> {p.observacao}</div>}
            </div>

            <div className="mt-3 rounded-xl bg-secondary/40 p-3 space-y-1">
              {p.pedido_itens?.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>{it.quantidade}x {it.nome}{it.variante ? ` (${it.variante})` : ""}</span>
                  <span className="font-medium">{brl(it.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 mt-1 font-bold">
                <span>Total</span><span style={{ color: "var(--color-primary-dark)" }}>{brl(p.total)}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)} className="inp w-auto py-1.5">
                <option value="pendente">Pendente</option>
                <option value="visto">Visto</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button onClick={() => excluir(p.id)} className="p-2 rounded-lg text-foreground/50 hover:bg-red-50 hover:text-red-600" aria-label="Excluir"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Vendedores ──

type VendedorRow = { id: string; nome: string; telefone: string | null; cidade: string | null; uf: string | null; ativo: boolean; created_at: string };

function CadastrarVendedorForm({ onCriado }: { onCriado: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!nome.trim() || !email.trim() || senha.length < 6) {
      setMsg("Preencha nome, e-mail e senha (mín. 6).");
      return;
    }
    setSalvando(true);
    // Cliente isolado: cria o vendedor sem trocar a sessão do admin.
    const temp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: "bg-admin-signup" },
    });
    const { data, error } = await temp.auth.signUp({ email: email.trim(), password: senha });
    if (error || !data.user) {
      setSalvando(false);
      setMsg("Erro: " + (error?.message ?? "falha ao criar"));
      return;
    }
    const { error: e2 } = await temp.from("vendedores").insert({
      user_id: data.user.id,
      nome: nome.trim(),
      telefone: tel.trim() || null,
      cidade: cidade.trim() || null,
      uf: uf.trim() || null,
      ativo: true, // criado pelo admin já entra aprovado
    });
    await temp.auth.signOut();
    setSalvando(false);
    if (e2) {
      setMsg("Conta criada, mas erro ao registrar vendedor: " + e2.message);
      return;
    }
    setMsg("✅ Vendedor cadastrado e aprovado!");
    setNome(""); setTel(""); setCidade(""); setUf(""); setEmail(""); setSenha("");
    onCriado();
  }

  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-4">
      <button onClick={() => setAberto((a) => !a)} className="flex w-full items-center justify-between font-display font-bold text-lg">
        <span className="inline-flex items-center gap-2"><Plus size={18} /> Cadastrar vendedor</span>
        <span className="text-muted-foreground text-sm">{aberto ? "fechar" : "abrir"}</span>
      </button>
      {aberto && (
        <form onSubmit={criar} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome *" className="inp sm:col-span-2" />
          <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Telefone" className="inp" />
          <div className="grid grid-cols-[1fr_70px] gap-2">
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="inp" />
            <input value={uf} onChange={(e) => setUf(e.target.value)} placeholder="UF" maxLength={2} className="inp" />
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail *" className="inp" />
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha (mín. 6) *" className="inp" />
          {msg && <p className="sm:col-span-2 text-sm rounded-lg px-3 py-2 bg-secondary text-foreground/80">{msg}</p>}
          <button type="submit" disabled={salvando} className="btn-primary justify-center sm:col-span-2 disabled:opacity-60">
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Cadastrar e aprovar
          </button>
        </form>
      )}
    </div>
  );
}

function VendedoresView() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vendedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendedores").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as VendedorRow[];
    },
  });
  async function setAtivo(id: string, ativo: boolean) {
    await supabase.from("vendedores").update({ ativo }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "vendedores"] });
  }
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "vendedores"] });

  return (
    <div className="space-y-4">
      <CadastrarVendedorForm onCriado={refresh} />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-dark" size={26} /></div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Users size={40} className="mx-auto mb-3 opacity-50" />Nenhum vendedor cadastrado ainda.</div>
      ) : (
      <div className="space-y-2">
      {data.map((v) => (
        <div key={v.id} className="flex items-center gap-3 bg-white rounded-xl ring-1 ring-black/5 p-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{v.nome}</div>
            <div className="text-xs text-muted-foreground">
              {v.telefone ?? "sem telefone"}
              {v.cidade ? ` · ${v.cidade}${v.uf ? `/${v.uf}` : ""}` : ""}
              {" · "}{new Date(v.created_at).toLocaleDateString("pt-BR")}
            </div>
          </div>
          {v.ativo ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-green-100 text-green-800"><Check size={12} /> Ativo</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800"><Clock size={12} /> Pendente</span>
          )}
          <button onClick={() => setAtivo(v.id, !v.ativo)} className={v.ativo ? "btn-ghost" : "btn-primary"}>
            {v.ativo ? "Desativar" : "Aprovar"}
          </button>
        </div>
      ))}
      </div>
      )}
    </div>
  );
}
