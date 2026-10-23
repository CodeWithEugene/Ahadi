"""The two-key guarantee, proven on Stellar testnet with a throwaway vault.

Neither the agent's key nor the organiser's key can move funds alone; both
together can. Run: uv run pytest -m chain
"""

import pytest
from stellar_sdk import Asset, Keypair, TransactionBuilder

from ahadi_bridge import stellar_ops as so
from ahadi_bridge.config import TESTNET_PASSPHRASE

pytestmark = pytest.mark.chain


def _tb(src):
    return TransactionBuilder(so.server.load_account(src), TESTNET_PASSPHRASE, base_fee=100).set_timeout(300)


@pytest.fixture(scope="module")
def vault():
    boot, issuer, vault, agent, org, dest = (Keypair.random() for _ in range(6))
    so.friendbot(boot.public_key)
    b = _tb(boot.public_key)
    for k in (issuer, vault, agent, org, dest):
        b.append_create_account_op(k.public_key, "5")
    tx = b.build(); tx.sign(boot); assert so.submit(tx.to_xdr()).ok

    usd = Asset("USDB", issuer.public_key)
    b = _tb(boot.public_key)
    b.append_change_trust_op(usd, source=vault.public_key)
    b.append_change_trust_op(usd, source=dest.public_key)
    b.append_payment_op(vault.public_key, usd, "10", source=issuer.public_key)
    tx = b.build()
    for k in (boot, vault, dest, issuer):
        tx.sign(k)
    assert so.submit(tx.to_xdr()).ok

    b = _tb(vault.public_key)
    b.append_ed25519_public_key_signer(agent.public_key, 1)
    b.append_ed25519_public_key_signer(org.public_key, 1)
    b.append_set_options_op(master_weight=0, low_threshold=2, med_threshold=2, high_threshold=2)
    tx = b.build(); tx.sign(vault); assert so.submit(tx.to_xdr()).ok
    return dict(vault=vault, agent=agent, org=org, dest=dest, issuer=issuer)


def _payment_xdr(v, cents=100):
    return so.build_payment(v["vault"].public_key, v["dest"].public_key, v["issuer"].public_key, cents, "00" * 32)


def test_vault_is_two_of_two(vault):
    cfg = so.vault_config(vault["vault"].public_key)
    th = cfg["thresholds"]
    assert (th["low_threshold"], th["med_threshold"], th["high_threshold"]) == (2, 2, 2)
    weights = {s["key"]: s["weight"] for s in cfg["signers"]}
    assert weights[vault["vault"].public_key] == 0
    assert weights[vault["agent"].public_key] == 1
    assert weights[vault["org"].public_key] == 1


def test_agent_alone_cannot_pay(vault):
    seq_before = so.account_info(vault["vault"].public_key)["sequence"]
    res = so.submit(so.sign_xdr(_payment_xdr(vault), vault["agent"].secret))
    assert not res.ok and res.tx_code == "tx_bad_auth"
    assert so.account_info(vault["vault"].public_key)["sequence"] == seq_before  # nothing consumed


def test_organiser_alone_cannot_pay(vault):
    res = so.submit(so.sign_xdr(_payment_xdr(vault), vault["org"].secret))
    assert not res.ok and res.tx_code == "tx_bad_auth"


def test_disabled_master_cannot_pay(vault):
    res = so.submit(so.sign_xdr(_payment_xdr(vault), vault["vault"].secret))
    assert not res.ok and res.tx_code == "tx_bad_auth"


def test_both_signatures_pay(vault):
    xdr = so.sign_xdr(so.sign_xdr(_payment_xdr(vault, 250), vault["agent"].secret), vault["org"].secret)
    assert set(so.signer_publics(xdr, [vault["agent"].public_key, vault["org"].public_key])) == {vault["agent"].public_key, vault["org"].public_key}
    res = so.submit(xdr)
    assert res.ok, res.code
    assert so.balance_cents(vault["dest"].public_key, vault["issuer"].public_key) == 250
    tx = so.lookup(res.hash)
    assert tx["memo_type"] == "hash"


def test_resubmitting_same_envelope_does_not_double_pay(vault):
    xdr = so.sign_xdr(so.sign_xdr(_payment_xdr(vault, 100), vault["agent"].secret), vault["org"].secret)
    first = so.submit(xdr)
    assert first.ok
    before = so.balance_cents(vault["dest"].public_key, vault["issuer"].public_key)
    second = so.submit(xdr)
    # Horizon answers a resubmission of an applied envelope with the original result:
    # same hash, applied once. This is why we persist the signed XDR before submitting.
    assert second.hash == first.hash
    assert so.balance_cents(vault["dest"].public_key, vault["issuer"].public_key) == before


def test_unactivated_destination_fails_then_claimable_works(vault):
    ghost = Keypair.random().public_key
    xdr = so.build_payment(vault["vault"].public_key, ghost, vault["issuer"].public_key, 100, "11" * 32)
    res = so.submit(so.sign_xdr(so.sign_xdr(xdr, vault["agent"].secret), vault["org"].secret))
    assert not res.ok and res.code == "op_no_destination"
    xdr, _ = so.build_claimable(vault["vault"].public_key, ghost, vault["issuer"].public_key, 100, "11" * 32, 30)
    res = so.submit(so.sign_xdr(so.sign_xdr(xdr, vault["agent"].secret), vault["org"].secret))
    assert res.ok, res.code
    assert so.claimable_balance_ids(res.hash)
