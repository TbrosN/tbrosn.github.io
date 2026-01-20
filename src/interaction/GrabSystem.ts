import * as THREE from 'three';
import gsap from 'gsap';
import type { Camera } from '../core/Camera';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export interface GrabbableObject {
  mesh: THREE.Object3D;
  rigidBody: any;
  originalMass?: number;
}

/**
 * Object grabbing and manipulation system
 */
export class GrabSystem {
  private camera: Camera;
  private physics: PhysicsWorld;
  private grabbedObject: GrabbableObject | null = null;
  private grabDistance: number = 2.0;
  private lastGrabPosition: THREE.Vector3 = new THREE.Vector3();
  private grabVelocity: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: Camera, physics: PhysicsWorld) {
    this.camera = camera;
    this.physics = physics;
  }

  grab(object: GrabbableObject): void {
    if (this.grabbedObject) {
      this.release();
    }

    this.grabbedObject = object;
    
    // Store original physics properties
    if (object.rigidBody) {
      this.grabbedObject.originalMass = object.rigidBody.mass();
      
      // Make kinematic while grabbed
      object.rigidBody.setBodyType(this.physics.RAPIER.RigidBodyType.KinematicPositionBased);
    }

    // Visual feedback
    gsap.to(object.mesh.scale, {
      x: object.mesh.scale.x * 1.1,
      y: object.mesh.scale.y * 1.1,
      z: object.mesh.scale.z * 1.1,
      duration: 0.2,
      ease: 'back.out(2)'
    });

    this.lastGrabPosition.copy(object.mesh.position);
  }

  release(): void {
    if (!this.grabbedObject) return;

    const object = this.grabbedObject;

    // Restore physics
    if (object.rigidBody) {
      object.rigidBody.setBodyType(this.physics.RAPIER.RigidBodyType.Dynamic);
      
      // Apply throw velocity
      const throwMultiplier = 3.0;
      object.rigidBody.setLinvel({
        x: this.grabVelocity.x * throwMultiplier,
        y: this.grabVelocity.y * throwMultiplier,
        z: this.grabVelocity.z * throwMultiplier
      }, true);
    }

    // Visual feedback
    gsap.to(object.mesh.scale, {
      x: object.mesh.scale.x / 1.1,
      y: object.mesh.scale.y / 1.1,
      z: object.mesh.scale.z / 1.1,
      duration: 0.2,
      ease: 'back.in(2)'
    });

    this.grabbedObject = null;
    this.grabVelocity.set(0, 0, 0);
  }

  update(delta: number): void {
    if (!this.grabbedObject) return;

    // Calculate target position in front of camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.camera.quaternion);
    
    const targetPosition = this.camera.camera.position.clone()
      .add(direction.multiplyScalar(this.grabDistance));

    // Smooth movement
    const currentPos = this.grabbedObject.mesh.position;
    const newPos = currentPos.clone().lerp(targetPosition, 10 * delta);

    // Calculate velocity for throwing
    this.grabVelocity.copy(newPos).sub(this.lastGrabPosition).divideScalar(delta);
    this.lastGrabPosition.copy(newPos);

    // Update physics body
    if (this.grabbedObject.rigidBody) {
      this.grabbedObject.rigidBody.setNextKinematicTranslation({
        x: newPos.x,
        y: newPos.y,
        z: newPos.z
      });
    }

    this.grabbedObject.mesh.position.copy(newPos);
  }

  isGrabbing(): boolean {
    return this.grabbedObject !== null;
  }

  getGrabbedObject(): GrabbableObject | null {
    return this.grabbedObject;
  }
}
