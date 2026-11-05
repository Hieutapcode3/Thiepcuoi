"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { hasWebGL, prefersReducedMotion } from "@/lib/gl/support";
import { wedding } from "@/data/wedding";
import { introConfig, type IntroConfig } from "@/data/intro";
import Cover from "./Cover";
import Hero from "./Hero";
import Info from "./Info";
import Album from "./Album";
import Reception from "./Reception";
import Venue from "./Venue";
import Guestbook from "./Guestbook";
import GiftBox from "./GiftBox";
import MusicButton from "./MusicButton";

// Nền cánh hoa 3D + bụi vàng (Three.js) — chỉ tải ở trình duyệt
const AmbientScene = dynamic(() => import("./gl/AmbientScene"), { ssr: false });

/** màu `hex` phủ với độ đậm `a` lên nền trắng */
function mixOverWhite(hex: string, a: number) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const ch = (v: number) => Math.round(255 * (1 - a) + v * a);
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

/** intro: cấu hình chuyển cảnh (mặc định lấy từ src/data/intro.ts) · startOpened: bỏ qua trang bìa (dùng ở /lab) */
export default function Invitation({ intro = introConfig, startOpened = false }: { intro?: IntroConfig; startOpened?: boolean }) {
  const [opened, setOpened] = useState(startOpened); // trang thiệp đã hiện
  const [showCover, setShowCover] = useState(!startOpened); // màn bìa còn trên cùng
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.7);
  const userPaused = useRef(false); // khách đã chủ động tắt nhạc → không tự bật lại
  const [ambient, setAmbient] = useState(false);
  // Trong lúc màn bìa còn: khoá cuộn + tô màu dải chừa cho thanh cuộn (scrollbar-gutter) cùng màu bìa.
  // Khi bìa mờ đi: dải đó chuyển dần sang màu nền tối của hiệu ứng → không lộ vệt trắng, không xê dịch.
  useEffect(() => {
    const h = document.documentElement;
    if (showCover) {
      h.style.overflow = "hidden";
      h.style.backgroundColor = "#4a1016";
      return;
    }
    h.style.overflow = "";
    const t = setTimeout(() => { h.style.transition = ""; h.style.backgroundColor = ""; }, 4000);
    return () => clearTimeout(t);
  }, [showCover]);
  const onCoverLeave = () => {
    const h = document.documentElement;
    h.style.transition = "background-color .5s ease-in-out";
    h.style.backgroundColor = intro.enabled ? mixOverWhite(intro.dimColor, intro.dim) : "#ffffff";
  };
  const [pageReady, setPageReady] = useState(false); // phong bì đầu trang đã vẽ xong → cho bìa mờ đi
  useEffect(() => {
    if (!opened || pageReady) return;
    const t = setTimeout(() => setPageReady(true), 3000); // chờ tối đa 3s
    return () => clearTimeout(t);
  }, [opened, pageReady]);
  useEffect(() => { setAmbient(hasWebGL() && !prefersReducedMotion()); }, []);
  const hasMusic = wedding.music.url !== "";

  // Tải lại trang luôn quay về màn bìa: dọn ?open=1 cũ (nếu có) khỏi thanh địa chỉ
  useEffect(() => {
    if (new URLSearchParams(location.search).has("open")) history.replaceState(null, "", location.pathname);
  }, []);

  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume, opened]);

  // Mặc định bật nhạc sẵn: thử phát ngay khi thiệp mở; nếu trình duyệt chặn (vào thẳng ?open=1 chưa bấm gì)
  // thì phát ở lần chạm / bấm phím đầu tiên của khách.
  useEffect(() => {
    if (!opened || !hasMusic) return;
    const a = audio.current;
    if (!a || !a.paused || userPaused.current) return;
    const tryPlay = () => { if (!userPaused.current) a.play().then(() => setPlaying(true)).catch(() => {}); };
    a.play().then(() => setPlaying(true)).catch(() => {
      const evs = ["pointerdown", "keydown", "touchstart"] as const;
      const once = () => { evs.forEach((e) => window.removeEventListener(e, once)); tryPlay(); };
      evs.forEach((e) => window.addEventListener(e, once, { once: true, passive: true }));
    });
  }, [opened, hasMusic]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) { userPaused.current = false; a.play().then(() => setPlaying(true)).catch(() => {}); }
    else { userPaused.current = true; a.pause(); setPlaying(false); }
  };

  // Lúc bấm "Mở thiệp": bật nhạc (phải nằm trong thao tác bấm để qua chính sách autoplay).
  // Trang thiệp (kể cả phong bì 3D, cánh hoa 3D) được dựng sẵn PHÍA SAU màn bìa ngay sau cú bấm,
  // để phần việc nặng (tải ảnh, biên dịch shader) xong trước khi bìa mờ đi → chuyển cảnh không bị khựng.
  const start = () => {
    audio.current?.play().then(() => setPlaying(true)).catch(() => {});
    setTimeout(() => setOpened(true), 150); // để hiệu ứng con dấu kịp chạy trước
  };

  return (
    <main className="min-h-screen bg-white text-wine">
      <div className="paper-bg relative mx-auto min-h-screen w-full max-w-[900px] overflow-clip md:border md:border-[#51141922]">
      {hasMusic && <audio ref={audio} src={wedding.music.url} loop preload="auto" />}
      {showCover && <Cover onStart={start} onReveal={() => setOpened(true)} onDone={() => setShowCover(false)} canLeave={pageReady} onLeave={onCoverLeave} />}
      {opened && (
        <div className={`${intro.enabled ? "" : "page-in "}relative overflow-x-clip`}>
          {/* Hình kiến trúc cổ điển mờ làm nền (tự vẽ) */}
          {[["3.4%", "170%"], ["27.5%", "150%"], ["52%", "158%"], ["bottom", "155%"]].map(([top, w]) => (
            <img key={top} src="/art/castle-background.webp" alt="" aria-hidden className="pointer-events-none absolute left-1/2 z-0 max-w-none -translate-x-1/2 opacity-[0.1]" style={{ ...(top === "bottom" ? { bottom: 0 } : { top }), width: `min(${w}, 900px)` }} />
          ))}
          <Hero intro={intro.enabled ? intro : null} canStart={!showCover} onReady={() => setPageReady(true)} />
          <Info />
          <Album />
          <Reception />
          <Venue />
          <Guestbook />
          <GiftBox />
          <footer className="relative z-10 flex flex-col items-center px-6 pb-10 text-center">
            <p className="max-w-sm font-body text-[13px] leading-relaxed">{wedding.thankYou}</p>
            <p className="mt-4 font-head text-[11px] tracking-[0.2em] opacity-60">♡ {wedding.groom.short} &amp; {wedding.bride.short}</p>
          </footer>
        </div>
      )}
      {opened && ambient && <AmbientScene />}
      {opened && hasMusic && <MusicButton playing={playing} onToggle={toggle} volume={volume} onVolume={setVolume} />}
      </div>
    </main>
  );
}
