// ============================================================
// SISTEMA DE COMBATE - v8.19
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

function obtenerFilaColumna(indice) {
    const cols = COLUMNAS_ARENA;
    return { fila: Math.floor(indice / cols), columna: indice % cols };
}

function obtenerDistanciaCasillas(origenIdx, destinoIdx) {
    const cols = COLUMNAS_ARENA;
    const filaOrigen  = Math.floor(origenIdx / cols);
    const colOrigen   = origenIdx % cols;
    const filaDestino = Math.floor(destinoIdx / cols);
    const colDestino  = destinoIdx % cols;
    return Math.abs(filaOrigen - filaDestino) + Math.abs(colOrigen - colDestino);
}

function obtenerPosicionGlobal(lado, indice) {
    if (typeof coordsDesdeIndice === 'function') {
        const c = coordsDesdeIndice(indice, lado);
        return { fila: c._filaGlobal, col: c._colGlobal };
    }
    const colLocal = indice % COLUMNAS_ARENA;
    const filaLocal = Math.floor(indice / COLUMNAS_ARENA);
    return lado === 'enemy'
        ? { fila: filaLocal, col: 4 + colLocal }
        : { fila: filaLocal, col: colLocal };
}

function globalABoard(fila, col) {
    if (typeof indiceDesdeCoords === 'function') {
        const r = indiceDesdeCoords(fila, col);
        if (!r) return null;
        return { lado: r.lado, indice: r.indice };
    }
    if (fila < 0 || fila >= FILAS_ARENA) return null;
    if (col < 0 || col >= COLUMNAS_GLOBALES) return null;
    if (col <= 3) return { lado: 'player', indice: fila * COLUMNAS_ARENA + col };
    return { lado: 'enemy', indice: fila * COLUMNAS_ARENA + (col - 4) };
}

function distanciaGlobal(unidadA, unidadB) {
    if (!unidadA || !unidadB) return Infinity;
    if (typeof distanciaManhattanGlobal === 'function') return distanciaManhattanGlobal(unidadA, unidadB);
    if (typeof movAsegurarPosicionGlobal === 'function') {
        movAsegurarPosicionGlobal(unidadA);
        movAsegurarPosicionGlobal(unidadB);
    }
    const fa = unidadA._filaGlobal || 0, ca = unidadA._colGlobal || 0;
    const fb = unidadB._filaGlobal || 0, cb = unidadB._colGlobal || 0;
    return Math.abs(fa - fb) + Math.abs(ca - cb);
}

function distanciaChebyshev(unidadA, unidadB) {
    if (!unidadA || !unidadB) return Infinity;
    if (typeof distanciaChebyshevGlobal === 'function') return distanciaChebyshevGlobal(unidadA, unidadB);
    if (typeof movAsegurarPosicionGlobal === 'function') {
        movAsegurarPosicionGlobal(unidadA);
        movAsegurarPosicionGlobal(unidadB);
    }
    const fa = unidadA._filaGlobal || 0, ca = unidadA._colGlobal || 0;
    const fb = unidadB._filaGlobal || 0, cb = unidadB._colGlobal || 0;
    return Math.max(Math.abs(fa - fb), Math.abs(ca - cb));
}

function distanciaEnRango(unidadA, unidadB, rango) {
    if (!unidadA || !unidadB) return false;
    if (typeof movAsegurarPosicionGlobal === 'function') {
        movAsegurarPosicionGlobal(unidadA);
        movAsegurarPosicionGlobal(unidadB);
    }
    const fa = unidadA._filaGlobal || 0, ca = unidadA._colGlobal || 0;
    const fb = unidadB._filaGlobal || 0, cb = unidadB._colGlobal || 0;
    const df = Math.abs(fa - fb), dc = Math.abs(ca - cb);
    if (rango <= 1) return Math.max(df, dc) <= 1;
    return (df + dc) <= rango;
}

function casillaOcupadaGlobal(fila, col, jugadores, rivales, excluirUnidad = null) {
    const todas = [...(jugadores || []), ...(rivales || [])];
    for (let u of todas) {
        if (u === excluirUnidad || !u || u.hp <= 0 || u.muerto) continue;
        if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(u);
        if (u._filaGlobal === fila && u._colGlobal === col) return true;
    }
    return false;
}

// ============================================================
// ===== MOVIMIENTO =====
// ============================================================

function moverMeleeHaciaEnemigo(unidad, enemigos, jugadores, rivales) {
    if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(unidad);
    for (let e of enemigos) {
        if (!e || e.hp <= 0 || e.muerto) continue;
        if (distanciaChebyshev(unidad, e) <= 1) return false;
    }
    const siguiente = bfsSiguientePasoMelee(unidad, enemigos, jugadores, rivales);
    if (!siguiente) return false;
    if (typeof movSetPosicionGlobal === 'function') {
        movSetPosicionGlobal(unidad, siguiente.fila, siguiente.col);
    } else {
        unidad._filaGlobal = siguiente.fila;
        unidad._colGlobal  = siguiente.col;
        const board = globalABoard(siguiente.fila, siguiente.col);
        if (board) {
            unidad._indiceTablero = board.lado;
            unidad._indiceActual  = board.indice;
        }
    }
    return true;
}

function bfsSiguientePasoMelee(unidad, enemigos, jugadores, rivales) {
    const startFila = unidad._filaGlobal;
    const startCol  = unidad._colGlobal;
    const enemigosVivos = [];
    for (let e of enemigos) {
        if (!e || e.hp <= 0 || e.muerto) continue;
        if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(e);
        enemigosVivos.push({ fila: e._filaGlobal, col: e._colGlobal });
    }
    if (enemigosVivos.length === 0) return null;
    const dirs = [{ df: 0, dc: 1 }, { df: -1, dc: 0 }, { df: 1, dc: 0 }, { df: 0, dc: -1 }];
    const queue = [{ fila: startFila, col: startCol }];
    const visited = new Set([`${startFila},${startCol}`]);
    const parent = new Map();
    while (queue.length > 0) {
        const cur = queue.shift();
        for (const en of enemigosVivos) {
            if (Math.max(Math.abs(cur.fila - en.fila), Math.abs(cur.col - en.col)) <= 1) {
                return reconstruirPrimerPaso(parent, startFila, startCol, cur.fila, cur.col);
            }
        }
        for (const d of dirs) {
            const nf = cur.fila + d.df;
            const nc = cur.col + d.dc;
            if (nf < 0 || nf >= FILAS_ARENA || nc < 0 || nc >= COLUMNAS_GLOBALES) continue;
            if (casillaOcupadaGlobal(nf, nc, jugadores, rivales, unidad)) continue;
            const key = `${nf},${nc}`;
            if (visited.has(key)) continue;
            visited.add(key);
            parent.set(key, { fila: cur.fila, col: cur.col });
            queue.push({ fila: nf, col: nc });
        }
    }
    return null;
}

function reconstruirPrimerPaso(parent, startFila, startCol, goalFila, goalCol) {
    let cur = { fila: goalFila, col: goalCol };
    let prev = parent.get(`${cur.fila},${cur.col}`);
    if (!prev) return null;
    while (prev && !(prev.fila === startFila && prev.col === startCol)) {
        cur = prev;
        prev = parent.get(`${cur.fila},${cur.col}`);
    }
    return cur;
}

function moverRangedHaciaEnemigo(unidad, enemigos, jugadores, rivales) {
    let nearest = null, minDist = Infinity;
    for (let e of enemigos) {
        if (!e || e.hp <= 0 || e.muerto) continue;
        const d = distanciaGlobal(unidad, e);
        if (d < minDist) { minDist = d; nearest = e; }
    }
    if (!nearest) return false;
    const rango = obtenerRangoAtaque(unidad);
    if (distanciaEnRango(unidad, nearest, rango)) return false;
    const posAtk = movObtenerPosicionGlobal(unidad);
    const posObj = movObtenerPosicionGlobal(nearest);
    if (!posAtk || !posObj) return moverMeleeHaciaEnemigo(unidad, enemigos, jugadores, rivales);
    const df = posObj.fila - posAtk.fila, dc = posObj.col - posAtk.col;
    const candidatas = [];
    if (dc !== 0) candidatas.push({ df: 0, dc: Math.sign(dc), peso: Math.abs(dc) });
    if (df !== 0) candidatas.push({ df: Math.sign(df), dc: 0, peso: Math.abs(df) });
    candidatas.sort((a, b) => b.peso - a.peso);
    for (let c of candidatas) {
        const nf = posAtk.fila + c.df, nc = posAtk.col + c.dc;
        if (nf < 0 || nf >= FILAS_ARENA || nc < 0 || nc >= COLUMNAS_GLOBALES) continue;
        if (casillaOcupadaGlobal(nf, nc, jugadores, rivales, unidad)) continue;
        if (typeof movSetPosicionGlobal === 'function') {
            movSetPosicionGlobal(unidad, nf, nc);
        } else {
            unidad._filaGlobal = nf;
            unidad._colGlobal  = nc;
            const board = globalABoard(nf, nc);
            if (board) {
                unidad._indiceTablero = board.lado;
                unidad._indiceActual  = board.indice;
            }
        }
        return true;
    }
    return moverMeleeHaciaEnemigo(unidad, enemigos, jugadores, rivales);
}

// ============================================================
// ===== POSICIÓN EN PANTALLA =====
// ============================================================

function obtenerPosicionUnidadActual(unidad) {
    if (!unidad) return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
    if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(unidad);
    const filaGlobal = unidad._filaGlobal, colGlobal = unidad._colGlobal;
    if (typeof filaGlobal !== 'number' || typeof colGlobal !== 'number') {
        return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
    }
    const ladoVisual = (colGlobal <= 3) ? 'player' : 'enemy';
    let indiceLocal = -1;
    if (ladoVisual === 'player') {
        if (colGlobal < 0 || colGlobal > 3) return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
        indiceLocal = filaGlobal * COLUMNAS_ARENA + colGlobal;
    } else {
        if (colGlobal < 4 || colGlobal > 7) return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
        indiceLocal = filaGlobal * COLUMNAS_ARENA + (colGlobal - 4);
    }
    if (indiceLocal < 0 || indiceLocal >= TOTAL_CASILLAS_LADO) {
        return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
    }
    const gridId = (ladoVisual === 'enemy') ? 'enemigoBoard' : 'playerBoard';
    const grid = document.getElementById(gridId);
    if (grid && grid.children[indiceLocal]) {
        const el = grid.children[indiceLocal];
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, elemento: el };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
}

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

function esPokemonMelee(unidad) {
    if (!unidad || !unidad.pokemon) return false;
    if (unidad.esZacian) return true;
    if (typeof unidad.pokemon.rangoAtaque === 'number' && unidad.pokemon.rangoAtaque > 0) {
        return unidad.pokemon.rangoAtaque <= 1;
    }
    const nombre = unidad.pokemon.nombre;
    const movimientos = getMovimientosPokemon(nombre);
    if (movimientos && movimientos.length > 0) {
        for (let mov of movimientos) {
            const nombreLimpio = limpiarNombreMovimiento(mov.nombre);
            const info = getDescripcionMovimiento(nombreLimpio);
            if (info && info.alcance && info.alcance === "1 casilla") return true;
        }
    }
    const clasesMelee = ['Lucha', 'Equilibrado', 'Defensa'];
    if (unidad.pokemon.clase && clasesMelee.includes(unidad.pokemon.clase)) return true;
    return false;
}

function esPokemonFrontline(unidad) {
    if (!unidad || !unidad.pokemon) return false;
    const pokemon = unidad.pokemon;
    const clase = pokemon.clase || '';
    if (pokemon.rol) return pokemon.rol === 'frontline';
    const clasesFrontline = ['Defensa', 'Equilibrado', 'Lucha'];
    if (clasesFrontline.includes(clase)) return true;
    const clasesBackline = ['At. Especial', 'Ágil', 'Auxiliar', 'Movimiento', 'Atacante'];
    if (clasesBackline.includes(clase)) return false;
    const hp = unidad.maxHp || pokemon.hp || 0;
    const defensa = unidad.defensa || pokemon.defense || 0;
    if (hp > 1000 && defensa > 150) return true;
    if (hp < 800 || defensa < 100) return false;
    return defensa > 150;
}

// ============================================================
// ===== TARGETING =====
// ============================================================

function seleccionarObjetivoPrioridad(atacante, indiceAtacante, enemigos, esMelee = false) {
    if (!enemigos || enemigos.length === 0) return null;
    if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(atacante);
    const filaAtacante = (typeof atacante._filaGlobal === 'number') ? atacante._filaGlobal : 0;
    const colAtacante  = (typeof atacante._colGlobal  === 'number') ? atacante._colGlobal  : 0;
    let enemigosInfo = [];
    for (let i = 0; i < enemigos.length; i++) {
        const enemigo = enemigos[i];
        if (!enemigo || enemigo.muerto || enemigo.hp <= 0) continue;
        if (enemigo.inmuneObjetivo) continue;
        if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(enemigo);
        const filaEnemigo = (typeof enemigo._filaGlobal === 'number') ? enemigo._filaGlobal : 0;
        const colEnemigo  = (typeof enemigo._colGlobal  === 'number') ? enemigo._colGlobal  : 0;
        enemigosInfo.push({
            indice: i, unidad: enemigo, fila: filaEnemigo, columna: colEnemigo,
            esFrontline: esPokemonFrontline(enemigo),
            tieneTaunt: !!(enemigo.taunt && enemigo.taunt.atacante && enemigo.taunt.atacante === atacante)
        });
    }
    if (enemigosInfo.length === 0) return null;
    if (atacante && atacante.taunt && atacante.taunt.atacante) {
        const taunter = atacante.taunt.atacante;
        if (taunter && taunter.hp > 0 && !taunter.muerto) {
            const idxTaunter = enemigosInfo.findIndex(e => e.unidad === taunter);
            if (idxTaunter !== -1) return { unidad: taunter, indice: enemigosInfo[idxTaunter].indice };
        }
    }
    const enemigosConTaunt = enemigosInfo.filter(e => e.tieneTaunt);
    if (enemigosConTaunt.length > 0) {
        enemigosConTaunt.sort((a, b) => {
            const distA = Math.abs(a.fila - filaAtacante) + Math.abs(a.columna - colAtacante);
            const distB = Math.abs(b.fila - filaAtacante) + Math.abs(b.columna - colAtacante);
            return distA - distB;
        });
        return { unidad: enemigosConTaunt[0].unidad, indice: enemigosConTaunt[0].indice };
    }
    function elegirDeGrupo(grupo) {
        if (grupo.length === 0) return null;
        let mismaFila = grupo.filter(e => e.fila === filaAtacante);
        if (mismaFila.length > 0) {
            mismaFila.sort((a, b) => Math.abs(a.columna - colAtacante) - Math.abs(b.columna - colAtacante));
            return mismaFila[0];
        }
        let mismaColumna = grupo.filter(e => e.columna === colAtacante);
        if (mismaColumna.length > 0) {
            mismaColumna.sort((a, b) => Math.abs(a.fila - filaAtacante) - Math.abs(b.fila - filaAtacante));
            return mismaColumna[0];
        }
        let ordenados = [...grupo].sort((a, b) => {
            const distA = Math.abs(a.fila - filaAtacante) + Math.abs(a.columna - colAtacante);
            const distB = Math.abs(b.fila - filaAtacante) + Math.abs(b.columna - colAtacante);
            return distA - distB;
        });
        return ordenados[0];
    }
    let frontline = enemigosInfo.filter(e => e.esFrontline);
    let backline  = enemigosInfo.filter(e => !e.esFrontline);
    let elegido = elegirDeGrupo(frontline) || elegirDeGrupo(backline);
    if (!elegido) return null;
    return { unidad: elegido.unidad, indice: elegido.indice };
}

// ============================================================
// ===== PUEDE INTERACTUAR / COMBATIR =====
// ============================================================

function puedeInteractuar() {
    if (combatiendo) {
        addConsoleMessage("⛔ No puedes hacer eso durante el combate!", 'error');
        return false;
    }
    return true;
}

function puedeCombatir() {
    if (combatiendo) {
        addConsoleMessage("⛔ Ya hay un combate en curso!", 'error');
        return false;
    }
    // 🆕 FIX: bloquear si el orquestador de fin de ronda está en curso
    if (window._finRondaEnCurso) {
        addConsoleMessage("⏳ Espera a que termine la ronda actual...", 'info');
        return false;
    }
    // 🆕 FIX: bloquear también durante la celebración previa al fin de ronda
    // (`combatiendo` ya es false, pero la ronda todavía no ha terminado).
    if (window._celebrandoFinRonda) {
        addConsoleMessage("⏳ Espera a que termine la ronda actual...", 'info');
        return false;
    }
    if (window.modoDosJugadores) return true;
    if (fase === 2 && !tiendaRonda2Comprada) {
        addConsoleMessage(`❌ ¡Debes comprar 1 pokémon en la ronda 2 antes de combatir!`, 'error');
        return false;
    }
    const tiendaActiva = debeAparecerTiendaObjetos(ronda);
    const hayObjetosEnTienda = objetosEnTienda && objetosEnTienda.length > 0;
    const yaCompro = objetoCompradoEstaRonda;
    if (tiendaActiva && hayObjetosEnTienda && !yaCompro) {
        addConsoleMessage(`❌ ¡Debes comprar un objeto antes de combatir! (Ronda de objetos ${ronda})`, 'error');
        return false;
    }
    return true;
}

// ============================================================
// ===== BLOQUEAR / LIBERAR ESTADO DE COMBATE =====
// ============================================================

function bloquearEstadoCombate() {
    combatiendo = true;
    enemyCombatiendo = true;
    document.getElementById("btnCombatirFijo").disabled = true;
    document.body.classList.add('combatiendo');
    const btnPost = document.getElementById('btnPostCombate');
    if (btnPost) {
        btnPost.disabled = false;
        btnPost.style.display = 'flex';
        btnPost.style.visibility = 'visible';
        btnPost.style.opacity = '1';
    }
    document.querySelectorAll('.salto-victoria').forEach(cell => {
        cell.classList.remove('salto-victoria');
        cell.style.animationDelay = '';
    });
    debugLogCombate("🔒 Estado de combate BLOQUEADO");
    metronomoGlobalStacks = 0;
}

