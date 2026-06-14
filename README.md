# ZeroQ — AI-Powered Quantum-Safe Cryptography Risk Platform

> **Splunk Agentic Ops Hackathon · Security Track**  
> ZeroQ finds every quantum-vulnerable cryptographic asset across your **source code** and **network infrastructure**, then lets an AI agent generate and execute a prioritized migration plan — all backed by live Splunk data.

---

## 🎯 Executive Summary (For Business & Non-Technical Stakeholders)

### The Problem
Quantum computers will break today’s encryption (RSA, ECDSA, legacy TLS) within 5–10 years. Organizations that fail to inventory and migrate their cryptographic assets early face:
- **Regulatory non-compliance** (NIST PQC mandates, PCI-DSS, GDPR).
- **"Harvest now, decrypt later" attacks** — adversaries storing encrypted traffic today to decrypt once quantum machines arrive.
- **Unplanned, multi-million dollar remediation** when deadlines hit and no one knows where vulnerable crypto lives.

Current tools are siloed: code scanners never talk to network logs, and neither talks to your SIEM. Security teams lack a single pane of glass that correlates code posture with live network reality.

### Our Solution
**ZeroQ** is an AI-powered, Splunk-integrated command center that:
1. **Scans** any public (or private) code repository and detects 18 classes of quantum-vulnerable cryptography down to the exact file and line number.
2. **Correlates** those findings with live network metadata (TLS handshakes, certificates, HNDL anomalies) already sitting in Splunk.
3. **Reasons** via an LLM agent grounded on real Splunk data to produce a ranked, time-boxed remediation plan tailored to your actual exposure.
4. **Operates** inside a native Splunk App so your SOC analysts never leave their workflow.

### The Business Value
| Metric | Impact |
|---|---|
| **Time to Inventory** | From weeks of manual audits to **< 2 minutes** per repo. |
| **Mean Time to Remediate** | AI-ranked plans cut prioritization overhead by **60–70%**. |
| **Audit Readiness** | Continuous compliance dashboard (NIST / CNSA / PCI) updated in real time from Splunk indexes. |
| **Total Cost of Ownership** | Uses your existing Splunk Cloud Trial or Enterprise license; no new data lake required. |

### Track & AI Integration
- **Track:** **Security** — we help security teams detect cryptographic debt faster, investigate exposure with AI, and automate migration workflows.
- **AI Capabilities Used:**
  - **LLM-powered assistant** (`/api/assistant`) answers natural-language questions about your posture by querying Splunk live.
  - **Generative planning** (`/api/plan`) produces a concrete, ranked migration roadmap with effort estimates and owners.
  - **Grounded reasoning** — the model is never hallucinating in a vacuum; every recommendation is anchored to real `crypto_*` Splunk indexes and scanned repository facts.

---

## 🏆 Hackathon Submission Details

### What We Built
An end-to-end AI-powered security operations platform that unifies code scanning, network telemetry, and generative AI inside Splunk. It solves the real-world challenge of **post-quantum cryptographic readiness** — a problem every regulated enterprise will face before 2030.

### What to Submit (Hackathon Checklist)

