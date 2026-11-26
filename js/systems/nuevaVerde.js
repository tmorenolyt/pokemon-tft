// ============================================================
// SISTEMA "SEMILLAS REVIVIR" - v5 (con debug logs)
// ============================================================
// - Los tramos son PRECIOS REPETIBLES, no hitos únicos.
// - Puedes canjear cualquier tramo tantas veces como quieras
//   mientras tengas semillas suficientes.
// - Las semillas NO se capan.
// - UI compacta.
//
// 🆕 v5: contadores SEPARADOS para jugador y enemigo (2P).
//        window.semillasNuevaVerde        → Jugador activo (o J1 en 1P)
//        window.semillasEnemigoNuevaVerde → Rival (solo en 2P)
//        + logs [debug] para diagnosticar
// ============================================================

window.semillasNuevaVerde = 0;
window.semillasEnemigoNuevaVerde = 0;

const TRAMOS_NUEVA_VERDE = [
    {
        semillas: 10,
        recompensas: [
            { tipo: 'pokemon', coste: 1, nivel: 1, cantidad: 1 }
        ],
        etiqueta: "1 Pokémon coste 1"
    },
    {
        semillas: 40,
        recompensas: [
            { tipo: 'pokemon', coste: 2, nivel: 1, cantidad: 1 }
        ],
        etiqueta: "1 Pokémon coste 2"
    },
    {
        semillas: 80,
        recompensas: [
            { tipo: 'pokemon', coste: 2, nivel: 2, cantidad: 1 }
        ],
        etiqueta: "1 Pokémon coste 2 · 2★"
    },
    {
        semillas: 120,
        recompensas: [
            { tipo: 'pokemon', coste: 3, nivel: 2, cantidad: 1 },
            { tipo: 'objeto', cantidad: 1 }
        ],
        etiqueta: "1 Pokémon coste 3 · 2★ + 1 objeto"
    },
    {
        semillas: 180,
        recompensas: [
            { tipo: 'pokemon', coste: 4, nivel: 2, cantidad: 2 },
            { tipo: 'objeto', cantidad: 1 }
        ],
        etiqueta: "2 Pokémon coste 4 · 2★ + 1 objeto"
    }
];

// ============================================================
// HELPERS
// ============================================================

function getRevivePointsDesdeTablero(lado = 'player') {
    try {
        if (typeof getSinergiasActivas !== 'function') {
            return 0;
        }

        let sinergias;
        if (lado === 'player') {
            sinergias = getSinergiasActivas();
        } else {
            sinergias = (typeof getSinergiasActivasEnemigo === 'function')
                ? getSinergiasActivasEnemigo()
                : getSinergiasActivas();
        }


        if (!sinergias || !sinergias.types || !sinergias.types["Planta"]) return 0;
        const bonus = sinergias.types["Planta"].bonus;
        return (bonus && bonus.revivePoints) ? bonus.revivePoints : 0;
    } catch (e) {
        console.error(`🌱 getRevivePointsDesdeTablero:`, e);
        return 0;
    }
}

// ============================================================
// ACUMULAR SEMILLAS
// ============================================================

