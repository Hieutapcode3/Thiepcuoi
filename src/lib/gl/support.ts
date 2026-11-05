// Kiểm tra môi trường — file này KHÔNG import three nên nằm trong bundle chính (nhẹ).
let cached: boolean | null = null;

export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const c = document.createElement("canvas");
    cached = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    cached = false;
  }
  return cached;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Thiết bị cảm ứng / màn hình hẹp → dùng ít đối tượng hơn cho nhẹ */
export function isSmallScreen(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 640;
}
