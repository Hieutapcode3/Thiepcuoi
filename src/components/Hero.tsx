"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { wedding } from "@/data/wedding";
import { Flower } from "./Art";
import { hasWebGL } from "@/lib/gl/support";

const HeroEnvelope3D = dynamic(() => import("./gl/HeroEnvelope3D"), { ssr: false });

/** SAVE THE DATE: ảnh cưới thò ra từ phong bì + tên cô dâu chú rể */
export default function Hero() {
  // "3d": phong bì Three.js · "css": bản ảnh phẳng dự phòng (máy không có WebGL)
  const [mode, setMode] = useState<"pending" | "3d" | "css">("pending");
  useEffect(() => { setMode(hasWebGL() ? "3d" : "css"); }, []);
  const alt = `${wedding.groom.short} & ${wedding.bride.short}`;

  return (
    <header className="relative z-10 flex flex-col items-center overflow-x-clip px-9 pt-14 pb-12 text-center">
      <p className="font-head text-[12px] tracking-[0.4em] text-wine/70">SAVE THE DATE</p>

      <div className="relative mt-16 w-[67vw] max-w-[420px]" style={{ aspectRatio: "1013 / 1168" }}>
        {mode === "3d" && <HeroEnvelope3D photo={wedding.heroPhoto} alt={alt} onFail={() => setMode("css")} />}
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

      <h1 className="relative mt-9 font-viaoda text-[40px] leading-[1.1] text-wine">
        {wedding.groom.short}
        <span className="block font-script text-[34px] leading-none text-wine/40 my-1">&amp;</span>
        {wedding.bride.short}
      </h1>
    </header>
  );
}
