/**
 * Three.js Real-time 3D Architectural Viewport
 * Features:
 * - Procedural wall extrusion with door/window lintel & sill cutouts
 * - PBR floor slabs, ceilings, and multi-floor stacking
 * - Studio PBR lighting with soft shadows & RoomEnvironment reflections
 * - Multiple camera modes: Orbit, Top, Isometric, Front, and First-Person Walkthrough (WASD)
 * - Camera keyframe walkthrough animation interpolation
 * - Raycast object picking & selection
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Project, Floor, CameraPreset, SelectionType } from '../../types/cad';
import { distance2D } from '../../utils/geometry';
import { FURNITURE_CATALOG } from '../../data/furnitureCatalog';
import { 
  Compass, Eye, Play, Pause, Video, 
  RotateCcw, Sparkles, Navigation, Layers,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Canvas3DProps {
  project: Project;
  activeFloor: Floor;
  selection: SelectionType;
  onSelect: (sel: SelectionType) => void;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
  isPlayingAnimation?: boolean;
  currentAnimationTime?: number; // seconds
}

export const Canvas3D: React.FC<Canvas3DProps> = ({
  project,
  activeFloor,
  selection,
  onSelect,
  cameraPreset,
  onCameraPresetChange,
  isPlayingAnimation = false,
  currentAnimationTime = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // First-person Walkthrough State
  const [isWalkthrough, setIsWalkthrough] = useState(false);
  const walkthroughKeys = useRef<{ [k: string]: boolean }>({});
  const walkthroughYaw = useRef(0);
  const walkthroughPitch = useRef(0);
  const isPointerLocked = useRef(false);

  // Setup Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1117);
    scene.fog = new THREE.FogExp2(0x0f1117, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 14);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. RoomEnvironment for Studio PBR Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.7);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    sunLight.position.set(15, 25, 20);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Warm interior fill
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-15, 12, -15);
    scene.add(fillLight);

    // Ground plane with subtle grid
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e14,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(60, 60, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // 6. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below ground in orbit
    controls.minDistance = 1;
    controls.maxDistance = 120;
    controlsRef.current = controls;

    // 7. Animation / Render Loop
    let lastTime = performance.now();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Handle First-person Walkthrough movement
      if (isWalkthrough && cameraRef.current) {
        const moveSpeed = 4.5 * delta;
        const cam = cameraRef.current;
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, walkthroughYaw.current, 0));
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, walkthroughYaw.current, 0));

        if (walkthroughKeys.current['KeyW'] || walkthroughKeys.current['ArrowUp']) {
          cam.position.addScaledVector(forward, moveSpeed);
        }
        if (walkthroughKeys.current['KeyS'] || walkthroughKeys.current['ArrowDown']) {
          cam.position.addScaledVector(forward, -moveSpeed);
        }
        if (walkthroughKeys.current['KeyA'] || walkthroughKeys.current['ArrowLeft']) {
          cam.position.addScaledVector(right, -moveSpeed);
        }
        if (walkthroughKeys.current['KeyD'] || walkthroughKeys.current['ArrowRight']) {
          cam.position.addScaledVector(right, moveSpeed);
        }

        // Keep eye level at active floor + 1.65m
        cam.position.y = activeFloor.elevation + 1.65;

        // Apply mouse look
        const lookDir = new THREE.Vector3(
          Math.sin(walkthroughYaw.current) * Math.cos(walkthroughPitch.current),
          Math.sin(walkthroughPitch.current),
          -Math.cos(walkthroughYaw.current) * Math.cos(walkthroughPitch.current)
        );
        cam.lookAt(cam.position.clone().add(lookDir));
      } else {
        controls.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Scene Architectural Geometry when Project changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous architectural root
    const oldGroup = scene.getObjectByName('ARCH_ROOT');
    if (oldGroup) scene.remove(oldGroup);

    const archRoot = new THREE.Group();
    archRoot.name = 'ARCH_ROOT';

    // Materials Library
    const wallExteriorMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.65,
      metalness: 0.05,
    });
    const wallInteriorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.75,
      metalness: 0.02,
    });
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const windowGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.92,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      ior: 1.52,
    });
    const doorWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3e2c1e,
      roughness: 0.5,
      metalness: 0.05,
    });
    const doorHandleMat = new THREE.MeshStandardMaterial({
      color: 0xc89e37,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Floor finish materials
    const floorMaterials: Record<string, THREE.Material> = {
      parquet_oak: new THREE.MeshStandardMaterial({
        color: 0xb58a63,
        roughness: 0.45,
        metalness: 0.05,
      }),
      dark_wood: new THREE.MeshStandardMaterial({
        color: 0x3d281a,
        roughness: 0.5,
        metalness: 0.05,
      }),
      marble_tile: new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.15,
        metalness: 0.1,
      }),
      polished_concrete: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.3,
        metalness: 0.15,
      }),
      terrazzo: new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        roughness: 0.25,
        metalness: 0.05,
      }),
      carpet_gray: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.9,
        metalness: 0.0,
      }),
    };

    // Build each visible floor
    project.floors.forEach((floor) => {
      if (!floor.visibleIn3D) return;

      const floorGroup = new THREE.Group();
      floorGroup.name = `FLOOR_${floor.id}`;
      const nodeMap = new Map(floor.nodes.map((n) => [n.id, n]));

      // 1. Build Room Slabs / Floors
      floor.rooms.forEach((room) => {
        const pts = room.nodeIds
          .map((id) => nodeMap.get(id))
          .filter((n): n is NonNullable<typeof n> => Boolean(n));
        if (pts.length < 3) return;

        const shape = new THREE.Shape();
        shape.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          shape.lineTo(pts[i].x, pts[i].y);
        }
        shape.closePath();

        const slabGeo = new THREE.ShapeGeometry(shape);
        const slabMat = floorMaterials[room.floorFinish] || floorMaterials.parquet_oak;
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.rotation.x = -Math.PI / 2; // Orient horizontally
        slab.position.y = floor.elevation + 0.005; // slight offset above foundation
        slab.receiveShadow = true;
        slab.userData = { type: 'room', id: room.id };
        floorGroup.add(slab);

        // Ceiling if enabled
        if (project.settings.showCeilingsIn3D) {
          const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
          const ceiling = new THREE.Mesh(slabGeo, ceilingMat);
          ceiling.rotation.x = -Math.PI / 2;
          ceiling.position.y = floor.elevation + floor.height;
          floorGroup.add(ceiling);
        }
      });

      // 2. Build Extruded Walls with Architectural Openings
      floor.walls.forEach((wall) => {
        const n1 = nodeMap.get(wall.startNodeId);
        const n2 = nodeMap.get(wall.endNodeId);
        if (!n1 || !n2) return;

        const wallLen = distance2D(n1, n2);
        if (wallLen <= 0.05) return;

        const wallHeight = project.settings.wallCutHeight > 0 
          ? Math.min(wall.height, project.settings.wallCutHeight)
          : wall.height;

        const wallMat = wall.thickness >= 0.2 ? wallExteriorMat : wallInteriorMat;

        // Wall angle and direction vectors
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        const wallGroup = new THREE.Group();
        wallGroup.position.set(n1.x, floor.elevation, -n1.y);
        wallGroup.rotation.y = angle;

        // If no openings, single clean extruded wall box
        if (wall.openings.length === 0) {
          const wGeo = new THREE.BoxGeometry(wallLen, wallHeight, wall.thickness);
          const wMesh = new THREE.Mesh(wGeo, wallMat);
          wMesh.position.set(wallLen / 2, wallHeight / 2, 0);
          wMesh.castShadow = true;
          wMesh.receiveShadow = true;
          wMesh.userData = { type: 'wall', id: wall.id };
          wallGroup.add(wMesh);
        } else {
          // Sort openings by distance along wall
          const sortedOps = [...wall.openings].sort((a, b) => a.distFromStart - b.distFromStart);
          let currentDist = 0;

          sortedOps.forEach((op) => {
            const opStart = Math.max(0, op.distFromStart);
            const opEnd = Math.min(wallLen, op.distFromStart + op.width);
            const opW = opEnd - opStart;

            // 1. Left solid segment before opening
            if (opStart > currentDist) {
              const segW = opStart - currentDist;
              const segGeo = new THREE.BoxGeometry(segW, wallHeight, wall.thickness);
              const segMesh = new THREE.Mesh(segGeo, wallMat);
              segMesh.position.set(currentDist + segW / 2, wallHeight / 2, 0);
              segMesh.castShadow = true;
              segMesh.receiveShadow = true;
              wallGroup.add(segMesh);
            }

            // 2. Sill segment below window (if elevation > 0)
            if (op.elevation > 0) {
              const sillH = Math.min(op.elevation, wallHeight);
              const sillGeo = new THREE.BoxGeometry(opW, sillH, wall.thickness);
              const sillMesh = new THREE.Mesh(sillGeo, wallMat);
              sillMesh.position.set(opStart + opW / 2, sillH / 2, 0);
              sillMesh.castShadow = true;
              sillMesh.receiveShadow = true;
              wallGroup.add(sillMesh);
            }

            // 3. Lintel segment above opening (if opening top < wall height)
            const opTop = op.elevation + op.height;
            if (opTop < wallHeight) {
              const lintelH = wallHeight - opTop;
              const lintelGeo = new THREE.BoxGeometry(opW, lintelH, wall.thickness);
              const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
              lintelMesh.position.set(opStart + opW / 2, opTop + lintelH / 2, 0);
              lintelMesh.castShadow = true;
              lintelMesh.receiveShadow = true;
              wallGroup.add(lintelMesh);
            }

            // 4. Detailed 3D Door or Window object inside opening
            const midOpX = opStart + opW / 2;
            const midOpY = op.elevation + op.height / 2;

            if (op.type === 'window') {
              // Frame
              const frameGeo = new THREE.BoxGeometry(opW, op.height, wall.thickness * 1.05);
              const frameEdges = new THREE.EdgesGeometry(frameGeo);
              const frameMesh = new THREE.LineSegments(frameEdges, new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 2 }));
              frameMesh.position.set(midOpX, midOpY, 0);
              wallGroup.add(frameMesh);

              // Glass pane
              const glassGeo = new THREE.BoxGeometry(opW - 0.08, op.height - 0.08, 0.02);
              const glassMesh = new THREE.Mesh(glassGeo, windowGlassMat);
              glassMesh.position.set(midOpX, midOpY, 0);
              wallGroup.add(glassMesh);

              // Mullion bar in center
              const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, op.height - 0.08, 0.04), windowFrameMat);
              mullion.position.set(midOpX, midOpY, 0);
              wallGroup.add(mullion);
            } else if (op.type === 'door') {
              // Frame
              const frameGeo = new THREE.BoxGeometry(opW, op.height, wall.thickness);
              const frameMesh = new THREE.Mesh(frameGeo, windowFrameMat);
              frameMesh.position.set(midOpX, midOpY, 0);
              frameMesh.scale.set(1.02, 1.02, 1.02);
              // Door leaf panel
              const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(opW - 0.06, op.height - 0.04, 0.05), doorWoodMat);
              doorPanel.position.set(midOpX, midOpY, 0);
              doorPanel.castShadow = true;
              wallGroup.add(doorPanel);

              // Brass Lever Handle
              const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.08), doorHandleMat);
              handle.position.set(midOpX + (opW / 2 - 0.12), 1.0, 0.04);
              wallGroup.add(handle);
            }

            currentDist = opEnd;
          });

          // Final solid segment after last opening
          if (currentDist < wallLen) {
            const segW = wallLen - currentDist;
            const segGeo = new THREE.BoxGeometry(segW, wallHeight, wall.thickness);
            const segMesh = new THREE.Mesh(segGeo, wallMat);
            segMesh.position.set(currentDist + segW / 2, wallHeight / 2, 0);
            segMesh.castShadow = true;
            segMesh.receiveShadow = true;
            wallGroup.add(segMesh);
          }
        }

        floorGroup.add(wallGroup);
      });

      // 3. Build Furniture and Fixtures
      floor.objects.forEach((obj) => {
        const catalogItem = FURNITURE_CATALOG.find((item) => item.id === obj.catalogId);
        let meshGroup: THREE.Group;

        if (catalogItem) {
          meshGroup = catalogItem.create3DModel(
            obj.color || catalogItem.defaultColor,
            obj.material || catalogItem.materialType,
            obj.width,
            obj.depth,
            obj.height
          );
        } else {
          // Custom / fallback procedural object
          meshGroup = new THREE.Group();
          const fallbackMat = new THREE.MeshStandardMaterial({
            color: obj.color ? new THREE.Color(obj.color) : 0x3b82f6,
            roughness: 0.5,
          });
          const box = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height, obj.depth), fallbackMat);
          box.position.y = obj.height / 2;
          box.castShadow = true;
          meshGroup.add(box);
        }

        meshGroup.position.set(obj.x, floor.elevation + (obj.z || 0), -obj.y);
        meshGroup.rotation.y = (obj.rotation * Math.PI) / 180;
        meshGroup.userData = { type: 'object', id: obj.id };

        // Selection highlight ring
        if (selection?.type === 'object' && selection.id === obj.id) {
          const highlightRing = new THREE.Mesh(
            new THREE.RingGeometry(Math.max(obj.width, obj.depth) * 0.6, Math.max(obj.width, obj.depth) * 0.65, 32),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
          );
          highlightRing.rotation.x = -Math.PI / 2;
          highlightRing.position.y = 0.02;
          meshGroup.add(highlightRing);
        }

        floorGroup.add(meshGroup);
      });

      archRoot.add(floorGroup);
    });

    scene.add(archRoot);
  }, [project, selection]);

  // Camera Presets Switcher
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || isWalkthrough) return;

    switch (cameraPreset) {
      case 'top':
        camera.position.set(0, 30, 0.001);
        controls.target.set(0, 0, 0);
        break;
      case 'isometric':
        camera.position.set(16, 16, 16);
        controls.target.set(0, 1, 0);
        break;
      case 'front':
        camera.position.set(0, 2, 22);
        controls.target.set(0, 2, 0);
        break;
      case 'dollhouse':
        camera.position.set(8, 14, 12);
        controls.target.set(0, 1, 0);
        break;
      case 'perspective':
      default:
        camera.position.set(10, 8, 12);
        controls.target.set(0, 1, 0);
        break;
    }
    camera.lookAt(controls.target);
    controls.update();
  }, [cameraPreset, isWalkthrough]);

  // Keyframe Camera Animation Interpolation
  useEffect(() => {
    if (!isPlayingAnimation || project.cameraKeyframes.length < 2) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Build CatmullRom spline from keyframes
    const kfs = [...project.cameraKeyframes].sort((a, b) => a.time - b.time);
    const posPoints = kfs.map((k) => new THREE.Vector3(...k.position));
    const targetPoints = kfs.map((k) => new THREE.Vector3(...k.target));

    const posCurve = new THREE.CatmullRomCurve3(posPoints);
    const targetCurve = new THREE.CatmullRomCurve3(targetPoints);

    const progress = Math.min(1, Math.max(0, currentAnimationTime / project.animationDuration));
    const currentPos = posCurve.getPoint(progress);
    const currentTarget = targetCurve.getPoint(progress);

    camera.position.copy(currentPos);
    controls.target.copy(currentTarget);
    camera.lookAt(currentTarget);
    controls.update();
  }, [isPlayingAnimation, currentAnimationTime, project.cameraKeyframes, project.animationDuration]);

  // Keyboard controls for First-person Walkthrough
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      walkthroughKeys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      walkthroughKeys.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const toggleWalkthrough = () => {
    const nextState = !isWalkthrough;
    setIsWalkthrough(nextState);
    if (controlsRef.current) {
      controlsRef.current.enabled = !nextState;
    }
    if (nextState && cameraRef.current) {
      cameraRef.current.position.set(0, activeFloor.elevation + 1.65, 4);
      walkthroughYaw.current = 0;
      walkthroughPitch.current = 0;
    }
  };

  const handlePointerLock = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isWalkthrough) return;
    const dom = rendererRef.current?.domElement;
    if (dom && !document.pointerLockElement) {
      dom.requestPointerLock?.();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isWalkthrough || !document.pointerLockElement) return;
      const sensitivity = 0.0025;
      walkthroughYaw.current -= e.movementX * sensitivity;
      walkthroughPitch.current -= e.movementY * sensitivity;
      walkthroughPitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, walkthroughPitch.current));
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isWalkthrough]);

  return (
    <div
      ref={mountRef}
      onClick={handlePointerLock}
      className="relative w-full h-full overflow-hidden bg-[#0f1117] select-none cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Top Camera Preset Dock - Responsive with horizontal scroll */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1 sm:gap-1.5 bg-[#181d26]/90 border border-slate-700/60 rounded-lg p-1 sm:p-1.5 shadow-xl text-xs text-slate-300 max-w-[calc(100vw-16px)] overflow-x-auto z-10">
        <button
          onClick={() => {
            setIsWalkthrough(false);
            if (controlsRef.current) controlsRef.current.enabled = true;
            onCameraPresetChange('perspective');
          }}
          className={`px-2 sm:px-2.5 py-1 rounded transition whitespace-nowrap text-[11px] sm:text-xs ${
            !isWalkthrough && cameraPreset === 'perspective'
              ? 'bg-sky-500 text-white font-medium shadow'
              : 'hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          Perspective
        </button>
        <button
          onClick={() => {
            setIsWalkthrough(false);
            if (controlsRef.current) controlsRef.current.enabled = true;
            onCameraPresetChange('top');
          }}
          className={`px-2 sm:px-2.5 py-1 rounded transition whitespace-nowrap text-[11px] sm:text-xs ${
            !isWalkthrough && cameraPreset === 'top'
              ? 'bg-sky-500 text-white font-medium shadow'
              : 'hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          Top 3D
        </button>
        <button
          onClick={() => {
            setIsWalkthrough(false);
            if (controlsRef.current) controlsRef.current.enabled = true;
            onCameraPresetChange('isometric');
          }}
          className={`px-2 sm:px-2.5 py-1 rounded transition whitespace-nowrap text-[11px] sm:text-xs ${
            !isWalkthrough && cameraPreset === 'isometric'
              ? 'bg-sky-500 text-white font-medium shadow'
              : 'hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          Isometric
        </button>
        <button
          onClick={() => {
            setIsWalkthrough(false);
            if (controlsRef.current) controlsRef.current.enabled = true;
            onCameraPresetChange('dollhouse');
          }}
          className={`px-2 sm:px-2.5 py-1 rounded transition whitespace-nowrap text-[11px] sm:text-xs ${
            !isWalkthrough && cameraPreset === 'dollhouse'
              ? 'bg-sky-500 text-white font-medium shadow'
              : 'hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          Dollhouse
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5 sm:mx-1 shrink-0" />
        <button
          onClick={toggleWalkthrough}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded transition whitespace-nowrap text-[11px] sm:text-xs ${
            isWalkthrough
              ? 'bg-emerald-600 text-white font-medium shadow'
              : 'hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          <Navigation size={13} />
          <span>Walk Mode</span>
        </button>
      </div>

      {/* Walkthrough Mode HUD Helper & Mobile Touch D-Pad */}
      {isWalkthrough && (
        <>
          <div className="absolute top-14 left-2 sm:left-4 bg-emerald-950/85 border border-emerald-500/40 rounded-lg p-2 sm:p-2.5 text-[11px] sm:text-xs text-emerald-200 backdrop-blur shadow-xl pointer-events-none z-10 max-w-[280px]">
            <div className="font-semibold mb-0.5 flex items-center gap-1.5 text-white">
              <Eye size={13} /> Walkthrough Mode Active
            </div>
            <div className="hidden sm:block text-[11px] text-emerald-300">
              • Use <strong className="text-white">WASD</strong> to walk
            </div>
            <div className="sm:hidden text-[10px] text-emerald-300">
              • Use on-screen controls to walk
            </div>
          </div>

          {/* On-Screen Mobile Touch D-Pad for Walkthrough */}
          <div className="absolute bottom-16 left-4 flex flex-col items-center gap-1 z-20 select-none bg-slate-900/80 p-2 rounded-2xl border border-slate-700/60 backdrop-blur shadow-2xl">
            <button
              onMouseDown={() => (walkthroughKeys.current['KeyW'] = true)}
              onMouseUp={() => (walkthroughKeys.current['KeyW'] = false)}
              onTouchStart={() => (walkthroughKeys.current['KeyW'] = true)}
              onTouchEnd={() => (walkthroughKeys.current['KeyW'] = false)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 text-slate-200 flex items-center justify-center shadow transition active:scale-95"
              aria-label="Walk Forward"
            >
              <ChevronUp size={22} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onMouseDown={() => (walkthroughKeys.current['KeyA'] = true)}
                onMouseUp={() => (walkthroughKeys.current['KeyA'] = false)}
                onTouchStart={() => (walkthroughKeys.current['KeyA'] = true)}
                onTouchEnd={() => (walkthroughKeys.current['KeyA'] = false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 text-slate-200 flex items-center justify-center shadow transition active:scale-95"
                aria-label="Walk Left"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                MOVE
              </div>
              <button
                onMouseDown={() => (walkthroughKeys.current['KeyD'] = true)}
                onMouseUp={() => (walkthroughKeys.current['KeyD'] = false)}
                onTouchStart={() => (walkthroughKeys.current['KeyD'] = true)}
                onTouchEnd={() => (walkthroughKeys.current['KeyD'] = false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 text-slate-200 flex items-center justify-center shadow transition active:scale-95"
                aria-label="Walk Right"
              >
                <ChevronRight size={22} />
              </button>
            </div>
            <button
              onMouseDown={() => (walkthroughKeys.current['KeyS'] = true)}
              onMouseUp={() => (walkthroughKeys.current['KeyS'] = false)}
              onTouchStart={() => (walkthroughKeys.current['KeyS'] = true)}
              onTouchEnd={() => (walkthroughKeys.current['KeyS'] = false)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 text-slate-200 flex items-center justify-center shadow transition active:scale-95"
              aria-label="Walk Backward"
            >
              <ChevronDown size={22} />
            </button>
          </div>

          {/* Look-Around Touch Swipe Area on Right for Mobile */}
          <div
            className="absolute bottom-16 right-4 w-28 h-28 rounded-2xl bg-slate-900/60 border border-slate-700/40 backdrop-blur flex flex-col items-center justify-center text-[10px] text-slate-400 z-20 select-none touch-none"
            onTouchMove={(e) => {
              if (e.touches.length > 0) {
                // Smooth look around
                const touch = e.touches[0];
                const deltaX = touch.clientX - (touch as any)._lastX || 0;
                const deltaY = touch.clientY - (touch as any)._lastY || 0;
                (touch as any)._lastX = touch.clientX;
                (touch as any)._lastY = touch.clientY;
                if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) {
                  walkthroughYaw.current -= deltaX * 0.015;
                  walkthroughPitch.current -= deltaY * 0.015;
                  walkthroughPitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, walkthroughPitch.current));
                }
              }
            }}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                (e.touches[0] as any)._lastX = e.touches[0].clientX;
                (e.touches[0] as any)._lastY = e.touches[0].clientY;
              }
            }}
          >
            <Compass size={22} className="text-sky-400 mb-1" />
            <span>Drag to Look</span>
          </div>
        </>
      )}
    </div>
  );
};
