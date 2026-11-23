// ============================================================
// SISTEMA DE SINERGIAS - APLICAR BONUS A LAS UNIDADES
// Archivo: js/systems/sinergiasCombate.js
//
// 🔧 v9: Zacian con coste 5 (visual dorado) + tipos Hada/Acero
//        (visual). No es comprable (id:999, esEspecial:true, no
//        está en POKEMONS). Sigue siendo invocación.
//
// 🆕 v10 FIX #2: aplicarSinergias() y aplicarSinergiasEnemigo()
//    YA NO resetean a 0 bonusDefense, bonusSpDefense, bonusHp,
//    bonusAttack, bonusSpAttack ni bonusDamage. Ahora guardan y
//    restauran los valores de objetos, y luego SUMAN los de
//    sinergia. Los objetos defensivos (Chaleco Asalto, Barrera
//    Auxiliar, Incienso Condena, Corona Drenaje, Casco Dentado,
//    Capucha Rescate, Gafas Especiales) vuelven a funcionar
//    tras cada renderizar().
//
// 🆕 v10 FIX #3: Zacian con hp<=0 se trata como "no existe" y se
//    elimina de tablero antes de recrearlo (evita "zombi").
//
// 🆕 v10 FIX #4: aplicarSinergiasEnemigo resetea _slowBase /
//    _slowsActivos al inicio de ronda (slow residual).
//
// 🆕 v10 FIX #5: Articuno enemigo se crea UNA SOLA VEZ por combate
//    (antes se recreaba en cada aplicarSinergiasEnemigo → en cada
//    renderizar() si el jugador no había invocado su Articuno).
//
// 🆕 v11 FIX #40: _guardarBonusObjetos y _restaurarBonusObjetos
//    ahora guardan SOLO el delta de objetos, no el valor absoluto.
//    Antes el valor absoluto incluía las sinergias de renders
//    anteriores, así que al restaurar + re-aplicar sinergias, el
//    bonusAttack (y compañía) crecía EXPONENCIALMENTE:
//      Render 1: 1 × 1.15 = 1.15
//      Render 2: 1.15 × 1.15 = 1.32
//      Render 3: 1.32 × 1.15 = 1.52
//      Render 10: 1.15^10 = 4.05
//    Eso hacía que Leafeon (Atk 55) hiciera 99 de daño en vez de
//    21, y los combates duraran 7s en vez de 30s.
//
//    Ahora el flujo es:
//      1. Guardar delta de objetos (multiplicadores puros).
//      2. Resetear a neutro (1 para mult, 0 para aditivos).
//      3. Restaurar delta de objetos.
//      4. Aplicar sinergias encima.
//    El bonusAttack se queda estable en 1.15 entre renders.
//
// 🆕 v13 FIX AURA DE MIEDO:
//    - Sincronización real entre fearAuraStacks (local) y
//      window.fearAuraStacks (global) en AMBOS sentidos.
//    - Si el jugador NO tiene Siniestro ≥ 2 activo, se RESETEAN
//      ambos contadores (antes el panel se quedaba congelado con
//      el último valor mostrado).
//    - Se añade window.enemyFearAuraStacks para el Aura del
//      enemigo (necesario en modo 2P y para mostrarla en el panel).
//    - Se sincroniza también al final de aplicarSinergiasEnemigo.
// ============================================================

function getSinergiasActivas() {
    let tipoCount = {}, claseCount = {}, familiasProcesadas = new Set();
    let bonusChips = {};

    for (let u of tablero) {
        if (!u) continue;
        if (u.esZacian) continue;
        if (u.esArticuno) continue;

        let familia = getFamiliaEvolutiva(u.pokemon);
        if (!familia || familiasProcesadas.has(familia)) continue;
        familiasProcesadas.add(familia);
        for (let tipo of u.pokemon.tipos) {
            tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
        }
        let clase = u.pokemon.clase;
        claseCount[clase] = (claseCount[clase] || 0) + 1;
    }

    for (let u of tablero) {
        if (!u) continue;
        if (u.esZacian) continue;
        if (u.esArticuno) continue;
        if (u.objetos && u.objetos.length > 0) {
            for (let objNombre of u.objetos) {
                const objeto = OBJETOS[objNombre];
                if (objeto && objeto.efecto && objeto.efecto.tipoBonus) {
                    const tipoBonus = objeto.efecto.tipoBonus;
                    const bonusExtra = objeto.efecto.bonusExtra || 1;
                    if (!bonusChips[tipoBonus]) bonusChips[tipoBonus] = 0;
                    bonusChips[tipoBonus] += bonusExtra;
                }
            }
        }
    }

    for (let tipo in bonusChips) {
        if (tipoCount[tipo] !== undefined) {
            tipoCount[tipo] += bonusChips[tipo];
        }
    }

    let activas = { types: {}, classes: {} };

    for (let tipo in tipoCount) {
        let count = tipoCount[tipo];
        let synergy = TYPE_SYNERGIES[tipo];
        if (synergy) {
            let niveles = Object.keys(synergy).map(Number).sort((a, b) => b - a);
            for (let nivel of niveles) {
                if (count >= nivel) {
                    activas.types[tipo] = { nivel, bonus: synergy[nivel] };
                    break;
                }
            }
        }
    }

    for (let clase in claseCount) {
        let count = claseCount[clase];
        let synergy = CLASS_SYNERGIES[clase];
        if (synergy) {
            let niveles = Object.keys(synergy).map(Number).sort((a, b) => b - a);
            for (let nivel of niveles) {
                if (count >= nivel) {
                    activas.classes[clase] = { nivel, bonus: synergy[nivel] };
                    break;
                }
            }
        }
    }

    return activas;
}

// ============================================================
// 🆕 v11 FIX #40: guardar SOLO el delta de objetos
// ============================================================
function _guardarBonusObjetos(unidad) {
    if (!unidad) return null;

    let deltaAttack = 1;
    let deltaSpAttack = 1;
    let deltaDamage = 1;
    let deltaHp = 1;
    let deltaAttackSpeed = 1;
    let deltaDamageReduction = 1;
    let deltaMoveDamage = 1;
    let deltaHpFijo = 0;
    let deltaDefense = 0;
    let deltaSpDefense = 0;

    if (unidad.objetos && unidad.objetos.length > 0) {
        for (let objNombre of unidad.objetos) {
            const objData = OBJETOS[objNombre];
            if (!objData || !objData.efecto) continue;
            const ef = objData.efecto;
            if (ef.attackPercent) deltaAttack *= (1 + ef.attackPercent);
            if (ef.spAttackPercent) deltaSpAttack *= (1 + ef.spAttackPercent);
            if (ef.damagePercent) deltaDamage *= (1 + ef.damagePercent);
            if (ef.damagePercentExtra) deltaDamage *= (1 + ef.damagePercentExtra);
            if (ef.attackSpeedPercent) deltaAttackSpeed *= (1 + ef.attackSpeedPercent);
            if (ef.hpBonus) deltaHpFijo += ef.hpBonus;
            if (ef.defense) deltaDefense += ef.defense;
            if (ef.spDefense) deltaSpDefense += ef.spDefense;
            if (ef.damageReduction) deltaDamageReduction *= (1 - ef.damageReduction);
            if (ef.damageReductionExtra) deltaDamageReduction *= (1 - ef.damageReductionExtra);
            if (ef.moveDamagePercent) deltaMoveDamage *= (1 + ef.moveDamagePercent);
        }
    }

    return {
        deltaAttack,
        deltaSpAttack,
        deltaDamage,
        deltaHp,
        deltaAttackSpeed,
        deltaDamageReduction,
        deltaMoveDamage,
        deltaHpFijo,
        deltaDefense,
        deltaSpDefense
    };
}

function _resetearBonusNeutro(unidad) {
    if (!unidad) return;
    unidad.bonusDamage = 1;
    unidad.bonusAttack = 1;
    unidad.bonusSpAttack = 1;
    unidad.bonusHp = 1;
    unidad.bonusHpFijo = 0;
    unidad.bonusDefense = 0;
    unidad.bonusSpDefense = 0;
    unidad.bonusAttackSpeed = 1;
    unidad.bonusDamageReduction = 1;
    unidad.bonusMoveDamage = 1;

    // 🆕 FIX E: recalcular stats tras resetear (para que maxHp baje
    // al quitar objetos). Si no, el maxHp se queda inflado hasta el
    // siguiente actualizarStats() externo.
    unidad.actualizarStats();
}

function _restaurarBonusObjetos(unidad, guardado) {
    if (!unidad || !guardado) return;
    unidad.bonusAttack = guardado.deltaAttack;
    unidad.bonusSpAttack = guardado.deltaSpAttack;
    unidad.bonusDamage = guardado.deltaDamage;
    unidad.bonusHp = guardado.deltaHp;
    unidad.bonusAttackSpeed = guardado.deltaAttackSpeed;
    unidad.bonusDamageReduction = guardado.deltaDamageReduction;
    unidad.bonusMoveDamage = guardado.deltaMoveDamage;
    unidad.bonusHpFijo = guardado.deltaHpFijo;
    unidad.bonusDefense = guardado.deltaDefense;
    unidad.bonusSpDefense = guardado.deltaSpDefense;

    // 🆕 FIX E: recalcular maxHp tras restaurar bonusHpFijo
    // Antes el maxHp se quedaba con el valor del reset (sin hpBonus),
    // y por eso los Pokémon con Chaleco Asalto/Casco Dentado perdían
    // el HP extra entre renders.
    unidad.actualizarStats();
}

