"use client";
import { wedding } from "@/data/wedding";
import { mapsDirUrl } from "@/lib/calendar";
import { Flower, ScheduleIcon } from "./Art";
import { Reveal, SectionTitle } from "./ui";

export default function Venue() {
  const r = wedding.reception;
  const full = `${r.venueName}, ${r.address}`;
  return (
    <>
      {/* Địa điểm + bản đồ */}
      <Reveal className="relative z-10 overflow-x-clip px-6 pb-2 pt-8 text-center">
        <h3 className="font-head text-[16px] font-bold tracking-[0.03em]">TIỆC CƯỚI SẼ TỔ CHỨC TẠI</h3>
        <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed opacity-80">{full}</p>
        <div className="mx-auto mt-5 w-full max-w-[420px] overflow-hidden rounded-xl shadow-lg md:max-w-[560px]">
          <iframe
            title="Bản đồ địa điểm tiệc cưới"
            src={`https://www.google.com/maps?q=${encodeURIComponent(full)}&output=embed`}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="block h-[260px] w-full border-0 bg-wine/10"
          />
        </div>
        <a href={mapsDirUrl(full)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-head text-[13px] font-bold tracking-wide">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 11l18-8-8 18-2-8z" /></svg>
          Chỉ đường
        </a>
      </Reveal>

      {/* Dress code */}
      <Reveal className="relative z-10 flex flex-col items-center gap-3 px-6 py-10 text-center">
        <SectionTitle>DRESS CODE</SectionTitle>
        <p className="text-[12px] opacity-80">{wedding.dressCode}</p>
        <div className="mt-2 flex gap-3">
          {wedding.dressPalette.map((c) => (
            <span key={c} className="h-10 w-10 rounded-full border border-white/40 shadow-md" style={{ background: c }} />
          ))}
        </div>
      </Reveal>

      {/* Lịch trình */}
      <Reveal className="relative z-10 mx-auto my-4 w-[88%] max-w-[420px] md:max-w-[560px]">
        <section className="wine-panel relative rounded-2xl px-5 py-9 text-cream">
          <SectionTitle onDark className="text-center">LỊCH TRÌNH NGÀY CƯỚI</SectionTitle>
          <ol className="relative mx-auto mt-7 max-w-[300px]">
            <span className="absolute bottom-3 top-3 w-px bg-cream/50" style={{ left: "calc(2.5rem + 3.5rem + 0.75rem + 5px)" }} aria-hidden />
            {wedding.schedule.map((s) => (
              <li key={s.time} className="relative flex min-h-[52px] items-center py-1.5">
                <span className="flex w-10 justify-center">{s.icon && <ScheduleIcon name={s.icon} />}</span>
                <span className="w-14 text-right font-head text-[15px]">{s.time}</span>
                <span className="relative z-10 mx-3 h-[11px] w-[11px] shrink-0 rounded-full bg-cream" />
                <span className="font-body text-[13px] leading-snug opacity-90">{s.title}</span>
              </li>
            ))}
          </ol>
          <Flower className="-right-14 -top-[43px] h-[246px]" />
        </section>
      </Reveal>
    </>
  );
}
