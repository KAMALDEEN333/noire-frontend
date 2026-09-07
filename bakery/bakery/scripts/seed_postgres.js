const db = require('../db');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing PostgreSQL database...');

    // USERS
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ADDRESSES
    await db.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        street VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Nigeria',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PRODUCTS
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        category VARCHAR(100),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SERVICES
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SEED PRODUCTS (if empty)
    const [existingProduct] = await db.query('SELECT id FROM products LIMIT 1');
    if (existingProduct.length === 0) {
      await db.query(
        'INSERT INTO products (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
        ['Chocolate Cake', 'Rich chocolate cake', 1500.00, 'cakes', '/images/chocolate_cake.jpg']
      );
      await db.query(
        'INSERT INTO products (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
        ['Bread Loaf', 'Freshly baked bread loaf', 400.00, 'bread', '/images/bread_loaf.jpg']
      );
      console.log('✅ Seeded default products');
    } else {
      console.log('✅ Products already seeded');
    }

    // SEED SERVICES (if empty)
    const [existingService] = await db.query('SELECT id FROM services LIMIT 1');
    if (existingService.length === 0) {
      await db.query(
        'INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
        ['Cake Decoration', 'Custom cake decoration service', 5000.00]
      );
      await db.query(
        'INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
        ['Event Catering', 'Full event catering service', 25000.00]
      );
      console.log('✅ Seeded default services');
    } else {
      console.log('✅ Services already seeded');
    }

    // ORDERS
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
        total_price NUMERIC(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ORDER ITEMS
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price NUMERIC(10,2) NOT NULL
      )
    `);

    // BOOKINGS
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_date DATE,
        location VARCHAR(255),
        guest_count INTEGER,
        contact_phone VARCHAR(30),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BOOKING SERVICES
    await db.query(`
      CREATE TABLE IF NOT EXISTS booking_services (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE SET NULL
      )
    `);

    // PAYMENTS
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        amount NUMERIC(10,2) NOT NULL,
        payment_method VARCHAR(100),
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // CREATE ADMIN USER
    const [adminUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@gmail.com']
    );

    if (adminUsers.length === 0) {
      await db.query(
        `INSERT INTO users
        (name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?)`,
        [
          'Admin',
          'admin@gmail.com',
          '08000000000',
          '12345678',
          'admin'
        ]
      );

      console.log('✅ Admin user created');
      console.log('Email: admin@gmail.com');
      console.log('Password: 12345678');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ Database initialization completed');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = initializeDatabase;
