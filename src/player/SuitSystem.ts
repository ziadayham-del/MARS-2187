import { PlayerState, WorldStateInterface, SuitStatus, InventoryItem } from './PlayerState';

// ---------------------------------------------------------------------------
// EventBus – lightweight singleton for cross-system communication
// ---------------------------------------------------------------------------

type EventHandler = (data?: unknown) => void;

class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((h) => h(data));
  }
}

export { EventBus };

// ---------------------------------------------------------------------------
// SuitHUDData – snapshot provided to HUD each frame
// ---------------------------------------------------------------------------

export interface SuitHUDData {
  oxygen: number;
  battery: number;
  temperature: number;
  integrity: number;
  signal: number;
  flashlightOn: boolean;
  oxygenWarning: boolean;
  oxygenCritical: boolean;
  batteryWarning: boolean;
  tempWarning: boolean;
  signalLost: boolean;
  isOutside: boolean;
  stormActive: boolean;
  inventory: InventoryItem[];
}

// ---------------------------------------------------------------------------
// Warning event payloads
// ---------------------------------------------------------------------------

export interface SuitWarningPayload {
  type: 'oxygen_warning' | 'oxygen_critical' | 'battery_warning' | 'temp_warning' | 'signal_lost' | 'signal_restored' | 'integrity_low';
  value: number;
  message: string;
}

// ---------------------------------------------------------------------------
// SuitSystem
// ---------------------------------------------------------------------------

export class SuitSystem {
  private state: PlayerState;
  private bus: EventBus;

  // Track previous warning states to emit events only on transitions
  private prevStatus: SuitStatus = {
    oxygenWarning:  false,
    oxygenCritical: false,
    batteryWarning: false,
    tempWarning:    false,
    signalLost:     false,
  };

  private prevIntegrityLow: boolean = false;
  private stormActive: boolean = false;

  /**
   * @param state   The shared PlayerState instance.
   */
  constructor(state: PlayerState) {
    this.state = state;
    this.bus = EventBus.getInstance();
  }

  // ---------------------------------------------------------------------------
  // Update – called once per frame
  // ---------------------------------------------------------------------------

  update(delta: number, worldState: WorldStateInterface): void {
    this.stormActive = worldState.stormActive;

    // Delegate stat simulation to PlayerState
    this.state.update(delta, worldState);

    this._emitWarnings();
  }

  // ---------------------------------------------------------------------------
  // HUD snapshot
  // ---------------------------------------------------------------------------

  getHUDData(): SuitHUDData {
    const status = this.state.getStatus();
    return {
      oxygen:         this.state.oxygen,
      battery:        this.state.battery,
      temperature:    this.state.temperature,
      integrity:      this.state.integrity,
      signal:         this.state.signal,
      flashlightOn:   this.state.flashlightOn,
      isOutside:      this.state.isOutside,
      stormActive:    this.stormActive,
      inventory:      this.state.getItems(),
      ...status,
    };
  }

  // ---------------------------------------------------------------------------
  // Flashlight control
  // ---------------------------------------------------------------------------

  toggleFlashlight(): boolean {
    if (!this.state.flashlightOn && this.state.battery <= 0) return false;
    this.state.flashlightOn = !this.state.flashlightOn;
    this.bus.emit('suit:flashlight', { on: this.state.flashlightOn });
    return this.state.flashlightOn;
  }

  setFlashlight(on: boolean): void {
    if (on && this.state.battery <= 0) return;
    this.state.flashlightOn = on;
    this.bus.emit('suit:flashlight', { on });
  }

  // ---------------------------------------------------------------------------
  // Inventory helpers
  // ---------------------------------------------------------------------------

  addItem(item: InventoryItem): void {
    this.state.addItem(item);
    this.bus.emit('suit:inventory_change', { action: 'add', item });
  }

  removeItem(id: string): boolean {
    const removed = this.state.removeItem(id);
    if (removed) this.bus.emit('suit:inventory_change', { action: 'remove', id });
    return removed;
  }

  hasItem(id: string): boolean {
    return this.state.hasItem(id);
  }

  getItems(): InventoryItem[] {
    return this.state.getItems();
  }

  // ---------------------------------------------------------------------------
  // Direct stat accessors (for external systems)
  // ---------------------------------------------------------------------------

  get oxygen():     number { return this.state.oxygen;     }
  get battery():    number { return this.state.battery;    }
  get temperature():number { return this.state.temperature;}
  get integrity():  number { return this.state.integrity;  }
  get signal():     number { return this.state.signal;     }

  /** Directly replenish oxygen (e.g. docking with O₂ tank) */
  replenishOxygen(amount: number): void {
    this.state.oxygen = Math.min(100, this.state.oxygen + amount);
    this.bus.emit('suit:replenish', { stat: 'oxygen', amount });
  }

  /** Directly replenish battery (e.g. solar charger pickup) */
  chargeBattery(amount: number): void {
    this.state.battery = Math.min(100, this.state.battery + amount);
    this.bus.emit('suit:replenish', { stat: 'battery', amount });
  }

  /** Apply suit damage (e.g. from hazard) */
  applyDamage(amount: number): void {
    this.state.integrity = Math.max(0, this.state.integrity - amount);
    this.bus.emit('suit:damage', { amount, integrity: this.state.integrity });
  }

  // ---------------------------------------------------------------------------
  // Warning emission (transition-based)
  // ---------------------------------------------------------------------------

  private _emitWarnings(): void {
    const status = this.state.getStatus();
    const integrityLow = this.state.integrity < 20;

    if (status.oxygenCritical && !this.prevStatus.oxygenCritical) {
      this._warn('oxygen_critical', this.state.oxygen, '⚠ OXYGEN CRITICAL');
    } else if (status.oxygenWarning && !this.prevStatus.oxygenWarning) {
      this._warn('oxygen_warning', this.state.oxygen, '⚠ OXYGEN LOW');
    }

    if (status.batteryWarning && !this.prevStatus.batteryWarning) {
      this._warn('battery_warning', this.state.battery, '⚠ BATTERY LOW');
    }

    if (status.tempWarning && !this.prevStatus.tempWarning) {
      this._warn('temp_warning', this.state.temperature, '⚠ TEMPERATURE WARNING');
    }

    if (status.signalLost && !this.prevStatus.signalLost) {
      this._warn('signal_lost', this.state.signal, '⚠ SIGNAL LOST');
    } else if (!status.signalLost && this.prevStatus.signalLost) {
      this._warn('signal_restored', this.state.signal, 'SIGNAL RESTORED');
    }

    if (integrityLow && !this.prevIntegrityLow) {
      this._warn('integrity_low', this.state.integrity, '⚠ SUIT INTEGRITY LOW');
    }

    this.prevStatus = { ...status };
    this.prevIntegrityLow = integrityLow;
  }

  private _warn(
    type: SuitWarningPayload['type'],
    value: number,
    message: string,
  ): void {
    const payload: SuitWarningPayload = { type, value, message };
    this.bus.emit('suit:warning', payload);
    // Also emit the specific event type for fine-grained listeners
    this.bus.emit(`suit:${type}`, payload);
  }
}
