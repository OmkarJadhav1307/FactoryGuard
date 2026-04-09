interface Props {
  torque: number;
  speed: number;
  wear: number;
  onUpdate: (key: 'torque' | 'speed' | 'wear', val: number) => void;
}

const sliders = [
  { key: 'torque' as const, label: 'Torque', unit: 'Nm', min: 10, max: 80, danger: 65 },
  { key: 'speed' as const, label: 'Rotational Speed', unit: 'RPM', min: 1000, max: 3000, danger: 2600 },
  { key: 'wear' as const, label: 'Tool Wear', unit: 'Min', min: 0, max: 250, danger: 200 },
];

export function SensorSliders({ torque, speed, wear, onUpdate }: Props) {
  const values = { torque, speed, wear };

  return (
    <div className="glass p-6">
      <h3 className="text-sm font-semibold text-white/50 mb-5 uppercase tracking-wider">
        <span className="text-white/70">⚙</span> Diagnostic Sandbox
      </h3>
      <div className="grid grid-cols-3 gap-8">
        {sliders.map(({ key, label, unit, min, max, danger }) => {
          const val = values[key];
          const isDanger = val >= danger;
          return (
            <div key={key}>
              <label className="text-xs text-white/40 block mb-3">{label} [{unit}]</label>
              <input
                type="range"
                min={min}
                max={max}
                value={val}
                onChange={e => onUpdate(key, parseInt(e.target.value))}
                className="w-full"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-lg font-bold font-heading ${isDanger ? 'text-accent-red' : 'text-accent-green'}`}>
                  {val} {unit}
                </span>
                {isDanger && (
                  <span className="text-[10px] bg-accent-red/10 text-accent-red px-2 py-0.5 rounded font-bold animate-pulse">
                    DANGER
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
