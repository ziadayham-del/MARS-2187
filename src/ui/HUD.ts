// ============================================================
// HUD.ts — MARS: 2187 in-game Heads-Up Display
// ============================================================

export interface SuitHUDData {
  oxygen: number;       // 0–100
  battery: number;      // 0–100
  temperature: number;  // 0–100 (mapped from actual °C range)
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
    /* ── HUD Root ── */
    #mars-hud {
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
      font-family: 'Courier New', Courier, monospace;
      color: #00ccff;
      font-size: 12px;
      letter-spacing: 0.08em;
      user-select: none;
    }

    /* ── Glass Panel ── */
    .hud-panel {
      background: rgba(0, 15, 25, 0.6);
      border: 1px solid rgba(0, 200, 255, 0.3);
      border-radius: 2px;
      padding: 10px 14px;
      backdrop-filter: blur(4px);
    }

    /* ── Crosshair ── */
    #hud-crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
    }
    #hud-crosshair::before,
    #hud-crosshair::after {
      content: '';
      position: absolute;
      background: rgba(0, 200, 255, 0.75);
    }
    #hud-crosshair::before {
      width: 2px;
      height: 100%;
      left: 50%;
      transform: translateX(-50%);
    }
    #hud-crosshair::after {
      height: 2px;
      width: 100%;
      top: 50%;
      transform: translateY(-50%);
    }
    #hud-crosshair-dot {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(0, 200, 255, 0.9);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* ── Mission Panel (top-left) ── */
    #hud-mission {
      position: absolute;
      top: 20px;
      left: 20px;
      min-width: 240px;
      max-width: 340px;
    }
    #hud-mission-name {
      font-size: 10px;
      color: rgba(0, 200, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin-bottom: 4px;
    }
    #hud-mission-objective {
      font-size: 12px;
      color: #ffffff;
      line-height: 1.5;
    }

    /* ── Suit Status (bottom-left) ── */
    #hud-suit {
      position: absolute;
      bottom: 24px;
      left: 20px;
      min-width: 200px;
    }
    .suit-stat-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 7px;
    }
    .suit-stat-row:last-child { margin-bottom: 0; }
    .suit-label {
      width: 32px;
      font-size: 9px;
      color: rgba(0, 200, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      flex-shrink: 0;
    }
    .suit-bar-bg {
      flex: 1;
      height: 6px;
      background: rgba(0, 40, 60, 0.8);
      border: 1px solid rgba(0, 200, 255, 0.2);
      border-radius: 1px;
      overflow: hidden;
      position: relative;
    }
    .suit-bar-fill {
      height: 100%;
      border-radius: 1px;
      transition: width 0.4s ease, background-color 0.3s ease;
    }
    .suit-bar-fill.oxygen  { background: linear-gradient(90deg, #009999, #00e5ff); }
    .suit-bar-fill.battery { background: linear-gradient(90deg, #006633, #00ff88); }
    .suit-bar-fill.temp    { background: linear-gradient(90deg, #003399, #0066ff); }
    .suit-bar-fill.critical { background: linear-gradient(90deg, #991100, #ff2200); }
    .suit-bar-fill.warning  { background: linear-gradient(90deg, #996600, #ffaa00); }
    .suit-value {
      width: 36px;
      text-align: right;
      font-size: 10px;
      color: #ffffff;
      flex-shrink: 0;
    }

    /* ── System Status (top-right) ── */
    #hud-system {
      position: absolute;
      top: 20px;
      right: 20px;
      min-width: 160px;
    }
    #hud-system-title {
      font-size: 9px;
      color: rgba(0, 200, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin-bottom: 8px;
    }
    .sys-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .sys-row:last-child { margin-bottom: 0; }
    .sys-key {
      font-size: 10px;
      color: rgba(0, 200, 255, 0.8);
      letter-spacing: 0.12em;
    }
    .sys-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .sys-dot.online  { background: #00ff88; box-shadow: 0 0 6px #00ff88; }
    .sys-dot.offline { background: #ff2200; box-shadow: 0 0 6px #ff2200; animation: pulse-critical 1s infinite; }

    /* ── Interaction Prompt (bottom-right) ── */
    #hud-interact {
      position: absolute;
      bottom: 24px;
      right: 20px;
      text-align: right;
      transition: opacity 0.3s ease;
    }
    #hud-interact-key {
      font-size: 13px;
      color: #ffffff;
      letter-spacing: 0.1em;
    }
    #hud-interact-action {
      font-size: 10px;
      color: rgba(0, 200, 255, 0.8);
      letter-spacing: 0.15em;
      margin-top: 2px;
    }

    /* ── Storm Warning (top-center) ── */
    #hud-storm {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      padding: 8px 28px;
      background: rgba(120, 50, 0, 0.75);
      border: 1px solid rgba(255, 170, 0, 0.5);
      border-top: none;
      border-radius: 0 0 4px 4px;
      transition: opacity 0.4s ease;
    }
    #hud-storm-text {
      font-size: 11px;
      color: #ffaa00;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      animation: pulse-warn 1.4s ease-in-out infinite;
    }

    /* ── Objective Complete Banner ── */
    #hud-obj-complete {
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      text-align: center;
      padding: 10px 30px;
      background: rgba(0, 15, 25, 0.85);
      border: 1px solid rgba(0, 255, 136, 0.5);
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s ease;
      pointer-events: none;
    }
    #hud-obj-complete.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #hud-obj-complete-label {
      font-size: 9px;
      color: #00ff88;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    #hud-obj-complete-text {
      font-size: 12px;
      color: #ffffff;
      letter-spacing: 0.1em;
    }

    /* ── ORION Message (top-center, below storm) ── */
    #hud-orion {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      min-width: 320px;
      max-width: 520px;
      padding: 10px 20px;
      background: rgba(0, 15, 40, 0.8);
      border: 1px solid rgba(0, 200, 255, 0.25);
      border-radius: 2px;
      transition: opacity 0.3s ease;
    }
    #hud-orion-label {
      font-size: 9px;
      color: rgba(0, 200, 255, 0.6);
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    #hud-orion-text {
      font-size: 12px;
      color: #ffffff;
      line-height: 1.5;
    }

    /* ── Autosave Indicator ── */
    #hud-autosave {
      position: absolute;
      bottom: 24px;
      right: 20px;
      font-size: 10px;
      color: rgba(0, 200, 255, 0.7);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      transition: opacity 0.5s ease;
    }

    /* ── Animations ── */
    @keyframes pulse-critical {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
    @keyframes pulse-warn {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

// ────────────────────────────────────────────────────────────
export class HUD {
  private root: HTMLElement;
  private crosshair!: HTMLElement;
  private missionNameEl!: HTMLElement;
  private missionObjEl!: HTMLElement;
  private suitBars: Record<string, { fill: HTMLElement; value: HTMLElement }> = {};
  private systemDots: Record<string, HTMLElement> = {};
  private interactEl!: HTMLElement;
  private interactKeyEl!: HTMLElement;
  private interactActionEl!: HTMLElement;
  private stormEl!: HTMLElement;
  private objCompleteEl!: HTMLElement;
  private objCompleteTextEl!: HTMLElement;
  private orionEl!: HTMLElement;
  private orionTextEl!: HTMLElement;
  private autosaveEl!: HTMLElement;
  private systemPanel!: HTMLElement;

  private orionTimer: ReturnType<typeof setTimeout> | null = null;
  private objTimer: ReturnType<typeof setTimeout> | null = null;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    injectHUDStyles();
    this.root = document.createElement('div');
    this.root.id = 'mars-hud';
    this.root.style.display = 'none';
    this.buildDOM();
    document.body.appendChild(this.root);
  }

  // ── Build ────────────────────────────────────────────────

  private buildDOM(): void {
    this.root.innerHTML = '';

    // Crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.id = 'hud-crosshair';
    const dot = document.createElement('div');
    dot.id = 'hud-crosshair-dot';
    this.crosshair.appendChild(dot);
    this.root.appendChild(this.crosshair);

    // Mission panel (top-left)
    const missionPanel = document.createElement('div');
    missionPanel.id = 'hud-mission';
    missionPanel.className = 'hud-panel';
    this.missionNameEl = document.createElement('div');
    this.missionNameEl.id = 'hud-mission-name';
    this.missionNameEl.textContent = 'MISSION';
    this.missionObjEl = document.createElement('div');
    this.missionObjEl.id = 'hud-mission-objective';
    this.missionObjEl.textContent = '—';
    missionPanel.appendChild(this.missionNameEl);
    missionPanel.appendChild(this.missionObjEl);
    this.root.appendChild(missionPanel);

    // Suit status (bottom-left)
    const suitPanel = document.createElement('div');
    suitPanel.id = 'hud-suit';
    suitPanel.className = 'hud-panel';
    for (const [key, cls] of [['O2', 'oxygen'], ['BAT', 'battery'], ['TMP', 'temp']] as [string, string][]) {
      const row = document.createElement('div');
      row.className = 'suit-stat-row';
      const label = document.createElement('div');
      label.className = 'suit-label';
      label.textContent = key;
      const barBg = document.createElement('div');
      barBg.className = 'suit-bar-bg';
      const fill = document.createElement('div');
      fill.className = `suit-bar-fill ${cls}`;
      fill.style.width = '100%';
      barBg.appendChild(fill);
      const val = document.createElement('div');
      val.className = 'suit-value';
      val.textContent = '100%';
      row.appendChild(label);
      row.appendChild(barBg);
      row.appendChild(val);
      suitPanel.appendChild(row);
      this.suitBars[key] = { fill, value: val };
    }
    this.root.appendChild(suitPanel);

    // System status (top-right)
    this.systemPanel = document.createElement('div');
    this.systemPanel.id = 'hud-system';
    this.systemPanel.className = 'hud-panel';
    const sysTitle = document.createElement('div');
    sysTitle.id = 'hud-system-title';
    sysTitle.textContent = 'SYSTEM STATUS';
    this.systemPanel.appendChild(sysTitle);
    for (const key of ['POWER', 'O2', 'COMMS']) {
      const row = document.createElement('div');
      row.className = 'sys-row';
      const keyEl = document.createElement('div');
      keyEl.className = 'sys-key';
      keyEl.textContent = key;
      const dot = document.createElement('div');
      dot.className = 'sys-dot online';
      row.appendChild(keyEl);
      row.appendChild(dot);
      this.systemPanel.appendChild(row);
      this.systemDots[key] = dot;
    }
    this.root.appendChild(this.systemPanel);

    // Interaction prompt (bottom-right)
    this.interactEl = document.createElement('div');
    this.interactEl.id = 'hud-interact';
    this.interactEl.className = 'hud-panel';
    this.interactEl.style.opacity = '0';
    this.interactKeyEl = document.createElement('div');
    this.interactKeyEl.id = 'hud-interact-key';
    this.interactActionEl = document.createElement('div');
    this.interactActionEl.id = 'hud-interact-action';
    this.interactEl.appendChild(this.interactKeyEl);
    this.interactEl.appendChild(this.interactActionEl);
    this.root.appendChild(this.interactEl);

    // Storm warning (top-center)
    this.stormEl = document.createElement('div');
    this.stormEl.id = 'hud-storm';
    this.stormEl.style.opacity = '0';
    const stormText = document.createElement('div');
    stormText.id = 'hud-storm-text';
    stormText.textContent = '⚠  DUST STORM APPROACHING  ⚠';
    this.stormEl.appendChild(stormText);
    this.root.appendChild(this.stormEl);

    // Objective complete banner
    this.objCompleteEl = document.createElement('div');
    this.objCompleteEl.id = 'hud-obj-complete';
    const objLabel = document.createElement('div');
    objLabel.id = 'hud-obj-complete-label';
    objLabel.textContent = 'OBJECTIVE COMPLETE';
    this.objCompleteTextEl = document.createElement('div');
    this.objCompleteTextEl.id = 'hud-obj-complete-text';
    this.objCompleteEl.appendChild(objLabel);
    this.objCompleteEl.appendChild(this.objCompleteTextEl);
    this.root.appendChild(this.objCompleteEl);

    // ORION message
    this.orionEl = document.createElement('div');
    this.orionEl.id = 'hud-orion';
    this.orionEl.style.opacity = '0';
    const orionLabel = document.createElement('div');
    orionLabel.id = 'hud-orion-label';
    orionLabel.textContent = 'ORION AI';
    this.orionTextEl = document.createElement('div');
    this.orionTextEl.id = 'hud-orion-text';
    this.orionEl.appendChild(orionLabel);
    this.orionEl.appendChild(this.orionTextEl);
    this.root.appendChild(this.orionEl);

    // Autosave
    this.autosaveEl = document.createElement('div');
    this.autosaveEl.id = 'hud-autosave';
    this.autosaveEl.textContent = '◉  AUTOSAVE';
    this.autosaveEl.style.opacity = '0';
    this.root.appendChild(this.autosaveEl);
  }

  // ── Public API ───────────────────────────────────────────

  show(): void {
    this.root.style.display = 'block';
  }

  hide(): void {
    this.root.style.display = 'none';
  }

  setHUDOpacity(opacity: number): void {
    this.root.style.opacity = String(Math.max(0, Math.min(1, opacity)));
  }

  update(suitData: SuitHUDData, missionText: string, systemStatus: SystemStatus): void {
    // Mission objective
    this.missionObjEl.textContent = missionText;

    // Suit bars
    this.setSuitBar('O2', suitData.oxygen);
    this.setSuitBar('BAT', suitData.battery);
    this.setSuitBar('TMP', suitData.temperature);

    // System status
    for (const [key, online] of Object.entries(systemStatus)) {
      this.setSystemStatus(key, online);
    }
  }

  private setSuitBar(key: 'O2' | 'BAT' | 'TMP', value: number): void {
    const bar = this.suitBars[key];
    if (!bar) return;
    const clamped = Math.max(0, Math.min(100, value));
    bar.fill.style.width = `${clamped}%`;
    bar.value.textContent = `${Math.round(clamped)}%`;

    // Remove state classes
    bar.fill.classList.remove('critical', 'warning');
    if (clamped <= 20) {
      bar.fill.classList.add('critical');
      bar.value.style.color = '#ff2200';
    } else if (clamped <= 40) {
      bar.fill.classList.add('warning');
      bar.value.style.color = '#ffaa00';
    } else {
      bar.value.style.color = '#ffffff';
    }
  }

  setInteractionPrompt(text: string | null): void {
    if (text) {
      // Split on ' — ' pattern if present: 'E — ACCESS TERMINAL'
      const dashIdx = text.indexOf('—');
      if (dashIdx !== -1) {
        this.interactKeyEl.textContent = text.slice(0, dashIdx).trim();
        this.interactActionEl.textContent = text.slice(dashIdx).trim();
      } else {
        this.interactKeyEl.textContent = '[E]';
        this.interactActionEl.textContent = text;
      }
      this.interactEl.style.opacity = '1';
    } else {
      this.interactEl.style.opacity = '0';
    }
  }

  showObjectiveComplete(text: string): void {
    if (this.objTimer) clearTimeout(this.objTimer);
    this.objCompleteTextEl.textContent = text;
    this.objCompleteEl.classList.add('visible');
    this.objTimer = setTimeout(() => {
      this.objCompleteEl.classList.remove('visible');
    }, 4000);
  }

  showStormWarning(active: boolean): void {
    this.stormEl.style.opacity = active ? '1' : '0';
  }

  showORIONMessage(text: string, duration = 5000): void {
    if (this.orionTimer) clearTimeout(this.orionTimer);
    this.orionTextEl.textContent = '';
    this.orionEl.style.opacity = '1';
    this.typewriterEffect(this.orionTextEl, text, Math.min(duration * 0.4, 1500));
    this.orionTimer = setTimeout(() => {
      this.orionEl.style.opacity = '0';
    }, duration);
  }

  private typewriterEffect(el: HTMLElement, text: string, totalMs: number): void {
    el.textContent = '';
    const perChar = Math.max(16, totalMs / text.length);
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, perChar);
      }
    };
    tick();
  }

  setSystemStatus(key: string, online: boolean): void {
    // Add dot if new key
    if (!this.systemDots[key]) {
      const row = document.createElement('div');
      row.className = 'sys-row';
      const keyEl = document.createElement('div');
      keyEl.className = 'sys-key';
      keyEl.textContent = key;
      const dot = document.createElement('div');
      dot.className = 'sys-dot online';
      row.appendChild(keyEl);
      row.appendChild(dot);
      this.systemPanel.appendChild(row);
      this.systemDots[key] = dot;
    }
    const dot = this.systemDots[key];
    dot.className = `sys-dot ${online ? 'online' : 'offline'}`;
  }

  setMissionName(name: string): void {
    this.missionNameEl.textContent = name.toUpperCase();
  }

  showAutosave(): void {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    // Move autosave to bottom-right, above interact if hidden
    this.autosaveEl.style.opacity = '1';
    this.autosaveTimer = setTimeout(() => {
      this.autosaveEl.style.opacity = '0';
    }, 2500);
  }

  dispose(): void {
    if (this.orionTimer) clearTimeout(this.orionTimer);
    if (this.objTimer) clearTimeout(this.objTimer);
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.root.remove();
    const styleEl = document.getElementById(HUD_STYLE_ID);
    if (styleEl) styleEl.remove();
  }
}
