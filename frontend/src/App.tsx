import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCards } from './components/StatCards';
import { SceneView } from './components/SceneView';
import { LiveChart } from './components/LiveChart';
import { SensorSliders } from './components/SensorSliders';
import { DiagnosticDrawer } from './components/DiagnosticDrawer';
import { AlertFeed } from './components/AlertFeed';
import { useSensorStream } from './hooks/useSensorStream';
import { Bell } from 'lucide-react';

export default function App() {
  const { sensors, updateSensor } = useSensorStream();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Top Bar */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-wide">
              Milling Machine #102: Digital Twin
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Triple-Stack Engine Active • 86.1% Recall • 61.5% Precision
            </p>
          </div>
          <button className="glass w-10 h-10 flex items-center justify-center rounded-xl relative hover:bg-white/[0.06] transition">
            <Bell className="w-4 h-4 text-white/50" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full" />
          </button>
        </header>

        {/* KPI Row */}
        <div className="mb-8">
          <StatCards
            riskProb={sensors.riskProb}
            riskLevel={sensors.riskLevel}
            onRiskClick={() => setDrawerOpen(true)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Left: 3D Viewport (3 cols) */}
          <div className="col-span-3">
            <SceneView
              torque={sensors.torque}
              wear={sensors.wear}
              riskLevel={sensors.riskLevel}
            />
          </div>

          {/* Right: Chart + Alerts (2 cols) */}
          <div className="col-span-2 flex flex-col gap-6">
            <LiveChart history={sensors.torqueHistory} />
            <AlertFeed />
          </div>
        </div>

        {/* Sensor Sliders */}
        <SensorSliders
          torque={sensors.torque}
          speed={sensors.speed}
          wear={sensors.wear}
          onUpdate={updateSensor}
        />
      </main>

      {/* XAI Drawer */}
      <DiagnosticDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        torque={sensors.torque}
        speed={sensors.speed}
        wear={sensors.wear}
        riskProb={sensors.riskProb}
        riskLevel={sensors.riskLevel}
      />
    </div>
  );
}
