import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().optional().default("24h"),
  AWS_REGION: z.string().optional().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
  AWS_S3_BUCKET: z.string().optional().default(""),
  FRONTEND_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.string().optional().default("development"),
});

type ServerEnv = z.infer<typeof serverSchema>;

declare global {
  // eslint-disable-next-line no-var
  var _backendEnv: ServerEnv | undefined;
}

export const env = (() => {
  if (!global._backendEnv) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment variables");
    }
    global._backendEnv = parsed.data;
  }
  return global._backendEnv;
})();
