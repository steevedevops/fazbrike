import 'dart:convert';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

class ItemImageModel {
  const ItemImageModel({required this.id, required this.itemId, required this.url, required this.sortOrder});
  final int id;
  final int itemId;
  final String url;
  final int sortOrder;

  factory ItemImageModel.fromJson(Map<String, dynamic> json) => ItemImageModel(
        id: asInt(json['id']),
        itemId: asInt(json['item_id']),
        url: json['url']?.toString() ?? '',
        sortOrder: asInt(json['sort_order']),
      );
  static List<ItemImageModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => ItemImageModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() =>
      {'id': id, 'item_id': itemId, 'url': url, 'sort_order': sortOrder};
}

class ItemSellerModel {
  const ItemSellerModel({required this.id, required this.name, this.createdAt});
  final int id;
  final String name;
  final DateTime? createdAt;

  factory ItemSellerModel.fromJson(Map<String, dynamic> json) => ItemSellerModel(
        id: asInt(json['id']),
        name: json['name']?.toString() ?? '',
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
      );
  static List<ItemSellerModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => ItemSellerModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'created_at': createdAt?.toIso8601String()};
}

class ItemModel {
  const ItemModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
    this.imageUrl = '',
    this.images = const [],
    this.category = '',
    this.listingType = 'item',
    this.location = '',
    this.cityId,
    this.stateId,
    this.condition = '',
    this.attrs = '{}',
    this.status = 'active',
    this.soldAt,
    this.user,
    this.commentsCount = 0,
    this.viewsCount = 0,
    this.favoritesCount = 0,
    this.isFavorited = false,
  });

  final int id;
  final String title;
  final String description;
  final double price;
  final String imageUrl;
  final List<ItemImageModel> images;
  final String category;
  final String listingType;
  final String location;
  final int? cityId;
  final int? stateId;
  final String condition;
  final String attrs;
  final String status;
  final DateTime? soldAt;
  final int userId;
  final ItemSellerModel? user;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int commentsCount;
  final int viewsCount;
  final int favoritesCount;
  final bool isFavorited;

  factory ItemModel.fromJson(Map<String, dynamic> json) => ItemModel(
        id: asInt(json['id']),
        title: json['title']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        price: asDouble(json['price']),
        imageUrl: json['image_url']?.toString() ?? '',
        images: ItemImageModel.fromJsonList(json['images']),
        category: json['category']?.toString() ?? '',
        listingType: json['listing_type']?.toString() ?? 'item',
        location: json['location']?.toString() ?? '',
        cityId: json['city_id'] == null ? null : asInt(json['city_id']),
        stateId: json['state_id'] == null ? null : asInt(json['state_id']),
        condition: json['condition']?.toString() ?? '',
        attrs: json['attrs']?.toString() ?? '{}',
        status: json['status']?.toString() ?? 'active',
        soldAt: DateTime.tryParse(json['sold_at']?.toString() ?? ''),
        userId: asInt(json['user_id']),
        user: json['user'] == null ? null : ItemSellerModel.fromJson(asMap(json['user'])),
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        commentsCount: asInt(json['comments_count']),
        viewsCount: asInt(json['views_count']),
        favoritesCount: asInt(json['favorites_count']),
        isFavorited: asBool(json['is_favorited']),
      );

  static List<ItemModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => ItemModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> get attributes {
    try {
      return asMap(jsonDecode(attrs));
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  ItemModel copyWith({bool? isFavorited, int? favoritesCount, int? viewsCount, String? status}) => ItemModel(
        id: id,
        title: title,
        description: description,
        price: price,
        userId: userId,
        createdAt: createdAt,
        updatedAt: updatedAt,
        imageUrl: imageUrl,
        images: images,
        category: category,
        listingType: listingType,
        location: location,
        cityId: cityId,
        stateId: stateId,
        condition: condition,
        attrs: attrs,
        status: status ?? this.status,
        soldAt: soldAt,
        user: user,
        commentsCount: commentsCount,
        viewsCount: viewsCount ?? this.viewsCount,
        favoritesCount: favoritesCount ?? this.favoritesCount,
        isFavorited: isFavorited ?? this.isFavorited,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'price': price,
        'image_url': imageUrl,
        'images': images.map((value) => value.toJson()).toList(),
        'category': category,
        'listing_type': listingType,
        'location': location,
        'city_id': cityId,
        'state_id': stateId,
        'condition': condition,
        'attrs': attrs,
        'status': status,
        'sold_at': soldAt?.toIso8601String(),
        'user_id': userId,
        'user': user?.toJson(),
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'comments_count': commentsCount,
        'views_count': viewsCount,
        'favorites_count': favoritesCount,
        'is_favorited': isFavorited,
      };
}

class ItemCommentModel {
  const ItemCommentModel({
    required this.id,
    required this.itemId,
    required this.userId,
    required this.content,
    required this.createdAt,
    this.userName = 'Usuário',
  });
  final int id;
  final int itemId;
  final int userId;
  final String content;
  final DateTime createdAt;
  final String userName;

  factory ItemCommentModel.fromJson(Map<String, dynamic> json) => ItemCommentModel(
        id: asInt(json['id']),
        itemId: asInt(json['item_id']),
        userId: asInt(json['user_id']),
        content: json['content']?.toString() ?? '',
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        userName: asMap(json['user'])['name']?.toString() ?? 'Usuário',
      );
  static List<ItemCommentModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => ItemCommentModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {
        'id': id,
        'item_id': itemId,
        'user_id': userId,
        'content': content,
        'created_at': createdAt.toIso8601String(),
        'user': {'name': userName},
      };
}
