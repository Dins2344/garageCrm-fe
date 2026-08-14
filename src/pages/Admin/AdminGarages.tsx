import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { getAllGarages, deleteOrphanedGarage, type EnrichedGarage } from '../../services/apiServices/adminService';
import { formatMoney } from '../../utils/format';
import { DEFAULT_LOCALE } from '../../utils/locale';

export default function AdminGarages() {
  const [garages, setGarages] = useState<EnrichedGarage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGarages = () => getAllGarages().then(res => setGarages(res.data));

  useEffect(() => {
    fetchGarages().finally(() => setLoading(false));
  }, []);

  const handleDeleteOrphan = async (garage: EnrichedGarage) => {
    if (!window.confirm(`Delete the ownerless garage "${garage.name}"? This cannot be undone.`)) return;
    setDeletingId(garage._id);
    try {
      await deleteOrphanedGarage(garage._id);
      toast.success(`Deleted orphaned garage "${garage.name}"`);
      await fetchGarages();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to delete garage');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div>Loading garage data...</div>;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <tr>
            <th className="px-6 py-4">Garage Name</th>
            <th className="px-6 py-4">Owner</th>
            <th className="px-6 py-4">Stats</th>
            <th className="px-6 py-4">Revenue</th>
            <th className="px-6 py-4">Joined</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {garages.map((garage) => {
            const owner = typeof garage.owner === 'string' ? null : garage.owner;
            return (
            <tr key={garage._id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-5">
                <div className="font-bold text-gray-900 text-sm">{garage.name}</div>
                <div className="text-xs text-gray-400">{garage.address?.city}, {garage.address?.state}</div>
                <div className="text-xs text-gray-400 mt-0.5">{garage.phone}</div>
              </td>
              <td className="px-6 py-5">
                {owner ? (
                  <>
                    <div className="font-semibold text-gray-800 text-sm">{owner.name}</div>
                    <div className="text-xs text-gray-400">{owner.email}</div>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                    No Owner
                  </span>
                )}
              </td>
              <td className="px-6 py-5">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900">{garage._counts.users}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Staff</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900">{garage._counts.jobCards}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900">{garage._counts.customers}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Clients</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                {/* Each garage's own currency — this list spans every tenant,
                    so one shared symbol would mislabel most of the rows. */}
                <div className="text-sm font-bold text-emerald-600">
                  {formatMoney(garage._revenue, garage.locale ?? DEFAULT_LOCALE)}
                </div>
              </td>
              <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                {garage.createdAt && new Date(garage.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-5 text-right">
                {!owner && (
                  <button
                    onClick={() => handleDeleteOrphan(garage)}
                    disabled={deletingId === garage._id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Delete orphaned garage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
