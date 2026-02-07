/**
 * UI management - onboarding, HUD, and controls
 */
export class UI {
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

  private clickToPlayPrompt: HTMLElement | null = null;

  private loadingToast: HTMLElement | null = null;
  private loadingToastTimeout: ReturnType<typeof setTimeout> | null = null;
  private isLoading: boolean = true;

  private onPauseRequestedCallback?: () => void;
  private onResumeRequestedCallback?: () => void;

  constructor() {
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
    // Pause menu: resume/close
    if (this.pauseCloseBtn) {
      this.pauseCloseBtn.addEventListener('click', () => {
        if (this.isLoading) {
          this.showLoadingToast();
          return;
        }
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
        if (this.isLoading) {
          this.showLoadingToast();
          return;
        }
        if (this.onResumeRequestedCallback) this.onResumeRequestedCallback();
      }
    });
  }

  hideLoading(): void {
    this.isLoading = false;
    this.loading.style.display = 'none';
    this.dismissLoadingToast();
  }

  private showLoadingToast(): void {
    // If already showing, restart the timer
    if (this.loadingToastTimeout) {
      clearTimeout(this.loadingToastTimeout);
      this.loadingToastTimeout = null;
    }

    if (!this.loadingToast) {
      this.loadingToast = document.createElement('div');
      this.loadingToast.style.cssText =
        'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);' +
        'padding:10px 20px;border-radius:10px;background:rgba(255,255,255,0.12);' +
        'backdrop-filter:blur(12px);color:#fff;font-size:14px;font-weight:500;' +
        'pointer-events:none;z-index:1100;opacity:0;transition:opacity 0.25s;';
      this.loadingToast.textContent = 'Still loading — hang tight!';
      document.body.appendChild(this.loadingToast);
      // Trigger reflow so the opacity transition plays
      void this.loadingToast.offsetWidth;
    }

    this.loadingToast.style.opacity = '1';
    this.loadingToastTimeout = setTimeout(() => this.dismissLoadingToast(), 2500);
  }

  private dismissLoadingToast(): void {
    if (this.loadingToastTimeout) {
      clearTimeout(this.loadingToastTimeout);
      this.loadingToastTimeout = null;
    }
    if (this.loadingToast) {
      this.loadingToast.style.opacity = '0';
      const el = this.loadingToast;
      setTimeout(() => el.remove(), 300);
      this.loadingToast = null;
    }
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

  showClickToPlay(): void {
    if (!this.clickToPlayPrompt) {
      this.clickToPlayPrompt = document.createElement('div');
      this.clickToPlayPrompt.style.cssText =
        'position:fixed;inset:0;z-index:1050;display:flex;align-items:center;' +
        'justify-content:center;cursor:pointer;background:transparent;';
      this.clickToPlayPrompt.innerHTML =
        '<span style="padding:12px 28px;border-radius:12px;' +
        'background:rgba(0,0,0,0.55);backdrop-filter:blur(12px);' +
        'color:#fff;font-size:15px;font-weight:500;pointer-events:none;' +
        'letter-spacing:0.01em;">Click to play</span>';
      // Clicking the overlay triggers the same resume flow as the pause menu X
      this.clickToPlayPrompt.addEventListener('click', () => {
        if (this.onResumeRequestedCallback) this.onResumeRequestedCallback();
      });
      document.body.appendChild(this.clickToPlayPrompt);
    }
    this.clickToPlayPrompt.style.display = 'flex';
  }

  hideClickToPlay(): void {
    if (this.clickToPlayPrompt) {
      this.clickToPlayPrompt.style.display = 'none';
    }
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

  onPauseRequested(callback: () => void): void {
    this.onPauseRequestedCallback = callback;
  }

  onResumeRequested(callback: () => void): void {
    this.onResumeRequestedCallback = callback;
  }
}
