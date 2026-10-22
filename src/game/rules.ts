import {
  ActivePowerUps,
  CauseOfDeath,
  CoinData,
  LANE_POSITIONS,
  LANE_WIDTH,
  LaneIndex,
  ObstacleData,
} from './types';

export { LANE_WIDTH };

export const BASE_SPEED = 22; // units per second
export const MAX_SPEED = 45;
export const BOOST_SPEED = 50;
export const JUMP_VELOCITY = 15;
export const GRAVITY = 40;
export const SLIDE_DURATION = 0.85;

export const CRYING_QUOTES: Record<CauseOfDeath, string[]> = {
  obstacle: [
    "WAAAAAAH! My kneecaps hit the ancient stone! 😭",
    "OUCH! That spiked log wasn't on the map! 😭😭",
    "NOT THE FACE! The jungle spirits got me! 😿😭",
    "WAAAH! I dropped all my shiny gold coins! 😢😭",
  ],
  fall: [
    "AAAAAAAH! It's a bottomless pit of tears! 😭🌊",
    "NOOOOO! I forgot to jump over the broken bridge! 😭",
    "WAAAH! Falling into the abyss with my cries echoing! 😭😭",
    "HELP! Why did the ancient temple forget the floor?! 😢😭",
  ],
  flame: [
    "HOT HOT HOT! My trousers are on fire! 😭🔥",
    "WAAAAAH! Roasted by ancient temple torches! 😭😭",
    "SOB! Tears can't extinguish these jungle flames! 😢😭",
  ],
  crashed: [
    "WAHHH! Why didn't I pick up that Mystic Shield?! 😭🛡️",
    "BOO HOO HOO! The golden idol remains in the temple! 😭",
    "SNIFFLE... I was only three meters from my record! 😿😭",
  ],
};

export function getLaneX(lane: LaneIndex): number {
  return LANE_POSITIONS[lane] ?? 0;
}

export function clampLane(lane: number): LaneIndex {
  if (lane <= -1) return -1;
  if (lane >= 1) return 1;
  return 0;
}

export function calculateScore(distance: number, coins: number, multiplier: number): number {
  const distPoints = Math.floor(distance * 2);
  const coinPoints = coins * 25;
  return (distPoints + coinPoints) * Math.max(1, multiplier);
}

export function calculateSpeed(distance: number, boostActive: boolean): number {
  if (boostActive) return BOOST_SPEED;
  // Slowly ramp up speed with distance
  const ramp = Math.min(MAX_SPEED - BASE_SPEED, (distance / 400) * 8);
  return BASE_SPEED + ramp;
}

export function updatePowerUpTimers(active: ActivePowerUps, dt: number): ActivePowerUps {
  return {
    shield: active.shield,
    boostTimeLeft: Math.max(0, active.boostTimeLeft - dt),
    magnetTimeLeft: Math.max(0, active.magnetTimeLeft - dt),
    multiplierTimeLeft: Math.max(0, active.multiplierTimeLeft - dt),
  };
}

export interface PlayerBoundingBox {
  x: number;
  y: number; // bottom of player
  z: number;
  width: number;
  height: number;
  depth: number;
  isSliding: boolean;
  isJumping: boolean;
}

export function checkObstacleCollision(
  player: PlayerBoundingBox,
  obs: ObstacleData,
): boolean {
  // Check Z overlap
  const obsZFront = obs.z - obs.depth / 2;
  const obsZBack = obs.z + obs.depth / 2;
  const playerZFront = player.z - player.depth / 2;
  const playerZBack = player.z + player.depth / 2;

  const zOverlap = playerZFront < obsZBack && playerZBack > obsZFront;
  if (!zOverlap) return false;

  // Check lane/X overlap
  if (obs.lane !== 'all') {
    const obsX = getLaneX(obs.lane);
    const xDist = Math.abs(player.x - obsX);
    if (xDist > obs.width / 2 + player.width / 2 - 0.25) {
      return false; // Safe in another lane
    }
  } else {
    // Spans full track width
    const trackHalfWidth = (LANE_WIDTH * 3) / 2;
    if (Math.abs(player.x) > trackHalfWidth + 0.5) return false;
  }

  // Type-specific collision rules:
  if (obs.type === 'hurdle' || obs.type === 'flame_trap') {
    // Ground hazard: player can jump over if y is high enough
    const hurdleTop = obs.height;
    if (player.y >= hurdleTop - 0.15) {
      // Cleared by jumping!
      return false;
    }
    return true;
  }

  if (obs.type === 'lintel') {
    // Overhead hazard: player must slide under!
    // Lintel hangs between y = 1.0 and y = 2.4
    const lintelBottom = 1.1;
    if (player.isSliding && player.y <= 0.2) {
      // Safely sliding underneath!
      return false;
    }
    // If standing or jumping, player hits the lintel
    if (player.y + player.height > lintelBottom) {
      return true;
    }
    return false;
  }

  if (obs.type === 'totem') {
    // Tall solid obstacle: cannot jump over or slide under
    return true;
  }

  return false;
}

export function checkChasmFall(
  player: { y: number; z: number; isJumping: boolean },
  chasm: { zStart: number; length: number },
): boolean {
  const zEnd = chasm.zStart + chasm.length;
  // If player's center is inside the chasm range
  if (player.z >= chasm.zStart && player.z <= zEnd) {
    // If not in mid-air (y <= 0.2), player falls into chasm!
    if (player.y <= 0.25) {
      return true;
    }
  }
  return false;
}

export function isCoinCollected(
  playerPos: { x: number; y: number; z: number },
  coin: CoinData,
  magnetActive: boolean,
): { collected: boolean; pull: boolean } {
  const coinX = getLaneX(coin.lane);
  const dx = playerPos.x - coinX;
  const dy = playerPos.y + 0.9 - coin.y;
  const dz = playerPos.z - coin.z;
  const distSq = dx * dx + dy * dy + dz * dz;

  // Immediate pickup distance (~1.4 units)
  if (distSq < 2.0) {
    return { collected: true, pull: false };
  }

  // If magnet is active and within magnet radius (15 units)
  if (magnetActive && distSq < 225) {
    return { collected: false, pull: true };
  }

  return { collected: false, pull: false };
}

export function getRandomCryingQuote(cause: CauseOfDeath): string {
  const quotes = CRYING_QUOTES[cause] || CRYING_QUOTES.crashed;
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}
