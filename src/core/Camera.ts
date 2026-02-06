import * as THREE from "three";
import { DEBUG } from "../constants";
import DebugUI from "../utils/DebugUI";

/**
 * Camera system with first-person perspective
 */
export class Camera {
  public camera: THREE.PerspectiveCamera;
  public pitch: number = 0;
  public yaw: number = 0;
  private keyListener?: (event: KeyboardEvent) => void;
  public heightSettings = { eyeHeight: 15.0 };

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );

    this.camera.position.set(0, this.heightSettings.eyeHeight, 5);

    window.addEventListener("resize", this.onResize.bind(this));

    if (DEBUG) {
      this.setupHeightControls();
    }
  }

  private setupHeightControls(): void {
    const gui = DebugUI.getGUI();
    if (!gui) return;

    // Add display-only control (disable pointer interaction)
    gui
      .add(this.heightSettings, "eyeHeight")
      .name("Camera Height")
      .disable()
      .listen();

    // Add keyboard controls for height adjustment (works with pointer lock)
    this.keyListener = (event: KeyboardEvent) => {
      if (event.code === "BracketLeft") {
        // [ key - decrease height
        this.heightSettings.eyeHeight = Math.max(
          0,
          this.heightSettings.eyeHeight - 1,
        );
        this.camera.position.y = this.heightSettings.eyeHeight;
        console.log(
          `👁️ Camera height: ${this.heightSettings.eyeHeight.toFixed(1)}m`,
        );
      } else if (event.code === "BracketRight") {
        // ] key - increase height
        this.heightSettings.eyeHeight = Math.min(
          100.0,
          this.heightSettings.eyeHeight + 1,
        );
        this.camera.position.y = this.heightSettings.eyeHeight;
        console.log(
          `👁️ Camera height: ${this.heightSettings.eyeHeight.toFixed(1)}m`,
        );
      }
    };
    window.addEventListener("keydown", this.keyListener);

    console.log("🎮 Camera height controls: [ ] to adjust");
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  updateRotation(
    deltaX: number,
    deltaY: number,
    sensitivity: number = 0.002,
  ): void {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;

    // Clamp pitch to prevent camera flip
    this.pitch = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, this.pitch),
    );

    // Apply rotation
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  getForwardVector(): THREE.Vector3 {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y = 0; // Keep on horizontal plane
    direction.normalize();
    return direction;
  }

  getRightVector(): THREE.Vector3 {
    const forward = this.getForwardVector();
    return new THREE.Vector3(-forward.z, 0, forward.x);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    if (this.keyListener) {
      window.removeEventListener("keydown", this.keyListener);
    }
  }
}