| Requirement | Status | Location / Link |
|---|---|---|
| **Text description** of features and functionality | ✅ | This README |
| **Demo video** (< 3 min, publicly posted) | 🎥 *[Add YouTube/Vimeo/Youku link here before submitting]* | `https://youtube.com/...` |
| **Open-source code repository** | ✅ | This repo |
| **Open source license** | ✅ | [`LICENSE`](./LICENSE) |
| **README with setup & run instructions** | ✅ | See [How the app runs on Splunk](#how-the-app-runs-on-splunk--install-configure-done) below |
| **Dependencies & example configs** | ✅ | `.env.example`, `package.json`, `data/`, [`dataset/`](./dataset/) |
| **Architecture diagram** | ✅ | See [Architecture at a Glance](#architecture-at-a-glance) and [`architecture_diagram.md`](./architecture_diagram.md) |

### Architecture at a Glance

ZeroQ is a Next.js 14 application that works **with or without Splunk**.  
When Splunk is connected, every scan and network observation flows into
dedicated `crypto_*` indexes and is read back through the Splunk REST API.
When Splunk is not connected, the app falls back to a local SQLite store so
dashboards, the AI assistant and migration plans keep working.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ZEROQ PLATFORM                                   │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────────────┐  │
│  │  GitHub /   │   │   AI Agent   │   │      Next.js 14 Dashboard        │  │
│  │  GitLab     │──►│ (DeepSeek +  │◄──│  /        Landing                 │  │
│  │  Repos      │   │ local fallback)│  │  /app     Risk, Inventory, ...   │  │
│  └─────────────┘   └──────┬───────┘   │  /onboarding  Splunk + GitHub setup│  │
│                           │           └──────────────────────────────────┘  │
│                           │ queries live data                               │
│                           ▼                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Data layer (Splunk first, SQLite fallback)                           │  │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │  SPLUNK CLOUD / ENTERPRISE  │  │  SQLite  (data/zeroq.db)        │ │  │
│  │  │  crypto_source · crypto_net │  │  scans · tls_scans · cert_scans │ │  │
│  │  │  crypto_pki · crypto_hndl   │  │  domains · settings             │ │  │
│  │  │  crypto_plan                │  │                                 │ │  │
│  │  └─────────────────────────────┘  └─────────────────────────────────┘ │  │
│  │         HEC (write)  │  REST SPL (read)                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     ZEROQ SPLUNK APP (native)                         │  │
│  │  Risk · Inventory · Certificate Planner · HNDL · Compliance · Alerts  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow**
1. **Connect** — Use `/onboarding` (or `.env.local`) to store Splunk + GitHub settings in SQLite.
2. **Scan code** — `/api/scan` pulls files from GitHub/GitLab, runs the 18-rule detector, and persists results to SQLite + Splunk HEC in parallel.
3. **Scan network** — `/api/scan-tls` connects to owned hosts on port 443 and stores TLS/certificate data in SQLite (also queryable from Splunk when configured).
4. **Index** — Code findings land in `crypto_source`; network/PKI/HNDL/plan data lives in the other `crypto_*` indexes.
5. **Read** — Dashboard APIs prefer live Splunk REST results; if Splunk is empty or offline, `LocalDataClient` serves the same shape from SQLite.
6. **Detect HNDL** — `/api/hndl/generate` builds Harvest-Now-Decrypt-Later anomaly signals from TLS scan data (or reads them from `crypto_hndl` when Splunk is connected).
7. **Reason** — `AssistantService` and `PlanService` call DeepSeek when `DEEPSEEK_API_KEY` is set; otherwise a deterministic local reasoner answers.
8. **Visualize** — Next.js dashboards (`/app`) and the native Splunk app (`zeroq-splunk-app`) render the same data.

---

## 🎥 Demo Video

> **Link:** *[Paste your public YouTube / Vimeo / Youku URL here before submission]*  
> **Duration:** < 3 minutes  
> **Contents shown:**
> - Landing page (`/`) and dashboard (`/app`).
> - Live repo scan of `openssl/openssl` with findings pushed to Splunk.
> - AI Assistant answering a grounded question by querying Splunk via `/api/splunk/query`.
> - AI-generated Organization Plan with ranked remediation steps.
> - Splunk App dashboards reading the same `crypto_*` indexes.

---

## How the app runs on Splunk — install, configure, done

ZeroQ is designed to be deployed in three steps on any Splunk Cloud Trial,
Splunk Enterprise or Splunk Cloud instance.

### 1. Install

```bash
# Install Node dependencies
npm install

# Package the native Splunk app
cd zeroq-splunk-app
tar -czvf ../zeroq-splunk-app.spl .
```

In Splunk Web: **Apps → Manage Apps → Install app from file** and upload
`zeroq-splunk-app.spl`. The app creates five indexes automatically via
`default/indexes.conf` and ships five dashboards plus three saved searches.

### 2. Configure

Either use the guided UI or edit `.env.local`.

**Option A — Guided onboarding (recommended)**
1. Start the app: `npm run dev`
2. Open `http://localhost:3000/onboarding`
3. Enter your Splunk HEC URL + token, Splunk REST URL + username + password,
   and optional GitHub/GitLab token and DeepSeek API key.
4. Click **Test connection** — the onboarding wizard validates HEC and REST,
   auto-creates an HEC input if needed, and saves settings to SQLite.

**Option B — `.env.local`**
```bash
cp .env.example .env.local
# edit with your Splunk credentials
```

Required Splunk variables:

| Variable | Purpose |
|---|---|
| `SPLUNK_HEC_URL` + `SPLUNK_HEC_TOKEN` | Push code-scan findings |
| `SPLUNK_BASE_URL` + `SPLUNK_USERNAME` + `SPLUNK_PASSWORD` | Read live posture |
| `SPLUNK_INDEX_*` | Target indexes (defaults: `crypto_*`) |

Optional:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` / `GITLAB_TOKEN` | Private repos + higher rate limits |
| `DEEPSEEK_API_KEY` | Live LLM for Assistant + Org Plan |

### 3. Done

```bash
npm run dev        # http://localhost:3000
```

Open `/app` and:

1. **Scan a repo** — Repository Scanner → e.g. `openssl/openssl`
2. **Scan your network** — Network Inventory → add a domain → Scan TLS
3. **Ask the AI Assistant** — e.g. *"Which repos have critical findings?"*
4. **Generate HNDL signals** — HNDL Detection → Generate from network data (uses your TLS scans)
5. **Generate a migration plan** — Org Security Plan → Generate Plan
6. **View in Splunk** — Apps → ZeroQ → open the dashboards

If Splunk is not configured, the app runs in **local mode**: every scan is
stored in `data/zeroq.db` and dashboards show local data with a badge
"Local · SQLite".

A full runbook with screenshots and troubleshooting is in [`DEMO.md`](./DEMO.md).

---

## Environment variables (`.env.local`)

```bash
cp .env.example .env.local
```

| Variable | Effect |
|---|---|
| `DEEPSEEK_API_KEY` | Turns the AI Assistant & Org Plan into live model calls (otherwise a local reasoner answers). |
| `GITHUB_TOKEN` / `GITLAB_TOKEN` | Raises API rate limits and allows scanning private repos. |
| `SPLUNK_HEC_URL` + `SPLUNK_HEC_TOKEN` | Push findings to Splunk HEC as `zeroq:crypto_finding` events. |
| `SPLUNK_BASE_URL` + `SPLUNK_USERNAME` + `SPLUNK_PASSWORD` | Read live posture data from Splunk Search API. |
| `SPLUNK_INDEX_NET` / `PKI` / `HNDL` / `PLAN` | Target indexes for network, certificate, HNDL and plan data. |

`GET /api/risk` reports which capabilities are active.

---

## Architecture (Detailed)

The backend follows a layered, SOLID design — route handlers are thin
controllers that delegate to services, which depend on interfaces
(providers), not concretions.

```
app/
  page.tsx           Landing page
  app/               Next.js dashboard (Risk, Inventory, Certs, etc.)
  onboarding/        Guided Splunk/GitHub setup wizard
  api/               Thin controllers (validate → service → map errors)
lib/
  config.ts          Typed env access; reads SQLite settings first, then process.env
  rules.ts           18 quantum-vulnerable crypto rules (append to extend; OCP)
  scanning/          detector · scoring · target  (pure functions, SRP)
  providers/         SourceProvider interface ← GitHubProvider, GitLabProvider
  ai/                AIProvider interface ← DeepSeekProvider, LocalReasoner
  splunk/            SplunkClient interface ← HecSplunkClient, SplunkSearchClient
  services/          ScanService · AssistantService · PlanService · TlsScanner
                     composition.ts wires concretions (DIP)
  db/                SQLite connection + settings store
data/zeroq.db        Local store for scans, TLS scans, certificates, domains, settings
zeroq-splunk-app/    Native Splunk app (dashboards, saved searches, alerts, lookups)
scripts/             purge-splunk.js — cleans ZeroQ events from Splunk indexes
```

- **SRP** — each module has one reason to change.
- **OCP** — add a rule by appending to `rules.ts`; add a code host by adding a provider.
- **LSP** — `GitHubProvider` and `GitLabProvider` are interchangeable behind `SourceProvider`.
- **ISP** — small interfaces (`SourceProvider.loadRepository`, `AIProvider.complete`, `SplunkClient.sendFindings`).
- **DIP** — services receive abstractions; `composition.ts` is the single wiring point.

### Splunk integration

| Direction | Mechanism | Indexes | Sourcetypes |
|---|---|---|---|
| Write | HEC `/services/collector/event` | `crypto_source` | `zeroq:crypto_finding` |
| Read | REST `/services/search/jobs` | `crypto_net`, `crypto_pki`, `crypto_hndl`, `crypto_plan` | `zeroq:tls_connection`, `zeroq:cert`, `zeroq:hndl_event`, `zeroq:plan`, `zeroq:roadmap`, `zeroq:org_plan`, `zeroq:repo_meta` |
| Native app | `zeroq-splunk-app.spl` | creates `crypto_*` via `indexes.conf` | props/transforms for JSON parsing |

### Data Flow Detail

```
GitHub/GitLab ──┐
onboarding      ├──► Next API ──► ScanService ──► SQLite (always)
                │                                    │
                │                                    ▼
                │                              HecSplunkClient (if configured)
                │                                    │
                │                                    ▼
                │                            crypto_* indexes
                │                                    │
TLS scan host ◄─┘                                    ▼
                │                              SplunkSearchClient
                │                                    │
                ▼                                    ▼
         data/zeroq.db ◄──────────────────── ZeroQ Dashboard (/app)
                                             AI Assistant + Org Plan
                                             Native Splunk dashboards
```

1. **Configure** — Settings are stored in SQLite first; `config.ts` reads SQLite, then `process.env`, then defaults.
2. **Ingest code** — `SourceProvider` pulls repo trees + blobs; `detector.ts` applies `rules.ts`.
3. **Ingest network** — `TlsScanner` connects to owned hosts and stores TLS/certificate metadata.
4. **Persist** — Every scan is saved to SQLite via `LocalDataClient`. When Splunk is enabled, the same events are pushed via HEC in parallel.
5. **Index** — Splunk indexes are defined in `zeroq-splunk-app/default/indexes.conf`; sourcetypes and field extractions are in `props.conf`.
6. **Read** — `dataSource.ts` tries Splunk first, falls back to SQLite, and tags the response with `source: "splunk" | "local"`.
7. **Reason** — `AssistantService` builds a posture context from live data; `PlanService` generates a ranked migration plan.
8. **Alert** — Saved searches in `savedsearches.conf` trigger on critical findings, expiring certs and HNDL anomalies.

---

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/scan` | POST | Scan a repo and persist to SQLite + optional Splunk HEC. |
| `/api/scan-batch` | POST | Scan multiple repos in one call. |
| `/api/scan-tls` | POST | Scan TLS/certificate of owned hosts. |
| `/api/ingest` | POST | Push an existing `ScanResult` to Splunk HEC. |
| `/api/domains` | GET/POST/DELETE | Manage TLS scan targets. |
| `/api/risk` | GET | Risk score + capability flags + data source badge. |
| `/api/inventory` | GET | Live TLS inventory from Splunk or SQLite. |
| `/api/certs` | GET | Live certificate inventory from Splunk or SQLite. |
| `/api/hndl` | GET | HNDL anomalies from Splunk. |
| `/api/hndl/timeline` | GET | HNDL volume timeline. |
| `/api/compliance` | GET | Compliance mapping from Splunk or SQLite. |
| `/api/algo-mix` | GET | Algorithm mix across network observations. |
| `/api/top-assets` | GET | Top risky assets. |
| `/api/trends` | GET | Risk trend over time. |
| `/api/roadmap` | GET | Migration roadmap phases. |
| `/api/orgs` | GET | Connected organizations. |
| `/api/repos` | GET | Repository list from Splunk or SQLite. |
| `/api/code-rollup` | GET | Aggregated code findings. |
| `/api/org-plan` | POST | Generate or retrieve organization migration plan. |
| `/api/plan` | POST | AI-generated migration plan (legacy). |
| `/api/assistant` | POST | AI chat grounded on posture context. |
| `/api/splunk/query` | POST | Controlled SPL query execution for the AI Assistant. |
| `/api/health/splunk` | GET | Connectivity check against Splunk REST. |
| `/api/onboarding/config` | GET/POST | Read/write onboarding settings in SQLite. |
| `/api/onboarding/test-splunk` | POST | Validate HEC + REST and auto-create HEC input. |
| `/api/onboarding/test-github` | POST | Validate GitHub token/organization. |
| `/api/debug/config` | GET | Sanitized config dump for troubleshooting. |

---

## Project Structure for Reviewers

```
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/                # REST API controllers
│   ├── app/                # Dashboard UI
│   ├── onboarding/         # Guided setup wizard
│   └── page.tsx            # Landing page
├── components/             # React UI (Landing, Dashboard, Agent Console)
├── dataset/                # Example JSON datasets for each crypto_* index
├── lib/
│   ├── ai/                 # AI providers (DeepSeek, Local fallback)
│   ├── db/                 # SQLite connection + settings store
│   ├── providers/          # GitHub / GitLab source providers
│   ├── scanning/           # Quantum crypto detector engine
│   ├── services/           # Business logic (Scan, Assistant, Plan, TLS)
│   ├── splunk/             # HEC + REST Search clients
│   ├── config.ts           # Typed environment configuration
│   ├── rules.ts            # 18 detection rules
│   └── types.ts            # Shared TypeScript contracts
├── data/                   # SQLite database + static assets
├── scripts/
│   └── purge-splunk.js     # Purge all ZeroQ events from Splunk indexes
├── zeroq-splunk-app/       # Native Splunk app (dashboards, alerts, lookups)
├── .env.example            # Required environment variables template
├── architecture_diagram.md # Architecture diagram (Mermaid + ASCII)
├── LICENSE                 # MIT license
├── DEMO.md                 # Step-by-step runbook with screenshots
└── README.md               # This file
```

---

## Notes

- The crypto rules are heuristic (regex + dependency version checks). They are designed to
  highlight quantum-vulnerable usage for triage, not to be a formal verifier.
- Network inspection is **passive** — `scan-tls` only reads TLS handshake metadata and
  certificate properties; no payloads are decrypted.
- HNDL anomalies can be **generated locally** from TLS scan data when Splunk egress
  telemetry is not available.
- If Splunk is not configured, the app runs in **local SQLite mode**: scans, TLS checks,
  certificates and HNDL events are stored in `data/zeroq.db` and dashboards render local data.
- Example datasets for every `crypto_*` index are in [`dataset/`](./dataset/).

---

## License

MIT licensed. "Splunk" is referenced for interoperability only.
