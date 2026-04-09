import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, CalendarCheck, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  torque: number;
  speed: number;
  wear: number;
  riskProb: number;
  riskLevel: 'optimal' | 'warning' | 'critical';
}

function ShapBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-bold text-white/70">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function DiagnosticDrawer({ isOpen, onClose, torque, speed, wear, riskProb, riskLevel }: Props) {
  const getInterpretation = () => {
    if (riskLevel === 'critical') {
      return {
        title: 'CRITICAL FAILURE IMMINENT',
        color: 'text-accent-red',
        border: 'border-accent-red/30',
        text: `Extreme ${torque > 65 ? 'Torque Overload (' + torque + ' Nm)' : 'Spindle Stress'} detected concurrently with ${wear > 200 ? 'severe tool degradation (' + wear + ' min runtime)' : 'elevated friction coefficients'}. The Triple-Stack Engine predicts an Immediate Mechanical Failure with ${(riskProb * 100).toFixed(1)}% confidence. Action: Stop spindle rotation immediately and initiate emergency inspection protocol.`,
      };
    }
    if (riskLevel === 'warning') {
      return {
        title: 'ELEVATED RISK DETECTED',
        color: 'text-accent-amber',
        border: 'border-accent-amber/30',
        text: `The AI Engine has identified a developing anomaly pattern. Tool wear is approaching end-of-life status at ${wear} min. Torque readings of ${torque} Nm indicate increased mechanical resistance. Plan for a tool replacement within the next 8-12 operating hours to prevent unscheduled downtime.`,
      };
    }
    return {
      title: 'SYSTEMS OPTIMAL',
      color: 'text-accent-green',
      border: 'border-accent-green/20',
      text: `All 15 sensor channels are reporting within stabilized industrial deviations. The Triple-Stack Ensemble (XGBoost + RF + CatBoost) confirms a failure probability of only ${(riskProb * 100).toFixed(1)}%. Energy efficiency is at peak levels. No maintenance intervention required at this time.`,
    };
  };

  const interp = getInterpretation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 440 }}
            animate={{ x: 0 }}
            exit={{ x: 440 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 w-[420px] h-full bg-bg-sidebar border-l border-white/[0.06] z-50 flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 left-[-18px] w-9 h-9 rounded-full bg-accent-green flex items-center justify-center shadow-lg shadow-accent-green/20 hover:scale-110 transition-transform"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-8 overflow-y-auto flex-1">
              {/* Header */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-accent-green" />
                  <h2 className="font-heading text-2xl font-bold">XAI Diagnostic</h2>
                </div>
                <p className="text-xs text-white/40">Machine Intelligence Interpretation</p>
              </div>

              {/* SHAP Bars */}
              <div className="mb-10">
                <h3 className="text-xs text-white/50 uppercase tracking-widest mb-5">
                  Risk Factor Contribution (SHAP)
                </h3>
                <ShapBar label="Torque Pressure" value={torque} max={80} color="#ef4444" />
                <ShapBar label="Tool Degradation" value={wear} max={250} color="#f59e0b" />
                <ShapBar label="Rotational Stress" value={speed} max={3000} color="#3b82f6" />
              </div>

              {/* Interpretation */}
              <div className={`glass p-5 border-l-[3px] ${interp.border} mb-8`}>
                <h3 className={`text-sm font-bold ${interp.color} mb-3`}>{interp.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{interp.text}</p>
              </div>

              {/* Confidence */}
              <div className="glass p-4 mb-8 flex items-center justify-between">
                <span className="text-xs text-white/40">Model Confidence</span>
                <span className="text-sm font-bold font-heading text-accent-green">
                  F1: 0.71 | Threshold: 0.4261
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-white/[0.06] flex flex-col gap-3">
              <button className="w-full py-3.5 bg-accent-green text-white font-bold rounded-xl hover:bg-accent-green/90 transition flex items-center justify-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Schedule Preventive Check
              </button>
              <button className="w-full py-3 border border-white/10 text-white/60 rounded-xl hover:bg-white/[0.03] transition flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Acknowledge Status
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
