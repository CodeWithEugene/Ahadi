"""Test harness: fake OpenAI-compatible LLM (scripted tool calls) + WebSocket chat server.

Lets the real Omega Docker image run its full loop with NO real API key:
  provider=OpenAIAPI openaiapi_url=http://host.docker.internal:8765/v1/
  commchannel=websocket WS_URL=ws://host.docker.internal:8766/ws
Every LLM request and every WS frame is appended to events.jsonl.
"""
import asyncio, json, threading, time, uuid, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import websockets

EVENTS = open(sys.argv[1] if len(sys.argv) > 1 else "events.jsonl", "a", buffering=1)

def ev(kind, **kw):
    kw.update(kind=kind, t=time.strftime("%H:%M:%S"))
    EVENTS.write(json.dumps(kw) + "\n")
    print(kind, json.dumps(kw)[:400], flush=True)

# Scripted plan: one step per LLM call after a human message arrives.
SCRIPT = [
    [("query", {"content": "P1 at_risk"})],
    [("pubmed-search", {"query": "hypertension pregnancy"}), ("risk-check", {"patient": "P1"})],
    [("send", {"content": "run2 done"})],
]
state = {"step": None}

class LLM(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        msgs = body.get("messages", [])
        last_user = [m for m in msgs if m["role"] == "user"]
        last_user = str(last_user[-1]["content"]) if last_user else ""
        tools = [t["function"]["name"] for t in body.get("tools", [])]
        tool_results = [str(m["content"])[:300] for m in msgs if m["role"] == "tool"]
        ev("llm_request", path=self.path, model=body.get("model"), n_msgs=len(msgs),
           tools=tools, last_user=last_user[:200], tool_results=tool_results,
           system_head=msgs[0]["content"][:300] if msgs else "")
        if ("Assess patient" in last_user) and state["step"] is None and not state.get("done"):
            state["step"] = 0
        if state["step"] is not None and state["step"] < len(SCRIPT):
            calls = SCRIPT[state["step"]]; state["step"] += 1
        else:
            if state["step"] is not None: state["done"] = True
            state["step"] = None
            calls = [("nop", {})]
        tc = [{"id": "call_" + uuid.uuid4().hex[:8], "type": "function",
               "function": {"name": n, "arguments": json.dumps(a)}} for n, a in calls]
        if body.get("tools"):
            msg = {"role": "assistant", "content": None, "tool_calls": tc}; fr = "tool_calls"
        else:  # v0.1.20 text protocol: one "toolName arg" per line
            msg = {"role": "assistant", "content": "\n".join((n + " " + " ".join(a.values())).strip() for n, a in calls)}; fr = "stop"
        resp = {"id": "chatcmpl-x", "object": "chat.completion", "created": int(time.time()),
                "model": body.get("model"), "choices": [{"index": 0, "finish_reason": fr, "message": msg}],
                "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2}}
        ev("llm_response", calls=calls)
        data = json.dumps(resp).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)

threading.Thread(target=lambda: ThreadingHTTPServer(("0.0.0.0", 8765), LLM).serve_forever(), daemon=True).start()

seq = 0
async def ws_handler(ws):
    global seq
    ev("ws_connect", headers=dict(ws.request.headers))
    async def sender():
        global seq
        await asyncio.sleep(20)
        seq += 1
        await ws.send(json.dumps({"type": "user_message", "seq": seq, "text": "Assess patient P1: BP 165/100, known hypertensive."}))
        ev("ws_user_message", seq=seq)
    asyncio.create_task(sender())
    async for raw in ws:
        f = json.loads(raw)
        ev("ws_frame_from_omega", frame=f)
        if f.get("type") == "agent_message":
            await ws.send(json.dumps({"type": "ack", "seq": None, "client_seq": f["client_seq"]}))

async def main():
    async with websockets.serve(ws_handler, "0.0.0.0", 8766):
        await asyncio.Future()

asyncio.run(main())
