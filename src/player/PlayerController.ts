import * as THREE from 'three';
import type { Camera } from '../core/Camera';
import type { Controls } from './Controls';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { CollisionGroups } from '../physics/PhysicsWorld';

/**
 * First-person player controller with physics-based movement
 */
export class PlayerController {
  private camera: Camera;
  private controls: Controls;
  private physics: PhysicsWorld;
  
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private speed: number = 5.0;
  private jumpForce: number = 6.0;
  private isGrounded: boolean = true;
  
  public collider: any; // Rapier collider
  public rigidBody: any; // Rapier rigid body

  constructor(camera: Camera, controls: Controls, physics: PhysicsWorld) {
    this.camera = camera;
    this.controls = controls;
    this.physics = physics;
  }

  setupPhysics(): void {
    const RAPIER = this.physics.RAPIER;
    
    // Create capsule collider for player
    const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(
        this.camera.camera.position.x,
        this.camera.camera.position.y,
        this.camera.camera.position.z
      );
    
    this.rigidBody = this.physics.world.createRigidBody(rigidBodyDesc);
    
    // Capsule: radius 0.3, half-height 0.8 (total height ~1.6m)
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.8, 0.3)
      .setTranslation(0, -0.8, 0); // Offset so top is at eye level
    
    // Player only collides with ENVIRONMENT (walls, floor), not with INTERACTIVE objects
    colliderDesc.setCollisionGroups(
      (CollisionGroups.PLAYER << 16) | CollisionGroups.ENVIRONMENT
    );
    
    this.collider = this.physics.world.createCollider(colliderDesc, this.rigidBody);
  }

  /**
   * Apply input to the kinematic player body BEFORE the physics step.
   * We intentionally avoid reading back `rigidBody.translation()` here; that creates a 1-frame
   * feedback loop (and visible jitter) if physics is stepped earlier in the frame.
   */
  prePhysics(delta: number): void {
    if (!this.controls.isActive()) return;

    // Mouse look
    const lookDelta = this.controls.getLookDelta();
    this.camera.updateRotation(lookDelta.x, lookDelta.y);

    // Movement
    const moveSpeed = this.speed * delta;
    const forward = this.camera.getForwardVector();
    const right = this.camera.getRightVector();

    const moveDirection = new THREE.Vector3();
    const axis = this.controls.getMoveAxis();
    if (axis.y !== 0) {
      moveDirection.add(forward.multiplyScalar(axis.y));
    }
    if (axis.x !== 0) {
      moveDirection.add(right.multiplyScalar(axis.x));
    }

    if (moveDirection.lengthSq() > 0) {
      if (moveDirection.lengthSq() > 1) {
        moveDirection.normalize();
      }
      moveDirection.multiplyScalar(moveSpeed);
    }

    // Apply movement
    const currentPos = this.camera.camera.position;
    const newPos = currentPos.clone().add(moveDirection);

    if (this.rigidBody) {
      this.rigidBody.setNextKinematicTranslation({
        x: newPos.x,
        y: newPos.y,
        z: newPos.z,
      });
    } else {
      // Fallback without physics
      this.camera.camera.position.copy(newPos);
    }
  }

  /**
   * Sync the camera to the physics body AFTER the physics step.
   */
  postPhysics(): void {
    if (!this.rigidBody) return;
    const translation = this.rigidBody.translation();
    this.camera.camera.position.set(translation.x, translation.y, translation.z);
  }
}
