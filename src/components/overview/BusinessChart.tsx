import type { OverviewScenario } from "@/types/mockData";

const W = 300;
const H = 130;

/** Sales and expenses lines with the profit gap shaded between them. */
export function BusinessChart({ chart, onSetup }: { chart: OverviewScenario["chart"]; onSetup: () => void }) {
  if (chart.kind === "example") {
    return (
      <section className="rounded-2xl bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">How your business is doing</h3>
            <p className="text-[13px] text-[#5B6170]">Sales and spending, week by week</p>
          </div>
          <span className="rounded-full bg-[#ECECE8] px-2 py-0.5 text-xs font-semibold text-[#5B6170]">Example</span>
        </div>
        <svg viewBox={`0 0 ${W} 100`} className="mt-4 w-full" aria-hidden="true">
          {[20, 50, 80].map((y) => (
            <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="#ECECE8" />
          ))}
          <polyline fill="none" stroke="#D5D5CF" strokeWidth="3" points="10,70 50,62 90,66 130,48 170,54 210,34 250,30 290,20" />
          <polyline fill="none" stroke="#E2E2DD" strokeWidth="3" points="10,86 50,80 90,84 130,72 170,76 210,62 250,58 290,52" />
        </svg>
        <p className="mt-3 text-[15px] text-[#3F4451]">See your sales and spending week by week once your profit is set up.</p>
        <button onClick={onSetup} className="mt-4 h-11 rounded-full border border-[#1D4FD7] px-5 text-sm font-bold text-[#1D4FD7]">
          Set up profit
        </button>
      </section>
    );
  }

  const pts = chart.points;
  const max = Math.max(...pts.map((p) => p.sales)) * 1.08;
  const min = Math.min(...pts.map((p) => p.expenses)) * 0.85;
  const x = (i: number) => 24 + (i * (W - 34)) / Math.max(1, pts.length - 1);
  const y = (v: number) => 8 + (1 - (v - min) / (max - min)) * (H - 16);
  const sales = pts.map((p, i) => `${x(i)},${y(p.sales)}`);
  const exp = pts.map((p, i) => `${x(i)},${y(p.expenses)}`);
  const area = [...sales, ...exp.slice().reverse()].join(" ");
  const last = pts.length - 1;
  // Show at most 4 x-axis labels.
  const step = Math.ceil(pts.length / 4);
  const labelIdx = pts.map((_, i) => i).filter((i) => (last - i) % step === 0);

  return (
    <section className="rounded-2xl bg-white p-4">
      <h3 className="text-lg font-bold">How your business is doing</h3>
      <p className="text-[13px] text-[#5B6170]">{chart.subtitle}</p>
      <p className="mt-2.5 text-[15px] font-bold leading-5">{chart.headline}</p>
      <div className="mt-2.5 flex gap-4 text-[13px] text-[#3F4451]">
        <Key color="#1D4FD7" label="Sales" />
        <Key color="#D97706" label="Expenses" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-[#CDEFD7]" /> Profit (the gap)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="mt-3 w-full" role="img" aria-label={chart.headline}>
        {[0.15, 0.5, 0.85].map((f) => (
          <line key={f} x1="24" x2={W} y1={H * f} y2={H * f} stroke="#ECECE8" />
        ))}
        <polygon points={area} fill="#CDEFD7" opacity="0.85" />
        <polyline points={sales.join(" ")} fill="none" stroke="#1D4FD7" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={exp.join(" ")} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(last)} cy={y(pts[last].sales)} r="4" fill="#1D4FD7" />
        <circle cx={x(last)} cy={y(pts[last].expenses)} r="4" fill="#D97706" />
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H + 18} textAnchor={i === last ? "end" : "middle"} fontSize="11" fontWeight="600" fill="#5B6170">
            {pts[i].label}
          </text>
        ))}
      </svg>
      <p className="mt-2 text-xs text-[#5B6170]">{chart.footnote}</p>
    </section>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-[3px] w-4 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
