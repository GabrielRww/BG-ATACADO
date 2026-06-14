// Tipos do domínio — espelham as tabelas do Supabase.

export interface Variante {
  volume: string;
  preco: number;
  ordem: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  sku: string | null;
  subcategoria: string | null;
  marca: string | null;
  preco: number;
  unidade: string | null;
  qtd_por_caixa: number | null;
  qtd_minima: number | null;
  estoque: number | null;
  imagem_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relação 1:N — variantes de volume (vem do embed do Supabase).
  produto_variantes?: Variante[];
}

// Campos enviados ao criar um produto (id/timestamps são gerados pelo banco).
export type NovoProduto = Omit<Produto, "id" | "created_at" | "updated_at">;
