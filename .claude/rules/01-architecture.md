<!-- Detailed reference for this repository, split by topic and read on demand.
     The always-on rules live in CLAUDE.md at the repo root. -->

# GaragePulse Web — Code Standards Reference

> **Last Updated:** August 2026
> **Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · React Router 7 · Axios · Recharts · Lucide Icons · Vitest · React Testing Library

---

## Project Structure

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

## Architecture Rules

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

## Naming Conventions

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
// Components are PascalCase function declarations or arrow functions
export default function CustomerList({ customers }) { ... }
export function Card({ children, className }) { ... }

// Hooks start with "use"
function useDebounce(value, delay) { ... }

// Event handlers start with "handle"
const handleSubmit = () => { ... };
const handleDeleteCustomer = () => { ... };

// Boolean state starts with "is" or "has"
const [isModalOpen, setIsModalOpen] = useState(false);
const [hasPermission, setHasPermission] = useState(false);

// Avoid generic names
const [data, setData] = useState(null);     // Too vague
const [flag, setFlag] = useState(false);    // What flag?
```

### CSS Class Names

Since we use **Tailwind CSS 4**, avoid custom CSS class names unless defining theme-level tokens in `index.css`.

```javascript
// Tailwind utility classes
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

// Composing via props
<Button variant="primary" size="md">Save</Button>

// Don't create custom CSS classes for one-off styling
<div className="my-custom-card-wrapper">  // Use Tailwind instead
```

---

