"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Chỉ dựng cảnh 3D khi khối này sắp cuộn tới (cách màn hình ≤ rootMargin) — tránh khởi tạo nhiều
 * WebGL context cùng lúc khi trang vừa mở. Đã dựng thì giữ nguyên (không tháo ra khi cuộn đi).
 */
export default function LazyMount({ children, rootMargin = "500px", className = "absolute inset-0" }: { children: ReactNode; rootMargin?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return <div ref={ref} className={className}>{show && children}</div>;
}
