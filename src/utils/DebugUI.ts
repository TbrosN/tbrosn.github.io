import { GUI } from 'lil-gui';
import { DEBUG } from '../constants';

/**
 * Singleton debug UI for displaying runtime values
 * Non-interactive - use keyboard shortcuts to adjust values
 */
class DebugUI {
  private static instance?: GUI;

  static getGUI(): GUI | undefined {
    if (!DEBUG) return undefined;
    
    if (!DebugUI.instance) {
      DebugUI.instance = new GUI({ title: 'Debug (Read-only)' });
    }
    
    return DebugUI.instance;
  }

  static destroy(): void {
    if (DebugUI.instance) {
      DebugUI.instance.destroy();
      DebugUI.instance = undefined;
    }
  }
}

export default DebugUI;
