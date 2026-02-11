/**
 * MyFuel — Frontend Application Logic
 * Leaflet map + /apiv1/nearby integration
 */

// ===== Configuration =====
const CONFIG = {
  defaultLat: 43.263, // Bilbao as fallback
  defaultLon: -2.935,
  defaultZoom: 14,
  apiEndpoint: "/apiv1/nearby",
  tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  tileFallback: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
};

// ===== State =====
let map;
let markersLayer;
let userMarker;
let allStations = [];
let currentFilter = "all";
let sortAsc = true; // true = price low→high
let userLat = null;
let userLon = null;

// ===== DOM Elements =====
const $stationList = document.getElementById("station-list");
const $loading = document.getElementById("loading-state");
const $empty = document.getElementById("empty-state");
const $btnLocate = document.getElementById("btn-locate");
const $btnRetry = document.getElementById("btn-retry");
const $sortToggle = document.getElementById("sort-toggle");
const $filterChips = document.querySelectorAll(".filter-chip");

// ===== Initialize Map =====
function initMap() {
  map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
  }).setView([CONFIG.defaultLat, CONFIG.defaultLon], CONFIG.defaultZoom);

  // Zoom control in bottom-left
  L.control.zoom({ position: "bottomleft" }).addTo(map);

  // Light tiles
  L.tileLayer(CONFIG.tileUrl, {
    maxZoom: 19,
    subdomains: "abcd",
  })
    .on("tileerror", function () {
      // Fallback to OSM
      L.tileLayer(CONFIG.tileFallback, { maxZoom: 19 }).addTo(map);
    })
    .addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

// ===== Geolocation =====
function requestLocation() {
  if (!navigator.geolocation) {
    showEmpty();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
      map.setView([userLat, userLon], CONFIG.defaultZoom);
      setUserMarker(userLat, userLon);
      fetchNearbyStations(userLat, userLon);
    },
    (err) => {
      console.warn("Geolocation error:", err.message);
      // Use default location
      userLat = CONFIG.defaultLat;
      userLon = CONFIG.defaultLon;
      fetchNearbyStations(userLat, userLon);
    },
    { enableHighAccuracy: true, timeout: 8000 },
  );
}

function setUserMarker(lat, lon) {
  if (userMarker) map.removeLayer(userMarker);

  const icon = L.divIcon({
    className: "",
    html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
                <div style="width:16px;height:16px;border-radius:50%;background:#135bec;border:3px solid #fff;box-shadow:0 2px 8px rgba(19,91,236,0.35);"></div>
                <div style="width:32px;height:32px;border-radius:50%;background:rgba(19,91,236,0.12);position:absolute;top:-8px;animation:pulse-blue 2s infinite;"></div>
            </div>
        `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  userMarker = L.marker([lat, lon], { icon, zIndexOffset: 1000 }).addTo(map);
}

// ===== API Fetch =====
async function fetchNearbyStations(lat, lon) {
  showLoading();

  try {
    const res = await fetch(`${CONFIG.apiEndpoint}?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.success) throw new Error("API returned error");

    // Merge fuel stations and chargers into a unified list
    const fuelStations = (data.results?.fuelStations || []).map((s) => ({
      type: "fuel",
      name: s["Rótulo"] || "Gasolinera",
      address: s["Dirección"] || s.address || "",
      locality: s["Municipio"] || s["Localidad"] || "",
      lat: s.lat,
      lon: s.lon,
      distance: s.distance,
      priceDiesel: parsePrice(s["Precio Gasoleo A"]),
      priceGasolina95: parsePrice(s["Precio Gasolina 95 E5"]),
      priceGasolina98: parsePrice(s["Precio Gasolina 98 E5"]),
      schedule: s["Horario"] || "",
    }));

    const evChargers = (data.results?.chargers || []).map((c) => ({
      type: "ev",
      name: c.name || "Cargador EV",
      address: c.address || "",
      locality: "",
      lat: c.latitude,
      lon: c.longitude,
      distance: c.distance,
      connectors: c.connectors || [],
      maxPower: getMaxPower(c.connectors),
    }));

    allStations = [...fuelStations, ...evChargers];
    renderAll();
  } catch (err) {
    console.error("Fetch error:", err);
    showEmpty();
  }
}

