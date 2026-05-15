import * as THREE from "three";
import { PALETTE } from "./constants";

export type Vec3 = { x: number; y: number; z: number };

/** Chữ 3D dạng mesh hạt — cùng kiểu độ sâu Z như trái tim */
export function sampleTextShape(
  text: string,
  opts?: {
    fontSize?: number;
    density?: number;
    targetSize?: number;
    zDepth?: number;
    offsetY?: number;
  }
): Vec3[] {
  const fontSize = opts?.fontSize ?? 96;
  const density = opts?.density ?? 4.5;
  const targetSize = opts?.targetSize ?? 14;
  const zDepth = opts?.zDepth ?? 20;
  const offsetY = opts?.offsetY ?? 0;

  const font = `800 ${fontSize}px "Cormorant Garamond", "Times New Roman", Times, "Arial Unicode MS", "Lucida Grande", Georgia, system-ui, serif`;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const pad = fontSize * 0.4;
  const metrics = measure.measureText(text);
  const w = Math.ceil(Math.max(metrics.width + pad * 2, fontSize * 1.5));
  const h = Math.ceil(fontSize * 1.35);

  const dpr = 4;
  const canvas = document.createElement("canvas");
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.font = font;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tx = w / 2;
  const ty = h / 2;
  ctx.lineWidth = Math.max(5, fontSize * 0.085);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fff";
  ctx.strokeText(text, tx, ty);
  ctx.fillText(text, tx, ty);

  const data = ctx.getImageData(0, 0, w * dpr, h * dpr);
  const raw: Vec3[] = [];
  const step = Math.max(1, Math.round((1.1 / density) * dpr));

  const cw = w * dpr;
  for (let py = 0; py < h * dpr; py += step) {
    for (let px = 0; px < w * dpr; px += step) {
      const idx = (py * cw + px) * 4;
      if (data.data[idx + 3] > 40) {
        raw.push({
          x: px / dpr - w / 2,
          y: -(py / dpr - h / 2),
          z: 0,
        });
      }
    }
  }

  if (raw.length < 48) {
    const cols = 16 + text.length * 5;
    const rows = 10;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        raw.push({
          x: (c / cols - 0.5) * fontSize * 0.65,
          y: (0.5 - r / rows) * fontSize * 0.45,
          z: 0,
        });
      }
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of raw) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const norm = targetSize / span;
  const flat = raw.map((p) => ({
    x: (p.x - cx) * norm,
    y: (p.y - cy) * norm + offsetY,
    z: 0,
  }));

  const pts: Vec3[] = [];
  const layers = 10;

  for (const p of flat) {
    for (let li = 0; li < layers; li++) {
      const u = layers > 1 ? li / (layers - 1) : 0.5;
      const z = (u - 0.5) * zDepth;
      const swell = 1 + Math.sin(u * Math.PI) * 0.05;
      pts.push({
        x: p.x * swell + (Math.random() - 0.5) * 0.35,
        y: p.y * swell + (Math.random() - 0.5) * 0.35,
        z: z + (Math.random() - 0.5) * 2.2,
      });
    }
  }

  const shellN = Math.max(120, Math.floor(flat.length * 0.35));
  for (let i = 0; i < shellN; i++) {
    const pick = flat[Math.floor(Math.random() * flat.length)];
    pts.push({
      x: pick.x + (Math.random() - 0.5) * 1.2,
      y: pick.y + (Math.random() - 0.5) * 1.2,
      z: (Math.random() - 0.5) * zDepth,
    });
  }

  return pts;
}

/** Tim rỗng — density thấp, Z sâu, không fill blob trắng */
export function sampleHollowHeart(count: number, scale = 0.38, offsetY = 0): Vec3[] {
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
      y: y + offsetY + (Math.random() - 0.5) * 2,
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

/** Chữ 3D — phân bố hạt giống mesh trái tim */
export function buildTextTargetBuffer(samples: Vec3[], count: number): Float32Array {
  return buildTargetBuffer(samples, count);
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
