import 'package:fazbrike/src/shared/utils/json_utils.dart';

class CategoryModel {
  const CategoryModel({
    required this.id,
    required this.slug,
    required this.name,
    required this.listingType,
    this.parentId,
    this.icon = '',
    this.children = const [],
  });

  final int id;
  final String slug;
  final String name;
  final String listingType;
  final int? parentId;
  final String icon;
  final List<CategoryModel> children;

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
        id: asInt(json['id']),
        slug: json['slug']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        listingType: json['listing_type']?.toString() ?? 'item',
        parentId: json['parent_id'] == null ? null : asInt(json['parent_id']),
        icon: json['icon']?.toString() ?? '',
        children: CategoryModel.fromJsonList(json['children']),
      );

  static List<CategoryModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => CategoryModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'slug': slug,
        'name': name,
        'listing_type': listingType,
        'parent_id': parentId,
        'icon': icon,
        'children': children.map((value) => value.toJson()).toList(),
      };
}

class StateOptionModel {
  const StateOptionModel({
    required this.id,
    required this.name,
    required this.code,
    required this.countryId,
  });
  final int id;
  final String name;
  final String code;
  final int countryId;

  factory StateOptionModel.fromJson(Map<String, dynamic> json) => StateOptionModel(
        id: asInt(json['id']),
        name: json['name']?.toString() ?? '',
        code: json['code']?.toString() ?? '',
        countryId: asInt(json['country_id']),
      );
  static List<StateOptionModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => StateOptionModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'code': code, 'country_id': countryId};
}

class CityOptionModel {
  const CityOptionModel({required this.id, required this.name, required this.stateId, this.ibge});
  final int id;
  final String name;
  final int stateId;
  final String? ibge;

  factory CityOptionModel.fromJson(Map<String, dynamic> json) => CityOptionModel(
        id: asInt(json['id']),
        name: json['name']?.toString() ?? '',
        stateId: asInt(json['state_id']),
        ibge: json['ibge']?.toString(),
      );
  static List<CityOptionModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => CityOptionModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'state_id': stateId, 'ibge': ibge};
}
