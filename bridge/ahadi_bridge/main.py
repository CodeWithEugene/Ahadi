"""Ahadi bridge: FastAPI app.

- /api/*    REST for the web app (public reads; console writes need the passcode)
- /tools/*  endpoints the Omega plugin calls (internal network, shared secret)
- /omega    websocket server for Omega's `websocket` channel
- /api/stream  server-sent events: everything that happens, live
"""

from __future__ import annotations

import asyncio
import json
import re
from contextlib import asynccontextmanager
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from . import near, omega_log
from . import stellar_ops as so
from .config import ASSET_CODE, console_passcode, keys_meta, load_keys, tool_secret
from .engine import Engine, EngineError
from .events import hub
from .omega_ws import channel
from .rules import Facts, PayoutRequest, decide, derive, money
from .telegram_relay import relay

engine = Engine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    hub.bind(asyncio.get_running_loop())
    engine.bootstrap()
    async def resolver():
        while True:
            await asyncio.sleep(15)
            try:
                await asyncio.to_thread(engine.resolve_all_submitted)
            except Exception:
                pass

    tasks = [asyncio.create_task(omega_log.tail_log()), asyncio.create_task(resolver())]
    await relay.start()
    yield
    for t in tasks:
        t.cancel()


app = FastAPI(title="Ahadi API", version="0.1.0", lifespan=lifespan, docs_url="/api/docs", openapi_url="/api/openapi.json",
              description="Ahadi coordinates a prize fund with a SingularityNET Omega agent on Stellar testnet. Testnet only; no real money.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(EngineError)
async def engine_error(_: Request, e: EngineError):
    return JSONResponse({"error": e.code, "detail": str(e)}, status_code=e.status)


def console(x_ahadi_passcode: str | None = Header(default=None)) -> None:
    code = console_passcode()
    if code and x_ahadi_passcode != code:
        raise HTTPException(401, "console passcode required")


def tools_auth(x_ahadi_tool_secret: str | None = Header(default=None)) -> None:
    if x_ahadi_tool_secret != tool_secret():
        raise HTTPException(401, "tool secret required")


# =================================================================== public API
@app.get("/api/health")
def health() -> dict:
    meta = keys_meta()
    return {
        "ok": True,
        "network": "stellar-testnet",
        "asset": ASSET_CODE,
        "issuer": meta.get("issuer"),
        "accounts_created": meta.get("created"),
        "omega": {"connected": channel.connected, "connected_at": channel.connected_at, **omega_log.health()},
        "telegram": {"enabled": relay.enabled, "bot": relay.bot_username},
    }


@app.get("/api/events")
def events() -> list[dict]:
    out = []
    for ev in engine.store.events():
        t = engine.totals(ev["event_id"])
        out.append({"event_id": ev["event_id"], "name": ev["name"], "short": ev["data"].get("short"), "status": ev["status"], "cities": ev["data"].get("cities"),
                    "rule_hash": ev["rule_hash"], "pool_cents": ev["rule"]["pool_cents"], "totals": t, "fund": engine.fund_of(ev["event_id"])})
    return out


@app.get("/api/funds/{event_id}")
def fund(event_id: str) -> dict:
    return engine.fund_view(event_id)


@app.get("/api/funds/{event_id}/ledger.json")
def ledger_json(event_id: str) -> dict:
    v = engine.fund_view(event_id)
    return {"event": v["event"], "rule": v["rule"], "totals": v["totals"], "lines": v["lines"]}


@app.get("/api/funds/{event_id}/ledger.csv", response_class=PlainTextResponse)
def ledger_csv(event_id: str) -> str:
    rows = ["seq,time,kind,party,party_public,amount_usd,status_detail,tx_hash,receipt_url"]
    for ln in engine.fund_view(event_id)["lines"]:
        detail = (ln.get("detail") or {})
        note = detail.get("text") or detail.get("reason") or ""
        rows.append(",".join(json.dumps(str(x), ensure_ascii=False) for x in [ln["seq"], ln["created_at"], ln["kind"], ln["party"] or "", ln["party_public"] or "", money(ln["amount_cents"]), note, ln["tx_hash"] or "", ln.get("receipt_url", "")]))
    return "\n".join(rows) + "\n"


@app.get("/api/lines/{line_id}")
def line(line_id: str) -> dict:
    ln = engine.store.line(line_id)
    if not ln:
        raise HTTPException(404, "unknown line")
    out = engine._public_line(ln)
    if ln["proposal_id"]:
        out["proposal"] = engine.store.proposal(ln["proposal_id"])
    if ln["related_line"]:
        out["related"] = engine._public_line(engine.store.line(ln["related_line"]))
    ev = engine.store.event(ln["event_id"])
    if ev and ev["eligible"] is not None:
        out["derivation"] = engine.derivation(ln["event_id"])
    out["event_name"] = ev["name"] if ev else None
    return out


@app.get("/api/verify/{tx_hash}")
def verify(tx_hash: str) -> dict:
    if not re.fullmatch(r"[0-9a-fA-F]{64}", tx_hash):
        raise HTTPException(400, "a Stellar transaction hash is 64 hexadecimal characters")
    return engine.verify(tx_hash.lower())


@app.get("/api/proposals")
def proposals(event_id: str | None = None, status: str | None = None) -> list[dict]:
    return engine.store.proposals(event_id, status)


@app.get("/api/proposals/{pid}")
def proposal(pid: str) -> dict:
    return engine._proposal(pid)


@app.get("/api/activity")
def activity(after: int = 0) -> list[dict]:
    return hub.recent(after)


@app.get("/api/agent/memory")
def agent_memory() -> dict:
    return {"long_term": omega_log.long_term_memories(), "history_tail": omega_log.history_tail(12000)}


@app.get("/api/accounts")
def accounts() -> dict:
    keys = load_keys()
    roles = {"agent": "Ahadi agent (co-signer)", "organiser": "Organiser (co-signer)", "fund_e1": "October fund (2 of 2 vault)", "fund_e2": "December fund (2 of 2 vault)", "issuer": "Demo USD issuer", "sponsor": "Sponsor"}
    out = {r: {"label": label, "public": keys[r].public} for r, label in roles.items() if r in keys}
    out["winners"] = [{k: w[k] for k in ("place", "team", "person", "city", "public", "wallet_state")} for w in engine.winners()] if keys else []
    return out


@app.get("/api/stream")
async def stream(request: Request, after: int = 0):
    q = hub.subscribe()

    async def gen():
        try:
            for ev in hub.recent(after):
                yield {"event": "message", "id": str(ev["id"]), "data": json.dumps(ev, default=str)}
            while True:
                if await request.is_disconnected():
                    break
                try:
                    ev = await asyncio.wait_for(q.get(), timeout=15)
                    yield {"event": "message", "id": str(ev["id"]), "data": json.dumps(ev, default=str)}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "{}"}
        finally:
            hub.unsubscribe(q)

    return EventSourceResponse(gen())


