import { useState, useEffect, useMemo, type ReactNode, type ComponentType, type FormEvent, type InputHTMLAttributes } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';
import toast from 'react-hot-toast';
import {
  getUsers, createUser, updateUser, deleteUser,
} from '../services/apiServices/userService';
import { updateProfile, changePassword } from '../services/apiServices/authService';
import { getGarage, updateGarage, getBranchStaff } from '../services/apiServices/garageService';
import { useConfirm } from '../components/ConfirmModal';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import { Input, Select } from '../components/Form';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { useCountries } from '../hooks/useCountries';
import { DEFAULT_LOCALE, timezoneChoicesFor } from '../utils/locale';
import {
  Building2, Users, UserCircle, Lock,
  Pencil, X, Plus, Save, Eye, EyeOff, Trash2,
  PauseCircle, PlayCircle, Search, GitBranch, CheckCircle2,
} from 'lucide-react';
import type { User, Garage, Role } from '../types/models';

// ─── Role config ─────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; classes: string }> = {
  owner: { label: 'Owner', classes: 'bg-primary-50 text-primary-500' },
  admin: { label: 'Admin', classes: 'bg-purple-50 text-purple-600' },
  service_advisor: { label: 'Service Advisor', classes: 'bg-success-light text-success' },
  mechanic: { label: 'Mechanic', classes: 'bg-warning-light text-warning' },
  receptionist: { label: 'Receptionist', classes: 'bg-teal-50 text-teal-600' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  id?: string;
}

function SectionCard({ icon: Icon, title, children, action, id }: SectionCardProps) {
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

function InfoRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-gray-50' : ''}`}>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, ...props }: InputHTMLAttributes<HTMLInputElement>) {
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

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || { label: role, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Staff Add/Edit Modal ─────────────────────────────────────────────────────

interface StaffForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

interface StaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: Partial<User> & { password?: string }) => Promise<void>;
  editingUser: User | null;
  canSetAdmin: boolean;
}

