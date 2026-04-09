import { Thermometer, SkullIcon, Gauge, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  riskProb: number;
  riskLevel: 'optimal' | 'warning' | 'critical';
  onRiskClick: () => void;
}

export function StatCards({ riskProb, riskLevel, onRiskClick }: Props) {
  const riskColor = {
    optimal: 'text-accent-green',
    warning: 'text-accent-amber',
    critical: 'text-accent-red',
  }[riskLevel];

  const riskBorder = {
    optimal: 'border-white/[0.06]',
    warning: 'border-accent-amber/30',
    critical: 'border-accent-red/40',
  }[riskLevel];

  const cards = [
    {
      icon: Thermometer,
      label: 'TEMP DELTA',
      value: '2.4°C',
      color: 'text-accent-blue',
      bg: 'bg-accent-blue/10',
    },
    {
      icon: Gauge,
      label: 'MODEL RECALL',
      value: '86.1%',
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      icon: Wrench,
      label: 'PRECISION',
      value: '61.5%',
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5">
      {cards.map(({ icon: Icon, label, value, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-hover p-5 flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-bold font-heading">{value}</p>
          </div>
        </motion.div>
      ))}

      {/* Risk Card (Clickable → Opens Drawer) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onRiskClick}
        className={`glass p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:translate-y-[-2px] border ${riskBorder}`}
      >
        <div className={`w-12 h-12 rounded-xl bg-accent-red/10 flex items-center justify-center ${riskLevel === 'critical' ? 'animate-pulse' : ''}`}>
          <SkullIcon className="w-5 h-5 text-accent-red" />
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">FAILURE RISK</p>
          <p className={`text-xl font-bold font-heading ${riskColor}`}>
            {(riskProb * 100).toFixed(1)}%
          </p>
        </div>
      </motion.div>
    </div>
  );
}
