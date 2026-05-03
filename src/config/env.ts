import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    HTTPS_ENABLED: z.coerce.boolean().default(false),
    HTTPS_KEY_PATH: z.string().trim().min(1).optional(),
    HTTPS_CERT_PATH: z.string().trim().min(1).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.HTTPS_ENABLED) {
      return;
    }

    if (!value.HTTPS_KEY_PATH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "HTTPS_KEY_PATH is required when HTTPS_ENABLED=true",
        path: ["HTTPS_KEY_PATH"]
      });
    }

    if (!value.HTTPS_CERT_PATH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "HTTPS_CERT_PATH is required when HTTPS_ENABLED=true",
        path: ["HTTPS_CERT_PATH"]
      });
    }
  });

export const env = envSchema.parse(process.env);
