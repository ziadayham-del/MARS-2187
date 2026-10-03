// ============================================================
//  MARS: 2187  –  GameState.ts
//  Central game-state singleton with typed subscription support.
// ============================================================

import eventBus from './EventBus';

// ---- Enums -------------------------------------------------------------------

export enum GamePhase {
  LOADING   = 'LOADING',
  MAIN_MENU = 'MAIN_MENU',
  CINEMATIC = 'CINEMATIC',
  PLAYING   = 'PLAYING',
  ROVER     = 'ROVER',
  PAUSED    = 'PAUSED',
  TERMINAL  = 'TERMINAL',
  DIALOGUE  = 'DIALOGUE',
  CHOICE    = 'CHOICE',
  ENDING    = 'ENDING',
  CREDITS   = 'CREDITS',
}

export enum GraphicsQuality {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH',
  ULTRA  = 'ULTRA',
}

// ---- Interfaces --------------------------------------------------------------

export interface PlayerStats {
  /** 0–100 */
  oxygen: number;
  /** 0–100 */
  battery: number;
  /** –40 to +20 °C */
  temperature: number;
  /** 0–100 */
  integrity: number;
  /** 0–100 */
  signal: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export interface GameSettings {
  sensitivity: number;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
  bloomEnabled: boolean;
  motionEffects: boolean;
  hudOpacity: number;
  fullscreen: boolean;
}

export interface GameStateData {
  phase: GamePhase;
  chapter: number;
  currentMissionId: string | null;
  completedMissions: string[];
  playerStats: PlayerStats;
  inventory: InventoryItem[];
  discoveredLore: string[];
  /** key → solved? */
  puzzleStates: Record<string, boolean>;
  /** arbitrary world flags */
  worldState: Record<string, boolean>;
  settings: GameSettings;
  saveExists: boolean;
  finalChoice: null | 'preserve' | 'awaken';
  /** total play time in seconds */
  playTime: number;
}

// ---- Defaults ----------------------------------------------------------------

const DEFAULT_PLAYER_STATS: PlayerStats = {
  oxygen:      100,
  battery:     100,
  temperature:   4, // comfortable Martian suit interior
  integrity:   100,
  signal:      100,
};

const DEFAULT_SETTINGS: GameSettings = {
  sensitivity:     1.0,
  masterVolume:    0.8,
  musicVolume:     0.6,
  sfxVolume:       0.8,
  graphicsQuality: GraphicsQuality.HIGH,
  bloomEnabled:    true,
  motionEffects:   true,
  hudOpacity:      0.85,
  fullscreen:      false,
};

function buildDefaultState(): GameStateData {
  return {
    phase:              GamePhase.LOADING,
    chapter:            1,
    currentMissionId:   null,
    completedMissions:  [],
    playerStats:        { ...DEFAULT_PLAYER_STATS },
    inventory:          [],
    discoveredLore:     [],
    puzzleStates:       {},
    worldState:         {},
    settings:           { ...DEFAULT_SETTINGS },
    saveExists:         false,
    finalChoice:        null,
    playTime:           0,
  };
}

// ---- Subscription types ------------------------------------------------------

type StateKey = keyof GameStateData;
type SubscriberCallback<K extends StateKey> = (
  newValue: GameStateData[K],
  oldValue: GameStateData[K],
) => void;

// ---- GameState class ---------------------------------------------------------

export class GameState {
  // Singleton ------------------------------------------------------------------
  private static _instance: GameState | null = null;

  public static getInstance(): GameState {
    if (!GameState._instance) {
      GameState._instance = new GameState();
    }
    return GameState._instance;
  }

  private constructor() {}

  // Internal state -------------------------------------------------------------
  private _data: GameStateData = buildDefaultState();
  private _initialized = false;

  /**
   * Subscribers keyed by GameStateData property name.
   * Stored as `unknown` because each callback has a different generic type.
   */
  private readonly _subscribers: Map<StateKey, Set<SubscriberCallback<StateKey>>> = new Map();

  // Public API -----------------------------------------------------------------

  /** Must be called once before using the state (e.g. after a save-file is checked). */
  public initialize(initial?: Partial<GameStateData>): void {
    if (this._initialized) {
      console.warn('[GameState] Already initialized – skipping.');
      return;
    }
    if (initial) {
      this._data = { ...this._data, ...initial };
    }
    this._initialized = true;
    eventBus.emit('GAME_STATE_INITIALIZED', this._data);
    console.info('[GameState] Initialized.');
  }

  /** Returns an immutable snapshot of the current state. */
  public getState(): Readonly<GameStateData> {
    return this._data;
  }

  /**
   * Merge a partial update into the state.
   * Fires change events for every top-level key that actually changed.
   */
  public setState(partial: Partial<GameStateData>): void {
    const old = { ...this._data };
    this._data = { ...this._data, ...partial };

    for (const key of Object.keys(partial) as StateKey[]) {
      if (old[key] !== this._data[key]) {
        this._notifySubscribers(key, this._data[key], old[key]);
        eventBus.emit(`STATE_CHANGED:${key}`, {
          newValue: this._data[key],
          oldValue: old[key],
        });
      }
    }

    eventBus.emit('STATE_CHANGED', this._data);
  }

