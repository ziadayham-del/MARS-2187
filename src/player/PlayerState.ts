// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SuitStatus {
  oxygenWarning: boolean;   // oxygen < 25
  oxygenCritical: boolean;  // oxygen < 10
  batteryWarning: boolean;  // battery < 20
  tempWarning: boolean;     // temperature outside safe range
  signalLost: boolean;      // signal < 5
  foodWarning: boolean;
  waterWarning: boolean;
}

export interface WorldStateInterface {
  isInsideHabitat: boolean;
  isNearOxygenSource: boolean;
  powerOnline: boolean;
  stormActive: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  /** Icon/category tag e.g. "sample", "tool", "medical" */
  category: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Oxygen drain rates in units per second */
const OXY_DRAIN_OUTSIDE_NORMAL = 0.5 / 60;        // 0.5 per minute
const OXY_DRAIN_OUTSIDE_STORM  = 2.0 / 60;        // 2.0 per minute (fast)
const OXY_REFILL_HABITAT       = 4.0 / 60;        // refill when powered & inside

/** Battery drain rates in units per second */
const BAT_DRAIN_FLASHLIGHT     = 1.0 / 60;        // 1 per minute when flashlight on
const BAT_DRAIN_OUTSIDE        = 0.5 / 60;        // additional drain outside (heating)
const BAT_CHARGE_HABITAT       = 2.0 / 60;        // charge in powered habitat

/** Temperature bounds */
const TEMP_SAFE_MIN =  15;  // °C
const TEMP_SAFE_MAX =  35;  // °C
const TEMP_MARS_OUTSIDE = -60; // cold target when fully exposed
const TEMP_HABITAT      =  22; // comfortable inside
const TEMP_STORM_DELTA  = -20; // additional cooling during storm
const TEMP_LERP_SPEED   = 0.02; // how fast temp converges

/** Signal */
const SIGNAL_STORM_DRAIN = 20 / 60; // drain per second during storm
const SIGNAL_REFILL      = 10 / 60;

// ---------------------------------------------------------------------------
// PlayerState
// ---------------------------------------------------------------------------

export class PlayerState {
  // Suit stats (0-100 unless noted)
  oxygen: number = 100;
  battery: number = 100;
  temperature: number = 22;   // °C
  integrity: number = 100;
  signal: number = 100;

  // Context flags
  isOutside: boolean = true;
  isInPoweredArea: boolean = false;
  flashlightOn: boolean = false;

  // Inventory
  private inventory: Map<string, InventoryItem> = new Map();

  constructor() {
    // Initial state is player starting inside habitat
    this.isOutside = false;
    this.isInPoweredArea = true;
  }

  // ---------------------------------------------------------------------------
  // Update – called once per frame
  // ---------------------------------------------------------------------------

  update(delta: number, worldState: WorldStateInterface): void {
    // Sync context from world state
    this.isOutside = !worldState.isInsideHabitat;
    this.isInPoweredArea = worldState.powerOnline && worldState.isInsideHabitat;

    this._updateOxygen(delta, worldState);
    this._updateBattery(delta, worldState);
    this._updateTemperature(delta, worldState);
    this._updateSignal(delta, worldState);

    // Clamp all values
    this.oxygen      = this._clamp(this.oxygen,      0, 100);
    this.battery     = this._clamp(this.battery,     0, 100);
    this.integrity   = this._clamp(this.integrity,   0, 100);
    this.signal      = this._clamp(this.signal,      0, 100);
  }

  // ---------------------------------------------------------------------------
  // Status snapshot
  // ---------------------------------------------------------------------------

  getStatus(): SuitStatus {
    return {
      oxygenWarning:  this.oxygen < 25,
      oxygenCritical: this.oxygen < 10,
      batteryWarning: this.battery < 20,
      tempWarning:    this.temperature < TEMP_SAFE_MIN || this.temperature > TEMP_SAFE_MAX,
      signalLost:     this.signal < 5,
      foodWarning:    this.calories < 500,
      waterWarning:   this.water < 20
    };
  }

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  addItem(item: InventoryItem): void {
    const existing = this.inventory.get(item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.inventory.set(item.id, { ...item });
    }
  }

  removeItem(id: string): boolean {
    const item = this.inventory.get(id);
    if (!item) return false;

    item.quantity -= 1;
    if (item.quantity <= 0) {
      this.inventory.delete(id);
    }
    return true;
  }

  hasItem(id: string): boolean {
    const item = this.inventory.get(id);
    return item !== undefined && item.quantity > 0;
  }

  getItems(): InventoryItem[] {
    return Array.from(this.inventory.values());
  }

  // ---------------------------------------------------------------------------
  // Private update helpers
  // ---------------------------------------------------------------------------

  private _updateOxygen(delta: number, world: WorldStateInterface): void {
    if (world.isNearOxygenSource || (world.isInsideHabitat && world.powerOnline)) {
      // Refill oxygen when inside a powered habitat or near O₂ source
      this.oxygen += OXY_REFILL_HABITAT * delta;
    } else if (!world.isInsideHabitat) {
      // Outside – drain based on storm activity
      const drainRate = world.stormActive ? OXY_DRAIN_OUTSIDE_STORM : OXY_DRAIN_OUTSIDE_NORMAL;
      this.oxygen -= drainRate * delta;
    }
    // Inside habitat without power – oxygen stays constant (sealed)
  }

  private _updateBattery(delta: number, world: WorldStateInterface): void {
    if (world.isInsideHabitat && world.powerOnline) {
      // Charge when in powered habitat
      this.battery += BAT_CHARGE_HABITAT * delta;
    } else {
      // Drain for flashlight
      if (this.flashlightOn) {
        this.battery -= BAT_DRAIN_FLASHLIGHT * delta;
      }
      // Extra drain when outside (suit heating system)
      if (!world.isInsideHabitat) {
        this.battery -= BAT_DRAIN_OUTSIDE * delta;
        // Storm doubles outside drain
        if (world.stormActive) {
          this.battery -= BAT_DRAIN_OUTSIDE * delta;
        }
      }
    }

    // Auto-disable flashlight if battery dies
    if (this.battery <= 0) {
      this.flashlightOn = false;
    }
  }

  private _updateTemperature(delta: number, world: WorldStateInterface): void {
    let targetTemp: number;

    if (world.isInsideHabitat && world.powerOnline) {
      targetTemp = TEMP_HABITAT;
    } else if (world.isInsideHabitat) {
      // Unpowered habitat – cold but insulated
      targetTemp = (TEMP_MARS_OUTSIDE + TEMP_HABITAT) * 0.5;
    } else {
      // Fully outside
      targetTemp = TEMP_MARS_OUTSIDE + (world.stormActive ? TEMP_STORM_DELTA : 0);
    }

    // Lerp toward target
    this.temperature += (targetTemp - this.temperature) * TEMP_LERP_SPEED;

    // Extreme temperatures damage suit integrity slowly
    const status = this.getStatus();
    if (status.tempWarning && this.isOutside) {
      this.integrity -= 0.5 / 60 * delta;
    }
  }

  private _updateSignal(delta: number, world: WorldStateInterface): void {
    if (world.stormActive) {
      this.signal -= SIGNAL_STORM_DRAIN * delta;
    } else if (world.isInsideHabitat && world.powerOnline) {
      this.signal += SIGNAL_REFILL * delta;
    } else if (!world.stormActive) {
      // Gradual recovery outside when no storm
      this.signal += (SIGNAL_REFILL * 0.3) * delta;
    }
  }

  private _clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
