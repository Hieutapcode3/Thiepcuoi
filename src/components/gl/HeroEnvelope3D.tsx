"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, easeInOutCubic, easeOutCubic, easeOutBack, clamp01 } from "@/lib/gl/stage";
import { drawCover, loadImage, makeCanvas, silhouette, toTexture, withShadow } from "@/lib/gl/textures";
import { getTilt } from "@/lib/gl/tilt";
import { prefersReducedMotion } from "@/lib/gl/support";

// Đơn vị thế giới: bề ngang phong bì = 1. Mọi số đo lấy từ ảnh gốc (1013 px ngang).
const IMG_W = 1013;
const ENV_H = 1168 / IMG_W; // chiều cao phong bì
const HINGE_ROW = 512; // hàng ảnh nơi nắp phong bì gập
const FLAP_ROWS = 514;
const COVER_H = 668 / IMG_W;
const PAD_X = 0.24; // canvas rộng hơn phong bì mỗi bên 24% / trên dưới 20% để chứa hoa và nắp khi bật ra
const PAD_Y = 0.2;
const FOV = 22;

const yAt = (row: number) => ENV_H / 2 - row / IMG_W;

type Props = {
  photo: string; alt: string; onFail: () => void;
  /** chừng nào gate.current = false thì phong bì còn đóng (dùng cho hiệu ứng chuyển cảnh) */
  gate?: { current: boolean };
  speed?: number;
  /** canvas đang bị CSS phóng to bao nhiêu lần → vẽ nét hơn tương ứng */
  resScale?: { current: number };
  /** gọi khi khung hình đầu tiên đã vẽ xong */
  onReady?: () => void;
  /** gọi khi phong bì đã mở xong (ảnh trượt lên hết) */
  onOpened?: () => void;
};

/**
 * Phong bì 3D: nắp phong bì (có con dấu sáp) lật mở → ảnh cưới trượt lên từ trong phong bì → hoa hiện ra.
 * Các lớp nằm ở độ sâu khác nhau nên nghiêng theo chuột / con quay sẽ thấy chiều sâu (thị sai).
 * Bố cục khi nghỉ khớp từng pixel với bản HTML cũ.
 */
