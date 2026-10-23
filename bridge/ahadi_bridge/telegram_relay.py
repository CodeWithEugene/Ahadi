"""Telegram relay: one Omega process has one channel (websocket, to us), so the bridge
carries Telegram messages into that channel and posts Omega's replies back."""

from __future__ import annotations

import asyncio
import os

import httpx

from .events import hub


class TelegramRelay:
    def __init__(self) -> None:
        self.token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.offset = 0
        self.last_chat: int | None = None
        self.awaiting_reply = False
        self.task: asyncio.Task | None = None
        self.bot_username: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.token)

    def _url(self, method: str) -> str:
        return f"https://api.telegram.org/bot{self.token}/{method}"

    async def start(self) -> None:
        if not self.enabled:
            return
        async with httpx.AsyncClient(timeout=20) as c:
            try:
                me = (await c.get(self._url("getMe"))).json()
                self.bot_username = me.get("result", {}).get("username")
            except Exception:
                pass
        self.task = asyncio.create_task(self._poll())

    async def _poll(self) -> None:
        from .omega_ws import channel

        async with httpx.AsyncClient(timeout=40) as c:
            while True:
                try:
                    r = await c.get(self._url("getUpdates"), params={"offset": self.offset, "timeout": 25})
                    for u in r.json().get("result", []):
                        self.offset = u["update_id"] + 1
                        m = u.get("message") or {}
                        text = m.get("text")
                        if not text:
                            continue
                        self.last_chat = m["chat"]["id"]
                        who = (m.get("from") or {}).get("first_name") or "participant"
                        self.awaiting_reply = True
                        hub.publish("telegram_in", author=who, text=text)
                        await channel.send(text, source="telegram", author=who)
                except Exception:
                    await asyncio.sleep(3)

    async def deliver(self, text: str) -> None:
        if not (self.enabled and self.last_chat and self.awaiting_reply):
            return
        try:
            async with httpx.AsyncClient(timeout=20) as c:
                await c.post(self._url("sendMessage"), json={"chat_id": self.last_chat, "text": text, "disable_web_page_preview": True})
            hub.publish("telegram_out", text=text)
        except Exception:
            pass


relay = TelegramRelay()
