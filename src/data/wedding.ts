// Toàn bộ nội dung thiệp nằm ở đây. Đổi file này là đổi thiệp, không cần sửa component.
// Để thêm mẫu thiệp khác: nhân bản file này.

export type Icon = "camera" | "cake" | "dish" | "toast";
export type Person = { full: string; short: string; rank: string };
export type Family = { father: string; mother: string; address: string };
export type GiftAccount = {
  owner: string; // "Chú Rể" / "Cô Dâu"
  bank: string; // tên hiển thị
  bin: string; // mã BIN ngân hàng (xem src/lib/vietqr.ts)
  account: string;
  holder: string;
};

export const wedding = {
  // ---- Thông tin chung ----
  groom: { full: "Duy Nam", short: "Duy Nam", rank: "Trưởng Nam" } as Person,
  bride: { full: "Phùng Linh", short: "Phùng Linh", rank: "Út Nữ" } as Person,
  groomFamily: {
    father: "Võ Nhật Minh",
    mother: "Trần Thu Thảo",
    address: "63 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  } as Family,
  brideFamily: {
    father: "Huỳnh Thanh Nam",
    mother: "Nguyễn Thị Kim Oanh",
    address: "456 Lê Lợi, Quận 3, TP. Hồ Chí Minh",
  } as Family,

  heroQuote: "LOVE NEVER FAILS",
  welcome: "WELCOME TO OUR WEDDING",
  thankYou: "Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!",

  // ---- Thời gian & địa điểm ----
  tzOffsetHours: 7, // Việt Nam UTC+7
  ceremony: {
    venue: "TƯ GIA",
    date: "2026-07-30", // YYYY-MM-DD
    time: "09:00",
    lunar: "17 tháng 6 năm Bính Ngọ", // ghi tay hoặc tính bằng thư viện âm lịch
  },
  reception: {
    date: "2026-07-30",
    time: "18:00",
    durationHours: 2, // dùng cho "Thêm vào lịch"
    lunar: "17 tháng 6 năm Bính Ngọ",
    arrivalTime: "17:30", // giờ đón khách (hiện cạnh giờ khai tiệc)
    venueName: "Gala Center",
    address: "415 Hoàng Văn Thụ, Phường 2, Tân Bình, Hồ Chí Minh",
  },
  dressCode: "Trang phục dự tiệc",
  dressPalette: ["#511419", "#8b3a44", "#c9a24a", "#ece4d8"], // bảng màu gợi ý (đổi tuỳ ý, tối đa 5)
  // icon: "camera" | "cake" | "dish" | "toast" | undefined
  schedule: [
    { time: "17:30", title: "Đón khách", icon: undefined as Icon | undefined },
    { time: "18:30", title: "Khai tiệc", icon: "camera" as Icon | undefined },
    { time: "18:45", title: "Rót rượu, cắt bánh", icon: "cake" as Icon | undefined },
    { time: "19:00", title: "Phục vụ món chính", icon: "dish" as Icon | undefined },
    { time: "21:00", title: "Kết thúc tiệc", icon: undefined as Icon | undefined },
  ],

  // ---- Hình ảnh (ảnh cưới thật trong public/photos; muốn đổi thì thay file hoặc sửa đường dẫn) ----
  heroPhoto: "/photos/anh-cuoi-2.webp",
  album: [
    "/photos/anh-cuoi-5.webp",
    "/photos/anh-cuoi-1.webp",
    "/photos/anh-cuoi-2.webp",
    "/photos/anh-cuoi-3.webp",
    "/photos/anh-cuoi-4.webp",
  ],

  // ---- Nhạc nền: bỏ file .mp3 hợp lệ vào public/music rồi điền đường dẫn. Để "" thì ẩn nút nhạc. ----
  music: { url: "/music/nhac-nen.mp3" as string },

  // ---- Mừng cưới (số tài khoản dưới đây là GIẢ, thay bằng số thật) ----
  gifts: [
    { owner: "Chú Rể", bank: "Vietcombank", bin: "970436", account: "123456789", holder: "VO HAI NAM" },
    { owner: "Cô Dâu", bank: "BIDV", bin: "970418", account: "123456789", holder: "HUYNH KHANH LINH" },
  ] as GiftAccount[],

  // ---- Lưu bút: lời chúc có sẵn + gợi ý ----
  seedWishes: [
    { name: "Gia đình cô Lan", message: "Chúc hai cháu trăm năm hạnh phúc, sớm sinh quý tử!", createdAt: "2026-07-30T03:58:41Z" },
    { name: "Bạn Quỳnh Như", message: "Hy vọng tổ ấm nhỏ này sẽ sớm rộn rã tiếng cười con trẻ và hạnh phúc viên mãn.", createdAt: "2026-07-17T16:08:37Z" },
  ],
  wishSuggestions: [
    "Mong rằng hạnh phúc sẽ luôn hiện hữu trong từng khoảnh khắc của hai bạn.",
    "Mong rằng tổ ấm mới của hai bạn sẽ luôn đong đầy niềm vui và tiếng cười.",
    "Hy vọng hai bạn luôn tìm thấy bình yên và hạnh phúc trong vòng tay của nhau.",
    "Mong hai bạn xây dựng một mái ấm tràn đầy tiếng cười và niềm vui.",
    "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!",
    "Chúc mừng hạnh phúc của hai bạn, mong mỗi ngày bên nhau đều là một ngày vui.",
    "Chúc cô dâu chú rể luôn yêu thương, thấu hiểu và đồng hành cùng nhau suốt cuộc đời.",
  ],
};

export type Wedding = typeof wedding;
