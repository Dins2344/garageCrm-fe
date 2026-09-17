import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import MultiSelect, { type MultiSelectOption } from './MultiSelect';

const options: MultiSelectOption[] = [
  { value: 'new', label: 'New' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'delivered', label: 'Delivered' },
];

// A controlled host, as the page uses it.
function Host({ onChange, initial = [] }: { onChange?: (v: string[]) => void; initial?: string[] }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <MultiSelect
      label="Status"
      options={options}
      value={value}
      onChange={next => { setValue(next); onChange?.(next); }}
    />
  );
}

describe('MultiSelect', () => {
  it('reads "All" until something is picked, then names the picks and finally counts them', async () => {
    const user = userEvent.setup();
    render(<Host />);

    const trigger = screen.getByRole('button', { name: /Status: All/ });
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'New' }));
    expect(screen.getByRole('button', { name: /Status: New$/ })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Approved' }));
    expect(screen.getByRole('button', { name: /Status: New, Approved/ })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Delivered' }));
    expect(screen.getByRole('button', { name: /Status: 3 selected/ })).toBeInTheDocument();
  });

  it('stays open across picks, toggles a pick off, and reports each change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.click(screen.getByRole('option', { name: 'New' }));
    await user.click(screen.getByRole('option', { name: 'In Progress' }));
    // Still open after two picks.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'New' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: 'New' }));
    expect(screen.getByRole('option', { name: 'New' })).toHaveAttribute('aria-selected', 'false');
    expect(onChange).toHaveBeenLastCalledWith(['in_progress']);
  });

  it('clears everything with Clear and closes with Done, Escape or an outside click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <div>
        <p>outside</p>
        <Host onChange={onChange} initial={['new', 'approved']} />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /Status: New, Approved/ }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.click(screen.getByText('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
