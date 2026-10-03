/**
 * WorldObjects.ts
 * Procedural 3D object factory for MARS: 2187.
 * All objects are built from primitive geometries (Box, Cylinder, Sphere, Torus, Cone).
 * No external textures — colours and emissive properties only.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Shared palette
// ---------------------------------------------------------------------------
const C = {
  graphite:    0x4a4a5a,
  rust:        0x7a4a3a,
  panel:       0x3a3a4a,
  dark:        0x2a2a38,
  light:       0x6a6a7a,
  emCyan:      0x00aacc,
  emAmber:     0xffaa00,
  emRed:       0xff2200,
  emViolet:    0x6633cc,
  emGreen:     0x22ff88,
  marsSoil:    0x8B4513,
  glass:       0x88ccff,
  white:       0xffffff,
  yellow:      0xffee44,
} as const;

// ---------------------------------------------------------------------------
// Material helpers
// ---------------------------------------------------------------------------
function mat(color: number, roughness = 0.8, metalness = 0.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function matEmissive(color: number, emissive: number, intensity = 1.0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.6,
    metalness: 0.3,
  });
}
function matGlass(color: number, opacity = 0.35): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.05,
    metalness: 0.1,
  });
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
function box(w: number, h: number, d: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(w, h, d);
}
function cyl(rt: number, rb: number, h: number, seg = 8): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(rt, rb, h, seg);
}
function sphere(r: number, ws = 8, hs = 6): THREE.SphereGeometry {
  return new THREE.SphereGeometry(r, ws, hs);
}
function cone(r: number, h: number, seg = 8): THREE.ConeGeometry {
  return new THREE.ConeGeometry(r, h, seg);
}
function torus(r: number, tube: number, rs = 8, ts = 24): THREE.TorusGeometry {
  return new THREE.TorusGeometry(r, tube, rs, ts);
}

function mesh(geo: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// createHabitat
// ---------------------------------------------------------------------------
export function createHabitat(options?: {
  width?: number; height?: number; depth?: number; color?: number;
}): THREE.Group {
  const w = options?.width  ?? 6;
  const h = options?.height ?? 3.5;
  const d = options?.depth  ?? 8;
  const c = options?.color  ?? C.graphite;

  const g = new THREE.Group();

  // Main body
  const body = mesh(box(w, h, d), mat(c, 0.85, 0.5));
  body.position.y = h / 2;
  g.add(body);

  // Roof ridge
  const ridge = mesh(box(w * 0.9, 0.25, d), mat(C.dark, 0.9, 0.3));
  ridge.position.y = h + 0.12;
  g.add(ridge);

  // Side panels (ribbing)
  for (let i = -1; i <= 1; i += 2) {
    const rib = mesh(box(0.12, h * 0.85, d), mat(C.dark, 0.9, 0.6));
    rib.position.set(i * (w / 2 + 0.06), h / 2, 0);
    g.add(rib);
  }

  // Front windows (x2)
  for (let xi = -1; xi <= 1; xi += 2) {
    const win = mesh(box(0.9, 0.9, 0.05), matGlass(C.glass));
    win.position.set(xi * (w * 0.28), h * 0.6, d / 2 + 0.03);
    g.add(win);
  }

  // Door opening
  const door = mesh(box(1.0, 1.8, 0.05), mat(C.panel));
  door.position.set(0, 0.9, d / 2 + 0.03);
  g.add(door);

  // Door light bar
  const light = mesh(box(1.0, 0.1, 0.06), matEmissive(C.emCyan, C.emCyan, 1.2));
  light.position.set(0, 1.85, d / 2 + 0.04);
  g.add(light);

  // Anchor legs
  for (let xi = -1; xi <= 1; xi += 2) {
    for (let zi = -1; zi <= 1; zi += 2) {
      const leg = mesh(cyl(0.12, 0.15, 0.6, 6), mat(C.rust));
      leg.position.set(xi * (w / 2 - 0.2), -0.3, zi * (d / 2 - 0.3));
      g.add(leg);
    }
  }

  return g;
}

// ---------------------------------------------------------------------------
// createHabitatDome
// ---------------------------------------------------------------------------
export function createHabitatDome(radius = 5): THREE.Group {
  const g = new THREE.Group();

  // Dome shell (upper hemisphere)
  const domeGeo = new THREE.SphereGeometry(radius, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = mesh(domeGeo, matGlass(C.glass, 0.25));
  g.add(dome);

  // Dome frame rings
  for (let i = 1; i <= 3; i++) {
    const angle = (i / 4) * (Math.PI / 2);
    const r = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const ring = mesh(torus(r, 0.08, 6, 32), mat(C.graphite, 0.7, 0.7));
    ring.position.y = y;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }

  // Vertical struts
  const strutCount = 8;
  for (let i = 0; i < strutCount; i++) {
    const angle = (i / strutCount) * Math.PI * 2;
    const strut = mesh(cyl(0.05, 0.05, radius, 6), mat(C.graphite, 0.7, 0.7));
    strut.position.set(Math.cos(angle) * radius * 0.5, radius * 0.5, Math.sin(angle) * radius * 0.5);
    strut.rotation.z = -angle;
    strut.rotation.x = Math.PI / 4;
    g.add(strut);
  }

  // Base ring
  const base = mesh(torus(radius, 0.15, 8, 32), mat(C.dark, 0.8, 0.6));
  base.rotation.x = Math.PI / 2;
  g.add(base);

  // Floor disc
  const floor = mesh(new THREE.CircleGeometry(radius, 32), mat(C.panel, 0.95, 0.2));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  g.add(floor);

  // Centre light
  const centreLight = mesh(sphere(0.3, 8, 6), matEmissive(C.white, C.emCyan, 1.5));
  centreLight.position.y = radius * 0.6;
  g.add(centreLight);

  return g;
}

// ---------------------------------------------------------------------------
// createIndustrialBuilding
// ---------------------------------------------------------------------------
export function createIndustrialBuilding(w = 10, h = 7, d = 14): THREE.Group {
  const g = new THREE.Group();

  // Main structure
  const body = mesh(box(w, h, d), mat(C.graphite, 0.9, 0.5));
  body.position.y = h / 2;
  g.add(body);

  // Upper section
  const upper = mesh(box(w * 0.7, h * 0.4, d * 0.8), mat(C.dark, 0.9, 0.4));
  upper.position.y = h + h * 0.2;
  g.add(upper);

  // Horizontal bands
  for (let i = 1; i <= 3; i++) {
    const band = mesh(box(w + 0.1, 0.15, d + 0.1), mat(C.rust, 0.95, 0.3));
    band.position.y = (h / 4) * i;
    g.add(band);
  }

  // Side exhaust ports
  for (let i = -1; i <= 1; i += 2) {
    const port = mesh(cyl(0.35, 0.35, 1.2, 8), mat(C.dark));
    port.rotation.z = Math.PI / 2;
    port.position.set(i * (w / 2 + 0.6), h * 0.7, 0);
    g.add(port);
  }

  // Stacks on roof
  for (let si = -1; si <= 1; si += 2) {
    const stack = mesh(cyl(0.3, 0.4, h * 0.6, 8), mat(C.rust, 0.9, 0.3));
    stack.position.set(si * (w * 0.25), h + h * 0.3, 0);
    g.add(stack);

    // Stack cap
    const cap = mesh(cyl(0.45, 0.3, 0.25, 8), mat(C.dark));
    cap.position.set(si * (w * 0.25), h + h * 0.6 + 0.12, 0);
    g.add(cap);
  }

  // Warning light
  const warnLight = mesh(sphere(0.2, 8, 6), matEmissive(C.emAmber, C.emAmber, 2));
  warnLight.position.set(0, h + h * 0.4 + 0.2, 0);
  g.add(warnLight);

  // Front door
  const door = mesh(box(2.0, 3.0, 0.1), mat(C.panel));
  door.position.set(0, 1.5, d / 2 + 0.05);
  g.add(door);

  return g;
}

// ---------------------------------------------------------------------------
// createSolarPanel
// ---------------------------------------------------------------------------
export function createSolarPanel(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Panel surface
  const panel = mesh(box(2.4 * scale, 0.06 * scale, 1.4 * scale), matEmissive(0x1a2a4a, C.emCyan, 0.15));
  g.add(panel);

  // Grid lines (thin boxes)
  for (let xi = -1; xi <= 1; xi++) {
    const line = mesh(box(0.04 * scale, 0.07 * scale, 1.4 * scale), mat(C.graphite, 0.7, 0.8));
    line.position.x = xi * 0.8 * scale;
    g.add(line);
  }
  for (let zi = -1; zi <= 1; zi++) {
    const line = mesh(box(2.4 * scale, 0.07 * scale, 0.04 * scale), mat(C.graphite, 0.7, 0.8));
    line.position.z = zi * 0.45 * scale;
    g.add(line);
  }

  // Frame border
  const frame = mesh(box(2.5 * scale, 0.09 * scale, 1.5 * scale), mat(C.graphite, 0.8, 0.7));
  frame.position.y = -0.01;
  g.add(frame);

  // Tilt arm
  const arm = mesh(cyl(0.05 * scale, 0.05 * scale, 0.6 * scale, 6), mat(C.rust));
  arm.position.set(0, -0.35 * scale, 0);
  g.add(arm);

  return g;
}

// ---------------------------------------------------------------------------
// createSolarArray
// ---------------------------------------------------------------------------
export function createSolarArray(count = 4): THREE.Group {
  const g = new THREE.Group();

  // Central mast
  const mast = mesh(cyl(0.1, 0.12, 2.0, 8), mat(C.graphite, 0.8, 0.6));
  mast.position.y = 1.0;
  g.add(mast);

  const spacing = 2.8;
  for (let i = 0; i < count; i++) {
    const panel = createSolarPanel(1);
    panel.position.set((i - (count - 1) / 2) * spacing, 2.0, 0);
    panel.rotation.x = -Math.PI / 8; // slight tilt toward sun
    g.add(panel);

    // connector arm
    const arm = mesh(cyl(0.04, 0.04, spacing * 0.48, 6), mat(C.rust));
    arm.rotation.z = Math.PI / 2;
    arm.position.set((i - (count - 1) / 2) * spacing * 0.5, 2.0, 0);
    g.add(arm);
  }

  // Base plate
  const base = mesh(box(count * spacing * 0.9, 0.15, 1.0), mat(C.dark, 0.95, 0.3));
  base.position.y = 0.07;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createPipe
// ---------------------------------------------------------------------------
export function createPipe(length = 4, radius = 0.15, color = C.rust): THREE.Mesh {
  const geo = cyl(radius, radius, length, 8);
  const m = mesh(geo, mat(color, 0.85, 0.5));
  m.rotation.z = Math.PI / 2;
  return m;
}

// ---------------------------------------------------------------------------
// createPipeNetwork
// ---------------------------------------------------------------------------
export function createPipeNetwork(
  scene: THREE.Scene,
  positions: THREE.Vector3[],
  heights: number[] = []
): void {
  if (positions.length < 2) return;

  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i].clone();
    const b = positions[i + 1].clone();

    // Optionally lift by height offset
    const ha = heights[i]   ?? 0.5;
    const hb = heights[i+1] ?? 0.5;

    // Vertical riser at start
    if (ha > 0) {
      const riser = mesh(cyl(0.12, 0.12, ha, 8), mat(C.rust, 0.85, 0.5));
      riser.position.set(a.x, ha / 2, a.z);
      scene.add(riser);
    }

    // Elbow joint at top
    const jointA = mesh(sphere(0.14, 6, 6), mat(C.dark, 0.7, 0.6));
    jointA.position.set(a.x, ha, a.z);
    scene.add(jointA);

    // Horizontal run
    const elevated_a = a.clone(); elevated_a.y = ha;
    const elevated_b = b.clone(); elevated_b.y = ha;
    const dir = elevated_b.clone().sub(elevated_a);
    const len = dir.length();
    const mid = elevated_a.clone().add(elevated_b).multiplyScalar(0.5);

    const horiz = mesh(cyl(0.12, 0.12, len, 8), mat(C.rust, 0.85, 0.5));
    horiz.position.copy(mid);
    horiz.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    scene.add(horiz);

    // Elbow joint at end
    const jointB = mesh(sphere(0.14, 6, 6), mat(C.dark, 0.7, 0.6));
    jointB.position.set(b.x, hb, b.z);
    scene.add(jointB);

    // Vertical riser at end (last segment)
    if (i === positions.length - 2 && hb > 0) {
      const riserB = mesh(cyl(0.12, 0.12, hb, 8), mat(C.rust, 0.85, 0.5));
      riserB.position.set(b.x, hb / 2, b.z);
      scene.add(riserB);
    }
  }
}

// ---------------------------------------------------------------------------
// createContainer
// ---------------------------------------------------------------------------
export function createContainer(color = C.rust): THREE.Group {
  const g = new THREE.Group();

  // Body
  const body = mesh(box(2.4, 1.4, 1.2), mat(color, 0.9, 0.4));
  body.position.y = 0.7;
  g.add(body);

  // Corrugation ribs
  for (let i = -3; i <= 3; i++) {
    const rib = mesh(box(0.06, 1.4, 1.22), mat(C.dark, 0.95, 0.3));
    rib.position.set(i * 0.36, 0.7, 0);
    g.add(rib);
  }

  // Corner posts
  for (let xi = -1; xi <= 1; xi += 2) {
    for (let zi = -1; zi <= 1; zi += 2) {
      const post = mesh(box(0.1, 1.45, 0.1), mat(C.graphite, 0.8, 0.7));
      post.position.set(xi * 1.15, 0.72, zi * 0.55);
      g.add(post);
    }
  }

  // Top corner fittings
  for (let xi = -1; xi <= 1; xi += 2) {
    for (let zi = -1; zi <= 1; zi += 2) {
      const fitting = mesh(box(0.2, 0.2, 0.2), mat(C.graphite, 0.7, 0.8));
      fitting.position.set(xi * 1.05, 1.45, zi * 0.5);
      g.add(fitting);
    }
  }

  // Latch
  const latch = mesh(box(0.12, 0.6, 0.06), mat(C.graphite, 0.7, 0.8));
  latch.position.set(0, 0.7, 0.63);
  g.add(latch);

  return g;
}

// ---------------------------------------------------------------------------
// createCargoCrate
// ---------------------------------------------------------------------------
export function createCargoCrate(): THREE.Group {
  const g = new THREE.Group();

  const body = mesh(box(1.2, 1.2, 1.2), mat(C.graphite, 0.85, 0.4));
  body.position.y = 0.6;
  g.add(body);

  // Cross braces on each face
  const directions: [number, number, number, number, number][] = [
    [0, 0.6, 0.61, 0, 0],
    [0, 0.6, -0.61, 0, Math.PI],
    [0.61, 0.6, 0, Math.PI / 2, 0],
    [-0.61, 0.6, 0, -Math.PI / 2, 0],
  ];
  for (const [x, y, z] of directions) {
    for (let s = -1; s <= 1; s += 2) {
      const brace = mesh(box(1.1, 0.06, 0.04), mat(C.rust));
      brace.position.set(x, y + s * 0.3, z);
      // rotate braces on side faces
      if (Math.abs(x) > 0.5) { brace.rotation.y = Math.PI / 2; }
      g.add(brace);
    }
  }

  // Lid
  const lid = mesh(box(1.25, 0.1, 1.25), mat(C.dark, 0.8, 0.5));
  lid.position.y = 1.25;
  g.add(lid);

  // Handle
  const handle = mesh(box(0.3, 0.1, 0.05), mat(C.graphite, 0.6, 0.8));
  handle.position.set(0, 1.35, 0.63);
  g.add(handle);

  return g;
}

// ---------------------------------------------------------------------------
// createAntenna
// ---------------------------------------------------------------------------
export function createAntenna(height = 4): THREE.Group {
  const g = new THREE.Group();

  // Pole
  const pole = mesh(cyl(0.05, 0.08, height, 8), mat(C.graphite, 0.7, 0.7));
  pole.position.y = height / 2;
  g.add(pole);

  // Dish
  const dishGeo = new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3);
  const dish = mesh(dishGeo, mat(C.light, 0.6, 0.6));
  dish.position.y = height + 0.1;
  dish.rotation.x = Math.PI / 2 - 0.3;
  g.add(dish);

  // Dish mount
  const mount = mesh(cyl(0.06, 0.06, 0.4, 6), mat(C.dark));
  mount.position.y = height + 0.05;
  mount.rotation.z = 0.3;
  g.add(mount);

  // Signal light
  const sigLight = mesh(sphere(0.08, 6, 6), matEmissive(C.emCyan, C.emCyan, 2));
  sigLight.position.y = height + 0.5;
  g.add(sigLight);

  // Guy wires (thin cylinders leaning out)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const wireLen = height * 0.7;
    const wire = mesh(cyl(0.015, 0.015, wireLen, 4), mat(C.dark, 0.9, 0.5));
    wire.position.set(Math.cos(angle) * height * 0.3, height * 0.5, Math.sin(angle) * height * 0.3);
    wire.lookAt(Math.cos(angle) * height * 0.6, 0, Math.sin(angle) * height * 0.6);
    wire.rotateX(Math.PI / 2);
    g.add(wire);
  }

  // Base
  const base = mesh(cyl(0.3, 0.4, 0.2, 8), mat(C.rust));
  base.position.y = 0.1;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createCommTower
// ---------------------------------------------------------------------------
export function createCommTower(): THREE.Group {
  const g = new THREE.Group();

  const totalH = 12;

  // Lattice tower: 4 legs
  const legPositions: [number, number][] = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  for (const [lx, lz] of legPositions) {
    const leg = mesh(cyl(0.06, 0.1, totalH, 6), mat(C.graphite, 0.8, 0.7));
    leg.position.set(lx, totalH / 2, lz);
    g.add(leg);
  }

  // Cross-bracing at intervals
  for (let y = 1; y < totalH; y += 2) {
    for (let i = 0; i < 4; i++) {
      const a = legPositions[i];
      const b = legPositions[(i + 1) % 4];
      const mx = (a[0] + b[0]) / 2;
      const mz = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.sqrt(dx * dx + dz * dz);
      const brace = mesh(cyl(0.03, 0.03, len, 4), mat(C.rust, 0.9, 0.4));
      brace.position.set(mx, y, mz);
      brace.rotation.y = Math.atan2(dx, dz);
      brace.rotation.x = Math.PI / 2;
      g.add(brace);
    }
  }

  // Top platform
  const platform = mesh(box(1.4, 0.1, 1.4), mat(C.dark));
  platform.position.y = totalH;
  g.add(platform);

  // Antenna on top
  const ant = createAntenna(3);
  ant.position.y = totalH + 0.1;
  g.add(ant);

  // Warning light
  const warn = mesh(sphere(0.15, 6, 6), matEmissive(C.emRed, C.emRed, 2.5));
  warn.position.y = totalH + 0.2;
  g.add(warn);

  // Base
  const base = mesh(box(1.6, 0.3, 1.6), mat(C.graphite, 0.9, 0.5));
  base.position.y = 0.15;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createLamp
// ---------------------------------------------------------------------------
export function createLamp(height = 3.5, color = C.emAmber): THREE.Group {
  const g = new THREE.Group();

  // Pole
  const pole = mesh(cyl(0.05, 0.07, height, 8), mat(C.graphite, 0.75, 0.6));
  pole.position.y = height / 2;
  g.add(pole);

  // Arm
  const arm = mesh(cyl(0.04, 0.04, 0.8, 6), mat(C.graphite, 0.75, 0.6));
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.4, height, 0);
  g.add(arm);

  // Shade cone
  const shade = mesh(cone(0.22, 0.3, 10), mat(C.dark, 0.9, 0.4));
  shade.position.set(0.8, height - 0.1, 0);
  shade.rotation.z = Math.PI;
  g.add(shade);

  // Bulb
  const bulb = mesh(sphere(0.1, 8, 6), matEmissive(C.white, color, 2.5));
  bulb.position.set(0.8, height - 0.22, 0);
  g.add(bulb);

  // Base
  const base = mesh(cyl(0.12, 0.18, 0.15, 8), mat(C.rust));
  base.position.y = 0.07;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createRock
// ---------------------------------------------------------------------------
export function createRock(scale = 1, seed = 1): THREE.Group {
  const g = new THREE.Group();

  const variations = [
    [1.0, 0.75, 0.9],
    [1.2, 0.6, 0.8],
    [0.8, 0.9, 1.1],
    [1.1, 0.65, 0.75],
    [0.9, 0.8, 1.0],
  ];
  const v = variations[seed % variations.length];

  const rockGeo = new THREE.SphereGeometry(0.5 * scale, 7, 5);
  // Distort vertices slightly for a lumpy look
  const pos = rockGeo.attributes.position;
  const rng = mulberry32(seed * 12345 + 9999);
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * (v[0] + (rng() - 0.5) * 0.25),
      pos.getY(i) * (v[1] + (rng() - 0.5) * 0.15),
      pos.getZ(i) * (v[2] + (rng() - 0.5) * 0.25)
    );
  }
  rockGeo.computeVertexNormals();

  const rock = mesh(rockGeo, mat(C.marsSoil, 0.95, 0.1));
  rock.position.y = 0.25 * scale * v[1];
  g.add(rock);

  return g;
}

// ---------------------------------------------------------------------------
// createDune
// ---------------------------------------------------------------------------
export function createDune(width = 20, height = 1.5): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, width * 0.5, 30, 15);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = height * Math.exp(-(x * x + z * z * 4) / (width * width * 0.15));
    pos.setY(i, y);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(C.marsSoil, 0.98, 0.05));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// createMountain
// ---------------------------------------------------------------------------
export function createMountain(width = 40, height = 20, seed = 1): THREE.Group {
  const g = new THREE.Group();

  const geo = new THREE.ConeGeometry(width / 2, height, 12, 8);
  const pos = geo.attributes.position;
  const rng = mulberry32(seed * 54321);
  for (let i = 0; i < pos.count; i++) {
    const yi = pos.getY(i);
    const factor = 1 - (yi + height / 2) / height; // 0 at top, 1 at base
    pos.setX(i, pos.getX(i) + (rng() - 0.5) * factor * width * 0.15);
    pos.setZ(i, pos.getZ(i) + (rng() - 0.5) * factor * width * 0.15);
  }
  geo.computeVertexNormals();

  const mountain = mesh(geo, mat(0x6a3a2a, 0.95, 0.05));
  mountain.position.y = height / 2;
  g.add(mountain);

  // Snow-like cap
  const cap = mesh(cone(width * 0.12, height * 0.18, 8), mat(0x9a7a6a, 0.9, 0.1));
  cap.position.y = height + height * 0.04;
  g.add(cap);

  return g;
}

// ---------------------------------------------------------------------------
// createTerminal
// ---------------------------------------------------------------------------
export function createTerminal(): THREE.Group {
  const g = new THREE.Group();

  // Base/pedestal
  const base = mesh(box(0.5, 0.9, 0.4), mat(C.graphite, 0.8, 0.5));
  base.position.y = 0.45;
  g.add(base);

  // Screen
  const screen = mesh(box(0.45, 0.35, 0.05), matEmissive(0x001a2a, C.emCyan, 0.6));
  screen.position.set(0, 1.0, 0.22);
  g.add(screen);

  // Screen frame
  const frame = mesh(box(0.5, 0.4, 0.04), mat(C.dark, 0.8, 0.6));
  frame.position.set(0, 1.0, 0.19);
  g.add(frame);

  // Keyboard panel
  const kb = mesh(box(0.4, 0.06, 0.25), mat(C.panel, 0.9, 0.4));
  kb.position.set(0, 0.93, 0.15);
  kb.rotation.x = -0.25;
  g.add(kb);

  // Button row
  for (let bi = -2; bi <= 2; bi++) {
    const btn = mesh(box(0.04, 0.03, 0.04), matEmissive(C.graphite, C.emCyan, 0.3));
    btn.position.set(bi * 0.07, 0.97, 0.24);
    g.add(btn);
  }

  // Status light
  const statusLight = mesh(sphere(0.03, 6, 6), matEmissive(C.emGreen, C.emGreen, 2));
  statusLight.position.set(0.2, 1.2, 0.23);
  g.add(statusLight);

  return g;
}

// ---------------------------------------------------------------------------
// createDoor
// ---------------------------------------------------------------------------
export function createDoor(width = 1.2, height = 2.2, open = false): THREE.Group {
  const g = new THREE.Group();

  // Door panel
  const panel = mesh(box(width, height, 0.1), mat(C.graphite, 0.75, 0.5));
  if (open) {
    panel.position.set(width / 2, height / 2, -width / 2);
    panel.rotation.y = Math.PI / 2;
  } else {
    panel.position.y = height / 2;
  }
  g.add(panel);

  // Panel detail strip
  const strip = mesh(box(width * 0.15, height * 0.7, 0.12), mat(C.panel));
  if (!open) strip.position.set(width * 0.3, height / 2, 0);
  g.add(strip);

  // Door handle
  const handle = mesh(cyl(0.03, 0.03, 0.25, 6), mat(C.light, 0.5, 0.8));
  handle.rotation.z = Math.PI / 2;
  if (!open) handle.position.set(width * 0.38, height * 0.5, 0.1);
  g.add(handle);

  // Indicator light
  const indicator = mesh(sphere(0.04, 6, 6), matEmissive(C.emGreen, C.emGreen, 2));
  if (!open) indicator.position.set(-width * 0.3, height * 0.8, 0.08);
  g.add(indicator);

  return g;
}

// ---------------------------------------------------------------------------
// createDoorFrame
// ---------------------------------------------------------------------------
export function createDoorFrame(width = 1.4, height = 2.4): THREE.Group {
  const g = new THREE.Group();

  const thick = 0.15;
  const depth = 0.25;

  // Left post
  const left = mesh(box(thick, height, depth), mat(C.graphite, 0.8, 0.5));
  left.position.set(-width / 2 - thick / 2, height / 2, 0);
  g.add(left);

  // Right post
  const right = mesh(box(thick, height, depth), mat(C.graphite, 0.8, 0.5));
  right.position.set(width / 2 + thick / 2, height / 2, 0);
  g.add(right);

  // Lintel
  const lintel = mesh(box(width + thick * 2, thick, depth), mat(C.graphite, 0.8, 0.5));
  lintel.position.y = height + thick / 2;
  g.add(lintel);

  // Emissive frame edge
  const ledge = mesh(box(width, 0.06, depth + 0.02), matEmissive(C.emCyan, C.emCyan, 0.8));
  ledge.position.y = height;
  g.add(ledge);

  return g;
}

// ---------------------------------------------------------------------------
// createReactor
// ---------------------------------------------------------------------------
export function createReactor(): THREE.Group {
  const g = new THREE.Group();

  // Outer casing
  const casing = mesh(cyl(1.5, 1.8, 3.5, 12), mat(C.graphite, 0.8, 0.6));
  casing.position.y = 1.75;
  g.add(casing);

  // Inner core visible through "window"
  const core = mesh(sphere(0.7, 12, 10), matEmissive(0x001122, C.emCyan, 1.5));
  core.position.y = 2.2;
  g.add(core);

  // Cooling rings
  for (let i = 0; i <= 4; i++) {
    const ring = mesh(torus(1.5 + i * 0.05, 0.1, 6, 20), mat(C.rust, 0.8, 0.4));
    ring.position.y = 0.5 + i * 0.7;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }

  // Top cap
  const topCap = mesh(cyl(0.8, 1.5, 0.4, 12), mat(C.dark, 0.85, 0.5));
  topCap.position.y = 3.7;
  g.add(topCap);

  // Exhaust pipes (sides)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const pipe = mesh(cyl(0.12, 0.12, 1.0, 8), mat(C.rust, 0.9, 0.4));
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(Math.cos(angle) * 1.9, 1.2 + i * 0.3, Math.sin(angle) * 1.9);
    g.add(pipe);
  }

  // Control panel side
  const panel = mesh(box(0.8, 0.5, 0.1), mat(C.panel));
  panel.position.set(1.8, 1.5, 0);
  g.add(panel);

  // Panel indicators
  for (let pi = -1; pi <= 1; pi++) {
    const led = mesh(sphere(0.04, 6, 6), matEmissive(C.emCyan, C.emCyan, 1.5));
    led.position.set(1.86, 1.55 + pi * 0.1, pi * 0.15);
    g.add(led);
  }

  // Warning light
  const warnLight = mesh(sphere(0.18, 8, 6), matEmissive(C.emAmber, C.emAmber, 1.8));
  warnLight.position.y = 4.0;
  g.add(warnLight);

  // Base platform
  const base = mesh(cyl(2.2, 2.4, 0.35, 12), mat(C.dark, 0.9, 0.4));
  base.position.y = 0.17;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createEnergyNode
// ---------------------------------------------------------------------------
export function createEnergyNode(glowing = true): THREE.Group {
  const g = new THREE.Group();

  const emColor = glowing ? C.emViolet : C.emAmber;
  const emInt   = glowing ? 1.8 : 0.5;

  // Base
  const base = mesh(cyl(0.4, 0.5, 0.3, 8), mat(C.dark, 0.85, 0.5));
  base.position.y = 0.15;
  g.add(base);

  // Main crystal (octahedral-ish: two cones joined)
  const crystalTop = mesh(cone(0.25, 0.7, 6), matEmissive(0x110022, emColor, emInt));
  crystalTop.position.y = 0.95;
  g.add(crystalTop);

  const crystalBot = mesh(cone(0.25, 0.7, 6), matEmissive(0x110022, emColor, emInt));
  crystalBot.rotation.z = Math.PI;
  crystalBot.position.y = 0.6;
  g.add(crystalBot);

  // Surrounding orbit rings
  for (let i = 0; i < 3; i++) {
    const ring = mesh(torus(0.45, 0.03, 6, 24), mat(C.graphite, 0.7, 0.8));
    ring.rotation.x = (i / 3) * Math.PI;
    ring.rotation.z = (i / 3) * Math.PI * 0.7;
    ring.position.y = 0.75;
    g.add(ring);
  }

  // Energy glow sphere
  if (glowing) {
    const glow = mesh(sphere(0.18, 8, 6), matEmissive(C.white, emColor, 2.5));
    glow.position.y = 0.75;
    g.add(glow);
  }

  return g;
}

// ---------------------------------------------------------------------------
// createAncientMachine
// ---------------------------------------------------------------------------
export function createAncientMachine(): THREE.Group {
  const g = new THREE.Group();

  // Monolith body
  const body = mesh(box(2.5, 4.5, 0.6), mat(0x2a1a3a, 0.6, 0.3));
  body.position.y = 2.25;
  g.add(body);

  // Glowing runes (rows of small emissive boxes)
  for (let row = 0; row < 6; row++) {
    for (let col = -2; col <= 2; col++) {
      const rune = mesh(box(0.18, 0.12, 0.04), matEmissive(0x110022, C.emViolet, 1.0 + Math.sin(row + col) * 0.4));
      rune.position.set(col * 0.35, 0.8 + row * 0.55, 0.35);
      g.add(rune);
    }
  }

  // Side flanges
  for (let i = -1; i <= 1; i += 2) {
    const flange = mesh(box(0.3, 4.5, 0.8), mat(0x1a0a2a, 0.7, 0.4));
    flange.position.set(i * 1.4, 2.25, 0);
    g.add(flange);

    // Flange detail
    for (let fi = 0; fi < 5; fi++) {
      const detail = mesh(box(0.32, 0.12, 0.85), mat(C.graphite, 0.8, 0.5));
      detail.position.set(i * 1.4, 0.5 + fi * 0.8, 0);
      g.add(detail);
    }
  }

  // Central glowing orb
  const orb = mesh(sphere(0.5, 12, 10), matEmissive(0x110022, C.emViolet, 2.5));
  orb.position.y = 4.8;
  g.add(orb);

  // Orb housing
  const orbHousing = mesh(torus(0.6, 0.08, 8, 24), mat(C.graphite, 0.7, 0.7));
  orbHousing.position.y = 4.8;
  orbHousing.rotation.x = Math.PI / 2;
  g.add(orbHousing);

  // Base
  const base = mesh(box(3.2, 0.4, 1.2), mat(0x1a0a2a, 0.8, 0.3));
  base.position.y = 0.2;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createEnergyCore
// ---------------------------------------------------------------------------
export function createEnergyCore(): THREE.Group {
  const g = new THREE.Group();

  // Outer shell (rings)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI;
    const ring = mesh(torus(1.0, 0.07, 8, 32), mat(C.graphite, 0.7, 0.8));
    ring.rotation.x = angle;
    ring.rotation.z = angle * 0.7;
    ring.position.y = 1.2;
    g.add(ring);
  }

  // Inner glow layers
  const innerGlow = mesh(sphere(0.55, 12, 10), matEmissive(0x001133, C.emCyan, 2.0));
  innerGlow.position.y = 1.2;
  g.add(innerGlow);

  const midGlow = mesh(sphere(0.35, 10, 8), matEmissive(C.white, C.emCyan, 3.0));
  midGlow.position.y = 1.2;
  g.add(midGlow);

  // Containment pillars
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const pillar = mesh(cyl(0.08, 0.1, 2.0, 8), mat(C.dark, 0.8, 0.6));
    pillar.position.set(Math.cos(angle) * 1.3, 1.0, Math.sin(angle) * 1.3);
    g.add(pillar);

    // Pillar glow
    const glow = mesh(sphere(0.09, 6, 6), matEmissive(C.emCyan, C.emCyan, 1.2));
    glow.position.set(Math.cos(angle) * 1.3, 1.8, Math.sin(angle) * 1.3);
    g.add(glow);
  }

  // Base plate
  const base = mesh(cyl(1.6, 1.8, 0.2, 12), mat(C.dark, 0.9, 0.5));
  base.position.y = 0.1;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createHologramRing
// ---------------------------------------------------------------------------
export function createHologramRing(radius = 1.0, color = C.emCyan): THREE.Group {
  const g = new THREE.Group();

  // Outer ring
  const outer = mesh(torus(radius, 0.04, 8, 48), matEmissive(0x001122, color, 1.5));
  outer.rotation.x = Math.PI / 2;
  g.add(outer);

  // Inner ring (smaller)
  const inner = mesh(torus(radius * 0.7, 0.03, 8, 36), matEmissive(0x001122, color, 1.0));
  inner.rotation.x = Math.PI / 2;
  g.add(inner);

  // Spokes
  const spokeCount = 8;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spoke = mesh(box(0.02, 0.02, radius * 0.3), matEmissive(0x001122, color, 0.8));
    spoke.position.set(Math.cos(angle) * radius * 0.85, 0, Math.sin(angle) * radius * 0.85);
    spoke.rotation.y = angle;
    g.add(spoke);
  }

  // Base emitter
  const emitter = mesh(cyl(0.12, 0.12, 0.08, 8), mat(C.graphite, 0.7, 0.7));
  emitter.position.y = -0.05;
  g.add(emitter);

  return g;
}

// ---------------------------------------------------------------------------
// createPressureModule
// ---------------------------------------------------------------------------
export function createPressureModule(): THREE.Group {
  const g = new THREE.Group();

  // Main cylindrical tank
  const tank = mesh(cyl(0.8, 0.8, 2.5, 12), mat(C.graphite, 0.75, 0.6));
  tank.position.y = 1.25;
  g.add(tank);

  // End caps
  const capGeo = new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const capTop = mesh(capGeo, mat(C.graphite, 0.75, 0.6));
  capTop.position.y = 2.5;
  g.add(capTop);

  const capBot = mesh(capGeo, mat(C.graphite, 0.75, 0.6));
  capBot.rotation.x = Math.PI;
  capBot.position.y = 0;
  g.add(capBot);

  // Pressure bands
  for (let i = 0; i < 4; i++) {
    const band = mesh(torus(0.82, 0.06, 6, 20), mat(C.rust, 0.85, 0.4));
    band.position.y = 0.4 + i * 0.55;
    band.rotation.x = Math.PI / 2;
    g.add(band);
  }

  // Valve knob
  const valve = mesh(cyl(0.1, 0.1, 0.15, 8), mat(C.rust));
  valve.rotation.z = Math.PI / 2;
  valve.position.set(0.9, 1.5, 0);
  g.add(valve);

  // Gauge
  const gauge = mesh(sphere(0.12, 8, 6), mat(C.graphite, 0.6, 0.5));
  gauge.position.set(0.82, 1.9, 0);
  g.add(gauge);

  // Status light
  const light = mesh(sphere(0.06, 6, 6), matEmissive(C.emGreen, C.emGreen, 1.8));
  light.position.set(0, 2.65, 0);
  g.add(light);

  // Legs
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = mesh(cyl(0.05, 0.05, 0.5, 6), mat(C.dark));
    leg.position.set(Math.cos(angle) * 0.65, -0.55, Math.sin(angle) * 0.65);
    g.add(leg);
  }

  return g;
}

// ---------------------------------------------------------------------------
// createVent
// ---------------------------------------------------------------------------
export function createVent(size = 0.8): THREE.Group {
  const g = new THREE.Group();

  // Housing
  const housing = mesh(box(size, size * 0.35, size * 0.5), mat(C.graphite, 0.85, 0.5));
  housing.position.y = size * 0.17;
  g.add(housing);

  // Slats
  const slatCount = 5;
  for (let i = 0; i < slatCount; i++) {
    const slat = mesh(box(size * 0.92, 0.04, size * 0.06), mat(C.dark, 0.9, 0.4));
    slat.position.set(0, size * 0.05 + i * ((size * 0.28) / slatCount), size * 0.1);
    slat.rotation.x = -0.3;
    g.add(slat);
  }

  // Frame
  const frame = mesh(box(size + 0.05, size * 0.38, size * 0.52), mat(C.rust, 0.9, 0.4));
  frame.position.y = size * 0.17;
  frame.scale.set(1, 1, 1);
  // Use as outer frame by making it slightly bigger — put behind
  const frameInner = mesh(box(size - 0.1, size * 0.3, size * 0.42), mat(C.graphite));
  frameInner.position.y = size * 0.17;
  g.add(frame);

  return g;
}

// ---------------------------------------------------------------------------
// createWalkway
// ---------------------------------------------------------------------------
export function createWalkway(length = 6): THREE.Group {
  const g = new THREE.Group();

  // Floor grating
  const floor = mesh(box(1.6, 0.08, length), mat(C.graphite, 0.9, 0.5));
  g.add(floor);

  // Grating slats
  const slatCount = Math.floor(length * 2);
  for (let i = 0; i < slatCount; i++) {
    const slat = mesh(box(1.6, 0.1, 0.05), mat(C.dark, 0.95, 0.4));
    slat.position.set(0, 0.01, -length / 2 + i * (length / slatCount));
    g.add(slat);
  }

  // Support beams underneath
  const beamCount = Math.floor(length / 2);
  for (let i = 0; i <= beamCount; i++) {
    const beam = mesh(box(1.7, 0.12, 0.1), mat(C.dark, 0.9, 0.5));
    beam.position.set(0, -0.06, -length / 2 + i * (length / beamCount));
    g.add(beam);
  }

  return g;
}

// ---------------------------------------------------------------------------
// createRailing
// ---------------------------------------------------------------------------
export function createRailing(length = 6): THREE.Group {
  const g = new THREE.Group();

  // Top rail
  const topRail = mesh(cyl(0.04, 0.04, length, 6), mat(C.graphite, 0.75, 0.7));
  topRail.rotation.z = Math.PI / 2;
  topRail.position.y = 1.05;
  g.add(topRail);

  // Mid rail
  const midRail = mesh(cyl(0.03, 0.03, length, 6), mat(C.graphite, 0.75, 0.7));
  midRail.rotation.z = Math.PI / 2;
  midRail.position.y = 0.55;
  g.add(midRail);

  // Posts
  const postCount = Math.floor(length / 1.5) + 1;
  for (let i = 0; i < postCount; i++) {
    const post = mesh(cyl(0.04, 0.04, 1.1, 6), mat(C.rust, 0.8, 0.5));
    post.position.set(-length / 2 + i * (length / (postCount - 1)), 0.55, 0);
    g.add(post);
  }

  return g;
}

// ---------------------------------------------------------------------------
// createFan
// ---------------------------------------------------------------------------
export function createFan(radius = 0.5): THREE.Group {
  const g = new THREE.Group();

  // Housing ring
  const housing = mesh(torus(radius + 0.08, 0.08, 8, 24), mat(C.graphite, 0.8, 0.5));
  housing.rotation.x = Math.PI / 2;
  g.add(housing);

  // Blade group (for animation)
  const bladeGroup = new THREE.Group();
  bladeGroup.name = 'fan_blades';

  const bladeCount = 5;
  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const blade = mesh(box(radius * 0.88, 0.04, radius * 0.28), mat(C.panel, 0.7, 0.5));
    blade.position.set(Math.cos(angle) * radius * 0.42, 0, Math.sin(angle) * radius * 0.42);
    blade.rotation.y = angle + 0.4;
    bladeGroup.add(blade);
  }

  g.add(bladeGroup);

  // Centre hub
  const hub = mesh(cyl(0.1, 0.1, 0.1, 8), mat(C.dark, 0.8, 0.7));
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  // Back mount
  const mount = mesh(box(radius * 2.3, radius * 2.3, 0.08), mat(C.dark, 0.9, 0.4));
  mount.position.z = -0.09;
  g.add(mount);

  return g;
}

// ---------------------------------------------------------------------------
// createWindow
// ---------------------------------------------------------------------------
export function createWindow(width = 1.0, height = 0.8): THREE.Group {
  const g = new THREE.Group();

  // Frame
  const frame = mesh(box(width + 0.12, height + 0.12, 0.1), mat(C.graphite, 0.8, 0.6));
  g.add(frame);

  // Glass pane
  const glass = mesh(box(width, height, 0.06), matGlass(C.glass, 0.3));
  glass.position.z = 0.02;
  g.add(glass);

  // Centre cross-bar
  const hBar = mesh(box(width, 0.05, 0.12), mat(C.graphite, 0.8, 0.6));
  hBar.position.z = 0.01;
  g.add(hBar);

  const vBar = mesh(box(0.05, height, 0.12), mat(C.graphite, 0.8, 0.6));
  vBar.position.z = 0.01;
  g.add(vBar);

  // Sill
  const sill = mesh(box(width + 0.16, 0.06, 0.15), mat(C.rust, 0.9, 0.3));
  sill.position.set(0, -(height / 2 + 0.06), 0.02);
  g.add(sill);

  return g;
}

// ---------------------------------------------------------------------------
// createSignPanel
// ---------------------------------------------------------------------------
export function createSignPanel(_text = 'MARS: 2187'): THREE.Group {
  const g = new THREE.Group();

  // Backing panel
  const backing = mesh(box(2.0, 0.6, 0.08), mat(C.dark, 0.9, 0.3));
  g.add(backing);

  // Emissive strip (representing lit text area)
  const textArea = mesh(box(1.8, 0.38, 0.09), matEmissive(0x001122, C.emCyan, 0.5));
  textArea.position.z = 0.005;
  g.add(textArea);

  // Decorative side lights
  for (let i = -1; i <= 1; i += 2) {
    const dot = mesh(sphere(0.04, 6, 6), matEmissive(C.emAmber, C.emAmber, 2));
    dot.position.set(i * 0.9, 0, 0.05);
    g.add(dot);
  }

  // Mount arm
  const arm = mesh(box(0.1, 0.5, 0.1), mat(C.graphite, 0.8, 0.6));
  arm.position.y = -0.55;
  g.add(arm);

  return g;
}

// ---------------------------------------------------------------------------
// createDebris
// ---------------------------------------------------------------------------
export function createDebris(): THREE.Group {
  const g = new THREE.Group();

  const rng = mulberry32(987654);

  const pieceCount = 8 + Math.floor(rng() * 6);
  for (let i = 0; i < pieceCount; i++) {
    const type = Math.floor(rng() * 3);
    let piece: THREE.Mesh;
    if (type === 0) {
      piece = mesh(box(rng() * 0.5 + 0.1, rng() * 0.15 + 0.05, rng() * 0.4 + 0.1), mat(C.rust, 0.95, 0.3));
    } else if (type === 1) {
      piece = mesh(cyl(rng() * 0.1 + 0.03, rng() * 0.1 + 0.03, rng() * 0.6 + 0.2, 6), mat(C.graphite));
    } else {
      piece = mesh(sphere(rng() * 0.15 + 0.05, 5, 4), mat(C.marsSoil, 0.98, 0.05));
    }
    piece.position.set(
      (rng() - 0.5) * 2.5,
      rng() * 0.15,
      (rng() - 0.5) * 2.5
    );
    piece.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    g.add(piece);
  }

  return g;
}

// ---------------------------------------------------------------------------
// createAirlock
// ---------------------------------------------------------------------------
export function createAirlock(): THREE.Group {
  const g = new THREE.Group();

  // Outer chamber
  const outer = mesh(cyl(1.8, 1.8, 3.5, 12), mat(C.graphite, 0.8, 0.5));
  outer.position.y = 1.75;
  g.add(outer);

  // Airlock door A (outer)
  const doorA = mesh(box(1.2, 2.0, 0.15), mat(C.panel, 0.75, 0.5));
  doorA.position.set(0, 1.0, 1.82);
  g.add(doorA);

  // Airlock door B (inner)
  const doorB = mesh(box(1.2, 2.0, 0.15), mat(C.panel, 0.75, 0.5));
  doorB.position.set(0, 1.0, -1.82);
  g.add(doorB);

  // Pressure equalization pipes
  for (let i = -1; i <= 1; i += 2) {
    const pipe = mesh(cyl(0.1, 0.1, 3.5, 8), mat(C.rust, 0.85, 0.4));
    pipe.position.set(i * 1.6, 1.75, 0);
    g.add(pipe);
  }

  // Status strip
  const strip = mesh(torus(1.82, 0.06, 6, 24), mat(C.graphite, 0.8, 0.6));
  strip.rotation.x = Math.PI / 2;
  strip.position.y = 3.5;
  g.add(strip);

  // Warning lights
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const warn = mesh(sphere(0.1, 6, 6), matEmissive(C.emAmber, C.emAmber, 1.5));
    warn.position.set(Math.cos(angle) * 1.82, 3.55, Math.sin(angle) * 1.82);
    g.add(warn);
  }

  // Top hatch
  const hatch = mesh(cyl(0.6, 0.6, 0.2, 10), mat(C.dark, 0.85, 0.5));
  hatch.position.y = 3.6;
  g.add(hatch);

  // Base ring
  const base = mesh(cyl(2.0, 2.2, 0.3, 12), mat(C.dark, 0.9, 0.4));
  base.position.y = 0.15;
  g.add(base);

  return g;
}

// ---------------------------------------------------------------------------
// createHelipadMarking
// ---------------------------------------------------------------------------
export function createHelipadMarking(radius = 8): THREE.Group {
  const g = new THREE.Group();

  // Outer ring
  const outerRing = mesh(torus(radius, 0.25, 6, 48), matEmissive(C.emAmber, C.emAmber, 1.0));
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.02;
  g.add(outerRing);

  // Inner ring
  const innerRing = mesh(torus(radius * 0.6, 0.15, 6, 36), mat(C.emAmber, 0.8, 0.2));
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.02;
  g.add(innerRing);

  // H marker: 3 bars
  const hBar1 = mesh(box(0.3, 0.04, radius * 0.7), mat(C.emAmber, 0.8, 0.2));
  hBar1.position.set(-radius * 0.15, 0.03, 0);
  g.add(hBar1);

  const hBar2 = mesh(box(0.3, 0.04, radius * 0.7), mat(C.emAmber, 0.8, 0.2));
  hBar2.position.set(radius * 0.15, 0.03, 0);
  g.add(hBar2);

  const hCross = mesh(box(radius * 0.34, 0.04, 0.3), mat(C.emAmber, 0.8, 0.2));
  hCross.position.y = 0.03;
  g.add(hCross);

  // Corner lights
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const cornerLight = mesh(sphere(0.18, 6, 6), matEmissive(C.emAmber, C.emAmber, 2.0));
    cornerLight.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
    g.add(cornerLight);
  }

  return g;
}

// ---------------------------------------------------------------------------
// Internal utility: mulberry32 PRNG (seed-based, deterministic)
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const PALETTE = C;
export const buildHabitatDome = createHabitatDome;
export const buildSolarArray = createSolarArray;
export const buildCommTower = createCommTower;
export const buildLandingPad = createHelipadMarking;
export const buildCargoContainer = createCargoCrate;
export const buildPipe = createPipe;
export const buildAirlock = createAirlock;
export const buildTerminal = createTerminal;
export const buildWorkbench = () => createContainer(C.graphite);
export const buildSleepingPod = () => createHabitat();
export const buildMedBed = () => createContainer(C.white);
export const buildHydroponicsRack = () => createContainer(C.emGreen);
export const buildReactorCore = createReactor;
export const buildEnergyNode = createEnergyNode;
export const buildCeilingFan = createFan;
export const buildAntennaDish = createAntenna;
export const buildEmergencyLight = () => createLamp(3.5, C.emRed);
export function buildFloor(w: number, d: number) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), mat(C.panel)); m.position.y = -0.25; g.add(m); return g; }
export function buildCeiling(w: number, d: number) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), mat(C.panel)); m.position.y = 0.25; g.add(m); return g; }
export function buildWall(w: number, h: number, d: number) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(C.graphite)); g.add(m); return g; }
export function makeRoomLight(color: number, intensity: number, dist: number) { return new THREE.PointLight(color, intensity, dist); }
export function makeBox(w: number, h: number, d: number, color: number) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); }
export function makeCylinder(rT: number, rB: number, h: number, s: number, color: number) { return new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, s), mat(color)); }
export function makeSphere(r: number, wS: number, hS: number, color: number) { return new THREE.Mesh(new THREE.SphereGeometry(r, wS, hS), mat(color)); }
export function makeTorus(r: number, t: number, rS: number, tS: number, color: number) { return new THREE.Mesh(new THREE.TorusGeometry(r, t, rS, tS), mat(color)); }
export function getMaterial(name: string) { return mat(C.graphite); }
