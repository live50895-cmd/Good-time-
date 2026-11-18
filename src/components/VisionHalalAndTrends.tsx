import React, { useMemo, useState } from 'react';
import {
  Activity,
  Camera,
  CheckCircle2,
  FileText,
  Pill,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Utensils,
  Volume2,
} from 'lucide-react';
import { I18nStrings } from '../data/themesAndLangs';
import {
  ProfileId,
  ScheduleMed,
  VitalRecord,
  VisionScanResult,
} from '../types/health';
import { compressImageFile, pKey, readStorageJson } from '../utils/qrAndStorage';

interface VisionHalalAndTrendsProps {
  profile: ProfileId;
  langDisplayName: string;
  strings: I18nStrings;
  medSchedule: ScheduleMed[];
  onSpeak: (txt: string, skipTranslate?: boolean) => void;
  onSaveBriefingToAi: (text: string) => void;
  onJumpToGoogleDocs: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

export const VisionHalalAndTrends: React.FC<VisionHalalAndTrendsProps> = ({
  profile,
  langDisplayName,
  strings,
  medSchedule,
  onSpeak,
  onSaveBriefingToAi,
  onJumpToGoogleDocs,
  onNotify,
}) => {
  const [scanType, setScanType] = useState<
    'meal' | 'halal' | 'medicine' | 'xray' | 'ultrasound' | 'bp_report'
  >('meal');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<VisionScanResult | null>(null);
  const [scanError, setScanError] = useState<string>('');

  const [trendBusy, setTrendBusy] = useState<boolean>(false);
  const [trendBriefing, setTrendBriefing] = useState<string>('');

  const vitals = useMemo(
    () => readStorageJson<VitalRecord[]>(pKey('vitals_history', profile), []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, scanResult, trendBriefing]
  );

  const scheduleStats = useMemo(() => {
    const total = medSchedule.length;
    const taken = medSchedule.filter((m) => m.taken).length;
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { total, taken, pct };
  }, [medSchedule]);

  const profileContextSummary = useMemo(() => {
    const latestVitals = vitals.slice(0, 5).map((v) => `${v.time}: ${v.summary}`).join(' | ') || 'None';
    const meds = medSchedule.map((m) => `${m.name} (${m.dose} @ ${m.time})`).join(', ') || 'None';
    const note = localStorage.getItem(pKey('health_note', profile)) || '';
    return `Profile: ${profile.toUpperCase()} | Recent Vitals: ${latestVitals} | Active Meds: ${meds}${
      note ? ` | Notes: ${note}` : ''
    }`;
  }, [profile, vitals, medSchedule]);

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    setScanError('');
    setScanResult(null);
    setScanning(true);

    compressImageFile(f, 1024, 0.82, async (dataUrl) => {
      setPreviewUrl(dataUrl);
      try {
        const res = await fetch('/api/ai/vision-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            scanType,
            languageName: langDisplayName,
            activeMeds: medSchedule.map((m) => m.name),
            profileContext: profileContextSummary,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          scan?: VisionScanResult;
          error?: string;
        };
        if (!res.ok || !json.scan) {
          setScanError(
            json.error ||
              'Vision scan ke liye Settings > Secrets mein GEMINI_API_KEY zaroori hai.'
          );
          return;
        }
        setScanResult(json.scan);
        onSaveBriefingToAi(
          `📸 ${scanType.toUpperCase()} SCAN — ${json.scan.title} [${json.scan.verdict}]\n${json.scan.recommendation}`
        );
        onSpeak(json.scan.speakSummary, true);
        onNotify(`${json.scan.title} scanned!`, 'success');
      } catch {
        setScanError('Network error while scanning image.');
      } finally {
        setScanning(false);
      }
    });
  };

