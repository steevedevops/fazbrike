import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/auth/models/user_model.dart';
import 'package:fazbrike/src/app/profile/models/profile_models.dart';
import 'package:fazbrike/src/app/profile/widgets/profile_edit_sheet.dart';

class _FakeApi implements ApiServices {
  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    if (route == '/states') {
      return const ApiResponseModel<dynamic>(
        data: [
          {'id': 35, 'name': 'São Paulo', 'code': 'SP', 'country_id': 1},
        ],
        statusCode: 200,
      );
    }
    if (route == '/cities') {
      return const ApiResponseModel<dynamic>(
        data: [
          {'id': 1, 'name': 'Campinas', 'state_id': 35},
        ],
        statusCode: 200,
      );
    }
    return const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

MyProfileModel _profile({int? stateId, int? cityId}) => MyProfileModel(
      user: UserModel(
        id: 1,
        email: 'maria@exemplo.com',
        name: 'Maria Silva',
        createdAt: DateTime(2024),
      ),
      profile: UserProfileModel(id: 1, userId: 1, stateId: stateId, cityId: cityId),
      listingsCount: 0,
    );

Future<void> _pump(WidgetTester tester, MyProfileModel profile) async {
  tester.view.physicalSize = const Size(1200, 2400);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(ProviderScope(
    overrides: [apiServicesProvider.overrideWithValue(_FakeApi())],
    child: MaterialApp(home: ProfileEditSheet(profile: profile)),
  ));
}

void main() {
  testWidgets('editar perfil com estado salvo abre sem erro e mostra a cidade', (tester) async {
    await _pump(tester, _profile(stateId: 35, cityId: 1));
    expect(tester.takeException(), isNull);

    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Editar perfil'), findsOneWidget);
    expect(find.text('São Paulo (SP)'), findsOneWidget);
    expect(find.text('Campinas'), findsOneWidget);
  });

  testWidgets('estado que não existe mais não derruba a tela', (tester) async {
    await _pump(tester, _profile(stateId: 999, cityId: 404));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Editar perfil'), findsOneWidget);
    expect(find.text('Estado'), findsOneWidget);
    expect(find.text('Cidade'), findsOneWidget);
  });
}
