// ============================================================
// MAIN - INICIALIZACIÓN Y EVENTOS PRINCIPALES
// v6.3 - AÑADIDO: Sincronización de window.fearAuraStacks
// v6.4 - FIX TORNEO: rivales con equipo completo
// ============================================================

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let vidaJugador = 50;
let victorias = 0;
let racha = 0;
let fase = 1;
let ronda = 1;

let tablero = [];
let banquillo = [];
let combatiendo = false;
let seleccionado = null;
let primerCombateRealizado = false;

// ===== MODO CREATIVO =====
let modoCreativo = false;
window.modoCreativo = false;

// VARIABLES DEL ENEMIGO (fijas; tableros/HP/racha siguen con swap en Fase 2/3)
let enemyBoard = [];
let enemyBanquillo = [];
let enemyHealth = 100;
let enemyWinStreak = 0;
let enemyLossStreak = 0;
let enemyCombatiendo = false;
let enemyPrimerCombateRealizado = false;
let enemyTiendaRonda2Comprada = false;

// ===== RIVAL ACTUAL (con estrategia) =====
let rivalActual = null;

// ============================================================
// 🆕 ECONOMÍA POR JUGADOR (2 slots fijos) — redirige al jugador
//    ACTIVO según window.turnoJugador (modo 2P). Sustituye al
//    intercambio de estos campos en _swapEstado(). En 1P,
//    "player" = humano y "enemy" = IA, igual que antes.
// ============================================================
const _eJ1 = { oro: 10, nivel: 1, exp: 0, tienda: [], candado: false, baul: [], objTienda: [], objComprado: false };
const _eJ2 = { oro: 10, nivel: 1, exp: 0, tienda: [], candado: false, baul: [], objTienda: [], objComprado: false };

function _esTurnoJ2() { return !!(window.modoDosJugadores && window.turnoJugador === 2); }
function _economiaActivo() { return _esTurnoJ2() ? _eJ2 : _eJ1; }
function _economiaInactivo() { return _esTurnoJ2() ? _eJ1 : _eJ2; }

function _defAcceso(nombre, campo, inactivo) {
    Object.defineProperty(window, nombre, {
        get() { return (inactivo ? _economiaInactivo() : _economiaActivo())[campo]; },
        set(v) { (inactivo ? _economiaInactivo() : _economiaActivo())[campo] = v; },
        configurable: true
    });
}

_defAcceso('oro', 'oro', false);                            _defAcceso('enemyGold', 'oro', true);
_defAcceso('nivelJugador', 'nivel', false);                 _defAcceso('enemyLevel', 'nivel', true);
_defAcceso('experiencia', 'exp', false);                    _defAcceso('enemyExperiencia', 'exp', true);
_defAcceso('tienda', 'tienda', false);                      _defAcceso('enemyTienda', 'tienda', true);
_defAcceso('tiendaBloqueada', 'candado', false);            _defAcceso('enemyTiendaBloqueada', 'candado', true);
_defAcceso('baulObjetos', 'baul', false);                   _defAcceso('enemyBaulObjetos', 'baul', true);
_defAcceso('objetosEnTienda', 'objTienda', false);          _defAcceso('enemyObjetosEnTienda', 'objTienda', true);
_defAcceso('objetoCompradoEstaRonda', 'objComprado', false); _defAcceso('enemyObjetoCompradoEstaRonda', 'objComprado', true);

// OBJETOS
let objetoSeleccionado = null;

// 🔧 FIX OPCIÓN A: buffer de unidades pendientes de colocar
let unidadesPendientes = [];

// SINERGIAS
let fearAuraStacks = 0;
window.fearAuraStacks = 0; // 🆕 Sincronizar con el panel de Aura de Miedo
window.enemyFearAuraStacks = 0; // 🆕 Aura de Miedo del ENEMIGO (2P)

// ZACIAN Y ARTICUNO
let zacianUnidad = null;
let zacianNivel = 0;
let zacianContainer = null;
let articunoUnidad = null;
let articunoContainer = null;
let articunoTimer = 0;
let articunoActivado = false;
let articunoVisible = false;

// POST-COMBATE
let postCombateData = null;
let equipoCompletoJugador = [];
let equipoCompletoEnemigo = [];

// ESTADÍSTICAS GLOBALES
let estadisticasGlobales = {
    totalDaño: 0,
    totalRecibido: 0,
    totalCuracion: 0,
    victorias: 0,
    rondas: 0,
    mvp: null,
    topDaño: 0,
    topRecibido: 0,
    mejoresPokemon: []
};

// OTROS
let sonidoObjetosReproducido = false;

// ⏳ CRONÓMETRO DE PARTIDA
let partidaTimerInterval = null;
let partidaTimerInicio = null;

// ===== VARIABLES PARA METRÓNOMO =====
let metronomoGlobalStacks = 0;
const METRONOMO_MAXIMO = 20;
const METRONOMO_BONUS_POR_ATAQUE = 0.04;

