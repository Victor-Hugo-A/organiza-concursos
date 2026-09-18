import { z } from "zod";

const optionalText = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().min(1).optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: optionalText,
  EMAIL_FROM: optionalText,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas", parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Configuração inválida do ambiente.");
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      APP_URL: "http://localhost:3000",
      APP_SECRET: process.env.APP_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      NODE_ENV: "development" as const
    };
