import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/app/promotions/widgets/promotion_form.dart';

/// Criação e edição da campanha. Carrega o que o seletor de destino precisa
/// (meus anúncios e categorias) antes de montar o formulário.
class PromotionEditorScreen extends ConsumerStatefulWidget {
  const PromotionEditorScreen({super.key, this.promotion});

  static const newPath = '/minhas-promocoes/nova';

  final MyPromotionModel? promotion;

  @override
  ConsumerState<PromotionEditorScreen> createState() => _PromotionEditorScreenState();
}

class _PromotionEditorScreenState extends ConsumerState<PromotionEditorScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(myItemsListProvider.notifier).list();
      ref.read(categoriesProvider.notifier).list();
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(widget.promotion == null ? 'Nova campanha' : 'Editar campanha'),
        ),
        body: PromotionForm(promotion: widget.promotion),
      );
}
