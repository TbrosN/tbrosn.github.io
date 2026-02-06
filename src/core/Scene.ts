import * as THREE from "three";

/**
 * Main scene setup with lighting and environment
 */
export class Scene {
  public scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Bright sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);
    this.setupLighting();
  }

  private setupLighting(): void {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(5, 10, 5);
    this.directionalLight.castShadow = true;

    // Shadow settings
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.bias = -0.001;

    this.scene.add(this.directionalLight);

    // Hemisphere light for better ambiance
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.5);
    this.scene.add(hemisphereLight);
  }

  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }
}
