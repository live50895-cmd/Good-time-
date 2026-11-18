import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Baby,
  Bell,
  Camera,
  Download,
  Eye,
  HeartPulse,
  PhoneCall,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  bodyAnatomyData,
  catalogCategories,
  catalogItems,
  diseasesData,
  makeSvgBadge,
  scanOpBabyGuides,
  vaccineSchedule,
} from '../data/healthData';
import { I18nStrings, WHATSAPP_NUM } from '../data/themesAndLangs';
import { voiceEngine } from '../services/voiceEngine';
import {
  BodyPartItem,
  DoctorContact,
  ExpiryMed,
  ProfileId,
  SavedPhoto,
  ScheduleMed,
  SmartAlarm,
  VitalRecord,
} from '../types/health';
import {
  drawRealQrCode,
  pKey,
  readStorageJson,
  writeStorageJson,
} from '../utils/qrAndStorage';

interface AnatomyAndVitalsSectionProps {
  searchQuery: string;
  profile: ProfileId;
  strings: I18nStrings;
  lmpDate: string;
  setLmpDate: (d: string) => void;
  incomingFilmDataUrl: string;
  catalogCat: string;
  setCatalogCat: (cat: string) => void;
  alarms: SmartAlarm[];
  setAlarms: React.Dispatch<React.SetStateAction<SmartAlarm[]>>;
  medSchedule: ScheduleMed[];
  setMedSchedule: React.Dispatch<React.SetStateAction<ScheduleMed[]>>;
  onSpeak: (txt: string) => void;
  onSyncApplied: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

const ITEMS_PER_PAGE = 12;

const quickOrgans: Array<[string, string]> = [
  ['brain', '🧠 Brain'],
  ['eyes', '👁️ Eyes'],
  ['throat_tonsils', '🗣️ Throat'],
  ['heart', '❤️ Heart'],
  ['lungs', '🫁 Lungs'],
  ['stomach', '🫃 Stomach'],
  ['liver', '🩺 Liver'],
  ['gallbladder', '🟢 Pitta'],
  ['kidneys', '🫘 Kidneys'],
  ['appendix', '📍 Appendix'],
  ['back_spine', '🦴 Spine'],
  ['legs', '🦿 Knees'],
];

export const AnatomyAndVitalsSection: React.FC<AnatomyAndVitalsSectionProps> = ({
  searchQuery,
  profile,
  strings,
  lmpDate,
  setLmpDate,
  incomingFilmDataUrl,
  catalogCat,
  setCatalogCat,
  alarms,
  setAlarms,
  medSchedule,
  setMedSchedule,
  onSpeak,
  onSyncApplied,
  onNotify,
}) => {
  // Body Map & Parts
  const [bodyLayer, setBodyLayer] = useState<'front' | 'back'>('front');
  const [bodyZoneFilter, setBodyZoneFilter] = useState<'all' | 'external' | 'internal'>('all');
  const [selectedPart, setSelectedPart] = useState<BodyPartItem | null>(null);
  const partDetailRef = useRef<HTMLDivElement | null>(null);

  // Guides & Diseases
  const [guideFilter, setGuideFilter] = useState<'all' | 'operation' | 'scan' | 'baby'>('all');
  const [diseaseFilter, setDiseaseFilter] = useState<'all' | 'new' | 'chronic' | 'common'>('all');

  // Catalog Pagination
  const [catalogPage, setCatalogPage] = useState<number>(1);

  // Film Viewer, Eye & Pulse
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pulseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const pulseStreamRef = useRef<MediaStream | null>(null);
  const pulseIntRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [camActive, setCamActive] = useState<boolean>(false);
  const [filmUrl, setFilmUrl] = useState<string>('');
  const [scanMode, setScanMode] = useState<'normal' | 'xray' | 'ultrasound'>('normal');
  const [scanBright, setScanBright] = useState<number>(100);
  const [scanContrast, setScanContrast] = useState<number>(100);
  const [scanZoom, setScanZoom] = useState<number>(100);
  const [scanCamErr, setScanCamErr] = useState<string>('');
  const [eyeCheckStatus, setEyeCheckStatus] = useState<string>('');
  const [pulseOut, setPulseOut] = useState<string>(
    'Experimental demo — asli BP/Pulse ke liye digital meter use karein.'
  );

  // Drug Interaction & Child Dose
  const [drugA, setDrugA] = useState<string>('paracetamol');
  const [drugB, setDrugB] = useState<string>('ibuprofen');
  const [interactionOut, setInteractionOut] = useState<{ cls: string; text: string } | null>(null);
  const [childKg, setChildKg] = useState<string>('');
  const [syrupStrength, setSyrupStrength] = useState<number>(120);
  const [childDoseOut, setChildDoseOut] = useState<string>('');

  // Live Chart & Alarms
  const vitalsChartRef = useRef<HTMLCanvasElement | null>(null);
  const [alarmMedName, setAlarmMedName] = useState<string>('');
  const [alarmTime, setAlarmTime] = useState<string>('08:00');
  const [alarmPrayer, setAlarmPrayer] = useState<string>('Exact Time');

  // Emergency QR ID & Expiry
  const idCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [idGenerated, setIdGenerated] = useState<boolean>(false);
  const [idName, setIdName] = useState<string>('');
  const [idBlood, setIdBlood] = useState<string>('O+');
  const [idAllergy, setIdAllergy] = useState<string>('');
  const [idPhone, setIdPhone] = useState<string>('');
  const [expMedName, setExpMedName] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [expiryMeds, setExpiryMeds] = useState<ExpiryMed[]>(() =>
    readStorageJson<ExpiryMed[]>('expiry_meds', [])
  );

  // Family Sync & Offline Status
  const [syncCode, setSyncCode] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [offlineSavedAt, setOfflineSavedAt] = useState<string>(() =>
    localStorage.getItem('offline_cache_ready') || ''
  );

  // Physio Coach
  const physioIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [physioStatus, setPhysioStatus] = useState<string>('Ready');

  // Vitals per profile
  const [tempVal, setTempVal] = useState<string>('');
  const [bpSysVal, setBpSysVal] = useState<string>('');
  const [bpDiaVal, setBpDiaVal] = useState<string>('');
  const [sugarVal, setSugarVal] = useState<string>('');
  const [pulseVal, setPulseVal] = useState<string>('');
  const [spo2Val, setSpo2Val] = useState<string>('');
  const [vitalsResult, setVitalsResult] = useState<Array<{ cls: string; text: string }>>([]);
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>(() =>
    readStorageJson<VitalRecord[]>(pKey('vitals_history', profile), [])
  );

  // Water, Sleep, BMI, Pregnancy EDD
  const [waterCount, setWaterCount] = useState<number>(0);
  const [wakeTime, setWakeTime] = useState<string>('06:00');
  const [sleepOut, setSleepOut] = useState<string>('');
  const [bmiKg, setBmiKg] = useState<string>('');
  const [bmiCm, setBmiCm] = useState<string>('');
  const [bmiOut, setBmiOut] = useState<string>('');
  const [pregEddOut, setPregEddOut] = useState<string>('');

  // Breathing, Doctors, Schedule, Photos, Vaccines, Notes
  const breathIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [breathPhase, setBreathPhase] = useState<string>('Taiyar Hain?');
  const [breathTimer, setBreathTimer] = useState<number>(0);

  const [docName, setDocName] = useState<string>('');
  const [docPhone, setDocPhone] = useState<string>('');
  const [doctors, setDoctors] = useState<DoctorContact[]>(() =>
    readStorageJson<DoctorContact[]>('doc_contacts', [])
  );

  const [schedName, setSchedName] = useState<string>('');
  const [schedTime, setSchedTime] = useState<string>('');
  const [schedDose, setSchedDose] = useState<string>('');

  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>(() =>
    readStorageJson<SavedPhoto[]>('saved_med_photos', [])
  );
  const [vaccines, setVaccines] = useState<Record<string, boolean>>(() =>
    readStorageJson<Record<string, boolean>>('vaccine_checks', {})
  );
  const [healthNote, setHealthNote] = useState<string>(() =>
    localStorage.getItem(pKey('health_note', profile)) || ''
  );
  const [noteSavedFlag, setNoteSavedFlag] = useState<boolean>(false);

  // Sync incoming film image URL from OCR/Parchi photo upload
  useEffect(() => {
    if (incomingFilmDataUrl) {
      stopScanCamera();
      setFilmUrl(incomingFilmDataUrl);
    }
  }, [incomingFilmDataUrl]);

  // Reload profile-specific vitals, water, and note when profile changes
  useEffect(() => {
    setVitalsHistory(readStorageJson<VitalRecord[]>(pKey('vitals_history', profile), []));
    const today = new Date().toDateString();
    const wd = readStorageJson<{ date?: string; count?: number }>(
      pKey('water_tracker', profile),
      {}
    );
    setWaterCount(wd.date === today ? wd.count || 0 : 0);
    setHealthNote(localStorage.getItem(pKey('health_note', profile)) || '');
  }, [profile]);

  // Cleanup camera & timers on unmount
  useEffect(() => {
    return () => {
      if (scanStreamRef.current) {
        scanStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pulseStreamRef.current) {
        pulseStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pulseIntRef.current) clearInterval(pulseIntRef.current);
      if (physioIntRef.current) clearInterval(physioIntRef.current);
      if (breathIntRef.current) clearInterval(breathIntRef.current);
    };
  }, []);

  // Draw live vitals chart whenever vitalsHistory changes
  useEffect(() => {
    const canvas = vitalsChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const h = vitalsHistory.slice(0, 10).reverse();
    if (h.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Log BP or Sugar below to see live graph.', 24, 85);
      return;
    }
    const ex = (s: string, rx: RegExp) => {
      const m = s.match(rx);
      return m ? parseInt(m[1], 10) : null;
    };
    const plot = (pts: Array<number | null>, col: string) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      pts.forEach((v, i) => {
        if (v === null) return;
        const x = 25 + (i / Math.max(1, pts.length - 1)) * (canvas.width - 50);
        const y = canvas.height - 20 - Math.min(125, (v / 260) * 125);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
        ctx.fillStyle = col;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      });
      ctx.stroke();
    };
    plot(h.map((x) => ex(x.summary, /BP:\s*(\d+)/)), '#fb7185');
    plot(h.map((x) => ex(x.summary, /BP:\s*\d+\/(\d+)/)), '#34d399');
    plot(h.map((x) => ex(x.summary, /Sugar:\s*(\d+)/)), '#facc15');
  }, [vitalsHistory]);

