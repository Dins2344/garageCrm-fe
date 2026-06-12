import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  getUsers, createUser, updateUser, deleteUser,
} from '../services/apiServices/userService';
import { updateProfile, changePassword } from '../services/apiServices/authService';
import { getGarage, updateGarage } from '../services/apiServices/garageService';
import { useConfirm } from '../components/ConfirmModal';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import { Input, Select } from '../components/Form';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import {
  Building2, Users, UserCircle, Lock, Info, LogOut,
  Pencil, X, Plus, Save, Eye, EyeOff, Trash2,
  PauseCircle, PlayCircle, Search,
  Phone, Mail, MapPin, BadgePercent, Wrench, ShieldCheck,
  Monitor
} from 'lucide-react';

// ─── Role config ─────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner: { label: 'Owner', color: '#3b5ff8', bg: '#eff2ff' },
  admin: { label: 'Admin', color: '#7c3aed', bg: '#f5f3ff' },
  service_advisor: { label: 'Service Advisor', color: '#10b981', bg: '#f0fdf4' },
  mechanic: { label: 'Mechanic', color: '#f59e0b', bg: '#fef3c7' },
  receptionist: { label: 'Receptionist', color: '#0f766e', bg: '#f0fdfa' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children, action, id }) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-gray-900 text-[15px]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-gray-50' : ''}`}>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || { label: role, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Staff Add/Edit Modal ─────────────────────────────────────────────────────

function StaffModal({ visible, onClose, onSave, editingUser, canSetAdmin }) {
  const BLANK = { name: '', email: '', phone: '', password: '', role: 'mechanic' };
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(editingUser
        ? { name: editingUser.name, email: editingUser.email, phone: editingUser.phone, password: '', role: editingUser.role }
        : BLANK
      );
    }
  }, [visible, editingUser]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Name, email, and phone are required');
      return;
    }
    if (!editingUser && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role };
      if (!editingUser || form.password) payload.password = form.password;
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <Modal className="max-w-lg">
        <ModalHeader
          title={editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
          onClose={onClose}
        />
        <form onSubmit={handleSave}>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <FormField label="Full Name" required>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Staff member's name" required />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email" required>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" required autoCapitalize="none" />
                </FormField>
                <FormField label="Phone" required>
                  <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit phone" required />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={editingUser ? 'New Password (blank = keep)' : 'Password'} required={!editingUser}>
                  <PasswordInput
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    minLength={editingUser ? 0 : 6}
                    required={!editingUser}
                  />
                </FormField>
                <FormField label="Role" required>
                  <Select value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="mechanic">Mechanic</option>
                    <option value="service_advisor">Service Advisor</option>
                    <option value="receptionist">Receptionist</option>
                    {canSetAdmin && <option value="admin">Admin</option>}
                  </Select>
                </FormField>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Add Staff Member'}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </Modal>
    </ModalOverlay>
  );
}

// ═══════════════ MAIN SETTINGS PAGE ═══════════════

