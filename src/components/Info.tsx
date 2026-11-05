"use client";
import { wedding, type Family } from "@/data/wedding";
import { parseDate, pad, weekdayVi } from "@/lib/dates";
import { BigDate, Flower } from "./Art";
import { Reveal, SectionTitle } from "./ui";

function FamilyBlock({ f }: { f: Family }) {
  return (
    <div className="px-2 text-center">
      <p className="text-[13px] font-light opacity-80">Ông Bà</p>
      <p className="mt-1 text-[14px] font-bold">{f.father}</p>
      <p className="text-[14px] font-bold">{f.mother}</p>
      <p className="mt-2 text-[11px] font-light leading-snug opacity-70">{f.address}</p>
    </div>
  );
}

export default function Info() {
  const c = wedding.ceremony;
  const { y, m, d } = parseDate(c.date);
  return (
    <Reveal className="relative z-10 mx-auto w-[88%] max-w-[420px] md:max-w-[560px]">
      <section className="wine-panel relative rounded-2xl px-5 py-9 text-center text-cream">
        <SectionTitle onDark className="text-[16px]">THÔNG TIN LỄ CƯỚI</SectionTitle>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <FamilyBlock f={wedding.groomFamily} />
          <span className="mt-1 h-16 w-px bg-cream/40" />
          <FamilyBlock f={wedding.brideFamily} />
        </div>

        <p className="mt-9 font-head text-[16px] leading-relaxed tracking-[0.06em]">TRÂN TRỌNG BÁO TIN<br />LỄ THÀNH HÔN CỦA CON CHÚNG TÔI</p>

        <div className="mt-7">
          <p className="font-viaoda text-[40px] leading-tight">{wedding.groom.full}</p>
          <p className="mt-1 font-head text-[10px] tracking-[0.35em] opacity-70">{wedding.groom.rank.toUpperCase()}</p>
          <p className="my-3 font-script text-[34px] leading-none text-cream/80">&amp;</p>
          <p className="font-viaoda text-[40px] leading-tight">{wedding.bride.full}</p>
          <p className="mt-1 font-head text-[10px] tracking-[0.35em] opacity-70">{wedding.bride.rank.toUpperCase()}</p>
        </div>

        <p className="mt-9 font-head text-[15px] leading-relaxed tracking-[0.08em]">LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI<br />{c.venue}</p>
        <div className="mt-4 flex items-center justify-center gap-7 font-head text-[13px] tracking-[0.12em]">
          <span>VÀO LÚC {c.time}</span><span>{weekdayVi(c.date)}</span>
        </div>
        <div className="mt-4"><BigDate d={pad(d)} m={pad(m)} y={y} /></div>
        <p className="mt-4 font-head text-[11px] tracking-[0.12em] opacity-80">(TỨC NGÀY {c.lunar.toUpperCase()})</p>

        <Flower className="-right-[76px] top-[230px] h-[328px]" />
      </section>
    </Reveal>
  );
}
