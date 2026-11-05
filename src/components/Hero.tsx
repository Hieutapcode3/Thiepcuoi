"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { wedding } from "@/data/wedding";
import type { IntroConfig } from "@/data/intro";
import { Flower } from "./Art";
import { hasWebGL, prefersReducedMotion } from "@/lib/gl/support";

const HeroEnvelope3D = dynamic(() => import("./gl/HeroEnvelope3D"), { ssr: false });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = "off" | "wait" | "run" | "done";

/**
 * SAVE THE DATE: ảnh cưới thò ra từ phong bì + tên cô dâu chú rể.
 * Nếu có `intro`: phong bì rơi xuống giữa màn hình (nền tối lại) → mở thiệp → thu nhỏ về đúng chỗ (nền sáng lại).
 */
export default function Hero({ intro, onIntroDone, canStart = true, onReady }: { intro?: IntroConfig | null; onIntroDone?: () => void; canStart?: boolean; onReady?: () => void }) {
  // "3d": phong bì Three.js · "css": bản ảnh phẳng dự phòng (máy không có WebGL)
  const [mode, setMode] = useState<"pending" | "3d" | "css">("pending");
  const [phase, setPhase] = useState<Phase>(() => (intro?.enabled && typeof window !== "undefined" && !prefersReducedMotion() ? "wait" : "off"));
  const [ready, setReady] = useState(false);
  const gate = useRef(phase === "off"); // phong bì 3D chỉ mở khi gate = true
  const envRef = useRef<HTMLDivElement>(null);
  const opened = useRef<{ done: boolean; wake: (() => void) | null }>({ done: false, wake: null }); // phong bì 3D đã mở xong chưa
  const resScale = useRef(1); // phong bì đang phóng to bao nhiêu lần (để canvas 3D vẽ nét tương ứng)
  const dimRef = useRef<HTMLDivElement>(null);
  const cfg = useRef(intro); // chụp cấu hình lúc bắt đầu
  useEffect(() => { setMode(hasWebGL() ? "3d" : "css"); }, []);
  useEffect(() => { if (mode === "css") setReady(true); }, [mode]);
  const mode3d = useRef(false);
  mode3d.current = mode === "3d";
  // báo cho trang biết phong bì đã vẽ xong (chờ thêm 2 khung hình cho chắc)
  useEffect(() => {
    if (!ready) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => onReady?.()); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const alt = `${wedding.groom.short} & ${wedding.bride.short}`;

  // Không tải được phong bì sau 6s → bỏ hiệu ứng, hiện bình thường
  useEffect(() => {
    if (phase !== "wait" || !canStart) return;
    const t = setTimeout(() => { if (!ready) { gate.current = true; setPhase("done"); onIntroDone?.(); } }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ready, canStart]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current || phase !== "wait" || !ready || !canStart) return;
    started.current = true;
    const c = cfg.current!;
    const el = envRef.current, dim = dimRef.current;
    if (!el || !dim) return;
    let alive = true;
    setPhase("run");
    // Khoá cuộn bằng cách chặn sự kiện (không dùng overflow:hidden → thanh cuộn không biến mất, trang không xê dịch)
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => { if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault(); };
    const unlock = () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);
    window.scrollTo(0, 0);

    (async () => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.min((vh * c.centerSize) / r.height, (vw * 0.92) / r.width);
      const dx = vw / 2 - (r.left + r.width / 2);
      const dy = vh / 2 - (r.top + r.height * 0.6); // điểm 60% chiều cao khung (thân phong bì + ảnh) nằm giữa màn hình
      const T = (x: number, y: number, sc = s, rot = 0) => `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
      const center = T(dx, dy);
      resScale.current = s * 1.08; // vẽ trước ở độ phân giải lớn (cả lúc nảy hơi phồng)

      let frames: Keyframe[];
      let easing = "linear";
      if (c.entry === "roi-xoay") {
        frames = [
          { transform: T(dx - vw * 0.18, dy - vh, s, -24), offset: 0 },
          { transform: T(dx + vw * 0.06, dy - vh * 0.42, s, 11), offset: 0.45 },
          { transform: T(dx - vw * 0.02, dy - vh * 0.08, s, -5), offset: 0.75 },
          { transform: T(dx, dy, s, 1.5), offset: 0.9 },
          { transform: center, offset: 1 },
        ];
        easing = "cubic-bezier(.3,.6,.4,1)";
      } else if (c.entry === "phong-to") {
        frames = [
          { transform: T(dx, dy, s * 0.3), opacity: 0 },
          { transform: T(dx, dy, s * 1.06), opacity: 1, offset: 0.7 },
          { transform: center, opacity: 1 },
        ];
        easing = "cubic-bezier(.2,.8,.3,1)";
      } else {
        // rơi thẳng xuống + nảy mềm: mô phỏng lò xo tắt dần (lấy mẫu 60 khung hình → chuyển động liền mạch, không gãy khúc)
        const zeta = 0.95 - 0.55 * Math.min(1, Math.max(0, c.bounce)); // độ nảy 0 → không nảy · 1 → nảy nhiều
        const w = 5.6 / zeta; // tắt hẳn ở cuối thời gian rơi
        const wd = w * Math.sqrt(1 - zeta * zeta);
        const N = 60;
        frames = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const e = Math.exp(-zeta * w * u);
          const off = e * (Math.cos(wd * u) + (zeta * w / wd) * Math.sin(wd * u)); // 1 → 0 (có vượt qua 0 = nảy)
          const vel = e * Math.sin(wd * u) * (w * w / wd); // vận tốc (dương = đang đi xuống)
          const sq = Math.max(-1, Math.min(1, -off * 25)) * 0.025 * (u > 0.2 ? 1 : 0); // hơi dẹt khi nén xuống
          frames.push({
            transform: `translate(${dx}px, ${dy - vh * off}px) scale(${s * (1 + sq)}, ${s * (1 - sq)}) rotate(${Math.max(-3, Math.min(3, -vel * 0.25))}deg)`,
            offset: u,
          });
        }
        frames[N] = { transform: center, offset: 1 };
      }

      // Đặt phong bì sẵn ở khung hình đầu (phía trên màn hình / ẩn) để không lộ ra ở chỗ cũ, chờ một nhịp rồi rơi
      const first = frames[0];
      el.style.transform = String(first.transform);
      if (first.opacity !== undefined) el.style.opacity = String(first.opacity);
      el.style.visibility = "visible";
      await sleep(c.startDelayMs);
      if (!alive) return;
      await el.animate(frames, { duration: c.fallMs, easing, fill: "forwards" }).finished;
      if (!alive) return;
      await sleep(c.holdMs);
      gate.current = true; // nắp mở → ảnh trượt lên → hoa hiện
      await sleep(c.openMs);
      if (!alive) return;
      // máy chậm: chờ phong bì mở xong hẳn rồi mới thu nhỏ (tối đa thêm 4s)
      if (mode3d.current && !opened.current.done) {
        await Promise.race([new Promise<void>((r) => { opened.current.wake = r; }), sleep(4000)]);
        if (!alive) return;
        await sleep(350);
      }
      const ease = "cubic-bezier(.65,0,.35,1)";
      dim.animate([{ opacity: c.dim }, { opacity: 0 }], { duration: c.shrinkMs, easing: ease, fill: "forwards" });
      await el.animate([{ transform: center }, { transform: "none" }], { duration: c.shrinkMs, easing: ease, fill: "forwards" }).finished;
      if (!alive) return;
      el.getAnimations().forEach((a) => a.cancel());
      el.style.transform = "";
      el.style.opacity = "";
      resScale.current = 1; // về kích thước thật → trả độ phân giải bình thường cho nhẹ máy
      unlock();
      setPhase("done");
      onIntroDone?.();
    })().catch(() => {});

    return () => {
      alive = false;
      unlock();
      gate.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, canStart]);

  const active = phase === "wait" || phase === "run";
  const c = cfg.current;

  return (
    <header className="relative z-10 flex flex-col items-center overflow-x-clip px-9 pt-14 pb-12 text-center" style={active ? { zIndex: 45 } : undefined}>
      {active && c && (
        <div
          ref={dimRef}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40"
          style={{ opacity: c.dim, background: c.dimColor, backdropFilter: c.blur ? `blur(${c.blur}px)` : undefined, WebkitBackdropFilter: c.blur ? `blur(${c.blur}px)` : undefined }}
        />
      )}
      <p className="font-cormorant text-[15px] font-semibold uppercase tracking-[0.16em] text-[#590310] md:text-[18px]">SAVE THE DATE</p>

      <div
        ref={envRef}
        className="relative mt-16 w-[67vw] max-w-[420px]"
        style={{ aspectRatio: "1013 / 1168", ...(active ? { zIndex: 50, visibility: phase === "wait" ? "hidden" : "visible", willChange: "transform" } : null) }}
      >
        {mode === "3d" && (
          <HeroEnvelope3D photo={wedding.heroPhoto} alt={alt} onFail={() => setMode("css")} gate={gate} resScale={resScale} onOpened={() => { opened.current.done = true; opened.current.wake?.(); }} speed={c?.openSpeed ?? 1} onReady={() => setReady(true)} />
        )}
        {mode === "css" && (
          <>
            <img src="/art/envelope-background.webp" alt="" className="absolute inset-0 h-full w-full" />
            <div className="absolute left-[35.6%] top-0 z-[1] h-[72.8%] w-[58.5%] rotate-[12deg] bg-white p-[7px] shadow-[0_6px_16px_rgba(56,10,14,.35)]">
              <img src={wedding.heroPhoto} alt={alt} className="h-full w-full object-cover" />
            </div>
            <img src="/art/envelope-cover.webp" alt="" className="absolute inset-x-0 bottom-0 z-[3] w-full drop-shadow-[0_6px_10px_rgba(56,10,14,.35)]" />
            <Flower className="hero-flower flower-sway-rot -left-[2.2%] -top-[12.3%] z-[2] h-[87%] md:left-0 md:-top-[10%] md:h-[75%]" />
          </>
        )}
      </div>

      <h1 className="relative mt-9 flex flex-col items-center gap-[22px] font-viaoda font-light text-wine">
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[37%] -translate-x-1/2 -translate-y-1/2 font-nautigal text-[92px] font-light leading-none text-wine/15 md:text-[120px]">&amp;</span>
        <span className="relative block text-[clamp(38px,11vw,46px)] leading-none md:text-[58px]">{wedding.groom.short}</span>
        <span className="sr-only">&amp;</span>
        <span className="relative block text-[clamp(38px,11vw,46px)] leading-none md:text-[58px]">{wedding.bride.short}</span>
      </h1>
    </header>
  );
}
