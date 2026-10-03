import * as THREE from 'three';

// ── Preset definitions ────────────────────────────────────────────────────────

interface TimeOfDayPreset {
  sunPosition: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  fogColor: number;
  fogDensity: number;
}

const TIME_PRESETS: Record<'day' | 'sunset' | 'storm', TimeOfDayPreset> = {
  day: {
    sunPosition:      new THREE.Vector3(100, 150, -80),
    sunColor:         new THREE.Color(0xfff5e0),  // slightly warm white
    sunIntensity:     3.5,
    ambientColor:     new THREE.Color(0xd4744a),  // Martian ambient bounce
    ambientIntensity: 1.2,
    fogColor:         0xc1603a,
    fogDensity:       0.002,
  },
  sunset: {
    sunPosition:      new THREE.Vector3(200, 20, -50),
    sunColor:         new THREE.Color(0xff6600),  // deep orange
    sunIntensity:     2.0,
    ambientColor:     new THREE.Color(0x7a3318),
    ambientIntensity: 0.8,
    fogColor:         0x8b3a1e,
    fogDensity:       0.004,
  },
  storm: {
    sunPosition:      new THREE.Vector3(80, 60, -100),
    sunColor:         new THREE.Color(0x9e5c2c),
    sunIntensity:     0.8,
    ambientColor:     new THREE.Color(0x3d1a08),
    ambientIntensity: 0.4,
    fogColor:         0x5a2b10,
    fogDensity:       0.012,
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages all scene lighting for MARS: 2187.
 * Handles sun, ambient, interior colony lights, flashlight, and emergency
 * point lights.  Call `init()` first, then `setTimeOfDay()` to apply a preset.
 */
export class Lighting {
  public scene!: THREE.Scene;
  public sunLight!: THREE.DirectionalLight;
  public ambientLight!: THREE.AmbientLight;

  private flashlight!: THREE.SpotLight;
  private flashlightEnabled: boolean = false;

  private interiorLights: THREE.PointLight[] = [];
  private emergencyLights: THREE.PointLight[] = [];

  // ── Initialisation ─────────────────────────────────────────────────────────

  /**
   * Creates and adds the primary sun and ambient lights to `scene`.
   * Defaults to daytime.
   */
  public init(scene: THREE.Scene): void {
    this.scene = scene;

    // ── Ambient ──────────────────────────────────────────────────────────────
    this.ambientLight = new THREE.AmbientLight(0xd4744a, 1.2);
    scene.add(this.ambientLight);

    // ── Directional sun ──────────────────────────────────────────────────────
    this.sunLight = new THREE.DirectionalLight(0xfff5e0, 3.5);
    this.sunLight.position.set(100, 150, -80);
    this.sunLight.castShadow = true;
    this.configureSunShadow(this.sunLight, 2048);
    scene.add(this.sunLight);

    // Shadow target stays at origin
    scene.add(this.sunLight.target);
    this.sunLight.target.position.set(0, 0, 0);

    // ── Flashlight ───────────────────────────────────────────────────────────
    this.flashlight = this.createFlashlight();
    this.flashlight.visible = false;
    scene.add(this.flashlight);
    // SpotLight target must also be in the scene
    scene.add(this.flashlight.target);

    // Apply default preset
    this.setTimeOfDay('day');
  }

  // ── Time of day ────────────────────────────────────────────────────────────

  /**
   * Transitions the sun and ambient light to a given time-of-day preset.
   * Also adjusts scene fog if fog has been set.
   */
  public setTimeOfDay(state: 'day' | 'sunset' | 'storm'): void {
    const p = TIME_PRESETS[state];

    this.sunLight.position.copy(p.sunPosition);
    this.sunLight.color.copy(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;

    this.ambientLight.color.copy(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(p.fogColor);
      this.scene.fog.density = p.fogDensity;
    }
  }

  // ── Interior lighting ──────────────────────────────────────────────────────

  /**
   * Adds a set of warm point lights typical of a pressurised colony interior.
   * Lights are placed in a grid pattern on the ceiling plane.
   */
  public addInteriorLighting(scene: THREE.Scene): void {
    const positions: [number, number, number][] = [
      [-4, 3.5, -6],
      [ 4, 3.5, -6],
      [ 0, 3.5,  0],
      [-4, 3.5,  6],
      [ 4, 3.5,  6],
    ];

    for (const [x, y, z] of positions) {
      const light = new THREE.PointLight(0xffd080, 2.5, 12, 2);
      light.position.set(x, y, z);
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 15;
      scene.add(light);
      this.interiorLights.push(light);
    }
  }

  // ── Emergency lights ───────────────────────────────────────────────────────

  /**
   * Creates a pulsing emergency point light (red by default) at the given world position.
   * The caller is responsible for adding it to the scene if desired, or it is
   * returned so the game can manage its lifecycle.
   *
   * @param position - World-space position for the light source.
   * @param color    - Hex colour; defaults to bright red (0xff2200).
   */
  public createEmergencyLight(
    position: THREE.Vector3,
    color: number = 0xff2200,
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, 4.0, 8, 2);
    light.position.copy(position);
    light.castShadow = false; // emergency lights are cheap – no shadows
    this.scene.add(light);
    this.emergencyLights.push(light);
    return light;
  }

  // ── Flashlight ─────────────────────────────────────────────────────────────

  /**
   * Creates a white spot-light configured as a hand-held flashlight.
   * Not added to the scene here – `init()` handles that.
   */
  public createFlashlight(): THREE.SpotLight {
    const light = new THREE.SpotLight(0xffffff, 8.0);
    light.angle = Math.PI / 10;       // ~18° cone
    light.penumbra = 0.3;
    light.decay = 2;
    light.distance = 30;
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 35;
    light.shadow.bias = -0.001;
    return light;
  }

  /** Turns the flashlight on or off. */
  public setFlashlightEnabled(enabled: boolean): void {
    this.flashlightEnabled = enabled;
    if (this.flashlight) {
      this.flashlight.visible = enabled;
    }
  }

  /**
   * Moves the flashlight to match the player camera every frame.
   *
   * @param position  - Camera / player eye position.
   * @param direction - Normalised forward vector of the camera.
   */
  public updateFlashlight(position: THREE.Vector3, direction: THREE.Vector3): void {
    if (!this.flashlight || !this.flashlightEnabled) return;

    this.flashlight.position.copy(position);

    // Target is placed one unit ahead in look direction
    const target = position.clone().addScaledVector(direction, 1.0);
    this.flashlight.target.position.copy(target);
    this.flashlight.target.updateMatrixWorld();
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /** Disposes GPU resources and removes all managed lights from the scene. */
  public dispose(): void {
    if (this.sunLight) {
      this.scene.remove(this.sunLight);
      this.scene.remove(this.sunLight.target);
      this.sunLight.dispose();
    }
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
    if (this.flashlight) {
      this.scene.remove(this.flashlight);
      this.scene.remove(this.flashlight.target);
      this.flashlight.dispose();
    }
    for (const light of this.interiorLights) {
      this.scene.remove(light);
      light.dispose();
    }
    this.interiorLights = [];

    for (const light of this.emergencyLights) {
      this.scene.remove(light);
      light.dispose();
    }
    this.emergencyLights = [];
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private configureSunShadow(light: THREE.DirectionalLight, mapSize: number): void {
    light.shadow.mapSize.set(mapSize, mapSize);
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 600;
    light.shadow.camera.left   = -150;
    light.shadow.camera.right  =  150;
    light.shadow.camera.top    =  150;
    light.shadow.camera.bottom = -150;
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
  }
}
