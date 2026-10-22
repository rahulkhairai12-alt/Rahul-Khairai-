import * as THREE from 'three';

// Procedural Canvas Textures for ancient jungle temple, stone, coins, and shields
// Zero 404s, crisp, high performance

export function createStonePaverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base ancient mossy stone hue
  ctx.fillStyle = '#4a5342';
  ctx.fillRect(0, 0, 512, 512);

  // Stone flagstone blocks
  const cols = 4;
  const rows = 4;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (r % 2 === 1) ? cellW / 2 : 0;
      const x = (c * cellW + offsetX) % 512;
      const y = r * cellH;

      // Stone block variance
      const lightness = 65 + Math.floor(Math.random() * 25);
      const mossGreen = 75 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${lightness - 10}, ${mossGreen}, ${lightness - 20})`;
      ctx.fillRect(x + 3, y + 3, cellW - 6, cellH - 6);

      // Inner stone noise texture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let n = 0; n < 30; n++) {
        const nx = x + Math.random() * (cellW - 6);
        const ny = y + Math.random() * (cellH - 6);
        ctx.fillRect(nx, ny, 2 + Math.random() * 3, 2 + Math.random() * 3);
      }

      // Ancient engraved geometric runes
      ctx.strokeStyle = 'rgba(25, 35, 20, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 12, y + 12, cellW - 24, cellH - 24);

      ctx.beginPath();
      ctx.arc(x + cellW / 2, y + cellH / 2, cellW / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Deep mortar grooves
  ctx.strokeStyle = '#23291d';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += cellH) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPillarStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c574c';
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal stone layers with vine creepers
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = (y % 64 === 0) ? '#4a453b' : '#696356';
    ctx.fillRect(0, y, 256, 30);

    // Moss / vines
    ctx.fillStyle = 'rgba(45, 95, 35, 0.4)';
    for (let v = 0; v < 8; v++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 256, y + Math.random() * 28, 4 + Math.random() * 6, 2 + Math.random() * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGoldCoinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Shiny gold gradient
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 125);
  grad.addColorStop(0, '#fff494');
  grad.addColorStop(0.4, '#ffd700');
  grad.addColorStop(0.85, '#d49b00');
  grad.addColorStop(1, '#8b6508');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  // Inscribed Temple Idol Face
  ctx.strokeStyle = '#684500';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 95, 0, Math.PI * 2);
  ctx.stroke();

  // Ancient sun emblem in center
  ctx.fillStyle = '#684500';
  ctx.beginPath();
  ctx.arc(128, 128, 25, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * 35, 128 + Math.sin(angle) * 35);
    ctx.lineTo(128 + Math.cos(angle) * 75, 128 + Math.sin(angle) * 75);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 220, 255, 0.15)';
  ctx.fillRect(0, 0, 256, 256);

  // Hexagonal shield grid
  ctx.strokeStyle = 'rgba(100, 255, 240, 0.7)';
  ctx.lineWidth = 3;

  const hexRadius = 24;
  const dx = hexRadius * 1.5;
  const dy = hexRadius * Math.sqrt(3);

  for (let x = 0; x < 256 + hexRadius; x += dx) {
    for (let y = 0; y < 256 + hexRadius; y += dy) {
      const cy = y + (Math.floor(x / dx) % 2) * (dy / 2);
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (a * Math.PI) / 3;
        const hx = x + hexRadius * Math.cos(angle);
        const hy = cy + hexRadius * Math.sin(angle);
        if (a === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
