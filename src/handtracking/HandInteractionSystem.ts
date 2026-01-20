import * as THREE from 'three';
import type { Camera } from '../core/Camera';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { World } from '../world/World';
import type { GrabSystem } from '../interaction/GrabSystem';
import { HandTracker } from './HandTracker';
import { HandMapper } from './HandMapper';
import { GestureDetector, GestureState } from './GestureDetector';

/**
 * Integrates hand tracking with grab system
 */
export class HandInteractionSystem {
  private handTracker: HandTracker;
  private handMapper: HandMapper;
  private gestureDetector: GestureDetector;
  private grabSystem: GrabSystem;
  private world: World;
  private camera: Camera;
  
  private isEnabled: boolean = false;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private lastGestureState: GestureState = 'idle';

  constructor(
    camera: Camera,
    scene: THREE.Scene,
    physics: PhysicsWorld,
    grabSystem: GrabSystem,
    world: World
  ) {
    this.camera = camera;
    this.grabSystem = grabSystem;
    this.world = world;
    
    this.handTracker = new HandTracker();
    this.handMapper = new HandMapper(camera, scene);
    this.gestureDetector = new GestureDetector();
  }

  async init(): Promise<void> {
    await this.handTracker.init();
    
    this.handTracker.onResults((results) => {
      const { indexTip, thumbTip, cursorPosition } = this.handMapper.update(results);
      
      if (cursorPosition) {
        // Update gesture detection
        const gestureState = this.gestureDetector.update(indexTip, thumbTip);
        
        // Handle grab/release based on gesture
        this.handleGesture(gestureState, cursorPosition);
      }
    });
  }

  async start(): Promise<void> {
    try {
      await this.handTracker.start();
      this.isEnabled = true;
      this.handMapper.setVisible(true);
      console.log('✅ Hand interaction system started');
    } catch (error) {
      console.error('Failed to start hand tracking:', error);
      alert('Could not access camera. Please grant camera permissions.');
      throw error;
    }
  }

  stop(): void {
    this.handTracker.stop();
    this.isEnabled = false;
    this.handMapper.setVisible(false);
    
    // Release any grabbed object
    if (this.grabSystem.isGrabbing()) {
      this.grabSystem.release();
    }
  }

  private handleGesture(state: GestureState, cursorPosition: THREE.Vector3): void {
    // Detect state transitions
    const justPinched = state === 'pinched' && this.lastGestureState !== 'pinched';
    const justReleased = state === 'idle' && this.lastGestureState === 'pinched';

    if (justPinched) {
      // Try to grab object at cursor position
      const object = this.findObjectAtPosition(cursorPosition);
      if (object) {
        const grabbable = this.world.getInteractiveObject(object);
        if (grabbable) {
          this.grabSystem.grab(grabbable);
          console.log('👋 Grabbed with hand gesture');
        }
      }
    } else if (justReleased) {
      // Release grabbed object
      if (this.grabSystem.isGrabbing()) {
        this.grabSystem.release();
        console.log('👋 Released with hand gesture');
      }
    }

    this.lastGestureState = state;
  }

  private findObjectAtPosition(position: THREE.Vector3): THREE.Object3D | null {
    // Raycast from camera through cursor position
    const direction = position.clone().sub(this.camera.camera.position).normalize();
    this.raycaster.set(this.camera.camera.position, direction);
    this.raycaster.far = 10;

    // Get all interactable objects
    const interactables: THREE.Object3D[] = [];
    this.world['interactiveObjects'].forEach((_, mesh) => {
      interactables.push(mesh);
    });

    const intersects = this.raycaster.intersectObjects(interactables, true);
    
    if (intersects.length > 0) {
      // Find root interactable
      let target = intersects[0].object;
      while (target.parent && !interactables.includes(target)) {
        target = target.parent;
      }
      return interactables.includes(target) ? target : null;
    }

    return null;
  }

  update(): void {
    // Hand tracking runs on its own callback loop
    // This is here for any per-frame processing if needed
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  dispose(): void {
    this.handTracker.dispose();
    this.handMapper.dispose();
  }
}
