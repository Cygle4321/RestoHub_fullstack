import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Bell, CreditCard, Lock, UtensilsCrossed as RestaurantIcon, ShieldCheck, User, Users, Camera, X,
} from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, Input, Modal, Select, Table, Td, Toggle, useToast, Spinner } from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";
import { authApi } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { compressImage, IMAGE_TYPES, MAX_IMAGE_SIZE } from "../../lib/image";

const TABS = [
  { id: "Profil", icon: User },
  { id: "Restaurant", icon: RestaurantIcon },
  { id: "Utilisateurs", icon: Users },
  { id: "Notifications", icon: Bell },
  { id: "Paiements", icon: CreditCard },
  { id: "Sécurité", icon: Lock },
];

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  const h = Math.floor(diff / 3600);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Hier" : `Il y a ${d} jours`;
};

export default function Settings() {
  const toast = useToast();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Profil");

  const [profil, setProfil] = useState({ name: "", email: "", phone: "", avatar: "" });
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  const avatarInput = useRef(null);
  const [resto, setResto] = useState({ name: "", address: "", description: "" });
  const [team, setTeam] = useState([]);
  const [inviteModal, setInviteModal] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "staff", name: "" });
  const [notif, setNotif] = useState({ order: true, cancel: true, tickets: true, reminder: false, marketing: false });
  const [pay, setPay] = useState({ orange: true, mtn: true, wave: false, card: false, cod: true });
  const [security, setSecurity] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [sessions, setSessions] = useState([]);
  const [twoFactor, setTwoFactor] = useState({ enabled: false, loading: false, pending: false, secret: "", qrUri: "", qrData: "", code: "", confirming: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, settingsRes, teamRes, tfaRes, sessRes] = await Promise.all([
          authApi.me(),
          restaurantApi.settings(),
          restaurantApi.team(),
          restaurantApi.twoFactorStatus().catch(() => ({ enabled: false })),
          restaurantApi.securitySessions().catch(() => ({ sessions: [] })),
        ]);
        if (!cancelled) {
          const u = meRes.data || meRes;
          setProfil({ name: u.name, email: u.email, phone: u.phone || "", avatar: u.avatar || "" });
          
          const s = settingsRes.data || settingsRes;
          setResto({ name: s.name, address: s.address || "", description: s.description || "" });
          if (s.notifications_settings) setNotif(s.notifications_settings);
          if (s.payment_settings) setPay(s.payment_settings);

          setTeam(teamRes.data || teamRes || []);
          setTwoFactor((t) => ({ ...t, enabled: !!tfaRes.enabled }));
          const sess = sessRes.sessions || sessRes || [];
          setSessions(Array.isArray(sess) ? sess : []);
        }
      } catch (e) {
        if (!cancelled) toast("Erreur de chargement", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const notifToggle = (k, label) => (v) => {
    const newNotif = { ...notif, [k]: v };
    setNotif(newNotif);
    restaurantApi.updateSettings({ notifications_settings: newNotif })
      .then(() => toast(`${label} : ${v ? "activé" : "désactivé"}`, v ? "success" : "info"))
      .catch(() => toast("Erreur lors de l'enregistrement", "error"));
  };

  const payToggle = (k, label) => (v) => {
    const newPay = { ...pay, [k]: v };
    setPay(newPay);
    restaurantApi.updateSettings({ payment_settings: newPay })
      .then(() => toast(`${label} : ${v ? "activé" : "désactivé"}`, v ? "success" : "info"))
      .catch(() => toast("Erreur lors de l'enregistrement", "error"));
  };

  const revokeSession = async (s) => {
    try {
      await restaurantApi.revokeSecuritySession(s.id);
      setSessions((list) => list.filter((x) => x.id !== s.id));
      toast("Session déconnectée", "info");
    } catch (e) {
      toast(e?.message || "Erreur lors de la déconnexion", "error");
    }
  };

  const handleAvatar = async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast("Format non supporté (PNG, JPG ou WebP)", "error");
    if (file.size > MAX_IMAGE_SIZE) return toast("Image trop lourde (max 4 Mo)", "error");
    setAvatarProcessing(true);
    try {
      const dataUrl = await compressImage(file, 512, 0.85);
      setProfil((p) => ({ ...p, avatar: dataUrl }));
      toast("Photo ajoutée", "success");
    } catch {
      toast("Impossible de traiter l'image", "error");
    } finally {
      setAvatarProcessing(false);
    }
  };

  const saveProfil = async () => {
    if (!profil.name.trim()) return toast("Le nom est requis", "error");
    try {
      const res = await authApi.updateProfile({ name: profil.name, email: profil.email, phone: profil.phone, avatar: profil.avatar || null });
      await refresh();
      toast("Profil enregistré");
      setProfil((p) => ({ ...p, name: res.user?.name || p.name, email: res.user?.email || p.email }));
    } catch (e) {
      toast(e?.message || "Erreur lors de l'enregistrement", "error");
    }
  };

  const saveResto = async () => {
    try {
      await restaurantApi.updateSettings({ name: resto.name, address: resto.address, description: resto.description });
      toast("Informations du restaurant enregistrées");
    } catch (e) {
      toast(e?.message || "Erreur lors de l'enregistrement", "error");
    }
  };

  const start2fa = async () => {
    setTwoFactor((t) => ({ ...t, loading: true }));
    try {
      const res = await restaurantApi.toggleTwoFactor({ enabled: true });
      if (res.pending) {
        setTwoFactor((t) => ({
          ...t, loading: false, pending: true, secret: res.secret, qrUri: res.qr_uri, qrData: "", code: "",
        }));
        QRCode.toDataURL(res.qr_uri, { width: 180, margin: 1 })
          .then((url) => setTwoFactor((t) => (t.qrUri === res.qr_uri ? { ...t, qrData: url } : t)))
          .catch(() => {});
      } else {
        setTwoFactor((t) => ({ ...t, loading: false, enabled: true }));
        toast(res.message || "2FA activée", "success");
      }
    } catch (e) {
      setTwoFactor((t) => ({ ...t, loading: false }));
      toast(e?.message || "Erreur lors de l'activation", "error");
    }
  };

  const confirm2fa = async () => {
    if (!/^\d{6}$/.test(twoFactor.code.trim())) return toast("Entrez le code à 6 chiffres", "error");
    setTwoFactor((t) => ({ ...t, confirming: true }));
    try {
      const res = await restaurantApi.toggleTwoFactor({ enabled: true, code: twoFactor.code.trim() });
      setTwoFactor((t) => ({ ...t, confirming: false, enabled: true, pending: false, secret: "", qrUri: "", qrData: "", code: "" }));
      toast(res.message || "Authentification à deux facteurs activée", "success");
    } catch (e) {
      setTwoFactor((t) => ({ ...t, confirming: false }));
      toast(e?.message || "Code invalide", "error");
    }
  };

  const cancel2fa = () => setTwoFactor((t) => ({ ...t, pending: false, secret: "", qrUri: "", qrData: "", code: "" }));

  const disable2fa = async () => {
    setTwoFactor((t) => ({ ...t, loading: true }));
    try {
      const res = await restaurantApi.toggleTwoFactor({ enabled: false });
      setTwoFactor((t) => ({ ...t, loading: false, enabled: false }));
      toast(res.message || "2FA désactivée", "info");
    } catch (e) {
      setTwoFactor((t) => ({ ...t, loading: false }));
      toast(e?.message || "Erreur lors de la désactivation", "error");
    }
  };

  const savePassword = async () => {
    if (!security.current_password || !security.password) return toast("Renseignez le mot de passe actuel et le nouveau", "error");
    if (security.password !== security.password_confirmation) return toast("Les mots de passe ne correspondent pas", "error");
    try {
      await restaurantApi.updatePassword(security);
      toast("Mot de passe mis à jour");
      setSecurity((s) => ({ ...s, current_password: "", password: "", password_confirmation: "" }));
    } catch (e) {
      toast(e.response?.data?.message || "Erreur lors de la mise à jour", "error");
    }
  };

  const sendInvite = async () => {
    if (!invite.email.includes("@")) return toast("Email invalide", "error");
    try {
      const res = await restaurantApi.inviteTeamMember(invite);
      setTeam((t) => [...t, res.data || res]);
      toast(`Invitation envoyée à ${invite.email}`);
      setInvite({ email: "", role: "staff", name: "" });
      setInviteModal(false);
    } catch {
      toast("Erreur lors de l'invitation", "error");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paramètres</h1>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-2">
          <nav className="flex flex-col gap-1">
            {TABS.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition ${tab === id ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"}`}>
                <Icon size={16} /> {id}
              </button>
            ))}
          </nav>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64"><Spinner label="Chargement des paramètres..." /></div>
        ) : (
        <div className="space-y-6">
          {tab === "Profil" && (
            <Card>
              <CardHeader title="Profil" subtitle="Vos informations personnelles" />
              <div className="space-y-5 p-5">
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => { handleAvatar(e.target.files[0]); e.target.value = ""; }}
                />
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar name={profil.name} src={profil.avatar} className="h-16 w-16 !text-xl" />
                    {profil.avatar && (
                      <button
                        onClick={() => setProfil((p) => ({ ...p, avatar: "" }))}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white shadow hover:bg-gray-700"
                        title="Supprimer la photo"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div>
                    <Button variant="secondary" onClick={() => avatarInput.current?.click()} disabled={avatarProcessing}>
                      <Camera size={14} /> {avatarProcessing ? "Traitement…" : profil.avatar ? "Changer la photo" : "Ajouter une photo"}
                    </Button>
                    <p className="mt-1.5 text-xs text-gray-500">PNG, JPG ou WebP — max 4 Mo</p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Nom complet" value={profil.name} onChange={(e) => setProfil((p) => ({ ...p, name: e.target.value }))} />
                  <Input label="Email" type="email" value={profil.email} onChange={(e) => setProfil((p) => ({ ...p, email: e.target.value }))} />
                  <Input label="Téléphone" value={profil.phone} onChange={(e) => setProfil((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="flex justify-end"><Button onClick={saveProfil}>Enregistrer</Button></div>
              </div>
            </Card>
          )}

          {tab === "Restaurant" && (
            <Card>
              <CardHeader title="Restaurant" subtitle="Informations de l'établissement" />
              <div className="space-y-5 p-5">
                <Input label="Nom du restaurant" value={resto.name} onChange={(e) => setResto((r) => ({ ...r, name: e.target.value }))} />
                <Input label="Adresse" value={resto.address} onChange={(e) => setResto((r) => ({ ...r, address: e.target.value }))} />
                <Input label="Description" value={resto.description} onChange={(e) => setResto((r) => ({ ...r, description: e.target.value }))} />
                <div className="flex justify-end"><Button onClick={saveResto}>Enregistrer</Button></div>
              </div>
            </Card>
          )}

          {tab === "Utilisateurs" && (
            <Card>
              <CardHeader title="Utilisateurs" subtitle="Les membres de votre équipe" action={<Button onClick={() => setInviteModal(true)}>Inviter</Button>} />
              <Table headers={["Membre", "Email", "Rôle", "Statut"]}>
                {team.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <span className="font-semibold text-gray-900">{m.name}</span>
                      </div>
                    </Td>
                    <Td className="text-gray-500">{m.email}</Td>
                    <Td>
                      <Select
                        value={m.role}
                        onChange={async (e) => { 
                          try {
                            await restaurantApi.updateTeamMember(m.id, { role: e.target.value });
                            setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, role: e.target.value } : x))); 
                            toast(`Rôle de ${m.name} : ${e.target.value}`); 
                          } catch {
                            toast("Erreur de modification", "error");
                          }
                        }}
                        className="!py-1.5 !text-sm"
                      >
                        <option value="owner">Propriétaire</option>
                        <option value="manager">Gestionnaire</option>
                        <option value="cook">Cuisinier</option>
                        <option value="driver">Livreur</option>
                        <option value="staff">Staff</option>
                      </Select>
                    </Td>
                    <Td><Badge variant={m.is_active ? "success" : "warning"} dot>{m.is_active ? "Actif" : "Inactif"}</Badge></Td>
                    <Td>
                      <Button variant="danger" className="!px-3 !py-1.5 !text-xs" onClick={async () => {
                        try {
                          await restaurantApi.removeTeamMember(m.id);
                          setTeam(t => t.filter(x => x.id !== m.id));
                          toast("Membre supprimé");
                        } catch {
                          toast("Erreur de suppression", "error");
                        }
                      }}>Retirer</Button>
                    </Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}

          {tab === "Notifications" && (
            <Card>
              <CardHeader title="Notifications" subtitle="Choisissez ce que vous souhaitez recevoir" />
              <ul className="divide-y divide-gray-100">
                {[
                  { k: "order", label: "Nouvelle commande", desc: "Être alerté à chaque nouvelle commande" },
                  { k: "cancel", label: "Commande annulée", desc: "Notification quand un client annule" },
                  { k: "tickets", label: "Réponse du support", desc: "Être alerté quand l'équipe RestoHub répond à un ticket" },
                  { k: "reminder", label: "Rappel quotidien", desc: "Résumé quotidien des ventes à 22h" },
                  { k: "marketing", label: "Emails marketing", desc: "Conseils et nouveautés MenuPlus" },
                ].map((n) => (
                  <li key={n.k} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{n.label}</p>
                      <p className="text-xs text-gray-500">{n.desc}</p>
                    </div>
                    <Toggle checked={notif[n.k]} onChange={notifToggle(n.k, n.label)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {tab === "Paiements" && (
            <Card>
              <CardHeader title="Moyens de paiement" subtitle="Activez les méthodes acceptées en boutique" />
              <div className="space-y-6 p-5">
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">Mobile Money</p>
                  <div className="space-y-3">
                    {[
                      { k: "orange", label: "Orange Money" },
                      { k: "mtn", label: "MTN MoMo" },
                      { k: "wave", label: "Wave" },
                    ].map((p) => (
                      <label key={p.k} className="flex items-center gap-3 text-sm text-gray-700">
                        <input type="checkbox" checked={pay[p.k] ?? false} onChange={(e) => payToggle(p.k, p.label)(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">Carte bancaire</p>
                  <div className="grid gap-4 sm:grid-cols-3" onClick={() => toast("Configuration carte bancaire à venir", "info")}>
                    <Input label="Numéro" placeholder="4242 4242 4242 4242" readOnly />
                    <Input label="Expiration" placeholder="12/28" readOnly />
                    <Input label="CVC" placeholder="123" readOnly />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Paiement à la livraison</p>
                    <p className="text-xs text-gray-500">Le client paie en espèces à la réception</p>
                  </div>
                  <Toggle checked={pay.cod ?? true} onChange={payToggle("cod", "Paiement à la livraison")} />
                </div>
              </div>
            </Card>
          )}

          {tab === "Sécurité" && (
            <>
              <Card>
                <CardHeader title="Mot de passe" subtitle="Modifier votre mot de passe" />
                <div className="space-y-5 p-5">
                  <Input label="Mot de passe actuel" type="password" value={security.current_password} onChange={(e) => setSecurity((s) => ({ ...s, current_password: e.target.value }))} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input label="Nouveau mot de passe" type="password" value={security.password} onChange={(e) => setSecurity((s) => ({ ...s, password: e.target.value }))} />
                    <Input label="Confirmer" type="password" value={security.password_confirmation} onChange={(e) => setSecurity((s) => ({ ...s, password_confirmation: e.target.value }))} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={18} className="text-success-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Authentification à deux facteurs</p>
                        <p className="text-xs text-gray-500">
                          {twoFactor.enabled ? "Activée — un code est requis à chaque connexion" : "Sécurisez votre compte avec Google Authenticator"}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={twoFactor.enabled}
                      disabled={twoFactor.loading}
                      onChange={(v) => (v ? start2fa() : disable2fa())}
                    />
                  </div>

                  {twoFactor.pending && (
                    <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5">
                      <p className="text-sm font-semibold text-gray-900">Étape 1 — Scannez le code QR</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Ouvrez Google Authenticator (ou Authy), ajoutez un compte en scannant ce code QR.
                      </p>
                      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        {twoFactor.qrData ? (
                          <img src={twoFactor.qrData} alt="QR Code 2FA" className="h-40 w-40 rounded-lg bg-white p-2 shadow-sm" />
                        ) : (
                          <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-white shadow-sm"><Spinner label="" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500">Secret (si impossible de scanner) :</p>
                          <code className="mt-1 block break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-gray-700 shadow-sm">{twoFactor.secret}</code>
                          <p className="mt-3 text-sm font-semibold text-gray-900">Étape 2 — Confirmez le code</p>
                          <p className="text-xs text-gray-500">Saisissez le code à 6 chiffres généré par l'application.</p>
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={twoFactor.code}
                              onChange={(e) => setTwoFactor((t) => ({ ...t, code: e.target.value.replace(/\D/g, "") }))}
                              placeholder="123456"
                              maxLength={6}
                              inputMode="numeric"
                              className="w-40"
                            />
                            <Button onClick={confirm2fa} disabled={twoFactor.confirming}>
                              {twoFactor.confirming ? "Vérification…" : "Confirmer"}
                            </Button>
                            <Button variant="secondary" onClick={cancel2fa}>Annuler</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end"><Button onClick={savePassword}>Mettre à jour</Button></div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Sessions actives" subtitle="Appareils connectés à votre compte" />
                <Table headers={["Appareil", "Créée le", "Dernière activité", ""]} empty={sessions.length === 0}>
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/60">
                      <Td className="font-semibold text-gray-900">{s.device || "Session"} {s.current && <Badge variant="success">Cet appareil</Badge>}</Td>
                      <Td className="text-gray-500">{s.created_at ? new Date(s.created_at).toLocaleDateString("fr-FR") : "—"}</Td>
                      <Td className="text-gray-500">{s.current ? "Actif maintenant" : timeAgo(s.last_used_at)}</Td>
                      <Td>
                        {!s.current && (
                          <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => revokeSession(s)}>
                            Déconnecter
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </>
          )}
        </div>
        )}
      </div>

      <Modal
        open={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Inviter un utilisateur"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteModal(false)}>Annuler</Button>
            <Button onClick={sendInvite}>Envoyer l'invitation</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom" type="text" value={invite.name} onChange={(e) => setInvite((i) => ({ ...i, name: e.target.value }))} placeholder="John Doe" />
          <Input label="Email" type="email" value={invite.email} onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} placeholder="collegue@exemple.com" />
          <Select label="Rôle" value={invite.role} onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value }))}>
            <option value="manager">Gestionnaire</option>
            <option value="cook">Cuisinier</option>
            <option value="driver">Livreur</option>
            <option value="staff">Staff</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
