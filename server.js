#!/usr/bin/env node

const { createServer } = require("http");
const { existsSync, readFileSync } = require("fs");
const { parse } = require("url");
const next = require("next");

for (const envFile of [".env.production", ".env"]) {
  if (!existsSync(envFile)) {
    continue;
  }

  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([\s\S]*?)"?\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

if (existsSync("./.next/standalone/server.js")) {
  require("./.next/standalone/server.js");
  return;
}

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        await handle(req, res, parse(req.url, true));
      } catch (error) {
        console.error("Request handler failed", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(port, hostname, () => {
      console.log(`Ready on http://${hostname}:${port}`);
    });

    const shutdown = () => {
      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((error) => {
    console.error("Server startup failed", error);
    process.exit(1);
  });
