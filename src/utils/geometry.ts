/**
 * 2D Geometry and CAD spatial calculation utilities
 */
import { Point2D, WallNode } from '../types/cad';

export function distance2D(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function lineAngleDeg(p1: Point2D, p2: Point2D): number {
  const rad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function closestPointOnSegment(p: Point2D, a: Point2D, b: Point2D): { point: Point2D; t: number; distance: number } {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) {
    return { point: { ...a }, t: 0, distance: distance2D(p, a) };
  }
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  let t = (apx * abx + apy * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj: Point2D = {
    x: a.x + t * abx,
    y: a.y + t * aby,
  };
  return {
    point: proj,
    t,
    distance: distance2D(p, proj),
  };
}

export function polygonArea(points: Point2D[]): number {
  let area = 0;
  const n = points.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export function polygonCentroid(points: Point2D[]): Point2D {
  let cx = 0;
  let cy = 0;
  let signedArea = 0;
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return { ...points[0] };
  if (n === 2) return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = points[i].x * points[j].y - points[j].x * points[i].y;
    signedArea += a;
    cx += (points[i].x + points[j].x) * a;
    cy += (points[i].y + points[j].y) * a;
  }
  signedArea *= 0.5;
  if (Math.abs(signedArea) < 0.0001) {
    // fallback arithmetic mean
    let sx = 0;
    let sy = 0;
    points.forEach((p) => {
      sx += p.x;
      sy += p.y;
    });
    return { x: sx / n, y: sy / n };
  }
  cx /= 6 * signedArea;
  cy /= 6 * signedArea;
  return { x: cx, y: cy };
}

export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findConnectingNode(nodes: WallNode[], pt: Point2D, threshold = 0.25): WallNode | null {
  for (const node of nodes) {
    if (distance2D({ x: node.x, y: node.y }, pt) <= threshold) {
      return node;
    }
  }
  return null;
}
