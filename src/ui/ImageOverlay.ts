export class ImageOverlay {
  private container: HTMLDivElement;
  private imageElement: HTMLImageElement;
  private closeButton: HTMLButtonElement;
  private loadingText: HTMLParagraphElement;
  
  // New UI Elements
  private optionsContainer: HTMLDivElement;
  private cameraContainer: HTMLDivElement;
  private videoElement: HTMLVideoElement;
  private captureButton: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  
  private onKeyDown: (e: KeyboardEvent) => void;
  private stream: MediaStream | null = null;
  private onCloseCallback?: () => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'caricature-overlay';
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'none',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000',
      opacity: '0',
      transition: 'opacity 0.3s ease-in-out',
      pointerEvents: 'none',
    });

    // --- Loading Text ---
    this.loadingText = document.createElement('p');
    this.loadingText.innerText = '🎨 Sketching your caricature...';
    Object.assign(this.loadingText.style, {
      color: 'white',
      fontSize: '24px',
      fontFamily: '"Outfit", sans-serif',
      marginBottom: '20px',
      display: 'none',
    });

    // --- Result Image ---
    this.imageElement = document.createElement('img');
    Object.assign(this.imageElement.style, {
      maxWidth: '80%',
      maxHeight: '70%',
      borderRadius: '15px',
      boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
      border: '5px solid white',
      display: 'none',
    });

    // --- Options Menu ---
    this.optionsContainer = document.createElement('div');
    Object.assign(this.optionsContainer.style, {
      display: 'none',
      flexDirection: 'column',
      gap: '15px',
      alignItems: 'center',
    });

    // --- Camera View ---
    this.cameraContainer = document.createElement('div');
    Object.assign(this.cameraContainer.style, {
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
    });
    
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    Object.assign(this.videoElement.style, {
        maxWidth: '80vw',
        maxHeight: '60vh',
        borderRadius: '10px',
        border: '2px solid white',
    });

    this.captureButton = this.createButton('Capture Photo', '#2ecc71');
    this.cameraContainer.appendChild(this.videoElement);
    this.cameraContainer.appendChild(this.captureButton);


    // --- File Input (Hidden) ---
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.display = 'none';
    this.container.appendChild(this.fileInput);


    // --- Close/Save Button ---
    this.closeButton = this.createButton('Close (ESC) | Save (S)', '#ff4757');
    this.closeButton.style.display = 'none';
    this.closeButton.addEventListener('click', () => this.hide());


    // Append everything
    this.container.appendChild(this.loadingText);
    this.container.appendChild(this.imageElement);
    this.container.appendChild(this.optionsContainer);
    this.container.appendChild(this.cameraContainer);
    this.container.appendChild(this.closeButton);
    document.body.appendChild(this.container);

    this.onKeyDown = (e: KeyboardEvent) => {
      if (this.container.style.display === 'flex') {
        if (e.key === 'Escape') {
          this.hide();
        } else if (e.key.toLowerCase() === 's' && this.imageElement.style.display === 'block') {
          this.downloadImage();
        }
      }
    };
  }

  private createButton(text: string, color: string) {
      const btn = document.createElement('button');
      btn.innerText = text;
      Object.assign(btn.style, {
        padding: '12px 24px',
        fontSize: '18px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: color,
        color: 'white',
        cursor: 'pointer',
        fontFamily: '"Outfit", sans-serif',
        fontWeight: 'bold',
        transition: 'transform 0.1s',
      });
      btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
      btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
      return btn;
  }

  private downloadImage() {
    if (!this.imageElement.src) return;
    const link = document.createElement('a');
    link.href = this.imageElement.src;
    link.download = `caricature-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Public Methods ---

  setOnCloseCallback(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  showOptions(
      onCamera: () => void,
      onUpload: () => void,
      onRandom: () => void
  ) {
      this.resetView();
      this.container.style.display = 'flex';
      this.container.style.pointerEvents = 'auto'; 
      this.optionsContainer.style.display = 'flex';
      
      this.optionsContainer.innerHTML = ''; // Clear previous listeners
      
      const title = document.createElement('h2');
      title.innerText = 'Ready for your caricature?';
      title.style.color = 'white';
      title.style.marginBottom = '10px';
      this.optionsContainer.appendChild(title);

      const btnCamera = this.createButton('📸 Take a Photo', '#3498db');
      btnCamera.onclick = onCamera;
      
      const btnUpload = this.createButton('📁 Upload a Photo', '#9b59b6');
      btnUpload.onclick = onUpload;
      
      const btnRandom = this.createButton('🎲 Surprise Me', '#f1c40f');
      btnRandom.onclick = onRandom;

      this.optionsContainer.appendChild(btnCamera);
      this.optionsContainer.appendChild(btnUpload);
      this.optionsContainer.appendChild(btnRandom);
      
      // Close button just to cancel interaction
      const btnCancel = this.createButton('Cancel', '#95a5a6');
      btnCancel.onclick = () => this.hide();
      this.optionsContainer.appendChild(btnCancel);

      this.showContainer();
  }

  async showCamera(onCapture: (blob: Blob) => void) {
      this.resetView();
      this.container.style.display = 'flex';
      this.cameraContainer.style.display = 'flex';
      
      try {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.videoElement.srcObject = this.stream;
      } catch (err) {
          console.error("Camera access denied:", err);
          alert("Could not access camera. Please check permissions.");
          this.hide();
          return;
      }

      this.captureButton.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = this.videoElement.videoWidth;
          canvas.height = this.videoElement.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(this.videoElement, 0, 0);
          canvas.toBlob((blob) => {
              if (blob) {
                  this.stopCamera();
                  onCapture(blob);
              }
          }, 'image/jpeg');
      };
      
      this.showContainer();
  }
  
  triggerFileUpload(onFileSelected: (file: File) => void) {
      this.fileInput.onchange = () => {
          if (this.fileInput.files && this.fileInput.files[0]) {
              onFileSelected(this.fileInput.files[0]);
          }
      };
      this.fileInput.click();
  }

  showLoading() {
    this.resetView();
    this.loadingText.style.display = 'block';
    this.showContainer();
  }

  showImage(src: string) {
    this.resetView();
    this.imageElement.src = src;
    this.imageElement.style.display = 'block';
    this.closeButton.style.display = 'block';
    this.showContainer();
  }

  hide() {
    this.stopCamera();
    window.removeEventListener('keydown', this.onKeyDown);
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    setTimeout(() => {
      this.container.style.display = 'none';
      this.resetView();
      
      // Notify that the overlay is closed
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    }, 300);
  }

  private stopCamera() {
      if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
      }
      this.videoElement.srcObject = null;
  }

  private resetView() {
      this.loadingText.style.display = 'none';
      this.imageElement.style.display = 'none';
      this.optionsContainer.style.display = 'none';
      this.cameraContainer.style.display = 'none';
      this.closeButton.style.display = 'none';
  }

  private showContainer() {
      this.container.style.display = 'flex';
      this.container.style.pointerEvents = 'auto';
      window.addEventListener('keydown', this.onKeyDown);
      // Small delay to allow display:flex to apply before opacity transition
      requestAnimationFrame(() => {
          this.container.style.opacity = '1';
      });
  }
}
