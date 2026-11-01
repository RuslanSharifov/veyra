/**
 * Unit conversion and measurement display utilities
 */
import { UnitType, Point2D } from '../types/cad';

// Internal canonical unit is METERS
export function formatMeasurement(meters: number, unit: UnitType, showUnit = true): string {
  let val: number;
  let unitStr: string;

  switch (unit) {
    case 'mm':
      val = Math.round(meters * 1000);
      unitStr = showUnit ? ' mm' : '';
      return `${val}${unitStr}`;
    case 'cm':
      val = Math.round(meters * 100 * 10) / 10;
      unitStr = showUnit ? ' cm' : '';
      return `${val.toFixed(1)}${unitStr}`;
    case 'm':
    default:
      val = Math.round(meters * 100) / 100;
      unitStr = showUnit ? ' m' : '';
      return `${val.toFixed(2)}${unitStr}`;
  }
}

export function parseMeasurementToMeters(input: string, currentUnit: UnitType): number | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  // Check if unit is in string
  let val = parseFloat(clean);
  if (isNaN(val)) return null;

  if (clean.endsWith('mm')) {
    return val / 1000;
  } else if (clean.endsWith('cm')) {
    return val / 100;
  } else if (clean.endsWith('m')) {
    return val;
  }

  // fallback to currentUnit
  switch (currentUnit) {
    case 'mm':
      return val / 1000;
    case 'cm':
      return val / 100;
    case 'm':
    default:
      return val;
  }
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(pt: Point2D, gridSize: number): Point2D {
  return {
    x: snapToGrid(pt.x, gridSize),
    y: snapToGrid(pt.y, gridSize),
  };
}

export function snapAngle(start: Point2D, current: Point2D, snapIntervalDeg = 15): Point2D {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.05) return current;

  let angleRad = Math.atan2(dy, dx);
  let angleDeg = (angleRad * 180) / Math.PI;

  const snappedDeg = Math.round(angleDeg / snapIntervalDeg) * snapIntervalDeg;
  const snappedRad = (snappedDeg * Math.PI) / 180;

  return {
    x: start.x + Math.cos(snappedRad) * dist,
    y: start.y + Math.sin(snappedRad) * dist,
  };
}
