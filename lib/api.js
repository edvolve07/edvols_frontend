// In Vite dev, relative /api requests are forwarded by vite.config.js.
// In production/mobile preview, replace localhost API URLs with the current
// device-visible host so phones do not try to call their own localhost.
function getBaseUrl() {
  if (import.meta.env.DEV) return "";

  const configured = import.meta.env.VITE_API_URL || "";
  if (!configured || typeof window === "undefined") return configured;

  try {
    const url = new URL(configured);
    const isLocalApiHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
    const isBrowserOnRemoteHost = !["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocalApiHost && isBrowserOnRemoteHost) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return configured;
  }

  return configured.replace(/\/$/, "");
}

const BASE_URL = getBaseUrl();

const API_KEY = import.meta.env.VITE_API_KEY || "";

function headers(extra) {
  const h = { ...(extra || {}) };
  if (API_KEY) h["X-API-Key"] = API_KEY;
  return h;
}

function authHeaders(extra) {
  const h = headers(extra);
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) h.Authorization = `Bearer ${token}`;
  }
  return h;
}

function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
}

function htmlToText(value) {
  if (!value || !value.trim().startsWith("<!DOCTYPE html")) return value;
  const pre = value.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1] || value;
  return pre
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .split("\n")[0]
    .replace(/^Error:\s*/i, "")
    .trim();
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return htmlToText(data) || fallback;
  if (typeof data.message === "string") return data.message;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join(", ");
  }
  if (typeof data.error === "string") return data.error;
  return fallback;
}

export function isUnauthorizedError(error) {
  return error?.status === 401;
}

export async function apiFetch(path, options = {}) {
  const requestHeaders = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: authHeaders(requestHeaders),
  });

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) clearStoredAuth();
    const error = new Error(
      getErrorMessage(
        data,
        res.status === 401 ? "Your session expired. Please sign in again." : `HTTP ${res.status}`
      )
    );
    error.status = res.status;
    error.data = data;
    if (res.status === 423) error.locked = true;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(name, email, password) {
  return apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      confirmPassword: password,
    }),
  });
}

/* ─── Start interview ─── */
export async function startInterview(domain, role, resumeFile) {
  const form = new FormData();
  form.append("domain", domain);
  form.append("role",   role);
  form.append("file",   resumeFile);
  return apiFetch("/api/start", { method: "POST", body: form });
}

/* ─── Submit text answer ─── */
export async function submitTextAnswer(sessionId, answer) {
  return apiFetch("/api/answer_text", {
    method:  "POST",
    body:    JSON.stringify({ session_id: sessionId, answer }),
  });
}

/* ─── Submit answer: audio + optional video ─── */
export async function submitAnswer(
  sessionId,
  audioBlob,
  videoBlob
) {
  const audioExt  = (audioBlob.type || "audio/webm").includes("mp4") ? "mp4" : "webm";
  const videoExt  = (videoBlob?.type || "video/webm").includes("mp4") ? "mp4" : "webm";

  const form = new FormData();
  form.append("session_id", sessionId);

  if (videoBlob) {
    form.append("video", videoBlob, `video.${videoExt}`);
    form.append("audio", audioBlob, `audio.${audioExt}`);

    const res = await fetch(`${BASE_URL}/api/answer_video_with_audio`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Server error ${res.status}`);
    }
    return res.json();
  } else {
    form.append("video", audioBlob, `audio.${audioExt}`);
    const res = await fetch(`${BASE_URL}/api/answer_video`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
   if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Server error ${res.status}`);
    }
    return res.json();
  }
}

/* ─── End interview & generate report ─── */
export async function endInterview(sessionId) {
  return apiFetch("/api/end", {
    method:  "POST",
    body:    JSON.stringify({ session_id: sessionId }),
  });
}

/* ─── Get report ─── */
export async function getReport(sessionId) {
  return apiFetch(`/api/report/${sessionId}`);
}

export async function getInterviewReports() {
  return apiFetch("/api/reports");
}

async function downloadPdf(path, filename) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadReportPdf(sessionId) {
  return downloadPdf(`/api/report/${sessionId}/pdf`, `report_${sessionId}.pdf`);
}

export function downloadReportAtsPdf(sessionId) {
  return downloadPdf(`/api/report/${sessionId}/ats`, `ats_report_${sessionId}.pdf`);
}

export function downloadResumePdf(versionId, version = "") {
  return downloadPdf(`/api/student/resume-builder/versions/${versionId}/pdf`, `resume${version ? `_v${version}` : ""}.pdf`);
}