export default function Settings() {
  const { user, hasRole, logout } = useAuth();
  const { confirm, ConfirmModal } = useConfirm();
  const { withLoader } = useGlobalLoader();

  const canEditGarage = hasRole('owner', 'admin');
  const canManageStaff = hasRole('owner', 'admin');
  const canDeleteStaff = hasRole('owner');
  const canSetAdmin = hasRole('owner');

  // ── Garage state ──
  const [garage, setGarage] = useState(null);
  const [garageLoading, setGarageLoading] = useState(true);
  const [editingGarage, setEditingGarage] = useState(false);
  const [garageForm, setGarageForm] = useState({
    name: '', phone: '', email: '', gstNumber: '',
    taxRate: '18', laborRatePerHour: '500',
    street: '', city: '', state: '', pincode: '',
  });
  const [savingGarage, setSavingGarage] = useState(false);

  // ── Profile state ──
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password state ──
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  // ── Staff state ──
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffModal, setStaffModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  // ── Collapsed sections (mobile-like UX on small screens) ──
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  useEffect(() => {
    fetchGarage();
    fetchStaff();
  }, []);

  const fetchGarage = async () => {
    try {
      const { data } = await getGarage();
      setGarage(data);
      populateGarageForm(data);
    } catch { /* non-critical */ }
    finally { setGarageLoading(false); }
  };

  const populateGarageForm = (g) => {
    setGarageForm({
      name: g.name || '',
      phone: g.phone || '',
      email: g.email || '',
      gstNumber: g.gstNumber || '',
      taxRate: String(g.settings?.taxRate ?? 18),
      laborRatePerHour: String(g.settings?.laborRatePerHour ?? 500),
      street: g.address?.street || '',
      city: g.address?.city || '',
      state: g.address?.state || '',
      pincode: g.address?.pincode || '',
    });
  };

  const handleSaveGarage = async () => {
    if (!garageForm.name.trim()) { toast.error('Garage name is required'); return; }
    await withLoader(async () => {
      setSavingGarage(true);
      try {
        const { data } = await updateGarage({
          name: garageForm.name.trim(),
          phone: garageForm.phone.trim(),
          email: garageForm.email.trim(),
          gstNumber: garageForm.gstNumber.trim(),
          address: { street: garageForm.street, city: garageForm.city, state: garageForm.state, pincode: garageForm.pincode },
          settings: { taxRate: Number(garageForm.taxRate) || 18, laborRatePerHour: Number(garageForm.laborRatePerHour) || 500 },
        });
        setGarage(data);
        setEditingGarage(false);
        toast.success('Garage info updated!');
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to update garage');
      } finally { setSavingGarage(false); }
    });
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error('Name cannot be empty'); return; }
    await withLoader(async () => {
      setSavingProfile(true);
      try {
        await updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone.trim() });
        toast.success('Profile updated!');
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to update profile');
      } finally { setSavingProfile(false); }
    });
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) { toast.error('Please fill all fields'); return; }
    if (pwdForm.new.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pwdForm.new !== pwdForm.confirm) { toast.error('Passwords do not match'); return; }
    await withLoader(async () => {
      setSavingPwd(true);
      try {
        await changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.new });
        toast.success('Password changed successfully!');
        setPwdForm({ current: '', new: '', confirm: '' });
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to change password');
      } finally { setSavingPwd(false); }
    });
  };

  const fetchStaff = async () => {
    try {
      const { data } = await getUsers();
      setStaff(data);
    } catch { toast.error('Could not load staff'); }
    finally { setStaffLoading(false); }
  };

  const handleStaffSave = async (payload) => {
    await withLoader(async () => {
      if (editingUser) {
        await updateUser(editingUser._id, payload);
        toast.success('Staff member updated!');
      } else {
        await createUser(payload);
        toast.success('Staff member added!');
      }
      fetchStaff();
    });
  };

  const handleToggleActive = async (u) => {
    const action = u.isActive ? 'Deactivate' : 'Activate';
    const ok = await confirm({
      title: `${action} ${u.name}?`,
      message: u.isActive
        ? `${u.name} will no longer be able to log in.`
        : `${u.name} will regain access to the system.`,
      confirmLabel: action,
      intent: u.isActive ? 'warning' : 'default',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await updateUser(u._id, { isActive: !u.isActive });
        toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
        fetchStaff();
      } catch { toast.error('Update failed'); }
    });
  };

  const handleDeleteStaff = async (u) => {
    const ok = await confirm({
      title: `Delete ${u.name}?`,
      message: 'This will permanently remove the staff member. This cannot be undone.',
      confirmLabel: 'Delete',
      intent: 'danger',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await deleteUser(u._id);
        toast.success('Staff member deleted');
        fetchStaff();
      } catch { toast.error('Delete failed'); }
    });
  };

  // const handleLogout = async () => {
  //   const ok = await confirm({
  //     title: 'Log out of GaragePulse?',
  //     message: 'You will need to sign in again to access your account.',
  //     confirmLabel: 'Log Out',
  //     intent: 'warning',
  //   });
  //   if (ok) logout();
  // };

  const roleCfg = ROLE_CONFIG[user?.role] || { label: user?.role, color: '#6b7280', bg: '#f3f4f6' };
  const garageAddress = [garage?.address?.street, garage?.address?.city, garage?.address?.state, garage?.address?.pincode].filter(Boolean).join(', ');

  // ── Derived: filtered staff list ──
  const filteredStaff = useMemo(() => {
    let list = staff;
    if (staffRoleFilter !== 'all') {
      list = list.filter(u => u.role === staffRoleFilter);
    }
    if (staffSearch.trim()) {
      const q = staffSearch.trim().toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      );
    }
    return list;
  }, [staff, staffSearch, staffRoleFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">

      {/* ── PROFILE HERO BANNER ── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary-600 to-purple-700 p-6 overflow-hidden shadow-xl shadow-primary-500/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-extrabold text-2xl shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-white truncate">{user?.name}</h2>
            <p className="text-white/70 text-sm mt-0.5 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/25"
              >
                {roleCfg.label}
              </span>
              {garage?.name && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-primary-700 border border-primary-100">
                  <Building2 className="w-3 h-3" />
                  {garage.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── GARAGE INFORMATION ── */}
      <SectionCard
        id="garage-info"
        icon={Building2}
        title="Garage Information"
        action={canEditGarage && (
          <button
            onClick={() => {
              if (editingGarage) populateGarageForm(garage);
              setEditingGarage(e => !e);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-semibold hover:bg-primary-100 transition-colors"
          >
            {editingGarage ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
          </button>
        )}
      >
        {garageLoading ? (
          <Loader />
        ) : editingGarage ? (
          <div className="flex flex-col gap-4">
            <FormField label="Garage Name" required>
              <Input value={garageForm.name} onChange={e => setGarageForm(f => ({ ...f, name: e.target.value }))} placeholder="Your garage name" required />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Phone">
                <Input type="tel" value={garageForm.phone} onChange={e => setGarageForm(f => ({ ...f, phone: e.target.value }))} placeholder="Garage contact number" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={garageForm.email} onChange={e => setGarageForm(f => ({ ...f, email: e.target.value }))} placeholder="Garage email address" />
              </FormField>
            </div>
            <FormField label="GST Number">
              <Input value={garageForm.gstNumber} onChange={e => setGarageForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="15-digit GST number" />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Default Tax Rate (%)">
                <Input type="number" value={garageForm.taxRate} onChange={e => setGarageForm(f => ({ ...f, taxRate: e.target.value }))} placeholder="18" min="0" max="100" />
              </FormField>
              <FormField label="Labor Rate (₹/hr)">
                <Input type="number" value={garageForm.laborRatePerHour} onChange={e => setGarageForm(f => ({ ...f, laborRatePerHour: e.target.value }))} placeholder="500" min="0" />
              </FormField>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Address</p>
              <div className="flex flex-col gap-3">
                <FormField label="Street / Area">
                  <Input value={garageForm.street} onChange={e => setGarageForm(f => ({ ...f, street: e.target.value }))} placeholder="Street or area" />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="City">
                    <Input value={garageForm.city} onChange={e => setGarageForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                  </FormField>
                  <FormField label="State">
                    <Input value={garageForm.state} onChange={e => setGarageForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
                  </FormField>
                  <FormField label="Pincode">
                    <Input type="number" value={garageForm.pincode} onChange={e => setGarageForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit" />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleSaveGarage} disabled={savingGarage} icon={Save}>
                {savingGarage ? 'Saving...' : 'Save Garage Info'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <InfoRow label="Garage Name" value={garage?.name} />
            <InfoRow label="Phone" value={garage?.phone} />
            <InfoRow label="Email" value={garage?.email} />
            <InfoRow label="GST Number" value={garage?.gstNumber} />
            <InfoRow label="Default Tax Rate" value={garage?.settings?.taxRate ? `${garage.settings.taxRate}%` : '18%'} />
            <InfoRow label="Labor Rate / Hour" value={garage?.settings?.laborRatePerHour ? `₹${garage.settings.laborRatePerHour}` : '₹500'} />
            <InfoRow label="Address" value={garageAddress || null} last />
          </div>
        )}
      </SectionCard>

      {/* ── STAFF MANAGEMENT ── */}
      <SectionCard
        id="staff-management"
        icon={Users}
        title="Staff Management"
        action={canManageStaff && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => { setEditingUser(null); setStaffModal(true); }}
          >
            Add Staff
          </Button>
        )}
      >
        {staffLoading ? (
          <Loader />
        ) : (
          <div className="flex flex-col gap-3">

            {/* Search + stats bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,95,248,0.08)] transition-all"
                />
                {staffSearch && (
                  <button
                    onClick={() => setStaffSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {['all', 'mechanic', 'service_advisor', 'receptionist', 'admin', 'owner'].map(role => (
                  <button
                    key={role}
                    onClick={() => setStaffRoleFilter(role)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      staffRoleFilter === role
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {role === 'all' ? 'All' : ROLE_CONFIG[role]?.label || role}
                  </button>
                ))}
              </div>
            </div>

            {/* Count line */}
            <p className="text-xs text-gray-400 font-medium">
              {staffSearch || staffRoleFilter !== 'all'
                ? `${filteredStaff.length} of ${staff.length} staff shown`
                : `${staff.length} members · ${staff.filter(s => s.isActive).length} active`
              }
            </p>

            {/* Staff cards */}
            {filteredStaff.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">
                  {staff.length === 0 ? 'No staff members yet' : 'No staff match your search'}
                </p>
                {(staffSearch || staffRoleFilter !== 'all') && (
                  <button
                    onClick={() => { setStaffSearch(''); setStaffRoleFilter('all'); }}
                    className="mt-2 text-xs text-primary-600 hover:underline font-semibold"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredStaff.map(u => {
                const isSelf = u._id === user?._id;
                const isOwner = u.role === 'owner';
                const cfg = ROLE_CONFIG[u.role] || { label: u.role, color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <div
                    key={u._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">
                          {u.name}{isSelf ? <span className="text-primary-500 font-normal"> (You)</span> : ''}
                        </span>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: u.isActive ? '#10b981' : '#d1d5db' }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.phone}</p>
                      <div className="mt-1.5">
                        <RoleBadge role={u.role} />
                      </div>
                    </div>

                    {/* Actions */}
                    {canManageStaff && !isOwner && !isSelf && (
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <button
                          onClick={() => { setEditingUser(u); setStaffModal(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.isActive
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                          {u.isActive
                            ? <><PauseCircle className="w-3.5 h-3.5" /> Deactivate</>
                            : <><PlayCircle className="w-3.5 h-3.5" /> Activate</>
                          }
                        </button>
                        {canDeleteStaff && (
                          <button
                            onClick={() => handleDeleteStaff(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </SectionCard>

      {/* ── MY PROFILE ── */}
      <SectionCard id="my-profile" icon={UserCircle} title="Edit My Profile">
        <div className="flex flex-col gap-4">
          <FormField label="Full Name" required>
            <Input
              value={profileForm.name}
              onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email (read-only)">
              <Input type="email" value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
            </FormField>
            <FormField label="Phone">
              <Input
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile} icon={Save}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── CHANGE PASSWORD ── */}
      <SectionCard id="change-password" icon={Lock} title="Change Password">
        <div className="flex flex-col gap-4">
          <FormField label="Current Password" required>
            <PasswordInput
              value={pwdForm.current}
              onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
              placeholder="Your current password"
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="New Password" required>
              <PasswordInput
                value={pwdForm.new}
                onChange={e => setPwdForm(f => ({ ...f, new: e.target.value }))}
                placeholder="Min. 6 characters"
              />
            </FormField>
            <FormField label="Confirm New Password" required>
              <PasswordInput
                value={pwdForm.confirm}
                onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </FormField>
          </div>
          {/* Password match indicator */}
          {pwdForm.confirm && (
            <p className={`text-xs font-semibold ${pwdForm.new === pwdForm.confirm ? 'text-emerald-600' : 'text-red-500'}`}>
              {pwdForm.new === pwdForm.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleChangePassword} disabled={savingPwd} icon={Lock}>
              {savingPwd ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── APP INFO ── */}
      {/* <SectionCard id="app-info" icon={Info} title="App Info">
        <InfoRow label="Application" value="GaragePulse" />
        <InfoRow label="Version" value="1.0.0 (Web)" />
        <InfoRow label="Platform" value="Web Browser" />
        <InfoRow label="Role" value={roleCfg.label} last />
      </SectionCard> */}

      {/* ── LOGOUT BUTTON ──
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 font-bold text-sm border border-red-100 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button> */}

      {/* Modals */}
      <StaffModal
        visible={staffModal}
        onClose={() => setStaffModal(false)}
        onSave={handleStaffSave}
        editingUser={editingUser}
        canSetAdmin={canSetAdmin}
      />
      <ConfirmModal />
    </div>
  );
}
