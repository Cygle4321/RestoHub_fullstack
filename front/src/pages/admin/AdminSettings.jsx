import { useEffect, useState } from "react";
import { Settings, CreditCard, Bell, Users, ShieldCheck, UserPlus } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, Input, Modal, Spinner, Table, Td, Textarea, Toggle, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";

const sections = [
  { key: "general", label: "Général", icon: Settings },
  { key: "paiements", label: "Paiements", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "equipe", label: "Équipe", icon: Users },
  { key: "securite", label: "Sécurité", icon: ShieldCheck },
];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("general");

  const [general, setGeneral] = useState(null);
  const [payments, setPayments] = useState(null);
  const [notif, setNotif] = useState(null);
  const [securite, setSecurite] = useState(null);
  const [team, setTeam] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .settings()
      .then((data) => {
        if (cancelled) return;
        setGeneral(data.settings.general || {});
        setPayments(data.settings.payments || {});
        setNotif(data.settings.notifications || {});
        setSecurite(data.settings.security || {});
        setTeam(Array.isArray(data.team) ? data.team : []);
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      })
      .catch(() => { if (!cancelled) toast("Erreur de chargement des paramètres", "error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const save = async (payload, msg) => {
    setSaving(true);
    try {
      await adminApi.updateSettings(payload);
      toast(msg);
    } catch {
      toast("Erreur lors de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (m) => {
    try {
      await adminApi.deleteUser(m.id);
      setTeam((t) => t.filter((x) => x.id !== m.id));
      toast(`${m.name} retiré de l'équipe`, "error");
    } catch {
      toast("Impossible de retirer le membre", "error");
    }
  };

  const addMember = async () => {
    if (!newMember.name.trim() || !newMember.email.includes("@") || newMember.password.length < 8) {
      toast("Nom, email valide et mot de passe (8+ caractères) requis", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await adminApi.createAdminUser({
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        password: newMember.password,
      });
      setTeam((t) => [...t, { id: res.id, name: res.name, email: res.email, avatar: res.avatar || null, role: "Super Admin", current: false }]);
      toast(`${res.name} a rejoint l'équipe d'administration`);
      setAddOpen(false);
      setNewMember({ name: "", email: "", password: "" });
    } catch (e) {
      toast(e.response?.data?.message || "Impossible de créer le compte admin", "error");
    } finally {
      setCreating(false);
    }
  };

  const revokeSession = async (s) => {
    try {
      await adminApi.revokeSession(s.id);
      setSessions((ss) => ss.filter((x) => x.id !== s.id));
      toast("Session révoquée", "error");
    } catch {
      toast("Impossible de révoquer la session", "error");
    }
  };

  if (loading) return <Spinner label="Chargement des paramètres…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Vertical tabs */}
        <Card className="h-fit p-2">
          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${section === s.key ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <s.icon size={18} /> {s.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          {section === "general" && (
            <Card>
              <CardHeader title="Général" subtitle="Informations de la plateforme" />
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Nom de la plateforme" value={general.name} onChange={(e) => setGeneral({ ...general, name: e.target.value })} />
                  <Input label="URL" value={general.url} onChange={(e) => setGeneral({ ...general, url: e.target.value })} />
                </div>
                <Input label="Email de support" value={general.email} onChange={(e) => setGeneral({ ...general, email: e.target.value })} />
                <Textarea label="Description" rows={3} value={general.description} onChange={(e) => setGeneral({ ...general, description: e.target.value })} />
                <div className="rounded-lg border border-gray-200 p-4">
                  <Toggle checked={general.maintenance} onChange={(v) => setGeneral({ ...general, maintenance: v })} label="Mode maintenance (plateforme inaccessible aux restaurants)" />
                </div>
                <Button onClick={() => save({ general }, "Paramètres généraux enregistrés")} disabled={saving}>Enregistrer</Button>
              </div>
            </Card>
          )}

          {section === "paiements" && (
            <Card>
              <CardHeader title="Paiements" subtitle="Passerelles et commission" />
              <div className="space-y-4 p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Mobile Money</p>
                      <p className="text-xs text-gray-500">MTN MoMo, Moov Money, Celtiis Cash, Orange Money, Wave</p>
                    </div>
                    <Toggle checked={payments.mobileMoney} onChange={(v) => setPayments({ ...payments, mobileMoney: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Carte bancaire</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard via Stripe</p>
                    </div>
                    <Toggle checked={payments.carte} onChange={(v) => setPayments({ ...payments, carte: v })} />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Input label="Commission plateforme (%)" type="number" min={0} max={100} value={payments.commission} onChange={(e) => setPayments({ ...payments, commission: Number(e.target.value) })} />
                </div>
                <Button onClick={() => save({ payments }, "Paramètres de paiement enregistrés")} disabled={saving}>Enregistrer</Button>
              </div>
            </Card>
          )}

          {section === "notifications" && (
            <Card>
              <CardHeader title="Notifications" subtitle="Alertes de la plateforme" />
              <div className="space-y-3 p-5">
                {[
                  { key: "nouveauRestaurant", label: "Nouveau restaurant inscrit" },
                  { key: "paiement", label: "Paiement réussi" },
                  { key: "echecPaiement", label: "Échec de paiement" },
                  { key: "tickets", label: "Nouveau ticket de support" },
                  { key: "resumeHebdo", label: "Résumé hebdomadaire par email" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-700">{n.label}</p>
                    <Toggle checked={notif[n.key]} onChange={(v) => setNotif({ ...notif, [n.key]: v })} />
                  </div>
                ))}
                <Button onClick={() => save({ notifications: notif }, "Notifications enregistrées")} disabled={saving}>Enregistrer</Button>
              </div>
            </Card>
          )}

          {section === "equipe" && (
            <Card>
              <CardHeader
                title="Équipe d'administration"
                subtitle="Membres ayant accès à la console"
                action={<Button className="!px-3 !py-1.5 !text-xs" onClick={() => setAddOpen(true)}><UserPlus size={14} /> Ajouter</Button>}
              />
              <Table headers={["Membre", "Email", "Rôle", ""]}>
                {team.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <span className="font-semibold text-gray-900">{m.name}</span>
                      </div>
                    </Td>
                    <Td>{m.email}</Td>
                    <Td><Badge variant="primary">{m.role}</Badge></Td>
                    <Td>
                      {!m.current && (
                        <Button variant="danger" className="!px-3 !py-1.5 !text-xs" onClick={() => removeMember(m)}>Retirer</Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}

          {section === "securite" && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Sécurité" subtitle="Protection du compte" />
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Authentification à deux facteurs (2FA)</p>
                      <p className="text-xs text-gray-500">Exiger un code de vérification pour tous les admins</p>
                    </div>
                    <Toggle checked={securite.twofa} onChange={(v) => setSecurite({ ...securite, twofa: v })} />
                  </div>
                  <Button onClick={() => save({ security: securite }, "Paramètres de sécurité enregistrés")} disabled={saving}>Enregistrer</Button>
                </div>
              </Card>
              <Card>
                <CardHeader title="Sessions actives" subtitle="Appareils connectés" />
                <Table headers={["Appareil", "Dernière activité", "Créée le", ""]}>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <Td className="font-semibold text-gray-900">{s.device} {s.current && <Badge variant="success">Actuelle</Badge>}</Td>
                      <Td>{fmtDate(s.last_used_at)}</Td>
                      <Td className="text-gray-500">{fmtDate(s.created_at)}</Td>
                      <Td>
                        {!s.current && (
                          <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => revokeSession(s)}>Révoquer</Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter un membre"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button onClick={addMember} disabled={creating}>
              {creating ? "Création…" : "Ajouter"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom complet" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Ex : Aminata Bakayoko" />
          <Input label="Email" type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} placeholder="exemple@restosaas.com" />
          <Input label="Mot de passe" type="password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} placeholder="8 caractères minimum" />
          <p className="text-xs text-gray-500">Le nouveau membre aura le rôle Super Admin et accès à toute la console.</p>
        </div>
      </Modal>
    </div>
  );
}