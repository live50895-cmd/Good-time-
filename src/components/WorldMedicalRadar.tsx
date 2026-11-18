import React, { useState } from 'react';
import {
  ExternalLink,
  Globe,
  RefreshCw,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { I18nStrings } from '../data/themesAndLangs';
import { GroundedSource } from '../types/health';

interface WorldMedicalRadarProps {
  currentLang: string;
  langDisplayName: string;
  strings: I18nStrings;
  onSpeak: (text: string, skipTranslate?: boolean) => void;
  onSaveToAi: (text: string) => void;
  onJumpToGoogleDocs: () => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

const WORLD_PRESETS: Array<{ label: string; query: string }> = [
  {
    label: 'Diabetes & Sugar 2026',
    query: '2026 WHO FDA latest diabetes sugar treatments CGM guidelines GLP-1 safety',
  },
  {
    label: 'BP & Heart 2026',
    query: '2026 global hypertension blood pressure heart care clinical guidelines',
  },
  {
    label: 'Dengue & Vaccines 2026',
    query: '2026 WHO dengue fever management warning signs and new global vaccines',
  },
  {
    label: 'AI Wearables & Telehealth',
    query: '2026 worldwide patient smart health monitoring AI triage wearables standards',
  },
  {
    label: 'Foreign Med -> Salt Finder',
    query: 'Panadol Extra, Augmentin, Glucophage, Lipitor, Risek generic salt global brand equivalents',
  },
];

export const WorldMedicalRadar: React.FC<WorldMedicalRadarProps> = ({
  langDisplayName,
  strings,
  onSpeak,
  onSaveToAi,
  onJumpToGoogleDocs,
  onNotify,
}) => {
  const [query, setQuery] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [sources, setSources] = useState<GroundedSource[]>([]);
  const [lastTopic, setLastTopic] = useState<string>('');

  const runWorldCheck = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) {
      onNotify('Enter a medicine brand, disease, or 2026 medical update topic.', 'error');
      return;
    }
    if (overrideQuery) setQuery(overrideQuery);
    setLastTopic(q);
    setBusy(true);

    try {
      const res = await fetch('/api/ai/world-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          targetLangName: langDisplayName,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        summary?: string;
        sources?: GroundedSource[];
        offlineFallback?: boolean;
        error?: string;
      };
      if (!res.ok || !json.summary) {
        onNotify(json.error || 'Unable to fetch global 2026 medical check right now.', 'error');
        return;
      }
      setSummary(json.summary);
      setSources(json.sources || []);
      onSaveToAi(`🌍 2026 WORLD MEDICAL CHECK (${q}):\n${json.summary}`);
      onSpeak(json.summary, !json.offlineFallback);
      onNotify(`2026 Global check complete (${langDisplayName})`, 'success');
    } catch {
      onNotify('Network error while checking global 2026 medical updates.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="sec-world-radar"
      className="theme-surface border-2 border-cyan-400/55 rounded-3xl p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-cyan-300">
              {strings.worldRadarTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200">{strings.worldRadarSub}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 px-2.5 py-1 rounded-xl whitespace-nowrap">
          Live Google Search &bull; {langDisplayName}
        </span>
      </div>

      {/* 1-Tap Global Presets */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {WORLD_PRESETS.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={busy}
            onClick={() => runWorldCheck(item.query)}
            className="bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/45 text-cyan-100 font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition"
          >
            🌍 {item.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runWorldCheck();
            }}
            placeholder="e.g. Mounjaro, Ozempic, 2026 Dengue vaccine, foreign medicine brand..."
            className="w-full bg-slate-950/85 border border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="button"
          onClick={() => runWorldCheck()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl whitespace-nowrap"
        >
          {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? 'Checking World...' : strings.launchWorld}
        </button>
      </div>

      {/* Output Summary */}
      {summary && (
        <div className="bg-slate-950/85 border border-cyan-400/40 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-xs text-cyan-300 truncate">
              🌐 {lastTopic.slice(0, 70)}
            </strong>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSpeak(summary, true)}
                className="inline-flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {strings.listenBtn}
              </button>
              <button
                type="button"
                onClick={onJumpToGoogleDocs}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-sky-400/50 text-sky-200 font-semibold text-[11px] px-2.5 py-1 rounded-lg"
              >
                📄 Save in Docs
              </button>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-100 whitespace-pre-line leading-relaxed">
            {summary}
          </div>

          {sources.length > 0 && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-[11px]">
              <span className="text-cyan-300 font-bold">Verified Sources:</span>
              {sources.map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline text-sky-300 hover:text-sky-200 truncate max-w-[240px]"
                >
                  {src.title} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
