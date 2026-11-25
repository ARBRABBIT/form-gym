type Reading = { date: string; value: number };

export default function RespiratoryRateChart({ history }: { history: Reading[] }) {
  if (history.length < 2) return <span className="lung-chart-empty">Trend unavailable</span>;
  const min = Math.min(...history.map(point => point.value));
  const max = Math.max(...history.map(point => point.value));
  const spread = Math.max(max - min, 1);
  const slot = 300 / history.length;
  const y = (value: number) => 49 - (value - min) / spread * 37;

  return <svg className="lung-rate-chart" viewBox="0 0 320 64" preserveAspectRatio="none" role="img"
    aria-label={`Respiratory rate trend in breaths per minute: ${history.map(point => `${point.date}: ${point.value}`).join(", ")}`}>
    <line className="lung-chart-guide" x1="8" x2="312" y1="62" y2="62" />
    {history.map((point, index) => {
      const x = 10 + slot * index;
      const top = y(point.value);
      const peak = max > min && point.value === max;
      const tone = point.value === min ? "low" : point.value > min + spread * .5 ? "high" : "mid";
      return <g key={point.date}>
        <title>{point.date}: {point.value.toFixed(1)} breaths/min</title>
        {index < history.length - 1 && <path className="lung-chart-connector" d={`M${x + slot - 4} ${top} H${x + slot} V${y(history[index + 1].value)}`} />}
        <line className={`lung-chart-segment lung-chart-${tone}`} x1={x} x2={x + slot - 4} y1={top} y2={top} />
        {peak && <circle className="lung-chart-peak" cx={x + (slot - 4) / 2} cy={top} r="3.5" />}
      </g>;
    })}
  </svg>;
}
