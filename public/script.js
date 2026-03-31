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
const searchInput = document.getElementById('search-input');
const sectorFilterInput = document.getElementById('sector-filter');
const sortSelect = document.getElementById('sort-select');
const messageElement = document.getElementById('message');
const tableBody = document.querySelector('#stocks-table tbody');
const chartCanvas = document.getElementById('sector-chart');

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

function validateFormData(payload) {
  if (!payload.name) {
    return 'Name is required.';
  }

  if (!payload.sector) {
    return 'Please select a sector.';
  }

  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    return 'Price must be greater than 0.';
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity < 0) {
    return 'Quantity must be 0 or greater.';
  }

  return '';
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

function getVisibleStocks() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedSector = sectorFilterInput.value;
  const selectedSort = sortSelect.value;

  const filteredStocks = state.stocks.filter((stock) => {
    const matchesSearch = String(stock.name || '').toLowerCase().includes(searchTerm);
    const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const sortedStocks = [...filteredStocks];

  if (selectedSort === 'price-asc') {
    sortedStocks.sort((left, right) => Number(left.price) - Number(right.price));
  } else if (selectedSort === 'price-desc') {
    sortedStocks.sort((left, right) => Number(right.price) - Number(left.price));
  } else if (selectedSort === 'quantity-asc') {
    sortedStocks.sort((left, right) => left.quantity - right.quantity);
  } else if (selectedSort === 'quantity-desc') {
    sortedStocks.sort((left, right) => right.quantity - left.quantity);
  }

  return sortedStocks;
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
    const key = stock.sector || 'Unknown';
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

function renderDashboard() {
  const visibleStocks = getVisibleStocks();
  renderTable(visibleStocks);
  renderChart(visibleStocks);
  setMessage(`Showing ${visibleStocks.length} stock record${visibleStocks.length === 1 ? '' : 's'}.`);
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
    renderDashboard();
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
  const payload = {
    name: nameInput.value.trim(),
    sector: sectorInput.value,
    price: Number.parseFloat(priceInput.value),
    quantity: Number.parseInt(quantityInput.value, 10),
  };
  const validationError = validateFormData(payload);

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
searchInput.addEventListener('input', renderDashboard);
sectorFilterInput.addEventListener('change', renderDashboard);
sortSelect.addEventListener('change', renderDashboard);
tableBody.addEventListener('click', handleTableAction);

fetchStocks();
