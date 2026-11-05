import type { Icon } from "@/data/wedding";

/** Cụm hoa + cành lá (/public/art/flower2-decoration.webp). flip = lật ngang */
export function Flower({ className = "", flip = false, sway = true, style }: { className?: string; flip?: boolean; sway?: boolean; style?: React.CSSProperties }) {
  return (
    <img
      src="/art/flower2-decoration.webp" alt="" aria-hidden draggable={false}
      className={`${sway ? "flower-sway " : ""}pointer-events-none select-none absolute max-w-none w-auto drop-shadow-[3px_4px_3px_rgba(0,0,0,0.3)] ${className}`}
      style={{ ...(flip ? { scale: "-1 1" } : {}), ...style }}
    />
  );
}

export function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 21s-8-5.6-8-11.2A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.6C20 15.4 12 21 12 21z" />
    </svg>
  );
}

/** Icon lịch trình: ảnh trong public/art (toast chưa có ảnh nên dùng nét vẽ) */
const ICON_IMG: Partial<Record<Icon, string>> = { camera: "/art/camera.webp", cake: "/art/cake.webp", dish: "/art/cook.webp" };
export function ScheduleIcon({ name }: { name: Icon }) {
  const src = ICON_IMG[name];
  if (src) return <img src={src} alt="" aria-hidden draggable={false} className="h-10 w-10 shrink-0 scale-[1.35] object-contain" />;
  const c = { fill: "none", stroke: "#c9a24a", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" aria-hidden>
      <g {...c}><path d="M9 8h9l-1 10a3.5 3.5 0 0 1-7 0z" /><path d="M22 8h9l-1 10a3.5 3.5 0 0 1-7 0z" /><path d="M13.5 21v9M10 30h7M26.5 21v9M23 30h7" /><path d="M20 3v2M16 4l1 2M24 4l-1 2" /></g>
    </svg>
  );
}

/** Ngày dạng gọn: 03 | THÁNG 01 / 2026 */
export function BigDate({ d, m, y }: { d: string; m: string; y: number }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="font-name text-[44px] leading-none font-light">{d}</span>
      <span className="h-12 w-px bg-cream/60" />
      <div className="text-left font-head leading-snug">
        <div className="text-[14px] tracking-[0.15em]">THÁNG {m}</div>
        <div className="text-[15px] tracking-[0.15em]">{y}</div>
      </div>
    </div>
  );
}
