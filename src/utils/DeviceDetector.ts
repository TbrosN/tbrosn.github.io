/**
 * Device and capability detection
 */
export class DeviceDetector {
  static hasTouch(): boolean {
    return navigator.maxTouchPoints > 0;
  }

  static primaryPointerIsCoarse(): boolean {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  static hoverSupported(): boolean {
    return window.matchMedia('(hover: hover)').matches;
  }

  static supportsPointerLock(): boolean {
    return 'pointerLockElement' in document && 'exitPointerLock' in document;
  }

  static getDefaultControlMode(): 'touch' | 'desktop' {
    const coarse = this.primaryPointerIsCoarse();
    const touch = this.hasTouch();
    const hover = this.hoverSupported();

    if (coarse || (touch && !hover)) {
      return 'touch';
    }
    return 'desktop';
  }

  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  static isTablet(): boolean {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  }

  static hasWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  static hasCamera(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  static getGPUTier(): 'high' | 'medium' | 'low' {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'low';

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'medium';

    const renderer = (gl as WebGLRenderingContext).getParameter(
      debugInfo.UNMASKED_RENDERER_WEBGL
    );

    // Simple heuristic based on renderer string
    const rendererStr = renderer.toLowerCase();
    
    if (rendererStr.includes('nvidia') || rendererStr.includes('geforce')) {
      if (rendererStr.includes('rtx') || rendererStr.includes('gtx 1')) {
        return 'high';
      }
      return 'medium';
    }
    
    if (rendererStr.includes('amd') || rendererStr.includes('radeon')) {
      return 'medium';
    }
    
    if (rendererStr.includes('intel')) {
      if (rendererStr.includes('iris')) {
        return 'medium';
      }
      return 'low';
    }

    // Default to medium if we can't determine
    return 'medium';
  }

  static getRecommendedSettings(): {
    pixelRatio: number;
    shadowMapSize: number;
    enableHandTracking: boolean;
    antialias: boolean;
  } {
    const isMobile = this.isMobile();
    const gpuTier = this.getGPUTier();

    if (isMobile) {
      return {
        pixelRatio: 1,
        shadowMapSize: 512,
        enableHandTracking: false,
        antialias: false,
      };
    }

    switch (gpuTier) {
      case 'high':
        return {
          pixelRatio: 2,
          shadowMapSize: 2048,
          enableHandTracking: true,
          antialias: true,
        };
      case 'medium':
        return {
          pixelRatio: 1.5,
          shadowMapSize: 1024,
          enableHandTracking: true,
          antialias: true,
        };
      case 'low':
      default:
        return {
          pixelRatio: 1,
          shadowMapSize: 512,
          enableHandTracking: false,
          antialias: false,
        };
    }
  }

  static logDeviceInfo(): void {
    // Device info logging removed - re-enable for debugging if needed
  }
}
