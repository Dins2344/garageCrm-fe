import { useEffect, useState, type ComponentType } from 'react';
import { getAdminStats, type AdminStats } from '../../services/apiServices/adminService';
import { Building2, Users, ClipboardList, Banknote } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { DEFAULT_LOCALE } from '../../utils/locale';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shadow-gray-200/50 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-inner`}>
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">{label}</p>
        <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</h3>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div>Loading platform metrics...</div>;

  const countItems = [
    { label: 'Garages', value: stats.counts.garages, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Users', value: stats.counts.users, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Job Cards', value: stats.counts.jobCards, icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600' },
    // No currency symbol on purpose. This is a platform-wide sum across every
    // tenant, and garages can now be in different countries — rendering the
    // total as "₹X" (or any single currency) would state something false.
    // Showing a mixed-currency figure needs per-currency subtotals; until
    // that exists, the honest rendering is a bare number.
    {
      label: 'Revenue (all currencies)',
      value: formatNumber(stats.revenue.total, DEFAULT_LOCALE),
      icon: Banknote,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {countItems.map(item => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Garages */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Recently Onboarded Garages</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentGarages.map((garage) => (
              <div key={garage._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{garage.name}</h4>
                  <p className="text-xs text-gray-400">{garage.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500">{garage.createdAt && new Date(garage.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jobs by Status */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
           <h3 className="font-bold text-gray-900 mb-8">Platform Workflow Health</h3>
           <div className="space-y-6">
              {Object.entries(stats.jobsByStatus).map(([status, count]) => {
                const total = stats.counts.jobCards;
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                      <span className="text-gray-500">{status.replace(/_/g, ' ')}</span>
                      <span className="text-gray-900">{count} jobs</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
           </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Recent User Registrations</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.createdAt && new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}
