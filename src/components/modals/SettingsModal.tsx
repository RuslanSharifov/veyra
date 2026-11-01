/**
 * Project Settings & CAD Keyboard Shortcuts Cheat Sheet Modal
 */
import React from 'react';
import { Project, ProjectSettings, UnitType } from '../../types/cad';
import { X, Settings, Keyboard, Sliders, Sun } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Select & Move Tool' },
    { key: 'W', desc: 'Draw Walls (click node to chain, Esc to finish)' },
    { key: 'D', desc: 'Insert Door into wall' },
    { key: 'O', desc: 'Insert Window into wall' },
    { key: 'R', desc: 'Define Room polygon' },
    { key: 'M', desc: 'Tape Measure' },
    { key: 'F', desc: 'Open Furniture & Object Library' },
    { key: 'Space + Drag', desc: 'Pan 2D CAD Canvas' },
    { key: 'Shift (hold)', desc: 'Constrain wall angles to 15° / 45° / 90°' },
    { key: 'Delete / Backspace', desc: 'Delete selected wall, opening, or furniture' },
    { key: 'Ctrl + Z', desc: 'Undo action' },
    { key: 'Ctrl + Y', desc: 'Redo action' },
    { key: 'W, A, S, D', desc: 'Walk through rooms in First-Person 3D mode' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="morphic-card bg-[#0e121a]/95 rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Tənzimləmələr & Qısayollar</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">Ölçü vahidləri, maqnitlənmə və klaviatura qısayolları</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs text-slate-300">
          {/* Unit System */}
          <div className="space-y-2">
            <label className="text-slate-200 font-medium block">Architectural Measurement Units</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'm', label: 'Meters (m)', example: '3.50 m' },
                { id: 'cm', label: 'Centimeters (cm)', example: '350.0 cm' },
                { id: 'mm', label: 'Millimeters (mm)', example: '3500 mm' },
              ].map((u) => (
                <button
                  key={u.id}
                  onClick={() => onUpdateSettings({ unit: u.id as UnitType })}
                  className={`p-3 rounded-lg border text-left transition ${
                    project.settings.unit === u.id
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow'
                      : 'bg-[#181d26] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">{u.label}</div>
                  <div className="font-mono text-[11px] text-slate-500 mt-1">{u.example}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Snap Size */}
          <div className="space-y-2">
            <label className="text-slate-200 font-medium block">2D Grid Snap Interval</label>
            <div className="grid grid-cols-4 gap-2 font-mono">
              {[0.1, 0.25, 0.5, 1.0].map((step) => (
                <button
                  key={step}
                  onClick={() => onUpdateSettings({ gridSize: step })}
                  className={`py-2 rounded-lg border text-center transition ${
                    project.settings.gridSize === step
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                      : 'bg-[#181d26] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {step} m
                </button>
              ))}
            </div>
          </div>

          {/* Shortcuts Cheat Sheet */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-200 font-medium mb-3">
              <Keyboard size={15} className="text-sky-400" />
              <span>Keyboard Shortcuts Cheat Sheet</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shortcuts.map((sc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-[#181d26] border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] truncate mr-2">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px] text-sky-300 font-semibold whitespace-nowrap">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#151922] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
