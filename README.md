# ZeroQ — Next.js + Splunk

> **Splunk Agentic Ops Hackathon · Security track**  
> Find every quantum-vulnerable cryptographic usage across your **code** and your
> **network**, then let an AI agent generate and execute the migration plan —
> backed by a real Splunk Cloud Trial or Splunk Enterprise instance.

A full **Next.js 14 (App Router + TypeScript)** application with a real backend:

- **Real repository scanning** — `/api/scan` fetches any public GitHub or GitLab repo
  server-side and runs an 18-rule quantum-vulnerable crypto detector (`lib/scanning/`)
  over the source, returning findings down to `file:line` with a remediation for each.
- **Real AI** — `/api/assistant` and `/api/plan` call an LLM (DeepSeek) grounded on your
  live posture + scanned repos. No key? A deterministic local reasoner keeps it functional.
- **Real Splunk integration** — push **and** read from Splunk:
  - `/api/scan` + `/api/ingest` push findings to **Splunk HEC** (`zeroq:crypto_finding`).
  - `/api/inventory`, `/api/certs`, `/api/hndl`, `/api/compliance`, `/api/risk` read live data
    from Splunk via the **REST Search API**.
  - `/api/splunk/query` lets the AI Assistant run controlled SPL queries for grounded answers.
- **Splunk App** — `zeroq-splunk-app/` contains dashboards nativos para Risk, Inventory, PKI,
  HNDL y Compliance, con saved searches y alertas listas para instalar.
- **Marketing landing page** at `/`, the full dashboard at `/app`.

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

## Architecture

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

## Data flow

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

## Notes

- The crypto rules are heuristic (regex + dependency version checks). They are designed to
  highlight quantum-vulnerable usage for triage, not to be a formal verifier.
- Network inspection in a real deployment is **passive** — only TLS handshake metadata is
  read from Zeek logs; no payloads are decrypted.
- If Splunk is not configured, the app degrades gracefully to seed data and the scanner
  still works in standalone mode.

MIT licensed. "Splunk" is referenced for interoperability only.
