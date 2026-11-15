// ============================================================
// SISTEMA DE TORNEO - RIVALES SIMULADOS + RANKING DE VIDA
// ============================================================
// 🆕 v6 — ECONOMÍA REAL DE NIVEL:
//   - El rival sube de nivel PAGANDO el coste exacto de CONFIG.COSTES_NIVEL.
//   - No hay subida gratis por fórmula ni por victorias.
//   - Tope blando de oro (65💰) para que no acumule sin gastar.
//   - Gasto agresivo en rerolls + compras cuando tiene oro.
//   - PvE NO toca la racha (solo PvP real la modifica).
//   - Disco Definitivo solo cuando el rival tiene alguna 2★.
//
// 🆕 v7 — FIXES DE RELLENO Y BANCO:
//   A) Relleno post-fusión (no quedar con < maxSlot)
//   B) Banco se sube al tablero (inicio + final)
//   C) No comprar familias ya presentes como evolución
//      (ej: no comprar Charmander si ya hay Charmeleon)
//   D) forzarFusionesRivalActivo integrado en el flujo
//   E) Tope de oro respetado siempre al final
// ============================================================

window.torneoRivales = window.torneoRivales || [];

// ============================================================
// 🆕 ECONOMÍA DE NIVEL DEL RIVAL (GASTO REAL)
// ============================================================

const _COSTE_NIVEL_RIVAL = {
    2: 4,    // 1→2
    3: 8,    // 2→3
    4: 20,   // 3→4
    5: 24,   // 4→5
    6: 36,   // 5→6
    7: 48,   // 6→7
    8: 60    // 7→8
};

const _TOPE_ORO_RIVAL = 65;

function _costeSubirNivelRival(nivelActual) {
    return _COSTE_NIVEL_RIVAL[nivelActual + 1] || 0;
}

function _intentarSubirNivelRival(rival, oroDisponible, prioridad) {
    if (!rival || rival.nivel >= 8) return false;

    const coste = _costeSubirNivelRival(rival.nivel);
    if (coste <= 0) return false;
    if (oroDisponible < coste) return false;

    if (!prioridad) {
        const unidades = [
            ...(rival._equipoGuardado?.tablero || []),
            ...(rival._equipoGuardado?.banquillo || [])
        ].filter(Boolean).length;
        if (unidades < 4) return false;
    }

    rival.nivel++;
    console.log(`🎭 [avanzarRivalUnTurno] ${rival.nombre} sube a NIVEL ${rival.nivel} (-${coste}💰)`);
    return true;
}

window._costeSubirNivelRival = _costeSubirNivelRival;
window._intentarSubirNivelRival = _intentarSubirNivelRival;
window._TOPE_ORO_RIVAL = _TOPE_ORO_RIVAL;

// ============================================================
// POTENCIAL DE SINERGIA POR RIVAL
// ============================================================
function calcularPotencialRival(rival) {
    if (!rival || !rival.estrategia || !rival.estrategia.tipos || rival.estrategia.tipos.length === 0) {
        return 5;
    }

    const tipos = rival.estrategia.tipos;
    const familias = new Set();

    if (typeof TODOS_POKEMONS !== 'undefined' && typeof getFamiliaEvolutiva === 'function') {
        for (let p of TODOS_POKEMONS) {
            if (!p || !p.tipos) continue;
            if (p.tipos.some(t => tipos.includes(t))) {
                familias.add(getFamiliaEvolutiva(p));
            }
        }
    }

    const bonusTipos = (tipos.length - 1) * 2;
    return familias.size + bonusTipos;
}

// ============================================================
// SELECCIÓN PONDERADA SIN REEMPLAZO
// ============================================================
function seleccionarRivalesPonderados(rivales, cantidad) {
    const elegidos = [];
    const disponibles = [...rivales];
    const pesosDisponibles = disponibles.map(r =>
        Math.max(9, Math.pow(calcularPotencialRival(r), 2))
    );

    for (let i = 0; i < cantidad && disponibles.length > 0; i++) {
        const total = pesosDisponibles.reduce((a, b) => a + b, 0);
        if (total <= 0) break;

        let rand = Math.random() * total;
        let idxElegido = 0;

        for (let j = 0; j < pesosDisponibles.length; j++) {
            rand -= pesosDisponibles[j];
            if (rand <= 0) { idxElegido = j; break; }
        }

        elegidos.push(disponibles[idxElegido]);
        disponibles.splice(idxElegido, 1);
        pesosDisponibles.splice(idxElegido, 1);
    }

    return elegidos;
}

// ============================================================
// INICIALIZAR TORNEO
// ============================================================
function inicializarTorneo() {
    const todosRivales = (window.RIVALES_INFO || []).slice();
    const rivalesTorneo = todosRivales.filter(r => r.nombre !== 'Rival');
    const rivalesElegidos = seleccionarRivalesPonderados(rivalesTorneo, 7);

    const VIDA_INICIAL_TORNEO = 50;

    window.torneoRivales = rivalesElegidos.map(rival => ({
        nombre: rival.nombre,
        avatar: rival.avatar,
        estrategia: rival.estrategia,
        frases: rival.frases,
        vida: VIDA_INICIAL_TORNEO,
        victorias: 0,
        derrotas: 0,
        racha: 0,
        eliminado: false,
        nivel: 1,
        oro: 10,
        poderActual: 0,
        _potencial: calcularPotencialRival(rival),
        _equipoGuardado: null,
        objetosAcumulados: []
    }));

    console.log(`🏆 Torneo inicializado con ${window.torneoRivales.length} rivales (selección ponderada):`);
    window.torneoRivales.forEach(r => {
        const peso = Math.max(9, Math.pow(r._potencial, 2));
        console.log(`   - ${r.nombre} (potencial ${r._potencial}, peso ${peso}, ${VIDA_INICIAL_TORNEO} HP)`);
    });
}

// ============================================================
// RESTAURAR EQUIPO DE UN RIVAL EN EL TABLERO ENEMIGO
// ============================================================
function restaurarEquipoRival(rival, motivo = '') {
    if (!rival) return false;

    for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
    for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;

    const nivelRival = Math.max(1, Math.min(8, Number(rival.nivel) || 1));
    if (typeof enemyLevel !== 'undefined') enemyLevel = nivelRival;
    if (typeof enemyGold !== 'undefined' && typeof rival.oro === 'number') enemyGold = rival.oro;
    if (typeof enemyHealth !== 'undefined' && typeof rival.vida === 'number') enemyHealth = rival.vida;

    const tieneGuardado = rival._equipoGuardado
        && Array.isArray(rival._equipoGuardado.tablero)
        && rival._equipoGuardado.tablero.some(Boolean);

        if (tieneGuardado) {
        const tg = rival._equipoGuardado.tablero;
        const bg = rival._equipoGuardado.banquillo || [];
        for (let i = 0; i < Math.min(enemyBoard.length, tg.length); i++) {
            enemyBoard[i] = tg[i] ? tg[i].clonarParaCombate() : null;
        }
        for (let i = 0; i < Math.min(enemyBanquillo.length, bg.length); i++) {
            enemyBanquillo[i] = bg[i] ? bg[i].clonarParaCombate() : null;
        }
        console.log(`💾 [restaurarEquipoRival] ${rival.nombre}: equipo restaurado (${enemyBoard.filter(Boolean).length} en tablero, ${enemyBanquillo.filter(Boolean).length} en banco) ${motivo}`);

        // 🆕 FIX: volcar objetosAcumulados al baúl del enemigo (sin borrarlos del rival)
        // para que enemyEquiparObjetos pueda equiparlos (incluye Disco Definitivo).
        if (typeof enemyBaulObjetos !== 'undefined' && Array.isArray(enemyBaulObjetos)) {
            enemyBaulObjetos = [];
            if (Array.isArray(rival.objetosAcumulados) && rival.objetosAcumulados.length > 0) {
                const MAX_BAUL_RESTAURAR = (typeof CONFIG !== 'undefined' && CONFIG.MAX_BAUL) ? CONFIG.MAX_BAUL : 8;
                for (const obj of rival.objetosAcumulados) {
                    if (enemyBaulObjetos.length >= MAX_BAUL_RESTAURAR) break;
                    enemyBaulObjetos.push(obj);
                }
            }
        }

        // 🆕 FIX: reequipar objetos (incluye Disco Definitivo) en las unidades restauradas.
        // Así el Disco se ve en la arena aunque el rival NO sea el activo (espía, etc).
        if (typeof enemyEquiparObjetos === 'function') {
            try { enemyEquiparObjetos(); } catch (e) { console.warn('⚠️ enemyEquiparObjetos falló en restaurarEquipoRival:', e); }
        }

        if (typeof enemyPosicionarUnidadesInteligente === 'function') {
            try { enemyPosicionarUnidadesInteligente(); } catch (e) {}
        }
        if (typeof renderizar === 'function') {
            try { renderizar(); } catch (e) {}
        }
        return true;
    }

    if (typeof generarEquipoPlaceholderRival === 'function') {
        const generado = generarEquipoPlaceholderRival(rival);
        for (let i = 0; i < enemyBoard.length; i++) {
            enemyBoard[i] = generado.tablero[i] || null;
        }
        for (let i = 0; i < enemyBanquillo.length; i++) {
            enemyBanquillo[i] = generado.banquillo[i] || null;
        }
        rival._equipoGuardado = {
            tablero: enemyBoard.map(u => u ? u.clonarParaCombate() : null),
            banquillo: enemyBanquillo.map(u => u ? u.clonarParaCombate() : null)
        };
        if (typeof generado.oroGastado === 'number' && generado.oroGastado > 0) {
            if (typeof rival.oro === 'number') {
                rival.oro = Math.max(0, rival.oro - generado.oroGastado);
            }
        }
        console.log(`🎁 [restaurarEquipoRival] ${rival.nombre}: equipo generado desde cero (${enemyBoard.filter(Boolean).length} en tablero) ${motivo}`);

        if (typeof enemyPosicionarUnidadesInteligente === 'function') {
            try { enemyPosicionarUnidadesInteligente(); } catch (e) {}
        }
        if (typeof renderizar === 'function') {
            try { renderizar(); } catch (e) {}
        }
        return true;
    }

    console.warn(`⚠️ [restaurarEquipoRival] ${rival.nombre}: no se pudo restaurar ni generar`);
    return false;
}
window.restaurarEquipoRival = restaurarEquipoRival;

