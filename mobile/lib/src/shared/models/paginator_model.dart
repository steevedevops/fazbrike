class PaginatorModel<T> {
  const PaginatorModel({required this.results, this.page = 1, this.hasNext = false});

  final List<T> results;
  final int page;
  final bool hasNext;

  PaginatorModel<T> copyWith({List<T>? results, int? page, bool? hasNext}) {
    return PaginatorModel<T>(
      results: results ?? this.results,
      page: page ?? this.page,
      hasNext: hasNext ?? this.hasNext,
    );
  }
}
