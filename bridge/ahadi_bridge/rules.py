"""Funding rules: canonical form, hashing, derivation and checks.

This is the Python mirror of omega/plugins/ahadi/rules.metta. The Omega agent
decides with the MeTTa rules; the bridge re-runs these before it will sign, and
a test asserts both sides agree. All money is integer cents.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from typing import Any

BP = 10_000  # basis points in 100%


def canonical_json(obj: Any) -> str:
    """Stable JSON: sorted keys, no whitespace, UTF-8. Hash input for rules and requests."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(obj: Any) -> str:
    return hashlib.sha256(canonical_json(obj).encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class Rule:
    event_id: str
    name: str
    asset: str
    pool_cents: int
    target_teams: int
    place_shares_bp: tuple[int, ...]
    claim_window_days: int = 30
    version: int = 1

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Rule":
        rule = cls(
            event_id=str(d["event_id"]),
            name=str(d["name"]),
            asset=str(d["asset"]),
            pool_cents=int(d["pool_cents"]),
            target_teams=int(d["target_teams"]),
            place_shares_bp=tuple(int(x) for x in d["place_shares_bp"]),
            claim_window_days=int(d.get("claim_window_days", 30)),
            version=int(d.get("version", 1)),
        )
        rule.validate()
        return rule

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "name": self.name,
            "asset": self.asset,
            "pool_cents": self.pool_cents,
            "target_teams": self.target_teams,
            "release": "eligible_over_target_capped_at_100",
            "place_shares_bp": list(self.place_shares_bp),
            "rounding": "floor_cent_remainder_to_reserve",
            "claim_window_days": self.claim_window_days,
            "carry_forward": "reserve_to_next_event",
            "version": self.version,
        }

    @property
    def hash(self) -> str:
        return sha256_hex(self.to_dict())

    def validate(self) -> None:
        problems = []
        if self.pool_cents <= 0:
            problems.append("pool must be positive")
        if self.target_teams <= 0:
            problems.append("target teams must be positive")
        if not self.place_shares_bp:
            problems.append("at least one place is required")
        if any(s <= 0 for s in self.place_shares_bp):
            problems.append("every place share must be positive")
        if sum(self.place_shares_bp) != BP:
            problems.append(f"place shares must add up to 100% (got {sum(self.place_shares_bp) / 100:.2f}%)")
        if list(self.place_shares_bp) != sorted(self.place_shares_bp, reverse=True):
            problems.append("a higher place cannot get less than a lower place")
        if problems:
            raise ValueError("; ".join(problems))


@dataclass
class Step:
    """One step of a derivation trail: the rule that fired and what it produced."""

    rule: str
    text: str
    value: int | None = None


@dataclass
class Derivation:
    eligible: int
    release_bp: int
    award_cents: int
    reserve_cents: int
    place_cents: list[int]
    steps: list[Step] = field(default_factory=list)


def money(cents: int) -> str:
    return f"{cents // 100:,}.{cents % 100:02d}"