// ============================================================
// APLICAR SINERGIAS - JUGADOR
// ============================================================
function aplicarSinergias() {
    debugLog("🔍 ===== APLICANDO SINERGIAS =====");

    let sinergias = getSinergiasActivas();

    // 🔗 Logros de sinergias (nivel máximo de tipo / 3 tipos o clases a nivel 3+)
    if (typeof Logros !== 'undefined') {
        Logros.evento('sinergias', { sinergias: sinergias });
    }

    let fearBonus = calcularFearAuraBonus(fearAuraStacks);
    let nivelSiniestro = 0;
    if (sinergias.types["Siniestro"]) {
        nivelSiniestro = sinergias.types["Siniestro"].nivel;
    }

    debugLog("🔍 SINERGIAS ACTIVAS:", Object.keys(sinergias.types));
    debugLog("🔍 HADA:", sinergias.types["Hada"]);
    debugLog("🔍 Tablero:", tablero.map(u => u ? u.pokemon.nombre : "vacío"));

    let zacianExistente = null;
    let zacianIndice = -1;
    let zacianObjetos = [];

    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i] && tablero[i].esZacian) {
            if (tablero[i].hp <= 0 || tablero[i].muerto) {
                debugLog("💀 Zacian existente con hp<=0, eliminándolo de tablero");
                tablero[i] = null;
                continue;
            }
            zacianExistente = tablero[i];
            zacianIndice = i;
            if (zacianExistente.objetos) {
                zacianObjetos = [...zacianExistente.objetos];
            }
            break;
        }
    }

    const hadaSinergia = sinergias.types["Hada"];
    let debeTenerZacian = false;
    let starLevel = 0;
    let bonusHada = {};

    if (hadaSinergia) {
        const bonus = hadaSinergia.bonus;
        starLevel = bonus.zacianStar || 0;
        debugLog("🎀 Zacian starLevel:", starLevel);
        if (starLevel > 0) {
            debeTenerZacian = true;
            bonusHada = bonus;
            debugLog("🎀 ¡ZACIAN DEBE APARECER! Nivel:", starLevel);
        }
    } else {
        debugLog("❌ NO hay sinergia Hada activa");
    }

    if (!debeTenerZacian && zacianExistente) {
        if (zacianIndice !== -1) {
            let objetosReales = zacianObjetos.filter(obj => obj !== "Corona Drenaje" && obj !== "Disco Definitivo");

            if (objetosReales.length > 0) {
                for (let obj of objetosReales) {
                    if (baulObjetos.length < CONFIG.MAX_BAUL) {
                        baulObjetos.push(obj);
                        addConsoleMessage(`📦 Objeto ${obj} devuelto al baúl (Zacian eliminado)`, 'move');
                    }
                }
                actualizarBadgeBaul();
            }

            tablero[zacianIndice] = null;
            zacianUnidad = null;
            zacianNivel = 0;
            debugLog("❌ Zacian eliminado del tablero (sinergia Hada perdida)");
            addConsoleMessage(`❌ Zacian eliminado del tablero (sinergia Hada perdida)`, 'info');
        }
    }

    // ============================================================
    // CREACIÓN DE ZACIAN (coste 5 visual + HP escalable)
    // ============================================================
    if (debeTenerZacian && !zacianExistente) {
        debugLog("🎀 Intentando crear Zacian...");

        let casillaLibre = tablero.findIndex(cell => cell === null);

        if (casillaLibre === -1) {
            debugLog("⚠️ No hay casilla libre en el tablero para Zacian!");
            addConsoleMessage(`⚠️ No hay casilla libre en el tablero para Zacian!`, 'error');
        } else {
            debugLog("🎀 Casilla libre encontrada en índice:", casillaLibre);

            const ZACIAN_STATS = {
                1: { hp: 800,  ataque: 80,  spAttack: 30, defense: 225, spDefense: 220, attackSpeed: 0.7 },
                2: { hp: 1400, ataque: 115, spAttack: 45, defense: 225, spDefense: 220, attackSpeed: 0.85 },
                3: { hp: 2800, ataque: 185, spAttack: 70, defense: 280, spDefense: 280, attackSpeed: 1.0 }
            };
            const stats = ZACIAN_STATS[starLevel];
            const hadaCount = contarHadasEnTablero();

            let hpTotalAliados = 0;
            for (let u of tablero) {
                if (!u || u.esZacian || u.esArticuno) continue;
                hpTotalAliados += u.maxHp || 0;
            }
            const hpBonusAliados = Math.floor(hpTotalAliados * 0.25);
            const hpBonusHadas = hadaCount * 100;
            const hpFinalZacian = stats.hp + hpBonusAliados + hpBonusHadas;

            debugLog("🎀 Hadas en tablero (sin Zacian):", hadaCount);
            debugLog(`🎀 HP: ${stats.hp} base + ${hpBonusAliados} (aliados) + ${hpBonusHadas} (hadas) = ${hpFinalZacian}`);

            const zacianPokemon = {
                id: 999,
                nombre: "Zacian",
                spriteId: 888,
                tipos: ["Hada", "Acero"],
                clase: "",
                rol: "frontline",
                hp: hpFinalZacian,
                ataque: stats.ataque,
                spAttack: stats.spAttack,
                defense: stats.defense,
                spDefense: stats.spDefense,
                attackSpeed: stats.attackSpeed,
                critRate: 0,
                critDamage: 2.0,
                startingEnergy: 0,
                energyGauge: 50,
                coste: 5,
                evolucion: null,
                esEspecial: true,
                noEquiparObjetos: true
            };

            let zacian = new Unidad(zacianPokemon, starLevel, 999, 0);
            zacian.esZacian = true;
            zacian.noEquiparObjetos = true;
            zacian.metalClaw = bonusHada.metalClaw || false;
            zacian.crowned = bonusHada.crowned || false;
            zacian.drainCrown = bonusHada.drainCrown || false;
            zacian.behemothBlade = bonusHada.behemothBlade || false;

            if (starLevel >= 2) {
                zacian.zacianMovimiento = "garra-metal";
            } else {
                zacian.zacianMovimiento = "basico";
            }

            zacian.tieneDiscoUlti = bonusHada.behemothBlade ? true : false;

            zacian.energy = zacian.pokemon.startingEnergy || 0;
            zacian.equipo = 'player';

            const hadaBonus = 1 + (hadaCount * 0.05);
            zacian.bonusAttack *= hadaBonus;
            zacian.bonusSpAttack *= hadaBonus;
            zacian.actualizarStats();
            zacian.hp = zacian.maxHp;

            if (bonusHada.drainCrown) {
                zacian.lifesteal = 0.20;
                zacian.bonusAttack = (zacian.bonusAttack || 1) * 1.20;
                zacian.bonusSpAttack = (zacian.bonusSpAttack || 1) * 1.20;
                zacian.bonusHp = (zacian.bonusHp || 1) * 1.20;
                zacian.actualizarStats();
                zacian.hp = Math.min(zacian.hp, zacian.maxHp);

                if (!zacian.objetos) zacian.objetos = [];
                if (!zacian.objetos.includes("Corona Drenaje")) {
                    zacian.objetos.unshift("Corona Drenaje");
                }
                if (typeof zacianObjetos !== 'undefined') {
                    zacianObjetos = [...zacian.objetos];
                }

                addConsoleMessage(`👑 Corona Drenaje equipada automáticamente a Zacian (Nivel 5 Hada)`, 'fusion');
            }

            if (bonusHada.behemothBlade) {
                if (!zacian.objetos) zacian.objetos = [];
                if (!zacian.objetos.includes("Disco Definitivo")) {
                    zacian.objetos.push("Disco Definitivo");
                }
                if (typeof zacianObjetos !== 'undefined') {
                    zacianObjetos = [...zacian.objetos];
                }

                addConsoleMessage(`💿 Disco Definitivo equipado automáticamente a Zacian (Nivel 6 Hada)`, 'fusion');
            }

            if (zacianObjetos.length > 0) {
                for (let obj of zacianObjetos) {
                    if (obj === "Corona Drenaje" || obj === "Disco Definitivo") continue;
                    if (baulObjetos.length < CONFIG.MAX_BAUL) {
                        baulObjetos.push(obj);
                        addConsoleMessage(`📦 ${obj} devuelto al baúl (Zacian no puede equipar objetos manualmente)`, 'move');
                    }
                }
                actualizarBadgeBaul();
            }

            tablero[casillaLibre] = zacian;

            zacianUnidad = zacian;
            zacianNivel = starLevel;

            debugLog(`🎀 ¡Zacian ${starLevel}★ invocado al TABLERO en casilla ${casillaLibre}!`);
            addConsoleMessage(`🎀 ¡Zacian ${starLevel}★ invocado! HP: ${stats.hp} + ${hpBonusAliados} (aliados) + ${hpBonusHadas} (hadas) = ${hpFinalZacian}`, 'fusion');

            if (typeof playPokemonCry === 'function') {
                playPokemonCry(888);
            } else {
                if (typeof playSonidoEvolucion === 'function') {
                    playSonidoEvolucion();
                }
            }

            const board = document.getElementById('playerBoard');
            if (board) {
                board.style.transition = 'box-shadow 0.5s ease, background 0.5s ease';
                board.style.boxShadow = '0 0 60px rgba(251, 191, 36, 0.4), inset 0 0 60px rgba(251, 191, 36, 0.1)';
                board.style.background = 'rgba(251, 191, 36, 0.05)';
                setTimeout(() => {
                    board.style.boxShadow = '';
                    board.style.background = '';
                }, 1500);
            }
        }
    }

    // ============================================================
    // ACTUALIZACIÓN DE ZACIAN EXISTENTE
    // ============================================================
    if (debeTenerZacian && zacianExistente) {
        debugLog("🎀 Actualizando Zacian existente...");

        const ZACIAN_STATS = {
            1: { hp: 800,  ataque: 80,  spAttack: 30, defense: 225, spDefense: 220, attackSpeed: 0.7 },
            2: { hp: 1400, ataque: 115, spAttack: 45, defense: 225, spDefense: 220, attackSpeed: 0.85 },
            3: { hp: 2800, ataque: 185, spAttack: 70, defense: 280, spDefense: 280, attackSpeed: 1.0 }
        };
        const stats = ZACIAN_STATS[starLevel];
        const hadaCount = contarHadasEnTablero();

        const nivelAnterior = zacianExistente.nivel;

        let hpTotalAliados = 0;
        for (let u of tablero) {
            if (!u || u === zacianExistente || u.esZacian || u.esArticuno) continue;
            hpTotalAliados += u.maxHp || 0;
        }
        const hpBonusAliados = Math.floor(hpTotalAliados * 0.25);
        const hpBonusHadas = hadaCount * 100;
        const hpFinalZacian = stats.hp + hpBonusAliados + hpBonusHadas;

        zacianExistente.pokemon.hp = hpFinalZacian;
        zacianExistente.pokemon.ataque = stats.ataque;
        zacianExistente.pokemon.spAttack = stats.spAttack;
        zacianExistente.pokemon.defense = stats.defense;
        zacianExistente.pokemon.spDefense = stats.spDefense;
        zacianExistente.pokemon.attackSpeed = stats.attackSpeed;
        zacianExistente.nivel = starLevel;

        zacianExistente.pokemon.tipos = ["Hada", "Acero"];

        zacianExistente.metalClaw = bonusHada.metalClaw || false;
        zacianExistente.crowned = bonusHada.crowned || false;
        zacianExistente.drainCrown = bonusHada.drainCrown || false;
        zacianExistente.behemothBlade = bonusHada.behemothBlade || false;

        if (starLevel >= 2) {
            zacianExistente.zacianMovimiento = "garra-metal";
        } else {
            zacianExistente.zacianMovimiento = "basico";
        }

        zacianExistente.tieneDiscoUlti = bonusHada.behemothBlade ? true : false;

        const hadaBonus = 1 + (hadaCount * 0.05);
        zacianExistente.bonusAttack = hadaBonus;
        zacianExistente.bonusSpAttack = hadaBonus;
        zacianExistente.bonusHp = 1;

        if (bonusHada.drainCrown) {
            zacianExistente.lifesteal = 0.20;
            zacianExistente.bonusAttack *= 1.20;
            zacianExistente.bonusSpAttack *= 1.20;
            zacianExistente.bonusHp *= 1.20;

            if (!zacianExistente.objetos) zacianExistente.objetos = [];
            if (!zacianExistente.objetos.includes("Corona Drenaje")) {
                zacianExistente.objetos.unshift("Corona Drenaje");
            }
            zacianObjetos = [...zacianExistente.objetos];
        } else {
            zacianExistente.lifesteal = 0;
            if (zacianExistente.objetos && zacianExistente.objetos.includes("Corona Drenaje")) {
                zacianExistente.objetos = zacianExistente.objetos.filter(o => o !== "Corona Drenaje");
            }
        }

        if (bonusHada.behemothBlade) {
            if (!zacianExistente.objetos) zacianExistente.objetos = [];
            if (!zacianExistente.objetos.includes("Disco Definitivo")) {
                zacianExistente.objetos.push("Disco Definitivo");
            }
            zacianObjetos = [...zacianExistente.objetos];
        } else {
            if (zacianExistente.objetos && zacianExistente.objetos.includes("Disco Definitivo")) {
                zacianExistente.objetos = zacianExistente.objetos.filter(o => o !== "Disco Definitivo");
            }
            zacianObjetos = [...(zacianExistente.objetos || [])];
        }

        zacianExistente.actualizarStats();
        zacianExistente.hp = Math.min(zacianExistente.hp, zacianExistente.maxHp);

        zacianUnidad = zacianExistente;
        zacianNivel = starLevel;

        if (nivelAnterior !== starLevel) {
            debugLog(`🎀 Zacian actualizado a ${starLevel}★ (${hadaCount} Hadas activas)`);
            addConsoleMessage(`🎀 Zacian actualizado a ${starLevel}★ — HP ${stats.hp} + ${hpBonusAliados} (aliados) + ${hpBonusHadas} (hadas) = ${hpFinalZacian}`, 'info');
        }
    }

    // ============================================================
    // 🆕 FIX #40: Guardar delta de objetos ANTES de resetear
    // ============================================================
    const _bonusObjetosGuardados = new Map();
    for (let unit of tablero) {
        if (!unit) continue;
        if (unit.esZacian) continue;
        if (unit.esArticuno) continue;
        _bonusObjetosGuardados.set(unit, _guardarBonusObjetos(unit));
    }

    // ============================================================
    // Resetear flags de sinergia (no de objetos) y neutralizar
    // ============================================================
    for (let unit of tablero) {
        if (unit) {
            if (unit.esZacian) continue;
            if (unit.esArticuno) continue;

            let objetosGuardados = {
                lifesteal: unit.lifesteal || 0,
                extraMoveGauge: unit.extraMoveGauge || 0,
                regenPercent: unit.regenPercent || 0,
                escudoPorcentaje: unit.escudoPorcentaje,
                escudoIntervalo: unit.escudoIntervalo,
                escudoDuracion: unit.escudoDuracion,
                escudoTimer: unit.escudoTimer || 0,
                escudoActivo: unit.escudoActivo || false,
                cargaGolpes: unit.cargaGolpes,
                cargaDaño: unit.cargaDaño,
                golpesAcumulados: unit.golpesAcumulados || 0,
                cargaActiva: unit.cargaActiva || false,
                maldicionDaño: unit.maldicionDaño,
                maldicionCuracion: unit.maldicionCuracion,
                maldicionRadio: unit.maldicionRadio,
                reduccionDañoPorHP: unit.reduccionDañoPorHP || false,
                reduccionMaxima: unit.reduccionMaxima || 0.30,
                reduceDefense: unit.reduceDefense,
                reduceSpDefense: unit.reduceSpDefense,
                duracionReduccion: unit.duracionReduccion || 3,
                regenPorSegundo: unit.regenPorSegundo,
                regenIntervalo: unit.regenIntervalo || 3,
                regenTimer: unit.regenTimer || 0,
                expExtraDerrota: unit.expExtraDerrota,
                metronomoPorAtaque: unit.metronomoPorAtaque,
                metronomoMaximo: unit.metronomoMaximo || 20,
                metronomoStacks: unit.metronomoStacks || 0,
                dañoPorcentajeMaxHP: unit.dañoPorcentajeMaxHP,
                dañoMaxHPIntervalo: unit.dañoMaxHPIntervalo || 0.3,
                movimientoInicial: unit.movimientoInicial || false,
                iraDaño: unit.iraDaño,
                iraVelocidad: unit.iraVelocidad || 0.20,
                iraActiva: unit.iraActiva || false,
                iraAliadosCaidos: unit.iraAliadosCaidos || 0,
                comboAtaques: unit.comboAtaques,
                comboVelocidad: unit.comboVelocidad || 0.50,
                comboDuracion: unit.comboDuracion || 6,
                comboContador: unit.comboContador || 0,
                comboActivo: unit.comboActivo || false,
                comboTimer: unit.comboTimer || 0,
                velocidadVsEscudo: unit.velocidadVsEscudo,
                curacionEscudoBonus: unit.curacionEscudoBonus,
                dañoReflejo: unit.dañoReflejo,
                reflejoIntervalo: unit.reflejoIntervalo || 1,
                reflejoTimer: unit.reflejoTimer || 0,
                invulnerablePorcentaje: unit.invulnerablePorcentaje,
                invulnerableDuracion: unit.invulnerableDuracion || 2.5,
                invulnerableActivo: unit.invulnerableActivo || false,
                invulnerableUsado: unit.invulnerableUsado || false,
                debilidadStack: unit.debilidadStack,
                debilidadMaxStacks: unit.debilidadMaxStacks || 5,
                debilidadDuracion: unit.debilidadDuracion || 4,
                debilidadStacks: unit.debilidadStacks || 0,
                debilidadTimer: unit.debilidadTimer || 0,
                inmuneImpedimentos: unit.inmuneImpedimentos || false,
                monedaExtra: unit.monedaExtra,
                objetos: unit.objetos ? [...unit.objetos] : [],
                tieneChip: unit.tieneChip || false,
                bonusTipo: unit.bonusTipo,
                bonusTipoExtra: unit.bonusTipoExtra || 1,
                focusActivo: unit.focusActivo || false
            };

            _resetearBonusNeutro(unit);

            unit.meteorShower = false;
            unit.burnDamage = 0;
            unit.critGuaranteed = false;
            unit.areaDamage = false;
            unit.hasLastStand = false;
            unit.regenPercent = 0;
            unit.revivePoints = 0;
            unit.maxHpDamage = 0;
            unit.moveMaxHpDamage = 0;
            unit.grassyField = false;
            unit.giantWave = false;
            unit.giantWaveBoosted = false;
            unit.cleanse = false;
            unit.poisonInfinite = false;
            unit.poisonStackable = false;
            unit.poisonDamageMultiplier = 1;
            unit.badlyPoison = false;
            unit.badlyPoisonDamage = 0;
            unit.fixedDamage = false;
            unit.fearAura = false;
            unit.fearAuraAttackBonus = 0;
            unit.frostDamageBonus = 0;
            unit.shockStacksBonus = 0;
            unit.windBarrierActive = false;
            unit.windGustActive = false;
            unit.whirlwindActive = false;
            unit.ghostPermanent = false;
            unit.ghostState = false;
            unit.ghostTimer = 0;
            unit.moveDamageStacks = 0;
            unit.moveDamageMaxStacks = 10;
            unit.inmuneImpedimentos = false;

            unit.lifesteal = objetosGuardados.lifesteal || 0;
            unit.extraMoveGauge = objetosGuardados.extraMoveGauge || 0;
            unit.regenPercent = objetosGuardados.regenPercent || 0;
            unit.escudoPorcentaje = objetosGuardados.escudoPorcentaje;
            unit.escudoIntervalo = objetosGuardados.escudoIntervalo;
            unit.escudoDuracion = objetosGuardados.escudoDuracion;
            unit.escudoTimer = objetosGuardados.escudoTimer || 0;
            unit.escudoActivo = objetosGuardados.escudoActivo || false;
            unit.cargaGolpes = objetosGuardados.cargaGolpes;
            unit.cargaDaño = objetosGuardados.cargaDaño;
            unit.golpesAcumulados = objetosGuardados.golpesAcumulados || 0;
            unit.cargaActiva = objetosGuardados.cargaActiva || false;
            unit.maldicionDaño = objetosGuardados.maldicionDaño;
            unit.maldicionCuracion = objetosGuardados.maldicionCuracion;
            unit.maldicionRadio = objetosGuardados.maldicionRadio;
            unit.reduccionDañoPorHP = objetosGuardados.reduccionDañoPorHP || false;
            unit.reduccionMaxima = objetosGuardados.reduccionMaxima || 0.30;
            unit.reduceDefense = objetosGuardados.reduceDefense;
            unit.reduceSpDefense = objetosGuardados.reduceSpDefense;
            unit.duracionReduccion = objetosGuardados.duracionReduccion || 3;
            unit.regenPorSegundo = objetosGuardados.regenPorSegundo;
            unit.regenIntervalo = objetosGuardados.regenIntervalo || 3;
            unit.regenTimer = objetosGuardados.regenTimer || 0;
            unit.expExtraDerrota = objetosGuardados.expExtraDerrota;
            unit.metronomoPorAtaque = objetosGuardados.metronomoPorAtaque;
            unit.metronomoMaximo = objetosGuardados.metronomoMaximo || 20;
            unit.metronomoStacks = objetosGuardados.metronomoStacks || 0;
            unit.dañoPorcentajeMaxHP = objetosGuardados.dañoPorcentajeMaxHP;
            unit.dañoMaxHPIntervalo = objetosGuardados.dañoMaxHPIntervalo || 0.3;
            unit.movimientoInicial = objetosGuardados.movimientoInicial || false;
            unit.iraDaño = objetosGuardados.iraDaño;
            unit.iraVelocidad = objetosGuardados.iraVelocidad || 0.20;
            unit.iraActiva = objetosGuardados.iraActiva || false;
            unit.iraAliadosCaidos = objetosGuardados.iraAliadosCaidos || 0;
            unit.comboAtaques = objetosGuardados.comboAtaques;
            unit.comboVelocidad = objetosGuardados.comboVelocidad || 0.50;
            unit.comboDuracion = objetosGuardados.comboDuracion || 6;
            unit.comboContador = objetosGuardados.comboContador || 0;
            unit.comboActivo = objetosGuardados.comboActivo || false;
            unit.comboTimer = objetosGuardados.comboTimer || 0;
            unit.velocidadVsEscudo = objetosGuardados.velocidadVsEscudo;
            unit.curacionEscudoBonus = objetosGuardados.curacionEscudoBonus;
            unit.dañoReflejo = objetosGuardados.dañoReflejo;
            unit.reflejoIntervalo = objetosGuardados.reflejoIntervalo || 1;
            unit.reflejoTimer = objetosGuardados.reflejoTimer || 0;
            unit.invulnerablePorcentaje = objetosGuardados.invulnerablePorcentaje;
            unit.invulnerableDuracion = objetosGuardados.invulnerableDuracion || 2.5;
            unit.invulnerableActivo = objetosGuardados.invulnerableActivo || false;
            unit.invulnerableUsado = objetosGuardados.invulnerableUsado || false;
            unit.debilidadStack = objetosGuardados.debilidadStack;
            unit.debilidadMaxStacks = objetosGuardados.debilidadMaxStacks || 5;
            unit.debilidadDuracion = objetosGuardados.debilidadDuracion || 4;
            unit.debilidadStacks = objetosGuardados.debilidadStacks || 0;
            unit.debilidadTimer = objetosGuardados.debilidadTimer || 0;
            unit.inmuneImpedimentos = objetosGuardados.inmuneImpedimentos || false;
            unit.monedaExtra = objetosGuardados.monedaExtra;
            if (objetosGuardados.objetos.length > 0) {
                unit.objetos = [...objetosGuardados.objetos];
            }
            unit.tieneChip = objetosGuardados.tieneChip || false;
            unit.bonusTipo = objetosGuardados.bonusTipo;
            unit.bonusTipoExtra = objetosGuardados.bonusTipoExtra || 1;
            unit.focusActivo = objetosGuardados.focusActivo || false;

            // 🆕 FIX #40: restaurar SOLO el delta de objetos
            _restaurarBonusObjetos(unit, _bonusObjetosGuardados.get(unit));
        }
    }

    // ============================================================
    // 🆕 FIX #40: aplicar sinergias SUMANDO sobre el delta de objetos
    // ============================================================
    for (let unit of tablero) {
        if (unit) {
            if (unit.esZacian) continue;
            if (unit.esArticuno) continue;

            for (let tipo of unit.pokemon.tipos) {
                if (sinergias.types[tipo]) {
                    let bonus = sinergias.types[tipo].bonus;
                    unit.aplicarBonus(bonus);

                    if (tipo === "Siniestro" && nivelSiniestro >= 2) {
                        unit.fearAura = true;
                        unit.fearAuraAttackBonus = fearBonus;
                        unit.bonusAttack *= (1 + fearBonus);
                        unit.bonusSpAttack *= (1 + fearBonus);
                    }
                    if (tipo === "Eléctrico" && bonus.shockStacks) {
                        unit.shockStacksBonus = bonus.shockStacks;
                        unit.shockDamageMultiplier = bonus.shockDamageMultiplier || 1;
                    }
                    if (tipo === "Fantasma") {
                        unit.ghostPermanent = bonus.ghostPermanent || false;
                        unit.ghostBonuses = {
                            attackSpeed: bonus.ghostAttackSpeed || 0,
                            attackPercent: bonus.ghostAttackPercent || 0,
                            spAttackPercent: bonus.ghostSpAttackPercent || 0,
                            damageReduction: bonus.ghostDamageReduction || 0
                        };
                        unit.ghostActivationTime = bonus.ghostActivationTime || 2;
                        unit.ghostIntervalo = bonus.ghostIntervalo || 0;
                    }
                    if (tipo === "Hielo" && bonus.frostDamage) {
                        unit.frostDamageBonus = bonus.frostDamage;
                        unit.frostReduceStats = bonus.frostReduceStats || false;
                    }
                    if (tipo === "Acero" && bonus.inmuneImpedimentos) {
                        unit.inmuneImpedimentos = true;
                    }
                    if (tipo === "Veneno" && bonus.poisonInfinite) {
                        unit.poisonInfinite = true;
                        unit.poisonStackable = bonus.poisonStackable || false;
                        unit.poisonDamageMultiplier = bonus.poisonDamageMultiplier || 1;
                    }
                }
            }
            if (unit.pokemon.clase && sinergias.classes[unit.pokemon.clase]) {
                unit.aplicarBonus(sinergias.classes[unit.pokemon.clase].bonus);
            }
            unit.actualizarStats();
        }
    }

    // ============================================================
    // AURA DE MIEDO (Siniestro) sobre enemigos
    // 🆕 v13 FIX: sincronización real y reset si no hay Siniestro.
    // ============================================================
    if (nivelSiniestro >= 2) {
        let reductionBonus = sinergias.types["Siniestro"].bonus;

        // 🆕 FIX v13: sincronizar AMBOS stacks con el panel
        window.fearAuraStacks = (typeof fearAuraStacks === 'number') ? fearAuraStacks : 0;
        window.enemyFearAuraStacks = (typeof window.enemyFearAuraStacks === 'number') ? window.enemyFearAuraStacks : 0;

        for (let enemy of enemyBoard) {
            if (enemy) {
                if (enemy._ataqueOriginal === undefined) {
                    enemy._ataqueOriginal = enemy.bonusAttack;
                    enemy._spAtaqueOriginal = enemy.bonusSpAttack;
                    enemy._defensaOriginal = enemy.bonusDefense;
                    enemy._spDefensaOriginal = enemy.bonusSpDefense;
                }

                enemy.bonusAttack = enemy._ataqueOriginal;
                enemy.bonusSpAttack = enemy._spAtaqueOriginal;
                enemy.bonusDefense = enemy._defensaOriginal;
                enemy.bonusSpDefense = enemy._spDefensaOriginal;

                if (reductionBonus.attackPercent) {
                    enemy.bonusAttack *= (1 - reductionBonus.attackPercent);
                }
                if (reductionBonus.spAttackPercent) {
                    enemy.bonusSpAttack *= (1 - reductionBonus.spAttackPercent);
                }
                if (reductionBonus.defenseReduction) {
                    if (typeof reductionBonus.defenseReduction === 'number' && reductionBonus.defenseReduction < 1) {
                        enemy.bonusDefense -= reductionBonus.defenseReduction * enemy.pokemon.defense;
                    } else {
                        enemy.bonusDefense -= reductionBonus.defenseReduction;
                    }
                    if (reductionBonus.defenseReductionFlat) {
                        enemy.bonusDefense -= reductionBonus.defenseReductionFlat;
                    }
                }
                if (reductionBonus.spDefenseReduction) {
                    if (typeof reductionBonus.spDefenseReduction === 'number' && reductionBonus.spDefenseReduction < 1) {
                        enemy.bonusSpDefense -= reductionBonus.spDefenseReduction * enemy.pokemon.spDefense;
                    } else {
                        enemy.bonusSpDefense -= reductionBonus.spDefenseReduction;
                    }
                    if (reductionBonus.spDefenseReductionFlat) {
                        enemy.bonusSpDefense -= reductionBonus.spDefenseReductionFlat;
                    }
                }
                enemy.actualizarStats();
            }
        }
    } else {
        // 🆕 FIX v13: si el jugador NO tiene Siniestro ≥ 2, resetear AMBOS
        // contadores (esto es lo que faltaba: el panel se quedaba congelado)
        fearAuraStacks = 0;
        window.fearAuraStacks = 0;
    }

    // ============================================================
    // ARTICUNO (Hielo 6) - jugador
    // ============================================================
    const hieloSinergia = sinergias.types["Hielo"];
    if (hieloSinergia && hieloSinergia.bonus && hieloSinergia.bonus.articunoBlizzard) {
        const yaInvocado = (typeof articunoUnidad !== 'undefined' && articunoUnidad !== null && articunoVisible === true);

        if (!yaInvocado && typeof invocarArticuno === 'function') {
            invocarArticuno();
        }
    } else {
        if (typeof articunoUnidad !== 'undefined' && articunoUnidad && articunoVisible) {
            if (typeof quitarArticunoDelTablero === 'function') {
                quitarArticunoDelTablero();
            }
            articunoUnidad = null;
            articunoVisible = false;
            articunoTimer = 0;
            articunoActivado = false;
            if (typeof articunoContainer !== 'undefined' && articunoContainer) {
                articunoContainer.style.display = 'none';
            }
            addConsoleMessage(`❄️ Articuno desaparece (sinergia Hielo < 6)`, 'info');
        }
    }

    mostrarSinergiasConChips('playerSinergiasTitulo');

    return sinergias;
}

