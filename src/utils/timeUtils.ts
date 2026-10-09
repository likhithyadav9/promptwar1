import { BreakConfig, CollegeConfig, SlotTiming } from '../types/timetable';

/**
 * Converts "HH:MM" (24-hour) string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 9 * 60; // default 9:00 AM
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (isNaN(hours) ? 9 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}

/**
 * Converts minutes from midnight to "HH:MM" 24-hour string (for input type="time")
 */
export function minutesTo24h(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Converts minutes from midnight to "hh:mm AM/PM" format
 */
export function minutesTo12h(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Computes all slot timings including periods and interleaved breaks in chronological order.
 */
export function calculateSlotTimings(
  startTimeStr: string,
  periodDuration: number,
  periodsPerDay: number,
  breaks: BreakConfig[]
): SlotTiming[] {
  const slots: SlotTiming[] = [];
  let currentMinutes = timeStringToMinutes(startTimeStr);

  // Sort breaks by afterPeriod ascending
  const sortedBreaks = [...breaks].sort((a, b) => a.afterPeriod - b.afterPeriod);

  for (let p = 1; p <= periodsPerDay; p++) {
    const periodStart = currentMinutes;
    const periodEnd = currentMinutes + periodDuration;

    slots.push({
      periodNumber: p,
      isBreak: false,
      startTime: minutesTo12h(periodStart),
      endTime: minutesTo12h(periodEnd),
      startMinutes: periodStart,
      endMinutes: periodEnd,
    });

    currentMinutes = periodEnd;

    // Check if any break occurs after this period
    const breaksAfterThis = sortedBreaks.filter((b) => b.afterPeriod === p);
    for (const brk of breaksAfterThis) {
      if (brk.duration > 0) {
        const breakStart = currentMinutes;
        const breakEnd = currentMinutes + brk.duration;
        slots.push({
          periodNumber: -1,
          isBreak: true,
          breakType: brk.type,
          breakName: brk.name || (brk.type === 'lunch' ? 'Lunch Break' : 'Short Break'),
          breakDuration: brk.duration,
          startTime: minutesTo12h(breakStart),
          endTime: minutesTo12h(breakEnd),
          startMinutes: breakStart,
          endMinutes: breakEnd,
        });
        currentMinutes = breakEnd;
      }
    }
  }

  return slots;
}

/**
 * Calculates the exact end time based on periods, duration, and breaks
 */
export function calculateCalculatedEndTime(config: CollegeConfig): {
  calculatedTime24: string;
  calculatedTime12: string;
  totalDurationMinutes: number;
} {
  const slots = calculateSlotTimings(
    config.startTime,
    config.periodDuration,
    config.periodsPerDay,
    config.breaks
  );

  if (slots.length === 0) {
    return { calculatedTime24: config.startTime, calculatedTime12: '09:00 AM', totalDurationMinutes: 0 };
  }

  const lastSlot = slots[slots.length - 1];
  const totalMinutes = lastSlot.endMinutes - slots[0].startMinutes;

  return {
    calculatedTime24: minutesTo24h(lastSlot.endMinutes),
    calculatedTime12: minutesTo12h(lastSlot.endMinutes),
    totalDurationMinutes: totalMinutes,
  };
}
