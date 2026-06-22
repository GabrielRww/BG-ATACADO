import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, LogIn, LogOut, Search, Plus, Minus, Trash2, Package,
  FileDown, MessageCircle, CheckCircle2, ShoppingCart, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import { CATEGORIAS } from "@/lib/auth";
import { useVendedor, buscarCep } from "@/lib/vendedor";
import {
  brl, salvarPedido, whatsappHref,
  type DadosPedido, type FormaPagamento, type TipoFiscal, type TabelaPreco,
} from "@/lib/pedidos";
import { gerarPedidoPDF } from "@/lib/pedidoPdf";
import type { CartItem } from "@/lib/cart";

export const Route = createFileRoute("/vendedor/")({
  head: () => ({ meta: [{ title: "Portal do vendedor — BG Atacado" }] }),
  component: VendedorRoute,
});

function VendedorRoute() {
  const { session, vendedor, loading } = useVendedor();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary-dark" size={28} />
      </div>
    );
  }
  if (!session) return <LoginVendedor />;
  if (!vendedor)
    return (
      <Aviso titulo="Conta de administrador" texto="Esta conta não é de vendedor.">
        <Link to="/admin" className="btn-primary inline-flex">Ir para o admin</Link>
      </Aviso>
    );
  if (!vendedor.ativo)
    return (
      <Aviso
        titulo="Cadastro em análise"
        texto="Sua conta de vendedor está aguardando aprovação do administrador."
        icone={<Clock size={56} className="mx-auto mb-4 text-amber-500" />}
      >
        <button onClick={() => supabase.auth.signOut()} className="btn-ghost">Sair</button>
      </Aviso>
    );
  return <Portal nome={vendedor.nome} vendedorId={vendedor.id} />;
}

function Aviso({ titulo, texto, children, icone }: { titulo: string; texto: string; children?: React.ReactNode; icone?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {icone}
        <h1 className="font-display font-bold text-2xl">{titulo}</h1>
        <p className="mt-2 text-muted-foreground">{texto}</p>
        <div className="mt-6 flex justify-center gap-3">{children}</div>
      </div>
    </main>
  );
}

function LoginVendedor() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEntrando(false);
    if (error) setErro("E-mail ou senha inválidos.");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-md py-16">
        <div className="text-center mb-8">
          <img src={logo} alt="BG Atacado" className="h-14 w-14 rounded-full object-cover mx-auto mb-3" />
          <h1 className="font-display font-bold text-2xl">Portal do vendedor</h1>
          <p className="text-muted-foreground text-sm mt-1">Entre para montar pedidos</p>
        </div>
        <form onSubmit={entrar} className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6 space-y-3.5">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="inp" />
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" className="inp" />
          {erro && <p className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{erro}</p>}
          <button type="submit" disabled={entrando} className="btn-primary w-full justify-center disabled:opacity-60">
            {entrando ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} Entrar
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Não tem conta? <Link to="/vendedor/cadastro" className="text-primary-dark font-medium hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}

// ── Portal do vendedor ativo ──

type ProdBusca = {
  id: string; nome: string; preco: number;
  preco_revenda: number | null; preco_cupom: number | null; preco_empresa: number | null;
  imagem_url: string | null; sku: string | null; unidade: string | null;
};

function precoTabela(p: ProdBusca, t: TabelaPreco): number {
  const v = t === "revenda" ? p.preco_revenda : t === "empresa" ? p.preco_empresa : p.preco_cupom;
  return v ?? p.preco_cupom ?? p.preco ?? 0;
}

const PAGE_CAT = 300; // produtos por página no catálogo do vendedor

async function fetchCatalogo(
  categoria: string,
  busca: string,
  pagina: number,
): Promise<{ itens: ProdBusca[]; total: number }> {
  let qy = supabase
    .from("produtos")
    .select("id, nome, preco, preco_revenda, preco_cupom, preco_empresa, imagem_url, sku, unidade", { count: "exact" })
    .eq("ativo", true);
  if (categoria) qy = qy.eq("categoria", categoria);
  const t = busca.trim().replace(/[%,()*]/g, " ");
  if (t) qy = qy.ilike("nome", `%${t}%`);
  const from = pagina * PAGE_CAT;
  const { data, error, count } = await qy.order("nome").range(from, from + PAGE_CAT - 1);
  if (error) throw error;
  return { itens: (data as ProdBusca[]) ?? [], total: count ?? 0 };
}

