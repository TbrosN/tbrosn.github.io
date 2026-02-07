export class ImageOverlay {
  private container: HTMLDivElement;
  private imageElement: HTMLImageElement;
  private actionBar: HTMLDivElement;
  private loadingText: HTMLParagraphElement;

  // Bottom sheet for options
  private bottomSheet: HTMLDivElement;
  private bottomSheetContent: HTMLDivElement;

  // Camera view
  private cameraContainer: HTMLDivElement;
  private videoElement: HTMLVideoElement;
  private captureButton: HTMLButtonElement;
  private fileInput: HTMLInputElement;

  // Camera preview / review
  private previewImage: HTMLImageElement;
  private reviewBar: HTMLDivElement;
  private capturedBlob: Blob | null = null;

  // Action buttons (TikTok-style)
  private downloadBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  private onKeyDown: (e: KeyboardEvent) => void;
  private stream: MediaStream | null = null;
  private onCloseCallback?: () => void;
  private touchStartY: number = 0;
  private touchEndY: number = 0;

  constructor() {
    // Main container - fullscreen overlay with carnival backdrop
    this.container = document.createElement("div");
    this.container.id = "caricature-overlay";
    Object.assign(this.container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "radial-gradient(circle at center, #5D4037 0%, #291b18 100%)",
      display: "none",
      zIndex: "1000",
      opacity: "0",
      transition: "opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      pointerEvents: "none",
      overflow: "hidden",
    });

    // Loading spinner with carnival design
    this.loadingText = document.createElement("div");
    this.loadingText.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 64px;
          height: 64px;
          border: 6px solid rgba(255, 215, 0, 0.2);
          border-top-color: #FFD700;
          border-right-color: #FFA000;
          border-radius: 50%;
          animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          margin: 0 auto 24px;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
        "></div>
        <p style="
          color: #FFD700;
          font-size: 24px;
          font-family: 'Rye', serif;
          font-weight: 400;
          margin: 0;
          letter-spacing: 1px;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
        ">Painting your portrait...</p>
      </div>
    `;
    Object.assign(this.loadingText.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      display: "none",
      zIndex: "10",
    });

    // Add keyframe animations
    if (!document.getElementById("overlay-animations")) {
      const style = document.createElement("style");
      style.id = "overlay-animations";
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92) rotate(-2deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Image container with vintage photo frame styling
    this.imageElement = document.createElement("img");
    Object.assign(this.imageElement.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "92vw",
      maxHeight: "85vh",
      objectFit: "contain",
      borderRadius: "4px",
      display: "none",
      userSelect: "none",
      animation: "fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
      border: "12px solid #FFF8E1",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.1) inset",
      backgroundColor: "#FFF8E1",
    });

    // Bottom sheet (legacy structure, kept but hidden/repurposed if needed)
    this.bottomSheet = document.createElement("div");
    // ... skipping complex bottom sheet styling as it seems unused in favor of direct camera flow ...
    
    this.bottomSheetContent = document.createElement("div");
    this.bottomSheet.appendChild(this.bottomSheetContent);

    // Camera view (fullscreen)
    this.cameraContainer = document.createElement("div");
    Object.assign(this.cameraContainer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "none",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
    });

    this.videoElement = document.createElement("video");
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    Object.assign(this.videoElement.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scaleX(-1)",
      // Add a vintage filter to the camera feed if possible (sepia/contrast)
      filter: "sepia(0.2) contrast(1.1)", 
    });

    // Capture button with ornate gold design
    this.captureButton = document.createElement("button");
    this.captureButton.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #FFF8E1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5D4037;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
        border: 2px solid #8D6E63;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      </div>
    `;
    Object.assign(this.captureButton.style, {
      position: "absolute",
      bottom: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "84px",
      height: "84px",
      borderRadius: "50%",
      border: "6px solid #FFD700",
      backgroundColor: "#B71C1C", // Dark red ring
      padding: "4px",
      cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      zIndex: "30",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 0px #8B0000",
    });
    this.captureButton.addEventListener("mousedown", () => {
      this.captureButton.style.transform = "translateX(-50%) scale(0.95) translateY(4px)";
      this.captureButton.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.5), 0 0px 0px #8B0000";
    });
    this.captureButton.addEventListener("mouseup", () => {
      this.captureButton.style.transform = "translateX(-50%) scale(1) translateY(0)";
      this.captureButton.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 0px #8B0000";
    });

    // Preview image
    this.previewImage = document.createElement("img");
    Object.assign(this.previewImage.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "none",
      filter: "sepia(0.2) contrast(1.1)",
    });

    // Review bar with wood texture
    this.reviewBar = document.createElement("div");
    Object.assign(this.reviewBar.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      display: "none",
      padding: "24px 24px 44px",
      gap: "20px",
      justifyContent: "center",
      background: "#3E2723",
      borderTop: "4px solid #FFD700",
      zIndex: "30",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
    });

    this.cameraContainer.appendChild(this.videoElement);
    this.cameraContainer.appendChild(this.previewImage);
    this.cameraContainer.appendChild(this.captureButton);
    this.cameraContainer.appendChild(this.reviewBar);

    // File input (hidden)
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.style.display = "none";

    // Action bar
    this.actionBar = document.createElement("div");
    Object.assign(this.actionBar.style, {
      position: "absolute",
      right: "24px",
      bottom: "120px",
      display: "none",
      flexDirection: "column",
      gap: "20px",
      zIndex: "30",
    });

    // Download button
    this.downloadBtn = this.createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      "Download",
    );
    this.downloadBtn.addEventListener("click", () => this.downloadImage());

    // Close button
    this.closeBtn = this.createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      "Close",
    );
    this.closeBtn.addEventListener("click", () => this.hide());

    this.actionBar.appendChild(this.downloadBtn);
    this.actionBar.appendChild(this.closeBtn);

    // Append everything
    this.container.appendChild(this.loadingText);
    this.container.appendChild(this.imageElement);
    this.container.appendChild(this.bottomSheet);
    this.container.appendChild(this.cameraContainer);
    this.container.appendChild(this.actionBar);
    this.container.appendChild(this.fileInput);
    document.body.appendChild(this.container);

    // Add swipe to dismiss
    this.setupSwipeGestures();

    this.onKeyDown = (e: KeyboardEvent) => {
      if (this.container.style.display === "block") {
        if (e.key === "Escape") {
          this.hide();
        } else if (
          e.key.toLowerCase() === "s" &&
          this.imageElement.style.display === "block"
        ) {
          this.downloadImage();
        }
      }
    };
  }

  private createActionButton(
    iconSvg: string,
    label: string,
  ): HTMLButtonElement {
    const container = document.createElement("button");
    container.title = label;
    container.setAttribute("aria-label", label);
    Object.assign(container.style, {
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      border: "3px solid #5D4037",
      background: "#FFF8E1",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#5D4037", // Wood color for icons
      transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      boxShadow:
        "0 4px 0px #3E2723, 0 8px 16px rgba(0,0,0,0.3)", // 3D button effect
      position: "relative",
    });

    container.innerHTML = iconSvg;

    // Hover effect
    container.addEventListener("mouseenter", () => {
      container.style.transform = "translateY(-2px)";
      container.style.boxShadow = "0 6px 0px #3E2723, 0 10px 20px rgba(0,0,0,0.3)";
    });
    container.addEventListener("mouseleave", () => {
      container.style.transform = "translateY(0)";
      container.style.boxShadow = "0 4px 0px #3E2723, 0 8px 16px rgba(0,0,0,0.3)";
    });

    // Touch/Click feedback
    container.addEventListener("mousedown", () => {
      container.style.transform = "translateY(4px)";
      container.style.boxShadow = "0 0px 0px #3E2723, 0 2px 4px rgba(0,0,0,0.3)";
    });
    container.addEventListener("mouseup", () => {
      container.style.transform = "translateY(0)";
      container.style.boxShadow = "0 4px 0px #3E2723, 0 8px 16px rgba(0,0,0,0.3)";
    });

    return container;
  }

  /* Removed createOptionButton as we no longer have an options menu */

  private setupSwipeGestures(): void {
    this.container.addEventListener("touchstart", (e) => {
      this.touchStartY = e.touches[0].clientY;
    });

    this.container.addEventListener("touchend", (e) => {
      this.touchEndY = e.changedTouches[0].clientY;
      this.handleSwipe();
    });
  }

  private handleSwipe(): void {
    const swipeDistance = this.touchStartY - this.touchEndY;
    const threshold = 50;

    // Swipe down to close
    if (
      swipeDistance < -threshold &&
      this.imageElement.style.display === "block"
    ) {
      this.hide();
    }
  }

  private downloadImage(): void {
    if (!this.imageElement.src) return;
    const link = document.createElement("a");
    link.href = this.imageElement.src;
    link.download = `caricature-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Visual feedback
    const originalBg = this.downloadBtn.style.background;
    this.downloadBtn.style.background = "#A5D6A7"; // Light green
    setTimeout(() => {
      this.downloadBtn.style.background = originalBg;
    }, 300);
  }

  // Public Methods

  setOnCloseCallback(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  // showOptions removed as we go straight to camera

  async showCamera(
    onCapture: (blob: Blob) => void,
    onError?: () => void,
  ): Promise<void> {
    this.resetView();
    this.container.style.display = "block";
    this.cameraContainer.style.display = "flex";
    this.container.style.pointerEvents = "auto"; // Re-enable pointer events

    try {
      // Request camera with optimal settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      this.videoElement.srcObject = this.stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      // If we have an error callback, use it (to trigger NPC dialogue)
      if (onError) {
        onError();
      } else {
        // Fallback to internal error message if no callback
        this.showErrorMessage(
          "Camera access denied. Please check your permissions.",
        );
      }
      this.hide();
      return;
    }

    // Capture button handler — shows preview for review
    this.captureButton.onclick = () => {
      const canvas = document.createElement("canvas");
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Mirror the image for selfie mode
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.videoElement, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            this.capturedBlob = blob;
            this.showCameraPreview(
              canvas.toDataURL("image/jpeg", 0.95),
              onCapture,
            );
          }
        },
        "image/jpeg",
        0.95,
      );
    };

    this.showContainer();
  }

  private showCameraPreview(
    dataUrl: string,
    onCapture: (blob: Blob) => void,
  ): void {
    // Hide live feed and capture button, show preview
    this.videoElement.style.display = "none";
    this.captureButton.style.display = "none";
    this.previewImage.src = dataUrl;
    this.previewImage.style.display = "block";

    // Build review bar buttons
    this.reviewBar.innerHTML = "";

    const btnRetake = document.createElement("button");
    btnRetake.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      <span>Retake</span>
    `;
    Object.assign(btnRetake.style, {
      flex: "1",
      maxWidth: "165px",
      padding: "12px 20px",
      fontSize: "18px",
      fontFamily: "'Rye', serif",
      letterSpacing: "0.5px",
      borderRadius: "8px",
      border: "2px solid #5D4037",
      background: "#FFF8E1",
      color: "#5D4037",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 0 #3E2723",
      transform: "translateY(0)",
    });

    const btnConfirm = document.createElement("button");
    btnConfirm.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span>Confirm</span>
    `;
    Object.assign(btnConfirm.style, {
      flex: "1",
      maxWidth: "165px",
      padding: "12px 20px",
      fontSize: "18px",
      fontFamily: "'Rye', serif",
      letterSpacing: "0.5px",
      borderRadius: "8px",
      border: "2px solid #1B5E20",
      background: "#4CAF50",
      color: "#FFF",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 0 #1B5E20",
      transform: "translateY(0)",
      textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
    });

    // Hover/Press effects
    [btnRetake, btnConfirm].forEach(btn => {
      const originalShadow = btn.style.boxShadow;
      btn.addEventListener("mousedown", () => {
        btn.style.transform = "translateY(4px)";
        btn.style.boxShadow = "none";
      });
      btn.addEventListener("mouseup", () => {
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = originalShadow;
      });
    });

    // Retake — go back to live camera
    btnRetake.onclick = () => {
      this.previewImage.style.display = "none";
      this.reviewBar.style.display = "none";
      this.capturedBlob = null;
      this.videoElement.style.display = "block";
      this.captureButton.style.display = "block";
    };

    // Confirm — pass captured photo along
    btnConfirm.onclick = () => {
      if (this.capturedBlob) {
        const blob = this.capturedBlob;
        this.capturedBlob = null;
        this.stopCamera();
        onCapture(blob);
      }
    };

    this.reviewBar.appendChild(btnRetake);
    this.reviewBar.appendChild(btnConfirm);
    this.reviewBar.style.display = "flex";
  }

  private showErrorMessage(message: string): void {
    const errorDiv = document.createElement("div");
    Object.assign(errorDiv.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%) scale(0.92)",
      background: "#B71C1C",
      color: "#FFF",
      padding: "20px 30px",
      borderRadius: "12px",
      border: "4px solid #5D4037",
      fontFamily: "'Roboto Slab', serif",
      fontSize: "16px",
      fontWeight: "500",
      zIndex: "2000",
      maxWidth: "80vw",
      textAlign: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      opacity: "0",
      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    });
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Animate in
    requestAnimationFrame(() => {
      errorDiv.style.opacity = "1";
      errorDiv.style.transform = "translate(-50%, -50%) scale(1)";
    });

    setTimeout(() => {
      errorDiv.style.opacity = "0";
      errorDiv.style.transform = "translate(-50%, -50%) scale(0.92)";
      setTimeout(() => document.body.removeChild(errorDiv), 300);
    }, 3000);
  }

  triggerFileUpload(onFileSelected: (file: File) => void): void {
    this.fileInput.onchange = () => {
      if (this.fileInput.files && this.fileInput.files[0]) {
        onFileSelected(this.fileInput.files[0]);
      }
    };
    this.fileInput.click();
  }

  showLoading(): void {
    this.resetView();
    this.container.style.display = "block";
    this.loadingText.style.display = "block";
    this.showContainer();
  }

  showImage(src: string): void {
    this.resetView();
    this.container.style.display = "block";
    this.imageElement.src = src;
    this.imageElement.style.display = "block";
    this.actionBar.style.display = "flex";
    this.showContainer();
  }

  hide(): void {
    this.stopCamera();
    window.removeEventListener("keydown", this.onKeyDown);

    // Animate bottom sheet down if visible
    if (this.bottomSheet.style.display === "block") {
      this.bottomSheet.style.transform = "translateY(100%)";
    }

    this.container.style.opacity = "0";
    this.container.style.pointerEvents = "none";

    // Notify immediately so pointer lock can be reacquired
    // while user activation is still valid (setTimeout breaks it)
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }

    setTimeout(() => {
      this.container.style.display = "none";
      this.resetView();
    }, 400);
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
  }

  private resetView(): void {
    this.loadingText.style.display = "none";
    this.imageElement.style.display = "none";
    this.bottomSheet.style.display = "none";
    this.bottomSheet.style.transform = "translateY(100%)";
    this.cameraContainer.style.display = "none";
    this.actionBar.style.display = "none";

    // Reset camera preview state
    this.previewImage.style.display = "none";
    this.reviewBar.style.display = "none";
    this.videoElement.style.display = "block";
    this.captureButton.style.display = "block";
    this.capturedBlob = null;
  }

  private showContainer(): void {
    this.container.style.display = "block";
    this.container.style.pointerEvents = "auto";
    window.addEventListener("keydown", this.onKeyDown);

    // Small delay to allow display to apply before opacity transition
    requestAnimationFrame(() => {
      this.container.style.opacity = "1";
    });
  }
}
