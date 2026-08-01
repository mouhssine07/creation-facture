'use strict';

const STORAGE_KEY = 'yes-link-invoice-v1';
const VAT_RATE = 0.20;

const elements = {
  itemsBody: document.getElementById('itemsBody'),
  rowTemplate: document.getElementById('itemRowTemplate'),
  invoiceNumber: document.getElementById('invoiceNumber'),
  invoiceDate: document.getElementById('invoiceDate'),
  clientName: document.getElementById('clientName'),
  clientIce: document.getElementById('clientIce'),
  totalHt: document.getElementById('totalHt'),
  totalTva: document.getElementById('totalTva'),
  totalTtc: document.getElementById('totalTtc'),
  amountWords: document.getElementById('amountWords'),
  addRowBtn: document.getElementById('addRowBtn'),
  newInvoiceBtn: document.getElementById('newInvoiceBtn'),
  printBtn: document.getElementById('printBtn')
};

const defaultItems = [
  { reference: '', name: 'Cable', quantity: 1, price: 7 },
  { reference: '', name: 'Boitier', quantity: 1, price: 60 },
  { reference: '', name: 'Ventilateur', quantity: 1, price: 80 },
  { reference: '', name: 'Suport', quantity: 1, price: 65 },
  { reference: '', name: 'Conecteur', quantity: 1, price: 6 },
  { reference: '', name: 'Sak a dos', quantity: 1, price: 140 }
];

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0) + ' DH';
}

function safeNumber(value) {
  const number = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function addItemRow(item = {}) {
  const fragment = elements.rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector('tr');
  row.querySelector('.item-ref').value = item.reference ?? '';
  row.querySelector('.item-name').value = item.name ?? '';
  row.querySelector('.item-qty').value = item.quantity ?? 1;
  row.querySelector('.item-price').value = item.price ?? 0;

  row.addEventListener('input', updateInvoice);
  row.querySelector('.delete-row').addEventListener('click', () => {
    row.remove();
    if (!elements.itemsBody.children.length) addItemRow();
    updateInvoice();
  });

  elements.itemsBody.appendChild(fragment);
}

function getRowsData() {
  return [...elements.itemsBody.querySelectorAll('tr')].map(row => ({
    reference: row.querySelector('.item-ref').value.trim(),
    name: row.querySelector('.item-name').value.trim(),
    quantity: safeNumber(row.querySelector('.item-qty').value),
    price: safeNumber(row.querySelector('.item-price').value)
  }));
}

function updateInvoice() {
  let totalHt = 0;
  [...elements.itemsBody.querySelectorAll('tr')].forEach(row => {
    const quantity = safeNumber(row.querySelector('.item-qty').value);
    const price = safeNumber(row.querySelector('.item-price').value);
    const lineTotal = quantity * price;
    totalHt += lineTotal;
    row.querySelector('.item-total').textContent = formatMoney(lineTotal);
  });

  const totalTva = Math.round(totalHt * VAT_RATE * 100) / 100;
  const totalTtc = Math.round((totalHt + totalTva) * 100) / 100;

  elements.totalHt.textContent = formatMoney(totalHt);
  elements.totalTva.textContent = formatMoney(totalTva);
  elements.totalTtc.textContent = formatMoney(totalTtc);
  elements.amountWords.textContent = amountToFrenchWords(totalTtc).toUpperCase();

  saveInvoice();
}

function saveInvoice() {
  const data = {
    invoiceNumber: elements.invoiceNumber.value,
    invoiceDate: elements.invoiceDate.value,
    clientName: elements.clientName.value,
    clientIce: elements.clientIce.value,
    items: getRowsData()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadInvoice() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

  elements.itemsBody.innerHTML = '';
  if (data) {
    elements.invoiceNumber.value = data.invoiceNumber ?? '';
    elements.invoiceDate.value = data.invoiceDate || todayIso();
    elements.clientName.value = data.clientName ?? '';
    elements.clientIce.value = data.clientIce ?? '';
    (Array.isArray(data.items) && data.items.length ? data.items : defaultItems).forEach(addItemRow);
  } else {
    elements.invoiceDate.value = todayIso();
    defaultItems.forEach(addItemRow);
  }
  updateInvoice();
}

function resetInvoice() {
  const confirmed = window.confirm('Créer une nouvelle facture et effacer les données actuelles ?');
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  elements.invoiceNumber.value = '';
  elements.invoiceDate.value = todayIso();
  elements.clientName.value = '';
  elements.clientIce.value = '';
  elements.itemsBody.innerHTML = '';
  addItemRow();
  updateInvoice();
  elements.invoiceNumber.focus();
}

function underHundred(n) {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];

  if (n <= 16) return units[n];
  if (n < 20) return 'dix-' + units[n - 10];

  if (n < 70) {
    const tensWords = { 20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante', 60: 'soixante' };
    const tens = Math.floor(n / 10) * 10;
    const unit = n % 10;
    if (unit === 0) return tensWords[tens];
    if (unit === 1) return tensWords[tens] + ' et un';
    return tensWords[tens] + '-' + units[unit];
  }

  if (n < 80) {
    if (n === 71) return 'soixante et onze';
    return 'soixante-' + underHundred(n - 60);
  }

  if (n === 80) return 'quatre-vingts';
  return 'quatre-vingt-' + underHundred(n - 80);
}

function underThousand(n) {
  if (n < 100) return underHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let result = hundreds === 1 ? 'cent' : underHundred(hundreds) + ' cent';
  if (rest === 0 && hundreds > 1) result += 's';
  if (rest > 0) result += ' ' + underHundred(rest);
  return result;
}

function integerToFrench(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'zéro';

  const parts = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;

  if (millions) {
    parts.push(millions === 1 ? 'un million' : underThousand(millions) + ' millions');
  }
  if (thousands) {
    parts.push(thousands === 1 ? 'mille' : underThousand(thousands) + ' mille');
  }
  if (rest) parts.push(underThousand(rest));

  return parts.join(' ');
}

function amountToFrenchWords(amount) {
  const rounded = Math.round((Number(amount) + Number.EPSILON) * 100);
  const dirhams = Math.floor(rounded / 100);
  const centimes = rounded % 100;
  const dirhamLabel = dirhams === 1 ? 'dirham' : 'dirhams';
  let text = `${integerToFrench(dirhams)} ${dirhamLabel}`;
  if (centimes > 0) {
    const centimeLabel = centimes === 1 ? 'centime' : 'centimes';
    text += ` et ${integerToFrench(centimes)} ${centimeLabel}`;
  }
  return text + ' TTC';
}

elements.addRowBtn.addEventListener('click', () => {
  addItemRow();
  updateInvoice();
  const lastName = elements.itemsBody.lastElementChild?.querySelector('.item-name');
  lastName?.focus();
});

elements.newInvoiceBtn.addEventListener('click', resetInvoice);
elements.printBtn.addEventListener('click', () => window.print());
[elements.invoiceNumber, elements.invoiceDate, elements.clientName, elements.clientIce]
  .forEach(input => input.addEventListener('input', saveInvoice));

window.addEventListener('DOMContentLoaded', loadInvoice);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
