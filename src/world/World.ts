import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Scene } from "../core/Scene";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { Raycaster } from "../interaction/Raycaster";
import type { GrabbableObject } from "../interaction/GrabSystem";
import { NodeMaterialFactory } from "../materials/NodeMaterialFactory";
import { NPCSystem, type NPC } from "../interaction/NPCSystem";
import { CaricatureArtist } from "../interaction/CaricatureArtist";

/**
 * World building - environment and interactive objects
 */
export class World {
  private scene: Scene;
  private physics: PhysicsWorld;
  private raycaster: Raycaster;
  public interactiveObjects: Map<THREE.Object3D, GrabbableObject> = new Map();
  public npcSystem: NPCSystem;
  private caricatureArtist: CaricatureArtist;
  private built: boolean = false;
  private carnivalModel?: THREE.Group;

  constructor(scene: Scene, physics: PhysicsWorld, raycaster: Raycaster) {
    this.scene = scene;
    this.physics = physics;
    this.raycaster = raycaster;
    this.npcSystem = new NPCSystem();
    this.caricatureArtist = new CaricatureArtist();
  }

  getCaricatureArtist(): CaricatureArtist {
    return this.caricatureArtist;
  }

  setCaricatureCallbacks(
    onUIOpen: () => void,
    onUIClose: () => void,
    onNPCSpeak?: (npc: NPC) => void,
  ): void {
    const caricatureNPC = this.npcSystem.getNPC("caricature-artist");

    if (!caricatureNPC) {
      console.error("❌ Caricature NPC not found! Cannot set callbacks.");
      return;
    }

    this.caricatureArtist.setCallbacks(
      // On generation started
      () => {
        const npc = this.npcSystem.getNPC("caricature-artist");
        if (npc) {
          const message =
            "🎨 I'm working on your caricature now! Feel free to explore while I draw...";

          // Speak immediately so the player knows generation has started
          this.npcSystem.speak(npc, message);

          // Notify main.ts so it can track this NPC as the last interacted
          if (onNPCSpeak) {
            onNPCSpeak(npc);
          }

          // Update dialogue for subsequent interactions
          npc.dialogue.messages = [
            message,
            "✏️ Almost there... just adding some finishing touches!",
          ];
          npc.dialogue.currentIndex = 0;
          npc.dialogue.lastShownIndex = -1;
        } else {
          console.error("❌ NPC not found when trying to update dialogue!");
        }
      },
      // On generation completed
      () => {
        const npc = this.npcSystem.getNPC("caricature-artist");
        if (npc) {
          const message =
            "🎉 Your caricature is ready! Press SPACE to view it!";

          // Speak immediately so the player knows the caricature is ready
          this.npcSystem.speak(npc, message);

          // Notify main.ts so it can track this NPC as the last interacted
          if (onNPCSpeak) {
            onNPCSpeak(npc);
          }

          // Update dialogue for subsequent interactions
          npc.dialogue.messages = [
            message,
            "I think it turned out great! Want to see it? Press SPACE!",
          ];
          npc.dialogue.currentIndex = 0;
          npc.dialogue.lastShownIndex = -1;
        } else {
          console.error("❌ NPC not found when trying to update dialogue!");
        }
      },
      // On UI opened (for pointer lock management)
      onUIOpen,
      // On UI closed (for pointer lock management)
      onUIClose,
      // On permission denied
      () => {
        const npc = this.npcSystem.getNPC("caricature-artist");
        if (npc) {
          const message =
            "Sorry, I can't draw you without seeing you! (Camera permission denied)";
          this.npcSystem.speak(npc, message);

          // Notify main.ts so it can track this NPC as the last interacted
          if (onNPCSpeak) {
            onNPCSpeak(npc);
          }
        }
      },
    );
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
      this.carnivalModel = gltf.scene;

      // 🔍 DEBUG: Extract and log top-level children
      const topLevelNodes = gltf.scene.children;
      const names: string[] = topLevelNodes.map((node) => node.name);

      console.log("🎡 Top-level elements in carnival.glb:", names);
      console.log("📊 Total top-level nodes:", topLevelNodes.length);

      // Log detailed info about each top-level node
      topLevelNodes.forEach((node) => {
        console.log(`  └─ Name: "${node.name}" | Type: ${node.type}`);
      });

      // Enable shadows on all meshes in the loaded model
      this.carnivalModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(this.carnivalModel);

      // Create physics ground (you can adjust the Y position based on your model)
      this.physics.createGround(0);
    } catch (error) {
      console.error("❌ Failed to load carnival.glb:", error);
      // Fallback to basic scene if model fails to load
      this.createFallbackScene();
    }
  }

  private async loadNPCs(): Promise<void> {
    if (!this.carnivalModel) {
      console.error("❌ Carnival model not loaded yet!");
      return;
    }

    try {
      // Map of NPC names in the GLB file to their IDs and dialogue
      // Note: Dots are removed during GLB export, so "NPC.DARC" becomes "NPCDARC"
      const npcConfig: Record<
        string,
        {
          id: string;
          dialogue: string[];
          displayName: string;
          linkUrl?: string;
        }
      > = {
        NPCDARC: {
          id: "darc-vendor",
          displayName: "Music Researcher",
          dialogue: [
            "Hey there, welcome to the carnival! I built a music AI research project called DARC - Drum Accompaniment generation with Rhythm Control.",
            "It's my 15-798 final project at CMU. The cool part? It lets you input beatboxing or tapping, plus your other tracks, and it generates drums that fit the rhythm and musical context.",
            "Want to read the paper? Press SPACE to open it!",
          ],
          linkUrl: "https://arxiv.org/abs/2601.02357",
        },
        NPCCrossyRoad: {
          id: "crossy-road-dev",
          displayName: "Game Dev",
          dialogue: [
            "What's up! Check out my Crossy Road clone I built for 15-113 at CMU, a Python implementation made with AI on a 1-hour timer!",
            "Time crunch was REAL! I had to move fast and be strategic with my approach. I used Cursor with a mix of prompting techniques to maximize efficiency.",
            "Got procedural terrain, collision detection, and score tracking all working in under an hour. Press SPACE to check out the code on GitHub!",
          ],
          linkUrl: "https://github.com/TbrosN/crossy-road",
        },
        NPCCaricature: {
          id: "caricature-artist",
          displayName: "Artist",
          dialogue: [
            "Hello, I'm the Caricature Artist! I can draw a funny picture of you using the power of AI!",
            "If you would like a caricature, press SPACE to choose how you'd like to pose!",
          ],
        },
        NPCFerrisWheel: {
          id: "ferris-wheel-health",
          displayName: "Health Tracker",
          dialogue: [
            "Hey! I built Clarity - a full-stack PWA that's like Waze for your health. It helps you understand what actually drives your energy levels.",
            "Instead of generic advice, Clarity asks you simple questions that take just 1 second to answer. From these, it connects the dots between your energy, diet, and sleep patterns.",
            "Want to see how it works? Press SPACE to check out the project on GitHub!",
          ],
          linkUrl: "https://github.com/TbrosN/clarity",
        },
        NPCCarousel: {
          id: "carousel-operator",
          displayName: "Carousel Operator",
          dialogue: [
            "Welcome to the carnival! If you like what you see, press SPACE to open the code for this portfolio on GitHub.",
          ],
          linkUrl: "https://github.com/TbrosN/tbrosn.github.io?tab=readme-ov-file",
        },
      };

      // Find all NPCs in the carnival model (they start with "NPC")
      // We need to be careful to only register the actual NPC objects, not parent groups
      const npcObjects: Map<string, THREE.Object3D> = new Map();
      const allNPCNames = new Set<string>();

      // First pass: find all objects starting with "NPC"
      this.carnivalModel.traverse((child) => {
        if (child.name.startsWith("NPC")) {
          allNPCNames.add(child.name);
        }
      });

      // Second pass: only register NPCs that are configured (not parent groups)
      this.carnivalModel.traverse((child) => {
        if (child.name.startsWith("NPC") && npcConfig[child.name]) {
          npcObjects.set(child.name, child);

          // Debug: Check if this object or its children have meshes
          let meshCount = 0;
          child.traverse((subChild) => {
            if (subChild instanceof THREE.Mesh) {
              meshCount++;
            }
          });

          console.log(`✅ Found NPC: ${child.name}`, {
            type: child.type,
            meshCount,
            position: child.position,
            hasChildren: child.children.length > 0,
            parent: child.parent?.name,
            parentType: child.parent?.type,
          });
        }
      });

      console.log(
        `🔍 All objects starting with "NPC":`,
        Array.from(allNPCNames),
      );

      // Register each found NPC with the NPC system
      for (const [npcName, npcObject] of npcObjects) {
        const config = npcConfig[npcName];
        if (config) {
          // Create NPC from the existing model in the scene
          this.npcSystem.createNPCFromModel(
            config.id,
            npcObject,
            config.dialogue,
            config.displayName,
            config.linkUrl,
          );

          // Register the NPC model as interactable
          this.raycaster.registerInteractable(npcObject);

          // Debug: Log world position
          const worldPos = new THREE.Vector3();
          npcObject.getWorldPosition(worldPos);

          console.log(
            `✅ Registered NPC: ${config.id} (${config.displayName})`,
            {
              worldPosition: worldPos,
              visible: npcObject.visible,
              name: npcObject.name,
            },
          );
        } else {
          console.warn(`⚠️ No config found for NPC: ${npcName}`);
        }
      }

      console.log(`🎪 Total NPCs registered: ${npcObjects.size}`);
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
    // Check if the mesh is an NPC model or part of an NPC hierarchy
    for (const npc of this.npcSystem.getAllNPCs()) {
      if (npc.model === mesh) {
        console.log(`🎯 Direct NPC match: ${npc.name}`);
        return npc;
      }

      // Check if the mesh is a child of the NPC model
      let current: THREE.Object3D | null = mesh;
      while (current) {
        if (current === npc.model) {
          console.log(`🎯 Found NPC via parent: ${npc.name}`, {
            clickedObject: mesh.name,
          });
          return npc;
        }
        current = current.parent;
      }
    }
    console.log(`❌ No NPC found for clicked object:`, mesh.name, mesh.type);
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
