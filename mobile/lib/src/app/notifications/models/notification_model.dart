import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Quem gerou a notificação (usuário que comentou, seguiu, mandou mensagem).
class NotificationActorModel {
  const NotificationActorModel({required this.id, required this.name, this.avatarUrl = ''});

  final int id;
  final String name;
  final String avatarUrl;

  factory NotificationActorModel.fromJson(Map<String, dynamic> json) => NotificationActorModel(
        id: asInt(json['id']),
        name: json['name']?.toString() ?? '',
        avatarUrl: json['avatar_url']?.toString() ?? '',
      );

  static List<NotificationActorModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => NotificationActorModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'avatar_url': avatarUrl};
}

class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.createdAt,
    this.body = '',
    this.link = '',
    this.itemId,
    this.isRead = false,
    this.actor,
  });

  final int id;
  final String type;
  final String title;
  final String body;
  final String link;
  final int? itemId;
  final bool isRead;
  final DateTime createdAt;
  final NotificationActorModel? actor;

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: asInt(json['id']),
        type: json['type']?.toString() ?? 'system',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? '',
        link: json['link']?.toString() ?? '',
        itemId: json['item_id'] == null ? null : asInt(json['item_id']),
        isRead: asBool(json['is_read']),
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
            DateTime.fromMillisecondsSinceEpoch(0),
        actor: json['actor'] == null ? null : NotificationActorModel.fromJson(asMap(json['actor'])),
      );

  static List<NotificationModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => NotificationModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'title': title,
        'body': body,
        'link': link,
        'item_id': itemId,
        'is_read': isRead,
        'created_at': createdAt.toIso8601String(),
        'actor': actor?.toJson(),
      };

  NotificationModel copyWith({bool? isRead}) => NotificationModel(
        id: id,
        type: type,
        title: title,
        body: body,
        link: link,
        itemId: itemId,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
        actor: actor,
      );
}
