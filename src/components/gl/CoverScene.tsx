"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createStage, visibleHeight, easeOutCubic, clamp01 } from "@/lib/gl/stage";
import { makeHeartGeometry, makePetalGeometry } from "@/lib/gl/shapes";
import { makeDust } from "@/lib/gl/dust";
import { getTilt } from "@/lib/gl/tilt";
import { isSmallScreen } from "@/lib/gl/support";

type Props = {
  opening: boolean;
  /** vị trí con dấu (px, toạ độ trình duyệt) — tâm vụ nổ */
  origin: { x: number; y: number };
  /** tấm thiệp: tim bay quanh thiệp, tránh nằm khuất sau thiệp */
  cardRef: { current: HTMLElement | null };
  onFail: () => void;
};

const COLORS = { gold: 0xc9a24a, wine: 0x9a2230, rose: 0xd98a92, cream: 0xf3e8de, deep: 0x6e1a20 };
const BURST_DELAY = 0.5; // giây kể từ lúc bấm (khớp nhịp con dấu vỡ)

type Floater = { m: THREE.Mesh; base: THREE.Vector3; size: number; ph: number; spin: number; bob: THREE.Vector2; born: number; vel: THREE.Vector3 };
type Particle = { m: THREE.Mesh; v: THREE.Vector3; spin: THREE.Vector3; life: number; age: number; size: number; grav: number };

/**
 * Bìa thiệp 3D: tim kim loại/lụa lơ lửng + xoay, có ánh sáng, phản chiếu và bóng đổ lên "bức tường" phía sau.
 * Khi bấm "Mở thiệp": tim cũ văng ra, thêm tim và cánh hoa bắn tung từ con dấu về phía người xem.
 */
