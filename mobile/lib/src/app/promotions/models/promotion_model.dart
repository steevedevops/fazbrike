import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Tipos de destino aceitos pelo backend (`models/promotion.go`).
class PromotionTargetType {
  const PromotionTargetType._();
  static const none = 'none';
  static const profile = 'profile';
  static const item = 'item';
  static const category = 'category';
  static const search = 'search';
  static const page = 'page';
  static const external = 'external';
}

/// Destino já resolvido pelo backend. O app só navega para [route] — quem monta
/// a rota a partir de id/slug é o servidor, para o app e o site irem ao mesmo
/// lugar.
class PromotionTargetModel {
  const PromotionTargetModel({
    this.type = PromotionTargetType.none,
    this.route = '',
    this.label = '',
    this.externalUrl = '',
  });

  final String type;
  final String route;
  final String label;
  final String externalUrl;

  /// Leva para dentro da plataforma (rota do próprio app).
  bool get isInternal => route.startsWith('/');

  /// Tem para onde ir — banner sem destino é só informativo.
  bool get isClickable => isInternal || externalUrl.isNotEmpty;

  factory PromotionTargetModel.fromJson(Map<String, dynamic> json) => PromotionTargetModel(
        type: json['type']?.toString() ?? PromotionTargetType.none,
        route: json['route']?.toString() ?? '',
        label: json['label']?.toString() ?? '',
        externalUrl: json['external_url']?.toString() ?? '',
      );

  static List<PromotionTargetModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => PromotionTargetModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'type': type,
        'route': route,
        'label': label,
        'external_url': externalUrl,
      };
}

/// Banner exibido na home.
class PromotionModel {
  const PromotionModel({
    required this.id,
    required this.title,
    this.subtitle = '',
    this.imageUrl = '',
    this.ctaLabel = '',
    this.target = const PromotionTargetModel(),
  });

  final int id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String ctaLabel;
  final PromotionTargetModel target;

  factory PromotionModel.fromJson(Map<String, dynamic> json) => PromotionModel(
        id: asInt(json['id']),
        title: json['title']?.toString() ?? '',
        subtitle: json['subtitle']?.toString() ?? '',
        imageUrl: json['image_url']?.toString() ?? '',
        ctaLabel: json['cta_label']?.toString() ?? '',
        target: PromotionTargetModel.fromJson(asMap(json['target'])),
      );

  static List<PromotionModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => PromotionModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'subtitle': subtitle,
        'image_url': imageUrl,
        'cta_label': ctaLabel,
        'target': target.toJson(),
      };
}

/// Campanha vista pelo dono: traz o destino em forma editável, as métricas e o
/// motivo de não estar no ar.
class MyPromotionModel {
  const MyPromotionModel({
    required this.id,
    required this.title,
    this.subtitle = '',
    this.imageUrl = '',
    this.ctaLabel = '',
    this.target = const PromotionTargetModel(),
    this.targetType = PromotionTargetType.none,
    this.targetId,
    this.targetValue = '',
    this.isActive = true,
    this.isVisible = false,
    this.unavailableFor = '',
    this.clickCount = 0,
    this.impressionCount = 0,
    this.startsAt,
    this.endsAt,
  });

  final int id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String ctaLabel;
  final PromotionTargetModel target;
  final String targetType;
  final int? targetId;
  final String targetValue;
  final bool isActive;
  final bool isVisible;
  final String unavailableFor;
  final int clickCount;
  final int impressionCount;
  final DateTime? startsAt;
  final DateTime? endsAt;

  factory MyPromotionModel.fromJson(Map<String, dynamic> json) => MyPromotionModel(
        id: asInt(json['id']),
        title: json['title']?.toString() ?? '',
        subtitle: json['subtitle']?.toString() ?? '',
        imageUrl: json['image_url']?.toString() ?? '',
        ctaLabel: json['cta_label']?.toString() ?? '',
        target: PromotionTargetModel.fromJson(asMap(json['target'])),
        targetType: json['target_type']?.toString() ?? PromotionTargetType.none,
        targetId: json['target_id'] == null ? null : asInt(json['target_id']),
        targetValue: json['target_value']?.toString() ?? '',
        isActive: asBool(json['is_active'], true),
        isVisible: asBool(json['is_visible']),
        unavailableFor: json['unavailable_for']?.toString() ?? '',
        clickCount: asInt(json['click_count']),
        impressionCount: asInt(json['impression_count']),
        startsAt: DateTime.tryParse(json['starts_at']?.toString() ?? ''),
        endsAt: DateTime.tryParse(json['ends_at']?.toString() ?? ''),
      );

  static List<MyPromotionModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => MyPromotionModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'subtitle': subtitle,
        'image_url': imageUrl,
        'cta_label': ctaLabel,
        'target_type': targetType,
        'target_id': targetId,
        'target_value': targetValue,
        'is_active': isActive,
        'starts_at': startsAt?.toIso8601String(),
        'ends_at': endsAt?.toIso8601String(),
      };

  MyPromotionModel copyWith({bool? isActive}) => MyPromotionModel(
        id: id,
        title: title,
        subtitle: subtitle,
        imageUrl: imageUrl,
        ctaLabel: ctaLabel,
        target: target,
        targetType: targetType,
        targetId: targetId,
        targetValue: targetValue,
        isActive: isActive ?? this.isActive,
        isVisible: isVisible,
        unavailableFor: unavailableFor,
        clickCount: clickCount,
        impressionCount: impressionCount,
        startsAt: startsAt,
        endsAt: endsAt,
      );
}
