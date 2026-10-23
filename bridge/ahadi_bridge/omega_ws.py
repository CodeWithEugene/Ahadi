"""The websocket channel Omega connects to (Omega's built-in `websocket` channel is a client).

Protocol (singnet/Omega channels/wschat.py):
  server -> Omega : {"type":"user_message","seq":int,"text":str} | {"type":"ack",...}
  Omega -> server : {"type":"resume","last_seen_seq":int|null} | {"type":"agent_message","client_seq":str,"text":str}
"""

from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from .events import hub


class OmegaChannel:
    def __init__(self) -> None:
        self.ws: WebSocket | None = None
        self.seq = 0
        self.outbox: deque[dict[str, Any]] = deque(maxlen=200)  # every user_message ever sent, for resume
        self.connected_at: str | None = None
        self.lock = asyncio.Lock()
        self.pending: list[dict[str, Any]] = []  # sent while Omega was not connected

    @property
    def connected(self) -> bool:
        return self.ws is not None

    async def handle(self, ws: WebSocket) -> None:
        token = os.getenv("WS_TOKEN", "")
        auth = ws.headers.get("authorization", "")
        if token and auth != f"Bearer {token}":
            await ws.close(code=4401)
            return
        await ws.accept()
        self.ws = ws
        from .ledger import now

        self.connected_at = now()
        hub.publish("omega", status="connected")
        for m in self.pending:
            await ws.send_text(json.dumps(m))
        self.pending.clear()
        try:
            while True:
                raw = await ws.receive_text()
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                t = msg.get("type")
                if t == "resume":
                    last = msg.get("last_seen_seq")
                    # A fresh Omega process (last is None) starts clean: no replay of old conversations.
                    for m in list(self.outbox):
                        if last is not None and m["seq"] > last:
                            await ws.send_text(json.dumps(m))
                elif t == "agent_message":
                    text = str(msg.get("text", ""))
                    await ws.send_text(json.dumps({"type": "ack", "client_seq": msg.get("client_seq")}))
                    hub.publish("agent_message", text=text)
                    if text.startswith("Omega main@") or text.startswith("Omega version"):
                        from . import omega_log

                        omega_log.STATE["version"] = text[:200]
                    from .telegram_relay import relay

                    await relay.deliver(text)
        except WebSocketDisconnect:
            pass
        finally:
            if self.ws is ws:
                self.ws = None
            hub.publish("omega", status="disconnected")

    async def send(self, text: str, source: str = "console", author: str | None = None) -> dict[str, Any]:
        async with self.lock:
            self.seq += 1
            framed = text if source == "console" else f"[{source}{' @' + author if author else ''}] {text}"
            msg = {"type": "user_message", "seq": self.seq, "text": framed}
            self.outbox.append(msg)
            hub.publish("user_message", text=text, source=source, author=author, seq=self.seq)
            if self.ws:
                await self.ws.send_text(json.dumps(msg))
                return {"delivered": True, "seq": self.seq}
            self.pending.append(msg)
            return {"delivered": False, "seq": self.seq, "queued": True}


channel = OmegaChannel()
