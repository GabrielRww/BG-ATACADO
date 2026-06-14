import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, LogIn, Loader2, ArrowLeft } from "lucide-react";

import logo from "@/assets/bg-logo.png";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — BG Atacado Admin" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Já logado? Vai direto pro painel.
  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #1A5C3A 0%, #2E8B57 100%)" }}
    >
      <div className="absolute inset-0 dot-grid opacity-[0.06] text-white" aria-hidden="true" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="BG Atacado"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-white/30"
          />
          <h1 className="mt-4 font-display tracking-tight text-2xl font-bold text-white">
            Painel do Catálogo
          </h1>
          <p className="text-white/70 text-sm mt-1">Entre para gerenciar os produtos</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-foreground/80">E-mail</label>
            <div className="mt-1.5 relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80">Senha</label>
            <div className="mt-1.5 relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-60"
            style={{ background: "var(--color-primary-dark)" }}
          >
            {enviando ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft size={15} /> Voltar ao site
        </Link>
      </div>
    </main>
  );
}
