import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/auth/widgets/verify_email_form.dart';

class VerifyEmailScreen extends StatelessWidget {
  const VerifyEmailScreen({super.key, required this.email});
  static const path = '/verificar-email';
  final String email;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Confirmar email')),
        body: SafeArea(child: VerifyEmailForm(initialEmail: email)),
      );
}
