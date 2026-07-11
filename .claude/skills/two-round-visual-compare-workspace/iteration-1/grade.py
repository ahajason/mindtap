#!/usr/bin/env python3
"""
Programmatic grader for two-round-visual-compare iteration-1.
Checks assertions against actual output files.
Writes grading.json for each run + aggregate benchmark.json.
"""
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

WORKSPACE = Path("/home/jason/workspace/mindtap/.claude/skills/two-round-visual-compare-workspace/iteration-1")
EVALS = {
    "eval-1-mindtap-full": {
        "name": "mindtap-full",
        "assertions": [
            ("Round 1 8 tiles + compare.html", lambda r: check_round1_full(r)),
            ("Round 2 4 v2-*.html + compare-v2.html + ≥1280×800", lambda r: check_round2_full(r)),
            ("prototype/index.html exists", lambda r: check_index(r, "docs/projects/v1.0/prototype/index.html", "prototype/index.html")),
            ("compare-method.md exists", lambda r: check_method(r)),
            ("No purple/pink gradient in any HTML", lambda r: check_no_purple_gradient(r)),
            ("Glass only on controls (not on content cards)", lambda r: check_glass_controls_only(r)),
            ("V2 4 directions use ≥3 distinct font families", lambda r: check_distinct_fonts(r, "v2-")),
            ("HIG materials read (in user_notes)", lambda r: check_hig_read(r)),
        ]
    },
    "eval-2-mindtap-v2-only": {
        "name": "mindtap-v2-only",
        "assertions": [
            ("V1 NOT produced (no Q1-Q4 + D5-D8 + matrix)", lambda r: check_v1_not_produced(r)),
            ("V2 4 v2-*.html + entry page", lambda r: check_round2_v2only(r)),
            ("A direction = macOS 26 Tahoe (v2-a-*)", lambda r: check_a_macos(r)),
            ("D direction = engineering doc (v2-d-*)", lambda r: check_d_engdoc(r)),
            ("B/C are not macOS/engdoc (model-chosen)", lambda r: check_bc_distinct(r)),
            ("compare-v2.html entry exists", lambda r: check_compare_v2_entry(r)),
        ]
    },
    "eval-3-saas-dashboard": {
        "name": "saas-dashboard",
        "assertions": [
            ("V1 + V2 + directory + docs all produced", lambda r: check_eval3_full(r)),
            ("V2 4 directions contain dashboard real components", lambda r: check_dashboard_components(r)),
            ("4 v2-*.html self-contained (no @import or external link)", lambda r: check_self_contained(r, "v2-")),
            ("≥2 V2 directions use serif or mono fonts", lambda r: check_serif_mono(r, "v2-")),
            ("compare-method.md lists 4 anti-AI-slop rules", lambda r: check_anti_ai_slop_md(r)),
            ("Docs explain why V1→V2 (density vs context)", lambda r: check_v1v2_rationale(r)),
        ]
    },
}

def list_files(out_dir):
    """List all relevant files (HTML, MD, JSON) recursively."""
    files = []
    for f in out_dir.rglob("*"):
        if f.is_file() and f.suffix in (".html", ".md", ".json", ".css"):
            files.append(f)
    return files

def read_file(f):
    try:
        return f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def find_html(out_dir, pattern):
    """Find HTML files matching a glob pattern anywhere in the tree."""
    return [f for f in out_dir.rglob("*.html") if f.match(pattern)]

def has_file(out_dir, *relative_paths):
    """Check if any of the relative paths exist."""
    for p in relative_paths:
        if list(out_dir.rglob(p.split("/")[-1])):
            return True, str(p)
    return False, None

# === Specific checks ===

