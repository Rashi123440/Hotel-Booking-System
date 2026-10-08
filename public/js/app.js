/**
 * The Grand Mirage Palace Hotel
 * Full-Length Luxury Hotel Website Controller
 * Configured with Indian Rupees (INR / ₹) as the native primary currency.
 */

// Currency conversion rates relative to INR (Indian Rupee base)
const CURRENCY_RATES = {
  INR: { symbol: '₹', rate: 1.0, locale: 'en-IN' },
  USD: { symbol: '$', rate: 0.012, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.011, locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.0094, locale: 'en-GB' }
};

// Application State
const state = {
  viewMode: 'grid', // 'grid' | 'table'
  theme: localStorage.getItem('hotel_theme') || 'dark',
  currency: 'INR', // Native Rupee primary currency

  // Room filters
  roomSearch: '',
  roomStatus: 'all',
  roomSort: 'room_number',
  roomOrder: 'ASC',

  // Booking search
  bookingSearch: '',
  bookingStatus: 'all',

  // Active dates for availability search
  searchCheckIn: '',
  searchCheckOut: '',
  searchRoomType: 'all',
  searchGuests: '',
  isAvailabilityFiltered: false,

  // Selected Room for Booking Modal
  selectedRoom: null,

  // Cache
  cachedRooms: [],
  cachedBookings: []
};