// ===== CARTA DE POKÉMON =====
let cartaAbierta = false;
let cartaUnidadActual = null;
let cartaTipoUbicacion = null;
let cartaIndiceUbicacion = null;
let movimientoSeleccionadoIndex = 0;

// 🎯 FASE 2: flag global de cambio de movimiento por ronda
window.cambioMovimientoUsadoEstaRonda = false;


window.ocultarContadorRonda = ocultarContadorRonda;
window.mostrarContadorRonda = mostrarContadorRonda;

// ============================================================
// 🆕 TIMER DEL COMBATE - OCULTAR / MOSTRAR
// ============================================================
function mostrarTimerCombate() {
    const header = document.getElementById('combateTimerHeader');
    const valor  = document.getElementById('combateTimerValor');
    if (header) {
        header.style.display = 'inline-flex';
        header.classList.remove('overtime');
    }
    if (valor) {
        valor.textContent = '0s';
    }
}

function ocultarTimerCombate() {
    const header = document.getElementById('combateTimerHeader');
    if (!header) return;
    header.style.display = 'none';
    header.classList.remove('overtime');
}

window.mostrarTimerCombate = mostrarTimerCombate;
window.ocultarTimerCombate = ocultarTimerCombate;

// ============================================================
// 🔴 FIX GLOBAL: BOTÓN DATOS SIEMPRE VISIBLE Y ACTIVO
// ============================================================
(function forzarBotonDatos() {
    function forzar() {
        const btn = document.getElementById('btnPostCombate');
        if (!btn) return;
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        btn.style.zIndex = '99999';
        btn.style.position = 'relative';
    }

    forzar();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forzar);
    }
    setInterval(forzar, 100);
    console.log('🔴 [main.js] Forzado global del botón DATOS activado');
})();

// ============================================================
// 🔴 FIX GLOBAL: DELEGACIÓN DE CLICK EN DOCUMENT
// ============================================================
document.addEventListener('click', function(e) {
    const btn = e.target.closest('#btnPostCombate');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) {
        if (typeof cerrarTienda === 'function') cerrarTienda();
    }

    if (typeof window.togglePanelDatosCombate === 'function') {
        window.togglePanelDatosCombate();
    } else {
        console.error('❌ [delegación] togglePanelDatosCombate no está definido');
    }
}, true);

// ============================================================
// 🔴 FALLBACK DE EMERGENCIA: togglePanelDatosCombate
// ============================================================
setTimeout(function() {
    if (typeof window.togglePanelDatosCombate !== 'function') {
        window.abrirPanelDatosCombate = function() {
            const panel = document.getElementById('panelDatosCombate');
            if (!panel) return;
            if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) {
                if (typeof cerrarTienda === 'function') cerrarTienda();
            }
            if (typeof cartaAbierta !== 'undefined' && cartaAbierta) {
                if (typeof cerrarCarta === 'function') cerrarCarta();
            }
            panel.style.display = 'block';
            window.panelDatosCombateAbierto = true;
            if (typeof window.renderizarPanelDatosCombate === 'function') {
                window.renderizarPanelDatosCombate();
            }
        };

        window.cerrarPanelDatosCombate = function() {
            const panel = document.getElementById('panelDatosCombate');
            if (!panel) return;
            panel.style.display = 'none';
            window.panelDatosCombateAbierto = false;
        };

        window.togglePanelDatosCombate = function() {
            const panel = document.getElementById('panelDatosCombate');
            if (!panel) return;
            const abierto = panel.style.display === 'block';
            if (abierto) window.cerrarPanelDatosCombate();
            else window.abrirPanelDatosCombate();
        };
    }
}, 2000);

// ============================================================
// AUDIO - CON FALLBACK
// ============================================================
let audioContext = null;
let audioCache = {};
let uiAudioCache = {};
let combateAudioActual = null;
let fondoPreparacionAudio = null;
let fondoPreparacionActivo = false;


