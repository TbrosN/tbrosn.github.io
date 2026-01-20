import * as THREE from 'three';
import { Results, NormalizedLandmark } from '@mediapipe/hands';
import type { Camera } from '../core/Camera';
import { NodeMaterialFactory } from '../materials/NodeMaterialFactory';

/**
 * Maps hand landmarks to 3D world space
 */
export class HandMapper {
  private camera: Camera;
  private smoothingFactor: number = 0.5;
  
  // Smoothed positions
  private smoothedIndexTip: THREE.Vector3 = new THREE.Vector3();
  private smoothedThumbTip: THREE.Vector3 = new THREE.Vector3();
  
  // Hand cursor visualization
  public handCursor: THREE.Mesh;
  private handRay: THREE.Line;
  
  constructor(camera: Camera, scene: THREE.Scene) {
    this.camera = camera;

    // Create hand cursor
    const cursorGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const cursorMaterial = NodeMaterialFactory.createBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7
    });
    this.handCursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    this.handCursor.visible = false;
    scene.add(this.handCursor);

    // Create ray visualization
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5)
    ]);
    const rayMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    });
    this.handRay = new THREE.Line(rayGeometry, rayMaterial);
    this.handRay.visible = false;
    scene.add(this.handRay);
  }

  update(results: Results): {
    indexTip: THREE.Vector3 | null;
    thumbTip: THREE.Vector3 | null;
    cursorPosition: THREE.Vector3 | null;
  } {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.handCursor.visible = false;
      this.handRay.visible = false;
      return { indexTip: null, thumbTip: null, cursorPosition: null };
    }

    // Use first detected hand
    const landmarks = results.multiHandLandmarks[0];
    
    // Get index finger tip (landmark 8) and thumb tip (landmark 4)
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    // Convert to 3D world space
    const indexPos = this.landmarkToWorld(indexTip);
    const thumbPos = this.landmarkToWorld(thumbTip);

    // Apply smoothing
    this.smoothedIndexTip.lerp(indexPos, this.smoothingFactor);
    this.smoothedThumbTip.lerp(thumbPos, this.smoothingFactor);

    // Calculate cursor position (raycast from camera through hand position)
    const cursorPos = this.calculateCursorPosition(this.smoothedIndexTip);

    // Update visualization
    this.handCursor.position.copy(cursorPos);
    this.handCursor.visible = true;

    // Update ray
    this.updateRay(cursorPos);

    return {
      indexTip: this.smoothedIndexTip.clone(),
      thumbTip: this.smoothedThumbTip.clone(),
      cursorPosition: cursorPos
    };
  }

  private landmarkToWorld(landmark: NormalizedLandmark): THREE.Vector3 {
    // Convert normalized screen coordinates to world space
    // This is a simplified mapping - in production you'd want more sophisticated depth estimation
    
    // Map x,y from normalized coords (0-1) to screen space (-1 to 1)
    const x = (landmark.x - 0.5) * 2;
    const y = -(landmark.y - 0.5) * 2; // Flip Y
    const z = -landmark.z * 2; // Use MediaPipe's depth estimate

    return new THREE.Vector3(x * 2, y * 2, z);
  }

  private calculateCursorPosition(handPos: THREE.Vector3): THREE.Vector3 {
    // Project from hand position into scene
    const screenPos = handPos.clone();
    
    // Create ray from camera through hand screen position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(screenPos.x, screenPos.y),
      this.camera.camera
    );

    // Place cursor at fixed distance
    const distance = 3.0;
    return raycaster.ray.origin.clone().add(
      raycaster.ray.direction.multiplyScalar(distance)
    );
  }

  private updateRay(targetPos: THREE.Vector3): void {
    const origin = this.camera.camera.position;
    const positions = new Float32Array([
      origin.x, origin.y, origin.z,
      targetPos.x, targetPos.y, targetPos.z
    ]);
    
    this.handRay.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.handRay.visible = true;
  }

  setVisible(visible: boolean): void {
    this.handCursor.visible = visible;
    this.handRay.visible = visible;
  }

  dispose(): void {
    this.handCursor.geometry.dispose();
    (this.handCursor.material as THREE.Material).dispose();
    this.handRay.geometry.dispose();
    (this.handRay.material as THREE.Material).dispose();
  }
}