// ============================================================
// 🆕 v7 - AVANZAR UN RIVAL UN TURNO (sin combate)
// ============================================================
// FIXES integrados:
//   A) Relleno post-fusión hasta maxSlot
//   B) Banco se sube al tablero (inicio + final)
//   C) No comprar familias ya presentes como evolución
//   D) forzarFusionesRivalActivo integrado
//   E) Tope de oro respetado siempre
// ============================================================
function avanzarRivalUnTurno(rival) {
    if (!rival || rival.eliminado) return;

    if (!rival._equipoGuardado || !Array.isArray(rival._equipoGuardado.tablero)) {
        rival._equipoGuardado = {
            tablero: new Array(20).fill(null),
            banquillo: new Array(8).fill(null)
        };
    }

    const tablero = rival._equipoGuardado.tablero;
    const banco = rival._equipoGuardado.banquillo || (rival._equipoGuardado.banquillo = new Array(8).fill(null));

    let oroRival = (typeof rival.oro === 'number' && !isNaN(rival.oro)) ? rival.oro : 10;

    const maxSlot = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[rival.nivel])
        ? TABLA_MAX_UNIDADES[rival.nivel]
        : 3;

    let vivos = tablero.filter(Boolean).length;

    const tiposRival = (rival.estrategia && rival.estrategia.tipos) || [];

    let costeMaxPorNivel = 2;
    if (rival.nivel >= 4) costeMaxPorNivel = 3;
    if (rival.nivel >= 6) costeMaxPorNivel = 4;
    if (rival.nivel >= 7) costeMaxPorNivel = 5;

    const RESERVA_RELLENO = 10;

    // ============================================================
    // 🆕 FIX C: helper de familias
    // ============================================================
    function _familiasEnTablero() {
        const set = new Set();
        for (let u of tablero) {
            if (!u || u.esZacian || u.esArticuno) continue;
            const fam = (typeof getFamiliaEvolutivaEnemigo === 'function')
                ? getFamiliaEvolutivaEnemigo(u.pokemon)
                : u.pokemon.nombre;
            if (fam) set.add(fam);
        }
        return set;
    }

    function _puedeComprarFamilia(pokemon, familiasTablero) {
        const fam = (typeof getFamiliaEvolutivaEnemigo === 'function')
            ? getFamiliaEvolutivaEnemigo(pokemon)
            : pokemon.nombre;
        if (!fam) return false;

        // Si la familia NO está en tablero, se puede comprar
        if (!familiasTablero.has(fam)) return true;

        // Si ya está, solo permitir si hay 2 copias 1★ (fusión pendiente)
        let copiasNivel1 = 0;
        for (let u of [...tablero, ...banco]) {
            if (!u || u.esZacian) continue;
            if (u.nivel !== 1) continue;
            const famU = (typeof getFamiliaEvolutivaEnemigo === 'function')
                ? getFamiliaEvolutivaEnemigo(u.pokemon)
                : u.pokemon.nombre;
            if (famU === fam) copiasNivel1++;
        }
        return copiasNivel1 === 2;
    }

    // ============================================================
        // ============================================================
    // 🆕 FIX B: SUBIR BANCO AL TABLERO ANTES DE COMPRAR
    // ============================================================
    {
        let guardiaSubidaBanco = 0;
        while (vivos < maxSlot && guardiaSubidaBanco < 8) {
            guardiaSubidaBanco++;

            const idxBanco = banco.findIndex(u => u && !u.esZacian);
            if (idxBanco === -1) break;

            // 🆕 FIX: usar el patrón melee/backline en vez de findIndex(c => !c)
            const unidadBanco = banco[idxBanco];
            const rolUnidad = (typeof rolColocacionDesdePokemonData === 'function')
                ? rolColocacionDesdePokemonData(unidadBanco.pokemon)
                : 'melee';

            let yaColocadasDelRol = 0;
            for (let t of tablero) {
                if (!t || t.esZacian) continue;
                const esFrontT = (typeof esPokemonFrontlineEnemigo === 'function')
                    ? esPokemonFrontlineEnemigo(t.pokemon)
                    : true;
                if ((esFrontT ? 'melee' : 'backline') === rolUnidad) yaColocadasDelRol++;
            }

            let idxTablero = (typeof obtenerIndiceColocacionInicial === 'function')
                ? obtenerIndiceColocacionInicial('enemy', rolUnidad, yaColocadasDelRol)
                : -1;

            if (idxTablero === -1 || tablero[idxTablero] !== null) {
                idxTablero = tablero.findIndex(c => !c);
            }
            if (idxTablero === -1) break;

            tablero[idxTablero] = unidadBanco;
            banco[idxBanco] = null;
            vivos++;

            console.log(`📤 [avanzarRivalUnTurno] ${rival.nombre} sube ${unidadBanco.pokemon.nombre} del banco al tablero (${vivos}/${maxSlot})`);
        }
    }

    const familiasEnTableroInicial = _familiasEnTablero();

    // ============================================================
    // 1) RELLENO INICIAL (antes de fusiones)
    // ============================================================
    let guardiaRellenoInicial = 0;
    while (vivos < maxSlot && (oroRival - RESERVA_RELLENO) >= 1 && guardiaRellenoInicial < 8) {
        guardiaRellenoInicial++;

        let pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => {
            if (p.base === false || p.esEspecial || p.id === 999) return false;
            if (p.coste > costeMaxPorNivel) return false;
            if (tiposRival.length > 0 && p.tipos && !p.tipos.some(t => tiposRival.includes(t))) return false;
            if (!_puedeComprarFamilia(p, familiasEnTableroInicial)) return false;
            return true;
        });

        if (pool.length === 0) {
            pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => {
                if (p.base === false || p.esEspecial || p.id === 999) return false;
                if (p.coste > costeMaxPorNivel) return false;
                if (!_puedeComprarFamilia(p, familiasEnTableroInicial)) return false;
                return true;
            });
        }

        if (pool.length === 0) break;

        if (rival.nivel >= 6) {
            const poolAlto = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p =>
                p.base !== false && p.coste >= 4 && p.coste <= 5 &&
                (tiposRival.length === 0 || (p.tipos && p.tipos.some(t => tiposRival.includes(t)))) &&
                _puedeComprarFamilia(p, familiasEnTableroInicial)
            );
            if (poolAlto.length > 0) pool = [...pool, ...poolAlto];
        }

                const p = pool[Math.floor(Math.random() * pool.length)];
        if (!p || (oroRival - RESERVA_RELLENO) < p.coste) break;

        const u = new Unidad(p, 1, p.id, p.coste);
        u.equipo = 'enemy';

        // 🆕 FIX: colocar respetando el patrón melee/backline
        const rolPokemon = (typeof rolColocacionDesdePokemonData === 'function')
            ? rolColocacionDesdePokemonData(p)
            : 'melee';

        let yaColocadasDelRol = 0;
        for (let t of tablero) {
            if (!t || t.esZacian) continue;
            const esFrontT = (typeof esPokemonFrontlineEnemigo === 'function')
                ? esPokemonFrontlineEnemigo(t.pokemon)
                : true;
            if ((esFrontT ? 'melee' : 'backline') === rolPokemon) yaColocadasDelRol++;
        }

        let huecoTablero = (typeof obtenerIndiceColocacionInicial === 'function')
            ? obtenerIndiceColocacionInicial('enemy', rolPokemon, yaColocadasDelRol)
            : -1;

        if (huecoTablero === -1 || tablero[huecoTablero] !== null) {
            huecoTablero = tablero.findIndex(x => !x);
        }

        if (huecoTablero === -1) {
            const huecoBanco = banco.findIndex(x => !x);
            if (huecoBanco === -1) break;
            banco[huecoBanco] = u;
        } else {
            tablero[huecoTablero] = u;
            vivos++;
            const famNueva = (typeof getFamiliaEvolutivaEnemigo === 'function')
                ? getFamiliaEvolutivaEnemigo(p)
                : p.nombre;
            if (famNueva) familiasEnTableroInicial.add(famNueva);
        }
        oroRival -= p.coste;
    }

    // ============================================================
    // 2) FUSIONES
    // ============================================================
    let fusionIter = 0;
    while (fusionIter < 20) {
        fusionIter++;
        const grupos = {};
        const todas = [
            ...tablero.map((u, i) => u ? { u, i, zona: 'tablero' } : null).filter(Boolean),
            ...banco.map((u, i) => u ? { u, i, zona: 'banco' } : null).filter(Boolean)
        ];
        for (const item of todas) {
            const fam = (typeof getFamiliaEvolutivaEnemigo === 'function')
                ? getFamiliaEvolutivaEnemigo(item.u.pokemon)
                : item.u.pokemon.nombre;
            const key = `${fam}_${item.u.nivel}`;
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(item);
        }

        let hizoFusion = false;
        for (const key in grupos) {
            const items = grupos[key];
            if (items.length < 3) continue;

            const primero = items[0];
            const original = primero.u;
            const evol = original.pokemon.evolucion;
            const evolData = evol ? (typeof getPokemonPorNombre === 'function' ? getPokemonPorNombre(evol) : null) : null;
            const baseData = evolData || original.pokemon;
            const nuevaNivel = original.nivel + 1;
            if (nuevaNivel > 3) continue;

            const nueva = new Unidad(baseData, nuevaNivel, original.baseId, original.costeOriginal);
            nueva.equipo = 'enemy';
            if (nuevaNivel >= 2) nueva.movSecundarioDesbloqueado = true;

            let normalesEquipados = 0;
            let discoEquipado = false;
            for (const it of items.slice(0, 3)) {
                for (const obj of (it.u.objetos || [])) {
                    const data = OBJETOS[obj];
                    if (!data) continue;
                    const esDisco = data.efecto && data.efecto.esDiscoUlti;
                    if (esDisco && !discoEquipado) {
                        try { aplicarObjeto(nueva, obj); discoEquipado = true; } catch (e) {}
                    } else if (!esDisco && normalesEquipados < 2) {
                        try { aplicarObjeto(nueva, obj); normalesEquipados++; } catch (e) {}
                    } else {
                        if (rival.objetosAcumulados && rival.objetosAcumulados.length < CONFIG.MAX_BAUL) {
                            rival.objetosAcumulados.push(obj);
                        }
                    }
                }
            }

            if (primero.zona === 'tablero') tablero[primero.i] = nueva;
            else banco[primero.i] = nueva;

            for (let k = 1; k < 3; k++) {
                const it = items[k];
                if (it.zona === 'tablero') tablero[it.i] = null;
                else banco[it.i] = null;
            }

            hizoFusion = true;
            console.log(`🤖 [avanzarRivalUnTurno] ${rival.nombre}: fusión ${original.pokemon.nombre} → ${baseData.nombre} ${nuevaNivel}★`);
            break;
        }
        if (!hizoFusion) break;
    }

    // Recalcular vivos después de fusionar
    vivos = tablero.filter(Boolean).length;

    // ============================================================
    // 🆕 FIX A: RELLENO POST-FUSIÓN
    // ============================================================
    {
        const familiasPost = _familiasEnTablero();
        let guardiaPost = 0;
        while (vivos < maxSlot && (oroRival - RESERVA_RELLENO) >= 1 && guardiaPost < 8) {
            guardiaPost++;

            let pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => {
                if (p.base === false || p.esEspecial || p.id === 999) return false;
                if (p.coste > costeMaxPorNivel) return false;
                if (tiposRival.length > 0 && p.tipos && !p.tipos.some(t => tiposRival.includes(t))) return false;
                if (!_puedeComprarFamilia(p, familiasPost)) return false;
                return true;
            });

            if (pool.length === 0) {
                pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => {
                    if (p.base === false || p.esEspecial || p.id === 999) return false;
                    if (p.coste > costeMaxPorNivel) return false;
                    if (!_puedeComprarFamilia(p, familiasPost)) return false;
                    return true;
                });
            }

            if (pool.length === 0) break;

                       const p = pool[Math.floor(Math.random() * pool.length)];
            if (!p || (oroRival - RESERVA_RELLENO) < p.coste) break;

            const u = new Unidad(p, 1, p.id, p.coste);
            u.equipo = 'enemy';

            // 🆕 FIX: colocar respetando el patrón melee/backline
            const rolPokemon = (typeof rolColocacionDesdePokemonData === 'function')
                ? rolColocacionDesdePokemonData(p)
                : 'melee';

            let yaColocadasDelRol = 0;
            for (let t of tablero) {
                if (!t || t.esZacian) continue;
                const esFrontT = (typeof esPokemonFrontlineEnemigo === 'function')
                    ? esPokemonFrontlineEnemigo(t.pokemon)
                    : true;
                if ((esFrontT ? 'melee' : 'backline') === rolPokemon) yaColocadasDelRol++;
            }

            let huecoTablero = (typeof obtenerIndiceColocacionInicial === 'function')
                ? obtenerIndiceColocacionInicial('enemy', rolPokemon, yaColocadasDelRol)
                : -1;

            if (huecoTablero === -1 || tablero[huecoTablero] !== null) {
                huecoTablero = tablero.findIndex(x => !x);
            }

            if (huecoTablero === -1) {
                const huecoBanco = banco.findIndex(x => !x);
                if (huecoBanco === -1) break;
                banco[huecoBanco] = u;
            } else {
                tablero[huecoTablero] = u;
                vivos++;
                const famNueva = (typeof getFamiliaEvolutivaEnemigo === 'function')
                    ? getFamiliaEvolutivaEnemigo(p)
                    : p.nombre;
                if (famNueva) familiasPost.add(famNueva);

                console.log(`🛒 [avanzarRivalUnTurno] ${rival.nombre} rellena tablero (post-fusión) con ${p.nombre} (-${p.coste}💰, ${vivos}/${maxSlot})`);
            }
            oroRival -= p.coste;
        }
    }

    // ============================================================
    // 3) COMPRA DE OBJETO (ronda de objetos)
    // ============================================================
    const esRondaObjetosRival = (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase));

    if (esRondaObjetosRival && !rival._objetoCompradoEstaRonda) {
        rival._objetoCompradoEstaRonda = true;

        const objetosPosibles = (typeof generarObjetosTienda === 'function') ? generarObjetosTienda() : [];

        if (objetosPosibles.length > 0) {
            let mejorObjeto = null;
            let mejorScore = -Infinity;

            for (let nombreObjeto of objetosPosibles) {
                const obj = OBJETOS[nombreObjeto];
                if (!obj) continue;
                let score = 0;
                if (obj.efecto && obj.efecto.tipoBonus) {
                    if (rival.estrategia && rival.estrategia.tipos && rival.estrategia.tipos.includes(obj.efecto.tipoBonus)) score += 100;
                    else score -= 50;
                } else if (obj.efecto) {
                    if (obj.efecto.damagePercent || obj.efecto.attackPercent || obj.efecto.spAttackPercent) score += 10;
                    if (obj.efecto.hpBonus || obj.efecto.defense || obj.efecto.spDefense) score += 8;
                    if (obj.efecto.regenPorSegundo || obj.efecto.escudoPorcentaje) score += 12;
                }
                if (obj.requerido) {
                    const tieneTipo = [...tablero, ...banco].some(u =>
                        u && u.pokemon && u.pokemon.tipos && u.pokemon.tipos.includes(obj.requerido)
                    );
                    if (!tieneTipo) score = -999;
                }
                if (score > mejorScore) { mejorScore = score; mejorObjeto = nombreObjeto; }
            }

            if (mejorObjeto) {
                if (!rival.objetosAcumulados) rival.objetosAcumulados = [];
                if (rival.objetosAcumulados.length < ((typeof CONFIG !== 'undefined' && CONFIG.MAX_BAUL) ? CONFIG.MAX_BAUL : 8)) {
                    rival.objetosAcumulados.push(mejorObjeto);
                    console.log(`🤖 [avanzarRivalUnTurno] ${rival.nombre} compró ${mejorObjeto} (ronda de objetos ${fase})`);
                }
            }
        }
    } else if (!esRondaObjetosRival) {
        rival._objetoCompradoEstaRonda = false;
    }

    // ============================================================
    // 4) EQUIPAR OBJETOS ACUMULADOS
    // ============================================================
    if (rival.objetosAcumulados && rival.objetosAcumulados.length > 0) {
        const unidades = [...tablero.map(u => u).filter(Boolean), ...banco.map(u => u).filter(Boolean)];
        while (rival.objetosAcumulados.length > 0 && unidades.length > 0) {
            const obj = rival.objetosAcumulados.shift();
            const data = OBJETOS[obj];
            if (!data) continue;
            const esDisco = data.efecto && data.efecto.esDiscoUlti;

            let target = null;
            for (const u of unidades) {
                if (!u || u.esZacian || u.esArticuno || u.noEquiparObjetos) continue;
                const normales = (u.objetos || []).filter(o => {
                    const od = OBJETOS[o];
                    return !(od && od.efecto && od.efecto.esDiscoUlti);
                });
                const discos = (u.objetos || []).filter(o => {
                    const od = OBJETOS[o];
                    return od && od.efecto && od.efecto.esDiscoUlti;
                });
                if (esDisco) {
                    if (discos.length >= 1) continue;
                    if (u.nivel < 2) continue;
                } else {
                    if (normales.length >= 2) continue;
                }
                if (data.requerido) {
                    const tieneTipo = u.pokemon.tipos && u.pokemon.tipos.includes(data.requerido);
                    if (!tieneTipo) continue;
                }
                target = u;
                break;
            }
            if (!target) {
                if (!rival.objetosAcumulados) rival.objetosAcumulados = [];
                rival.objetosAcumulados.push(obj);
                break;
            }
            try { aplicarObjeto(target, obj); } catch (e) {}
        }
    }

    // ============================================================
    // 5) SUBIR NIVEL (PAGANDO)
    // ============================================================
    const vivosEnTablero = tablero.filter(u => u && !u.esZacian).length;
    const equipoCompleto = vivosEnTablero >= maxSlot;

    let guardiaSubida = 0;
    while (guardiaSubida < 4 && oroRival >= _costeSubirNivelRival(rival.nivel)) {
        guardiaSubida++;
        const coste = _costeSubirNivelRival(rival.nivel);

        const debeSubir = equipoCompleto
            || (fase >= 6 && oroRival >= coste + 10)
            || (fase >= 10);

        if (!debeSubir) break;

        oroRival -= coste;
        rival.nivel++;
        console.log(`🎭 [avanzarRivalUnTurno] ${rival.nombre} sube a NIVEL ${rival.nivel} (-${coste}💰)`);

        if ((rival.nivel === 5 || rival.nivel === 8)) {
            const tieneAlguna2Estrellas = [...tablero, ...banco].some(u => u && !u.esZacian && !u.esArticuno && u.nivel >= 2);
            if (!rival.objetosAcumulados) rival.objetosAcumulados = [];
            const tieneDisco = rival.objetosAcumulados.includes("Disco Definitivo");
            if (!tieneDisco && tieneAlguna2Estrellas) {
                rival.objetosAcumulados.push("Disco Definitivo");
                console.log(`💿 [avanzarRivalUnTurno] ${rival.nombre} consiguió un DISCO DEFINITIVO! (Nivel ${rival.nivel})`);
            }
        }
    }

    // ============================================================
    // 6) GASTAR ORO EN COMPRAS/REROLLS (con reserva + filtro familia)
    // ============================================================
    const RESERVA_MINIMA = 10;
    let intentosGasto = 0;
    const MAX_INTENTOS_GASTO = 12;
    const tiposRivalLocal = (rival.estrategia && rival.estrategia.tipos) || [];

    function _umbralGastoActual() {
        const oroDisponible = oroRival - RESERVA_MINIMA;
        if (oroDisponible <= 0) return Infinity;
        if (oroDisponible < 10) return Infinity;
        if (oroDisponible < 20) return 1;
        return MAX_INTENTOS_GASTO;
    }

    const familiasGasto = _familiasEnTablero();

    while (intentosGasto < _umbralGastoActual()) {
        intentosGasto++;

        const nombresConDos = {};
        for (let u of [...tablero, ...banco]) {
            if (!u || u.esZacian) continue;
            if (u.nivel !== 1) continue;
            nombresConDos[u.pokemon.nombre] = (nombresConDos[u.pokemon.nombre] || 0) + 1;
        }
        const nombresBuscados = Object.keys(nombresConDos).filter(n => nombresConDos[n] === 2);

        let comproAlgo = false;

        // Intento 1: completar fusión
        if (nombresBuscados.length > 0 && (oroRival - RESERVA_MINIMA) >= 2) {
            const vivosTablero = tablero.filter(Boolean).length;
            const hayHuecoTablero = vivosTablero < maxSlot && tablero.some(c => c === null);
            const hayHuecoBanco = banco.some(c => c === null);

            if (!hayHuecoTablero && !hayHuecoBanco) break;

            oroRival -= 2;
            if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();

            const enTienda = (typeof enemyTienda !== 'undefined') ? enemyTienda : [];
            const candidatoFusion = enTienda.find(p =>
                p && nombresBuscados.includes(p.nombre) &&
                getCopiasDisponibles(p) > 0 &&
                oroRival >= p.coste
            );

            if (candidatoFusion && consumirDelPool(candidatoFusion.id)) {
                const nueva = new Unidad(candidatoFusion, 1, candidatoFusion.id, candidatoFusion.coste);
                nueva.equipo = 'enemy';

                const huecoBanco = banco.findIndex(c => c === null);
                if (huecoBanco !== -1) {
                    banco[huecoBanco] = nueva;
                } else if (hayHuecoTablero) {
                    const huecoTab = tablero.findIndex(c => c === null);
                    if (huecoTab !== -1) tablero[huecoTab] = nueva;
                    else { devolverAlPool(candidatoFusion.id); continue; }
                } else {
                    devolverAlPool(candidatoFusion.id);
                    continue;
                }

                oroRival -= candidatoFusion.coste;
                comproAlgo = true;
                console.log(`🔥 [avanzarRivalUnTurno] ${rival.nombre} completó fusión: ${candidatoFusion.nombre} (-${candidatoFusion.coste}💰, ${oroRival}💰)`);
            }
        }

        // Intento 2: comprar algo útil (con filtro de familia)
        if (!comproAlgo && (oroRival - RESERVA_MINIMA) >= 10) {
            const vivosTablero = tablero.filter(Boolean).length;
            const hayHuecoTablero = vivosTablero < maxSlot && tablero.some(c => c === null);
            const hayHuecoBanco = banco.some(c => c === null);

            if (!hayHuecoTablero && !hayHuecoBanco) break;

            oroRival -= 2;
            if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();

            const enTienda = (typeof enemyTienda !== 'undefined') ? enemyTienda : [];

            const candidato = enTienda.find(p =>
                p &&
                getCopiasDisponibles(p) > 0 &&
                oroRival >= p.coste &&
                (tiposRivalLocal.length === 0 || (p.tipos && p.tipos.some(t => tiposRivalLocal.includes(t)))) &&
                _puedeComprarFamilia(p, familiasGasto)
            ) || enTienda.find(p =>
                p && getCopiasDisponibles(p) > 0 && oroRival >= p.coste &&
                _puedeComprarFamilia(p, familiasGasto)
            );

            if (candidato && consumirDelPool(candidato.id)) {
                const nueva = new Unidad(candidato, 1, candidato.id, candidato.coste);
                nueva.equipo = 'enemy';

                const huecoBanco = banco.findIndex(c => c === null);

                if (huecoBanco !== -1) {
                    banco[huecoBanco] = nueva;
                } else if (hayHuecoTablero) {
                    const huecoTab = tablero.findIndex(c => c === null);
                    if (huecoTab !== -1) tablero[huecoTab] = nueva;
                    else { devolverAlPool(candidato.id); continue; }
                } else {
                    devolverAlPool(candidato.id);
                    continue;
                }

                oroRival -= candidato.coste;
                comproAlgo = true;
                const famNueva = (typeof getFamiliaEvolutivaEnemigo === 'function')
                    ? getFamiliaEvolutivaEnemigo(candidato)
                    : candidato.nombre;
                if (famNueva) familiasGasto.add(famNueva);
                console.log(`🛒 [avanzarRivalUnTurno] ${rival.nombre} compró ${candidato.nombre} (-${candidato.coste}💰, ${oroRival}💰)`);
            }
        }

        if (!comproAlgo) break;
    }

    // ============================================================
    // 🆕 FIX E: TOPE DE ORO (siempre al final)
    // ============================================================
    if (oroRival > _TOPE_ORO_RIVAL) {
        const exceso = oroRival - _TOPE_ORO_RIVAL;
        oroRival = _TOPE_ORO_RIVAL;
        console.log(`💰 [avanzarRivalUnTurno] ${rival.nombre}: oro limitado a ${_TOPE_ORO_RIVAL} (descartados ${exceso}💰)`);
    }

    rival.oro = oroRival;

        // ============================================================
    // 🆕 FIX B (2/2): volver a subir banco por si quedó algo
    // ============================================================
    {
        let guardiaFinal = 0;
        let vivosFinal = tablero.filter(Boolean).length;
        while (vivosFinal < maxSlot && guardiaFinal < 8) {
            guardiaFinal++;
            const idxBanco = banco.findIndex(u => u && !u.esZacian);
            if (idxBanco === -1) break;

            // 🆕 FIX: usar el patrón melee/backline
            const unidadBanco = banco[idxBanco];
            const rolUnidad = (typeof rolColocacionDesdePokemonData === 'function')
                ? rolColocacionDesdePokemonData(unidadBanco.pokemon)
                : 'melee';

            let yaColocadasDelRol = 0;
            for (let t of tablero) {
                if (!t || t.esZacian) continue;
                const esFrontT = (typeof esPokemonFrontlineEnemigo === 'function')
                    ? esPokemonFrontlineEnemigo(t.pokemon)
                    : true;
                if ((esFrontT ? 'melee' : 'backline') === rolUnidad) yaColocadasDelRol++;
            }

            let idxTablero = (typeof obtenerIndiceColocacionInicial === 'function')
                ? obtenerIndiceColocacionInicial('enemy', rolUnidad, yaColocadasDelRol)
                : -1;

            if (idxTablero === -1 || tablero[idxTablero] !== null) {
                idxTablero = tablero.findIndex(c => !c);
            }
            if (idxTablero === -1) break;

            tablero[idxTablero] = unidadBanco;
            banco[idxBanco] = null;
            vivosFinal++;
        }
    }

    const tableroFinal = tablero.filter(Boolean).length;
    console.log(`🤖 [avanzarRivalUnTurno] ${rival.nombre}: nivel ${rival.nivel}, ${tableroFinal}/${maxSlot} unidades, ${oroRival}💰`);

    rival._equipoGuardado = {
        tablero: tablero.map(u => u ? u.clonarParaCombate() : null),
        banquillo: banco.map(u => u ? u.clonarParaCombate() : null)
    };
}
window.avanzarRivalUnTurno = avanzarRivalUnTurno;

