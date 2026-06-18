import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Loader2, LogOut, Plus, Pencil, Trash2, Upload, X, Package, ImageIcon, ExternalLink, Layers, Save,
} from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import { useSession, CATEGORIAS } from "@/lib/auth";
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
  preco: string;
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
  preco: "",
  imagem_url: "",
  ativo: true,
};

async function fetchTodos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Produto[];
}

function AdminPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
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
  const { data: produtos, isLoading } = useQuery({
    queryKey: ["admin", "produtos"],
    queryFn: fetchTodos,
  });

  const [modo, setModo] = useState<"individual" | "lote">("individual");
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
      preco: p.preco ? String(p.preco) : "",
      imagem_url: p.imagem_url ?? "",
      ativo: p.ativo,
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      subcategoria: form.subcategoria.trim() || null,
      marca: form.marca.trim() || null,
      descricao: form.descricao.trim() || null,
      preco: form.preco ? Number(form.preco.replace(",", ".")) : 0,
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
          <BulkEditor onSaved={invalidar} totalAtual={produtos?.length} />
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

              <Campo label="Preço (opcional)">
                <input inputMode="decimal" value={form.preco} onChange={(e) => set("preco", e.target.value)} placeholder="0,00" className="inp" />
              </Campo>

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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl">
                  Produtos {produtos ? <span className="text-muted-foreground font-normal text-base">({produtos.length})</span> : null}
                </h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary-dark" size={26} />
                </div>
              ) : !produtos || produtos.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Package size={40} className="mx-auto mb-3 opacity-50" />
                  Nenhum produto ainda. Cadastre o primeiro ao lado.
                </div>
              ) : (
                <div className="space-y-2">
                  {produtos.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl ring-1 ring-black/5 p-2.5 hover:shadow-sm transition-shadow">
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-secondary/50 overflow-hidden flex items-center justify-center">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt="" className="h-full w-full object-contain" />
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
                        {p.preco > 0 && (
                          <div className="text-sm font-semibold" style={{ color: "var(--color-primary-dark)" }}>{brl(p.preco)}</div>
                        )}
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
            </section>
          </div>
        )}
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
    const rows = validas.map((l) => ({
      nome: l.nome.trim(),
      categoria: l.categoria,
      subcategoria: l.subcategoria.trim() || null,
      marca: l.marca.trim() || null,
      preco: l.preco ? Number(l.preco.replace(",", ".")) : 0,
      imagem_url: l.imagem_url || null,
      ativo: true,
    }));
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
                <input inputMode="decimal" value={l.preco} onChange={(e) => setLinha(l._id, { preco: e.target.value })} placeholder="Preço (opcional)" className="inp" />
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
