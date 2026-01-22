import type { Controls, LookDelta, MoveAxis } from './Controls';

/**
 * Desktop controls: keyboard + mouse with pointer lock.
 */
export class DesktopControls implements Controls {
  private keys: Map<string, boolean> = new Map();
  private mouseMovement: LookDelta = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private canvas: HTMLCanvasElement;
  private onPointerLockChange?: () => void;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.set(event.code, true);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.set(event.code, false);
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (this.isPointerLocked) {
      this.mouseMovement.x = event.movementX || 0;
      this.mouseMovement.y = event.movementY || 0;
    }
  };

  private readonly handlePointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    if (this.onPointerLockChange) {
      this.onPointerLockChange();
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  async requestPointerLock(): Promise<void> {
    try {
      await this.canvas.requestPointerLock();
    } catch (error) {
      console.warn('⚠️ Failed to acquire pointer lock:', error);
    }
  }

  exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  setPointerLockCallback(callback: () => void): void {
    this.onPointerLockChange = callback;
  }

  getPointerLocked(): boolean {
    return this.isPointerLocked;
  }

  isActive(): boolean {
    return this.isPointerLocked;
  }

  getMoveAxis(): MoveAxis {
    const x = (this.keys.get('KeyD') ? 1 : 0) + (this.keys.get('KeyA') ? -1 : 0);
    const y = (this.keys.get('KeyW') ? 1 : 0) + (this.keys.get('KeyS') ? -1 : 0);
    return { x, y };
  }

  getLookDelta(): LookDelta {
    const movement = { ...this.mouseMovement };
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    return movement;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}
