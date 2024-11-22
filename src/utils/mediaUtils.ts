import axios from "axios";
import { Media } from "../components/MediaUploader";

interface ProcessingCallbacks {
  setProgress: (value: number) => void;
  setError: (message: string) => void;
  setAudioUrl: (url: string) => void;
  setMusicInfo: (info: any) => void;
}

export const updateProgress = (setProgress: (value: number) => void) => {
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

  try {
    const interval = updateProgress(setProgress);

    // Convert file to audio
    const arrayBuffer = await file.arrayBuffer();
    const audioResponse = await axios.post(
      "http://localhost:3000/api/extract-audio",
      arrayBuffer,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          "X-File-Name": file.name,
        },
        responseType: "blob",
      }
    );

    if (audioResponse.status !== 200) {
      const error = await audioResponse.data;
      throw new Error(error.error || "Failed to download audio");
    }

    // Process audio response
    const audioBlob = new Blob([audioResponse.data], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);

    // Recognize music
    await recognizeMusic(audioBlob, setMusicInfo, setError);

    clearInterval(interval);
    return audioUrl;
  } catch (err) {
    handleError(err, setError);
    throw err;
  }
};

export const processMediaUrl = async (
  media: Media,
  callbacks: ProcessingCallbacks
) => {
  const { setProgress, setError, setAudioUrl, setMusicInfo } = callbacks;

  try {
    const interval = updateProgress(setProgress);

    // Get audio URL
    const audioUrlResponse = await fetch(
      `http://localhost:3000/api/audio-url?url=${encodeURIComponent(
        media.originalUrl.toString()
      )}&platform=${media.platform}`
    );

    if (!audioUrlResponse.ok) {
      const error = await audioUrlResponse.json();
      throw new Error(error.error || "Failed to download audio");
    }

    const audioUrlData = await audioUrlResponse.json();
    setAudioUrl(audioUrlData.url);

    // Download audio through proxy
    const audioResponse = await axios.get(
      `http://localhost:3000/api/proxy-audio?url=${encodeURIComponent(
        audioUrlData.url
      )}&platform=${media.platform}`,
      {
        responseType: "arraybuffer",
      }
    );

    const audioBlob = new Blob([audioResponse.data], { type: "audio/mpeg" });
    await recognizeMusic(audioBlob, setMusicInfo, setError);

    clearInterval(interval);
    return audioUrlData.url;
  } catch (err) {
    handleError(err, setError);
    throw err;
  }
};

const recognizeMusic = async (
  audioBlob: Blob,
  setMusicInfo: (info: any) => void,
  setError: (message: string) => void
) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.mp3");

  const recognizeResponse = await axios.post(
    "http://localhost:3000/api/recognize-music",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (recognizeResponse.data) {
    setMusicInfo(recognizeResponse.data);
  } else {
    setError("Failed to recognize music");
  }
};

export const handleDownloadAudio = async (
  media: Media,
  file: File,
  setError: (message: string) => void
) => {
  try {
    let downloadUrl: string;
    let filename: string;

    if (media?.originalUrl) {
      const response = await fetch(
        `http://localhost:3000/api/download-audio?url=${encodeURIComponent(
          media.originalUrl.toString()
        )}`
      );

      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      downloadUrl = URL.createObjectURL(blob);
      filename = `${media.mediaId || "audio"}.mp3`;
    } else {
      if (!file) {
        setError("No file selected");
        return;
      }
      downloadUrl = URL.createObjectURL(file);
      filename = file.name.replace(/\.[^/.]+$/, ".mp3");
    }

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    setError("Failed to download audio. Please try again.");
  }
};
