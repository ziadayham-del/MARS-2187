/**
 * MarsTerrain.ts
 * Procedural Mars terrain for MARS: 2187.
 * Deterministic sin/cos-based height field — no external noise libraries.
 * Rocks and debris are instanced for GPU efficiency.
 */

import * as THREE from 'three';
import { createRock, createDebris } from './WorldObjects';

// ---------------------------------------------------------------------------
// Noise helpers (no external dependency)
// ---------------------------------------------------------------------------

/** Simple deterministic hash → float in [0, 1]. */
function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Layered sin/cos pseudo-noise.
 * Combines multiple octaves for terrain-like displacement.
 */
function terrainNoise(x: number, z: number, octaves = 5): number {
  let value  = 0;
  let amp    = 1.0;
  let freq   = 0.003;
  let total  = 0;

  for (let o = 0; o < octaves; o++) {
    const hv = hash(Math.floor(x * freq), Math.floor(z * freq));
    const sx = Math.sin(x * freq + hv * 6.283) * Math.cos(z * freq * 0.7 + hv * 2.1);
    const sz = Math.cos(x * freq * 1.1 + hv * 3.9) * Math.sin(z * freq * 0.9 + hv * 1.4);
    value += (sx + sz) * 0.5 * amp;
    total += amp;
    amp  *= 0.5;
    freq *= 2.1;
  }

  return value / total; // normalised to roughly [-1, 1]
}

/** Ridge noise for canyon-like features. */
function ridgeNoise(x: number, z: number): number {
  const n = terrainNoise(x, z, 3);
  return 1.0 - Math.abs(n);
}

// ---------------------------------------------------------------------------
// MarsTerrain
// ---------------------------------------------------------------------------
export class MarsTerrain {
  public mesh!:       THREE.Mesh;
  public heightData!: Float32Array;

  private _size:       number       = 2000;
  private _resolution: number       = 256;
  private _scene:      THREE.Scene  | null = null;

  // Instanced meshes kept for disposal
  private _rockInstances:   THREE.InstancedMesh[] = [];
  private _debrisInstances: THREE.Group[]          = [];
  private _mountainGroups:  THREE.Group[]          = [];

  // ---------------------------------------------------------------------------
  constructor() {
    // heightData and mesh are initialised in generate()
  }

