import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";
import locationsRouter from "./routes/locations.js";
import healthRouter from "./routes/health.js";

export interface AppDeps {
  allowedOrigins: string[];
}

export function makeApp({ allowedOrigins }: AppDeps): express.Express {
  const app = express();
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: false,
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: "16kb" }));

  app.use("/api/locations", locationsRouter);
  app.use("/healthz", healthRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "not_found" });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    logger.error({ err }, "unhandled error");
    res.status(500).json({ error: "internal" });
  };
  app.use(errorHandler);

  return app;
}
