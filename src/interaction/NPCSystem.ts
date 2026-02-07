import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

export interface NPCDialogue {
  messages: string[];
  currentIndex: number;
  lastShownIndex: number;
}

export interface NPC {
  model: THREE.Object3D;
  position: THREE.Vector3;
  dialogue: NPCDialogue;
  name: string;
  link?: string;
  onInteract?: (npc: NPC) => void;
}

/**
 * NPC management system - handles NPC loading, interaction, and dialogue
 */
export class NPCSystem {
  private npcs: Map<string, NPC> = new Map();
  private loader: GLTFLoader;
  private onDialogueCallback?: (npc: NPC, message: string) => void;

  constructor() {
    this.loader = new GLTFLoader();
  }

  async loadNPC(
    id: string,
    modelPath: string,
    position: THREE.Vector3,
    dialogue: string[],
    name: string,
    scale: number = 1,
    link?: string,
  ): Promise<NPC> {
    try {
      const gltf = await this.loader.loadAsync(modelPath);
      const model = gltf.scene;

      // Scale and position the model
      model.scale.set(scale, scale, scale);
      model.position.copy(position);

      // Enable shadows
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Make sure the NPC is visible by setting up materials properly
          if (child.material) {
            // Store original material properties for hover effects
            child.userData.originalEmissive = child.material.emissive?.clone();
            child.userData.originalEmissiveIntensity =
              child.material.emissiveIntensity;
          }
        }
      });

      // Add idle animation
      this.addIdleAnimation(model);

      const npc: NPC = {
        model,
        position,
        dialogue: {
          messages: dialogue,
          currentIndex: 0,
          lastShownIndex: -1,
        },
        name,
        link,
      };

      this.npcs.set(id, npc);

      return npc;
    } catch (error) {
      console.error(`❌ Failed to load NPC "${name}":`, error);
      throw error;
    }
  }

  /**
   * Create an NPC from an existing model (e.g., from a Blender scene)
   */
  createNPCFromModel(
    id: string,
    model: THREE.Object3D,
    dialogue: string[],
    name: string,
    link?: string
  ): NPC {
    // Get the model's current world position
    const position = new THREE.Vector3();
    model.getWorldPosition(position);

    // Enable shadows and clone materials so hover effects don't bleed between NPCs
    // (GLB exports often share material instances across meshes)
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Clone the material so each NPC has its own instance
        if (child.material) {
          child.material = child.material.clone();
          child.userData.originalEmissive = child.material.emissive?.clone();
          child.userData.originalEmissiveIntensity = child.material.emissiveIntensity;
        }
      }
    });

    // Add idle animation
    this.addIdleAnimation(model);

    const npc: NPC = {
      model,
      position,
      dialogue: {
        messages: dialogue,
        currentIndex: 0,
        lastShownIndex: -1,
      },
      name,
      link,
    };

    this.npcs.set(id, npc);
    console.log(`👤 NPC "${name}" created from existing model at`, position);

    return npc;
  }

  private addIdleAnimation(model: THREE.Object3D): void {
    // No idle animation - NPC stays still
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs.get(id);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  interact(npc: NPC): void {
    // Get current message
    const message = npc.dialogue.messages[npc.dialogue.currentIndex];

    // Store the index of the message we're showing
    npc.dialogue.lastShownIndex = npc.dialogue.currentIndex;

    // Trigger callback with the message
    if (this.onDialogueCallback) {
      this.onDialogueCallback(npc, message);
    }

    // Advance to next message (loop back to start)
    npc.dialogue.currentIndex =
      (npc.dialogue.currentIndex + 1) % npc.dialogue.messages.length;

    // Play interaction animation
    this.playInteractionAnimation(npc.model);

    // Call custom interaction handler if defined
    if (npc.onInteract) {
      npc.onInteract(npc);
    }
  }

  /**
   * Make an NPC speak a message immediately (NPC-initiated dialogue)
   * This allows NPCs to proactively communicate with the player
   * without requiring user interaction.
   */
  speak(npc: NPC, message: string): void {
    // Trigger the dialogue callback to show the message immediately
    if (this.onDialogueCallback) {
      this.onDialogueCallback(npc, message);
    }

    // Play interaction animation to draw attention
    this.playInteractionAnimation(npc.model);
  }

  private playInteractionAnimation(model: THREE.Object3D): void {
    return;
  }

  onDialogue(callback: (npc: NPC, message: string) => void): void {
    this.onDialogueCallback = callback;
  }

  isOnLastMessage(npc: NPC): boolean {
    return npc.dialogue.lastShownIndex === npc.dialogue.messages.length - 1;
  }

  resetDialogue(npc: NPC): void {
    npc.dialogue.currentIndex = 0;
    npc.dialogue.lastShownIndex = -1;
  }

  update(delta: number): void {
    // Update NPC animations or behaviors if needed
    // Currently animations are handled by GSAP
  }

  dispose(): void {
    this.npcs.forEach((npc) => {
      npc.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    });
    this.npcs.clear();
  }
}
