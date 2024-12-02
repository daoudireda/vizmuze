// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  RECOGNIZE_MUSIC: `${API_BASE_URL}/api/recognize-music`,
  AUDIO_URL: `${API_BASE_URL}/api/audio-url`,
  VIDEO_INFO: `${API_BASE_URL}/api/video-info`,
  DOWNLOAD_AUDIO: `${API_BASE_URL}/api/download-audio`,
  EXTRACT_AUDIO: `${API_BASE_URL}/api/extract-audio`,

} as const;

export const getApiConfig = () => ({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
