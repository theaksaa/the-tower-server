import fs from "node:fs";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp(
  env.HTTPS_ENABLED
    ? {
        https: {
          key: fs.readFileSync(env.HTTPS_KEY_PATH!),
          cert: fs.readFileSync(env.HTTPS_CERT_PATH!)
        }
      }
    : undefined
);

const protocol = env.HTTPS_ENABLED ? "https" : "http";

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`Server listening at ${protocol}://0.0.0.0:${env.PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
