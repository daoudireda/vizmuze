/**
 * VizMuze Backend Server
 * Handles music recognition, audio processing, and file management
 */

import { spawn } from "child_process";
import cors from "cors";
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
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
import Stripe from "stripe";
import crypto from 'crypto';

// Initialize FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Configuration and Constants
 */
const app = express();
const PORT = process.env.PORT || 3000;
const AUDD_API_KEY = process.env.AUDD_API_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pipeline = promisify(stream.pipeline);
const ytDlpPath = path.resolve(__dirname, "yt-dlp.exe");

/**
 * Multer Configuration for File Uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(os.tmpdir(), 'vizmuze-uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/^(audio|video)\//)) {
    return cb(new Error('Only audio and video files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: fileFilter
});

/**
 * Music Recognition Cache
 */
const musicCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Audio Processing Utilities
 */
const preprocessAudio = async (inputPath) => {
  const outputPath = path.join(os.tmpdir(), `processed_${Date.now()}.mp3`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .duration(10)
      .setStartTime('00:00:05')
      .audioFrequency(22050)
      .audioChannels(1)
      .audioCodec('libmp3lame')
      .audioBitrate('64k')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
};

const downloadFromUrl = async (url, platform) => {
  const tempFile = path.join(os.tmpdir(), `download_${Date.now()}.mp3`);
  const options = [
    "-f", getAudioFormatByPlatform(platform),
    "--extract-audio",
    "--audio-format", "mp3",
    "--audio-quality", "9",
    "--postprocessor-args", "-ar 22050 -ac 1",
    "-o", tempFile,
    "--no-playlist",
    "--no-check-certificates",
    "--no-cookies",
    "--extractor-args", "youtube:player_client=android",
    "--max-filesize", "10M"
  ];

  await executeYtDlp(url, options);
  return tempFile;
};

const generateCacheKey = async (buffer) => {
  const hash = crypto.createHash('md5');
  hash.update(buffer.slice(0, 1024 * 1024));
  return hash.digest('hex');
};

const recognizeMusic = async (audioBuffer) => {
  const form = new FormData();
  form.append("file", audioBuffer, { filename: "audio.mp3", contentType: "audio/mpeg" });
  form.append("return", "apple_music,spotify");

  return axios.post("https://api.audd.io/", form, {
    headers: { ...form.getHeaders() },
    params: { api_token: AUDD_API_KEY },
    timeout: 10000,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024
  });
};

const executeYtDlp = (url, options = []) => {
  return new Promise((resolve, reject) => {
    const timeout = 30000;
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

    process.stdout.on("data", (data) => output += data.toString());
    process.stderr.on("data", (data) => error += data.toString());

    process.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    process.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve(output.trim()) : reject(new Error(`yt-dlp failed with code ${code}: ${error}`));
    });
  });
};

const getAudioFormatByPlatform = (platform) => {
  switch (platform?.toLowerCase()) {
    case "tiktok":
    case "instagram":
      return "bestaudio/best";
    case "youtube":
      return "bestaudio[ext=m4a]";
    default:
      return "bestaudio/best";
  }
};

/**
 * Express Middleware Configuration
 */
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-File-Name', 'X-Music-Info'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.raw({ 
  type: 'application/octet-stream', 
  limit: '100mb',
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

/**
 * API Routes
 */