  const generateTrendBriefing = async () => {
    setTrendBusy(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze my longitudinal health data and give a structured doctor-visit briefing with dietary, medication-timing, and warning guidance:\n${profileContextSummary}`,
          languageName: langDisplayName,
          mode: 'trends',
          profileContext: profileContextSummary,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (json.reply) {
        setTrendBriefing(json.reply);
        onSaveBriefingToAi(json.reply);
        onSpeak(json.reply);
        onNotify('AI Health Trend Briefing generated!', 'success');
      } else {
        const offlineSummary = [
          `📊 Profile Briefing (${profile.toUpperCase()})`,
          `• Logged Vitals Count: ${vitals.length}`,
          vitals[0] ? `• Latest Reading: ${vitals[0].time} — ${vitals[0].summary}` : '• No vitals logged yet — log BP/Sugar below.',
          `• Today's Meds Adherence: ${scheduleStats.taken}/${scheduleStats.total} (${scheduleStats.pct}%)`,
          'Tip: Connect GEMINI_API_KEY in Settings > Secrets for deep personalized clinical trend commentary.',
        ].join('\n');
        setTrendBriefing(offlineSummary);
        onSaveBriefingToAi(offlineSummary);
        if (json.error) onNotify(json.error, 'info');
      }
    } catch {
      onNotify('Unable to generate trend briefing right now.', 'error');
    } finally {
      setTrendBusy(false);
    }
  };

  return (
    <section
      id="sec-vision"
      className="theme-surface border-2 border-indigo-400/50 rounded-3xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-indigo-300">
              {strings.visionTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300">
              {strings.visionSub}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 3-in-1 Vision Scanner */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-700 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setScanType('meal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap ${
                scanType === 'meal'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              Meal &amp; Diabetic Plate
            </button>
            <button
              type="button"
              onClick={() => setScanType('halal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap ${
                scanType === 'halal'
                  ? 'bg-amber-400 text-slate-950 border-amber-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Halal &amp; E-Numbers
            </button>
            <button
              type="button"
              onClick={() => setScanType('medicine')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap ${
                scanType === 'medicine'
                  ? 'bg-sky-500 text-slate-950 border-sky-300'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              Strip + Conflict Check
            </button>
            <button
              type="button"
              onClick={() => setScanType('xray')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap ${
                scanType === 'xray'
                  ? 'bg-indigo-400 text-slate-950 border-indigo-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              🩻 X-Ray / CT
            </button>
            <button
              type="button"
              onClick={() => setScanType('ultrasound')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap ${
                scanType === 'ultrasound'
                  ? 'bg-teal-400 text-slate-950 border-teal-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              📡 Ultrasound
            </button>
            <button
              type="button"
              onClick={() => setScanType('bp_report')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap ${
                scanType === 'bp_report'
                  ? 'bg-rose-400 text-slate-950 border-rose-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              🩺 BP / 100+ Lab
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-xs">
            <div className="min-w-0 flex-1 text-slate-300">
              {scanType === 'meal' && (
                <span>Khane ki plate ki photo upload karein — Calories, Sugar &amp; BP safety report paayein.</span>
              )}
              {scanType === 'halal' && (
                <span>Product ingredients ya barcode/E-number label ki photo dein — Halal/Haram/Mashbooh check karein.</span>
              )}
              {scanType === 'medicine' && (
                <span>
                  Dawai patti ya syrup scan karein — aapki {medSchedule.length} scheduled dawaiyon se interaction check hogi.
                </span>
              )}
              {scanType === 'xray' && (
                <span>Hospital X-Ray, CT ya MRI film ki photo dein — AI wazahat aur doctor verification tips sunein.</span>
              )}
              {scanType === 'ultrasound' && (
                <span>Ultrasound / Echo / Sonography report ki photo upload karein — measurements ka asaan tarjuma sunein.</span>
              )}
              {scanType === 'bp_report' && (
                <span>BP monitor screen, sugar meter, ECG ya 100+ Lab blood/urine report ki photo scan karein.</span>
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl shrink-0 whitespace-nowrap">
              <Camera className="w-4 h-4" />
              {scanning ? 'Scanning...' : 'Upload / Snap Photo'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleVisionUpload}
                className="hidden"
              />
            </label>
          </div>

          {scanError && (
            <div className="text-xs bg-amber-950/70 border border-amber-500/50 text-amber-200 rounded-xl p-2.5">
              {scanError}
            </div>
          )}

          {(previewUrl || scanResult) && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/70 border border-slate-700 rounded-2xl p-3">
              {previewUrl && (
                <div className="sm:col-span-4">
                  <img
                    src={previewUrl}
                    alt="Scanned subject"
                    className="w-full h-40 object-cover rounded-xl border border-slate-600"
                  />
                </div>
              )}
              <div className={previewUrl ? 'sm:col-span-8 space-y-2 text-xs' : 'sm:col-span-12 space-y-2 text-xs'}>
                {scanning && (
                  <div className="text-indigo-300 font-semibold">
                    Analyzing image with Gemini Vision...
                  </div>
                )}
                {scanResult && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-white">{scanResult.title}</strong>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-extrabold text-[11px] border ${
                          /HARAM|AVOID/i.test(scanResult.verdict)
                            ? 'bg-rose-950 text-rose-200 border-rose-400'
                            : /CAUTION|MASHBOOH/i.test(scanResult.verdict)
                              ? 'bg-amber-950 text-amber-200 border-amber-400'
                              : 'bg-emerald-950 text-emerald-200 border-emerald-400'
                        }`}
                      >
                        {scanResult.verdict}
                      </span>
                    </div>

                    {scanResult.metrics.length > 0 && (
                      <div className="text-[11px] text-indigo-200 font-mono tabular-nums">
                        {scanResult.metrics.join(' · ')}
                      </div>
                    )}

                    <div className="space-y-1 text-slate-200">
                      {scanResult.findings.map((f, i) => (
                        <div key={i}>• {f}</div>
                      ))}
                    </div>

                    <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-2 text-emerald-200">
                      <strong>Advice:</strong> {scanResult.recommendation}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSpeak(scanResult.speakSummary, true)}
                        className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen
                      </button>
                      <button
                        type="button"
                        onClick={onJumpToGoogleDocs}
                        className="inline-flex items-center gap-1 bg-slate-800 border border-sky-400/40 text-sky-200 font-semibold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Save in Google Docs
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Profile Health Intelligence & AI Trend Briefing */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-700 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Live Profile Health Summary ({profile.toUpperCase()})
              </div>
              <button
                type="button"
                onClick={generateTrendBriefing}
                disabled={trendBusy}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] px-3 py-1.5 rounded-xl whitespace-nowrap"
              >
                {trendBusy ? 'Analyzing...' : 'AI Trend Briefing'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">VITALS LOGS</div>
                <div className="text-base font-extrabold font-mono tabular-nums text-sky-300">
                  {vitals.length}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">SCHEDULED MEDS</div>
                <div className="text-base font-extrabold font-mono tabular-nums text-amber-300">
                  {scheduleStats.total}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">TODAY TAKEN</div>
                <div className="text-base font-extrabold font-mono tabular-nums text-emerald-300">
                  {scheduleStats.pct}%
                </div>
              </div>
            </div>

            {vitals[0] ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400">{vitals[0].time}:</span>{' '}
                  <strong>{vitals[0].summary}</strong>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-400">
                No vitals recorded yet for {profile.toUpperCase()}. Log BP, Sugar, SpO2 or Temp in Vitals Logger below to unlock personalized AI clinical trend briefings.
              </div>
            )}

            {trendBriefing && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 max-h-48 overflow-y-auto whitespace-pre-line text-slate-100 leading-relaxed">
                {trendBriefing}
              </div>
            )}
          </div>

          {trendBriefing && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onSpeak(trendBriefing)}
                className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold text-[11px] px-2.5 py-1.5 rounded-lg"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen Briefing
              </button>
              <button
                type="button"
                onClick={onJumpToGoogleDocs}
                className="inline-flex items-center gap-1 bg-slate-800 border border-sky-400/50 text-sky-200 font-semibold text-[11px] px-2.5 py-1.5 rounded-lg"
              >
                <FileText className="w-3.5 h-3.5" />
                Save to Google Docs
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
