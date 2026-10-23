"""Ahadi's payout engine: the money workflow the Omega agent drives through its skills.

Flow per payout: request -> check (rule) -> proposal -> prepare (agent signs a fresh
transaction) -> organiser signs -> submit -> settled or failed -> ledger line.
Transactions are built at approval time, so pending proposals never collide on the
fund's sequence number and never expire while waiting.
"""

from __future__ import annotations

import json
import os
from typing import Any

from . import near
from . import stellar_ops as so
from .config import ASSET_CODE, EXPLORER_TX, SCENARIO_FILE, load_keys, keys_meta
from .events import hub
from .ledger import Store, now
from .rules import FAILURE_TEXT, Facts, PayoutRequest, Rule, decide, derive, money, route_after_failure, sha256_hex

PREPARE_WINDOW_S = int(os.getenv("AHADI_SIGN_WINDOW_S", "600"))


class EngineError(Exception):
    def __init__(self, message: str, code: str = "bad_request", status: int = 400):
        super().__init__(message)
        self.code, self.status = code, status


class Engine:
    def __init__(self, store: Store | None = None):
        self.store = store or Store()
        self.scenario = json.loads(SCENARIO_FILE.read_text())

    # ------------------------------------------------------------------ setup
    @property
    def keys(self):
        return load_keys()

    def pub(self, role: str) -> str:
        return self.keys[role].public

    @property
    def issuer(self) -> str:
        return keys_meta().get("issuer") or self.pub("issuer")

    def bootstrap(self) -> None:
        """Load the scenario's events into the store (idempotent)."""
        for ev in self.scenario["events"]:
            if not self.store.event(ev["event_id"]):
                self.store.upsert_event(ev["event_id"], ev["name"], ev)
                self.store.update_event(ev["event_id"], rule=ev["rule"], status="draft")

    def fund_of(self, event_id: str) -> str:
        return self.pub(self._event(event_id)["data"]["fund_role"])

    def _event(self, event_id: str) -> dict:
        ev = self.store.event(event_id)
        if not ev:
            raise EngineError(f"unknown event {event_id}", "not_found", 404)
        return ev

    def rule(self, event_id: str) -> Rule:
        return Rule.from_dict(self._event(event_id)["rule"])

    def winners(self) -> list[dict]:
        out = []
        for w in self.scenario["winners"]:
            out.append({**w, "public": self.pub(w["wallet_role"])})
        return out

    # ------------------------------------------------------------------ views
    def totals(self, event_id: str) -> dict:
        received = carried_in = paid = held = carried_out = returned = 0
        fee = 0
        for ln in self.store.lines(event_id):
            k, a = ln["kind"], ln["amount_cents"]
            fee += ln["fee_stroops"] or 0
            if k == "received":
                received += a
            elif k == "carried_in":
                carried_in += a
            elif k == "paid":
                paid += a
            elif k == "held":
                held += a
            elif k == "carried_out":
                carried_out += a
            elif k == "returned":
                returned += a
        inflow = received + carried_in + returned
        available = inflow - paid - held - carried_out
        chain = None
        try:
            chain = so.balance_cents(self.fund_of(event_id), self.issuer)
        except Exception:
            pass
        return {
            "received_cents": received,
            "carried_in_cents": carried_in,
            "paid_cents": paid,
            "held_cents": held,
            "carried_out_cents": carried_out,
            "returned_cents": returned,
            "available_cents": available,
            "network_fee_stroops": fee,
            "chain_balance_cents": chain,
            "balanced": chain is not None and chain == available,
        }

    def fund_view(self, event_id: str) -> dict:
        ev = self._event(event_id)
        rule = self.rule(event_id)
        der = derive(rule, ev["eligible"]) if ev["eligible"] is not None else None
        return {
            "event": {k: ev[k] for k in ("event_id", "name", "status", "eligible", "rule_hash", "rule_published_tx")} | {
                "cities": ev["data"].get("cities", []),
                "short": ev["data"].get("short"),
                "registered": ev["data"].get("registered"),
                "fund": self.fund_of(event_id),
                "asset": ASSET_CODE,
                "issuer": self.issuer,
            },
            "rule": rule.to_dict() | {"hash": rule.hash},
            "derivation": _derivation_dict(der) if der else None,
            "placements": ev["placements"],
            "totals": self.totals(event_id),
            "lines": [self._public_line(ln) for ln in self.store.lines(event_id)],
        }

    def _public_line(self, ln: dict) -> dict:
        out = dict(ln)
        if ln.get("tx_hash"):
            out["receipt_url"] = EXPLORER_TX + ln["tx_hash"]
            out["horizon_url"] = f"{so.HORIZON_URL}/transactions/{ln['tx_hash']}"
        return out

    # ------------------------------------------------------------------ steps
    def deposit(self, event_id: str) -> dict:
        """The sponsor funds the event (the 'Received' line). Sponsor signs alone: it is the sponsor's money."""
        if any(l["kind"] == "received" for l in self.store.lines(event_id)):
            raise EngineError("this event's sponsor deposit is already recorded", "duplicate")
        rule = self.rule(event_id)
        sponsor = self.keys["sponsor"]
        memo = sha256_hex({"deposit": event_id, "rule_hash": rule.hash, "amount_cents": rule.pool_cents})
        xdr = so.build_payment(sponsor.public, self.fund_of(event_id), self.issuer, rule.pool_cents, memo)
        res = so.submit(so.sign_xdr(xdr, sponsor.secret))
        if not res.ok:
            raise EngineError(f"deposit failed: {res.code}", "chain_error", 502)
        line = self.store.add_line(event_id, "received", amount_cents=rule.pool_cents, party=self.scenario["sponsor"]["name"], party_public=sponsor.public, tx_hash=res.hash, fee_stroops=res.fee_charged, detail={"memo": memo})
        hub.publish("ledger", event_id=event_id, line=self._public_line(line))
        return line

    def propose_rule(self, event_id: str, source: str = "agent") -> dict:
        ev = self._event(event_id)
        if ev["rule_published_tx"]:
            raise EngineError("the rule for this event is already recorded on chain", "duplicate")
        existing = [p for p in self.store.proposals(event_id) if p["kind"] == "rule" and p["status"] in ("proposed", "submitted")]
        if existing:
            return existing[0]
        rule = self.rule(event_id)
        p = self.store.add_proposal(event_id, "rule", request=rule.to_dict(), request_id="rule:" + rule.hash, decision={"allowed": True, "route": "manage-data", "checks": [{"name": "rule-valid", "passed": True, "reason": "shares add to 100%, places are ordered, pool and target are positive"}]}, extra={"source": source, "rule_hash": rule.hash, "summary": f"Record the {rule.name} rule on chain"})
        hub.publish("proposal", event_id=event_id, proposal=p)
        return p

    def attest(self, event_id: str, eligible: int, placements: list[dict] | None = None) -> dict:
        ev = self._event(event_id)
        if not ev["rule_published_tx"]:
            raise EngineError("publish and record the rule before attesting eligibility", "rule_not_published", 409)
        if ev["eligible"] is not None:
            raise EngineError("eligibility for this event is already attested", "duplicate")
        if eligible < 0 or eligible > 10_000:
            raise EngineError("eligible teams must be between 0 and 10,000")
        if placements is None:
            placements = [{k: w[k] for k in ("place", "team", "person", "city", "public", "wants_other_chain") if k in w} for w in self.winners()]
        rule = self.rule(event_id)
        if len(placements) > len(rule.place_shares_bp):
            raise EngineError(f"the rule has {len(rule.place_shares_bp)} places, not {len(placements)}")
        self.store.update_event(event_id, eligible=eligible, placements=placements, status="paying")
        der = derive(rule, eligible)
        line = self.store.add_line(event_id, "attested", amount_cents=der.award_cents, party=self.scenario["organiser"]["name"], detail={"eligible": eligible, "target": rule.target_teams, "release_bp": der.release_bp, "award_cents": der.award_cents, "reserve_cents": der.reserve_cents})
        hub.publish("ledger", event_id=event_id, line=self._public_line(line))
        return {"eligible": eligible, "derivation": _derivation_dict(der), "line": line}

    def derivation(self, event_id: str) -> dict:
        ev = self._event(event_id)
        if ev["eligible"] is None:
            raise EngineError("eligibility has not been attested yet", "not_attested", 409)
        return _derivation_dict(derive(self.rule(event_id), ev["eligible"]))

    def request_for_place(self, event_id: str, place: int) -> PayoutRequest:
        ev = self._event(event_id)
        if ev["eligible"] is None:
            raise EngineError("eligibility has not been attested yet", "not_attested", 409)
        rule = self.rule(event_id)
        pl = next((p for p in ev["placements"] or [] if p["place"] == place), None)
        if not pl:
            raise EngineError(f"no team holds place {place}", "not_found", 404)
        amount = derive(rule, ev["eligible"]).place_cents[place - 1]
        return PayoutRequest(event_id, rule.hash, place, pl["team"], pl["public"], rule.asset, amount)

    def facts(self, event_id: str, req: PayoutRequest) -> Facts:
        ev = self._event(event_id)
        rule = self.rule(event_id)
        der = derive(rule, ev["eligible"]) if ev["eligible"] is not None else None
        spent = sum(l["amount_cents"] for l in self.store.lines(event_id) if l["kind"] in ("paid", "held"))
        pending = sum(p["request"]["amount_cents"] for p in self.store.proposals(event_id) if p["kind"] in ("payout", "claimable") and p["status"] in ("proposed", "submitted") and p["request"])
        budget = (der.award_cents if der else 0) - spent - pending
        seen = None
        prior_line = self.store.line_by_request(req.request_id)
        if prior_line:
            seen = f"{prior_line['kind']} on {prior_line['created_at'][:10]}"
        else:
            live = self.store.live_proposal_for_request(req.request_id)
            if live:
                seen = f"proposal {live['id']} is {live['status']}"
        place_paid = next((l["party"] for l in self.store.lines(event_id) if l["kind"] in ("paid", "held") and (l["detail"] or {}).get("place") == req.place and l["request_id"] != req.request_id), None)
        info = so.account_info(req.recipient) if _valid_public(req.recipient) else None
        trust = bool(info) and any(b.get("asset_code") == ASSET_CODE and b.get("asset_issuer") == self.issuer for b in info["balances"])
        pl = next((p for p in ev["placements"] or [] if p["place"] == req.place), {})
        return Facts(ev["rule_hash"], ev["eligible"], max(budget, 0), seen, place_paid, bool(info), trust, bool(pl.get("wants_other_chain")))

    def check(self, event_id: str, req: PayoutRequest) -> dict:
        decision = decide(self.rule(event_id), req, self.facts(event_id, req))
        return _decision_dict(decision, req)

    def propose_payout(self, event_id: str, req: PayoutRequest, source: str = "agent", message: str | None = None, force_direct: bool = False, metta: dict | None = None) -> dict:
        """Run the rule; if it allows the request, queue a proposal. Otherwise record why not."""
        d = self.check(event_id, req)
        if not d["allowed"]:
            failed = {c["name"] for c in d["checks"] if not c["passed"]}
            if "not-duplicate" in failed:
                original = self.store.line_by_request(req.request_id)
                line = self.store.add_line(event_id, "duplicate", amount_cents=0, party=req.team, party_public=req.recipient, request_id=req.request_id, related_line=original["id"] if original else None, detail={"reason": "This exact request was already handled.", "original_tx": original["tx_hash"] if original else None, "message": message, "source": source, "checks": d["checks"]})
            else:
                line = self.store.add_line(event_id, "rejected", amount_cents=0, party=req.team, party_public=req.recipient, request_id=req.request_id, detail={"reason": "; ".join(c["reason"] for c in d["checks"] if not c["passed"]), "requested_cents": req.amount_cents, "message": message, "source": source, "checks": d["checks"]})
            hub.publish("ledger", event_id=event_id, line=self._public_line(line))
            return {"proposed": False, "decision": d, "line": self._public_line(line)}
        extra = {"source": source, "message": message, "derivation_step": f"place-{req.place}", "metta": metta}
        kind = "payout"
        if d["route"] == "cross-chain-sim":
            extra["quote"] = near.dry_quote(req.amount_cents, "solana")
            hub.publish("tool", tool="near-dry-quote", event_id=event_id, result=extra["quote"])
        if d["route"] == "claimable" and not force_direct:
            kind = "claimable"
        if force_direct and d["route"] == "claimable":
            extra["forced_direct"] = True
            extra["warning"] = "Pre-flight found this wallet cannot receive yet; the organiser asked to try a direct payment anyway."
        p = self.store.add_proposal(event_id, kind, request=req.to_dict(), request_id=req.request_id, decision=d, extra=extra)
        hub.publish("proposal", event_id=event_id, proposal=p)
        return {"proposed": True, "decision": d, "proposal": p}

    def propose_carry(self, from_event: str, to_event: str) -> dict:
        ev = self._event(from_event)
        open_items = [p for p in self.store.proposals(from_event) if p["status"] in ("proposed", "submitted") and p["kind"] != "carry"]
        if open_items:
            raise EngineError("settle or reject the open proposals before carrying the reserve forward", "open_proposals", 409)
        if any(l["kind"] == "carried_out" for l in self.store.lines(from_event)):
            raise EngineError("this event's reserve was already carried forward", "duplicate")
        t = self.totals(from_event)
        amount = t["available_cents"]
        if amount <= 0:
            raise EngineError("nothing left to carry forward")
        req = {"from_event": from_event, "to_event": to_event, "amount_cents": amount, "from_rule_hash": ev["rule_hash"], "asset": ASSET_CODE}
        rid = "carry:" + sha256_hex(req)
        live = self.store.live_proposal_for_request(rid)
        if live:
            return live
        p = self.store.add_proposal(from_event, "carry", request=req, request_id=rid, decision={"allowed": True, "route": "carry-forward", "checks": [
            {"name": "all-awards-settled", "passed": True, "reason": "no open proposals remain for this event"},
            {"name": "reserve", "passed": True, "reason": f"USD {money(amount)} is left after awards and held prizes"},
        ]}, extra={"summary": f"Carry USD {money(amount)} to {to_event}"})
        hub.publish("proposal", event_id=from_event, proposal=p)
        return p

    # ------------------------------------------------------------------ signing and settlement
    def prepare(self, pid: str) -> dict:
        """Build a fresh transaction for a proposal, re-check it, and sign it with the agent's key."""
        p = self._proposal(pid)
        if p["status"] not in ("proposed",):
            raise EngineError(f"proposal is {p['status']}", "bad_state", 409)
        ev = self._event(p["event_id"])
        fund = self.fund_of(p["event_id"])
        if p["kind"] in ("payout", "claimable"):
            req = PayoutRequest(**p["request"])
            d = decide(self.rule(p["event_id"]), req, self._facts_excluding(p))
            if not d.allowed:
                raise EngineError("the rule no longer allows this payout: " + "; ".join(c.reason for c in d.failures), "rule_refused", 409)
            if p["kind"] == "claimable":
                xdr, expiry = so.build_claimable(fund, req.recipient, self.issuer, req.amount_cents, req.request_id, self.rule(p["event_id"]).claim_window_days)
                self.store.update_proposal(pid, extra={**(p["extra"] or {}), "claim_expiry": expiry})
            else:
                xdr = so.build_payment(fund, req.recipient, self.issuer, req.amount_cents, req.request_id)
        elif p["kind"] == "rule":
            rule = self.rule(p["event_id"])
            xdr = so.build_manage_data(fund, f"rule:{p['event_id']}"[:64], rule.hash, rule.hash)
        elif p["kind"] == "carry":
            r = p["request"]
            xdr = so.build_payment(fund, self.fund_of(r["to_event"]), self.issuer, r["amount_cents"], r["from_rule_hash"] or "00" * 32)
        else:
            raise EngineError("unknown proposal kind")
        signed = so.sign_xdr(xdr, self.keys["agent"].secret)
        h = so.tx_hash(signed)
        self.store.update_proposal(pid, xdr=signed, tx_hash=h)
        hub.publish("signature", proposal_id=pid, signer="agent", tx_hash=h)
        return {"proposal_id": pid, "xdr": signed, "tx_hash": h, "network_passphrase": so.TESTNET_PASSPHRASE, "signed_by": ["agent"], "needs": ["organiser"], "ev": ev["event_id"]}

    def _facts_excluding(self, p: dict) -> Facts:
        """Facts for re-checking a pending proposal (it must not count as its own duplicate or budget)."""
        req = PayoutRequest(**p["request"])
        f = self.facts(p["event_id"], req)
        live = self.store.live_proposal_for_request(req.request_id)
        if live and live["id"] == p["id"]:
            f.seen_status = None if not self.store.line_by_request(req.request_id) else f.seen_status
            f.budget_left_cents += req.amount_cents
        return f

    def submit_alone(self, pid: str) -> dict:
        """The control demonstration: submit with only the agent's signature. Stellar must refuse."""
        prep = self.prepare(pid)
        res = so.submit(prep["xdr"])
        p = self._proposal(pid)
        line = self.store.add_line(p["event_id"], "control", party="Ahadi (agent only)", proposal_id=pid, detail={"code": res.code, "text": FAILURE_TEXT.get(res.code or "", "Submitted"), "ok": res.ok, "attempted_tx": res.hash, "fee_charged": 0})
        hub.publish("ledger", event_id=p["event_id"], line=self._public_line(line))
        return {"ok": res.ok, "code": res.code, "text": FAILURE_TEXT.get(res.code or ""), "attempted_tx": res.hash, "line": line}

    def approve(self, pid: str, signed_xdr: str) -> dict:
        p = self._proposal(pid)
        if p["status"] != "proposed":
            raise EngineError(f"this proposal is already {p['status']}", "bad_state", 409)
        if not p["xdr"]:
            raise EngineError("prepare the proposal before approving it", "bad_state", 409)
        if so.tx_hash(signed_xdr) != p["tx_hash"]:
            raise EngineError("the signed transaction is not the one the agent prepared", "tx_mismatch", 409)
        signers = set(so.signer_publics(signed_xdr, [self.pub("agent"), self.pub("organiser")]))
        if self.pub("organiser") not in signers:
            raise EngineError("the organiser's signature is missing", "missing_signature", 409)
        if self.pub("agent") not in signers:
            raise EngineError("the agent's signature is missing", "missing_signature", 409)
        # Persist the fully signed envelope before it leaves this machine: if the network drops,
        # we can always find out what happened by its hash and resend the identical envelope.
        if not self.store.claim(pid, "proposed", "submitted"):
            raise EngineError("this proposal is already being submitted", "bad_state", 409)
        self.store.update_proposal(pid, xdr=signed_xdr)
        hub.publish("signature", proposal_id=pid, signer="organiser", tx_hash=p["tx_hash"])
        return self.resolve_submitted(pid)

    def resolve_submitted(self, pid: str) -> dict:
        """Settle a submitted proposal safely: look it up by hash first, resend the same envelope only if unseen."""
        p = self._proposal(pid)
        if p["status"] != "submitted":
            return {"ok": p["status"] == "settled", "status": p["status"]}
        try:
            tx = so.lookup(p["tx_hash"])
            if tx and tx.get("successful"):
                return self._settle(pid, so.SubmitResult(True, p["tx_hash"], tx.get("ledger"), int(tx.get("fee_charged") or 0)))
            res = so.submit(p["xdr"])
            if not res.ok and so.lookup(res.hash):
                res.ok = True  # it landed; never resend a different transaction
            return self._settle(pid, res)
        except Exception as e:  # network trouble: the outcome is unknown, so nothing is decided yet
            hub.publish("network", proposal_id=pid, tx_hash=p["tx_hash"], text=f"Stellar could not be reached ({type(e).__name__}). The signed transaction is saved and will be checked by its hash.")
            return {"ok": False, "code": "network_unknown", "pending": True, "text": "Stellar could not be reached. The signed transaction is saved; Ahadi will check it by its hash and finish it without paying twice.", "proposal": p}

    def resolve_all_submitted(self) -> int:
        n = 0
        for p in self.store.proposals(status="submitted"):
            r = self.resolve_submitted(p["id"])
            n += 0 if r.get("pending") else 1
        return n

    def approve_with_demo_signer(self, pid: str) -> dict:
        """Tests and scripted scenario runs only (AHADI_DEMO_ORGANISER_SIGNER=1)."""
        org = self.keys["organiser"]
        if not org.secret:
            raise EngineError("the organiser signs in the browser; demo signer disabled", "forbidden", 403)
        prep = self.prepare(pid)
        return self.approve(pid, so.sign_xdr(prep["xdr"], org.secret))

    def reject(self, pid: str, reason: str) -> dict:
        p = self._proposal(pid)
        if p["status"] != "proposed":
            raise EngineError(f"proposal is {p['status']}", "bad_state", 409)
        p = self.store.update_proposal(pid, status="rejected", result={"reason": reason, "by": "organiser"})
        req = p["request"] or {}
        line = self.store.add_line(p["event_id"], "rejected", party=req.get("team") or p["kind"], party_public=req.get("recipient"), request_id=p["request_id"], proposal_id=pid, detail={"reason": reason, "by": "organiser"})
        hub.publish("ledger", event_id=p["event_id"], line=self._public_line(line))
        return {"proposal": p, "line": line}

    def _settle(self, pid: str, res: so.SubmitResult) -> dict:
        p = self._proposal(pid)
        ev_id = p["event_id"]
        req = p["request"] or {}
        # Exactly one settlement per proposal, even if two processes resolve it at the same time.
        if not self.store.claim(pid, "submitted", "settling"):
            p = self._proposal(pid)
            return {"ok": p["status"] == "settled", "status": p["status"], "proposal": p, "already": True}
        if res.ok:
            p = self.store.update_proposal(pid, status="settled", result={"tx_hash": res.hash, "ledger": res.ledger, "fee": res.fee_charged})
            if p["kind"] == "rule":
                rule = self.rule(ev_id)
                self.store.update_event(ev_id, rule_hash=rule.hash, rule_published_tx=res.hash, status="registration")
                line = self.store.add_line(ev_id, "rule", party=self.scenario["organiser"]["name"], tx_hash=res.hash, fee_stroops=res.fee_charged, proposal_id=pid, request_id=p["request_id"], detail={"rule_hash": rule.hash, "data_key": f"rule:{ev_id}"})
            elif p["kind"] == "payout":
                line = self.store.add_line(ev_id, "paid", amount_cents=req["amount_cents"], party=req["team"], party_public=req["recipient"], request_id=p["request_id"], tx_hash=res.hash, fee_stroops=res.fee_charged, proposal_id=pid, detail={"place": req["place"], "quote": (p["extra"] or {}).get("quote")})
            elif p["kind"] == "claimable":
                ids = so.claimable_balance_ids(res.hash)
                line = self.store.add_line(ev_id, "held", amount_cents=req["amount_cents"], party=req["team"], party_public=req["recipient"], request_id=p["request_id"], tx_hash=res.hash, fee_stroops=res.fee_charged, proposal_id=pid, related_line=(p["extra"] or {}).get("failed_line"), detail={"place": req["place"], "balance_id": ids[0] if ids else None, "claim_expiry": (p["extra"] or {}).get("claim_expiry")})
            elif p["kind"] == "carry":
                line = self.store.add_line(ev_id, "carried_out", amount_cents=req["amount_cents"], party=self._event(req["to_event"])["name"], party_public=self.fund_of(req["to_event"]), tx_hash=res.hash, fee_stroops=res.fee_charged, proposal_id=pid, request_id=p["request_id"], detail={"from_rule_hash": req["from_rule_hash"]})
                inl = self.store.add_line(req["to_event"], "carried_in", amount_cents=req["amount_cents"], party=self._event(ev_id)["name"], party_public=self.fund_of(ev_id), tx_hash=res.hash, request_id=p["request_id"], related_line=line["id"], detail={"from_event": ev_id, "from_rule_hash": req["from_rule_hash"]})
                hub.publish("ledger", event_id=req["to_event"], line=self._public_line(inl))
                self.store.update_event(ev_id, status="closed")
            hub.publish("ledger", event_id=ev_id, line=self._public_line(line))
            return {"ok": True, "tx_hash": res.hash, "receipt_url": res.receipt_url, "line": self._public_line(line), "proposal": p}
        code = res.code or "unknown"
        p = self.store.update_proposal(pid, status="failed", result={"code": code, "tx_codes": res.tx_code, "op_codes": res.op_codes, "attempted_tx": res.hash})
        nxt = route_after_failure(code)
        line = self.store.add_line(ev_id, "failed", amount_cents=req.get("amount_cents", 0), party=req.get("team") or p["kind"], party_public=req.get("recipient"), request_id=p["request_id"], proposal_id=pid, detail={"code": code, "text": FAILURE_TEXT.get(code, "The network rejected this transaction."), "next": nxt, "place": req.get("place"), "attempted_tx": res.hash})
        hub.publish("ledger", event_id=ev_id, line=self._public_line(line))
        return {"ok": False, "code": code, "text": FAILURE_TEXT.get(code), "next": nxt, "line": self._public_line(line), "proposal": p}

    def reroute(self, pid: str) -> dict:
        """After a failed payout, propose holding the prize as a claimable balance."""
        p = self._proposal(pid)
        if p["status"] != "failed" or p["kind"] != "payout":
            raise EngineError("only a failed payout can be rerouted", "bad_state", 409)
        code = (p["result"] or {}).get("code")
        if route_after_failure(code) != "claimable":
            raise EngineError(f"a {code} failure is not fixed by holding the prize", "bad_route", 409)
        failed_line = next((l for l in self.store.lines(p["event_id"]) if l["proposal_id"] == pid and l["kind"] == "failed"), None)
        req = PayoutRequest(**p["request"])
        d = self.check(p["event_id"], req)
        np = self.store.add_proposal(p["event_id"], "claimable", request=req.to_dict(), request_id=req.request_id, decision=d, parent_id=pid, extra={"source": "agent", "reroute_of": pid, "failed_code": code, "failed_line": failed_line["id"] if failed_line else None})
        hub.publish("proposal", event_id=p["event_id"], proposal=np)
        return np

    # ------------------------------------------------------------------ verify
    def verify(self, tx_hash: str) -> dict:
        tx = so.lookup(tx_hash)
        line = self.store.line_by_tx(tx_hash)
        if not tx:
            return {"found_on_chain": False, "line": line}
        signers = []
        try:
            signers = so.signer_publics(tx["envelope_xdr"], [self.pub("agent"), self.pub("organiser")])
        except Exception:
            pass
        memo_hex = None
        if tx.get("memo_type") == "hash" and tx.get("memo"):
            import base64
            memo_hex = base64.b64decode(tx["memo"]).hex()
        checks = []
        if line:
            expected = line.get("request_id")
            if expected and ":" in expected:
                expected = (line.get("detail") or {}).get("from_rule_hash") or expected.split(":", 1)[1]
            if line["kind"] == "rule":
                expected = (line["detail"] or {}).get("rule_hash")
            if line["kind"] in ("carried_out", "carried_in"):
                expected = (line["detail"] or {}).get("from_rule_hash")
            if line["kind"] == "received":
                expected = (line["detail"] or {}).get("memo")
            checks.append({"name": "memo", "passed": memo_hex == expected, "text": "The memo on chain equals the request fingerprint in the ledger" if memo_hex == expected else "The memo does not match the ledger"})
            if line["kind"] in ("paid", "held", "rule", "carried_out", "carried_in"):
                both = set(signers) == {self.pub("agent"), self.pub("organiser")}
                checks.append({"name": "two-signatures", "passed": both, "text": "Signed by both the agent and the organiser" if both else "Missing one of the two signatures"})
        return {
            "found_on_chain": True,
            "tx": {k: tx.get(k) for k in ("hash", "ledger", "created_at", "source_account", "fee_charged", "memo_type", "successful", "operation_count")} | {"memo_hex": memo_hex},
            "signers": signers,
            "line": self._public_line(line) if line else None,
            "checks": checks,
            "receipt_url": EXPLORER_TX + tx_hash,
        }

    def _proposal(self, pid: str) -> dict:
        p = self.store.proposal(pid)
        if not p:
            raise EngineError(f"unknown proposal {pid}", "not_found", 404)
        return p


def _valid_public(s: str) -> bool:
    try:
        from stellar_sdk import StrKey
        return StrKey.is_valid_ed25519_public_key(s)
    except Exception:
        return False


def _derivation_dict(d) -> dict:
    return {
        "eligible": d.eligible,
        "release_bp": d.release_bp,
        "award_cents": d.award_cents,
        "reserve_cents": d.reserve_cents,
        "place_cents": d.place_cents,
        "steps": [{"rule": s.rule, "text": s.text, "value": s.value} for s in d.steps],
    }


def _decision_dict(d, req: PayoutRequest) -> dict:
    return {
        "allowed": d.allowed,
        "route": d.route,
        "expected_cents": d.expected_cents,
        "request": req.to_dict(),
        "request_id": req.request_id,
        "checks": [{"name": c.name, "passed": c.passed, "reason": c.reason} for c in d.checks],
        "decided_at": now(),
    }
