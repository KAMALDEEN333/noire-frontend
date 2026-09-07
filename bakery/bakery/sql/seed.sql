-- =========================================
-- CREATE DATABASE
-- =========================================
CREATE DATABASE IF NOT EXISTS bakery_system;
USE bakery_system;

-- =========================================
-- USERS TABLE
-- =========================================
DROP TABLE IF EXISTS users;

CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(150) UNIQUE NOT NULL,
phone VARCHAR(20) NOT NULL,
password VARCHAR(255) NOT NULL,
role ENUM('customer', 'admin') DEFAULT 'customer',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ADDRESSES TABLE
-- =========================================
DROP TABLE IF EXISTS addresses;

CREATE TABLE addresses (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
street VARCHAR(255) NOT NULL,
city VARCHAR(100) NOT NULL,
state VARCHAR(100),
postal_code VARCHAR(20),
country VARCHAR(100) DEFAULT 'Nigeria',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE

);

-- =========================================
-- PRODUCTS TABLE
-- =========================================
DROP TABLE IF EXISTS products;

CREATE TABLE products (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(150) NOT NULL,
description TEXT,
price DECIMAL(10,2) NOT NULL,
image_url VARCHAR(255),
category VARCHAR(100),
is_available BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- SERVICES TABLE (ADMIN ADDED)
-- =========================================
DROP TABLE IF EXISTS services;

CREATE TABLE services (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(150) NOT NULL,
description TEXT,
price DECIMAL(10,2),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ORDERS TABLE
-- =========================================
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
address_id INT,
total_price DECIMAL(10,2) DEFAULT 0.00,
status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
delivery_date DATE,
delivery_time TIME,
notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE SET NULL

);

-- =========================================
-- ORDER ITEMS TABLE
-- =========================================
DROP TABLE IF EXISTS order_items;

CREATE TABLE order_items (
id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT NOT NULL,
product_id INT NOT NULL,
quantity INT NOT NULL DEFAULT 1,
price DECIMAL(10,2) NOT NULL,

FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,

FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE

);

-- =========================================
-- BOOKINGS TABLE (LINKED TO USER)
-- =========================================
DROP TABLE IF EXISTS bookings;

CREATE TABLE bookings (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
event_date DATE NOT NULL,
event_time TIME,
location VARCHAR(255) NOT NULL,
guest_count INT,
special_requests TEXT,
contact_phone VARCHAR(20),
status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE

);

-- =========================================
-- BOOKING SERVICES (MULTIPLE SERVICES SUPPORT)
-- =========================================
DROP TABLE IF EXISTS booking_services;

CREATE TABLE booking_services (
id INT AUTO_INCREMENT PRIMARY KEY,
booking_id INT NOT NULL,
service_id INT NOT NULL,

FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE,

FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE

);

-- =========================================
-- PAYMENTS TABLE
-- =========================================
DROP TABLE IF EXISTS payments;

CREATE TABLE payments (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
order_id INT NULL,
booking_id INT NULL,
amount DECIMAL(10,2) NOT NULL,
payment_method ENUM('card', 'transfer', 'cash') NOT NULL,
payment_status ENUM('pending', 'successful', 'failed') DEFAULT 'pending',
transaction_ref VARCHAR(255),
paid_at TIMESTAMP NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,

FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE

);

-- =========================================
-- SEED DATA
-- =========================================

-- ADMIN USER
INSERT INTO users (name, email, phone, password, role)
VALUES ('Admin', 'admin@gmail.com', '08000000000', '12345678', 'admin');

-- SAMPLE USERS
INSERT INTO users (name, email, phone, password)
VALUES
('Musa Ahmad', 'user1@gmail.com', '08111111111', '12345678'),
('Elizabeth Audu', 'user2@gmail.com', '08222222222', '12345678');

-- ADDRESSES
INSERT INTO addresses (user_id, street, city, state)
VALUES
(2, '12 Garki Road', 'Abuja', 'FCT'),
(3, '45 Wuse Street', 'Abuja', 'FCT');

-- PRODUCTS
INSERT INTO products (name, description, price, category, image_url) VALUES
('Chocolate Cake', 'Delicious chocolate cake', 5000.00, 'Cake', 'uploads/image 3.jpeg'),
('Vanilla Cake', 'Soft vanilla cake', 4500.00, 'Cake', 'uploads/image 1.jpeg'),
('Bread Loaf', 'Fresh baked bread', 1500.00, 'Bread', 'uploads/image 2.jpeg'),
('Cupcakes (Box)', 'Box of 6 cupcakes', 3000.00, 'Pastry', 'uploads/image 4.jpeg'),
('Cupcakes Vanila', 'Vanila cupcakes', 4000.00, 'Pastry', 'uploads/image 5.jpeg');


-- SERVICES
INSERT INTO services (name, description, price) VALUES
('Birthday Cake Package', 'Custom cake + decoration', 20000.00),
('Wedding Cake Service', 'Multi-layer wedding cake', 100000.00),
('Corporate Catering', 'Snacks and pastries for events', 50000.00);

-- ORDERS
INSERT INTO orders (user_id, address_id, total_price, status, payment_status)
VALUES
(2, 1, 6500.00, 'pending', 'paid');


-- ORDER ITEMS
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
(1, 1, 1, 5000.00),
(1, 3, 1, 1500.00);

-- BOOKINGS
INSERT INTO bookings (user_id, event_date, location, guest_count, contact_phone)
VALUES
(3, '2026-05-10', 'Abuja Event Hall', 50, '08222222222');

-- LINK BOOKING TO SERVICE
INSERT INTO booking_services (booking_id, service_id)
VALUES
(1, 1);

-- PAYMENTS (EXAMPLE)
INSERT INTO payments (user_id, order_id, amount, payment_method, payment_status)
VALUES
(2, 1, 6500.00, 'transfer', 'successful');