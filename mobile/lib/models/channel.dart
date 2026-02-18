class Channel {
  final String id;
  final String name;
  final String type;
  final String? description;
  final String? avatarUrl;
  final int? unreadCount;
  final Message? lastMessage;
  final List<ChannelMember> members;
  final bool isArchived;
  final DateTime createdAt;

  const Channel({
    required this.id,
    required this.name,
    required this.type,
    this.description,
    this.avatarUrl,
    this.unreadCount,
    this.lastMessage,
    this.members = const [],
    this.isArchived = false,
    required this.createdAt,
  });

  factory Channel.fromJson(Map<String, dynamic> json) => Channel(
        id: json['id'] as String,
        name: json['name'] as String,
        type: json['type'] as String? ?? 'public',
        description: json['description'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        unreadCount: json['unreadCount'] as int?,
        lastMessage: json['lastMessage'] != null
            ? Message.fromJson(json['lastMessage'] as Map<String, dynamic>)
            : null,
        members: (json['members'] as List<dynamic>? ?? [])
            .map((m) => ChannelMember.fromJson(m as Map<String, dynamic>))
            .toList(),
        isArchived: json['isArchived'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class ChannelMember {
  final String userId;
  final String? firstName;
  final String? lastName;
  final String? avatarUrl;
  final String role;

  const ChannelMember({
    required this.userId,
    this.firstName,
    this.lastName,
    this.avatarUrl,
    required this.role,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory ChannelMember.fromJson(Map<String, dynamic> json) => ChannelMember(
        userId: json['userId'] as String? ?? json['id'] as String,
        firstName: json['firstName'] as String?,
        lastName: json['lastName'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        role: json['role'] as String? ?? 'member',
      );
}

class Message {
  final String id;
  final String channelId;
  final String senderId;
  final String? senderName;
  final String? senderAvatar;
  final String content;
  final bool isEdited;
  final bool isDeleted;
  final String? fileId;
  final Map<String, List<String>> reactions;
  final List<ReadReceipt> readBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Message({
    required this.id,
    required this.channelId,
    required this.senderId,
    this.senderName,
    this.senderAvatar,
    required this.content,
    this.isEdited = false,
    this.isDeleted = false,
    this.fileId,
    this.reactions = const {},
    this.readBy = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    final reactionsRaw = json['reactions'] as Map<String, dynamic>? ?? {};
    final reactions = reactionsRaw.map(
      (k, v) => MapEntry(k, (v as List<dynamic>).cast<String>()),
    );

    return Message(
      id: json['id'] as String,
      channelId: json['channelId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? json['sender']?['id'] as String? ?? '',
      senderName: json['sender'] != null
          ? '${json['sender']['firstName']} ${json['sender']['lastName']}'.trim()
          : null,
      senderAvatar: json['sender']?['avatarUrl'] as String?,
      content: json['content'] as String? ?? '',
      isEdited: json['isEdited'] as bool? ?? false,
      isDeleted: json['isDeleted'] as bool? ?? false,
      fileId: json['fileId'] as String?,
      reactions: reactions,
      readBy: (json['readBy'] as List<dynamic>? ?? [])
          .map((r) => ReadReceipt.fromJson(r as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

class ReadReceipt {
  final String userId;
  final DateTime readAt;

  const ReadReceipt({required this.userId, required this.readAt});

  factory ReadReceipt.fromJson(Map<String, dynamic> json) => ReadReceipt(
        userId: json['userId'] as String,
        readAt: DateTime.parse(json['readAt'] as String),
      );
}
