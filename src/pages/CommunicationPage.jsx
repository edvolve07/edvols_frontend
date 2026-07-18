import { Component, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession, SessionProvider, useSessionContext, RoomAudioRenderer } from '@livekit/components-react';
import { Loader2, Sparkles, MessageSquareText, Mic2, AlertCircle, CheckCircle, RefreshCw, FileText, Brain, MessageCircle, BarChart3, Target } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useNavigate } from '@/src/navigation';
import { COMMUNICATION_MODES, GENERAL_SCENARIOS, COMMUNICATION_CATEGORIES, COMMUNICATION_WORKFLOW } from '@/src/constants';
import { AgentSessionView_01 } from '../components/agents-ui/blocks/agent-session-view-01';
import { StartAudioButton } from '../components/agents-ui/start-audio-button';
import { Button } from '../components/ui/button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-red-100 p-4" style={{ background: '#fef2f2', color: '#000' }}>
          <div className="max-w-2xl rounded-xl bg-white p-8 text-center shadow-2xl" style={{ background: '#fff' }}>
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-600">{this.state.error.message}</p>
            <pre className="mt-4 max-w-xl mx-auto overflow-auto rounded-lg bg-slate-100 p-4 text-left text-xs text-slate-600" style={{ background: '#f1f5f9' }}>{this.state.error.stack}</pre>
            <button onClick={() => this.setState({ error: null })} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" style={{ background: '#059669', color: '#fff', padding: '8px 16px', borderRadius: '8px' }}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STORAGE_KEY = 'lk-interview';

