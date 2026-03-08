# Riders Local - Food Delivery App

## Production Deployment Guide

### Java Version Warning Fix

If you see warnings about obsolete Java source/target version 8:
1. Ensure JDK 17 is installed
2. Set JAVA_HOME environment variable:
   ```bash
   set JAVA_HOME=C:\Program Files\Java\jdk-17
   ```
3. The gradle.properties already points to JDK 17

### API Server Setup

The app requires a PHP backend with MySQL database. The API files are in `food_delivery_api/`.

1. **Database Setup**: Import the SQL schema:
   ```bash
   mysql -u root -p < food_delivery_api/database.sql
   ```

2. **Upload Directory**: Create and set permissions:
   ```bash
   mkdir -p food_delivery_api/uploads
   chmod 755 food_delivery_api/uploads
   ```

3. **API Endpoints**:
   - `POST /api/upload` - Upload images
   - `GET /api/restaurants` - Get all restaurants
   - `POST /api/restaurants` - Register new restaurant
   - `GET /api/menu-items` - Get all menu items
   - `GET /api/menu-items/restaurant/{id}` - Get menu by restaurant
   - `POST /api/menu-items` - Add new menu item

### Image Upload

The admin panel supports **file upload** for:
- Restaurant logos
- Food images

No more URL inputs - users can select images from their device.

### Building for Production

#### Android APK
```bash
# Debug build (development)
flutter build apk --debug

# Release build (production)
flutter build apk --release
```

#### Android App Bundle (Recommended for Play Store)
```bash
flutter build appbundle --release
```

#### iOS
```bash
flutter build ios --release
```

### Setting Custom API URL

To set a custom API URL during build:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://your-api-domain.com/api
```

### Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify image upload functionality
- [ ] Test cart functionality
- [ ] Test restaurant and menu loading
- [ ] Verify admin panel operations
- [ ] Test on multiple devices

### Recommended Services

1. **API Hosting**: AWS, Google Cloud, or DigitalOcean
2. **Database**: MySQL or PostgreSQL
3. **SSL Certificate**: Required for HTTPS

### Version History

- **v1.0.0**: Initial production release
  - Removed demo mode
  - Added file upload for images
  - Added configurable API URL
  - Fixed Java 17 compatibility