function liberarEstadoCombate() {
    combatiendo = false;
    enemyCombatiendo = false;
    document.getElementById('btnCombatirFijo').disabled = false;
    document.body.classList.remove('combatiendo');
    const btnPost = document.getElementById('btnPostCombate');
    if (btnPost) {
        btnPost.disabled = false;
        btnPost.style.display = 'flex';
        btnPost.style.visibility = 'visible';
        btnPost.style.opacity = '1';
    }
    debugLogCombate("🔓 Estado de combate LIBERADO");
    metronomoGlobalStacks = 0;
}

// ============================================================
// ===== RESTAURAR POSICIONES ORIGINALES =====
// ============================================================

function restaurarPosicionesOriginales() {
    debugLogCombate("🔄 Restaurando posiciones originales de las unidades...");
    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i]) {
            if (tablero[i].esArticuno) continue;
            const coords = coordsDesdeIndice(i, 'player');
            tablero[i]._indiceActual  = i;
            tablero[i]._indiceTablero = 'player';
            tablero[i]._filaGlobal    = coords._filaGlobal;
            tablero[i]._colGlobal     = coords._colGlobal;
            tablero[i]._meleeMoveCooldown = 0;
            tablero[i]._haAvanzadoFrontal = false;
            if (typeof tablero[i].hp !== 'number' || isNaN(tablero[i].hp) || tablero[i].hp <= 0) {
                tablero[i].hp = tablero[i].maxHp || 1;
            }
            tablero[i].muerto = false;
        }
    }
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i]) {
            const coords = coordsDesdeIndice(i, 'enemy');
            enemyBoard[i]._indiceActual  = i;
            enemyBoard[i]._indiceTablero = 'enemy';
            enemyBoard[i]._filaGlobal    = coords._filaGlobal;
            enemyBoard[i]._colGlobal     = coords._colGlobal;
            enemyBoard[i]._meleeMoveCooldown = 0;
            enemyBoard[i]._haAvanzadoFrontal = false;
            if (typeof enemyBoard[i].hp !== 'number' || isNaN(enemyBoard[i].hp) || enemyBoard[i].hp <= 0) {
                enemyBoard[i].hp = enemyBoard[i].maxHp || 1;
            }
            enemyBoard[i].muerto = false;
        }
    }
    window.jugadores = null;
    window.rivales = null;
    window.jugadoresIndices = null;
    window.rivalesIndices = null;
    renderizar();
    debugLogCombate("✅ Posiciones restauradas correctamente");
}

window.restaurarPosicionesOriginales = restaurarPosicionesOriginales;

// ============================================================
// ===== OCULTAR / RESTAURAR UNIDAD =====
// ============================================================

function ocultarUnidadMuerta(elemento) {
    if (!elemento || !elemento.style) return;
    try {
        // 🆕 Desvanecimiento al caer: destello + fade + partículas
        if (typeof efectoFaintDesaparicion === 'function') efectoFaintDesaparicion(elemento);
        const sprite = elemento.querySelector ? elemento.querySelector('.unit-sprite') : null;
        if (sprite && sprite.classList) sprite.classList.add('faint-fade-out');
        elemento.style.pointerEvents = 'none';
        let hpBar = elemento.querySelector('.unit-hp-bar');
        if (hpBar && hpBar.style) hpBar.style.opacity = '0';
        let energyBar = elemento.querySelector('.energy-bar');
        if (energyBar && energyBar.style) energyBar.style.opacity = '0';
        let nameEl = elemento.querySelector('.unit-name');
        if (nameEl && nameEl.style) nameEl.style.opacity = '0';
        let traitsEl = elemento.querySelector('.unit-traits-left');
        if (traitsEl && traitsEl.style) traitsEl.style.opacity = '0';
        if (elemento.classList) elemento.classList.add('muerto');
        setTimeout(() => {
            if (!elemento || !elemento.isConnected) return;
            elemento.classList.remove('has-unit', 'team-player', 'team-enemy', 'muerto', 'casilla-veneno', 'casilla-quemadura');
            Array.from(elemento.classList).filter(c => c.startsWith('cost-')).forEach(c => elemento.classList.remove(c));
            elemento.innerHTML = '';
            elemento.style.opacity = '';
            elemento.style.transform = '';
            elemento.style.filter = '';
            elemento.style.pointerEvents = '';
        }, 560);
    } catch (e) {
        console.warn('⚠️ ocultarUnidadMuerta: elemento ya no existe en el DOM');
    }
}

function restaurarUnidad(elemento) {
    if (!elemento || !elemento.style) return;
    try {
        elemento.style.transition = 'opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease';
        elemento.style.opacity = '1';
        elemento.style.transform = 'scale(1)';
        elemento.style.filter = 'grayscale(0)';
        elemento.style.pointerEvents = '';
        let hpBar = elemento.querySelector('.unit-hp-bar');
        if (hpBar && hpBar.style) hpBar.style.opacity = '1';
        let energyBar = elemento.querySelector('.energy-bar');
        if (energyBar && energyBar.style) energyBar.style.opacity = '1';
        let nameEl = elemento.querySelector('.unit-name');
        if (nameEl && nameEl.style) nameEl.style.opacity = '1';
        let traitsEl = elemento.querySelector('.unit-traits-left');
        if (traitsEl && traitsEl.style) traitsEl.style.opacity = '1';
        let sprite = elemento.querySelector('.unit-sprite');
        if (sprite && sprite.style) {
            sprite.style.filter = 'grayscale(0) brightness(1)';
            sprite.style.opacity = '1';
        }
        if (sprite && sprite.classList) sprite.classList.remove('recall-suck', 'faint-fade-out');
        if (elemento.classList) elemento.classList.remove('muerto');
        if (elemento.classList) elemento.classList.add('restaurando');
        setTimeout(() => {
            if (elemento && elemento.classList) elemento.classList.remove('restaurando');
        }, 500);
    } catch (e) {
        console.warn('⚠️ restaurarUnidad: elemento ya no existe en el DOM');
    }
}

function restaurarTodasUnidades() {
    debugLogCombate("🔄 Restaurando todas las unidades visualmente...");
    if (document.body.classList.contains('celebrando')) {
        return;
    }
    try {
        document.querySelectorAll(
            '#playerBoard .board-cell, #enemigoBoard .board-cell, ' +
            '#banquilloGrid .bank-cell, #enemyBanquilloGrid .bank-cell'
        ).forEach(cell => {
            restaurarUnidad(cell);
            cell.classList.remove('salto-victoria');
            cell.style.animationDelay = '';
        });
    } catch (e) {
        console.warn('⚠️ restaurarTodasUnidades: error controlado');
    }
}

// ============================================================
// ===== ACTUALIZAR COPIA ESTADÍSTICAS =====
// ============================================================

function actualizarCopiaEstadisticas(unidad, statKey, valor) {
    if (!unidad) return;
    
    // 🆕 FIX CRÍTICO: Evitar que el contador se desborde.
    // Si el valor es mayor a 5000 de golpe, es un bug de DoT (quemadura/veneno).
    // Lo ignoramos para que no sume 37 millones al panel.
    if (typeof valor !== 'number' || isNaN(valor) || valor > 5000) {
        return;
    }

    for (let copia of equipoCompletoJugador) {
        if (copia && copia.pokemon && unidad.pokemon && copia.pokemon.id === unidad.pokemon.id && copia.baseId === unidad.baseId) {
            if (statKey === 'damageDealt') copia.damageDealt = (copia.damageDealt || 0) + valor;
            else if (statKey === 'damageTaken') copia.damageTaken = (copia.damageTaken || 0) + valor;
            else if (statKey === 'healingDone') copia.healingDone = (copia.healingDone || 0) + valor;
            else if (statKey === 'damageBlocked') copia.damageBlocked = (copia.damageBlocked || 0) + valor;
            copia.hp = unidad.hp;
            copia.muerto = unidad.muerto || false;
            return;
        }
    }
    for (let copia of equipoCompletoEnemigo) {
        if (copia && copia.pokemon && unidad.pokemon && copia.pokemon.id === unidad.pokemon.id && copia.baseId === unidad.baseId) {
            if (statKey === 'damageDealt') copia.damageDealt = (copia.damageDealt || 0) + valor;
            else if (statKey === 'damageTaken') copia.damageTaken = (copia.damageTaken || 0) + valor;
            else if (statKey === 'healingDone') copia.healingDone = (copia.healingDone || 0) + valor;
            else if (statKey === 'damageBlocked') copia.damageBlocked = (copia.damageBlocked || 0) + valor;
            copia.hp = unidad.hp;
            copia.muerto = unidad.muerto || false;
            return;
        }
    }
}

// ============================================================
// ===== ACTUALIZAR BARRA DE VIDA =====
// ============================================================

function actualizarBarraVidaPokemon(elemento, hp, maxHp, dañoRecibido = 0, unidad = null) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    try {
        const hpBar = elemento.querySelector('.hp-fill');
        if (!hpBar) return;
        const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        if (unidad && unidad._reviviendo) {
            hpBar.style.transition = 'none';
            hpBar.style.width = percent + '%';
            void hpBar.offsetWidth;
            requestAnimationFrame(() => {
                if (hpBar && hpBar.style) hpBar.style.transition = '';
            });
        } else {
            hpBar.style.width = percent + '%';
        }
        hpBar.className = 'hp-fill';
        if (percent > 50) hpBar.className = 'hp-fill';
        else if (percent > 25) hpBar.className = 'hp-fill medium';
        else if (percent > 10) hpBar.className = 'hp-fill low';
        else hpBar.className = 'hp-fill critical';
        if (dañoRecibido > 0) {
            hpBar.classList.add('damage-flash');
            setTimeout(() => {
                if (hpBar && hpBar.classList) hpBar.classList.remove('damage-flash');
            }, 300);
        }
        if (unidad) {
            const barraHP = elemento.querySelector('.unit-hp-bar');
            if (barraHP) {
                const escudoExistente = barraHP.querySelector('.hp-shield');
                let escudoActualizado = false;
                if (unidad.escudoActual && unidad.escudoActual > 0 && maxHp > 0) {
                    const escudoPercent = Math.min(100 - percent, (unidad.escudoActual / maxHp) * 100);
                    if (escudoPercent > 0) {
                        if (escudoExistente) {
                            escudoExistente.style.left = percent + '%';
                            escudoExistente.style.width = escudoPercent + '%';
                        } else {
                            const nuevoEscudo = document.createElement('div');
                            nuevoEscudo.className = 'hp-shield';
                            nuevoEscudo.style.left = percent + '%';
                            nuevoEscudo.style.width = escudoPercent + '%';
                            const segments = barraHP.querySelector('.hp-segments');
                            if (segments) barraHP.insertBefore(nuevoEscudo, segments);
                            else barraHP.appendChild(nuevoEscudo);
                        }
                        escudoActualizado = true;
                    }
                }
                if (!escudoActualizado && escudoExistente) escudoExistente.remove();
                if (unidad.poisonStacks && unidad.poisonStacks.length > 0) elemento.classList.add('casilla-veneno');
                else elemento.classList.remove('casilla-veneno');
            }
            const sprite = elemento.querySelector('.unit-sprite');
            if (sprite) {
                if (unidad.frozen) sprite.classList.add('frozen');
                else sprite.classList.remove('frozen');
                if (unidad._quemado || unidad.burnDamage > 0) sprite.classList.add('burn');
                else sprite.classList.remove('burn');
            }
            if (unidad._quemado || unidad.burnDamage > 0) elemento.classList.add('casilla-quemadura');
            else elemento.classList.remove('casilla-quemadura');
        }
    } catch (e) {
        console.warn('⚠️ actualizarBarraVidaPokemon: elemento ya no existe en el DOM');
    }
}

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

function procesarVeneno(unidad, deltaTiempo) {
    if (!unidad || unidad.hp <= 0 || unidad.muerto) return;
    if (!unidad.poisonStacks || unidad.poisonStacks.length === 0) {
        unidad._venenoTickGlobal = 0;
        return;
    }

    // ============================================================
    // 1) Tick GLOBAL compartido por todos los stacks
    // ============================================================
    unidad._venenoTickGlobal = (unidad._venenoTickGlobal || 0) + deltaTiempo;

    let dañoBaseTotal = 0;
    let stacksQueCuentan = 0;
    const multiplicadoresEnJuego = new Set();

    if (unidad._venenoTickGlobal >= 1) {
        unidad._venenoTickGlobal -= 1;

        for (let i = unidad.poisonStacks.length - 1; i >= 0; i--) {
            const stack = unidad.poisonStacks[i];
            if (!stack) {
                unidad.poisonStacks.splice(i, 1);
                continue;
            }

            if (stacksQueCuentan < MAX_STACKS_VENENO_DANO) {
                const multStack = (typeof stack.multiplicador === 'number' && !isNaN(stack.multiplicador))
                    ? stack.multiplicador
                    : 1;

                dañoBaseTotal += (stack.daño || 0) * multStack;
                stacksQueCuentan++;
                multiplicadoresEnJuego.add(multStack);
            }
        }
    }

    // ============================================================
    // 2) Avanzar tiempo restante de cada stack (independiente del tick)
    // ============================================================
    for (let i = unidad.poisonStacks.length - 1; i >= 0; i--) {
        const stack = unidad.poisonStacks[i];
        if (!stack) continue;
        stack.tiempoRestante = (stack.tiempoRestante || 0) - deltaTiempo;
        if (stack.tiempoRestante <= 0) {
            unidad.poisonStacks.splice(i, 1);
        }
    }

    if (dañoBaseTotal <= 0) return;

    // ============================================================
    // 3) Aplicar daño
    // ============================================================
    const dañoTotal = Math.floor(dañoBaseTotal);
    if (typeof dañoTotal !== 'number' || isNaN(dañoTotal) || dañoTotal <= 0) return;

    unidad.hp = Math.max(0, unidad.hp - dañoTotal);
    unidad.damageTaken += dañoTotal;

    if (typeof actualizarCopiaEstadisticas === 'function') {
        actualizarCopiaEstadisticas(unidad, 'damageTaken', dañoTotal);
    }

    const pos = obtenerPosicionUnidadActual(unidad);

    if (pos) {
        if (typeof mostrarNumeroDaño === 'function') {
            mostrarNumeroDaño(pos.x, pos.y - 20, dañoTotal, false, false, false, pos.elemento || null);
        }
        if (pos.elemento && typeof actualizarBarraVidaPokemon === 'function') {
            actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp, dañoTotal, unidad);
        }
    }

    if (typeof addConsoleMessage === 'function') {
        const detalleMult = multiplicadoresEnJuego.size === 1
            ? ` × ${Array.from(multiplicadoresEnJuego)[0]}x`
            : '';
        addConsoleMessage(
            `☠️ ${unidad.pokemon.nombre} recibe ${dañoTotal} daño de veneno (${stacksQueCuentan} stack(s)${detalleMult})`,
            'battle'
        );
    }

    if (unidad.hp <= 0) {
        unidad.muerto = true;
        if (pos && pos.elemento && typeof ocultarUnidadMuerta === 'function') {
            ocultarUnidadMuerta(pos.elemento);
        }
    }
}

// ============================================================
// ===== PROCESAR REGENERACIÓN =====
// ============================================================

function procesarRegeneracion(unidad, tickInterval) {
    if (!unidad || unidad.hp <= 0 || unidad.muerto) return;
    if (unidad.regenPorSegundo > 0) {
        const tieneRestosReal = unidad.objetos && unidad.objetos.some(o => {
            const obj = window.OBJETOS && window.OBJETOS[o];
            return obj && obj.efecto && obj.efecto.regenPorSegundo;
        });
        if (!tieneRestosReal) {
            unidad.regenPorSegundo = 0;
            unidad.regenTimer = 0;
        }
    }
    if (unidad.regenPerSecond > 0) {
        unidad._regenAccumulator = (unidad._regenAccumulator || 0) + tickInterval;
        if (unidad._regenAccumulator >= 1) {
            unidad._regenAccumulator -= 1;
            let curacion = Math.floor(unidad.maxHp * unidad.regenPerSecond);
            let curado = unidad.curar(curacion);
            if (curado > 0) {
                let pos = obtenerPosicionUnidadActual(unidad);
                if (pos && curado >= unidad.maxHp * COMBAT_CONFIG.UMBRAL_CURACION_VISIBLE) {
                    if (typeof mostrarNumeroCuracion === 'function') mostrarNumeroCuracion(pos.x, pos.y, curado);
                }
                unidad.healingDone += curado;
                if (typeof actualizarCopiaEstadisticas === 'function') actualizarCopiaEstadisticas(unidad, 'healingDone', curado);
                if (pos && pos.elemento) actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp, 0, unidad);
            }
        }
    }
    if (unidad.regenPorSegundo > 0) {
        unidad.regenTimer = (unidad.regenTimer || 0) + tickInterval;
        if (unidad.regenTimer >= unidad.regenIntervalo) {
            unidad.regenTimer = 0;
            let curacion = Math.floor(unidad.maxHp * unidad.regenPorSegundo);
            let curado = unidad.curar(curacion);
            if (curado > 0) {
                let pos = obtenerPosicionUnidadActual(unidad);
                if (pos && curado >= unidad.maxHp * COMBAT_CONFIG.UMBRAL_CURACION_VISIBLE) {
                    if (typeof mostrarNumeroCuracion === 'function') mostrarNumeroCuracion(pos.x, pos.y, curado);
                }
                unidad.healingDone += curado;
                if (typeof actualizarCopiaEstadisticas === 'function') actualizarCopiaEstadisticas(unidad, 'healingDone', curado);
                if (pos && pos.elemento) actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp, 0, unidad);
            }
        }
    }
}

// ============================================================
// ===== STATS EN VIVO =====
// ============================================================