// ⏳ CRONÓMETRO DE PARTIDA TOTAL
function formatearTiempoPartida(ms) {
    const segundosTotales = Math.floor(ms / 1000);
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function iniciarCronometroPartida() {
    detenerCronometroPartida();
    partidaTimerInicio = performance.now();
    const el = document.getElementById('partidaTimerValue');
    if (el) el.textContent = '00:00';
    partidaTimerInterval = setInterval(() => {
        const el = document.getElementById('partidaTimerValue');
        if (!el) return;
        el.textContent = formatearTiempoPartida(performance.now() - partidaTimerInicio);
    }, 1000);
}

function detenerCronometroPartida() {
    if (partidaTimerInterval) {
        clearInterval(partidaTimerInterval);
        partidaTimerInterval = null;
    }
    partidaTimerInicio = null;
}


let _evolucionAudioActual = null;
let _evolucionMusicaFondoVolumenOriginal = 0.5;


window.pararSonidoEvolucionCompleta = pararSonidoEvolucionCompleta;
window.playGritoEvolucion = playGritoEvolucion;
window.playEvolveCompleted = playEvolveCompleted;
window.pararEvolveCompleted = pararEvolveCompleted;
window.playSonidoEvolucionCompleta = playSonidoEvolucionCompleta;

let _victoriaAudioActual = null;

// ============================================================
// 🆕 MÚSICA DE DERROTA (faltaba en este main.js)
// ============================================================
let _derrotaAudioActual = null;

let movimientoAudioCache = {};
// 🆕 Movimientos sin archivo de audio: usan el sintetizador directamente
// para no lanzar 404 en la consola (Espada Lamento, Azote Torrencial,
// Giro Fuego Ho-Oh y Tajo Supremo).
const SONIDOS_MOVIMIENTO_SIN_ARCHIVO = new Set([
    'espada-lamento',
    'azote-torrencial',
    'giro-fuego-hooh',
    'tajo-supremo',
    'somanta-epica',
    'pasen-y-vean'
]);


const TIEMPOS_FIN_RONDA = {
    RESULTADO_MS: 1800,
    BOCADILLO_MS: 3000,
    CAMBIO_RIVAL_MS: 600,
    RESET_TABLERO_MS: 500,
    IA_MS: 800,
    TORNEO_MS: 300,
    TIENDA_DELAY_MS: 500
};


window.ejecutarFinDeRonda = ejecutarFinDeRonda;
window.esperar = esperar;


window.asignarRivalAleatorioInmediato = asignarRivalAleatorioInmediato;


window.generarEquipoPlaceholderRival = generarEquipoPlaceholderRival;


window.aplicarTerrenoActual = aplicarTerrenoActual;
window.cambiarTerrenoPorRival = cambiarTerrenoPorRival;


function darDiscoDefinitivo() {
    if (baulObjetos.length >= CONFIG.MAX_BAUL) {
        addConsoleMessage(`⚠️ ¡Baúl lleno! El Disco Definitivo no cabe. Libera espacio para conseguirlo`, 'error');
        return false;
    }
    baulObjetos.push("Disco Definitivo");
    addConsoleMessage(`💿 ¡Has conseguido un DISCO DEFINITIVO! (Nivel ${nivelJugador})`, 'fusion');
    if (typeof playSonidoEvolucion === 'function') playSonidoEvolucion();
    if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul();
    if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales();
    // 📱 En móvil, abrir la tira del baúl para ver el disco recién conseguido
    //    (solo actúa en móvil; en escritorio no hace nada).
    if (typeof avisarObjetosAlBaul === 'function') avisarObjetosAlBaul();
    if (typeof renderizar === 'function') renderizar();
    return true;
}
window.darDiscoDefinitivo = darDiscoDefinitivo;


// ============================================================
// ABRIR CARTA DE POKÉMON (Rediseño v5)
// ============================================================


// 🆕 FIX: puedeInteractuar / puedeCombatir / bloquearEstadoCombate /
// liberarEstadoCombate viven en js/systems/combate.js. Aquí estaban
// duplicadas y, al cargar main.js después, PISABAN las versiones buenas:
//   - `puedeCombatir` perdía el guard de `window._finRondaEnCurso`.
//   - `bloquearEstadoCombate` no limpiaba `.salto-victoria`.
// Se eliminaron para que solo exista una implementación.


function reiniciarJuego() {
    detenerCronometroPartida();
    if (typeof resetHitosYaAnimados === 'function') resetHitosYaAnimados();
    window.modoCreativo = false;
    modoCreativo = false;
    const btnResetSandboxReinicio = document.getElementById('btnResetSandbox');
    if (btnResetSandboxReinicio) btnResetSandboxReinicio.style.display = 'none';
    const rankingReinicio = document.getElementById('rankingTorneo');
    if (rankingReinicio) rankingReinicio.style.display = '';
    if (typeof cerrarPanelCreativo === 'function') cerrarPanelCreativo();

    window.enemyComproEnRonda2 = false;
    window._rivalPensandoMostradoEstaRonda = false;
    window._rivalYaSustituyoEstaRonda = false;
    window._rivalYaMovioEstaRonda = false;
    window.cambioMovimientoUsadoEstaRonda = false;
    window._ultimoRivalCombatido = null;

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) { gameOverOverlay.classList.remove('visible'); gameOverOverlay.style.display = 'none'; }
    const postCombateOverlay = document.getElementById('postCombateOverlay');
    if (postCombateOverlay) { postCombateOverlay.classList.remove('visible'); postCombateOverlay.style.display = 'none'; }
    if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) { if (typeof cerrarTienda === 'function') cerrarTienda(); }
    if (typeof baulPanelAbierto !== 'undefined' && baulPanelAbierto) { if (typeof cerrarBaulPanel === 'function') cerrarBaulPanel(); }

    window.postCombateData = null;
    postCombateData = null;

    for (let i = 0; i < tablero.length; i++) if (tablero[i] && tablero[i].esZacian) tablero[i] = null;
    for (let i = 0; i < banquillo.length; i++) if (banquillo[i] && banquillo[i].esZacian) banquillo[i] = null;

    vidaJugador = 50; oro = 10; victorias = 0; nivelJugador = 1; racha = 0; fase = 1; ronda = 1; experiencia = 0;
    combatiendo = false; seleccionado = null; primerCombateRealizado = false; fearAuraStacks = 0; window.fearAuraStacks = 0; metronomoGlobalStacks = 0;

    // 🏆 Nueva partida: reiniciar contadores "de run" de los logros.
    window._logroTorneoContado = false;
    if (typeof Logros !== 'undefined') Logros.evento('run_inicio');

    if (typeof resetNuevaVerde === 'function') resetNuevaVerde();

    enemyLevel = 1; enemyGold = 10; enemyHealth = 50; enemyWinStreak = 0; enemyLossStreak = 0;
    enemyCombatiendo = false; enemyTiendaBloqueada = false; enemyPrimerCombateRealizado = false; enemyTiendaRonda2Comprada = false;

    baulObjetos = []; objetoSeleccionado = null; objetosEnTienda = []; objetoCompradoEstaRonda = false;
    enemyBaulObjetos = []; enemyObjetosEnTienda = []; enemyObjetoCompradoEstaRonda = false; sonidoObjetosReproducido = false;

    if (typeof rerollObjetosRonda3Usado !== 'undefined') rerollObjetosRonda3Usado = false;
    if (typeof tiendaRonda2Comprada !== 'undefined') tiendaRonda2Comprada = false;

    zacianUnidad = null; zacianNivel = 0; articunoUnidad = null; articunoTimer = 0; articunoActivado = false; articunoVisible = false;
    if (typeof resetArticunoAlTerminarCombate === 'function') resetArticunoAlTerminarCombate();

    estadisticasGlobales = { totalDaño: 0, totalRecibido: 0, totalCuracion: 0, victorias: 0, rondas: 0, mvp: null, topDaño: 0, topRecibido: 0, mejoresPokemon: [] };

    postCombateData = null; equipoCompletoJugador = []; equipoCompletoEnemigo = [];

    if (typeof inicializarPool === 'function') inicializarPool();

    if (zacianContainer) zacianContainer.style.display = 'none';
    if (articunoContainer) articunoContainer.style.display = 'none';
    window.zacianEnemigoUnidad = null; window.articunoEnemigoUnidad = null; window.articunoEnemigoTimer = 0; window.articunoEnemigoActivado = false;

    tablero = new Array(20).fill(null); banquillo = new Array(CONFIG.BANQUILLO_MAXIMO).fill(null);
    enemyBoard = new Array(20).fill(null); enemyBanquillo = new Array(CONFIG.BANQUILLO_MAXIMO).fill(null);
    tienda = []; enemyTienda = [];
    unidadesPendientes = []; window.unidadesPendientes = [];

    // ============================================================
    // 🆕 FIX PvE: en ronda PvE spawnear monstruo, si no, rival normal
    // 👥 En 2P NUNCA hay PvE: se prepara el equipo inicial del J2.
    // ============================================================
    if (window.modoDosJugadores === true) {
        if (typeof generarTienda === 'function') generarTienda();
        prepararJugador2Inicial();
        if (typeof cambiarTerrenoPorRival === 'function') {
            cambiarTerrenoPorRival(window.rivalActual);
        }
        const ranking2pReinicio = document.getElementById('rankingTorneo');
        if (ranking2pReinicio) ranking2pReinicio.style.display = 'none';
    } else if (typeof esRondaPvE === 'function' && esRondaPvE(fase)) {
        if (typeof spawnearMonstruoPvE === 'function') {
            spawnearMonstruoPvE(fase);
        }
        if (typeof generarTienda === 'function') generarTienda();
        if (typeof cambiarTerrenoPorRival === 'function') {
            cambiarTerrenoPorRival(window.rivalActual);
        }
    } else {
        asignarRivalAleatorio();
        if (typeof generarTienda === 'function') generarTienda();
        if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();

        try {
            let pokemonEnemigo = elegirPokemonInicialEnemigo();
            if (pokemonEnemigo && typeof consumirDelPool === 'function') {
                if (consumirDelPool(pokemonEnemigo.id)) {
                    const rolEnemigo = rolColocacionDesdePokemonData(pokemonEnemigo);
                    const mejorPos = obtenerIndiceColocacionInicial('enemy', rolEnemigo, 0);
                    enemyBoard[mejorPos] = new Unidad(pokemonEnemigo, 1, pokemonEnemigo.id);
                    const nombreRival = window.rivalActual ? window.rivalActual.nombre : "Enemigo";
                    addConsoleMessage(`🎭 ${nombreRival} empieza con ${pokemonEnemigo.nombre}`, 'enemy');
                    let idxTienda = enemyTienda.findIndex(p => p && p.id === pokemonEnemigo.id);
                    if (idxTienda !== -1) enemyTienda.splice(idxTienda, 1);
                }
            }
        } catch (e) {}
    } // cierre del else (ronda PvP)

    // ============================================================
    // 🆕 Pokémon inicial del JUGADOR (siempre, PvE o PvP)
    // ============================================================
    try {
        let pokemonsInicialesJugador = POKEMONS_COSTE1 || [];
        if (pokemonsInicialesJugador.length > 0) {
            let pokemonInicial = pokemonsInicialesJugador[Math.floor(Math.random() * pokemonsInicialesJugador.length)];
            if (pokemonInicial && typeof consumirDelPool === 'function') {
                if (consumirDelPool(pokemonInicial.id)) {
                    const rolInicial = rolColocacionDesdePokemonData(pokemonInicial);
                    const posicionInicial = obtenerIndiceColocacionInicial('player', rolInicial, 0);
                    tablero[posicionInicial] = new Unidad(pokemonInicial, 1, pokemonInicial.id, pokemonInicial.coste);
                    let idxTiendaJugador = tienda.findIndex(p => p && p.id === pokemonInicial.id);
                    if (idxTiendaJugador !== -1) tienda.splice(idxTiendaJugador, 1);
                    addConsoleMessage(`🎁 Pokémon inicial: ${pokemonInicial.nombre} colocado gratis`, 'info');
                }
            }
        }
    } catch (e) {}

    if (typeof aplicarSinergias === 'function') aplicarSinergias();
    if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();

    // 🆕 FIX PvE: no tocar la IA si es ronda PvE
    if (!(typeof esRondaPvE === 'function' && esRondaPvE(fase))) {
        if (typeof enemyPosicionarUnidadesInteligente === 'function') enemyPosicionarUnidadesInteligente();
        if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();
    }

    if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul();

    setTimeout(function() {
        if (typeof renderizar === 'function') renderizar();
        if (typeof actualizarInfoJugador === 'function') actualizarInfoJugador();
        if (typeof actualizarInfoEnemigo === 'function') actualizarInfoEnemigo();
        if (typeof actualizarBotonVender === 'function') actualizarBotonVenderCarta();
    }, 100);

    if (typeof ocultarTimerCombate === 'function') ocultarTimerCombate();
    if (typeof mostrarContadorRonda === 'function') mostrarContadorRonda();

        if (!document.body.style.getPropertyValue('--terreno-actual')) {
        const terrenoInicial = (window.modoCreativo === true)
            ? `url('../assets/backgrounds/terreno-creativo.webp')`
            : `url('../assets/backgrounds/terreno.webp')`;
        document.body.style.setProperty('--terreno-actual', terrenoInicial);
    }

    // 🆕 FIX TORNEO: al reiniciar sin recargar la página hay que generar
    // un torneo nuevo. Antes se conservaban los HP, los eliminados y las
    // parejas de la partida anterior.
    window._rivalesYaCombatidos = [];
    window._rankingEmparejado = false;
    window._parejasRanking = [];
    window._ultimaVictoriaJugador = undefined;
    window._ultimoDanoRecibidoJugador = 0;
    window._rivalAsignadoUnaVez = false;

    if (window.modoDosJugadores !== true) {
        if (typeof inicializarTorneo === 'function') {
            inicializarTorneo();
            if (typeof actualizarRankingTorneo === 'function') actualizarRankingTorneo();
        }
    } else {
        const ranking2pReinicioFinal = document.getElementById('rankingTorneo');
        if (ranking2pReinicioFinal) ranking2pReinicioFinal.style.display = 'none';
    }

    addConsoleMessage("🔄 Juego reiniciado correctamente", 'success');
}

