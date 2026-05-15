import * as THREE from "three";
import { PALETTE } from "./constants";

export type Vec3 = { x: number; y: number; z: number };

export function sampleTextShape(
  text: string,
  opts?: {
    fontSize?: number;
    density?: number;
    scale?: number;
    zSpread?: number;
    offsetY?: number;
  }
): Vec3[] {
  const fontSize = opts?.fontSize ?? 96;
  const density = opts?.density ?? 2.4;
  const baseScale = opts?.scale ?? 0.2;
  const zSpread = opts?.zSpread ?? 2.5;
  const offsetY = opts?.offsetY ?? 0;
  const scale = baseScale * (1 + Math.max(0, 4 - text.length) * 0.08);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `700 ${fontSize}px "Cormorant Garamond", Georgia, serif`;

  const pad = fontSize * 0.55;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(Math.max(metrics.width + pad * 2, fontSize * 1.8));
  const h = Math.ceil(fontSize * 1.45);

  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const data = ctx.getImageData(0, 0, w, h);
  const pts: Vec3[] = [];
  const step = Math.max(1, Math.round(1.6 / density));

  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const idx = (py * w + px) * 4;
      if (data.data[idx + 3] > 72) {
        pts.push({
          x: (px - w / 2) * scale,
          y: -(py - h / 2) * scale + offsetY,
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

/** Chữ 3D — phân bố đều, jitter nhỏ để không thành cụm sao nhiễu */
export function buildTextTargetBuffer(samples: Vec3[], count: number): Float32Array {
  const buf = new Float32Array(count * 3);
  const n = samples.length;
  if (n === 0) return buf;

  for (let i = 0; i < count; i++) {
    const pick = samples[Math.floor((i * n) / count) % n];
    const layer = (i * 7) % 11;
    const j = 0.03 + layer * 0.004;
    const i3 = i * 3;
    buf[i3] = pick.x + (Math.random() - 0.5) * j;
    buf[i3 + 1] = pick.y + (Math.random() - 0.5) * j;
    buf[i3 + 2] = pick.z + (Math.random() - 0.5) * 0.35;
  }
  return buf;
}

export function assignPastelColors(count: number): Float32Array {
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)].clone();
    const dim = 0.82 + Math.random() * 0.14;
    c.multiplyScalar(dim);
    c.r = Math.min(1, c.r);
    c.g = Math.min(0.72, c.g);
    c.b = Math.min(0.82, c.b);
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