function actualizarStatsEnVivo(jugadores, rivales) {
    if (!window.statsCombateEnVivo) window.statsCombateEnVivo = { activo: true, jugadores: [], rivales: [] };
    if (!window.statsCombateEnVivo.activo) return;
    let statsJugadores = [], zacianVisto = false;
    for (let j of jugadores) {
        if (!j || !j.pokemon) continue;
        if (j.esZacian) { if (zacianVisto) continue; zacianVisto = true; }
        let tipoAtaque = 'fisico';
        if (j.ataqueEspecial > j.ataque * 1.2) tipoAtaque = 'especial';
        statsJugadores.push({
            nombre: j.pokemon.nombre, spriteId: j.pokemon.spriteId || j.pokemon.id,
            nivel: j.nivel || 1, damageDealt: j.damageDealt || 0, damageTaken: j.damageTaken || 0,
            healingDone: j.healingDone || 0, damageBlocked: j.damageBlocked || 0,
            hp: j.hp || 0, maxHp: j.maxHp || 0, muerto: j.muerto || false, equipo: 'jugador',
            tipoAtaque, esFrontline: esPokemonFrontline(j), esZacian: j.esZacian || false, esMelee: esPokemonMelee(j)
        });
    }
    let statsRivales = [], zacianEnemigoVisto = false;
    for (let r of rivales) {
        if (!r || !r.pokemon) continue;
        if (r.esZacian) { if (zacianEnemigoVisto) continue; zacianEnemigoVisto = true; }
        let tipoAtaque = 'fisico';
        if (r.ataqueEspecial > r.ataque * 1.2) tipoAtaque = 'especial';
        statsRivales.push({
            nombre: r.pokemon.nombre, spriteId: r.pokemon.spriteId || r.pokemon.id,
            nivel: r.nivel || 1, damageDealt: r.damageDealt || 0, damageTaken: r.damageTaken || 0,
            healingDone: r.healingDone || 0, damageBlocked: r.damageBlocked || 0,
            hp: r.hp || 0, maxHp: r.maxHp || 0, muerto: r.muerto || false, equipo: 'enemigo',
            tipoAtaque, esFrontline: esPokemonFrontline(r), esZacian: r.esZacian || false, esMelee: esPokemonMelee(r)
        });
    }
    window.statsCombateEnVivo.jugadores = statsJugadores;
    window.statsCombateEnVivo.rivales = statsRivales;
}

window.actualizarStatsEnVivo = actualizarStatsEnVivo;

// ============================================================
// ===== REGISTRAR ESTADÍSTICAS DEL COMBATE =====
// ============================================================

function registrarEstadisticasCombate(jugadores, rivales, victoria, duracion) {
    debugLogCombate("📊 REGISTRANDO ESTADÍSTICAS DEL COMBATE");
    let statsJugadores = [], zacianEncontrado = false;
    for (let j of jugadores) {
        if (j && j.pokemon) {
            if (j.esZacian) { if (zacianEncontrado) continue; zacianEncontrado = true; }
            let tipoAtaque = 'fisico';
            if (j.ataqueEspecial > j.ataque * 1.2) tipoAtaque = 'especial';
            let copiaActualizada = null;
            for (let c of equipoCompletoJugador) {
                if (c && c.pokemon && c.pokemon.id === j.pokemon.id && c.baseId === j.baseId) { copiaActualizada = c; break; }
            }
            statsJugadores.push({
                nombre: j.pokemon.nombre, spriteId: j.pokemon.spriteId || j.pokemon.id,
                nivel: j.nivel || 1,
                damageDealt: copiaActualizada ? copiaActualizada.damageDealt || 0 : j.damageDealt || 0,
                damageTaken: copiaActualizada ? copiaActualizada.damageTaken || 0 : j.damageTaken || 0,
                healingDone: copiaActualizada ? copiaActualizada.healingDone || 0 : j.healingDone || 0,
                damageBlocked: copiaActualizada ? copiaActualizada.damageBlocked || 0 : j.damageBlocked || 0,
                hp: j.hp || 0, maxHp: j.maxHp || 0, muerto: j.muerto || false, equipo: 'jugador',
                tipoAtaque, esFrontline: esPokemonFrontline(j), esZacian: j.esZacian || false, esMelee: esPokemonMelee(j)
            });
        }
    }
    let statsRivales = [], zacianEnemigoEncontrado = false;
    for (let r of rivales) {
        if (r && r.pokemon) {
            if (r.esZacian) { if (zacianEnemigoEncontrado) continue; zacianEnemigoEncontrado = true; }
            let tipoAtaque = 'fisico';
            if (r.ataqueEspecial > r.ataque * 1.2) tipoAtaque = 'especial';
            let copiaActualizada = null;
            for (let c of equipoCompletoEnemigo) {
                if (c && c.pokemon && c.pokemon.id === r.pokemon.id && c.baseId === r.baseId) { copiaActualizada = c; break; }
            }
            statsRivales.push({
                nombre: r.pokemon.nombre, spriteId: r.pokemon.spriteId || r.pokemon.id,
                nivel: r.nivel || 1,
                damageDealt: copiaActualizada ? copiaActualizada.damageDealt || 0 : r.damageDealt || 0,
                damageTaken: copiaActualizada ? copiaActualizada.damageTaken || 0 : r.damageTaken || 0,
                healingDone: copiaActualizada ? copiaActualizada.healingDone || 0 : r.healingDone || 0,
                damageBlocked: copiaActualizada ? copiaActualizada.damageBlocked || 0 : r.damageBlocked || 0,
                hp: r.hp || 0, maxHp: r.maxHp || 0, muerto: r.muerto || false, equipo: 'enemigo',
                tipoAtaque, esFrontline: esPokemonFrontline(r), esZacian: r.esZacian || false, esMelee: esPokemonMelee(r)
            });
        }
    }
    let totalDañoJugador = statsJugadores.reduce((sum, s) => sum + (s.damageDealt || 0), 0);
    let totalDañoRecibido = statsJugadores.reduce((sum, s) => sum + (s.damageTaken || 0), 0);
    let totalCuracion = statsJugadores.reduce((sum, s) => sum + (s.healingDone || 0), 0);
    window.postCombateData = {
        victoria, duracion, statsJugadores, statsRivales,
        totalDañoJugador: Math.round(totalDañoJugador),
        totalDañoRecibido: Math.round(totalDañoRecibido),
        totalCuracion: Math.round(totalCuracion)
    };
    postCombateData = window.postCombateData;
    const btnPost = document.getElementById('btnPostCombate');
    if (btnPost) {
        btnPost.style.display = 'flex';
        btnPost.style.visibility = 'visible';
        btnPost.style.opacity = '1';
        btnPost.disabled = false;
    }
    estadisticasGlobales.totalDaño += totalDañoJugador;
    estadisticasGlobales.totalRecibido += totalDañoRecibido;
    estadisticasGlobales.totalCuracion += totalCuracion;
    if (victoria) estadisticasGlobales.victorias++;
    estadisticasGlobales.rondas++;
    let mejorJugador = null, mejorPuntuacion = -1;
    for (let s of statsJugadores) {
        let puntuacion = (s.damageDealt || 0) + (s.healingDone || 0) * 0.5 + (s.damageBlocked || 0) * 0.3;
        if (puntuacion > mejorPuntuacion) { mejorPuntuacion = puntuacion; mejorJugador = s; }
    }
    if (mejorJugador) {
        estadisticasGlobales.mvp = mejorJugador.nombre;
        if ((mejorJugador.damageDealt || 0) > estadisticasGlobales.topDaño) estadisticasGlobales.topDaño = mejorJugador.damageDealt || 0;
        if ((mejorJugador.damageTaken || 0) > estadisticasGlobales.topRecibido) estadisticasGlobales.topRecibido = mejorJugador.damageTaken || 0;
    }
    if (!estadisticasGlobales.mejoresPokemon) estadisticasGlobales.mejoresPokemon = [];
    const todosStats = [...statsJugadores, ...statsRivales];
    for (let s of todosStats) {
        if (!s || !s.nombre) continue;
        let existente = null;
        for (let m of estadisticasGlobales.mejoresPokemon) {
            if (m.nombre === s.nombre && m.equipo === s.equipo) { existente = m; break; }
        }
        if (existente) {
            existente.damageDealt += s.damageDealt || 0;
            existente.damageTaken += s.damageTaken || 0;
            existente.damageBlocked += s.damageBlocked || 0;
            existente.healingDone += s.healingDone || 0;
            if ((s.nivel || 1) > (existente.nivel || 1)) existente.nivel = s.nivel || 1;
        } else {
            estadisticasGlobales.mejoresPokemon.push({
                nombre: s.nombre, spriteId: s.spriteId, equipo: s.equipo,
                nivel: s.nivel || 1, damageDealt: s.damageDealt || 0, damageTaken: s.damageTaken || 0,
                damageBlocked: s.damageBlocked || 0, healingDone: s.healingDone || 0, tipoAtaque: s.tipoAtaque || 'fisico'
            });
        }
    }
    return postCombateData;
}

// ============================================================
// ===== CONFETI / SPARKLES / EFECTOS =====
// ============================================================

function crearConfeti() {
    const colores = ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];
    const overlay = document.getElementById('combatOverlay');
    if (!overlay) return;
    overlay.querySelectorAll('.confeti-particle').forEach(el => el.remove());
    for (let i = 0; i < 60; i++) {
        const confeti = document.createElement('div');
        confeti.className = 'confeti-particle';
        const size = Math.random() * 8 + 4;
        const esCirculo = Math.random() > 0.5;
        const x = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duracion = Math.random() * 2 + 2;
        const color = colores[Math.floor(Math.random() * colores.length)];
        confeti.style.cssText = `
            position: absolute; width: ${size}px; height: ${esCirculo ? size : size * 0.4}px;
            background: ${color}; border-radius: ${esCirculo ? '50%' : '2px'}; top: -10px; left: ${x}%;
            opacity: 0; pointer-events: none; z-index: 10000;
            animation: confetiFall ${duracion}s ease-in forwards; animation-delay: ${delay}s;
            transform: rotate(${Math.random() * 360}deg); box-shadow: 0 0 6px rgba(255,255,255,0.1);
        `;
        overlay.appendChild(confeti);
        setTimeout(() => { if (confeti.parentNode) confeti.remove(); }, (duracion + delay) * 1000 + 100);
    }
}

