import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/items/widgets/item_editor_form.dart';

class _FakeApi implements ApiServices {
  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async =>
      const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('os três tipos ocupam a mesma largura e a mesma altura', (tester) async {
    tester.view.physicalSize = const Size(1170, 2532);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(ProviderScope(
      overrides: [apiServicesProvider.overrideWithValue(_FakeApi())],
      child: const MaterialApp(home: Scaffold(body: ItemEditorForm())),
    ));
    await tester.pump();

    Size box(String title) => tester.getSize(find.ancestor(of: find.text(title), matching: find.byType(InkWell)).first);
    Offset origin(String title) => tester.getTopLeft(find.ancestor(of: find.text(title), matching: find.byType(InkWell)).first);

    final item = box('Item para venda');
    final vehicle = box('Veículo para venda');
    final property = box('Imóvel');

    expect(item.width, vehicle.width);
    expect(item.width, property.width);
    expect(item.height, vehicle.height);
    expect(item.height, property.height);
    expect(origin('Item para venda').dx, origin('Veículo para venda').dx);
    expect(origin('Veículo para venda').dx, origin('Imóvel').dx);
    expect(tester.takeException(), isNull);
  });
}
