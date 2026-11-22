// ============================================================
// MODO 2 JUGADORES (1vs1 hotseat, mismo PC)
// ============================================================
// Estrategia: "intercambio de estado". Reutilizamos todo el código
// existente (tienda, tablero, combate) cambiando cuál de los dos
// equipos es el "activo". El lado activo vive SIEMPRE en las
// variables globales del jugador (tablero/banquillo/oro/...), y el
// otro equipo en las variables del enemigo. Al "pasar turno" hacemos
// un swap de ambos bloques de estado.
//
// 🆕 v2: swap de semillasNuevaVerde ↔ semillasEnemigoNuevaVerde
//        para que cada jugador tenga sus propias Semillas Revivir.
// ============================================================

let turnoJugador = 1;
// Quién actúa PRIMERO en la ronda actual (normalmente el perdedor del combate anterior)
let primerTurnoJugador = 1;

function iniciarModoDosJugadores() {
    window.modoDosJugadores = true;
    turnoJugador = 1;
    primerTurnoJugador = 1;
    window.turnoJugador = 1;
    window.primerTurnoJugador = 1;

    // 👥 2P es PvP puro: sin PvE ni ranking del torneo de 1 jugador.
    window.enRondaPvE = false;
    window.monstruoActual = null;
    const ranking2p = document.getElementById('rankingTorneo');
    if (ranking2p) ranking2p.style.display = 'none';

    // ⚠️ NO resetear enemyBoard / enemyBanquillo / enemyGold / enemyLevel / enemyHealth aquí.
    // `init()` ya dejó al enemigo en un estado SIMÉTRICO al jugador:
    //   20 casillas de tablero, 8 de banquillo, 10 de oro, nivel 1, 100 HP
    //   y 1 Pokémon inicial ya colocado.
    // Volver a ponerlos vacíos dejaba al J2 sin Pokémon inicial (y sin tienda
    // en ronda 1), provocando un "combate instantáneo" (1 equipo vacío) y
    // la sensación de que "el J2 tiene el mismo equipo que el J1".
    enemyExperiencia = 0; // `init()` no inicializa esta variable (es nueva del 2P)

    // 🆕 Resetear contadores de semillas (ambos)
    if (typeof window.semillasNuevaVerde !== 'number') window.semillasNuevaVerde = 0;
    if (typeof window.semillasEnemigoNuevaVerde !== 'number') window.semillasEnemigoNuevaVerde = 0;

    actualizarInterfazTurno();
    try { addConsoleMessage('👥 Modo 2 JUGADORES activado. Turno del Jugador 1', 'info'); } catch (e) {}
    // 🆕 Cartel inicial de turno
    if (typeof mostrarCartelTurno === 'function') setTimeout(() => mostrarCartelTurno(), 300);
}

// Espeja las columnas de un tablero (col 0↔3, 1↔2) para que el "frente"
// (columna D del jugador ↔ columna E del enemigo) siga mirando al rival
// cuando cambiamos de jugador activo. Así un Pokémon en E2 pasa a D2 (y no a A2).
function _espejarTablero(arr) {
    const cols = (typeof COLUMNAS_ARENA !== 'undefined') ? COLUMNAS_ARENA : 4;
    const out = new Array(arr.length).fill(null);
    for (let i = 0; i < arr.length; i++) {
        const fila = Math.floor(i / cols);
        const col = i % cols;
        out[fila * cols + (cols - 1 - col)] = arr[i];
    }
    return out;
}

