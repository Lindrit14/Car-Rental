import { z } from "zod";

const Schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
  MAPS_GOOGLE_API_KEY: z.string().default(""),
  ALLOWED_ORIGINS: z.string().default(""),
});

export interface Config {
  port: number;
  logLevel: string;
  googleApiKey: string;
  allowedOrigins: string[];
}

export function parseEnv(env: NodeJS.ProcessEnv): Config {
  const parsed = Schema.parse(env);
  const origins = parsed.ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    port: parsed.PORT,
    logLevel: parsed.LOG_LEVEL,
    googleApiKey: parsed.MAPS_GOOGLE_API_KEY.trim(),
    allowedOrigins: origins,
  };
}
