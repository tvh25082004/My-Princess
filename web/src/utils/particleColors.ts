/** Palette rose-gold — tránh kênh RGB gần 1 (trắng loè khi additive blend). */
const ROSE_GOLD: [number, number, number][] = [
  [0.95, 0.22, 0.48],
  [1, 0.35, 0.58],
  [0.92, 0.48, 0.68],
  [0.88, 0.62, 0.28],
  [0.78, 0.38, 0.72],
];

export function pickParticleColor(seed: number, time = 0): [number, number, number] {
  const i = Math.abs(Math.floor(seed * 997)) % ROSE_GOLD.length;
  const j = (i + 1) % ROSE_GOLD.length;
  const t = 0.5 + 0.5 * Math.sin(time * 1.4 + seed * 12.7);
  const a = ROSE_GOLD[i];
  const b = ROSE_GOLD[j];
  return [
    a[0] + (b[0] - a[0]) * t * 0.35,
    a[1] + (b[1] - a[1]) * t * 0.35,
    a[2] + (b[2] - a[2]) * t * 0.35,
  ];
}

/** Hồng magenta đậm giống mockup — từng chữ một */
const WORD_MAGENTA: [number, number, number][] = [
  [1, 0.06, 0.38],
  [1, 0.1, 0.44],
  [1, 0.08, 0.4],
];

export function applyWordColors(
  colors: Float32Array,
  count: number,
  time: number,
  wordIndex: number,
  shimmer = 0.18,
  mobile = false
): void {
  const base = WORD_MAGENTA[wordIndex % WORD_MAGENTA.length];
  const maxR = mobile ? 0.88 : 0.92;
  const maxG = mobile ? 0.42 : 0.5;
  const maxB = mobile ? 0.58 : 0.65;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pulse = 1 + shimmer * 0.5 * Math.sin(time * 2.2 + i * 0.08);
    colors[i3] = Math.min(maxR, base[0] * pulse);
    colors[i3 + 1] = Math.min(maxG, base[1] * pulse);
    colors[i3 + 2] = Math.min(maxB, base[2] * pulse);
  }
}

export function applyColors(
  colors: Float32Array,
  count: number,
  time: number,
  shimmer = 0.12,
  mode: "heart" | "text" | "scatter" = "heart",
  mobile = false
): void {
  const maxG = mobile ? 0.5 : mode === "text" ? 0.52 : 0.72;
  const maxB = mobile ? 0.65 : mode === "text" ? 0.68 : 0.82;
  const maxR = mobile ? 0.88 : mode === "text" ? 0.95 : 1;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const base = pickParticleColor(i * 0.017, time);
    const pulse = 1 + shimmer * Math.sin(time * 2.8 + i * 0.09);
    colors[i3] = Math.min(maxR, base[0] * pulse);
    colors[i3 + 1] = Math.min(maxG, base[1] * pulse);
    colors[i3 + 2] = Math.min(maxB, base[2] * pulse);
  }
}
