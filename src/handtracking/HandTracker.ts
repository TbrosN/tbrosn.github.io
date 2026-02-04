import type { Results } from "@mediapipe/hands";
import type { CameraOptions } from "@mediapipe/camera_utils";

const MEDIAPIPE_HANDS_VERSION = "0.4.1675469240";
const MEDIAPIPE_CAMERA_UTILS_VERSION = "0.3.1675466862";

const HANDS_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/`;
const CAMERA_UTILS_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${MEDIAPIPE_CAMERA_UTILS_VERSION}/camera_utils.js`;

/**
 * MediaPipe hand tracking wrapper
 */
export class HandTracker {
  private hands!: any;
  private camera!: any;
  private videoElement!: HTMLVideoElement;
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private onResultsCallback?: (results: Results) => void;

  private static scriptPromises: Map<string, Promise<void>> = new Map();

  private loadScriptOnce(src: string): Promise<void> {
    const existing = HandTracker.scriptPromises.get(src);
    if (existing) return existing;

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });

    HandTracker.scriptPromises.set(src, promise);
    return promise;
  }

  private async ensureMediapipeLoaded(): Promise<void> {
    // MediaPipe packages are distributed as UMD bundles that attach globals.
    // Loading them via <script> is the most reliable approach across Vite dev/prod.
    await this.loadScriptOnce(`${HANDS_BASE}hands.js`);
    await this.loadScriptOnce(CAMERA_UTILS_URL);
  }

  private resolveHandsCtor(): any {
    const ctor = (globalThis as any).Hands;
    if (typeof ctor !== "function") {
      throw new Error(
        "MediaPipe Hands constructor not found on globalThis.Hands",
      );
    }
    return ctor;
  }

  private resolveCameraCtor(): any {
    const ctor = (globalThis as any).Camera;
    if (typeof ctor !== "function") {
      throw new Error(
        "MediaPipe Camera constructor not found on globalThis.Camera",
      );
    }
    return ctor;
  }

  async init(): Promise<void> {
    // Create video element
    this.videoElement = document.createElement("video");
    this.videoElement.style.display = "none";
    document.body.appendChild(this.videoElement);

    await this.ensureMediapipeLoaded();

    // Initialize MediaPipe Hands
    const HandsCtor = this.resolveHandsCtor();
    this.hands = new HandsCtor({
      locateFile: (file) => {
        return `${HANDS_BASE}${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results) => {
      if (this.onResultsCallback) {
        this.onResultsCallback(results);
      }
    });

    this.isInitialized = true;
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("HandTracker not initialized. Call init() first.");
    }

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      // Start MediaPipe camera (from global)
      const CameraCtor = this.resolveCameraCtor();
      const options: CameraOptions = {
        onFrame: async () => {
          if (this.isTracking) {
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480,
      };
      this.camera = new CameraCtor(this.videoElement, options);

      await this.camera.start();
      this.isTracking = true;
    } catch (error) {
      console.error("❌ Failed to start hand tracking:", error);
      throw error;
    }
  }

  stop(): void {
    this.isTracking = false;

    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    if (this.camera) {
      this.camera.stop();
    }
  }

  onResults(callback: (results: Results) => void): void {
    this.onResultsCallback = callback;
  }

  isActive(): boolean {
    return this.isTracking;
  }

  dispose(): void {
    this.stop();
    if (this.videoElement) {
      this.videoElement.remove();
    }
  }
}
