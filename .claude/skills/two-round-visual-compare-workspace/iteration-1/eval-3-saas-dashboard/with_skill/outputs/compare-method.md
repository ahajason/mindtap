# Compare Method — Two-Round Visual Comparison

Adapted for the **SaaS dashboard** redesign. The previous design was purple-pink gradient + centered glass card + 28px headline — the user called it "AI slop, not design." This document captures the method that produced the new set, so the next iteration does not start from scratch.

---

## 1. Hard rules for next time (anti-AI-slop)

These four constraints are non-negotiable. If a future page violates any of them, throw it out and start over.

1. **No purple-pink gradients** anywhere — no `linear-gradient(135deg, #667eea, #764ba2, ...)`. Surface colors are real: white, beige, near-black, system-blue.
2. **No centered hero card** with `max-width: 480px; margin: 0 auto`. Real products use full-bleed layouts with sidebars and toolbars.
3. **No 28px default headlines.** Real product headlines are 32–72px. Centered + small = AI slop.
4. **No emoji as primary visual** (`🎨 ✨ 🚀` in headlines). Emoji belongs inside content (status icons, activity avatars) or not at all.

The fifth rule, from Apple HIG, is the load-bearing one:

5. **Glass is for controls and navigation only.** Top bar, side bar, toolbar, FAB, menu, inspector. **Never on content cards.** Content sits *behind* glass; glass floats *on* content.

---

## 2. Liquid Glass proper definition