def check_round1_full(r):
    out_dir = r["out_dir"]
    qs = find_html(out_dir, "Q*.html")
    ds = find_html(out_dir, "D5-*.html") + find_html(out_dir, "D6-*.html") + find_html(out_dir, "D7-*.html") + find_html(out_dir, "D8-*.html")
    compare = find_html(out_dir, "compare.html")
    has_8_tiles = len(qs) >= 4 and len(ds) >= 4
    has_compare = len(compare) >= 1
    ok = has_8_tiles and has_compare
    ev = []
    if not has_8_tiles: ev.append(f"only {len(qs)} Q* + {len(ds)} D5-D8")
    if not has_compare: ev.append("no compare.html")
    if ok: ev.append(f"Q×{len(qs)}, D×{len(ds)}, compare={len(compare)}")
    return ok, "; ".join(ev)

def check_round2_full(r):
    out_dir = r["out_dir"]
    v2s = find_html(out_dir, "v2-*.html")
    compare_v2 = find_html(out_dir, "compare-v2.html")
    has_4 = len(v2s) >= 4
    has_compare = len(compare_v2) >= 1
    sizes_ok = True
    size_evidence = []
    for v in v2s:
        content = read_file(v)
        m = re.search(r'(?:min-width|min-height|width|height)[:=]\s*"?(\d{2,4})', content)
        # Heuristic: file size > 10KB implies 1280×800+ content
        if v.stat().st_size < 10000:
            sizes_ok = False
            size_evidence.append(f"{v.name}={v.stat().st_size}B")
    ok = has_4 and has_compare and sizes_ok
    ev = []
    if not has_4: ev.append(f"only {len(v2s)} v2-*.html")
    if not has_compare: ev.append("no compare-v2.html")
    if not sizes_ok: ev.append("small files: " + ", ".join(size_evidence))
    if ok: ev.append(f"v2×{len(v2s)} all >10KB, compare-v2 ✓")
    return ok, "; ".join(ev) if ev else "ok"

def check_index(r, *relative_paths):
    out_dir = r["out_dir"]
    for p in relative_paths:
        # exact match
        if (out_dir / p).exists():
            return True, f"found at {p}"
    # fallback: any file named index.html
    idx = find_html(out_dir, "index.html")
    if idx:
        return True, f"index.html at {idx[0].relative_to(out_dir)}"
    return False, "no index.html"

def check_method(r):
    out_dir = r["out_dir"]
    candidates = list(out_dir.rglob("compare-method.md")) + list(out_dir.rglob("DESIGN_DECISIONS.md")) + list(out_dir.rglob("visual-method.md"))
    if candidates:
        return True, f"found {candidates[0].relative_to(out_dir)}"
    return False, "no compare-method.md / DESIGN_DECISIONS.md / visual-method.md"

def check_no_purple_gradient(r):
    out_dir = r["out_dir"]
    bad = ["#667eea", "#764ba2", "#f093fb", "#a18cd1", "#ff6b9d", "#c471f5"]
    findings = []
    for f in out_dir.rglob("*.html"):
        content = read_file(f)
        for color in bad:
            if color in content.lower() and "gradient" in content.lower():
                findings.append(f"{f.name} contains {color}")
    ok = len(findings) == 0
    return ok, "; ".join(findings) if findings else f"no purple/pink gradient in {len(list(out_dir.rglob('*.html')))} HTML"

def check_glass_controls_only(r):
    """Check that backdrop-filter is on control-like selectors, not on content cards."""
    out_dir = r["out_dir"]
    findings = []
    total_with_glass = 0
    for f in out_dir.rglob("*.html"):
        content = read_file(f)
        # Count backdrop-filter usages
        glass_count = content.count("backdrop-filter")
        total_with_glass += glass_count
        # If glass is used many times (10+) on content-card-like selectors, flag
        if glass_count > 30:
            # Heuristic: too many glass elements = glass on content
            findings.append(f"{f.name} has {glass_count} backdrop-filter (suspicious)")
    # Soft pass: as long as it's not absurd
    ok = total_with_glass < 200
    return ok, f"{total_with_glass} backdrop-filter total across HTML"

