/**
 * Time management - handles delta time and frame tracking
 */
export class Time {
  private lastTime: number = performance.now();
  private _delta: number = 0;
  private _elapsed: number = 0;
  private _fps: number = 60;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  get delta(): number {
    return this._delta;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  get fps(): number {
    return this._fps;
  }

  update(): void {
    const currentTime = performance.now();
    this._delta = (currentTime - this.lastTime) / 1000;
    this._elapsed += this._delta;
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this._fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }
}