# =================================================================== console (organiser)
class ChatIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    source: str = "console"
    author: str | None = None


@app.post("/api/chat", dependencies=[Depends(console)])
async def chat(body: ChatIn) -> dict:
    src = body.source if body.source in ("console", "telegram") else "console"
    return await channel.send(body.text, source=src, author=body.author)


class SignedIn(BaseModel):
    signed_xdr: str


class ReasonIn(BaseModel):
    reason: str = Field(default="Rejected by the organiser", max_length=300)


class AttestIn(BaseModel):
    eligible: int = Field(ge=0, le=10000)


@app.post("/api/proposals/{pid}/prepare", dependencies=[Depends(console)])
def prepare(pid: str) -> dict:
    return engine.prepare(pid)


@app.post("/api/proposals/{pid}/approve", dependencies=[Depends(console)])
def approve(pid: str, body: SignedIn) -> dict:
    return engine.approve(pid, body.signed_xdr)


@app.post("/api/proposals/{pid}/reject", dependencies=[Depends(console)])
def reject(pid: str, body: ReasonIn) -> dict:
    return engine.reject(pid, body.reason)


@app.post("/api/proposals/{pid}/try-alone", dependencies=[Depends(console)])
def try_alone(pid: str) -> dict:
    return engine.submit_alone(pid)


