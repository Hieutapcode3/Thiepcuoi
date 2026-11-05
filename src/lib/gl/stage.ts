import * as THREE from "three";

export type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  /** kích thước CSS hiện tại của canvas */
  size: { w: number; h: number };
  /** gọi mỗi khi đổi kích thước (và 1 lần ngay khi tạo) */
  onResize: ((w: number, h: number) => void) | null;
  /** gọi mỗi khung hình; dt tính bằng giây, t là tổng thời gian */
  onFrame: ((dt: number, t: number) => void) | null;
  dispose: () => void;
};

type Options = { fov?: number; maxDpr?: number; antialias?: boolean; shadows?: boolean };

/**
 * Tạo renderer + vòng lặp vẽ cho một canvas. Tự động:
 *  - theo kích thước canvas (ResizeObserver), giới hạn pixel ratio cho nhẹ máy
 *  - tạm dừng khi canvas ra khỏi màn hình hoặc tab bị ẩn
 *  - giải phóng toàn bộ GPU resource khi dispose()
 */
export function createStage(canvas: HTMLCanvasElement, opts: Options = {}): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: opts.antialias ?? true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2));
  if (opts.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 35, 1, 0.1, 100);

  const stage: Stage = { renderer, scene, camera, canvas, size: { w: 1, h: 1 }, onResize: null, onFrame: null, dispose: () => {} };

  const resize = () => {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    if (w === stage.size.w && h === stage.size.h && renderer.domElement.width > 1) return;
    stage.size = { w, h };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stage.onResize?.(w, h);
  };

  let raf = 0;
  let last = performance.now();
  let t = 0;
  let inView = true;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!inView || document.hidden) return;
    t += dt;
    stage.onFrame?.(dt, t);
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "80px" });
  io.observe(canvas);
  const onLost = (e: Event) => e.preventDefault();
  canvas.addEventListener("webglcontextlost", onLost);

  resize();
  raf = requestAnimationFrame(tick);

  stage.dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    disposeScene(scene);
    // Không forceContextLoss: React StrictMode (dev) gắn lại cùng một <canvas>, context đã mất sẽ không dùng lại được
    renderer.dispose();
  };
  return stage;
}

/** Giải phóng geometry, material và texture trong cả cây đối tượng */
export function disposeScene(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat as unknown as Record<string, unknown>)) {
        if (v instanceof THREE.Texture) v.dispose();
      }
      mat.dispose();
    }
  });
}

/** Chiều cao nhìn thấy được tại mặt phẳng cách camera `dist` */
export function visibleHeight(fovDeg: number, dist: number) {
  return 2 * dist * Math.tan(THREE.MathUtils.degToRad(fovDeg / 2));
}

export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeOutBack = (p: number, s = 1.5) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
