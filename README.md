# Food Delivery System

A complete food delivery system similar to Uber Eats, DoorDash, and Foodpanda. This system includes:

- **Admin Panel** → React.js
- **Merchant Panel** → React.js
- **Customer App** → Flutter
- **Rider App** → Flutter
- **Backend API** → Node.js + Express
- **Database** → MySQL

## System Architecture

```
                        INTERNET
                            │
        ┌───────────────────────────────────┐
        │            BACKEND API             │
        │         Node.js + Express          │
        │                                     │
Admin React  ──►  REST API  ◄── Flutter Apps
Merchant React ─►  REST API  ◄── Rider App
        │                                     │
        └───────────────┬─────────────────────┘
                        │
                     MySQL
```

## Project Structure

```
food-delivery-system/
│
├── backend/                 # Node.js + Express API
│   ├── config/
│   │   └── db.js           # MySQL database connection
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── restaurants.js  # Restaurant management
│   │   ├── orders.js       # Order handling
│   │   └── riders.js       # Rider management
│   ├── server.js           # Main server entry
│   ├── database.sql        # Database schema
│   └── package.json
│
├── admin-panel/             # Admin Dashboard (React)
│
├── merchant-panel/         # Merchant Portal (React)
│
├── customer-app/            # Customer App (Flutter)
│
└── rider-app/              # Rider App (Flutter)
```

## Getting Started

### 1. Database Setup

```sql
-- Login to MySQL
mysql -u root -p

-- Run the database setup
SOURCE path/to/backend/database.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

The API will run on `http://localhost:5000`

### 3. Admin Panel Setup

```bash
cd admin-panel
npm install
npm start
```

### 4. Merchant Panel Setup

```bash
cd merchant-panel
npm install
npm start
```

### 5. Customer App (Flutter)

```bash
cd customer-app
flutter pub get
flutter run
```

### 6. Rider App (Flutter)

```bash
cd rider-app
flutter pub get
flutter run
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `GET /api/restaurants/:id/menu` - Get restaurant menu
- `POST /api/restaurants/create` - Create restaurant

### Orders
- `POST /api/orders/create` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Riders
- `GET /api/riders` - Get all riders
- `POST /api/riders/accept` - Accept delivery
- `PUT /api/riders/delivery/:id` - Update delivery status

## Order Flow

```
Customer places order
        │
Backend creates order
        │
Merchant receives order
        │
Merchant accepts order
        │
Order appears in Rider App
        │
Rider accepts delivery
        │
Rider picks food
        │
Rider delivers order
        │
Order marked delivered
```

## Real-time Updates

The backend uses Socket.io for real-time updates:
- Live order tracking
- Live rider location
- Instant notifications

## Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=food_delivery
JWT_SECRET=your-secret-key
```

## Tech Stack

| Layer           | Technology          |
|-----------------|--------------------|
| Frontend Admin  | React              |
| Frontend Merchant | React            |
| Customer App    | Flutter            |
| Rider App       | Flutter            |
| Backend         | Node.js            |
| API             | Express            |
| Database        | MySQL              |
| Auth            | JWT                |
| Real-time       | Socket.io          |

## License

See individual project folders for licensing information.
