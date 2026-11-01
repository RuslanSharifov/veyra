/**
 * Minimalist Morphic Navigation Bar
 * Features:
 * - Brand mark with subtle ambient cyan glow
 * - Unified navigation between Projects Dashboard, Studio (2D/3D), Library, Floors, and Settings
 * - Active view mode switcher (2D / Split / 3D) when in studio
 * - Project title & quick rename
 * - Undo / Redo controls
 * - Morphic glass styling with backdrop blur and delicate inner borders
 * - Responsive mobile drawer
 */
import React, { useState } from 'react';
import { Project, ViewMode } from '../../types/cad';
import { 
  Box, FolderKanban, Compass, Armchair, Layers, Settings,
  Plus, Upload, Download, Undo2, Redo2, Grid, Eye, 
  SplitSquareHorizontal, Menu, X, ArrowLeft, Sparkles,
  HelpCircle, ChevronDown, Check, LayoutGrid
} from 'lucide-react';

interface NavBarProps {
  currentScreen: 'dashboard' | 'studio';
  onNavigateScreen: (screen: 'dashboard' | 'studio') => void;
  activeProject: Project;
  projectsCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onNewProject: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLibrary?: () => void;
  onOpenFloorManager?: () => void;
  onOpenExportModal?: () => void;
  onOpenSettingsModal?: () => void;
  onRenameProject?: (name: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentScreen,
  onNavigateScreen,
  activeProject,
  projectsCount,
  viewMode,
  onViewModeChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onNewProject,
  onImportFile,
  onOpenLibrary,
  onOpenFloorManager,
  onOpenExportModal,
  onOpenSettingsModal,
  onRenameProject,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(activeProject.name);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim() && onRenameProject) {
      onRenameProject(titleDraft.trim());
    } else {
      setTitleDraft(activeProject.name);
    }
  };

  return (
    <nav className="morphic-nav sticky top-0 left-0 right-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Identity & Active Project Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateScreen('dashboard')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
            title="Ana Səhifə (Layihələr)"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/5 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)] group-hover:border-sky-400/60 group-hover:scale-105 transition duration-200">
              <Box size={18} className="transform group-hover:rotate-12 transition duration-300" />
            </div>
            <div className="hidden xs:block">
              <span className="font-semibold text-slate-100 tracking-wide text-xs sm:text-sm flex items-center gap-1.5">
                HOME STUDIO <span className="text-sky-400 font-bold">3D</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-tight">
                Architectural CAD
              </span>
            </div>
          </button>

          {/* Vertical subtle divider */}
          <div className="h-6 w-[1px] bg-white/[0.08] hidden md:block" />

          {/* In-Studio Project Title Badge */}
          {currentScreen === 'studio' && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => onNavigateScreen('dashboard')}
                className="text-xs text-slate-400 hover:text-sky-400 transition flex items-center gap-1 p-1 -ml-1 rounded hover:bg-white/[0.04]"
                title="Bütün Layihələrə Qayıt"
              >
                <ArrowLeft size={14} />
              </button>
              
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  autoFocus
                  className="morphic-input px-2 py-0.5 rounded text-xs text-slate-100 font-medium outline-none focus:ring-1 focus:ring-sky-500 max-w-[160px]"
                />
              ) : (
                <button
                  onClick={() => {
                    setTitleDraft(activeProject.name);
                    setIsEditingTitle(true);
                  }}
                  className="text-xs font-medium text-slate-200 hover:text-sky-300 hover:bg-white/[0.05] px-2 py-1 rounded transition max-w-[180px] truncate text-left"
                  title="Layihə adını dəyişmək üçün klikləyin"
                >
                  {activeProject.name}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Minimalist Navigation Links / Screen Switcher */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
          {/* Layihələr (Dashboard) */}
          <button
            onClick={() => onNavigateScreen('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
              currentScreen === 'dashboard'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <FolderKanban size={14} />
            <span>Layihələr</span>
            <span className="text-[10px] opacity-75 font-mono ml-0.5">({projectsCount})</span>
          </button>

          {/* Studio (2D/3D Editor) */}
          <button
            onClick={() => onNavigateScreen('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
              currentScreen === 'studio'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Compass size={14} />
            <span>Studio CAD</span>
          </button>

          {/* Object Library Modal Trigger */}
          {onOpenLibrary && (
            <button
              onClick={onOpenLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition"
              title="Mebel və memarlıq obyektləri kitabxanası"
            >
              <Armchair size={14} />
              <span>Kitabxana</span>
            </button>
          )}

          {/* Floors Manager Modal Trigger */}
          {onOpenFloorManager && (
            <button
              onClick={onOpenFloorManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition"
              title="Mərtəbələri idarə et"
            >
              <Layers size={14} />
              <span>Mərtəbələr</span>
            </button>
          )}

          {/* Settings / Shortcuts */}
          {onOpenSettingsModal && (
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition"
              title="Qısayollar və Tənzimləmələr"
            >
              <Settings size={14} />
              <span className="hidden lg:inline">Tənzimləmələr</span>
            </button>
          )}
        </div>

        {/* Right: Studio Controls (if active) & Global CTAs */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* In-Studio View Switcher (2D / Split / 3D) */}
          {currentScreen === 'studio' && (
            <div className="flex items-center p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              <button
                onClick={() => onViewModeChange('2d')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition ${
                  viewMode === '2d'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="2D Plan"
              >
                <Grid size={13} />
                <span className="hidden sm:inline">2D</span>
              </button>
              <button
                onClick={() => onViewModeChange('split')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition ${
                  viewMode === 'split'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bölünmüş Görünüş (Split 2D + 3D)"
              >
                <SplitSquareHorizontal size={13} />
                <span className="hidden sm:inline">Bölünmüş</span>
              </button>
              <button
                onClick={() => onViewModeChange('3d')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition ${
                  viewMode === '3d'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="3D Realtime Studio"
              >
                <Eye size={13} />
                <span className="hidden sm:inline">3D</span>
              </button>
            </div>
          )}

          {/* Undo / Redo in Studio */}
          {currentScreen === 'studio' && onUndo && onRedo && (
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                title="Geri al (Ctrl+Z)"
              >
                <Undo2 size={13} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                title="İrəli qaytar (Ctrl+Y)"
              >
                <Redo2 size={13} />
              </button>
            </div>
          )}

          {/* Export CAD button (Studio or Dashboard) */}
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="morphic-btn-glass hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-slate-300 font-medium"
              title="Layihəni ixrac et (.obj, .json, .svg, hesabat)"
            >
              <Download size={13} className="text-emerald-400" />
              <span className="hidden lg:inline">İxrac</span>
            </button>
          )}

          {/* Import Project (Hidden Input Trigger) */}
          <label className="morphic-btn-glass hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-slate-300 font-medium cursor-pointer">
            <Upload size={13} className="text-amber-400" />
            <span className="hidden lg:inline">İdxal</span>
            <input
              type="file"
              accept=".hstudio,.json"
              className="hidden"
              onChange={onImportFile}
            />
          </label>

          {/* New Project Primary CTA with Morphic Glow */}
          <button
            onClick={onNewProject}
            className="morphic-btn-primary flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-slate-950 font-semibold text-xs tracking-wide active:scale-95 transition"
            title="Yeni Layihə Yarat"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span className="hidden xs:inline">Yeni Layihə</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white active:scale-95 transition"
            aria-label="Navigasiya Menyu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Morphic Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0c1018]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Main Navigation Links */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onNavigateScreen('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                currentScreen === 'dashboard'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <FolderKanban size={16} className="text-sky-400" />
              <span>Layihələr ({projectsCount})</span>
            </button>

            <button
              onClick={() => {
                onNavigateScreen('studio');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                currentScreen === 'studio'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <Compass size={16} className="text-sky-400" />
              <span>Studio CAD</span>
            </button>
          </div>

          {/* Studio Specific Controls if inside studio */}
          {currentScreen === 'studio' && (
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Görünüş Rejimi
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    onViewModeChange('2d');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition text-center ${
                    viewMode === '2d'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-white/[0.05] text-slate-300'
                  }`}
                >
                  2D Plan
                </button>
                <button
                  onClick={() => {
                    onViewModeChange('split');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition text-center ${
                    viewMode === 'split'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-white/[0.05] text-slate-300'
                  }`}
                >
                  Bölünmüş
                </button>
                <button
                  onClick={() => {
                    onViewModeChange('3d');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition text-center ${
                    viewMode === '3d'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-white/[0.05] text-slate-300'
                  }`}
                >
                  3D Studio
                </button>
              </div>
            </div>
          )}

          {/* Quick Tools & Modals */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenLibrary && (
              <button
                onClick={() => {
                  onOpenLibrary();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-200"
              >
                <Armchair size={15} className="text-sky-400" />
                <span>Kitabxana</span>
              </button>
            )}

            {onOpenFloorManager && (
              <button
                onClick={() => {
                  onOpenFloorManager();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-200"
              >
                <Layers size={15} className="text-sky-400" />
                <span>Mərtəbələr</span>
              </button>
            )}

            {onOpenExportModal && (
              <button
                onClick={() => {
                  onOpenExportModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-200"
              >
                <Download size={15} className="text-emerald-400" />
                <span>İxrac et</span>
              </button>
            )}

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-200 cursor-pointer">
              <Upload size={15} className="text-amber-400" />
              <span>İdxal et</span>
              <input
                type="file"
                accept=".hstudio,.json"
                className="hidden"
                onChange={(e) => {
                  onImportFile(e);
                  setIsMobileMenuOpen(false);
                }}
              />
            </label>

            {onOpenSettingsModal && (
              <button
                onClick={() => {
                  onOpenSettingsModal();
                  setIsMobileMenuOpen(false);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-300"
              >
                <Settings size={15} className="text-slate-400" />
                <span>Qısayollar & Tənzimləmələr</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
