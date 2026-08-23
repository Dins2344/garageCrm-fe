---
name: GaragePulse
description: Workshop management for independent garages, across branches and borders.
colors:
  signal-orange: "#f97316"
  signal-orange-lit: "#fb923c"
  workshop-blue: "#3b5ff8"
  workshop-blue-deep: "#2540ed"
  ink: "#0b0f1a"
  ink-raised: "#141a28"
  bone: "#faf8f4"
  bone-shaded: "#f2eee6"
  bone-rule: "#e4ded1"
  bone-rule-lit: "#cfc5b2"
  bone-edge: "#8a8375"
  graphite: "#111827"
  graphite-body: "#4b5563"
  graphite-muted: "#6b7280"
typography:
  display:
    fontFamily: "Archivo, Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  data:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  meta:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  columnhead:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.04em"
  label:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  rule-gap: "28px"
  band-y: "112px"
  gutter: "20px"
  gutter-wide: "32px"
components:
  button-accent:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    typography: "{typography.title}"
  button-accent-hover:
    backgroundColor: "{colors.signal-orange-lit}"
  button-solid:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
  button-solid-hover:
    backgroundColor: "{colors.ink-raised}"
  button-outline-ink:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
  input:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
    typography: "{typography.title}"
  chip-market:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
    typography: "{typography.label}"
---

# Design System: GaragePulse

## Overview

**Creative North Star: "The Service Counter"**

A garage's service counter is where the workshop meets the person paying for it.
It is a hard, wiped-down surface with paperwork on it, lit brightly enough to
read a figure under, and it has no decoration whatsoever — everything on it is
either the job or the money. That is the register of this system: flat, ruled,
square-cornered, and completely literal about what it is showing you.

**This system governs the entire application** — the landing page, the four
signed-out pages, and every screen behind the login. There is no separate
"product UI" language any more; a card in the dashboard and a panel on the
landing page are the same object.

The system runs on a two-ground alternation. Full-bleed bands of **ink** carry
the arguments and the commitments; bands of **bone** carry the explanations.
Inside the app the sidebar is the standing ink band and the content area is
bone.

Nothing floats between them. There is no elevation and no radius anywhere — a
section is separated from the next by a change of ground, and an item is
separated from its neighbour by a one-pixel rule. Where another system would
draw a box, this one draws a line and adds space.

Colour is rationed rather than distributed. **Signal orange** is the only warm
tone anywhere and it is spent on commitment: the primary action, the total on an
invoice, and exactly one emphasis per band. **Workshop blue** carries structure
and every functional icon. Everything else is ink, bone, and graphite text. The
confirmed rejection is the category default this product deliberately walked
away from: centred gradient hero, floating browser-frame screenshot, uniform
icon-card grid, logo strip, stat counters.

**Key Characteristics:**

- Two grounds, alternating full-bleed: ink and bone. Never a third.
- Zero radius and zero shadow, app-wide. Depth is ground change.
- Hairline rules instead of card borders; space instead of enclosure.
- Orange for commitment only; blue for structure; nothing else is coloured.
- Industrial grotesque display over a humanist UI sans.
- One authored motion moment on the page, on the first viewport, and no others.

## Colors

A workshop palette: two grounds at opposite ends of the value range, one signal,
one structural hue, and a graphite text ramp between them.

### Primary

- **Signal Orange** (`#f97316`): commitment. Every primary action on every band,
  the invoice total, and the active market chip. It appears on roughly five
  percent of any viewport and that scarcity is the entire mechanism — the eye
  finds the next thing to click without being directed to it.
- **Signal Orange Lit** (`#fb923c`): the hover of Signal Orange, and its
  substitute for text set on ink, where the darker value loses contrast.

### Secondary

- **Workshop Blue** (`#3b5ff8`): structure. Every functional icon on a bone
  ground, every inline link hover, the focus ring, and the primary action on a
  screen already full of controls — inside the app, orange would over-signal on
  a page with eight buttons on it, so `primary` is blue and `accent` (orange)
  is kept for the one action that completes a page.
