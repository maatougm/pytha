import { PipeTransform, Injectable, ArgumentMetadata, Optional } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ValidatorOptions } from 'class-validator';
import DOMPurify = require('dompurify');
import { JSDOM } from 'jsdom';

// Create a DOMPurify instance with JSDOM for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configure DOMPurify to allow safe HTML tags
// Using 'as any' for TRANSFORM_TAGS which exists in library but not in types
const purifyConfig = {
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
    // Force all links to open in new tab and add security attributes
    FORBID_ATTR: ['style', 'onclick', 'onerror', 'onload', 'onmouseover'],
    // Add noopener noreferrer to all links for security
    TRANSFORM_TAGS: {
        'a': (tagName: string, attribs: { [key: string]: string }) => {
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

// Additional configuration for plain text (no HTML allowed)
const plainTextConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
};

/**
 * Sanitizes a string value using DOMPurify
 * @param value - The string to sanitize
 * @param allowFormatting - Whether to allow safe HTML formatting (bold, italic, links)
 * @returns The sanitized string
 */
export function sanitizeString(value: string, allowFormatting: boolean = true): string {
    if (typeof value !== 'string') {
        return value;
    }

    const config = allowFormatting ? purifyConfig : plainTextConfig;
    return purify.sanitize(value, config);
}

/**
 * Recursively sanitizes all string properties in an object
 * @param obj - The object to sanitize
 * @param allowFormatting - Whether to allow safe HTML formatting
 * @returns The sanitized object
 */
export function sanitizeObject<T>(obj: T, allowFormatting: boolean = true): T {
    if (typeof obj === 'string') {
        return sanitizeString(obj, allowFormatting) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, allowFormatting)) as unknown as T;
    }

    if (obj !== null && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value, allowFormatting);
        }
        return sanitized as T;
    }

    return obj;
}

/**
 * Options for SanitizePipe
 */
export interface SanitizePipeOptions extends ValidatorOptions {
    transformOptions?: {
        enableImplicitConversion?: boolean;
    };
}

/**
 * Custom validation pipe that sanitizes all incoming data to prevent XSS attacks
 * Extends the built-in ValidationPipe to add sanitization while preserving validation
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
    private validationPipe: ValidationPipe;

    constructor(@Optional() options?: SanitizePipeOptions) {
        const opts = options ?? {};
        this.validationPipe = new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            ...opts,
        });
    }

    async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
        // First sanitize the input to prevent XSS
        const sanitizedValue = sanitizeObject(value, true);

        // Then run the standard validation
        return this.validationPipe.transform(sanitizedValue, metadata);
    }
}

/**
 * A simpler pipe for just sanitizing without validation
 * Can be used at the property level or controller level
 */
@Injectable()
export class SanitizeOnlyPipe implements PipeTransform {
    constructor(private allowFormatting: boolean = true) {}

    transform(value: unknown, metadata: ArgumentMetadata): unknown {
        return sanitizeObject(value, this.allowFormatting);
    }
}
