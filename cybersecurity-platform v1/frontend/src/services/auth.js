import axios from 'axios';
import { API_ENDPOINTS } from '../config';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const authService = {
  async login(username, password) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password
      });
      const { accessToken, refreshToken, user } = response.data;
      this.setTokens(accessToken, refreshToken);
      return { user, accessToken, refreshToken }; 
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async register(username, password, email, role) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, {
        username,
        password,
        email,
        role
      });
      const { accessToken, refreshToken, user } = response.data;
      this.setTokens(accessToken, refreshToken);
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await axios.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      this.setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      this.clearTokens();
      throw this.handleError(error);
    }
  },

  async verifyToken() {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error('No token available');
      }
      const response = await axios.get(API_ENDPOINTS.AUTH.VERIFY, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await this.refreshToken();
          return this.verifyToken();
        } catch (refreshError) {
          this.clearTokens();
          throw this.handleError(refreshError);
        }
      }
      throw this.handleError(error);
    }
  },

  logout() {
    this.clearTokens();
  },

  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },

  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const backendMsg = error.response.data?.message || error.response.data?.error || 'An error occurred';
      // Map backend error messages to user-friendly messages
      if (backendMsg.toLowerCase().includes('invalid username or password')) {
        return new Error('User not found or wrong password.');
      }
      if (backendMsg.toLowerCase().includes('user not found')) {
        return new Error('User not found.');
      }
      if (backendMsg.toLowerCase().includes('password')) {
        return new Error('Wrong password.');
      }
      return new Error(backendMsg);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error('Request failed. Please try again.');
    }
  }
};

// Add axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await authService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        authService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Add axios interceptor for adding token to requests
axios.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default authService; 