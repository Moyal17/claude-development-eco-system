#!/usr/bin/env python3
"""
mark_done.py — close out an approved claude-development-eco-system plan and record actuals.

Stamps `done_at` + `actual_hours` + `status: shipped` into the plan's frontmatter,
appends a row to <repo-root>/docs/metrics/calibration.tsv, and prints a summary.

Usage:
    python3 mark_done.py --plan docs/plans/<slug>.md [--dry-run] [--actual-hours N] [--note "..."]

Exit codes:
    0 — success
    1 — file/parse error
    2 — plan not eligible (not approved, already done, or no started_at)
    4 — usage error

Stdlib only. No pip install.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import re
import shutil
import subprocess
import sys
from pathlib import Path


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
H2_RE = re.compile(r"^## (.+)$")
TASK_LINE_RE = re.compile(r"^\s*-\s+\[[ xX]\]\s+(.+)$")
TASK_HOURS_RE = re.compile(r"\s—\s(\d+(?:\.\d+)?)h\s*$")
STORY_POINTS_RE = re.compile(
    r"^\s*(?:\*\*)?Story\s+points:?(?:\*\*)?\s*[:：]?\s*(\d+(?:\.\d+)?)\s*$",
    re.IGNORECASE | re.MULTILINE,
)
ESTIMATE_TOTAL_RE = re.compile(
    r"\*\*Total\*\*\s*\|\s*\*\*(\d+(?:\.\d+)?)h",
    re.IGNORECASE,
)


def now_iso() -> str:
    return (
        _dt.datetime.now(_dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def parse_iso(s: str) -> _dt.datetime:
    """Best-effort ISO-8601 parse. Accepts trailing Z or +00:00."""
    s = s.strip().replace("Z", "+00:00")
    return _dt.datetime.fromisoformat(s)


def parse_frontmatter(text: str) -> tuple[dict[str, str], str, str]:
    """Return (fm_dict, fm_block_str, body)."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, "", text
    fm: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        fm[k.strip()] = v.strip()
    return fm, m.group(0), text[m.end():]


def write_frontmatter(fm: dict[str, str], original_block: str, body: str, plan_path: Path) -> None:
    """Write frontmatter + body, preserving key order from the original where possible."""
    # Read original keys in order to preserve them
    original_keys: list[str] = []
    for line in original_block.splitlines():
        if line.strip() in ("---", ""):
            continue
        if ":" in line:
            k = line.split(":", 1)[0].strip()
            if k not in original_keys:
                original_keys.append(k)

    # Append any new keys at the end in insertion order
    for k in fm.keys():
        if k not in original_keys:
            original_keys.append(k)

    lines = ["---"]
    for k in original_keys:
        if k in fm:
            lines.append(f"{k}: {fm[k]}")
    lines.append("---")
    new_text = "\n".join(lines) + "\n" + body
    plan_path.write_text(new_text, encoding="utf-8")


def extract_h2_section(body: str, name: str) -> str | None:
    lines = body.splitlines()
    out: list[str] = []
    inside = False
    for line in lines:
        m = H2_RE.match(line)
        if m:
            if inside:
                break
            if m.group(1).strip() == name:
                inside = True
                continue
        if inside:
            out.append(line)
    return "\n".join(out).strip() if inside else None


def sum_task_hours(tasks_md: str) -> tuple[float, int, int]:
    total = 0.0
    with_est = 0
    n = 0
    for line in tasks_md.splitlines():
        if TASK_LINE_RE.match(line):
            n += 1
            m = TASK_HOURS_RE.search(line)
            if m:
                total += float(m.group(1))
                with_est += 1
    return total, with_est, n


def find_repo_root(start: Path) -> Path | None:
    p = start.resolve()
    while p != p.parent:
        if (p / ".git").exists():
            return p
        p = p.parent
    return None


def fmt_hours(h: float) -> str:
    if h == int(h):
        return f"{int(h)}h"
    return f"{h:g}h"


