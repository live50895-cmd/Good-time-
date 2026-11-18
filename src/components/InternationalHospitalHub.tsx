import React, { useMemo, useState } from 'react';
import {
  Activity,
  Camera,
  ExternalLink,
  FileText,
  Globe,
  HeartPulse,
  Hospital,
  MapPin,
  Navigation,
  Pill,
  Search,
  Sparkles,
  Stethoscope,
  Volume2,
} from 'lucide-react';
import { decodeParchiAndLabs } from '../data/healthData';
import { I18nStrings } from '../data/themesAndLangs';
import {
  GroundedSource,
  NearbyCareResult,
  OnlineSearchResult,
  ScheduleMed,
  VisionScanResult,
} from '../types/health';
import { compressImageFile } from '../utils/qrAndStorage';
import {
  browserStaticNearbyCare,
  browserStaticOnlineSearch,
} from '../services/staticMedicalFallback';

interface InternationalHospitalHubProps {
  currentLang: string;
  langDisplayName: string;
  strings: I18nStrings;
  profileContext: string;
  medSchedule: ScheduleMed[];
  externalQuery?: string;
  onSpeak: (txt: string, skipTranslate?: boolean) => void;
  onSaveToAi: (txt: string) => void;
  onJumpToGoogleDocs: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

type HubTab = 'search' | 'report' | 'nearby' | 'quick';
type ReportScanType = 'medicine' | 'xray' | 'ultrasound' | 'bp_report';
type NearbyCat = 'all' | 'hospital' | 'pharmacy' | 'lab' | 'imaging';

const QUICK_SEARCH_CHIPS = [
  'Panadol (Paracetamol)',
  'Augmentin 625mg',
  'Risek 40mg',
  'Blood Pressure 150/95',
  'Sugar / Diabetes Diet & Meds',
  'Bukhar aur Sar Dard',
  'Kidney Stone Pain & Care',
  'Cough & Throat Infection',
];

const QUICK_CARE_CARDS: Array<{
  icon: string;
  title: string;
  sub: string;
  query: string;
  tone: string;
}> = [
  {
    icon: '🌡️',
    title: 'Bukhar / Fever',
    sub: 'Kis liye, Paracetamol dose & sponging',
    query: 'Fever Bukhar treatment and Paracetamol Panadol dosage for adult and child',
    tone: 'border-rose-400/50 bg-rose-950/50',
  },
  {
    icon: '🤕',
    title: 'Sar Dard / Migraine',
    sub: 'Migraine, tension headache & warning signs',
    query: 'Headache Sar Dard Migraine medicine dose and home care',
    tone: 'border-amber-400/50 bg-amber-950/50',
  },
  {
    icon: '❤️',
    title: 'BP High / Low',
    sub: 'Emergency numbers, diet & safe control',
    query: 'High Blood Pressure Hypertension medicines, salt limit and emergency steps',
    tone: 'border-red-400/50 bg-red-950/50',
  },
  {
    icon: '🩸',
    title: 'Sugar / Diabetes',
    sub: 'Fasting, HbA1c, Metformin & low sugar help',
    query: 'Diabetes Blood Sugar treatment Metformin Glucophage diet and hypoglycemia care',
    tone: 'border-sky-400/50 bg-sky-950/50',
  },
  {
    icon: '🤢',
    title: 'Pait / Gas / Acidity',
    sub: 'Risek/Gaviscon timing, ulcers & ORS',
    query: 'Stomach acidity gas ulcer treatment Omeprazole Risek dose and diet',
    tone: 'border-emerald-400/50 bg-emerald-950/50',
  },
  {
    icon: '🫁',
    title: 'Khansi / Flu / Gala',
    sub: 'Sore throat, steam, cough syrup & antibiotics',
    query: 'Cough flu sore throat treatment Arinac Azithromycin or syrup guidance',
    tone: 'border-cyan-400/50 bg-cyan-950/50',
  },
  {
    icon: '🦴',
    title: 'Jodon / Kamar Dard',
    sub: 'Arthritis, Uric Acid, Vit D & safe painkillers',
    query: 'Joint knee and back pain uric acid Vitamin D treatment and safe medicine',
    tone: 'border-indigo-400/50 bg-indigo-950/50',
  },
  {
    icon: '👶',
    title: 'Child Care & ORS',
    sub: 'Weight-based syrup, dehydration & fever watch',
    query: 'Child fever Calpol weight dose and WHO ORS dehydration treatment',
    tone: 'border-teal-400/50 bg-teal-950/50',
  },
];

const QUICK_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Multan',
  'Faisalabad',
  'Riyadh',
  'Dubai',
];