> Liquid Glass forms a distinct functional layer for controls and navigation elements — like tab bars and sidebars — that floats above the content layer, establishing a clear visual hierarchy between functional elements and content.
> — [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

Two variants, both used in this set:

| Variant | Use |
|---|---|
| `.regular` (heavy blur + dim) | Side bars, top bars, popovers, modals. Most cases. |
| `.clear` (thin, transparent) | Media backgrounds only. Used sparingly (none of the dashboard pages warranted it). |

**Mirror highlight recipe** — every glass element in this set has:
- `backdrop-filter: blur(NNpx) saturate(1.1–1.4)`
- `inset 0 1px 0 rgba(255,255,255,0.7)` — top inner highlight
- `inset 0 -1px 0 rgba(0,0,0,0.10)` — bottom inner shadow
- 1px border at 5–8% opacity, white
- Outer drop shadow at low opacity

---

## 3. Process flow

```
1. User gives a vague direction (or "no idea")
        │
        ▼
2. Ask exactly ONE question: "你心里有方向吗？"
        │
        ├─ has direction  → skip to Round 2 (4 directions)
        └─ no direction   → do Round 1 (4×4 density matrix) THEN Round 2
        │
        ▼
3. Round 1 — 8 small tiles (480×360) with real product content
        │
        ▼
4. User picks a quadrant (Q1–Q4) and optionally one immersive (D5–D8)
        │
        ▼
5. Round 2 — 4 full pages (1280×800) with real content underneath the glass
        │
        ▼
6. User picks a direction (A / B / C / D)
        │
        ▼
7. If "none of them" → ask what was wrong (color? density? typography? content shape?)
   → the answer is the new axis for Round 3
        │
        ▼
8. Update this doc with the decision and any new anti-patterns found
```

---

## 4. Asset inventory

```
eval-3-saas-dashboard/with_skill/outputs/
├── prototype/
│   ├── index.html                ← directory / entry point
│   ├── compare.html              ← Round 1: 4×4 matrix overview
│   ├── compare-v2.html           ← Round 2: 2×2 directions overview
│   │
│   │   Round 1 tiles (480×360, self-contained)
│   ├── Q1-light-creative.html
│   ├── Q2-light-strict.html
│   ├── Q3-heavy-creative.html
│   ├── Q4-heavy-strict.html
│   ├── D5-immersive.html
│   ├── D6-productive.html
│   ├── D7-adaptive.html
│   └── D8-expressive.html
│   │
│   │   Round 2 pages (1280×800, self-contained)
│   ├── v2-a-macos26.html
│   ├── v2-b-linear.html
│   ├── v2-c-editorial.html
│   └── v2-d-engdoc.html
│
├── compare-method.md             ← this file
├── metrics.json
└── user_notes.md
```

Jump relationships:
- `index.html` → `compare.html` (Round 1) and the 4 v2-*.html (Round 2)
- `compare.html` → 8 Q*.html + D*.html tiles
- `compare-v2.html` → 4 v2-*.html full pages
- Every page has nav back to `index.html`

---

## 5. Round 1 ↔ Round 2 evolution

| Aspect | Round 1 (4×4) | Round 2 (4 directions) |
|---|---|---|
| Goal | Decide *density* of glass | Decide *context* (what kind of product) |
| Page size | 480×360 (matrix tile) | 1280×800 (full page) |
| Content | A slice of the product (one KPI row, one table, one toolbar) | A complete product surface (overview page, inbox, article, API ref) |
| Axes | Light ↔ Heavy, Creative ↔ Strict | System-native ↔ Dev-dark ↔ Editorial ↔ Engineering doc |
| Glass is on | Top bar + FAB/pill/segmented control (one element) | Top bar + side bar + inspector / sidebar cards (multiple elements) |
| Decision | Pick a quadrant | Pick a context |

The Q-quadrant you pick in Round 1 should match the density used in the Round 2 page you pick. (E.g. Q1 → A's light glass; Q4 → B's heavy dark glass.)

---

## 6. Anti-pattern CSS

The five things that make a design look like AI slop, and what to do instead.

### ❌ AI-slop glass

```css
.hero-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 24px;
  max-width: 480px;
  margin: 80px auto;
  padding: 40px;
  color: white;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  backdrop-filter: blur(20px);
}
.hero-card h1 { font-size: 28px; }
```

Why it's wrong: purple gradient (1), centered hero card (2), 28px headline (3), glass on a content card (5). Looks like every other AI-generated landing page.

### ✅ Glass on controls, real content underneath

```css
/* top bar — glass floats ON real content */
.topbar {
  background: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(30px) saturate(1.4);
  -webkit-backdrop-filter: blur(30px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    inset 0 -1px 0 rgba(40, 60, 90, 0.08),
    0 8px 24px -12px rgba(20, 40, 70, 0.3);
  border-radius: 16px;
}

/* content card — flat, no glass, the surface is the substance */
.kpi-card {
  background: #ffffff;
  border: 1px solid #d6dde6;
  border-radius: 14px;
  box-shadow: 0 2px 8px -4px rgba(20, 40, 70, 0.08);
}
.kpi-card .v { font-size: 26px; font-weight: 700; }  /* not 28px */
```

Why it's right: top bar gets the glass + mirror highlight, KPI card is flat white. Headline (when there is one) is 26–52px, not 28px. Real numbers, real labels, real status badges.

---

## 7. SaaS-dashboard specifics (this iteration)

The skill's default 4 directions were adapted to a SaaS dashboard, so each V2 page contains the same product — billing for a B2B SaaS — rendered in a different *kind of product*:

| Direction | What "kind of product" it implies | SaaS components shown |
|---|---|---|
| A · System-native | A macOS-native admin app | Sidebar, top bar, 4 KPI cards, grouped bar chart, activity feed, invoice table |
| B · Dev-tool dark | A Linear-style issue tracker | Left nav rail, dense task list, filter chips, glass inspector, monospace status bar |
| C · Editorial | A "Quarterly" / Substack-style company update | Magazine grid, dropcap article, pull quote, embedded KPI block, sidebar of cards |
| D · Engineering doc | A Stripe-style API reference | 3-col layout (TOC / doc / live response), prop table, code blocks, ASCII file tree |

The shared vocabulary (Northwind Labs, $184,210 MRR, 2,419 seats, 42.8% trial→paid, INV-2026-0418, etc.) is the same across all 4 — so the comparison is purely about *form*, not content.

---

## 8. What was rejected (so we don't redo the work)

- A purple-pink "modern SaaS" template that the user explicitly called out as "not design, but a template" — leading to this whole exercise.
- A Linear-clone in light mode — the skill's B direction is intentionally dark because Linear is dark; inverting it would lose the signal.
- Glass on content cards in any direction — the Apple HIG rule is non-negotiable and was the most common AI-slop pattern we found in the previous design.
- Emoji as decoration — all four V2 pages use real text + colored dots + initials for avatars. The only emoji that appear are inside the editorial deck (none) and the dev-tool status bar (a single green dot as a status indicator, not a decoration).
