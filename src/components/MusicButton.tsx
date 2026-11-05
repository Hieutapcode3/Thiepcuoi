"use client";
import { useState } from "react";

const btn = "flex items-center justify-center rounded-full text-cream shadow-lg transition-all hover:scale-110 active:scale-95";
const bg = { background: "linear-gradient(to bottom right, #6e1a20, #380a0e)", border: "1px solid rgba(236,228,216,.25)" };

/** Nút nhạc luôn nằm sát góc phải màn hình: bật/tắt + thanh chỉnh âm lượng (bấm biểu tượng loa) */
export default function MusicButton({ playing, onToggle, volume, onVolume }: { playing: boolean; onToggle: () => void; volume: number; onVolume: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {open && (
        <div className="flex items-center gap-2 rounded-full px-3 py-2 text-cream shadow-lg" style={bg}>
          <span aria-hidden className="text-xs opacity-70">🔈</span>
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            aria-label="Âm lượng"
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            className="h-1 w-28 cursor-pointer accent-[#c9a24a]"
          />
          <span aria-hidden className="w-8 text-right font-head text-[11px]">{Math.round(volume * 100)}%</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button aria-label="Chỉnh âm lượng" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${btn} h-10 w-10 text-base`} style={bg}>
          {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
        </button>
        <button aria-label={playing ? "Tắt nhạc" : "Phát nhạc"} onClick={onToggle} className={`${btn} h-12 w-12`} style={bg}>
          {playing ? (
            <span className="flex h-4 items-end gap-[3px]" aria-hidden>
              <span className="eq-bar" style={{ animationDelay: "0s" }} /><span className="eq-bar" style={{ animationDelay: ".25s" }} /><span className="eq-bar" style={{ animationDelay: ".5s" }} />
            </span>
          ) : (
            <span aria-hidden className="text-lg leading-none">♪</span>
          )}
        </button>
      </div>
    </div>
  );
}
