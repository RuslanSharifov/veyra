/**
 * Projects Dashboard (Home Page / Ana Səhifə)
 * Designed with Minimalist Morphism (Frosted glass, subtle inner glows, clean typography)
 * Multi-Project Management with complete CRUD:
 * - Create projects (Blank or from Architectural Templates)
 * - Read / Open in 2D/3D Studio
 * - Update / Edit details (Rename, Description, Color tag, Duplicate)
 * - Delete projects with confirmation
 * - Import / Export .hstudio files
 * - Search, filter, and sorting
 */
import React, { useState, useMemo } from 'react';
import { Project } from '../../types/cad';
import { polygonArea } from '../../utils/geometry';
import { exportProjectJSON } from '../../utils/exporter';
import { NavBar } from '../navigation/NavBar';
import { 
  Box, Plus, Search, FolderOpen, Download, Trash2, 
  Copy, Edit3, ArrowRight, LayoutGrid, List, Layers, 
  Home, Sparkles, Clock, Calendar, Check, MoreVertical,
  Maximize2, ArrowUpDown, Compass, CheckCircle2, SlidersHorizontal
} from 'lucide-react';

interface ProjectsDashboardProps {
  projects: Project[];
  activeProject?: Project;
  onOpenProject: (projectId: string) => void;
  onCreateProject: (project: Project) => void;
  onUpdateProjectMeta: (projectId: string, updates: { name: string; description?: string; thumbnailColor?: string }) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenNewProjectModal: () => void;
  onNavigateScreen: (screen: 'dashboard' | 'studio') => void;
  onOpenLibrary?: () => void;
  onOpenFloorManager?: () => void;
  onOpenSettingsModal?: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  activeProject,
  onOpenProject,
  onCreateProject,
  onUpdateProjectMeta,
  onDuplicateProject,
  onDeleteProject,
  onImportFile,
  onOpenNewProjectModal,
  onNavigateScreen,
  onOpenLibrary,
  onOpenFloorManager,
  onOpenSettingsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'area' | 'floors'>('updated');

  // Edit Project Details Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('sky');

  // Delete Confirmation Modal State
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Calculate project metrics helper
  const getProjectMetrics = (proj: Project) => {
    let totalArea = 0;
    let totalWalls = 0;
    let totalObjects = 0;

    proj.floors.forEach((fl) => {
      totalWalls += fl.walls.length;
      totalObjects += fl.objects.length;
      const nodeMap = new Map(fl.nodes.map((n) => [n.id, n]));
      fl.rooms.forEach((r) => {
        const pts = r.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as { x: number; y: number }[];
        if (pts.length >= 3) {
          totalArea += polygonArea(pts);
        }
      });
    });

    return {
      floorsCount: proj.floors.length,
      wallsCount: totalWalls,
      objectsCount: totalObjects,
      totalArea: Math.round(totalArea * 10) / 10,
    };
  };

