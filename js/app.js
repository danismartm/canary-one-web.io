/* ============================================================
   js/app.js – Application entry point
   Boots the router, novel engine, and all sub-modules
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    /* ── 1. Init sub-modules (order matters) ── */
    Router.init();
    NovelEngine.init();
    Effects.init();
    CarouselModule.init();
    MapModule.listenForRender();
    FormModule.listenForRender();

    /* ── 2. Load landing page first ── */
    await Router.go('landing');

    /* ── 3. Classic navbar: wire up buttons ── */
    wireClassicNav();

    /* ── 4. Mobile hamburger ── */
    const ham = document.getElementById('nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (ham && navLinks) {
        ham.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('button:not(.dropdown-toggle)').forEach(btn => {
            btn.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    /* ── 5. Theme Toggle ── */
    initThemeToggle();

});

/* ── Wire classic nav buttons to router ── */
function wireClassicNav() {
    const navActions = {
        'nav-home': () => Router.go('landing'),
        'nav-buy': () => Router.go('donde-comprar'),
        'nav-about': () => Router.go('quienes-somos'),
        'nav-events': () => Router.go('eventos'),
        'nav-cards': () => Router.go('cartas'),
        'nav-research': () => Router.go('investigacion'),
        'nav-story': () => Router.go('historia'),
        'nav-contact': () => Router.go('contacto'),
        'nav-cta-buy': () => Router.go('donde-comprar'),
        'nav-logo-btn': () => Router.go('landing'),
    };

    Object.entries(navActions).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    });

    // Also listen for mode changes to re-wire (nav stays in DOM)
    document.addEventListener('modeChanged', ({ detail }) => {
        if (detail.mode === 'classic') wireClassicNav();
    });
}

/* ── Light / Dark Mode Toggle ── */
function initThemeToggle() {
    const html = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const btnMobile = document.getElementById('theme-toggle-mobile');

    // Configuración inicial leída del localStorage
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    if (savedTheme === 'light') {
        html.setAttribute('data-theme', 'light');
        if (btn) btn.textContent = '🌙';
        if (btnMobile) btnMobile.textContent = '🌙';
    }

    const toggleFn = () => {
        if (html.getAttribute('data-theme') === 'light') {
            html.removeAttribute('data-theme'); // Volver a oscuro (default)
            localStorage.setItem('app-theme', 'dark');
            if (btn) btn.textContent = '☀️';
            if (btnMobile) btnMobile.textContent = '☀️';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('app-theme', 'light');
            if (btn) btn.textContent = '🌙';
            if (btnMobile) btnMobile.textContent = '🌙';
        }
    };

    if (btn) btn.addEventListener('click', toggleFn);
    if (btnMobile) btnMobile.addEventListener('click', toggleFn);
}
