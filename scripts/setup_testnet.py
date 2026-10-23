"""Create and configure every Stellar testnet account Ahadi needs.

    uv run --project bridge python scripts/setup_testnet.py [--fresh]

Writes .keys/testnet.json (git-ignored) and .keys/organiser.key (the file the
organiser imports into the browser). Testnet only; nothing here has value.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "bridge"))

from stellar_sdk import Asset, Keypair, Signer, TransactionBuilder  # noqa: E402

from ahadi_bridge import stellar_ops as so  # noqa: E402
from ahadi_bridge.config import ASSET_CODE, KEYS_FILE, ROOT, TESTNET_PASSPHRASE  # noqa: E402

FUNDED_ROLES = ["issuer", "sponsor", "agent", "organiser", "fund_e1", "fund_e2", "w1", "w2", "w4", "w5", "w6"]
UNFUNDED_ROLES = ["w3"]  # Arjun: a wallet that was never activated
TRUSTING_ROLES = ["sponsor", "fund_e1", "fund_e2", "w1", "w2", "w4", "w5", "w6"]
VAULTS = ["fund_e1", "fund_e2"]


def log(msg: str) -> None:
    print(f"[setup] {msg}", flush=True)


def submit_or_die(tx, label: str) -> str:
    res = so.submit(tx.to_xdr())
    if not res.ok:
        raise SystemExit(f"{label} failed: {res.tx_code} {res.op_codes}")
    log(f"{label}: {so.EXPLORER_TX}{res.hash}")
    return res.hash


def tb(source: str) -> TransactionBuilder:
    return TransactionBuilder(so.server.load_account(source), TESTNET_PASSPHRASE, base_fee=so.BASE_FEE).set_timeout(300)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fresh", action="store_true", help="discard existing keys and create new accounts")
    args = ap.parse_args()

    if KEYS_FILE.exists() and not args.fresh:
        data = json.loads(KEYS_FILE.read_text())
        if so.account_exists(data["accounts"]["fund_e1"]["public"]):
            log(f"accounts already set up ({KEYS_FILE}); use --fresh to recreate")
            return

    kps = {r: Keypair.random() for r in ["bootstrap", *FUNDED_ROLES, *UNFUNDED_ROLES]}
    pub = {r: k.public_key for r, k in kps.items()}

    log("funding bootstrap account with Friendbot")
    so.friendbot(pub["bootstrap"])

    log("creating accounts")
    b = tb(pub["bootstrap"])
    for r in FUNDED_ROLES:
        b.append_create_account_op(destination=pub[r], starting_balance="40")
    tx = b.build()
    tx.sign(kps["bootstrap"])
    submit_or_die(tx, "create accounts")

    usdb = Asset(ASSET_CODE, pub["issuer"])
    log(f"adding {ASSET_CODE} trustlines")
    b = tb(pub["bootstrap"])
    for r in TRUSTING_ROLES:
        b.append_change_trust_op(asset=usdb, source=pub[r])
    tx = b.build()
    tx.sign(kps["bootstrap"])
    for r in TRUSTING_ROLES:
        tx.sign(kps[r])
    submit_or_die(tx, "trustlines")

    log("issuing the sponsor's demo dollars")
    b = tb(pub["issuer"])
    b.append_payment_op(destination=pub["sponsor"], asset=usdb, amount="1700.00")
    tx = b.build()
    tx.sign(kps["issuer"])
    submit_or_die(tx, "issue to sponsor")

    for v in VAULTS:
        log(f"turning {v} into a 2-of-2 vault (agent + organiser, master disabled)")
        b = tb(pub[v])
        b.append_ed25519_public_key_signer(account_id=pub["agent"], weight=1)
        b.append_ed25519_public_key_signer(account_id=pub["organiser"], weight=1)
        b.append_set_options_op(master_weight=0, low_threshold=2, med_threshold=2, high_threshold=2)
        tx = b.build()
        tx.sign(kps[v])
        submit_or_die(tx, f"vault {v}")
        cfg = so.vault_config(pub[v])
        th = cfg["thresholds"]
        weights = {s["key"]: s["weight"] for s in cfg["signers"]}
        assert (th["low_threshold"], th["med_threshold"], th["high_threshold"]) == (2, 2, 2), th
        assert weights.get(pub[v], 0) == 0 and weights[pub["agent"]] == 1 and weights[pub["organiser"]] == 1, weights
        log(f"{v} verified: thresholds 2/2/2, master 0, agent 1, organiser 1")

    accounts = {}
    for r, k in kps.items():
        entry = {"public": k.public_key}
        if r not in VAULTS:  # vault master keys are disabled; we keep nothing that could matter
            entry["secret"] = k.secret
        accounts[r] = entry
    data = {
        "meta": {
            "network": "testnet",
            "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "asset": ASSET_CODE,
            "issuer": pub["issuer"],
            "note": "Stellar TESTNET demo keys. No value. Never use on mainnet.",
        },
        "accounts": accounts,
    }
    KEYS_FILE.parent.mkdir(parents=True, exist_ok=True)
    KEYS_FILE.write_text(json.dumps(data, indent=2))
    KEYS_FILE.chmod(0o600)
    org = ROOT / ".keys" / "organiser.key"
    org.write_text(json.dumps({"kind": "ahadi-organiser-key", "network": "testnet", "public": pub["organiser"], "secret": kps["organiser"].secret}))
    org.chmod(0o600)
    log(f"wrote {KEYS_FILE} and {org}")
    time.sleep(1)


if __name__ == "__main__":
    main()
