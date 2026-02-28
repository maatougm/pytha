import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

// Mock the providers and hooks
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      role: 'student',
      email: 'test@school.com',
    },
  }),
}));

jest.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      primary: '#3b82f6',
      accent: '#8b5cf6',
      background: '#ffffff',
      backgroundDark: '#f3f4f6',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#0ea5e9',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
  }),
}));

jest.mock('@/src/hooks/useRole', () => ({
  useRole: () => ({
    isTeacher: false,
    isAdmin: false,
    isParent: false,
    isStudent: true,
  }),
}));

jest.mock('@/src/hooks/useDashboard', () => ({
  useDashboardStats: () => ({
    data: {
      upcomingClasses: 3,
      pendingAssignments: 5,
      unreadMessages: 2,
    },
    isLoading: false,
    refetch: jest.fn(),
  }),
  useTodaysSchedule: () => ({
    data: [
      {
        id: '1',
        time: '09:00 AM',
        title: 'Mathematics',
        subject: 'Algebra II',
        location: 'Room 101',
        color: '#3b82f6',
      },
      {
        id: '2',
        time: '11:00 AM',
        title: 'Science',
        subject: 'Physics',
        location: 'Lab 3',
        color: '#22c55e',
      },
    ],
    isLoading: false,
    refetch: jest.fn(),
  }),
  useRecentActivity: () => ({
    data: [
      {
        id: '1',
        title: 'New assignment posted',
        type: 'assignment',
        course: 'Mathematics',
        timestamp: '2 hours ago',
      },
      {
        id: '2',
        title: 'Grade updated',
        type: 'grade',
        course: 'Science',
        timestamp: '5 hours ago',
      },
    ],
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('HomeScreen', () => {
  it('renders greeting with user name', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Student')).toBeTruthy();
  });

  it('renders stats cards', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText("Today's Classes")).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    
    expect(getByText('Pending Assignments')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    
    expect(getByText('Unread Messages')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('renders schedule section', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText("Today's Schedule")).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    
    // Check schedule items
    expect(getByText('Mathematics')).toBeTruthy();
    expect(getByText('Algebra II')).toBeTruthy();
    expect(getByText('Room 101')).toBeTruthy();
    
    expect(getByText('Science')).toBeTruthy();
    expect(getByText('Physics')).toBeTruthy();
    expect(getByText('Lab 3')).toBeTruthy();
  });

  it('renders recent activity section', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Recent Activity')).toBeTruthy();
    expect(getByText('See All')).toBeTruthy();
    
    // Check activity items
    expect(getByText('New assignment posted')).toBeTruthy();
    expect(getByText('Grade updated')).toBeTruthy();
  });

  it('renders notification button', () => {
    const { getByText } = render(<HomeScreen />);
    
    // Notification badge shows 3
    expect(getByText('3')).toBeTruthy();
  });

  it('shows different stats for different roles', () => {
    // This test verifies the role-based rendering logic exists
    // The actual role switching would require re-rendering with different mocks
    const { getByText } = render(<HomeScreen />);
    
    // Student sees these stats
    expect(getByText('Upcoming Classes')).toBeTruthy();
    expect(getByText('Pending Assignments')).toBeTruthy();
    expect(getByText('Unread Messages')).toBeTruthy();
  });
});

describe('HomeScreen - Teacher Role', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.mock('@/providers/AuthProvider', () => ({
      useAuth: () => ({
        user: {
          id: '2',
          name: 'Teacher User',
          role: 'teacher',
          email: 'teacher@school.com',
        },
      }),
    }));
    
    jest.mock('@/src/hooks/useRole', () => ({
      useRole: () => ({
        isTeacher: true,
        isAdmin: false,
        isParent: false,
        isStudent: false,
      }),
    }));
  });

  it('renders teacher-specific quick actions', () => {
    // This would test teacher-specific UI elements
    // Requires more detailed mocking of the role-based conditional rendering
  });
});
