import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  PLACEMENT_READY: '#10b981',
  INTERVIEW_READY: '#3b82f6',
  DEVELOPMENT_REQUIRED: '#f59e0b',
  HIGH_INTERVENTION: '#ef4444',
};

const LABELS = {
  PLACEMENT_READY: 'Placement Ready',
  INTERVIEW_READY: 'Interview Ready',
  DEVELOPMENT_REQUIRED: 'Development Required',
  HIGH_INTERVENTION: 'High Intervention',
};

export default function DistributionChart({ distribution }) {
  if (!distribution) return null;

  const data = Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => ({
      name: LABELS[key] || key,
      value: count,
      color: COLORS[key] || '#9ca3af',
    }));

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No placement data available.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} students`, 'Count']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
