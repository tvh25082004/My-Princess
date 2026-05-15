import * as THREE from "three";

export function createSoftGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255, 220, 240, 0.95)");
  g.addColorStop(0.25, "rgba(255, 143, 207, 0.55)");
  g.addColorStop(0.55, "rgba(255, 100, 180, 0.18)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vDepth;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    float sizeScale = 280.0 / max(vDepth, 1.0);
    gl_PointSize = clamp(aSize * sizeScale, 0.5, 14.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vDepth;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.12, d);
    float depthFade = clamp(1.0 - (vDepth - 40.0) / 220.0, 0.35, 1.0);
    float alpha = glow * 0.72 * depthFade;
    vec3 col = vColor * (0.65 + core * 0.35);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createShaderPoints(
  count: number,
  glowMap: THREE.Texture,
  mobile: boolean
): {
  mesh: THREE.Points;
  positions: Float32Array;
  sizes: Float32Array;
  colors: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    sizes[i] = (mobile ? 1.8 : 2.2) * (0.65 + Math.random() * 0.5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: glowMap },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Points(geo, mat);
  return { mesh, positions, sizes, colors };
}
