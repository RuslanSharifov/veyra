/**
 * Object and Furniture Catalog with Procedural 3D Generators
 * Generates modular 3-12 part Three.js meshes with rich PBR materials
 */
import * as THREE from 'three';

export interface CatalogItem {
  id: string;
  name: string;
  category: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'architectural' | 'decor';
  width: number; // meters (X)
  depth: number; // meters (Z)
  height: number; // meters (Y)
  defaultColor: string;
  materialType: 'wood' | 'fabric' | 'metal' | 'glass' | 'leather' | 'marble';
  icon: string; // descriptive icon tag
  description: string;
  create3DModel: (color: string, materialType: string, width: number, depth: number, height: number) => THREE.Group;
}

// Material generator helper
function getCatalogMaterial(type: string, colorHex: string): THREE.Material {
  const col = new THREE.Color(colorHex);
  switch (type) {
    case 'wood':
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.65,
        metalness: 0.05,
      });
    case 'fabric':
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.85,
        metalness: 0.0,
      });
    case 'leather':
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.45,
        metalness: 0.1,
      });
    case 'metal':
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.25,
        metalness: 0.85,
      });
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        transparent: true,
        opacity: 0.4,
        roughness: 0.05,
        ior: 1.5,
      });
    case 'marble':
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.2,
        metalness: 0.05,
      });
    default:
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.5,
        metalness: 0.1,
      });
  }
}

