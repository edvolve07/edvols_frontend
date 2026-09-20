import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CompetencyRadar from '../../components/placement/CompetencyRadar';
import CompetencyCard from '../../components/placement/CompetencyCard';
import ReadinessBadge from '../../components/placement/ReadinessBadge';
import ConfidenceIndicator from '../../components/placement/ConfidenceIndicator';
import SkillGapList from '../../components/placement/SkillGapList';
import TrendChart from '../../components/placement/TrendChart';
import { apiFetch } from '../../../lib/api';

export default function StudentPlacementProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const url = studentId
        ? `/api/placement/admin/student/${studentId}`
        : '/api/placement/student/profile';
      const json = await apiFetch(url);
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
          <p className="text-gray-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading profile</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, competencies, overallReadiness, readinessBand, assessmentConfidence,
    gaps, strengths, recommendations, segments, interviewHistory, explanation } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        {studentId && (
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
        )}

        {/* Student Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student?.name || 'Student Profile'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {student?.email}
                {student?.targetRole && ` • Target Role: ${student.targetRole}`}
                {student?.departmentId && ` • Department: ${student.departmentId}`}
                {student?.collegeName && ` • College: ${student.collegeName}`}
                {student?.year && ` • Year: ${student.year}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ReadinessBadge band={readinessBand} score={overallReadiness} />
              <ConfidenceIndicator level={assessmentConfidence} />
            </div>
          </div>

          {/* Segments */}
          {segments && segments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {segments.map(seg => (
                <span key={seg} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {seg.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {['overview', 'strengths-gaps', 'history', 'explanation'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'strengths-gaps' ? 'Strengths & Gaps' : tab === 'history' ? 'History' : 'Scoring Details'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Radar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Competency Profile</h2>
              <CompetencyRadar competencies={competencies} />
            </div>

            {/* Competency Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competencies && Object.entries(competencies).map(([name, data]) => (
                <CompetencyCard key={name} name={name} data={data} />
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Gaps Tab */}
        {activeTab === 'strengths-gaps' && (
          <div className="space-y-6">
            {/* Strengths */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Strengths</h2>
              {strengths && strengths.length > 0 ? (
                <div className="space-y-2">
                  {strengths.map(s => (
                    <div key={s.competency} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-medium text-emerald-800">
                        {s.competency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">{s.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No strengths identified based on assessed performance.</p>
              )}
            </div>

            {/* Skill Gaps */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Skill Gaps</h2>
              <SkillGapList gaps={gaps} />
            </div>

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Interventions</h2>
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-blue-800">{rec.area}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{rec.suggestion}</p>
                      <p className="text-xs text-blue-500 mt-1">Target improvement: +{(rec.targetImprovement || 0).toFixed(1)} points</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Score Trend</h2>
              <TrendChart trends={interviewHistory || []} />
            </div>

            {interviewHistory && interviewHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Interview Performance History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">#</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">Score</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">Grade</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Strengths</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Areas to Improve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(interviewHistory || []).map((h, i) => (
                        <tr key={h.sessionId || i} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-600">{h.interviewNumber || i + 1}</td>
                          <td className="py-2 px-3 text-gray-600">
                            {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-gray-800">
                            {typeof h.percentage === 'number' ? h.percentage.toFixed(1) : (h.percentage || '—')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              h.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                              h.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              h.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {h.grade || 'N/A'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-600 max-w-[200px] truncate">
                            {(h.strengths || []).join('; ') || '—'}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-600 max-w-[200px] truncate">
                            {(h.areasToImprove || []).join('; ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation Tab */}
        {activeTab === 'explanation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Scoring Explanation</h2>
              <p className="text-xs text-gray-500 mb-4">
                This shows how the placement readiness score was calculated.
                Every score is traceable and reproducible.
              </p>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Scoring Engine Version: {explanation?.scoringEngineVersion || '1.0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Calculated at: {explanation?.calculatedAt ? new Date(explanation.calculatedAt).toLocaleString() : '—'}
                </p>
              </div>

              {/* Overall Score */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-semibold text-blue-800">Overall Placement Readiness</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{overallReadiness?.toFixed(1) || '—'}</p>
                <p className="text-sm text-blue-600 mt-1">Category: {readinessBand?.replace(/_/g, ' ')}</p>
              </div>

              {/* Weight Breakdown */}
              {explanation?.weightBreakdown && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Weight Breakdown</h3>
                  <div className="space-y-2">
                    {explanation.weightBreakdown.map(wb => (
                      <div key={wb.competency} className="flex items-center gap-4 text-sm">
                        <span className="w-40 text-gray-700">
                          {wb.competency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="w-16 text-right text-gray-500">
                          {(wb.normalizedWeight * 100).toFixed(0)}%
                        </span>
                        <span className="w-16 text-right font-medium text-gray-800">
                          {wb.score.toFixed(1)}
                        </span>
                        <span className="w-20 text-right text-gray-500">
                          → {wb.contribution.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competency Evidence */}
              {explanation?.competencies && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Competency Evidence</h3>
                  <div className="space-y-4">
                    {explanation.competencies.map(comp => (
                      <div key={comp.name} className="p-4 border border-gray-100 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">
                            {comp.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-700">{comp.score.toFixed(1)}</span>
                            <ConfidenceIndicator level={comp.confidence} showLabel={false} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{comp.dataPoints} data points</p>
                        {comp.evidence && comp.evidence.length > 0 && (
                          <div className="space-y-1">
                            {comp.evidence.map((ev, i) => (
                              <p key={i} className="text-xs text-gray-500 italic">• {ev}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
