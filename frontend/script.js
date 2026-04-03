// Global Config
const API_URL = 'http://localhost:5000/places';
const COLLEGE = {
  lat: 13.0158,
  lng: 77.6486
};

// State
let allPlaces = [];
let currentCategory = 'all';

// ==========================================
// DOM Elements
// ==========================================
// Index Page
const placesGrid = document.getElementById('placesGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const distanceFilter = document.getElementById('distanceFilter');
const categoryButtons = document.getElementById('categoryButtons');

// Details Page
const detailsContainer = document.getElementById('detailsContainer');

// Admin Page
const placeForm = document.getElementById('placeForm');
const adminPlacesGrid = document.getElementById('adminPlacesGrid');
const alertMsg = document.getElementById('alertMsg');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const submitBtn = document.getElementById('submitBtn');
const adminButtons = document.querySelectorAll('.admin-btn');
const logoutButtons = document.querySelectorAll('.logout-btn');
const loginLinks = document.querySelectorAll('.login-link');

// ==========================================
// Initializers
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const isAdmin = sessionStorage.getItem('isAdmin');

  applyAuthUI();
  
  // Only protect admin pages
if (window.location.pathname.includes("admin") && isAdmin !== "true") {
  window.location.href = "login.html";
}

  if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('student-platform/frontend/')) {
    if (placesGrid) initializeIndexPage();
  } else if (currentPath.includes('details.html')) {
    if (detailsContainer) getPlaceDetails();
  } else if (currentPath.includes('admin.html')) {
    if (adminPlacesGrid) {
      fetchAdminPlaces();
      setupFormListener();
      setupCancelEditListener();
    }
  }
});

// ==========================================
// Shared Helpers
// ==========================================

function applyAuthUI() {
  const isAdmin = sessionStorage.getItem('isAdmin');

  adminButtons.forEach((button) => {
    if (isAdmin !== 'true') {
      button.style.display = 'none';
    } else {
      button.style.display = '';
    }
  });

  logoutButtons.forEach((button) => {
    if (isAdmin === 'true') {
      button.style.display = 'inline-block';
    } else {
      button.style.display = 'none';
    }
  });

  loginLinks.forEach((link) => {
    if (isAdmin === 'true') {
      link.style.display = 'none';
    } else {
      link.style.display = '';
    }
  });
}

function logout() {
  sessionStorage.removeItem('isAdmin');
  window.location.href = 'login.html';
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

function hasValidCoordinates(place) {
  return typeof place.lat === 'number' && typeof place.lng === 'number';
}

function getDistanceText(place) {
  if (!hasValidCoordinates(place)) {
    return '';
  }

  return `${getDistance(COLLEGE.lat, COLLEGE.lng, place.lat, place.lng)} km from college`;
}

function getDistanceValue(place) {
  if (!hasValidCoordinates(place)) {
    return Number.POSITIVE_INFINITY;
  }

  return parseFloat(getDistance(COLLEGE.lat, COLLEGE.lng, place.lat, place.lng));
}

function sortPlacesByDistance(data) {
  return [...data].sort((a, b) => {
    const d1 = parseFloat(getDistance(COLLEGE.lat, COLLEGE.lng, a.lat, a.lng));
    const d2 = parseFloat(getDistance(COLLEGE.lat, COLLEGE.lng, b.lat, b.lng));

    const safeD1 = Number.isNaN(d1) ? Number.POSITIVE_INFINITY : d1;
    const safeD2 = Number.isNaN(d2) ? Number.POSITIVE_INFINITY : d2;

    return safeD1 - safeD2;
  });
}

function applyDistanceFilter(data, maxDistance) {
  return data.filter((item) => {
    if (!hasValidCoordinates(item)) {
      return false;
    }

    const dist = parseFloat(
      getDistance(COLLEGE.lat, COLLEGE.lng, item.lat, item.lng)
    );

    return dist <= maxDistance;
  });
}

function getFavorites() {
  return JSON.parse(sessionStorage.getItem('favorites')) || [];
}

function toggleFavorite(id) {
  let favorites = getFavorites();

  if (favorites.includes(id)) {
    favorites = favorites.filter((favoriteId) => favoriteId !== id);
  } else {
    favorites.push(id);
  }

  sessionStorage.setItem('favorites', JSON.stringify(favorites));
  applyFilters();
}

function showFavorites() {
  const favorites = getFavorites();
  const filtered = allPlaces.filter((item) => favorites.includes(item._id));
  renderPlaces(sortPlacesByDistance(filtered));
}

// ==========================================
// Index Page Logic
// ==========================================

function initializeIndexPage() {
  if (distanceFilter) {
    distanceFilter.addEventListener('change', applyFilters);
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  fetchAllPlaces();
}

async function fetchAllPlaces() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch data');

    const data = await res.json();
    allPlaces = sortPlacesByDistance(data);
    
    // Set default category to 'all'
    currentCategory = 'all'; 
    renderIndexCategoryButtons(allPlaces);
    applyFilters();
  } catch (error) {
    allPlaces = [];
    if (placesGrid) {
      placesGrid.innerHTML = `<p class="msg-error" style="display:block;">Error loading data: ${error.message}. Is backend running?</p>`;
    }
    console.error(error);
  }
}