// DOM References
const elements = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  liveClockDisplay: document.getElementById('liveClockDisplay'),
  liveTickerText: document.getElementById('liveTickerText'),
  currencySelect: document.getElementById('currencySelect'),

  // Navigation Links
  navLinks: document.querySelectorAll('.site-navbar .nav-link'),

  // KPI Elements
  statTotalRooms: document.getElementById('statTotalRooms'),
  statAvailableRooms: document.getElementById('statAvailableRooms'),
  statOccupancyRate: document.getElementById('statOccupancyRate'),
  statActiveBookings: document.getElementById('statActiveBookings'),
  statTotalRevenue: document.getElementById('statTotalRevenue'),

  // Availability Search Bar
  searchAvailabilityForm: document.getElementById('searchAvailabilityForm'),
  searchCheckIn: document.getElementById('searchCheckIn'),
  searchCheckOut: document.getElementById('searchCheckOut'),
  searchRoomType: document.getElementById('searchRoomType'),
  searchGuests: document.getElementById('searchGuests'),
  btnResetSearch: document.getElementById('btnResetSearch'),

  // Room Toolbar & Views
  filterRoomSearch: document.getElementById('filterRoomSearch'),
  filterRoomStatus: document.getElementById('filterRoomStatus'),
  filterRoomSort: document.getElementById('filterRoomSort'),
  btnRefreshRooms: document.getElementById('btnRefreshRooms'),
  viewGridBtn: document.getElementById('viewGridBtn'),
  viewTableBtn: document.getElementById('viewTableBtn'),
  roomsGrid: document.getElementById('roomsGrid'),
  roomsTableWrap: document.getElementById('roomsTableWrap'),
  roomsTableBody: document.getElementById('roomsTableBody'),

  // Bookings Section
  filterBookingSearch: document.getElementById('filterBookingSearch'),
  filterBookingStatus: document.getElementById('filterBookingStatus'),
  btnRefreshBookings: document.getElementById('btnRefreshBookings'),
  bookingsTableBody: document.getElementById('bookingsTableBody'),

  // Action Buttons
  btnOpenAddRoomModal: document.getElementById('btnOpenAddRoomModal'),

  // Booking Modal
  bookingModal: document.getElementById('bookingModal'),
  bookingForm: document.getElementById('bookingForm'),
  closeBookingModalBtn: document.getElementById('closeBookingModalBtn'),
  cancelBookingModalBtn: document.getElementById('cancelBookingModalBtn'),
  bookRoomId: document.getElementById('bookRoomId'),
  bookRoomNumberDisplay: document.getElementById('bookRoomNumberDisplay'),
  bookRoomTypeDisplay: document.getElementById('bookRoomTypeDisplay'),
  bookRoomRateDisplay: document.getElementById('bookRoomRateDisplay'),
  bookCheckIn: document.getElementById('bookCheckIn'),
  bookCheckOut: document.getElementById('bookCheckOut'),
  bookGuestName: document.getElementById('bookGuestName'),
  bookGuestEmail: document.getElementById('bookGuestEmail'),
  bookGuestPhone: document.getElementById('bookGuestPhone'),
  bookSpecialRequests: document.getElementById('bookSpecialRequests'),
  bookNightsCalc: document.getElementById('bookNightsCalc'),
  bookTotalPriceDisplay: document.getElementById('bookTotalPriceDisplay'),

  // Voucher Modal
  voucherModal: document.getElementById('voucherModal'),
  closeVoucherModalBtn: document.getElementById('closeVoucherModalBtn'),
  closeVoucherBtn2: document.getElementById('closeVoucherBtn2'),
  printVoucherBtn: document.getElementById('printVoucherBtn'),
  vouchRef: document.getElementById('vouchRef'),
  vouchGuestName: document.getElementById('vouchGuestName'),
  vouchRoom: document.getElementById('vouchRoom'),
  vouchCheckIn: document.getElementById('vouchCheckIn'),
  vouchCheckOut: document.getElementById('vouchCheckOut'),
  vouchContact: document.getElementById('vouchContact'),
  vouchTotal: document.getElementById('vouchTotal'),

  // Room Modal (Add/Edit)
  roomModal: document.getElementById('roomModal'),
  roomModalTitle: document.getElementById('roomModalTitle'),
  roomForm: document.getElementById('roomForm'),
  closeRoomModalBtn: document.getElementById('closeRoomModalBtn'),
  cancelRoomModalBtn: document.getElementById('cancelRoomModalBtn'),
  formRoomId: document.getElementById('formRoomId'),
  formRoomNumber: document.getElementById('formRoomNumber'),
  formRoomType: document.getElementById('formRoomType'),
  formRoomPrice: document.getElementById('formRoomPrice'),
  formRoomCapacity: document.getElementById('formRoomCapacity'),
  formRoomFloor: document.getElementById('formRoomFloor'),
  formRoomStatus: document.getElementById('formRoomStatus'),
  formRoomAmenities: document.getElementById('formRoomAmenities'),
  formRoomDescription: document.getElementById('formRoomDescription'),

  // Confirm Modal
  confirmModal: document.getElementById('confirmModal'),
  confirmModalTitle: document.getElementById('confirmModalTitle'),
  confirmModalMessage: document.getElementById('confirmModalMessage'),
  closeConfirmModalBtn: document.getElementById('closeConfirmModalBtn'),
  cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
  executeConfirmBtn: document.getElementById('executeConfirmBtn'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer')
};

let confirmActionCallback = null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLiveClock();
  setupDefaultDates();
  bindEvents();
  initScrollSpy();
  loadAllData();
  startLiveTickerCycles();

  // Set default currency in dropdown
  if (elements.currencySelect) {
    elements.currencySelect.value = state.currency;
  }

  // Background auto-sync every 30 seconds
  setInterval(() => {
    loadStats();
    if (!state.isAvailabilityFiltered) {
      loadRooms(false);
    }
  }, 30000);
});

function initTheme() {
  elements.html.setAttribute('data-theme', state.theme);
  elements.themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('hotel_theme', state.theme);
  elements.html.setAttribute('data-theme', state.theme);
  elements.themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

function initLiveClock() {
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.liveClockDisplay.textContent = `${timeStr} IST`;
  }
  updateTime();
  setInterval(updateTime, 1000);
}

