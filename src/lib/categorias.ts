// Fonte única das categorias do catálogo BG Atacado.
// `nome` é o valor gravado em produtos.categoria (precisa bater com o admin).
export type CategoriaInfo = {
  slug: string;
  nome: string;
  rotulo?: string;
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
  { slug: "embalagens", nome: "Embalagens Alimentícias", rotulo: "Embalagens", emoji: "🥡" },
  { slug: "alimentos", nome: "Alimentos", emoji: "🍪" },
];

// Nomes usados no select do admin.
export const CATEGORIAS = CATEGORIAS_INFO.map((c) => c.nome);

export const categoriaPorSlug = (slug: string) =>
  CATEGORIAS_INFO.find((c) => c.slug === slug);

// Nome canônico para filtrar produtos.categoria. Use sempre isto em vez de
// escrever o nome à mão: um literal fora desta lista não dá erro, só devolve
// zero produtos — foi assim que a página /limpeza escondeu o catálogo do admin.
export const categoriaNome = (slug: string): string => {
  const c = categoriaPorSlug(slug);
  if (!c) throw new Error(`Categoria desconhecida: ${slug}`);
  return c.nome;
};

// Valores antigos que ainda podem existir em produtos.categoria enquanto a
// migration 20260716120000 não roda. Sem isto, deploy e migration precisariam
// ser simultâneos: o código novo sozinho esconderia os produtos do seed antigo,
// e a migration sozinha esvaziaria a página no código antigo.
// TODO: remover assim que a migration estiver aplicada em produção.
const CATEGORIA_LEGADO: Record<string, string[]> = {
  limpeza: ["Limpeza"],
};

// Todos os valores aceitos para uma categoria — use com `.in("categoria", ...)`.
export const categoriaValores = (slug: string): string[] => [
  categoriaNome(slug),
  ...(CATEGORIA_LEGADO[slug] ?? []),
];

// Texto exibido na tela. Use SEMPRE isto para mostrar a categoria ao usuario e
// `nome` para filtrar/gravar no banco -- os dois divergem de proposito.
export const rotuloCategoria = (c: CategoriaInfo) => c.rotulo ?? c.nome;