function _swapEstado() {
    // Espejar al intercambiar para que cada Pokémon conserve su posición
    // relativa (frente sigue en frente, retaguardia en retaguardia).
    const t = tablero;
    const e = enemyBoard;
    tablero = _espejarTablero(e);
    enemyBoard = _espejarTablero(t);

    [banquillo, enemyBanquillo] = [enemyBanquillo, banquillo];
    if (typeof tiendaRonda2Comprada !== 'undefined' && typeof enemyTiendaRonda2Comprada !== 'undefined') {
        [tiendaRonda2Comprada, enemyTiendaRonda2Comprada] = [enemyTiendaRonda2Comprada, tiendaRonda2Comprada];
    }
    [vidaJugador, enemyHealth] = [enemyHealth, vidaJugador];

    // 🆕 SWAP DE SEMILLAS REVIVIR
    // window.semillasNuevaVerde        = semillas del jugador ACTIVO
    // window.semillasEnemigoNuevaVerde = semillas del jugador INACTIVO
    const semillasActivo = (typeof window.semillasNuevaVerde === 'number') ? window.semillasNuevaVerde : 0;
    const semillasInactivo = (typeof window.semillasEnemigoNuevaVerde === 'number') ? window.semillasEnemigoNuevaVerde : 0;
    window.semillasNuevaVerde = semillasInactivo;
    window.semillasEnemigoNuevaVerde = semillasActivo;

    // 🆕 FIX: marcador de ronda de la tienda de objetos POR JUGADOR.
    // Antes `window._rondaObjetosGenerada` era un global único, así que
    // cuando el J1 generaba sus 3 objetos en una ronda, el J2 (misma ronda)
    // no los regeneraba y veía los objetos sobrantes del J1 (2 en vez de 3).
    const rondaObjActivo = (typeof window._rondaObjetosGenerada === 'number') ? window._rondaObjetosGenerada : -1;
    const rondaObjInactivo = (typeof window._rondaObjetosGeneradaInactivo === 'number') ? window._rondaObjetosGeneradaInactivo : -1;
    window._rondaObjetosGenerada = rondaObjInactivo;
    window._rondaObjetosGeneradaInactivo = rondaObjActivo;

    // La racha se niega: en 1v1 la racha del jugador que pasa a ser el
    // "activo" es exactamente la opuesta de la del anterior. Así `racha`
    // siempre representa al jugador activo (positivo = gana, negativo = pierde).
    racha = -racha;
}

// 🆕 AUTO-COMPRA DE OBJETO (ronda de objetos)
// Si estamos en una ronda de objetos y el jugador activo NO compró ninguno
// de los 3 objetos ofrecidos, se le compra automáticamente el primero al
// baúl. Así nunca se queda un "slot vacío" al pasar turno.
function _autoComprarObjetoSiToca() {
    try {
        if (typeof debeAparecerTiendaObjetos !== 'function') return;
        if (!debeAparecerTiendaObjetos(ronda)) return;
        if (objetoCompradoEstaRonda) return;
        if (!Array.isArray(objetosEnTienda) || objetosEnTienda.length === 0) {
            // Fallback: regenerar la tienda de objetos si llegó vacía.
            if (typeof generarObjetosTienda === 'function') {
                objetosEnTienda = generarObjetosTienda();
            }
        }
        if (!Array.isArray(objetosEnTienda) || objetosEnTienda.length === 0) return;
        if (typeof CONFIG !== 'undefined' && baulObjetos.length >= CONFIG.MAX_BAUL) return;

        const elegido = objetosEnTienda[Math.floor(Math.random() * objetosEnTienda.length)];
        const index = objetosEnTienda.indexOf(elegido);
        baulObjetos.push(elegido);
        if (index !== -1) objetosEnTienda.splice(index, 1);
        objetoCompradoEstaRonda = true;

        try { addConsoleMessage(`📦 Auto-compra: ${elegido} → OBJETOS (no compraste en la ronda de objetos)`, 'buy'); } catch (e) {}
        try { if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul(); } catch (e) {}
        try { if (typeof actualizarObjetosVerticales === 'function') setTimeout(() => actualizarObjetosVerticales(), 100); } catch (e) {}
    } catch (e) {}
}

