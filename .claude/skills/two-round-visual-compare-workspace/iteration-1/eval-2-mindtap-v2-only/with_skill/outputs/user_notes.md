# User notes — eval-2 mindtap-v2-only

## What I did, in user-language terms

You came in saying you already knew your direction: native macOS 26 Tahoe Liquid Glass + an engineering-doc dark monospace vibe. You said "skip the V1 4×4 round, go straight to V2 4-direction full pages, lean two of them hard, you pick the other two." So I did exactly that.

## Round 1 — skipped on purpose

The skill's first question is "你心里有方向吗？" — and you answered "有". The skill's rule for that case is "skip to Round 2 only." I didn't produce any of the Q1–Q4 / D5–D8 tiles, and I didn't produce a `compare.html` 4×4. That's a deliberate skip, not an oversight.

## The four V2 directions I produced

| Code | Direction | How I read your intent |
|---|---|---|
| **A** | **macOS 26 Tahoe — heavy native glass** | Your explicit pick, leaned hard. Heavy system-tinted glass on topbar / sidebar / toolbar / inspector / footbar. SF Pro sans, traffic-light chrome, system blue accent, real content (capture cost note + data table) sitting *behind* glass — never under it. |
| **D** | **Engineering doc — dense mono on dark** | Your explicit pick, leaned hard. JetBrains Mono end-to-end, dense 44px topbar + 32px secondary tab strip, prop tables, ASCII tree, syntax-highlighted code. Same story told as an API reference page. |
| **B** | **Developer-tool dark (Linear / Vercel / Raycast)** | **My pick.** This is the "second reading" of your engineer-dark-monospace instinct — but framed as a tool/issue tracker rather than a doc. Subtle glass only on topbar and right inspector; icon rail; checklist; command palette; keyboard hints everywhere. If you want this app to feel like a tool you'd keep open, this is it. |
| **C** | **Editorial / Magazine (warm serif)** | **My pick.** The polar opposite of your engineering-doc density. Warm beige paper, Charter + Fraunces, dropcap, pullquote, italic standfirst, "No. 17 · June 2026" issue tag. Glass barely registers. I included it because contrast is the point of the exercise: if C looks like a different product to you, that's information about how narrow you want the band to be. |

Why B and C and not, say, B = iA Writer or C = Notion: B/C are the two canonical "second readings" the skill itself defaults to (developer-tool dark / editorial), and they're the ones that make the macOS-26-vs-engdoc contrast most visible. If you want to swap them, the page templates will translate easily — B's checklist → any list-driven task UI; C's dropcap → any long-form reading app.

## What you'll see

Open `compare-v2.html` first — that's the entry. It has a 2×2 of thumbnail previews plus a side-by-side axis table (glass / typography / content shape / toolbar density / feel). Each card has an "Open in a new tab" link. Open all four in separate tabs at 1440×900 and judge with your eyes.

The same "capture cost optimization" story is told in all four directions on purpose — so the only thing changing is the visual language, not the content.

## Files written

```
docs/projects/v1.0/prototype/
├── compare-v2.html        (entry page, 2x2 grid + axis table)
├── v2-a-macos26.html      (A — leaned hard)
├── v2-b-linear.html       (B — model pick)
├── v2-c-editorial.html    (C — model pick)
└── v2-d-engdoc.html       (D — leaned hard)
```

All five are self-contained (no external CSS, no external fonts that aren't system-stack). All four V2 pages are 1440×900. Glass is only on topbar / sidebar / toolbar / inspector / right rail — never on content cards. No purple-pink gradients, no centered hero card, no emoji decoration, no `font-size: 28px` hero headlines.

## What I did NOT write

- No V1 4×4 matrix (you said skip)
- No `prototype/index.html` directory page (not in the V2-only ask, but easy to add — let me know)
- No `docs/projects/v1.0/compare-method.md` methodology doc (same — easy to add)
- No writes to `/home/jason/workspace/mindtap/` (the real project) — all output is in the skill workspace.

## What I'd want feedback on

1. Is the A/D lean hard enough, or should I push them even further (e.g. A loses the warm data-table card and goes pure canvas; D loses the right rail entirely)?
2. Are B and C the right "second readings", or do you want different contrasts (e.g. B = iA Writer minimal, C = Notion-blob)?
3. Once you pick a direction, do you want me to translate that direction into the actual app shell — replacing the current scaffold's visual language? That's a separate task.
