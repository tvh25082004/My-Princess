export function sampleText(
  text: string,
  options?: {
    fontSize?: number;
    density?: number;
    particleScale?: number;
    depthSpread?: number;
  }
): { x: number; y: number; z: number }[] {
  const fontSize = options?.fontSize ?? 80;
  const density = options?.density ?? 1.4;
  const particleScale = options?.particleScale ?? 0.16;
  const depthSpread = options?.depthSpread ?? 2.8;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `700 ${fontSize}px "Cormorant Garamond", "Times New Roman", Georgia, serif`;
  ctx.font = font;

  const metrics = ctx.measureText(text);
  const pad = fontSize * 0.4;
  const textW = Math.ceil(Math.max(metrics.width + pad * 2, fontSize * 1.6));
  const textH = Math.ceil(fontSize * 1.4);

  canvas.width = textW;
  canvas.height = textH;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, textW, textH);
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, textW / 2, textH / 2);

  const imageData = ctx.getImageData(0, 0, textW, textH);
  const points: { x: number; y: number; z: number }[] = [];
  const step = Math.max(1, Math.round(2 / density));

  for (let py = 0; py < textH; py += step) {
    for (let px = 0; px < textW; px += step) {
      const idx = (py * textW + px) * 4;
      if (imageData.data[idx + 3] > 80) {
        points.push({
          x: (px - textW / 2) * particleScale,
          y: -(py - textH / 2) * particleScale,
          z: (Math.random() - 0.5) * depthSpread,
        });
      }
    }
  }

  if (points.length < 80) {
    const cols = 14;
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        points.push({
          x: (c / cols - 0.5) * fontSize * 0.14,
          y: (0.5 - r / rows) * fontSize * 0.1,
          z: (Math.random() - 0.5) * 0.6,
        });
      }
    }
  }

  return points;
}

export function sampleHeartPoints(count: number): { x: number; y: number; z: number }[] {
  const pts: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const layer = Math.random();
    const scale = 0.55 + layer * 0.85;

    let x = 16 * Math.pow(Math.sin(t), 3);
    let y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    x *= scale * 0.38;
    y *= scale * 0.38;

    const spread = layer * 2.5;
    x += (Math.random() - 0.5) * spread;
    y += (Math.random() - 0.5) * spread;

    pts.push({
      x,
      y,
      z: (Math.random() - 0.5) * 5,
    });
  }

  return pts;
}
