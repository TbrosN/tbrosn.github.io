import * as THREE from 'three';
import type { Scene } from '../core/Scene';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { Raycaster } from '../interaction/Raycaster';
import type { GrabbableObject } from '../interaction/GrabSystem';
import { PortfolioContent } from './PortfolioContent';

/**
 * World building - environment and interactive objects
 */
export class World {
  private scene: Scene;
  private physics: PhysicsWorld;
  private raycaster: Raycaster;
  public interactiveObjects: Map<THREE.Object3D, GrabbableObject> = new Map();
  private portfolioContent: PortfolioContent;

  constructor(scene: Scene, physics: PhysicsWorld, raycaster: Raycaster) {
    this.scene = scene;
    this.physics = physics;
    this.raycaster = raycaster;
    this.portfolioContent = new PortfolioContent(scene.scene);
  }

  build(): void {
    this.createGround();
    this.createRoom();
    this.createInteractiveObjects();
    this.portfolioContent.create();
  }

  private createGround(): void {
    // Visual ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x00d4ff, 0x444444);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Physics ground
    this.physics.createGround(0);
  }

  private createRoom(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1e2e,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Back wall
    const backWall = this.createWall(20, 6, 0.2, wallMaterial);
    backWall.position.set(0, 3, -10);
    
    // Side walls
    const leftWall = this.createWall(0.2, 6, 20, wallMaterial);
    leftWall.position.set(-10, 3, 0);
    
    const rightWall = this.createWall(0.2, 6, 20, wallMaterial);
    rightWall.position.set(10, 3, 0);

    // Ceiling lights
    this.createCeilingLights();
  }

  private createWall(width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Physics
    this.physics.createBox(
      { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      { x: width, y: height, z: depth },
      false
    );

    return mesh;
  }

  private createCeilingLights(): void {
    const positions = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 },
    ];

    positions.forEach((pos) => {
      // Light fixture
      const geometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 2,
      });
      const fixture = new THREE.Mesh(geometry, material);
      fixture.position.set(pos.x, 5.8, pos.z);
      this.scene.add(fixture);

      // Point light
      const light = new THREE.PointLight(0xffffff, 1, 15);
      light.position.set(pos.x, 5.5, pos.z);
      light.castShadow = true;
      this.scene.add(light);
    });
  }

  private createInteractiveObjects(): void {
    // Floating cubes
    const cubePositions = [
      { x: -3, y: 1.5, z: 0 },
      { x: 0, y: 1.5, z: -2 },
      { x: 3, y: 1.5, z: 0 },
    ];

    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d];

    cubePositions.forEach((pos, index) => {
      const size = 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({
        color: colors[index],
        roughness: 0.3,
        metalness: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Physics
      const { rigidBody } = this.physics.createBox(
        { x: pos.x, y: pos.y, z: pos.z },
        { x: size, y: size, z: size },
        true
      );

      // Register as interactable
      const grabbable: GrabbableObject = { mesh, rigidBody };
      this.interactiveObjects.set(mesh, grabbable);
      this.raycaster.registerInteractable(mesh);
    });
  }


  getInteractiveObject(mesh: THREE.Object3D): GrabbableObject | undefined {
    return this.interactiveObjects.get(mesh);
  }

  update(delta: number): void {
    // Sync physics bodies with meshes
    this.interactiveObjects.forEach((grabbable) => {
      if (grabbable.rigidBody) {
        const translation = grabbable.rigidBody.translation();
        grabbable.mesh.position.set(translation.x, translation.y, translation.z);
        
        const rotation = grabbable.rigidBody.rotation();
        grabbable.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
    });
  }
}
