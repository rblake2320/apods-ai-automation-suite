import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, ApiResponse } from '@/types';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth-token');

    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle responses and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle network errors
    if (!error.response) {
      console.error('[API Network Error]', error.message);
      return Promise.reject({
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      } as ApiError);
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');

      // Redirect to login page
      window.location.href = '/login';

      return Promise.reject({
        error: 'Unauthorized',
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      } as ApiError);
    }

    // Handle forbidden errors
    if (error.response.status === 403) {
      return Promise.reject({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action.',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      } as ApiError);
    }

    // Handle not found errors
    if (error.response.status === 404) {
      return Promise.reject({
        error: 'Not Found',
        message: error.response.data?.message || 'The requested resource was not found.',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      } as ApiError);
    }

    // Handle server errors
    if (error.response.status >= 500) {
      return Promise.reject({
        error: 'Server Error',
        message: 'An internal server error occurred. Please try again later.',
        statusCode: error.response.status,
        timestamp: new Date().toISOString(),
      } as ApiError);
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    }

    // Return error response data or create default error
    return Promise.reject(
      error.response.data || {
        error: 'API Error',
        message: error.message || 'An error occurred while processing your request.',
        statusCode: error.response.status,
        timestamp: new Date().toISOString(),
      }
    );
  }
);

/**
 * Generic GET request
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data;
}

/**
 * Generic POST request
 */
export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

/**
 * Generic PUT request
 */
export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  return response.data;
}

/**
 * Generic PATCH request
 */
export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

/**
 * Generic DELETE request
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data;
}

/**
 * Upload file with progress tracking
 */
export async function uploadFile<T>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response.data;
}

/**
 * Download file
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await apiClient.get(url, {
    responseType: 'blob',
  });

  // Create blob link to download
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  // Clean up
  window.URL.revokeObjectURL(link.href);
}

export default apiClient;
