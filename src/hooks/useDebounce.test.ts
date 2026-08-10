import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 400));
    expect(result.current).toBe('initial');
  });

  it('does not update the value before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a');
  });

  it('updates to the latest value once the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe('b');
  });

  it('resets the timer when the value changes again before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Only 300ms have passed since 'c' was set — should still be 'a'
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });
});