export const FURNITURE_CATALOG: CatalogItem[] = [
  // --- LIVING ROOM ---
  {
    id: 'sofa_modern_3seat',
    name: 'Modern 3-Seater Sofa',
    category: 'living',
    width: 2.2,
    depth: 0.9,
    height: 0.78,
    defaultColor: '#3a3f4d',
    materialType: 'fabric',
    icon: 'Armchair',
    description: 'Minimalist contemporary 3-seater sofa with tufted cushions and tapered oak legs.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const seatMat = getCatalogMaterial(matType, color);
      const legMat = getCatalogMaterial('wood', '#221914');
      const accentMat = getCatalogMaterial('fabric', '#525a6c');

      // Base frame
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), seatMat);
      base.position.y = 0.22;
      base.castShadow = true;
      group.add(base);

      // 3 Cushions
      const cushionW = (w - 0.2) / 3;
      for (let i = 0; i < 3; i++) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(cushionW - 0.02, 0.14, d - 0.2), accentMat);
        cushion.position.set(-w / 2 + 0.1 + cushionW * (i + 0.5), 0.38, 0.06);
        cushion.castShadow = true;
        group.add(cushion);
      }

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.3, 0.22), seatMat);
      back.position.set(0, h / 2 + 0.15, -d / 2 + 0.11);
      back.castShadow = true;
      group.add(back);

      // Armrests (left & right)
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, d), seatMat);
      armL.position.set(-w / 2 + 0.09, 0.42, 0);
      armL.castShadow = true;
      group.add(armL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, d), seatMat);
      armR.position.set(w / 2 - 0.09, 0.42, 0);
      armR.castShadow = true;
      group.add(armR);

      // 4 Tapered legs
      const legGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 8);
      const legPositions = [
        [-w / 2 + 0.1, 0.1, -d / 2 + 0.1],
        [w / 2 - 0.1, 0.1, -d / 2 + 0.1],
        [-w / 2 + 0.1, 0.1, d / 2 - 0.1],
        [w / 2 - 0.1, 0.1, d / 2 - 0.1],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        group.add(leg);
      });

      return group;
    },
  },
  {
    id: 'lounge_armchair',
    name: 'Architectural Lounge Chair',
    category: 'living',
    width: 0.9,
    depth: 0.85,
    height: 0.82,
    defaultColor: '#c27d38',
    materialType: 'leather',
    icon: 'Armchair',
    description: 'Mid-century cognac leather swivel lounge chair with curved walnut back.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const leatherMat = getCatalogMaterial(matType, color);
      const woodMat = getCatalogMaterial('wood', '#2c1e18');
      const metalMat = getCatalogMaterial('metal', '#111111');

      // Chrome star base
      const centerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 12), metalMat);
      centerPole.position.y = 0.1;
      group.add(centerPole);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.35), metalMat);
        foot.position.set(Math.sin(angle) * 0.18, 0.02, Math.cos(angle) * 0.18);
        foot.rotation.y = angle;
        group.add(foot);
      }

      // Shell back
      const shell = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, 0.05), woodMat);
      shell.position.set(0, 0.55, -d / 2 + 0.1);
      shell.rotation.x = 0.15;
      group.add(shell);

      // Seat cushion
      const seat = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.14, d * 0.75), leatherMat);
      seat.position.set(0, 0.27, 0);
      group.add(seat);

      // Back cushion
      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.45, 0.12), leatherMat);
      backCushion.position.set(0, 0.58, -d / 2 + 0.16);
      backCushion.rotation.x = 0.15;
      group.add(backCushion);

      return group;
    },
  },
  {
    id: 'coffee_table_marble',
    name: 'Marble Oval Coffee Table',
    category: 'living',
    width: 1.3,
    depth: 0.65,
    height: 0.42,
    defaultColor: '#f0ede6',
    materialType: 'marble',
    icon: 'Table',
    description: 'Carrara marble top coffee table with fluted cylindrical pedestal bases.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const marbleMat = getCatalogMaterial(matType, color);
      const brassMat = getCatalogMaterial('metal', '#bf9b30');

      // Top slab
      const topGeo = new THREE.CylinderGeometry(w / 2, w / 2, 0.035, 32);
      topGeo.scale(1, 1, d / w);
      const top = new THREE.Mesh(topGeo, marbleMat);
      top.position.y = h - 0.018;
      top.castShadow = true;
      group.add(top);

      // Two ribbed pillars
      const pillarGeo = new THREE.CylinderGeometry(0.14, 0.14, h - 0.035, 24);
      const p1 = new THREE.Mesh(pillarGeo, brassMat);
      p1.position.set(-w * 0.22, (h - 0.035) / 2, 0);
      p1.castShadow = true;
      group.add(p1);

      const p2 = new THREE.Mesh(pillarGeo, brassMat);
      p2.position.set(w * 0.22, (h - 0.035) / 2, 0);
      p2.castShadow = true;
      group.add(p2);

      return group;
    },
  },
  {
    id: 'media_console',
    name: 'Minimalist TV & Media Unit',
    category: 'living',
    width: 2.0,
    depth: 0.45,
    height: 0.5,
    defaultColor: '#2b231d',
    materialType: 'wood',
    icon: 'Tv',
    description: 'Floating low-profile entertainment credenza with slat slatted doors.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const woodMat = getCatalogMaterial(matType, color);
      const darkMat = getCatalogMaterial('metal', '#111111');
      const screenMat = getCatalogMaterial('metal', '#0a0a0c');

      // Credenza box
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.12, d), woodMat);
      box.position.y = (h - 0.12) / 2 + 0.12;
      box.castShadow = true;
      group.add(box);

      // Metal base frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.02, d * 0.8), darkMat);
      frame.position.y = 0.11;
      group.add(frame);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
      const offsets = [-w * 0.45, w * 0.45];
      offsets.forEach((ox) => {
        const legF = new THREE.Mesh(legGeo, darkMat);
        legF.position.set(ox, 0.06, d * 0.35);
        group.add(legF);
        const legB = new THREE.Mesh(legGeo, darkMat);
        legB.position.set(ox, 0.06, -d * 0.35);
        group.add(legB);
      });

      // Ultra-thin 65" TV on top
      const tvW = 1.45;
      const tvH = 0.85;
      const tvStand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.01, 0.22), darkMat);
      tvStand.position.set(0, h + 0.005, 0);
      group.add(tvStand);

      const tvStem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.02), darkMat);
      tvStem.position.set(0, h + 0.05, 0);
      group.add(tvStem);

      const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(tvW, tvH, 0.02), screenMat);
      tvScreen.position.set(0, h + 0.1 + tvH / 2, 0);
      tvScreen.castShadow = true;
      group.add(tvScreen);

      return group;
    },
  },

  // --- BEDROOM ---
  {
    id: 'bed_king_master',
    name: 'King Bed with Upholstered Headboard',
    category: 'bedroom',
    width: 2.1,
    depth: 2.2,
    height: 1.1,
    defaultColor: '#e2decb',
    materialType: 'fabric',
    icon: 'BedDouble',
    description: 'Plush platform bed with oversized wingback headboard and dual reading sconces.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const fabricMat = getCatalogMaterial(matType, color);
      const sheetMat = getCatalogMaterial('fabric', '#f8fafc');
      const woodMat = getCatalogMaterial('wood', '#382a20');
      const pillowMat = getCatalogMaterial('fabric', '#d1d5db');

      // Headboard
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h, 0.2), fabricMat);
      headboard.position.set(0, h / 2, -d / 2 + 0.1);
      headboard.castShadow = true;
      group.add(headboard);

      // Wooden platform base
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d - 0.2), woodMat);
      frame.position.set(0, 0.125, 0.1);
      frame.castShadow = true;
      group.add(frame);

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.3, d - 0.3), sheetMat);
      mattress.position.set(0, 0.38, 0.12);
      mattress.castShadow = true;
      group.add(mattress);

      // Duvet / Bedding folded
      const duvet = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.08, (d - 0.3) * 0.65), fabricMat);
      duvet.position.set(0, 0.54, 0.35);
      group.add(duvet);

      // 2 Pillows
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.4), pillowMat);
      p1.position.set(-0.45, 0.58, -d / 2 + 0.5);
      p1.rotation.x = 0.2;
      group.add(p1);

      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.4), pillowMat);
      p2.position.set(0.45, 0.58, -d / 2 + 0.5);
      p2.rotation.x = 0.2;
      group.add(p2);

      return group;
    },
  },
  {
    id: 'nightstand_modern',
    name: 'Floating Bedside Nightstand',
    category: 'bedroom',
    width: 0.55,
    depth: 0.45,
    height: 0.55,
    defaultColor: '#3a2d24',
    materialType: 'wood',
    icon: 'Square',
    description: 'Walnut 2-drawer nightstand with brass bar pulls.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const woodMat = getCatalogMaterial(matType, color);
      const brassMat = getCatalogMaterial('metal', '#c89e37');

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.15, d), woodMat);
      body.position.y = (h - 0.15) / 2 + 0.15;
      body.castShadow = true;
      group.add(body);

      // 4 slim legs
      const legGeo = new THREE.CylinderGeometry(0.015, 0.012, 0.15, 8);
      const legOffsets = [
        [-w * 0.4, 0.075, -d * 0.35],
        [w * 0.4, 0.075, -d * 0.35],
        [-w * 0.4, 0.075, d * 0.35],
        [w * 0.4, 0.075, d * 0.35],
      ];
      legOffsets.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, brassMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });

      // Drawer handles
      const handle1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.02), brassMat);
      handle1.position.set(0, h * 0.45, d / 2 + 0.01);
      group.add(handle1);

      const handle2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.02), brassMat);
      handle2.position.set(0, h * 0.75, d / 2 + 0.01);
      group.add(handle2);

      return group;
    },
  },
  {
    id: 'wardrobe_closet',
    name: 'Floor-to-Ceiling Wardrobe',
    category: 'bedroom',
    width: 1.8,
    depth: 0.65,
    height: 2.3,
    defaultColor: '#1e232a',
    materialType: 'wood',
    icon: 'Boxes',
    description: 'Architectural built-in wardrobe closet with tinted glass center door.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const woodMat = getCatalogMaterial(matType, color);
      const glassMat = getCatalogMaterial('glass', '#ffffff');
      const handleMat = getCatalogMaterial('metal', '#555555');

      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
      frame.position.y = h / 2;
      frame.castShadow = true;
      group.add(frame);

      // Glass door accent in center
      const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, h * 0.95, 0.01), glassMat);
      glassDoor.position.set(0, h / 2, d / 2 + 0.01);
      group.add(glassDoor);

      // Handles
      const hL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4), handleMat);
      hL.position.set(-w * 0.2, h * 0.5, d / 2 + 0.02);
      group.add(hL);

      const hR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4), handleMat);
      hR.position.set(w * 0.2, h * 0.5, d / 2 + 0.02);
      group.add(hR);

      return group;
    },
  },

  // --- KITCHEN & DINING ---
  {
    id: 'dining_table_set',
    name: 'Dining Table & 6 Designer Chairs',
    category: 'kitchen',
    width: 2.0,
    depth: 1.0,
    height: 0.76,
    defaultColor: '#2b2118',
    materialType: 'wood',
    icon: 'Utensils',
    description: 'Solid oak dining table with six sculpted minimalist dining chairs.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const woodMat = getCatalogMaterial(matType, color);
      const legMat = getCatalogMaterial('metal', '#1a1a1a');
      const chairMat = getCatalogMaterial('fabric', '#374151');

      // Tabletop
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), woodMat);
      top.position.y = h - 0.02;
      top.castShadow = true;
      group.add(top);

      // 4 Table legs
      const legGeo = new THREE.CylinderGeometry(0.025, 0.02, h - 0.04, 12);
      const offsets = [
        [-w / 2 + 0.1, (h - 0.04) / 2, -d / 2 + 0.1],
        [w / 2 - 0.1, (h - 0.04) / 2, -d / 2 + 0.1],
        [-w / 2 + 0.1, (h - 0.04) / 2, d / 2 - 0.1],
        [w / 2 - 0.1, (h - 0.04) / 2, d / 2 - 0.1],
      ];
      offsets.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });

      // 6 Chairs (3 on each side)
      const chairPositions = [
        [-0.6, 0, d / 2 + 0.25],
        [0, 0, d / 2 + 0.25],
        [0.6, 0, d / 2 + 0.25],
        [-0.6, 0, -d / 2 - 0.25],
        [0, 0, -d / 2 - 0.25],
        [0.6, 0, -d / 2 - 0.25],
      ];
      chairPositions.forEach(([cx, cy, cz], idx) => {
        const chair = new THREE.Group();
        const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), chairMat);
        cSeat.position.y = 0.45;
        chair.add(cSeat);

        const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.03), chairMat);
        cBack.position.set(0, 0.65, idx < 3 ? 0.2 : -0.2);
        chair.add(cBack);

        const cLegGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.45, 8);
        const lOffsets = [
          [-0.18, 0.225, -0.18],
          [0.18, 0.225, -0.18],
          [-0.18, 0.225, 0.18],
          [0.18, 0.225, 0.18],
        ];
        lOffsets.forEach(([lx, ly, lz]) => {
          const cl = new THREE.Mesh(cLegGeo, legMat);
          cl.position.set(lx, ly, lz);
          chair.add(cl);
        });

        chair.position.set(cx, cy, cz);
        group.add(chair);
      });

      return group;
    },
  },
  {
    id: 'kitchen_island',
    name: 'Kitchen Island with Waterfall Marble',
    category: 'kitchen',
    width: 2.4,
    depth: 1.0,
    height: 0.92,
    defaultColor: '#f5f5f4',
    materialType: 'marble',
    icon: 'Layers',
    description: 'Calacatta marble waterfall counter with built-in induction cooktop and dark oak cabinetry.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const marbleMat = getCatalogMaterial(matType, color);
      const woodMat = getCatalogMaterial('wood', '#1c1917');
      const cooktopMat = getCatalogMaterial('metal', '#0f172a');

      // Center storage cabinets
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w - 0.15, h - 0.06, d - 0.25), woodMat);
      cabinet.position.set(0, (h - 0.06) / 2, 0.05);
      cabinet.castShadow = true;
      group.add(cabinet);

      // Marble Top
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), marbleMat);
      top.position.y = h - 0.03;
      top.castShadow = true;
      group.add(top);

      // Waterfall side slabs (left & right)
      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, h - 0.06, d), marbleMat);
      sideL.position.set(-w / 2 + 0.03, (h - 0.06) / 2, 0);
      group.add(sideL);

      const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, h - 0.06, d), marbleMat);
      sideR.position.set(w / 2 - 0.03, (h - 0.06) / 2, 0);
      group.add(sideR);

      // Induction surface cutout
      const cooktop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.005, 0.52), cooktopMat);
      cooktop.position.set(-0.35, h + 0.003, 0);
      group.add(cooktop);

      return group;
    },
  },

  // --- BATHROOM ---
  {
    id: 'bathtub_freestanding',
    name: 'Freestanding Oval Soak Bathtub',
    category: 'bathroom',
    width: 1.7,
    depth: 0.85,
    height: 0.6,
    defaultColor: '#ffffff',
    materialType: 'marble',
    icon: 'Bath',
    description: 'Sculptural matte white resin freestanding bathtub with floor-mounted brass faucet.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const tubMat = getCatalogMaterial(matType, color);
      const faucetMat = getCatalogMaterial('metal', '#bfa14c');

      // Outer tub body using scaled cylinder
      const tubGeo = new THREE.CylinderGeometry(w / 2, (w * 0.85) / 2, h, 32);
      tubGeo.scale(1, 1, d / w);
      const tub = new THREE.Mesh(tubGeo, tubMat);
      tub.position.y = h / 2;
      tub.castShadow = true;
      group.add(tub);

      // Inner hollow representation
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.7,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
      });
      const water = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.44, w * 0.4, 0.05, 32), waterMat);
      water.scale.set(1, 1, (d * 0.85) / (w * 0.85));
      water.position.y = h * 0.75;
      group.add(water);

      // Floor-mounted brass faucet
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 12), faucetMat);
      pipe.position.set(w * 0.48, 0.45, 0);
      group.add(pipe);

      const spout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.03), faucetMat);
      spout.position.set(w * 0.48 - 0.09, 0.9, 0);
      group.add(spout);

      return group;
    },
  },
  {
    id: 'bathroom_vanity',
    name: 'Double Sink Floating Vanity',
    category: 'bathroom',
    width: 1.5,
    depth: 0.52,
    height: 0.85,
    defaultColor: '#262626',
    materialType: 'wood',
    icon: 'Columns3',
    description: 'Matte black fluted double vanity with integrated quartz vessel basins.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const woodMat = getCatalogMaterial(matType, color);
      const sinkMat = getCatalogMaterial('marble', '#fafafa');
      const faucetMat = getCatalogMaterial('metal', '#171717');

      // Cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), woodMat);
      cabinet.position.y = 0.5;
      cabinet.castShadow = true;
      group.add(cabinet);

      // Quartz top
      const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.04, d + 0.02), sinkMat);
      top.position.y = 0.77;
      group.add(top);

      // 2 Sinks
      [-0.4, 0.4].forEach((sx) => {
        const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.12, 24), sinkMat);
        basin.position.set(sx, 0.85, 0);
        group.add(basin);

        const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 8), faucetMat);
        tap.position.set(sx, 0.92, -d * 0.3);
        group.add(tap);
      });

      return group;
    },
  },

  // --- OFFICE ---
  {
    id: 'executive_desk',
    name: 'Executive Minimalist Desk',
    category: 'office',
    width: 1.8,
    depth: 0.8,
    height: 0.75,
    defaultColor: '#302621',
    materialType: 'wood',
    icon: 'Briefcase',
    description: 'Dark stained walnut executive desk with cable management trough.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const woodMat = getCatalogMaterial(matType, color);
      const steelMat = getCatalogMaterial('metal', '#111827');

      // Desktop
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, d), woodMat);
      top.position.y = h - 0.0225;
      top.castShadow = true;
      group.add(top);

      // Sleek blade steel legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, h - 0.045, d * 0.85), steelMat);
      legL.position.set(-w / 2 + 0.1, (h - 0.045) / 2, 0);
      group.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.05, h - 0.045, d * 0.85), steelMat);
      legR.position.set(w / 2 - 0.1, (h - 0.045) / 2, 0);
      group.add(legR);

      // Laptop / monitor mockup
      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.22), steelMat);
      laptopBase.position.set(0, h + 0.005, 0.05);
      group.add(laptopBase);

      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.008), steelMat);
      laptopScreen.position.set(0, h + 0.1, -0.06);
      laptopScreen.rotation.x = -0.15;
      group.add(laptopScreen);

      return group;
    },
  },

  // --- ARCHITECTURAL & STAIRS ---
  {
    id: 'stairs_straight_wood',
    name: 'Modern Open-Riser Stairs',
    category: 'architectural',
    width: 1.0,
    depth: 3.2,
    height: 2.8,
    defaultColor: '#3b2f27',
    materialType: 'wood',
    icon: 'TrendingUp',
    description: 'Floating timber tread open-riser staircase with glass balustrade connecting floor levels.',
    create3DModel: (color, matType, w, d, h) => {
      const group = new THREE.Group();
      const treadMat = getCatalogMaterial(matType, color);
      const glassMat = getCatalogMaterial('glass', '#ffffff');
      const metalMat = getCatalogMaterial('metal', '#1e293b');

      const numSteps = 14;
      const stepH = h / numSteps;
      const stepD = d / numSteps;

      for (let i = 0; i < numSteps; i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, stepD * 1.2), treadMat);
        step.position.set(0, (i + 0.5) * stepH, -d / 2 + (i + 0.5) * stepD);
        step.castShadow = true;
        group.add(step);
      }

      // Central steel spine stringer
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, Math.hypot(d, h)), metalMat);
      spine.position.set(0, h / 2, 0);
      spine.rotation.x = Math.atan2(h, d);
      group.add(spine);

      // Glass railing on outer edge
      const glassRailing = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.9, d), glassMat);
      glassRailing.position.set(w / 2 - 0.02, h / 2 + 0.45, 0);
      group.add(glassRailing);

      return group;
    },
  },

  // --- DECOR & LIGHTING ---
  {
    id: 'plant_fiddle_leaf',
    name: 'Fiddle Leaf Fig in Ceramic Pot',
    category: 'decor',
    width: 0.65,
    depth: 0.65,
    height: 1.6,
    defaultColor: '#2d6a4f',
    materialType: 'fabric',
    icon: 'Trees',
    description: 'Statement architectural indoor plant in a fluted terracotta pot.',
    create3DModel: (color, _matType, _w, _d, h) => {
      const group = new THREE.Group();
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x22553b, roughness: 0.4 });
      const potMat = getCatalogMaterial('marble', '#e8e2d8');
      const stemMat = getCatalogMaterial('wood', '#382513');

      // Pot
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.45, 24), potMat);
      pot.position.y = 0.225;
      pot.castShadow = true;
      group.add(pot);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h - 0.4, 8), stemMat);
      trunk.position.y = 0.4 + (h - 0.4) / 2;
      group.add(trunk);

      // 6 Lush leaves at varying heights and angles
      for (let i = 0; i < 7; i++) {
        const leafGeo = new THREE.SphereGeometry(0.22, 8, 8);
        leafGeo.scale(1, 0.1, 1.6);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const angle = (i * Math.PI * 2) / 4.5;
        const ly = 0.65 + i * 0.13;
        leaf.position.set(Math.sin(angle) * 0.2, ly, Math.cos(angle) * 0.2);
        leaf.rotation.set(0.3, angle, 0.3);
        group.add(leaf);
      }

      return group;
    },
  },
  {
    id: 'floor_lamp_arc',
    name: 'Architectural Arc Floor Lamp',
    category: 'decor',
    width: 0.6,
    depth: 1.2,
    height: 2.1,
    defaultColor: '#c5a059',
    materialType: 'metal',
    icon: 'Sun',
    description: 'Curved brass arc lamp with heavy black marble base and dome shade.',
    create3DModel: (color, matType, _w, _d, h) => {
      const group = new THREE.Group();
      const brassMat = getCatalogMaterial(matType, color);
      const marbleMat = getCatalogMaterial('marble', '#1c1917');

      // Heavy marble base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24), marbleMat);
      base.position.y = 0.03;
      base.castShadow = true;
      group.add(base);

      // Vertical pole and curved arm
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, h * 0.7, 12), brassMat);
      pole.position.y = (h * 0.7) / 2;
      group.add(pole);

      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.015, 8, 16, Math.PI / 2), brassMat);
      arch.position.set(0, h * 0.7, 0.5);
      arch.rotation.y = Math.PI / 2;
      group.add(arch);

      // Dome shade
      const shadeGeo = new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const shade = new THREE.Mesh(shadeGeo, brassMat);
      shade.position.set(0, h - 0.2, 0.8);
      shade.rotation.x = Math.PI;
      group.add(shade);

      // Subtle light source inside
      const bulb = new THREE.PointLight(0xfff4e0, 2.5, 5);
      bulb.position.set(0, h - 0.25, 0.8);
      group.add(bulb);

      return group;
    },
  },
];
