import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Jarvis"),
  JARVIS_EXTENSION_TOKEN: z.string().optional(),
  JARVIS_OPERATOR_PASSWORD: z.string().optional(),
  JARVIS_SESSION_SECRET: z.string().optional(),
  JARVIS_EXECUTION_MODE: z.enum(["inline", "worker"]).default("inline"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional()
});

export const env = envSchema.parse(process.env);
