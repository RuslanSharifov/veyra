/**
 * Right Sidebar: Object & Element Properties Inspector
 */
import React from 'react';
import { 
  Project, Floor, SelectionType, FloorFinish, WallOpening 
} from '../../types/cad';
import { distance2D, polygonArea } from '../../utils/geometry';
import { formatMeasurement } from '../../utils/units';
import { 
  Sliders, Trash2, Copy, RotateCw, Sun, 
  Layers, Check, Sparkles, Building, Palette, X
} from 'lucide-react';

interface RightSidebarProps {
  project: Project;
  activeFloor: Floor;
  selection: SelectionType;
  onSelect: (sel: SelectionType) => void;
  onUpdateFloor: (updatedFloor: Floor) => void;
  onUpdateProjectSettings: (settings: Partial<Project['settings']>) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  project,
  activeFloor,
  selection,
  onSelect,
  onUpdateFloor,
  onUpdateProjectSettings,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));

  // Selected Wall
  const selectedWall = selection?.type === 'wall'
    ? activeFloor.walls.find((w) => w.id === selection.id)
    : null;

  // Selected Opening
  const selectedOpeningWall = selection?.type === 'opening'
    ? activeFloor.walls.find((w) => w.id === selection.wallId)
    : null;
  const selectedOpening = selection?.type === 'opening' && selectedOpeningWall
    ? selectedOpeningWall.openings.find((op) => op.id === selection.openingId)
    : null;

  // Selected Object
  const selectedObject = selection?.type === 'object'
    ? activeFloor.objects.find((obj) => obj.id === selection.id)
    : null;

  // Selected Room
  const selectedRoom = selection?.type === 'room'
    ? activeFloor.rooms.find((r) => r.id === selection.id)
    : null;

  // Selected Node
  const selectedNode = selection?.type === 'node'
    ? activeFloor.nodes.find((n) => n.id === selection.id)
    : null;

  // --- ACTIONS ---

  const handleUpdateObject = (updates: Partial<typeof activeFloor.objects[0]>) => {
    if (!selectedObject) return;
    const updated = activeFloor.objects.map((o) =>
      o.id === selectedObject.id ? { ...o, ...updates } : o
    );
    onUpdateFloor({ ...activeFloor, objects: updated });
  };

  const handleDuplicateObject = () => {
    if (!selectedObject) return;
    const newObj = {
      ...selectedObject,
      id: 'obj_' + Date.now(),
      name: `${selectedObject.name} (Copy)`,
      x: selectedObject.x + 0.5,
      y: selectedObject.y + 0.5,
    };
    onUpdateFloor({ ...activeFloor, objects: [...activeFloor.objects, newObj] });
    onSelect({ type: 'object', id: newObj.id });
  };

  const handleDeleteObject = () => {
    if (!selectedObject) return;
    const updated = activeFloor.objects.filter((o) => o.id !== selectedObject.id);
    onUpdateFloor({ ...activeFloor, objects: updated });
    onSelect(null);
  };

  const handleUpdateWall = (updates: Partial<typeof activeFloor.walls[0]>) => {
    if (!selectedWall) return;
    const updated = activeFloor.walls.map((w) =>
      w.id === selectedWall.id ? { ...w, ...updates } : w
    );
    onUpdateFloor({ ...activeFloor, walls: updated });
  };

  const handleDeleteWall = () => {
    if (!selectedWall) return;
    const updated = activeFloor.walls.filter((w) => w.id !== selectedWall.id);
    onUpdateFloor({ ...activeFloor, walls: updated });
    onSelect(null);
  };

  const handleUpdateOpening = (updates: Partial<WallOpening>) => {
    if (!selectedOpeningWall || !selectedOpening) return;
    const updatedOpenings = selectedOpeningWall.openings.map((op) =>
      op.id === selectedOpening.id ? { ...op, ...updates } : op
    );
    const updatedWalls = activeFloor.walls.map((w) =>
      w.id === selectedOpeningWall.id ? { ...w, openings: updatedOpenings } : w
    );
    onUpdateFloor({ ...activeFloor, walls: updatedWalls });
  };

  const handleDeleteOpening = () => {
    if (!selectedOpeningWall || !selectedOpening) return;
    const updatedOpenings = selectedOpeningWall.openings.filter((op) => op.id !== selectedOpening.id);
    const updatedWalls = activeFloor.walls.map((w) =>
      w.id === selectedOpeningWall.id ? { ...w, openings: updatedOpenings } : w
    );
    onUpdateFloor({ ...activeFloor, walls: updatedWalls });
    onSelect(null);
  };

  const handleUpdateRoom = (updates: Partial<typeof activeFloor.rooms[0]>) => {
    if (!selectedRoom) return;
    const updated = activeFloor.rooms.map((r) =>
      r.id === selectedRoom.id ? { ...r, ...updates } : r
    );
    onUpdateFloor({ ...activeFloor, rooms: updated });
  };

  const handleDeleteRoom = () => {
    if (!selectedRoom) return;
    const updated = activeFloor.rooms.filter((r) => r.id !== selectedRoom.id);
    onUpdateFloor({ ...activeFloor, rooms: updated });
    onSelect(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`${
          isOpenOnMobile
            ? 'fixed inset-y-0 right-0 z-50 w-full sm:w-80 shadow-2xl flex'
            : 'hidden md:flex w-72'
        } morphic-nav border-l border-white/[0.07] flex-col h-full z-20 select-none overflow-y-auto shrink-0 transition-all`}
      >
        {/* Header */}
        <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between text-xs font-semibold text-slate-200 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-sky-400" />
            <span>Parametrlər & Xüsusiyyətlər</span>
          </div>

          <div className="flex items-center gap-2">
            {selection && (
              <button
                onClick={() => onSelect(null)}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] transition"
              >
                Seçimi ləğv et
              </button>
            )}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] md:hidden transition"
                title="Bağla"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

      <div className="p-4 space-y-5 text-xs text-slate-300">
        {/* 1. WALL PROPERTIES */}
        {selectedWall && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sky-400 uppercase tracking-wider text-[11px]">
                Wall Element
              </span>
              <button
                onClick={handleDeleteWall}
                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40"
                title="Delete Wall"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {(() => {
              const n1 = nodeMap.get(selectedWall.startNodeId);
              const n2 = nodeMap.get(selectedWall.endNodeId);
              const len = n1 && n2 ? distance2D(n1, n2) : 0;
              return (
                <div className="bg-[#181d26] p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Length</span>
                    <span className="font-mono text-slate-100 font-medium">
                      {formatMeasurement(len, project.settings.unit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Openings</span>
                    <span className="font-mono text-slate-100">{selectedWall.openings.length}</span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Thickness (m)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.8"
                value={selectedWall.thickness}
                onChange={(e) => handleUpdateWall({ thickness: parseFloat(e.target.value) || 0.2 })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Height (m)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="6.0"
                value={selectedWall.height}
                onChange={(e) => handleUpdateWall({ height: parseFloat(e.target.value) || 2.8 })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {/* 2. OPENING (DOOR / WINDOW) PROPERTIES */}
        {selectedOpening && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sky-400 uppercase tracking-wider text-[11px]">
                {selectedOpening.type === 'door' ? 'Door Opening' : 'Window Opening'}
              </span>
              <button
                onClick={handleDeleteOpening}
                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40"
                title="Delete Opening"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Width (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={selectedOpening.width}
                onChange={(e) => handleUpdateOpening({ width: parseFloat(e.target.value) || 0.9 })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Height (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="3.5"
                value={selectedOpening.height}
                onChange={(e) => handleUpdateOpening({ height: parseFloat(e.target.value) || 2.1 })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Sill Elevation from Floor (m)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2.5"
                value={selectedOpening.elevation}
                onChange={(e) => handleUpdateOpening({ elevation: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {selectedOpening.type === 'door' && (
              <button
                onClick={() => handleUpdateOpening({ flipped: !selectedOpening.flipped })}
                className="w-full py-1.5 bg-[#181d26] border border-slate-700 hover:border-slate-600 rounded text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <RotateCw size={13} />
                <span>Flip Swing Direction</span>
              </button>
            )}
          </div>
        )}

        {/* 3. OBJECT / FURNITURE PROPERTIES */}
        {selectedObject && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">
                Furniture & Fixture
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDuplicateObject}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                  title="Duplicate Object"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={handleDeleteObject}
                  className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40"
                  title="Delete Object"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Item Name</label>
              <input
                type="text"
                value={selectedObject.name}
                onChange={(e) => handleUpdateObject({ name: e.target.value })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Position (X, Y) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block text-[10px]">Position X (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedObject.x}
                  onChange={(e) => handleUpdateObject({ x: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[10px]">Position Y (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedObject.y}
                  onChange={(e) => handleUpdateObject({ y: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                />
              </div>
            </div>

            {/* Dimensions (W, D, H) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block text-[10px]">Width (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={selectedObject.width}
                  onChange={(e) => handleUpdateObject({ width: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[10px]">Depth (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={selectedObject.depth}
                  onChange={(e) => handleUpdateObject({ depth: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[10px]">Height (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={selectedObject.height}
                  onChange={(e) => handleUpdateObject({ height: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                />
              </div>
            </div>

            {/* Rotation Quick Buttons */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px]">Rotation ({selectedObject.rotation}°)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => handleUpdateObject({ rotation: deg })}
                    className={`py-1 rounded font-mono text-xs transition ${
                      selectedObject.rotation === deg
                        ? 'bg-sky-500 text-white font-semibold'
                        : 'bg-[#181d26] border border-slate-700 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Material Finish */}
            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Material Type</label>
              <select
                value={selectedObject.material || 'wood'}
                onChange={(e) => handleUpdateObject({ material: e.target.value as any })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:ring-1 focus:ring-sky-500"
              >
                <option value="wood">Natural Wood</option>
                <option value="fabric">Woven Fabric</option>
                <option value="leather">Full-Grain Leather</option>
                <option value="metal">Anodized Metal</option>
                <option value="glass">Clear Glass</option>
                <option value="marble">Italian Marble</option>
              </select>
            </div>

            {/* Color Swatch Picker */}
            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Finish Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObject.color || '#3b82f6'}
                  onChange={(e) => handleUpdateObject({ color: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-300">
                  {selectedObject.color || '#3b82f6'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. ROOM PROPERTIES */}
        {selectedRoom && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                Room Space
              </span>
              <button
                onClick={handleDeleteRoom}
                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40"
                title="Delete Room"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Room Label</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => handleUpdateRoom({ name: e.target.value })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {(() => {
              const pts = selectedRoom.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as { x: number; y: number }[];
              const area = polygonArea(pts);
              return (
                <div className="bg-[#181d26] p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Calculated Area</span>
                    <span className="font-mono text-emerald-400 font-semibold">{area.toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Imperial Area</span>
                    <span>{(area * 10.7639).toFixed(1)} sq ft</span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="text-slate-400 block text-[11px]">Floor Finish Material</label>
              <select
                value={selectedRoom.floorFinish}
                onChange={(e) => handleUpdateRoom({ floorFinish: e.target.value as FloorFinish })}
                className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:ring-1 focus:ring-sky-500"
              >
                <option value="parquet_oak">Warm Parquet Oak</option>
                <option value="dark_wood">Smoked Dark Walnut</option>
                <option value="marble_tile">Calacatta Marble Tile</option>
                <option value="polished_concrete">Polished Gray Concrete</option>
                <option value="terrazzo">Architectural Terrazzo</option>
                <option value="carpet_gray">Acoustic Plush Carpet</option>
              </select>
            </div>
          </div>
        )}

        {/* 5. DEFAULT PROJECT / 3D LIGHTING & ENVIRONMENT SETTINGS (when nothing selected) */}
        {!selection && (
          <div className="space-y-5">
            <div>
              <span className="font-semibold text-sky-400 uppercase tracking-wider text-[11px] block mb-2">
                Active Level
              </span>
              <div className="bg-[#181d26] p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Level Name</span>
                  <span className="font-medium text-slate-100">{activeFloor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elevation</span>
                  <span className="font-mono text-slate-200">{activeFloor.elevation} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ceiling Height</span>
                  <span className="font-mono text-slate-200">{activeFloor.height} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Walls / Objects</span>
                  <span className="font-mono text-slate-200">{activeFloor.walls.length} / {activeFloor.objects.length}</span>
                </div>
              </div>
            </div>

            {/* 3D Sun & Environment */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Sun size={15} className="text-amber-400" />
                <span>Atmospheric Sun & Lighting</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Sun Elevation Angle</span>
                  <span className="font-mono">{project.settings.sunElevation}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={project.settings.sunElevation}
                  onChange={(e) => onUpdateProjectSettings({ sunElevation: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Sun Azimuth Compass</span>
                  <span className="font-mono">{project.settings.sunAzimuth}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={project.settings.sunAzimuth}
                  onChange={(e) => onUpdateProjectSettings({ sunAzimuth: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Dollhouse Wall Cutout */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Dollhouse Wall Cut Height</span>
                  <span className="font-mono">
                    {project.settings.wallCutHeight > 0 ? `${project.settings.wallCutHeight}m` : 'Full'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.25"
                  value={project.settings.wallCutHeight}
                  onChange={(e) => onUpdateProjectSettings({ wallCutHeight: parseFloat(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Ghost Lower Floor Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 text-[11px]">2D Lower Floor Ghost</span>
                <input
                  type="checkbox"
                  checked={project.settings.ghostLowerFloor}
                  onChange={(e) => onUpdateProjectSettings({ ghostLowerFloor: e.target.checked })}
                  className="accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
