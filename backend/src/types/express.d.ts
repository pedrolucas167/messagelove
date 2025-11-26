import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email?: string | null;
        name?: string | null;
        role?: string | null;
      };
    }
  }
}

export {};
