// ============================================================
// lib/services/TlsScanner.ts — scan TLS configuration of owned
// hosts. Only use against infrastructure you have permission to
// test.
// ============================================================
import tls from "tls";
import { getDb } from "@/lib/db";

export interface TlsScanResult {
  host: string;
  port: number;
  version: string;
  cipher: string;
  curve?: string;
  subject?: string;
  issuer?: string;
  alg?: string;
  bits?: number;
  expiryDays?: number;
  error?: string;
}

function tlsVersion(version?: string): string {
  switch (version) {
    case "TLSv1": return "TLS 1.0";
    case "TLSv1.1": return "TLS 1.1";
    case "TLSv1.2": return "TLS 1.2";
    case "TLSv1.3": return "TLS 1.3";
    default: return version || "Unknown";
  }
}

function classify(version: string, cipher: string, curve?: string): "critical" | "high" | "monitor" | "safe" {
  if (version === "TLS 1.0" || version === "TLS 1.1") return "critical";
  if (cipher.includes("RSA") && !cipher.includes("ECDHE")) return "critical";
  if (curve?.includes("MLKEM") || curve?.includes("X25519MLKEM")) return "safe";
  if (cipher.includes("ECDHE") && (curve === "secp256r1" || curve === "secp384r1")) return "high";
  if (version === "TLS 1.3") return "safe";
  return "monitor";
}

function certUrgency(days?: number): "renew" | "plan" | "monitor" | "done" {
  if (days === undefined) return "plan";
  if (days < 30) return "renew";
  if (days < 90) return "plan";
  if (days < 365) return "monitor";
  return "done";
}

export async function scanHost(host: string, port = 443): Promise<TlsScanResult> {
  return new Promise((resolve) => {
    const socket = tls.connect(port, host, { rejectUnauthorized: false, servername: host }, () => {
      const cipher = socket.getCipher();
      const cert = socket.getPeerCertificate(true);
      socket.end();

      const version = tlsVersion(cipher.version);
      const cipherName = cipher.name || "Unknown";
      const curve = (cipher as any).standardName || (cipher as any).name || undefined;

      const subject = cert.subject?.CN || cert.subjectaltname || host;
      const issuer = cert.issuer?.CN || "Unknown";
      const alg = (cert as any).signatureAlgorithm || "Unknown";
      const bits = cert.bits;
      const expiryDays = cert.valid_to ? Math.max(0, Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : undefined;

      resolve({
        host,
        port,
        version,
        cipher: cipherName,
        curve,
        subject,
        issuer,
        alg,
        bits,
        expiryDays,
      });
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      resolve({ host, port, version: "", cipher: "", error: "Timeout" });
    });

    socket.on("error", (err) => {
      resolve({ host, port, version: "", cipher: "", error: err.message });
    });
  });
}

export function saveTlsScan(result: TlsScanResult) {
  const db = getDb();
  const risk = classify(result.version, result.cipher, result.curve);
  db.prepare(`
    INSERT INTO tls_scans (host, port, dst, version, cipher, curve, risk, seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(result.host, result.port, `${result.host}:${result.port}`, result.version, result.cipher, result.curve || "", risk, new Date().toISOString());

  if (result.subject) {
    db.prepare(`
      INSERT INTO cert_scans (host, subject, alg, bits, expiry, issuer, urgency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      result.host,
      result.subject,
      result.alg || "",
      result.bits || null,
      result.expiryDays ?? null,
      result.issuer || "",
      certUrgency(result.expiryDays)
    );
  }
}

export function listDomains(): Array<{ id: number; host: string; port: number; sensitivity?: string; txns_day?: string }> {
  return getDb().prepare("SELECT id, host, port, sensitivity, txns_day FROM domains ORDER BY host").all() as any[];
}

export function addDomain(host: string, port = 443, sensitivity?: string, txnsDay?: string) {
  getDb().prepare("INSERT OR IGNORE INTO domains (host, port, sensitivity, txns_day) VALUES (?, ?, ?, ?)").run(host, port, sensitivity || null, txnsDay || null);
}

export function removeDomain(id: number) {
  const d = getDb();
  const hostRow = d.prepare("SELECT host FROM domains WHERE id = ?").get(id) as any;
  if (hostRow) {
    d.prepare("DELETE FROM tls_scans WHERE host = ?").run(hostRow.host);
    d.prepare("DELETE FROM cert_scans WHERE host = ?").run(hostRow.host);
  }
  d.prepare("DELETE FROM domains WHERE id = ?").run(id);
}
