import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Rótulo de um valor enumerado da API (categoria, assunto, documento).
class HelpOption {
  const HelpOption(this.value, this.label);
  final String value;
  final String label;
}

/// Mesmas categorias de `models.HelpArticleCategories` no backend.
const helpCategories = [
  HelpOption('conta', 'Conta e acesso'),
  HelpOption('anuncios', 'Anúncios'),
  HelpOption('compras', 'Compras e negociação'),
  HelpOption('seguranca', 'Segurança'),
  HelpOption('denuncias', 'Denúncias'),
  HelpOption('privacidade', 'Privacidade e dados'),
];

/// Mesmos assuntos de `models.SupportRequestTopics` no backend.
const supportTopics = [
  HelpOption('conta', 'Minha conta'),
  HelpOption('anuncio', 'Anúncio (incluindo contestar retirada)'),
  HelpOption('compra', 'Compra ou negociação'),
  HelpOption('denuncia', 'Denúncia'),
  HelpOption('privacidade', 'Privacidade e dados (LGPD)'),
  HelpOption('exclusao_conta', 'Excluir minha conta'),
  HelpOption('outro', 'Outro assunto'),
];

/// Slugs fixos de `models.LegalSlug*`. As mesmas páginas existem no site
/// (fazbrike.com.br/slug-do-documento), que é a URL informada às lojas de apps.
const legalDocuments = [
  HelpOption('termos-de-uso', 'Termos de uso'),
  HelpOption('politica-de-privacidade', 'Política de privacidade'),
  HelpOption('regras-de-publicacao', 'Regras de publicação'),
  HelpOption('politica-de-cookies', 'Política de cookies'),
];

String helpOptionLabel(List<HelpOption> options, String value) {
  for (final option in options) {
    if (option.value == value) return option.label;
  }
  return value;
}

class HelpArticleModel {
  const HelpArticleModel({
    required this.id,
    required this.category,
    required this.title,
    required this.body,
    this.position = 0,
  });

  final int id;
  final String category;
  final String title;
  final String body;
  final int position;

  factory HelpArticleModel.fromJson(Map<String, dynamic> json) => HelpArticleModel(
        id: asInt(json['id']),
        category: json['category']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? '',
        position: asInt(json['position']),
      );

  static List<HelpArticleModel> fromJsonList(dynamic jsonList) =>
      asList(jsonList).map((value) => HelpArticleModel.fromJson(asMap(value))).toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'category': category,
        'title': title,
        'body': body,
        'position': position,
      };
}

class LegalDocumentModel {
  const LegalDocumentModel({
    required this.slug,
    required this.title,
    required this.content,
    this.summary = '',
    this.version = '',
    this.updatedAt,
  });

  final String slug;
  final String title;
  final String summary;
  final String content;
  final String version;
  final DateTime? updatedAt;

  factory LegalDocumentModel.fromJson(Map<String, dynamic> json) => LegalDocumentModel(
        slug: json['slug']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        summary: json['summary']?.toString() ?? '',
        content: json['content']?.toString() ?? '',
        version: json['version']?.toString() ?? '',
        updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '')?.toLocal(),
      );

  static List<LegalDocumentModel> fromJsonList(dynamic jsonList) =>
      asList(jsonList).map((value) => LegalDocumentModel.fromJson(asMap(value))).toList();

  Map<String, dynamic> toJson() => {
        'slug': slug,
        'title': title,
        'summary': summary,
        'content': content,
        'version': version,
        'updated_at': updatedAt?.toIso8601String(),
      };

  List<LegalBlock> get blocks => LegalBlock.parse(content);
}

enum LegalBlockKind { heading, paragraph, list }

/// Bloco do markdown simples dos documentos: "## " seção, "- " item de lista
/// e linha em branco entre parágrafos (mesma regra do site).
class LegalBlock {
  const LegalBlock._(this.kind, {this.text = '', this.items = const []});
  final LegalBlockKind kind;
  final String text;
  final List<String> items;

  static List<LegalBlock> parse(String content) {
    final blocks = <LegalBlock>[];
    var paragraph = <String>[];
    var list = <String>[];

    void flushParagraph() {
      if (paragraph.isNotEmpty) blocks.add(LegalBlock._(LegalBlockKind.paragraph, text: paragraph.join(' ')));
      paragraph = <String>[];
    }

    void flushList() {
      if (list.isNotEmpty) blocks.add(LegalBlock._(LegalBlockKind.list, items: list));
      list = <String>[];
    }

    for (final raw in content.replaceAll('\r\n', '\n').split('\n')) {
      final line = raw.trim();
      if (line.isEmpty) {
        flushParagraph();
        flushList();
      } else if (line.startsWith('#')) {
        flushParagraph();
        flushList();
        blocks.add(LegalBlock._(LegalBlockKind.heading, text: line.replaceFirst(RegExp(r'^#+\s*'), '')));
      } else if (line.startsWith('- ')) {
        flushParagraph();
        list.add(line.substring(2).trim());
      } else {
        flushList();
        paragraph.add(line);
      }
    }
    flushParagraph();
    flushList();
    return blocks;
  }
}

class SupportRequestModel {
  const SupportRequestModel({
    required this.id,
    required this.topic,
    required this.subject,
    required this.message,
    required this.status,
    required this.createdAt,
    this.response = '',
    this.respondedAt,
  });

  final int id;
  final String topic;
  final String subject;
  final String message;
  final String status;
  final String response;
  final DateTime createdAt;
  final DateTime? respondedAt;

  String get statusLabel => switch (status) {
        'answered' => 'Respondido',
        'closed' => 'Encerrado',
        _ => 'Aguardando resposta',
      };

  factory SupportRequestModel.fromJson(Map<String, dynamic> json) => SupportRequestModel(
        id: asInt(json['id']),
        topic: json['topic']?.toString() ?? '',
        subject: json['subject']?.toString() ?? '',
        message: json['message']?.toString() ?? '',
        status: json['status']?.toString() ?? 'open',
        response: json['response']?.toString() ?? '',
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '')?.toLocal() ??
            DateTime.fromMillisecondsSinceEpoch(0),
        respondedAt: DateTime.tryParse(json['responded_at']?.toString() ?? '')?.toLocal(),
      );

  static List<SupportRequestModel> fromJsonList(dynamic jsonList) =>
      asList(jsonList).map((value) => SupportRequestModel.fromJson(asMap(value))).toList();

  Map<String, dynamic> toJson() => {
        'id': id,
        'topic': topic,
        'subject': subject,
        'message': message,
        'status': status,
        'response': response,
        'created_at': createdAt.toIso8601String(),
        'responded_at': respondedAt?.toIso8601String(),
      };
}
