<!-- Detailed reference for this repository, split by topic and read on demand.
     The always-on rules live in CLAUDE.md at the repo root. -->

## Design System & Styling Rules

> **`DESIGN.md` at the repo root is the normative spec.** This file covers how
> to apply it in code; where the two disagree, DESIGN.md wins. The app runs on
> one system (the *Service Counter*) across the landing page, the signed-out
> pages and every screen behind the login.

### Theme Tokens (defined in `index.css`)

All color tokens live in the `@theme` block in `index.css`. **Always use design tokens, never hardcode colors.**

```javascript
// Use theme colors via Tailwind classes
<div className="bg-primary-500 text-white">
<span className="text-danger">Error</span>
<div className="bg-bone-100 border-bone-200">

// Never hardcode hex values in JSX
<div style={{ backgroundColor: '#3b5ff8' }}>
<span style={{ color: '#ef4444' }}>
```

### Color Palette Reference

| Token         | Purpose                  | Usage Example                |
| ------------- | ------------------------ | ---------------------------- |
| `primary-*`   | Primary actions, nav     | `bg-primary-500`, `text-primary-700` |
| `accent-*`    | Secondary actions, CTAs  | `bg-accent-500`             |
| `bone-*`      | Grounds, rules, control edges | `bg-bone-100`, `border-bone-400` |
| `ink-*`       | Standing dark bands      | `bg-ink-900`               |
| `gray-*`      | Text ramp                | `text-gray-900`, `text-gray-600` |
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
| Page background        | `bone-100`      |
| Panel / card / modal   | `bone-50`       |
| Standing dark band     | `ink-900` (+ `.on-ink`) |
| Divider / hairline     | `bone-200`      |
| Control edge (input, outlined button) | `bone-400` |
| Body text              | `gray-800`      |
| Muted / secondary text | `gray-600`      |

### Typography

- **Body / UI:** Outfit (`font-sans`, the default).
- **Display:** Archivo via `font-display` — page titles, card and modal titles,
  and the figure in a stat tile. The hand-off between the two faces is itself a
  hierarchy step; never set body copy in Archivo.
- **Body text:** `text-sm` (14px) or `text-base` (16px)
- **Card / section titles:** `font-display text-lg font-bold tracking-tight`
- **Page titles:** `font-display text-3xl font-extrabold tracking-[-0.02em]`
- **Figures in columns:** add `tabular` so digits don't wobble between values.

### Spacing & Layout

| Token              | Value   | Usage                        |
| ------------------ | ------- | ---------------------------- |
| `--spacing-sidebar` | `260px` | Sidebar width (expanded)     |
| `--spacing-sidebar-collapsed` | `72px` | Sidebar width (collapsed) |
| `--spacing-header`  | `64px`  | Header height                |

### Radius and depth — set by tokens, not per component

`index.css` overrides Tailwind's entire `--radius-*` scale to `0px` and its
`--shadow-*` scale to `0 0 #0000`. A `rounded-xl` or `shadow-md` written in a
page is therefore inert, not a bug to chase file-by-file. Depth is a ground
change plus a one-pixel rule. `rounded-full` is exempt and still round: avatars,
spinners, status dots, progress tracks.

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
| `primary`   | Main in-app actions (Save, Create) — blue |
| `secondary` | Secondary actions (Cancel) — outlined on `bone-400` |
| `accent`    | The one action that completes a page — orange |
| `danger`    | Destructive actions (Delete)   |
| `success`   | Confirmations (Approve)        |
| `ghost`     | Subtle actions (icon buttons)  |

```jsx
<Button variant="primary" size="md" icon={PlusIcon}>Add Customer</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><TrashIcon /></Button>
```

### Animation & Transitions

- **Colour transitions only**, `duration-200`, easing `cubic-bezier(0.16,1,0.3,1)`.
- **No hover lift, no press scale, no shadow transition.** A card is not a
  control and must not move under the cursor.
- One authored motion moment per page at most, starting from an already-visible
  default (see `.hero-rise` in `index.css`) with a `prefers-reduced-motion`
  guard.
- Avoid heavy animations on data-dense pages.

Orange is rationed: at most one `accent` button per screen. On a page already
full of controls the primary action is `primary` (blue) — orange there
over-signals and stops meaning "this is the one".

---