// ============================================================
// FORZAR FUSIONES DEL RIVAL ACTIVO
// ============================================================
function forzarFusionesRivalActivo() {
    if (!window.rivalActual) return;
    if (typeof enemyBoard === 'undefined' || typeof enemyBanquillo === 'undefined') return;
    if (typeof enemyTienda === 'undefined' || typeof enemyGold === 'undefined') return;
    if (typeof generarTiendaEnemigo !== 'function') return;
    if (typeof consumirDelPool !== 'function') return;
    if (typeof getCopiasDisponibles !== 'function') return;
    if (typeof Unidad === 'undefined') return;

    const conteo = {};
    for (let u of enemyBoard) {
        if (!u || u.esZacian || u.esArticuno) continue;
        if (u.nivel !== 1) continue;
        const n = u.pokemon.nombre;
        conteo[n] = (conteo[n] || 0) + 1;
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian || u.esArticuno) continue;
        if (u.nivel !== 1) continue;
        const n = u.pokemon.nombre;
        conteo[n] = (conteo[n] || 0) + 1;
    }

    const nombresConDos = Object.keys(conteo).filter(n => conteo[n] === 2);

    if (nombresConDos.length === 0) return;

    console.log(`🔨 [forzarFusiones] ${window.rivalActual.nombre} tiene ${nombresConDos.length} Pokémon a 2 copias: ${nombresConDos.join(', ')}`);

    for (let reroll = 0; reroll < 6 && enemyGold >= 2; reroll++) {
        const hayTercera = enemyTienda.some(p =>
            p && nombresConDos.includes(p.nombre) && getCopiasDisponibles(p) > 0
        );
        if (hayTercera) break;
        enemyGold -= 2;
        generarTiendaEnemigo();
        console.log(`🎲 [forzarFusiones] ${window.rivalActual.nombre} reroll forzado para completar fusión (${reroll + 1}/6)`);
    }

    let compradaAlguna = false;
    for (let nombre of nombresConDos) {
        const p = enemyTienda.find(x => x && x.nombre === nombre && getCopiasDisponibles(x) > 0);
        if (!p) continue;
        if (enemyGold < p.coste) continue;
        if (!consumirDelPool(p.id)) continue;

        const nueva = new Unidad(p, 1, p.id, p.coste);
        nueva.equipo = 'enemy';

        const huecoBanco = enemyBanquillo.findIndex(c => c === null);
        if (huecoBanco !== -1) {
            enemyBanquillo[huecoBanco] = nueva;
        } else {
            const huecoTablero = enemyBoard.findIndex(c => c === null);
            if (huecoTablero !== -1) {
                enemyBoard[huecoTablero] = nueva;
            } else {
                if (typeof devolverAlPool === 'function') devolverAlPool(p.id);
                continue;
            }
        }

        enemyGold -= p.coste;
        const idxT = enemyTienda.indexOf(p);
        if (idxT !== -1) enemyTienda.splice(idxT, 1);

        console.log(`🛒 [forzarFusiones] ${window.rivalActual.nombre} compró 3ª copia de ${nombre} para fusión forzada`);
        compradaAlguna = true;
        break;
    }

    if (typeof enemyVerificarTodasLasFusiones === 'function') {
        enemyVerificarTodasLasFusiones();
    }
}
window.forzarFusionesRivalActivo = forzarFusionesRivalActivo;

