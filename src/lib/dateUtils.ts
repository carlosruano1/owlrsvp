'use client'

// Utilities for parsing and formatting event dates without timezone conversion.
// We treat the stored value as a "floating" local datetime and avoid the JS Date
// object's timezone adjustments for time-of-day display.

export interface ParsedDateTime {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Parse strings like "YYYY-MM-DDTHH:MM" or ISO-like strings where the first
// 16-19 characters match the same pattern. We ignore any trailing timezone
// information intentionally to preserve the original time-of-day.
export function parseDateTimeLocal(input?: string | null): ParsedDateTime | null {
  if (!input) return null;

  // Try to capture YYYY-MM-DDTHH:MM(:SS)? at the beginning of the string
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = match[6] ? Number(match[6]) : 0;

  if (
    Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) ||
    Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)
  ) {
    return null;
  }

  return { year, month, day, hours, minutes, seconds };
}

export function formatTime12h(input?: string | null): string {
  const parsed = parseDateTimeLocal(input);
  if (!parsed) return 'Not set';
  const period = parsed.hours >= 12 ? 'PM' : 'AM';
  const displayHours = parsed.hours % 12 || 12;
  const minutes = parsed.minutes.toString().padStart(2, '0');
  return `${displayHours}:${minutes} ${period}`;
}

export function formatDateLong(input?: string | null): string {
  const parsed = parseDateTimeLocal(input);
  if (!parsed) return 'No date set';

  // Weekday based only on date part (time-of-day irrelevant)
  const d = new Date(parsed.year, parsed.month - 1, parsed.day);
  const weekday = WEEKDAY_NAMES_LONG[d.getDay()];
  const monthName = MONTH_NAMES_LONG[parsed.month - 1];
  return `${weekday}, ${monthName} ${parsed.day}, ${parsed.year}`;
}

export function formatDateTimeShort(input?: string | null): string {
  const parsed = parseDateTimeLocal(input);
  if (!parsed) return 'Not set';
  const month = MONTH_NAMES_SHORT[parsed.month - 1];
  const time = formatTime12h(input);
  return `${month} ${parsed.day}, ${parsed.year} at ${time}`;
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

// Add minutes to a ParsedDateTime without invoking timezone conversions.
function addMinutesFloating(date: ParsedDateTime, deltaMinutes: number): ParsedDateTime {
  let minutesTotal = date.hours * 60 + date.minutes + deltaMinutes;
  let addDays = Math.floor(minutesTotal / 1440);
  let remaining = ((minutesTotal % 1440) + 1440) % 1440; // handle negatives
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;

  let year = date.year;
  let month = date.month;
  let day = date.day + addDays;

  // Normalize day across months/years
  while (true) {
    const dim = daysInMonth(year, month);
    if (day > dim) {
      day -= dim;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      continue;
    }
    if (day < 1) {
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      day += daysInMonth(year, month);
      continue;
    }
    break;
  }

  return { year, month, day, hours, minutes, seconds: date.seconds };
}

function pad(n: number, width = 2): string {
  return n.toString().padStart(width, '0');
}

// Return floating local time strings for ICS and calendar URLs: YYYYMMDDTHHMMSS
export function getCalendarFloatingRange(input?: string | null, durationMinutes = 120): { start: string; end: string } | null {
  const parsed = parseDateTimeLocal(input);
  if (!parsed) return null;

  const start = `${pad(parsed.year, 4)}${pad(parsed.month)}${pad(parsed.day)}T${pad(parsed.hours)}${pad(parsed.minutes)}${pad(parsed.seconds)}`;
  const endDt = addMinutesFloating(parsed, durationMinutes);
  const end = `${pad(endDt.year, 4)}${pad(endDt.month)}${pad(endDt.day)}T${pad(endDt.hours)}${pad(endDt.minutes)}${pad(endDt.seconds)}`;
  return { start, end };
}


