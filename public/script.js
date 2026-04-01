const form = document.getElementById('stock-form');
const idInput = document.getElementById('stock-id');
const formTitle = document.getElementById('form-title');
const nameInput = document.getElementById('name');
const sectorInput = document.getElementById('sector');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const refreshBtn = document.getElementById('refresh-btn');
const messageElement = document.getElementById('message');
const tableBody = document.querySelector('#stocks-table tbody');
const chartCanvas = document.getElementById('sector-chart');
const MAX_NAME_LENGTH = 255;
const MAX_INT32 = 2147483647;
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
const allowedSectorSet = new Set(ALLOWED_SECTORS);

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

const state = {
  stocks: [],
  chart: null,
};

function setMessage(message, type = '') {
  messageElement.textContent = message;
  messageElement.className = `message${type ? ` ${type}` : ''}`;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;   
  refreshBtn.disabled = isLoading;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''; 
}

function parsePositivePrice(value) {
  const priceText = normalizeText(value);

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
  const quantityText = normalizeText(value);

  if (!/^(0|[1-9]\d*)$/.test(quantityText)) { 
    return { error: 'Quantity must be a whole number 0 or greater.' };
  }

  const quantity = Number(quantityText);
  if (!Number.isSafeInteger(quantity) || quantity > MAX_INT32) {
    return { error: `Quantity must be less than or equal to ${MAX_INT32}.` };
  }

  return { value: quantity };
}

function validateFormData(values) {
  const name = normalizeText(values.name);
  const sector = normalizeText(values.sector);

  if (!name) {
    return { error: 'Name is required.' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  if (!sector) {
    return { error: 'Please select a sector.' };
  }

  if (!allowedSectorSet.has(sector)) {
    return { error: 'Please choose a valid sector.' };
  }

  const { error: priceError, value: price } = parsePositivePrice(values.price);
  if (priceError) {
    return { error: priceError };
  }

  const { error: quantityError, value: quantity } = parseQuantity(values.quantity);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resetForm() {
  form.reset();
  idInput.value = '';
  formTitle.textContent = 'Add New Stock';
  submitBtn.textContent = 'Add Stock';
  cancelBtn.hidden = true;
}

function fillForm(stock) {
  idInput.value = stock.id;
  nameInput.value = stock.name;
  sectorInput.value = stock.sector;
  priceInput.value = stock.price;
  quantityInput.value = stock.quantity;
  formTitle.textContent = `Edit Stock #${stock.id}`;
  submitBtn.textContent = 'Update Stock';
  cancelBtn.hidden = false;
  nameInput.focus();
}

function renderTable(stocks) {
  if (!stocks.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No stocks found. Add your first stock record.</td></tr>';
    return;
  }

  tableBody.innerHTML = stocks
    .map((stock) => {
      const safeName = escapeHtml(stock.name);
      const safeSectorValue = escapeHtml(stock.sector || '');
      const safeSectorLabel = escapeHtml(stock.sector || 'Not set');
      return `
        <tr>
          <td>${stock.id}</td>
          <td>${safeName}</td>
          <td>${safeSectorLabel}</td>
          <td>${currencyFormatter.format(Number(stock.price))}</td>
          <td>${stock.quantity}</td>
          <td>
            <div class="row-actions">
              <button
                type="button"
                class="btn-edit"
                data-action="edit"
                data-id="${stock.id}"
                data-name="${safeName}"
                data-sector="${safeSectorValue}"
                data-price="${stock.price}"
                data-quantity="${stock.quantity}"
              >
                Edit
              </button>
              <button type="button" class="btn-delete" data-action="delete" data-id="${stock.id}">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderChart(stocks) {
  const sectorCounts = stocks.reduce((accumulator, stock) => {
    const key = stock.sector || 'Unspecified';
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const labels = Object.keys(sectorCounts);
  const values = Object.values(sectorCounts);

  if (state.chart) {
    state.chart.destroy();
  }

  if (!labels.length || typeof Chart === 'undefined') {
    state.chart = null;
    return;
  }

  state.chart = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#0f766e',
            '#f59e0b',
            '#2563eb',
            '#ef4444',
            '#7c3aed',
            '#0ea5e9',
            '#84cc16',
            '#f97316',
            '#14b8a6',
            '#8b5cf6',
            '#ec4899',
          ],
          borderColor: '#fffaf3',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
}

async function fetchStocks() {
  try {
    setLoading(true);
    setMessage('Loading stocks...');

    const response = await fetch('/stocks');
    if (!response.ok) {
      throw new Error('Unable to fetch stock records.');
    }

    state.stocks = await response.json();
    renderTable(state.stocks);
    renderChart(state.stocks);
    setMessage(`Loaded ${state.stocks.length} stock record${state.stocks.length === 1 ? '' : 's'}.`);
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Failed to fetch stocks.', 'error');
  } finally {
    setLoading(false);
  }
}

async function saveStock(event) {
  event.preventDefault();

  const stockId = idInput.value;
  const { error: validationError, value: payload } = validateFormData({
    name: nameInput.value,
    sector: sectorInput.value,
    price: priceInput.value,
    quantity: quantityInput.value,
  });

  try {
    if (validationError) {
      setMessage(validationError, 'error');
      return;
    }

    setLoading(true);

    const response = await fetch(stockId ? `/stocks/${stockId}` : '/stocks', {
      method: stockId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Unable to save the stock.');
    }

    setMessage(stockId ? 'Stock updated successfully.' : 'Stock added successfully.', 'success');
    resetForm();
    await fetchStocks();
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Operation failed.', 'error');
  } finally {
    setLoading(false);
  }
}

async function handleTableAction(event) {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === 'edit') {
    fillForm({
      id: button.dataset.id,
      name: button.dataset.name,
      sector: button.dataset.sector,
      price: button.dataset.price,
      quantity: button.dataset.quantity,
    });
    return;
  }

  if (action !== 'delete') {
    return;
  }

  const stockId = button.dataset.id;
  const isConfirmed = window.confirm('Are you sure you want to delete this stock?');
  if (!isConfirmed) {
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(`/stocks/${stockId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Unable to delete the stock.');
    }

    if (idInput.value === stockId) {
      resetForm();
    }

    setMessage('Stock deleted successfully.', 'success');
    await fetchStocks();
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Delete failed.', 'error');
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', saveStock);
cancelBtn.addEventListener('click', () => {
  resetForm();
  setMessage('Edit cancelled.');
});
refreshBtn.addEventListener('click', fetchStocks);
tableBody.addEventListener('click', handleTableAction);

fetchStocks();
