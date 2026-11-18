import React, { useEffect, useMemo, useState } from 'react';
import {
  BellPlus,
  Calculator,
  Globe,
  Languages,
  MapPin,
  Volume2,
  Square,
  ExternalLink,
} from 'lucide-react';
import {
  desiFoodsList,
  dietCharts,
  getPregWeekInfo,
  makeSvgBadge,
  medicinesData,
  ramadanPlans,
} from '../data/healthData';
import { I18nStrings, langList, langSpeechMap } from '../data/themesAndLangs';
import { voiceEngine, VoiceGender, VoiceMode } from '../services/voiceEngine';
import {
  GroundedSource,
  MedicineItem,
  NearbyCareResult,
  OnlineSearchResult,
  VoiceState,
} from '../types/health';
import { readStorageJson, writeStorageJson } from '../utils/qrAndStorage';

interface ClinicalToolsAndGuidesProps {
  searchQuery: string;
  currentLang: string;
  strings: I18nStrings;
  lmpDate: string;
  voiceState: VoiceState;
  voiceGender: VoiceGender;
  setVoiceGender: (g: VoiceGender) => void;
  specificVoice: string;
  setSpecificVoice: (v: string) => void;
  voiceMode: VoiceMode;
  setVoiceMode: (m: VoiceMode) => void;
  voiceSpeed: number;
  setVoiceSpeed: (s: number) => void;
  autoSpeakAi: boolean;
  setAutoSpeakAi: (v: boolean) => void;
  onSpeak: (txt: string, skipTranslate?: boolean) => void;
  onForceOnline: (txt: string) => void;
  onStopVoice: () => void;
  onAddRamadanAlarms: () => void;
  onJumpToExtraCatalog: () => void;
  externalWorldScanQuery: string;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

const labRanges: Record<string, string> = {
  hb: 'Men: 13.5–17.5 | Women: 12.0–15.5 g/dL',
  plt: '150,000 – 450,000 /µL (<50k = Urgent!)',
  wbc: '4,000 – 11,000 /µL',
  fbs: 'Fasting: 70–99 mg/dL | HbA1c: <5.7%',
  cr: 'Creatinine: 0.6–1.3 mg/dL | Urea: 10–45',
  alt: 'ALT (SGPT): 7–45 U/L | Bilirubin: <1.2',
  tsh: 'TSH: 0.4 – 4.5 mIU/L',
  chol: 'Total Chol: <200 | Triglycerides: <150 mg/dL',
  uric: 'Men: 3.4–7.0 | Women: 2.4–6.0 mg/dL',
  vitd: 'Vitamin D: 30–100 ng/mL | B12: 200–900 pg/mL',
};

const medPhraseDict: Record<string, Record<string, string>> = {
  ur: {
    'Fever and mild to moderate body, head, or tooth pain.':
      'Bukhar aur halka ya darmiyana sar, jism aur daant ka dard.',
  },
  ur_script: {
    'Paracetamol (Panadol / Calpol)': 'پیراسیٹامول (پیناڈول / کالپول)',
    'Ibuprofen (Brufen)': 'آئیبوپروفین (بروفین)',
    'Omeprazole (Risek / Losec)': 'اومیپرازول (رائزیک / لوسیک)',
  },
  ar: {
    'Paracetamol (Panadol / Calpol)': 'باراسيتامول (بانادول)',
  },
  hi: {
    'Paracetamol (Panadol / Calpol)': 'पैरासिटामोल (पैनाडोल / कैलपोल)',
  },
};

function getGoogleTlCode(l: string): string {
  const m: Record<string, string> = { ur_script: 'ur', ur: 'en', zh: 'zh-CN', he: 'iw' };
  return m[l] || (langSpeechMap[l] ? langSpeechMap[l].split('-')[0] : 'en');
}

export const ClinicalToolsAndGuides: React.FC<ClinicalToolsAndGuidesProps> = ({
  searchQuery,
  currentLang,
  strings,
  lmpDate,
  voiceState,
  voiceGender,
  setVoiceGender,
  specificVoice,
  setSpecificVoice,
  voiceMode,
  setVoiceMode,
  voiceSpeed,
  setVoiceSpeed,
  autoSpeakAi,
  setAutoSpeakAi,
  onSpeak,
  onForceOnline,
  onStopVoice,
  onAddRamadanAlarms,
  onJumpToExtraCatalog,
  externalWorldScanQuery,
  onNotify,
}) => {
  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeMedIdx, setActiveMedIdx] = useState<number | null>(null);
  const [transCache, setTransCache] = useState<Record<string, MedicineItem>>(() =>
    readStorageJson<Record<string, MedicineItem>>('noor_trans_cache_v3', {})
  );
  const [medTransStatus, setMedTransStatus] = useState<string>('Ready');

  // Voice Quick-Speak & Super Google Translator States
  const [quickSpeakText, setQuickSpeakText] = useState<string>('');
  const [superTransInput, setSuperTransInput] = useState<string>('');
  const [superTransLang, setSuperTransLang] = useState<string>(currentLang);
  const [superTransBusy, setSuperTransBusy] = useState<boolean>(false);
  const [superTransOut, setSuperTransOut] = useState<{
    translatedText: string;
    medicineNameInLang: string;
    usageAndDose: string;
    speakText: string;
  } | null>(null);

