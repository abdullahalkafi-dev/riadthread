const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
});

export const formatDate = (iso: string | Date) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string | Date) => dateTimeFmt.format(new Date(iso));

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then a plain date. */
export function timeAgo(iso: string | Date, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  return formatDate(iso);
}

/** yyyy-mm-dd, the value a date input expects, from an ISO timestamp. */
export const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/** How a follow-up date relates to today, for colouring and wording. */
export function followUpState(iso: string | null | undefined, now = new Date()): 'none' | 'overdue' | 'today' | 'upcoming' {
  if (!iso) return 'none';
  const day = iso.slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  if (day < today) return 'overdue';
  return day === today ? 'today' : 'upcoming';
}
