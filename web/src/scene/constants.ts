import * as THREE from "three";

export const COLORS = {
  bg: "#05010d",
  bgHex: 0x05010d,
  pink: "#ff6b9d",
  rose: "#ff1493",
  softPink: "#ff8fcf",
  gold: "#e8c872",
  violet: "#c77dff",
} as const;

/** Không dùng trắng — tránh additive bloom thành cụm trắng loè */
export const PALETTE: THREE.Color[] = [
  new THREE.Color(COLORS.rose),
  new THREE.Color(COLORS.pink),
  new THREE.Color(COLORS.softPink),
  new THREE.Color(COLORS.gold),
  new THREE.Color(COLORS.violet),
];

export const SCENE = {
  particleCount: 15000,
  particleCountMobile: 9000,
  cameraZ: 120,
  cameraZMobile: 88,
  cameraY: 10,
  cameraYMobile: 14,
  lookAtY: 9,
  lookAtYMobile: 12,
  heartScale: 1,
  rotationSpeed: 0.0025,
  exposureMobile: 0.88,
  fogDensity: 0.00085,
} as const;
