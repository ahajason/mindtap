---
name: two-round-visual-compare
description: Use this skill when the user wants to decide a product's visual direction, see competing design languages side-by-side, or pick between "vibes" (e.g. "macOS vs Linear", "dark engineering vs warm editorial", "neumorphism vs glass", "playful vs serious"). Triggers on phrases like "决策视觉方向", "对比一下设计风格", "我想看不同风格的对比", "选个视觉语言", "哪个方向适合我", "which direction fits", "compare design directions", "show me the options", "我想要几个不同的风格对比", "帮我看几个方向". Produces N (≥4) independent HTML prototypes in a specific scenario — each with **complete real context** (real words, real data, real tasks for the user's product), each at 1280×800 full scale, viewable in a Vite/static server browser side-by-side. Structure is flexible: an optional small-scale matrix for fast judgment, then the N full-scale direction pages, plus a directory entry page and a methodology doc. The N count, the matrix axes, and the direction themes are all templates — adapt to the user's scenario. Do NOT use for picking colors/fonts within an already-decided direction, or for visual polish of a single screen.
---

# Two-Round Visual Comparison

A repeatable methodology for choosing a product's visual direction by **building, not arguing**. Two rounds of independent HTML files that the user can open side-by-side in a browser and judge with their eyes.

The methodology is grounded in the insight that **"AI slop" aesthetic** (purple gradient + centered glass card + emoji + 28px default font) is what happens when you can't show real options. Real decisions need real artifacts, side-by-side, at full scale, with real content underneath the glass.

## Required reading before starting