  // Smart Namaz Alarm background monitor
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hh = now.toTimeString().slice(0, 5);
      const td = now.toDateString();
      let changed = false;
      setAlarms((prev) => {
        const next = prev.map((a) => {
          if (a.time === hh && a.lastRang !== td) {
            changed = true;
            voiceEngine.playAlarmChime();
            onSpeak(`Medicine Alarm! Time to take ${a.med}`);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Noor Haram Alarm', {
                body: `Take ${a.med} (${a.pr})`,
              });
            }
            return { ...a, lastRang: td };
          }
          return a;
        });
        if (changed) writeStorageJson('smart_alarms', next);
        return changed ? next : prev;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [onSpeak, setAlarms]);

  // Filtered data memos
  const filteredBodyParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bodyAnatomyData.filter(
      (p) =>
        (bodyZoneFilter === 'all' || p.zone === bodyZoneFilter) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.diseases.toLowerCase().includes(q) ||
          p.meds.toLowerCase().includes(q) ||
          p.op.toLowerCase().includes(q))
    );
  }, [searchQuery, bodyZoneFilter]);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scanOpBabyGuides.filter(
      (g) =>
        (guideFilter === 'all' || g.cat === guideFilter) &&
        (!q ||
          g.title.toLowerCase().includes(q) ||
          g.desc.toLowerCase().includes(q) ||
          g.meds.toLowerCase().includes(q))
    );
  }, [searchQuery, guideFilter]);

  const filteredDiseases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return diseasesData.filter(
      (d) =>
        (diseaseFilter === 'all' || d.type === diseaseFilter) &&
        (!q ||
          d.name.toLowerCase().includes(q) ||
          d.symptoms.toLowerCase().includes(q) ||
          d.med.toLowerCase().includes(q))
    );
  }, [searchQuery, diseaseFilter]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogItems.filter((it) => {
      if (catalogCat !== 'ALL' && it.cat !== catalogCat) return false;
      if (
        q &&
        !it.title.toLowerCase().includes(q) &&
        !it.desc.toLowerCase().includes(q) &&
        !it.cat.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [searchQuery, catalogCat]);

  const totalCatalogPages = Math.max(1, Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE));
  const safeCatalogPage = Math.min(catalogPage, totalCatalogPages);
  const catalogSlice = useMemo(() => {
    const start = (safeCatalogPage - 1) * ITEMS_PER_PAGE;
    return filteredCatalog.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCatalog, safeCatalogPage]);

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogCat, searchQuery]);

  const selectBodyPartById = (id: string) => {
    const found = bodyAnatomyData.find((x) => x.id === id) || null;
    setSelectedPart(found);
    if (found) {
      setTimeout(() => {
        partDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  };

  // Film Viewer Controls
  const stopScanCamera = () => {
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((t) => t.stop());
      scanStreamRef.current = null;
    }
    setCamActive(false);
  };

  const startScanCamera = async () => {
    setScanCamErr('');
    try {
      stopScanCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      scanStreamRef.current = stream;
      setFilmUrl('');
      setCamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setScanCamErr('Camera permission denied or unavailable. Upload Film use karein.');
    }
  };

  const loadScanImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    stopScanCamera();
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFilmUrl(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(f);
  };

  const scanFilterStyle = useMemo(() => {
    let filter = `brightness(${scanBright}%) contrast(${scanContrast}%)`;
    if (scanMode === 'xray') {
      filter = `invert(1) grayscale(1) brightness(${scanBright}%) contrast(${Math.max(
        130,
        scanContrast
      )}%)`;
    } else if (scanMode === 'ultrasound') {
      filter = `grayscale(1) brightness(${scanBright}%) contrast(${Math.max(150, scanContrast)}%)`;
    }
    return {
      filter,
      transform: `scale(${scanZoom / 100})`,
    };
  }, [scanMode, scanBright, scanContrast, scanZoom]);

  const saveScanSnap = () => {
    let dataUrl = '';
    if (camActive && videoRef.current && videoRef.current.videoWidth) {
      const c = document.createElement('canvas');
      c.width = videoRef.current.videoWidth;
      c.height = videoRef.current.videoHeight;
      c.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      dataUrl = c.toDataURL('image/jpeg', 0.72);
    } else if (filmUrl) {
      dataUrl = filmUrl;
    }
    if (!dataUrl) {
      onNotify('Camera on karein ya film photo upload karein.', 'error');
      return;
    }
    const next: SavedPhoto[] = [
      { id: Date.now(), url: dataUrl, date: new Date().toLocaleDateString() },
      ...savedPhotos,
    ].slice(0, 6);
    setSavedPhotos(next);
    writeStorageJson('saved_med_photos', next);
    onNotify('Film photo saved in Saved Scan & Prescription Photos!', 'success');
  };

  // Optical Pulse Demo
  const stopOpticalPulse = () => {
    if (pulseIntRef.current) {
      clearInterval(pulseIntRef.current);
      pulseIntRef.current = null;
    }
    if (pulseStreamRef.current) {
      pulseStreamRef.current.getTracks().forEach((t) => t.stop());
      pulseStreamRef.current = null;
    }
  };

  const startOpticalPulse = async () => {
    try {
      stopOpticalPulse();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      pulseStreamRef.current = stream;
      const v = document.createElement('video');
      v.srcObject = stream;
      v.playsInline = true;
      await v.play();
      const canvas = pulseCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      const samples: number[] = [];
      const start = performance.now();
      setPulseOut('Finger on camera... 10s...');
      pulseIntRef.current = setInterval(() => {
        if (!ctx || !canvas) return;
        ctx.drawImage(v, 0, 0, 80, 60);
        const d = ctx.getImageData(0, 0, 80, 60).data;
        let r = 0;
        for (let k = 0; k < d.length; k += 4) r += d[k];
        samples.push(r / (d.length / 4));
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed < 10) {
          setPulseOut(`Measuring... ${Math.ceil(10 - elapsed)}s`);
          return;
        }
        stopOpticalPulse();
        let pk = 0;
        for (let k = 2; k < samples.length - 2; k++) {
          if (
            samples[k] > samples[k - 1] &&
            samples[k] > samples[k + 1] &&
            samples[k] > samples[k - 2]
          ) {
            pk++;
          }
        }
        const bpm = Math.min(130, Math.max(55, Math.round((pk / 10) * 60 * 0.55) || 74));
        setPulseOut(`Experimental Demo Only: ~${bpm} bpm`);
      }, 100);
    } catch {
      setPulseOut('Camera unavailable — log real Pulse/BP below.');
    }
  };

  // Drug Interaction
  const checkDrugInteraction = () => {
    const pair = [drugA, drugB].sort().join('+');
    let cls = 'text-emerald-300';
    let text = '✅ No major clash; confirm with doctor.';
    if (drugA === drugB) {
      cls = 'text-rose-300';
      text = '🔴 Same medicine twice = OVERDOSE!';
    } else if (pair.includes('ibuprofen') && pair.includes('dengue')) {
      cls = 'text-rose-300';
      text = '🚨 Dengue mein Brufen mana hai! Sirf Paracetamol lein.';
    } else if (pair.includes('levothyroxine') && pair.includes('iron')) {
      cls = 'text-amber-300';
      text = '⚠️ Thyrox aur Iron mein 4 GHANTE ka gap rakhein.';
    } else if (pair.includes('ibuprofen') && pair.includes('kidney')) {
      cls = 'text-rose-300';
      text = '🚨 Kidney patients should NOT take Brufen!';
    }
    setInteractionOut({ cls, text });
    onSpeak(text.replace(/[🚨🔴⚠️✅]/g, ''));
  };

  // Child Dose
  const calcChildDose = () => {
    const kg = parseFloat(childKg);
    if (!kg || kg <= 0 || kg > 60) {
      onNotify('Enter valid child weight between 2 and 60 kg.', 'error');
      return;
    }
    const mg = Math.round(kg * 12.5);
    const ml = ((mg / syrupStrength) * 5).toFixed(1);
    const txt = `Guide (${kg} kg): Paracetamol ~${mg} mg (~${ml} ml of ${syrupStrength}mg/5ml syrup) every 6h. <3 months = Doctor!`;
    setChildDoseOut(txt);
    onSpeak(txt);
  };

  // Smart Alarms
  const addSmartAlarm = () => {
    if (!alarmMedName.trim()) {
      onNotify('Enter medicine name for alarm.', 'error');
      return;
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const next: SmartAlarm[] = [
      ...alarms,
      {
        id: Date.now(),
        med: alarmMedName.trim(),
        time: alarmTime,
        pr: alarmPrayer,
        lastRang: '',
      },
    ];
    setAlarms(next);
    writeStorageJson('smart_alarms', next);
    setAlarmMedName('');
    voiceEngine.playAlarmChime();
    onNotify('Medicine alarm added!', 'success');
  };

  // Emergency QR ID
  const generateHealthIdCard = () => {
    const canvas = idCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const name = idName.trim() || 'Patient';
    const al = idAllergy.trim() || 'None';
    const ph = idPhone.trim() || '+923015500379';

    const gr = ctx.createLinearGradient(0, 0, 440, 190);
    gr.addColorStop(0, '#881337');
    gr.addColorStop(1, '#0f172a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 440, 190);
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 432, 182);
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('🚨 EMERGENCY MEDICAL ID — NOOR HARAM', 16, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Name: ${name.slice(0, 22)}`, 16, 60);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Blood: ${idBlood}`, 16, 92);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Info: ${al.slice(0, 28)}`, 16, 122);
    ctx.fillText(`Call: ${ph.slice(0, 22)}`, 16, 148);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Scan QR for Emergency Profile', 16, 174);
    drawRealQrCode(ctx, `MED|${name}|${idBlood}|${al}|${ph}`, 318, 46, 106);
    setIdGenerated(true);
  };

  const downloadHealthIdCard = () => {
    if (!idGenerated) generateHealthIdCard();
    setTimeout(() => {
      const canvas = idCanvasRef.current;
      if (!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'Emergency_Health_ID.png';
      a.click();
    }, 30);
  };

  // Expiry Tracker
  const addExpiryMed = () => {
    if (!expMedName.trim() || !expDate) {
      onNotify('Enter medicine name and expiry date.', 'error');
      return;
    }
    const next = [...expiryMeds, { id: Date.now(), n: expMedName.trim(), d: expDate }];
    setExpiryMeds(next);
    writeStorageJson('expiry_meds', next);
    setExpMedName('');
  };

  // Family Sync Code
  const generateFamilySyncCode = (): string => {
    const d: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== 'custom_bg_image' && k !== 'custom_app_icon') {
        const val = localStorage.getItem(k);
        if (val !== null) d[k] = val;
      }
    }
    const json = JSON.stringify(d);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const code = 'NH26:' + btoa(binary);
    setSyncCode(code);
    setSyncStatus(
      `✅ Sync Code Ready (${code.length} chars) — Copy ya WhatsApp se doosre phone par bhejein!`
    );
    return code;
  };

  const copyFamilySync = () => {
    const txt = syncCode.trim() || generateFamilySyncCode();
    navigator.clipboard?.writeText(txt).catch(() => {});
    setSyncStatus('📋 Sync Code Copy ho gaya! Doosre phone mein paste kar ke Apply dabayein.');
  };

  const applyFamilySync = () => {
    const code = syncCode.trim();
    if (!code.startsWith('NH26:')) {
      onNotify('Valid NH26: Sync Code paste karein.', 'error');
      return;
    }
    try {
      const bin = atob(code.slice(5));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const json = new TextDecoder().decode(bytes);
      const obj = JSON.parse(json) as Record<string, string>;
      Object.keys(obj).forEach((k) => localStorage.setItem(k, obj[k]));
      setSyncStatus('✅ Family Data Successfully Synced!');
      onSyncApplied();
      onSpeak('Family health data sync ho gaya hai.');
    } catch {
      onNotify('Invalid sync code format.', 'error');
    }
  };

  // Physio Coach
  const startPhysioDrill = (txt: string, secs: number) => {
    if (physioIntRef.current) clearInterval(physioIntRef.current);
    onSpeak(txt);
    let s = secs;
    setPhysioStatus(`Running: ${s}s`);
    physioIntRef.current = setInterval(() => {
      s--;
      if (s <= 0) {
        if (physioIntRef.current) clearInterval(physioIntRef.current);
        setPhysioStatus('✅ Complete!');
        voiceEngine.playTone();
      } else {
        setPhysioStatus(`Running: ${s}s`);
      }
    }, 1000);
  };

  // Vitals Analysis
  const analyzeVitals = () => {
    const temp = parseFloat(tempVal);
    const sys = parseInt(bpSysVal, 10);
    const dia = parseInt(bpDiaVal, 10);
    const sug = parseInt(sugarVal, 10);
    const pul = parseInt(pulseVal, 10);
    const spo = parseInt(spo2Val, 10);

    if (
      isNaN(temp) &&
      (isNaN(sys) || isNaN(dia)) &&
      isNaN(sug) &&
      isNaN(pul) &&
      isNaN(spo)
    ) {
      onNotify('Enter at least one reading (Temp, BP, Sugar, Pulse, or SpO2).', 'error');
      return;
    }

    const msg: Array<{ cls: string; text: string }> = [];
    const sum: string[] = [];
    if (!isNaN(temp)) {
      sum.push(`Temp: ${temp}°F`);
      msg.push({
        cls: temp >= 100.4 ? 'text-amber-300' : 'text-emerald-300',
        text: temp >= 100.4 ? `🌡️ Fever (${temp}°F)` : `🌡️ Normal (${temp}°F)`,
      });
    }
    if (!isNaN(sys) && !isNaN(dia)) {
      sum.push(`BP: ${sys}/${dia}`);
      msg.push({
        cls: sys >= 140 || dia >= 90 ? 'text-amber-300' : 'text-emerald-300',
        text:
          sys >= 140 || dia >= 90
            ? `❤️ High BP (${sys}/${dia})`
            : `❤️ Normal BP (${sys}/${dia})`,
      });
    }
    if (!isNaN(sug)) {
      sum.push(`Sugar: ${sug}`);
      msg.push({
        cls: sug >= 200 || sug < 70 ? 'text-rose-300' : 'text-emerald-300',
        text:
          sug >= 200 || sug < 70
            ? `🩸 Alert Sugar (${sug})`
            : `🩸 Sugar: ${sug} mg/dL`,
      });
    }
    if (!isNaN(pul)) {
      sum.push(`Pulse: ${pul}`);
      msg.push({ cls: 'text-emerald-300', text: `💓 Pulse: ${pul} bpm` });
    }
    if (!isNaN(spo)) {
      sum.push(`SpO2: ${spo}%`);
      msg.push({
        cls: spo < 92 ? 'text-rose-300' : 'text-emerald-300',
        text: `🫁 Oxygen: ${spo}%`,
      });
    }

    setVitalsResult(msg);
    const next: VitalRecord[] = [
      { time: new Date().toLocaleString(), summary: sum.join(' | ') },
      ...vitalsHistory,
    ].slice(0, 15);
    setVitalsHistory(next);
    writeStorageJson(pKey('vitals_history', profile), next);
  };

  // Water, Sleep, BMI, Pregnancy EDD
  const changeWater = (delta: number) => {
    const next = Math.max(0, waterCount + delta);
    setWaterCount(next);
    writeStorageJson(pKey('water_tracker', profile), {
      date: new Date().toDateString(),
      count: next,
    });
  };

  const resetWater = () => {
    setWaterCount(0);
    writeStorageJson(pKey('water_tracker', profile), {
      date: new Date().toDateString(),
      count: 0,
    });
  };

  const calculateSleep = () => {
    if (!wakeTime) return;
    const [h, m] = wakeTime.split(':').map(Number);
    const w = new Date();
    w.setHours(h, m, 0, 0);
    const fmt = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSleepOut(
      `Sleep: ${fmt(new Date(w.getTime() - 465 * 60000))} (7.5h) / ${fmt(
        new Date(w.getTime() - 555 * 60000)
      )} (9h)`
    );
  };

  const calculateBMI = () => {
    const w = parseFloat(bmiKg);
    const h = parseFloat(bmiCm);
    if (!w || !h) return;
    const bmi = Number((w / (h / 100) ** 2).toFixed(1));
    const cat =
      bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    setBmiOut(`BMI: ${bmi} (${cat})`);
  };

  const calculatePregnancyEdd = () => {
    if (!lmpDate) return;
    const l = new Date(lmpDate);
    const edd = new Date(l.getTime() + 280 * 86400000);
    const df = Math.floor((Date.now() - l.getTime()) / 86400000);
    setPregEddOut(`EDD: ${edd.toDateString()} (${Math.floor(df / 7)}w ${df % 7}d)`);
  };

  // 4-7-8 Breathing
  const stopBreathing = () => {
    if (breathIntRef.current) clearInterval(breathIntRef.current);
    breathIntRef.current = null;
    setBreathPhase('Taiyar Hain?');
    setBreathTimer(0);
  };

  const startBreathing = () => {
    stopBreathing();
    const steps = [
      { n: 'Inhale', s: 4 },
      { n: 'Hold', s: 7 },
      { n: 'Exhale', s: 8 },
    ];
    let i = 0;
    let c = 4;
    setBreathPhase(steps[0].n);
    setBreathTimer(c);
    breathIntRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        i = (i + 1) % 3;
        c = steps[i].s;
        setBreathPhase(steps[i].n);
      }
      setBreathTimer(c);
    }, 1000);
  };

  const vitalsWaHref = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(
    `Assalam-o-Alaikum, Noor Haram Report (${profile}):\n${
      vitalsHistory[0] ? `${vitalsHistory[0].time}: ${vitalsHistory[0].summary}` : 'No vitals logged'
    }`
  )}`;

  const waSyncHref = `https://wa.me/?text=${encodeURIComponent(
    `Noor Haram Family Health Sync Code (Copy & Paste in App):\n${(
      syncCode || ''
    ).slice(0, 1800)}`
  )}`;

  return (
    <div className="space-y-4">
      {/* INTERACTIVE HUMAN BODY MAP */}
      <section
        id="sec-bodymap"
        className="theme-surface border-2 border-emerald-400/45 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-emerald-300">
              🗺️ Interactive Human Body Map
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">
              Kisi bhi organ par tap karein — medicines, dose, operation aur voice dekhein!
            </p>
          </div>
          <div className="flex gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setBodyLayer('front')}
              className={`px-2.5 py-1.5 rounded-xl font-bold ${
                bodyLayer === 'front'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-600'
              }`}
            >
              🧍 Front
            </button>
            <button
              type="button"
              onClick={() => setBodyLayer('back')}
              className={`px-2.5 py-1.5 rounded-xl font-bold ${
                bodyLayer === 'back'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-600'
              }`}
            >
              🦴 Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3 flex justify-center">
            {bodyLayer === 'front' ? (
              <svg viewBox="0 0 260 400" className="w-48 sm:w-52 h-auto select-none">
                <circle cx="130" cy="42" r="28" fill="#1e293b" stroke="#34d399" strokeWidth="2" className="body-hotspot" onClick={() => selectBodyPartById('brain')} />
                <text x="130" y="46" fontSize="10" fill="#fde68a" textAnchor="middle" pointerEvents="none">🧠 Brain</text>
                <circle cx="118" cy="34" r="5" fill="#38bdf8" className="body-hotspot" onClick={() => selectBodyPartById('eyes')} />
                <circle cx="142" cy="34" r="5" fill="#38bdf8" className="body-hotspot" onClick={() => selectBodyPartById('eyes')} />
                <rect x="116" y="72" width="28" height="22" rx="6" fill="#334155" stroke="#a78bfa" className="body-hotspot" onClick={() => selectBodyPartById('thyroid')} />
                <rect x="76" y="96" width="108" height="142" rx="22" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                <ellipse cx="105" cy="132" rx="20" ry="26" fill="#0e7490" opacity="0.85" className="body-hotspot" onClick={() => selectBodyPartById('lungs')} />
                <ellipse cx="155" cy="132" rx="20" ry="26" fill="#0e7490" opacity="0.85" className="body-hotspot" onClick={() => selectBodyPartById('lungs')} />
                <circle cx="122" cy="136" r="14" fill="#dc2626" className="body-hotspot" onClick={() => selectBodyPartById('heart')} />
                <path d="M84,164 L132,164 L124,188 L88,186 Z" fill="#65a30d" className="body-hotspot" onClick={() => selectBodyPartById('liver')} />
                <ellipse cx="145" cy="176" rx="20" ry="14" fill="#ea580c" className="body-hotspot" onClick={() => selectBodyPartById('stomach')} />
                <ellipse cx="96" cy="196" rx="9" ry="13" fill="#b45309" className="body-hotspot" onClick={() => selectBodyPartById('kidneys')} />
                <ellipse cx="164" cy="196" rx="9" ry="13" fill="#b45309" className="body-hotspot" onClick={() => selectBodyPartById('kidneys')} />
                <rect x="102" y="198" width="56" height="32" rx="10" fill="#ca8a04" opacity="0.85" className="body-hotspot" onClick={() => selectBodyPartById('small_intestine')} />
                <circle cx="96" cy="228" r="7" fill="#e11d48" className="body-hotspot" onClick={() => selectBodyPartById('appendix')} />
                <rect x="44" y="102" width="26" height="110" rx="12" fill="#1e293b" stroke="#22c55e" className="body-hotspot" onClick={() => selectBodyPartById('arms')} />
                <rect x="190" y="102" width="26" height="110" rx="12" fill="#1e293b" stroke="#22c55e" className="body-hotspot" onClick={() => selectBodyPartById('hands')} />
                <rect x="82" y="242" width="38" height="118" rx="14" fill="#1e293b" stroke="#3b82f6" className="body-hotspot" onClick={() => selectBodyPartById('legs')} />
                <rect x="140" y="242" width="38" height="118" rx="14" fill="#1e293b" stroke="#3b82f6" className="body-hotspot" onClick={() => selectBodyPartById('legs')} />
                <ellipse cx="101" cy="372" rx="18" ry="10" fill="#059669" className="body-hotspot" onClick={() => selectBodyPartById('feet')} />
                <ellipse cx="159" cy="372" rx="18" ry="10" fill="#059669" className="body-hotspot" onClick={() => selectBodyPartById('feet')} />
              </svg>
            ) : (
              <svg viewBox="0 0 260 400" className="w-48 sm:w-52 h-auto select-none">
                <circle cx="130" cy="42" r="28" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" className="body-hotspot" onClick={() => selectBodyPartById('hair')} />
                <rect x="76" y="96" width="108" height="142" rx="22" fill="#0f172a" stroke="#64748b" strokeWidth="2" className="body-hotspot" onClick={() => selectBodyPartById('shoulders')} />
                <rect x="118" y="88" width="24" height="145" rx="8" fill="#475569" stroke="#f8fafc" className="body-hotspot" onClick={() => selectBodyPartById('back_spine')} />
                <rect x="82" y="242" width="96" height="45" rx="12" fill="#5b21b6" opacity="0.7" className="body-hotspot" onClick={() => selectBodyPartById('hips')} />
              </svg>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-emerald-300">⚡ Quick Tap Organs (Oper &amp; Andar):</div>
            <div className="flex flex-wrap gap-1.5">
              {quickOrgans.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectBodyPartById(id)}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-600 px-2.5 py-1.5 rounded-xl"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 40 BODY PARTS */}
      <section className="theme-surface rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-emerald-300">
            👤 {strings.anatomyTitle}
          </h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              [
                ['all', 'All (40)'],
                ['external', '🧍 Oper'],
                ['internal', '🫀 Andar'],
              ] as const
            ).map(([zone, lbl]) => (
              <button
                key={zone}
                type="button"
                onClick={() => setBodyZoneFilter(zone)}
                className={`px-2.5 py-1 rounded-xl font-bold ${
                  bodyZoneFilter === zone
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 border border-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-200 mb-3">{strings.anatomySub}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 mb-4">
          {filteredBodyParts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectBodyPartById(p.id)}
              className="bg-slate-950/75 border border-slate-700 hover:border-emerald-400 rounded-2xl p-2.5 transition flex flex-col items-center text-center group"
            >
              <span className="text-[9px] px-1.5 rounded bg-slate-800 text-emerald-300 mb-1">
                {p.zone === 'external' ? 'Oper' : 'Andar'}
              </span>
              <img
                src={makeSvgBadge(p.icon, p.name.split(' ')[0], p.color)}
                alt={p.name}
                className="w-12 h-12 rounded-xl border border-slate-600 mb-1.5 group-hover:scale-105 transition"
              />
              <span className="text-[11px] font-bold leading-tight text-slate-100">{p.name}</span>
            </button>
          ))}
        </div>

        {selectedPart && (
          <div
            ref={partDetailRef}
            className="bg-slate-950/90 border border-emerald-400/50 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <img
                src={makeSvgBadge(
                  selectedPart.icon,
                  selectedPart.name.split(' ')[0],
                  selectedPart.color
                )}
                alt={selectedPart.name}
                className="w-20 h-20 rounded-2xl border border-emerald-400/50 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded">
                      {selectedPart.zone === 'external'
                        ? '🧍 Bahar / Oper (External)'
                        : '🫀 Andarooni (Internal)'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-emerald-300 mt-1">
                      {selectedPart.icon} {selectedPart.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSpeak(
                          `${selectedPart.name}. ${selectedPart.diseases}. ${selectedPart.meds}. ${selectedPart.op}`
                        )
                      }
                      className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl"
                    >
                      🔊 {strings.listenBtn}
                    </button>
                    <a
                      href={`https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${selectedPart.query}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-900 border border-slate-600 text-sky-300 font-semibold text-xs px-3 py-1.5 rounded-xl"
                    >
                      🌐 {strings.onlineLabel}
                    </a>
                  </div>
                </div>
                <p className="text-xs">
                  <strong>{strings.problemLabel}</strong> {selectedPart.diseases}
                </p>
                <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 rounded-xl p-3">
                  <img
                    src={makeSvgBadge(selectedPart.medIcon, selectedPart.medName, '#0284c7')}
                    alt={selectedPart.medName}
                    className="w-14 h-14 rounded-xl border border-sky-400/40 shrink-0"
                  />
                  <div className="text-xs min-w-0">
                    <strong className="text-sky-300 block mb-0.5">
                      {strings.solutionLabel} {selectedPart.medName}
                    </strong>
                    <span>{selectedPart.meds}</span>
                  </div>
                </div>
                <div className="bg-indigo-950/60 border border-indigo-400/40 rounded-xl p-3 text-xs text-indigo-100">
                  <strong className="text-indigo-300 block mb-0.5">🏥 {strings.opLabel}</strong>
                  <span>{selectedPart.op}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 24 OPERATIONS, SCANS & BABY CARE */}
      <section className="theme-surface border border-indigo-400/45 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-sm sm:text-base font-extrabold text-indigo-300">
            🏥 Operations, Scans &amp; Baby Care Hub (24 Guides)
          </h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              [
                ['all', 'All'],
                ['operation', '🏥 Operations'],
                ['scan', '🩻 Scans'],
                ['baby', '👶 Baby'],
              ] as const
            ).map(([cat, lbl]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGuideFilter(cat)}
                className={`px-2.5 py-1 rounded-xl font-bold ${
                  guideFilter === cat
                    ? 'bg-indigo-500 text-slate-950'
                    : 'bg-slate-900 border border-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredGuides.map((g) => (
            <div
              key={g.title}
              className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3 flex gap-3 items-start"
            >
              <img
                src={makeSvgBadge(g.icon, g.title.split(' ')[1] || g.title.split(' ')[0], g.color)}
                alt={g.title}
                className="w-14 h-14 rounded-xl border border-slate-600 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="text-xs font-bold text-indigo-300">{g.title}</h3>
                <p className="text-[11px] text-slate-200">{g.desc}</p>
                <div className="text-[11px] text-emerald-200 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-1.5">
                  💊 {g.meds}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSpeak(`${g.title}. ${g.desc}. ${g.meds}`)}
                    className="bg-sky-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg"
                  >
                    🔊 Voice
                  </button>
                  <a
                    href={`https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${g.query}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 border border-slate-600 text-sky-300 text-[10px] px-2.5 py-1 rounded-lg"
                  >
                    🌐 Online
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOSPITAL X-RAY & ULTRASOUND FILM VIEWER, EYE & HEARING */}
      <section
        id="sec-film"
        className="theme-surface border-2 border-cyan-400/50 rounded-3xl p-4 sm:p-5 space-y-3 no-print"
      >
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-cyan-300">
            🩻 Hospital X-Ray &amp; Ultrasound Film Viewer, Eye &amp; Hearing
          </h2>
          <div className="mt-2 bg-amber-950/50 border border-amber-400/50 rounded-xl p-2.5 text-[11px] text-amber-100">
            <strong>⚠️ 2026 Sachai:</strong> Mobile camera se real X-Ray, Ultrasound, Blood Test, BP ya Baby Boy/Girl check NAHI hota. Yeh sirf aapki hospital film ko zoom aur invert kar ke saaf dekhne ke liye hai.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2.5">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-xs font-bold text-sky-300">📸 Film &amp; Report Viewer</h3>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={startScanCamera}
                  className="inline-flex items-center gap-1 bg-cyan-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Camera On
                </button>
                <label className="cursor-pointer bg-slate-900 border border-slate-600 px-2.5 py-1.5 rounded-lg flex items-center">
                  🖼️ Upload Film
                  <input type="file" accept="image/*" onChange={loadScanImageFile} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={stopScanCamera}
                  className="bg-slate-700 px-2.5 py-1.5 rounded-lg"
                >
                  ⏹ Off
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setScanMode('normal')}
                className={`px-2.5 py-1 rounded-lg ${
                  scanMode === 'normal'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-600'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setScanMode('xray')}
                className={`px-2.5 py-1 rounded-lg ${
                  scanMode === 'xray' ? 'bg-indigo-500 text-white font-bold' : 'bg-indigo-600/70'
                }`}
              >
                🩻 X-Ray Invert
              </button>
              <button
                type="button"
                onClick={() => setScanMode('ultrasound')}
                className={`px-2.5 py-1 rounded-lg ${
                  scanMode === 'ultrasound' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-teal-600/70'
                }`}
              >
                📡 Ultrasound
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanMode('normal');
                  setScanBright(100);
                  setScanContrast(100);
                  setScanZoom(100);
                }}
                className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-lg"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                onClick={saveScanSnap}
                className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg"
              >
                💾 Save
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300">
              <label>
                Brightness ({scanBright}%)
                <input
                  type="range"
                  min={50}
                  max={180}
                  value={scanBright}
                  onChange={(e) => setScanBright(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </label>
              <label>
                Contrast ({scanContrast}%)
                <input
                  type="range"
                  min={70}
                  max={200}
                  value={scanContrast}
                  onChange={(e) => setScanContrast(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </label>
              <label>
                Zoom ({scanZoom}%)
                <input
                  type="range"
                  min={100}
                  max={220}
                  value={scanZoom}
                  onChange={(e) => setScanZoom(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </label>
            </div>

            <div className="relative bg-black/75 border border-slate-700 rounded-xl min-h-[160px] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={scanFilterStyle}
                className={`${camActive ? 'block' : 'hidden'} w-full max-h-56 object-contain transition`}
              />
              {filmUrl && !camActive && (
                <img
                  src={filmUrl}
                  alt="Scan Film"
                  style={scanFilterStyle}
                  className="w-full max-h-56 object-contain transition"
                />
              )}
              {!camActive && !filmUrl && (
                <div className="text-center p-4 text-xs text-slate-400">
                  Hospital X-Ray ya Ultrasound film dikhane ke liye Camera on karein ya photo upload karein.
                </div>
              )}
            </div>
            {scanCamErr && <div className="text-[11px] text-rose-400">{scanCamErr}</div>}
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Snellen Eye &amp; Color Plate
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    onSpeak('Read eye chart letters from 40 cm and check number 12 in green circle.')
                  }
                  className="bg-sky-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg"
                >
                  🔊 Voice
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white text-slate-950 rounded-xl p-2 text-center font-mono font-bold">
                  <div className="text-lg">E</div>
                  <div className="text-sm tracking-widest">F P</div>
                  <div className="text-xs tracking-widest">T O Z</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-14 h-14">
                    <circle cx="50" cy="50" r="46" fill="#22c55e" opacity="0.85" />
                    <text
                      x="50"
                      y="60"
                      fontSize="34"
                      fontWeight="bold"
                      fill="#dc2626"
                      textAnchor="middle"
                    >
                      12
                    </text>
                  </svg>
                  <span className="text-[10px] text-slate-300">Plate: 12</span>
                </div>
              </div>
              <div className="flex gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    setEyeCheckStatus(
                      `Logged (${new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}): Clear at 40cm`
                    )
                  }
                  className="bg-emerald-600/80 px-2.5 py-1.5 rounded-lg"
                >
                  ✅ Clear
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEyeCheckStatus(
                      `Logged (${new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}): Blurry`
                    )
                  }
                  className="bg-amber-600/80 px-2.5 py-1.5 rounded-lg"
                >
                  ⚠️ Blurry
                </button>
              </div>
              {eyeCheckStatus && <div className="text-[11px] text-emerald-300">{eyeCheckStatus}</div>}
            </div>

            <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex flex-wrap justify-between items-center gap-1">
                <strong className="text-indigo-300">👂 Hearing Tone &amp; 💓 Optical Demo</strong>
                <button
                  type="button"
                  onClick={startOpticalPulse}
                  className="bg-rose-500 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                >
                  ❤️ 10s Demo
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  [250, '250Hz'],
                  [1000, '1kHz'],
                  [4000, '4kHz'],
                  [8000, '8kHz'],
                ].map(([hz, label]) => (
                  <button
                    key={String(hz)}
                    type="button"
                    onClick={() => {
                      voiceEngine.playTone(Number(hz), 0.7);
                      setPulseOut(`Playing ${label}...`);
                    }}
                    className="bg-indigo-600 px-2.5 py-1 rounded-lg text-[11px]"
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={stopOpticalPulse}
                  className="bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-lg text-[11px]"
                >
                  Stop
                </button>
              </div>
              <div className="text-[11px] text-cyan-300">{pulseOut}</div>
              <canvas ref={pulseCanvasRef} width={80} height={60} className="hidden" />
            </div>
          </div>
        </div>
      </section>

      {/* 42 DISEASES */}
      <section id="sec-diseases" className="theme-surface border border-rose-400/40 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-sm sm:text-base font-extrabold text-rose-300">
            🦠 42 Old &amp; New Diseases (Medicines + Voice)
          </h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              [
                ['all', 'All'],
                ['new', '🆕 New'],
                ['chronic', '🫀 Chronic'],
                ['common', '🤒 Common'],
              ] as const
            ).map(([dt, lbl]) => (
              <button
                key={dt}
                type="button"
                onClick={() => setDiseaseFilter(dt)}
                className={`px-2.5 py-1 rounded-xl font-bold ${
                  diseaseFilter === dt
                    ? 'bg-rose-500 text-slate-950'
                    : 'bg-slate-900 border border-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDiseases.map((d) => (
            <div
              key={d.name}
              className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3 flex gap-3 items-start"
            >
              <img
                src={makeSvgBadge(d.icon, d.name.split(' ')[0], d.color)}
                alt={d.name}
                className="w-14 h-14 rounded-xl border border-slate-600 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="text-xs font-bold text-rose-300">{d.name}</h3>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 shrink-0">
                    {d.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200">
                  <strong>Symptoms:</strong> {d.symptoms}
                </p>
                <div className="text-[11px] text-emerald-200 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-1.5">
                  💊 {d.med}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSpeak(`${d.name}. Symptoms: ${d.symptoms}. Medicine: ${d.med}`)
                    }
                    className="bg-sky-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg"
                  >
                    🔊 Voice
                  </button>
                  <a
                    href={`https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${d.query}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 border border-slate-600 text-sky-300 text-[10px] px-2.5 py-1 rounded-lg"
                  >
                    🌐 Online
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 37,800+ FEATURES CATALOG */}
      <section id="sec-catalog" className="theme-surface border border-emerald-400/45 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-emerald-300">
            🌟 37,800+ Health, 2026 &amp; +2,100 Power Tools Explorer
          </h2>
          <span className="text-xs bg-emerald-950/80 text-emerald-200 px-2.5 py-1 rounded-xl border border-emerald-500/40 tabular-nums">
            {filteredCatalog.length.toLocaleString()} Active
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {['ALL', ...catalogCategories].map((c) => {
            const act = catalogCat === c;
            const cnt =
              c === 'ALL'
                ? catalogItems.length
                : catalogItems.filter((i) => i.cat === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCatalogCat(c)}
                className={`text-[11px] px-2.5 py-1 rounded-xl border ${
                  act
                    ? 'bg-emerald-400 text-slate-950 font-bold border-emerald-300'
                    : 'bg-slate-900/75 border-slate-600 text-slate-100'
                }`}
              >
                {c === 'ALL'
                  ? `🌟 All (${cnt.toLocaleString()})`
                  : `${c} (${cnt.toLocaleString()})`}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
          {catalogSlice.map((it, idx) => (
            <div
              key={`${it.title}_${idx}`}
              className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="text-[10px] text-emerald-300 font-semibold">{it.cat}</div>
                <div className="text-xs font-bold mt-0.5 text-slate-100">{it.title}</div>
                <div className="text-[11px] text-slate-300 mt-1">{it.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => onSpeak(`${it.title}. ${it.desc}`)}
                className="self-start bg-sky-500/20 border border-sky-400/50 text-sky-200 text-[10px] px-2.5 py-1 rounded-lg"
              >
                🔊 Speak
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-700">
          <button
            type="button"
            disabled={safeCatalogPage <= 1}
            onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
            className="bg-slate-900 border border-slate-600 disabled:opacity-40 px-3 py-1.5 rounded-xl"
          >
            ← Prev
          </button>
          <span className="tabular-nums">
            Page {safeCatalogPage.toLocaleString()} / {totalCatalogPages.toLocaleString()}
          </span>
          <button
            type="button"
            disabled={safeCatalogPage >= totalCatalogPages}
            onClick={() => setCatalogPage((p) => Math.min(totalCatalogPages, p + 1))}
            className="bg-slate-900 border border-slate-600 disabled:opacity-40 px-3 py-1.5 rounded-xl"
          >
            Next →
          </button>
        </div>
      </section>

      {/* INTERACTION CHECKER & CHILD DOSE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="theme-surface rounded-3xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-amber-300">⚡ 2-Medicine Interaction Checker</h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={drugA}
              onChange={(e) => setDrugA(e.target.value)}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2 text-xs"
            >
              <option value="paracetamol">Paracetamol</option>
              <option value="ibuprofen">Ibuprofen</option>
              <option value="aspirin">Aspirin</option>
              <option value="omeprazole">Omeprazole</option>
              <option value="clopidogrel">Clopidogrel</option>
              <option value="levothyroxine">Thyrox</option>
              <option value="iron">Iron</option>
            </select>
            <select
              value={drugB}
              onChange={(e) => setDrugB(e.target.value)}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2 text-xs"
            >
              <option value="ibuprofen">Ibuprofen</option>
              <option value="paracetamol">Paracetamol</option>
              <option value="aspirin">Aspirin</option>
              <option value="dengue">Suspected Dengue</option>
              <option value="kidney">Kidney Problem</option>
              <option value="iron">Iron / Milk</option>
            </select>
          </div>
          <button
            type="button"
            onClick={checkDrugInteraction}
            className="w-full bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl"
          >
            🔍 Check &amp; Speak
          </button>
          {interactionOut && (
            <div className="text-xs p-2.5 rounded-xl bg-slate-950/85 border border-slate-700">
              <span className={`${interactionOut.cls} font-semibold`}>{interactionOut.text}</span>
            </div>
          )}
        </div>

        <div className="theme-surface rounded-3xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-cyan-300">👶 Child Paracetamol Weight Guide</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={childKg}
              onChange={(e) => setChildKg(e.target.value)}
              placeholder="Weight (kg)"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2 text-xs"
            />
            <select
              value={syrupStrength}
              onChange={(e) => setSyrupStrength(parseInt(e.target.value, 10))}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2 text-xs"
            >
              <option value={120}>120mg/5ml</option>
              <option value={250}>250mg/5ml Forte</option>
            </select>
          </div>
          <button
            type="button"
            onClick={calcChildDose}
            className="w-full bg-cyan-400 text-slate-950 font-bold text-xs py-2 rounded-xl"
          >
            💊 Estimate &amp; Speak
          </button>
          {childDoseOut && (
            <div className="text-xs p-2.5 rounded-xl bg-slate-950/85 border border-slate-700">
              <strong className="text-cyan-300">💊 {childDoseOut}</strong>
            </div>
          )}
        </div>
      </section>

      {/* LIVE GRAPHS & NAMAZ ALARMS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="theme-surface border border-cyan-400/50 rounded-3xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Live BP &amp; Sugar Graph
            </h3>
            <span className="text-[11px] text-slate-300 tabular-nums">
              {vitalsHistory.length} entries
            </span>
          </div>
          <canvas
            ref={vitalsChartRef}
            width={440}
            height={160}
            className="w-full h-auto bg-slate-950/80 border border-slate-700 rounded-xl"
          />
          <p className="text-[11px] text-slate-300">🔴 BP Sys &bull; 🟢 BP Dia &bull; 🟡 Sugar</p>
        </div>

        <div className="theme-surface border border-amber-400/50 rounded-3xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Bell className="w-4 h-4" />
              Sound Alarm &amp; Namaz Reminder
            </h3>
            <button
              type="button"
              onClick={() => voiceEngine.playAlarmChime()}
              className="bg-slate-900 border border-slate-600 text-[11px] px-2.5 py-1 rounded-xl"
            >
              🔔 Ring
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <input
              value={alarmMedName}
              onChange={(e) => setAlarmMedName(e.target.value)}
              placeholder="Medicine"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
            <select
              value={alarmPrayer}
              onChange={(e) => setAlarmPrayer(e.target.value)}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            >
              <option>Exact Time</option>
              <option>Fajr / Sehri</option>
              <option>Zuhr</option>
              <option>Asr</option>
              <option>Maghrib / Iftari</option>
              <option>Isha / Raat</option>
            </select>
            <button
              type="button"
              onClick={addSmartAlarm}
              className="bg-amber-400 text-slate-950 font-bold rounded-xl p-2"
            >
              + Set
            </button>
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto text-xs">
            {alarms.length === 0 ? (
              <div className="text-slate-400">No alarms set.</div>
            ) : (
              alarms.map((a) => (
                <div
                  key={a.id}
                  className="bg-slate-950/75 border border-slate-700 rounded-lg px-2.5 py-1 flex justify-between"
                >
                  <span>
                    ⏰ <strong>{a.med}</strong> — <span className="tabular-nums">{a.time}</span> (
                    {a.pr})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = alarms.filter((x) => x.id !== a.id);
                      setAlarms(next);
                      writeStorageJson('smart_alarms', next);
                    }}
                    className="text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SCANNABLE QR ID & EXPIRY TRACKER */}
      <section id="sec-idcard" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="theme-surface border border-rose-400/50 rounded-3xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
            <QrCode className="w-4 h-4" />
            Emergency Medical ID &amp; Scannable QR Card
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              value={idName}
              onChange={(e) => setIdName(e.target.value)}
              placeholder="Name"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
            <select
              value={idBlood}
              onChange={(e) => setIdBlood(e.target.value)}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            >
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <input
              value={idAllergy}
              onChange={(e) => setIdAllergy(e.target.value)}
              placeholder="Allergies / Sugar / BP"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
            <input
              value={idPhone}
              onChange={(e) => setIdPhone(e.target.value)}
              placeholder="Emergency Phone"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={generateHealthIdCard}
              className="flex-1 bg-rose-500 text-slate-950 font-bold text-xs py-2 rounded-xl"
            >
              🪪 Generate Scannable QR
            </button>
            <button
              type="button"
              onClick={downloadHealthIdCard}
              className="inline-flex items-center gap-1 bg-slate-900 border border-slate-600 text-xs px-3 py-2 rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </button>
          </div>
          <canvas
            ref={idCanvasRef}
            width={440}
            height={190}
            className={`${idGenerated ? 'block' : 'hidden'} w-full h-auto rounded-xl border border-rose-400/50`}
          />
        </div>

        <div className="theme-surface border border-lime-400/50 rounded-3xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-lime-300">📦 Medicine Expiry Date Tracker</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
            <input
              value={expMedName}
              onChange={(e) => setExpMedName(e.target.value)}
              placeholder="Medicine"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl p-2"
            />
            <button
              type="button"
              onClick={addExpiryMed}
              className="bg-lime-400 text-slate-950 font-bold rounded-xl p-2"
            >
              + Save
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
            {expiryMeds.length === 0 ? (
              <div className="text-slate-400">No medicines tracked.</div>
            ) : (
              expiryMeds.map((m) => {
                const days = Math.ceil((new Date(m.d).getTime() - Date.now()) / 86400000);
                return (
                  <div
                    key={m.id}
                    className="bg-slate-950/75 border border-slate-700 rounded-lg px-2.5 py-1 flex justify-between"
                  >
                    <span>
                      💊 {m.n} ({m.d}) —{' '}
                      {days < 0 ? (
                        <span className="text-rose-400 font-bold">EXPIRED!</span>
                      ) : days <= 30 ? (
                        <span className="text-amber-300 font-bold tabular-nums">{days}d left</span>
                      ) : (
                        <span className="text-emerald-300 tabular-nums">{days}d</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = expiryMeds.filter((x) => x.id !== m.id);
                        setExpiryMeds(next);
                        writeStorageJson('expiry_meds', next);
                      }}
                      className="text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* MULTI-PHONE FAMILY SYNC CODE & OFFLINE CACHE */}
      <section id="sec-familysync" className="grid grid-cols-1 lg:grid-cols-2 gap-4 no-print">
        <div className="theme-surface border border-indigo-400/50 rounded-3xl p-4 space-y-2.5 text-xs">
          <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Multi-Phone Family Sync Code (Ammi / Abbu / Baby)
          </h3>
          <p className="text-[11px] text-slate-200">
            Bina login ke ek phone ka saara local health data (Vitals, Alarms, Notes, Vaccines) doosre phone par bhejein:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={generateFamilySyncCode}
              className="bg-indigo-500 text-slate-950 font-bold px-3 py-2 rounded-xl"
            >
              📤 Generate Sync Code
            </button>
            <button
              type="button"
              onClick={copyFamilySync}
              className="bg-slate-900 border border-slate-600 px-3 py-2 rounded-xl"
            >
              📋 Copy
            </button>
            <a
              href={waSyncHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!syncCode.trim()) generateFamilySyncCode();
              }}
              className="bg-green-600 text-white font-bold px-3 py-2 rounded-xl"
            >
              💬 WhatsApp Sync
            </a>
          </div>
          <textarea
            rows={2}
            value={syncCode}
            onChange={(e) => setSyncCode(e.target.value)}
            placeholder="Yahan doosre phone ka NH26: Sync Code paste karein..."
            className="w-full bg-slate-950/85 border border-slate-600 rounded-xl p-2 text-[11px] font-mono"
          />
          <button
            type="button"
            onClick={applyFamilySync}
            className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl"
          >
            📥 Apply &amp; Sync Data
          </button>
          {syncStatus && <div className="text-[11px] text-emerald-300">{syncStatus}</div>}
        </div>

        <div id="sec-pwa" className="theme-surface border border-emerald-400/50 rounded-3xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-emerald-300">
              📲 Offline Phone Storage &amp; Home Screen Guide
            </h3>
            <span className="text-[10px] bg-emerald-950 border border-emerald-400/50 text-emerald-200 px-2 py-0.5 rounded-xl">
              {offlineSavedAt ? '✅ Saved Locally' : 'Ready'}
            </span>
          </div>
          <p className="text-[11px] text-slate-200">
            Aapka Vitals, Medicine Schedule, Alarms, aur Clinical Guides browser local storage mein save rehte hain aur bina internet bhi kaam karte hain.
          </p>
          <button
            type="button"
            onClick={() => {
              const iso = new Date().toISOString();
              localStorage.setItem('offline_cache_ready', iso);
              setOfflineSavedAt(iso);
              onSpeak('Offline health data phone mein mehfooz ho gaya hai.');
              onNotify('Local offline cache verified.', 'success');
            }}
            className="bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl"
          >
            ⚡ Verify Offline Local Storage
          </button>
          <div className="text-[11px] text-amber-200 bg-slate-950/75 border border-slate-700 rounded-xl p-2.5">
            <strong>Android Chrome:</strong> Menu (⋮) → <em>Add to Home screen / Install app</em>.<br />
            <strong>iPhone Safari:</strong> Share (↑) → <em>Add to Home Screen</em>.
          </div>
        </div>
      </section>

      {/* PHYSIO COACH */}
      <section className="theme-surface border border-teal-400/50 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm sm:text-base font-extrabold text-teal-300">
            🧘 Animated Physiotherapy Coach (Voice)
          </h2>
          <span className="text-xs font-mono text-amber-300 tabular-nums">{physioStatus}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
          {[
            [
              '🐈',
              'Kamar',
              'Kamar Dard Cat-Cow Stretch: Haath aur ghutno par aakar kamar ko dheere upar aur neeche karein 30 seconds.',
              30,
            ],
            [
              '🧣',
              'Gardan',
              'Gardan Chin Tuck: Seedhe baithein aur thori ko peeche kheenchein 20 seconds.',
              20,
            ],
            [
              '🦿',
              'Ghutna',
              'Ghutna Quad Lift: Kursi par baith kar taang seedhi uthayein aur 5 second rokein.',
              30,
            ],
            [
              '🏋️',
              'Kandha',
              'Kandha Pendulum: Aage jhuk kar baazu ko dheela ghumayein.',
              25,
            ],
          ].map(([emoji, title, script, sec]) => (
            <button
              key={String(title)}
              type="button"
              onClick={() => startPhysioDrill(String(script), Number(sec))}
              className="bg-slate-950/75 border border-slate-700 hover:border-teal-400 rounded-2xl p-3"
            >
              <div className="text-3xl physio-anim">{emoji}</div>
              <div className="font-bold text-teal-300 mt-1">{title}</div>
            </button>
          ))}
        </div>
      </section>

      {/* EMERGENCY HELPLINES */}
      <section className="theme-surface rounded-3xl p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-extrabold text-rose-300 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          {strings.emergTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
          {[
            ['1122', 'Rescue PK'],
            ['115', 'Edhi PK'],
            ['1020', 'Chhipa PK'],
            ['112', 'EU / Global'],
            ['911', 'USA'],
          ].map(([num, label], i) => (
            <a
              key={num}
              href={`tel:${num}`}
              className={`bg-rose-950/60 border border-rose-500/40 p-3 rounded-2xl hover:border-rose-400 ${
                i === 4 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <div className="text-lg font-bold text-rose-300 tabular-nums">{num}</div>
              <div className="text-[11px]">{label}</div>
            </a>
          ))}
        </div>
      </section>

      {/* COMPLETE VITALS CHECKER */}
      <section id="sec-vitals" className="theme-surface rounded-3xl p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-extrabold text-cyan-300 mb-3 flex items-center gap-2">
          <HeartPulse className="w-4 h-4" />
          Complete Vitals Checker (Temp, BP, Sugar, Pulse, SpO2)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3">
          <div>
            <label className="block text-[11px] mb-1">Temp (°F)</label>
            <input
              type="number"
              step="0.1"
              value={tempVal}
              onChange={(e) => setTempVal(e.target.value)}
              placeholder="98.6"
              className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] mb-1">BP Sys</label>
            <input
              type="number"
              value={bpSysVal}
              onChange={(e) => setBpSysVal(e.target.value)}
              placeholder="120"
              className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] mb-1">BP Dia</label>
            <input
              type="number"
              value={bpDiaVal}
              onChange={(e) => setBpDiaVal(e.target.value)}
              placeholder="80"
              className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] mb-1">Sugar</label>
            <input
              type="number"
              value={sugarVal}
              onChange={(e) => setSugarVal(e.target.value)}
              placeholder="100"
              className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] mb-1">Pulse</label>
            <input
              type="number"
              value={pulseVal}
              onChange={(e) => setPulseVal(e.target.value)}
              placeholder="72"
              className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] mb-1">SpO2 (%)</label>
            <input
              type="number"
              value={spo2Val}
              onChange={(e) => setSpo2Val(e.target.value)}
              placeholder="98"
              className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={analyzeVitals}
            className="bg-cyan-500 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl"
          >
            Check &amp; Save
          </button>
          <a
            href={vitalsWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl"
          >
            📲 WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(pKey('vitals_history', profile));
              setVitalsHistory([]);
              setVitalsResult([]);
            }}
            className="bg-slate-900 border border-slate-600 text-xs px-3 py-2.5 rounded-xl"
          >
            Clear
          </button>
        </div>

        {vitalsResult.length > 0 && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs space-y-1.5">
            {vitalsResult.map((r, i) => (
              <div key={i} className={r.cls}>
                {r.text}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          {vitalsHistory.map((item, i) => (
            <div
              key={`${item.time}_${i}`}
              className="text-xs bg-slate-950/75 border border-slate-700 rounded-xl px-3 py-1.5 flex flex-wrap justify-between gap-1 text-slate-200 tabular-nums"
            >
              <span>{item.summary}</span>
              <span className="text-slate-400">{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WATER, SLEEP, BMI, PREGNANCY EDD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <section className="theme-surface rounded-3xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-sky-300 tabular-nums">
            💧 Water ({waterCount}/8)
          </h2>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => changeWater(1)}
              className="flex-1 bg-sky-500 text-slate-950 font-bold text-xs py-2 rounded-xl"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => changeWater(-1)}
              className="bg-slate-900 border border-slate-600 text-xs px-3 py-2 rounded-xl"
            >
              -1
            </button>
            <button
              type="button"
              onClick={resetWater}
              className="bg-slate-900 border border-slate-600 text-xs px-3 py-2 rounded-xl"
            >
              0
            </button>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-sky-400 h-full transition-all"
              style={{ width: `${Math.min(100, (waterCount / 8) * 100)}%` }}
            />
          </div>
        </section>

        <section className="theme-surface rounded-3xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-indigo-300">😴 Sleep</h2>
          <div className="flex gap-2">
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="flex-1 min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={calculateSleep}
              className="bg-indigo-500 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-xl"
            >
              Go
            </button>
          </div>
          {sleepOut && (
            <div className="text-[11px] bg-slate-950/80 p-2 rounded-xl tabular-nums">{sleepOut}</div>
          )}
        </section>

        <section className="theme-surface rounded-3xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-teal-300">⚖️ BMI</h2>
          <div className="flex gap-1.5">
            <input
              type="number"
              value={bmiKg}
              onChange={(e) => setBmiKg(e.target.value)}
              placeholder="kg"
              className="w-1/2 min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2 py-1.5 text-xs"
            />
            <input
              type="number"
              value={bmiCm}
              onChange={(e) => setBmiCm(e.target.value)}
              placeholder="cm"
              className="w-1/2 min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2 py-1.5 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={calculateBMI}
            className="w-full bg-teal-500 text-slate-950 font-semibold text-xs py-2 rounded-xl"
          >
            Go
          </button>
          {bmiOut && (
            <div className="text-[11px] bg-slate-950/80 p-2 rounded-xl tabular-nums">{bmiOut}</div>
          )}
        </section>

        <section className="theme-surface rounded-3xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-pink-300">🤰 Pregnancy EDD</h2>
          <input
            type="date"
            value={lmpDate}
            onChange={(e) => setLmpDate(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={calculatePregnancyEdd}
            className="w-full bg-pink-500 text-slate-950 font-semibold text-xs py-2 rounded-xl"
          >
            Check
          </button>
          {pregEddOut && (
            <div className="text-[11px] bg-slate-950/80 p-2 rounded-xl tabular-nums">
              {pregEddOut}
            </div>
          )}
        </section>
      </div>

      {/* BREATHING & DOCTORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="theme-surface rounded-3xl p-4 text-center space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-amber-300">🧘‍♂️ 4-7-8 Breathing</h2>
          <div className="text-base font-bold text-emerald-300">{breathPhase}</div>
          <div className="text-3xl font-mono tabular-nums">{breathTimer}</div>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={startBreathing}
              className="bg-emerald-500 text-slate-950 font-semibold text-xs px-4 py-2 rounded-xl"
            >
              Start
            </button>
            <button
              type="button"
              onClick={stopBreathing}
              className="bg-slate-900 border border-slate-600 text-xs px-4 py-2 rounded-xl"
            >
              Stop
            </button>
          </div>
        </section>

        <section className="theme-surface rounded-3xl p-4">
          <h2 className="text-sm sm:text-base font-bold text-yellow-300 mb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4" />
            Doctor Contacts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Name"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2.5 py-2 text-xs"
            />
            <input
              type="tel"
              value={docPhone}
              onChange={(e) => setDocPhone(e.target.value)}
              placeholder="Phone"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2.5 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!docName.trim() || !docPhone.trim()) return;
                const next = [...doctors, { id: Date.now(), n: docName.trim(), p: docPhone.trim() }];
                setDoctors(next);
                writeStorageJson('doc_contacts', next);
                setDocName('');
                setDocPhone('');
              }}
              className="bg-yellow-400 text-slate-950 font-semibold text-xs py-2 rounded-xl"
            >
              + Save
            </button>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {doctors.map((c) => (
              <div
                key={c.id}
                className="bg-slate-950/75 border border-slate-700 rounded-xl px-2.5 py-1.5 flex justify-between text-xs"
              >
                <span>
                  {c.n} (
                  <a href={`tel:${c.p}`} className="text-emerald-300 underline">
                    {c.p}
                  </a>
                  )
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = doctors.filter((x) => x.id !== c.id);
                    setDoctors(next);
                    writeStorageJson('doc_contacts', next);
                  }}
                  className="text-rose-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* SCHEDULE & SAVED PHOTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="theme-surface rounded-3xl p-4">
          <h2 className="text-sm sm:text-base font-bold text-indigo-300 mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4" />
            Daily Medicine Schedule
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              value={schedName}
              onChange={(e) => setSchedName(e.target.value)}
              placeholder="Medicine"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2.5 py-2 text-xs"
            />
            <input
              type="text"
              value={schedTime}
              onChange={(e) => setSchedTime(e.target.value)}
              placeholder="Time"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2.5 py-2 text-xs"
            />
            <input
              type="text"
              value={schedDose}
              onChange={(e) => setSchedDose(e.target.value)}
              placeholder="Dose"
              className="min-w-0 bg-slate-950/80 border border-slate-600 rounded-xl px-2.5 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!schedName.trim()) return;
                const next: ScheduleMed[] = [
                  ...medSchedule,
                  {
                    id: Date.now(),
                    name: schedName.trim(),
                    time: schedTime.trim() || 'Daily',
                    dose: schedDose.trim() || '1x',
                    taken: false,
                  },
                ];
                setMedSchedule(next);
                writeStorageJson('med_schedule', next);
                setSchedName('');
              }}
              className="bg-indigo-500 text-slate-950 font-semibold text-xs py-2 rounded-xl"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {medSchedule.map((m) => (
              <div
                key={m.id}
                className="bg-slate-950/75 border border-slate-700 rounded-xl px-2.5 py-1.5 flex justify-between text-xs"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.taken}
                    onChange={() => {
                      const next = medSchedule.map((x) =>
                        x.id === m.id ? { ...x, taken: !x.taken } : x
                      );
                      setMedSchedule(next);
                      writeStorageJson('med_schedule', next);
                    }}
                  />
                  <span className={m.taken ? 'line-through text-slate-500' : ''}>
                    {m.name} ({m.dose}) - {m.time}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = medSchedule.filter((x) => x.id !== m.id);
                    setMedSchedule(next);
                    writeStorageJson('med_schedule', next);
                  }}
                  className="text-rose-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="theme-surface rounded-3xl p-4 no-print">
          <h2 className="text-sm sm:text-base font-bold text-violet-300 mb-2">
            📷 Saved Scan &amp; Prescription Photos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {savedPhotos.length === 0 ? (
              <div className="text-xs text-slate-400 col-span-2 sm:col-span-3">
                Camera Film Viewer photos save here.
              </div>
            ) : (
              savedPhotos.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950/75 border border-slate-700 rounded-xl p-1.5"
                >
                  <img src={p.url} alt="Saved Scan" className="w-full h-20 object-cover rounded" />
                  <div className="flex justify-between text-[10px] mt-1">
                    <span>{p.date}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = savedPhotos.filter((x) => x.id !== p.id);
                        setSavedPhotos(next);
                        writeStorageJson('saved_med_photos', next);
                      }}
                      className="text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* CHILD EPI VACCINES */}
      <section className="theme-surface rounded-3xl p-4">
        <h2 className="text-sm sm:text-base font-bold text-lime-300 mb-2 flex items-center gap-1.5">
          <Baby className="w-4 h-4" />
          Child Vaccination Checklist (EPI)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {vaccineSchedule.map((v) => (
            <label
              key={v.id}
              className="bg-slate-950/75 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(vaccines[v.id])}
                onChange={() => {
                  const next = { ...vaccines, [v.id]: !vaccines[v.id] };
                  setVaccines(next);
                  writeStorageJson('vaccine_checks', next);
                }}
                className="accent-lime-500"
              />
              <span className={vaccines[v.id] ? 'line-through text-lime-300' : ''}>
                {v.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* HEALTH NOTE */}
      <section className="theme-surface rounded-3xl p-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-100 mb-2">
          📝 {strings.noteTitle}
        </h2>
        <textarea
          rows={3}
          value={healthNote}
          onChange={(e) => setHealthNote(e.target.value)}
          className="w-full bg-slate-950/75 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100"
          placeholder="Write doctor notes..."
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(pKey('health_note', profile), healthNote);
              setNoteSavedFlag(true);
              setTimeout(() => setNoteSavedFlag(false), 2000);
            }}
            className="bg-slate-900 border border-slate-600 hover:bg-slate-800 text-xs font-semibold px-4 py-2 rounded-xl"
          >
            {strings.saveBtn}
          </button>
          <button
            type="button"
            onClick={() => onSpeak(healthNote || 'No note saved yet.')}
            className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Listen Note
          </button>
          {noteSavedFlag && <span className="text-xs text-emerald-300">Saved!</span>}
        </div>
      </section>
    </div>
  );
};
