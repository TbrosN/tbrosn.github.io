import * as THREE from 'three';

export type GestureState = 'idle' | 'pinching' | 'pinched' | 'releasing';

/**
 * Detects hand gestures (pinch/release) with hysteresis
 */
export class GestureDetector {
  private currentState: GestureState = 'idle';
  private pinchThreshold: number = 0.08; // Distance threshold for pinch
  private releaseThreshold: number = 0.12; // Hysteresis
  private stateHistory: GestureState[] = [];
  private historySize: number = 3;

  update(indexTip: THREE.Vector3 | null, thumbTip: THREE.Vector3 | null): GestureState {
    if (!indexTip || !thumbTip) {
      this.currentState = 'idle';
      return this.currentState;
    }

    // Calculate distance between index and thumb
    const distance = indexTip.distanceTo(thumbTip);

    // State machine with hysteresis
    switch (this.currentState) {
      case 'idle':
        if (distance < this.pinchThreshold) {
          this.currentState = 'pinching';
        }
        break;

      case 'pinching':
        if (distance < this.pinchThreshold) {
          // Confirm pinch with history
          this.addToHistory('pinching');
          if (this.isHistoryStable('pinching')) {
            this.currentState = 'pinched';
          }
        } else {
          this.currentState = 'idle';
        }
        break;

      case 'pinched':
        if (distance > this.releaseThreshold) {
          this.currentState = 'releasing';
        }
        break;

      case 'releasing':
        if (distance > this.releaseThreshold) {
          this.addToHistory('releasing');
          if (this.isHistoryStable('releasing')) {
            this.currentState = 'idle';
          }
        } else {
          this.currentState = 'pinched';
        }
        break;
    }

    return this.currentState;
  }

  private addToHistory(state: GestureState): void {
    this.stateHistory.push(state);
    if (this.stateHistory.length > this.historySize) {
      this.stateHistory.shift();
    }
  }

  private isHistoryStable(state: GestureState): boolean {
    if (this.stateHistory.length < this.historySize) {
      return false;
    }
    return this.stateHistory.every(s => s === state);
  }

  getCurrentState(): GestureState {
    return this.currentState;
  }

  isPinching(): boolean {
    return this.currentState === 'pinched';
  }

  reset(): void {
    this.currentState = 'idle';
    this.stateHistory = [];
  }
}
