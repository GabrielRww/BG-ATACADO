import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  key: string; // produto_id + "|" + (variante ?? "")
  produto_id: string;
  nome: string;
  variante?: string | null;
  preco_unit: number;
  quantidade: number;
  imagem_url?: string | null;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key" | "quantidade">, qtd?: number) => void;
  removeItem: (key: string) => void;
  updateQtd: (key: string, qtd: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
};

const STORAGE_KEY = "bg_cart_v1";
const Ctx = createContext<CartCtx | undefined>(undefined);

const makeKey = (produto_id: string, variante?: string | null) =>
  `${produto_id}|${variante ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hidrata do localStorage só no cliente (SSR começa vazio).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignora */
    }
  }, []);

  // Persiste a cada mudança.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignora */
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "key" | "quantidade">, qtd = 1) => {
      const key = makeKey(item.produto_id, item.variante);
      setItems((prev) => {
        const ex = prev.find((i) => i.key === key);
        if (ex) {
          return prev.map((i) =>
            i.key === key ? { ...i, quantidade: i.quantidade + qtd } : i,
          );
        }
        return [...prev, { ...item, key, quantidade: qtd }];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (key: string) => setItems((prev) => prev.filter((i) => i.key !== key)),
    [],
  );

  const updateQtd = useCallback((key: string, qtd: number) => {
    setItems((prev) =>
      qtd <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantidade: qtd } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantidade, 0);
  const totalPrice = items.reduce((s, i) => s + i.preco_unit * i.quantidade, 0);

  return (
    <Ctx.Provider
      value={{ items, addItem, removeItem, updateQtd, clear, totalItems, totalPrice }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
