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

// ============================================================
// 🆕 CONTADOR DE RONDA - OCULTAR / MOSTRAR
// ============================================================
function ocultarContadorRonda() {
    // 🆕 FIX: el contador de ronda debe estar SIEMPRE visible.
    // En vez de ocultarlo, solo hacemos un pequeño "pop" cuando cambia la ronda.
    if (window.modoDosJugadores) return;
    const badge = document.querySelector('.round-badge-tienda');
    if (!badge) return;
    badge.style.display = 'inline-flex';
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function mostrarContadorRonda() {
    if (window.modoDosJugadores) return;
    const badge = document.querySelector('.round-badge-tienda');
    if (!badge) return;
    badge.style.display = 'inline-flex';
    badge.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    void badge.offsetWidth;
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

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

function iniciarAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
}

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

function playPokemonCry(pokemonId) {
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;
    try {
        const multEfectos = (typeof window._volumenEfectosActual === 'number') ? (window._volumenEfectosActual / 0.5) : 1;
        const volumenFinal = Math.max(0, Math.min(1, 0.3 * multEfectos));
        const cryUrl = CONFIG.CRY_BASE_URL + pokemonId + ".ogg";
        if (audioCache[cryUrl]) {
            const cachedAudio = audioCache[cryUrl];
            cachedAudio.currentTime = 0;
            cachedAudio.volume = volumenFinal;
            cachedAudio.play().catch(() => {});
            return;
        }
        const audio = new Audio(cryUrl);
        audio.volume = volumenFinal;
        audio.addEventListener('canplaythrough', function() { audioCache[cryUrl] = audio; });
        audio.play().catch(() => {});
    } catch (e) {}
}

function playSound(frecuencia, duracion, volumen = 0.08) {
    if (!audioContext) return;
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = frecuencia;
        gain.gain.value = volumen;
        gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duracion);
        osc.start();
        osc.stop(audioContext.currentTime + duracion);
    } catch (e) {}
}

function usarFallbackSonido(nombreArchivo) {
    const fallbacks = {
        'click.mp3': { freq: 880, dur: 0.08 },
        'sell.mp3': { freq: 659.25, dur: 0.08 },
        'levelup.mp3': { freq: 523, dur: 0.1 },
        'victoria-ronda.mp3': { freq: 1046, dur: 0.25 },
        'derrota-ronda.mp3': { freq: 220, dur: 0.4 },
        'combate.mp3': { freq: 392, dur: 0.6 }
    };
    const fallback = fallbacks[nombreArchivo];
    if (fallback) playSound(fallback.freq, fallback.dur, 0.08);
    else playSound(880, 0.1, 0.08);
}

function playUISound(nombreArchivo, volumen = 0.3) {
    if (typeof window._volumenEfectosActual === 'number') {
        volumen = volumen * (window._volumenEfectosActual / 0.5);
        if (volumen < 0) volumen = 0;
    }
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;
    try {
        const url = CONFIG.UI_SOUND_URL + nombreArchivo;
        if (uiAudioCache[url]) {
            const audio = uiAudioCache[url];
            audio.currentTime = 0;
            audio.volume = volumen;
            audio.play().catch(() => usarFallbackSonido(nombreArchivo));
            return;
        }
        const audio = new Audio(url);
        audio.volume = volumen;
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', function() { uiAudioCache[url] = audio; }, { once: true });
        audio.addEventListener('error', function() { usarFallbackSonido(nombreArchivo); });
        audio.play().catch(() => usarFallbackSonido(nombreArchivo));
    } catch (e) {}
}

function playButtonSound() { playUISound('click.mp3', 0.5); }
function playBuySound() { playUISound('click.mp3', 0.3); }
function playSellSound() { playUISound('sell.mp3', 0.3); }
function playSonidoEvolucion() { playUISound('levelup.mp3', 0.4); }
function playSonidoSubirNivel() { playUISound('levelup.mp3', 0.35); }
function playSonidoObjetos() { playUISound('click.mp3', 0.3); }
function playFusionSound() { playUISound('levelup.mp3', 0.35); }

let _evolucionAudioActual = null;
let _evolucionMusicaFondoVolumenOriginal = 0.5;

function playSonidoEvolucionCompleta() {
    try {
        const url = CONFIG.UI_SOUND_URL + 'evolution.mp3';
        if (_evolucionAudioActual) {
            try { _evolucionAudioActual.pause(); _evolucionAudioActual.currentTime = 0; } catch (e) {}
            _evolucionAudioActual = null;
        }
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.preload = 'auto';
        audio.addEventListener('error', function() { playUISound('levelup.mp3', 0.4); });
        audio.play().catch(() => playUISound('levelup.mp3', 0.4));
        _evolucionAudioActual = audio;
        _evolucionMusicaFondoVolumenOriginal = 0.5;
        audio.addEventListener('ended', function() { if (_evolucionAudioActual === audio) _evolucionAudioActual = null; }, { once: true });
    } catch (e) { playUISound('levelup.mp3', 0.4); }
}

function playGritoEvolucion(pokemonId) {
    try {
        if (_evolucionAudioActual) { try { _evolucionAudioActual.volume = 0.15; } catch (e) {} }
        if (typeof playPokemonCry === 'function' && pokemonId) playPokemonCry(pokemonId);
        setTimeout(() => {
            if (_evolucionAudioActual) { try { _evolucionAudioActual.volume = _evolucionMusicaFondoVolumenOriginal; } catch (e) {} }
        }, 1800);
    } catch (e) {}
}

function playEvolveCompleted() {
    return new Promise((resolve) => {
        try {
            const url = CONFIG.UI_SOUND_URL + 'evolve-completed.mp3';
            const audio = new Audio(url);
            audio.volume = 0.35;
            let yaResuelto = false;
            const resolver = () => { if (yaResuelto) return; yaResuelto = true; resolve(); };
            audio.addEventListener('ended', resolver);
            audio.addEventListener('error', () => { playUISound('levelup.mp3', 0.4); setTimeout(resolver, 1500); });
            audio.play().then(() => {}).catch(() => { playUISound('levelup.mp3', 0.4); setTimeout(resolver, 1500); });
            setTimeout(resolver, 15000);
        } catch (e) { playUISound('levelup.mp3', 0.4); setTimeout(resolve, 1500); }
    });
}

function pararSonidoEvolucionCompleta() {
    if (!_evolucionAudioActual) return;
    try { _evolucionAudioActual.pause(); _evolucionAudioActual.currentTime = 0; } catch (e) {}
    _evolucionAudioActual = null;
}

window.pararSonidoEvolucionCompleta = pararSonidoEvolucionCompleta;
window.playGritoEvolucion = playGritoEvolucion;
window.playEvolveCompleted = playEvolveCompleted;
window.playSonidoEvolucionCompleta = playSonidoEvolucionCompleta;

let _victoriaAudioActual = null;
function playVictoriaSound() {
    try {
        const url = CONFIG.UI_SOUND_URL + 'victoria-ronda.mp3';
        if (_victoriaAudioActual) { try { _victoriaAudioActual.pause(); _victoriaAudioActual.currentTime = 0; } catch (e) {} _victoriaAudioActual = null; }
        const audio = new Audio(url);
        audio.volume = 0.30;
        audio.loop = true; // 🆕 loop para que no se corte si el MP3 dura < 8.5s
        audio.addEventListener('error', function() { usarFallbackSonido('victoria-ronda.mp3'); });
        audio.play().catch(() => usarFallbackSonido('victoria-ronda.mp3'));
        _victoriaAudioActual = audio;
        // 🆕 Duración total: 8.5s (antes 7.5s). Con loop, el MP3 se
        //    repite hasta que salte este timeout.
                // 🆕 Fade out antes de cortar la música (suave, ~1.2s)
        const FADE_DURACION_MS = 1200;
        const FADE_PASOS = 24;
        const FADE_INTERVALO_MS = FADE_DURACION_MS / FADE_PASOS;
        const VOLUMEN_INICIAL = audio.volume;

        setTimeout(() => {
            if (_victoriaAudioActual !== audio) return;
            try { audio.loop = false; } catch (e) {}

            let paso = 0;
            const fadeInterval = setInterval(() => {
                if (_victoriaAudioActual !== audio) {
                    clearInterval(fadeInterval);
                    return;
                }
                paso++;
                const nuevoVol = Math.max(0, VOLUMEN_INICIAL * (1 - paso / FADE_PASOS));
                try { audio.volume = nuevoVol; } catch (e) {}

                if (paso >= FADE_PASOS) {
                    clearInterval(fadeInterval);
                    try { audio.pause(); audio.currentTime = 0; audio.volume = VOLUMEN_INICIAL; } catch (e) {}
                    _victoriaAudioActual = null;
                    audio.dispatchEvent(new Event('ended'));
                }
            }, FADE_INTERVALO_MS);
        }, 7500);
        return audio;
    } catch (e) { usarFallbackSonido('victoria-ronda.mp3'); return null; }
}

// ============================================================
// 🆕 MÚSICA DE DERROTA (faltaba en este main.js)
// ============================================================
let _derrotaAudioActual = null;
function playDerrotaSound() {
    const url = CONFIG.UI_SOUND_URL + 'derrota-ronda.mp3';
    try {
        if (_derrotaAudioActual) {
            try { _derrotaAudioActual.pause(); _derrotaAudioActual.currentTime = 0; } catch (e) {}
            _derrotaAudioActual = null;
        }
        const audio = new Audio(url);
        audio.volume = 0.35;
        audio.loop = true;
        audio.addEventListener('error', function() { usarFallbackSonido('derrota-ronda.mp3'); });
        audio.play().catch(() => usarFallbackSonido('derrota-ronda.mp3'));
        _derrotaAudioActual = audio;
                // 🆕 Fade out antes de cortar la música (suave, ~1.2s)
        const FADE_DURACION_MS = 1200;
        const FADE_PASOS = 24;
        const FADE_INTERVALO_MS = FADE_DURACION_MS / FADE_PASOS;
        const VOLUMEN_INICIAL = audio.volume;

        setTimeout(() => {
            if (_derrotaAudioActual !== audio) return;
            try { audio.loop = false; } catch (e) {}

            let paso = 0;
            const fadeInterval = setInterval(() => {
                if (_derrotaAudioActual !== audio) {
                    clearInterval(fadeInterval);
                    return;
                }
                paso++;
                const nuevoVol = Math.max(0, VOLUMEN_INICIAL * (1 - paso / FADE_PASOS));
                try { audio.volume = nuevoVol; } catch (e) {}

                if (paso >= FADE_PASOS) {
                    clearInterval(fadeInterval);
                    try { audio.pause(); audio.currentTime = 0; audio.volume = VOLUMEN_INICIAL; } catch (e) {}
                    _derrotaAudioActual = null;
                    audio.dispatchEvent(new Event('ended'));
                }
            }, FADE_INTERVALO_MS);
        }, 7500);
        return audio;
    } catch (e) { usarFallbackSonido('derrota-ronda.mp3'); return null; }
}

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

function playSonidoMovimiento(nombreMovimiento, volumen = 0.4) {
    if (!nombreMovimiento) return;
    if (typeof window._volumenEfectosActual === 'number') {
        volumen = volumen * (window._volumenEfectosActual / 0.5);
        if (volumen < 0) volumen = 0;
        if (volumen > 1) volumen = 1;
    }
    const idSonido = nombreMovimiento.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;

    // Sin archivo: sintetizar sin intentar cargar .mp3/.ogg (evita 404)
    if (SONIDOS_MOVIMIENTO_SIN_ARCHIVO.has(idSonido)) {
        usarFallbackSonidoMovimiento(idSonido, volumen);
        return;
    }

    // Lista real de archivos (js/data/sonidosMovimientos.js). Si el sonido no
    // existe —p. ej. el id de una ULTIMATE, que no tiene mp3— usamos el
    // sintetizado en vez de provocar dos 404 (mp3 + ogg) en cada lanzamiento.
    const sonidosReales = window.SONIDOS_MOVIMIENTOS_DISPONIBLES;
    if (sonidosReales && !sonidosReales.has(idSonido)) {
        usarFallbackSonidoMovimiento(idSonido, volumen);
        return;
    }

    const urlMp3 = CONFIG.SOUND_BASE_URL + 'movimientos/' + idSonido + '.mp3';
    const urlOgg = CONFIG.SOUND_BASE_URL + 'movimientos/' + idSonido + '.ogg';

    if (movimientoAudioCache[urlMp3]) {
        const audio = movimientoAudioCache[urlMp3];
        audio.currentTime = 0; audio.volume = volumen;
        audio.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
        return;
    }
    if (movimientoAudioCache[urlOgg]) {
        const audio = movimientoAudioCache[urlOgg];
        audio.currentTime = 0; audio.volume = volumen;
        audio.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
        return;
    }

    const audioMp3 = new Audio(urlMp3);
    audioMp3.volume = volumen;
    audioMp3.preload = 'auto';
    audioMp3.addEventListener('canplaythrough', function() { movimientoAudioCache[urlMp3] = audioMp3; }, { once: true });
    audioMp3.addEventListener('error', function() {
        const audioOgg = new Audio(urlOgg);
        audioOgg.volume = volumen;
        audioOgg.addEventListener('canplaythrough', function() { movimientoAudioCache[urlOgg] = audioOgg; }, { once: true });
        audioOgg.addEventListener('error', function() { usarFallbackSonidoMovimiento(idSonido, volumen); });
        audioOgg.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
    });
    audioMp3.play().catch(() => {
        const audioOgg = new Audio(urlOgg);
        audioOgg.volume = volumen;
        audioOgg.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
    });
}

