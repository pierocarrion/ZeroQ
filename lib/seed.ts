// ============================================================
// data.ts — illustrative demo data for network/PKI/compliance
// views. Repository scanning and AI are REAL (see lib/*, api/*);
// these seed the dashboard panels that would otherwise come from
// Splunk (zeek:ssl, zeek:x509) in a deployed install.
// ============================================================

export const DATA = {
  summary: {
    riskScore: 68, riskBand: "High", lastMonthScore: 77,
    endpointsScanned: 4218, connectionsObserved: 1308204, certsTracked: 642,
    scanStatus: "live", lastEventAgo: "3s", coverage: 96,
  },
  riskBreakdown: [
    { key: "critical", label: "Critical", value: 23, color: "var(--crit)" },
    { key: "high", label: "High", value: 184, color: "var(--high)" },
    { key: "monitor", label: "Monitor", value: 412, color: "var(--warn)" },
    { key: "safe", label: "Safe", value: 689, color: "var(--safe)" },
  ],
  riskTrend: [88, 87, 85, 86, 83, 81, 80, 78, 77, 74, 71, 68],
  remediated: [12, 8, 19, 14, 22, 17, 28, 24, 31, 26, 38, 33],
  algoMix: [
    { algo: "RSA key exchange", pct: 18, risk: "critical" },
    { algo: "ECDHE · secp256r1", pct: 31, risk: "high" },
    { algo: "ECDHE · secp384r1", pct: 9, risk: "high" },
    { algo: "Legacy TLS 1.0/1.1", pct: 6, risk: "high" },
    { algo: "TLS 1.2 · ECDHE", pct: 24, risk: "monitor" },
    { algo: "TLS 1.3 + ML-KEM", pct: 12, risk: "safe" },
  ],
  topAssets: [
    { name: "payments-api.prod", risk: "critical", algo: "RSA key exchange", hosts: 38, txns: "41.2k/day", sensitivity: "PCI · Tier-0" },
    { name: "auth-gateway.prod", risk: "critical", algo: "RSA key exchange", hosts: 22, txns: "88.6k/day", sensitivity: "Identity · Tier-0" },
    { name: "records-db.internal", risk: "high", algo: "ECDHE secp256r1", hosts: 14, txns: "12.1k/day", sensitivity: "PHI · Tier-1" },
    { name: "partner-edi.dmz", risk: "high", algo: "Legacy TLS 1.1", hosts: 7, txns: "3.4k/day", sensitivity: "B2B · Tier-1" },
    { name: "analytics-bus.internal", risk: "monitor", algo: "TLS 1.2 ECDHE", hosts: 61, txns: "210k/day", sensitivity: "Telemetry · Tier-2" },
  ],
  RISK: {
    critical: { label: "Critical", tone: "crit" },
    high: { label: "High", tone: "high" },
    monitor: { label: "Monitor", tone: "warn" },
    safe: { label: "Safe", tone: "safe" },
  } as Record<string, { label: string; tone: string }>,
  inventory: [
    { server: "payments-api.prod.company.com", src: "10.1.5.22", dst: "52.84.12.101", version: "TLS 1.2", cipher: "TLS_RSA_WITH_AES_128_CBC_SHA", curve: "—", risk: "critical", hosts: 38, seen: "3s" },
    { server: "auth-gateway.prod.company.com", src: "10.1.5.41", dst: "10.2.0.18", version: "TLS 1.2", cipher: "TLS_RSA_WITH_AES_256_GCM_SHA384", curve: "—", risk: "critical", hosts: 22, seen: "8s" },
    { server: "legacy-vpn.dmz.company.com", src: "10.4.9.2", dst: "198.51.100.7", version: "TLS 1.0", cipher: "TLS_RSA_WITH_3DES_EDE_CBC_SHA", curve: "—", risk: "critical", hosts: 4, seen: "21s" },
    { server: "records-db.internal.company.com", src: "10.2.7.11", dst: "10.2.7.40", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 14, seen: "5s" },
    { server: "partner-edi.dmz.company.com", src: "10.4.1.8", dst: "203.0.113.55", version: "TLS 1.1", cipher: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA", curve: "secp256r1", risk: "high", hosts: 7, seen: "12s" },
    { server: "mail-relay.prod.company.com", src: "10.1.8.30", dst: "142.250.1.26", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", curve: "secp384r1", risk: "high", hosts: 9, seen: "2s" },
    { server: "crm.internal.company.com", src: "10.3.2.5", dst: "10.3.2.9", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 31, seen: "1s" },
    { server: "analytics-bus.internal.company.com", src: "10.5.0.2", dst: "10.5.0.88", version: "TLS 1.2", cipher: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "monitor", hosts: 61, seen: "4s" },
    { server: "cdn-edge.prod.company.com", src: "10.1.2.7", dst: "151.101.1.5", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256", curve: "secp256r1", risk: "monitor", hosts: 44, seen: "6s" },
    { server: "wiki.internal.company.com", src: "10.3.9.14", dst: "10.3.9.2", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", curve: "secp384r1", risk: "monitor", hosts: 18, seen: "9s" },
    { server: "api-gw.prod.company.com", src: "10.1.5.60", dst: "10.1.5.61", version: "TLS 1.3", cipher: "TLS_AES_256_GCM_SHA384", curve: "X25519MLKEM768", risk: "safe", hosts: 27, seen: "1s" },
    { server: "identity-v2.prod.company.com", src: "10.2.1.3", dst: "10.2.1.9", version: "TLS 1.3", cipher: "TLS_AES_128_GCM_SHA256", curve: "X25519MLKEM768", risk: "safe", hosts: 16, seen: "3s" },
    { server: "metrics.internal.company.com", src: "10.5.4.2", dst: "10.5.4.10", version: "TLS 1.3", cipher: "TLS_CHACHA20_POLY1305_SHA256", curve: "X25519MLKEM768", risk: "safe", hosts: 52, seen: "2s" },
    { server: "backup-svc.internal.company.com", src: "10.6.0.4", dst: "10.6.0.20", version: "TLS 1.2", cipher: "TLS_RSA_WITH_AES_256_CBC_SHA256", curve: "—", risk: "critical", hosts: 6, seen: "33s" },
    { server: "iot-hub.ot.company.com", src: "10.9.1.2", dst: "10.9.1.50", version: "TLS 1.0", cipher: "TLS_RSA_WITH_AES_128_CBC_SHA", curve: "—", risk: "critical", hosts: 12, seen: "15s" },
    { server: "support-portal.dmz.company.com", src: "10.4.3.6", dst: "104.18.2.9", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 8, seen: "7s" },
    { server: "datalake.internal.company.com", src: "10.5.7.1", dst: "10.5.7.30", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", curve: "secp384r1", risk: "monitor", hosts: 29, seen: "5s" },
    { server: "billing.prod.company.com", src: "10.1.6.12", dst: "10.1.6.40", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 19, seen: "2s" },
    { server: "dns-doh.prod.company.com", src: "10.1.0.5", dst: "10.1.0.6", version: "TLS 1.3", cipher: "TLS_AES_256_GCM_SHA384", curve: "X25519MLKEM768", risk: "safe", hosts: 40, seen: "1s" },
    { server: "hr-portal.internal.company.com", src: "10.3.5.8", dst: "10.3.5.2", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 11, seen: "10s" },
  ],
  certs: [
    { subject: "CN=payments-api.prod.company.com", alg: "rsaEncryption", bits: 2048, expiry: 47, issuer: "DigiCert TLS RSA", urgency: "renew" },
    { subject: "CN=auth-gateway.prod.company.com", alg: "rsaEncryption", bits: 2048, expiry: 73, issuer: "DigiCert TLS RSA", urgency: "renew" },
    { subject: "CN=*.dmz.company.com", alg: "rsaEncryption", bits: 2048, expiry: 12, issuer: "Internal PKI Root", urgency: "renew" },
    { subject: "CN=records-db.internal.company.com", alg: "id-ecPublicKey", bits: 256, expiry: 188, issuer: "Internal PKI Root", urgency: "plan" },
    { subject: "CN=billing.prod.company.com", alg: "rsaEncryption", bits: 4096, expiry: 240, issuer: "DigiCert TLS RSA", urgency: "plan" },
    { subject: "CN=crm.internal.company.com", alg: "id-ecPublicKey", bits: 256, expiry: 301, issuer: "Internal PKI Root", urgency: "plan" },
    { subject: "CN=partner-edi.dmz.company.com", alg: "rsaEncryption", bits: 2048, expiry: 58, issuer: "Sectigo RSA DV", urgency: "renew" },
    { subject: "CN=mail-relay.prod.company.com", alg: "id-ecPublicKey", bits: 384, expiry: 412, issuer: "Internal PKI Root", urgency: "monitor" },
    { subject: "CN=datalake.internal.company.com", alg: "id-ecPublicKey", bits: 384, expiry: 520, issuer: "Internal PKI Root", urgency: "monitor" },
    { subject: "CN=hr-portal.internal.company.com", alg: "rsaEncryption", bits: 2048, expiry: 96, issuer: "Internal PKI Root", urgency: "plan" },
    { subject: "CN=api-gw.prod.company.com", alg: "ML-DSA-65", bits: null, expiry: 360, issuer: "PQC Internal CA", urgency: "done" },
    { subject: "CN=identity-v2.prod.company.com", alg: "ML-DSA-65", bits: null, expiry: 358, issuer: "PQC Internal CA", urgency: "done" },
    { subject: "CN=iot-hub.ot.company.com", alg: "rsaEncryption", bits: 1024, expiry: 5, issuer: "Legacy OT CA", urgency: "renew" },
    { subject: "CN=backup-svc.internal.company.com", alg: "rsaEncryption", bits: 2048, expiry: 150, issuer: "Internal PKI Root", urgency: "plan" },
  ],
  certBuckets: [
    { label: "< 30d", count: 2, tone: "crit" },
    { label: "30-90d", count: 4, tone: "high" },
    { label: "90-365d", count: 5, tone: "warn" },
    { label: "> 1yr", count: 3, tone: "safe" },
  ],
  hndlTimeline: (() => {
    const base: number[] = [];
    for (let i = 0; i < 48; i++) {
      const diurnal = 14 + 9 * Math.sin((i / 48) * Math.PI * 2 - 1.2);
      const noise = (Math.sin(i * 2.3) + Math.cos(i * 1.7)) * 1.4;
      base.push(Math.max(3, +(diurnal + noise).toFixed(1)));
    }
    for (let i = 34; i <= 41; i++) base[i] = +(base[i] + 38 + (i - 34) * 1.5).toFixed(1);
    return base;
  })(),
  hndlAnomalies: [
    { dst: "185.220.101.44", asn: "AS-UNKNOWN", geo: "Frankfurt, DE", volume: "312 GB", baseline: "14 GB/day", deviation: 21.4, sessions: 1840, window: "34h–41h", status: "active", note: "Sustained bulk transfer to first-seen destination. No business owner mapped." },
    { dst: "91.219.237.18", asn: "AS-RIPE-204", geo: "Bucharest, RO", volume: "88 GB", baseline: "6 GB/day", deviation: 14.7, sessions: 640, window: "rolling 24h", status: "active", note: "Encrypted egress to bulletproof-hosting ASN, off-hours pattern." },
    { dst: "45.133.1.9", asn: "AS-UNKNOWN", geo: "Unknown", volume: "54 GB", baseline: "9 GB/day", deviation: 6.0, sessions: 410, window: "rolling 24h", status: "watch", note: "Long-lived TLS 1.2 sessions, large record sizes, low interactivity." },
    { dst: "103.224.182.7", asn: "AS-APNIC-92", geo: "Singapore, SG", volume: "31 GB", baseline: "11 GB/day", deviation: 2.8, sessions: 220, window: "rolling 24h", status: "watch", note: "Elevated but within seasonal partner-sync tolerance. Monitoring." },
  ],
  compliance: [
    { framework: "NIST IR 8547", authority: "NIST", desc: "Transition to post-quantum cryptography standards", milestones: [{ year: "2024", label: "FIPS 203/204/205 finalized", state: "past" }, { year: "2030", label: "RSA / ECDSA deprecated for federal use", state: "target" }, { year: "2035", label: "Quantum-vulnerable algorithms disallowed", state: "target" }], progress: 41, mapped: 207, atRisk: 23 },
    { framework: "NSA CNSA 2.0", authority: "NSA", desc: "Commercial National Security Algorithm Suite 2.0", milestones: [{ year: "2025", label: "ML-KEM required for new NSS", state: "past" }, { year: "2030", label: "PQC default across software/firmware", state: "target" }, { year: "2033", label: "Exclusive PQC for national security systems", state: "target" }], progress: 28, mapped: 64, atRisk: 11 },
    { framework: "CISA PQC Roadmap", authority: "CISA", desc: "Cryptographic inventory & migration prioritization", milestones: [{ year: "2025", label: "Maintain living crypto inventory", state: "past" }, { year: "2027", label: "Prioritize HVA migration", state: "active" }, { year: "2035", label: "Complete enterprise migration", state: "target" }], progress: 55, mapped: 311, atRisk: 18 },
  ],
  roadmap: [
    { phase: "Phase 1 · Stop the bleeding", window: "Weeks 1–3", tone: "crit", items: [
      { asset: "payments-api.prod", action: "Enable TLS 1.3 with X25519MLKEM768 hybrid key exchange", effort: "2 days", impact: "Removes #1 quantum-exposed asset (PCI, 41.2k txns/day)", why: "Static RSA key exchange — fully harvestable today." },
      { asset: "auth-gateway.prod", action: "Rotate to ML-KEM hybrid + ML-DSA-65 certificate", effort: "3 days", impact: "Protects 88.6k identity assertions/day", why: "RSA key exchange on the identity tier." },
      { asset: "iot-hub.ot · legacy-vpn.dmz", action: "Disable TLS 1.0/1.1 and 3DES; isolate OT segment", effort: "1 day", impact: "Eliminates 3 critical legacy endpoints", why: "1024-bit RSA + 3DES, classically weak already." },
    ]},
    { phase: "Phase 2 · High-value migration", window: "Weeks 4–9", tone: "high", items: [
      { asset: "records-db · crm · billing", action: "Roll secp256r1 → ML-KEM hybrid on Tier-1 services", effort: "6 days", impact: "Covers 64 hosts handling PHI / financial data", why: "ECC P-256 curve is Shor-breakable." },
      { asset: "partner-edi.dmz", action: "Coordinate PQC-capable TLS with B2B partners", effort: "2 wks", impact: "Closes external legacy-TLS exposure", why: "TLS 1.1 forced by partner endpoint." },
    ]},
    { phase: "Phase 3 · Sustain & verify", window: "Weeks 10–16", tone: "safe", items: [
      { asset: "Fleet-wide", action: "Set crypto policy: TLS 1.3 + hybrid PQC default, alert on regressions", effort: "ongoing", impact: "Locks in target state, prevents drift", why: "Continuous crypto-agility posture." },
      { asset: "PKI", action: "Migrate Internal PKI Root to ML-DSA; auto-issue PQC certs", effort: "1 wk", impact: "Quantum-safe certificate supply chain", why: "Removes RSA from the trust root." },
    ]},
  ],
  roadmapNote: "Migration is a configuration and policy effort — measured in engineer-days, not the millions in capital that quantum hardware costs. The economic asymmetry favors defenders who start now.",
  orgs: [
    { id: "gh-acme", provider: "github", name: "acme-corp", repos: 38, scanned: 38, lastScan: "4m", status: "connected", stars: "2.1k", members: 142 },
    { id: "gl-acme", provider: "gitlab", name: "acme-corp/platform", repos: 21, scanned: 21, lastScan: "11m", status: "connected", stars: "—", members: 64 },
    { id: "gh-labs", provider: "github", name: "acme-labs", repos: 12, scanned: 9, lastScan: "scanning", status: "scanning", stars: "430", members: 18 },
  ],
  repos: [
    { repo: "acme-corp/payments-service", provider: "github", lang: "Java", loc: "84.2k", grade: "F", findings: 9, critical: 4, lastCommit: "2h", branch: "main", owner: "payments-team", detail: [
      { file: "src/main/java/crypto/KeyFactory.java", line: 42, kind: "RSA-2048 key generation", sev: "critical", code: 'KeyPairGenerator.getInstance("RSA"); kpg.initialize(2048);', fix: "Migrate to hybrid ML-KEM via BouncyCastle PQC provider" },
      { file: "src/main/resources/tls.conf", line: 7, kind: "Static cipher pin (TLS_RSA)", sev: "critical", code: "cipher.suites = TLS_RSA_WITH_AES_128_CBC_SHA", fix: "Enable TLS 1.3 + X25519MLKEM768" },
      { file: "pom.xml", line: 88, kind: "bcprov-jdk15on 1.68 (pre-PQC)", sev: "high", code: "<version>1.68</version>", fix: "Bump to bcprov-jdk18on 1.78+ with PQC" },
      { file: "src/main/java/auth/JwtSigner.java", line: 19, kind: "RS256 JWT signing", sev: "high", code: "Algorithm.RSA256(pub, priv)", fix: "Adopt ML-DSA-65 signing" },
    ]},
    { repo: "acme-corp/identity-gateway", provider: "github", lang: "Go", loc: "41.7k", grade: "D", findings: 6, critical: 2, lastCommit: "6h", branch: "main", owner: "identity-team", detail: [
      { file: "internal/tls/config.go", line: 28, kind: "ECDSA P-256 only", sev: "high", code: "tls.CurveP256", fix: "Add X25519MLKEM768 to CurvePreferences" },
      { file: "go.mod", line: 12, kind: "golang.org/x/crypto pre-PQC", sev: "high", code: "v0.14.0", fix: "Upgrade to PQC-capable release" },
      { file: "cmd/server/main.go", line: 64, kind: "Hardcoded RSA cert path", sev: "critical", code: 'tls.LoadX509KeyPair("rsa.crt","rsa.key")', fix: "Issue ML-DSA cert via internal PQC CA" },
    ]},
    { repo: "acme-corp/mobile-sdk", provider: "gitlab", lang: "Kotlin", loc: "23.0k", grade: "C", findings: 4, critical: 1, lastCommit: "1d", branch: "develop", owner: "mobile-team", detail: [
      { file: "crypto/Pinning.kt", line: 51, kind: "SHA-1 cert pin", sev: "critical", code: 'CertificatePinner.pin("sha1/...")', fix: "Replace with SHA-256 + PQC chain" },
      { file: "build.gradle.kts", line: 33, kind: "conscrypt 2.2 (legacy)", sev: "monitor", code: "conscrypt:2.2.1", fix: "Track PQC-enabled build" },
    ]},
    { repo: "acme-corp/data-pipeline", provider: "github", lang: "Python", loc: "52.4k", grade: "D", findings: 5, critical: 2, lastCommit: "3h", branch: "main", owner: "data-team", detail: [
      { file: "pipeline/encrypt.py", line: 14, kind: "RSA-OAEP record encryption", sev: "critical", code: "rsa.encrypt(payload, pubkey)", fix: "Use ML-KEM encapsulation (liboqs-python)" },
      { file: "requirements.txt", line: 8, kind: "pycryptodome 3.15 (no PQC)", sev: "high", code: "pycryptodome==3.15.0", fix: "Add oqs / pqcrypto dependency" },
    ]},
    { repo: "acme-corp/web-frontend", provider: "github", lang: "TypeScript", loc: "96.1k", grade: "B", findings: 2, critical: 0, lastCommit: "5h", branch: "main", owner: "web-team", detail: [
      { file: "src/lib/jwt.ts", line: 22, kind: "RS256 verification", sev: "monitor", code: "jwtVerify(token, rsaKey)", fix: "Plan ML-DSA verification path" },
    ]},
    { repo: "acme-corp/partner-edi", provider: "gitlab", lang: "C#", loc: "34.8k", grade: "F", findings: 7, critical: 3, lastCommit: "2d", branch: "main", owner: "integrations", detail: [
      { file: "src/Tls/LegacyHandshake.cs", line: 90, kind: "TLS 1.0 fallback enabled", sev: "critical", code: "SslProtocols.Tls | SslProtocols.Tls11", fix: "Remove legacy protocol fallback" },
      { file: "src/Crypto/Signer.cs", line: 45, kind: "RSA-PKCS1 signing", sev: "critical", code: "rsa.SignData(data, SHA256, Pkcs1)", fix: "ML-DSA-65 via OpenSSL 3.5 provider" },
    ]},
    { repo: "acme-corp/infra-terraform", provider: "github", lang: "HCL", loc: "18.3k", grade: "A", findings: 0, critical: 0, lastCommit: "8h", branch: "main", owner: "platform", detail: [] },
    { repo: "acme-corp/ml-platform", provider: "github", lang: "Python", loc: "61.5k", grade: "C", findings: 3, critical: 1, lastCommit: "1d", branch: "main", owner: "ml-team", detail: [
      { file: "serving/tls_server.py", line: 33, kind: "ssl.PROTOCOL_TLS (any version)", sev: "critical", code: "ssl.SSLContext(ssl.PROTOCOL_TLS)", fix: "Pin PROTOCOL_TLS_SERVER + TLS1.3" },
    ]},
  ],
  codeRollup: {
    reposScanned: 71, reposTotal: 71, filesScanned: 412840, findings: 36, critical: 13, high: 12, monitor: 11, fixablePR: 28, avgGrade: "D+",
    byLang: [
      { lang: "Java", findings: 11, color: "var(--high)" },
      { lang: "Go", findings: 6, color: "var(--cyan)" },
      { lang: "Python", findings: 8, color: "var(--brand)" },
      { lang: "C#", findings: 7, color: "var(--crit)" },
      { lang: "TypeScript", findings: 2, color: "var(--safe)" },
      { lang: "Kotlin", findings: 2, color: "var(--warn)" },
    ],
    patterns: [
      { pattern: "RSA key generation / encryption", count: 9, sev: "critical" },
      { pattern: "Static / legacy cipher suite pin", count: 7, sev: "critical" },
      { pattern: "RS256 JWT signing", count: 6, sev: "high" },
      { pattern: "ECDSA P-256 only (no hybrid)", count: 5, sev: "high" },
      { pattern: "Pre-PQC crypto dependency", count: 9, sev: "monitor" },
    ],
  },
  agentSteps: [
    { id: "ingest", label: "Ingest", icon: "globe", tool: "Splunk MCP Server", desc: "Pull org repo tree via GitHub/GitLab API → index to Splunk", detail: "71 repos · 412,840 files" },
    { id: "detect", label: "Detect", icon: "search", tool: "Hosted model + regex corpus", desc: "Scan source for quantum-vulnerable crypto patterns", detail: "36 findings · 13 critical" },
    { id: "correlate", label: "Correlate", icon: "radar", tool: "SPL correlation search", desc: "Join code findings with live TLS telemetry & cert inventory", detail: "code ↔ runtime ↔ PKI" },
    { id: "reason", label: "Reason", icon: "ai", tool: "Splunk AI Assistant", desc: "Rank by exposure × sensitivity, draft remediation", detail: "risk-weighted plan" },
    { id: "act", label: "Act", icon: "zap", tool: "Agent actions", desc: "Open fix PRs, file tickets, update crypto policy", detail: "28 auto-fixable" },
  ],
  orgPlan: {
    org: "acme-corp", generated: "just now",
    summary: "Across 71 repositories the agent found 13 critical quantum-vulnerable crypto usages concentrated in 4 Tier-0 services. 28 of 36 findings are auto-fixable with a dependency bump and config change — no architectural rewrite required.",
    posture: "D+", targetPosture: "A-", weeks: 12,
    streams: [
      { title: "Immediate · code freeze risks", tone: "crit", window: "Week 1", actions: [
        { repo: "payments-service", task: "Replace TLS_RSA cipher pin + RSA keygen with ML-KEM hybrid", pr: "PR #1842 ready", effort: "2d" },
        { repo: "partner-edi", task: "Remove TLS 1.0/1.1 fallback, swap RSA-PKCS1 → ML-DSA", pr: "PR #318 ready", effort: "2d" },
        { repo: "data-pipeline", task: "Swap RSA-OAEP record encryption for ML-KEM encapsulation", pr: "draft", effort: "3d" },
      ]},
      { title: "Dependency uplift", tone: "high", window: "Weeks 2–5", actions: [
        { repo: "9 repos", task: "Bump pre-PQC crypto libs (BouncyCastle, x/crypto, pycryptodome)", pr: "9 PRs batched", effort: "4d" },
        { repo: "identity-gateway", task: "Add X25519MLKEM768 to Go CurvePreferences", pr: "PR #211 ready", effort: "1d" },
      ]},
      { title: "Signing & policy", tone: "safe", window: "Weeks 6–12", actions: [
        { repo: "org-wide", task: "Migrate RS256 JWT signing → ML-DSA-65 across services", pr: "rollout", effort: "2wk" },
        { repo: "CI/CD", task: "Add crypto-agility lint gate — block new RSA/ECDSA in PRs", pr: "policy", effort: "3d" },
      ]},
    ],
  },
  arch: {
    layers: [
      { title: "Sources", tone: "cyan", nodes: [
        { name: "GitHub / GitLab org", sub: "REST + GraphQL · repo tree, blobs", icon: "globe" },
        { name: "Network TAP / Zeek", sub: "ssl.log · x509.log (passive)", icon: "radar" },
        { name: "PKI / CT logs", sub: "cert inventory feed", icon: "cert" },
      ]},
      { title: "Ingest & Index", tone: "brand", nodes: [
        { name: "CAM Collector", sub: "Next API · async fetch → HEC", icon: "download" },
        { name: "Splunk HEC", sub: "index=crypto_source / network_ssl", icon: "inventory" },
      ]},
      { title: "Splunk Intelligence", tone: "brand", nodes: [
        { name: "SPL correlation searches", sub: "code ↔ runtime ↔ PKI joins", icon: "search" },
        { name: "Splunk MCP Server", sub: "tool layer for the agent", icon: "zap" },
        { name: "Splunk hosted model + AI Assistant", sub: "reasoning · NL queries · plan synthesis", icon: "ai" },
      ]},
      { title: "App & Actions", tone: "safe", nodes: [
        { name: "CAM Dashboard (Next.js)", sub: "React · Splunk custom app", icon: "dashboard" },
        { name: "Agent actions", sub: "open PRs · tickets · policy", icon: "roadmap" },
      ]},
    ],
  },
  aiSuggestions: [
    "Which of our APIs are still using RSA?",
    "Show servers not yet on TLS 1.3",
    "What changed in our quantum risk score this month?",
    "Which certificates expire in under 90 days?",
  ],
  planRun: [
    { label: "Connect & ingest", tool: "Splunk MCP · source API", logs: [
      { t: "info", text: '$ agent.run(org="acme-corp")' },
      { t: "ai", text: "authenticating GitHub org acme-corp…" },
      { t: "ok", text: "✓ github: 38 repos · gitlab acme-corp/platform: 21 repos · acme-labs: 12" },
      { t: "info", text: "streaming repo trees → Splunk HEC (index=crypto_source)" },
      { t: "ok", text: "✓ indexed 412,840 files across 71 repositories" },
    ]},
    { label: "Detect crypto", tool: "pattern corpus · 12 rules", logs: [
      { t: "info", text: "loading quantum-vulnerable pattern corpus (12 rules)" },
      { t: "ai", text: "scanning Java · Go · Python · C# · Kotlin · TS …" },
      { t: "crit", text: "! payments-service  RSA key generation  (CAM-RSA-KEYGEN)" },
      { t: "crit", text: "! partner-edi       TLS 1.0/1.1 fallback  (CAM-LEGACY-TLS)" },
      { t: "warn", text: "~ 9 repos          pre-PQC crypto dependency" },
      { t: "ok", text: "✓ 36 findings · 13 critical · 12 high · 11 monitor" },
    ]},
    { label: "Correlate", tool: "SPL correlation search", logs: [
      { t: "info", text: "join code ↔ zeek:ssl ↔ zeek:x509 by service_map" },
      { t: "crit", text: "→ payments-service maps to payments-api.prod (live TLS_RSA, 38 hosts)" },
      { t: "ai", text: "weighting by exposure × asset sensitivity (Tier-0 ×2.0)" },
      { t: "ok", text: "✓ 218 vulnerable assets correlated to running services" },
    ]},
    { label: "Reason", tool: "Splunk-hosted model", logs: [
      { t: "ai", text: "hosted model: ranking findings, grouping into work streams…" },
      { t: "info", text: "estimating effort in engineer-days per action" },
      { t: "ai", text: "framing cost: engineer-weeks vs. quantum capital (millions)" },
      { t: "ok", text: "✓ 3 streams · 7 actions · target posture A- in 12 weeks" },
    ]},
    { label: "Draft & act", tool: "agent actions", logs: [
      { t: "info", text: "synthesizing remediation + codemods" },
      { t: "ai", text: "opening fix PRs for auto-fixable findings…" },
      { t: "ok", text: "✓ 28/36 auto-fixable · PR #1842, #318, #211 drafted" },
      { t: "ok", text: "✓ plan written → index=crypto_source sourcetype=cam:plan" },
    ]},
  ],
  scanRun: [
    { label: "Enumerate repos", tool: "GitHub + GitLab API", logs: [
      { t: "ai", text: "listing repositories across 3 orgs…" },
      { t: "ok", text: "✓ 71 repositories discovered" },
    ]},
    { label: "Fetch blobs", tool: "async · 8 workers", logs: [
      { t: "info", text: "fetching default-branch trees (concurrency=8)" },
      { t: "ai", text: "filtering scannable files (.java .go .py .cs .ts …)" },
      { t: "ok", text: "✓ 412,840 files queued" },
    ]},
    { label: "Pattern scan", tool: "scanner · 12 rules", logs: [
      { t: "ai", text: "matching crypto patterns line-by-line…" },
      { t: "crit", text: "! 13 critical · 12 high · 11 monitor" },
      { t: "ok", text: "✓ 36 findings written to Splunk" },
    ]},
    { label: "Score & grade", tool: "risk model", logs: [
      { t: "info", text: "computing per-repo crypto-agility grade" },
      { t: "ok", text: "✓ org grade D+ · 7 repos need immediate attention" },
    ]},
  ],
} as const;

export type CamData = typeof DATA;
