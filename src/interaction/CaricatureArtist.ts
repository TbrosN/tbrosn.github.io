import { ImageOverlay } from "../ui/ImageOverlay";
import { CARICATURE_SYSTEM_PROMPT } from "./prompts";

export enum CaricatureState {
  IDLE = "IDLE",
  WAITING_FOR_INPUT = "WAITING_FOR_INPUT",
  GENERATING = "GENERATING",
  READY = "READY",
  VIEWING = "VIEWING",
}

export class CaricatureArtist {
  private overlay: ImageOverlay;
  private state: CaricatureState = CaricatureState.IDLE;
  private generatedImageUrl: string | null = null;
  private onGenerationStarted?: () => void;
  private onGenerationCompleted?: () => void;
  private onUIOpened?: () => void;
  private onUIClosed?: () => void;

  constructor() {
    this.overlay = new ImageOverlay();

    // When overlay closes, exit viewing mode
    this.overlay.setOnCloseCallback(() => {
      if (this.state === CaricatureState.VIEWING) {
        this.state = CaricatureState.READY; // Image still available to view again
      }

      // Only trigger UI closed callback if we're not about to start generating
      // (because beginGeneration will handle the state transition)
      if (this.state !== CaricatureState.GENERATING) {
        if (this.onUIClosed) {
          this.onUIClosed();
        }
      }
    });
  }

  setCallbacks(
    onGenerationStarted: () => void,
    onGenerationCompleted: () => void,
    onUIOpened: () => void,
    onUIClosed: () => void,
  ): void {
    this.onGenerationStarted = onGenerationStarted;
    this.onGenerationCompleted = onGenerationCompleted;
    this.onUIOpened = onUIOpened;
    this.onUIClosed = onUIClosed;
  }

  getState(): CaricatureState {
    return this.state;
  }

  isReady(): boolean {
    return this.state === CaricatureState.READY;
  }

  isGenerating(): boolean {
    return this.state === CaricatureState.GENERATING;
  }

  canStartNewGeneration(): boolean {
    return (
      this.state === CaricatureState.IDLE ||
      this.state === CaricatureState.READY
    );
  }

  // Start the caricature process - show input options
  startCaricatureProcess() {
    if (this.state === CaricatureState.GENERATING) {
      return;
    }

    this.state = CaricatureState.WAITING_FOR_INPUT;

    // Notify that we're entering UI mode
    if (this.onUIOpened) {
      this.onUIOpened();
    }

    this.overlay.showOptions(
      () => this.startCameraFlow(),
      () => this.startUploadFlow(),
      () => this.beginGeneration(null),
    );
  }

  // Show the generated caricature
  viewCaricature() {
    if (this.state !== CaricatureState.READY || !this.generatedImageUrl) {
      console.warn("⚠️ No caricature ready to view");
      return;
    }

    this.state = CaricatureState.VIEWING;

    // Notify that we're entering UI mode
    if (this.onUIOpened) this.onUIOpened();

    this.overlay.showImage(this.generatedImageUrl);
  }

  private startCameraFlow() {
    this.overlay.showCamera((blob) => {
      this.blobToBase64(blob)
        .then((base64) => this.downscaleImage(base64))
        .then((resizedBase64) => {
          this.beginGeneration(resizedBase64);
        })
        .catch((err) => {
          console.error("❌ Failed to process camera image:", err);
          alert("Failed to process the photo. Please try again.");
        });
    });
  }

  private startUploadFlow() {
    this.overlay.triggerFileUpload((file) => {
      this.blobToBase64(file)
        .then((base64) => this.downscaleImage(base64))
        .then((resizedBase64) => {
          this.beginGeneration(resizedBase64);
        })
        .catch((err) => {
          console.error("❌ Failed to process uploaded image:", err);
          alert("Failed to process the photo. Please try again.");
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

  private async downscaleImage(
    base64Image: string,
    maxSize: number = 512,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to base64
        const resizedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        resolve(resizedBase64);
      };

      img.onerror = () =>
        reject(new Error("Failed to load image for resizing"));
      img.src = base64Image;
    });
  }

  // Start generation in the background (non-blocking)
  private async beginGeneration(inputImage: string | null) {
    this.state = CaricatureState.GENERATING;

    // Hide the UI immediately so user can walk around
    this.overlay.hide();

    // Notify that generation has started
    if (this.onGenerationStarted) {
      this.onGenerationStarted();
    }

    try {
      // Build options with Gemini model for image-to-image support
      const options: {
        model: string;
        input_image?: string;
        input_image_mime_type?: string;
      } = {
        model: "gemini-2.5-flash-image-preview",
      };

      // If we have an input image, extract base64 and MIME type from data URL
      if (inputImage) {
        const { base64, mimeType } = this.parseDataUrl(inputImage);
        options.input_image = base64;
        options.input_image_mime_type = mimeType;
      }

      const image = await puter.ai.txt2img(CARICATURE_SYSTEM_PROMPT, options);

      const imageUrl = image.src || URL.createObjectURL(image);
      this.generatedImageUrl = imageUrl;
      this.state = CaricatureState.READY;

      // Notify that generation is complete
      if (this.onGenerationCompleted) {
        this.onGenerationCompleted();
      } else {
        console.warn("⚠️ onGenerationCompleted callback not set!");
      }
    } catch (error) {
      console.error("❌ Failed to generate caricature:", error);
      this.state = CaricatureState.IDLE;
      alert("Oh no! My easel fell over. (Failed to generate image)");
    }
  }

  // Parse a data URL into its base64 content and MIME type
  private parseDataUrl(dataUrl: string): { base64: string; mimeType: string } {
    // Data URL format: data:image/jpeg;base64,iVBORw0K...
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return {
        mimeType: matches[1],
        base64: matches[2],
      };
    }
    // Fallback: assume it's already raw base64 with jpeg type
    console.warn("⚠️ Could not parse data URL, assuming raw base64 JPEG");
    return {
      mimeType: "image/jpeg",
      base64: dataUrl,
    };
  }
}
