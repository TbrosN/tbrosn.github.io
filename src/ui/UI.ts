/**
 * UI management - onboarding, HUD, and controls
 */
export class UI {
  private onboarding: HTMLElement;
  private startBtn: HTMLButtonElement;
  private handTrackingBtn: HTMLButtonElement;
  private loading: HTMLElement;
  private crosshair: HTMLElement;
  private fpsElement: HTMLElement;
  private modeElement: HTMLElement;

  private onStartCallback?: () => void;
  private onHandTrackingCallback?: () => void;

  constructor() {
    this.onboarding = document.getElementById('onboarding')!;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
    this.handTrackingBtn = document.getElementById('hand-tracking-btn') as HTMLButtonElement;
    this.loading = document.getElementById('loading')!;
    this.crosshair = document.getElementById('crosshair')!;
    this.fpsElement = document.getElementById('fps')!;
    this.modeElement = document.getElementById('mode')!;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.startBtn.addEventListener('click', () => {
      this.hideOnboarding();
      if (this.onStartCallback) {
        this.onStartCallback();
      }
    });

    this.handTrackingBtn.addEventListener('click', () => {
      if (this.onHandTrackingCallback) {
        this.onHandTrackingCallback();
      }
    });
  }

  hideLoading(): void {
    this.loading.style.display = 'none';
  }

  hideOnboarding(): void {
    this.onboarding.classList.add('hidden');
  }

  showOnboarding(): void {
    this.onboarding.classList.remove('hidden');
  }

  setFPS(fps: number): void {
    this.fpsElement.textContent = Math.round(fps).toString();
  }

  setMode(mode: string): void {
    this.modeElement.textContent = mode;
  }

  setCrosshairActive(active: boolean): void {
    if (active) {
      this.crosshair.classList.add('active');
    } else {
      this.crosshair.classList.remove('active');
    }
  }

  onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  onHandTracking(callback: () => void): void {
    this.onHandTrackingCallback = callback;
  }
}
