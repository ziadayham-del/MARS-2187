/**
 * AudioManager.ts
 * MARS: 2187 — Singleton wrapper around ProceduralSounds.
 * Provides a single access point for all audio operations in the game.
 */

import { ProceduralSounds, SoundId } from './ProceduralSounds';

type MusicTrack = 'menu' | 'landing' | 'aurelia' | 'helios' | 'final_choice' | 'ending_a' | 'ending_b';
type AmbientScene = 'interior' | 'exterior' | 'storm' | 'helios' | 'space';

export class AudioManager {
  // ---------------------------------------------------------------------------
  // Singleton
  // ---------------------------------------------------------------------------
  private static _instance: AudioManager | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  private _sounds: ProceduralSounds;
  private _initialized = false;
  private _pendingAmbient: AmbientScene | null = null;
  private _pendingMusic: MusicTrack | null = null;
  private _masterVolume = 0.9;
  private _musicVolume  = 0.5;
  private _sfxVolume    = 0.8;
  private _currentAmbient: AmbientScene | null = null;
  private _currentMusic: MusicTrack | null = null;

  // ---------------------------------------------------------------------------
  // Constructor (private — use getInstance())
  // ---------------------------------------------------------------------------
  private constructor() {
    this._sounds = new ProceduralSounds();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Whether the AudioContext has been successfully created. */
  get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Initialize the audio system. Must be called in response to a user gesture
   * (click, keydown, etc.) because browsers block AudioContext creation
   * until there is a user interaction.
   */
  async init(): Promise<void> {
    if (this._initialized) return;

    try {
      await this._sounds.init();
      this._initialized = true;

      // Apply volumes that may have been set before init
      this._sounds.setMasterVolume(this._masterVolume);
      this._sounds.setMusicVolume(this._musicVolume);
      this._sounds.setSfxVolume(this._sfxVolume);

      // Flush any pending ambient / music requests
      if (this._pendingAmbient !== null) {
        this._sounds.startAmbient(this._pendingAmbient);
        this._pendingAmbient = null;
      }
      if (this._pendingMusic !== null) {
        this._sounds.playMusic(this._pendingMusic);
        this._pendingMusic = null;
      }
    } catch (err) {
      console.error('[AudioManager] Failed to initialise audio context:', err);
    }
  }

  /**
   * Play a one-shot sound effect.
   * Silently no-ops when called before init().
   */
  playSound(id: SoundId, volume = 1.0): void {
    if (!this._initialized) return;
    this._sounds.play(id, { volume });
  }

  /**
   * Start a music track.
   * If called before init(), queues the track and plays it after init().
   */
  playMusic(track: MusicTrack): void {
    this._currentMusic = track;
    if (!this._initialized) {
      this._pendingMusic = track;
      return;
    }
    this._sounds.playMusic(track);
  }

  /**
   * Stop the currently playing music track.
   * @param fadeTime Fade-out duration in seconds (default 1.5s).
   */
  stopMusic(fadeTime = 1.5): void {
    this._currentMusic = null;
    if (!this._initialized) {
      this._pendingMusic = null;
      return;
    }
    this._sounds.stopMusic(fadeTime);
  }

  /**
   * Set the ambient soundscape for the current scene.
   * If called before init(), queues the scene and starts it after init().
   */
  setAmbient(scene: AmbientScene): void {
    if (this._currentAmbient === scene) return;
    this._currentAmbient = scene;

    if (!this._initialized) {
      this._pendingAmbient = scene;
      return;
    }
    this._sounds.startAmbient(scene);
  }

  /**
   * Stop all ambient loops immediately.
   */
  stopAmbient(): void {
    this._currentAmbient = null;
    this._pendingAmbient = null;
    if (!this._initialized) return;
    this._sounds.stopAmbient();
  }

  /**
   * Convenience method to update all three volume controls at once.
   * @param master Overall output gain (0–1).
   * @param music  Music layer gain (0–1).
   * @param sfx    Sound-effects layer gain (0–1).
   */
  setVolumes(master: number, music: number, sfx: number): void {
    this._masterVolume = master;
    this._musicVolume  = music;
    this._sfxVolume    = sfx;

    if (!this._initialized) return;
    this._sounds.setMasterVolume(master);
    this._sounds.setMusicVolume(music);
    this._sounds.setSfxVolume(sfx);
  }

  /** Update only master volume (0–1). */
  setMasterVolume(v: number): void {
    this._masterVolume = v;
    if (this._initialized) this._sounds.setMasterVolume(v);
  }

  /** Update only music volume (0–1). */
  setMusicVolume(v: number): void {
    this._musicVolume = v;
    if (this._initialized) this._sounds.setMusicVolume(v);
  }

  /** Update only SFX volume (0–1). */
  setSfxVolume(v: number): void {
    this._sfxVolume = v;
    if (this._initialized) this._sounds.setSfxVolume(v);
  }

  /** Currently active ambient scene (null if none). */
  get currentAmbient(): AmbientScene | null {
    return this._currentAmbient;
  }

  /** Currently queued or playing music track (null if none). */
  get currentMusic(): MusicTrack | null {
    return this._currentMusic;
  }

  /**
   * Tear down audio system completely — use when leaving the page.
   * After calling this you must call init() again before using audio.
   */
  dispose(): void {
    this._sounds.dispose();
    this._initialized = false;
    this._currentAmbient = null;
    this._currentMusic   = null;
    this._pendingAmbient = null;
    this._pendingMusic   = null;
  }
}

// ---------------------------------------------------------------------------
// Re-export SoundId for consumer convenience
// ---------------------------------------------------------------------------
export type { SoundId } from './ProceduralSounds';

// ---------------------------------------------------------------------------
// Module-level convenience accessor (optional shorthand)
// ---------------------------------------------------------------------------
export const audio = AudioManager.getInstance();