- **Workshop Blue Deep** (`#2540ed`): the caret in text inputs; the pressed and
  active end of Workshop Blue.

### Neutral

- **Ink** (`#0b0f1a`): the dark ground. Darker and bluer than the graphite text
  ramp so that orange and white both sit at full strength on it.
- **Ink Raised** (`#141a28`): the hover state of solid graphite buttons, and the
  only lift the system has.
- **Bone** (`#faf8f4`): the panel ground — cards, tables, the header, modals.
  Warm off-white rather than a cool `gray-50`: against ink, a cool light surface
  reads as an unlit screen and a warm one reads as paper under workshop light.
- **Bone Shaded** (`#f2eee6`): the page field itself, and the ground a panel
  sits *on*. Also separates two consecutive light bands without a border.
- **Bone Rule** (`#e4ded1`): every decorative hairline and divider on a light
  ground — the line between two list rows, above a footer bar, under a heading.
- **Bone Rule Lit** (`#cfc5b2`): a divider that needs slightly more weight.
- **Bone Edge** (`#8a8375`): the resting border of anything a user has to find
  and operate — a text input, a select, an outlined button. Not the same token
  as the divider, and not interchangeable with it.
- **Graphite** (`#111827`) / **Graphite Body** (`#4b5563`) / **Graphite Muted**
  (`#6b7280`): headings, body copy and secondary copy on bone.

On ink, secondary text is white at an alpha, never grey: `white/70` for body,
`white/60` for labels and list copy, `white/55` for the smallest caps labels.

### Named Rules

**The Rationing Rule.** Signal Orange marks commitment and nothing else: an
action the visitor can take, a total they will pay, or one deliberate point of
emphasis per band. A second orange element in a band means one of them is not
commitment and should be blue, white or graphite.

**The Two Grounds Rule.** A surface is ink or it is bone. There is no third
ground and no tinted panel floating on either one. When two sections need
separating and both are light, the second takes Bone Shaded — not a border, not
a card, not a shadow.

**The Alpha-Not-Grey Rule.** Secondary text on ink is white at an alpha so it
stays in the ground's own hue. Grey text on ink is always wrong, and no alpha
below `white/55` is legible enough to ship.

**The Edge-Is-Not-A-Rule Rule.** A divider and a control's border are different
tokens. Bone Rule is decorative and may sit at any contrast; Bone Edge draws the
boundary of something operable and must clear 3:1 against its ground. Styling an
input with the divider token produces a border nobody can see — that is exactly
how the first pass of the auth pages shipped, and how it was caught.

## Typography

**Display Font:** Archivo (with Outfit, then the system sans, as fallback)
**Body Font:** Outfit (with the system sans as fallback)

**Character:** Archivo is an industrial grotesque — squarer, wider and flatter-
sided than Outfit, with tight apertures. At display sizes it reads as signage
rather than as oversized interface text, which is the whole reason it is here.
Outfit is the softer humanist voice that already runs the product UI, and it
stays in that role: everything a user reads at length is Outfit.

### Hierarchy

- **Display** (800, `clamp(2.5rem, 5vw, 3.75rem)`, 1.05, `-0.03em`): the one
  headline per band. Left-set, broken across explicit lines so the ragging is
  authored rather than inherited from the container width.
- **Headline** (700, `clamp(1.875rem, 3vw, 2.25rem)`, 1.15, `-0.02em`): section
  headings. Archivo, never Outfit.
- **Title** (600, `1rem`): item and row headings. Outfit — the switch from
  Archivo to Outfit is itself the hierarchy step.
- **Body** (400, `0.875rem`–`1.125rem`, 1.65): all running copy. Measure is held
  at `52ch` in a ruled column and `58ch` in a hero subhead; the narrower measure
  is deliberate for scan-reading, not an oversight.
- **Data** (400, `15px`, 1.5): table cell text and form control values. One step
  above body because a dense grid of figures needs to stay scannable.
