/**
 * Home Studio 3D - Architectural CAD & 3D Project Types
 */

export type UnitType = 'm' | 'cm' | 'mm';

export type ViewMode = '2d' | '3d' | 'split';

export type ToolType = 
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'furniture'
  | 'measure';

export type CameraPreset = 'perspective' | 'top' | 'isometric' | 'front' | 'dollhouse';

export interface Point2D {
  x: number; // in meters
  y: number; // in meters (corresponds to -z in 3D)
}

export interface WallNode {
  id: string;
  x: number; // meters
  y: number; // meters
}

export interface WallOpening {
  id: string;
  type: 'door' | 'window' | 'opening';
  subType?: 'single' | 'double' | 'sliding' | 'pocket' | 'picture' | 'bay' | 'standard';
  distFromStart: number; // distance in meters from start node
  width: number; // meters (e.g. 0.9m)
  height: number; // meters (e.g. 2.1m for door, 1.2m for window)
  elevation: number; // meters from floor (0 for door, ~0.9m for window)
  flipped?: boolean; // swing inside/outside
}

export interface Wall {
  id: string;
  startNodeId: string;
  endNodeId: string;
  thickness: number; // meters (e.g. 0.2m exterior, 0.12m interior)
  height: number; // meters (e.g. 2.8m)
  color?: string; // hex
  texture?: 'matte_white' | 'concrete' | 'brick' | 'warm_wood' | 'dark_slate';
  openings: WallOpening[];
}

export type FloorFinish = 'parquet_oak' | 'polished_concrete' | 'marble_tile' | 'dark_wood' | 'terrazzo' | 'carpet_gray';

export interface Room {
  id: string;
  name: string;
  nodeIds: string[]; // perimeter wall nodes in sequence
  floorFinish: FloorFinish;
  ceilingColor?: string;
  color?: string; // 2D floor tint
}

export interface ObjectInstance {
  id: string;
  catalogId: string;
  name: string;
  category: string;
  x: number; // meters
  y: number; // meters (maps to -z in 3D)
  z: number; // height offset from floor slab (meters)
  rotation: number; // degrees (0-360)
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  color?: string;
  material?: 'wood' | 'fabric' | 'metal' | 'glass' | 'leather' | 'marble';
  isCustom?: boolean;
}

export interface Floor {
  id: string;
  name: string;
  elevation: number; // meters (e.g. 0, 2.8, 5.6)
  height: number; // ceiling height (e.g. 2.8)
  visibleIn3D: boolean;
  nodes: WallNode[];
  walls: Wall[];
  rooms: Room[];
  objects: ObjectInstance[];
}

export interface CameraKeyframe {
  id: string;
  time: number; // seconds (0 to totalDuration)
  position: [number, number, number]; // x, y, z
  target: [number, number, number]; // lookAt target
  fov?: number;
}

export interface ProjectSettings {
  unit: UnitType;
  gridSnap: boolean;
  gridSize: number; // meters (e.g. 0.1, 0.25, 0.5, 1.0)
  angleSnap: boolean; // snap to 15, 45, 90 deg
  sunElevation: number; // degrees (10 to 85)
  sunAzimuth: number; // degrees (0 to 360)
  showCeilingsIn3D: boolean;
  wallCutHeight: number; // dollhouse cut height (meters, 0 = no cut)
  ghostLowerFloor: boolean; // show underlay in 2D
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt: string;
  thumbnailColor?: string;
  version: string;
  settings: ProjectSettings;
  activeFloorId: string;
  floors: Floor[];
  cameraKeyframes: CameraKeyframe[];
  animationDuration: number; // seconds
}

export type SelectionType = 
  | { type: 'wall'; id: string }
  | { type: 'node'; id: string }
  | { type: 'opening'; wallId: string; openingId: string }
  | { type: 'object'; id: string }
  | { type: 'room'; id: string }
  | null;
