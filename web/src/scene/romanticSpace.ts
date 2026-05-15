import gsap from "gsap";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { COLORS, SCENE } from "./constants";
import { createShaderPoints, createSoftGlowTexture } from "./particleMaterial";
import { applyColors } from "../utils/particleColors";
import {
  assignPastelColors,
  buildTargetBuffer,
  buildTextTargetBuffer,
  sampleHollowHeart,
  sampleScatter,
  sampleTextShape,
} from "./shapes";

const TEXT_SEQUENCE = ["Hà", "Hiền", "My"] as const;

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window;
}

function lerpBuf(
  out: Float32Array,
  a: Float32Array,
  b: Float32Array,
  t: number
): void {
  const k = Math.max(0, Math.min(1, t));
  for (let i = 0; i < out.length; i++) {
    out[i] = a[i] + (b[i] - a[i]) * k;
  }
}

function buildStarfield(count: number, spread: number, parallax: number) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const baseZ = new Float32Array(count);

  const tints = [
    [1, 0.56, 0.81],
    [1, 0.82, 0.91],
    [0.92, 0.78, 1],
    [1, 0.96, 0.98],
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    pos[i3] = (Math.random() - 0.5) * spread;
    pos[i3 + 1] = (Math.random() - 0.5) * spread;
    pos[i3 + 2] = (Math.random() - 0.5) * spread * parallax;
    baseZ[i] = pos[i3 + 2];
    const tint = tints[Math.floor(Math.random() * tints.length)];
    const dim = 0.35 + Math.random() * 0.45;
    col[i3] = tint[0] * dim;
    col[i3 + 1] = tint[1] * dim;
    col[i3 + 2] = tint[2] * dim;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

  const mesh = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  return { mesh, baseZ, positions: pos };
}

export type RomanticSpaceHandle = {
  dispose: () => void;
};

