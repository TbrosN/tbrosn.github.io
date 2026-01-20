import * as THREE from 'three';

/**
 * Optimizes lighting and shadows for WebGPU/WebGL renderers
 */
export class LightingOptimizer {
  private isWebGPU: boolean;

  constructor(isWebGPU: boolean) {
    this.isWebGPU = isWebGPU;
    console.log(`💡 Lighting Optimizer initialized for ${isWebGPU ? 'WebGPU' : 'WebGL'}`);
  }

  /**
   * Optimize shadow settings for a light
   */
  optimizeShadow(light: THREE.Light & { shadow?: THREE.LightShadow }): void {
    if (!light.shadow) return;

    if (this.isWebGPU) {
      // WebGPU can handle higher resolution shadows with better performance
      light.shadow.mapSize.setScalar(2048);
      light.shadow.bias = -0.0001;
      light.shadow.normalBias = 0.02;
      
      // Enable higher quality shadow filtering
      light.shadow.radius = 2;
    } else {
      // WebGL gets more conservative settings
      light.shadow.mapSize.setScalar(1024);
      light.shadow.bias = -0.0005;
      light.shadow.normalBias = 0.05;
      light.shadow.radius = 1;
    }

    // Common optimization: adjust camera bounds for tighter fit
    if (light.shadow.camera instanceof THREE.OrthographicCamera) {
      const camera = light.shadow.camera as THREE.OrthographicCamera;
      // These should be adjusted based on scene bounds
      camera.near = 0.5;
      camera.far = 50;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Optimize all lights in a scene
   */
  optimizeSceneLights(scene: THREE.Scene): void {
    const lights: THREE.Light[] = [];
    
    scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        lights.push(object);
      }
    });

    console.log(`💡 Optimizing ${lights.length} lights...`);

    lights.forEach((light) => {
      // Optimize shadows
      if (light.castShadow) {
        this.optimizeShadow(light);
      }

      // Optimize light intensity for WebGPU's tone mapping
      if (this.isWebGPU) {
        // WebGPU tone mapping handles higher intensities better
        if (light instanceof THREE.PointLight) {
          light.decay = 2; // Physically accurate decay
        }
      }
    });

    console.log(`✅ Lighting optimization complete`);
  }

  /**
   * Create an optimized point light
   */
  createOptimizedPointLight(
    color: THREE.ColorRepresentation,
    intensity: number,
    distance: number,
    castShadow: boolean = false
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance);
    light.castShadow = castShadow;

    if (castShadow) {
      this.optimizeShadow(light);
    }

    // WebGPU benefits from physically accurate decay
    if (this.isWebGPU) {
      light.decay = 2;
    } else {
      light.decay = 1; // Less expensive for WebGL
    }

    return light;
  }

  /**
   * Create an optimized directional light
   */
  createOptimizedDirectionalLight(
    color: THREE.ColorRepresentation,
    intensity: number,
    castShadow: boolean = true
  ): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(color, intensity);
    light.castShadow = castShadow;

    if (castShadow) {
      this.optimizeShadow(light);
    }

    return light;
  }

  /**
   * Update shadow camera frustum to tightly fit target bounds
   * This reduces shadow map wastage and improves quality
   */
  updateShadowCamera(
    light: THREE.DirectionalLight,
    targetBounds: THREE.Box3
  ): void {
    if (!light.shadow || !(light.shadow.camera instanceof THREE.OrthographicCamera)) {
      return;
    }

    const camera = light.shadow.camera as THREE.OrthographicCamera;
    const size = new THREE.Vector3();
    targetBounds.getSize(size);

    // Set camera frustum to scene bounds
    const padding = 2; // Add some padding
    camera.left = -size.x / 2 - padding;
    camera.right = size.x / 2 + padding;
    camera.top = size.y / 2 + padding;
    camera.bottom = -size.y / 2 - padding;
    camera.near = 0.5;
    camera.far = size.z + padding * 2;

    camera.updateProjectionMatrix();
  }

  /**
   * Get performance metrics for lights
   */
  getLightingMetrics(scene: THREE.Scene): {
    totalLights: number;
    shadowCastingLights: number;
    totalShadowMapPixels: number;
  } {
    let totalLights = 0;
    let shadowCastingLights = 0;
    let totalShadowMapPixels = 0;

    scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        totalLights++;
        if (object.castShadow && object.shadow) {
          shadowCastingLights++;
          totalShadowMapPixels += object.shadow.mapSize.width * object.shadow.mapSize.height;
        }
      }
    });

    return {
      totalLights,
      shadowCastingLights,
      totalShadowMapPixels,
    };
  }
}
