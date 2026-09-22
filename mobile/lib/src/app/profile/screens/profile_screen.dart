import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/profile/widgets/profile_content.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  static const path = '/perfil';
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(myProfileProvider.notifier).load();
      ref.read(myItemsListProvider.notifier).list();
    });
  }
  @override
  Widget build(BuildContext context) => const Scaffold(body: SafeArea(child: ProfileContent()));
}
