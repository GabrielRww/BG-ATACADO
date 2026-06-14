// Fonte única das categorias do catálogo BG Atacado.
// `nome` é o valor gravado em produtos.categoria (precisa bater com o admin).
export type CategoriaInfo = {
  slug: string;
  nome: string;
  emoji: string;
  // Rota dedicada (ex.: Limpeza tem a página Quimiprol com preços/variantes).
  rotaDedicada?: string;
};

export const CATEGORIAS_INFO: CategoriaInfo[] = [
  { slug: "grafico", nome: "Material Gráfico", emoji: "🖨️" },
  { slug: "limpeza", nome: "Material de Limpeza", emoji: "🧹", rotaDedicada: "/limpeza" },
  { slug: "informatica", nome: "Linha Informática", emoji: "💻" },
  { slug: "escritorio", nome: "Linha Escritório", emoji: "🗂️" },
  { slug: "escolar", nome: "Material Escolar", emoji: "📚" },
  { slug: "embalagens", nome: "Embalagens Alimentícias", emoji: "🥡" },
];

// Nomes usados no select do admin.
export const CATEGORIAS = CATEGORIAS_INFO.map((c) => c.nome);

export const categoriaPorSlug = (slug: string) =>
  CATEGORIAS_INFO.find((c) => c.slug === slug);