function usarFallbackSonidoMovimiento(idSonido, volumen = 0.15) {
    if (!audioContext) return;
    const fallbacks = {
        'latigo-cepa': { frecuencias: [660, 990, 1320], duracion: 0.35, tipo: 'sawtooth' },
        'lanzallamas': { frecuencias: [200, 400, 300, 500], duracion: 0.6, tipo: 'sawtooth' },
        'vendaval': { frecuencias: [900, 1200, 700, 1400], duracion: 0.55, tipo: 'triangle' },
        'trampa-rocas': { frecuencias: [120, 90, 140, 80], duracion: 0.5, tipo: 'square' },
        'tajo-cruzado': { frecuencias: [180, 220, 160, 240], duracion: 0.35, tipo: 'square' },
        'torbellino': { frecuencias: [500, 700, 400, 800], duracion: 0.6, tipo: 'sine' },
        'divide-dolor': { frecuencias: [400, 550, 300, 600], duracion: 0.7, tipo: 'triangle' },
        'bola-voltio': { frecuencias: [800, 1200, 1000, 1400], duracion: 0.4, tipo: 'square' },
        'fuerza-lunar': { frecuencias: [600, 800, 700, 900], duracion: 0.5, tipo: 'sine' },
        'colmillo-hielo': { frecuencias: [400, 300, 500, 200], duracion: 0.5, tipo: 'triangle' },
        'finta': { frecuencias: [300, 500, 350, 550], duracion: 0.3, tipo: 'square' },
        'bomba-acida': { frecuencias: [200, 300, 250, 400], duracion: 0.45, tipo: 'sawtooth' },
        'espada-lamento': { frecuencias: [500, 700, 900, 400], duracion: 0.5, tipo: 'sawtooth' },
        'giro-fuego-hooh': { frecuencias: [350, 550, 450, 750], duracion: 0.55, tipo: 'sawtooth' },
        'tajo-supremo': { frecuencias: [180, 260, 210, 320, 240], duracion: 0.5, tipo: 'square' },
        'nieve-polvo': { frecuencias: [500, 700, 400, 600], duracion: 0.5, tipo: 'triangle' },
        'giro-fuego': { frecuencias: [300, 500, 400, 700], duracion: 0.5, tipo: 'sawtooth' },
        'hoja-afilada': { frecuencias: [700, 900, 800, 1000], duracion: 0.4, tipo: 'sawtooth' },
        'velocidad-extrema': { frecuencias: [900, 1100, 800, 1200, 1000], duracion: 0.35, tipo: 'square' },
        'cambiafuerza': { frecuencias: [400, 500, 450, 550, 500, 600], duracion: 0.6, tipo: 'sine' },
        'sombra-vil': { frecuencias: [300, 200, 350, 250], duracion: 0.5, tipo: 'triangle' },
        'ascuas': { frecuencias: [500, 700, 600, 800], duracion: 0.25, tipo: 'square' },
        'hidrobomba': { frecuencias: [400, 600, 500, 700], duracion: 0.5, tipo: 'sine' },
        'martillo-hielo': { frecuencias: [200, 400, 300, 500], duracion: 0.5, tipo: 'square' },
        'alarido': { frecuencias: [150, 200, 180, 250, 200, 300], duracion: 0.7, tipo: 'sawtooth' },
        'ventisca': { frecuencias: [600, 800, 500, 900, 700, 1000], duracion: 0.6, tipo: 'triangle' },
        'voltiocambio': { frecuencias: [900, 1200, 1000, 1400, 1100], duracion: 0.35, tipo: 'square' },
        'tajo-umbrio': { frecuencias: [250, 350, 200, 400], duracion: 0.4, tipo: 'sawtooth' },
        'senuelo': { frecuencias: [600, 800, 700, 900, 800, 1000], duracion: 0.5, tipo: 'sine' },
        'psicocarga': { frecuencias: [500, 700, 900, 800, 1000], duracion: 0.35, tipo: 'sine' },
        'viento-hielo': { frecuencias: [700, 900, 800, 1000, 900], duracion: 0.4, tipo: 'triangle' },
        'rizo-algodon': { frecuencias: [400, 600, 500, 700], duracion: 0.5, tipo: 'sine' },
        'bomba-lodo': { frecuencias: [200, 250, 180, 300], duracion: 0.4, tipo: 'sawtooth' },
        'azote-torrencial': { frecuencias: [400, 500, 450, 600, 550, 700], duracion: 0.45, tipo: 'sine' },
        'hidropulso': { frecuencias: [400, 500, 450, 550, 500, 600], duracion: 0.6, tipo: 'sine' },
        'pistola-agua': { frecuencias: [400, 600, 500, 700], duracion: 0.35, tipo: 'sine' },
        'bola-voltio2': { frecuencias: [900, 1300, 1100, 1500], duracion: 0.4, tipo: 'square' },
        'danza-dragon': { frecuencias: [500, 700, 600, 800, 700, 900], duracion: 0.55, tipo: 'triangle' },
        'bote': { frecuencias: [400, 600, 500, 800], duracion: 0.5, tipo: 'sine' },
        'truco': { frecuencias: [600, 800, 700, 900, 800, 1000], duracion: 0.5, tipo: 'sine' },
        'descanso': { frecuencias: [300, 250, 300, 200], duracion: 0.7, tipo: 'sine' },
        'llama-embrujada': { frecuencias: [400, 600, 500, 700, 600, 800], duracion: 0.55, tipo: 'sine' },
        'roca-afilada': { frecuencias: [150, 250, 200, 300], duracion: 0.5, tipo: 'square' },
        'llama-reavivadora': { frecuencias: [500, 700, 900, 1100], duracion: 0.6, tipo: 'sine' },
        'teletransporte': { frecuencias: [800, 1200, 900, 1300, 1000], duracion: 0.5, tipo: 'sine' },
        'cometa-draco': { frecuencias: [300, 500, 700, 400, 600, 800], duracion: 0.6, tipo: 'sawtooth' },
        'puno-fuego': { frecuencias: [300, 500, 800], duracion: 0.25, tipo: 'square' }
    };
    const config = fallbacks[idSonido] || { frecuencias: [880], duracion: 0.3, tipo: 'sine' };
    try {
        const ahora = audioContext.currentTime;
        config.frecuencias.forEach((freq, idx) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.type = config.tipo; osc.frequency.value = freq;
            const inicio = ahora + (idx * 0.08);
            const duracionNota = config.duracion / config.frecuencias.length;
            gain.gain.setValueAtTime(0.0001, inicio);
            gain.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.00001, inicio + duracionNota);
            osc.start(inicio); osc.stop(inicio + duracionNota);
        });
    } catch (e) {}
}

