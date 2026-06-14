#!/usr/bin/env node
/**
 * dev-with-emitter.js
 *
 * Levanta `next dev` y, en paralelo, el emisor de anomalías HNDL
 * en un puerto alto libre (por defecto a partir del 4567).
 *
 * Uso:
 *   npm run dev
 */
const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const START_PORT = Number(process.env.EMITTER_START_PORT) || 4567;
const MAX_TRIES = 20;

function findPort(port) {
  return new Promise((resolve, reject) => {
    let current = port;
    let tries = 0;

    function tryListen() {
      if (tries >= MAX_TRIES) return reject(new Error(`No free port found after ${MAX_TRIES} tries`));
      tries++;
      const server = net.createServer();
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          current++;
          tryListen();
        } else {
          reject(err);
        }
      });
      server.once("listening", () => {
        const p = server.address().port;
        server.close(() => resolve(p));
      });
      server.listen(current, "127.0.0.1");
    }

    tryListen();
  });
}

async function main() {
  const emitterPort = await findPort(START_PORT);
  console.log(`[dev-with-emitter] HNDL emitter will run on http://localhost:${emitterPort}`);

  const nextDev = spawn(process.execPath, [path.resolve(__dirname, "../node_modules/next/dist/bin/next"), "dev"], {
    stdio: "inherit",
    env: { ...process.env },
  });

  const emitter = spawn(process.execPath, [path.resolve(__dirname, "hndl-emitter.js")], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(emitterPort) },
  });

  function shutdown() {
    nextDev.kill("SIGTERM");
    emitter.kill("SIGTERM");
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  nextDev.on("exit", (code) => {
    emitter.kill("SIGTERM");
    process.exitCode = code ?? 0;
  });

  emitter.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev-with-emitter] HNDL emitter exited with code ${code}`);
    }
  });
}

main().catch((err) => {
  console.error("[dev-with-emitter] Failed to start:", err.message);
  process.exit(1);
});
