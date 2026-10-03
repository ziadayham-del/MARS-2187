import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
//  Sky dome shaders – procedural gradient from rust horizon to deep-space zenith
// ─────────────────────────────────────────────────────────────────────────────

const SKY_VERT = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uHorizonColor;
uniform vec3 uZenithColor;
uniform float uHorizonSharpness; // higher = sharper horizon band

varying vec3 vWorldPos;

void main() {
  // Normalised height in [0, 1] where 0 = horizon, 1 = directly above
  float t = clamp(vWorldPos.y / 500.0, 0.0, 1.0);
  t = pow(t, uHorizonSharpness);

  vec3 color = mix(uHorizonColor, uZenithColor, t);
  gl_FragColor = vec4(color, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Weather presets
// ─────────────────────────────────────────────────────────────────────────────

interface WeatherPreset {
  fogColor: number;
  fogDensity: number;
  dustOpacity: number;
  dustSpeed: number;
  skyHorizon: THREE.Color;
  skyZenith: THREE.Color;
}

const WEATHER_PRESETS: Record<'clear' | 'hazy' | 'storm', WeatherPreset> = {
  clear: {
    fogColor:    0xc86038,
    fogDensity:  0.002,
    dustOpacity: 0.15,
    dustSpeed:   0.4,
    skyHorizon:  new THREE.Color(0xc86038),
    skyZenith:   new THREE.Color(0x1a0a04),
  },
  hazy: {
    fogColor:    0xa84c28,
    fogDensity:  0.006,
    dustOpacity: 0.45,
    dustSpeed:   0.9,
    skyHorizon:  new THREE.Color(0xa84c28),
    skyZenith:   new THREE.Color(0x2a0c04),
  },
  storm: {
    fogColor:    0x6a2810,
    fogDensity:  0.015,
    dustOpacity: 0.85,
    dustSpeed:   2.5,
    skyHorizon:  new THREE.Color(0x5a1a08),
    skyZenith:   new THREE.Color(0x110402),
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Procedural Martian environment: sky dome, star field, sun disc, atmospheric
 * dust particles, and scene fog.  All GPU resources are managed here – call
 * `dispose()` on teardown.
 */
export class Environment {
  private scene!: THREE.Scene;

  private skyDome!: THREE.Mesh;
  private skyMaterial!: THREE.ShaderMaterial;
  private stars!: THREE.Points;
  private sunDisc!: THREE.Mesh;
  private dustParticles!: THREE.Points;
  private dustMaterial!: THREE.PointsMaterial;

  /** Original (seed) positions for each dust particle. */
  private dustPositions!: Float32Array;
  private dustVelocities!: Float32Array;

  private currentWeather: WeatherPreset = WEATHER_PRESETS.clear;

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Creates the full Martian environment and adds everything to `scene`.
   * Call once after the scene is created.
   */
  public init(scene: THREE.Scene): void {
    this.scene = scene;

    this.createSkyDome(scene);
    this.createStars(scene);
    this.createSunDisc(scene);
    this.createDustParticles(scene);
    this.setWeather('clear');
  }

  // ── Sky dome ───────────────────────────────────────────────────────────────

  /**
   * Builds a large inverted sphere whose interior is shaded with a procedural
   * rust-to-void gradient.  Returns the mesh (already added to the scene).
   */
  public createSkyDome(scene: THREE.Scene): THREE.Mesh {
    const geo = new THREE.SphereGeometry(900, 32, 16);
    // Flip normals inward so the inside surface is rendered
    geo.scale(-1, 1, 1);

    this.skyMaterial = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: {
        uHorizonColor:    { value: new THREE.Color(0xc86038) },
        uZenithColor:     { value: new THREE.Color(0x1a0a04) },
        uHorizonSharpness:{ value: 0.55 },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.skyDome = new THREE.Mesh(geo, this.skyMaterial);
    this.skyDome.renderOrder = -1000;
    scene.add(this.skyDome);
    return this.skyDome;
  }

  // ── Star field ─────────────────────────────────────────────────────────────

  /**
   * Generates a static star field as a `THREE.Points` object.
   * Stars are placed on a large sphere around the origin.
   */
  public createStars(scene: THREE.Scene): THREE.Points {
    const STAR_COUNT = 3000;
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors    = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform random direction on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 850 + Math.random() * 20;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Slight colour variation: blue-white to warm yellow
      const warm = Math.random();
      colors[i * 3 + 0] = 0.8 + warm * 0.2;
      colors[i * 3 + 1] = 0.85 + warm * 0.1;
      colors[i * 3 + 2] = 1.0 - warm * 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      sizeAttenuation: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.0, // hidden during daytime; caller uses setWeather / fade
    });

    this.stars = new THREE.Points(geo, mat);
    this.stars.renderOrder = -999;
    scene.add(this.stars);
    return this.stars;
  }

  // ── Sun disc ───────────────────────────────────────────────────────────────

  /**
   * Creates a bright, slightly glowing disc to represent the distant Martian sun.
   * Returns the mesh (already added to the scene).
   */
  public createSunDisc(scene: THREE.Scene): THREE.Mesh {
    const geo = new THREE.CircleGeometry(18, 32);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff0c0,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.sunDisc = new THREE.Mesh(geo, mat);
    // Position matches default daytime sun direction (normalised × 800)
    const dir = new THREE.Vector3(100, 150, -80).normalize().multiplyScalar(800);
    this.sunDisc.position.copy(dir);
    this.sunDisc.lookAt(0, 0, 0);
    this.sunDisc.renderOrder = -998;
    scene.add(this.sunDisc);
    return this.sunDisc;
  }

  // ── Dust particles ─────────────────────────────────────────────────────────

  /**
   * Spawns a field of floating dust motes visible in the middle distance.
   * Returns the `THREE.Points` object (already added to the scene).
   */
  public createDustParticles(scene: THREE.Scene): THREE.Points {
    const COUNT = 2000;
    this.dustPositions  = new Float32Array(COUNT * 3);
    this.dustVelocities = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      // Distribute in a box around the player start position
      this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      this.dustPositions[i * 3 + 1] = Math.random() * 18;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      // Gentle drift + upward creep
      this.dustVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.3;
      this.dustVelocities[i * 3 + 1] = (Math.random()) * 0.05;
      this.dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.dustPositions, 3),
    );

    this.dustMaterial = new THREE.PointsMaterial({
      color: 0xd4622a,
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });

    this.dustParticles = new THREE.Points(geo, this.dustMaterial);
    scene.add(this.dustParticles);
    return this.dustParticles;
  }

  // ── Weather ────────────────────────────────────────────────────────────────

  /**
   * Applies a weather preset – adjusts fog, particle density, and sky gradient.
   */
  public setWeather(state: 'clear' | 'hazy' | 'storm'): void {
    this.currentWeather = WEATHER_PRESETS[state];
    const p = this.currentWeather;

    // Sky gradient
    if (this.skyMaterial) {
      this.skyMaterial.uniforms['uHorizonColor'].value.copy(p.skyHorizon);
      this.skyMaterial.uniforms['uZenithColor'].value.copy(p.skyZenith);
    }

    // Dust opacity
    if (this.dustMaterial) {
      this.dustMaterial.opacity = p.dustOpacity;
    }

    // Scene fog
    if (this.scene) {
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.set(p.fogColor);
        this.scene.fog.density = p.fogDensity;
      } else {
        // If no fog has been created yet, create it now
        this.createFog(this.scene, p.fogColor, p.fogDensity);
      }
    }

    // Dim stars during storm (particles fill the sky instead)
    if (this.stars) {
      const starMat = this.stars.material as THREE.PointsMaterial;
      starMat.opacity = state === 'storm' ? 0.0 : 0.8;
    }
  }

  // ── Per-frame update ───────────────────────────────────────────────────────

  /**
   * Animates dust particle drift and gently rotates the sun disc.
   *
   * @param delta - Seconds since last frame.
   * @param time  - Total elapsed time in seconds (used for oscillations).
   */
  public update(delta: number, time: number): void {
    this.updateDust(delta, time);

    // Slowly drift the sun disc (Phobos-era time-lapse feel)
    if (this.sunDisc) {
      const angle = time * 0.001; // very slow
      const r = 800;
      const x = Math.cos(angle) * r * 0.15 + r * 0.1;
      const y = 150 + Math.sin(time * 0.0003) * 10;
      const z = -80;
      this.sunDisc.position.set(x, y, z);
      this.sunDisc.lookAt(0, 0, 0);
    }
  }

  // ── Fog helper ─────────────────────────────────────────────────────────────

  /**
   * Creates exponential fog on the scene and returns the fog object.
   * If the scene already has fog it is replaced.
   *
   * @param scene   - Target scene.
   * @param color   - Hex fog colour.
   * @param density - FogExp2 density coefficient.
   */
  public createFog(
    scene: THREE.Scene,
    color: number,
    density: number,
  ): THREE.FogExp2 {
    const fog = new THREE.FogExp2(color, density);
    scene.fog = fog;
    scene.background = new THREE.Color(color);
    return fog;
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /** Disposes all GPU resources and removes objects from the scene. */
  public dispose(): void {
    const remove = (obj: THREE.Object3D | undefined, mat?: THREE.Material, geo?: THREE.BufferGeometry) => {
      if (!obj) return;
      this.scene?.remove(obj);
      mat?.dispose();
      geo?.dispose();
    };

    if (this.skyDome) {
      remove(this.skyDome, this.skyMaterial, this.skyDome.geometry as THREE.BufferGeometry);
    }
    if (this.stars) {
      remove(this.stars, this.stars.material as THREE.Material, this.stars.geometry as THREE.BufferGeometry);
    }
    if (this.sunDisc) {
      remove(this.sunDisc, this.sunDisc.material as THREE.Material, this.sunDisc.geometry as THREE.BufferGeometry);
    }
    if (this.dustParticles) {
      remove(this.dustParticles, this.dustMaterial, this.dustParticles.geometry as THREE.BufferGeometry);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private updateDust(delta: number, _time: number): void {
    if (!this.dustParticles) return;

    const speed = this.currentWeather.dustSpeed;
    const geo   = this.dustParticles.geometry;
    const pos   = geo.attributes['position'] as THREE.BufferAttribute;
    const arr   = pos.array as Float32Array;
    const HALF  = 60; // half-extent of the dust volume

    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 0] += this.dustVelocities[i * 3 + 0] * delta * speed;
      arr[i * 3 + 1] += this.dustVelocities[i * 3 + 1] * delta * speed;
      arr[i * 3 + 2] += this.dustVelocities[i * 3 + 2] * delta * speed;

      // Wrap particles that escape the volume
      if (arr[i * 3 + 0] >  HALF) arr[i * 3 + 0] = -HALF;
      if (arr[i * 3 + 0] < -HALF) arr[i * 3 + 0] =  HALF;
      if (arr[i * 3 + 1] >  18  ) arr[i * 3 + 1] =  0;
      if (arr[i * 3 + 2] >  HALF) arr[i * 3 + 2] = -HALF;
      if (arr[i * 3 + 2] < -HALF) arr[i * 3 + 2] =  HALF;
    }

    pos.needsUpdate = true;
  }
}
