"""The MeTTa rules in the Omega plugin and the bridge's Python mirror must agree.

Runs the real plugin rules on PeTTa inside the Ahadi Omega image (Docker) over many
fact vectors and derivations, and compares every answer with rules.py.
Run: uv run pytest -m metta
"""

import random
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from ahadi_bridge.rules import Facts, PayoutRequest, Rule, decide, derive

pytestmark = pytest.mark.metta
ROOT = Path(__file__).resolve().parents[2]
PLUGIN = ROOT / "omega" / "plugins" / "ahadi" / "ahadi.metta"
IMAGE = "ahadi-omega:dev"


def _rules_only() -> str:
    """The rule section of the plugin (no imports, no skills)."""
    src = PLUGIN.read_text()
    start = src.index("; ================================================================ funding rules")
    end = src.index("; ---------------------------------------------------------------- skills")
    return src[start:end]


def _run_petta(program: str, tmp_path: Path) -> list[str]:
    if not shutil.which("docker"):
        pytest.skip("docker not available")
    f = tmp_path / "agree.metta"
    f.write_text(_rules_only() + "\n" + program)
    out = subprocess.run(
        ["docker", "run", "--rm", "--entrypoint", "sh", "-v", f"{tmp_path}:/w", IMAGE, "-c", "cd /PeTTa && sh run.sh /w/agree.metta 2>&1"],
        capture_output=True, text=True, timeout=300,
    ).stdout
    lines = [re.sub(r"\x1b\[[0-9;]*m", "", l).strip() for l in out.splitlines()]
    # PeTTa echoes the source (which contains $variables) before printing results.
    return [l for l in lines if (l.startswith("(ahadi-decision") or l.startswith("(RES ")) and "$" not in l]


def _vectors(n=60):
    rng = random.Random(42)
    rule = Rule.from_dict({"event_id": "e", "name": "E", "asset": "USDB", "pool_cents": 170000, "target_teams": 50, "place_shares_bp": [2500, 2000, 1600, 1400, 1300, 1200]})
    out = []
    for _ in range(n):
        eligible = rng.choice([None, 0, 5, 20, 50, 70])
        place = rng.randint(0, 7)
        expected = derive(rule, eligible).place_cents[place - 1] if (eligible is not None and 1 <= place <= 6) else -1
        amount = rng.choice([expected, expected + 1, 100000, 0]) if expected >= 0 else rng.choice([0, 17000])
        f = Facts(rule.hash if rng.random() > 0.15 else None, eligible, rng.choice([0, 9000, 68000]), rng.choice([None, None, "paid"]), rng.choice([None, None, "X"]), rng.random() > 0.3, rng.random() > 0.2, rng.random() > 0.8)
        rh = rule.hash if rng.random() > 0.1 else "0" * 64
        r = PayoutRequest("e", rh, place, "T", "G" + "A" * 55, "USDB" if rng.random() > 0.1 else "USDC", amount)
        out.append((rule, r, f, expected))
    return out


def _sexpr(rule, r, f, expected):
    place_ok = 1 if 1 <= r.place <= 6 else 0
    vals = [1 if f.published_rule_hash else 0, 1 if r.rule_hash == rule.hash == f.published_rule_hash else 0, 1 if f.eligible is not None else 0, place_ok,
            expected if (place_ok and f.eligible is not None) else -1, r.amount_cents, 1 if r.asset == rule.asset else 0, f.budget_left_cents,
            0 if f.seen_status is None else 1, 0 if f.place_paid_to is None else 1, 1 if f.recipient_active else 0, 1 if f.recipient_trusts_asset else 0, 1 if f.wants_other_chain else 0]
    return "(ahadi-facts " + " ".join(map(str, vals)) + ")"


def test_decisions_agree(tmp_path):
    vecs = _vectors()
    prog = "\n".join(f"!(ahadi-decide {_sexpr(*v)})" for v in vecs)
    res = _run_petta(prog, tmp_path)
    assert len(res) == len(vecs), f"expected {len(vecs)} decisions, got {len(res)}"
    allowed_seen = refused_seen = 0
    for (rule, r, f, _), line in zip(vecs, res):
        py = decide(rule, r, f)
        m = re.match(r"\(ahadi-decision (\w+) ([\w-]+)", line)
        assert m, line
        assert (m.group(1) == "allowed") == py.allowed, (r, f, line)
        if py.allowed:
            allowed_seen += 1
            assert m.group(2) == py.route
        else:
            refused_seen += 1
            assert set(re.findall(r"\(ahadi-fail ([\w-]+)\)", line)) == {c.name for c in py.failures}
    assert allowed_seen and refused_seen


def test_derivations_agree(tmp_path):
    rng = random.Random(3)
    cases = [(170000, 20, 50), (170000, 0, 50), (170000, 50, 50), (170000, 77, 50), (102000, 13, 40)] + [(rng.randint(1, 9_000_000), rng.randint(0, 200), rng.randint(1, 120)) for _ in range(15)]
    shares = [2500, 2000, 1600, 1400, 1300, 1200]
    prog = "\n".join(
        f"!(let $a (ahadi-award-cents {p} {e} {t}) (RES $a (ahadi-reserve-cents {p} {e} {t}) (map-atom ({' '.join(map(str, shares))}) $s (ahadi-place-cents $a $s))))" for p, e, t in cases
    )
    res = _run_petta(prog, tmp_path)
    assert len(res) == len(cases)
    for (p, e, t), line in zip(cases, res):
        nums = [int(x) for x in re.findall(r"-?\d+", line)]
        award, reserve, places = nums[0], nums[1], nums[2:]
        py = derive(Rule.from_dict({"event_id": "e", "name": "E", "asset": "USDB", "pool_cents": p, "target_teams": t, "place_shares_bp": shares}), e)
        # MeTTa reports the raw award pool; the Python mirror moves any rounding remainder to the reserve.
        assert places == py.place_cents
        assert award - (award - sum(places)) == py.award_cents
        assert reserve + (award - sum(places)) == py.reserve_cents
