import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../models/restaurant.dart';
import '../widgets/responsive_layout.dart';

class AdminPanel extends StatefulWidget {
  final int? ownerRestaurantId;

  const AdminPanel({super.key, this.ownerRestaurantId});

  @override
  State<AdminPanel> createState() => _AdminPanelState();
}

class _AdminPanelState extends State<AdminPanel> {
  int _selectedTab = 0; // Default to Restaurants tab
  late final int? _ownerRestaurantId;

  @override
  void initState() {
    super.initState();
    _ownerRestaurantId = widget.ownerRestaurantId;
    // Pre-fill the restaurant ID if owner is logged in
    if (_ownerRestaurantId != null) {
      _restaurantIdController.text = _ownerRestaurantId.toString();
    }
  }
  
  // Restaurant registration form
  final _restaurantFormKey = GlobalKey<FormState>();
  final TextEditingController _restaurantNameController = TextEditingController();
  final TextEditingController _restaurantDescriptionController = TextEditingController();
  final TextEditingController _restaurantAddressController = TextEditingController();
  final TextEditingController _restaurantCuisineController = TextEditingController();
  
  // File selection
  File? _selectedLogoFile;
  String _logoFileName = '';
  
  // Menu item form
  final _menuFormKey = GlobalKey<FormState>();
  final TextEditingController _menuNameController = TextEditingController();
  final TextEditingController _menuDescriptionController = TextEditingController();
  final TextEditingController _menuPriceController = TextEditingController();
  final TextEditingController _menuCategoryController = TextEditingController();
  final TextEditingController _restaurantIdController = TextEditingController();
  
  // File selection
  File? _selectedFoodFile;
  String _foodFileName = '';
  
  String _statusMessage = '';
  bool _isLoading = false;

  // Menu categories
  final List<String> menuCategories = [
    'Meals',
    'Drinks',
    'Snacks',
    'Desserts',
    'Breakfast',
    'Lunch',
    'Dinner',
  ];

  // Restaurant categories
  final List<String> restaurantCategories = [
    'Filipino',
    'Chinese',
    'Fast Food',
    'Pizza',
    'Burgers',
    'Seafood',
    'Vegetarian',
    'Bakery',
  ];

