import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_panel.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});
  static const path = '/login';

  @override
  Widget build(BuildContext context) => const Scaffold(
        // Sem AppBar: como no site, a saída é o atalho "voltar à loja" dentro
        // do próprio conteúdo.
        body: SafeArea(child: AuthPanel()),
      );
}
