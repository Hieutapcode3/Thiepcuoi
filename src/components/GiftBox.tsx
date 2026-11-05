"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import dynamic from "next/dynamic";
import { hasWebGL } from "@/lib/gl/support";
import LazyMount from "./gl/LazyMount";
import { wedding, type GiftAccount } from "@/data/wedding";
import { buildVietQR } from "@/lib/vietqr";
import { Modal, Reveal, SectionTitle } from "./ui";

const GiftEnvelopes3D = dynamic(() => import("./gl/GiftEnvelopes3D"), { ssr: false });

const CONFETTI = [
  [-55, -130, 540], [46, -150, -460], [-12, -160, 620], [28, -115, -340],
  [-34, -105, 320], [58, -88, -240], [8, -170, 420], [-46, -78, -200],
];
const COLORS = ["#c9a24a", "#a8323b", "#ece4d8", "#511419"];

function Account({ g }: { g: GiftAccount }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(buildVietQR({ bin: g.bin, account: g.account }), { width: 512, margin: 1, errorCorrectionLevel: "M" }).then(setQr).catch(() => {});
  }, [g]);
  const save = () => {
    const a = document.createElement("a");
    a.href = qr; a.download = `qr-${g.owner.toLowerCase().replace(/\s+/g, "-")}.png`; a.click();
  };
  return (
    <div className="border-t border-wine/15 py-4 text-center first:border-t-0">
      <p className="text-sm font-semibold">{g.owner} - {g.holder}</p>
      <p className="mt-1 text-xs opacity-70">{g.bank}</p>
      <p className="my-1 text-base font-semibold tracking-wider">{g.account}</p>
      {qr ? <img src={qr} alt={`QR ${g.owner}`} className="mx-auto h-40 w-40 rounded-lg bg-white p-1.5" /> : <div className="mx-auto h-40 w-40 animate-pulse rounded bg-wine/10" />}
      <button onClick={save} disabled={!qr} className="mt-2 rounded-full bg-wine px-5 py-1.5 text-xs font-semibold text-cream disabled:opacity-40">Lưu QR</button>
    </div>
  );
}

export default function GiftBox() {
  const [phase, setPhase] = useState<"idle" | "pop" | "open">("idle");
  const [mode, setMode] = useState<"pending" | "3d" | "css">("pending");
  useEffect(() => { setMode(hasWebGL() ? "3d" : "css"); }, []);
  const click = () => {
    if (phase !== "idle") return;
    setPhase("pop");
    setTimeout(() => setPhase("open"), 1300);
  };
  const close = () => setPhase("idle");

  return (
    <div className="relative z-10 overflow-x-clip py-10">
      <Reveal className="flex flex-col items-center px-4 text-center">
        <SectionTitle>HỘP QUÀ MỪNG</SectionTitle>
        <button type="button" aria-label="Mở hộp mừng cưới" onClick={click} className="relative mt-4 cursor-pointer outline-none" style={{ width: 335, height: 330 }}>
          {[["8%", "14%", 22, ""], ["18%", "10%", 16, "right"], ["32%", "5%", 14, ""], ["26%", "5%", 18, "right"]].map(([t, s, size, side], i) => (
            <span key={i} className="igb-sparkle pointer-events-none absolute z-20 text-gold" style={{ top: t as string, [side || "left"]: s as string, fontSize: size as number, animationDelay: `${i * 0.5}s` }}>✦</span>
          ))}
          {mode === "3d" && (
            <LazyMount>
              <GiftEnvelopes3D flipping={phase === "pop"} onFail={() => setMode("css")} />
            </LazyMount>
          )}
          {mode === "css" && (
            <>
              <img src="/art/minimalism_darkred.png" alt="" draggable={false} className={`absolute max-w-none object-contain ${phase === "pop" ? "igb-pop" : "igb-bob"}`} style={{ left: 132, top: 38, width: 204, height: 252, animationDelay: "-1.2s" }} />
              <img src="/art/minimalism_darkred.png" alt="" draggable={false} className={`absolute max-w-none object-contain ${phase === "pop" ? "igb-pop" : "igb-bob"}`} style={{ left: 24, top: 22, width: 190, height: 275, rotate: "-10deg" }} />
            </>
          )}
          {phase === "pop" && CONFETTI.map(([dx, dy, rot], i) => (
            <span key={i} className="igb-confetti" style={{ background: COLORS[i % 4], ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px`, ["--rot" as string]: `${rot}deg`, animationDelay: `${i * 30}ms` }} />
          ))}
        </button>
        <p className="igb-hint -mt-2 font-head text-sm tracking-widest">Nhấn để mở</p>
      </Reveal>

      <Modal open={phase === "open"} onClose={close} label="Hộp quà mừng">
        <h2 className="mb-2 text-center font-head text-lg font-bold tracking-widest">HỘP QUÀ MỪNG</h2>
        {wedding.gifts.map((g) => <Account key={g.owner} g={g} />)}
        <p className="mt-2 text-center text-[11px] opacity-60">Mã QR theo chuẩn VietQR, quét bằng ứng dụng ngân hàng.</p>
      </Modal>
    </div>
  );
}
