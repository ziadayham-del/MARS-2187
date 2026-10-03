import * as THREE from 'three';
import { MarsTerrain } from './MarsTerrain.js';

export enum WorldArea {
  LANDING_SITE = 'landing_site',
  AURELIA_EXTERIOR = 'aurelia_exterior',
  AURELIA_INTERIOR = 'aurelia_interior',
  MARTIAN_EXPANSE = 'martian_expanse',
  HELIOS_ENTRANCE = 'helios_entrance',
  HELIOS_DEEP = 'helios_deep'
}

export class World {
  scene: THREE.Scene;
  terrain: MarsTerrain;
  currentArea: WorldArea;
  stateFlags: Map<string, boolean>;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.terrain = new MarsTerrain();
    this.currentArea = WorldArea.LANDING_SITE;
    this.stateFlags = new Map();
  }

  init(): void {
    this.terrain.generate(this.scene);
    this.terrain.scatterRocks(this.scene);
    this.terrain.createDistantMountains(this.scene);
  }

  async loadArea(area: WorldArea): Promise<void> {
    this.currentArea = area;
    // Basic implementation for loading areas
  }

  setWorldState(key: string, value: boolean): void {
    this.stateFlags.set(key, value);
  }

  getWorldState(key: string): boolean {
    return this.stateFlags.get(key) || false;
  }

  update(delta: number, time: number): void {
    this.terrain.update(delta);
  }

  dispose(): void {
    this.terrain.dispose();
  }
}
