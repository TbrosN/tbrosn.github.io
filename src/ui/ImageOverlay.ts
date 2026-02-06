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
    // Main container - fullscreen overlay
    this.container = document.createElement("div");
    this.container.id = "caricature-overlay";
    Object.assign(this.container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "#000000",
      display: "none",
      zIndex: "1000",
      opacity: "0",
      transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: "none",
      overflow: "hidden",
    });

    // Loading spinner with modern design
    this.loadingText = document.createElement("div");
    this.loadingText.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 600;
          margin: 0;
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

    // Add keyframe animation for spinner
    if (!document.getElementById("overlay-animations")) {
      const style = document.createElement("style");
      style.id = "overlay-animations";
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    // Image container with centered display
    this.imageElement = document.createElement("img");
    Object.assign(this.imageElement.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "90vw",
      maxHeight: "90vh",
      objectFit: "contain",
      borderRadius: "0",
      display: "none",
      userSelect: "none",
      animation: "fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    });

    // Bottom sheet for options (TikTok-style)
    this.bottomSheet = document.createElement("div");
    Object.assign(this.bottomSheet.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      backgroundColor: "rgba(30, 30, 30, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px 24px 0 0",
      padding: "24px 20px 40px",
      display: "none",
      transform: "translateY(100%)",
      transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: "20",
      boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5)",
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

    // Capture button (floating at bottom)
    this.captureButton = document.createElement("button");
    this.captureButton.innerHTML = "📸";
    Object.assign(this.captureButton.style, {
      position: "absolute",
      bottom: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "70px",
      height: "70px",
      borderRadius: "50%",
      border: "4px solid white",
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      backdropFilter: "blur(10px)",
      fontSize: "32px",
      cursor: "pointer",
      transition: "all 0.2s",
      zIndex: "30",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    });
    this.captureButton.addEventListener("mousedown", () => {
      this.captureButton.style.transform = "translateX(-50%) scale(0.9)";
    });
    this.captureButton.addEventListener("mouseup", () => {
      this.captureButton.style.transform = "translateX(-50%) scale(1)";
    });

    // Preview image (shown after capture for review)
    this.previewImage = document.createElement("img");
    Object.assign(this.previewImage.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "none",
    });

    // Review bar (Retake / Confirm buttons)
    this.reviewBar = document.createElement("div");
    Object.assign(this.reviewBar.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      display: "none",
      padding: "20px 24px 40px",
      gap: "12px",
      justifyContent: "center",
      background:
        "linear-gradient(transparent, rgba(0, 0, 0, 0.7) 40%)",
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
      right: "16px",
      bottom: "100px",
      display: "none",
      flexDirection: "column",
      gap: "16px",
      zIndex: "30",
    });

    // Download button
    this.downloadBtn = this.createActionButton("⬇️", "Download");
    this.downloadBtn.addEventListener("click", () => this.downloadImage());

    // Share button
    this.shareBtn = this.createActionButton("🔗", "Share");
    this.shareBtn.addEventListener("click", () => this.shareImage());

    // Close button
    this.closeBtn = this.createActionButton("✕", "Close");
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

  private createActionButton(emoji: string, label: string): HTMLButtonElement {
    const container = document.createElement("button");
    container.title = label; // Add accessibility label
    container.setAttribute("aria-label", label);
    Object.assign(container.style, {
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      border: "none",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      backdropFilter: "blur(10px)",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      position: "relative",
    });

    container.innerHTML = emoji;

    // Hover effect
    container.addEventListener("mouseenter", () => {
      container.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
      container.style.transform = "scale(1.1)";
    });
    container.addEventListener("mouseleave", () => {
      container.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
      container.style.transform = "scale(1)";
    });

    // Touch feedback
    container.addEventListener("touchstart", () => {
      container.style.transform = "scale(0.95)";
    });
    container.addEventListener("touchend", () => {
      container.style.transform = "scale(1)";
    });

    return container;
  }

  private createOptionButton(
    emoji: string,
    text: string,
    color: string,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    Object.assign(btn.style, {
      width: "100%",
      padding: "18px 24px",
      fontSize: "17px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "600",
      borderRadius: "16px",
      border: "none",
      backgroundColor: color,
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      transition: "all 0.2s",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
    });

    btn.innerHTML = `<span style="font-size: 24px;">${emoji}</span><span>${text}</span>`;

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.3)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    });

    return btn;
  }

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

  showOptions(onCamera: () => void, onUpload: () => void): void {
    this.resetView();
    this.container.style.display = "block";
    this.container.style.pointerEvents = "auto";
    this.bottomSheet.style.display = "block";

    // Clear previous content
    this.bottomSheetContent.innerHTML = "";

    // Handle bar (drag indicator)
    const handleBar = document.createElement("div");
    Object.assign(handleBar.style, {
      width: "40px",
      height: "4px",
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: "2px",
      margin: "0 auto 24px",
    });
    this.bottomSheetContent.appendChild(handleBar);

    // Title
    const title = document.createElement("h2");
    title.textContent = "Create Your Caricature";
    Object.assign(title.style, {
      color: "white",
      fontSize: "24px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "700",
      marginBottom: "24px",
      textAlign: "center",
      margin: "0 0 24px 0",
    });
    this.bottomSheetContent.appendChild(title);

    // Options container
    const optionsGrid = document.createElement("div");
    Object.assign(optionsGrid.style, {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    });

    // Camera button
    const btnCamera = this.createOptionButton("📸", "Take a Photo", "#3b82f6");
    btnCamera.onclick = onCamera;

    // Upload button
    const btnUpload = this.createOptionButton("🖼️", "Upload Photo", "#8b5cf6");
    btnUpload.onclick = onUpload;

    optionsGrid.appendChild(btnCamera);
    optionsGrid.appendChild(btnUpload);

    this.bottomSheetContent.appendChild(optionsGrid);

    // Cancel button (subtle)
    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    Object.assign(btnCancel.style, {
      width: "100%",
      marginTop: "12px",
      padding: "14px",
      fontSize: "16px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "500",
      borderRadius: "12px",
      border: "none",
      backgroundColor: "transparent",
      color: "rgba(255, 255, 255, 0.6)",
      cursor: "pointer",
    });
    btnCancel.onclick = () => this.hide();
    this.bottomSheetContent.appendChild(btnCancel);

    this.showContainer();

    // Animate bottom sheet up
    requestAnimationFrame(() => {
      this.bottomSheet.style.transform = "translateY(0)";
    });
  }

  async showCamera(onCapture: (blob: Blob) => void): Promise<void> {
    this.resetView();
    this.container.style.display = "block";
    this.cameraContainer.style.display = "flex";

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
      this.showErrorMessage(
        "Camera access denied. Please check your permissions.",
      );
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
            this.showCameraPreview(canvas.toDataURL("image/jpeg", 0.95), onCapture);
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
    btnRetake.innerHTML = `<span style="font-size: 20px;">↺</span><span>Retake</span>`;
    Object.assign(btnRetake.style, {
      flex: "1",
      maxWidth: "160px",
      padding: "14px 24px",
      fontSize: "17px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "600",
      borderRadius: "16px",
      border: "2px solid rgba(255, 255, 255, 0.4)",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(10px)",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s",
    });

    const btnConfirm = document.createElement("button");
    btnConfirm.innerHTML = `<span style="font-size: 20px;">✓</span><span>Confirm</span>`;
    Object.assign(btnConfirm.style, {
      flex: "1",
      maxWidth: "160px",
      padding: "14px 24px",
      fontSize: "17px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "600",
      borderRadius: "16px",
      border: "none",
      backgroundColor: "#22c55e",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s",
      boxShadow: "0 2px 10px rgba(34, 197, 94, 0.4)",
    });

    // Hover effects
    btnRetake.addEventListener("mouseenter", () => {
      btnRetake.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
    });
    btnRetake.addEventListener("mouseleave", () => {
      btnRetake.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
    });
    btnConfirm.addEventListener("mouseenter", () => {
      btnConfirm.style.backgroundColor = "#16a34a";
    });
    btnConfirm.addEventListener("mouseleave", () => {
      btnConfirm.style.backgroundColor = "#22c55e";
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
      transform: "translate(-50%, -50%)",
      backgroundColor: "rgba(239, 68, 68, 0.95)",
      color: "white",
      padding: "16px 24px",
      borderRadius: "12px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "16px",
      fontWeight: "500",
      zIndex: "2000",
      maxWidth: "80vw",
      textAlign: "center",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    });
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.style.opacity = "0";
      errorDiv.style.transition = "opacity 0.3s";
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

    // Add tap to close instruction for mobile
    const tapHint = document.createElement("div");
    tapHint.textContent = "Swipe down to close";
    Object.assign(tapHint.style, {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: "14px",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "500",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(10px)",
      padding: "8px 16px",
      borderRadius: "20px",
      zIndex: "25",
      animation: "fadeInScale 0.4s ease-out",
    });
    this.container.appendChild(tapHint);

    // Fade out hint after 3 seconds
    setTimeout(() => {
      tapHint.style.opacity = "0";
      tapHint.style.transition = "opacity 0.5s";
      setTimeout(() => {
        if (tapHint.parentElement) {
          this.container.removeChild(tapHint);
        }
      }, 500);
    }, 3000);
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
