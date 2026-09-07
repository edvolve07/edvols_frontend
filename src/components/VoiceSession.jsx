import { useEffect, useMemo, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarVisualizer,
  TrackToggle,
  VideoTrack,
  useVoiceAssistant,
  useLocalParticipant,
  useTracks,
  useTranscriptions,
  useChat,
  useSessionContext,
} from '@livekit/components-react';
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX,
  MessageSquareText, PhoneOff, X, SendHorizontal, Radio, Captions, CaptionsOff,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';

const STATE_LABEL = {
  connecting: 'Connecting',
  initializing: 'Warming up',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  disconnected: 'Disconnected',
};

const STATE_HINT = {
  listening: 'Go ahead — the coach is listening',
  thinking: 'The coach is considering your response',
  speaking: 'The coach is responding',
};

const CAPTION_LINGER_MS = 6000;
const QUESTION_LIMIT_SECONDS = 120; // 2 minutes per question

function useElapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return seconds;
}

function useQuestionTimer({ isLive, questionIndex, onTimeout }) {
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_LIMIT_SECONDS);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  // Reset to 120s whenever a new question starts
  useEffect(() => {
    setSecondsLeft(QUESTION_LIMIT_SECONDS);
  }, [questionIndex]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          onTimeoutRef.current?.();
          return QUESTION_LIMIT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, questionIndex]);

  return secondsLeft;
}

