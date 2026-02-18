class Course {
  final String id;
  final String name;
  final String code;
  final String? description;
  final String? department;
  final bool isActive;

  const Course({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    this.department,
    required this.isActive,
  });

  factory Course.fromJson(Map<String, dynamic> json) => Course(
        id: json['id'] as String,
        name: json['name'] as String,
        code: json['code'] as String,
        description: json['description'] as String?,
        department: json['department'] as String?,
        isActive: json['isActive'] as bool? ?? true,
      );
}

class SchoolClass {
  final String id;
  final String courseName;
  final String courseCode;
  final String? section;
  final String? term;
  final String? teacherName;
  final int? maxStudents;
  final int? enrolledCount;
  final List<ClassSchedule> schedules;

  const SchoolClass({
    required this.id,
    required this.courseName,
    required this.courseCode,
    this.section,
    this.term,
    this.teacherName,
    this.maxStudents,
    this.enrolledCount,
    this.schedules = const [],
  });

  factory SchoolClass.fromJson(Map<String, dynamic> json) => SchoolClass(
        id: json['id'] as String,
        courseName: json['course']?['name'] as String? ?? json['courseName'] as String? ?? '',
        courseCode: json['course']?['code'] as String? ?? json['courseCode'] as String? ?? '',
        section: json['section'] as String?,
        term: json['term'] as String?,
        teacherName: json['teacher'] != null
            ? '${json['teacher']['firstName']} ${json['teacher']['lastName']}'.trim()
            : null,
        maxStudents: json['maxStudents'] as int?,
        enrolledCount: json['enrolledCount'] as int?,
        schedules: (json['schedules'] as List<dynamic>? ?? [])
            .map((s) => ClassSchedule.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

class ClassSchedule {
  final String id;
  final String dayOfWeek;
  final String startTime;
  final String endTime;
  final String? room;

  const ClassSchedule({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.room,
  });

  factory ClassSchedule.fromJson(Map<String, dynamic> json) => ClassSchedule(
        id: json['id'] as String,
        dayOfWeek: json['dayOfWeek'] as String,
        startTime: json['startTime'] as String,
        endTime: json['endTime'] as String,
        room: json['room'] as String?,
      );
}
