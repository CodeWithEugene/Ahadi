"""Python glue for the Ahadi Omega plugin.

Runs inside the Omega container as the unprivileged agent user, whose environment is
scrubbed. It holds no keys: it only fetches facts from, and hands MeTTa decisions to,
the Ahadi bridge on the internal network. Configuration comes from a read-only file
mounted at plugins/ahadi/ahadi.json ({"bridge_url": ..., "tool_secret": ...}).
"""

import json
import os
import urllib.error
import urllib.request

_HERE = os.path.dirname(os.path.abspath(__file__))
_CFG_PATHS = [os.path.join(_HERE, "ahadi.json"), "/run/ahadi/ahadi.json"]


def _cfg():
    for p in _CFG_PATHS:
        if os.path.exists(p):
            with open(p) as f:
                return json.load(f)
    return {"bridge_url": "http://bridge:8000", "tool_secret": ""}


def _s(v):
    """MeTTa strings arrive as Python str; symbols may arrive as other objects."""
    s = str(v)
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        s = s[1:-1]
    return s


_RECENT = {}
_SIDE_EFFECTS = {"propose", "request", "reroute", "carry-forward", "try-alone", "publish-rule"}


def _call(path, payload):
    # Guard: a side-effecting call repeated with identical arguments within 30 s returns the
    # first answer instead of acting twice (MeTTa evaluation may revisit a call).
    import time
    key = path + json.dumps(payload, sort_keys=True)
    if path in _SIDE_EFFECTS and key in _RECENT and time.time() - _RECENT[key][0] < 30:
        return _RECENT[key][1]
    out = _call_bridge(path, payload)
    if path in _SIDE_EFFECTS:
        _RECENT[key] = (time.time(), out)
    return out


def _call_bridge(path, payload):
    cfg = _cfg()
    req = urllib.request.Request(
        cfg["bridge_url"].rstrip("/") + "/tools/" + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-Ahadi-Tool-Secret": cfg.get("tool_secret", "")},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"text": f"bridge error {e.code}"}
        return {"text": "ERROR: " + str(body.get("detail") or body.get("text") or body), "sexpr": "(error)"}
    except Exception as e:  # bridge unreachable
        return {"text": f"ERROR: Ahadi bridge unreachable ({e})", "sexpr": "(error)"}


def status(event):
    return _call("status", {"event_id": _s(event)})["text"]


def publish_rule(event):
    return _call("publish-rule", {"event_id": _s(event)})["text"]


def params(event):
    return _call("params", {"event_id": _s(event)})["sexpr"]


def report_derivation(event, eligible, award, reserve, places):
    return _call("derivation", {"event_id": _s(event), "eligible": int(eligible), "award_cents": int(award), "reserve_cents": int(reserve), "places": _s(places)})["text"]


def facts_for_place(event, place):
    return _call("facts", {"event_id": _s(event), "place": _s(place)})["sexpr"]


def propose_place(event, place, decision):
    return _call("propose", {"event_id": _s(event), "place": _s(place), "metta_decision": _s(decision)})["text"]


def facts_for_request(event, team, amount, wallet):
    return _call("facts", {"event_id": _s(event), "team": _s(team), "amount_usd": _s(amount), "wallet": _s(wallet)})["sexpr"]


def submit_request(event, team, amount, wallet, message, decision):
    return _call("request", {"event_id": _s(event), "team": _s(team), "amount_usd": _s(amount), "wallet": _s(wallet), "message": _s(message), "metta_decision": _s(decision)})["text"]


def try_alone(proposal):
    return _call("try-alone", {"proposal_id": _s(proposal)})["text"]


def failure_code(proposal):
    return _call("failure-code", {"proposal_id": _s(proposal)})["sexpr"]


def reroute(proposal, nxt):
    return _call("reroute", {"proposal_id": _s(proposal), "metta_route": _s(nxt)})["text"]


def carry_forward(frm, to):
    return _call("carry-forward", {"from_event": _s(frm), "to_event": _s(to)})["text"]


def quote(amount, chain):
    return _call("quote", {"amount_usd": _s(amount), "to_chain": _s(chain)})["text"]


def verify(h):
    return _call("verify", {"tx_hash": _s(h)})["text"]


def prompt_extension():
    with open(os.path.join(_HERE, "prompt_extension.txt")) as f:
        return f.read()
