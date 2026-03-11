/* ============================================================
   js/novel-engine.js – Visual Novel Dialog Engine
   Manages conversation tree, typewriter effect, and choices
   ============================================================ */

const NovelEngine = (() => {

    /* ── Dialog tree (nodes) ── */
    const TREE = {
        root: {
            speaker: 'Guanchito',
            text: '¡Oye, forastero! 🌋 Soy el Guanchito, guardián de los secretos de las islas. ¿Qué quieres descubrir hoy?',
            choices: [
                { key: 'A', icon: '🗺️', label: 'Dónde Comprar', action: () => Router.go('donde-comprar') },
                { key: 'B', icon: '🌿', label: 'Quiénes Somos', action: () => Router.go('quienes-somos') },
                { key: 'C', icon: '🎉', label: 'Eventos', action: () => Router.go('eventos') },
                { key: 'D', icon: '✨', label: 'Explorar Más', action: () => NovelEngine.showNode('more') },
            ]
        },

        more: {
            speaker: 'Guanchito',
            text: 'Tengo más secretos que contarte… ¿Por dónde te llevo?',
            choices: [
                { key: 'A', icon: '🃏', label: 'Las Cartas', action: () => Router.go('cartas') },
                { key: 'B', icon: '🔬', label: 'Investigación', action: () => Router.go('investigacion') },
                { key: 'C', icon: '🌊', label: 'Historia', action: () => Router.go('historia') },
                { key: 'D', icon: '✂️', label: 'Contacto', action: () => Router.go('contacto') },
                { key: 'H', icon: '←', label: 'Atrás', action: () => NovelEngine.showNode('root') },
            ]
        },

        // ── Return node after section ──
        return: {
            speaker: 'Guanchito',
            text: '¿Qué más quieres explorar? Tengo muchas historias de las 7 islas...',
            choices: [
                { key: 'A', icon: '🗺️', label: 'Dónde Comprar', action: () => Router.go('donde-comprar') },
                { key: 'B', icon: '🌿', label: 'Quiénes Somos', action: () => Router.go('quienes-somos') },
                { key: 'C', icon: '🎉', label: 'Próximos Eventos', action: () => Router.go('eventos') },
                { key: 'D', icon: '✨', label: 'Más Secciones', action: () => NovelEngine.showNode('more') },
                { key: 'H', icon: '🏠', label: 'Ir al Inicio', action: () => Router.go('landing') },
            ]
        }
    };

    /* ── Live DOM refs — re-resolved after each page render ── */
    let overlay = null;
    let textEl = null;
    let choicesEl = null;

    let _typing = false;
    let _typeTimer = null;
    let _currentNode = 'root';

    /* ── Re-query DOM refs from the freshly injected page ── */
    function resolveRefs() {
        overlay = document.getElementById('novel-overlay');
        textEl = document.getElementById('novel-text');
        choicesEl = document.getElementById('novel-choices');
    }

    let _observer = null;

    /* ── Init: listen for page renders ── */
    function init() {
        document.addEventListener('keydown', handleKey);

        document.addEventListener('pageRendered', ({ detail }) => {
            if (detail.mode === 'classic') return; // skip in classic mode
            resolveRefs();
            if (!overlay) return;

            const node = detail.pageId === 'landing' ? 'root' : 'return';

            if (_observer) {
                _observer.disconnect();
                _observer = null;
            }

            if (window.IntersectionObserver) {
                _observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            showNode(node, detail.pageId !== 'landing');
                            if (_observer) {
                                _observer.disconnect();
                                _observer = null;
                            }
                        }
                    });
                }, { threshold: 0.1 });

                _observer.observe(overlay);
            } else {
                showNode(node, detail.pageId !== 'landing');
            }
        });
    }

    /* ── Show a node ── */
    function showNode(nodeId, delayed = false) {
        resolveRefs();
        if (!overlay) return;

        _currentNode = nodeId;
        const node = TREE[nodeId];
        if (!node) return;

        // Clear choices immediately
        if (choicesEl) choicesEl.innerHTML = '';

        const doShow = () => {
            overlay.classList.add('visible');
            typeText(node.text, () => renderChoices(node.choices));
        };

        delayed ? setTimeout(doShow, 800) : doShow();
    }

    /* ── Typewriter effect ── */
    function typeText(text, onDone) {
        resolveRefs();
        if (!textEl) return;
        if (_typeTimer) clearTimeout(_typeTimer);

        _typing = true;
        textEl.textContent = '';
        textEl.classList.add('typing');

        const chars = Array.from(text);
        let i = 0;

        function nextChar() {
            if (!textEl) return; // guard against page re-renders
            if (i < chars.length) {
                textEl.textContent += chars[i++];
                _typeTimer = setTimeout(nextChar, 22);
            } else {
                textEl.classList.remove('typing');
                _typing = false;
                if (onDone) onDone();
            }
        }
        nextChar();
    }

    /* ── Render choice buttons ── */
    function renderChoices(choices) {
        resolveRefs();
        if (!choicesEl) return;
        choicesEl.innerHTML = '';

        choices.forEach((c, idx) => {
            const btn = document.createElement('button');
            btn.className = 'novel-choice';
            btn.style.animationDelay = `${idx * 0.07}s`;
            btn.innerHTML = `
        <span class="novel-choice-icon">${c.icon}</span>
        <span>${c.label}</span>
      `;
            btn.addEventListener('click', () => handleChoice(c));
            choicesEl.appendChild(btn);
        });
    }

    /* ── Handle a choice ── */
    function handleChoice(choice) {
        resolveRefs();
        if (overlay) overlay.classList.remove('visible');
        setTimeout(() => choice.action(), 300);
    }

    /* ── Keyboard shortcut handler ── */
    function handleKey(e) {
        if (Router.getMode() !== 'novel') return;
        const node = TREE[_currentNode];
        if (!node) return;

        if ((e.code === 'Space' || e.code === 'Enter') && _typing) {
            e.preventDefault();
            if (_typeTimer) clearTimeout(_typeTimer);
            if (textEl) { textEl.textContent = node.text; textEl.classList.remove('typing'); }
            _typing = false;
            renderChoices(node.choices);
            return;
        }

        // Removed specific alphabet character handling per user request
    }

    function reset() { showNode('root'); }

    return { init, showNode, reset };
})();

window.NovelEngine = NovelEngine;