const TIEMPOS_FIN_RONDA = {
    RESULTADO_MS: 1800,
    BOCADILLO_MS: 3000,
    CAMBIO_RIVAL_MS: 600,
    RESET_TABLERO_MS: 500,
    IA_MS: 800,
    TORNEO_MS: 300,
    TIENDA_DELAY_MS: 500
};

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ejecutarFinDeRonda(victoria, esPvE) {
    if (window._finRondaEnCurso) {
        console.warn('⚠️ ejecutarFinDeRonda ya en curso, ignorando llamada');
        return;
    }
    window._finRondaEnCurso = true;

    // 🆕 FIX TORNEO: capturar la ronda que acaba de terminar ANTES de
    // asignar el rival de la siguiente. Si no, la simulación excluye al
    // rival nuevo y hace pelear dos veces al que acaba de combatir.
    // `_ultimoRivalCombatido` lo fija combate.js antes de subir `fase`,
    // así que sigue siendo válido aunque la próxima ronda sea PvE.
    const rivalRondaTerminada = window._ultimoRivalCombatido
        ? { nombre: window._ultimoRivalCombatido }
        : (window.rivalActual ? { nombre: window.rivalActual.nombre } : null);
    const parejasRondaTerminada = (window._parejasRanking || []).map(p => p.slice());

    // 🆕 FIX: si el jugador ha muerto, no seguir con la ronda.
    if (typeof vidaJugador === 'number' && vidaJugador <= 0) {
        console.log('💀 Jugador muerto, terminando partida...');
        if (typeof gameOver === 'function') gameOver();
        window._finRondaEnCurso = false;
        return;
    }

    // 🆕 FIX: usar la SIGUIENTE ronda (nuevaRondaEsPvE), no el combate
    // que acaba de terminar (esPvE). Si la ronda 1 fue PvE pero la 2
    // es PvP, hay que asignar rival igualmente.
    // 👥 En 2P no hay PvE ni torneo: se gestiona aparte.
    const es2PFinRonda = (window.modoDosJugadores === true);
    const nuevaRondaEsPvE = (!es2PFinRonda && typeof esRondaPvE === 'function' && esRondaPvE(fase));

    // 🆕 FIX CRÍTICO: declarar rondaRecienTerminadaEsPvE ANTES de usarla.
    const rondaRecienTerminadaEsPvE = (!es2PFinRonda && esPvE === true);


    try {
        // 🆕 FIX: solapar overlay y bocadillo.
        await esperar(Math.max(TIEMPOS_FIN_RONDA.RESULTADO_MS, TIEMPOS_FIN_RONDA.BOCADILLO_MS));

        if (es2PFinRonda) {
            // 👥 2P: no se toca el torneo, no se spawnea PvE y no se
            // simulan rivales. Solo se abre la tienda del jugador activo.
            if (typeof mostrarTiendaPostRonda === 'function') mostrarTiendaPostRonda();
            if (typeof renderizar === 'function') renderizar();
            if (typeof reanudarFondoPreparacion === 'function') reanudarFondoPreparacion();
            if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();
            return;
        }

        if (!nuevaRondaEsPvE) {
            // 1) Devolver objetos de las unidades del rival anterior al baúl
            if (typeof autoDevolverObjetosAlBaul === 'function') {
                for (let i = 0; i < enemyBoard.length; i++) {
                    if (enemyBoard[i] && enemyBoard[i].objetos && enemyBoard[i].objetos.length > 0) {
                        try { autoDevolverObjetosAlBaul(enemyBoard[i], 'enemigo'); } catch (e) {}
                    }
                }
                for (let i = 0; i < enemyBanquillo.length; i++) {
                    if (enemyBanquillo[i] && enemyBanquillo[i].objetos && enemyBanquillo[i].objetos.length > 0) {
                        try { autoDevolverObjetosAlBaul(enemyBanquillo[i], 'enemigo'); } catch (e) {}
                    }
                }
            }

            // 2) Limpiar tablero, banquillo, baúl y tienda del rival anterior
            for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
            for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;
            if (typeof enemyBaulObjetos !== 'undefined') enemyBaulObjetos = [];
            if (typeof enemyObjetosEnTienda !== 'undefined') enemyObjetosEnTienda = [];
            if (typeof enemyObjetoCompradoEstaRonda !== 'undefined') enemyObjetoCompradoEstaRonda = false;

            // 3) Entrar al NUEVO rival (asignarRivalAleatorioInmediato ya
            //    restaura el equipo completo con restaurarEquipoRival,
            //    mete los objetos iniciales en enemyBaulObjetos y genera
            //    la tienda si la ronda es de objetos).
            if (typeof asignarRivalAleatorioInmediato === 'function') {
                asignarRivalAleatorioInmediato();
            }
            // 🆕 FIX: si el torneo ya terminó (sin rivales vivos), finalizar
            // en vez de seguir la ronda con un rival genérico / null.
            if (window.torneoRivales && window.torneoRivales.length > 0
                && typeof comprobarFinTorneo === 'function'
                && comprobarFinTorneo()) {
                return;
            }
            if (typeof cambiarTerrenoPorRival === 'function' && window.rivalActual) {
                cambiarTerrenoPorRival(window.rivalActual);
            }
            if (typeof reanudarMusicaPreparacion === 'function') {
                reanudarMusicaPreparacion();
            } else if (typeof reanudarFondoPreparacion === 'function') {
                reanudarFondoPreparacion();
            }

            await esperar(TIEMPOS_FIN_RONDA.CAMBIO_RIVAL_MS);

            // 4) 🆕 El equipo ya lo restauró asignarRivalAleatorioInmediato()
            //    (llamado en el paso 3). Aquí solo renderizamos para que
            //    se vea actualizado antes de la IA.
            if (typeof renderizar === 'function') renderizar();
            await esperar(TIEMPOS_FIN_RONDA.RESET_TABLERO_MS);
        }

        // 🆕 FIX: upgradeEnemyTeam hace que el rival compre Pokémon,
        //    suba de nivel, fusione y equipe objetos del baúl.
        if (!nuevaRondaEsPvE && typeof upgradeEnemyTeam === 'function') {
            await upgradeEnemyTeam();
            await esperar(TIEMPOS_FIN_RONDA.IA_MS);
        }

        // 🆕 FIX: compra de objeto GARANTIZADA en rondas de tienda de objetos.
        if (!nuevaRondaEsPvE && typeof enemyComprarObjetoGarantizado === 'function') {
            enemyComprarObjetoGarantizado();
        }

        // 🆕 FIX ECONOMÍA: En rondas PvE los rivales NO combaten entre sí
        // y NO ganan oro (igual que el jugador en la ronda 1).
                if (rondaRecienTerminadaEsPvE) {
            // 🆕 FIX v5: en ronda PvE los rivales TAMBIÉN ganan su recompensa.
            // No descansan: todos se llevan oro + objeto, igual que el jugador.

            // 1) Simular "victoria contra el monstruo" para todos los rivales vivos.
            //    NADIE pierde HP. Todos ganan oro, racha y posible subida de nivel.
            if (typeof simularCombatesPvE === 'function') {
                // 🆕 FIX: usar el rival de la ronda terminada (el monstruo),
                // no el que se acaba de asignar para la ronda siguiente.
                // En PvE el monstruo no está en torneoRivales, así que no
                // se excluye a nadie y todos los rivales cobran su premio.
                simularCombatesPvE(fase - 1, rivalRondaTerminada);
            }

            // 2) Objeto aleatorio de recompensa (igual que antes).
            // 3) Asegurar equipo inicial si no lo tiene.
            if (window.torneoRivales && window.torneoRivales.length > 0) {
                for (let rival of window.torneoRivales) {
                    if (rival.eliminado) continue;

                                        // 🆕 FIX: en la ronda PvE 1 (arranque) NO se da objeto a nadie.
                    // Solo se da a partir de la ronda 6 (la primera PvE "real").
                    // Así los rivales no acumulan objetos gratis en la ronda 1.
                    const rondaPvEActual = fase - 1;  // la que acaba de terminar
                    const esPvEArranque = (rondaPvEActual <= 1);

                    if (!esPvEArranque && typeof OBJETOS !== 'undefined' && typeof generarObjetosTienda === 'function') {
                        const objetosPosibles = generarObjetosTienda();
                        if (objetosPosibles.length > 0) {
                            // 🆕 FIX: no dar chips de tipos ajenos a la estrategia del rival.
                            const tiposRival = (rival.estrategia && rival.estrategia.tipos) || [];
                            const objetosFiltrados = objetosPosibles.filter(nombre => {
                                const obj = OBJETOS[nombre];
                                if (!obj) return false;
                                if (obj.efecto && obj.efecto.tipoBonus) {
                                    return tiposRival.includes(obj.efecto.tipoBonus);
                                }
                                return true; // objetos normales: siempre válidos
                            });
                            if (objetosFiltrados.length > 0) {
                                const objetoElegido = objetosFiltrados[Math.floor(Math.random() * objetosFiltrados.length)];
                                if (!rival.objetosAcumulados) rival.objetosAcumulados = [];
                                rival.objetosAcumulados.push(objetoElegido);
                            }
                        }
                    } else if (esPvEArranque) {
                    }

                    const tieneEquipoPrev = rival._equipoGuardado && rival._equipoGuardado.tablero && rival._equipoGuardado.tablero.some(Boolean);
                    if (!tieneEquipoPrev && typeof generarEquipoPlaceholderRival === 'function') {
                        if (!rival.nivel || rival.nivel < 2) {
                            rival.nivel = 2;
                        }
                        if (typeof rival.oro !== 'number') rival.oro = 10;

                        const equipoGen = generarEquipoPlaceholderRival(rival);
                        rival._equipoGuardado = {
                            tablero: equipoGen.tablero,
                            banquillo: equipoGen.banquillo
                        };

                        if (typeof equipoGen.oroGastado === 'number' && equipoGen.oroGastado > 0) {
                            rival.oro = Math.max(0, rival.oro - equipoGen.oroGastado);
                        }
                    }
                }
            }
        } else if (typeof simularCombatesRivales === 'function') {
            // 🆕 FIX: la ronda que acaba de terminar es PvP, así que se
            // simula SIEMPRE, aunque la siguiente ronda sea PvE. Antes se
            // saltaba cuando `nuevaRondaEsPvE` era true y los rivales
            // perdían una ronda entera de combate.
            simularCombatesRivales(rivalRondaTerminada, parejasRondaTerminada);
        }

                // 🆕 FIX: NO limpiar los estados del ranking aquí.
        // Los ✔ / ✖ / -X se mantienen visibles durante varios segundos
        // después de la ronda para que el jugador los vea, incluido el
        // suyo propio. Se limpian en el timeout de 5s de abajo.
        //
        // 🆕 Mantener las parejas visibles durante toda la ronda.
        // Se desactivarán al inicio de la SIGUIENTE ronda (cuando
        // asignarRivalAleatorioInmediato() recalcule las parejas).
        // Así el ranking muestra "Tú vs Valerie / Erika vs Rojo / ..."
        // hasta que empiece la ronda 3.
        if (typeof actualizarRankingTorneo === 'function') actualizarRankingTorneo();
        await esperar(TIEMPOS_FIN_RONDA.TORNEO_MS);

        // 🆕 Después de unos segundos, ocultar los ✔ / ✖ / -X de los rivales
        // y también los del jugador (solo los visuales; los datos de vida
        // y el daño ya están aplicados en el HP de cada uno).
        setTimeout(() => {
            window._ultimaVictoriaJugador = undefined;
            window._ultimoDanoRecibidoJugador = 0;
            if (window.torneoRivales) {
                window.torneoRivales.forEach(r => {
                    r._estadoRonda = null;
                    r._danoRonda = null;
                });
            }
            if (typeof actualizarRankingTorneo === 'function') actualizarRankingTorneo();
        }, 5000); // 5 segundos visibles

        if (typeof comprobarFinTorneo === 'function') {
            if (comprobarFinTorneo()) {
                return;
            }
        }

        if (typeof mostrarContadorRonda === 'function') mostrarContadorRonda();
        await esperar(TIEMPOS_FIN_RONDA.TIENDA_DELAY_MS);

        // 🆕 FIX: llamar SIEMPRE a mostrarTiendaPostRonda, aunque la tienda
        // esté abierta.
                        if (typeof mostrarTiendaPostRonda === 'function') {
            // 🆕 FIX: Si acabamos de terminar PvE, esperamos un poco y abrimos la tienda.
            // El monstruo ya ha sido limpiado en combatir().
            if (rondaRecienTerminadaEsPvE) {
                setTimeout(() => {
                    if (typeof mostrarTiendaPostRonda === 'function') {
                        mostrarTiendaPostRonda(true);
                    }
                }, 0); // 🆕 1 segundo antes → 0ms (instantáneo en PvE)
            } else {
                mostrarTiendaPostRonda(true);
            }
        }

        if (typeof renderizar === 'function') renderizar();

        if (typeof reanudarFondoPreparacion === 'function') {
            reanudarFondoPreparacion();
        }

        if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

        // ============================================================
        // 🆕 SNAPSHOT de TODOS los rivales vivos al final de la ronda
        // ============================================================
        if (window.torneoRivales) {

            // 1) Snapshot del rival ACTIVO (SIEMPRE, PvE o PvP)
            if (window.rivalActual) {
                const rivalActivo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
                if (rivalActivo) {
                    rivalActivo.vida = Math.max(0, enemyHealth);
                    rivalActivo.oro = enemyGold;
                    rivalActivo.nivel = enemyLevel;
                    rivalActivo.racha = (enemyWinStreak || 0) - (enemyLossStreak || 0);
                    rivalActivo.eliminado = rivalActivo.vida <= 0;
                    rivalActivo._equipoGuardado = {
                        tablero: enemyBoard.map(u => u ? u.clonarParaCombate() : null),
                        banquillo: enemyBanquillo.map(u => u ? u.clonarParaCombate() : null)
                    };

                                        // 🆕 FIX v2: NO volcar enemyBaulObjetos a rival.objetosAcumulados.
                    //    El baúl enemigo se resetea al entrar al siguiente rival
                    //    (asignarRivalAleatorioInmediato → enemyBaulObjetos = []),
                    //    así que volcarlo aquí hacía que los objetos se DUPLICARAN
                    //    entre rondas (1 en el baúl + 1 en objetosAcumulados = 2).
                    //    Ahora los objetos equipados se guardan en _equipoGuardado
                    //    (con los objetos dentro de cada unidad), y los NO equipados
                    //    se pierden al cambiar de rival (que es lo correcto: el rival
                    //    se lleva su equipo, no deja objetos sueltos).

                                        const totalU = (enemyBoard.filter(Boolean).length + enemyBanquillo.filter(Boolean).length);
                    const estrellas = {};
                    for (let u of [...enemyBoard, ...enemyBanquillo]) {
                        if (!u || u.esZacian || u.esArticuno) continue;
                        estrellas[u.nivel || 1] = (estrellas[u.nivel || 1] || 0) + 1;
                    }
                    const resumenEstrellas = Object.keys(estrellas).sort().map(k => `${estrellas[k]}×${k}★`).join(' ');
                }
            }

                       // 2) 🆕 FIX TORNEO: TODOS los rivales vivos avanzan un turno
            //    (nivel, equipo completo, fusiones, objetos).
            //    El rival activo ya lo procesó upgradeEnemyTeam durante el combate.
            if (!rondaRecienTerminadaEsPvE && typeof avanzarRivalUnTurno === 'function') {
                for (const r of window.torneoRivales) {
                    if (r.eliminado) continue;
                    if (window.rivalActual && r.nombre === window.rivalActual.nombre) continue;
                    avanzarRivalUnTurno(r);
                }
            }

                                    // 3) 🆕 FORZAR FUSIONES DE TODOS LOS RIVALES VIVOS
            //    🆕 FIX: ya NO se toca el tablero/banquillo global del
            //    jugador. forzarFusionesRival(rival) trabaja sobre una
            //    copia local de rival._equipoGuardado.
            if (!rondaRecienTerminadaEsPvE) {
                if (window.torneoRivales && typeof forzarFusionesRival === 'function') {
                    for (const r of window.torneoRivales) {
                        if (r.eliminado) continue;
                        try { forzarFusionesRival(r); } catch (e) { console.error('Error forzando fusión de', r.nombre, e); }
                    }
                }
            }
        }

    } finally {
        // 🆕 FIX: el contador de ronda SIEMPRE debe quedar visible al terminar la ronda
        if (typeof mostrarContadorRonda === 'function') {
            mostrarContadorRonda();
        }
        window._finRondaEnCurso = false;
    }
}

window.ejecutarFinDeRonda = ejecutarFinDeRonda;
window.esperar = esperar;


function asignarRivalAleatorio() {
    if (window._rivalAsignadoUnaVez === true) {
        return;
    }
    window._rivalAsignadoUnaVez = true;
    asignarRivalAleatorioInmediato();
}

