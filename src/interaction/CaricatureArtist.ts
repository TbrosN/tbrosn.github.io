import { ImageOverlay } from '../ui/ImageOverlay';

export class CaricatureArtist {
  private overlay: ImageOverlay;
  private isGenerating: boolean = false;
  private onStart?: () => void;
  private onEnd?: () => void;

  constructor() {
    this.overlay = new ImageOverlay();
  }

  setCallbacks(onStart: () => void, onEnd: () => void): void {
    this.onStart = onStart;
    this.onEnd = onEnd;
    
    // Pass the end callback to the overlay so it can notify when it closes
    this.overlay.setOnCloseCallback(() => {
      if (this.onEnd) this.onEnd();
    });
  }

  async generateCaricature() {
    if (this.isGenerating) return;
    
    // Notify that we're entering caricature mode
    if (this.onStart) this.onStart();
    
    this.overlay.showOptions(
        () => this.startCameraFlow(),
        () => this.startUploadFlow(),
        () => this.generateWithPrompt(null)
    );
  }

  private startCameraFlow() {
      this.overlay.showCamera((blob) => {
          this.blobToBase64(blob).then(base64 => {
              this.generateWithPrompt(base64);
          });
      });
  }

  private startUploadFlow() {
      this.overlay.triggerFileUpload((file) => {
          this.blobToBase64(file).then(base64 => {
              this.generateWithPrompt(base64);
          });
      });
  }

  private blobToBase64(blob: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  }

  private async generateWithPrompt(inputImage: string | null) {
      this.isGenerating = true;
      this.overlay.showLoading();

      try {
          const prompt = "caricature drawn with a black sharpie marker on a white paper";
          console.log("🎨 Requesting caricature from Puter.js...");
          
          const options = inputImage ? { input_image: inputImage } : undefined;
          const image = await puter.ai.txt2img(prompt, options);

          const imageUrl = image.src || URL.createObjectURL(image);
          this.overlay.showImage(imageUrl);
          console.log("✅ Caricature generated!");

      } catch (error) {
          console.error("❌ Failed to generate caricature:", error);
          this.overlay.hide();
          alert("Oh no! My easel fell over. (Failed to generate image)");
      } finally {
          this.isGenerating = false;
      }
  }
}
