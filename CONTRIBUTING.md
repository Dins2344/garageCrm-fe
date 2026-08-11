# GaragePulse Frontend (Web) — Contributing & Code Standards

> **Last Updated:** August 2026
> **Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · React Router 7 · Axios · Recharts · Lucide Icons · Vitest · React Testing Library

---

## 📁 Project Structure

```
frontend/
├── public/                    # Static assets served as-is
├── src/
│   ├── assets/                # Images, SVGs, and other static imports
│   ├── components/
│   │   ├── common/            # App-wide utilities (IdleTimer, etc.)
│   │   ├── layout/            # Shell components (AppLayout, Header, Sidebar)
│   │   ├── Badge.tsx          # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Form.tsx
│   │   ├── Loader.tsx
│   │   ├── Modal.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Pagination.tsx
│   │   ├── StatCard.tsx
│   │   └── Table.tsx
│   ├── context/               # React Context providers (AuthContext, GlobalLoaderContext)
│   ├── hooks/                 # Custom React hooks (useDebounce, etc.)
│   ├── pages/
│   │   ├── Admin/             # Platform admin pages (separate from main app)
│   │   ├── Dashboard.tsx      # Page-level components
│   │   ├── Customers.tsx
│   │   ├── Vehicles.tsx
│   │   └── ...
│   ├── services/
│   │   └── apiServices/       # Axios service modules (one per backend resource)
│   ├── types/
│   │   ├── models.ts          # Shared domain interfaces (User, Customer, JobCard, ...)
│   │   └── api.ts             # Generic API response envelope types
│   ├── test/
│   │   └── setup.ts           # Vitest + RTL global setup (jest-dom matchers, cleanup, mocks)
│   ├── utils/
│   │   └── constants.ts       # App-wide constants, enums, and config
│   ├── App.tsx                # Root component with routing (route-level React.lazy code-splitting)
│   ├── main.tsx                # Vite entry point
│   ├── vite-env.d.ts          # Vite client type reference
│   └── index.css              # Global styles + Tailwind theme
├── index.html                 # HTML template
├── tsconfig.json              # TypeScript compiler config (strict mode)
├── vite.config.ts             # Vite + Tailwind plugin config + Vitest test config
├── eslint.config.js           # ESLint flat config (typescript-eslint)
└── Dockerfile                 # Production Nginx-based image
```

Every `.tsx`/`.ts` file may have a colocated `*.test.tsx`/`*.test.ts` sibling — see **Testing Conventions** below.

### Where Does New Code Go?

| You need to...                            | Put it in...               |
| ----------------------------------------- | -------------------------- |
| Create a new full page                    | `pages/`                   |
| Build a reusable UI element               | `components/`              |
| Build a layout-level shell component      | `components/layout/`       |
| Build an app-wide utility component       | `components/common/`       |
| Add API communication for a resource      | `services/apiServices/`    |
| Add application-wide shared state         | `context/`                 |
| Add a reusable stateful utility           | `hooks/`                   |
| Add constants, enums, or lookup maps      | `utils/constants.ts`       |
| Add a shared domain type/interface        | `types/models.ts`          |
| Add static images or icons                | `assets/`                  |

---

## 🧱 Architecture Rules

### Component Hierarchy

```
App.tsx (routing + providers, pages lazy-loaded via React.lazy)
  └── AppLayout (shell: Sidebar + Header + content area)
        └── Pages (full-page views)
              └── Components (reusable building blocks)
                    └── Primitives (Button, Card, Badge, etc.)
```

### Separation of Concerns

1. **Pages** are route-level components. They:
   - Manage local state (data fetching, form state, modals)
   - Compose reusable components together
   - Handle user interactions and call API services
   - **Never** export reusable sub-components — extract those to `components/`

2. **Components** are reusable UI building blocks. They:
   - Accept props for customization
   - Are stateless or internally manage UI-only state
   - **Never** make API calls directly (receive data via props or context)
   - **Exception:** Complex domain components (like `InvoiceViewerModal`) may fetch their own data if deeply nested

3. **Context** provides application-wide shared state. They:
   - Wrap the app in `App.tsx`
   - Export both the `Provider` component and a `useXxx` hook
   - **Never** contain UI rendering logic

4. **API Services** handle all HTTP communication. They:
   - Live in `services/apiServices/`
   - Use the shared Axios interceptor (`apiInterceptor.js`)
   - Export functions that return API responses
   - **Never** handle UI state, toasts, or navigation

5. **Hooks** encapsulate reusable stateful logic. They:
   - Live in `hooks/`
   - Follow the `useXxx` naming convention
   - Return values/callbacks, not JSX

---

## 📛 Naming Conventions

