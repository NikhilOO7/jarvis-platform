import { z } from "zod";

const operatorPassword = z
  .string()
  .refine((value) => value.length === 0 || value.length >= 16, "JARVIS_OPERATOR_PASSWORD must be at least 16 characters.")
  .optional();
const sessionSecret = z
  .string()
  .refine((value) => value.length === 0 || value.length >= 32, "JARVIS_SESSION_SECRET must be at least 32 characters.")
  .optional();

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Jarvis"),
  JARVIS_EXTENSION_TOKEN: z.string().optional(),
  JARVIS_TELEGRAM_TOKEN: z.string().optional(),
  JARVIS_WORKER_TOKEN: z.string().optional(),
  JARVIS_CRON_TOKEN: z.string().optional(),
  JARVIS_OPERATOR_PASSWORD: operatorPassword,
  JARVIS_SESSION_SECRET: sessionSecret,
  JARVIS_EXECUTION_MODE: z.enum(["inline", "worker"]).default("inline"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional()
});

export const env = envSchema.parse(process.env);
