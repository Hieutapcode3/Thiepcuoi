// Độ nghiêng dùng chung: chuột trên máy tính, con quay (gyroscope) trên điện thoại.
// Giá trị x, y nằm trong [-1, 1].
type Tilt = { x: number; y: number };
const state: Tilt = { x: 0, y: 0 };
let inited = false;
let usingGyro = false;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function init() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      if (usingGyro) return;
      state.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );
  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.gamma === null || e.beta === null) return;
      usingGyro = true;
      state.x = clamp(e.gamma / 22, -1, 1); // nghiêng trái/phải
      state.y = clamp((e.beta - 50) / 22, -1, 1); // cầm điện thoại ~50° là vị trí nghỉ
    },
    { passive: true }
  );
}

export function getTilt(): Tilt {
  init();
  return state;
}

/** iOS yêu cầu xin quyền con quay trong một thao tác bấm. Gọi hàm này khi người dùng bấm "Mở thiệp". */
export async function requestMotionPermission(): Promise<void> {
  init();
  try {
    const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") await D.requestPermission();
  } catch {
    /* người dùng từ chối: vẫn dùng chuột/cảm ứng */
  }
}
