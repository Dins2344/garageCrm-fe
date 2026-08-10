import { useEffect, useState, type ReactNode } from 'react';
import { getSystemHealth, type SystemHealth } from '../../services/apiServices/adminService';

function HealthSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
        {children}
      </div>
    </div>
  );
}

function HealthItem({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemHealth()
      .then(res => setHealth(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !health) return <div>Diagnostic in progress...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-pulse">
          ✓
        </div>
        <div>
          <h4 className="font-bold text-emerald-800">Operational</h4>
          <p className="text-xs text-emerald-600 font-medium">All systems report nominal status. Backend environment: {health.environment}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HealthSection title="Process & Uptime">
          <HealthItem label="Process Uptime" value={health.uptime.process} />
          <HealthItem label="System Uptime" value={health.uptime.system} />
          <HealthItem label="Node Version" value={health.platform.node} />
          <HealthItem label="Platform" value={health.platform.os} sub={health.platform.arch} />
        </HealthSection>

        <HealthSection title="Memory Usage">
          <HealthItem label="Heap Used" value={health.memory.heapUsed} sub={`Total: ${health.memory.heapTotal}`} />
          <HealthItem label="RSS (Resident)" value={health.memory.rss} />
          <HealthItem label="Server RAM" value={health.memory.systemFree} sub={`of ${health.memory.systemTotal} Free`} />
        </HealthSection>

        <HealthSection title="CPU & Load">
          <HealthItem label="CPU Model" value={health.cpu.model || 'Unknown'} sub={`${health.cpu.cores} Cores`} />
          <HealthItem label="Load Average" value={health.cpu.loadAvg.join(' / ')} sub="1m / 5m / 15m" />
        </HealthSection>

        <HealthSection title="Database Status">
          <HealthItem label="Connection" value={health.database.status} />
          <HealthItem label="Host" value={health.database.host} />
          <HealthItem label="Database Name" value={health.database.name} />
        </HealthSection>
      </div>
    </div>
  );
}
