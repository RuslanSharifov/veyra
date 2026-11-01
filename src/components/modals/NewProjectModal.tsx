/**
 * New Project & Architectural Template Selector Modal
 */
import React from 'react';
import { SAMPLE_PROJECTS } from '../../data/sampleProjects';
import { Project } from '../../types/cad';
import { X, Sparkles, Plus, Home, Building2, Warehouse } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  const createBlankProject = (): Project => ({
    id: 'project_' + Date.now(),
    name: 'Untitled Home Design',
    version: '1.0',
    updatedAt: new Date().toISOString(),
    settings: {
      unit: 'm',
      gridSnap: true,
      gridSize: 0.25,
      angleSnap: true,
      sunElevation: 45,
      sunAzimuth: 135,
      showCeilingsIn3D: false,
      wallCutHeight: 0,
      ghostLowerFloor: true,
    },
    activeFloorId: 'floor_ground',
    animationDuration: 12,
    cameraKeyframes: [
      { id: 'kf1', time: 0, position: [8, 6, 10], target: [0, 1, 0] },
      { id: 'kf2', time: 12, position: [-8, 6, -10], target: [0, 1, 0] },
    ],
    floors: [
      {
        id: 'floor_ground',
        name: 'Ground Floor (Level 0)',
        elevation: 0,
        height: 2.8,
        visibleIn3D: true,
        nodes: [],
        walls: [],
        rooms: [],
        objects: [],
      },
    ],
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="morphic-card bg-[#0e121a]/95 rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Yeni Layihə və ya Şablon</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">Boş layihə ilə başlayın və ya hazır memarlıq şablonu seçin</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition">
            <X size={18} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-1">
          {/* Blank Project */}
          <div
            onClick={() => {
              onSelectProject(createBlankProject());
              onClose();
            }}
            className="group morphic-surface hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition hover:shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 group-hover:text-sky-400 group-hover:bg-sky-500/10 transition mb-3">
                <Plus size={22} />
              </div>
              <h3 className="font-semibold text-white text-sm group-hover:text-sky-400 transition mb-1">
                Boş Layihə (Blank)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Təmiz tor koordinat sistemi və 0-cı səviyyə zəmin mərtəbəsi ilə sıfırdan başlayın.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition">
              <span>Boş Başla →</span>
            </div>
          </div>

          {/* Modern Villa */}
          <div
            onClick={() => {
              onSelectProject(JSON.parse(JSON.stringify(SAMPLE_PROJECTS.modern_villa)));
              onClose();
            }}
            className="group morphic-surface hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition hover:shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-3">
                <Home size={22} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-100 text-sm group-hover:text-sky-400 transition">
                  Modern Villa
                </h3>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-1.5 py-0.5 rounded">
                  2 Floors
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spacious 2-storey home with open chef's kitchen, staircase, living hall, and master suite with soaking tub.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-sky-400 flex items-center gap-1">
              <span>Load Template →</span>
            </div>
          </div>

          {/* Scandinavian Apartment */}
          <div
            onClick={() => {
              onSelectProject(JSON.parse(JSON.stringify(SAMPLE_PROJECTS.scandinavian_apartment)));
              onClose();
            }}
            className="group bg-[#181d26] border border-slate-800 hover:border-sky-500/60 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition hover:shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                <Building2 size={22} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-100 text-sm group-hover:text-emerald-400 transition">
                  Nordic Apartment
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                  1 Level
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Warm Scandinavian interior with parquet oak floors, study desk, bedroom suite, and floor-to-ceiling glass doors.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span>Load Template →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
