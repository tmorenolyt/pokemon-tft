// ============================================================
// SISTEMA DE MOVIMIENTOS - v5.7
// ============================================================
// 🎯 MODELO HORIZONTAL 4×5 CON INVASIÓN
//   _filaGlobal: 0..4   (5 carriles)
//   _colGlobal:  0..7   (A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7)
//
//   🎯 INVASIÓN:
//   - Melee jugador:  D → E → F → G → H (invade tablero enemigo)
//   - Melee enemigo:  E → D → C → B → A (invade tablero jugador)
//
// 🆕 v5.7:
//   - mostrarIconoEscudoRoto() SIN shake y SIN glow
//   - Usa PNG assets/icons/efectos/escudo-roto.png con fallback a emoji
//   - Icono quieto, sin color de fondo
//   - Refresca el timer si ya existe (para que no parpadee)
// ============================================================

const MOV_TIPO = {
    LINEAL: 'lineal',
    AREA: 'area',
    PROYECTIL: 'proyectil',
    GLOBAL: 'global'
};

const MOV_PRIORIDAD = {
    MAS_CERCANO: 'masCercano',
    MAS_CERCANO_EN_LINEA: 'masCercanoEnLinea',
    MAS_LEJANO: 'masLejano',
    MAS_DEBIL: 'masDebil',
    MAS_FUERTE: 'masFuerte',
    ALEATORIO: 'aleatorio'
};

const MOV_COLOR = {
    GREEN: 'color-green',
    RED: 'color-red',
    ORANGE: 'color-orange',
    BLUE: 'color-blue',
    CYAN: 'color-cyan',
    YELLOW: 'color-yellow',
    PURPLE: 'color-purple',
    PINK: 'color-pink',
    GRAY: 'color-gray',
    VENOM: 'color-venom',
    WHITE: 'color-white'
};

// ============================================================
// 🆕 REGISTRO GLOBAL DE ZONAS ACTIVAS
// ============================================================
window._zonasActivas = window._zonasActivas || [];

function _registrarZonaActiva(fila, col, clase, duracionMs, parpadeo) {
    if (typeof fila !== 'number' || typeof col !== 'number') return;
    const fin = performance.now() + duracionMs;
    window._zonasActivas = window._zonasActivas.filter(z =>
        !(z.fila === fila && z.col === col)
    );
    window._zonasActivas.push({ fila, col, clase, fin, parpadeo: !!parpadeo });
}

function _zonaActivaEn(fila, col) {
    const ahora = performance.now();
    window._zonasActivas = window._zonasActivas.filter(z => z.fin > ahora);
    return window._zonasActivas.find(z => z.fila === fila && z.col === col) || null;
}

window._registrarZonaActiva = _registrarZonaActiva;
window._zonaActivaEn = _zonaActivaEn;

// ============================================================
// HELPERS DE POSICIÓN GLOBAL
// ============================================================

function movAsegurarPosicionGlobal(unidad) {
    if (!unidad) return;

    if (typeof unidad._filaGlobal === 'number' && typeof unidad._colGlobal === 'number') {
        return;
    }

    const lado = unidad._indiceTablero || (unidad.equipo === 'enemy' ? 'enemy' : 'player');
    const idx  = (typeof unidad._indiceActual === 'number' && unidad._indiceActual >= 0)
        ? unidad._indiceActual
        : 0;

    if (typeof inicializarCoordsGlobales === 'function') {
        inicializarCoordsGlobales(unidad, idx, lado);
    } else {
        const filaLocal = Math.floor(idx / 4);
        const colLocal  = idx % 4;
        unidad._filaGlobal = filaLocal;
        unidad._colGlobal  = (lado === 'player') ? colLocal : (4 + colLocal);
        unidad._indiceTablero = lado;
        unidad._indiceActual  = idx;
    }
}

function movSetPosicionGlobal(unidad, _filaGlobal, _colGlobal) {
    if (!unidad) return false;

    if (_filaGlobal < 0 || _filaGlobal >= FILAS_ARENA) return false;
    if (_colGlobal < 0 || _colGlobal >= COLUMNAS_GLOBALES) return false;

    const ladoOriginal = unidad._indiceTablero || (unidad.equipo === 'enemy' ? 'enemy' : 'player');

    unidad._filaGlobal = _filaGlobal;
    unidad._colGlobal  = _colGlobal;

    if (ladoOriginal === 'player') {
        if (_colGlobal <= 3) {
            unidad._indiceActual = _filaGlobal * COLUMNAS_ARENA + _colGlobal;
        } else {
            unidad._indiceActual = -1;
        }
    } else {
        if (_colGlobal >= 4) {
            unidad._indiceActual = _filaGlobal * COLUMNAS_ARENA + (_colGlobal - 4);
        } else {
            unidad._indiceActual = -1;
        }
    }

    unidad._indiceTablero = ladoOriginal;

    return true;
}

function movObtenerPosicionGlobal(unidad) {
    if (!unidad) return null;
    movAsegurarPosicionGlobal(unidad);
    return { fila: unidad._filaGlobal, col: unidad._colGlobal };
}

function movGlobalABoard(_filaGlobal, _colGlobal) {
    if (typeof indiceDesdeCoords === 'function') {
        const r = indiceDesdeCoords(_filaGlobal, _colGlobal);
        return r;
    }

    if (_filaGlobal < 0 || _filaGlobal > 4) return null;
    if (_colGlobal < 0 || _colGlobal > 7) return null;

    if (_colGlobal <= 3) {
        return { lado: 'player', indice: _filaGlobal * 4 + _colGlobal };
    } else {
        return { lado: 'enemy', indice: _filaGlobal * 4 + (_colGlobal - 4) };
    }
}

function movDistanciaChebyshev(unidadA, unidadB) {
    if (typeof distanciaChebyshevGlobal === 'function') {
        return distanciaChebyshevGlobal(unidadA, unidadB);
    }

    const pa = movObtenerPosicionGlobal(unidadA);
    const pb = movObtenerPosicionGlobal(unidadB);
    if (!pa || !pb) return Infinity;
    return Math.max(Math.abs(pa.fila - pb.fila), Math.abs(pa.col - pb.col));
}

function movDistanciaManhattan(unidadA, unidadB) {
    if (typeof distanciaManhattanGlobal === 'function') {
        return distanciaManhattanGlobal(unidadA, unidadB);
    }

    const pa = movObtenerPosicionGlobal(unidadA);
    const pb = movObtenerPosicionGlobal(unidadB);
    if (!pa || !pb) return Infinity;
    return Math.abs(pa.fila - pb.fila) + Math.abs(pa.col - pb.col);
}