function renderIndexCategoryButtons(places) {
  if (!categoryButtons) return;

  const categories = [...new Set(places.map(p => p.category.toLowerCase()))];
  
  let html = `<button type="button" class="cat-btn ${currentCategory === 'all' ? 'active' : ''}" onclick="setCategory('all', this)">All</button>`;
  
  categories.forEach(cat => {
    let label = cat;
    if (cat === 'pg') label = 'PG';
    else label = cat.charAt(0).toUpperCase() + cat.slice(1);
    
    html += `<button type="button" class="cat-btn ${currentCategory === cat ? 'active' : ''}" onclick="setCategory('${cat}', this)">${label}</button>`;
  });

  categoryButtons.innerHTML = html;
}

function setCategory(cat, btn) {
  currentCategory = cat;
  
  // Handle active class
  document.querySelectorAll('.cat-btn').forEach(el => el.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    // If called programmatically, find the correct button
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(b => {
      if (b.innerText.toLowerCase() === cat.toLowerCase() || (cat === 'all' && b.innerText === 'All')) {
        b.classList.add('active');
      }
    });
  }

  applyFilters();
}

function generatePlaceCardHTML(place) {
  const favorites = getFavorites();
  const isFavorite = favorites.includes(place._id);

  const priceHtml = place.price || place.price === 0
    ? `<span class="price">Rs. ${place.price}</span>`
    : '<span class="price">Price not available</span>';

  const ratingText = place.rating || place.rating === 0 ? place.rating : 'Not rated';
  const distanceText = getDistanceText(place);
  const distanceHtml = distanceText
    ? `<p class="card-location">📍 ${distanceText}</p>`
    : '';

  const mapLinkHtml = place.gmapLink
    ? `<a href="${place.gmapLink}" target="_blank" rel="noopener noreferrer" class="btn-outline">View on Map</a>`
    : '<span class="btn-outline" style="opacity:0.7; cursor:not-allowed;">Map not available</span>';

  return `
    <div class="place-card">
      <img src="${place.imageUrl}" alt="${place.name}" class="card-image" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
      <div class="card-content">
        <span class="category-badge">${place.category || currentCategory}</span>
        <h3 class="card-title">${place.name}</h3>
        <p class="card-location">${place.location}</p>
        ${distanceHtml}
        <p class="card-location">Rating: ${ratingText}</p>
        <div class="card-footer">
          ${priceHtml}
          <button class="btn-outline" onclick="viewDetails('${place._id}')">View Details</button>
        </div>
        <div class="card-footer" style="margin-top:12px; border-top:none; padding-top:0;">
          <button
            class="btn-outline"
            onclick="toggleFavorite('${place._id}')"
            style="color:${isFavorite ? '#dc2626' : 'var(--text-main)'}; border-color:${isFavorite ? '#fecaca' : 'var(--border)'};"
          >
            ${isFavorite ? '❤️ Saved' : '❤️ Save'}
          </button>
        </div>
        <div class="card-footer" style="margin-top:12px; border-top:none; padding-top:0;">
          ${mapLinkHtml}
        </div>
      </div>
    </div>
  `;
}

