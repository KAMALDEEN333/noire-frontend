const { Pool } = require('pg');
require('dotenv').config();

// Debug: show password type/length without revealing the value
const rawPassword = process.env.POSTGRES_PASSWORD;
console.log('DB password type:', typeof rawPassword, 'length:', rawPassword ? String(rawPassword).length : 0);

// Ensure password is always a string (pg expects a string for SCRAM auth)
const coercedPassword = rawPassword == null ? '' : String(rawPassword);

// Create Postgres pool using env vars. Only set `password` when non-empty.
const poolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  database: process.env.POSTGRES_DB || 'bakery_system'
};

if (coercedPassword && coercedPassword.length > 0) {
  poolConfig.password = coercedPassword;
}

const pool = new Pool(poolConfig);

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
async function init() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Postgres Connected Successfully');
  } catch (error) {
    console.error('❌ Postgres Connection Failed:', error);

    // Helpful hint for the common SCRAM error when password is invalid
    if (error && /client password must be a string/i.test(String(error.message))) {
      console.error('🔧 Hint: check your POSTGRES_PASSWORD env var — it must be a non-empty string.');
    }
    throw error;
  }
}

// Provide a MySQL-style connection wrapper for routes that expect
// `getConnection()` with transactional methods and `query()` that
// returns mysql-ish shaped results (e.g. insertId, affectedRows).
async function getConnection() {
  const client = await pool.connect();

  return {
    query: async (sql, params = []) => {
      const trimmed = sql.trim();
      const isSelect = /^SELECT/i.test(trimmed);
      const isInsert = /^INSERT/i.test(trimmed);
      const isUpdate = /^UPDATE/i.test(trimmed);
      const isDelete = /^DELETE/i.test(trimmed);

      let finalSql = sql;

      if (isInsert && !/RETURNING\s+/i.test(sql)) {
        finalSql = sql + ' RETURNING id';
      }

      finalSql = replacePlaceholders(finalSql);

      const res = await client.query(finalSql, params);

      if (isSelect) {
        return [res.rows];
      }

      if (isInsert) {
        const insertId = res.rows && res.rows[0] ? res.rows[0].id : null;
        return [{ insertId, rowCount: res.rowCount }];
      }

      if (isUpdate || isDelete) {
        return [{ affectedRows: res.rowCount }];
      }

      return [res.rows];
    },

    beginTransaction: async () => await client.query('BEGIN'),
    commit: async () => await client.query('COMMIT'),
    rollback: async () => await client.query('ROLLBACK'),
    release: () => client.release()
  };
}

module.exports = { query, pool, init, getConnection };