@app.post("/api/proposals/{pid}/reroute", dependencies=[Depends(console)])
def reroute(pid: str) -> dict:
    return engine.reroute(pid)


@app.post("/api/funds/{event_id}/deposit", dependencies=[Depends(console)])
def deposit(event_id: str) -> dict:
    return engine.deposit(event_id)


@app.post("/api/funds/{event_id}/rule", dependencies=[Depends(console)])
def propose_rule(event_id: str) -> dict:
    return engine.propose_rule(event_id, source="console")


@app.post("/api/funds/{event_id}/attest", dependencies=[Depends(console)])
def attest(event_id: str, body: AttestIn) -> dict:
    return engine.attest(event_id, body.eligible)


@app.post("/api/funds/{event_id}/carry/{to_event}", dependencies=[Depends(console)])
def carry(event_id: str, to_event: str) -> dict:
    return engine.propose_carry(event_id, to_event)


@app.get("/api/organiser-key/public")
def organiser_public() -> dict:
    return {"public": engine.pub("organiser")}


# =================================================================== tools for the Omega plugin
def _parse_usd(s: str) -> int | None:
    s = re.sub(r"[^\d.]", "", str(s))
    if not s:
        return None
    try:
        return int((Decimal(s) * 100).to_integral_value())
    except InvalidOperation:
        return None


def _request_from(body: dict) -> tuple[PayoutRequest, dict]:
    eid = body["event_id"]
    ev = engine._event(eid)
    rule = engine.rule(eid)
    if body.get("place") not in (None, ""):
        place = int(re.sub(r"\D", "", str(body["place"])) or 0)
        if place and ev["eligible"] is not None and any(p["place"] == place for p in ev["placements"] or []):
            return engine.request_for_place(eid, place), {}
        return PayoutRequest(eid, rule.hash, place, "unknown", "", rule.asset, 0), {"unknown_place": True}
    team = str(body.get("team", "")).strip().lower()
    pl = next((p for p in ev["placements"] or [] if team and (team in p["team"].lower() or p["team"].lower() in team)), None)
    amount = _parse_usd(body.get("amount_usd", "")) or 0
    wallet = str(body.get("wallet", "")).strip()
    if pl:
        recipient = wallet if (wallet and wallet != pl["public"] and len(wallet) == 56) else pl["public"]
        return PayoutRequest(eid, rule.hash, pl["place"], pl["team"], recipient, rule.asset, amount), {"wallet_changed": recipient != pl["public"]}
    return PayoutRequest(eid, rule.hash, 0, body.get("team") or "unknown", wallet, rule.asset, amount), {"unknown_team": True}


def _facts_sexpr(eid: str, req: PayoutRequest, flags: dict) -> tuple[str, Facts]:
    ev = engine._event(eid)
    rule = engine.rule(eid)
    f = engine.facts(eid, req) if req.place else Facts(ev["rule_hash"], ev["eligible"], 0, None, None, False, False)
    place_ok = 1 if (1 <= req.place <= len(rule.place_shares_bp) and not flags.get("unknown_team") and not flags.get("unknown_place")) else 0
    expected = derive(rule, ev["eligible"]).place_cents[req.place - 1] if (place_ok and ev["eligible"] is not None) else -1
    wallet_ok = not flags.get("wallet_changed")
    vals = [
        1 if f.published_rule_hash else 0,
        1 if (req.rule_hash == rule.hash == f.published_rule_hash) else 0,
        1 if f.eligible is not None else 0,
        place_ok if wallet_ok else 0,
        expected,
        req.amount_cents,
        1 if req.asset == rule.asset else 0,
        f.budget_left_cents,
        0 if f.seen_status is None else 1,
        0 if f.place_paid_to is None else 1,
        1 if f.recipient_active else 0,
        1 if f.recipient_trusts_asset else 0,
        1 if f.wants_other_chain else 0,
    ]
    return "(ahadi-facts " + " ".join(str(v) for v in vals) + ")", f


