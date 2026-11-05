"use client";
import { useState } from "react";
import { addRsvp } from "@/lib/storage";
import { Modal } from "./ui";

/** Nút "XÁC NHẬN THAM DỰ" + modal */
export default function RsvpButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [att, setAtt] = useState<"yes" | "no" | "">("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = name.trim().length > 0 && att !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    await addRsvp({ name: name.trim(), attending: att as "yes" | "no" });
    setBusy(false);
    setDone(true);
  };
  const close = () => { setOpen(false); setTimeout(() => { setDone(false); setName(""); setAtt(""); }, 300); };

  const opt = (value: "yes" | "no", label: string) => (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all ${att === value ? "border-wine bg-wine/10" : "border-wine/15 bg-white/40 hover:border-wine/30"}`}>
      <input type="radio" name="attending" value={value} checked={att === value} onChange={() => setAtt(value)} className="sr-only" />
      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${att === value ? "bg-wine text-cream" : "bg-wine/10 text-wine/60"}`}>{value === "yes" ? "✓" : "✕"}</span>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full bg-cream px-6 py-2.5 font-head text-[13px] font-semibold tracking-[0.1em] text-wine shadow-md transition-transform hover:scale-[1.03]">
        XÁC NHẬN THAM DỰ
      </button>
      <Modal open={open} onClose={close} label="Xác nhận tham dự">
        {done ? (
          <div className="py-8 text-center">
            <p className="mb-3 text-4xl">{att === "yes" ? "🎉" : "💌"}</p>
            <h2 className="mb-1 text-xl font-semibold">Cảm ơn bạn!</h2>
            <p className="text-sm opacity-70">{att === "yes" ? "Hẹn gặp bạn tại buổi tiệc nhé." : "Rất tiếc không gặp được bạn, cảm ơn bạn đã phản hồi."}</p>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-semibold">Xác nhận tham dự</h2>
            <p className="mb-6 text-sm opacity-70">Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi. Xin xác nhận để chúng tôi chuẩn bị chu đáo nhất.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tên của bạn</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên của bạn" className="w-full rounded-xl border border-wine/25 bg-white/50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-wine sm:text-sm" />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium">Bạn sẽ đến chứ?</span>
                <div className="space-y-2">{opt("yes", "Tôi sẽ đến")}{opt("no", "Rất tiếc, tôi không thể đến")}</div>
              </div>
              <button type="submit" disabled={!ready || busy} className="w-full rounded-xl bg-wine py-3 text-sm font-semibold text-cream transition-opacity disabled:opacity-40">Gửi xác nhận</button>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
