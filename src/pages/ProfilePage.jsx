import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Crown,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Target,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/src/portal/context/AuthContext";

const MODULE_LABELS = {
  both: "Full Access",
  ai_interview: "Interview Prep",
  aptitude: "Aptitude Practice",
  programming: "Coding Practice",
};

const STUDENT_ROLES = new Set(["student", "individual_student"]);

function isStudentRole(role) {
  return STUDENT_ROLES.has(role);
}

const ROLE_CONTENT = {
  master_admin: {
    label: "Master Admin",
    eyebrow: "Company Operations",
    title: "Edvols company employee",
    description:
      "Handles platform operations for Edvols, including user creation, admin creation, access control, and cross-organization oversight.",
    icon: Crown,
    duties: [
      "Create and manage institution admins",
      "Create students and assign access modules",
      "Monitor platform-wide usage and AI consumption",
      "Maintain programming and assessment content",
    ],
    focus: "Company-level control over users, admins, modules, and system configuration.",
  },
  admin: {
    label: "Admin",
    eyebrow: "Institution Operations",
    title: "Institution admin account",
    description:
      "Manages students, subscriptions, and placement readiness for a single institution, with full visibility into reports and analytics.",
    icon: ShieldCheck,
    duties: [
      "Create and manage students at your institution",
      "Assign journey access and subscription plans",
      "Track progress, reports, and interview readiness",
      "Configure negotiated plan pricing",
    ],
    focus: "Institution-level control over students, subscriptions, and learning outcomes.",
  },
  student: {
    label: "Student",
    eyebrow: "Learner Profile",
    title: "Student preparation account",
    description:
      "Uses Edvols to practice aptitude, coding, and interview skills while tracking progress through reports and assessments.",
    icon: GraduationCap,
    duties: [
      "Solve aptitude and coding practice problems",
      "Take assigned assessments and contests",
      "Review reports and improve weak areas",
      "Prepare for interviews with focused practice",
    ],
    focus: "Personal learning progress across assessments, coding practice, and interview preparation.",
  },
  individual_student: {
    label: "Individual Student",
    eyebrow: "Learner Profile",
    title: "Individual preparation account",
    description:
      "Uses Edvols independently to practice aptitude, coding, and interview skills while tracking personal progress through reports and assessments.",
    icon: GraduationCap,
    duties: [
      "Solve aptitude and coding practice problems",
      "Take assigned assessments and contests",
      "Review reports and improve weak areas",
      "Prepare for interviews with focused practice",
    ],
    focus: "Personal learning progress across assessments, coding practice, and interview preparation.",
  },
};

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function roleLabel(role) {
  return ROLE_CONTENT[role]?.label || "Student";
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-900">{value || "Not available"}</p>
        </div>
      </div>
    </div>
  );
}

function detailItems(role, user) {
  const items = [
    { icon: UserRound, label: "Full Name", value: user?.name },
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Phone", value: user?.phone },
  ];
  if (isStudentRole(role)) {
    items.push(
      { icon: GraduationCap, label: "Stream / Course", value: user?.stream },
      { icon: GraduationCap, label: "College Name", value: user?.college_name },
      { icon: MapPin, label: "College Address", value: user?.college_address },
      { icon: BookOpen, label: "Course Details", value: user?.course_details },
      { icon: BriefcaseBusiness, label: "Interested Role", value: user?.interested_role },
    );
  } else {
    items.push(
      { icon: ShieldCheck, label: "Organization", value: user?.organization },
      { icon: BriefcaseBusiness, label: "Role / Designation", value: user?.admin_role || user?.interested_role },
    );
  }
  items.push(
    { icon: MapPin, label: "Location", value: user?.location },
    { icon: CalendarDays, label: "Joined", value: formatDate(user?.created_at) },
    { icon: CalendarDays, label: "Last Updated", value: formatDate(user?.updated_at) },
  );
  return items;
}

