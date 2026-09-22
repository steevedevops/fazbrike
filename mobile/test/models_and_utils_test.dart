import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/src/app/auth/models/user_model.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/messages/models/message_models.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/utils/image_url.dart';

void main() {
  group('preço', () {
    test('aceita vírgula e rejeita valores inválidos', () {
      expect(parsePrice('100,50'), 100.5);
      expect(parsePrice('-1'), isNull);
      expect(parsePrice('abc'), isNull);
    });
  });

  group('models', () {
    test('desserializa usuário e perfil em snake_case', () {
      final user = UserModel.fromJson({
        'id': 4,
        'email': 'teste@fazbrike.local',
        'name': 'Teste',
        'email_verified': true,
        'created_at': '2026-01-01T12:00:00Z',
        'profile': {'id': 7, 'user_id': 4, 'is_public': true},
      });
      expect(user.id, 4);
      expect(user.emailVerified, isTrue);
      expect(user.profile?.userId, 4);
    });

    test('desserializa anúncio com métricas e galeria', () {
      final item = ItemModel.fromJson({
        'id': 1,
        'title': 'Notebook',
        'description': 'Em ótimo estado',
        'price': 2500,
        'user_id': 2,
        'created_at': '2026-01-01T12:00:00Z',
        'updated_at': '2026-01-01T12:00:00Z',
        'favorites_count': 3,
        'is_favorited': true,
        'images': [{'id': 9, 'item_id': 1, 'url': '/uploads/a.jpg', 'sort_order': 0}],
      });
      expect(item.price, 2500);
      expect(item.images.single.id, 9);
      expect(item.isFavorited, isTrue);
    });

    test('desserializa conversa sem item para mensagem direta', () {
      final conversation = ConversationModel.fromJson({
        'item_title': 'Conversa com Ana',
        'other_user_id': 8,
        'other_user_name': 'Ana',
        'last_message': 'Olá',
        'last_message_at': '2026-01-01T12:00:00Z',
      });
      expect(conversation.itemId, isNull);
      expect(conversation.key, '0-8');
    });
  });

  test('normaliza caminhos de upload do backend', () {
    expect(resolveImageUrl('/uploads/a.jpg'), endsWith('/api/uploads/a.jpg'));
    expect(resolveImageUrl('/api/uploads/a.jpg'), endsWith('/api/uploads/a.jpg'));
    expect(resolveImageUrl('https://cdn.example/a.jpg'), 'https://cdn.example/a.jpg');
  });
}
