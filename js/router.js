/* ============================================================
   js/router.js – Application State Machine
   Novel mode (default) ↔ Classic mode (triggered by SOS)
   ============================================================ */

const Router = (() => {
    /* ── State ── */
    let _mode = 'classic';   // 'classic' is now the default
    let _current = 'landing'; // current page id

    /* ── DOM refs ── */
    let appEl, navEl, sosBtn, pageContent;

    const PAGES = ['landing', 'donde-comprar', 'quienes-somos', 'eventos', 'cartas', 'investigacion', 'contacto', 'historia'];

    /* ── The novel dialog HTML snippet injected at the bottom of every page ── */
    const DIALOG_HTML = `
    <div id="novel-overlay" role="dialog" aria-label="Diálogo del Guanchito" aria-live="polite">
      <div class="novel-container">
        <!-- Figura de Guanchito gigante -->
        <img class="guanchito-character" src="assets/guanchito.png" alt="Guanchito animado" />

        <!-- Columna derecha animada -->
        <div class="novel-interact-area">
          <!-- Bocadillo de texto interactivo -->
          <div class="novel-dialog">
            <div id="novel-text"></div>
          </div>
          
          <!-- Opciones fuera del bocadillo -->
          <div class="novel-choices" id="novel-choices"></div>
        </div>
      </div>
    </div>`;

    /* ── Init ── */
    function init() {
        appEl = document.getElementById('app');
        navEl = document.getElementById('classic-nav');
        sosBtn = document.getElementById('sos-btn');
        pageContent = document.getElementById('page-content');

        // On start, if classic mode, show navbar
        if (_mode === 'classic') {
            navEl.classList.add('visible');
            document.body.classList.add('classic');
        }

        sosBtn.addEventListener('click', () => {
            _mode === 'classic' ? enableNovel() : enableClassic();
        });
    }

    /* ── Navigate to a page ── */
    async function go(pageId, opts = {}) {
        if (!PAGES.includes(pageId)) { console.warn('Unknown page:', pageId); return; }

        // Exit animation
        pageContent.classList.add('page-exit');
        await wait(350);

        // Load & render page HTML
        _current = pageId;
        const html = await loadPage(pageId);

        // In novel mode: append the dialog after the page HTML
        pageContent.innerHTML = _mode === 'novel'
            ? html + DIALOG_HTML
            : html;

        pageContent.classList.remove('page-exit');
        pageContent.classList.add('page-enter');

        requestAnimationFrame(() => {
            pageContent.classList.remove('page-enter');
            // Dispatch so other modules can react (novel-engine re-queries refs here)
            document.dispatchEvent(new CustomEvent('pageRendered', { detail: { pageId, mode: _mode } }));
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: opts.smooth ? 'smooth' : 'instant' });
    }

    /* ── Classic mode (Navbar mode - Default) ── */
    async function enableClassic() {
        _mode = 'classic';
        document.body.classList.add('classic');

        navEl.classList.add('visible');
        sosBtn.classList.remove('novel-active');
        sosBtn.querySelector('.sos-label').textContent = '🆘 Socorro / Guanchito';

        // Re-render current page without the dialog
        pageContent.classList.add('page-exit');
        await wait(300);
        const html = await loadPage(_current);
        pageContent.innerHTML = html; // no DIALOG_HTML appended
        pageContent.classList.remove('page-exit');
        pageContent.classList.add('page-enter');
        requestAnimationFrame(() => {
            pageContent.classList.remove('page-enter');
            document.dispatchEvent(new CustomEvent('pageRendered', { detail: { pageId: _current, mode: 'classic' } }));
        });

        document.dispatchEvent(new CustomEvent('modeChanged', { detail: { mode: 'classic' } }));
    }

    /* ── Novel mode (Visual Novel / Guanchito) ── */
    async function enableNovel() {
        _mode = 'novel';
        document.body.classList.remove('classic');

        // Hide navbar in novel mode
        navEl.classList.remove('visible');
        sosBtn.classList.add('novel-active');
        sosBtn.querySelector('.sos-label').textContent = '❌ Cerrar Ayuda';

        // Re-render current page with dialog re-injected
        await go(_current);

        document.dispatchEvent(new CustomEvent('modeChanged', { detail: { mode: 'novel' } }));
    }

    /* ── Helpers ── */
    const _cache = {};
    async function loadPage(pageId) {
        // if (_cache[pageId]) return _cache[pageId]; // TEMPORARY DISABLE CACHE
        const res = await fetch(`pages/${pageId}.html?v=${Date.now()}`); // Force fetch
        if (!res.ok) throw new Error(`Page not found: ${pageId}`);
        _cache[pageId] = await res.text();
        return _cache[pageId];
    }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function getMode() { return _mode; }
    function getCurrent() { return _current; }

    return { init, go, enableClassic, enableNovel, getMode, getCurrent, loadPage };
})();

window.Router = Router;
