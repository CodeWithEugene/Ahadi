# Omega (singnet/Omega): research for the 23–24 Oct 2026 buildathon

Researched 23 Oct 2026, 12:25–13:00 EAT, on macOS arm64 (Docker Desktop 29.7.2, 8 CPUs, 7.75 GiB VM).
Paths below are relative to the scratchpad clone `scratchpad/omega` (main @ `63a7826`, 2026-10-22) unless stated.
Scratchpad root: `/private/tmp/claude-501/-Users-eugenius-Life-BASIX-Hackathons/c582f5eb-ac10-4e7d-b230-766af9a1c54c/scratchpad`.

Labels: **VERIFIED** = read in source or ran it here. **REPORTED** = stated in docs or third-party pages, not tested. **UNVERIFIED** = my inference, not checked.

---

## 0. TL;DR

1. **We ran the real Omega agent loop in Docker, end to end, with no real API key.** VERIFIED. We pulled `singularitynet/omega:latest` (= v0.1.20). A fake OpenAI-compatible LLM on the host returned scripted tool calls, and a small WebSocket server stood in for the chat channel. The real loop then ran `query → metta (NAL |-) → remember + pin → shell → send`. The reply reached our WS server. A restart with the same Docker volume recalled the `remember`ed fact. A **custom MeTTa plugin with a Python tool and its own rule file**, mounted into the container, loaded and was called. Harness: `scratchpad/harness/harness.py`.
2. **Big change since our earlier hackathons:** on **14 Oct (PR #358 "use-tools-api")**, `main` dropped the text/s-expression output protocol for **native LLM tool calling**. Every skill becomes an OpenAI-style function tool. **The published image does not include this yet.** `latest` = `v0.1.20` = 6 Oct, and `main` images are not published. We ran `main` by **bind-mounting the main source tree over the v0.1.20 image** (no rebuild), and that worked too. VERIFIED.
3. **Also new since 1 Oct:**
   - Workflow plugin (agentskills.io `SKILL.md` + `skill.metta`) with **live reload of new workflows without a restart** (#398, 21 Oct)
   - Background knowledge indexing (#393)
   - Memory export/import via Docker volumes
   - Landlock security policy fixes
   - Launcher/image version check (21 Oct)
   - Plugin module-identity checks (#389, 22 Oct)

   The `lib_omega.metta` import of missing `./src/context` is still there, but it is harmless: the loop runs. VERIFIED.
4. **Best channel for a web demo: the built-in `websocket` channel (`channels/wschat.py`).** Omega is the WS **client**: it connects to *our* server (`WS_URL`) and exchanges JSON frames `user_message` / `agent_message`. Our backend hosts that WS endpoint and bridges it to the Next.js UI. No IRC/Telegram is needed for the demo, though Telegram can be shown as a second channel. VERIFIED.
5. **For visibility, parse Omega's structured logs.** Each turn logs `REQUEST: LLMRequest[...]`, `RESPONSE: LLMResponse[calls=[LLMToolCall[...]]]`, `COMMAND_RETURN: ((skill "args") "SUCCESS, RETURN: ...")`, `[LLM_USAGE] ...`, plus `memory/history.metta` (the episodic audit trail). Custom tools should py-call a **sidecar HTTP service we own**, which holds secrets (the agent's env is scrubbed) and emits rich events to the UI. VERIFIED (logs, env scrub); sidecar pattern UNVERIFIED but uses only verified mechanisms.

---

## 1. What changed vs our earlier research (Mizani 2 Oct, Sawa 20 Oct)

| Topic | Before (our docs) | Now (23 Oct) | Label |
|---|---|---|---|
| Image | v0.1.19/v0.1.20 | `latest` = `v0.1.20`, pushed 2026-10-07, arm64 + amd64, 2.34 GB compressed, **7.39 GB on disk** (arm64) | VERIFIED (`docker images`, Hub API, `docker manifest inspect`) |
| LLM output protocol | LLM emits up to 5 text lines `toolName arg`, repaired by `helper.balance_parentheses`, then `sread` | **main:** native tool calls; `providers.getTools(getSkills)` turns each skill into a function with string params; request uses `"tool_choice": "required"` and `"strict": True` (`providers/lib_llm_ext.py:324-347`, `src/loop.metta:62-63,105-128`) | VERIFIED |
| Skill registry | `(= (dynamic-skill $f) $text)` plus a Python whitelist `helper.LLM_COMMANDS` (v0.1.20) | `(dynamic-skill $function ($function $description $arguments))` (`src/skills.metta:26-36`); re-adding replaces | VERIFIED |
| `nop` skill | absent in v0.1.20 (`UNKNOWN_SKILL_CALL "nop"`) | present on main (`src/skills.metta:153`) | VERIFIED (ran both) |
| Workflows | — | `plugins/workflow`: drop a folder with `description.txt` + `SKILL.md` (+ optional `skill.metta`); `workflow-refresh-list` picks up new ones at runtime (`plugins/workflow/README.md`, commit `42d3604` 16 Oct, PR #398 21 Oct) | VERIFIED (source) |
| Memory portability | "import does not work standalone" | Archives now live in Docker volume `omega-memory-transfer`; `scripts/omega memory-list/upload/download/delete`; `--memory-import`, `--enable-memory-export` | VERIFIED (source/README) |
| `src/context` import | flagged as a possible live bug | Still imported by `lib_omega.metta:27`, file absent, **loop runs anyway** | VERIFIED (ran) |
| PeTTa | v1.0.4 in image | Image still pins `PETTA_REF=v1.0.4` (`Dockerfile:33`); PeTTa upstream has v1.0.6 | VERIFIED |
| Repo | 143 stars | 162 stars; 117 commits since 1 Oct (most of them merges) | VERIFIED (`gh`, `git log`) |

**How Mizani/Sawa used Omega (VERIFIED, read code):**
- `Basix-Hackathon/agent/Dockerfile` built its own image: swipl + PeTTa v1.0.4 + Omega pinned at `31ff0aa`, running a FastAPI app.
- `agent/plugins/mizani/mizani.metta` is a real `loadOmegaPlugin` that `add-skill`s `assess / fire-rule / why / update-rule`.
- We never ran the Omega **loop** (LLM + channel).
- Sawa used `hyperon` + `lib_nal.metta` from Python.

**This time the loop itself is the product.** The Mizani plugin pattern carries over directly: same `loadOmegaPlugin` / `add-skill` API, now exposed as native tools.

---

## 2. Repo anatomy (VERIFIED, main @ 63a7826)

```
run.metta                 imports lib_omega and calls !(omega)
lib_omega.metta           imports PeTTa libs, lib_nal, lib_pln, src/*.py|metta, chromadb lib
lib_nal.metta / lib_pln.metta   reasoning (|- and |~)
src/loop.metta            the agent loop (135 lines)
src/skills.metta          built-in skills + add-skill / prompt-extension / heartbeat API
src/memory.metta          remember/query (ChromaDB), episodes, history.metta
src/channels.{metta,py}   channel registry; receive/send
src/providers.{metta,py}  LLM provider registry; LLMRequest/LLMTool/LLMToolCall types
src/plugin.{metta,py}     plugin loader (config/plugins.yaml)
src/config.{metta,py}     config: CLI arg > OMEGA_<name> env > config/config.yaml
src/rag.py                knowledge-priors indexing, cloud embeddings
src/memory_export.py      archive export/import
channels/                 irc, telegram, slack, mattermost, wschat (websocket), mockchannel
providers/                openaiapi (OpenAIAPI, ASICloud, Anthropic), omega_openai (OpenAI), asione, openrouter, mockprovider
plugins/workflow, plugins/openclaw
profile/policy.yaml       Landlock filesystem policy (OpenShell YAML schema)
proxy/nginx.conf.template in-container key-injecting proxy (port 8080)
scripts/omega             Docker launcher (1243 lines)
memory/prompt*.txt        system prompt(s); history.metta (episodic trace)
docs/                     27 markdown files (several stale, see Gotchas)
```

### 2.1 The loop (`src/loop.metta:75-135`, VERIFIED)
- Turn 1 runs `initConfig, initLoop, initLogger, applySecurityPolicy, initMemory, initKnowledge, initPlugins, initChannels, addTelegramPromptExtension, (commChannelSend (version)), llmProviderStart`.
- Every turn:
  - `getContext` builds the system message: `"PROMPT: " + prompt.txt + " SKILLS: " + skill rules + prompt extensions + " SAVE_PERMANENT_FILES_DIR: " + " HISTORY: " + tail of history.metta + " TIME: "` (lines 30-35).
  - `heartbeat $k`.
  - `receive` from the channel.
  - On a new message, reset `&loops` to `maxNewInputLoops` (default **50**).
  - While `&loops > 0`: call the LLM with system + user message (the human text, or `"[NO NEW USER INPUT. CONTINUE AUTONOMOUS WORK...]"`) + tools. Log `REQUEST:` / `RESPONSE:`. Convert the tool calls to `((callid (skill "arg" ...)) ...)` (`providers.py:llmResponseToSExpr`). `eval` each one. Log `COMMAND_RETURN:`. Feed each result back as a `tool` message (capped at `maxFeedback`=50000 chars). `addToHistory`.
  - `sleep sleepInterval` (1 s), then recurse.
  - When idle, wakes every `wakeupInterval` (600 s) for `maxWakeLoops` (1) turns.

### 2.2 Built-in skills (`src/skills.metta:139-154`, VERIFIED)
`remember, query, episodes, pin, shell, read-file, write-file, write-file-b64, append-file, get-io-policy, delete-file, send, websearch (DuckDuckGo via ddgs), version, nop, metta`.

Plugins add: `workflow-load-instructions, workflow-unload-instructions, workflow-refresh-list`, and `delegate-task-to-openclaw-agent` when OpenClaw is enabled.

- The `metta` skill is `(sread $str)`, then `eval`, then `repr`. So the LLM can run arbitrary MeTTa, including `|-` (NAL) and `|~` (PLN).
- `shell` is a Prolog `process_create` with `timeout -k 1s 5s sh -c Cmd` (`src/skills.pl:2-37`). **Commands are killed after 5 s.**

### 2.3 LLM providers (VERIFIED)
- `provider=` takes `Anthropic` (config default), `OpenAI`, `ASICloud`, `ASIOne`, `OpenRouter`, `OpenAIAPI` (any OpenAI-compatible URL) or `Test` (mock).
- All of them go through the `openai` Python SDK's Chat Completions.
- **Anthropic uses Anthropic's OpenAI-compatible endpoint** `https://api.anthropic.com/v1/` (`providers/openaiapi.py:54-55`; `proxy/nginx.conf.template` comment: "Uses Anthropic's OpenAI-compatible endpoint (/v1/chat/completions)").
- Default models (`config/config.yaml`): `anthropic_model: claude-opus-4-8`, `openai_model: gpt-5.5`, `asicloud_model: minimax/minimax-m3`, `openrouter_model: z-ai/glm-5.2`, `asione_model: asi1-ultra`, `openaiapi_model: qwen3.5:9b`.
- Override with `model=<id>`.
- The launcher's default provider is `ASICloud` (`scripts/omega:687`).

Key env vars (README table, VERIFIED):

| Provider | Key env var |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| ASICloud | `ASI_API_KEY` |
| ASIOne | `ASIONE_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| OpenAIAPI | `OPENAIAPI_API_KEY` (or `api_token_var`) |

**Key isolation (VERIFIED, `entrypoint.sh:88-102`, `lib_llm_ext.py:281-300`).**
- In Docker, nginx (port 8080, user www-data) injects the key headers.
- The agent runs as `nobody` under `env -i` with an allowlist of env vars (`HOME USER PATH ... CHROMA_DB_PATH EMBEDDING_PROVIDER OMEGA_DIR MEMORY_DIR TEST_SERVER_IP`).
- The agent talks to `GATEWAY_URL=http://localhost:8080/<provider>/`. **The agent process never sees API keys, and neither does any custom tool you write.**

### 2.4 Channels (VERIFIED)

Registry in `src/channels.py`. Each channel module registers itself via `loadOmegaPlugin(): channels.registerCommChannel(id, CommChannel())`. The interface is `start/stop/receive/send`.

| `commchannel=` | Module | Auth | Notes |
|---|---|---|---|
| `irc` (default) | `channels/irc.py` | `auth <OMEGA_AUTH_SECRET>` | QuakeNet `##omega` default |
| `telegram` | `channels/telegram.py` | owner `auth <secret>` in DM; `/bind` groups | `TG_BOT_TOKEN` injected by nginx `/telegram/`; messages framed `[chat_id] [message_id] text` |
| `slack` | `channels/slack.py` | `auth <secret>` | `SL_BOT_TOKEN`; poll ≥ 60 s (slow for demos) |
| `mattermost` | `channels/mattermost.py` | `auth` | `MM_BOT_TOKEN`, `MM_URL`, `MM_CHANNEL_ID` |
| `websocket` | `channels/wschat.py` | **none**, only optional `WS_TOKEN` Bearer | Omega is the WS *client* of `WS_URL` |
| `test` | `channels/mockchannel.py` | — | needs `Autotests` mock server |

**wschat protocol** (`channels/wschat.py:15-55`, `docs/reference-channels.md`):
- server → Omega: `{"type":"user_message","seq":int,"text":str}`, `{"type":"ack",...}`, `{"type":"error",...}`
- Omega → server: `{"type":"resume","last_seen_seq":int|null}` (on every connect), `{"type":"agent_message","client_seq":uuidhex,"text":str}`
- Behaviour:
  - Pending inbound texts are joined with `" | "`.
  - Reconnects with backoff from 1 s to 30 s.
  - Outbox holds 100 messages while disconnected.
  - Max frame is 64 KiB.

### 2.5 Memory (VERIFIED unless noted)

| Store | Mechanism | Persistence |
|---|---|---|
| Working | `pin` returns `PIN-SUCCESS`; the content lives only in the history/messages | not durable state |
| Long-term | `remember`/`query`: ChromaDB at `memory/chroma_db` (`chroma.sqlite3`), local `intfloat/e5-large-v2` embeddings (or `embeddingprovider=OpenAI/ASICloud`) | Docker volume `omega-memory` → `/PeTTa/repos/Omega/memory`. **Survived a container recreate in our test** (§3) |
| Episodic / audit | `memory/history.metta`: timestamp, `"HUMAN_MESSAGE: "`, the skill calls, `ERROR_FEEDBACK:` | same volume; tail (`maxHistory` 30000 chars) is re-fed into every prompt |
| Seed knowledge | `knowledge-priors/*.md` in the Omega root, chunked into ChromaDB at start (`src/rag.py:56,233-284`); `knowledgeIndexingBackground` option | REPORTED (docs/source read, not run) |
| AtomSpace | `(metta "(add-atom &self ...)")` | **in-process only**. The skill text tells the LLM to use `&persistent`, but **`&persistent` is not defined anywhere** in the repo or in the image's PeTTa (grep, VERIFIED) |

### 2.6 Plugins and custom skills (VERIFIED: ran a custom plugin)

`config/plugins.yaml` entries look like `{name, loader: python|metta, location: "{REPO}/..."}`.

The loader (`src/plugin.metta:17-43`):
- imports `<location>/<name>.metta` into space `&plugin-<name>`
- puts `location` on `sys.path`
- calls `(loadOmegaPlugin)`

**Skills can only be added from MeTTa** (`add-skill` is a MeTTa function). So a Python tool is a MeTTa plugin that `py-call`s into its sibling `.py`; this is the `plugins/openclaw` pattern.

Template we ran (`scratchpad/runcfg/demoplugin/`):

```metta
; demoplugin.metta
!(import! &self (library Omega ./plugins/demoplugin/demoplugin.py))
!(import! &self (library Omega ./plugins/demoplugin/rules))       ; custom MeTTa rule file
(= (loadOmegaPlugin)
   (progn
     (add-skill pubmed-search "Search PubMed (stub) and return top titles" (query))
     (add-skill risk-check "Apply the clinic's NAL rule base to a patient; returns truth value" (patient))
     ()))
(= (pubmed-search $q) (py-call (demoplugin.pubmed_search $q)))
(= (risk-check $p)
   (let $sym (py-call (demoplugin.to_symbol $p))
     (repr (|- ((--> $sym hypertensive) (stv 1.0 0.9)) (rule-hypertensive-at-risk)))))
```
```metta
; rules.metta
(= (rule-hypertensive-at-risk) ((--> hypertensive at_risk) (stv 0.9 0.9)))
```
```yaml
# appended to config/plugins.yaml
- name: demoplugin
  loader: metta
  location: "{REPO}/plugins/demoplugin"
```

**Result on main.**
- The tools list sent to the LLM ended with `'pubmed-search', 'risk-check'`.
- Log: `COMMAND_RETURN: ((risk-check "P1") "SUCCESS, RETURN: ['(((--> P1 at_risk) (stv 0.9 0.7290000000000001)) ...)', ...]")`. The result came back twice; see Gotchas.

Arguments are always strings (`providers.py:_validate_response` rejects non-string args).

**Other plugin APIs** (`docs/reference-plugin-api.md`):
- `add-prompt-extension $handle $text` / `remove-prompt-extension`
- `add-heartbeat-listener $handle (|-> ($iter) ...)`, called each loop turn
- `registerCommChannel` and `registerLLMProvider` (Python)

### 2.7 Audit trail (VERIFIED, from our run)

1. Docker stdout/stderr, Python logging format `YYYY-MM-DD HH:MM:SS | LEVEL | module | message` (`config/logging.conf`). Lines per turn on main:
   ```
   loop | (---------iteration 25)
   loop | "[NO NEW USER INPUT ...]"            (or the human text)
   loop | (REQUEST: LLMRequest[messages=[...], tools=[...]])
   lib_llm_ext | [LLM_USAGE] provider=... model=... finish_reason=tool_calls prompt_tokens=... completion_tokens=...
   loop | (RESPONSE: LLMResponse[calls=[LLMToolCall[id='call_..',name='nop',arguments={},error=None]],error=None])
   loop | (RESPONSE: ((call_.. (nop))))
   loop | (COMMAND_RETURN: ((nop) "SUCCESS, RETURN: [None]"))
   ```
   Raw provider JSON is logged at DEBUG (`_log_raw`, `lib_llm_ext.py:68`).
   - The logging config is swappable: `logConfigPath=/path` (launcher `-l file`). So a stdlib `logging.handlers.HTTPHandler` or `SocketHandler` could stream records to our backend with no code change. UNVERIFIED.
   - PeTTa also prints coloured compile traces (`--> prolog clause -->`) to the same stream. Filter on the `^\d{4}-\d\d-\d\d .* \| ` prefix.
2. `memory/history.metta`: an append-only s-expression trace, read back by `episodes`. Sample from our run:
   ```
   ("2026-10-23 09:47:57"
    "HUMAN_MESSAGE: " Assess patient P1: BP 165/100, known hypertensive.
    ((query "patient P1 blood pressure")) )
   ("2026-10-23 09:47:58"
    ((metta "(|- ((--> P1 hypertensive) (stv 1.0 0.9)) ((--> hypertensive at_risk) (stv 0.9 0.9)))")) ...
   ```
3. nginx access log lines for each LLM call (`POST /openaiapi/chat/completions 200`).

### 2.8 HTTP API?
**There is none.** Omega exposes no HTTP server of its own (VERIFIED: no listener besides the internal nginx on 8080, which only proxies outbound). The integration surface is a channel plugin (WS is best), logs, and the memory volume. Third-party add-on `Leul-Negash/omegaclaw-health-plugin` adds a health endpoint (REPORTED, `gh search`).

### 2.9 "OmegaClaw"
- OmegaClaw is the **old name of Omega**, renamed on 30 Sep (v0.1.20 notes, PR #331). VERIFIED in earlier research; `tests/test_omegaclaw_launcher.py` and `migrate_omegaclaw_memory` in `scripts/omega` remain.
- The BASIX course lessons "OmegaClaw — Orientation / Build Sprint I / Capstone" refer to this same framework.
- Separately, `plugins/openclaw` delegates tasks to an external **OpenClaw** gateway agent. That is a different project.
- Community repos (REPORTED, `gh search repos omegaclaw`):
  - `marcelosite/omegaclaw-launchpad`: "Docker-only OmegaClaw onboarding: a real pinned no-key proof, persistent memory, MeTTa/NAL reasoning, readable receipts"
  - `MesTTo/omegaclaw-deontic`
  - `duflamacharia-lab/omegaclaw-web3`
  - `AlwaysHungrie/tumbuh-omegaclaw-experiments` (wallet + agent per plant)
  - `KristianVASD/h3-trust-harness` (19 Oct)

### 2.10 Docs to rely on vs stale (VERIFIED by comparing with source)

**Accurate:**
- `reference-channels.md` (wschat)
- `reference-plugin-api.md` (except its outdated `chat(prompt,...)` signature)
- `reference-orchestration.md`: ACT `f ≥ 0.6 AND c ≥ 0.5`, HYPOTHESIZE `f ≥ 0.3 AND c ≥ 0.2`; `exp = c × (f − 0.5) + 0.5`; multi-cycle pattern
- `reference-failure-modes.md`
- `reference-internals-memory-store.md`

**Stale:**
- `tutorial-03-writing-a-custom-skill.md` says to edit the `getSkills` list; use `add-skill` instead.
- `reference-internals-extension-points.md` and `reference-internals-loop.md` describe `useClaude`/`useGPT` dispatch and `sread` parsing that no longer exist on main.
- `reference-python-bridges.md` lists `useClaude` etc.

### 2.11 Related repos (VERIFIED via `gh`)

`singnet` org, recently active:
- `das` (23 Oct)
- `Omega` (22 Oct)
- `import-knowledge-package` (19 Oct; `import-kb==0.2.5` used by memory import)
- `MetaMo-Prototype` (19 Oct)
- `PLN-RAG` (18 Sep)

There is no official Omega starter/template repo in singnet.

`BASIXmarket-io/hackathon-starter` (last push 18 Oct):
- `BRIEF.md`, `SUBMISSION.md`, `tracks/track-02-builders.md` ("Track 02: MeTTa Omega (Builders)", challenges 4–9 such as "Trusted With Money … audit trail that a manager could override", "Build the AI Infrastructure Layer … Live MVP work on GitHub with Omega").
- It contains **no code**, and it looks like the previous (Sawa) event's starter. The new brief's wording ("Omega must do real work…") is not in it. Check whether a new starter exists. UNVERIFIED.

---

## 3. Running it here (VERIFIED, exact commands and timings)

| Step | Time | Result |
|---|---|---|
| `docker info` | 12:25 | daemon not running; `open -a Docker` brought it up in about 8 s |
| `docker pull singularitynet/omega:latest` | 12:25→12:41 | **7 min 11 s**; 7.39 GB arm64; `version` file = `Omega version=v0.1.20` |
| First `docker run -d ...` (no TTY) | 12:41 | **exit 1**: `nginx: [emerg] open() "/dev/stderr" failed (13: Permission denied)`. Fix: use `-it` / `tty: true` (the launcher uses `docker run -d -it`) |
| `maxNewInputLoops=8` passed as CLI arg | 12:47 | **crash**: `Arithmetic: '8'/0 is not a function`. CLI numerics arrive as strings. Fix: mount a `config.yaml` instead |
| Run with mounted config | 12:48 | container start → loop iteration 1 in **~4 s**; WS connected; full scripted turn OK |
| Restart with same volume + custom plugin | 12:49 | `query "P1 at_risk"` returned `[['2026-10-23 09:48:00', 'P1 is at_risk ...']]`; plugin skills ran |
| main source bind-mounted over v0.1.20 image | 12:51 | native tool-call path works; version reports `v0.1.19-273-g63a7826-dirty` |
| Idle footprint | — | `docker stats`: **~459 MiB RAM**, about 0.7 % CPU (1 s sleep loop) |

**No-key test harness** (`scratchpad/harness/harness.py`, Python 3.12 + `websockets==16.0`):
- A stdlib HTTP server on :8765 answers `/v1/chat/completions` with scripted `tool_calls`. If the request has no `tools` (v0.1.20), it answers in the text protocol instead.
- A WS server on :8766 implements the wschat frames and sends one `user_message` 20 s after connect.
- Everything is logged to `events*.jsonl`.

Command that worked (v0.1.20 image; the dummy key value is never used upstream):
```bash
docker run -dit --name omega-test --security-opt no-new-privileges:true --init \
  --add-host=host.docker.internal:host-gateway \
  --tmpfs /tmp:size=64m,mode=1777 --tmpfs /var/tmp:size=64m,mode=1777 --tmpfs /run:size=16m,mode=755 \
  -v omega-test-memory:/PeTTa/repos/Omega/memory \
  -v $PWD/runcfg/config.yaml:/PeTTa/repos/Omega/config/config.yaml:ro \
  -v $PWD/runcfg/plugins2.yaml:/PeTTa/repos/Omega/config/plugins.yaml:ro \
  -v $PWD/runcfg/demoplugin:/PeTTa/repos/Omega/plugins/demoplugin:ro \
  -e OPENAIAPI_API_KEY=dummy -e OMEGA_AUTH_SECRET=test0000 \
  singularitynet/omega:latest \
  commchannel=websocket provider=OpenAIAPI openaiapi_url=http://host.docker.internal:8765/v1/ \
  model=fake-model WS_URL=ws://host.docker.internal:8766/ws \
  securityPolicyPath=/PeTTa/repos/Omega/profile/policy.yaml
```

**Running main on the published image** (no rebuild):
- Copy the clone to `omega-run/`, add the plugin and configs inside it, then `chmod +x entrypoint.sh scripts/*` (the exec bit was missing in our copy, which gave `tini: exec ... Permission denied`).
- Mount it with `-v $PWD/omega-run:/PeTTa/repos/Omega:ro -v omega-main-memory:/PeTTa/repos/Omega/memory`.
- A **read-only** source mount cannot hold extra nested bind mounts (`mkdirat ... read-only file system`). Bake the plugins into the copied tree instead.
- `requirements.txt` differs from v0.1.20 only in `import-kb 0.2.4 → 0.2.5`. VERIFIED (`git diff v0.1.20 HEAD`).

**Observed trace** (v0.1.20, fake LLM; the numbers come from Omega's real `lib_nal`):
```
HUMAN-MSG: Assess patient P1: BP 165/100, known hypertensive.
RESPONSE: ((query "patient P1 blood pressure"))            -> []
RESPONSE: ((metta "(|- ((--> P1 hypertensive) (stv 1.0 0.9)) ((--> hypertensive at_risk) (stv 0.9 0.9)))"))
          -> "(((--> P1 at_risk) (stv 0.9 0.729)) ((--> at_risk P1) (stv 1.0 0.4216)))"
RESPONSE: ((remember "...") (pin "..."))                   -> REMEMBER-SUCCESS, PIN-SUCCESS
RESPONSE: ((shell "echo ... && id && ls ..."))             -> uid=65534(nobody) ...
RESPONSE: ((send "P1 is at risk ..."))                     -> WS agent_message received by our server
```
- At startup Omega also sent `agent_message "Omega version=v0.1.20"` to the channel.
- **It ran `maxNewInputLoops` LLM calls right after boot with no user input.** 17 LLM calls in total for one human message with `maxNewInputLoops: 8`.

Not done: a real-LLM run (no keys were used, by instruction). Behaviour with real Anthropic/OpenAI tool calling is UNVERIFIED, including Anthropic's OpenAI-compat endpoint with `strict` + `tool_choice: required`. Test cleanup: we removed the container and volumes; the image remains.

---

## 4. Recommended architecture for a polished web demo

```
 Browser (Next.js on Vercel or same VPS)
   │  SSE/WS (UI events)          ▲
   ▼                              │
 Bridge backend (FastAPI or Node) ─┼─ WS server  /omega  ◄── Omega (wschat client, commchannel=websocket)
   • /chat  → user_message frames  │                          │ logs (docker logs -f / HTTPHandler)
   • /events SSE: parsed REQUEST / RESPONSE / COMMAND_RETURN /│ memory volume (history.metta, chroma)
     LLM_USAGE / history.metta tail                           │
   • /tools/* sidecar: stellar_send_payment, pubmed_search ◄──┘ py-call from Omega plugin (HTTP to http://bridge:PORT)
     holds secrets, enforces limits, emits tool events
```

### 4.1 Talking to Omega
Use `commchannel=websocket WS_URL=ws://bridge:8766/omega WS_TOKEN=<random>`.
- The bridge assigns monotonically increasing `seq` values, replays on `resume`, and acks `agent_message`.
- The UI posts chat to the bridge, and the bridge forwards it as `user_message`.
- Omega's `send` replies come back as `agent_message` and are pushed to the UI.
- Telegram can run as an alternative channel in a second container for the "talk to your agent on Telegram" checkbox. **Only one channel per Omega process** (`commchannel` is a single value, `src/channels.py:84-94`). VERIFIED.

### 4.2 Making reasoning, memory and tools visible
1. **Log tailer** (simplest, VERIFIED formats): stream `docker logs -f omega` from the bridge (Docker socket, or `docker compose logs -f`). Keep lines matching `^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d \| (\w+)\s*\| ([\w.-]+) \| (.*)$`. Classify:

   | Pattern | UI event |
   |---|---|
   | `(---------iteration N)` | cycle boundary |
   | `REQUEST: LLMRequest[` | prompt snapshot. Large: truncate, or show only `tools=[...]` names |
   | `RESPONSE: LLMResponse[calls=[LLMToolCall[id=..,name=..,arguments={..}` | the LLM's decision |
   | `COMMAND_RETURN: ((<skill> "args") "SUCCESS, RETURN: ...")` or `ALERT_FAILED` | tool result. `metta` results carry `(stv f c)`: render as a proof card with ACT/HYPOTHESIZE/IGNORE badges |
   | `[LLM_USAGE] ... prompt_tokens=.. completion_tokens=..` | cost meter |
   | `skills | "Add skill: ..."` | live skill catalogue |
   | `remember` / `query` / `pin` / `episodes` | memory panel (write vs read) |

2. **Alternative / extra:** mount a `logging.conf` (`logConfigPath=/tmp/omega-logging.conf`) with a `logging.handlers.HTTPHandler` POSTing to `http://bridge:PORT/ingest`. No docker-socket access needed. UNVERIFIED.
3. **Memory view:**
   - Bind-mount a host dir as `/PeTTa/repos/Omega/memory` instead of a named volume, `chown 65534` or `chmod 777`. Tail `history.metta` for the audit timeline, and read `chroma_db/chroma.sqlite3` read-only to list long-term memories.
   - Or add a `memory-dump` skill.
4. **Sidecar tool events:** every custom tool hits the bridge, which logs inputs and outputs with its own IDs. This gives the richest view: e.g. a Stellar tx hash with an explorer link.

### 4.3 Adding custom tools (concrete)
- **`stellar_send_payment`.** MeTTa plugin `plugins/stellar/stellar.metta`:
  - `add-skill stellar-send-payment "Send XLM on Stellar testnet from the demo wallet; returns tx hash. Only after ACT threshold." (destination amount memo)`
  - The body does `(py-call (stellar.send $d $a $m))`. `stellar.py` POSTs to `http://bridge:8000/tools/stellar/send`.
  - The bridge holds the testnet secret (never put it in the Omega container), enforces a cap/allowlist, signs with stellar-sdk, and returns the hash.
  - Optional human-in-the-loop: the bridge returns `PENDING_APPROVAL id=...` and the UI shows an approve button. This fits "Trusted With Money … manager could override".
- **`pubmed_search`.** Same pattern. The Python side can call NCBI E-utilities directly, since the container has outbound network and there is no secret. Or route it through the bridge so the UI sees it.
- **Hyphenated names are idiomatic** (`read-file`, `get-io-policy`) and work as OpenAI function names. All params are strings.
- **Custom MeTTa rule files:**
  - `!(import! &self (library Omega ./plugins/<name>/rules))` inside the plugin, with skills like `risk-check` / `why` / `update-rule` (the Mizani plugin can be reused nearly as-is).
  - Use `add-prompt-extension` to teach the LLM the atom vocabulary and the ACT/HYPOTHESIZE thresholds.
  - Rules are then available both through dedicated skills and through the generic `metta` skill.
- **Workflow (native orchestration):** put a `plugins/workflow/instructions/<our-flow>/` folder with `description.txt` + `SKILL.md` (step plan referencing our skills) + `skill.metta` (skill declarations `(skill name "desc" (args))`). It is loadable by `workflow-load-instructions`, and new ones are picked up by `workflow-refresh-list` without a restart (main only). This is the most literal match for "Use Omega's native orchestration".
- **Seed knowledge:** `knowledge-priors/*.md` in the Omega root is indexed into long-term memory at start.

### 4.4 Image choice
| Option | Pros | Cons |
|---|---|---|
| A. `FROM singularitynet/omega:v0.1.20` + COPY plugins/config | prebuilt; we ran it | old text protocol (more parse errors with real LLMs), no `nop`, no workflow live reload |
| **B. `FROM singularitynet/omega:v0.1.20` + COPY main source tree (pinned commit `63a7826`) over `/PeTTa/repos/Omega` + plugins** | native tool calling; no FAISS/torch rebuild; we ran it (via bind mount) | unofficial combination; must `chmod +x entrypoint.sh`, write a `version` file, `chown -R 65534 memory` |
| C. `docker build` from main | official path | builds FAISS from source, installs torch, downloads e5-large: likely 20–40 min and several GB (UNVERIFIED time) |

Recommendation: **B**, with A as fallback (flip the image tag).

---

## 5. Deployment (live demo on a subdomain)

- **Resources** (VERIFIED locally): 7.39 GB image on disk (arm64), ~460 MiB RAM idle after loading memory, negligible CPU when idle. With the local e5-large embedder, plan for **≥ 2 GB RAM, ideally 4 GB**, and **≥ 15 GB disk**. `embeddingprovider=OpenAI` is an option, but it changes the vector space, so reset Chroma.
- **Network:** Omega needs only **outbound** traffic (LLM, WS to the bridge, Telegram). No inbound port. Put Omega and the bridge in one docker-compose network (`WS_URL=ws://bridge:8766/omega`). Expose only the bridge/UI through Caddy/Traefik with TLS on the subdomain.
- **VPS with Docker Compose** (Hetzner CX22/CPX21, DigitalOcean 4 GB): the lowest-risk path. Use `tty: true`, `init: true`, `security_opt: [no-new-privileges:true]`, tmpfs mounts as in the launcher, and a named volume for memory. UNVERIFIED on a VPS, but identical to what we ran locally.
- **Fly.io / Railway:** UNVERIFIED and riskier.
  - (1) The nginx `/dev/stderr` failure without a TTY. Fly/Railway don't allocate a TTY, so you would need a derived image that rewrites `error_log /dev/stderr` to `/tmp/nginx-error.log`, or that runs the entrypoint under `script -qfc`.
  - (2) Image size, slow cold pulls.
  - (3) Landlock under Firecracker is `best_effort`.
  - (4) Persistent volume needed for memory.
  - Railway's image-size limits: check.
- **Next.js UI** can sit on Vercel and talk to the bridge over HTTPS/SSE. Do not put Omega on Vercel.
- **Isolation rule** ("Run Omega in isolation… Use Docker"): keep `no-new-privileges`, the `nobody` user and the Landlock policy. Mount no host paths except a dedicated memory dir. Keep secrets in the bridge.

---

## 6. Gotchas (VERIFIED unless labelled)

1. **No TTY means nginx crashes at start** (`/dev/stderr` permission denied, exit 1). Always use `-it` / compose `tty: true`.
2. **Numeric config via CLI args breaks** (`maxNewInputLoops=8` gives `Arithmetic: '8'/0`). Set numbers in a mounted `config/config.yaml`. Strings via CLI are fine.
3. **Cost and loop behaviour:**
   - Each new human message gives the LLM up to `maxNewInputLoops` (default **50**) turns, 1 s apart. Each turn resends the system prompt plus the history tail (`maxHistory` 30000 chars).
   - Boot also runs a full burst.
   - The prompt also says "Take at least 5 agent cycles with extensive queries … before answering" (`memory/prompt.txt`), so latency is several LLM calls per answer.
   - For a demo, set `maxNewInputLoops: 6–10` and override `prompt.txt` (mount it).
4. **Published image ≠ main.** `latest` = v0.1.20 (6 Oct), with the text protocol and a different `add-skill`. Docs on main describe newer behaviour, and some docs are older still (§2.10).
5. **The agent env is scrubbed** (`entrypoint.sh` `env -i` allowlist). Custom tools cannot read API keys or wallet secrets from env. Use the bridge sidecar (or add an nginx location, the way OpenClaw's token is injected).
6. **`shell` has a 5 s hard timeout** and rejects apostrophes. Long jobs must be backgrounded or done in a tool.
7. **`&persistent` does not exist.** Atoms added via `metta` vanish on restart. Persist facts with `remember` or files under `memory/`. The `|-` reasoning is stateless per call (docs say so too).
8. **Duplicate results:** our `risk-check` returned the same NAL result twice. `|-` / imports can yield duplicates (the earlier hyperon research saw similar). Wrap with `(collapse ...)` + `unique-atom`, or post-filter in Python. UNVERIFIED root cause.
9. **v0.1.20 text protocol** rejects unknown commands as `UNKNOWN_SKILL_CALL` and fills `history.metta` with `ERROR_FEEDBACK` on idle cycles. On main, the `nop` skill avoids this.
10. **One channel per process.** For web + Telegram, run two containers with separate memory volumes, or accept one channel.
11. **WS channel has no `auth` gate.** Protect it with `WS_TOKEN` and keep it on an internal Docker network.
12. **Read-only source bind mount + nested mounts fails.** Bake files into the tree, or mount rw. Copied trees can lose the exec bit on `entrypoint.sh`.
13. **Launcher version check** (`scripts/omega start`, 21 Oct) aborts if the script and image versions differ. Use a matching `git checkout v0.1.20`, or call `docker run` directly as above.
14. **PeTTa compile noise** goes to the same stdout stream as structured logs. Filter by the timestamp prefix.
15. **Docs claim a 5-commands-per-cycle ceiling** (`reference-orchestration.md`); the tool-call loop on main does not enforce it in code that we saw. UNVERIFIED.
16. **Slack polling is ≥ 60 s.** Use Telegram or the web UI for live demos.
17. **Memory volume ownership:** the agent runs as uid 65534. Host bind mounts must be writable by it.

---

## 7. Recommended integration pattern for a 24-hour build

1. **Hour 0–2: base.**
   - `docker-compose.yml` with:
     - `omega`: `FROM singularitynet/omega:v0.1.20` + main source at `63a7826` copied over `/PeTTa/repos/Omega` (chmod/chown fixes) + our `plugins/` and `config/{config,plugins}.yaml` + custom `memory/prompt.txt`; `tty: true`; memory volume; `commchannel=websocket provider=Anthropic model=<cheap Claude id> WS_URL=ws://bridge:8766/omega WS_TOKEN=...`; `ANTHROPIC_API_KEY` from `.env`.
     - `bridge`: FastAPI with the WS server + SSE + tools.
   - Start with the fake LLM from `scratchpad/harness/harness.py` so the UI can be built without spending tokens. Swap in the real key later.
2. **Hour 2–8: tools and rules.**
   - One MeTTa plugin `plugins/<project>/` containing:
     - domain rules (`rules.metta`, NAL atoms with `stv`)
     - skills `assess` / `why` / `update-rule` (port the Mizani plugin)
     - external-action skills (`stellar-send-payment`, `pubmed-search`) that py-call the bridge
     - an `add-prompt-extension` that teaches the vocabulary and ACT/HYPOTHESIZE gates
   - Add a workflow folder (`SKILL.md`) that sequences: query memory → gather (tool) → atomize + NAL → threshold gate → act (tool) → remember → send.
3. **Hour 8–16: UI.** Next.js with:
   - Chat panel (bridge WS)
   - "Agent mind" timeline from parsed logs: cycle, LLM decision, tool call, result
   - Proof cards for `metta` / `assess` results, with f/c bars and an ACT badge
   - Memory panel: `remember` / `query` / `pin` events, `history.metta` tail, Chroma contents
   - Tool panel: Stellar tx links, PubMed hits
   - Approve/override button for money actions
4. **Hour 16–20:** deploy to a 4 GB VPS with compose + Caddy on the subdomain. Pre-pull the image (7 min locally). Seed `knowledge-priors/*.md`. Lower `maxNewInputLoops`.
5. **Hour 20–24:** demo script, README with "what Omega does vs what the bridge does" (judges check for "not a chatbot wrapper"), screen recording. Keep `history.metta` as the auditable artefact.

**What to show judges as "real Omega":**
- `docker compose ps` running `singularitynet/omega`
- the plugin's `add-skill` lines in logs
- tool calls chosen by Omega's loop (not by our backend)
- NAL truth values from `lib_nal.metta`
- long-term memory recalled after a container restart
- the `history.metta` trail
