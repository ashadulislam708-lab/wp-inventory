import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ApiResponse } from '~/types/httpService';
import { createErrorResponse, handleAxiosError } from '~/utils/errorHandler';

class HttpService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const errorResponse = createErrorResponse(error);
        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * Extracts the data property from ResponsePayloadDto wrapper
   */
  private extractData<T>(responsePayload: ApiResponse<T>): T {
    return responsePayload.data as T;
  }

  // Enhanced error handling for HTTP methods
  public async get<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.post<ApiResponse<T>>(url, data, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  /**
   * Get full response payload when you need access to success, message, etc.
   */
  public async getFullResponse<T>(url: string, config?: AxiosRequestConfig<any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
}

export const httpService = new HttpService();