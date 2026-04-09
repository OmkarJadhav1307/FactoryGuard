import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

interface Props {
  history: number[];
}

export function LiveChart({ history }: Props) {
  const data = {
    labels: history.map(() => ''),
    datasets: [
      {
        data: history,
        borderColor: '#10b981',
        borderWidth: 2,
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#475569', font: { size: 10 } },
      },
    },
    animation: { duration: 0 } as const,
  };

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">
          <span className="text-white/80 font-semibold">⚡</span> Real-time Torque Stream
        </h3>
        <div className="bg-accent-red/10 text-accent-red text-[10px] font-bold px-2.5 py-1 rounded animate-blink">
          LIVE
        </div>
      </div>
      <div className="h-[160px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
