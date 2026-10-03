import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface InputSnapshot {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
}

export interface TerrainInterface {
  getHeightAt(x: number, z: number): number;
}

// ---------------------------------------------------------------------------
// PlayerController
// ---------------------------------------------------------------------------

export class PlayerController {
  // Three.js references
  camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  // State
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isGrounded: boolean = false;
  isInRover: boolean = false;

  // Config
  moveSpeed: number = 5.0;
  sprintMultiplier: number = 2.0;
  jumpForce: number = 8.0;
  gravity: number = -20.0;
  mouseSensitivity: number = 0.002;
  headBobAmplitude: number = 0.05;
  headBobFrequency: number = 2.0;

  // Internal euler for yaw/pitch
  private yaw: number = 0;
  private pitch: number = 0;

  // Head bob state
  private bobTimer: number = 0;
  private bobOffset: THREE.Vector3 = new THREE.Vector3();

  // Smoothed camera target position
  private smoothedPosition: THREE.Vector3;

  // Camera pivot object – actual camera is child so bob can be applied
  private pivot: THREE.Object3D;

  // Movement enabled flag
  private movementEnabled: boolean = true;

  // Reusable vectors (avoid GC pressure)
  private _move: THREE.Vector3 = new THREE.Vector3();
  private _forward: THREE.Vector3 = new THREE.Vector3();
  private _right: THREE.Vector3 = new THREE.Vector3();
  private _euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private _quat: THREE.Quaternion = new THREE.Quaternion();

  /** Height above terrain the player's eyes sit */
  private readonly EYE_HEIGHT = 1.75;
  /** Camera smoothing factor (higher = snappier, lower = silkier) */
  private readonly CAMERA_SMOOTH = 20.0;
  /** Pitch limits in radians */
  private readonly PITCH_MIN = THREE.MathUtils.degToRad(-85);
  private readonly PITCH_MAX = THREE.MathUtils.degToRad(85);

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3();
    this.smoothedPosition = new THREE.Vector3();

    // Pivot carries the camera as a child so head-bob offsets don't affect
    // the logical player position.
    this.pivot = new THREE.Object3D();
    this.pivot.add(this.camera);
    this.scene.add(this.pivot);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(): void {
    this.smoothedPosition.copy(this.position);
    this.pivot.position.copy(this.position);
    this._applyRotation();
  }

  update(delta: number, input: InputSnapshot, terrain: TerrainInterface): void {
    if (this.isInRover || !this.movementEnabled) return;

    this._handleMouseLook(input);
    this._handleMovement(delta, input, terrain);
    this._handleGravity(delta, terrain);
    this._handleHeadBob(delta, input);
    this._updateCamera(delta);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  setPosition(pos: THREE.Vector3): void {
    this.position.copy(pos);
    this.smoothedPosition.copy(pos);
    this.pivot.position.copy(pos).y += this.EYE_HEIGHT;
    this.velocity.set(0, 0, 0);
  }

  /** Intentional typo preserved from interface spec. */
  setMoussenSensitivity(sens: number): void {
    this.mouseSensitivity = Math.max(0.0001, sens);
  }

  enableMovement(enabled: boolean): void {
    this.movementEnabled = enabled;
    if (!enabled) this.velocity.set(0, 0, 0);
  }

  dispose(): void {
    this.scene.remove(this.pivot);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _handleMouseLook(input: InputSnapshot): void {
    this.yaw -= input.mouseDeltaX * this.mouseSensitivity;
    this.pitch -= input.mouseDeltaY * this.mouseSensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, this.PITCH_MIN, this.PITCH_MAX);
    this._applyRotation();
  }

  private _applyRotation(): void {
    // Apply yaw to pivot (horizontal) and pitch to camera (vertical)
    this._euler.set(0, this.yaw, 0, 'YXZ');
    this.pivot.quaternion.setFromEuler(this._euler);

    this._euler.set(this.pitch, 0, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._euler);
  }

  private _handleMovement(delta: number, input: InputSnapshot, terrain: TerrainInterface): void {
    const speed = this.moveSpeed * (input.sprint ? this.sprintMultiplier : 1.0);

    // Compute world-space forward/right from current yaw (ignore pitch for movement)
    this._forward.set(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw,
    );
    this._right.set(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw,
    );

    this._move.set(0, 0, 0);

    if (input.forward) this._move.add(this._forward);
    if (input.back)    this._move.sub(this._forward);
    if (input.right)   this._move.add(this._right);
    if (input.left)    this._move.sub(this._right);

    if (this._move.lengthSq() > 0) {
      this._move.normalize().multiplyScalar(speed);
    }

    // Horizontal velocity – direct control (no friction model needed for FPS feel)
    this.velocity.x = this._move.x;
    this.velocity.z = this._move.z;

    // Jump
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Integrate horizontal position
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Clamp to terrain height (horizontal check after move to prevent walking through slopes)
    const groundY = terrain.getHeightAt(this.position.x, this.position.z);
    if (this.position.y < groundY) {
      this.position.y = groundY;
    }
  }

  private _handleGravity(delta: number, terrain: TerrainInterface): void {
    // Apply gravity to vertical velocity
    this.velocity.y += this.gravity * delta;

    // Integrate vertical position
    this.position.y += this.velocity.y * delta;

    // Ground detection
    const groundY = terrain.getHeightAt(this.position.x, this.position.z);
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  private _handleHeadBob(delta: number, input: InputSnapshot): void {
    const isMoving =
      (input.forward || input.back || input.left || input.right) &&
      this.isGrounded;

    if (isMoving) {
      const speed = input.sprint ? this.sprintMultiplier : 1.0;
      this.bobTimer += delta * this.headBobFrequency * speed;
      this.bobOffset.set(
        Math.sin(this.bobTimer * 2) * this.headBobAmplitude * 0.5,
        Math.sin(this.bobTimer) * this.headBobAmplitude,
        0,
      );
    } else {
      // Damp bob back to zero
      this.bobTimer = 0;
      this.bobOffset.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, delta * 8));
    }

    this.camera.position.copy(this.bobOffset);
  }

  private _updateCamera(delta: number): void {
    // Target eye position
    const targetEye = this.position.clone();
    targetEye.y += this.EYE_HEIGHT;

    // Smooth pivot position toward target
    const alpha = Math.min(1, this.CAMERA_SMOOTH * delta);
    this.smoothedPosition.lerp(targetEye, alpha);
    this.pivot.position.copy(this.smoothedPosition);
  }
}
