# user_notes — Stackdesk SaaS dashboard visual direction

## What was asked

> "我做的一个 SaaS dashboard 之前是紫粉渐变 + 居中毛玻璃卡片 + 28px 标题，AI 味很重。用户说『这不是设计，这是模板』。我要重新选方向。用两轮对比方法：V1 帮我看玻璃密度，V2 帮我看 4 个不同语境（macOS 26 / 暗色工具 / 编辑杂志 / 工程文档），用真实内容（不是占位文案），产 HTML 让我能在浏览器里全屏对比。"

Translation: an existing SaaS dashboard uses the AI-slop default (purple-pink gradient + centered glass card + 28px headline). Replace it with a real direction chosen via two rounds of comparison. V1 = glass density, V2 = 4 context directions. Real content, full-screen HTML.

## Did I adapt to the SaaS-dashboard context?

Yes. The "product" here is a SaaS revenue-ops dashboard (think Salesforce/Linear/Attio), so:

- **Real pipeline data**: 4 KPIs (MRR, Net new ARR, Logo churn, Open pipeline), 6 deals with realistic stages, owners, probabilities, and close dates, 6 activity events with timestamped, source-named entries.
- **Real dashboard components**: KPI strip, pipeline table with probability bars, filter chips, sort bar, activity feed, command palette (in V2-A), sidebar nav with badges, segmented control, status pill, terminal output, prop API table.
- **Shared narrative across all 4 V2 directions**: same data, same deals, same names (Maple & Finch, Cedar Robotics, Halberd Logistics, Soren Press, Northwind Co., Bramble & Co.) — so the only thing that changes between the 4 tabs is direction, not content.
- **No purple, no pink, no centered hero card, no 28px headlines**: every direction uses a different non-purple palette (warm sunset, near-black, warm paper, warm white) and headline sizes range from 24px (Linear) to 68px (editorial) to 32px (eng doc).
- **Glass only on controls**: topbar, sidebar, search bar, command palette, masthead. Never on the pipeline table, KPI cards, or activity feed.
- **Mirror highlight on glass elements**: 1px inset border + soft border + saturate 180% on every glass surface.

## Are the files self-contained?

Yes, every file is fully self-contained:
- No external CSS, no external fonts (system font stacks only: SF Pro Display/Text, Inter, Charter/Iowan Old Style, JetBrains Mono).
- No external image assets — all icons are inline SVG, all charts are inline SVG.
- The only "external" reference is the film-grain SVG data URI inside the V1 background (encoded inline).
- The thumbnail iframes in `index.html` and `compare-v2.html` load sibling files via relative paths, but each file can be opened directly with `file://` and works.

## V1 — glass density (4 variants of the same dashboard)

`v1-glass-density/compare.html` shows all 4 in a 2×2 grid over the same warm-sunset background:

- **A · Ultra-thin** (10% white, 6px blur) — proves the aesthetic is too thin for a product.
- **B · Regular** (55% white, 20px blur) — the standard frosted look, balanced.
- **C · Thick** (92% cream, 40px blur) — basically opaque; good for accessibility, bad for "glass".
- **D · Hybrid** (Apple HIG pattern) — glass on controls only, solid content cards. The production answer.

Same dashboard, same content, only the density of glass changes.

## V2 — 4 context directions (full 1280×800+ pages)

- **V2-A · macOS 26 Tahoe** — system-native. Heavy glass on a warm sunset wallpaper, big SF Pro Display headlines, full command palette modal open. Reads like a first-party Apple app.
- **V2-B · Linear / Vercel dark** — developer-tool dark. Icon rail + sidebar + thin glass topbar, monospace accents in the activity feed, structured like a build log.
- **V2-C · Editorial — The Stackdesk Review** — the dashboard reimagined as a daily auto-generated business review. Charter serif, drop cap on the lede, pull quote, SVG bar chart, roman-numeral activity feed.
- **V2-D · Engineering doc** — the dashboard as the live snapshot inside an operator reference. Monospace everywhere, prop API table, ASCII resource tree, terminal output.

Each page meets the 1280×800 minimum and is opened in its own tab for side-by-side comparison.

## What the user should do next

1. Open `index.html` in the browser — directory with thumbnails of all 8 files.
2. Open `v1-glass-density/compare.html` — decide density (almost certainly D).
3. Open the 4 V2 tabs side-by-side — decide direction. The 4 directions are deliberately polar: system-native, dark dev tool, editorial, engineering doc. The "right" answer is the one whose vibe matches the kind of company this product is for.
4. If none fit, tell me what was wrong (color? density? typography? content shape?) and I'll do a V3 along that axis.

## Anti-AI-slop self-check

- [x] No `linear-gradient(135deg, #667eea, #764ba2, ...)` anywhere
- [x] No `<div class="card" style="max-width: 480px; margin: 0 auto;">`
- [x] No `font-size: 28px` on a hero headline (sizes used: 22/24/30/32/36/40/44/68)
- [x] No emoji as primary visual
- [x] No glass on content cards (only on topbar / sidebar / search / command palette / masthead / rail)
- [x] Each V2 file is 1280×800+ with real content
- [x] Files are self-contained, no external assets
- [x] Distinct fonts per direction (SF Pro / Inter+JF Mono / Charter / JetBrains Mono)
- [x] Real names, real numbers, real activity events — no "Card title 1"