### Files

| Type             | Convention             | Example                    |
| ---------------- | ---------------------- | -------------------------- |
| Page             | `PascalCase.tsx`       | `Customers.tsx`            |
| Component        | `PascalCase.tsx`       | `Button.tsx`, `Card.tsx`   |
| Context          | `PascalCaseContext.tsx` | `AuthContext.tsx`          |
| Hook             | `useCamelCase.ts`      | `useDebounce.ts`           |
| API Service      | `camelCaseService.ts`  | `customerService.ts`       |
| Utility          | `camelCase.ts`         | `constants.ts`             |
| Test             | `<subject>.test.tsx` / `.test.ts`, colocated next to the file it tests | `Customers.test.tsx`, `useDebounce.test.ts` |

`.jsx`/`.js` files are no longer added anywhere in `frontend/src/` — see **TypeScript Conventions** below.

### Components & Functions

```javascript
// ✅ Components are PascalCase function declarations or arrow functions
export default function CustomerList({ customers }) { ... }
export function Card({ children, className }) { ... }

// ✅ Hooks start with "use"
function useDebounce(value, delay) { ... }

// ✅ Event handlers start with "handle"
const handleSubmit = () => { ... };
const handleDeleteCustomer = () => { ... };

// ✅ Boolean state starts with "is" or "has"
const [isModalOpen, setIsModalOpen] = useState(false);
const [hasPermission, setHasPermission] = useState(false);

// ❌ Avoid generic names
const [data, setData] = useState(null);     // Too vague
const [flag, setFlag] = useState(false);    // What flag?
```

### CSS Class Names

Since we use **Tailwind CSS 4**, avoid custom CSS class names unless defining theme-level tokens in `index.css`.

```javascript
// ✅ Tailwind utility classes
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

// ✅ Composing via props
<Button variant="primary" size="md">Save</Button>

// ❌ Don't create custom CSS classes for one-off styling
<div className="my-custom-card-wrapper">  // Use Tailwind instead
```

---

## 🎨 Design System & Styling Rules

### Theme Tokens (defined in `index.css`)

All color tokens live in the `@theme` block in `index.css`. **Always use design tokens, never hardcode colors.**

```javascript
// ✅ Use theme colors via Tailwind classes
<div className="bg-primary-500 text-white">
<span className="text-danger">Error</span>
<div className="bg-gray-50 border-gray-200">

// ❌ Never hardcode hex values in JSX
<div style={{ backgroundColor: '#3b5ff8' }}>
<span style={{ color: '#ef4444' }}>
```

### Color Palette Reference

| Token         | Purpose                  | Usage Example                |
| ------------- | ------------------------ | ---------------------------- |
| `primary-*`   | Primary actions, nav     | `bg-primary-500`, `text-primary-700` |
| `accent-*`    | Secondary actions, CTAs  | `bg-accent-500`             |
| `gray-*`      | Neutral UI elements      | `bg-gray-50`, `text-gray-600` |
| `success`     | Positive states          | `text-success`, `bg-success-light` |
| `warning`     | Attention states         | `text-warning`              |
| `danger`      | Error/destructive states | `text-danger`, `bg-danger-light` |
| `info`        | Informational states     | `text-info`                 |

### Semantic Color Rules

| Scenario               | Color to use    |
| ---------------------- | --------------- |
| Primary buttons / nav  | `primary-500`+  |
| Destructive actions    | `danger`        |
| Success confirmations  | `success`       |
| Warnings / pending     | `warning`       |
| Page background        | `gray-50`       |
| Card background        | `white`         |
| Card border            | `gray-200`      |
| Body text              | `gray-800`      |
| Muted / secondary text | `gray-500`      |

### Typography

- **Font:** Inter (loaded via Google Fonts in `index.css`)
- **Body text:** `text-sm` (14px) or `text-base` (16px)
- **Headings:** Use `text-xl font-bold text-gray-900` for card/section titles
- **Page titles:** Use `text-2xl font-bold text-gray-900`

### Spacing & Layout

| Token              | Value   | Usage                        |
| ------------------ | ------- | ---------------------------- |
| `--spacing-sidebar` | `260px` | Sidebar width (expanded)     |
| `--spacing-sidebar-collapsed` | `72px` | Sidebar width (collapsed) |
| `--spacing-header`  | `64px`  | Header height                |

### Card Styling (Standard Pattern)

```jsx
// Always use the Card component from components/Card.tsx
import { Card, CardHeader, CardBody } from '../components/Card';

// Shorthand usage
<Card title="Customer Details" icon={UserIcon} action={<Button>Edit</Button>}>
  {/* content */}
</Card>

// Compound usage
<Card>
  <CardHeader title="Custom Header" />
  <CardBody>{/* content */}</CardBody>
</Card>
```

