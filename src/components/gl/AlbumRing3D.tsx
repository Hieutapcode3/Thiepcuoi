"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, clamp01 } from "@/lib/gl/stage";
import { drawCover, loadImage, makeCanvas, roundRectPath, toTexture } from "@/lib/gl/textures";

type Props = {
  photos: string[];
  index: number;
  /** người dùng kéo / bấm làm đổi ảnh đang ở giữa */
  onIndex: (i: number) => void;
  /** bấm vào ảnh đang ở giữa → mở xem lớn */
  onOpen: (i: number) => void;
  /** chuột đang kéo/di chuột trên vòng → tạm dừng tự chuyển */
  onHold: (held: boolean) => void;
  onFail: () => void;
};

const FOV = 30;
const CARD_H = 1;
const CARD_W = 0.664;
const TWO_PI = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/**
 * Album dạng vòng quay 3D: ảnh xếp quanh một vòng tròn, kéo ngang để xoay (có quán tính và tự hít về ảnh gần nhất),
 * bấm ảnh bên cạnh để xoay tới, bấm ảnh giữa để xem lớn.
 */
export default function AlbumRing3D({ photos, index, onIndex, onOpen, onHold, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctl = useRef<{ snapTo: (i: number) => void; getIndex: () => number } | null>(null);
  const cb = useRef({ onIndex, onOpen, onHold });
  cb.current = { onIndex, onOpen, onHold };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let stage: ReturnType<typeof createStage> | null = null;
    const n = photos.length;
    const step = TWO_PI / n;
    let cleanup: () => void = () => {};

    (async () => {
      const imgs = await Promise.all(photos.map(loadImage));
      if (dead) return;
      const st = createStage(canvas, { fov: FOV, maxDpr: 2 });
      stage = st;
      const { scene, camera } = st;

      // ---- thẻ ảnh bo góc ----
      const TW = 520;
      const TH = Math.round(TW / CARD_W * CARD_H);
      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
      const cards: THREE.Mesh[] = [];
      imgs.forEach((img, i) => {
        const { c, ctx } = makeCanvas(TW, TH);
        roundRectPath(ctx, 0, 0, TW, TH, 34);
        ctx.save();
        ctx.clip();
        drawCover(ctx, img, 0, 0, TW, TH);
        ctx.restore();
        roundRectPath(ctx, 1.5, 1.5, TW - 3, TH - 3, 33);
        ctx.strokeStyle = "rgba(255,255,255,.55)";
        ctx.lineWidth = 3;
        ctx.stroke();
        const mat = new THREE.MeshBasicMaterial({ map: toTexture(c, 8), transparent: true, side: THREE.DoubleSide, alphaTest: 0.02 });
        const m = new THREE.Mesh(geo, mat);
        m.userData.i = i;
        scene.add(m);
        cards.push(m);
      });

      // bóng mờ dưới vòng quay
      const sh = makeCanvas(256, 256);
      const g = sh.ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, "rgba(40,6,10,.45)");
      g.addColorStop(1, "rgba(40,6,10,0)");
      sh.ctx.fillStyle = g;
      sh.ctx.fillRect(0, 0, 256, 256);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: toTexture(sh.c), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -CARD_H / 2 - 0.08;
      scene.add(shadow);

      // ---- hình học vòng ----
      const R = Math.max(1.0, (CARD_W * 1.2) / (2 * Math.sin(Math.PI / n)));
      const viewH = CARD_H / 0.9;
      const camDist = viewH / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.set(0, 0.02, R + camDist);

      // ---- trạng thái xoay ----
      let rot = -index * step; // góc hiện tại (rad): ảnh i ở giữa khi rot = -i * step
      let target = rot;
      let curIdx = index;
      let vel = 0;
      let dragging = false;
      let lastX = 0, lastT = 0, downX = 0, downT = 0, moved = 0;

      const idxFor = (r: number) => (((Math.round(-r / step) % n) + n) % n);
      const snapTo = (i: number) => {
        const t0 = -i * step;
        const k = Math.round((target - t0) / TWO_PI);
        target = t0 + k * TWO_PI;
        curIdx = i;
      };
      ctl.current = { snapTo, getIndex: () => curIdx };

      // ---- thao tác kéo ----
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const pxToRad = () => step / Math.max(120, st.size.w * 0.5);
      const onDown = (e: PointerEvent) => {
        dragging = true; moved = 0; vel = 0;
        lastX = downX = e.clientX; lastT = downT = performance.now();
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
        cb.current.onHold(true);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const now = performance.now();
        moved += Math.abs(dx);
        rot += dx * pxToRad();
        target = rot;
        vel = (dx * pxToRad()) / Math.max(1, now - lastT) * 1000;
        lastX = e.clientX; lastT = now;
      };
      const finish = (e: PointerEvent, cancelled: boolean) => {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = "grab";
        try { canvas.releasePointerCapture(e.pointerId); } catch { /* đã nhả */ }
        const isClick = !cancelled && moved < 6 && performance.now() - downT < 450;
        if (isClick) {
          const r = canvas.getBoundingClientRect();
          ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
          ray.setFromCamera(ndc, camera);
          const hit = ray.intersectObjects(cards, false).find((h) => ((h.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity > 0.3);
          if (hit) {
            const i = hit.object.userData.i as number;
            if (i === curIdx) cb.current.onOpen(i);
            else { snapTo(i); cb.current.onIndex(i); }
          }
          return;
        }
        // thả tay: cộng quán tính rồi hít về ảnh gần nhất
        const proj = rot + Math.max(-step * 1.6, Math.min(step * 1.6, vel * 0.3));
        const i = idxFor(proj);
        snapTo(i);
        target = Math.round(proj / step) * step;
        cb.current.onIndex(i);
      };
      const onUp = (e: PointerEvent) => finish(e, false);
      const onCancel = (e: PointerEvent) => finish(e, true);
      const onEnter = () => cb.current.onHold(true);
      const onLeave = () => { if (!dragging) cb.current.onHold(false); };
      canvas.style.cursor = "grab";
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onCancel);
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointerleave", onLeave);
      cleanup = () => {
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onCancel);
        canvas.removeEventListener("pointerenter", onEnter);
        canvas.removeEventListener("pointerleave", onLeave);
      };

      // ---- khung hình ----
      const appear = { t: 0 };
      st.onFrame = (dt, t) => {
        appear.t += dt;
        if (!dragging) {
          rot += (target - rot) * (1 - Math.exp(-5.5 * dt));
        }
        const intro = clamp01(appear.t / 1.0);
        for (let i = 0; i < n; i++) {
          const phi = i * step + rot;
          const m = cards[i];
          m.position.set(Math.sin(phi) * R, Math.sin(t * 0.8 + i * 1.3) * 0.012, Math.cos(phi) * R);
          m.rotation.y = Math.atan2(Math.sin(phi), Math.cos(phi)) * 0.6; // xoay một phần về phía người xem (kiểu cover-flow)
          const face = (Math.cos(phi) + 1) / 2; // 1 = đối diện người xem
          const mat = m.material as THREE.MeshBasicMaterial;
          mat.color.setScalar(0.42 + 0.58 * Math.pow(face, 1.4));
          mat.opacity = smooth(0.18, 0.62, face) * intro; // nửa sau vòng quay mờ dần, không rối mắt
          m.renderOrder = Math.round(face * 10);
          m.scale.setScalar(0.85 + 0.15 * intro);
        }
      };
    })().catch(() => { if (!dead) onFail(); });

    return () => {
      dead = true;
      cleanup();
      ctl.current = null;
      stage?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.join("|")]);

  // nút ‹ › và chấm tròn bên ngoài đổi chỉ mục → xoay vòng tới ảnh đó
  useEffect(() => {
    const c = ctl.current;
    if (c && c.getIndex() !== index) c.snapTo(index);
  }, [index]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Album ảnh cưới — kéo ngang để xoay"
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: "pan-y" }}
    />
  );
}
