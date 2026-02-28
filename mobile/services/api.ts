// API Service for School Hub Mobile App
// Mock implementations - replace with actual API calls

const API_BASE_URL = 'https://api.schoolhub.com'; // Replace with actual API URL

// Mock delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  avatar?: string;
  department?: string;
  bio?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  department: string;
  teacher: {
    id: string;
    name: string;
    avatar?: string;
  };
  thumbnail?: string;
  enrollmentStatus: 'enrolled' | 'in_progress' | 'available';
  progress?: number;
  totalStudents: number;
  schedule?: string;
  room?: string;
}

export interface Channel {
  id: string;
  name?: string;
  type: 'classroom' | 'direct_message' | 'teacher_parent' | 'teacher_student' | 'admin_broadcast' | 'group';
  avatar?: string;
  lastMessage?: {
    id?: string;
    text: string;
    timestamp?: string;
    senderName?: string;
  };
  unreadCount?: number;
  isOnline?: boolean;
  members?: number;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  points?: number;
  earnedPoints?: number;
  priority: 'normal' | 'high' | 'urgent';
  submissionCount?: number;
  studentName?: string;
}

export interface ScheduleItem {
  id: string;
  subject: string;
  title?: string;  // Alias for subject
  teacher: string;
  time: string;
  room: string;
  location?: string;  // Alias for room
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'assignment' | 'grade' | 'message' | 'announcement';
  title: string;
  timestamp: string;
  course?: string;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  class: string;
  avatar?: string;
  attendance: number;
  upcomingAssignments: number;
}

// Mention Types
export interface Mention {
  id: string;
  messageId: string;
  channelId: string;
  channelName: string;
  mentionedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  isRead: boolean;
}

// Schedule Types
export interface ClassSchedule {
  id: string;
  classId: string;
  className: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  room: string;
  teacherName: string;
  subject: string;
}

export interface UserSchedule {
  id: string;
  title: string;
  subject: string;
  time: string;
  location: string;
  color: string;
  dayOfWeek: number;
}

// Dashboard API
export const dashboardApi = {
  getStats: async (userId: string, role: string) => {
    await delay(800);
    
    // Role-specific stats
    const statsByRole = {
      student: {
        upcomingClasses: 3,
        pendingAssignments: 4,
        unreadMessages: 7,
      },
      teacher: {
        todaysClasses: 4,
        pendingGrading: 12,
        parentMessages: 3,
      },
      parent: {
        upcomingEvents: 3,
        unreadUpdates: 5,
        attendanceAlerts: 1,
      },
      admin: {
        totalUsers: 1247,
        activeClasses: 48,
        pendingApprovals: 12,
      },
    };
    
    return statsByRole[role as keyof typeof statsByRole] || statsByRole.student;
  },
  
  getTodaysSchedule: async (userId: string, role: string): Promise<ScheduleItem[]> => {
    await delay(600);
    return [
      { id: '1', subject: 'Mathematics', teacher: 'Mr. Johnson', time: '9:00 AM', room: 'Room 302', color: '#3b82f6' },
      { id: '2', subject: 'Physics Lab', teacher: 'Dr. Chen', time: '11:00 AM', room: 'Lab 101', color: '#10b981' },
      { id: '3', subject: 'English Literature', teacher: 'Ms. Davis', time: '2:00 PM', room: 'Room 205', color: '#8b5cf6' },
    ];
  },
  
  getRecentActivity: async (userId: string): Promise<ActivityItem[]> => {
    await delay(500);
    return [
      { id: '1', type: 'assignment', title: 'New assignment posted in Mathematics', timestamp: '10 min ago', course: 'Mathematics' },
      { id: '2', type: 'grade', title: 'Grade posted: Physics Quiz', timestamp: '2 hours ago', course: 'Physics' },
      { id: '3', type: 'message', title: 'Message from Ms. Davis', timestamp: '5 hours ago' },
    ];
  },
};

