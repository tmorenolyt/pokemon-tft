// ============================================================
// MODO MÓVIL - ayudas de UI
// - En móvil SIEMPRE horizontal: en retrato se bloquea con un aviso.
// - Botón para pantalla completa + bloqueo de orientación (Android).
// - Botón 🏆 del header para abrir el ranking (oculto en móvil).
// ============================================================
(function () {
    function esPantallaPequena() {
        return window.matchMedia('(max-width: 900px)').matches;
    }
    function esTactil() {
        return window.matchMedia('(pointer: coarse)').matches;
    }

    function actualizarClases() {
        const movil = esPantallaPequena() || esTactil();
        document.body.classList.toggle('is-mobile', movil);
        const paisaje = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('mob-landscape', movil && paisaje && window.innerHeight <= 560);
    }

    // ------------------------------------------------------------
    // Aviso "gira el móvil" (bloquea el juego en vertical)
    // ------------------------------------------------------------
    function crearAvisoRotacion() {
        if (document.getElementById('mobRotate')) return;
        const d = document.createElement('div');
        d.id = 'mobRotate';
        d.innerHTML = `
            <div class="mob-rotate-card">
                <div class="mob-rotate-icon">📱</div>
                <h3>Gira el móvil</h3>
                <p>Pokémon TFT solo se puede jugar en <b>horizontal</b>: así ves los dos tableros, la tienda y los objetos a la vez.</p>
                <button id="mobRotateFull" class="mob-rotate-full" type="button">⛶ Pantalla completa horizontal</button>
                <div class="mob-rotate-hint">Si el botón no hace nada (iPhone), gira el móvil manualmente.</div>
            </div>`;
        document.body.appendChild(d);

        const btn = document.getElementById('mobRotateFull');
        if (btn) btn.addEventListener('click', intentarHorizontal);
    }

    // Intenta pantalla completa + bloqueo de orientación (solo Android/Chrome;
    // en iOS no está soportado y el usuario tendrá que girar el móvil).
    function intentarHorizontal() {
        try {
            const el = document.documentElement;
            const pedirFull = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
            const p = pedirFull ? pedirFull.call(el) : null;
            const lock = () => {
                try {
                    if (screen.orientation && typeof screen.orientation.lock === 'function') {
                        screen.orientation.lock('landscape').catch(() => { });
                    }
                } catch (e) { }
            };
            if (p && typeof p.then === 'function') p.then(lock).catch(() => lock());
            else lock();
        } catch (e) { }
    }

    // ------------------------------------------------------------
    // Botón 🏆 para abrir/cerrar el ranking en móvil
    // ------------------------------------------------------------
    function crearBotonRanking() {
        if (document.getElementById('mobRankingBtn')) return;
        const right = document.querySelector('#juegoContainer .header-right');
        if (!right) return;
        const b = document.createElement('button');
        b.id = 'mobRankingBtn';
        b.className = 'btn-volver-menu';
        b.type = 'button';
        b.title = 'Ranking del torneo';
        b.textContent = '🏆';
        b.addEventListener('click', (e) => {
            e.preventDefault();
            // Exclusividad: cerrar sinergias y baúl al abrir el ranking
            if (typeof window.cerrarPanelSinergias === 'function') window.cerrarPanelSinergias();
            if (typeof window.cerrarBaulPanel === 'function') window.cerrarBaulPanel();
            document.body.classList.toggle('mob-ranking-open');
            b.classList.toggle('activo', document.body.classList.contains('mob-ranking-open'));
        });
        right.insertBefore(b, right.firstChild);
    }

    // ------------------------------------------------------------
    // Botón 📦 para abrir/cerrar el baúl de objetos en móvil
    // (antes eran dos tiras laterales que robaban ancho al tablero)
    // ------------------------------------------------------------
    function crearBotonBaul() {
        // Ya hay un 📦 estático en el dock (btnDockBaul)
        if (document.getElementById('btnDockBaul')) return;
        if (document.getElementById('mobBaulBtn')) return;
        const right = document.querySelector('#juegoContainer .header-right');
        if (!right) return;
        const b = document.createElement('button');
        b.id = 'mobBaulBtn';
        b.className = 'btn-volver-menu';
        b.type = 'button';
        b.title = 'Baúl de objetos';
        b.textContent = '📦';
        b.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('mob-baul-open');
            b.classList.toggle('activo', document.body.classList.contains('mob-baul-open'));
        });
        right.insertBefore(b, right.firstChild);
    }

    // Abrir el desplegable del baúl desde cualquier otro sitio (por ejemplo
    // al comprar un objeto en la tienda). En escritorio no hace nada: el
    // botón 📦 solo existe en móvil.
    function abrirBaul() {
        // No abrir encima de la tienda ni en mitad de un combate.
        const tienda = document.getElementById('tiendaOverlay');
        if (tienda && getComputedStyle(tienda).display !== 'none') return false;
        if (typeof combatiendo !== 'undefined' && combatiendo) return false;

        // 🆕 Usar el panel del dock (solo móvil, como antes)
        if (typeof window.abrirBaulPanel === 'function') {
            if (!window.matchMedia('(max-height: 700px) and (max-width: 1100px)').matches) return false;
            window.abrirBaulPanel(true);
            return true;
        }

        const btn = document.getElementById('mobBaulBtn');
        if (!btn) return false;
        document.body.classList.add('mob-baul-open');
        btn.classList.add('activo');
        return true;
    }
    window.abrirBaulMovil = abrirBaul;

    // Al tocar un objeto del baúl se cierra el desplegable para poder
    // tocar el Pokémon y equiparlo (flujo tocar-objeto → tocar-Pokémon).
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('mob-baul-open')) return;
        const slot = e.target && e.target.closest ? e.target.closest('.objeto-slot-vertical') : null;
        if (slot && slot.dataset && slot.dataset.objetoNombre) {
            setTimeout(() => {
                document.body.classList.remove('mob-baul-open');
                const btn = document.getElementById('mobBaulBtn');
                if (btn) btn.classList.remove('activo');
                const dock = document.getElementById('btnDockBaul');
                if (dock) dock.classList.remove('activo');
            }, 0);
        }
    }, true);

    // ------------------------------------------------------------
    // Botón ⚔️ para abrir/cerrar las sinergias en móvil
    // ------------------------------------------------------------
    function crearBotonSinergias() {
        // Ya hay un ⚔️ estático en el dock (btnDockSinergias)
        if (document.getElementById('btnDockSinergias')) return;
        if (document.getElementById('mobTraitsBtn')) return;
        const right = document.querySelector('#juegoContainer .header-right');
        if (!right) return;
        const b = document.createElement('button');
        b.id = 'mobTraitsBtn';
        b.className = 'btn-volver-menu';
        b.type = 'button';
        b.title = 'Sinergias';
        b.textContent = '⚔️';
        b.addEventListener('click', (e) => {
            e.preventDefault();

            // 🆕 El botón ⚔️ abre el panel de sinergias (lista + detalle)
            if (typeof window.abrirPanelSinergias === 'function') {
                const lista = (window.sinergiasActuales && window.sinergiasActuales.player) || [];
                const primera = lista.find(s => s.activa) || lista[0];
                window.abrirPanelSinergias(
                    primera ? primera.nombre : null,
                    primera ? primera.tipo === 'clase' : false,
                    'player'
                );
                b.classList.toggle('activo', !!window.panelSinergiasAbierto);
                return;
            }

            document.body.classList.toggle('mob-traits-open');
            b.classList.toggle('activo', document.body.classList.contains('mob-traits-open'));
        });
        right.insertBefore(b, right.firstChild);
    }

    // Al cerrar el ranking o las sinergias tocando fuera
    document.addEventListener('click', (e) => {
        if (document.body.classList.contains('mob-ranking-open')) {
            const rk = document.getElementById('rankingTorneo');
            const btn = document.getElementById('mobRankingBtn');
            if (rk && !rk.contains(e.target) && !(btn && btn.contains(e.target))) {
                document.body.classList.remove('mob-ranking-open');
                if (btn) btn.classList.remove('activo');
            }
        }
        if (document.body.classList.contains('mob-traits-open')) {
            const tr = document.querySelector('#juegoContainer .side-column-player .traits-vertical');
            const btn = document.getElementById('mobTraitsBtn');
            if (tr && !tr.contains(e.target) && !(btn && btn.contains(e.target))) {
                document.body.classList.remove('mob-traits-open');
                if (btn) btn.classList.remove('activo');
            }
        }
        if (document.body.classList.contains('mob-baul-open')) {
            const b1 = document.getElementById('objetosVerticalContainer');
            const b2 = document.getElementById('objetosVerticalContainerEnemigo');
            const btn = document.getElementById('mobBaulBtn');
            const dock = document.getElementById('btnDockBaul');
            const dentro = (b1 && b1.contains(e.target)) || (b2 && b2.contains(e.target)) || (btn && btn.contains(e.target)) || (dock && dock.contains(e.target));
            if (!dentro) {
                document.body.classList.remove('mob-baul-open');
                if (btn) btn.classList.remove('activo');
                if (dock) dock.classList.remove('activo');
            }
        }
    }, true);

    function init() {
        actualizarClases();
        crearAvisoRotacion();
        crearBotonRanking();
        crearBotonSinergias();
        crearBotonBaul();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 60);
    } else {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 60); });
    }

    let t = null;
    window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(actualizarClases, 180);
    });
    window.addEventListener('orientationchange', () => setTimeout(actualizarClases, 250));

    window.mobileUI = { actualizarClases, intentarHorizontal, abrirBaul };
})();