// ============================================================
// CALCULAR PODER DE UN RIVAL
// ============================================================
function calcularPoderRival(rival) {
    if (!rival) return 0;
    return (rival.nivel || 1) * 100 + (rival.victorias || 0) * 50 + (rival.derrotas || 0) * 20;
}

// ============================================================
// SIMULAR COMBATES ENTRE RIVALES (rondas PvP)
// ============================================================
function simularCombatesRivales(rivalDelJugador, parejasRonda) {
    if (!window.torneoRivales || window.torneoRivales.length === 0) return;

    if (typeof fase !== 'undefined' && fase <= 1) {
        console.log(`👾 Ronda ${fase} (PvE de arranque): no se simulan combates entre rivales.`);
        return;
    }

    if (window.torneoRivales) {
        window.torneoRivales.forEach(r => {
            r._estadoRonda = null;
            r._danoRonda = null;
        });
    }

    const rivalesVivos = window.torneoRivales.filter(r =>
        !r.eliminado && r.nombre !== (rivalDelJugador ? rivalDelJugador.nombre : null)
    );

    const nombreExcluido = (rivalDelJugador && rivalDelJugador.nombre) ? rivalDelJugador.nombre : '(ninguno)';

    console.log(`🎲 [TORNEO] Simulación de ronda ${fase}`);
    console.log(`   🎭 Rival del jugador (EXCLUIDO de simulación): ${nombreExcluido}`);
    console.log(`   🎭 Rival en pantalla (window.rivalActual): ${window.rivalActual ? window.rivalActual.nombre : '(ninguno)'}`);
    console.log(`   👥 Rivales que SÍ simulan (${rivalesVivos.length}):`);
    rivalesVivos.forEach(r => {
        console.log(`      - ${r.nombre} (HP ${r.vida}, nivel ${r.nivel}, ${r.oro || 0}💰)`);
    });

    if (rivalesVivos.length < 2) {
        console.log(`   ⚠️ Menos de 2 rivales para simular. El rival suelto pierde HP por inanición.`);
        for (const r of rivalesVivos) {
            const daño = 3 + Math.floor(Math.random() * 3);
            r.vida = Math.max(0, r.vida - daño);
            r._estadoRonda = 'loss';
            r._danoRonda = daño;
            r.derrotas = (r.derrotas || 0) + 1;
            r.racha = r.racha < 0 ? r.racha - 1 : -1;
            if (r.vida <= 0) {
                r.eliminado = true;
                console.log(`   💀 ${r.nombre} ELIMINADO (sin rival, -${daño} HP)`);
            }
        }
        return;
    }

    const parejasFuente = (Array.isArray(parejasRonda) && parejasRonda.length > 0)
        ? parejasRonda
        : ((window._rankingEmparejado && Array.isArray(window._parejasRanking))
            ? window._parejasRanking
            : null);

    let parejasSimulacion = null;
    const solos = [];

    if (parejasFuente && parejasFuente.length > 0) {
        const mapaRivales = new Map();
        rivalesVivos.forEach(r => mapaRivales.set(r.nombre, r));

        parejasSimulacion = [];
        for (const p of parejasFuente) {
            const miembros = (Array.isArray(p) ? p : [])
                .map(nombre => mapaRivales.get(nombre))
                .filter(Boolean);

            if (miembros.length === 2) parejasSimulacion.push(miembros);
            else if (miembros.length === 1) solos.push(miembros[0]);
        }

        console.log(`🔗 [TORNEO] Parejas de la ronda terminada: ${parejasSimulacion.length} combate(s), ${solos.length} descanso(s)`);
    }

    let barajados;
    if (parejasSimulacion) {
        barajados = parejasSimulacion.flat();
    } else {
        barajados = [...rivalesVivos];
        for (let i = barajados.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [barajados[i], barajados[j]] = [barajados[j], barajados[i]];
        }

        if (barajados.length % 2 === 1) {
            const suelto = barajados.pop();
            if (suelto) solos.push(suelto);
        }
    }

    function calcularIngresoRival(rival, gano) {
        const oroActual = (typeof rival.oro === 'number' && !isNaN(rival.oro)) ? rival.oro : 10;
        let ingreso = 5;
        ingreso += Math.min(3, Math.floor(oroActual / 10));
        let rachaBonus = 0;
        if (rival.racha >= 5) rachaBonus = 3;
        else if (rival.racha >= 3) rachaBonus = 2;
        else if (rival.racha >= 2) rachaBonus = 1;
        else if (rival.racha <= -4) rachaBonus = 2;
        else if (rival.racha <= -2) rachaBonus = 1;
        ingreso += rachaBonus;
        const nivelRival = (typeof rival.nivel === 'number' && !isNaN(rival.nivel)) ? rival.nivel : 1;
        const nivelJugadorActual = (typeof nivelJugador === 'number') ? nivelJugador : 1;
        ingreso += Math.max(0, nivelJugadorActual - nivelRival);
        if (gano) ingreso += 1;
        return Math.max(0, Math.floor(ingreso));
    }

    for (const suelto of solos) {
        if (!suelto || suelto.eliminado) continue;
        const ingresoBye = calcularIngresoRival(suelto, false);
        suelto.oro = Math.min(
            (typeof suelto.oro === 'number' ? suelto.oro : 10) + ingresoBye,
            _TOPE_ORO_RIVAL
        );
        suelto._estadoRonda = 'bye';
        suelto._danoRonda = null;
        console.log(`   😴 ${suelto.nombre}: DESCANSA esta ronda (+${ingresoBye} oro, sin combate)`);
    }

    const resultados = [];

    for (let i = 0; i < barajados.length - 1; i += 2) {
        const r1 = barajados[i];
        const r2 = barajados[i + 1];
        if (!r1 || !r2) continue;

        const poder1 = calcularPoderRival(r1);
        const poder2 = calcularPoderRival(r2);
        const prob1 = poder1 / (poder1 + poder2);

        const r1Gana = Math.random() < prob1;

        const ganador = r1Gana ? r1 : r2;
        const perdedor = r1Gana ? r2 : r1;

        const vivasGanador = 1 + Math.floor(Math.random() * 4);
        const rondaTerminada = (typeof fase === 'number') ? fase - 1 : undefined;
        const daño = (typeof getDañoRealPorDerrota === 'function')
            ? getDañoRealPorDerrota(vivasGanador, rondaTerminada)
            : 5;
        perdedor.vida = Math.max(0, perdedor.vida - daño);

        ganador._estadoRonda = 'win';
        ganador._danoRonda = null;
        perdedor._estadoRonda = 'loss';
        perdedor._danoRonda = daño;

        ganador.victorias++;
        ganador.racha = ganador.racha > 0 ? ganador.racha + 1 : 1;
        perdedor.derrotas++;
        perdedor.racha = perdedor.racha < 0 ? perdedor.racha - 1 : -1;

        const ingresoGanador = calcularIngresoRival(ganador, true);
        const ingresoPerdedor = calcularIngresoRival(perdedor, false);

        const oroGanadorActual = (typeof ganador.oro === 'number' ? ganador.oro : 10);
        const oroPerdedorActual = (typeof perdedor.oro === 'number' ? perdedor.oro : 10);

        ganador.oro = Math.min(oroGanadorActual + ingresoGanador, _TOPE_ORO_RIVAL);
        perdedor.oro = Math.min(oroPerdedorActual + ingresoPerdedor, _TOPE_ORO_RIVAL);

        console.log(`💰 ${ganador.nombre} (gana): +${ingresoGanador} oro → ${ganador.oro}💰`);
        console.log(`💰 ${perdedor.nombre} (pierde): +${ingresoPerdedor} oro → ${perdedor.oro}💰`);

        if (perdedor.vida <= 0) {
            perdedor.eliminado = true;
            console.log(`💀 ${perdedor.nombre} ELIMINADO del torneo`);
        }

        resultados.push({ ganador: ganador.nombre, perdedor: perdedor.nombre, daño });
    }

    if (resultados.length > 0) {
        console.log(`⚔️ Combates simulados entre rivales (${resultados.length}):`);
        resultados.forEach((r, i) => {
            const ganador = window.torneoRivales.find(x => x.nombre === r.ganador);
            const perdedor = window.torneoRivales.find(x => x.nombre === r.perdedor);
            const hpG = ganador ? ganador.vida : '?';
            const hpP = perdedor ? perdedor.vida : '?';
            console.log(`   ${i + 1}. ${r.ganador} (${hpG} HP) venció a ${r.perdedor} (${hpP} HP, -${r.daño})`);
        });
    }

    const vivos = window.torneoRivales.filter(r => !r.eliminado);
    const conVidaCompleta = vivos.filter(r => r.vida >= 50).length;
    const conVidaMenor = vivos.filter(r => r.vida < 50 && r.vida > 0).length;

    console.log(`📊 [TORNEO] Estado tras la simulación:`);
    console.log(`   🏆 Total rivales vivos: ${vivos.length}`);
    console.log(`   💚 Con vida completa (≥50 HP): ${conVidaCompleta}`);
    console.log(`   🩸 Con vida reducida (<50 HP): ${conVidaMenor}`);
    console.log(`   🎮 Tú (jugador): ${vidaJugador} HP`);
    vivos.forEach(r => {
        const marca = r.vida >= 50 ? '💚' : '🩸';
        console.log(`      ${marca} ${r.nombre}: ${r.vida} HP (nivel ${r.nivel}, ${r.oro || 0}💰)`);
    });
}