def check_distinct_fonts(r, prefix):
    out_dir = r["out_dir"]
    fonts = set()
    for f in out_dir.rglob(f"{prefix}*.html"):
        content = read_file(f)
        # Extract font-family values
        m = re.findall(r"font-family:\s*([^;}\n]+)", content)
        for fm in m:
            # Take first font in stack
            first = re.split(r",\s*", fm.strip())[0].strip().strip("'\"")
            if first and first not in ("serif", "sans-serif", "monospace", "system-ui", "inherit"):
                fonts.add(first)
    ok = len(fonts) >= 3
    return ok, f"{len(fonts)} distinct font-families: {sorted(fonts)[:5]}"

def check_hig_read(r):
    out_dir = r["out_dir"]
    notes = list(out_dir.rglob("user_notes.md"))
    if not notes:
        return False, "no user_notes.md"
    content = read_file(notes[0])
    keywords = ["liquid-glass", "hig", "material", "wwdc", "landmarks", "adopting"]
    hits = [k for k in keywords if k in content.lower()]
    ok = len(hits) >= 1
    return ok, f"user_notes mentions: {hits}" if ok else "no HIG reference in user_notes"

def check_v1_not_produced(r):
    out_dir = r["out_dir"]
    qs = find_html(out_dir, "Q[1-4]*.html")
    ds = find_html(out_dir, "D[5-8]-*.html")
    matrix = find_html(out_dir, "M1-*.html") + find_html(out_dir, "compare.html")
    total_v1 = len(qs) + len(ds) + len(matrix)
    ok = total_v1 == 0
    ev = []
    if qs: ev.append(f"Q1-Q4: {len(qs)}")
    if ds: ev.append(f"D5-D8: {len(ds)}")
    if matrix: ev.append(f"matrix/compare.html: {len(matrix)}")
    return ok, f"V1 artifacts: {total_v1}" + ("; " + ", ".join(ev) if ev else " ✓ none")

def check_round2_v2only(r):
    out_dir = r["out_dir"]
    v2s = find_html(out_dir, "v2-*.html")
    entry = find_html(out_dir, "compare-v2.html") + find_html(out_dir, "v2-index.html")
    has_4 = len(v2s) >= 4
    has_entry = len(entry) >= 1
    return has_4 and has_entry, f"v2×{len(v2s)}, entry×{len(entry)}"

def check_a_macos(r):
    out_dir = r["out_dir"]
    a_files = [f for f in out_dir.rglob("v2-a-*.html")]
    if not a_files:
        return False, "no v2-a-*.html"
    content = read_file(a_files[0])
    keywords = ["macos", "tahoe", "traffic", "menubar", "liquid glass", "backdrop-filter", "sf pro", "system blue"]
    hits = [k for k in keywords if k in content.lower()]
    return len(hits) >= 2, f"v2-a mentions: {hits}"

def check_d_engdoc(r):
    out_dir = r["out_dir"]
    d_files = [f for f in out_dir.rglob("v2-d-*.html")]
    if not d_files:
        return False, "no v2-d-*.html"
    content = read_file(d_files[0])
    keywords = ["jetbrains", "api", "documentation", "monospace", "prop", "endpoint", "function", "ascii"]
    hits = [k for k in keywords if k in content.lower()]
    return len(hits) >= 2, f"v2-d mentions: {hits}"