// Devuelve `true` cuando ambos jugadores ya han hecho su turno
// (hay que lanzar el combate).
function alternarTurno() {
    if (!window.modoDosJugadores) return false;

    // Cerrar la tienda si está abierta para no mostrársela al siguiente jugador
    try {
        const ov = document.getElementById('tiendaOverlay');
        if (ov) {
            ov.classList.remove('visible');
            ov.style.display = 'none';
        }
        document.body.style.overflow = '';
        document.body.classList.remove('modo-objetos');
        if (typeof tiendaAbierta !== 'undefined') tiendaAbierta = false;
        if (typeof modoTiendaObjetos !== 'undefined') modoTiendaObjetos = false;
    } catch (e) {}

    // 🆕 Si el jugador activo se va de la ronda de objetos sin comprar,
    // se le compra un objeto automáticamente al baúl.
    _autoComprarObjetoSiToca();

    _swapEstado();

    // Alternar el jugador activo (1 ↔ 2)
    turnoJugador = (turnoJugador === 1) ? 2 : 1;
    window.turnoJugador = turnoJugador;

    // 👁 FIX B: aplicar el espejo/posición ANTES de renderizar, para que
    // los bancos y tableros no parpadeen ni salten al pasar de turno.
    document.body.classList.toggle('turno-j2', !!(window.modoDosJugadores && turnoJugador === 2));

    // El combate se lanza cuando volvemos al jugador que ABRE la ronda
    // (significa que ambos jugadores ya han hecho su turno).
    const listoParaCombatir = (turnoJugador === primerTurnoJugador);

    // Regenerar la tienda del jugador que entra en turno y abrirla
    // automáticamente a partir de la ronda 2 (en ronda 1 no hay tienda).
    if (!listoParaCombatir) {
        try {
            if (typeof mostrarTiendaPostRonda === 'function') {
                mostrarTiendaPostRonda();
            } else if (typeof generarTienda === 'function') {
                generarTienda();
            }
        } catch (e) {}
    }

    try { if (typeof renderizar === 'function') renderizar(); } catch (e) {}
    try { if (typeof actualizarInfoJugador === 'function') actualizarInfoJugador(); } catch (e) {}

    actualizarInterfazTurno();

    // 🆕 Cartel de turno al pasar al otro jugador (si no toca combatir).
    if (!listoParaCombatir && typeof mostrarCartelTurno === 'function') {
        mostrarCartelTurno();
    }

    return listoParaCombatir;
}

// Tras el combate, deja al PERDEDOR como jugador activo (es quien compra
// primero en la ronda siguiente). `victoria` es desde la perspectiva del
// jugador que abrió la ronda (primerTurnoJugador).
function prepararTurnoDespuesDeCombate(victoria) {
    if (!window.modoDosJugadores) return;

    const segundo = (primerTurnoJugador === 1) ? 2 : 1;
    const perdedor = victoria ? segundo : primerTurnoJugador;

    // Si ganó el que abrió la ronda, el perdedor es el segundo → swap para
    // ponerlo como activo. Si perdió el que abrió, ya está activo (sin swap).
    if (victoria) {
        _swapEstado();
    }

    primerTurnoJugador = perdedor;
    turnoJugador = perdedor;
    window.primerTurnoJugador = primerTurnoJugador;
    window.turnoJugador = turnoJugador;

    actualizarInterfazTurno();

    // 🆕 FIX: refrescar los paneles de info (nombre/avatar/HP) justo tras el
    // swap. Antes, durante la celebración (~5s) los paneles seguían mostrando
    // la identidad ANTIGUA y parecía que "el J2 se movía al panel izquierdo".
    try { if (typeof actualizarInfoJugador === 'function') actualizarInfoJugador(); } catch (e) {}
    try { if (typeof actualizarInfoEnemigo === 'function') actualizarInfoEnemigo(); } catch (e) {}

    // 🆕 Cartel de turno del nuevo jugador activo. Se muestra cuando termina
    // la celebración (~5.5s), justo antes de que se abra su tienda.
    if (typeof mostrarCartelTurno === 'function') {
        setTimeout(() => { if (window.modoDosJugadores) mostrarCartelTurno(); }, 5600);
    }
}

// 👥 Un único sitio que marca el borde del jugador ACTIVO y atenúa TODO lo que
//    pertenece al jugador INACTIVO (panel, banco, baúl y sinergias).
//    Cuando añadas un panel gemelo (J1/J2) en el futuro, basta con su par de
//    selectores [activo, inactivo] en la lista `pares`.
function marcarPanelesActivoInactivo(activo) {
    const panelSelf = document.getElementById('playerInfoPanel');
    const panelEnemy = document.getElementById('enemyInfoPanel');
    if (panelSelf) panelSelf.classList.toggle('turno-activo', activo);
    if (panelEnemy) panelEnemy.classList.toggle('turno-inactivo', activo);

    // Pares [selector activo (J1), selector inactivo (J2)] que se atenúan al pasar turno.
    const pares = [
        ['.bank-container-player',              '.bank-container-enemy'],
        ['#objetosVerticalContainer',           '#objetosVerticalContainerEnemigo'],
        ['.side-column-player .traits-vertical', '.side-column-enemy .traits-vertical'],
    ];

    for (const [selActivo, selInactivo] of pares) {
        const elInactivo = document.querySelector(selInactivo);
        const elActivo = document.querySelector(selActivo);
        if (elInactivo) elInactivo.classList.toggle('turno-inactivo', activo);
        if (elActivo) elActivo.classList.toggle('turno-inactivo', false);
    }
}

