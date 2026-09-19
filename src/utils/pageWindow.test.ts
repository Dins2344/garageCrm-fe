import { describe, it, expect } from 'vitest';
import { pageWindow } from './pageWindow';

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps the first and last page and a window around the current one', () => {
    expect(pageWindow(1, 203)).toEqual([1, 2, 3, 4, 5, 6, 'gap', 203]);
    expect(pageWindow(100, 203)).toEqual([1, 'gap', 98, 99, 100, 101, 102, 'gap', 203]);
    expect(pageWindow(203, 203)).toEqual([1, 'gap', 198, 199, 200, 201, 202, 203]);
  });

  it('never shows a gap for a single skipped page', () => {
    expect(pageWindow(4, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
