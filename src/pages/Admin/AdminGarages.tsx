import { useEffect, useState } from 'react';
import { getAllGarages, type EnrichedGarage } from '../../services/apiServices/adminService';

export default function AdminGarages() {
  const [garages, setGarages] = useState<EnrichedGarage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllGarages()
      .then(res => setGarages(res.data))
      .finally(() => setLoading(false));
  }, []);

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
                <div className="font-semibold text-gray-800 text-sm">{owner?.name || 'N/A'}</div>
                <div className="text-xs text-gray-400">{owner?.email || '-'}</div>
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
                <div className="text-sm font-bold text-emerald-600">₹{garage._revenue.toLocaleString()}</div>
              </td>
              <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                {garage.createdAt && new Date(garage.createdAt).toLocaleDateString()}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
