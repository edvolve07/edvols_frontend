import { useState, useEffect, Component } from "react";
import {
  Loader2,
  Target,
  TrendingUp,
  CheckCircle2,
  Check,
  Award,
  ArrowRight,
  Clock,
  FileText,
  Briefcase,
  BarChart3,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  AlertCircle,
  Lock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { usePlacementProgress } from "@/src/hooks/usePlacementProgress";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

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
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const levelColors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600"];

const MILESTONES = {
  1: { number: 10, title: 'Foundation Mock Evaluation', badge: 'Level 1 Milestone' },
  2: { number: 20, title: 'Intermediate Mock Evaluation', badge: 'Level 2 Milestone' },
  3: { number: 30, title: 'Final Placement Simulation', badge: 'Placement Ready Milestone' },
};

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function PlacementJourneyInner() {
  const navigate = useNavigate();
  const { data: p, loading, error } = usePlacementProgress();
  const [retakingId, setRetakingId] = useState(null);
  const [startingInterviewNumber, setStartingInterviewNumber] = useState(null);
  const [expandedLevels, setExpandedLevels] = useState({});
  const [careerProfile, setCareerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (p?.currentLevel) {
      setExpandedLevels((prev) => {
        if (Object.keys(prev).length === 0) {
          return { [p.currentLevel]: true };
        }
        return prev;
      });
    }
  }, [p?.currentLevel]);

  const toggleLevel = (lvlId) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lvlId]: !prev[lvlId],
    }));
  };

  const handleStartSession = async (interviewNumber) => {
    try {
      setStartingInterviewNumber(interviewNumber);
      const res = await apiFetch(`/api/mentorship/interview/start/${interviewNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_saved: true,
          domain: careerProfile?.stream || careerProfile?.domain || "",
          role: careerProfile?.target_role || careerProfile?.interested_role || "",
        }),
      });
      navigate(`/mentorship/interview/${res.session_id}`);
    } catch (_e) {
      navigate("/interview");
    } finally {
      setStartingInterviewNumber(null);
    }
  };

  useEffect(() => {
    async function loadCareerProfile() {
      try {
        const res = await apiFetch("/api/student/career-profile");
        setCareerProfile(res);
      } catch (_e) {
        try {
          const fallback = await apiFetch("/api/placement/student/career-profile");
          setCareerProfile(fallback);
        } catch (_err) {}
      } finally {
        setLoadingProfile(false);
      }
    }
    loadCareerProfile();
  }, []);

  const handleRetake = async (iv) => {
    const interviewNumber = iv.interviewNumber || iv.interview_number || iv.number;
    const id = iv.id || iv.sessionId;
    try {
      setRetakingId(id);
      if (interviewNumber) {
        const res = await apiFetch(`/api/mentorship/interview/start/${interviewNumber}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            use_saved: true,
            domain: careerProfile?.stream || careerProfile?.domain || iv.domain || "",
            role: careerProfile?.target_role || careerProfile?.interested_role || iv.role || "",
          }),
        });
        if (res?.session_id) {
          navigate(`/mentorship/interview/${res.session_id}`);
          return;
        }
      }
      navigate("/interview");
    } catch (_e) {
      navigate("/interview");
    } finally {
      setRetakingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  if (!p) return null;

  const LEVEL_PRICES = { 1: 199, 2: 499, 3: 849 };

  const {
    currentLevel, currentLevelName, placementReadiness, averageScore,
    completedInterviews, progressPercentage, levels, recentInterviews,
    trends, accessLevel, targetCareerGoal,
  } = p;

  const effectiveAccessLevel = (() => {
    const sub = p.currentPlan;
    const k = String(sub?.plan_key || sub?.plan_name || sub?.name || '').toLowerCase();
    const amt = Number(sub?.amount_paid || sub?.amountPaid) || 0;
    if (k.includes('pro') || k.includes('placement') || amt >= 700) return 3;
    if (k.includes('career') || k.includes('advanced') || (amt >= 400 && amt < 700)) return 2;
    if (k.includes('starter') || k.includes('basic') || (amt >= 150 && amt < 400)) return 1;
    const raw = Number(accessLevel ?? sub?.accessLevel ?? sub?.access_level) || 0;
    if (raw === 2) return 2;
    if (raw === 3) return 3;
    if (raw === 1) return 1;
    return raw > 0 ? raw : 1;
  })();

  const maxTrendScore = Math.max(...trends.map((t) => t.score || 0), 1);

  const readinessScore = careerProfile?.readiness_score ?? placementReadiness ?? 0;
  const readinessBand = careerProfile?.readiness_band || (
    readinessScore >= 85 ? 'Placement Ready' :
    readinessScore >= 75 ? 'Interview Ready' :
    readinessScore >= 60 ? 'Development Required' : 'High Intervention'
  );

  const bandBadgeColors = {
    'Placement Ready': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Interview Ready': 'bg-blue-100 text-blue-800 border-blue-300',
    'Development Required': 'bg-amber-100 text-amber-800 border-amber-300',
    'High Intervention': 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        
        {/* Hero Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {careerProfile?.target_role || targetCareerGoal || "Placement Readiness Journey"}
                  </h1>
                  <p className="text-sm font-medium text-slate-500">
                    Domain: <span className="text-slate-800 font-semibold">{careerProfile?.target_domain || 'Engineering'}</span> · Level {currentLevel} ({currentLevelName})
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Journey Progression (30 Structured Interviews)</span>
                  <span className="font-bold text-emerald-700">
                    {completedInterviews} / 30 completed ({Math.min(100, Math.round((completedInterviews / 30) * 100))}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((completedInterviews / 30) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-slate-900">{completedInterviews}</span> of 30 sessions completed
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Average Score: <span className="font-bold text-slate-900">{averageScore || 0}%</span>
                </div>
                {careerProfile?.resume_ats_score != null && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Resume ATS: <span className="font-bold text-slate-900">{careerProfile.resume_ats_score}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Official Readiness Score & Band */}
            <div className="flex flex-col items-center sm:items-end gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center min-w-[200px] shadow-sm">
                <p className="text-3xl font-extrabold text-emerald-700">{Math.round(readinessScore)}%</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mt-0.5">Placement Readiness Score</p>
                <div className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-bold ${bandBadgeColors[readinessBand] || 'bg-slate-100 text-slate-700'}`}>
                  {readinessBand}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7-Competency Placement Breakdown */}
        {careerProfile?.competency_breakdown && careerProfile.competency_breakdown.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Placement Competencies Breakdown</h2>
                <p className="text-xs text-slate-500">Official weighted evaluation across 7 standardized placement pillars</p>
              </div>
              <span className="text-xs font-medium text-slate-400">Formula-Driven Deterministic Scoring</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {careerProfile.competency_breakdown.map((comp) => (
                <div key={comp.key} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>{comp.name}</span>
                    <span className="text-slate-400">{comp.weight}% weight</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">{Math.round(comp.score)}%</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      comp.score >= 75 ? 'bg-emerald-100 text-emerald-700' :
                      comp.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {comp.score >= 75 ? 'Strong' : comp.score >= 60 ? 'Moderate' : 'Needs Work'}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        comp.score >= 75 ? 'bg-emerald-500' : comp.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, comp.score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Action Plan (3 Concrete Next Steps) */}
        {careerProfile?.recommended_steps && careerProfile.recommended_steps.length > 0 && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Personalized Placement Action Plan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {careerProfile.recommended_steps.map((step) => (
                <div key={step.step} className="rounded-xl border border-emerald-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        {step.step}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        step.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {step.priority} Priority
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{step.action}</p>
                  </div>
                  {step.target_improvement > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold">
                      +{step.target_improvement}% potential score gain
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate("/interview")}
            className="group flex items-center gap-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left transition hover:border-brand-300 hover:bg-brand-100 sm:p-5 shadow-xs"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition group-hover:bg-brand-700">
              <Play className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-brand-900">Start Next Session</p>
              <p className="mt-0.5 text-xs text-brand-600">Continue 30-interview progression</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </button>

          <button
            onClick={() => navigate("/reports")}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:p-5 shadow-xs"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">Performance Reports</p>
              <p className="mt-0.5 text-xs text-slate-500">Detailed question evaluation</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>

          <button
            onClick={() => navigate("/resume-builder")}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:p-5 shadow-xs"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">Resume Builder</p>
              <p className="mt-0.5 text-xs text-slate-500">ATS optimization & claims check</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>
        </section>

        {/* Next Active Session To Complete (Banner) */}
        {p.nextInterview && (() => {
          const isNextLockedByTier = effectiveAccessLevel != null && p.nextInterview.level > effectiveAccessLevel;
          const upgradeDiff = effectiveAccessLevel ? Math.max(0, (LEVEL_PRICES[p.nextInterview.level] || 849) - (LEVEL_PRICES[effectiveAccessLevel] || 0)) : (p.nextInterview.level === 2 ? 499 : 849);
          return (
            <section className={`rounded-2xl border-2 p-6 shadow-sm ${
              isNextLockedByTier
                ? "border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/60"
                : "border-brand-300 bg-gradient-to-r from-brand-50 via-white to-purple-50"
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                    isNextLockedByTier ? "bg-amber-600" : "bg-brand-600"
                  }`}>
                    {isNextLockedByTier ? <Lock className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isNextLockedByTier ? "text-amber-800 bg-amber-100" : "text-brand-700 bg-brand-100"
                      }`}>
                        {isNextLockedByTier ? `LEVEL ${p.nextInterview.level} LOCKED · NEXT SESSION #${p.nextInterview.interview_number}` : `NEXT UP · SESSION #${p.nextInterview.interview_number}`}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Level {p.nextInterview.level}: {p.nextInterview.level_name}
                      </span>
                      {p.nextInterview.is_milestone && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Award className="h-3 w-3 text-amber-600" />
                          {p.nextInterview.milestone_badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{p.nextInterview.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {isNextLockedByTier
                        ? `You've completed your Level ${effectiveAccessLevel} journey! Upgrade to Level ${p.nextInterview.level} to unlock Session #${p.nextInterview.interview_number} and all remaining advanced interviews.`
                        : (p.nextInterview.objective || `Focus areas: ${p.nextInterview.focus_areas?.join(", ")}`)}
                    </p>
                  </div>
                </div>

                {isNextLockedByTier ? (
                  <button
                    onClick={() => navigate(`/subscription?target=${p.nextInterview.level}`)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg whitespace-nowrap cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    Unlock Level {p.nextInterview.level} ({upgradeDiff > 0 ? `₹${upgradeDiff} Upgrade` : (p.nextInterview.level === 2 ? "₹499" : "₹849")})
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    disabled={startingInterviewNumber != null}
                    onClick={() => handleStartSession(p.nextInterview.interview_number)}
                    className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 hover:shadow-lg disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {startingInterviewNumber === p.nextInterview.interview_number ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting Session…
                      </>
                    ) : (
                      <>
                        Start Interview #{p.nextInterview.interview_number}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          );
        })()}

        {/* 30-Interview Structured Progression Roadmap */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">30-Interview Progression Framework</h2>
              <p className="text-xs text-slate-500">3 levels of 10 interviews each with completed, active next, and milestone evaluations</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Level {effectiveAccessLevel} License
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {levels.map((lvl) => {
              const isLocked = lvl.status === "locked" || (effectiveAccessLevel != null && lvl.id > effectiveAccessLevel);
              const isActiveLvl = !isLocked && lvl.status === "current";
              const isCompleted = !isLocked && lvl.status === "completed";
              const milestone = MILESTONES[lvl.id];
              const range = lvl.id === 1 ? '1–10' : lvl.id === 2 ? '11–20' : '21–30';
              const isExpanded = Boolean(expandedLevels[lvl.id]);
              const interviews = lvl.interviews || [];
              const completedCount = interviews.filter((i) => i.status === 'completed').length;

              return (
                <div
                  key={lvl.id}
                  className={`rounded-xl border p-5 transition ${
                    isActiveLvl ? "border-brand-400 bg-brand-50/50 shadow-xs"
                      : isCompleted ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200 bg-slate-50 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-xs ${
                        isLocked ? "bg-slate-400" : (levelColors[lvl.id - 1] || "bg-slate-500")
                      }`}>
                        {isLocked ? <Lock className="h-5 w-5" /> : `L${lvl.id}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-bold ${isActiveLvl ? "text-brand-900" : isLocked ? "text-slate-400" : "text-slate-900"}`}>
                            Level {lvl.id}: {lvl.name}
                          </h3>
                          <span className="text-xs font-semibold text-slate-500">
                            (Interviews {range})
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isLocked ? "text-slate-400" : "text-slate-600"}`}>
                          {completedCount || lvl.completedInterviews} / 10 interviews completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                      {isActiveLvl && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
                          Active Level
                        </span>
                      )}
                      {isLocked && <Lock className="h-4 w-4 text-slate-400" />}

                      <button
                        onClick={() => toggleLevel(lvl.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                      >
                        <span>
                          {isExpanded
                            ? (effectiveAccessLevel != null && lvl.id > effectiveAccessLevel ? "Hide Preview" : "Hide Sessions")
                            : (effectiveAccessLevel != null && lvl.id > effectiveAccessLevel ? "Preview 10 Sessions" : "View 10 Sessions")}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Curiosity Unlock Showcase for Unpurchased Level */}
                  {effectiveAccessLevel != null && lvl.id > effectiveAccessLevel && (
                    <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 p-5 shadow-xs">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-amber-800 border border-amber-300">
                              <Lock className="h-3 w-3" /> Locked Level {lvl.id}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {lvl.id === 2 ? "Skill Development Tier" : "Placement Ready Pro Tier"}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {lvl.id === 2
                              ? "Unlock 10 Advanced Technical & System Design Interviews + Intermediate Mock (#20)"
                              : "Unlock Final 10 Comprehensive Rounds + Placement Simulation (#30) + Verified Placement Certificate"}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {lvl.id === 2
                              ? "Step up from foundation fundamentals to real-world domain engineering, STAR behavioral situations, and get graded on Interview #20 before placement season."
                              : "Complete your readiness journey with executive crisis rounds, top MNC simulations, and earn an employer-verifiable certificate with official readiness scores."}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {lvl.id === 2 ? (
                              <>
                                <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">⚡ 10 In-Depth Technical Rounds</span>
                                <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">🎯 STAR Behavioral Mastery</span>
                                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">🏆 Intermediate Mock (#20)</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">👑 10 Placement Simulation Rounds</span>
                                <span className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">🎓 Verified Placement Certificate</span>
                                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">🥇 Final Placement Simulation (#30)</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/subscription?target=${lvl.id}`)}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:shadow-lg whitespace-nowrap cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4" />
                          Unlock Level {lvl.id} ({(() => {
                            const diff = Math.max(0, (LEVEL_PRICES[lvl.id] || 849) - (LEVEL_PRICES[effectiveAccessLevel] || 0));
                            return diff > 0 ? `₹${diff} Upgrade` : (lvl.id === 2 ? "₹499" : "₹849");
                          })()})
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Milestone mock badge */}
                  {milestone && (
                    <div className="mt-3.5 flex items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3.5 py-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                        <Award className="h-4 w-4 text-amber-600" />
                        <span>Interview #{milestone.number}: {milestone.title}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">
                        {milestone.badge}
                      </span>
                    </div>
                  )}

                  {/* Expanded 10-Interview List */}
                  {isExpanded && interviews.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200/90 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1 px-1">
                        <span>Structured Sessions in Level {lvl.id}</span>
                        <span className="font-bold text-slate-700">{completedCount} of 10 Completed</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {interviews.map((iv) => {
                          const isIvCompleted = iv.status === 'completed';
                          const isIvNext = iv.status === 'next';
                          const isIvLocked = iv.status === 'locked';

                          return (
                            <div
                              key={iv.interview_number}
                              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                                isIvNext
                                  ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                                  : isIvCompleted
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div
                                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                                    isIvNext
                                      ? 'bg-purple-600 text-white'
                                      : isIvCompleted
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {isIvCompleted ? <Check size={14} /> : `#${iv.interview_number}`}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p
                                      className={`text-xs font-bold truncate ${
                                        isIvNext ? 'text-purple-950 font-extrabold' : isIvCompleted ? 'text-slate-900' : 'text-slate-700'
                                      }`}
                                    >
                                      #{iv.interview_number}: {iv.title}
                                    </p>
                                    {iv.is_milestone && (
                                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                        Milestone
                                      </span>
                                    )}
                                  </div>
                                  {iv.objective ? (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={iv.objective}>
                                      {iv.objective}
                                    </p>
                                  ) : null}
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                    {isIvCompleted && iv.overall_score != null ? (
                                      <span className="font-bold text-emerald-700">Completed · Score: {iv.overall_score}%</span>
                                    ) : isIvNext ? (
                                      <span className="font-bold text-purple-700">Next active session to complete</span>
                                    ) : (
                                      <span>{iv.difficulty || 'Intermediate'} · {iv.category}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isIvCompleted ? (
                                  <button
                                    disabled={startingInterviewNumber != null}
                                    onClick={() => handleStartSession(iv.interview_number)}
                                    className="text-[11px] font-bold text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition cursor-pointer"
                                  >
                                    Retake
                                  </button>
                                ) : isIvNext ? (
                                  <button
                                    disabled={startingInterviewNumber != null}
                                    onClick={() => handleStartSession(iv.interview_number)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md shadow-xs transition cursor-pointer"
                                  >
                                    <Play size={10} className="fill-white" />
                                    Start Next
                                  </button>
                                ) : isIvLocked ? (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                    <Lock size={11} /> Locked
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    <Clock size={11} /> Upcoming
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {effectiveAccessLevel != null && lvl.id > effectiveAccessLevel && (
                          <div className="col-span-full mt-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-amber-950">
                                Eager to practice these {lvl.id === 2 ? "10 Skill Development" : "10 Placement Ready"} interviews?
                              </p>
                              <p className="text-[11px] text-amber-800 mt-0.5">
                                Upgrade to Level {lvl.id} to access Sessions {range} with real-time AI scoring and replay.
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/subscription?target=${lvl.id}`)}
                              className="text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 px-4 py-2 rounded-lg shadow-xs transition whitespace-nowrap cursor-pointer"
                            >
                              Unlock Level {lvl.id} ({(() => {
                                const diff = Math.max(0, (LEVEL_PRICES[lvl.id] || 849) - (LEVEL_PRICES[effectiveAccessLevel] || 0));
                                return diff > 0 ? `₹${diff} Upgrade` : (lvl.id === 2 ? "₹499" : "₹849");
                              })()})
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {lvl.features?.length > 0 && !isLocked && !isExpanded && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {lvl.features.map((feat) => (
                        <span key={feat} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          <Zap className="h-3 w-3 text-emerald-500" />{feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Certificate Eligibility Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                completedInterviews >= 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Placement Readiness Certification</h3>
                <p className="text-xs text-slate-500">
                  {completedInterviews >= 30
                    ? 'Congratulations! You have successfully completed all 30 sessions and unlocked your verified certificate.'
                    : `Complete all 30 progressive interview sessions across Levels 1, 2, and 3 to earn your verified credential (${completedInterviews}/30 completed).`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(completedInterviews >= 30 ? '/certificates' : '/interview')}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs ${
                completedInterviews >= 30
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {completedInterviews >= 30 ? 'View Certificate' : 'Continue Journey'}
            </button>
          </div>
        </section>

        {/* Recent interviews */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Journey Interviews</h2>
            {recentInterviews.length > 5 && (
              <button onClick={() => navigate("/reports")} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </button>
            )}
          </div>
          {recentInterviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-400">Start Interview #1 to begin your placement journey</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInterviews.slice(0, 5).map((iv, idx) => (
                <div
                  key={iv.id || idx}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    (iv.score || 0) >= 80 ? "bg-emerald-500"
                      : (iv.score || 0) >= 60 ? "bg-amber-400"
                      : "bg-rose-400"
                  }`}>
                    {iv.interviewNumber || idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Interview #{iv.interviewNumber || idx + 1}
                      </p>
                      {iv.blueprintTitle && (
                        <span className="text-xs text-slate-500">{iv.blueprintTitle}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {iv.completedAt ? formatDateTime(iv.completedAt) : "—"}
                      {iv.grade && <span className="ml-2">Grade: {iv.grade}</span>}
                    </p>
                  </div>
                  {Number.isFinite(Number(iv.score)) && (
                    <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      (iv.score || 0) >= 80 ? "bg-emerald-50 text-emerald-700"
                        : (iv.score || 0) >= 60 ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {Math.round(Number(iv.score))}%
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRetake(iv)}
                      disabled={retakingId === (iv.id || iv.sessionId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition shadow-xs disabled:opacity-50"
                      title="Attend this interview again"
                    >
                      <RefreshCw className={`h-3 w-3 ${retakingId === (iv.id || iv.sessionId) ? "animate-spin" : ""}`} />
                      {retakingId === (iv.id || iv.sessionId) ? "Starting…" : "Attend Again"}
                    </button>
                    <button
                      onClick={() => navigate("/report", { state: { sessionId: iv.sessionId } })}
                      className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-600"
                    >
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Score trends */}
        {trends.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Score Trends</h2>
            <div className="flex items-end gap-3 sm:gap-4" style={{ height: "160px" }}>
              {trends.slice(-5).map((trend, idx) => {
                const height = Math.max(((trend.score || 0) / maxTrendScore) * 100, 8);
                return (
                  <div key={trend.sessionId || idx} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{trend.score || 0}</span>
                    <div className="w-full" style={{ height: `${height}%` }}>
                      <div
                        className={`h-full w-full rounded-t-lg transition-all duration-500 ${
                          (trend.score || 0) >= 80 ? "bg-emerald-500"
                            : (trend.score || 0) >= 60 ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {trend.date ? new Date(trend.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `#${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400" /> Below 60</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> 60–79</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function PlacementJourneyPage() {
  return (
    <ErrorBoundary>
      <PlacementJourneyInner />
    </ErrorBoundary>
  );
}