// Courses API
export const coursesApi = {
  getCourses: async (userId: string, filter?: string): Promise<Course[]> => {
    await delay(1000);
    return [
      {
        id: '1',
        title: 'Advanced Physics',
        description: 'Advanced physics concepts and experiments',
        department: 'Science',
        teacher: { id: 't1', name: 'Dr. Sarah Chen', avatar: '' },
        enrollmentStatus: 'enrolled',
        progress: 65,
        totalStudents: 28,
        schedule: 'Mon, Wed, Fri • 10:00 AM',
        room: 'Room 302',
      },
      {
        id: '2',
        title: 'World History',
        description: 'World history from ancient to modern times',
        department: 'History',
        teacher: { id: 't2', name: 'Mr. Martinez', avatar: '' },
        enrollmentStatus: 'enrolled',
        progress: 30,
        totalStudents: 32,
        schedule: 'Tue, Thu • 1:00 PM',
        room: 'Room 201',
      },
      {
        id: '3',
        title: 'Creative Writing',
        description: 'Creative writing and literature analysis',
        department: 'Languages',
        teacher: { id: 't3', name: 'Ms. Johnson', avatar: '' },
        enrollmentStatus: 'enrolled',
        progress: 0,
        totalStudents: 24,
        schedule: 'Mon, Wed • 2:00 PM',
        room: 'Room 105',
      },
      {
        id: '4',
        title: 'Computer Science',
        description: 'Introduction to computer programming',
        department: 'Science',
        teacher: { id: 't4', name: 'Prof. Williams', avatar: '' },
        enrollmentStatus: 'available',
        totalStudents: 30,
        schedule: 'Tue, Thu • 10:00 AM',
        room: 'Lab 202',
      },
      {
        id: '5',
        title: 'Biology 101',
        description: 'Introduction to biology and life sciences',
        department: 'Science',
        teacher: { id: 't5', name: 'Dr. Park', avatar: '' },
        enrollmentStatus: 'available',
        totalStudents: 35,
        schedule: 'Mon, Wed, Fri • 9:00 AM',
        room: 'Lab 301',
      },
      {
        id: '6',
        title: 'Spanish II',
        description: 'Intermediate Spanish language course',
        department: 'Languages',
        teacher: { id: 't6', name: 'Señora Garcia', avatar: '' },
        enrollmentStatus: 'available',
        totalStudents: 22,
        schedule: 'Tue, Thu • 11:00 AM',
        room: 'Room 108',
      },
    ];
  },
  
  searchCourses: async (query: string): Promise<Course[]> => {
    await delay(500);
    const allCourses = await coursesApi.getCourses('');
    return allCourses.filter(c => 
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.teacher.name.toLowerCase().includes(query.toLowerCase()) ||
      c.department.toLowerCase().includes(query.toLowerCase())
    );
  },
};

// Messages API
export const messagesApi = {
  getChannels: async (userId: string): Promise<Channel[]> => {
    await delay(800);
    return [
      {
        id: '1',
        name: 'Class 10A - Mathematics',
        type: 'classroom',
        lastMessage: {
          text: 'Don\'t forget to submit your homework by Friday',
          timestamp: '2 min ago',
          senderName: 'Mr. Johnson',
        },
        unreadCount: 3,
        members: 28,
        isOnline: true,
      },
      {
        id: '2',
        name: 'Physics Study Group',
        type: 'group',
        lastMessage: {
          text: 'Thanks for sharing the notes @everyone!',
          timestamp: '15 min ago',
          senderName: 'Alex',
        },
        unreadCount: 0,
        members: 12,
      },
      {
        id: '3',
        name: 'Dr. Sarah Chen',
        type: 'direct_message',
        lastMessage: {
          text: 'Can we schedule a meeting to discuss your project?',
          timestamp: '1 hour ago',
          senderName: 'Dr. Sarah Chen',
        },
        unreadCount: 1,
        isOnline: true,
      },
      {
        id: '4',
        name: 'School Announcements',
        type: 'admin_broadcast',
        lastMessage: {
          text: 'Important: School will be closed next Monday for maintenance',
          timestamp: '3 hours ago',
          senderName: 'Admin',
        },
        unreadCount: 0,
        members: 1200,
      },
      {
        id: '5',
        name: 'Parent-Teacher Conference',
        type: 'teacher_parent',
        lastMessage: {
          text: 'Looking forward to meeting you next week',
          timestamp: '5 hours ago',
          senderName: 'Ms. Davis',
        },
        unreadCount: 2,
      },
      {
        id: '6',
        name: 'English Literature Class',
        type: 'classroom',
        lastMessage: {
          text: 'Great discussion today everyone!',
          timestamp: 'Yesterday',
          senderName: 'Ms. Davis',
        },
        unreadCount: 0,
        members: 24,
      },
      {
        id: '7',
        name: 'Michael Johnson',
        type: 'direct_message',
        lastMessage: {
          text: 'Hey, can you help me with the math homework?',
          timestamp: 'Yesterday',
          senderName: 'Michael',
        },
        unreadCount: 0,
      },
    ];
  },
  
  searchChannels: async (query: string): Promise<Channel[]> => {
    await delay(400);
    const allChannels = await messagesApi.getChannels('');
    return allChannels.filter(c => 
      c.name?.toLowerCase().includes(query.toLowerCase())
    );
  },
};