function asignarRivalAleatorioInmediato() {
    if (window._modoOnline) return; // online 1v1: sin rival IA
    const rivalAnterior = window.rivalActual ? { ...window.rivalActual } : null;

    // 🆕 Desactivar parejas de la ronda anterior ANTES de recalcular.
    // Se volverán a preparar al final de esta función con el nuevo rival.
    if (typeof desactivarParejasRanking === 'function') {
        desactivarParejasRanking();
    }

    if (window.torneoRivales && window.torneoRivales.length > 0 && !window._rivalForzado) {
        const vivos = window.torneoRivales.filter(r => !r.eliminado);

        // 🆕 FIX: llevar un registro de rivales ya combatidos para
        // no repetir hasta haber luchado contra todos los vivos.
        if (!window._rivalesYaCombatidos) window._rivalesYaCombatidos = [];

        // Filtrar los que ya hemos combatido (y siguen vivos)
        const noCombatidos = vivos.filter(r => !window._rivalesYaCombatidos.includes(r.nombre));

        let candidatos;
        if (noCombatidos.length > 0) {
            candidatos = noCombatidos;
        } else {
            window._rivalesYaCombatidos = [];
            candidatos = vivos;
        }

        // Evitar repetir el último rival combatido (por si acaso)
        if (candidatos.length > 1 && window._ultimoRivalCombatido) {
            const sinRepetir = candidatos.filter(r => r.nombre !== window._ultimoRivalCombatido);
            if (sinRepetir.length > 0) {
                candidatos = sinRepetir;
            }
        }

        if (candidatos.length > 0) {
            const elegidoTorneo = candidatos[Math.floor(Math.random() * candidatos.length)];

            // 🆕 FIX: marcar al elegido como combatido
            if (!window._rivalesYaCombatidos.includes(elegidoTorneo.nombre)) {
                window._rivalesYaCombatidos.push(elegidoTorneo.nombre);
            }

            rivalActual = {
                nombre: elegidoTorneo.nombre,
                avatar: elegidoTorneo.avatar,
                estrategia: elegidoTorneo.estrategia,
                frases: elegidoTorneo.frases
            };
            window.rivalActual = rivalActual;

            // 🆕 FIX TORNEO: enemyLevel lo controla restaurarEquipoRival() a partir
            // del nivel guardado del rival (no lo reseteamos aquí a mano).

            if (typeof enemyGold !== 'undefined') {
                enemyGold = (typeof elegidoTorneo.oro === 'number') ? elegidoTorneo.oro : 10;
            }

            if (typeof enemyHealth !== 'undefined') {
                enemyHealth = (typeof elegidoTorneo.vida === 'number') ? elegidoTorneo.vida : 50;
            }

            // 🆕 FIX: cargar la racha del rival desde el torneo
            if (typeof enemyWinStreak !== 'undefined' && typeof enemyLossStreak !== 'undefined') {
                const rachaTorneo = (typeof elegidoTorneo.racha === 'number') ? elegidoTorneo.racha : 0;
                if (rachaTorneo > 0) {
                    enemyWinStreak = rachaTorneo;
                    enemyLossStreak = 0;
                } else if (rachaTorneo < 0) {
                    enemyWinStreak = 0;
                    enemyLossStreak = Math.abs(rachaTorneo);
                } else {
                    enemyWinStreak = 0;
                    enemyLossStreak = 0;
                }
            }

            const enemyNameEl = document.getElementById("enemyName");
            const enemyAvatarEl = document.getElementById("enemyAvatar");
            if (enemyNameEl) enemyNameEl.textContent = rivalActual.nombre;
            if (enemyAvatarEl) {
                enemyAvatarEl.innerHTML = '';
                const img = document.createElement('img');
                img.src = `assets/avatars/rivales/${rivalActual.avatar}.webp`;
                img.alt = rivalActual.nombre;
                img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
                enemyAvatarEl.appendChild(img);
            }
                        if (typeof addConsoleMessage === 'function') {
                addConsoleMessage(`🎭 RIVAL DEL TORNEO: ${rivalActual.nombre} — ${rivalActual.estrategia.descripcion}`, 'enemy');
            }
            if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();

            // 🆕 FIX TORNEO: restaurar el equipo COMPLETO del rival
            //    (no solo 1 Pokémon inicial). Si es la primera vez que
            //    sale, restaurarEquipoRival genera el equipo completo a
            //    partir de su nivel.
            if (typeof restaurarEquipoRival === 'function') {
                restaurarEquipoRival(elegidoTorneo, `(entrando en ronda ${fase})`);
            } else {
                console.warn('⚠️ restaurarEquipoRival no está definida. ¿torneo.js v3 cargado?');
            }

                        // 🆕 FIX: si la ronda actual es de tienda de objetos, generar la tienda.
            //    En rondas de objetos NO se meten objetos iniciales al baúl
            //    (enemyBaulObjetos = []), solo se genera la tienda para que el
            //    rival compre 1. Así nunca se duplican objetos.
            if (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase)) {
                if (typeof generarObjetosTienda === 'function') {
                    enemyObjetosEnTienda = generarObjetosTienda();

                    // 🆕 FIX: si el rival ya compró su objeto en avanzarRivalUnTurno
                    // (torneo.js), marcamos enemyObjetoCompradoEstaRonda = true
                    // para que NO compre un segundo objeto al entrar al combate.
                    const rivalEnTorneoCheck = window.torneoRivales
                        ? window.torneoRivales.find(r => r.nombre === elegidoTorneo.nombre)
                        : null;

                    if (rivalEnTorneoCheck && rivalEnTorneoCheck._objetoCompradoEstaRonda) {
                        enemyObjetoCompradoEstaRonda = true;
                    } else {
                        enemyObjetoCompradoEstaRonda = false;
                    }
                }
            } else {
                enemyObjetosEnTienda = [];
                enemyObjetoCompradoEstaRonda = false;
            }

            // 🆕 FIX TORNEO: restaurar el equipo COMPLETO del rival
            //    (no solo 1 Pokémon inicial). Si es la primera vez que
            //    sale, restaurarEquipoRival genera el equipo completo a
            //    partir de su nivel.
                        if (typeof restaurarEquipoRival === 'function') {
                restaurarEquipoRival(elegidoTorneo, `(entrando en ronda ${fase})`);
            } else {
                console.warn('⚠️ restaurarEquipoRival no está definida. ¿torneo.js v3 cargado?');
            }

            // 🆕 Preparar parejas del ranking (solo si hay torneo real)
            if (window.torneoRivales && window.torneoRivales.length > 0) {
                if (typeof prepararParejasRanking === 'function') {
                    prepararParejasRanking();
                }
                if (typeof actualizarRankingTorneo === 'function') {
                    actualizarRankingTorneo();
                }
            }

            return;
        } else {
            // 🆕 FIX: no quedan rivales vivos en el torneo. No caer al
            // rival genérico "Rival"; marcar null para que ejecutarFinDeRonda
            // detecte el fin del torneo.
            rivalActual = null;
            window.rivalActual = null;
            return;
        }
    }

    const rivales = window.RIVALES_INFO || [];
    if (rivales.length === 0) { rivalActual = null; window.rivalActual = null; return; }

    let rivalElegido;

    if (window._rivalForzado) {
        rivalElegido = rivales.find(r => r.nombre === window._rivalForzado);
        if (rivalElegido) {
        } else {
            console.warn(`⚠️ Rival "${window._rivalForzado}" no encontrado, usando aleatorio`);
            rivalElegido = rivales[Math.floor(Math.random() * rivales.length)];
        }
    } else {
        rivalElegido = rivales[Math.floor(Math.random() * rivales.length)];
    }

    rivalActual = rivalElegido;
    window.rivalActual = rivalElegido;

    const enemyNameEl = document.getElementById("enemyName");
    const enemyAvatarEl = document.getElementById("enemyAvatar");
    if (!window._modoOnline) { // online: el panel rival es el jugador 2, no la IA
        if (enemyNameEl) enemyNameEl.textContent = rivalElegido.nombre;
        if (enemyAvatarEl) {
            enemyAvatarEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = `assets/avatars/rivales/${rivalElegido.avatar}.webp`;
            img.alt = rivalElegido.nombre;
            img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
            enemyAvatarEl.appendChild(img);
        }
    }
    if (typeof addConsoleMessage === 'function') addConsoleMessage(`🎭 RIVAL: ${rivalElegido.nombre} — ${rivalElegido.estrategia.descripcion}`, 'enemy');
    if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();

    // 🆕 FIX: objetos iniciales SOLO si NO es ronda de objetos
    if (typeof enemyBaulObjetos !== 'undefined' && Array.isArray(enemyBaulObjetos)) {
        enemyBaulObjetos = [];
        const esRondaObjetosActual = (!window._modoOnline && typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase));
        if (!window._modoOnline && !esRondaObjetosActual) {
            const objetosIniciales = Math.floor((fase - 1) / 3);
            const MAX_OBJETOS_INICIALES = 4;
            if (objetosIniciales > 0 && typeof generarObjetosTienda === 'function') {
                const total = Math.min(objetosIniciales, MAX_OBJETOS_INICIALES);
                for (let i = 0; i < total; i++) {
                    if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) break;
                    const objetosPosibles = generarObjetosTienda();
                    if (objetosPosibles.length > 0) {
                        const elegido = objetosPosibles[Math.floor(Math.random() * objetosPosibles.length)];
                        enemyBaulObjetos.push(elegido);
                    }
                }
            }
        }
    }

    // 🆕 FIX: si la ronda actual es de tienda de objetos, generar la tienda.
    if (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase)) {
        if (typeof generarObjetosTienda === 'function') {
            enemyObjetosEnTienda = generarObjetosTienda();
            enemyObjetoCompradoEstaRonda = false;
        }
    } else {
        enemyObjetosEnTienda = [];
        enemyObjetoCompradoEstaRonda = false;
    }
}

window.asignarRivalAleatorioInmediato = asignarRivalAleatorioInmediato;

// ============================================================
// 🆕 HELPER: genera un equipo placeholder para un rival del torneo
// ============================================================
function generarEquipoPlaceholderRival(rival) {
    const tiposRival = (rival.estrategia && rival.estrategia.tipos) ? rival.estrategia.tipos : [];
    const nivelRival = rival.nivel || 1;

    // 🆕 FIX TORNEO: apuntar al MÁXIMO del nivel, no al mínimo.
    // Un rival de nivel 8 debe entrar con 6 unidades, no con 5.
    const maxSlot = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[nivelRival])
        ? TABLA_MAX_UNIDADES[nivelRival]
        : 3;
    const minUnidades = maxSlot;

    const tablero = new Array(20).fill(null);

    // 1) Pokémon inicial (coste 1, del tipo del rival si se puede)
    const candidatosInicial = (typeof POKEMONS_COSTE1 !== 'undefined' ? POKEMONS_COSTE1 : []).filter(p =>
        p.base !== false && (!tiposRival.length || (p.tipos && p.tipos.some(t => tiposRival.includes(t))))
    );
    const pokeInicial = candidatosInicial.length > 0
        ? candidatosInicial[Math.floor(Math.random() * candidatosInicial.length)]
        : (typeof POKEMONS_COSTE1 !== 'undefined' ? POKEMONS_COSTE1 : [])[0];

    let colocados = 0;
    let oroGastado = 0;

    if (pokeInicial && pokeInicial.id) {
        const u = new Unidad(pokeInicial, 1, pokeInicial.id, pokeInicial.coste || 1);
        u.equipo = 'enemy';
        tablero[8] = u;  // E3 (frente)
        colocados = 1;
        // 🆕 NO se descuenta el coste del inicial: es "gratis" como el del jugador
    }

    // 2) Rellenar hasta llegar a minUnidades
    let pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p =>
        p.base !== false && p.coste <= 2 &&
        (!tiposRival.length || (p.tipos && p.tipos.some(t => tiposRival.includes(t))))
    );

    if (pool.length === 0) {
        pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => p.base !== false && p.coste <= 2);
    }
    if (pool.length === 0) {
        pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => p.base !== false);
    }

    // Oro simulado del rival (por defecto 10 como el jugador en ronda 1)
    let oroRival = (typeof rival.oro === 'number' && !isNaN(rival.oro)) ? rival.oro : 10;
    // 🆕 FIX TORNEO: si el rival es de nivel alto y no tiene oro, darle un mínimo
    if (nivelRival >= 5 && oroRival < 20) oroRival = 20;
    if (nivelRival >= 7 && oroRival < 40) oroRival = 40;

    for (let i = 0; i < tablero.length && colocados < minUnidades; i++) {
        if (tablero[i] !== null) continue;
        if (i === 8) continue;

        // 🆕 FIX TORNEO: umbral de oro mínimo a 1 (antes 2)
        if (oroRival < 1) break;

        const p = pool[Math.floor(Math.random() * pool.length)];
        if (!p) break;
        if (oroRival < p.coste) continue;

        const u = new Unidad(p, 1, p.id, p.coste);
        u.equipo = 'enemy';
        tablero[i] = u;
        colocados++;
        oroGastado += (p.coste || 1);
        oroRival -= (p.coste || 1);
    }

    // 🆕 Devolver cuánto oro ha gastado para que el caller lo descuente
    return {
        tablero: tablero,
        banquillo: new Array(8).fill(null),
        oroGastado: oroGastado
    };
}

