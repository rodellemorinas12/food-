import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  int? _userId;
  String? _userName;
  String? _userEmail;
  String? _userPhone;
  String? _userRole;

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  int? get userId => _userId;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get userPhone => _userPhone;
  String? get userRole => _userRole;

  AuthProvider() {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final savedUserId = prefs.getInt('user_id');
      final savedUserName = prefs.getString('user_name');
      final savedUserEmail = prefs.getString('user_email');
      final savedUserPhone = prefs.getString('user_phone');
      final savedUserRole = prefs.getString('user_role');

      if (token != null && savedUserId != null) {
        _isLoggedIn = true;
        _userId = savedUserId;
        _userName = savedUserName;
        _userEmail = savedUserEmail;
        _userPhone = savedUserPhone;
        _userRole = savedUserRole;
      }
    } catch (e) {
      _isLoggedIn = false;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> login({
    required int userId,
    required String userName,
    required String userEmail,
    String? userPhone,
    String? userRole,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('user_id', userId);
    await prefs.setString('user_name', userName);
    await prefs.setString('user_email', userEmail);
    if (userPhone != null) {
      await prefs.setString('user_phone', userPhone);
    }
    if (userRole != null) {
      await prefs.setString('user_role', userRole);
    }
    await prefs.setString('auth_token', 'logged_in');

    _userId = userId;
    _userName = userName;
    _userEmail = userEmail;
    _userPhone = userPhone;
    _userRole = userRole;
    _isLoggedIn = true;
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_name');
    await prefs.remove('user_email');
    await prefs.remove('user_phone');
    await prefs.remove('user_role');

    _userId = null;
    _userName = null;
    _userEmail = null;
    _userPhone = null;
    _userRole = null;
    _isLoggedIn = false;
    notifyListeners();
  }

  Future<void> updateProfile({
    String? userName,
    String? userEmail,
    String? userPhone,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (userName != null) {
      _userName = userName;
      await prefs.setString('user_name', userName);
    }
    if (userEmail != null) {
      _userEmail = userEmail;
      await prefs.setString('user_email', userEmail);
    }
    if (userPhone != null) {
      _userPhone = userPhone;
      await prefs.setString('user_phone', userPhone);
    }
    
    notifyListeners();
  }
}
