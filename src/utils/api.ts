import axios, { AxiosError } from 'axios';
import FormData from 'form-data';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const AUDD_API_KEY = import.meta.env.VITE_AUDD_API_KEY;

export async function transcribeAudio(audioData: Uint8Array): Promise<string> {
  const blob = new Blob([audioData], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');
  formData.append('model', 'whisper-1');

  try {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    return response.data.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

interface MusicRecognitionResult {
  title: string;
  artist: string;
  album: string;
  releaseDate: string;
  spotify: string;
  confidence: number;
}

export async function recognizeMusic(audioData: Uint8Array): Promise<MusicRecognitionResult | null> {
  const blob = new Blob([audioData], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');
  formData.append('api_token', AUDD_API_KEY);
  formData.append('return', 'spotify');

  try {
    const response = await axios.post('https://api.audd.io/', formData, {
      headers: formData.getHeaders()
    });

    if (response.data.status === 'success' && response.data.result) {
      return {
        title: response.data.result.title,
        artist: response.data.result.artist,
        album: response.data.result.album,
        releaseDate: response.data.result.release_date,
        spotify: response.data.result.spotify,
        confidence: response.data.result.score
      };
    }
    return null;
  } catch (error) {
    console.error('Music recognition error:', error);
    throw new Error('Failed to recognize music');
  }
}

export async function recognizeSongShazam(audioData: Uint8Array) {
  const options = {
    method: 'POST',
    url: 'https://shazam.p.rapidapi.com/songs/v2/detect',
    headers: {
      'content-type': 'text/plain',
      'X-RapidAPI-Key': '6282855754msh9d0323ae1053541p1e49d2jsndd6ad6bcf569',
      'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
    },
    data: audioData,
  };

  try {
    const response = await axios.request(options);
    return response.data.track;
  } catch (error) {
    console.error('Error recognizing song:', error);
  }

}


export class MediaProcessingError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "MediaProcessingError";
  }
}

const SUPPORTED_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

interface DownloadResult {
  data: Uint8Array;
  contentType: string;
  fileName: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export async function downloadFromUrl(url: string): Promise<DownloadResult> {
  try {
    const urlObj = new URL(url);
    const fileName = urlObj.pathname.split("/").pop() || "media";

    const headResponse = await axios.head(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 5000,
    });

    const contentType = headResponse.headers["content-type"];
    const contentLength = parseInt(
      headResponse.headers["content-length"] || "0",
      10
    );

    if (
      !contentType ||
      !SUPPORTED_CONTENT_TYPES.some((type) => contentType.startsWith(type))
    ) {
      throw new MediaProcessingError(
        "Unsupported file type. Please provide a valid audio or video file URL.",
        "UNSUPPORTED_TYPE",
        { contentType }
      );
    }

    if (contentLength > MAX_FILE_SIZE) {
      throw new MediaProcessingError(
        "File size exceeds 50MB limit.",
        "FILE_TOO_LARGE",
        { size: contentLength }
      );
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        console.log(`Download Progress: ${percentCompleted}%`);
      },
    });

    return {
      data: new Uint8Array(response.data),
      contentType: contentType,
      fileName: fileName,
    };
  } catch (error) {
    if (error instanceof MediaProcessingError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNABORTED") {
        throw new MediaProcessingError(
          "Connection timeout. Please try again.",
          "TIMEOUT"
        );
      }

      if (!axiosError.response) {
        throw new MediaProcessingError(
          "Network error. Please check your internet connection.",
          "NETWORK_ERROR"
        );
      }

      switch (axiosError.response.status) {
        case 404:
          throw new MediaProcessingError(
            "Media file not found. Please check the URL.",
            "NOT_FOUND"
          );
        case 403:
          throw new MediaProcessingError(
            "Access denied. This media file is not publicly accessible.",
            "FORBIDDEN"
          );
        case 429:
          throw new MediaProcessingError(
            "Too many requests. Please wait a moment and try again.",
            "RATE_LIMIT"
          );
        default:
          throw new MediaProcessingError(
            `Server error: ${axiosError.response.status}`,
            "SERVER_ERROR",
            { status: axiosError.response.status }
          );
      }
    }

    throw new MediaProcessingError(
      "An unexpected error occurred while processing the URL.",
      "UNKNOWN_ERROR",
      error
    );
  }
}