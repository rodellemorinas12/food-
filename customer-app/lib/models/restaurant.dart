class Restaurant {
  final int id;
  final String name;
  final String? description;
  final String? imageUrl;
  final String? bannerUrl;
  final String? cuisineType;
  final double? rating;
  final int? reviewCount;
  final String? deliveryTime;
  final double? deliveryFee;
  final String? address;
  final bool? isOpen;
  final String? openingHours;
  final double? minOrderAmount;

  Restaurant({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    this.bannerUrl,
    this.cuisineType,
    this.rating,
    this.reviewCount,
    this.deliveryTime,
    this.deliveryFee,
    this.address,
    this.isOpen,
    this.openingHours,
    this.minOrderAmount,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      imageUrl: json['image_url'] ?? json['logo'],
      bannerUrl: json['banner_url'],
      cuisineType: json['cuisine_type'],
      rating: json['rating'] != null ? double.parse(json['rating'].toString()) : null,
      reviewCount: json['review_count'],
      deliveryTime: json['delivery_time'],
      deliveryFee: json['delivery_fee'] != null ? double.parse(json['delivery_fee'].toString()) : null,
      address: json['address'],
      isOpen: json['is_open'] == 1 || json['is_open'] == true,
      openingHours: json['opening_hours'],
      minOrderAmount: json['min_order_amount'] != null ? double.parse(json['min_order_amount'].toString()) : null,
    );
  }
}