  Future<void> _pickLogo() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );

    if (result != null) {
      setState(() {
        _selectedLogoFile = File(result.files.single.path!);
        _logoFileName = result.files.single.name;
      });
    }
  }

  Future<void> _pickFoodImage() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );

    if (result != null) {
      setState(() {
        _selectedFoodFile = File(result.files.single.path!);
        _foodFileName = result.files.single.name;
      });
    }
  }

  Future<void> _registerRestaurant() async {
    if (!_restaurantFormKey.currentState!.validate()) return;
    if (_selectedLogoFile == null) {
      setState(() => _statusMessage = 'Please select a logo image');
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    // Upload logo and get URL
    final logoUrl = await ApiService.uploadImage(_selectedLogoFile!);
    if (logoUrl == null) {
      setState(() {
        _isLoading = false;
        _statusMessage = '✗ Failed to upload logo. Please try again.';
      });
      return;
    }

    // Register restaurant with logo URL
    final success = await ApiService.insertRestaurant(
      name: _restaurantNameController.text,
      description: _restaurantDescriptionController.text,
      cuisineType: _restaurantCuisineController.text,
      imageUrl: logoUrl,
      deliveryFee: 30.00,
      address: _restaurantAddressController.text,
      isOpen: true,
    );

    setState(() {
      _isLoading = false;
      if (success) {
        _statusMessage = '✓ Restaurant registered successfully!';
      } else {
        _statusMessage = '✗ Failed to register restaurant. Please try again.';
      }
    });

    _clearRestaurantForm();
  }

  Future<void> _insertMenu() async {
    if (!_menuFormKey.currentState!.validate()) return;
    if (_selectedFoodFile == null) {
      setState(() => _statusMessage = 'Please select a food image');
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    // Upload food image and get URL
    final foodImageUrl = await ApiService.uploadImage(_selectedFoodFile!);
    if (foodImageUrl == null) {
      setState(() {
        _isLoading = false;
        _statusMessage = '✗ Failed to upload image. Please try again.';
      });
      return;
    }

    final restaurantId = int.parse(_restaurantIdController.text);
    
    final success = await ApiService.insertMenuItem(
      restaurantId: restaurantId,
      name: _menuNameController.text,
      description: _menuDescriptionController.text,
      price: double.parse(_menuPriceController.text),
      imageUrl: foodImageUrl,
      category: _menuCategoryController.text,
      isAvailable: true,
    );

    setState(() {
      _isLoading = false;
      if (success) {
        _statusMessage = '✓ Menu item added successfully!';
      } else {
        _statusMessage = '✗ Failed to add menu item. Please try again.';
      }
    });

    _clearMenuForm();
  }

  void _clearRestaurantForm() {
    _restaurantNameController.clear();
    _restaurantDescriptionController.clear();
    _restaurantAddressController.clear();
    _restaurantCuisineController.clear();
    setState(() {
      _selectedLogoFile = null;
      _logoFileName = '';
    });
  }

  void _clearMenuForm() {
    _menuNameController.clear();
    _menuDescriptionController.clear();
    _menuPriceController.clear();
    _menuCategoryController.clear();
    setState(() {
      _selectedFoodFile = null;
      _foodFileName = '';
    });
  }

  Future<List<Restaurant>> _fetchRestaurants() async {
    return await ApiService.getRestaurants();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Panel - Riders Local'),
        backgroundColor: const Color(0xFFE53935),
      ),
      body: ResponsiveLayout(
        child: Column(
          children: [
            TabSelector(
              selectedTab: _selectedTab,
              onTabSelected: (index) => setState(() => _selectedTab = index),
            ),
            Expanded(
              child: _selectedTab == 0
                  ? _buildRestaurantRegistration()
                  : _buildMenuInsertion(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRestaurantRegistration() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _restaurantFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE53935).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Register Your Restaurant',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Add your restaurant to Riders Local in Teresa Rizal',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Logo Upload
            GestureDetector(
              onTap: _pickLogo,
              child: Container(
                width: double.infinity,
                height: 150,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.grey.shade100,
                ),
                child: _selectedLogoFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          _selectedLogoFile!,
                          fit: BoxFit.cover,
                        ),
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text(
                            'Tap to upload logo',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
              ),
            ),
            if (_logoFileName.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '✓ $_logoFileName',
                  style: const TextStyle(color: Colors.green, fontSize: 12),
                ),
              ),
            const SizedBox(height: 16),
            
            // Restaurant Name
            TextFormField(
              controller: _restaurantNameController,
              decoration: const InputDecoration(
                labelText: 'Restaurant Name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.restaurant),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            // Description
            TextFormField(
              controller: _restaurantDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description),
              ),
              maxLines: 3,
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            // Cuisine Type
            DropdownButtonFormField<String>(
              initialValue: _restaurantCuisineController.text.isEmpty ? null : _restaurantCuisineController.text,
              decoration: const InputDecoration(
                labelText: 'Cuisine Type',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.restaurant_menu),
              ),
              items: restaurantCategories.map((cuisine) {
                return DropdownMenuItem(
                  value: cuisine,
                  child: Text(cuisine),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _restaurantCuisineController.text = value ?? '';
                });
              },
            ),
            const SizedBox(height: 16),
            
            // Address
            TextFormField(
              controller: _restaurantAddressController,
              decoration: const InputDecoration(
                labelText: 'Address',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_on),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 24),
            
            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _registerRestaurant,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Register Restaurant',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            
            _buildStatusMessage(),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuInsertion() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _menuFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE53935).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add Menu Item',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Add food items to your restaurant menu',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Restaurant ID
            TextFormField(
              controller: _restaurantIdController,
              decoration: const InputDecoration(
                labelText: 'Restaurant ID',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.numbers),
                hintText: 'Enter the registered restaurant ID',
              ),
              keyboardType: TextInputType.number,
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            // Food Image Upload
            GestureDetector(
              onTap: _pickFoodImage,
              child: Container(
                width: double.infinity,
                height: 150,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.grey.shade100,
                ),
                child: _selectedFoodFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          _selectedFoodFile!,
                          fit: BoxFit.cover,
                        ),
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text(
                            'Tap to upload food image',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
              ),
            ),
            if (_foodFileName.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '✓ $_foodFileName',
                  style: const TextStyle(color: Colors.green, fontSize: 12),
                ),
              ),
            const SizedBox(height: 16),
            
            // Food Name
            TextFormField(
              controller: _menuNameController,
              decoration: const InputDecoration(
                labelText: 'Food Name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.fastfood),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            // Description
            TextFormField(
              controller: _menuDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description),
              ),
              maxLines: 3,
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            // Price
            TextFormField(
              controller: _menuPriceController,
              decoration: const InputDecoration(
                labelText: 'Price (₱)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.attach_money),
              ),
              keyboardType: TextInputType.number,
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            // Category
            DropdownButtonFormField<String>(
              initialValue: _menuCategoryController.text.isEmpty ? null : _menuCategoryController.text,
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.category),
              ),
              items: menuCategories.map((category) {
                return DropdownMenuItem(
                  value: category,
                  child: Text(category),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _menuCategoryController.text = value ?? '';
                });
              },
            ),
            const SizedBox(height: 24),
            
            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _insertMenu,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Add Menu Item',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            
            _buildStatusMessage(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusMessage() {
    if (_statusMessage.isEmpty) return const SizedBox.shrink();
    
    final isSuccess = _statusMessage.startsWith('✓');
    
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isSuccess ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSuccess ? Colors.green : Colors.red,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isSuccess ? Icons.check_circle : Icons.error,
            color: isSuccess ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _statusMessage,
              style: TextStyle(
                color: isSuccess ? Colors.green.shade700 : Colors.red.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class TabSelector extends StatelessWidget {
  final int selectedTab;
  final Function(int) onTabSelected;

  const TabSelector({
    super.key, 
    required this.selectedTab, 
    required this.onTabSelected
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => onTabSelected(0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: selectedTab == 0 ? const Color(0xFFE53935) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Restaurants',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: selectedTab == 0 ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => onTabSelected(1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: selectedTab == 1 ? const Color(0xFFE53935) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Menu Items',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: selectedTab == 1 ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
