import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Busca + filtro por tema + perguntas agrupadas (expansíveis).
class HelpArticleList extends StatefulWidget {
  const HelpArticleList({super.key, required this.articles});
  final List<HelpArticleModel> articles;

  @override
  State<HelpArticleList> createState() => _HelpArticleListState();
}

class _HelpArticleListState extends State<HelpArticleList> {
  final _search = TextEditingController();
  String _category = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  static String _normalize(String value) {
    const from = 'áàâãäéèêëíìîïóòôõöúùûüçñ';
    const to = 'aaaaaeeeeiiiiooooouuuucn';
    final lower = value.toLowerCase();
    final buffer = StringBuffer();
    for (final char in lower.split('')) {
      final index = from.indexOf(char);
      buffer.write(index >= 0 ? to[index] : char);
    }
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    final term = _normalize(_search.text.trim());
    final filtered = widget.articles.where((article) {
      if (_category.isNotEmpty && article.category != _category) return false;
      if (term.isEmpty) return true;
      return _normalize('${article.title} ${article.body}').contains(term);
    }).toList();
    final categories = helpCategories
        .where((option) => widget.articles.any((article) => article.category == option.value))
        .toList();
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _search,
          onChanged: (_) => setState(() {}),
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: 'Busque: senha, denúncia, excluir conta...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _search.text.isEmpty
                ? null
                : IconButton(
                    tooltip: 'Limpar busca',
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(_search.clear),
                  ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _chip('Todos', ''),
            for (final option in categories) _chip(option.label, option.value),
          ]),
        ),
        const SizedBox(height: AppSpacing.lg),
        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
            child: Text(
              'Nenhuma resposta encontrada. Tente outras palavras ou fale com a nossa equipe.',
              style: theme.textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          )
        else
          for (final group in helpCategories)
            if (filtered.any((article) => article.category == group.value)) ...[
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.sm),
                child: Text(group.label.toUpperCase(), style: theme.textTheme.labelMedium),
              ),
              Card(
                margin: const EdgeInsets.only(bottom: AppSpacing.md),
                clipBehavior: Clip.antiAlias,
                child: Column(children: [
                  for (final article in filtered.where((article) => article.category == group.value))
                    ExpansionTile(
                      key: PageStorageKey('help-${article.id}'),
                      shape: const Border(),
                      title: Text(article.title, style: theme.textTheme.titleSmall),
                      childrenPadding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
                      expandedCrossAxisAlignment: CrossAxisAlignment.start,
                      children: [Text(article.body, style: theme.textTheme.bodyMedium)],
                    ),
                ]),
              ),
            ],
      ],
    );
  }

  Widget _chip(String label, String value) => Padding(
        padding: const EdgeInsets.only(right: AppSpacing.sm),
        child: ChoiceChip(
          label: Text(label),
          selected: _category == value,
          onSelected: (_) => setState(() => _category = value),
        ),
      );
}
