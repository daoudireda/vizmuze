import { spawn } from "child_process";
import cors from "cors";
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import stream from "stream";
import { fileURLToPath } from "url";
import { promisify } from "util";
import axios from "axios";
import FormData from "form-data";
import multer from "multer";
import ytdl from "ytdl-core";

const app = express();
const PORT = process.env.PORT || 3000;
const AUDD_API_KEY = process.env.AUDD_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get('/api/download-audio', async (req, res) => {
  try {
    const { url, platform } = req.query;
    if (!url) {
      return res.status(400).send('URL is required');
    }

    // Create temporary output file
    const tempOutputFile = path.join(os.tmpdir(), `output_${Date.now()}.mp3`);

    // Get video info for the title
    const infoOptions = ["--dump-json", "--no-playlist"];
    const info = JSON.parse(await executeYtDlp(url, infoOptions));
    const safeTitle = info.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Download audio using yt-dlp
    const options = [
      '-f', getAudioFormatByPlatform(platform),
      '-o', tempOutputFile,
      '--no-playlist',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--no-check-certificates',
      '--no-cookies',
      '--extractor-args', 'youtube:player_client=android',
    ];

    try {
      await executeYtDlp(url, options);

      // Read the file into memory
      const audioBuffer = await fs.promises.readFile(tempOutputFile);

      // Create form data for AudD API
      const form = new FormData();
      form.append("file", audioBuffer, {
        filename: "audio.mp3",
        contentType: "audio/mpeg",
      });
      form.append("return", "apple_music,spotify");

      // Send request to AudD API
      const recognizeResponse = await axios.post("https://api.audd.io/", form, {
        headers: {
          ...form.getHeaders(),
        },
        params: {
          api_token: AUDD_API_KEY,
        },
      });

      // Set response headers for download
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
      res.setHeader('X-Music-Info', JSON.stringify(recognizeResponse.data));

      // Stream the file to the client
      const fileStream = fs.createReadStream(tempOutputFile);
      fileStream.pipe(res);

      // Clean up the file after streaming
      fileStream.on('end', () => {
        fs.unlink(tempOutputFile, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      });
    } catch (error) {
      console.error('yt-dlp error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error downloading audio:', error);
    res.status(500).send('Failed to download audio');
  }
});

const ytDlpPath = path.resolve(__dirname, "yt-dlp.exe");

// Function to execute yt-dlp command
const executeYtDlp = (url, options = []) => {
  return new Promise((resolve, reject) => {
    const timeout = 30000; // 30 seconds timeout
    const process = spawn(ytDlpPath, [...options, url], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let error = "";

    const timer = setTimeout(() => {
      process.kill();
      reject(new Error("Process timed out after 30 seconds"));
    }, timeout);

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      error += data.toString();
      console.error("yt-dlp error:", data.toString());
    });

    process.on("error", (err) => {
      clearTimeout(timer);
      console.error("Process error:", err);
      reject(err);
    });

    process.on("close", (code) => {
      clearTimeout(timer);
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

const getAudioFormatByPlatform = (platform) => {
  switch (platform.toLowerCase()) {
    case "tiktok":
      return "bestaudio/best"; // Simplified format for TikTok
    case "instagram":
      return "bestaudio/best";
    case "youtube":
      return "bestaudio[ext=m4a]";
    default:
      return "bestaudio/best";
  }
};

app.get("/api/audio-url", async (req, res) => {
  try {
    const { url, originalUrl, platform } = req.query;
    const mediaUrl = originalUrl || url;
    
    if (!mediaUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const formatString = getAudioFormatByPlatform(platform);

    // Modified options for better compatibility
    const options = [
      "-f",
      formatString,
      "-g", // Print URL only
      "--no-playlist",
      "--no-check-certificates",
      "--no-cookies",
      "--extractor-args",
      "youtube:player_client=android",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "--referer",
      "https://www.tiktok.com/",
      "--add-header",
      "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "--add-header",
      "Accept-Language:en-US,en;q=0.5",
      "--add-header",
      "sec-fetch-dest:document",
      "--add-header",
      "sec-fetch-mode:navigate",
      "--add-header",
      "sec-fetch-site:none",
      "--add-header",
      "sec-fetch-user:?1"
    ];

    try {
      const audioUrl = await executeYtDlp(mediaUrl, options);
      res.json({ audioUrl });
    } catch (error) {
      console.error("Error getting audio URL:", error);
      res.status(500).json({ error: "Failed to get audio URL" });
    }
  } catch (error) {
    console.error("Error in /api/audio-url:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Audio extraction for files
 */
const pipeline = promisify(stream.pipeline);

app.post(
  "/api/extract-audio",
  express.raw({ type: "application/octet-stream", limit: "50mb" }),
  async (req, res) => {
    let tempInputFile = null;
    let tempOutputFile = null;

    try {
      if (!req.body || req.body.length === 0) {
        console.error("No file data received");
        return res.status(400).json({ error: "No video file provided" });
      }

      const fileName = req.headers["x-file-name"] || "unknown_file";
      //console.log('File received:', fileName, 'Size:', req.body.length)

      // Create temporary input file
      tempInputFile = path.join(os.tmpdir(), `input_${Date.now()}_${fileName}`);
      await fs.promises.writeFile(tempInputFile, req.body);

      // Create temporary output file
      tempOutputFile = path.join(os.tmpdir(), `output_${Date.now()}.mp3`);

      //console.log('Temporary files created:', tempInputFile, tempOutputFile)

      // Set up FFmpeg command
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputFile)
          .noVideo()
          .audioCodec("libmp3lame")
          .audioChannels(2)
          .audioFrequency(44100)
          .format("mp3")
          .on("start", (commandLine) => {
            console.log("FFmpeg process started:", commandLine);
          })
          .on("error", (err) => {
            console.error("FFmpeg error:", err.message);
            reject(err);
          })
          .on("end", () => {
            console.log("FFmpeg process completed");
            resolve();
          })
          .save(tempOutputFile);
      });

      // Set response headers
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.parse(fileName).name}.mp3"`
      );

      // Send the file
      await pipeline(fs.createReadStream(tempOutputFile), res);
    } catch (error) {
      console.error("Error extracting audio:", error);
      res
        .status(500)
        .json({ error: "Failed to extract audio", details: error.message });
    } finally {
      // Clean up temporary files
      if (tempInputFile) {
        fs.unlink(tempInputFile, (err) => {
          if (err) console.error("Error deleting input file:", err);
          else console.log("Input file deleted successfully");
        });
      }
      if (tempOutputFile) {
        fs.unlink(tempOutputFile, (err) => {
          if (err) console.error("Error deleting output file:", err);
          else console.log("Output file deleted successfully");
        });
      }
    }
  }
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

app.post("/api/recognize-music", upload.single("file"), express.json(), async (req, res) => {
  try {
    let audioBuffer;
    
    if (req.file) {
      // If a file was uploaded, use its buffer directly
      audioBuffer = req.file.buffer;
    } else if (req.body.url) {
      // If a URL was provided, download it first
      const { url, platform } = req.body;
      
      // Create temporary output file
      const tempOutputFile = path.join(os.tmpdir(), `output_${Date.now()}.mp3`);

      // Download audio using yt-dlp
      const options = [
        '-f', getAudioFormatByPlatform(platform),
        '-o', tempOutputFile,
        '--no-playlist',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--no-check-certificates',
        '--no-cookies',
        '--extractor-args', 'youtube:player_client=android',
      ];

      try {
        await executeYtDlp(url, options);
        audioBuffer = await fs.promises.readFile(tempOutputFile);
        
        // Clean up temp file
        await fs.promises.unlink(tempOutputFile);
      } catch (error) {
        console.error('yt-dlp error:', error);
        throw error;
      }
    } else if (req.headers['x-music-info']) {
      // If music info is available, use it directly
      const musicInfo = JSON.parse(req.headers['x-music-info']);
      res.json(musicInfo);
      return;
    } else {
      return res.status(400).json({ error: "No audio file or URL provided" });
    }

    // Create form data for AudD API
    const form = new FormData();
    form.append("file", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mpeg",
    });
    form.append("return", "apple_music,spotify");

    // Send request to AudD API
    const response = await axios.post("https://api.audd.io/", form, {
      headers: {
        ...form.getHeaders(),
      },
      params: {
        api_token: AUDD_API_KEY,
      },
    });

    if (response.data && response.data.result) {
      const { title, artist, album, release_date } = response.data.result;
      const coverUrl =
        response.data.result.spotify?.album?.images[0]?.url ||
        response.data.result.apple_music?.artwork?.url.replace(
          "{w}x{h}",
          "300x300"
        ) ||
        "/placeholder.svg?height=300&width=300";

      res.json({
        title,
        artist,
        album,
        releaseDate: release_date,
        coverUrl,
        spotify: response.data.result.spotify?.external_urls?.spotify,
        appleMusic: response.data.result.apple_music?.url,
      });
    } else {
      res.json({ error: "No music found" });
    }
  } catch (error) {
    console.error("Error recognizing music:", error);
    res.status(500).json({
      error: "Failed to recognize music",
      details: error.message,
    });
  }
});

app.get("/api/proxy-audio", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid URL parameter" });
    }

    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    // Forward the content type
    res.setHeader("Content-Type", response.headers["content-type"]);

    // Pipe the audio data to the response
    response.data.pipe(res);
  } catch (error) {
    console.error("Error proxying audio:", error);
    res.status(500).json({ error: "Failed to proxy audio" });
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