function crearSparklesVictoria() {
    const colores = ['#fbbf24', '#fff7d6', '#ffd700', '#fde68a', '#ffffff'];
    const cx = window.innerWidth / 2, cy = 130;
    for (let i = 0; i < 26; i++) {
        const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 55 + Math.random() * 95;
        const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
        const size = 4 + Math.random() * 7;
        const color = colores[Math.floor(Math.random() * colores.length)];
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: fixed; left: ${cx}px; top: ${cy}px; width: ${size}px; height: ${size}px;
            margin-left: ${-size / 2}px; margin-top: ${-size / 2}px; background: ${color};
            border-radius: 50%; --dx: ${dx}px; --dy: ${dy}px; box-shadow: 0 0 8px ${color};
            pointer-events: none; z-index: 6000; animation: sparkleBurst 0.9s ease-out forwards;
        `;
        document.body.appendChild(sparkle);
        setTimeout(() => { if (sparkle.parentNode) sparkle.remove(); }, 900);
    }
}

function animarSaltoGanadoresDerrota() {
    try {
        const celdas = document.querySelectorAll(
            '#playerBoard .board-cell.has-unit.team-enemy:not(.muerto), ' +
            '#enemigoBoard .board-cell.has-unit.team-enemy:not(.muerto)'
        );
        celdas.forEach((cell, i) => {
            cell.classList.add('salto-victoria');
            cell.style.animationDelay = (i * 0.12) + 's';
        });
    } catch (e) {
        console.error('❌ animarSaltoGanadoresDerrota:', e);
    }
}

function animarSaltoGanadoresJugador() {
    try {
        const celdas = document.querySelectorAll(
            '#playerBoard .board-cell.has-unit.team-player:not(.muerto), ' +
            '#enemigoBoard .board-cell.has-unit.team-player:not(.muerto)'
        );
        celdas.forEach((cell, i) => {
            cell.classList.add('salto-victoria');
            cell.style.animationDelay = (i * 0.12) + 's';
        });
    } catch (e) {
        console.error('❌ animarSaltoGanadoresJugador:', e);
    }
}

// ============================================================
// ===== MOSTRAR RESULTADO DE COMBATE =====
// ============================================================

function mostrarResultadoCombate(victoria, ganancia, daño, racha, callback, esSandbox = false) {
    let ov = document.getElementById("combatOverlay");
    if (!ov) {
        console.error("❌ Elementos del overlay de combate no encontrados");
        if (callback) callback();
        return;
    }
    let ganadorNombre2P = null;
    if (window.modoDosJugadores) {
        const prim = window.primerTurnoJugador || 1;
        const numGanador = victoria ? prim : (prim === 1 ? 2 : 1);
        const nom = numGanador === 1
            ? (window.nombreJugador && String(window.nombreJugador).trim() ? window.nombreJugador : 'Jugador 1')
            : (window.nombreJugador2 && String(window.nombreJugador2).trim() ? window.nombreJugador2 : 'Jugador 2');
        ganadorNombre2P = nom;
    }
    ov.querySelectorAll('.confeti-particle').forEach(el => el.remove());
    ov.style.display = 'flex';
    ov.style.opacity = '1';
    ov.style.pointerEvents = 'none';
    const textoVictoria = ganadorNombre2P ? `¡VICTORIA de ${ganadorNombre2P}!` : "¡VICTORIA!";
    const textoDerrota = ganadorNombre2P ? `¡DERROTA! Gana ${ganadorNombre2P}` : "¡DERROTA!";
    let textoMonedasRacha = '', textoMonedasRachaDerrota = '';
    const rachaMostrar = victoria ? (racha > 0 ? racha + 1 : 1) : (racha < 0 ? racha - 1 : -1);
    // 🪙 La moneda del juego en vez del emoji de bolsa de dinero
    const monedaHtml = '<img class="coin-inline" src="assets/icons/moneda.png" alt="oro" draggable="false">';
    if (victoria) {
        const rachaTexto = `Racha +${rachaMostrar}`;
        textoMonedasRacha = ganancia > 0 ? `+${ganancia} ${monedaHtml} · ${rachaTexto}` : `Sin oro · ${rachaTexto}`;
    } else {
        // 🪙 En derrota también se gana oro (5 + interés + racha), así que se
        //    muestra igual que en victoria: daño recibido + monedas ganadas.
        textoMonedasRachaDerrota = ganancia > 0
            ? `-${daño} HP · +${ganancia} ${monedaHtml} · Racha ${rachaMostrar}`
            : `-${daño} HP · Sin oro · Racha ${rachaMostrar}`;
    }
    // 👥 En 2P SIEMPRE se muestra al GANADOR (nunca "DERROTA").
    const es2P = window.modoDosJugadores === true;
    const usarVictoria = es2P || victoria;
    const icono = esSandbox ? '🧪' : (usarVictoria ? '🏆' : '💀');
    const claseVictoria = usarVictoria ? 'victoria' : 'derrota';
    const texto = es2P ? textoVictoria : (victoria ? textoVictoria : textoDerrota);
    const textoMonedas = victoria ? textoMonedasRacha : textoMonedasRachaDerrota;

    if (esSandbox) {
        // 🧪 Cartel de sandbox: sin oro, sin HP, sin racha.
        ov.innerHTML = `
            <div class="combat-resultado-centrado">
                <div class="combat-resultado-icono">🧪</div>
                <div class="combat-resultado-texto ${claseVictoria}">SANDBOX</div>
                <div class="combat-resultado-monedas">${victoria ? 'Victoria' : 'Derrota'} · Sin recompensas</div>
            </div>
        `;
    } else {
        ov.innerHTML = `
            <div class="combat-resultado-centrado">
                <div class="combat-resultado-icono">${icono}</div>
                <div class="combat-resultado-texto ${claseVictoria}">${texto}</div>
                <div class="combat-resultado-monedas">${textoMonedas}</div>
            </div>
        `;
    }
    if (usarVictoria) {
        ov.className = "combat-overlay victoria active";
        crearConfeti();
        crearSparklesVictoria();
    } else {
        ov.className = "combat-overlay derrota active";
    }
    clearTimeout(ov._timeout);
        ov._timeout = setTimeout(() => {
        ov.classList.remove("active");
        setTimeout(() => {
            ov.className = "combat-overlay";
            ov.style.display = 'none';
            ov.style.opacity = '0';
            if (callback) callback();
        }, 350);
    }, 3800);
}

// ============================================================
// FUNCIÓN PRINCIPAL DE COMBATE
// ============================================================

async function combatir() {
    if (!puedeCombatir()) return;
    let combateFinalizado = false;

    // 🧪 SANDBOX: en modo creativo el combate no debe avanzar ronda,
    // ni tocar oro/HP/torneo. Guardamos el estado para restaurarlo.
    const _esSandbox = window.modoCreativo === true;
    const _sandboxEstado = _esSandbox ? {
        vidaJugador, enemyHealth, oro, racha, victorias, experiencia,
        nivelJugador, fase, ronda, enemyLevel, enemyGold,
        enemyWinStreak, enemyLossStreak
    } : null;
    window.statsCombateEnVivo = { activo: true, jugadores: [], rivales: [] };

    // 👥 Recordar qué jugador (1 o 2) es el lado "jugador" en ESTE combate,
    // para que el panel de datos muestre J1 a la izquierda / J2 a la derecha
    // aunque luego `prepararTurnoDespuesDeCombate` haga el swap de estado.
    window._ultimoCombateJugadorEsJ2 = (window.modoDosJugadores === true && window.primerTurnoJugador === 2);

    try {
        bloquearEstadoCombate();
        if (typeof resetCambioMovimientoRonda === 'function') resetCambioMovimientoRonda();

        const btnPost = document.getElementById('btnPostCombate');
        if (btnPost) btnPost.style.display = 'inline-flex';

        if (seleccionado) {
            seleccionado = null;
            const btnVenderOld = document.getElementById('btnVender');
            if (btnVenderOld) btnVenderOld.style.display = 'none';
            document.querySelectorAll('.board-cell.selected, .bank-cell.selected').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.board-cell.drag-over, .bank-cell.drag-over').forEach(c => c.classList.remove('drag-over'));
        }
        if (objetoSeleccionado) objetoSeleccionado = null;

        let equipo = tablero.filter(u => u !== null && !u.esArticuno);
        if (equipo.length === 0) {
            addConsoleMessage("❌ No tienes Pokémon en el tablero! Compra uno primero.", 'error');
            liberarEstadoCombate();
            return;
        }
        if (enemyHealth <= 0) { mostrarVictoriaJuego(); liberarEstadoCombate(); return; }
        if (vidaJugador <= 0) { gameOver(); liberarEstadoCombate(); return; }

        iniciarAudio();
        addConsoleMessage("⚔️ ¡COMBATE INICIADO!", 'battle');
                if (typeof pausarMusicaPreparacion === 'function') {
            pausarMusicaPreparacion();
        } else if (typeof pausarFondoPreparacion === 'function') {
            // audioGestor.js ya no se usa (está comentado en index.html).
            pausarFondoPreparacion();
        }
        if (typeof reproducirMusicaCombate === 'function') {
            reproducirMusicaCombate();
        } else if (typeof playUISound === 'function') {
            playUISound('combate.mp3', 0.15);
        }

                aplicarSinergias();
        aplicarSinergiasEnemigo();

        // 🆕 FIX: Sincronizar Aura de Miedo al inicio del combate
        try {
            const sinergiasActuales = getSinergiasActivas();
            const nivelSiniestroJugador = (sinergiasActuales.types && sinergiasActuales.types["Siniestro"])
                ? sinergiasActuales.types["Siniestro"].nivel : 0;
            
            if (nivelSiniestroJugador < 2) {
                // El jugador NO tiene Siniestro activo → resetear AMBOS
                fearAuraStacks = 0;
                window.fearAuraStacks = 0;
            } else {
                // Siniestro activo → mantener los stacks existentes
                window.fearAuraStacks = fearAuraStacks;
            }

            // Sincronizar contador del enemigo
            const sinergiasEnemigo = (typeof getSinergiasActivasEnemigo === 'function')
                ? getSinergiasActivasEnemigo() : { types: {} };
            const nivelSiniestroEnemigo = (sinergiasEnemigo.types && sinergiasEnemigo.types["Siniestro"])
                ? sinergiasEnemigo.types["Siniestro"].nivel : 0;
            
            if (nivelSiniestroEnemigo < 2) {
                window.enemyFearAuraStacks = 0;
            }
        } catch (e) {
            console.warn('⚠️ Error sincronizando Aura de Miedo al inicio:', e);
        }

        if (typeof actualizarBordeLlamasCombate === 'function') actualizarBordeLlamasCombate();

        // Resetear estado de unidades enemigas
        for (let i = 0; i < enemyBoard.length; i++) {
            const u = enemyBoard[i];
            if (u) {
                u.damageDealt = 0; u.damageTaken = 0; u.healingDone = 0; u.damageBlocked = 0;
                u.equipo = 'enemy'; u.muerto = false;
                if (typeof u.hp !== 'number' || isNaN(u.hp) || u.hp <= 0) u.hp = u.maxHp || 1;
                u.metronomoBonus = 1; u.energiaLista = false;
                const coords = coordsDesdeIndice(i, 'enemy');
                u._indiceActual = i; u._indiceTablero = 'enemy';
                u._filaGlobal = coords._filaGlobal; u._colGlobal = coords._colGlobal;
                u.enlaceDolor = null; u.taunt = null; u.inmuneObjetivo = false;
                u.esquirlasHielo = 0; u._golpeDoble = false; u.dañoPorcentajeMaxHPObjetivo = 0;
                u.bolasLlamaEmbrujada = 0;
                u._teletransporteAtkBonus = 1; u._teletransporteSpAtkBonus = 1;
                u._teletransporteVelBonus = 1; u._teletransporteDefBonus = 0; u._teletransporteSpDefBonus = 0;
                u.spriteIdAlternativo = null; u.poisonStacks = []; u.critGuaranteed = false;
                u.escudoTimer = 0; u.escudoActivo = false; u.escudoActual = 0;
                u._regenAccumulator = 0; u.regenTimer = 0;
                u._deathLogged = false; u._reviviendo = false; u._regenLogged = false;
                u.ultiCarga = 0; u.ultiLista = false; u._ultiAvisada = false;
                u._ultiCargadaAntesDelAtaque = false; u._cooldownAtaque = 0; u._ultiDeInicioLanzada = false;
                if (u._hojaAfiladaIntervalId) { clearInterval(u._hojaAfiladaIntervalId); u._hojaAfiladaIntervalId = null; }
                u._hojaAfiladaActiva = false; u._hojaAfiladaFin = 0;
            }
        }
        for (let i = 0; i < tablero.length; i++) {
            if (tablero[i] && !tablero[i].esArticuno) {
                tablero[i]._ultiDeInicioLanzada = false;
                if (tablero[i]._hojaAfiladaIntervalId) { clearInterval(tablero[i]._hojaAfiladaIntervalId); tablero[i]._hojaAfiladaIntervalId = null; }
                tablero[i]._hojaAfiladaActiva = false; tablero[i]._hojaAfiladaFin = 0;
            }
        }
        for (let i = 0; i < enemyBoard.length; i++) {
            if (enemyBoard[i]) {
                enemyBoard[i]._ultiDeInicioLanzada = false;
                if (enemyBoard[i]._hojaAfiladaIntervalId) { clearInterval(enemyBoard[i]._hojaAfiladaIntervalId); enemyBoard[i]._hojaAfiladaIntervalId = null; }
                enemyBoard[i]._hojaAfiladaActiva = false; enemyBoard[i]._hojaAfiladaFin = 0;
            }
        }

        const _dispararUltisDeInicio = (unidad, aliados, enemigos) => {
            if (!unidad || !unidad.tieneDiscoUlti) return;
            const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[unidad.pokemon.nombre];
            if (!ultiData || !ultiData.esDeInicio) return;
            const nombreSlug = ultiData.id || ultiData.nombre
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                        const ultiFunc = window.ULTIS_REGISTRO && window.ULTIS_REGISTRO[nombreSlug];
            if (ultiFunc && typeof ultiFunc.ejecutar === 'function') {
                try {
                    // 🆕 GRITO DEL POKÉMON ANTES DE LA ULTI DE INICIO
                    const spriteIdGritoInicio = unidad.spriteIdAlternativo || unidad.pokemon.spriteId || unidad.pokemon.id;
                    if (typeof playPokemonCry === 'function' && spriteIdGritoInicio) {
                        try { playPokemonCry(spriteIdGritoInicio); } catch (e) {}
                    }

                    ultiFunc.ejecutar(unidad, null, { enemigos, aliados, esJugador: unidad.equipo === 'player' });
                    unidad._ultiDeInicioLanzada = true;
                    unidad.ultiLista = false;
                    unidad.ultiCarga = 0;
                    if (typeof addConsoleMessage === 'function') addConsoleMessage(`⚡ ${unidad.pokemon.nombre} activa su ULTIMATE de inicio`, 'battle');
                } catch (e) {
                    console.error('❌ Error lanzando ulti de inicio:', e);
                }
            }
        };

        // ==== Snapshots para stats ====
        equipoCompletoJugador = [];
        for (let i = 0; i < tablero.length; i++) {
            if (tablero[i] && !tablero[i].esArticuno) {
                let copia = new Unidad(tablero[i].pokemon, tablero[i].nivel, tablero[i].baseId, tablero[i].costeOriginal);
                copia.hp = tablero[i].hp; copia.maxHp = tablero[i].maxHp;
                copia.ataque = tablero[i].ataque; copia.ataqueEspecial = tablero[i].ataqueEspecial;
                copia.defensa = tablero[i].defensa; copia.defensaEspecial = tablero[i].defensaEspecial;
                copia.velocidadAtaque = tablero[i].velocidadAtaque;
                copia.energy = tablero[i].energy || 0; copia.energyGauge = tablero[i].energyGauge || 70;
                copia.damageDealt = 0; copia.damageTaken = 0; copia.healingDone = 0; copia.damageBlocked = 0;
                copia.objetos = tablero[i].objetos ? [...tablero[i].objetos] : [];
                copia.equipo = 'player'; copia.muerto = false; copia.metronomoBonus = 1; copia.energiaLista = false;
                copia.actualizarStats();
                copia.esZacian = tablero[i].esZacian || false;
                copia._indiceActual = i;
                equipoCompletoJugador.push(copia);
            }
        }
        equipoCompletoEnemigo = [];
        for (let i = 0; i < enemyBoard.length; i++) {
            if (enemyBoard[i]) {
                let copia = new Unidad(enemyBoard[i].pokemon, enemyBoard[i].nivel, enemyBoard[i].baseId, enemyBoard[i].costeOriginal);
                copia.hp = enemyBoard[i].hp; copia.maxHp = enemyBoard[i].maxHp;
                copia.ataque = enemyBoard[i].ataque; copia.ataqueEspecial = enemyBoard[i].ataqueEspecial;
                copia.defensa = enemyBoard[i].defensa; copia.defensaEspecial = enemyBoard[i].defensaEspecial;
                copia.velocidadAtaque = enemyBoard[i].velocidadAtaque;
                copia.energy = enemyBoard[i].energy || 0; copia.energyGauge = enemyBoard[i].energyGauge || 70;
                copia.damageDealt = 0; copia.damageTaken = 0; copia.healingDone = 0; copia.damageBlocked = 0;
                copia.objetos = enemyBoard[i].objetos ? [...enemyBoard[i].objetos] : [];
                copia.equipo = 'enemy'; copia.muerto = false; copia.metronomoBonus = 1; copia.energiaLista = false;
                copia.actualizarStats();
                copia.esZacian = enemyBoard[i].esZacian || false;
                copia._indiceActual = i;
                equipoCompletoEnemigo.push(copia);
            }
        }

        // ==== Clones de combate ====
        let jugadores = [], jugadoresIndices = [], rivales = [], rivalesIndices = [];
        window.jugadores = jugadores; window.rivales = rivales;
        window.jugadoresIndices = jugadoresIndices; window.rivalesIndices = rivalesIndices;

        for (let i = 0; i < tablero.length; i++) {
            if (!tablero[i] || tablero[i].esArticuno) continue;
            let n = tablero[i].clonarParaCombate();
            if (n.objetos && n.objetos.includes("Cuchara Peculiar") && n.reduceSpDefense === 0) {
                n.reduceSpDefense = 0.45; n.duracionReduccion = 3;
            }
            if (n.objetos && n.objetos.includes("Roca del Rey") && n.reduceDefense === 0) {
                n.reduceDefense = 0.45; n.duracionReduccion = 3;
            }
            n.damageDealt = 0; n.damageTaken = 0; n.healingDone = 0; n.damageBlocked = 0;
            n.muerto = false; n.equipo = 'player'; n.metronomoBonus = 1; n.energiaLista = false;
            n.energy = n.pokemon.startingEnergy || 0; n.critGuaranteed = false;
            n._regenAccumulator = 0; n.regenTimer = 0; n._deathLogged = false; n._reviviendo = false; n._regenLogged = false;
            n.ultiCarga = 0; n.ultiLista = false; n._ultiAvisada = false;
            n._ultiCargadaAntesDelAtaque = false; n._cooldownAtaque = 0; n._ultiDeInicioLanzada = false;
            n._hojaAfiladaIntervalId = null; n._hojaAfiladaActiva = false; n._hojaAfiladaFin = 0;
            n._iconoEscudoRotoFin = 0; n._iconoEscudoRotoTipo = null;
            n._iconoEscudoRotoIntervalId = null;
            const coords = coordsDesdeIndice(i, 'player');
            n._indiceActual = i; n._indiceTablero = 'player';
            n._filaGlobal = coords._filaGlobal; n._colGlobal = coords._colGlobal;
            n.enlaceDolor = null; n.taunt = null; n.inmuneObjetivo = false;
            n.esquirlasHielo = 0; n._golpeDoble = false; n.bolasLlamaEmbrujada = 0;
            n.spriteIdAlternativo = null; n.poisonStacks = [];
            n.escudoTimer = 0; n.escudoActivo = false;
            n.golpesAcumulados = 0; n.cargaActiva = false; n.reduccionTimer = 0; n.metronomoStacks = 0;
            n.iraActiva = false; n.iraAliadosCaidos = 0;
            n.comboContador = 0; n.comboActivo = false; n.comboTimer = 0; n.comboVsEscudoActivo = false;
            n.reflejoTimer = 0; n.invulnerableActivo = false; n.invulnerableUsado = false;
            n.debilidadStacks = 0; n.debilidadTimer = 0; n.focusActivo = false;
            n._maxHpOriginalEnlace = null; n._escudosTemporales = []; n._ultimoAtaque = 0;
            n.actualizarStats();
            jugadores.push(n); jugadoresIndices.push(i);
        }

        for (let i = 0; i < enemyBoard.length; i++) {
            if (!enemyBoard[i]) continue;
            let n = enemyBoard[i].clonarParaCombate();
            if (n.objetos && n.objetos.includes("Cuchara Peculiar") && n.reduceSpDefense === 0) {
                n.reduceSpDefense = 0.45; n.duracionReduccion = 3;
            }
            if (n.objetos && n.objetos.includes("Roca del Rey") && n.reduceDefense === 0) {
                n.reduceDefense = 0.45; n.duracionReduccion = 3;
            }
            n.damageDealt = 0; n.damageTaken = 0; n.healingDone = 0; n.damageBlocked = 0;
            n.muerto = false; n.equipo = 'enemy'; n.metronomoBonus = 1; n.energiaLista = false;
            n.energy = n.pokemon.startingEnergy || 0; n.critGuaranteed = false;
            n._regenAccumulator = 0; n.regenTimer = 0; n._deathLogged = false; n._reviviendo = false; n._regenLogged = false;
            n.ultiCarga = 0; n.ultiLista = false; n._ultiAvisada = false;
            n._ultiCargadaAntesDelAtaque = false; n._cooldownAtaque = 0; n._ultiDeInicioLanzada = false;
            n._hojaAfiladaIntervalId = null; n._hojaAfiladaActiva = false; n._hojaAfiladaFin = 0;
            n._iconoEscudoRotoFin = 0; n._iconoEscudoRotoTipo = null;
            n._iconoEscudoRotoIntervalId = null;
            const coords = coordsDesdeIndice(i, 'enemy');
            n._indiceActual = i; n._indiceTablero = 'enemy';
            n._filaGlobal = coords._filaGlobal; n._colGlobal = coords._colGlobal;
            n.enlaceDolor = null; n.taunt = null; n.inmuneObjetivo = false;
            n.esquirlasHielo = 0; n._golpeDoble = false; n.bolasLlamaEmbrujada = 0;
            n.spriteIdAlternativo = null; n.poisonStacks = [];
            n.escudoTimer = 0; n.escudoActivo = false;
            n.golpesAcumulados = 0; n.cargaActiva = false; n.reduccionTimer = 0; n.metronomoStacks = 0;
            n.iraActiva = false; n.iraAliadosCaidos = 0;
            n.comboContador = 0; n.comboActivo = false; n.comboTimer = 0; n.comboVsEscudoActivo = false;
            n.reflejoTimer = 0; n.invulnerableActivo = false; n.invulnerableUsado = false;
            n.debilidadStacks = 0; n.debilidadTimer = 0; n.focusActivo = false;
            n._maxHpOriginalEnlace = null; n._escudosTemporales = []; n._ultimoAtaque = 0;
            n.actualizarStats();
            rivales.push(n); rivalesIndices.push(i);
        }

        window.jugadores = jugadores; window.rivales = rivales;
        window.jugadoresIndices = jugadoresIndices; window.rivalesIndices = rivalesIndices;

        for (let j of jugadores) {
            if (j.movimientoInicial && j.energy < j.energyGauge) {
                j.energy = j.energyGauge; j.movimientoInicial = false;
                addConsoleMessage(`🦞 ${j.pokemon.nombre} usa movimiento al inicio (Garra Rápida)`, 'battle');
            }
        }
        for (let r of rivales) {
            if (r.movimientoInicial && r.energy < r.energyGauge) { r.energy = r.energyGauge; r.movimientoInicial = false; }
        }
        jugadores.forEach(j => { if (j.tieneDiscoUlti) _dispararUltisDeInicio(j, jugadores, rivales); });
        rivales.forEach(r => { if (r.tieneDiscoUlti) _dispararUltisDeInicio(r, rivales, jugadores); });

        if (typeof iniciarTimerArticuno === 'function') iniciarTimerArticuno();

        actualizarStatsEnVivo(jugadores, rivales);

        let tickCounter = 0;
        const MAX_TICKS = COMBAT_CONFIG.MAX_TICKS;
        const TICK_INTERVAL_BASE = COMBAT_CONFIG.TICK_INTERVAL;
        let duracion = 0;
        let ghostTimers = {};
        let windTimers = {};
        const tiempoInicioCombate = performance.now();
        const TIEMPO_OVERTIME = 29;
        const MULTIPLICADOR_OVERTIME = 3;
        const contadorHeader = document.getElementById('combateTimerHeader');
        const contadorHeaderValor = document.getElementById('combateTimerValor');
        if (contadorHeader) { contadorHeader.style.display = 'inline-flex'; contadorHeader.classList.remove('overtime'); }
        if (contadorHeaderValor) contadorHeaderValor.textContent = '0s';
        window._overtimeAnunciado = false;
        addConsoleMessage(`⚔️ ¡El combate comienza! (máx 90s)`, 'battle');

        // 🆕 FIX: contador de segundos independiente del bucle de combate.
        // El bucle usa setTimeout (que el navegador puede retrasar con lag/GC),
        // así que si el contador dependía solo de él se congelaba y luego saltaba.
        const _combatTimerInterval = setInterval(() => {
            const t = (performance.now() - tiempoInicioCombate) / 1000;
            const v = document.getElementById('combateTimerValor');
            if (v) v.textContent = Math.floor(t) + 's';
            const h = document.getElementById('combateTimerHeader');
            if (h) { if (t >= TIEMPO_OVERTIME) h.classList.add('overtime'); else h.classList.remove('overtime'); }
        }, 250);

        while (jugadores.length > 0 && rivales.length > 0 && tickCounter < MAX_TICKS) {
            const tiempoTranscurrido = (performance.now() - tiempoInicioCombate) / 1000;
            if (contadorHeaderValor) contadorHeaderValor.textContent = Math.floor(tiempoTranscurrido) + 's';
            const enOvertime = (tiempoTranscurrido >= TIEMPO_OVERTIME);
            if (contadorHeader) { if (enOvertime) contadorHeader.classList.add('overtime'); else contadorHeader.classList.remove('overtime'); }
            if (enOvertime && !window._overtimeAnunciado) {
                window._overtimeAnunciado = true;
                addConsoleMessage(`⏰ ¡OVERTIME! El combate se acelera x3`, 'battle');
            }
            const multiplicadorOvertime = enOvertime ? MULTIPLICADOR_OVERTIME : 1;
            const TICK_INTERVAL = TICK_INTERVAL_BASE / multiplicadorOvertime;
            const ATTACK_DELAY_ACTUAL = COMBAT_CONFIG.ATTACK_DELAY / multiplicadorOvertime;
            const MOVEMENT_DELAY_ACTUAL = COMBAT_CONFIG.MOVEMENT_DELAY / multiplicadorOvertime;
            tickCounter++;
            duracion += TICK_INTERVAL;

            // --- Escudos, regen, veneno, debilidad ---
            for (let j of jugadores) {
                if (j.hp <= 0 || j.muerto) continue;
                if (j.escudoPorcentaje > 0) {
                    j.escudoTimer += TICK_INTERVAL;
                    if (j.escudoTimer >= j.escudoIntervalo) {
                        j.escudoTimer = 0;
                        let escudo = Math.floor(j.maxHp * j.escudoPorcentaje);
                        j.escudoActual += escudo; j.escudoActivo = true;
                        setTimeout(() => { j.escudoActual = Math.max(0, j.escudoActual - escudo); j.escudoActivo = false; }, j.escudoDuracion * 1000);
                    }
                }
                procesarRegeneracion(j, TICK_INTERVAL);
                if (j.debilidadStack > 0 && j.debilidadStacks > 0) {
                    j.debilidadTimer += TICK_INTERVAL;
                    if (j.debilidadTimer >= j.debilidadDuracion) { j.debilidadStacks = Math.max(0, j.debilidadStacks - 1); j.debilidadTimer = 0; }
                }
                if (j.poisonStacks && j.poisonStacks.length > 0) procesarVeneno(j, TICK_INTERVAL);
            }
            for (let r of rivales) {
                if (r.hp <= 0 || r.muerto) continue;
                if (r.escudoPorcentaje > 0) {
                    r.escudoTimer += TICK_INTERVAL;
                    if (r.escudoTimer >= r.escudoIntervalo) {
                        r.escudoTimer = 0;
                        let escudo = Math.floor(r.maxHp * r.escudoPorcentaje);
                        r.escudoActual += escudo; r.escudoActivo = true;
                        setTimeout(() => { r.escudoActual = Math.max(0, r.escudoActual - escudo); r.escudoActivo = false; }, r.escudoDuracion * 1000);
                    }
                }
                procesarRegeneracion(r, TICK_INTERVAL);
                if (r.debilidadStack > 0 && r.debilidadStacks > 0) {
                    r.debilidadTimer += TICK_INTERVAL;
                    if (r.debilidadTimer >= r.debilidadDuracion) { r.debilidadStacks = Math.max(0, r.debilidadStacks - 1); r.debilidadTimer = 0; }
                }
                if (r.poisonStacks && r.poisonStacks.length > 0) procesarVeneno(r, TICK_INTERVAL);
            }

            // --- Taunts ---
            for (let j of jugadores) {
                if (j && j.taunt) {
                    j.taunt.timer += TICK_INTERVAL;
                    if (j.taunt.timer >= j.taunt.duracion || !j.taunt.atacante || j.taunt.atacante.hp <= 0 || j.taunt.atacante.muerto) j.taunt = null;
                }
            }
            for (let r of rivales) {
                if (r && r.taunt) {
                    r.taunt.timer += TICK_INTERVAL;
                    if (r.taunt.timer >= r.taunt.duracion || !r.taunt.atacante || r.taunt.atacante.hp <= 0 || r.taunt.atacante.muerto) r.taunt = null;
                }
            }

            // --- Fantasma ---
            for (let j of jugadores) {
                if (j && j.hp > 0 && !j.muerto && j.pokemon.tipos && j.pokemon.tipos.includes("Fantasma") && !j.ghostState && !j.ghostPermanent) {
                    const key = j.pokemon.id + '_' + jugadoresIndices[jugadores.indexOf(j)];
                    if (!ghostTimers[key]) ghostTimers[key] = 0;
                    ghostTimers[key] += TICK_INTERVAL;
                    if (ghostTimers[key] >= j.ghostActivationTime) { j.entrarGhost(); ghostTimers[key] = 0; }
                }
                if (j && j.hp > 0 && !j.muerto && j.pokemon.tipos && j.pokemon.tipos.includes("Fantasma") && j.ghostPermanent && !j.ghostState) {
                    j.entrarGhost();
                }
            }
            for (let r of rivales) {
                if (r && r.hp > 0 && !r.muerto && r.pokemon.tipos && r.pokemon.tipos.includes("Fantasma") && !r.ghostState && !r.ghostPermanent) {
                    const key = r.pokemon.id + '_' + rivalesIndices[rivales.indexOf(r)];
                    if (!ghostTimers[key]) ghostTimers[key] = 0;
                    ghostTimers[key] += TICK_INTERVAL;
                    if (ghostTimers[key] >= r.ghostActivationTime) { r.entrarGhost(); ghostTimers[key] = 0; }
                }
                if (r && r.hp > 0 && !r.muerto && r.pokemon.tipos && r.pokemon.tipos.includes("Fantasma") && r.ghostPermanent && !r.ghostState) {
                    r.entrarGhost();
                }
            }

            // --- Volador ---
            for (let j of jugadores) {
                if (j && j.hp > 0 && !j.muerto && j.isVolador) {
                    const sinergia = getSinergiasActivas().types["Volador"];
                    if (sinergia) {
                        const bonus = sinergia.bonus;
                        const key = j.pokemon.id + '_volador';
                        if (!windTimers[key]) windTimers[key] = { barrier: 0, gust: 0 };
                        if (bonus.windBarrier) {
                            windTimers[key].barrier += TICK_INTERVAL;
                            if (windTimers[key].barrier >= bonus.windBarrierInterval) {
                                j.windBarrierActive = true;
                                j.bonusDamageReduction *= (1 - bonus.windBarrierReduction);
                                j.actualizarStats();
                                setTimeout(() => { j.windBarrierActive = false; j.bonusDamageReduction /= (1 - bonus.windBarrierReduction); j.actualizarStats(); }, bonus.windBarrierDuration * 1000);
                                windTimers[key].barrier = 0;
                            }
                        }
                        if (bonus.windGust) {
                            windTimers[key].gust += TICK_INTERVAL;
                            if (windTimers[key].gust >= bonus.windGustInterval) {
                                j.windGustActive = true;
                                j.bonusAttackSpeed *= (1 + bonus.windGustSpeed);
                                j.actualizarStats();
                                setTimeout(() => { j.windGustActive = false; j.bonusAttackSpeed /= (1 + bonus.windGustSpeed); j.actualizarStats(); }, bonus.windGustDuration * 1000);
                                windTimers[key].gust = 0;
                            }
                        }
                    }
                }
            }
            for (let r of rivales) {
                if (r && r.hp > 0 && !r.muerto && r.isVolador) {
                    const sinergia = getSinergiasActivasEnemigo().types["Volador"];
                    if (sinergia) {
                        const bonus = sinergia.bonus;
                        const key = r.pokemon.id + '_volador_enemy';
                        if (!windTimers[key]) windTimers[key] = { barrier: 0, gust: 0 };
                        if (bonus.windBarrier) {
                            windTimers[key].barrier += TICK_INTERVAL;
                            if (windTimers[key].barrier >= bonus.windBarrierInterval) {
                                r.windBarrierActive = true;
                                r.bonusDamageReduction *= (1 - bonus.windBarrierReduction);
                                r.actualizarStats();
                                setTimeout(() => { r.windBarrierActive = false; r.bonusDamageReduction /= (1 - bonus.windBarrierReduction); r.actualizarStats(); }, bonus.windBarrierDuration * 1000);
                                windTimers[key].barrier = 0;
                            }
                        }
                        if (bonus.windGust) {
                            windTimers[key].gust += TICK_INTERVAL;
                            if (windTimers[key].gust >= bonus.windGustInterval) {
                                r.windGustActive = true;
                                r.bonusAttackSpeed *= (1 + bonus.windGustSpeed);
                                r.actualizarStats();
                                setTimeout(() => { r.windGustActive = false; r.bonusAttackSpeed /= (1 + bonus.windGustSpeed); r.actualizarStats(); }, bonus.windGustDuration * 1000);
                                windTimers[key].gust = 0;
                            }
                        }
                    }
                }
            }

            // --- Articuno ---
            if (articunoUnidad && articunoVisible && !articunoActivado) actualizarArticunoTimer();
            if (window.articunoEnemigoUnidad && !window.articunoEnemigoActivado) {
                window.articunoEnemigoTimer = (window.articunoEnemigoTimer || 0) + TICK_INTERVAL;
                if (window.articunoEnemigoTimer >= 10) {
                    window.articunoEnemigoActivado = true;
                    addConsoleMessage(`❄️ ¡ARTICUNO ENEMIGO usa VENTISCA!`, 'battle');
                    for (let jugador of jugadores) {
                        if (jugador && jugador.hp > 0 && !jugador.muerto) {
                            let damage = Math.floor(jugador.maxHp * 0.25) + Math.floor(jugador.hp * 0.08);
                            jugador.hp = Math.max(0, jugador.hp - damage);
                            jugador.damageTaken += damage;
                            actualizarCopiaEstadisticas(jugador, 'damageTaken', damage);
                            jugador.frozen = true; jugador.frozenRealInicio = performance.now();
                            jugador.frozenDuracion = 3; jugador.frozenTimer = 3;
                            let pos = obtenerPosicionUnidadActual(jugador);
                            mostrarEfectoImpacto(pos.x, pos.y, false, true);
                            mostrarNumeroDaño(pos.x, pos.y, damage, false);
                            if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, jugador.hp, jugador.maxHp, damage, jugador);
                        }
                    }
                    window.articunoEnemigoUnidad = null;
                }
            }

            // --- Movimiento ---
            let huboMovimiento = false;
            for (let j of jugadores) {
                if (j.hp <= 0 || j.muerto) continue;
                if (j._knockbackUntil && j._knockbackUntil > performance.now()) continue;
                let objetivoMovimiento = null;
                if (j.taunt && j.taunt.atacante && j.taunt.atacante.hp > 0 && !j.taunt.atacante.muerto) objetivoMovimiento = j.taunt.atacante;
                const listaObjetivos = objetivoMovimiento ? [objetivoMovimiento] : rivales;
                if (esPokemonMelee(j)) { if (moverMeleeHaciaEnemigo(j, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
                else { if (moverRangedHaciaEnemigo(j, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
            }
            for (let r of rivales) {
                if (r.hp <= 0 || r.muerto) continue;
                if (r._knockbackUntil && r._knockbackUntil > performance.now()) continue;
                let objetivoMovimiento = null;
                if (r.taunt && r.taunt.atacante && r.taunt.atacante.hp > 0 && !r.taunt.atacante.muerto) objetivoMovimiento = r.taunt.atacante;
                const listaObjetivos = objetivoMovimiento ? [objetivoMovimiento] : jugadores;
                if (esPokemonMelee(r)) { if (moverMeleeHaciaEnemigo(r, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
                else { if (moverRangedHaciaEnemigo(r, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
            }
            if (huboMovimiento) {
                renderizarCombate();
                await new Promise(r => setTimeout(r, MOVEMENT_DELAY_ACTUAL));
            }

            // --- Ataques ---
            let todos = [];
            for (let j of jugadores) {
                if (j && j.hp > 0 && !j.muerto) {
                    if (j.frozen) {
                        if (j.frozenRealInicio === undefined || j.frozenRealInicio === null) { j.frozenRealInicio = performance.now(); j.frozenDuracion = j.frozenDuracion || 3; }
                        const transcurridoFrozen = (performance.now() - j.frozenRealInicio) / 1000;
                        if (transcurridoFrozen >= j.frozenDuracion) { j.frozen = false; j.frozenRealInicio = null; j.frozenTimer = 0; }
                        else continue;
                    }
                    todos.push({ unidad: j, lado: 'player', vel: j.velocidadAtaque });
                }
            }
            for (let r of rivales) {
                if (r && r.hp > 0 && !r.muerto) {
                    if (r.frozen) {
                        if (r.frozenRealInicio === undefined || r.frozenRealInicio === null) { r.frozenRealInicio = performance.now(); r.frozenDuracion = r.frozenDuracion || 3; }
                        const transcurridoFrozen = (performance.now() - r.frozenRealInicio) / 1000;
                        if (transcurridoFrozen >= r.frozenDuracion) { r.frozen = false; r.frozenRealInicio = null; r.frozenTimer = 0; }
                        else continue;
                    }
                    todos.push({ unidad: r, lado: 'enemy', vel: r.velocidadAtaque });
                }
            }
            todos.sort((a, b) => (b.vel * 0.6) - (a.vel * 0.6));

            for (let at of todos) {
                if (at.unidad.hp <= 0 || at.unidad.muerto) continue;
                const ahora = performance.now();
                if (typeof at.unidad._ultimoAtaque === 'undefined') at.unidad._ultimoAtaque = 0;
                const velEfectiva = Math.min((at.unidad.velocidadAtaque || 0.7) * multiplicadorOvertime, 5.0);
                const cooldownMs = 1000 / Math.max(0.1, velEfectiva);
                const tiempoDesdeUltimoAtaque = ahora - at.unidad._ultimoAtaque;
                if (tiempoDesdeUltimoAtaque < cooldownMs) continue;
                at.unidad._ultiCargadaAntesDelAtaque = at.unidad.ultiLista || false;

                let objetivos = at.lado === 'player' ? rivales : jugadores;
                let vivos = objetivos.filter(o => o.hp > 0 && !o.muerto);
                if (vivos.length === 0) break;

                const esMelee = esPokemonMelee(at.unidad);
                const rangoAtacante = esMelee ? 1 : obtenerRangoAtaque(at.unidad);
                if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(at.unidad);

                let enRangoDeAtaque = vivos.filter(o => distanciaEnRango(at.unidad, o, rangoAtacante));
                if (at.unidad.taunt && at.unidad.taunt.atacante) {
                    const taunter = at.unidad.taunt.atacante;
                    if (taunter && taunter.hp > 0 && !taunter.muerto) {
                        enRangoDeAtaque = enRangoDeAtaque.includes(taunter) ? [taunter] : [];
                    }
                }
                if (enRangoDeAtaque.length === 0) continue;
                objetivos = enRangoDeAtaque;
                vivos = enRangoDeAtaque;

                let targetInfo = seleccionarObjetivoPrioridad(at.unidad, 0, objetivos, esMelee);
                let target = null;
                if (targetInfo) target = targetInfo.unidad;
                if (!target || objetivos.indexOf(target) === -1) target = vivos[Math.floor(Math.random() * vivos.length)];
                if (!target) continue;

                let pos = obtenerPosicionUnidadActual(target);
                let velocidadAtaqueOriginal = at.unidad.velocidadAtaque;
                if (at.unidad.velocidadVsEscudo > 0 && target.escudoActual > 0) {
                    at.unidad.velocidadAtaque *= (1 + at.unidad.velocidadVsEscudo);
                    if (!at.unidad.comboVsEscudoActivo) at.unidad.comboVsEscudoActivo = true;
                }

                let crit = at.unidad.critGuaranteed || (Math.random() < (at.unidad.pokemon.critRate || 0.25));
                if (crit && typeof playSonidoCritico === 'function') playSonidoCritico();

                let daño;
                let usarEspecial = at.unidad.ataqueEspecial > at.unidad.ataque;
                if (at.unidad.ultiTragamisilActiva) usarEspecial = true;
                let multiplicadorCrit = crit ? 1.5 : 1;
                // ⚠️ NO volver a multiplicar por bonusAttack: `at.unidad.ataque`
                // y `ataqueEspecial` ya incluyen bonusAttack/bonusSpAttack y
                // bonusDamage (Unidad.actualizarStats).
                let dañoExtraMaxHp = 0;
                let indiceMovimientoActivo = (at.unidad.movimientoActivo === 'secundario' && at.unidad.movSecundarioDesbloqueado) ? 1 : 0;

                if (at.unidad.objetos && at.unidad.objetos.includes("Metrónomo") && !usarEspecial) {
                    metronomoGlobalStacks = Math.min(metronomoGlobalStacks + 1, METRONOMO_MAXIMO);
                    let bonus = metronomoGlobalStacks * METRONOMO_BONUS_POR_ATAQUE;
                    let aliados = at.lado === 'player' ? jugadores : rivales;
                    for (let aliado of aliados) {
                        if (aliado && aliado.hp > 0 && !aliado.muerto) {
                            aliado.metronomoBonus = 1 + bonus;
                            aliado.bonusMoveDamage = (aliado.bonusMoveDamage || 1) * aliado.metronomoBonus;
                            aliado.actualizarStats();
                        }
                    }
                }
                if (at.unidad.metronomoBonus > 1) {
                    at.unidad.bonusMoveDamage = (at.unidad.bonusMoveDamage || 1) * at.unidad.metronomoBonus;
                    at.unidad.actualizarStats();
                }

                if (at.unidad.dañoPorcentajeMaxHP > 0 && !usarEspecial) dañoExtraMaxHp = Math.floor(at.unidad.maxHp * at.unidad.dañoPorcentajeMaxHP);
                if (at.unidad.dañoPorcentajeMaxHPObjetivo > 0 && !usarEspecial) dañoExtraMaxHp += Math.floor(target.maxHp * at.unidad.dañoPorcentajeMaxHPObjetivo);
                if (at.unidad.moveMaxHpDamage > 0 && usarEspecial) dañoExtraMaxHp = Math.floor(at.unidad.maxHp * at.unidad.moveMaxHpDamage);

                if (at.unidad.cargaGolpes > 0) {
                    at.unidad.golpesAcumulados++;
                    if (at.unidad.golpesAcumulados >= at.unidad.cargaGolpes) {
                        at.unidad.cargaActiva = true;
                        at.unidad.bonusDamage *= (1 + at.unidad.cargaDaño);
                        at.unidad.actualizarStats();
                        at.unidad.golpesAcumulados = 0;
                        setTimeout(() => { at.unidad.cargaActiva = false; at.unidad.bonusDamage /= (1 + at.unidad.cargaDaño); at.unidad.actualizarStats(); }, 3000);
                    }
                }
                if (at.unidad.comboAtaques > 0) {
                    at.unidad.comboContador++;
                    if (at.unidad.comboContador >= at.unidad.comboAtaques && !at.unidad.comboActivo) {
                        at.unidad.comboActivo = true;
                        at.unidad.bonusAttackSpeed *= (1 + at.unidad.comboVelocidad);
                        at.unidad.actualizarStats();
                        at.unidad.comboContador = 0;
                        setTimeout(() => { at.unidad.comboActivo = false; at.unidad.bonusAttackSpeed /= (1 + at.unidad.comboVelocidad); at.unidad.actualizarStats(); }, at.unidad.comboDuracion * 1000);
                    }
                }
                // 🆕 FIX: "Seguro Debilidad" es un objeto DEFENSIVO (reduce el daño
                // recibido y acumula stacks al ser golpeado, ver Unidad.recibirDaño).
                // Antes se mutaba bonusDamage del atacante en cada básico y nunca se
                // revertía, multiplicando su daño de forma exponencial. Eliminado.

                if (usarEspecial) {
                    let baseDamage = (at.unidad.ataqueEspecial * multiplicadorCrit) + dañoExtraMaxHp;
                    let reduccion = target.defensaEspecial / (target.defensaEspecial + (window.DEFENSA_K || 100));
                    daño = Math.max(1, Math.floor(baseDamage * (1 - reduccion)));
                    if (at.unidad.pokemon.tipos && at.unidad.pokemon.tipos.includes("Psíquico")) {
                        const sinergiaPsiquica = getSinergiasActivas().types["Psíquico"];
                        if (sinergiaPsiquica && sinergiaPsiquica.bonus.moveDamageStack) {
                            at.unidad.moveDamageStacks = Math.min(at.unidad.moveDamageStacks + 1, 10);
                            const bonus = at.unidad.moveDamageStacks * sinergiaPsiquica.bonus.moveDamageStack;
                            at.unidad.bonusMoveDamage = 1 + bonus;
                            at.unidad.actualizarStats();
                        }
                    }
                } else {
                    let baseDamage = (at.unidad.ataque * multiplicadorCrit) + dañoExtraMaxHp;
                    let reduccion = target.defensa / (target.defensa + (window.DEFENSA_K || 100));
                    daño = Math.max(1, Math.floor(baseDamage * (1 - reduccion)));
                }

                const hpAntes = target.hp;
                if (window.DEBUG_COMBATE_LOG) {
                    addConsoleMessage(
                        `⚔️ BÁSICO ${at.unidad.pokemon.nombre} → ${target.pokemon.nombre}: ${daño}` +
                        `${crit ? ' CRIT' : ''}${usarEspecial ? ' ESP' : ''} ` +
                        `(${Math.round(hpAntes)}→${Math.round(Math.max(0, hpAntes - daño))}/${target.maxHp} HP)`,
                        'battle'
                    );
                }

                if (at.unidad.ultiTragamisilActiva) daño = Math.floor(daño * at.unidad.ultiTragamisilDaño);
                at.unidad.velocidadAtaque = velocidadAtaqueOriginal;
                at.unidad.comboVsEscudoActivo = false;
                at.unidad.damageDealt += daño;
                actualizarCopiaEstadisticas(at.unidad, 'damageDealt', daño);

                let origenPos = obtenerPosicionUnidadActual(at.unidad);
                mostrarAnimacionAtaquePokemon(
                    { elemento: origenPos.elemento, unidad: at.unidad },
                    { x: pos.x, y: pos.y, elemento: pos.elemento, unidad: target },
                    daño, crit, at.unidad.areaDamage, usarEspecial, esMelee
                );

                if (at.unidad.ultiTragamisilActiva && origenPos.elemento && pos.elemento && typeof mostrarProyectilBasico === 'function') {
                    try {
                        const rO = origenPos.elemento.getBoundingClientRect();
                        const rD = pos.elemento.getBoundingClientRect();
                        const x1 = rO.left + rO.width / 2, y1 = rO.top + rO.height / 2;
                        const x2 = rD.left + rD.width / 2, y2 = rD.top + rD.height / 2;
                        const dx = x2 - x1, dy = y2 - y1;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const dur = Math.max(200, Math.min(500, dist * 0.6));
                        const proy = document.createElement('div');
                        proy.style.cssText = `position:fixed;left:${x1}px;top:${y1}px;width:32px;height:32px;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);filter:drop-shadow(0 0 10px rgba(34,211,238,0.95)) drop-shadow(0 0 20px rgba(34,211,238,0.6));`;
                        proy.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C 6 8, 8 14, 12 20 C 16 14, 18 8, 12 2 Z" fill="#67e8f9" stroke="#e0f2fe" stroke-width="1"/><circle cx="12" cy="11" r="3" fill="#cffafe" opacity="0.7"/></svg>`;
                        document.body.appendChild(proy);
                        const anim = proy.animate([
                            { transform: 'translate(-50%,-50%) scale(0.3)', opacity: 0 },
                            { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1, offset: 0.15 },
                            { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 1 }
                        ], { duration: dur, easing: 'cubic-bezier(0.3,0,0.7,1)', fill: 'forwards' });
                        anim.onfinish = () => { if (proy.parentNode) proy.remove(); };
                    } catch (e) {}
                } else if (!esMelee && origenPos.elemento && pos.elemento && typeof mostrarProyectilBasico === 'function') {
                    mostrarProyectilBasico(at.unidad, target, origenPos.elemento, pos.elemento);
                }

                if (at.unidad.esZacian && at.unidad.metalClaw && Math.random() < 0.3) {
                    let otrosObjetivos = vivos.filter(o => o !== target);
                    if (otrosObjetivos.length > 0) {
                        let segundoTarget = otrosObjetivos[Math.floor(Math.random() * otrosObjetivos.length)];
                        let posSegundo = obtenerPosicionUnidadActual(segundoTarget);
                        let dañoGarra = Math.floor(daño * 0.6);
                        at.unidad.damageDealt += dañoGarra;
                        actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoGarra);
                        segundoTarget.recibirDaño(dañoGarra, at.unidad);
                        mostrarNumeroDaño(posSegundo.x, posSegundo.y, dañoGarra, false);
                        animarUnidadDaño(posSegundo.elemento);
                        if (posSegundo.elemento) actualizarBarraVidaPokemon(posSegundo.elemento, segundoTarget.hp, segundoTarget.maxHp, dañoGarra, segundoTarget);
                    }
                }

                // ============================================================
                // 🛡️ ROCA DEL REY
                // ============================================================
                if (at.unidad.reduceDefense > 0) {
                    const yaTieneDebuffFisico = target._debuffDefFisica && performance.now() < target._debuffDefFisicaFin;
                    if (!yaTieneDebuffFisico) {
                        const defOriginal = target.defensa;
                        const defReducida = Math.max(0, Math.floor(defOriginal * (1 - at.unidad.reduceDefense)));
                        target._debuffDefFisica = true;
                        target._debuffDefFisicaFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                        target._debuffDefFisicaOriginal = defOriginal;
                        target.defensa = defReducida;
                    } else {
                        target._debuffDefFisicaFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                    }
                    if (typeof mostrarIconoEscudoRoto === 'function') mostrarIconoEscudoRoto(target, at.unidad.duracionReduccion, 'fisica');
                    if (typeof renderizarCombate === 'function') renderizarCombate();
                    if (target._debuffDefFisicaTimerId) clearTimeout(target._debuffDefFisicaTimerId);
                    target._debuffDefFisicaTimerId = setTimeout(() => {
                        if (!target || target.hp <= 0 || target.muerto) return;
                        target.defensa = target._debuffDefFisicaOriginal;
                        target._debuffDefFisica = false;
                        target._debuffDefFisicaFin = 0;
                        target._debuffDefFisicaOriginal = null;
                        target._debuffDefFisicaTimerId = null;
                        target._iconoEscudoRotoFin = 0;
                        target._iconoEscudoRotoTipo = null;
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }, at.unidad.duracionReduccion * 1000);
                }

                // ============================================================
                // 🛡️ CUCHARA PECULIAR
                // ============================================================
                if (at.unidad.reduceSpDefense > 0) {
                    const yaTieneDebuffEsp = target._debuffDefEsp && performance.now() < target._debuffDefEspFin;
                    if (!yaTieneDebuffEsp) {
                        const defEspOriginal = target.defensaEspecial;
                        const defEspReducida = Math.max(0, Math.floor(defEspOriginal * (1 - at.unidad.reduceSpDefense)));
                        target._debuffDefEsp = true;
                        target._debuffDefEspFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                        target._debuffDefEspOriginal = defEspOriginal;
                        target.defensaEspecial = defEspReducida;
                    } else {
                        target._debuffDefEspFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                    }
                    if (typeof mostrarIconoEscudoRoto === 'function') mostrarIconoEscudoRoto(target, at.unidad.duracionReduccion, 'especial');
                    if (typeof renderizarCombate === 'function') renderizarCombate();
                    if (target._debuffDefEspTimerId) clearTimeout(target._debuffDefEspTimerId);
                    target._debuffDefEspTimerId = setTimeout(() => {
                        if (!target || target.hp <= 0 || target.muerto) return;
                        target.defensaEspecial = target._debuffDefEspOriginal;
                        target._debuffDefEsp = false;
                        target._debuffDefEspFin = 0;
                        target._debuffDefEspOriginal = null;
                        target._debuffDefEspTimerId = null;
                        target._iconoEscudoRotoFin = 0;
                        target._iconoEscudoRotoTipo = null;
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }, at.unidad.duracionReduccion * 1000);
                }

                // --- Veneno, maldición, muerte ---
                if (at.unidad.poisonInfinite && at.unidad.pokemon.tipos && at.unidad.pokemon.tipos.includes("Veneno") && target && target.hp > 0 && !target.muerto && !target.inmuneImpedimentos) {
                    const dañoVenenoBase = 20;
                    const duracion = at.unidad.poisonStackable ? 999 : 5;
                    if (!target.poisonStacks) target.poisonStacks = [];
                    target.poisonStacks.push({ daño: dañoVenenoBase, tiempoRestante: duracion, tick: 1 });
                }
                if (at.unidad.maldicionDaño > 0) {
                    target.maldicionObjetivo = at.unidad;
                    let dañoMaldicion = Math.floor(target.maxHp * at.unidad.maldicionDaño);
                    target.hp = Math.max(0, target.hp - dañoMaldicion);
                    target.damageTaken += dañoMaldicion;
                    actualizarCopiaEstadisticas(target, 'damageTaken', dañoMaldicion);
                    let curacionMaldicion = Math.floor(dañoMaldicion * at.unidad.maldicionCuracion);
                    at.unidad.healingDone += curacionMaldicion;
                    actualizarCopiaEstadisticas(at.unidad, 'healingDone', curacionMaldicion);
                    at.unidad.hp = Math.min(at.unidad.maxHp, at.unidad.hp + curacionMaldicion);
                    if (at.unidad.maldicionRadio > 0) {
                        let otros = objetivos.filter(o => o !== target && o.hp > 0 && !o.muerto);
                        for (let otro of otros) {
                            let dañoArea = Math.floor(otro.maxHp * at.unidad.maldicionDaño * 0.5);
                            otro.hp = Math.max(0, otro.hp - dañoArea);
                            otro.damageTaken += dañoArea;
                            actualizarCopiaEstadisticas(otro, 'damageTaken', dañoArea);
                        }
                    }
                }

                let murio = target.recibirDaño(daño, at.unidad);
                if (murio) {
                    target.muerto = true;
                    if (pos.elemento) ocultarUnidadMuerta(pos.elemento);
                    addConsoleMessage(`💀 ${target.pokemon.nombre} MURIÓ (recibió ${Math.round(target.damageTaken)} daño total)`, 'battle');
                }
                if (at.unidad._golpeDoble && !murio) {
                    at.unidad.damageDealt += daño;
                    actualizarCopiaEstadisticas(at.unidad, 'damageDealt', daño);
                    const murioDoble = target.recibirDaño(daño, at.unidad);
                    if (typeof mostrarNumeroDaño === 'function') mostrarNumeroDaño(pos.x, pos.y - 10, daño, crit, target.escudoActual > 0, usarEspecial);
                    animarUnidadDaño(pos.elemento);
                    if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, target.hp, target.maxHp, daño, target);
                    if (murioDoble) { target.muerto = true; if (pos.elemento) ocultarUnidadMuerta(pos.elemento); }
                }
                if (at.unidad.ultiTragamisilActiva && at.unidad.ultiTragamisilRebote && !murio) {
                    const otrosObjetivos = vivos.filter(o => o !== target && o.hp > 0 && !o.muerto);
                    if (otrosObjetivos.length > 0) {
                        let masCercano = null, distMin = Infinity;
                        if (typeof movObtenerPosicionGlobal === 'function') {
                            const posTarget = movObtenerPosicionGlobal(target);
                            for (let otro of otrosObjetivos) {
                                const posOtro = movObtenerPosicionGlobal(otro);
                                if (!posTarget || !posOtro) continue;
                                const d = Math.abs(posTarget.fila - posOtro.fila) + Math.abs(posTarget.col - posOtro.col);
                                if (d < distMin) { distMin = d; masCercano = otro; }
                            }
                        }
                        if (!masCercano) masCercano = otrosObjetivos[0];
                        if (masCercano) {
                            const dañoRebote = Math.floor(daño * 0.5);
                            const posRebote = obtenerPosicionUnidadActual(masCercano);
                            at.unidad.damageDealt += dañoRebote;
                            actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoRebote);
                            masCercano.recibirDaño(dañoRebote, at.unidad);
                            if (typeof mostrarNumeroDaño === 'function') mostrarNumeroDaño(posRebote.x, posRebote.y, dañoRebote, false);
                        }
                    }
                }
                if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, target.hp, target.maxHp, daño, target);

                if (target && target.esZacian) {
                    mostrarEfectoImpacto(pos.x, pos.y, crit, at.unidad.areaDamage);
                    mostrarNumeroDaño(pos.x, pos.y - 20, daño, crit);
                    actualizarBarrasZacian();
                }
                if (at.unidad.esZacian && at.unidad.drainCrown) {
                    let curacion = Math.floor(daño * 0.20);
                    at.unidad.hp = Math.min(at.unidad.maxHp, at.unidad.hp + curacion);
                    at.unidad.healingDone += curacion;
                    actualizarCopiaEstadisticas(at.unidad, 'healingDone', curacion);
                    actualizarBarrasZacian();
                }
                                                if (murio && at.unidad.fearAura) {
                    fearAuraStacks++;
                    window.fearAuraStacks = fearAuraStacks;
                    
                    // 🆕 FIX: log de diagnóstico para verificar que sube
                    if (window.DEBUG_COMBATE) {
                        console.log(`😨 fearAuraStacks++ → ${fearAuraStacks} (${at.unidad.pokemon.nombre} mató a ${target.pokemon.nombre})`);
                    }
                    
                    if (typeof actualizarCartaSinergia === 'function') {
                        setTimeout(() => actualizarCartaSinergia(), 100);
                    }
                }
                if (murio && at.lado === 'player') {
                    for (let aliado of jugadores) {
                        if (aliado !== at.unidad && aliado.iraDaño > 0 && !aliado.iraActiva) {
                            aliado.iraAliadosCaidos++;
                            aliado.iraActiva = true;
                            aliado.bonusDamage *= (1 + aliado.iraDaño);
                            aliado.bonusAttackSpeed *= (1 + aliado.iraVelocidad);
                            aliado.actualizarStats();
                        }
                    }
                }
                if (at.unidad.invulnerablePorcentaje > 0 && !at.unidad.invulnerableUsado && at.unidad.hp / at.unidad.maxHp < at.unidad.invulnerablePorcentaje) {
                    at.unidad.invulnerableActivo = true;
                    at.unidad.invulnerableUsado = true;
                    at.unidad.bonusDamageReduction *= 0.01;
                    at.unidad.actualizarStats();
                    setTimeout(() => { at.unidad.invulnerableActivo = false; at.unidad.bonusDamageReduction /= 0.01; at.unidad.actualizarStats(); }, at.unidad.invulnerableDuracion * 1000);
                }

                // --- Energía / ultis / movimientos ---
                let energiaGanada = 2 + Math.floor(Math.random() * 4);
                if (at.unidad.velocidadAtaque > 0.9) {
                    let bonusVelocidad = Math.floor((at.unidad.velocidadAtaque - 0.9) * 10);
                    energiaGanada += Math.min(bonusVelocidad, 4);
                } else if (at.unidad.velocidadAtaque < 0.6) {
                    energiaGanada = Math.max(1, energiaGanada - 1);
                }
                if (crit) energiaGanada += 3;
                if (at.unidad.extraMoveGauge > 0) energiaGanada += Math.floor(at.unidad.extraMoveGauge / 2);
                if (at.unidad.objetos) {
                    for (let obj of at.unidad.objetos) {
                        if (obj === "Pañuelo Elección") energiaGanada += 4;
                        if (obj === "Colgante Carga") energiaGanada += 2;
                    }
                }
                energiaGanada = Math.min(energiaGanada, 15);
                let nuevaEnergia = at.unidad.energy + energiaGanada;
                let ultiDisparada = false;

                const tieneDiscoReal = at.unidad.objetos && at.unidad.objetos.some(o => {
                    const obj = window.OBJETOS && window.OBJETOS[o];
                    return obj && obj.efecto && obj.efecto.esDiscoUlti;
                });
                const tieneDiscoVirtualZacian = at.unidad.esZacian && at.unidad.behemothBlade === true;
                if (!tieneDiscoReal && !tieneDiscoVirtualZacian && at.unidad.tieneDiscoUlti) {
                    at.unidad.tieneDiscoUlti = false;
                    at.unidad.ultiCarga = 0; at.unidad.ultiLista = false; at.unidad._ultiAvisada = false;
                }
                if (at.unidad.tieneDiscoUlti && at.unidad._ultiCargadaAntesDelAtaque) {
                    const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[at.unidad.pokemon.nombre];
                    if (ultiData) {
                        if (ultiData.esDeInicio && at.unidad._ultiDeInicioLanzada) {
                            at.unidad.ultiCarga = 0; at.unidad.ultiLista = false;
                        } else {
                            const nombreSlug = ultiData.id ? ultiData.id : ultiData.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                                                        const ultiFunc = window.ULTIS_REGISTRO && window.ULTIS_REGISTRO[nombreSlug];
                            if (ultiFunc && typeof ultiFunc.ejecutar === 'function') {
                                try {
                                    const aliadosVivosUlti = (at.lado === 'player' ? jugadores : rivales).filter(u => u && u.hp > 0 && !u.muerto);
                                    const enemigosVivosUlti = (at.lado === 'player' ? rivales : jugadores).filter(u => u && u.hp > 0 && !u.muerto);

                                    // 🆕 GRITO DEL POKÉMON ANTES DE LA ULTI
                                    const spriteIdGrito = at.unidad.spriteIdAlternativo || at.unidad.pokemon.spriteId || at.unidad.pokemon.id;
                                    if (typeof playPokemonCry === 'function' && spriteIdGrito) {
                                        try { playPokemonCry(spriteIdGrito); } catch (e) {}
                                    }

                                    const resultado = ultiFunc.ejecutar(at.unidad, target, { enemigos: enemigosVivosUlti, aliados: aliadosVivosUlti, esJugador: at.lado === 'player' });
                                    if (resultado !== false) {
                                        ultiDisparada = true;
                                        at.unidad.ultiCarga = 0; at.unidad.ultiLista = false; at.unidad._ultiAvisada = false;
                                        addConsoleMessage(`⚡ ¡${at.unidad.pokemon.nombre} usa su ULTIMATE!`, 'battle');
                                    }
                                } catch (e) { console.error('❌ Error ejecutando ulti:', e); }
                            }
                        }
                    }
                }

                const tieneDiscoRealCarga = at.unidad.objetos && at.unidad.objetos.some(o => {
                    const obj = window.OBJETOS && window.OBJETOS[o];
                    return obj && obj.efecto && obj.efecto.esDiscoUlti;
                });
                const tieneDiscoVirtualZacianCarga = at.unidad.esZacian && at.unidad.behemothBlade === true;
                if (!tieneDiscoRealCarga && !tieneDiscoVirtualZacianCarga && at.unidad.tieneDiscoUlti) {
                    at.unidad.tieneDiscoUlti = false; at.unidad.ultiCarga = 0; at.unidad.ultiLista = false; at.unidad._ultiAvisada = false;
                }
                if (at.unidad.tieneDiscoUlti && !ultiDisparada && !at.unidad.ultiLista) {
                    const ultiDataCarga = window.ULTIS_POKEMON && window.ULTIS_POKEMON[at.unidad.pokemon.nombre];
                    const esDeInicioYaLanzada = ultiDataCarga && ultiDataCarga.esDeInicio && at.unidad._ultiDeInicioLanzada;
                    const hojaAfiladaActiva = at.unidad._hojaAfiladaActiva === true;
                    const tyranitarBerserkActivo = at.unidad._tyranitarBerserkActivo === true;
                    if (ultiDataCarga && ultiDataCarga.carga && !esDeInicioYaLanzada && !hojaAfiladaActiva && !tyranitarBerserkActivo) {
                        at.unidad.ultiCarga = Math.min(at.unidad.ultiCarga + 1, ultiDataCarga.carga);
                        if (at.unidad.ultiCarga >= ultiDataCarga.carga) {
                            at.unidad.ultiLista = true;
                            if (!at.unidad._ultiAvisada) { at.unidad._ultiAvisada = true; addConsoleMessage(`⚡ ${at.unidad.pokemon.nombre} tiene su ULTI lista!`, 'battle'); }
                        }
                        const posAtkCarga = obtenerPosicionUnidadActual(at.unidad);
                        if (posAtkCarga && posAtkCarga.elemento) {
                            const ultiFillEl = posAtkCarga.elemento.querySelector('.ulti-fill');
                            if (ultiFillEl) {
                                const pct = Math.min(100, (at.unidad.ultiCarga / ultiDataCarga.carga) * 100);
                                ultiFillEl.style.width = pct + '%';
                                if (at.unidad.ultiLista) {
                                    ultiFillEl.style.background = 'linear-gradient(90deg, #fbbf24, #fde68a, #fbbf24)';
                                    ultiFillEl.style.boxShadow = '0 0 12px rgba(251,191,36,0.9), 0 0 20px rgba(251,191,36,0.5)';
                                    ultiFillEl.style.animation = 'pulseUlti 1s ease-in-out infinite';
                                }
                            }
                        }
                    }
                }

                const silenciado = at.unidad._silenciadoHasta && performance.now() < at.unidad._silenciadoHasta;
                if (nuevaEnergia >= at.unidad.energyGauge && !ultiDisparada && !silenciado) {
                    let movimientoEjecutado = false;
                    if (typeof ejecutarMovimiento === 'function') {
                        try {
                            let indiceMov = 0, saltarMovimiento = false;
                            if (at.unidad.esZacian) {
                                const movZacian = at.unidad.zacianMovimiento || "basico";
                                if (movZacian === "basico") saltarMovimiento = true; else indiceMov = 0;
                            }
                            if (saltarMovimiento) {
                                movimientoEjecutado = true; at.unidad.energy = 0;
                            } else {
                                const aliadosVivos = (at.lado === 'player' ? jugadores : rivales).filter(u => u && u.hp > 0 && !u.muerto);
                                const enemigosVivos = (at.lado === 'player' ? rivales : jugadores).filter(u => u && u.hp > 0 && !u.muerto);
                                let indiceMovFinal = indiceMov;
                                if (indiceMov === 0 && at.unidad.movimientoActivo === 'secundario' && at.unidad.movSecundarioDesbloqueado) indiceMovFinal = indiceMovimientoActivo;
                                movimientoEjecutado = ejecutarMovimiento(at.unidad, target, indiceMovFinal, enemigosVivos, aliadosVivos);
                            }
                        } catch (err) { console.error("❌ Error en ejecutarMovimiento:", err); movimientoEjecutado = false; }
                    }
                    if (!movimientoEjecutado) {
                        let dañoExtra = Math.floor(at.unidad.ataqueEspecial * 0.6);
                        if (at.unidad.objetos) {
                            for (let obj of at.unidad.objetos) { if (obj === "Gafas Especiales") dañoExtra = Math.floor(dañoExtra * 1.4); }
                        }
                        addConsoleMessage(`💥 ${at.unidad.pokemon.nombre} usa MOVIMIENTO ESPECIAL! (+${dañoExtra} daño)`, 'battle');
                        at.unidad.damageDealt += dañoExtra;
                        actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoExtra);
                        mostrarNumeroDaño(pos.x, pos.y - 30, dañoExtra, true, target.escudoActual > 0, true);
                        animarUnidadDaño(pos.elemento);
                        let murioExtra = target.recibirDaño(dañoExtra, at.unidad);
                        if (murioExtra) { target.muerto = true; if (pos.elemento) ocultarUnidadMuerta(pos.elemento); }
                        if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, target.hp, target.maxHp, dañoExtra, target);
                    }
                    if (at.unidad.escudoAllyPorcentaje > 0) {
                        let aliados = at.lado === 'player' ? jugadores : rivales;
                        let aliadoMasDebil = aliados.filter(a => a && a.hp > 0 && !a.muerto && a !== at.unidad).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                        if (aliadoMasDebil) {
                            let escudo = Math.floor(at.unidad.maxHp * at.unidad.escudoAllyPorcentaje);
                            aliadoMasDebil.escudoActual = (aliadoMasDebil.escudoActual || 0) + escudo;
                            let posAliado = obtenerPosicionUnidadActual(aliadoMasDebil);
                            if (posAliado && posAliado.elemento) actualizarBarraVidaPokemon(posAliado.elemento, aliadoMasDebil.hp, aliadoMasDebil.maxHp, 0, aliadoMasDebil);
                        }
                    }
                    at.unidad.energy = 0;
                    at.unidad.energiaLista = false;
                    if (origenPos.elemento) {
                        let energyFill = origenPos.elemento.querySelector('.energy-fill');
                        if (energyFill) {
                            energyFill.classList.remove('full');
                            energyFill.style.transition = 'none';
                            energyFill.style.width = '100%';
                            energyFill.style.boxShadow = '0 0 20px rgba(255,255,255,0.85), 0 0 40px rgba(255,255,255,0.55)';
                            void energyFill.offsetWidth;
                            setTimeout(() => { energyFill.style.transition = 'width 0.35s ease, box-shadow 0.35s ease'; energyFill.style.width = '0%'; energyFill.style.boxShadow = ''; }, 200);
                        }
                    }
                    if (at.unidad.esZacian) actualizarBarrasZacian();
                } else {
                    at.unidad.energy = nuevaEnergia;
                    if (origenPos.elemento) actualizarBarraEnergia(origenPos.elemento, at.unidad.energy, at.unidad.energyGauge);
                    if (at.unidad.esZacian) actualizarBarrasZacian();
                }

                if (at.unidad.lifesteal > 0) {
                    let curacion = Math.floor(daño * at.unidad.lifesteal);
                    at.unidad.hp = Math.min(at.unidad.maxHp, at.unidad.hp + curacion);
                    at.unidad.healingDone += curacion;
                    actualizarCopiaEstadisticas(at.unidad, 'healingDone', curacion);
                    let posAtacante = obtenerPosicionUnidadActual(at.unidad);
                    if (posAtacante.elemento) actualizarBarraVidaPokemon(posAtacante.elemento, at.unidad.hp, at.unidad.maxHp, 0, at.unidad);
                    if (at.unidad.esZacian) actualizarBarrasZacian();
                }
                if (at.unidad.areaDamage) {
                    let otrosObjetivos = vivos.filter(o => o !== target);
                    for (let otro of otrosObjetivos) {
                        let dañoArea = Math.floor(daño * 0.5);
                        at.unidad.damageDealt += dañoArea;
                        actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoArea);
                        let posOtro = obtenerPosicionUnidadActual(otro);
                        mostrarNumeroDaño(posOtro.x, posOtro.y, dañoArea, false, otro.escudoActual > 0, usarEspecial);
                        animarUnidadDaño(posOtro.elemento);
                        let murioOtro = otro.recibirDaño(dañoArea, at.unidad);
                        if (murioOtro) { otro.muerto = true; if (posOtro.elemento) ocultarUnidadMuerta(posOtro.elemento); }
                        if (posOtro.elemento) actualizarBarraVidaPokemon(posOtro.elemento, otro.hp, otro.maxHp, dañoArea, otro);
                    }
                }
                if (at.unidad.isVolador && !at.unidad.whirlwindActive) {
                    const sinergiaVolador = at.lado === 'player' ? getSinergiasActivas().types["Volador"] : getSinergiasActivasEnemigo().types["Volador"];
                    if (sinergiaVolador && sinergiaVolador.bonus.whirlwind) {
                        at.unidad.whirlwindActive = true;
                        let enemigos = at.lado === 'player' ? rivales : jugadores;
                        for (let enemy of enemigos) {
                            if (enemy && enemy.hp > 0 && !enemy.muerto) {
                                let damage = Math.floor(enemy.maxHp * 0.10);
                                at.unidad.damageDealt += damage;
                                actualizarCopiaEstadisticas(at.unidad, 'damageDealt', damage);
                                enemy.hp = Math.max(0, enemy.hp - damage);
                                enemy.damageTaken += damage;
                                actualizarCopiaEstadisticas(enemy, 'damageTaken', damage);
                                enemy.bonusAttackSpeed *= 0.60;
                                enemy.actualizarStats();
                                let posEnemy = obtenerPosicionUnidadActual(enemy);
                                mostrarEfectoImpacto(posEnemy.x, posEnemy.y, false, true);
                                mostrarNumeroDaño(posEnemy.x, posEnemy.y, damage, false);
                                if (enemy.hp <= 0) { enemy.muerto = true; if (posEnemy.elemento) ocultarUnidadMuerta(posEnemy.elemento); }
                                setTimeout(() => { enemy.bonusAttackSpeed /= 0.60; enemy.actualizarStats(); }, 3000);
                            }
                        }
                    }
                }

                at.unidad._ultimoAtaque = performance.now();
                actualizarBarrasZacian();
                // 🆕 Hit-stop: los críticos o golpes muy fuertes hacen una pausa breve
                // para que el impacto "pese" visualmente.
                const hitStopMs = (crit || daño >= 180) ? 45 : 0;
                await new Promise(r => setTimeout(r, (ATTACK_DELAY_ACTUAL * 1000) + hitStopMs));

                let jugadoresVivosCheck = jugadores.filter(j => j.hp > 0 && !j.muerto);
                let rivalesVivosCheck = rivales.filter(r => r.hp > 0 && !r.muerto);
                if (jugadoresVivosCheck.length === 0 || rivalesVivosCheck.length === 0) break;
            }

            // --- Burn ---
            if (tickCounter % 3 === 0) {
                for (let j of jugadores) {
                    if (j.hp > 0 && !j.muerto && j.burnDamage > 0) {
                        let dañoQuemadura = j.aplicarQuemadura(0.03);
                        let posJ = obtenerPosicionUnidadActual(j);
                        mostrarNumeroDaño(posJ.x, posJ.y - 30, dañoQuemadura, false, false, false, posJ.elemento || null);
                        if (posJ.elemento) actualizarBarraVidaPokemon(posJ.elemento, j.hp, j.maxHp, dañoQuemadura, j);
                        if (j.esZacian) actualizarBarrasZacian();
                        if (j.hp <= 0) { j.muerto = true; if (posJ.elemento) ocultarUnidadMuerta(posJ.elemento); }
                    }
                }
                for (let r of rivales) {
                    if (r.hp > 0 && !r.muerto && r.burnDamage > 0) {
                        let dañoQuemadura = r.aplicarQuemadura(0.03);
                        let posR = obtenerPosicionUnidadActual(r);
                        mostrarNumeroDaño(posR.x, posR.y - 30, dañoQuemadura, false, false, false, posR.elemento || null);
                        if (posR.elemento) actualizarBarraVidaPokemon(posR.elemento, r.hp, r.maxHp, dañoQuemadura, r);
                        if (r.hp <= 0) { r.muerto = true; if (posR.elemento) ocultarUnidadMuerta(posR.elemento); }
                    }
                }
            }

            if (tickCounter % COMBAT_CONFIG.STATS_REFRESH_TICKS === 0) actualizarStatsEnVivo(jugadores, rivales);

            for (let j of jugadores) {
                if (j.hp <= 0 && !j._deathLogged) {
                    j._deathLogged = true;
                    if (j.equipo === 'player' && typeof sumarSemillasPorCaido === 'function') sumarSemillasPorCaido(j, 'player');
                    j.ultiCarga = 0; j.ultiLista = false; j._ultiAvisada = false;
                }
            }
            for (let r of rivales) {
                if (r.hp <= 0 && !r._deathLogged) {
                    r._deathLogged = true;
                    if (window.modoDosJugadores && r.equipo === 'enemy' && typeof sumarSemillasPorCaido === 'function') sumarSemillasPorCaido(r, 'enemy');
                    r.ultiCarga = 0; r.ultiLista = false; r._ultiAvisada = false;
                }
            }

            let jugadoresVivos = jugadores.filter(j => j.hp > 0 && !j.muerto);
            let rivalesVivos = rivales.filter(r => r.hp > 0 && !r.muerto);
            if (jugadoresVivos.length === 0 || rivalesVivos.length === 0) {
                break;
            }
            await new Promise(r => setTimeout(r, TICK_INTERVAL * 1000));
        }

                // ==== Fin del combate ====
        const duracionReal = (performance.now() - tiempoInicioCombate) / 1000;
        addConsoleMessage(`⏱️ Combate terminado en ${duracionReal.toFixed(1)}s (tick=${tickCounter})`, 'battle');
        if (typeof ocultarTimerCombate === 'function') ocultarTimerCombate();
        clearInterval(_combatTimerInterval);
        actualizarStatsEnVivo(jugadores, rivales);
        if (window.statsCombateEnVivo) window.statsCombateEnVivo.activo = false;

        // ============================================================
        // 🆕 FIX PvE: detectar si es ronda PvE
        // ============================================================
        // `esPvE` se usa más abajo para:
        //   - aplicar recompensas PvE (aplicarRecompensasPvE)
        //   - saltarse la reducción de HP en PvE
        //   - saltarse mostrarReaccionEnemigo en PvE
        //   - pasar `esPvE` a ejecutarFinDeRonda(victoria, esPvE)
        //
        // Si esta línea falta, salta:
        //   ReferenceError: esPvE is not defined
        // ============================================================
        const esPvE = window.enRondaPvE === true;

        let victoria = false;
        let jugadoresVivosFinal = jugadores.filter(j => j.hp > 0 && !j.muerto);
        let rivalesVivosFinal = rivales.filter(r => r.hp > 0 && !r.muerto);
        if (jugadoresVivosFinal.length > 0 && rivalesVivosFinal.length === 0) {
            victoria = true;
        } else if (jugadoresVivosFinal.length === 0 && rivalesVivosFinal.length > 0) {
            victoria = false;
        } else if (jugadoresVivosFinal.length === 0 && rivalesVivosFinal.length === 0) {
            victoria = false;
        } else if (tickCounter >= MAX_TICKS) {
            victoria = jugadoresVivosFinal.length > rivalesVivosFinal.length;
        } else {
            victoria = jugadoresVivosFinal.length > 0;
        }

        for (let i = 0; i < equipoCompletoJugador.length; i++) {
            let copia = equipoCompletoJugador[i];
            let original = jugadores.find(j => j.pokemon.id === copia.pokemon.id && j.baseId === copia.baseId);
            if (original) {
                copia.damageDealt = original.damageDealt || 0;
                copia.damageTaken = original.damageTaken || 0;
                copia.healingDone = original.healingDone || 0;
                copia.damageBlocked = original.damageBlocked || 0;
                copia.hp = original.hp || 0;
                copia.muerto = original.muerto || false;
            }
        }
        for (let i = 0; i < equipoCompletoEnemigo.length; i++) {
            let copia = equipoCompletoEnemigo[i];
            let original = rivales.find(r => r.pokemon.id === copia.pokemon.id && r.baseId === copia.baseId);
            if (original) {
                copia.damageDealt = original.damageDealt || 0;
                copia.damageTaken = original.damageTaken || 0;
                copia.healingDone = original.healingDone || 0;
                copia.damageBlocked = original.damageBlocked || 0;
                copia.hp = original.hp || 0;
                copia.muerto = original.muerto || false;
            }
        }

                        let interes = getInteres();
        let rachaBonus = getRachaBonus();

        // 🆕 BALANCE TFT: daño base + 1 por unidad viva del ganador
        let daño;
        if (victoria) {
            daño = getDañoRealPorDerrota(jugadoresVivosFinal.length);
        } else {
            daño = getDañoRealPorDerrota(rivalesVivosFinal.length);
        }

        let ganancia = 5 + interes + (victoria ? 1 : 0) + rachaBonus;
        let gananciaReal = ganancia;
        if (fase <= 1) {
            gananciaReal = 0;
            addConsoleMessage(`💰 Ronda 1: sin recompensa de oro (fase de arranque)`, 'info');
        }
        if (victoria && fase > 1) {
            for (let j of jugadores) {
                if (j.monedaExtra > 0 && !j.muerto) {
                    gananciaReal += j.monedaExtra;
                    addConsoleMessage(`💎 ${j.pokemon.nombre} gana ${j.monedaExtra} moneda extra!`, 'buy');
                }
            }
        }
                // 🆕 GUARDAR RESULTADOS PARA EL RANKING
        window._ultimaVictoriaJugador = victoria;
        window._ultimoDanoRecibidoJugador = victoria ? 0 : daño;
        // ---------------------------------------

        oro += gananciaReal;
        if (window.modoDosJugadores && fase > 1) {
            const interesEnemigo = Math.min(3, Math.floor(enemyGold / 10));
            const rachaEnemigoNum = -racha;
            const rachaEnemigo = rachaEnemigoNum >= 5 ? 3 : rachaEnemigoNum >= 3 ? 2 : rachaEnemigoNum >= 2 ? 1 : rachaEnemigoNum <= -4 ? 2 : rachaEnemigoNum <= -2 ? 1 : 0;
            const ingresoEnemigo = 5 + interesEnemigo + (!victoria ? 1 : 0) + rachaEnemigo;
            enemyGold += ingresoEnemigo;
            addConsoleMessage(`👥 Enemigo: +${ingresoEnemigo}💰`, 'enemy');
        }

        // ============================================================
        // 🆕 FIX PvE: si es ronda PvE, delegar todo a pve.js
        // ============================================================
                if (esPvE) {
            // Aplicar recompensas del monstruo (oro, tiendas, HP si pierdes)
            if (typeof aplicarRecompensasPvE === 'function') {
                aplicarRecompensasPvE(fase, victoria);
            }

            // 🆕 FIX BUG 2: Resetear el flag de compra también en PvE.
            // Así al terminar la PvE y entrar en la siguiente ronda PvP,
            // la tienda de objetos (si toca) se abre correctamente.
            objetoCompradoEstaRonda = false;
            enemyObjetoCompradoEstaRonda = false;
            sonidoObjetosReproducido = false;

            // Limpiar el monstruo del tablero
            if (typeof limpiarMonstruoPvE === 'function') {
                limpiarMonstruoPvE();
            }

            // Comprobar game over por HP
            if (vidaJugador <= 0) {
                setTimeout(() => { gameOver(); playDerrotaSound(); }, 500);
                combateFinalizado = true;
                liberarEstadoCombate();
                return;
            }
        }

        if (zacianUnidad) {
            const zacianEnJuego = jugadores.find(j => j && j.esZacian);
            if (zacianEnJuego) {
                zacianUnidad.hp = zacianEnJuego.hp;
                zacianUnidad.energy = zacianEnJuego.energy || 0;
                actualizarBarrasZacian();
            } else {
                zacianUnidad.hp = 0; zacianUnidad.energy = 0; actualizarBarrasZacian();
                for (let i = 0; i < tablero.length; i++) { if (tablero[i] && tablero[i].esZacian) { tablero[i] = null; break; } }
                zacianUnidad = null; zacianNivel = 0;
            }
        }
        if (window.zacianEnemigoUnidad) {
            const zacianEnJuegoEnemigo = rivales.find(r => r && r.esZacian);
            if (zacianEnJuegoEnemigo) {
                window.zacianEnemigoUnidad.hp = zacianEnJuegoEnemigo.hp;
                window.zacianEnemigoUnidad.energy = zacianEnJuegoEnemigo.energy || 0;
            } else {
                window.zacianEnemigoUnidad.hp = 0; window.zacianEnemigoUnidad.energy = 0;
                for (let i = 0; i < enemyBoard.length; i++) { if (enemyBoard[i] && enemyBoard[i].esZacian) { enemyBoard[i] = null; break; } }
                window.zacianEnemigoUnidad = null;
            }
        }

                // ============================================================
        // FIN DE COMBATE - Delegar toda la coreografía al orquestador
        // ============================================================

                registrarEstadisticasCombate(jugadores, rivales, victoria, duracion);

        // 🆕 FIX: guardar el rival que acaba de combatir para que el
        // panel de datos lo muestre en la SIGUIENTE ronda (antes de
        // que empiece el combate nuevo).
        window.rivalAnterior = window.rivalActual
            ? {
                nombre: window.rivalActual.nombre,
                avatar: window.rivalActual.avatar,
                esMonstruo: window.rivalActual.esMonstruo || false
            }
            : null;

        try {
            if (typeof combateAudioActual !== 'undefined' && combateAudioActual) {
                combateAudioActual.pause(); combateAudioActual.currentTime = 0; combateAudioActual = null;
            }
            if (typeof uiAudioCache !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.UI_SOUND_URL) {
                const urlCombate = CONFIG.UI_SOUND_URL + 'combate.mp3';
                if (uiAudioCache[urlCombate]) { uiAudioCache[urlCombate].pause(); uiAudioCache[urlCombate].currentTime = 0; }
            }
        } catch (e) {}

        mostrarResultadoCombate(victoria, gananciaReal, daño, racha, function() {
            debugLogCombate("Overlay de combate cerrado");
        }, _esSandbox);

        if (window.modoDosJugadores) {
            // 👥 En 2P SIEMPRE hay un ganador visible → sonido de victoria.
            playVictoriaSound();
        } else if (victoria) {
            if (enemyHealth > 0) playVictoriaSound();
        } else {
            if (vidaJugador > 0) playDerrotaSound();
        }

        // 🧪 SANDBOX: en modo creativo no se avanza ronda, no se abre la
        // tienda y no se toca el torneo. Se restaura el estado y se deja
        // el mismo tablero para poder repetir el combate.
        if (_esSandbox) {
            await new Promise(r => setTimeout(r, 2200));

            if (_sandboxEstado) {
                vidaJugador = _sandboxEstado.vidaJugador;
                enemyHealth = _sandboxEstado.enemyHealth;
                oro = _sandboxEstado.oro;
                racha = _sandboxEstado.racha;
                victorias = _sandboxEstado.victorias;
                experiencia = _sandboxEstado.experiencia;
                nivelJugador = _sandboxEstado.nivelJugador;
                fase = _sandboxEstado.fase;
                ronda = _sandboxEstado.ronda;
                enemyLevel = _sandboxEstado.enemyLevel;
                enemyGold = _sandboxEstado.enemyGold;
                enemyWinStreak = _sandboxEstado.enemyWinStreak;
                enemyLossStreak = _sandboxEstado.enemyLossStreak;
            }

            window._ultimaVictoriaJugador = undefined;
            window._ultimoDanoRecibidoJugador = 0;
            window._ultimoRivalCombatido = null;

            document.body.classList.remove('celebrando');
            document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = ''; });
            document.querySelectorAll('.salto-victoria').forEach(cell => {
                cell.classList.remove('salto-victoria');
                cell.style.animationDelay = '';
            });

            if (typeof restaurarPosicionesOriginales === 'function') restaurarPosicionesOriginales();
            if (typeof aplicarSinergias === 'function') aplicarSinergias();
            if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
            if (typeof renderizar === 'function') renderizar();
            if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

            window.jugadores = null;
            window.rivales = null;
            window.jugadoresIndices = null;
            window.rivalesIndices = null;

            combateFinalizado = true;
            addConsoleMessage('🧪 Sandbox: combate terminado. Puedes repetirlo con los mismos equipos.', 'info');
            return;
        }

        if (window.rivalActual && window.rivalActual.nombre) {
            window._ultimoRivalCombatido = window.rivalActual.nombre;
        }

        if (!esPvE) {
            if (victoria) {
                enemyWinStreak = 0; enemyLossStreak++;
                racha = racha > 0 ? racha + 1 : 1;
                victorias++;
                enemyHealth = Math.max(0, enemyHealth - daño);
                addConsoleMessage(`🎉 VICTORIA! +${gananciaReal}💰 (${enemyHealth} HP enemigo)`, 'success');

                // 🆕 El resultado del rival se registra abajo, después del
                // if/else de victoria/derrota. Antes el bloque estaba dentro
                // del `if (victoria)` y su rama "el jugador perdió" era
                // inalcanzable: el rival nunca sumaba la victoria.
                                    } else {
                enemyLossStreak = 0; enemyWinStreak++;
                racha = racha < 0 ? racha - 1 : -1;
                vidaJugador = Math.max(0, vidaJugador - daño);
                addConsoleMessage(`💀 DERROTA! -${daño} HP (${vidaJugador} HP restantes)`, 'error');

                // 🆕 FIX: comprobar game over INMEDIATAMENTE tras restar HP
                // (bloque duplicado eliminado: gameOver() se disparaba dos veces)
                if (vidaJugador <= 0) {
                    addConsoleMessage(`💀 ¡GAME OVER! Has sido derrotado en ronda ${fase}`, 'error');
                    setTimeout(() => {
                        if (typeof gameOver === 'function') gameOver();
                    }, 500);
                }

                let expExtra = 0;
                for (let u of tablero) {
                    if (u && !u.esArticuno && u.objetos && u.objetos.includes("Huevo Suerte")) { expExtra = 2; break; }
                }
                if (expExtra > 0) {
                    experiencia += expExtra;
                    addConsoleMessage(`🥚 Huevo Suerte: +${expExtra} EXP extra por derrota!`, 'level');
                    checkSubirNivel();
                }
            }
        }

        // 🆕 FIX TORNEO: registrar el resultado del rival en el torneo.
        // Se hace fuera del if/else para que cuente tanto si ganas como si
        // pierdes. Antes la rama "el jugador perdió" estaba anidada dentro
        // del `if (victoria)` y nunca se ejecutaba.
        if (!esPvE && window.torneoRivales && window.rivalActual) {
            const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
            if (rivalEnTorneo) {
                if (victoria) {
                    rivalEnTorneo.vida = Math.max(0, enemyHealth);
                    if (enemyHealth <= 0) rivalEnTorneo.eliminado = true;
                    rivalEnTorneo.derrotas = (rivalEnTorneo.derrotas || 0) + 1;
                    rivalEnTorneo.racha = (rivalEnTorneo.racha || 0) < 0
                        ? (rivalEnTorneo.racha || 0) - 1
                        : -1;
                } else {
                    rivalEnTorneo.victorias = (rivalEnTorneo.victorias || 0) + 1;
                    rivalEnTorneo.racha = (rivalEnTorneo.racha || 0) > 0
                        ? (rivalEnTorneo.racha || 0) + 1
                        : 1;
                }
            }
        }

        if (!esPvE && typeof mostrarReaccionEnemigo === 'function') {
            mostrarReaccionEnemigo(victoria);
        }

        experiencia += 4;
        let coste = getExpNecesaria();
        while (experiencia >= coste && coste > 0 && nivelJugador < CONFIG.NIVEL_MAXIMO) {
            experiencia -= coste;
            nivelJugador++;
            coste = getExpNecesaria();
            playSonidoSubirNivel();
            addConsoleMessage(`⬆️ ¡NIVEL ${nivelJugador}! 🎉`, 'level');
            if (Number(nivelJugador) === 5 || Number(nivelJugador) === 8) {
                if (typeof darDiscoDefinitivo === 'function') darDiscoDefinitivo();
            }
        }

        // 👥 Modo 2 jugadores: el jugador inactivo (lado enemigo) también
        // gana 4 XP por ronda y sube de nivel de forma equivalente.
        if (window.modoDosJugadores === true) {
            const primInactivo = window.primerTurnoJugador || 1;
            const numInactivo = (primInactivo === 1) ? 2 : 1;
            const nombreInactivo = (numInactivo === 1)
                ? (window.nombreJugador && String(window.nombreJugador).trim() ? window.nombreJugador : 'Jugador 1')
                : (window.nombreJugador2 && String(window.nombreJugador2).trim() ? window.nombreJugador2 : 'Jugador 2');

            enemyExperiencia += 4;
            let costeEnemy = (enemyLevel < CONFIG.NIVEL_MAXIMO) ? CONFIG.COSTES_NIVEL[enemyLevel - 1] : 0;
            while (enemyExperiencia >= costeEnemy && costeEnemy > 0 && enemyLevel < CONFIG.NIVEL_MAXIMO) {
                enemyExperiencia -= costeEnemy;
                enemyLevel++;
                costeEnemy = (enemyLevel < CONFIG.NIVEL_MAXIMO) ? CONFIG.COSTES_NIVEL[enemyLevel - 1] : 0;
                playSonidoSubirNivel();
                addConsoleMessage(`⬆️ ${nombreInactivo} ¡NIVEL ${enemyLevel}! 🎉`, 'level');

                // 💿 Disco Definitivo al llegar a nivel 5 u 8 (igual que el jugador activo)
                if (Number(enemyLevel) === 5 || Number(enemyLevel) === 8) {
                    if (typeof enemyBaulObjetos === 'undefined') enemyBaulObjetos = [];
                    if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) {
                        addConsoleMessage(`⚠️ ¡Baúl de ${nombreInactivo} lleno! El Disco Definitivo no cabe.`, 'error');
                    } else {
                        enemyBaulObjetos.push("Disco Definitivo");
                        addConsoleMessage(`💿 ${nombreInactivo} consiguió un DISCO DEFINITIVO! (Nivel ${enemyLevel})`, 'fusion');
                        if (typeof playSonidoEvolucion === 'function') playSonidoEvolucion();
                    }
                }
            }
        }

        fase++;
