// ============================================================
// ⚡ MODO RENDIMIENTO (ajuste manual + por defecto en móvil)
// ============================================================
// Desactiva blur (backdrop-filter), sombras y filtros, y usa PNG
// estáticos en vez de GIF animados. Los GIF son la causa principal
// de tirones en móvil: 10 animaciones decodificando a la vez.
// En móvil viene activado por defecto; en PC, desactivado.
// ============================================================
(function () {
    const KEY = 'pktft_graficosLigeros';
    const BTN = 'btnGraficosLigeros';
    const UA = navigator.userAgent || '';

    function esMovil() {
        try {
            return (navigator.maxTouchPoints || 0) > 0 ||
                matchMedia('(pointer: coarse)').matches ||
                /Android|iPhone|iPad|iPod|Mobile/i.test(UA) ||
                innerWidth <= 1100;
        } catch (e) { return false; }
    }

    function leer() {
        try {
            const v = localStorage.getItem(KEY);
            return v === null ? null : v === '1';
        } catch (e) { return null; }
    }
    function guardar(on) {
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { }
    }
    function actualizarBoton(on) {
        const b = document.getElementById(BTN);
        if (!b) return;
        b.textContent = on ? '⚡ Modo rendimiento: ON' : '⚡ Modo rendimiento: OFF';
        b.title = 'Sin animaciones de sprites, blur ni sombras. Actívalo si notas tirones.';
    }
    function aplicar(on) {
        on = !!on;
        if (document.body) document.body.classList.toggle('graficos-ligeros', on);
        window.SPRITES_ESTATICOS = on;
        actualizarBoton(on);
    }

    // Vuelve a pintar las vistas actuales para que cambien GIF ↔ PNG.
    function refrescarSprites() {
        if (document.body.classList.contains('combatiendo')) return; // no a mitad de combate
        try {
            if (typeof renderizarTableroJugador === 'function') renderizarTableroJugador();
            if (typeof renderizarTableroEnemigo === 'function') renderizarTableroEnemigo();
            if (typeof renderizarBanquilloJugador === 'function') renderizarBanquilloJugador();
            if (typeof renderizarBanquilloEnemigo === 'function') renderizarBanquilloEnemigo();
            const ov = document.getElementById('tiendaOverlay');
            if (ov && ov.classList.contains('visible') && typeof renderizarTiendaIndependiente === 'function') {
                renderizarTiendaIndependiente(true);
            }
        } catch (e) { }
    }

    function init() {
        const pref = leer();
        const on = (pref === null) ? false : pref;
        aplicar(on);
        if (pref === null) guardar(on); // fija la preferencia inicial

        const b = document.getElementById(BTN);
        if (b) {
            b.addEventListener('click', function (e) {
                e.preventDefault();
                const nuevo = !document.body.classList.contains('graficos-ligeros');
                guardar(nuevo);
                aplicar(nuevo);
                refrescarSprites();
                if (typeof playUISound === 'function') playUISound('click.mp3', 0.08);
            });
        }
    }

    // Aplicar cuanto antes (el script va al final del body)
    if (document.body) {
        const pref = leer();
        aplicar(pref === null ? false : pref);
    }

    // ============================================================
    // 🎞️ SPrites estáticos SOLO durante el combate (móvil)
    // Mantiene las animaciones en tienda/banco/menú, pero evita que
    // 10 GIF animen a la vez mientras se pelea. Se restauran al acabar.
    // ============================================================
    function convertirASpriteEstatico(img) {
        const src = img.getAttribute('src') || '';
        if (!src || src.indexOf('/pokemon/') === -1 || src.indexOf('/static/') !== -1) return;
        if (!/\.gif(\?|$)/.test(src)) return;
        if (!img.dataset.srcAnimado) img.dataset.srcAnimado = src;
        // Si faltara el PNG estático, volver al GIF original
        img.onerror = function () { this.onerror = null; if (this.dataset.srcAnimado) this.src = this.dataset.srcAnimado; };
        img.src = src.replace('/pokemon/', '/pokemon/static/').replace(/\.gif(\?|$)/, '.png');
    }

    window.spritesCombate = {
        estaticos: function () {
            if (!esMovil() || window.SPRITES_ESTATICOS) return;
            try {
                document.querySelectorAll(
                    '#playerBoard .unit-sprite, #enemigoBoard .unit-sprite, ' +
                    '#banquilloGrid .unit-sprite, #enemyBanquilloGrid .unit-sprite'
                ).forEach(convertirASpriteEstatico);
            } catch (e) { }
        },
        restaurar: function () {
            try {
                document.querySelectorAll('.unit-sprite[data-src-animado]').forEach(function (img) {
                    img.onerror = null;
                    img.src = img.dataset.srcAnimado;
                    delete img.dataset.srcAnimado;
                });
            } catch (e) { }
        }
    };

    // Si el combate vuelve a pintar el tablero, convertir los sprites nuevos.
    try {
        new MutationObserver(function (muts) {
            if (!document.body.classList.contains('combatiendo')) return;
            if (!esMovil() || window.SPRITES_ESTATICOS) return;
            muts.forEach(function (m) {
                m.addedNodes.forEach(function (n) {
                    if (n.nodeType !== 1) return;
                    if (n.classList && n.classList.contains('unit-sprite')) convertirASpriteEstatico(n);
                    if (n.querySelectorAll) n.querySelectorAll('.unit-sprite').forEach(convertirASpriteEstatico);
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { }

    document.addEventListener('DOMContentLoaded', init);

    window.modoRendimiento = {
        activar: function (v) { guardar(!!v); aplicar(!!v); refrescarSprites(); },
        estado: function () { return document.body.classList.contains('graficos-ligeros'); }
    };
})();
