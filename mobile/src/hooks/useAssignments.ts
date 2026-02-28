import { useQuery } from '@tanstack/react-query';
import { gradingService } from '@/src/services/grading.service';
import type { Assignment } from '@/services/api';
import type { AssignmentFilters as BaseFilters } from '@/src/types/api';

interface AssignmentFilters extends BaseFilters {
  status?: 'pending' | 'submitted' | 'graded' | 'late';
  courseId?: string;
}

export function useAssignments(filters?: AssignmentFilters) {
  return useQuery({
    queryKey: ['assignments', filters],
    queryFn: () => gradingService.getAssignments(filters),
  });
}

export function useAssignment(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => gradingService.getAssignmentById(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useMySubmission(assignmentId: string) {
  return useQuery({
    queryKey: ['my-submission', assignmentId],
    queryFn: () => gradingService.getMySubmission(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useGrades(courseId?: string) {
  return useQuery({
    queryKey: ['grades', courseId],
    queryFn: () => gradingService.getMyGrades(courseId),
  });
}