The skill depends on Apple HIG materials for the **correct definition of Liquid Glass** (if the user's design language is glass). Check whether the project has Apple HIG materials locally and read them before producing any page — if you skip this step you will produce AI-slop glass:

- Look for `docs/M-1-material/apple/`, `docs/design/hig/`, or any local Apple HIG collection
- If present, read: liquid-glass overview, materials, sidebar, toolbar, color, full reference app
- If absent, fall back to: developer.apple.com/design/human-interface-guidelines/materials and /adopting-liquid-glass

The single most important fact: **glass is for controls/navigation only, never for content.** Glass floats ON real content. Real content sits behind glass. This is non-negotiable regardless of whether HIG materials are present.

---

## Step 1 — Ask one question, then commit

Ask the user exactly one question before producing anything:

> "你心里有方向吗？还是完全没想法？"

- **有方向** ("我想做 macOS 26 那种 / Linear 那种 / 编辑杂志感那种") → skip to Round 2 only.
- **没方向** ("不知道 / 你给方案 / 都行") → do Round 1 first, then Round 2.

Do not ask follow-up questions about colors/fonts/tonal adjectives before Round 1. The point of Round 1 is precisely to surface those decisions. Asking ahead of time is the AI-slop way of working.

---

## Step 2 — Round 1 (only if no direction): small-scale variant matrix

**Goal**: decide the *density / character* of the visual treatment. This round is cheap — small tiles, fast to produce, fast to judge. Skip if user already has a direction.

The **default axes** are:
- **Horizontal**: how heavy/dense the glass/material is (light → heavy)
- **Vertical**: how strict/structured vs how creative/expressive the typography and layout is

But the axes are a template. If the user is choosing between "neumorphism vs glass vs flat material", swap the horizontal axis. If they're choosing between "monochrome vs warm vs cool", swap the vertical. The number of variants is also a template — 4 (2×2) is the minimum, 9 (3×3) is fine, 16 (4×4) is the max a human can scan at once.

Produce the variant HTML files plus one overview page `compare.html` that arranges them in a grid:

```
prototype/
├── compare.html          (matrix + links to all tiles)
├── <axis-h-low>-<axis-v-low>.html
├── <axis-h-low>-<axis-v-high>.html
├── <axis-h-high>-<axis-v-low>.html
├── <axis-h-high>-<axis-v-high>.html
└── ...                   (more if you went 3×3 or 4×4)
```

### File rules
- 480×360 minimum (this is the only time small is OK — these are matrix tiles, not full pages)
- Each tile shows the visual treatment over real content from the user's product domain
- No purple/pink gradients. Real surface colors (white, beige, dark, system-blue)
- The matrix in `compare.html` links to all tiles, with a label on each

---

## Step 3 — Round 2 (always): N full-scale direction pages

**Goal**: decide the *context* — what kind of product this is. Real size, real content, real materials.

**N = 4 minimum, configurable up**. Default 4 because that's the largest set most humans can compare side-by-side without losing the differences. If the user says "give me 6" or "give me 8 distinct directions", do that. The only constraint is **N ≥ 4** so the user has actual choices.

Produce **N independent full-page HTML files** plus one overview page. Each is **1280×800 minimum**, opens in its own browser tab, scrolled or in landscape.

### The 4 default directions (adapt or expand freely)

These four are a *default starting set* covering the design-language quadrants most products fall into. **If the user already named directions in their request, use those instead** — the skill is the *method*, not the *specific 4*.

| Code | Direction | When to use | Material | Body type | Content shape |
|---|---|---|---|---|---|
| **A** | **System-native** (macOS 26 Tahoe / iOS 26 / Material You) | Consumer apps, "polished OS feel" | Heavy glass on system colors, big typography, bold accent | Sans | Color blocks + real data + sidebar |
| **B** | **Developer-tool dark** (Linear / Vercel / Raycast) | Power tools, IDEs, dashboards | Subtle glass on near-black, dense info, keyboard hints | Sans | Task flow + command palette + status |
| **C** | **Editorial / Magazine** (warm + serif) | Reading apps, blogs, journals | Delicate glass on warm beige, big serif headlines | Serif | Article body + dropcap + pullquote |
| **D** | **Engineering doc** (functional + mono) | API docs, design systems, technical references | Sparse glass on warm white, code blocks, ASCII tree | Mono | API reference + component list + prop table |

User-supplied direction examples that should override the defaults:
- "I want neumorphism vs glass vs flat" → 3 different material axes
- "Playful vs serious" → 2 directions × 2 character treatments
- "Apple HIG only" → expand A into A1/A2/A3 with different glass treatments
- "Give me 6 options" → use the 4 defaults + 2 more along the most uncertain axis
- "Pick one for me" → use the 4 defaults

### File rules (the hard ones)

- **1280×800 minimum**, full-bleed — no max-width: 480px mockups
- **Real content behind glass**: real words, real numbers, real tasks from the user's product domain. Not "Lorem ipsum", not "Card title 1 / Card title 2"
- **No purple/pink gradients**, no centered hero, no emoji-as-decoration
- **Glass only on controls**: top bar, side bar, toolbar, FAB, menu. Never on content cards.
- **Mirror highlight**: 1px inset border + top highlight + bottom shadow on every glass element
- **Distinct fonts per direction**: A→SF/system, B→SF Mono, C→Charter/Georgia, D→JetBrains Mono. Don't reuse the same font.
- **Each file is self-contained**: no shared CSS, no external assets. Open with `file://`, `python -m http.server`, or `vite preview` and it works.

### Outputs for Round 2
```
prototype/
├── compare-v2.html     (overview, links to N)
├── v2-a-<direction>.html
├── v2-b-<direction>.html
├── v2-c-<direction>.html
├── v2-d-<direction>.html
└── ...                 (up to user-specified N)
```

---

## Step 4 — Directory page (entry point) and viewing

`prototype/index.html` ties everything together:
- Topbar with breadcrumb back to docs
- Section A: link to `compare.html` (Round 1, with thumbnail grid for the matrix)
- Section B: link to `compare-v2.html` (Round 2, with 2×2 / N×N thumbnail grid for the directions)
- Footer with links to PRD / INDEX / spec

The directory is the **only** page the user needs to remember. From there: directory → comparison page → individual direction.

### Viewing the prototypes

The whole point of producing HTML is that the user can actually **look at the differences**. Make sure viewing is one click away. Pick whichever fits the project:

| Server | When to use | Command |
|---|---|---|
| **`python -m http.server`** | Standalone prototype folder, no JS framework | `cd prototype && python -m http.server 8000` |
| **`vite` (dev or preview)** | Project already has a Vite setup (React/Vue/TS) | `npx vite` or add a route in the existing `vite.config.ts` |
| **Static deploy** | Sharing with remote users | `npx vercel deploy` or any static host |
| **`file://`** | Quick local preview when the HTML is fully self-contained | Open `prototype/index.html` directly in the browser |

**Tell the user the access URL** when you finish. Don't leave them guessing. Typical pattern:
- Vite project: `http://localhost:5173/prototype/`
- Python server: `http://localhost:8000/`
- WSL2 / remote: `http://<wsl-ip>:<port>/prototype/`

The key constraint: **the entry page must open with no build step** (the HTML is hand-written, no JSX). Vite will serve it as-is; Python/file:// will serve it as-is.

---

## Step 5 — docs sedimentation (so the method survives)

Append or create a `compare-method.md` (or `DESIGN_DECISIONS.md` / `visual-method.md` — whatever fits the project) with:

1. **Hard rules for next time** — the anti-AI-slop constraints, restated (no purple gradients, real content, no centered cards, etc.)
2. **The visual-language proper definition** — for glass: glass for controls only, floating on real content. For neumorphism: shadow direction, depth range, light source. Whatever material the user picked, document what "correct" means.
3. **Process flow diagram** — brainstorm → small variants → user picks axes → full-scale 4 directions → user picks direction → update method doc
4. **Asset inventory** — what files exist, where, and the jump relationship
5. **Round 1 vs Round 2 — when to use which** — in a table
6. **Anti-pattern CSS** — a `/* ❌ slop */` block vs `/* ✅ correct */` block, both real CSS, side-by-side

This is what makes the skill **cumulative**: next time someone needs to make this decision, they read the doc first.

---

## Decision rules

After Round 1 (if done): user picks one quadrant (or 2×2 cell) and optionally one edge-of-matrix variant.

After Round 2: user picks one of the N directions as the *direction*. The direction is not a final design — it's the answer to "what kind of product is this?"

If the user says "none of them" after Round 2: ask what was wrong (color? density? typography? content shape?). Their answer is the new axis for the next round — produce Round 3 with N variants along that axis.

---

## Quality bar (self-check before handing off)

Before telling the user "done", run this checklist:

- [ ] No `linear-gradient(135deg, #667eea, #764ba2, ...)` anywhere in any file
- [ ] No `<div class="card" style="max-width: 480px; margin: 0 auto;">` (centered-card AI slop)
- [ ] No `font-size: 28px` on a hero headline (real products use 36-72px)
- [ ] No emoji as primary visual (`🎨 ✨ 🚀` in headlines, etc.)
- [ ] No glass on a content card (glass only on top bar, side bar, toolbar, FAB, menu)
- [ ] Each Round 2 file is 1280×800+ with real content visible
- [ ] `docs/.../compare-method.md` exists and links to the new assets
- [ ] `prototype/index.html` exists and links to all comparisons

If any of these fails, fix it. The whole point of the skill is to produce non-AI-slop output.

---

## Output locations

Pick a path that fits the project. The skill does not require a specific path — it requires **self-contained HTML, organized by round, with a clear entry point and a methodology doc**.

Common patterns:
- Mindtap-style: `docs/projects/v1.0/prototype/` + `docs/projects/v1.0/compare-method.md`
- Standalone: `./prototype/` (project root) + `./DESIGN_DECISIONS.md`
- Per-feature: `docs/design/v1/` + `docs/design/method.md`

The pattern matters less than: **(a) one entry page**, **(b) each HTML self-contained and openable with file://**, **(c) the methodology doc reachable from the entry page**.

| Asset | Required? |
|---|---|
| Round 1 matrix + tiles (8 HTML) | Only if user has no direction |
| Round 2 overview + 4 directions | Always |
| Directory / entry page | Always (link to both rounds + methodology) |
| Methodology doc | Always (so the next person can repeat this) |