// ============================================================
// GET SINERGIAS ACTIVAS ENEMIGO
// ============================================================
function getSinergiasActivasEnemigo() {
    let tipoCount = {}, claseCount = {}, familiasProcesadas = new Set();
    let bonusChips = {};

    for (let u of enemyBoard) {
        if (!u) continue;
        if (u.esZacian) continue;
        if (u.esArticuno) continue;

        let familia = getFamiliaEvolutiva(u.pokemon);
        if (!familia || familiasProcesadas.has(familia)) continue;
        familiasProcesadas.add(familia);
        for (let tipo of u.pokemon.tipos) {
            tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
        }
        let clase = u.pokemon.clase;
        claseCount[clase] = (claseCount[clase] || 0) + 1;
    }

    for (let u of enemyBoard) {
        if (!u) continue;
        if (u.esZacian) continue;
        if (u.esArticuno) continue;
        if (u.objetos && u.objetos.length > 0) {
            for (let objNombre of u.objetos) {
                const objeto = OBJETOS[objNombre];
                if (objeto && objeto.efecto && objeto.efecto.tipoBonus) {
                    const tipoBonus = objeto.efecto.tipoBonus;
                    const bonusExtra = objeto.efecto.bonusExtra || 1;
                    if (!bonusChips[tipoBonus]) bonusChips[tipoBonus] = 0;
                    bonusChips[tipoBonus] += bonusExtra;
                }
            }
        }
    }

    for (let tipo in bonusChips) {
        if (tipoCount[tipo] !== undefined) {
            tipoCount[tipo] += bonusChips[tipo];
        }
    }

    let activas = { types: {}, classes: {} };

    for (let tipo in tipoCount) {
        let count = tipoCount[tipo];
        let synergy = TYPE_SYNERGIES[tipo];
        if (synergy) {
            let niveles = Object.keys(synergy).map(Number).sort((a, b) => b - a);
            for (let nivel of niveles) {
                if (count >= nivel) {
                    activas.types[tipo] = { nivel, bonus: synergy[nivel] };
                    break;
                }
            }
        }
    }

    for (let clase in claseCount) {
        let count = claseCount[clase];
        let synergy = CLASS_SYNERGIES[clase];
        if (synergy) {
            let niveles = Object.keys(synergy).map(Number).sort((a, b) => b - a);
            for (let nivel of niveles) {
                if (count >= nivel) {
                    activas.classes[clase] = { nivel, bonus: synergy[nivel] };
                    break;
                }
            }
        }
    }

    return activas;
}

