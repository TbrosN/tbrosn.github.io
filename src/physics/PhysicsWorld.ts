import RAPIER from '@dimforge/rapier3d-compat';

/**
 * Physics simulation using Rapier
 */
export class PhysicsWorld {
  public world!: RAPIER.World;
  public RAPIER!: typeof RAPIER;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    await RAPIER.init();
    this.RAPIER = RAPIER;
    
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    this.world = new RAPIER.World(gravity);
    
    this.isInitialized = true;
  }

  update(delta: number): void {
    if (!this.isInitialized) return;
    this.world.step();
  }

  createBox(
    position: { x: number; y: number; z: number },
    size: { x: number; y: number; z: number },
    isDynamic: boolean = true
  ): { rigidBody: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const rigidBodyDesc = isDynamic
      ? this.RAPIER.RigidBodyDesc.dynamic()
      : this.RAPIER.RigidBodyDesc.fixed();
    
    rigidBodyDesc.setTranslation(position.x, position.y, position.z);
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(
      size.x / 2,
      size.y / 2,
      size.z / 2
    );
    const collider = this.world.createCollider(colliderDesc, rigidBody);

    return { rigidBody, collider };
  }

  createGround(y: number = 0): { rigidBody: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed()
      .setTranslation(0, y, 0);
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(50, 0.1, 50);
    const collider = this.world.createCollider(colliderDesc, rigidBody);

    return { rigidBody, collider };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
