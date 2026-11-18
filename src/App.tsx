import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe,
  Languages,
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
import { EmergencyTriageAndCpr } from './components/EmergencyTriageAndCpr';
import { GoogleDocsPanel } from './components/GoogleDocsPanel';
import { InternationalHospitalHub } from './components/InternationalHospitalHub';
import { VisionHalalAndTrends } from './components/VisionHalalAndTrends';
import { WorldMedicalRadar } from './components/WorldMedicalRadar';
import {
  bodyAnatomyData,
  catalogItems,
  diseasesData,
  extraBrandKnowledge,
  medicinesData,
  scanOpBabyGuides,
} from './data/healthData';
import {
  i18n,
  I18nStrings,
  langList,
  makeThemeIconSvg,
  rtlLangs,
  themes50,
  USER_KAABA_BABY_BG,
  WHATSAPP_NUM,
} from './data/themesAndLangs';
import { voiceEngine, VoiceGender, VoiceMode } from './services/voiceEngine';
import {
  ProfileId,
  ScheduleMed,
  SmartAlarm,
  VitalRecord,
  VoiceState,
  WorkspaceFocus,
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
    const saved = parseInt(localStorage.getItem('bg_opacity') || '38', 10);
    return !isNaN(saved) ? saved : 38;
  });
  const [customBgUrl, setCustomBgUrl] = useState<string>(() => {
    const saved = localStorage.getItem('custom_bg_image');
    if (!saved || saved.startsWith('data:image/svg+xml')) {
      return USER_KAABA_BABY_BG;
    }
    return saved;
  });
  const [pinCustomIcon, setPinCustomIcon] = useState<boolean>(
    () => localStorage.getItem('pin_custom_icon') === '1'
  );
  const [customIconUrl, setCustomIconUrl] = useState<string>(
    () => localStorage.getItem('custom_app_icon') || ''
  );

  const [profile, setProfile] = useState<ProfileId>('self');
  const [currentLang, setCurrentLang] = useState<string>(
    () => localStorage.getItem('selected_lang_code') || 'ur'
  );
  const [localizedMap, setLocalizedMap] = useState<Record<string, I18nStrings>>(() =>
    readStorageJson<Record<string, I18nStrings>>('noor_ui_loc_v2', {})
  );
  const [translatingUi, setTranslatingUi] = useState<boolean>(false);
  const [patientEasy, setPatientEasy] = useState<boolean>(
    () => localStorage.getItem('patient_easy_mode') === '1'
  );
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
  const [hubSearchQuery, setHubSearchQuery] = useState<string>('');
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
  const [workspaceFocus, setWorkspaceFocus] = useState<WorkspaceFocus>('all');

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
    document.body.classList.toggle('big-font-mode', bigFont || patientEasy);
    localStorage.setItem('big_font_mode', bigFont ? '1' : '0');
    localStorage.setItem('patient_easy_mode', patientEasy ? '1' : '0');
  }, [bigFont, patientEasy]);

  useEffect(() => {
    document.body.classList.toggle('sun-mode', sunMode);
    localStorage.setItem('sun_mode', sunMode ? '1' : '0');
  }, [sunMode]);

  // Persist language & apply RTL Direction when language changes
  useEffect(() => {
    localStorage.setItem('selected_lang_code', currentLang);
    document.documentElement.dir = rtlLangs.includes(currentLang) ? 'rtl' : 'ltr';
  }, [currentLang]);

  const activeTheme = themes50[themeIdx] || themes50[0];
  const activeLangTuple = langList.find((l) => l[0] === currentLang) || langList[0];

  // Dynamically localize FULL App UI into any of the 55 selected languages
  useEffect(() => {
    if (i18n[currentLang] || localizedMap[currentLang]) {
      setTranslatingUi(false);
      return;
    }
    let cancelled = false;
    setTranslatingUi(true);
    fetch('/api/ai/localize-ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLangCode: currentLang,
        targetLangName: activeLangTuple[1],
        baseStrings: i18n.en,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { strings?: I18nStrings } | null) => {
        if (cancelled || !json?.strings) return;
        setLocalizedMap((prev) => {
          const next = { ...prev, [currentLang]: json.strings! };
          writeStorageJson('noor_ui_loc_v2', next);
          return next;
        });
      })
      .catch(() => {
        // Fallback smoothly to English UI if offline
      })
      .finally(() => {
        if (!cancelled) setTranslatingUi(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentLang, activeLangTuple, localizedMap]);

  const strings = useMemo(
    () => i18n[currentLang] || localizedMap[currentLang] || i18n.en,
    [currentLang, localizedMap]
  );

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
    (txt: string, skipTranslate = false) => {
      voiceEngine.speak(txt, {
        mode: voiceMode,
        rate: voiceSpeed,
        gender: voiceGender,
        specificVoice,
        lang: currentLang,
        skipTranslate,
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
    localStorage.setItem('bg_opacity', '38');
    setBgDim(38);
    setPinCustomIcon(false);
    setCustomIconUrl('');
    setCustomBgUrl(USER_KAABA_BABY_BG);
    notify('Kaaba Baby Background & Shield App Icon active!', 'info');
  };

  const handleUseKaabaIcon = () => {
    setCustomIconUrl(USER_KAABA_BABY_BG);
    setPinCustomIcon(true);
    localStorage.setItem('pin_custom_icon', '1');
    try {
      localStorage.setItem('custom_app_icon', USER_KAABA_BABY_BG);
    } catch {
      // ignore
    }
    notify('Kaaba Baby Portrait Icon active!', 'success');
  };

  const handleUseKaabaBg = () => {
    setCustomBgUrl(USER_KAABA_BABY_BG);
    setBgDim(34);
    localStorage.setItem('custom_bg_image', USER_KAABA_BABY_BG);
    localStorage.setItem('bg_opacity', '34');
    notify('Kaaba Baby Background photo active!', 'success');
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
    const focusMap: Record<string, WorkspaceFocus> = {
      'sec-hospital-hub': 'online_hub',
      'sec-emergency': 'emergency',
      'sec-vision': 'vision',
      'sec-gdocs': 'gdocs',
      'sec-ai': 'ai',
      'sec-parchi': 'ai',
      'sec-translator': 'tools',
      'sec-meds': 'tools',
      'sec-ramadan': 'tools',
      'sec-diet': 'tools',
      'sec-pregnancy-weeks': 'tools',
      'sec-online': 'tools',
      'sec-world-radar': 'world',
      'sec-idcard': 'anatomy',
      'sec-catalog': 'anatomy',
    };
    if (workspaceFocus !== 'all' && focusMap[id] && workspaceFocus !== focusMap[id]) {
      setWorkspaceFocus(focusMap[id]);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
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

  const profileContext = useMemo(() => {
    const latestVitals =
      summaryVitals
        .slice(0, 4)
        .map((v) => `${v.time}: ${v.summary}`)
        .join(' | ') || 'None';
    const meds =
      medSchedule.map((m) => `${m.name} (${m.dose} @ ${m.time})`).join(', ') || 'None';
    return `Profile: ${profile.toUpperCase()} | Recent Vitals: ${latestVitals} | Active Meds: ${meds}${
      summaryNote && summaryNote !== 'None' ? ` | Notes: ${summaryNote}` : ''
    }`;
  }, [profile, summaryVitals, medSchedule, summaryNote]);

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
          background: sunMode
            ? `rgba(241, 245, 249, ${Math.max(0.68, bgDim / 100)})`
            : `linear-gradient(180deg, rgba(2, 6, 23, ${Math.max(0.18, bgDim / 115)}) 0%, rgba(2, 6, 23, ${Math.min(0.72, (bgDim + 12) / 100)}) 100%)`,
        }}
      />

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-[70] bg-slate-950/80 backdrop-blur-xl border-b border-white/15 px-3 py-2.5 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setThemesOpen((o) => !o)}
              title="Customize App Icon & Background"
              className="rounded-2xl p-0.5 border border-amber-300/70 shadow-lg hover:scale-105 transition shrink-0"
            >
              <img
                src={appIconSrc}
                alt="Noor Haram 2026"
                className="w-10 h-10 rounded-[14px] object-cover"
              />
            </button>
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
              ['sec-hospital-hub', '🏥 Super Hub'],
              ['sec-emergency', '🚨 SOS'],
              ['sec-vision', '🔬 Vision'],
              ['sec-gdocs', '📄 Docs'],
              ['sec-ai', '🤖 AI'],
              ['sec-meds', '💊 66 Meds'],
              ['sec-ramadan', '🌙 Ramadan'],
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
                  <span>BG Clarity</span>
                  <input
                    type="range"
                    min={15}
                    max={85}
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
              <button
                type="button"
                onClick={handleUseKaabaIcon}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg"
              >
                🕌 Kaaba Baby Icon
              </button>
              <button
                type="button"
                onClick={handleUseKaabaBg}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg"
              >
                🖼️ Kaaba Baby BG Photo
              </button>
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
                ↺ Shield Icon + Kaaba BG
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
              onClick={() => setPatientEasy((p) => !p)}
              className={`px-2.5 py-2 rounded-xl font-bold border ${
                patientEasy
                  ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                  : 'bg-slate-900/80 border-slate-600 text-slate-100'
              }`}
            >
              🩺 {strings.patientModeLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                const medsText =
                  medSchedule.length > 0
                    ? medSchedule
                        .slice(0, 5)
                        .map((m) => `${m.name} ${m.dose} at ${m.time}`)
                        .join('. ')
                    : 'No daily medicine scheduled yet';
                const vitalsText = summaryVitals[0]
                  ? `${summaryVitals[0].time}: ${summaryVitals[0].summary}`
                  : 'No vitals logged yet';
                handleSpeak(
                  `${strings.voiceTestPhrase} Profile ${profile}. ${vitalsText}. Medicines: ${medsText}.`
                );
              }}
              className="inline-flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-2.5 py-2 rounded-xl"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {strings.speakSummaryBtn}
            </button>
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

        {/* 1-Tap Real Native Language & Patient Easy Command Strip */}
        <section className="theme-surface border border-sky-400/50 rounded-2xl p-2.5 no-print space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-sky-300">
              <Languages className="w-4 h-4" />
              <span>55-Language Real Voice &amp; UI:</span>
              <span className="bg-sky-500/20 border border-sky-400/50 text-sky-100 px-2 py-0.5 rounded-lg">
                {activeLangTuple[1]}
              </span>
              {translatingUi && (
                <span className="text-[10px] text-amber-300 animate-pulse">
                  Translating full interface...
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSpeak(strings.voiceTestPhrase, true)}
              className="inline-flex items-center gap-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-lg"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {strings.launchVoice}
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {['ur', 'ur_script', 'en', 'ar', 'hi', 'pa', 'ps', 'sd', 'bn', 'es', 'fr', 'tr'].map(
              (code) => {
                const tup = langList.find((l) => l[0] === code);
                if (!tup) return null;
                const active = currentLang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrentLang(code)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap border transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    {tup[1]}
                  </button>
                );
              }
            )}
          </div>

          {patientEasy && medSchedule.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10 text-xs">
              {[
                ['☀️ Morning / Subah', medSchedule.filter((m) => /am|0[6-9]|1[0-1]|sehri|subah/i.test(m.time))],
                ['🌤️ Afternoon / Dopeher', medSchedule.filter((m) => /1[2-6]:/i.test(m.time))],
                ['🌙 Night / Raat', medSchedule.filter((m) => /pm|1[7-9]|2[0-3]|iftar|raat/i.test(m.time))],
              ].map(([slotLabel, list]) => (
                <div
                  key={slotLabel as string}
                  className="bg-slate-950/80 border border-emerald-400/40 rounded-xl p-2"
                >
                  <div className="font-bold text-emerald-300 mb-1">{slotLabel as string}</div>
                  {(list as ScheduleMed[]).length > 0 ? (
                    (list as ScheduleMed[]).map((m) => (
                      <div key={m.id} className="text-[11px] text-slate-100 truncate">
                        • {m.name} ({m.dose}) @ {m.time}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400">—</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global Search */}
        <section className="theme-surface border border-emerald-400/45 rounded-2xl p-3 no-print space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={strings.searchPlaceholder}
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
                  setWorkspaceFocus('online_hub');
                  setHubSearchQuery(`${debouncedQuery} `);
                  setWorldScanQuery(debouncedQuery);
                  setTimeout(() => jumpToSection('sec-hospital-hub'), 60);
                }}
                className="underline text-emerald-300 font-bold"
              >
                🏥 Online Hospital Search "{debouncedQuery}"
              </button>
            </div>
          )}

          {/* Workspace Focus Switcher */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10 text-xs">
            {(
              [
                ['all', strings.tabAll],
                ['online_hub', `🏥 ${strings.hubTabSearch}`],
                ['emergency', strings.tabEmergency],
                ['vision', strings.tabVision],
                ['ai', strings.tabAi],
                ['gdocs', strings.tabDocs],
                ['tools', strings.tabTools],
                ['world', strings.launchWorld],
                ['anatomy', strings.tabAnatomy],
              ] as Array<[WorkspaceFocus, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setWorkspaceFocus(key)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  workspaceFocus === key
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Aasan 1-Tap Quick Launchpad (Easy Family Controls) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 pt-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                handleSpeak(strings.voiceTestPhrase, true);
                jumpToSection('sec-translator');
              }}
              className="bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate"
            >
              🔊 {strings.launchVoice}
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('sec-translator')}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate"
            >
              🌐 {strings.launchTranslate}
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('sec-meds')}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate"
            >
              💊 {strings.launchMeds}
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('sec-ai')}
              className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 text-indigo-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate"
            >
              🤖 {strings.launchAi}
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('sec-parchi')}
              className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate"
            >
              📜 {strings.launchParchi}
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('sec-world-radar')}
              className="bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/50 text-teal-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate inline-flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{strings.launchWorld}</span>
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('sec-emergency')}
              className="bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/60 text-rose-100 font-bold py-2.5 px-3 rounded-xl text-left transition truncate"
            >
              🚨 {strings.launchEmergency}
            </button>
          </div>
        </section>

        {/* INTERNATIONAL SUPER HOSPITAL ONLINE HUB (ONLINE MED/DISEASE + X-RAY/ULTRASOUND/BP/100+ LAB + SPOKEN NEARBY) */}
        {(workspaceFocus === 'all' || workspaceFocus === 'online_hub') && (
          <InternationalHospitalHub
            currentLang={currentLang}
            langDisplayName={activeLangTuple[1]}
            strings={strings}
            profileContext={profileContext}
            medSchedule={medSchedule}
            externalQuery={hubSearchQuery}
            onSpeak={handleSpeak}
            onSaveToAi={(txt) => setLastAiText(txt)}
            onJumpToGoogleDocs={() => {
              setWorkspaceFocus('gdocs');
              setTimeout(() => jumpToSection('sec-gdocs'), 60);
            }}
            onNotify={notify}
          />
        )}

        {/* AI EMERGENCY TRIAGE, LIVE 110 BPM CPR & FIRST-AID COMMAND */}
        {(workspaceFocus === 'all' || workspaceFocus === 'emergency') && (
          <EmergencyTriageAndCpr
            profile={profile}
            langDisplayName={activeLangTuple[1]}
            strings={strings}
            profileContext={profileContext}
            onSpeak={handleSpeak}
            onSaveTriageToAi={(txt) => setLastAiText(txt)}
            onJumpToGoogleDocs={() => {
              setWorkspaceFocus('gdocs');
              setTimeout(() => jumpToSection('sec-gdocs'), 60);
            }}
            onNotify={notify}
          />
        )}

        {/* 2026 WORLD LATEST MEDICAL SYSTEM & INTERNATIONAL BRAND RADAR */}
        {(workspaceFocus === 'all' || workspaceFocus === 'world') && (
          <WorldMedicalRadar
            currentLang={currentLang}
            langDisplayName={activeLangTuple[1]}
            strings={strings}
            onSpeak={handleSpeak}
            onSaveToAi={(txt) => setLastAiText(txt)}
            onJumpToGoogleDocs={() => {
              setWorkspaceFocus('gdocs');
              setTimeout(() => jumpToSection('sec-gdocs'), 60);
            }}
            onNotify={notify}
          />
        )}

        {/* 3-IN-1 VISION LAB (HALAL / MEAL CALORIES / STRIP CONFLICTS) & TREND INTELLIGENCE */}
        {(workspaceFocus === 'all' || workspaceFocus === 'vision') && (
          <VisionHalalAndTrends
            profile={profile}
            langDisplayName={activeLangTuple[1]}
            strings={strings}
            medSchedule={medSchedule}
            onSpeak={handleSpeak}
            onSaveBriefingToAi={(txt) => setLastAiText(txt)}
            onJumpToGoogleDocs={() => {
              setWorkspaceFocus('gdocs');
              setTimeout(() => jumpToSection('sec-gdocs'), 60);
            }}
            onNotify={notify}
          />
        )}

        {/* GOOGLE DOCS WORKSPACE INTEGRATION */}
        {(workspaceFocus === 'all' || workspaceFocus === 'gdocs') && (
          <GoogleDocsPanel
            profile={profile}
            strings={strings}
            lastAiText={lastAiText}
            lastParchiText={lastParchiText}
            medSchedule={medSchedule}
            onSpeak={handleSpeak}
            onSendToParchi={(txt) => {
              setIncomingParchiText(txt);
              setWorkspaceFocus('ai');
              setTimeout(() => jumpToSection('sec-parchi'), 60);
            }}
            onNotify={notify}
          />
        )}

        {/* AI DOCTOR CHAT & PARCHI SCANNER */}
        {(workspaceFocus === 'all' || workspaceFocus === 'ai') && (
          <AiAndParchiSection
            currentLang={currentLang}
            langDisplayName={activeLangTuple[1]}
            profileContext={profileContext}
            strings={strings}
            autoSpeakAi={autoSpeakAi}
            onSpeak={handleSpeak}
            onStopVoice={handleStopVoice}
            onLoadFilmImageUrl={(url) => {
              setIncomingFilmUrl(url);
            }}
            lastAiText={lastAiText}
            setLastAiText={setLastAiText}
            lastParchiText={lastParchiText}
            setLastParchiText={setLastParchiText}
            incomingParchiText={incomingParchiText}
            onJumpToGoogleDocs={() => {
              setWorkspaceFocus('gdocs');
              setTimeout(() => jumpToSection('sec-gdocs'), 60);
            }}
            onNotify={notify}
          />
        )}

        {/* CLINICAL TOOLS, VOICE ENGINE, MEDICINES, RAMADAN, DIET, PREGNANCY, GPS & INTERNET SCAN */}
        {(workspaceFocus === 'all' || workspaceFocus === 'tools') && (
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
              setWorkspaceFocus('anatomy');
              setTimeout(() => jumpToSection('sec-catalog'), 60);
            }}
            externalWorldScanQuery={worldScanQuery}
            onNotify={notify}
          />
        )}

        {/* BODY MAP, 40 PARTS, 24 GUIDES, FILM VIEWER, 42 DISEASES, 37.8K CATALOG, CHARTS, ALARMS, QR ID, SYNC, VITALS */}
        {(workspaceFocus === 'all' || workspaceFocus === 'anatomy') && (
          <AnatomyAndVitalsSection
            key={syncVersion}
            searchQuery={debouncedQuery}
            profile={profile}
            langDisplayName={activeLangTuple[1]}
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
        )}
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
