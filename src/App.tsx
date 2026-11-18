import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Palette,
  Printer,
  Search,
  Sparkles,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { AiAndParchiSection } from './components/AiAndParchiSection';
import { AnatomyAndVitalsSection } from './components/AnatomyAndVitalsSection';
import { ClinicalToolsAndGuides } from './components/ClinicalToolsAndGuides';
import { GoogleDocsPanel } from './components/GoogleDocsPanel';
import {
  bodyAnatomyData,
  catalogItems,
  diseasesData,
  extraBrandKnowledge,
  medicinesData,
  scanOpBabyGuides,
} from './data/healthData';
import {
  EMBEDDED_BABY_KAABA_SVG,
  i18n,
  langList,
  makeThemeIconSvg,
  rtlLangs,
  themes50,
  WHATSAPP_NUM,
} from './data/themesAndLangs';
import { voiceEngine, VoiceGender, VoiceMode } from './services/voiceEngine';
import {
  ProfileId,
  ScheduleMed,
  SmartAlarm,
  VitalRecord,
  VoiceState,
} from './types/health';
import {
  compressImageFile,
  pKey,
  readStorageJson,
  writeStorageJson,
} from './utils/qrAndStorage';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}

export default function App() {
  // Core App Settings
  const [themeIdx, setThemeIdx] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('selected_theme_idx') || '0', 10);
    return !isNaN(saved) && themes50[saved] ? saved : 0;
  });
  const [themesOpen, setThemesOpen] = useState<boolean>(false);
  const [bgDim, setBgDim] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('bg_opacity') || '62', 10);
    return !isNaN(saved) ? saved : 62;
  });
  const [customBgUrl, setCustomBgUrl] = useState<string>(
    () => localStorage.getItem('custom_bg_image') || EMBEDDED_BABY_KAABA_SVG
  );
  const [pinCustomIcon, setPinCustomIcon] = useState<boolean>(
    () => localStorage.getItem('pin_custom_icon') === '1'
  );
  const [customIconUrl, setCustomIconUrl] = useState<string>(
    () => localStorage.getItem('custom_app_icon') || ''
  );

  const [profile, setProfile] = useState<ProfileId>('self');
  const [currentLang, setCurrentLang] = useState<string>('ur');
  const [bigFont, setBigFont] = useState<boolean>(
    () => localStorage.getItem('big_font_mode') === '1'
  );
  const [sunMode, setSunMode] = useState<boolean>(
    () => localStorage.getItem('sun_mode') === '1'
  );

  // Voice Preferences & Live State
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(
    () => (localStorage.getItem('voice_gender') as VoiceGender) || 'female'
  );
  const [specificVoice, setSpecificVoice] = useState<string>(
    () => localStorage.getItem('specific_voice_name') || ''
  );
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(
    () => (localStorage.getItem('voice_mode') as VoiceMode) || 'auto'
  );
  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    const s = parseFloat(localStorage.getItem('voice_speed') || '0.96');
    return !isNaN(s) ? s : 0.96;
  });
  const [autoSpeakAi, setAutoSpeakAi] = useState<boolean>(true);
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceEngine.state);

  // Global Search & Cross-Section Bridges
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [lastAiText, setLastAiText] = useState<string>('');
  const [lastParchiText, setLastParchiText] = useState<string>('');
  const [incomingParchiText, setIncomingParchiText] = useState<string>('');
  const [incomingFilmUrl, setIncomingFilmUrl] = useState<string>('');
  const [worldScanQuery, setWorldScanQuery] = useState<string>('');
  const [catalogCat, setCatalogCat] = useState<string>('ALL');
  const [lmpDate, setLmpDate] = useState<string>('');

  // Shared Schedule & Alarms (needed by GoogleDocsPanel, Summary Modal & Alarms)
  const [alarms, setAlarms] = useState<SmartAlarm[]>(() =>
    readStorageJson<SmartAlarm[]>('smart_alarms', [])
  );
  const [medSchedule, setMedSchedule] = useState<ScheduleMed[]>(() =>
    readStorageJson<ScheduleMed[]>('med_schedule', [])
  );

  // Modals & Toasts
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [syncVersion, setSyncVersion] = useState<number>(0);

  const notify = useCallback((text: string, tone: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput), 120);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Subscribe to voice engine
  useEffect(() => {
    return voiceEngine.subscribe((st) => setVoiceState(st));
  }, []);

  // Persist voice prefs
  useEffect(() => {
    localStorage.setItem('voice_gender', voiceGender);
    localStorage.setItem('specific_voice_name', specificVoice);
    localStorage.setItem('voice_mode', voiceMode);
    localStorage.setItem('voice_speed', String(voiceSpeed));
  }, [voiceGender, specificVoice, voiceMode, voiceSpeed]);

  // Apply Accessibility Modes to document.body
  useEffect(() => {
    document.body.classList.toggle('big-font-mode', bigFont);
    localStorage.setItem('big_font_mode', bigFont ? '1' : '0');
  }, [bigFont]);

  useEffect(() => {
    document.body.classList.toggle('sun-mode', sunMode);
    localStorage.setItem('sun_mode', sunMode ? '1' : '0');
  }, [sunMode]);

  // Apply RTL Direction when language changes
  useEffect(() => {
    document.documentElement.dir = rtlLangs.includes(currentLang) ? 'rtl' : 'ltr';
  }, [currentLang]);

  const activeTheme = themes50[themeIdx] || themes50[0];
  const strings = i18n[currentLang] || i18n.en;
  const activeLangTuple = langList.find((l) => l[0] === currentLang) || langList[0];

  const appIconSrc = useMemo(() => {
    if (pinCustomIcon && customIconUrl) return customIconUrl;
    return makeThemeIconSvg(activeTheme);
  }, [pinCustomIcon, customIconUrl, activeTheme]);

  // Apply CSS variables + dynamic favicon whenever theme or icon changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg', activeTheme.bg);
    root.style.setProperty('--card-bg', activeTheme.card);
    root.style.setProperty('--border-col', activeTheme.border);
    root.style.setProperty('--accent', activeTheme.accent);
    root.style.setProperty('--glow-col', `${activeTheme.accent}44`);
    localStorage.setItem('selected_theme_idx', String(themeIdx));

    const fav = document.getElementById('dynamicFavicon') as HTMLLinkElement | null;
    if (fav) fav.href = appIconSrc;
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', activeTheme.c1);
  }, [activeTheme, themeIdx, appIconSrc]);

  const handleSpeak = useCallback(
    (txt: string) => {
      voiceEngine.speak(txt, {
        mode: voiceMode,
        rate: voiceSpeed,
        gender: voiceGender,
        specificVoice,
        lang: currentLang,
      });
    },
    [voiceMode, voiceSpeed, voiceGender, specificVoice, currentLang]
  );

  const handleForceOnline = useCallback(
    (txt: string) => {
      voiceEngine.playOnlineAudio(txt, {
        rate: voiceSpeed,
        gender: voiceGender,
        lang: currentLang,
      });
    },
    [voiceSpeed, voiceGender, currentLang]
  );

  const handleStopVoice = useCallback(() => {
    voiceEngine.stop();
  }, []);

  const handleAddRamadanAlarms = useCallback(() => {
    const next: SmartAlarm[] = [
      ...alarms,
      {
        id: Date.now(),
        med: 'Sehri Med / Water',
        time: '04:15',
        pr: 'Fajr / Sehri',
        lastRang: '',
      },
      {
        id: Date.now() + 1,
        med: 'Iftari Med / Water',
        time: '18:30',
        pr: 'Maghrib / Iftari',
        lastRang: '',
      },
    ];
    setAlarms(next);
    writeStorageJson('smart_alarms', next);
    voiceEngine.playAlarmChime();
    handleSpeak('Sehri aur Iftari ke 2 smart medicine alarms set ho gaye hain.');
    notify('Added Sehri (04:15) & Iftari (18:30) alarms!', 'success');
  }, [alarms, handleSpeak, notify]);

  const totalFeatureCount = useMemo(
    () =>
      catalogItems.length +
      themes50.length +
      langList.length +
      bodyAnatomyData.length +
      medicinesData.length +
      diseasesData.length +
      scanOpBabyGuides.length +
      extraBrandKnowledge.length +
      48,
    []
  );

  const medMatchCount = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return medicinesData.length;
    return medicinesData.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.use.toLowerCase().includes(q) ||
        m.tags.includes(q)
    ).length;
  }, [debouncedQuery]);

  // Icon & Background gallery handlers
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    compressImageFile(f, 256, 0.85, (dataUrl) => {
      setCustomIconUrl(dataUrl);
      setPinCustomIcon(true);
      localStorage.setItem('pin_custom_icon', '1');
      try {
        localStorage.setItem('custom_app_icon', dataUrl);
      } catch {
        // ignore quota errors
      }
      notify('Custom app icon applied!', 'success');
    });
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    compressImageFile(f, 1280, 0.78, (dataUrl) => {
      setCustomBgUrl(dataUrl);
      try {
        localStorage.setItem('custom_bg_image', dataUrl);
      } catch {
        // ignore quota errors
      }
      notify('Custom gallery background applied!', 'success');
    });
  };

  const handleResetVisuals = () => {
    localStorage.removeItem('custom_app_icon');
    localStorage.removeItem('pin_custom_icon');
    localStorage.removeItem('custom_bg_image');
    setPinCustomIcon(false);
    setCustomIconUrl('');
    setCustomBgUrl(EMBEDDED_BABY_KAABA_SVG);
    notify('Icon & Background reset to active Crystal Theme!', 'info');
  };

  // JSON Backup / Restore
  const handleExportBackup = () => {
    const d: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        const val = localStorage.getItem(k);
        if (val !== null) d[k] = val;
      }
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Noor_Haram_2026_Backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Health backup JSON downloaded.', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result || '{}')) as Record<string, string>;
        Object.keys(data).forEach((k) => localStorage.setItem(k, data[k]));
        setAlarms(readStorageJson<SmartAlarm[]>('smart_alarms', []));
        setMedSchedule(readStorageJson<ScheduleMed[]>('med_schedule', []));
        setSyncVersion((v) => v + 1);
        notify('Health backup restored successfully!', 'success');
      } catch {
        notify('Invalid backup JSON file.', 'error');
      }
    };
    reader.readAsText(f);
  };

  const jumpToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const summaryVitals = useMemo(
    () => readStorageJson<VitalRecord[]>(pKey('vitals_history', profile), []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, summaryOpen, syncVersion]
  );
  const summaryNote = useMemo(
    () => localStorage.getItem(pKey('health_note', profile)) || 'None',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, summaryOpen, syncVersion]
  );

  const waReportHref = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(
    `Assalam-o-Alaikum, Noor Haram Report (${profile}):\n${
      summaryVitals[0]
        ? `${summaryVitals[0].time}: ${summaryVitals[0].summary}`
        : 'No vitals logged'
    }`
  )}`;

  return (
    <div
      className={`min-h-screen flex flex-col relative ${
        sunMode ? 'text-slate-900' : 'text-slate-100'
      }`}
    >
      {/* Dynamic Background Layers */}
      <div
        className="fixed inset-0 -z-30 transition-all duration-500"
        style={{ background: activeTheme.bg }}
      />
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-all duration-500 pointer-events-none"
        style={{ backgroundImage: `url('${customBgUrl}')` }}
      />
      <div
        className="fixed inset-0 -z-10 transition-all duration-300 pointer-events-none"
        style={{
          backgroundColor: sunMode
            ? `rgba(241, 245, 249, ${Math.max(0.75, bgDim / 100)})`
            : `rgba(2, 6, 23, ${bgDim / 100})`,
        }}
      />

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-[70] bg-slate-950/85 backdrop-blur-xl border-b border-white/15 px-3 py-2.5 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={appIconSrc}
              alt="Noor Haram 2026"
              className="w-10 h-10 rounded-2xl object-cover border border-emerald-400/70 shrink-0 shadow-md"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                Noor Haram 2026 — AI Health &amp; Docs
              </h1>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40 font-semibold tabular-nums whitespace-nowrap">
                  {totalFeatureCount.toLocaleString()}+ Features
                </span>
                <span className="hidden sm:inline text-sky-300 font-semibold whitespace-nowrap">
                  Google Docs &bull; Fixed Voice &bull; +2,100 Tools
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 text-xs">
            {[
              ['sec-gdocs', '📄 Docs'],
              ['sec-ai', '🤖 AI'],
              ['sec-parchi', '📜 Parchi'],
              ['sec-meds', '💊 66 Meds'],
              ['sec-ramadan', '🌙 Ramadan'],
              ['sec-diet', '🍲 Diet'],
              ['sec-pregnancy-weeks', '🤰 W1-40'],
              ['sec-idcard', '🪪 QR ID'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => jumpToSection(id)}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as ProfileId)}
              aria-label="Family Profile"
              className="bg-slate-900/90 border border-slate-600 rounded-xl px-2 py-1.5 text-xs text-slate-100"
            >
              <option value="self">👤 Self</option>
              <option value="ammi">👩 Ammi</option>
              <option value="abbu">👨 Abbu</option>
              <option value="baby">👶 Baby</option>
            </select>

            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              aria-label="Language"
              className="bg-slate-900/90 border border-slate-600 rounded-xl px-2 py-1.5 text-xs text-slate-100 max-w-[125px] sm:max-w-[155px]"
            >
              {langList.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setThemesOpen((o) => !o)}
              className="inline-flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-emerald-400/50 text-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
            >
              <span>{activeTheme.icon}</span>
              <span className="hidden sm:inline">Themes (50)</span>
            </button>
          </div>
        </div>

        {/* 50 Crystal Themes + Visual Customizer Drawer */}
        {themesOpen && (
          <div className="max-w-6xl mx-auto mt-2.5 bg-slate-950/95 border border-slate-700 rounded-2xl p-3.5 shadow-2xl space-y-3 text-xs">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <strong className="text-emerald-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                50 Crystal Themes &amp; Custom Gallery Icon / Background
              </strong>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setThemeIdx(Math.floor(Math.random() * themes50.length))}
                  className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg"
                >
                  🎲 Random Theme
                </button>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span>BG Dim</span>
                  <input
                    type="range"
                    min={20}
                    max={88}
                    value={bgDim}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBgDim(val);
                      localStorage.setItem('bg_opacity', String(val));
                    }}
                    className="w-20 accent-emerald-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setThemesOpen(false)}
                  className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-xl p-2.5">
              <label className="cursor-pointer inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg">
                <Upload className="w-3.5 h-3.5" />
                Icon Gallery Upload
                <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1 bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg">
                <Upload className="w-3.5 h-3.5" />
                BG Gallery Upload
                <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinCustomIcon}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPinCustomIcon(checked);
                    if (checked) localStorage.setItem('pin_custom_icon', '1');
                    else localStorage.removeItem('pin_custom_icon');
                  }}
                  className="accent-emerald-400"
                />
                <span>Keep Custom Icon</span>
              </label>
              <button
                type="button"
                onClick={handleResetVisuals}
                className="bg-slate-800 hover:bg-slate-700 text-rose-200 px-2.5 py-1.5 rounded-lg"
              >
                ↺ Reset Visuals
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {themes50.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setThemeIdx(i)}
                  className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition hover:scale-[1.03] ${
                    i === themeIdx ? 'ring-2 ring-white' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.16), rgba(0,0,0,0.25)), ${t.bg}`,
                    borderColor: t.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{t.icon}</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/50"
                      style={{ background: t.accent }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-white truncate">
                    {i + 1}. {t.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-3 sm:p-4 flex-grow w-full space-y-4 pb-32 overflow-x-hidden">
        {/* Safety Banner */}
        <div className="theme-surface border-amber-400/50 p-3 rounded-2xl text-amber-100 text-xs flex gap-2.5 items-start">
          <span className="text-lg shrink-0">⚠️</span>
          <div className="min-w-0">
            <strong className="font-bold block mb-0.5 text-amber-300">
              {strings.warningTitle}
            </strong>
            <span>{strings.warningText}</span>
          </div>
        </div>

        {/* Status & Quick Accessibility Bar */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center no-print">
          <div className="text-[11px] text-emerald-200 font-semibold theme-surface px-3 py-2 rounded-2xl flex flex-wrap gap-1.5 items-center min-w-0">
            <span>
              👤 <strong className="uppercase">{profile}</strong>
            </span>
            <span>&bull;</span>
            <span>
              <strong>{activeTheme.icon}</strong> <strong>{activeTheme.name}</strong>
            </span>
            <span>&bull;</span>
            <span>
              🌐 <strong className="text-amber-300">{activeLangTuple[1]}</strong>
            </span>
            <span>&bull;</span>
            <span className="text-amber-300 font-bold tabular-nums">
              {totalFeatureCount.toLocaleString()}+ Features
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setBigFont((b) => !b)}
              className={`px-2.5 py-2 rounded-xl font-bold border ${
                bigFont
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900/80 border-slate-600 text-slate-100'
              }`}
            >
              👴 Big Font
            </button>
            <button
              type="button"
              onClick={() => setSunMode((s) => !s)}
              className={`px-2.5 py-2 rounded-xl font-bold border ${
                sunMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900/80 border-slate-600 text-slate-100'
              }`}
            >
              ☀️ Sun Mode
            </button>
            <button
              type="button"
              onClick={() => setSummaryOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold px-2.5 py-2 rounded-xl"
            >
              📋 Summary
            </button>
            <a
              href={waReportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-500 text-white font-semibold px-2.5 py-2 rounded-xl"
            >
              💬 WhatsApp
            </a>
            <button
              type="button"
              onClick={handleExportBackup}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-2.5 py-2 rounded-xl"
            >
              💾 Backup
            </button>
            <label className="cursor-pointer bg-slate-900/80 border border-slate-600 text-slate-100 px-2.5 py-2 rounded-xl flex items-center">
              📂 Restore
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 bg-slate-900/80 border border-slate-600 text-slate-100 px-2.5 py-2 rounded-xl"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Global Search */}
        <section className="theme-surface border border-emerald-400/45 rounded-2xl p-3 no-print space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search 37,800+ features: Panadol, Arinac, Ramadan, Diet, Week 20, Sugar, BP..."
              className="w-full bg-slate-950/85 border border-emerald-500/60 rounded-2xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-300 pl-10"
            />
          </div>
          {debouncedQuery.trim() && (
            <div className="text-[11px] text-emerald-200 flex flex-wrap items-center gap-2">
              <span>
                🔍 Matches for <strong>"{debouncedQuery}"</strong>:
              </span>
              <span className="tabular-nums">💊 Meds: {medMatchCount}</span>
              <button
                type="button"
                onClick={() => {
                  setWorldScanQuery(debouncedQuery);
                  jumpToSection('sec-online');
                }}
                className="underline text-indigo-300"
              >
                🌐 Live Scan "{debouncedQuery}"
              </button>
            </div>
          )}
        </section>

        {/* GOOGLE DOCS WORKSPACE INTEGRATION */}
        <GoogleDocsPanel
          profile={profile}
          lastAiText={lastAiText}
          lastParchiText={lastParchiText}
          medSchedule={medSchedule}
          onSpeak={handleSpeak}
          onSendToParchi={(txt) => {
            setIncomingParchiText(txt);
            jumpToSection('sec-parchi');
          }}
          onNotify={notify}
        />

        {/* AI DOCTOR CHAT & PARCHI SCANNER */}
        <AiAndParchiSection
          currentLang={currentLang}
          langDisplayName={activeLangTuple[1]}
          strings={strings}
          autoSpeakAi={autoSpeakAi}
          onSpeak={handleSpeak}
          onStopVoice={handleStopVoice}
          onLoadFilmImageUrl={(url) => setIncomingFilmUrl(url)}
          lastAiText={lastAiText}
          setLastAiText={setLastAiText}
          lastParchiText={lastParchiText}
          setLastParchiText={setLastParchiText}
          incomingParchiText={incomingParchiText}
          onJumpToGoogleDocs={() => jumpToSection('sec-gdocs')}
          onNotify={notify}
        />

        {/* CLINICAL TOOLS, VOICE ENGINE, MEDICINES, RAMADAN, DIET, PREGNANCY, GPS & INTERNET SCAN */}
        <ClinicalToolsAndGuides
          searchQuery={debouncedQuery}
          currentLang={currentLang}
          strings={strings}
          lmpDate={lmpDate}
          voiceState={voiceState}
          voiceGender={voiceGender}
          setVoiceGender={setVoiceGender}
          specificVoice={specificVoice}
          setSpecificVoice={setSpecificVoice}
          voiceMode={voiceMode}
          setVoiceMode={setVoiceMode}
          voiceSpeed={voiceSpeed}
          setVoiceSpeed={setVoiceSpeed}
          autoSpeakAi={autoSpeakAi}
          setAutoSpeakAi={setAutoSpeakAi}
          onSpeak={handleSpeak}
          onForceOnline={handleForceOnline}
          onStopVoice={handleStopVoice}
          onAddRamadanAlarms={handleAddRamadanAlarms}
          onJumpToExtraCatalog={() => {
            setCatalogCat('🌟 +1,100 Extra 2026 Upgrades');
            jumpToSection('sec-catalog');
          }}
          externalWorldScanQuery={worldScanQuery}
          onNotify={notify}
        />

        {/* BODY MAP, 40 PARTS, 24 GUIDES, FILM VIEWER, 42 DISEASES, 37.8K CATALOG, CHARTS, ALARMS, QR ID, SYNC, VITALS */}
        <AnatomyAndVitalsSection
          key={syncVersion}
          searchQuery={debouncedQuery}
          profile={profile}
          strings={strings}
          lmpDate={lmpDate}
          setLmpDate={setLmpDate}
          incomingFilmDataUrl={incomingFilmUrl}
          catalogCat={catalogCat}
          setCatalogCat={setCatalogCat}
          alarms={alarms}
          setAlarms={setAlarms}
          medSchedule={medSchedule}
          setMedSchedule={setMedSchedule}
          onSpeak={handleSpeak}
          onSyncApplied={() => {
            setAlarms(readStorageJson<SmartAlarm[]>('smart_alarms', []));
            setMedSchedule(readStorageJson<ScheduleMed[]>('med_schedule', []));
            setSyncVersion((v) => v + 1);
          }}
          onNotify={notify}
        />
      </main>

      {/* A4 Doctor Summary Modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 p-3 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white text-slate-900 rounded-2xl p-4 sm:p-5 space-y-3 max-h-[88dvh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base sm:text-lg text-emerald-700">
                📋 Noor Haram 2026 Doctor Summary
              </h3>
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="text-rose-600 font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-xs space-y-2 leading-relaxed">
              <div>
                <strong>Profile:</strong> {profile.toUpperCase()} &bull; <strong>Date:</strong>{' '}
                {new Date().toLocaleString()}
              </div>
              <div className="border-t pt-2">
                <strong>Recent Vitals:</strong>
                <br />
                {summaryVitals.length > 0
                  ? summaryVitals.slice(0, 5).map((v, i) => (
                      <div key={i}>
                        • {v.time}: {v.summary}
                      </div>
                    ))
                  : 'None'}
              </div>
              <div className="border-t pt-2">
                <strong>Medicine Schedule:</strong>
                <br />
                {medSchedule.length > 0
                  ? medSchedule.map((m) => (
                      <div key={m.id}>
                        • {m.name} ({m.dose}) @ {m.time}
                      </div>
                    ))
                  : 'None'}
              </div>
              <div className="border-t pt-2">
                <strong>Notes:</strong>
                <br />
                {summaryNote}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                🖨️ Print A4
              </button>
              <a
                href={waReportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                📲 WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  setSummaryOpen(false);
                  jumpToSection('sec-gdocs');
                }}
                className="bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                📄 Save to Google Docs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Support */}
      <a
        href={`https://wa.me/${WHATSAPP_NUM}?text=Assalam-o-Alaikum%20Noor%20Haram%20Health%20Support`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-3 z-[85] bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-2 rounded-full shadow-2xl border border-green-300/40 flex items-center gap-1 no-print"
      >
        <span>💬</span> WhatsApp
      </a>

      {/* Floating Voice Player Bar */}
      {voiceState.active && (
        <div className="fixed bottom-2.5 left-2.5 right-2.5 max-w-2xl mx-auto z-[90] bg-slate-950/90 backdrop-blur-xl border border-sky-400/70 rounded-2xl p-2.5 flex items-center justify-between gap-2 no-print shadow-2xl">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Volume2 className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-sky-300 truncate">
                {voiceState.engineLabel}
              </div>
              <div className="text-xs text-slate-100 truncate">{voiceState.caption}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {voiceState.showTapPlay && (
              <button
                type="button"
                onClick={() =>
                  voiceEngine.lastSpokenText && handleForceOnline(voiceEngine.lastSpokenText)
                }
                className="bg-emerald-400 text-slate-950 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl"
              >
                ▶ Tap Listen
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                voiceEngine.lastSpokenText && handleForceOnline(voiceEngine.lastSpokenText)
              }
              title="Switch to Online Audio"
              className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-1.5 rounded-xl"
            >
              🌐
            </button>
            <button
              type="button"
              onClick={() =>
                voiceEngine.lastSpokenText && handleSpeak(voiceEngine.lastSpokenText)
              }
              title="Replay"
              className="bg-sky-500 text-slate-950 font-bold text-[10px] px-2 py-1.5 rounded-xl"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={handleStopVoice}
              title="Stop"
              className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl"
            >
              ⏹
            </button>
          </div>
        </div>
      )}

      {/* Non-blocking Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-16 right-3 z-[120] space-y-2 max-w-sm w-full pointer-events-none px-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold ${
                t.tone === 'error'
                  ? 'bg-rose-950/95 border-rose-400 text-rose-100'
                  : t.tone === 'success'
                    ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
                    : 'bg-slate-900/95 border-sky-400 text-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                {t.text}
              </span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <footer className="bg-slate-950/80 backdrop-blur-md border-t border-white/10 text-center py-4 px-3 text-[11px] text-slate-200 no-print">
        Noor Haram 2026 Crystal AI Suite &bull; Google Docs Sync &bull; 37,800+ Features &bull; 50 Icon Themes &bull; +923015500379
      </footer>
    </div>
  );
}