function startLiveTickerCycles() {
  const tickerItems = [
    '✨ Welcome to The Grand Mirage Palace • 5-Star Waterfront Luxury with Best Rate Guarantee in ₹ (INR).',
    '🛎️ 24/7 Butler & Clefs d’Or Concierge Desk available at Ext. 0 or +91 (22) 4720-6300.',
    '🍷 Sunset High Tea & Artisan Hors d’oeuvres served daily at Le Mirador Lounge (5:30 PM).',
    '🌊 Lagoon Infinity Pool & Ayurvedic Thermal Spa open daily from 6:00 AM to 10:00 PM.',
    '🛡️ Guaranteed Double-Booking Lock: Overlapping dates are automatically protected across all suites.'
  ];
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % tickerItems.length;
    elements.liveTickerText.style.opacity = '0';
    setTimeout(() => {
      elements.liveTickerText.textContent = tickerItems[idx];
      elements.liveTickerText.style.opacity = '1';
    }, 400);
  }, 8000);
}

function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], div[id="availability"]');
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    elements.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

function formatPrice(inrAmount) {
  const num = parseFloat(inrAmount) || 0;
  const info = CURRENCY_RATES[state.currency] || CURRENCY_RATES.INR;
  const converted = num * info.rate;

  const formattedNum = converted.toLocaleString(info.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return `${info.symbol}${formattedNum}`;
}

function setupDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const checkout = new Date(today);
  checkout.setDate(today.getDate() + 3);

  const checkInVal = tomorrow.toISOString().split('T')[0];
  const checkOutVal = checkout.toISOString().split('T')[0];

  elements.searchCheckIn.value = checkInVal;
  elements.searchCheckOut.value = checkOutVal;
  elements.searchCheckIn.min = today.toISOString().split('T')[0];
  elements.searchCheckOut.min = checkInVal;
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : '👑';
  toast.innerHTML = `
    <span>${icon}</span>
    <span style="flex: 1;">${escapeHtml(message)}</span>
    <button style="background:none; border:none; color:inherit; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ==========================================
// EVENT HANDLERS
// ==========================================
function bindEvents() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Currency Switcher
  elements.currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    renderRoomsGrid(state.cachedRooms);
    renderRoomsTable(state.cachedRooms);
    renderBookingsTable(state.cachedBookings);
    loadStats();
    showToast(`Currency updated to ${state.currency} (${CURRENCY_RATES[state.currency].symbol})`, 'info');
  });

  // Add Room Button
  if (elements.btnOpenAddRoomModal) {
    elements.btnOpenAddRoomModal.addEventListener('click', () => openRoomModal());
  }

  // View Mode (Grid vs Table)
  elements.viewGridBtn.addEventListener('click', () => {
    state.viewMode = 'grid';
    elements.viewGridBtn.classList.add('active-mode');
    elements.viewTableBtn.classList.remove('active-mode');
    elements.roomsGrid.style.display = 'grid';
    elements.roomsTableWrap.style.display = 'none';
  });

  elements.viewTableBtn.addEventListener('click', () => {
    state.viewMode = 'table';
    elements.viewTableBtn.classList.add('active-mode');
    elements.viewGridBtn.classList.remove('active-mode');
    elements.roomsGrid.style.display = 'none';
    elements.roomsTableWrap.style.display = 'block';
  });

  // Room Filters
  let roomSearchTimer;
  elements.filterRoomSearch.addEventListener('input', (e) => {
    clearTimeout(roomSearchTimer);
    roomSearchTimer = setTimeout(() => {
      state.roomSearch = e.target.value.trim();
      loadRooms();
    }, 250);
  });

  elements.filterRoomStatus.addEventListener('change', (e) => {
    state.roomStatus = e.target.value;
    loadRooms();
  });

  elements.filterRoomSort.addEventListener('change', (e) => {
    const [sort, order] = e.target.value.split('-');
    state.roomSort = sort;
    state.roomOrder = order;
    loadRooms();
  });

  elements.btnRefreshRooms.addEventListener('click', () => {
    state.isAvailabilityFiltered = false;
    loadRooms();
    loadStats();
    showToast('Real-time suite inventory refreshed', 'info');
  });

  // Availability Date Search
  elements.searchAvailabilityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performAvailabilitySearch();
  });

  elements.btnResetSearch.addEventListener('click', () => {
    elements.searchAvailabilityForm.reset();
    setupDefaultDates();
    state.isAvailabilityFiltered = false;
    loadRooms();
    showToast('Filters reset. Showing all Palace suites.', 'info');
  });

  // Bookings Filters
  let bookingSearchTimer;
  elements.filterBookingSearch.addEventListener('input', (e) => {
    clearTimeout(bookingSearchTimer);
    bookingSearchTimer = setTimeout(() => {
      state.bookingSearch = e.target.value.trim();
      loadBookings();
    }, 250);
  });

  elements.filterBookingStatus.addEventListener('change', (e) => {
    state.bookingStatus = e.target.value;
    loadBookings();
  });

  elements.btnRefreshBookings.addEventListener('click', () => {
    loadBookings();
    loadStats();
    showToast('Reservations synchronized', 'info');
  });

  // Booking Modal
  elements.closeBookingModalBtn.addEventListener('click', closeBookingModal);
  elements.cancelBookingModalBtn.addEventListener('click', closeBookingModal);
  elements.bookCheckIn.addEventListener('change', recalculateBookingPrice);
  elements.bookCheckOut.addEventListener('change', recalculateBookingPrice);
  elements.bookingForm.addEventListener('submit', handleBookingSubmit);

  // Voucher Modal
  elements.closeVoucherModalBtn.addEventListener('click', closeVoucherModal);
  elements.closeVoucherBtn2.addEventListener('click', closeVoucherModal);
  elements.printVoucherBtn.addEventListener('click', () => window.print());

  // Room Modal (Add/Edit)
  elements.closeRoomModalBtn.addEventListener('click', closeRoomModal);
  elements.cancelRoomModalBtn.addEventListener('click', closeRoomModal);
  elements.roomForm.addEventListener('submit', handleRoomSubmit);

  // Confirm Modal
  elements.closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
  elements.cancelConfirmBtn.addEventListener('click', closeConfirmModal);
  elements.executeConfirmBtn.addEventListener('click', () => {
    if (confirmActionCallback) confirmActionCallback();
    closeConfirmModal();
  });
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadRooms(),
    loadBookings()
  ]);
}

async function loadStats() {
  try {
    const res = await API.getStats();
    if (!res.success) return;

    const { totalRooms, availableRooms, totalBookings, totalRevenue, occupancyRate } = res.data;

    elements.statTotalRooms.textContent = totalRooms;
    elements.statAvailableRooms.textContent = availableRooms;
    elements.statOccupancyRate.textContent = `${occupancyRate}%`;
    elements.statActiveBookings.textContent = totalBookings;
    elements.statTotalRevenue.textContent = formatPrice(totalRevenue);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadRooms(showLoader = true) {
  if (showLoader) {
    elements.roomsGrid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">🔄 Loading luxury suites...</div>';
  }

  try {
    let res;
    if (state.isAvailabilityFiltered) {
      res = await API.searchAvailableRooms({
        checkIn: state.searchCheckIn,
        checkOut: state.searchCheckOut,
        type: state.searchRoomType,
        guests: state.searchGuests
      });
    } else {
      res = await API.getRooms({
        type: elements.searchRoomType.value !== 'all' ? elements.searchRoomType.value : '',
        status: state.roomStatus,
        search: state.roomSearch,
        sort: state.roomSort,
        order: state.roomOrder
      });
    }

    if (!res.success) throw new Error(res.error || 'Failed to fetch rooms');

    state.cachedRooms = res.data;
    renderRoomsGrid(res.data);
    renderRoomsTable(res.data);
  } catch (err) {
    elements.roomsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #f87171;">
        ⚠️ Failed to load suites: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function renderRoomsGrid(rooms) {
  if (!rooms || rooms.length === 0) {
    elements.roomsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
        <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary);">No available suites match your criteria</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Try adjusting dates, room categories, or clear search filters.</p>
      </div>
    `;
    return;
  }

  elements.roomsGrid.innerHTML = '';
  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';

    const statusBadgeClass = room.status === 'Available' ? 'badge-available'
      : room.status === 'Occupied' ? 'badge-occupied' : 'badge-maintenance';

    const amenitiesList = (room.amenities || '').split(',')
      .map(a => a.trim())
      .filter(Boolean)
      .slice(0, 4);

    const featureLabel = room.type === 'Presidential Suite' ? '👑 Penthouse Sanctuary'
      : room.type === 'Executive Suite' ? '⭐ VIP Executive Lounge'
      : room.type === 'Deluxe' ? '🌊 Ocean View Balcony'
      : '✨ 5-Star Comfort';

    card.innerHTML = `
      <div class="room-card-visual">
        <span class="room-feature-badge">${featureLabel}</span>
        <span class="room-number-tag">Suite ${escapeHtml(room.room_number)}</span>
      </div>

      <div class="room-card-header">
        <div class="room-type-title">${escapeHtml(room.type)}</div>
        <span class="badge ${statusBadgeClass}">
          <span>●</span>
          <span>${room.status}</span>
        </span>
      </div>

      <div class="room-card-body">
        <p class="room-desc">${escapeHtml(room.description || 'Luxurious Palace accommodations featuring bespoke furnishings and personalized butler service.')}</p>
        
        <div class="room-specs">
          <span>👥 Up to ${room.capacity} Guests</span>
          <span>🏢 Floor ${room.floor}</span>
        </div>

        <div class="room-amenities-tags">
          ${amenitiesList.map(a => `<span class="amenity-chip">✓ ${escapeHtml(a)}</span>`).join('')}
        </div>
      </div>

      <div class="room-card-footer">
        <div class="room-price-wrap">
          <span class="room-price-val">${formatPrice(room.price_per_night)}</span>
          <span class="room-price-unit">per night (taxes incl.)</span>
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary edit-room-btn" style="padding: 6px 12px; font-size: 0.8rem;" title="Edit Suite Details" data-id="${room.id}">✏️ Edit</button>
          <button class="btn btn-gold book-room-btn" style="padding: 6px 16px; font-size: 0.82rem;" data-id="${room.id}" ${room.status === 'Maintenance' ? 'disabled' : ''}>
            ${room.status === 'Maintenance' ? 'Maintenance' : 'Reserve Suite'}
          </button>
        </div>
      </div>
    `;

    card.querySelector('.edit-room-btn').addEventListener('click', () => openRoomModal(room));
    card.querySelector('.book-room-btn').addEventListener('click', () => openBookingModal(room));

    elements.roomsGrid.appendChild(card);
  });
}

