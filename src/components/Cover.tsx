"use client";
import { wedding } from "@/data/wedding";
import { parseDate } from "@/lib/dates";
import { useEffect, useRef, useState } from "react";
import { Flower, Heart } from "./Art";
import { requestMotionPermission } from "@/lib/gl/tilt";

const FALL_COLORS = ["#c9a24a", "#e0c27a", "#d98a92", "#f3e8de"];
const HEARTS_FALL = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 71 + 5) % 100}%`,
  dur: 9 + ((i * 5) % 9),
  delay: -((i * 3) % 12),
  sway: `${((i % 5) - 2) * 40}px`,
  size: 18 + ((i * 7) % 15),
  color: FALL_COLORS[i % FALL_COLORS.length],
}));

type Burst = { dx: number; dy: number; rs: number; re: number; size: number; color: string; delay: number };
const HEART_COLORS = ["#c9a24a", "#a8323b", "#ece4d8", "#8b3a44", "#e0c27a"];
const REVEAL_MS = 1000; // thời điểm trang thiệp hiện ra bên dưới

/**
 * Màn bìa toàn màn hình. Bấm "Mở thiệp": con dấu vỡ + vòng sáng → hoa phóng lớn rồi mờ dần →
 * 32 trái tim bắn ra → tấm thiệp bay lên → bìa mờ đi để lộ trang thiệp.
 * (Nhịp thời gian quan sát từ bản mẫu; toàn bộ code và hình dạng là tự viết.)
 */
export default function Cover({ onStart, onReveal, onDone, onLeave, canLeave = true }: { onStart: () => void; onReveal: () => void; onDone: () => void; onLeave?: () => void; canLeave?: boolean }) {
  const { y, m, d } = parseDate(wedding.reception.date);
  const [opening, setOpening] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [timeUp, setTimeUp] = useState(false); // hiệu ứng bìa đã chạy đủ ~1s
  const [leaving, setLeaving] = useState(false);
  // Bìa mờ đi khi: đã đủ thời gian VÀ trang thiệp phía sau đã sẵn sàng
  useEffect(() => {
    if (!timeUp || !canLeave || leaving) return;
    setLeaving(true);
    onLeave?.();
    const t = setTimeout(onDone, 520);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp, canLeave]);
  const seal = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  const start = () => {
    if (opening) return;
    onStart();
    void requestMotionPermission(); // iOS: xin quyền con quay ngay trong thao tác bấm
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onReveal(); onDone(); return; }
    const r = seal.current?.getBoundingClientRect();
    setOrigin({ x: r ? r.left + r.width / 2 : window.innerWidth / 2, y: r ? r.top + r.height / 2 : window.innerHeight / 3 });
    const reach = Math.min(window.innerWidth, window.innerHeight) * 0.45;
    setBursts(Array.from({ length: 32 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 140 + Math.random() * reach;
      return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist - 40, rs: Math.random() * 60 - 30, re: Math.random() * 360 - 180, size: 10 + Math.random() * 12, color: HEART_COLORS[i % HEART_COLORS.length], delay: Math.random() * 150 };
    }));
    setOpening(true);
    setTimeout(onReveal, REVEAL_MS);
    setTimeout(() => setTimeUp(true), REVEAL_MS);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${leaving ? "cover-leave" : ""}`} style={{ background: "linear-gradient(to bottom right, #6e1a20, #511419, #380a0e)" }}>
      {HEARTS_FALL.map((p, i) => (
        <span key={i} className="petal" style={{ left: p.left, width: p.size, height: p.size, color: p.color, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, ["--sway" as string]: p.sway }}>
          <Heart className="h-full w-full" />
        </span>
      ))}
      <div
        ref={card}
        className={`relative h-[443px] w-[calc(100%-80px)] max-w-[600px] rounded-lg text-wine md:h-[420px] md:w-[600px] ${opening ? "card-away" : ""}`}
        style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,.45), 0 8px 24px rgba(0,0,0,.2), 0 0 40px rgba(81,20,25,.15)" }}
      >
        {/* Giấy kem nhạt + vân giấy mờ 40%, hoa bị cắt theo mép thẻ */}
        <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ background: "rgba(255,250,243,.96)" }}>
          <img src="/art/paper.webp" alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 h-full w-full max-w-none object-cover opacity-40 mix-blend-multiply" />
          <div className={`pointer-events-none absolute inset-0 ${opening ? "cover-fly" : ""}`}>
            <Flower sway={false} className="cover-flower-l -top-[5%] -left-[10px] h-36 opacity-80 md:-top-[2%] md:h-[280px]" />
            <Flower sway={false} className="cover-flower-r -bottom-[5%] -right-[10px] h-36 opacity-80 md:bottom-[35%] md:h-[280px]" />
          </div>
        </div>
        <div ref={seal} className={`absolute left-1/2 top-[22px] h-14 w-14 -translate-x-1/2 ${opening ? "" : "seal-pulse"}`}>
          <div className={`flex h-full w-full items-center justify-center rounded-full text-[#f3e8de] ${opening ? "seal-pop" : ""}`} style={{ background: "radial-gradient(circle at 30% 30%, #511419, #330000)", boxShadow: "0 4px 20px rgba(81,20,25,.5)" }}>
            <Heart className="h-7 w-7" />
          </div>
          {opening && <span className="seal-ring pointer-events-none absolute inset-0 rounded-full border-2 border-gold" />}
        </div>
        <div className="relative flex flex-col items-center px-6 pt-[112px] text-center md:pt-24">
          <h1 className="w-full font-viaoda font-normal">
            <span className="block w-full text-[30px] leading-[38px] md:text-[36px] md:leading-[45px]">{wedding.groom.short}</span>
            <span className="block w-full text-[18px] leading-none md:text-[20px]">&amp;</span>
            <span className="block w-full text-[30px] leading-[38px] md:text-[36px] md:leading-[45px]">{wedding.bride.short}</span>
          </h1>
          <div className="mt-[7px] flex items-center justify-center gap-3 md:mt-2">
            <span className="h-px w-10" style={{ background: "linear-gradient(to right, transparent, #511419)" }} />
            <span className="text-sm leading-5 opacity-70">❦</span>
            <span className="h-px w-10" style={{ background: "linear-gradient(to left, transparent, #511419)" }} />
          </div>
          <p className="mt-2 font-button text-[18px] font-light leading-[27px]" style={{ color: "rgba(81,20,25,.72)" }}>{d} tháng {m}, {y}</p>
          <p className="mt-[22px] font-button text-[18px] font-light leading-[23px]" style={{ color: "rgba(81,20,25,.72)" }}>Thân Mời</p>
          <button
            onClick={start}
            disabled={opening}
            className="relative mt-[26px] flex h-12 items-center overflow-hidden rounded-full bg-wine px-8 font-button text-lg font-medium text-[#f3e8de] transition-transform hover:scale-105 active:scale-95"
            style={{ boxShadow: "0 4px 14px rgba(81,20,25,.35)" }}
          >
            Mở thiệp
            <span className="btn-shine pointer-events-none absolute top-0 h-full w-8" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent)" }} />
          </button>
        </div>
      </div>
      {opening && bursts.map((b, i) => (
        <span key={i} className="heart-burst pointer-events-none" style={{ left: origin.x, top: origin.y, width: b.size, height: b.size, color: b.color, animationDelay: `${500 + b.delay}ms`, ["--dx" as string]: `${b.dx}px`, ["--dy" as string]: `${b.dy}px`, ["--rs" as string]: `${b.rs}deg`, ["--re" as string]: `${b.re}deg` }}>
          <Heart className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}
