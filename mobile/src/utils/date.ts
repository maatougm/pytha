import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';

export { format, parseISO, isValid, formatDistanceToNow };

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, formatStr);
}

export function formatTime(date: string | Date, formatStr: string = 'h:mm a'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid time';
  return format(d, formatStr);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return d < new Date();
}

export function daysRemaining(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 0;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
