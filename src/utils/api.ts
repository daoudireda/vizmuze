import axios from "axios";
import FormData from "form-data";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const AUDD_API_KEY = import.meta.env.VITE_AUDD_API_KEY;

export async function transcribeAudio(audioData: Uint8Array): Promise<string> {
  const blob = new Blob([audioData], { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, "audio.wav");
  formData.append("model", "whisper-1");

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
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

export async function recognizeMusic(
  audioData: Uint8Array
): Promise<MusicRecognitionResult | null> {
  const blob = new Blob([audioData], { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, "audio.wav");
  formData.append("api_token", AUDD_API_KEY);
  formData.append("return", "spotify");

  try {
    const response = await axios.post("https://api.audd.io/", formData, {
      headers: formData.getHeaders(),
    });

    if (response.data.status === "success" && response.data.result) {
      return {
        title: response.data.result.title,
        artist: response.data.result.artist,
        album: response.data.result.album,
        releaseDate: response.data.result.release_date,
        spotify: response.data.result.spotify,
        confidence: response.data.result.score,
      };
    }
    return null;
  } catch (error) {
    console.error("Music recognition error:", error);
    throw new Error("Failed to recognize music");
  }
}

export async function recognizeSongShazam(audioData: Uint8Array) {
  const options = {
    method: "POST",
    url: "https://shazam.p.rapidapi.com/songs/v2/detect",
    headers: {
      "content-type": "text/plain",
      "X-RapidAPI-Key": "6282855754msh9d0323ae1053541p1e49d2jsndd6ad6bcf569",
      "X-RapidAPI-Host": "shazam.p.rapidapi.com",
    },
    data: audioData,
  };

  try {
    const response = await axios.request(options);
    return response.data.track;
  } catch (error) {
    console.error("Error recognizing song:", error);
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

const SUPPORTED_PLATFORMS = {
  YOUTUBE: {
    domains: ["youtube.com", "youtu.be"],
    embedUrl: (id: string) => `https://www.youtube.com/embed/${id}`,
    getVideoId: (url: string) => {
      if (url.includes("/shorts/")) {
        return url.split("/shorts/")[1]?.split("?")[0];
      }
      return url.split("v=")[1]?.split("&")[0];
    },
  },
  INSTAGRAM: {
    domains: ["instagram.com"],
    embedUrl: (url: string) => `${url}/embed`,
    getVideoId: (url: string) => url,
  },
  TIKTOK: {
    domains: ["tiktok.com"],
    embedUrl: (id: string) => `https://www.tiktok.com/embed/${id}`,
    getVideoId: (url: string) => url.split("video/")[1]?.split("?")[0],
  },
};

interface MediaResult {
  embedUrl: string;
  platform: string;
}

export async function processMediaUrl(url: string): Promise<MediaResult> {
  try {
    const urlObj = new URL(url);

    // Check if URL is from supported platform
    const platform = Object.entries(SUPPORTED_PLATFORMS).find(([_, config]) =>
      config.domains.some((domain) => urlObj.hostname.includes(domain))
    );

    if (!platform) {
      throw new MediaProcessingError(
        "Unsupported platform. Please provide a valid YouTube, Instagram, or TikTok URL.",
        "UNSUPPORTED_PLATFORM",
        { url }
      );
    }

    const [platformName, config] = platform;
    const videoId = config.getVideoId(url);

    if (!videoId) {
      throw new MediaProcessingError(
        "Invalid video URL. Could not extract video ID.",
        "INVALID_URL",
        { url }
      );
    }

    const embedUrl = config.embedUrl(videoId);

    return {
      embedUrl,
      platform: platformName,
    };
  } catch (error) {
    if (error instanceof MediaProcessingError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new MediaProcessingError(
        "Invalid URL format. Please provide a valid URL.",
        "INVALID_URL",
        { url }
      );
    }

    throw new MediaProcessingError(
      "An unexpected error occurred while processing the URL.",
      "UNKNOWN_ERROR",
      error
    );
  }
}

