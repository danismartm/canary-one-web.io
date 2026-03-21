/* ============================================================
   js/map.js – Leaflet map with island filter for Dónde Comprar
   ============================================================ */

const MapModule = (() => {

    const STORES = [
        // Tenerife
        { name: 'Museo de la Naturaleza y el Hombre', lat: 28.4636, lng: -16.2518, island: 'Tenerife', type: 'museum', address: 'C/ Fuente Morales s/n, S/C de Tenerife' },
        { name: 'Librería Lemus', lat: 28.4674, lng: -16.2601, island: 'Tenerife', type: 'books', address: 'C/ Pérez Galdós 3, S/C de Tenerife' },
        { name: 'Tienda Cabildo de Tenerife', lat: 28.4615, lng: -16.2479, island: 'Tenerife', type: 'store', address: 'Plaza de España, S/C de Tenerife' },
        { name: 'Multitienda Las Américas', lat: 28.0560, lng: -16.7260, island: 'Tenerife', type: 'store', address: 'Av. de las Américas, Arona, Tenerife Sur' },
        { name: 'Librería La Isla', lat: 28.4682, lng: -16.2546, island: 'Tenerife', type: 'books', address: 'C/ Imeldo Serís 75, S/C de Tenerife' },
        { name: 'TEA Tenerife Espacio de las Artes', lat: 28.4651, lng: -16.2505, island: 'Tenerife', type: 'museum', address: 'Av. de San Sebastián 10, S/C de Tenerife' },
        { name: 'Canarias Shop Aeropuerto Norte', lat: 28.4827, lng: -16.3416, island: 'Tenerife', type: 'store', address: 'Aeropuerto de Tenerife Norte, San Cristóbal de La Laguna' },

        // Gran Canaria
        { name: 'Librería del Cabildo', lat: 28.1004, lng: -15.4134, island: 'Gran Canaria', type: 'books', address: 'C/ Triana 34, Las Palmas de G.C.' },
        { name: 'Museo Canario', lat: 28.0997, lng: -15.4137, island: 'Gran Canaria', type: 'museum', address: 'C/ Dr. Verneau 2, Las Palmas de G.C.' },
        { name: 'Artesanía Gran Canaria', lat: 28.1355, lng: -15.4362, island: 'Gran Canaria', type: 'store', address: 'C/ Néstor de la Torre 7, Las Palmas' },
        // Lanzarote
        { name: 'MIAC – Castillo de San José', lat: 28.9635, lng: -13.5477, island: 'Lanzarote', type: 'museum', address: 'Ctra. Puerto del Arrecife, Lanzarote' },
        { name: 'Librería Arrecife', lat: 28.9633, lng: -13.5480, island: 'Lanzarote', type: 'books', address: 'C/ León y Castillo 4, Arrecife' },
        // Fuerteventura
        { name: 'Artesanía Majorera', lat: 28.4993, lng: -13.8626, island: 'Fuerteventura', type: 'store', address: 'Puerto del Rosario, Fuerteventura' },
        { name: 'Museo del Queso Majorero', lat: 28.3597, lng: -14.1052, island: 'Fuerteventura', type: 'museum', address: 'Antigua, Fuerteventura' },
        // La Palma
        { name: 'Librería Islas Verdes', lat: 28.6835, lng: -17.7642, island: 'La Palma', type: 'books', address: 'S/C de La Palma' },
        { name: 'Tienda Museo Arqueológico', lat: 28.6762, lng: -17.7641, island: 'La Palma', type: 'museum', address: 'C/ Virgen de la Luz, S/C de La Palma' },
        // La Gomera
        { name: 'Artesanía La Gomera', lat: 28.0916, lng: -17.1097, island: 'La Gomera', type: 'store', address: 'San Sebastián de La Gomera' },
        // El Hierro
        { name: 'Tienda El Hierro Canario', lat: 27.7434, lng: -18.0063, island: 'El Hierro', type: 'store', address: 'Valverde, El Hierro' }
    ];

    const ISLAND_VIEWS = {
        'Tenerife': { center: [28.29, -16.5], zoom: 9.5 },
        'Gran Canaria': { center: [27.96, -15.57], zoom: 10 },
        'Lanzarote': { center: [29.07, -13.6], zoom: 10 },
        'Fuerteventura': { center: [28.40, -14.15], zoom: 9.4 },
        'La Palma': { center: [28.65, -17.85], zoom: 10.2 },
        'La Gomera': { center: [28.115, -17.25], zoom: 11.2 },
        'El Hierro': { center: [27.74, -18.02], zoom: 11 },
        'all': { center: [28.4, -15.6], zoom: 7 },
    };

    const TYPE_ICONS = { store: '🛍️', museum: '🏛️', books: '📖' };
    const TYPE_LABELS = { store: 'Tienda', museum: 'Museo', books: 'Librería' };
    const PIN_COLORS = { store: '#d4a843', museum: '#14b8b8', books: '#a97ef0' };

    let _map = null;
    let _markers = [];

    /* ── Build a coloured pin icon ─────────────────── */
    function _pinIcon(type) {
        const color = PIN_COLORS[type] || '#d4a843';
        return L.divIcon({
            className: '',
            html: `<div style="
                width:28px;height:28px;border-radius:50% 50% 50% 0;
                background:${color};transform:rotate(-45deg);
                border:3px solid rgba(var(--navy-rgb),.7);
                box-shadow:0 4px 14px rgba(0,0,0,.45);
            "></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
        });
    }

    /* ── Apply active class to list item ── */
    function _selectListItem(selectedIndex) {
        document.querySelectorAll('.store-item').forEach((item, i) => {
            item.classList.remove('active');
            if (i === selectedIndex) item.classList.add('active');
        });
    }

    /* ── Render store list on the right panel ──────── */
    function _renderList(island) {
        const listEl = document.getElementById('storeList');
        if (!listEl) return;
        const filtered = island === 'all' ? STORES : STORES.filter(s => s.island === island);
        if (!filtered.length) {
            listEl.innerHTML = `<p class="no-stores">No hay puntos de venta registrados en esta isla aún.</p>`;
            return;
        }
        listEl.innerHTML = filtered.map((s, index) => `
            <div class="store-item" data-index="${index}">
                <div class="store-icon">${TYPE_ICONS[s.type] || '📍'}</div>
                <div class="store-info">
                    <h4>${s.name}</h4>
                    <p>${s.address}</p>
                    <span class="store-tag ${s.type}">${TYPE_LABELS[s.type] || s.type}</span>
                </div>
            </div>
        `).join('');

        // Add click events to list items
        const items = listEl.querySelectorAll('.store-item');
        items.forEach(item => {
            const idx = parseInt(item.dataset.index);
            item.addEventListener('click', () => {
                _selectListItem(idx);
                if (_markers[idx]) {
                    _markers[idx].openPopup();
                    _map.flyTo(_markers[idx].getLatLng(), 15, { duration: 0.8 });
                }
            });
        });
    }

    /* ── Filter map markers for the selected island ─ */
    function _filterMap(island) {
        if (!_map) return;

        // Remove existing markers
        _markers.forEach(m => _map.removeLayer(m));
        _markers = [];

        const filtered = island === 'all' ? STORES : STORES.filter(s => s.island === island);
        filtered.forEach((s, index) => {
            const marker = L.marker([s.lat, s.lng], { icon: _pinIcon(s.type) })
                .addTo(_map)
                .bindPopup(`
                    <div style="min-width:180px">
                        <strong style="color:#d4a843">${s.name}</strong><br/>
                        <small style="color:#9bacc4">📍 ${s.island}</small><br/>
                        <small style="color:#9bacc4">${s.address}</small>
                    </div>
                `, { offset: [0, -20] });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map click from firing
                _selectListItem(index);
                _map.flyTo([s.lat, s.lng], 15, { duration: 0.8 });
                // Scroll list item into view
                const item = document.querySelector(`.store-item[data-index="${index}"]`);
                if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            _markers.push(marker);
        });

        // Fly to island view
        const view = ISLAND_VIEWS[island] || ISLAND_VIEWS['all'];
        _map.flyTo(view.center, view.zoom, { duration: 1.2 });
    }

    /* ── Initialise / re-initialise the map ─────────── */
    function init() {
        const el = document.getElementById('buyMap');
        if (!el || !window.L) return;

        // Destroy any previous Leaflet instance (router re-renders the DOM)
        if (_map) { _map.remove(); _map = null; }
        _markers = [];

        _map = L.map('buyMap', {
            center: ISLAND_VIEWS['Tenerife'].center,
            zoom: ISLAND_VIEWS['Tenerife'].zoom,
            zoomControl: true,
            scrollWheelZoom: true,
            touchZoom: true,
            dragging: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(_map);

        // Click on map background → clear selection
        _map.on('click', () => {
            _selectListItem(null);
        });

        // Load default island: Tenerife
        _filterMap('Tenerife');
        _renderList('Tenerife');

        // Wire up island selector
        const sel = document.getElementById('islandSelect');
        if (sel) {
            // Ensure Tenerife is selected visually
            sel.value = 'Tenerife';

            // Fix to recenter when the user re-selects the same island (closing dropdown)
            // without recentering when they merely open the dropdown
            let isDropdownOpen = false;

            sel.addEventListener('change', () => {
                _filterMap(sel.value);
                _renderList(sel.value);
                isDropdownOpen = false;
            });

            sel.addEventListener('click', () => {
                if (isDropdownOpen) {
                    const view = ISLAND_VIEWS[sel.value];
                    if (_map && view) {
                        _map.flyTo(view.center, view.zoom, { duration: 1.2 });
                    }
                    isDropdownOpen = false;
                } else {
                    isDropdownOpen = true;
                }
            });

            sel.addEventListener('blur', () => {
                isDropdownOpen = false;
            });
        }

        // Wire up reset map button
        const resetBtn = document.getElementById('resetMapBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map click from firing
                const currentIsland = sel ? sel.value : 'Tenerife';
                const view = ISLAND_VIEWS[currentIsland] || ISLAND_VIEWS['all'];
                if (_map && view) {
                    _map.flyTo(view.center, view.zoom, { duration: 1.2 });
                    _selectListItem(null); // Clear selected list item purely visually
                }
            });
        }

        // Force Leaflet to recalculate map size after it is rendered in the DOM
        setTimeout(() => {
            if (_map) {
                _map.invalidateSize();
                _filterMap(sel ? sel.value : 'Tenerife');
                _renderList(sel ? sel.value : 'Tenerife');
            }
        }, 100);
    }

    /* ── Listen for router page-render events ──────── */
    function listenForRender() {
        document.addEventListener('pageRendered', ({ detail }) => {
            if (detail.pageId === 'donde-comprar') {
                // Small delay to ensure Leaflet container is in the DOM
                setTimeout(init, 120);
            }
        });
    }

    return { init, listenForRender };
})();

window.MapModule = MapModule;