### Button Variants

Always use the `Button` component. Available variants:

| Variant     | Usage                          |
| ----------- | ------------------------------ |
| `primary`   | Main actions (Save, Create)    |
| `secondary` | Secondary actions (Cancel)     |
| `accent`    | Highlighted / CTA actions      |
| `danger`    | Destructive actions (Delete)   |
| `success`   | Confirmations (Approve)        |
| `ghost`     | Subtle actions (icon buttons)  |

```jsx
<Button variant="primary" size="md" icon={PlusIcon}>Add Customer</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><TrashIcon /></Button>
```

### Animation & Transitions

- Cards: `hover:shadow-md transition-shadow duration-250`
- Buttons: `transition-all duration-150`, `hover:-translate-y-[1px]`
- Use `active:scale-97` for press feedback on buttons
- Avoid heavy animations on data-dense pages

---

## 📡 API Service Rules

### File Structure

One service file per backend resource in `services/apiServices/`:

```
services/apiServices/
├── apiInterceptor.ts     # Shared Axios instance (auth headers, error handling)
├── authService.ts        # /api/auth endpoints
├── customerService.ts    # /api/customers endpoints
├── jobCardService.ts     # /api/jobcards endpoints
├── invoiceService.ts     # /api/invoices endpoints
└── ...
```

### Pattern

```typescript
import api from './apiInterceptor';
import type { ApiListResponse, ApiItemResponse } from '../../types/api';
import type { Customer } from '../../types/models';

// ✅ Correct pattern — export named functions, typed params + return
export const getCustomers = (params: { search?: string; page?: number; limit?: number }) =>
  api.get<ApiListResponse<Customer>>('/customers', { params }).then((res) => res.data);
export const getCustomer = (id: string) =>
  api.get<ApiItemResponse<Customer>>(`/customers/${id}`).then((res) => res.data);
export const createCustomer = (data: Partial<Customer>) =>
  api.post<ApiItemResponse<Customer>>('/customers', data).then((res) => res.data);
export const updateCustomer = (id: string, data: Partial<Customer>) =>
  api.put<ApiItemResponse<Customer>>(`/customers/${id}`, data).then((res) => res.data);
export const deleteCustomer = (id: string) => api.delete(`/customers/${id}`).then((res) => res.data);
```

### Rules:
- All API calls go through the shared `apiInterceptor.js` (handles auth token injection and 401 logout)
- Service functions return the Axios promise directly — let the caller handle `.then()` / `.catch()`
- Never show toasts or manage UI state inside services
- Use `params` object for query parameters: `api.get('/items', { params: { page, search } })`
- Base URL comes from `VITE_API_URL` env variable (default: `http://localhost:5000/api`)

---

## 🔀 Routing Rules

All routes are defined in `App.tsx`. Every page is imported via `React.lazy(() => import('./pages/X'))` and rendered inside a single `<Suspense>` boundary — see **Performance Conventions** below.

### Structure

```jsx
<BrowserRouter>
  <Routes>
    {/* Public routes — no auth required */}
    <Route path="/home" element={<HomePage />} />
    <Route path="/estimate/:token" element={<EstimationApproval />} />

    {/* Auth routes — redirect to dashboard if logged in */}
    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />

    {/* Protected routes — require authentication */}
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="customers" element={<Customers />} />
      {/* Role-restricted routes */}
      <Route path="invoices" element={
        <ProtectedRoute roles={['owner', 'admin', 'service_advisor']}>
          <Invoices />
        </ProtectedRoute>
      } />
    </Route>

    {/* Admin panel — separate auth flow */}
    <Route path="/admin" element={<AdminLayout />}>
      <Route path="overview" element={<AdminOverview />} />
    </Route>
  </Routes>
</BrowserRouter>
```

### Rules:
- **Public pages:** No wrapper needed
- **Auth pages (login/register):** Wrap with `<AuthRoute>` to redirect authenticated users
- **Protected pages:** Wrap with `<ProtectedRoute>` for auth check
- **Role-restricted pages:** Pass `roles={[...]}` prop to `<ProtectedRoute>`
- Always add a `<Route path="*">` catch-all redirect
- Admin pages use a separate layout (`AdminLayout`) and auth flow

---

## 🔄 State Management Rules

### Local State (Default)
Use `useState` / `useReducer` for component-level state. This is the default for most data.

### Context (Shared State)
Only use Context for truly global state:
- **`AuthContext`** — user session, login/logout/role checks
- **`GlobalLoaderContext`** — full-page loading overlay

