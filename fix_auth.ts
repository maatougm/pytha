const fs = require('fs');

const authPath = 'mobile/providers/AuthProvider.tsx';
let authContent = fs.readFileSync(authPath, 'utf8');

// Replace dynamic imports properly
authContent = authContent.replace(
  /\/\/ Dynamic import removed to fix TS1323/,
  'import { unregisterPushToken } from \'@/src/services/notifications.service\';'
);
authContent = authContent.replace(
  /\/\/ await unregisterPushToken\(\);/,
  'await unregisterPushToken();'
);

// We need to move the import to top level
const importStr = "import { unregisterPushToken } from '@/src/services/notifications.service';\n";
authContent = authContent.replace(
  /import { unregisterPushToken } from '@\/src\/services\/notifications\.service';\n/g,
  ''
);

if (!authContent.includes('unregisterPushToken')) {
    authContent = importStr + authContent;
} else if (!authContent.includes('import { unregisterPushToken }')) {
    // Add to existing import
    authContent = authContent.replace(
      /import \{\n  initializePushNotifications,\n  removeNotificationListeners,/,
      'import {\n  initializePushNotifications,\n  removeNotificationListeners,\n  unregisterPushToken,'
    );
    authContent = authContent.replace(
      /\/\/ await unregisterPushToken\(\);/,
      'await unregisterPushToken();'
    );
}

// Fix mapBackendUser types
authContent = authContent.replace(
  /\(backendUser as any\)/g,
  'backendUser'
);

// We added role and name to API User, but roles may be a different type, we can assert backendUser as ApiUser & { roles?: any[] }
authContent = authContent.replace(
  /function mapBackendUser\(backendUser: ApiUser\): AppUser \{/,
  'function mapBackendUser(backendUser: ApiUser & { name?: string; role?: string; roles?: any[] }): AppUser {'
);

fs.writeFileSync(authPath, authContent);
console.log('Fixed AuthProvider.tsx types');
