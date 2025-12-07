/**
 * Auth DTOs - Data Transfer Objects
 */

import { z } from 'zod';

// Regex para senha forte
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(120, 'Nome muito longo')
    .transform((v) => v.trim()),
  email: z
    .string()
    .email('Email inválido')
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(passwordRegex, 'Senha deve conter letras maiúsculas, minúsculas e números'),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((v) => v.trim().toLowerCase()),
});

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((v) => v.trim().toLowerCase()),
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(passwordRegex, 'Senha deve conter letras maiúsculas, minúsculas e números'),
});

export const GoogleLoginSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  name: z.string().min(1).transform((v) => v.trim()),
  googleId: z.string().min(1),
  picture: z.string().url().optional(),
});

// Tipos inferidos
export type RegisterDTO = z.infer<typeof RegisterSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
export type GoogleLoginDTO = z.infer<typeof GoogleLoginSchema>;

// DTOs de resposta
export interface AuthResponseDTO {
  success: true;
  token: string;
  user: UserResponseDTO;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function toUserResponseDTO(user: UserModel): UserResponseDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

interface UserModel {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
