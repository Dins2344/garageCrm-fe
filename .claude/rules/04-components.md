<!-- Detailed reference for this repository, split by topic and read on demand.
     The always-on rules live in CLAUDE.md at the repo root. -->

## Component Patterns

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

// Success after mutation
toast.success('Customer created successfully');

// Error on catch
toast.error(err.response?.data?.message || 'Something went wrong');

// Don't use alert() or console.log for user feedback
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

## No Emoji — Use Icon Components

Emoji are not used anywhere in this app: not in JSX text, headings, toast
messages, button labels, comments, or commit messages. They render from the
user's OS font, so they look different on every machine and sit inconsistently
beside the app's icon set.

`[glyph]` below stands in for a literal emoji or symbol character — this file
stays free of them so a repo-wide scan finds zero hits.

```jsx
// Don't use emoji or bare glyph characters as icons
<p className="text-emerald-500">[glyph] Approved</p>
<span className="text-red-400">[glyph]</span>

// Use lucide-react (or react-icons/hi where a file already uses it)
<p className="text-emerald-500 flex items-center gap-1">
  <Check className="w-3 h-3" strokeWidth={3} /> Approved
</p>
<X className="w-4 h-4 text-red-400" strokeWidth={3} />
```

Bare glyph characters — check marks, crosses, warning triangles, arrows — count
as emoji for this rule **when they are standing in for an icon**. Punctuation
inside a sentence (an em dash, a middot) is fine; the test is whether the
character is doing an icon's job.

**Currency symbols are never hardcoded** for a different reason — they come
from the garage's locale via `utils/format.ts`. See **Design System & Styling
Rules**.

---

## Reuse Components Before Building New Ones

`src/components/` is a real component library. A new component built from
Tailwind defaults — square corners, `border-gray-300`, no shadow — looks
obviously bolted on and quietly forks the design system.

**Check these first:**

| Need                        | Use                                          |
| --------------------------- | -------------------------------------------- |
| Modal / dialog              | `Modal`, `ModalOverlay`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Confirmation prompt         | `useConfirm` from `ConfirmModal`             |
| Form input / select / field | `Input`, `Select`, `Textarea`, `FormField` from `Form` |
| Button                      | `Button` (has `variant`, `size`, `icon`)     |
| Card / panel                | `Card`, `CardHeader`, `CardBody`             |
| Table                       | `Table`, `Thead`, `Th`, `Tbody`, `Tr`, `Td`  |
| Status pill                 | `Badge` (takes a `JobStatus` as `intent`)    |
| Empty list state            | `EmptyState`                                 |
| Loading state               | `Loader`                                     |
| Stat tile                   | `StatCard`                                   |
| Paginated list              | `Pagination`, `ListComponents`               |
| Page title bar              | `PageHeader`                                 |

**The order of preference:**

1. Use the existing component.
2. Add a prop to it, if it is nearly right.
3. Only then write a new one — styled from the theme tokens in **Design System
   & Styling Rules**, never from defaults.

```jsx
// Don't hand-roll a modal when Modal exists
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">

// Don't build a second button with its own styling
<button className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
// Use <Button variant="primary">Save</Button>

// Don't duplicate a card's look in a one-off div
<div className="bg-white border border-gray-300 p-4">
// Use <Card> — it carries the shared radius and shadow
```

Two components that look 95% alike will drift apart, and that drift is what
makes an app feel machine-assembled.

---