  // ---------------------------------------------------------------------------
  /** Build and add the terrain mesh to the scene. */
  generate(scene: THREE.Scene, size = 2000, resolution = 256): void {
    this._scene      = scene;
    this._size       = size;
    this._resolution = resolution;

    const geo = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const vertCount = posAttr.count;

    this.heightData = new Float32Array(vertCount);

    // Displace vertices
    for (let i = 0; i < vertCount; i++) {
      const wx = posAttr.getX(i);
      const wz = posAttr.getZ(i);

      let h = this._sampleHeight(wx, wz);

      posAttr.setY(i, h);
      this.heightData[i] = h;
    }

    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // Vertex colours for surface variation
    const colors  = new Float32Array(vertCount * 3);
    const baseCol = new THREE.Color(0x8B4513); // Mars soil
    const darkCol = new THREE.Color(0x5a2d0c);
    const lightCol= new THREE.Color(0xb0582a);

    for (let i = 0; i < vertCount; i++) {
      const h  = this.heightData[i];
      const n  = (h + 15) / 30; // normalise height to [0,1] approx
      const c  = baseCol.clone().lerp(h > 5 ? lightCol : darkCol, Math.min(1, Math.max(0, n)));
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness:    0.97,
      metalness:    0.03,
    });

    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow    = false;
    this.mesh.name          = 'MarsTerrain';
    scene.add(this.mesh);
  }

  // ---------------------------------------------------------------------------
  /** Sample height at world-space (x, z). Uses bilinear interpolation over heightData. */
  getHeightAt(x: number, z: number): number {
    if (!this.heightData || !this.mesh) return 0;

    // Map world coords to grid coords
    const half = this._size / 2;
    const u = (x + half) / this._size; // [0, 1]
    const v = (z + half) / this._size;

    if (u < 0 || u > 1 || v < 0 || v > 1) return 0;

    const res  = this._resolution;
    const gx   = u * (res - 1);
    const gz   = v * (res - 1);
    const gxi  = Math.floor(gx);
    const gzi  = Math.floor(gz);
    const fx   = gx - gxi;
    const fz   = gz - gzi;

    const clamp = (val: number) => Math.min(res - 1, Math.max(0, val));

    const idx00 = clamp(gzi)     * res + clamp(gxi);
    const idx10 = clamp(gzi)     * res + clamp(gxi + 1);
    const idx01 = clamp(gzi + 1) * res + clamp(gxi);
    const idx11 = clamp(gzi + 1) * res + clamp(gxi + 1);

    const h00 = this.heightData[idx00] ?? 0;
    const h10 = this.heightData[idx10] ?? 0;
    const h01 = this.heightData[idx01] ?? 0;
    const h11 = this.heightData[idx11] ?? 0;

    return h00 * (1 - fx) * (1 - fz)
         + h10 * fx       * (1 - fz)
         + h01 * (1 - fx) * fz
         + h11 * fx       * fz;
  }

  // ---------------------------------------------------------------------------
  /** Scatter rocks across the terrain using InstancedMesh. */
  scatterRocks(scene: THREE.Scene, count = 300): void {
    // Rock geometry (slightly randomised sphere)
    const rockGeo = new THREE.SphereGeometry(1.0, 7, 5);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a3a22, roughness: 0.97, metalness: 0.05 });
    const instanced = new THREE.InstancedMesh(rockGeo, rockMat, count);
    instanced.castShadow = true;

    const dummy  = new THREE.Object3D();
    const rng    = mulberry32(31337);
    const half   = this._size * 0.48;

    for (let i = 0; i < count; i++) {
      const wx = (rng() - 0.5) * half * 2;
      const wz = (rng() - 0.5) * half * 2;
      const wy = this.getHeightAt(wx, wz);

      const scale = 0.3 + rng() * 1.8;
      dummy.position.set(wx, wy + scale * 0.4, wz);
      dummy.scale.set(scale * (0.8 + rng() * 0.4), scale * (0.5 + rng() * 0.5), scale * (0.8 + rng() * 0.4));
      dummy.rotation.set(rng() * 0.4, rng() * Math.PI * 2, rng() * 0.3);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
    scene.add(instanced);
    this._rockInstances.push(instanced);

    // Also scatter a few procedural rock groups for detail near spawn
    const detailCount = 20;
    for (let i = 0; i < detailCount; i++) {
      const wx = (rng() - 0.5) * 120;
      const wz = (rng() - 0.5) * 120;
      const wy = this.getHeightAt(wx, wz);
      const rock = createRock(0.5 + rng() * 2.0, Math.floor(rng() * 100));
      rock.position.set(wx, wy, wz);
      rock.rotation.y = rng() * Math.PI * 2;
      scene.add(rock);
    }
  }

  // ---------------------------------------------------------------------------
  /** Scatter debris around the landing site area. */
  scatterDebris(scene: THREE.Scene, count = 30): void {
    const rng  = mulberry32(77777);
    const half = 200;

    for (let i = 0; i < count; i++) {
      const wx = (rng() - 0.5) * half * 2;
      const wz = (rng() - 0.5) * half * 2;
      const wy = this.getHeightAt(wx, wz);
      const debris = createDebris();
      debris.position.set(wx, wy, wz);
      debris.rotation.y = rng() * Math.PI * 2;
      scene.add(debris);
      this._debrisInstances.push(debris);
    }
  }

  // ---------------------------------------------------------------------------
  /** Place distant mountain silhouettes around the perimeter. */
  createDistantMountains(scene: THREE.Scene): void {
    const mountainDefs: { x: number; z: number; width: number; height: number; seed: number }[] = [
      { x:  800, z: -600, width: 300, height: 180, seed: 1 },
      { x:  600, z: -850, width: 250, height: 140, seed: 2 },
      { x: -700, z: -700, width: 280, height: 160, seed: 3 },
      { x: -850, z:  400, width: 320, height: 200, seed: 4 },
      { x:  900, z:  500, width: 260, height: 150, seed: 5 },
      { x:  200, z: -950, width: 340, height: 170, seed: 6 },
      { x: -400, z: -900, width: 290, height: 130, seed: 7 },
      { x: -900, z: -200, width: 270, height: 155, seed: 8 },
    ];

    for (const def of mountainDefs) {
      const group = this._buildDistantMountain(def.width, def.height, def.seed);
      const groundH = this.getHeightAt(def.x, def.z);
      group.position.set(def.x, groundH, def.z);
      scene.add(group);
      this._mountainGroups.push(group);
    }
  }

  // ---------------------------------------------------------------------------
  /** Per-frame update (can be used for animated effects, e.g. dust). */
  update(_delta: number): void {
    // Future: dust particle drift, etc.
  }

  // ---------------------------------------------------------------------------
  /** Remove all terrain-related objects and release GPU memory. */
  dispose(): void {
    if (this._scene && this.mesh) {
      this._scene.remove(this.mesh);
    }
    this.mesh?.geometry.dispose();
    (this.mesh?.material as THREE.Material)?.dispose();

    for (const inst of this._rockInstances) {
      this._scene?.remove(inst);
      inst.geometry.dispose();
      (inst.material as THREE.Material).dispose();
      inst.dispose();
    }
    this._rockInstances = [];

    for (const d of this._debrisInstances) {
      this._scene?.remove(d);
      d.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.dispose();
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat.dispose();
        }
      });
    }
    this._debrisInstances = [];

    for (const m of this._mountainGroups) {
      this._scene?.remove(m);
      m.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.dispose();
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach(mi => mi.dispose());
          else mat.dispose();
        }
      });
    }
    this._mountainGroups = [];
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Compute the terrain height at local world (x, z) during generation. */
  private _sampleHeight(x: number, z: number): number {
    // Large-scale rolling hills
    const macro = terrainNoise(x, z, 4) * 12;

    // Mid-scale craters and ridges
    const mid = ridgeNoise(x * 0.5, z * 0.5) * 6;

    // Fine surface detail
    const fine = terrainNoise(x * 3, z * 3, 2) * 1.5;

    // Crater depression near centre (landing site should be flat-ish)
    const distFromCentre = Math.sqrt(x * x + z * z);
    const craterFlat = Math.max(0, 1.0 - distFromCentre / 180) * -8;

    return macro + mid * 0.4 + fine + craterFlat;
  }

  /** Build a simple distant mountain group (low-poly, no shadow). */
  private _buildDistantMountain(width: number, height: number, seed: number): THREE.Group {
    const g = new THREE.Group();

    const rng = mulberry32(seed * 99991);

    // Main cone
    const coneGeo = new THREE.ConeGeometry(width / 2, height, 10, 5);
    const pos = coneGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const yi = pos.getY(i);
      const factor = 1 - (yi + height / 2) / height;
      pos.setX(i, pos.getX(i) + (rng() - 0.5) * factor * width * 0.12);
      pos.setZ(i, pos.getZ(i) + (rng() - 0.5) * factor * width * 0.12);
    }
    coneGeo.computeVertexNormals();

    const mainMat = new THREE.MeshStandardMaterial({ color: 0x6a3a2a, roughness: 0.97, metalness: 0.03 });
    const main = new THREE.Mesh(coneGeo, mainMat);
    main.position.y = height / 2;
    g.add(main);

    // Sub-peak
    const subH = height * 0.55;
    const subGeo = new THREE.ConeGeometry(width * 0.3, subH, 8, 3);
    const subMat = new THREE.MeshStandardMaterial({ color: 0x5a2d1a, roughness: 0.97, metalness: 0.03 });
    const sub = new THREE.Mesh(subGeo, subMat);
    sub.position.set(width * 0.25, subH / 2, width * 0.1);
    g.add(sub);

    return g;
  }
}

// ---------------------------------------------------------------------------
// Mulberry32 PRNG (deterministic, seed-based)
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