// Music Recognition Endpoint
app.post("/api/recognize-music", upload.single("file"), express.json(), async (req, res) => {
  let tempFile = null;
  let processedFile = null;

  try {
    if (req.headers["x-music-info"]) {
      return res.json(JSON.parse(req.headers["x-music-info"]));
    }

    if (req.file) {
      tempFile = req.file.path;
    } else if (req.body.url) {
      tempFile = await downloadFromUrl(req.body.url, req.body.platform);
    } else {
      return res.status(400).json({ error: "No audio file or URL provided" });
    }

    const fileBuffer = await fs.promises.readFile(tempFile);
    const cacheKey = await generateCacheKey(fileBuffer);
    
    const cachedResult = musicCache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    processedFile = await preprocessAudio(tempFile);
    const processedBuffer = await fs.promises.readFile(processedFile);
    const response = await recognizeMusic(processedBuffer);

    if (response.data?.result) {
      const { title, artist, album, release_date } = response.data.result;
      const coverUrl =
        response.data.result.spotify?.album?.images[0]?.url ||
        response.data.result.apple_music?.artwork?.url?.replace("{w}x{h}", "300x300") ||
        "/placeholder.svg?height=300&width=300";

      const result = {
        title, artist, album,
        releaseDate: release_date,
        coverUrl,
        spotify: response.data.result.spotify?.external_urls?.spotify,
        appleMusic: response.data.result.apple_music?.url,
      };

      musicCache.set(cacheKey, result);
      setTimeout(() => musicCache.delete(cacheKey), CACHE_DURATION);

      res.json(result);
    } else {
      res.json({ error: "No music found" });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to recognize music",
      details: error.message,
    });
  } finally {
    const filesToClean = [tempFile, processedFile].filter(Boolean);
    await Promise.all(
      filesToClean.map(file =>
        fs.promises.unlink(file).catch(() => {})
      )
    );
  }
});

// Audio Extraction Endpoint
app.post("/api/extract-audio", express.raw({ type: "application/octet-stream", limit: "100mb" }), async (req, res) => {
  let tempInputFile = null;
  let tempOutputFile = null;

  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const fileName = req.headers["x-file-name"] || "unknown_file";
    tempInputFile = path.join(os.tmpdir(), `input_${Date.now()}_${fileName}`);
    tempOutputFile = path.join(os.tmpdir(), `output_${Date.now()}.mp3`);

    await fs.promises.writeFile(tempInputFile, req.body);

    await new Promise((resolve, reject) => {
      ffmpeg(tempInputFile)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioChannels(2)
        .audioFrequency(44100)
        .format("mp3")
        .on("end", resolve)
        .on("error", reject)
        .save(tempOutputFile);
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${path.parse(fileName).name}.mp3"`);
    await pipeline(fs.createReadStream(tempOutputFile), res);
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to extract audio", 
      details: error.message 
    });
  } finally {
    const filesToClean = [tempInputFile, tempOutputFile].filter(Boolean);
    await Promise.all(
      filesToClean.map(file =>
        fs.promises.unlink(file).catch(() => {})
      )
    );
  }
});

// Audio URL Endpoint
app.get("/api/audio-url", async (req, res) => {
  try {
    const { url, originalUrl, platform } = req.query;
    const mediaUrl = originalUrl || url;

    if (!mediaUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const formatString = getAudioFormatByPlatform(platform);
    const options = [
      "-f", formatString,
      "-g",
      "--no-playlist",
      "--no-check-certificates",
      "--no-cookies",
      "--extractor-args", "youtube:player_client=android",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ];

    const audioUrl = await executeYtDlp(mediaUrl, options);
    res.json({ audioUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to get audio URL" });
  }
});

// Audio Download Endpoint
app.get("/api/download-audio", async (req, res) => {
  let tempFile = null;
  
  try {
    const { url, platform } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    tempFile = await downloadFromUrl(url, platform);
    
    const stat = await fs.promises.stat(tempFile);
    const fileName = `audio_${Date.now()}.mp3`;
    
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    
    await pipeline(fs.createReadStream(tempFile), res);
  } catch (error) {
    res.status(500).json({
      error: "Failed to download audio",
      details: error.message
    });
  } finally {
    if (tempFile) {
      fs.promises.unlink(tempFile).catch(() => {});
    }
  }
});

// Health Check Endpoint
app.get("/api/health", async (req, res) => {
  try {
    const version = await executeYtDlp("", ["--version"]);
    res.json({ status: "healthy", ytdlp: version });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// Production static file serving
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running at http://localhost:${PORT}`);
  }
});
