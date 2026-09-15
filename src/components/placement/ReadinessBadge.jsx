const BAND_STYLES = {
  PLACEMENT_READY: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Placement Ready',
  },
  INTERVIEW_READY: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Interview Ready',
  },
  DEVELOPMENT_REQUIRED: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Development Required',
  },
  HIGH_INTERVENTION: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    label: 'High Intervention',
  },
  UNASSESSED: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-500',
    label: 'Insufficient Data',
  },
};

export default function ReadinessBadge({ band, score, showScore = true }) {
  const style = BAND_STYLES[band] || BAND_STYLES.UNASSESSED;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border}`}>
      <span className={`text-sm font-semibold ${style.text}`}>
        {style.label}
      </span>
      {showScore && band !== 'UNASSESSED' && score != null && (
        <span className={`text-xs font-medium ${style.text} opacity-75`}>
          ({typeof score === 'number' ? score.toFixed(1) : score})
        </span>
      )}
    </div>
  );
}