export function downloadCertificatePdf(certificateId) {
  return downloadPdf(`/api/student/certificates/${certificateId}/pdf`, `certificate_${certificateId}.pdf`);
}

export function downloadAdminExport(type, format = "xlsx") {
  return downloadPdf(`/api/admin/exports/${type}?format=${format}`, `${type}.${format}`);
}

export function downloadCodingProgressExport(format = "xlsx") {
  return downloadPdf(`/api/programming/admin/exports/coding-progress?format=${format}`, `coding-progress.${format}`);
}

/* ─── Aptitude ─── */
export async function getAptitudeQuestions(domain, count = 20) {
  const res = await fetch(`${BASE_URL}/api/aptitude/questions?domain=${domain}&count=${count}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitAptitude(domain, answers) {
  const res = await fetch(`${BASE_URL}/api/aptitude/submit`, {
    method:  "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body:    JSON.stringify({ domain, answers }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStudentAssessments() {
  return apiFetch("/api/student/assessments");
}

export async function startStudentAssessment(assessmentId) {
  return apiFetch(`/api/student/assessments/${assessmentId}/start`, { method: "POST" });
}

export async function saveStudentAnswer(attemptId, questionId, selectedOption) {
  return apiFetch(`/api/student/attempts/${attemptId}/answers`, {
    method: "PUT",
    body: JSON.stringify({ question_id: questionId, selected_option: selectedOption }),
  });
}

export async function submitStudentAttempt(attemptId) {
  return apiFetch(`/api/student/attempts/${attemptId}/submit`, { method: "POST" });
}

export async function getStudentAttemptTime(attemptId) {
  return apiFetch(`/api/student/attempts/${attemptId}/time`);
}

export async function logProctoringEvent(attemptId, eventType, metadata = {}, assessmentType = "aptitude") {
  return apiFetch("/api/student/proctoring/events", {
    method: "POST",
    body: JSON.stringify({
      attempt_id: attemptId,
      assessment_type: assessmentType,
      event_type: eventType,
      metadata,
    }),
  });
}

export async function getStudentResults() {
  return apiFetch("/api/student/results");
}

export async function getStudentResult(attemptId) {
  return apiFetch(`/api/student/results/${attemptId}`);
}

/* ─── Get session state (for resume on refresh) ─── */
export async function getSessionState(sessionId) {
  return apiFetch(`/api/session/${sessionId}`);
}

/* ─── Programming Practice ─── */
export async function getProgrammingProblems(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/programming/student/problems${query ? `?${query}` : ''}`);
}

export async function getProgrammingProblem(id) {
  return apiFetch(`/api/programming/student/problems/${id}`);
}

export async function getProgrammingStarterCode(problemId, language) {
  return apiFetch(`/api/programming/student/problems/${problemId}/starter-code?language=${language}`);
}

export async function submitProgrammingSolution(problemId, code, language) {
  return apiFetch(`/api/programming/student/problems/${problemId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

export async function getProgrammingSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/programming/student/submissions${query ? `?${query}` : ''}`);
}

export async function getProgrammingSubmission(id) {
  return apiFetch(`/api/programming/student/submissions/${id}`);
}

/* ─── Admin Programming ─── */
export async function getAdminProgrammingProblems(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/programming/admin/problems${query ? `?${query}` : ''}`);
}

export async function getAdminProgrammingProblem(id) {
  return apiFetch(`/api/programming/admin/problems/${id}`);
}

export async function createProgrammingProblem(data) {
  return apiFetch('/api/programming/master/problems', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProgrammingProblem(id, data) {
  return apiFetch(`/api/programming/master/problems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateProgrammingProblemStatus(id, status) {
  return apiFetch(`/api/programming/master/problems/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteProgrammingProblem(id) {
  return apiFetch(`/api/programming/master/problems/${id}`, { method: 'DELETE' });
}

export async function getAdminProgrammingSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/programming/admin/submissions${query ? `?${query}` : ''}`);
}

export async function getAdminProgrammingSubmission(id) {
  return apiFetch(`/api/programming/admin/submissions/${id}`);
}

export async function getAdminProgrammingDashboard() {
  return apiFetch('/api/programming/admin/dashboard');
}

export async function getAdminProgrammingAnalytics() {
  return apiFetch('/api/programming/admin/analytics/students');
}

export async function getMasterProgrammingProblems(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/programming/master/problems${query ? `?${query}` : ''}`);
}

export async function getMasterProgrammingProblem(id) {
  return apiFetch(`/api/programming/master/problems/${id}`);
}

export async function getMasterProgrammingSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/programming/master/submissions${query ? `?${query}` : ''}`);
}

