"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, easeInOutCubic, clamp01 } from "@/lib/gl/stage";
import { loadImage, silhouette, toTexture } from "@/lib/gl/textures";

const W = 335;
const H = 330;
const FOV = 20;
const PAD = 140; // canvas rộng hơn nút mỗi phía 140px để bao lì xì bay ra ngoài khung khi lật
const IMG = "/art/minimalism_darkred.png";

type Props = { flipping: boolean; onFail: () => void };

/**
 * Hai bao lì xì 3D (cùng bố cục với bản ảnh phẳng 335×330). Lơ lửng nhẹ, nghiêng theo con trỏ,
 * và khi bấm thì cả hai lật 360° với hiệu ứng bật lên.
 */
export default function GiftEnvelopes3D({ flipping, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flipFlag = useRef(false);
  flipFlag.current = flipping;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let stage: ReturnType<typeof createStage> | null = null;
    let cleanup = () => {};

    (async () => {
      const img = await loadImage(IMG);
      if (dead) return;
      const st = createStage(canvas, { fov: FOV, maxDpr: 2 });
      stage = st;
      const { scene, camera } = st;
      const dist = (H + PAD * 2) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.set(0, 0, dist);
      camera.far = dist * 4;
      camera.updateProjectionMatrix();

      const front = toTexture(img, 8);
      const backCanvas = silhouette(img, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#7a2530");
        g.addColorStop(1, "#4a121a");
        return g;
      });
      const backTex = toTexture(backCanvas, 8);
      const geo = new THREE.PlaneGeometry(1, 1);

      // Mỗi bao gồm một mặt trước và một mặt sau dựng lưng vào nhau
      const mirrorTex = (t: THREE.Texture) => { const c = t.clone(); c.repeat.x = -1; c.offset.x = 1; c.needsUpdate = true; return c; };
      const make = (w: number, h: number, cx: number, cy: number, rotZ: number, order: number, mirror = false) => {
        const g = new THREE.Group();
        const f = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: mirror ? mirrorTex(front) : front, transparent: true, depthWrite: false, side: THREE.FrontSide }));
        const b = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: mirror ? mirrorTex(backTex) : backTex, transparent: true, depthWrite: false, side: THREE.BackSide }));
        f.scale.set(w, h, 1); b.scale.set(w, h, 1);
        f.renderOrder = order; b.renderOrder = order;
        g.add(f, b);
        g.position.set(cx - W / 2, H / 2 - cy, 0);
        g.rotation.z = rotZ;
        scene.add(g);
        return { g, f, b, base: { x: g.position.x, y: g.position.y, rz: rotZ } };
      };
      // Số đo khớp bản CSS: ảnh 420×659 được object-contain trong khung
      const cont = (bw: number, bh: number) => { const s = Math.min(bw / 420, bh / 659); return [420 * s, 659 * s] as const; };
      const [mw, mh] = cont(190, 275);
      const [kw, kh] = cont(204, 252);
      const back = make(kw, kh, 132 + 204 / 2, 38 + 252 / 2, 0, 1, true); // lật gương: bao sau ngả sang phải
      const main = make(mw, mh, 24 + 190 / 2, 22 + 275 / 2, THREE.MathUtils.degToRad(10), 2);

      // ---- con trỏ ----
      const host = canvas.parentElement ?? canvas;
      let px = 0, py = 0, tpx = 0, tpy = 0;
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        tpx = ((e.clientX - r.left) / r.width) * 2 - 1;
        tpy = ((e.clientY - r.top) / r.height) * 2 - 1;
      };
      const onLeave = () => { tpx = 0; tpy = 0; };
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      cleanup = () => { host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); };

      const FLIP = 1.05;
      let t0 = -1;
      st.onFrame = (dt, t) => {
        px += (tpx - px) * Math.min(1, dt * 6);
        py += (tpy - py) * Math.min(1, dt * 6);
        if (flipFlag.current && t0 < 0) t0 = t;
        if (!flipFlag.current) t0 = -1;
        const p = t0 < 0 ? 0 : clamp01((t - t0) / FLIP);
        const e = easeInOutCubic(p);
        const pop = Math.sin(Math.PI * p); // 0 → 1 → 0
        // bao sau xoay NGƯỢC chiều bao trước, bay lệch sang bên kia và trễ một nhịp
        const pb = clamp01((t - (t0 < 0 ? t : t0) - 0.12) / FLIP);
        const eb = t0 < 0 ? 0 : easeInOutCubic(pb);
        const popb = Math.sin(Math.PI * pb);
        const sets: [typeof main, number, number, number, number, number][] = [
          [back, -1, -1.2, eb, popb, 110],
          [main, 1, 0, e, pop, -60],
        ];
        for (const [o, dir, delay, ee, pp, dx] of sets) {
          const bob = Math.sin((t + delay) * 2.1) * 5; // 5px, chu kỳ ~3s như bản CSS
          o.g.position.set(o.base.x + pp * dx, o.base.y + bob + pp * 70, pp * 180);
          o.g.rotation.y = dir * Math.PI * 2 * ee + px * 0.28;
          o.g.rotation.x = py * 0.18 + pp * 0.15;
          o.g.rotation.z = o.base.rz + dir * pp * 0.42; // bao trước ngả trái, bao sau ngả hẳn sang phải
          o.g.scale.setScalar(1 + pp * 0.2);
          // tối dần khi quay nghiêng cho có khối
          const c = 1 - 0.28 * Math.abs(Math.sin(o.g.rotation.y));
          (o.f.material as THREE.MeshBasicMaterial).color.setScalar(c);
          (o.b.material as THREE.MeshBasicMaterial).color.setScalar(c);
        }
      };
    })().catch(() => { if (!dead) onFail(); });

    return () => {
      dead = true;
      cleanup();
      stage?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute" style={{ left: -PAD, top: -PAD, width: W + PAD * 2, height: H + PAD * 2 }} />;
}
