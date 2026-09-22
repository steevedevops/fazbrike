import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';

class ItemGallery extends StatelessWidget {
  const ItemGallery({super.key, required this.item});
  final ItemModel item;
  @override
  Widget build(BuildContext context) {
    final images = item.images.toList()..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    final urls = images.isEmpty ? [item.imageUrl] : images.map((value) => value.url).toList();
    return AspectRatio(
      aspectRatio: 4 / 3,
      child: PageView.builder(
        itemCount: urls.length,
        itemBuilder: (_, index) => Stack(
          fit: StackFit.expand,
          children: [
            RemoteImage(url: urls[index], fallbackAsset: categoryAsset(item.category)),
            if (urls.length > 1)
              Positioned(
                right: 12,
                bottom: 12,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    child: Text('${index + 1}/${urls.length}', style: const TextStyle(color: Colors.white)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
