import { z } from "zod";

export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "EnvValidationError";
  }
}

const serverSchema = z.object({
  DATABASE_URL: z.string().trim().url(),
  JWT_SECRET: z.string().trim().min(32),
  JWT_EXPIRES_IN: z.string().trim().optional().default("24h"),
  // AWS S3 - suporta ambos os formatos de variável (Render usa AWS_BUCKET_*)
  AWS_BUCKET_REGION: z.string().trim().optional(),
  AWS_REGION: z.string().trim().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),
  AWS_BUCKET_NAME: z.string().trim().optional(),
  AWS_S3_BUCKET: z.string().trim().optional(),
  FRONTEND_URL: z.string().trim().url().optional(),
  GOOGLE_CLIENT_ID: z.string().trim().optional(),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

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
      AWS_BUCKET_REGION: process.env.AWS_BUCKET_REGION,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      FRONTEND_URL: process.env.FRONTEND_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    } as ServerEnv;
  }
  
  if (!global._env) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
      throw new EnvValidationError(
        "Invalid environment variables",
        parsed.error.flatten().fieldErrors
      );
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

export const clientEnv: ClientEnv = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
};
