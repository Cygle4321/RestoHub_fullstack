import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { Check, Download, ExternalLink, Loader } from "lucide-react";
import { Badge, Button, Card, CardHeader, Modal, Spinner, Table, Td, useToast } from "../../components/ui";
import { fmt } from "../../lib/mappers";
import { downloadSubscriptionPdf } from "../../lib/documents";
import { useAuth } from "../../context/AuthContext";
import { restaurantApi } from "../../api/restaurant";

const SUB_STATUS = {
  active: "Actif",
  trialing: "Essai",
  past_due: "En retard",
  cancelled: "Annulé",
  expired: "Expiré",
};

export default function Billing() {
  const toast = useToast();
  const { restaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [subscribeId, setSubscribeId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [restricted, setRestricted] = useState(false);

  const load = async () => {
    const [plansRes, billingRes] = await Promise.all([
      restaurantApi.plans(),
      restaurantApi.billing(),
    ]);
    setPlans(Array.isArray(plansRes) ? plansRes : plansRes.data || []);
    setSubscription(billingRes.subscription || null);
    setHistory(Array.isArray(billingRes.history) ? billingRes.history : []);
    setRestricted(!!billingRes.restricted);
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) {
          const returnStatus = (searchParams.get("status") || "").toLowerCase();
          if (searchParams.get("tx")) {
            if (returnStatus === "approved") {
              toast("Paiement confirmé ! Votre abonnement est actif.", "success");
            } else if (["declined", "cancelled", "failed"].includes(returnStatus)) {
              toast("Le paiement n'a pas abouti. Vous pouvez réessayer.", "error");
            } else {
              toast("Paiement en attente de confirmation…", "info");
            }
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      } catch {
        if (!cancelled) toast("Erreur de chargement de la facturation", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const choosePlan = async (plan) => {
    setSubscribeId(plan.id);
    setBusy(true);
    try {
      const res = await restaurantApi.subscribe(plan.id, "monthly");
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast(`Plan « ${plan.name} » sélectionné`);
      }
      await load();
    } catch (e) {
      toast(e?.message || "Erreur lors de la souscription", "error");
    } finally {
      setBusy(false);
      setSubscribeId(null);
    }
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      const res = await restaurantApi.cancelSubscription();
      toast(res?.message || "Abonnement annulé", "info");
      setCancelModal(false);
      await load();
    } catch (e) {
      toast(e?.message || "Erreur lors de l'annulation", "error");
    } finally {
      setCancelling(false);
    }
  };

  const downloadInvoice = async (h) => {
    const planName = h.plan?.name || current?.name || "Abonnement RestoHub";

    // QR code : renvoie vers l'espace facturation du restaurant
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/dashboard/billing`, {
        width: 240,
        margin: 1,
      });
    } catch {
      /* pas de QR si la génération échoue */
    }

    const err = downloadSubscriptionPdf({
      restaurantName: restaurant?.name || "Mon restaurant",
      inv: h,
      planName,
      qrDataUrl,
      qrCaption: "Espace<br/>facturation",
    });
    if (err) toast(err, "error");
  };

  if (loading) return <Spinner label="Chargement de la facturation…" />;

  const current = subscription?.plan || plans.find((p) => subscription && p.id === subscription.plan_id);
  const statusLabel = subscription ? SUB_STATUS[subscription.status] || subscription.status : "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Abonnement & facturation</h1>

      {restricted && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Votre période d'essai est terminée.</p>
          <p className="mt-1">Choisissez et payez un plan ci-dessous pour reprendre la gestion de votre boutique.</p>
        </div>
      )}

      <Card>
        <CardHeader title="Plan actuel" subtitle="Votre abonnement RestoHub" action={<Badge variant={subscription?.status === "active" ? "success" : "neutral"} dot>{statusLabel}</Badge>} />
        {current ? (
          <div className="grid gap-6 p-5 md:grid-cols-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">{current.name} <span className="text-base font-medium text-gray-500">· {fmt(subscription?.amount ?? current.price_monthly)}/{subscription?.billing_cycle === "yearly" ? "an" : "mois"}</span></p>
              <p className="mt-1 text-sm text-gray-500">Prochain renouvellement : <span className="font-semibold text-gray-700">{subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString("fr-FR") : "—"}</span></p>
              <ul className="mt-4 space-y-2">
                {(current.features || []).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success-600"><Check size={12} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-3 md:items-end">
              <Button onClick={() => document.getElementById("plans-grid")?.scrollIntoView({ behavior: "smooth" })}>Changer de plan</Button>
              <Button
                variant="danger"
                disabled={subscription?.status === "active"}
                title={subscription?.status === "active" ? "L'annulation n'est pas disponible pour un abonnement payé" : undefined}
                onClick={() => setCancelModal(true)}
              >
                Annuler l'abonnement
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">Aucun abonnement actif.</div>
        )}
      </Card>

      <div id="plans-grid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Nos plans</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = current && p.id === current.id;
            return (
              <Card key={p.id} className={`p-6 ${isCurrent ? "ring-2 ring-primary-500" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  {isCurrent && <Badge variant="primary">Actuel</Badge>}
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{fmt(p.price_monthly)}<span className="text-sm font-medium text-gray-500">/mois</span></p>
                <ul className="mt-5 space-y-2.5">
                  {(p.features || []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="shrink-0 text-success-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant={isCurrent ? "secondary" : "primary"} className="mt-6 w-full" disabled={isCurrent || busy} onClick={() => choosePlan(p)}>
                  {busy && subscribeId === p.id ? <Loader size={15} className="animate-spin" /> : isCurrent ? "Plan actuel" : <>Choisir <ExternalLink size={14} /></>}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader title="Historique de facturation" subtitle={`${history.length} abonnement(s)`} />
        <Table headers={["Référence", "Date", "Montant", "Statut", ""]} empty={history.length === 0}>
          {history.map((h) => (
            <tr key={h.id} className="hover:bg-gray-50/60">
              <Td className="font-semibold text-gray-900">{h.number || `SUB-${String(h.id).padStart(4, "0")}`}</Td>
              <Td className="text-gray-500">{h.starts_at ? new Date(h.starts_at).toLocaleDateString("fr-FR") : "—"}</Td>
              <Td className="font-semibold text-gray-900">{fmt(h.amount)}</Td>
              <Td><Badge variant={h.status === "active" ? "success" : h.status === "cancelled" ? "danger" : "neutral"} dot>{SUB_STATUS[h.status] || h.status}</Badge></Td>
              <Td>
                <button onClick={() => downloadInvoice(h)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-primary-600 hover:bg-primary-50">
                  <Download size={15} /> PDF
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Annuler l'abonnement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModal(false)}>Retour</Button>
            <Button variant="danger" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? "Annulation…" : "Confirmer l'annulation"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Vous perdrez l'accès aux fonctionnalités du plan <span className="font-semibold text-gray-900">{current?.name || "actuel"}</span> à la fin de la période en cours. Vos données seront conservées 30 jours. Souhaitez-vous continuer ?
        </p>
      </Modal>
    </div>
  );
}