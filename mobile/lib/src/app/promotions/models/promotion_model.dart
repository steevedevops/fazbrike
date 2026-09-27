import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Banner de campanha cadastrado no admin (collection "Promoções (banners)").
class PromotionModel {
  const PromotionModel({
    required this.id,
    required this.title,
    this.subtitle = '',
    this.imageUrl = '',
    this.linkUrl = '',
    this.ctaLabel = '',
  });

  final int id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String linkUrl;
  final String ctaLabel;

  factory PromotionModel.fromJson(Map<String, dynamic> json) => PromotionModel(
        id: asInt(json['id']),
        title: json['title']?.toString() ?? '',
        subtitle: json['subtitle']?.toString() ?? '',
        imageUrl: json['image_url']?.toString() ?? '',
        linkUrl: json['link_url']?.toString() ?? '',
        ctaLabel: json['cta_label']?.toString() ?? '',
      );

  static List<PromotionModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => PromotionModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'subtitle': subtitle,
        'image_url': imageUrl,
        'link_url': linkUrl,
        'cta_label': ctaLabel,
      };
}
