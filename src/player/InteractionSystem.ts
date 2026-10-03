import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Interactable {
  id: string;
  object: THREE.Object3D;
  name: string;
  /** e.g. "E — OPEN DOOR" */
  prompt: string;
  onInteract: () => void;
  isEnabled: () => boolean;
  /** Maximum interaction distance in world units. Default 3.0 */
  maxDistance?: number;
}

// ---------------------------------------------------------------------------
// InteractionSystem
// ---------------------------------------------------------------------------

export class InteractionSystem {
  raycaster: THREE.Raycaster;
  currentTarget: Interactable | null = null;

  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  /** Registered interactables, keyed by id */
  private registry: Map<string, Interactable> = new Map();

  /** Cache of THREE.Object3D → Interactable for O(1) lookup after raycast */
  private objectMap: Map<THREE.Object3D, Interactable> = new Map();

  /** All meshes that should be considered for raycasting (flat list) */
  private raycastTargets: THREE.Object3D[] = [];

  /** The default max distance when none is provided */
  private readonly DEFAULT_MAX_DISTANCE = 3.0;

  /** Centre of screen – constant for first-person crosshair */
  private readonly SCREEN_CENTER = new THREE.Vector2(0, 0);

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 10; // Cast further than max distance; we filter manually
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  register(interactable: Interactable): void {
    if (this.registry.has(interactable.id)) {
      // Replace the existing registration cleanly
      this.unregister(interactable.id);
    }

    this.registry.set(interactable.id, interactable);

    // Map root object and all descendants for ray hitting
    interactable.object.traverse((child) => {
      this.objectMap.set(child, interactable);
      this.raycastTargets.push(child);
    });
  }

  unregister(id: string): void {
    const interactable = this.registry.get(id);
    if (!interactable) return;

    // Remove all child object references
    interactable.object.traverse((child) => {
      this.objectMap.delete(child);
    });

    // Rebuild raycastTargets (cheaper than splice for small lists)
    this.raycastTargets = this.raycastTargets.filter(
      (obj) => !this.objectMap.has(obj) && obj !== interactable.object,
    );

    this.registry.delete(id);

    if (this.currentTarget?.id === id) {
      this.currentTarget = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Per-frame update
  // ---------------------------------------------------------------------------

  update(_scene: THREE.Scene): void {
    this.currentTarget = null;

    if (this.raycastTargets.length === 0) return;

    this.raycaster.setFromCamera(this.SCREEN_CENTER, this.camera);

    const intersects = this.raycaster.intersectObjects(this.raycastTargets, false);

    if (intersects.length === 0) return;

    for (const hit of intersects) {
      const interactable = this.objectMap.get(hit.object);
      if (!interactable) continue;

      const maxDist = interactable.maxDistance ?? this.DEFAULT_MAX_DISTANCE;

      if (hit.distance > maxDist) continue;
      if (!interactable.isEnabled()) continue;

      this.currentTarget = interactable;
      break; // Nearest valid target wins
    }
  }

  // ---------------------------------------------------------------------------
  // Interaction trigger
  // ---------------------------------------------------------------------------

  /**
   * Call this when the player presses E.
   * Returns true if an interaction was triggered.
   */
  tryInteract(): boolean {
    if (!this.currentTarget) return false;
    if (!this.currentTarget.isEnabled()) return false;

    this.currentTarget.onInteract();
    return true;
  }

  // ---------------------------------------------------------------------------
  // HUD data
  // ---------------------------------------------------------------------------

  getCurrentPrompt(): string | null {
    return this.currentTarget ? this.currentTarget.prompt : null;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  dispose(): void {
    this.registry.clear();
    this.objectMap.clear();
    this.raycastTargets = [];
    this.currentTarget = null;
  }
}
