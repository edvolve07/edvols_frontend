import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

function getBarColor(score) {
  if (score >= 75) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function CompetencyBarChart({ competencies }) {
  if (!competencies) return null;

  const data = Object.entries(competencies).map(([key, val]) => ({
    name: COMPETENCY_LABELS[key] || key.replace(/_/g, ' '),
    score: val?.average || val?.score || 0,
    students: val?.studentCount || val?.dataPoints || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'score') return [`${typeof value === 'number' ? value.toFixed(1) : value}`, 'Score'];
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
