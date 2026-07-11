# User Notes — eval-1-mindtap-full · without_skill

## Task summary
User asked for a 2-round visual comparison for mindtap (Tauri + React scaffold, just finished). Wants Liquid Glass (Apple HIG). Asked for HTML in `docs/projects/v1.0/prototype/`, plus a directory page and a methodology doc.

## Approach without skill

1. Read `docs/material/apple/liquid-glass/` to ground the design language (overview, adopting, HIG materials, applying to custom views, Landmarks toolbar/background-extension). Key takeaways: Liquid Glass only on controls/nav (not content), `.regular` for most cases + `.clear` only on rich backgrounds, GlassEffectContainer pattern for grouping.
2. Designed a 2-axis matrix (light↔heavy density, creative↔strict editing form) — kept it simple: 4 quadrants = 4 directions.
3. Round 1 = 4 quadrant "signature" pages + 1 matrix overview. Real content per page (note cards / table / inspector), but at a glance-able density.
4. Round 2 = 4 fully-realized direction pages with real walkthrough: D5 immersive, D6 productive, D7 adaptive, D8 expressive. Same 4-note sample across all 4 so the comparison is honest.
5. INDEX.html as directory page; compare-method.md captures the methodology (why two rounds, axes, glass-only-on-controls rule, judgment rubric, mapping table).

## Constraints honored
- Glass strictly on controls/nav (titlebars, toolbars, sidebar, inspector, FAB). Content (note cards, table rows, editor canvas) never glass.
- No purple gradients, no glow blobs, no AI-slop chrome.
- 1440×900 viewport, macOS window chrome uniform across all 4 directions.
- Real note text (60-120 字), real dates, real counts — not placeholder.
- No JS, no external assets. Pure CSS. Open in browser.
- Files written to output dir only, never touched the real `/home/jason/workspace/mindtap/`.

## Files
- 10 HTML in `docs/projects/v1.0/prototype/`
- 1 method doc in `docs/projects/v1.0/compare-method.md`

## Limitations
- Did not implement GlassEffectContainer morph animations (would need JS).
- Did not implement background-extension effect (mirror + blur) — left as design note.
- Could not test in browser; visuals are based on Apple's HIG specification and standard backdrop-filter behavior.
- Did not use the actual skill (per the no-skill constraint) — so directions and rubric are homegrown but closely match the skill's described structure.
