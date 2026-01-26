import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Scene } from "../core/Scene";
import type { PhysicsWorld, CollisionGroups } from "../physics/PhysicsWorld";
import type { Raycaster } from "../interaction/Raycaster";
import type { GrabbableObject } from "../interaction/GrabSystem";
import { CollisionGroups as Groups } from "../physics/PhysicsWorld";
import { NodeMaterialFactory } from "../materials/NodeMaterialFactory";

/**
 * World building - environment and interactive objects
 */
export class World {
  private scene: Scene;
  private physics: PhysicsWorld;
  private raycaster: Raycaster;
  public interactiveObjects: Map<THREE.Object3D, GrabbableObject> = new Map();
  private built: boolean = false;

  constructor(scene: Scene, physics: PhysicsWorld, raycaster: Raycaster) {
    this.scene = scene;
    this.physics = physics;
    this.raycaster = raycaster;
  }

  async build(): Promise<void> {
    // Guard against accidental double-builds (e.g., during hot reload / re-init)
    if (this.built) return;
    this.built = true;

    await this.loadCarnivalScene();
  }

  private async loadCarnivalScene(): Promise<void> {
    const loader = new GLTFLoader();

    try {
      const gltf = await loader.loadAsync("/carnival.glb");
      const carnivalModel = gltf.scene;

      // Scale down the model to match player size (adjust this value as needed)
      const scaleFactor = 0.2; // Makes the scene 10x smaller
      carnivalModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Enable shadows on all meshes in the loaded model
      carnivalModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(carnivalModel);
      console.log(
        `🎡 Carnival scene loaded successfully (scaled to ${scaleFactor}x)`,
      );

      // Create physics ground (you can adjust the Y position based on your model)
      this.physics.createGround(0);
    } catch (error) {
      console.error("❌ Failed to load carnival.glb:", error);
      // Fallback to basic scene if model fails to load
      this.createFallbackScene();
    }
  }

  private createFallbackScene(): void {
    // Simple fallback ground if the model fails to load
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = NodeMaterialFactory.createStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(100, 50, 0x00d4ff, 0x444444);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    this.physics.createGround(0);
  }

  getInteractiveObject(mesh: THREE.Object3D): GrabbableObject | undefined {
    return this.interactiveObjects.get(mesh);
  }

  update(delta: number): void {
    // Sync physics bodies with meshes (skip kinematic bodies - they're controlled elsewhere)
    this.interactiveObjects.forEach((grabbable) => {
      if (grabbable.rigidBody) {
        // Only sync dynamic bodies (not grabbed/kinematic ones)
        const bodyType = grabbable.rigidBody.bodyType();
        if (bodyType === this.physics.RAPIER.RigidBodyType.Dynamic) {
          const translation = grabbable.rigidBody.translation();
          grabbable.mesh.position.set(
            translation.x,
            translation.y,
            translation.z,
          );

          const rotation = grabbable.rigidBody.rotation();
          grabbable.mesh.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w,
          );
        }
      }
    });
  }
}
