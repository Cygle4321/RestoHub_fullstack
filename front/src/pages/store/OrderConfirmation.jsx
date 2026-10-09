import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, MapPin, Clock, CreditCard, Loader2 } from "lucide-react";
import { Card, Badge, Button, EmptyState } from "../../components/ui";
import { useStore } from "../../store/StoreContext";
import { storeApi } from "../../api/store";
import { fmt } from "../../lib/mappers";
import SEO from "../../components/common/SEO";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const { slug } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tx =
    searchParams.get("tx") ||
    searchParams.get("id") ||
    searchParams.get("transaction_id") ||
    searchParams.get("reference") ||
    "";
  const [order, setOrder] = useState(state?.order || null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(!state?.order && Boolean(tx));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (order || !tx) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    storeApi
      .paymentStatus(slug, tx)
      .then((data) => {
        if (cancelled) return;
        setOrder(data.order);
        setPaymentStatus(data.payment?.status || "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tx, slug, order]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-gray-500">
        <Loader2 size={20} className="animate-spin text-primary-600" />
        Vérification du paiement…
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="mx-auto max-w-md px-4 pb-8 pt-10 text-center">
        <EmptyState
          icon={XCircle}
          title="Aucune commande à afficher"
          description="Votre commande est peut-être en cours de traitement."
        />
        <Button className="mt-4 w-full" onClick={() => navigate(`/store/${slug}`)}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const approved = paymentStatus === "approved" || order.payment_status === "paid";
  const failed =
    ["declined", "canceled", "cancelled", "failed"].includes(paymentStatus) ||
    order.payment_status === "failed";

  if (failed) {
    return (
      <div className="mx-auto max-w-md px-4 pb-8 pt-10 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-danger-50">
          <XCircle size={44} className="text-danger-500" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-gray-900">Paiement non abouti</h1>
        <p className="mt-2 text-sm text-gray-500">
          Votre commande <span className="font-bold text-gray-900">{order.number}</span> n'a pas été
          payée.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Aucun montant n'a été débité. Vous pouvez réessayer.
        </p>
        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={() => navigate(`/store/${slug}/menu`)}>
            Réessayer la commande
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate(`/store/${slug}`)}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = order.delivery_fee ?? 0;
  const total = order.total ?? subtotal + delivery;

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-10 text-center">
      <SEO title="Confirmation de commande" noindex />
      <span
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
          approved ? "bg-success-50" : "bg-amber-50"
        }`}
      >
        <CheckCircle2 size={44} className={approved ? "text-success-500" : "text-amber-500"} />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-gray-900">
        {approved ? "Commande confirmée !" : "Commande reçue"}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Votre commande <span className="font-bold text-gray-900">{order.number}</span> a bien été reçue.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {approved
          ? "Paiement confirmé. Vous recevrez un SMS dès qu'elle est en préparation."
          : paymentStatus === "pending"
            ? "Le paiement est en attente de confirmation."
            : "Vous recevrez un SMS dès qu'elle est en préparation."}
      </p>

      <Card className="mt-6 p-5 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Récapitulatif</h2>
          <Badge variant="primary">{order.number}</Badge>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {order.items.map((i) => (
            <div key={i.name} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-gray-600">{i.qty} × {i.name}</span>
              <span className="shrink-0 font-medium text-gray-900">{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-gray-500">Livraison</span>
            <span className="font-medium text-gray-900">{order.mode === "Retrait" ? "—" : fmt(delivery)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Réduction</span>
              <span className="font-medium text-success-600">−{fmt(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-extrabold text-primary-600">{fmt(total)}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-xs">
          <p className="flex items-center gap-1.5 text-gray-500">
            <Clock size={14} className="text-gray-400" /> {order.mode}
          </p>
          <p className="flex items-center gap-1.5 text-gray-500">
            <CreditCard size={14} className="text-gray-400" /> {order.payment}
          </p>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        <Button className="w-full" onClick={() => navigate(`/store/${slug}/track`)}>
          <MapPin size={16} /> Suivre ma commande
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => navigate(`/store/${slug}`)}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}