function actualizarInterfazTurno() {
    const btn = document.getElementById('btnPasarTurno');
    const btnC = document.getElementById('btnCombatirFijo');

    const activo = !!window.modoDosJugadores;

    // 👥 2P: cuando J2 tiene el turno, espejar el tablero para que J2 quede
    // siempre en la parte DERECHA (y J1 en la izquierda). En 1P no se aplica.
    document.body.classList.toggle('turno-j2', !!(window.modoDosJugadores && turnoJugador === 2));

    // 👥 Marcar borde ACTIVO y atenuar todo lo del INACTIVO (helper unificado).
    marcarPanelesActivoInactivo(activo);

    if (btn) {
        btn.style.display = activo ? 'inline-flex' : 'none';
        const esPrimerTurno = (turnoJugador === primerTurnoJugador);
        btn.innerHTML = esPrimerTurno
            ? `⏭️ PASAR TURNO`
            : `⚔️ COMBATIR`;
    }
    if (btnC) {
        btnC.style.display = activo ? 'none' : '';
    }

    // 👁 Asegurar que ambos bancos estén visibles (la atenuación ya la hace el helper).
    const cP = document.querySelector('.bank-container-player');
    const cE = document.querySelector('.bank-container-enemy');
    if (cP) cP.style.display = '';
    if (cE) cE.style.display = '';

    // 🔖 Etiquetar los bancos (solo "BANCO", sin nombre)
    const lblP = document.querySelector('.bank-container-player .bank-label');
    const lblE = document.querySelector('.bank-container-enemy .bank-label');
    if (lblP) lblP.textContent = 'BANCO';
    if (lblE) lblE.textContent = 'BANCO';
}

// 👤 Nombre visible del jugador 1 o 2 (con respaldo por si está vacío)
function _nombreJugador(num) {
    if (num === 1) {
        return (window.nombreJugador && String(window.nombreJugador).trim())
            ? window.nombreJugador : 'Jugador 1';
    }
    return (window.nombreJugador2 && String(window.nombreJugador2).trim())
        ? window.nombreJugador2 : 'Jugador 2';
}

// 👤 Identidad visual (nombre + avatar) del jugador activo / inactivo.
// En 2P, cuando J2 tiene el turno, el panel del jugador (izquierda) debe
// mostrar a J2 y el panel enemigo a J1. J1 usa los avatares de "jugador"
// y J2 los de "rivales" (es el rival aleatorio asignado por el juego).
function _identidadJugador(side) {
    const nombreJ1 = (window.nombreJugador || 'Entrenador');
    const avatarJ1 = (window.avatarJugador || 'rojo');
    // 👥 En 2P, J2 tiene su propio nombre/avatar elegidos en el menú
    // (ya no es el rival aleatorio). Caen en la carpeta "jugador".
    const nombreJ2 = (window.nombreJugador2 || 'Jugador 2');
    const avatarJ2 = (window.avatarJugador2 || 'azul');

    const j2Activo = !!(window.modoDosJugadores && window.turnoJugador === 2);

    if (side === 'player') { // panel del jugador = el ACTIVO
        return j2Activo
            ? { nombre: nombreJ2, avatar: avatarJ2, carpeta: 'jugador' }
            : { nombre: nombreJ1, avatar: avatarJ1, carpeta: 'jugador' };
    }
    // panel del enemigo = el INACTIVO
    return j2Activo
        ? { nombre: nombreJ1, avatar: avatarJ1, carpeta: 'jugador' }
        : { nombre: nombreJ2, avatar: avatarJ2, carpeta: 'jugador' };
}

