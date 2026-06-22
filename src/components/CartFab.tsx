import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

// Botão flutuante do carrinho — visível em qualquer página quando há itens.
export function CartFab() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <Link
      to="/carrinho"
      aria-label={`Carrinho com ${totalItems} item(ns)`}
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-white font-semibold shadow-xl transition-transform hover:scale-105"
      style={{ background: "var(--color-primary-dark)" }}
    >
      <span className="relative">
        <ShoppingCart size={22} />
        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-gold,#d4a017)] px-1 text-[11px] font-bold text-black">
          {totalItems}
        </span>
      </span>
      <span className="hidden sm:inline">Ver carrinho</span>
    </Link>
  );
}
