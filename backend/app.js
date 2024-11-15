import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current file:", __filename);
console.log("Current directory:", __dirname);

app.use(cors());
app.use(express.json());

const ytDlpPath = path.resolve(__dirname, "yt-dlp.exe");

// Function to execute yt-dlp command
const executeYtDlp = (url, options = []) => {
  return new Promise((resolve, reject) => {

    const process = spawn(ytDlpPath, [...options, url], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let error = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
      console.log("yt-dlp output:", data.toString());
    });

    process.stderr.on("data", (data) => {
      error += data.toString();
      console.error("yt-dlp error:", data.toString());
    });

    process.on("error", (err) => {
      console.error("Process error:", err);
      reject(err);
    });

    process.on("close", (code) => {
      console.log("yt-dlp process closed with code:", code);
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`yt-dlp failed with code ${code}: ${error}`));
      }
    });
  });
};

// Optional: Get video info endpoint
app.get("/api/video-info", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const output = await executeYtDlp(url, ["--dump-json", "--no-playlist"]);

    const info = JSON.parse(output);
    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      originalUrl: info.original_url,

    });
    console.log("Video info:", info);
  } catch (error) {
    console.error("Error fetching video info:", error);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

app.get("/api/audio-url", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    // Get the best audio format URL
    const audioUrl = await executeYtDlp(url, [
      "-f",
      "bestaudio[ext=m4a]", // Get best audio format
      "-g", // Print URL only
      "--no-playlist", // Don't process playlists
    ]);
    res.json({
      url: audioUrl,
    });
  } catch (error) {
    console.error("Error getting audio URL:", error);
    res.status(500).json({
      error: "Failed to get audio URL",
      details: error.message,
    });
  }
});


app.post('/api/convert-to-audio', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const outputFile = path.join(tempDir, 'output.wav');

    // Convert the video to audio using FFmpeg
    await convertToAudio(url, outputFile);

    // Read the audio file and send it back to the client
    const audioData = await fs.promises.readFile(outputFile);
    res.json({ audioData: audioData.toString('base64') });

    // Clean up the temporary files
    await fs.promises.unlink(outputFile);
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: 'Failed to process the video' });
  }
});




// Health check endpoint to verify yt-dlp installation
app.get("/api/check-ytdlp", async (req, res) => {
  try {
    const version = await executeYtDlp("", ["--version"]);
    res.json({
      status: "success",
      version,
      path: ytDlpPath,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      path: ytDlpPath,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`yt-dlp path: ${ytDlpPath}`);
});


const convertToAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-i',
      inputPath,
      '-vn',
      '-acodec',
      'pcm_s16le',
      '-ar',
      '16000',
      '-ac',
      '1',
      outputPath,
    ]);

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Failed to convert the video to audio'));
      }
    });

    ffmpegProcess.on('error', (err) => {
      reject(err);
    });
  });
};
