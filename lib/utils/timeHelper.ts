/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extracts accurate IST (Asia/Kolkata) date and time information regardless of server or client local timezone.
 */
export function getISTDateTime(targetDate: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value || "Sun";
  const year = parts.find((p) => p.type === "year")?.value || "1970";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const dayOfMonth = parts.find((p) => p.type === "day")?.value || "01";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[weekdayStr] ?? 0;
  const hourNum = parseInt(hour, 10) % 24;
  const timeStr = `${String(hourNum).padStart(2, "0")}:${minute}`;
  const dateStr = `${year}-${month}-${dayOfMonth}`;

  return { timeStr, day, dateStr, hour: hourNum, minute: parseInt(minute, 10) };
}

/**
 * Checks whether a given schedule is active right now in Indian Standard Time (IST).
 */
export function isScheduleActive(
  applicableDays?: any,
  timeSlots?: any,
  startTime?: string | null,
  endTime?: string | null
): boolean {
  const { timeStr, day } = getISTDateTime();

  // 1. Check applicable days (0=Sunday, 1=Monday... 6=Saturday)
  if (applicableDays) {
    try {
      const days = typeof applicableDays === "string"
        ? JSON.parse(applicableDays)
        : applicableDays;
      if (Array.isArray(days) && days.length > 0) {
        if (!days.includes(day)) return false;
      }
    } catch (e) {}
  }

  // 2. Check time slots (multiple ranges)
  if (timeSlots) {
    try {
      const slots = typeof timeSlots === "string"
        ? JSON.parse(timeSlots)
        : timeSlots;
      if (Array.isArray(slots) && slots.length > 0) {
        const isAnySlotActive = slots.some((slot: any) => {
          const start = slot.start || "00:00";
          const end = slot.end || "23:59";
          if (start <= end) {
            return timeStr >= start && timeStr <= end;
          } else {
            // Overnight slot (e.g. 22:00 - 02:00)
            return timeStr >= start || timeStr <= end;
          }
        });
        if (!isAnySlotActive) return false;
      }
    } catch (e) {}
  } else if (startTime || endTime) {
    const start = startTime || "00:00";
    const end = endTime || "23:59";
    if (start <= end) {
      if (timeStr < start || timeStr > end) return false;
    } else {
      if (timeStr < start && timeStr > end) return false;
    }
  }

  return true;
}
