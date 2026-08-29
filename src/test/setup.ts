import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

/**
 * **`waitFor` does not honour Vitest's `testTimeout`.** It runs its own timer,
 * defaulting to 1000ms, and when that expires it throws "Unable to find an
 * element" — which reads like a missing element, not like a timeout. Raising
 * `testTimeout` in `vite.config.ts` therefore did nothing for it.
 *
 * That 1s is the whole budget for `App.test.tsx` to resolve a `React.lazy`
 * page chunk. `Dashboard` pulls in Recharts, and on a loaded machine the
 * import alone crosses it: measured here, the same test passed in a 6s run and
 * failed in 12s and 21s runs, on identical code.
 *
 * 8s: long enough that contention never fails a passing test, short enough
 * that a genuinely missing element still fails the run promptly.
 *
 * **A per-call `waitFor(..., { timeout })` replaces this outright, it does not
 * cap it.** `App.test.tsx` carried a hardcoded 3s for exactly the assertion
 * that waits on Dashboard's Recharts chunk, so this global was never in play
 * there and the test stayed flaky through two raises of it. If a `waitFor`
 * flakes, check for a local override before touching this number.
 */
configure({ asyncUtilTimeout: 8000 });

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
