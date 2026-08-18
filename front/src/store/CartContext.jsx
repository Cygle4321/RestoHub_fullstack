import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo(() => {
    const add = (product, qty = 1) => {
      setItems((prev) => {
        const i = prev.findIndex((x) => x.id === product.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + qty };
          return next;
        }
        return [...prev, { ...product, qty }];
      });
      setCount((c) => c + 1);
    };
    const remove = (id) => {
      setItems((prev) => prev.filter((x) => x.id !== id));
      setCount((c) => c + 1);
    };
    const setQty = (id, qty) => {
      setItems((prev) => (qty <= 0 ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, qty } : x))));
    };
    const clear = () => setItems([]);
    const total = items.reduce((s, x) => s + x.price * x.qty, 0);
    return { items, add, remove, setQty, clear, total, count, isSidebarOpen, setSidebarOpen };
  }, [items, count, isSidebarOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
