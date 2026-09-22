import 'package:fazbrike/src/shared/utils/json_utils.dart';

class UserProfileModel {
  const UserProfileModel({
    required this.id,
    required this.userId,
    this.bio = '',
    this.phone = '',
    this.city = '',
    this.state = '',
    this.stateId,
    this.cityId,
    this.avatarUrl = '',
    this.bannerUrl = '',
    this.website = '',
    this.isPublic = true,
    this.isFeatured = false,
  });

  final int id;
  final int userId;
  final String bio;
  final String phone;
  final String city;
  final String state;
  final int? stateId;
  final int? cityId;
  final String avatarUrl;
  final String bannerUrl;
  final String website;
  final bool isPublic;
  final bool isFeatured;

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: asInt(json['id']),
      userId: asInt(json['user_id']),
      bio: json['bio']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      stateId: json['state_id'] == null ? null : asInt(json['state_id']),
      cityId: json['city_id'] == null ? null : asInt(json['city_id']),
      avatarUrl: json['avatar_url']?.toString() ?? '',
      bannerUrl: json['banner_url']?.toString() ?? '',
      website: json['website']?.toString() ?? '',
      isPublic: asBool(json['is_public'], true),
      isFeatured: asBool(json['is_featured']),
    );
  }

  static List<UserProfileModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => UserProfileModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'bio': bio,
        'phone': phone,
        'city': city,
        'state': state,
        'state_id': stateId,
        'city_id': cityId,
        'avatar_url': avatarUrl,
        'banner_url': bannerUrl,
        'website': website,
        'is_public': isPublic,
        'is_featured': isFeatured,
      };
}

class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.createdAt,
    this.updatedAt,
    this.role = 'user',
    this.emailVerified = false,
    this.profile,
  });

  final int id;
  final String email;
  final String name;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String role;
  final bool emailVerified;
  final UserProfileModel? profile;

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: asInt(json['id']),
        email: json['email']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        role: json['role']?.toString() ?? 'user',
        emailVerified: asBool(json['email_verified']),
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
            DateTime.fromMillisecondsSinceEpoch(0),
        updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? ''),
        profile: json['profile'] == null
            ? null
            : UserProfileModel.fromJson(asMap(json['profile'])),
      );

  static List<UserModel> fromJsonList(dynamic jsonList) => asList(jsonList)
      .map((value) => UserModel.fromJson(asMap(value)))
      .toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role,
        'email_verified': emailVerified,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt?.toIso8601String(),
        'profile': profile?.toJson(),
      };
}
