import { httpService } from "~/services/httpService";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "~/types/auth";

export const authService = {
  login: (data: LoginRequest) =>
    httpService.post<LoginResponse>("/auth/login", data),

  logout: (refreshToken: string) =>
    httpService.post("/auth/logout", { refreshToken }),

  getMe: () => httpService.get<AuthUser>("/auth/me"),
};
