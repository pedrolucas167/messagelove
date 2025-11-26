import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => {
      const typed = error as { path?: string; param?: string; msg: string };
      return {
        field: typed.path ?? typed.param ?? "unknown",
        message: error.msg,
      };
    });

    return res.status(400).json({
      success: false,
      errors: formattedErrors,
    });
  }
  return next();
}
