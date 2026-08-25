export interface BarChartPoint {
  label: string;
  /** 0-100 */
  percent: number;
  emphasized?: boolean;
}

interface BarChartProps {
  data: BarChartPoint[];
  className?: string;
}

/**
 * The revenue chart bars (Kartly Commerce Kit.dc.html bars block). Pure
 * CSS, no chart library. The emphasized bar (e.g. the max value) renders
 * in accent; the rest render in the soft wash.
 */
const BarChart = ({ data, className = '' }: BarChartProps) => {
  const summary = data.map((p) => `${p.label} ${p.percent}%`).join(', ');

  return (
    <div aria-label={`Chart: ${summary}`} role="img">
      <table className="sr-only">
        <caption>Chart values</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={`${p.label}-sr-${i}`}>
              <td>{p.label}</td>
              <td>{p.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden="true" className={`flex h-[150px] items-end gap-3.5 sm:h-[110px] ${className}`}>
        {data.map((point, i) => (
          <div key={`${point.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2.25">
            <div
              className={`w-full animate-bar rounded-[9px] t-fast hover:opacity-75 ${point.emphasized ? 'bg-accent' : 'bg-soft'}`}
              style={{ height: `${Math.max(point.percent, 4)}%` }}
              title={`${point.label}: ${point.percent}%`}
            />
            <span className="text-[10px] font-bold text-muted">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
