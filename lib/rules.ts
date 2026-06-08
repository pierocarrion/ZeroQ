// ============================================================
// rules.ts — the quantum-vulnerable crypto rule set.
// Open for extension (append rules) without modifying the
// detector that consumes them (Open/Closed Principle).
// ============================================================
import type { Severity } from "./types";

export interface CryptoRule {
  id: string;
  pattern: RegExp;
  kind: string;
  severity: Severity;
  fix: string;
}

/** Files worth scanning for cryptographic usage. */
export const SCANNABLE =
  /\.(java|go|py|kt|cs|ts|js|rb|c|cc|cpp|rs|php|conf|xml|gradle|mod|toml|cfg|ini|yml|yaml|properties)$|(^|\/)(pom\.xml|requirements\.txt|go\.mod|package\.json|Cargo\.toml|build\.gradle(\.kts)?)$/i;

export const LANGUAGE_BY_EXT: Readonly<Record<string, string>> = {
  java: "Java", go: "Go", py: "Python", kt: "Kotlin", cs: "C#", ts: "TypeScript",
  js: "JavaScript", rb: "Ruby", c: "C", cc: "C++", cpp: "C++", rs: "Rust", php: "PHP",
};

/** Source-code rules: quantum-vulnerable or legacy cryptography. */
export const SOURCE_RULES: readonly CryptoRule[] = [
  { id: "ZQ-RSA-KEYGEN", pattern: /KeyPairGenerator\.getInstance\(\s*["']RSA|rsa\.generate_private_key|RSA\.generate\(|generateKeyPair\(\s*["']RSA|crypto\.generateKeyPairSync\(\s*["']rsa/i, kind: "RSA key generation", severity: "critical", fix: "Migrate to ML-KEM (hybrid X25519MLKEM768) via a PQC provider" },
  { id: "ZQ-RSA-ENCRYPT", pattern: /rsa\.encrypt\(|RSA\/ECB\/OAEP|Cipher\.getInstance\(\s*["']RSA|RSA-OAEP|publicEncrypt\(/i, kind: "RSA encryption", severity: "critical", fix: "Replace with ML-KEM encapsulation (liboqs / BouncyCastle PQC)" },
  { id: "ZQ-STATIC-RSA-CIPHER", pattern: /TLS_RSA_WITH_[A-Z0-9_]+/, kind: "Static RSA cipher suite", severity: "critical", fix: "Enable TLS 1.3 with X25519MLKEM768 key exchange" },
  { id: "ZQ-LEGACY-TLS", pattern: /SslProtocols\.(Tls|Tls11)\b|PROTOCOL_TLSv1(_1)?\b|TLSv1\.[01]|TLS_1_0|SSLv3|minVersion.{0,8}TLS1\.0/i, kind: "Legacy TLS 1.0/1.1", severity: "critical", fix: "Disable legacy protocol fallback; require TLS 1.3" },
  { id: "ZQ-3DES", pattern: /3DES|DES-EDE3|TLS_RSA_WITH_3DES/i, kind: "3DES / weak block cipher", severity: "critical", fix: "Remove 3DES; use AES-GCM under TLS 1.3" },
  { id: "ZQ-RS256-JWT", pattern: /RSA256\(|["']?alg["']?\s*[:=]\s*["']RS256|Algorithm\.RSA|SignatureAlgorithm\.RS256/i, kind: "RS256 JWT signing", severity: "high", fix: "Adopt ML-DSA-65 (Dilithium) signing" },
  { id: "ZQ-ECDSA-P256", pattern: /secp256r1|prime256v1|CurveP256|NIST[\s_]?P-256|ES256\b/i, kind: "ECDSA/ECDH P-256 (no hybrid)", severity: "high", fix: "Add X25519MLKEM768 hybrid to curve preferences" },
  { id: "ZQ-ECDSA-P384", pattern: /secp384r1|CurveP384|NIST[\s_]?P-384/i, kind: "ECDSA/ECDH P-384 (no hybrid)", severity: "high", fix: "Add hybrid ML-KEM alongside the classical curve" },
  { id: "ZQ-SHA1", pattern: /sha1\/[A-Za-z0-9+/=]{10,}|"SHA-1"|MessageDigest\.getInstance\(\s*["']SHA-?1/i, kind: "SHA-1 usage / pin", severity: "high", fix: "Replace with SHA-256 over a PQC certificate chain" },
  { id: "ZQ-MD5", pattern: /MD5|MessageDigest\.getInstance\(\s*["']MD5/i, kind: "MD5 digest", severity: "high", fix: "Replace MD5 with SHA-256 / SHA-3" },
  { id: "ZQ-ANY-TLS", pattern: /PROTOCOL_TLS\b(?!_SERVER|_CLIENT)|SSLContext\(\s*\)/, kind: "Unpinned TLS protocol (any version)", severity: "critical", fix: "Pin PROTOCOL_TLS_SERVER and minimum_version=TLSv1_3" },
  { id: "ZQ-DH-1024", pattern: /DH_1024|dhparam.{0,6}1024|DSA_1024/i, kind: "Finite-field DH/DSA 1024", severity: "critical", fix: "Quantum- and classically-weak; migrate to ML-KEM" },
];

/** Dependency-manifest rules: pre-PQC library versions. */
export const DEPENDENCY_RULES: readonly CryptoRule[] = [
  { id: "ZQ-DEP-BC", pattern: /bcprov-jdk15on|bcprov.*1\.6[0-9]/i, kind: "BouncyCastle pre-PQC", severity: "monitor", fix: "Upgrade to bcprov-jdk18on 1.78+ with PQC algorithms" },
  { id: "ZQ-DEP-PYCRYPTO", pattern: /pycryptodome==3\.1[0-5]|pycrypto==/i, kind: "pycryptodome pre-PQC", severity: "monitor", fix: "Add oqs / pqcrypto dependency for ML-KEM/ML-DSA" },
  { id: "ZQ-DEP-XCRYPTO", pattern: /golang\.org\/x\/crypto\s+v0\.1[0-4]/i, kind: "x/crypto pre-PQC", severity: "monitor", fix: "Upgrade to a PQC-capable x/crypto release" },
  { id: "ZQ-DEP-CONSCRYPT", pattern: /conscrypt[:\-]2\.[0-2]/i, kind: "conscrypt legacy", severity: "monitor", fix: "Track a PQC-enabled conscrypt build" },
  { id: "ZQ-DEP-OPENSSL", pattern: /openssl["'\s:=]+1\.[01]\.|openssl["'\s:=]+1\.1\.0/i, kind: "OpenSSL pre-3.x (no PQC provider)", severity: "monitor", fix: "Upgrade to OpenSSL 3.5+ with the PQC provider" },
  { id: "ZQ-DEP-NODE-RSA", pattern: /"node-rsa"|"jsrsasign"/i, kind: "JS RSA library", severity: "monitor", fix: "Plan migration to a PQC-capable signing lib" },
];

export const ALL_RULES: readonly CryptoRule[] = [...SOURCE_RULES, ...DEPENDENCY_RULES];
