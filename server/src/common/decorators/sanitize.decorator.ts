import 'reflect-metadata';
import { Transform } from 'class-transformer';
import DOMPurify = require('dompurify');
import { JSDOM } from 'jsdom';

// Create a DOMPurify instance with JSDOM for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Default configuration allowing safe formatting
// Using 'as any' for TRANSFORM_TAGS which exists in library but not in types
const defaultConfig = {
    ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
        'code', 'pre', 'hr'
    ],
    ALLOWED_ATTR: [
        'href', 'title', 'target', 'class', 'id', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    SANITIZE_DOM: true,
    FORBID_ATTR: ['style', 'onclick', 'onerror', 'onload', 'onmouseover', 'onmouseenter', 'onmouseleave'],
    // Transform links to be safe
    TRANSFORM_TAGS: {
        'a': (tagName: string, attribs: { [key: string]: string }) => {
            // Validate href to prevent javascript: and data: URLs
            const href = attribs.href || '';
            const isValidHref = /^https?:\/\//i.test(href) || 
                               /^\/\//i.test(href) || 
                               /^\//i.test(href) ||
                               /^#/i.test(href) ||
                               /^mailto:/i.test(href);
            
            if (!isValidHref) {
                return {
                    tagName: 'span',
                    attribs: { class: 'invalid-link' },
                };
            }

            return {
                tagName: 'a',
                attribs: {
                    ...attribs,
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
            };
        },
    },
} as DOMPurify.Config;

// Configuration for plain text (no HTML allowed)
const plainTextConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
};

// Configuration that strips all HTML completely
const stripHtmlConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
};

/**
 * Sanitizes a string using DOMPurify
 * @param value - The string to sanitize
 * @param allowFormatting - Whether to allow safe HTML formatting
 * @returns The sanitized string
 */
function sanitizeValue(value: unknown, allowFormatting: boolean = true): unknown {
    if (typeof value !== 'string') {
        return value;
    }

    const config = allowFormatting ? defaultConfig : plainTextConfig;
    const sanitized = purify.sanitize(value, config);
    
    // Additional check for any remaining script-like content
    return sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Property decorator that sanitizes string values to prevent XSS attacks
 * Uses class-transformer's Transform decorator to sanitize during transformation
 * 
 * @param allowFormatting - If true, allows safe HTML (bold, italic, links);
 *                        If false, strips all HTML and returns plain text
 * 
 * @example
 * ```typescript
 * export class CreateMessageDto {
 *   @Sanitize()  // Allows safe HTML formatting
 *   content: string;
 * }
 * ```
 */
export function Sanitize(allowFormatting: boolean = true) {
    return Transform(({ value }: { value: unknown }) => {
        if (typeof value !== 'string') {
            return value;
        }

        const sanitized = sanitizeValue(value, allowFormatting);
        
        // If we're not allowing formatting, also decode HTML entities
        if (!allowFormatting && typeof sanitized === 'string') {
            // Decode common HTML entities
            return sanitized
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/&#x2F;/g, '/');
        }
        
        return sanitized;
    }, {
        toClassOnly: true,
    });
}

/**
 * Property decorator that strips ALL HTML from a string
 * Useful for fields that should never contain any HTML
 * 
 * @example
 * ```typescript
 * export class CreateUserDto {
 *   @SanitizePlainText()  // Strips all HTML
 *   firstName: string;
 * }
 * ```
 */
export function SanitizePlainText() {
    return Transform(({ value }: { value: unknown }) => {
        if (typeof value !== 'string') {
            return value;
        }

        // Strip all HTML
        const sanitized = purify.sanitize(value, stripHtmlConfig);
        
        // Decode HTML entities
        return sanitized
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/');
    }, {
        toClassOnly: true,
    });
}

/**
 * Property decorator that sanitizes HTML content while allowing rich formatting
 * Use this for fields that are expected to contain rich text (like message content)
 * 
 * @example
 * ```typescript
 * export class CreateMessageDto {
 *   @SanitizeHtml()  // Allows rich HTML formatting with security
 *   content: string;
 * }
 * ```
 */
export function SanitizeHtml() {
    return Transform(({ value }: { value: unknown }) => {
        if (typeof value !== 'string') {
            return value;
        }

        // Allow safe HTML formatting
        return sanitizeValue(value, true);
    }, {
        toClassOnly: true,
    });
}

/**
 * Metadata key for storing sanitization options
 */
export const SANITIZE_METADATA_KEY = Symbol('sanitize');

/**
 * Interface for sanitize options
 */
export interface SanitizeOptions {
    allowFormatting: boolean;
}

/**
 * Class-level decorator to mark DTOs for sanitization
 * This can be used in combination with the global SanitizePipe
 * 
 * @param options - Sanitization options
 * @returns Class decorator
 */
export function Sanitizable(options: SanitizeOptions = { allowFormatting: true }) {
    return function <T extends new (...args: unknown[]) => unknown>(target: T): T {
        Reflect.defineMetadata(SANITIZE_METADATA_KEY, options, target);
        return target;
    };
}

/**
 * Helper function to check if a class is marked as sanitizable
 * 
 * @param target - The class to check
 * @returns The sanitize options or undefined
 */
export function getSanitizeOptions(target: object): SanitizeOptions | undefined {
    return Reflect.getMetadata(SANITIZE_METADATA_KEY, target);
}
