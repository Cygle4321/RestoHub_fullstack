import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, Phone, Printer, XCircle, X as XIcon, Users, Tag, Package } from "lucide-react";
import QRCode from "qrcode";
import { Avatar, Badge, Button, Card, CardHeader, Modal, Spinner, statusVariant, useToast } from "../../components/ui";
import {
  fmt,
  isGroupOrder,
  extractGroupCode,
  parseItemParticipant,
  getGroupOrderParticipants,
  groupOrderItemsByParticipant,
} from "../../lib/mappers";
import { downloadOrderPdf } from "../../lib/documents";
import { waLink, orderWaText } from "../../lib/whatsapp";
import { useAuth } from "../../context/AuthContext";
import { restaurantApi } from "../../api/restaurant";
import BoxLabelsModal from "../../components/common/BoxLabelsModal";

export default function OrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { restaurant } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await restaurantApi.order(id);
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Impossible de charger la commande.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner label="Chargement de la commande…" />;
  if (error) return <p className="py-10 text-center text-sm text-danger-600">{error}</p>;
  if (!order) return null;

  const changeStatus = async (s) => {
    setSaving(true);
    try {
      const updated = await restaurantApi.updateOrderStatus(order._id, s);
      setOrder(updated);
      toast(`Commande ${order.number} : statut « ${s} »`);
    } catch (e) {
      toast(e?.message || "Erreur lors du changement de statut", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    setConfirmCancel(false);
    await changeStatus("Annulée");
  };

  const printReceipt = async () => {
    // QR code : la cliente/le client scanne et voit le statut de sa commande
    let qrDataUrl = "";
    try {
      const slug = restaurant?.slug || "";
      const trackUrl = `${window.location.origin}/store/${slug}/track?number=${encodeURIComponent(order.number || "")}&phone=${encodeURIComponent(order.customer?.phone || "")}`;
      if (slug) {
        qrDataUrl = await QRCode.toDataURL(trackUrl, { width: 240, margin: 1 });
      }
    } catch {
      /* pas de QR si la génération échoue */
    }

    const err = downloadOrderPdf({
      restaurantName: restaurant?.name || "Mon restaurant",
      order,
      qrDataUrl,
    });
    if (err) toast(err, "error");
  };

  const subtotal = order.subtotal != null ? order.subtotal : order.total - (order.delivery_fee || 0);
  const deliveryFee = order.delivery_fee || 0;
  const actions = ["Confirmée", "En préparation", "Prête", "En livraison", "Livrée"];
  const now = order.date || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 font-medium text-zinc-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Commandes
        </Link>
        <span>/</span>
        <span className="font-semibold text-zinc-900">{order.number || order.id}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Bannière Commande Groupée Bureau */}
          {isGroupOrder(order) && (
            <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 p-5 text-white shadow-xl sm:flex sm:items-center sm:justify-between gap-4 border border-primary-500/20">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30">
                  <Users size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Commande Groupée Bureau</span>
                    <span className="rounded-lg bg-primary-500/20 px-2 py-0.5 font-mono text-xs font-bold text-primary-300 ring-1 ring-primary-500/30 tracking-wider">
                      {extractGroupCode(order)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-300">
                    {getGroupOrderParticipants(order).length} participant(s) : {getGroupOrderParticipants(order).join(", ")}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setLabelsOpen(true)}
                className="mt-3 sm:mt-0 bg-white text-zinc-900 hover:bg-zinc-100 font-bold gap-1.5 shadow-sm"
              >
                <Tag size={14} className="text-primary-600" />
                <span>Imprimer étiquettes boîtes</span>
              </Button>
            </div>
          )}

          <Card>
            <CardHeader title={`Commande ${order.number || order.id}`} subtitle={now} action={<Badge variant={statusVariant(order.status)} dot>{order.status}</Badge>} />
            <div className="space-y-6 p-5">
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {(order.items || []).map((it, i) => {
                  const unitPrice = it.price ?? 0;
                  const { cleanName, participant } = parseItemParticipant(it.name);
                  return (
                    <li key={`${it.name}-${i}`} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <p className="truncate text-sm text-zinc-800">
                            <span className="font-semibold text-zinc-900">{it.qty}×</span> {cleanName}
                          </p>
                          {participant && (
                            <span className="shrink-0 rounded bg-primary-50 text-primary-700 font-bold px-1.5 py-0.5 text-[10px] ring-1 ring-inset ring-primary-200/80">
                              {participant}
                            </span>
                          )}
                        </div>
                        <p className="shrink-0 text-sm font-medium text-zinc-900">{fmt(unitPrice * it.qty)}</p>
                      </div>
                      {((it.options?.length || 0) > 0 || (it.supplements?.length || 0) > 0) && (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {[
                            ...(it.options || []).map((o) => `${o.name}: ${o.choice}`),
                            ...(it.supplements || []).map((s) => `+ ${s.name}`),
                          ].join(" · ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
                {order.mode === "Livraison" && <div className="flex justify-between text-zinc-600"><span>Frais de livraison</span><span>{fmt(deliveryFee)}</span></div>}
                {order.discount > 0 && <div className="flex justify-between text-zinc-600"><span>Réduction</span><span>-{fmt(order.discount)}</span></div>}
                <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold text-zinc-900"><span>Total</span><span>{fmt(order.total)}</span></div>
              </div>

              <div className="grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Avatar name={order.customer?.name} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{order.customer?.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><Phone size={12} /> {order.customer?.phone}</p>
                    {order.address !== "—" && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500"><MapPin size={12} /> {order.address}</p>}
                    <a
                      href={waLink(order.customer?.phone, orderWaText(order))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                    >
                      Contacter sur WhatsApp
                    </a>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-zinc-600"><CreditCard size={15} className="text-zinc-400" /> Paiement : <Badge variant="neutral">{order.payment}</Badge></p>
                  <p className="flex items-center gap-2 text-zinc-600">Mode : <Badge variant={order.mode === "Livraison" ? "primary" : "info"}>{order.mode}</Badge></p>
                </div>
              </div>
            </div>
          </Card>

          {/* Répartition des Boîtes Repas si commande groupée */}
          {isGroupOrder(order) && (
            <Card>
              <CardHeader
                title="Répartition des Boîtes Repas"
                subtitle="Détail des plats emballés par collègue"
                action={
                  <Button size="sm" onClick={() => setLabelsOpen(true)} className="gap-1.5 shadow-xs">
                    <Tag size={13} />
                    <span>Imprimer Étiquettes</span>
                  </Button>
                }
              />
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(groupOrderItemsByParticipant(order.items || []).grouped).map(([person, pItems]) => (
                  <div key={person} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5">
                      <span className="font-black text-xs text-zinc-900 inline-flex items-center gap-1.5">
                        <Package size={13} className="text-zinc-600" />
                        <span>Boîte de {person}</span>
                      </span>
                      <span className="text-[11px] font-bold text-zinc-600">
                        {fmt(pItems.reduce((acc, x) => acc + (x.price || 0) * (x.qty || 1), 0))}
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {pItems.map((it, idx) => (
                        <li key={idx} className="text-zinc-700">
                          <span className="font-semibold">{it.qty}×</span> {it.cleanName}
                          {((it.options?.length || 0) > 0 || (it.supplements?.length || 0) > 0) && (
                            <p className="text-[10px] text-zinc-400">
                              {[
                                ...(it.options || []).map((o) => `${o.name}: ${o.choice}`),
                                ...(it.supplements || []).map((s) => `+ ${s.name}`),
                              ].join(" · ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Historique du statut" subtitle="Suivi de la commande" />
            <div className="p-5">
              <ol className="relative space-y-6 border-l-2 border-zinc-100 pl-6">
                {(order.history?.length ? order.history : [{ s: order.status, t: "" }]).map((h, i) => (
                  <li key={`${h.s}-${i}`} className="relative">
                    <span className={`absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${statusVariant(h.s) === "danger" ? "bg-danger-500" : "bg-primary-500"}`}>
                      {statusVariant(h.s) === "danger" ? <XIcon size={11} className="text-white" /> : <CheckCircle2 size={11} className="text-white" />}
                    </span>
                    <p className="text-sm font-semibold text-zinc-900">{h.s}</p>
                    <p className="text-xs text-zinc-500">{h.t || "—"}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" subtitle="Mettre à jour le statut" />
            <div className="space-y-2 p-5">
              {actions.map((s) => (
                <Button key={s} variant={order.status === s ? "primary" : "secondary"} className="w-full" disabled={order.status === s || saving} onClick={() => changeStatus(s)}>
                  {s}
                </Button>
              ))}
              <Button variant="danger" className="w-full" onClick={() => setConfirmCancel(true)} disabled={order.status === "Annulée" || saving}>
                <XCircle size={16} /> Annuler la commande
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Impression / Facture" subtitle="Documents de la commande" />
            <div className="space-y-2 p-5">
              <Button variant="secondary" className="w-full" onClick={printReceipt}><Printer size={16} /> Imprimer le reçu</Button>
              <Button variant="secondary" className="w-full" onClick={printReceipt}>Télécharger la facture</Button>
              {isGroupOrder(order) && (
                <Button
                  variant="secondary"
                  className="w-full text-primary-700 hover:text-primary-800 border-primary-200 hover:bg-primary-50/50"
                  onClick={() => setLabelsOpen(true)}
                >
                  <Tag size={16} className="text-primary-600" />
                  <span>Étiquettes des boîtes (80mm)</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Annuler la commande"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>Retour</Button>
            <Button variant="danger" onClick={cancel}>Oui, annuler</Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">Êtes-vous sûr de vouloir annuler la commande <span className="font-semibold text-zinc-900">{order.number || order.id}</span> ? Cette action est définitive.</p>
      </Modal>

      <BoxLabelsModal
        open={labelsOpen}
        onClose={() => setLabelsOpen(false)}
        order={order}
        restaurantName={restaurant?.name}
      />
    </div>
  );
}