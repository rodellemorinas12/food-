# Database Setup Guide

## Prerequisites
- Node.js (v14+)
- MySQL Server running locally or on a network
- npm or yarn

## Step 1: Install MySQL

### Windows:
1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
2. Run the installer and follow the setup wizard
3. Create a user (default: `root`) and password
4. Start MySQL Service

### Mac:
```bash
brew install mysql
brew services start mysql
```

### Linux:
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

## Step 2: Create Database

Once MySQL is running, create the database:

```bash
mysql -u root -p
# Enter your password

# In the MySQL prompt:
CREATE DATABASE react_admin_db;
EXIT;
```

## Step 3: Configure Backend (.env file)

Edit `server/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=react_admin_db
PORT=5000
```

## Step 4: Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## Step 5: Start the Backend Server

```bash
cd server
npm start
```

You should see:
```
✓ Database tables initialized successfully
✓ Server running on http://localhost:5000
✓ API Base: http://localhost:5000/api
```

## Step 6: Start React App (in a NEW terminal)

```bash
npm start
```

The app will run on http://localhost:3000

## API Endpoints

All endpoints are at `http://localhost:5000/api/`

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:id` - Update a team
- `DELETE /api/teams/:id` - Delete a team

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create a new contact
- `PUT /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create a new invoice
- `PUT /api/invoices/:id` - Update an invoice
- `DELETE /api/invoices/:id` - Delete an invoice

### Calendar Events
- `GET /api/calendar` - Get all calendar events
- `POST /api/calendar` - Create a new calendar event

### Chart Data
- `GET /api/chart-data` - Get chart data
- `GET /api/chart-data?type=bar` - Get specific chart type

### Geography
- `GET /api/geography` - Get geography data
- `POST /api/geography` - Create geography data

## Testing with cURL

```bash
# Get teams
curl http://localhost:5000/api/teams

# Create a new team
curl -X POST http://localhost:5000/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "phone": "(555)123-4567",
    "access": "admin"
  }'
```

## Troubleshooting

**Error: "Cannot find module 'mysql2'"**
- Run `cd server && npm install` again

**Error: "ER_ACCESS_DENIED_FOR_USER"**
- Check your MySQL username/password in `.env`
- Ensure MySQL is running

**Error: "ER_BAD_DB_ERROR"**
- Ensure you created the database: `CREATE DATABASE react_admin_db;`

**React showing blank data**
- Check that the backend server is running on port 5000
- Open DevTools (F12) → Network tab to see API calls
- Check browser console for errors