def check_bc_distinct(r):
    out_dir = r["out_dir"]
    b_files = [f for f in out_dir.rglob("v2-b-*.html")]
    c_files = [f for f in out_dir.rglob("v2-c-*.html")]
    if not b_files or not c_files:
        return False, "missing v2-b or v2-c"
    b_content = read_file(b_files[0]).lower()
    c_content = read_file(c_files[0]).lower()
    # b and c should not be macOS-26 or engdoc
    macos_words = ["tahoe", "traffic light", "menubar"]
    engdoc_words = ["prop table", "ascii tree", "endpoint", "jetbrains"]
    b_macos = any(w in b_content for w in macos_words)
    b_engdoc = sum(1 for w in engdoc_words if w in b_content) >= 2
    c_macos = any(w in c_content for w in macos_words)
    c_engdoc = sum(1 for w in engdoc_words if w in c_content) >= 2
    # Either b or c should be a distinct direction (NOT both macOS or both engdoc)
    # B and C should also be different from each other
    same_as_d = b_engdoc and c_engdoc
    same_as_a = b_macos and c_macos
    distinct_from_each_other = b_content[:200] != c_content[:200]
    ok = not same_as_a and not same_as_d and distinct_from_each_other
    ev = []
    if same_as_a: ev.append("both b/c are macOS-26")
    if same_as_d: ev.append("both b/c are engdoc")
    if not distinct_from_each_other: ev.append("b and c are identical")
    if ok: ev.append("b and c are distinct + not just macOS/engdoc")
    return ok, "; ".join(ev)

def check_compare_v2_entry(r):
    out_dir = r["out_dir"]
    entries = find_html(out_dir, "compare-v2.html") + find_html(out_dir, "v2-index.html")
    if not entries:
        return False, "no compare-v2.html or v2-index.html"
    content = read_file(entries[0])
    # Should link to v2-*.html
    has_links = "v2-" in content and ("href" in content or "src" in content)
    return has_links, f"entry has v2- links" if has_links else "entry doesn't link to v2-*"

def check_eval3_full(r):
    out_dir = r["out_dir"]
    # V1
    qs = find_html(out_dir, "Q[1-4]*.html")
    ds = find_html(out_dir, "D[5-8]-*.html")
    v1_compare = find_html(out_dir, "compare.html")
    # V2
    v2s = find_html(out_dir, "v2-*.html")
    v2_compare = find_html(out_dir, "compare-v2.html")
    # directory
    idx = find_html(out_dir, "index.html")
    # docs
    methods = list(out_dir.rglob("compare-method.md")) + list(out_dir.rglob("DESIGN_DECISIONS.md")) + list(out_dir.rglob("visual-method.md"))
    has_v1 = len(qs) >= 4 and len(ds) >= 4 and len(v1_compare) >= 1
    has_v2 = len(v2s) >= 4 and len(v2_compare) >= 1
    has_idx = len(idx) >= 1
    has_method = len(methods) >= 1
    ok = has_v1 and has_v2 and has_idx and has_method
    ev = []
    if not has_v1: ev.append(f"V1: Q={len(qs)}, D={len(ds)}, compare={len(v1_compare)}")
    if not has_v2: ev.append(f"V2: v2={len(v2s)}, compare-v2={len(v2_compare)}")
    if not has_idx: ev.append("no index.html")
    if not has_method: ev.append("no compare-method.md")
    if ok: ev.append("all four sections present")
    return ok, "; ".join(ev)

def check_dashboard_components(r):
    out_dir = r["out_dir"]
    v2s = find_html(out_dir, "v2-*.html")
    keywords = ["kpi", "table", "filter", "task", "chart", "invoice", "pipeline", "activity", "command palette", "$", "MRR", "deal"]
    results = []
    for v in v2s:
        content = read_file(v).lower()
        hits = [k for k in keywords if k in content]
        results.append((v.name, len(hits), hits[:3]))
    all_have = all(n_hits >= 3 for _, n_hits, _ in results)
    ev = "; ".join(f"{n}={c}({','.join(h[:2])})" for n, c, h in results)
    return all_have, ev

def check_self_contained(r, prefix):
    out_dir = r["out_dir"]
    findings = []
    for f in out_dir.rglob(f"{prefix}*.html"):
        content = read_file(f)
        # @import or external <link rel="stylesheet" href="http..."> or non-empty src=
        if "@import" in content:
            findings.append(f"{f.name} has @import")
        # external link (not #anchor)
        ext_links = re.findall(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']', content)
        for link in ext_links:
            if not link.startswith("#"):
                findings.append(f"{f.name} links external CSS: {link[:40]}")
    ok = len(findings) == 0
    return ok, f"external deps: {findings}" if findings else "all v2-*.html self-contained"