function movMismaPosicion(p1, p2) {
    return p1 && p2 && p1.fila === p2.fila && p1.col === p2.col;
}

// ============================================================
// GEOMETRÍA - CASILLAS EN LÍNEA
// ============================================================

function movCasillasEnLinea(origen, dir, alcance) {
    const casillas = [];
    if (!origen) return casillas;

    let fila = origen.fila;
    let col  = origen.col;

    for (let i = 0; i < alcance; i++) {
        if (dir === 'izquierda')      col--;
        else if (dir === 'derecha')   col++;
        else if (dir === 'arriba')    fila--;
        else if (dir === 'abajo')     fila++;
        else break;

        if (fila < 0 || fila > 4) break;
        if (col < 0 || col > 7) break;

        casillas.push({ fila, col });
    }

    return casillas;
}

function movCasillasEnArea(origen, radio) {
    const casillas = [];
    if (!origen) return casillas;

    for (let df = -radio; df <= radio; df++) {
        for (let dc = -radio; dc <= radio; dc++) {
            if (df === 0 && dc === 0) continue;
            const f = origen.fila + df;
            const c = origen.col + dc;

            if (f < 0 || f > 4) continue;
            if (c < 0 || c > 7) continue;

            casillas.push({ fila: f, col: c });
        }
    }

    return casillas;
}

function movUnidadEnPosicion(pos, unidades) {
    if (!pos || !unidades) return null;
    for (let u of unidades) {
        if (!u || u.hp <= 0 || u.muerto) continue;
        const pu = movObtenerPosicionGlobal(u);
        if (movMismaPosicion(pu, pos)) return u;
    }
    return null;
}

// ============================================================
// DIRECCIÓN "ADELANTE" SEGÚN LADO
// ============================================================

function movDireccionAdelante(ladoOJugador) {
    let esJugador;
    if (typeof ladoOJugador === 'string') {
        esJugador = (ladoOJugador === 'player');
    } else if (ladoOJugador && ladoOJugador.equipo) {
        esJugador = (ladoOJugador.equipo === 'player');
    } else {
        esJugador = true;
    }
    return esJugador ? 'derecha' : 'izquierda';
}

function movDireccionAtras(ladoOJugador) {
    const adelante = movDireccionAdelante(ladoOJugador);
    return adelante === 'derecha' ? 'izquierda' : 'derecha';
}

// ============================================================
// SISTEMA DE TARGETING
// ============================================================

function movEncontrarObjetivo(atacante, enemigos, prioridad, alcance) {
    if (!atacante || !enemigos || enemigos.length === 0) return null;

    const vivos = enemigos.filter(e => e && e.hp > 0 && !e.muerto && !e.inmuneObjetivo);
    if (vivos.length === 0) return null;

    let alcanceMax = (alcance === undefined || alcance === null) ? 99 : alcance;

    let candidatos = vivos.filter(e => movDistanciaChebyshev(atacante, e) <= alcanceMax);
    if (candidatos.length === 0) return null;

    switch (prioridad) {
        case MOV_PRIORIDAD.MAS_CERCANO: {
            candidatos.sort((a, b) =>
                movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)
            );
            return candidatos[0];
        }

        case MOV_PRIORIDAD.MAS_CERCANO_EN_LINEA: {
            const pa = movObtenerPosicionGlobal(atacante);

            const mismaFila = candidatos.filter(e => {
                const pe = movObtenerPosicionGlobal(e);
                return pe && pe.fila === pa.fila;
            });
            if (mismaFila.length > 0) {
                mismaFila.sort((a, b) =>
                    movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)
                );
                return mismaFila[0];
            }

            const mismaColumna = candidatos.filter(e => {
                const pe = movObtenerPosicionGlobal(e);
                return pe && pe.col === pa.col;
            });
            if (mismaColumna.length > 0) {
                mismaColumna.sort((a, b) =>
                    movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)
                );
                return mismaColumna[0];
            }

            candidatos.sort((a, b) =>
                movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)
            );
            return candidatos[0];
        }

        case MOV_PRIORIDAD.MAS_LEJANO: {
            candidatos.sort((a, b) =>
                movDistanciaChebyshev(atacante, b) - movDistanciaChebyshev(atacante, a)
            );
            return candidatos[0];
        }

        case MOV_PRIORIDAD.MAS_DEBIL: {
            candidatos.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
            return candidatos[0];
        }

        case MOV_PRIORIDAD.MAS_FUERTE: {
            candidatos.sort((a, b) =>
                (b.ataque + b.ataqueEspecial) - (a.ataque + a.ataqueEspecial)
            );
            return candidatos[0];
        }

        case MOV_PRIORIDAD.ALEATORIO:
        default: {
            return candidatos[Math.floor(Math.random() * candidatos.length)];
        }
    }
}

function movEnemigosEnLinea(atacante, enemigos, dir, alcance) {
    const origen = movObtenerPosicionGlobal(atacante);
    if (!origen) return [];

    const casillas = movCasillasEnLinea(origen, dir, alcance);
    const resultado = [];

    for (let c of casillas) {
        const u = movUnidadEnPosicion(c, enemigos);
        if (u) resultado.push({ unidad: u, posicion: c });
    }

    return resultado;
}

// ============================================================
// EFECTOS DE COMBATE
// ============================================================

