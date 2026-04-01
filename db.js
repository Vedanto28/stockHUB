const { Pool } = require('pg');

const ALLOWED_SECTORS = Object.freeze([
  'Energy',
  'Materials',
  'Industrials',
  'Utilities',
  'Healthcare',
  'Financials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Information Technology',
  'Communication Services',
  'Real Estate',
  'Unspecified',
]);

const DEFAULT_SECTOR = 'Unspecified';
const allowedSectorsSql = ALLOWED_SECTORS
  .map((sector) => `'${sector.replace(/'/g, "''")}'`)
  .join(', ');

const pool = new Pool({
  user: 'postgres',
  password: 'root',
  host: 'localhost',
  port: 5432,
  database: 'stockMarket',
});

async function init() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sector VARCHAR(50) NOT NULL DEFAULT '${DEFAULT_SECTOR}',
        price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
        quantity INT NOT NULL CHECK (quantity >= 0)
      );
    `);

    await client.query(`
      ALTER TABLE stocks
      ADD COLUMN IF NOT EXISTS sector VARCHAR(50);
    `);

    await client.query(`
      ALTER TABLE stocks
      ALTER COLUMN name TYPE VARCHAR(255),
      ALTER COLUMN sector TYPE VARCHAR(50),
      ALTER COLUMN sector SET DEFAULT '${DEFAULT_SECTOR}';
    `);

    await client.query(`
      UPDATE stocks
      SET sector = '${DEFAULT_SECTOR}'
      WHERE sector IS NULL
        OR BTRIM(sector) = ''
        OR sector NOT IN (${allowedSectorsSql});
    `);

    await client.query(`
      ALTER TABLE stocks
      ALTER COLUMN sector SET NOT NULL;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'stocks_sector_allowed_check'
        ) THEN
          ALTER TABLE stocks
          ADD CONSTRAINT stocks_sector_allowed_check
          CHECK (sector IN (${allowedSectorsSql}));
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Connected to PostgreSQL');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = {
  ALLOWED_SECTORS,
  DEFAULT_SECTOR,
  init,
  pool,
  query,
};