function staffPermissions(role, user) {
  if (role === "admin") {
    return {
      icon: UsersRound,
      title: "Institution Admin",
      items: [
        { label: "Organization", value: user?.organization },
        { label: "Admin Role / Designation", value: user?.admin_role || user?.interested_role },
        { label: "Institution ID", value: user?.institutionId },
      ],
    };
  }
  return {
    icon: Crown,
    title: "Platform Admin",
    items: [
      { label: "Organization", value: user?.organization || "Edvols" },
      { label: "Access", value: "Full platform access" },
    ],
  };
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const role = user?.role || "student";
  const roleContent = ROLE_CONTENT[role] || ROLE_CONTENT.student;
  const RoleIcon = roleContent.icon;
  const isStudent = isStudentRole(role);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    organization: "",
    stream: "",
    interested_role: "",
    college_name: "",
    college_address: "",
    course_details: "",
    profile_headline: "",
    profile_bio: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editing, setEditing] = useState(false);

  const modules = useMemo(() => {
    const access = user?.modules_access?.length ? user.modules_access : ["both"];
    return access.map((module) => MODULE_LABELS[module] || module);
  }, [user?.modules_access]);

  const initials = (user?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      organization: user?.organization || "",
      stream: user?.stream || "",
      interested_role: user?.interested_role || "",
      college_name: user?.college_name || "",
      college_address: user?.college_address || "",
      course_details: user?.course_details || "",
      profile_headline: user?.profile_headline || "",
      profile_bio: user?.profile_bio || "",
      location: user?.location || "",
    });
  }, [user]);

  function resetFormFromUser() {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      organization: user?.organization || "",
      stream: user?.stream || "",
      interested_role: user?.interested_role || "",
      college_name: user?.college_name || "",
      college_address: user?.college_address || "",
      course_details: user?.course_details || "",
      profile_headline: user?.profile_headline || "",
      profile_bio: user?.profile_bio || "",
      location: user?.location || "",
    });
  }

  function openEditor() {
    resetFormFromUser();
    setSaveMessage("");
    setSaveError("");
    setEditing(true);
  }

  function closeEditor() {
    if (saving) return;
    resetFormFromUser();
    setSaveError("");
    setEditing(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const data = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      await refresh();
      setSaveMessage(data.message || "Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  const permissions = staffPermissions(role, user);
  const PermissionsIcon = permissions.icon;

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-2xl font-black text-white shadow-card">
              {initials}
            </div>
            <div>
              <p className="eyebrow">{roleContent.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-black text-emerald-950">{user?.name || "Profile"}</h1>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
            <BadgeCheck className="h-4 w-4" />
            {roleLabel(user?.role)}
          </div>
          <button type="button" onClick={openEditor} className="btn-primary">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {detailItems(role, user).map((item) => (
          <Detail key={item.label} icon={item.icon} label={item.label} value={item.value} />
        ))}
      </div>

      {saveMessage ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {saveMessage}
        </div>
      ) : null}

      {(user?.profile_headline || user?.profile_bio) ? (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-emerald-950">
                {user?.profile_headline || "Profile Goal"}
              </h2>
              {user?.profile_bio ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{user.profile_bio}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isStudent ? (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
          <h2 className="text-lg font-black text-emerald-950">Access</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {modules.map((module) => (
              <span
                key={module}
                className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"
              >
                {module}
              </span>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <PermissionsIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-emerald-950">{permissions.title}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {permissions.items.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{item.value || "Not available"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-emerald-950">Password Reset</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Password changes are handled through a secure reset link sent to your registered email address.
              </p>
            </div>
          </div>
          <Link to="/forgot-password" className="btn-secondary">
            Send Reset Link
          </Link>
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-emerald-100 bg-white px-5 py-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-emerald-700" />
                <div>
                  <h2 className="text-lg font-black text-emerald-950">Edit Profile</h2>
                  <p className="text-xs font-semibold text-slate-500">Update the details shown across your Edvols account.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close profile editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="grid gap-4 p-5 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Full Name</span>
                <input
                  className="field"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
                <input className="field bg-slate-50 text-slate-500" value={user?.email || ""} disabled />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Phone</span>
                <input
                  className="field"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  maxLength={20}
                  placeholder="+91 98765 43210"
                />
              </label>
              {isStudent ? (
                <>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">College Name</span>
                    <input
                      className="field"
                      value={form.college_name}
                      onChange={(event) => updateField("college_name", event.target.value)}
                      maxLength={255}
                      placeholder="Your college / institution name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Stream / Course</span>
                    <input
                      className="field"
                      value={form.stream}
                      onChange={(event) => updateField("stream", event.target.value)}
                      maxLength={80}
                      placeholder="Engineering, BBA, B.Com, BCA, B.Sc..."
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Interested Role</span>
                    <input
                      className="field"
                      value={form.interested_role}
                      onChange={(event) => updateField("interested_role", event.target.value)}
                      maxLength={80}
                      placeholder="Frontend Developer, Data Analyst..."
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">College Address</span>
                    <input
                      className="field"
                      value={form.college_address}
                      onChange={(event) => updateField("college_address", event.target.value)}
                      maxLength={500}
                      placeholder="City, State, Pin code"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Course Details</span>
                    <input
                      className="field"
                      value={form.course_details}
                      onChange={(event) => updateField("course_details", event.target.value)}
                      maxLength={255}
                      placeholder="e.g., BCA 3rd Year, B.Tech CSE, B.Com"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Organization</span>
                    <input
                      className="field"
                      value={form.organization}
                      onChange={(event) => updateField("organization", event.target.value)}
                      maxLength={120}
                      placeholder={role === "admin" ? "Institution or college name" : "Organization name"}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Role / Designation</span>
                    <input
                      className="field"
                      value={form.interested_role}
                      onChange={(event) => updateField("interested_role", event.target.value)}
                      maxLength={80}
                      placeholder="Placement Coordinator, Operations Lead..."
                    />
                  </label>
                </>
              )}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</span>
                <input
                  className="field"
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  maxLength={80}
                  placeholder="City, State"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Headline</span>
                <input
                  className="field"
                  value={form.profile_headline}
                  onChange={(event) => updateField("profile_headline", event.target.value)}
                  maxLength={120}
                  placeholder={isStudent ? "Aspiring software engineer preparing for placements" : "Managing training and assessment readiness"}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Goal / Bio</span>
                <textarea
                  className="field min-h-[120px]"
                  value={form.profile_bio}
                  onChange={(event) => updateField("profile_bio", event.target.value)}
                  maxLength={500}
                  placeholder="Add a short goal, background, or focus area for your Edvols profile."
                />
              </label>

              {saveError ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 md:col-span-2">
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 md:col-span-2">
                <button type="button" onClick={closeEditor} disabled={saving} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
