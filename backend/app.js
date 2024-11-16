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



const app = express();
const PORT = process.env.PORT || 3000;
const AUDD_API_KEY = process.env.AUDD_API_KEY;

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

const pipeline = promisify(stream.pipeline);

app.post('/api/extract-audio', express.raw({ type: 'application/octet-stream', limit: '50mb' }), async (req, res) => {
  let tempInputFile = null
  let tempOutputFile = null

  try {
    if (!req.body || req.body.length === 0) {
      console.error('No file data received')
      return res.status(400).json({ error: 'No video file provided' })
    }

    const fileName = req.headers['x-file-name'] || 'unknown_file'
    //console.log('File received:', fileName, 'Size:', req.body.length)

    // Create temporary input file
    tempInputFile = path.join(os.tmpdir(), `input_${Date.now()}_${fileName}`)
    await fs.promises.writeFile(tempInputFile, req.body)

    // Create temporary output file
    tempOutputFile = path.join(os.tmpdir(), `output_${Date.now()}.mp3`)

    //console.log('Temporary files created:', tempInputFile, tempOutputFile)

    // Set up FFmpeg command
    await new Promise((resolve, reject) => {
      ffmpeg(tempInputFile)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .audioFrequency(44100)
        .format('mp3')
        .on('start', (commandLine) => {
          console.log('FFmpeg process started:', commandLine)
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message)
          reject(err)
        })
        .on('end', () => {
          console.log('FFmpeg process completed')
          resolve()
        })
        .save(tempOutputFile)
    })

    // Set response headers
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', `attachment; filename="${path.parse(fileName).name}.mp3"`)


    // Send the file
    await pipeline(fs.createReadStream(tempOutputFile), res)

  } catch (error) {
    console.error('Error extracting audio:', error)
    res.status(500).json({ error: 'Failed to extract audio', details: error.message })
  } finally {
    // Clean up temporary files
    if (tempInputFile) {
      fs.unlink(tempInputFile, (err) => {
        if (err) console.error('Error deleting input file:', err)
        else console.log('Input file deleted successfully')
      })
    }
    if (tempOutputFile) {
      fs.unlink(tempOutputFile, (err) => {
        if (err) console.error('Error deleting output file:', err)
        else console.log('Output file deleted successfully')
      })
    }
  }
})


// Music recognition route using AudD API
app.post('/api/recognize-music', express.raw({ type: 'audio/mpeg', limit: '10mb' }), async (req, res) => {
  let tempFile = null;
  try {
    const audioData = req.body;
    console.log("audioData:", audioData);

    // Create a temporary file to store the audio data
    tempFile = path.join(os.tmpdir(), `temp_audio_${Date.now()}.mp3`);
    await fs.promises.writeFile(tempFile, audioData);

    const form = new FormData();
    form.append('file', fs.createReadStream(tempFile), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });
    form.append('return', 'apple_music,spotify');

    const response = await axios.post('https://api.audd.io/', form, {
      headers: {
        ...form.getHeaders(),
      },
      params: {
        api_token: AUDD_API_KEY,
      },
    });

    if (response.data && response.data.result) {
      const { title, artist, album, release_date } = response.data.result;
      const coverUrl = response.data.result.spotify?.album?.images[0]?.url || 
                       response.data.result.apple_music?.artwork?.url.replace('{w}x{h}', '300x300') ||
                       '/placeholder.svg?height=300&width=300';

      res.json({
        title,
        artist,
        album,
        releaseDate: release_date,
        coverUrl,
        spotify: response.data.result.spotify?.external_urls?.spotify,
        appleMusic : response.data.result.apple_music?.url
      });
      //console.log("Music recognized:", response.data.result);
    } else {
      res.status(404).json({ error: 'No music detected' });
    }
  } catch (error) {
    console.error('Error recognizing music:', error);
    res.status(500).json({ error: 'Failed to recognize music', details: error.message });
  } finally {
    // Clean up the temporary file
    if (tempFile) {
      fs.unlink(tempFile, (err) => {
        if (err) console.error('Error deleting temporary audio file:', err);
      });
    }
  }
});



// app.post('/api/recognize-music', express.raw({ type: 'audio/mpeg', limit: '10mb' }), async (req, res) => {
//   try {
//     const audioData = req.body
//     console.log("audioData:", audioData);

//     // Shazam API request
//     const response = await axios.post('https://shazam.p.rapidapi.com/songs/detect', audioData, {
//       headers: {
//         'content-type': 'audio/mpeg',
//         'X-RapidAPI-Key': '6282855754msh9d0323ae1053541p1e49d2jsndd6ad6bcf569',
//         'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
//       }
//     })

//     if (response.data && response.data.track) {
//       const { title, subtitle, images } = response.data.track
//       res.json({
//         title,
//         artist: subtitle,
//         coverUrl: images.coverart
//       })
//     } else {
//       res.status(404).json({ error: 'No music detected' })
//     }
//   } catch (error) {
//     console.error('Error recognizing music:', error)
//     res.status(500).json({ error: 'Failed to recognize music', details: error.message })
//   }
// })
