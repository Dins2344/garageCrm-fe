import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// `globals: false` in vite.config.ts means Testing Library's own auto-cleanup
// never self-installs (it only does so when it detects a *global* afterEach),
// so each test's rendered DOM would otherwise leak into the next test in the
// same file. Register it explicitly instead.
afterEach(cleanup);

// jsdom doesn't implement IntersectionObserver — HomePage's scroll-reveal
// hook needs a stub so pages that render it don't crash in tests. Not typed
// against the full (and lib-version-dependent) IntersectionObserver
// interface on purpose — this is a minimal test-environment stand-in.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