function renderPlaces(places, container = placesGrid) {
  if (!container) return;

  if (places.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No data available.</p>';
    return;
  }

  container.innerHTML = '';

  places.forEach((place) => {
    container.innerHTML += generatePlaceCardHTML(place);
  });
}

function groupByCategory(data) {
  const grouped = {};
  data.forEach(item => {
    const category = item.category || "Others";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  return grouped;
}

function getCategoryIcon(cat) {
  const icons = {
    pg: '🏠',
    hostel: '🏢',
    apartment: '🏢',
    mess: '🍲',
    restaurant: '🍴',
    gym: '💪'
  };
  const normalized = cat.toLowerCase().replace('s', ''); // hostels -> hostel
  return icons[normalized] || '📍';
}

function displayGrouped(data) {
  if (!placesGrid) return;
  
  if (data.length === 0) {
    placesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No data available.</p>';
    return;
  }

  const grouped = groupByCategory(data);
  placesGrid.innerHTML = '';
  placesGrid.style.display = 'block'; // Turn off main grid layout to use section-based grids

  Object.entries(grouped).forEach(([category, items]) => {
    const section = document.createElement('div');
    section.className = 'category-section-group';
    
    let label = category;
    if (category.toLowerCase() === 'pg') label = 'PG';
    else label = category.charAt(0).toUpperCase() + category.slice(1);
    // Pluralize if not already plural for visual consistency in sections
    if (!label.toLowerCase().endsWith('s') && label.toLowerCase() !== 'pg' && label.toLowerCase() !== 'mess') {
      label += 's';
    }

    section.innerHTML = `
      <h3 class="grouped-section-title">${getCategoryIcon(category)} ${label}</h3>
      <div class="places-grid">
        ${items.map(item => generatePlaceCardHTML(item)).join('')}
      </div>
    `;
    placesGrid.appendChild(section);
  });
}

function viewDetails(id) {
  window.location.href = `details.html?id=${id}`;
}

function applyFilters() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const maxDistance = distanceFilter ? distanceFilter.value : '';

  let filteredPlaces = allPlaces.filter((place) => {
    const placeName = (place.name || '').toLowerCase();
    const placeLocation = (place.location || '').toLowerCase();
    const placeCategory = (place.category || '').toLowerCase();

    const matchesSearch = placeName.includes(searchTerm) || 
                          placeLocation.includes(searchTerm) || 
                          placeCategory.includes(searchTerm);
    
    const matchesCategory = currentCategory === 'all' || placeCategory === currentCategory;

    return matchesSearch && matchesCategory;
  });

  if (maxDistance) {
    filteredPlaces = applyDistanceFilter(filteredPlaces, Number(maxDistance));
  }

  if (currentCategory === 'all') {
    displayGrouped(sortPlacesByDistance(filteredPlaces));
  } else {
    if (placesGrid) placesGrid.style.display = 'grid'; // Restore grid layout
    renderPlaces(sortPlacesByDistance(filteredPlaces));
  }
}

// ==========================================
// Details Page Logic
// ==========================================

async function getPlaceDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    detailsContainer.innerHTML = '<div style="padding: 2rem;"><h3>Invalid Listing ID</h3></div>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error('Listing not found');

    const place = await res.json();

    document.title = `${place.name} | Details`;

    const priceText = place.price || place.price === 0 ? `Rs. ${place.price}` : 'Price not available';
    const ratingText = place.rating || place.rating === 0 ? place.rating : 'Not rated';
    const distanceText = getDistanceText(place);
    const mapLinkHtml = place.gmapLink
      ? `<a href="${place.gmapLink}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="display:inline-block; margin-top:16px;">View on Map</a>`
      : '';

    detailsContainer.innerHTML = `
      <div class="details-image-wrapper">
        <img src="${place.imageUrl}" alt="${place.name}" class="details-image" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
      </div>
      <div class="details-info">
        <span class="category-badge" style="width: fit-content">${place.category || currentCategory}</span>
        <h2 class="details-title">${place.name}</h2>
        <p class="details-desc">${place.description}</p>

        <div class="meta-info">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${place.location}</span>
          </div>
          ${distanceText ? `
          <div class="meta-item">
            <span class="meta-label">Distance</span>
            <span class="meta-value">${distanceText}</span>
          </div>` : ''}
          <div class="meta-item">
            <span class="meta-label">Price</span>
            <span class="meta-value" style="color:#a5b4fc">${priceText}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Contact</span>
            <span class="meta-value">${place.contact}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Rating</span>
            <span class="meta-value">${ratingText}</span>
          </div>
        </div>

        ${mapLinkHtml}
      </div>
    `;
  } catch (error) {
    detailsContainer.innerHTML = `<div style="padding: 2rem; width: 100%;"><p class="msg-error" style="display:block;">${error.message}</p></div>`;
    console.error(error);
  }
}

