const db = require('../db');

async function seed() {
  try {
    // Create users table if not exists (Postgres syntax)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', ['admin@gmail.com']);
    if (rows.length === 0) {
      await db.query(
        'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        ['Admin', 'admin@gmail.com', '08000000000', '12345678', 'admin']
      );
      console.log('Admin user created: admin@gmail.com / 12345678');
    } else {
      console.log('Admin user already exists');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
