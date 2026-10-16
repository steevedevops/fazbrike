import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/help/controllers/help_controller.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/app/help/widgets/legal_document_body.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';

class LegalDocumentScreen extends ConsumerWidget {
  const LegalDocumentScreen({super.key, required this.slug});
  static const path = '/legal/:slug';
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
        appBar: AppBar(title: Text(helpOptionLabel(legalDocuments, slug))),
        body: ref.watch(legalDocumentProvider(slug)).when(
              loading: () => const LoadingView(),
              error: (error, _) => ErrorView(
                message: error.toString(),
                onRetry: () => ref.read(legalDocumentProvider(slug).notifier).load(),
              ),
              data: (document) => LegalDocumentBody(document: document),
            ),
      );
}