DEC = re.compile(r"\(ahadi-decision (\w+) ([\w-]+)")
FAIL = re.compile(r"\(ahadi-fail ([\w-]+)\)")


def _parse_metta(dec: str) -> dict:
    m = DEC.search(dec or "")
    return {"allowed": bool(m and m.group(1) == "allowed"), "route": (m.group(2) if m else None), "failed": sorted(set(FAIL.findall(dec or ""))), "raw": dec}


@app.post("/tools/status", dependencies=[Depends(tools_auth)])
def t_status(body: dict) -> dict:
    v = engine.fund_view(body["event_id"])
    t = v["totals"]
    ev = v["event"]
    open_p = [p for p in engine.store.proposals(body["event_id"]) if p["status"] == "proposed"]
    lines = [f"{v['event']['name']} ({ev['event_id']}), status {ev['status']}.",
             f"Rule hash {(ev['rule_hash'] or 'not recorded yet')[:16]}; recorded tx {(ev['rule_published_tx'] or 'none')[:16]}.",
             f"Eligible teams attested: {ev['eligible'] if ev['eligible'] is not None else 'not yet'}.",
             f"Received USD {money(t['received_cents'] + t['carried_in_cents'])}, paid USD {money(t['paid_cents'])}, held USD {money(t['held_cents'])}, carried out USD {money(t['carried_out_cents'])}, available USD {money(t['available_cents'])}; chain balance USD {money(t['chain_balance_cents'] or 0)}; balanced {t['balanced']}.",
             f"Open proposals waiting for the organiser: {len(open_p)}" + (": " + ", ".join(f"{p['id']} ({p['kind']} {(p['request'] or {}).get('team', '')})" for p in open_p) if open_p else "."),
             "Recent ledger: " + "; ".join(f"{l['kind']} {l['party'] or ''} USD {money(l['amount_cents'])}" + (f" tx {l['tx_hash'][:10]}" if l['tx_hash'] else "") for l in v["lines"][-8:])]
    hub.publish("tool", tool="ahadi-status", args=body, summary=lines[0])
    return {"text": "\n".join(lines)}


@app.post("/tools/publish-rule", dependencies=[Depends(tools_auth)])
def t_publish_rule(body: dict) -> dict:
    try:
        p = engine.propose_rule(body["event_id"], source="agent")
    except EngineError as e:
        return {"text": f"Not proposed: {e}"}
    hub.publish("tool", tool="ahadi-publish-rule", args=body, summary=f"Proposal {p['id']} to record the rule")
    return {"text": f"Proposal {p['id']} created: record rule hash {p['extra']['rule_hash'][:16]} on chain. Waiting for the organiser to approve and sign in the console."}


@app.post("/tools/params", dependencies=[Depends(tools_auth)])
def t_params(body: dict) -> dict:
    ev = engine._event(body["event_id"])
    rule = engine.rule(body["event_id"])
    if ev["eligible"] is None:
        return {"sexpr": "(error)", "text": "Eligibility not attested yet."}
    return {"sexpr": f"(ahadi-params {rule.pool_cents} {ev['eligible']} {rule.target_teams} ({' '.join(str(s) for s in rule.place_shares_bp)}))"}


@app.post("/tools/derivation", dependencies=[Depends(tools_auth)])
def t_derivation(body: dict) -> dict:
    eid = body["event_id"]
    rule = engine.rule(eid)
    py = derive(rule, int(body["eligible"]))
    metta_places = [int(x) for x in re.findall(r"-?\d+", body.get("places", ""))]
    agree = (py.award_cents == int(body["award_cents"]) and py.reserve_cents == int(body["reserve_cents"]) and py.place_cents == metta_places)
    hub.publish("derivation", event_id=eid, source="metta", eligible=py.eligible, award_cents=int(body["award_cents"]), reserve_cents=int(body["reserve_cents"]), places=metta_places, agrees_with_bridge=agree, steps=[s.__dict__ for s in py.steps])
    lines = [f"MeTTa derivation for {eid} ({'matches' if agree else 'DOES NOT match'} the bridge's check):",
             f"Release {py.release_bp / 100:.2f}% of USD {money(rule.pool_cents)} ({py.eligible} eligible of {rule.target_teams} target).",
             f"Award pool USD {money(int(body['award_cents']))}; reserve USD {money(int(body['reserve_cents']))} carried to the next event."]
    lines += [f"Place {i}: USD {money(c)}" for i, c in enumerate(metta_places, 1)]
    return {"text": "\n".join(lines)}


