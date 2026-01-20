import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

/**
 * WebGPU/WebGL Renderer wrapper with optimized settings and automatic fallback
 */
export class Renderer {
  public renderer: THREE.WebGLRenderer | WebGPURenderer;
  public isWebGPU: boolean = false;
  private readonly onResizeHandler: () => void;

  constructor(canvas: HTMLCanvasElement) {
    // Check WebGPU availability and initialize appropriate renderer
    const isWebGPUAvailable = 'gpu' in navigator && typeof WebGPURenderer !== 'undefined';
    
    if (isWebGPUAvailable) {
      try {
        this.renderer = new WebGPURenderer({
          canvas,
          antialias: true,
        });
        this.isWebGPU = true;
        console.log('🚀 WebGPU Renderer initialized');
      } catch (error) {
        console.warn('Failed to initialize WebGPU, falling back to WebGL:', error);
        this.renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        });
        this.isWebGPU = false;
      }
    } else {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      this.isWebGPU = false;
      console.log('🌐 WebGL Renderer (WebGPU not available in this Three.js version)');
      
      // Log why WebGPU is not available
      if (!('gpu' in navigator)) {
        console.log('  Reason: Browser does not support WebGPU API');
      }
    }

    this.setupRenderer();

    // Handle resize
    this.onResizeHandler = this.onResize.bind(this);
    window.addEventListener('resize', this.onResizeHandler);
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    // WebGPU supports async rendering, but we'll use sync version for compatibility
    // with existing code. The renderAsync() method can be used for advanced cases.
    this.renderer.render(scene, camera);
  }

  async renderAsync(scene: THREE.Scene, camera: THREE.Camera): Promise<void> {
    if (this.isWebGPU) {
      // Use async rendering for WebGPU (better pipeline optimization)
      await (this.renderer as WebGPURenderer).renderAsync(scene, camera);
    } else {
      // WebGL is synchronous
      this.renderer.render(scene, camera);
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResizeHandler);
    this.renderer.dispose();
  }
}
