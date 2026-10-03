import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
//  Vertex shader – draws a fullscreen triangle without a geometry buffer
// ─────────────────────────────────────────────────────────────────────────────
const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Fragment shader – vignette + subtle colour grading
//  All values are driven by uniforms so they can be tweaked at runtime.
// ─────────────────────────────────────────────────────────────────────────────
const COMPOSITE_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D tScene;
uniform vec2      uResolution;
uniform float     uVignetteStrength;   // 0 = none, 1 = heavy vignette
uniform float     uVignetteSoftness;   // edge falloff radius
uniform float     uSaturation;         // 1 = neutral, < 1 desaturated
uniform float     uContrast;           // 1 = neutral
uniform float     uBrightness;         // 0 = neutral
uniform float     uBloomStrength;      // fake bloom via overexposure boost
uniform bool      uBloomEnabled;

varying vec2 vUv;

// ── Helpers ─────────────────────────────────────────────────────────────────

vec3 applyColorGrading(vec3 color) {
  // Brightness
  color += uBrightness;

  // Contrast  (pivot at 0.5)
  color = (color - 0.5) * uContrast + 0.5;

  // Saturation
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(lum), color, uSaturation);

  return color;
}

float vignette(vec2 uv, float strength, float softness) {
  vec2 d = uv - 0.5;
  float dist = length(d);
  return 1.0 - smoothstep(softness, softness + (1.0 - softness) * 0.5, dist * strength);
}

// ── Simple bloom approximation: sample neighbours, brighten ─────────────────
vec3 cheapBloom(sampler2D tex, vec2 uv, float strength) {
  if (!uBloomEnabled || strength <= 0.0) return vec3(0.0);

  vec2 texel = 1.0 / uResolution;
  vec3 acc = vec3(0.0);
  float total = 0.0;

  // 9-tap cross + diagonals with larger offsets to fake glow spread
  float offsets[5];
  offsets[0] = 0.0;
  offsets[1] = 3.0;
  offsets[2] = -3.0;
  offsets[3] = 6.0;
  offsets[4] = -6.0;

  for (int x = 0; x < 5; x++) {
    for (int y = 0; y < 5; y++) {
      vec2 offset = vec2(offsets[x], offsets[y]) * texel;
      vec3 sample_ = texture2D(tex, uv + offset).rgb;
      // Only bright pixels contribute to bloom
      float brightness = dot(sample_, vec3(0.2126, 0.7152, 0.0722));
      float weight = max(0.0, brightness - 0.6);
      acc += sample_ * weight;
      total += weight;
    }
  }

  if (total > 0.0) acc /= total;
  return acc * strength;
}

void main() {
  vec4 sceneColor = texture2D(tScene, vUv);
  vec3 color = sceneColor.rgb;

  // Fake bloom (screen-space brightening of highlights)
  vec3 bloom = cheapBloom(tScene, vUv, uBloomStrength);
  color += bloom;

  // Colour grading
  color = applyColorGrading(color);

  // Vignette
  float vig = vignette(vUv, uVignetteStrength, uVignetteSoftness);
  color *= vig;

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Lightweight post-processing pipeline that renders the scene into a
 * WebGLRenderTarget and then composites the result through a fullscreen
 * ShaderMaterial (vignette + colour grading + optional fake bloom).
 *
 * Deliberately avoids any import from 'three/examples/jsm'.
 */
export class PostProcessing {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  /** Offscreen render target that receives the 3-D scene. */
  private renderTarget!: THREE.WebGLRenderTarget;

  /** Fullscreen quad geometry + composite material. */
  private quadScene!: THREE.Scene;
  private quadCamera!: THREE.OrthographicCamera;
  private quadMesh!: THREE.Mesh;
  private compositeMaterial!: THREE.ShaderMaterial;

  // Bloom state (stored so setters work before init)
  private bloomEnabled: boolean = true;
  private bloomStrength: number = 0.4;

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Initialises all GPU resources.  Must be called before `render()`.
   */
  public init(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const { width, height } = this.getRendererSize();

    // ── Off-screen render target ─────────────────────────────────────────────
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType, // HDR headroom for bloom extraction
      colorSpace: THREE.NoColorSpace,
    });

    // ── Composite material ───────────────────────────────────────────────────
    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tScene:            { value: this.renderTarget.texture },
        uResolution:       { value: new THREE.Vector2(width, height) },
        uVignetteStrength: { value: 1.6 },
        uVignetteSoftness: { value: 0.5 },
        uSaturation:       { value: 1.1 },   // slight Martian colour pop
        uContrast:         { value: 1.05 },
        uBrightness:       { value: 0.0 },
        uBloomStrength:    { value: this.bloomStrength },
        uBloomEnabled:     { value: this.bloomEnabled },
      },
      depthTest: false,
      depthWrite: false,
    });

    // ── Fullscreen quad ──────────────────────────────────────────────────────
    // A simple PlaneGeometry covering NDC [-1, 1] in both axes.
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(quadGeo, this.compositeMaterial);
    this.quadMesh.frustumCulled = false;

    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quadMesh);

    // Orthographic camera perfectly aligned with NDC
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /**
   * Renders the 3-D scene to a texture, then composites with post effects.
   * Replace your direct `renderer.render(scene, camera)` calls with this.
   */
  public render(): void {
    // Pass 1 – render scene into off-screen target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // Pass 2 – composite to screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  /**
   * Enables or disables the fake screen-space bloom pass.
   */
  public setBloomEnabled(enabled: boolean): void {
    this.bloomEnabled = enabled;
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms['uBloomEnabled'].value = enabled;
    }
  }

  /**
   * Sets the intensity of the fake bloom effect.
   * @param strength - Typical range 0 – 1.  Values above 1 produce heavy glow.
   */
  public setBloomStrength(strength: number): void {
    this.bloomStrength = strength;
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms['uBloomStrength'].value = strength;
    }
  }

  /**
   * Sets the vignette darkening intensity (0 = off, 2 = heavy).
   */
  public setVignetteStrength(strength: number): void {
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms['uVignetteStrength'].value = strength;
    }
  }

  /**
   * Sets the colour saturation multiplier (1 = neutral, 0 = greyscale).
   */
  public setSaturation(saturation: number): void {
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms['uSaturation'].value = saturation;
    }
  }

  /**
   * Must be called whenever the renderer canvas is resized so the
   * off-screen render target matches the output resolution.
   */
  public resize(width: number, height: number): void {
    if (!this.renderTarget) return;
    this.renderTarget.setSize(width, height);
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms['uResolution'].value.set(width, height);
    }
  }

  /**
   * Frees GPU resources held by the post-processing pipeline.
   */
  public dispose(): void {
    this.renderTarget?.dispose();
    this.compositeMaterial?.dispose();
    this.quadMesh?.geometry.dispose();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private getRendererSize(): { width: number; height: number } {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    return { width: size.x, height: size.y };
  }
}
