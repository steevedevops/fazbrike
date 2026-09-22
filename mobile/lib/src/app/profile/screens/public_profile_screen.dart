import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/profile/widgets/public_profile_content.dart';

class PublicProfileScreen extends StatelessWidget {
  const PublicProfileScreen({super.key, required this.userId});
  final int userId;
  @override
  Widget build(BuildContext context) => Scaffold(body: SafeArea(child: PublicProfileContent(userId: userId)));
}
