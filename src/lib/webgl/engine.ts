import * as THREE from "three";
import type { Tier } from "./tier";

export type { Tier };

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** Element whose visibility gates the render loop. Defaults to the canvas. */
  observe?: HTMLElement;
  tier: Tier;
  onFrame: (elapsed: number, delta: number) => void;
  onResize?: (width: number, height: number) => void;
}

export interface Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** World half-extents at z = 0, useful for mapping pointer coords. */
  viewSize: () => { halfWidth: number; halfHeight: number };
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

export function createEngine(options: EngineOptions): Engine {
  const { canvas, tier, onFrame, onResize } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  const maxDpr = tier === "high" ? 1.75 : 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  camera.position.set(0, 0, 20);

  /** Own accumulator: survives pauses without jumping shader time. */
  let elapsed = 0;
  let last = 0;
  let frame = 0;
  let running = false;
  let visible = true;

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    onResize?.(width, height);
  };

  const viewSize = () => {
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
    return { halfHeight, halfWidth: halfHeight * camera.aspect };
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += delta;
    onFrame(elapsed, delta);
    renderer.render(scene, camera);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frame);
  };

  const syncRunning = () => {
    if (visible && document.visibilityState === "visible") start();
    else stop();
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      syncRunning();
    },
    { threshold: 0 }
  );
  observer.observe(options.observe ?? canvas);

  const onVisibility = () => syncRunning();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", resize);
  resize();

  return {
    renderer,
    scene,
    camera,
    viewSize,
    start,
    stop,
    dispose() {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