function StaffModal({ visible, onClose, onSave, editingUser, canSetAdmin }: StaffModalProps) {
  // The phone placeholder has to follow the garage's country — a UK garage
  // adding staff was being shown an Indian 10-digit example.
  const { locale } = useGarage();
  const BLANK: StaffForm = { name: '', email: '', phone: '', password: '', role: 'mechanic' };
  const [form, setForm] = useState<StaffForm>(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(editingUser
        ? { name: editingUser.name, email: editingUser.email, phone: editingUser.phone, password: '', role: editingUser.role }
        : BLANK
      );
    }
  }, [visible, editingUser]);

  const set = <K extends keyof StaffForm>(key: K, val: StaffForm[K]) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e: FormEvent) => {
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
      const payload: Partial<User> & { password?: string } = { name: form.name, email: form.email, phone: form.phone, role: form.role };
      if (!editingUser || form.password) payload.password = form.password;
      await onSave(payload);
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to save staff member');
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
                  <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={locale.phoneExample} required />
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
                  <Select value={form.role} onChange={e => set('role', e.target.value as Role)}>
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

// ─── Delete Branch Modal ──────────────────────────────────────────────────────

interface DeleteBranchModalProps {
  branch: Garage | null;
  otherBranches: Garage[];
  onClose: () => void;
  onConfirm: (payload?: { staffAction?: 'delete' | 'reassign'; reassignToGarageId?: string }) => Promise<void>;
}

function DeleteBranchModal({ branch, otherBranches, onClose, onConfirm }: DeleteBranchModalProps) {
  const [checking, setChecking] = useState(true);
  const [staff, setStaff] = useState<User[]>([]);
  const [staffChoice, setStaffChoice] = useState<'delete' | 'reassign'>('reassign');
  const [reassignTarget, setReassignTarget] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!branch) return;
    setChecking(true);
    setStaff([]);
    setStaffChoice('reassign');
    setReassignTarget(otherBranches[0]?._id || '');
    getBranchStaff(branch._id)
      .then(res => setStaff(res.data))
      .catch(() => setStaff([]))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);

  if (!branch) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      if (staff.length === 0) {
        await onConfirm();
      } else if (staffChoice === 'delete') {
        await onConfirm({ staffAction: 'delete' });
      } else {
        if (!reassignTarget) { toast.error('Please choose a branch to reassign staff to'); setDeleting(false); return; }
        await onConfirm({ staffAction: 'reassign', reassignToGarageId: reassignTarget });
      }
      onClose();
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to delete branch');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <Modal className="max-w-lg">
        <ModalHeader title={`Delete "${branch.name}"?`} onClose={onClose} />
        <ModalBody>
          {checking ? (
            <div className="flex justify-center py-6"><Loader /></div>
          ) : staff.length === 0 ? (
            <p className="text-sm text-gray-600 leading-relaxed">
              This will permanently delete this branch and all of its customers, vehicles, job cards,
              invoices, inventory, and reminders. This cannot be undone.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                This branch has <strong>{staff.length}</strong> staff member{staff.length > 1 ? 's' : ''} assigned
                ({staff.map(s => s.name).join(', ')}). What should happen to them?
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={staffChoice === 'reassign'}
                    onChange={() => setStaffChoice('reassign')}
                  />
                  <span className="text-sm font-semibold text-gray-800">Reassign them to another branch</span>
                </label>
                {staffChoice === 'reassign' && (
                  <div className="pl-8">
                    <Select value={reassignTarget} onChange={e => setReassignTarget(e.target.value)}>
                      {otherBranches.map(g => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </Select>
                  </div>
                )}
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={staffChoice === 'delete'}
                    onChange={() => setStaffChoice('delete')}
                  />
                  <span className="text-sm font-semibold text-gray-800">Delete their accounts too</span>
                </label>
              </div>
              <p className="text-xs text-gray-400">
                The branch itself and all of its customers, vehicles, job cards, invoices, inventory,
                and reminders will be permanently deleted either way.
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end gap-3 w-full">
            <Button variant="ghost" onClick={onClose} disabled={deleting}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={checking || deleting}
              icon={Trash2}
            >
              {deleting ? 'Deleting...' : 'Delete Branch'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </ModalOverlay>
  );
}

interface GarageForm {
  name: string;
  phone: string;
  email: string;
  gstNumber: string;
  taxRate: string;
  laborRatePerHour: string;
  country: string;
  timezone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

// ═══════════════ MAIN SETTINGS PAGE ═══════════════

export default function Settings() {
  const { user, hasRole } = useAuth();
  const { confirm, ConfirmModal } = useConfirm();
  const { withLoader } = useGlobalLoader();
  const { garages, activeGarageId, switchGarage, removeBranch, refreshGarage } = useGarage();
  const { countries } = useCountries();

  const isOwner = hasRole('owner');
  const [deleteBranchTarget, setDeleteBranchTarget] = useState<Garage | null>(null);

  const handleDeleteBranch = async (payload?: { staffAction?: 'delete' | 'reassign'; reassignToGarageId?: string }) => {
    if (!deleteBranchTarget) return;
    await withLoader(async () => {
      await removeBranch(deleteBranchTarget._id, payload);
      toast.success(`Branch "${deleteBranchTarget.name}" deleted`);
    });
  };

  const canEditGarage = hasRole('owner', 'admin');
  const canManageStaff = hasRole('owner', 'admin');
  const canDeleteStaff = hasRole('owner');
  const canSetAdmin = hasRole('owner');

  // ── Garage state ──
  const [garage, setGarage] = useState<Garage | null>(null);
  const [garageLoading, setGarageLoading] = useState(true);
  const [editingGarage, setEditingGarage] = useState(false);
  const [garageForm, setGarageForm] = useState<GarageForm>({
    name: '', phone: '', email: '', gstNumber: '',
    taxRate: '18', laborRatePerHour: '500',
    country: DEFAULT_LOCALE.country, timezone: '',
    street: '', city: '', state: '', pincode: '',
  });
  const [savingGarage, setSavingGarage] = useState(false);

  // Labels follow the country being EDITED, not the saved one, so switching
  // the picker to United Kingdom relabels "GSTIN" to "VAT No." immediately —
  // the owner sees what they're choosing before they commit to it.
  const selectedCountry = countries.find(c => c.code === garageForm.country);
  const timezoneOptions = timezoneChoicesFor(garageForm.country);
  const needsTimezone = (selectedCountry?.requiresTimezoneChoice ?? false) && timezoneOptions.length > 0;
  // Falls back to the saved locale, then India, so nothing renders blank while
  // the country list is still loading.
  const labels = {
    tax: selectedCountry?.taxLabel ?? garage?.locale?.taxLabel ?? DEFAULT_LOCALE.taxLabel,
    taxId: selectedCountry?.taxIdLabel ?? garage?.locale?.taxIdLabel ?? DEFAULT_LOCALE.taxIdLabel,
    postal: selectedCountry?.postalLabel ?? garage?.locale?.postalLabel ?? DEFAULT_LOCALE.postalLabel,
    postalInputMode: selectedCountry?.postalInputMode ?? garage?.locale?.postalInputMode ?? DEFAULT_LOCALE.postalInputMode,
    currency: selectedCountry?.currency ?? garage?.locale?.currency ?? DEFAULT_LOCALE.currency,
    phoneExample: selectedCountry?.phoneExample ?? garage?.locale?.phoneExample ?? DEFAULT_LOCALE.phoneExample,
  };

  // ── Profile state ──
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password state ──
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  // ── Staff state ──
  const [staff, setStaff] = useState<User[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffModal, setStaffModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

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

  const populateGarageForm = (g: Garage) => {
    setGarageForm({
      name: g.name || '',
      phone: g.phone || '',
      email: g.email || '',
      gstNumber: g.gstNumber || '',
      taxRate: String(g.settings?.taxRate ?? 18),
      laborRatePerHour: String(g.settings?.laborRatePerHour ?? 500),
      // Garages created before country support have no `country` key at all;
      // the server resolves them to India, so the form must show the same.
      country: g.country || g.locale?.country || DEFAULT_LOCALE.country,
      timezone: g.settings?.timezone || '',
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
          country: garageForm.country,
          address: { street: garageForm.street, city: garageForm.city, state: garageForm.state, pincode: garageForm.pincode },
          // Send only the settings this form actually edits. The API merges
          // partial `settings` (dotted-path $set), so omitted keys — currency,
          // serviceReminderDays — are preserved rather than wiped. Previously
          // this resent every key, which hardcoded `currency: 'INR'` and
          // overwrote it on every save.
          settings: {
            taxRate: Number(garageForm.taxRate) || 0,
            laborRatePerHour: Number(garageForm.laborRatePerHour) || 0,
            // '' clears the override so the country table applies. Only
            // multi-zone countries ever set it.
            timezone: needsTimezone ? garageForm.timezone : '',
          },
        });
        setGarage(data);
        setEditingGarage(false);
        // The whole app formats money and dates from context locale, so a
        // country change has to propagate beyond this page.
        await refreshGarage().catch(() => {});
        toast.success('Garage info updated!');
      } catch (e) {
        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to update garage');
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
        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to update profile');
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
        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to change password');
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

  const handleStaffSave = async (payload: Partial<User> & { password?: string }) => {
    await withLoader(async () => {
      if (editingUser) {
        await updateUser(editingUser._id, payload);
        toast.success('Staff member updated!');
      } else {
        await createUser(payload as Partial<User> & { password: string });
        toast.success('Staff member added!');
      }
      fetchStaff();
    });
  };

  const handleToggleActive = async (u: User) => {
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

  const handleDeleteStaff = async (u: User) => {
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

  const roleCfg = ROLE_CONFIG[user?.role || ''] || { label: user?.role, classes: 'bg-gray-100 text-gray-600' };
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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">

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
              if (editingGarage && garage) populateGarageForm(garage);
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
                <Input type="tel" value={garageForm.phone} onChange={e => setGarageForm(f => ({ ...f, phone: e.target.value }))} placeholder={labels.phoneExample} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={garageForm.email} onChange={e => setGarageForm(f => ({ ...f, email: e.target.value }))} placeholder="Garage email address" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Country">
                <Select
                  value={garageForm.country}
                  // Clear any zone chosen for the previous country — a US zone
                  // on a garage that just moved to Australia is worse than none.
                  onChange={e => setGarageForm(f => ({ ...f, country: e.target.value, timezone: '' }))}
                >
                  {countries.length === 0 ? (
                    <option value={garageForm.country}>{garage?.locale?.country ?? DEFAULT_LOCALE.country}</option>
                  ) : (
                    countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)
                  )}
                </Select>
              </FormField>
              {needsTimezone ? (
                <FormField label="Timezone">
                  <Select value={garageForm.timezone} onChange={e => setGarageForm(f => ({ ...f, timezone: e.target.value }))}>
                    <option value="">Select a timezone</option>
                    {timezoneOptions.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </Select>
                </FormField>
              ) : (
                <FormField label="Currency">
                  {/* Derived from the country, not editable here — an override
                      exists on the API for the rare garage that needs one. */}
                  <Input value={labels.currency} disabled readOnly />
                </FormField>
              )}
            </div>

            <FormField label={`${labels.taxId} (optional)`}>
              <Input value={garageForm.gstNumber} onChange={e => setGarageForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder={`Your ${labels.taxId}`} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={`Default ${labels.tax} Rate (%)`}>
                <Input type="number" value={garageForm.taxRate} onChange={e => setGarageForm(f => ({ ...f, taxRate: e.target.value }))} placeholder="0" min="0" max="100" />
              </FormField>
              <FormField label={`Labor Rate (${labels.currency}/hr)`}>
                <Input type="number" value={garageForm.laborRatePerHour} onChange={e => setGarageForm(f => ({ ...f, laborRatePerHour: e.target.value }))} placeholder="0" min="0" />
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
                  <FormField label={labels.postal}>
                    {/* Never type="number": it makes alphanumeric postcodes
                        (UK "SW1A 1AA", Canadian "K1A 0B1") impossible to type,
                        and even for India it accepts 'e'/'+'/'-' and renders
                        spinners. inputMode still gives phones a numeric keypad
                        where the country's codes are digits-only. */}
                    <Input
                      type="text"
                      inputMode={labels.postalInputMode}
                      value={garageForm.pincode}
                      onChange={e => setGarageForm(f => ({ ...f, pincode: e.target.value }))}
                      placeholder={labels.postal}
                    />
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
            <InfoRow label="Country" value={selectedCountry?.name ?? garage?.locale?.country} />
            <InfoRow label={labels.taxId} value={garage?.gstNumber} />
            <InfoRow label={`Default ${labels.tax} Rate`} value={`${garage?.settings?.taxRate ?? 0}%`} />
            <InfoRow
              label="Labor Rate / Hour"
              value={`${labels.currency} ${garage?.settings?.laborRatePerHour ?? 0}`}
            />
            <InfoRow label="Address" value={garageAddress || null} last />
          </div>
        )}
      </SectionCard>

      {/* ── MY BRANCHES (owners only) ── */}
      {isOwner && (
        <SectionCard id="my-branches" icon={GitBranch} title="My Branches">
          <div className="flex flex-col gap-2">
            {garages.map(g => {
              const isActive = g._id === activeGarageId;
              return (
                <div
                  key={g._id}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                    isActive ? 'border-primary-200 bg-primary-50/60' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => switchGarage(g._id)}
                    disabled={isActive}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-default"
                  >
                    {isActive ? (
                      <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>{g.name}</p>
                      {isActive && <p className="text-xs text-primary-500 font-semibold">Active branch</p>}
                    </div>
                  </button>
                  {garages.length > 1 && (
                    <button
                      onClick={() => setDeleteBranchTarget(g)}
                      className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
            {garages.length <= 1 && (
              <p className="text-xs text-gray-400 mt-1">
                You need at least one branch — add another branch (from the sidebar) before you can delete this one.
              </p>
            )}
          </div>
        </SectionCard>
      )}

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
                const cfg = ROLE_CONFIG[u.role] || { label: u.role, classes: 'bg-gray-100 text-gray-600' };
                return (
                  <div
                    key={u._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${cfg.classes}`}
                    >
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">
                          {u.name}{isSelf ? <span className="text-primary-500 font-normal"> (You)</span> : ''}
                        </span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${u.isActive ? 'bg-success' : 'bg-gray-300'}`} />
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

      {/* Modals */}
      <StaffModal
        visible={staffModal}
        onClose={() => setStaffModal(false)}
        onSave={handleStaffSave}
        editingUser={editingUser}
        canSetAdmin={canSetAdmin}
      />
      <DeleteBranchModal
        branch={deleteBranchTarget}
        otherBranches={garages.filter(g => g._id !== deleteBranchTarget?._id)}
        onClose={() => setDeleteBranchTarget(null)}
        onConfirm={handleDeleteBranch}
      />
      <ConfirmModal />
    </div>
  );
}
