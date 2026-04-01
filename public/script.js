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
const namePattern = /^[A-Za-z ]+$/;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

let stocks = [];
let chart = null;

function setMessage(message, type = '') {
  messageElement.textContent = message;
  messageElement.className = `message ${type}`.trim();
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  refreshBtn.disabled = isLoading;
}

function validateForm() {
  const name = nameInput.value.trim();
  const sector = sectorInput.value;
  const price = Number(priceInput.value);
  const quantity = Number(quantityInput.value);

  if (!name) {
    return { error: 'Name is required.' };
  }

  if (!namePattern.test(name)) {
    return { error: 'Name must contain only letters and spaces.' };
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
}

function renderTable() {
  if (stocks.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No stocks found.</td></tr>';
    return;
  }

  tableBody.innerHTML = stocks
    .map(
      (stock) => `
        <tr>
          <td>${stock.id}</td>
          <td>${stock.name}</td>
          <td>${stock.sector}</td>
          <td>${currencyFormatter.format(Number(stock.price))}</td>
          <td>${stock.quantity}</td>
          <td>
            <div class="row-actions">
              <button
                type="button"
                class="btn-edit"
                data-action="edit"
                data-id="${stock.id}"
                data-name="${stock.name}"
                data-sector="${stock.sector}"
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
      `
    )
    .join('');
}

function renderChart() {
  const sectorCounts = {};

  stocks.forEach((stock) => {
    if (sectorCounts[stock.sector]) {
      sectorCounts[stock.sector] += 1;
    } else {
      sectorCounts[stock.sector] = 1;
    }
  });

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels: Object.keys(sectorCounts),
      datasets: [
        {
          data: Object.values(sectorCounts),
          backgroundColor: [
            '#0f766e',
            '#f59e0b',
            '#2563eb',
            '#ef4444',
            '#7c3aed',
            '#0ea5e9',
            '#84cc16',
            '#f97316',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

async function fetchStocks() {
  try {
    setLoading(true);
    setMessage('Loading stocks...');

    const response = await fetch('/stocks');
    stocks = await response.json();

    renderTable();
    renderChart();
    setMessage('Stocks loaded successfully.', 'success');
  } catch (error) {
    console.error(error);
    setMessage('Unable to fetch stocks.', 'error');
  } finally {
    setLoading(false);
  }
}

async function saveStock(event) {
  event.preventDefault();

  const stockId = idInput.value;
  const { error, stock } = validateForm();

  if (error) {
    setMessage(error, 'error');
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(stockId ? `/stocks/${stockId}` : '/stocks', {
      method: stockId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stock),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || 'Unable to save stock.');
    }

    setMessage(stockId ? 'Stock updated successfully.' : 'Stock added successfully.', 'success');
    resetForm();
    fetchStocks();
  } catch (error) {
    console.error(error);
    setMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function deleteStock(id) {
  const confirmed = window.confirm('Are you sure you want to delete this stock?');

  if (!confirmed) {
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(`/stocks/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Unable to delete stock.');
    }

    setMessage('Stock deleted successfully.', 'success');
    resetForm();
    fetchStocks();
  } catch (error) {
    console.error(error);
    setMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button');

  if (!button) {
    return;
  }

  if (button.dataset.action === 'edit') {
    fillForm({
      id: button.dataset.id,
      name: button.dataset.name,
      sector: button.dataset.sector,
      price: button.dataset.price,
      quantity: button.dataset.quantity,
    });
  }

  if (button.dataset.action === 'delete') {
    deleteStock(button.dataset.id);
  }
});

form.addEventListener('submit', saveStock);
cancelBtn.addEventListener('click', resetForm);
refreshBtn.addEventListener('click', fetchStocks);

fetchStocks();
