import * as THREE from 'three';
import type { Camera } from '../core/Camera';

/**
 * Raycasting system for object interaction
 */
export class Raycaster {
  private raycaster: THREE.Raycaster;
  private camera: Camera;
  private interactables: THREE.Object3D[] = [];
  private currentHoveredObject: THREE.Object3D | null = null;

  constructor(camera: Camera) {
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 5; // Interaction range
  }

  registerInteractable(object: THREE.Object3D): void {
    if (!this.interactables.includes(object)) {
      this.interactables.push(object);
    }
  }

  unregisterInteractable(object: THREE.Object3D): void {
    const index = this.interactables.indexOf(object);
    if (index > -1) {
      this.interactables.splice(index, 1);
    }
  }

  update(): THREE.Object3D | null {
    // Raycast from center of screen
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.camera.quaternion);
    
    this.raycaster.set(this.camera.camera.position, direction);
    
    const intersects = this.raycaster.intersectObjects(this.interactables, true);
    
    // Clear previous hover
    if (this.currentHoveredObject) {
      this.clearHover(this.currentHoveredObject);
      this.currentHoveredObject = null;
    }

    const targetObject = this.getRootInteractable(intersects);
    if (targetObject) {
      this.currentHoveredObject = targetObject;
      this.applyHover(targetObject);
      return targetObject;
    }

    return null;
  }

  raycastFromScreenPoint(clientX: number, clientY: number): THREE.Object3D | null {
    const ndc = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables, true);
    return this.getRootInteractable(intersects);
  }

  private getRootInteractable(
    intersects: THREE.Intersection[]
  ): THREE.Object3D | null {
    if (intersects.length === 0) return null;

    let targetObject = intersects[0].object;
    while (targetObject.parent && !this.interactables.includes(targetObject)) {
      targetObject = targetObject.parent;
    }

    return this.interactables.includes(targetObject) ? targetObject : null;
  }

  private applyHover(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Store original emissive for later restoration
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = (child.material as THREE.MeshStandardMaterial).emissive?.clone();
          child.userData.originalEmissiveIntensity = (child.material as THREE.MeshStandardMaterial).emissiveIntensity;
        }
        
        if ((child.material as THREE.MeshStandardMaterial).emissive) {
          (child.material as THREE.MeshStandardMaterial).emissive.setHex(0x00d4ff);
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
      }
    });
  }

  private clearHover(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalEmissive) {
        (child.material as THREE.MeshStandardMaterial).emissive.copy(child.userData.originalEmissive);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = child.userData.originalEmissiveIntensity || 0;
      }
    });
  }

  getCurrentHovered(): THREE.Object3D | null {
    return this.currentHoveredObject;
  }
}
