const { Pool } = require('pg');
require('dotenv').config();

// Debug: show password type/length without revealing the value
const rawPassword = process.env.POSTGRES_PASSWORD;
console.log('DB password type:', typeof rawPassword, 'length:', rawPassword ? String(rawPassword).length : 0);

// Ensure password is always a string (pg expects a string for SCRAM auth)
const coercedPassword = rawPassword == null ? '' : String(rawPassword);

// Create Postgres pool using env vars
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: coercedPassword,
  database: process.env.POSTGRES_DB || 'bakery_system'
});

pool.on('error', (err) => {
  console.error('Postgres pool error', err);
});

// Replace mysql-style ? placeholders with $1, $2, ...
function replacePlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function query(sql, params = []) {
  const trimmed = sql.trim();
  const isSelect = /^SELECT/i.test(trimmed);
  const isInsert = /^INSERT/i.test(trimmed);
  const isUpdate = /^UPDATE/i.test(trimmed);
  const isDelete = /^DELETE/i.test(trimmed);

  let finalSql = sql;

  // Add RETURNING id for INSERTs if not present so we can emulate insertId
  if (isInsert && !/RETURNING\s+/i.test(sql)) {
    finalSql = sql + ' RETURNING id';
  }

  finalSql = replacePlaceholders(finalSql);

  const res = await pool.query(finalSql, params);

  if (isSelect) {
    return [res.rows, null];
  }

  if (isInsert) {
    const insertId = res.rows && res.rows[0] ? res.rows[0].id : null;
    return [{ insertId, rowCount: res.rowCount }, null];
  }

  if (isUpdate || isDelete) {
    return [{ affectedRows: res.rowCount }, null];
  }

  return [res.rows, null];
}

// Test connection
const testConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Postgres Connected Successfully');
  } catch (error) {
    console.error('❌ Postgres Connection Failed:', error);
  }
};

testConnection();

module.exports = { query, pool };