"use client";
import { useEffect, useState } from "react";
import Invitation from "./Invitation";
import { introConfig, introPresets, type IntroConfig, type IntroEntry } from "@/data/intro";

const KEY = "thiep-intro-lab";

type Num = { [K in keyof IntroConfig]: IntroConfig[K] extends number ? K : never }[keyof IntroConfig];
const SLIDERS: { k: Num; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { k: "startDelayMs", label: "Chờ trước khi bắt đầu", min: 0, max: 2000, step: 50, unit: "ms" },
  { k: "fallMs", label: "Thời gian rơi / xuất hiện", min: 300, max: 3000, step: 50, unit: "ms" },
  { k: "bounce", label: "Độ nảy (kiểu rơi nảy)", min: 0, max: 1, step: 0.05, unit: "%" },
  { k: "holdMs", label: "Dừng ở giữa trước khi mở", min: 0, max: 2000, step: 50, unit: "ms" },
  { k: "openSpeed", label: "Tốc độ mở phong bì", min: 0.4, max: 2.5, step: 0.05, unit: "×" },
  { k: "openMs", label: "Thời gian xem thiệp ở giữa", min: 600, max: 6000, step: 100, unit: "ms" },
  { k: "shrinkMs", label: "Thời gian thu nhỏ về chỗ cũ", min: 300, max: 3000, step: 50, unit: "ms" },
  { k: "centerSize", label: "Độ to khi ở giữa (theo chiều cao màn hình)", min: 0.3, max: 0.9, step: 0.01, unit: "%" },
  { k: "dim", label: "Độ tối của nền", min: 0, max: 0.95, step: 0.05, unit: "%" },
  { k: "blur", label: "Làm mờ nền", min: 0, max: 10, step: 0.5, unit: "px" },
];
const ENTRIES: { v: IntroEntry; label: string }[] = [
  { v: "roi", label: "Rơi thẳng + nảy nhẹ" },
  { v: "roi-xoay", label: "Rơi chao lượn (như chiếc lá)" },
  { v: "phong-to", label: "Phóng to dần tại chỗ" },
];

const fmt = (v: number, unit?: string) => (unit === "%" ? `${Math.round(v * 100)}%` : unit === "×" ? `${v.toFixed(2)}×` : `${v}${unit ?? ""}`);
const toCode = (c: IntroConfig) =>
  `export const introConfig: IntroConfig = {\n${Object.entries(c).map(([k, v]) => `  ${k}: ${typeof v === "string" ? JSON.stringify(v) : v},`).join("\n")}\n};`;

/** Trang /lab: chạy thử hiệu ứng "phong bì rơi → mở → thu nhỏ", chỉnh thông số, sao chép cấu hình vào src/data/intro.ts */
export default function IntroLab() {
  const [cfg, setCfg] = useState<IntroConfig>(introConfig);
  const [run, setRun] = useState(0);
  const [fromCover, setFromCover] = useState(true);
  const [panel, setPanel] = useState(true);
  const [copied, setCopied] = useState(false);

  // nhớ thông số đang chỉnh (chỉ trên trình duyệt này)
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setCfg({ ...introConfig, ...JSON.parse(s) }); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {} }, [cfg]);

  const set = <K extends keyof IntroConfig>(k: K, v: IntroConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const replay = () => setRun((r) => r + 1);
  const copy = async () => {
    try { await navigator.clipboard.writeText(toCode(cfg)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  };

  return (
    <>
      <Invitation key={run} intro={cfg} startOpened={!fromCover} />

      <button
        onClick={() => setPanel((p) => !p)}
        className="fixed left-3 top-3 z-[90] rounded-full bg-neutral-900 px-3 py-1.5 font-ui text-[12px] font-medium text-white shadow-lg"
      >
        {panel ? "✕ Ẩn bảng" : "⚙ Lab"}
      </button>

      {panel && (
        <aside className="fixed left-3 top-12 z-[90] max-h-[calc(100vh-60px)] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-xl bg-white/95 p-4 font-ui text-[12px] text-neutral-800 shadow-2xl backdrop-blur">
          <h2 className="text-[14px] font-semibold">Hiệu ứng mở thiệp</h2>
          <p className="mt-1 text-[11px] leading-snug text-neutral-500">Phong bì rơi xuống giữa → nền tối → mở thiệp → thu nhỏ về chỗ cũ. Chỉnh xong bấm “Chạy lại” để xem.</p>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {introPresets.map((p) => (
              <button key={p.name} onClick={() => { setCfg((c) => ({ ...c, ...p.cfg })); replay(); }} className="rounded-md border border-neutral-300 px-2 py-1.5 text-left hover:border-neutral-800 hover:bg-neutral-50">
                {p.name}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} />
            Bật hiệu ứng
          </label>

          <p className="mt-3 font-medium">Kiểu xuất hiện</p>
          <div className="mt-1 flex flex-col gap-1">
            {ENTRIES.map((e) => (
              <label key={e.v} className="flex items-center gap-2">
                <input type="radio" name="entry" checked={cfg.entry === e.v} onChange={() => set("entry", e.v)} />
                {e.label}
              </label>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            {SLIDERS.map((s) => (
              <label key={s.k} className="block">
                <span className="flex justify-between"><span>{s.label}</span><b className="tabular-nums">{fmt(cfg[s.k], s.unit)}</b></span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={cfg[s.k]} onChange={(e) => set(s.k, parseFloat(e.target.value))} className="mt-1 w-full accent-[#6e1a20]" />
              </label>
            ))}
            <label className="flex items-center justify-between">
              <span>Màu phủ nền</span>
              <input type="color" value={cfg.dimColor} onChange={(e) => set("dimColor", e.target.value)} className="h-7 w-12 cursor-pointer rounded border border-neutral-300" />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={fromCover} onChange={(e) => setFromCover(e.target.checked)} />
            Chạy lại từ trang bìa (bấm “Mở thiệp”)
          </label>

          <div className="mt-3 flex gap-2">
            <button onClick={replay} className="flex-1 rounded-md bg-[#6e1a20] px-3 py-2 font-medium text-white hover:bg-[#511419]">▶ Chạy lại</button>
            <button onClick={() => { setCfg(introConfig); replay(); }} className="rounded-md border border-neutral-300 px-3 py-2 hover:bg-neutral-50">Mặc định</button>
          </div>

          <p className="mt-4 font-medium">Cấu hình để dán vào <code>src/data/intro.ts</code></p>
          <textarea readOnly value={toCode(cfg)} rows={14} className="mt-1 w-full resize-none rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug" />
          <button onClick={copy} className="mt-1.5 w-full rounded-md bg-neutral-900 px-3 py-2 font-medium text-white">{copied ? "✓ Đã sao chép" : "Sao chép cấu hình"}</button>
        </aside>
      )}
    </>
  );
}