function sumarSemillasPorCaido(unidadCaida, lado = 'player') {

    if (!unidadCaida || !unidadCaida.pokemon) return 0;

    const es2P = !!window.modoDosJugadores;

    // En 1P, el enemigo (IA) no acumula semillas.
    if (lado === 'enemy' && !es2P) {
        return 0;
    }

    const puntosBase = getRevivePointsDesdeTablero(lado);

    if (puntosBase <= 0) return 0;

    let puntosExtra = 0;
    if (unidadCaida.pokemon.tipos && unidadCaida.pokemon.tipos.includes("Planta")) {
        puntosExtra = 1;
    }

    const totalPuntos = puntosBase + puntosExtra;

    if (lado === 'enemy') {
        if (typeof window.semillasEnemigoNuevaVerde !== 'number' || isNaN(window.semillasEnemigoNuevaVerde)) {
            window.semillasEnemigoNuevaVerde = 0;
        }
        window.semillasEnemigoNuevaVerde += totalPuntos;

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `🌱 +${totalPuntos} Semillas Revivir (ENEMIGO) — Total: ${window.semillasEnemigoNuevaVerde}`,
                'enemy'
            );
        }
    } else {
        if (typeof window.semillasNuevaVerde !== 'number' || isNaN(window.semillasNuevaVerde)) {
            window.semillasNuevaVerde = 0;
        }
        window.semillasNuevaVerde += totalPuntos;

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `🌱 +${totalPuntos} Semillas Revivir (${puntosBase} base${puntosExtra ? ' +1 Planta' : ''}) — Total: ${window.semillasNuevaVerde}`,
                'info'
            );
        }
    }

    if (typeof refrescarPanelNuevaVerde === 'function') {
        setTimeout(refrescarPanelNuevaVerde, 50);
    }

    return totalPuntos;
}

// ============================================================
// COMPROBAR ESPACIO
// ============================================================

function contarHuecosLibres() {
    if (typeof banquillo === 'undefined' || typeof tablero === 'undefined') return 0;
    let huecosBanco = banquillo.filter(u => u === null).length;
    let huecosTablero = 0;
    if (typeof maxUnidadesTablero === 'function') {
        huecosTablero = maxUnidadesTablero() - tablero.filter(u => u !== null).length;
    }
    return huecosBanco + huecosTablero;
}

function contarPokemonsEnRecompensas(tramo) {
    let count = 0;
    for (let r of tramo.recompensas) {
        if (r.tipo === 'pokemon') count += r.cantidad;
    }
    return count;
}

function hayEspacioParaRecompensas(tramo) {
    return contarHuecosLibres() >= contarPokemonsEnRecompensas(tramo);
}

// ============================================================
// CANJEAR TRAMO
// ============================================================

function canjearTramoNuevaVerde(semillasTramo) {
    const tramo = TRAMOS_NUEVA_VERDE.find(t => t.semillas === semillasTramo);
    if (!tramo) {
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(`🌱 Tramo ${semillasTramo} no existe`, 'error');
        }
        return false;
    }

    if (window.semillasNuevaVerde < tramo.semillas) {
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `🌱 No tienes suficientes Semillas Revivir (${window.semillasNuevaVerde}/${tramo.semillas})`,
                'error'
            );
        }
        return false;
    }

    if (!hayEspacioParaRecompensas(tramo)) {
        const necesarios = contarPokemonsEnRecompensas(tramo);
        const disponibles = contarHuecosLibres();
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `🌱 Necesitas ${necesarios} hueco(s) libre(s) pero tienes ${disponibles}`,
                'error'
            );
        }
        return false;
    }

    window.semillasNuevaVerde -= tramo.semillas;

    let mensajesRecompensa = [];

    for (let recompensa of tramo.recompensas) {
        if (recompensa.tipo === 'pokemon') {
            for (let i = 0; i < recompensa.cantidad; i++) {
                const pokemon = darPokemonAleatorio(recompensa.coste, recompensa.nivel);
                if (pokemon) {
                    mensajesRecompensa.push(`${pokemon.nombre} ${recompensa.nivel}★`);
                }
            }
        } else if (recompensa.tipo === 'objeto') {
            for (let i = 0; i < recompensa.cantidad; i++) {
                const objeto = darObjetoAleatorio();
                if (objeto) {
                    mensajesRecompensa.push(`📦 ${objeto}`);
                }
            }
        }
    }

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(
            `🌱 ¡Canjeado tramo de ${tramo.semillas} Semillas Revivir! Recibidos: ${mensajesRecompensa.join(', ') || 'nada'} — Quedan: ${window.semillasNuevaVerde}`,
            'success'
        );
    }

    if (typeof playFusionSound === 'function') playFusionSound();
    if (typeof renderizar === 'function') renderizar();
    if (typeof refrescarPanelNuevaVerde === 'function') refrescarPanelNuevaVerde();
    if (typeof actualizarCartaSinergia === 'function') actualizarCartaSinergia();

    return true;
}