function formatClock(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function transcriptTs(t) {
  return t.streamInfo?.timestamp ?? t.streamInfo?.startTime ?? 0;
}

// Keep captions to a compact tail so a long turn doesn't fill the screen.
function captionTail(text, max = 170) {
  const t = (text || '').trim();
  if (t.length <= max) return t;
  const slice = t.slice(t.length - max);
  const firstSpace = slice.indexOf(' ');
  return `… ${firstSpace > 0 ? slice.slice(firstSpace + 1) : slice}`;
}

const CTRL_BASE =
  'flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-150 active:scale-95 disabled:opacity-40';
const CTRL_IDLE = 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10';
const CTRL_ON = 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25';
const CTRL_DANGER = 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25';

function TranscriptPanel({ open, onClose, transcriptions, agentIdentity }) {
  const { chatMessages, send, isSending } = useChat();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  const lines = useMemo(() => {
    const items = [];
    for (const t of transcriptions) {
      items.push({
        key: `t-${t.streamInfo?.id ?? transcriptTs(t)}-${t.text.length}`,
        ts: transcriptTs(t),
        role: t.participantInfo?.identity === agentIdentity ? 'coach' : 'you',
        text: t.text,
      });
    }
    for (const m of chatMessages) {
      items.push({
        key: `c-${m.id ?? m.timestamp}`,
        ts: m.timestamp ?? 0,
        role: m.from?.isLocal ? 'you' : 'coach',
        text: m.message,
      });
    }
    items.sort((a, b) => a.ts - b.ts);
    const seen = new Set();
    return items.filter((it) => {
      const sig = `${it.role}|${it.text.trim()}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return it.text.trim().length > 0;
    });
  }, [transcriptions, chatMessages, agentIdentity]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft('');
    try {
      await send(text);
    } catch {
      /* surfaced by isSending reset */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="absolute inset-y-0 right-0 z-40 flex w-full flex-col border-l border-white/10 bg-[#0b1512]/95 backdrop-blur-xl sm:w-[400px]"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Transcript</h3>
            <button
              onClick={onClose}
              aria-label="Close transcript"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {lines.length === 0 ? (
              <p className="pt-6 text-center text-sm text-slate-500">
                Your conversation will appear here as you speak.
              </p>
            ) : (
              lines.map((line) => (
                <div key={line.key} className={cn('flex flex-col gap-1', line.role === 'you' && 'items-end')}>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      line.role === 'coach' ? 'text-emerald-400' : 'text-slate-400',
                    )}
                  >
                    {line.role === 'coach' ? 'Coach' : 'You'}
                  </span>
                  <p
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                      line.role === 'coach'
                        ? 'bg-emerald-500/10 text-emerald-50'
                        : 'bg-white/10 text-slate-100',
                    )}
                  >
                    {line.text}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 focus-within:border-emerald-400/40">
              <textarea
                rows={1}
                value={draft}
                placeholder="Type a message to the coach…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="max-h-24 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                aria-label="Send message"
                className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function LiveCaption({ text, visible }) {
  const shown = useMemo(() => captionTail(text, 170), [text]);
  return (
    <AnimatePresence>
      {visible && shown && (
        <motion.div
          key="live-caption"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-6 sm:bottom-32"
        >
          <div className="max-w-lg text-center">
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Coach
            </span>
            <p className="text-[15px] font-medium leading-relaxed text-white sm:text-base">
              <span className="box-decoration-clone rounded-md bg-slate-950/80 px-2 py-1 shadow-sm ring-1 ring-white/10">
                {shown}
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function VoiceSession({
  category,
  onDisconnect,
  currentQuestionIndex = 1,
  totalQuestions = 6,
  onQuestionTimeout,
  currentPrompt = '',
}) {
  const session = useSessionContext();
  const { state, audioTrack, agent } = useVoiceAssistant();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const transcriptions = useTranscriptions();
  const [panelOpen, setPanelOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const elapsed = useElapsed();

  const isLive = ['listening', 'thinking', 'speaking'].includes(state);
  useQuestionTimer({
    isLive,
    questionIndex: currentQuestionIndex,
    onTimeout: onQuestionTimeout,
  });

  const agentIdentity = agent?.identity;

  const videoTracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: false },
  );
  const localCamera = videoTracks.find(
    (t) => t.participant?.isLocal && t.source === Track.Source.Camera && t.publication && !t.publication.isMuted,
  );
  const localScreen = videoTracks.find(
    (t) => t.participant?.isLocal && t.source === Track.Source.ScreenShare && t.publication && !t.publication.isMuted,
  );
  const sharingScreen = Boolean(localScreen);

  // Live captions — track the agent's most recent transcription and linger briefly
  const [caption, setCaption] = useState('');
  const [captionVisible, setCaptionVisible] = useState(false);
  useEffect(() => {
    const agentLines = transcriptions.filter((t) => t.participantInfo?.identity === agentIdentity);
    const latest = agentLines[agentLines.length - 1]?.text?.trim();
    if (latest && latest !== caption) setCaption(latest);
  }, [transcriptions, agentIdentity, caption]);
  useEffect(() => {
    if (!caption) return undefined;
    setCaptionVisible(true);
    const t = setTimeout(() => setCaptionVisible(false), CAPTION_LINGER_MS);
    return () => clearTimeout(t);
  }, [caption]);
  const showCaption = captionsOn && Boolean(caption) && (state === 'speaking' || captionVisible);

  const label = STATE_LABEL[state] || 'Connecting';
  const hint = STATE_HINT[state] || 'Take a breath and start when you are ready';

  const endCall = () => {
    try {
      session?.end?.();
    } catch {
      /* no-op */
    }
    onDisconnect?.();
  };

  return (
    <section className="voice-session absolute inset-0 flex flex-col overflow-hidden bg-[#070d0b] text-slate-100">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]"
      />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">Communication practice</p>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Question {currentQuestionIndex} of {totalQuestions}
            </span>
          </div>
          <h2 className="truncate text-sm font-semibold text-slate-200 sm:text-base">{category || 'Practice session'}</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Overall session elapsed timer */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <Radio className={cn('h-3.5 w-3.5', isLive ? 'text-emerald-400' : 'text-slate-500')} />
            <span className="font-mono tabular-nums">{formatClock(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* stage */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-4">
        {sharingScreen ? (
          <>
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
              <VideoTrack trackRef={localScreen} className="h-full w-full object-contain" />
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Sharing your screen
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BarVisualizer
                state={state}
                barCount={7}
                track={audioTrack}
                options={{ minHeight: 12, maxHeight: 90 }}
                className="lk-audio-bar-visualizer h-10 w-28"
              />
              <p className="text-sm font-semibold text-slate-200">{label}</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-emerald-400/15 bg-white/[0.03] shadow-[0_0_80px_-20px_rgba(16,185,129,0.5)] backdrop-blur-sm sm:h-64 sm:w-64">
              <div
                className={cn(
                  'absolute inset-0 rounded-full border border-emerald-400/20 transition-opacity duration-500',
                  state === 'speaking' ? 'animate-ping opacity-40' : 'opacity-0',
                )}
              />
              <BarVisualizer
                state={state}
                barCount={7}
                track={audioTrack}
                options={{ minHeight: 12, maxHeight: 90 }}
                className="lk-audio-bar-visualizer h-24 w-40 sm:h-28 sm:w-48"
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    state === 'speaking'
                      ? 'bg-emerald-400'
                      : state === 'thinking'
                        ? 'bg-amber-400'
                        : state === 'listening'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-slate-500',
                  )}
                />
                <p className="text-lg font-bold text-slate-100">{label}</p>
              </div>
              <p className="mt-1 text-sm text-slate-400">{hint}</p>
            </div>

            {currentPrompt && (
              <div className="mx-auto max-w-lg rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Question prompt</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-200 sm:text-sm">{currentPrompt}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* local camera tile */}
      <AnimatePresence>
        {localCamera && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-28 left-4 z-20 aspect-video w-36 overflow-hidden rounded-xl border border-white/15 bg-black shadow-xl sm:left-8 sm:w-48"
          >
            <VideoTrack trackRef={localCamera} className="h-full w-full object-cover" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* control bar */}
      <footer className="relative z-20 flex justify-center px-4 pb-6 pt-2 sm:pb-8">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur-xl sm:gap-3">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={false}
            title={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
            className={cn(CTRL_BASE, isMicrophoneEnabled ? CTRL_ON : CTRL_IDLE)}
          >
            {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </TrackToggle>

          <TrackToggle
            source={Track.Source.Camera}
            showIcon={false}
            title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            className={cn(CTRL_BASE, isCameraEnabled ? CTRL_ON : CTRL_IDLE)}
          >
            {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </TrackToggle>

          <TrackToggle
            source={Track.Source.ScreenShare}
            showIcon={false}
            captureOptions={{ audio: false, selfBrowserSurface: 'include' }}
            title={isScreenShareEnabled ? 'Stop sharing screen' : 'Share screen'}
            className={cn(CTRL_BASE, 'hidden sm:flex', isScreenShareEnabled ? CTRL_ON : CTRL_IDLE)}
          >
            {isScreenShareEnabled ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </TrackToggle>

          <button
            onClick={() => setCaptionsOn((v) => !v)}
            title={captionsOn ? 'Hide captions' : 'Show captions'}
            aria-label={captionsOn ? 'Hide captions' : 'Show captions'}
            className={cn(CTRL_BASE, captionsOn ? CTRL_ON : CTRL_IDLE)}
          >
            {captionsOn ? <Captions className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setPanelOpen((v) => !v)}
            title="Toggle transcript"
            aria-label="Toggle transcript"
            className={cn(CTRL_BASE, panelOpen ? CTRL_ON : CTRL_IDLE)}
          >
            <MessageSquareText className="h-5 w-5" />
          </button>

          <div className="mx-1 h-8 w-px bg-white/10" />

          <button
            onClick={endCall}
            title="End session"
            aria-label="End session"
            className={cn(CTRL_BASE, 'w-14', CTRL_DANGER)}
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </footer>

      <LiveCaption text={caption} visible={showCaption} />

      <TranscriptPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        transcriptions={transcriptions}
        agentIdentity={agentIdentity}
      />
    </section>
  );
}
