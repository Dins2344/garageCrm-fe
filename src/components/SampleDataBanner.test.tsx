import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SampleDataBanner from './SampleDataBanner';
import { removeSampleData } from '../services/apiServices/garageService';

vi.mock('../services/apiServices/garageService', () => ({
  removeSampleData: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

/**
 * The banner's own control carries an aria-label, so it stays distinct from the
 * confirm dialog's plain "Remove" button once that opens.
 */
const bannerButton = () => screen.getByRole('button', { name: 'Remove sample data' });
const confirmButton = () => screen.getByRole('button', { name: 'Remove' });

describe('SampleDataBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the garage has no sample data', () => {
    render(<SampleDataBanner visible={false} onRemoved={vi.fn()} />);

    expect(screen.queryByTestId('sample-data-banner')).not.toBeInTheDocument();
  });

  it('shows when the garage still holds seeded rows', () => {
    render(<SampleDataBanner visible onRemoved={vi.fn()} />);

    expect(screen.getByTestId('sample-data-banner')).toBeInTheDocument();
    expect(screen.getByText('Sample data')).toBeInTheDocument();
  });

  it('asks before deleting anything', async () => {
    const user = userEvent.setup();
    render(<SampleDataBanner visible onRemoved={vi.fn()} />);

    await user.click(bannerButton());

    // The click opens the confirm; it must not delete on its own.
    expect(await screen.findByText('Remove sample data?')).toBeInTheDocument();
    expect(removeSampleData).not.toHaveBeenCalled();
  });

  it('keeps the data when the confirm is cancelled', async () => {
    const user = userEvent.setup();
    render(<SampleDataBanner visible onRemoved={vi.fn()} />);

    await user.click(bannerButton());
    await screen.findByText('Remove sample data?');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Remove sample data?')).not.toBeInTheDocument());
    expect(removeSampleData).not.toHaveBeenCalled();
  });

  it('removes the data and tells the caller to refetch once confirmed', async () => {
    vi.mocked(removeSampleData).mockResolvedValue({
      success: true,
      data: { customers: 3, vehicles: 4, jobCards: 5, invoices: 1 },
    });
    const onRemoved = vi.fn();
    const user = userEvent.setup();

    render(<SampleDataBanner visible onRemoved={onRemoved} />);
    await user.click(bannerButton());
    await screen.findByText('Remove sample data?');
    await user.click(confirmButton());

    await waitFor(() => expect(removeSampleData).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
  });

  it('does not claim success when the request fails', async () => {
    vi.mocked(removeSampleData).mockRejectedValue(new Error('offline'));
    const onRemoved = vi.fn();
    const user = userEvent.setup();

    render(<SampleDataBanner visible onRemoved={onRemoved} />);
    await user.click(bannerButton());
    await screen.findByText('Remove sample data?');
    await user.click(confirmButton());

    await waitFor(() => expect(removeSampleData).toHaveBeenCalled());
    // The rows are still there, so the banner must stay and the caller must not
    // be told to refetch as though something changed.
    expect(onRemoved).not.toHaveBeenCalled();
    expect(screen.getByTestId('sample-data-banner')).toBeInTheDocument();
  });
});
