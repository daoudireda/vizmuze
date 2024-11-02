import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";




let ffmpegInstance: FFmpeg | null = null;

export const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();
  await loadFFmpeg(ffmpegInstance);
  return ffmpegInstance;
};

const loadFFmpeg = async (ffmpeg: FFmpeg): Promise<void> => {
  try {
    // Use ESM distribution
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });

    console.log("FFmpeg loaded successfully");
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    ffmpegInstance = null;
    throw new Error(
      `Failed to load FFmpeg: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const convertToAudio = async (file: File): Promise<Uint8Array> => {
  try {
    console.log("Starting audio conversion...");
    const ffmpeg = await getFFmpeg();

    // Determine input file extension based on file type
    const inputFileName = `input${
      file.type.includes("video") ? ".mp4" : ".mp3"
    }`;
    const outputFileName = "output.wav";

    console.log("Writing input file...");
    // Write the input file to FFmpeg's filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    console.log("Executing FFmpeg command...");
    // Run the FFmpeg command to convert the video/audio to WAV format
    await ffmpeg.exec([
      "-i",
      inputFileName,
      "-vn", // No video
      "-acodec",
      "pcm_s16le", // Specify audio codec
      "-ar",
      "16000", // Set audio sampling rate to 16kHz
      "-ac",
      "1", // Set to mono audio
      outputFileName,
    ]);

    console.log("Reading output file...");
    // Read and return the output file
    const data = await ffmpeg.readFile(outputFileName);

    console.log("Cleaning up...");
    // Clean up temporary files
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    // Handle different return types from readFile
    if (data instanceof Uint8Array) {
      return data;
    } else if (typeof data === "string") {
      return new TextEncoder().encode(data);
    } else {
      return new Uint8Array(data as ArrayBufferLike);
    }
  } catch (error) {
    console.error("Error converting file to audio:", error);
    throw new Error(
      `Failed to convert file to audio: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const uint8ArrayToUrl = (data: Uint8Array, mimeType: string): string => {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
};


