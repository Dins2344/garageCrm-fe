<!-- Detailed reference for this repository, split by topic and read on demand.
     The always-on rules live in CLAUDE.md at the repo root. -->

## Anti-Patterns to Avoid

```javascript
// Don't use emoji or glyph characters as icons
<span className="text-emerald-500">[glyph] Approved</span>
// Use a lucide-react icon component

// Don't create a new component without checking components/ first
// Reuse or extend — Button, Card, Modal, Form, Table, Badge, EmptyState

// Don't use inline styles (use Tailwind)
<div style={{ marginTop: 20, color: 'red' }}>

// Don't hardcode colors
<div className="bg-[#3b5ff8]">  // Use bg-primary-500 instead

// Don't skip the loading state
const [data, setData] = useState(null);
// Always show a Loader while fetching

// Don't nest ternaries for conditional rendering
{a ? (b ? <X /> : <Y />) : <Z />}
// Use early returns or separate variables

// Don't create god components (> 400 lines)
// Extract sub-components or custom hooks

// Don't use index as key for dynamic lists
{items.map((item, i) => <Item key={i} />)}  // Use item._id instead

// Don't ignore the response envelope
const customers = res.data;           // This is { success, count, data: [...] }
const customers = res.data.data;      // Correct

// Don't use console.log in committed code
console.log('debug:', data);          // Remove before committing
```

---

## TypeScript Conventions

The whole frontend is TypeScript (`strict: true` in `tsconfig.json`). No new `.jsx`/`.js` files — everything is `.tsx`/`.ts`.

### Rules
- **Every component gets an explicit `interface Props`**, colocated in the same file directly above the component — not a separate types file. There was no PropTypes to migrate from, so this is the first source of truth for a component's contract.
- **Shared domain types live in `src/types/models.ts`** (`User`, `Customer`, `Vehicle`, `JobCard`, `Invoice`, etc.) and `src/types/api.ts` (`ApiListResponse<T>`, `ApiItemResponse<T>`, `ApiMessageResponse`). Reuse these instead of re-declaring an inline shape for data that comes from the backend.
- **Service functions are typed per-endpoint**: params typed explicitly, return type expressed via the generic envelope types (`Promise<ApiListResponse<Customer>>`, etc.). See the API Service Rules pattern above.
- Context value shapes are typed via an explicit interface next to the Provider (e.g. `AuthContextValue`), and `useXxx()` throws (not returns `undefined`) if used outside the Provider, so its return type never needs to be nullable at the call site.
- **Avoid `any`.** Prefer `unknown` + a narrowing check at real third-party boundaries where a library's types don't line up (e.g. Axios error shapes in `catch` blocks).
- `import.meta.env.VITE_API_URL` is typed via `types: ["vite/client"]` in `tsconfig.json` — don't re-declare `ImportMetaEnv` locally.
- Run `npm run typecheck` (`tsc --noEmit`) before pushing — it's also enforced in CI (`.github/workflows/ci.yml`), and `npm run build` runs it too (the build fails on type errors, by design).

---

## Testing Conventions

Tests use **Vitest** + **React Testing Library** + **user-event**, with API service modules mocked via `vi.mock(...)` — tests never hit a real network or a real backend.

### Where tests live
- **Colocated with the file they test**: `Customers.tsx` → `Customers.test.tsx`, `useDebounce.ts` → `useDebounce.test.ts`, right next to each other in the same folder. This is a deliberate difference from the backend's centralized `tests/` folder — the backend followed Mongoose/Supertest convention (tests exercise cross-layer HTTP flows, so grouping by feature area reads better); the frontend's tests are almost all single-file-scoped (one component, one hook, one service module), so colocation keeps the test next to the code it actually verifies and moves/deletes with it naturally.
- `src/test/setup.ts` — global Vitest setup: imports `@testing-library/jest-dom` matchers, registers `afterEach(cleanup)` explicitly (see note below), and stubs browser APIs jsdom doesn't implement (e.g. `IntersectionObserver`).

