import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_panel.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});
  static const path = '/login';

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Fazbrike')),
        body: const SafeArea(child: AuthPanel()),
      );
}