function movAplicarDaño(atacante, objetivo, cantidad, esCritico = false) {
    if (!atacante || !objetivo || cantidad <= 0) return 0;
    if (atacante.hp <= 0 || atacante.muerto) return 0;
    if (objetivo.hp <= 0 || objetivo.muerto) return 0;

    // ============================================================
    // 🆕 FIX #2: NO re-aplicar bonusAttack / bonusSpAttack / bonusDamage
    // ============================================================
    // La cantidad que llega desde el registro del movimiento ya se calcula
    // con `atacante.ataque` / `atacante.ataqueEspecial`, y esas stats YA
    // incluyen bonusAttack, bonusSpAttack y bonusDamage (ver
    // Unidad.actualizarStats). Multiplicarlas otra vez aquí duplicaba los
    // bonus (p. ej. Gafas Especiales +40% → +96% real).
    //
    // El único multiplicador propio de movimientos que NO está dentro de
    // las stats es bonusMoveDamage (clase Movimiento, Gafas Elección...).
    // ============================================================
    const esEspecial = (atacante.ataqueEspecial || 0) > (atacante.ataque || 0);

    const bonusMove = (typeof atacante.bonusMoveDamage === 'number' && !isNaN(atacante.bonusMoveDamage))
        ? atacante.bonusMoveDamage : 1;

    // Multiplicador total
    const multiplicadorTotal = bonusMove;

    const dañoRaw = Math.floor(cantidad * multiplicadorTotal);

    // ============================================================
    // Reducción por defensa (igual que antes)
    // ============================================================
    const defObjetivo = esEspecial
        ? (objetivo.defensaEspecial || 0)
        : (objetivo.defensa || 0);

    const reduccion = defObjetivo / (defObjetivo + (window.DEFENSA_K || 100));
    const daño = Math.max(1, Math.floor(dañoRaw * (1 - reduccion)));

    // ============================================================
    // Log de debug (solo si DEBUG_COMBATE está activo)
    // ============================================================
    if (window.DEBUG_COMBATE) {
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `💥 MOV ${atacante.pokemon.nombre} → ${objetivo.pokemon.nombre}: ` +
                `${dañoRaw} raw → ${daño} real (def ${defObjetivo}${esEspecial ? ' esp' : ''})` +
                ` [x${multiplicadorTotal.toFixed(2)}: move ${bonusMove.toFixed(2)}]` +
                ` (${objetivo.hp}/${objetivo.maxHp} HP)`,
                'battle'
            );
        }
    }

    // ============================================================
    // Aplicar daño
    // ============================================================
    const teniaEscudo = objetivo.escudoActual > 0;
    const murio = objetivo.recibirDaño(daño, atacante);

    atacante.damageDealt = (atacante.damageDealt || 0) + daño;

    if (typeof actualizarCopiaEstadisticas === 'function') {
        actualizarCopiaEstadisticas(atacante, 'damageDealt', daño);
    }

    const posObj = typeof obtenerPosicionUnidadActual === 'function'
        ? obtenerPosicionUnidadActual(objetivo)
        : null;

    if (posObj) {
        if (typeof mostrarNumeroDaño === 'function') {
            mostrarNumeroDaño(posObj.x, posObj.y - 10, daño, esCritico, teniaEscudo, true);
        }
        if (posObj.elemento && typeof actualizarBarraVidaPokemon === 'function') {
            actualizarBarraVidaPokemon(posObj.elemento, objetivo.hp, objetivo.maxHp, daño);
        }
        if (posObj.elemento && typeof animarUnidadRecibeDaño === 'function') {
            animarUnidadRecibeDaño(posObj.elemento, esCritico);
        }
    }

    if (murio) {
        objetivo.muerto = true;
        if (posObj && posObj.elemento && typeof ocultarUnidadMuerta === 'function') {
            ocultarUnidadMuerta(posObj.elemento);
        }
    }

    // 🛡️ Aplicar Roca del Rey / Cuchara Peculiar también desde movimientos
    if (atacante && objetivo && objetivo.hp > 0 && !objetivo.muerto) {
        if (atacante.reduceDefense > 0) {
            const yaTieneDebuffFisico = objetivo._debuffDefFisica && performance.now() < objetivo._debuffDefFisicaFin;
            if (!yaTieneDebuffFisico) {
                const defOriginal = objetivo.defensa;
                const defReducida = Math.max(0, Math.floor(defOriginal * (1 - atacante.reduceDefense)));
                objetivo._debuffDefFisica = true;
                objetivo._debuffDefFisicaFin = performance.now() + (atacante.duracionReduccion * 1000);
                objetivo._debuffDefFisicaOriginal = defOriginal;
                objetivo.defensa = defReducida;
                console.log(`🛡️ [ROCA DEL REY - MOV] ${atacante.pokemon.nombre} reduce defensa física de ${objetivo.pokemon.nombre}: ${defOriginal} → ${defReducida} durante ${atacante.duracionReduccion}s`);
            } else {
                objetivo._debuffDefFisicaFin = performance.now() + (atacante.duracionReduccion * 1000);
            }
            if (typeof mostrarIconoEscudoRoto === 'function') mostrarIconoEscudoRoto(objetivo, atacante.duracionReduccion, 'fisica');
            if (typeof renderizarCombate === 'function') renderizarCombate();
            if (objetivo._debuffDefFisicaTimerId) clearTimeout(objetivo._debuffDefFisicaTimerId);
            objetivo._debuffDefFisicaTimerId = setTimeout(() => {
                if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;
                objetivo.defensa = objetivo._debuffDefFisicaOriginal;
                objetivo._debuffDefFisica = false;
                objetivo._debuffDefFisicaFin = 0;
                objetivo._debuffDefFisicaOriginal = null;
                objetivo._debuffDefFisicaTimerId = null;
                objetivo._iconoEscudoRotoFin = 0;
                objetivo._iconoEscudoRotoTipo = null;
                if (typeof renderizarCombate === 'function') renderizarCombate();
            }, atacante.duracionReduccion * 1000);
        }
        if (atacante.reduceSpDefense > 0) {
            const yaTieneDebuffEsp = objetivo._debuffDefEsp && performance.now() < objetivo._debuffDefEspFin;
            if (!yaTieneDebuffEsp) {
                const defEspOriginal = objetivo.defensaEspecial;
                const defEspReducida = Math.max(0, Math.floor(defEspOriginal * (1 - atacante.reduceSpDefense)));
                objetivo._debuffDefEsp = true;
                objetivo._debuffDefEspFin = performance.now() + (atacante.duracionReduccion * 1000);
                objetivo._debuffDefEspOriginal = defEspOriginal;
                objetivo.defensaEspecial = defEspReducida;
                console.log(`🛡️ [CUCHARA PECULIAR - MOV] ${atacante.pokemon.nombre} reduce defensa especial de ${objetivo.pokemon.nombre}: ${defEspOriginal} → ${defEspReducida} durante ${atacante.duracionReduccion}s`);
            } else {
                objetivo._debuffDefEspFin = performance.now() + (atacante.duracionReduccion * 1000);
            }
            if (typeof mostrarIconoEscudoRoto === 'function') mostrarIconoEscudoRoto(objetivo, atacante.duracionReduccion, 'especial');
            if (typeof renderizarCombate === 'function') renderizarCombate();
            if (objetivo._debuffDefEspTimerId) clearTimeout(objetivo._debuffDefEspTimerId);
            objetivo._debuffDefEspTimerId = setTimeout(() => {
                if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;
                objetivo.defensaEspecial = objetivo._debuffDefEspOriginal;
                objetivo._debuffDefEsp = false;
                objetivo._debuffDefEspFin = 0;
                objetivo._debuffDefEspOriginal = null;
                objetivo._debuffDefEspTimerId = null;
                objetivo._iconoEscudoRotoFin = 0;
                objetivo._iconoEscudoRotoTipo = null;
                if (typeof renderizarCombate === 'function') renderizarCombate();
            }, atacante.duracionReduccion * 1000);
        }
    }

    return daño;
}

