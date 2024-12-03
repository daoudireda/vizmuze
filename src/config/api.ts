// API configuration
import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  EXTRACT_AUDIO: `${API_BASE_URL}/api/extract-audio`,
  RECOGNIZE_MUSIC: `${API_BASE_URL}/api/recognize-music`,
  DOWNLOAD_AUDIO: `${API_BASE_URL}/api/download-audio`,
  STRIPE_PAYMENT: `${API_BASE_URL}/api/create-payment-intent`,
  PROCESS_VIDEO: `${API_BASE_URL}/api/process-video`,
  AUDIO_URL: `${API_BASE_URL}/api/audio-url`,
  VIDEO_INFO: `${API_BASE_URL}/api/video-info`,
} as const;

export const getApiConfig = (): AxiosRequestConfig => {
  const config: AxiosRequestConfig = {
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    validateStatus: (status) => {
      return status >= 200 && status < 500;
    }
  };

  return config;
};

export const createApiClient = () => {
  const config = getApiConfig();
  const client = axios.create(config);

  // Add request interceptor for CORS preflight
  client.interceptors.request.use((config) => {
    if (config.method === 'options') {
      config.headers['Access-Control-Request-Method'] = 'POST';
      config.headers['Access-Control-Request-Headers'] = 'content-type';
    }
    return config;
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 413) {
        throw new Error('File size too large. Maximum size is 100MB.');
      }
      throw error;
    }
  );

  return client;
};

export default createApiClient();