(function _wire() {
    function hook() {
        const btn = document.getElementById('btnPasarTurno');
        if (!btn || btn._d2jWired) return;
        btn._d2jWired = true;

        btn.addEventListener('click', function () {
            if (typeof puedeInteractuar === 'function' && !puedeInteractuar()) return;
            const listo = alternarTurno();
            if (listo && typeof combatir === 'function') {
                combatir();
            }
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hook);
    } else {
        hook();
    }
})();

// 🆕 Cartel de "TURNO del Jugador X" (estilo letrero de victoria).
// Se muestra durante 3 segundos al empezar el turno de un jugador en 2P.
function mostrarCartelTurno() {
    if (!window.modoDosJugadores) return;
    try {
        const num = (typeof turnoJugador === 'number' && (turnoJugador === 1 || turnoJugador === 2)) ? turnoJugador : 1;
        const ident = _identidadJugador('player');
        const nombre = (typeof _nombreJugador === 'function') ? _nombreJugador(num) : (ident.nombre || `Jugador ${num}`);
        const avatar = `assets/avatars/${ident.carpeta || 'jugador'}/${ident.avatar || 'rojo'}.webp`;
        // 👥 Color por jugador: J1 cian, J2 rojo.
        const claseTurno = (num === 2) ? 'turno turno-rojo' : 'turno';

        let ov = document.getElementById('turnoOverlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'turnoOverlay';
            ov.className = 'combat-overlay turno';
            document.body.appendChild(ov);
        }

        ov.innerHTML = `
            <div class="combat-resultado-centrado">
                <div class="turno-avatar-circulo"><img src="${avatar}" alt="${nombre}"></div>
                <div class="combat-resultado-texto ${claseTurno}">Turno de ${nombre}</div>
            </div>
        `;

        ov.className = 'combat-overlay turno active';
        ov.style.display = 'flex'; // 🆕 limpia el display:none que dejó el ocultado anterior
        clearTimeout(ov._timeout);
        ov._timeout = setTimeout(() => {
            ov.classList.remove('active');
            setTimeout(() => {
                ov.className = 'combat-overlay turno';
                ov.style.display = 'none';
            }, 350);
        }, 3000);
    } catch (e) {}
}

window.iniciarModoDosJugadores = iniciarModoDosJugadores;
window.alternarTurno = alternarTurno;
window.prepararTurnoDespuesDeCombate = prepararTurnoDespuesDeCombate;
window.actualizarInterfazTurno = actualizarInterfazTurno;
window._identidadJugador = _identidadJugador;
window.mostrarCartelTurno = mostrarCartelTurno;

// ============================================================
// 🎛️ AJUSTE DE POSICIONES (bancos y baúles) desde la consola
// ============================================================
// Uso en consola (F12):
//   tunePos()                                        → ver valores actuales
//   tunePos({ bankLeft: '60px' })                    → mover banco J1 (izquierda)
//   tunePos({ bankRight: '60px' })                   → mover banco J2 (derecha)
//   tunePos({ baulLeft: '40px' })                    → mover baúl izquierda
//   tunePos({ baulRight: '-40px' })                  → mover baúl derecha
//   tunePos({ bankLeft:'0px', bankRight:'0px', baulLeft:'0px', baulRight:'0px' })  → reset
window.tunePos = function (o) {
    const r = document.documentElement.style;
    const vars = {
        bankLeft:       '--pos-bank-left-margin',
        bankRight:      '--pos-bank-right-margin',
        bankLeftInner:  '--pos-bank-left-inner',
        bankRightInner: '--pos-bank-right-inner',
        baulLeft:       '--pos-baul-left',
        baulRight:      '--pos-baul-right',
        baulTopLeft:    '--pos-baul-left-top',
        baulTopRight:   '--pos-baul-right-top',
    };
    if (o) {
        for (const k in vars) {
            if (o[k] !== undefined) {
                const v = String(o[k]);
                r.setProperty(vars[k], /^-?[\d.]+$/.test(v) ? v + 'px' : v);
            }
        }
    }
    const get = function (n) {
        const inline = r.getPropertyValue(n);
        if (inline) return inline.trim();
        try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); } catch (e) { return '(?)'; }
    };
    const out = {
        bankLeft:       get('--pos-bank-left-margin'),
        bankRight:      get('--pos-bank-right-margin'),
        bankLeftInner:  get('--pos-bank-left-inner'),
        bankRightInner: get('--pos-bank-right-inner'),
        baulLeft:       get('--pos-baul-left'),
        baulRight:      get('--pos-baul-right'),
        baulTopLeft:    get('--pos-baul-left-top'),
        baulTopRight:   get('--pos-baul-right-top'),
    };
    console.log('🎛️ Posiciones actuales:', JSON.stringify(out));
    console.log('✏️ tunePos({ clave: "NXpx" })  → claves: bankLeft, bankRight, bankLeftInner, bankRightInner, baulLeft, baulRight, baulTopLeft, baulTopRight');
    return out;
};
