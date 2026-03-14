import { z } from 'zod';
import { loginSchema } from '~/utils/validations/auth';
import { registerSchema } from '~/utils/validations/auth'; // Import the registerSchema fro
import type { LoginResponse } from '~/types/auth';

export async function loginAction(prevState: any, formData: FormData): Promise<LoginResponse> {
  'use server';
  try {
    const data = loginSchema.parse(Object.fromEntries(formData));
    return { message: 'Login successful', data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      return { error: JSON.stringify(errors) };
    }
    return { error: JSON.stringify({ form: 'Invalid credentials' }) };
  }
}

export async function registerAction(prevState: any, formData: FormData): Promise<LoginResponse> {
  'use server';
  try {
    const data = registerSchema.parse(Object.fromEntries(formData));
    return { message: 'Registration successful', data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      return { error: JSON.stringify(errors) };
    }
    return { error: JSON.stringify({ form: 'Registration failed' }) };
  }
}