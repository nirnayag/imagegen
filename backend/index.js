const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const axios = require('axios');
const FormData = require('form-data');

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

// Add new endpoint for image-to-text
app.post('/imagetotext', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Image file missing');

    // Use form-data npm package for Node.js
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const apiResponse = await axios.post('https://api.api-ninjas.com/v1/imagetotext', formData, {
      headers: {
        'X-Api-Key': 'TGVuJJRM/1swgdrLLILD7w==tdaWCuAdsgCnkm1P',
        ...formData.getHeaders()
      }
    });

    res.json(apiResponse.data);
  } catch (error) {
    console.error(error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).send(error.message);
    }
  }
});

app.post('/generate-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.body.prompt) return res.status(400).json({ error: 'Image file and prompt are required' });

    // Convert image to base64
    const imgBase64 = req.file.buffer.toString('base64');
    const prompt = req.body.prompt;

    // 1. Submit image-to-image generation request
    const submitResp = await axios.post('https://stablehorde.net/api/v2/generate/async', {
      prompt: prompt,
      source_image: imgBase64,
      models: ["stable_diffusion"],
      steps: 30,
      width: 512,
      height: 512
    }, {
      headers: {
        'apikey': 'i4gxWoW8jq6SAOoOFHIXTw',
        'Client-Agent': 'MyAppName:1.0:contact@example.com',
        'Content-Type': 'application/json'
      }
    });

    const { id } = submitResp.data;
    if (!id) return res.status(500).json({ error: 'No id returned from Stable Horde' });

    // 2. Poll for status (max 20 tries, 3s interval)
    let status = null;
    for (let i = 0; i < 20; i++) {
      const checkResp = await axios.get(`https://stablehorde.net/api/v2/generate/check/${id}`, {
        headers: { 'apikey': 'i4gxWoW8jq6SAOoOFHIXTw' }
      });
      if (checkResp.data.done) {
        status = 'done';
        break;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    if (status !== 'done') return res.status(202).json({ status: 'processing', id });

    // 3. Get the result
    const resultResp = await axios.get(`https://stablehorde.net/api/v2/generate/status/${id}`, {
      headers: { 'apikey': 'i4gxWoW8jq6SAOoOFHIXTw' }
    });
    const generations = resultResp.data.generations;
    if (generations && generations.length > 0) {
      res.json({ image: generations[0].img, id });
    } else {
      res.status(500).json({ error: 'No image generated' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
}); 