"""SQLite store for events, proposals and public ledger lines.

The chain is the receipt; this store is the index. Every money state is a line.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import DB_PATH

SCHEMA = """
create table if not exists events (
  event_id text primary key,
  name text not null,
  data text not null,
  rule text,
  rule_hash text,
  rule_published_tx text,
  eligible integer,
  placements text,
  status text not null default 'draft',
  created_at text not null
);
create table if not exists proposals (
  id text primary key,
  event_id text not null,
  kind text not null,              -- rule | payout | claimable | carry
  request text,
  request_id text,
  decision text,
  xdr text,
  tx_hash text,
  status text not null,            -- proposed | approved | submitted | settled | failed | expired | rejected
  result text,
  extra text,
  parent_id text,
  created_at text not null,
  updated_at text not null
);
create unique index if not exists proposals_request on proposals(request_id) where request_id is not null and status not in ('failed','expired','rejected');
create table if not exists lines (
  id text primary key,
  seq integer not null,
  event_id text not null,
  kind text not null,              -- rule | received | attested | paid | held | failed | rejected | duplicate | quote | carried_out | carried_in | control
  amount_cents integer not null default 0,
  party text,
  party_public text,
  request_id text,
  tx_hash text,
  fee_stroops integer,
  proposal_id text,
  related_line text,
  detail text,
  created_at text not null
);
create table if not exists kv (k text primary key, v text not null);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _j(v: Any) -> str | None:
    return None if v is None else json.dumps(v, ensure_ascii=False)


class _Rows:
    def __init__(self, rows):
        self.rows = rows

    def fetchone(self):
        return self.rows[0] if self.rows else None

    def fetchall(self):
        return self.rows

    def __iter__(self):
        return iter(self.rows)


class _LockedConn:
    """One SQLite connection shared by request threads: every statement runs under a lock
    and results are fully read before the lock is released."""

    def __init__(self, conn, lock):
        self.conn, self.lock = conn, lock

    def execute(self, sql, args=()):
        with self.lock:
            cur = self.conn.execute(sql, args)
            rows = _Rows(cur.fetchall())
            rows.rowcount = cur.rowcount
            return rows

    def executescript(self, sql):
        with self.lock:
            return self.conn.executescript(sql)


