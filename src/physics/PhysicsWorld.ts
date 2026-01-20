import RAPIER from '@dimforge/rapier3d-compat';

// Collision groups
export const CollisionGroups = {
  PLAYER: 0x0001,      // Player capsule
  ENVIRONMENT: 0x0002,  // Walls, floor, static objects
  INTERACTIVE: 0x0004,  // Grabbable objects
};

/**
 * Physics simulation using Rapier
 */
export class PhysicsWorld {
  public world!: RAPIER.World;
  public RAPIER!: typeof RAPIER;
  private isInitialized: boolean = false;
  private accumulator: number = 0;
  private readonly fixedTimeStep: number = 1 / 60;
  private readonly maxSubSteps: number = 5;

  async init(): Promise<void> {
    await RAPIER.init();
    this.RAPIER = RAPIER;
    
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    this.world = new RAPIER.World(gravity);
    
    this.isInitialized = true;
  }

  update(delta: number): void {
    if (!this.isInitialized) return;

    // Fixed-timestep stepping for stability (prevents jitter from variable frame times).
    // Clamp large deltas (tab switch, debugger pause, etc.) to avoid spiral-of-death.
    const clampedDelta = Math.min(Math.max(delta, 0), 0.25);
    this.accumulator += clampedDelta;

    let steps = 0;
    while (this.accumulator >= this.fixedTimeStep && steps < this.maxSubSteps) {
      this.world.timestep = this.fixedTimeStep;
      this.world.step();
      this.accumulator -= this.fixedTimeStep;
      steps++;
    }
  }

  createBox(
    position: { x: number; y: number; z: number },
    size: { x: number; y: number; z: number },
    isDynamic: boolean = true,
    collisionGroup?: number
  ): { rigidBody: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const rigidBodyDesc = isDynamic
      ? this.RAPIER.RigidBodyDesc.dynamic()
      : this.RAPIER.RigidBodyDesc.fixed();
    
    rigidBodyDesc.setTranslation(position.x, position.y, position.z);
    
    // Add damping to reduce oscillations and jitter
    if (isDynamic) {
      rigidBodyDesc.setLinearDamping(2.0);  // Increased damping for stability
      rigidBodyDesc.setAngularDamping(1.0); // Increased damping for stability
    }
    
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(
      size.x / 2,
      size.y / 2,
      size.z / 2
    );
    
    // Set collision groups if specified
    if (collisionGroup !== undefined) {
      // Set which group this collider belongs to and which groups it collides with
      if (collisionGroup === CollisionGroups.INTERACTIVE) {
        // Interactive objects collide with ENVIRONMENT and other INTERACTIVE, but NOT PLAYER
        colliderDesc.setCollisionGroups(
          (CollisionGroups.INTERACTIVE << 16) | (CollisionGroups.ENVIRONMENT | CollisionGroups.INTERACTIVE)
        );
      } else if (collisionGroup === CollisionGroups.ENVIRONMENT) {
        // Environment collides with everything
        colliderDesc.setCollisionGroups(
          (CollisionGroups.ENVIRONMENT << 16) | 0xFFFF
        );
      }
    }
    
    const collider = this.world.createCollider(colliderDesc, rigidBody);

    return { rigidBody, collider };
  }

  createGround(y: number = 0): { rigidBody: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed()
      .setTranslation(0, y, 0);
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(50, 0.1, 50);
    
    // Ground is part of environment - collides with everything
    colliderDesc.setCollisionGroups(
      (CollisionGroups.ENVIRONMENT << 16) | 0xFFFF
    );
    
    const collider = this.world.createCollider(colliderDesc, rigidBody);

    return { rigidBody, collider };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