function renderRoomsTable(rooms) {
  if (!rooms || rooms.length === 0) {
    elements.roomsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 24px;">No suites found.</td></tr>';
    return;
  }

  elements.roomsTableBody.innerHTML = '';
  rooms.forEach(room => {
    const tr = document.createElement('tr');
    const statusClass = room.status === 'Available' ? 'badge-available' : room.status === 'Occupied' ? 'badge-occupied' : 'badge-maintenance';

    tr.innerHTML = `
      <td><span class="ref-pill">#${escapeHtml(room.room_number)}</span></td>
      <td style="font-weight: 600; color: var(--text-gold);">${escapeHtml(room.type)}</td>
      <td>${room.capacity} Guests</td>
      <td>Floor ${room.floor}</td>
      <td style="font-family: var(--font-mono); font-weight: 600;">${formatPrice(room.price_per_night)}</td>
      <td><span class="badge ${statusClass}">● ${room.status}</span></td>
      <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(room.amenities)}</td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 6px; justify-content: flex-end;">
          <button class="btn btn-secondary edit-tbl-btn" style="padding: 4px 8px; font-size: 0.78rem;">Edit</button>
          <button class="btn btn-gold book-tbl-btn" style="padding: 4px 10px; font-size: 0.78rem;" ${room.status === 'Maintenance' ? 'disabled' : ''}>Book</button>
        </div>
      </td>
    `;

    tr.querySelector('.edit-tbl-btn').addEventListener('click', () => openRoomModal(room));
    tr.querySelector('.book-tbl-btn').addEventListener('click', () => openBookingModal(room));

    elements.roomsTableBody.appendChild(tr);
  });
}

