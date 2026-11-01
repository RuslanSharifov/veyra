/**
 * Multi-Floor Manager Modal
 * Create, rename, duplicate, reorder, adjust elevations, and toggle floor visibility
 */
import React, { useState } from 'react';
import { Floor } from '../../types/cad';
import { 
  X, Layers, Plus, Copy, Trash2, Eye, EyeOff, 
  ArrowUp, ArrowDown, Building2 
} from 'lucide-react';

interface FloorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Floor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  onUpdateFloors: (floors: Floor[]) => void;
}

export const FloorManagerModal: React.FC<FloorManagerModalProps> = ({
  isOpen,
  onClose,
  floors,
  activeFloorId,
  onSelectFloor,
  onUpdateFloors,
}) => {
  const [newFloorName, setNewFloorName] = useState('');

  if (!isOpen) return null;

  const handleAddFloor = () => {
    const highestElevation = Math.max(...floors.map((f) => f.elevation + f.height), 0);
    const newFloor: Floor = {
      id: 'floor_' + Date.now(),
      name: newFloorName.trim() || `Level ${floors.length}`,
      elevation: Math.round(highestElevation * 10) / 10,
      height: 2.8,
      visibleIn3D: true,
      nodes: [],
      walls: [],
      rooms: [],
      objects: [],
    };
    onUpdateFloors([...floors, newFloor]);
    onSelectFloor(newFloor.id);
    setNewFloorName('');
  };

  const handleDuplicateFloor = (floorToCopy: Floor) => {
    const highestElevation = Math.max(...floors.map((f) => f.elevation + f.height), 0);
    const newFloorId = 'floor_' + Date.now();

    // Map old node IDs to new IDs
    const nodeIdMap = new Map<string, string>();
    const clonedNodes = floorToCopy.nodes.map((n) => {
      const newId = 'n_' + Math.random().toString(36).substr(2, 9);
      nodeIdMap.set(n.id, newId);
      return { ...n, id: newId };
    });

    const clonedWalls = floorToCopy.walls.map((w) => ({
      ...w,
      id: 'w_' + Math.random().toString(36).substr(2, 9),
      startNodeId: nodeIdMap.get(w.startNodeId) || w.startNodeId,
      endNodeId: nodeIdMap.get(w.endNodeId) || w.endNodeId,
      openings: w.openings.map((op) => ({ ...op, id: 'op_' + Math.random().toString(36).substr(2, 9) })),
    }));

    const clonedRooms = floorToCopy.rooms.map((r) => ({
      ...r,
      id: 'r_' + Math.random().toString(36).substr(2, 9),
      nodeIds: r.nodeIds.map((id) => nodeIdMap.get(id) || id),
    }));

    const clonedObjects = floorToCopy.objects.map((obj) => ({
      ...obj,
      id: 'obj_' + Math.random().toString(36).substr(2, 9),
    }));

    const duplicatedFloor: Floor = {
      id: newFloorId,
      name: `${floorToCopy.name} (Copy)`,
      elevation: Math.round(highestElevation * 10) / 10,
      height: floorToCopy.height,
      visibleIn3D: true,
      nodes: clonedNodes,
      walls: clonedWalls,
      rooms: clonedRooms,
      objects: clonedObjects,
    };

    onUpdateFloors([...floors, duplicatedFloor]);
    onSelectFloor(duplicatedFloor.id);
  };

  const handleDeleteFloor = (floorId: string) => {
    if (floors.length <= 1) return;
    const remaining = floors.filter((f) => f.id !== floorId);
    onUpdateFloors(remaining);
    if (activeFloorId === floorId) {
      onSelectFloor(remaining[0].id);
    }
  };

  const handleUpdateFloor = (floorId: string, updates: Partial<Floor>) => {
    const updated = floors.map((f) => (f.id === floorId ? { ...f, ...updates } : f));
    onUpdateFloors(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="morphic-card bg-[#0e121a]/95 rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Mərtəbə İdarəçisi (Floors)</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">Çoxmərtəbəli bina, hündürlük və 3D yığma səviyyələri</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Floors List */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {floors.map((floor, idx) => {
            const isActive = floor.id === activeFloorId;
            return (
              <div
                key={floor.id}
                className={`p-4 rounded-xl border transition ${
                  isActive
                    ? 'bg-[#181d26] border-sky-500/50 shadow-md shadow-sky-500/5'
                    : 'bg-[#151922] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                      L{idx}
                    </span>
                    <input
                      type="text"
                      value={floor.name}
                      onChange={(e) => handleUpdateFloor(floor.id, { name: e.target.value })}
                      className="bg-transparent font-medium text-sm text-slate-100 hover:bg-slate-800/40 px-2 py-1 rounded outline-none focus:ring-1 focus:ring-sky-500 flex-1 max-w-[240px]"
                    />
                    {isActive && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                        Editing Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle 3D Visibility */}
                    <button
                      onClick={() => handleUpdateFloor(floor.id, { visibleIn3D: !floor.visibleIn3D })}
                      className={`p-1.5 rounded transition ${
                        floor.visibleIn3D
                          ? 'text-sky-400 hover:bg-slate-800'
                          : 'text-slate-500 hover:bg-slate-800'
                      }`}
                      title={floor.visibleIn3D ? 'Hide in 3D' : 'Show in 3D'}
                    >
                      {floor.visibleIn3D ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    {/* Duplicate Floor */}
                    <button
                      onClick={() => handleDuplicateFloor(floor)}
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Duplicate Floor Layout"
                    >
                      <Copy size={16} />
                    </button>

                    {/* Delete Floor */}
                    {floors.length > 1 && (
                      <button
                        onClick={() => handleDeleteFloor(floor.id)}
                        className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
                        title="Delete Floor"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Elevation & Ceiling Height controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Elevation (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={floor.elevation}
                      onChange={(e) => handleUpdateFloor(floor.id, { elevation: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Ceiling Height (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={floor.height}
                      onChange={(e) => handleUpdateFloor(floor.id, { height: parseFloat(e.target.value) || 2.8 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 text-xs"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-slate-500">Elements</span>
                    <span className="font-mono text-slate-300">
                      {floor.walls.length} walls, {floor.objects.length} items
                    </span>
                  </div>

                  <div className="flex items-end">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectFloor(floor.id);
                          onClose();
                        }}
                        className="w-full py-1 rounded bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 font-medium transition text-xs"
                      >
                        Switch To
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Floor Footer */}
        <div className="p-3 sm:p-4 bg-[#151922] border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="New Floor (e.g. Roof Terrace, Basement)"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              className="w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={handleAddFloor}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-3 sm:px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow transition whitespace-nowrap shrink-0"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
