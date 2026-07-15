import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Plus, Save, Sparkles, TrendingUp } from "lucide-react";
import { apiFetch, downloadResumePdf } from "@/lib/api";
import { useAuth } from "@/src/portal/context/AuthContext";

const emptySection = { title: "", items: [""] };

function listToText(list = []) {
  return list.join(", ");
}

function textToList(value) {
  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSections(sections = []) {
  return sections.length ? sections : [{ ...emptySection }];
}

function SectionEditor({ label, sections, onChange }) {
  function updateSection(index, key, value) {
    const next = [...sections];
    next[index] = { ...next[index], [key]: key === "items" ? value.split("\n") : value };
    onChange(next);
  }

  function addSection() {
    onChange([...sections, { ...emptySection }]);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{label}</h2>
        <button type="button" onClick={addSection} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              value={section.title || ""}
              onChange={(event) => updateSection(index, "title", event.target.value)}
              placeholder={`${label} title`}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400"
            />
            <textarea
              value={(section.items || []).join("\n")}
              onChange={(event) => updateSection(index, "items", event.target.value)}
              placeholder="One bullet per line"
              rows={4}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function TextListEditor({ label, value, onChange, placeholder }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-900">{label}</h2>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || "One item per line or comma separated"}
        rows={4}
        className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </section>
  );
}

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const [versions, setVersions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "Placement Resume",
    target_role: user?.interested_role || "",
    phone: user?.phone || "",
    email: user?.email || "",
    linkedin: "",
    github: "",
    location: user?.location || "",
    summary: "",
    skills: "",
    experience: [{ ...emptySection }],
    projects: [{ ...emptySection }],
    education: [{ ...emptySection }],
    certifications: "",
    achievements: [{ ...emptySection }],
  });

  useEffect(() => {
    let active = true;
    apiFetch("/api/student/resume-builder")
      .then((data) => {
        if (!active) return;
        setVersions(data.versions || []);
        const latest = data.versions?.[0];
        if (latest) {
          setForm({
            title: latest.title || "Placement Resume",
            target_role: latest.target_role || user?.interested_role || "",
            phone: latest.phone || user?.phone || "",
            email: latest.email || user?.email || "",
            linkedin: latest.linkedin || "",
            github: latest.github || "",
            location: latest.location || user?.location || "",
            summary: latest.summary || "",
            skills: listToText(latest.skills || []),
            experience: normalizeSections(latest.experience),
            projects: normalizeSections(latest.projects),
            education: normalizeSections(latest.education),
            certifications: listToText(latest.certifications || []),
            achievements: normalizeSections(latest.achievements),
          });
        }
      })
      .catch((err) => setError(err.message || "Unable to load resume versions."));
    return () => {
      active = false;
    };
  }, [user?.interested_role]);

  const latest = versions[0];
  const scoreDelta = useMemo(() => {
    if (!latest?.ats_analysis) return 0;
    return (latest.ats_analysis.ats_score || 0) - (latest.ats_analysis.previous_score || 0);
  }, [latest]);

  async function saveVersion(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        ...form,
        skills: textToList(form.skills),
        certifications: textToList(form.certifications),
        experience: form.experience.map((section) => ({ ...section, items: (section.items || []).filter(Boolean) })),
        projects: form.projects.map((section) => ({ ...section, items: (section.items || []).filter(Boolean) })),
        education: form.education.map((section) => ({ ...section, items: (section.items || []).filter(Boolean) })),
        achievements: form.achievements.map((section) => ({ ...section, items: (section.items || []).filter(Boolean) })),
      };
      const data = await apiFetch("/api/student/resume-builder/versions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setVersions((current) => [data.version, ...current]);
      setMessage(`Version ${data.version.version} saved with ATS score ${data.version.ats_analysis.ats_score}.`);
    } catch (err) {
      setError(err.message || "Unable to save resume version.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Resume Builder</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">ATS-focused resume versions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Build ATS-optimized resume versions, replace details, save iterations, and download a polished PDF.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-brand-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase text-brand-700">Latest ATS Score</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{latest?.ats_analysis?.ats_score || 0}</p>
            <p className="text-xs text-slate-500">
              {scoreDelta >= 0 ? "+" : ""}{scoreDelta} from previous
            </p>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm font-semibold text-accent-800">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <form onSubmit={saveVersion} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Basics</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="Resume title"
              />
              <input
                value={form.target_role}
                onChange={(event) => setForm((current) => ({ ...current, target_role: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="Target role"
              />
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="Phone"
              />
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="Email"
              />
              <input
                value={form.linkedin}
                onChange={(event) => setForm((current) => ({ ...current, linkedin: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="LinkedIn"
              />
              <input
                value={form.github}
                onChange={(event) => setForm((current) => ({ ...current, github: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="GitHub"
              />
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 md:col-span-2"
                placeholder="Location"
              />
            </div>
            <textarea
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              rows={5}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              placeholder="Professional summary with role, skills, and measurable impact"
            />
            <input
              value={form.skills}
              onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              placeholder="Skills separated by commas"
            />
          </section>

          <SectionEditor label="Experience" sections={form.experience} onChange={(value) => setForm((current) => ({ ...current, experience: value }))} />
          <SectionEditor label="Projects" sections={form.projects} onChange={(value) => setForm((current) => ({ ...current, projects: value }))} />
          <SectionEditor label="Education" sections={form.education} onChange={(value) => setForm((current) => ({ ...current, education: value }))} />
          <TextListEditor label="Certifications" value={form.certifications} onChange={(value) => setForm((current) => ({ ...current, certifications: value }))} />
          <SectionEditor label="Achievements" sections={form.achievements} onChange={(value) => setForm((current) => ({ ...current, achievements: value }))} />
        </div>

        <aside className="space-y-5">
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save New Version"}
          </button>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-bold text-slate-900">ATS Suggestions</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {(latest?.ats_analysis?.improvements || ["Save a version to receive score improvement suggestions."]).map((item) => (
                <li key={item} className="flex gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-bold text-slate-900">Versions</h2>
            </div>
            <div className="mt-4 space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">Version {version.version}</p>
                  <p className="text-xs text-slate-500">ATS {version.ats_analysis?.ats_score || 0} / 100</p>
                  <button
                    type="button"
                    onClick={() => downloadResumePdf(version.id, version.version)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                </div>
              ))}
              {!versions.length ? <p className="text-sm text-slate-500">No versions saved yet.</p> : null}
            </div>
          </section>
        </aside>
      </form>
    </section>
  );
}
