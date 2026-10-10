import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useInvoiceViewer } from './InvoiceViewerModal';
import * as invoiceService from '../services/apiServices/invoiceService';
import * as changeRequestService from '../services/apiServices/changeRequestService';
import type { Invoice } from '../types/models';

vi.mock('../services/apiServices/invoiceService');
vi.mock('../services/apiServices/changeRequestService');

const auth = vi.hoisted(() => ({ role: 'service_advisor' }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', role: auth.role }, hasRole: (...r: string[]) => r.includes(auth.role) }),
}));
vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return { useGarage: () => ({ locale: DEFAULT_LOCALE, activeGarage: null }) };
});
vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: (fn: () => Promise<unknown>) => fn() }),
}));

const INVOICE = {
  _id: 'inv1', invoiceNumber: 'INV-0042', paymentStatus: 'unpaid', grandTotal: 590, subtotal: 500, taxRate: 18,
  taxAmount: 90, discount: 0, parts: [], labor: [], createdAt: '2026-10-10T05:00:00Z',
  customer: { _id: 'c1', name: 'Rahul', phone: '9876543210' }, vehicle: { _id: 'v1', licensePlate: 'KL07AB1234' },
} as unknown as Invoice;

function Harness() {
  const { openInvoice, InvoiceModal } = useInvoiceViewer();
  return <><button onClick={() => openInvoice('inv1')}>open</button><InvoiceModal /></>;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.role = 'service_advisor';
  vi.mocked(invoiceService.getInvoice).mockResolvedValue({ success: true, data: INVOICE });
  vi.mocked(changeRequestService.getChangeRequests).mockResolvedValue({ success: true, count: 0, total: 0, pages: 0, currentPage: 1, data: [] });
  vi.mocked(changeRequestService.raiseChangeRequest).mockResolvedValue({ success: true, data: {} as never });
});

describe('invoice viewer — staff', () => {
  it('asks for a cancellation instead of cancelling', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('open'));

    const request = await screen.findByRole('button', { name: 'Request Cancellation' });
    expect(screen.queryByRole('button', { name: 'Cancel Bill' })).toBeNull();
    await user.click(request);
    await user.type(screen.getByLabelText('Reason *'), 'Duplicate bill');
    await user.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() => expect(changeRequestService.raiseChangeRequest).toHaveBeenCalledWith({
      type: 'invoice_cancellation', targetId: 'inv1', payload: { reason: 'Duplicate bill' },
    }));
    expect(invoiceService.deleteInvoice).not.toHaveBeenCalled();
  });

  it('shows a pending cancellation instead of the button', async () => {
    vi.mocked(changeRequestService.getChangeRequests).mockResolvedValue({
      success: true, count: 1, total: 1, pages: 1, currentPage: 1, data: [{ type: 'invoice_cancellation' } as never],
    });
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('open'));
    expect(await screen.findByText('Cancellation requested')).toBeInTheDocument();
  });

  it('keeps Cancel Bill for an owner', async () => {
    auth.role = 'owner';
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('open'));
    expect(await screen.findByRole('button', { name: 'Cancel Bill' })).toBeInTheDocument();
    expect(changeRequestService.getChangeRequests).not.toHaveBeenCalled();
  });
});
