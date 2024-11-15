// server-side code (e.g., in a Node.js Express app)
import express from 'express';
import fs from 'fs';
import { exec } from 'child_process';
import { file } from 'tmp';

const app = express();

app.get('/api/extract-audio', async (req, res) => {
  const videoUrl = req.query.url;

  try {
    const videoFile = await downloadVideo(videoUrl);
    const audioData = await convertToAudio(videoFile);
    res.set('Content-Type', 'audio/wav');
    res.send(audioData);
  } catch (error) {
    console.error('Error extracting audio:', error);
    res.status(500).send('Error extracting audio');
  }
});

const downloadVideo = async (url) => {
  return new Promise((resolve, reject) => {
    file({ postfix: '.mp4' }, (err, path, fd, cleanup) => {
      if (err) {
        reject(err);
      }

      exec(`youtube-dl -o ${path} ${url}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(path);
        }
      });
    });
  });
};
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});