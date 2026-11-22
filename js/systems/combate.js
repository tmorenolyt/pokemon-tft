// ============================================================
// SISTEMA DE COMBATE - v8.19
// ============================================================
// ⚠️ Dividido por responsabilidades en js/systems/combate/:
//   · navegacion.js → geometría, movimiento y selección de objetivo
//   · estado.js     → bloquear/liberar combate y restaurar unidades
//   · hud.js        → barras, stats, veneno/regeneración y pantalla final
//   · combatir.js   → la función combatir() (bucle principal)
// Aquí quedan el estado/config, renderizarCombate() y los exports.
// Los módulos se cargan ANTES que este archivo (ver index.html).
// ============================================================
// 🎯 MODELO HORIZONTAL 4×5 LINEAL
// 🆕 v8.19:
//   - Bloque de Roca del Rey / Cuchara Peculiar LIMPIO (sin
//     llaves huérfanas ni setTimeout duplicados).
//   - mostrarIconoEscudoRoto() solo marca estado; render.js
//     lo pinta dentro del cellHtml en cada render.
// ============================================================

window.jugadores = [];
window.rivales = [];
window.jugadoresIndices = [];
window.rivalesIndices = [];

window.statsCombateEnVivo = {
    activo: false,
    jugadores: [],
    rivales: []
};

const COMBAT_CONFIG = {
    TICK_INTERVAL: 0.1,
    ATTACK_SPEED_REDUCTION: 1.0,
    MAX_TICKS: 900,
    ANIMATION_DELAY: 150,
    DAMAGE_FLOAT_DURATION: 800,
    HP_BAR_TRANSITION: 400,
    MIN_ATTACK_SPEED: 0.35,
    ATTACK_DELAY: 0.05,
    MOVEMENT_DELAY: 1500,
    HP_BAR_STEP_DELAY: 200,
    UMBRAL_CURACION_VISIBLE: 0.003,
    STATS_REFRESH_TICKS: 3,
    DURACION_NORMAL: 29,
    DURACION_OVERTIME: 15,
    MULTIPLICADOR_OVERTIME: 3
};

// ============================================================
// ===== FUNCIONES DE UTILIDAD GEOMÉTRICA =====
// ============================================================


// ============================================================
// ===== MOVIMIENTO =====
// ============================================================


// ============================================================
// ===== POSICIÓN EN PANTALLA =====
// ============================================================


// ============================================================
// ===== RENDERIZAR COMBATE =====
// ============================================================

function renderizarCombate() {
    if (document.body.classList.contains('celebrando')) {
        return;
    }
    const todos = [...(window.jugadores || []), ...(window.rivales || [])].filter(u => u && !u.muerto && u.hp > 0);
    if (typeof movAsegurarPosicionGlobal === 'function') todos.forEach(movAsegurarPosicionGlobal);
    const enPlayer = [], enEnemy = [];
    for (let u of todos) {
        const col = (typeof u._colGlobal === 'number') ? u._colGlobal : 0;
        if (col <= 3) enPlayer.push(u); else enEnemy.push(u);
    }
    if (typeof renderizarTablero === 'function') {
        renderizarTablero('player', enPlayer);
        renderizarTablero('enemy', enEnemy);
    }
}

window.renderizarCombate = renderizarCombate;
window.repintarCombateCompleto = renderizarCombate;

// ============================================================
// ===== TIPO DE ATAQUE / FRONTLINE =====
// ============================================================


// ============================================================
// ===== TARGETING =====
// ============================================================


// ============================================================
// ===== PUEDE INTERACTUAR / COMBATIR =====
// ============================================================


// ============================================================
// ===== BLOQUEAR / LIBERAR ESTADO DE COMBATE =====
// ============================================================


// ============================================================
// ===== RESTAURAR POSICIONES ORIGINALES =====
// ============================================================


window.restaurarPosicionesOriginales = restaurarPosicionesOriginales;

// ============================================================
// ===== OCULTAR / RESTAURAR UNIDAD =====
// ============================================================


// ============================================================
// ===== ACTUALIZAR COPIA ESTADÍSTICAS =====
// ============================================================


// ============================================================
// ===== ACTUALIZAR BARRA DE VIDA =====
// ============================================================


// ============================================================
// ===== PROCESAR VENENO (v4 - FIX sincronización de ticks) =====
// ============================================================
// 🔧 v4: los stacks ya NO tienen tick individual. El tick es
//        GLOBAL (unidad._venenoTickGlobal). Cuando el tick global
//        llega a 1, TODOS los stacks disparan a la vez y se
//        resetea el contador global. Así el daño es consistente
//        y el log muestra el número real de stacks activos.
//
//        Antes cada stack tenía su propio tick, así que en un
//        mismo tick podían dispararse 1, 3 o 6 stacks sin ritmo,
//        y el log oscilaba: 300 → 120 → 260 → 100...
// ============================================================

const MAX_STACKS_VENENO_DANO = 20;


// ============================================================
// ===== PROCESAR REGENERACIÓN =====
// ============================================================


// ============================================================
// ===== STATS EN VIVO =====
// ============================================================


window.actualizarStatsEnVivo = actualizarStatsEnVivo;

// ============================================================
// ===== REGISTRAR ESTADÍSTICAS DEL COMBATE =====
// ============================================================


// ============================================================
// ===== CONFETI / SPARKLES / EFECTOS =====
// ============================================================


// ============================================================
// ===== MOSTRAR RESULTADO DE COMBATE =====
// ============================================================


// ============================================================
// FUNCIÓN PRINCIPAL DE COMBATE
// ============================================================


// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.combatir = combatir;
window.seleccionarObjetivoPrioridad = seleccionarObjetivoPrioridad;
window.restaurarPosicionesOriginales = restaurarPosicionesOriginales;
window.actualizarBarraVidaPokemon = actualizarBarraVidaPokemon;
window.animarSaltoGanadoresJugador = animarSaltoGanadoresJugador;
window.procesarVeneno = procesarVeneno;
window.procesarRegeneracion = procesarRegeneracion;
window.obtenerPosicionUnidadActual = obtenerPosicionUnidadActual;