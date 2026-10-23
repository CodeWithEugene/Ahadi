"""Make Omega visible: tail its structured log and episodic history, read its long-term memory.

Omega logs `YYYY-MM-DD HH:MM:SS | LEVEL | module | message`; our logging.conf adds a file
handler writing to memory/omega.log, which the bridge reads from the shared memory folder.
"""

from __future__ import annotations

import asyncio
import os
import re
import sqlite3
from pathlib import Path

from .config import ROOT
from .events import hub

MEMORY_DIR = Path(os.getenv("OMEGA_MEMORY_DIR", ROOT / ".data" / "omega-memory"))
LOG_FILE = MEMORY_DIR / "omega.log"
HISTORY_FILE = MEMORY_DIR / "history.metta"

LINE = re.compile(r"^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) \| (\w+)\s*\| ([\w.-]+) \| (.*)$")
ITER = re.compile(r"iteration (\d+)")
CALL = re.compile(r"LLMToolCall\[id='[^']*',\s*name='([^']+)',\s*arguments=(\{.*?\}),\s*error=")
RET = re.compile(r'COMMAND_RETURN: \(\((\S+)(.*?)\) "(SUCCESS, RETURN: |ALERT_FAILED)?(.*)"\)\)?\s*$', re.S)
USAGE = re.compile(r"\[LLM_USAGE\] (.*)")
SKILL = re.compile(r"Add skill: (.*)")
STATE = {"skills": {}, "last_cycle": None, "provider": None, "model": None, "version": None, "cycles": 0, "tokens_in": 0, "tokens_out": 0}


def _classify(module: str, msg: str) -> dict | None:
    if m := ITER.search(msg):
        STATE["last_cycle"] = int(m.group(1))
        STATE["cycles"] += 1
        return {"category": "cycle", "n": int(m.group(1))}
    if "LLMToolCall[" in msg:
        calls = [{"name": n, "arguments": a[:600]} for n, a in CALL.findall(msg)]
        if calls:
            return {"category": "decision", "calls": calls}
    if msg.startswith("(COMMAND_RETURN:") or msg.startswith("COMMAND_RETURN:"):
        body = msg.strip("()")
        m = RET.search(msg)
        skill = m.group(1) if m else body.split()[1].strip("(") if len(body.split()) > 1 else "?"
        ok = not ("ALERT_FAILED" in msg or "ERROR" in msg[:400])
        text = (m.group(4) if m else body)[:1500]
        return {"category": "result", "skill": skill, "ok": ok, "text": text}
    if m := USAGE.search(msg):
        kv = dict(p.split("=", 1) for p in m.group(1).split() if "=" in p)
        STATE["provider"] = kv.get("provider", STATE["provider"])
        STATE["model"] = kv.get("model", STATE["model"])
        try:
            STATE["tokens_in"] += int(kv.get("prompt_tokens", 0))
            STATE["tokens_out"] += int(kv.get("completion_tokens", 0))
        except ValueError:
            pass
        return {"category": "usage", **{k: kv.get(k) for k in ("provider", "model", "prompt_tokens", "completion_tokens", "finish_reason")}}
    if m := SKILL.search(msg):
        text = m.group(1)
        name = text.rsplit(": ", 1)[-1].split(" ")[0] if ": " in text else text
        STATE["skills"][name] = text
        return {"category": "skill", "name": name, "text": text[:300]}
    if msg.startswith("Omega main@") or msg.startswith('"Omega '):
        STATE["version"] = msg.strip('"')[:200]
    return None


async def tail_log() -> None:
    """Follow omega.log forever, publishing classified events."""
    pos = 0
    while True:
        try:
            if LOG_FILE.exists():
                size = LOG_FILE.stat().st_size
                if size < pos:
                    pos = 0  # rotated or recreated
                if size > pos:
                    with LOG_FILE.open("r", encoding="utf-8", errors="replace") as f:
                        f.seek(pos)
                        chunk = f.read()
                        pos = f.tell()
                    for raw in chunk.splitlines():
                        m = LINE.match(raw)
                        if not m:
                            continue
                        ts, level, module, msg = m.groups()
                        ev = _classify(module, msg)
                        if ev and ev.get("category") in ("decision", "result"):
                            sig = (ev.get("category"), str(ev.get("calls") or ev.get("text"))[:300])
                            if sig == STATE.get("_last_sig"):
                                continue  # the same line logged twice by two handlers
                            STATE["_last_sig"] = sig
                        if ev:
                            hub.publish("omega_log", ts=ts, level=level, module=module, **ev)
        except Exception:
            pass
        await asyncio.sleep(0.5)


def skip_to_end() -> None:
    """On bridge start, earlier log lines are history, not news."""
    pass


def history_tail(chars: int = 20000) -> str:
    if not HISTORY_FILE.exists():
        return ""
    data = HISTORY_FILE.read_text(encoding="utf-8", errors="replace")
    return data[-chars:]


def long_term_memories(limit: int = 200) -> list[dict]:
    """Read Omega's ChromaDB documents (read-only)."""
    out: list[dict] = []
    for db in MEMORY_DIR.rglob("chroma.sqlite3"):
        try:
            con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
            rows = con.execute(
                "select e.id, m.string_value from embedding_metadata m join embeddings e on e.id = m.id where m.key = 'chroma:document' order by e.id desc limit ?",
                (limit,),
            ).fetchall()
            for rid, doc in rows:
                ts = None
                tsr = con.execute("select string_value from embedding_metadata where id=? and key in ('timestamp','time')", (rid,)).fetchone()
                if tsr:
                    ts = tsr[0]
                out.append({"id": rid, "text": doc, "time": ts})
            con.close()
        except Exception:
            continue
    return out


def health() -> dict:
    alive = LOG_FILE.exists()
    return {"log_present": alive, **{k: v for k, v in STATE.items() if k not in ("skills", "_last_sig")}, "skills": sorted(STATE["skills"].keys())}
