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
  private shareBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  private onKeyDown: (e: KeyboardEvent) => void;
  private stream: MediaStream | null = null;
  private onCloseCallback?: () => void;
  private touchStartY: number = 0;
  private touchEndY: number = 0;

  constructor() {
    // Main container - fullscreen overlay with premium backdrop
    this.container = document.createElement("div");
    this.container.id = "caricature-overlay";
    Object.assign(this.container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
      display: "none",
      zIndex: "1000",
      opacity: "0",
      transition: "opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      pointerEvents: "none",
      overflow: "hidden",
    });

    // Loading spinner with sleek Apple-inspired design
    this.loadingText = document.createElement("div");
    this.loadingText.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 56px;
          height: 56px;
          border: 3px solid rgba(255, 255, 255, 0.08);
          border-top-color: rgba(255, 255, 255, 0.95);
          border-right-color: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.4, 0.15, 0.6, 0.85) infinite;
          margin: 0 auto 24px;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        "></div>
        <p style="
          color: rgba(255, 255, 255, 0.95);
          font-size: 17px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          font-weight: 500;
          margin: 0;
          letter-spacing: -0.3px;
        ">Creating your caricature...</p>
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

    // Add keyframe animations with Apple-style easing
    if (!document.getElementById("overlay-animations")) {
      const style = document.createElement("style");
      style.id = "overlay-animations";
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `;
      document.head.appendChild(style);
    }

    // Image container with centered display and premium styling
    this.imageElement = document.createElement("img");
    Object.assign(this.imageElement.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "92vw",
      maxHeight: "85vh",
      objectFit: "contain",
      borderRadius: "12px",
      display: "none",
      userSelect: "none",
      animation: "fadeInScale 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      boxShadow:
        "0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)",
    });

    // Bottom sheet with premium glassmorphism (iOS-style)
    this.bottomSheet = document.createElement("div");
    Object.assign(this.bottomSheet.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      background:
        "linear-gradient(to bottom, rgba(28, 28, 30, 0.94), rgba(20, 20, 22, 0.97))",
      backdropFilter: "saturate(180%) blur(40px)",
      WebkitBackdropFilter: "saturate(180%) blur(40px)",
      borderRadius: "28px 28px 0 0",
      padding: "20px 20px 40px",
      display: "none",
      transform: "translateY(100%)",
      transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      zIndex: "20",
      boxShadow:
        "0 -8px 32px rgba(0, 0, 0, 0.6), 0 -2px 8px rgba(0, 0, 0, 0.4)",
      borderTop: "0.5px solid rgba(255, 255, 255, 0.08)",
    });

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
    });

    // Capture button with TikTok-inspired ring design
    this.captureButton = document.createElement("button");
    this.captureButton.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: black;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      </div>
    `;
    Object.assign(this.captureButton.style, {
      position: "absolute",
      bottom: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "76px",
      height: "76px",
      borderRadius: "50%",
      border: "5px solid rgba(255, 255, 255, 0.95)",
      backgroundColor: "transparent",
      padding: "0",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      zIndex: "30",
      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
    });
    this.captureButton.addEventListener("mousedown", () => {
      this.captureButton.style.transform = "translateX(-50%) scale(0.88)";
      this.captureButton.style.opacity = "0.85";
    });
    this.captureButton.addEventListener("mouseup", () => {
      this.captureButton.style.transform = "translateX(-50%) scale(1)";
      this.captureButton.style.opacity = "1";
    });

    // Preview image (shown after capture for review)
    this.previewImage = document.createElement("img");
    Object.assign(this.previewImage.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "none",
    });

    // Review bar with refined gradient (iOS-style)
    this.reviewBar = document.createElement("div");
    Object.assign(this.reviewBar.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      display: "none",
      padding: "24px 24px 44px",
      gap: "14px",
      justifyContent: "center",
      background:
        "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 30%, rgba(0, 0, 0, 0.8) 100%)",
      zIndex: "30",
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

    // Action bar (TikTok-style right side buttons)
    this.actionBar = document.createElement("div");
    Object.assign(this.actionBar.style, {
      position: "absolute",
      right: "20px",
      bottom: "120px",
      display: "none",
      flexDirection: "column",
      gap: "18px",
      zIndex: "30",
    });

    // Download button
    this.downloadBtn = this.createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      "Download",
    );
    this.downloadBtn.addEventListener("click", () => this.downloadImage());

    // Share button
    this.shareBtn = this.createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
      "Share",
    );
    this.shareBtn.addEventListener("click", () => this.shareImage());

    // Close button
    this.closeBtn = this.createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      "Close",
    );
    this.closeBtn.addEventListener("click", () => this.hide());

    this.actionBar.appendChild(this.downloadBtn);
    this.actionBar.appendChild(this.shareBtn);
    this.actionBar.appendChild(this.closeBtn);

    // Append everything to container
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
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      border: "0.5px solid rgba(255, 255, 255, 0.15)",
      background:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.12))",
      backdropFilter: "saturate(180%) blur(20px)",
      WebkitBackdropFilter: "saturate(180%) blur(20px)",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white", // ensure icon inherits color
      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      boxShadow:
        "0 4px 16px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      position: "relative",
    });

    container.innerHTML = iconSvg;

    // Hover effect with refined transitions
    container.addEventListener("mouseenter", () => {
      container.style.background =
        "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.18))";
      container.style.transform = "scale(1.08) translateY(-2px)";
      container.style.boxShadow =
        "0 6px 20px rgba(0, 0, 0, 0.4), 0 3px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
    });
    container.addEventListener("mouseleave", () => {
      container.style.background =
        "linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.12))";
      container.style.transform = "scale(1)";
      container.style.boxShadow =
        "0 4px 16px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
    });

    // Touch feedback with spring-like animation
    container.addEventListener("touchstart", () => {
      container.style.transform = "scale(0.92)";
      container.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.6, 1)";
    });
    container.addEventListener("touchend", () => {
      container.style.transform = "scale(1)";
      container.style.transition =
        "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
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
    this.downloadBtn.style.backgroundColor = "rgba(46, 213, 115, 0.4)";
    setTimeout(() => {
      this.downloadBtn.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
    }, 300);
  }

  private async shareImage(): Promise<void> {
    if (!this.imageElement.src) return;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        // Convert image to blob
        const response = await fetch(this.imageElement.src);
        const blob = await response.blob();
        const file = new File([blob], `caricature-${Date.now()}.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: "My Caricature",
          text: "Check out my caricature!",
          files: [file],
        });

        // Visual feedback
        this.shareBtn.style.backgroundColor = "rgba(52, 152, 219, 0.4)";
        setTimeout(() => {
          this.shareBtn.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        }, 300);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.log("Share failed:", err);
          this.fallbackShare();
        }
      }
    } else {
      this.fallbackShare();
    }
  }

  private fallbackShare(): void {
    // Fallback: copy image URL to clipboard
    if (navigator.clipboard && this.imageElement.src) {
      navigator.clipboard
        .writeText(this.imageElement.src)
        .then(() => {
          alert("Image link copied to clipboard!");
        })
        .catch(() => {
          alert("Unable to share. You can save the image instead.");
        });
    } else {
      alert(
        "Sharing not supported on this device. You can save the image instead.",
      );
    }
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
      padding: "15px 26px",
      fontSize: "17px",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      fontWeight: "600",
      letterSpacing: "-0.2px",
      borderRadius: "14px",
      border: "0.5px solid rgba(255, 255, 255, 0.2)",
      background:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1))",
      backdropFilter: "saturate(180%) blur(20px)",
      WebkitBackdropFilter: "saturate(180%) blur(20px)",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      boxShadow:
        "0 4px 14px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    });

    const btnConfirm = document.createElement("button");
    btnConfirm.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span>Confirm</span>
    `;
    Object.assign(btnConfirm.style, {
      flex: "1",
      maxWidth: "165px",
      padding: "15px 26px",
      fontSize: "17px",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      fontWeight: "600",
      letterSpacing: "-0.2px",
      borderRadius: "14px",
      border: "0.5px solid rgba(255, 255, 255, 0.15)",
      background:
        "linear-gradient(135deg, #34d399 0%, #22c55e 50%, #16a34a 100%)",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      boxShadow:
        "0 4px 14px rgba(34, 197, 94, 0.45), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
    });

    // Hover effects with refined transitions
    btnRetake.addEventListener("mouseenter", () => {
      btnRetake.style.background =
        "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))";
      btnRetake.style.transform = "translateY(-2px) scale(1.02)";
      btnRetake.style.boxShadow =
        "0 6px 18px rgba(0, 0, 0, 0.35), 0 2px 5px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
    });
    btnRetake.addEventListener("mouseleave", () => {
      btnRetake.style.background =
        "linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1))";
      btnRetake.style.transform = "translateY(0) scale(1)";
      btnRetake.style.boxShadow =
        "0 4px 14px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
    });
    btnConfirm.addEventListener("mouseenter", () => {
      btnConfirm.style.filter = "brightness(1.1)";
      btnConfirm.style.transform = "translateY(-2px) scale(1.02)";
      btnConfirm.style.boxShadow =
        "0 6px 20px rgba(34, 197, 94, 0.5), 0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25)";
    });
    btnConfirm.addEventListener("mouseleave", () => {
      btnConfirm.style.filter = "brightness(1)";
      btnConfirm.style.transform = "translateY(0) scale(1)";
      btnConfirm.style.boxShadow =
        "0 4px 14px rgba(34, 197, 94, 0.45), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
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
      background:
        "linear-gradient(135deg, rgba(239, 68, 68, 0.96), rgba(220, 38, 38, 0.98))",
      backdropFilter: "saturate(180%) blur(20px)",
      WebkitBackdropFilter: "saturate(180%) blur(20px)",
      color: "white",
      padding: "18px 28px",
      borderRadius: "16px",
      border: "0.5px solid rgba(255, 255, 255, 0.15)",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      fontSize: "16px",
      fontWeight: "500",
      letterSpacing: "-0.2px",
      zIndex: "2000",
      maxWidth: "80vw",
      textAlign: "center",
      boxShadow:
        "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
