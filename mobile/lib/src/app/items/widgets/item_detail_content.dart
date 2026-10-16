import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/items/widgets/item_attributes.dart';
import 'package:fazbrike/src/app/items/widgets/item_comments_section.dart';
import 'package:fazbrike/src/app/items/widgets/item_contact_bar.dart';
import 'package:fazbrike/src/app/items/widgets/item_description.dart';
import 'package:fazbrike/src/app/items/widgets/item_detail_app_bar.dart';
import 'package:fazbrike/src/app/items/widgets/item_detail_header.dart';
import 'package:fazbrike/src/app/items/widgets/item_key_facts.dart';
import 'package:fazbrike/src/app/items/widgets/item_related_section.dart';
import 'package:fazbrike/src/app/items/widgets/item_seller_card.dart';
import 'package:fazbrike/src/app/items/widgets/item_specs_section.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ItemDetailContent extends ConsumerStatefulWidget {
  const ItemDetailContent({super.key, required this.item});
  final ItemModel item;
  @override
  ConsumerState<ItemDetailContent> createState() => _ItemDetailContentState();
}

class _ItemDetailContentState extends ConsumerState<ItemDetailContent> {
  bool viewed = false;
  @override
  void initState() {
    super.initState();
    Future.microtask(_registerView);
  }
  Future<void> _registerView() async {
    if (viewed || ref.read(authSessionProvider).value == null) return;
    viewed = true;
    try { await ref.read(itemFormProvider.notifier).registerView(widget.item.id); } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final facts = itemKeyFacts(item);
    final specs = itemSpecs(item);
    final divider = Divider(height: AppSpacing.xxl * 1.5, color: Theme.of(context).colorScheme.outlineVariant);
    return Column(children: [
      Expanded(
        child: CustomScrollView(slivers: [
          ItemDetailAppBar(item: item),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, 0),
            sliver: SliverList.list(children: [
              ItemDetailHeader(item: item),
              if (facts.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xl),
                ItemKeyFacts(facts: facts),
              ],
              divider,
              ItemDescription(text: item.description),
              if (specs.isNotEmpty) ...[
                divider,
                ItemSpecsSection(specs: specs),
              ],
              divider,
              ItemSellerCard(item: item),
              divider,
              ItemCommentsSection(item: item),
              divider,
            ]),
          ),
          SliverToBoxAdapter(child: ItemRelatedSection(item: item)),
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxl)),
        ]),
      ),
      ItemContactBar(item: item),
    ]);
  }
}
