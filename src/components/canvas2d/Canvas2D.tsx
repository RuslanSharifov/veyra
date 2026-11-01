/**
 * 2D Architectural Floor Plan CAD Canvas
 * Features: Sub-millimeter grid, wall chaining, snap magnets, opening placements,
 * room boundary calculation, node dragging, ghost floor underlays, and dimension annotations.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Project, Floor, Wall, WallNode, WallOpening, ObjectInstance, Room, ToolType, SelectionType, Point2D } from '../../types/cad';
import { distance2D, closestPointOnSegment, polygonCentroid, polygonArea, isPointInPolygon } from '../../utils/geometry';
import { formatMeasurement, snapPointToGrid, snapAngle } from '../../utils/units';
import { Plus, Minus, Maximize2, Move, MousePointer, Info } from 'lucide-react';

interface Canvas2DProps {
  project: Project;
  activeFloor: Floor;
  activeTool: ToolType;
  selection: SelectionType;
  onSelect: (sel: SelectionType) => void;
  onUpdateFloor: (updatedFloor: Floor) => void;
  onToolChange: (tool: ToolType) => void;
  onOpenLibrary: () => void;
}

export const Canvas2D: React.FC<Canvas2DProps> = ({
  project,
  activeFloor,
  activeTool,
  selection,
  onSelect,
  onUpdateFloor,
  onToolChange,
  onOpenLibrary,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // View transform state: zoom (pixels per meter), pan offset (pixels)
  const [zoom, setZoom] = useState<number>(60); // 60 pixels = 1 meter
  const [pan, setPan] = useState<Point2D>({ x: 0, y: 0 }); // center offset
  const [isPanning, setIsPanning] = useState(false);
  const [startPanMouse, setStartPanMouse] = useState<Point2D>({ x: 0, y: 0 });

  // Interactive drawing state
  const [wallStartNodeId, setWallStartNodeId] = useState<string | null>(null);
  const [wallStartPos, setWallStartPos] = useState<Point2D | null>(null);
  const [mouseMeters, setMouseMeters] = useState<Point2D>({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
  const [dragStartMeters, setDragStartMeters] = useState<Point2D>({ x: 0, y: 0 });
  const [roomNodeSequence, setRoomNodeSequence] = useState<string[]>([]);

  // Measurement tool state
  const [measureStart, setMeasureStart] = useState<Point2D | null>(null);
  const isSpaceDown = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helper: screen coordinates to CAD meters
  const screenToMeters = useCallback(
    (screenX: number, screenY: number, width: number, height: number): Point2D => {
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      return {
        x: (screenX - centerX) / zoom,
        y: -(screenY - centerY) / zoom, // Y is up in CAD
      };
    },
    [zoom, pan]
  );

  // Helper: CAD meters to screen coordinates
  const metersToScreen = useCallback(
    (mx: number, my: number, width: number, height: number): Point2D => {
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      return {
        x: centerX + mx * zoom,
        y: centerY - my * zoom,
      };
    },
    [zoom, pan]
  );

  // Handle Resize & Canvas Painting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight);

    // Background
    ctx.fillStyle = '#0f1218';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Architectural Grid
    drawGrid(ctx, width, height);

    // 2. Draw Lower Floor Ghost Overlay (if enabled)
    if (project.settings.ghostLowerFloor) {
      drawGhostFloors(ctx, width, height);
    }

    // 3. Draw Rooms / Slabs
    drawRooms(ctx, width, height);

    // 4. Draw Walls & Dimensions
    drawWalls(ctx, width, height);

    // 5. Draw Furniture / Objects
    drawObjects(ctx, width, height);

    // 6. Draw Active Drawing Preview (wall, measure, room)
    drawActiveDrawing(ctx, width, height);

    // 7. Draw Dimensions & Snap Highlights
    drawSnapIndicators(ctx, width, height);
  }, [
    project,
    activeFloor,
    activeTool,
    selection,
    zoom,
    pan,
    mouseMeters,
    wallStartPos,
    hoveredNodeId,
    hoveredWallId,
    roomNodeSequence,
    measureStart,
  ]);

  // --- RENDERING HELPERS ---

  function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const origin = metersToScreen(0, 0, width, height);

    // Grid sizes: Major = 1m or 5m depending on zoom; Minor = 0.25m or 0.1m
    const minorStep = project.settings.gridSize; // e.g. 0.25m
    const majorStep = minorStep < 0.5 ? 1.0 : 5.0;

    const minorPix = minorStep * zoom;
    const majorPix = majorStep * zoom;

    // Draw minor grid
    if (minorPix >= 12) {
      ctx.strokeStyle = '#181e28';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const startX = origin.x % minorPix;
      for (let x = startX; x < width; x += minorPix) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      const startY = origin.y % minorPix;
      for (let y = startY; y < height; y += minorPix) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // Draw major grid
    if (majorPix >= 24) {
      ctx.strokeStyle = '#222b3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const startX = origin.x % majorPix;
      for (let x = startX; x < width; x += majorPix) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      const startY = origin.y % majorPix;
      for (let y = startY; y < height; y += majorPix) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // Axes lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();

    // Origin Marker (0,0)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('(0,0)', origin.x + 6, origin.y - 6);
  }

  function drawGhostFloors(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const activeIdx = project.floors.findIndex((f) => f.id === activeFloor.id);
    if (activeIdx <= 0) return;
    const lowerFloor = project.floors[activeIdx - 1];

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;

    const lowerNodeMap = new Map(lowerFloor.nodes.map((n) => [n.id, n]));
    lowerFloor.walls.forEach((w) => {
      const n1 = lowerNodeMap.get(w.startNodeId);
      const n2 = lowerNodeMap.get(w.endNodeId);
      if (!n1 || !n2) return;
      const s1 = metersToScreen(n1.x, n1.y, width, height);
      const s2 = metersToScreen(n2.x, n2.y, width, height);
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawRooms(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));

    activeFloor.rooms.forEach((room) => {
      const pts = room.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as WallNode[];
      if (pts.length < 3) return;

      const isSelected = selection?.type === 'room' && selection.id === room.id;

      // Fill room slab
      ctx.beginPath();
      const first = metersToScreen(pts[0].x, pts[0].y, width, height);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const sc = metersToScreen(pts[i].x, pts[i].y, width, height);
        ctx.lineTo(sc.x, sc.y);
      }
      ctx.closePath();

      // Floor styling
      ctx.fillStyle = isSelected
        ? 'rgba(56, 189, 248, 0.15)'
        : room.floorFinish === 'parquet_oak'
        ? 'rgba(78, 59, 44, 0.18)'
        : room.floorFinish === 'marble_tile'
        ? 'rgba(210, 215, 225, 0.08)'
        : 'rgba(30, 41, 59, 0.25)';
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Room label and area badge
      const centroid = polygonCentroid(pts);
      const cScreen = metersToScreen(centroid.x, centroid.y, width, height);
      const area = polygonArea(pts);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, cScreen.x, cScreen.y - 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(`${area.toFixed(2)} m²`, cScreen.x, cScreen.y + 12);
    });
  }

  function drawWalls(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));

    activeFloor.walls.forEach((wall) => {
      const n1 = nodeMap.get(wall.startNodeId);
      const n2 = nodeMap.get(wall.endNodeId);
      if (!n1 || !n2) return;

      const s1 = metersToScreen(n1.x, n1.y, width, height);
      const s2 = metersToScreen(n2.x, n2.y, width, height);
      const isSelected = selection?.type === 'wall' && selection.id === wall.id;
      const isHovered = hoveredWallId === wall.id;

      const wallPixelThick = Math.max(3, wall.thickness * zoom);

      // Draw Wall Body
      ctx.save();
      ctx.strokeStyle = isSelected ? '#38bdf8' : isHovered ? '#60a5fa' : '#cbd5e1';
      ctx.lineWidth = wallPixelThick;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
      ctx.restore();

      // Openings (Doors and Windows)
      const wallLen = distance2D(n1, n2);
      if (wallLen > 0 && wall.openings.length > 0) {
        wall.openings.forEach((op) => {
          const tStart = op.distFromStart / wallLen;
          const tEnd = (op.distFromStart + op.width) / wallLen;
          if (tStart >= 0 && tEnd <= 1.05) {
            const op1M: Point2D = {
              x: n1.x + (n2.x - n1.x) * tStart,
              y: n1.y + (n2.y - n1.y) * tStart,
            };
            const op2M: Point2D = {
              x: n1.x + (n2.x - n1.x) * tEnd,
              y: n1.y + (n2.y - n1.y) * tEnd,
            };
            const op1S = metersToScreen(op1M.x, op1M.y, width, height);
            const op2S = metersToScreen(op2M.x, op2M.y, width, height);

            const isOpSelected =
              selection?.type === 'opening' &&
              selection.wallId === wall.id &&
              selection.openingId === op.id;

            // Cutout background
            ctx.save();
            ctx.strokeStyle = '#0f1218';
            ctx.lineWidth = wallPixelThick + 1;
            ctx.beginPath();
            ctx.moveTo(op1S.x, op1S.y);
            ctx.lineTo(op2S.x, op2S.y);
            ctx.stroke();

            // Opening Frame
            if (op.type === 'door') {
              // Door frame lines
              ctx.strokeStyle = isOpSelected ? '#38bdf8' : '#e2e8f0';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(op1S.x, op1S.y);
              ctx.lineTo(op2S.x, op2S.y);
              ctx.stroke();

              // Swing arc
              const doorAngle = Math.atan2(op2S.y - op1S.y, op2S.x - op1S.x);
              const swingRad = op.width * zoom;
              ctx.beginPath();
              ctx.strokeStyle = isOpSelected ? '#38bdf8' : 'rgba(226, 232, 240, 0.4)';
              ctx.setLineDash([3, 3]);
              ctx.arc(
                op1S.x,
                op1S.y,
                swingRad,
                doorAngle,
                doorAngle + (op.flipped ? -Math.PI / 2 : Math.PI / 2),
                op.flipped
              );
              ctx.stroke();
            } else if (op.type === 'window') {
              // 3 Parallel lines for architectural window symbol
              ctx.strokeStyle = isOpSelected ? '#38bdf8' : '#38bdf8';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(op1S.x, op1S.y);
              ctx.lineTo(op2S.x, op2S.y);
              ctx.stroke();

              ctx.strokeStyle = '#94a3b8';
              ctx.lineWidth = 1;
              ctx.beginPath();
              // Offset window frame lines
              const perpX = -(s2.y - s1.y) / Math.hypot(s2.x - s1.x, s2.y - s1.y) * 4;
              const perpY = (s2.x - s1.x) / Math.hypot(s2.x - s1.x, s2.y - s1.y) * 4;
              ctx.moveTo(op1S.x + perpX, op1S.y + perpY);
              ctx.lineTo(op2S.x + perpX, op2S.y + perpY);
              ctx.moveTo(op1S.x - perpX, op1S.y - perpY);
              ctx.lineTo(op2S.x - perpX, op2S.y - perpY);
              ctx.stroke();
            }
            ctx.restore();
          }
        });
      }

      // Dimension badge on wall
      if (zoom >= 35) {
        const midM: Point2D = { x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 };
        const midS = metersToScreen(midM.x, midM.y, width, height);
        const lenFormatted = formatMeasurement(wallLen, project.settings.unit);

        ctx.font = '10px JetBrains Mono, monospace';
        const txtWidth = ctx.measureText(lenFormatted).width;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(midS.x - txtWidth / 2 - 4, midS.y - 8, txtWidth + 8, 16);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(midS.x - txtWidth / 2 - 4, midS.y - 8, txtWidth + 8, 16);

        ctx.fillStyle = isSelected ? '#38bdf8' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lenFormatted, midS.x, midS.y);
      }
    });

    // Draw Wall Nodes
    activeFloor.nodes.forEach((node) => {
      const s = metersToScreen(node.x, node.y, width, height);
      const isSelected = selection?.type === 'node' && selection.id === node.id;
      const isHovered = hoveredNodeId === node.id;

      ctx.beginPath();
      ctx.arc(s.x, s.y, isSelected || isHovered ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#38bdf8' : isHovered ? '#60a5fa' : '#475569';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  function drawObjects(ctx: CanvasRenderingContext2D, width: number, height: number) {
    activeFloor.objects.forEach((obj) => {
      const s = metersToScreen(obj.x, obj.y, width, height);
      const isSelected = selection?.type === 'object' && selection.id === obj.id;
      const wPix = obj.width * zoom;
      const dPix = obj.depth * zoom;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((-obj.rotation * Math.PI) / 180);

      // Object Footprint Box
      ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.3)' : 'rgba(71, 85, 105, 0.4)';
      ctx.fillRect(-wPix / 2, -dPix / 2, wPix, dPix);

      ctx.strokeStyle = isSelected ? '#38bdf8' : '#94a3b8';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(-wPix / 2, -dPix / 2, wPix, dPix);

      // Orientation indicator (front notch)
      ctx.beginPath();
      ctx.moveTo(-wPix / 4, -dPix / 2);
      ctx.lineTo(0, -dPix / 2 + 6);
      ctx.lineTo(wPix / 4, -dPix / 2);
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#64748b';
      ctx.stroke();

      // Rotation handle if selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, -dPix / 2 - 16, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.moveTo(0, -dPix / 2);
        ctx.lineTo(0, -dPix / 2 - 16);
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
      }

      // Label
      if (zoom >= 40) {
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.name, 0, 0);
      }

      ctx.restore();
    });
  }

  function drawActiveDrawing(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // 1. Wall drawing in progress
    if (activeTool === 'wall' && wallStartPos) {
      const sStart = metersToScreen(wallStartPos.x, wallStartPos.y, width, height);
      const sCurrent = metersToScreen(mouseMeters.x, mouseMeters.y, width, height);
      const dist = distance2D(wallStartPos, mouseMeters);

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(sStart.x, sStart.y);
      ctx.lineTo(sCurrent.x, sCurrent.y);
      ctx.stroke();

      // Distance tag
      const midX = (sStart.x + sCurrent.x) / 2;
      const midY = (sStart.y + sCurrent.y) / 2;
      const text = formatMeasurement(dist, project.settings.unit);
      ctx.font = '600 12px JetBrains Mono, monospace';
      ctx.fillStyle = '#0f172a';
      const tw = ctx.measureText(text).width;
      ctx.fillRect(midX - tw / 2 - 6, midY - 12, tw + 12, 24);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(midX - tw / 2 - 6, midY - 12, tw + 12, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY);
      ctx.restore();
    }

    // 2. Door/Window hover preview
    if ((activeTool === 'door' || activeTool === 'window') && hoveredWallId) {
      const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));
      const wall = activeFloor.walls.find((w) => w.id === hoveredWallId);
      if (wall) {
        const n1 = nodeMap.get(wall.startNodeId);
        const n2 = nodeMap.get(wall.endNodeId);
        if (n1 && n2) {
          const proj = closestPointOnSegment(mouseMeters, n1, n2);
          const pScreen = metersToScreen(proj.point.x, proj.point.y, width, height);
          ctx.beginPath();
          ctx.arc(pScreen.x, pScreen.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = activeTool === 'door' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(34, 197, 94, 0.8)';
          ctx.fill();
        }
      }
    }

    // 3. Measurement tool line
    if (activeTool === 'measure' && measureStart) {
      const sStart = metersToScreen(measureStart.x, measureStart.y, width, height);
      const sCurrent = metersToScreen(mouseMeters.x, mouseMeters.y, width, height);
      const dist = distance2D(measureStart, mouseMeters);

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sStart.x, sStart.y);
      ctx.lineTo(sCurrent.x, sCurrent.y);
      ctx.stroke();

      const midX = (sStart.x + sCurrent.x) / 2;
      const midY = (sStart.y + sCurrent.y) / 2;
      const text = `Distance: ${formatMeasurement(dist, project.settings.unit)}`;
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillStyle = '#1e1b10';
      const tw = ctx.measureText(text).width;
      ctx.fillRect(midX - tw / 2 - 6, midY - 12, tw + 12, 24);
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY);
      ctx.restore();
    }
  }

  function drawSnapIndicators(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (hoveredNodeId) {
      const node = activeFloor.nodes.find((n) => n.id === hoveredNodeId);
      if (node) {
        const s = metersToScreen(node.x, node.y, width, height);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // --- MOUSE & KEYBOARD EVENT HANDLERS ---

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const rawMeters = screenToMeters(screenX, screenY, canvas.width, canvas.height);

    // Pan with Middle Click or Space + Left Click
    if (e.button === 1 || (e.button === 0 && (isSpaceDown.current || e.altKey))) {
      setIsPanning(true);
      setStartPanMouse({ x: screenX, y: screenY });
      return;
    }

    if (e.button !== 0) return; // Only primary button for actions

    // Apply Snapping
    let pt = rawMeters;
    if (project.settings.gridSnap) {
      pt = snapPointToGrid(rawMeters, project.settings.gridSize);
    }
    if (hoveredNodeId) {
      const node = activeFloor.nodes.find((n) => n.id === hoveredNodeId);
      if (node) pt = { x: node.x, y: node.y };
    }

    // 1. SELECT TOOL
    if (activeTool === 'select') {
      // Check node click
      const clickedNode = activeFloor.nodes.find(
        (n) => distance2D({ x: n.x, y: n.y }, rawMeters) < 0.25
      );
      if (clickedNode) {
        onSelect({ type: 'node', id: clickedNode.id });
        setDraggedNodeId(clickedNode.id);
        setDragStartMeters(rawMeters);
        return;
      }

      // Check object click
      const clickedObj = activeFloor.objects.find((obj) => {
        const dx = Math.abs(rawMeters.x - obj.x);
        const dy = Math.abs(rawMeters.y - obj.y);
        return dx <= obj.width / 2 && dy <= obj.depth / 2;
      });
      if (clickedObj) {
        onSelect({ type: 'object', id: clickedObj.id });
        setDraggedObjectId(clickedObj.id);
        setDragStartMeters(rawMeters);
        return;
      }

      // Check opening click
      const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));
      for (const wall of activeFloor.walls) {
        const n1 = nodeMap.get(wall.startNodeId);
        const n2 = nodeMap.get(wall.endNodeId);
        if (!n1 || !n2) continue;
        const wLen = distance2D(n1, n2);
        for (const op of wall.openings) {
          const tMid = (op.distFromStart + op.width / 2) / wLen;
          const opMid: Point2D = {
            x: n1.x + (n2.x - n1.x) * tMid,
            y: n1.y + (n2.y - n1.y) * tMid,
          };
          if (distance2D(rawMeters, opMid) < op.width / 2) {
            onSelect({ type: 'opening', wallId: wall.id, openingId: op.id });
            return;
          }
        }
      }

      // Check wall click
      for (const wall of activeFloor.walls) {
        const n1 = nodeMap.get(wall.startNodeId);
        const n2 = nodeMap.get(wall.endNodeId);
        if (!n1 || !n2) continue;
        const proj = closestPointOnSegment(rawMeters, n1, n2);
        if (proj.distance < wall.thickness / 2 + 0.15) {
          onSelect({ type: 'wall', id: wall.id });
          return;
        }
      }

      // Check room click
      for (const room of activeFloor.rooms) {
        const pts = room.nodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as WallNode[];
        if (pts.length >= 3 && isPointInPolygon(rawMeters, pts)) {
          onSelect({ type: 'room', id: room.id });
          return;
        }
      }

      // Deselect if clicked empty space
      onSelect(null);
    }

    // 2. WALL DRAWING TOOL
    else if (activeTool === 'wall') {
      if (!wallStartNodeId) {
        // Start new wall chain
        let startId = hoveredNodeId;
        if (!startId) {
          // create node at pt
          startId = 'n_' + Date.now();
          const newNode: WallNode = { id: startId, x: pt.x, y: pt.y };
          activeFloor.nodes.push(newNode);
        }
        setWallStartNodeId(startId);
        setWallStartPos(pt);
      } else {
        // Complete current wall segment and chain
        let endId = hoveredNodeId;
        if (!endId) {
          endId = 'n_' + Date.now();
          const newNode: WallNode = { id: endId, x: pt.x, y: pt.y };
          activeFloor.nodes.push(newNode);
        }

        if (endId !== wallStartNodeId) {
          const newWall: Wall = {
            id: 'w_' + Date.now(),
            startNodeId: wallStartNodeId,
            endNodeId: endId,
            thickness: 0.2,
            height: activeFloor.height,
            openings: [],
          };
          const updatedFloor = {
            ...activeFloor,
            walls: [...activeFloor.walls, newWall],
          };
          onUpdateFloor(updatedFloor);

          // Chain next wall from this endpoint
          setWallStartNodeId(endId);
          setWallStartPos(pt);
        }
      }
    }

    // 3. DOOR / WINDOW TOOL
    else if ((activeTool === 'door' || activeTool === 'window') && hoveredWallId) {
      const wall = activeFloor.walls.find((w) => w.id === hoveredWallId);
      const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));
      if (wall) {
        const n1 = nodeMap.get(wall.startNodeId);
        const n2 = nodeMap.get(wall.endNodeId);
        if (n1 && n2) {
          const proj = closestPointOnSegment(rawMeters, n1, n2);
          const wallLen = distance2D(n1, n2);
          const defWidth = activeTool === 'door' ? 0.9 : 1.4;
          const defHeight = activeTool === 'door' ? 2.1 : 1.3;
          const defElevation = activeTool === 'door' ? 0 : 0.9;
          const distFromStart = Math.max(0.1, Math.min(wallLen - defWidth - 0.1, proj.t * wallLen - defWidth / 2));

          const newOpening: WallOpening = {
            id: 'op_' + Date.now(),
            type: activeTool === 'door' ? 'door' : 'window',
            subType: activeTool === 'door' ? 'single' : 'picture',
            distFromStart,
            width: defWidth,
            height: defHeight,
            elevation: defElevation,
          };

          const updatedWalls = activeFloor.walls.map((w) =>
            w.id === wall.id ? { ...w, openings: [...w.openings, newOpening] } : w
          );
          onUpdateFloor({ ...activeFloor, walls: updatedWalls });
          onSelect({ type: 'opening', wallId: wall.id, openingId: newOpening.id });
          onToolChange('select');
        }
      }
    }

    // 4. MEASURE TOOL
    else if (activeTool === 'measure') {
      if (!measureStart) {
        setMeasureStart(pt);
      } else {
        setMeasureStart(null); // finish measure
      }
    }

    // 5. ROOM TOOL (Click sequence of nodes to define a room polygon)
    else if (activeTool === 'room') {
      if (hoveredNodeId) {
        if (roomNodeSequence.length > 2 && hoveredNodeId === roomNodeSequence[0]) {
          // Closed room!
          const newRoom: Room = {
            id: 'room_' + Date.now(),
            name: `Room ${activeFloor.rooms.length + 1}`,
            nodeIds: [...roomNodeSequence],
            floorFinish: 'parquet_oak',
          };
          onUpdateFloor({
            ...activeFloor,
            rooms: [...activeFloor.rooms, newRoom],
          });
          setRoomNodeSequence([]);
          onToolChange('select');
        } else if (!roomNodeSequence.includes(hoveredNodeId)) {
          setRoomNodeSequence([...roomNodeSequence, hoveredNodeId]);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setPan((prev) => ({
        x: prev.x + (screenX - startPanMouse.x),
        y: prev.y + (screenY - startPanMouse.y),
      }));
      setStartPanMouse({ x: screenX, y: screenY });
      return;
    }

    let rawMeters = screenToMeters(screenX, screenY, canvas.width, canvas.height);

    // Check angle snap during wall drawing if shift held or angleSnap enabled
    if (activeTool === 'wall' && wallStartPos && (e.shiftKey || project.settings.angleSnap)) {
      rawMeters = snapAngle(wallStartPos, rawMeters, 15);
    } else if (project.settings.gridSnap) {
      rawMeters = snapPointToGrid(rawMeters, project.settings.gridSize);
    }

    setMouseMeters(rawMeters);

    // Hover detection for nodes
    const nearNode = activeFloor.nodes.find(
      (n) => distance2D({ x: n.x, y: n.y }, rawMeters) < 0.25
    );
    setHoveredNodeId(nearNode ? nearNode.id : null);

    // Hover detection for walls
    const nodeMap = new Map(activeFloor.nodes.map((n) => [n.id, n]));
    let foundWallId: string | null = null;
    for (const wall of activeFloor.walls) {
      const n1 = nodeMap.get(wall.startNodeId);
      const n2 = nodeMap.get(wall.endNodeId);
      if (!n1 || !n2) continue;
      const proj = closestPointOnSegment(rawMeters, n1, n2);
      if (proj.distance < wall.thickness / 2 + 0.15) {
        foundWallId = wall.id;
        break;
      }
    }
    setHoveredWallId(foundWallId);

    // Dragging active node
    if (draggedNodeId) {
      const updatedNodes = activeFloor.nodes.map((n) =>
        n.id === draggedNodeId ? { ...n, x: rawMeters.x, y: rawMeters.y } : n
      );
      onUpdateFloor({ ...activeFloor, nodes: updatedNodes });
    }

    // Dragging active object
    if (draggedObjectId) {
      const dx = rawMeters.x - dragStartMeters.x;
      const dy = rawMeters.y - dragStartMeters.y;
      const updatedObjects = activeFloor.objects.map((obj) =>
        obj.id === draggedObjectId ? { ...obj, x: obj.x + dx, y: obj.y + dy } : obj
      );
      setDragStartMeters(rawMeters);
      onUpdateFloor({ ...activeFloor, objects: updatedObjects });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    setDraggedObjectId(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(15, Math.min(250, prev * factor)));
  };

  // Keyboard escape / cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWallStartNodeId(null);
        setWallStartPos(null);
        setMeasureStart(null);
        setRoomNodeSequence([]);
        onToolChange('select');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection?.type === 'wall') {
          const updatedWalls = activeFloor.walls.filter((w) => w.id !== selection.id);
          onUpdateFloor({ ...activeFloor, walls: updatedWalls });
          onSelect(null);
        } else if (selection?.type === 'object') {
          const updatedObjs = activeFloor.objects.filter((o) => o.id !== selection.id);
          onUpdateFloor({ ...activeFloor, objects: updatedObjs });
          onSelect(null);
        } else if (selection?.type === 'opening') {
          const updatedWalls = activeFloor.walls.map((w) =>
            w.id === selection.wallId
              ? { ...w, openings: w.openings.filter((op) => op.id !== selection.openingId) }
              : w
          );
          onUpdateFloor({ ...activeFloor, walls: updatedWalls });
          onSelect(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, activeFloor, onUpdateFloor, onSelect, onToolChange]);

  const touchStartDist = useRef<number | null>(null);
  const touchStartMid = useRef<Point2D | null>(null);
  const touchStartPan = useRef<Point2D>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDist.current = dist;
      touchStartMid.current = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };
      touchStartPan.current = { ...pan };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      const screenX = t.clientX - rect.left;
      const screenY = t.clientY - rect.top;
      const rawMeters = screenToMeters(screenX, screenY, canvas.width, canvas.height);

      let pt = rawMeters;
      if (project.settings.gridSnap) {
        pt = snapPointToGrid(rawMeters, project.settings.gridSize);
      }

      // Check node click
      const clickedNode = activeFloor.nodes.find(
        (n) => distance2D({ x: n.x, y: n.y }, rawMeters) < 0.35
      );
      if (clickedNode && activeTool === 'select') {
        onSelect({ type: 'node', id: clickedNode.id });
        setDraggedNodeId(clickedNode.id);
        setDragStartMeters(rawMeters);
        return;
      }

      // Check object click
      const clickedObj = activeFloor.objects.find((obj) => {
        const dx = Math.abs(rawMeters.x - obj.x);
        const dy = Math.abs(rawMeters.y - obj.y);
        return dx <= obj.width / 2 + 0.15 && dy <= obj.depth / 2 + 0.15;
      });
      if (clickedObj && activeTool === 'select') {
        onSelect({ type: 'object', id: clickedObj.id });
        setDraggedObjectId(clickedObj.id);
        setDragStartMeters(rawMeters);
        return;
      }

      if (activeTool === 'wall') {
        if (!wallStartNodeId) {
          let startId = hoveredNodeId;
          if (!startId) {
            startId = 'n_' + Date.now();
            const newNode: WallNode = { id: startId, x: pt.x, y: pt.y };
            activeFloor.nodes.push(newNode);
          }
          setWallStartNodeId(startId);
          setWallStartPos(pt);
        } else {
          let endId = hoveredNodeId;
          if (!endId) {
            endId = 'n_' + Date.now();
            const newNode: WallNode = { id: endId, x: pt.x, y: pt.y };
            activeFloor.nodes.push(newNode);
          }
          if (endId !== wallStartNodeId) {
            const newWall: Wall = {
              id: 'w_' + Date.now(),
              startNodeId: wallStartNodeId,
              endNodeId: endId,
              thickness: 0.2,
              height: activeFloor.height,
              openings: [],
            };
            onUpdateFloor({
              ...activeFloor,
              walls: [...activeFloor.walls, newWall],
            });
            setWallStartNodeId(endId);
            setWallStartPos(pt);
          }
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 2 && touchStartDist.current && touchStartMid.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currentMid = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };

      const scale = currentDist / touchStartDist.current;
      setZoom((prev) => Math.max(15, Math.min(250, prev * scale)));
      touchStartDist.current = currentDist;

      setPan({
        x: touchStartPan.current.x + (currentMid.x - touchStartMid.current.x),
        y: touchStartPan.current.y + (currentMid.y - touchStartMid.current.y),
      });
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      const screenX = t.clientX - rect.left;
      const screenY = t.clientY - rect.top;
      const rawMeters = screenToMeters(screenX, screenY, canvas.width, canvas.height);
      setMouseMeters(rawMeters);

      if (draggedNodeId) {
        const updatedNodes = activeFloor.nodes.map((n) =>
          n.id === draggedNodeId ? { ...n, x: rawMeters.x, y: rawMeters.y } : n
        );
        onUpdateFloor({ ...activeFloor, nodes: updatedNodes });
      } else if (draggedObjectId) {
        const dx = rawMeters.x - dragStartMeters.x;
        const dy = rawMeters.y - dragStartMeters.y;
        const updatedObjects = activeFloor.objects.map((obj) =>
          obj.id === draggedObjectId ? { ...obj, x: obj.x + dx, y: obj.y + dy } : obj
        );
        setDragStartMeters(rawMeters);
        onUpdateFloor({ ...activeFloor, objects: updatedObjects });
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    touchStartMid.current = null;
    setDraggedNodeId(null);
    setDraggedObjectId(null);
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(60);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#0f1218] touch-none">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          isPanning ? 'cursor-grabbing' : activeTool === 'wall' ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Top Floating View Controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-1.5 bg-[#181d26]/90 border border-slate-700/60 rounded-lg p-1 sm:p-1.5 shadow-xl text-xs text-slate-300 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(250, z * 1.2))}
          className="p-1 sm:p-1.5 hover:bg-slate-700/50 rounded hover:text-white transition"
          title="Zoom In"
        >
          <Plus size={15} />
        </button>
        <span className="px-1 font-mono text-[10px] sm:text-[11px] text-slate-400">
          {Math.round((zoom / 60) * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(15, z / 1.2))}
          className="p-1 sm:p-1.5 hover:bg-slate-700/50 rounded hover:text-white transition"
          title="Zoom Out"
        >
          <Minus size={15} />
        </button>
        <div className="w-[1px] h-3 sm:h-4 bg-slate-700 mx-0.5" />
        <button
          onClick={resetView}
          className="p-1 sm:p-1.5 hover:bg-slate-700/50 rounded hover:text-white transition"
          title="Reset View"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Bottom Status & Coordinate Readout Bar (Responsive) */}
      <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-4 sm:right-4 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 z-10">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#181d26]/95 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] sm:text-xs text-slate-300 shadow-lg max-w-full truncate">
          <Info size={13} className="text-sky-400 shrink-0" />
          <span className="truncate">
            {activeTool === 'wall'
              ? wallStartPos
                ? 'Tap next point for wall. Esc to finish.'
                : 'Tap to begin drawing wall.'
              : activeTool === 'door'
              ? 'Tap any wall to insert door.'
              : activeTool === 'window'
              ? 'Tap any wall to insert window.'
              : activeTool === 'room'
              ? `Corners: ${roomNodeSequence.length} selected. Tap 1st to close.`
              : activeTool === 'measure'
              ? 'Tap 2 points to measure.'
              : 'Select tool: Tap to select, drag to reposition.'}
          </span>
        </div>

        <div className="pointer-events-auto hidden xs:flex items-center gap-2 sm:gap-3 bg-[#181d26]/95 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-mono text-slate-400 shadow-lg">
          <span>X: <strong className="text-slate-200">{mouseMeters.x.toFixed(2)}m</strong></span>
          <span>Y: <strong className="text-slate-200">{mouseMeters.y.toFixed(2)}m</strong></span>
        </div>
      </div>
    </div>
  );
};
