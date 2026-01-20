import * as THREE from 'three';

/**
 * Camera system with first-person perspective
 */
export class Camera {
  public camera: THREE.PerspectiveCamera;
  public pitch: number = 0;
  public yaw: number = 0;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    this.camera.position.set(0, 1.6, 5); // Eye height ~1.6m

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  updateRotation(deltaX: number, deltaY: number, sensitivity: number = 0.002): void {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    
    // Clamp pitch to prevent camera flip
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

    // Apply rotation
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
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
    window.removeEventListener('resize', this.onResize);
  }
}
