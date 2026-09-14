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

## One visual system, app-wide

`DESIGN.md` at the repo root is the normative spec — the **Service Counter**
system — and it governs every page: the landing page, the signed-out pages, and
every screen behind the login. The sidecar is `.impeccable/design.json`.

The three things that catch people out:

1. **Radius is zero and shadows are none, enforced from `index.css`.** The
   whole Tailwind `--radius-*` and `--shadow-*` scale is overridden there, so a
   `rounded-xl` or `shadow-lg` left in a page paints nothing. Don't fight it
   locally with arbitrary values — change the token if the system should change.
   `rounded-full` is deliberately exempt (avatars, spinners, status dots,
   progress tracks).
2. **Grounds are bone, not white.** `bone-100` is the page field, `bone-50` is
   a panel/card/header/modal, `ink-900` is the sidebar and any standing dark
   band (add `.on-ink` to it so selection and focus invert correctly). Never
   `bg-white` or `bg-gray-50`.
3. **`bone-200` is a divider; `bone-400` is a control edge.** An input or an
   outlined button bordered with `bone-200` is about 1.2:1 against its ground —
   invisible. Anything operable uses `bone-400`.

Colour is rationed: `accent` (orange) is the one action that completes a page,
`primary` (blue) is the in-app primary action and every functional icon.

**Mobile has not been migrated.** `garageCrm-app` still follows the older
rounded, soft-shadowed language described in
`.claude/rules/00-shared-component-reuse.md`. The two clients look different
today; that file's "Premium UI Guidelines" section is accurate for mobile and
superseded on web by `DESIGN.md`.

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

## Forms — react-hook-form + zod, rules in one file

Every form in the app is `useForm` + `zodResolver`, and **every rule lives in
`src/utils/validation.ts`**. Do not write a validation rule in a page.

```jsx
const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<CustomerFormValues>({ resolver: zodResolver(customerSchema(locale)) });

<form onSubmit={handleSubmit(onValid)} noValidate>
  <Input {...register('name')} error={!!errors.name} aria-invalid={!!errors.name} />
  {errors.name && <p role="alert" className="text-danger text-[13px] mt-1">{errors.name.message}</p>}
```

Four things that are settled and should not be re-litigated:

1. **The schemas mirror the backend's Mongoose validators deliberately.** A
   client rule stricter than the server rejects data the API would accept; a
   looser one hands the user a server error after a round trip. Both are worse
   than nothing, because the user can't tell which rule they broke. Each odd
   rule carries a comment naming the backend file it came from — the email
   regex really does reject `.info`, because `models/User.ts` does.
2. **Optional means "blank is fine", never "anything goes".** Everything
   optional goes through `optionalOf()`, so an empty field passes but a filled
   one is held to the full rule. An optional email containing `asdf` is an
   error.
3. **No HTML5 `required` / `type="email"` validation.** Every `<form>` is
   `noValidate`; a native bubble next to a zod message is two error systems
   disagreeing in two visual languages.
4. **No `toast.error('Name is required')`.** A toast can't point at a field and
   is gone before the user finds it. Errors render under the input. Where a
   gate isn't a form — the job-card wizard's Next button, the estimation editor
   — it still runs the schema via `safeParse` and shows *why* it's blocked next
   to the disabled button.

**One exception: admin-console schemas live in `src/utils/adminValidation.ts`,
not `validation.ts`.** That file is hand-mirrored with mobile and listed in the
`/mirror-check` table; an admin-only schema there would either ship mobile a
schema for a screen it will never have, or leave the mirror check permanently
dirty — and a mirror check expected to be dirty stops catching the drift it
exists to catch.

`z.coerce` fields have different input and output types, so those need
`useForm<Input, unknown, Output>`; both are exported per schema.

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
| `src/utils/validation.ts` | `src/utils/validation.ts` |
| `src/utils/validation.test.ts` | `src/utils/validation.test.ts` |
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

**`waitFor` ignores `testTimeout`.** It runs its own 1s timer and fails with
"Unable to find an element", which reads like a missing element rather than a
timeout — that is what was intermittently failing `App.test.tsx` in CI, not the
`testTimeout` I raised first. `src/test/setup.ts` sets `asyncUtilTimeout` to
5000; raise that, not `testTimeout`, if a lazy page needs longer to resolve.

Two selector traps in `Settings.test.tsx`, both from page-wide queries:
the garage name renders in the header badge *and* the info row, and every staff
row has its own "Edit" button — scope to `#garage-info`. The staff modal
portals to `document.body` and is not the only `<form>` on the page, so reach
it through a control unique to it.

Settings also carries the **Verification** card (`#verification`), owners
only, driven entirely by `user.emailVerifiedAt` / `user.phoneVerifiedAt` from
AuthContext. Verify opens `components/VerifyCodeModal.tsx`, which sends the
six-digit code on open, shows the masked target the server returns, and calls
`refreshUser()` on success — the flags are the server's, never set locally.
`refreshUser()` is also called after a profile save, because a changed phone
number loses its verified mark server-side. The row buttons are labelled
"Verify email" / "Verify phone" and the modal's is plain "Verify" — query by
name to tell them apart.

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
