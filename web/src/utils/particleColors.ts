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

export function applyColors(
  colors: Float32Array,
  count: number,
  time: number,
  shimmer = 0.12
): void {
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const base = pickParticleColor(i * 0.017, time);
    const pulse = 1 + shimmer * Math.sin(time * 2.8 + i * 0.09);
    colors[i3] = Math.min(1, base[0] * pulse);
    colors[i3 + 1] = Math.min(0.85, base[1] * pulse);
    colors[i3 + 2] = Math.min(0.9, base[2] * pulse);
  }
}
