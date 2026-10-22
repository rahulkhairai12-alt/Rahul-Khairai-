import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampLane,
  getLaneX,
  calculateScore,
  calculateSpeed,
  updatePowerUpTimers,
  checkObstacleCollision,
  checkChasmFall,
  isCoinCollected,
  LANE_WIDTH,
  BASE_SPEED,
  BOOST_SPEED,
} from './rules.ts';

test('lane positioning and clamping', () => {
  assert.equal(clampLane(-2), -1);
  assert.equal(clampLane(-1), -1);
  assert.equal(clampLane(0), 0);
  assert.equal(clampLane(1), 1);
  assert.equal(clampLane(3), 1);

  assert.equal(getLaneX(-1), -LANE_WIDTH);
  assert.equal(getLaneX(0), 0);
  assert.equal(getLaneX(1), LANE_WIDTH);
});

test('score calculation with distance, coins and multiplier', () => {
  const baseScore = calculateScore(100, 10, 1);
  // 100 * 2 + 10 * 25 = 200 + 250 = 450
  assert.equal(baseScore, 450);

  const doubledScore = calculateScore(100, 10, 2);
  assert.equal(doubledScore, 900);
});

test('speed calculation increases with distance and boosts properly', () => {
  const startSpeed = calculateSpeed(0, false);
  assert.equal(startSpeed, BASE_SPEED);

  const laterSpeed = calculateSpeed(200, false);
  assert.ok(laterSpeed > startSpeed);

  const boostSpeed = calculateSpeed(50, true);
  assert.equal(boostSpeed, BOOST_SPEED);
});

test('powerup timers countdown and clamp to 0', () => {
  const active = {
    shield: true,
    boostTimeLeft: 3.5,
    magnetTimeLeft: 1.0,
    multiplierTimeLeft: 0.5,
  };

  const updated = updatePowerUpTimers(active, 1.0);
  assert.equal(updated.shield, true);
  assert.equal(updated.boostTimeLeft, 2.5);
  assert.equal(updated.magnetTimeLeft, 0);
  assert.equal(updated.multiplierTimeLeft, 0);
});

test('obstacle collision detection for hurdles, lintels, and totems', () => {
  const player = {
    x: 0,
    y: 0,
    z: 50,
    width: 0.8,
    height: 1.8,
    depth: 0.8,
    isSliding: false,
    isJumping: false,
  };

  // Hurdle on same lane
  const hurdle = {
    id: 'h1',
    type: 'hurdle' as const,
    lane: 0 as const,
    z: 50,
    width: 2.0,
    height: 0.8,
    depth: 0.8,
  };

  // Player hits hurdle when grounded
  assert.equal(checkObstacleCollision(player, hurdle), true);

  // Player jumps over hurdle (y >= 0.8)
  const jumpingPlayer = { ...player, y: 1.2, isJumping: true };
  assert.equal(checkObstacleCollision(jumpingPlayer, hurdle), false);

  // Hurdle on different lane is safe
  const playerInLeftLane = { ...player, x: -LANE_WIDTH };
  assert.equal(checkObstacleCollision(playerInLeftLane, hurdle), false);

  // Lintel (overhead)
  const lintel = {
    id: 'l1',
    type: 'lintel' as const,
    lane: 0 as const,
    z: 50,
    width: 2.0,
    height: 1.0,
    depth: 0.8,
  };

  // Standing player hits lintel
  assert.equal(checkObstacleCollision(player, lintel), true);

  // Sliding player dodges lintel
  const slidingPlayer = { ...player, isSliding: true, y: 0 };
  assert.equal(checkObstacleCollision(slidingPlayer, lintel), false);

  // Totem (solid block) hits standing or jumping player on same lane
  const totem = {
    id: 't1',
    type: 'totem' as const,
    lane: 0 as const,
    z: 50,
    width: 1.6,
    height: 3.0,
    depth: 1.0,
  };
  assert.equal(checkObstacleCollision(player, totem), true);
  assert.equal(checkObstacleCollision(jumpingPlayer, totem), true);
});

test('chasm detection triggers fall when not jumping', () => {
  const chasm = { zStart: 100, length: 12 };

  // Before chasm
  assert.equal(checkChasmFall({ y: 0, z: 90, isJumping: false }, chasm), false);

  // In chasm, on ground -> falls!
  assert.equal(checkChasmFall({ y: 0, z: 105, isJumping: false }, chasm), true);

  // In chasm, mid air -> safe
  assert.equal(checkChasmFall({ y: 1.5, z: 105, isJumping: true }, chasm), false);

  // Past chasm
  assert.equal(checkChasmFall({ y: 0, z: 120, isJumping: false }, chasm), false);
});

test('coin pickup and magnet attraction logic', () => {
  const coin = { id: 'c1', lane: 0 as const, y: 0.8, z: 50 };

  // Close player picks up directly
  const closePlayer = { x: 0, y: 0, z: 50.2 };
  const directResult = isCoinCollected(closePlayer, coin, false);
  assert.equal(directResult.collected, true);

  // Distant coin with magnet gets pulled
  const distantPlayer = { x: -LANE_WIDTH, y: 0, z: 46 };
  const magnetResult = isCoinCollected(distantPlayer, coin, true);
  assert.equal(magnetResult.collected, false);
  assert.equal(magnetResult.pull, true);

  // Distant coin without magnet is untouched
  const noMagnetResult = isCoinCollected(distantPlayer, coin, false);
  assert.equal(noMagnetResult.collected, false);
  assert.equal(noMagnetResult.pull, false);
});
