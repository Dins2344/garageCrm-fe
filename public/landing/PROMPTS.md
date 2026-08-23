# Landing page imagery — screenshots + generation prompts

Four screenshots in this folder are the **content**. The prompts below are the
**scene**. Feed one screenshot plus its prompt to your image generator; it should
composite the screenshot onto the device in the scene, unaltered.

Screenshots are real product UI captured at device resolution — nothing mocked
up, nothing invented. All figures, names and plates are demonstration data.

| File | What it shows | Pixels | For |
| --- | --- | --- | --- |
| `01-jobcard-detail-desktop.png` | Job card detail: status pipeline, vehicle/customer, mechanic assignment, timeline | 3200 × 2000 (16:10) | Image 1 |
| `02-estimate-approval-phone.png` | Public estimation approval: parts, labour, GST, grand total, Approve button | 1170 × 2532 (9:19.5) | Image 2 |
| `03b-jobcard-detail-phone.png` | Job card detail on a phone | 1170 × 2532 (9:19.5) | Image 3 |
| `03a-dashboard-phone.png` | Dashboard on a phone | 1170 × 2532 (9:19.5) | Image 3 (second phone) |

---

## Shared style direction — put this in every prompt

> Photographic, documentary, natural light. A real independent auto-repair
> workshop, mid-morning, roller shutter open. Working environment: a vehicle on
> a two-post lift, tool trolley, parts boxes on steel shelving, oil-marked
> concrete floor. Lived-in but not squalid — a shop that is busy and competent.
>
> People are South Asian and Middle Eastern working adults, 25–55, mixed
> genders, in plain dark navy or grey work overalls with no visible branding,
> logos or text. Real working hands: clean enough to hold a device, not manicured.
> Natural expressions — focused, mid-conversation, unposed. No stock-photo
> grinning, no thumbs-up, no arms folded in a line facing camera.
>
> Colour: desaturated industrial neutrals — concrete grey, steel, dark navy —
> with warm daylight from the shutter. No teal-and-orange grade, no lens flare,
> no bokeh light spots, no HDR halos, no motion blur.
>
> The screen content must be reproduced exactly as supplied, sharp, legible and
> correctly perspective-mapped onto the device. Do not redraw, restyle,
> recolour or invent UI. Do not add any logo, watermark or caption.
>
> No text anywhere in the image except what is inside the supplied screenshot.

---

## Image 1 — Owner and advisor at the service counter

**Output: 1600 × 1200 px, 4:3 landscape.**

Attach `01-jobcard-detail-desktop.png`.

> A garage owner in his forties and a female service advisor in her thirties
> stand together at a service counter at the front of the workshop, both looking
> at a 15-inch laptop open on the counter between them. The advisor is pointing
> at something on the screen; the owner is listening, one hand resting on the
> counter. A vehicle on a lift is visible behind them, softly out of focus.
>
> Camera slightly to one side and just above counter height, so the laptop
> screen is clearly readable at an angle. The screen fills roughly a quarter of
> the frame. Composite the supplied screenshot onto the laptop display exactly
> as provided.
>
> Leave the left third of the frame relatively uncluttered.

---

## Image 2 — Customer approving the estimate on their phone

**Output: 1200 × 1600 px, 3:4 portrait.**

Attach `02-estimate-approval-phone.png`.

> A vehicle owner — not a mechanic, wearing ordinary everyday clothes, a shirt
> or kurta rather than overalls — stands just inside the workshop entrance
> holding a phone in both hands, reading it. Their own car is behind them in the
> bay. Their expression is unhurried and satisfied: someone who has just been
> told the price and is deciding, not someone confused.
>
> Vertical composition. The phone is held at chest height, tilted slightly
> toward camera so the screen is fully legible and unobscured by fingers or
> glare. The phone occupies roughly a third of the frame height. Composite the
> supplied screenshot onto the phone display exactly as provided.
>
> A mechanic may be visible working in the background, small and out of focus.

---

## Image 3 — Technician on the floor with the job card

**Output: 1600 × 1200 px, 4:3 landscape.**

Attach `03b-jobcard-detail-phone.png` (and `03a-dashboard-phone.png` if your
tool supports a second device).

> A technician in navy overalls stands beside a car with its bonnet up, holding
> a phone in one hand and reading it, the other hand resting on the wing. This
> is the shop floor, not an office: a work light on the engine, a socket set open
> on the trolley beside them. They are checking what the job card says before
> touching anything.
>
> Camera at working height, slightly behind the technician's shoulder so both
> the phone screen and the engine bay are in frame. The screen is sharp and
> fully legible. Composite the supplied screenshot onto the phone display
> exactly as provided.
>
> Hands may be lightly work-marked but not heavily greasy — the person is using
> a phone.

---

## Notes

- If the generator garbles the UI, generate the scene with a **blank dark
  device screen** first, then composite the screenshot in afterwards
  (Photoshop, Figma, or a second pass). That path is far more reliable than
  asking a model to reproduce fine UI text.
- Every prompt says "no text in the image" on purpose: generated signage and
  overalls branding come out as garbled pseudo-text and instantly reads as AI.
- Keep the same lighting, palette and wardrobe direction across all three so the
  page reads as one shoot rather than three stock photos.
- These slots sit on a warm bone `#f2eee6` background. Images with cool blue-grey
  or pure-white backgrounds will look pasted on; warm neutral tones sit better.
