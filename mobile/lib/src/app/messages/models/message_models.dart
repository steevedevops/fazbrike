import 'package:fazbrike/src/shared/utils/json_utils.dart';

class MessageAttachmentModel {
  const MessageAttachmentModel({required this.url, required this.name, required this.mime, required this.size, required this.kind});
  final String url;
  final String name;
  final String mime;
  final int size;
  final String kind;
  factory MessageAttachmentModel.fromJson(Map<String, dynamic> json) => MessageAttachmentModel(
        url: json['url']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        mime: json['mime']?.toString() ?? '',
        size: asInt(json['size']),
        kind: json['kind']?.toString() ?? 'file',
      );
  static List<MessageAttachmentModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => MessageAttachmentModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {'url': url, 'name': name, 'mime': mime, 'size': size, 'kind': kind};
}

class MessageModel {
  const MessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    required this.createdAt,
    this.itemId,
    this.isRead = false,
    this.senderName = '',
    this.senderAvatarUrl = '',
    this.attachmentUrl = '',
    this.attachmentName = '',
    this.attachmentMime = '',
    this.attachmentSize = 0,
    this.attachmentKind = '',
  });
  final int id;
  final int senderId;
  final int receiverId;
  final int? itemId;
  final String content;
  final bool isRead;
  final DateTime createdAt;
  final String senderName;
  final String senderAvatarUrl;
  final String attachmentUrl;
  final String attachmentName;
  final String attachmentMime;
  final int attachmentSize;
  final String attachmentKind;

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        id: asInt(json['id']),
        senderId: asInt(json['sender_id']),
        receiverId: asInt(json['receiver_id']),
        itemId: json['item_id'] == null ? null : asInt(json['item_id']),
        content: json['content']?.toString() ?? '',
        isRead: asBool(json['is_read']),
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        senderName: json['sender_name']?.toString() ?? '',
        senderAvatarUrl: json['sender_avatar_url']?.toString() ?? '',
        attachmentUrl: json['attachment_url']?.toString() ?? '',
        attachmentName: json['attachment_name']?.toString() ?? '',
        attachmentMime: json['attachment_mime']?.toString() ?? '',
        attachmentSize: asInt(json['attachment_size']),
        attachmentKind: json['attachment_kind']?.toString() ?? '',
      );
  static List<MessageModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => MessageModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {
        'id': id,
        'sender_id': senderId,
        'receiver_id': receiverId,
        'item_id': itemId,
        'content': content,
        'is_read': isRead,
        'created_at': createdAt.toIso8601String(),
        'sender_name': senderName,
        'sender_avatar_url': senderAvatarUrl,
        'attachment_url': attachmentUrl,
        'attachment_name': attachmentName,
        'attachment_mime': attachmentMime,
        'attachment_size': attachmentSize,
        'attachment_kind': attachmentKind,
      };
}

class ConversationModel {
  const ConversationModel({
    required this.itemTitle,
    required this.otherUserId,
    required this.otherUserName,
    required this.lastMessage,
    required this.lastMessageAt,
    this.itemId,
    this.itemImageUrl = '',
    this.otherUserAvatarUrl = '',
    this.unreadCount = 0,
  });
  final int? itemId;
  final String itemTitle;
  final String itemImageUrl;
  final int otherUserId;
  final String otherUserName;
  final String otherUserAvatarUrl;
  final String lastMessage;
  final DateTime lastMessageAt;
  final int unreadCount;

  String get key => '${itemId ?? 0}-$otherUserId';

  factory ConversationModel.fromJson(Map<String, dynamic> json) => ConversationModel(
        itemId: json['item_id'] == null ? null : asInt(json['item_id']),
        itemTitle: json['item_title']?.toString() ?? 'Conversa',
        itemImageUrl: json['item_image_url']?.toString() ?? '',
        otherUserId: asInt(json['other_user_id']),
        otherUserName: json['other_user_name']?.toString() ?? 'Usuário',
        otherUserAvatarUrl: json['other_user_avatar_url']?.toString() ?? '',
        lastMessage: json['last_message']?.toString() ?? '',
        lastMessageAt: DateTime.tryParse(json['last_message_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        unreadCount: asInt(json['unread_count']),
      );
  static List<ConversationModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => ConversationModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {
        'item_id': itemId,
        'item_title': itemTitle,
        'item_image_url': itemImageUrl,
        'other_user_id': otherUserId,
        'other_user_name': otherUserName,
        'other_user_avatar_url': otherUserAvatarUrl,
        'last_message': lastMessage,
        'last_message_at': lastMessageAt.toIso8601String(),
        'unread_count': unreadCount,
      };
}
