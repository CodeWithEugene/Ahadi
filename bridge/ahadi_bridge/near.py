"""NEAR Intents 1Click: dry quotes only (the simulated cross-chain leg).

NEAR Intents has no testnet, so Ahadi never sends funds through it. A dry quote
(`dry: true`) returns prices, fees and timing without a deposit address. Quote
validation runs against Stellar mainnet, so the refund address is a public
mainnet placeholder that holds a USDC trustline; no funds ever move.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

from .config import ROOT

URL = "https://1click.chaindefuser.com/v0/quote"
HEADERS = {"User-Agent": "ahadi/0.1 (BASIX buildathon; dry quotes only)"}
STELLAR_USDC = "nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu"
DEST = {
    "solana": ("nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near", 6, "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"),
}
# Public mainnet account with a USDC trustline, used only so the dry quote validates.
REFUND_PLACEHOLDER = "GA2226DVH7XAGTRL7LELZ35V5QEAJDVQZLZOEKEIMXBGHB3CB5FCYYPH"
FIXTURE = ROOT / "data" / "fixtures" / "near-quote-stellar-usdc-to-solana-2026-10-23.json"


def _shape(resp: dict, source: str, chain: str) -> dict:
    q = resp["quote"]
    _, decimals, _ = DEST[chain]
    return {
        "simulated": True,
        "source": source,  # live-dry-quote | recorded-fixture
        "provider": "NEAR Intents 1Click",
        "to_chain": chain,
        "amount_in": q["amountInFormatted"],
        "amount_out": q["amountOutFormatted"],
        "min_amount_out": f"{int(q['minAmountOut']) / 10**decimals:.6f}",
        "eta_seconds": q.get("timeEstimate"),
        "withdraw_fee": q.get("withdrawFee"),
        "correlation_id": resp.get("correlationId"),
        "signature": resp.get("signature"),
        "quoted_at": resp.get("timestamp"),
        "note": "Dry quote: no deposit address, no funds moved. NEAR Intents has no testnet.",
    }


def dry_quote(amount_cents: int, chain: str = "solana") -> dict:
    asset, _, recipient = DEST[chain]
    body = {
        "dry": True,
        "swapType": "EXACT_INPUT",
        "slippageTolerance": 100,
        "originAsset": STELLAR_USDC,
        "depositType": "ORIGIN_CHAIN",
        "depositMode": "MEMO",
        "destinationAsset": asset,
        "amount": str(amount_cents * 100_000),  # Stellar USDC has 7 decimals
        "recipient": recipient,
        "recipientType": "DESTINATION_CHAIN",
        "refundTo": REFUND_PLACEHOLDER,
        "refundType": "ORIGIN_CHAIN",
        "deadline": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat().replace("+00:00", "Z"),
    }
    try:
        r = httpx.post(URL, json=body, headers=HEADERS, timeout=30)
        r.raise_for_status()
        return _shape(r.json(), "live-dry-quote", chain)
    except Exception as e:  # network, 4xx/5xx: fall back to the recorded quote, and say so
        data = json.loads(Path(FIXTURE).read_text())
        out = _shape(data["response"], "recorded-fixture", chain)
        out["fallback_reason"] = str(e)[:200]
        return out
