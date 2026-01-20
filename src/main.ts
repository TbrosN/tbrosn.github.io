import './style.css';
import * as THREE from 'three';
import { Time } from './core/Time';
import { Renderer } from './core/Renderer';
import { Camera } from './core/Camera';
import { Scene } from './core/Scene';
import { InputManager } from './player/InputManager';
import { PlayerController } from './player/PlayerController';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { Raycaster } from './interaction/Raycaster';
import { GrabSystem } from './interaction/GrabSystem';
import { World } from './world/World';
import { UI } from './ui/UI';
import { HandInteractionSystem } from './handtracking/HandInteractionSystem';
import { DeviceDetector } from './utils/DeviceDetector';
import { PerformanceMonitor } from './utils/PerformanceMonitor';

/**
 * Main application class
 */
class App {
  private canvas!: HTMLCanvasElement;
  private renderer!: Renderer;
  private scene!: Scene;
  private camera!: Camera;
  private time!: Time;
  private input!: InputManager;
  private player!: PlayerController;
  private physics!: PhysicsWorld;
  private raycaster!: Raycaster;
  private grabSystem!: GrabSystem;
  private world!: World;
  private ui!: UI;
  private handInteraction!: HandInteractionSystem;
  private performanceMonitor!: PerformanceMonitor;
  private isRunning: boolean = false;
  private handTrackingMode: boolean = false;

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

      // Initialize performance monitor
      this.performanceMonitor = new PerformanceMonitor();
      this.performanceMonitor.setQualityDowngradeCallback(() => {
        console.warn('⚠️ Auto-downgrading quality due to low FPS');
        // Could disable shadows, reduce pixel ratio, etc.
      });

      // Initialize core systems
      this.time = new Time();
      this.scene = new Scene();
      this.camera = new Camera();
      this.renderer = new Renderer(this.canvas);
      this.input = new InputManager(this.canvas);

      // Initialize physics
      this.physics = new PhysicsWorld();
      await this.physics.init();

      // Initialize interaction systems
      this.raycaster = new Raycaster(this.camera);
      this.grabSystem = new GrabSystem(this.camera, this.physics);
      
      // Initialize player
      this.player = new PlayerController(this.camera, this.input, this.physics);
      this.player.setupPhysics();

      // Build world
      this.world = new World(this.scene, this.physics, this.raycaster);
      this.world.build();

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

      // Hide hand tracking button on mobile
      if (DeviceDetector.isMobile() || !DeviceDetector.hasCamera()) {
        const handTrackingBtn = document.getElementById('hand-tracking-btn');
        if (handTrackingBtn) {
          handTrackingBtn.style.display = 'none';
        }
      }

      // Setup mouse click for grabbing
      this.canvas.addEventListener('click', () => {
        if (this.input.getPointerLocked()) {
          this.handleGrabClick();
        }
      });

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
    this.input.requestPointerLock();
    this.animate();
  }

  private handleGrabClick(): void {
    // Only handle mouse clicks if not in hand tracking mode
    if (this.handTrackingMode) return;

    const hoveredObject = this.raycaster.getCurrentHovered();
    
    if (this.grabSystem.isGrabbing()) {
      // Release currently grabbed object
      this.grabSystem.release();
      this.ui.setCrosshairActive(false);
    } else if (hoveredObject) {
      // Grab hovered object
      const grabbable = this.world.getInteractiveObject(hoveredObject);
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

  private animate(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    // Update time
    this.time.update();
    const delta = this.time.delta;

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

    // Render
    this.renderer.render(this.scene.scene, this.camera.camera);
  }

  dispose(): void {
    this.isRunning = false;
    this.renderer.dispose();
    this.camera.dispose();
    this.input.dispose();
  }
}

// Start the app
const app = new App();
app.init().catch(console.error);
