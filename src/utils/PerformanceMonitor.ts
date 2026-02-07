/**
 * Performance monitoring and adaptive quality
 */
export class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private historySize: number = 60; // Track last 60 frames
  private lowFpsThreshold: number = 30;
  private criticalFpsThreshold: number = 20;
  private onQualityDowngrade?: () => void;
  private isWebGPU: boolean = false;
  private renderer?: any;

  update(fps: number): void {
    this.fpsHistory.push(fps);
    
    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift();
    }

    // Check for sustained low FPS
    if (this.fpsHistory.length === this.historySize) {
      const avgFps = this.getAverageFPS();
      
      if (avgFps < this.criticalFpsThreshold) {
        console.warn('⚠️ Critical FPS detected:', avgFps);
        if (this.onQualityDowngrade) {
          this.onQualityDowngrade();
        }
      }
    }
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  isPerformanceGood(): boolean {
    return this.getAverageFPS() >= this.lowFpsThreshold;
  }

  setQualityDowngradeCallback(callback: () => void): void {
    this.onQualityDowngrade = callback;
  }

  getMemoryUsage(): { used: number; total: number } | null {
    // @ts-ignore - performance.memory is non-standard
    if (performance.memory) {
      // @ts-ignore
      const mem = performance.memory;
      return {
        used: Math.round(mem.usedJSHeapSize / 1048576), // MB
        total: Math.round(mem.totalJSHeapSize / 1048576), // MB
      };
    }
    return null;
  }

  logPerformanceStats(): void {
    // Performance stats logging removed - re-enable for debugging if needed
  }

  setRenderer(renderer: any, isWebGPU: boolean): void {
    this.renderer = renderer;
    this.isWebGPU = isWebGPU;
  }

  getRendererInfo(): { backend: string; info: any } | null {
    if (!this.renderer) return null;
    
    return {
      backend: this.isWebGPU ? 'WebGPU' : 'WebGL',
      info: this.renderer.info || null,
    };
  }
}