@app.post("/tools/facts", dependencies=[Depends(tools_auth)])
def t_facts(body: dict) -> dict:
    eid = body["event_id"]
    if engine._event(eid)["eligible"] is None:
        return {"sexpr": "(ahadi-facts 1 1 0 0 -1 0 1 0 0 0 0 0 0)"}
    req, flags = _request_from(body)
    sexpr, _ = _facts_sexpr(eid, req, flags)
    hub.publish("facts", event_id=eid, request=req.to_dict(), flags=flags, sexpr=sexpr)
    return {"sexpr": sexpr}


def _agree_and_act(body: dict, req: PayoutRequest, flags: dict, source: str, message: str | None) -> dict:
    eid = body["event_id"]
    metta = _parse_metta(body.get("metta_decision", ""))
    _, f = _facts_sexpr(eid, req, flags)
    py = decide(engine.rule(eid), req, f) if req.place and not any(flags.values()) else None
    py_allowed = bool(py and py.allowed)
    agree = (metta["allowed"] == py_allowed) and (not py_allowed or metta["route"] == py.route)
    hub.publish("decision", event_id=eid, request=req.to_dict(), metta=metta, bridge={"allowed": py_allowed, "route": py.route if py else None, "failed": [c.name for c in py.failures] if py else ["request-shape"]}, agree=agree, source=source, message=message)
    if metta["allowed"] and agree:
        out = engine.propose_payout(eid, req, source=source, message=message, metta=metta)
        p = out["proposal"]
        extra = ""
        if p["kind"] == "claimable":
            extra = " The wallet cannot receive yet, so the rule routes this to a held, claimable prize (30 days)."
        if (p["extra"] or {}).get("quote"):
            q = p["extra"]["quote"]
            extra = f" Simulated NEAR Intents dry quote to {q['to_chain']}: {q['amount_out']} USDC out, about {q['eta_seconds']} s (no funds move)."
        return {"text": f"MeTTa allowed it (route {metta['route']}). Proposal {p['id']}: USD {money(req.amount_cents)} to {req.team} (place {req.place}). Waiting for the organiser's approval.{extra}"}
    # refused (by MeTTa) or the two checks disagree: record it, never propose
    reasons = []
    if py:
        reasons = [c.reason for c in py.failures]
    if flags.get("unknown_team"):
        reasons.append(f"no winning team matches '{req.team}'")
    if flags.get("wallet_changed"):
        reasons.append("the wallet differs from the one registered for this team, so the rule will not pay it")
    if flags.get("unknown_place"):
        reasons.append("that place does not exist or is not attested")
    if not agree:
        reasons.append("MeTTa and the bridge disagreed, so nothing was signed")
    seen = py and any(c.name == "not-duplicate" and not c.passed for c in py.checks)
    if seen:
        original = engine.store.line_by_request(req.request_id)
        line = engine.store.add_line(eid, "duplicate", party=req.team, party_public=req.recipient, request_id=req.request_id, related_line=original["id"] if original else None,
                                     detail={"reason": "This exact request was already handled.", "original_tx": original["tx_hash"] if original else None, "message": message, "source": source, "metta": metta})
        hub.publish("ledger", event_id=eid, line=engine._public_line(line))
        tx = original["tx_hash"] if original else None
        return {"text": f"Duplicate: {req.team}'s place {req.place} prize of USD {money(original['amount_cents'] if original else req.amount_cents)} was already {original['kind'] if original else 'handled'}." + (f" Original receipt: https://stellar.expert/explorer/testnet/tx/{tx}" if tx else "") + " Nothing new was proposed."}
    line = engine.store.add_line(eid, "rejected", party=req.team, party_public=req.recipient or None, request_id=req.request_id if req.place else None,
                                 detail={"reason": "; ".join(reasons) or "the rule does not allow this request", "requested_cents": req.amount_cents, "message": message, "source": source, "metta": metta})
    hub.publish("ledger", event_id=eid, line=engine._public_line(line))
    return {"text": "Refused by the funding rule (MeTTa): " + ("; ".join(reasons) or ", ".join(metta["failed"])) + ". Recorded on the ledger as rejected. Nothing was signed."}


