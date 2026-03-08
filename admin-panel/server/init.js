const pool = require('./db');

async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    // Create teams table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(20),
        access VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table with all profile fields
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        age INT,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address1 VARCHAR(255),
        address2 VARCHAR(255),
        city VARCHAR(100),
        zip_code VARCHAR(20),
        registrarId INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        cost INT,
        date VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create calendar_events table (updated with all fields)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        start DATETIME NOT NULL,
        end DATETIME,
        event_type VARCHAR(50) DEFAULT 'general',
        description TEXT,
        color VARCHAR(20) DEFAULT '#1976d2',
        all_day BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Add missing columns if they don't exist (for existing tables)
    // Using a safer approach that works with older MySQL versions
    try {
      const [columns] = await connection.query(`SHOW COLUMNS FROM calendar_events LIKE 'event_type'`);
      if (columns.length === 0) {
        await connection.query(`ALTER TABLE calendar_events ADD COLUMN event_type VARCHAR(50) DEFAULT 'general' AFTER \`end\``);
        console.log('Added event_type column to calendar_events');
      }
    } catch (err) {
      console.error('Error adding event_type column:', err.message);
    }
    
    try {
      const [columns] = await connection.query(`SHOW COLUMNS FROM calendar_events LIKE 'description'`);
      if (columns.length === 0) {
        await connection.query(`ALTER TABLE calendar_events ADD COLUMN description TEXT AFTER event_type`);
        console.log('Added description column to calendar_events');
      }
    } catch (err) {
      console.error('Error adding description column:', err.message);
    }
    
    try {
      const [columns] = await connection.query(`SHOW COLUMNS FROM calendar_events LIKE 'color'`);
      if (columns.length === 0) {
        await connection.query(`ALTER TABLE calendar_events ADD COLUMN color VARCHAR(20) DEFAULT '#1976d2' AFTER description`);
        console.log('Added color column to calendar_events');
      }
    } catch (err) {
      console.error('Error adding color column:', err.message);
    }
    
    try {
      const [columns] = await connection.query(`SHOW COLUMNS FROM calendar_events LIKE 'all_day'`);
      if (columns.length === 0) {
        await connection.query(`ALTER TABLE calendar_events ADD COLUMN all_day BOOLEAN DEFAULT FALSE AFTER color`);
        console.log('Added all_day column to calendar_events');
      }
    } catch (err) {
      console.error('Error adding all_day column:', err.message);
    }

    // Create chart_data table (for bar, line, pie charts)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chart_data (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(50) NOT NULL,
        month VARCHAR(20),
        revenue INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create geography_data table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS geography_data (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        value INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create dashboard stats table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dashboard_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        emails_sent INT DEFAULT 0,
        sales_obtained INT DEFAULT 0,
        new_clients INT DEFAULT 0,
        traffic_received INT DEFAULT 0,
        revenue_generated DECIMAL(10,2) DEFAULT 0,
        emails_increase VARCHAR(10) DEFAULT '+0%',
        sales_increase VARCHAR(10) DEFAULT '+0%',
        clients_increase VARCHAR(10) DEFAULT '+0%',
        traffic_increase VARCHAR(10) DEFAULT '+0%',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create customers table for food delivery system
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(255),
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create riders table for food delivery system
    await connection.query(`
      CREATE TABLE IF NOT EXISTS riders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        vehicle_type VARCHAR(50),
        status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
        rating DECIMAL(3,2) DEFAULT 0,
        total_deliveries INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table for food delivery system
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT NOT NULL,
        rider_id INT,
        food_items JSON NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        delivery_address VARCHAR(255) NOT NULL,
        status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (rider_id) REFERENCES riders(id)
      )
    `);

    console.log('✓ Database tables initialized successfully');

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        txId VARCHAR(100) UNIQUE NOT NULL,
        user VARCHAR(100) NOT NULL,
        date VARCHAR(100),
        cost INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    connection.release();
  }
}

module.exports = { initializeDatabase };