// 👥 2P: equipo inicial del J2 sin tocar el torneo ni el PvE.
function prepararJugador2Inicial() {
    window.enRondaPvE = false;
    window.monstruoActual = null;

    if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();

    rivalActual = {
        nombre: (window.nombreJugador2 && String(window.nombreJugador2).trim())
            ? window.nombreJugador2 : 'Jugador 2',
        avatar: window.avatarJugador2 || 'azul',
        estrategia: { tipos: [], clases: [], descripcion: 'Jugador 2', prioridad: [] },
        frases: { win: [], lose: [], thinking: [] }
    };
    window.rivalActual = rivalActual;

    try {
        const pokemonEnemigo = elegirPokemonInicialEnemigo();
        if (pokemonEnemigo && typeof consumirDelPool === 'function') {
            if (consumirDelPool(pokemonEnemigo.id)) {
                const rolEnemigo = rolColocacionDesdePokemonData(pokemonEnemigo);
                const mejorPos = obtenerIndiceColocacionInicial('enemy', rolEnemigo, 0);
                enemyBoard[mejorPos] = new Unidad(pokemonEnemigo, 1, pokemonEnemigo.id);
                addConsoleMessage(`🎮 J2 empieza con ${pokemonEnemigo.nombre}`, 'enemy');
                const idxTienda = enemyTienda.findIndex(p => p && p.id === pokemonEnemigo.id);
                if (idxTienda !== -1) enemyTienda.splice(idxTienda, 1);
            }
        }
    } catch (e) {}
}

