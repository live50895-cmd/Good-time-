import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: Boolean(getGeminiClient()) });
  });

  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { prompt, languageName, imageBase64, mimeType, mode } = req.body as {
        prompt?: string;
        languageName?: string;
        imageBase64?: string;
        mimeType?: string;
        mode?: 'doctor' | 'parchi' | 'ocr';
      };

      if (!prompt && !imageBase64) {
        res.status(400).json({ error: 'Prompt or image is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets. Using offline clinical rules.',
          offlineFallback: true,
        });
        return;
      }

      const systemInstruction =
        mode === 'parchi' || mode === 'ocr'
          ? `You are Noor Haram 2026 Clinical Parchi & Lab Assistant. Reply clearly in ${languageName || 'Roman Urdu'}. Decode prescriptions (OD, BD, TDS, QID, HS, AC, PC), medicine names, uses, and lab report markers (normal vs high/low). If an image is an X-ray or ultrasound film, remind the user that a licensed radiologist must interpret actual imaging. Always include clear safety precautions and remind the user to verify exact doses with a licensed doctor.`
          : `You are Noor Haram 2026 Clinical AI Assistant. Reply clearly and concisely in ${languageName || 'Roman Urdu'}. Provide practical educational guidance, common medicine considerations, red-flag emergency symptoms (e.g., chest pain, severe shortness of breath, very low platelets, <70 blood sugar), and remind the user to confirm exact doses with a licensed doctor.`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        });
      }
      parts.push({
        text: prompt || 'Analyze this medical image, prescription, or report clearly.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction,
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'Empty response received from Gemini AI.' });
        return;
      }

      res.json({ reply: text });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process AI request.';
      console.error('Gemini API error:', message);
      res.status(500).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Noor Haram 2026 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
