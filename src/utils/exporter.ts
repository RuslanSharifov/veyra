/**
 * Exporter utilities for Home Studio 3D
 * Export/Import JSON, 2D Floor Plan PNG/SVG, 3D OBJ, and Project Spec Report
 */
import { Project, Floor } from '../types/cad';
import { polygonArea } from './geometry';

export function exportProjectJSON(project: Project): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_design.hstudio`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProjectJSON(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as Project;
        if (!parsed.floors || !parsed.settings) {
          throw new Error('Invalid project file format.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function export3DSceneToOBJ(floor: Floor, projectName: string): void {
  // Simple clean OBJ wave-front export of walls and floors
  let obj = `# Home Studio 3D Wavefront OBJ Exporter\n# Project: ${projectName}\n# Floor: ${floor.name}\n\n`;
  let vIndex = 1;

  // Export floor polygons
  floor.rooms.forEach((room, rIdx) => {
    obj += `o Room_${rIdx}_${room.name.replace(/\s+/g, '_')}\n`;
    const nodeMap = new Map(floor.nodes.map((n) => [n.id, n]));
    const pts = room.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean);
    if (pts.length >= 3) {
      pts.forEach((p) => {
        if (p) obj += `v ${p.x.toFixed(4)} ${floor.elevation.toFixed(4)} ${(-p.y).toFixed(4)}\n`;
      });
      obj += 'f';
      for (let i = 0; i < pts.length; i++) {
        obj += ` ${vIndex + i}`;
      }
      obj += '\n\n';
      vIndex += pts.length;
    }
  });

  // Export walls as 3D rectangular cuboids
  const nodeMap = new Map(floor.nodes.map((n) => [n.id, n]));
  floor.walls.forEach((w, wIdx) => {
    const n1 = nodeMap.get(w.startNodeId);
    const n2 = nodeMap.get(w.endNodeId);
    if (!n1 || !n2) return;

    obj += `o Wall_${wIdx}\n`;
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const nx = (-dy / len) * (w.thickness / 2);
    const ny = (dx / len) * (w.thickness / 2);

    const bY = floor.elevation;
    const tY = floor.elevation + w.height;

    // 8 vertices for the cuboid
    const v = [
      [n1.x + nx, bY, -(n1.y + ny)],
      [n2.x + nx, bY, -(n2.y + ny)],
      [n2.x - nx, bY, -(n2.y - ny)],
      [n1.x - nx, bY, -(n1.y - ny)],
      [n1.x + nx, tY, -(n1.y + ny)],
      [n2.x + nx, tY, -(n2.y + ny)],
      [n2.x - nx, tY, -(n2.y - ny)],
      [n1.x - nx, tY, -(n1.y - ny)],
    ];

    v.forEach(([vx, vy, vz]) => {
      obj += `v ${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}\n`;
    });

    // 6 faces (quads)
    const start = vIndex;
    obj += `f ${start} ${start + 1} ${start + 2} ${start + 3}\n`; // bottom
    obj += `f ${start + 4} ${start + 7} ${start + 6} ${start + 5}\n`; // top
    obj += `f ${start} ${start + 4} ${start + 5} ${start + 1}\n`; // front
    obj += `f ${start + 1} ${start + 5} ${start + 6} ${start + 2}\n`; // right
    obj += `f ${start + 2} ${start + 6} ${start + 7} ${start + 3}\n`; // back
    obj += `f ${start + 3} ${start + 7} ${start + 4} ${start}\n\n`; // left

    vIndex += 8;
  });

  const blob = new Blob([obj], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_model.obj`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateProjectReport(project: Project): string {
  let report = `==========================================================\n`;
  report += `  HOME STUDIO 3D - ARCHITECTURAL PROJECT REPORT\n`;
  report += `==========================================================\n\n`;
  report += `Project Name: ${project.name}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Measurement System: ${project.settings.unit.toUpperCase()}\n`;
  report += `Total Floors: ${project.floors.length}\n\n`;

  let grandTotalArea = 0;

  project.floors.forEach((floor, fIdx) => {
    report += `----------------------------------------------------------\n`;
    report += `Floor ${fIdx + 1}: ${floor.name}\n`;
    report += `Elevation: ${floor.elevation} m | Ceiling Height: ${floor.height} m\n`;
    report += `Walls: ${floor.walls.length} | Furniture / Fixtures: ${floor.objects.length}\n`;
    report += `----------------------------------------------------------\n`;

    const nodeMap = new Map(floor.nodes.map((n) => [n.id, n]));
    let floorArea = 0;

    report += `\n[ROOMS & AREAS]\n`;
    if (floor.rooms.length === 0) {
      report += `  (No closed rooms defined yet)\n`;
    } else {
      floor.rooms.forEach((r) => {
        const pts = r.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as { x: number; y: number }[];
        const area = polygonArea(pts);
        floorArea += area;
        report += `  * ${r.name.padEnd(24)} : ${area.toFixed(2)} m² (${(area * 10.7639).toFixed(1)} sq ft) [Floor: ${r.floorFinish}]\n`;
      });
      report += `  Total Floor Area: ${floorArea.toFixed(2)} m² (${(floorArea * 10.7639).toFixed(1)} sq ft)\n`;
    }
    grandTotalArea += floorArea;

    report += `\n[FURNITURE & FIXTURES SCHEDULE]\n`;
    if (floor.objects.length === 0) {
      report += `  (No objects placed)\n`;
    } else {
      floor.objects.forEach((obj, oIdx) => {
        report += `  ${oIdx + 1}. ${obj.name.padEnd(26)} [${obj.category.toUpperCase()}] Dim: ${obj.width}m x ${obj.depth}m x ${obj.height}m (Mat: ${obj.material || 'standard'})\n`;
      });
    }
    report += `\n`;
  });

  report += `==========================================================\n`;
  report += `GRAND TOTAL LIVING AREA: ${grandTotalArea.toFixed(2)} m² (${(grandTotalArea * 10.7639).toFixed(1)} sq ft)\n`;
  report += `==========================================================\n`;

  return report;
}
