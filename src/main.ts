import './style.css';
import * as THREE from 'three';
import { Time } from './core/Time';
import { Renderer } from './core/Renderer';
import { Camera } from './core/Camera';
import { Scene } from './core/Scene';
import type { Controls } from './player/Controls';
import { DesktopControls } from './player/DesktopControls';
import { TouchControls } from './player/TouchControls';
import { PlayerController } from './player/PlayerController';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { Raycaster } from './interaction/Raycaster';
import { GrabSystem } from './interaction/GrabSystem';
import { World } from './world/World';
import { UI } from './ui/UI';
import { HandInteractionSystem } from './handtracking/HandInteractionSystem';
import { DeviceDetector } from './utils/DeviceDetector';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import { LightingOptimizer } from './lighting/LightingOptimizer';
import { NodeMaterialFactory } from './materials/NodeMaterialFactory';

/**
 * Main application class
 */
class App {
  private canvas!: HTMLCanvasElement;
  private renderer!: Renderer;
  private scene!: Scene;
  private camera!: Camera;
  private time!: Time;
  private desktopControls!: DesktopControls;
  private touchControls!: TouchControls;
  private activeControls!: Controls;
  private controlMode: 'desktop' | 'touch' = 'desktop';
  private player!: PlayerController;
  private physics!: PhysicsWorld;
  private raycaster!: Raycaster;
  private grabSystem!: GrabSystem;
  private world!: World;
  private ui!: UI;
  private handInteraction!: HandInteractionSystem;
  private performanceMonitor!: PerformanceMonitor;
  private lightingOptimizer!: LightingOptimizer;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private handTrackingMode: boolean = false;
  private wasTouchControlsActiveBeforePause: boolean = false;

