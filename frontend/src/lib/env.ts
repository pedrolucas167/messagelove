import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().optional().default("24h"),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  FRONTEND_URL: z.string().url().optional(),
});

const clientSchema = z.object({});

type ServerEnv = z.infer<typeof serverSchema>;

declare global {
  // eslint-disable-next-line no-var
  var _env: ServerEnv | undefined;
}

export const env = (() => {
  if (typeof window !== "undefined") {
    throw new Error("`env` should only be used on the server");
  }
  if (!global._env) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment variables");
    }
    global._env = parsed.data;
  }
  return global._env;
})();

export const clientEnv = clientSchema.parse({});
