import { useState, useEffect } from 'react';
import { useAuth } from '../../portal/context/AuthContext';
import CompetencyRadar from '../../components/placement/CompetencyRadar';
import CompetencyCard from '../../components/placement/CompetencyCard';
import CompetencyBarChart from '../../components/placement/CompetencyBarChart';
import DistributionChart from '../../components/placement/DistributionChart';
import SkillGapList from '../../components/placement/SkillGapList';
import ReadinessBadge from '../../components/placement/ReadinessBadge';
import ConfidenceIndicator from '../../components/placement/ConfidenceIndicator';
import { apiFetch } from '../../../lib/api';

const COMPETENCY_LABELS = {
  technical_knowledge: 'Technical',
  problem_solving: 'Problem Solving',
  communication: 'Communication',
  project_knowledge: 'Projects',
  behavioral_skills: 'Behavioral',
  resume_profile: 'Resume',
  interview_performance: 'Interview',
};

function StatCard({ label, value, subtext, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-gray-50 text-gray-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtext && <p className="text-xs mt-1 opacity-60">{subtext}</p>}
    </div>
  );
}

export default function InstitutionPlacementDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const json = await apiFetch('/api/placement/admin/dashboard');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading placement analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading dashboard</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, departmentAnalytics, interviewReadyStudents } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Placement Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Institutional analytics based on assessed interview performance.
            Scores are calculated deterministically from AI-evaluated interview data.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {['overview', 'departments', 'talent', 'skill-gaps'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'departments' ? 'Departments' : tab === 'talent' ? 'Interview Ready' : 'Skill Gaps'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Students" value={data.totalStudents} color="slate" />
              <StatCard label="Assessed" value={data.assessedStudents} subtext={`${data.assessmentCoverage}% coverage`} color="blue" />
              <StatCard label="Avg Readiness" value={overview.avgReadiness > 0 ? overview.avgReadiness.toFixed(1) : '—'} color="green" />
              <StatCard
                label="Placement Ready"
                value={overview.distribution.PLACEMENT_READY}
                subtext={`${overview.distribution.INTERVIEW_READY} interview ready`}
                color="green"
              />
            </div>

            {/* Distribution + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Distribution</h2>
                <DistributionChart distribution={overview.distribution} />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-600">Placement Ready: {overview.distribution.PLACEMENT_READY}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Interview Ready: {overview.distribution.INTERVIEW_READY}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-600">Development: {overview.distribution.DEVELOPMENT_REQUIRED}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">High Intervention: {overview.distribution.HIGH_INTERVENTION}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Competency Overview</h2>
                <CompetencyRadar competencies={overview.competencyAverages} />
              </div>
            </div>

            {/* Competency Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Average Competency Scores</h2>
              <CompetencyBarChart competencies={overview.competencyAverages} />
            </div>

            {/* Skill Gaps */}
            {overview.skillGaps.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Identified Skill Gaps</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Based on assessed interview performance across all students.
                </p>
                <SkillGapList gaps={overview.skillGaps.map(g => ({
                  ...g,
                  score: g.score ?? g.averageScore ?? 0,
                  gap: g.gap ?? 70 - (g.averageScore ?? 0),
                  targetScore: 70,
                  priority: (g.gap ?? 70 - (g.averageScore ?? 0)) > 20 ? 'HIGH' : 'MODERATE',
                }))} />
              </div>
            )}
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Comparison</h2>
              {departmentAnalytics.length === 0 ? (
                <p className="text-gray-500 text-sm">No department data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Students</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Readiness</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Technical</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Communication</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Problem Solving</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Projects</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Behavioral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentAnalytics.map(dept => (
                        <tr key={dept.departmentId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">{dept.departmentName}</td>
                          <td className="py-3 px-4 text-center text-gray-600">{dept.assessedCount}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-semibold ${
                              dept.avgReadiness >= 75 ? 'text-emerald-600' :
                              dept.avgReadiness >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {dept.avgReadiness > 0 ? dept.avgReadiness.toFixed(1) : '—'}
                            </span>
                          </td>
                          {['technical_knowledge', 'communication', 'problem_solving', 'project_knowledge', 'behavioral_skills'].map(comp => (
                            <td key={comp} className="py-3 px-4 text-center text-gray-600">
                              {dept.competencyAverages[comp]?.average > 0
                                ? dept.competencyAverages[comp].average.toFixed(0)
                                : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Department Heatmap */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Skill Heatmap</h2>
              <p className="text-xs text-gray-500 mb-4">
                Department × Competency average scores. Helps identify department-level skill gaps.
              </p>
              {departmentAnalytics.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Department</th>
                        {Object.values(COMPETENCY_LABELS).map(label => (
                          <th key={label} className="text-center py-2 px-3 font-semibold text-gray-700 text-xs">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {departmentAnalytics.map(dept => (
                        <tr key={dept.departmentId} className="border-b border-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-700">{dept.departmentName}</td>
                          {Object.keys(COMPETENCY_LABELS).map(comp => {
                            const score = dept.competencyAverages[comp]?.average || 0;
                            let bg = 'bg-gray-50';
                            if (score >= 75) bg = 'bg-emerald-50';
                            else if (score >= 60) bg = 'bg-amber-50';
                            else if (score > 0) bg = 'bg-red-50';
                            return (
                              <td key={comp} className={`py-2 px-3 text-center ${bg}`}>
                                <span className={`font-medium text-xs ${
                                  score >= 75 ? 'text-emerald-700' :
                                  score >= 60 ? 'text-amber-700' :
                                  score > 0 ? 'text-red-700' : 'text-gray-400'
                                }`}>
                                  {score > 0 ? score.toFixed(0) : '—'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Talent Tab */}
        {activeTab === 'talent' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Interview-Ready Candidates</h2>
              <p className="text-xs text-gray-500 mb-4">
                Students meeting configurable criteria for overall readiness and competency thresholds.
                Based on assessed interview performance — not a guarantee of placement.
              </p>
              {interviewReadyStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No students currently meet the interview-ready criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Readiness</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Band</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviewReadyStudents.map(s => (
                        <tr key={s.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-gray-800">
                            {s.overallReadiness.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <ReadinessBadge band={s.readinessBand} showScore={false} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <ConfidenceIndicator level={s.assessmentConfidence} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skill Gaps Tab */}
        {activeTab === 'skill-gaps' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Batch-Level Skill Gap Analysis</h2>
              <p className="text-xs text-gray-500 mb-4">
                Identified skill gaps based on assessed interview performance across all students.
                These are development areas, not indicators of employability.
              </p>
              {overview.competencyAverages && (
                <div className="space-y-4">
                  {Object.entries(overview.competencyAverages)
                    .sort(([, a], [, b]) => (a.average || 0) - (b.average || 0))
                    .map(([comp, data]) => (
                      <div key={comp} className="flex items-center gap-4">
                        <div className="w-40 text-sm font-medium text-gray-700">
                          {COMPETENCY_LABELS[comp] || comp}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full transition-all duration-500 ${
                                data.average >= 75 ? 'bg-emerald-500' :
                                data.average >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(data.average, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          <span className={`text-sm font-bold ${
                            data.average >= 75 ? 'text-emerald-600' :
                            data.average >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {data.average > 0 ? data.average.toFixed(1) : '—'}
                          </span>
                        </div>
                        <div className="w-24 text-right text-xs text-gray-500">
                          {data.studentCount} students
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
