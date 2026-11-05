"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Tiêu đề khối: dùng trên nền kem (wine) hoặc trên khối đỏ (cream) */
export function SectionTitle({ children, onDark = false, className = "" }: { children: ReactNode; onDark?: boolean; className?: string }) {
  return (
    <h2 className={`font-head font-bold tracking-[0.03em] text-[18px] md:text-[20px] uppercase ${onDark ? "text-cream" : "text-wine"} ${className}`}>
      {children}
    </h2>
  );
}

/** Hiện dần khi cuộn tới (IntersectionObserver) */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${show ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Modal: bấm nền hoặc nhấn Esc để đóng */
export function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-wine-deep/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <div className="modal-in paper-card relative rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto font-ui text-wine" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Đóng" className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-wine/10 text-wine hover:bg-wine/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
