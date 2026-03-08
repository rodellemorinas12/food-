import 'menu_item.dart';
import 'restaurant.dart';

class CartItem {
  final MenuItem menuItem;
  final Restaurant restaurant;
  int quantity;

  CartItem({
    required this.menuItem,
    required this.restaurant,
    this.quantity = 1,
  });

  double get total => menuItem.price * quantity;
}
