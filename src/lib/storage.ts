// Lớp lưu dữ liệu RSVP + lưu bút. Hiện dùng localStorage (chỉ hiển thị trên máy người xem).
// Muốn dùng thật: thay thân hàm bằng fetch tới API/Supabase/Firebase/Google Sheet.

export type Wish = { name: string; message: string; createdAt: string };
export type Rsvp = { name: string; attending: "yes" | "no"; createdAt: string };

const KEYS = { wishes: "thiep:wishes", rsvp: "thiep:rsvp" };

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function write<T>(key: string, v: T[]) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export async function listWishes(): Promise<Wish[]> { return read<Wish>(KEYS.wishes); }
export async function addWish(w: Omit<Wish, "createdAt">): Promise<Wish> {
  const item = { ...w, createdAt: new Date().toISOString() };
  write(KEYS.wishes, [item, ...read<Wish>(KEYS.wishes)]);
  return item;
}
export async function addRsvp(r: Omit<Rsvp, "createdAt">): Promise<void> {
  write(KEYS.rsvp, [{ ...r, createdAt: new Date().toISOString() }, ...read<Rsvp>(KEYS.rsvp)]);
}
