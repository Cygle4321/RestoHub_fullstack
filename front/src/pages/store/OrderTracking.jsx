import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Star, UtensilsCrossed, SearchX, MessageCircle, Share2, Receipt } from "lucide-react";
import { Card, CardHeader, Badge, Button, Input, EmptyState, useToast } from "../../components/ui";
import { useStore } from "../../store/StoreContext";
import { storeApi } from "../../api/store";
import { fmt } from "../../lib/mappers";
import { waLink, generateOrderReceipt, getOrderTrackingUrl } from "../../lib/whatsapp";
import SEO from "../../components/common/SEO";
import ReceiptTicketModal from "../../components/common/ReceiptTicketModal";

const STATUS_ORDER = ["Nouvelle", "Confirmée", "En préparation", "Prête", "En livraison", "Livrée"];

export default function OrderTracking() {
  const { slug, restaurant } = useStore();
  const toast = useToast();
  const [params] = useSearchParams();
  // Pré-remplissage depuis un QR code de facture (?number=…&phone=…)
  const [number, setNumber] = useState(params.get("number") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Avis client
  const searchNumberRef = useRef("");
  const searchPhoneRef = useRef("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewDone, setReviewDone] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);

  const doSearch = async () => {
    if (!number.trim() || !phone.trim()) {
      toast("Renseignez le numéro de commande et le téléphone", "error");
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const result = await storeApi.track(slug, number.trim(), phone.trim());
      setOrder(result);
      searchNumberRef.current = number.trim().toUpperCase();
      searchPhoneRef.current = phone.trim();
    } catch {
      setOrder(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const search = async (e) => {
    e.preventDefault();
    await doSearch();
  };

  // Ouverture via QR code de facture : recherche automatique
  useEffect(() => {
    if (slug && params.get("number") && params.get("phone")) {
      doSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submitReview = async () => {
    if (!rating) {
      toast("Choisissez une note de 1 à 5 étoiles", "error");
      return;
    }
    setSendingReview(true);
    try {
      await storeApi.addReview(slug, {
        number: searchNumberRef.current,
        phone: searchPhoneRef.current,
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewDone(true);
      toast("Merci pour votre avis !");
    } catch (e) {
      toast(e?.message || "Impossible d'envoyer votre avis", "error");
    } finally {
      setSendingReview(false);
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
      <SEO title="Suivi de commande" noindex />
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

          {/* Actions WhatsApp directes */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowTicketModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              <Receipt size={15} />
              <span>Mon ticket / reçu (Image)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const trackUrl = getOrderTrackingUrl(order, slug);
                const shareText = `👋 Bonjour ! Voici le lien pour suivre la commande *#${order.number}* chez *${restaurant?.name || "le restaurant"}* en temps réel 🍲 :\n\n🔗 ${trackUrl}\n\nStatut actuel : *${order.status}*`;
                window.open(waLink("", shareText), "_blank", "noopener");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95"
            >
              <Share2 size={15} />
              <span>Partager le suivi</span>
            </button>
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
                  <span className="min-w-0 flex-1 truncate text-gray-600">{i.qty} × {i.name}</span>
                  <span className="shrink-0 font-medium text-gray-900">{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-primary-600">{fmt(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Avis client — uniquement après livraison */}
          {order.status === "Livrée" && (
            <Card className="mt-4">
              {reviewDone ? (
                <div className="p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
                    <Check size={22} className="text-success-500" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-gray-900">Merci pour votre avis !</p>
                  <p className="mt-1 text-xs text-gray-500">Il aide le restaurant à s'améliorer.</p>
                </div>
              ) : (
                <>
                  <CardHeader title="Notez votre commande" subtitle="Votre avis compte pour nous" />
                  <div className="space-y-3 p-5">
                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                          className="transition hover:scale-110"
                        >
                          <Star
                            size={30}
                            className={
                              n <= (hoverRating || rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Un commentaire (optionnel)…"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                    />
                    <Button className="w-full" onClick={submitReview} disabled={sendingReview}>
                      {sendingReview ? "Envoi…" : "Envoyer mon avis"}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </>
      )}

      {/* Modal du ticket de commande avec image HD & partage */}
      <ReceiptTicketModal
        open={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        order={order}
        restaurant={restaurant}
        storeSlug={slug}
        customerPhone={order?.customer?.phone || searchPhoneRef.current || phone}
      />
    </div>
  );
}