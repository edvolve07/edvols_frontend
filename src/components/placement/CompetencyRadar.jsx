import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COMPETENCY_LABELS = {
  technical_knowledge: 'Technical',
  problem_solving: 'Problem Solving',
  communication: 'Communication',
  project_knowledge: 'Projects',
  behavioral_skills: 'Behavioral',
  resume_profile: 'Resume',
  interview_performance: 'Interview',
  aptitude: 'Aptitude',
};

export default function CompetencyRadar({ competencies, maxScore = 100 }) {
  if (!competencies) return null;

  const data = Object.entries(competencies).map(([key, val]) => ({
    competency: COMPETENCY_LABELS[key] || key.replace(/_/g, ' '),
    score: val?.score ?? val?.average ?? 0,
    fullMark: maxScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="competency"
          tick={{ fontSize: 12, fill: '#374151' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, maxScore]}
          tick={{ fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : (value ?? 0)}`, 'Score']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
