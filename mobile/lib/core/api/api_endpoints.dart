/// All API endpoint constants — matches the NestJS backend exactly.
class ApiEndpoints {
  ApiEndpoints._();

  // ─── Auth ────────────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';

  // ─── Users ───────────────────────────────────────────────────────────────
  static const String users = '/users';
  static String userById(String id) => '/users/$id';
  static String userChildren(String id) => '/users/$id/children';
  static const String myNotificationPrefs = '/users/me/notifications';

  // ─── Channels ────────────────────────────────────────────────────────────
  static const String channels = '/messaging/channels';
  static const String myChannels = '/messaging/channels/my';
  static String channelById(String id) => '/messaging/channels/$id';
  static String channelMembers(String id) => '/messaging/channels/$id/members';
  static String channelMessages(String id) => '/messaging/channels/$id/messages';
  static String channelRead(String id) => '/messaging/channels/$id/read';
  static String channelSearch(String id) => '/messaging/channels/$id/search';
  static String channelReport(String id) => '/messaging/channels/$id/report';

  // ─── Messages ────────────────────────────────────────────────────────────
  static String messageById(String id) => '/messaging/messages/$id';
  static String messageReactions(String id) => '/messaging/messages/$id/reactions';
  static String removeReaction(String id, String reaction) =>
      '/messaging/messages/$id/reactions/$reaction';

  // ─── Courses ─────────────────────────────────────────────────────────────
  static const String courses = '/courses';
  static String courseById(String id) => '/courses/$id';

  // ─── Classes ─────────────────────────────────────────────────────────────
  static const String classes = '/classes';
  static const String myClasses = '/classes/my';
  static String classById(String id) => '/classes/$id';
  static String classRoster(String id) => '/classes/$id/roster';
  static String classSchedules(String id) => '/classes/$id/schedules';
  static String classAssignments(String id) => '/classes/$id/assignments';
  static String classAttendance(String id) => '/classes/$id/attendance';
  static String classGradebook(String id) => '/classes/$id/gradebook';

  // ─── Assignments ─────────────────────────────────────────────────────────
  static String assignmentById(String id) => '/assignments/$id';
  static String submitAssignment(String id) => '/assignments/$id/submit';
  static String mySubmission(String id) => '/assignments/$id/submissions/my';
  static String submissions(String id) => '/assignments/$id/submissions';
  static String gradeSubmission(String id) => '/submissions/$id/grade';

  // ─── Grades ──────────────────────────────────────────────────────────────
  static const String myGrades = '/grades/my';
  static String studentGrades(String id) => '/students/$id/grades';

  // ─── Attendance ──────────────────────────────────────────────────────────
  static const String myAttendance = '/attendance/my';
  static String studentAttendance(String id) => '/students/$id/attendance';

  // ─── Files ───────────────────────────────────────────────────────────────
  static const String files = '/files';
  static const String myFiles = '/files/my';
  static const String fileQuota = '/files/quota';
  static String fileById(String id) => '/files/$id';
  static String fileDownload(String id) => '/files/$id/download';
  static String filePreview(String id) => '/files/$id/preview';

  // ─── Admin ───────────────────────────────────────────────────────────────
  static const String adminMetrics = '/admin/metrics';
  static const String adminTimeline = '/admin/timeline';
  static const String adminUsers = '/admin/users';
  static String adminUserById(String id) => '/admin/users/$id';
  static const String adminClasses = '/admin/classes';
  static const String adminClassComposition = '/admin/classes/composition';
  static const String adminUnassignedStudents = '/admin/students/unassigned';
  static String adminEnrollStudent(String classId) => '/admin/classes/$classId/enroll';
  static String adminUnenrollStudent(String classId, String studentId) =>
      '/admin/classes/$classId/unenroll/$studentId';
  static String adminEnrollment(String enrollmentId) => '/admin/enrollments/$enrollmentId';
  static const String academicYears = '/admin/academic-years';
  static String setCurrentYear(String id) => '/admin/academic-years/$id/set-current';
  static const String promotionPreview = '/admin/promotion/preview';
  static const String promotionExecute = '/admin/promotion/execute';
  static const String adminPromoteStudents = '/admin/promote-students';
  static const String adminTeacherAllocations = '/admin/teacher-class-allocations';
  static String adminTeacherAllocationById(String id) => '/admin/teacher-class-allocations/$id';
  static const String teachersWithClasses = '/admin/teachers-with-classes';
  static const String adminAuditLogs = '/admin/audit-logs';

  // ─── Moderation ──────────────────────────────────────────────────────────
  static const String moderationReports = '/moderation/reports';
  static const String moderationReportStats = '/moderation/reports/stats';
  static String moderationReportById(String id) => '/moderation/reports/$id';
  static String updateReport(String id) => '/moderation/reports/$id';
  static const String auditLogs = '/admin/audit-logs';
}