// ============================================================
// APLICAR SINERGIAS - ENEMIGO
// ============================================================
function aplicarSinergiasEnemigo() {
    let sinergias = getSinergiasActivasEnemigo();

    for (let unit of enemyBoard) {
        if (!unit) continue;
        unit._slowBase = undefined;
        unit._slowsActivos = 0;
    }

    // 🆕 FIX #40: Guardar delta de objetos ANTES de resetear (enemigo)
    const _bonusObjetosGuardadosEnemigo = new Map();
    for (let unit of enemyBoard) {
        if (!unit) continue;
        _bonusObjetosGuardadosEnemigo.set(unit, _guardarBonusObjetos(unit));
    }

    // ============================================================
    // Resetear flags de sinergia y neutralizar bonus
    // ============================================================
    for (let unit of enemyBoard) {
        if (unit) {
            let objetosGuardados = {
                lifesteal: unit.lifesteal || 0,
                extraMoveGauge: unit.extraMoveGauge || 0,
                regenPercent: unit.regenPercent || 0,
                escudoPorcentaje: unit.escudoPorcentaje,
                escudoIntervalo: unit.escudoIntervalo,
                escudoDuracion: unit.escudoDuracion,
                escudoTimer: unit.escudoTimer || 0,
                escudoActivo: unit.escudoActivo || false,
                cargaGolpes: unit.cargaGolpes,
                cargaDaño: unit.cargaDaño,
                golpesAcumulados: unit.golpesAcumulados || 0,
                cargaActiva: unit.cargaActiva || false,
                maldicionDaño: unit.maldicionDaño,
                maldicionCuracion: unit.maldicionCuracion,
                maldicionRadio: unit.maldicionRadio,
                reduccionDañoPorHP: unit.reduccionDañoPorHP || false,
                reduccionMaxima: unit.reduccionMaxima || 0.30,
                reduceDefense: unit.reduceDefense,
                reduceSpDefense: unit.reduceSpDefense,
                duracionReduccion: unit.duracionReduccion || 3,
                regenPorSegundo: unit.regenPorSegundo,
                regenIntervalo: unit.regenIntervalo || 3,
                regenTimer: unit.regenTimer || 0,
                expExtraDerrota: unit.expExtraDerrota,
                metronomoPorAtaque: unit.metronomoPorAtaque,
                metronomoMaximo: unit.metronomoMaximo || 20,
                metronomoStacks: unit.metronomoStacks || 0,
                dañoPorcentajeMaxHP: unit.dañoPorcentajeMaxHP,
                dañoMaxHPIntervalo: unit.dañoMaxHPIntervalo || 0.3,
                movimientoInicial: unit.movimientoInicial || false,
                iraDaño: unit.iraDaño,
                iraVelocidad: unit.iraVelocidad || 0.20,
                iraActiva: unit.iraActiva || false,
                iraAliadosCaidos: unit.iraAliadosCaidos || 0,
                comboAtaques: unit.comboAtaques,
                comboVelocidad: unit.comboVelocidad || 0.50,
                comboDuracion: unit.comboDuracion || 6,
                comboContador: unit.comboContador || 0,
                comboActivo: unit.comboActivo || false,
                comboTimer: unit.comboTimer || 0,
                velocidadVsEscudo: unit.velocidadVsEscudo,
                curacionEscudoBonus: unit.curacionEscudoBonus,
                dañoReflejo: unit.dañoReflejo,
                reflejoIntervalo: unit.reflejoIntervalo || 1,
                reflejoTimer: unit.reflejoTimer || 0,
                invulnerablePorcentaje: unit.invulnerablePorcentaje,
                invulnerableDuracion: unit.invulnerableDuracion || 2.5,
                invulnerableActivo: unit.invulnerableActivo || false,
                invulnerableUsado: unit.invulnerableUsado || false,
                debilidadStack: unit.debilidadStack,
                debilidadMaxStacks: unit.debilidadMaxStacks || 5,
                debilidadDuracion: unit.debilidadDuracion || 4,
                debilidadStacks: unit.debilidadStacks || 0,
                debilidadTimer: unit.debilidadTimer || 0,
                inmuneImpedimentos: unit.inmuneImpedimentos || false,
                monedaExtra: unit.monedaExtra,
                objetos: unit.objetos ? [...unit.objetos] : [],
                tieneChip: unit.tieneChip || false,
                bonusTipo: unit.bonusTipo,
                bonusTipoExtra: unit.bonusTipoExtra || 1,
                focusActivo: unit.focusActivo || false
            };

            _resetearBonusNeutro(unit);

            unit.meteorShower = false;
            unit.burnDamage = 0;
            unit.critGuaranteed = false;
            unit.areaDamage = false;
            unit.hasLastStand = false;
            unit.regenPercent = 0;
            unit.revivePoints = 0;
            unit.maxHpDamage = 0;
            unit.moveMaxHpDamage = 0;
            unit.grassyField = false;
            unit.giantWave = false;
            unit.giantWaveBoosted = false;
            unit.cleanse = false;
            unit.poisonInfinite = false;
            unit.poisonStackable = false;
            unit.poisonDamageMultiplier = 1;
            unit.badlyPoison = false;
            unit.badlyPoisonDamage = 0;
            unit.fixedDamage = false;
            unit.frostDamageBonus = 0;
            unit.shockStacksBonus = 0;
            unit.ghostPermanent = false;
            unit.ghostState = false;
            unit.ghostBonuses = { attackSpeed: 0, attackPercent: 0, spAttackPercent: 0, damageReduction: 0 };
            unit.fearAura = false;
            unit.fearAuraAttackBonus = 0;
            unit.inmuneImpedimentos = false;

            unit.lifesteal = objetosGuardados.lifesteal || 0;
            unit.extraMoveGauge = objetosGuardados.extraMoveGauge || 0;
            unit.regenPercent = objetosGuardados.regenPercent || 0;
            unit.escudoPorcentaje = objetosGuardados.escudoPorcentaje;
            unit.escudoIntervalo = objetosGuardados.escudoIntervalo;
            unit.escudoDuracion = objetosGuardados.escudoDuracion;
            unit.escudoTimer = objetosGuardados.escudoTimer || 0;
            unit.escudoActivo = objetosGuardados.escudoActivo || false;
            unit.cargaGolpes = objetosGuardados.cargaGolpes;
            unit.cargaDaño = objetosGuardados.cargaDaño;
            unit.golpesAcumulados = objetosGuardados.golpesAcumulados || 0;
            unit.cargaActiva = objetosGuardados.cargaActiva || false;
            unit.maldicionDaño = objetosGuardados.maldicionDaño;
            unit.maldicionCuracion = objetosGuardados.maldicionCuracion;
            unit.maldicionRadio = objetosGuardados.maldicionRadio;
            unit.reduccionDañoPorHP = objetosGuardados.reduccionDañoPorHP || false;
            unit.reduccionMaxima = objetosGuardados.reduccionMaxima || 0.30;
            unit.reduceDefense = objetosGuardados.reduceDefense;
            unit.reduceSpDefense = objetosGuardados.reduceSpDefense;
            unit.duracionReduccion = objetosGuardados.duracionReduccion || 3;
            unit.regenPorSegundo = objetosGuardados.regenPorSegundo;
            unit.regenIntervalo = objetosGuardados.regenIntervalo || 3;
            unit.regenTimer = objetosGuardados.regenTimer || 0;
            unit.expExtraDerrota = objetosGuardados.expExtraDerrota;
            unit.metronomoPorAtaque = objetosGuardados.metronomoPorAtaque;
            unit.metronomoMaximo = objetosGuardados.metronomoMaximo || 20;
            unit.metronomoStacks = objetosGuardados.metronomoStacks || 0;
            unit.dañoPorcentajeMaxHP = objetosGuardados.dañoPorcentajeMaxHP;
            unit.dañoMaxHPIntervalo = objetosGuardados.dañoMaxHPIntervalo || 0.3;
            unit.movimientoInicial = objetosGuardados.movimientoInicial || false;
            unit.iraDaño = objetosGuardados.iraDaño;
            unit.iraVelocidad = objetosGuardados.iraVelocidad || 0.20;
            unit.iraActiva = objetosGuardados.iraActiva || false;
            unit.iraAliadosCaidos = objetosGuardados.iraAliadosCaidos || 0;
            unit.comboAtaques = objetosGuardados.comboAtaques;
            unit.comboVelocidad = objetosGuardados.comboVelocidad || 0.50;
            unit.comboDuracion = objetosGuardados.comboDuracion || 6;
            unit.comboContador = objetosGuardados.comboContador || 0;
            unit.comboActivo = objetosGuardados.comboActivo || false;
            unit.comboTimer = objetosGuardados.comboTimer || 0;
            unit.velocidadVsEscudo = objetosGuardados.velocidadVsEscudo;
            unit.curacionEscudoBonus = objetosGuardados.curacionEscudoBonus;
            unit.dañoReflejo = objetosGuardados.dañoReflejo;
            unit.reflejoIntervalo = objetosGuardados.reflejoIntervalo || 1;
            unit.reflejoTimer = objetosGuardados.reflejoTimer || 0;
            unit.invulnerablePorcentaje = objetosGuardados.invulnerablePorcentaje;
            unit.invulnerableDuracion = objetosGuardados.invulnerableDuracion || 2.5;
            unit.invulnerableActivo = objetosGuardados.invulnerableActivo || false;
            unit.invulnerableUsado = objetosGuardados.invulnerableUsado || false;
            unit.debilidadStack = objetosGuardados.debilidadStack;
            unit.debilidadMaxStacks = objetosGuardados.debilidadMaxStacks || 5;
            unit.debilidadDuracion = objetosGuardados.debilidadDuracion || 4;
            unit.debilidadStacks = objetosGuardados.debilidadStacks || 0;
            unit.debilidadTimer = objetosGuardados.debilidadTimer || 0;
            unit.inmuneImpedimentos = objetosGuardados.inmuneImpedimentos || false;
            unit.monedaExtra = objetosGuardados.monedaExtra;
            if (objetosGuardados.objetos.length > 0) {
                unit.objetos = [...objetosGuardados.objetos];
            }
            unit.tieneChip = objetosGuardados.tieneChip || false;
            unit.bonusTipo = objetosGuardados.bonusTipo;
            unit.bonusTipoExtra = objetosGuardados.bonusTipoExtra || 1;
            unit.focusActivo = objetosGuardados.focusActivo || false;

            // 🆕 FIX #40: restaurar SOLO el delta de objetos
            _restaurarBonusObjetos(unit, _bonusObjetosGuardadosEnemigo.get(unit));
        }
    }

    // ============================================================
    // Aplicar sinergias SUMANDO sobre el delta de objetos
    // ============================================================
    for (let unit of enemyBoard) {
        if (unit) {
            for (let tipo of unit.pokemon.tipos) {
                if (sinergias.types[tipo]) {
                    let bonus = sinergias.types[tipo].bonus;
                    unit.aplicarBonus(bonus);

                    if (tipo === "Eléctrico" && bonus.shockStacks) {
                        unit.shockStacksBonus = bonus.shockStacks;
                        unit.shockDamageMultiplier = bonus.shockDamageMultiplier || 1;
                    }
                    if (tipo === "Fantasma") {
                        unit.ghostPermanent = bonus.ghostPermanent || false;
                        unit.ghostBonuses = {
                            attackSpeed: bonus.ghostAttackSpeed || 0,
                            attackPercent: bonus.ghostAttackPercent || 0,
                            spAttackPercent: bonus.ghostSpAttackPercent || 0,
                            damageReduction: bonus.ghostDamageReduction || 0
                        };
                        unit.ghostActivationTime = bonus.ghostActivationTime || 2;
                        unit.ghostIntervalo = bonus.ghostIntervalo || 0;
                    }
                    if (tipo === "Hielo" && bonus.frostDamage) {
                        unit.frostDamageBonus = bonus.frostDamage;
                        unit.frostReduceStats = bonus.frostReduceStats || false;
                    }
                    if (tipo === "Acero" && bonus.inmuneImpedimentos) {
                        unit.inmuneImpedimentos = true;
                    }
                    if (tipo === "Veneno" && bonus.poisonInfinite) {
                        unit.poisonInfinite = true;
                        unit.poisonStackable = bonus.poisonStackable || false;
                        unit.poisonDamageMultiplier = bonus.poisonDamageMultiplier || 1;
                    }
                }
            }
            if (unit.pokemon.clase && sinergias.classes[unit.pokemon.clase]) {
                unit.aplicarBonus(sinergias.classes[unit.pokemon.clase].bonus);
            }
            unit.actualizarStats();
        }
    }

    // ============================================================
    // ZACIAN ENEMIGO (coste 5 visual + tipos Hada/Acero)
    // ============================================================
    const hadaSinergiaEnemigo = sinergias.types["Hada"];

    let zacianEnemigoExistente = null;
    let zacianEnemigoIndice = -1;
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i] && enemyBoard[i].esZacian) {
            if (enemyBoard[i].hp <= 0 || enemyBoard[i].muerto) {
                debugLog("💀 Zacian enemigo con hp<=0, eliminándolo de enemyBoard");
                enemyBoard[i] = null;
                continue;
            }
            zacianEnemigoExistente = enemyBoard[i];
            zacianEnemigoIndice = i;
            break;
        }
    }

    let debeTenerZacianEnemigo = false;
    let starLevel = 0;
    let bonusHadaEnemigo = {};

    if (hadaSinergiaEnemigo) {
        const bonus = hadaSinergiaEnemigo.bonus;
        starLevel = bonus.zacianStar || 0;
        if (starLevel > 0) {
            debeTenerZacianEnemigo = true;
            bonusHadaEnemigo = bonus;
        }
    }

    if (!debeTenerZacianEnemigo && zacianEnemigoExistente) {
        if (zacianEnemigoIndice !== -1) {
            enemyBoard[zacianEnemigoIndice] = null;
            window.zacianEnemigoUnidad = null;
        }
    }

    if (debeTenerZacianEnemigo) {
        const ZACIAN_STATS = {
            1: { hp: 800,  ataque: 80,  spAttack: 30, defense: 225, spDefense: 220, attackSpeed: 0.7 },
            2: { hp: 1400, ataque: 115, spAttack: 45, defense: 225, spDefense: 220, attackSpeed: 0.85 },
            3: { hp: 2800, ataque: 185, spAttack: 70, defense: 280, spDefense: 280, attackSpeed: 1.0 }
        };
        const stats = ZACIAN_STATS[starLevel];
        const hadaCount = contarHadasEnTableroEnemigo();

        let hpTotalAliadosEnemigo = 0;
        for (let u of enemyBoard) {
            if (!u || u.esZacian || u.esArticuno) continue;
            hpTotalAliadosEnemigo += u.maxHp || 0;
        }
        const hpBonusAliados = Math.floor(hpTotalAliadosEnemigo * 0.25);
        const hpBonusHadas = hadaCount * 100;
        const hpFinalZacian = stats.hp + hpBonusAliados + hpBonusHadas;

        if (zacianEnemigoExistente) {
            const nivelAnteriorEnemigo = zacianEnemigoExistente.nivel;

            zacianEnemigoExistente.pokemon.hp = hpFinalZacian;
            zacianEnemigoExistente.pokemon.ataque = stats.ataque;
            zacianEnemigoExistente.pokemon.spAttack = stats.spAttack;
            zacianEnemigoExistente.pokemon.defense = stats.defense;
            zacianEnemigoExistente.pokemon.spDefense = stats.spDefense;
            zacianEnemigoExistente.pokemon.attackSpeed = stats.attackSpeed;
            zacianEnemigoExistente.nivel = starLevel;

            zacianEnemigoExistente.pokemon.tipos = ["Hada", "Acero"];

            zacianEnemigoExistente.metalClaw = bonusHadaEnemigo.metalClaw || false;
            zacianEnemigoExistente.crowned = bonusHadaEnemigo.crowned || false;
            zacianEnemigoExistente.drainCrown = bonusHadaEnemigo.drainCrown || false;
            zacianEnemigoExistente.behemothBlade = bonusHadaEnemigo.behemothBlade || false;

            if (starLevel >= 2) {
                zacianEnemigoExistente.zacianMovimiento = "garra-metal";
            } else {
                zacianEnemigoExistente.zacianMovimiento = "basico";
            }

            zacianEnemigoExistente.tieneDiscoUlti = bonusHadaEnemigo.behemothBlade ? true : false;

            const hadaBonus = 1 + (hadaCount * 0.05);
            zacianEnemigoExistente.bonusAttack = hadaBonus;
            zacianEnemigoExistente.bonusSpAttack = hadaBonus;
            zacianEnemigoExistente.bonusHp = 1;

            if (bonusHadaEnemigo.drainCrown) {
                zacianEnemigoExistente.lifesteal = 0.20;
                zacianEnemigoExistente.bonusAttack *= 1.20;
                zacianEnemigoExistente.bonusSpAttack *= 1.20;
                zacianEnemigoExistente.bonusHp *= 1.20;

                if (!zacianEnemigoExistente.objetos) zacianEnemigoExistente.objetos = [];
                if (!zacianEnemigoExistente.objetos.includes("Corona Drenaje")) {
                    zacianEnemigoExistente.objetos.unshift("Corona Drenaje");
                }
            } else {
                zacianEnemigoExistente.lifesteal = 0;
                if (zacianEnemigoExistente.objetos && zacianEnemigoExistente.objetos.includes("Corona Drenaje")) {
                    zacianEnemigoExistente.objetos = zacianEnemigoExistente.objetos.filter(o => o !== "Corona Drenaje");
                }
            }

            if (bonusHadaEnemigo.behemothBlade) {
                if (!zacianEnemigoExistente.objetos) zacianEnemigoExistente.objetos = [];
                if (!zacianEnemigoExistente.objetos.includes("Disco Definitivo")) {
                    zacianEnemigoExistente.objetos.push("Disco Definitivo");
                }
            } else {
                if (zacianEnemigoExistente.objetos && zacianEnemigoExistente.objetos.includes("Disco Definitivo")) {
                    zacianEnemigoExistente.objetos = zacianEnemigoExistente.objetos.filter(o => o !== "Disco Definitivo");
                }
            }

            zacianEnemigoExistente.actualizarStats();
            zacianEnemigoExistente.hp = Math.min(zacianEnemigoExistente.hp, zacianEnemigoExistente.maxHp);

            window.zacianEnemigoUnidad = zacianEnemigoExistente;

            if (nivelAnteriorEnemigo !== starLevel) {
                addConsoleMessage(`🎀 ENEMIGO: Zacian actualizado a ${starLevel}★ — HP ${stats.hp} + ${hpBonusAliados} (aliados) + ${hpBonusHadas} (hadas) = ${hpFinalZacian}`, 'enemy');
            }

        } else {
            let casillaLibre = enemyBoard.findIndex(cell => cell === null);

            if (casillaLibre === -1) {
                // Sin casilla libre
            } else {
                const zacianPokemon = {
                    id: 999,
                    nombre: "Zacian",
                    spriteId: 888,
                    tipos: ["Hada", "Acero"],
                    clase: "Atacante",
                    rol: "frontline",
                    hp: hpFinalZacian,
                    ataque: stats.ataque,
                    spAttack: stats.spAttack,
                    defense: stats.defense,
                    spDefense: stats.spDefense,
                    attackSpeed: stats.attackSpeed,
                    critRate: 0,
                    critDamage: 2.0,
                    startingEnergy: 0,
                    energyGauge: 50,
                    coste: 5,
                    evolucion: null,
                    esEspecial: true,
                    noEquiparObjetos: true
                };

                let zacianEnemigo = new Unidad(zacianPokemon, starLevel, 999, 0);
                zacianEnemigo.esZacian = true;
                zacianEnemigo.noEquiparObjetos = true;
                zacianEnemigo.metalClaw = bonusHadaEnemigo.metalClaw || false;
                zacianEnemigo.crowned = bonusHadaEnemigo.crowned || false;
                zacianEnemigo.drainCrown = bonusHadaEnemigo.drainCrown || false;
                zacianEnemigo.behemothBlade = bonusHadaEnemigo.behemothBlade || false;

                if (starLevel >= 2) {
                    zacianEnemigo.zacianMovimiento = "garra-metal";
                } else {
                    zacianEnemigo.zacianMovimiento = "basico";
                }

                zacianEnemigo.tieneDiscoUlti = bonusHadaEnemigo.behemothBlade ? true : false;

                zacianEnemigo.energy = zacianEnemigo.pokemon.startingEnergy || 0;
                zacianEnemigo.equipo = 'enemy';

                const hadaBonus = 1 + (hadaCount * 0.05);
                zacianEnemigo.bonusAttack *= hadaBonus;
                zacianEnemigo.bonusSpAttack *= hadaBonus;
                zacianEnemigo.actualizarStats();
                zacianEnemigo.hp = zacianEnemigo.maxHp;

                if (bonusHadaEnemigo.drainCrown) {
                    zacianEnemigo.lifesteal = 0.20;
                    zacianEnemigo.bonusAttack = (zacianEnemigo.bonusAttack || 1) * 1.20;
                    zacianEnemigo.bonusSpAttack = (zacianEnemigo.bonusSpAttack || 1) * 1.20;
                    zacianEnemigo.bonusHp = (zacianEnemigo.bonusHp || 1) * 1.20;
                    zacianEnemigo.actualizarStats();
                    zacianEnemigo.hp = Math.min(zacianEnemigo.hp, zacianEnemigo.maxHp);

                    if (!zacianEnemigo.objetos) zacianEnemigo.objetos = [];
                    if (!zacianEnemigo.objetos.includes("Corona Drenaje")) {
                        zacianEnemigo.objetos.unshift("Corona Drenaje");
                    }
                }

                if (bonusHadaEnemigo.behemothBlade) {
                    if (!zacianEnemigo.objetos) zacianEnemigo.objetos = [];
                    if (!zacianEnemigo.objetos.includes("Disco Definitivo")) {
                        zacianEnemigo.objetos.push("Disco Definitivo");
                    }
                }

                enemyBoard[casillaLibre] = zacianEnemigo;

                window.zacianEnemigoUnidad = zacianEnemigo;
                addConsoleMessage(`🎀 ¡ENEMIGO invoca a Zacian ${starLevel}★ — HP ${stats.hp} + ${hpBonusAliados} (aliados) + ${hpBonusHadas} (hadas) = ${hpFinalZacian}`, 'enemy');

                if (typeof playPokemonCry === 'function') {
                    playPokemonCry(888);
                }
            }
        }
    }

    // ============================================================
    // Articuno enemigo - crear UNA SOLA VEZ por combate
    // ============================================================
    const hieloSinergiaEnemigo = sinergias.types["Hielo"];
    if (hieloSinergiaEnemigo && hieloSinergiaEnemigo.bonus && hieloSinergiaEnemigo.bonus.articunoBlizzard) {
        const yaExiste = (typeof window.articunoEnemigoUnidad !== 'undefined' && window.articunoEnemigoUnidad !== null);
        const yaActivado = !!window.articunoEnemigoActivado;

        if (!yaExiste && !yaActivado) {
            const articunoPokemon = {
                id: 144,
                nombre: "Articuno (Enemigo)",
                spriteId: 144,
                tipos: ["Hielo", "Volador"],
                clase: "At. Especial",
                hp: 1,
                ataque: 1,
                spAttack: 1,
                defense: 1,
                spDefense: 1,
                attackSpeed: 0.01,
                critRate: 0,
                critDamage: 1.0,
                startingEnergy: 0,
                energyGauge: 100,
                coste: 0,
                evolucion: null
            };
            let articunoEnemigo = new Unidad(articunoPokemon, 1, 144, 0);
            articunoEnemigo.esArticuno = true;
            articunoEnemigo.equipo = 'enemy';
            window.articunoEnemigoUnidad = articunoEnemigo;
            window.articunoEnemigoTimer = 0;
            window.articunoEnemigoActivado = false;
            addConsoleMessage(`❄️ ¡ENEMIGO invoca a Articuno!`, 'enemy');
        }
    } else {
        if (typeof window.articunoEnemigoUnidad !== 'undefined' && window.articunoEnemigoUnidad) {
            window.articunoEnemigoUnidad = null;
            window.articunoEnemigoTimer = 0;
            window.articunoEnemigoActivado = false;
        }
    }

    // 🆕 FIX v13: Sincronizar el Aura de Miedo del ENEMIGO con el panel
    const nivelSiniestroEnemigo = (sinergias.types && sinergias.types["Siniestro"])
        ? sinergias.types["Siniestro"].nivel : 0;

    if (nivelSiniestroEnemigo >= 2) {
        window.enemyFearAuraStacks = (typeof window.enemyFearAuraStacks === 'number')
            ? window.enemyFearAuraStacks : 0;
    } else {
        window.enemyFearAuraStacks = 0;
    }

    mostrarSinergiasConChips('enemySinergiasTitulo');
    return sinergias;
}

