import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UserPlus, CheckCircle2, Search } from "lucide-react";
import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import { buscarCep } from "@/lib/vendedor";

export const Route = createFileRoute("/vendedor/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro de vendedor — BG Atacado" }] }),
  component: CadastroVendedor,
});

function CadastroVendedor() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function preencherCep() {
    setBuscandoCep(true);
    const r = await buscarCep(cep);
    setBuscandoCep(false);
    if (r) { setEndereco(r.endereco); setBairro(r.bairro); setCidade(r.cidade); setUf(r.uf); }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nome.trim() || !email.trim() || senha.length < 6) {
      setErro("Preencha nome, e-mail e uma senha de pelo menos 6 caracteres.");
      return;
    }
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
    });
    if (error || !data.user) {
      setEnviando(false);
      setErro("Erro ao cadastrar: " + (error?.message ?? "tente novamente"));
      return;
    }
    const { error: e2 } = await supabase.from("vendedores").insert({
      user_id: data.user.id,
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      cep: cep.trim() || null,
      endereco: endereco.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim() || null,
      uf: uf.trim() || null,
      ativo: false,
    });
    setEnviando(false);
    if (e2) {
      setErro("Conta criada, mas houve erro ao registrar o vendedor: " + e2.message);
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <CheckCircle2 size={56} className="mx-auto mb-4 text-[var(--color-primary-dark)]" />
          <h1 className="font-display font-bold text-2xl">Cadastro enviado!</h1>
          <p className="mt-2 text-muted-foreground">
            Sua conta de vendedor foi criada e está <b>aguardando aprovação</b> do administrador.
            Assim que liberarem, você poderá entrar no portal.
          </p>
          <div className="mt-6">
            <Link to="/vendedor" className="btn-primary inline-flex">Ir para o login</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-md py-14">
        <div className="text-center mb-8">
          <img src={logo} alt="BG Atacado" className="h-14 w-14 rounded-full object-cover mx-auto mb-3" />
          <h1 className="font-display font-bold text-2xl">Cadastro de vendedor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie sua conta para montar pedidos. O acesso é liberado após aprovação.
          </p>
        </div>

        <form onSubmit={enviar} className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6 space-y-3.5">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo *" className="inp" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone / WhatsApp" className="inp" />
          <div className="flex gap-2">
            <input value={cep} onChange={(e) => setCep(e.target.value)} onBlur={preencherCep} placeholder="CEP" className="inp" />
            <button type="button" onClick={preencherCep} disabled={buscandoCep} className="btn-ghost shrink-0">
              {buscandoCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="inp" />
          <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="inp" />
          <div className="grid grid-cols-[1fr_70px] gap-2">
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="inp" />
            <input value={uf} onChange={(e) => setUf(e.target.value)} placeholder="UF" maxLength={2} className="inp" />
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail *" className="inp" />
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha (mín. 6) *" className="inp" minLength={6} />

          {erro && <p className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{erro}</p>}

          <button type="submit" disabled={enviando} className="btn-primary w-full justify-center disabled:opacity-60">
            {enviando ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Criar conta
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Já tem conta? <Link to="/vendedor" className="text-primary-dark font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
