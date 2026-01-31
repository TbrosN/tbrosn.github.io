import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Scene } from "../core/Scene";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { Raycaster } from "../interaction/Raycaster";
import type { GrabbableObject } from "../interaction/GrabSystem";
import { NodeMaterialFactory } from "../materials/NodeMaterialFactory";
import { NPCSystem, type NPC } from "../interaction/NPCSystem";

/**
 * World building - environment and interactive objects
 */
export class World {
  private scene: Scene;
  private physics: PhysicsWorld;
  private raycaster: Raycaster;
  public interactiveObjects: Map<THREE.Object3D, GrabbableObject> = new Map();
  public npcSystem: NPCSystem;
  private built: boolean = false;

  constructor(scene: Scene, physics: PhysicsWorld, raycaster: Raycaster) {
    this.scene = scene;
    this.physics = physics;
    this.raycaster = raycaster;
    this.npcSystem = new NPCSystem();
  }

  async build(): Promise<void> {
    // Guard against accidental double-builds (e.g., during hot reload / re-init)
    if (this.built) return;
    this.built = true;

    await this.loadCarnivalScene();
    await this.loadNPCs();
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

  private async loadNPCs(): Promise<void> {
    try {
      // Load the first NPC - DARC project vendor
      // Position is scaled to match the carnival scene (scaled to 0.2x)
      const npcPosition1 = new THREE.Vector3(2, 1, 1.5);
      const npcScale = 2.5;

      const npc1 = await this.npcSystem.loadNPC(
        "food-stand-vendor",
        "/npc.glb",
        npcPosition1,
        [
          "Hey there! Welcome to the carnival! 🎪 I'm working on a music AI research project called DARC - Drum Accompaniment generation with Rhythm Control.",
          "It's my 15-798 final project at CMU. The cool part? It lets you control BOTH musical context and fine-grained rhythm at the same time - you can condition on other stems while using rhythm prompts like beatboxing or tapping tracks!",
          "I used parameter-efficient fine-tuning to augment STAGE, a state-of-the-art drum stem generator. Prior tools could do stem-to-stem generation OR timbre transfer, but DARC bridges that gap with precise rhythm control AND musical context awareness.",
          "It's published on arXiv! Want to read the paper? Press SPACE BAR to open it! 📄",
        ],
        "Vendor",
        npcScale,
        "https://arxiv.org/abs/2601.02357"
      );

      // Add the first NPC to the scene
      this.scene.add(npc1.model);
      this.raycaster.registerInteractable(npc1.model);

      // Load the second NPC - Crossy Road project
      const npcPosition2 = new THREE.Vector3(-2, 1, 1.5);

      const npc2 = await this.npcSystem.loadNPC(
        "crossy-road-dev",
        "/npc.glb",
        npcPosition2,
        [
          "What's up! 🎮 Check out my Crossy Road clone I built for 15-113 at CMU - it's a Python implementation made with AI on a 1-hour timer!",
          "Time crunch was REAL! I had to move fast and be strategic with my approach. I used Cursor with a mix of prompting techniques to maximize efficiency.",
          "Started with plan-then-build for the MVP architecture, then switched to new chat + choose context + one-shot prompts for debugging and smaller features. The strategic context selection made all the difference!",
          "Got procedural terrain, collision detection, and score tracking all working in under an hour. Pretty wild! Press SPACE BAR to check out the code on GitHub! 🐍",
        ],
        "Game Dev",
        npcScale,
        "https://github.com/TbrosN/crossy-road"
      );

      // Add the second NPC to the scene
      this.scene.add(npc2.model);
      this.raycaster.registerInteractable(npc2.model);

      console.log("🎪 NPCs loaded and ready for interaction!");
    } catch (error) {
      console.error("❌ Failed to load NPCs:", error);
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

  getNPC(mesh: THREE.Object3D): NPC | undefined {
    // Check if the mesh is an NPC model
    for (const npc of this.npcSystem.getAllNPCs()) {
      if (npc.model === mesh || npc.model.children.includes(mesh as any)) {
        return npc;
      }
    }
    return undefined;
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

    // Update NPC system
    this.npcSystem.update(delta);
  }
}