// ============================================================
// DAR POKÉMON ALEATORIO
// ============================================================

function darPokemonAleatorio(coste, nivel) {
    if (typeof POKEMONS === 'undefined') return null;
    if (typeof Unidad === 'undefined') return null;

    let candidatos = POKEMONS.filter(p =>
        p.coste === coste &&
        p.base !== false &&
        !p.esEspecial &&
        p.id !== 999 &&
        (typeof getCopiasDisponibles === 'function' ? getCopiasDisponibles(p) > 0 : true)
    );

    let costeActual = coste;
    while (candidatos.length === 0 && costeActual > 1) {
        costeActual--;
        candidatos = POKEMONS.filter(p =>
            p.coste === costeActual &&
            p.base !== false &&
            !p.esEspecial &&
            p.id !== 999 &&
            (typeof getCopiasDisponibles === 'function' ? getCopiasDisponibles(p) > 0 : true)
        );
    }

    if (candidatos.length === 0) {
        candidatos = POKEMONS.filter(p => p.base !== false && !p.esEspecial && p.id !== 999);
    }
    if (candidatos.length === 0) return null;

    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

    if (typeof consumirDelPool === 'function') {
        if (!consumirDelPool(elegido.id)) return null;
    }

    let nuevaUnidad;
    try {
        nuevaUnidad = new Unidad(elegido, nivel, elegido.id, elegido.coste);
    } catch (e) {
        console.error('🌱 Error creando unidad de Semillas Revivir:', e);
        if (typeof devolverAlPool === 'function') devolverAlPool(elegido.id);
        return null;
    }

    let colocado = false;

    if (typeof banquillo !== 'undefined') {
        for (let i = 0; i < banquillo.length; i++) {
            if (banquillo[i] === null) {
                banquillo[i] = nuevaUnidad;
                colocado = true;
                break;
            }
        }
    }

    if (!colocado && typeof tablero !== 'undefined' && typeof maxUnidadesTablero === 'function') {
        const maxTab = maxUnidadesTablero();
        const ocupadas = tablero.filter(u => u !== null).length;
        if (ocupadas < maxTab) {
            for (let i = 0; i < tablero.length; i++) {
                if (tablero[i] === null) {
                    tablero[i] = nuevaUnidad;
                    colocado = true;
                    break;
                }
            }
        }
    }

    if (!colocado) {
        if (typeof devolverAlPool === 'function') devolverAlPool(elegido.id);
        return null;
    }

    if (typeof verificarTodasLasFusiones === 'function') verificarTodasLasFusiones();
    if (typeof aplicarSinergias === 'function') aplicarSinergias();

    return elegido;
}

// ============================================================
// DAR OBJETO ALEATORIO
// ============================================================

function darObjetoAleatorio() {
    if (typeof OBJETOS === 'undefined') return null;
    if (typeof baulObjetos === 'undefined') return null;
    if (typeof CONFIG === 'undefined' || typeof CONFIG.MAX_BAUL === 'undefined') return null;

    if (baulObjetos.length >= CONFIG.MAX_BAUL) {
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage('🌱 Baúl lleno, no se pudo dar el objeto', 'error');
        }
        return null;
    }

    const todosObjetos = Object.keys(OBJETOS);
    if (todosObjetos.length === 0) return null;

    const elegido = todosObjetos[Math.floor(Math.random() * todosObjetos.length)];
    baulObjetos.push(elegido);

    if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul();
    if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales();

    return elegido;
}

// ============================================================
// RESET
// ============================================================

