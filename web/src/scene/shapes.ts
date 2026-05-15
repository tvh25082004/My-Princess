import * as THREE from "three";
import { PALETTE } from "./constants";

export type Vec3 = { x: number; y: number; z: number };

export function sampleTextShape(
  text: string,
  opts?: { fontSize?: number; density?: number; scale?: number; zSpread?: number }
): Vec3[] {
  const fontSize = opts?.fontSize ?? 72;
  const density = opts?.density ?? 1.2;
  const scale = opts?.scale ?? 0.14;
  const zSpread = opts?.zSpread ?? 8;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `700 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.font = font;

  const pad = fontSize * 0.45;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(Math.max(metrics.width + pad * 2, fontSize * 1.5));
  const h = Math.ceil(fontSize * 1.35);

  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const data = ctx.getImageData(0, 0, w, h);
  const pts: Vec3[] = [];
  const step = Math.max(1, Math.round(2.2 / density));

  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const idx = (py * w + px) * 4;
      if (data.data[idx + 3] > 90) {
        pts.push({
          x: (px - w / 2) * scale,
          y: -(py - h / 2) * scale,
          z: (Math.random() - 0.5) * zSpread,
        });
      }
    }
  }

  return pts;
}

/** Tim rỗng — density thấp, Z sâu, không fill blob trắng */
export function sampleHollowHeart(count: number, scale = 0.38): Vec3[] {
  const pts: Vec3[] = [];
  let guard = 0;

  while (pts.length < count && guard < count * 12) {
    guard++;
    const t = Math.random() * Math.PI * 2;
    const layer = Math.random();

    let x = 16 * Math.pow(Math.sin(t), 3);
    let y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    x *= scale * (0.55 + layer * 0.5);
    y *= scale * (0.55 + layer * 0.5);

    const dist = Math.hypot(x, y);
    if (dist < 2.2 && Math.random() < 0.72) continue;
    if (dist > 7.5 && Math.random() < 0.35) continue;

    pts.push({
      x: x + (Math.random() - 0.5) * 2,
      y: y + (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 20,
    });
  }

  return pts;
}

export function sampleScatter(count: number, radius = 140): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    const r = radius * (0.35 + Math.random() * 0.65);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pts.push({
      x: r * Math.sin(ph) * Math.cos(th),
      y: r * Math.sin(ph) * Math.sin(th),
      z: r * Math.cos(ph) * 0.6,
    });
  }
  return pts;
}

/** Map N particles → target shape (lặp / jitter nếu thiếu điểm) */
export function buildTargetBuffer(samples: Vec3[], count: number): Float32Array {
  const buf = new Float32Array(count * 3);
  if (samples.length === 0) return buf;

  for (let i = 0; i < count; i++) {
    const s = samples[i % samples.length];
    const dup = i >= samples.length;
    const j = dup ? 0.8 : 0.15;
    const i3 = i * 3;
    buf[i3] = s.x + (Math.random() - 0.5) * j;
    buf[i3 + 1] = s.y + (Math.random() - 0.5) * j;
    buf[i3 + 2] = s.z + (Math.random() - 0.5) * (dup ? 2 : 0.4);
  }
  return buf;
}

export function assignPastelColors(count: number, seed = 0): Float32Array {
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)].clone();
    const dim = 0.72 + Math.random() * 0.22;
    c.multiplyScalar(dim);
    const i3 = i * 3;
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }
  return colors;
}

export function pickPaletteColor(index: number): THREE.Color {
  return PALETTE[index % PALETTE.length].clone();
}
