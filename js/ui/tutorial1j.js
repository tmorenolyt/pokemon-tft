// ============================================================
// TUTORIAL 1 JUGADOR
// Pasos contextuales sobre la partida real. No bloquea la
// interacción: el jugador puede seguir jugando mientras lee.
// ============================================================

(function () {
    let tutorialActivo = false;
    let tutorialPaso = 0;
    let tutorialInterval = null;
    let tutorialResizeBound = false;
    let tutorialDone = false;

    const CLAVE_VISTO = 'tutorial1jVisto';

    const PASOS = [
        {
            titulo: 'Coloca tu Pokémon',
            texto: 'Tienes un Pokémon en el banco. Arrástralo a una casilla de tu lado del tablero (A-D). Las casillas azules son tuyas.',
            target: '#banquilloGrid',
            posicion: 'centro',
            condicion: function () {
                return typeof tablero !== 'undefined' && tablero.some(Boolean);
            }
        },
        {
            titulo: 'Empieza el combate',
            texto: 'Pulsa COMBATIR (tecla C). La ronda 1 es contra un monstruo PvE: todavía no hay tienda.',
            target: '#btnCombatirFijo',
            posicion: 'arriba',
            condicion: function () {
                return typeof tiendaAbierta !== 'undefined' && tiendaAbierta === true;
            }
        },
        {
            titulo: 'Compra tu primer Pokémon',
            texto: 'La tienda se abre al terminar la ronda. Ábrela con B y compra un Pokémon; en la ronda 2 es obligatorio antes de combatir.',
            target: '#tiendaGridTienda',
            alternativo: '#btnAbrirTiendaAccion',
            posicion: 'centro',
            condicion: function () {
                return typeof tiendaRonda2Comprada !== 'undefined' && tiendaRonda2Comprada === true;
            }
        },
        {
            titulo: 'Reroll y candado',
            texto: 'R hace reroll por 2 de oro. El candado guarda la tienda para la siguiente ronda. No hace falta rerollear siempre.',
            target: '#btnRefrescarTienda',
            alternativo: '#btnAbrirTiendaAccion',
            posicion: 'arriba'
        },
        {
            titulo: 'Activa sinergias',
            texto: 'Las sinergias se activan con 2, 3 o 4 unidades del mismo tipo o clase. Mira el panel de la izquierda: ahí ves las activas.',
            target: '#playerSinergiasTitulo',
            posicion: 'centro'
        },
        {
            titulo: 'Sube de nivel',
            texto: 'E compra 4 XP. Más nivel significa más unidades en el tablero y mejores Pokémon en la tienda.',
            target: '#btnAdelantarNivel',
            posicion: 'arriba'
        },
        {
            titulo: 'Objetivo del torneo',
            texto: 'Empiezas con 50 HP y 7 rivales. Pierdes HP al perder combates; gana el último en pie. El ranking de la izquierda es la clasificación.',
            target: '#rankingTorneo',
            posicion: 'centro'
        }
    ];

    function crearOverlay() {
        if (document.getElementById('tutorial1jTooltip')) return;

        const spot = document.createElement('div');
        spot.id = 'tutorial1jSpotlight';
        document.body.appendChild(spot);

        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial1jTooltip';
        tooltip.innerHTML = `
            <div class="tutorial1j-top">
                <span class="tutorial1j-badge">🎓 Tutorial</span>
                <span class="tutorial1j-step"></span>
            </div>
            <h3></h3>
            <p></p>
            <div class="tutorial1j-actions">
                <button type="button" class="tutorial1j-skip">Saltar tutorial</button>
                <button type="button" class="tutorial1j-next">Siguiente</button>
            </div>
        `;
        document.body.appendChild(tooltip);

        tooltip.querySelector('.tutorial1j-skip').addEventListener('click', function () {
            finalizarTutorial(true);
        });
        tooltip.querySelector('.tutorial1j-next').addEventListener('click', function () {
            avanzarTutorial();
        });

        if (!tutorialResizeBound) {
            tutorialResizeBound = true;
            window.addEventListener('resize', function () {
                if (tutorialActivo) posicionarTutorial();
            });
        }
    }

    function moverInicialAlBanco() {
        try {
            if (typeof tablero === 'undefined' || typeof banquillo === 'undefined') return;
            if (!tablero.some(Boolean)) return;
            const indiceLibreBanco = banquillo.findIndex(function (u) { return !u; });
            if (indiceLibreBanco === -1) return;
            const indiceTablero = tablero.findIndex(Boolean);
            if (indiceTablero === -1) return;
            banquillo[indiceLibreBanco] = tablero[indiceTablero];
            tablero[indiceTablero] = null;
            if (typeof renderizar === 'function') renderizar();
            if (typeof actualizarInfoJugador === 'function') actualizarInfoJugador();
        } catch (e) {}
    }

    function obtenerTarget(paso) {
        const selectores = [paso.target, paso.alternativo].filter(Boolean);
        for (let i = 0; i < selectores.length; i++) {
            const el = document.querySelector(selectores[i]);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const estilo = getComputedStyle(el);
            if (estilo.display !== 'none' && estilo.visibility !== 'hidden' && rect.width > 1 && rect.height > 1) {
                return el;
            }
        }
        return null;
    }

    function posicionarTutorial() {
        if (!tutorialActivo) return;
        const spot = document.getElementById('tutorial1jSpotlight');
        const tooltip = document.getElementById('tutorial1jTooltip');
        if (!spot || !tooltip) return;

        const paso = PASOS[tutorialPaso];
        if (!paso) return;

        const target = obtenerTarget(paso);
        if (!target) {
            spot.style.display = 'none';
            tooltip.style.top = '110px';
            tooltip.style.bottom = 'auto';
            return;
        }

        const rect = target.getBoundingClientRect();
        const pad = 6;
        spot.style.display = 'block';
        spot.style.left = (rect.left - pad) + 'px';
        spot.style.top = (rect.top - pad) + 'px';
        spot.style.width = (rect.width + pad * 2) + 'px';
        spot.style.height = (rect.height + pad * 2) + 'px';

        if (paso.posicion === 'arriba') {
            tooltip.style.top = 'auto';
            tooltip.style.bottom = 'calc(var(--action-bar-height, 72px) + 26px)';
        } else if (rect.top < 280) {
            const top = Math.min(rect.bottom + 16, window.innerHeight - 250);
            tooltip.style.top = Math.max(16, top) + 'px';
            tooltip.style.bottom = 'auto';
        } else {
            tooltip.style.top = '110px';
            tooltip.style.bottom = 'auto';
        }
    }

    function limpiarIntervalo() {
        if (tutorialInterval) {
            clearInterval(tutorialInterval);
            tutorialInterval = null;
        }
    }

    function mostrarPaso(indice) {
        if (!tutorialActivo) return;
        const paso = PASOS[indice];
        if (!paso) return;

        tutorialPaso = indice;
        tutorialDone = false;
        limpiarIntervalo();

        const tooltip = document.getElementById('tutorial1jTooltip');
        if (!tooltip) return;

        tooltip.classList.remove('done');
        tooltip.querySelector('h3').textContent = paso.titulo;
        tooltip.querySelector('p').textContent = paso.texto;
        tooltip.querySelector('.tutorial1j-step').textContent =
            'Paso ' + (indice + 1) + '/' + PASOS.length;
        const btnNext = tooltip.querySelector('.tutorial1j-next');
        btnNext.textContent = (indice === PASOS.length - 1) ? 'Terminar' : 'Siguiente';
        btnNext.disabled = false;

        tooltip.style.display = 'block';
        posicionarTutorial();

        if (typeof paso.condicion === 'function') {
            tutorialInterval = setInterval(function () {
                if (!tutorialActivo || tutorialDone) return;
                let cumple = false;
                try { cumple = paso.condicion(); } catch (e) {}
                if (!cumple) return;

                tutorialDone = true;
                clearInterval(tutorialInterval);
                tutorialInterval = null;
                tooltip.classList.add('done');
                btnNext.textContent = '✓ Hecho';
                setTimeout(function () {
                    if (tutorialActivo) avanzarTutorial();
                }, 900);
            }, 350);
        }
    }

    function avanzarTutorial() {
        if (!tutorialActivo) return;
        limpiarIntervalo();
        if (tutorialPaso >= PASOS.length - 1) {
            finalizarTutorial(false);
            return;
        }
        mostrarPaso(tutorialPaso + 1);
    }

    function finalizarTutorial(saltado) {
        limpiarIntervalo();
        tutorialActivo = false;
        tutorialDone = false;

        const spot = document.getElementById('tutorial1jSpotlight');
        const tooltip = document.getElementById('tutorial1jTooltip');
        if (spot) spot.remove();
        if (tooltip) tooltip.remove();

        try { localStorage.setItem(CLAVE_VISTO, '1'); } catch (e) {}

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                saltado ? '🎓 Tutorial saltado. Puedes repetirlo desde 1 jugador.' : '🎓 Tutorial completado. ¡Suerte en el torneo!',
                'info'
            );
        }
    }

    function iniciarTutorial1j() {
        if (window.modoDosJugadores) return;
        if (window.modoCreativo) return;

        // Si ya había uno, limpiar antes de empezar
        const viejoSpot = document.getElementById('tutorial1jSpotlight');
        const viejoTooltip = document.getElementById('tutorial1jTooltip');
        if (viejoSpot) viejoSpot.remove();
        if (viejoTooltip) viejoTooltip.remove();

        tutorialActivo = true;
        tutorialPaso = 0;
        moverInicialAlBanco();
        crearOverlay();
        mostrarPaso(0);

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage('🎓 Tutorial 1J iniciado. Puedes saltarlo cuando quieras.', 'info');
        }
    }

    window.iniciarTutorial1j = iniciarTutorial1j;
    window.finalizarTutorial1j = finalizarTutorial;
    window.avanzarTutorial1j = avanzarTutorial;
    window.tutorial1jActivo = function () { return tutorialActivo; };
})();