  /** Convenience: update a single top-level key. */
  public set<K extends StateKey>(key: K, value: GameStateData[K]): void {
    this.setState({ [key]: value } as Partial<GameStateData>);
  }

  /** Resets the entire state to defaults (except settings, which are preserved). */
  public resetToDefault(): void {
    const preservedSettings = { ...this._data.settings };
    this._data = {
      ...buildDefaultState(),
      settings: preservedSettings,
    };
    eventBus.emit('STATE_RESET', this._data);
    console.info('[GameState] State reset to defaults.');
  }

  /**
   * Subscribe to changes on a specific top-level key.
   * @returns Unsubscribe function.
   */
  public subscribe<K extends StateKey>(
    key: K,
    callback: (newValue: GameStateData[K], oldValue: GameStateData[K]) => void,
  ): () => void {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    const cb = callback as unknown as SubscriberCallback<StateKey>;
    this._subscribers.get(key)!.add(cb);

    // Return unsubscribe
    return () => {
      this._subscribers.get(key)?.delete(cb);
    };
  }

  // Helpers --------------------------------------------------------------------

  /** Add a mission to completedMissions if not already present. */
  public completeMission(missionId: string): void {
    if (!this._data.completedMissions.includes(missionId)) {
      this.setState({
        completedMissions: [...this._data.completedMissions, missionId],
      });
    }
  }

  /** Discover a lore entry if not already discovered. */
  public discoverLore(loreId: string): void {
    if (!this._data.discoveredLore.includes(loreId)) {
      this.setState({
        discoveredLore: [...this._data.discoveredLore, loreId],
      });
      eventBus.emit('LORE_DISCOVERED', loreId);
    }
  }

  /** Mark a puzzle as solved. */
  public solvePuzzle(puzzleId: string): void {
    this.setState({
      puzzleStates: { ...this._data.puzzleStates, [puzzleId]: true },
    });
    eventBus.emit('PUZZLE_SOLVED', puzzleId);
  }

  /** Set or clear a world flag. */
  public setWorldFlag(flag: string, value: boolean): void {
    this.setState({
      worldState: { ...this._data.worldState, [flag]: value },
    });
  }

  /** Add or increment an inventory item. */
  public addInventoryItem(item: InventoryItem): void {
    const existing = this._data.inventory.find(i => i.id === item.id);
    if (existing) {
      this.setState({
        inventory: this._data.inventory.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      });
    } else {
      this.setState({ inventory: [...this._data.inventory, item] });
    }
    eventBus.emit('INVENTORY_UPDATED', this._data.inventory);
  }

  /** Remove `quantity` of an item. Removes entirely if quantity reaches 0. */
  public removeInventoryItem(id: string, quantity = 1): void {
    this.setState({
      inventory: this._data.inventory
        .map(i => (i.id === id ? { ...i, quantity: i.quantity - quantity } : i))
        .filter(i => i.quantity > 0),
    });
    eventBus.emit('INVENTORY_UPDATED', this._data.inventory);
  }

  /** Update a subset of player stats, clamping to valid ranges. */
  public updatePlayerStats(delta: Partial<PlayerStats>): void {
    const current = this._data.playerStats;
    const clamped: PlayerStats = {
      oxygen:      Math.max(0, Math.min(100, (current.oxygen      + (delta.oxygen      ?? 0)))),
      battery:     Math.max(0, Math.min(100, (current.battery     + (delta.battery     ?? 0)))),
      temperature: Math.max(-40, Math.min(20,(current.temperature + (delta.temperature ?? 0)))),
      integrity:   Math.max(0, Math.min(100, (current.integrity   + (delta.integrity   ?? 0)))),
      signal:      Math.max(0, Math.min(100, (current.signal      + (delta.signal      ?? 0)))),
    };
    this.setState({ playerStats: clamped });
    eventBus.emit('PLAYER_STATS_UPDATED', clamped);

    if (clamped.oxygen <= 0) eventBus.emit('PLAYER_DEAD', 'oxygen');
    else if (clamped.battery <= 0) eventBus.emit('PLAYER_DEAD', 'battery');
    else if (clamped.integrity <= 0) eventBus.emit('PLAYER_DEAD', 'integrity');
  }

  /** Tick the play-time counter (call every second). */
  public tickPlayTime(seconds = 1): void {
    this._data = { ...this._data, playTime: this._data.playTime + seconds };
  }

  // Private helpers ------------------------------------------------------------

  private _notifySubscribers<K extends StateKey>(
    key: K,
    newValue: GameStateData[K],
    oldValue: GameStateData[K],
  ): void {
    const callbacks = this._subscribers.get(key);
    if (!callbacks) return;
    for (const cb of callbacks) {
      try {
        (cb as unknown as (n: GameStateData[K], o: GameStateData[K]) => void)(newValue, oldValue);
      } catch (err) {
        console.error(`[GameState] Subscriber error for key "${key}":`, err);
      }
    }
  }
}

// Default singleton
const gameState = GameState.getInstance();
export default gameState;
