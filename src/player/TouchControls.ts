import type { Controls, LookDelta, MoveAxis } from './Controls';

/**
 * Touch controls: left joystick for movement, right-side drag for look.
 */
export class TouchControls implements Controls {
  private readonly container: HTMLElement | null;
  private readonly moveStick: HTMLElement | null;
  private readonly moveThumb: HTMLElement | null;
  private readonly lookZone: HTMLElement | null;

  private moveAxis: MoveAxis = { x: 0, y: 0 };
  private lookDelta: LookDelta = { x: 0, y: 0 };
  private active: boolean = false;

  private movePointerId: number | null = null;
  private lookPointerId: number | null = null;
  private moveCenter: { x: number; y: number } = { x: 0, y: 0 };
  private lookLast: { x: number; y: number } | null = null;
  private readonly maxRadius: number = 60;

  private readonly handleMovePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' || this.movePointerId !== null) return;
    if (!this.moveStick || !this.moveThumb) return;

    event.preventDefault();
    this.movePointerId = event.pointerId;

    const rect = this.moveStick.getBoundingClientRect();
    this.moveCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.updateMoveFromPoint(event.clientX, event.clientY);
  };

  private readonly handleMovePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.movePointerId) return;
    event.preventDefault();
    this.updateMoveFromPoint(event.clientX, event.clientY);
  };

  private readonly handleMovePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.movePointerId) return;
    event.preventDefault();
    this.movePointerId = null;
    this.moveAxis = { x: 0, y: 0 };
    this.resetThumb();
  };

  private readonly handleLookPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' || this.lookPointerId !== null) return;
    if (!this.lookZone) return;
    event.preventDefault();

    this.lookPointerId = event.pointerId;
    this.lookLast = { x: event.clientX, y: event.clientY };
  };

  private readonly handleLookPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.lookPointerId || !this.lookLast) return;
    event.preventDefault();

    const deltaX = event.clientX - this.lookLast.x;
    const deltaY = event.clientY - this.lookLast.y;
    this.lookLast = { x: event.clientX, y: event.clientY };

    this.lookDelta.x += deltaX;
    this.lookDelta.y += deltaY;
  };

  private readonly handleLookPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.lookPointerId) return;
    event.preventDefault();
    this.lookPointerId = null;
    this.lookLast = null;
  };

  constructor() {
    this.container = document.getElementById('mobile-controls');
    this.moveStick = document.getElementById('move-stick');
    this.moveThumb = document.getElementById('move-thumb');
    this.lookZone = document.getElementById('look-zone');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (this.moveStick) {
      this.moveStick.addEventListener('pointerdown', this.handleMovePointerDown, { passive: false });
      this.moveStick.addEventListener('pointermove', this.handleMovePointerMove, { passive: false });
      this.moveStick.addEventListener('pointerup', this.handleMovePointerUp, { passive: false });
      this.moveStick.addEventListener('pointercancel', this.handleMovePointerUp, { passive: false });
    }

    if (this.lookZone) {
      this.lookZone.addEventListener('pointerdown', this.handleLookPointerDown, { passive: false });
      this.lookZone.addEventListener('pointermove', this.handleLookPointerMove, { passive: false });
      this.lookZone.addEventListener('pointerup', this.handleLookPointerUp, { passive: false });
      this.lookZone.addEventListener('pointercancel', this.handleLookPointerUp, { passive: false });
    }
  }

  private updateMoveFromPoint(clientX: number, clientY: number): void {
    const dx = clientX - this.moveCenter.x;
    const dy = clientY - this.moveCenter.y;
    const distance = Math.min(Math.hypot(dx, dy), this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * distance;
    const clampedY = Math.sin(angle) * distance;

    this.moveAxis = {
      x: clampedX / this.maxRadius,
      y: -clampedY / this.maxRadius,
    };

    if (this.moveThumb) {
      this.moveThumb.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    }
  }

  private resetThumb(): void {
    if (this.moveThumb) {
      this.moveThumb.style.transform = 'translate3d(0, 0, 0)';
    }
  }

  setActive(active: boolean): void {
    this.active = active;
    if (this.container) {
      this.container.classList.toggle('active', active);
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getMoveAxis(): MoveAxis {
    return this.moveAxis;
  }

  getLookDelta(): LookDelta {
    const delta = { ...this.lookDelta };
    this.lookDelta = { x: 0, y: 0 };
    return delta;
  }

  dispose(): void {
    if (this.moveStick) {
      this.moveStick.removeEventListener('pointerdown', this.handleMovePointerDown);
      this.moveStick.removeEventListener('pointermove', this.handleMovePointerMove);
      this.moveStick.removeEventListener('pointerup', this.handleMovePointerUp);
      this.moveStick.removeEventListener('pointercancel', this.handleMovePointerUp);
    }

    if (this.lookZone) {
      this.lookZone.removeEventListener('pointerdown', this.handleLookPointerDown);
      this.lookZone.removeEventListener('pointermove', this.handleLookPointerMove);
      this.lookZone.removeEventListener('pointerup', this.handleLookPointerUp);
      this.lookZone.removeEventListener('pointercancel', this.handleLookPointerUp);
    }
  }
}
