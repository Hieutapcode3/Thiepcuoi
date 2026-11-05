"use client";
import { useEffect, useState } from "react";
import { wedding } from "@/data/wedding";
import { monthGrid, pad, parseDate, toEpoch, weekdayVi } from "@/lib/dates";
import { googleCalendarUrl } from "@/lib/calendar";
import { BigDate, Flower, Heart } from "./Art";
import RsvpButton from "./Rsvp";
import { Reveal, SectionTitle } from "./ui";

/** Đếm ngược: chưa tới (hiện số) / đã qua (ẩn) / đang tính (chờ chạy trên trình duyệt) */
function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <p className="text-center text-sm opacity-70">Đang tính toán...</p>;
  const diff = target - now;
  if (diff <= 0) return null;
  const parts: [number, string][] = [
    [Math.floor(diff / 86400000), "NGÀY"],
    [Math.floor((diff % 86400000) / 3600000), "GIỜ"],
    [Math.floor((diff % 3600000) / 60000), "PHÚT"],
    [Math.floor((diff % 60000) / 1000), "GIÂY"],
  ];
  return (
    <div className="mt-8 text-center">
      <p className="font-head text-[12px] tracking-[0.3em] opacity-80">CÙNG ĐẾM NGƯỢC</p>
      <div className="mt-3 flex justify-center gap-2">
        {parts.map(([v, l]) => (
          <div key={l} className="flex w-14 flex-col items-center rounded-lg bg-cream/10 py-2">
            <span className="font-name text-[26px] leading-none">{pad(v)}</span>
            <span className="mt-1 font-head text-[9px] tracking-[0.2em] opacity-70">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthCalendar({ date }: { date: string }) {
  const { y, m, d } = parseDate(date);
  const cells = monthGrid(y, m);
  return (
    <div className="paper-card mx-auto w-full rounded-xl px-4 pb-4 pt-3 text-wine shadow-md">
      <div className="border-b border-wine/25 pb-2 text-center font-script text-[28px] leading-tight">Tháng {m} / {y}</div>
      <div className="grid grid-cols-7 border-b-2 border-wine">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((t) => (
          <div key={t} className="py-1.5 text-center font-head text-[10px] opacity-60">{t}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c, i) => (
          <div key={i} className="flex items-center justify-center py-1">
            {c !== null && (c === d ? (
              <span className="relative flex h-8 w-8 items-center justify-center">
                <Heart className="absolute inset-0 h-full w-full text-wine" />
                <span className="relative -mt-0.5 font-head text-[11px] font-bold text-cream">{c}</span>
              </span>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center font-head text-[12px]">{c}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reception() {
  const r = wedding.reception;
  const { y, m, d } = parseDate(r.date);
  const target = toEpoch(r.date, r.time, wedding.tzOffsetHours);
  const cal = {
    title: `Đám cưới ${wedding.groom.full} & ${wedding.bride.full}`,
    details: `Tiệc cưới của ${wedding.groom.full} & ${wedding.bride.full} tại ${r.venueName}, ${r.address}`,
    location: `${r.venueName}, ${r.address}`,
    date: r.date, time: r.time, durationHours: r.durationHours, tzOffsetHours: wedding.tzOffsetHours,
  };

  return (
    <Reveal className="relative z-10 mx-auto mb-4 w-[88%] max-w-[420px] md:max-w-[560px]">
      <section className="wine-panel relative rounded-2xl px-5 py-9 text-center text-cream">
        <SectionTitle onDark className="text-[16px]">THÔNG TIN TIỆC CƯỚI</SectionTitle>
        <p className="mt-6 font-body text-[18px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
        <div className="mt-4 flex items-center justify-center gap-7 font-head text-[13px] tracking-[0.12em]">
          <span>{r.time}</span><span>{weekdayVi(r.date)}</span>
        </div>
        <div className="mt-4"><BigDate d={pad(d)} m={pad(m)} y={y} /></div>
        <p className="mt-4 font-head text-[11px] tracking-[0.12em] opacity-80">(TỨC NGÀY {r.lunar.toUpperCase()})</p>

        <div className="mt-7 flex justify-center gap-10 font-head">
          <div><p className="text-[11px] tracking-[0.18em] opacity-75">ĐÓN KHÁCH</p><p className="mt-1 text-[18px]">{r.arrivalTime}</p></div>
          <div><p className="text-[11px] tracking-[0.18em] opacity-75">KHAI TIỆC</p><p className="mt-1 text-[18px]">{r.time}</p></div>
        </div>

        <Countdown target={target} />

        <div className="mt-8"><MonthCalendar date={r.date} /></div>

        <div className="mt-5 flex items-center justify-center gap-5 text-[13px]">
          <a href={googleCalendarUrl(cal)} target="_blank" rel="noopener noreferrer" className="font-head underline underline-offset-4">Thêm vào lịch</a>
        </div>
        <div className="mt-6"><RsvpButton /></div>

        <Flower className="-left-[61px] top-[79px] h-[197px]" />
      </section>
    </Reveal>
  );
}
