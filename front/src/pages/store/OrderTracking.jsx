import { useState } from "react";
import { Check, UtensilsCrossed, SearchX } from "lucide-react";
import { Card, CardHeader, Badge, Button, Input, EmptyState, useToast } from "../../components/ui";
import { useStore } from "../../store/StoreContext";
import { storeApi } from "../../api/store";
import { fmt } from "../../lib/mappers";

const STATUS_ORDER = ["Nouvelle", "Confirmée", "En préparation", "Prête", "En livraison", "Livrée"];

export default function OrderTracking() {
  const { slug } = useStore();
  const toast = useToast();
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!number.trim() || !phone.trim()) {
      toast("Renseignez le numéro de commande et le téléphone", "error");
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const result = await storeApi.track(slug, number.trim(), phone.trim());
      setOrder(result);
    } catch {
      setOrder(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const history = order?.history || [];
  const currentIdx = history.reduce((max, h) => {
    const idx = STATUS_ORDER.indexOf(h.s);
    return idx >= 0 ? Math.max(max, idx) : max;
  }, -1);
  const progress = currentIdx >= 0 ? Math.round((currentIdx / (STATUS_ORDER.length - 1)) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
      <h1 className="text-xl font-bold text-gray-900">Suivi de commande</h1>

      {!order ? (
        <Card className="mt-4 p-5">
          <p className="text-sm text-gray-600">
            Saisissez le numéro de votre commande et le téléphone utilisé pour la passer.
          </p>
          <form onSubmit={search} className="mt-4 space-y-3">
            <Input
              label="Numéro de commande"
              placeholder="Ex : CMD-0001"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            <Input
              label="Téléphone"
              placeholder="+225 07 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? "Recherche…" : "Suivre ma commande"}
            </Button>
          </form>
          {notFound && (
            <div className="mt-4">
              <EmptyState
                icon={SearchX}
                title="Commande introuvable"
                description="Vérifiez le numéro et le téléphone, puis réessayez."
              />
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">Commande</p>
            <Badge variant="primary">{order.number}</Badge>
          </div>

          {/* Barre de progression */}
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-gray-500">
              <span>Reçue</span>
              <span className="font-bold text-primary-600">{order.status}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Stepper */}
          {history.length > 0 && (
            <Card className="mt-4 p-5">
              <ol className="space-y-0">
                {history.map((s, i) => {
                  const done = i < history.length - 1;
                  const current = i === history.length - 1;
                  const last = i === history.length - 1;
                  return (
                    <li key={`${s.s}-${i}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            done
                              ? "bg-success-500 text-white"
                              : current
                                ? "bg-primary-50 ring-2 ring-primary-500"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {done ? (
                            <Check size={16} />
                          ) : current ? (
                            <span className="relative flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-75" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-600" />
                            </span>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-gray-300" />
                          )}
                        </span>
                        {!last && <span className="w-0.5 flex-1 bg-success-500" style={{ minHeight: 32 }} />}
                      </div>
                      <div className={`pb-6 ${last ? "pb-0" : ""}`}>
                        <p className={`text-sm font-semibold ${current ? "text-gray-900" : "text-gray-400"}`}>{s.s}</p>
                        {s.t && <p className="text-xs text-gray-400">{s.t}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}

          {/* Résumé commande */}
          <Card className="mt-4">
            <CardHeader title="Votre commande" subtitle={`${order.number} · ${order.items.length} articles`} />
            <div className="space-y-2 p-5 text-sm">
              {order.items.map((i) => (
                <div key={i.name} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-400">
                    <UtensilsCrossed size={18} />
                  </span>
                  <span className="flex-1 text-gray-600">{i.qty} × {i.name}</span>
                  <span className="font-medium text-gray-900">{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-primary-600">{fmt(order.total)}</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}