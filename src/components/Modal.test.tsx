import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ModalOverlay } from './Modal';

describe('ModalOverlay body scroll lock', () => {
  it('unlocks the body once every overlay is gone, whatever order they close in', () => {
    const view = render(<><ModalOverlay key="a"><div /></ModalOverlay><ModalOverlay key="b"><div /></ModalOverlay></>);
    expect(document.body.style.overflow).toBe('hidden');

    // The outer modal (a) closes first, then the confirm (b) on top of it.
    view.rerender(<><ModalOverlay key="b"><div /></ModalOverlay></>);
    expect(document.body.style.overflow).toBe('hidden');

    view.rerender(<></>);
    expect(document.body.style.overflow).toBe('');
  });
});
