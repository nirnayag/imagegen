const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Set up multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

const HF_TOKEN = process.env.HF_TOKEN;
const HF_URL = 'https://api-inference.huggingface.co/models/nitrosocke/Ghibli-Diffusion';

app.post('/ghibli', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Image file missing');
    const imgB64 = req.file.buffer.toString('base64');

    const resp = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: imgB64,
        parameters: {
          prompt: 'ghibli style, whimsical scene',
          strength: 0.7,
          guidance_scale: 7.0,
          negative_prompt: 'blurry'
        }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).send(errText);
    }

    const imgBuffer = Buffer.from(await resp.arrayBuffer());
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imgBuffer.length
    });
    res.end(imgBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
}); 