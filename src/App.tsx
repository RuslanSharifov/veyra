/**
 * Home Studio 3D - Architectural CAD & 3D Floor Plan Designer
 * Main Application Component with Multi-Project Management Dashboard (Ana Səhifə) & CRUD
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Project, Floor, ViewMode, ToolType, SelectionType, CameraPreset, CameraKeyframe, ObjectInstance 
} from './types/cad';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { exportProjectJSON, importProjectJSON } from './utils/exporter';
import { Canvas2D } from './components/canvas2d/Canvas2D';
import { Canvas3D } from './components/canvas3d/Canvas3D';
import { TopBar } from './components/topbar/TopBar';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { RightSidebar } from './components/sidebar/RightSidebar';
import { CameraTimeline } from './components/timeline/CameraTimeline';
import { ProjectsDashboard } from './components/dashboard/ProjectsDashboard';
import { ObjectLibraryModal } from './components/modals/ObjectLibraryModal';
import { FloorManagerModal } from './components/modals/FloorManagerModal';
import { ExportModal } from './components/modals/ExportModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { Sliders } from 'lucide-react';

const ALL_PROJECTS_KEY = 'homestudio3d_all_projects_v2';

export default function App() {
  // Initialize multiple projects from LocalStorage or seed curated templates
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(ALL_PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not restore projects list:', e);
    }
    // Seed default projects
    const p1: Project = JSON.parse(JSON.stringify(SAMPLE_PROJECTS.modern_villa));
    p1.description = 'Luxury 2-storey architectural villa with open chef kitchen, grand living hall, and master suite.';
    p1.thumbnailColor = 'sky';
    p1.createdAt = new Date().toISOString();

    const p2: Project = JSON.parse(JSON.stringify(SAMPLE_PROJECTS.scandinavian_apartment));
    p2.description = 'Modern Nordic single-level residence with parquet oak floors, study, and balcony doors.';
    p2.thumbnailColor = 'emerald';
    p2.createdAt = new Date().toISOString();

    return [p1, p2];
  });

  // Current active project ID
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || 'project_modern_villa';
  });

  // Screen navigation state: 'dashboard' (Ana Səhifə) or 'studio' (2D/3D Editor)
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'studio'>('dashboard');

  // Active Project Reference
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS.modern_villa;

  // Undo / Redo history stacks for the active project
  const [history, setHistory] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  // UI View & Tool State
  const [viewMode, setViewMode] = useState<ViewMode>('split'); // default split view to showcase both 2D and 3D!
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selection, setSelection] = useState<SelectionType>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');

  // Modals state
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);

  // Hidden file input for opening projects
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Animation State
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const animationTimerRef = useRef<number | null>(null);

  // Active Floor reference
  const activeFloor = activeProject.floors.find((f) => f.id === activeProject.activeFloorId) || activeProject.floors[0];

  // Auto-save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ALL_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [projects]);

  // Project Mutator with Undo History tracking
  const updateActiveProject = useCallback((newProject: Project, recordHistory = true) => {
    if (recordHistory) {
      setHistory((prev) => [...prev.slice(-25), activeProject]);
      setRedoStack([]);
    }
    const updated = { ...newProject, updatedAt: new Date().toISOString() };
    setProjects((prev) => prev.map((p) => (p.id === newProject.id ? updated : p)));
  }, [activeProject]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, activeProject]);
    setProjects((prev) => prev.map((p) => (p.id === previous.id ? previous : p)));
    setSelection(null);
  }, [history, activeProject]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHistory((prev) => [...prev, activeProject]);
    setProjects((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    setSelection(null);
  }, [redoStack, activeProject]);

  // Update Active Floor
  const handleUpdateFloor = useCallback((updatedFloor: Floor) => {
    const updatedFloors = activeProject.floors.map((f) =>
      f.id === updatedFloor.id ? updatedFloor : f
    );
    updateActiveProject({ ...activeProject, floors: updatedFloors });
  }, [activeProject, updateActiveProject]);

  // Update Project Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<Project['settings']>) => {
    updateActiveProject({
      ...activeProject,
      settings: { ...activeProject.settings, ...newSettings },
    });
  }, [activeProject, updateActiveProject]);

  // Floor Selection
  const handleSelectFloor = useCallback((floorId: string) => {
    updateActiveProject({ ...activeProject, activeFloorId: floorId }, false);
    setSelection(null);
  }, [activeProject, updateActiveProject]);

  // Update all floors (from FloorManager)
  const handleUpdateFloors = useCallback((newFloors: Floor[]) => {
    updateActiveProject({ ...activeProject, floors: newFloors });
  }, [activeProject, updateActiveProject]);

  // Place object from library
  const handlePlaceObject = useCallback((objData: Omit<ObjectInstance, 'id' | 'x' | 'y'>) => {
    const newId = 'obj_' + Date.now();
    const newObject: ObjectInstance = {
      ...objData,
      id: newId,
      x: 0,
      y: 0,
    };
    const updatedObjects = [...activeFloor.objects, newObject];
    handleUpdateFloor({ ...activeFloor, objects: updatedObjects });
    setSelection({ type: 'object', id: newId });
    setActiveTool('select');
  }, [activeFloor, handleUpdateFloor]);

  // File Upload / Import Project
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProjectJSON(file);
      // Give unique ID if conflict
      imported.id = 'project_' + Date.now();
      imported.updatedAt = new Date().toISOString();
      setProjects((prev) => [imported, ...prev]);
      setActiveProjectId(imported.id);
      setCurrentScreen('studio');
      setSelection(null);
    } catch (err: any) {
      alert(`Error loading project file: ${err.message || err}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- MULTI-PROJECT CRUD ACTIONS ---

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentScreen('studio');
    setHistory([]);
    setRedoStack([]);
    setSelection(null);
  };

  const handleCreateProject = (newProj: Project) => {
    const fresh: Project = {
      ...newProj,
      id: 'project_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnailColor: newProj.thumbnailColor || 'sky',
    };
    setProjects((prev) => [fresh, ...prev]);
    setActiveProjectId(fresh.id);
    setCurrentScreen('studio');
    setHistory([]);
    setRedoStack([]);
    setSelection(null);
  };

  const handleUpdateProjectMeta = (
    projectId: string,
    updates: { name: string; description?: string; thumbnailColor?: string }
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const handleDuplicateProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    const cloned: Project = JSON.parse(JSON.stringify(target));
    cloned.id = 'project_' + Date.now();
    cloned.name = `${target.name} (Copy)`;
    cloned.updatedAt = new Date().toISOString();
    setProjects((prev) => [cloned, ...prev]);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== projectId);
      if (remaining.length === 0) {
        // Keep at least one blank project
        const blank: Project = {
          id: 'project_' + Date.now(),
          name: 'My New Home',
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
          cameraKeyframes: [],
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
        };
        setActiveProjectId(blank.id);
        return [blank];
      }
      if (activeProjectId === projectId) {
        setActiveProjectId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Animation playback loop
  useEffect(() => {
    if (!isPlayingAnimation) {
      if (animationTimerRef.current) cancelAnimationFrame(animationTimerRef.current);
      return;
    }

    let lastTime = performance.now();
    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setAnimationTime((prev) => {
        const next = prev + delta;
        if (next >= activeProject.animationDuration) {
          return 0; // loop
        }
        return next;
      });

      animationTimerRef.current = requestAnimationFrame(loop);
    };

    animationTimerRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationTimerRef.current) cancelAnimationFrame(animationTimerRef.current);
    };
  }, [isPlayingAnimation, activeProject.animationDuration]);

  // Add Camera Keyframe
  const handleAddKeyframe = useCallback(() => {
    const newKeyframe: CameraKeyframe = {
      id: 'kf_' + Date.now(),
      time: Math.round(animationTime * 10) / 10,
      position: [10, 8, 12],
      target: [0, 1, 0],
    };
    const updated = [...activeProject.cameraKeyframes, newKeyframe].sort((a, b) => a.time - b.time);
    updateActiveProject({ ...activeProject, cameraKeyframes: updated });
  }, [animationTime, activeProject, updateActiveProject]);

  const handleDeleteKeyframe = useCallback((kfId: string) => {
    const updated = activeProject.cameraKeyframes.filter((k) => k.id !== kfId);
    updateActiveProject({ ...activeProject, cameraKeyframes: updated });
  }, [activeProject, updateActiveProject]);

  // Global Keyboard Shortcuts (active when in studio)
  useEffect(() => {
    if (currentScreen !== 'studio') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('wall');
      } else if (e.key === 'd' || e.key === 'D') {
        setActiveTool('door');
      } else if (e.key === 'o' || e.key === 'O') {
        setActiveTool('window');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('room');
      } else if (e.key === 'm' || e.key === 'M') {
        setActiveTool('measure');
      } else if (e.key === 'f' || e.key === 'F') {
        setIsLibraryOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, handleUndo, handleRedo]);

  // Render DASHBOARD (Ana Səhifə) or STUDIO (2D/3D Editor)
  if (currentScreen === 'dashboard') {
    return (
      <>
        <ProjectsDashboard
          projects={projects}
          activeProject={activeProject}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onUpdateProjectMeta={handleUpdateProjectMeta}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onImportFile={handleFileChange}
          onOpenNewProjectModal={() => setIsNewProjectOpen(true)}
          onNavigateScreen={setCurrentScreen}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenFloorManager={() => setIsFloorManagerOpen(true)}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
        />

        {/* New Project Modal (Can be triggered from dashboard) */}
        <NewProjectModal
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
          onSelectProject={handleCreateProject}
        />

        {/* Object Library Modal */}
        <ObjectLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onPlaceObject={(obj) => {
            handlePlaceObject(obj);
            setCurrentScreen('studio');
          }}
        />

        {/* Floor Manager Modal */}
        <FloorManagerModal
          isOpen={isFloorManagerOpen}
          onClose={() => setIsFloorManagerOpen(false)}
          floors={activeProject.floors}
          activeFloorId={activeProject.activeFloorId}
          onUpdateFloors={handleUpdateFloors}
          onSelectFloor={(id) => {
            handleSelectFloor(id);
            setCurrentScreen('studio');
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          project={activeProject}
          onUpdateSettings={handleUpdateSettings}
        />
      </>
    );
  }

  // Render 2D / 3D STUDIO EDITOR
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0e1117] text-slate-100 font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".hstudio,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Application Bar with "Projects (Ana Səhifə)" navigation */}
      <TopBar
        project={activeProject}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewProject={() => setIsNewProjectOpen(true)}
        onOpenProject={() => fileInputRef.current?.click()}
        onSaveProject={() => exportProjectJSON(activeProject)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onUpdateProjectSettings={handleUpdateSettings}
        onRenameProject={(name) => updateActiveProject({ ...activeProject, name })}
        onOpenFloorManager={() => setIsFloorManagerOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onBackToDashboard={() => setCurrentScreen('dashboard')}
      />

      {/* Main Workspace: Left Sidebar + Central Viewport (2D / 3D / Split) + Right Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Drawing & Floor Toolbar (Desktop) */}
        <LeftSidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          floors={activeProject.floors}
          activeFloorId={activeProject.activeFloorId}
          onSelectFloor={handleSelectFloor}
          onOpenFloorManager={() => setIsFloorManagerOpen(true)}
          onOpenLibrary={() => setIsLibraryOpen(true)}
        />

        {/* Central Interactive Viewport */}
        <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-[#0f1218]">
          {/* 2D Plan View (Rendered if '2d' or 'split') */}
          {(viewMode === '2d' || viewMode === 'split') && (
            <div
              className={`relative ${
                viewMode === 'split'
                  ? 'h-1/2 md:h-full w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-800'
                  : 'h-full w-full'
              }`}
            >
              <Canvas2D
                project={activeProject}
                activeFloor={activeFloor}
                activeTool={activeTool}
                selection={selection}
                onSelect={(sel) => {
                  setSelection(sel);
                  if (sel) setIsMobilePropertiesOpen(true);
                }}
                onUpdateFloor={handleUpdateFloor}
                onToolChange={setActiveTool}
                onOpenLibrary={() => setIsLibraryOpen(true)}
              />
            </div>
          )}

          {/* 3D Realtime Studio (Rendered if '3d' or 'split') */}
          {(viewMode === '3d' || viewMode === 'split') && (
            <div
              className={`relative ${
                viewMode === 'split'
                  ? 'h-1/2 md:h-full w-full md:w-1/2'
                  : 'h-full w-full'
              }`}
            >
              <Canvas3D
                project={activeProject}
                activeFloor={activeFloor}
                selection={selection}
                onSelect={(sel) => {
                  setSelection(sel);
                  if (sel) setIsMobilePropertiesOpen(true);
                }}
                cameraPreset={cameraPreset}
                onCameraPresetChange={setCameraPreset}
                isPlayingAnimation={isPlayingAnimation}
                currentAnimationTime={animationTime}
              />
            </div>
          )}

          {/* Floating Mobile Properties Button (allows opening property inspector on mobile) */}
          <div className="absolute top-12 right-2 md:hidden z-20">
            <button
              onClick={() => setIsMobilePropertiesOpen(true)}
              className="bg-[#181d26]/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] text-sky-400 font-medium shadow-xl backdrop-blur flex items-center gap-1.5 active:scale-95 transition"
            >
              <Sliders size={13} />
              <span>{selection ? 'Properties' : 'Inspect'}</span>
              {selection && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
            </button>
          </div>

          {/* Bottom Walkthrough Animation Timeline */}
          <CameraTimeline
            project={activeProject}
            isPlaying={isPlayingAnimation}
            onTogglePlay={() => setIsPlayingAnimation(!isPlayingAnimation)}
            currentTime={animationTime}
            onSeek={(t) => setAnimationTime(t)}
            onAddKeyframe={handleAddKeyframe}
            onDeleteKeyframe={handleDeleteKeyframe}
            onUpdateDuration={(d) => updateActiveProject({ ...activeProject, animationDuration: d })}
          />
        </main>

        {/* Right Object Properties Inspector (Desktop & Mobile Slide-Over Drawer) */}
        <RightSidebar
          project={activeProject}
          activeFloor={activeFloor}
          selection={selection}
          onSelect={setSelection}
          onUpdateFloor={handleUpdateFloor}
          onUpdateProjectSettings={handleUpdateSettings}
          isOpenOnMobile={isMobilePropertiesOpen}
          onCloseMobile={() => setIsMobilePropertiesOpen(false)}
        />
      </div>

      {/* Mobile Bottom Action Bar (Thumb-friendly CAD Tools) */}
      <div className="md:hidden z-30">
        <LeftSidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          floors={activeProject.floors}
          activeFloorId={activeProject.activeFloorId}
          onSelectFloor={handleSelectFloor}
          onOpenFloorManager={() => setIsFloorManagerOpen(true)}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          isMobileBottomBar={true}
        />
      </div>

      {/* Modals */}
      <ObjectLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onPlaceObject={handlePlaceObject}
      />

      <FloorManagerModal
        isOpen={isFloorManagerOpen}
        onClose={() => setIsFloorManagerOpen(false)}
        floors={activeProject.floors}
        activeFloorId={activeProject.activeFloorId}
        onSelectFloor={handleSelectFloor}
        onUpdateFloors={handleUpdateFloors}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={activeProject}
        activeFloor={activeFloor}
      />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSelectProject={handleCreateProject}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={activeProject}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
