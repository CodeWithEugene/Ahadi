"""In-process event hub: everything that happens is published here and streamed to the UI."""

from __future__ import annotations

import asyncio
import itertools
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any

# Ids keep increasing across bridge restarts, so a browser that reconnects never mistakes new events for old ones.
_counter = itertools.count(int(time.time() * 1000))


class Hub:
    def __init__(self, keep: int = 2000):
        self.history: deque[dict[str, Any]] = deque(maxlen=keep)
        self.subscribers: set[asyncio.Queue] = set()
        self.loop: asyncio.AbstractEventLoop | None = None
        self.lock = threading.Lock()

    def bind(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    def publish(self, kind: str, **data: Any) -> dict[str, Any]:
        ev = {"id": next(_counter), "kind": kind, "at": datetime.now(timezone.utc).isoformat(timespec="milliseconds"), **data}
        with self.lock:
            self.history.append(ev)
            subs = list(self.subscribers)
        if self.loop:
            for q in subs:
                self.loop.call_soon_threadsafe(q.put_nowait, ev)
        return ev

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        with self.lock:
            self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        with self.lock:
            self.subscribers.discard(q)

    def recent(self, after: int = 0, kinds: set[str] | None = None) -> list[dict[str, Any]]:
        with self.lock:
            return [e for e in self.history if e["id"] > after and (not kinds or e["kind"] in kinds)]


hub = Hub()
