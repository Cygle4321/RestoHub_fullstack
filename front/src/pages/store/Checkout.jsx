import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bike, Store, Smartphone, CreditCard, Banknote, ShoppingBag, Loader2, CheckCircle2, Users, X, XCircle, Tag, BadgePercent } from "lucide-react";
import { Card, CardHeader, Button, Input, Textarea, Select, EmptyState, useToast } from "../../components/ui";
import { useCart } from "../../store/CartContext";
import { useStore } from "../../store/StoreContext";
import { storeApi } from "../../api/store";
import { fmt, parseItemParticipant } from "../../lib/mappers";
import { computeDiscount } from "../../lib/discount";
import SEO from "../../components/common/SEO";

export default function Checkout() {
  const { slug, zones } = useStore();
  const { items, total, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [promoCode, setPromoCode] = useState(state?.promoCode || "");
  const [promo, setPromo] = useState(state?.promo || null);
  const [promoInput, setPromoInput] = useState(state?.promoCode || "");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  const applyPromo = async () => {
    const value = promoInput.trim().toUpperCase();
    if (!value) return false;
    setCheckingPromo(true);
    setPromoError("");
    try {
      const res = await storeApi.verifyPromo(slug, { code: value, subtotal: total, mode });
      if (res.valid) {
        setPromo(res);
        setPromoCode(res.code);
        toast(`Code promo ${res.code} appliqué !`);
        return true;
      }
      setPromo(null);
      setPromoError(res.message || "Code promo invalide.");
      return false;
    } catch {
      setPromoError("Impossible de vérifier le code promo.");
      return false;
    } finally {
      setCheckingPromo(false);
    }
  };

  const removePromo = () => {
    setPromo(null);
    setPromoCode("");
    setPromoInput("");
    setPromoError("");
  };

  const isGroupOrder = Boolean(state?.isGroupOrder);
  const groupCode = state?.groupCode || "";
  const hostName = state?.hostName || "";
  const groupNotes = state?.groupNotes || "";

  const [name, setName] = useState(hostName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState(groupNotes || "");
  const [zone, setZone] = useState(zones[0]?.id ?? "");
  const [mode, setMode] = useState("Livraison");
  const [payment, setPayment] = useState("Mobile Money");
  const [provider, setProvider] = useState("MTN");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zone && zones.length > 0) setZone(zones[0].id);
  }, [zones, zone]);

  if (items.length === 0) {
    return (
      <Card className="mx-auto mt-8 max-w-2xl">
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Ajoutez des articles avant de passer commande."
          action={<Button onClick={() => navigate(`/store/${slug}/menu`)}>Voir le menu</Button>}
        />
      </Card>
    );
  }

  const selectedZone = zones.find((z) => String(z.id) === String(zone));
  const deliveryFee = mode === "Livraison" ? selectedZone?.fee ?? 0 : 0;
  const freeDelivery = promo?.type === "free_delivery" && mode === "Livraison";
  const discount = computeDiscount(promo, total, deliveryFee);
  const grandTotal = Math.max(0, total + deliveryFee - discount);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Le nom est requis";
    if (!phone.trim()) e.phone = "Le téléphone est requis";
    else if (!/^[+\d][\d\s-]{6,}$/.test(phone.trim())) e.phone = "Numéro invalide";
    if (mode === "Livraison" && !address.trim()) e.address = "L'adresse est requise";
    if (mode === "Livraison" && zones.length > 0 && !selectedZone) e.zone = "La zone de livraison est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast("Veuillez corriger les erreurs du formulaire", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await storeApi.checkout(slug, {
        name,
        phone,
        email,
        mode,
        address,
        notes: customerNotes,
        zoneId: selectedZone?.id,
        payment,
        promoCode: promo?.code || promoCode || undefined,
        group_code: isGroupOrder ? groupCode : undefined,
        items: items.map((it) => ({
          product_id: it.id,
          name: it.name,
          quantity: it.qty,
          options: it.options,
          supplements: it.supplements,
        })),
      });
      if (result.payment_error) {
        toast(result.payment_error, "error");
        return;
      }
      clear();
      if (result.checkout_url) {
        toast("Redirection vers le paiement…");
        window.location.href = result.checkout_url;
        return;
      }
      toast("Commande confirmée !");
      navigate(`/store/${slug}/confirmation`, { state: { order: result.order } });
    } catch (err) {
      toast(err.message || "Impossible de passer la commande", "error");
    } finally {
      setLoading(false);
    }
  };

  const radioCard = (selected) =>
    `flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${
      selected ? "border-primary-500 bg-primary-50" : "border-zinc-200 hover:border-zinc-300"
    }`;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-4">
      <SEO title="Finaliser ma commande" noindex />
      <h1 className="text-xl font-bold text-zinc-900">Finaliser la commande</h1>

      {isGroupOrder && (
        <div className="mt-4 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 p-5 text-white shadow-xl sm:flex sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30">
              <Users size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Commande Groupée Bureau</span>
                <span className="rounded-lg bg-white/20 px-2 py-0.5 font-mono text-xs font-bold text-white tracking-wider">
                  {groupCode}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-300">
                Organisée par <strong>{hostName}</strong> · Le restaurant étiquettera individuellement chaque boîte repas.
              </p>
            </div>
          </div>
          <span className="mt-3 inline-flex items-center self-start sm:self-auto rounded-full bg-primary-500/20 px-3 py-1 text-xs font-bold text-primary-300 ring-1 ring-inset ring-primary-500/30 sm:mt-0">
            Livraison unique groupée
          </span>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Formulaire */}
        <div className="space-y-4">
          {/* Vos informations */}
          <Card>
            <CardHeader title="Vos informations" subtitle="Pour vous contacter au sujet de la livraison" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <Input label="Nom complet (Organisateur)" placeholder="Ex : Aminata Koné" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="mt-1 text-xs font-medium text-danger-600">{errors.name}</p>}
              </div>
              <div>
                <Input label="Téléphone" placeholder="+225 07 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
                {errors.phone && <p className="mt-1 text-xs font-medium text-danger-600">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <Input label="Email (optionnel)" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Instructions pour la cuisine & livraison"
                  rows={2}
                  placeholder="Ex : Répartition des sacs, code de la porte, sonnette…"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Mode de réception */}
          <Card>
            <CardHeader title="Mode de réception" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <label className={radioCard(mode === "Livraison")}>
                <input type="radio" className="mt-0.5 h-4 w-4 accent-primary-600" checked={mode === "Livraison"} onChange={() => setMode("Livraison")} />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-900"><Bike size={15} /> Livraison</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {selectedZone?.delay ? `Livré en ${selectedZone.delay}` : "Livré à l'adresse indiquée"}
                  </span>
                </span>
              </label>
              <label className={radioCard(mode === "Retrait")}>
                <input type="radio" className="mt-0.5 h-4 w-4 accent-primary-600" checked={mode === "Retrait"} onChange={() => setMode("Retrait")} />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-900"><Store size={15} /> Retrait sur place</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">Économisez les frais de livraison</span>
                </span>
              </label>
            </div>
            {mode === "Livraison" ? (
              <div className="grid gap-4 border-t border-zinc-100 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Textarea label="Adresse de livraison" rows={2} placeholder="Rue, quartier, point de repère…" value={address} onChange={(e) => setAddress(e.target.value)} />
                  {errors.address && <p className="mt-1 text-xs font-medium text-danger-600">{errors.address}</p>}
                </div>
                {zones.length > 0 && (
                  <div className="sm:col-span-2">
                    <Select label="Zone de livraison" value={zone} onChange={(e) => setZone(e.target.value)}>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} — {fmt(z.fee)}
                          {z.delay ? ` (${z.delay})` : ""}
                        </option>
                      ))}
                    </Select>
                    {errors.zone && <p className="mt-1 text-xs font-medium text-danger-600">{errors.zone}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-zinc-100 p-5">
                <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Retrait sur place — vous serez notifié dès que votre commande est prête.
                </p>
              </div>
            )}
          </Card>

          {/* Mode de paiement */}
          <Card>
            <CardHeader title="Mode de paiement" subtitle="Paiements sécurisés" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <label className={radioCard(payment === "Mobile Money")}>
                <input type="radio" className="mt-0.5 h-4 w-4 accent-primary-600" checked={payment === "Mobile Money"} onChange={() => setPayment("Mobile Money")} />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-900"><Smartphone size={15} /> Mobile Money</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">MTN, Moov, Celtiis, Wave, Orange</span>
                </span>
              </label>
              {/* Carte bancaire — temporairement désactivée
              <label className={radioCard(payment === "Carte bancaire")}>
                <input type="radio" className="mt-0.5 h-4 w-4 accent-primary-600" checked={payment === "Carte bancaire"} onChange={() => setPayment("Carte bancaire")} />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-900"><CreditCard size={15} /> Carte bancaire</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">Visa, Mastercard</span>
                </span>
              </label>
              */}
              <label className={radioCard(payment === "Paiement à la livraison")}>
                <input type="radio" className="mt-0.5 h-4 w-4 accent-primary-600" checked={payment === "Paiement à la livraison"} onChange={() => setPayment("Paiement à la livraison")} />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-900"><Banknote size={15} /> À la livraison</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">Espèces à la réception</span>
                </span>
              </label>
            </div>

            {payment === "Mobile Money" && (
              <div className="border-t border-zinc-100 p-5">
                <p className="mb-2 text-sm font-medium text-zinc-700">Opérateur</p>
                <div className="flex flex-wrap gap-2">
                  {["MTN", "Moov", "Celtiis", "Wave", "Orange"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                        provider === p ? "bg-primary-500 text-white ring-primary-500" : "bg-white text-zinc-600 ring-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-500">Vous recevrez une demande de confirmation sur votre téléphone {provider}.</p>
              </div>
            )}

            {/* Carte bancaire — temporairement désactivée
            {payment === "Carte bancaire" && (
              <div className="grid gap-4 border-t border-zinc-100 p-5 sm:grid-cols-[1fr_120px_100px]">
                <Input label="Numéro de carte" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                <Input label="Expiration" placeholder="MM/AA" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
                <Input label="CVC" placeholder="123" maxLength={4} value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
              </div>
            )}
            */}
          </Card>
        </div>

        {/* Résumé */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader title="Résumé de la commande" />
            <div className="space-y-2 p-5 text-sm">
              {/* Code promo / Coupon de réduction */}
              <div className="pb-2 border-b border-zinc-100">
                {!promo ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase());
                          setPromoError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyPromo();
                          }
                        }}
                        placeholder={isGroupOrder ? "Code promo (ex: GROUPE10, PROMO10)" : "Code promo (ex: PROMO10)"}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 px-3 text-xs"
                        onClick={applyPromo}
                        disabled={checkingPromo || !promoInput.trim()}
                      >
                        {checkingPromo ? <Loader2 size={13} className="animate-spin" /> : "Appliquer"}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-danger-600">
                        <XCircle size={12} /> {promoError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-success-50 px-3 py-2 text-xs font-semibold text-success-700 ring-1 ring-inset ring-success-200">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Code {promo.code} appliqué
                      {promo.type === "percent" && <span>(−{promo.value}%)</span>}
                      {promo.type === "fixed" && <span>(−{fmt(promo.value)})</span>}
                      {promo.type === "free_delivery" && <span>(Livraison offerte)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-success-600 hover:text-success-800 p-0.5 rounded transition"
                      title="Retirer le code"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {items.map((it) => {
                const { cleanName, participant } = parseItemParticipant(it.name);
                return (
                  <div key={it.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5 truncate text-zinc-600">
                      <span className="truncate">{it.qty} × {cleanName}</span>
                      {participant && (
                        <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-200">
                          {participant}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 font-medium text-zinc-900">{fmt(it.price * it.qty)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between border-t border-zinc-100 pt-3">
                <span className="text-zinc-500">Sous-total</span>
                <span className="font-medium text-zinc-900">{fmt(total)}</span>
              </div>
              {promo && discount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span className="font-medium">Remise ({promo.code})</span>
                  <span className="font-bold">−{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Livraison</span>
                <span className="font-medium text-zinc-900">
                  {mode === "Retrait" || freeDelivery ? "Offerte" : fmt(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-base">
                <span className="font-bold text-zinc-900">Total à payer</span>
                <span className="font-extrabold text-primary-600">{fmt(grandTotal)}</span>
              </div>
              <Button className="mt-3 w-full" onClick={submit} disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Traitement…" : "Confirmer et payer"}
              </Button>
              <p className="pt-1 text-center text-xs text-zinc-400">Paiement sécurisé par FedaPay · {payment}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}