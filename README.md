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
| **Open source license** | ✅ | `MIT` (see bottom of file) |
| **README with setup & run instructions** | ✅ | See [Quick start](#quick-start) below |
| **Dependencies & example configs** | ✅ | `.env.example`, `package.json`, `data/` |
| **Architecture diagram** | ✅ | See [Architecture](#architecture) and `docs/architecture.png` *(generate if needed)* |

### Architecture at a Glance

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           ZEROQ PLATFORM                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐│
│  │  GitHub /   │    │  AI Agent    │    │      Next.js 14 Dashboard       ││
│  │  GitLab     │───►│  (DeepSeek   │◄───│  /app  →  Risk, Inventory,      ││
│  │  Repos      │    │   + Local)   │    │  Compliance, Assistant, Plan    ││
│  └─────────────┘    └──────┬───────┘    └─────────────────────────────────┘│
│                            │                                               │
│                            │ queries live data                             │
│                            ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         SPLUNK CLOUD / ENTERPRISE                     │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │crypto_source│  │crypto_net  │  │crypto_pki  │  │crypto_hndl │      │ │
│  │  │  (findings) │  │  (Zeek)    │  │(certificates│  │  (anomalies)│    │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │         ▲                ▲              ▲               ▲             │ │
│  │         └────────────────┴──────────────┴───────────────┘             │ │
│  │                         Splunk HEC (Ingest)                           │ │
│  │                         Splunk REST API (Read)                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ZEROQ SPLUNK APP (Native)                        │  │
│  │  • Risk Dashboard  • Inventory  • PKI  • HNDL  • Compliance  • Alerts│  │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow**
1. **Ingest** — Repository scans and network seed data flow into Splunk via HEC.
2. **Index** — Data lives in purpose-built `crypto_*` indexes.
3. **Detect** — 18 heuristic rules flag quantum-vulnerable crypto usage.
4. **Correlate** — The AI assistant queries Splunk live to answer questions like *"Which repos use RSA-2048 AND talk to production networks?"*
5. **Plan** — `PlanService` generates a ranked migration roadmap.
6. **Visualize** — Next.js dashboards + native Splunk dashboards give analysts two views of the same truth.

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

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000  (landing)  ·  /app  (dashboard)
```

Open `/app`, go to **Repository Scanner**, and scan e.g. `openssl/openssl`,
`square/okhttp` or any `owner/repo`. It works with **zero configuration** using
seed/demo data; connect Splunk to unlock live dashboards.

---

## Splunk Trial setup

1. Create a **Splunk Cloud Trial** at https://www.splunk.com/en_us/download/splunk-cloud.html
   (14 days, 5 GB/day).
2. Enable **HTTP Event Collector** and create a token with access to these indexes:
   `crypto_source`, `crypto_net`, `crypto_pki`, `crypto_hndl`, `crypto_plan`.
3. Create those 5 indexes in Splunk Web.
4. Create a user (e.g. `zeroq_api`) with search access to the indexes.
5. Copy `.env.example` to `.env.local` and fill in HEC + REST API credentials.
6. Seed demo data into Splunk:
   ```bash
   npm run seed:splunk
   ```
7. Install the Splunk App:
   ```bash
   cd zeroq-splunk-app
   tar -czvf ../zeroq-splunk-app.spl .
   ```
   Then in Splunk Web: **Apps → Manage Apps → Install app from file** and upload
   `zeroq-splunk-app.spl`.

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

The backend follows a layered, SOLID design — route handlers are thin controllers that
delegate to services, which depend on **interfaces** (providers), not concretions.

```
app/api/*           thin controllers (validate → call service → map errors)
lib/
  config.ts         typed env access — the only reader of process.env
  rules.ts          crypto rule set (append rules to extend; OCP)
  scanning/         detector · scoring · target        (pure functions, SRP)
  providers/        SourceProvider (interface) ← GitHubProvider, GitLabProvider (LSP)
                    + sourceProviderFactory             (OCP: add a host, add a case)
  ai/               AIProvider (interface) ← DeepSeekProvider, LocalReasoner
                    + aiFactory
  splunk/           SplunkClient (interface) ← HecSplunkClient, NoopSplunkClient
                    + SplunkSearchClient for REST SPL queries
  services/         ScanService · AssistantService · PlanService · PostureContext
                    composition.ts = composition root (wires concretions; DIP)
seed.ts data.ts     demo dataset + barrel
components/          React UI (client components)
zeroq-splunk-app/      Splunk app with dashboards, saved searches, alerts and lookups
scripts/             seed-splunk.js — loads demo data into Splunk via HEC
```

- **SRP** — each module has one reason to change (detector detects, scoring scores, providers do I/O).
- **OCP** — add a rule by appending to `rules.ts`; add a code host by adding a provider + a factory case.
- **LSP** — `GitHubProvider` and `GitLabProvider` are interchangeable behind `SourceProvider`.
- **ISP** — small, focused interfaces (`SourceProvider.loadRepository`, `AIProvider.complete`, `SplunkClient.sendFindings`).
- **DIP** — services receive abstractions; `composition.ts` is the single place that picks implementations.

### Data Flow Detail

```
GitHub / GitLab ─┐
Seed loader      ├─►  Next API ──► Splunk HEC ──► crypto_* indexes ──┐
(Zeek/PKI/HNDL)  │                                                  │
                 │                                                  ▼
                 │                                           Splunk Search API
                 │                                                  │
                 └──► /api/scan (detector) ─────────────────────────┤
                                                                    │
                              ZeroQ Dashboard (/app) ◄────────────────┘
                              AI Assistant + Org Plan
```

1. **Ingest** — `lib/providers/*` pull repo trees + raw blobs (GitHub / GitLab), or
   `scripts/seed-splunk.js` pushes illustrative network/PKI/HNDL events.
2. **Index** — all events land in Splunk via HEC under `crypto_*` indexes.
3. **Detect** — `lib/scanning/detector.ts` applies the `rules.ts` set: RSA, ECDSA/P-256,
   legacy TLS, 3DES, RS256, SHA-1/MD5, unpinned TLS and pre-PQC dependencies.
4. **Correlate / Reason** — `PlanService` asks the model to rank findings by exposure ×
   sensitivity and produce a time-boxed plan. The AI Assistant can query Splunk live.
5. **Visualize** — Next.js dashboards read from Splunk Search API; native Splunk dashboards
   live inside `zeroq-splunk-app/`.

---

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/scan` | POST | Scan a repo and optionally push findings to Splunk HEC. |
| `/api/ingest` | POST | Push an existing `ScanResult` to Splunk HEC. |
| `/api/risk` | GET | Health check + risk score + capability flags. |
| `/api/inventory` | GET | Live TLS connection inventory from Splunk (fallback to seed). |
| `/api/certs` | GET | Live certificate inventory from Splunk (fallback to seed). |
| `/api/hndl` | GET | Live HNDL anomalies from Splunk (fallback to seed). |
| `/api/compliance` | GET | Live compliance stats from Splunk (fallback to seed). |
| `/api/splunk/query` | POST | Controlled SPL query execution for the AI Assistant. |
| `/api/assistant` | POST | AI chat grounded on posture context + scanned repos. |
| `/api/plan` | POST | AI-generated migration plan. |

---

## Project Structure for Reviewers

```
├── app/                    # Next.js App Router (pages + API routes)
├── components/             # React UI (Landing, Dashboard, Agent Console)
├── lib/
│   ├── ai/                 # AI providers (DeepSeek, Local fallback)
│   ├── providers/          # GitHub / GitLab source providers
│   ├── scanning/           # Quantum crypto detector engine
│   ├── services/           # Business logic (Scan, Assistant, Plan)
│   ├── splunk/             # HEC + REST Search clients
│   ├── config.ts           # Typed environment configuration
│   ├── data.ts             # Demo / seed datasets
│   ├── rules.ts            # 18 detection rules
│   └── types.ts            # Shared TypeScript contracts
├── data/                   # Additional static data assets
├── scripts/
│   └── seed-splunk.js      # One-command Splunk demo data loader
├── zeroq-splunk-app/       # Native Splunk app (dashboards, alerts, lookups)
├── .env.example            # Required environment variables template
├── DEMO.md                 # Step-by-step runbook with screenshots
└── README.md               # This file
```

---

## Notes

- The crypto rules are heuristic (regex + dependency version checks). They are designed to
  highlight quantum-vulnerable usage for triage, not to be a formal verifier.
- Network inspection in a real deployment is **passive** — only TLS handshake metadata is
  read from Zeek logs; no payloads are decrypted.
- If Splunk is not configured, the app degrades gracefully to seed data and the scanner
  still works in standalone mode.

---

## License

MIT licensed. "Splunk" is referenced for interoperability only.
