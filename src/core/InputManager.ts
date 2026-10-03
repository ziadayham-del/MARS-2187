// ============================================================
//  MARS: 2187  –  InputManager.ts
//  Keyboard, mouse, and pointer-lock management.
// ============================================================

export interface MouseDelta {
  x: number;
  y: number;
}

export class InputManager {
  // ---- Singleton -------------------------------------------------------------
  private static _instance: InputManager | null = null;

  public static getInstance(): InputManager {
    if (!InputManager._instance) {
      InputManager._instance = new InputManager();
    }
    return InputManager._instance;
  }

  constructor() {
    this._attachListeners();
  }

  // ---- State -----------------------------------------------------------------

  /** Keys currently held down */
  private readonly _keysDown: Map<string, boolean> = new Map();

  /**
   * Keys pressed this frame only.
   * Cleared each time `isKeyPressed` is called (or via `clearFrameState()`).
   */
  private readonly _keysPressed: Map<string, boolean> = new Map();

  /** Previous keysDown snapshot – used to detect fresh presses */
  private readonly _keysPrevDown: Map<string, boolean> = new Map();

  /** Accumulated raw mouse movement since last `getMouseDelta()` call */
  private _mouseDeltaX = 0;
  private _mouseDeltaY = 0;

  /** Whether the pointer is currently locked */
  private _pointerLocked = false;

  /** Developer mode flag – toggled with Ctrl+Shift+` */
  private _devMode = false;

  /** Callback invoked when pointer lock state changes */
  public onPointerLockChange: ((locked: boolean) => void) | null = null;

  /** Callback invoked when dev-mode is toggled */
  public onDevModeToggle: ((enabled: boolean) => void) | null = null;

  // Bound event references – stored for disposal
  private readonly _onKeyDown = this._handleKeyDown.bind(this);
  private readonly _onKeyUp   = this._handleKeyUp.bind(this);
  private readonly _onMouseMove = this._handleMouseMove.bind(this);
  private readonly _onPointerLockChange = this._handlePointerLockChange.bind(this);
  private readonly _onPointerLockError  = this._handlePointerLockError.bind(this);

  // ---- Lifecycle -------------------------------------------------------------

  private _attachListeners(): void {
    window.addEventListener('keydown',  this._onKeyDown, false);
    window.addEventListener('keyup',    this._onKeyUp,   false);
    window.addEventListener('mousemove', this._onMouseMove, false);
    document.addEventListener('pointerlockchange', this._onPointerLockChange, false);
    document.addEventListener('pointerlockerror',  this._onPointerLockError,  false);
  }

  /** Remove all event listeners and release pointer lock if held. */
  public dispose(): void {
    window.removeEventListener('keydown',  this._onKeyDown, false);
    window.removeEventListener('keyup',    this._onKeyUp,   false);
    window.removeEventListener('mousemove', this._onMouseMove, false);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange, false);
    document.removeEventListener('pointerlockerror',  this._onPointerLockError,  false);

    if (this._pointerLocked) {
      document.exitPointerLock();
    }