  const [ramadanKey, setRamadanKey] = useState<string>('diabetes');
  const [dietKey, setDietKey] = useState<string>('sugar');
  const [selectedPlate, setSelectedPlate] = useState<Array<[string, number, number]>>([]);
  const [pregWeek, setPregWeek] = useState<number>(16);
  const [gpsCoords, setGpsCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>(
    'GPS se apna nazdeeki Hospital, 24-Hour Pharmacy ya Blood Lab Google Maps par foran kholein.'
  );

  // Power Tools states
  const [convTemp, setConvTemp] = useState<string>('');
  const [convTempOut, setConvTempOut] = useState<string>('98.6°F = 37°C Normal');
  const [mapSys, setMapSys] = useState<string>('');
  const [mapDia, setMapDia] = useState<string>('');
  const [mapOut, setMapOut] = useState<string>('Normal MAP: 70–100 mmHg');
  const [bmrKg, setBmrKg] = useState<string>('');
  const [bmrCm, setBmrCm] = useState<string>('');
  const [bmrAge, setBmrAge] = useState<string>('');
  const [bmrOut, setBmrOut] = useState<string>('Enter weight, height & age');
  const [egfrCr, setEgfrCr] = useState<string>('');
  const [egfrAge, setEgfrAge] = useState<string>('');
  const [egfrSex, setEgfrSex] = useState<string>('1');
  const [egfrOut, setEgfrOut] = useState<string>('Normal eGFR: ≥90');
  const [ibwCm, setIbwCm] = useState<string>('');
  const [ibwOut, setIbwOut] = useState<string>('Healthy range by height');
  const [labRangeKey, setLabRangeKey] = useState<string>('hb');
  const [painVal, setPainVal] = useState<number>(3);

  // World Scan states
  const [worldInput, setWorldInput] = useState<string>('');
  const [worldBusy, setWorldBusy] = useState<boolean>(false);
  const [worldResults, setWorldResults] = useState<{
    structured?: OnlineSearchResult;
    sources?: GroundedSource[];
    localMed?: string;
    spoken?: string;
    skipTranslate?: boolean;
  } | null>(null);
  const [nearbyQuickOut, setNearbyQuickOut] = useState<NearbyCareResult | null>(null);
  const [nearbyQuickBusy, setNearbyQuickBusy] = useState<boolean>(false);

  useEffect(() => {
    return voiceEngine.subscribeVoices((list) => {
      setDeviceVoices(list);
    });
  }, []);

  useEffect(() => {
    setSuperTransLang(currentLang);
  }, [currentLang]);

  // Super Google Translation batch translator for all 66 medicines when language changes
  const runBatchMedicineTranslation = async (forceRefresh = false) => {
    if (currentLang === 'en') {
      setMedTransStatus('English Active');
      return;
    }
    if (
      !forceRefresh &&
      transCache[`${currentLang}::med_0`] &&
      transCache[`${currentLang}::med_60`]
    ) {
      const langTuple = langList.find((l) => l[0] === currentLang);
      setMedTransStatus(`Translated: ${langTuple ? langTuple[1] : currentLang.toUpperCase()}`);
      return;
    }

    const langTuple = langList.find((l) => l[0] === currentLang);
    const targetLangName = langTuple ? langTuple[1] : currentLang;
    setMedTransStatus(`Translating 66 Meds (${currentLang.toUpperCase()})...`);

    const updated = { ...transCache };
    let usedSuperBackend = false;

    try {
      // Translate in 3 batches of 22 via Gemini Super Translator
      const batchSize = 22;
      const chunks: Array<{ start: number; items: MedicineItem[] }> = [];
      for (let b = 0; b < medicinesData.length; b += batchSize) {
        chunks.push({ start: b, items: medicinesData.slice(b, b + batchSize) });
      }

      const results = await Promise.all(
        chunks.map(async ({ start, items }) => {
          const res = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetLangCode: currentLang,
              targetLangName,
              items: items.map((m) => ({
                name: m.name,
                dose: m.dose,
                use: m.use,
                warn: m.warn,
              })),
            }),
          });
          if (!res.ok) throw new Error('Backend translate unavailable');
          const json = (await res.json()) as {
            items?: Array<{ name: string; dose: string; use: string; warn: string }>;
          };
          return { start, translated: json.items || [] };
        })
      );

      results.forEach(({ start, translated }) => {
        translated.forEach((tr, ri) => {
          const orig = medicinesData[start + ri];
          if (!orig) return;
          updated[`${currentLang}::med_${start + ri}`] = {
            ...orig,
            name: tr.name || orig.name,
            dose: tr.dose || orig.dose,
            use: tr.use || orig.use,
            warn: tr.warn || orig.warn,
          };
        });
      });
      usedSuperBackend = true;
    } catch {
      // Fallback to public Google Translate REST if offline or server key missing
      const tl = currentLang === 'ur' ? 'hi' : getGoogleTlCode(currentLang);
      try {
        for (let b = 0; b < medicinesData.length; b += 12) {
          const sl = medicinesData.slice(b, b + 12);
          const joined = sl.map((m) => `${m.name} ||| ${m.dose} ||| ${m.use} ||| ${m.warn}`).join('\n@@\n');
          const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
              tl
            )}&dt=t&q=${encodeURIComponent(joined)}`
          );
          if (!res.ok) throw new Error('net');
          const js = (await res.json()) as [Array<[string]>];
          const full = (js[0] || []).map((x) => x[0]).join('');
          full.split(/\n?@@\n?/).forEach((row, ri) => {
            const orig = medicinesData[b + ri];
            if (!orig) return;
            const p = row.split('|||').map((s) => s.trim());
            if (p.length >= 4) {
              updated[`${currentLang}::med_${b + ri}`] = {
                ...orig,
                name: p[0] || orig.name,
                dose: p[1] || orig.dose,
                use: p[2] || orig.use,
                warn: p[3] || orig.warn,
              };
            }
          });
        }
      } catch {
        setMedTransStatus('Offline Mode');
        return;
      }
    }

    setTransCache(updated);
    writeStorageJson('noor_trans_cache_v3', updated);
    setMedTransStatus(
      usedSuperBackend
        ? `Super Translated (${targetLangName})`
        : `Google Translated (${currentLang.toUpperCase()})`
    );
  };

  useEffect(() => {
    runBatchMedicineTranslation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLang]);

  const runSuperTranslator = async (overrideText?: string) => {
    const q = (overrideText ?? superTransInput).trim();
    if (!q) {
      onNotify('Dawai ka naam ya koi jumla likhein translate karne ke liye.', 'error');
      return;
    }
    if (overrideText) setSuperTransInput(overrideText);

    const targetTuple = langList.find((l) => l[0] === superTransLang);
    const targetName = targetTuple ? targetTuple[1] : superTransLang;

    setSuperTransBusy(true);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: q,
          targetLangCode: superTransLang,
          targetLangName: targetName,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          result?: {
            translatedText: string;
            medicineNameInLang: string;
            usageAndDose: string;
            speakText: string;
          };
        };
        if (json.result) {
          setSuperTransOut(json.result);
          voiceEngine.speak(json.result.speakText, {
            mode: voiceMode,
            rate: voiceSpeed,
            gender: voiceGender,
            specificVoice,
            lang: superTransLang,
            skipTranslate: true,
          });
          setSuperTransBusy(false);
          return;
        }
      }
    } catch {
      // fall through to Google Translate REST fallback
    }

    try {
      const tl = getGoogleTlCode(superTransLang);
      const r = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
          tl
        )}&dt=t&q=${encodeURIComponent(q)}`
      );
      if (r.ok) {
        const js = (await r.json()) as [Array<[string]>];
        const tr = (js[0] || []).map((x) => x[0]).join('');
        const out = {
          translatedText: tr,
          medicineNameInLang: tr,
          usageAndDose: `Translated via Google (${targetName})`,
          speakText: tr,
        };
        setSuperTransOut(out);
        voiceEngine.speak(tr, {
          mode: voiceMode,
          rate: voiceSpeed,
          gender: voiceGender,
          specificVoice,
          lang: superTransLang,
        });
      }
    } catch {
      onNotify('Translation service unavailable right now.', 'error');
    } finally {
      setSuperTransBusy(false);
    }
  };

  const getLocalizedMed = (idx: number): MedicineItem => {
    const m = medicinesData[idx];
    if (currentLang === 'en') return m;
    const cached = transCache[`${currentLang}::med_${idx}`];
    if (cached) return cached;
    const dict = medPhraseDict[currentLang] || {};
    return {
      ...m,
      name: dict[m.name] || m.name,
      dose: dict[m.dose] || m.dose,
      use: dict[m.use] || m.use,
      warn: dict[m.warn] || m.warn,
    };
  };

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return medicinesData
      .map((m, idx) => ({ m, idx, lm: getLocalizedMed(idx) }))
      .filter(({ m, lm }) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          lm.name.toLowerCase().includes(q) ||
          m.use.toLowerCase().includes(q) ||
          lm.use.toLowerCase().includes(q) ||
          m.tags.includes(q)
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentLang, transCache]);

  const speakMed = (idx: number) => {
    setActiveMedIdx(idx);
    const lm = getLocalizedMed(idx);
    onSpeak(`${strings.medNameLbl} ${lm.name}. ${strings.medDoseLbl} ${lm.dose}. ${strings.medUseLbl} ${lm.use}. ${strings.medWarnLbl} ${lm.warn}`);
  };

  const pregInfo = getPregWeekInfo(pregWeek);
  const ramadanPlan = ramadanPlans[ramadanKey];
  const dietPlan = dietCharts[dietKey];
  const totalKcal = selectedPlate.reduce((a, b) => a + b[1], 0);
  const totalCarbs = selectedPlate.reduce((a, b) => a + b[2], 0);

  const locateGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS unavailable — Google Maps links seedha kaam karenge.');
      return;
    }
    setGpsStatus('📡 GPS location le raha hai...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setGpsCoords({ lat, lng });
        setGpsStatus(`✅ GPS Ready (${lat}, ${lng}) — Ab kisi bhi button par tap karein!`);
      },
      () => {
        setGpsStatus('Location permission nahi mili — direct Google Maps search active hai.');
      },
      { timeout: 7000 }
    );
  };

  const buildMapUrl = (q: string) => {
    const encoded = encodeURIComponent(q);
    return gpsCoords
      ? `https://www.google.com/maps/search/${encoded}/@${gpsCoords.lat},${gpsCoords.lng},14z`
      : `https://www.google.com/maps/search/${encoded}`;
  };

  const speakNearbyPlaces = async () => {
    setNearbyQuickBusy(true);
    const langTuple = langList.find((l) => l[0] === currentLang);
    const langDisplayName = langTuple ? langTuple[1] : 'English';
    const callBackend = async (lat?: number, lng?: number, city?: string) => {
      try {
        const res = await fetch('/api/ai/nearby-care', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            cityQuery: city,
            category: 'all',
            targetLangCode: currentLang,
            targetLangName: langDisplayName,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as NearbyCareResult & {
          offlineFallback?: boolean;
        };
        if (res.ok && json.summary) {
          setNearbyQuickOut(json);
          onSpeak(json.speakSummary || json.summary, !json.offlineFallback);
          onNotify('Nearby Hospitals, Medical Stores & Labs spoken!', 'success');
        }
      } catch {
        onNotify('GPS Maps links are ready below.', 'info');
      } finally {
        setNearbyQuickBusy(false);
      }
    };

    const resolveViaIp = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch('https://ipwho.is/', { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) {
          const ip = (await r.json()) as {
            success?: boolean;
            city?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
          };
          if (ip.success && typeof ip.latitude === 'number' && typeof ip.longitude === 'number') {
            setGpsCoords({ lat: ip.latitude.toFixed(5), lng: ip.longitude.toFixed(5) });
            setGpsStatus(`📡 Detected Area: ${ip.city || ''}, ${ip.country || ''}`);
            await callBackend(ip.latitude, ip.longitude, [ip.city, ip.country].filter(Boolean).join(', '));
            return;
          }
        }
      } catch {
        // ignore
      }
      await callBackend(undefined, undefined, 'Lahore Pakistan');
    };

    if (gpsCoords) {
      await callBackend(parseFloat(gpsCoords.lat), parseFloat(gpsCoords.lng));
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          setGpsCoords({ lat, lng });
          setGpsStatus(`✅ GPS Ready (${lat}, ${lng})`);
          callBackend(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          resolveViaIp();
        },
        { timeout: 6000 }
      );
    } else {
      await resolveViaIp();
    }
  };

  const runLiveWorldScan = async (overrideQ?: string) => {
    const q = (overrideQ ?? worldInput).trim();
    if (!q) {
      onNotify('Enter a medicine or medical problem to scan online.', 'error');
      return;
    }
    if (overrideQ) setWorldInput(overrideQ);
    setWorldBusy(true);
    const langTuple = langList.find((l) => l[0] === currentLang);
    const langDisplayName = langTuple ? langTuple[1] : 'English';
    const ql = q.toLowerCase();
    const lm = medicinesData.find(
      (m) => m.name.toLowerCase().includes(ql) || m.tags.toLowerCase().includes(ql)
    );

    try {
      const res = await fetch('/api/ai/online-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          targetLangCode: currentLang,
          targetLangName: langDisplayName,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        result?: OnlineSearchResult;
        sources?: GroundedSource[];
        offlineFallback?: boolean;
      };

      if (res.ok && json.result) {
        const spoken = json.result.speakSummary || json.result.purposeOrCause;
        setWorldResults({
          structured: json.result,
          sources: json.sources || [],
          localMed: lm ? `${lm.name}: ${lm.dose} — ${lm.use}` : '',
          spoken,
          skipTranslate: !json.offlineFallback,
        });
        setWorldBusy(false);
        if (spoken) onSpeak(spoken, !json.offlineFallback);
        return;
      }
    } catch {
      // fall through to offline/local fallback
    }

    const spokenFallback = lm
      ? `${lm.name}. ${lm.use}. ${lm.dose}`
      : `Verified NIH, WHO and Drugs.com links ready for ${q}`;
    setWorldResults({
      localMed: lm ? `${lm.name}: ${lm.dose} — ${lm.use}` : '',
      spoken: spokenFallback,
      skipTranslate: Boolean(lm),
    });
    setWorldBusy(false);
    onSpeak(spokenFallback, Boolean(lm));
  };

  useEffect(() => {
    if (externalWorldScanQuery) {
      setWorldInput(externalWorldScanQuery);
      runLiveWorldScan(externalWorldScanQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalWorldScanQuery]);

  const encodedWorld = encodeURIComponent(worldInput.trim() || 'health');

  return (
    <div className="space-y-4">
      {/* FIXED 2026 VOICE ENGINE CONTROL BAR */}
      <section className="theme-surface border-2 border-sky-400/50 rounded-2xl p-3.5 no-print space-y-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5 text-sky-300" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="text-sky-300 block truncate">
                Fixed 2026 Voice Engine (AI + Medicine Click — Girl 👩 &amp; Man 👨)
              </strong>
              <span className="text-slate-200 text-[11px] block truncate">
                {voiceState.engineLabel}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-sky-950/80 border border-sky-500/40 text-sky-200 px-2.5 py-1 rounded-xl whitespace-nowrap">
            {deviceVoices.length > 0
              ? `Device Voices: ${deviceVoices.length} | Online MP3 Ready`
              : 'Online MP3 Ready (Device Voices: 0)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
          <select
            value={voiceGender}
            onChange={(e) => setVoiceGender(e.target.value as VoiceGender)}
            className="bg-slate-950/90 border border-pink-400/60 text-pink-200 font-semibold rounded-xl px-2 py-2 text-xs w-full sm:w-auto"
          >
            <option value="female">👩 Girl / Female</option>
            <option value="male">👨 Man / Male</option>
            <option value="auto">🤖 Auto Voice</option>
          </select>

          <select
            value={specificVoice}
            onChange={(e) => setSpecificVoice(e.target.value)}
            className="bg-slate-950/80 border border-slate-600 rounded-xl px-2 py-2 text-xs w-full sm:max-w-[175px]"
          >
            <option value="">Auto Best (Girl/Man)</option>
            {deviceVoices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name.slice(0, 26)} ({v.lang})
              </option>
            ))}
          </select>

          <select
            value={voiceMode}
            onChange={(e) => setVoiceMode(e.target.value as VoiceMode)}
            className="bg-slate-950/80 border border-emerald-500/50 rounded-xl px-2 py-2 text-xs w-full sm:w-auto text-emerald-200 font-semibold"
          >
            <option value="auto">Smart Auto (HD AI + Phone)</option>
            <option value="gemini">HD AI Voice (Urdu/55 Langs)</option>
            <option value="online">Online MP3 Voice</option>
            <option value="native">Phone TTS Only</option>
          </select>

          <select
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
            className="bg-slate-950/80 border border-slate-600 rounded-xl px-2 py-2 text-xs w-full sm:w-auto"
          >
            <option value={0.82}>0.8x Slow</option>
            <option value={0.96}>1.0x Normal</option>
            <option value={1.15}>1.2x Fast</option>
          </select>

          <label className="col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-2 rounded-xl border border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSpeakAi}
              onChange={(e) => setAutoSpeakAi(e.target.checked)}
              className="accent-emerald-400"
            />
            <span>Auto-Speak AI</span>
          </label>

          <button
            type="button"
            onClick={() => {
              const lm = getLocalizedMed(0);
              onSpeak(`${strings.medNameLbl} ${lm.name}. ${strings.medDoseLbl} ${lm.dose}`);
            }}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-2 rounded-xl whitespace-nowrap"
          >
            ▶ Test Voice
          </button>

          <button
            type="button"
            onClick={() => {
              const lm = getLocalizedMed(0);
              onForceOnline(`${strings.medNameLbl} ${lm.name}. ${strings.medDoseLbl} ${lm.dose}`);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-2 rounded-xl whitespace-nowrap"
          >
            🌐 Online Voice
          </button>

          <button
            type="button"
            onClick={() => {
              voiceEngine.playTone(660, 0.18);
              onNotify('Speaker test beep active — agar beep sunai di to speaker theek hai.', 'info');
            }}
            className="bg-slate-900/80 hover:bg-slate-800 border border-slate-600 px-2.5 py-2 rounded-xl font-semibold whitespace-nowrap"
          >
            🔔 Beep
          </button>

          <button
            type="button"
            onClick={onStopVoice}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl whitespace-nowrap"
          >
            <Square className="w-3 h-3" />
            Stop Voice
          </button>
        </div>

        {/* Instant Any-Text Voice Speaker */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/10">
          <input
            type="text"
            value={quickSpeakText}
            onChange={(e) => setQuickSpeakText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickSpeakText.trim()) {
                onSpeak(quickSpeakText.trim());
              }
            }}
            placeholder="Yahan koi bhi dawai ka naam ya jumla likhein aur Speak dabayein — HD aawaz mein bolega..."
            className="flex-1 bg-slate-950/85 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
          />
          <button
            type="button"
            onClick={() => {
              if (!quickSpeakText.trim()) {
                onSpeak(strings.voiceTestPhrase);
              } else {
                onSpeak(quickSpeakText.trim());
              }
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl whitespace-nowrap"
          >
            🔊 {strings.listenBtn}
          </button>
        </div>
      </section>

      {/* GOOGLE SUPER MEDICINE & PHRASE TRANSLATION SYSTEM (ALL 55 LANGUAGES) */}
      <section
        id="sec-translator"
        className="theme-surface border-2 border-emerald-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
              <Languages className="w-5 h-5 text-emerald-300" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-emerald-300">
                {strings.translatorTitle}
              </h2>
              <p className="text-[11px] text-slate-200">
                {strings.translatorSub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => runBatchMedicineTranslation(true)}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold text-xs px-3 py-1.5 rounded-xl whitespace-nowrap"
          >
            ↻ Re-Translate All 66 Meds
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {[
            'Panadol 500mg — 1 tablet after meal for fever',
            'Tab Augmentin 625mg 1 tab BD x 5 days',
            'Cap Risek 20mg before breakfast for acidity',
            'Calpol Syrup for 14 kg child fever',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => runSuperTranslator(preset)}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-slate-100 px-2.5 py-1.5 rounded-xl"
            >
              {preset.split('—')[0].slice(0, 26)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            value={superTransInput}
            onChange={(e) => setSuperTransInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSuperTranslator();
            }}
            placeholder="Dawai ka naam ya jumla likhein: e.g. 'Glucophage 500mg' ya 'Subah khali pet khayein'..."
            className="sm:col-span-6 bg-slate-950/85 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
          />
          <select
            value={superTransLang}
            onChange={(e) => setSuperTransLang(e.target.value)}
            className="sm:col-span-3 bg-slate-950/85 border border-slate-600 rounded-xl px-2.5 py-2 text-xs text-slate-100"
          >
            {langList.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => runSuperTranslator()}
            disabled={superTransBusy}
            className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl whitespace-nowrap"
          >
            {superTransBusy ? 'Translating...' : '🌐 Translate & Speak'}
          </button>
        </div>

        {superTransOut && (
          <div className="bg-slate-950/85 border border-emerald-400/50 rounded-2xl p-3.5 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-emerald-300">{superTransOut.medicineNameInLang}</strong>
              <button
                type="button"
                onClick={() =>
                  voiceEngine.speak(superTransOut.speakText, {
                    mode: voiceMode,
                    rate: voiceSpeed,
                    gender: voiceGender,
                    specificVoice,
                    lang: superTransLang,
                    skipTranslate: true,
                  })
                }
                className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold text-[11px] px-3 py-1 rounded-lg"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {strings.listenBtn} ({superTransLang.toUpperCase()})
              </button>
            </div>
            <div className="text-slate-100 leading-relaxed font-semibold">
              {superTransOut.translatedText}
            </div>
            <div className="text-amber-200 bg-amber-950/50 border border-amber-500/30 rounded-xl p-2">
              {superTransOut.usageAndDose}
            </div>
          </div>
        )}
      </section>

      {/* 66 WORLD MEDICINES GRID */}
      <section id="sec-meds" className="theme-surface border border-sky-400/45 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <h2 className="text-sm sm:text-base font-extrabold text-sky-300 flex items-center gap-2">
            <span>💊</span>
            <span>{strings.medTitle}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] bg-sky-950/80 text-sky-200 px-2 py-1 rounded-xl border border-sky-500/40 tabular-nums">
              {filteredMedicines.length} / {medicinesData.length} Medicines
            </span>
            <span className="text-[11px] bg-amber-950/80 text-amber-200 px-2 py-1 rounded-xl border border-amber-500/40">
              {medTransStatus}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-200 mb-3">{strings.medSub}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMedicines.map(({ m, idx, lm }) => {
            const isSpeaking = activeMedIdx === idx && voiceState.active;
            const url = `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${encodeURIComponent(
              m.name.split('(')[0].trim()
            )}`;
            return (
              <div
                key={m.name}
                onClick={() => speakMed(idx)}
                className={`bg-slate-950/80 border rounded-2xl p-3 flex gap-3 items-start cursor-pointer transition shadow-md ${
                  isSpeaking
                    ? 'border-sky-400 ring-2 ring-sky-400/60 bg-slate-900'
                    : 'border-slate-700 hover:border-sky-400'
                }`}
              >
                <img
                  src={makeSvgBadge(m.icon, lm.name.split(' ')[0], m.color)}
                  alt={lm.name}
                  className="w-14 h-14 rounded-xl border border-slate-600 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-bold text-sky-300">{lm.name}</h3>
                  <div className="text-[11px] text-emerald-300 font-semibold">
                    {strings.medDoseLbl} {lm.dose}
                  </div>
                  <p className="text-xs text-slate-200">{lm.use}</p>
                  <div className="text-[11px] text-amber-200 bg-amber-950/50 border border-amber-500/30 rounded-lg p-1.5">
                    ⚠️ {lm.warn}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakMed(idx);
                      }}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] px-3 py-1 rounded-lg"
                    >
                      🔊 {strings.listenBtn}
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 bg-slate-900 border border-slate-600 text-sky-300 text-[11px] px-2.5 py-1 rounded-lg"
                    >
                      🌐 {strings.onlineLabel}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RAMADAN SEHRI & IFTARI PLANNER */}
      <section
        id="sec-ramadan"
        className="theme-surface border-2 border-amber-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-amber-300">
              🌙 Ramadan Sehri &amp; Iftari Medicine, Sugar/BP/Thyrox Planner
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">
              Roze mein dawai, pani, sugar, BP aur Thyrox ki sahi timing dekhein aur voice mein sunein.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() =>
                onSpeak(
                  `${ramadanPlan.label}. Sehri: ${ramadanPlan.sehri}. Iftari: ${ramadanPlan.iftar}. Safety: ${ramadanPlan.warn}`
                )
              }
              className="bg-sky-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl"
            >
              🔊 Speak Plan
            </button>
            <button
              type="button"
              onClick={onAddRamadanAlarms}
              className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl"
            >
              <BellPlus className="w-3.5 h-3.5" />
              Set Sehri/Iftar Alarms
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {Object.entries(ramadanPlans).map(([k, plan]) => (
            <button
              key={k}
              type="button"
              onClick={() => setRamadanKey(k)}
              className={`px-2.5 py-1.5 rounded-xl border ${
                ramadanKey === k
                  ? 'bg-amber-400 text-slate-950 font-bold border-amber-300'
                  : 'bg-slate-900/75 border-slate-600 text-slate-100'
              }`}
            >
              {plan.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-950/85 border border-amber-400/40 rounded-2xl p-3.5 text-xs space-y-2">
          <div className="font-bold text-amber-300 text-sm">{ramadanPlan.label}</div>
          <div>
            <strong className="text-sky-300">🌙 Sehri Guide:</strong> {ramadanPlan.sehri}
          </div>
          <div>
            <strong className="text-emerald-300">🌅 Iftari Guide:</strong> {ramadanPlan.iftar}
          </div>
          <div className="bg-rose-950/60 border border-rose-400/40 rounded-xl p-2 text-rose-200">
            <strong>⚠️ Safety:</strong> {ramadanPlan.warn}
          </div>
        </div>
      </section>

      {/* DESI DIET & CALORIE PLATE COUNTER */}
      <section
        id="sec-diet"
        className="theme-surface border-2 border-lime-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-lime-300">
              🍲 Desi Diet, Calorie Plate Counter &amp; Sugar/BP/Uric Acid Charts
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">
              Apni bemari ke mutabiq meal chart chunein ya neeche Desi khanon par tap kar ke calories count karein:
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSpeak(dietPlan.speech)}
            className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl"
          >
            🔊 Speak Diet
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {Object.entries(dietCharts).map(([k, d]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDietKey(k)}
              className={`px-2.5 py-1.5 rounded-xl border ${
                dietKey === k
                  ? 'bg-lime-400 text-slate-950 font-bold border-lime-300'
                  : 'bg-slate-900/75 border-slate-600 text-slate-100'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-950/85 border border-lime-400/40 rounded-2xl p-3 text-xs space-y-1.5">
          <strong className="text-lime-300">{dietPlan.label}</strong>
          <p className="text-slate-200 leading-relaxed">{dietPlan.plan}</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2 text-xs">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <strong className="text-emerald-300">🍽️ Desi Thali Calorie Calculator (Tap Food to Add):</strong>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-bold px-2.5 py-1 rounded-xl tabular-nums">
                Total: {totalKcal} kcal | Carb: {totalCarbs}g
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlate([])}
                className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl text-[11px]"
              >
                ↺ Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {desiFoodsList.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPlate((prev) => [...prev, f])}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-600 px-2 py-1 rounded-xl text-[11px]"
              >
                {f[0]} <span className="text-amber-300 tabular-nums">{f[1]}kcal</span>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-300">
            {selectedPlate.length > 0
              ? selectedPlate.map((x) => x[0]).join(' + ')
              : 'Koi food add karne ke liye upar tap karein.'}
          </div>
        </div>
      </section>

      {/* WEEK-BY-WEEK PREGNANCY (W1-40) */}
      <section
        id="sec-pregnancy-weeks"
        className="theme-surface border-2 border-pink-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-pink-300">
              🤰 Week-by-Week Pregnancy (W1–W40) &amp; Baby Growth Guide
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">
              Hafta chunein (Week 1 se 40) — baby ka size, maan ki hifazat, zaroori scans aur dawai ki ehtiyat sunein.
            </p>
          </div>
          <div className="flex gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!lmpDate) {
                  onNotify('Pehle neeche Pregnancy EDD section mein LMP date select karein.', 'error');
                  return;
                }
                const wk = Math.max(
                  1,
                  Math.min(40, Math.floor((Date.now() - new Date(lmpDate).getTime()) / (7 * 86400000)))
                );
                setPregWeek(wk);
                const inf = getPregWeekInfo(wk);
                onSpeak(`Pregnancy Week ${inf.w}, ${inf.tr}. Baby size ${inf.fruit}. ${inf.dev} ${inf.care}`);
              }}
              className="bg-slate-900 border border-slate-600 px-2.5 py-1.5 rounded-xl"
            >
              📅 Sync from LMP
            </button>
            <button
              type="button"
              onClick={() =>
                onSpeak(
                  `Pregnancy Week ${pregInfo.w}, ${pregInfo.tr}. Baby size ${pregInfo.fruit}. ${pregInfo.dev} ${pregInfo.care}`
                )
              }
              className="bg-pink-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl"
            >
              🔊 Speak Week
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <strong className="text-pink-200 tabular-nums">
            Week {pregInfo.w} ({pregInfo.tr})
          </strong>
          <input
            type="range"
            min={1}
            max={40}
            value={pregWeek}
            onChange={(e) => setPregWeek(Number(e.target.value))}
            className="flex-1 min-w-[160px] accent-pink-400"
          />
          <div className="flex gap-1 text-[11px]">
            {[8, 20, 28, 36].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPregWeek(w)}
                className="bg-slate-900 border border-slate-600 px-2 py-1 rounded-lg tabular-nums"
              >
                W{w}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/85 border border-pink-400/40 rounded-2xl p-3.5 text-xs space-y-2">
          <div className="flex flex-wrap justify-between gap-2">
            <strong className="text-pink-300 text-sm">
              👶 Baby Size: {pregInfo.fruit} (~{pregInfo.len})
            </strong>
            <span className="bg-pink-500/20 text-pink-200 px-2 py-0.5 rounded-lg">{pregInfo.tr}</span>
          </div>
          <div>
            <strong>🧬 Growth:</strong> {pregInfo.dev}
          </div>
          <div className="text-emerald-200">
            <strong>💊 Mother Care &amp; Meds:</strong> {pregInfo.care}
          </div>
          <div className="text-sky-200">
            <strong>🩻 Scans &amp; Vaccines:</strong> {pregInfo.scan}
          </div>
        </div>
      </section>

      {/* NEARBY HOSPITAL, LAB & 24H PHARMACY GPS LOCATOR */}
      <section
        id="sec-nearby"
        className="theme-surface border-2 border-rose-400/50 rounded-3xl p-4 sm:p-5 space-y-3 no-print"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-rose-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              1-Tap Nearby Hospital, Lab &amp; 24h Pharmacy (GPS Map)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">{gpsStatus}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={locateGps}
              className="bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs px-3 py-2 rounded-xl whitespace-nowrap"
            >
              📡 Detect My GPS
            </button>
            <button
              type="button"
              onClick={speakNearbyPlaces}
              disabled={nearbyQuickBusy}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-3 py-2 rounded-xl whitespace-nowrap"
            >
              {nearbyQuickBusy ? 'Locating...' : '🔊 Speak Nearby Hospital & Store'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <a
            href={buildMapUrl('emergency hospital near me')}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-rose-950/70 border border-rose-400/50 hover:border-rose-300 p-3 rounded-2xl font-bold text-rose-200 flex items-center justify-between gap-2"
          >
            <span>🏥 Nearest Hospital / ER</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <a
            href={buildMapUrl('24 hour pharmacy medical store near me')}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-950/70 border border-emerald-400/50 hover:border-emerald-300 p-3 rounded-2xl font-bold text-emerald-200 flex items-center justify-between gap-2"
          >
            <span>💊 24h Medical Store</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <a
            href={buildMapUrl('diagnostic blood laboratory near me')}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-950/70 border border-sky-400/50 hover:border-sky-300 p-3 rounded-2xl font-bold text-sky-200 flex items-center justify-between gap-2"
          >
            <span>🧪 Blood Test Lab</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <a
            href={buildMapUrl('ultrasound x-ray clinic near me')}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-950/70 border border-indigo-400/50 hover:border-indigo-300 p-3 rounded-2xl font-bold text-indigo-200 flex items-center justify-between gap-2"
          >
            <span>🩻 X-Ray / Ultrasound</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        {nearbyQuickOut && (
          <div className="bg-slate-950/85 border border-rose-400/40 rounded-2xl p-3 space-y-2 text-xs">
            <div className="whitespace-pre-line text-slate-100 leading-relaxed">
              {nearbyQuickOut.summary}
            </div>
            {nearbyQuickOut.places.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {nearbyQuickOut.places.slice(0, 6).map((p, idx) => (
                  <a
                    key={idx}
                    href={p.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 border border-slate-700 hover:border-emerald-400 rounded-xl p-2 flex items-center justify-between gap-2"
                  >
                    <span className="truncate font-semibold text-white">
                      {p.name} ({p.type})
                    </span>
                    <span className="text-emerald-300 font-mono shrink-0">{p.distanceKm} km ↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* POWER CLINICAL TOOLS */}
      <section
        id="sec-power"
        className="theme-surface border-2 border-amber-400/50 rounded-3xl p-4 sm:p-5 space-y-3.5"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-amber-300" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-amber-300">
                High-Power Clinical Tools (+2,100 Extra Tools)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-200">
                Fever °C/°F, BP MAP, BMR/Water, Kidney eGFR, Lab Ranges, ORS, FAST &amp; Pain Scale.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onJumpToExtraCatalog}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-xl whitespace-nowrap"
          >
            ⚡ Open 2,100+ Power List ↓
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Temp */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-rose-300">🌡️ Fever (°C ↔ °F)</div>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.1"
                value={convTemp}
                onChange={(e) => setConvTemp(e.target.value)}
                placeholder="38.5 or 101"
                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
              />
              <button
                type="button"
                onClick={() => {
                  const v = parseFloat(convTemp);
                  if (isNaN(v)) return;
                  const txt =
                    v < 45
                      ? `${v}°C = ${((v * 9) / 5 + 32).toFixed(1)}°F (${v >= 38 ? 'Fever!' : 'Normal'})`
                      : `${v}°F = ${(((v - 32) * 5) / 9).toFixed(1)}°C (${v >= 100.4 ? 'Fever!' : 'Normal'})`;
                  setConvTempOut(txt);
                  onSpeak(txt);
                }}
                className="bg-rose-500 text-slate-950 font-bold px-3 rounded-lg"
              >
                Go
              </button>
            </div>
            <div className="text-[11px] text-slate-300 tabular-nums">{convTempOut}</div>
          </div>

          {/* BP MAP */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-cyan-300">❤️ BP MAP &amp; Pulse Pressure</div>
            <div className="flex gap-1">
              <input
                type="number"
                value={mapSys}
                onChange={(e) => setMapSys(e.target.value)}
                placeholder="Sys"
                className="w-1/2 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
              />
              <input
                type="number"
                value={mapDia}
                onChange={(e) => setMapDia(e.target.value)}
                placeholder="Dia"
                className="w-1/2 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
              />
              <button
                type="button"
                onClick={() => {
                  const s = parseFloat(mapSys);
                  const d = parseFloat(mapDia);
                  if (!s || !d) return;
                  const map = Math.round((s + 2 * d) / 3);
                  const pp = Math.round(s - d);
                  const txt = `MAP: ${map} mmHg, Pulse Pressure: ${pp}. ${
                    map < 65 ? 'Low perfusion!' : map > 105 ? 'High BP pressure!' : 'Normal range.'
                  }`;
                  setMapOut(txt);
                  onSpeak(txt);
                }}
                className="bg-cyan-500 text-slate-950 font-bold px-3 rounded-lg"
              >
                Go
              </button>
            </div>
            <div className="text-[11px] text-slate-300 tabular-nums">{mapOut}</div>
          </div>

          {/* Daily Calorie & Water */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-emerald-300">🔥 Daily Calorie &amp; Water</div>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="number"
                value={bmrKg}
                onChange={(e) => setBmrKg(e.target.value)}
                placeholder="kg"
                className="min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-1.5 py-1.5"
              />
              <input
                type="number"
                value={bmrCm}
                onChange={(e) => setBmrCm(e.target.value)}
                placeholder="cm"
                className="min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-1.5 py-1.5"
              />
              <input
                type="number"
                value={bmrAge}
                onChange={(e) => setBmrAge(e.target.value)}
                placeholder="age"
                className="min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-1.5 py-1.5"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const kg = parseFloat(bmrKg);
                const cm = parseFloat(bmrCm);
                const age = parseFloat(bmrAge);
                if (!kg || !cm || !age) return;
                const bmr = Math.round(10 * kg + 6.25 * cm - 5 * age + 5);
                const water = (kg * 0.033).toFixed(1);
                const txt = `Daily BMR: ~${bmr} kcal/day | Daily Water: ~${water} Liters`;
                setBmrOut(txt);
                onSpeak(txt);
              }}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-1.5 rounded-lg"
            >
              Calculate &amp; Speak
            </button>
            <div className="text-[11px] text-slate-300 tabular-nums">{bmrOut}</div>
          </div>

          {/* Kidney eGFR */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-amber-300">🫘 Kidney eGFR Check</div>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="number"
                step="0.1"
                value={egfrCr}
                onChange={(e) => setEgfrCr(e.target.value)}
                placeholder="Creat"
                className="min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
              />
              <input
                type="number"
                value={egfrAge}
                onChange={(e) => setEgfrAge(e.target.value)}
                placeholder="Age"
                className="min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
              />
            </div>
            <div className="flex gap-1">
              <select
                value={egfrSex}
                onChange={(e) => setEgfrSex(e.target.value)}
                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-1.5 py-1.5"
              >
                <option value="1">Male</option>
                <option value="0.742">Female</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const cr = parseFloat(egfrCr);
                  const age = parseFloat(egfrAge);
                  const sx = parseFloat(egfrSex);
                  if (!cr || !age) return;
                  const egfr = Math.round(175 * Math.pow(cr, -1.154) * Math.pow(age, -0.203) * sx);
                  const txt = `Est. eGFR: ${egfr} (${
                    egfr >= 90 ? 'Normal' : egfr >= 60 ? 'Mild drop' : 'Low — Kidney Doctor!'
                  })`;
                  setEgfrOut(txt);
                  onSpeak(txt);
                }}
                className="bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
              >
                Check
              </button>
            </div>
            <div className="text-[11px] text-slate-300 tabular-nums">{egfrOut}</div>
          </div>

          {/* Ideal Body Weight */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-sky-300">⚖️ Ideal Body Weight</div>
            <div className="flex gap-1">
              <input
                type="number"
                value={ibwCm}
                onChange={(e) => setIbwCm(e.target.value)}
                placeholder="Height cm"
                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
              />
              <button
                type="button"
                onClick={() => {
                  const cm = parseFloat(ibwCm);
                  if (!cm || cm < 100) return;
                  const m = cm / 100;
                  const txt = `Healthy Weight Range: ${Math.round(18.5 * m * m)} – ${Math.round(
                    24.9 * m * m
                  )} kg`;
                  setIbwOut(txt);
                  onSpeak(txt);
                }}
                className="bg-sky-500 text-slate-950 font-bold px-3 rounded-lg"
              >
                Go
              </button>
            </div>
            <div className="text-[11px] text-slate-300 tabular-nums">{ibwOut}</div>
          </div>

          {/* Lab Normal Ranges */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-indigo-300">🧪 Lab Normal Ranges</div>
            <select
              value={labRangeKey}
              onChange={(e) => setLabRangeKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5"
            >
              <option value="hb">Hemoglobin (Hb)</option>
              <option value="plt">Platelets (PLT)</option>
              <option value="wbc">WBC / TLC</option>
              <option value="fbs">Fasting Sugar &amp; HbA1c</option>
              <option value="cr">Creatinine &amp; Urea</option>
              <option value="alt">ALT / SGPT &amp; Bilirubin</option>
              <option value="tsh">Thyroid TSH</option>
              <option value="chol">Cholesterol &amp; Triglycerides</option>
              <option value="uric">Uric Acid</option>
              <option value="vitd">Vitamin D &amp; B12</option>
            </select>
            <div className="text-[11px] text-emerald-300 tabular-nums">{labRanges[labRangeKey]}</div>
          </div>

          {/* ORS & FAST */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-teal-300">🥤 Emergency ORS &amp; FAST</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onSpeak(
                    'Emergency ORS: 1 liter clean boiled cool water, 6 level teaspoons sugar, half level teaspoon salt. Mix well and sip slowly.'
                  )
                }
                className="bg-teal-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg"
              >
                🔊 ORS
              </button>
              <button
                type="button"
                onClick={() =>
                  onSpeak(
                    'Stroke FAST check: F Face drooping, A Arm weakness, S Speech slurred, T Time to call 1122 immediately.'
                  )
                }
                className="bg-rose-500 text-white font-bold px-2.5 py-1.5 rounded-lg"
              >
                🚨 FAST
              </button>
            </div>
            <div className="text-[11px] text-slate-300">1L Water + 6 tsp Sugar + 0.5 tsp Salt</div>
          </div>

          {/* Pain Scale */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="font-bold text-pink-300">👶 Pain Scale (1–10)</div>
            <input
              type="range"
              min={1}
              max={10}
              value={painVal}
              onChange={(e) => setPainVal(parseInt(e.target.value, 10))}
              className="w-full accent-pink-400"
            />
            <div className="text-[11px] text-pink-200 tabular-nums">
              {painVal <= 3
                ? `Pain ${painVal}/10: Mild — Rest / Paracetamol`
                : painVal <= 6
                  ? `Pain ${painVal}/10: Moderate — Doctor check & safe painkiller`
                  : `Pain ${painVal}/10: SEVERE — Seek Hospital/Doctor!`}
            </div>
          </div>
        </div>
      </section>

      {/* 2026 LIVE WORLD INTERNET SCAN */}
      <section
        id="sec-online"
        className="theme-surface border-2 border-indigo-400/50 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <h2 className="text-sm sm:text-base font-extrabold text-indigo-300 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          2026 Live World Internet Scan (Wikipedia + OpenFDA + PubMed + WHO)
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={worldInput}
            onChange={(e) => setWorldInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runLiveWorldScan();
            }}
            placeholder="Dawai ya bemari online check karein: Paracetamol, Dengue, Risek..."
            className="flex-1 bg-slate-950/80 border border-slate-600 rounded-2xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => runLiveWorldScan()}
            disabled={worldBusy}
            className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-2xl whitespace-nowrap"
          >
            {worldBusy ? 'Scanning...' : '🌐 Live Scan & Speak'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <a
            href={`https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${encodedWorld}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl text-sky-300"
          >
            🇺🇸 NIH MedlinePlus
          </a>
          <a
            href={`https://www.who.int/home/search-results?indexCatalogue=genericsearchindex1&searchQuery=${encodedWorld}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl text-emerald-300"
          >
            🌍 WHO
          </a>
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodedWorld}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl text-indigo-300"
          >
            🔬 PubMed
          </a>
          <a
            href={`https://www.nhs.uk/search/results?q=${encodedWorld}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl text-cyan-300"
          >
            🇬🇧 NHS
          </a>
          <a
            href={`https://www.drugs.com/search.php?searchterm=${encodedWorld}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl text-amber-300"
          >
            💊 Drugs.com
          </a>
        </div>

        {worldResults && (
          <div className="bg-slate-950/85 border border-indigo-400/50 rounded-2xl p-3.5 space-y-2.5 text-xs">
            {worldResults.structured && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-white">{worldResults.structured.subjectTitle}</strong>
                  <span className="text-[10px] font-bold bg-indigo-500/20 border border-indigo-400/50 text-indigo-200 px-2 py-0.5 rounded-lg">
                    {worldResults.structured.category}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-indigo-950/50 border border-indigo-400/40 rounded-xl p-2.5">
                    <strong className="text-indigo-300">🩺 Kis Liye / Purpose:</strong>
                    <p className="mt-1 text-slate-200">{worldResults.structured.purposeOrCause}</p>
                  </div>
                  <div className="bg-emerald-950/50 border border-emerald-400/40 rounded-xl p-2.5">
                    <strong className="text-emerald-300">💊 Kitni aur Kab (Dose):</strong>
                    <p className="mt-1 text-slate-200">{worldResults.structured.dosageAndUsage}</p>
                  </div>
                  <div className="bg-sky-950/50 border border-sky-400/40 rounded-xl p-2.5">
                    <strong className="text-sky-300">🌿 Ilaj &amp; Care:</strong>
                    <p className="mt-1 text-slate-200">{worldResults.structured.treatmentAndCare}</p>
                  </div>
                  <div className="bg-rose-950/50 border border-rose-400/40 rounded-xl p-2.5">
                    <strong className="text-rose-300">⚠️ Ehtiyat:</strong>
                    <p className="mt-1 text-rose-100">{worldResults.structured.warnings}</p>
                  </div>
                </div>
              </div>
            )}
            {worldResults.localMed && (
              <div className="bg-emerald-950/60 border border-emerald-400/40 rounded-xl p-2.5">
                <strong>💊 66-Med Local Match:</strong> {worldResults.localMed}
              </div>
            )}
            {worldResults.sources && worldResults.sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {worldResults.sources.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 border border-slate-600 text-sky-300 px-2.5 py-1 rounded-xl inline-flex items-center gap-1"
                  >
                    <span>{s.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
            {worldResults.spoken && (
              <button
                type="button"
                onClick={() => onSpeak(worldResults.spoken!, worldResults.skipTranslate)}
                className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg"
              >
                🔊 Speak Summary
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
