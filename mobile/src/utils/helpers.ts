/**
 * Helper Utilities for School Hub Mobile
 * 
 * Common utility functions for formatting, text manipulation,
 * and data transformations used throughout the app.
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

// ============================================================
// DATE/TIME HELPERS
// ============================================================

/**
 * Format a date to display format
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM d, yyyy'
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  
  return format(dateObj, formatStr);
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  
  return format(dateObj, formatStr);
}

/**
 * Format time only
 */
export function formatTime(
  date: string | Date | null | undefined,
  use24Hour: boolean = false
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid time';
  
  return format(dateObj, use24Hour ? 'HH:mm' : 'h:mm a');
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  addSuffix: boolean = true
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  
  return formatDistanceToNow(dateObj, { addSuffix });
}

/**
 * Format a message timestamp (smart formatting)
 * - Today: "2:30 PM"
 * - Yesterday: "Yesterday"
 * - This week: "Monday"
 * - Older: "Jan 15"
 */
export function formatMessageTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  const now = new Date();
  const isToday = format(dateObj, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  const isYesterday = format(dateObj, 'yyyy-MM-dd') === 
    format(new Date(now.setDate(now.getDate() - 1)), 'yyyy-MM-dd');
  const isThisWeek = dateObj > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  if (isToday) {
    return format(dateObj, 'h:mm a');
  } else if (isYesterday) {
    return 'Yesterday';
  } else if (isThisWeek) {
    return format(dateObj, 'EEEE'); // Day name
  } else {
    return format(dateObj, 'MMM d');
  }
}

/**
 * Format date for grouping messages (section headers)
 */
export function formatMessageGroupDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  const now = new Date();
  const isToday = format(dateObj, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  const isYesterday = format(dateObj, 'yyyy-MM-dd') === 
    format(new Date(now.setDate(now.getDate() - 1)), 'yyyy-MM-dd');
  const isThisYear = dateObj.getFullYear() === now.getFullYear();
  
  if (isToday) {
    return 'Today';
  } else if (isYesterday) {
    return 'Yesterday';
  } else if (isThisYear) {
    return format(dateObj, 'EEEE, MMMM d');
  } else {
    return format(dateObj, 'MMMM d, yyyy');
  }
}

// ============================================================
// FILE HELPERS
// ============================================================

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}

/**
 * Get file icon based on mime type or extension
 */
export function getFileIconType(mimeType: string | undefined, filename: string): string {
  if (!mimeType && !filename) return 'file';
  
  const type = mimeType?.toLowerCase() || '';
  const ext = getFileExtension(filename).toLowerCase();
  
  if (type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    return 'image';
  } else if (type === 'application/pdf' || ext === '.pdf') {
    return 'pdf';
  } else if (type.includes('word') || ['.doc', '.docx'].includes(ext)) {
    return 'word';
  } else if (type.includes('excel') || type.includes('sheet') || ['.xls', '.xlsx'].includes(ext)) {
    return 'excel';
  } else if (type.includes('presentation') || ['.ppt', '.pptx'].includes(ext)) {
    return 'presentation';
  } else if (type.startsWith('video/') || ['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
    return 'video';
  } else if (type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
    return 'audio';
  } else if (type.includes('zip') || ['.zip', '.rar', '.7z'].includes(ext)) {
    return 'archive';
  } else if (type.includes('text') || ext === '.txt') {
    return 'text';
  }
  
  return 'file';
}

// ============================================================
// TEXT HELPERS
// ============================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate initials from a name
 * Returns up to 2 characters (first letter of first and last name)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert to title case
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight matching text in a string
 */
export function highlightText(
  text: string,
  query: string,
  highlightClass: string = 'highlight'
): string {
  if (!query || !text) return text;
  
  const escapedQuery = escapeRegex(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
}

// ============================================================
// ARRAY HELPERS
// ============================================================

/**
 * Group array items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Group array items by a getter function
 */
export function groupByFn<T>(array: T[], getKey: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = getKey(item);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Partition array into two arrays based on predicate
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  array.forEach((item) => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });
  
  return [truthy, falsy];
}

// ============================================================
// DEBOUNCE & THROTTLE
// ============================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Create a memoized function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result as ReturnType<T>;
  };
}

// ============================================================
// EQUALITY CHECKS
// ============================================================

/**
 * Deep equality check for objects
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Shallow equality check for objects
 */
export function shallowEqual<T extends Record<string, unknown>>(
  a: T | null | undefined,
  b: T | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every((key) => a[key] === b[key]);
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmptyString(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Check if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// ============================================================
// NUMBER HELPERS
// ============================================================

/**
 * Format number with commas
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercentage(num: number | null | undefined, decimals: number = 1): string {
  if (num === null || num === undefined) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Round to specified decimal places
 */
export function round(num: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// ============================================================
// PLATFORM HELPERS
// ============================================================

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  // This will be determined at runtime in React Native
  // Using Platform.OS from 'react-native'
  return false; // Placeholder - use Platform.OS in actual code
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return false; // Placeholder - use Platform.OS in actual code
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return false; // Placeholder
}

// ============================================================
// COLOR HELPERS
// ============================================================

/**
 * Convert hex to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten or darken a hex color
 */
export function adjustColor(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1);
}

// ============================================================
// UTILITY EXPORTS
// ============================================================

export default {
  // Date
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatMessageTime,
  formatMessageGroupDate,
  
  // File
  formatFileSize,
  getFileExtension,
  getFileNameWithoutExtension,
  getFileIconType,
  
  // Text
  truncateText,
  getInitials,
  capitalize,
  toTitleCase,
  stripHtml,
  escapeRegex,
  highlightText,
  
  // Array
  groupBy,
  groupByFn,
  unique,
  uniqueBy,
  sortBy,
  partition,
  
  // Function utilities
  debounce,
  throttle,
  memoize,
  
  // Equality
  deepEqual,
  shallowEqual,
  
  // Validation
  isValidEmail,
  isValidUrl,
  isEmptyString,
  isValidNumber,
  
  // Numbers
  formatNumber,
  formatPercentage,
  clamp,
  round,
  
  // Color
  hexToRgba,
  adjustColor,
};