window.generarEquipoPlaceholderRival = generarEquipoPlaceholderRival;

// 🆕 Función para cambiar el fondo de la arena según el rival
// ============================================================
// 🆕 FUNCIÓN CENTRALIZADA PARA APLICAR EL TERRENO
// ============================================================
// Decide el terreno según el modo:
//   - Modo Creativo → SIEMPRE terreno-creativo.png
//   - Modo 1J/Torneo → terreno según el rival (o terreno-salvaje en PvE)
//   - Modo 2J → terreno según el rival (igual que 1J)
//
// Esta función es la ÚNICA que toca --terreno-actual.
// Cualquier otro sitio que quiera cambiar el terreno debe llamar aquí.
// ============================================================
function aplicarTerrenoActual(rival) {
    // 🆕 MODO CREATIVO: siempre el mismo fondo, sin cambios
    if (window.modoCreativo === true) {
        document.body.style.setProperty('--terreno-actual', `url('../assets/backgrounds/terreno-creativo.webp')`);
        const arena = document.querySelector('.arena-row');
        if (arena) arena.style.backgroundImage = 'none';
        return;
    }

    // --- Modo normal (1J / 2J / Torneo) ---
    let tipoPrincipal = 'default';
    if (rival && rival.estrategia && rival.estrategia.tipos && rival.estrategia.tipos.length > 0) {
        tipoPrincipal = rival.estrategia.tipos[0].toLowerCase();
    }

    tipoPrincipal = tipoPrincipal.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (window.enRondaPvE === true || (rival && rival.esMonstruo)) {
        tipoPrincipal = 'salvaje';
    }

    const terrenosDisponibles = ['fuego', 'agua', 'planta', 'electrico', 'psiquico', 'siniestro', 'hada', 'fantasma', 'lucha', 'veneno', 'hielo', 'dragon', 'roca', 'volador', 'acero', 'eevee', 'salvaje'];

    let urlFinal;
    let nombreLog;

    if (terrenosDisponibles.includes(tipoPrincipal)) {
        urlFinal = `url('../assets/backgrounds/terreno-${tipoPrincipal}.webp')`;
        nombreLog = tipoPrincipal;
    } else {
        urlFinal = `url('../assets/backgrounds/terreno.webp')`;
        nombreLog = 'default';
    }

    document.body.style.setProperty('--terreno-actual', urlFinal);

    const arena = document.querySelector('.arena-row');
    if (arena) arena.style.backgroundImage = 'none';
}

// 🆕 Alias para no romper el código existente que llama a cambiarTerrenoPorRival
function cambiarTerrenoPorRival(rival) {
    aplicarTerrenoActual(rival);
}

window.aplicarTerrenoActual = aplicarTerrenoActual;
window.cambiarTerrenoPorRival = cambiarTerrenoPorRival;

function checkSubirNivel() {
    let coste = getExpNecesaria();
    while (experiencia >= coste && coste > 0 && Number(nivelJugador) < CONFIG.NIVEL_MAXIMO) {
        experiencia -= coste;
        nivelJugador = Number(nivelJugador) + 1;
        coste = getExpNecesaria();
        playSonidoSubirNivel();
        addConsoleMessage(`⬆️ ¡NIVEL ${nivelJugador}! 🎉`, 'level');
        if (Number(nivelJugador) === 5 || Number(nivelJugador) === 8) {
            if (typeof darDiscoDefinitivo === 'function') darDiscoDefinitivo();
        }
    }
    actualizarInfoJugador();

    // 🆕 FIX: actualizar el ranking del torneo cuando sube de nivel el jugador
    if (typeof actualizarRankingTorneo === 'function') {
        actualizarRankingTorneo();
    }
}

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

function adelantarNivel() {
    if (!puedeInteractuar()) return;
    if (fase <= 1) { addConsoleMessage(`🔒 +4 EXP no disponible en ronda 1`, 'info'); return; }
    if (fase === 2) { addConsoleMessage(`🔒 +4 EXP disponible desde ronda 3`, 'info'); return; }

    if (Number(nivelJugador) < CONFIG.NIVEL_MAXIMO && oro >= 4) {
        oro -= 4;
        experiencia += 4;
        checkSubirNivel();
        actualizarInfoJugador();
        if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') renderizarTiendaIndependiente(false);
        else renderizar();
        playButtonSound();
        addConsoleMessage(`⬆️ +4 EXP (${experiencia}/${getExpNecesaria()})`, 'level');
    } else if (Number(nivelJugador) >= CONFIG.NIVEL_MAXIMO) {
        addConsoleMessage(`⭐ ¡Ya estás en nivel máximo!`, 'info');
    } else {
        addConsoleMessage(`💰 Oro insuficiente! Necesitas 4💰`, 'error');
    }
}

function getMovimientosPokemon(nombre) {
    if (window.MOVIMIENTOS_POKEMON && window.MOVIMIENTOS_POKEMON[nombre]) return window.MOVIMIENTOS_POKEMON[nombre];
    return [{ nombre: "⚔️ Ataque Rápido", tipo: "⚪ Normal" }, { nombre: "💥 Golpe Fuerte", tipo: "⚪ Normal" }];
}

function getDescripcionMovimiento(nombreMovimiento) {
    if (window.movimientosInfo && window.movimientosInfo[nombreMovimiento]) return window.movimientosInfo[nombreMovimiento];
    return null;
}

function limpiarNombreMovimiento(nombre) {
    if (!nombre) return '';
    return nombre.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim();
}

function seleccionarMovimientoCarta(index) {
    movimientoSeleccionadoIndex = index;
    const movimientoItems = document.querySelectorAll('.carta-movimiento-item');
    movimientoItems.forEach((item, idx) => {
        if (idx === index) item.classList.add('seleccionado');
        else item.classList.remove('seleccionado');
    });
    actualizarDescripcionMovimiento();
    playButtonSound();
}

function actualizarDescripcionMovimiento() {
    if (!cartaUnidadActual) return;
    const pokemon = cartaUnidadActual.pokemon;
    const movimientos = getMovimientosPokemon(pokemon.nombre);
    if (movimientoSeleccionadoIndex >= movimientos.length) movimientoSeleccionadoIndex = 0;
    const movimiento = movimientos[movimientoSeleccionadoIndex];
    if (!movimiento) return;
    const nombreLimpio = limpiarNombreMovimiento(movimiento.nombre);
    const descData = getDescripcionMovimiento(nombreLimpio);
    const descripcionContainer = document.getElementById('cartaDescripcionContainer');
    if (descripcionContainer && descData) {
        const claveIcono = movimiento.iconoKey || nombreLimpio;
        const iconoHtml = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(claveIcono, 24) : getIconoTipo(descData.tipo);
        descripcionContainer.innerHTML = `
            <div class="carta-descripcion-nombre">
                <span class="mov-icono">${iconoHtml}</span>
                ${nombreLimpio}
                <span class="tipo-label">${getIconoTipo(descData.tipo)} ${descData.tipo}</span>
            </div>
            <div class="carta-descripcion-texto">${descData.descripcion}</div>
            <div class="carta-descripcion-range">
                <span class="range-label">📏 ALCANCE</span>
                <span class="range-icon">➜</span>
                <span class="range-text">${descData.alcance}</span>
            </div>
        `;
    } else if (descripcionContainer) {
        descripcionContainer.innerHTML = `<div class="carta-descripcion-vacio"><span class="icono">❓</span>Sin descripción disponible</div>`;
    }
}

// ============================================================
// ABRIR CARTA DE POKÉMON (Rediseño v5)
// ============================================================

