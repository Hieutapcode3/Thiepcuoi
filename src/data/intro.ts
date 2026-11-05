/**
 * Hiệu ứng chuyển cảnh khi bấm "Mở thiệp":
 * phong bì rơi xuống giữa màn hình (nền tối lại) → mở thiệp → thu nhỏ về chỗ cũ (nền sáng lại).
 * Tinh chỉnh trực quan ở trang /lab rồi bấm "Sao chép cấu hình" và dán đè vào đây.
 */
export type IntroEntry = "roi" | "roi-xoay" | "phong-to";

export type IntroConfig = {
  enabled: boolean;     // bật / tắt hiệu ứng
  entry: IntroEntry;    // kiểu xuất hiện: rơi nảy · rơi chao lượn · phóng to dần
  startDelayMs: number; // chờ bao lâu sau khi trang thiệp hiện ra mới bắt đầu (ms)
  fallMs: number;       // thời gian rơi / xuất hiện (ms)
  bounce: number;       // độ nảy khi rơi (0 = không nảy, 1 = nảy nhiều) — kiểu "rơi nảy"
  holdMs: number;       // dừng ở giữa trước khi mở (ms)
  openSpeed: number;    // tốc độ mở phong bì (1 = bình thường)
  openMs: number;       // thời gian xem thiệp mở ở giữa màn hình (ms)
  shrinkMs: number;     // thời gian thu nhỏ về chỗ cũ (ms)
  centerSize: number;   // độ cao phong bì khi ở giữa, theo % chiều cao màn hình (0–1)
  dim: number;          // độ tối của nền (0–1)
  dimColor: string;     // màu phủ nền
  dimInMs: number;      // (không còn dùng: nền tối sẵn ngay khi vào trang)
  blur: number;         // làm mờ nền (px)
};

export const introConfig: IntroConfig = {
  enabled: true,
  entry: "roi",
  startDelayMs: 200,
  fallMs: 1100,
  bounce: 0.6,
  holdMs: 200,
  openSpeed: 1.1,
  openMs: 2000,
  shrinkMs: 1100,
  centerSize: 0.81,
  dim: 0.6,
  dimColor: "#1a0507",
  dimInMs: 600,
  blur: 2,
};

export const introPresets: { name: string; cfg: Partial<IntroConfig> }[] = [
  { name: "Rơi nảy", cfg: { enabled: true, entry: "roi", fallMs: 1400, bounce: 0.5, holdMs: 200 } },
  { name: "Rơi chao lượn", cfg: { enabled: true, entry: "roi-xoay", fallMs: 1700, holdMs: 250 } },
  { name: "Phóng to dần", cfg: { enabled: true, entry: "phong-to", fallMs: 900, holdMs: 150 } },
  { name: "Tắt hiệu ứng", cfg: { enabled: false } },
];
