import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import Badge from './Badge';
import Loader from './Loader';
import { Textarea } from './Form';
import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import {
  getChangeRequest, approveChangeRequest, rejectChangeRequest, withdrawChangeRequest,
} from '../services/apiServices/changeRequestService';
import { requestTypeLabel, requestStatusLabel, decidedByLabel } from '../utils/changeRequests';
import { formatDate, formatNumber } from '../utils/format';
import { NOTIFICATIONS_CHANGED_EVENT } from '../utils/constants';
import type { ChangeRequest } from '../types/models';

interface RequestDetailModalProps {
  requestId: string;
  onClose: () => void;
  /** Called after a decision or withdrawal so the list behind can refresh. */
  onChanged: () => void;
}

const serverMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' };

/**
 * One request: what was asked, by whom, and — for owners and admins while it is
 * pending — Approve (which applies the change) or Reject. The requester can
 * withdraw it instead.
 */
export default function RequestDetailModal({ requestId, onClose, onChanged }: RequestDetailModalProps) {
  const { user, hasRole } = useAuth();
  const { locale } = useGarage();
  const { withLoader } = useGlobalLoader();
  const [request, setRequest] = useState<ChangeRequest | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let live = true;
    getChangeRequest(requestId)
      .then(res => { if (live) setRequest(res.data); })
      .catch(e => { toast.error(serverMessage(e, 'Request not found')); onClose(); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the id changes
  }, [requestId]);

  const act = (call: () => Promise<unknown>, done: string) => withLoader(async () => {
    try {
      await call();
      toast.success(done);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      onChanged();
      onClose();
    } catch (e) {
      // Stale reading, item gone, already decided: the server's words say which.
      toast.error(serverMessage(e, 'Something went wrong'));
    }
  });

  const km = (n?: number) => `${formatNumber(n ?? 0, locale)} km`;
  const pending = request?.status === 'pending';
  const canDecide = pending && hasRole('owner', 'admin');
  const canWithdraw = pending && !!user && request?.requestedBy?._id === user._id;
  const p = request?.payload;

  return (
    <ModalOverlay onClose={onClose}>
      <Modal>
        <ModalHeader title={request ? requestTypeLabel(request.type) : 'Request'} onClose={onClose} />
        <ModalBody>
          {!request || !p ? (
            <Loader />
          ) : (
            <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
              <dt className="font-semibold text-gray-500">Item</dt>
              <dd className="font-medium text-gray-900">{request.targetLabel}</dd>
              <dt className="font-semibold text-gray-500">Status</dt>
              <dd><Badge intent={request.status}>{requestStatusLabel(request.status)}</Badge></dd>
              {typeof p.odometerAtIntake === 'number' && (
                <>
                  <dt className="font-semibold text-gray-500">Reading</dt>
                  <dd className="tabular text-gray-900">{km(p.previousOdometer)} to {km(p.odometerAtIntake)}</dd>
                </>
              )}
              {(p.reason || p.remarks) && (
                <>
                  <dt className="font-semibold text-gray-500">{p.reason ? 'Reason' : 'Remarks'}</dt>
                  <dd className="whitespace-pre-wrap text-gray-900">{p.reason ?? p.remarks}</dd>
                </>
              )}
              <dt className="font-semibold text-gray-500">Requested by</dt>
              <dd className="text-gray-900">
                {request.requestedBy?.name ?? 'A former staff member'} · {formatDate(request.createdAt, locale, DATE_OPTS)}
              </dd>
              {request.decidedBy && (
                <>
                  <dt className="font-semibold text-gray-500">{decidedByLabel(request.status)}</dt>
                  <dd className="text-gray-900">
                    {request.decidedBy.name}{request.decidedAt ? ` · ${formatDate(request.decidedAt, locale, DATE_OPTS)}` : ''}
                  </dd>
                </>
              )}
              {request.decisionNote && (
                <>
                  <dt className="font-semibold text-gray-500">Note</dt>
                  <dd className="whitespace-pre-wrap text-gray-900">{request.decisionNote}</dd>
                </>
              )}
            </dl>
          )}
          {canDecide && (
            <div className="mt-5">
              <label htmlFor="decision-note" className="block text-sm font-semibold text-gray-700 mb-1.5">Note (optional)</label>
              <Textarea
                id="decision-note"
                rows={2}
                maxLength={500}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Shown to the person who asked"
              />
            </div>
          )}
        </ModalBody>
        {(canDecide || canWithdraw) && (
          <ModalFooter>
            {canWithdraw && (
              <Button variant="secondary" onClick={() => act(() => withdrawChangeRequest(requestId), 'Request withdrawn')}>
                Withdraw Request
              </Button>
            )}
            {canDecide && (
              <>
                <Button variant="danger" onClick={() => act(() => rejectChangeRequest(requestId, note.trim()), 'Request rejected')}>
                  Reject
                </Button>
                <Button variant="accent" onClick={() => act(() => approveChangeRequest(requestId, note.trim()), 'Approved and applied')}>
                  Approve
                </Button>
              </>
            )}
          </ModalFooter>
        )}
      </Modal>
    </ModalOverlay>
  );
}