function abrirCarta(tipo, indice) {
    if (typeof cartaSinergiaAbierta !== 'undefined' && cartaSinergiaAbierta) {
        if (typeof cerrarCartaSinergia === 'function') cerrarCartaSinergia();
    }
    if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto) {
        if (typeof cerrarPanelDatosCombate === 'function') cerrarPanelDatosCombate();
    }

    let unidad = null;
    if (tipo === 'tablero') unidad = tablero[indice];
    else if (tipo === 'banquillo') unidad = banquillo[indice];
    else if (tipo === 'enemigo') unidad = enemyBoard[indice];
    else if (tipo === 'enemigoBanquillo') unidad = enemyBanquillo[indice];
    if (!unidad) { addConsoleMessage('❌ No hay Pokémon en esa posición', 'error'); return; }

    cartaUnidadActual = unidad;
    cartaTipoUbicacion = tipo;
    cartaIndiceUbicacion = indice;
    cartaAbierta = true;
    movimientoSeleccionadoIndex = 0;

    const panel = document.getElementById('cartaPanel');
    if (!panel) return;
    const pokemon = unidad.pokemon;
    const nivelUnidad = unidad.nivel || 1;
    const secundarioDesbloqueado = unidad.movSecundarioDesbloqueado || (nivelUnidad >= 2);

    // ==========================================
    // CONSTRUIR HTML DE LA CARTA
    // ==========================================

    // 1. Cabecera
    let estrellasHtml = `<img src="${getEstrellasUrl(nivelUnidad)}" alt="${nivelUnidad}★" draggable="false" style="height: 28px; vertical-align: middle; margin-left: 2px;">`;
    let nombreMostrar = (unidad.esShiny ? '✨ ' : '') + pokemon.nombre;
    const costeNum = unidad.costeOriginal || pokemon.coste || 1;

    let html = `
        <div class="carta-header">
            <div style="display:flex; align-items:center; gap:8px;">
                <h2 class="carta-nombre">${nombreMostrar}</h2>
                ${estrellasHtml}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div class="carta-coste">
                    <img src="assets/icons/moneda.png" alt="💰" draggable="false" style="width:24px;height:24px;object-fit:contain;">
                    ${costeNum}
                </div>
                <button class="carta-cerrar" onclick="cerrarCarta()" title="Cerrar (Esc)">✕</button>
            </div>
        </div>
    `;

    // 2. Tipos
    html += `<div class="carta-tipos-clase">`;
    if (pokemon.tipos) {
        pokemon.tipos.forEach(tipoNom => {
            const colorFondo = getColorTipo(tipoNom);
            html += `<span class="carta-tipo" data-tipo="${tipoNom}" style="background-color:${colorFondo}; color:${tipoNom === 'Veneno' || tipoNom === 'Siniestro' ? '#fff' : '#000'}">
                ${getIconoTipo(tipoNom)} ${tipoNom}
            </span>`;
        });
    }
    if (pokemon.clase) {
        html += `<span class="carta-clase-integrada" style="background: rgba(0,0,0,0.4); color: #fff; border: 1px solid #4a6a8a;">
            ${getIconoClase(pokemon.clase)} ${pokemon.clase}
        </span>`;
    }
    html += `</div>`;

    // 3. Stats Grid
    let hpVal = unidad.maxHp || pokemon.hp || 0;
    let ataqueVal = unidad.ataque || pokemon.ataque || 0;
    let spAtkVal = unidad.ataqueEspecial || pokemon.spAttack || 0;
    let defensaVal = unidad.defensa || pokemon.defense || 0;
    let spDefensaVal = unidad.defensaEspecial || pokemon.spDefense || 0;
    let velocidadVal = unidad.velocidadAtaque || pokemon.attackSpeed || 0.8;
    let rangoVal = (typeof obtenerRangoAtaque === 'function') ? obtenerRangoAtaque(unidad) : 1;
    let critVal = ((pokemon.critRate || 0.25) * 100).toFixed(0) + '%';

    html += `
        <div class="carta-stats">
            <div class="carta-stat"><span class="stat-icon">❤️</span><span class="stat-value">${Math.round(hpVal)}</span><span class="stat-label">PS</span></div>
            <div class="carta-stat"><span class="stat-icon">⚔️</span><span class="stat-value">${Math.round(ataqueVal)}</span><span class="stat-label">Ataque</span></div>
            <div class="carta-stat"><span class="stat-icon">🔮</span><span class="stat-value">${Math.round(spAtkVal)}</span><span class="stat-label">At. Esp.</span></div>
            <div class="carta-stat"><span class="stat-icon">💨</span><span class="stat-value">${Math.round(velocidadVal * 100) / 100}</span><span class="stat-label">Vel. Ataque</span></div>
            <div class="carta-stat"><span class="stat-icon">🛡️</span><span class="stat-value">${Math.round(defensaVal)}</span><span class="stat-label">Defensa</span></div>
            <div class="carta-stat"><span class="stat-icon">✨</span><span class="stat-value">${Math.round(spDefensaVal)}</span><span class="stat-label">Def. Esp.</span></div>
            <div class="carta-stat"><span class="stat-icon">🎯</span><span class="stat-value">${rangoVal}</span><span class="stat-label">Rango</span></div>
            <div class="carta-stat"><span class="stat-icon">💥</span><span class="stat-value">${critVal}</span><span class="stat-label">Crítico</span></div>
        </div>
    `;

    // 4. Movimientos
    const movimientos = getMovimientosPokemon(pokemon.nombre);
    const principalData = movimientos[0];
    const secundarioData = window.MOVIMIENTOS_SECUNDARIOS && window.MOVIMIENTOS_SECUNDARIOS[pokemon.nombre];
    
    // Función auxiliar para pintar un movimiento
    const pintarMovimiento = (movData, esSecundario) => {
        if (!movData) return '';
        const nombreLimpio = limpiarNombreMovimiento(movData.nombre);
        const descData = getDescripcionMovimiento(nombreLimpio);
        const claveIcono = movData.iconoKey || nombreLimpio;
        const iconoHtml = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(claveIcono, 28) : getIconoTipo(descData ? descData.tipo : 'Normal');
        
        const esActivo = (esSecundario ? unidad.movimientoActivo === 'secundario' : unidad.movimientoActivo === 'principal');
        const tags = descData ? `<span class="move-tag energy">⚡ Energía</span><span class="move-tag">🎯 ${descData.alcance}</span>` : '';
        
        const estaBloqueado = esSecundario && !secundarioDesbloqueado;
        
        const botonHtml = estaBloqueado 
            ? `<button class="btn-activar-move" disabled>🔒 Requiere 2★ para usar</button>`
            : `<button class="btn-activar-move" 
                        onclick="activarMovimientoDesdeCarta('${esSecundario ? 'secundario' : 'principal'}')"
                        ${esActivo ? 'disabled' : ''}>
                    ${esActivo ? '✓ Movimiento Activo' : '⭐ Usar este movimiento'}
                </button>`;

        return `
            <div class="move-content ${movimientoSeleccionadoIndex === (esSecundario ? 1 : 0) ? 'viewing' : ''}" id="content-mov-${esSecundario ? 'sec' : 'princ'}">
                <div class="move-header">
                    <div class="move-title">
                        <div class="move-icon">${iconoHtml}</div>
                        <div class="move-name">${nombreLimpio}</div>
                    </div>
                    <div class="move-tags">${tags}</div>
                </div>
                <div class="move-desc">${descData ? descData.descripcion : 'Sin descripción disponible.'}</div>
                ${botonHtml}
            </div>
        `;
    };

    html += `
        <div class="moves-section">
                        <div class="move-tabs">
                                <div class="move-tab ${movimientoSeleccionadoIndex === 0 ? 'viewing' : ''} ${unidad.movimientoActivo === 'principal' ? 'is-active-move' : ''}" 
                     onclick="viewMove('principal')">
                    <span>⚔️ Principal</span>
                </div>
                <div class="move-tab ${movimientoSeleccionadoIndex === 1 ? 'viewing' : ''} ${unidad.movimientoActivo === 'secundario' ? 'is-active-move' : ''}" 
                     onclick="viewMove('secundario')">
                    <span>🔥 Secundario</span>
                </div>
            </div>
                        ${pintarMovimiento(principalData, false)}
            ${pintarMovimiento(secundarioData, true)}
        </div>
    `;

    // 5. Ulti (Definitiva)
    const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[pokemon.nombre];
    const tieneDisco = unidad.tieneDiscoUlti || false;
    const ultiLista = unidad.ultiLista || false;
    const estaBloqueada = !tieneDisco || !ultiData;
    const estaCargando = !estaBloqueada && !ultiLista;
    
    let ultiClase = estaBloqueada ? 'locked' : (ultiLista ? 'ready' : '');
    let ultiStatusText = estaBloqueada ? '🔒 BLOQUEADA' : (ultiLista ? '¡LISTA!' : 'CARGANDO...');
    let discoClase = estaBloqueada ? 'locked-disk' : '';
    let iconoUlti = ultiData && typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(ultiData.iconoKey || ultiData.nombre, 28) : '⚡';

    if (ultiData) {
        html += `
            <div class="ulti-wrapper">
                <div class="ulti-header-title">⚡ DEFINITIVA</div>
                <div class="ulti-box ${ultiClase}" id="ulti-box">
                    <div class="ulti-content">
                        <div class="ulti-name-row">
                            <span class="ulti-name">${ultiData.nombre}</span>
                            <span class="ulti-status-text">${ultiStatusText}</span>
                        </div>
                        <div class="ulti-desc">${ultiData.descripcion}</div>
                        <div class="ulti-bar-wrapper">
                            <div class="ulti-bar-container"><div class="ulti-bar-fill" style="width: ${ultiLista ? '100%' : (estaBloqueada ? '0%' : ((unidad.ultiCarga || 0) / ultiData.carga * 100) + '%')}"></div></div>
                            <span class="ulti-bar-text">${unidad.ultiCarga || 0}/${ultiData.carga}</span>
                        </div>
                    </div>
                    <div class="ulti-icon-container">
                        <div class="disco-badge ${discoClase}" title="${estaBloqueada ? 'Requiere Disco Definitivo' : 'Disco Definitivo equipado'}">💿</div>
                        <div class="ulti-icon">${iconoUlti}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // 6. Objetos Equipados
    const objetosNormales = [];
    let discoIdx = -1;
    if (unidad.objetos) {
        unidad.objetos.forEach((obj, idx) => {
            const data = OBJETOS[obj];
            if (!data) return;
            if (data.efecto && data.efecto.esDiscoUlti) discoIdx = idx;
            else objetosNormales.push({ obj, data });
        });
    }

    html += `<div class="carta-objetos">`;
    // 2 slots normales
    for (let i = 0; i < 2; i++) {
        if (i < objetosNormales.length) {
            const { obj, data } = objetosNormales[i];
            const iconoHtml = (data.emoji && data.emoji.includes('.png')) ? `<img src="${data.emoji}" class="objeto-icon">` : data.emoji || '📦';
            html += `<div class="carta-objeto-item ocupado" title="${obj}: ${data.descripcion}">${iconoHtml}</div>`;
        } else {
            html += `<div class="carta-objeto-item vacio">▢</div>`;
        }
    }
    // Slot Disco
    if (discoIdx !== -1) {
        const data = OBJETOS[unidad.objetos[discoIdx]];
        const iconoHtml = (data.emoji && data.emoji.includes('.png')) ? `<img src="${data.emoji}" class="objeto-icon">` : data.emoji || '💿';
        html += `<div class="carta-objeto-item ocupado" style="border-color:#fbbf24;" title="${data.descripcion}">${iconoHtml}</div>`;
    } else {
        html += `<div class="carta-objeto-item vacio" title="Slot de ULTI">💿</div>`;
    }
    html += `</div>`;

    // Inyectar HTML
    const contenido = panel.querySelector('.carta-contenido');
    if (contenido) {
        contenido.innerHTML = html;
    } else {
        panel.innerHTML = `<div class="carta-contenido">${html}</div>`;
    }

    panel.style.display = 'flex';
    panel.classList.add('visible');

    // Click fuera para cerrar y reenviar click
    panel.onclick = function(e) {
        if (e.target !== panel) return;
        const x = e.clientX;
        const y = e.clientY;
        cerrarCarta();
        panel.style.pointerEvents = 'none';
        panel.style.display = 'none';
        const elementoDebajo = document.elementFromPoint(x, y);
        panel.style.pointerEvents = '';
        panel.style.display = 'none';
        if (!elementoDebajo) return;
        const celda = elementoDebajo.closest('.board-cell, .bank-cell');
        if (celda) {
            const tipo = celda.dataset.tipo;
            const indice = parseInt(celda.dataset.indice, 10);
            let tieneUnidad = false;
            if (tipo === 'tablero') tieneUnidad = !!(tablero[indice]);
            else if (tipo === 'banquillo') tieneUnidad = !!(banquillo[indice]);
            else if (tipo === 'enemigo') tieneUnidad = !!(enemyBoard[indice]);
            else if (tipo === 'enemigoBanquillo') tieneUnidad = !!(enemyBanquillo[indice]);
            if (tieneUnidad && !isNaN(indice) && typeof abrirCarta === 'function') {
                setTimeout(() => abrirCarta(tipo, indice), 10);
            }
        }
    };
}

function cerrarCarta() {
    const panel = document.getElementById('cartaPanel');
    if (!panel) return;
    cartaAbierta = false;
    cartaUnidadActual = null;
    cartaTipoUbicacion = null;
    cartaIndiceUbicacion = null;
    panel.style.display = 'none';
    panel.classList.remove('visible');
    panel.onclick = null;
}

function actualizarBotonVenderCarta() {
    const btnVender = document.getElementById('cartaBtnVender');
    if (btnVender) btnVender.style.display = 'none';
}

function seleccionarUnidad(tipo, idx) { return; }
function abrirCartaPorDobleClic(tipo, idx) { abrirCarta(tipo, idx); }

function vender(tipo, idx) {
    if (!puedeInteractuar()) return;
    let u = tipo === 'tablero' ? tablero[idx] : banquillo[idx];
    if (!u) return;
    if (u.esZacian) { addConsoleMessage(`❌ ¡Zacian no se puede vender!`, 'error'); return; }
    if (typeof manejarObjetosAlVenderUnidad === 'function') manejarObjetosAlVenderUnidad(u);
    let costeBase = u.costeOriginal || u.pokemon.coste || 1;
    let multiplicador = 1;
    if (u.nivel === 1) multiplicador = 1;
    else if (u.nivel === 2) multiplicador = 3;
    else if (u.nivel === 3) multiplicador = 9;
    let valor = costeBase * multiplicador;
    addConsoleMessage(`💸 Vendiste ${u.pokemon.nombre} (${u.nivel}★) por ${valor}💰`, 'sell');
    oro += valor;
    let copiasADevolver = u.nivel === 3 ? 9 : (u.nivel === 2 ? 3 : 1);
    devolverAlPool(u.baseId, copiasADevolver);
    if (tipo === 'tablero') tablero[idx] = null;
    else banquillo[idx] = null;
    playSellSound();
    aplicarSinergias();
    verificarTodasLasFusiones();
    renderizar();
    actualizarBadgeBaul();
}

function equiparObjetoDesdeBaul(indexBaul, tipoUnidad, idxUnidad) {
    if (!puedeInteractuar()) return;
    if (indexBaul >= baulObjetos.length) return;
    const nombreObjeto = baulObjetos[indexBaul];
    let unidad = tipoUnidad === 'tablero' ? tablero[idxUnidad] : banquillo[idxUnidad];
    if (!unidad) return;
    if (unidad.esZacian || unidad.noEquiparObjetos) { addConsoleMessage(`❌ Zacian no puede equipar objetos manualmente!`, 'error'); return; }

    const objeto = OBJETOS[nombreObjeto];
    if (objeto) {
        const esDisco = objeto.efecto && objeto.efecto.esDiscoUlti;
        const objetosNormales = (unidad.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return !(od && od.efecto && od.efecto.esDiscoUlti);
        });
        const discosEquipados = (unidad.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return od && od.efecto && od.efecto.esDiscoUlti;
        });

        if (esDisco) {
            if (unidad.nivel < 2) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} necesita ser 2★ o 3★ para equipar el Disco Definitivo`, 'error'); return; }
            if (discosEquipados.length >= 1) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene un Disco Definitivo equipado`, 'error'); return; }
        } else {
            if (objetosNormales.length >= 2) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene 2 objetos equipados`, 'error'); return; }
            if (objeto.requerido) {
                const tieneTipo = unidad.pokemon.tipos && Array.isArray(unidad.pokemon.tipos) && unidad.pokemon.tipos.includes(objeto.requerido);
                if (!tieneTipo) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} no puede equipar ${nombreObjeto} (requiere tipo ${objeto.requerido})`, 'error'); return; }
            }
        }
    }

    if (aplicarObjeto(unidad, nombreObjeto)) {
        baulObjetos.splice(indexBaul, 1);
        objetoSeleccionado = null;
        aplicarSinergias();
        renderizar();
        actualizarBadgeBaul();
    }
}

// 🆕 FIX: puedeInteractuar / puedeCombatir / bloquearEstadoCombate /
// liberarEstadoCombate viven en js/systems/combate.js. Aquí estaban
// duplicadas y, al cargar main.js después, PISABAN las versiones buenas:
//   - `puedeCombatir` perdía el guard de `window._finRondaEnCurso`.
//   - `bloquearEstadoCombate` no limpiaba `.salto-victoria`.
// Se eliminaron para que solo exista una implementación.

function mostrarPostCombate() {
    if (!postCombateData) { addConsoleMessage("❌ No hay datos de combate disponibles", 'error'); return; }
    const overlay = document.getElementById('postCombateOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.classList.add('visible');

    const body = document.getElementById('postCombateBody');
    if (!body) return;
    const data = postCombateData;
    let html = '';

    html += `
        <div class="post-resumen" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:14px 20px;background:rgba(0,0,0,0.3);border-radius:14px;border:1px solid rgba(42,58,90,0.4);margin:0 auto 16px auto;max-width:480px;text-align:center;">
            <div class="stat"><span style="font-size:1.3rem;">⚔️</span><span style="font-size:1.3rem;font-weight:700;color:#ffffff;">${Math.round(data.totalDañoJugador || 0)}</span><span style="font-size:0.5rem;color:#6b8aaa;text-transform:uppercase;">Daño</span></div>
            <div class="stat"><span style="font-size:1.3rem;">🛡️</span><span style="font-size:1.3rem;font-weight:700;color:#ef4444;">${Math.round(data.totalDañoRecibido || 0)}</span><span style="font-size:0.5rem;color:#6b8aaa;text-transform:uppercase;">Recibido</span></div>
            <div class="stat"><span style="font-size:1.3rem;">💚</span><span style="font-size:1.3rem;font-weight:700;color:#4ade80;">${Math.round(data.totalCuracion || 0)}</span><span style="font-size:0.5rem;color:#6b8aaa;text-transform:uppercase;">Curaciones</span></div>
        </div>
    `;

    html += `<div class="post-filtros" style="display:flex;gap:8px;margin:0 auto 14px;justify-content:center;flex-wrap:wrap;max-width:400px;width:100%;">
        <button class="filtro-btn active-damage" onclick="cambiarFiltroPostCombate('damage')" id="filtroDamage">⚔️ DAÑO</button>
        <button class="filtro-btn" onclick="cambiarFiltroPostCombate('received')" id="filtroReceived">🛡️ RECIBIDO</button>
        <button class="filtro-btn" onclick="cambiarFiltroPostCombate('heal')" id="filtroHeal">💚 CURACIÓN</button>
    </div>`;

    html += `<div class="post-tabs" style="display:flex;gap:10px;margin:0 auto 14px;justify-content:center;max-width:400px;width:100%;">
        <button class="post-tab-btn active" data-tab="todos" onclick="cambiarTabPostCombate('todos')">🌍 TODOS</button>
        <button class="post-tab-btn" data-tab="jugador" onclick="cambiarTabPostCombate('jugador')">🛡️ MI EQUIPO</button>
        <button class="post-tab-btn" data-tab="enemigo" onclick="cambiarTabPostCombate('enemigo')">🗡️ ENEMIGO</button>
    </div>`;

    html += `
        <div id="filtroContenidoDamage" class="filtro-contenido active">
            <div class="post-tab-panel active" id="panel-todos-damage"><div class="post-lista" id="lista-todos-damage"></div></div>
            <div class="post-tab-panel" id="panel-jugador-damage" style="display:none;"><div class="post-lista" id="lista-jugador-damage"></div></div>
            <div class="post-tab-panel" id="panel-enemigo-damage" style="display:none;"><div class="post-lista" id="lista-enemigo-damage"></div></div>
        </div>
        <div id="filtroContenidoReceived" class="filtro-contenido" style="display:none;">
            <div class="post-tab-panel active" id="panel-todos-received"><div class="post-lista" id="lista-todos-received"></div></div>
            <div class="post-tab-panel" id="panel-jugador-received" style="display:none;"><div class="post-lista" id="lista-jugador-received"></div></div>
            <div class="post-tab-panel" id="panel-enemigo-received" style="display:none;"><div class="post-lista" id="lista-enemigo-received"></div></div>
        </div>
        <div id="filtroContenidoHeal" class="filtro-contenido" style="display:none;">
            <div class="post-tab-panel active" id="panel-todos-heal"><div class="post-lista" id="lista-todos-heal"></div></div>
            <div class="post-tab-panel" id="panel-jugador-heal" style="display:none;"><div class="post-lista" id="lista-jugador-heal"></div></div>
            <div class="post-tab-panel" id="panel-enemigo-heal" style="display:none;"><div class="post-lista" id="lista-enemigo-heal"></div></div>
        </div>
    `;

    body.innerHTML = html;
    renderizarListasPostCombate(data, 'damage');
    renderizarListasPostCombate(data, 'received');
    renderizarListasPostCombate(data, 'heal');
}

function renderizarListasPostCombate(data, filtro) {
    const todos = [...(data.statsJugadores || []), ...(data.statsRivales || [])];
    if (filtro === 'damage') todos.sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));
    else if (filtro === 'received') todos.sort((a, b) => (b.damageTaken || 0) - (a.damageTaken || 0));
    else if (filtro === 'heal') todos.sort((a, b) => (b.healingDone || 0) - (a.healingDone || 0));

    const jugadores = todos.filter(p => p.equipo === 'jugador');
    const rivales = todos.filter(p => p.equipo === 'enemigo');

    function renderizarLista(listaId, items, filtro) {
        const container = document.getElementById(listaId);
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="sin-datos" style="text-align:center;padding:20px;color:#6b8aaa;">No hay datos disponibles</div>';
            return;
        }
        const maxValor = Math.max(...items.map(p => {
            if (filtro === 'damage') return p.damageDealt || 0;
            if (filtro === 'received') return (p.damageTaken || 0) + (p.damageBlocked || 0);
            if (filtro === 'heal') return p.healingDone || 0;
            return 0;
        }), 1);
        let html = '';
        for (let p of items) {
            if (!p || !p.nombre) continue;
            const spriteUrl = getSpriteUrl(p.spriteId || p.id, p.nombre);
            const valor = filtro === 'damage' ? (p.damageDealt || 0) : filtro === 'received' ? (p.damageTaken || 0) : (p.healingDone || 0);
            const valorBlocked = filtro === 'received' ? (p.damageBlocked || 0) : 0;
            const porcentaje = maxValor > 0 ? (valor / maxValor) * 100 : 0;
            const porcentajeBlocked = maxValor > 0 ? (valorBlocked / maxValor) * 100 : 0;
            let color = '#fbbf24';
            let fillClass = 'damage-fill';
            if (filtro === 'damage') {
                if (p.tipoAtaque === 'especial') { color = '#3b82f6'; fillClass = 'damage-fill-especial'; }
                else { color = '#ef4444'; fillClass = 'damage-fill-fisico'; }
            } else if (filtro === 'received') { color = '#ef4444'; fillClass = 'recibido-fill'; }
            else if (filtro === 'heal') { color = '#4ade80'; fillClass = 'curacion-fill'; }
            const equipo = p.equipo === 'jugador' ? '🛡️' : '🗡️';
            const tipoIcono = p.tipoAtaque === 'especial' ? '🔮' : '⚔️';
            const estrellasImg = `<img class="estrellas-img" src="${getEstrellasUrl(p.nivel || 1)}" alt="${p.nivel || 1}★" draggable="false" style="height:24px;width:auto;object-fit:contain;image-rendering:auto;display:inline-block;vertical-align:middle;margin-left:6px;">`;

            html += `
                <div class="post-item" style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:2px;min-height:38px;">
                    <span style="font-size:0.8rem;">${equipo}</span>
                    <div class="sprite" style="width:28px;height:28px;flex-shrink:0;background:rgba(0,0,0,0.3);border-radius:4px;padding:2px;display:flex;align-items:center;justify-content:center;">
                        <img src="${spriteUrl}" alt="${p.nombre}" draggable="false" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">
                    </div>
                    <div class="info" style="flex:1;display:flex;flex-direction:column;min-width:0;">
                        <span class="nombre" style="font-size:0.7rem;font-weight:700;color:#ffffff;">${p.nombre}${estrellasImg}</span>
                        <span class="detalle" style="font-size:0.45rem;color:#6b8aaa;">
                            ${filtro === 'damage' ? `${tipoIcono} Daño: ${Math.round(p.damageDealt || 0)}` : ''}
                            ${filtro === 'received' ? `🛡️ Recibido: ${Math.round(p.damageTaken || 0)}${(p.damageBlocked || 0) > 0 ? ` · ⚪ Bloqueado: ${Math.round(p.damageBlocked)}` : ''}` : ''}
                            ${filtro === 'heal' ? `💚 Curaciones: ${Math.round(p.healingDone || 0)}` : ''}
                        </span>
                    </div>
                    ${filtro === 'received' && valorBlocked > 0 ? `
                    <div class="barra-container" style="width:80px;height:8px;background:#1a2236;border-radius:4px;overflow:hidden;flex-shrink:0;display:flex;">
                        <div class="fill ${fillClass}" style="width:${porcentaje}%;height:100%;background:${color};transition:width 0.8s ease;"></div>
                        <div class="fill escudo-fill" style="width:${porcentajeBlocked}%;height:100%;background:#e5e7eb;transition:width 0.8s ease;"></div>
                    </div>` : `
                    <div class="barra-container" style="width:80px;height:8px;background:#1a2236;border-radius:4px;overflow:hidden;flex-shrink:0;">
                        <div class="fill ${fillClass}" style="width:${porcentaje}%;height:100%;background:${color};border-radius:4px;transition:width 0.8s ease;"></div>
                    </div>`}
                    <span class="valor" style="font-size:0.7rem;font-weight:700;color:${color};min-width:40px;text-align:right;">${Math.round(valor)}</span>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    renderizarLista('lista-todos-' + filtro, todos, filtro);
    renderizarLista('lista-jugador-' + filtro, jugadores, filtro);
    renderizarLista('lista-enemigo-' + filtro, rivales, filtro);
}

