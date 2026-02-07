import * as THREE from "three";

/**
 * Custom error for WebGL context creation failure
 */
export class WebGLContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebGLContextError";
  }
}

/**
 * WebGL Renderer wrapper with optimized settings
 * Note: WebGPU support disabled due to Three.js r170 bundling issues causing duplicate instances
 */
export class Renderer {
  public renderer: THREE.WebGLRenderer;
  public isWebGPU: boolean = false;
  private readonly onResizeHandler: () => void;

  constructor(canvas: HTMLCanvasElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch (error) {
      // WebGL context creation failed - likely due to GPU being disabled (low battery, etc.)
      throw new WebGLContextError(
        "WebGL is unavailable. This may be due to low battery mode disabling GPU access. " +
          "Please plug in your device or enable hardware acceleration in your browser settings.",
      );
    }

    // Verify the context was actually created
    const gl = this.renderer.getContext();
    if (!gl) {
      throw new WebGLContextError(
        "WebGL context could not be created. Please ensure your device is plugged in " +
          "and hardware acceleration is enabled in your browser.",
      );
    }

    this.setupRenderer();

    // Handle resize
    this.onResizeHandler = this.onResize.bind(this);
    window.addEventListener("resize", this.onResizeHandler);
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
    this.renderer.render(scene, camera);
  }

  async renderAsync(scene: THREE.Scene, camera: THREE.Camera): Promise<void> {
    // WebGL is synchronous, but keep the async signature for API compatibility
    this.renderer.render(scene, camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResizeHandler);
    this.renderer.dispose();
  }
}