  async init(): Promise<void> {
    try {
      // Log device info
      DeviceDetector.logDeviceInfo();
      const settings = DeviceDetector.getRecommendedSettings();
      console.log('📱 Recommended Settings:', settings);

      // Create canvas (ensure we don't accumulate multiple canvases across re-init/HMR)
      const appRoot = document.getElementById('app')!;
      const existingCanvas = appRoot.querySelector('canvas');
      if (existingCanvas) existingCanvas.remove();

      this.canvas = document.createElement('canvas');
      appRoot.appendChild(this.canvas);

      // Initialize UI
      this.ui = new UI();
      this.ui.setRenderer('Initializing...');

      // Initialize core systems
      this.time = new Time();
      this.scene = new Scene();
      this.camera = new Camera();
      this.renderer = new Renderer(this.canvas);
      
      // Initialize performance monitor (needs renderer)
      this.performanceMonitor = new PerformanceMonitor();
      this.performanceMonitor.setRenderer(this.renderer.renderer, this.renderer.isWebGPU);
      this.performanceMonitor.setQualityDowngradeCallback(() => {
        console.warn('⚠️ Auto-downgrading quality due to low FPS');
        // Could disable shadows, reduce pixel ratio, etc.
      });

      // Initialize lighting optimizer based on renderer type
      this.lightingOptimizer = new LightingOptimizer(this.renderer.isWebGPU);
      
      // Log renderer info
      const rendererInfo = NodeMaterialFactory.getRendererInfo();
      console.log(`🎨 Renderer: ${rendererInfo.backend}`);
      console.log(`🎨 Node Materials: ${rendererInfo.nodeMaterialsSupported ? 'Enabled' : 'Disabled'}`);
      
      // Update UI with renderer type
      this.ui.setRenderer(rendererInfo.backend);
      
      this.desktopControls = new DesktopControls(this.canvas);
      this.touchControls = new TouchControls();

      this.activeControls = {
        isActive: () => this.activeControlsTarget().isActive(),
        getMoveAxis: () => this.activeControlsTarget().getMoveAxis(),
        getLookDelta: () => this.activeControlsTarget().getLookDelta(),
        dispose: () => {
          this.desktopControls.dispose();
          this.touchControls.dispose();
        },
      };
      this.setControlMode(DeviceDetector.getDefaultControlMode());

      // Initialize physics
      this.physics = new PhysicsWorld();
      await this.physics.init();

      // Initialize interaction systems
      this.raycaster = new Raycaster(this.camera);
      this.grabSystem = new GrabSystem(this.camera, this.physics);
      
      // Initialize player
      this.player = new PlayerController(this.camera, this.activeControls, this.physics);
      this.player.setupPhysics();

      // Build world
      this.world = new World(this.scene, this.physics, this.raycaster);
      this.world.build();
      
      // Optimize lighting after world is built
      this.lightingOptimizer.optimizeSceneLights(this.scene.scene);
      
      // Log lighting metrics
      const lightingMetrics = this.lightingOptimizer.getLightingMetrics(this.scene.scene);
      console.log(`💡 Lighting Metrics:`, lightingMetrics);

      // Initialize hand tracking (best-effort; must not block app startup)
      this.handInteraction = new HandInteractionSystem(
        this.camera,
        this.scene.scene,
        this.physics,
        this.grabSystem,
        this.world
      );
      try {
        await this.handInteraction.init();
      } catch (error) {
        console.warn('🖐️ Hand tracking unavailable in this environment:', error);
        const handTrackingBtn = document.getElementById('hand-tracking-btn');
        if (handTrackingBtn) handTrackingBtn.style.display = 'none';
      }

      // Setup UI callbacks
      this.ui.onStart(() => {
        this.start();
      });

      this.ui.onHandTracking(() => {
        this.enableHandTracking();
      });

      this.ui.onPauseRequested(() => {
        // Mobile Menu button
        if (!this.isRunning) return;
        if (!this.isPaused) this.pause();
      });

      this.ui.onResumeRequested(() => {
        if (!this.isRunning) return;
        if (this.isPaused) this.resume();
      });

      // Hand tracking is desktop-only (touch users need hands for controls)
      if (
        DeviceDetector.getDefaultControlMode() !== 'desktop' ||
        !DeviceDetector.hasCamera()
      ) {
        const handTrackingBtn = document.getElementById('hand-tracking-btn');
        if (handTrackingBtn) {
          handTrackingBtn.style.display = 'none';
        }
      }

      // Setup mouse click for grabbing
      this.canvas.addEventListener('click', () => {
        if (this.controlMode === 'desktop' && this.desktopControls.getPointerLocked()) {
          this.handleGrabClick();
        }
      });

      this.desktopControls.setPointerLockCallback(() => {
        if (this.desktopControls.getPointerLocked()) {
          this.setControlMode('desktop');
        }
      });

      // ESC toggles pause menu (desktop) and resume.
      // We handle pointer lock explicitly, so DesktopControls does not own ESC behavior.
      window.addEventListener(
        'keydown',
        (event) => {
          if (event.code !== 'Escape') return;
          if (!this.isRunning) return;
          event.preventDefault();
          event.stopPropagation();

          if (this.isPaused) {
            this.resume();
          } else {
            this.pause();
          }
        },
        { capture: true }
      );

      this.canvas.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch') {
          this.setControlMode('touch');
        }
      }, { passive: true });

      this.canvas.addEventListener('pointerup', (event) => {
        if (event.pointerType !== 'touch') return;
        if (!this.isRunning || this.controlMode !== 'touch') return;
        if (this.isPaused) return;
        if (this.handTrackingMode) return;

        const tappedObject = this.raycaster.raycastFromScreenPoint(
          event.clientX,
          event.clientY
        );
        this.handleGrabTarget(tappedObject);
      }, { passive: true });

      console.log('✅ App initialized - Click "Enter Experience" to start');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      const loading = document.getElementById('loading');
      if (loading) {
        loading.innerHTML = '<div style="max-width:520px;text-align:center;line-height:1.4;">Failed to load. Open DevTools Console for details.</div>';
      }
      throw error;
    } finally {
      // Ensure we never get stuck on the loading overlay
      try {
        this.ui?.hideLoading();
      } catch {
        // ignore
      }
    }
  }

  private start(): void {
    this.isRunning = true;
    if (this.controlMode === 'desktop') {
      this.desktopControls.requestPointerLock();
    } else {
      this.touchControls.setActive(true);
    }
    this.animate();
  }

  private pause(): void {
    this.isPaused = true;

    // Avoid weird states: release any grabbed object and hide crosshair.
    if (this.grabSystem?.isGrabbing()) {
      this.grabSystem.release();
    }
    this.ui.setCrosshairActive(false);

    // Stop touch controls while paused so the user can interact with the menu.
    this.wasTouchControlsActiveBeforePause = this.controlMode === 'touch' && this.touchControls.isActive();
    if (this.controlMode === 'touch') {
      this.touchControls.setActive(false);
    }

    // On desktop, exiting pointer lock makes the pause state obvious and keeps the cursor usable.
    if (this.controlMode === 'desktop' && this.desktopControls.getPointerLocked()) {
      this.desktopControls.exitPointerLock();
    }

    this.ui.showPauseMenu();
  }

  private resume(): void {
    this.isPaused = false;
    this.ui.hidePauseMenu();

    if (this.controlMode === 'desktop') {
      this.desktopControls.requestPointerLock();
    } else if (this.wasTouchControlsActiveBeforePause) {
      this.touchControls.setActive(true);
    }
  }

  private handleGrabClick(): void {
    // Only handle mouse clicks if not in hand tracking mode
    if (this.handTrackingMode) return;
    if (this.isPaused) return;

    this.handleGrabTarget(this.raycaster.getCurrentHovered());
  }

  private handleGrabTarget(target: THREE.Object3D | null): void {
    if (this.grabSystem.isGrabbing()) {
      // Release currently grabbed object
      this.grabSystem.release();
      this.ui.setCrosshairActive(false);
      return;
    }

    if (target) {
      // Grab tapped/hovered object
      const grabbable = this.world.getInteractiveObject(target);
      if (grabbable) {
        this.grabSystem.grab(grabbable);
        this.ui.setCrosshairActive(true);
      }
    }
  }

  private async enableHandTracking(): Promise<void> {
    if (this.handTrackingMode) {
      // Disable hand tracking
      this.handInteraction.stop();
      this.handTrackingMode = false;
      this.ui.setMode('Mouse');
      console.log('🖐️ Hand tracking disabled');
    } else {
      // Enable hand tracking
      try {
        await this.handInteraction.start();
        this.handTrackingMode = true;
        this.ui.setMode('Hand Tracking');
        console.log('🖐️ Hand tracking enabled');
      } catch (error) {
        console.error('Failed to enable hand tracking:', error);
      }
    }
  }

  private async animate(): Promise<void> {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    // Update time
    this.time.update();
    const delta = this.time.delta;

    // While paused, keep rendering (nice backdrop), but stop gameplay systems.
    if (this.isPaused) {
      this.ui.setFPS(this.time.fps);
      await this.renderer.renderAsync(this.scene.scene, this.camera.camera);
      return;
    }

    // Update systems
    // Apply input before stepping physics, then sync camera from physics afterwards.
    this.player.prePhysics(delta);
    this.physics.update(delta);
    this.player.postPhysics();
    
    // Only update raycaster in mouse mode
    if (!this.handTrackingMode) {
      this.raycaster.update();
    }
    
    this.grabSystem.update(delta);
    this.handInteraction.update();
    this.world.update(delta);

    // Update performance monitor
    this.performanceMonitor.update(this.time.fps);

    // Update UI
    this.ui.setFPS(this.time.fps);
    
    // Update crosshair based on hover (only in mouse mode)
    if (!this.handTrackingMode) {
      const isHovering = this.raycaster.getCurrentHovered() !== null;
      if (!this.grabSystem.isGrabbing()) {
        this.ui.setCrosshairActive(isHovering);
      }
    }

    // Render (async for WebGPU optimization)
    await this.renderer.renderAsync(this.scene.scene, this.camera.camera);
  }

  private activeControlsTarget(): Controls {
    return this.controlMode === 'desktop' ? this.desktopControls : this.touchControls;
  }

  private setControlMode(mode: 'desktop' | 'touch'): void {
    if (this.controlMode === mode) return;
    this.controlMode = mode;
    this.touchControls.setActive(mode === 'touch' && this.isRunning);
    this.ui.setMode(mode === 'touch' ? 'Touch' : 'Mouse');
  }

  dispose(): void {
    this.isRunning = false;
    this.renderer.dispose();
    this.camera.dispose();
    this.desktopControls.dispose();
    this.touchControls.dispose();
  }
}

// Start the app
const app = new App();
app.init().catch(console.error);
