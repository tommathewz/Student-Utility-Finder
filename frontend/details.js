const detailsContainer = document.getElementById('details');
const isAdmin = sessionStorage.getItem('isAdmin');
const adminButton = document.querySelector('.admin-btn');
const logoutButton = document.querySelector('.logout-btn');
const COLLEGE = {
  lat: 13.0158,
  lng: 77.6486
};

if (adminButton && isAdmin !== 'true') {
  adminButton.style.display = 'none';
}

if (logoutButton && isAdmin === 'true') {
  logoutButton.style.display = 'inline-block';
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

async function loadPlaceDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    detailsContainer.innerHTML = '<p class="msg-error" style="display:block;">Place ID is missing.</p>';
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/places/${id}`);

    if (!response.ok) {
      throw new Error('Failed to load place details.');
    }

    const place = await response.json();
    const distanceText = hasValidCoordinates(place)
      ? `${getDistance(COLLEGE.lat, COLLEGE.lng, place.lat, place.lng)} km from college`
      : '';

    const mapButton = place.gmapLink
      ? `
        <a href="${place.gmapLink}" target="_blank" rel="noopener noreferrer" class="map-btn">
          View on Google Maps
        </a>
      `
      : '';

    // Embedded map + directions button (only when coordinates exist)
    const mapSection = hasValidCoordinates(place)
      ? `
        <div class="map-section">
          <h3 class="map-heading">📍 Location on Map</h3>
          <div class="map-embed-wrapper">
            <iframe
              class="map-embed"
              src="https://maps.google.com/maps?q=${place.lat},${place.lng}&z=15&output=embed"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Map showing location of ${place.name}"
            ></iframe>
          </div>
          <a
            id="get-directions-btn"
            href="https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-directions"
          >
            🧭 Get Directions
          </a>
        </div>
      `
      : '';

    detailsContainer.innerHTML = `
      <div class="details-image-wrapper">
        <img
          src="${place.imageUrl || 'https://via.placeholder.com/400'}"
          alt="${place.name}"
          class="details-image"
          onerror="this.src='https://via.placeholder.com/400'"
        >
      </div>
      <div class="details-info">
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
          </div>
          ` : ''}
          <div class="meta-item">
            <span class="meta-label">Price</span>
            <span class="meta-value">Rs. ${place.price}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Contact</span>
            <span class="meta-value">${place.contact}</span>
          </div>
        </div>
        ${mapButton}
        ${mapSection}
      </div>
    `;
  } catch (error) {
    detailsContainer.innerHTML = `<p class="msg-error" style="display:block;">${error.message}</p>`;
  }
}

loadPlaceDetails();
