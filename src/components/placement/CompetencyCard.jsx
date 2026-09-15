const COMPETENCY_LABELS = {
  technical_knowledge: 'Technical Knowledge',
  problem_solving: 'Problem Solving',
  communication: 'Communication',
  project_knowledge: 'Project Knowledge',
  behavioral_skills: 'Behavioral Skills',
  resume_profile: 'Resume/Profile',
  interview_performance: 'Interview Performance',
};

function ConfidenceBadge({ level }) {
  const styles = {
    HIGH: 'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-orange-100 text-orange-700',
    INSUFFICIENT: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[level] || styles.INSUFFICIENT}`}>
      {level}
    </span>
  );
}

function ScoreBar({ score, maxScore = 100 }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  let color = 'bg-emerald-500';
  if (score < 60) color = 'bg-red-500';
  else if (score < 75) color = 'bg-amber-500';

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CompetencyCard({ name, data, showEvidence = false }) {
  const label = COMPETENCY_LABELS[name] || name.replace(/_/g, ' ');
  const score = data?.score || 0;
  const confidence = data?.confidence || 'INSUFFICIENT';
  const dataPoints = data?.dataPoints || 0;
  const evidence = data?.evidence || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
        <ConfidenceBadge level={confidence} />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {dataPoints > 0 && confidence !== 'INSUFFICIENT' ? score.toFixed(1) : 'Not assessed'}
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {dataPoints} data point{dataPoints !== 1 ? 's' : ''}
      </p>
      <ScoreBar score={score} />
      {showEvidence && evidence.length > 0 && (
        <div className="mt-3 space-y-1">
          {evidence.map((ev, i) => (
            <p key={i} className="text-xs text-gray-500 italic">{ev}</p>
          ))}
        </div>
      )}
    </div>
  );
}
