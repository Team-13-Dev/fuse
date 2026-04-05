type Props = {
  label: string
  value: number
  badge?: { label: string; bg: string; color: string }
}

export function MetricCard({ label, value, badge }: Props) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-medium text-foreground">{value}</p>
      {badge && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      )}
    </div>
  )
}