"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { hasWebGL, prefersReducedMotion } from "@/lib/gl/support";
import { wedding } from "@/data/wedding";
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

export default function Invitation() {
  const [opened, setOpened] = useState(false); // trang thiệp đã hiện
  const [showCover, setShowCover] = useState(true); // màn bìa còn trên cùng
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.7);
  const userPaused = useRef(false); // khách đã chủ động tắt nhạc → không tự bật lại
  const [ambient, setAmbient] = useState(false);
  useEffect(() => { setAmbient(hasWebGL() && !prefersReducedMotion()); }, []);
  const hasMusic = wedding.music.url !== "";

  // Mở thẳng nếu URL có ?open=1 (giống bản gốc)
  useEffect(() => {
    if (new URLSearchParams(location.search).get("open") === "1") { setOpened(true); setShowCover(false); }
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

  // Lúc bấm "Mở thiệp": đổi URL + bật nhạc (phải nằm trong thao tác bấm để qua chính sách autoplay).
  // Trang thiệp hiện ra sau (onReveal) khi hiệu ứng bìa chạy được ~1s, bìa gỡ hẳn ở onDone.
  const start = () => {
    history.replaceState(null, "", "?open=1");
    // Phát nhạc ngay trong thao tác bấm nút để qua được chính sách autoplay
    audio.current?.play().then(() => setPlaying(true)).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-[#e4e4e7] text-wine">
      <div className="paper-bg relative mx-auto min-h-screen w-full max-w-[900px] overflow-clip shadow-[0_0_40px_rgba(0,0,0,0.18)]">
      {hasMusic && <audio ref={audio} src={wedding.music.url} loop preload="auto" />}
      {showCover && <Cover onStart={start} onReveal={() => setOpened(true)} onDone={() => setShowCover(false)} />}
      {opened && (
        <div className="page-in relative overflow-x-clip">
          {/* Hình kiến trúc cổ điển mờ làm nền (tự vẽ) */}
          {[["3.4%", "170%"], ["27.5%", "150%"], ["52%", "158%"], ["bottom", "155%"]].map(([top, w]) => (
            <img key={top} src="/art/castle-background.webp" alt="" aria-hidden className="pointer-events-none absolute left-1/2 z-0 max-w-none -translate-x-1/2 opacity-[0.1]" style={{ ...(top === "bottom" ? { bottom: 0 } : { top }), width: `min(${w}, 900px)` }} />
          ))}
          <Hero />
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
      {opened && !showCover && ambient && <AmbientScene />}
      {opened && hasMusic && <MusicButton playing={playing} onToggle={toggle} volume={volume} onVolume={setVolume} />}
      </div>
    </main>
  );
}