function parsePrice(val) {
  if (!val) return null;
  const clean = val.toString().replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

function getMaxPower(connectors) {
  if (!connectors || !connectors.length) return null;
  const powers = connectors.map((c) => parseFloat(c.power) || 0);
  return Math.max(...powers);
}

// ===== Rendering =====
function renderAll() {
  const filtered = filterStations(allStations);
  const sorted = sortStations(filtered);
  renderMarkers(sorted);
  renderList(sorted);
}

function filterStations(stations) {
  if (currentFilter === "all") return stations;
  if (currentFilter === "electrico")
    return stations.filter((s) => s.type === "ev");
  if (currentFilter === "diesel")
    return stations.filter((s) => s.type === "fuel" && s.priceDiesel);
  if (currentFilter === "gasolina95")
    return stations.filter((s) => s.type === "fuel" && s.priceGasolina95);
  return stations;
}

function sortStations(stations) {
  return [...stations].sort((a, b) => {
    const pa = getDisplayPrice(a);
    const pb = getDisplayPrice(b);
    if (pa === null && pb === null) return a.distance - b.distance;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return sortAsc ? pa - pb : pb - pa;
  });
}

function getDisplayPrice(s) {
  if (s.type === "ev") return null;
  if (currentFilter === "gasolina95") return s.priceGasolina95;
  if (currentFilter === "diesel" || currentFilter === "all")
    return s.priceDiesel || s.priceGasolina95;
  return s.priceDiesel || s.priceGasolina95;
}

function getFuelLabel(s) {
  if (s.type === "ev") return null;
  if (currentFilter === "gasolina95") return "Gasolina 95";
  return s.priceDiesel ? "Diésel" : "Gasolina 95";
}

// ---- Map Markers ----
function renderMarkers(stations) {
  markersLayer.clearLayers();

  // Find best price for highlighting
  const fuelPrices = stations
    .filter((s) => s.type === "fuel" && getDisplayPrice(s))
    .map((s) => getDisplayPrice(s));
  const bestPrice = fuelPrices.length ? Math.min(...fuelPrices) : null;

  stations.forEach((s, i) => {
    if (!s.lat || !s.lon) return;

    const price = getDisplayPrice(s);
    const isBest = price !== null && price === bestPrice;
    const isEV = s.type === "ev";

    let label = "";
    let extraClass = "";

    if (isEV) {
      label = s.maxPower ? `⚡ ${s.maxPower}kW` : "⚡ EV";
      extraClass = "ev";
    } else if (price) {
      label = `${price.toFixed(2)}€`;
      extraClass = isBest ? "best" : "";
    } else {
      label = "—";
    }

    const icon = L.divIcon({
      className: "",
      html: `
                <div class="marker-price ${extraClass}">
                    <div class="price-tag">${label}</div>
                    <div class="dot"></div>
                </div>
            `,
      iconSize: [60, 36],
      iconAnchor: [30, 36],
    });

    const marker = L.marker([s.lat, s.lon], { icon })
      .bindPopup(buildPopup(s))
      .addTo(markersLayer);

    // Click on list → fly to marker
    marker._stationIndex = i;
  });
}

function buildPopup(s) {
  const price = getDisplayPrice(s);
  const fuelLabel = getFuelLabel(s);
  const distText = formatDistance(s.distance);

  if (s.type === "ev") {
    const connText = s.connectors
      .map((c) => `${c.type || "?"} — ${c.power}kW`)
      .join("<br>");
    return `
            <div>
                <strong style="color:#22c55e;">⚡ ${escHtml(s.name)}</strong><br>
                <span style="color:#64748b;font-size:12px;">${escHtml(s.address)}</span><br>
                <span style="color:#94a3b8;font-size:11px;">${distText}</span>
                ${connText ? `<div style="margin-top:6px;font-size:11px;color:#475569;">${connText}</div>` : ""}
                <div style="margin-top:8px;">
                    <button class="btn-go" onclick="navigateTo(${s.lat},${s.lon})">
                        Ir <span class="material-icons" style="font-size:14px;">navigation</span>
                    </button>
                </div>
            </div>
        `;
  }

  return `
        <div>
            <strong>${escHtml(capitalize(s.name))}</strong><br>
            <span style="color:#64748b;font-size:12px;">${escHtml(s.address)}</span><br>
            <span style="color:#94a3b8;font-size:11px;">${distText}${s.locality ? " • " + escHtml(s.locality) : ""}</span>
            ${price ? `<div style="margin-top:6px;font-size:18px;font-weight:700;color:#135bec;">${price.toFixed(2)}€ <span style="font-size:10px;color:#94a3b8;font-weight:500;text-transform:uppercase;">${fuelLabel}</span></div>` : ""}
            <div style="margin-top:8px;">
                <button class="btn-go" onclick="navigateTo(${s.lat},${s.lon})">
                    Ir <span class="material-icons" style="font-size:14px;">navigation</span>
                </button>
            </div>
        </div>
    `;
}

// ---- Station List ----
function renderList(stations) {
  if (!stations.length) {
    showEmpty();
    return;
  }

  // Find best price
  const fuelPrices = stations
    .filter((s) => s.type === "fuel" && getDisplayPrice(s))
    .map((s) => getDisplayPrice(s));
  const bestPrice = fuelPrices.length ? Math.min(...fuelPrices) : null;

  $stationList.innerHTML = stations
    .map((s, i) => {
      const price = getDisplayPrice(s);
      const fuelLabel = getFuelLabel(s);
      const isBest = price !== null && price === bestPrice;
      const distText = formatDistance(s.distance);
      const isEV = s.type === "ev";

      // Brand icon
      const iconClass = isEV ? "ev" : "fuel";
      const iconLetter = isEV
        ? "⚡"
        : s.name
          ? s.name.charAt(0).toUpperCase()
          : "G";

      // Price display
      let priceHtml = "";
      if (isEV) {
        priceHtml = `
                <div class="text-right">
                    <div class="text-lg font-bold text-accent-green tracking-tight">${s.maxPower ? s.maxPower + '<span class="text-xs align-top text-slate-400">kW</span>' : "EV"}</div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Eléctrico</div>
                </div>
            `;
      } else if (price) {
        const priceColor = isBest ? "text-accent-red" : "text-primary";
        priceHtml = `
                <div class="text-right">
                    <div class="text-xl font-bold ${priceColor} tracking-tight">${price.toFixed(2)}<span class="text-sm align-top text-slate-400">€</span></div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wide font-medium">${fuelLabel}</div>
                </div>
            `;
      }

      return `
            <div class="station-card" onclick="flyToStation(${s.lat}, ${s.lon})" data-index="${i}">
                ${isBest ? '<div class="badge-best">MEJOR PRECIO</div>' : ""}
                <div class="flex items-center gap-3.5">
                    <div class="brand-icon ${iconClass}">${iconLetter}</div>
                    <div>
                        <h3 class="text-slate-800 font-medium text-sm leading-tight mb-1">${escHtml(capitalize(s.name))}</h3>
                        <div class="flex items-center text-slate-400 text-xs font-light">
                            <span class="material-icons text-[12px] mr-1">near_me</span>
                            <span>${distText}</span>
                            ${s.address ? `<span class="mx-1.5 text-slate-300">•</span><span class="truncate max-w-[120px]">${escHtml(s.address)}</span>` : ""}
                        </div>
                    </div>
                </div>
                ${priceHtml}
            </div>
        `;
    })
    .join("");

  $loading.classList.add("hidden");
  $empty.classList.add("hidden");
  $stationList.classList.remove("hidden");
}

// ===== Helpers =====
function formatDistance(km) {
  if (!km && km !== 0) return "";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function capitalize(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function escHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showLoading() {
  $loading.classList.remove("hidden");
  $empty.classList.add("hidden");
  $stationList.classList.add("hidden");
}

function showEmpty() {
  $loading.classList.add("hidden");
  $empty.classList.remove("hidden");
  $empty.classList.add("flex");
  $stationList.classList.add("hidden");
}

// ===== Navigation =====
function navigateTo(lat, lon) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  window.open(url, "_blank");
}

function flyToStation(lat, lon) {
  if (lat && lon) {
    map.flyTo([lat, lon], 16, { duration: 0.8 });
  }
}

// ===== Event Handlers =====
$btnLocate.addEventListener("click", () => {
  if (userLat && userLon) {
    map.flyTo([userLat, userLon], CONFIG.defaultZoom, { duration: 0.6 });
  } else {
    requestLocation();
  }
});

$btnRetry?.addEventListener("click", () => requestLocation());

$sortToggle.addEventListener("click", () => {
  sortAsc = !sortAsc;
  $sortToggle.querySelector("span:first-child").textContent = sortAsc
    ? "Precio: Menor a Mayor"
    : "Precio: Mayor a Menor";
  $sortToggle.querySelector(".material-icons").textContent = sortAsc
    ? "expand_more"
    : "expand_less";
  renderAll();
});

$filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    $filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    renderAll();
  });
});

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  requestLocation();
});
