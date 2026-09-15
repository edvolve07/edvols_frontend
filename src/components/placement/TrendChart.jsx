import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TrendChart({ trends = [] }) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No interview history available for trend analysis.</p>
      </div>
    );
  }

  const data = trends.map((t, i) => ({
    interview: `#${i + 1}`,
    score: t.percentage || 0,
    grade: t.grade,
    date: t.date ? new Date(t.date).toLocaleDateString() : '',
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="interview"
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
            if (name === 'score') return [`${value.toFixed(1)}%`, 'Score'];
            return [value, name];
          }}
          labelFormatter={(label) => `Interview ${label}`}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <ReferenceLine y={85} stroke="#10b981" strokeDasharray="5 5" label="Placement Ready" />
        <ReferenceLine y={75} stroke="#3b82f6" strokeDasharray="5 5" label="Interview Ready" />
        <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" label="Development" />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
