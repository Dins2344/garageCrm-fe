# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the garage owner.** Runs an independent auto-repair workshop, often
across more than one branch. Not a software buyer by temperament — evaluates on
a phone between jobs, in a noisy workshop, with limited patience for a demo
call. Cares whether the day's work is accounted for and whether money owed has
been collected.

**Daily operators inside the garage**, each with a distinct role in the app:

- **Service advisor** — books the vehicle in, records complaints, builds the
  estimate, chases customer approval.
- **Mechanic / technician** — works the assigned job card, updates status. Uses
  the mobile app, on the floor, hands dirty.
- **Receptionist** — customer and vehicle records, front-desk lookups.
- **Admin** — staff, settings, branch configuration.

A **customer of the garage** is a non-user participant: they receive an
estimation link by email and approve or decline it on a public page without
signing in, and they receive service-reminder emails and SMS.

## Product Purpose

GaragePulse turns the paper-and-WhatsApp workflow of an independent auto
workshop into one system: vehicle intake, job card, estimation, customer
approval, invoice, inventory deduction, and the service reminder that brings
the vehicle back.

Success is a garage that can answer, without hunting: what is on the floor
right now, what is waiting on a customer, what is ready for pickup, and what
has not been paid.

## Positioning

**One owner, several branches, potentially different countries — one login.**

- Every record is scoped to a garage; branches are genuinely isolated, and an
  owner switches between them without signing out.
- Currency, tax label, tax-ID label, date format, postal-code label and phone
  format all resolve from each garage's country at runtime, not from a global
  setting. A UK branch prints VAT and GBP while an Indian branch prints GST and
  INR, from the same deployment.

This is the claim a single-country competitor cannot truthfully copy.

## Operating Context

- The workshop floor is the real usage scene: phone in hand, interruptions,
  poor light, a vehicle in front of the user.
- The owner is frequently not on site and checks in on a phone.
- Outbound artifacts leave the system and are read by people who never log in:
  invoice and estimation PDFs, estimation-approval emails with a tokenised
  public link, and SMS/email service reminders.
- Reminders are sent at 09:00 in each garage's own local time.

## Capabilities and Constraints

**Confirmed capabilities:** job cards with status lifecycle and audit trail;
estimations with parts and labour, customer approval by link; invoices with
payment tracking and PDF export; inventory with stock deduction and low-stock
alerts; customers and vehicles with service history; staff with role-based
access; multi-branch management; service reminders by email and SMS;
dashboards.

**Constraints that must be preserved:**

- Multi-tenant. Every query is garage-scoped; leaking across garages is the
  defining failure.
- Three separately deployed applications — API, this web app, and a published
  Android app (`com.dctechs.garagepulse`). They share an API contract only.
- Published mobile builds cannot be force-upgraded, so API changes stay
  additive.
- 13 supported countries with per-country currency, tax and formatting.

**Explicitly undecided:** paid subscription tiers and payment processing are
designed for but not built. There is a free plan with real enforced limits
(branches per owner, job cards per day, invoices per day, staff per garage).

## Brand Commitments

- Name: **GaragePulse**. Logo asset at `public/mainIcon.png`.
- Google Play badge asset at `public/playstore.png`; the listing is live at
  `com.dctechs.garagepulse`.
- Existing product UI uses `#3b5ff8` as its primary colour across all three
  apps. This is a product-side commitment; the marketing surface is not
  obliged to inherit it.
- **No emoji anywhere** — a standing project rule, enforced across all three
  repos. Icons only.
- **Marketing surfaces follow category convention, executed at full craft.**
  Asked to choose a visual world for the landing page, the user twice re-rolled
  the dealt directions and then pinned the reference explicitly: build to the
  structure of `garagebox.io`. Differentiation comes from GaragePulse's own
  colour, type, density and composition — not from a borrowed or themed visual
  world. Treat `garagebox.io` as the craft bar to meet and the arrangement to
  follow, never as a page to clone.

## Evidence on Hand

**Real:** the shipped product itself, the live Play Store listing, and the
functioning public estimation-approval flow.

**Not real — must not be fabricated or reinstated.** The outgoing landing page
carried "500+ Garages Onboarded", "1.2M Job Cards Created", "99.9% Uptime SLA",
"4.9 rating across 500+ garages" and named testimonials. The user has confirmed
none of these are real. The redesigned page carries **no** customer counts,
ratings, review-site badges, testimonials or uptime claims. Future work must
not reintroduce them without the user supplying real figures.

**Pricing is not public.** No price appears on the marketing site; pricing
conversations route to a demo request. A single rupee price would in any case
be wrong for non-Indian garages.

**Imagery:** no product photography or customer imagery exists. Screenshots of
the real UI are obtainable from the running app; the user will supply any
photography separately.

## Product Principles

1. **Show the product, not adjectives.** With no customer proof available, the
   only honest persuasion is demonstrating the actual workflow.
2. **The workshop floor is the design constraint.** If it does not survive a
   phone in a noisy garage, it does not work.
3. **Never claim what is not measured.** Absent evidence is stated or omitted,
   never invented.
4. **One system, many branches, many countries** — the argument the page has to
   land.
5. **Additive over clever.** Old clients keep working; nothing is removed out
   from under a user.

## Accessibility & Inclusion

No formal standard has been established. Product-side needs that carry over:
readable in poor workshop light, usable one-handed on a phone, and never
dependent on colour alone to convey status.
