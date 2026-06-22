import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Vendedor = {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
};

// Carrega a sessão e, se houver, o registro de vendedor do usuário atual.
// vendedor === null + session !== null  => é admin (não tem linha em vendedores).
export function useVendedor() {
  const [session, setSession] = useState<Session | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function carregar(s: Session | null) {
      if (!s) {
        if (alive) {
          setSession(null);
          setVendedor(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("vendedores")
        .select("*")
        .eq("user_id", s.user.id)
        .maybeSingle();
      if (alive) {
        setSession(s);
        setVendedor((data as Vendedor) ?? null);
        setLoading(false);
      }
    }
    supabase.auth.getSession().then(({ data }) => carregar(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setLoading(true);
      carregar(s);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, vendedor, loading };
}

export type EnderecoCep = {
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
};

// Busca endereço pelo CEP (ViaCEP). Retorna null se inválido/não achado.
export async function buscarCep(cep: string): Promise<EnderecoCep | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const j = await r.json();
    if (j.erro) return null;
    return {
      endereco: j.logradouro ?? "",
      bairro: j.bairro ?? "",
      cidade: j.localidade ?? "",
      uf: j.uf ?? "",
    };
  } catch {
    return null;
  }
}
