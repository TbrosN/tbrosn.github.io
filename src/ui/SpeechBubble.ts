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
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4));
    `;

    // Create bubble
    this.bubble = document.createElement('div');
    this.bubble.style.cssText = `
      background: #FFF8E1;
      border: 4px solid #8B0000;
      border-radius: 12px;
      padding: 24px 32px;
      max-width: 500px;
      min-width: 320px;
      position: relative;
      box-shadow: inset 0 0 20px rgba(139, 0, 0, 0.05);
    `;
    
    // Add decorative corner elements (via pseudo-elements normally, but here via JS inline is hard, so we just use simple borders for now)
    // We can add a "stripe" pattern to the top border if we want, but solid red is strong and reads "Carnival".

    // Create name label
    this.nameLabel = document.createElement('div');
    this.nameLabel.style.cssText = `
      color: #8B0000;
      font-size: 18px;
      font-family: 'Rye', serif;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
      border-bottom: 2px solid rgba(139, 0, 0, 0.1);
      padding-bottom: 8px;
      display: inline-block;
    `;

    // Create message text
    this.messageText = document.createElement('div');
    this.messageText.style.cssText = `
      color: #3E2723;
      font-size: 17px;
      line-height: 1.6;
      font-family: 'Roboto Slab', serif;
      font-weight: 500;
    `;

    // Create tail (pointer)
    const tail = document.createElement('div');
    tail.style.cssText = `
      position: absolute;
      bottom: -16px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 16px solid transparent;
      border-right: 16px solid transparent;
      border-top: 16px solid #8B0000;
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
      border-top: 10px solid #FFF8E1;
      z-index: 2;
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
