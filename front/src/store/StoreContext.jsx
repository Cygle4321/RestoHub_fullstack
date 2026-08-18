import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { storeApi, DEFAULT_STORE_SLUG } from "../api/store";

const StoreContext = createContext(null);

const DAY_KEYS = { 1: "lun", 2: "mar", 3: "mer", 4: "jeu", 5: "ven", 6: "sam", 0: "dim" };

export function StoreProvider({ children }) {
  const { slug: paramSlug } = useParams();
  const slug = paramSlug || DEFAULT_STORE_SLUG;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    storeApi
      .get(slug)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Boutique introuvable");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const value = useMemo(() => {
    const restaurant = data?.restaurant || null;
    const categories = data?.categories || [];
    const products = data?.products || [];
    const zones = data?.delivery_zones || [];
    return {
      slug,
      loading,
      error,
      restaurant,
      products,
      zones,
      categories,
      catNames: ["Tout", ...categories.map((c) => c.name)],
      todayHours: hoursToday(restaurant),
    };
  }, [slug, loading, error, data]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}

export function initialsOf(name) {
  if (!name) return "…";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function hoursToday(restaurant) {
  const hours = restaurant?.hours;
  if (!hours || typeof hours !== "object") return null;
  return hours[DAY_KEYS[new Date().getDay()]] || null;
}