function movAplicarSlow(objetivo, porcentaje, duracionSeg, etiqueta = '') {
    if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;

    const reduccion = Math.max(0, Math.min(0.95, porcentaje));

    if (objetivo._slowBase === undefined) {
        objetivo._slowBase = objetivo.bonusAttackSpeed || 1;
    }
    objetivo._slowsActivos = (objetivo._slowsActivos || 0) + 1;

    objetivo.bonusAttackSpeed = objetivo._slowBase * (1 - reduccion);
    objetivo.actualizarStats();

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(
            `🐌 ${objetivo.pokemon.nombre} -${Math.floor(reduccion * 100)}% Vel. Ataque durante ${duracionSeg}s ${etiqueta}`,
            'battle'
        );
    }

    setTimeout(() => {
        if (objetivo.hp <= 0 || objetivo.muerto) {
            objetivo._slowsActivos = 0;
            delete objetivo._slowBase;
            return;
        }
        objetivo._slowsActivos = Math.max(0, (objetivo._slowsActivos || 0) - 1);
        if (objetivo._slowsActivos === 0) {
            objetivo.bonusAttackSpeed = objetivo._slowBase;
            delete objetivo._slowBase;
            objetivo.actualizarStats();
        }
    }, duracionSeg * 1000);
}

function movKnockup(objetivo, duracionSeg) {
    if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;

    movAplicarSlow(objetivo, 1.00, duracionSeg, '(lanzado por los aires)');

    try {
        const pos = obtenerPosicionUnidadActual(objetivo);
        if (pos && pos.elemento) {
            const sprite = pos.elemento.querySelector('.unit-sprite');
            if (sprite && sprite.style) {
                sprite.classList.remove('airborne');
                void sprite.offsetWidth;
                sprite.style.animation = `knockupAirborne ${duracionSeg}s ease`;
                sprite.classList.add('airborne');
                setTimeout(() => {
                    if (sprite && sprite.style) {
                        sprite.style.animation = '';
                        sprite.classList.remove('airborne');
                    }
                }, duracionSeg * 1000 + 60);
            }
        }
    } catch (e) {
        console.warn('⚠️ movKnockup: elemento ya no existe', e);
    }
}

// ============================================================
// ===== APLICAR VENENO (v2 - FIX multiplicador del atacante) =====
// ============================================================
// 🆕 El multiplicador de veneno viene del ATACANTE (el que tiene
//    la sinergia Veneno), NO de la víctima. Antes se leía de
//    unidad.poisonDamageMultiplier (la víctima), así que si la
//    víctima no tenía Veneno, el multiplicador era siempre 1x.
//
//    Ahora el stack guarda `multiplicador` y `origen` (nombre
//    del atacante) para que procesarVeneno sepa cuánto aplicar.
// ============================================================

function movAplicarVeneno(objetivo, dañoPorSeg, duracionSeg, atacante = null) {
    if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;
    if (typeof dañoPorSeg !== 'number' || isNaN(dañoPorSeg) || dañoPorSeg <= 0) return;

    if (!objetivo.poisonStacks) objetivo.poisonStacks = [];

    // 🆕 El multiplicador viene del ATACANTE, no de la víctima
    const multiplicadorAtacante = (atacante && typeof atacante.poisonDamageMultiplier === 'number' && !isNaN(atacante.poisonDamageMultiplier))
        ? atacante.poisonDamageMultiplier
        : 1;

    const nombreOrigen = (atacante && atacante.pokemon) ? atacante.pokemon.nombre : '???';

    objetivo.poisonStacks.push({
        daño: dañoPorSeg,
        tiempoRestante: duracionSeg,
        tick: 1,
        multiplicador: multiplicadorAtacante,   // 🆕
        origen: nombreOrigen                     // 🆕
    });

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(
            `☠️ ${objetivo.pokemon.nombre} envenenado por ${nombreOrigen} (${dañoPorSeg}/s × ${multiplicadorAtacante}x durante ${duracionSeg}s)`,
            'battle'
        );
    }
}

function movAplicarReduccionDefensa(objetivo, cantidad, duracionSeg) {
    if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;
    const original = objetivo.bonusDefense || 0;
    objetivo.bonusDefense = original - cantidad;
    objetivo.actualizarStats();
    setTimeout(() => {
        if (objetivo.hp <= 0 || objetivo.muerto) return;
        objetivo.bonusDefense = original;
        objetivo.actualizarStats();
    }, duracionSeg * 1000);
}

function movCurar(unidad, cantidad) {
    if (!unidad || unidad.hp <= 0 || unidad.muerto) return 0;

    const curado = unidad.curar(cantidad);

    if (curado > 0) {
        unidad.healingDone = (unidad.healingDone || 0) + curado;
        if (typeof actualizarCopiaEstadisticas === 'function') {
            actualizarCopiaEstadisticas(unidad, 'healingDone', curado);
        }

        const pos = typeof obtenerPosicionUnidadActual === 'function'
            ? obtenerPosicionUnidadActual(unidad)
            : null;

        if (pos) {
            if (typeof mostrarNumeroCuracion === 'function') {
                mostrarNumeroCuracion(pos.x, pos.y, curado);
            }
            if (pos.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp);
            }
        }
    }

    return curado;
}

const MOV_QUEMADURAS_TIMERS = [];