type ClienteForm = {
  nome: string; telefone: string; doc: string;
  cep: string; endereco: string; numero_end: string; bairro: string;
  cidade: string; uf: string; complemento: string;
};
const CLIENTE_VAZIO: ClienteForm = {
  nome: "", telefone: "", doc: "", cep: "", endereco: "", numero_end: "",
  bairro: "", cidade: "", uf: "", complemento: "",
};

function Portal({ nome, vendedorId }: { nome: string; vendedorId: string }) {
  const [tabela, setTabela] = useState<TabelaPreco>("revenda");
  const [cli, setCli] = useState<ClienteForm>(CLIENTE_VAZIO);
  const [itens, setItens] = useState<CartItem[]>([]);
  const [pag, setPag] = useState<FormaPagamento>("boleto");
  const [fiscal, setFiscal] = useState<TipoFiscal>("nota");
  const [entrega, setEntrega] = useState("");
  const [obs, setObs] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState<{ dados: DadosPedido; itens: CartItem[]; numero?: string } | null>(null);

  const setC = <K extends keyof ClienteForm>(k: K, v: ClienteForm[K]) => setCli((c) => ({ ...c, [k]: v }));

  // Catálogo navegável (filtro por categoria + busca + paginação)
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [pagCat, setPagCat] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setQDeb(q), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => { setPagCat(0); }, [catFiltro, qDeb]);
  const { data: catalogo, isLoading: carregandoCat } = useQuery({
    queryKey: ["vendedor", "catalogo", catFiltro, qDeb, pagCat],
    queryFn: () => fetchCatalogo(catFiltro, qDeb, pagCat),
  });
  const produtosCat = catalogo?.itens ?? [];
  const totalCat = catalogo?.total ?? 0;
  const totalPagCat = Math.max(1, Math.ceil(totalCat / PAGE_CAT));

  async function preencherCep() {
    setBuscandoCep(true);
    const r = await buscarCep(cli.cep);
    setBuscandoCep(false);
    if (r) setCli((c) => ({ ...c, endereco: r.endereco, bairro: r.bairro, cidade: r.cidade, uf: r.uf }));
  }

  function addProduto(p: ProdBusca) {
    const preco = precoTabela(p, tabela);
    const key = `${p.id}|`;
    setItens((prev) => {
      const ex = prev.find((i) => i.key === key);
      if (ex) return prev.map((i) => (i.key === key ? { ...i, quantidade: i.quantidade + 1 } : i));
      return [...prev, { key, produto_id: p.id, nome: p.nome, variante: null, preco_unit: preco, imagem_url: p.imagem_url, sku: p.sku, unidade: p.unidade, quantidade: 1 }];
    });
    setQ("");
    setResultados([]);
  }
  const setQtd = (key: string, qtd: number) =>
    setItens((prev) => (qtd <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantidade: qtd } : i))));

  const total = useMemo(() => itens.reduce((s, i) => s + i.preco_unit * i.quantidade, 0), [itens]);

  function montarDados(): DadosPedido {
    return {
      origem: "vendedor",
      vendedor_id: vendedorId,
      vendedor_nome: nome,
      cliente_nome: cli.nome.trim() || null,
      cliente_telefone: cli.telefone.trim() || null,
      cliente_doc: cli.doc.trim() || null,
      cep: cli.cep.trim() || null,
      endereco: cli.endereco.trim() || null,
      numero_end: cli.numero_end.trim() || null,
      bairro: cli.bairro.trim() || null,
      cidade: cli.cidade.trim() || null,
      uf: cli.uf.trim() || null,
      complemento: cli.complemento.trim() || null,
      tabela_preco: tabela,
      forma_pagamento: pag,
      tipo_fiscal: fiscal,
      entrega: entrega.trim() || null,
      observacao: obs.trim() || null,
    };
  }

  async function finalizar() {
    setErro(null);
    if (itens.length === 0) { setErro("Adicione ao menos um item ao pedido."); return; }
    if (!cli.nome.trim()) { setErro("Informe o nome do cliente."); return; }
    setEnviando(true);
    const dados = montarDados();
    try {
      await salvarPedido(dados, itens);
      // salva/atualiza o cliente do vendedor (cadastro)
      await supabase.from("clientes").insert({
        vendedor_id: vendedorId,
        nome: cli.nome.trim(),
        telefone: cli.telefone.trim() || null,
        doc: cli.doc.trim() || null,
        cep: cli.cep.trim() || null,
        endereco: cli.endereco.trim() || null,
        numero_end: cli.numero_end.trim() || null,
        bairro: cli.bairro.trim() || null,
        cidade: cli.cidade.trim() || null,
        uf: cli.uf.trim() || null,
        complemento: cli.complemento.trim() || null,
      });
      setFeito({ dados, itens });
    } catch (e) {
      setErro("Erro ao enviar pedido: " + (e as Error).message);
    }
    setEnviando(false);
  }

  function novoPedido() {
    setFeito(null);
    setCli(CLIENTE_VAZIO);
    setItens([]);
    setEntrega(""); setObs("");
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="container-wide flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="font-display font-bold text-lg">Portal do vendedor</div>
              <div className="text-[11px] text-muted-foreground">{nome}</div>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="btn-ghost"><LogOut size={16} /> Sair</button>
        </div>
      </header>

      {feito ? (
        <div className="container-wide py-16 text-center max-w-lg mx-auto">
          <CheckCircle2 size={56} className="mx-auto mb-4 text-[var(--color-primary-dark)]" />
          <h1 className="font-display font-bold text-2xl">Pedido registrado!</h1>
          <p className="mt-2 text-muted-foreground">O pedido ficou pendente no painel do admin. Você pode baixar o PDF ou enviar no WhatsApp.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => gerarPedidoPDF(feito.dados, feito.itens)} className="btn-primary"><FileDown size={18} /> Baixar PDF</button>
            <a href={whatsappHref(feito.dados, feito.itens)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--color-whatsapp,#25D366)" }}><MessageCircle size={18} /> WhatsApp</a>
            <button onClick={novoPedido} className="btn-ghost">Novo pedido</button>
          </div>
        </div>
      ) : (
        <div className="container-wide py-8 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Coluna esquerda: cliente + itens */}
          <div className="space-y-6">
            {/* Tabela de preço */}
            <Bloco titulo="Tabela de preço">
              <div className="flex flex-wrap gap-2">
                {(["revenda", "cupom", "empresa"] as TabelaPreco[]).map((t) => (
                  <button key={t} onClick={() => { setTabela(t); setItens((p) => p.map((i) => ({ ...i }))); }}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold border ${tabela === t ? "text-white border-transparent" : "text-foreground/70 border-black/10"}`}
                    style={tabela === t ? { background: "var(--color-primary-dark)" } : undefined}>
                    {t === "revenda" ? "Revenda" : t === "cupom" ? "Cupom/Consumidor" : "Empresa (NF)"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Define o preço usado nos itens. Troque antes de adicionar.</p>
            </Bloco>

            {/* Cliente */}
            <Bloco titulo="Cliente">
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={cli.nome} onChange={(e) => setC("nome", e.target.value)} placeholder="Nome do cliente *" className="inp sm:col-span-2" />
                <input value={cli.telefone} onChange={(e) => setC("telefone", e.target.value)} placeholder="Telefone" className="inp" />
                <input value={cli.doc} onChange={(e) => setC("doc", e.target.value)} placeholder="CPF / CNPJ" className="inp" />
                <div className="flex gap-2">
                  <input value={cli.cep} onChange={(e) => setC("cep", e.target.value)} onBlur={preencherCep} placeholder="CEP" className="inp" />
                  <button type="button" onClick={preencherCep} className="btn-ghost shrink-0" disabled={buscandoCep}>
                    {buscandoCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </div>
                <input value={cli.numero_end} onChange={(e) => setC("numero_end", e.target.value)} placeholder="Número" className="inp" />
                <input value={cli.endereco} onChange={(e) => setC("endereco", e.target.value)} placeholder="Endereço" className="inp sm:col-span-2" />
                <input value={cli.bairro} onChange={(e) => setC("bairro", e.target.value)} placeholder="Bairro" className="inp" />
                <div className="grid grid-cols-[1fr_70px] gap-2">
                  <input value={cli.cidade} onChange={(e) => setC("cidade", e.target.value)} placeholder="Cidade" className="inp" />
                  <input value={cli.uf} onChange={(e) => setC("uf", e.target.value)} placeholder="UF" className="inp" maxLength={2} />
                </div>
                <input value={cli.complemento} onChange={(e) => setC("complemento", e.target.value)} placeholder="Complemento" className="inp sm:col-span-2" />
              </div>
            </Bloco>

            {/* Itens */}
            <Bloco titulo="Catálogo de produtos">
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..." className="inp pl-9" />
                </div>
                <select value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)} className="inp w-auto">
                  <option value="">Todas as categorias</option>
                  {CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>

              {totalCat > PAGE_CAT && (
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">{pagCat * PAGE_CAT + 1}–{Math.min((pagCat + 1) * PAGE_CAT, totalCat)} de {totalCat}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={pagCat === 0} onClick={() => setPagCat((p) => Math.max(0, p - 1))} className="btn-ghost disabled:opacity-40" aria-label="Anterior"><ChevronLeft size={16} /></button>
                    <span className="font-medium">Pág. {pagCat + 1}/{totalPagCat}</span>
                    <button type="button" disabled={pagCat >= totalPagCat - 1} onClick={() => setPagCat((p) => p + 1)} className="btn-ghost disabled:opacity-40" aria-label="Próxima"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}

              {carregandoCat ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-dark" size={24} /></div>
              ) : produtosCat.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum produto encontrado.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {produtosCat.map((p) => {
                    const preco = precoTabela(p, tabela);
                    return (
                      <div key={p.id} className="flex flex-col rounded-xl ring-1 ring-black/5 p-2">
                        <div className="aspect-square rounded-lg bg-secondary/40 overflow-hidden flex items-center justify-center mb-2">
                          {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} loading="lazy" className="h-full w-full object-contain" /> : <Package size={28} className="text-muted-foreground" />}
                        </div>
                        <div className="text-xs font-medium line-clamp-2 flex-1">{p.nome}</div>
                        <div className="text-sm font-bold mt-1" style={{ color: "var(--color-primary-dark)" }}>{preco > 0 ? brl(preco) : "—"}</div>
                        <button type="button" onClick={() => addProduto(p)} className="mt-1.5 inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-white" style={{ background: "var(--color-primary-dark)" }}><Plus size={13} /> Adicionar</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Bloco>

            <Bloco titulo={`Itens do pedido${itens.length ? ` (${itens.length})` : ""}`}>
              <div className="space-y-2">
                {itens.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center"><ShoppingCart size={20} className="mx-auto mb-1 opacity-50" />Nenhum item ainda. Adicione pelo catálogo acima.</p>
                ) : itens.map((i) => (
                  <div key={i.key} className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 p-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{i.nome}</div>
                      <div className="text-xs text-muted-foreground">{brl(i.preco_unit)}</div>
                    </div>
                    <div className="inline-flex items-center rounded-lg ring-1 ring-black/10 overflow-hidden">
                      <button onClick={() => setQtd(i.key, i.quantidade - 1)} className="px-2 py-1.5 hover:bg-secondary"><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm">{i.quantidade}</span>
                      <button onClick={() => setQtd(i.key, i.quantidade + 1)} className="px-2 py-1.5 hover:bg-secondary"><Plus size={14} /></button>
                    </div>
                    <span className="w-20 text-right text-sm font-semibold">{brl(i.preco_unit * i.quantidade)}</span>
                    <button onClick={() => setQtd(i.key, 0)} className="p-1.5 rounded text-foreground/50 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </Bloco>
          </div>

          {/* Coluna direita: resumo + finalizar */}
          <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5 lg:sticky lg:top-24 space-y-4">
            <div className="flex justify-between font-display font-bold text-lg">
              <span>Total</span>
              <span style={{ color: "var(--color-primary-dark)" }}>{brl(total)}</span>
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Tipo fiscal">
                  <select value={fiscal} onChange={(e) => setFiscal(e.target.value as TipoFiscal)} className="inp">
                    <option value="nota">Nota fiscal</option>
                    <option value="cupom">Cupom fiscal</option>
                  </select>
                </Campo>
                <Campo label="Pagamento">
                  <select value={pag} onChange={(e) => setPag(e.target.value as FormaPagamento)} className="inp">
                    <option value="boleto">Boleto</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_entrega">Cartão na entrega</option>
                    <option value="cupom">Cupom</option>
                  </select>
                </Campo>
              </div>
              <Campo label="Entrega"><textarea value={entrega} onChange={(e) => setEntrega(e.target.value)} rows={2} placeholder="Observações de entrega" className="inp resize-none" /></Campo>
              <Campo label="Observação"><textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Observação do pedido" className="inp resize-none" /></Campo>
            </div>
            {erro && <p className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{erro}</p>}
            <button onClick={finalizar} disabled={enviando} className="btn-primary w-full justify-center disabled:opacity-60">
              {enviando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Enviar pedido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
      <h2 className="font-display font-bold text-lg mb-3">{titulo}</h2>
      {children}
    </section>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="text-sm font-medium text-foreground/80">{label}</label><div className="mt-1.5">{children}</div></div>);
}
