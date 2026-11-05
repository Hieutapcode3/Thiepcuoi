"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { wedding } from "@/data/wedding";
import { formatWishTime } from "@/lib/dates";
import { addWish, listWishes, type Wish } from "@/lib/storage";
import { Reveal, SectionTitle } from "./ui";

function pick(n: number) {
  const pool = [...wedding.wishSuggestions];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
}

export default function Guestbook() {
  const [wishes, setWishes] = useState<Wish[]>(wedding.seedWishes);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sugg, setSugg] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { listWishes().then((l) => setWishes([...l, ...wedding.seedWishes])); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim() || busy) return;
    setBusy(true);
    const w = await addWish({ name: name.trim(), message: msg.trim() });
    setWishes((l) => [w, ...l]);
    setName(""); setMsg(""); setBusy(false);
  };

  return (
    <div className="relative z-10 overflow-x-clip px-4 py-10">
      <Reveal className="relative mx-auto max-w-[472px]">
        <div className="relative w-full [container-type:inline-size]" style={{ aspectRatio: "1100 / 932" }}>
        {/* Tờ giấy: ảnh có viền trong suốt ~14%, nên phóng 137.5% và dịch để phần giấy thật khớp khung */}
        <img src="/art/papernote-background.webp" alt="" aria-hidden draggable={false} className="pointer-events-none absolute max-w-none opacity-95 drop-shadow-[4px_4px_4px_rgba(0,0,0,0.25)]" style={{ width: "137.5cqw", left: "-19.7cqw", top: "-22.1cqw" }} />
        <form onSubmit={submit} className="relative z-10 flex h-full flex-col justify-center px-[7cqw] py-3">
          <SectionTitle className="mb-2 text-center">SỔ LƯU BÚT</SectionTitle>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={500} required placeholder="Nhập tên*" className="mb-2 w-full rounded-xl border border-wine/70 bg-transparent px-4 py-2 font-body text-base text-wine placeholder:text-wine/50 focus:outline-none focus:ring-2 focus:ring-wine sm:text-sm" />
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={10000} required rows={3} placeholder="Nhập lời chúc*" className="w-full resize-none rounded-xl border border-wine/70 bg-transparent px-4 py-2 font-body text-base text-wine placeholder:text-wine/50 focus:outline-none focus:ring-2 focus:ring-wine sm:text-sm" />
          <div className="mt-2 flex items-center justify-between">
            <button type="button" title="Gợi ý lời chúc" onClick={() => setSugg(pick(5))} className="ml-14 rounded-lg bg-wine/10 p-2 leading-none transition-transform hover:scale-110">🪄</button>
            <button type="submit" disabled={busy} className="rounded-full bg-wine px-6 py-2.5 font-head text-[12px] font-bold tracking-[0.12em] text-cream disabled:opacity-50">GỬI LỜI CHÚC</button>
          </div>
        </form>
        </div>

        <div className="wine-scroll mt-14 max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {wishes.map((w, i) => (
            <div key={i} className="rounded-xl border border-wine/30 bg-white/40 px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-body text-[13px] font-bold">{w.name}</span>
                <span className="whitespace-nowrap font-ui text-[10px] opacity-60">{formatWishTime(w.createdAt)}</span>
              </div>
              <p className="mt-1.5 break-words font-body text-[13px] leading-relaxed">{w.message}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {sugg && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-wine-deep/60 sm:items-center" onClick={() => setSugg(null)}>
          <div className="modal-in paper-card w-full rounded-t-2xl p-5 font-ui text-wine sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">✨ Lời chúc gợi ý cho bạn</h3>
            <p className="mb-3 text-xs opacity-70">Chọn một lời chúc bạn thích hoặc tạo lại để xem thêm gợi ý</p>
            <div className="space-y-2">
              {sugg.map((s) => (
                <button key={s} onClick={() => { setMsg(s); setSugg(null); }} className="w-full rounded-lg border border-wine/25 bg-white/50 px-3 py-2 text-left text-sm hover:bg-wine/10">{s}</button>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <button onClick={() => setSugg(pick(5))} className="text-sm font-medium">✨ Tạo thêm</button>
              <button onClick={() => setSugg(null)} className="text-sm opacity-60">Đóng</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