function movAplicarQuemadura(objetivo, dañoPorTick, duracionSeg, atacante = null) {
    if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;
    if (dañoPorTick <= 0) return;

    objetivo._quemadurasActivas = (objetivo._quemadurasActivas || 0) + 1;
    objetivo._quemado = true;

    let ticksRestantes = Math.max(1, Math.floor(duracionSeg));
    const intervaloMs = 1000;

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(
            `🔥 ${objetivo.pokemon.nombre} quemado (${Math.round(dañoPorTick)}/s durante ${duracionSeg}s)`,
            'battle'
        );
    }

    const timer = setInterval(() => {
        if (objetivo.hp <= 0 || objetivo.muerto) {
            movFinQuemadura(objetivo);
            movQuitarTimerQuemadura(timer);
            clearInterval(timer);
            return;
        }

                const daño = Math.floor(dañoPorTick);
        
        // 🆕 FIX: Evitar que el DoT rompa las estadísticas si se desborda
        if (typeof daño === 'number' && !isNaN(daño) && daño > 0 && daño < 5000) {
            objetivo.hp = Math.max(0, objetivo.hp - daño);
            objetivo.damageTaken = (objetivo.damageTaken || 0) + daño;

            if (atacante) {
                atacante.damageDealt = (atacante.damageDealt || 0) + daño;
                if (typeof actualizarCopiaEstadisticas === 'function') {
                    actualizarCopiaEstadisticas(atacante, 'damageDealt', daño);
                }
            }
            if (typeof actualizarCopiaEstadisticas === 'function') {
                actualizarCopiaEstadisticas(objetivo, 'damageTaken', daño);
            }
        }

        const pos = typeof obtenerPosicionUnidadActual === 'function'
            ? obtenerPosicionUnidadActual(objetivo) : null;

        if (pos) {
            if (typeof mostrarNumeroDaño === 'function') {
                mostrarNumeroDaño(pos.x, pos.y - 20, daño, false);
            }
            if (pos.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                actualizarBarraVidaPokemon(pos.elemento, objetivo.hp, objetivo.maxHp, daño);
            }
        }

        if (objetivo.hp <= 0) {
            objetivo.muerto = true;
            if (pos && pos.elemento && typeof ocultarUnidadMuerta === 'function') {
                ocultarUnidadMuerta(pos.elemento);
            }
            movFinQuemadura(objetivo);
            movQuitarTimerQuemadura(timer);
            clearInterval(timer);
            return;
        }

        ticksRestantes--;
        if (ticksRestantes <= 0) {
            movFinQuemadura(objetivo);
            movQuitarTimerQuemadura(timer);
            clearInterval(timer);
        }
    }, intervaloMs);

    MOV_QUEMADURAS_TIMERS.push(timer);
}

function movQuitarTimerQuemadura(timer) {
    const idx = MOV_QUEMADURAS_TIMERS.indexOf(timer);
    if (idx >= 0) MOV_QUEMADURAS_TIMERS.splice(idx, 1);
}

function movFinQuemadura(objetivo) {
    if (!objetivo) return;
    objetivo._quemadurasActivas = Math.max(0, (objetivo._quemadurasActivas || 0) - 1);
    if (objetivo._quemadurasActivas === 0) {
        objetivo._quemado = false;
    }
}

function movLimpiarQuemaduras() {
    for (const t of MOV_QUEMADURAS_TIMERS) clearInterval(t);
    MOV_QUEMADURAS_TIMERS.length = 0;
}

function movAplicarReduccionDefensas(objetivo, porcentaje, duracionSeg) {
    if (!objetivo || objetivo.hp <= 0 || objetivo.muerto) return;

    const pct = Math.max(0, Math.min(0.95, porcentaje));
    const duracionMs = duracionSeg * 1000;

    // 🆕 FIX: si ya hay un debuff de defensas activo, refrescar el timer
    // en vez de apilar otra reducción encima (evita -60%, -90%...).
    const yaTieneDebuff = objetivo._debuffDefensasFin && performance.now() < objetivo._debuffDefensasFin;

    if (yaTieneDebuff) {
        // Solo refrescar el timer
        objetivo._debuffDefensasFin = performance.now() + duracionMs;

        // Refrescar también el icono de escudo roto
        if (typeof mostrarIconoEscudoRoto === 'function') {
            mostrarIconoEscudoRoto(objetivo, duracionSeg, 'fisica');
            mostrarIconoEscudoRoto(objetivo, duracionSeg, 'especial');
        }

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `🔻 ${objetivo.pokemon.nombre} refresca -${Math.round(pct * 100)}% Def/Def.Esp (${duracionSeg}s)`,
                'battle'
            );
        }
        return;
    }

    // Guardar valores originales
    const defOriginal = objetivo.defensa || 0;
    const spDefOriginal = objetivo.defensaEspecial || 0;
    const reduccionDef = Math.floor(defOriginal * pct);
    const reduccionSpDef = Math.floor(spDefOriginal * pct);

    objetivo.defensa = Math.max(0, defOriginal - reduccionDef);
    objetivo.defensaEspecial = Math.max(0, spDefOriginal - reduccionSpDef);

    // 🆕 FIX: guardar los valores originales y el fin del debuff
    // para que renderizarCombate pinte el icono de escudo roto.
    objetivo._debuffDefensasOriginal = { def: defOriginal, spDef: spDefOriginal };
    objetivo._debuffDefensasFin = performance.now() + duracionMs;
    objetivo._debuffDefensasPct = pct;

    // 🆕 FIX: marcar también los flags individuales que usa
    // mostrarIconoEscudoRoto para que persista en el render.
    objetivo._debuffDefFisica = true;
    objetivo._debuffDefFisicaFin = performance.now() + duracionMs;
    objetivo._debuffDefFisicaOriginal = defOriginal;
    objetivo._debuffDefEsp = true;
    objetivo._debuffDefEspFin = performance.now() + duracionMs;
    objetivo._debuffDefEspOriginal = spDefOriginal;

    // 🆕 FIX: mostrar el icono de escudo roto (físico y especial)
    if (typeof mostrarIconoEscudoRoto === 'function') {
        mostrarIconoEscudoRoto(objetivo, duracionSeg, 'fisica');
        mostrarIconoEscudoRoto(objetivo, duracionSeg, 'especial');
    }

    // 🆕 FIX: repintar el combate para que el icono se vea YA
    if (typeof renderizarCombate === 'function') {
        renderizarCombate();
    }

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(
            `🔻 ${objetivo.pokemon.nombre} -${Math.round(pct * 100)}% Def y Def.Esp durante ${duracionSeg}s`,
            'battle'
        );
    }

    setTimeout(() => {
        if (objetivo.hp <= 0 || objetivo.muerto) return;
        if (!objetivo._debuffDefensasOriginal) return;

        // Restaurar valores
        objetivo.defensa = objetivo._debuffDefensasOriginal.def;
        objetivo.defensaEspecial = objetivo._debuffDefensasOriginal.spDef;

        // Limpiar flags
        objetivo._debuffDefensasOriginal = null;
        objetivo._debuffDefensasFin = 0;
        objetivo._debuffDefensasPct = 0;
        objetivo._debuffDefFisica = false;
        objetivo._debuffDefFisicaFin = 0;
        objetivo._debuffDefFisicaOriginal = null;
        objetivo._debuffDefEsp = false;
        objetivo._debuffDefEspFin = 0;
        objetivo._debuffDefEspOriginal = null;

        // Quitar el icono de escudo roto del DOM
        if (typeof obtenerPosicionUnidadActual === 'function') {
            const pos = obtenerPosicionUnidadActual(objetivo);
            if (pos && pos.elemento) {
                const icono = pos.elemento.querySelector('.icon-def-down-anclado');
                if (icono) icono.remove();
            }
        }

        if (typeof renderizarCombate === 'function') {
            renderizarCombate();
        }
    }, duracionMs);
}

