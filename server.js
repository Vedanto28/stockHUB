const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_NAME_LENGTH = 255;
const MAX_INT32 = 2147483647;
const allowedSectorSet = new Set(db.ALLOWED_SECTORS);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePositivePrice(value) {
  const priceText =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';

  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) {
    return { error: 'Price must be a valid amount with up to 2 decimal places.' };
  }

  const price = Number(priceText);
  if (!Number.isFinite(price) || price <= 0) {
    return { error: 'Price must be greater than 0.' };
  }

  return { value: price };
}

function parseQuantity(value) {
  const quantityText =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';

  if (!/^(0|[1-9]\d*)$/.test(quantityText)) {
    return { error: 'Quantity must be a whole number 0 or greater.' };
  }

  const quantity = Number(quantityText);
  if (!Number.isSafeInteger(quantity) || quantity > MAX_INT32) {
    return { error: `Quantity must be less than or equal to ${MAX_INT32}.` };
  }

  return { value: quantity };
}

function parseStockId(value) {
  const stockId = Number(value);
  if (!Number.isSafeInteger(stockId) || stockId <= 0) {
    return { error: 'A valid stock id is required.' };
  }

  return { value: stockId };
}

function validateStockPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'A valid stock payload is required.' };
  }

  const name = normalizeText(body.name);
  const sector = normalizeText(body.sector);

  if (!name) {
    return { error: 'Stock name is required.' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Stock name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  if (!sector) {
    return { error: 'Sector is required.' };
  }

  if (!allowedSectorSet.has(sector)) {
    return { error: 'Please choose a valid sector.' };
  }

  const { error: priceError, value: price } = parsePositivePrice(body.price);
  if (priceError) {
    return { error: priceError };
  }

  const { error: quantityError, value: quantity } = parseQuantity(body.quantity);
  if (quantityError) {
    return { error: quantityError };
  }

  return {
    value: {
      name,
      sector,
      price,
      quantity,
    },
  };
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
    const { error: idError, value: stockId } = parseStockId(req.params.id);
    if (idError) {
      return res.status(400).json({ error: idError });
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
    const { error: idError, value: stockId } = parseStockId(req.params.id);
    if (idError) {
      return res.status(400).json({ error: idError });
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
