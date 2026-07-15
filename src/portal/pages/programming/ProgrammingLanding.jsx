import { Link } from 'react-router-dom';
import { Code2, ClipboardCheck, ArrowRight } from 'lucide-react';

export default function ProgrammingLanding() {
  return (
    <section className="page-stack mx-auto max-w-5xl">
      <h1 className="text-3xl font-black text-slate-900">Programming</h1>
      <p className="text-slate-500">Choose how you want to practice or test your coding skills</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Link
          to="/programming/practice"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Code2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Practice</h2>
              <p className="text-sm text-slate-500">Solve coding problems at your own pace</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-500 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4 flex gap-2 text-xs text-slate-400">
            <span className="rounded-md bg-slate-100 px-2 py-1">JavaScript</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">Python</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">Java</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">C++</span>
          </div>
        </Link>

        <Link
          to="/programming/assessments"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-amber-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Assessments</h2>
              <p className="text-sm text-slate-500">Take curated multi-problem coding tests</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-amber-500 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4 flex gap-2 text-xs text-slate-400">
            <span className="rounded-md bg-slate-100 px-2 py-1">Untimed</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">Multi-problem</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">Auto-graded</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