def check_serif_mono(r, prefix):
    out_dir = r["out_dir"]
    serif_or_mono = 0
    for f in out_dir.rglob(f"{prefix}*.html"):
        content = read_file(f)
        if any(w in content for w in ["Charter", "Fraunces", "Georgia", "Times", "serif", "JetBrains Mono", "SF Mono", "Menlo", "monospace", "Fira Code"]):
            serif_or_mono += 1
    return serif_or_mono >= 2, f"{serif_or_mono} v2 files use serif or mono"

def check_anti_ai_slop_md(r):
    out_dir = r["out_dir"]
    methods = list(out_dir.rglob("compare-method.md")) + list(out_dir.rglob("DESIGN_DECISIONS.md")) + list(out_dir.rglob("visual-method.md"))
    if not methods:
        return False, "no method doc"
    content = read_file(methods[0])
    # Look for 4 hard rules or anti-AI-slop rules
    rules_keywords = ["gradient", "content", "font-size", "emoji", "glass", "real", "rule", "hard", "constraint"]
    hits = sum(1 for k in rules_keywords if k.lower() in content.lower())
    return hits >= 4, f"method doc has {hits} relevant keywords (need 4+): {methods[0].name}"

def check_v1v2_rationale(r):
    out_dir = r["out_dir"]
    docs = list(out_dir.rglob("compare-method.md")) + list(out_dir.rglob("DESIGN_DECISIONS.md")) + list(out_dir.rglob("visual-method.md")) + list(out_dir.rglob("README.md")) + list(out_dir.rglob("user_notes.md"))
    if not docs:
        return False, "no docs"
    for d in docs:
        content = read_file(d).lower()
        if "density" in content and ("context" in content or "round 1" in content or "round 2" in content or "v1" in content and "v2" in content):
            return True, f"rationale found in {d.name}"
    return False, "no V1→V2 rationale in docs"

# === Main ===

def grade_run(eval_dir, config_dir, eval_assertions):
    out_dir = config_dir / "outputs"
    timing_file = config_dir / "timing.json"
    if not out_dir.exists():
        return None

    r = {"out_dir": out_dir, "config_dir": config_dir}

    expectations = []
    for text, check_fn in eval_assertions:
        try:
            passed, evidence = check_fn(r)
        except Exception as e:
            passed, evidence = False, f"check raised {type(e).__name__}: {e}"
        expectations.append({
            "text": text,
            "passed": bool(passed),
            "evidence": str(evidence)[:500],
        })

    passed_n = sum(1 for e in expectations if e["passed"])
    total = len(expectations)
    pass_rate = passed_n / total if total else 0.0

    # Read metrics.json
    metrics_path = out_dir / "metrics.json"
    execution_metrics = {"total_tool_calls": 0, "output_chars": 0, "errors_encountered": 0}
    if metrics_path.exists():
        try:
            m = json.loads(metrics_path.read_text())
            for k in ("total_tool_calls", "output_chars", "errors_encountered"):
                if k in m:
                    execution_metrics[k] = m[k]
        except Exception:
            pass

    # Read timing
    timing = {"total_duration_seconds": 0.0, "executor_duration_seconds": 0.0}
    if timing_file.exists():
        try:
            t = json.loads(timing_file.read_text())
            timing["total_duration_seconds"] = t.get("total_duration_seconds", 0.0)
            timing["executor_duration_seconds"] = t.get("total_duration_seconds", 0.0)
        except Exception:
            pass

    return {
        "expectations": expectations,
        "summary": {
            "passed": passed_n,
            "failed": total - passed_n,
            "total": total,
            "pass_rate": round(pass_rate, 4),
        },
        "execution_metrics": execution_metrics,
        "timing": timing,
        "claims": [],
        "user_notes_summary": {
            "uncertainties": [],
            "needs_review": [],
            "workarounds": []
        }
    }

