import * as THREE from "three";
import { createEngine, type Tier } from "./engine";
import { buildSceneGeometry } from "./geometry";
import { pointVertex, pointFragment, lineVertex, lineFragment } from "./shaders";

export interface HeroScene {
  /** 0 = board · 1 = wireless mesh · 2 = dashboard. Fractional values morph. */
  setStage(value: number): void;
  setOpacity(value: number): void;
  dispose(): void;
}

/** Per-stage camera framing — the board sits back, the mesh pulls you in. */
const CAM_Z = [20.5, 17.5, 21.5];
const ROT_X = [-0.2, -0.05, -0.015];
const ROT_Y = [0.08, 0.0, 0.0];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Piecewise lerp across the three stage keyframes. */
function stageValue(values: number[], stage: number) {
  const s = Math.max(0, Math.min(2, stage));
  const i = Math.min(1, Math.floor(s));
  return lerp(values[i], values[i + 1], s - i);
}

export function createHeroScene(canvas: HTMLCanvasElement, tier: Tier): HeroScene {
  const count = tier === "high" ? 26000 : 9000;
  const segCount = tier === "high" ? 1500 : 700;
  const geo = buildSceneGeometry(count, segCount);

  const uniforms = {
    uTime: { value: 0 },
    uStage: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerPower: { value: 0 },
    uOpacity: { value: 0 },
    uPixelRatio: { value: 1 },
    uScale: { value: tier === "high" ? 1 : 1.25 },
    uColorA: { value: new THREE.Color("#5b8cff") },
    uColorB: { value: new THREE.Color("#2dd4bf") },
  };

  /* Points ------------------------------------------------------------- */
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute("position", new THREE.BufferAttribute(geo.pos0, 3));
  pointGeo.setAttribute("aPos1", new THREE.BufferAttribute(geo.pos1, 3));
  pointGeo.setAttribute("aPos2", new THREE.BufferAttribute(geo.pos2, 3));
  pointGeo.setAttribute("aRand", new THREE.BufferAttribute(geo.rand, 3));
  pointGeo.setAttribute("aMeta", new THREE.BufferAttribute(geo.meta, 2));
  pointGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  const pointMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  /* Lines -------------------------------------------------------------- */
  const lineRand = new Float32Array(segCount * 2 * 3);
  for (let i = 0; i < lineRand.length; i++) lineRand[i] = 0.5;

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(geo.linePos0, 3));
  lineGeo.setAttribute("aPos1", new THREE.BufferAttribute(geo.linePos1, 3));
  lineGeo.setAttribute("aPos2", new THREE.BufferAttribute(geo.linePos2, 3));
  lineGeo.setAttribute("aFlow", new THREE.BufferAttribute(geo.lineFlow, 3));
  lineGeo.setAttribute("aRand", new THREE.BufferAttribute(lineRand, 3));
  lineGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  const lineMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
  group.add(new THREE.Points(pointGeo, pointMat));
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  /* Engine ------------------------------------------------------------- */
  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerNdc = new THREE.Vector2(0, 0);
  const pointerSmooth = new THREE.Vector2(0, 0);
  let pointerPowerTarget = 0;
  let stage = 0;
  let stageSmooth = 0;
  let opacityTarget = 0;
  let idleTime = 99;

  const engine = createEngine({
    canvas,
    tier,
    onResize: () => {
      uniforms.uPixelRatio.value = engine.renderer.getPixelRatio();
    },
    onFrame: (elapsed, delta) => {
      const k = 1 - Math.pow(0.001, delta);

      // Idle drift keeps touch devices (and idle desktops) alive.
      idleTime += delta;
      if (idleTime > 2.5) {
        pointerNdc.set(Math.sin(elapsed * 0.13) * 0.55, Math.cos(elapsed * 0.09) * 0.4);
        pointerPowerTarget = 0.45;
      }

      const { halfWidth, halfHeight } = engine.viewSize();
      pointerTarget.set(pointerNdc.x * halfWidth, pointerNdc.y * halfHeight);
      pointerSmooth.lerp(pointerTarget, k);
      uniforms.uPointer.value.copy(pointerSmooth);
      uniforms.uPointerPower.value = lerp(
        uniforms.uPointerPower.value,
        pointerPowerTarget,
        k
      );

      stageSmooth = lerp(stageSmooth, stage, 1 - Math.pow(0.004, delta));
      uniforms.uStage.value = stageSmooth;
      uniforms.uTime.value = elapsed;
      uniforms.uOpacity.value = lerp(uniforms.uOpacity.value, opacityTarget, k * 0.6);

      // Fully faded out (scrolled past the story) — stop burning frames.
      if (opacityTarget < 0.004 && uniforms.uOpacity.value < 0.006) {
        uniforms.uOpacity.value = 0;
        engine.stop();
        return;
      }

      const weightMesh = 1 - Math.abs(stageSmooth - 1);
      group.rotation.x = lerp(
        group.rotation.x,
        stageValue(ROT_X, stageSmooth) + pointerNdc.y * 0.07,
        k
      );
      group.rotation.y = lerp(
        group.rotation.y,
        stageValue(ROT_Y, stageSmooth) -
          pointerNdc.x * 0.1 +
          Math.sin(elapsed * 0.11) * 0.14 * Math.max(0, weightMesh),
        k
      );
      engine.camera.position.z = lerp(
        engine.camera.position.z,
        stageValue(CAM_Z, stageSmooth),
        k
      );
    },
  });

  engine.scene.add(group);
  uniforms.uPixelRatio.value = engine.renderer.getPixelRatio();

  const onPointerMove = (e: PointerEvent) => {
    idleTime = 0;
    pointerNdc.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1)
    );
    pointerPowerTarget = 1;
  };
  const onPointerLeave = () => {
    pointerPowerTarget = 0.3;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });

  return {
    setStage(value) {
      stage = Math.max(0, Math.min(2, value));
    },
    setOpacity(value) {
      opacityTarget = Math.max(0, Math.min(1, value));
      if (opacityTarget > 0.004) engine.start();
    },
    dispose() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      engine.dispose();
      pointGeo.dispose();
      lineGeo.dispose();
      pointMat.dispose();
      lineMat.dispose();
    },
  };
}