// ==========================================
// AVAILABILITY SEARCH
// ==========================================
async function performAvailabilitySearch() {
  const checkIn = elements.searchCheckIn.value;
  const checkOut = elements.searchCheckOut.value;
  const type = elements.searchRoomType.value;
  const guests = elements.searchGuests.value;

  if (!checkIn || !checkOut) {
    showToast('Please select both Check-In and Check-Out dates', 'error');
    return;
  }

  if (new Date(checkIn) >= new Date(checkOut)) {
    showToast('Check-out date must be strictly after Check-in date', 'error');
    return;
  }

  state.searchCheckIn = checkIn;
  state.searchCheckOut = checkOut;
  state.searchRoomType = type;
  state.searchGuests = guests;
  state.isAvailabilityFiltered = true;

  try {
    const res = await API.searchAvailableRooms({ checkIn, checkOut, type, guests });
    if (!res.success) throw new Error(res.error);

    state.cachedRooms = res.data;
    renderRoomsGrid(res.data);
    renderRoomsTable(res.data);

    const roomsSection = document.getElementById('rooms');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }

    showToast(`Found ${res.count} available suite(s) for ${checkIn} to ${checkOut}`, 'success');
  } catch (err) {
    showToast(`Search error: ${err.message}`, 'error');
  }
}

