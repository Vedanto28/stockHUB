const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateStockPayload(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const sector = typeof body.sector === 'string' ? body.sector.trim() : '';
  const price = Number(body.price);
  const quantity = Number.parseInt(body.quantity, 10);

  if (!name) {
    return { error: 'Stock name is required.' };
  }

  if (!sector) {
    return { error: 'Sector is required.' };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { error: 'Price must be greater than 0.' };
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: 'Quantity must be a valid non-negative integer.' };
  }

  return { value: { name, sector, price, quantity } };
}

app.post('/stocks', async (req, res, next) => {
  try {
    const { error, value } = validateStockPayload(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const result = await db.query(
      'INSERT INTO stocks (name, sector, price, quantity) VALUES ($1, $2, $3, $4) RETURNING id, name, sector, price, quantity',
      [value.name, value.sector, value.price, value.quantity]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get('/stocks', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, sector, price, quantity FROM stocks ORDER BY id ASC'
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.put('/stocks/:id', async (req, res, next) => {
  try {
    const stockId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(stockId) || stockId <= 0) {
      return res.status(400).json({ error: 'A valid stock id is required.' });
    }

    const { error, value } = validateStockPayload(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const result = await db.query(
      `UPDATE stocks
       SET name = $1, sector = $2, price = $3, quantity = $4
       WHERE id = $5
       RETURNING id, name, sector, price, quantity`,
      [value.name, value.sector, value.price, value.quantity, stockId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.delete('/stocks/:id', async (req, res, next) => {
  try {
    const stockId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(stockId) || stockId <= 0) {
      return res.status(400).json({ error: 'A valid stock id is required.' });
    }

    const result = await db.query('DELETE FROM stocks WHERE id = $1', [stockId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error.' });
});

async function startServer() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the application:', error);
    process.exit(1);
  }
}

startServer();