ronda = fase;
// 🆕 FIX: NO pintar el header aquí. El número de ronda se actualiza
//         cuando arranca la música de previa (reanudarFondoPreparacion
//         / reanudarMusicaPreparacion → actualizarContadorRondaVisual).
//         Mientras tanto el header sigue mostrando la ronda anterior.
// (nada de faseStatsNumEl aquí)

                // 🆕 FIX: ya no ocultamos el contador de ronda; debe estar siempre visible
        // if (typeof ocultarContadorRonda === 'function') ocultarContadorRonda();

                // 🆕 FIX: siempre resetear al empezar una ronda nueva,
        // no solo si fase > 2. Si no, la IA queda bloqueada para siempre
        // después de la ronda 2.
        if (fase !== 2) window.enemyComproEnRonda2 = false;
        if (!primerCombateRealizado) primerCombateRealizado = true;
        if (!enemyPrimerCombateRealizado) enemyPrimerCombateRealizado = true;

                // 👥 En 2P no hay rondas PvE: siempre PvP entre J1 y J2.
                const esPvEProximaRonda = (window.modoDosJugadores !== true
                    && typeof esRondaPvE === 'function'
                    && esRondaPvE(fase));
        if (esPvEProximaRonda) {
            // 🕒 El panel del rival anterior y sus Pokémon se quedan 2 s más
            //    en pantalla; después aparece el monstruo.
            if (typeof spawnearMonstruoPvEConRetraso === 'function') {
                spawnearMonstruoPvEConRetraso(fase, 2000);
            } else if (typeof spawnearMonstruoPvE === 'function') {
                spawnearMonstruoPvE(fase);
            }
        } else {
            if (typeof window.enRondaPvE !== 'undefined' && window.enRondaPvE === true) {
                if (typeof limpiarMonstruoPvE === 'function') limpiarMonstruoPvE();
            }
            if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();
        }

        enemyObjetoCompradoEstaRonda = false;
        objetoCompradoEstaRonda = false;
        sonidoObjetosReproducido = false;

        // 🆕 FIX: durante la celebración (5.5 s) y toda la orquestación de fin
        // de ronda NO se puede iniciar otro combate (antes el atajo "C" lo
        // permitía porque `combatiendo` ya era false). Se usa un flag propio
        // en lugar de mantener `combatiendo = true`, porque
        // `mostrarTiendaPostRonda()` no abre la tienda si sigue combatiendo.
        window._celebrandoFinRonda = true;
        if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

        if (typeof window.prepararTurnoDespuesDeCombate === 'function') window.prepararTurnoDespuesDeCombate(victoria);

        document.body.classList.add('celebrando');

        if (victoria) { if (typeof animarSaltoGanadoresJugador === 'function') animarSaltoGanadoresJugador(); }
        else { if (typeof animarSaltoGanadoresDerrota === 'function') animarSaltoGanadoresDerrota(); }

        document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = 'none'; });

        await new Promise(r => setTimeout(r, 5500));

        document.querySelectorAll('.salto-victoria').forEach(cell => { cell.classList.remove('salto-victoria'); cell.style.animationDelay = ''; });
        document.body.classList.remove('celebrando');

        document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = ''; });

        if (typeof restaurarPosicionesOriginales === 'function') restaurarPosicionesOriginales();
        else if (typeof renderizar === 'function') renderizar();

        // ============================================================
        // 🆕 ORQUESTADOR: toda la coreografía de fin de ronda
        // ============================================================
        await ejecutarFinDeRonda(victoria, esPvE);

        // 🆕 FIX: fin de la ventana de bloqueo. Si `ejecutarFinDeRonda` salió
        // antes de tiempo (game over, fin de torneo, 2P), este punto sigue
        // garantizando el desbloqueo.
        window._celebrandoFinRonda = false;
        if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

        combateFinalizado = true;
        window.jugadores = null;
        window.rivales = null;
        window.jugadoresIndices = null;
        window.rivalesIndices = null;

        addConsoleMessage(victoria ? "🎉 ¡VICTORIA! 🎉" : "💀 ¡DERROTA! 💀", victoria ? 'success' : 'error');

    } catch (error) {
        console.error("❌ ERROR en combate:", error);
        addConsoleMessage(`❌ Error en combate: ${error.message}`, 'error');
        if (window.statsCombateEnVivo) window.statsCombateEnVivo.activo = false;
        liberarEstadoCombate();
        } finally {
        if (window.statsCombateEnVivo) window.statsCombateEnVivo.activo = false;
        try {
            if (typeof combateAudioActual !== 'undefined' && combateAudioActual) {
                combateAudioActual.pause(); combateAudioActual.currentTime = 0; combateAudioActual = null;
            }
        } catch (e) {}

        // 🆕 FIX: NO reactivar el botón aquí si el orquestador aún
        // está en curso. Lo hace el orquestador al final.
        if (!window._finRondaEnCurso) {
            document.getElementById("btnCombatirFijo").disabled = false;
            document.body.classList.remove('combatiendo');
        }

        metronomoGlobalStacks = 0;
        if (typeof limpiarBordeLlamasCombate === 'function') limpiarBordeLlamasCombate();
        if (typeof movLimpiarQuemaduras === 'function') movLimpiarQuemaduras();
        try {
            const todasLasUnidades = [
                ...(window.jugadores || []),
                ...(window.rivales || []),
                ...tablero.filter(u => u),
                ...banquillo.filter(u => u),
                ...enemyBoard.filter(u => u),
                ...enemyBanquillo.filter(u => u)
            ];
            for (let u of todasLasUnidades) {
                if (u && u._hojaAfiladaIntervalId) {
                    clearInterval(u._hojaAfiladaIntervalId);
                    u._hojaAfiladaIntervalId = null;
                    u._hojaAfiladaActiva = false;
                    u._hojaAfiladaFin = 0;
                }
            }
        } catch (e) {}

        if (!combateFinalizado) {
            if (typeof restaurarPosicionesOriginales === 'function') restaurarPosicionesOriginales();
            else if (typeof renderizar === 'function') renderizar();
        }
    }
}

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