// ==========================================
// BOOKING MODAL & SUBMISSION
// ==========================================
function openBookingModal(room) {
  state.selectedRoom = room;

  elements.bookRoomId.value = room.id;
  elements.bookRoomNumberDisplay.textContent = `Suite ${room.room_number}`;
  elements.bookRoomTypeDisplay.textContent = `${room.type} • Floor ${room.floor} • Max ${room.capacity} Guests`;
  elements.bookRoomRateDisplay.textContent = formatPrice(room.price_per_night);

  elements.bookCheckIn.value = state.searchCheckIn || elements.searchCheckIn.value;
  elements.bookCheckOut.value = state.searchCheckOut || elements.searchCheckOut.value;

  recalculateBookingPrice();

  elements.bookingModal.classList.add('active');
  elements.bookGuestName.focus();
}

function closeBookingModal() {
  elements.bookingModal.classList.remove('active');
  state.selectedRoom = null;
  elements.bookingForm.reset();
}

function recalculateBookingPrice() {
  if (!state.selectedRoom) return;

  const checkInStr = elements.bookCheckIn.value;
  const checkOutStr = elements.bookCheckOut.value;

  if (!checkInStr || !checkOutStr) return;

  const d1 = new Date(checkInStr);
  const d2 = new Date(checkOutStr);

  if (d1 >= d2) {
    elements.bookNightsCalc.textContent = 'Invalid date range (Check-out must be after Check-in)';
    elements.bookTotalPriceDisplay.textContent = formatPrice(0);
    return;
  }

  const diffTime = d2.getTime() - d1.getTime();
  const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  const total = nights * state.selectedRoom.price_per_night;

  elements.bookNightsCalc.textContent = `${nights} night${nights > 1 ? 's' : ''} stay (${formatPrice(state.selectedRoom.price_per_night)} / night)`;
  elements.bookTotalPriceDisplay.textContent = formatPrice(total);
}