### Rules:
- **Never** put fetched API data in Context (use local state in pages)
- Always export a `useXxx()` hook that throws if used outside the Provider
- Every Context file follows this pattern:

```jsx
const XxxContext = createContext(null);

export function XxxProvider({ children }) {
  // state and logic
  return (
    <XxxContext.Provider value={{ ... }}>
      {children}
    </XxxContext.Provider>
  );
}

export const useXxx = () => {
  const context = useContext(XxxContext);
  if (!context) throw new Error('useXxx must be used within XxxProvider');
  return context;
};
```

---

## 📋 Constants & Enums

All application-wide constants live in `utils/constants.ts`.

### What Goes Here:
- API base URL
- LocalStorage keys (`TOKEN_KEY`, `USER_KEY`)
- Enum objects (`ROLES`, `JOB_STATUSES`, `SERVICE_TYPES`)
- Select/dropdown option arrays (`JOB_STATUS_OPTIONS`, `FUEL_TYPE_OPTIONS`)
- Formatting constants (`CURRENCY_SYMBOL`, `LOCALE`, `DATE_FORMAT_OPTIONS`)
- Branding (`APP_NAME`, `APP_VERSION`)

### Rules:
- Enum objects use `UPPER_SNAKE_CASE` keys with `lower_snake_case` values (matching backend)
- Option arrays have `{ value, label }` shape
- Always import from constants — never hardcode enum values in components:

```javascript
// ✅ Good
import { JOB_STATUSES } from '../utils/constants';
if (status === JOB_STATUSES.APPROVED) { ... }

// ❌ Bad — hardcoded magic string
if (status === 'approved') { ... }
```

---

## 🧩 Component Patterns

### Page-Level Data Fetching

```jsx
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await getCustomers({ search, page });
      setCustomers(data.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  // ... render
}
```

### Toast Notifications

```javascript
import toast from 'react-hot-toast';

// ✅ Success after mutation
toast.success('Customer created successfully');

// ✅ Error on catch
toast.error(err.response?.data?.message || 'Something went wrong');

// ❌ Don't use alert() or console.log for user feedback
alert('Success!');
```

### Modal Pattern

```jsx
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const handleEdit = (item) => {
  setSelectedItem(item);
  setIsModalOpen(true);
};

const handleClose = () => {
  setSelectedItem(null);
  setIsModalOpen(false);
};
```

---

## 🚫 Anti-Patterns to Avoid

```javascript
// ❌ Don't use inline styles (use Tailwind)
<div style={{ marginTop: 20, color: 'red' }}>

// ❌ Don't hardcode colors
<div className="bg-[#3b5ff8]">  // Use bg-primary-500 instead

// ❌ Don't skip the loading state
const [data, setData] = useState(null);
// Always show a Loader while fetching

// ❌ Don't nest ternaries for conditional rendering
{a ? (b ? <X /> : <Y />) : <Z />}
// Use early returns or separate variables

// ❌ Don't create god components (> 400 lines)
// Extract sub-components or custom hooks

// ❌ Don't use index as key for dynamic lists
{items.map((item, i) => <Item key={i} />)}  // Use item._id instead

// ❌ Don't ignore the response envelope
const customers = res.data;           // This is { success, count, data: [...] }
const customers = res.data.data;      // ✅ Correct

// ❌ Don't use console.log in committed code
console.log('debug:', data);          // Remove before committing
```

---

## 🔷 TypeScript Conventions

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

## 🧪 Testing Conventions

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

## ⚡ Performance Conventions

- **Every route-level page must be lazy-loaded.** `App.tsx` imports pages via `React.lazy(() => import('./pages/X'))` and renders `<Routes>` inside a single `<Suspense fallback={<Loader variant="page" />}>`. This keeps the initial bundle to the app shell instead of shipping every page (including the entire admin console) to every visitor before first paint. When adding a new page, add it the same way — a plain top-level `import Page from './pages/Page'` defeats the code-splitting.
- **Don't add `React.memo`/`useMemo`/`useCallback` speculatively.** Add them when profiling (React DevTools Profiler) actually shows a render-cost problem, with a comment noting what was measured. Unmeasured memoization mostly adds risk (stale-closure bugs from wrong dependency arrays) without a proven benefit.
- Heavy third-party libraries used by only one page (e.g. `recharts` on `Dashboard`) benefit naturally from route-level splitting — no separate manual-chunking config needed for those; verify with `npm run build` that the library's code lands in that page's chunk, not the shared/app-shell chunk.
- Verify after any routing change: `npm run build` should show one JS chunk per lazy-loaded page in the output, not a single monolithic bundle.

---

## ✅ Pre-Push Checklist

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
