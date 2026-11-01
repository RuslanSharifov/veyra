/**
 * Export Modal: Floor plan SVG/PNG, 3D OBJ, Project JSON, and Project Spec Report
 */
import React, { useState } from 'react';
import { Project, Floor } from '../../types/cad';
import { 
  exportProjectJSON, export3DSceneToOBJ, generateProjectReport 
} from '../../utils/exporter';
import { 
  X, Download, FileCode, Box, FileText, 
  Image, Check, Copy, Printer 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  activeFloor: Floor;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeFloor,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'report'>('export');
  const [copiedReport, setCopiedReport] = useState(false);

  if (!isOpen) return null;

  const reportText = generateProjectReport(project);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_specification_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport2DSVG = () => {
    // Generate clean vector SVG of current floor
    const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));
    const minX = Math.min(...activeFloor.nodes.map((n) => n.x), -5) - 2;
    const maxX = Math.max(...activeFloor.nodes.map((n) => n.x), 5) + 2;
    const minY = Math.min(...activeFloor.nodes.map((n) => n.y), -5) - 2;
    const maxY = Math.max(...activeFloor.nodes.map((n) => n.y), 5) + 2;
    const w = (maxX - minX) * 100;
    const h = (maxY - minY) * 100;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX * 100} ${-maxY * 100} ${w} ${h}" width="${w}" height="${h}">\n`;
    svg += `<rect x="${minX * 100}" y="${-maxY * 100}" width="${w}" height="${h}" fill="#0f1117"/>\n`;

    // Rooms
    activeFloor.rooms.forEach((r) => {
      const pts = r.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean);
      if (pts.length >= 3) {
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p!.x * 100).toFixed(1)} ${(-p!.y * 100).toFixed(1)}`).join(' ') + ' Z';
        svg += `<path d="${d}" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" stroke-width="2"/>\n`;
      }
    });

    // Walls
    activeFloor.walls.forEach((wall) => {
      const n1 = nodeMap.get(wall.startNodeId);
      const n2 = nodeMap.get(wall.endNodeId);
      if (n1 && n2) {
        svg += `<line x1="${(n1.x * 100).toFixed(1)}" y1="${(-n1.y * 100).toFixed(1)}" x2="${(n2.x * 100).toFixed(1)}" y2="${(-n2.y * 100).toFixed(1)}" stroke="#cbd5e1" stroke-width="${wall.thickness * 100}" stroke-linecap="square"/>\n`;
      }
    });

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_floorplan.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="morphic-card bg-[#0e121a]/95 rounded-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">CAD & Spesifikasiya İxracı</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">CAD faylları, 3D OBJ modelləri və material hesabatları</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('export')}
                className={`px-2.5 sm:px-3 py-1 rounded transition text-xs ${
                  activeTab === 'export' ? 'bg-sky-500 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Exports
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-2.5 sm:px-3 py-1 rounded transition text-xs ${
                  activeTab === 'report' ? 'bg-sky-500 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Report
              </button>
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'export' ? (
          <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-1">
            {/* 1. Project JSON */}
            <div className="bg-[#181d26] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
                  <FileCode size={20} />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">Project File (.hstudio)</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Full project backup containing all floors, walls, openings, rooms, furniture, and camera keyframes.
                </p>
              </div>
              <button
                onClick={() => exportProjectJSON(project)}
                className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Download size={14} />
                <span>Download .hstudio JSON</span>
              </button>
            </div>

            {/* 2. 3D OBJ Mesh */}
            <div className="bg-[#181d26] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                  <Box size={20} />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">3D Wavefront Mesh (.obj)</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Export true 3D architectural geometry (walls and room slabs) compatible with Blender, SketchUp, and AutoCAD.
                </p>
              </div>
              <button
                onClick={() => export3DSceneToOBJ(activeFloor, project.name)}
                className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Download size={14} />
                <span>Export 3D .OBJ File</span>
              </button>
            </div>

            {/* 3. 2D Vector SVG */}
            <div className="bg-[#181d26] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <Image size={20} />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">2D Vector CAD (.svg)</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Crisp infinitely scalable vector blueprint of the active floor plan for printing and architectural drawings.
                </p>
              </div>
              <button
                onClick={handleExport2DSVG}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Download size={14} />
                <span>Export Vector SVG</span>
              </button>
            </div>

            {/* 4. Project Spec Report */}
            <div className="bg-[#181d26] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                  <FileText size={20} />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">Architectural Spec Report</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Comprehensive breakdown of living square meterage per room, wall lengths, and furniture fixture schedule.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('report')}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <FileText size={14} />
                <span>View Full Spec Report</span>
              </button>
            </div>
          </div>
        ) : (
          /* Report Tab */
          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">Project Specification Manifest</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition"
                >
                  {copiedReport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedReport ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Download size={14} />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-y-auto flex-1 select-text leading-relaxed">
              {reportText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
