// ============================================================
//  MARS: 2187  –  AssetManager.ts
//  Procedural texture generation and material caching.
// ============================================================

import * as THREE from 'three';

export type ProceduralTextureType =
  | 'metal'
  | 'rust'
  | 'concrete'
  | 'soil'
  | 'panel'
  | 'emissive'
  | 'rock';

export class AssetManager {
  // ---- Singleton -------------------------------------------------------------
  private static _instance: AssetManager | null = null;

  public static getInstance(): AssetManager {
    if (!AssetManager._instance) {
      AssetManager._instance = new AssetManager();
    }
    return AssetManager._instance;
  }

  private constructor() {}

  // ---- Caches ----------------------------------------------------------------
  private readonly _textureCache: Map<string, THREE.CanvasTexture> = new Map();
  private readonly _materialCache: Map<string, THREE.Material> = new Map();

  // ---- Procedural textures ---------------------------------------------------

  /**
   * Generate (or return cached) a procedural CanvasTexture.
   * @param type  Texture category.
   * @param size  Canvas size in pixels (power-of-2 recommended, e.g. 256).
   */
  public createProceduralTexture(
    type: ProceduralTextureType,
    size = 256,
  ): THREE.CanvasTexture {
    const cacheKey = `${type}_${size}`;
    const cached = this._textureCache.get(cacheKey);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    switch (type) {
      case 'metal':     this._drawMetal(ctx, size);    break;
      case 'rust':      this._drawRust(ctx, size);     break;
      case 'concrete':  this._drawConcrete(ctx, size); break;
      case 'soil':      this._drawSoil(ctx, size);     break;
      case 'panel':     this._drawPanel(ctx, size);    break;
      case 'emissive':  this._drawEmissive(ctx, size); break;
      case 'rock':      this._drawRock(ctx, size);     break;
      default: {
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, size, size);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    this._textureCache.set(cacheKey, texture);
    return texture;
  }

  // ---- Material cache --------------------------------------------------------

  /**
   * Return a cached material by name, or create it via the provided factory.
   * If no factory is provided and the material is not cached, a default
   * MeshStandardMaterial is returned.
   */
  public getMaterial(
    name: string,
    factory?: () => THREE.Material,
  ): THREE.Material {
    const cached = this._materialCache.get(name);
    if (cached) return cached;

    const mat = factory ? factory() : new THREE.MeshStandardMaterial({ color: 0x888888 });
    this._materialCache.set(name, mat);
    return mat;
  }

  /**
   * Pre-build and cache a standard set of game materials.
   * Call once during the loading phase.
   */
  public buildDefaultMaterials(): void {
    // Metal hull
    this.getMaterial('metal_hull', () => {
      const mat = new THREE.MeshStandardMaterial({
        map:         this.createProceduralTexture('metal', 512),
        roughness:   0.35,
        metalness:   0.85,
        color:       new THREE.Color(0x8899aa),
      });
      return mat;
    });

    // Rust surface
    this.getMaterial('rust', () => {
      const mat = new THREE.MeshStandardMaterial({
        map:       this.createProceduralTexture('rust', 512),
        roughness: 0.9,
        metalness: 0.2,
        color:     new THREE.Color(0xaa5533),
      });
      return mat;
    });

    // Concrete floor / wall
    this.getMaterial('concrete', () => {
      return new THREE.MeshStandardMaterial({
        map:       this.createProceduralTexture('concrete', 512),
        roughness: 0.95,
        metalness: 0.0,
        color:     new THREE.Color(0x888880),
      });
    });

    // Martian soil
    this.getMaterial('soil', () => {
      return new THREE.MeshStandardMaterial({
        map:       this.createProceduralTexture('soil', 512),
        roughness: 1.0,
        metalness: 0.0,
        color:     new THREE.Color(0xaa6644),
      });
    });

    // Control panel
    this.getMaterial('panel', () => {
      return new THREE.MeshStandardMaterial({
        map:         this.createProceduralTexture('panel', 256),
        roughness:   0.5,
        metalness:   0.6,
        color:       new THREE.Color(0x334455),
        emissive:    new THREE.Color(0x001122),
        emissiveIntensity: 0.3,
      });
    });

    // Emissive / glowing surface
    this.getMaterial('emissive_glow', () => {
      return new THREE.MeshStandardMaterial({
        emissiveMap: this.createProceduralTexture('emissive', 256),
        emissive:    new THREE.Color(0x00aaff),
        emissiveIntensity: 2.0,
        roughness:   1.0,
        metalness:   0.0,
      });
    });

    // Rock formation
    this.getMaterial('rock', () => {
      return new THREE.MeshStandardMaterial({
        map:       this.createProceduralTexture('rock', 512),
        roughness: 0.9,
        metalness: 0.05,
        color:     new THREE.Color(0x664433),
      });
    });
  }

  // ---- Dispose ---------------------------------------------------------------

  /** Dispose all cached textures and materials. */
  public dispose(): void {
    for (const texture of this._textureCache.values()) {
      texture.dispose();
    }
    this._textureCache.clear();

    for (const material of this._materialCache.values()) {
      material.dispose();
    }
    this._materialCache.clear();

    console.info('[AssetManager] All cached assets disposed.');
  }

  // ---- Private draw helpers --------------------------------------------------

  /** Brushed metal: mid-grey base + horizontal streaks + noise. */
  private _drawMetal(ctx: CanvasRenderingContext2D, size: number): void {
    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0,    '#9aabb8');
    grad.addColorStop(0.4,  '#c5d0d8');
    grad.addColorStop(0.6,  '#8899a8');
    grad.addColorStop(1.0,  '#a0b0bd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Horizontal streaks
    ctx.globalAlpha = 0.15;
    for (let y = 0; y < size; y += 2) {
      const light = Math.random() > 0.5;
      ctx.fillStyle = light ? '#ffffff' : '#334455';
      ctx.fillRect(0, y, size, 1);
    }

    // Fine noise
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < size * size * 0.1; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = Math.floor(Math.random() * 80 + 120).toString(16).padStart(2, '0');
      ctx.fillStyle = `#${v}${v}${v}`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1.0;
  }

  /** Rust: orange-brown base + blotchy darker patches + grain. */
  private _drawRust(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = '#8b3a1a';
    ctx.fillRect(0, 0, size, size);

    // Blotchy patches
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * size * 0.12 + 4;
      const rads = [
        '#6b2a0a', '#a04010', '#c05020', '#8b3a1a', '#3d1508',
      ];
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0,   rads[Math.floor(Math.random() * rads.length)]);
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + Math.random()), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Surface grain
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < size * size * 0.12; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffaa44' : '#220800';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1.0;
  }

  /** Concrete: light grey base + cracks + aggregate noise. */
  private _drawConcrete(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = '#919188';
    ctx.fillRect(0, 0, size, size);

    // Aggregate speckles
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < size * size * 0.08; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = Math.random() * 3 + 1;
      const v = Math.floor(Math.random() * 60 + 110);
      ctx.fillStyle = `rgb(${v},${v},${v - 5})`;
      ctx.fillRect(x, y, s, s);
    }

    // Cracks
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#5a5a52';
    ctx.lineWidth = 1;
    const numCracks = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numCracks; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      const steps = 4 + Math.floor(Math.random() * 6);
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      for (let s = 0; s < steps; s++) {
        cx += (Math.random() - 0.5) * size * 0.25;
        cy += (Math.random() - 0.5) * size * 0.25;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  /** Martian soil: terracotta base + irregular patches + dust. */
  private _drawSoil(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = '#b05a30';
    ctx.fillRect(0, 0, size, size);

    // Variation patches
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * size * 0.18 + 5;
      const colors = ['#8b3a18', '#c87040', '#d4885a', '#7a3010'];
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0,   colors[Math.floor(Math.random() * colors.length)]);
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine dust
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < size * size * 0.15; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffcc99' : '#5a2000';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1.0;
  }

  /** Sci-fi panel: dark base + grid lines + indicators. */
  private _drawPanel(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = '#1a2430';
    ctx.fillRect(0, 0, size, size);

    // Major grid lines
    ctx.strokeStyle = '#2a3f55';
    ctx.lineWidth = 1;
    const gridStep = size / 8;
    for (let i = 0; i <= 8; i++) {
      const p = i * gridStep;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }

    // Panel screw holes at corners of grid cells
    ctx.fillStyle = '#0d1820';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 3 === 0) {
          const cx = col * gridStep + gridStep / 2;
          const cy = row * gridStep + gridStep / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Indicator lights
    const indicatorColors = ['#00ff88', '#ff4422', '#0088ff', '#ffcc00'];
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() * 0.8 + 0.1) * size;
      const y = (Math.random() * 0.8 + 0.1) * size;
      const color = indicatorColors[Math.floor(Math.random() * indicatorColors.length)];
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  /** Emissive / energy: dark base + glowing veins. */
  private _drawEmissive(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, size, size);

    // Glowing veins
    const hues = ['#003399', '#0055ff', '#00aaff', '#33ccff'];
    for (let i = 0; i < 20; i++) {
      const x1 = Math.random() * size;
      const y1 = Math.random() * size;
      const x2 = Math.random() * size;
      const y2 = Math.random() * size;
      const color = hues[Math.floor(Math.random() * hues.length)];

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0,   'rgba(0,0,0,0)');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size,
        x2, y2,
      );
      ctx.stroke();
    }

    // Glowing nodes
    ctx.globalAlpha = 1.0;
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 10 + 4;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0,   '#88eeff');
      grad.addColorStop(0.4, '#0055ff');
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Rock: dark brownish base + layered facet-like patches. */
  private _drawRock(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = '#4a3025';
    ctx.fillRect(0, 0, size, size);

    // Stratification layers
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = Math.random() * size * 0.4 + 10;
      const h = Math.random() * size * 0.08 + 2;
      const colors = ['#3a2010', '#5a3a25', '#7a5535', '#6a4228', '#302010'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.globalAlpha = 0.4 + Math.random() * 0.4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Highlight flecks (mineral specks)
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < size * size * 0.04; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.7 ? '#ccaa88' : '#221410';
      ctx.fillRect(x, y, 1, 1);
    }

    // Dark crack lines
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.lineTo(Math.random() * size, Math.random() * size);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
}

// Default singleton
const assetManager = AssetManager.getInstance();
export default assetManager;
