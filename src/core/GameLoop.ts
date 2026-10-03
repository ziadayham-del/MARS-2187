export class GameLoop {
  isRunning: boolean = false;
  isPaused: boolean = false;
  time: number = 0;
  delta: number = 0;
  fps: number = 0;
  
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private updateFn: ((delta: number, time: number) => void) | null = null;
  private renderFn: (() => void) | null = null;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;

  constructor() {}

  start(updateFn: (delta: number, time: number) => void, renderFn: () => void): void {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
    this.lastFpsTime = this.lastTime;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    const currentTime = performance.now() / 1000;
    this.delta = currentTime - this.lastTime;
    
    // Cap delta
    if (this.delta > 0.1) {
      this.delta = 0.1;
    }
    
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.time += this.delta;
      if (this.updateFn) this.updateFn(this.delta, this.time);
    }

    if (this.renderFn) this.renderFn();

    // Calculate FPS
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }
  }

  dispose(): void {
    this.stop();
  }
}
