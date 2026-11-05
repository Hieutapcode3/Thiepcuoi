import * as THREE from "three";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Không tải được ảnh: " + url));
    img.src = url;
  });
}

export function toTexture(source: HTMLCanvasElement | HTMLImageElement, anisotropy = 4): THREE.Texture {
  const t = source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

export function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D không khả dụng");
  return { c, ctx };
}

/** Vẽ ảnh vào ô (dx,dy,dw,dh) theo kiểu object-fit: cover */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const iw = img.naturalWidth || 600;
  const ih = img.naturalHeight || 900;
  const s = Math.max(dw / iw, dh / ih);
  const sw = dw / s;
  const sh = dh / s;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, dx, dy, dw, dh);
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Ảnh + bóng đổ mềm quanh ảnh (giống drop-shadow CSS). Trả về canvas lớn hơn ảnh `pad` px mỗi phía. */
export function withShadow(img: HTMLImageElement | HTMLCanvasElement, pad: number, dx: number, dy: number, blur: number, rgba: string): HTMLCanvasElement {
  const w = (img as HTMLImageElement).naturalWidth || img.width;
  const h = (img as HTMLImageElement).naturalHeight || img.height;
  const { c, ctx } = makeCanvas(w + pad * 2, h + pad * 2);
  ctx.shadowColor = rgba;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
  ctx.drawImage(img, pad, pad, w, h);
  return c;
}

/** Tô một màu/gradient lên đúng hình dạng (alpha) của ảnh — dùng cho mặt sau nắp phong bì, bao lì xì */
export function silhouette(img: HTMLImageElement, fill: (ctx: CanvasRenderingContext2D, w: number, h: number) => string | CanvasGradient): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const { c, ctx } = makeCanvas(w, h);
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = fill(ctx, w, h);
  ctx.fillRect(0, 0, w, h);
  return c;
}
