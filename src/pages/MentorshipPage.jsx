import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Target, TrendingUp, Play, FileText, Award, Clock, ArrowRight, Upload, BarChart3, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const levelColors = ["bg-slate-400", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
const levelNames = ["Foundation", "Professional", "Advanced", "Expert", "Mentor", "Placement Master"];

export default function MentorshipPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [journey, setJourney] = useState(null);
  const [progress, setProgress] = useState(null);
  const [trends, setTrends] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [interviews, setInterviews] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [lockStatus, setLockStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        journeyRes,
        progressRes,
        trendsRes,
        readinessRes,
        levelsRes,
        interviewsRes,
        comparisonsRes,
        lockRes,
      ] = await Promise.all([
        apiFetch("/api/mentorship/journey"),
        apiFetch("/api/mentorship/progress"),
        apiFetch("/api/mentorship/progress/trends"),
        apiFetch("/api/mentorship/progress/readiness"),
        apiFetch("/api/mentorship/levels"),
        apiFetch("/api/mentorship/journey/interviews"),
        apiFetch("/api/mentorship/resume/comparisons"),
        apiFetch("/api/mentorship/lock-status"),
      ]);

      setJourney(journeyRes.journey);
      setProgress(progressRes.progress);
      setTrends(trendsRes.trends || []);
      setReadiness(readinessRes.readiness);
      setLevels(levelsRes.levels || []);
      setCurrentLevel(levelsRes.current_level || 1);
      setInterviews(interviewsRes.interviews || []);
      setComparisons(comparisonsRes.comparisons || []);
      setLockStatus(lockRes);
    } catch (err) {
      setError(err.message || "Failed to load mentorship data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartInterview = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("resume", file);
      const res = await apiFetch("/api/mentorship/interview/start", {
        method: "POST",
        body: formData,
      });
      navigate(`/mentorship/interview/${res.session_id}`);
    } catch (err) {
      setError(err.message || "Failed to start interview");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  const levelProgress = currentLevel < 6
    ? ((progress?.average_score || 0) / 100) * 100
    : 100;

  const maxTrendScore = Math.max(...trends.map((t) => t.score || 0), 1);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                  <Target className="h-5 w-5 text-brand-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {journey?.career_goal || "Your Mentorship Journey"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    Level {currentLevel} — {levelNames[currentLevel - 1] || "Getting Started"}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Progress to Level {Math.min(currentLevel + 1, 5)}</span>
                  <span className="text-slate-500">{Math.round(levelProgress)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${levelColors[currentLevel - 1] || "bg-brand-500"}`}
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{progress?.total_interviews || 0}</span> interviews completed
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Readiness: <span className="font-medium">{readiness?.score || 0}%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{progress?.average_score || 0}</p>
                <p className="text-xs font-medium text-slate-500">Avg Score</p>
              </div>
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{readiness?.score || 0}%</p>
                <p className="text-xs font-medium text-brand-600">Readiness</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || (lockStatus && !lockStatus.can_start)}
            className="group flex items-center gap-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition group-hover:bg-brand-700">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-900">
                {uploading ? "Starting..." : "Start Interview"}
              </p>
              <p className="mt-0.5 text-xs text-brand-600">
                {lockStatus && !lockStatus.can_start
                  ? `Available ${new Date(lockStatus.next_available_at).toLocaleTimeString()}`
                  : "Upload your resume to begin"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleStartInterview}
          />

          <button
            onClick={() => navigate("/mentorship/reports")}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">View Reports</p>
              <p className="mt-0.5 text-xs text-slate-500">Detailed performance analysis</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>

          <button
            onClick={() => navigate("/mentorship/timeline")}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">View Timeline</p>
              <p className="mt-0.5 text-xs text-slate-500">Your progress over time</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Interviews</h2>
            {interviews.length > 3 && (
              <button
                onClick={() => navigate("/mentorship/reports")}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </button>
            )}
          </div>
          {interviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-400">Start your first interview to see your progress here</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 font-medium text-slate-600">Interview</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Score</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 font-medium text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {interviews.slice(0, 5).map((interview) => (
                      <tr key={interview.session_id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">#{interview.number || interview.session_id?.slice(-4)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {interview.date ? new Date(interview.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (interview.score || 0) >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : (interview.score || 0) >= 60
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {interview.score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            interview.status === "completed" ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {interview.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {interview.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/mentorship/report/${interview.session_id}`)}
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Score Trends</h2>
          {trends.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">Complete interviews to see your trends</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 sm:gap-4" style={{ height: "160px" }}>
              {trends.slice(-5).map((trend, idx) => {
                const height = Math.max(((trend.score || 0) / maxTrendScore) * 100, 8);
                return (
                  <div key={trend.session_id || idx} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{trend.score || 0}</span>
                    <div className="w-full" style={{ height: `${height}%` }}>
                      <div
                        className={`h-full w-full rounded-t-lg transition-all duration-500 ${
                          (trend.score || 0) >= 80
                            ? "bg-emerald-500"
                            : (trend.score || 0) >= 60
                            ? "bg-amber-400"
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
          )}
          {trends.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400" /> Below 60
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> 60–79
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+
              </span>
            </div>
          )}
        </section>

        {levels.length > 0 && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Level Progression</h2>
            <div className="flex flex-col gap-3">
              {levels.map((lvl) => {
                const isActive = lvl.level === currentLevel;
                const isCompleted = lvl.level < currentLevel;
                return (
                  <div
                    key={lvl.level}
                    className={`flex items-center gap-4 rounded-lg border p-3 sm:p-4 transition ${
                      isActive
                        ? "border-brand-300 bg-brand-50"
                        : isCompleted
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${levelColors[lvl.level - 1] || "bg-slate-400"}`}>
                      {lvl.level}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActive ? "text-brand-900" : "text-slate-800"}`}>
                        {lvl.name || `Level ${lvl.level}`}
                      </p>
                      <p className="text-xs text-slate-500">Min score: {lvl.min_score || 0}</p>
                    </div>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {isActive && <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Current</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {comparisons.length > 0 && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Resume Versions</h2>
              <button
                onClick={() => navigate("/mentorship/resume/compare")}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Compare versions <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((comp, idx) => (
                <div
                  key={comp._id || idx}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-slate-200"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {comp.name || `Version ${idx + 1}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {comp.uploaded_at ? new Date(comp.uploaded_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {comp.improvement !== undefined && (
                    <span className={`text-xs font-semibold ${comp.improvement >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {comp.improvement >= 0 ? "+" : ""}{comp.improvement}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}