async function handleBookingSubmit(e) {
  e.preventDefault();

  const payload = {
    room_id: parseInt(elements.bookRoomId.value, 10),
    guest_name: elements.bookGuestName.value.trim(),
    guest_email: elements.bookGuestEmail.value.trim(),
    guest_phone: elements.bookGuestPhone.value.trim(),
    check_in: elements.bookCheckIn.value,
    check_out: elements.bookCheckOut.value,
    special_requests: elements.bookSpecialRequests.value.trim()
  };

  try {
    const res = await API.createBooking(payload);
    closeBookingModal();
    loadAllData();

    showToast(`🎉 Reservation confirmed! Ref: ${res.data.booking_reference}`, 'success');
    openVoucherModal(res.data);
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 'error');
  }
}

// ==========================================
// OFFICIAL VOUCHER MODAL
// ==========================================
function openVoucherModal(booking) {
  elements.vouchRef.textContent = booking.booking_reference;
  elements.vouchGuestName.textContent = booking.guest_name;
  elements.vouchRoom.textContent = `Room ${booking.room_number} (${booking.room_type || 'Luxury Suite'})`;
  elements.vouchCheckIn.textContent = `${booking.check_in} (3:00 PM)`;
  elements.vouchCheckOut.textContent = `${booking.check_out} (11:00 AM)`;
  elements.vouchContact.textContent = `${booking.guest_email} • ${booking.guest_phone}`;
  elements.vouchTotal.textContent = formatPrice(booking.total_price);

  elements.voucherModal.classList.add('active');
}

function closeVoucherModal() {
  elements.voucherModal.classList.remove('active');
}

