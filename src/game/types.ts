export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type LaneIndex = -1 | 0 | 1; // Left, Center, Right

export const LANE_WIDTH = 2.4;
export const LANE_POSITIONS: Record<number, number> = {
  [-1]: -LANE_WIDTH,
  [0]: 0,
  [1]: LANE_WIDTH,
};

export type ObstacleType = 'hurdle' | 'lintel' | 'chasm' | 'totem' | 'flame_trap';

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  lane: LaneIndex | 'all'; // 'all' for chasms or hurdles spanning all 3 lanes
  z: number;
  width: number;
  height: number;
  depth: number;
  passed?: boolean;
}

export type PowerUpType = 'shield' | 'boost' | 'magnet' | 'multiplier';

export interface PowerUpData {
  id: string;
  type: PowerUpType;
  lane: LaneIndex;
  z: number;
  collected?: boolean;
}

export interface CoinData {
  id: string;
  lane: LaneIndex;
  y: number; // for jumping arcs
  z: number;
  collected?: boolean;
}

export interface TrackSegmentData {
  id: string;
  zStart: number;
  length: number;
  hasGap?: boolean; // chasm bridge
  gapZStart?: number;
  gapLength?: number;
  turnDirection?: -1 | 0 | 1;
}

export interface ActivePowerUps {
  shield: boolean; // boolean or count
  boostTimeLeft: number; // seconds
  magnetTimeLeft: number;
  multiplierTimeLeft: number;
}

export interface PlayerStats {
  score: number;
  coins: number;
  distance: number;
  highScore: number;
  multiplier: number;
}

export type CauseOfDeath = 'obstacle' | 'fall' | 'flame' | 'crashed';

export interface GameOverDetails {
  cause: CauseOfDeath;
  quote: string;
  distance: number;
  coins: number;
  score: number;
  highScore: number;
  isNewRecord: boolean;
}
