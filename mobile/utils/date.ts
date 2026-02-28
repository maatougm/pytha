// Simple date utility functions

export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function format(date: Date, formatStr: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const dayOfWeek = date.getDay();
  
  // Convert to 12-hour format
  const isPM = hours >= 12;
  const hours12 = hours % 12 || 12;
  const ampm = isPM ? 'PM' : 'AM';
  
  return formatStr
    .replace('yyyy', year.toString())
    .replace('MMMM', months[month])
    .replace('MMM', shortMonths[month])
    .replace('MM', (month + 1).toString().padStart(2, '0'))
    .replace('dd', day.toString().padStart(2, '0'))
    .replace('d', day.toString())
    .replace('EEEE', days[dayOfWeek])
    .replace('EEE', shortDays[dayOfWeek])
    .replace('HH', hours.toString().padStart(2, '0'))
    .replace('H', hours.toString())
    .replace('hh', hours12.toString().padStart(2, '0'))
    .replace('h', hours12.toString())
    .replace('mm', minutes.toString().padStart(2, '0'))
    .replace('a', ampm)
    .replace('yyyy', year.toString());
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return format(date, 'MMM d');
  }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