export async function initRomanticSpace(container: HTMLElement): Promise<RomanticSpaceHandle> {
  await document.fonts.load('700 140px "Cormorant Garamond"').catch(() => undefined);
  await document.fonts.ready.catch(() => undefined);

  const mobile = isMobile();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const count = mobile ? SCENE.particleCountMobile : SCENE.particleCount;
  const camZ = mobile ? SCENE.cameraZMobile : SCENE.cameraZ;

  const glowMap = createSoftGlowTexture();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.bgHex, SCENE.fogDensity);

  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.set(0, SCENE.cameraY, camZ);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(COLORS.bgHex, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    mobile ? SCENE.bloomStrength * 0.85 : SCENE.bloomStrength,
    SCENE.bloomRadius,
    SCENE.bloomThreshold
  );
  composer.addPass(bloom);

  const starNear = buildStarfield(mobile ? 2200 : 4500, 2000, 1);
  const starFar = buildStarfield(mobile ? 1500 : 3200, 2800, 0.55);
  scene.add(starFar.mesh);
  scene.add(starNear.mesh);

  const content = new THREE.Group();
  content.position.y = mobile ? 24 : 14;
  content.scale.setScalar(mobile ? 2.55 : 3.1);
  scene.add(content);

  const particles = createShaderPoints(count, glowMap, mobile);
  particles.colors.set(assignPastelColors(count));
  particles.mesh.geometry.attributes.color.needsUpdate = true;
  content.add(particles.mesh);

  const fontSize = mobile ? 128 : 140;
  const textOpts = {
    fontSize,
    density: 4.2,
    scale: mobile ? 0.34 : 0.36,
    zSpread: 1.1,
    offsetY: mobile ? 12 : 8,
  };

  const scatterTarget = buildTargetBuffer(sampleScatter(count, mobile ? 38 : 48), count);
  const heartTarget = buildTargetBuffer(
    sampleHollowHeart(mobile ? 5500 : 8000),
    count
  );
  const textTargets = TEXT_SEQUENCE.map((label) =>
    buildTextTargetBuffer(sampleTextShape(label, textOpts), count)
  );

  const fromBuf = new Float32Array(count * 3);
  const toBuf = new Float32Array(count * 3);
  fromBuf.set(scatterTarget);
  toBuf.set(scatterTarget);
  particles.positions.set(scatterTarget);

  let morphT = 1;
  let phase: "intro" | "heart" = "intro";
  let holdText = false;
  let clock = 0;
  let raf = 0;
  let alive = true;
  let timeline: gsap.core.Timeline | null = null;

  const morphTo = (target: Float32Array, duration: number, ease = "power3.inOut") => {
    fromBuf.set(particles.positions);
    toBuf.set(target);
    morphT = 0;
    return gsap.to(
      { t: 0 },
      {
        t: 1,
        duration,
        ease,
        onUpdate() {
          morphT = (this.targets()[0] as { t: number }).t;
        },
      }
    );
  };

  const runIntro = () => {
    if (reduced) {
      morphTo(heartTarget, 2).then(() => {
        phase = "heart";
      });
      return;
    }

    timeline = gsap.timeline({
      onComplete: () => {
        phase = "heart";
      },
    });

    const showWord = (target: Float32Array, hold = 2.6) => {
      timeline!.call(() => {
        holdText = true;
      });
      timeline!.add(morphTo(target, 1.35, "power3.out"));
      timeline!.to({}, { duration: hold });
    };

    const briefScatter = () => {
      timeline!.call(() => {
        holdText = false;
      });
      timeline!.add(morphTo(scatterTarget, 0.5, "power2.inOut"));
      timeline!.to({}, { duration: 0.25 });
    };

    timeline.to({}, { duration: 0.35 });
    showWord(textTargets[0], 2.8);
    briefScatter();
    showWord(textTargets[1], 2.8);
    briefScatter();
    showWord(textTargets[2], 2.6);
    briefScatter();
    timeline.call(() => {
      holdText = false;
    });
    timeline.add(morphTo(heartTarget, 2.2, "power4.out"));
    timeline.to({}, { duration: 0.8 });
  };

  runIntro();

  const animate = () => {
    if (!alive) return;
    raf = requestAnimationFrame(animate);
    const dt = reduced ? 0.004 : 0.016;
    clock += dt;

    lerpBuf(particles.positions, fromBuf, toBuf, morphT);

    const pos = particles.positions;
    const n = count;
    const wiggleY = holdText ? 0.003 : phase === "heart" ? 0.018 : 0.008;
    const wiggleZ = holdText ? 0.002 : phase === "heart" ? 0.012 : 0.006;
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const x = pos[i3];
      const y = pos[i3 + 1];
      const z = pos[i3 + 2];
      pos[i3 + 1] = y + Math.sin(clock * 1.2 + x * 0.08 + i * 0.02) * wiggleY;
      pos[i3 + 2] = z + Math.sin(clock * 0.9 + y * 0.06) * wiggleZ;
    }

    if (phase === "heart") {
      content.rotation.y += SCENE.rotationSpeed;
      content.rotation.x = Math.sin(clock * 0.35) * 0.14;
    } else if (holdText) {
      content.rotation.y *= 0.92;
      content.rotation.x *= 0.92;
    } else {
      content.rotation.y = Math.sin(clock * 0.2) * 0.04;
      content.rotation.x = Math.sin(clock * 0.15) * 0.03;
    }

    const sway = clock * 1000;
    camera.position.x = Math.sin(sway * 0.0002) * (mobile ? 14 : 20);
    camera.position.y = SCENE.cameraY + Math.sin(sway * 0.00015) * 3.5;
    camera.position.z = camZ + Math.sin(sway * 0.0001) * 6;
    camera.lookAt(0, 0, 0);

    const parallax = (
      star: { mesh: THREE.Points; positions: Float32Array; baseZ: Float32Array },
      speed: number
    ) => {
      const { positions, baseZ } = star;
      for (let i = 0; i < baseZ.length; i++) {
        positions[i * 3 + 2] = baseZ[i] + ((clock * speed + i * 0.3) % 400) - 200;
      }
      star.mesh.geometry.attributes.position.needsUpdate = true;
    };

    parallax(starNear, reduced ? 8 : 18);
    parallax(starFar, reduced ? 4 : 9);
    starNear.mesh.rotation.y += 0.00008;
    starFar.mesh.rotation.y -= 0.00004;

    const shimmer = holdText ? 0.18 : phase === "heart" ? 0.15 : 0.1;
    applyColors(particles.colors, count, clock, shimmer);
    particles.mesh.geometry.attributes.color.needsUpdate = true;

    particles.mesh.geometry.attributes.position.needsUpdate = true;
    composer.render();
  };

  animate();

  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
  };
  window.addEventListener("resize", onResize);

  return {
    dispose: () => {
      alive = false;
      timeline?.kill();
      gsap.killTweensOf({ t: 0 });
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      glowMap.dispose();
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      particles.mesh.geometry.dispose();
      (particles.mesh.material as THREE.Material).dispose();
      starNear.mesh.geometry.dispose();
      starFar.mesh.geometry.dispose();
    },
  };
}
