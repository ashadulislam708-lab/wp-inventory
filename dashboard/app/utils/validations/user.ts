import * as z from "zod";
import { UserRoleEnum } from "~/enums";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(UserRoleEnum, {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters"
    ),
  role: z.nativeEnum(UserRoleEnum, {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
