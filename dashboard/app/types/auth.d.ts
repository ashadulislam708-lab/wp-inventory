export interface LoginResponse {
  message?: string;
  error?: string;
  data?: {
    email: string;
    password: string;
  };
}