- **Meta** (500, `13px`, 1.45): the label under a stat figure, secondary line in
  a list row, helper copy under a field.
- **Column head** (700, `12px`, `0.04em`, uppercase): table header cells.
- **Label** (700, `0.625rem`, `0.2em`, uppercase): panel and column labels only —
  "Invoice preview", "Product", "Account". Never above a heading.

### Named Rules

**The Two-Voice Rule.** Archivo is display, Outfit is everything a user reads.
A paragraph in Archivo or a hero headline in Outfit both break the system; the
hand-off between them is doing the work a size ramp would otherwise do alone.

**The Authored Rag Rule.** Display headlines break on explicit line breaks, not
on container width. If a headline reflows into a shape nobody chose, the break
points are wrong, not the container.

**The No-Eyebrow Rule.** Nothing is set above a heading. No kicker, no eyebrow,
no section number. The heading carries its own weight. Uppercase labels exist,
but only as the label of a panel or a column, never as a lead-in to a heading.

## Layout

A single `max-width: 80rem` container with `1.25rem` gutters, opening to
`2rem` from the `sm` breakpoint. Sections are full-bleed bands; only the
container inside them is constrained, so a ground change always runs edge to
edge.

Vertical rhythm is band-scale: `7rem` of padding above and below a section on
desktop, `5rem` on mobile, with a consistently larger gap above a heading than
below it. Inside a band, related items sit `1.75rem` apart and unrelated groups
`3.5rem` apart.

Two grid shapes carry almost everything. Alternating product blocks use a
`1fr 1fr` split that reverses side every other block and collapses to a single
column below `lg`. Ruled lists run in a three-column grid on desktop, two at
`md`, one on mobile — each cell separated by a top rule rather than a gap, so
the column structure survives the collapse as a single ruled stack.

The hero is deliberately asymmetric: `1.1fr 0.9fr`, headline left, live panel
right, so nothing is centred.

**Breakpoints:** `sm` 640px, `md` 768px, `lg` 1024px. Navigation collapses to a
sheet at `lg`, not at `md`, because the nav carries four links plus two actions.

## Elevation & Depth

**This system has no shadows.** Not a soft one, not an ambient one. Tailwind's
entire shadow scale is neutralised to `0 0 #0000` in `index.css`, along with
the legacy `--shadow-premium*` tokens, so a stray `shadow-lg` left in a page
paints nothing rather than breaking the system. Depth is expressed three ways and only these three:

1. **Ground change.** A full-bleed band of ink against a band of bone is the
   system's largest depth step, and it is the only one that reads at a glance.
2. **A one-pixel rule.** Bone Rule on light, `white/10`–`white/15` on ink.
3. **A `white/5` fill on ink.** The single tinted panel the system allows, used
   where content genuinely sits *on* the band rather than *in* it — the invoice
   preview, the branch panel. It never appears on bone.

There is no second depth vocabulary anywhere in the app.

### Named Rules

**The Flat Rule.** If an element needs to look raised, it is on the wrong
ground. Change the band or add a rule; never add a shadow.

## Shapes

**Radius is zero.** Every button, panel, chip, input and image slot on the
marketing surface has square corners. This is the single most load-bearing
decision in the system: the category's default is a soft rounded rectangle, and
squaring everything is what makes the same content read as a tool rather than as
a product page.

Borders are always exactly one pixel and never coloured beyond the palette's own
rule tokens. Multi-cell panels are built as a `gap: 1px` grid over a rule-
coloured background, so the dividers are the grid itself rather than borders
drawn on each child.

The one repeating geometry is a 64px square grid, drawn at 7% white opacity
across ink bands. It is a surveyor's grid, not a decoration: it gives the dark
bands a sense of scale and it is the only texture in the system.

Image placeholders are dashed one-pixel rectangles that state their own aspect
ratio and what belongs in them, rather than gradients standing in for artwork.

## Components

### Buttons

- **Shape:** square (`0` radius), `16px 28px` padding, `1rem` text.
- **Commit (primary):** Signal Orange ground with ink text. Carries a trailing
  arrow that translates `4px` on hover. One per band, never two.
