import * as THREE from "three";

export const COLORS = {
  bg: "#05010d",
  bgHex: 0x05010d,
  pink: "#ff8fcf",
  softPink: "#ffd1e8",
  white: "#fff5fa",
} as const;

export const PALETTE: THREE.Color[] = [
  new THREE.Color(COLORS.pink),
  new THREE.Color(COLORS.softPink),
  new THREE.Color(COLORS.white),
];

export const SCENE = {
  particleCount: 15000,
  particleCountMobile: 9000,
  cameraZ: 120,
  cameraZMobile: 88,
  cameraY: 10,
  heartScale: 1,
  rotationSpeed: 0.0025,
  bloomStrength: 1.2,
  bloomRadius: 0.4,
  bloomThreshold: 0.42,
  fogDensity: 0.00085,
} as const;
