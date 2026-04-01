const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'root',
  host: 'localhost',
  port: 5432,
  database: 'stockMarket',
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sector VARCHAR(50) NOT NULL,
      price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
      quantity INT NOT NULL CHECK (quantity >= 0)
    )
  `);

  console.log('Connected to PostgreSQL');
}

function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  init,
  query,
};
