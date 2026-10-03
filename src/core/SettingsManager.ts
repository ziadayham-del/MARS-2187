// ============================================================
//  MARS: 2187  –  SettingsManager.ts
//  Load, save and apply graphics / audio / gameplay settings.
// ============================================================

import type * as THREE from 'three';
import { GameSettings, GraphicsQuality } from './GameState';

const SETTINGS_KEY = 'mars2187_settings';

// The composer interface we care about (avoids importing the full postprocessing
// package here; callers pass an object that satisfies this shape).
export interface IEffectComposer {
  passes: Array<{ enabled: boolean; [key: string]: unknown }>;
}

export interface IBloomPass {
  strength: number;
  radius: number;
  threshold: number;
}

export class SettingsManager {
  // ---- Singleton -------------------------------------------------------------
  private static _instance: SettingsManager | null = null;

  public static getInstance(): SettingsManager {
    if (!SettingsManager._instance) {
      SettingsManager._instance = new SettingsManager();
    }
    return SettingsManager._instance;
  }

  private constructor() {}

  // ---- Defaults --------------------------------------------------------------

  /** Returns a fresh default settings object. */
  public getDefault(): GameSettings {
    return {
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
  }

  // ---- Persistence -----------------------------------------------------------

  /**
   * Load settings from localStorage.  Falls back to defaults if nothing is
   * stored or the stored value is corrupt / partial.
   */
  public loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return this.getDefault();

      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      // Merge parsed over defaults so newly added keys are always present
      return { ...this.getDefault(), ...parsed };
    } catch (err) {
      console.warn('[SettingsManager] Failed to load settings, using defaults:', err);
      return this.getDefault();
    }
  }

  /**
   * Persist the supplied settings to localStorage.
   * @returns true on success.
   */
  public saveSettings(settings: GameSettings): boolean {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('[SettingsManager] Failed to save settings:', err);
      return false;
    }
  }

  // ---- Graphics application --------------------------------------------------

  /**
   * Apply graphics quality to a Three.js WebGLRenderer and optional
   * postprocessing effect composer / bloom pass.
   *
   * @param quality         Target quality preset.
   * @param renderer        Three.js WebGLRenderer instance.
   * @param bloomPass       Optional UnrealBloomPass (or any object with strength/radius/threshold).
   * @param bloomEnabled    Whether bloom should be enabled at all.
   */
  public applyGraphicsQuality(
    quality: GraphicsQuality,
    renderer: THREE.WebGLRenderer,
    bloomPass?: IBloomPass | null,
    bloomEnabled = true,
  ): void {
    switch (quality) {
      // ---- LOW ---------------------------------------------------------------
      case GraphicsQuality.LOW: {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
        renderer.shadowMap.enabled = false;
        if (bloomPass) {
          bloomPass.strength  = 0.0;
          bloomPass.radius    = 0.0;
          bloomPass.threshold = 1.0;
        }
        break;
      }

      // ---- MEDIUM ------------------------------------------------------------
      case GraphicsQuality.MEDIUM: {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = 0; // THREE.BasicShadowMap
        if (bloomPass) {
          if (bloomEnabled) {
            bloomPass.strength  = 0.4;
            bloomPass.radius    = 0.5;
            bloomPass.threshold = 0.85;
          } else {
            bloomPass.strength = 0.0;
          }
        }
        break;
      }

      // ---- HIGH --------------------------------------------------------------
      case GraphicsQuality.HIGH: {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = 1; // THREE.PCFShadowMap
        if (bloomPass) {
          if (bloomEnabled) {
            bloomPass.strength  = 0.8;
            bloomPass.radius    = 0.6;
            bloomPass.threshold = 0.75;
          } else {
            bloomPass.strength = 0.0;
          }
        }
        break;
      }

      // ---- ULTRA -------------------------------------------------------------
      case GraphicsQuality.ULTRA: {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = 2; // THREE.PCFSoftShadowMap
        if (bloomPass) {
          if (bloomEnabled) {
            bloomPass.strength  = 1.2;
            bloomPass.radius    = 0.75;
            bloomPass.threshold = 0.65;
          } else {
            bloomPass.strength = 0.0;
          }
        }
        break;
      }

      default: {
        console.warn(`[SettingsManager] Unknown quality preset: ${quality}`);
      }
    }

    console.info(`[SettingsManager] Applied quality: ${quality}`);
  }

  /**
   * Apply the full settings object to the renderer (and optional bloom pass).
   * Convenience wrapper that calls `applyGraphicsQuality`.
   */
  public applyAll(
    settings: GameSettings,
    renderer: THREE.WebGLRenderer,
    bloomPass?: IBloomPass | null,
  ): void {
    this.applyGraphicsQuality(
      settings.graphicsQuality,
      renderer,
      bloomPass,
      settings.bloomEnabled,
    );

    // Fullscreen
    if (settings.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn('[SettingsManager] Fullscreen request failed.');
      });
    } else if (!settings.fullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        console.warn('[SettingsManager] Exit fullscreen failed.');
      });
    }
  }
}

// Default singleton
const settingsManager = SettingsManager.getInstance();
export default settingsManager;
