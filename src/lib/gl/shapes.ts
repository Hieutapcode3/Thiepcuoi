import * as THREE from "three";

/** Trái tim 3D có độ dày + vát cạnh, cao ~1.1 đơn vị, mũi nhọn hướng xuống. */
export function makeHeartGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.55);
  s.bezierCurveTo(-0.15, -0.4, -0.55, -0.1, -0.55, 0.18);
  s.bezierCurveTo(-0.55, 0.42, -0.35, 0.55, -0.2, 0.55);
  s.bezierCurveTo(-0.08, 0.55, 0, 0.47, 0, 0.37);
  s.bezierCurveTo(0, 0.47, 0.08, 0.55, 0.2, 0.55);
  s.bezierCurveTo(0.35, 0.55, 0.55, 0.42, 0.55, 0.18);
  s.bezierCurveTo(0.55, -0.1, 0.15, -0.4, 0, -0.55);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.08,
    bevelSegments: 6,
    curveSegments: 28,
  });
  g.center();
  return g;
}

/** Cánh hoa hồng: lưới 9×9 uốn cong (lòng chảo + cong đầu cánh), dài 1 đơn vị. */
export function makePetalGeometry(): THREE.BufferGeometry {
  const seg = 9;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= seg; j++) {
    const v = j / seg;
    const half = 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(v, 1.6)), 0.7); // nửa bề ngang tại v
    for (let i = 0; i <= seg; i++) {
      const u = (i / seg) * 2 - 1; // -1..1
      const x = u * half * 0.75;
      const y = v - 0.5;
      const z = 1.3 * x * x + 0.28 * v * v - 0.05; // lòng chảo + cong đầu cánh
      pos.push(x, y, z);
      uv.push(i / seg, v);
    }
  }
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + 1;
      const c = a + seg + 1;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
