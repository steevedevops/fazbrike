import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';

class ItemGallery extends StatefulWidget {
  const ItemGallery({super.key, required this.item});
  final ItemModel item;
  @override
  State<ItemGallery> createState() => _ItemGalleryState();
}

class _ItemGalleryState extends State<ItemGallery> {
  int current = 0;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final images = item.images.toList()..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    final urls = images.isEmpty ? [item.imageUrl] : images.map((value) => value.url).toList();
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          itemCount: urls.length,
          onPageChanged: (index) => setState(() => current = index),
          itemBuilder: (_, index) => RemoteImage(url: urls[index]),
        ),
        // Escurece o topo para os botões da app bar ficarem legíveis em fotos claras.
        const IgnorePointer(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment(0, -.4),
                colors: [Colors.black38, Colors.transparent],
              ),
            ),
          ),
        ),
        if (urls.length > 1) ...[
          Positioned(
            left: 0,
            right: 0,
            bottom: 14,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var index = 0; index < urls.length && index < 8; index++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: index == current ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: index == current ? Colors.white : Colors.white60,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
              ],
            ),
          ),
          Positioned(
            right: 12,
            bottom: 10,
            child: DecoratedBox(
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.photo_camera_outlined, size: 14, color: Colors.white),
                  const SizedBox(width: 4),
                  Text('${current + 1}/${urls.length}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                ]),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
