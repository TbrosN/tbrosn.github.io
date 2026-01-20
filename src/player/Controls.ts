export type MoveAxis = { x: number; y: number };
export type LookDelta = { x: number; y: number };

export interface Controls {
  isActive(): boolean;
  getMoveAxis(): MoveAxis;
  getLookDelta(): LookDelta;
  dispose(): void;
}
