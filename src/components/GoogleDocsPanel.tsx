import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Trash2,
  Volume2,
  ExternalLink,
  LogOut,
  CheckCircle2,
  FilePlus2,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logoutGoogle,
} from '../services/googleAuth';
import {
  appendTextToGoogleDoc,
  createHealthGoogleDoc,
  getGoogleDocContent,
  listAppGoogleDocs,
  trashGoogleDoc,
} from '../services/googleDocs';
import { I18nStrings } from '../data/themesAndLangs';
import {
  GoogleDocContent,
  GoogleDocSummary,
  ProfileId,
  ScheduleMed,
  VitalRecord,
} from '../types/health';
import { pKey, readStorageJson } from '../utils/qrAndStorage';

interface GoogleDocsPanelProps {
  profile: ProfileId;
  strings: I18nStrings;
  lastAiText: string;
  lastParchiText: string;
  medSchedule: ScheduleMed[];
  onSpeak: (text: string) => void;
  onSendToParchi: (text: string) => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
}

type PendingAction =
  | {
      type: 'create';
      title: string;
      content: string;
    }
  | {
      type: 'append';
      docId: string;
      docTitle: string;
      content: string;
    }
  | {
      type: 'trash';
      docId: string;
      docTitle: string;
    };

export const GoogleDocsPanel: React.FC<GoogleDocsPanelProps> = ({
  profile,
  strings,
  lastAiText,
  lastParchiText,
  medSchedule,
  onSpeak,
  onSendToParchi,
  onNotify,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [docs, setDocs] = useState<GoogleDocSummary[]>([]);
  const [docIdInput, setDocIdInput] = useState<string>('');
  const [openedDoc, setOpenedDoc] = useState<GoogleDocContent | null>(null);
  const [newDocTitle, setNewDocTitle] = useState<string>(
    `Noor Haram Health Summary - ${profile.toUpperCase()} (${new Date().toLocaleDateString()})`
  );
  const [incVitals, setIncVitals] = useState<boolean>(true);
  const [incSchedule, setIncSchedule] = useState<boolean>(true);
  const [incAi, setIncAi] = useState<boolean>(true);
  const [incParchi, setIncParchi] = useState<boolean>(true);
  const [incNote, setIncNote] = useState<boolean>(true);
  const [appendText, setAppendText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string>('');

  useEffect(() => {
    setNewDocTitle(
      `Noor Haram Health Summary - ${profile.toUpperCase()} (${new Date().toLocaleDateString()})`
    );
  }, [profile]);

  const refreshDocs = useCallback(async () => {
    if (!getAccessToken()) {
      setNeedsAuth(true);
      return;
    }
    setLoadingDocs(true);
    try {
      const list = await listAppGoogleDocs();
      setDocs(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to list Google Docs';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
      } else {
        onNotify(msg, 'error');
      }
    } finally {
      setLoadingDocs(false);
    }
  }, [onNotify]);

  useEffect(() => {
    const unsub = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setNeedsAuth(!token);
        if (token) {
          refreshDocs();
        }
      },
      (u) => {
        setUser(u);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, [refreshDocs]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
        onNotify(`Connected to Google Docs as ${res.user.email || 'User'}`, 'success');
        await refreshDocs();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      onNotify(msg, 'error');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setNeedsAuth(true);
    setDocs([]);
    setOpenedDoc(null);
    onNotify('Signed out of Google Docs.', 'info');
  };

  const buildReportBody = (): string => {
    const parts: string[] = [
      `NOOR HARAM 2026 HEALTH REPORT`,
      `Profile: ${profile.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Note: Educational reference & personal record only. Verify doses with a licensed doctor.`,
    ];

    if (incVitals) {
      const vitals = readStorageJson<VitalRecord[]>(pKey('vitals_history', profile), []);
      parts.push('\n=== RECENT VITALS ===');
      if (vitals.length > 0) {
        vitals.slice(0, 8).forEach((v) => parts.push(`• ${v.time}: ${v.summary}`));
      } else {
        parts.push('No vitals logged yet.');
      }
    }

    if (incSchedule) {
      parts.push('\n=== DAILY MEDICINE SCHEDULE ===');
      if (medSchedule.length > 0) {
        medSchedule.forEach((m) =>
          parts.push(`• ${m.name} (${m.dose}) @ ${m.time} — ${m.taken ? 'Taken' : 'Pending'}`)
        );
      } else {
        parts.push('No medicines in daily schedule.');
      }
    }

    if (incAi && lastAiText.trim()) {
      parts.push('\n=== LATEST AI DOCTOR GUIDANCE ===');
      parts.push(lastAiText.trim());
    }

    if (incParchi && lastParchiText.trim()) {
      parts.push('\n=== LATEST PARCHI / LAB SCAN ===');
      parts.push(lastParchiText.trim());
    }

    if (incNote) {
      const note = localStorage.getItem(pKey('health_note', profile)) || '';
      if (note.trim()) {
        parts.push('\n=== HEALTH REMINDER NOTES ===');
        parts.push(note.trim());
      }
    }

    return parts.join('\n');
  };

  const handleOpenDoc = async (idOrUrl: string) => {
    if (!idOrUrl.trim()) {
      onNotify('Enter a Google Doc URL or Document ID first.', 'error');
      return;
    }
    setLoadingDocs(true);
    try {
      const content = await getGoogleDocContent(idOrUrl);
      setOpenedDoc(content);
      setDocIdInput(content.documentId);
      onNotify(`Loaded "${content.title}"`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not open Google Doc.';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
      } else {
        onNotify(msg, 'error');
      }
    } finally {
      setLoadingDocs(false);
    }
  };

  const requestCreateDoc = () => {
    const title = newDocTitle.trim() || `Noor Haram Health Report (${new Date().toLocaleDateString()})`;
    const content = buildReportBody();
    setPendingAction({ type: 'create', title, content });
  };

  const requestAppendDoc = () => {
    if (!openedDoc) return;
    const text =
      appendText.trim() ||
      lastAiText.trim() ||
      lastParchiText.trim() ||
      buildReportBody();
    if (!text.trim()) {
      onNotify('Enter text to append to the document.', 'error');
      return;
    }
    setPendingAction({
      type: 'append',
      docId: openedDoc.documentId,
      docTitle: openedDoc.title,
      content: text,
    });
  };

  const requestTrashDoc = (docId: string, docTitle: string) => {
    setPendingAction({ type: 'trash', docId, docTitle });
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      if (pendingAction.type === 'create') {
        const res = await createHealthGoogleDoc(pendingAction.title, pendingAction.content);
        setLastCreatedUrl(res.url);
        onNotify(`Created Google Doc "${res.title}"`, 'success');
        await refreshDocs();
        const loaded = await getGoogleDocContent(res.documentId);
        setOpenedDoc(loaded);
      } else if (pendingAction.type === 'append') {
        await appendTextToGoogleDoc(pendingAction.docId, pendingAction.content);
        setAppendText('');
        onNotify(`Appended update to "${pendingAction.docTitle}"`, 'success');
        const reloaded = await getGoogleDocContent(pendingAction.docId);
        setOpenedDoc(reloaded);
      } else if (pendingAction.type === 'trash') {
        await trashGoogleDoc(pendingAction.docId);
        if (openedDoc?.documentId === pendingAction.docId) {
          setOpenedDoc(null);
        }
        onNotify(`Moved "${pendingAction.docTitle}" to Google Drive Trash.`, 'info');
        await refreshDocs();
      }
      setPendingAction(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Docs operation failed.';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
        setPendingAction(null);
        onNotify('Google session expired. Please sign in again.', 'error');
      } else {
        onNotify(msg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="sec-gdocs"
      className="theme-surface rounded-3xl p-4 sm:p-5 space-y-4 border border-sky-400/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-sky-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-sky-300">
              {strings.gdocsTitle}
            </h2>
            <p className="text-xs text-slate-300">
              {strings.gdocsSub}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {needsAuth ? (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={signingIn}
              className="gsi-material-button"
              aria-label="Sign in with Google"
            >
              <svg className="gsi-material-button-icon" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{signingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-950/70 border border-emerald-400/40 text-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[180px]">{user?.email || user?.displayName || 'Connected'}</span>
              </span>
              <button
                type="button"
                onClick={refreshDocs}
                disabled={loadingDocs}
                className="inline-flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 bg-rose-950/70 hover:bg-rose-900/70 border border-rose-500/40 text-rose-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {needsAuth ? (
        <div className="bg-slate-950/75 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-slate-100">
            Connect Google Docs to save and organize family health summaries in your Google Drive.
          </p>
          <p className="text-slate-400">
            Access tokens stay strictly in memory for security and you are always asked to confirm before creating, updating, or trashing any document.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Export Health Report to New Google Doc + Existing Docs List */}
          <div className="space-y-3">
            <div className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FilePlus2 className="w-4 h-4" />
                  Create New Health Google Doc
                </h3>
                {lastCreatedUrl && (
                  <a
                    href={lastCreatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:underline"
                  >
                    Open Latest <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Document title..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <label className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={incVitals} onChange={(e) => setIncVitals(e.target.checked)} className="accent-emerald-400" />
                  <span>Vitals History</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={incSchedule} onChange={(e) => setIncSchedule(e.target.checked)} className="accent-emerald-400" />
                  <span>Med Schedule</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={incAi} onChange={(e) => setIncAi(e.target.checked)} className="accent-emerald-400" />
                  <span>Latest AI</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={incParchi} onChange={(e) => setIncParchi(e.target.checked)} className="accent-emerald-400" />
                  <span>Parchi Scan</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={incNote} onChange={(e) => setIncNote(e.target.checked)} className="accent-emerald-400" />
                  <span>Health Notes</span>
                </label>
              </div>

              <button
                type="button"
                onClick={requestCreateDoc}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Save Health Summary to Google Docs
              </button>
            </div>

            <div className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  Saved Google Docs ({docs.length})
                </h3>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={docIdInput}
                  onChange={(e) => setDocIdInput(e.target.value)}
                  placeholder="Paste Google Doc link or ID..."
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleOpenDoc(docIdInput)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl whitespace-nowrap"
                >
                  Open
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {docs.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">
                    {loadingDocs
                      ? 'Loading Google Docs...'
                      : 'No Google Docs created by this app yet. Create one above or paste a document ID.'}
                  </div>
                ) : (
                  docs.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenDoc(d.id)}
                        className="text-left flex-1 min-w-0 hover:text-sky-300 transition"
                      >
                        <div className="font-semibold text-slate-100 truncate">{d.name}</div>
                        {d.modifiedTime && (
                          <div className="text-[10px] text-slate-400">
                            Updated {new Date(d.modifiedTime).toLocaleDateString()}
                          </div>
                        )}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={d.webViewLink || `https://docs.google.com/document/d/${d.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300"
                          title="Open in Google Docs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => requestTrashDoc(d.id, d.name)}
                          className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Loaded Google Doc Viewer + Append & Actions */}
          <div className="bg-slate-950/75 border border-slate-700 rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
            {openedDoc ? (
              <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-sky-300 truncate">
                        {openedDoc.title}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {openedDoc.documentId.slice(0, 18)}...
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSpeak(openedDoc.text || openedDoc.title)}
                        className="inline-flex items-center gap-1 bg-sky-500 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Speak
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSendToParchi(openedDoc.text);
                          onNotify('Sent Google Doc text to Parchi & Lab Scanner.', 'success');
                        }}
                        className="inline-flex items-center gap-1 bg-cyan-500 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Scan Labs
                      </button>
                      <a
                        href={`https://docs.google.com/document/d/${openedDoc.documentId}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 font-semibold text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        Edit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 bg-slate-900/80 border border-slate-800 rounded-xl p-3 max-h-52 overflow-y-auto leading-relaxed">
                    {openedDoc.text || '(Empty Google Document)'}
                  </pre>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-2.5">
                  <label className="block text-[11px] font-semibold text-emerald-300">
                    Append Update to This Doc (or leave blank to append Latest AI / Parchi / Vitals)
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={appendText}
                      onChange={(e) => setAppendText(e.target.value)}
                      placeholder="Write new follow-up vitals, doctor note, or leave blank to append current health update..."
                      className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={requestAppendDoc}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 rounded-xl whitespace-nowrap"
                    >
                      + Append
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-slate-400 space-y-2 min-h-[220px]">
                <FileText className="w-8 h-8 text-slate-500" />
                <p className="font-semibold text-slate-200">No Google Doc Opened</p>
                <p>
                  Select a document from your saved list or create a new Noor Haram Health Summary to view, listen aloud, scan labs, or append updates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal for Mutating / Destructive Google Docs Actions */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-sm p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full bg-slate-900 border border-slate-600 rounded-2xl p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingAction.type === 'trash'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-sky-500/20 text-sky-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {pendingAction.type === 'create'
                    ? 'Confirm Create Google Doc'
                    : pendingAction.type === 'append'
                      ? 'Confirm Append to Google Doc'
                      : 'Confirm Move to Trash'}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {pendingAction.type === 'create' && (
                    <>
                      Create a new Google Doc titled{' '}
                      <strong className="text-sky-300">"{pendingAction.title}"</strong> in your Google Drive?
                    </>
                  )}
                  {pendingAction.type === 'append' && (
                    <>
                      Append this health update to{' '}
                      <strong className="text-emerald-300">"{pendingAction.docTitle}"</strong>?
                    </>
                  )}
                  {pendingAction.type === 'trash' && (
                    <>
                      Move <strong className="text-rose-300">"{pendingAction.docTitle}"</strong> to Google Drive Trash? You can restore it from Drive Trash within 30 days.
                    </>
                  )}
                </p>
              </div>
            </div>

            {pendingAction.type !== 'trash' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 max-h-32 overflow-y-auto text-[11px] text-slate-300 whitespace-pre-wrap">
                {pendingAction.content.slice(0, 600)}
                {pendingAction.content.length > 600 ? '...' : ''}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPendingAction(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={executeConfirmedAction}
                className={`font-bold px-4 py-2 rounded-xl ${
                  pendingAction.type === 'trash'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : pendingAction.type === 'trash'
                    ? 'Confirm Trash'
                    : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