// ============================================================
// CONTAR HADAS EN TABLERO ENEMIGO
// ============================================================
function contarHadasEnTableroEnemigo() {
    let count = 0;
    for (let u of enemyBoard) {
        if (!u || u.esZacian || u.esArticuno) continue;

        if (u.pokemon.tipos && u.pokemon.tipos.includes("Hada")) {
            count++;
        }

        if (u.objetos && u.objetos.length > 0) {
            for (let objNombre of u.objetos) {
                const objeto = OBJETOS[objNombre];
                if (objeto && objeto.efecto && objeto.efecto.tipoBonus === "Hada") {
                    count += objeto.efecto.bonusExtra || 1;
                }
            }
        }
    }
    return count;
}

// ============================================================
// 🔥 BORDE DE LLAMAS - SINERGIA FUEGO NIVEL 5+
// ============================================================

function actualizarBordeLlamasCombate() {
    const playerBoard = document.getElementById("playerBoard");
    if (playerBoard) {
        let fuegoNivel = 0;
        try {
            const sinergiasPlayer = getSinergiasActivas();
            if (sinergiasPlayer && sinergiasPlayer.types && sinergiasPlayer.types["Fuego"]) {
                fuegoNivel = sinergiasPlayer.types["Fuego"].nivel || 0;
            }
        } catch (e) {
            console.warn("⚠️ No se pudo leer sinergias del jugador:", e);
        }

        const playerBoardContainer = playerBoard.closest('.board-container') || playerBoard;

        if (fuegoNivel >= 5) {
            playerBoardContainer.classList.add("board-llamas-fuego");
        } else {
            playerBoardContainer.classList.remove("board-llamas-fuego");
        }
    }

    const enemyBoardEl = document.getElementById("enemigoBoard");
    if (enemyBoardEl) {
        let fuegoNivelEnemigo = 0;
        try {
            const sinergiasEnemigo = getSinergiasActivasEnemigo();
            if (sinergiasEnemigo && sinergiasEnemigo.types && sinergiasEnemigo.types["Fuego"]) {
                fuegoNivelEnemigo = sinergiasEnemigo.types["Fuego"].nivel || 0;
            }
        } catch (e) {
            console.warn("⚠️ No se pudo leer sinergias del enemigo:", e);
        }

        const enemyBoardContainer = enemyBoardEl.closest('.board-container') || enemyBoardEl;

        if (fuegoNivelEnemigo >= 5) {
            enemyBoardContainer.classList.add("board-llamas-fuego");
            enemyBoardContainer.classList.add("enemy-side");
        } else {
            enemyBoardContainer.classList.remove("board-llamas-fuego");
            enemyBoardContainer.classList.remove("enemy-side");
        }
    }
}

