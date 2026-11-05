import * as THREE from "three";

/**
 * Hạt bụi vàng lấp lánh: Points + shader (nhấp nháy hình sao nhỏ, trôi nhẹ).
 * additive=true cho nền tối (bìa), false cho nền kem (trang chính).
 */
export function makeDust(opts: { count: number; spread: THREE.Vector3; size: number; additive: boolean; alpha?: number; color?: number }) {
  const { count, spread, size, additive } = opts;
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const sz = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
    seed[i] = Math.random();
    sz[i] = 0.5 + Math.random() * 1.1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uSize: { value: size },
      uAlpha: { value: opts.alpha ?? 1 },
      uColor: { value: new THREE.Color(opts.color ?? 0xd9b45a) },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute float aSize;
      uniform float uTime; uniform float uPx; uniform float uSize;
      varying float vTw;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.25 + aSeed * 40.0) * 0.25;
        p.y += sin(uTime * 0.18 + aSeed * 23.0) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vTw = 0.5 + 0.5 * sin(uTime * (0.7 + aSeed * 1.8) + aSeed * 60.0);
        vTw = pow(vTw, 2.0);
        gl_PointSize = uSize * aSize * uPx * (10.0 / -mv.z) * (0.35 + 0.65 * vTw);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uAlpha; varying float vTw;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        float glow = smoothstep(0.5, 0.0, d);
        float cross = smoothstep(0.09, 0.0, abs(p.x)) * smoothstep(0.5, 0.0, abs(p.y))
                    + smoothstep(0.09, 0.0, abs(p.y)) * smoothstep(0.5, 0.0, abs(p.x));
        float a = (glow * glow * 0.85 + cross * 0.9) * (0.25 + 0.75 * vTw);
        gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0) * uAlpha);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, update: (t: number) => { mat.uniforms.uTime.value = t; } };
}
