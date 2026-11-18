import { langList, langSpeechMap } from '../data/themesAndLangs';
import { VoiceState } from '../types/health';

export type VoiceGender = 'female' | 'male' | 'auto';
export type VoiceMode = 'auto' | 'gemini' | 'online' | 'native';

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class VoiceEngine {
  private audioUnlocked = false;
  private sharedAudioCtx: AudioContext | null = null;
  private ttsAudioEl: HTMLAudioElement | null = null;
  private voiceQueue: string[] = [];
  private voiceWatchdog: ReturnType<typeof setTimeout> | null = null;
  private speechKeepAlive: ReturnType<typeof setInterval> | null = null;
  private uttQueue: SpeechSynthesisUtterance[] = [];
  private unlockedVoices: SpeechSynthesisVoice[] = [];
  private listeners = new Set<(state: VoiceState) => void>();
  private voiceListListeners = new Set<(voices: SpeechSynthesisVoice[]) => void>();
  private ttsCache = new Map<string, string>();
  private spokenTransCache = new Map<string, string>();
  private activeRequestId = 0;
  private geminiTtsCooldownUntil = 0;

  public lastSpokenText = '';
  public lastSpokenLang = 'ur';
  public state: VoiceState = {
    active: false,
    engineLabel: 'Ready — Kisi bhi dawai par tap karein',
    caption: '',
    showTapPlay: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices();
      window.addEventListener('pointerdown', () => this.unlockAudio(), {
        capture: true,
        passive: true,
      });
    }
  }

  private emit() {
    this.listeners.forEach((cb) => cb({ ...this.state }));
  }

  public subscribe(cb: (state: VoiceState) => void): () => void {
    this.listeners.add(cb);
    cb({ ...this.state });
    return () => this.listeners.delete(cb);
  }

  public subscribeVoices(cb: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.voiceListListeners.add(cb);
    cb(this.getVoices());
    return () => this.voiceListListeners.delete(cb);
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) this.unlockedVoices = list;
    }
    return this.unlockedVoices;
  }

  private initVoices() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      this.unlockedVoices = window.speechSynthesis.getVoices() || [];
      this.voiceListListeners.forEach((cb) => cb(this.unlockedVoices));
    };
    load();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = load;
    }
    setTimeout(load, 350);
    setTimeout(load, 1200);
  }

  public unlockAudio() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!this.sharedAudioCtx) this.sharedAudioCtx = new AudioCtx();
        if (this.sharedAudioCtx.state === 'suspended') {
          this.sharedAudioCtx.resume().catch(() => {});
        }
      }
      if (!this.audioUnlocked) {
        this.audioUnlocked = true;
        const dummy = new Audio(SILENT_WAV);
        dummy.volume = 0.01;
        dummy
          .play()
          .then(() => dummy.pause())
          .catch(() => {});
      }
    } catch {
      // Ignore unlock errors
    }
  }

  private getAudioElement(): HTMLAudioElement {
    if (!this.ttsAudioEl) {
      this.ttsAudioEl = new Audio();
      this.ttsAudioEl.setAttribute('playsinline', 'true');
      this.ttsAudioEl.preload = 'auto';
    }
    return this.ttsAudioEl;
  }

  public playTone(freq = 580, dur = 0.14, gainVal = 0.07) {
    this.unlockAudio();
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = this.sharedAudioCtx || new AudioCtx();
      this.sharedAudioCtx = ctx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = gainVal;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Ignore tone errors
    }
  }

  public playAlarmChime() {
    this.unlockAudio();
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = this.sharedAudioCtx || new AudioCtx();
      this.sharedAudioCtx = ctx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      [523, 659, 784, 1046].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = f;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.13);
      });
    } catch {
      // Ignore chime errors
    }
  }

  public stop() {
    this.activeRequestId += 1;
    if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
    if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
    this.voiceWatchdog = null;
    this.speechKeepAlive = null;
    this.voiceQueue = [];
    this.uttQueue = [];
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    if (this.ttsAudioEl) {
      try {
        this.ttsAudioEl.pause();
        this.ttsAudioEl.onended = null;
        this.ttsAudioEl.onerror = null;
      } catch {
        // Ignore
      }
    }
    this.state = {
      active: false,
      engineLabel: 'Stopped',
      caption: '',
      showTapPlay: false,
    };
    this.emit();
  }

  private splitChunks(s: string, max = 150): string[] {
    const words = s.split(' ');
    const chunks: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > max) {
        if (cur) chunks.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + ' ' + w).trim();
      }
    }
    if (cur) chunks.push(cur.trim());
    return chunks;
  }

  private isFemaleVoiceName(n: string) {
    return /female|woman|girl|zira|samantha|victoria|karen|tessa|moira|veena|lekha|heera|kalpana|swara|neerja|natasha|sonia|libby|hazel|aria|jenny|ava|allison|susan|catherine|fiona|kate|serena|martha|nicky|joanna|amy|sara|uzma|ananya|google.*female|iob|sfg/i.test(
      n
    );
  }

  private isMaleVoiceName(n: string) {
    return /male|man|david|mark|daniel|alex|rishi|ravi|hemant|prabhat|madhur|ryan|george|arthur|guy|thomas|oliver|fred|jorge|diego|brian|matthew|asad|salman|google.*male|iom|iol/i.test(
      n
    );
  }

  private pickBestVoice(tl: string, gender: VoiceGender, specificName: string, currentLang: string) {
    const v = this.getVoices();
    if (!v.length) return null;
    if (specificName) {
      const exact = v.find((x) => x.name === specificName);
      if (exact) return exact;
    }
    const px = tl.split('-')[0].toLowerCase();
    let pool = v;
    if (currentLang === 'ur') {
      const urIn = v.filter((x) => /ur|en-IN|hi-IN|en-PK/i.test(x.lang));
      if (urIn.length) pool = urIn;
      else {
        const enM = v.filter((x) => /^en/i.test(x.lang));
        if (enM.length) pool = enM;
      }
    } else {
      const langMatch = v.filter(
        (x) => x.lang.toLowerCase() === tl.toLowerCase() || x.lang.toLowerCase().startsWith(px)
      );
      if (langMatch.length) pool = langMatch;
      else {
        const enM = v.filter((x) => /^en/i.test(x.lang));
        if (enM.length) pool = enM;
      }
    }
    if (gender === 'female') {
      const f =
        pool.find((x) => this.isFemaleVoiceName(x.name)) ||
        v.find((x) => this.isFemaleVoiceName(x.name));
      if (f) return f;
    }
    if (gender === 'male') {
      const m =
        pool.find((x) => this.isMaleVoiceName(x.name)) ||
        v.find((x) => this.isMaleVoiceName(x.name));
      if (m) return m;
    }
    return pool[0] || v[0];
  }

  private getGoogleTlCode(l: string) {
    const m: Record<string, string> = { ur_script: 'ur', ur: 'en', zh: 'zh-CN', he: 'iw' };
    return m[l] || (langSpeechMap[l] ? langSpeechMap[l].split('-')[0] : 'en');
  }

  private getLangName(code: string): string {
    const found = langList.find((l) => l[0] === code);
    return found ? found[1] : code;
  }

  private seemsAlreadyNativeScript(text: string, lang: string): boolean {
    if (['ur_script', 'ps', 'sd', 'fa', 'ar'].includes(lang)) {
      return /[\u0600-\u06FF]/.test(text);
    }
    if (['hi', 'mr', 'ne'].includes(lang)) return /[\u0900-\u097F]/.test(text);
    if (lang === 'bn') return /[\u0980-\u09FF]/.test(text);
    if (lang === 'pa') return /[\u0A00-\u0A7F]/.test(text);
    if (lang === 'ta') return /[\u0B80-\u0BFF]/.test(text);
    if (lang === 'te') return /[\u0C00-\u0C7F]/.test(text);
    if (lang === 'gu') return /[\u0A80-\u0AFF]/.test(text);
    if (lang === 'zh') return /[\u4E00-\u9FFF]/.test(text);
    if (lang === 'ja') return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text);
    if (lang === 'ko') return /[\uAC00-\uD7AF]/.test(text);
    if (['ru', 'uk', 'kk'].includes(lang)) return /[\u0400-\u04FF]/.test(text);
    if (lang === 'he') return /[\u0590-\u05FF]/.test(text);
    if (lang === 'th') return /[\u0E00-\u0E7F]/.test(text);
    if (lang === 'el') return /[\u0370-\u03FF]/.test(text);
    if (lang === 'am') return /[\u1200-\u137F]/.test(text);
    return false;
  }

  private async ensureLanguageText(
    text: string,
    lang: string,
    skipTranslate?: boolean
  ): Promise<string> {
    if (skipTranslate) return text;
    if (lang === 'en') {
      const hasUrduMarkers = /\b(karein|karen|dawai|bukhar|dard|mareez|saans|nahi|hai|hain|khane|sunein|bilkul|fori|parchi)\b/i.test(
        text
      );
      if (!hasUrduMarkers && !/[^\u0000-\u007F]{3,}/.test(text)) {
        return text;
      }
    }
    if (lang === 'ur' && !/[\u0600-\u06FF]/.test(text)) {
      if (/\b(medicine|the|and|with|take|doctor|pain|symptoms|fever|emergency|patient)\b/i.test(text) === false) {
        return text;
      }
    }
    if (this.seemsAlreadyNativeScript(text, lang)) {
      return text;
    }

    const cacheKey = `${lang}::${text.slice(0, 450)}`;
    const cached = this.spokenTransCache.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLangCode: lang,
          targetLangName: this.getLangName(lang),
          text: text.slice(0, 1000),
          rawOnly: true,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { translatedText?: string };
        if (j.translatedText?.trim()) {
          if (this.spokenTransCache.size > 60) {
            const first = this.spokenTransCache.keys().next().value;
            if (first) this.spokenTransCache.delete(first);
          }
          this.spokenTransCache.set(cacheKey, j.translatedText.trim());
          return j.translatedText.trim();
        }
      }
    } catch {
      // fallback below
    }

    // Fallback to Google Translate GTX for non-Roman-Urdu languages
    if (lang !== 'ur') {
      try {
        const tl = this.getGoogleTlCode(lang);
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
            tl
          )}&dt=t&q=${encodeURIComponent(text.slice(0, 600))}`
        );
        if (res.ok) {
          const js = (await res.json()) as [Array<[string]>];
          const translated = (js[0] || []).map((x) => x[0]).join('').trim();
          if (translated) {
            this.spokenTransCache.set(cacheKey, translated);
            return translated;
          }
        }
      } catch {
        // return original
      }
    }

    return text;
  }

  private async tryGeminiTts(
    text: string,
    opts: { rate: number; gender: VoiceGender; lang: string },
    reqId: number
  ): Promise<boolean> {
    const cacheKey = `${opts.lang}::${opts.gender}::${text.slice(0, 750)}`;
    const langDisplay = this.getLangName(opts.lang);

    this.state = {
      active: true,
      engineLabel: `HD AI Voice (${opts.gender === 'male' ? 'Man' : 'Girl'} · ${langDisplay})...`,
      caption: text,
      showTapPlay: false,
    };
    this.emit();

    try {
      let base64 = this.ttsCache.get(cacheKey);
      if (!base64) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.slice(0, 750),
            languageName: langDisplay,
            gender: opts.gender,
          }),
        });
        if (reqId !== this.activeRequestId) return true; // superseded by stop/new speak
        if (!res.ok) {
          if (res.status === 429 || res.status === 503) {
            this.geminiTtsCooldownUntil = Date.now() + 120_000;
          }
          return false;
        }
        const json = (await res.json()) as { audioBase64?: string };
        if (!json.audioBase64) return false;
        base64 = json.audioBase64;
        if (this.ttsCache.size > 35) {
          const firstKey = this.ttsCache.keys().next().value;
          if (firstKey) this.ttsCache.delete(firstKey);
        }
        this.ttsCache.set(cacheKey, base64);
      }

      if (reqId !== this.activeRequestId) return true;

      const el = this.getAudioElement();
      el.src = `data:audio/wav;base64,${base64}`;
      el.volume = 1.0;
      el.playbackRate = Math.min(1.35, Math.max(0.75, opts.rate));
      el.onended = () => {
        if (reqId !== this.activeRequestId) return;
        this.state = {
          active: false,
          engineLabel: 'Finished HD Voice',
          caption: '',
          showTapPlay: false,
        };
        this.emit();
      };
      el.onerror = () => {
        if (reqId !== this.activeRequestId) return;
        this.playOnlineAudio(text, { ...opts, skipTranslate: true });
      };

      this.state = {
        active: true,
        engineLabel: `HD AI Voice Active (${opts.gender === 'male' ? 'Man' : 'Girl'} · ${opts.lang.toUpperCase()})`,
        caption: text,
        showTapPlay: false,
      };
      this.emit();

      try {
        await el.play();
      } catch (err) {
        const errName = err instanceof Error ? err.name : '';
        if (errName === 'NotAllowedError') {
          this.playTone(620, 0.12);
          this.state = {
            active: true,
            engineLabel: 'Tap Listen to Play Audio',
            caption: text,
            showTapPlay: true,
          };
          this.emit();
        } else {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  public async playOnlineAudio(
    rawText: string,
    opts: { rate?: number; gender?: VoiceGender; lang?: string; skipTranslate?: boolean } = {}
  ) {
    const rate = opts.rate ?? 0.96;
    const gender = opts.gender ?? 'female';
    const lang = opts.lang ?? 'ur';
    const reqId = this.activeRequestId;
    const text = await this.ensureLanguageText(rawText, lang, opts.skipTranslate);
    if (reqId !== this.activeRequestId) return;

    const tl = lang === 'ur' ? 'hi' : this.getGoogleTlCode(lang);
    this.lastSpokenText = text;
    this.lastSpokenLang = lang;
    this.voiceQueue = this.splitChunks(text, 140);
    this.state = {
      active: true,
      engineLabel: `Online ${gender === 'male' ? 'Man' : 'Girl'} (${tl.toUpperCase()})`,
      caption: text,
      showTapPlay: false,
    };
    this.emit();
    this.playNextOnlineChunk(tl, rate, gender, 0, reqId);
  }

  private playNextOnlineChunk(
    tl: string,
    rate: number,
    gender: VoiceGender,
    pi: number,
    reqId: number
  ) {
    if (reqId !== this.activeRequestId) return;
    if (!this.voiceQueue.length) {
      this.state = { active: false, engineLabel: 'Finished Audio', caption: '', showTapPlay: false };
      this.emit();
      return;
    }
    const ch = this.voiceQueue[0];
    const el = this.getAudioElement();
    const urls = [
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encodeURIComponent(ch)}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=gtx&q=${encodeURIComponent(ch)}`,
      `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=gtx&q=${encodeURIComponent(ch)}`,
    ];
    if (pi >= urls.length) {
      this.playTone(580, 0.12);
      this.state = {
        active: true,
        engineLabel: 'Tap Listen or Check Volume',
        caption: this.lastSpokenText,
        showTapPlay: true,
      };
      this.emit();
      return;
    }
    try {
      el.setAttribute('referrerpolicy', 'no-referrer');
      el.src = urls[pi];
      el.volume = 1.0;
      const audioAny = el as unknown as {
        preservesPitch?: boolean;
        webkitPreservesPitch?: boolean;
        mozPreservesPitch?: boolean;
      };
      audioAny.preservesPitch = false;
      audioAny.webkitPreservesPitch = false;
      audioAny.mozPreservesPitch = false;
      const shapedRate =
        gender === 'male'
          ? Math.max(0.75, rate * 0.87)
          : gender === 'female'
            ? Math.min(1.35, rate * 1.05)
            : rate;
      el.playbackRate = shapedRate;
      el.onended = () => {
        if (reqId !== this.activeRequestId) return;
        this.voiceQueue.shift();
        this.playNextOnlineChunk(tl, rate, gender, 0, reqId);
      };
      el.onerror = () => this.playNextOnlineChunk(tl, rate, gender, pi + 1, reqId);
      const p = el.play();
      if (p && p.catch) {
        p.catch((err: Error) => {
          if (reqId !== this.activeRequestId) return;
          if (err?.name === 'NotAllowedError') {
            this.playTone(620, 0.12);
            this.state = {
              active: true,
              engineLabel: 'Tap Listen to Play Audio',
              caption: this.lastSpokenText,
              showTapPlay: true,
            };
            this.emit();
          } else {
            this.playNextOnlineChunk(tl, rate, gender, pi + 1, reqId);
          }
        });
      }
    } catch {
      this.playNextOnlineChunk(tl, rate, gender, pi + 1, reqId);
    }
  }

  public async speak(
    raw: string,
    opts: {
      mode?: VoiceMode;
      rate?: number;
      gender?: VoiceGender;
      specificVoice?: string;
      lang?: string;
      skipTranslate?: boolean;
    } = {}
  ) {
    const cleanRaw = String(raw || '')
      .replace(/[#*_`~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanRaw) return;

    this.stop();
    const reqId = this.activeRequestId;
    this.unlockAudio();

    const mode = opts.mode ?? 'auto';
    const rate = opts.rate ?? 0.96;
    const gender = opts.gender ?? 'female';
    const lang = opts.lang ?? 'ur';
    const specificVoice = opts.specificVoice ?? '';
    const pitch = gender === 'female' ? 1.2 : gender === 'male' ? 0.74 : 1.0;
    const gTag = gender === 'female' ? 'Girl' : gender === 'male' ? 'Man' : 'Auto';

    this.state = {
      active: true,
      engineLabel: `Preparing ${this.getLangName(lang)} Voice...`,
      caption: cleanRaw,
      showTapPlay: false,
    };
    this.emit();

    const text = await this.ensureLanguageText(cleanRaw, lang, opts.skipTranslate);
    if (reqId !== this.activeRequestId) return;

    this.lastSpokenText = text;
    this.lastSpokenLang = lang;

    if (mode === 'online') {
      this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
      return;
    }

    // In 'gemini' or 'auto' (without pinned device voice), prefer HD Gemini TTS first unless cooling down from 429!
    if (
      mode === 'gemini' ||
      (mode === 'auto' && !specificVoice && Date.now() > this.geminiTtsCooldownUntil)
    ) {
      const ok = await this.tryGeminiTts(text, { rate, gender, lang }, reqId);
      if (ok || reqId !== this.activeRequestId) return;
      if (mode === 'gemini') {
        this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
        return;
      }
    }

    if (reqId !== this.activeRequestId) return;

    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      const tl = langSpeechMap[lang] || 'en-US';
      const bv = this.pickBestVoice(tl, gender, specificVoice, lang);
      const chunks = this.splitChunks(text, 155);
      let idx = 0;

      this.speechKeepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 8500);

      const next = () => {
        if (reqId !== this.activeRequestId) return;
        if (idx >= chunks.length) {
          if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
          this.state = {
            active: false,
            engineLabel: 'Finished — Ready',
            caption: text,
            showTapPlay: false,
          };
          this.emit();
          return;
        }
        const chText = chunks[idx];
        const u = new SpeechSynthesisUtterance(chText);
        this.uttQueue.push(u);
        if (bv) {
          u.voice = bv;
          u.lang = bv.lang;
        } else {
          u.lang = tl;
        }
        u.rate = rate;
        u.pitch = pitch;
        u.volume = 1.0;
        let started = false;
        let tStart = 0;

        u.onstart = () => {
          started = true;
          tStart = performance.now();
          if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
          this.state = {
            active: true,
            engineLabel: `${gTag} (${u.lang})`,
            caption: text,
            showTapPlay: false,
          };
          this.emit();
        };

        u.onend = () => {
          if (reqId !== this.activeRequestId) return;
          const elapsed = tStart ? performance.now() - tStart : 999;
          if (idx === 0 && chText.length > 12 && elapsed < 135 && mode === 'auto') {
            if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
            if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
            this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
            return;
          }
          idx++;
          next();
        };

        u.onerror = () => {
          if (reqId !== this.activeRequestId) return;
          if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
          if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
          if (!started && mode === 'auto') {
            this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
          } else {
            this.state = {
              active: true,
              engineLabel: 'Switching to Online Audio...',
              caption: text,
              showTapPlay: true,
            };
            this.emit();
          }
        };

        if (idx === 0 && mode === 'auto') {
          if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
          this.voiceWatchdog = setTimeout(() => {
            if (!started && reqId === this.activeRequestId) {
              try {
                window.speechSynthesis.cancel();
              } catch {
                // Ignore
              }
              if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
              this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
            }
          }, 550);
        }

        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          window.speechSynthesis.speak(u);
        } catch {
          if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
          if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
          if (mode === 'auto') this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
        }
      };

      this.state = {
        active: true,
        engineLabel: `Starting ${gTag} (${tl})...`,
        caption: text,
        showTapPlay: false,
      };
      this.emit();
      next();
    } else {
      this.playOnlineAudio(text, { rate, gender, lang, skipTranslate: true });
    }
  }
}

export const voiceEngine = new VoiceEngine();
