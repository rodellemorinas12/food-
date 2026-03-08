# Teresa Food Delivery System - Complete Setup Guide

## System Overview

This is a complete food delivery system with 4 main components:

1. **Admin Panel** - For platform owner (Teresa) to manage everything
2. **Customer App** - For customers to order food (Flutter)
3. **Merchant Dashboard** - For restaurants to manage orders and menu
4. **Rider App** - For delivery riders to receive and complete orders (Flutter)

---

## Database Setup

### Step 1: Update MySQL Database

Run the SQL files in this order:

```bash
# 1. First, create the main database and tables
mysql -u root -p < server/food_delivery_schema.sql

# 2. Add rider_id column to orders table
mysql -u root -p food_delivery_db < server/add_rider_to_orders.sql
```

---

## Backend Server Setup

### Step 2: Start the Backend Server

```bash
cd react-admin-dashboard-master/server
npm install
npm start
```

The API will run at: `http://localhost:5000/api`

---

## Component Setup

### 1. ADMIN PANEL (Already Complete)

**Location:** `react-admin-dashboard-master`

**Features:**
- Dashboard with stats
- Manage restaurants
- Manage riders
- Manage orders
- Assign riders to orders
- View transactions/sales

**To Run:**
```bash
cd react-admin-dashboard-master
npm install
npm start
```
Access at: `http://localhost:3000`

---

### 2. CUSTOMER APP (Flutter)

**Location:** `food_delivery_app` (already exists)

**Features:**
- User registration/login
- Browse restaurants
- Browse menu items
- Add to cart
- Checkout (COD payment)
- View order history
- Track order status

**To Run:**
```bash
cd food_delivery_app
flutter pub get
flutter run
```

---

### 3. RIDER APP (New - Flutter)

**Location:** `food_delivery_app_rider` (newly created)

**Features:**
- Rider login
- View assigned deliveries
- Accept/decline deliveries
- Update delivery status (Picked Up, Delivered)
- View delivery history
- View earnings/stats
- Toggle availability status (Available/Busy/Offline)

**To Run:**
```bash
cd food_delivery_app_rider
flutter pub get
flutter run
```

**Note:** Update the API URL in `lib/services/api_service.dart` to point to your server:
- For emulator: `http://10.0.2.2:5000/api`
- For physical device: `http://YOUR_IP:5000/api`

---

### 4. MERCHANT DASHBOARD

**Location:** `react-admin-dashboard-master/src/scenes/merchant/`

**Features:**
- View incoming orders
- Accept/Decline orders
- Update order status (Preparing, Ready)
- Manage menu items (Add, Edit, Delete)
- View restaurant stats

**To Use:**
1. The merchant component is already created at `/src/scenes/merchant/index.jsx`
2. Add a link to it from the sidebar in `/src/scenes/global/Sidebar.jsx`

**Adding to Sidebar:**
```jsx
// In Sidebar.jsx, add this to the menuItems array:
{
  title: "Merchant",
  path: "/merchant",
  icon: <RestaurantIcon />
}
```

---

## Order Status Flow

```
Customer Places Order
        ↓
     Pending
        ↓
  Merchant Accepts
        ↓
   Preparing
        ↓
 Ready for Pickup
        ↓
 Rider Picks Up
        ↓
Out for Delivery
        ↓
    Delivered
        ↓
    Completed
```

---

## API Endpoints Added

### Rider Endpoints
- `POST /api/riders/login` - Rider login
- `GET /api/riders/:id/deliveries` - Get assigned deliveries
- `GET /api/riders/:id/history` - Get delivery history
- `GET /api/riders/:id/stats` - Get rider stats
- `PUT /api/riders/:id/status` - Update rider status
- `PUT /api/riders/:id/accept/:orderId` - Accept delivery
- `PUT /api/orders/:id/picked-up` - Mark order picked up
- `PUT /api/orders/:id/delivered` - Mark order delivered
- `GET /api/deliveries/available` - Get available deliveries

### Merchant Endpoints
- `POST /api/merchants/login` - Merchant login
- `GET /api/merchants/:id/orders` - Get restaurant orders
- `GET /api/merchants/:id/menu` - Get restaurant menu
- `PUT /api/merchants/:id/status` - Update restaurant status
- `GET /api/merchants/:id/stats` - Get restaurant stats

---

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full control - manage everything |
| **Merchant** | Own restaurant orders and menu |
| **Rider** | Assigned deliveries only |
| **Customer** | Order food, view history |

---

## Quick Start Commands

### Start Backend
```bash
cd react-admin-dashboard-master/server
npm start
```

### Start Admin Panel
```bash
cd react-admin-dashboard-master
npm start
```

### Start Customer App
```bash
cd food_delivery_app
flutter run
```

### Start Rider App
```bash
cd food_delivery_app_rider
flutter run
```

---

## Sample Data

The database comes with sample data:
- 3 Restaurants (Tapsilugan Grill House, Local Bites, Teresa Food Center)
- Sample menu items
- Sample users
- Sample orders

---

## Production Checklist

1. ✅ Database schema complete
2. ✅ Backend API complete
3. ✅ Admin Panel complete
4. ✅ Customer App complete
5. ✅ Rider App created
6. ✅ Merchant Dashboard created
7. ⚠️ Update API URLs for production
8. ⚠️ Add SSL/HTTPS
9. ⚠️ Set up push notifications (Firebase)
10. ⚠️ Add online payments (PayMongo/Stripe)