// ============================================================
// SIMULAR COMBATES PvE ENTRE RIVALES Y MONSTRUOS
// ============================================================
function simularCombatesPvE(rondaPvE, rivalDelJugador) {
    if (!window.torneoRivales || window.torneoRivales.length === 0) return;

    const r = (typeof rondaPvE === 'number') ? rondaPvE : fase;

    const esFaseArranque = (r === 1);

    const configMonstruo = (typeof MONSTRUOS_PVE !== 'undefined') ? MONSTRUOS_PVE[r] : null;
    const nombreMonstruo = configMonstruo ? configMonstruo.nombre : `Monstruo ronda ${r}`;

    if (window.torneoRivales) {
        window.torneoRivales.forEach(rv => {
            rv._estadoRonda = null;
            rv._danoRonda = null;
        });
    }

    const rivales = window.torneoRivales.filter(x =>
        !x.eliminado && x.nombre !== (rivalDelJugador ? rivalDelJugador.nombre : null)
    );

    console.log(`👾 [TORNEO] Ronda PvE ${r} (${nombreMonstruo}) — recompensa gratuita para todos`);
    console.log(`   🎭 Rival del jugador (EXCLUIDO, ya peleó contra el monstruo real): ${rivalDelJugador ? rivalDelJugador.nombre : '(ninguno)'}`);
    console.log(`   👥 Rivales que reciben recompensa (${rivales.length}):`);

    if (rivales.length === 0) return;

    for (const rival of rivales) {
        const nivelRival = rival.nivel || 1;
        const oroActual = (typeof rival.oro === 'number' && !isNaN(rival.oro)) ? rival.oro : 10;

        let ingreso = 0;

        if (!esFaseArranque) {
            ingreso = 5;
            ingreso += Math.min(3, Math.floor(oroActual / 10));
            let rachaBonus = 0;
            if (rival.racha >= 5) rachaBonus = 3;
            else if (rival.racha >= 3) rachaBonus = 2;
            else if (rival.racha >= 2) rachaBonus = 1;
            else if (rival.racha <= -4) rachaBonus = 2;
            else if (rival.racha <= -2) rachaBonus = 1;
            ingreso += rachaBonus;
            const nivelJugadorActual = (typeof nivelJugador === 'number') ? nivelJugador : 1;
            ingreso += Math.max(0, nivelJugadorActual - nivelRival);
            ingreso += 1;
        }

        rival.oro = Math.min(oroActual + Math.max(0, ingreso), _TOPE_ORO_RIVAL);
        rival.victorias = (rival.victorias || 0) + 1;

        rival._estadoRonda = 'win';
        rival._danoRonda = null;

        if (esFaseArranque) {
            console.log(`   ✅ ${rival.nombre}: GANA contra ${nombreMonstruo} (sin oro, ronda de arranque) — nivel ${rival.nivel}, HP ${rival.vida}`);
        } else {
            console.log(`   ✅ ${rival.nombre}: GANA contra ${nombreMonstruo} (+${ingreso}💰, nivel ${rival.nivel}, HP ${rival.vida})`);
        }
    }

    const vivos = window.torneoRivales.filter(x => !x.eliminado);
    console.log(`📊 [TORNEO PvE] Estado tras la ronda:`);
    console.log(`   🏆 Total rivales vivos: ${vivos.length}`);
    console.log(`   🎮 Tú (jugador): ${vidaJugador} HP`);
    vivos.forEach(x => {
        const marca = x.vida >= 50 ? '💚' : '🩸';
        const rachaStr = (x.racha !== 0) ? ` | racha ${x.racha > 0 ? '+' : ''}${x.racha}` : '';
        console.log(`      ${marca} ${x.nombre}: ${x.vida} HP (nivel ${x.nivel}${rachaStr}, ${x.oro || 0}💰)`);
    });
}
window.simularCombatesPvE = simularCombatesPvE;

