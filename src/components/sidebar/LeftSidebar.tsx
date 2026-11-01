/**
 * Left Sidebar: CAD Drawing & Architectural Tools, Floor Switcher
 * Responsive: Desktop vertical dock + Mobile bottom tool strip
 */
import React from 'react';
import { ToolType, Floor } from '../../types/cad';
import { 
  MousePointer, Square, DoorOpen, AppWindow, 
  Ruler, Armchair, Layers, Plus, HelpCircle
} from 'lucide-react';

interface LeftSidebarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  floors: Floor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  onOpenFloorManager: () => void;
  onOpenLibrary: () => void;
  isMobileBottomBar?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTool,
  onToolChange,
  floors,
  activeFloorId,
  onSelectFloor,
  onOpenFloorManager,
  onOpenLibrary,
  isMobileBottomBar = false,
}) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer size={18} />, shortcut: 'V' },
    { id: 'wall', label: 'Wall', icon: <Square size={18} />, shortcut: 'W' },
    { id: 'door', label: 'Door', icon: <DoorOpen size={18} />, shortcut: 'D' },
    { id: 'window', label: 'Window', icon: <AppWindow size={18} />, shortcut: 'O' },
    { id: 'room', label: 'Room', icon: <Square size={18} className="border-dashed" />, shortcut: 'R' },
    { id: 'measure', label: 'Measure', icon: <Ruler size={18} />, shortcut: 'M' },
  ];

  // If rendered as mobile bottom tool bar
  if (isMobileBottomBar) {
    return (
      <div className="flex items-center justify-between px-2 py-1.5 morphic-surface border-t border-white/[0.08] w-full z-30 select-none overflow-x-auto gap-1">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] min-w-[46px] transition shrink-0 ${
              activeTool === t.id
                ? 'morphic-btn-primary text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.icon}
            <span className="mt-0.5 text-[9px] leading-tight">{t.label}</span>
          </button>
        ))}

        <div className="w-[1px] h-6 bg-white/[0.08] mx-0.5 shrink-0" />

        {/* Furniture library button */}
        <button
          onClick={onOpenLibrary}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] min-w-[46px] text-amber-400 hover:bg-white/[0.06] transition shrink-0"
        >
          <Armchair size={18} />
          <span className="mt-0.5 text-[9px] leading-tight">Mebellər</span>
        </button>

        {/* Floor switcher button */}
        <button
          onClick={onOpenFloorManager}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] min-w-[46px] text-sky-400 hover:bg-white/[0.06] transition shrink-0"
        >
          <Layers size={18} />
          <span className="mt-0.5 text-[9px] leading-tight">Mərtəbə</span>
        </button>
      </div>
    );
  }

  // Desktop Vertical Sidebar
  return (
    <aside className="hidden md:flex w-16 morphic-nav border-r border-white/[0.07] flex-col items-center py-3 justify-between z-20 select-none shrink-0">
      {/* CAD Drawing Tools */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
          Alətlər
        </span>

        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={`relative group w-11 h-11 rounded-xl flex items-center justify-center transition duration-200 ${
              activeTool === t.id
                ? 'bg-sky-500/20 text-sky-400 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
            }`}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}

            {/* Tooltip on hover */}
            <div className="absolute left-14 morphic-card text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/[0.1]">
              <span className="font-medium">{t.label}</span>
              <kbd className="ml-2 px-1.5 py-0.5 bg-white/[0.08] text-[10px] rounded text-slate-300 border border-white/[0.08] font-mono">
                {t.shortcut}
              </kbd>
            </div>
          </button>
        ))}

        <div className="w-8 h-[1px] bg-white/[0.08] my-2" />

        {/* Object / Furniture Library button */}
        <button
          onClick={onOpenLibrary}
          className="relative group w-11 h-11 rounded-xl flex items-center justify-center text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition"
          title="Mebel & Obyekt Kitabxanası (F)"
        >
          <Armchair size={18} className="text-amber-400" />
          <div className="absolute left-14 morphic-card text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/[0.1]">
            <span className="font-medium">Obyektlər & Mebel</span>
            <kbd className="ml-2 px-1.5 py-0.5 bg-white/[0.08] text-[10px] rounded text-slate-300 border border-white/[0.08] font-mono">
              F
            </kbd>
          </div>
        </button>
      </div>

      {/* Bottom Floor Switcher & Manager */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        <div className="w-8 h-[1px] bg-white/[0.08] my-1" />

        {/* Floors stack mini-list */}
        <div className="flex flex-col-reverse items-center gap-1 w-full">
          {floors.map((floor, idx) => (
            <button
              key={floor.id}
              onClick={() => onSelectFloor(floor.id)}
              className={`w-9 h-8 rounded-lg text-[11px] font-mono font-medium flex items-center justify-center transition ${
                activeFloorId === floor.id
                  ? 'bg-sky-500/20 border border-sky-400 text-sky-300 shadow-sm'
                  : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
              }`}
              title={`${floor.name} (${floor.elevation}m)`}
            >
              L{idx}
            </button>
          ))}
        </div>

        {/* Manage Floors button */}
        <button
          onClick={onOpenFloorManager}
          className="w-10 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          title="Mərtəbə İdarəçisi"
        >
          <Layers size={17} />
        </button>
      </div>
    </aside>
  );
};
