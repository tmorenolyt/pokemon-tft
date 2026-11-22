// ============================================================
// COMBATE · NAVEGACION
// Extraído de js/systems/combate.js (sin cambios de lógica).
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
