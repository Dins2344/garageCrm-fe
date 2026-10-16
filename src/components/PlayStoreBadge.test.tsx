import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayStoreBadge from './PlayStoreBadge';
import { PLAY_STORE_URL } from '../utils/constants';

describe('PlayStoreBadge', () => {
  it('links to the Play Store listing in a new tab', () => {
    render(<PlayStoreBadge />);
    const link = screen.getByRole('link', { name: /google play/i });
    expect(link).toHaveAttribute('href', PLAY_STORE_URL);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