// ============================================================
// EFECTOS VISUALES GENÉRICOS
// ============================================================

function movMostrarEfectoVisual(objetivo, opciones = {}) {
    if (!objetivo) return;

    const {
        color = MOV_COLOR.WHITE,
        shape = null,
        icono = null,
        intensidad = 'strong',
        duracionMs = 800,
        sizeIcono = 'normal',
        persistente = false,
        pulso = false,
        claseExtra = null
    } = opciones;

    let elemento = null;

    if (typeof obtenerPosicionUnidadActual === 'function') {
        const pos = obtenerPosicionUnidadActual(objetivo);
        if (pos && pos.elemento) elemento = pos.elemento;
    }

    if (!elemento) return;

    elemento.querySelectorAll('.mov-effect-icon').forEach(el => el.remove());

    elemento.classList.add('mov-effect-cell');
    if (color) elemento.classList.add(color);
    if (shape) elemento.classList.add(shape);
    if (intensidad) elemento.classList.add(intensidad);

    let iconEl = null;
    if (icono) {
        iconEl = document.createElement('div');
        iconEl.className = 'mov-effect-icon';
        if (sizeIcono === 'small') iconEl.classList.add('mov-icon-small');
        if (sizeIcono === 'large') iconEl.classList.add('mov-icon-large');
        if (persistente) iconEl.classList.add('persistent');
        if (pulso) iconEl.classList.add('pulse');
        if (claseExtra) {
            claseExtra.split(' ').forEach(c => { if (c) iconEl.classList.add(c); });
        }

        let usaImagen = false;
        if (typeof icono === 'string' && icono.startsWith('mov:')) {
            const nombreMov = icono.substring(4).trim();

            const tamañoImagen = sizeIcono === 'small' ? 36 : (sizeIcono === 'large' ? 60 : 48);

            if (typeof getIconoMovimientoHtml === 'function') {
                const htmlIcono = getIconoMovimientoHtml(nombreMov, tamañoImagen);
                if (htmlIcono && htmlIcono.includes('<img')) {
                    iconEl.innerHTML = htmlIcono;
                    usaImagen = true;
                }
            }
        }

        if (!usaImagen) iconEl.textContent = icono;

        elemento.style.position = 'relative';
        elemento.appendChild(iconEl);
    }

    let reAddInterval = null;
    if (iconEl) {
        reAddInterval = setInterval(() => {
            if (!iconEl) {
                clearInterval(reAddInterval);
                reAddInterval = null;
                return;
            }

            const elementoVivo = elemento &&
                                 elemento.isConnected &&
                                 document.body.contains(elemento);

            if (!elementoVivo) {
                clearInterval(reAddInterval);
                reAddInterval = null;
                if (iconEl && iconEl.parentNode) {
                    iconEl.remove();
                }
                return;
            }

            if (!iconEl.parentNode) {
                elemento.appendChild(iconEl);
            }
        }, 100);
    }

        // 🆕 FIX: si es persistente, NO eliminar el icono con setTimeout.
    // Se eliminará solo cuando la unidad muera o cuando se limpie
    // manualmente (por ejemplo, al terminar el debuff).
    if (!persistente) {
        setTimeout(() => {
            if (reAddInterval) {
                clearInterval(reAddInterval);
                reAddInterval = null;
            }

            if (elemento && elemento.classList) {
                elemento.classList.remove(
                    'mov-effect-cell',
                    'color-green', 'color-red', 'color-orange', 'color-blue', 'color-cyan',
                    'color-yellow', 'color-purple', 'color-pink', 'color-gray', 'color-venom', 'color-white',
                    'shape-diamond', 'shape-square',
                    'strong', 'soft'
                );
            }

            if (iconEl && iconEl.parentNode) iconEl.remove();
        }, duracionMs);
    } else {
        // 🆕 Si es persistente, programar la eliminación al terminar
        // la duración, pero con la clase "persistente" puesta.
        setTimeout(() => {
            if (reAddInterval) {
                clearInterval(reAddInterval);
                reAddInterval = null;
            }

            if (elemento && elemento.classList) {
                elemento.classList.remove(
                    'mov-effect-cell',
                    'color-green', 'color-red', 'color-orange', 'color-blue', 'color-cyan',
                    'color-yellow', 'color-purple', 'color-pink', 'color-gray', 'color-venom', 'color-white',
                    'shape-diamond', 'shape-square',
                    'strong', 'soft'
                );
            }

            if (iconEl && iconEl.parentNode) iconEl.remove();
        }, duracionMs);
    }
}

