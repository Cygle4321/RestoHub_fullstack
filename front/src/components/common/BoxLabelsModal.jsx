import { useState } from "react";
import { Printer, X, Tag, Users, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { Modal, Button } from "../ui";
import { parseItemParticipant, extractGroupCode, groupOrderItemsByParticipant, fmt } from "../../lib/mappers";

export default function BoxLabelsModal({ open, onClose, order, restaurantName = "Restaurant" }) {
  if (!order) return null;

  const groupCode = extractGroupCode(order) || "GROUPE";
  const { grouped, ungrouped } = groupOrderItemsByParticipant(order.items || []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Étiquettes pour Boîtes Repas"
      subtitle={`Commande groupée ${groupCode} · ${order.number || ""}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Barre d'action */}
        <div className="flex items-center justify-between rounded-xl bg-primary-50 p-3 text-primary-950 border border-primary-200">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-primary-600" />
            <p className="text-xs font-semibold">
              Format adapté aux imprimantes thermiques 80mm et étiquettes adhésives de livraison.
            </p>
          </div>
          <Button size="sm" onClick={handlePrint} className="gap-1.5 shadow-xs">
            <Printer size={14} />
            <span>Lancer l'impression</span>
          </Button>
        </div>

        {/* Contenu imprimable */}
        <div id="box-labels-printable" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {Object.entries(grouped).map(([person, items], index) => {
            const personTotal = items.reduce(
              (acc, it) => acc + (it.price || 0) * (it.qty || 1),
              0
            );
            return (
              <div
                key={person}
                className="relative rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 shadow-sm space-y-2.5 print:border-black print:break-inside-avoid"
              >
                {/* En-tête étiquette */}
                <div className="flex items-start justify-between border-b border-zinc-200 pb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      {restaurantName}
                    </span>
                    <p className="text-xs font-mono font-bold text-zinc-700">
                      {order.number} · {groupCode}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                    Boîte #{index + 1}
                  </span>
                </div>

                {/* Prénom mis en avant */}
                <div className="rounded-xl bg-zinc-900 p-2.5 text-center text-white print:bg-black">
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block">
                    DESTINATAIRE
                  </span>
                  <p className="text-lg font-black tracking-wide text-white">
                    {person.toUpperCase()}
                  </p>
                </div>

                {/* Contenu de la boîte */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Contenu de la boîte :
                  </p>
                  <ul className="space-y-1 text-xs">
                    {items.map((it, i) => (
                      <li key={i} className="rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                        <div className="flex items-baseline justify-between font-bold text-zinc-900">
                          <span>{it.qty}× {it.cleanName}</span>
                          <span className="text-[11px] font-normal text-zinc-500">{fmt(it.price * it.qty)}</span>
                        </div>
                        {((it.options?.length || 0) > 0 || (it.supplements?.length || 0) > 0) && (
                          <p className="mt-0.5 text-[10px] text-zinc-500 font-medium">
                            {[
                              ...(it.options || []).map((o) => `${o.name}: ${o.choice || o}`),
                              ...(it.supplements || []).map((s) => `+ ${s.name || s}`),
                            ].join(" · ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pied d'étiquette */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[10px] text-zinc-400">
                  <span>Part à régler : {fmt(personTotal)}</span>
                  <span className="font-semibold text-emerald-600">Bon appétit !</span>
                </div>
              </div>
            );
          })}

          {/* Plats non attribués à un prénom (ex: suppléments partagés ou commandes mixtes) */}
          {ungrouped.length > 0 && (
            <div className="relative rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 shadow-sm space-y-2.5">
              <div className="flex items-start justify-between border-b border-zinc-200 pb-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    {restaurantName}
                  </span>
                  <p className="text-xs font-mono font-bold text-zinc-700">
                    {order.number} · {groupCode}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                  Partagé / Collectif
                </span>
              </div>
              <div className="rounded-xl bg-zinc-100 p-2.5 text-center text-zinc-800">
                <p className="text-sm font-black">PLATS EN COMMUN / ORGANISATEUR</p>
              </div>
              <ul className="space-y-1 text-xs">
                {ungrouped.map((it, i) => (
                  <li key={i} className="rounded-lg bg-zinc-50 p-2 border border-zinc-100 font-medium">
                    {it.qty}× {it.cleanName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
