import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { getAllUsers, deleteUser } from '../../services/apiServices/adminService';
import type { User, Garage } from '../../types/models';

interface DeleteModalState {
  user: User;
  confirmText: string;
  deleting: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);

  const fetchUsers = () => {
    return getAllUsers().then(res => setUsers(res.data));
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteModal || deleteModal.confirmText !== deleteModal.user.email) return;
    setDeleteModal({ ...deleteModal, deleting: true });
    try {
      const res = await deleteUser(deleteModal.user._id);
      const { cascadedGarages, cascadedCounts } = res.data;
      if (cascadedGarages) {
        toast.success(
          `Deleted owner and ${cascadedGarages} garage(s): ${cascadedCounts?.users ?? 0} users, ` +
          `${cascadedCounts?.customers ?? 0} customers, ${cascadedCounts?.jobCards ?? 0} job cards, and more.`
        );
      } else {
        toast.success('User deleted');
      }
      setDeleteModal(null);
      await fetchUsers();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to delete user');
      setDeleteModal(null);
    }
  };

  if (loading) return <div>Fetching global user list...</div>;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Garage</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Joined</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user) => {
            const garage = typeof user.garage === 'string' ? null : (user.garage as unknown as Garage | null);
            return (
            <tr key={user._id} className="hover:bg-gray-50/50 transition-colors text-sm">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase tracking-widest">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-700">{garage?.name || 'Unknown'}</div>
              </td>
              <td className="px-6 py-4">
                <span className={
                  user.isActive
                    ? 'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700'
                    : 'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600'
                }>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500 font-medium">
                {user.createdAt && new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => setDeleteModal({ user, confirmText: '', deleting: false })}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">Delete {deleteModal.user.name}?</h3>
                {deleteModal.user.role === 'owner' ? (
                  <p className="text-sm text-gray-500 mt-1">
                    This user is a garage <strong>owner</strong>. Deleting them will permanently delete
                    their entire garage — all customers, vehicles, job cards, invoices, inventory,
                    reminders, and staff accounts under it. This cannot be undone.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    This will permanently delete this staff account. This cannot be undone.
                  </p>
                )}
              </div>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Type <span className="font-mono text-gray-700">{deleteModal.user.email}</span> to confirm
            </label>
            <input
              type="text"
              value={deleteModal.confirmText}
              onChange={(e) => setDeleteModal({ ...deleteModal, confirmText: e.target.value })}
              placeholder={deleteModal.user.email}
              className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
              autoFocus
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteModal.confirmText !== deleteModal.user.email || deleteModal.deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleteModal.deleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
