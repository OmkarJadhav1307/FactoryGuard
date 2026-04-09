import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Clock } from 'lucide-react';

const alerts = [
  {
    id: 1,
    unit: 'Unit #102',
    time: '2m ago',
    type: 'critical' as const,
    message: 'Torque spike detected (>65 Nm). Failure probability at 84.2% within 24 hours.',
    action: 'Emergency Inspection',
  },
  {
    id: 2,
    unit: 'Unit #215',
    time: '18m ago',
    type: 'warning' as const,
    message: 'Tool wear approaching EOL threshold (210 min). Schedule replacement.',
    action: 'Plan Maintenance',
  },
  {
    id: 3,
    unit: 'Unit #089',
    time: '45m ago',
    type: 'warning' as const,
    message: 'Thermal delta rising (+3.1°C). Monitor coolant flow rate.',
    action: 'View Diagnostics',
  },
];

export function AlertFeed() {
  return (
    <div className="glass p-5 flex-1 min-h-0">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/60">
          <Zap className="w-4 h-4 inline mr-1.5 text-accent-amber" />
          Actionable Alerts
        </h3>
        <span className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-1 rounded">
          {alerts.length} active
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px]">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`p-4 rounded-xl bg-white/[0.02] border-l-[3px] cursor-pointer hover:bg-white/[0.04] transition-all
              ${alert.type === 'critical' ? 'border-accent-red' : 'border-accent-amber'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-accent-green">{alert.unit}</span>
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {alert.time}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mb-3">{alert.message}</p>
            <button className="text-[10px] font-bold text-white/70 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-accent-green hover:text-white hover:border-accent-green transition-all">
              {alert.action}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