function ModeSelector({ modes, activeMode, onChange }) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Practice mode">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = m.id === activeMode;
        return (
          <button key={m.id} role="tab" aria-selected={isActive} onClick={() => onChange(m.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              isActive ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : ''}`} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function OptionCard({ label, isSelected, onClick, prefix }) {
  return (
    <button onClick={onClick}
      className={`group relative rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-600'
      }`}>
      <span className={`text-xs font-bold uppercase tracking-wider ${
        isSelected ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-400'
      }`}>{prefix}</span>
      <span className="mt-0.5 block text-sm font-semibold">{label}</span>
    </button>
  );
}

function SetupScreen({ onStart }) {
  const [mode, setMode] = useState('general');
  const [selection, setSelection] = useState('');
  const [starting, setStarting] = useState(false);

  const options = mode === 'general' ? GENERAL_SCENARIOS : COMMUNICATION_CATEGORIES;
  const sectionLabel = mode === 'general' ? 'Choose a scenario' : 'Choose a topic';
  const prefixLabel = mode === 'general' ? 'Scenario' : 'Practice';

  async function handleStart() {
    if (!selection) return;
    setStarting(true);
    await onStart({ mode, selection });
    setStarting(false);
  }

  const heroTitle = mode === 'general' ? 'Communication Practice' : 'Live Interview Practice';
  const heroDesc = mode === 'general'
    ? 'Practice real-world communication scenarios with AI-powered coaching, feedback, and evaluation.'
    : 'AI-powered interview coach that listens, evaluates, and gives real-time feedback on your communication skills.';

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-6 py-10">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-8 text-center ring-1 ring-emerald-200/50">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100">
          {mode === 'general' ? <MessageSquareText className="h-8 w-8 text-emerald-600" /> : <Mic2 className="h-8 w-8 text-emerald-600" />}
        </div>
        <h1 className="text-3xl font-bold text-emerald-900">{heroTitle}</h1>
        <p className="mt-3 mx-auto max-w-lg text-base leading-relaxed text-emerald-700/80">{heroDesc}</p>
      </div>

      <div className="mt-8">
        <ModeSelector modes={COMMUNICATION_MODES} activeMode={mode} onChange={(m) => { setMode(m); setSelection(''); }} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">{sectionLabel}</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt, idx) => (
            <OptionCard key={opt} label={opt} isSelected={selection === opt}
              onClick={() => setSelection(selection === opt ? '' : opt)} prefix={`${prefixLabel} ${idx + 1}`} />
          ))}
        </div>
      </div>

      <button onClick={handleStart} disabled={starting || !selection}
        className="hover-lift mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200/60 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none">
        {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        {starting ? 'Connecting...' : selection ? 'Start Practice' : 'Select an option to begin'}
      </button>

      <div className="mt-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">How it works</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {COMMUNICATION_WORKFLOW.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-10 text-center text-xs font-medium text-slate-400">Camera and microphone will be used for video analysis</p>
    </div>
  );
}

function WelcomeImage() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 size-16 text-current">
      <path d="M15 24V40C15 40.7957 14.6839 41.5587 14.1213 42.1213C13.5587 42.6839 12.7956 43 12 43C11.2044 43 10.4413 42.6839 9.87868 42.1213C9.31607 41.5587 9 40.7957 9 40V24C9 23.2044 9.31607 22.4413 9.87868 21.8787C10.4413 21.3161 11.2044 21 12 21C12.7956 21 13.5587 21.3161 14.1213 21.8787C14.6839 22.4413 15 23.2044 15 24ZM22 5C21.2044 5 20.4413 5.31607 19.8787 5.87868C19.3161 6.44129 19 7.20435 19 8V56C19 56.7957 19.3161 57.5587 19.8787 58.1213C20.4413 58.6839 21.2044 59 22 59C22.7956 59 23.5587 58.6839 24.1213 58.1213C24.6839 57.5587 25 56.7957 25 56V8C25 7.20435 24.6839 6.44129 24.1213 5.87868C23.5587 5.31607 22.7956 5 22 5ZM32 13C31.2044 13 30.4413 13.3161 29.8787 13.8787C29.3161 14.4413 29 15.2044 29 16V48C29 48.7957 29.3161 49.5587 29.8787 50.1213C30.4413 50.6839 31.2044 51 32 51C32.7956 51 33.5587 50.6839 34.1213 50.1213C34.6839 49.5587 35 48.7957 35 48V16C35 15.2044 34.6839 14.4413 34.1213 13.8787C33.5587 13.3161 32.7956 13 32 13ZM42 21C41.2043 21 40.4413 21.3161 39.8787 21.8787C39.3161 22.4413 39 23.2044 39 24V40C39 40.7957 39.3161 41.5587 39.8787 42.1213C40.4413 42.6839 41.2043 43 42 43C42.7957 43 43.5587 42.6839 44.1213 42.1213C44.6839 41.5587 45 40.7957 45 40V24C45 23.2044 44.6839 22.4413 44.1213 21.8787C43.5587 21.3161 42.7957 21 42 21ZM52 17C51.2043 17 50.4413 17.3161 49.8787 17.8787C49.3161 18.4413 49 19.2044 49 20V44C49 44.7957 49.3161 45.5587 49.8787 46.1213C50.4413 46.6839 51.2043 47 52 47C52.7957 47 53.5587 46.6839 54.1213 46.1213C54.6839 45.5587 55 44.7957 55 44V20C55 19.2044 54.6839 18.4413 54.1213 17.8787C53.5587 17.3161 52.7957 17 52 17Z" fill="currentColor" />
    </svg>
  );
}

function ReconnectingOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white">
      <div className="text-center max-w-md">
        <RefreshCw className="h-12 w-12 animate-spin text-emerald-500 mb-6 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Reconnecting to your session...</h2>
        <p className="text-sm text-slate-500">Hang tight! Your conversation is being restored.</p>
      </div>
    </div>
  );
}

const FINALIZE_STAGES = [
  { id: 'finalize', label: 'Finalizing session', icon: CheckCircle },
  { id: 'transcript', label: 'Persisting transcript', icon: FileText },
  { id: 'analyze', label: 'Analyzing conversation', icon: Brain },
  { id: 'evaluate', label: 'Evaluating communication', icon: MessageCircle },
  { id: 'scores', label: 'Computing scores', icon: BarChart3 },
  { id: 'plan', label: 'Building improvement plan', icon: Target },
  { id: 'compose', label: 'Composing report', icon: FileText },
  { id: 'save', label: 'Saving report', icon: CheckCircle },
  { id: 'done', label: 'Report ready', icon: CheckCircle },
];

function FinalizingScreen({ status, error, onRetry, exchangeCount }) {
  const isFailed = status === 'FAILED';
  const isComplete = status === 'COMPLETED';
  const stageIdx = isFailed
    ? FINALIZE_STAGES.length - 2
    : isComplete
      ? FINALIZE_STAGES.length - 1
      : Math.min(3, FINALIZE_STAGES.length - 2);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md px-6">
        {isFailed ? (
          <AlertCircle className="h-14 w-14 text-red-500 mb-5 mx-auto" />
        ) : isComplete ? (
          <CheckCircle className="h-14 w-14 text-emerald-500 mb-5 mx-auto" />
        ) : (
          <Loader2 className="h-14 w-14 animate-spin text-emerald-500 mb-5 mx-auto" />
        )}
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
          {isFailed ? 'Report generation failed' : isComplete ? 'Report ready!' : 'Preparing your personalized coaching report'}
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          {isFailed
            ? 'Something went wrong while generating your report. You can retry below.'
            : isComplete
              ? 'Opening your coaching report...'
              : `Analyzing ${exchangeCount || 0} conversation exchange${(exchangeCount || 0) !== 1 ? 's' : ''} across multiple AI stages. This usually takes 15–60 seconds.`}
        </p>

        {!isFailed && (
          <div className="space-y-2 mb-2">
            {FINALIZE_STAGES.map((stage, i) => {
              const reached = i <= stageIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all ${
                    reached
                      ? i === stageIdx && !isComplete
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-slate-50 text-slate-500'
                      : 'bg-white text-slate-300'
                  }`}>
                  {reached && i === stageIdx && !isComplete ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" />
                  ) : (
                    <Icon className={`h-4 w-4 shrink-0 ${reached && isComplete ? 'text-emerald-500' : reached ? 'text-emerald-500' : 'text-slate-300'}`} />
                  )}
                  <span className={`font-semibold ${reached && isComplete ? 'text-emerald-700' : ''}`}>{stage.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {isFailed && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 mb-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Error</p>
            <p className="text-xs leading-relaxed">{error || 'Unknown error'}</p>
          </div>
        )}

        {isFailed && (
          <button onClick={onRetry}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-700 transition-all">
            <RefreshCw className="h-4 w-4" /> Retry report generation
          </button>
        )}
      </div>
    </div>
  );
}

