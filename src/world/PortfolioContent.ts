import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Portfolio-specific content and interactive elements
 */
export class PortfolioContent {
  private scene: THREE.Scene;
  private projects: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.createAboutSection();
    this.createProjectPedestals();
    this.createSkillsWall();
    this.createInteractiveTimeline();
  }

  private createAboutSection(): void {
    // Central floating bio card
    const cardGeometry = new THREE.BoxGeometry(2, 2.5, 0.1);
    const cardMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4e,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0x1a1a3e,
      emissiveIntensity: 0.3,
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.set(0, 2, -6);
    card.castShadow = true;
    this.scene.add(card);

    // Add glow effect
    const glowGeometry = new THREE.PlaneGeometry(2.2, 2.7);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = 0.06;
    card.add(glow);

    // Add "ABOUT" text
    this.addTextPlane(card, 'XR ENGINEER', 0, 0.8, 0.06, 0.3);
    this.addTextPlane(card, 'Creative Developer', 0, 0.3, 0.06, 0.2);
    
    // Floating animation
    gsap.to(card.position, {
      y: card.position.y + 0.3,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });

    gsap.to(card.rotation, {
      y: Math.PI * 2,
      duration: 30,
      repeat: -1,
      ease: 'none',
    });
  }

  private createProjectPedestals(): void {
    const projects = [
      { name: 'VR Gallery', position: { x: -4, z: -3 }, color: 0xff6b6b },
      { name: 'AR Shopping', position: { x: 0, z: -3 }, color: 0x4ecdc4 },
      { name: '3D Visualizer', position: { x: 4, z: -3 }, color: 0xffe66d },
    ];

    projects.forEach((project) => {
      const group = new THREE.Group();
      group.position.set(project.position.x, 0, project.position.z);

      // Pedestal
      const pedestalGeometry = new THREE.CylinderGeometry(0.8, 1, 0.3, 8);
      const pedestalMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e1e2e,
        roughness: 0.5,
        metalness: 0.5,
      });
      const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
      pedestal.position.y = 0.15;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      // Floating project icon (sphere)
      const iconGeometry = new THREE.IcosahedronGeometry(0.4, 1);
      const iconMaterial = new THREE.MeshStandardMaterial({
        color: project.color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: project.color,
        emissiveIntensity: 0.5,
      });
      const icon = new THREE.Mesh(iconGeometry, iconMaterial);
      icon.position.y = 1.5;
      icon.castShadow = true;
      group.add(icon);

      // Point light for icon
      const light = new THREE.PointLight(project.color, 0.5, 5);
      light.position.copy(icon.position);
      group.add(light);

      // Label
      this.addTextPlane(group, project.name, 0, 0.6, 0, 0.15);

      // Animate
      gsap.to(icon.position, {
        y: icon.position.y + 0.2,
        duration: 2 + Math.random(),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });

      gsap.to(icon.rotation, {
        y: Math.PI * 2,
        duration: 10,
        repeat: -1,
        ease: 'none',
      });

      this.scene.add(group);
      this.projects.push(group);
    });
  }

  private createSkillsWall(): void {
    const skills = [
      'Three.js',
      'WebXR',
      'React',
      'Unity',
      'Blender',
      'Spatial Computing',
    ];

    const startX = -5;
    const startY = 2;
    const spacing = 1.8;

    skills.forEach((skill, index) => {
      const x = startX + (index % 3) * spacing;
      const y = startY + Math.floor(index / 3) * 0.8;

      const cardGeometry = new THREE.PlaneGeometry(1.5, 0.6);
      const cardMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const card = new THREE.Mesh(cardGeometry, cardMaterial);
      card.position.set(x, y, -9.8);
      this.scene.add(card);

      // Add text
      this.addTextToPlane(card, skill);

      // Subtle animation
      gsap.to(card.material, {
        opacity: 0.4,
        duration: 1.5 + Math.random(),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random() * 2,
      });
    });
  }

  private createInteractiveTimeline(): void {
    // Create a spiral timeline of experience
    const radius = 3;
    const height = 4;
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const y = (i / segments) * height;
      
      const x = Math.cos(angle) * radius + 6;
      const z = Math.sin(angle) * radius;

      // Timeline node
      const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.8,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y + 0.5, z);
      this.scene.add(node);

      // Connecting line to next node
      if (i < segments - 1) {
        const nextAngle = ((i + 1) / segments) * Math.PI * 2;
        const nextY = ((i + 1) / segments) * height;
        const nextX = Math.cos(nextAngle) * radius + 6;
        const nextZ = Math.sin(nextAngle) * radius;

        const points = [
          new THREE.Vector3(x, y + 0.5, z),
          new THREE.Vector3(nextX, nextY + 0.5, nextZ),
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.3,
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
      }

      // Glow animation
      gsap.to(nodeMaterial, {
        emissiveIntensity: 0.3,
        duration: 1 + Math.random(),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: i * 0.2,
      });
    }
  }

  private addTextPlane(
    parent: THREE.Object3D,
    text: string,
    x: number,
    y: number,
    z: number,
    height: number
  ): void {
    const width = height * 4;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x, y, z);
    parent.add(plane);

    this.addTextToPlane(plane, text);
  }

  private addTextToPlane(plane: THREE.Mesh, text: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;

    context.fillStyle = '#00d4ff';
    context.font = 'bold 40px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    (plane.material as THREE.MeshBasicMaterial).map = texture;
    (plane.material as THREE.MeshBasicMaterial).transparent = true;
    (plane.material as THREE.MeshBasicMaterial).opacity = 1;
    (plane.material as THREE.MeshBasicMaterial).needsUpdate = true;
  }
}
