import { useState, useEffect, useMemo, type ComponentType } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  staffSchema, profileSchema, changePasswordSchema, garageSettingsSchema,
  type StaffFormValues, type ProfileFormValues, type ChangePasswordFormValues,
  type GarageSettingsFormValues, type GarageSettingsFormOutput,
} from '../utils/validation';
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
import { Input, Select, FormField } from '../components/Form';
import { Card } from '../components/Card';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import VerifyCodeModal from '../components/VerifyCodeModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { useCountries } from '../hooks/useCountries';
import { DEFAULT_LOCALE, timezoneChoicesFor } from '../utils/locale';
import {
  Building2, Users, UserCircle, Lock,
  Pencil, X, Plus, Save, Trash2, Check,
  PauseCircle, PlayCircle, Search, GitBranch, CheckCircle2, ShieldCheck, Mail, Phone, CreditCard,
} from 'lucide-react';
import type { User, Garage, Role, ResolvedLocale, VerificationChannel } from '../types/models';

// ─── Role config ─────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; classes: string }> = {
  owner: { label: 'Owner', classes: 'bg-primary-50 text-primary-500' },
  admin: { label: 'Admin', classes: 'bg-purple-50 text-purple-600' },
  service_advisor: { label: 'Service Advisor', classes: 'bg-success-light text-success' },
  mechanic: { label: 'Mechanic', classes: 'bg-warning-light text-warning' },
  receptionist: { label: 'Receptionist', classes: 'bg-teal-50 text-teal-600' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-gray-50' : ''}`}>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

/**
 * One line of the Verification card: the address, its state, and the action.
 * Rendered for owners only — verification exists to gate subscription
 * upgrades, which only owners make.
 */
function VerificationRow({ icon: Icon, label, value, verifiedAt, onVerify, last }: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  verifiedAt?: string | null;
  onVerify: () => void;
  last?: boolean;
}) {
  const verified = !!verifiedAt;
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${!last ? 'border-b border-gray-50' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-bone-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge intent={verified ? 'approved' : 'estimation_sent'}>{verified ? 'Verified' : 'Not verified'}</Badge>
        {!verified && (
          <Button size="sm" variant="secondary" onClick={onVerify} aria-label={`Verify ${label.toLowerCase()}`}>
            Verify
          </Button>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || { label: role, classes: 'bg-bone-200 text-gray-600' };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Staff Add/Edit Modal ─────────────────────────────────────────────────────

interface StaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: Partial<User> & { password?: string }) => Promise<void>;
  editingUser: User | null;
  canSetAdmin: boolean;
}

const BLANK_STAFF_FORM: StaffFormValues = { name: '', email: '', phone: '', password: '', role: 'mechanic' };

function StaffModal({ visible, onClose, onSave, editingUser, canSetAdmin }: StaffModalProps) {
  // The phone placeholder has to follow the garage's country — a UK garage
  // adding staff was being shown an Indian 10-digit example.
  const { locale } = useGarage();

  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: BLANK_STAFF_FORM,
  });

  useEffect(() => {
    if (visible) {
      reset(editingUser
        ? { name: editingUser.name, email: editingUser.email, phone: editingUser.phone, password: '', role: editingUser.role }
        : BLANK_STAFF_FORM
      );
    }
  }, [visible, editingUser, reset]);

  const onValid = async (values: StaffFormValues) => {
    // `staffSchema` allows a blank password so the *edit* form can leave it
    // unchanged. Creating a staff member is the one case where it is required,
    // and that depends on a prop the schema cannot see — so it is checked here
    // and reported on the field, not through a toast.
    if (!editingUser && !values.password) {
      setError('password', { message: 'Password must be at least 6 characters' });
      return;
    }
    try {
      const payload: Partial<User> & { password?: string } = {
        name: values.name, email: values.email, phone: values.phone, role: values.role as Role,
      };
      if (!editingUser || values.password) payload.password = values.password;
      await onSave(payload);
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to save staff member');
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
        <form onSubmit={handleSubmit(onValid)} noValidate>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <FormField label="Full Name" required error={errors.name?.message}>
                <Input {...register('name')} placeholder="Staff member's name" error={!!errors.name} aria-invalid={!!errors.name} />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email" required error={errors.email?.message}>
                  <Input type="email" {...register('email')} placeholder="email@example.com" autoCapitalize="none" error={!!errors.email} aria-invalid={!!errors.email} />
                </FormField>
                <FormField label="Phone" required error={errors.phone?.message}>
                  <Input type="tel" {...register('phone')} placeholder={locale.phoneExample} error={!!errors.phone} aria-invalid={!!errors.phone} />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label={editingUser ? 'New Password (blank = keep)' : 'Password'}
                  required={!editingUser}
                  error={errors.password?.message}
                >
                  <PasswordInput
                    {...register('password')}
                    placeholder="Min. 6 characters"
                    error={!!errors.password}
                    aria-invalid={!!errors.password}
                  />
                </FormField>
                <FormField label="Role" required error={errors.role?.message}>
                  <Select {...register('role')} error={!!errors.role}>
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
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Add Staff Member'}
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
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-bone-200 cursor-pointer hover:bg-bone-100">
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
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-bone-200 cursor-pointer hover:bg-bone-100">
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

/**
 * Shape follows `garageSettingsSchema` — nested `settings` and `address`, the
 * same as the API payload — rather than the flat object this form used to
 * hold. One shape from input to request means no hand-written mapping step in
 * between for a field to go missing from.
 */
const BLANK_GARAGE_FORM: GarageSettingsFormValues = {
  name: '', phone: '', email: '', gstNumber: '',
  country: DEFAULT_LOCALE.country,
  settings: { taxRate: '18', laborRatePerHour: '500', timezone: '' },
  address: { street: '', city: '', state: '', pincode: '' },
};

// ═══════════════ MAIN SETTINGS PAGE ═══════════════

export default function Settings() {
  const { user, hasRole, refreshUser, logout } = useAuth();
  const { confirm, ConfirmModal } = useConfirm();
  const [verifying, setVerifying] = useState<VerificationChannel | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
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
  /**
   * The postal-code and tax-id rules follow the country **being edited**, not
   * the saved one — otherwise switching to the UK still validates the postcode
   * against India's digits-only rule and `SW1A 1AA` is unenterable.
   *
   * That looks circular — the resolver needs the locale, the locale needs the
   * form's country, the form does not exist yet — but it is not: the resolver
   * is handed the values it is validating, and the country is one of them. So
   * the locale is derived from the payload rather than from render state, with
   * no ref and no second source of truth.
   */
  const localeForCountry = (code: string): ResolvedLocale => {
    const c = countries.find(x => x.code === code);
    return c
      ? {
        ...DEFAULT_LOCALE,
        country: c.code, currency: c.currency,
        taxLabel: c.taxLabel, taxIdLabel: c.taxIdLabel,
        postalLabel: c.postalLabel, postalInputMode: c.postalInputMode,
        phoneExample: c.phoneExample,
      }
      : DEFAULT_LOCALE;
  };

  const {
    register: registerGarage,
    handleSubmit: handleGarageSubmit,
    reset: resetGarageForm,
    watch: watchGarage,
    setValue: setGarageValue,
    formState: { errors: garageErrors, isSubmitting: savingGarage },
  } = useForm<GarageSettingsFormValues, unknown, GarageSettingsFormOutput>({
    // `useForm` re-reads its props every render, so this closure always sees
    // the latest `countries`.
    resolver: (values, ctx, opts) => {
      const code = String((values as { country?: unknown }).country ?? DEFAULT_LOCALE.country);
      return zodResolver(garageSettingsSchema(localeForCountry(code)))(values, ctx, opts);
    },
    defaultValues: BLANK_GARAGE_FORM,
  });

  // Labels follow the country being EDITED, not the saved one, so switching
  // the picker to United Kingdom relabels "GSTIN" to "VAT No." immediately —
  // the owner sees what they're choosing before they commit to it.
  const watchedCountry = watchGarage('country');
  const selectedCountry = countries.find(c => c.code === watchedCountry);
  const timezoneOptions = timezoneChoicesFor(watchedCountry);
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

  // ── Profile form ──
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  // ── Password form ──
  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwdForm,
    watch: watchPwd,
    formState: { errors: pwdErrors, isSubmitting: savingPwd },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const watchedNewPassword = watchPwd('newPassword');
  const watchedConfirm = watchPwd('confirmPassword');

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
    resetGarageForm({
      name: g.name || '',
      phone: g.phone || '',
      email: g.email || '',
      gstNumber: g.gstNumber || '',
      // Garages created before country support have no `country` key at all;
      // the server resolves them to India, so the form must show the same.
      country: g.country || g.locale?.country || DEFAULT_LOCALE.country,
      settings: {
        taxRate: String(g.settings?.taxRate ?? 18),
        laborRatePerHour: String(g.settings?.laborRatePerHour ?? 500),
        timezone: g.settings?.timezone || '',
      },
      address: {
        street: g.address?.street || '',
        city: g.address?.city || '',
        state: g.address?.state || '',
        pincode: g.address?.pincode || '',
      },
    });
  };

  const handleSaveGarage = async (values: GarageSettingsFormOutput) => {
    await withLoader(async () => {
      try {
        const { data } = await updateGarage({
          name: values.name,
          phone: values.phone,
          email: values.email || '',
          gstNumber: values.gstNumber || '',
          country: values.country,
          address: {
            street: values.address.street || '',
            city: values.address.city || '',
            state: values.address.state || '',
            pincode: values.address.pincode || '',
          },
          // Send only the settings this form actually edits. The API merges
          // partial `settings` (dotted-path $set), so omitted keys — currency,
          // serviceReminderDays — are preserved rather than wiped. Previously
          // this resent every key, which hardcoded `currency: 'INR'` and
          // overwrote it on every save.
          settings: {
            taxRate: values.settings.taxRate,
            laborRatePerHour: values.settings.laborRatePerHour,
            // '' clears the override so the country table applies. Only
            // multi-zone countries ever set it.
            timezone: needsTimezone ? (values.settings.timezone || '') : '',
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
      }
    });
  };

  const handleSaveProfile = async (values: ProfileFormValues) => {
    await withLoader(async () => {
      try {
        await updateProfile({ name: values.name, phone: values.phone });
        // A changed phone number loses its verified mark server-side; pick that up.
        await refreshUser();
        toast.success('Profile updated!');
      } catch (e) {
        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to update profile');
      }
    });
  };

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    await withLoader(async () => {
      try {
        await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
        toast.success('Password changed successfully!');
        resetPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (e) {
        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to change password');
      }
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

  const roleCfg = ROLE_CONFIG[user?.role || ''] || { label: user?.role, classes: 'bg-bone-200 text-gray-600' };
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

      {/* ── PROFILE HERO BANNER ──
          An ink band, matching the sidebar and the auth panel. Was a violet
          gradient with two blurred colour blobs; the system has two grounds and
          no gradients, and the blobs were decoration standing in for depth. */}
      <div className="on-ink relative overflow-hidden bg-ink-900 p-6">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 border border-white/25 bg-white/10 flex items-center justify-center text-white font-extrabold text-2xl shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight text-white truncate">{user?.name}</h2>
            <p className="text-white/60 text-sm mt-0.5 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-white/10 text-white border border-white/20">
                {roleCfg.label}
              </span>
              {garage?.name && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-accent-500 text-ink-900 border border-accent-500">
                  <Building2 className="w-3 h-3" />
                  {garage.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── GARAGE INFORMATION ── */}
      <Card
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
          <form className="flex flex-col gap-4" onSubmit={handleGarageSubmit(handleSaveGarage)} noValidate>
            <FormField label="Garage Name" required error={garageErrors.name?.message}>
              <Input {...registerGarage('name')} placeholder="Your garage name" error={!!garageErrors.name} aria-invalid={!!garageErrors.name} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Phone" required error={garageErrors.phone?.message}>
                <Input type="tel" {...registerGarage('phone')} placeholder={labels.phoneExample} error={!!garageErrors.phone} aria-invalid={!!garageErrors.phone} />
              </FormField>
              <FormField label="Email" error={garageErrors.email?.message}>
                <Input type="email" {...registerGarage('email')} placeholder="Garage email address" error={!!garageErrors.email} aria-invalid={!!garageErrors.email} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Country" error={garageErrors.country?.message}>
                <Select
                  {...registerGarage('country', {
                    // Clear any zone chosen for the previous country — a US zone
                    // on a garage that just moved to Australia is worse than none.
                    onChange: () => setGarageValue('settings.timezone', ''),
                  })}
                  error={!!garageErrors.country}
                >
                  {countries.length === 0 ? (
                    <option value={watchedCountry}>{garage?.locale?.country ?? DEFAULT_LOCALE.country}</option>
                  ) : (
                    countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)
                  )}
                </Select>
              </FormField>
              {needsTimezone ? (
                <FormField label="Timezone">
                  <Select {...registerGarage('settings.timezone')}>
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

            <FormField label={`${labels.taxId} (optional)`} error={garageErrors.gstNumber?.message}>
              <Input {...registerGarage('gstNumber')} placeholder={`Your ${labels.taxId}`} error={!!garageErrors.gstNumber} aria-invalid={!!garageErrors.gstNumber} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={`Default ${labels.tax} Rate (%)`} error={garageErrors.settings?.taxRate?.message}>
                <Input type="number" {...registerGarage('settings.taxRate')} placeholder="0" min="0" max="100" error={!!garageErrors.settings?.taxRate} aria-invalid={!!garageErrors.settings?.taxRate} />
              </FormField>
              <FormField label={`Labor Rate (${labels.currency}/hr)`} error={garageErrors.settings?.laborRatePerHour?.message}>
                <Input type="number" {...registerGarage('settings.laborRatePerHour')} placeholder="0" min="0" error={!!garageErrors.settings?.laborRatePerHour} aria-invalid={!!garageErrors.settings?.laborRatePerHour} />
              </FormField>
            </div>

            <div className="pt-2 border-t border-bone-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Address</p>
              <div className="flex flex-col gap-3">
                <FormField label="Street / Area" error={garageErrors.address?.street?.message}>
                  <Input {...registerGarage('address.street')} placeholder="Street or area" error={!!garageErrors.address?.street} />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="City" error={garageErrors.address?.city?.message}>
                    <Input {...registerGarage('address.city')} placeholder="City" error={!!garageErrors.address?.city} />
                  </FormField>
                  <FormField label="State" error={garageErrors.address?.state?.message}>
                    <Input {...registerGarage('address.state')} placeholder="State" error={!!garageErrors.address?.state} />
                  </FormField>
                  <FormField label={labels.postal} error={garageErrors.address?.pincode?.message}>
                    {/* Never type="number": it makes alphanumeric postcodes
                        (UK "SW1A 1AA", Canadian "K1A 0B1") impossible to type,
                        and even for India it accepts 'e'/'+'/'-' and renders
                        spinners. inputMode still gives phones a numeric keypad
                        where the country's codes are digits-only. */}
                    <Input
                      type="text"
                      inputMode={labels.postalInputMode}
                      {...registerGarage('address.pincode')}
                      placeholder={labels.postal}
                      error={!!garageErrors.address?.pincode}
                      aria-invalid={!!garageErrors.address?.pincode}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={savingGarage} icon={Save}>
                {savingGarage ? 'Saving...' : 'Save Garage Info'}
              </Button>
            </div>
          </form>
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
      </Card>

      {/* ── MY BRANCHES (owners only) ── */}
      {isOwner && (
        <Card id="my-branches" icon={GitBranch} title="My Branches">
          <div className="flex flex-col gap-2">
            {garages.map(g => {
              const isActive = g._id === activeGarageId;
              return (
                <div
                  key={g._id}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                    isActive ? 'border-primary-200 bg-primary-50/60' : 'border-bone-200 hover:bg-bone-100'
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
                      <div className="w-5 h-5 rounded-full border-2 border-bone-400 shrink-0" />
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
        </Card>
      )}

      {/* ── STAFF MANAGEMENT ── */}
      <Card
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
                  className="w-full pl-9 pr-8 py-2 text-sm bg-bone-100 border border-bone-200 rounded-xl outline-none focus:border-primary-400 focus:bg-bone-50 focus:shadow-[0_0_0_3px_rgba(59,95,248,0.08)] transition-all"
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
                        : 'bg-bone-200 text-gray-500 hover:bg-gray-200'
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
                const cfg = ROLE_CONFIG[u.role] || { label: u.role, classes: 'bg-bone-200 text-gray-600' };
                return (
                  <div
                    key={u._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-bone-200 bg-bone-100/50 hover:bg-bone-50 hover:shadow-sm transition-all duration-200"
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
      </Card>

      {/* ── MY PROFILE ── */}
      <Card id="my-profile" icon={UserCircle} title="Edit My Profile">
        <form className="flex flex-col gap-4" onSubmit={handleProfileSubmit(handleSaveProfile)} noValidate>
          <FormField label="Full Name" required error={profileErrors.name?.message}>
            <Input
              {...registerProfile('name')}
              placeholder="Your name"
              error={!!profileErrors.name}
              aria-invalid={!!profileErrors.name}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email (read-only)">
              <Input type="email" value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
            </FormField>
            <FormField label="Phone" required error={profileErrors.phone?.message}>
              <Input
                type="tel"
                {...registerProfile('phone')}
                placeholder="Phone number"
                error={!!profileErrors.phone}
                aria-invalid={!!profileErrors.phone}
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={savingProfile} icon={Save}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── VERIFICATION (owners) ── */}
      {isOwner && (
        <Card id="verification" icon={ShieldCheck} title="Verification">
          <p className="text-sm text-gray-500 mb-2">
            A verified email and phone number will be required to upgrade your subscription.
          </p>
          <VerificationRow
            icon={Mail}
            label="Email"
            value={user?.email || ''}
            verifiedAt={user?.emailVerifiedAt}
            onVerify={() => setVerifying('email')}
          />
          <VerificationRow
            icon={Phone}
            label="Phone"
            value={user?.phone || ''}
            verifiedAt={user?.phoneVerifiedAt}
            onVerify={() => setVerifying('phone')}
            last
          />
        </Card>
      )}

      {/* ── PLAN (owners) ── */}
      {isOwner && (
        <Card
          id="plan"
          icon={CreditCard}
          title="Plan"
          action={<Button variant="secondary" size="sm" to="/pricing">View plans</Button>}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Free plan</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Paid plans will be enabled soon. Compare what Plus and Pro will include.
              </p>
            </div>
            <Badge intent="approved">Current</Badge>
          </div>
        </Card>
      )}

      {/* ── CHANGE PASSWORD ── */}
      <Card id="change-password" icon={Lock} title="Change Password">
        <form className="flex flex-col gap-4" onSubmit={handlePwdSubmit(handleChangePassword)} noValidate>
          <FormField label="Current Password" required error={pwdErrors.currentPassword?.message}>
            <PasswordInput
              {...registerPwd('currentPassword')}
              placeholder="Your current password"
              error={!!pwdErrors.currentPassword}
              aria-invalid={!!pwdErrors.currentPassword}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="New Password" required error={pwdErrors.newPassword?.message}>
              <PasswordInput
                {...registerPwd('newPassword')}
                placeholder="Min. 6 characters"
                error={!!pwdErrors.newPassword}
                aria-invalid={!!pwdErrors.newPassword}
              />
            </FormField>
            <FormField label="Confirm New Password" required error={pwdErrors.confirmPassword?.message}>
              <PasswordInput
                {...registerPwd('confirmPassword')}
                placeholder="Re-enter new password"
                error={!!pwdErrors.confirmPassword}
                aria-invalid={!!pwdErrors.confirmPassword}
              />
            </FormField>
          </div>
          {/* Only the affirmative half of the old match indicator survives.
              The failure case is now the schema's `confirmPassword` error, and
              showing both would report the same problem twice in two colours. */}
          {watchedConfirm && watchedNewPassword === watchedConfirm && (
            <p className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
              <Check className="w-3.5 h-3.5" strokeWidth={3} /> Passwords match
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={savingPwd} icon={Lock}>
              {savingPwd ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── DELETE ACCOUNT ── */}
      <Card id="delete-account" icon={Trash2} title="Delete Account">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 max-w-[60ch]">
            {isOwner
              ? 'Permanently deletes your account and every branch you own, including all customers, vehicles, job cards and invoices.'
              : 'Permanently deletes your login. The garage keeps its records, including job cards you worked on.'}
          </p>
          <Button type="button" variant="danger" icon={Trash2} onClick={() => setDeletingAccount(true)}>
            Delete my account
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <DeleteAccountModal
        open={deletingAccount}
        isOwner={isOwner}
        onClose={() => setDeletingAccount(false)}
        onDeleted={async () => {
          setDeletingAccount(false);
          toast.success('Your account has been deleted');
          // The user row is gone, so the logout call itself 401s; the local
          // sign-out is what matters and logout() tolerates the failure.
          await logout();
        }}
      />
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
      <VerifyCodeModal
        channel={verifying}
        onClose={() => setVerifying(null)}
        onVerified={async () => {
          setVerifying(null);
          await refreshUser();
        }}
      />
      <ConfirmModal />
    </div>
  );
}
