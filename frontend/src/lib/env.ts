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

function getEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("`env` should only be used on the server");
  }
  
  // Skip validation during build time
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://placeholder",
      JWT_SECRET: process.env.JWT_SECRET || "placeholder-secret-32-characters!",
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
      AWS_REGION: process.env.AWS_REGION || "us-east-1",
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "placeholder",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "placeholder",
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "placeholder",
      FRONTEND_URL: process.env.FRONTEND_URL,
    } as ServerEnv;
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
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: keyof ServerEnv) {
    return getEnv()[prop];
  },
});

export const clientEnv = clientSchema.parse({});
