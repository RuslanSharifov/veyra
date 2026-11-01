/**
 * Object & Furniture Library Modal
 * Browse built-in catalog or create custom procedural objects with dimensions and materials
 */
import React, { useState } from 'react';
import { FURNITURE_CATALOG, CatalogItem } from '../../data/furnitureCatalog';
import { ObjectInstance } from '../../types/cad';
import { 
  X, Search, Armchair, BedDouble, Utensils, 
  Bath, Briefcase, TrendingUp, Trees, Plus, 
  Upload, Sparkles, Box 
} from 'lucide-react';

interface ObjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceObject: (obj: Omit<ObjectInstance, 'id' | 'x' | 'y'>) => void;
}

export const ObjectLibraryModal: React.FC<ObjectLibraryModalProps> = ({
  isOpen,
  onClose,
  onPlaceObject,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<'catalog' | 'custom'>('catalog');

  // Custom Object Builder State
  const [customName, setCustomName] = useState('Custom Cabinet');
  const [customCategory, setCustomCategory] = useState('living');
  const [customWidth, setCustomWidth] = useState(1.2);
  const [customDepth, setCustomDepth] = useState(0.6);
  const [customHeight, setCustomHeight] = useState(0.8);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [customMaterial, setCustomMaterial] = useState<'wood' | 'fabric' | 'metal' | 'glass' | 'leather' | 'marble'>('wood');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Items', icon: <Box size={14} /> },
    { id: 'living', label: 'Living', icon: <Armchair size={14} /> },
    { id: 'bedroom', label: 'Bedroom', icon: <BedDouble size={14} /> },
    { id: 'kitchen', label: 'Kitchen', icon: <Utensils size={14} /> },
    { id: 'bathroom', label: 'Bathroom', icon: <Bath size={14} /> },
    { id: 'office', label: 'Office', icon: <Briefcase size={14} /> },
    { id: 'architectural', label: 'Stairs & Arch', icon: <TrendingUp size={14} /> },
    { id: 'decor', label: 'Decor & Plants', icon: <Trees size={14} /> },
  ];

  const filteredItems = FURNITURE_CATALOG.filter((item) => {
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectCatalogItem = (item: CatalogItem) => {
    onPlaceObject({
      catalogId: item.id,
      name: item.name,
      category: item.category,
      z: 0,
      rotation: 0,
      width: item.width,
      depth: item.depth,
      height: item.height,
      color: item.defaultColor,
      material: item.materialType,
    });
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceObject({
      catalogId: 'custom_' + Date.now(),
      name: customName,
      category: customCategory,
      z: 0,
      rotation: 0,
      width: customWidth,
      depth: customDepth,
      height: customHeight,
      color: customColor,
      material: customMaterial,
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="morphic-card bg-[#0e121a]/95 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Armchair size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Mebel & Memarlıq Obyektləri</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">
                Kataloqdan mebel seçin və ya fərdi ölçülü komponentlər qurun
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveMode('catalog')}
                className={`px-2.5 sm:px-3 py-1 rounded transition text-xs ${
                  activeMode === 'catalog'
                    ? 'bg-sky-500 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Catalog
              </button>
              <button
                onClick={() => setActiveMode('custom')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded transition text-xs ${
                  activeMode === 'custom'
                    ? 'bg-sky-500 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus size={13} />
                <span className="hidden xs:inline">Custom Editor</span>
                <span className="xs:hidden">Custom</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {activeMode === 'catalog' ? (
          <>
            {/* Category tabs & search */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#151922]">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition shrink-0 ${
                      activeTab === cat.id
                        ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative min-w-[140px] sm:min-w-[200px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="p-3 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 flex-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectCatalogItem(item)}
                  className="group bg-[#181d26] border border-slate-800 hover:border-sky-500/60 rounded-xl p-4 flex flex-col justify-between transition cursor-pointer hover:shadow-lg hover:shadow-sky-500/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 capitalize">
                        {item.materialType}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-100 text-sm group-hover:text-sky-400 transition mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-400">
                      {item.width}m × {item.depth}m × {item.height}m
                    </span>
                    <button className="bg-sky-500/10 group-hover:bg-sky-500 text-sky-400 group-hover:text-slate-950 font-semibold px-2.5 py-1 rounded transition text-xs flex items-center gap-1">
                      <Plus size={13} />
                      <span>Place</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Custom Object Creator */
          <form onSubmit={handleCreateCustom} className="p-6 overflow-y-auto space-y-4 max-w-xl mx-auto w-full">
            <div className="text-center mb-6">
              <h3 className="text-base font-semibold text-slate-100">Create Custom Component</h3>
              <p className="text-xs text-slate-400 mt-1">
                Design custom architectural fixtures with precise millimeter dimensions and PBR finishes
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Component Name</label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#181d26] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="living">Living Room</option>
                  <option value="bedroom">Bedroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="office">Office</option>
                  <option value="architectural">Architectural Element</option>
                  <option value="decor">Decor & Fixture</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Material Finish</label>
                <select
                  value={customMaterial}
                  onChange={(e) => setCustomMaterial(e.target.value as any)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="wood">Solid Wood</option>
                  <option value="fabric">Woven Fabric</option>
                  <option value="leather">Cognac Leather</option>
                  <option value="metal">Brushed Metal</option>
                  <option value="glass">Clear Glass</option>
                  <option value="marble">Italian Marble</option>
                </select>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Width (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="10"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Depth (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="10"
                  value={customDepth}
                  onChange={(e) => setCustomDepth(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Height (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="10"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Finish Color */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Color Tone</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-300">{customColor}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveMode('catalog')}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
              >
                Back to Catalog
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold shadow-md transition"
              >
                Place Custom Component
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