### Rules
- **Mock API service modules, never `apiInterceptor`/axios directly**, in page/component tests — `vi.mock('../services/apiServices/customerService')` keeps the test focused on the component's behavior, not the HTTP layer. The one exception is a service module's own test (e.g. `customerService.test.ts`), which mocks `apiInterceptor` to lock in the verb/URL/envelope-unwrap contract that pages rely on.
- **`vite.config.ts`'s Vitest block uses `globals: false`.** This means Testing Library's built-in auto-cleanup does not self-install (it only activates when it detects a global `afterEach`) — `src/test/setup.ts` registers `afterEach(cleanup)` explicitly. Don't remove this; without it, rendered DOM leaks across tests in the same file and causes "multiple elements found" failures.
- Mock `../context/AuthContext` / `../context/GlobalLoaderContext` directly (`vi.mock('../context/AuthContext', () => ({ useAuth: () => ({...}) }))`) in page tests rather than rendering the real providers, unless the test is specifically about auth/loader behavior itself (see `AuthContext.test.tsx`).
- Priority order for new work: hooks and context (pure logic, cheap to test), the service-layer contract for any new/changed service module, and one componentry-level test per new page (fetch → render, plus the primary user action) — not exhaustive line coverage.
- Use `getByRole`/`getByPlaceholderText`/`getByText` queries (matching how a user finds the element) over `getByTestId`; add `data-testid` only when there's no accessible query available.

### Running tests
```bash
npm test          # single run (vitest run) — what CI runs
npm run test:watch # watch mode while developing
```

---

## Performance Conventions

- **Every route-level page must be lazy-loaded.** `App.tsx` imports pages via `React.lazy(() => import('./pages/X'))` and renders `<Routes>` inside a single `<Suspense fallback={<Loader variant="page" />}>`. This keeps the initial bundle to the app shell instead of shipping every page (including the entire admin console) to every visitor before first paint. When adding a new page, add it the same way — a plain top-level `import Page from './pages/Page'` defeats the code-splitting.
- **Don't add `React.memo`/`useMemo`/`useCallback` speculatively.** Add them when profiling (React DevTools Profiler) actually shows a render-cost problem, with a comment noting what was measured. Unmeasured memoization mostly adds risk (stale-closure bugs from wrong dependency arrays) without a proven benefit.
- Heavy third-party libraries used by only one page (e.g. `recharts` on `Dashboard`) benefit naturally from route-level splitting — no separate manual-chunking config needed for those; verify with `npm run build` that the library's code lands in that page's chunk, not the shared/app-shell chunk.
- Verify after any routing change: `npm run build` should show one JS chunk per lazy-loaded page in the output, not a single monolithic bundle.

---

## Pre-Push Checklist

- [ ] No emoji anywhere — UI text, toasts, comments, or commit messages
- [ ] No inline storage keys, external URLs, or magic numbers — import from `constants.ts`
- [ ] Dependencies installed under Node 20 / npm 10 (`nvm use`) — verify with `npx -y npm@10 ci --dry-run`
- [ ] No new component that duplicates one already in `src/components/`
- [ ] No `console.log` statements
- [ ] No hardcoded hex colors — use Tailwind theme tokens
- [ ] No inline `style={}` — use Tailwind classes
- [ ] All API calls go through `services/apiServices/`
- [ ] Loading states are handled (show `Loader` or skeleton)
- [ ] Error states show user-friendly toast messages
- [ ] New pages are registered in `App.tsx` routing via `React.lazy(...)`, not a top-level import
- [ ] Role-based routes use `<ProtectedRoute roles={[...]}>`
- [ ] Magic strings replaced with constants from `utils/constants.ts`
- [ ] Component props have descriptive names (not `data`, `info`, `flag`) and an explicit `interface Props`
- [ ] List keys use `_id`, not array index
- [ ] New/changed components, hooks, or service modules have at least one colocated test
- [ ] No new memoization (`memo`/`useMemo`/`useCallback`) without profiling data backing it
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm test` passes locally
- [ ] ESLint passes: `npm run lint`
