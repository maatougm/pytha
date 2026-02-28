const fs = require('fs');

const apiTypePath = 'mobile/src/types/api.ts';
let apiTypeContent = fs.readFileSync(apiTypePath, 'utf8');

// Add role to User if it doesn't exist
if (!apiTypeContent.includes('role?: string;')) {
    apiTypeContent = apiTypeContent.replace(
        /export interface User \{/,
        'export interface User {\n  role?: string;\n  passwordVersion?: number;'
    );
} else if (!apiTypeContent.includes('passwordVersion?: number;')) {
    apiTypeContent = apiTypeContent.replace(
        /role\?: string;/,
        'role?: string;\n  passwordVersion?: number;'
    );
}

fs.writeFileSync(apiTypePath, apiTypeContent);
console.log('Fixed api.ts types');