// ============================================================
// ACTUALIZAR RANKING DE VIDA
// ============================================================
function actualizarRankingTorneo() {
    const panel = document.getElementById('rankingTorneo');
    if (!panel) return;

    if (!window.torneoRivales || window.torneoRivales.length === 0) {
        panel.innerHTML = '<div class="ranking-header">🏆 RANKING</div>' +
            '<div style="color:#6b8aaa;font-size:0.7rem;text-align:center;padding:10px 0;">Sin rivales</div>';
        return;
    }

    const victoriaJugador = window._ultimaVictoriaJugador;
    const danoJugador = window._ultimoDanoRecibidoJugador || 0;

    let estadoJugador = null;
    if (victoriaJugador === true) estadoJugador = 'win';
    else if (victoriaJugador === false) estadoJugador = 'loss';

    const jugador = {
        nombre: window.nombreJugador || 'Tú',
        vida: vidaJugador,
        nivel: nivelJugador,
        avatar: window.avatarJugador || 'rojo',
        esJugador: true,
        eliminado: vidaJugador <= 0,
        racha: (typeof racha === 'number') ? racha : 0,
        estadoRonda: estadoJugador,
        danoRonda: danoJugador > 0 ? danoJugador : null
    };

    const rivales = window.torneoRivales.map(r => ({
        nombre: r.nombre,
        vida: r.vida,
        nivel: r.nivel || 1,
        avatar: r.avatar,
        esJugador: false,
        eliminado: r.eliminado,
        racha: (typeof r.racha === 'number') ? r.racha : 0,
        estadoRonda: r._estadoRonda || null,
        danoRonda: r._danoRonda || null,
        potencial: r._potencial || 0
    }));

    const todos = [jugador, ...rivales];

    const nombresInicioPareja = new Set();

    if (window._rankingEmparejado && window._parejasRanking && window._parejasRanking.length > 0) {
        const mapaPorNombre = new Map();
        todos.forEach(t => mapaPorNombre.set(t.nombre, t));

        const yaColocados = new Set();
        const filasOrdenadas = [];

        const parejas = window._parejasRanking
            .map(p => p.map(n => mapaPorNombre.get(n)).filter(Boolean))
            .filter(p => p.length > 0);

        parejas.sort((pA, pB) => {
            const maxA = Math.max(...pA.map(x => x.vida));
            const maxB = Math.max(...pB.map(x => x.vida));
            return maxB - maxA;
        });

        for (let pareja of parejas) {
            pareja.sort((a, b) => b.vida - a.vida);

            let primeroDeEstaPareja = null;

            for (let miembro of pareja) {
                if (yaColocados.has(miembro.nombre)) continue;
                yaColocados.add(miembro.nombre);
                filasOrdenadas.push(miembro);
                if (!primeroDeEstaPareja) primeroDeEstaPareja = miembro.nombre;
            }

            if (primeroDeEstaPareja) {
                nombresInicioPareja.add(primeroDeEstaPareja);
            }
        }

        const sueltos = todos
            .filter(t => !yaColocados.has(t.nombre))
            .sort((a, b) => {
                if (a.eliminado !== b.eliminado) return a.eliminado ? 1 : -1;
                return b.vida - a.vida;
            });

        filasOrdenadas.push(...sueltos);

        todos.length = 0;
        todos.push(...filasOrdenadas);
    } else {
        todos.sort((a, b) => {
            if (a.eliminado !== b.eliminado) return a.eliminado ? 1 : -1;
            return b.vida - a.vida;
        });
    }

    const vidaMaxTorneo = (typeof CONFIG !== 'undefined' && CONFIG.VIDA_MAX_JUGADOR) ? CONFIG.VIDA_MAX_JUGADOR : 50;

    let html = '<div class="ranking-header">🏆 RANKING</div>';

    todos.forEach((r) => {
        const claseJugador = r.esJugador ? 'jugador' : '';
        const claseEliminado = r.eliminado ? 'eliminado' : '';
        const claseRacha = r.racha >= 3 ? 'racha-alta' : '';

        let claseHp = '';
        if (r.vida < 10) claseHp = 'critical';
        else if (r.vida < 25) claseHp = 'low';

        const hpBar = Math.max(0, Math.min(100, (r.vida / vidaMaxTorneo) * 100));

        let estadoHtml = '';
        if (r.estadoRonda === 'win') estadoHtml = '<span class="ranking-estado win">✔</span>';
        else if (r.estadoRonda === 'loss') estadoHtml = '<span class="ranking-estado loss">✖</span>';
        else if (r.estadoRonda === 'bye') estadoHtml = '<span class="ranking-estado bye" title="Descansa esta ronda">–</span>';
        else estadoHtml = '<span class="ranking-estado"></span>';

        const danoHtml = r.danoRonda ? `<div class="ranking-dano">-${r.danoRonda}</div>` : '';

        const carpeta = r.esJugador ? 'jugador' : 'rivales';
        const srcAvatar = `assets/avatars/${carpeta}/${r.avatar}.png`;
        const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236b8aaa'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

        const tituloPotencial = (!r.esJugador && r.potencial)
            ? ` title="Potencial de sinergia: ${r.potencial}"`
            : '';

        const esInicioPareja = nombresInicioPareja.has(r.nombre);
        const claseSeparador = esInicioPareja ? 'inicio-pareja' : '';

        const esRivalActivo = window._rankingEmparejado &&
            window.rivalActual && r.nombre === window.rivalActual.nombre;
        const claseRivalActivo = esRivalActivo ? 'pareja-activa' : '';

        html += `
            <div class="ranking-item ${claseJugador} ${claseEliminado} ${claseRacha} ${claseSeparador}" 
                 data-rival="${r.nombre}" 
                 data-es-jugador="${r.esJugador}"
                 ${tituloPotencial}>
                ${danoHtml}
                <div class="ranking-nivel">${r.nivel}</div>
                <img class="ranking-avatar" src="${srcAvatar}" onerror="this.src='${fallbackSvg}'">
                <div class="ranking-info">
                    <div class="ranking-nombre">${r.nombre}</div>
                    <div class="ranking-hp-row">
                        <span class="ranking-hp-valor">${Math.max(0, r.vida)}</span>
                        <div class="ranking-hp-bar">
                            <div class="ranking-hp-fill ${claseHp}" style="width: ${hpBar}%;"></div>
                        </div>
                    </div>
                </div>
                ${estadoHtml}
            </div>
        `;
    });

    panel.innerHTML = html;

    panel.querySelectorAll('.ranking-item').forEach(item => {
        item.onclick = function(e) {
            e.stopPropagation();
            const esJugador = this.dataset.esJugador === 'true';
            const nombreRival = this.dataset.rival;

            if (esJugador) return;

            if (typeof abrirInspeccionRival === 'function') {
                abrirInspeccionRival(nombreRival);
            }
        };
    });
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================
window.inicializarTorneo = inicializarTorneo;
window.simularCombatesRivales = simularCombatesRivales;
window.actualizarRankingTorneo = actualizarRankingTorneo;
window.calcularPoderRival = calcularPoderRival;
window.calcularPotencialRival = calcularPotencialRival;
window.seleccionarRivalesPonderados = seleccionarRivalesPonderados;

// ============================================================
// EMPAREJAMIENTO VISUAL DEL RANKING
// ============================================================

window._rankingEmparejado = false;
window._parejasRanking = [];

function prepararParejasRanking() {
    if (!window.torneoRivales || window.torneoRivales.length === 0) return;

    const parejas = [];
    const nombreJugador = (window.nombreJugador && String(window.nombreJugador).trim())
        ? window.nombreJugador
        : 'Tú';

    if (window.rivalActual && window.rivalActual.nombre) {
        parejas.push([nombreJugador, window.rivalActual.nombre]);
    } else {
        parejas.push([nombreJugador]);
    }

    const rivalesVivos = window.torneoRivales.filter(r =>
        !r.eliminado && r.nombre !== (window.rivalActual ? window.rivalActual.nombre : null)
    );

    const barajados = [...rivalesVivos];
    for (let i = barajados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [barajados[i], barajados[j]] = [barajados[j], barajados[i]];
    }

    for (let i = 0; i < barajados.length; i += 2) {
        const a = barajados[i];
        const b = barajados[i + 1];
        if (a && b) parejas.push([a.nombre, b.nombre]);
        else if (a) parejas.push([a.nombre]);
    }

    window._parejasRanking = parejas;
    window._rankingEmparejado = true;

    console.log('🔗 [RANKING] Parejas de la ronda:');
    parejas.forEach((p, i) => console.log(`   ${i + 1}. ${p.join('  vs  ')}`));
}

function desactivarParejasRanking() {
    window._rankingEmparejado = false;
    window._parejasRanking = [];
}

window.prepararParejasRanking = prepararParejasRanking;
window.desactivarParejasRanking = desactivarParejasRanking;


// ============================================================
// MODO ESPÍA
// ============================================================
let _espiaEstadoAnterior = null;
let _espiaNombreActual = null;

function abrirInspeccionRival(nombreRival) {
    if (document.body.classList.contains('modo-espia')) {
        cerrarEspia();
    }

    if (window.rivalActual && window.rivalActual.nombre === nombreRival) {
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(`👀 ${nombreRival} ya está en el tablero enemigo`, 'info');
        }
        return;
    }

    const rivalData = window.torneoRivales.find(r => r.nombre === nombreRival);
    if (!rivalData) return;

    if (typeof combatiendo !== 'undefined' && combatiendo) {
        if (typeof addConsoleMessage === 'function') addConsoleMessage('⛔ No puedes espiar durante el combate', 'error');
        return;
    }
    if (window.enRondaPvE === true) {
        if (typeof addConsoleMessage === 'function') addConsoleMessage('👾 No puedes espiar en rondas PvE', 'info');
        return;
    }

    const arenaEl = document.querySelector('.arena-row');
    const fondoArenaActual = arenaEl ? (arenaEl.style.backgroundImage || '') : '';

    const terrenoGlobalActual = document.body.style.getPropertyValue('--terreno-actual') || '';

        _espiaEstadoAnterior = {
        rivalActual: window.rivalActual ? { ...window.rivalActual } : null,
        enemyBoard: enemyBoard.map(u => u ? u.clonarParaCombate() : null),
        enemyBanquillo: enemyBanquillo.map(u => u ? u.clonarParaCombate() : null),
        // 🆕 FIX: capturar también el baúl de objetos del enemigo
        // (antes se devolvían objetos al baúl en cada espía y se acumulaban)
        enemyBaulObjetos: (typeof enemyBaulObjetos !== 'undefined' && Array.isArray(enemyBaulObjetos))
            ? [...enemyBaulObjetos]
            : [],
        enemyLevel: enemyLevel,
        enemyGold: enemyGold,
        enemyHealth: enemyHealth,
        rivalNombre: window.rivalActual ? window.rivalActual.nombre : null,
        fondoArena: fondoArenaActual,
        terrenoGlobal: terrenoGlobalActual
    };
    _espiaNombreActual = nombreRival;

    window.rivalActual = {
        nombre: rivalData.nombre,
        avatar: rivalData.avatar,
        estrategia: rivalData.estrategia,
        frases: rivalData.frases
    };

    if (typeof restaurarEquipoRival === 'function') {
        restaurarEquipoRival(rivalData, '(espía)');
    }

    if (typeof cambiarTerrenoPorRival === 'function') {
        cambiarTerrenoPorRival(rivalData);
    }

    const enemyNameEl = document.getElementById("enemyName");
    const enemyAvatarEl = document.getElementById("enemyAvatar");
    if (enemyNameEl) enemyNameEl.textContent = rivalData.nombre + ' (ESPÍA)';
    if (enemyAvatarEl) {
        enemyAvatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = `assets/avatars/rivales/${rivalData.avatar}.png`;
        img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
        enemyAvatarEl.appendChild(img);
    }

    if (typeof actualizarInfoEnemigo === 'function') actualizarInfoEnemigo();
    if (typeof renderizar === 'function') renderizar();

    document.body.classList.add('modo-espia');

    let aviso = document.getElementById('avisoEspia');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'avisoEspia';
        aviso.className = 'aviso-espia';
        document.body.appendChild(aviso);
    }
    aviso.innerHTML = `
        <span>👀 Espiando a <strong>${rivalData.nombre}</strong></span>
        <button onclick="cerrarEspia()">✕ Salir</button>
    `;

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(`👀 Espiando el equipo de ${rivalData.nombre}`, 'info');
    }
    if (typeof playButtonSound === 'function') playButtonSound();

    if (typeof actualizarRankingTorneo === 'function') {
        actualizarRankingTorneo();
    }
}