// ==========================================
// Admin Logic (CRUD Operations)
// ==========================================

async function fetchAdminPlaces() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch data');

    const data = await res.json();
    renderAdminPlaces(data);
  } catch (error) {
    if (adminPlacesGrid) {
      adminPlacesGrid.innerHTML = `<p class="msg-error" style="display:block;">Error: ${error.message}</p>`;
    }
  }
}

function renderAdminPlaces(places) {
  if (!adminPlacesGrid) return;

  const tabsContainer = document.querySelector('.admin-category-tabs');
  if (tabsContainer) {
    if (places.length === 0) {
      tabsContainer.innerHTML = '';
    } else {
      const uniqueCategories = [...new Set(places.map(p => (p.category || 'pg').toLowerCase()))];
      const activeFilter = window.currentAdminFilter || 'all';

      let tabsHtml = `<button class="admin-tab ${activeFilter === 'all' ? 'active' : ''}" onclick="filterAdminGrid('all', this)">All Places</button>`;
      
      uniqueCategories.forEach(cat => {
        let label = cat;
        if (cat === 'pg') label = 'PG';
        else label = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        tabsHtml += `<button class="admin-tab ${activeFilter === cat ? 'active' : ''}" onclick="filterAdminGrid('${cat}', this)">${label}</button>`;
      });
      
      tabsContainer.innerHTML = tabsHtml;
    }
  }

  if (places.length === 0) {
    adminPlacesGrid.innerHTML = '<p style="grid-column: 1/-1;">No places available to manage.</p>';
    return;
  }

  adminPlacesGrid.innerHTML = '';

  places.forEach((place) => {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.innerHTML = `
      <img src="${place.imageUrl}" alt="${place.name}" class="card-image" onerror="this.src='https://placehold.co/600x400?text=No+Image'" style="height:150px">
      <div class="card-content">
        <span class="category-badge">${place.category}</span>
        <h3 class="card-title" style="font-size:1.1rem">${place.name}</h3>
        <div class="card-footer" style="margin-top:20px; border:none; padding-top:0;">
          <button class="btn-outline" onclick="editPlace('${place._id}')">Edit</button>
          <button class="btn-danger" onclick="deletePlace('${place._id}')">Delete</button>
        </div>
      </div>
    `;
    adminPlacesGrid.appendChild(card);
  });
}

