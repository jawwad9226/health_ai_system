import axios from 'axios';
import { handleApiError, retryRequest, validateResponse } from '../utils/errorHandler';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(handleApiError(error))
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await this.client.post('/auth/refresh', {
              refresh_token: refreshToken,
            });

            const { token } = response.data;
            localStorage.setItem('token', token);

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh token expired or invalid
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(handleApiError(refreshError));
          }
        }

        return Promise.reject(handleApiError(error));
      }
    );
  }

  async request(config) {
    try {
      const response = await retryRequest(() => this.client(config));
      validateResponse(response);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // GET request with retry and caching
  async get(url, config = {}) {
    return this.request({
      method: 'get',
      url,
      ...config,
    });
  }

  // POST request
  async post(url, data = {}, config = {}) {
    return this.request({
      method: 'post',
      url,
      data,
      ...config,
    });
  }

  // PUT request
  async put(url, data = {}, config = {}) {
    return this.request({
      method: 'put',
      url,
      data,
      ...config,
    });
  }

  // DELETE request
  async delete(url, config = {}) {
    return this.request({
      method: 'delete',
      url,
      ...config,
    });
  }

  // PATCH request
  async patch(url, data = {}, config = {}) {
    return this.request({
      method: 'patch',
      url,
      data,
      ...config,
    });
  }

  // File upload with progress tracking
  async uploadFile(url, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request({
      method: 'post',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
    });
  }

  // Batch requests
  async batch(requests) {
    return Promise.all(
      requests.map((request) => this.request(request))
    );
  }

  // Cancel request
  getCancelToken() {
    return axios.CancelToken.source();
  }
}

export default new ApiClient();
