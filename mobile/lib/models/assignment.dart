class Assignment {
  final String id;
  final String classId;
  final String title;
  final String? description;
  final String type;
  final double? maxScore;
  final DateTime? dueDate;
  final bool isPublished;
  final DateTime createdAt;
  final Submission? mySubmission;

  const Assignment({
    required this.id,
    required this.classId,
    required this.title,
    this.description,
    required this.type,
    this.maxScore,
    this.dueDate,
    required this.isPublished,
    required this.createdAt,
    this.mySubmission,
  });

  bool get isOverdue =>
      dueDate != null && DateTime.now().isAfter(dueDate!) && mySubmission == null;

  String get statusLabel {
    if (mySubmission != null) {
      if (mySubmission!.score != null) return 'Graded';
      return 'Submitted';
    }
    if (isOverdue) return 'Overdue';
    return 'Pending';
  }

  factory Assignment.fromJson(Map<String, dynamic> json) => Assignment(
        id: json['id'] as String,
        classId: json['classId'] as String? ?? '',
        title: json['title'] as String,
        description: json['description'] as String?,
        type: json['type'] as String? ?? 'homework',
        maxScore: (json['maxScore'] as num?)?.toDouble(),
        dueDate: json['dueDate'] != null
            ? DateTime.parse(json['dueDate'] as String)
            : null,
        isPublished: json['isPublished'] as bool? ?? true,
        createdAt: DateTime.parse(json['createdAt'] as String),
        mySubmission: json['mySubmission'] != null
            ? Submission.fromJson(json['mySubmission'] as Map<String, dynamic>)
            : null,
      );
}

class Submission {
  final String id;
  final String assignmentId;
  final String studentId;
  final String? content;
  final String? fileId;
  final double? score;
  final String? feedback;
  final DateTime submittedAt;
  final DateTime? gradedAt;

  const Submission({
    required this.id,
    required this.assignmentId,
    required this.studentId,
    this.content,
    this.fileId,
    this.score,
    this.feedback,
    required this.submittedAt,
    this.gradedAt,
  });

  factory Submission.fromJson(Map<String, dynamic> json) => Submission(
        id: json['id'] as String,
        assignmentId: json['assignmentId'] as String,
        studentId: json['studentId'] as String,
        content: json['content'] as String?,
        fileId: json['fileId'] as String?,
        score: (json['score'] as num?)?.toDouble(),
        feedback: json['feedback'] as String?,
        submittedAt: DateTime.parse(json['submittedAt'] as String),
        gradedAt: json['gradedAt'] != null
            ? DateTime.parse(json['gradedAt'] as String)
            : null,
      );
}

class Grade {
  final String assignmentId;
  final String assignmentTitle;
  final String classId;
  final String courseName;
  final double score;
  final double maxScore;
  final String? feedback;
  final DateTime gradedAt;

  const Grade({
    required this.assignmentId,
    required this.assignmentTitle,
    required this.classId,
    required this.courseName,
    required this.score,
    required this.maxScore,
    this.feedback,
    required this.gradedAt,
  });

  double get percentage => maxScore > 0 ? (score / maxScore) * 100 : 0;

  String get letterGrade {
    final p = percentage;
    if (p >= 90) return 'A';
    if (p >= 80) return 'B';
    if (p >= 70) return 'C';
    if (p >= 60) return 'D';
    return 'F';
  }

  factory Grade.fromJson(Map<String, dynamic> json) => Grade(
        assignmentId: json['assignmentId'] as String,
        assignmentTitle: json['assignment']?['title'] as String? ?? '',
        classId: json['classId'] as String? ?? '',
        courseName: json['course']?['name'] as String? ?? '',
        score: (json['score'] as num).toDouble(),
        maxScore: (json['maxScore'] as num? ?? 100).toDouble(),
        feedback: json['feedback'] as String?,
        gradedAt: DateTime.parse(json['gradedAt'] as String),
      );
}