export async function getMasterProgrammingDashboard() {
  return apiFetch('/api/programming/master/dashboard');
}

/* ─── Programming Assessments ─── */

export async function getProgrammingStudentAssessments() {
  return apiFetch('/api/programming-assessment/student/assessments');
}

export async function startAssessment(id) {
  return apiFetch(`/api/programming-assessment/student/assessments/${id}/start`, { method: 'POST' });
}

export async function saveAssessmentAnswer(attemptId, problemId, code, language) {
  return apiFetch(`/api/programming-assessment/student/attempts/${attemptId}/answers/${problemId}`, {
    method: 'PUT',
    body: JSON.stringify({ code, language }),
  });
}

export async function submitAssessment(attemptId) {
  return apiFetch(`/api/programming-assessment/student/attempts/${attemptId}/submit`, { method: 'POST' });
}

export async function getAssessmentResults() {
  return apiFetch('/api/programming-assessment/student/results');
}

export async function getAssessmentResult(attemptId) {
  return apiFetch(`/api/programming-assessment/student/results/${attemptId}`);
}

/* ─── Admin Programming Assessments ─── */

export async function getAdminAssessments() {
  return apiFetch('/api/programming-assessment/admin/assessments');
}

export async function createAdminAssessment(data) {
  return apiFetch('/api/programming-assessment/admin/assessments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAdminAssessment(id) {
  return apiFetch(`/api/programming-assessment/admin/assessments/${id}`);
}

export async function updateAdminAssessment(id, data) {
  return apiFetch(`/api/programming-assessment/admin/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateAdminAssessmentStatus(id, status) {
  return apiFetch(`/api/programming-assessment/admin/assessments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminAssessment(id) {
  return apiFetch(`/api/programming-assessment/admin/assessments/${id}`, { method: 'DELETE' });
}

export async function saveAdminAssessmentProblems(id, problems) {
  return apiFetch(`/api/programming-assessment/admin/assessments/${id}/problems`, {
    method: 'PUT',
    body: JSON.stringify({ problems }),
  });
}

export async function getAdminAssessmentResults(id) {
  return apiFetch(`/api/programming-assessment/admin/assessments/${id}/results`);
}

export async function getAdminAssessmentAnalytics() {
  return apiFetch('/api/programming-assessment/admin/analytics');
}

/* ─── Master Admin Programming Assessments ─── */

export async function getMasterAssessments() {
  return apiFetch('/api/programming-assessment/master/assessments');
}

export async function createMasterAssessment(data) {
  return apiFetch('/api/programming-assessment/master/assessments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMasterAssessment(id) {
  return apiFetch(`/api/programming-assessment/master/assessments/${id}`);
}

export async function updateMasterAssessment(id, data) {
  return apiFetch(`/api/programming-assessment/master/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateMasterAssessmentStatus(id, status) {
  return apiFetch(`/api/programming-assessment/master/assessments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteMasterAssessment(id) {
  return apiFetch(`/api/programming-assessment/master/assessments/${id}`, { method: 'DELETE' });
}

export async function saveMasterAssessmentProblems(id, problems) {
  return apiFetch(`/api/programming-assessment/master/assessments/${id}/problems`, {
    method: 'PUT',
    body: JSON.stringify({ problems }),
  });
}

export async function getMasterAssessmentResults(id) {
  return apiFetch(`/api/programming-assessment/master/assessments/${id}/results`);
}

/* ─── Institutions ─── */

export async function getInstitutions(params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/institutions${qs}`);
}

export async function getInstitution(id) {
  return apiFetch(`/api/institutions/${id}`);
}

export async function createInstitution(data) {
  return apiFetch('/api/institutions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInstitution(id, data) {
  return apiFetch(`/api/institutions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteInstitution(id) {
  return apiFetch(`/api/institutions/${id}`, { method: 'DELETE' });
}

export async function getInstitutionAdmins(id) {
  return apiFetch(`/api/institutions/${id}/admins`);
}

export async function getInstitutionAnalytics(id) {
  return apiFetch(`/api/institutions/${id}/analytics`);
}

/* ─── Institutions Dropdown ─── */

export async function getInstitutionsList() {
  return apiFetch('/api/master/institutions-list');
}

/* ─── Health ─── */
export async function healthCheck() {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error("API offline");
  return res.json();
}
