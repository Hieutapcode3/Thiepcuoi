# Thiệp cưới – Minimalism Đỏ Đậm

Thiệp cưới online (Next.js 14 + Tailwind 3 + TypeScript), phong cách đỏ rượu – giấy kem – hoa – phong bì.
Có hiệu ứng 3D bằng Three.js (bìa, phong bì, cánh hoa rơi, album vòng quay, lì xì). Máy không có WebGL hoặc bật "giảm chuyển động" sẽ tự dùng bản CSS phẳng.
Ảnh hoa/phong bì lấy từ bản mẫu chungdoi.com để dùng nội bộ — nếu đưa lên mạng công khai hãy thay bằng ảnh của bạn.

## Chạy
```
npm install
npm run dev
```
Mở http://localhost:3000 (màn bìa) hoặc http://localhost:3000/?open=1 (vào thẳng thiệp).

## Hiệu ứng 3D (Three.js)
Mã nằm ở `src/components/gl/` và `src/lib/gl/`:
- `CoverScene` — tim 3D kim loại/lụa lơ lửng có ánh sáng + bóng đổ; bấm "Mở thiệp" thì tim và cánh hoa bắn ra từ con dấu.
- `HeroEnvelope3D` — nắp phong bì lật mở, ảnh trượt lên, hoa hiện ra; nghiêng theo chuột / con quay điện thoại (iOS sẽ hỏi quyền khi bấm "Mở thiệp").
- `AmbientScene` — cánh hoa hồng rơi 3D (phản ứng với cuộn trang) + bụi vàng lấp lánh, phủ cả trang.
- `AlbumRing3D` — album vòng quay: kéo ngang để xoay, bấm ảnh bên cạnh để xoay tới, bấm ảnh giữa để xem lớn.
- `GiftEnvelopes3D` — hai bao lì xì 3D, bấm thì lật 360°.
Chỉnh nhanh: số lượng tim/cánh hoa (`N` trong `CoverScene`, `AmbientScene`), tốc độ rơi (`vy`), màu (`PETAL_COLORS`, `COLORS`).
Three.js được nạp riêng (`next/dynamic`, chỉ ở trình duyệt) nên không làm chậm lần tải đầu của phần chữ.

## Sửa nội dung
- `src/data/wedding.ts`: tên, ngày, địa điểm, lịch trình, dress code, tài khoản ngân hàng (đang là số giả), lời chúc mẫu, nhạc (`music.url`, để trống = không có nhạc).
- Thay ảnh: bỏ ảnh thật vào `public/photos/` rồi sửa đường dẫn trong `wedding.ts`.
- Màu/phông: `tailwind.config.ts`, `src/app/layout.tsx`.

## Đã kiểm tra
- Gõ kiểu TypeScript (không còn lỗi thật), bundle esbuild, chạy Chromium ở 390px và 1280px:
  mở bìa, RSVP, gợi ý + gửi lời chúc, hộp quà + 2 mã QR, album + lightbox, không lỗi console, không tràn ngang.
- Mã VietQR (CRC16) đã đối chiếu với 2 chuỗi thật.

## Chưa kiểm tra / lưu ý
- Hiệu ứng 3D đã chạy thử trong Chromium (WebGL phần mềm): bìa, nổ tim, phong bì, album, lì xì, không lỗi console. Chưa thử trên GPU/điện thoại thật nên hãy xem thử độ mượt; nếu máy yếu giảm `N` hoặc `maxDpr`.
- Chưa chạy `next build` thật (môi trường dựng không tải được npm); hãy chạy `npm install && npm run build` ở máy bạn.
- Bản kiểm thử dùng Tailwind 4 để xấp xỉ Tailwind 3 – có thể lệch vài pixel.
- RSVP và sổ lưu bút đang lưu bằng localStorage (`src/lib/storage.ts`); cần backend thật để chủ nhà xem được.
- Bản đồ Google nhúng cần mạng; chưa có file nhạc; font tải từ Google Fonts.
- Số tài khoản trong dữ liệu là số giả, phải thay trước khi dùng.
