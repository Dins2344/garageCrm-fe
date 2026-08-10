import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '../services/apiServices/authService';
import { USER_KEY } from '../utils/constants';
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
