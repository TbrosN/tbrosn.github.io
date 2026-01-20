# Contributing Guide

Thank you for your interest in contributing! This project is designed as a portfolio template, but improvements are always welcome.

## Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/githubio.git
cd githubio
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
Navigate to http://localhost:3000

## Project Structure

Understanding the architecture:

- **`src/core/`** - Core engine (renderer, scene, camera, time)
- **`src/player/`** - Player controls (input, movement)
- **`src/physics/`** - Physics simulation (Rapier)
- **`src/interaction/`** - Object interaction (raycasting, grabbing)
- **`src/handtracking/`** - Hand tracking (MediaPipe integration)
- **`src/world/`** - World building (environment, portfolio content)
- **`src/utils/`** - Utilities (device detection, performance)
- **`src/ui/`** - UI overlays (HUD, onboarding)

## Coding Standards

### TypeScript
- Use strict TypeScript
- Always define types/interfaces
- Avoid `any` - use `unknown` if needed
- Enable all strict flags

### Three.js
- Dispose of geometries/materials when done
- Use `traverse()` for scene graph operations
- Prefer `BufferGeometry` over legacy geometry
- Update materials with `needsUpdate = true` when changed

### Performance
- Aim for 60 FPS on mid-range hardware
- Profile before optimizing
- Use frustum culling where possible
- Batch similar materials
- Minimize draw calls

### Code Style
```typescript
// Use descriptive names
class PlayerController { ... }

// Group related functionality
export class GrabSystem {
  private grabbedObject: GrabbableObject | null = null;
  
  grab(object: GrabbableObject): void { ... }
  release(): void { ... }
}

// Comment complex logic
// Calculate cursor position by raycasting from hand through camera
const cursorPos = this.calculateCursorPosition(handPos);
```

## Adding New Features

### 1. New Interactive Object Type

```typescript
// src/world/CustomObject.ts
import * as THREE from 'three';
import type { Scene } from '../core/Scene';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export class CustomObject {
  private mesh: THREE.Mesh;
  private rigidBody: any;

  constructor(scene: Scene, physics: PhysicsWorld) {
    // Create visual mesh
    this.mesh = this.createMesh();
    scene.add(this.mesh);
    
    // Create physics body
    this.rigidBody = this.createPhysics(physics);
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    return new THREE.Mesh(geometry, material);
  }

  private createPhysics(physics: PhysicsWorld): any {
    const { rigidBody } = physics.createBox(
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 1 },
      true
    );
    return rigidBody;
  }

  update(): void {
    // Sync mesh with physics
    const pos = this.rigidBody.translation();
    this.mesh.position.set(pos.x, pos.y, pos.z);
  }
}
```

### 2. New Gesture Type

```typescript
// src/handtracking/GestureDetector.ts
detectSwipe(hand: HandLandmarks): boolean {
  const velocity = this.calculateHandVelocity(hand);
  return velocity.x > SWIPE_THRESHOLD;
}
```

### 3. New Portfolio Section

Edit `src/world/PortfolioContent.ts`:
```typescript
private createContactSection(): void {
  // Add your portfolio content here
  const contactCard = this.createCard('CONTACT', 5, 2, -5);
  this.scene.add(contactCard);
}
```

## Testing

### Manual Testing Checklist
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile Chrome (iOS/Android)
- [ ] Test with hand tracking ON
- [ ] Test with hand tracking OFF
- [ ] Test on low-end GPU
- [ ] Check FPS stays above 30

### Performance Testing
```typescript
// Enable stats
import Stats from 'three/examples/jsm/libs/stats.module';

const stats = new Stats();
document.body.appendChild(stats.dom);

// In render loop
stats.update();
```

### Debug Mode
Add to `main.ts`:
```typescript
const DEBUG = true;

if (DEBUG) {
  // Show physics debug
  // Show hand landmarks
  // Log performance metrics
}
```

## Common Issues

### Hand tracking not working locally
- Use HTTPS: `npx local-ssl-proxy --source 3001 --target 3000`
- Or use `chrome://flags` to enable insecure origins

### Physics not stepping
- Ensure `physics.update()` is called every frame
- Check Rapier initialization completed

### Low FPS
- Check shadow map size
- Reduce pixel ratio
- Disable expensive effects

## Pull Request Process

1. **Fork and create branch:**
```bash
git checkout -b feature/amazing-feature
```

2. **Make changes and test:**
```bash
npm run dev
# Test your changes
```

3. **Ensure build works:**
```bash
npm run build
```

4. **Commit with clear message:**
```bash
git commit -m "Add amazing feature: description"
```

5. **Push and create PR:**
```bash
git push origin feature/amazing-feature
```

6. **PR Guidelines:**
   - Clear title and description
   - Reference any related issues
   - Include screenshots/videos if visual
   - Describe testing performed

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on code, not people
- Assume good intentions

## Questions?

- Open an issue for bugs
- Start a discussion for feature ideas
- Check existing issues first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