- **Solid:** Graphite ground with bone text, hovering to Ink Raised. Used where
  the band is already light and orange is spoken for.
- **Outline on ink:** `white/25` border, white text, hovering to `white/50`
  border plus a `white/5` fill.
- **Outline on bone:** Bone Edge border, graphite text, hovering to an Ink
  border plus a Bone Shaded ground.

In code: `accent` is the commit button and `secondary` is the outline. `primary`
is the blue equivalent used for in-app actions (Add Customer, New Job Card),
where orange would over-signal on a screen full of controls. `danger`,
`success` and `ghost` complete the set. There were briefly `commit` and
`counter` aliases; they duplicated `accent` and `secondary` exactly and were
removed — two names for one style is how a system drifts.
- **Hover / Focus:** colour transitions at `200ms`; no lift, no scale, no
  shadow. Focus is the global Workshop Blue ring at `2px` with `2px` offset,
  switching to Signal Orange Lit inside an `.on-ink` band.

### Chips

- **Style:** square, `6px 12px`, label typography, uppercase.
- **State:** selected is Signal Orange on ink text; unselected is `white/10` on
  `white/60` text, hovering to `white/20` and full white. Selection is carried
  by ground colour, not by a border or a checkmark.

### Cards / Containers

There are no cards. Where a container is genuinely needed on ink, it is a
`white/5` fill inside a `white/15` one-pixel border with `1.25rem` of padding and
no radius. On bone there is no container at all — content is separated by rules.

### Inputs / Fields

- **Style:** square, a one-pixel Bone Edge border on a Bone ground, `12px 14px`
  of padding, `15px` text in Graphite. No shadow at rest, and no glow on focus —
  the border simply becomes Workshop Blue.
- **Error:** the border becomes Danger; the message sits below the field with a
  one-pixel Danger rule on its left.
- **Label:** `0.875rem` Outfit semibold in Graphite, `8px` above its field, with
  a real `htmlFor`. Helper copy goes below the field in Graphite Body.

In code this is simply `Input` / `Select` / `Textarea`. There was briefly a
`surface` prop selecting between a rounded product control and this one; the
app now has a single system, so it was removed.

Globally, the caret is Workshop Blue Deep, selection is Workshop Blue with white
text (Signal Orange with ink text inside `.on-ink`), and focus is the Workshop
Blue ring.

### Toasts, tooltips and other library surfaces

Three surfaces are painted by libraries through inline style objects, so the
theme's radius and shadow overrides **cannot reach them** and they have to be
brought onto the system by hand:

- **Toast** (`react-hot-toast`, configured once on the `<Toaster>` in
  `App.tsx`) — a square ink slab, `1px` `white/15` border, no shadow, white
  text at `15px`. Success and error keep their semantic icon colours with an
  ink-coloured glyph.
- **Chart tooltip** (`recharts`, `contentStyle` on each `<Tooltip>`) — the same
  ink slab, so a figure hovered on a chart reads like a toast.
- **Confirm dialog** (`useConfirm`) — a bone panel behind an `ink-900/70`
  scrim, with a square tinted icon tile.

All three read the palette through the CSS custom properties `@theme` emits on
`:root` (`var(--color-ink-900)`, `var(--color-success)`, `var(--font-sans)`)
rather than repeating hex values. **This is the exception to "no inline
styles"** — the library gives no other hook. When adding a new charting or
overlay library, expect to do the same and check it here first.

### Auth Shell (signature)

Sign in, register, forgot password and reset password all render inside one
`AuthLayout`: a `5fr / 7fr` split with the ink panel on the left carrying the
brand, the headline and three ruled capability rows, and the bone panel on the
right carrying the form in a `max-w-md` column (`max-w-lg` when the form has a
two-column field grid).

