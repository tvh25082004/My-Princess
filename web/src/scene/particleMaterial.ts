import * as THREE from "three";

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 color;
  uniform float uMaxPoint;
  uniform float uSizeMul;
  varying vec3 vColor;
  varying float vDepth;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    float sizeScale = 240.0 / max(vDepth, 1.0);
    gl_PointSize = clamp(aSize * sizeScale * uSizeMul, 0.5, uMaxPoint);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/** Hạt tròn sắc — không halo, không vệt sáng */
const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vDepth;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float alpha = smoothstep(0.5, 0.38, d);
    float depthFade = clamp(1.0 - (vDepth - 50.0) / 280.0, 0.55, 1.0);
    vec3 col = clamp(vColor, vec3(0.0), vec3(0.78, 0.4, 0.58));

    gl_FragColor = vec4(col, alpha * depthFade * 0.58);
  }
`;

export function createShaderPoints(
  count: number,
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
    sizes[i] = (mobile ? 1.85 : 1.75) * (0.7 + Math.random() * 0.35);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMaxPoint: { value: mobile ? 10 : 12 },
      uSizeMul: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.Points(geo, mat);
  return { mesh, positions, sizes, colors };
}