function cerrarEspia() {
    if (!_espiaEstadoAnterior) return;

    if (_espiaEstadoAnterior.rivalActual) {
        window.rivalActual = _espiaEstadoAnterior.rivalActual;

        const rivalActivo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);

                if (rivalActivo && typeof restaurarEquipoRival === 'function') {
            if (_espiaEstadoAnterior.enemyBoard || _espiaEstadoAnterior.enemyBanquillo) {
                rivalActivo._equipoGuardado = {
                    tablero: _espiaEstadoAnterior.enemyBoard.map(u => u ? u.clonarParaCombate() : null),
                    banquillo: _espiaEstadoAnterior.enemyBanquillo.map(u => u ? u.clonarParaCombate() : null)
                };
            }
            // 🆕 FIX: restaurar también el baúl del rival activo
            if (_espiaEstadoAnterior.enemyBaulObjetos && Array.isArray(_espiaEstadoAnterior.enemyBaulObjetos)) {
                rivalActivo.objetosAcumulados = [..._espiaEstadoAnterior.enemyBaulObjetos];
                if (typeof enemyBaulObjetos !== 'undefined') {
                    enemyBaulObjetos = [..._espiaEstadoAnterior.enemyBaulObjetos];
                }
            }
            restaurarEquipoRival(rivalActivo, '(restaurar tras espía)');
        } else {
            for (let i = 0; i < enemyBoard.length; i++) {
                enemyBoard[i] = _espiaEstadoAnterior.enemyBoard[i]
                    ? _espiaEstadoAnterior.enemyBoard[i].clonarParaCombate()
                    : null;
            }
            for (let i = 0; i < enemyBanquillo.length; i++) {
                const guardado = _espiaEstadoAnterior.enemyBanquillo
                    ? _espiaEstadoAnterior.enemyBanquillo[i]
                    : null;
                enemyBanquillo[i] = guardado ? guardado.clonarParaCombate() : null;
            }
            // 🆕 FIX: restaurar el baúl de objetos del enemigo
            if (_espiaEstadoAnterior.enemyBaulObjetos && Array.isArray(_espiaEstadoAnterior.enemyBaulObjetos)) {
                if (typeof enemyBaulObjetos !== 'undefined') {
                    enemyBaulObjetos = [..._espiaEstadoAnterior.enemyBaulObjetos];
                }
            }
            enemyLevel = _espiaEstadoAnterior.enemyLevel;
            enemyGold = _espiaEstadoAnterior.enemyGold;
            enemyHealth = _espiaEstadoAnterior.enemyHealth;
        }
    }

    const enemyNameEl = document.getElementById("enemyName");
    const enemyAvatarEl = document.getElementById("enemyAvatar");
    if (enemyNameEl && window.rivalActual) enemyNameEl.textContent = window.rivalActual.nombre;
    if (enemyAvatarEl && window.rivalActual) {
        enemyAvatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = `assets/avatars/rivales/${window.rivalActual.avatar}.png`;
        img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
        enemyAvatarEl.appendChild(img);
    }

    if (_espiaEstadoAnterior && _espiaEstadoAnterior.terrenoGlobal) {
        document.body.style.setProperty('--terreno-actual', _espiaEstadoAnterior.terrenoGlobal);
        console.log(`🎨 Terreno restaurado tras espía: ${_espiaEstadoAnterior.terrenoGlobal}`);
    } else if (typeof cambiarTerrenoPorRival === 'function' && window.rivalActual) {
        cambiarTerrenoPorRival(window.rivalActual);
    }

    const arenaEl = document.querySelector('.arena-row');
    if (arenaEl && _espiaEstadoAnterior && _espiaEstadoAnterior.fondoArena) {
        arenaEl.style.backgroundImage = _espiaEstadoAnterior.fondoArena;
    }

    document.body.classList.remove('modo-espia');
    const aviso = document.getElementById('avisoEspia');
    if (aviso) aviso.remove();

    if (typeof actualizarInfoEnemigo === 'function') actualizarInfoEnemigo();
    if (typeof renderizar === 'function') renderizar();

    _espiaEstadoAnterior = null;
    _espiaNombreActual = null;
    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage('👀 Saliendo del modo espía', 'info');
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.body.classList.contains('modo-espia')) {
        cerrarEspia();
    }
});

