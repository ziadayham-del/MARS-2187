// ============================================================
// HUD.ts - Cinematic FP Visor Overlay & Survival Mechanics
// ============================================================

export interface SuitHUDData {
  oxygen: number;
  battery: number;
  temperature: number; // raw value
  integrity: number;
  calories: number;
  water: number;
  heartRate: number;
}

export interface SystemStatus {
  POWER: boolean;
  O2: boolean;
  COMMS: boolean;
  [key: string]: boolean;
}

const HUD_STYLE_ID = 'mars2187-hud-styles';

function injectHUDStyles(): void {
  if (document.getElementById(HUD_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = HUD_STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    #mars-hud {
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
      font-family: 'Share Tech Mono', monospace;
      color: #99d6ff;
      user-select: none;
      overflow: hidden;
    }

    .visor-overlay {
      position: absolute;
      inset: 0;
      box-shadow: inset 0 0 100px rgba(0, 50, 100, 0.5), inset 0 0 200px rgba(0, 0, 0, 0.9);
      border-radius: 20%;
      transform: scale(1.1);
      pointer-events: none;
    }

    .hud-header {
      position: absolute;
      top: 5%;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      background: rgba(0, 30, 60, 0.4);
      padding: 10px 40px;
      border: 1px solid rgba(153, 214, 255, 0.4);
      border-radius: 4px;
      clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
    }

    .hud-eva-time {
      font-size: 28px;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 0 10px rgba(255,255,255,0.5);
    }

    .hud-panel {
      position: absolute;
      background: rgba(0, 20, 40, 0.5);
      border: 1px solid rgba(153, 214, 255, 0.3);
      padding: 15px;
      border-radius: 10px;
      backdrop-filter: blur(2px);
    }

    .hud-left {
      top: 15%;
      left: 8%;
      width: 200px;
    }

    .hud-right {
      top: 15%;
      right: 8%;
      width: 220px;
    }

    .hud-bottom-center {
      bottom: 8%;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .stat-label {
      color: #66b3ff;
    }

    .stat-value {
      font-weight: bold;
      color: #fff;
    }

    .stat-large {
      font-size: 36px;
      color: #fff;
      margin: 10px 0;
      text-shadow: 0 0 8px rgba(255,255,255,0.4);
    }

    .bar-container {
      width: 100%;
      height: 6px;
      background: rgba(0, 50, 100, 0.5);
      margin-top: 4px;
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #99d6ff;
      transition: width 0.3s;
    }

    .bar-fill.warning { background: #ffaa00; }
    .bar-fill.critical { background: #ff2200; }

    #hud-crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      background: rgba(255,255,255,0.5);
      transform: translate(-50%, -50%);
      border-radius: 50%;
    }

    .interaction-prompt {
      font-size: 16px;
      letter-spacing: 2px;
      color: #ffaa00;
      text-shadow: 0 0 5px rgba(255,170,0,0.5);
    }

    .scanline {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
      background-size: 100% 4px;
      pointer-events: none;
      opacity: 0.3;
    }
  `;
  document.head.appendChild(style);
}

export class HUD {
  private container: HTMLElement;
  private timeEl: HTMLElement;
  private tempEl: HTMLElement;
  private hrEl: HTMLElement;
  private integrityFill: HTMLElement;
  private oxyFill: HTMLElement;
  private waterFill: HTMLElement;
  private calFill: HTMLElement;
  private promptEl: HTMLElement;
  
  private startTime: number;

  constructor() {
    injectHUDStyles();
    
    this.container = document.createElement('div');
    this.container.id = 'mars-hud';
    
    this.container.innerHTML = `
      <div class="visor-overlay"></div>
      <div class="scanline"></div>
      
      <div class="hud-header">
        <div style="font-size:10px; color:#66b3ff;">EVA TIME</div>
        <div class="hud-eva-time" id="hud-eva-time">00:00:00</div>
      </div>

      <div class="hud-panel hud-left">
        <div style="text-align:center; margin-bottom:10px;">
          <svg width="60" height="120" viewBox="0 0 60 120">
            <!-- Simplified astronaut icon -->
            <rect x="20" y="30" width="20" height="35" fill="none" stroke="#99d6ff" stroke-width="2"/>
            <circle cx="30" cy="15" r="10" fill="none" stroke="#99d6ff" stroke-width="2"/>
            <rect x="10" y="30" width="8" height="30" fill="none" stroke="#99d6ff" stroke-width="2"/>
            <rect x="42" y="30" width="8" height="30" fill="none" stroke="#99d6ff" stroke-width="2"/>
            <rect x="22" y="67" width="7" height="35" fill="none" stroke="#99d6ff" stroke-width="2"/>
            <rect x="31" y="67" width="7" height="35" fill="none" stroke="#99d6ff" stroke-width="2"/>
          </svg>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">INTEGRITY</span>
          <span class="stat-value" id="hud-integrity-val">100%</span>
        </div>
        <div class="bar-container"><div class="bar-fill" id="hud-integrity-bar" style="width:100%"></div></div>
        
        <div class="stat-large" id="hud-temp" style="margin-top:20px; text-align:center;">76°F</div>
        <div style="text-align:center; color:#66b3ff; font-size:12px;">EXTERIOR TEMP</div>
      </div>

      <div class="hud-panel hud-right">
        <div class="stat-row">
          <span class="stat-label">O2 LEVEL</span>
          <span class="stat-value" id="hud-o2-val">100%</span>
        </div>
        <div class="bar-container"><div class="bar-fill" id="hud-o2-bar" style="width:100%"></div></div>

        <div class="stat-row" style="margin-top:15px;">
          <span class="stat-label">H2O SUPPLY</span>
          <span class="stat-value" id="hud-water-val">100%</span>
        </div>
        <div class="bar-container"><div class="bar-fill" id="hud-water-bar" style="width:100%"></div></div>
        
        <div class="stat-row" style="margin-top:15px;">
          <span class="stat-label">CALORIES</span>
          <span class="stat-value" id="hud-cal-val">2500</span>
        </div>
        <div class="bar-container"><div class="bar-fill" id="hud-cal-bar" style="width:100%"></div></div>

        <div style="margin-top:25px; text-align:right;">
          <div style="color:#66b3ff; font-size:10px; margin-bottom:5px;">HEART RATE</div>
          <div style="display:flex; align-items:center; justify-content:flex-end;">
            <svg width="60" height="20" viewBox="0 0 60 20" style="margin-right:10px;">
              <polyline points="0,10 15,10 20,2 25,18 30,10 60,10" fill="none" stroke="#ff4444" stroke-width="1.5" />
            </svg>
            <span class="stat-value" id="hud-hr-val" style="font-size:20px;">65 BPM</span>
          </div>
        </div>
      </div>

      <div id="hud-crosshair"></div>

      <div class="hud-bottom-center">
        <div id="hud-prompt" class="interaction-prompt"></div>
      </div>
    `;

    document.body.appendChild(this.container);
    
    this.timeEl = document.getElementById('hud-eva-time')!;
    this.tempEl = document.getElementById('hud-temp')!;
    this.hrEl = document.getElementById('hud-hr-val')!;
    this.integrityFill = document.getElementById('hud-integrity-bar')!;
    this.oxyFill = document.getElementById('hud-o2-bar')!;
    this.waterFill = document.getElementById('hud-water-bar')!;
    this.calFill = document.getElementById('hud-cal-bar')!;
    this.promptEl = document.getElementById('hud-prompt')!;
    
    this.startTime = Date.now();
    this.hide();
  }

  show(): void { this.container.style.display = 'block'; }
  hide(): void { this.container.style.display = 'none'; }

  update(suit: SuitHUDData, missionText: string, status: SystemStatus): void {
    // Format Time
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    this.timeEl.innerText = `${h}:${m}:${s}`;

    // Convert C to F for the cinematic HUD
    const tempF = Math.round(suit.temperature * 9/5 + 32);
    this.tempEl.innerText = `${tempF}°F`;
    if (tempF < 32) this.tempEl.style.color = '#ffaa00';
    else this.tempEl.style.color = '#fff';

    this.hrEl.innerText = `${Math.round(suit.heartRate)} BPM`;

    this.updateBar(this.integrityFill, suit.integrity, document.getElementById('hud-integrity-val')!);
    this.updateBar(this.oxyFill, suit.oxygen, document.getElementById('hud-o2-val')!);
    this.updateBar(this.waterFill, suit.water, document.getElementById('hud-water-val')!);
    
    // Calories (max assumed 3000)
    const calPct = Math.min(100, Math.max(0, (suit.calories / 3000) * 100));
    this.calFill.style.width = `${calPct}%`;
    document.getElementById('hud-cal-val')!.innerText = Math.round(suit.calories).toString();
    if (calPct < 20) this.calFill.className = 'bar-fill warning';
    else this.calFill.className = 'bar-fill';
  }

  private updateBar(el: HTMLElement, val: number, textEl: HTMLElement) {
    el.style.width = `${val}%`;
    textEl.innerText = `${Math.round(val)}%`;
    if (val < 15) el.className = 'bar-fill critical';
    else if (val < 30) el.className = 'bar-fill warning';
    else el.className = 'bar-fill';
  }

  setInteractionPrompt(text: string | null): void {
    if (text) {
      this.promptEl.innerText = text;
      this.promptEl.style.display = 'block';
    } else {
      this.promptEl.style.display = 'none';
    }
  }

  showObjectiveComplete(text: string): void {}
  showStormWarning(active: boolean): void {}
  showORIONMessage(text: string, duration?: number): void {}
  setSystemStatus(key: string, online: boolean): void {}
  showAutosave(): void {}
  setHUDOpacity(opacity: number): void { this.container.style.opacity = opacity.toString(); }

  dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