function limpiarBordeLlamasCombate() {
    const playerBoard = document.getElementById("playerBoard");
    const enemyBoardEl = document.getElementById("enemigoBoard");

    if (playerBoard) {
        const container = playerBoard.closest('.board-container') || playerBoard;
        container.classList.remove("board-llamas-fuego");
        container.classList.remove("enemy-side");
    }
    if (enemyBoardEl) {
        const container = enemyBoardEl.closest('.board-container') || enemyBoardEl;
        container.classList.remove("board-llamas-fuego");
        container.classList.remove("enemy-side");
    }
}

window.actualizarBordeLlamasCombate = actualizarBordeLlamasCombate;
window.limpiarBordeLlamasCombate = limpiarBordeLlamasCombate;

// ============================================================
// 🆕 PANEL DE AURA DE MIEDO (Siniestro) - SOLO INFORMATIVO
// ============================================================

function construirPanelAuraMiedoHTML(lado = 'player') {
    const stacksActuales = (lado === 'enemy')
        ? (window.enemyFearAuraStacks || 0)
        : (window.fearAuraStacks || 0);

    const umbrales = [
        { stacks: 5,  bonus: "+10% Atk/AtkEsp" },
        { stacks: 15, bonus: "+20% Atk/AtkEsp" },
        { stacks: 25, bonus: "+30% Atk/AtkEsp" },
        { stacks: 40, bonus: "+40% Atk/AtkEsp" },
        { stacks: 60, bonus: "+60% Atk/AtkEsp" }
    ];

    let tramosHtml = '';
    let siguienteUmbral = null;

    for (let u of umbrales) {
        const alcanzado = stacksActuales >= u.stacks;
        const esSiguiente = !alcanzado && siguienteUmbral === null;
        if (esSiguiente) siguienteUmbral = u;

        let clase = '';
        if (alcanzado) clase = 'nv-tramo-alcanzado';
        else if (esSiguiente) clase = 'nv-tramo-sin-espacio';

        const iconoEstado = alcanzado ? '✅' : (esSiguiente ? '⏳' : '🔒');

        tramosHtml += `
            <div class="nv-tramo ${clase}">
                <span class="nv-tramo-icono">${iconoEstado}</span>
                <span class="nv-tramo-semillas">[${u.stacks}]</span>
                <span class="nv-tramo-texto">🔺 ${u.bonus}</span>
            </div>
        `;
    }

    let progresoHtml = '';
    if (siguienteUmbral) {
        const previo = umbrales.filter(u => u.stacks <= stacksActuales).pop();
        const base = previo ? previo.stacks : 0;
        const rango = siguienteUmbral.stacks - base;
        const avance = stacksActuales - base;
        const porcentaje = Math.min(100, Math.floor((avance / rango) * 100));

        progresoHtml = `
            <div class="nv-progreso-container">
                <div class="nv-progreso-barra">
                    <div class="nv-progreso-fill" style="width: ${porcentaje}%;"></div>
                </div>
                <span class="nv-progreso-texto">${avance}/${rango}</span>
            </div>
        `;
    } else {
        progresoHtml = `
            <div class="nv-progreso-container">
                <div class="nv-progreso-barra">
                    <div class="nv-progreso-fill" style="width: 100%; background: linear-gradient(90deg, #fbbf24, #fde68a);"></div>
                </div>
                <span class="nv-progreso-texto" style="color: #fbbf24;">¡MÁXIMO!</span>
            </div>
        `;
    }

    return `
        <div class="nv-panel" style="border-color: rgba(148, 163, 184, 0.4); background: linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9));">
            <div class="nv-header" title="El Aura de Miedo reduce el Ataque/AtkEsp del enemigo y aumenta el Ataque/AtkEsp de tus Pokémon Siniestro según los stacks.">
                <div class="nv-titulo">
                    <span class="nv-icono">😨</span>
                    <span class="nv-nombre" style="color: #94a3b8;">AURA DE MIEDO</span>
                </div>
                <div class="nv-contador" style="border-color: rgba(148, 163, 184, 0.25);">
                    <span class="nv-contador-base" style="color: #e2e8f0;">${stacksActuales}</span>
                    <span class="nv-contador-sep">/</span>
                    <span class="nv-contador-max">60</span>
                </div>
            </div>

            <div class="nv-descripcion">
                A medida que acumulas bajas enemigas, tus Pokémon de Tipo Siniestro ganan un aumento pasivo en su estadística de Ataque.
            </div>

            ${progresoHtml}

            <div class="nv-tramos">
                ${tramosHtml}
            </div>
        </div>
    `;
}

// ============================================================
// 🆕 v14: FIX — función refrescarPanelAuraMiedo (se perdió)
// ============================================================
function refrescarPanelAuraMiedo(lado = 'player') {
    const contenedor = document.getElementById('auraMiedoContainer');
    if (!contenedor) return;

    if (lado === 'enemy') {
        if (typeof window.enemyFearAuraStacks !== 'number') {
            window.enemyFearAuraStacks = 0;
        }
    } else {
        if (typeof window.fearAuraStacks !== 'number') {
            window.fearAuraStacks = 0;
        }
        try {
            if (typeof getSinergiasActivas === 'function') {
                const sinergias = getSinergiasActivas();
                const nivelSiniestro = (sinergias.types && sinergias.types["Siniestro"])
                    ? sinergias.types["Siniestro"].nivel : 0;
                if (nivelSiniestro < 2) {
                    window.fearAuraStacks = 0;
                }
            }
        } catch (e) {}
    }

    contenedor.innerHTML = construirPanelAuraMiedoHTML(lado);
}

window.construirPanelAuraMiedoHTML = construirPanelAuraMiedoHTML;
window.refrescarPanelAuraMiedo = refrescarPanelAuraMiedo;

// ============================================================
// LOGS DE CARGA
// ============================================================