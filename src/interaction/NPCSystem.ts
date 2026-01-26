import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

export interface NPCDialogue {
  messages: string[];
  currentIndex: number;
}

export interface NPC {
  model: THREE.Object3D;
  position: THREE.Vector3;
  dialogue: NPCDialogue;
  name: string;
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
    scale: number = 1
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
        },
        name,
      };

      this.npcs.set(id, npc);
      console.log(`👤 NPC "${name}" loaded successfully at`, position);

      return npc;
    } catch (error) {
      console.error(`❌ Failed to load NPC "${name}":`, error);
      throw error;
    }
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
    
    // Trigger callback with the message
    if (this.onDialogueCallback) {
      this.onDialogueCallback(npc, message);
    }

    // Advance to next message (loop back to start)
    npc.dialogue.currentIndex = (npc.dialogue.currentIndex + 1) % npc.dialogue.messages.length;

    // Play interaction animation
    this.playInteractionAnimation(npc.model);

    // Call custom interaction handler if defined
    if (npc.onInteract) {
      npc.onInteract(npc);
    }
  }

  private playInteractionAnimation(model: THREE.Object3D): void {
    // Quick rotation when interacted with
    const originalRotation = model.rotation.y;
    gsap.to(model.rotation, {
      y: originalRotation + Math.PI * 0.25,
      duration: 0.3,
      ease: 'back.out(2)',
      onComplete: () => {
        gsap.to(model.rotation, {
          y: originalRotation,
          duration: 0.3,
          ease: 'back.out(2)',
        });
      },
    });
  }

  onDialogue(callback: (npc: NPC, message: string) => void): void {
    this.onDialogueCallback = callback;
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
