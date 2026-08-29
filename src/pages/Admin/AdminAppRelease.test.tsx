import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminAppRelease from './AdminAppRelease';
import * as adminService from '../../services/apiServices/adminService';

vi.mock('../../services/apiServices/adminService');

const policy = {
  platform: 'android',
  latestVersion: '1.1.0',
  minSupportedVersion: '',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.dctechs.garagepulse',
  updateMessage: 'A new version is available.',
  blockingMessage: 'Please update to continue.',
  enabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminService.getAppRelease).mockResolvedValue({ success: true, data: policy });
  vi.mocked(adminService.updateAppRelease).mockResolvedValue({ success: true, data: policy });
});

describe('AdminAppRelease', () => {
  it('shows what is currently in force, and loads it into the form', async () => {
    render(<AdminAppRelease />);

    await waitFor(() => expect(screen.getByText('Currently in force')).toBeInTheDocument());
    expect(screen.getByText('nobody')).toBeInTheDocument();
    expect(screen.getByLabelText(/Latest version/i)).toHaveValue('1.1.0');
  });

  it('says so plainly when no policy exists yet', async () => {
    vi.mocked(adminService.getAppRelease).mockResolvedValue({ success: true, data: null });
    render(<AdminAppRelease />);

    await waitFor(() =>
      expect(screen.getByText(/No policy yet\. Nothing is being prompted or blocked\./i)).toBeInTheDocument()
    );
  });

  /**
   * The state that blocks 100% of the field instantly, including anyone already
   * on the newest build. The server refuses it too — this is here so the admin
   * sees it under the field rather than as a toast after a round trip.
   */
  it('refuses a minimum newer than the latest version, without calling the API', async () => {
    const user = userEvent.setup();
    render(<AdminAppRelease />);
    await waitFor(() => expect(screen.getByLabelText(/Latest version/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/Minimum supported version/i), '2.0.0');
    await user.click(screen.getByRole('button', { name: /Save policy/i }));

    expect(await screen.findByText(/would block every user/i)).toBeInTheDocument();
    expect(adminService.updateAppRelease).not.toHaveBeenCalled();
  });

  it('turns the minimum into a sentence about real people', async () => {
    const user = userEvent.setup();
    render(<AdminAppRelease />);
    await waitFor(() => expect(screen.getByLabelText(/Latest version/i)).toBeInTheDocument());

    expect(screen.getByText('Nobody will be blocked.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Minimum supported version/i), '1.0.5');

    expect(
      await screen.findByText('Users below 1.0.5 will be blocked from using the app.')
    ).toBeInTheDocument();
  });

  it('saves when nothing is being blocked, with no confirm in the way', async () => {
    const user = userEvent.setup();
    render(<AdminAppRelease />);
    await waitFor(() => expect(screen.getByLabelText(/Latest version/i)).toBeInTheDocument());

    await user.clear(screen.getByLabelText(/Latest version/i));
    await user.type(screen.getByLabelText(/Latest version/i), '1.2.0');
    await user.click(screen.getByRole('button', { name: /Save policy/i }));

    await waitFor(() =>
      expect(adminService.updateAppRelease).toHaveBeenCalledWith(
        expect.objectContaining({ latestVersion: '1.2.0', minSupportedVersion: '' })
      )
    );
  });

  it('rejects a store URL that is not https', async () => {
    const user = userEvent.setup();
    render(<AdminAppRelease />);
    await waitFor(() => expect(screen.getByLabelText(/Store URL/i)).toBeInTheDocument());

    await user.clear(screen.getByLabelText(/Store URL/i));
    await user.type(screen.getByLabelText(/Store URL/i), 'http://play.google.com');
    await user.click(screen.getByRole('button', { name: /Save policy/i }));

    expect(await screen.findByText(/must start with https/i)).toBeInTheDocument();
    expect(adminService.updateAppRelease).not.toHaveBeenCalled();
  });
});
