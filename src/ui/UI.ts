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
  private rendererElement: HTMLElement | null;

  private pauseMenu: HTMLElement;
  private pauseTabs: HTMLButtonElement[];
  private pausePanels: HTMLElement[];
  private pauseCloseBtn: HTMLButtonElement | null;
  private pauseMobileBtn: HTMLButtonElement | null;

  private onStartCallback?: () => void;
  private onHandTrackingCallback?: () => void;
  private onPauseRequestedCallback?: () => void;
  private onResumeRequestedCallback?: () => void;

  constructor() {
    this.onboarding = document.getElementById('onboarding')!;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
    this.handTrackingBtn = document.getElementById('hand-tracking-btn') as HTMLButtonElement;
    this.loading = document.getElementById('loading')!;
    this.crosshair = document.getElementById('crosshair')!;
    this.fpsElement = document.getElementById('fps')!;
    this.modeElement = document.getElementById('mode')!;
    this.rendererElement = document.getElementById('renderer');

    this.pauseMenu = document.getElementById('pause-menu')!;
    this.pauseCloseBtn = document.getElementById('pause-close-btn') as HTMLButtonElement | null;
    this.pauseMobileBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;

    this.pauseTabs = Array.from(
      this.pauseMenu.querySelectorAll<HTMLButtonElement>('.pause-tab')
    );
    this.pausePanels = Array.from(
      this.pauseMenu.querySelectorAll<HTMLElement>('[data-tab-panel]')
    );

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

    // Pause menu: resume/close
    if (this.pauseCloseBtn) {
      this.pauseCloseBtn.addEventListener('click', () => {
        if (this.onResumeRequestedCallback) this.onResumeRequestedCallback();
      });
    }

    // Pause menu: mobile button
    if (this.pauseMobileBtn) {
      this.pauseMobileBtn.addEventListener('click', () => {
        if (this.onPauseRequestedCallback) this.onPauseRequestedCallback();
      });
    }

    // Pause menu: tab switching
    this.pauseTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.setPauseTab(tab);
      });
    });

    // Device tab switching in controls
    const deviceTabs = document.querySelectorAll<HTMLButtonElement>('.device-tab');
    deviceTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const device = btn.dataset.device;
        if (device) this.setDeviceTab(device);
      });
    });

    // Click on background (outside panel) triggers resume
    this.pauseMenu.addEventListener('click', (event) => {
      // If clicking directly on the pause menu background (not the panel)
      if (event.target === this.pauseMenu) {
        if (this.onResumeRequestedCallback) this.onResumeRequestedCallback();
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

  showPauseMenu(): void {
    this.pauseMenu.classList.remove('hidden');
    this.pauseMenu.setAttribute('aria-hidden', 'false');
    // Default to About each time (keeps it predictable)
    this.setPauseTab('about');
  }

  hidePauseMenu(): void {
    this.pauseMenu.classList.add('hidden');
    this.pauseMenu.setAttribute('aria-hidden', 'true');
  }

  isPauseMenuVisible(): boolean {
    return !this.pauseMenu.classList.contains('hidden');
  }

  private setPauseTab(tab: string): void {
    this.pauseTabs.forEach((btn) => {
      const selected = btn.dataset.tab === tab;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });

    this.pausePanels.forEach((panel) => {
      const panelTab = panel.dataset.tabPanel;
      panel.style.display = panelTab === tab ? '' : 'none';
    });
  }

  private setDeviceTab(device: string): void {
    // Update device tab buttons
    const deviceTabs = document.querySelectorAll<HTMLButtonElement>('.device-tab');
    deviceTabs.forEach((btn) => {
      const isActive = btn.dataset.device === device;
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update device controls visibility
    const controlsLists = document.querySelectorAll<HTMLElement>('[data-device-controls]');
    controlsLists.forEach((list) => {
      const listDevice = list.dataset.deviceControls;
      list.style.display = listDevice === device ? '' : 'none';
    });
  }

  setFPS(fps: number): void {
    this.fpsElement.textContent = Math.round(fps).toString();
  }

  setMode(mode: string): void {
    this.modeElement.textContent = mode;
  }

  setRenderer(renderer: string): void {
    if (this.rendererElement) {
      this.rendererElement.textContent = renderer;
      // Add a visual indicator for WebGPU
      if (renderer === 'WebGPU') {
        this.rendererElement.style.color = '#00ff88';
      } else {
        this.rendererElement.style.color = '#ffffff';
      }
    }
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

  onPauseRequested(callback: () => void): void {
    this.onPauseRequestedCallback = callback;
  }

  onResumeRequested(callback: () => void): void {
    this.onResumeRequestedCallback = callback;
  }
}
