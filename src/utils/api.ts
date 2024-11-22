import axios from "axios";
import FormData from "form-data";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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