function movMarcarCasillaConTipo(fila, col, tipo, duracionMs = 900) {
    if (typeof fila !== 'number' || typeof col !== 'number') return;
    if (fila < 0 || fila >= FILAS_ARENA) return;
    if (col < 0 || col >= COLUMNAS_GLOBALES) return;

    const ladoVisual = (col <= 3) ? 'player' : 'enemy';

    let indiceLocal;
    if (ladoVisual === 'player') {
        indiceLocal = fila * COLUMNAS_ARENA + col;
    } else {
        indiceLocal = fila * COLUMNAS_ARENA + (col - 4);
    }
    if (indiceLocal < 0 || indiceLocal >= TOTAL_CASILLAS_LADO) return;

    const grid = document.getElementById(ladoVisual === 'enemy' ? 'enemigoBoard' : 'playerBoard');
    if (!grid || !grid.children[indiceLocal]) return;

    const el = grid.children[indiceLocal];

    const CLASE_POR_TIPO = {
        "Fuego":     "mov-zone-fire",
        "Agua":      "mov-zone-water",
        "Planta":    "mov-zone-grass",
        "Eléctrico": "mov-zone-electric",
        "Psíquico":  "mov-zone-psychic",
        "Siniestro": "mov-zone-dark",
        "Hada":      "mov-zone-fairy",
        "Fantasma":  "mov-zone-ghost",
        "Lucha":     "mov-zone-fight",
        "Veneno":    "mov-zone-poison",
        "Hielo":     "mov-zone-ice",
        "Dragón":    "mov-zone-dragon",
        "Roca":      "mov-zone-rock",
        "Normal":    "mov-zone-normal",
        "Volador":   "mov-zone-flying",
        "Acero":     "mov-zone-steel",
        "Eevee":     "mov-zone-eevee"
    };

    const clase = CLASE_POR_TIPO[tipo] || "mov-zone-normal";

    // 🆕 Si ya tiene la clase, solo refrescar el timer (no reiniciar la animación)
    if (el.classList.contains(clase) && el.classList.contains("mov-zone-marcada")) {
        if (el._movZoneTimer) clearTimeout(el._movZoneTimer);
        el._movZoneTimer = setTimeout(() => {
            el.classList.remove("mov-zone-marcada", clase);
            el._movZoneTimer = null;
        }, duracionMs);
        return;
    }

    // Si tenía otra clase de tipo, quitarla primero
    Array.from(el.classList).forEach(c => {
        if (c.startsWith("mov-zone-") && c !== "mov-zone-marcada") {
            el.classList.remove(c);
        }
    });

    el.classList.add("mov-zone-marcada", clase);

    // 🆕 Si la duración es larga (>1.5s), usar animación de zona larga
    if (duracionMs > 1500) {
        el.classList.add("mov-zone-parpadeo");
        if (el.style) el.style.setProperty('--zona-dur', duracionMs + 'ms');
    } else {
        el.classList.remove("mov-zone-parpadeo");
    }

    // 🆕 REGISTRAR LA ZONA ACTIVA para que render.js la repinte
    if (typeof _registrarZonaActiva === 'function') {
        _registrarZonaActiva(fila, col, clase, duracionMs, duracionMs > 1500);
    }

    if (el._movZoneTimer) clearTimeout(el._movZoneTimer);
    el._movZoneTimer = setTimeout(() => {
        el.classList.remove("mov-zone-marcada", clase, "mov-zone-parpadeo");
        // 🆕 Limpiar del registro global
        if (typeof window._zonasActivas !== 'undefined') {
            window._zonasActivas = window._zonasActivas.filter(z =>
                !(z.fila === fila && z.col === col)
            );
        }
        el._movZoneTimer = null;
    }, duracionMs);
}

window.movMarcarCasillaConTipo = movMarcarCasillaConTipo;

function movMarcarCasillaGlobal(fila, col, opciones = {}) {
    const { duracionMs = 2200 } = opciones;

    if (typeof fila !== 'number' || typeof col !== 'number') return;
    if (fila < 0 || fila >= FILAS_ARENA) return;
    if (col < 0 || col >= COLUMNAS_GLOBALES) return;

    const ladoVisual = (col <= 3) ? 'player' : 'enemy';

    let indiceLocal;
    if (ladoVisual === 'player') {
        indiceLocal = fila * COLUMNAS_ARENA + col;
    } else {
        indiceLocal = fila * COLUMNAS_ARENA + (col - 4);
    }
    if (indiceLocal < 0 || indiceLocal >= TOTAL_CASILLAS_LADO) return;

    const grid = document.getElementById(ladoVisual === 'enemy' ? 'enemigoBoard' : 'playerBoard');
    if (!grid || !grid.children[indiceLocal]) return;

    const el = grid.children[indiceLocal];

    el.classList.remove('casilla-nieve');
    void el.offsetWidth;
    el.classList.add('casilla-nieve');

    if (el._nieveTimer) clearTimeout(el._nieveTimer);
    el._nieveTimer = setTimeout(() => {
        el.classList.remove('casilla-nieve');
        el._nieveTimer = null;
    }, duracionMs);
}

window.movMarcarCasillaGlobal = movMarcarCasillaGlobal;

function movMostrarLineaProyectil(origenUnidad, destinoUnidad, color = 'rgba(74, 222, 128, 0.9)', duracionMs = 500) {
    if (!origenUnidad || !destinoUnidad) return;

    const posO = obtenerPosicionUnidadActual(origenUnidad);
    const posD = obtenerPosicionUnidadActual(destinoUnidad);
    if (!posO || !posD || !posO.elemento || !posD.elemento) return;

    const rectO = posO.elemento.getBoundingClientRect();
    const rectD = posD.elemento.getBoundingClientRect();

    const x1 = rectO.left + rectO.width / 2;
    const y1 = rectO.top + rectO.height / 2;
    const x2 = rectD.left + rectD.width / 2;
    const y2 = rectD.top + rectD.height / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    const angulo = Math.atan2(dy, dx) * 180 / Math.PI;

    const linea = document.createElement('div');
    linea.className = 'mov-projectile-line';
    linea.style.cssText = `
        left: ${x1}px;
        top: ${y1}px;
        width: ${distancia}px;
        background: linear-gradient(90deg, ${color}, rgba(74, 222, 128, 0.1));
        box-shadow: 0 0 15px ${color};
        transform: rotate(${angulo}deg);
        animation-duration: ${duracionMs}ms;
    `;
    document.body.appendChild(linea);

    setTimeout(() => {
        if (linea.parentNode) linea.remove();
    }, duracionMs + 100);
}

function movMostrarTextoFlotante(x, y, texto, color = '#ffffff') {
    const el = document.createElement('div');
    el.className = 'mov-floating-text';
    el.textContent = texto;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    document.body.appendChild(el);

    setTimeout(() => {
        if (el.parentNode) el.remove();
    }, 1000);
}

// ============================================================
// REGISTRO DE MOVIMIENTOS
// ============================================================

const MOVIMIENTOS_REGISTRO = {};

// ============================================================
// FUNCIÓN CENTRAL - EJECUTAR MOVIMIENTO
// ============================================================

function ejecutarMovimiento(atacante, objetivoPrincipal, indiceMovimiento, enemigosVivos, aliadosVivos) {
    if (!atacante || !atacante.pokemon) return false;
    if (!enemigosVivos || enemigosVivos.length === 0) return false;

    let nombreMovimiento = null;
    if (typeof getMovimientosPokemon === 'function') {
        const movs = getMovimientosPokemon(atacante.pokemon.nombre);
        if (movs && movs[indiceMovimiento]) {
            nombreMovimiento = movs[indiceMovimiento].nombre;
        }
    }

    if (!nombreMovimiento) return false;

    const idBase = normalizarNombreMovimiento(nombreMovimiento);
    const idPokemon = normalizarNombreMovimiento(atacante.pokemon.nombre);
    const idEspecifico = `${idBase}-${idPokemon}`;

    const movimiento = MOVIMIENTOS_REGISTRO[idEspecifico] || MOVIMIENTOS_REGISTRO[idBase];

    if (!movimiento) return false;

    const contexto = {
        enemigos: enemigosVivos,
        aliados: aliadosVivos || [],
        esJugador: atacante.equipo === 'player'
    };

    let objetivo = objetivoPrincipal;
    if (!objetivo) {
        objetivo = movEncontrarObjetivo(
            atacante,
            enemigosVivos,
            movimiento.prioridad || MOV_PRIORIDAD.MAS_CERCANO,
            movimiento.alcance
        );
    }

    if (!objetivo && movimiento.prioridad !== MOV_PRIORIDAD.ALEATORIO) {
        return false;
    }

    try {
        const resultado = movimiento.ejecutar(atacante, objetivo, contexto);
        return resultado !== false;
    } catch (e) {
        console.error(`❌ Error ejecutando movimiento "${nombreMovimiento}" (id: ${idEspecifico} / ${idBase}):`, e);
        return false;
    }
}

