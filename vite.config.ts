/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 3000,
    strictPort: true // Optional: if true, Vite will exit if the port is already in use
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    /**
     * Vitest's 5s default is a unit-test number. `App.test.tsx` mounts the
     * whole router with its lazy-loaded pages, and under parallel workers that
     * cost varies enough to cross 5s on a loaded machine.
     *
     * Both sibling repos already reached the same conclusion:
     * `backend/vitest.config.mts` runs 30s, `mobile/jest.config.js` runs 20s.
     * Long enough that load never fails a passing test; short enough that a
     * genuine hang still fails instead of stalling CI.
     *
     * **This does not cover `waitFor`**, which keeps its own 1s timer — see
     * `asyncUtilTimeout` in `src/test/setup.ts`. That is the one that was
     * actually failing `App.test.tsx`.
     */
    testTimeout: 20000
  }
})