function useSessionFinalizer(conversationId, exchangesRef, opts = {}) {
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [reportSessionId, setReportSessionId] = useState(null);
  const startedRef = useRef(false);
  const pollRef = useRef(null);

  const stop = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!conversationId) return;
    try {
      const resp = await apiFetch(`/api/communication/student/sessions/${conversationId}/report-status`);
      if (resp.status === 'COMPLETED') {
        setStatus('COMPLETED');
        setReportSessionId(resp.report_session_id || null);
        stop();
      } else if (resp.status === 'FAILED') {
        setStatus('FAILED');
        setError(resp.error || 'Unknown error');
        stop();
      } else if (resp.status === 'PROCESSING') {
        setStatus('PROCESSING');
      }
    } catch (e) {
    }
  }, [conversationId, stop]);

  const start = useCallback(async ({ exchanges: providedExchanges = null, reason = 'manual' } = {}) => {
    if (!conversationId) return;
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus('PROCESSING');
    setError(null);
    const exchs = providedExchanges || exchangesRef.current || [];
    setExchangeCount((exchs || []).length);

    try {
      await apiFetch(`/api/communication/student/sessions/${conversationId}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ exchanges: exchs, reason }),
      });
    } catch (e) {
      setStatus('FAILED');
      setError(e.message || 'Failed to start finalization');
      startedRef.current = false;
      return;
    }

    pollRef.current = setInterval(poll, 2000);
    poll();
  }, [conversationId, exchangesRef, poll]);

  const retry = useCallback(() => {
    startedRef.current = false;
    start();
  }, [start]);

  useEffect(() => () => stop(), [stop]);

  return { status, error, exchangeCount, reportSessionId, start, retry, poll };
}

function SessionContent({ mode, category, onComplete, conversationId, initialExchanges }) {
  const navigate = useNavigate();
  const { room } = useSessionContext();
  const [exchanges, setExchanges] = useState(initialExchanges || []);
  const exchangesRef = useRef(exchanges);

  exchangesRef.current = exchanges;

  const finalizer = useSessionFinalizer(conversationId, exchangesRef);
  const hasFinalizedRef = useRef(false);
  const syncTimerRef = useRef(null);

  const triggerFinalization = useCallback((reason = 'agent_complete') => {
    if (hasFinalizedRef.current) return;
    hasFinalizedRef.current = true;
    finalizer.start({ exchanges: exchangesRef.current, reason });
  }, [finalizer]);

  const handleFinalizedNavigate = useCallback(() => {
    if (!finalizer.reportSessionId) return;
    onComplete();
    navigate(`/communication/report?session=${finalizer.reportSessionId}`);
  }, [finalizer.reportSessionId, navigate, onComplete]);

  useEffect(() => {
    if (finalizer.status === 'COMPLETED' && !finalizer.reportSessionId) {
      finalizer.poll();
    }
    if (finalizer.status === 'COMPLETED' && finalizer.reportSessionId) {
      const timer = setTimeout(handleFinalizedNavigate, 800);
      return () => clearTimeout(timer);
    }
  }, [finalizer.status, finalizer.reportSessionId, finalizer.poll, handleFinalizedNavigate]);

  const syncExchanges = useCallback(async (exchs) => {
    if (!conversationId) return;
    try {
      await apiFetch(`/api/livekit/conversation/${conversationId}/sync`, {
        method: 'POST',
        body: JSON.stringify({ exchanges: exchs }),
      });
    } catch (e) { }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || exchanges.length === 0) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncExchanges(exchangesRef.current), 2000);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [exchanges, conversationId, syncExchanges]);

  useEffect(() => {
    return () => {
      if (conversationId && exchangesRef.current.length > 0) {
        syncExchanges(exchangesRef.current);
      }
    };
  }, [conversationId, syncExchanges]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (data) => {
      try {
        const payload = JSON.parse(Array.from(data));
        if (payload.type === 'evaluation') {
          setExchanges((prev) => [...prev, {
            exchange_number: payload.exchange_number,
            eliciting_prompt: payload.eliciting_prompt,
            transcript: payload.transcript,
            evaluation: payload.evaluation,
            feedback: payload.feedback,
            strengths: payload.strengths,
            improvements: payload.improvements,
            next_prompt: payload.next_prompt,
            is_last: payload.is_last,
            video_context: payload.video_context,
            mode: payload.mode,
          }]);
        } else if (payload.type === 'complete') {
          triggerFinalization('agent_complete');
        }
      } catch (e) {
        console.error('Error processing data message:', e);
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => { room.off('dataReceived', handleDataReceived); };
  }, [room, triggerFinalization]);

  const handleEndCall = useCallback(() => {
    triggerFinalization('user_end_call');
  }, [triggerFinalization]);

  if (finalizer.status === 'PROCESSING' || finalizer.status === 'PENDING' || finalizer.status === 'FAILED' || finalizer.status === 'COMPLETED') {
    if (finalizer.status === 'PENDING' && !hasFinalizedRef.current) {
      return (
        <AgentSessionView_01
          supportsChatInput={true}
          supportsVideoInput={true}
          supportsScreenShare={true}
          audioVisualizerType="bar"
          audioVisualizerColor="#34d399"
          audioVisualizerColorShift={0.3}
          audioVisualizerBarCount={5}
          onDisconnect={handleEndCall}
        />
      );
    }
    return (
      <FinalizingScreen
        status={finalizer.status}
        error={finalizer.error}
        exchangeCount={exchanges.length || finalizer.exchangeCount}
        onRetry={() => { finalizer.retry(); }}
      />
    );
  }

  return (
    <AgentSessionView_01
      supportsChatInput={true}
      supportsVideoInput={true}
      supportsScreenShare={true}
      audioVisualizerType="bar"
      audioVisualizerColor="#34d399"
      audioVisualizerColorShift={0.3}
      audioVisualizerBarCount={5}
      onDisconnect={handleEndCall}
    />
  );
}

function SessionView({ roomInfo, onComplete, conversationId, initialExchanges }) {
  const tokenSource = useMemo(() => {
    const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
    return TokenSource.custom(async () => ({
      server_url: serverUrl,
      participant_token: roomInfo.token,
    }));
  }, [roomInfo]);

  const session = useSession(tokenSource);
  const didStart = useRef(false);

  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;
    let cancelled = false;

    session.start().catch((err) => {
      if (cancelled) return;
      console.error('Session start failed:', err);
      alert('Could not connect to practice session. Please try again.');
      onComplete();
    });

    return () => { cancelled = true; };
  }, [session, onComplete]);

  return (
    <SessionProvider session={session}>
      <div className="lk-session fixed inset-0 z-[100] overflow-hidden">
        <SessionContent mode={roomInfo.mode} category={roomInfo.category} onComplete={onComplete}
          conversationId={conversationId} initialExchanges={initialExchanges} />
        <RoomAudioRenderer />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110]">
          <StartAudioButton label="Start Audio" />
        </div>
      </div>
    </SessionProvider>
  );
}

export default function CommunicationPage() {
  const [roomInfo, setRoomInfo] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [initialExchanges, setInitialExchanges] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const reconnectionDone = useRef(false);

  useEffect(() => {
    if (reconnectionDone.current) return;

    async function tryReconnect() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      let parsed;
      try { parsed = JSON.parse(stored); } catch { return; }
      if (!parsed.conversationId && !parsed.room) return;

      setReconnecting(true);
      reconnectionDone.current = true;

      try {
        let convData = null;
        if (parsed.conversationId) {
          const resp = await apiFetch(`/api/livekit/conversation/${parsed.conversationId}`);
          if (!resp || resp.status === 'expired' || resp.status === 'ended') {
            throw new Error('Session expired or ended');
          }
          convData = resp;
        }

        const roomName = convData?.room_name || parsed.room;
        if (!roomName) throw new Error('No room name');

        const rejoinData = await apiFetch('/api/livekit/rejoin-room', {
          method: 'POST',
          body: JSON.stringify({
            room: roomName,
            conversation_id: parsed.conversationId || undefined,
          }),
        });

      setConversationId(parsed.conversationId || null);
      setRoomInfo({
        room: rejoinData.room,
        token: rejoinData.token,
        mode: convData?.mode || parsed.mode || 'general',
        category: convData?.category || parsed.category || '',
      });
      setReconnecting(false);

      if (convData?.exchanges?.length > 0) {
        setInitialExchanges(convData.exchanges);
      } else {
        setInitialExchanges([]);
      }
    } catch (err) {
        console.warn('Reconnection failed, clearing stale session:', err.message);
        localStorage.removeItem(STORAGE_KEY);
        setReconnecting(false);
        reconnectionDone.current = false;
      }
    }

    tryReconnect();
  }, []);

  async function handleStart({ mode, selection }) {
    try {
      const data = await apiFetch('/api/livekit/create-room', {
        method: 'POST',
        body: JSON.stringify({ mode, category: selection }),
      });
      setConversationId(data.conversation_id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        room: data.room,
        mode: data.mode,
        category: data.category,
        conversationId: data.conversation_id,
      }));
      setRoomInfo(data);
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Could not connect to practice session. Please try again.');
    }
  }

  function handleComplete() {
    if (roomInfo?.room) {
      apiFetch('/api/livekit/end-conversation', {
        method: 'POST',
        body: JSON.stringify({
          room: roomInfo.room,
          conversation_id: conversationId || undefined,
        }),
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setRoomInfo(null);
    setConversationId(null);
    setInitialExchanges(null);
  }

  if (reconnecting) {
    return <ReconnectingOverlay />;
  }

  if (roomInfo) {
    return (
      <ErrorBoundary>
        <SessionView
          roomInfo={roomInfo}
          onComplete={handleComplete}
          conversationId={conversationId}
          initialExchanges={initialExchanges}
        />
      </ErrorBoundary>
    );
  }

  return <SetupScreen onStart={handleStart} />;
}