def main():
    all_runs = []
    for eval_id, eval_cfg in EVALS.items():
        eval_dir = WORKSPACE / eval_id
        if not eval_dir.exists():
            continue
        for config_name in ("with_skill", "without_skill"):
            config_dir = eval_dir / config_name
            if not config_dir.exists():
                continue
            grading = grade_run(eval_dir, config_dir, eval_cfg["assertions"])
            if grading is None:
                continue
            # Save grading.json
            grading_file = config_dir / "grading.json"
            grading_file.write_text(json.dumps(grading, indent=2, ensure_ascii=False))
            print(f"{eval_id}/{config_name}: {grading['summary']['passed']}/{grading['summary']['total']} = {grading['summary']['pass_rate']*100:.0f}%")
            all_runs.append({
                "eval_id": eval_id,
                "eval_name": eval_cfg["name"],
                "configuration": config_name,
                "result": grading["summary"],
                "timing": grading["timing"],
                "execution_metrics": grading["execution_metrics"],
                "expectations": grading["expectations"],
            })

    # Aggregate benchmark.json
    summary_by_config = defaultdict(lambda: {"pass_rates": [], "times": [], "tokens": []})
    for run in all_runs:
        cfg = run["configuration"]
        summary_by_config[cfg]["pass_rates"].append(run["result"]["pass_rate"])
        summary_by_config[cfg]["times"].append(run["timing"]["total_duration_seconds"])
        # tokens: not directly available, use output_chars as proxy
        summary_by_config[cfg]["tokens"].append(run["execution_metrics"].get("output_chars", 0))

    def stats(values):
        if not values: return {"mean": 0.0, "stddev": 0.0, "min": 0.0, "max": 0.0}
        n = len(values)
        mean = sum(values) / n
        if n > 1:
            var = sum((x - mean) ** 2 for x in values) / (n - 1)
            std = var ** 0.5
        else:
            std = 0.0
        return {"mean": round(mean, 4), "stddev": round(std, 4), "min": round(min(values), 4), "max": round(max(values), 4)}

    run_summary = {}
    for cfg, d in summary_by_config.items():
        run_summary[cfg] = {
            "pass_rate": stats(d["pass_rates"]),
            "time_seconds": stats(d["times"]),
            "tokens": stats(d["tokens"]),
        }

    # Delta
    if "with_skill" in run_summary and "without_skill" in run_summary:
        a = run_summary["with_skill"]
        b = run_summary["without_skill"]
        run_summary["delta"] = {
            "pass_rate": f"{a['pass_rate']['mean'] - b['pass_rate']['mean']:+.2f}",
            "time_seconds": f"{a['time_seconds']['mean'] - b['time_seconds']['mean']:+.1f}",
            "tokens": f"{a['tokens']['mean'] - b['tokens']['mean']:+.0f}",
        }

    benchmark = {
        "metadata": {
            "skill_name": "two-round-visual-compare",
            "skill_path": "/home/jason/workspace/mindtap/.claude/skills/two-round-visual-compare",
            "executor_model": "MiniMax-M3",
            "analyzer_model": "MiniMax-M3",
            "timestamp": "2026-06-14T00:00:00Z",
            "evals_run": [1, 2, 3],
            "runs_per_configuration": 1,
        },
        "runs": all_runs,
        "run_summary": run_summary,
        "notes": []
    }

    bench_file = WORKSPACE / "benchmark.json"
    bench_file.write_text(json.dumps(benchmark, indent=2, ensure_ascii=False))
    print(f"\nWrote {bench_file}")

    # Print summary
    print("\nSummary:")
    for cfg, s in run_summary.items():
        if cfg == "delta": continue
        print(f"  {cfg}: {s['pass_rate']['mean']*100:.0f}% pass rate, {s['time_seconds']['mean']:.0f}s avg")
    if "delta" in run_summary:
        d = run_summary["delta"]
        print(f"  delta: pass_rate={d['pass_rate']}, time={d['time_seconds']}s, tokens={d['tokens']}")

if __name__ == "__main__":
    main()
