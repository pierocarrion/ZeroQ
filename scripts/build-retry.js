#!/usr/bin/env node
/**
 * Windows + Next.js 14 sometimes hits a filesystem race while writing server
 * chunks during `next build`. This wrapper cleans `.next` and retries the
 * build a few times before giving up.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MAX_ATTEMPTS = 5;
const nextBin = require.resolve("next/dist/bin/next");
const nextDir = path.resolve(__dirname, "../.next");

function cleanNextDir() {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
}

function build(attempt) {
  console.log(`\n>>> Build attempt ${attempt}/${MAX_ATTEMPTS}...`);
  const result = spawnSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_DISABLE_SWC: "1",
    },
  });
  return result.status === 0;
}

let ok = false;
for (let i = 1; i <= MAX_ATTEMPTS; i++) {
  cleanNextDir();
  if (build(i)) {
    ok = true;
    console.log(`\n✓ Build succeeded on attempt ${i}.`);
    break;
  }
  console.log(`\n✗ Build attempt ${i} failed.`);
}

if (!ok) {
  console.error(`\n✗ Build failed after ${MAX_ATTEMPTS} attempts.`);
  process.exit(1);
}
