# GaragePulse Frontend (Web) — Contributing & Code Standards

> **Last Updated:** August 2026
> **Stack:** React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · Axios · Recharts · Lucide Icons

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
│   │   ├── Badge.jsx          # Reusable UI primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Form.jsx
│   │   ├── Loader.jsx
│   │   ├── Modal.jsx
│   │   ├── PageHeader.jsx
│   │   ├── Pagination.jsx
│   │   ├── StatCard.jsx
│   │   └── Table.jsx
│   ├── context/               # React Context providers (AuthContext, GlobalLoaderContext)
│   ├── hooks/                 # Custom React hooks (useDebounce, etc.)
│   ├── pages/
│   │   ├── Admin/             # Platform admin pages (separate from main app)
│   │   ├── Dashboard.jsx      # Page-level components
│   │   ├── Customers.jsx
│   │   ├── Vehicles.jsx
│   │   └── ...
│   ├── services/
│   │   └── apiServices/       # Axios service modules (one per backend resource)
│   ├── utils/
│   │   └── constants.js       # App-wide constants, enums, and config
│   ├── App.jsx                # Root component with routing
│   ├── main.jsx               # Vite entry point
│   └── index.css              # Global styles + Tailwind theme
├── index.html                 # HTML template
├── vite.config.js             # Vite + Tailwind plugin config
├── eslint.config.js           # ESLint flat config
└── Dockerfile                 # Production Nginx-based image
```

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
| Add constants, enums, or lookup maps      | `utils/constants.js`       |
| Add static images or icons                | `assets/`                  |

---

## 🧱 Architecture Rules

### Component Hierarchy

```
App.jsx (routing + providers)
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
   - Wrap the app in `App.jsx`
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
| Page             | `PascalCase.jsx`       | `Customers.jsx`            |
| Component        | `PascalCase.jsx`       | `Button.jsx`, `Card.jsx`   |
| Context          | `PascalCaseContext.jsx` | `AuthContext.jsx`          |
| Hook             | `useCamelCase.js`      | `useDebounce.js`           |
| API Service      | `camelCaseService.js`  | `customerService.js`       |
| Utility          | `camelCase.js`         | `constants.js`             |

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
// Always use the Card component from components/Card.jsx
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
├── apiInterceptor.js     # Shared Axios instance (auth headers, error handling)
├── authService.js        # /api/auth endpoints
├── customerService.js    # /api/customers endpoints
├── jobCardService.js     # /api/jobcards endpoints
├── invoiceService.js     # /api/invoices endpoints
└── ...
```

### Pattern

```javascript
import api from './apiInterceptor';

// ✅ Correct pattern — export named functions
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
```

### Rules:
- All API calls go through the shared `apiInterceptor.js` (handles auth token injection and 401 logout)
- Service functions return the Axios promise directly — let the caller handle `.then()` / `.catch()`
- Never show toasts or manage UI state inside services
- Use `params` object for query parameters: `api.get('/items', { params: { page, search } })`
- Base URL comes from `VITE_API_URL` env variable (default: `http://localhost:5000/api`)

---

## 🔀 Routing Rules

All routes are defined in `App.jsx`.

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

All application-wide constants live in `utils/constants.js`.

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

## ✅ Pre-Push Checklist

- [ ] No `console.log` statements
- [ ] No hardcoded hex colors — use Tailwind theme tokens
- [ ] No inline `style={}` — use Tailwind classes
- [ ] All API calls go through `services/apiServices/`
- [ ] Loading states are handled (show `Loader` or skeleton)
- [ ] Error states show user-friendly toast messages
- [ ] New pages are registered in `App.jsx` routing
- [ ] Role-based routes use `<ProtectedRoute roles={[...]}>`
- [ ] Magic strings replaced with constants from `utils/constants.js`
- [ ] Component props have descriptive names (not `data`, `info`, `flag`)
- [ ] List keys use `_id`, not array index
- [ ] ESLint passes: `npm run lint`
