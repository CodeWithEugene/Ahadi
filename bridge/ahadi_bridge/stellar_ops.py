"""Stellar testnet operations: build, sign, submit, inspect.

Every money movement out of an event fund needs two signatures (agent and
organiser). The agent's key lives here; the organiser signs elsewhere (browser).
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import httpx
from stellar_sdk import (
    Asset,
    Claimant,
    ClaimPredicate,
    Keypair,
    Network,
    Server,
    TransactionBuilder,
    TransactionEnvelope,
)
from stellar_sdk.exceptions import BadRequestError, NotFoundError

from .config import ASSET_CODE, EXPLORER_TX, FRIENDBOT_URL, HORIZON_URL, TESTNET_PASSPHRASE

BASE_FEE = 100
APPROVAL_WINDOW_S = 15 * 60

server = Server(HORIZON_URL)


def asset(issuer: str) -> Asset:
    return Asset(ASSET_CODE, issuer)


def cents_to_amount(cents: int) -> str:
    return str((Decimal(cents) / 100).quantize(Decimal("0.01")))


def amount_to_cents(amount: str) -> int:
    return int((Decimal(amount) * 100).to_integral_value())


def friendbot(public: str) -> None:
    r = httpx.get(FRIENDBOT_URL, params={"addr": public}, timeout=60)
    if r.status_code != 200 and "createAccountAlreadyExist" not in r.text:
        raise RuntimeError(f"Friendbot failed for {public}: {r.status_code} {r.text[:200]}")


def account_exists(public: str) -> bool:
    try:
        server.accounts().account_id(public).call()
        return True
    except NotFoundError:
        return False


def account_info(public: str) -> dict[str, Any] | None:
    try:
        return server.accounts().account_id(public).call()
    except NotFoundError:
        return None


def trusts(public: str, issuer: str) -> bool:
    info = account_info(public)
    if not info:
        return False
    return any(b.get("asset_code") == ASSET_CODE and b.get("asset_issuer") == issuer for b in info["balances"])


def balance_cents(public: str, issuer: str) -> int:
    info = account_info(public)
    if not info:
        return 0
    for b in info["balances"]:
        if b.get("asset_code") == ASSET_CODE and b.get("asset_issuer") == issuer:
            return amount_to_cents(b["balance"])
    return 0


def vault_config(public: str) -> dict[str, Any]:
    info = account_info(public)
    if not info:
        return {}
    return {
        "thresholds": info["thresholds"],
        "signers": [{"key": s["key"], "weight": s["weight"]} for s in info["signers"]],
        "data": {k: v for k, v in info.get("data", {}).items()},
    }


def builder(source_public: str, timeout: int = APPROVAL_WINDOW_S) -> TransactionBuilder:
    acct = server.load_account(source_public)
    return TransactionBuilder(acct, network_passphrase=TESTNET_PASSPHRASE, base_fee=BASE_FEE).set_timeout(timeout)


def sign_xdr(xdr: str, secret: str) -> str:
    env = TransactionEnvelope.from_xdr(xdr, TESTNET_PASSPHRASE)
    env.sign(Keypair.from_secret(secret))
    return env.to_xdr()


def tx_hash(xdr: str) -> str:
    return TransactionEnvelope.from_xdr(xdr, TESTNET_PASSPHRASE).hash_hex()


def signer_publics(xdr: str, candidates: list[str]) -> list[str]:
    """Which of the candidate keys have signed this envelope."""
    env = TransactionEnvelope.from_xdr(xdr, TESTNET_PASSPHRASE)
    h = env.hash()
    out = []
    for pub in candidates:
        kp = Keypair.from_public_key(pub)
        for sig in env.signatures:
            hint = sig.signature_hint
            hint = getattr(hint, "signature_hint", hint)
            if bytes(hint) == bytes(kp.signature_hint()):
                try:
                    kp.verify(h, sig.signature)
                    out.append(pub)
                    break
                except Exception:
                    pass
    return out


@dataclass
class SubmitResult:
    ok: bool
    hash: str
    ledger: int | None = None
    fee_charged: int | None = None
    tx_code: str | None = None
    op_codes: list[str] | None = None
    raw: dict[str, Any] | None = None

    @property
    def code(self) -> str | None:
        """The most specific failure code."""
        if self.op_codes:
            for c in self.op_codes:
                if c != "op_success":
                    return c
        return self.tx_code

    @property
    def receipt_url(self) -> str:
        return EXPLORER_TX + self.hash


def submit(xdr: str) -> SubmitResult:
    env = TransactionEnvelope.from_xdr(xdr, TESTNET_PASSPHRASE)
    h = env.hash_hex()
    try:
        resp = server.submit_transaction(env)
        return SubmitResult(True, h, resp.get("ledger"), int(resp.get("fee_charged", 0) or 0), raw={"successful": True})
    except BadRequestError as e:
        extras = (e.extras or {}).get("result_codes", {})
        return SubmitResult(False, h, tx_code=extras.get("transaction"), op_codes=extras.get("operations"), raw=e.extras)


def lookup(h: str) -> dict[str, Any] | None:
    try:
        return server.transactions().transaction(h).call()
    except NotFoundError:
        return None


def wait_for(h: str, seconds: int = 30) -> dict[str, Any] | None:
    end = time.time() + seconds
    while time.time() < end:
        tx = lookup(h)
        if tx:
            return tx
        time.sleep(2)
    return None


# ---------- transaction builders (unsigned) ----------

def build_payment(fund: str, dest: str, issuer: str, cents: int, memo_hash_hex: str) -> str:
    tx = (
        builder(fund)
        .append_payment_op(destination=dest, asset=asset(issuer), amount=cents_to_amount(cents))
        .add_hash_memo(bytes.fromhex(memo_hash_hex))
        .build()
    )
    return tx.to_xdr()


def build_claimable(fund: str, dest: str, issuer: str, cents: int, memo_hash_hex: str, days: int) -> tuple[str, int]:
    expiry = int(time.time()) + days * 86400
    claimants = [
        Claimant(destination=dest, predicate=ClaimPredicate.predicate_before_absolute_time(expiry)),
        Claimant(destination=fund, predicate=ClaimPredicate.predicate_not(ClaimPredicate.predicate_before_absolute_time(expiry))),
    ]
    tx = (
        builder(fund)
        .append_create_claimable_balance_op(asset=asset(issuer), amount=cents_to_amount(cents), claimants=claimants)
        .add_hash_memo(bytes.fromhex(memo_hash_hex))
        .build()
    )
    return tx.to_xdr(), expiry


def build_manage_data(fund: str, key: str, value_hex: str, memo_hash_hex: str) -> str:
    tx = (
        builder(fund)
        .append_manage_data_op(data_name=key, data_value=bytes.fromhex(value_hex))
        .add_hash_memo(bytes.fromhex(memo_hash_hex))
        .build()
    )
    return tx.to_xdr()


def claimable_balance_ids(h: str) -> list[str]:
    """Claimable balance ids created by a settled transaction."""
    try:
        ops = server.operations().for_transaction(h).call()["_embedded"]["records"]
    except NotFoundError:
        return []
    ids = []
    for op in ops:
        if op.get("type") == "create_claimable_balance":
            effs = server.effects().for_operation(op["id"]).call()["_embedded"]["records"]
            ids += [e["balance_id"] for e in effs if e.get("type") == "claimable_balance_created"]
    return ids


def network() -> Network:
    return Network(TESTNET_PASSPHRASE)