function normalizarNombreMovimiento(nombre) {
    if (!nombre) return '';
    return nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ============================================================
// 🛡️ ICONO "ESCUDO ROTO" - Defensa reducida
// ============================================================
// Uso: mostrarIconoEscudoRoto(unidad, duracionSeg, 'fisica' | 'especial')
//
// - Muestra UN SOLO icono 🛡️ en la celda (aunque haya 2 debuffs)
// - Se coloca ENCIMA de la barra de HP, centrado horizontalmente
// - SIN shake (sin animación de temblor)
// - SIN glow/color (sin halo rojo/morado)
// - Usa PNG assets/icons/efectos/escudo-roto.png con fallback a emoji
// - Si ya existe un icono, REFRESCA el timer (no crea otro)
// - Se auto-elimina al terminar la duración o si la unidad muere
// ============================================================

function mostrarIconoEscudoRoto(unidad, duracionSeg, tipo = 'fisica') {
    if (!unidad) return;

    const duracionMs = (duracionSeg || 3) * 1000;

    // 🆕 FIX: esta función YA NO pinta nada en el DOM.
    // Solo marca los flags en la unidad para que renderEscudoRoto()
    // (en render.js) sea el ÚNICO que pinte el icono, al lado de la barra de vida.
    unidad._iconoEscudoRotoFin = performance.now() + duracionMs;
    unidad._iconoEscudoRotoTipo = tipo;

    // Repintar el combate para que renderEscudoRoto() pinte el icono YA.
    if (typeof renderizarCombate === 'function') {
        renderizarCombate();
    }
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.MOV_TIPO = MOV_TIPO;
window.MOV_PRIORIDAD = MOV_PRIORIDAD;
window.MOV_COLOR = MOV_COLOR;
window.MOVIMIENTOS_REGISTRO = MOVIMIENTOS_REGISTRO;
window.ejecutarMovimiento = ejecutarMovimiento;
window.movMostrarEfectoVisual = movMostrarEfectoVisual;
window.movMostrarLineaProyectil = movMostrarLineaProyectil;
window.movMostrarTextoFlotante = movMostrarTextoFlotante;
window.movEncontrarObjetivo = movEncontrarObjetivo;
window.movAplicarQuemadura = movAplicarQuemadura;
window.movLimpiarQuemaduras = movLimpiarQuemaduras;
window.movAsegurarPosicionGlobal = movAsegurarPosicionGlobal;
window.movSetPosicionGlobal = movSetPosicionGlobal;
window.movObtenerPosicionGlobal = movObtenerPosicionGlobal;
window.movGlobalABoard = movGlobalABoard;
window.movDireccionAdelante = movDireccionAdelante;
window.movDireccionAtras = movDireccionAtras;
window.movEnemigosEnLinea = movEnemigosEnLinea;
window.movCasillasEnLinea = movCasillasEnLinea;
window.movCasillasEnArea = movCasillasEnArea;
window.movUnidadEnPosicion = movUnidadEnPosicion;
window.movDistanciaChebyshev = movDistanciaChebyshev;
window.movDistanciaManhattan = movDistanciaManhattan;
window.movMarcarCasillaGlobal = movMarcarCasillaGlobal;
window.movKnockup = movKnockup;
window.movAplicarSlow = movAplicarSlow;
window.movAplicarVeneno = movAplicarVeneno;
window.movAplicarReduccionDefensa = movAplicarReduccionDefensa;
window.movAplicarReduccionDefensas = movAplicarReduccionDefensas;
window.movCurar = movCurar;
window.movAplicarDaño = movAplicarDaño;

window.mostrarIconoEscudoRoto = mostrarIconoEscudoRoto;

// ============================================================
// 🆕 ESCUDO CON FADE PROGRESIVO (helper reutilizable)
// ============================================================
// Uso: aplicarEscudoConFade(unidad, cantidad)
// - 1s con escudo completo
// - 2s de desvanecimiento (10 pasos de 200ms)
// - Total: 3 segundos
//
// - Cancela el fade anterior de la misma unidad si existe
// - Si la unidad muere durante el fade, se limpia automáticamente
// - La clave del fade se guarda en unidad._fadeEscudoId
// ============================================================
function aplicarEscudoConFade(unidad, cantidad, duracionCompletaMs = 1000, duracionFadeMs = 2000, pasos = 10) {
    if (!unidad || cantidad <= 0) return;

    if (unidad._fadeEscudoId) {
        clearInterval(unidad._fadeEscudoId);
        unidad._fadeEscudoId = null;
    }

    unidad.escudoActual = (unidad.escudoActual || 0) + cantidad;
    if (typeof actualizarEscudoVisual === 'function') actualizarEscudoVisual(unidad);

    setTimeout(() => {
        if (!unidad || unidad.hp <= 0 || unidad.muerto) return;

        const escudoAlIniciarFade = unidad.escudoActual;
        if (escudoAlIniciarFade <= 0) return;

        const perdidaPorPaso = escudoAlIniciarFade / pasos;
        const intervaloMs = duracionFadeMs / pasos;
        let paso = 0;

        const fadeInterval = setInterval(() => {
            if (!unidad || unidad.hp <= 0 || unidad.muerto) {
                clearInterval(fadeInterval);
                if (unidad) unidad._fadeEscudoId = null;
                return;
            }
            paso++;
            unidad.escudoActual = Math.max(0, unidad.escudoActual - perdidaPorPaso);
            if (typeof actualizarEscudoVisual === 'function') actualizarEscudoVisual(unidad);
            if (paso >= pasos) {
                clearInterval(fadeInterval);
                unidad._fadeEscudoId = null;
            }
        }, intervaloMs);

        unidad._fadeEscudoId = fadeInterval;
    }, duracionCompletaMs);
}

window.aplicarEscudoConFade = aplicarEscudoConFade;

// ============================================================
// DEBUG
// ============================================================
