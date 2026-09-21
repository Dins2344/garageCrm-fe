import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '../services/apiServices/authService';
import { USER_KEY, LAST_ACTIVITY_KEY, AUTH_EXPIRED_EVENT } from '../utils/constants';
import type { User } from '../types/models';

vi.mock('../services/apiServices/authService');

const mockUser: User = {
  _id: 'u1',
  name: 'Test Owner',
  email: 'owner@example.com',
  phone: '9000000001',
  role: 'owner',
  garage: 'g1',
  isActive: true
};

function Consumer() {
  const { user, loading, login, logout, hasRole } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="has-owner-role">{String(hasRole('owner'))}</span>
      <button onClick={() => login('owner@example.com', 'password123')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('resolves the session from getMe() on mount', async () => {
    vi.mocked(authService.getMe).mockResolvedValue({ success: true, data: mockUser });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('owner@example.com');
    expect(localStorage.getItem(USER_KEY)).toContain('owner@example.com');
  });

  it('leaves user null when getMe() rejects (no valid session)', async () => {
    vi.mocked(authService.getMe).mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('login() stores the user and persists to localStorage', async () => {
    vi.mocked(authService.getMe).mockRejectedValue(new Error('401'));
    vi.mocked(authService.login).mockResolvedValue({ success: true, token: 'tok', data: mockUser });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await user.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('owner@example.com'));
    expect(screen.getByTestId('has-owner-role').textContent).toBe('true');
    expect(localStorage.getItem(USER_KEY)).toContain('owner@example.com');
  });

  it('logout() clears the user and localStorage even if the API call fails', async () => {
    vi.mocked(authService.getMe).mockResolvedValue({ success: true, data: mockUser });
    vi.mocked(authService.logout).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('owner@example.com'));

    await user.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});

const MIN = 60 * 1000;

const renderSignedIn = async () => {
  vi.mocked(authService.getMe).mockResolvedValue({ success: true, data: mockUser });
  vi.mocked(authService.logout).mockResolvedValue({ success: true, data: {} });
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('owner@example.com'));
};

describe('AuthContext session sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('signs out when the API layer reports the session is gone', async () => {
    await renderSignedIn();

    act(() => window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT)));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });

  it('signs out when another tab clears the stored user', async () => {
    await renderSignedIn();

    act(() => window.dispatchEvent(new StorageEvent('storage', { key: USER_KEY, newValue: null })));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });

  it('signs out on mount when the last activity is older than the idle window', async () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now() - 11 * MIN));
    vi.mocked(authService.getMe).mockResolvedValue({ success: true, data: mockUser });
    vi.mocked(authService.logout).mockResolvedValue({ success: true, data: {} });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });
});

describe('IdleTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
  });
  afterEach(() => vi.useRealTimers());

  const renderWithFakeTimers = async () => {
    vi.mocked(authService.getMe).mockResolvedValue({ success: true, data: mockUser });
    vi.mocked(authService.logout).mockResolvedValue({ success: true, data: {} });
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('user').textContent).toBe('owner@example.com');
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  };

  it('stays signed in while another tab is active', async () => {
    await renderWithFakeTimers();

    await act(async () => { await vi.advanceTimersByTimeAsync(8 * MIN); });
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())); // the other tab
    await act(async () => { await vi.advanceTimersByTimeAsync(5 * MIN); });

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('signs out after ten minutes without input in any tab', async () => {
    await renderWithFakeTimers();

    await act(async () => { await vi.advanceTimersByTimeAsync(11 * MIN); });

    expect(authService.logout).toHaveBeenCalled();
  });

  it('touches the server every five minutes while active so the session slides', async () => {
    await renderWithFakeTimers();
    vi.mocked(authService.getMe).mockClear();

    await act(async () => { await vi.advanceTimersByTimeAsync(4 * MIN); });
    window.dispatchEvent(new Event('mousemove'));
    await act(async () => { await vi.advanceTimersByTimeAsync(2 * MIN); });

    expect(authService.getMe).toHaveBeenCalledTimes(1);
  });
});

