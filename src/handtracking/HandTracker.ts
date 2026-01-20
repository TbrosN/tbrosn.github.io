import * as MPHands from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

/**
 * MediaPipe hand tracking wrapper
 */
export class HandTracker {
  private hands!: any;
  private camera!: MediaPipeCamera;
  private videoElement!: HTMLVideoElement;
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private onResultsCallback?: (results: Results) => void;

  private resolveHandsCtor(): any {
    // @mediapipe/hands ships as a UMD-style bundle. In dev, Vite can synthesize
    // named exports, but in prod the shape can differ depending on interop.
    const anyMod = MPHands as any;
    const ctor =
      anyMod.Hands ??
      anyMod.default?.Hands ??
      anyMod.default ??
      (globalThis as any).Hands;

    if (typeof ctor !== 'function') {
      throw new Error(
        `MediaPipe Hands constructor not found. Module keys: ${Object.keys(anyMod).join(', ')}`
      );
    }

    return ctor;
  }

  async init(): Promise<void> {
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);

    // Initialize MediaPipe Hands
    const HandsCtor = this.resolveHandsCtor();
    this.hands = new HandsCtor({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results) => {
      if (this.onResultsCallback) {
        this.onResultsCallback(results);
      }
    });

    this.isInitialized = true;
    console.log('✅ Hand tracking initialized');
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('HandTracker not initialized. Call init() first.');
    }

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      // Start MediaPipe camera
      this.camera = new MediaPipeCamera(this.videoElement, {
        onFrame: async () => {
          if (this.isTracking) {
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      this.camera.start();
      this.isTracking = true;

      console.log('✅ Hand tracking started');
    } catch (error) {
      console.error('❌ Failed to start hand tracking:', error);
      throw error;
    }
  }

  stop(): void {
    this.isTracking = false;
    
    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    if (this.camera) {
      this.camera.stop();
    }

    console.log('Hand tracking stopped');
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
