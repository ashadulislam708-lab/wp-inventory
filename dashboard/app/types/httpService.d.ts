export interface ErrorResponse {
  message: string;
  status: number;
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  data?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: Array<{
    field?: string;
    reason?: string;
    constraints?: Record<string, string>;
    code?: string;
  }>;
  timestamp?: string;
  path?: string;
}