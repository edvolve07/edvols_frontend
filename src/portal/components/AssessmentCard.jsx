import { CalendarClock, Clock, Trophy } from 'lucide-react';
import { formatDateTime } from '../utils/api';

export default function AssessmentCard({ assessment, action }) {
  return (
    <article className="group rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-card-hover">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">{assessment.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="badge bg-emerald-50 text-emerald-700">{assessment.concept}</span>
            <span className="badge bg-emerald-50 text-emerald-700">{assessment.difficulty}</span>
          </div>
        </div>
        {action}
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
          <Clock className="h-4 w-4 text-emerald-800" />
          {assessment.duration_minutes} minutes
        </div>
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
          <Trophy className="h-4 w-4 text-gold" />
          {assessment.total_marks} marks
        </div>
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          Starts {formatDateTime(assessment.start_time)}
        </div>
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          Ends {formatDateTime(assessment.end_time)}
        </div>
      </dl>
    </article>
  );
}
