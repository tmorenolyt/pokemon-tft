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
            document.body.classList.toggle('mob-ranking-open');
            b.classList.toggle('activo', document.body.classList.contains('mob-ranking-open'));
        });
        right.insertBefore(b, right.firstChild);
    }

    // ------------------------------------------------------------
    // Botón ⚔️ para abrir/cerrar las sinergias en móvil
    // ------------------------------------------------------------
    function crearBotonSinergias() {
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
    }, true);

    function init() {
        actualizarClases();
        crearAvisoRotacion();
        crearBotonRanking();
        crearBotonSinergias();
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

    window.mobileUI = { actualizarClases, intentarHorizontal };
})();
