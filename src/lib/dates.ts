const WEEKDAYS = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"];

export function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** Thứ trong tuần (tính theo lịch, không phụ thuộc múi giờ máy) */
export function weekdayVi(date: string) {
  const { y, m, d } = parseDate(date);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Mốc thời gian (ms UTC) của "ngày + giờ" theo múi giờ của đám cưới */
export function toEpoch(date: string, time: string, tzOffsetHours: number) {
  const { y, m, d } = parseDate(date);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh - tzOffsetHours, mm);
}

export const pad = (n: number) => String(n).padStart(2, "0");

/** Thứ tự ô trong lịch tháng, tuần bắt đầu Thứ Hai. null = ô trống */
export function monthGrid(y: number, m: number): (number | null)[] {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=CN
  const offset = (first + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let i = 1; i <= days; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function formatWishTime(iso: string) {
  const t = new Date(iso);
  return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} ${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`;
}
