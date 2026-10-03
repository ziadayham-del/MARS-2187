// ============================================================
//  MARS: 2187  –  SaveManager.ts
//  Persistent save / load using localStorage.
// ============================================================

import eventBus from './EventBus';
import { GameStateData } from './GameState';

const SAVE_KEY     = 'mars2187_save';
const SAVE_VERSION = 1;

interface SaveEnvelope {
  version: number;
  timestamp: number;
  data: GameStateData;
}

export class SaveManager {
  // ---- Singleton -------------------------------------------------------------
  private static _instance: SaveManager | null = null;

  public static getInstance(): SaveManager {
    if (!SaveManager._instance) {
      SaveManager._instance = new SaveManager();
    }
    return SaveManager._instance;
  }

  private constructor() {}

  // ---- Autosave debounce -----------------------------------------------------
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly AUTOSAVE_DELAY_MS = 5_000; // 5 seconds

  // ---- Public API ------------------------------------------------------------

  /**
   * Persist the supplied `gameState` to localStorage.
   * Emits the `SAVE_COMPLETE` event on success.
   * @returns true on success, false on failure (e.g. private-browsing quota).
   */
  public save(gameState: GameStateData): boolean {
    const envelope: SaveEnvelope = {
      version:   SAVE_VERSION,
      timestamp: Date.now(),
      data:      gameState,
    };

    try {
      const json = JSON.stringify(envelope);
      localStorage.setItem(SAVE_KEY, json);
      eventBus.emit('SAVE_COMPLETE', { timestamp: envelope.timestamp });
      console.info('[SaveManager] Game saved.');
      return true;
    } catch (err) {
      console.error('[SaveManager] Save failed:', err);
      eventBus.emit('SAVE_FAILED', err);
      return false;
    }
  }

  /**
   * Load the saved game from localStorage.
   * @returns Parsed `GameStateData` on success, or `null` if nothing saved / invalid.
   */
  public load(): GameStateData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const envelope = JSON.parse(raw) as SaveEnvelope;
      if (!this._validateEnvelope(envelope)) {
        console.warn('[SaveManager] Save data failed validation – discarding.');
        return null;
      }

      console.info(`[SaveManager] Game loaded (saved at ${new Date(envelope.timestamp).toISOString()}).`);
      eventBus.emit('LOAD_COMPLETE', { timestamp: envelope.timestamp });
      return envelope.data;
    } catch (err) {
      console.error('[SaveManager] Load failed:', err);
      eventBus.emit('LOAD_FAILED', err);
      return null;
    }
  }

  /** Returns true if a valid save exists in localStorage. */
  public hasSave(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const envelope = JSON.parse(raw) as SaveEnvelope;
      return this._validateEnvelope(envelope);
    } catch {
      return false;
    }
  }

  /** Delete the save from localStorage and emit `SAVE_DELETED`. */
  public deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
      eventBus.emit('SAVE_DELETED', undefined);
      console.info('[SaveManager] Save deleted.');
    } catch (err) {
      console.error('[SaveManager] Delete failed:', err);
    }
  }

  /**
   * Debounced autosave – safe to call frequently (e.g. on every state change).
   * Resets the 5-second timer on each call.  Emits `AUTOSAVE` event on write.
   */
  public autoSave(gameState: GameStateData): void {
    if (this._autoSaveTimer !== null) {
      clearTimeout(this._autoSaveTimer);
    }
    this._autoSaveTimer = setTimeout(() => {
      this._autoSaveTimer = null;
      const success = this.save(gameState);
      if (success) {
        eventBus.emit('AUTOSAVE', { timestamp: Date.now() });
        console.info('[SaveManager] Autosave complete.');
      }
    }, SaveManager.AUTOSAVE_DELAY_MS);
  }

  /**
   * Cancel any pending autosave timer (e.g. on game exit before it fires).
   */
  public cancelAutoSave(): void {
    if (this._autoSaveTimer !== null) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }

  /**
   * Export the raw save JSON string (for clipboard / file share).
   * Returns `null` if there is no save.
   */
  public exportSave(): string | null {
    try {
      return localStorage.getItem(SAVE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Import a save from a JSON string (obtained via `exportSave`).
   * Validates structure before writing.
   * @returns true on success.
   */
  public importSave(json: string): boolean {
    try {
      const envelope = JSON.parse(json) as SaveEnvelope;
      if (!this._validateEnvelope(envelope)) {
        console.warn('[SaveManager] Import rejected – invalid save data.');
        eventBus.emit('IMPORT_FAILED', 'invalid_data');
        return false;
      }
      localStorage.setItem(SAVE_KEY, json);
      eventBus.emit('IMPORT_COMPLETE', { timestamp: envelope.timestamp });
      console.info('[SaveManager] Save imported successfully.');
      return true;
    } catch (err) {
      console.error('[SaveManager] Import failed:', err);
      eventBus.emit('IMPORT_FAILED', err);
      return false;
    }
  }

  // ---- Validation ------------------------------------------------------------

  private _validateEnvelope(envelope: unknown): envelope is SaveEnvelope {
    if (typeof envelope !== 'object' || envelope === null) return false;

    const e = envelope as Record<string, unknown>;

    if (typeof e['version'] !== 'number') return false;
    if (typeof e['timestamp'] !== 'number') return false;
    if (typeof e['data'] !== 'object' || e['data'] === null) return false;

    // Basic check that required GameStateData keys exist
    const d = e['data'] as Record<string, unknown>;
    const required: string[] = [
      'phase', 'chapter', 'completedMissions', 'playerStats',
      'inventory', 'discoveredLore', 'puzzleStates', 'worldState',
      'settings', 'saveExists', 'finalChoice', 'playTime',
    ];
    for (const key of required) {
      if (!(key in d)) {
        console.warn(`[SaveManager] Missing key in save data: ${key}`);
        return false;
      }
    }

    return true;
  }
}

// Default singleton
const saveManager = SaveManager.getInstance();
export default saveManager;
