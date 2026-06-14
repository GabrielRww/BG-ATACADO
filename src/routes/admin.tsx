import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Loader2, LogOut, Plus, Pencil, Trash2, Upload, X, Package, ImageIcon, ExternalLink,
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

  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImg, setEnviandoImg] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editando = form.id !== null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  async function uploadImagem(file: File) {
    setEnviandoImg(true);
    setMsg(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("catalogo").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setEnviandoImg(false);
    if (error) {
      setMsg("Falha ao enviar imagem: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("catalogo").getPublicUrl(path);
    set("imagem_url", data.publicUrl);
  }

  function editar(p: Produto) {
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
    qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
    qc.invalidateQueries({ queryKey: ["produtos"] });
  }

  async function excluir(p: Produto) {
    if (!window.confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) {
      setMsg("Erro ao excluir: " + error.message);
      return;
    }
    if (form.id === p.id) cancelar();
    qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
    qc.invalidateQueries({ queryKey: ["produtos"] });
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

      <div className="container-wide py-8 grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Formulário */}
        <form
          onSubmit={salvar}
          className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5 lg:sticky lg:top-24 space-y-3.5"
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
            <input
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Ex.: Caneta esferográfica azul"
              className="inp"
            />
          </Campo>

          <Campo label="Categoria">
            <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className="inp">
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Subcategoria">
              <input
                value={form.subcategoria}
                onChange={(e) => set("subcategoria", e.target.value)}
                placeholder="Ex.: Escrita"
                className="inp"
              />
            </Campo>
            <Campo label="Marca">
              <input
                value={form.marca}
                onChange={(e) => set("marca", e.target.value)}
                placeholder="Ex.: BIC"
                className="inp"
              />
            </Campo>
          </div>

          <Campo label="Preço (opcional)">
            <input
              inputMode="decimal"
              value={form.preco}
              onChange={(e) => set("preco", e.target.value)}
              placeholder="0,00"
              className="inp"
            />
          </Campo>

          <Campo label="Descrição">
            <textarea
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              rows={3}
              placeholder="Detalhes do produto..."
              className="inp resize-none"
            />
          </Campo>

          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => set("ativo", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary-dark)]"
            />
            Ativo (visível no site)
          </label>

          {msg && (
            <p className="text-sm rounded-lg px-3 py-2 bg-secondary text-foreground/80">{msg}</p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="btn-primary w-full justify-center"
          >
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
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-white rounded-xl ring-1 ring-black/5 p-2.5 hover:shadow-sm transition-shadow"
                >
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
                      <div className="text-sm font-semibold" style={{ color: "var(--color-primary-dark)" }}>
                        {brl(p.preco)}
                      </div>
                    )}
                    {!p.ativo && <span className="text-[10px] text-amber-600">inativo</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => editar(p)}
                      className="p-2 rounded-lg text-foreground/60 hover:bg-secondary hover:text-primary-dark"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => excluir(p)}
                      className="p-2 rounded-lg text-foreground/60 hover:bg-red-50 hover:text-red-600"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
