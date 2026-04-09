import { Shield, Cpu, Box, ListChecks, Settings, Activity } from 'lucide-react';

const navItems = [
  { icon: Cpu, label: 'AI Dashboard', active: true },
  { icon: Box, label: 'Digital Twin' },
  { icon: Activity, label: 'XAI Diagnostics' },
  { icon: ListChecks, label: 'Maintenance' },
  { icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-[260px] min-w-[260px] bg-bg-sidebar border-r border-white/[0.06] flex flex-col p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-accent-green" />
        </div>
        <div className="font-heading text-xl font-bold tracking-wider">
          <span className="text-accent-green">FACTORY</span>
          <span className="text-white">GUARD</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, active }) => (
          <a
            key={label}
            href="#"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${active
                ? 'bg-accent-green/10 text-accent-green'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
              }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </a>
        ))}
      </nav>

      {/* Engine Badge */}
      <div className="glass p-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-green animate-glow" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">AI Engine</span>
          <span className="text-xs font-bold text-white">CHAMPION v2.4</span>
        </div>
      </div>
    </aside>
  );
}
