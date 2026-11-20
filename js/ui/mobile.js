// ============================================================
// MODO MÓVIL - ayudas de UI (rotación, ranking, clases)
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
    // Aviso "gira el móvil" (solo dentro de la partida)
    // ------------------------------------------------------------
    function crearAvisoRotacion() {
        if (document.getElementById('mobRotate')) return;
        const cont = document.getElementById('juegoContainer');
        if (!cont) return;
        const d = document.createElement('div');
        d.id = 'mobRotate';
        d.innerHTML = `
            <div class="mob-rotate-card">
                <div class="mob-rotate-icon">📱</div>
                <h3>Gira el móvil</h3>
                <p>Pokémon TFT se juega mejor en horizontal: así ves los dos tableros, la tienda y los objetos a la vez.</p>
                <button id="mobRotateForce" type="button">Jugar en vertical igualmente</button>
            </div>`;
        cont.appendChild(d);
        const btn = document.getElementById('mobRotateForce');
        if (btn) btn.addEventListener('click', () => {
            document.body.classList.add('mob-force-portrait');
            d.style.display = 'none';
        });
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

    // Al cerrar el ranking tocando fuera
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('mob-ranking-open')) return;
        const rk = document.getElementById('rankingTorneo');
        const btn = document.getElementById('mobRankingBtn');
        if (!rk) return;
        if (rk.contains(e.target) || (btn && btn.contains(e.target))) return;
        document.body.classList.remove('mob-ranking-open');
        if (btn) btn.classList.remove('activo');
    }, true);

    function init() {
        actualizarClases();
        crearAvisoRotacion();
        crearBotonRanking();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 60);
    } else {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 60); });
    }

    let t = null;
    function onResize() {
        clearTimeout(t);
        t = setTimeout(() => {
            actualizarClases();
            // Si pasamos a paisaje, el aviso deja de aplicar
            if (window.innerWidth > window.innerHeight) {
                document.body.classList.remove('mob-force-portrait');
            }
        }, 180);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 250));

    window.mobileUI = { actualizarClases };
})();
