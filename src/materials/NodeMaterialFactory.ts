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
    const materialParams: THREE.MeshStandardMaterialParameters = {};
    if (params.color !== undefined) materialParams.color = params.color;
    if (params.roughness !== undefined) materialParams.roughness = params.roughness;
    if (params.metalness !== undefined) materialParams.metalness = params.metalness;
    if (params.emissive !== undefined) materialParams.emissive = params.emissive;
    if (params.emissiveIntensity !== undefined) {
      materialParams.emissiveIntensity = params.emissiveIntensity;
    }
    if (params.transparent !== undefined) materialParams.transparent = params.transparent;
    if (params.opacity !== undefined) materialParams.opacity = params.opacity;
    if (params.side !== undefined) materialParams.side = params.side;
    return new THREE.MeshStandardMaterial(materialParams);
  }

  /**
   * Create a basic material (unlit)
   * Uses MeshBasicNodeMaterial for WebGPU, MeshBasicMaterial for WebGL
   */
  static createBasicMaterial(params: BasicMaterialParams): THREE.Material {
    // For now, we'll use standard MeshBasicMaterial for both
    // MeshBasicNodeMaterial requires more specific node setup
    const materialParams: THREE.MeshBasicMaterialParameters = {};
    if (params.color !== undefined) materialParams.color = params.color;
    if (params.transparent !== undefined) materialParams.transparent = params.transparent;
    if (params.opacity !== undefined) materialParams.opacity = params.opacity;
    if (params.side !== undefined) materialParams.side = params.side;
    if (params.map !== undefined) materialParams.map = params.map;
    return new THREE.MeshBasicMaterial(materialParams);
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
