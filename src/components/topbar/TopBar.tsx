/**
 * Top Toolbar Component for Home Studio 3D
 * Fully Mobile Responsive with desktop controls and mobile dropdown drawer
 */
import React, { useState } from 'react';
import { 
  Project, ViewMode, UnitType, ProjectSettings 
} from '../../types/cad';
import { 
  Box, Eye, SplitSquareHorizontal, Undo2, Redo2, 
  FolderOpen, Download, Settings, FilePlus2, 
  Share2, Magnet, Grid, FileText, SunMedium, Layers,
  Menu, X, Check, Armchair, ArrowLeft, LayoutDashboard
} from 'lucide-react';

interface TopBarProps {
  project: Project;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  onUpdateProjectSettings: (newSettings: Partial<ProjectSettings>) => void;
  onRenameProject: (name: string) => void;
  onOpenFloorManager?: () => void;
  onOpenLibrary?: () => void;
  onBackToDashboard?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  viewMode,
  onViewModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onOpenExportModal,
  onOpenSettingsModal,
  onUpdateProjectSettings,
  onRenameProject,
  onOpenFloorManager,
  onOpenLibrary,
  onBackToDashboard,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      onRenameProject(nameInput.trim());
    } else {
      setNameInput(project.name);
    }
  };

  return (
    <header className="h-14 morphic-nav px-3 sm:px-5 flex items-center justify-between z-40 select-none relative transition-all">
      {/* Brand & Project Name & Dashboard Button */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="morphic-btn-glass flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs font-medium transition active:scale-95 shrink-0"
            title="Layihələr Siyahısı (Ana Səhifə)"
          >
            <ArrowLeft size={14} className="text-sky-400" />
            <span className="hidden sm:inline">Layihələr</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-sky-400 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center font-bold text-base shadow-[0_0_12px_rgba(56,189,248,0.15)]">
            <Box size={18} className="text-sky-400" />
          </div>
          <span className="font-semibold text-slate-100 tracking-wide text-xs sm:text-sm hidden lg:inline">
            HOME STUDIO <span className="text-sky-400 font-bold">3D</span>
          </span>
        </div>

        <div className="h-5 w-[1px] bg-white/[0.08] hidden sm:block" />

        {/* Project Title (Editable) */}
        {isEditingName ? (
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            autoFocus
            className="morphic-input rounded-lg px-2.5 py-1 text-xs text-slate-100 font-medium outline-none max-w-[140px] sm:max-w-[200px]"
          />
        ) : (
          <button
            onClick={() => {
              setNameInput(project.name);
              setIsEditingName(true);
            }}
            className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] px-2.5 py-1 rounded-lg transition max-w-[120px] sm:max-w-[200px] truncate text-left"
            title="Layihə adını dəyişmək üçün klikləyin"
          >
            {project.name}
          </button>
        )}
      </div>

      {/* Central View Mode Switcher Pills */}
      <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
        <button
          onClick={() => onViewModeChange('2d')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition ${
            viewMode === '2d'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="2D Mərtəbə Planı"
        >
          <Grid size={13} className="shrink-0" />
          <span className="hidden xs:inline sm:inline">2D</span>
          <span className="hidden sm:inline">Plan</span>
        </button>
        <button
          onClick={() => onViewModeChange('split')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition ${
            viewMode === 'split'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Bölünmüş Görünüş (2D & 3D)"
        >
          <SplitSquareHorizontal size={13} className="shrink-0" />
          <span className="hidden xs:inline sm:inline">Bölünmüş</span>
        </button>
        <button
          onClick={() => onViewModeChange('3d')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition ${
            viewMode === '3d'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="3D Realtime Studio"
        >
          <Box size={13} className="shrink-0" />
          <span className="hidden xs:inline sm:inline">3D</span>
          <span className="hidden sm:inline">Studio</span>
        </button>
      </div>

      {/* Desktop Toolbar Right Controls */}
      <div className="hidden md:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Geri al (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="İrəli qaytar (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-white/[0.08]" />

        {/* Units Selector */}
        <div className="flex items-center p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
          {(['m', 'cm', 'mm'] as UnitType[]).map((unit) => (
            <button
              key={unit}
              onClick={() => onUpdateProjectSettings({ unit })}
              className={`px-2 py-1 rounded-md transition text-[11px] font-mono ${
                project.settings.unit === unit
                  ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>

        {/* Snap Toggle */}
        <button
          onClick={() => onUpdateProjectSettings({ gridSnap: !project.settings.gridSnap })}
          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
            project.settings.gridSnap
              ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400 shadow-sm'
              : 'morphic-btn-glass text-slate-400 hover:text-slate-200'
          }`}
          title="Qəfəsə Maqnitlənmə (Snap)"
        >
          <Magnet size={15} />
        </button>

        <div className="h-5 w-[1px] bg-white/[0.08]" />

        {/* Project Action Buttons */}
        <button
          onClick={onNewProject}
          className="morphic-btn-glass p-1.5 rounded-lg text-slate-300 hover:text-white transition"
          title="Yeni Layihə"
        >
          <FilePlus2 size={15} />
        </button>

        <button
          onClick={onOpenProject}
          className="morphic-btn-glass p-1.5 rounded-lg text-slate-300 hover:text-white transition"
          title="Layihə Aç (.hstudio)"
        >
          <FolderOpen size={15} />
        </button>

        <button
          onClick={onSaveProject}
          className="morphic-btn-glass p-1.5 rounded-lg text-slate-300 hover:text-white transition"
          title="Layihəni Saxla (.hstudio)"
        >
          <Download size={15} />
        </button>

        <button
          onClick={onOpenExportModal}
          className="morphic-btn-primary flex items-center gap-1.5 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
          title="CAD, 3D OBJ və Spesifikasiya İxracı"
        >
          <Share2 size={14} />
          <span>İxrac</span>
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="morphic-btn-glass p-1.5 rounded-lg text-slate-400 hover:text-white transition"
          title="Layihə & İşıqlandırma Tənzimləmələri"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* Mobile Toolbar Controls: Quick Undo/Redo + Menu Hamburger */}
      <div className="flex md:hidden items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded ${canUndo ? 'text-slate-300' : 'text-slate-600'}`}
          title="Undo"
        >
          <Undo2 size={16} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded ${canRedo ? 'text-slate-300' : 'text-slate-600'}`}
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
          aria-label="Open Mobile Menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Slide-Down / Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#12151c]/95 backdrop-blur-md border-b border-slate-800 p-4 shadow-2xl z-50 flex flex-col gap-3 md:hidden">
          {onBackToDashboard && (
            <button
              onClick={() => {
                onBackToDashboard();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-xs text-sky-300 font-semibold shadow-sm"
            >
              <LayoutDashboard size={16} />
              <span>Back to Projects Dashboard (Ana Səhifə)</span>
            </button>
          )}

          {/* Quick Units & Grid Magnet */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs text-slate-400">Measurement Unit</span>
            <div className="flex items-center bg-[#181d26] rounded-md border border-slate-800 p-0.5 text-xs text-slate-300">
              {(['m', 'cm', 'mm'] as UnitType[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => onUpdateProjectSettings({ unit })}
                  className={`px-3 py-1 rounded transition text-xs font-mono ${
                    project.settings.unit === unit
                      ? 'bg-slate-700 text-sky-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs text-slate-400">Grid Magnet Snapping</span>
            <button
              onClick={() => onUpdateProjectSettings({ gridSnap: !project.settings.gridSnap })}
              className={`px-3 py-1 rounded-md border text-xs flex items-center gap-1.5 font-medium transition ${
                project.settings.gridSnap
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'bg-[#181d26] border-slate-800 text-slate-400'
              }`}
            >
              <Magnet size={14} />
              <span>{project.settings.gridSnap ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {/* Quick Navigation to Dashboard */}
          {onBackToDashboard && (
            <button
              onClick={() => {
                onBackToDashboard();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-xs text-sky-400 font-medium"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft size={16} />
                <span>Bütün Layihələr (Ana Səhifə)</span>
              </div>
              <span className="text-[10px] text-sky-300/80 bg-sky-500/20 px-2 py-0.5 rounded">Dashboard</span>
            </button>
          )}

          {/* Quick Project Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onNewProject();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181d26] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
            >
              <FilePlus2 size={16} className="text-sky-400" />
              <span>New Project</span>
            </button>

            <button
              onClick={() => {
                onOpenProject();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181d26] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
            >
              <FolderOpen size={16} className="text-amber-400" />
              <span>Open Project</span>
            </button>

            <button
              onClick={() => {
                onSaveProject();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181d26] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
            >
              <Download size={16} className="text-emerald-400" />
              <span>Save File</span>
            </button>

            <button
              onClick={() => {
                onOpenExportModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs text-slate-950 font-semibold"
            >
              <Share2 size={16} />
              <span>Export CAD / 3D</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenFloorManager && (
              <button
                onClick={() => {
                  onOpenFloorManager();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181d26] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
              >
                <Layers size={16} className="text-sky-400" />
                <span>Floor Manager</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenSettingsModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181d26] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
            >
              <Settings size={16} className="text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
