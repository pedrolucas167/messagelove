import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import { ensureDatabaseConnection } from "@/server/db";
import { getUserModel } from "@/server/db/models/user";
import { getPasswordResetTokenModel } from "@/server/db/models/password-reset-token";

export type AuthPayload = {
  name: string;
  email: string;
  password: string;
};

function getJwtSecret() {
  return env.JWT_SECRET;
}

export function generateAuthToken(userId: string) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: env.JWT_EXPIRES_IN });
}

export async function registerUser(payload: AuthPayload) {
  const email = payload.email.trim().toLowerCase();
  const name = payload.name.trim();
  const password = payload.password;

  if (!email || !name || !password) {
    throw new Error("Nome, email e senha são obrigatórios.");
  }

  await ensureDatabaseConnection();
  const User = getUserModel();

  const existing = await User.unscoped().findOne({ where: { email }, attributes: ["id"] });
  if (existing) {
    throw new Error("Email já está em uso.");
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, password: hashed });
  const token = generateAuthToken(user.id);
  const safeUser = await User.findByPk(user.id);

  return { token, user: safeUser };
}

export async function loginUser(payload: { email: string; password: string }) {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;
  if (!email || !password) {
    throw new Error("Credenciais inválidas.");
  }

  await ensureDatabaseConnection();
  const User = getUserModel();

  const user = await User.unscoped().findOne({
    where: { email },
    attributes: ["id", "email", "name", "password", "createdAt", "updatedAt"],
  });
  if (!user || !user.password) {
    throw new Error("Credenciais inválidas.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Credenciais inválidas.");
  }

  const token = generateAuthToken(user.id);
  const safeUser = await User.findByPk(user.id);

  return { token, user: safeUser };
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
  return payload;
}

export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  await ensureDatabaseConnection();
  const User = getUserModel();
  const PasswordResetToken = getPasswordResetTokenModel();

  const user = await User.findOne({ where: { email }, attributes: ["id", "email"] });
  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await PasswordResetToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
    usedAt: null,
  });

  const baseUrl = env.FRONTEND_URL?.replace(/\/$/, "") ?? "";
  const resetUrl = `${baseUrl}/reset?token=${token}&email=${encodeURIComponent(email)}`;

  return { token, resetUrl, email };
}

export async function resetPassword(payload: { email: string; token: string; newPassword: string }) {
  const email = payload.email.trim().toLowerCase();
  const tokenHash = crypto.createHash("sha256").update(payload.token).digest("hex");
  await ensureDatabaseConnection();
  const User = getUserModel();
  const PasswordResetToken = getPasswordResetTokenModel();

  const user = await User.unscoped().findOne({ where: { email }, attributes: ["id", "password"] });
  if (!user) {
    throw new Error("Token inválido");
  }

  const record = await PasswordResetToken.findOne({
    where: { userId: user.id, tokenHash },
    order: [["createdAt", "DESC"]],
  });

  if (!record) {
    throw new Error("Token inválido");
  }
  if (record.usedAt) {
    throw new Error("Token já utilizado");
  }
  if (record.expiresAt < new Date()) {
    throw new Error("Token expirado");
  }

  const hashed = await bcrypt.hash(payload.newPassword, 12);
  await user.update({ password: hashed });
  await record.update({ usedAt: new Date() });
}
