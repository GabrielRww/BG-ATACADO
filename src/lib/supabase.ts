import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para uso no browser (Client + RLS).
// A anon/publishable key é PÚBLICA por natureza: ela é embutida no bundle e
// enviada ao navegador de qualquer forma; a segurança vem das policies de Row
// Level Security no banco. Por isso usá-la como fallback aqui é seguro e garante
// que o build funcione mesmo sem as variáveis VITE_ configuradas (ex.: Vercel).
// NUNCA faça isso com a service_role key — ela ignora RLS e só vive no servidor.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://apazofddaaugvcoweeqs.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYXpvZmRkYWF1Z3Zjb3dlZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzOTU0MTQsImV4cCI6MjA5Njk3MTQxNH0.6wtwEFrhOMb73iAdFQQx9Ny6YBKyntQD3OaWN3-WU2c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
