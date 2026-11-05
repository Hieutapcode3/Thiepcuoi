import { toEpoch } from "./dates";

const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Link "Thêm vào Google Calendar" */
export function googleCalendarUrl(o: {
  title: string; details: string; location: string;
  date: string; time: string; durationHours: number; tzOffsetHours: number;
}) {
  const start = toEpoch(o.date, o.time, o.tzOffsetHours);
  const end = start + o.durationHours * 3600_000;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: o.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: o.details,
    location: o.location,
  });
  return `https://www.google.com/calendar/render?${p.toString()}`;
}

/** Nội dung file .ics cho Apple/Outlook */
export function icsContent(o: Parameters<typeof googleCalendarUrl>[0]) {
  const start = toEpoch(o.date, o.time, o.tzOffsetHours);
  const end = start + o.durationHours * 3600_000;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//thiep-cuoi//VI", "BEGIN:VEVENT",
    `UID:${start}@thiep-cuoi`, `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${o.title}`, `DESCRIPTION:${o.details}`, `LOCATION:${o.location}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export const mapsDirUrl = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
