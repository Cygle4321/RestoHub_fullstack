import { useState, useEffect } from "react";
import { MapPin, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, Modal, Select, Table, Td, Tabs, Toggle, useToast, Spinner, statusVariant } from "../../components/ui";
import { fmt } from "../../lib/mappers";
import { restaurantApi } from "../../api/restaurant";

const DRIVER_STATUS_UI = {
  disponible: "Disponible",
  en_course: "En course",
  indisponible: "Indisponible",
};

export default function Delivery() {
  const toast = useToast();
  const [tab, setTab] = useState("Zones");
  const [zones, setZones] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [toDeliver, setToDeliver] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneModal, setZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: "", fee: "", delay: "" });
  const [driverModal, setDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", vehicle: "Moto" });
  const [toDeleteZone, setToDeleteZone] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [zRes, dRes, oRes] = await Promise.all([
          restaurantApi.zones(),
          restaurantApi.drivers(),
          restaurantApi.orders()
        ]);
        if (!cancelled) {
          setZones(zRes.data || zRes || []);
          setDriversList(dRes.data || dRes || []);
          const allOrders = oRes.data?.data || oRes.data || oRes || [];
          setToDeliver(allOrders.filter((o) => o.mode === "Livraison" && ["Prête", "En livraison"].includes(o.status)));
        }
      } catch {
        // Fallback or error handled silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveZone = async () => {
    if (!zoneForm.name || !zoneForm.fee) return toast("Nom et frais requis", "error");
    try {
      const res = await restaurantApi.createZone({ name: zoneForm.name, fee: Number(zoneForm.fee), delay: zoneForm.delay || "20-30 min", is_active: true });
      const newZone = res.data || res;
      setZones((z) => [...z, newZone]);
      toast(`Zone « ${zoneForm.name} » ajoutée`);
      setZoneForm({ name: "", fee: "", delay: "" });
      setZoneModal(false);
    } catch {
      toast("Erreur d'ajout de zone", "error");
    }
  };

  const saveDriver = async () => {
    if (!driverForm.name || !driverForm.phone) return toast("Nom et téléphone requis", "error");
    try {
      const res = await restaurantApi.createDriver({ ...driverForm, status: "disponible" });
      const newDriver = res.data || res;
      setDriversList((d) => [...d, { ...newDriver, orders: 0 }]);
      toast(`Livreur « ${driverForm.name} » ajouté`);
      setDriverForm({ name: "", phone: "", vehicle: "Moto" });
      setDriverModal(false);
    } catch {
      toast("Erreur d'ajout du livreur", "error");
    }
  };

  const toggleZone = async (z) => {
    try {
      await restaurantApi.updateZone(z.id, { is_active: !z.is_active });
      setZones((l) => l.map((x) => (x.id === z.id ? { ...x, is_active: !x.is_active, active: !x.active } : x)));
    } catch {
      toast("Erreur", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Livraison</h1>
        {tab === "Zones" && <Button onClick={() => setZoneModal(true)}><Plus size={16} /> Ajouter une zone</Button>}
        {tab === "Livreurs" && <Button onClick={() => setDriverModal(true)}><Plus size={16} /> Inviter un livreur</Button>}
      </div>

      <Tabs tabs={["Zones", "Commandes à livrer", "Livreurs"]} active={tab} onChange={setTab} />

      {tab === "Zones" && (
        <Card>
          <CardHeader title="Zones de livraison" subtitle={`${zones.length} zones configurées`} />
          {loading ? (
            <div className="p-10 text-center"><Spinner label="Chargement..." /></div>
          ) : (
            <Table headers={["Zone", "Frais", "Délai", "Statut", "Actions"]}>
            {zones.map((z) => (
              <tr key={z.id} className="hover:bg-gray-50/60">
                <Td className="font-semibold text-gray-900">{z.name}</Td>
                <Td>{fmt(z.fee)}</Td>
                <Td className="text-gray-500">{z.delay}</Td>
                <Td><Toggle checked={z.active ?? z.is_active} onChange={() => toggleZone(z)} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => toast("Modification de zone à venir", "info")} className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-600" title="Modifier"><Pencil size={16} /></button>
                    <button onClick={() => setToDeleteZone(z)} className="rounded-lg p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </Td>
              </tr>
            ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "Commandes à livrer" && (
        <div className="space-y-6">
          {loading ? (
             <Card className="p-10 text-center"><Spinner label="Chargement..." /></Card>
          ) : toDeliver.length === 0 ? (
            <Card><CardHeader title="Commandes à livrer" subtitle="Aucune commande en attente de livraison" /></Card>
          ) : (
            toDeliver.map((o) => (
            <Card key={o._id ?? o.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900">{o.number || o.id}</p>
                    <Badge variant={statusVariant(o.status)} dot>{o.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{o.customer.name} · {o.customer.phone}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500"><MapPin size={14} /> {o.address}</p>
                </div>
                <div className="flex items-end gap-3">
                  <Select value="" onChange={() => toast(`Livreur assigné à la commande ${o.number || o.id}`)} className="w-56">
                    <option value="">Assigner un livreur…</option>
                    {driversList.map((d) => <option key={d.id} value={d.id}>{d.name} ({DRIVER_STATUS_UI[d.status] || d.status})</option>)}
                  </Select>
                  <Button onClick={() => toast(`Commande ${o.number || o.id} en route`)}>
                    <Truck size={16} /> Dispatcher
                  </Button>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      )}

      {tab === "Livreurs" && (
        <Card>
          <CardHeader title="Livreurs" subtitle={`${driversList.length} livreurs`} />
          {loading ? (
            <div className="p-10 text-center"><Spinner label="Chargement..." /></div>
          ) : (
          <Table headers={["Nom", "Téléphone", "Véhicule", "Statut", "Commandes du jour"]}>
            {driversList.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/60">
                <Td className="font-semibold text-gray-900">{d.name}</Td>
                <Td className="text-gray-500">{d.phone}</Td>
                <Td>{d.vehicle}</Td>
                <Td><Badge variant={statusVariant(DRIVER_STATUS_UI[d.status] || d.status)} dot>{DRIVER_STATUS_UI[d.status] || d.status}</Badge></Td>
                <Td>{d.orders ?? "—"}</Td>
              </tr>
            ))}
            </Table>
          )}
        </Card>
      )}

      <Modal
        open={zoneModal}
        onClose={() => setZoneModal(false)}
        title="Nouvelle zone de livraison"
        footer={
          <>
            <Button variant="secondary" onClick={() => setZoneModal(false)}>Annuler</Button>
            <Button onClick={saveZone}>Ajouter</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom de la zone" value={zoneForm.name} onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex : Treichville" />
          <Input label="Frais de livraison (FCFA)" type="number" min="0" value={zoneForm.fee} onChange={(e) => setZoneForm((f) => ({ ...f, fee: e.target.value }))} placeholder="1500" />
          <Input label="Délai estimé" value={zoneForm.delay} onChange={(e) => setZoneForm((f) => ({ ...f, delay: e.target.value }))} placeholder="20-30 min" />
        </div>
      </Modal>

      <Modal
        open={driverModal}
        onClose={() => setDriverModal(false)}
        title="Inviter un livreur"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDriverModal(false)}>Annuler</Button>
            <Button onClick={saveDriver}>Inviter</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom complet" value={driverForm.name} onChange={(e) => setDriverForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex : Koffi Adjé" />
          <Input label="Téléphone" value={driverForm.phone} onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+225 07 00 00 00" />
          <Select label="Véhicule" value={driverForm.vehicle} onChange={(e) => setDriverForm((f) => ({ ...f, vehicle: e.target.value }))}>
            <option>Moto</option>
            <option>Voiture</option>
            <option>Vélo</option>
          </Select>
        </div>
      </Modal>

      <Modal
        open={!!toDeleteZone}
        onClose={() => setToDeleteZone(null)}
        title="Supprimer la zone"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDeleteZone(null)}>Annuler</Button>
            <Button variant="danger" onClick={async () => {
              try {
                await restaurantApi.deleteZone(toDeleteZone.id);
                setZones((l) => l.filter((z) => z.id !== toDeleteZone.id));
                toast(`Zone « ${toDeleteZone.name} » supprimée`, "error");
              } catch {
                toast("Erreur de suppression", "error");
              }
              setToDeleteZone(null); 
            }}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Supprimer la zone « <span className="font-semibold text-gray-900">{toDeleteZone?.name}</span> » ?</p>
      </Modal>
    </div>
  );
}
