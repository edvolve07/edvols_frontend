const CONFIDENCE_STYLES = {
  HIGH: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'High Confidence' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Medium Confidence' },
  LOW: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Low Confidence' },
  INSUFFICIENT: { color: 'text-gray-400', bg: 'bg-gray-50', label: 'Insufficient Data' },
};

export default function ConfidenceIndicator({ level, showLabel = true }) {
  const style = CONFIDENCE_STYLES[level] || CONFIDENCE_STYLES.INSUFFICIENT;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${style.bg}`}>
      <div className={`w-2 h-2 rounded-full ${style.color.replace('text-', 'bg-')}`} />
      {showLabel && (
        <span className={`text-xs font-medium ${style.color}`}>
          {style.label}
        </span>
      )}
    </div>
  );
}
