import 'package:flutter/foundation.dart';
import '../models/cart_item.dart';
import '../models/menu_item.dart';
import '../models/restaurant.dart';

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  double _shippingFee = 50.0; // Default shipping fee

  List<CartItem> get items => _items;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalPrice => _items.fold(0.0, (sum, item) => sum + item.total);

  double get totalWithShipping => totalPrice + _shippingFee;

  double get shippingFee => _shippingFee;

  void setShippingFee(double fee) {
    _shippingFee = fee;
    notifyListeners();
  }

  void addItem(MenuItem menuItem, Restaurant restaurant) {
    final existingIndex = _items.indexWhere((item) => item.menuItem.id == menuItem.id);
    if (existingIndex != -1) {
      _items[existingIndex].quantity++;
    } else {
      _items.add(CartItem(menuItem: menuItem, restaurant: restaurant));
    }
    notifyListeners();
  }

  void removeItem(int menuItemId) {
    _items.removeWhere((item) => item.menuItem.id == menuItemId);
    notifyListeners();
  }

  void updateQuantity(int menuItemId, int quantity) {
    final item = _items.firstWhere((item) => item.menuItem.id == menuItemId);
    if (quantity <= 0) {
      removeItem(menuItemId);
    } else {
      item.quantity = quantity;
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
