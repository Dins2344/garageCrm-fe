import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Inbox } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import RequestDetailModal from '../components/RequestDetailModal';
import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';
import { getChangeRequests } from '../services/apiServices/changeRequestService';
import { requestTypeLabel, requestStatusLabel } from '../utils/changeRequests';
import { formatDate } from '../utils/format';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import type { ApiListResponse } from '../types/api';
import type { ChangeRequest } from '../types/models';

type Tab = 'pending' | 'all';

/**
 * Owners and admins: what is waiting for a decision, and the history.
 * Everyone else: the requests they raised. `?id=` opens one (the bell links here).
 */
export default function Requests() {
  const { hasRole } = useAuth();
  const { locale, activeGarageId } = useGarage();
  const isApprover = hasRole('owner', 'admin');
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(isApprover ? 'pending' : 'all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ApiListResponse<ChangeRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const openId = params.get('id');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChangeRequests({ status: tab === 'pending' ? 'pending' : undefined, page, limit: DEFAULT_PAGE_SIZE });
      setResult(res);
      // Deciding the last row of the last page leaves it empty: step back and the effect reloads.
      if (page > 1 && (res.data.length === 0 || page > res.pages)) setPage(Math.max(1, res.pages));
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  // activeGarageId: a branch switch must reload the list.
  useEffect(() => { load(); }, [load, activeGarageId]);

  const closeDetail = useCallback(() => setParams({}, { replace: true }), [setParams]);
  const switchTab = (next: Tab) => { setTab(next); setPage(1); };
  const rows = result?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Requests">
        {isApprover && (
          <div className="flex gap-2">
            <Button variant={tab === 'pending' ? 'primary' : 'secondary'} size="sm" onClick={() => switchTab('pending')}>Pending</Button>
            <Button variant={tab === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => switchTab('all')}>All</Button>
          </div>
        )}
      </PageHeader>

      <div className="bg-bone-50 border border-bone-200">
        {loading && !result ? (
          <Loader />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No requests"
            message={isApprover
              ? (tab === 'pending' ? 'Nothing is waiting for a decision.' : 'Requests your staff raise appear here.')
              : 'Requests you raise from a job card or invoice appear here.'}
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Request</Th>
                <Th>Item</Th>
                <Th>Requested by</Th>
                <Th>Raised</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map(r => (
                <Tr key={r._id}>
                  <Td>
                    <button type="button" onClick={() => setParams({ id: r._id })} className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                      {requestTypeLabel(r.type)}
                    </button>
                  </Td>
                  <Td>{r.targetLabel}</Td>
                  <Td>{r.requestedBy?.name ?? 'A former staff member'}</Td>
                  <Td className="tabular">{formatDate(r.createdAt, locale, { day: 'numeric', month: 'short' })}</Td>
                  <Td><Badge intent={r.status}>{requestStatusLabel(r.status)}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>

      {result && result.pages > 1 && <Pagination page={page} pages={result.pages} onPageChange={setPage} />}

      {openId && <RequestDetailModal key={openId} requestId={openId} onClose={closeDetail} onChanged={load} />}
    </div>
  );
}
