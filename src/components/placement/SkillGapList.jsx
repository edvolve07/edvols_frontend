const PRIORITY_STYLES = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MODERATE: 'bg-amber-100 text-amber-700 border-amber-200',
};

const COMPETENCY_LABELS = {
  technical_knowledge: 'Technical Knowledge',
  problem_solving: 'Problem Solving',
  communication: 'Communication',
  project_knowledge: 'Project Knowledge',
  behavioral_skills: 'Behavioral Skills',
  resume_profile: 'Resume/Profile',
  interview_performance: 'Interview Performance',
};

export default function SkillGapList({ gaps = [] }) {
  if (gaps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No significant skill gaps identified based on assessed performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gaps.map((gap, i) => (
        <div
          key={gap.competency}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 w-6">{i + 1}.</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {COMPETENCY_LABELS[gap.competency] || gap.competency}
              </p>
              <p className="text-xs text-gray-500">
                Current: {(gap.score ?? 0).toFixed(1)} / Target: {gap.targetScore ?? 70}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[gap.priority] || PRIORITY_STYLES.MODERATE}`}>
              {gap.priority}
            </span>
            <span className="text-sm font-bold text-red-600">
              -{(gap.gap ?? 0).toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
