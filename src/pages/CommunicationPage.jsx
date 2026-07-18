import { useState, useMemo, useEffect, useRef } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession, SessionProvider, useSessionContext, RoomAudioRenderer } from '@livekit/components-react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Sparkles, MessageSquareText, Mic2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { COMMUNICATION_MODES, GENERAL_SCENARIOS, COMMUNICATION_CATEGORIES, COMMUNICATION_WORKFLOW } from '@/src/constants';
import { AgentSessionView_01 } from '../components/agents-ui/blocks/agent-session-view-01';
import { StartAudioButton } from '../components/agents-ui/start-audio-button';
import { Button } from '../components/ui/button';

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

function WelcomeView({ onStartCall, startButtonText }) {
  return (
    <section className="bg-background flex flex-col items-center justify-center text-center">
      <WelcomeImage />
      <p className="text-foreground max-w-prose pt-1 leading-6 font-medium">
        Chat live with your voice AI agent
      </p>
      <Button size="lg" onClick={onStartCall}
        className="mt-6 w-64 rounded-full font-mono text-xs font-bold tracking-wider uppercase">
        {startButtonText || 'Start'}
      </Button>
    </section>
  );
}

function SessionContent({ mode, category, onComplete }) {
  const { room } = useSessionContext(); // Get the room object from session context
  const [exchanges, setExchanges] = useState([]); // Collect all exchanges
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const hasConnected = useRef(false);

  // Listen for data messages from the agent
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (data, participant) => {
      try {
        const payload = JSON.parse(Array.from(data));

        if (payload.type === "evaluation") {
          // Store the exchange data
          setExchanges(prev => [...prev, {
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
            mode: payload.mode
          }]);
        } else if (payload.type === "complete") {
          setIsSessionComplete(true);
          // Generate report when session completes
          generateReport();
        }
      } catch (e) {
        console.error("Error processing data message:", e);
      }
    };

    room.on("dataReceived", handleDataReceived);

    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room]);

  // Generate report from collected exchanges
  const generateReport = async () => {
    if (isGeneratingReport || !exchanges.length) return;

    setIsGeneratingReport(true);
    try {
      // Prepare exchange data in the format expected by generateCommunicationReport
      const exchangeData = exchanges.map(ex => ({
        // We'll send the raw exchange data to backend for report generation
        // Or we could compute it here - let's send to backend to reuse existing logic
        eliciting_prompt: ex.eliciting_prompt || "",
        transcript: ex.transcript || "",
        evaluation: ex.evaluation || {},
        feedback: ex.feedback || "",
        strengths: ex.strengths || [],
        improvements: ex.improvements || [],
        // Note: next_prompt is the prompt for next turn, not needed for current exchange eval
      }));

      // Call backend to generate communication report
      const response = await apiFetch('/api/communication-report', {
        method: 'POST',
        body: JSON.stringify({
          exchanges: exchangeData,
          category: category,
          mode: mode
        })
      });

      setReportData(response);
    } catch (error) {
      console.error("Failed to generate communication report:", error);
      // Fallback: generate a basic report from collected data
      setReportData(generateFallbackReport(exchanges, category));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Fallback report generation if backend fails
  const generateFallbackReport = (exchanges, category) => {
    if (!exchanges.length) return null;

    // Simple aggregation of scores
    const totals = {
      clarity: 0, structure: 0, conciseness: 0, relevance: 0, confidence_tone: 0,
      engagement: 0, listening_skills: 0, professionalism: 0,
      coherence: 0, empathy: 0, adaptability: 0, confidence: 0, authenticity: 0
    };

    let count = 0;
    const allStrengths = [];
    const allImprovements = [];
    const allFeedback = [];

    exchanges.forEach(ex => {
      const evalData = ex.evaluation;
      Object.keys(totals).forEach(key => {
        if (evalData[key] !== undefined) {
          totals[key] += evalData[key];
        }
      });
      count++;

      if (ex.strengths) allStrengths.push(...ex.strengths);
      if (ex.improvements) allImprovements.push(...ex.improvements);
      if (ex.feedback) allFeedback.push(ex.feedback);
    });

    const averages = {};
    Object.keys(totals).forEach(key => {
      averages[key] = count > 0 ? Math.round(totals[key] / count * 10) / 10 : 0;
    });

    // Get most common strengths/improvements
    const getTopItems = (items, limit = 3) => {
      const counts = {};
      items.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([item]) => item);
    };

    return {
      strengths: getTopItems(allStrengths),
      areas_to_improve: getTopItems(allImprovements),
      tips: [
        "Focus on being clear and concise in your responses",
        "Use specific examples to illustrate your points",
        "Maintain eye contact and open body language",
        "Practice active listening before responding",
        "Structure your answers with a clear beginning, middle, and end"
      ],
      category_insights: {
        category_mastery: `You demonstrated ${communicationskilllevel(averages.confidence_tone)} confidence in ${category.toLowerCase()} communication.`,
        key_takeaway: "Consistent practice with feedback is the fastest way to improve communication skills.",
        recommended_focus: determineFocusArea(averages)
      },
      real_world_preparation: [
        "In real conversations, pause for 2-3 seconds before responding to gather your thoughts",
        "Ask clarifying questions to ensure you understand the topic fully",
        "Use the 'PREP' framework: Point, Reason, Example, Point",
        "Record yourself practicing to identify areas for improvement",
        "Seek feedback from trusted colleagues or mentors"
      ],
      competency_analysis: {
        demonstrated_competencies: determineDemonstratedCompetencies(averages),
        competencies_to_develop: determineUndevelopedCompetencies(averages),
        communication_style: determineCommunicationStyle(averages)
      }
    };
  };

  // Helper functions for fallback report
  const communicationskilllevel = (score) => {
    if (score >= 8) return "high";
    if (score >= 6) return "moderate";
    return "developing";
  };

  const determineFocusArea = (averages) => {
    const sorted = Object.entries(averages)
      .filter(([key]) =>
        ["clarity", "structure", "conciseness", "relevance", "confidence_tone"].includes(key))
      .sort((a, b) => a[1] - b[1]);
    return sorted[0] ? `Focus on improving ${sorted[0][0]} (currently ${sorted[0][1]}/10)` : "Continue balanced practice";
  };

  const determineDemonstratedCompetencies = (averages) => {
    const competencies = [];
    if (averages.clarity >= 7) competencies.push("Clear Expression");
    if (averages.structure >= 7) competencies.push("Organized Thinking");
    if (averages.confidence_tone >= 7) competencies.push("Confident Delivery");
    if (averages.engagement >= 7) competencies.push("Audience Engagement");
    return competencies;
  };

  const determineUndevelopedCompetencies = (averages) => {
    const competencies = [];
    if (averages.clarity < 6) competencies.push("Clarity of Expression");
    if (averages.structure < 6) competencies.push("Logical Structure");
    if (averages.confidence_tone < 6) competencies.push("Vocal Confidence");
    if (averages.engagement < 6) competencies.push("Audience Connection");
    return competencies;
  };

  const determineCommunicationStyle = (averages) => {
    if (averages.confidence_tone >= 7 && averages.clarity >= 7)
      return "Confident and articulate";
    if (averages.empathy >= 7 && averages.engagement >= 7)
      return "Warm and engaging";
    if (averages.structure >= 7)
      return "Well-organized and systematic";
    return "Developing with room for growth";
  };

  useEffect(() => {
    if (room) {
      if (room.connectionState === "connected") {
        hasConnected.current = true;
      } else if (hasConnected.current && room.connectionState === "disconnected") {
        onComplete();
      }
    }
  }, [room, onComplete]);

  if (isSessionComplete && reportData) {
    // Show report view
    return (
      <div className="min-h-svh flex flex-col">
        <header className="flex items-center justify-between bg-white px-5 py-4 border-b">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Communication Practice Complete
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Strengths</h3>
              <ul className="space-y-1 text-slate-700">
                {reportData.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0">• </span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Areas for Improvement</h3>
              <ul className="space-y-1 text-slate-700">
                {reportData.areas_to_improve.map((area, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0">• </span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Improvement Tips</h3>
              <ul className="space-y-1 text-slate-700">
                {reportData.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0">• </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Category Insights */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Category Insights</h3>
              <p className="text-slate-700">{reportData.category_insights.category_mastery}</p>
              <p className="text-slate-700 mt-1">{reportData.category_insights.key_takeaway}</p>
              <p className="text-slate-700 mt-1">{reportData.category_insights.recommended_focus}</p>
            </div>

            {/* Competency Analysis */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Competency Analysis</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-800">Demonstrated Strengths</h4>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    {reportData.competency_analysis.demonstrated_competencies.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Areas to Develop</h4>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    {reportData.competency_analysis.competencies_to_develop.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Communication Style</h4>
                  <p className="text-slate-700">{reportData.competency_analysis.communication_style}</p>
                </div>
              </div>
            </div>

            {/* Real World Preparation */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Real-World Preparation Tips</h3>
              <ol className="list-decimal list-inside text-slate-700 space-y-2">
                {reportData.real_world_preparation.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ol>
            </div>
          </div>
        </main>

        <div className="flex items-center justify-center pt-4 pb-6">
          <Button
            variant="outline"
            onClick={() => {
              // Reset for potential new session
              setExchanges([]);
              setIsSessionComplete(false);
              setReportData(null);
              onComplete(); // This will trigger cleanup and return to setup
            }}
          >
            Start New Session
          </Button>
        </div>
      </div>
    );
  }

  if (isGeneratingReport && !reportData) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-slate-600">Generating your communication report...</p>
        </div>
      </div>
    );
  }

  // Default session view
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-white px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate text-xs font-bold uppercase tracking-wider text-emerald-400">
            {mode === 'general' ? 'General' : 'Interview Prep'} — {category}
          </span>
        </div>
      </header>

      <main className="grid h-svh grid-cols-1 place-content-center">
        <AnimatePresence mode="wait">
          {/* Session view when connected */}
          <AgentSessionView_01
            supportsChatInput={true}
            supportsVideoInput={true}
            supportsScreenShare={true}
            audioVisualizerType="bar"
            audioVisualizerColor="#34d399"
            audioVisualizerColorShift={0.3}
            audioVisualizerBarCount={5}
            className="fixed inset-0"
          />
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-2">
        <StartAudioButton label="Start Audio" />
      </div>
    </>
  );
}

function SessionView({ roomInfo, onComplete }) {
  const tokenSource = useMemo(() => {
    const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
    return TokenSource.custom(async () => ({
      serverUrl,
      participantToken: roomInfo.token,
    }));
  }, [roomInfo]);

  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <SessionContent mode={roomInfo.mode} category={roomInfo.category} onComplete={onComplete} />
      <RoomAudioRenderer />
    </SessionProvider>
  );
}

export default function CommunicationPage() {
  const [roomInfo, setRoomInfo] = useState(null);

  async function handleStart({ mode, selection }) {
    const data = await apiFetch('/api/livekit/create-room', {
      method: 'POST',
      body: JSON.stringify({ mode, category: selection }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ room: data.room, mode: data.mode, category: data.category }));
    setRoomInfo(data);
  }

  function handleComplete() {
    localStorage.removeItem(STORAGE_KEY);
    if (roomInfo?.room) {
      apiFetch('/api/livekit/end-room', { method: 'POST', body: JSON.stringify({ room: roomInfo.room }) }).catch(() => {});
    }
    setRoomInfo(null);
  }

  if (roomInfo) {
    return (
      <SessionView
        roomInfo={roomInfo}
        onComplete={handleComplete}
      />
    );
  }

  return <SetupScreen onStart={handleStart} />;
}