function cambiarFiltroPostCombate(filtro) {
    document.querySelectorAll('.filtro-contenido').forEach(el => { el.style.display = 'none'; });
    const contenido = document.getElementById('filtroContenido' + filtro.charAt(0).toUpperCase() + filtro.slice(1));
    if (contenido) contenido.style.display = 'block';
    document.querySelectorAll('.filtro-btn').forEach(btn => { btn.style.background = 'rgba(255,255,255,0.05)'; btn.style.borderColor = '#2a3a5a'; btn.style.color = '#6b8aaa'; });
    const btnId = { 'damage': 'filtroDamage', 'received': 'filtroReceived', 'heal': 'filtroHeal' }[filtro];
    if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.style.background = filtro === 'heal' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)';
            btn.style.borderColor = filtro === 'heal' ? '#22c55e' : '#ef4444';
            btn.style.color = filtro === 'heal' ? '#4ade80' : '#ef4444';
        }
    }
}

function cambiarTabPostCombate(tab) {
    document.querySelectorAll('.post-tab-panel').forEach(p => { p.style.display = 'none'; });
    document.querySelectorAll('.post-tab-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.style.display = 'block';
    const btn = document.querySelector(`.post-tab-btn[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
}

function gameOver() {
    // 🏅 Posición final del jugador: se apunta el orden de eliminación para
    //    que el resumen final ordene a los eliminados por cuándo cayeron.
    try {
        window._registrarEliminacionesPendientes && window._registrarEliminacionesPendientes();
        if (!window._ordenEliminacionJugador) {
            window._contadorEliminaciones = (window._contadorEliminaciones || 0) + 1;
            window._ordenEliminacionJugador = window._contadorEliminaciones;
        }
    } catch (e) { }

    const overlayAntiguo = document.getElementById('gameOverOverlay');
    if (overlayAntiguo) {
        overlayAntiguo.classList.remove('visible');
        overlayAntiguo.style.display = 'none';
    }

    playDerrotaSound();
    addConsoleMessage('💀 GAME OVER! Has sido derrotado...', 'error');
    
    setTimeout(() => {
        if (typeof mostrarPantallaResultadosFinales === 'function') {
            mostrarPantallaResultadosFinales();
        }
    }, 2000);
}

function mostrarVictoriaJuego() {
    const overlayAntiguo = document.getElementById('gameOverOverlay');
    if (overlayAntiguo) {
        overlayAntiguo.classList.remove('visible');
        overlayAntiguo.style.display = 'none';
    }

    playVictoriaSound();
    addConsoleMessage('🏆 ¡VICTORIA TOTAL!', 'success');

    setTimeout(() => {
        if (typeof mostrarPantallaResultadosFinales === 'function') {
            mostrarPantallaResultadosFinales();
        }
    }, 2000);
}

function renderizarEstadisticasFinales() {
    const g = (typeof estadisticasGlobales !== 'undefined') ? estadisticasGlobales : null;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    if (g) {
        setText('statTotalDaño', Math.round(g.totalDaño || 0));
        setText('statTotalRecibido', Math.round(g.totalRecibido || 0));
        setText('statTotalCuracion', Math.round(g.totalCuracion || 0));
        setText('statVictorias', g.victorias || 0);
        setText('statRondas', g.rondas || 0);
        setText('statMVP', g.mvp ? g.mvp : '-');
        setText('statTopDaño', Math.round(g.topDaño || 0));
        setText('statTopRecibido', Math.round(g.topRecibido || 0));
    } else {
        ['statTotalDaño', 'statTotalRecibido', 'statTotalCuracion', 'statVictorias', 'statRondas', 'statMVP', 'statTopDaño', 'statTopRecibido'].forEach(id => setText(id, '0'));
    }

    const mejores = (g && g.mejoresPokemon) ? g.mejoresPokemon : [];
    const mejoresJugador = mejores.filter(p => p.equipo === 'jugador');

    if (mejoresJugador.length > 0) {
        let mvp = null;
        let mejorPunt = -1;
        let topD = 0;
        let topR = 0;
        for (let p of mejoresJugador) {
            const punt = (p.damageDealt || 0) + (p.healingDone || 0) * 0.5 + (p.damageBlocked || 0) * 0.3;
            if (punt > mejorPunt) { mejorPunt = punt; mvp = p; }
            if ((p.damageDealt || 0) > topD) topD = p.damageDealt || 0;
            if ((p.damageTaken || 0) > topR) topR = p.damageTaken || 0;
        }
        if (mvp) setText('statMVP', mvp.nombre);
        setText('statTopDaño', Math.round(topD));
        setText('statTopRecibido', Math.round(topR));
    }

    function renderizarListaFinal(listaId, items) {
        const cont = document.getElementById(listaId);
        if (!cont) return;
        if (!items || items.length === 0) {
            cont.innerHTML = '<div class="sin-datos" style="text-align:center;padding:20px;color:#6b8aaa;">No hay datos disponibles</div>';
            return;
        }
        const ordenados = items.slice().sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));
        const maxDaño = Math.max(...ordenados.map(p => p.damageDealt || 0), 1);
        let html = '';
        for (let p of ordenados) {
            if (!p || !p.nombre) continue;
            const spriteUrl = (typeof getSpriteUrl === 'function') ? getSpriteUrl(p.spriteId || p.id, p.nombre) : '';
            const estrellasImg = (typeof getEstrellasUrl === 'function') ? `<img class="estrellas-img" src="${getEstrellasUrl(p.nivel || 1)}" alt="${p.nivel || 1}★" draggable="false" style="height:20px;width:auto;object-fit:contain;display:inline-block;vertical-align:middle;margin-left:6px;">` : '';
            const equipo = p.equipo === 'jugador' ? '🛡️' : '🗡️';
            const porcentaje = maxDaño > 0 ? Math.min(100, ((p.damageDealt || 0) / maxDaño) * 100) : 0;
            const color = p.tipoAtaque === 'especial' ? '#3b82f6' : '#ef4444';
            html += `
                <div class="post-item" style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:2px;min-height:38px;">
                    <span style="font-size:0.8rem;">${equipo}</span>
                    <div class="sprite" style="width:28px;height:28px;flex-shrink:0;background:rgba(0,0,0,0.3);border-radius:4px;padding:2px;display:flex;align-items:center;justify-content:center;">
                        <img src="${spriteUrl}" alt="${p.nombre}" draggable="false" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">
                    </div>
                    <div class="info" style="flex:1;display:flex;flex-direction:column;min-width:0;">
                        <span class="nombre" style="font-size:0.7rem;font-weight:700;color:#ffffff;">${p.nombre}${estrellasImg}</span>
                        <span class="detalle" style="font-size:0.45rem;color:#6b8aaa;">⚔️ ${Math.round(p.damageDealt || 0)} · 🛡️ ${Math.round(p.damageTaken || 0)}${(p.damageBlocked || 0) > 0 ? ` · ⚪ ${Math.round(p.damageBlocked)}` : ''} · 💚 ${Math.round(p.healingDone || 0)}</span>
                    </div>
                    <div class="barra-container" style="width:80px;height:8px;background:#1a2236;border-radius:4px;overflow:hidden;flex-shrink:0;">
                        <div class="fill" style="width:${porcentaje}%;height:100%;background:${color};border-radius:4px;transition:width 0.8s ease;"></div>
                    </div>
                    <span class="valor" style="font-size:0.7rem;font-weight:700;color:${color};min-width:40px;text-align:right;">${Math.round(p.damageDealt || 0)}</span>
                </div>
            `;
        }
        cont.innerHTML = html;
    }

    renderizarListaFinal('finalTodosList', mejores);
    renderizarListaFinal('finalJugadorList', mejoresJugador);
    renderizarListaFinal('finalEnemigoList', mejores.filter(p => p.equipo === 'enemigo'));
}

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

    if (typeof resetNuevaVerde === 'function') resetNuevaVerde();

    enemyLevel = 1; enemyGold = 10; enemyHealth = 50; enemyWinStreak = 0; enemyLossStreak = 0;
    enemyCombatiendo = false; enemyTiendaBloqueada = false; enemyPrimerCombateRealizado = false; enemyTiendaRonda2Comprada = false;

    baulObjetos = []; objetoSeleccionado = null; objetosEnTienda = []; objetoCompradoEstaRonda = false;
    enemyBaulObjetos = []; enemyObjetosEnTienda = []; enemyObjetoCompradoEstaRonda = false; sonidoObjetosReproducido = false;

    if (typeof rerollObjetosRonda3Usado !== 'undefined') rerollObjetosRonda3Usado = false;
    if (typeof tiendaRonda2Comprada !== 'undefined') tiendaRonda2Comprada = false;

    zacianUnidad = null; zacianNivel = 0; articunoUnidad = null; articunoTimer = 0; articunoActivado = false; articunoVisible = false;

    estadisticasGlobales = { totalDaño: 0, totalRecibido: 0, totalCuracion: 0, victorias: 0, rondas: 0, mvp: null, topDaño: 0, topRecibido: 0, mejoresPokemon: [] };

    postCombateData = null; equipoCompletoJugador = []; equipoCompletoEnemigo = [];

    if (typeof inicializarPool === 'function') inicializarPool();

    if (zacianContainer) zacianContainer.style.display = 'none';
    if (articunoContainer) articunoContainer.style.display = 'none';
    window.zacianEnemigoUnidad = null; window.articunoEnemigoUnidad = null;

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

function iniciarFondoPreparacion() {
    if (fondoPreparacionActivo) return;
    try {
        const url = CONFIG.UI_SOUND_URL + 'fondo-preparacion.mp3';
        if (!fondoPreparacionAudio) {
            fondoPreparacionAudio = new Audio(url);
            fondoPreparacionAudio.loop = true;
            const volGuardado = (typeof window._volumenMusicaActual === 'number') ? window._volumenMusicaActual : 0.20;
            fondoPreparacionAudio.volume = volGuardado;
            fondoPreparacionAudio.addEventListener('error', function () { fondoPreparacionAudio = null; });
        }
        fondoPreparacionAudio.play().then(() => { fondoPreparacionActivo = true; }).catch(() => { fondoPreparacionActivo = false; });
    } catch (e) {}
}

function pausarFondoPreparacion() {
    if (!fondoPreparacionAudio) return;
    try { fondoPreparacionAudio.pause(); fondoPreparacionAudio.currentTime = 0; fondoPreparacionActivo = false; } catch (e) {}
}

function reanudarFondoPreparacion() {
    if (!fondoPreparacionAudio) {
        iniciarFondoPreparacion();
    } else {
        try {
            fondoPreparacionAudio.play().then(() => {
                fondoPreparacionActivo = true;
                if (typeof actualizarContadorRondaVisual === 'function') {
                    actualizarContadorRondaVisual();
                }
            }).catch(() => {});
        } catch (e) {}
    }
}

// 🎵 Música de combate (combate.mp3): en bucle y con el volumen de MÚSICA.
//    Se inicia SIEMPRE (aunque la música esté al 0%) para que, si el jugador
//    sube el volumen durante el combate, se empiece a escuchar al momento.
function reproducirMusicaCombate() {
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;
    try {
        const url = CONFIG.UI_SOUND_URL + 'combate.mp3';
        if (!combateAudioActual) {
            combateAudioActual = uiAudioCache[url] || new Audio(url);
        }
        combateAudioActual.loop = true;
        combateAudioActual.preload = 'auto';
        uiAudioCache[url] = combateAudioActual;

        combateAudioActual.volume = (typeof window._volumenMusicaActual === 'number')
            ? window._volumenMusicaActual * 0.9
            : 0.15;

        combateAudioActual.currentTime = 0;
        combateAudioActual.play().catch(() => {});
    } catch (e) {}
}

// ============================================================
// 🆕 FIX: pintar el nº de ronda cuando arranca la música de previa
// ============================================================
function actualizarContadorRondaVisual() {
    const faseStatsNumEl = document.getElementById("faseStatsNum");
    const faseStatsEl = document.getElementById("faseStats");

    if (faseStatsNumEl) {
        if (faseStatsNumEl.textContent !== String(fase)) {
            faseStatsNumEl.textContent = fase;
            faseStatsNumEl.classList.remove('ronda-pop');
            void faseStatsNumEl.offsetWidth;
            faseStatsNumEl.classList.add('ronda-pop');
            setTimeout(() => faseStatsNumEl.classList.remove('ronda-pop'), 650);
        }
    } else if (faseStatsEl) {
        faseStatsEl.innerHTML = `Ronda <span id="faseStatsNum">${fase}</span>`;
    }
    if (faseStatsEl) {
        faseStatsEl.style.display = 'inline-flex';
        faseStatsEl.style.opacity = '1';
        faseStatsEl.style.transform = 'scale(1)';
    }
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

function getColorTipo(tipo) {
    const colores = {
        "Fuego": "#fb923c", "Agua": "#38bdf8", "Planta": "#4ade80",
        "Eléctrico": "#facc15", "Psíquico": "#c084fc", "Siniestro": "#475569",
        "Hada": "#f472b6", "Fantasma": "#a78bfa", "Lucha": "#f87171",
        "Veneno": "#c084fc", "Hielo": "#67e8f9", "Dragón": "#818cf8",
        "Roca": "#a16207", "Normal": "#9ca3af", "Volador": "#93c5fd",
        "Acero": "#94a3b8", "Eevee": "#fb923c"
    };
    return colores[tipo] || "#e2e8f0";
}

function viewMove(tipo) {
    const tabPrinc = document.querySelector('.move-tab:nth-child(1)');
    const tabSec = document.querySelector('.move-tab:nth-child(2)');
    const contentPrinc = document.getElementById('content-mov-princ');
    const contentSec = document.getElementById('content-mov-sec');

    if (tipo === 'principal') {
        if (tabPrinc) tabPrinc.classList.add('viewing');
        if (tabSec) tabSec.classList.remove('viewing');
        if (contentPrinc) contentPrinc.classList.add('viewing');
        if (contentSec) contentSec.classList.remove('viewing');
    } else {
        if (tabSec) tabSec.classList.add('viewing');
        if (tabPrinc) tabPrinc.classList.remove('viewing');
        if (contentSec) contentSec.classList.add('viewing');
        if (contentPrinc) contentPrinc.classList.remove('viewing');
    }
    movimientoSeleccionadoIndex = (tipo === 'principal') ? 0 : 1;
}

function activarMovimientoDesdeCarta(nuevoActivo) {
    if (!cartaUnidadActual) return;
    const unidad = cartaUnidadActual;

    if (unidad.movimientoActivo === nuevoActivo) return;
    if (unidad.nivel < 2 || !unidad.movSecundarioDesbloqueado) {
        addConsoleMessage(`❌ ${unidad.pokemon.nombre} necesita ser 2★ para cambiar de movimiento`, 'error');
        return;
    }

    if (typeof cambiarMovimientoActivo === 'function') {
        const exito = cambiarMovimientoActivo(unidad, nuevoActivo);
        if (exito) {
            abrirCarta(cartaTipoUbicacion, cartaIndiceUbicacion);
            if (typeof renderizar === 'function') renderizar();
        }
    }
}

// Exponer globalmente (necesario para los onclick del HTML generado)
window.getColorTipo = getColorTipo;
window.viewMove = viewMove;
window.activarMovimientoDesdeCarta = activarMovimientoDesdeCarta;