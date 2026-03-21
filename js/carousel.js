/* ============================================================
   js/carousel.js – 3D Carousel Module
   Handles auto-rotation, clicking, and dragging for the landing
   ============================================================ */

const CarouselModule = (() => {
    let pivot = null;
    let cards = [];
    let rotateY = 0;
    let currentIndex = 0; // Real tracked index
    let isPaused = false;
    const angleStep = 360 / 13;
    let clickRotateTimeout = null;
    let animationId = null;

    /* ── Init: listen for render ── */
    function init() {
        document.addEventListener('pageRendered', ({ detail }) => {
            if (detail.pageId === 'landing') {
                attach();
            } else {
                cleanup();
            }
        });
    }

    /* ── Attach functionality to DOM ── */
    function attach() {
        pivot = document.getElementById('carouselPivot');
        cards = document.querySelectorAll('.carousel-card');
        if (!pivot) return;

        rotateY = 0;
        currentIndex = 0;
        isPaused = false;
        
        cancelAnimationFrame(animationId);
        rotate();

        // One-by-one click navigation
        cards.forEach((card, index) => {
            card.onclick = (e) => {
                isPaused = true;

                // Simple shortest-path logic to move +1 or -1
                // We calculate distance from the current front normalized to 0-12
                let normalizedCurrent = Math.round(-rotateY / angleStep) % 13;
                if (normalizedCurrent < 0) normalizedCurrent += 13;

                let diff = index - normalizedCurrent;
                if (diff > 6) diff -= 13;
                if (diff < -6) diff += 13;

                if (diff === 0) return; // Clicked the one already in front

                // Limit movement to 1 card per click as requested
                const step = diff > 0 ? 1 : -1;
                
                // Align rotateY to the nearest valid card angle first to avoid drift
                rotateY = Math.round(rotateY / angleStep) * angleStep;
                rotateY -= step * angleStep;

                pivot.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                pivot.style.transform = `perspective(1200px) rotateY(${rotateY}deg)`;
                
                clearTimeout(clickRotateTimeout);
                clickRotateTimeout = setTimeout(() => {
                    if (pivot) pivot.style.transition = '';
                    isPaused = false;
                }, 3000);
            };
        });
    }

    /* ── Animation loop ── */
    function rotate() {
        if (pivot && !isPaused) {
            rotateY -= 0.1; 
            pivot.style.transform = `perspective(1200px) rotateY(${rotateY}deg)`;
        }
        animationId = requestAnimationFrame(rotate);
    }

    /* ── Cleanup when leaving landing ── */
    function cleanup() {
        cancelAnimationFrame(animationId);
        pivot = null;
    }

    return { init };
})();

window.CarouselModule = CarouselModule;