// ==========================================
// BOOKINGS / RESERVATIONS VIEW
// ==========================================
async function loadBookings() {
  elements.bookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 24px;">Loading reservations...</td></tr>';

  try {
    const res = await API.getBookings({
      status: state.bookingStatus,
      search: state.bookingSearch
    });

    if (!res.success) throw new Error(res.error);

    state.cachedBookings = res.data;
    renderBookingsTable(res.data);
  } catch (err) {
    elements.bookingsTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #f87171; padding: 24px;">Failed to load reservations: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderBookingsTable(bookings) {
  if (!bookings || bookings.length === 0) {
    elements.bookingsTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">📑</div>
          No reservations found matching current criteria.
        </td>
      </tr>
    `;
    return;
  }

  elements.bookingsTableBody.innerHTML = '';
  bookings.forEach(b => {
    const tr = document.createElement('tr');
    const statusBadge = b.status === 'Confirmed' ? 'badge-confirmed' : 'badge-cancelled';

    tr.innerHTML = `
      <td><span class="ref-pill" style="cursor: pointer;" title="View Voucher">${escapeHtml(b.booking_reference)}</span></td>
      <td>
        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(b.guest_name)}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(b.guest_email)} • ${escapeHtml(b.guest_phone)}</div>
      </td>
      <td>
        <span style="font-weight: 600; color: var(--text-gold);">Room ${escapeHtml(b.room_number)}</span>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(b.room_type)}</div>
      </td>
      <td style="font-family: var(--font-mono); font-size: 0.85rem;">${b.check_in}</td>
      <td style="font-family: var(--font-mono); font-size: 0.85rem;">${b.check_out}</td>
      <td>${b.nights} night${b.nights > 1 ? 's' : ''}</td>
      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-gold);">${formatPrice(b.total_price)}</td>
      <td><span class="badge ${statusBadge}">● ${b.status}</span></td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 6px; justify-content: flex-end;">
          <button class="btn btn-secondary view-voucher-btn" style="padding: 4px 8px; font-size: 0.78rem;" title="View & Print Voucher">🖨️ Voucher</button>
          ${b.status === 'Confirmed' ? `
            <button class="btn btn-danger cancel-booking-btn" style="padding: 4px 10px; font-size: 0.78rem;" data-id="${b.id}" data-ref="${b.booking_reference}">
              Cancel
            </button>
          ` : `
            <span style="font-size: 0.78rem; color: var(--text-muted); padding: 4px;">Cancelled</span>
          `}
        </div>
      </td>
    `;

    tr.querySelector('.ref-pill').addEventListener('click', () => openVoucherModal(b));
    tr.querySelector('.view-voucher-btn').addEventListener('click', () => openVoucherModal(b));

    const cancelBtn = tr.querySelector('.cancel-booking-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        openConfirmModal(
          'Cancel Reservation',
          `Are you sure you want to cancel reservation ${b.booking_reference} for guest ${b.guest_name}? This will free up Room ${b.room_number} for those dates.`,
          async () => {
            try {
              const res = await API.cancelBooking(b.id);
              showToast(res.message, 'success');
              loadAllData();
            } catch (err) {
              showToast(`Cancellation error: ${err.message}`, 'error');
            }
          }
        );
      });
    }

    elements.bookingsTableBody.appendChild(tr);
  });
}

// ==========================================
// ROOM MODAL (ADD / EDIT)
// ==========================================
function openRoomModal(room = null) {
  elements.roomForm.reset();

  if (room) {
    elements.roomModalTitle.textContent = `Edit Suite ${room.room_number}`;
    elements.formRoomId.value = room.id;
    elements.formRoomNumber.value = room.room_number;
    elements.formRoomType.value = room.type;
    elements.formRoomPrice.value = room.price_per_night;
    elements.formRoomCapacity.value = room.capacity;
    elements.formRoomFloor.value = room.floor;
    elements.formRoomStatus.value = room.status;
    elements.formRoomAmenities.value = room.amenities || '';
    elements.formRoomDescription.value = room.description || '';
  } else {
    elements.roomModalTitle.textContent = 'Add New Palace Suite';
    elements.formRoomId.value = '';
    elements.formRoomNumber.value = '';
    elements.formRoomType.value = 'Deluxe';
    elements.formRoomPrice.value = '12500.00';
    elements.formRoomCapacity.value = '2';
    elements.formRoomFloor.value = '2';
    elements.formRoomStatus.value = 'Available';
  }

  elements.roomModal.classList.add('active');
  elements.formRoomNumber.focus();
}

function closeRoomModal() {
  elements.roomModal.classList.remove('active');
}

async function handleRoomSubmit(e) {
  e.preventDefault();

  const id = elements.formRoomId.value;
  const payload = {
    room_number: elements.formRoomNumber.value.trim(),
    type: elements.formRoomType.value,
    price_per_night: parseFloat(elements.formRoomPrice.value),
    capacity: parseInt(elements.formRoomCapacity.value, 10) || 2,
    floor: parseInt(elements.formRoomFloor.value, 10) || 1,
    status: elements.formRoomStatus.value,
    amenities: elements.formRoomAmenities.value.trim(),
    description: elements.formRoomDescription.value.trim()
  };

  try {
    if (id) {
      const res = await API.updateRoom(id, payload);
      showToast(res.message, 'success');
    } else {
      const res = await API.createRoom(payload);
      showToast(res.message, 'success');
    }

    closeRoomModal();
    loadAllData();
  } catch (err) {
    showToast(`Error saving suite: ${err.message}`, 'error');
  }
}

// ==========================================
// CONFIRMATION MODAL
// ==========================================
function openConfirmModal(title, message, onConfirm) {
  elements.confirmModalTitle.textContent = title;
  elements.confirmModalMessage.textContent = message;
  confirmActionCallback = onConfirm;
  elements.confirmModal.classList.add('active');
}

function closeConfirmModal() {
  elements.confirmModal.classList.remove('active');
  confirmActionCallback = null;
}

// Utility
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
