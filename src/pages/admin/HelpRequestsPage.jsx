import { useEffect, useState, useCallback } from "react";
import { Loader2, HelpCircle, Filter, ChevronDown, MessageSquare, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_CONFIG = {
  open: {
    label: "Open",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ResponseModal({ request, onClose, onSubmit }) {
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("resolved");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setSubmitting(true);
    await onSubmit(request._id, status, response.trim());
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Respond to {request.name}</h3>
            <p className="text-sm text-slate-500">{request.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="mb-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Their Issue</p>
            <p className="mt-1 text-sm text-slate-700">{request.issue}</p>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Set Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Your Response</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your response to the user..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!response.trim() || submitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Response"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HelpRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [responseModal, setResponseModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/help");
      setRequests(Array.isArray(res) ? res : res.requests || []);
    } catch (err) {
      setError(err.message || "Failed to load help requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (id, newStatus, responseText = "") => {
    setUpdatingId(id);
    try {
      const body = { status: newStatus };
      if (responseText) body.response = responseText;
      const res = await apiFetch(`/api/help/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? res.request : r))
      );
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    total: requests.length,
    open: requests.filter((r) => r.status === "open").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
  };

  const filtered =
    filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Help Requests</h1>
          <p className="text-sm text-slate-500">
            Manage and respond to student support requests.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {counts.total}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
            Open
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            {counts.open}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
            In Progress
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {counts.in_progress}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-green-600">
            Resolved
          </p>
          <p className="mt-1 text-2xl font-bold text-green-700">
            {counts.resolved}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Showing {filtered.length} of {requests.length} requests
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            No requests found.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req._id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{req.name}</span>
                      <span className="text-sm text-slate-400">{req.email}</span>
                      {req.institution && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          {req.institution}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{req.issue}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-slate-400">{formatDate(req.created_at)}</span>
                      <StatusBadge status={req.status} />
                      {req.response && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Response from {req.responded_by || "Admin"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setResponseModal(req)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Respond
                    </button>
                    <div className="relative">
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleStatusChange(req._id, e.target.value)
                        }
                        disabled={updatingId === req._id}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
                {expandedId === req._id && req.response && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-semibold text-green-700">
                      Response from {req.responded_by || "Admin"} on {formatDate(req.responded_at)}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{req.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {responseModal && (
        <ResponseModal
          request={responseModal}
          onClose={() => setResponseModal(null)}
          onSubmit={handleStatusChange}
        />
      )}
    </div>
  );
}
