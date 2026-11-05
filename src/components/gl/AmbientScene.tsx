"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, visibleHeight } from "@/lib/gl/stage";
import { makePetalGeometry } from "@/lib/gl/shapes";
import { makeDust } from "@/lib/gl/dust";
import { getTilt } from "@/lib/gl/tilt";
import { isSmallScreen } from "@/lib/gl/support";

const CAM_Z = 12;
const FOV = 35;
const PETAL_COLORS = [0x8e1f2b, 0xa8323b, 0xb84a56, 0xd98a92, 0xecd2cb, 0x6e1a20];

type Petal = { x: number; y: number; z: number; vy: number; ph: number; sway: number; swayF: number; rot: THREE.Vector3; spin: THREE.Vector3; size: number };

/**
 * Nền toàn trang: cánh hoa hồng 3D rơi mềm (có độ sâu, lật xoay, gió theo cuộn trang) + bụi vàng lấp lánh.
 * Một canvas cố định phủ cột thiệp, không chặn thao tác.
 */
export default function AmbientScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(canvas, { fov: FOV, maxDpr: 1.75 });
    } catch {
      return;
    }
    const { scene, camera } = stage;
    camera.position.set(0, 0, CAM_Z);

    scene.add(new THREE.AmbientLight(0xffeadf, 0.9));
    const sun = new THREE.DirectionalLight(0xfff3e6, 2.2);
    sun.position.set(2, 5, 6);
    scene.add(sun);
    const warm = new THREE.DirectionalLight(0xff9aa6, 0.7);
    warm.position.set(-4, -2, 3);
    scene.add(warm);

    const N = isSmallScreen() ? 16 : 28;
    const geo = makePetalGeometry();
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    const mesh = new THREE.InstancedMesh(geo, mat, N);
    mesh.frustumCulled = false;
    const col = new THREE.Color();
    for (let i = 0; i < N; i++) mesh.setColorAt(i, col.setHex(PETAL_COLORS[i % PETAL_COLORS.length]));
    scene.add(mesh);

    const dust = makeDust({ count: isSmallScreen() ? 40 : 80, spread: new THREE.Vector3(14, 8, 8), size: 6, additive: false, alpha: 0.85, color: 0xc9a24a });
    scene.add(dust.points);

    let hh = visibleHeight(FOV, CAM_Z) / 2;
    let hw = hh * camera.aspect;
    const petals: Petal[] = [];
    const spawn = (p: Petal, anywhere: boolean) => {
      p.z = -4 + Math.random() * 7;
      const depthK = (CAM_Z - p.z) / CAM_Z; // xa → nhỏ hơn
      p.x = (Math.random() * 2 - 1) * hw * 1.15 * depthK;
      p.y = anywhere ? (Math.random() * 2 - 1) * hh * 1.1 : hh * depthK + 0.8 + Math.random() * 2;
      p.vy = 0.45 + Math.random() * 0.55;
      p.ph = Math.random() * Math.PI * 2;
      p.sway = 0.25 + Math.random() * 0.55;
      p.swayF = 0.35 + Math.random() * 0.5;
      p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.spin.set((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.6);
      p.size = 0.38 + Math.random() * 0.4;
    };
    for (let i = 0; i < N; i++) {
      const p: Petal = { x: 0, y: 0, z: 0, vy: 0, ph: 0, sway: 0, swayF: 0, rot: new THREE.Vector3(), spin: new THREE.Vector3(), size: 0 };
      spawn(p, true);
      petals.push(p);
    }
    stage.onResize = () => { hh = visibleHeight(FOV, CAM_Z) / 2; hw = hh * camera.aspect; };

    // Cánh hoa rơi độc lập, không bị cuộn trang kéo theo (không gió / thị sai theo cuộn)

    const tilt = getTilt();
    let tx = 0;
    const dummy = new THREE.Object3D();
    stage.onFrame = (dt, t) => {
      tx += (tilt.x - tx) * Math.min(1, dt * 2);
      camera.position.x = tx * 0.5;
      camera.lookAt(0, 0, 0);

      for (let i = 0; i < N; i++) {
        const p = petals[i];
        const depthK = (CAM_Z - p.z) / CAM_Z;
        p.y -= p.vy * dt;
        p.x += (Math.sin(t * p.swayF + p.ph) * p.sway) * dt;
        p.rot.x += p.spin.x * dt;
        p.rot.y += p.spin.y * dt;
        p.rot.z += p.spin.z * dt;
        if (p.y < -hh * depthK - 1 || p.x > hw * 1.4 * depthK + 1 || p.x < -hw * 1.4 * depthK - 1) spawn(p, false);
        if (p.y > hh * depthK + 4) spawn(p, false);
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
        dummy.scale.setScalar(p.size);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      dust.update(t);
    };

    return () => {
      stage.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed left-1/2 top-0 z-[15] h-screen w-full max-w-[900px] -translate-x-1/2"
      style={{ height: "100dvh" }}
    />
  );
}