export default function HeroEnvelope3D({ photo, alt, onFail, gate, speed = 1, onReady, resScale, onOpened }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let stage: ReturnType<typeof createStage> | null = null;
    const reduced = prefersReducedMotion();

    (async () => {
      const [bodyI, flapI, coverI, sealI, flowerI, photoI] = await Promise.all([
        loadImage("/art/envelope-body.webp"),
        loadImage("/art/envelope-flap.webp"),
        loadImage("/art/envelope-cover.webp"),
        loadImage("/art/envelope-seal.webp"),
        loadImage("/art/flower2-decoration.webp"),
        loadImage(photo),
      ]);
      if (dead) return;

      const st = createStage(canvas, { fov: FOV, maxDpr: 2 });
      stage = st;
      const { renderer, scene, camera } = st;
      renderer.localClippingEnabled = true;

      const V = (1 + PAD_Y * 2) * ENV_H; // chiều cao thế giới nhìn thấy được tại z = 0
      const D = V / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.set(0, 0, D);

      const rig = new THREE.Group();
      scene.add(rig);
      const unit = new THREE.PlaneGeometry(1, 1);
      const mk = (tex: THREE.Texture, order: number, extra: Partial<THREE.MeshBasicMaterialParameters> = {}) => {
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, ...extra });
        const m = new THREE.Mesh(unit, mat);
        m.renderOrder = order;
        return m;
      };
      /** đặt một mặt phẳng tại (cx, cy) với kích thước (w, h) ở độ sâu z, bù thị sai để bố cục khi nghỉ y hệt bản phẳng */
      const place = (m: THREE.Object3D, cx: number, cy: number, w: number, h: number, z: number, rotZ = 0) => {
        const k = (D - z) / D;
        m.position.set(cx * k, cy * k, z);
        m.scale.set(w * k, h * k, 1);
        m.rotation.z = rotZ;
      };

      // ---- thân phong bì (đã tách nắp) ----
      const bodyH = (1168 - HINGE_ROW) / IMG_W;
      const body = mk(toTexture(bodyI), 0);
      place(body, 0, yAt(HINGE_ROW + (1168 - HINGE_ROW) / 2), 1, bodyH, 0);
      rig.add(body);

      // ---- nắp phong bì: bản lề tại hàng 512 ----
      const flapL = FLAP_ROWS / IMG_W;
      const pivot = new THREE.Group();
      rig.add(pivot);
      const flapInTex = toTexture(flapI);
      const flapIn = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ map: flapInTex, transparent: true, depthWrite: false, side: THREE.FrontSide }));
      const outerCanvas = silhouette(flapI, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#6e222b");
        g.addColorStop(0.55, "#5a1a22");
        g.addColorStop(1, "#4b1219");
        return g;
      });
      const flapOut = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ map: toTexture(outerCanvas), transparent: true, depthWrite: false, side: THREE.BackSide }));
      for (const f of [flapIn, flapOut]) {
        f.scale.set(1, flapL, 1);
        f.position.set(0, flapL / 2 - 2 / IMG_W, 0);
        pivot.add(f);
      }
      // con dấu sáp nằm ở mặt ngoài, gần đỉnh nắp
      const seal = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ map: toTexture(sealI), transparent: true, depthWrite: false, side: THREE.FrontSide }));
      seal.scale.set(sealI.naturalWidth / IMG_W, sealI.naturalHeight / IMG_W, 1);
      seal.position.set(0, flapL - 0.2, -0.004);
      seal.rotation.y = Math.PI;
      pivot.add(seal);

      // ---- ảnh cưới (khung trắng + bóng) ----
      const PW = 0.585;
      const PH = 0.728 * ENV_H;
      const S = Math.min(1900, Math.max(1100, photoI.naturalWidth / PW)); // độ phân giải khung ảnh: theo ảnh gốc (nét khi phóng to)
      const pad = 40;
      const pc = makeCanvas(PW * S + pad * 2, PH * S + pad * 2);
      pc.ctx.shadowColor = "rgba(56,10,14,.38)";
      pc.ctx.shadowBlur = 26;
      pc.ctx.shadowOffsetY = 10;
      pc.ctx.fillStyle = "#fff";
      pc.ctx.fillRect(pad, pad, PW * S, PH * S);
      pc.ctx.shadowColor = "transparent";
      const inset = 0.0285 * PW * S;
      drawCover(pc.ctx, photoI, pad + inset, pad + inset, PW * S - inset * 2, PH * S - inset * 2);
      const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const photoMesh = mk(toTexture(pc.c), 1, { clippingPlanes: [clip] });
      const PZ = 0.07;
      const PCX = -0.5 + 0.356 + PW / 2;
      const PCY = ENV_H / 2 - PH / 2;
      const PROT = -THREE.MathUtils.degToRad(12);
      const PSW = (PW * S + pad * 2) / S;
      const PSH = (PH * S + pad * 2) / S;
      place(photoMesh, PCX, PCY, PSW, PSH, PZ, PROT);
      rig.add(photoMesh);

      // ---- hoa ----
      const fc = withShadow(flowerI, 26, 14, 18, 16, "rgba(0,0,0,.3)");
      const flower = mk(toTexture(fc), 2);
      rig.add(flower);
      const fAspect = flowerI.naturalWidth / flowerI.naturalHeight;
      const FZ = 0.11;
      let fl = { cx: 0, cy: 0, w: 0, h: 0, rot: 0 };
      const layoutFlower = () => {
        const md = window.innerWidth >= 768;
        const h = (md ? 0.75 : 0.87) * ENV_H;
        const w = h * fAspect;
        const left = md ? 0 : -0.022;
        const top = md ? -0.1 : -0.123;
        fl = { cx: -0.5 + left + w / 2, cy: ENV_H / 2 - top * ENV_H - h / 2, w, h, rot: md ? 0 : THREE.MathUtils.degToRad(17) };
      };
      layoutFlower();
      st.onResize = layoutFlower;
      const padKx = 1 + 52 / flowerI.naturalWidth; // phần đệm của bóng
      const padKy = 1 + 52 / flowerI.naturalHeight;

      // ---- mặt tiền phong bì (có bóng) ----
      const cc = withShadow(coverI, 48, 0, 14, 24, "rgba(56,10,14,.35)");
      const cover = mk(toTexture(cc), 3);
      const CZ = 0.15;
      place(cover, 0, -ENV_H / 2 + COVER_H / 2, (cc.width) / IMG_W, (cc.height) / IMG_W, CZ);
      rig.add(cover);

      // ---- khung hình ----
      const tilt = getTilt();
      let tx = 0, ty = 0;
      let start = -1;
      const T_FLAP = 0.35, D_FLAP = 1.0;
      const T_PHOTO = 1.05, D_PHOTO = 1.35;
      const T_FLOWER = 1.5, D_FLOWER = 0.9;
      const DROP = 0.95;
      const nrm = new THREE.Vector3();
      const pt = new THREE.Vector3();
      let readySent = false;
      let openedSent = false;
      st.onFrame = (dt, t) => {
        if (resScale) st.setResScale(resScale.current);
        if (start < 0 && (!gate || gate.current)) start = t;
        const a = reduced ? 99 : start < 0 ? 0 : (t - start) * speed;
        if (!openedSent && a >= T_PHOTO + D_PHOTO) { openedSent = true; setTimeout(() => { if (!dead) onOpened?.(); }, 0); }
        if (!readySent) { readySent = true; setTimeout(() => { if (!dead) onReady?.(); }, 0); }

        // nắp: π (đóng, phủ lên mặt tiền) → 0 (mở phẳng phía sau)
        const pf = easeInOutCubic(clamp01((a - T_FLAP) / D_FLAP));
        const th = Math.PI * (1 - pf);
        const fz = 0.2 * (1 - pf) + 0.001;
        const fk = (D - fz) / D;
        pivot.position.set(0, yAt(HINGE_ROW) * fk, fz);
        pivot.scale.setScalar(fk);
        pivot.rotation.x = th;
        const shade = 1 - 0.38 * Math.sin(th);
        (flapIn.material as THREE.MeshBasicMaterial).color.setScalar(shade);
        (flapOut.material as THREE.MeshBasicMaterial).color.setScalar(shade);
        const fo = th > Math.PI / 2 ? 5 : 0.5;
        flapIn.renderOrder = fo; flapOut.renderOrder = fo; seal.renderOrder = fo + 0.1;

        // ảnh: trượt lên từ trong phong bì
        const pp = clamp01((a - T_PHOTO) / D_PHOTO);
        const ease = easeOutBack(pp, 0.55);
        place(photoMesh, PCX, PCY - (1 - ease) * DROP, PSW, PSH, PZ, PROT + (1 - ease) * 0.1);

        // hoa: hiện dần + đung đưa (cùng nhịp CSS cũ: 4.6s, ±1.6°, nhấc 7px)
        const fp = easeOutCubic(clamp01((a - T_FLOWER) / D_FLOWER));
        const sw = Math.sin((t / 4.6) * Math.PI * 2 - Math.PI / 2); // -1..1, khởi đầu ở -1
        const swing = reduced ? 0 : sw * THREE.MathUtils.degToRad(1.6);
        const bob = reduced ? 0 : (sw + 1) / 2 * 0.0167;
        const sc = 0.9 + 0.1 * fp;
        place(flower, fl.cx, fl.cy + bob - (1 - fp) * 0.05, fl.w * padKx * sc, fl.h * padKy * sc, FZ, fl.rot - swing);
        (flower.material as THREE.MeshBasicMaterial).opacity = fp;

        // nghiêng theo chuột / con quay
        if (!reduced) {
          tx += (tilt.x - tx) * Math.min(1, dt * 4);
          ty += (tilt.y - ty) * Math.min(1, dt * 4);
        }
        rig.rotation.y = tx * 0.2;
        rig.rotation.x = ty * 0.13;
        rig.position.y = reduced ? 0 : Math.sin(t * 0.9) * 0.006;
        rig.updateMatrixWorld(true);

        // mặt cắt: ảnh chỉ hiện phía trên mép dưới phong bì (cắt theo khối phong bì đang nghiêng)
        const kP = (D - PZ) / D;
        nrm.set(0, 1, 0).applyQuaternion(rig.quaternion);
        pt.set(0, (-ENV_H / 2 + 0.012) * kP, PZ);
        rig.localToWorld(pt);
        clip.setFromNormalAndCoplanarPoint(nrm, pt);
      };
    })().catch(() => { if (!dead) onFail(); });

    return () => {
      dead = true;
      stage?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className="pointer-events-none absolute"
      style={{ left: `${-PAD_X * 100}%`, top: `${-PAD_Y * 100}%`, width: `${(1 + PAD_X * 2) * 100}%`, height: `${(1 + PAD_Y * 2) * 100}%` }}
    />
  );
}
