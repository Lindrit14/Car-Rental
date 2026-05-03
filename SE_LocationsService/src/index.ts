import { makeApp } from "./app.js";
import { parseEnv } from "./config.js";
import { logger } from "./logger.js";
import { store } from "./store.js";

async function main(): Promise<void> {
  const config = parseEnv(process.env);

  await store.init({ apiKey: config.googleApiKey });

  const app = makeApp({ allowedOrigins: config.allowedOrigins });
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "locations service listening");
  });

  function shutdown(signal: string): void {
    logger.info({ signal }, "shutting down");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "bootstrap failed");
  process.exit(1);
});
