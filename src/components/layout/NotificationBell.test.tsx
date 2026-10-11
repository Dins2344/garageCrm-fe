import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import * as notificationService from '../../services/apiServices/notificationService';
import { ACTIVE_GARAGE_KEY, NOTIFICATIONS_CHANGED_EVENT, NOTIFICATION_POLL_MS } from '../../utils/constants';
import type { AppNotification } from '../../types/models';

vi.mock('../../services/apiServices/notificationService');

const switchGarage = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', role: 'owner' }, hasRole: (...r: string[]) => r.includes('owner') }),
}));
vi.mock('../../context/GarageContext', () => ({
  useGarage: () => ({ activeGarageId: 'g1', switchGarage }),
}));

const NOTE: AppNotification = {
  _id: 'n1', user: 'u1', garage: 'g2', type: 'request_raised', title: 'Cancellation requested',
  body: 'Ravi asked to cancel JC-1: no', entityType: 'change_request', entity: 'cr1', readAt: null,
  createdAt: '2026-10-10T05:00:00Z',
};

/** jsdom has no EventSource; this stands in for the one openNotificationStream returns. */
class FakeStream extends EventTarget {
  readonly CLOSED = 2;
  readyState = 0;
  closed = false;
  close() { this.closed = true; this.readyState = this.CLOSED; }
  emit(type: string) { this.dispatchEvent(new Event(type)); }
  /** CONNECTING: the browser is retrying by itself. CLOSED: it gave up (404, 502). */
  fail(readyState: number) { this.readyState = readyState; this.dispatchEvent(new Event('error')); }
}
let streams: FakeStream[] = [];

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
};

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}{loc.search}</p>;
}

const renderBell = () => render(
  <MemoryRouter initialEntries={['/']}>
    <NotificationBell />
    <Routes><Route path="*" element={<Where />} /></Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  streams = [];
  vi.mocked(notificationService.openNotificationStream).mockImplementation(() => {
    const stream = new FakeStream();
    streams.push(stream);
    return stream as unknown as EventSource;
  });
  vi.mocked(notificationService.getUnreadCount).mockResolvedValue(3);
  vi.mocked(notificationService.getNotifications).mockResolvedValue({ success: true, count: 1, total: 1, pages: 1, currentPage: 1, data: [NOTE] });
  vi.mocked(notificationService.markNotificationRead).mockResolvedValue({ success: true, data: { ...NOTE, readAt: 'now' } });
  vi.mocked(notificationService.markAllNotificationsRead).mockResolvedValue({ success: true, data: { updated: 3 } });
});

afterEach(() => {
  Reflect.deleteProperty(document, 'visibilityState'); // back to jsdom's own getter
  vi.useRealTimers();
});

describe('NotificationBell', () => {
  it('shows the unread count from the server', async () => {
    renderBell();
    expect(await screen.findByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
  });

  it("opens a request from another branch by switching to that branch first", async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByRole('button', { name: 'Notifications, 3 unread' }));
    await user.click(await screen.findByText('Cancellation requested'));

    expect(notificationService.markNotificationRead).toHaveBeenCalledWith('n1');
    expect(switchGarage).toHaveBeenCalledWith('g2');
    expect(screen.getByTestId('where')).toHaveTextContent('/requests?id=cr1');
  });

  it("compares against the branch the API client sends, not the context's", async () => {
    const user = userEvent.setup();
    localStorage.setItem(ACTIVE_GARAGE_KEY, 'g3'); // context says g1; requests go out as g3
    try {
      renderBell();
      await user.click(await screen.findByRole('button', { name: 'Notifications, 3 unread' }));
      await user.click(await screen.findByText('Cancellation requested'));
      expect(switchGarage).toHaveBeenCalledWith('g2');
    } finally {
      localStorage.removeItem(ACTIVE_GARAGE_KEY);
    }
  });

  it('marks everything read and clears the badge', async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByRole('button', { name: 'Notifications, 3 unread' }));
    await user.click(await screen.findByRole('button', { name: 'Mark all read' }));

    expect(notificationService.markAllNotificationsRead).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('re-reads the count when this tab changes something', async () => {
    renderBell();
    await screen.findByRole('button', { name: 'Notifications, 3 unread' });
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);

    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument());
  });

  it('re-reads the count when the server says it changed', async () => {
    renderBell();
    await screen.findByRole('button', { name: 'Notifications, 3 unread' });
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(5);

    act(() => streams[0].emit('changed'));

    expect(await screen.findByRole('button', { name: 'Notifications, 5 unread' })).toBeInTheDocument();
  });

  it('closes the stream in a hidden tab and reopens it when shown', async () => {
    renderBell();
    await screen.findByRole('button', { name: 'Notifications, 3 unread' });

    act(() => setVisibility('hidden'));
    expect(streams[0].closed).toBe(true);

    act(() => setVisibility('visible'));
    expect(streams).toHaveLength(2);
    expect(streams[1].closed).toBe(false);
  });

  it('leaves reconnecting to the browser while it is still trying', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    renderBell();
    await act(async () => {});

    act(() => streams[0].fail(0));
    await act(async () => { vi.advanceTimersByTime(NOTIFICATION_POLL_MS); });

    expect(streams).toHaveLength(1);
  });

  it('after the stream gives up, polls once and then tries the stream again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    renderBell();
    await act(async () => {});
    const before = vi.mocked(notificationService.getUnreadCount).mock.calls.length;

    act(() => streams[0].fail(2));
    expect(streams).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(NOTIFICATION_POLL_MS); });

    expect(vi.mocked(notificationService.getUnreadCount).mock.calls.length).toBe(before + 1);
    expect(streams).toHaveLength(2);
  });

  it('opens exactly one stream when shown again during the fallback wait', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    renderBell();
    await act(async () => {});

    act(() => streams[0].fail(2));
    act(() => setVisibility('hidden'));
    await act(async () => { vi.advanceTimersByTime(NOTIFICATION_POLL_MS); });
    expect(streams).toHaveLength(1);

    act(() => setVisibility('visible'));
    await act(async () => { vi.advanceTimersByTime(NOTIFICATION_POLL_MS); });
    expect(streams).toHaveLength(2);
  });

  it('closes the stream on unmount', async () => {
    const { unmount } = renderBell();
    await screen.findByRole('button', { name: 'Notifications, 3 unread' });

    unmount();

    expect(streams[0].closed).toBe(true);
  });
});
