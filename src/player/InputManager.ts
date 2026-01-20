/**
 * Input management - keyboard, mouse, and pointer lock
 */
export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private mouseMovement: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private canvas: HTMLCanvasElement;
  private onPointerLockChange?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // Mouse movement
    document.addEventListener('mousemove', this.onMouseMove.bind(this));

    // Pointer lock
    this.canvas.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.set(event.code, true);
    
    // ESC to unlock pointer
    if (event.code === 'Escape') {
      this.exitPointerLock();
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.set(event.code, false);
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseMovement.x = event.movementX || 0;
      this.mouseMovement.y = event.movementY || 0;
    }
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock();
  }

  exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    if (this.onPointerLockChange) {
      this.onPointerLockChange();
    }
  }

  setPointerLockCallback(callback: () => void): void {
    this.onPointerLockChange = callback;
  }

  isKeyPressed(code: string): boolean {
    return this.keys.get(code) || false;
  }

  getMouseMovement(): { x: number; y: number } {
    const movement = { ...this.mouseMovement };
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    return movement;
  }

  getPointerLocked(): boolean {
    return this.isPointerLocked;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}
