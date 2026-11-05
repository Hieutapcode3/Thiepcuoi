"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { hasWebGL } from "@/lib/gl/support";
import LazyMount from "./gl/LazyMount";
import { wedding } from "@/data/wedding";
import { Reveal, SectionTitle } from "./ui";

const AlbumRing3D = dynamic(() => import("./gl/AlbumRing3D"), { ssr: false });

/** Chuẩn hóa độ lệch về khoảng [-n/2, n/2] để vòng lặp mượt */
function wrap(i: number, n: number) {
  let d = i;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

export default function Album() {
  const photos = wedding.album;
  const n = photos.length;
  const [idx, setIdx] = useState(0);
  const [light, setLight] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  // "3d": vòng quay Three.js · "css": carousel CSS dự phòng
  const [mode, setMode] = useState<"pending" | "3d" | "css">("pending");
  useEffect(() => { setMode(hasWebGL() ? "3d" : "css"); }, []);

  const go = useCallback((d: number) => setIdx((i) => (i + d + n) % n), [n]);

  useEffect(() => {
    if (paused || light !== null) return;
    const t = setInterval(() => go(1), 4000);
    return () => clearInterval(t);
  }, [paused, light, go]);

  useEffect(() => {
    if (light === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLight(null);
      if (e.key === "ArrowRight") setLight((l) => (l === null ? l : (l + 1) % n));
      if (e.key === "ArrowLeft") setLight((l) => (l === null ? l : (l - 1 + n) % n));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [light, n]);

  return (
    <div className="relative z-10 overflow-x-clip py-10">
      <Reveal>
        <SectionTitle className="mb-7 text-center">ALBUM ẢNH</SectionTitle>
        <div
          className="relative h-[340px] md:h-[520px] touch-pan-y"
          {...(mode === "css" ? {
            onMouseEnter: () => setPaused(true),
            onMouseLeave: () => setPaused(false),
            onPointerDown: (e: ReactPointerEvent) => { startX.current = e.clientX; },
            onPointerUp: (e: ReactPointerEvent) => {
              if (startX.current === null) return;
              const dx = e.clientX - startX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              startX.current = null;
            },
          } : {})}
        >
          <button aria-label="Previous photo" onClick={() => go(-1)} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[200] w-8 h-8 items-center justify-center rounded-full bg-wine/20 hover:bg-wine/30">‹</button>
          <button aria-label="Next photo" onClick={() => go(1)} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[200] w-8 h-8 items-center justify-center rounded-full bg-wine/20 hover:bg-wine/30">›</button>

          {mode === "3d" && (
            <LazyMount>
              <AlbumRing3D photos={photos} index={idx} onIndex={setIdx} onOpen={setLight} onHold={setPaused} onFail={() => setMode("css")} />
            </LazyMount>
          )}
          {mode === "css" && <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: 1000 }}>
            {photos.map((src, i) => {
              const off = wrap(i - idx, n);
              const abs = Math.abs(off);
              const active = off === 0;
              const tx = abs > 1 ? off * 90 : off * 62; // %
              const transform = active
                ? "translateX(0) translateZ(0) rotateY(0) scale(1)"
                : `translateX(${tx}%) translateZ(${abs > 1 ? -450 : -200}px) rotateY(${off < 0 ? "" : "-"}${abs > 1 ? 135 : 45}deg) scale(${abs > 1 ? 0.7 : 0.85})`;
              return (
                <div
                  key={src}
                  className="absolute h-[92%] rounded-2xl overflow-hidden shadow-xl cursor-pointer transition-all ease-in-out"
                  style={{ aspectRatio: "0.664 / 1", transitionDuration: "1100ms", transform, opacity: active ? 1 : abs === 1 ? 0.7 : 0.25, zIndex: 100 - abs }}
                  onClick={() => (active ? setLight(i) : setIdx(i))}
                >
                  <img src={src} alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
                </div>
              );
            })}
          </div>}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {photos.map((_, i) => (
            <button key={i} aria-label={`Go to photo ${i + 1}`} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-wine" : "w-2 bg-wine/30"}`} />
          ))}
        </div>
      </Reveal>

      {light !== null && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center" onClick={() => setLight(null)} role="dialog" aria-modal="true">
          <button className="absolute top-4 right-5 text-white text-2xl font-semibold" aria-label="Đóng" onClick={() => setLight(null)}>✕</button>
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/80 text-lg font-light font-ui">{light + 1} / {n}</span>
          <button className="absolute left-3 text-white text-4xl font-semibold px-3" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); setLight((light - 1 + n) % n); }}>‹</button>
          <img src={photos[light]} alt={`Wedding photo ${light + 1}`} className="max-h-[88vh] max-w-[88vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-3 text-white text-4xl font-semibold px-3" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); setLight((light + 1) % n); }}>›</button>
        </div>,
        document.body
      )}
    </div>
  );
}
