import * as THREE from 'three';

/**
 * Quality presets for the renderer.
 * Controls pixel ratio, shadow map resolution, and shadow type.
 */
export type RenderQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

interface QualitySettings {
  pixelRatio: number;
  shadowMapSize: number;
  shadowType: THREE.ShadowMapType;
}

const QUALITY_PRESETS: Record<RenderQuality, QualitySettings> = {
  LOW: {
    pixelRatio: 0.75,
    shadowMapSize: 512,
    shadowType: THREE.BasicShadowMap,
  },
  MEDIUM: {
    pixelRatio: 1.0,
    shadowMapSize: 1024,
    shadowType: THREE.PCFShadowMap,
  },
  HIGH: {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMapSize: 2048,
    shadowType: THREE.PCFSoftShadowMap,
  },
  ULTRA: {
    pixelRatio: window.devicePixelRatio,
    shadowMapSize: 4096,
    shadowType: THREE.VSMShadowMap,
  },
};

/**
 * Core renderer encapsulating the Three.js WebGLRenderer, scene, and camera.
 * Handles quality settings, shadow maps, tone mapping, and resize events.
 */
export class Renderer {
  public renderer!: THREE.WebGLRenderer;
  public camera!: THREE.PerspectiveCamera;
  public scene!: THREE.Scene;

  private canvas: HTMLCanvasElement;
  private currentQuality: RenderQuality = 'HIGH';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Initialises the WebGLRenderer, scene, and camera with sensible Martian defaults.
   */
  public init(): void {
    // ── Renderer ────────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });

    const preset = QUALITY_PRESETS[this.currentQuality];

    this.renderer.setPixelRatio(preset.pixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);

    // Shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = preset.shadowType;

    // Tone mapping – ACES filmic gives a cinematic Martian look
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Linear colour workflow
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Physically correct lighting model

    // ── Scene ───────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();

    // ── Camera ──────────────────────────────────────────────────────────────
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.05, 2000);
    this.camera.position.set(0, 1.7, 0); // approximate eye height
  }

  /**
   * Resizes the renderer and camera to match the current canvas client dimensions.
   * Call this from a ResizeObserver or window 'resize' listener.
   */
  public resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Renders the scene from the perspective camera. Call once per animation frame.
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Adjusts pixel ratio, shadow map size, and shadow type for the given quality preset.
   * Note: changing shadow map size requires shadow-casting objects to update their
   * shadow cameras – a full scene rebuild is not required.
   *
   * @param quality - One of 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'
   */
  public setQuality(quality: RenderQuality): void {
    this.currentQuality = quality;
    const preset = QUALITY_PRESETS[quality];

    this.renderer.setPixelRatio(preset.pixelRatio);
    this.renderer.shadowMap.type = preset.shadowType;

    // Update the shadow map size of every shadow-casting light in the scene
    this.scene.traverse((object) => {
      if (
        (object instanceof THREE.DirectionalLight ||
          object instanceof THREE.SpotLight ||
          object instanceof THREE.PointLight) &&
        object.castShadow
      ) {
        object.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
        // Force Three.js to rebuild the shadow map on next render
        if (object.shadow.map) {
          object.shadow.map.dispose();
          (object.shadow as THREE.LightShadow & { map: THREE.WebGLRenderTarget | null }).map = null;
        }
      }
    });

    this.renderer.shadowMap.needsUpdate = true;
  }

  /**
   * Releases all GPU resources held by the renderer.
   */
  public dispose(): void {
    this.renderer.dispose();
  }
}