function resetNuevaVerde() {
    window.semillasNuevaVerde = 0;
    window.semillasEnemigoNuevaVerde = 0;
    console.log('🌱 resetNuevaVerde() ejecutado');
}

// ============================================================
// UI - PANEL HTML (compacto)
// ============================================================

function construirPanelNuevaVerdeHTML(lado = 'player') {
    // 🆕 Elegir el contador correcto según el lado
    const semillas = (lado === 'enemy')
        ? (window.semillasEnemigoNuevaVerde || 0)
        : (window.semillasNuevaVerde || 0);
    const semillasMaximas = 180;

    let tramosHtml = '';
    for (let tramo of TRAMOS_NUEVA_VERDE) {
        const puedeCanjear = semillas >= tramo.semillas;
        const puedeCanjearPorEspacio = puedeCanjear && hayEspacioParaRecompensas(tramo);

        let clase = '';
        if (puedeCanjearPorEspacio) clase = 'nv-tramo-alcanzado';
        else if (puedeCanjear) clase = 'nv-tramo-sin-espacio';

        const iconoEstado = puedeCanjearPorEspacio ? '🎁' : (puedeCanjear ? '⚠️' : '🔒');

        tramosHtml += `
            <div class="nv-tramo ${clase}">
                <span class="nv-tramo-icono">${iconoEstado}</span>
                <span class="nv-tramo-semillas">[${tramo.semillas}]</span>
                <span class="nv-tramo-texto">${tramo.etiqueta}</span>
                <button class="nv-btn-canjear-tramo"
                        onclick="canjearTramoNuevaVerde(${tramo.semillas})"
                        ${puedeCanjearPorEspacio ? '' : 'disabled'}
                        title="${puedeCanjearPorEspacio ? 'Canjear este tramo' : (puedeCanjear ? 'No hay espacio en tablero/banquillo' : 'Semillas insuficientes')}">
                    🎁
                </button>
            </div>
        `;
    }

    return `
        <div class="nv-panel">
            <div class="nv-header" title="Las Semillas Revivir se acumulan sin límite. Canjea cualquier tramo tantas veces como quieras, siempre que tengas semillas suficientes.">
                <div class="nv-titulo">
                    <span class="nv-icono">🌱</span>
                    <span class="nv-nombre">SEMILLAS REVIVIR</span>
                </div>
                <div class="nv-contador">
                    <span class="nv-contador-base">${semillas}</span>
                    <span class="nv-contador-sep">/</span>
                    <span class="nv-contador-max">${semillasMaximas}</span>
                </div>
            </div>
            <div class="nv-tramos">
                ${tramosHtml}
            </div>
        </div>
    `;
}

// ============================================================
// REFRESCAR PANEL
// ============================================================

function refrescarPanelNuevaVerde(lado = 'player') {
    const contenedor = document.getElementById('nuevaVerdeContainer');
    if (contenedor) {
        // 🆕 Leer el lado del contenedor o del data-attribute
        const ladoFinal = contenedor.dataset.lado || lado;
        contenedor.innerHTML = construirPanelNuevaVerdeHTML(ladoFinal);
    }

    // Panel auxiliar del panel de sinergias (Planta)
    const contSpl = document.getElementById('splNuevaVerde');
    if (contSpl && contSpl.style.display !== 'none' && contSpl.dataset.lado) {
        contSpl.innerHTML = construirPanelNuevaVerdeHTML(contSpl.dataset.lado);
    }
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.sumarSemillasPorCaido = sumarSemillasPorCaido;
window.canjearTramoNuevaVerde = canjearTramoNuevaVerde;
window.construirPanelNuevaVerdeHTML = construirPanelNuevaVerdeHTML;
window.refrescarPanelNuevaVerde = refrescarPanelNuevaVerde;
window.resetNuevaVerde = resetNuevaVerde;
window.TRAMOS_NUEVA_VERDE = TRAMOS_NUEVA_VERDE;
