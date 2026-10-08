// HIET Digital Campus - Robust Date & Time Formatting Utilities
// Timezone: Asia/Kolkata (Indian Standard Time, IST UTC+05:30)

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a timestamp into user-friendly Indian 12-hour Date + Time:
 * Example: 2026-10-08T06:09:00.000Z -> "08 Oct 2026, 11:39 AM"
 */
export function formatIndiaDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return '—';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(date);
    let day = '';
    let month = '';
    let year = '';
    let hour = '';
    let minute = '';
    let dayPeriod = 'AM';

    for (const part of parts) {
      if (part.type === 'day') day = part.value;
      else if (part.type === 'month') month = part.value;
      else if (part.type === 'year') year = part.value;
      else if (part.type === 'hour') hour = part.value;
      else if (part.type === 'minute') minute = part.value;
      else if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
    }

    if (day && month && year && hour && minute) {
      return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
    }

    // Fallback if parts structure differs
    return formatter.format(date).replace(/\u202f/g, ' ');
  } catch (err) {
    console.warn('formatIndiaDateTime error:', err);
    return '—';
  }
}

/**
 * Format a date-only value into user-friendly Indian format:
 * Example: "2026-10-08" -> "08 Oct 2026"
 */
export function formatIndiaDate(value: string | Date | null | undefined): string {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return '—';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    let day = '';
    let month = '';
    let year = '';

    for (const part of parts) {
      if (part.type === 'day') day = part.value;
      else if (part.type === 'month') month = part.value;
      else if (part.type === 'year') year = part.value;
    }

    if (day && month && year) {
      return `${day} ${month} ${year}`;
    }

    return formatter.format(date);
  } catch (err) {
    console.warn('formatIndiaDate error:', err);
    return '—';
  }
}

/**
 * Format time-only in 12-hour Indian format:
 * Example: "11:39 AM"
 */
export function formatIndiaTime(value: string | Date | null | undefined): string {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return '—';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(date);
    let hour = '';
    let minute = '';
    let dayPeriod = 'AM';

    for (const part of parts) {
      if (part.type === 'hour') hour = part.value;
      else if (part.type === 'minute') minute = part.value;
      else if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
    }

    if (hour && minute) {
      return `${hour}:${minute} ${dayPeriod}`;
    }

    return formatter.format(date).replace(/\u202f/g, ' ');
  } catch (err) {
    console.warn('formatIndiaTime error:', err);
    return '—';
  }
}

// Backward-compatible alias exports
export const formatDateTime = formatIndiaDateTime;
export const formatDate = formatIndiaDate;
