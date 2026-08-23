# GaragePulse Web — Working Agreement

`garageCrm-fe` — the web client for a multi-tenant garage/workshop CRM.
React 19 · Vite · TypeScript (strict) · Tailwind CSS 4 · React Router 7 ·
Axios · Recharts · lucide-react · Vitest + React Testing Library. Deploys as a
Docker image served by Nginx.

**This is a standalone repository.** The API (`garageCrm-be`) and the mobile
client (`garageCrm-app`) live in separate repos and deploy on their own
schedule. Anything shared with them is duplicated by hand — see *Mirrored
files* below.

---

## Non-negotiables

1. **Never hardcode currency, locale, tax labels or date formats.** They come
   from the garage's `country` via `useGarage().locale` and
   `src/utils/format.ts`. Hardcoding re-breaks every non-Indian garage.
2. **Never inline storage keys, external URLs or magic numbers** — they belong
   in `src/utils/constants.ts`.
3. **Never use emoji**, and never a bare glyph (`✓ ✗ ✕ →`) standing in for an
   icon. Use `lucide-react`.
4. **Check `src/components/` before building a component.**
5. **Install dependencies under Node 20 / npm 10** — a lock file from a newer
   npm fails CI's `npm ci`.

## Layering

```
App.tsx (routing + providers, pages lazy-loaded via React.lazy)
  └── AppLayout (Sidebar + Header + content)
        └── Pages (route-level; own the data fetching and modals)
              └── Components (reusable; receive data via props)
```

Pages never export reusable sub-components — extract them to `components/`.
Components never call API services directly. API modules never touch UI state,
toasts or navigation.

## Use the component library

`src/components/` already covers: `Button`, `Card`, `Modal` (+ `ModalOverlay`/
`Header`/`Body`/`Footer`), `useConfirm`, `Form` (`Input`, `Select`, `Textarea`,
`FormField`), `Table`, `Badge`, `EmptyState`, `Loader`, `StatCard`,
`Pagination`, `ListComponents`, `PageHeader`.

Use it → extend it with a prop → only then build new. A one-off
`<div className="bg-white border border-gray-300 p-4">` where `<Card>` exists
forks the design system.

## Styling

- Theme tokens from `index.css` only. Never `bg-[#3b5ff8]` — use
  `bg-primary-500`.
- No inline `style={}`. **One sanctioned exception:** a URL interpolated from a
  constant, because Tailwind's scanner only sees literal class strings —
  `bg-[url(${VAR})]` emits no CSS at all. Use `style={{ backgroundImage }}`
  there.

## Locale

```jsx
const { locale } = useGarage();
formatMoney(amount, locale);                                  // ₹1,234.00
formatDate(date, locale, { day: 'numeric', month: 'short' });
```

`utils/constants.ts` deliberately has **no** `CURRENCY_SYMBOL` or `LOCALE` —
those hardcoded `₹`/`en-IN` for every tenant. Do not reintroduce them.

## Constants

Storage keys, external URLs, page sizes, enum values and option arrays live in
`utils/constants.ts`. One-off UI copy does not — `<h2>Garage Information</h2>`
is clearer inline than `GARAGE_INFO_HEADING`.

**The test:** would changing this value in one place, and having it apply
everywhere, be *correct*?

## Mirrored files — kept in step with `garageCrm-app` by hand

There is no shared package between the two clients. These files are duplicates,
and a change to one without the other is a silent divergence. The other repo is
**`github.com/Dins2344/garageCrm-app`** — if you only have this one cloned, open a
matching PR there.

| This repo | Mobile repo |
| --- | --- |
| `src/types/models.ts` | `src/types/models.ts` |
| `src/utils/format.ts` | `src/utils/format.ts` |
| `src/utils/locale.ts` | `src/utils/locale.ts` |
| `src/utils/format.test.ts` | `src/utils/format.test.ts` |
| `src/hooks/useCountries.ts` | `src/hooks/useCountries.ts` |
| `src/utils/constants.ts` (the `garagepulse_*` key strings only) | `src/utils/constants.ts` |
| `.claude/rules/00-shared-*.md` | `.claude/rules/00-shared-*.md` |

Enum string values must also match `types/domain.ts` in `garageCrm-be`.

## Tests select by role or label, not by copy

Placeholders now follow the garage's country (`locale.phoneExample`), so
`getByPlaceholderText('9876543210')` breaks for a non-Indian tenant. Use
`getByLabelText` / `getByRole`, and give inputs `id` + `htmlFor`.

Any test rendering a page that calls `useGarage()` must mock `GarageContext`
with a real `locale` — the provider never yields `undefined`, so a mock that
does tests an unreachable state.

## Verifying

```bash
npx tsc --noEmit && npx eslint . && npm test
```

`tsc` here **does** flag unused imports. Note CI runs typecheck, tests and
build but **not** lint, and `eslint .` presently reports 6 pre-existing errors
(`react-hooks/set-state-in-effect` from the new plugin v7 rule, plus
`react-refresh/only-export-components` on the context files). Don't add to
them.

Before pushing dependency changes: `npx -y npm@10 ci --dry-run`.

---

## Reference

| Topic | File |
| --- | --- |
| Project structure, layering, naming | `.claude/rules/01-architecture.md` |
| Design system, theme tokens, styling | `.claude/rules/02-design-system.md` |
| API services, routing, state, constants | `.claude/rules/03-data-and-state.md` |
| Component patterns, icons, reuse | `.claude/rules/04-components.md` |
| Anti-patterns, TypeScript, testing, performance | `.claude/rules/05-conventions.md` |
| Shared: API contract, colours, enums, universal don'ts | `.claude/rules/00-shared-contract.md` |
| Shared: no emoji | `.claude/rules/00-shared-no-emoji.md` |
| Shared: Node/npm version discipline | `.claude/rules/00-shared-node-and-npm.md` |
| Shared: constants | `.claude/rules/00-shared-constants.md` |
| Shared: component reuse and UI guidelines | `.claude/rules/00-shared-component-reuse.md` |

`00-shared-*` files are duplicated across all three repos. Change one, copy it
to the other two.
