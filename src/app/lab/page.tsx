import type { Metadata } from "next";
import IntroLab from "@/components/IntroLab";

// Trang thử nghiệm hiệu ứng chuyển cảnh (không cho Google lập chỉ mục). Xoá thư mục src/app/lab nếu không cần nữa.
export const metadata: Metadata = { title: "Lab hiệu ứng mở thiệp", robots: { index: false, follow: false } };

export default function LabPage() {
  return <IntroLab />;
}