window.abrirInspeccionRival = abrirInspeccionRival;
window.cerrarEspia = cerrarEspia;

// ============================================================
// COMPROBAR SI EL TORNEO HA TERMINADO
// ============================================================
function comprobarFinTorneo() {
    if (!window.torneoRivales || window.torneoRivales.length === 0) return false;

    const rivalesVivos = window.torneoRivales.filter(r => !r.eliminado);

    if (rivalesVivos.length === 0) {
        console.log('🏆 ¡TODOS LOS RIVALES ELIMINADOS! ¡HAS GANADO EL TORNEO!');

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage('🏆 ¡HAS GANADO EL TORNEO!', 'success');
        }

        setTimeout(() => {
            if (typeof mostrarVictoriaJuego === 'function') {
                mostrarVictoriaJuego();
            }
        }, 1000);

        return true;
    }

    return false;
}

function obtenerRivalesVivos() {
    if (!window.torneoRivales) return [];
    return window.torneoRivales.filter(r => !r.eliminado);
}

window.comprobarFinTorneo = comprobarFinTorneo;
window.obtenerRivalesVivos = obtenerRivalesVivos;

// ============================================================
// 🏆 PANTALLA DE RESULTADOS FINALES
// ============================================================

function mostrarPantallaResultadosFinales() {
    const overlay = document.getElementById('pantallaResultadosFinales');
    const lista = document.getElementById('resultadosLista');
    const titulo = document.getElementById('resultadosTitulo');
    const tiempoEl = document.getElementById('resultadosTiempo');
    
    if (!overlay || !lista) return;

    let tiempoTexto = "00:00";
    if (typeof partidaTimerInicio === 'number' && partidaTimerInicio > 0) {
        const msTotal = performance.now() - partidaTimerInicio;
        tiempoTexto = formatearTiempoPartida(msTotal);
    }
    if (tiempoEl) tiempoEl.innerHTML = `⏱️ ${tiempoTexto}`;

    let todosLosJugadores = [];

    const tuEquipo = tablero.filter(u => u && !u.esArticuno).map(u => ({ pokemon: u.pokemon, nivel: u.nivel }));
    todosLosJugadores.push({
        esJugador: true,
        nombre: window.nombreJugador || 'Tú',
        avatar: window.avatarJugador || 'rojo',
        carpeta: 'jugador',
        vida: vidaJugador,
        equipo: tuEquipo,
        sinergias: getSinergiasActivas().types
    });

    if (window.torneoRivales) {
        window.torneoRivales.forEach(rival => {
            let equipoRival = [];
            if (rival._equipoGuardado && rival._equipoGuardado.tablero) {
                equipoRival = rival._equipoGuardado.tablero.filter(Boolean).map(u => ({ pokemon: u.pokemon, nivel: u.nivel }));
            }

            let sinergiasRival = {};
            if (equipoRival.length > 0) {
                const conteoTipos = {};
                const conteoClases = {};
                equipoRival.forEach(u => {
                    if (u.pokemon.tipos) u.pokemon.tipos.forEach(t => conteoTipos[t] = (conteoTipos[t]||0)+1);
                    if (u.pokemon.clase) conteoClases[u.pokemon.clase] = (conteoClases[u.pokemon.clase]||0)+1;
                });
                
                for (let tipo in conteoTipos) {
                    let nivel = conteoTipos[tipo];
                    if (nivel >= 2) sinergiasRival[tipo] = { nivel: nivel, esClase: false };
                }
                for (let clase in conteoClases) {
                    let nivel = conteoClases[clase];
                    if (nivel >= 2) sinergiasRival[clase] = { nivel: nivel, esClase: true };
                }
            }

            todosLosJugadores.push({
                esJugador: false,
                nombre: rival.nombre,
                avatar: rival.avatar,
                carpeta: 'rivales',
                vida: rival.vida,
                equipo: equipoRival,
                sinergias: sinergiasRival,
                eliminado: rival.eliminado
            });
        });
    }

    todosLosJugadores.sort((a, b) => {
        if (a.vida !== b.vida) return b.vida - a.vida;
        return a.esJugador ? -1 : 1;
    });

    const miPosicion = todosLosJugadores.findIndex(j => j.esJugador) + 1;
    if (miPosicion === 1) {
        titulo.textContent = "🏆 ¡VICTORIA TOTAL!";
        titulo.style.color = "#fbbf24";
    } else {
        titulo.textContent = `#${miPosicion} Lugar`;
        titulo.style.color = "#e2e8f0";
    }

    lista.innerHTML = '';
    
    todosLosJugadores.forEach((jugador, index) => {
        const pos = index + 1;
        const fila = document.createElement('div');
        fila.className = `fila-resultado pos-${pos} ${jugador.esJugador ? 'es-jugador' : ''}`;
        
        let rangoHtml = pos.toString();
        if (pos === 1) rangoHtml = '🥇';
        if (pos === 2) rangoHtml = '🥈';
        if (pos === 3) rangoHtml = '🥉';

        let equipoHtml = '';
        if (jugador.equipo.length > 0) {
            jugador.equipo.forEach(u => {
                const p = u.pokemon;
                const nivel = u.nivel || 1;
                const spriteUrl = getSpriteUrl(p.spriteId, p.nombre);
                equipoHtml += `
                    <div class="unidad-final" title="${p.nombre}">
                        <img src="${spriteUrl}" onerror="this.style.display='none'">
                        <img class="estrellas-final" src="${getEstrellasUrl(nivel)}">
                    </div>
                `;
            });
        } else {
            equipoHtml = `<span style="font-size:0.7rem;color:#6b8aaa;font-style:italic;">Sin equipo</span>`;
        }

        let sinergiasHtml = '';
        const sinergiasArray = Object.keys(jugador.sinergias || {}).map(key => ({
            nombre: key,
            nivel: jugador.sinergias[key].nivel,
            esClase: jugador.sinergias[key].esClase
        })).sort((a,b) => b.nivel - a.nivel).slice(0, 3);

        sinergiasArray.forEach(s => {
            const icono = s.esClase ? getIconoClase(s.nombre) : getIconoTipo(s.nombre);
            sinergiasHtml += `
                <div class="sinergia-icono-final" title="${s.nombre}">
                    ${icono}
                    <span class="lvl">${s.nivel}</span>
                </div>
            `;
        });

        fila.innerHTML = `
            <div class="rango-badge pos-${pos}">${rangoHtml}</div>
            <div class="info-entrenador">
                <img src="assets/avatars/${jugador.carpeta}/${jugador.avatar}.png" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'%236b8aaa\\'><path d=\\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\\'/></svg>'">
                <div style="display:flex; flex-direction:column;">
                    <span class="nombre">${jugador.nombre}</span>
                    <span class="hp">❤️ ${Math.max(0, jugador.vida)} HP</span>
                </div>
            </div>
            <div class="equipo-final">
                ${equipoHtml}
            </div>
            <div class="sinergias-final">
                ${sinergiasHtml}
            </div>
        `;
        
        lista.appendChild(fila);
    });

    overlay.style.display = 'flex';

    const btnVolver = document.getElementById('btnResultadosVolverMenu');
    if (btnVolver) {
        const nuevoBtn = btnVolver.cloneNode(true);
        btnVolver.parentNode.replaceChild(nuevoBtn, btnVolver);
        
        nuevoBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            if (typeof volverAlMenuDesdeAjustes === 'function') {
                volverAlMenuDesdeAjustes();
            } else {
                location.reload();
            }
        });
    }
}

window.mostrarPantallaResultadosFinales = mostrarPantallaResultadosFinales;