class Store:
    def __init__(self, path: Path = DB_PATH):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self.lock = threading.RLock()
        conn = sqlite3.connect(str(path), check_same_thread=False, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("pragma journal_mode=wal")
        self.db = _LockedConn(conn, self.lock)
        self.db.executescript(SCHEMA)

    # ---------- helpers ----------
    @staticmethod
    def _row(r: sqlite3.Row | None) -> dict[str, Any] | None:
        if r is None:
            return None
        d = dict(r)
        for k in ("data", "rule", "placements", "request", "decision", "result", "extra", "detail"):
            if k in d and d[k] is not None:
                d[k] = json.loads(d[k])
        return d

    def reset(self) -> None:
        with self.lock:
            self.db.executescript("delete from events; delete from proposals; delete from lines; delete from kv;")

    def kv_get(self, k: str, default: Any = None) -> Any:
        r = self.db.execute("select v from kv where k=?", (k,)).fetchone()
        return json.loads(r["v"]) if r else default

    def kv_set(self, k: str, v: Any) -> None:
        with self.lock:
            self.db.execute("insert into kv(k,v) values(?,?) on conflict(k) do update set v=excluded.v", (k, json.dumps(v)))

    # ---------- events ----------
    def upsert_event(self, event_id: str, name: str, data: dict) -> None:
        with self.lock:
            self.db.execute(
                "insert into events(event_id,name,data,created_at) values(?,?,?,?) on conflict(event_id) do update set name=excluded.name, data=excluded.data",
                (event_id, name, _j(data), now()),
            )

    def event(self, event_id: str) -> dict | None:
        return self._row(self.db.execute("select * from events where event_id=?", (event_id,)).fetchone())

    def events(self) -> list[dict]:
        return [self._row(r) for r in self.db.execute("select * from events order by created_at, case event_id when 'october-2026' then 0 else 1 end, event_id")]

    def update_event(self, event_id: str, **fields: Any) -> None:
        cols = ", ".join(f"{k}=?" for k in fields)
        vals = [(_j(v) if k in ("rule", "placements", "data") else v) for k, v in fields.items()]
        with self.lock:
            self.db.execute(f"update events set {cols} where event_id=?", (*vals, event_id))

    # ---------- proposals ----------
    def add_proposal(self, event_id: str, kind: str, *, request=None, request_id=None, decision=None, xdr=None, tx_hash=None, extra=None, parent_id=None, status="proposed") -> dict:
        pid = "p_" + uuid.uuid4().hex[:10]
        t = now()
        with self.lock:
            self.db.execute(
                "insert into proposals(id,event_id,kind,request,request_id,decision,xdr,tx_hash,status,extra,parent_id,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (pid, event_id, kind, _j(request), request_id, _j(decision), xdr, tx_hash, status, _j(extra), parent_id, t, t),
            )
        return self.proposal(pid)

    def proposal(self, pid: str) -> dict | None:
        return self._row(self.db.execute("select * from proposals where id=?", (pid,)).fetchone())

    def proposals(self, event_id: str | None = None, status: str | None = None) -> list[dict]:
        q, args = "select * from proposals where 1=1", []
        if event_id:
            q += " and event_id=?"; args.append(event_id)
        if status:
            q += " and status=?"; args.append(status)
        return [self._row(r) for r in self.db.execute(q + " order by created_at", args)]

    def update_proposal(self, pid: str, **fields: Any) -> dict:
        fields["updated_at"] = now()
        cols = ", ".join(f"{k}=?" for k in fields)
        vals = [(_j(v) if k in ("request", "decision", "result", "extra") else v) for k, v in fields.items()]
        with self.lock:
            self.db.execute(f"update proposals set {cols} where id=?", (*vals, pid))
        return self.proposal(pid)

    def claim(self, pid: str, frm: str, to: str) -> bool:
        """Atomically move a proposal between states. Only one caller (thread or process) can win."""
        r = self.db.execute("update proposals set status=?, updated_at=? where id=? and status=?", (to, now(), pid, frm))
        return r.rowcount == 1

    def live_proposal_for_request(self, request_id: str) -> dict | None:
        return self._row(self.db.execute(
            "select * from proposals where request_id=? and status not in ('failed','expired','rejected') order by created_at desc limit 1", (request_id,)
        ).fetchone())

    # ---------- lines ----------
    def add_line(self, event_id: str, kind: str, *, amount_cents=0, party=None, party_public=None, request_id=None, tx_hash=None, fee_stroops=None, proposal_id=None, related_line=None, detail=None) -> dict:
        lid = "l_" + uuid.uuid4().hex[:10]
        with self.lock:
            seq = (self.db.execute("select coalesce(max(seq),0)+1 from lines").fetchone()[0])
            self.db.execute(
                "insert into lines(id,seq,event_id,kind,amount_cents,party,party_public,request_id,tx_hash,fee_stroops,proposal_id,related_line,detail,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (lid, seq, event_id, kind, amount_cents, party, party_public, request_id, tx_hash, fee_stroops, proposal_id, related_line, _j(detail), now()),
            )
        return self.line(lid)

    def line(self, lid: str) -> dict | None:
        return self._row(self.db.execute("select * from lines where id=?", (lid,)).fetchone())

    def lines(self, event_id: str | None = None) -> list[dict]:
        if event_id:
            rows = self.db.execute("select * from lines where event_id=? order by seq", (event_id,))
        else:
            rows = self.db.execute("select * from lines order by seq")
        return [self._row(r) for r in rows]

    def line_by_request(self, request_id: str, kinds: tuple[str, ...] = ("paid", "held")) -> dict | None:
        q = "select * from lines where request_id=? and kind in (%s) order by seq limit 1" % ",".join("?" * len(kinds))
        return self._row(self.db.execute(q, (request_id, *kinds)).fetchone())

    def line_by_tx(self, tx_hash: str) -> dict | None:
        return self._row(self.db.execute("select * from lines where tx_hash=? order by seq limit 1", (tx_hash,)).fetchone())
