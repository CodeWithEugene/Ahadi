import json, urllib.request
def pubmed_search(q):
    # stub: a real version would call eutils or a sidecar; keep offline for the test
    return json.dumps({"query": str(q), "hits": ["Stub title A", "Stub title B"]})
def to_symbol(p):
    return str(p).strip().replace(" ", "_")