def write_calibration_row(
    log_path: Path,
    slug: str,
    scoped_via: str,
    estimate_hours: float,
    story_points: str,
    started_at: str,
    done_at: str,
    actual_hours: float,
    accuracy_ratio: float,
    note: str,
) -> None:
    """Append a row to docs/metrics/calibration.tsv. Create with header if absent."""
    log_path.parent.mkdir(parents=True, exist_ok=True)
    new_file = not log_path.exists()
    with log_path.open("a", encoding="utf-8") as f:
        if new_file:
            f.write(
                "slug\tscoped_via\testimate_hours\tstory_points\tstarted_at\tdone_at\tactual_hours\taccuracy_ratio\tnotes\n"
            )
        # TSV: replace any tabs/newlines in note for safety
        safe_note = note.replace("\t", " ").replace("\n", " ")
        f.write(
            "\t".join(
                [
                    slug,
                    scoped_via,
                    f"{estimate_hours:g}",
                    story_points,
                    started_at,
                    done_at,
                    f"{actual_hours:g}",
                    f"{accuracy_ratio:.3f}",
                    safe_note,
                ]
            )
            + "\n"
        )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Mark an approved claude-development-eco-system plan as done and record actuals."
    )
    parser.add_argument("--plan", required=True, type=Path, help="Path to the plan file")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument(
        "--actual-hours",
        type=float,
        default=None,
        help="Override the wall-clock-derived actual_hours",
    )
    parser.add_argument("--note", default="", help="Optional one-line note for the calibration row")
    parser.add_argument(
        "--no-archive",
        action="store_true",
        help="Skip moving the plan file to docs/plans/archive/<slug>.md after closing.",
    )
    args = parser.parse_args()

    if not args.plan.exists():
        print(f"error: plan file not found: {args.plan}", file=sys.stderr)
        return 1

    plan_text = args.plan.read_text(encoding="utf-8")
    fm, fm_block, body = parse_frontmatter(plan_text)

    # Eligibility checks
    status = fm.get("status", "")
    stage = fm.get("stage", "")
    started_at = fm.get("started_at", "")
    done_at_existing = fm.get("done_at", "")

    if status not in ("approved", "shipped"):
        print(
            f"error: plan status is '{status}' (need 'approved'). Run /plan first.",
            file=sys.stderr,
        )
        return 2
    if stage not in ("approved", "shipped"):
        print(f"error: plan stage is '{stage}' (need 'approved').", file=sys.stderr)
        return 2
    if done_at_existing:
        print(
            f"error: plan is already done (done_at = {done_at_existing}). Cannot mark again.",
            file=sys.stderr,
        )
        return 2
    if not started_at:
        print(
            "error: plan has no started_at field. Add it manually to the frontmatter "
            "(e.g. 'started_at: 2026-05-08T16:08:00Z') and re-run.",
            file=sys.stderr,
        )
        return 2

    # Compute actuals
    try:
        started_dt = parse_iso(started_at)
    except Exception as e:
        print(f"error: cannot parse started_at='{started_at}': {e}", file=sys.stderr)
        return 1

    now = _dt.datetime.now(_dt.timezone.utc)
    if args.actual_hours is not None:
        actual_hours = args.actual_hours
    else:
        delta = now - started_dt
        actual_hours = delta.total_seconds() / 3600.0
    if actual_hours < 0:
        print(
            f"error: computed actual_hours is negative ({actual_hours:.2f}). "
            f"Check that started_at is in the past.",
            file=sys.stderr,
        )
        return 1

    # Pull estimate
    tasks_md = extract_h2_section(body, "Tasks") or ""
    estimate_md = extract_h2_section(body, "Estimate") or ""
    sum_hours, with_est, n_tasks = sum_task_hours(tasks_md)
    est_total_match = ESTIMATE_TOTAL_RE.search(estimate_md)
    estimate_section_total = float(est_total_match.group(1)) if est_total_match else None

    # Prefer the per-task sum (canonical); warn if it disagrees with the Estimate table
    estimate_hours = sum_hours if sum_hours > 0 else (estimate_section_total or 0.0)
    estimate_warning = ""
    if (
        estimate_section_total is not None
        and sum_hours > 0
        and abs(estimate_section_total - sum_hours) > 0.01
    ):
        estimate_warning = (
            f"warning: ## Estimate Total ({estimate_section_total}h) != per-task sum ({sum_hours}h); "
            f"using per-task sum."
        )

    # Story points
    sp_match = STORY_POINTS_RE.search(estimate_md)
    story_points = sp_match.group(1) if sp_match else ""

    # scoped_via from frontmatter
    scoped_via = fm.get("scoped-via") or fm.get("scoped_via") or "intake-research"
    if scoped_via == "scope-skill":
        scoped_via = "scope"

    accuracy_ratio = (actual_hours / estimate_hours) if estimate_hours > 0 else 0.0

    # Slug
    slug = fm.get("slug") or args.plan.stem

    # Render summary
    sep = "─" * 70
    print(sep)
    print("DONE — calibration preview")
    print(sep)
    print(f"  Plan:           {slug}")
    print(f"  Scoped via:     {scoped_via}")
    print(f"  Estimate:       {fmt_hours(estimate_hours)}" + (f" / {story_points} SP" if story_points else ""))
    print(f"  Started:        {started_at}")
    print(f"  Done at:        {now_iso()}" + ("  (--dry-run)" if args.dry_run else ""))
    print(f"  Actual:         {fmt_hours(actual_hours)}" + ("  (override)" if args.actual_hours is not None else "  (wall-clock)"))
    if estimate_hours > 0:
        verdict = (
            "faster than estimate"
            if accuracy_ratio < 0.9
            else "slower than estimate"
            if accuracy_ratio > 1.1
            else "on target"
        )
        print(f"  Accuracy ratio: {accuracy_ratio:.2f}  →  {verdict}")
    if estimate_warning:
        print(f"  {estimate_warning}")
    print(sep)

    if args.dry_run:
        return 0

    # Live mode: stamp frontmatter + bump status to shipped + append calibration row
    new_done_at = now_iso()
    fm["done_at"] = new_done_at
    fm["actual_hours"] = f"{actual_hours:g}"
    fm["status"] = "shipped"
    fm["stage"] = "shipped"
    fm["last-updated"] = new_done_at[:10]
    write_frontmatter(fm, fm_block, body, args.plan)

    # Calibration log goes in <repo-root>/docs/metrics/calibration.tsv
    repo_root = find_repo_root(args.plan)
    if repo_root is None:
        print(
            "warning: could not locate repo root (no .git found in any parent); "
            "skipping calibration log write.",
            file=sys.stderr,
        )
    else:
        log_path = repo_root / "docs" / "metrics" / "calibration.tsv"
        write_calibration_row(
            log_path,
            slug=slug,
            scoped_via=scoped_via,
            estimate_hours=estimate_hours,
            story_points=story_points,
            started_at=started_at,
            done_at=new_done_at,
            actual_hours=actual_hours,
            accuracy_ratio=accuracy_ratio,
            note=args.note,
        )
        print(f"Logged to: {log_path.relative_to(repo_root)}")

    # Archive the plan file: docs/plans/<slug>.md → docs/plans/archive/<slug>.md.
    # This keeps the active docs/plans/ folder small so future /intake & /research
    # runs aren't confused by stale "most recent approved" matches.
    archived_to: Path | None = None
    if not args.no_archive:
        plan_path = args.plan.resolve()
        try:
            plans_dir_idx = plan_path.parts.index("plans")
        except ValueError:
            plans_dir_idx = -1
        if plans_dir_idx >= 0 and plan_path.parent.name == "plans":
            archive_dir = plan_path.parent / "archive"
            archive_dir.mkdir(parents=True, exist_ok=True)
            target = archive_dir / plan_path.name
            if target.exists():
                print(
                    f"warning: archive target {target} already exists; skipping archive move.",
                    file=sys.stderr,
                )
            else:
                # Prefer `git mv` if we're inside a git repo so history follows the file.
                moved_via_git = False
                if repo_root is not None:
                    try:
                        subprocess.run(
                            ["git", "mv", str(plan_path), str(target)],
                            cwd=str(repo_root),
                            check=True,
                            capture_output=True,
                        )
                        moved_via_git = True
                    except (subprocess.CalledProcessError, FileNotFoundError):
                        moved_via_git = False
                if not moved_via_git:
                    shutil.move(str(plan_path), str(target))
                archived_to = target
                if repo_root is not None:
                    rel = target.relative_to(repo_root)
                    print(f"Archived plan to: {rel}")
                else:
                    print(f"Archived plan to: {target}")

    print(f"Plan '{slug}' closed out.  ✓")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