def derive(rule: Rule, eligible: int) -> Derivation:
    if eligible < 0:
        raise ValueError("eligible teams cannot be negative")
    release_bp = min(BP, (BP * eligible) // rule.target_teams)
    award = (rule.pool_cents * release_bp) // BP
    places = [(award * s) // BP for s in rule.place_shares_bp]
    remainder = award - sum(places)
    award -= remainder  # rounding remainder goes to the reserve
    reserve = rule.pool_cents - award
    steps = [
        Step("release", f"Release = min(100%, {eligible} eligible / {rule.target_teams} target) = {release_bp / 100:.2f}%", release_bp),
        Step("award-pool", f"Award pool = USD {money(rule.pool_cents)} x {release_bp / 100:.2f}% = USD {money(award)}", award),
        Step("reserve", f"Reserve = USD {money(rule.pool_cents)} - USD {money(award)} = USD {money(reserve)}, carried to the next event", reserve),
    ]
    for i, (share, cents) in enumerate(zip(rule.place_shares_bp, places), start=1):
        steps.append(Step(f"place-{i}", f"Place {i} = USD {money(award)} x {share / 100:.2f}% = USD {money(cents)}", cents))
    if remainder:
        steps.append(Step("rounding", f"Rounding remainder USD {money(remainder)} added to the reserve", remainder))
    return Derivation(eligible, release_bp, award, reserve, places, steps)


@dataclass(frozen=True)
class PayoutRequest:
    event_id: str
    rule_hash: str
    place: int
    team: str
    recipient: str
    asset: str
    amount_cents: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "rule_hash": self.rule_hash,
            "place": self.place,
            "team": self.team,
            "recipient": self.recipient,
            "asset": self.asset,
            "amount_cents": self.amount_cents,
        }

    @property
    def request_id(self) -> str:
        return sha256_hex(self.to_dict())


@dataclass
class Facts:
    """What the bridge knows about the world when a request is checked."""

    published_rule_hash: str | None
    eligible: int | None
    budget_left_cents: int
    seen_status: str | None  # None, or the status of an earlier line with the same request id
    place_paid_to: str | None  # recipient already paid for this place, if any
    recipient_active: bool
    recipient_trusts_asset: bool
    wants_other_chain: bool = False


@dataclass
class Check:
    name: str
    passed: bool
    reason: str


@dataclass
class Decision:
    allowed: bool
    route: str | None  # direct | claimable | cross-chain-sim
    checks: list[Check]
    expected_cents: int | None

    @property
    def failures(self) -> list[Check]:
        return [c for c in self.checks if not c.passed]


def decide(rule: Rule, req: PayoutRequest, facts: Facts) -> Decision:
    """The money gate. Mirrors (decide ...) in rules.metta."""
    checks: list[Check] = []
    expected: int | None = None

    checks.append(Check("rule-published", facts.published_rule_hash is not None, "the rule is recorded on chain" if facts.published_rule_hash else "no rule has been published for this event"))
    checks.append(Check("rule-version", req.rule_hash == rule.hash == facts.published_rule_hash, "request matches the published rule" if req.rule_hash == rule.hash == facts.published_rule_hash else "the request does not match the published rule"))
    checks.append(Check("eligibility-attested", facts.eligible is not None, "eligible teams were attested" if facts.eligible is not None else "the organiser has not attested eligible teams yet"))

    place_ok = 1 <= req.place <= len(rule.place_shares_bp)
    checks.append(Check("place-exists", place_ok, f"place {req.place} exists in the rule" if place_ok else f"the rule has no place {req.place}"))

    if facts.eligible is not None and place_ok:
        expected = derive(rule, facts.eligible).place_cents[req.place - 1]
        ok = req.amount_cents == expected
        checks.append(Check("place-amount", ok, f"USD {money(req.amount_cents)} is what the rule gives place {req.place}" if ok else f"the rule gives place {req.place} USD {money(expected)}, not USD {money(req.amount_cents)}"))
    else:
        checks.append(Check("place-amount", False, "the amount cannot be checked until eligibility is attested and the place exists"))

    ok = req.asset == rule.asset
    checks.append(Check("asset", ok, f"paid in {rule.asset}" if ok else f"the rule pays in {rule.asset}, not {req.asset}"))

    ok = req.amount_cents <= facts.budget_left_cents
    checks.append(Check("budget", ok, f"within the remaining award budget of USD {money(facts.budget_left_cents)}" if ok else f"over the remaining award budget of USD {money(facts.budget_left_cents)}"))

    ok = facts.seen_status is None
    checks.append(Check("not-duplicate", ok, "this request has not been seen before" if ok else f"this exact request already exists ({facts.seen_status})"))

    ok = facts.place_paid_to is None
    checks.append(Check("place-unpaid", ok, f"place {req.place} has not been paid" if ok else f"place {req.place} was already paid or held for {facts.place_paid_to}"))

    allowed = all(c.passed for c in checks)
    route = None
    if allowed:
        if not facts.recipient_active or not facts.recipient_trusts_asset:
            route = "claimable"
        elif facts.wants_other_chain:
            route = "cross-chain-sim"
        else:
            route = "direct"
    return Decision(allowed, route, checks, expected)


def route_after_failure(result_code: str) -> str | None:
    """What to do when the network rejects a payout. Mirrors (reroute ...) in rules.metta."""
    return {
        "op_no_destination": "claimable",
        "op_no_trust": "claimable",
        "op_not_authorized": "claimable",
        "tx_too_late": "re-propose",
        "tx_bad_seq": "re-propose",
    }.get(result_code)


FAILURE_TEXT = {
    "op_no_destination": "This wallet has never been activated on the network.",
    "op_no_trust": "This wallet cannot hold the prize asset yet.",
    "op_underfunded": "The fund does not hold enough to cover this payout.",
    "tx_bad_auth": "Only one of the two required signatures was present.",
    "tx_too_late": "The approval came after the time limit on this transaction.",
    "tx_bad_seq": "The fund's transaction sequence moved on; this transaction is out of date.",
    "tx_insufficient_fee": "The network fee offered was too low.",
}
