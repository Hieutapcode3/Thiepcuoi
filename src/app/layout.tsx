import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { wedding } from "@/data/wedding";

export const metadata: Metadata = {
  title: `Thiệp cưới ${wedding.groom.short} & ${wedding.bride.short}`,
  description: `Trân trọng kính mời bạn tới dự lễ cưới của ${wedding.groom.short} & ${wedding.bride.short}`,
  openGraph: { title: `Thiệp cưới ${wedding.groom.short} & ${wedding.bride.short}`, type: "website", locale: "vi_VN" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#511419" };

// Font tải lúc chạy từ Google Fonts (muốn tự host: dùng next/font/local).
const FONTS =
  "https://fonts.googleapis.com/css2?family=Viaoda+Libre&family=Cormorant+Garamond:wght@500;600&family=The+Nautigal&family=Pinyon+Script&family=EB+Garamond:wght@300;400&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;500;600&family=Montserrat:wght@400;500;600&family=Playfair+Display:wght@400;600&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="font-body">
        {children}
        {/* Vercel Web Analytics: đếm lượt xem / khách truy cập (xem ở tab Analytics trên vercel.com) */}
        <Analytics />
      </body>
    </html>
  );
}
