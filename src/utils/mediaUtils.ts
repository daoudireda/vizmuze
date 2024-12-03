import { Media } from "../components/MediaUploader";
import { MusicInfoProps } from "../components/MusicInfo";
import { API_ENDPOINTS } from "../config/api";
import apiClient from "../config/api";

interface ProcessingCallbacks {
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  setError: (message: string) => void;
  setAudioUrl: (url: string) => void;
  setMusicInfo: (info: MusicInfoProps) => void;
}

export const updateProgress = (
  setProgress: React.Dispatch<React.SetStateAction<number>>
) => {
  return setInterval(() => {
    setProgress((prev: number) => {
      if (prev >= 100) return 100;
      return prev + 10;
    });
  }, 500);
};

export const handleError = (
  error: unknown,
  setError: (msg: string) => void
) => {
  const message = error instanceof Error ? error.message : "An error occurred";
  setError(message);
  console.error("Error:", error);
};

export const processLocalFile = async (
  file: File,
  callbacks: ProcessingCallbacks
) => {
  const { setProgress, setError, setAudioUrl, setMusicInfo } = callbacks;
  const progressInterval = updateProgress(setProgress);

  try {
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 100MB.');
    }

    // Create FormData for audio extraction
    const extractFormData = new FormData();
    extractFormData.append('file', file);

    const extractResponse = await apiClient.post(
      API_ENDPOINTS.EXTRACT_AUDIO,
      extractFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setProgress(Math.min(50, percentCompleted)); // First 50% for upload
        },
      }
    );

    if (!extractResponse.data) {
      throw new Error('Failed to extract audio');
    }

    const audioBlob = new Blob([extractResponse.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);
    setProgress(75); // 75% after audio extraction

    // Create FormData for music recognition
    const recognizeFormData = new FormData();
    recognizeFormData.append('file', audioBlob, 'audio.mp3');

    const recognizeResponse = await apiClient.post(
      API_ENDPOINTS.RECOGNIZE_MUSIC,
      recognizeFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || audioBlob.size)
          );
          // Last 25% for recognition
          setProgress(75 + Math.min(25, Math.floor(percentCompleted / 4)));
        },
      }
    );

    clearInterval(progressInterval);
    setProgress(100);

    if (recognizeResponse.data) {
      setMusicInfo(recognizeResponse.data);
    }
  } catch (error) {
    clearInterval(progressInterval);
    handleError(error, setError);
  }
};

export const processMediaUrl = async (
  media: Media,
  callbacks: ProcessingCallbacks
) => {
  const { setProgress, setError, setAudioUrl, setMusicInfo } = callbacks;
  const progressInterval = updateProgress(setProgress);

  try {
    // First get the audio URL for playback
    const audioUrlResponse = await apiClient.get(API_ENDPOINTS.AUDIO_URL, {
      params: {
        url: media.originalUrl.toString(),
        platform: media.platform,
      },
    });

    if (audioUrlResponse.data.error) {
      throw new Error(audioUrlResponse.data.error);
    }

    setAudioUrl(audioUrlResponse.data.audioUrl);
    setProgress(50);

    // Then recognize the music
    const response = await apiClient.post(API_ENDPOINTS.RECOGNIZE_MUSIC, {
      url: media.originalUrl.toString(),
      platform: media.platform,
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    setMusicInfo(response.data);
    clearInterval(progressInterval);
    setProgress(100);
  } catch (error) {
    clearInterval(progressInterval);
    handleError(error, setError);
  }
};

export const handleDownloadAudio = async (
  media: Media,
  file: File | null,
  setError: (message: string) => void
) => {
  try {
    if (file) {
      // For local files, use the existing file download method
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audio.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For online media, use the download endpoint
      const response = await apiClient.get(API_ENDPOINTS.DOWNLOAD_AUDIO, {
        params: {
          url: media.originalUrl.toString(),
          platform: media.platform,
        },
        responseType: "blob",
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "audio.mp3";
      if (contentDisposition) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    handleError(error, setError);
  }
};
