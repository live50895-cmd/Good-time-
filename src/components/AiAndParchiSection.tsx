import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Camera,
  FileText,
  Mic,
  Send,
  Square,
  Trash2,
  Volume2,
  FlaskConical,
  ClipboardList,
} from 'lucide-react';
import {
  analyzeOfflineClinicalQuery,
  catalogItems,
  decodeParchiAndLabs,
} from '../data/healthData';
import { I18nStrings, langSpeechMap, WHATSAPP_NUM } from '../data/themesAndLangs';
import { AiChatMessage } from '../types/health';
import { compressImageFile } from '../utils/qrAndStorage';

interface AiAndParchiSectionProps {
  currentLang: string;
  langDisplayName: string;
  strings: I18nStrings;
  autoSpeakAi: boolean;
  onSpeak: (text: string) => void;
  onStopVoice: () => void;
  onLoadFilmImageUrl: (dataUrl: string) => void;
  lastAiText: string;
  setLastAiText: (txt: string) => void;
  lastParchiText: string;
  setLastParchiText: (txt: string) => void;
  incomingParchiText: string;
  onJumpToGoogleDocs: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

interface SpeechRecInstance {
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

export const AiAndParchiSection: React.FC<AiAndParchiSectionProps> = ({
  currentLang,
  langDisplayName,
  strings,
  autoSpeakAi,
  onSpeak,
  onStopVoice,
  onLoadFilmImageUrl,
  lastAiText,
  setLastAiText,
  lastParchiText,
  setLastParchiText,
  incomingParchiText,
  onJumpToGoogleDocs,
  onNotify,
}) => {
  const [aiInput, setAiInput] = useState<string>('');
  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text:
        'Assalam-o-Alaikum! Mujhse koi bhi sawal poochein — maslan "Sar dard aur bukhar mein kya lun?", "Pet mein gas aur jalan hai", "14 kg bacche ko Calpol kitni dun?", ya "Hb 9.2, Sugar 210, BP 150/95". Main dawai, dose aur ilaj turant bol kar sunaunga!',
    },
  ]);

  const [parchiInput, setParchiInput] = useState<string>('');
  const [parchiResultLines, setParchiResultLines] = useState<string[]>([]);
  const [parchiAiReply, setParchiAiReply] = useState<string>('');
  const [parchiBusy, setParchiBusy] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    if (incomingParchiText && incomingParchiText.trim()) {
      setParchiInput(incomingParchiText);
      const decoded = decodeParchiAndLabs(incomingParchiText);
      setParchiResultLines(decoded.lines);
      setParchiAiReply('');
      setLastParchiText(decoded.spokenText);
    }
  }, [incomingParchiText, setLastParchiText]);

  const askServerGemini = async (payload: {
    prompt: string;
    imageBase64?: string;
    mimeType?: string;
    mode: 'doctor' | 'parchi' | 'ocr';
  }): Promise<{ reply?: string; error?: string; offlineFallback?: boolean }> => {
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: payload.prompt,
          languageName: langDisplayName,
          imageBase64: payload.imageBase64,
          mimeType: payload.mimeType,
          mode: payload.mode,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        offlineFallback?: boolean;
      };
      if (!res.ok) {
        return {
          error: json.error || `Server AI unavailable (${res.status})`,
          offlineFallback: Boolean(json.offlineFallback),
        };
      }
      return { reply: json.reply };
    } catch {
      return { error: 'Network error reaching AI backend.', offlineFallback: true };
    }
  };

  const runHealthAI = async (overrideQuery?: string) => {
    const raw = (overrideQuery ?? aiInput).trim();
    if (!raw) {
      onNotify('Sawal likhein ya Mic se bolein.', 'error');
      return;
    }

    setAiInput('');
    setAiBusy(true);

    const userMsg: AiChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: raw,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 1. Instant offline clinical rule/lab/medicine analysis
    const offline = analyzeOfflineClinicalQuery(raw);
    const sections: string[] = [];
    const speakParts: string[] = [];

    // 2. Call server-side Gemini AI
    const gem = await askServerGemini({ prompt: raw, mode: 'doctor' });
    if (gem.reply) {
      sections.push(`✨ Gemini Clinical AI:\n${gem.reply}`);
      speakParts.push(gem.reply);
    } else if (gem.error && !gem.offlineFallback) {
      sections.push(`⚠️ AI Notice: ${gem.error}`);
    }

    offline.blocks.forEach((b) => {
      sections.push(`${b.title}\n${b.body}`);
    });
    if (offline.spokenText) {
      speakParts.push(offline.spokenText);
    }

    // 3. Wikipedia + Catalog fallback if both server Gemini and offline rules had no direct hit
    if (!gem.reply && offline.blocks.length === 0) {
      try {
        const wr = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            raw.replace(/\s+/g, '_')
          )}`
        );
        if (wr.ok) {
          const wj = (await wr.json()) as { extract?: string };
          if (wj.extract) {
            sections.push(`🌐 Online Medical Summary:\n${wj.extract.slice(0, 380)}`);
            speakParts.push(wj.extract.slice(0, 240));
          }
        }
      } catch {
        // Ignore network errors
      }
    }

    if (sections.length === 0) {
      const words = raw
        .toLowerCase()
        .replace(/[?.,!/()]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
      const catHits = catalogItems
        .filter((it) =>
          words.some((w) => it.title.toLowerCase().includes(w) || it.desc.toLowerCase().includes(w))
        )
        .slice(0, 2);
      if (catHits.length > 0) {
        catHits.forEach((h) => {
          sections.push(`📘 ${h.title}\n${h.desc}`);
          speakParts.push(`${h.title}. ${h.desc}`);
        });
      } else {
        const fb =
          'Koi bhi bemari (sar dard, bukhar, gas, khansi, dast, sugar, bp) ya dawai ka naam likhein — main turant dose aur ehtiyat bataunga.';
        sections.push(fb);
        speakParts.push(fb);
      }
    }

    const combinedText = sections.join('\n\n');
    const combinedSpeak = speakParts.join(' ');
    setLastAiText(combinedSpeak);

    const aiMsg: AiChatMessage = {
      id: `a_${Date.now()}`,
      role: 'ai',
      text: combinedText,
      speakRaw: combinedSpeak,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setAiBusy(false);

    if (autoSpeakAi && combinedSpeak) {
      onSpeak(combinedSpeak);
    }
  };

  const startVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecInstance;
      webkitSpeechRecognition?: new () => SpeechRecInstance;
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      onNotify('Mic voice input Chrome Android/Desktop par chalta hai.', 'error');
      return;
    }
    const rec = new SR();
    rec.lang = langSpeechMap[currentLang] || 'en-US';
    setMicActive(true);
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      setMicActive(false);
      if (transcript) {
        setAiInput(transcript);
        runHealthAI(transcript);
      }
    };
    rec.onerror = () => setMicActive(false);
    rec.onend = () => setMicActive(false);
    rec.start();
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const txt = String(ev.target?.result || '').slice(0, 3500);
      if (txt.trim()) {
        runHealthAI(txt);
      }
    };
    reader.readAsText(f);
  };

  const handlePhotoOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    setOcrStatus('📸 Photo load ho rahi hai & AI Vision scan shuru...');
    compressImageFile(f, 1024, 0.82, async (dataUrl) => {
      onLoadFilmImageUrl(dataUrl);
      const b64 = dataUrl.split(',')[1];
      const gem = await askServerGemini({
        prompt:
          'Is medicine strip, prescription ya lab report ki tasveer par kya likha hai? Clear Roman Urdu (or requested language) mein dawai ka naam, use, dose aur safety ehtiyat batayein. Agar X-ray ya Ultrasound film hai to batayein ke asli tashkhees radiologist karta hai.',
        imageBase64: b64,
        mimeType: 'image/jpeg',
        mode: 'ocr',
      });

      if (gem.reply) {
        setOcrStatus('✅ Server Gemini Vision Scan Complete!');
        setLastAiText(gem.reply);
        setMessages((prev) => [
          ...prev,
          { id: `u_img_${Date.now()}`, role: 'user', text: '📷 [Photo Strip / Report Uploaded]' },
          {
            id: `a_img_${Date.now()}`,
            role: 'ai',
            text: `✨ Gemini Vision AI:\n${gem.reply}`,
            speakRaw: gem.reply,
          },
        ]);
        if (autoSpeakAi) onSpeak(gem.reply);
        return;
      }

      // Browser TextDetector fallback if Gemini key is absent on server
      const winText = window as unknown as {
        TextDetector?: new () => { detect: (img: HTMLImageElement) => Promise<Array<{ rawValue: string }>> };
      };
      if (winText.TextDetector) {
        try {
          const img = new Image();
          img.onload = async () => {
            try {
              const Detector = winText.TextDetector!;
              const res = await new Detector().detect(img);
              const extracted = res.map((r) => r.rawValue).join(' ').trim();
              if (extracted) {
                setOcrStatus('✅ Local OCR extracted text — analyzing...');
                runHealthAI(extracted);
                return;
              }
            } catch {
              // ignore
            }
            setOcrStatus(
              '📸 Photo Film Viewer mein khul gayi! Text box mein dawai/number likh kar scan karein.'
            );
          };
          img.src = dataUrl;
          return;
        } catch {
          // ignore
        }
      }

      setOcrStatus(
        gem.offlineFallback
          ? '📸 Photo Film Viewer mein khul gayi! (Live AI Vision ke liye server secrets mein GEMINI_API_KEY add karein, ya text likhein).'
          : `⚠️ ${gem.error || 'Unable to scan image.'}`
      );
    });
  };

  const analyzeParchiReport = async (overrideText?: string) => {
    const raw = (overrideText ?? parchiInput).trim();
    if (!raw) {
      onNotify('Report ya parchi text likhein.', 'error');
      return;
    }

    const offline = decodeParchiAndLabs(raw);
    setParchiResultLines(offline.lines);
    setLastParchiText(offline.spokenText);
    setParchiAiReply('');
    if (offline.spokenText) onSpeak(offline.spokenText);

    setParchiBusy(true);
    const gem = await askServerGemini({
      prompt: `Decode this doctor prescription or lab report:\n\n${raw}`,
      mode: 'parchi',
    });
    setParchiBusy(false);

    if (gem.reply) {
      setParchiAiReply(gem.reply);
      const combined = `${gem.reply}\n\n${offline.lines.join('\n')}`;
      setLastParchiText(combined);
      if (autoSpeakAi) onSpeak(gem.reply);
    }
  };

  const handleParchiPhotoScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setParchiBusy(true);
    setParchiResultLines(['✨ Parchi & Lab Report photo scan ho rahi hai...']);
    setParchiAiReply('');
    compressImageFile(f, 1024, 0.82, async (dataUrl) => {
      onLoadFilmImageUrl(dataUrl);
      const gem = await askServerGemini({
        prompt:
          'Is doctor parchi (prescription) ya lab report ki photo ko Roman Urdu mein tafseel se padh kar batayein: har dawai ka naam, kitni dafa leni hai (OD/BD/TDS), kab khani hai, ya report ke har number ka matlab (normal vs abnormal) aur safety ehtiyat.',
        imageBase64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        mode: 'parchi',
      });
      setParchiBusy(false);
      if (gem.reply) {
        setParchiAiReply(gem.reply);
        setParchiResultLines([]);
        setLastParchiText(gem.reply);
        onSpeak(gem.reply);
      } else {
        setParchiResultLines([
          '📸 Photo Film Viewer mein khul gayi! Text box mein numbers ya abbreviations (OD, BD, TDS, Hb, Sugar, Risek) likh kar Deep Scan dabayein.',
        ]);
      }
    });
  };

  const waAiHref = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(
    `Noor Haram AI:\n${lastAiText}`.slice(0, 1400)
  )}`;

  return (
    <div className="space-y-4">
      {/* HIGH-POWER AI DOCTOR CHAT */}
      <section
        id="sec-ai"
        className="theme-surface border-2 border-emerald-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-300" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-emerald-300 truncate">
                {strings.aiTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-200">{strings.aiSub}</p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'cleared',
                    role: 'ai',
                    text: 'Chat saaf ho gayi. Koi bhi naya sawal likhein ya Mic se bolein!',
                  },
                ])
              }
              className="inline-flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-[11px] text-rose-200 px-2.5 py-1.5 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 max-h-72 overflow-y-auto space-y-2.5 text-xs">
          {messages.map((m) =>
            m.role === 'user' ? (
              <div
                key={m.id}
                className="bg-sky-950/70 border border-sky-400/40 rounded-2xl p-2.5 text-sky-100 ml-4 sm:ml-10"
              >
                <strong className="text-sky-300">👤 Aap:</strong> {m.text}
              </div>
            ) : (
              <div
                key={m.id}
                className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-2.5 text-slate-100 mr-2 sm:mr-8 space-y-1.5"
              >
                <div className="flex justify-between items-center gap-2">
                  <strong className="text-emerald-300">🩺 Noor Haram AI (2026):</strong>
                  {m.speakRaw && (
                    <button
                      type="button"
                      onClick={() => onSpeak(m.speakRaw!)}
                      className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg"
                    >
                      <Volume2 className="w-3 h-3" />
                      Speak
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
              </div>
            )
          )}
          {aiBusy && (
            <div className="text-emerald-300 text-xs px-2">⏳ Clinical AI jawab tayar kar raha hai...</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {[
            ['🤒 Bukhar / Sar Dard', 'Sar dard aur bukhar mein kaunsi dawai aur kitni khaun?'],
            ['🔥 Gas / Acidity', 'Pet mein gas, jalan aur tezabiyat ke liye kaunsi dawai lun?'],
            ['👶 Child Dose', '14 kg bacche ko Calpol syrup kitna dun?'],
            ['🤧 Zukam / Khansi', 'Nazla zukam aur khansi mein Arinac ya Rigix kitni lun?'],
            ['🩸 Lab AI Check', 'Hb 9.2, Platelets 85000, FBS 165, BP 152/96, Creatinine 1.8'],
            ['📷 Camera Sachai', 'Kya phone camera se X-Ray, Ultrasound aur Baby Boy Girl check ho sakta hai?'],
          ].map(([label, prompt]) => (
            <button
              key={label}
              type="button"
              onClick={() => runHealthAI(prompt)}
              className="bg-slate-900/75 hover:bg-slate-800 border border-slate-600/80 text-slate-100 px-2.5 py-1.5 rounded-xl"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            rows={2}
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                runHealthAI();
              }
            }}
            placeholder="Yahan sawal likhein ya Mic se bolein: e.g. 'kamar dard ki dawai', 'sugar 220', 'panadol dose'..."
            className="flex-1 bg-slate-950/80 border border-slate-600 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
          />
          <div className="grid grid-cols-3 sm:flex sm:flex-col gap-2">
            <button
              type="button"
              onClick={() => runHealthAI()}
              disabled={aiBusy}
              className="inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3 py-2.5 rounded-xl"
            >
              <Send className="w-3.5 h-3.5" />
              Ask AI
            </button>
            <button
              type="button"
              onClick={startVoiceInput}
              className="inline-flex items-center justify-center gap-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl"
            >
              <Mic className="w-3.5 h-3.5" />
              {micActive ? 'Listening...' : 'Mic'}
            </button>
            <label className="cursor-pointer bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              .txt
              <input type="file" accept=".txt,.csv,.log" onChange={handleTxtUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Photo Strip / Report OCR */}
        <div className="bg-slate-950/75 border border-cyan-500/40 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <strong className="text-cyan-300">📸 Photo Strip / Report AI Scan:</strong>{' '}
            <span className="text-slate-300">Dawai patti ya report ki photo scan kar ke AI se padhwayein.</span>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-xl shrink-0">
            <Camera className="w-4 h-4" />
            Scan Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoOcrUpload}
              className="hidden"
            />
          </label>
        </div>

        {ocrStatus && (
          <div className="text-xs text-cyan-200 bg-cyan-950/60 border border-cyan-500/40 rounded-xl p-2.5">
            {ocrStatus}
          </div>
        )}

        {lastAiText && (
          <div className="flex flex-wrap justify-between items-center gap-2 pt-1 text-xs">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSpeak(lastAiText)}
                className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Speak Latest
              </button>
              <button
                type="button"
                onClick={onStopVoice}
                className="inline-flex items-center gap-1 bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
              <a
                href={waAiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-green-600 text-white font-bold px-2.5 py-1.5 rounded-lg"
              >
                📲 WhatsApp
              </a>
              <button
                type="button"
                onClick={onJumpToGoogleDocs}
                className="inline-flex items-center gap-1 bg-slate-800 border border-sky-400/50 text-sky-200 font-semibold px-2.5 py-1.5 rounded-lg"
              >
                📄 Save in Google Docs
              </button>
            </div>
          </div>
        )}
      </section>

      {/* DOCTOR PARCHI & LAB REPORT DEEP SCANNER */}
      <section
        id="sec-parchi"
        className="theme-surface border-2 border-cyan-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-cyan-300">
              📜 Doctor Parchi &amp; Lab Report Deep Scanner (AI Vision + Offline)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">
              Doctor ki likhi parchi (OD, BD, TDS, HS) ya Lab report (Hb, PLT, WBC, Sugar, LFT, RFT, TSH, Lipid, Uric Acid) paste ya upload karein:
            </p>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-xl shrink-0">
            <Camera className="w-4 h-4" />
            Upload Parchi Photo
            <input type="file" accept="image/*" onChange={handleParchiPhotoScan} className="hidden" />
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => {
              const s =
                'Hb 9.6, WBC 13800, PLT 92000, FBS 178, HbA1c 7.9, Creatinine 1.6, ALT 68, TSH 6.2, Uric Acid 8.1, Cholesterol 242';
              setParchiInput(s);
              analyzeParchiReport(s);
            }}
            className="inline-flex items-center gap-1 bg-slate-900/75 hover:bg-slate-800 border border-slate-600 px-2.5 py-1.5 rounded-xl"
          >
            <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />
            Sample CBC+Sugar+LFT
          </button>
          <button
            type="button"
            onClick={() => {
              const s =
                'Tab Augmentin 625mg 1 tab BD PC x 5 days, Cap Risek 20mg 1 cap OD AC before breakfast, Tab Panadol 500mg SOS fever';
              setParchiInput(s);
              analyzeParchiReport(s);
            }}
            className="inline-flex items-center gap-1 bg-slate-900/75 hover:bg-slate-800 border border-slate-600 px-2.5 py-1.5 rounded-xl"
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-300" />
            Sample Doctor Parchi (BD/TDS)
          </button>
        </div>

        <textarea
          rows={3}
          value={parchiInput}
          onChange={(e) => setParchiInput(e.target.value)}
          placeholder="Report numbers ya Parchi text likhein, e.g.: Hb 9.8, WBC 14500, PLT 95000, FBS 185, HbA1c 7.8, Creatinine 1.6, ALT 78, TSH 6.4, Uric Acid 8.2, Tab Augmentin 625mg BD, Cap Risek 20mg OD AC..."
          className="w-full bg-slate-950/85 border border-slate-600 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => analyzeParchiReport()}
            disabled={parchiBusy}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl"
          >
            {parchiBusy ? 'Scanning...' : '🔍 Deep Scan & Speak'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (lastParchiText) onSpeak(lastParchiText);
              else analyzeParchiReport();
            }}
            className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-2.5 rounded-xl"
          >
            🔊 Listen Result
          </button>
          {lastParchiText && (
            <button
              type="button"
              onClick={onJumpToGoogleDocs}
              className="bg-slate-900/80 border border-sky-400/50 text-sky-200 font-semibold text-xs px-3 py-2.5 rounded-xl"
            >
              📄 Save Scan to Google Docs
            </button>
          )}
        </div>

        {(parchiAiReply || parchiResultLines.length > 0) && (
          <div className="bg-slate-950/85 border border-cyan-400/50 rounded-2xl p-3.5 text-xs space-y-2.5">
            {parchiAiReply && (
              <div className="whitespace-pre-line text-slate-100 border-b border-slate-800 pb-2.5">
                <strong className="text-cyan-300 block mb-1">✨ Gemini Vision Parchi Analysis:</strong>
                {parchiAiReply}
              </div>
            )}
            {parchiResultLines.map((line, i) => (
              <div key={i} className="whitespace-pre-line text-slate-200 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
