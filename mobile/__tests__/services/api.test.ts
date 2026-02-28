import {
  dashboardApi,
  coursesApi,
  messagesApi,
  assignmentsApi,
  profileApi,
  User,
  Course,
  Channel,
  Assignment,
  ScheduleItem,
  ActivityItem,
  Child,
} from '../../services/api';

describe('API Service', () => {
  describe('dashboardApi', () => {
    it('getStats returns stats for student role', async () => {
      const stats = await dashboardApi.getStats('1', 'student');
      
      expect(stats).toHaveProperty('upcomingClasses');
      expect(stats).toHaveProperty('pendingAssignments');
      expect(stats).toHaveProperty('unreadMessages');
    });

    it('getStats returns stats for teacher role', async () => {
      const stats = await dashboardApi.getStats('2', 'teacher');
      
      expect(stats).toHaveProperty('todaysClasses');
      expect(stats).toHaveProperty('pendingGrading');
      expect(stats).toHaveProperty('parentMessages');
    });

    it('getStats returns stats for parent role', async () => {
      const stats = await dashboardApi.getStats('3', 'parent');
      
      expect(stats).toHaveProperty('upcomingEvents');
      expect(stats).toHaveProperty('unreadUpdates');
      expect(stats).toHaveProperty('attendanceAlerts');
    });

    it('getStats returns stats for admin role', async () => {
      const stats = await dashboardApi.getStats('4', 'admin');
      
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeClasses');
      expect(stats).toHaveProperty('pendingApprovals');
    });

    it('getStats defaults to student for unknown role', async () => {
      const stats = await dashboardApi.getStats('5', 'unknown');
      
      expect(stats).toHaveProperty('upcomingClasses');
      expect(stats).toHaveProperty('pendingAssignments');
      expect(stats).toHaveProperty('unreadMessages');
    });

    it('getTodaysSchedule returns array of schedule items', async () => {
      const schedule = await dashboardApi.getTodaysSchedule('1', 'student');
      
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBeGreaterThan(0);
      
      // Check structure of first item
      const firstItem = schedule[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('subject');
      expect(firstItem).toHaveProperty('teacher');
      expect(firstItem).toHaveProperty('time');
      expect(firstItem).toHaveProperty('room');
      expect(firstItem).toHaveProperty('color');
    });

    it('getRecentActivity returns array of activity items', async () => {
      const activities = await dashboardApi.getRecentActivity('1');
      
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      
      // Check structure of first item
      const firstItem = activities[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('type');
      expect(firstItem).toHaveProperty('title');
      expect(firstItem).toHaveProperty('timestamp');
    });
  });

  describe('coursesApi', () => {
    it('getCourses returns array of courses', async () => {
      const courses = await coursesApi.getCourses('1');
      
      expect(Array.isArray(courses)).toBe(true);
      expect(courses.length).toBeGreaterThan(0);
      
      // Check structure of first course
      const firstCourse = courses[0];
      expect(firstCourse).toHaveProperty('id');
      expect(firstCourse).toHaveProperty('title');
      expect(firstCourse).toHaveProperty('description');
      expect(firstCourse).toHaveProperty('department');
      expect(firstCourse).toHaveProperty('teacher');
      expect(firstCourse).toHaveProperty('enrollmentStatus');
      expect(firstCourse).toHaveProperty('totalStudents');
    });

    it('searchCourses filters courses by query', async () => {
      const allCourses = await coursesApi.getCourses('1');
      const searchResults = await coursesApi.searchCourses('Physics');
      
      expect(searchResults.length).toBeLessThanOrEqual(allCourses.length);
      
      // All results should contain "Physics" in title, teacher name, or department
      searchResults.forEach(course => {
        const match = 
          course.title.toLowerCase().includes('physics') ||
          course.teacher.name.toLowerCase().includes('physics') ||
          course.department.toLowerCase().includes('physics');
        expect(match).toBe(true);
      });
    });

    it('searchCourses returns empty array for non-matching query', async () => {
      const searchResults = await coursesApi.searchCourses('xyz123nonexistent');
      expect(searchResults).toEqual([]);
    });
  });

  describe('messagesApi', () => {
    it('getChannels returns array of channels', async () => {
      const channels = await messagesApi.getChannels('1');
      
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
      
      // Check structure of first channel
      const firstChannel = channels[0];
      expect(firstChannel).toHaveProperty('id');
      expect(firstChannel).toHaveProperty('type');
      expect(firstChannel).toHaveProperty('lastMessage');
      expect(firstChannel).toHaveProperty('unreadCount');
    });

    it('channels have valid types', async () => {
      const channels = await messagesApi.getChannels('1');
      const validTypes = ['classroom', 'direct_message', 'teacher_parent', 'teacher_student', 'admin_broadcast', 'group'];
      
      channels.forEach(channel => {
        expect(validTypes).toContain(channel.type);
      });
    });

    it('searchChannels filters channels by query', async () => {
      const allChannels = await messagesApi.getChannels('1');
      const searchResults = await messagesApi.searchChannels('Mathematics');
      
      expect(searchResults.length).toBeLessThanOrEqual(allChannels.length);
      
      searchResults.forEach(channel => {
        expect(channel.name?.toLowerCase()).toContain('mathematics');
      });
    });
  });

  describe('assignmentsApi', () => {
    it('getAssignments returns array of assignments', async () => {
      const assignments = await assignmentsApi.getAssignments('1');
      
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThan(0);
      
      // Check structure of first assignment
      const firstAssignment = assignments[0];
      expect(firstAssignment).toHaveProperty('id');
      expect(firstAssignment).toHaveProperty('title');
      expect(firstAssignment).toHaveProperty('courseId');
      expect(firstAssignment).toHaveProperty('courseName');
      expect(firstAssignment).toHaveProperty('dueDate');
      expect(firstAssignment).toHaveProperty('status');
      expect(firstAssignment).toHaveProperty('priority');
    });

    it('getAssignments filters by status', async () => {
      const allAssignments = await assignmentsApi.getAssignments('1');
      const pendingAssignments = await assignmentsApi.getAssignments('1', 'pending');
      
      expect(pendingAssignments.length).toBeLessThanOrEqual(allAssignments.length);
      
      pendingAssignments.forEach(assignment => {
        expect(assignment.status).toBe('pending');
      });
    });

    it('assignments have valid status values', async () => {
      const assignments = await assignmentsApi.getAssignments('1');
      const validStatuses = ['pending', 'submitted', 'graded', 'late'];
      
      assignments.forEach(assignment => {
        expect(validStatuses).toContain(assignment.status);
      });
    });

    it('assignments have valid priority values', async () => {
      const assignments = await assignmentsApi.getAssignments('1');
      const validPriorities = ['normal', 'high', 'urgent'];
      
      assignments.forEach(assignment => {
        expect(validPriorities).toContain(assignment.priority);
      });
    });
  });

  describe('profileApi', () => {
    it('getChildren returns array of children for parent', async () => {
      const children = await profileApi.getChildren('parent1');
      
      expect(Array.isArray(children)).toBe(true);
      expect(children.length).toBeGreaterThan(0);
      
      // Check structure of first child
      const firstChild = children[0];
      expect(firstChild).toHaveProperty('id');
      expect(firstChild).toHaveProperty('name');
      expect(firstChild).toHaveProperty('grade');
      expect(firstChild).toHaveProperty('class');
      expect(firstChild).toHaveProperty('attendance');
      expect(firstChild).toHaveProperty('upcomingAssignments');
    });

    it('updateProfile returns updated user', async () => {
      const updatedUser = await profileApi.updateProfile('1', { name: 'Updated Name' });
      
      expect(updatedUser).toHaveProperty('id', '1');
      expect(updatedUser).toHaveProperty('name', 'Updated Name');
      expect(updatedUser).toHaveProperty('email');
      expect(updatedUser).toHaveProperty('role');
    });

    it('updateSettings returns success', async () => {
      const result = await profileApi.updateSettings('1', {
        notifications: true,
        darkMode: false,
        language: 'en',
      });
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('settings');
    });
  });
});
