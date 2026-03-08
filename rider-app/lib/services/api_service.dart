import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://purple-aliens-build.loca.lt/api'; // Public tunnel URL!
  // Use 'http://10.0.2.2:5000/api' for Android emulator
  // Use 'http://localhost:5000/api' for iOS simulator
  // Use actual IP for physical device on same network
  
  static String? token;
  static int? userId;
  
  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
    userId = prefs.getInt('userId');
    return token != null;
  }
  
  // Login
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      token = data['token'];
      userId = data['user']['id'];
      
      // Save to preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token!);
      await prefs.setInt('userId', userId!);
      
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['message']);
    }
  }
  
  // Logout
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userId');
    token = null;
    userId = null;
  }
  
  // Get available orders
  static Future<List<dynamic>> getAvailableOrders() async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders/rider/available'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load orders');
    }
  }
  
  // Get my orders
  static Future<List<dynamic>> getMyOrders() async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders/rider/my-orders?rider_id=$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load orders');
    }
  }
  
  // Accept order
  static Future<void> acceptOrder(int orderId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/riders/accept'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'order_id': orderId,
        'rider_id': userId,
      }),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to accept order');
    }
  }
  
  // Update delivery status
  static Future<void> updateDeliveryStatus(int orderId, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/riders/delivery/$orderId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'status': status}),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to update status');
    }
  }
  
  // Update location
  static Future<void> updateLocation(double lat, double lng) async {
    final response = await http.put(
      Uri.parse('$baseUrl/riders/$userId/location'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'latitude': lat,
        'longitude': lng,
      }),
    );
    
    // Location update can fail silently
  }
}
