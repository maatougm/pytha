class FileModel {
  final String id;
  final String originalName;
  final String mimeType;
  final String category;
  final int size;
  final String? uploaderId;
  final String? uploaderName;
  final DateTime createdAt;

  const FileModel({
    required this.id,
    required this.originalName,
    required this.mimeType,
    required this.category,
    required this.size,
    this.uploaderId,
    this.uploaderName,
    required this.createdAt,
  });

  bool get isImage => mimeType.startsWith('image/');
  bool get isPdf => mimeType == 'application/pdf';
  bool get isVideo => mimeType.startsWith('video/');

  String get sizeLabel {
    if (size < 1024) return '${size}B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)}KB';
    return '${(size / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  String get icon {
    if (isImage) return '🖼️';
    if (isPdf) return '📄';
    if (isVideo) return '🎬';
    if (mimeType.contains('word')) return '📝';
    if (mimeType.contains('spreadsheet') || mimeType.contains('excel')) return '📊';
    return '📁';
  }

  factory FileModel.fromJson(Map<String, dynamic> json) => FileModel(
        id: json['id'] as String,
        originalName: json['originalName'] as String? ?? json['filename'] as String? ?? 'file',
        mimeType: json['mimeType'] as String? ?? 'application/octet-stream',
        category: json['category'] as String? ?? 'document',
        size: json['size'] as int? ?? 0,
        uploaderId: json['uploaderId'] as String?,
        uploaderName: json['uploader'] != null
            ? '${json['uploader']['firstName']} ${json['uploader']['lastName']}'.trim()
            : null,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class AttendanceRecord {
  final String id;
  final String sessionId;
  final String studentId;
  final String status; // present, absent, late, excused
  final String? note;
  final DateTime date;

  const AttendanceRecord({
    required this.id,
    required this.sessionId,
    required this.studentId,
    required this.status,
    this.note,
    required this.date,
  });

  bool get isPresent => status == 'present';
  bool get isAbsent => status == 'absent';
  bool get isLate => status == 'late';

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => AttendanceRecord(
        id: json['id'] as String,
        sessionId: json['sessionId'] as String? ?? '',
        studentId: json['studentId'] as String? ?? '',
        status: json['status'] as String? ?? 'absent',
        note: json['note'] as String?,
        date: json['session']?['date'] != null
            ? DateTime.parse(json['session']['date'] as String)
            : DateTime.now(),
      );
}
