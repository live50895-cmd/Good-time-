import { langSpeechMap } from '../data/themesAndLangs';
import { VoiceState } from '../types/health';

export type VoiceGender = 'female' | 'male' | 'auto';
export type VoiceMode = 'auto' | 'online' | 'native';

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

  public lastSpokenText = '';
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
      const f = pool.find((x) => this.isFemaleVoiceName(x.name)) || v.find((x) => this.isFemaleVoiceName(x.name));
      if (f) return f;
    }
    if (gender === 'male') {
      const m = pool.find((x) => this.isMaleVoiceName(x.name)) || v.find((x) => this.isMaleVoiceName(x.name));
      if (m) return m;
    }
    return pool[0] || v[0];
  }

  private getGoogleTlCode(l: string) {
    const m: Record<string, string> = { ur_script: 'ur', ur: 'en', zh: 'zh-CN', he: 'iw' };
    return m[l] || (langSpeechMap[l] ? langSpeechMap[l].split('-')[0] : 'en');
  }

  public playOnlineAudio(
    text: string,
    opts: { rate?: number; gender?: VoiceGender; lang?: string } = {}
  ) {
    const rate = opts.rate ?? 0.96;
    const gender = opts.gender ?? 'female';
    const lang = opts.lang ?? 'ur';
    const tl = lang === 'ur' ? 'hi' : this.getGoogleTlCode(lang);
    this.lastSpokenText = text;
    this.voiceQueue = this.splitChunks(text, 140);
    this.state = {
      active: true,
      engineLabel: `🌐 Online ${gender === 'male' ? 'Man' : 'Girl'} (${tl.toUpperCase()})`,
      caption: text,
      showTapPlay: false,
    };
    this.emit();
    this.playNextOnlineChunk(tl, rate, gender, 0);
  }

  private playNextOnlineChunk(tl: string, rate: number, gender: VoiceGender, pi: number) {
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
        engineLabel: 'Audio Blocked/Offline — Tap Listen or Check Volume',
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
        this.voiceQueue.shift();
        this.playNextOnlineChunk(tl, rate, gender, 0);
      };
      el.onerror = () => this.playNextOnlineChunk(tl, rate, gender, pi + 1);
      const p = el.play();
      if (p && p.catch) {
        p.catch((err: Error) => {
          if (err?.name === 'NotAllowedError') {
            this.playTone(620, 0.12);
            this.state = {
              active: true,
              engineLabel: 'Browser Autoplay Paused — Tap Listen',
              caption: this.lastSpokenText,
              showTapPlay: true,
            };
            this.emit();
          } else {
            this.playNextOnlineChunk(tl, rate, gender, pi + 1);
          }
        });
      }
    } catch {
      this.playNextOnlineChunk(tl, rate, gender, pi + 1);
    }
  }

  public speak(
    raw: string,
    opts: {
      mode?: VoiceMode;
      rate?: number;
      gender?: VoiceGender;
      specificVoice?: string;
      lang?: string;
    } = {}
  ) {
    const text = String(raw || '')
      .replace(/[#*_`~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return;

    this.stop();
    this.lastSpokenText = text;
    this.unlockAudio();

    const mode = opts.mode ?? 'auto';
    const rate = opts.rate ?? 0.96;
    const gender = opts.gender ?? 'female';
    const lang = opts.lang ?? 'ur';
    const specificVoice = opts.specificVoice ?? '';
    const pitch = gender === 'female' ? 1.2 : gender === 'male' ? 0.74 : 1.0;
    const gTag = gender === 'female' ? 'Girl' : gender === 'male' ? 'Man' : 'Auto';

    if (mode === 'online') {
      this.playOnlineAudio(text, { rate, gender, lang });
      return;
    }

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
          const elapsed = tStart ? performance.now() - tStart : 999;
          if (idx === 0 && chText.length > 12 && elapsed < 135 && mode === 'auto') {
            if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
            if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
            this.playOnlineAudio(text, { rate, gender, lang });
            return;
          }
          idx++;
          next();
        };

        u.onerror = () => {
          if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
          if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
          if (!started && mode === 'auto') {
            this.playOnlineAudio(text, { rate, gender, lang });
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
            if (!started) {
              try {
                window.speechSynthesis.cancel();
              } catch {
                // Ignore
              }
              if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
              this.playOnlineAudio(text, { rate, gender, lang });
            }
          }, 950);
        }

        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          window.speechSynthesis.speak(u);
        } catch {
          if (this.voiceWatchdog) clearTimeout(this.voiceWatchdog);
          if (this.speechKeepAlive) clearInterval(this.speechKeepAlive);
          if (mode === 'auto') this.playOnlineAudio(text, { rate, gender, lang });
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
      this.playOnlineAudio(text, { rate, gender, lang });
    }
  }
}

export const voiceEngine = new VoiceEngine();
