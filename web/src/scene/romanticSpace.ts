import gsap from "gsap";
import * as THREE from "three";
import { COLORS, SCENE } from "./constants";
import { createShaderPoints } from "./particleMaterial";
import { applyColors, applyWordColors } from "../utils/particleColors";
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
  return window.matchMedia("(max-width: 768px)").matches;
}

/** Giữa khung trống — trên gallery, không chèn vào ảnh */
function contentAnchorY(mobile: boolean): number {
  return mobile ? 12 : 9;
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

export type RomanticSpaceHandle = {
  dispose: () => void;
};

export async function initRomanticSpace(container: HTMLElement): Promise<RomanticSpaceHandle> {
  const probe = document.createElement("canvas");
  const gl =
    probe.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ??
    probe.getContext("webgl", { failIfMajorPerformanceCaveat: false });
  if (!gl) {
    throw new Error("WebGL không khả dụng trên thiết bị này");
  }

  await Promise.all([
    document.fonts.load('700 160px "Cormorant Garamond"'),
    document.fonts.load('800 160px "Cormorant Garamond"'),
    document.fonts.load('800 160px Outfit'),
  ]).catch(() => undefined);
  await document.fonts.ready.catch(() => undefined);

  const mobile = isMobile();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const count = mobile ? SCENE.particleCountMobile : SCENE.particleCount;
  const camZ = mobile ? SCENE.cameraZMobile : SCENE.cameraZ;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.bgHex, SCENE.fogDensity * 1.15);

  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  const camY = mobile ? SCENE.cameraYMobile : SCENE.cameraY;
  const lookY = mobile ? SCENE.lookAtYMobile : SCENE.lookAtY;
  camera.position.set(0, camY, camZ);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(COLORS.bgHex, 1);
  renderer.toneMapping = THREE.NoToneMapping;

  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  const contentScaleHeart = mobile ? 1.75 : 2;

  const content = new THREE.Group();
  content.position.y = contentAnchorY(mobile);
  content.scale.setScalar(contentScaleHeart);
  scene.add(content);

  const particles = createShaderPoints(count, mobile);
  particles.colors.set(assignPastelColors(count));
  particles.mesh.geometry.attributes.color.needsUpdate = true;
  content.add(particles.mesh);

  const fontSize = mobile ? 140 : 156;
  const textOpts = {
    fontSize,
    density: 5,
    targetSize: mobile ? 13.5 : 15,
    zDepth: 20,
    offsetY: 0,
  };

  await document.fonts.load(`700 ${fontSize}px "Cormorant Garamond"`).catch(() => undefined);

  const scatterTarget = buildTargetBuffer(sampleScatter(count, mobile ? 32 : 38), count);
  const heartTarget = buildTargetBuffer(
    sampleHollowHeart(mobile ? 5500 : 8000, 0.38, textOpts.offsetY),
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
  let textWordIndex = 0;
  let timeline: gsap.core.Timeline | null = null;
  const particleMat = particles.mesh.material as THREE.ShaderMaterial;
  const uMaxPoint = particleMat.uniforms.uMaxPoint as { value: number };
  const uSizeMul = particleMat.uniforms.uSizeMul as { value: number };

  const morphTo = (target: Float32Array, duration: number, ease = "power3.inOut") =>
    gsap.to(
      { t: 0 },
      {
        t: 1,
        duration,
        ease,
        onStart() {
          fromBuf.set(particles.positions);
          toBuf.set(target);
          morphT = 0;
        },
        onUpdate() {
          morphT = (this.targets()[0] as { t: number }).t;
        },
      }
    );

  const runIntro = () => {
    if (reduced) {
      timeline = gsap.timeline({ onComplete: () => { phase = "heart"; } });
      for (let wi = 0; wi < TEXT_SEQUENCE.length; wi++) {
        const idx = wi;
        timeline.call(() => {
          textWordIndex = idx;
          holdText = true;
        });
        timeline.add(morphTo(textTargets[idx], 1.8, "power2.inOut"));
        timeline.to({}, { duration: 2 });
      }
      timeline.call(() => {
        holdText = false;
      });
      timeline.add(morphTo(heartTarget, 2.4, "power2.inOut"));
      return;
    }

    timeline = gsap.timeline({ onComplete: () => { phase = "heart"; } });

    const showWord = (wi: number, morphDur = 2.6, hold = 3.2) => {
      timeline!.call(() => {
        textWordIndex = wi;
        holdText = true;
      });
      timeline!.add(morphTo(textTargets[wi], morphDur, "power2.inOut"));
      timeline!.to({}, { duration: hold });
    };

    timeline.to({}, { duration: 0.4 });
    timeline.add(morphTo(scatterTarget, 1.2, "power2.out"));
    timeline.to({}, { duration: 0.25 });
    showWord(0, 2.8, 3.4);
    showWord(1, 2.8, 3.4);
    showWord(2, 2.8, 3.2);
    timeline.call(() => {
      holdText = false;
    });
    timeline.add(morphTo(heartTarget, 3, "power2.inOut"));
    timeline.to({}, { duration: 0.6 });
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
    const wiggleY = holdText ? 0.002 : phase === "heart" ? 0.006 : 0.004;
    const wiggleZ = holdText ? 0.001 : phase === "heart" ? 0.004 : 0.003;
    if (wiggleY > 0 || wiggleZ > 0) {
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        const x = pos[i3];
        const y = pos[i3 + 1];
        const z = pos[i3 + 2];
        pos[i3 + 1] = y + Math.sin(clock * 1.2 + x * 0.08 + i * 0.02) * wiggleY;
        pos[i3 + 2] = z + Math.sin(clock * 0.9 + y * 0.06) * wiggleZ;
      }
    }

    if (phase === "heart") {
      content.rotation.y += SCENE.rotationSpeed;
      content.rotation.x = Math.sin(clock * 0.35) * 0.14;
    } else if (holdText) {
      content.rotation.y = Math.sin(clock * 0.16) * 0.055;
      content.rotation.x = Math.sin(clock * 0.2) * 0.04;
    } else {
      content.rotation.y = Math.sin(clock * 0.2) * 0.04;
      content.rotation.x = Math.sin(clock * 0.15) * 0.03;
    }

    const sway = clock * 1000;
    camera.position.x = Math.sin(sway * 0.0002) * (holdText ? 2 : mobile ? 8 : 12);
    camera.position.y = camY + Math.sin(sway * 0.00015) * (holdText ? 0.6 : 2.5);
    camera.position.z = camZ + Math.sin(sway * 0.0001) * (holdText ? 1.5 : 5);
    camera.lookAt(0, lookY, 0);

    if (holdText) {
      applyWordColors(particles.colors, count, clock, textWordIndex, mobile ? 0.1 : 0.14, mobile);
    } else {
      const colorMode = phase === "heart" ? "heart" : "scatter";
      const shimmer = phase === "heart" ? (mobile ? 0.1 : 0.15) : 0.1;
      applyColors(particles.colors, count, clock, shimmer, colorMode, mobile);
    }
    particles.mesh.geometry.attributes.color.needsUpdate = true;

    uSizeMul.value = holdText || phase === "heart" ? 1 : 0.9;
    uMaxPoint.value = holdText || phase === "heart" ? (mobile ? 11 : 13) : mobile ? 9 : 10;

    particles.mesh.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  };

  animate();

  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const m = window.matchMedia("(max-width: 768px)").matches;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.y = m ? SCENE.cameraYMobile : SCENE.cameraY;
    content.position.y = contentAnchorY(m);
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  return {
    dispose: () => {
      alive = false;
      timeline?.kill();
      gsap.killTweensOf({ t: 0 });
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      particles.mesh.geometry.dispose();
      (particles.mesh.material as THREE.Material).dispose();
    },
  };
}