export const InternationalHospitalHub: React.FC<InternationalHospitalHubProps> = ({
  currentLang,
  langDisplayName,
  strings,
  profileContext,
  medSchedule,
  externalQuery,
  onSpeak,
  onSaveToAi,
  onJumpToGoogleDocs,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('search');

  // Tab 1: Online Med & Disease Search
  const [searchInput, setSearchInput] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<OnlineSearchResult | null>(null);
  const [searchSources, setSearchSources] = useState<GroundedSource[]>([]);

  // Tab 2: Photo Scan + 100+ Lab/BP/X-Ray Checker
  const [reportScanType, setReportScanType] = useState<ReportScanType>('bp_report');
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string>('');
  const [reportScanning, setReportScanning] = useState<boolean>(false);
  const [reportVisionResult, setReportVisionResult] = useState<VisionScanResult | null>(null);
  const [reportText, setReportText] = useState<string>('');
  const [quickSys, setQuickSys] = useState<string>('');
  const [quickDia, setQuickDia] = useState<string>('');
  const [quickSugar, setQuickSugar] = useState<string>('');
  const [labLines, setLabLines] = useState<string[]>([]);
  const [labSpoken, setLabSpoken] = useState<string>('');
  const [deepReportBusy, setDeepReportBusy] = useState<boolean>(false);

  // Tab 3: Nearby Care (Hospitals, Medical Stores, Labs, Imaging)
  const [nearbyCat, setNearbyCat] = useState<NearbyCat>('all');
  const [cityQuery, setCityQuery] = useState<string>('');
  const [nearbyBusy, setNearbyBusy] = useState<boolean>(false);
  const [nearbyResult, setNearbyResult] = useState<NearbyCareResult | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('');

  const runOnlineSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchInput).trim();
    if (!q) {
      onNotify('Kisi dawai ka naam ya marz / problem likhein.', 'error');
      return;
    }
    if (overrideQuery) setSearchInput(overrideQuery);
    setActiveTab('search');
    setSearching(true);
    setSearchResult(null);
    setSearchSources([]);

    try {
      const res = await fetch('/api/ai/online-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          targetLangCode: currentLang,
          targetLangName: langDisplayName,
          profileContext,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        result?: OnlineSearchResult;
        sources?: GroundedSource[];
        offlineFallback?: boolean;
        error?: string;
      };

      if (res.ok && json.result) {
        setSearchResult(json.result);
        setSearchSources(json.sources || []);
        const summaryBlock = `🏥 ${json.result.subjectTitle} [${json.result.category}]\n• Purpose: ${json.result.purposeOrCause}\n• Dosage: ${json.result.dosageAndUsage}\n• Care: ${json.result.treatmentAndCare}\n• Warnings: ${json.result.warnings}`;
        onSaveToAi(summaryBlock);
        onSpeak(json.result.speakSummary || json.result.purposeOrCause, !json.offlineFallback);
        onNotify(`${json.result.subjectTitle} ready!`, 'success');
        setSearching(false);
        return;
      }
    } catch {
      // fall through to resilient offline fallback
    }

    // Graceful Static-Host / Offline Fallback (Direct OpenFDA + Wiki + PubMed + 66 Medicines)
    const staticOut = await browserStaticOnlineSearch(q);
    setSearchResult(staticOut.result);
    setSearchSources(staticOut.sources);
    onSpeak(staticOut.result.speakSummary, false);
    setSearching(false);
  };

  // Sync external queries triggered from App global search if provided
  React.useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      runOnlineSearch(externalQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  // Tab 2: Photo Upload (X-Ray, Ultrasound, BP/Lab Report, Medicine Strip)
  const handleReportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    setReportScanning(true);
    setReportVisionResult(null);

    compressImageFile(f, 1024, 0.84, async (dataUrl) => {
      setReportPreviewUrl(dataUrl);
      try {
        const res = await fetch('/api/ai/vision-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            scanType: reportScanType,
            languageName: langDisplayName,
            activeMeds: medSchedule.map((m) => m.name),
            profileContext,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          scan?: VisionScanResult;
          error?: string;
        };
        if (res.ok && json.scan) {
          setReportVisionResult(json.scan);
          onSaveToAi(
            `🩻 ${reportScanType.toUpperCase()} — ${json.scan.title} [${json.scan.verdict}]\n${json.scan.findings.join('\n')}\nAdvice: ${json.scan.recommendation}`
          );
          onSpeak(json.scan.speakSummary || json.scan.recommendation, true);
          onNotify(`${json.scan.title} checked!`, 'success');
        } else {
          onNotify(json.error || 'Vision AI scan unavailable right now.', 'error');
        }
      } catch {
        onNotify('Network error during report photo scan.', 'error');
      } finally {
        setReportScanning(false);
      }
    });
  };

  // Tab 2: Instant 100+ Real Lab/BP/X-Ray Decoder
  const runHundredPlusCheck = (overrideText?: string) => {
    const extraParts: string[] = [];
    if (quickSys.trim() && quickDia.trim()) extraParts.push(`BP: ${quickSys.trim()}/${quickDia.trim()}`);
    if (quickSugar.trim()) extraParts.push(`Sugar: ${quickSugar.trim()}`);
    const combined = [overrideText ?? reportText, ...extraParts].filter(Boolean).join('\n').trim();
    if (!combined) {
      onNotify('Report values, BP ya X-Ray/Ultrasound text likhein.', 'error');
      return;
    }
    if (overrideText !== undefined) setReportText(overrideText);

    const decoded = decodeParchiAndLabs(combined);
    setLabLines(decoded.lines);
    setLabSpoken(decoded.spokenText);
    onSaveToAi(`🧪 100+ Lab/BP Check:\n${decoded.lines.join('\n')}`);
    onSpeak(decoded.spokenText, false);
  };

  const runDeepAiReportCheck = async () => {
    const extraParts: string[] = [];
    if (quickSys.trim() && quickDia.trim()) extraParts.push(`BP: ${quickSys.trim()}/${quickDia.trim()}`);
    if (quickSugar.trim()) extraParts.push(`Sugar: ${quickSugar.trim()}`);
    const combined = [reportText, ...extraParts].filter(Boolean).join('\n').trim();
    if (!combined) {
      onNotify('Pehle koi BP, Sugar, X-Ray ya Lab value likhein.', 'error');
      return;
    }
    setDeepReportBusy(true);
    try {
      const res = await fetch('/api/ai/online-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Explain these medical report / lab / X-Ray / Ultrasound / Blood Pressure results for a patient: ${combined}`,
          targetLangCode: currentLang,
          targetLangName: langDisplayName,
          profileContext,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        result?: OnlineSearchResult;
        sources?: GroundedSource[];
      };
      if (res.ok && json.result) {
        setSearchResult(json.result);
        setSearchSources(json.sources || []);
        setActiveTab('search');
        onSpeak(json.result.speakSummary, true);
        onNotify('Full report AI explanation ready!', 'success');
      } else {
        onNotify('Offline 100+ check shown below.', 'info');
      }
    } catch {
      onNotify('Network error calling AI report explainer.', 'error');
    } finally {
      setDeepReportBusy(false);
    }
  };

  // Tab 3: Live Nearby Hospital, 24h Medical Store, Lab & Imaging Finder
  const fetchNearbyCare = async (opts: { lat?: number; lng?: number; city?: string; cat?: NearbyCat }) => {
    setNearbyBusy(true);
    const cat = opts.cat ?? nearbyCat;
    try {
      const res = await fetch('/api/ai/nearby-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: opts.lat,
          lng: opts.lng,
          cityQuery: opts.city ?? cityQuery,
          category: cat,
          targetLangCode: currentLang,
          targetLangName: langDisplayName,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as NearbyCareResult & {
        error?: string;
        offlineFallback?: boolean;
      };
      if (res.ok && json.summary) {
        setNearbyResult(json);
        onSaveToAi(`📍 Nearby Medical Care (${cat.toUpperCase()}):\n${json.summary}`);
        onSpeak(json.speakSummary || json.summary, !json.offlineFallback);
        onNotify('Nearby hospitals, medical stores & labs ready!', 'success');
        setNearbyBusy(false);
        return;
      }
    } catch {
      // fall through to browser-direct Photon/OpenStreetMap fallback for static builds
    }

    try {
      const directRes = await browserStaticNearbyCare({
        lat: opts.lat,
        lng: opts.lng,
        cityQuery: opts.city ?? cityQuery,
        category: cat,
      });
      setNearbyResult(directRes);
      onSaveToAi(`📍 Nearby Medical Care (${cat.toUpperCase()}):\n${directRes.summary}`);
      onSpeak(directRes.speakSummary || directRes.summary, false);
      onNotify('Nearby hospitals, medical stores & labs ready!', 'success');
    } catch {
      onNotify('Could not load nearby locations.', 'error');
    } finally {
      setNearbyBusy(false);
    }
  };

  const resolveIpAndFetchNearby = async (cat: NearbyCat) => {
    if (cityQuery.trim()) {
      setGpsStatus(`📍 Searching "${cityQuery.trim()}" for Hospitals, Medical Stores, Labs & X-Ray...`);
      await fetchNearbyCare({ city: cityQuery.trim(), cat });
      return;
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch('https://ipwho.is/', { signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) {
        const ipData = (await r.json()) as {
          success?: boolean;
          city?: string;
          country?: string;
          latitude?: number;
          longitude?: number;
        };
        if (ipData.success && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
          const areaLabel = [ipData.city, ipData.country].filter(Boolean).join(', ');
          if (areaLabel) setCityQuery(areaLabel);
          setGpsStatus(`📡 Detected Area: ${areaLabel || 'Your City'} — Fetching Hospitals, Medical Stores & Labs...`);
          await fetchNearbyCare({ lat: ipData.latitude, lng: ipData.longitude, city: areaLabel, cat });
          return;
        }
      }
    } catch {
      // fall through
    }
    setGpsStatus('GPS permission blocked — showing quick Hospital, Medical Store & Lab finder.');
    await fetchNearbyCare({ city: 'Lahore Pakistan', cat });
  };

  const detectGpsAndSpeakNearby = (overrideCat?: NearbyCat) => {
    const cat = overrideCat ?? nearbyCat;
    if (overrideCat) setNearbyCat(overrideCat);
    if (!navigator.geolocation) {
      resolveIpAndFetchNearby(cat);
      return;
    }
    setGpsStatus('📡 Live GPS location li ja rahi hai...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsStatus(`✅ GPS Ready (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        fetchNearbyCare({ lat, lng, cat });
      },
      () => {
        resolveIpAndFetchNearby(cat);
      },
      { timeout: 6000 }
    );
  };

  const quickMapLinks = useMemo(() => {
    const c = nearbyResult?.coords;
    const tail = cityQuery.trim() ? ` in ${cityQuery.trim()}` : ' near me';
    const makeUrl = (term: string) =>
      c
        ? `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${c.lat},${c.lng},14z`
        : `https://www.google.com/maps/search/${encodeURIComponent(term + tail)}`;
    return [
      { label: '🏥 Nearest Hospital / ER', url: makeUrl('emergency hospital') },
      { label: '💊 24h Medical Store', url: makeUrl('24 hour pharmacy medical store') },
      { label: '🧪 Blood Test Lab', url: makeUrl('diagnostic blood laboratory') },
      { label: '🩻 X-Ray & Ultrasound', url: makeUrl('ultrasound x-ray center') },
    ];
  }, [nearbyResult, cityQuery]);

  return (
    <section
      id="sec-hospital-hub"
      className="theme-surface border-2 border-emerald-400/65 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl"
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
            <Hospital className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-emerald-300 flex flex-wrap items-center gap-2">
              <span>{strings.hubTitle}</span>
              <span className="text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 px-2 py-0.5 rounded-lg">
                100+ CHECKS • VOICE {langDisplayName}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200 mt-0.5">{strings.hubSub}</p>
          </div>
        </div>
      </div>

      {/* 4 Large Patient-Friendly Hub Mode Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-extrabold border transition ${
            activeTab === 'search'
              ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow-lg'
              : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="truncate">{strings.hubTabSearch}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-extrabold border transition ${
            activeTab === 'report'
              ? 'bg-sky-400 text-slate-950 border-sky-200 shadow-lg'
              : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span className="truncate">{strings.hubTabReport}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nearby')}
          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-extrabold border transition ${
            activeTab === 'nearby'
              ? 'bg-rose-400 text-slate-950 border-rose-200 shadow-lg'
              : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{strings.hubTabNearby}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quick')}
          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-extrabold border transition ${
            activeTab === 'quick'
              ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-lg'
              : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <HeartPulse className="w-4 h-4 shrink-0" />
          <span className="truncate">{strings.hubTabQuick}</span>
        </button>
      </div>

      {/* TAB 1: ONLINE MEDICINE / DISEASE SEARCH */}
      {activeTab === 'search' && (
        <div className="bg-slate-950/85 border border-emerald-400/40 rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runOnlineSearch();
                }}
                placeholder="Kisi bhi dawai ka naam ya marz/problem likhein (e.g. Panadol, Risek, Sugar, BP, Bukhar)..."
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-2xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-300"
              />
            </div>
            <button
              type="button"
              onClick={() => runOnlineSearch()}
              disabled={searching}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl whitespace-nowrap inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {searching ? 'Checking Online...' : strings.hubSearchBtn}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {QUICK_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => runOnlineSearch(chip)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-slate-200 px-2.5 py-1.5 rounded-xl transition"
              >
                🔍 {chip}
              </button>
            ))}
          </div>

          {searchResult && (
            <div className="bg-slate-900/90 border border-emerald-400/50 rounded-2xl p-3.5 sm:p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    {searchResult.category} • {langDisplayName}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    {searchResult.subjectTitle}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSpeak(searchResult.speakSummary || searchResult.purposeOrCause, true)}
                    className="inline-flex items-center gap-1 bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {strings.listenBtn}
                  </button>
                  <button
                    type="button"
                    onClick={onJumpToGoogleDocs}
                    className="inline-flex items-center gap-1 bg-slate-800 border border-sky-400/50 text-sky-200 font-bold px-3 py-1.5 rounded-xl"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Google Docs
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="bg-slate-950/90 border border-sky-500/40 rounded-xl p-3 space-y-1">
                  <div className="font-extrabold text-sky-300">🩺 Kis Liye / Kis Marz Ki Hai (Purpose):</div>
                  <p className="text-slate-100 leading-relaxed">{searchResult.purposeOrCause}</p>
                </div>
                <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-3 space-y-1">
                  <div className="font-extrabold text-emerald-300">💊 Kitni Aur Kab Use Karein (Dosage):</div>
                  <p className="text-slate-100 leading-relaxed">{searchResult.dosageAndUsage}</p>
                </div>
                <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-3 space-y-1">
                  <div className="font-extrabold text-indigo-300">🌿 Ilaj Ka Tareeqa &amp; Care:</div>
                  <p className="text-slate-100 leading-relaxed">{searchResult.treatmentAndCare}</p>
                </div>
                <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 space-y-1">
                  <div className="font-extrabold text-rose-300">⚠️ Ehtiyat &amp; Red-Flag Warnings:</div>
                  <p className="text-rose-100 leading-relaxed">{searchResult.warnings}</p>
                </div>
              </div>

              {searchResult.checkedMarkers?.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-2.5">
                  <div className="text-[11px] font-bold text-amber-300 mb-1">
                    ✅ Checked Clinical Facts &amp; Markers:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-200">
                    {searchResult.checkedMarkers.map((m, i) => (
                      <div key={i}>• {m}</div>
                    ))}
                  </div>
                </div>
              )}

              {searchSources.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                  <span className="text-slate-400 font-semibold">Verified Links:</span>
                  {searchSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-300 px-2.5 py-1 rounded-xl"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: X-RAY / ULTRASOUND / BP / 100+ LAB REPORT SCANNER */}
      {activeTab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 text-xs">
          {/* Left: Photo Upload (X-Ray / Ultrasound / BP / Medicine Strip) */}
          <div className="lg:col-span-6 bg-slate-950/85 border border-sky-400/40 rounded-2xl p-3.5 space-y-3">
            <div className="font-extrabold text-sky-300 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photo Upload Checker (X-Ray, Ultrasound, BP, Lab, Dawai)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              {(
                [
                  ['bp_report', '🩺 BP / Lab'],
                  ['xray', '🩻 X-Ray / CT'],
                  ['ultrasound', '📡 Ultrasound'],
                  ['medicine', '💊 Dawai Photo'],
                ] as Array<[ReportScanType, string]>
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setReportScanType(mode)}
                  className={`px-2 py-2 rounded-xl font-bold border transition ${
                    reportScanType === mode
                      ? 'bg-sky-400 text-slate-950 border-sky-200'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-700 rounded-xl p-3">
              <div className="flex-1 min-w-0 text-[11px] text-slate-300">
                {reportScanType === 'xray' && 'X-Ray ya CT film ki saaf roshni mein photo upload karein.'}
                {reportScanType === 'ultrasound' && 'Ultrasound / Echo report ya film ki photo upload karein.'}
                {reportScanType === 'bp_report' && 'BP monitor, glucometer ya 100+ lab test report ki photo upload karein.'}
                {reportScanType === 'medicine' && 'Dawai ki patti ya bottle upload karein — naam, kaam aur dose sunein.'}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black px-3.5 py-2.5 rounded-xl shrink-0">
                <Camera className="w-4 h-4" />
                {reportScanning ? 'Scanning...' : strings.hubUploadBtn}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReportImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {(reportPreviewUrl || reportVisionResult) && (
              <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3 space-y-2.5">
                {reportPreviewUrl && (
                  <img
                    src={reportPreviewUrl}
                    alt="Uploaded medical scan"
                    className="w-full max-h-48 object-contain rounded-xl border border-slate-600 bg-black/50"
                  />
                )}
                {reportScanning && (
                  <div className="text-sky-300 font-bold animate-pulse">
                    Analyzing image &amp; extracting 100+ clinical markers in {langDisplayName}...
                  </div>
                )}
                {reportVisionResult && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-white">{reportVisionResult.title}</strong>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-extrabold text-[11px] border ${
                          /HARAM|AVOID|URGENT/i.test(reportVisionResult.verdict)
                            ? 'bg-rose-950 text-rose-200 border-rose-400'
                            : /CAUTION|ABNORMAL/i.test(reportVisionResult.verdict)
                              ? 'bg-amber-950 text-amber-200 border-amber-400'
                              : 'bg-emerald-950 text-emerald-200 border-emerald-400'
                        }`}
                      >
                        {reportVisionResult.verdict}
                      </span>
                    </div>
                    {reportVisionResult.metrics?.length > 0 && (
                      <div className="text-[11px] text-sky-200 font-mono">
                        {reportVisionResult.metrics.join(' · ')}
                      </div>
                    )}
                    <div className="space-y-1 text-slate-200">
                      {reportVisionResult.findings.map((f, idx) => (
                        <div key={idx}>• {f}</div>
                      ))}
                    </div>
                    <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-2.5 text-emerald-200">
                      <strong>Advice:</strong> {reportVisionResult.recommendation}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSpeak(reportVisionResult.speakSummary, true)}
                        className="inline-flex items-center gap-1 bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {strings.listenBtn}
                      </button>
                      <button
                        type="button"
                        onClick={onJumpToGoogleDocs}
                        className="inline-flex items-center gap-1 bg-slate-800 border border-sky-400/50 text-sky-200 font-semibold px-3 py-1.5 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Save in Docs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: 100+ Real Biomarker, BP & Text Report Analyzer */}
          <div className="lg:col-span-6 bg-slate-950/85 border border-emerald-400/40 rounded-2xl p-3.5 space-y-3">
            <div className="font-extrabold text-emerald-300 text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              100+ Real Lab, Blood Pressure &amp; X-Ray Report Analyzer
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={quickSys}
                onChange={(e) => setQuickSys(e.target.value)}
                placeholder="BP Upar (120)"
                className="bg-slate-900 border border-slate-600 rounded-xl px-2.5 py-2 text-white"
              />
              <input
                type="number"
                value={quickDia}
                onChange={(e) => setQuickDia(e.target.value)}
                placeholder="BP Neeche (80)"
                className="bg-slate-900 border border-slate-600 rounded-xl px-2.5 py-2 text-white"
              />
              <input
                type="number"
                value={quickSugar}
                onChange={(e) => setQuickSugar(e.target.value)}
                placeholder="Sugar (mg/dL)"
                className="bg-slate-900 border border-slate-600 rounded-xl px-2.5 py-2 text-white"
              />
            </div>

            <textarea
              rows={3}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Lab report ya parchi type/paste karein (e.g. Hb 9.5, PLT 85, ALT 88, Creat 1.6, TSH 6.8, Fatty liver, Dengue NS1 positive, BD, Risek)..."
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-400"
            />

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => runHundredPlusCheck()}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-3.5 py-2 rounded-xl"
              >
                ✅ 100+ Real Check &amp; Speak
              </button>
              <button
                type="button"
                onClick={runDeepAiReportCheck}
                disabled={deepReportBusy}
                className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black px-3.5 py-2 rounded-xl"
              >
                {deepReportBusy ? 'Analyzing...' : '🤖 AI Explain Full Report'}
              </button>
              <button
                type="button"
                onClick={() =>
                  runHundredPlusCheck(
                    'BP: 155/95, Sugar: 215, HbA1c: 7.9, Hb: 10.2, PLT: 110, WBC: 12500, Creatinine: 1.5, ALT: 74, Cholesterol: 235, Uric Acid: 8.1, TSH: 5.9, Vit D: 16'
                  )
                }
                className="bg-slate-900 border border-slate-600 text-amber-300 px-2.5 py-2 rounded-xl"
              >
                📊 Sample 12-Test Report
              </button>
            </div>

            {labLines.length > 0 && (
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 space-y-1.5 max-h-60 overflow-y-auto">
                {labLines.map((line, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-line ${
                      line.includes('🔴')
                        ? 'text-rose-300 font-bold'
                        : line.includes('🟡')
                          ? 'text-amber-200'
                          : 'text-emerald-200'
                    }`}
                  >
                    {line}
                  </div>
                ))}
                {labSpoken && (
                  <button
                    type="button"
                    onClick={() => onSpeak(labSpoken, false)}
                    className="mt-2 inline-flex items-center gap-1 bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {strings.listenBtn}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE NEARBY HOSPITAL, 24H MEDICAL STORE & LAB FINDER */}
      {activeTab === 'nearby' && (
        <div className="bg-slate-950/85 border border-rose-400/45 rounded-2xl p-3.5 sm:p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-rose-300 flex items-center gap-1.5">
                <Navigation className="w-4 h-4" />
                Live Hospital, 24h Medical Store, Blood Lab &amp; X-Ray Finder (Spoken in {langDisplayName})
              </h3>
              {gpsStatus && <p className="text-[11px] text-emerald-300 mt-0.5">{gpsStatus}</p>}
            </div>
            <button
              type="button"
              onClick={() => detectGpsAndSpeakNearby()}
              disabled={nearbyBusy}
              className="bg-rose-500 hover:bg-rose-400 text-white font-black px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              {nearbyBusy ? 'Locating...' : strings.hubNearbyBtn}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {(
              [
                ['all', '🏥 All Nearby'],
                ['hospital', '🚑 Hospitals / ER'],
                ['pharmacy', '💊 Medical Stores'],
                ['lab', '🧪 Blood Labs'],
                ['imaging', '🩻 X-Ray / Ultrasound'],
              ] as Array<[NearbyCat, string]>
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setNearbyCat(cat);
                  if (nearbyResult?.coords) {
                    fetchNearbyCare({ lat: nearbyResult.coords.lat, lng: nearbyResult.coords.lng, cat });
                  } else if (cityQuery.trim()) {
                    fetchNearbyCare({ city: cityQuery.trim(), cat });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border ${
                  nearbyCat === cat
                    ? 'bg-rose-400 text-slate-950 border-rose-200'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cityQuery.trim()) fetchNearbyCare({ city: cityQuery });
              }}
              placeholder="Ya apna Sheher / Area likhein (e.g. Gulberg Lahore, Saddar Karachi, G-10 Islamabad, Makkah)..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-400"
            />
            <button
              type="button"
              onClick={() => fetchNearbyCare({ city: cityQuery.trim() || 'Lahore Pakistan' })}
              disabled={nearbyBusy}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-4 py-2.5 rounded-xl whitespace-nowrap"
            >
              🔎 Search City &amp; Speak
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {QUICK_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCityQuery(c);
                  fetchNearbyCare({ city: c });
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg"
              >
                📍 {c}
              </button>
            ))}
          </div>

          {/* 1-Tap Direct Google Maps Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickMapLinks.map((lnk) => (
              <a
                key={lnk.label}
                href={lnk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900/90 hover:bg-slate-800 border border-rose-400/40 p-2.5 rounded-xl font-bold text-rose-200 flex items-center justify-between gap-1.5"
              >
                <span className="truncate">{lnk.label}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ))}
          </div>

          {nearbyResult && (
            <div className="bg-slate-900/90 border border-rose-400/50 rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-emerald-300">🔊 Spoken Nearby Summary ({langDisplayName}):</strong>
                <button
                  type="button"
                  onClick={() =>
                    onSpeak(
                      nearbyResult.speakSummary || nearbyResult.summary,
                      !(nearbyResult as NearbyCareResult & { offlineFallback?: boolean }).offlineFallback
                    )
                  }
                  className="inline-flex items-center gap-1 bg-sky-400 text-slate-950 font-bold px-3 py-1 rounded-lg"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Speak Again
                </button>
              </div>
              <div className="whitespace-pre-line text-slate-100 leading-relaxed bg-slate-950/80 border border-slate-700 rounded-xl p-3">
                {nearbyResult.summary}
              </div>

              {nearbyResult.places.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nearbyResult.places.map((p, idx) => {
                    const badgeStyle = /pharmacy|store/i.test(p.type)
                      ? 'text-emerald-300 border-emerald-500/45 bg-emerald-950/40'
                      : /lab/i.test(p.type)
                        ? 'text-sky-300 border-sky-500/45 bg-sky-950/40'
                        : /ray|ultrasound|clinic/i.test(p.type)
                          ? 'text-indigo-300 border-indigo-500/45 bg-indigo-950/40'
                          : 'text-rose-300 border-rose-500/45 bg-rose-950/40';
                    return (
                      <a
                        key={idx}
                        href={p.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-950/90 hover:border-emerald-400 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2 transition"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-white truncate">{p.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className={`px-1.5 py-0.5 rounded border font-semibold ${badgeStyle}`}>
                              {p.type}
                            </span>
                            <span className="text-slate-300 truncate">{p.address}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-lg shrink-0">
                          {p.distanceKm} km ↗
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}

              {nearbyResult.mapSources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold">Google Maps Links:</span>
                  {nearbyResult.mapSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-slate-800 border border-sky-400/40 text-sky-300 px-2.5 py-1 rounded-xl"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 1-TAP EASY PATIENT CARE CARDS */}
      {activeTab === 'quick' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {QUICK_CARE_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => runOnlineSearch(card.query)}
              className={`text-left border rounded-2xl p-3.5 transition hover:scale-[1.02] space-y-1.5 ${card.tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-[10px] font-bold bg-black/40 text-white px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                  <Pill className="w-3 h-3" />
                  1-Tap Voice
                </span>
              </div>
              <div className="font-black text-sm text-white">{card.title}</div>
              <div className="text-[11px] text-slate-200 leading-snug">{card.sub}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