export default function CoverScene({ opening, origin, cardRef, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ burst: (ox: number, oy: number) => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(canvas, { fov: 38, maxDpr: 2, shadows: true });
    } catch {
      onFail();
      return;
    }
    const { renderer, scene, camera } = stage;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const CAM_Z = 14;
    camera.position.set(0, 0, CAM_Z);

    // ---- ánh sáng & môi trường phản chiếu ----
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 1.0;
    scene.add(new THREE.AmbientLight(0xffe9dd, 0.35));
    const key = new THREE.DirectionalLight(0xfff1de, 2.4);
    key.position.set(-3, 4.5, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -14; key.shadow.camera.right = 14; key.shadow.camera.top = 14; key.shadow.camera.bottom = -14;
    key.shadow.camera.near = 1; key.shadow.camera.far = 40;
    key.shadow.bias = -0.0006;
    key.shadow.radius = 5;
    scene.add(key);
    const rim = new THREE.PointLight(0xff6a78, 60, 40, 2);
    rim.position.set(7, -3, 6);
    scene.add(rim);

    // "bức tường" trong suốt chỉ để hứng bóng đổ
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.ShadowMaterial({ color: 0x14020a, opacity: 0.3 }));
    wall.position.z = -6;
    wall.receiveShadow = true;
    scene.add(wall);

    // ---- vật liệu & hình dạng dùng chung ----
    const heartGeo = makeHeartGeometry();
    const petalGeo = makePetalGeometry();
    const mats = {
      gold: new THREE.MeshStandardMaterial({ color: 0xe0b341, metalness: 0.92, roughness: 0.22 }),
      wine: new THREE.MeshStandardMaterial({ color: COLORS.wine, metalness: 0.25, roughness: 0.3 }),
      rose: new THREE.MeshStandardMaterial({ color: COLORS.rose, metalness: 0.1, roughness: 0.38 }),
      cream: new THREE.MeshStandardMaterial({ color: COLORS.cream, metalness: 0.05, roughness: 0.5 }),
    };
    const heartMats = [mats.gold, mats.wine, mats.cream, mats.gold, mats.rose, mats.wine];
    const petalMats = [
      new THREE.MeshStandardMaterial({ color: 0x8e1f2b, roughness: 0.5, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0xb23a48, roughness: 0.5, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0xe9c9c4, roughness: 0.55, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0xd9b45a, roughness: 0.45, side: THREE.DoubleSide }),
    ];

    // Biên dịch sẵn shader của cánh hoa (vật liệu 2 mặt) ngay từ đầu để lúc bấm "Mở thiệp" không bị khựng
    petalMats.forEach((mat) => {
      const warm = new THREE.Mesh(petalGeo, mat);
      warm.castShadow = true;
      warm.position.set(0, 0, -30);
      warm.scale.setScalar(0.0001);
      scene.add(warm);
    });

    const halfH = () => visibleHeight(camera.fov, CAM_Z) / 2; // tại z = 0
    const toWorld = (nx: number, ny: number, z: number) => {
      const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (CAM_Z - z);
      return new THREE.Vector3(nx * hh * camera.aspect, ny * hh, z);
    };
    const cardNdc = () => {
      const el = cardRef.current;
      const r = canvas.getBoundingClientRect();
      if (!el || r.width === 0) return null;
      const c = el.getBoundingClientRect();
      const m = 24;
      return { x0: ((c.left - m - r.left) / r.width) * 2 - 1, x1: ((c.right + m - r.left) / r.width) * 2 - 1, y0: -(((c.bottom + m - r.top) / r.height) * 2 - 1), y1: -(((c.top - m - r.top) / r.height) * 2 - 1) };
    };

    // ---- tim lơ lửng ----
    const floaters: Floater[] = [];
    const N = isSmallScreen() ? 12 : 22;
    const scatter = (f: Floater) => {
      const card = cardNdc();
      let p = new THREE.Vector3();
      for (let tries = 0; tries < 14; tries++) {
        const nx = (Math.random() * 2 - 1) * 0.97;
        const ny = (Math.random() * 2 - 1) * 0.95;
        const z = -5 + Math.random() * 6;
        p = toWorld(nx, ny, z);
        const inCard = card && nx > card.x0 && nx < card.x1 && ny > card.y0 && ny < card.y1;
        if (!inCard) break;
      }
      f.base.copy(p);
    };
    const sizeK = 0.78 + 0.37 * Math.min(1, camera.aspect); // màn hình dọc: tim nhỏ lại một chút
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(heartGeo, heartMats[i % heartMats.length]);
      m.castShadow = true;
      const f: Floater = {
        m,
        base: new THREE.Vector3(),
        size: (0.5 + Math.random() * 0.68) * sizeK,
        ph: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.55),
        bob: new THREE.Vector2(0.15 + Math.random() * 0.25, 0.25 + Math.random() * 0.35),
        born: 0.15 + i * 0.07,
        vel: new THREE.Vector3(),
      };
      scatter(f);
      m.scale.setScalar(0.0001);
      scene.add(m);
      floaters.push(f);
    }
    stage.onResize = () => floaters.forEach(scatter);

    // ---- bụi vàng ----
    const dust = makeDust({ count: isSmallScreen() ? 70 : 140, spread: new THREE.Vector3(26, 16, 10), size: 7, additive: true, alpha: 0.9 });
    scene.add(dust.points);

    // ---- vụ nổ khi mở thiệp ----
    const particles: Particle[] = [];
    let scatterAt = -1;
    let originW = new THREE.Vector3();
    const burst = (ox: number, oy: number) => {
      const r = canvas.getBoundingClientRect();
      const nx = ((ox - r.left) / r.width) * 2 - 1;
      const ny = -(((oy - r.top) / r.height) * 2 - 1);
      originW = toWorld(nx, ny, 0);
      const k = halfH() / 4.8; // quy mô theo cỡ màn hình
      const add = (geo: THREE.BufferGeometry, mat: THREE.Material, size: number, speed: number, grav: number, life: number) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.position.copy(originW);
        const a = Math.random() * Math.PI * 2;
        const e = (Math.random() - 0.35) * 1.2; // góc ngóc lên/xuống
        const v = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e) * 0.9 + 0.15, Math.sin(a) * 0.5 + 0.55).multiplyScalar(speed * k);
        m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        scene.add(m);
        particles.push({ m, v, spin: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12), life, age: 0, size: size * k, grav: grav * k });
      };
      for (let i = 0; i < 30; i++) add(heartGeo, heartMats[i % heartMats.length], 0.3 + Math.random() * 0.42, 5 + Math.random() * 9, 2.2, 1.0 + Math.random() * 0.5);
      for (let i = 0; i < 70; i++) add(petalGeo, petalMats[i % petalMats.length], 0.55 + Math.random() * 0.55, 4 + Math.random() * 9, 4.5, 1.1 + Math.random() * 0.5);
      // tim lơ lửng cũ bị đẩy ra xa
      floaters.forEach((f) => {
        const dir = f.m.position.clone().sub(originW);
        dir.z += 1.5;
        f.vel.copy(dir.normalize().multiplyScalar(6 + Math.random() * 6));
      });
      scatterAt = 0;
    };
    api.current = { burst };

    // ---- khung hình ----
    const tilt = getTilt();
    let tx = 0, ty = 0;
    stage.onFrame = (dt, t) => {
      tx += (tilt.x - tx) * Math.min(1, dt * 3);
      ty += (tilt.y - ty) * Math.min(1, dt * 3);
      camera.position.set(tx * 0.9, -ty * 0.6, CAM_Z);
      camera.lookAt(0, 0, 0);
      rim.position.x = 7 + tx * 4;

      for (const f of floaters) {
        const born = easeOutCubic(clamp01((t - f.born) / 0.9));
        if (scatterAt >= 0) {
          f.base.addScaledVector(f.vel, dt);
          f.vel.multiplyScalar(Math.exp(-1.2 * dt));
        }
        const s = f.size * born * (scatterAt >= 0 ? Math.max(0, 1 - scatterAt / 1.5) : 1);
        f.m.scale.setScalar(Math.max(s, 0.0001));
        f.m.position.set(f.base.x + Math.sin(t * 0.5 + f.ph) * f.bob.x, f.base.y + Math.sin(t * 0.7 + f.ph * 1.3) * f.bob.y, f.base.z);
        f.m.rotation.set(Math.sin(t * 0.6 + f.ph) * 0.35, t * f.spin + f.ph, Math.sin(t * 0.45 + f.ph) * 0.22);
      }
      if (scatterAt >= 0) scatterAt += dt;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.life) {
          scene.remove(p.m);
          particles.splice(i, 1);
          continue;
        }
        p.v.multiplyScalar(Math.exp(-1.6 * dt));
        p.v.y -= p.grav * dt;
        p.m.position.addScaledVector(p.v, dt);
        p.m.rotation.x += p.spin.x * dt;
        p.m.rotation.y += p.spin.y * dt;
        p.m.rotation.z += p.spin.z * dt;
        const pop = easeOutCubic(clamp01(p.age / 0.18));
        const fade = 1 - clamp01((p.age / p.life - 0.65) / 0.35);
        p.m.scale.setScalar(Math.max(p.size * pop * fade, 0.0001));
      }
      dust.update(t);
    };

    return () => {
      api.current = null;
      pmrem.dispose();
      env.dispose();
      heartGeo.dispose();
      petalGeo.dispose();
      Object.values(mats).forEach((m) => m.dispose());
      petalMats.forEach((m) => m.dispose());
      stage.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!opening) return;
    const id = window.setTimeout(() => api.current?.burst(origin.x, origin.y), BURST_DELAY * 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
