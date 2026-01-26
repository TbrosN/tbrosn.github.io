import gsap from 'gsap';

/**
 * Speech bubble UI component for NPC dialogue
 */
export class SpeechBubble {
  private container: HTMLElement;
  private bubble: HTMLElement;
  private nameLabel: HTMLElement;
  private messageText: HTMLElement;
  private isVisible: boolean = false;
  private hideTimeout?: number;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'speech-bubble-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create bubble
    this.bubble = document.createElement('div');
    this.bubble.style.cssText = `
      background: rgba(20, 20, 40, 0.95);
      border: 2px solid #00d4ff;
      border-radius: 20px;
      padding: 20px 30px;
      max-width: 500px;
      min-width: 300px;
      box-shadow: 0 10px 40px rgba(0, 212, 255, 0.3);
      position: relative;
      backdrop-filter: blur(10px);
    `;

    // Create name label
    this.nameLabel = document.createElement('div');
    this.nameLabel.style.cssText = `
      color: #00d4ff;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    // Create message text
    this.messageText = document.createElement('div');
    this.messageText.style.cssText = `
      color: #ffffff;
      font-size: 16px;
      line-height: 1.5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create tail (pointer)
    const tail = document.createElement('div');
    tail.style.cssText = `
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-top: 12px solid #00d4ff;
    `;

    // Create tail inner (for the filled part)
    const tailInner = document.createElement('div');
    tailInner.style.cssText = `
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid rgba(20, 20, 40, 0.95);
    `;

    // Assemble the bubble
    this.bubble.appendChild(this.nameLabel);
    this.bubble.appendChild(this.messageText);
    this.bubble.appendChild(tail);
    tail.appendChild(tailInner);
    this.container.appendChild(this.bubble);

    // Add to DOM
    document.body.appendChild(this.container);
  }

  show(name: string, message: string, duration: number = 5000): void {
    this.nameLabel.textContent = name;
    this.messageText.textContent = message;

    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Show with animation
    if (!this.isVisible) {
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
      
      // Bounce in animation
      gsap.fromTo(
        this.bubble,
        { scale: 0.8, y: 20 },
        { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      );
      
      this.isVisible = true;
    } else {
      // Just pulse if already visible
      gsap.to(this.bubble, {
        scale: 1.05,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      });
    }

    // Auto-hide after duration
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide(): void {
    if (!this.isVisible) return;

    gsap.to(this.bubble, {
      scale: 0.8,
      y: 20,
      duration: 0.3,
      ease: 'back.in(1.7)',
      onComplete: () => {
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
        this.isVisible = false;
      },
    });
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.container.remove();
  }
}
