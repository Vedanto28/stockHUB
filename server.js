const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const namePattern = /^[A-Za-z ]+$/;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateStock(data) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const sector = typeof data.sector === 'string' ? data.sector.trim() : '';
  const price = Number(data.price);
  const quantity = Number(data.quantity);

  if (!name) {
    return { error: 'Stock name is required.' };
  }

  if (!namePattern.test(name)) {
    return { error: 'Stock name must contain only letters and spaces.' };
  }

  if (!sector) {
    return { error: 'Sector is required.' };
  }

  if (isNaN(price) || price <= 0) {
    return { error: 'Price must be greater than 0.' };
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: 'Quantity must be 0 or greater.' };
  }

  return {
    stock: {
      name,
      sector,
      price,
      quantity,
    },
  };
}

app.get('/stocks', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, sector, price, quantity FROM stocks');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/stocks', async (req, res) => {
  const { error, stock } = validateStock(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await db.query(
      'INSERT INTO stocks (name, sector, price, quantity) VALUES ($1, $2, $3, $4) RETURNING id, name, sector, price, quantity',
      [stock.name, stock.sector, stock.price, stock.quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (dbError) {
    console.error(dbError);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.put('/stocks/:id', async (req, res) => {
  const stockId = Number(req.params.id);
  const { error, stock } = validateStock(req.body);

  if (!Number.isInteger(stockId) || stockId <= 0) {
    return res.status(400).json({ error: 'Invalid stock id.' });
  }

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await db.query(
      'UPDATE stocks SET name = $1, sector = $2, price = $3, quantity = $4 WHERE id = $5 RETURNING id, name, sector, price, quantity',
      [stock.name, stock.sector, stock.price, stock.quantity, stockId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    res.json(result.rows[0]);
  } catch (dbError) {
    console.error(dbError);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete('/stocks/:id', async (req, res) => {
  const stockId = Number(req.params.id);

  if (!Number.isInteger(stockId) || stockId <= 0) {
    return res.status(400).json({ error: 'Invalid stock id.' });
  }

  try {
    const result = await db.query('DELETE FROM stocks WHERE id = $1', [stockId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    res.status(204).send();
  } catch (dbError) {
    console.error(dbError);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

async function startServer() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

startServer();
