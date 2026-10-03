// ============================================================
//  MARS: 2187  –  EventBus.ts
//  Generic singleton event system.
// ============================================================

type Callback<T = unknown> = (data: T) => void;

export class EventBus {
  // ---- Singleton -------------------------------------------------------
  private static _instance: EventBus | null = null;

  public static getInstance(): EventBus {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus();
    }
    return EventBus._instance;
  }

  private constructor() {}

  // ---- Internal storage ------------------------------------------------
  /** Map from event name → Set of raw callbacks */
  private readonly _listeners: Map<string, Set<Callback<unknown>>> = new Map();

  /**
   * Tracks one-time wrappers so that `off` called with the original callback
   * still removes the once-wrapper correctly.
   */
  private readonly _onceWrappers: Map<
    string,
    Map<Callback<unknown>, Callback<unknown>>
  > = new Map();

  // ---- Public API -------------------------------------------------------

  /**
   * Register a persistent listener for `event`.
   * @param event  Event name.
   * @param callback  Handler receiving the emitted payload.
   */
  public on<T = unknown>(event: string, callback: Callback<T>): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(callback as Callback<unknown>);
  }

  /**
   * Remove a previously registered listener.
   * Works for both `on` and `once` registrations (pass the original callback).
   */
  public off<T = unknown>(event: string, callback: Callback<T>): void {
    const raw = callback as Callback<unknown>;

    // Remove from listeners set
    this._listeners.get(event)?.delete(raw);

    // If it was a once-wrapper, remove the wrapper too
    const wrapperMap = this._onceWrappers.get(event);
    if (wrapperMap) {
      const wrapper = wrapperMap.get(raw);
      if (wrapper !== undefined) {
        this._listeners.get(event)?.delete(wrapper);
        wrapperMap.delete(raw);
        if (wrapperMap.size === 0) {
          this._onceWrappers.delete(event);
        }
      }
    }
  }

  /**
   * Emit `event` and pass `data` to every registered listener.
   */
  public emit<T = unknown>(event: string, data?: T): void {
    const callbacks = this._listeners.get(event);
    if (!callbacks) return;

    // Snapshot to avoid mutation during iteration
    for (const cb of Array.from(callbacks)) {
      try {
        cb(data as unknown);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    }
  }

  /**
   * Register a one-time listener that auto-removes itself after the first call.
   */
  public once<T = unknown>(event: string, callback: Callback<T>): void {
    const raw = callback as Callback<unknown>;

    const wrapper: Callback<unknown> = (data: unknown) => {
      raw(data);
      this.off(event, raw); // removes both wrapper and original
    };

    // Store wrapper so off() with original callback can find it
    if (!this._onceWrappers.has(event)) {
      this._onceWrappers.set(event, new Map());
    }
    this._onceWrappers.get(event)!.set(raw, wrapper);

    // Register wrapper as the actual listener
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(wrapper);
  }

  /**
   * Remove ALL listeners for a given event (or all events if omitted).
   */
  public clear(event?: string): void {
    if (event !== undefined) {
      this._listeners.delete(event);
      this._onceWrappers.delete(event);
    } else {
      this._listeners.clear();
      this._onceWrappers.clear();
    }
  }

  /**
   * Returns the number of listeners currently registered for `event`.
   */
  public listenerCount(event: string): number {
    return this._listeners.get(event)?.size ?? 0;
  }
}

// Default singleton instance – import and use directly.
const eventBus = EventBus.getInstance();
export default eventBus;
