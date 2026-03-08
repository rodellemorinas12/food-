class MenuItem {
  final int id;
  final int restaurantId;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final String? category;
  final bool? isAvailable;
  final int? preparationTime;
  final double? rating;
  final int? reviewCount;
  final String? restaurantName;

  MenuItem({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    this.category,
    this.isAvailable,
    this.preparationTime,
    this.rating,
    this.reviewCount,
    this.restaurantName,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] ?? 0,
      restaurantId: json['restaurant_id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      price: json['price'] != null ? double.parse(json['price'].toString()) : 0.0,
      imageUrl: json['image_url'] ?? json['image'],
      category: json['category'],
      isAvailable: json['is_available'] == 1 || json['is_available'] == true,
      preparationTime: json['preparation_time'],
      rating: json['rating'] != null ? double.parse(json['rating'].toString()) : null,
      reviewCount: json['review_count'],
      restaurantName: json['restaurant_name'],
    );
  }
}
