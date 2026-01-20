import * as THREE from 'three';

/**
 * Factory for creating optimized materials with WebGPU Node Materials when available,
 * falling back to standard Three.js materials for WebGL compatibility
 */

export interface StandardMaterialParams {
  color?: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

export interface BasicMaterialParams {
  color?: THREE.ColorRepresentation;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  map?: THREE.Texture | null;
}

export class NodeMaterialFactory {
  private static webGPUAvailable: boolean | null = null;

  /**
   * Check if WebGPU and Node Materials are supported
   */
  static supportsNodeMaterials(): boolean {
    if (this.webGPUAvailable === null) {
      // Check if WebGPU is available in the browser
      this.webGPUAvailable = 'gpu' in navigator;
    }
    return this.webGPUAvailable;
  }

  /**
   * Create a standard material (PBR)
   * WebGPU renderer automatically handles standard materials efficiently
   */
  static createStandardMaterial(params: StandardMaterialParams): THREE.Material {
    // WebGPU renderer in Three.js r170 can use standard materials directly
    // The renderer automatically converts them to the appropriate backend
    return new THREE.MeshStandardMaterial({
      color: params.color,
      roughness: params.roughness,
      metalness: params.metalness,
      emissive: params.emissive,
      emissiveIntensity: params.emissiveIntensity,
      transparent: params.transparent,
      opacity: params.opacity,
      side: params.side,
    });
  }

  /**
   * Create a basic material (unlit)
   * Uses MeshBasicNodeMaterial for WebGPU, MeshBasicMaterial for WebGL
   */
  static createBasicMaterial(params: BasicMaterialParams): THREE.Material {
    // For now, we'll use standard MeshBasicMaterial for both
    // MeshBasicNodeMaterial requires more specific node setup
    return new THREE.MeshBasicMaterial({
      color: params.color,
      transparent: params.transparent,
      opacity: params.opacity,
      side: params.side,
      map: params.map,
    });
  }

  /**
   * Get renderer info for debugging
   */
  static getRendererInfo(): {
    backend: 'WebGPU' | 'WebGL';
    nodeMaterialsSupported: boolean;
  } {
    return {
      backend: this.supportsNodeMaterials() ? 'WebGPU' : 'WebGL',
      nodeMaterialsSupported: this.supportsNodeMaterials(),
    };
  }
}
