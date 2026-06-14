const base = "http://localhost:3000";

async function get(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text.slice(0, 200) }; }
}

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text.slice(0, 200) }; }
}

(async () => {
  const checks = [];

  const health = await get("/api/health/splunk");
  checks.push(["health", health.ok === true]);

  const risk = await get("/api/risk");
  checks.push(["risk", risk.data && risk.data.riskScore > 0]);

  const repos = await get("/api/repos");
  checks.push(["repos", Array.isArray(repos.data) && repos.data.length > 0]);

  const inventory = await get("/api/inventory");
  checks.push(["inventory", Array.isArray(inventory.data)]);

  const certs = await get("/api/certs");
  checks.push(["certs", Array.isArray(certs.data)]);

  const compliance = await get("/api/compliance");
  checks.push(["compliance", Array.isArray(compliance.data)]);

  const roadmap = await get("/api/roadmap");
  checks.push(["roadmap", Array.isArray(roadmap.data)]);

  const assistant = await post("/api/assistant", { messages: [{ role: "user", content: "What is my risk score?" }] });
  checks.push(["assistant", typeof assistant.text === "string" && assistant.text.toLowerCase().includes("risk score")]);

  const plan = await post("/api/plan", { org: "test" });
  checks.push(["plan", plan.plan && Array.isArray(plan.plan.streams)]);

  const scan = await post("/api/scan", { target: "openssl/openssl" });
  checks.push(["scan", scan.result && scan.result.findings >= 0 && scan.local && scan.local.ok]);

  console.log("Smoke test results:");
  checks.forEach(([name, ok]) => console.log(`  ${ok ? "✓" : "✗"} ${name}`));
  const allOk = checks.every(([, ok]) => ok);
  process.exit(allOk ? 0 : 1);
})();
