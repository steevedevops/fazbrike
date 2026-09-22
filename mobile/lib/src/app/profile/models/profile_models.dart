import 'package:fazbrike/src/app/auth/models/user_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

class MyProfileModel {
  const MyProfileModel({required this.user, required this.profile, required this.listingsCount});
  final UserModel user;
  final UserProfileModel profile;
  final int listingsCount;

  factory MyProfileModel.fromJson(Map<String, dynamic> json) => MyProfileModel(
        user: UserModel.fromJson(asMap(json['user'])),
        profile: UserProfileModel.fromJson(asMap(json['profile'])),
        listingsCount: asInt(json['listings_count']),
      );
  static List<MyProfileModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => MyProfileModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {
        'user': user.toJson(),
        'profile': profile.toJson(),
        'listings_count': listingsCount,
      };
}

class PublicProfileModel {
  const PublicProfileModel({
    required this.id,
    required this.name,
    required this.memberSince,
    this.bio = '',
    this.city = '',
    this.state = '',
    this.avatarUrl = '',
    this.bannerUrl = '',
    this.website = '',
    this.isFeatured = false,
    this.listingsCount = 0,
    this.forSaleCount = 0,
    this.soldCount = 0,
    this.favoritesCount = 0,
    this.followersCount = 0,
    this.followingCount = 0,
    this.ratingAverage = 0,
    this.ratingCount = 0,
    this.isFollowing = false,
  });
  final int id;
  final String name;
  final String bio;
  final String city;
  final String state;
  final String avatarUrl;
  final String bannerUrl;
  final String website;
  final bool isFeatured;
  final DateTime memberSince;
  final int listingsCount;
  final int forSaleCount;
  final int soldCount;
  final int favoritesCount;
  final int followersCount;
  final int followingCount;
  final double ratingAverage;
  final int ratingCount;
  final bool isFollowing;

  factory PublicProfileModel.fromJson(Map<String, dynamic> json) => PublicProfileModel(
        id: asInt(json['id']),
        name: json['name']?.toString() ?? '',
        bio: json['bio']?.toString() ?? '',
        city: json['city']?.toString() ?? '',
        state: json['state']?.toString() ?? '',
        avatarUrl: json['avatar_url']?.toString() ?? '',
        bannerUrl: json['banner_url']?.toString() ?? '',
        website: json['website']?.toString() ?? '',
        isFeatured: asBool(json['is_featured']),
        memberSince: DateTime.tryParse(json['member_since']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        listingsCount: asInt(json['listings_count']),
        forSaleCount: asInt(json['for_sale_count']),
        soldCount: asInt(json['sold_count']),
        favoritesCount: asInt(json['favorites_count']),
        followersCount: asInt(json['followers_count']),
        followingCount: asInt(json['following_count']),
        ratingAverage: asDouble(json['rating_average']),
        ratingCount: asInt(json['rating_count']),
        isFollowing: asBool(json['is_following']),
      );
  static List<PublicProfileModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => PublicProfileModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'bio': bio,
        'city': city,
        'state': state,
        'avatar_url': avatarUrl,
        'banner_url': bannerUrl,
        'website': website,
        'is_featured': isFeatured,
        'member_since': memberSince.toIso8601String(),
        'listings_count': listingsCount,
        'for_sale_count': forSaleCount,
        'sold_count': soldCount,
        'favorites_count': favoritesCount,
        'followers_count': followersCount,
        'following_count': followingCount,
        'rating_average': ratingAverage,
        'rating_count': ratingCount,
        'is_following': isFollowing,
      };
}

class FollowUserModel {
  const FollowUserModel({required this.id, required this.name, this.avatarUrl = ''});
  final int id;
  final String name;
  final String avatarUrl;
  factory FollowUserModel.fromJson(Map<String, dynamic> json) => FollowUserModel(
        id: asInt(json['id']),
        name: json['name']?.toString() ?? '',
        avatarUrl: json['avatar_url']?.toString() ?? '',
      );
  static List<FollowUserModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => FollowUserModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'avatar_url': avatarUrl};
}

class ReviewModel {
  const ReviewModel({
    required this.id,
    required this.reviewerId,
    required this.revieweeId,
    required this.rating,
    required this.createdAt,
    this.itemId,
    this.comment = '',
    this.reviewerName = 'Usuário',
    this.reviewerAvatarUrl = '',
  });
  final int id;
  final int reviewerId;
  final int revieweeId;
  final int? itemId;
  final int rating;
  final String comment;
  final DateTime createdAt;
  final String reviewerName;
  final String reviewerAvatarUrl;

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final reviewer = asMap(json['reviewer']);
    return ReviewModel(
      id: asInt(json['id']),
      reviewerId: asInt(json['reviewer_id']),
      revieweeId: asInt(json['reviewee_id']),
      itemId: json['item_id'] == null ? null : asInt(json['item_id']),
      rating: asInt(json['rating']),
      comment: json['comment']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
      reviewerName: reviewer['name']?.toString() ?? 'Usuário',
      reviewerAvatarUrl: reviewer['avatar_url']?.toString() ?? '',
    );
  }
  static List<ReviewModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => ReviewModel.fromJson(asMap(value)))
      .toList();
  Map<String, dynamic> toJson() => {
        'id': id,
        'reviewer_id': reviewerId,
        'reviewee_id': revieweeId,
        'item_id': itemId,
        'rating': rating,
        'comment': comment,
        'created_at': createdAt.toIso8601String(),
        'reviewer': {'name': reviewerName, 'avatar_url': reviewerAvatarUrl},
      };
}
