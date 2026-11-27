import { useEffect, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CloudUpload, Crown, Gift, PowerOff, Trash2, UserPlus, Users } from 'lucide-react';
import { getMyGarageStats, type MyGarageStats } from '../../services/apiServices/adminService';
import StatCard from '../../components/StatCard';
import { Card } from '../../components/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/Table';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import { formatDate, formatNumber } from '../../utils/format';
import { DEFAULT_LOCALE } from '../../utils/locale';

const n = (v: number) => formatNumber(v, DEFAULT_LOCALE);
const date = (d: string | null) => (d ? formatDate(d, DEFAULT_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never');
const size = (bytes: number) => (bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`);
const words = (s: string) => s.replace(/^SUBSCRIPTION_STATE_/, '').replace(/_/g, ' ').toLowerCase();

/** Label and value rows inside a card. */
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-bone-200">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm text-gray-600">{label}</dt>
          <dd className="tabular text-sm font-bold text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminMyGarage() {
  const [stats, setStats] = useState<MyGarageStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMyGarageStats().then(res => setStats(res.data), () => setError(true));
  }, []);

  if (error) return <EmptyState icon={PowerOff} title="Could not load MyGarage figures" message="Reload the page to try again." />;
  if (!stats) return <Loader text="Loading MyGarage figures" />;
  if (!stats.connected) return <EmptyState icon={PowerOff} title="MyGarage is off on this server" message="Its database or settings are missing, so there is nothing to show." />;

  const { accounts: a, plus, referrals: r, sync, sharing, settings } = stats;
  const onOff = (on: boolean) => <Badge intent={on ? 'paid' : 'cancelled'}>{on ? 'On' : 'Off'}</Badge>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Signed-in accounts only. Guests never reach the server, and ads are counted in AdMob, so neither appears here.
        Active means the app refreshed its session in that time.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Accounts" value={n(a.total)} icon={Users} sub={`${n(a.new30)} new in 30 days`} />
        <StatCard title="New today" value={n(a.new1)} icon={UserPlus} colorClass="teal" sub={`${n(a.new7)} in 7 days`} />
        <StatCard title="Active today" value={n(a.active1)} icon={Activity} colorClass="green" sub={`${n(a.active7)} in 7 days`} />
        <StatCard title="Active in 30 days" value={n(a.active30)} icon={Activity} colorClass="green" sub={`${n(a.signedIn)} still signed in`} />
        <StatCard title="Paying for Plus" value={n(plus.paying)} icon={Crown} colorClass="orange" sub={`${n(plus.granted)} on invite days`} />
        <StatCard title="Deleted accounts" value={n(a.deleted)} icon={Trash2} colorClass="red" sub={`${n(a.deleted30)} in 30 days`} />
      </div>

      <Card title="Sign-ups and deletions, last 30 days (India time)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stats.daily.map(d => ({ ...d, label: formatDate(d.day, DEFAULT_LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' }) }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ borderRadius: 0, background: 'var(--color-ink-900)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13 }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="signups" name="Sign-ups" fill="#3b5ff8" maxBarSize={18} />
            <Bar dataKey="deletions" name="Deletions" fill="#ef4444" maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-gray-500">Deletions count only from the backend release that started recording them.</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="MyGarage Plus" icon={Crown}>
          <Facts rows={[
            ['Paying now (active, grace or cancelled but not yet ended)', n(plus.paying)],
            ['On free days from invites now', n(plus.granted)],
          ]} />
          {plus.plans.length > 0 && (
            <Table className="mt-4">
              <Thead><tr><Th>Plan</Th><Th>State</Th><Th className="text-right">Purchases</Th><Th className="text-right">Auto-renew</Th></tr></Thead>
              <Tbody>
                {plus.plans.map(p => (
                  <Tr key={`${p.plan}-${p.state}`}>
                    <Td>{p.plan}</Td>
                    <Td className="capitalize">{words(p.state)}</Td>
                    <Td className="tabular text-right">{n(p.count)}</Td>
                    <Td className="tabular text-right">{n(p.autoRenew)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>

        <Card title="Invite friends" icon={Gift}>
          <Facts rows={[
            ['Invite codes opened', n(r.codes)],
            ['Friends joined', n(r.total)],
            ['Rewarded', n(r.rewarded)],
            ['Waiting for a vehicle', n(r.pending)],
            ['Joined through a link / typed a code', `${n(r.viaLink)} / ${n(r.typed)}`],
            ['Inviter past the yearly limit', n(r.capped)],
            ['Plus days given', `${n(r.grantedDays)} (${n(r.grants)} grants)`],
          ]} />
        </Card>

        <Card title="Backup and files" icon={CloudUpload}>
          <Facts rows={[
            ['Accounts with backup', n(sync.backupUsers)],
            ['Shared garages with records', n(sync.backupGarages)],
            ['Files stored', `${n(sync.files.uploaded)} (${size(sync.files.bytes)})`],
            ['Accounts with files', n(sync.files.owners)],
            ['Uploads started, not finished', n(sync.files.pending)],
          ]} />
          {sync.tables.length > 0 && (
            <Table className="mt-4">
              <Thead><tr><Th>Records</Th><Th className="text-right">Kept</Th><Th className="text-right">Deleted</Th></tr></Thead>
              <Tbody>
                {sync.tables.map(t => (
                  <Tr key={t.tbl}>
                    <Td className="capitalize">{t.tbl.replace(/_/g, ' ')}</Td>
                    <Td className="tabular text-right">{n(t.live)}</Td>
                    <Td className="tabular text-right">{n(t.deleted)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Shared garages" icon={Users}>
            <Facts rows={[
              ['Shared garages', n(sharing.garages)],
              ['Members who can edit', n(sharing.members.editor ?? 0)],
              ['Members who can view', n(sharing.members.viewer ?? 0)],
              ['Invites pending', n(sharing.invites.pending ?? 0)],
              ['Invites accepted / declined / cancelled', `${n(sharing.invites.accepted ?? 0)} / ${n(sharing.invites.declined ?? 0)} / ${n(sharing.invites.cancelled ?? 0)}`],
            ]} />
          </Card>

          <Card title="Server settings" icon={PowerOff}>
            <Facts rows={[
              ['Play purchases', onOff(settings.purchases)],
              ['Sharing needs Plus', onOff(settings.requirePlus)],
              ['Invite friends', onOff(settings.referrals)],
              ['Oldest allowed build', settings.minVersionCode ? `versionCode ${settings.minVersionCode}` : 'Any'],
              ['Blocked builds', settings.blockedVersionCodes.length ? settings.blockedVersionCodes.join(', ') : 'None'],
            ]} />
          </Card>
        </div>
      </div>

      <Card title="Newest accounts" noPadding>
        {stats.recentUsers.length === 0 ? (
          <EmptyState icon={Users} title="No accounts yet" />
        ) : (
          <Table className="border-0">
            <Thead><tr><Th>Account</Th><Th>Joined</Th><Th>Last active</Th><Th>Plus</Th><Th>Backup</Th><Th className="text-right">Files</Th></tr></Thead>
            <Tbody>
              {stats.recentUsers.map(u => (
                <Tr key={u.email}>
                  <Td>
                    <div className="font-bold text-gray-900">{u.name || 'No name'}</div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                  </Td>
                  <Td>{date(u.createdAt)}</Td>
                  <Td>{date(u.lastSeen)}</Td>
                  <Td>{u.paid ? <Badge intent="paid">Paid</Badge> : u.granted ? <Badge intent="partial">Invite days</Badge> : 'Free'}</Td>
                  <Td>{u.backup ? 'On' : 'Off'}</Td>
                  <Td className="tabular text-right">{u.bytes ? size(u.bytes) : '-'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
