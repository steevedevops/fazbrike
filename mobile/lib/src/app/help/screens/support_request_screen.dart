import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/help/widgets/support_request_form.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class SupportRequestScreen extends StatelessWidget {
  const SupportRequestScreen({super.key, this.initialTopic = 'conta', this.itemId});
  static const path = '/ajuda/contato';
  final String initialTopic;
  final int? itemId;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Fale com a gente')),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: SupportRequestForm(initialTopic: initialTopic, itemId: itemId),
          ),
        ),
      );
}