// Assignments API
export const assignmentsApi = {
  getAssignments: async (userId: string, filter?: string): Promise<Assignment[]> => {
    await delay(900);
    const assignments: Assignment[] = [
      {
        id: '1',
        title: 'Calculus Homework Chapter 5',
        courseId: '1',
        courseName: 'Mathematics 101',
        description: 'Complete problems 1-20 in Chapter 5',
        dueDate: '2026-02-27T23:59:00',
        status: 'pending',
        points: 100,
        priority: 'high',
      },
      {
        id: '2',
        title: 'Physics Lab Report',
        courseId: '2',
        courseName: 'Advanced Physics',
        description: 'Write a lab report on the pendulum experiment',
        dueDate: '2026-03-01T23:59:00',
        status: 'pending',
        points: 50,
        priority: 'normal',
      },
      {
        id: '3',
        title: 'English Essay Draft',
        courseId: '3',
        courseName: 'English Literature',
        description: 'First draft of your literary analysis essay',
        dueDate: '2026-02-25T23:59:00',
        status: 'submitted',
        points: 100,
        priority: 'normal',
      },
      {
        id: '4',
        title: 'History Research Paper',
        courseId: '4',
        courseName: 'World History',
        description: '5-page research paper on World War II',
        dueDate: '2026-02-20T23:59:00',
        status: 'graded',
        points: 150,
        earnedPoints: 135,
        priority: 'normal',
      },
      {
        id: '5',
        title: 'Chemistry Problem Set',
        courseId: '5',
        courseName: 'Chemistry',
        description: 'Problems from Chapter 8',
        dueDate: '2026-02-24T23:59:00',
        status: 'late',
        points: 75,
        priority: 'urgent',
      },
      {
        id: '6',
        title: 'Spanish Oral Presentation',
        courseId: '6',
        courseName: 'Spanish II',
        description: '5-minute presentation in Spanish',
        dueDate: '2026-03-05T10:00:00',
        status: 'pending',
        points: 100,
        priority: 'normal',
      },
    ];
    
    if (filter && filter !== 'all') {
      return assignments.filter(a => a.status === filter);
    }
    return assignments;
  },
};

// Profile API
export const profileApi = {
  getChildren: async (parentId: string): Promise<Child[]> => {
    await delay(600);
    return [
      {
        id: 'c1',
        name: 'Michael Johnson',
        grade: 'Grade 10',
        class: '10A',
        attendance: 98,
        upcomingAssignments: 2,
      },
      {
        id: 'c2',
        name: 'Emma Johnson',
        grade: 'Grade 7',
        class: '7B',
        attendance: 95,
        upcomingAssignments: 1,
      },
    ];
  },
  
  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay(800);
    return {
      id: userId,
      email: 'test@school.com',
      name: data.name || 'Test User',
      role: 'student',
      ...data,
    } as User;
  },
  
  updateSettings: async (userId: string, settings: { notifications?: boolean; darkMode?: boolean; language?: string }) => {
    await delay(500);
    return { success: true, settings };
  },
};
