import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para uso no browser (Client + RLS).
// A anon/publishable key é pública e pode ser exposta — a segurança vem
// das policies de Row Level Security definidas no banco. NUNCA coloque a
// service_role key aqui: ela ignora RLS e só deve viver no servidor.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes. Confira o arquivo .env.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
