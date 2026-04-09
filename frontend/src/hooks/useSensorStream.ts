import { useState, useEffect, useCallback } from 'react';

interface SensorState {
  torque: number;
  speed: number;
  wear: number;
  riskProb: number;
  riskLevel: 'optimal' | 'warning' | 'critical';
  torqueHistory: number[];
}

const THRESHOLD = 0.4261;

export function useSensorStream() {
  const [sensors, setSensors] = useState<SensorState>({
    torque: 45,
    speed: 1500,
    wear: 110,
    riskProb: 0.12,
    riskLevel: 'optimal',
    torqueHistory: Array(30).fill(45),
  });

  // Calculate risk from sensor values
  const calculateRisk = useCallback((torque: number, speed: number, wear: number) => {
    let prob = (torque / 80) * 0.35 + (wear / 250) * 0.45 + (speed / 3000) * 0.1;
    if (torque > 68) prob += 0.15;
    if (wear > 210) prob += 0.20;
    prob = Math.min(0.99, Math.max(0, prob));

    const level: SensorState['riskLevel'] =
      prob > 0.75 ? 'critical' : prob >= THRESHOLD ? 'warning' : 'optimal';

    return { prob, level };
  }, []);

  // Update a single sensor value (from sliders)
  const updateSensor = useCallback((key: 'torque' | 'speed' | 'wear', value: number) => {
    setSensors(prev => {
      const next = { ...prev, [key]: value };
      const { prob, level } = calculateRisk(next.torque, next.speed, next.wear);
      return { ...next, riskProb: prob, riskLevel: level };
    });
  }, [calculateRisk]);

  // Live simulation tick (chart stream)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => {
        const last = prev.torqueHistory[prev.torqueHistory.length - 1];
        const noise = Math.random() * 4 - 2;
        const spike = Math.random() > 0.96 ? 12 : 0;
        const newVal = Math.max(20, Math.min(80, last + noise + spike));
        const history = [...prev.torqueHistory.slice(1), newVal];
        return { ...prev, torqueHistory: history };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { sensors, updateSensor, threshold: THRESHOLD };
}