  // Grand stats
  const grandStats = useMemo(() => {
    let grandArea = 0;
    let grandFloors = 0;
    let grandObjects = 0;

    projects.forEach((p) => {
      const m = getProjectMetrics(p);
      grandArea += m.totalArea;
      grandFloors += m.floorsCount;
      grandObjects += m.objectsCount;
    });

    return {
      projectsCount: projects.length,
      totalArea: Math.round(grandArea),
      totalFloors: grandFloors,
      totalObjects: grandObjects,
    };
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let list = projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      return matchName || matchDesc;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'floors') return b.floors.length - a.floors.length;
      if (sortBy === 'area') {
        const aArea = getProjectMetrics(a).totalArea;
        const bArea = getProjectMetrics(b).totalArea;
        return bArea - aArea;
      }
      // default: updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return list;
  }, [projects, searchQuery, sortBy]);

  const handleStartEdit = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDesc(proj.description || '');
    setEditColor(proj.thumbnailColor || 'sky');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    onUpdateProjectMeta(editingProject.id, {
      name: editName.trim() || editingProject.name,
      description: editDesc.trim(),
      thumbnailColor: editColor,
    });
    setEditingProject(null);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const colorAccents: Record<string, { gradient: string; dot: string; glow: string }> = {
    sky: {
      gradient: 'from-sky-500/20 via-sky-950/10 to-transparent',
      dot: 'bg-sky-400',
      glow: 'group-hover:border-sky-500/40',
    },
    emerald: {
      gradient: 'from-emerald-500/20 via-emerald-950/10 to-transparent',
      dot: 'bg-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    purple: {
      gradient: 'from-purple-500/20 via-purple-950/10 to-transparent',
      dot: 'bg-purple-400',
      glow: 'group-hover:border-purple-500/40',
    },
    amber: {
      gradient: 'from-amber-500/20 via-amber-950/10 to-transparent',
      dot: 'bg-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    rose: {
      gradient: 'from-rose-500/20 via-rose-950/10 to-transparent',
      dot: 'bg-rose-400',
      glow: 'group-hover:border-rose-500/40',
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#080b11] text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      {/* Top Morphic Navigation Bar */}
      <NavBar
        currentScreen="dashboard"
        onNavigateScreen={onNavigateScreen}
        activeProject={activeProject || projects[0]}
        projectsCount={projects.length}
        viewMode="split"
        onViewModeChange={() => {}}
        onNewProject={onOpenNewProjectModal}
        onImportFile={onImportFile}
        onOpenLibrary={onOpenLibrary}
        onOpenFloorManager={onOpenFloorManager}
        onOpenSettingsModal={onOpenSettingsModal}
      />

      {/* Main Glassmorphic Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8">
        
        {/* Welcome & Morphic Stats Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-sky-400 uppercase">
                Studio Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Memarlıq Layihələri
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              2D mərtəbə planları, 3D vizuallaşdırma və otaq dizaynlarınızı idarə edin.
            </p>
          </div>

          {/* Morphic Glass Metrics Bar */}
          <div className="morphic-surface rounded-2xl px-5 py-3 flex items-center gap-6 sm:gap-8 self-start lg:self-auto">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">
                Layihələr
              </span>
              <span className="font-mono text-lg font-bold text-sky-400">
                {grandStats.projectsCount}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/[0.08]" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">
                Mərtəbələr
              </span>
              <span className="font-mono text-lg font-bold text-slate-200">
                {grandStats.totalFloors}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/[0.08]" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">
                Ümumi Sahə
              </span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                {grandStats.totalArea} m²
              </span>
            </div>
          </div>
        </div>

        {/* Morphic Search, Sort & Layout Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Glass Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Layihələri ada və ya təsvirə görə axtarın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="morphic-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Sort & Layout Segmented Controls */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="morphic-surface flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300">
              <SlidersHorizontal size={13} className="text-sky-400" />
              <span className="text-slate-400 text-[11px] hidden xs:inline">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="updated" className="bg-[#0e121a]">Son Yenilənən</option>
                <option value="name" className="bg-[#0e121a]">Ad (A-Z)</option>
                <option value="area" className="bg-[#0e121a]">Ümumi Sahə ($m^2$)</option>
                <option value="floors" className="bg-[#0e121a]">Mərtəbə Sayı</option>
              </select>
            </div>

            {/* Grid / List Layout Toggle */}
            <div className="morphic-surface flex items-center rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewLayout === 'grid'
                    ? 'bg-sky-500/20 text-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Şəbəkə Görünüşü"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewLayout === 'list'
                    ? 'bg-sky-500/20 text-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Siyahı Görünüşü"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Projects View */}
        {filteredProjects.length === 0 ? (
          /* Empty Search / State */
          <div className="morphic-card text-center py-16 px-6 rounded-3xl flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 mb-4 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
              <Home size={26} />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">
              Layihə Tapılmadı
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              {searchQuery
                ? `"${searchQuery}" sorğusuna uyğun memarlıq layihəsi tapılmadı.`
                : 'Hələ heç bir layihə yaratmamısınız. Yeni layihə ilə başlayın.'}
            </p>
            <button
              onClick={onOpenNewProjectModal}
              className="morphic-btn-primary px-4 py-2 rounded-xl text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <Plus size={16} />
              <span>Yeni Layihə Yarat</span>
            </button>
          </div>
        ) : viewLayout === 'grid' ? (
          /* MORPHIC GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const metrics = getProjectMetrics(proj);
              const accent = colorAccents[proj.thumbnailColor || 'sky'] || colorAccents.sky;

              return (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj.id)}
                  className={`morphic-card rounded-2xl overflow-hidden flex flex-col cursor-pointer group relative ${accent.glow}`}
                >
                  {/* Frosted Banner Header with Subtle Aura */}
                  <div className={`h-36 bg-gradient-to-br ${accent.gradient} relative p-4 flex flex-col justify-between border-b border-white/[0.06]`}>
                    
                    {/* Top Row: Floor count info + Action buttons */}
                    <div className="flex items-center justify-between">
                      {/* Zero-pill style unboxed metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                        <span className="font-mono text-[11px] font-medium tracking-tight">
                          {metrics.floorsCount} {metrics.floorsCount === 1 ? 'Mərtəbə' : 'Mərtəbə'}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                          {metrics.totalArea > 0 ? `${metrics.totalArea} m²` : 'CAD'}
                        </span>
                      </div>

                      {/* Morphic Action Buttons */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleStartEdit(proj, e)}
                          className="p-1.5 rounded-lg bg-black/30 hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition"
                          title="Redaktə et & Ad dəyiş"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateProject(proj.id);
                          }}
                          className="p-1.5 rounded-lg bg-black/30 hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition"
                          title="Klonla (Dublikat)"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportProjectJSON(proj);
                          }}
                          className="p-1.5 rounded-lg bg-black/30 hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition"
                          title="Yüklə (.hstudio)"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingProjectId(proj.id);
                          }}
                          className="p-1.5 rounded-lg bg-black/30 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-white/[0.08] transition"
                          title="Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Middle Graphic Icon Silhouette */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 group-hover:scale-110 transition duration-300">
                        <Layers size={20} />
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        <span>{metrics.wallsCount} divar</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span>{metrics.objectsCount} mebel/element</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-sky-300 transition duration-200 truncate mb-1">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                        {proj.description || 'Dəqiq 2D mərtəbə planları və 3D vizuallaşdırma ilə fərdi memarlıq layihəsi.'}
                      </p>
                    </div>

                    {/* Footer Row: Clean unboxed metadata and open arrow */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Clock size={12} className="text-slate-500" />
                        <span>{formatDate(proj.updatedAt)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium group-hover:translate-x-0.5 transition">
                        <span>Studio-da Aç</span>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MORPHIC TABLE / LIST VIEW */
          <div className="morphic-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.03] text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-5">Layihə Adı</th>
                    <th className="py-3 px-4">Mərtəbələr</th>
                    <th className="py-3 px-4">Ümumi Sahə</th>
                    <th className="py-3 px-4">Divarlar & Mebellər</th>
                    <th className="py-3 px-4">Son Yenilənmə</th>
                    <th className="py-3 px-5 text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredProjects.map((proj) => {
                    const metrics = getProjectMetrics(proj);
                    return (
                      <tr
                        key={proj.id}
                        onClick={() => onOpenProject(proj.id)}
                        className="hover:bg-white/[0.03] transition cursor-pointer"
                      >
                        <td className="py-3.5 px-5 font-medium text-white flex items-center gap-2.5">
                          <Box size={14} className="text-sky-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{proj.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {metrics.floorsCount} Mərtəbə
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400 font-mono font-medium">
                          {metrics.totalArea} m²
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {metrics.wallsCount} divar · {metrics.objectsCount} mebel
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                          {formatDate(proj.updatedAt)}
                        </td>
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => handleStartEdit(proj, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                              title="Redaktə et"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateProject(proj.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                              title="Klonla"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportProjectJSON(proj);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                              title="Yüklə"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingProjectId(proj.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition"
                              title="Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              onClick={() => onOpenProject(proj.id)}
                              className="morphic-btn-primary px-3 py-1 rounded-lg text-slate-950 font-semibold text-xs ml-2"
                            >
                              Aç
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* EDIT PROJECT DETAILS MORPHIC MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="morphic-card bg-[#0e121a]/90 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Edit3 size={16} className="text-sky-400" />
              <span>Layihə Məlumatlarını Redaktə Et</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Layihənin Adı</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="morphic-input w-full rounded-xl px-3.5 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Təsvir / Qeydlər</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Müştəri, otaq ölçüləri, konsepsiya haqqında qeydlər..."
                  className="morphic-input w-full rounded-xl px-3.5 py-2 text-slate-100 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-2">Vizuallaşdırma Vurğu Rəngi</label>
                <div className="flex items-center gap-2.5">
                  {['sky', 'emerald', 'purple', 'amber', 'rose'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        editColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60'
                      } ${
                        c === 'sky'
                          ? 'bg-sky-500'
                          : c === 'emerald'
                          ? 'bg-emerald-500'
                          : c === 'purple'
                          ? 'bg-purple-500'
                          : c === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="morphic-btn-glass px-4 py-2 rounded-xl text-slate-300 hover:text-white transition"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="morphic-btn-primary px-4 py-2 rounded-xl text-slate-950 font-semibold"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MORPHIC MODAL */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="morphic-card bg-[#0e121a]/90 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Layihə Silinsin?</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Bu layihəni silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setDeletingProjectId(null)}
                className="morphic-btn-glass px-4 py-2 rounded-xl text-slate-300 text-xs font-medium transition"
              >
                İmtina
              </button>
              <button
                onClick={() => {
                  if (deletingProjectId) {
                    onDeleteProject(deletingProjectId);
                    setDeletingProjectId(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition"
              >
                Bəli, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