@app.post("/tools/propose", dependencies=[Depends(tools_auth)])
def t_propose(body: dict) -> dict:
    req, flags = _request_from(body)
    return _agree_and_act(body, req, flags, "agent", None)


@app.post("/tools/request", dependencies=[Depends(tools_auth)])
def t_request(body: dict) -> dict:
    req, flags = _request_from(body)
    return _agree_and_act(body, req, flags, "message", body.get("message"))


@app.post("/tools/try-alone", dependencies=[Depends(tools_auth)])
def t_try_alone(body: dict) -> dict:
    r = engine.submit_alone(body["proposal_id"])
    return {"text": f"Submitted proposal {body['proposal_id']} with only my signature. Stellar answered {r['code']}: {r['text']} Nothing moved and no fee was charged."}


@app.post("/tools/failure-code", dependencies=[Depends(tools_auth)])
def t_failure_code(body: dict) -> dict:
    p = engine._proposal(body["proposal_id"])
    return {"sexpr": ((p.get("result") or {}).get("code") or "none")}


@app.post("/tools/reroute", dependencies=[Depends(tools_auth)])
def t_reroute(body: dict) -> dict:
    route = str(body.get("metta_route", "")).strip()
    if route != "claimable":
        return {"text": f"MeTTa says the next step for this failure is {route or 'nothing'}, not a held prize."}
    np = engine.reroute(body["proposal_id"])
    r = np["request"]
    return {"text": f"Proposal {np['id']}: hold USD {money(r['amount_cents'])} for {r['team']} as a claimable balance for 30 days, returnable to the fund if unclaimed. Waiting for the organiser."}


@app.post("/tools/carry-forward", dependencies=[Depends(tools_auth)])
def t_carry(body: dict) -> dict:
    try:
        p = engine.propose_carry(body["from_event"], body["to_event"])
    except EngineError as e:
        return {"text": f"Not proposed: {e}"}
    return {"text": f"Proposal {p['id']}: carry USD {money(p['request']['amount_cents'])} from {body['from_event']} to {body['to_event']}, memo = the October rule hash. Waiting for the organiser."}


@app.post("/tools/quote", dependencies=[Depends(tools_auth)])
def t_quote(body: dict) -> dict:
    cents = _parse_usd(body.get("amount_usd", "")) or 0
    chain = str(body.get("to_chain", "solana")).lower()
    if chain not in near.DEST:
        return {"text": f"Only solana is configured for simulated quotes, not {chain}."}
    q = near.dry_quote(cents, chain)
    hub.publish("tool", tool="ahadi-quote", args=body, result=q)
    return {"text": f"Simulated NEAR Intents dry quote ({q['source']}): USD {money(cents)} USDC on Stellar to {q['amount_out']} USDC on {chain}, minimum {q['min_amount_out']}, about {q['eta_seconds']} s, correlation {q['correlation_id']}. No funds move."}


@app.post("/tools/verify", dependencies=[Depends(tools_auth)])
def t_verify(body: dict) -> dict:
    h = str(body.get("tx_hash", "")).strip().lower()
    if not re.fullmatch(r"[0-9a-f]{64}", h):
        return {"text": "That is not a Stellar transaction hash (64 hex characters)."}
    v = engine.verify(h)
    if not v["found_on_chain"]:
        return {"text": "Not found on Stellar testnet."}
    checks = "; ".join(f"{c['text']}" for c in v["checks"]) or "no ledger line for it"
    return {"text": f"Found on testnet in ledger {v['tx']['ledger']}. {checks}. Receipt: {v['receipt_url']}"}


@app.websocket("/omega")
async def omega_ws(ws: WebSocket):
    await channel.handle(ws)
