"""Settings and testnet key material. Testnet only, enforced here."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

TESTNET_PASSPHRASE = "Test SDF Network ; September 2015"
HORIZON_URL = os.getenv("HORIZON_URL", "https://horizon-testnet.stellar.org")
FRIENDBOT_URL = "https://friendbot.stellar.org"
EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx/"
EXPLORER_ACCOUNT = "https://stellar.expert/explorer/testnet/account/"

if "testnet" not in HORIZON_URL:
    raise RuntimeError("Ahadi runs on Stellar testnet only; refusing a non-testnet Horizon URL.")

KEYS_FILE = Path(os.getenv("AHADI_KEYS_FILE", ROOT / ".keys" / "testnet.json"))
DB_PATH = Path(os.getenv("AHADI_DB", ROOT / ".data" / "ahadi.db"))
SCENARIO_FILE = Path(os.getenv("AHADI_SCENARIO", ROOT / "data" / "scenario.json"))
ASSET_CODE = "USDB"


@dataclass(frozen=True)
class Account:
    role: str
    public: str
    secret: str | None = None


@lru_cache
def load_keys() -> dict[str, Account]:
    """Keys written by scripts/setup_testnet.py.

    The organiser's secret is deliberately absent from the bridge's view unless
    AHADI_DEMO_ORGANISER_SIGNER=1 (automated tests only); the organiser signs in
    the browser.
    """
    if not KEYS_FILE.exists():
        return {}
    data = json.loads(KEYS_FILE.read_text())
    allow_org = os.getenv("AHADI_DEMO_ORGANISER_SIGNER") == "1"
    out = {}
    for role, entry in data["accounts"].items():
        secret = entry.get("secret")
        if role == "organiser" and not allow_org:
            secret = None
        out[role] = Account(role, entry["public"], secret)
    return out


def keys_meta() -> dict:
    if not KEYS_FILE.exists():
        return {}
    return json.loads(KEYS_FILE.read_text()).get("meta", {})


def tool_secret() -> str:
    return os.getenv("AHADI_TOOL_SECRET", "dev-tool-secret")


def console_passcode() -> str:
    return os.getenv("AHADI_CONSOLE_PASSCODE", "")
