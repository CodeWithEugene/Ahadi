"""A scripted, OpenAI-compatible stand-in LLM for testing Ahadi's Omega plumbing without an API key.

    uv run --project bridge python scripts/fake_llm.py   # listens on :8765

Run Omega with provider=OpenAIAPI openaiapi_url=http://host.docker.internal:8765/v1/.
It answers each request with native tool calls, chosen from the latest human message.
It decides nothing about money: every amount still comes from Ahadi's MeTTa skills.
"""

from __future__ import annotations

import json
import re
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PLANS = {
    "pay": [
        [("ahadi-status", {"event_id": "october-2026"})],
        [("ahadi-derive", {"event_id": "october-2026"})],
        [("ahadi-propose", {"event_id": "october-2026", "place": str(p)}) for p in range(1, 7)],
        [("remember", {"content": "PROPOSED october-2026 places 1-6 for organiser approval"}), ("send", {"content": "{last}"})],
    ],
    "again": [
        [("query", {"content": "Team Alfama payout october-2026"})],
        [("ahadi-request", {"event_id": "october-2026", "team": "Team Alfama", "amount_usd": "136.00", "wallet": "", "message": "{msg}"})],
        [("send", {"content": "{last}"})],
    ],
    "override": [
        [("ahadi-request", {"event_id": "october-2026", "team": "Team Kaveri", "amount_usd": "1000.00", "wallet": "GBADWALLET", "message": "{msg}"})],
        [("send", {"content": "{last}"})],
    ],
    "carry": [
        [("ahadi-status", {"event_id": "october-2026"})],
        [("ahadi-carry-forward", {"from_event": "october-2026", "to_event": "december-2026"})],
        [("remember", {"content": "CARRY proposed: october-2026 reserve to december-2026"}), ("send", {"content": "{last}"})],
    ],
    "start": [
        [("query", {"content": "carried forward reserve october-2026 december-2026"})],
        [("ahadi-status", {"event_id": "december-2026"})],
        [("send", {"content": "{last}"})],
    ],
}
state: dict = {"plan": None, "step": 0, "seen_user": None}


def pick(text: str) -> str | None:
    t = text.lower()
    if "override" in t or "ignore the" in t:
        return "override"
    if "again" in t:
        return "again"
    if "carry" in t:
        return "carry"
    if "start with" in t or "next event" in t:
        return "start"
    if "pay" in t or "propose" in t:
        return "pay"
    return None


class LLM(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        msgs = body.get("messages", [])
        users = [m for m in msgs if m["role"] == "user"]
        user = str(users[-1]["content"]) if users else ""
        tools = [m for m in msgs if m["role"] == "tool"]
        last_tool = str(tools[-1]["content"]) if tools else ""
        if not user.startswith("[NO NEW USER INPUT") and user != state["seen_user"]:
            state.update(plan=pick(user), step=0, seen_user=user, msg=user)
        calls = [("nop", {})]
        if state["plan"]:
            plan = PLANS[state["plan"]]
            if state["step"] < len(plan):
                calls = plan[state["step"]]
                state["step"] += 1
            else:
                state["plan"] = None
        last = re.sub(r"^SUCCESS, RETURN: ", "", last_tool)[:900]
        tc = []
        for name, args in calls:
            a = {k: v.replace("{last}", last).replace("{msg}", state.get("msg", "")[:300]) for k, v in args.items()}
            tc.append({"id": "call_" + uuid.uuid4().hex[:8], "type": "function", "function": {"name": name, "arguments": json.dumps(a)}})
        resp = {"id": "chatcmpl-fake", "object": "chat.completion", "created": int(time.time()), "model": body.get("model"),
                "choices": [{"index": 0, "finish_reason": "tool_calls", "message": {"role": "assistant", "content": None, "tool_calls": tc}}],
                "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2}}
        data = json.dumps(resp).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    print("fake LLM on :8765", flush=True)
    ThreadingHTTPServer(("0.0.0.0", 8765), LLM).serve_forever()