function setupFormListener() {
  const isAdmin = sessionStorage.getItem('isAdmin');

  if (isAdmin !== 'true') {
    return;
  }

  placeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const _id = document.getElementById('placeId').value;
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value.trim();
    const price = document.getElementById('price').value;
    const contact = document.getElementById('contact').value.trim();
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const gmapLink = document.getElementById('gmapLink').value.trim();
    const rating = document.getElementById('rating').value;
    const description = document.getElementById('description').value.trim();

    if (!name || !category || !location || !price || !contact || !imageUrl || !gmapLink || !rating || !description) {
      showAlert('All fields are required!', 'error');
      return;
    }

    const payload = {
      name,
      category,
      location,
      price,
      contact,
      imageUrl,
      gmapLink,
      rating,
      description
    };

    try {
      if (_id) {
        const res = await fetch(`${API_URL}/${_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            admin: 'true'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update place');
        showAlert('Place updated successfully!', 'success');
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            admin: 'true'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create place');
        showAlert('Place created successfully!', 'success');
      }

      resetForm();
      fetchAdminPlaces();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });
}

async function deletePlace(id) {
  const isAdmin = sessionStorage.getItem('isAdmin');

  if (isAdmin !== 'true') {
    showAlert('Unauthorized', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this listing?')) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        admin: 'true'
      }
    });
    if (!res.ok) throw new Error('Failed to delete place');

    showAlert('Listing deleted!', 'success');
    fetchAdminPlaces();

    if (document.getElementById('placeId').value === id) {
      resetForm();
    }
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function editPlace(id) {
  const isAdmin = sessionStorage.getItem('isAdmin');

  if (isAdmin !== 'true') {
    showAlert('Unauthorized', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch listing data');

    const place = await res.json();

    document.getElementById('placeId').value = place._id;
    document.getElementById('name').value = place.name;
    document.getElementById('category').value = place.category === 'hostels'
      ? 'hostel'
      : place.category === 'apartments'
        ? 'apartment'
        : place.category === 'messes'
          ? 'mess'
          : place.category === 'restaurants'
            ? 'restaurant'
            : place.category || 'pg';
    document.getElementById('location').value = place.location;
    document.getElementById('price').value = place.price || '';
    document.getElementById('contact').value = place.contact;
    document.getElementById('imageUrl').value = place.imageUrl;
    document.getElementById('gmapLink').value = place.gmapLink || '';
    document.getElementById('rating').value = place.rating || '';
    document.getElementById('description').value = place.description;

    document.getElementById('formTitle').innerText = 'Edit Place';
    submitBtn.innerText = 'Update Listing';
    cancelEditBtn.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function setupCancelEditListener() {
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetForm);
  }
}

function resetForm() {
  placeForm.reset();
  document.getElementById('placeId').value = '';
  document.getElementById('formTitle').innerText = 'Add New Place';
  submitBtn.innerText = 'Save Listing';
  cancelEditBtn.style.display = 'none';
}

function showAlert(msg, type) {
  if (!alertMsg) return;

  alertMsg.innerText = msg;
  alertMsg.className = `msg-alert msg-${type}`;
  alertMsg.style.display = 'block';

  setTimeout(() => {
    alertMsg.style.display = 'none';
  }, 3500);
}

// ==========================================
// Custom Category Dropdown Logic
// ==========================================

function toggleCategoryDropdown(show) {
  const options = document.getElementById('categoryOptions');
  if (!options) return;
  if (show === true) {
    options.classList.add('show');
    filterCategoryDropdown(); // ensure filtering runs if user clicks back in
  } else if (show === false) {
    options.classList.remove('show');
  } else {
    options.classList.toggle('show');
  }
}

function selectCategory(val) {
  const input = document.getElementById('category');
  if (input) {
    input.value = val;
    toggleCategoryDropdown(false);
  }
}

function filterCategoryDropdown() {
  const input = document.getElementById('category');
  const options = document.getElementById('categoryOptions');
  if (!input || !options) return;
  
  options.classList.add('show');
  const filter = input.value.toLowerCase();
  const opts = options.querySelectorAll('.dropdown-option');
  
  opts.forEach(opt => {
    const text = opt.innerText.toLowerCase();
    if (text.includes(filter)) {
      opt.style.display = 'block';
    } else {
      opt.style.display = 'none';
    }
  });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.select-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    toggleCategoryDropdown(false);
  }
});
