import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

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

  // Standard + Grounded AI Endpoint
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const {
        prompt,
        languageName,
        imageBase64,
        mimeType,
        mode,
        useSearch,
        profileContext,
        history,
      } = req.body as {
        prompt?: string;
        languageName?: string;
        imageBase64?: string;
        mimeType?: string;
        mode?: 'doctor' | 'parchi' | 'ocr' | 'trends';
        useSearch?: boolean;
        profileContext?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
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

      const baseProfileNote = profileContext
        ? `\nPatient Context:\n${profileContext}\nFactor this patient profile, vitals, and active medicines carefully into your safety warnings (e.g., pediatric vs elderly vs adult dosing, hypertension/diabetes interactions).`
        : '';

      const systemInstruction =
        mode === 'parchi' || mode === 'ocr'
          ? `You are Noor Haram 2026 Clinical Parchi & Lab Assistant. Reply clearly in ${languageName || 'Roman Urdu'}. Decode prescriptions (OD, BD, TDS, QID, HS, AC, PC), medicine names, uses, and lab report markers (normal vs high/low). If an image is an X-ray or ultrasound film, remind the user that a licensed radiologist must interpret actual imaging. Always include clear safety precautions and remind the user to verify exact doses with a licensed doctor.${baseProfileNote}`
          : mode === 'trends'
            ? `You are Noor Haram 2026 Preventive Health & Longitudinal Trends Analyst. Reply clearly in ${languageName || 'Roman Urdu'}. Analyze the patient's recorded vitals, medicine adherence, and recent notes to provide actionable dietary, lifestyle, and doctor-visit questions.${baseProfileNote}`
            : `You are Noor Haram 2026 Clinical AI Assistant. Reply clearly and concisely in ${languageName || 'Roman Urdu'}. Provide practical educational guidance, common medicine considerations, red-flag emergency symptoms (chest pain, shortness of breath, very low platelets, <70 blood sugar), and remind the user to confirm exact doses with a licensed doctor.${baseProfileNote}`;

      const currentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (imageBase64) {
        currentParts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        });
      }
      currentParts.push({
        text: prompt || 'Analyze this medical image, prescription, or report clearly.',
      });

      const contents =
        history && history.length > 0 && !imageBase64
          ? [
              ...history.slice(-6).map((h) => ({
                role: h.role,
                parts: [{ text: h.text }],
              })),
              { role: 'user' as const, parts: currentParts },
            ]
          : { parts: currentParts };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'Empty response received from Gemini AI.' });
        return;
      }

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .map((c) => (c.web?.uri ? { title: c.web.title || c.web.uri, uri: c.web.uri } : null))
        .filter((x): x is { title: string; uri: string } => Boolean(x))
        .slice(0, 6);

      res.json({ reply: text, sources });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process AI request.';
      console.error('Gemini API error:', message);
      res.status(500).json({ error: message });
    }
  });

  // Live SSE Streaming AI Doctor Endpoint
  app.post('/api/ai/stream', async (req, res) => {
    try {
      const { prompt, languageName, useSearch, profileContext, history } = req.body as {
        prompt?: string;
        languageName?: string;
        useSearch?: boolean;
        profileContext?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
          offlineFallback: true,
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const systemInstruction = `You are Noor Haram 2026 Clinical AI Assistant. Reply clearly, empathetically, and thoroughly in ${languageName || 'Roman Urdu'}. Include practical relief steps, warning signs (when to rush to emergency), and remind the user to confirm exact medication doses with a licensed physician.${
        profileContext ? `\nPatient Context:\n${profileContext}` : ''
      }`;

      const contents =
        history && history.length > 0
          ? [
              ...history.slice(-6).map((h) => ({
                role: h.role,
                parts: [{ text: h.text }],
              })),
              { role: 'user' as const, parts: [{ text: prompt }] },
            ]
          : prompt;

      const stream = await ai.models.generateContentStream({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const collectedSources = new Map<string, { title: string; uri: string }>();

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
        const gChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (gChunks) {
          for (const gc of gChunks) {
            if (gc.web?.uri) {
              collectedSources.set(gc.web.uri, {
                title: gc.web.title || gc.web.uri,
                uri: gc.web.uri,
              });
            }
          }
        }
      }

      res.write(
        `data: ${JSON.stringify({
          done: true,
          sources: Array.from(collectedSources.values()).slice(0, 6),
        })}\n\n`
      );
      res.end();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Streaming failed.';
      console.error('Gemini stream error:', message);
      const isQuota = /429|RESOURCE_EXHAUSTED|quota/i.test(message);
      if (!res.headersSent) {
        res.status(isQuota ? 429 : 500).json({ error: message, offlineFallback: true });
      } else {
        res.write(`data: ${JSON.stringify({ error: message, offlineFallback: true })}\n\n`);
        res.end();
      }
    }
  });

  // Structured Emergency Triage Endpoint
  app.post('/api/ai/triage', async (req, res) => {
    try {
      const { symptoms, languageName, profileContext } = req.body as {
        symptoms?: string;
        languageName?: string;
        profileContext?: string;
      };

      if (!symptoms?.trim()) {
        res.status(400).json({ error: 'Symptoms description is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured. Using built-in offline triage protocol.',
          offlineFallback: true,
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Perform rapid clinical emergency triage for these symptoms:\n"${symptoms}"\n${
          profileContext ? `\nPatient Profile Context:\n${profileContext}` : ''
        }`,
        config: {
          systemInstruction: `You are an Emergency First-Aid & Triage Specialist responding in ${languageName || 'Roman Urdu'}. Be conservative and prioritize patient safety: if there is ANY chance of heart attack, stroke, severe breathing difficulty, sepsis, anaphylaxis, hypoglycemia, internal bleeding, or dengue shock, classify as EMERGENCY.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urgency: {
                type: Type.STRING,
                description: 'Must be exactly EMERGENCY, URGENT, or ROUTINE',
              },
              headline: {
                type: Type.STRING,
                description: 'Short clear action headline in target language',
              },
              redFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Danger signs to watch for',
              },
              immediateSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Step-by-step safe first aid actions right now',
              },
              avoidMistakes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Dangerous home remedies or mistakes to strictly avoid',
              },
              medicineGuidance: {
                type: Type.STRING,
                description: 'Safe OTC considerations or warning not to delay hospital',
              },
              speakSummary: {
                type: Type.STRING,
                description: 'Concise 2-sentence voice instruction in target language',
              },
            },
            required: [
              'urgency',
              'headline',
              'redFlags',
              'immediateSteps',
              'avoidMistakes',
              'medicineGuidance',
              'speakSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ triage: parsed });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Triage failed.';
      console.error('Triage error:', message);
      const isQuota = /429|RESOURCE_EXHAUSTED|quota/i.test(message);
      res.status(isQuota ? 429 : 500).json({ error: message, offlineFallback: true });
    }
  });

  // Structured Vision Scan: Meal, Halal, Medicine Strip, X-Ray/CT/MRI Film, Ultrasound, or BP/Lab Report Photo
  app.post('/api/ai/vision-scan', async (req, res) => {
    try {
      const { imageBase64, mimeType, scanType, languageName, activeMeds, profileContext } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        scanType?: 'meal' | 'halal' | 'medicine' | 'xray' | 'ultrasound' | 'bp_report';
        languageName?: string;
        activeMeds?: string[];
        profileContext?: string;
      };

      if (!imageBase64) {
        res.status(400).json({ error: 'Image is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured for AI Vision scanning.',
          offlineFallback: true,
        });
        return;
      }

      const modeDesc =
        scanType === 'halal'
          ? 'Analyze the packaged food/supplement ingredient label photo for Halal/Haram/Mashbooh E-numbers (like E120, E471, gelatin, alcohol), allergens, hidden sugars, and sodium.'
          : scanType === 'medicine'
            ? `Identify the medicine brand, generic active salt/ingredient, strength, EXACT disease/purpose (what it is for), normal adult/child dosage & meal timing, and check interactions against active medicines: [${(activeMeds || []).join(', ') || 'None'}].`
            : scanType === 'xray'
              ? 'Analyze this X-Ray, CT, or MRI film/scan image visually: note visible anatomical region (chest/lungs/ribs, spine, joint/bone fracture/alignment, dental, etc.), any clear shadows/opacities/areas of attention, what next diagnostic steps to discuss, and clearly note that final diagnosis must be confirmed by a licensed Radiologist/Doctor.'
              : scanType === 'ultrasound'
                ? 'Read and explain this Ultrasound / Echo / Sonography report or film photo: decode every measurement and medical term (liver grade/fatty liver, gallbladder stones, kidney size/stones, pelvic/obstetric BPD/FL/FHR/placenta/fluid, heart EF%), highlight Normal vs Abnormal values clearly, and recommend safe follow-up.'
                : scanType === 'bp_report'
                  ? 'Read EVERY visible number on this Blood Pressure monitor, glucometer, ECG strip, OR laboratory blood/urine test report photo (check all 100+ standard clinical parameters: BP Sys/Dia/Pulse, SpO2, Hb, WBC, PLT, RBC, MCV, Sugar, HbA1c, Creatinine, Urea, eGFR, ALT, AST, Bilirubin, TSH, Lipid Cholesterol/TG/LDL/HDL, Uric Acid, Electrolytes Na/K/Ca, Vitamin D/B12, CRP, Dengue NS1, etc.). Mark each detected marker Normal vs High/Low/Urgent and give safe patient guidance.'
                  : 'Analyze this meal/plate photo: identify dishes, estimate total calories, carbs, protein, fat, glycemic impact for Diabetes/BP/Uric acid, and suggest healthier portion adjustments.';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              text: `${modeDesc}\nRespond strictly in ${languageName || 'Roman Urdu'} so the patient clearly understands everything.\n${
                profileContext ? `Patient Profile:\n${profileContext}` : ''
              }`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Detected report, X-ray, meal, or medicine name in target language' },
              verdict: {
                type: Type.STRING,
                description: 'NORMAL, SAFE, CAUTION, ABNORMAL, URGENT, AVOID, HALAL, MASHBOOH, or HARAM',
              },
              metrics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Detected readings, numbers, doses, or E-numbers',
              },
              findings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Detailed point-by-point explanation strictly in target language',
              },
              recommendation: {
                type: Type.STRING,
                description: 'Actionable safe care, dosage/lifestyle advice, and doctor confirmation reminder in target language',
              },
              speakSummary: {
                type: Type.STRING,
                description: 'Clear 2-3 sentence spoken summary strictly in target language',
              },
            },
            required: ['title', 'verdict', 'metrics', 'findings', 'recommendation', 'speakSummary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ scan: parsed });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Vision scan failed.';
      console.error('Vision scan error:', message);
      res.status(500).json({ error: message });
    }
  });

  // High-Definition Multilingual TTS Endpoint (Gemini 3.8 Flash Lite TTS -> WAV Audio)
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, languageName, gender } = req.body as {
        text?: string;
        languageName?: string;
        gender?: 'female' | 'male' | 'auto';
      };

      const cleanText = String(text || '').trim().slice(0, 900);
      if (!cleanText) {
        res.status(400).json({ error: 'Text is required for speech generation.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured for HD TTS.',
          offlineFallback: true,
        });
        return;
      }

      const voiceName = gender === 'male' ? 'Fenrir' : gender === 'female' ? 'Kore' : 'Zephyr';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: `Clear, warm, reassuring medical assistant speaking ${languageName || 'Roman Urdu and English'} at a natural, easy-to-understand pace`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(502).json({ error: 'No audio bytes generated by TTS model.' });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'TTS generation failed.';
      const status = /429|RESOURCE_EXHAUSTED/i.test(message) ? 429 : 500;
      console.error('TTS error:', message);
      res.status(status).json({ error: message, offlineFallback: true });
    }
  });

  // Super Google Translation System Endpoint (Medicines Batch & Phrase Super-Translator across 55 Languages)
  app.post('/api/ai/translate', async (req, res) => {
    try {
      const { targetLangCode, targetLangName, items, text, rawOnly } = req.body as {
        targetLangCode?: string;
        targetLangName?: string;
        items?: Array<{ name: string; dose: string; use: string; warn: string }>;
        text?: string;
        rawOnly?: boolean;
      };

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured for Super Translation.',
          offlineFallback: true,
        });
        return;
      }

      const langLabel =
        targetLangCode === 'ur'
          ? 'simple everyday Roman Urdu (written in clear Latin alphabet like Bukhar, Dard, Khane ke baad) keeping international brand names recognizable'
          : targetLangCode === 'ur_script'
            ? 'clear Pakistani Urdu Nastaliq script (اردو) keeping medicine brand names clear in Urdu + English brackets'
            : `${targetLangName || targetLangCode || 'English'} in its authentic native script`;

      if (items && Array.isArray(items) && items.length > 0) {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Translate every medicine object accurately into ${langLabel}. Keep brand names clear (e.g. "Panadol (پیناڈول)"), translate dosage timings (OD/BD/after meal), uses, and warnings naturally.\n\nInput:\n${JSON.stringify(
            items
          )}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dose: { type: Type.STRING },
                  use: { type: Type.STRING },
                  warn: { type: Type.STRING },
                },
                required: ['name', 'dose', 'use', 'warn'],
              },
            },
          },
        });

        const translatedItems = JSON.parse(response.text || '[]');
        res.json({ items: translatedItems });
        return;
      }

      if (!text?.trim()) {
        res.status(400).json({ error: 'Text or items required for translation.' });
        return;
      }

      if (rawOnly) {
        const fastResp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Translate the following medical/patient guidance naturally and accurately into ${langLabel} so it sounds clear and warm when spoken aloud. Return JSON only.\n\nText:\n"${text.slice(
            0,
            1200
          )}"`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                translatedText: {
                  type: Type.STRING,
                  description: 'Natural fluent translation strictly in target language',
                },
              },
              required: ['translatedText'],
            },
          },
        });
        const fastParsed = JSON.parse(fastResp.text || '{}') as { translatedText?: string };
        res.json({ translatedText: fastParsed.translatedText || text });
        return;
      }

      const singleResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Translate and explain this medicine name, prescription, or health phrase accurately into ${langLabel}:\n"${text}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: {
                type: Type.STRING,
                description: 'Natural accurate translation strictly in target language',
              },
              medicineNameInLang: {
                type: Type.STRING,
                description: 'Recognizable medicine/topic title in target language',
              },
              usageAndDose: {
                type: Type.STRING,
                description: 'Clear practical explanation/use strictly in target language',
              },
              speakText: {
                type: Type.STRING,
                description: 'Clean spoken sentence ready to be read aloud strictly in target language',
              },
            },
            required: ['translatedText', 'medicineNameInLang', 'usageAndDose', 'speakText'],
          },
        },
      });

      const translated = JSON.parse(singleResp.text || '{}');
      res.json({ result: translated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Translation failed.';
      console.error('Translation error:', message);
      res.status(500).json({ error: message, offlineFallback: true });
    }
  });

  // Full App UI Localization Endpoint for ALL 55 Languages
  app.post('/api/ai/localize-ui', async (req, res) => {
    try {
      const { targetLangCode, targetLangName, baseStrings } = req.body as {
        targetLangCode?: string;
        targetLangName?: string;
        baseStrings?: Record<string, string>;
      };

      if (!targetLangCode || !baseStrings) {
        res.status(400).json({ error: 'targetLangCode and baseStrings required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured.',
          offlineFallback: true,
        });
        return;
      }

      const keys = Object.keys(baseStrings);
      const properties: Record<string, { type: Type }> = {};
      keys.forEach((k) => {
        properties[k] = { type: Type.STRING };
      });

      const langLabel =
        targetLangCode === 'ur_script'
          ? 'pure natural Pakistani Urdu Nastaliq script (اردو)'
          : targetLangCode === 'ur'
            ? 'natural clear Roman Urdu (Latin script)'
            : `${targetLangName || targetLangCode} in its authentic native script`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Translate ALL values of this patient medical app UI dictionary into ${langLabel}. Keep every label short, warm, clear, and easy for everyday patients and elders to understand. Preserve numbers like 2026, 1122, 66, 40.\n\nJSON:\n${JSON.stringify(
          baseStrings
        )}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties,
            required: keys,
          },
        },
      });

      const localized = JSON.parse(response.text || '{}');
      res.json({ strings: localized });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'UI localization failed.';
      console.error('Localize UI error:', message);
      res.status(500).json({ error: message, offlineFallback: true });
    }
  });

  // Live 2026 World Medical Breakthroughs, WHO/FDA Updates & International Brand Check (Google Search Grounding + OpenFDA/Wiki/PubMed Fallback)
  app.post('/api/ai/world-check', async (req, res) => {
    try {
      const { query, targetLangName } = req.body as {
        query?: string;
        targetLangName?: string;
      };

      const q = (query || '').trim();
      if (!q) {
        res.status(400).json({ error: 'Query is required.' });
        return;
      }

      const fetchJsonSafe = async (url: string) => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 4500);
          const r = await fetch(url, { signal: ctrl.signal });
          clearTimeout(t);
          return r.ok ? await r.json() : null;
        } catch {
          return null;
        }
      };

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Search the latest worldwide 2025-2026 clinical evidence, WHO/FDA updates, new patient care tools, or international medicine equivalents for: "${q}".\nRespond clearly in ${
              targetLangName || 'Roman Urdu'
            } using simple, patient-friendly language:
1) Latest Worldwide System / Clinical Update
2) Generic Salt & Equivalent Medicine (if applicable)
3) Practical Benefit & Safety Advice for Patients.`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const sources = chunks
            .map((c) => (c.web?.uri ? { title: c.web.title || c.web.uri, uri: c.web.uri } : null))
            .filter((x): x is { title: string; uri: string } => Boolean(x))
            .slice(0, 6);

          if (response.text) {
            res.json({
              summary: response.text,
              sources,
            });
            return;
          }
        } catch (aiErr: unknown) {
          console.warn(
            'Gemini world-check fallback:',
            aiErr instanceof Error ? aiErr.message : 'AI unavailable'
          );
        }
      }

      // Live OpenFDA + Wikipedia + PubMed fallback
      const cleanTerm = q.split(/\s+/)[0].replace(/[^a-zA-Z0-9-]/g, '') || q;
      const [wikiData, fdaData, pubData] = await Promise.all([
        fetchJsonSafe(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`),
        fetchJsonSafe(
          `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
            cleanTerm
          )}"+openfda.brand_name:"${encodeURIComponent(cleanTerm)}"&limit=1`
        ),
        fetchJsonSafe(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
            q
          )}&retmode=json&retmax=3`
        ),
      ]);

      const wikiSummary = (wikiData as { extract?: string } | null)?.extract || '';
      const fdaRec = (fdaData as { results?: Array<{ indications_and_usage?: string[]; warnings?: string[] }> } | null)?.results?.[0];
      const fdaUse = fdaRec?.indications_and_usage?.[0]?.slice(0, 320) || '';
      const pubIds: string[] = ((pubData as { esearchresult?: { idlist?: string[] } } | null)?.esearchresult?.idlist || []).slice(0, 3);

      const summaryParts = [
        wikiSummary ? `🌐 Clinical Summary:\n${wikiSummary}` : '',
        fdaUse ? `💊 US FDA Approved Use:\n${fdaUse}` : '',
        pubIds.length > 0 ? `🔬 PubMed Clinical Research IDs Found: ${pubIds.join(', ')}` : '',
        '✅ Always confirm dosage and safety with a licensed doctor.',
      ].filter(Boolean);

      res.json({
        summary:
          summaryParts.join('\n\n') ||
          `Live WHO, NIH MedlinePlus, Drugs.com & PubMed clinical links prepared for "${q}".`,
        sources: [
          { title: 'WHO Health Topics', uri: `https://www.who.int/home/search-results?indexCatalogue=genericsearchindex1&searchQuery=${encodeURIComponent(q)}` },
          { title: 'NIH MedlinePlus', uri: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${encodeURIComponent(q)}` },
          { title: 'Drugs.com Guide', uri: `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(q)}` },
          ...pubIds.map((id) => ({ title: `PubMed #${id}`, uri: `https://pubmed.ncbi.nlm.nih.gov/${id}/` })),
        ],
        offlineFallback: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'World check failed.';
      console.error('World check error:', message);
      res.status(500).json({ error: message });
    }
  });

  // Super Online Medical Search (Any Medicine, Disease, Symptom or 100+ Clinical Check -> Purpose, Dose, Treatment & Sources in Selected Language)
  app.post('/api/ai/online-search', async (req, res) => {
    try {
      const { query, targetLangCode, targetLangName, profileContext } = req.body as {
        query?: string;
        targetLangCode?: string;
        targetLangName?: string;
        profileContext?: string;
      };

      const q = (query || '').trim();
      if (!q) {
        res.status(400).json({ error: 'Search query is required.' });
        return;
      }

      // Parallel server-side live clinical fetches (OpenFDA + Wikipedia + PubMed) without browser CORS errors
      const fetchJsonSafe = async (url: string) => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          const r = await fetch(url, { signal: ctrl.signal });
          clearTimeout(t);
          return r.ok ? await r.json() : null;
        } catch {
          return null;
        }
      };

      const cleanTerm = q.split(/\s+/)[0].replace(/[^a-zA-Z0-9-]/g, '') || q;
      const [wikiData, fdaData, pubData] = await Promise.all([
        fetchJsonSafe(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`),
        fetchJsonSafe(
          `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
            cleanTerm
          )}"+openfda.brand_name:"${encodeURIComponent(cleanTerm)}"&limit=1`
        ),
        fetchJsonSafe(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
            q
          )}&retmode=json&retmax=4`
        ),
      ]);

      const wikiSummary = (wikiData as { extract?: string } | null)?.extract || '';
      const fdaRec = (fdaData as { results?: Array<{ indications_and_usage?: string[]; dosage_and_administration?: string[]; warnings?: string[] }> } | null)?.results?.[0];
      const fdaIndications = fdaRec?.indications_and_usage?.[0]?.slice(0, 400) || '';
      const fdaDosage = fdaRec?.dosage_and_administration?.[0]?.slice(0, 350) || '';
      const pubIds: string[] = ((pubData as { esearchresult?: { idlist?: string[] } } | null)?.esearchresult?.idlist || []).slice(0, 4);

      const fallbackSources: Array<{ title: string; uri: string }> = [
        { title: 'Drugs.com Medicine Guide', uri: `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(q)}` },
        { title: 'NIH MedlinePlus', uri: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${encodeURIComponent(q)}` },
        { title: 'WHO Global Health', uri: `https://www.who.int/home/search-results?indexCatalogue=genericsearchindex1&searchQuery=${encodeURIComponent(q)}` },
        ...pubIds.map((id) => ({ title: `PubMed Study #${id}`, uri: `https://pubmed.ncbi.nlm.nih.gov/${id}/` })),
      ];

      const buildFallbackResult = () => ({
        subjectTitle: q,
        category: fdaIndications ? 'MEDICINE' : 'GENERAL',
        purposeOrCause:
          fdaIndications ||
          wikiSummary ||
          `Live clinical reference search completed for "${q}". Check verified medical guides below.`,
        dosageAndUsage:
          fdaDosage ||
          'Confirm exact mg/ml dose, age limit, and before/after meal timing with a licensed doctor or pharmacist.',
        treatmentAndCare: wikiSummary
          ? wikiSummary.slice(0, 340)
          : 'Stay hydrated, monitor temperature/BP/sugar vitals, and review verified clinical links below.',
        warnings:
          fdaRec?.warnings?.[0]?.slice(0, 260) ||
          'Always check drug allergies, pregnancy/kidney status, and drug interactions before starting medicine.',
        checkedMarkers: [
          wikiSummary ? '✅ Wikipedia Medical Entry Found' : '🔎 Query Verified',
          fdaIndications ? '✅ US OpenFDA Drug Label Matched' : '🌐 International Reference',
          `🔬 PubMed Studies Found: ${pubIds.length}`,
        ],
        speakSummary: `${q}. ${
          fdaIndications ? fdaIndications.slice(0, 180) : wikiSummary ? wikiSummary.slice(0, 180) : ''
        } ${fdaDosage ? fdaDosage.slice(0, 140) : 'Confirm dosage with your doctor.'}`.trim(),
      });

      const ai = getGeminiClient();
      if (ai) {
        try {
          const langLabel =
            targetLangCode === 'ur'
              ? 'simple everyday Roman Urdu (Latin script, easy for patients)'
              : targetLangCode === 'ur_script'
                ? 'clear Pakistani Urdu script (اردو)'
                : `${targetLangName || 'English'} in its authentic native script`;

          const evidenceNotes = [
            wikiSummary ? `Wikipedia: ${wikiSummary.slice(0, 380)}` : '',
            fdaIndications ? `OpenFDA Usage: ${fdaIndications}` : '',
            fdaDosage ? `OpenFDA Dose: ${fdaDosage}` : '',
          ]
            .filter(Boolean)
            .join('\n');

          // Step 1: Google Search grounded clinical lookup
          const searchResp = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Perform an International Hospital-grade clinical lookup for: "${q}".
${profileContext ? `Patient Profile: ${profileContext}\n` : ''}${evidenceNotes ? `Database Context:\n${evidenceNotes}\n` : ''}
Respond strictly in ${langLabel}. Answer clearly for a patient:
1) Kis liye hai / Kis marz ke liye hai (Medicine purpose OR Disease/problem cause)
2) Kitni aur kab use karni hai (Standard adult/child dose considerations, timing before/after meal, always verify with doctor)
3) Ilaj ka tareeqa, diet & home care steps
4) Side effects, mana shuda cases (pregnancy/BP/kidney/dengue), & red-flag emergency signs.`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          const gChunks = searchResp.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const groundedSources = gChunks
            .map((c) => (c.web?.uri ? { title: c.web.title || c.web.uri, uri: c.web.uri } : null))
            .filter((x): x is { title: string; uri: string } => Boolean(x))
            .slice(0, 6);

          const rawText = searchResp.text || evidenceNotes || q;

          // Step 2: Format cleanly into crystal patient cards strictly in target language
          const structResp = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Structure the following medical lookup strictly in ${langLabel} into patient-friendly JSON fields:\n\nQuery: "${q}"\nClinical Details:\n${rawText.slice(0, 3500)}`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  subjectTitle: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'MEDICINE, DISEASE, REPORT, or GENERAL' },
                  purposeOrCause: { type: Type.STRING, description: 'What it treats or causes in clear patient language' },
                  dosageAndUsage: { type: Type.STRING, description: 'How much and when to take + doctor verification note' },
                  treatmentAndCare: { type: Type.STRING, description: 'Treatment steps, diet & home care in target language' },
                  warnings: { type: Type.STRING, description: 'Contraindications & emergency warning signs in target language' },
                  checkedMarkers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '4-8 concise key facts, generic salts, or lab range checks in target language',
                  },
                  speakSummary: {
                    type: Type.STRING,
                    description: 'Clear, natural 3-sentence voice readout strictly in target language',
                  },
                },
                required: [
                  'subjectTitle',
                  'category',
                  'purposeOrCause',
                  'dosageAndUsage',
                  'treatmentAndCare',
                  'warnings',
                  'checkedMarkers',
                  'speakSummary',
                ],
              },
            },
          });

          const structured = JSON.parse(structResp.text || '{}');
          res.json({
            result: structured,
            sources: groundedSources.length > 0 ? groundedSources : fallbackSources,
          });
          return;
        } catch (aiErr: unknown) {
          console.warn(
            'Gemini online-search fallback to OpenFDA/Wiki:',
            aiErr instanceof Error ? aiErr.message : 'AI unavailable'
          );
        }
      }

      res.json({
        result: buildFallbackResult(),
        sources: fallbackSources,
        offlineFallback: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Online search failed.';
      console.error('Online search error:', message);
      res.status(500).json({ error: message });
    }
  });

  // In-memory fast cache for Nearby Locator (5 min TTL)
  const nearbyCache = new Map<string, { ts: number; payload: unknown }>();

  // Live Nearby Hospital, 24h Medical Store/Pharmacy, Diagnostic Blood Lab & X-Ray/Ultrasound Finder
  app.post('/api/ai/nearby-care', async (req, res) => {
    try {
      const { lat, lng, cityQuery, category, targetLangCode, targetLangName } = req.body as {
        lat?: number;
        lng?: number;
        cityQuery?: string;
        category?: 'all' | 'hospital' | 'pharmacy' | 'lab' | 'imaging';
        targetLangCode?: string;
        targetLangName?: string;
      };

      const cat = category || 'all';
      let useLat = typeof lat === 'number' && !isNaN(lat) ? lat : null;
      let useLng = typeof lng === 'number' && !isNaN(lng) ? lng : null;
      let resolvedArea = (cityQuery || '').trim();

      const cacheKey = `${useLat?.toFixed(2) ?? ''}|${useLng?.toFixed(2) ?? ''}|${resolvedArea.toLowerCase()}|${cat}|${targetLangCode || 'ur'}`;
      const hit = nearbyCache.get(cacheKey);
      if (hit && Date.now() - hit.ts < 5 * 60 * 1000) {
        res.json(hit.payload);
        return;
      }

      // Geocode cityQuery or reverse-geocode lat/lng so we have both exact coords and area name
      if ((useLat === null || useLng === null) && resolvedArea) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 4500);
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
              resolvedArea
            )}`,
            { headers: { 'User-Agent': 'NoorHaramHealth/2026' }, signal: ctrl.signal }
          );
          clearTimeout(t);
          if (geoRes.ok) {
            const geoList = (await geoRes.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
            if (geoList[0]) {
              useLat = parseFloat(geoList[0].lat);
              useLng = parseFloat(geoList[0].lon);
              resolvedArea = geoList[0].display_name?.split(',').slice(0, 3).join(', ') || resolvedArea;
            }
          }
        } catch {
          // continue
        }
      } else if (useLat !== null && useLng !== null && !resolvedArea) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 3500);
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${useLat}&lon=${useLng}`,
            { headers: { 'User-Agent': 'NoorHaramHealth/2026' }, signal: ctrl.signal }
          );
          clearTimeout(t);
          if (revRes.ok) {
            const revJson = (await revRes.json()) as {
              address?: { city?: string; town?: string; suburb?: string; state?: string; country?: string };
            };
            const a = revJson.address;
            if (a) {
              resolvedArea = [a.suburb, a.city || a.town, a.country].filter(Boolean).join(', ');
            }
          }
        } catch {
          // ignore reverse failure
        }
      }

      interface OsmPlace {
        name: string;
        type: string;
        catKey: 'hospital' | 'pharmacy' | 'lab' | 'imaging';
        distanceKm: number;
        address: string;
        mapsUrl: string;
      }

      const collected: OsmPlace[] = [];
      const seenKeys = new Set<string>();

      const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
      };

      const pushPlace = (
        name: string,
        catKey: 'hospital' | 'pharmacy' | 'lab' | 'imaging',
        typeLabel: string,
        pLat: number,
        pLon: number,
        addr: string
      ) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const dedup = cleanName.toLowerCase();
        if (seenKeys.has(dedup)) return;
        seenKeys.add(dedup);
        const dist =
          useLat !== null && useLng !== null ? haversineKm(useLat, useLng, pLat, pLon) : 0;
        collected.push({
          name: cleanName,
          type: typeLabel,
          catKey,
          distanceKm: dist,
          address: addr || `${dist} km away`,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${pLat},${pLon}`,
        });
      };

      if (useLat !== null && useLng !== null) {
        // 1) Parallel Nominatim Bounded POI Searches for Hospital, Medical Store/Pharmacy, Blood Lab, & X-Ray/Ultrasound/Clinic
        const boxDelta = 0.14; // ~15 km radius box
        const viewbox = `${useLng - boxDelta},${useLat + boxDelta},${useLng + boxDelta},${useLat - boxDelta}`;
        const nomQueries: Array<{
          q: string;
          catKey: 'hospital' | 'pharmacy' | 'lab' | 'imaging';
          label: string;
        }> = [
          { q: 'hospital', catKey: 'hospital', label: 'Hospital / Emergency' },
          { q: 'pharmacy', catKey: 'pharmacy', label: 'Medical Store / Pharmacy' },
          { q: 'laboratory', catKey: 'lab', label: 'Blood & Diagnostic Lab' },
          { q: 'clinic', catKey: 'imaging', label: 'X-Ray / Ultrasound / Clinic' },
        ];

        const activeNomQueries =
          cat === 'all'
            ? nomQueries
            : cat === 'imaging'
              ? [
                  { q: 'ultrasound', catKey: 'imaging' as const, label: 'X-Ray / Ultrasound Center' },
                  { q: 'x-ray', catKey: 'imaging' as const, label: 'X-Ray / Imaging Center' },
                  { q: 'clinic', catKey: 'imaging' as const, label: 'Medical Clinic & Imaging' },
                ]
              : nomQueries.filter((x) => x.catKey === cat);

        const runNominatimPoi = async (item: {
          q: string;
          catKey: 'hospital' | 'pharmacy' | 'lab' | 'imaging';
          label: string;
        }) => {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 4500);
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=10&bounded=1&viewbox=${encodeURIComponent(
              viewbox
            )}&q=${encodeURIComponent(item.q)}`;
            const r = await fetch(url, {
              headers: { 'User-Agent': 'NoorHaramHealth/2026' },
              signal: ctrl.signal,
            });
            clearTimeout(timer);
            if (!r.ok) return;
            const list = (await r.json()) as Array<{
              lat: string;
              lon: string;
              name?: string;
              display_name?: string;
              type?: string;
              class?: string;
            }>;
            list.forEach((p) => {
              const nm = p.name || p.display_name?.split(',')[0] || '';
              if (!nm) return;
              const full = p.display_name || '';
              const inferredCat: 'hospital' | 'pharmacy' | 'lab' | 'imaging' =
                /pharmacy|chemist|medical\s*store|drug|dawa/i.test(nm + ' ' + (p.type || ''))
                  ? 'pharmacy'
                  : /lab|patholog|chughtai|shaukat|aga\s*khan|diagnostic/i.test(nm + ' ' + (p.type || ''))
                    ? 'lab'
                    : /x-?ray|ultrasound|imaging|mri|ct\s*scan|radiolog|clinic/i.test(nm + ' ' + (p.type || ''))
                      ? 'imaging'
                      : item.catKey;
              const typeLabel =
                inferredCat === 'pharmacy'
                  ? 'Medical Store / Pharmacy'
                  : inferredCat === 'lab'
                    ? 'Blood & Diagnostic Lab'
                    : inferredCat === 'imaging'
                      ? 'X-Ray / Ultrasound / Clinic'
                      : 'Hospital / Emergency';
              const shortAddr = full.split(',').slice(1, 4).join(',').trim();
              pushPlace(nm, inferredCat, typeLabel, parseFloat(p.lat), parseFloat(p.lon), shortAddr);
            });
          } catch {
            // ignore timeout
          }
        };

        // 2) Parallel Photon Komoot Geo POI Search (Fast, zero 1-req/s limit, global coverage)
        const runPhotonPoi = async (item: {
          q: string;
          catKey: 'hospital' | 'pharmacy' | 'lab' | 'imaging';
          label: string;
        }) => {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 4500);
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
              item.q
            )}&lat=${useLat}&lon=${useLng}&limit=12`;
            const r = await fetch(url, {
              headers: { 'User-Agent': 'NoorHaramHealth/2026' },
              signal: ctrl.signal,
            });
            clearTimeout(timer);
            if (!r.ok) return;
            const geoJson = (await r.json()) as {
              features?: Array<{
                geometry?: { coordinates?: [number, number] };
                properties?: {
                  name?: string;
                  osm_value?: string;
                  street?: string;
                  district?: string;
                  city?: string;
                  country?: string;
                };
              }>;
            };
            (geoJson.features || []).forEach((feat) => {
              const coords = feat.geometry?.coordinates;
              const props = feat.properties;
              if (!coords || !props?.name) return;
              const [pLon, pLat] = coords;
              if (useLat !== null && useLng !== null && haversineKm(useLat, useLng, pLat, pLon) > 25) {
                return;
              }
              const rawKind = `${props.osm_value || ''} ${props.name}`;
              const inferredCat: 'hospital' | 'pharmacy' | 'lab' | 'imaging' =
                /pharmacy|chemist|medical\s*store|drug|dawa/i.test(rawKind)
                  ? 'pharmacy'
                  : /lab|patholog|chughtai|shaukat|aga\s*khan|diagnostic|blood/i.test(rawKind)
                    ? 'lab'
                    : /x-?ray|ultrasound|imaging|mri|ct\s*scan|radiolog|clinic|doctors/i.test(rawKind)
                      ? 'imaging'
                      : item.catKey;
              const typeLabel =
                inferredCat === 'pharmacy'
                  ? 'Medical Store / Pharmacy'
                  : inferredCat === 'lab'
                    ? 'Blood & Diagnostic Lab'
                    : inferredCat === 'imaging'
                      ? 'X-Ray / Ultrasound / Clinic'
                      : 'Hospital / Emergency';
              const addr = [props.street, props.district, props.city].filter(Boolean).join(', ');
              pushPlace(props.name, inferredCat, typeLabel, pLat, pLon, addr);
            });
          } catch {
            // ignore photon timeout
          }
        };

        // 3) Parallel Fast Overpass Mirror Race (4.5s timeout, 7.5km radius)
        const runOverpassRace = async () => {
          const ovQuery = `[out:json][timeout:6];(
            node["amenity"~"hospital|clinic|pharmacy|doctors"](around:7500,${useLat},${useLng});
            way["amenity"~"hospital|pharmacy"](around:7500,${useLat},${useLng});
            node["healthcare"~"laboratory|hospital|pharmacy|clinic|radiology"](around:7500,${useLat},${useLng});
          );out center 50;`;
          const mirrors = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
          ];
          const fetchMirror = async (endpoint: string) => {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 4500);
            try {
              const ovRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'NoorHaramHealth/2026',
                },
                body: `data=${encodeURIComponent(ovQuery)}`,
                signal: ctrl.signal,
              });
              clearTimeout(timer);
              if (!ovRes.ok) throw new Error('Overpass HTTP error');
              return (await ovRes.json()) as {
                elements?: Array<{
                  lat?: number;
                  lon?: number;
                  center?: { lat: number; lon: number };
                  tags?: Record<string, string>;
                }>;
              };
            } catch (e) {
              clearTimeout(timer);
              throw e;
            }
          };

          try {
            const ovJson = await Promise.any(mirrors.map(fetchMirror));
            (ovJson.elements || []).forEach((el) => {
              const name = el.tags?.name || el.tags?.['name:en'] || '';
              const pLat = el.lat ?? el.center?.lat;
              const pLon = el.lon ?? el.center?.lon;
              if (!name || pLat === undefined || pLon === undefined) return;
              const kindRaw = `${el.tags?.healthcare || ''} ${el.tags?.amenity || ''} ${name}`;
              const cKey: 'hospital' | 'pharmacy' | 'lab' | 'imaging' =
                /pharmacy|medical\s*store|chemist/i.test(kindRaw)
                  ? 'pharmacy'
                  : /lab|patholog|diagnostic/i.test(kindRaw)
                    ? 'lab'
                    : /radiolog|ultrasound|x-?ray|clinic|doctors/i.test(kindRaw)
                      ? 'imaging'
                      : 'hospital';
              const tLabel =
                cKey === 'pharmacy'
                  ? 'Medical Store / Pharmacy'
                  : cKey === 'lab'
                    ? 'Blood & Diagnostic Lab'
                    : cKey === 'imaging'
                      ? 'X-Ray / Ultrasound / Clinic'
                      : 'Hospital / Emergency';
              const addr = [el.tags?.['addr:street'], el.tags?.['addr:suburb'], el.tags?.['addr:city']]
                .filter(Boolean)
                .join(', ');
              pushPlace(name, cKey, tLabel, pLat, pLon, addr);
            });
          } catch {
            // rely on Nominatim & Photon results cleanly
          }
        };

        await Promise.all([
          ...activeNomQueries.map(runNominatimPoi),
          ...activeNomQueries.map(runPhotonPoi),
          runOverpassRace(),
        ]);
      }

      // Filter & balance results so Hospital, Medical Store, Blood Lab & X-Ray ALL appear cleanly!
      collected.sort((a, b) => a.distanceKm - b.distanceKm);
      let topPlaces: OsmPlace[];
      if (cat === 'all') {
        const hos = collected.filter((p) => p.catKey === 'hospital').slice(0, 5);
        const phm = collected.filter((p) => p.catKey === 'pharmacy').slice(0, 5);
        const lab = collected.filter((p) => p.catKey === 'lab').slice(0, 5);
        const img = collected.filter((p) => p.catKey === 'imaging').slice(0, 5);
        topPlaces = [...hos, ...phm, ...lab, ...img].sort((a, b) => a.distanceKm - b.distanceKm);
      } else {
        topPlaces = collected.filter((p) => p.catKey === cat).slice(0, 14);
        if (topPlaces.length === 0) topPlaces = collected.slice(0, 12);
      }

      const publicPlaces = topPlaces.map(({ name, type, distanceKm, address, mapsUrl }) => ({
        name,
        type,
        distanceKm,
        address,
        mapsUrl,
      }));

      // Build guaranteed 4-category Google Maps direct links (Hospital, 24h Medical Store, Blood Lab, X-Ray/Ultrasound)
      const areaTail = resolvedArea ? ` near ${resolvedArea}` : ' near me';
      const buildDirectMapUrl = (search: string) =>
        useLat !== null && useLng !== null
          ? `https://www.google.com/maps/search/${encodeURIComponent(search)}/@${useLat},${useLng},14z`
          : `https://www.google.com/maps/search/${encodeURIComponent(search + areaTail)}`;

      const defaultCategoryLinks: Array<{ title: string; uri: string }> = [
        { title: '🏥 Hospitals & Emergency Near Me', uri: buildDirectMapUrl('emergency hospital') },
        { title: '💊 24h Medical Stores & Pharmacies', uri: buildDirectMapUrl('24 hour pharmacy medical store') },
        { title: '🧪 Blood Test & Diagnostic Labs', uri: buildDirectMapUrl('diagnostic blood laboratory') },
        { title: '🩻 X-Ray & Ultrasound Centers', uri: buildDirectMapUrl('ultrasound x-ray center') },
      ];

      const langLabel =
        targetLangCode === 'ur'
          ? 'simple everyday Roman Urdu'
          : targetLangCode === 'ur_script'
            ? 'clear Urdu Nastaliq script (اردو)'
            : `${targetLangName || 'English'}`;

      const ai = getGeminiClient();
      let summary = '';
      let speakSummary = '';
      let mapSources: Array<{ title: string; uri: string }> = defaultCategoryLinks;
      let offlineFallback = false;

      if (ai) {
        try {
          const catText =
            cat === 'pharmacy'
              ? '24-hour pharmacies / medical stores'
              : cat === 'lab'
                ? 'blood test diagnostic laboratories'
                : cat === 'imaging'
                  ? 'X-Ray & Ultrasound imaging centers'
                  : cat === 'hospital'
                    ? 'hospitals and emergency trauma centers'
                    : 'hospitals, 24-hour medical stores/pharmacies, blood test labs, and X-Ray/ultrasound centers';

          const promptLocation =
            useLat !== null && useLng !== null
              ? `near coordinates (${useLat.toFixed(4)}, ${useLng.toFixed(4)})${resolvedArea ? ` (${resolvedArea})` : ''}`
              : `in or near "${resolvedArea || 'my area'}"`;

          const osmHint =
            publicPlaces.length > 0
              ? `\nVerified nearby locations detected:\n${publicPlaces
                  .slice(0, 10)
                  .map((p) => `- ${p.name} [${p.type}] (${p.distanceKm} km)`)
                  .join('\n')}`
              : '';

          const mapsResp = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `List the best nearby ${catText} ${promptLocation}.${osmHint}\nInclude separate clear suggestions for Hospitals, Medical Stores/Pharmacies, Blood Test Labs, and X-Ray/Ultrasound Centers. Respond clearly in ${langLabel}.`,
            config:
              useLat !== null && useLng !== null
                ? {
                    tools: [{ googleMaps: {} }],
                    toolConfig: {
                      retrievalConfig: {
                        latLng: { latitude: useLat, longitude: useLng },
                      },
                    },
                  }
                : {
                    tools: [{ googleSearch: {} }],
                  },
          });

          summary = mapsResp.text || '';
          const gChunks = mapsResp.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const geminiLinks = gChunks
            .map((c) => {
              if (c.maps?.uri) return { title: c.maps.title || 'Google Maps Place', uri: c.maps.uri };
              if (c.web?.uri) return { title: c.web.title || 'Map Link', uri: c.web.uri };
              return null;
            })
            .filter((x): x is { title: string; uri: string } => Boolean(x))
            .slice(0, 6);

          if (geminiLinks.length > 0) {
            mapSources = [...defaultCategoryLinks, ...geminiLinks].slice(0, 8);
          }

          if (summary) {
            speakSummary = summary.replace(/[*#`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 520);
          }
        } catch {
          offlineFallback = true;
        }
      } else {
        offlineFallback = true;
      }

      if (!summary) {
        offlineFallback = true;
        if (topPlaces.length > 0) {
          const hosList = topPlaces.filter((p) => p.catKey === 'hospital').slice(0, 3);
          const phmList = topPlaces.filter((p) => p.catKey === 'pharmacy').slice(0, 3);
          const labList = topPlaces.filter((p) => p.catKey === 'lab').slice(0, 3);
          const imgList = topPlaces.filter((p) => p.catKey === 'imaging').slice(0, 3);

          const lines: string[] = [];
          if (hosList.length)
            lines.push(`🏥 Hospitals: ${hosList.map((p) => `${p.name} (${p.distanceKm} km)`).join(' • ')}`);
          if (phmList.length)
            lines.push(`💊 Medical Stores: ${phmList.map((p) => `${p.name} (${p.distanceKm} km)`).join(' • ')}`);
          if (labList.length)
            lines.push(`🧪 Blood Labs: ${labList.map((p) => `${p.name} (${p.distanceKm} km)`).join(' • ')}`);
          if (imgList.length)
            lines.push(`🩻 X-Ray / Clinics: ${imgList.map((p) => `${p.name} (${p.distanceKm} km)`).join(' • ')}`);

          summary = lines.join('\n') || publicPlaces.slice(0, 8).map((p, i) => `${i + 1}. ${p.name} — ${p.type} (${p.distanceKm} km)`).join('\n');

          const speakParts = [
            hosList[0] ? `Nearest Hospital: ${hosList[0].name}, ${hosList[0].distanceKm} km.` : '',
            phmList[0] ? `Nearest Medical Store: ${phmList[0].name}, ${phmList[0].distanceKm} km.` : '',
            labList[0] ? `Nearest Blood Lab: ${labList[0].name}, ${labList[0].distanceKm} km.` : '',
            imgList[0] ? `Nearest Clinic or X-Ray: ${imgList[0].name}, ${imgList[0].distanceKm} km.` : '',
          ].filter(Boolean);
          speakSummary =
            speakParts.join(' ') ||
            `Found ${publicPlaces.length} nearby medical centers: ${publicPlaces
              .slice(0, 4)
              .map((p) => `${p.name}, ${p.distanceKm} km`)
              .join('. ')}`;
        } else {
          summary = `Live Google Maps directions ready near ${resolvedArea || 'your location'} for:\n• 🏥 Hospitals & Emergency\n• 💊 24h Medical Stores & Pharmacies\n• 🧪 Blood Test & Diagnostic Labs\n• 🩻 X-Ray & Ultrasound Centers`;
          speakSummary = `Live Google Maps links ready near ${resolvedArea || 'your area'} for Hospitals, 24 hour Medical Stores, Blood Labs, and X-Ray centers.`;
        }
      }

      const responsePayload = {
        places: publicPlaces,
        mapSources,
        summary,
        speakSummary,
        resolvedArea,
        coords: useLat !== null && useLng !== null ? { lat: useLat, lng: useLng } : null,
        offlineFallback,
      };

      nearbyCache.set(cacheKey, { ts: Date.now(), payload: responsePayload });
      res.json(responsePayload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nearby locator failed.';
      console.error('Nearby care error:', message);
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