    this._keysDown.clear();
    this._keysPressed.clear();
    this._keysPrevDown.clear();
    this._mouseDeltaX = 0;
    this._mouseDeltaY = 0;
  }

  // ---- Keyboard API ----------------------------------------------------------

  /**
   * Returns true while `key` is held down.
   * Use the KeyboardEvent.code string (e.g. "KeyW", "Space", "ShiftLeft").
   */
  public isKeyDown(key: string): boolean {
    return this._keysDown.get(key) === true;
  }

  /**
   * Returns true only on the first frame `key` was pressed.
   * Reading this clears the pressed state for that key.
   */
  public isKeyPressed(key: string): boolean {
    const pressed = this._keysPressed.get(key) === true;
    if (pressed) {
      this._keysPressed.set(key, false);
    }
    return pressed;
  }

  /**
   * Call once per frame (e.g. at the end of your update loop) to advance
   * the per-frame pressed state.  Not strictly required because `isKeyPressed`
   * auto-clears on read, but useful for engines that poll all inputs.
   */
  public endFrame(): void {
    this._keysPrevDown.clear();
    for (const [k, v] of this._keysDown) {
      this._keysPrevDown.set(k, v);
    }
    // Clear all pressed flags
    for (const key of this._keysPressed.keys()) {
      this._keysPressed.set(key, false);
    }
  }

  // ---- Convenience key checks -----------------------------------------------

  public isMoveForward():  boolean { return this.isKeyDown('KeyW')  || this.isKeyDown('ArrowUp'); }
  public isMoveBackward(): boolean { return this.isKeyDown('KeyS')  || this.isKeyDown('ArrowDown'); }
  public isMoveLeft():     boolean { return this.isKeyDown('KeyA')  || this.isKeyDown('ArrowLeft'); }
  public isMoveRight():    boolean { return this.isKeyDown('KeyD')  || this.isKeyDown('ArrowRight'); }
  public isSprint():       boolean { return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight'); }
  public isJump():         boolean { return this.isKeyDown('Space'); }
  public isInteract():     boolean { return this.isKeyDown('KeyE'); }
  public isFlashlight():   boolean { return this.isKeyDown('KeyF'); }
  public isMap():          boolean { return this.isKeyDown('KeyM'); }
  public isInventory():    boolean { return this.isKeyDown('KeyI'); }
  public isPause():        boolean { return this.isKeyDown('Escape'); }
  public isDevMode():      boolean { return this._devMode; }

  // ---- Mouse / Pointer lock API ---------------------------------------------

  /**
   * Accumulated mouse movement since the last call. Resets on read.
   */
  public getMouseDelta(): MouseDelta {
    const delta: MouseDelta = { x: this._mouseDeltaX, y: this._mouseDeltaY };
    this._mouseDeltaX = 0;
    this._mouseDeltaY = 0;
    return delta;
  }

  /** Request pointer lock on `element` (defaults to document.body). */
  public requestPointerLock(element?: HTMLElement): void {
    const target = element ?? document.body;
    if (!this._pointerLocked) {
      target.requestPointerLock();
    }
  }

  /** Release pointer lock. */
  public exitPointerLock(): void {
    if (this._pointerLocked) {
      document.exitPointerLock();
    }
  }

  /** Whether pointer is currently locked. */
  public get isLocked(): boolean {
    return this._pointerLocked;
  }

  // ---- Private event handlers -----------------------------------------------

  private _handleKeyDown(e: KeyboardEvent): void {
    const code = e.code;

    // Ctrl+Shift+Backtick → toggle dev mode
    if (e.ctrlKey && e.shiftKey && code === 'Backquote') {
      e.preventDefault();
      this._devMode = !this._devMode;
      console.info(`[InputManager] Dev mode: ${this._devMode ? 'ON' : 'OFF'}`);
      this.onDevModeToggle?.(this._devMode);
      return;
    }

    // Only record a "pressed" event on the leading edge
    if (!this._keysDown.get(code)) {
      this._keysPressed.set(code, true);
    }

    this._keysDown.set(code, true);
  }

  private _handleKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    this._keysDown.set(code, false);
    // Do NOT clear _keysPressed here – it's cleared on read / endFrame
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (this._pointerLocked) {
      this._mouseDeltaX += e.movementX;
      this._mouseDeltaY += e.movementY;
    }
  }

  private _handlePointerLockChange(): void {
    this._pointerLocked = document.pointerLockElement !== null;
    this.onPointerLockChange?.(this._pointerLocked);
    if (!this._pointerLocked) {
      // Reset deltas when pointer unlocked to avoid a jump on re-lock
      this._mouseDeltaX = 0;
      this._mouseDeltaY = 0;
    }
  }

  private _handlePointerLockError(): void {
    console.error('[InputManager] Pointer lock request failed.');
    this._pointerLocked = false;
  }
}

// Default singleton
const inputManager = InputManager.getInstance();
export default inputManager;
