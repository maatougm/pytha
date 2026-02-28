// Test setup file for School Hub Mobile App

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC: 2,
  },
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
    MIN: 1,
    NONE: 0,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone 14',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: 'SafeAreaProvider',
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const mockIcon = () => 'Icon';
  return {
    Mail: mockIcon,
    Lock: mockIcon,
    Eye: mockIcon,
    EyeOff: mockIcon,
    ChevronDown: mockIcon,
    ChevronRight: mockIcon,
    Shield: mockIcon,
    BookOpen: mockIcon,
    Users: mockIcon,
    GraduationCap: mockIcon,
    Check: mockIcon,
    Fingerprint: mockIcon,
    Bell: mockIcon,
    Clock: mockIcon,
    FileText: mockIcon,
    MessageSquare: mockIcon,
    Plus: mockIcon,
    CheckCircle: mockIcon,
    AlertCircle: mockIcon,
    Calendar: mockIcon,
    TrendingUp: mockIcon,
    TrendingDown: mockIcon,
    UserPlus: mockIcon,
    Megaphone: mockIcon,
    Baby: mockIcon,
  };
});

// Global test utilities
global.fetch = jest.fn();

// Silence console warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Filter out React Native specific warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Animated:'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    // Filter out specific warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Non-serializable'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
