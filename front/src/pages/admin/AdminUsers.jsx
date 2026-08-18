import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, SearchInput, Select, Spinner, Table, Td, statusVariant, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";

const ROLE_UI = {
  super_admin: "Admin",
  owner: "Propriétaire",
  staff: "Manager",
};

export default function AdminUsers() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", password: "" });
  const [inviting, setInviting] = useState(false);
  const [toggleUser, setToggleUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .users({ per_page: 100 })
      .then((data) => {
        const list = data.data || data;
        if (!cancelled) setUsers(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setUsers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const mapUser = (u) => ({
    ...u,
    role: ROLE_UI[u.role] || u.role,
    restaurant: u.restaurant?.name || "—",
    status: u.is_active ? "Actif" : "Suspendu",
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (role === "Tous" || u.role === role) &&
      (status === "Tous" || u.status === status)
    );
  });

  const applyStatus = async (u, newActive, msg) => {
    try {
      await adminApi.updateUserStatus(u.id, newActive);
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, is_active: newActive } : x)));
      toast(msg);
    } catch {
      toast("Impossible de mettre à jour le statut", "error");
    }
  };

  const inviteAdmin = async () => {
    if (!invite.name.trim() || !invite.email.includes("@") || invite.password.length < 8) {
      toast("Nom, email valide et mot de passe (8+ caractères) requis", "error");
      return;
    }
    setInviting(true);
    try {
      const res = await adminApi.createAdminUser({
        name: invite.name.trim(),
        email: invite.email.trim(),
        password: invite.password,
      });
      setUsers((us) => [...us, { ...res, role: "Admin", restaurant: "—", status: "Actif" }]);
      toast(`${res.name} a été invité comme administrateur`);
      setInviteOpen(false);
      setInvite({ name: "", email: "", password: "" });
    } catch (e) {
      toast(e.response?.data?.message || "Impossible de créer le compte", "error");
    } finally {
      setInviting(false);
    }
  };

  const removeUser = async (u) => {
    try {
      await adminApi.deleteUser(u.id);
      setUsers((us) => us.filter((x) => x.id !== u.id));
      toast(`${u.name} a été supprimé`, "error");
    } catch {
      toast("Impossible de supprimer l'utilisateur", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Inviter un administrateur
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur…" className="flex-1" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-40">
            <option>Tous rôles</option>
            <option>Propriétaire</option>
            <option>Manager</option>
            <option>Admin</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option>Tous statuts</option>
            <option>Actif</option>
            <option>Suspendu</option>
          </Select>
        </div>
        {loading ? (
          <div className="p-6"><Spinner label="Chargement des utilisateurs…" /></div>
        ) : (
          <>
            <Table headers={["Utilisateur", "Email", "Rôle", "Restaurant", "Statut", "Actions"]} empty={filtered.length === 0}>
              {filtered.map((raw) => {
                const u = mapUser(raw);
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <span className="font-semibold text-gray-900">{u.name}</span>
                      </div>
                    </Td>
                    <Td>{u.email}</Td>
                    <Td>{u.role}</Td>
                    <Td>{u.restaurant}</Td>
                    <Td><Badge variant={statusVariant(u.status)} dot>{u.status}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {u.status === "Suspendu" ? (
                          <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => setToggleUser({ user: u, action: "reactiver" })}>Réactiver</Button>
                        ) : (
                          <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => setToggleUser({ user: u, action: "suspendre" })}>Suspendre</Button>
                        )}
                        <Button variant="danger" className="!px-3 !py-1.5 !text-xs" onClick={() => setDeleteUser(u)}>Supprimer</Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </Table>
            {filtered.length === 0 && <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun utilisateur ne correspond à vos filtres." />}
          </>
        )}
      </Card>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Inviter un administrateur"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button onClick={inviteAdmin} disabled={inviting}>{inviting ? "Création…" : "Envoyer l'invitation"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom complet" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Ex : Awa Sanogo" />
          <Input label="Email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="exemple@mail.com" />
          <Input label="Mot de passe" type="password" value={invite.password} onChange={(e) => setInvite({ ...invite, password: e.target.value })} placeholder="8 caractères minimum" />
          <p className="text-xs text-gray-500">Le compte créé aura le rôle Admin (accès à la console de la plateforme).</p>
        </div>
      </Modal>

      {/* Suspend/reactivate modal */}
      <Modal
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        title={toggleUser?.action === "suspendre" ? "Suspendre l'utilisateur" : "Réactiver l'utilisateur"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToggleUser(null)}>Annuler</Button>
            <Button
              variant={toggleUser?.action === "suspendre" ? "danger" : "success"}
              onClick={() => {
                const { user, action } = toggleUser;
                applyStatus(user, action === "reactiver", action === "suspendre" ? `${user.name} a été suspendu` : `${user.name} a été réactivé`);
                setToggleUser(null);
              }}
            >
              Confirmer
            </Button>
          </>
        }
      >
        {toggleUser && (
          <p className="text-sm text-gray-600">
            {toggleUser.action === "suspendre"
              ? `Voulez-vous suspendre le compte de ${toggleUser.user.name} ? Il perdra l'accès à la plateforme.`
              : `Voulez-vous réactiver le compte de ${toggleUser.user.name} ?`}
          </p>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Supprimer l'utilisateur"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteUser(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => { removeUser(deleteUser); setDeleteUser(null); }}>Supprimer définitivement</Button>
          </>
        }
      >
        {deleteUser && (
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer le compte de <strong>{deleteUser.name}</strong> ? Cette action est irréversible.
          </p>
        )}
      </Modal>
    </div>
  );
}