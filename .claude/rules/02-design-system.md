<!-- Detailed reference for this repository, split by topic and read on demand.
     The always-on rules live in CLAUDE.md at the repo root. -->

## Design System & Styling Rules

### Theme Tokens (defined in `index.css`)

All color tokens live in the `@theme` block in `index.css`. **Always use design tokens, never hardcode colors.**

```javascript
// Use theme colors via Tailwind classes
<div className="bg-primary-500 text-white">
<span className="text-danger">Error</span>
<div className="bg-gray-50 border-gray-200">

// Never hardcode hex values in JSX
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

