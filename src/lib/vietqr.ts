// Tạo chuỗi VietQR (chuẩn EMVCo / NAPAS 247) để vẽ mã QR chuyển khoản.

const tlv = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;

export function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildVietQR(o: { bin: string; account: string; amount?: number; note?: string }) {
  const beneficiary = tlv("00", o.bin) + tlv("01", o.account);
  const merchant = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  let s =
    tlv("00", "01") +
    tlv("01", o.amount ? "12" : "11") +
    tlv("38", merchant) +
    tlv("53", "704");
  if (o.amount) s += tlv("54", String(o.amount));
  s += tlv("58", "VN");
  if (o.note) s += tlv("62", tlv("08", o.note));
  s += "6304";
  return s + crc16(s);
}

// Một số mã BIN thường dùng (tham khảo)
export const BANK_BIN: Record<string, string> = {
  Vietcombank: "970436",
  BIDV: "970418",
  VietinBank: "970415",
  Agribank: "970405",
  Techcombank: "970407",
  MBBank: "970422",
  ACB: "970416",
  VPBank: "970432",
  TPBank: "970423",
  Sacombank: "970403",
};