function init() {
    if (typeof resetHitosYaAnimados === 'function') resetHitosYaAnimados();
    // ❄️ Nueva partida: limpiar el estado de Articuno (flag de Ventisca incluido)
    if (typeof resetArticunoAlTerminarCombate === 'function') resetArticunoAlTerminarCombate();
    window.articunoEnemigoUnidad = null; window.articunoEnemigoTimer = 0; window.articunoEnemigoActivado = false;

    // 🧪 El modo creativo se activa después de init(); una partida normal
    // nunca debe heredar el sandbox de una sesión creativa anterior.
    window.modoCreativo = false;
    modoCreativo = false;
    const btnResetSandboxInit = document.getElementById('btnResetSandbox');
    if (btnResetSandboxInit) btnResetSandboxInit.style.display = 'none';
    const rankingInit = document.getElementById('rankingTorneo');
    if (rankingInit) rankingInit.style.display = '';

    // 🆕 FIX TORNEO: estado de sesión limpio en cada partida nueva.
    // Antes se arrastraban rivales ya combatidos, parejas viejas y el
    // resultado de la última ronda al reiniciar sin recargar la página.
    window._rivalesYaCombatidos = [];
    window._rankingEmparejado = false;
    window._parejasRanking = [];
    window._ultimaVictoriaJugador = undefined;
    window._ultimoDanoRecibidoJugador = 0;
    window._ultimoRivalCombatido = null;
    window._rivalAsignadoUnaVez = false;

    window.postCombateData = null; postCombateData = null;
    window.enemyComproEnRonda2 = false; window._rivalPensandoMostradoEstaRonda = false; window._rivalYaSustituyoEstaRonda = false; window._rivalYaMovioEstaRonda = false;
    window.cambioMovimientoUsadoEstaRonda = false;

    vidaJugador = 50; oro = 10; victorias = 0; nivelJugador = 1; racha = 0; fase = 1; ronda = 1; experiencia = 0; combatiendo = false; seleccionado = null; primerCombateRealizado = false;

    // 🏆 Nueva partida: reiniciar contadores "de run" de los logros.
    window._logroTorneoContado = false;
    if (typeof Logros !== 'undefined') Logros.evento('run_inicio');
    
    // 🆕 Sincronizar Aura de Miedo al iniciar
    fearAuraStacks = 0;
    window.fearAuraStacks = 0;

    if (typeof resetNuevaVerde === 'function') resetNuevaVerde();

    for (let i = 0; i < tablero.length; i++) if (tablero[i] && tablero[i].esZacian) tablero[i] = null;
    for (let i = 0; i < banquillo.length; i++) if (banquillo[i] && banquillo[i].esZacian) banquillo[i] = null;

    tiendaBloqueada = false;
    try { localStorage.setItem('tiendaBloqueada', JSON.stringify(false)); } catch (e) {}

    if (typeof inicializarPool === 'function') inicializarPool();

    tablero = Array(20).fill(null); banquillo = Array(CONFIG.BANQUILLO_MAXIMO).fill(null);
    enemyBoard = Array(20).fill(null); enemyBanquillo = Array(CONFIG.BANQUILLO_MAXIMO).fill(null);
    tienda = []; enemyTienda = [];

    enemyLevel = 1; enemyGold = 10; enemyHealth = 50; enemyWinStreak = 0; enemyLossStreak = 0;
    enemyTiendaBloqueada = false; enemyPrimerCombateRealizado = false; enemyTiendaRonda2Comprada = false;

    baulObjetos = []; objetosEnTienda = []; objetoCompradoEstaRonda = false;
    enemyBaulObjetos = []; enemyObjetosEnTienda = []; enemyObjetoCompradoEstaRonda = false;
    sonidoObjetosReproducido = false; fearAuraStacks = 0; metronomoGlobalStacks = 0;
    window.fearAuraStacks = 0;

    if (typeof rerollObjetosRonda3Usado !== 'undefined') rerollObjetosRonda3Usado = false;
    if (typeof tiendaRonda2Comprada !== 'undefined') tiendaRonda2Comprada = false;

    estadisticasGlobales = { totalDaño: 0, totalRecibido: 0, totalCuracion: 0, victorias: 0, rondas: 0, mvp: null, topDaño: 0, topRecibido: 0, mejoresPokemon: [] };

    unidadesPendientes = []; window.unidadesPendientes = [];

    if (typeof crearContenedoresEspeciales === 'function') {
        crearContenedoresEspeciales();
    }

    // ============================================================
    // 🆕 FIX PvE: en ronda PvE spawnear monstruo, si no, rival normal
    // 👥 En 2P NUNCA hay PvE: J1 y J2 empiezan con su equipo.
    // ============================================================
    const es2PInit = (window.modoDosJugadores === true);
    if (es2PInit) {
        if (typeof generarTienda === 'function') generarTienda();
        prepararJugador2Inicial();
        if (typeof cambiarTerrenoPorRival === 'function') {
            cambiarTerrenoPorRival(window.rivalActual);
        }
        const ranking2pInit = document.getElementById('rankingTorneo');
        if (ranking2pInit) ranking2pInit.style.display = 'none';
    } else if (typeof esRondaPvE === 'function' && esRondaPvE(fase)) {
        if (typeof spawnearMonstruoPvE === 'function') {
            spawnearMonstruoPvE(fase);
        }
        // 🆕 FIX: el monstruo no usa enemyHealth (se muestra ∞ en render.js).
        // Restauramos el valor del torneo para que el panel del enemigo no
        // muestre 100 HP ni la barra se salga al 200%.
        if (typeof CONFIG !== 'undefined' && CONFIG.VIDA_MAX_JUGADOR) {
            enemyHealth = CONFIG.VIDA_MAX_JUGADOR;
        } else {
            enemyHealth = 50;
        }
                if (typeof cambiarTerrenoPorRival === 'function') {
            cambiarTerrenoPorRival(window.rivalActual);
        }
    } else {
        if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();
        asignarRivalAleatorio();

        try {
            let pokemonEnemigo = elegirPokemonInicialEnemigo();
            if (pokemonEnemigo && typeof consumirDelPool === 'function') {
                if (consumirDelPool(pokemonEnemigo.id)) {
                    const rolEnemigo = rolColocacionDesdePokemonData(pokemonEnemigo);
                    const mejorPos = obtenerIndiceColocacionInicial('enemy', rolEnemigo, 0);
                    enemyBoard[mejorPos] = new Unidad(pokemonEnemigo, 1, pokemonEnemigo.id);
                    const nombreRival = window.rivalActual ? window.rivalActual.nombre : "Enemigo";
                    addConsoleMessage(`🎭 ${nombreRival} empieza con ${pokemonEnemigo.nombre}`, 'enemy');
                    let idxTienda = enemyTienda.findIndex(p => p && p.id === pokemonEnemigo.id);
                    if (idxTienda !== -1) enemyTienda.splice(idxTienda, 1);
                }
            }
        } catch (e) {}
    } // cierre del else (ronda PvP)

    // ============================================================
    // 🆕 Pokémon inicial del JUGADOR (siempre, PvE o PvP)
    // ============================================================
    try {
        let pokemonsInicialesJugador = POKEMONS_COSTE1 || [];
        if (pokemonsInicialesJugador.length > 0) {
            let pokemonInicial = pokemonsInicialesJugador[Math.floor(Math.random() * pokemonsInicialesJugador.length)];
            if (pokemonInicial && typeof consumirDelPool === 'function') {
                if (consumirDelPool(pokemonInicial.id)) {
                    const rolInicial = rolColocacionDesdePokemonData(pokemonInicial);
                    const posicionInicial = obtenerIndiceColocacionInicial('player', rolInicial, 0);
                    tablero[posicionInicial] = new Unidad(pokemonInicial, 1, pokemonInicial.id, pokemonInicial.coste);
                    let idxTiendaJugador = tienda.findIndex(p => p && p.id === pokemonInicial.id);
                    if (idxTiendaJugador !== -1) tienda.splice(idxTiendaJugador, 1);
                    addConsoleMessage(`🎁 Pokémon inicial: ${pokemonInicial.nombre} colocado gratis`, 'info');
                }
            }
        }
    } catch (e) {}

    if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();

    // 🆕 FIX PvE: no tocar la IA si es ronda PvE
    if (!(typeof esRondaPvE === 'function' && esRondaPvE(fase))) {
        if (typeof enemyPosicionarUnidadesInteligente === 'function') enemyPosicionarUnidadesInteligente();
        if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();
    }

    if (typeof generarTienda === 'function') generarTienda();
    if (typeof renderizarTiendaIndependiente === 'function') renderizarTiendaIndependiente(true);

    setTimeout(() => { addConsoleMessage('💡 Combate en ronda 1 para desbloquear la tienda', 'info'); }, 1000);
    if (typeof iniciarAudio === 'function') iniciarAudio();

    if (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(ronda)) {
        objetosEnTienda = generarObjetosTienda();
        objetoCompradoEstaRonda = false;
    }

    if (typeof renderizar === 'function') renderizar();

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) { gameOverOverlay.classList.remove('visible'); gameOverOverlay.style.display = 'none'; }
    const postCombateOverlay = document.getElementById('postCombateOverlay');
    if (postCombateOverlay) { postCombateOverlay.classList.remove('visible'); postCombateOverlay.style.display = 'none'; }

    if (typeof ocultarTimerCombate === 'function') ocultarTimerCombate();
    if (typeof mostrarContadorRonda === 'function') mostrarContadorRonda();

    const musicBtn = document.getElementById("musicControl");
    if (musicBtn) musicBtn.onclick = () => { if (typeof iniciarAudio === 'function') iniciarAudio(); };

    document.body.addEventListener('click', function primerClick() {
        if (typeof iniciarAudio === 'function') iniciarAudio();
        if (typeof iniciarFondoPreparacion === 'function') iniciarFondoPreparacion();
        document.body.removeEventListener('click', primerClick);
    });

    const btnAdelantar = document.getElementById("btnAdelantarNivel");
    if (btnAdelantar) btnAdelantar.onclick = () => adelantarNivel();

    const btnCombatir = document.getElementById("btnCombatirFijo");
    if (btnCombatir) btnCombatir.onclick = () => { if (typeof combatir === 'function') combatir(); };

    const btnResetSandbox = document.getElementById("btnResetSandbox");
    if (btnResetSandbox) btnResetSandbox.onclick = () => {
        if (typeof window.resetSandbox === 'function') window.resetSandbox();
    };

    const btnPostCombate = document.getElementById('btnPostCombate');
    if (btnPostCombate) { btnPostCombate.style.display = 'flex'; btnPostCombate.disabled = false; }

    const btnReiniciar = document.getElementById('btnReiniciarJuego');
    if (btnReiniciar) btnReiniciar.addEventListener('click', function() { reiniciarJuego(); });

    const btnVolverMenu = document.getElementById('btnVolverMenu');
    if (btnVolverMenu && !btnVolverMenu.dataset.timerParcheado) {
        btnVolverMenu.dataset.timerParcheado = '1';
        btnVolverMenu.addEventListener('click', function() { detenerCronometroPartida(); });
    }

    document.querySelectorAll('.game-over-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.game-over-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const tab = this.dataset.tab;
            document.querySelectorAll('.game-over-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('panel-' + tab);
            if (panel) panel.classList.add('active');
        });
    });

    if (typeof initTiendaIndependiente === 'function') initTiendaIndependiente();
    if (typeof renderizarTiendaIndependiente === 'function') renderizarTiendaIndependiente(true);
    if (typeof initDragObjetos === 'function') initDragObjetos();

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && typeof cartaAbierta !== 'undefined' && cartaAbierta) {
            if (typeof cerrarCarta === 'function') cerrarCarta();
        }
    });

    document.addEventListener('click', function(e) {
        const panel = document.getElementById('cartaPanel');
        if (typeof cartaAbierta !== 'undefined' && cartaAbierta && panel && !panel.contains(e.target) && !e.target.closest('.board-cell') && !e.target.closest('.bank-cell')) {
            if (typeof cerrarCarta === 'function') cerrarCarta();
        }
    });

    setTimeout(() => {
        const primerPokemon = tablero.find(u => u !== null);
        if (primerPokemon && typeof playPokemonCry === 'function') playPokemonCry(primerPokemon.pokemon.id);
    }, 600);

    // 🆕 FIX PUNTO 3: Inicializar torneo (solo 1 jugador)
    if (window.modoDosJugadores !== true) {
        if (typeof inicializarTorneo === 'function') {
            inicializarTorneo();
        }
        if (typeof actualizarRankingTorneo === 'function') {
            setTimeout(() => actualizarRankingTorneo(), 500);
        }
    } else {
        const ranking2pInitFinal = document.getElementById('rankingTorneo');
        if (ranking2pInitFinal) ranking2pInitFinal.style.display = 'none';
    }

        if (!document.body.style.getPropertyValue('--terreno-actual')) {
        const terrenoInicial = (window.modoCreativo === true)
            ? `url('../assets/backgrounds/terreno-creativo.webp')`
            : `url('../assets/backgrounds/terreno.webp')`;
        document.body.style.setProperty('--terreno-actual', terrenoInicial);
    }

    iniciarCronometroPartida();
}


window.actualizarContadorRondaVisual = actualizarContadorRondaVisual;

window.iniciarFondoPreparacion = iniciarFondoPreparacion;
window.pausarFondoPreparacion = pausarFondoPreparacion;
window.reanudarFondoPreparacion = reanudarFondoPreparacion;
window.reproducirMusicaCombate = reproducirMusicaCombate;

window.mostrarPostCombate = mostrarPostCombate;
window.cambiarTabPostCombate = cambiarTabPostCombate;
window.cambiarFiltroPostCombate = cambiarFiltroPostCombate;
window.renderizarListasPostCombate = renderizarListasPostCombate;
window.asignarRivalAleatorio = asignarRivalAleatorio;
window.iniciarCronometroPartida = iniciarCronometroPartida;
window.detenerCronometroPartida = detenerCronometroPartida;
window.formatearTiempoPartida = formatearTiempoPartida;

// ============================================================
// FUNCIONES DE APOYO PARA LA NUEVA CARTA
// ============================================================


// Exponer globalmente (necesario para los onclick del HTML generado)
window.getColorTipo = getColorTipo;
window.viewMove = viewMove;
window.activarMovimientoDesdeCarta = activarMovimientoDesdeCarta;