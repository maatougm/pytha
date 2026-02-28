import { ApiProperty } from '@nestjs/swagger';

export class StudentProgressDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  gradeLevel?: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty()
  gpa: number;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  totalAssignments: number;

  @ApiProperty()
  completedAssignments: number;

  @ApiProperty()
  courses: Array<{
    id: string;
    name: string;
    code: string;
    grade: number;
    letterGrade: string;
    progress: number;
  }>;

  @ApiProperty()
  recentGrades: Array<{
    id: string;
    assignmentName: string;
    courseName: string;
    score: number;
    maxScore: number;
    earnedAt: Date;
  }>;

  @ApiProperty()
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
}

export class TeacherContactDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty()
  courses: Array<{
    id: string;
    name: string;
    code: string;
  }>;

  @ApiProperty({ required: false })
  channelId?: string; // Direct message channel ID if exists
}

export class DashboardStatsDto {
  @ApiProperty()
  totalChildren: number;

  @ApiProperty()
  totalOutstandingFees: number;

  @ApiProperty()
  upcomingConferences: number;

  @ApiProperty()
  unreadMessages: number;

  @ApiProperty()
  pendingAssignments: number;

  @ApiProperty()
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    studentName: string;
    timestamp: Date;
  }>;
}
