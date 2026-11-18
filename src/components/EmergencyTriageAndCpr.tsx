import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  HeartPulse,
  MapPin,
  PhoneCall,
  Play,
  ShieldAlert,
  Square,
  Volume2,
} from 'lucide-react';
import { I18nStrings, WHATSAPP_NUM } from '../data/themesAndLangs';
import { ProfileId, TriageResult } from '../types/health';

interface EmergencyTriageAndCprProps {
  profile: ProfileId;
  langDisplayName: string;
  strings: I18nStrings;
  profileContext: string;
  onSpeak: (txt: string) => void;
  onSaveTriageToAi: (summary: string) => void;
  onJumpToGoogleDocs: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

const OFFLINE_EMERGENCY_REGEX =
  /chest\s*pain|seenay\s*dard|heart\s*attack|saans\s*nahi|unconscious|behosh|fits|jhatkay|stroke|falij|bleeding|khoon|snake|saanp|poison|zeher|suicidal|choking|gala\s*band|platelets?\s*(?:1|2|3|4)\d{4}|sugar\s*(?:4|5|6)\d/i;

function runOfflineTriage(symptoms: string): TriageResult {
  const isCritical = OFFLINE_EMERGENCY_REGEX.test(symptoms);
  if (isCritical) {
    return {
      urgency: 'EMERGENCY',
      headline: 'Fori 1122 / 911 Call Karein ya Hospital Emergency Jayein!',
      redFlags: [
        'Chest pain, left arm/jaw pain, sweating, ya breathing difficulty.',
        'Sudden face droop, slurred speech, arm weakness, ya behoshi.',
        'Active heavy bleeding, low sugar <70 mg/dL, ya platelets <50,000.',
      ],
      immediateSteps: [
        'Patient ko aaram se lita dein (agar saans mein dikkat ho to 45° bitha dein).',
        'Tang kapde (collar/belt) dheelay karein aur taaza hawa dein.',
        'Agar hosh mein aur Low Sugar (<70) ho to fori meetha pani/glucose dein; warna kuch khilayein pilayein nahi.',
        'Emergency ambulance 1122 / 115 / 911 ko call karein aur nazdeeki ER pohanchein.',
      ],
      avoidMistakes: [
        'Behosh mareez ke munh mein pani, chaye ya goli hargiz na daalein.',
        'Chest pain ko sirf "gas" samajh kar ghar par waqt zaya na karein.',
        'Bina doctor ke mashware ke aspirin/painkiller injection khud na lagayein.',
      ],
      medicineGuidance:
        'Hospital ER doctor/ECG ke bina delay na karein. Agar doctor ne pehle se heart/asthma emergency spray diya hai to uski hidayat follow karein.',
      speakSummary:
        'Khaternak alamaat hain! Fori 1122 ya qareebi hospital emergency jayein. Behosh mareez ko munh se kuch na pilayein aur hawa dein.',
    };
  }
  return {
    urgency: 'URGENT',
    headline: 'Aaj hi Doctor ya Clinic par Checkup Karwayein',
    redFlags: [
      'Agar bukhar 103°F+ ho, lagatar ulti aaye, ya saans tez chale to fori Emergency jayein.',
    ],
    immediateSteps: [
      'Temperature, BP aur Sugar note kar lein.',
      'Pani aur ORS ki kami na hone dein; halka khana lein.',
      'Apni purani parchi aur dawaiyan doctor ke pass saath le jayein.',
    ],
    avoidMistakes: [
      'Bina tasdeeq heavy antibiotic ya steroid injection mat lagwayein.',
    ],
    medicineGuidance:
      'Bukhar ke liye sirf safe age/weight-based Paracetamol check karein jab tak doctor muaaina na kare.',
    speakSummary:
      'Yeh alamaat doctor ke muaaine ki mutaqazi hain. Pani aur ORS jari rakhein aur agar halat bigre to fori emergency jayein.',
  };
}

export const EmergencyTriageAndCpr: React.FC<EmergencyTriageAndCprProps> = ({
  profile,
  langDisplayName,
  strings,
  profileContext,
  onSpeak,
  onSaveTriageToAi,
  onJumpToGoogleDocs,
  onNotify,
}) => {
  const [symptoms, setSymptoms] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [erMapUrl, setErMapUrl] = useState<string>(
    'https://www.google.com/maps/search/Hospital+Emergency+Near+Me'
  );

  // CPR Metronome State (110 BPM)
  const [cprRunning, setCprRunning] = useState<boolean>(false);
  const [beatCount, setBeatCount] = useState<number>(0);
  const [cprCycles, setCprCycles] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stroke FAST Check
  const [fastChecks, setFastChecks] = useState({
    face: false,
    arm: false,
    speech: false,
  });

  // WHO Child ORS Dehydration Calculator
  const [orsWeight, setOrsWeight] = useState<string>('12');
  const [orsAgeMonths, setOrsAgeMonths] = useState<string>('24');

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playTickSound = (isBreathCue: boolean) => {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isBreathCue ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isBreathCue ? 620 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isBreathCue ? 0.25 : 0.08));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isBreathCue ? 0.26 : 0.09));
    } catch {
      // ignore AudioContext restriction
    }
  };

  const toggleCprMetronome = () => {
    if (cprRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCprRunning(false);
      return;
    }
    setCprRunning(true);
    setBeatCount(1);
    playTickSound(false);
    let localBeat = 1;
    // 110 BPM = 545 ms per chest compression
    intervalRef.current = setInterval(() => {
      localBeat += 1;
      if (localBeat > 32) {
        localBeat = 1;
        setCprCycles((c) => c + 1);
      }
      setBeatCount(localBeat);
      playTickSound(localBeat > 30);
    }, 545);
  };

  const resetCpr = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCprRunning(false);
    setBeatCount(0);
    setCprCycles(0);
  };

  const runTriage = async (overrideText?: string) => {
    const q = (overrideText ?? symptoms).trim();
    if (!q) {
      onNotify('Alamaat likhein ya upar preset button dabayein.', 'error');
      return;
    }
    if (overrideText) setSymptoms(overrideText);

    setBusy(true);
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: q,
          languageName: langDisplayName,
          profileContext,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        triage?: TriageResult;
        offlineFallback?: boolean;
      };
      const result = json.triage || runOfflineTriage(q);
      setTriage(result);
      const summaryText = `🚨 TRIAGE (${result.urgency}): ${result.headline}\nSteps:\n• ${result.immediateSteps.join('\n• ')}\nAvoid:\n• ${result.avoidMistakes.join('\n• ')}`;
      onSaveTriageToAi(summaryText);
      onSpeak(result.speakSummary);
    } catch {
      const fallback = runOfflineTriage(q);
      setTriage(fallback);
      onSpeak(fallback.speakSummary);
    } finally {
      setBusy(false);
    }
  };

  const locateNearestEr = async () => {
    const ipFallback = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch('https://ipwho.is/', { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) {
          const j = (await r.json()) as {
            success?: boolean;
            latitude?: number;
            longitude?: number;
            city?: string;
          };
          if (j.success !== false && typeof j.latitude === 'number' && typeof j.longitude === 'number') {
            const lat = j.latitude.toFixed(5);
            const lng = j.longitude.toFixed(5);
            setErMapUrl(`https://www.google.com/maps/search/Hospital+Emergency/@${lat},${lng},14z`);
            onNotify(`ER Link Updated (${j.city || `${lat}, ${lng}`})`, 'success');
            return;
          }
        }
      } catch {
        // fallback cleanly
      }
      onNotify('GPS permission off hai — standard ER Map link use karein.', 'info');
    };

    if (!navigator.geolocation) {
      await ipFallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setErMapUrl(
          `https://www.google.com/maps/search/Hospital+Emergency/@${lat},${lng},14z`
        );
        onNotify(`GPS ER Link Updated (${lat}, ${lng})`, 'success');
      },
      () => {
        void ipFallback();
      },
      { timeout: 4500 }
    );
  };

  const wKg = parseFloat(orsWeight) || 0;
  const ageM = parseFloat(orsAgeMonths) || 0;
  const ors4HrMl = wKg > 0 ? Math.round(wKg * 75) : 0;
  const zincMg = ageM >= 6 ? 20 : 10;

  const fastPositive = fastChecks.face || fastChecks.arm || fastChecks.speech;

  const sosWaHref = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(
    `🚨 EMERGENCY SOS (${profile.toUpperCase()}):\nSymptoms: ${
      symptoms || 'Need immediate medical assistance'
    }\n${triage ? `Triage: ${triage.urgency} — ${triage.headline}` : ''}\n${profileContext.slice(0, 300)}`
  )}`;

  return (
    <section
      id="sec-emergency"
      className="theme-surface border-2 border-rose-500/60 rounded-3xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-rose-300">
              {strings.emergencyBannerTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300">
              {strings.emergencyBannerSub}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs shrink-0">
          <button
            type="button"
            onClick={locateNearestEr}
            className="inline-flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-rose-400/50 text-rose-200 font-semibold px-2.5 py-2 rounded-xl whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5" />
            Update GPS ER
          </button>
          <a
            href={erMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl whitespace-nowrap"
          >
            Hospital ER Map <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={sosWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-2 rounded-xl whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            WhatsApp SOS
          </a>
        </div>
      </div>

      {/* Emergency Triage Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-700 rounded-2xl p-3.5 space-y-3">
          <div className="text-xs font-bold text-rose-200">
            1. AI Emergency Symptom Triage (Fori Khatra Check)
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              ['Chest Pain + Sweating', 'Seenay mein sakht dard, pasina aur baayein bazu mein khinchao'],
              ['Low Sugar <65', 'Sugar 58 aa gayi hai, mareez ko pasina aur kanpkapi ho rahi hai'],
              ['Dengue PLT 38k', 'Tez bukhar aur aaj platelets 38000 reh gayi hain, naak se halka khoon'],
              ['Child Fits / Fever', '3 saal ke bacche ko 104 bukhar ke sath jhatkay (fits) lag rahe hain'],
              ['Choking / Saans Band', 'Khana gale mein phans gaya hai aur saans nahi aa rahi'],
              ['Snake / Dog Bite', 'Ghar ke bahar kuttay ne kaat liya hai, zakham se khoon aa raha hai'],
            ].map(([label, preset]) => (
              <button
                key={label}
                type="button"
                onClick={() => runTriage(preset)}
                className="bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-slate-100 px-2.5 py-1.5 rounded-xl whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Emergency alamaat likhein (maslan: seenay mein dard, behoshi, platelets 40000, zeher, ya jalan)..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-400"
            />
            <button
              type="button"
              onClick={() => runTriage()}
              disabled={busy}
              className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl whitespace-nowrap shrink-0"
            >
              {busy ? 'Triaging...' : 'Check Urgency Now'}
            </button>
          </div>

          {triage && (
            <div
              className={`rounded-2xl p-3.5 border space-y-2.5 text-xs ${
                triage.urgency === 'EMERGENCY'
                  ? 'bg-rose-950/70 border-rose-400 text-rose-50'
                  : triage.urgency === 'URGENT'
                    ? 'bg-amber-950/70 border-amber-400 text-amber-50'
                    : 'bg-emerald-950/70 border-emerald-400 text-emerald-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    [{triage.urgency}] {triage.headline}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSpeak(triage.speakSummary)}
                    className="inline-flex items-center gap-1 bg-white text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen
                  </button>
                  <button
                    type="button"
                    onClick={onJumpToGoogleDocs}
                    className="bg-slate-900/90 border border-white/30 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg"
                  >
                    Save Doc
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-950/60 rounded-xl p-2.5 space-y-1">
                  <div className="font-bold text-emerald-300">Do Right Now (First Aid):</div>
                  {triage.immediateSteps.map((s, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {idx + 1}. {s}
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950/60 rounded-xl p-2.5 space-y-1">
                  <div className="font-bold text-rose-300">Strictly Avoid (Ghalti Na Karein):</div>
                  {triage.avoidMistakes.map((m, idx) => (
                    <div key={idx} className="leading-relaxed">
                      • {m}
                    </div>
                  ))}
                  {triage.redFlags.length > 0 && (
                    <div className="pt-1 border-t border-white/10 text-[11px] text-amber-200">
                      <strong>Watch Red Flags:</strong> {triage.redFlags.join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] bg-slate-950/50 rounded-lg px-2.5 py-1.5 text-slate-200">
                <strong>Medicine Guidance:</strong> {triage.medicineGuidance}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live 110 BPM CPR Metronome + Stroke FAST + WHO Child ORS */}
        <div className="lg:col-span-5 space-y-3">
          {/* CPR 110 BPM Metronome */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse
                  className={`w-5 h-5 ${
                    cprRunning && beatCount <= 30 ? 'text-rose-400 scale-110' : 'text-slate-400'
                  } transition-transform`}
                />
                <div>
                  <div className="text-xs font-bold text-white">
                    Live CPR Metronome (110 BPM · 30:2)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Adult Hands-Only / Standard Compression Pacer
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={toggleCprMetronome}
                  className={`inline-flex items-center gap-1 font-bold text-xs px-3 py-1.5 rounded-xl whitespace-nowrap ${
                    cprRunning
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {cprRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {cprRunning ? 'Pause' : 'Start CPR Beat'}
                </button>
                {beatCount > 0 && (
                  <button
                    type="button"
                    onClick={resetCpr}
                    className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <div>
                <div className="text-[10px] text-slate-400">PHASE</div>
                <div
                  className={`text-xs font-extrabold ${
                    beatCount > 30 ? 'text-sky-300' : 'text-rose-300'
                  }`}
                >
                  {beatCount === 0
                    ? 'Ready'
                    : beatCount > 30
                      ? '2 Rescue Breaths'
                      : 'Push Hard & Fast'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">BEAT (1–30)</div>
                <div className="text-lg font-extrabold font-mono tabular-nums text-white">
                  {beatCount > 30 ? `${beatCount - 30}/2` : `${beatCount}/30`}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">CYCLES</div>
                <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-300">
                  {cprCycles}
                </div>
              </div>
            </div>
          </div>

          {/* Stroke FAST Check + WHO Child ORS Calculator */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3.5 space-y-3 text-xs">
            <div>
              <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Stroke (Falij) 60-Sec FAST Check
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastChecks.face}
                    onChange={(e) => setFastChecks((f) => ({ ...f, face: e.target.checked }))}
                    className="accent-rose-500"
                  />
                  <span>Face Droop</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastChecks.arm}
                    onChange={(e) => setFastChecks((f) => ({ ...f, arm: e.target.checked }))}
                    className="accent-rose-500"
                  />
                  <span>Arm Weak</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastChecks.speech}
                    onChange={(e) => setFastChecks((f) => ({ ...f, speech: e.target.checked }))}
                    className="accent-rose-500"
                  />
                  <span>Speech Slur</span>
                </label>
              </div>
              {fastPositive && (
                <div className="mt-2 bg-rose-950/80 border border-rose-400 text-rose-100 rounded-xl p-2 font-bold text-[11px]">
                  EMERGENCY: Even 1 FAST sign means possible Stroke — rush to Stroke Center ER within 4.5 hours! Do NOT give food, water, or aspirin at home.
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-2.5 space-y-2">
              <div className="font-bold text-sky-300">WHO Child ORS &amp; Zinc Dehydration Dose</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-slate-300">
                  Weight (kg)
                  <input
                    type="number"
                    min={2}
                    max={80}
                    value={orsWeight}
                    onChange={(e) => setOrsWeight(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums"
                  />
                </label>
                <label className="text-[11px] text-slate-300">
                  Age (months)
                  <input
                    type="number"
                    min={1}
                    max={144}
                    value={orsAgeMonths}
                    onChange={(e) => setOrsAgeMonths(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums"
                  />
                </label>
              </div>
              <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-2.5 text-[11px] text-slate-200 tabular-nums">
                <strong>4-Hour Rehydration Target:</strong>{' '}
                <span className="text-sky-300 font-bold">{ors4HrMl} mL ORS</span> (75 mL/kg sip-by-sip) &bull;{' '}
                <strong>Zinc:</strong>{' '}
                <span className="text-emerald-300 font-bold">{zincMg} mg/day x 10–14 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
