<!-- Detailed reference for this repository, split by topic and read on demand.
     The always-on rules live in CLAUDE.md at the repo root. -->

## API Service Rules

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

// Correct pattern — export named functions, typed params + return
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

## Routing Rules

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

## State Management Rules

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

## Constants & Enums

All application-wide constants live in `utils/constants.ts`.

### What Goes Here:
- API base URL
- LocalStorage keys (`TOKEN_KEY`, `USER_KEY`, `ADMIN_TOKEN_KEY`, `ACTIVE_GARAGE_KEY`)
- External URLs (`PLAY_STORE_URL`)
- Limits and page sizes (`DEFAULT_PAGE_SIZE`, `DROPDOWN_FETCH_LIMIT`)
- Enum objects (`ROLES`, `JOB_STATUSES`, `SERVICE_TYPES`)
- Select/dropdown option arrays (`JOB_STATUS_OPTIONS`, `FUEL_TYPE_OPTIONS`)
- Shared formatting options (`DATE_FORMAT_OPTIONS`)
- Branding (`APP_NAME`, `APP_VERSION`)

### What Does NOT Go Here:

- **One-off UI copy.** A heading, button label, placeholder or toast used in
  exactly one place reads better inline. `<h2>Garage Information</h2>` beats
  `GARAGE_INFO_HEADING`; a constants file full of display strings is a
  translation layer without the translation.
- **Currency symbol, locale, tax labels, phone examples.** These resolve from
  the garage's `country` at runtime through `utils/locale.ts` and
  `utils/format.ts`. There used to be a `CURRENCY_SYMBOL`/`LOCALE` pair here
  and it hardcoded `₹`/`en-IN` for every tenant — reintroducing either would
  silently re-break non-Indian garages.

**The test:** would changing this value in one place, and having it apply
everywhere, be *correct*? If yes, extract it. If the same word appearing on two
screens is a coincidence rather than shared meaning, leave both inline.

### Rules:
- Enum objects use `UPPER_SNAKE_CASE` keys with `lower_snake_case` values (matching backend)
- Option arrays have `{ value, label }` shape
- Always import from constants — never hardcode enum values, storage keys, or
  external URLs in components:

```javascript
// Good
import { JOB_STATUSES, TOKEN_KEY, PLAY_STORE_URL } from '../utils/constants';
if (status === JOB_STATUSES.APPROVED) { ... }
localStorage.getItem(TOKEN_KEY);
<a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">

// Bad — hardcoded magic strings
if (status === 'approved') { ... }
localStorage.getItem('garagepulse_token');
<a href="https://play.google.com/store/apps/details?id=...">
```

**One Tailwind caveat:** a URL used inside an arbitrary value
(`bg-[url('...')]`) cannot be interpolated from a constant — Tailwind's scanner
only sees class strings written literally in source, so a dynamic one emits no
CSS at all. Use an inline `style={{ backgroundImage }}` with the constant
instead; that is the one sanctioned exception to the no-inline-styles rule.

---