Two decisions in it are load-bearing. Below `lg` the ink panel is **dropped, not
stacked** — someone who has already decided to sign in does not need the pitch,
and stacking it would push the form below the fold on a phone. And the ink
panel's icons are `white/70`, not orange: the headline's one accent span is that
band's single point of emphasis, and a row of orange icons beside it would spend
the accent twice.

### Navigation

Sticky, `4rem` tall, on the Bone ground with a transparent border at rest that
becomes a Bone Rule with a `bg-bone-50/95` backdrop blur once the page scrolls
past `8px`. Links are `0.875rem` Outfit medium in Graphite Body, going Graphite
on hover. Below `lg` the links collapse into a sheet that pushes content rather
than overlaying it.

### Ruled Row (signature)

The system's replacement for the icon card. A one-pixel top rule, `1.75rem` of
vertical padding, a `1.25rem` Workshop Blue icon at `1.75` stroke pinned to the
left, and a title-plus-body stack beside it. The first row in a group drops its
rule and its top padding so the group opens flush with whatever precedes it.
Rows can be arranged in a multi-column grid and still read as one ruled list.

### Live Market Switcher (signature)

A row of country chips over a `white/5` panel that re-prints the same invoice
subtotal through the product's real `formatMoney`, in the selected market's
currency, number format and tax vocabulary. Figures are set in the `.tabular`
class so the digits do not shift between markets, and the total is Archivo at
`1.5rem` in Signal Orange Lit — the only place a figure carries the accent.
This is a demonstration, not a mock: it calls the same formatter the invoices
call, and it must stay that way.

## Do's and Don'ts

### Do:

- **Do** alternate ink and bone full-bleed bands as the page's structure, and let
  the ground change carry the section break.
- **Do** keep radius at `0`. It is enforced from `index.css`: the whole
  Tailwind radius scale resolves to `0px`, so `rounded-xl` and friends are
  already square wherever they appear. `rounded-full` is deliberately exempt
  for avatars, spinners, status dots and progress tracks.
- **Do** separate items with a one-pixel rule and generous space, never with a
  box.
- **Do** draw operable edges — inputs, selects, outlined buttons — with Bone
  Edge, and decorative dividers with Bone Rule.
- **Do** extend `Button` and `Input` with a variant or a `surface` when a new
  ground needs them, rather than writing a second control.
- **Do** spend Signal Orange on commitment only — an action, a total, or one
  emphasis per band.
- **Do** use Workshop Blue for every functional icon on a light ground, at
  `1.75` stroke, from `lucide-react`.
- **Do** set secondary text on ink as white at an alpha, at `white/55` or above.
- **Do** author display headline line breaks explicitly.
- **Do** theme the browser's own surfaces — selection, caret, focus ring,
  tabular figures — from the palette.
- **Do** keep motion to one authored moment per page, from an already-visible
  default, with a `prefers-reduced-motion` guard.

### Don't:

- **Don't** add a shadow to anything on a marketing surface. Change the ground.
- **Don't** build a grid of same-size icon-plus-heading-plus-text cards. That is
  the shape this system exists to replace; use ruled rows.
- **Don't** set a kicker, eyebrow or section number above a heading.
- **Don't** reach for `bg-white` or `bg-gray-50` as a ground. The app's
  grounds are `bone-50` (panels, header, sidebar-adjacent) and `bone-100`
  (the page field), and `ink-900` for the standing dark bands.
- **Don't** put grey text on an ink band.
- **Don't** apply gradients to text, or use a gradient as a ground.
- **Don't** animate every section into view. One entrance, on the first
  viewport, and nothing after it.
- **Don't** use a Unicode glyph or emoji where an icon belongs — a standing rule
  across all three GaragePulse repos.
- **Don't** put a second Signal Orange action in the same band, or pair an
  orange headline span with orange icons in one band.
- **Don't** border an input or an outlined button with Bone Rule. It is a
  divider token and it disappears against every bone ground.
- **Don't** assume a library surface inherits the system. Toasts, chart
  tooltips and any other inline-styled overlay are invisible to the theme
  tokens and must be styled explicitly — see **Toasts, tooltips and other
  library surfaces**.
