import "./style.css";
import * as THREE from "three";
import { Time } from "./core/Time";
import { Renderer, WebGLContextError } from "./core/Renderer";
import { Camera } from "./core/Camera";
import { Scene } from "./core/Scene";
import type { Controls } from "./player/Controls";
import { DesktopControls } from "./player/DesktopControls";
import { TouchControls } from "./player/TouchControls";
import { PlayerController } from "./player/PlayerController";
import { PhysicsWorld } from "./physics/PhysicsWorld";
import { Raycaster } from "./interaction/Raycaster";
import { GrabSystem } from "./interaction/GrabSystem";
import { World } from "./world/World";
import { UI } from "./ui/UI";
import { SpeechBubble } from "./ui/SpeechBubble";
import type { NPC } from "./interaction/NPCSystem";
import { DeviceDetector } from "./utils/DeviceDetector";
import { PerformanceMonitor } from "./utils/PerformanceMonitor";
import { LightingOptimizer } from "./lighting/LightingOptimizer";
import { NodeMaterialFactory } from "./materials/NodeMaterialFactory";

/**
 * Application state enum
 */
enum AppState {
  PLAYING = "PLAYING", // Pointer locked, game active
  PAUSED = "PAUSED", // Pause menu visible
  CARICATURE_UI = "CARICATURE_UI", // Caricature overlay active
}

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
  private controlMode: "desktop" | "touch" = "desktop";
  private player!: PlayerController;
  private physics!: PhysicsWorld;
  private raycaster!: Raycaster;
  private grabSystem!: GrabSystem;
  private world!: World;
  private ui!: UI;
  private speechBubble!: SpeechBubble;
  private performanceMonitor!: PerformanceMonitor;
  private lightingOptimizer!: LightingOptimizer;
  private isRunning: boolean = false;
  private lastInteractedNPC: NPC | null = null;
  private appState: AppState = AppState.PAUSED;

  async init(): Promise<void> {
    try {
      // Log device info
      DeviceDetector.logDeviceInfo();
      const settings = DeviceDetector.getRecommendedSettings();

      // Create canvas (ensure we don't accumulate multiple canvases across re-init/HMR)
      const appRoot = document.getElementById("app")!;
      const existingCanvas = appRoot.querySelector("canvas");
      if (existingCanvas) existingCanvas.remove();

      this.canvas = document.createElement("canvas");
      appRoot.appendChild(this.canvas);

      // Initialize UI
      this.ui = new UI();
      this.speechBubble = new SpeechBubble();
      this.ui.setRenderer("Initializing...");

      // Initialize core systems
      this.time = new Time();
      this.scene = new Scene();
      this.camera = new Camera();
      this.renderer = new Renderer(this.canvas);

      // Initialize performance monitor (needs renderer)
      this.performanceMonitor = new PerformanceMonitor();
      this.performanceMonitor.setRenderer(
        this.renderer.renderer,
        this.renderer.isWebGPU,
      );
      this.performanceMonitor.setQualityDowngradeCallback(() => {
        console.warn("⚠️ Auto-downgrading quality due to low FPS");
        // Could disable shadows, reduce pixel ratio, etc.
      });

      // Initialize lighting optimizer based on renderer type
      this.lightingOptimizer = new LightingOptimizer(this.renderer.isWebGPU);

      // Log renderer info
      const rendererInfo = NodeMaterialFactory.getRendererInfo();

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
      this.player = new PlayerController(
        this.camera,
        this.activeControls,
        this.physics,
      );
      this.player.setupPhysics();

      // Build world
      this.world = new World(this.scene, this.physics, this.raycaster);

      await this.world.build();

      // Set up NPC dialogue callback
      this.world.npcSystem.onDialogue((npc, message) => {
        this.speechBubble.show(npc.name, message);
      });

      // Set up caricature UI state callbacks (after NPCs are loaded!)
      this.world.setCaricatureCallbacks(
        () => this.enterCaricatureMode(),
        () => this.exitCaricatureMode(),
        // When an NPC speaks proactively, track it as the last interacted NPC
        // so spacebar handling works without requiring the user to click the NPC
        (npc) => {
          this.lastInteractedNPC = npc;
        },
      );

      // Optimize lighting after world is built
      this.lightingOptimizer.optimizeSceneLights(this.scene.scene);

      // Log lighting metrics
      const lightingMetrics = this.lightingOptimizer.getLightingMetrics(
        this.scene.scene,
      );

      // Auto-start: skip onboarding and go straight into the scene
      this.start();

      // Show pause menu initially for desktop users (no pointer lock yet)
      if (DeviceDetector.getDefaultControlMode() === "desktop") {
        this.ui.showPauseMenu();
      }

      // Setup mouse click for pointer lock and grabbing
      this.canvas.addEventListener("click", async () => {
        // First click: try to acquire pointer lock (requires user gesture)
        if (
          this.controlMode === "desktop" &&
          !this.desktopControls.getPointerLocked() &&
          this.isRunning
        ) {
          await this.desktopControls.requestPointerLock();
        }
        // Subsequent clicks: handle grabbing
        else if (
          this.controlMode === "desktop" &&
          this.desktopControls.getPointerLocked()
        ) {
          this.handleGrabClick();
        }
      });

      // Pause menu: clicking anywhere requests pointer lock (for desktop)
      this.ui.onResumeRequested(async () => {
        if (
          this.controlMode === "desktop" &&
          !this.desktopControls.getPointerLocked()
        ) {
          await this.desktopControls.requestPointerLock();
          this.setAppState(AppState.PLAYING);
        } else if (this.controlMode === "touch") {
          this.touchControls.setActive(true);
          this.ui.hidePauseMenu();
          this.setAppState(AppState.PLAYING);
        }
      });

      // Pause menu: when on mobile, pause button should show menu
      this.ui.onPauseRequested(() => {
        if (this.isRunning && this.controlMode === "touch") {
          this.touchControls.setActive(false);
          this.ui.showPauseMenu();
          this.setAppState(AppState.PAUSED);
        }
      });

      // Pointer lock callback: show/hide pause menu based on lock state
      this.desktopControls.setPointerLockCallback(() => {
        if (this.desktopControls.getPointerLocked()) {
          this.setControlMode("desktop");
          this.ui.hidePauseMenu();
          this.setAppState(AppState.PLAYING);
        } else {
          // Only show pause menu if we're not in a special UI mode (like caricature)
          if (
            this.isRunning &&
            this.controlMode === "desktop" &&
            this.appState !== AppState.CARICATURE_UI
          ) {
            this.ui.showPauseMenu();
            this.setAppState(AppState.PAUSED);
          }
        }
      });

      this.canvas.addEventListener(
        "pointerdown",
        (event) => {
          if (event.pointerType === "touch") {
            this.setControlMode("touch");
          }
        },
        { passive: true },
      );

      this.canvas.addEventListener(
        "pointerup",
        (event) => {
          if (event.pointerType !== "touch") return;
          if (!this.isRunning || this.controlMode !== "touch") return;
          // Don't handle grab if pause menu is visible
          if (this.ui.isPauseMenuVisible()) return;

          const tappedObject = this.raycaster.raycastFromScreenPoint(
            event.clientX,
            event.clientY,
          );
          this.handleGrabTarget(tappedObject);
        },
        { passive: true },
      );

      // Listen for spacebar to open NPC links or interact with caricature artist
      window.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
          if (this.lastInteractedNPC) {
            // Special handling for caricature artist NPC
            const caricatureNPC =
              this.world.npcSystem.getNPC("caricature-artist");
            if (this.lastInteractedNPC === caricatureNPC) {
              event.preventDefault();
              event.stopPropagation();

              const caricatureArtist = this.world.getCaricatureArtist();
              const isLast = this.world.npcSystem.isOnLastMessage(
                this.lastInteractedNPC,
              );

              if (caricatureArtist.isReady()) {
                // Show the generated caricature (works on any message when ready)
                caricatureArtist.viewCaricature();
              } else if (caricatureArtist.canStartNewGeneration() && isLast) {
                // Only start the process on the last dialogue message
                caricatureArtist.startCaricatureProcess();
              }
              return;
            }

            // Normal NPC link handling
            const isLast = this.world.npcSystem.isOnLastMessage(
              this.lastInteractedNPC,
            );
            const hasLink = this.lastInteractedNPC.link;

            // Check if we're on the last message and the NPC has a link
            if (isLast && hasLink) {
              event.preventDefault();
              event.stopPropagation();
              window.open(this.lastInteractedNPC.link, "_blank");
            }
          }
        }
      });
    } catch (error) {
      console.error("❌ App initialization failed:", error);
      const loading = document.getElementById("loading");
      if (loading) {
        if (error instanceof WebGLContextError) {
          // Show user-friendly GPU/WebGL error
          loading.innerHTML = `
            <div style="max-width:480px;text-align:center;line-height:1.6;padding:2rem;">
              <div style="font-size:3rem;margin-bottom:1rem;">🔌</div>
              <h2 style="margin:0 0 1rem;font-size:1.5rem;color:#fff;">GPU Unavailable</h2>
              <p style="margin:0 0 1.5rem;color:#aaa;font-size:1rem;">
                This site requires WebGL to render 3D graphics, but your GPU is currently unavailable.
              </p>
              <p style="margin:0 0 1.5rem;color:#fff;font-size:1.1rem;font-weight:500;">
                Please plug in your device to restore GPU access.
              </p>
              <p style="margin:0;color:#666;font-size:0.85rem;">
                If you're already plugged in, try enabling hardware acceleration in your browser settings
                or restarting your browser.
              </p>
            </div>
          `;
        } else {
          loading.innerHTML =
            '<div style="max-width:520px;text-align:center;line-height:1.4;">Failed to load. Open DevTools Console for details.</div>';
        }
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

  private async start(): Promise<void> {
    this.isRunning = true;
    // For touch controls, activate immediately and hide pause menu
    // For desktop, pointer lock will be requested on user click (pause menu shows until then)
    if (this.controlMode === "touch") {
      this.touchControls.setActive(true);
      this.ui.hidePauseMenu();
      this.setAppState(AppState.PLAYING);
    } else {
      // Desktop starts in paused state until user clicks
      this.setAppState(AppState.PAUSED);
    }
    this.animate();
  }

  private handleGrabClick(): void {
    this.handleGrabTarget(this.raycaster.getCurrentHovered());
  }

  private handleGrabTarget(target: THREE.Object3D | null): void {
    // If dialogue is showing and the user clicks/taps anywhere that is NOT an NPC,
    // close the dialogue to avoid trapping them in a long message.
    const clickedNPC = target ? this.world.getNPC(target) : undefined;
    if (this.speechBubble.isShowing() && !clickedNPC) {
      if (this.lastInteractedNPC) {
        this.world.npcSystem.resetDialogue(this.lastInteractedNPC);
      }
      this.speechBubble.hide();
      this.lastInteractedNPC = null;
      return;
    }

    if (this.grabSystem.isGrabbing()) {
      // Release currently grabbed object
      this.grabSystem.release();
      this.ui.setCrosshairActive(false);
      return;
    }

    if (target) {
      // Check if it's an NPC first
      const npc = clickedNPC;
      if (npc) {
        // Interact with NPC
        this.lastInteractedNPC = npc;
        this.world.npcSystem.interact(npc);
        return;
      }

      // Otherwise, try to grab it
      const grabbable = this.world.getInteractiveObject(target);
      if (grabbable) {
        this.grabSystem.grab(grabbable);
        this.ui.setCrosshairActive(true);
      }
    }
  }

  private async animate(): Promise<void> {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    // Update time
    this.time.update();
    const delta = this.time.delta;

    // While pause menu is visible, keep rendering (nice backdrop), but stop gameplay systems.
    if (this.ui.isPauseMenuVisible()) {
      this.ui.setFPS(this.time.fps);
      await this.renderer.renderAsync(this.scene.scene, this.camera.camera);
      return;
    }

    // Update systems
    // Apply input before stepping physics, then sync camera from physics afterwards.
    this.player.prePhysics(delta);
    this.physics.update(delta);
    this.player.postPhysics();

    this.raycaster.update();
    this.grabSystem.update(delta);
    this.world.update(delta);

    // Update performance monitor
    this.performanceMonitor.update(this.time.fps);

    // Update UI
    this.ui.setFPS(this.time.fps);

    // Update crosshair based on hover
    const isHovering = this.raycaster.getCurrentHovered() !== null;
    if (!this.grabSystem.isGrabbing()) {
      this.ui.setCrosshairActive(isHovering);
    }

    // Render (async for WebGPU optimization)
    await this.renderer.renderAsync(this.scene.scene, this.camera.camera);
  }

  private activeControlsTarget(): Controls {
    return this.controlMode === "desktop"
      ? this.desktopControls
      : this.touchControls;
  }

  private setControlMode(mode: "desktop" | "touch"): void {
    if (this.controlMode === mode) return;
    this.controlMode = mode;
    this.touchControls.setActive(mode === "touch" && this.isRunning);
    this.ui.setMode(mode === "touch" ? "Touch" : "Mouse");
  }

  private setAppState(state: AppState): void {
    this.appState = state;
  }

  private enterCaricatureMode(): void {
    this.setAppState(AppState.CARICATURE_UI);

    // Exit pointer lock to allow mouse interaction with UI
    if (this.controlMode === "desktop") {
      this.desktopControls.exitPointerLock();
    }

    // Hide pause menu if it's showing
    this.ui.hidePauseMenu();
  }

  private exitCaricatureMode(): void {
    this.setAppState(AppState.PLAYING);

    // Re-request pointer lock for desktop users immediately
    // (must happen within user activation window — no setTimeout)
    if (this.controlMode === "desktop" && this.isRunning) {
      this.desktopControls.requestPointerLock();
    }
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
