import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/restaurant.dart';
import '../models/menu_item.dart';
import '../models/cart_item.dart';

// API Configuration - Use your computer's IP address for physical device testing
// To find your IP: Windows: ipconfig | grep IPv4 | Mac: ifconfig
// Example: 'http://192.168.1.100:5000/api'
String get apiBaseUrl {
  // ⚠️ IMPORTANT: Change 'localhost' to your computer's IP address when testing on physical phone!
  // Example: 'http://192.168.1.100:5000/api'
  // Or use localtunnel for public access: https://your-tunnel-url.loca.lt
  const String defaultApiUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://purple-aliens-build.loca.lt/api', // Public tunnel URL!
  );
  
  return defaultApiUrl;
}

class ApiService {
  // ===== RESTAURANTS ENDPOINTS =====
  
  static Future<List<Restaurant>> getRestaurants() async {
    try {
      // Use public endpoint to fetch approved restaurants
      final response = await http.get(Uri.parse('$apiBaseUrl/restaurants/public'));
      print('Restaurants API response status: ${response.statusCode}');
      print('Restaurants API response body: ${response.body}');
      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data.map((json) => Restaurant.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting restaurants: $e');
      return [];
    }
  }

  static Future<Restaurant?> getRestaurant(int id) async {
    try {
      final response = await http.get(Uri.parse('$apiBaseUrl/restaurants/public/$id'));
      if (response.statusCode == 200) {
        return Restaurant.fromJson(json.decode(response.body));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<bool> insertRestaurant({
    required String name,
    required String description,
    required String cuisineType,
    required String imageUrl,
    required double deliveryFee,
    required String address,
    required bool isOpen,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/restaurants'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'description': description,
          'cuisine_type': cuisineType,
          'image_url': imageUrl,
          'delivery_fee': deliveryFee,
          'address': address,
          'is_open': isOpen,
        }),
      );
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  // ===== MENU ITEMS ENDPOINTS =====

  static Future<List<MenuItem>> getAllMenuItems() async {
    try {
      final response = await http.get(Uri.parse('$apiBaseUrl/menu-items'));
      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data.map((json) => MenuItem.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<MenuItem>> getMenuItemsByRestaurant(int restaurantId) async {
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/menu-items/public/restaurant/$restaurantId'),
      );
      print('Menu API response status: ${response.statusCode}');
      print('Menu API response: ${response.body}');
      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data.map((json) => MenuItem.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting menu items: $e');
      return [];
    }
  }

  static Future<bool> insertMenuItem({
    required int restaurantId,
    required String name,
    required String description,
    required double price,
    required String imageUrl,
    required String category,
    required bool isAvailable,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/menu-items'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'restaurant_id': restaurantId,
          'name': name,
          'description': description,
          'price': price,
          'image_url': imageUrl,
          'category': category,
          'is_available': isAvailable,
        }),
      );
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> updateMenuItem({
    required int id,
    required int restaurantId,
    required String name,
    required String description,
    required double price,
    required String imageUrl,
    required String category,
    required bool isAvailable,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$apiBaseUrl/menu-items/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'restaurant_id': restaurantId,
          'name': name,
          'description': description,
          'price': price,
          'image_url': imageUrl,
          'category': category,
          'is_available': isAvailable,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> deleteMenuItem(int id) async {
    try {
      final response = await http.delete(Uri.parse('$apiBaseUrl/menu-items/$id'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ===== IMAGE UPLOAD =====

  static String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http')) return imagePath;
    // For localtunnel: use http instead of https for image uploads
    return 'http://purple-aliens-build.loca.lt$imagePath';
  }

  static Future<String?> uploadImage(File imageFile) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$apiBaseUrl/upload'),
      );
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'image',
          imageFile.path,
        ),
      );
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      print('Upload response status: ${response.statusCode}');
      print('Upload response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['url'] ?? data['imageUrl'] ?? data['filename'];
      }
      
      return null;
    } catch (e) {
      print('Upload error: $e');
      return null;
    }
  }
  
  // ===== ORDER ENDPOINTS =====
  
  static Future<bool> createOrder({
    required int userId,
    required List<CartItem> items,
    required double total,
    required double shippingFee,
    required String address,
  }) async {
    try {
      // Get restaurant ID from first item
      final restaurantId = items.isNotEmpty ? items.first.restaurant.id : 1;
      
      // Build order items
      final orderItems = items.map((item) => {
        'menu_item_id': item.menuItem.id,
        'quantity': item.quantity,
        'price': item.menuItem.price,
      }).toList();
      
      final response = await http.post(
        Uri.parse('$apiBaseUrl/orders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'restaurant_id': restaurantId,
          'address': address,
          'total': total,
          'delivery_fee': shippingFee,
          'items': orderItems,
        }),
      );
      
      print('Create order response status: ${response.statusCode}');
      print('Create order response body: ${response.body}');
      
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('Create order error: $e');
      return false;
    }
  }
}
