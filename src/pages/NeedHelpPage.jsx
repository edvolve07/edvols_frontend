import { useEffect, useState } from "react";
import {
  Loader2,
  HelpCircle,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/src/portal/context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  open: { label: "Open", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  in_progress: { label: "In Progress", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  resolved: { label: "Resolved", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      {config.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NeedHelpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", institution: "", issue: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState("submit");

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        institution: prev.institution || user.institution || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/help/my")
      .then((res) => setRequests(Array.isArray(res) ? res : res.requests || []))
      .catch((err) => setError(err.message || "Failed to load help requests."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    try {
      const res = await apiFetch("/api/help", {
        method: "POST",
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, institution: form.institution, issue: form.issue }),
      });
      setRequests((prev) => [res.request, ...prev]);
      setSubmitSuccess(true);
      setForm((prev) => ({ ...prev, phone: "", issue: "" }));
      setTimeout(() => setSubmitSuccess(false), 5000);
      setActiveTab("history");
    } catch (err) {
      setSubmitError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Need Help?</h1>
              <p className="text-xs text-slate-500">Submit a request or view your tickets</p>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          <button onClick={() => setActiveTab("submit")}
            className={`px-4 py-3 text-sm font-semibold transition border-b-2 ${activeTab === "submit" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <MessageSquare size={14} className="inline mr-1.5" />
            Submit Request
          </button>
          <button onClick={() => setActiveTab("history")}
            className={`px-4 py-3 text-sm font-semibold transition border-b-2 ${activeTab === "history" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <Clock size={14} className="inline mr-1.5" />
            My Requests
            {requests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{requests.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "submit" ? (
            <div>
              {submitSuccess && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  Your help request has been submitted. We'll get back to you soon.
                </div>
              )}
              {submitError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required className="field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Institution</label>
                    <input type="text" name="institution" value={form.institution} onChange={handleChange} className="field" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Describe Your Issue *</label>
                  <textarea name="issue" value={form.issue} onChange={handleChange} required rows={4}
                    className="field resize-none" placeholder="Please describe what you need help with..." />
                </div>
                <button type="submit" disabled={submitting}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Submit Request</>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {!loading && !error && requests.length === 0 && (
                <div className="py-12 text-center">
                  <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No help requests yet</p>
                  <p className="mt-1 text-xs text-slate-400">Submit a request using the form above</p>
                </div>
              )}
              {!loading && !error && requests.length > 0 && (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={req.status} />
                            <span className="text-xs text-slate-400">{formatDate(req.created_at)}</span>
                          </div>
                          <button onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}
                            className="mt-2 text-left text-sm font-semibold text-slate-900 hover:text-brand-600 transition">
                            {req.issue?.slice(0, 80) || "—"}
                            {req.issue?.length > 80 ? "..." : ""}
                          </button>
                        </div>
                      </div>
                      {expandedId === req._id && (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-700">
                          {req.issue}
                          {(req.response || req.admin_reply) && (
                            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                              <p className="text-xs font-semibold text-green-700 mb-1">
                                Response {req.responded_by ? `from ${req.responded_by}` : ""}
                                {req.responded_at ? ` on ${formatDate(req.responded_at)}` : ""}
                              </p>
                              <p className="text-sm text-green-800">{req.response || req.admin_reply}</p>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {req.name && <span>Name: {req.name}</span>}
                            {req.email && <span>Email: {req.email}</span>}
                            {req.phone && <span>Phone: {req.phone}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
