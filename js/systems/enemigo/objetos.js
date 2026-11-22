// ============================================================
// ENEMIGO · OBJETOS
// Extraído de js/systems/enemigo.js (sin cambios de lógica).
// ============================================================

function _devolverObjetosAlBaulEnemigo(unidad, contexto = '') {
    if (!unidad || !unidad.objetos || unidad.objetos.length === 0) return 0;

    if (typeof enemyBaulObjetos === 'undefined' || !Array.isArray(enemyBaulObjetos)) {
        console.warn('⚠️ _devolverObjetosAlBaulEnemigo: enemyBaulObjetos no inicializado, ignorando');
        return 0;
    }

    let devueltos = 0;
    for (let obj of unidad.objetos) {
        if (enemyBaulObjetos.length < CONFIG.MAX_BAUL) {
            enemyBaulObjetos.push(obj);
            devueltos++;
            if (contexto) {
                addConsoleMessage(`📦 ${rivalNombre()}: ${obj} devuelto al baúl (de ${unidad.pokemon.nombre}) ${contexto}`, 'enemy');
            }
        } else {
            addConsoleMessage(`⚠️ ${rivalNombre()}: baúl lleno, ${obj} perdido`, 'enemy');
        }
    }
    unidad.objetos = [];

    if (typeof recalcularEfectosObjetos === 'function') {
        try { recalcularEfectosObjetos(unidad); } catch (e) {}
    }

    return devueltos;
}

function enemyEquiparObjetos() {
    if (enemyCombatiendo) return false;

    // 🆕 FIX: Asegurarse de que enemyBaulObjetos existe
    if (typeof enemyBaulObjetos === 'undefined') enemyBaulObjetos = [];

        // 🆕 FIX: Volcar rival.objetosAcumulados al baúl enemigo para que
    // se puedan equipar. Antes los objetos de recompensa PvE y los Discos
    // se quedaban en rival.objetosAcumulados y NUNCA se equipaban.
    //
    // 🔧 v2: ya NO hacemos shift() (borrar del rival). Solo COPIAMOS los
    // objetos que NO estén ya equipados. Así:
    //   - Los Discos no equipados (rival sin 2★) siguen en objetosAcumulados
    //     y se vuelven a copiar al baúl en cada restauración.
    //   - Los Discos YA equipados no se duplican en el baúl.
    if (window.rivalActual && window.torneoRivales) {
        const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
        if (rivalEnTorneo && Array.isArray(rivalEnTorneo.objetosAcumulados) && rivalEnTorneo.objetosAcumulados.length > 0) {
            const MAX_BAUL = (typeof CONFIG !== 'undefined' && CONFIG.MAX_BAUL) ? CONFIG.MAX_BAUL : 8;

            // Recoger objetos ya equipados en el tablero/banquillo actual
            const objetosEquipadosActualmente = new Set();
            for (const u of [...enemyBoard, ...enemyBanquillo]) {
                if (!u || !u.objetos) continue;
                for (const o of u.objetos) objetosEquipadosActualmente.add(o);
            }

            // 💿 FIX: no volver a meter un Disco en el baúl si el equipo ya
            // tiene el máximo que le corresponde por nivel.
            const _maxDiscosEq = (typeof maxDiscosPorNivelEquipo === 'function') ? maxDiscosPorNivelEquipo(enemyLevel) : (enemyLevel >= 8 ? 2 : 1);
            const _discosEq = (typeof contarDiscosEnUnidades === 'function') ? contarDiscosEnUnidades([...enemyBoard, ...enemyBanquillo]) : 0;
            for (const obj of rivalEnTorneo.objetosAcumulados) {
                if (enemyBaulObjetos.length >= MAX_BAUL) break;
                if (objetosEquipadosActualmente.has(obj)) continue; // Ya equipado, no duplicar
                if (obj === "Disco Definitivo" && _discosEq >= _maxDiscosEq) continue;
                enemyBaulObjetos.push(obj);
            }
        }
    }

    // 🆕 FIX: deduplicar el baúl (no puede haber 2 objetos iguales).
    //    Antes, al volcar rival.objetosAcumulados se duplicaban los objetos
    //    (1 en el baúl + 1 en objetosAcumulados), así que el rival equipaba
    //    2 Roca del Rey, 2 Chip Planta, etc.
    enemyBaulObjetos = [...new Set(enemyBaulObjetos)];

    if (enemyBaulObjetos.length === 0) return false;

    let ordenPokemon = [];
    for (let i = 0; i < enemyBoard.length; i++) {
        let u = enemyBoard[i];
        if (!u) continue;
        if (u.esZacian) continue;

        const objetosNormales = (u.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return !(od && od.efecto && od.efecto.esDiscoUlti);
        });
        const discosEquipados = (u.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return od && od.efecto && od.efecto.esDiscoUlti;
        });

        const tieneHuecoNormal = objetosNormales.length < 2;
        const tieneHuecoDisco = discosEquipados.length < 1 && u.nivel >= 2;

        if (!tieneHuecoNormal && !tieneHuecoDisco) continue;

        let prioridad = 0;
        if (enemyPokemonEncaja(u.pokemon)) prioridad += 10;
        if (_esPokemonClave(u)) prioridad += 50;
        // ⭐ Los MÁS PODEROSOS (3★ > 2★ > 1★) deben recibir objetos primero.
        if (u.nivel === 3) prioridad += 300;
        else if (u.nivel === 2) prioridad += 120;

        if (objetosNormales.length === 0) prioridad += 15;
        if (objetosNormales.length === 1) prioridad += 5;

        ordenPokemon.push({ unidad: u, indice: i, prioridad: prioridad });
    }
    ordenPokemon.sort((a, b) => b.prioridad - a.prioridad);

    // ============================================================
    // 🆕 FIX v20: REASIGNAR OBJETOS DE POKÉMON MALOS A BUENOS
    // ============================================================
    let reasignaciones = 0;

    function _reasignarObjetosEnemigo() {
        if (!enemyBaulObjetos) enemyBaulObjetos = [];

        let peores = [];
        for (let i = 0; i < enemyBoard.length; i++) {
            const u = enemyBoard[i];
            if (!u || u.esZacian || u.esArticuno) continue;
            if (!u.objetos || u.objetos.length === 0) continue;

            // ⭐ No quitar objetos a unidades fuertes (2★/3★): solo a 1★,
            // para que "los más poderosos" conserven sus objetos.
            if ((u.nivel || 1) >= 2) continue;
            const encaja = enemyPokemonEncaja(u.pokemon);
            if (!encaja) {
                const utilidad = evaluarPokemon(u.pokemon);
                peores.push({ unidad: u, indice: i, utilidad: utilidad });
            }
        }
        peores.sort((a, b) => a.utilidad - b.utilidad);

        if (peores.length === 0) return;

        let buenos = [];
        for (let i = 0; i < enemyBoard.length; i++) {
            const u = enemyBoard[i];
            if (!u || u.esZacian || u.esArticuno) continue;
            if (!enemyPokemonEncaja(u.pokemon)) continue;

            const objetosNormales = (u.objetos || []).filter(o => {
                const od = OBJETOS[o];
                return !(od && od.efecto && od.efecto.esDiscoUlti);
            });
            if (objetosNormales.length >= 2) continue;

            const utilidad = evaluarPokemon(u.pokemon);
            buenos.push({ unidad: u, indice: i, utilidad: utilidad });
        }
        buenos.sort((a, b) => b.utilidad - a.utilidad);

        if (buenos.length === 0) return;

        for (let peor of peores) {
            for (let b = 0; b < buenos.length; b++) {
                const bueno = buenos[b];
                if (!bueno.unidad.objetos) bueno.unidad.objetos = [];

                const objetosNormalesBueno = bueno.unidad.objetos.filter(o => {
                    const od = OBJETOS[o];
                    return !(od && od.efecto && od.efecto.esDiscoUlti);
                });
                if (objetosNormalesBueno.length >= 2) continue;

                const obj = peor.unidad.objetos.shift();
                if (!obj) break;

                if (typeof aplicarObjeto === 'function' && aplicarObjeto(bueno.unidad, obj)) {
                    reasignaciones++;
                    addConsoleMessage(
                        `🤖 ${rivalNombre()}: ${obj} reasignado de ${peor.unidad.pokemon.nombre} a ${bueno.unidad.pokemon.nombre}`,
                        'enemy'
                    );
                } else {
                    if (enemyBaulObjetos.length < CONFIG.MAX_BAUL) {
                        enemyBaulObjetos.push(obj);
                    }
                }

                if (peor.unidad.objetos.length === 0) break;
            }
        }
    }

    if (typeof aplicarObjeto === 'function') {
        _reasignarObjetosEnemigo();
    }

        // ============================================================
    // 🆕 FIX: PRIORIDAD MÁXIMA AL DISCO DEFINITIVO
    // ============================================================
    let equipado = reasignaciones > 0;
    const idxDisco = enemyBaulObjetos.indexOf("Disco Definitivo");
    const _maxDiscosEquipo = (typeof maxDiscosPorNivelEquipo === 'function') ? maxDiscosPorNivelEquipo(enemyLevel) : (enemyLevel >= 8 ? 2 : 1);
    const _discosEquipadosEquipo = (typeof contarDiscosEnUnidades === 'function') ? contarDiscosEnUnidades([...enemyBoard, ...enemyBanquillo]) : 0;
    // 💿 Si ya tiene el máximo equipado, cualquier Disco sobrante del baúl
    // se elimina (evita ver 2-3 Discos en el baúl rival).
    if (idxDisco !== -1 && _discosEquipadosEquipo >= _maxDiscosEquipo) {
        for (let i = enemyBaulObjetos.length - 1; i >= 0; i--) {
            if (enemyBaulObjetos[i] === "Disco Definitivo") enemyBaulObjetos.splice(i, 1);
        }
    }
    if (idxDisco !== -1 && _discosEquipadosEquipo < _maxDiscosEquipo) {
        const candidatosDisco = [...enemyBoard, ...enemyBanquillo].filter(u => {
            if (!u || u.esZacian || u.esArticuno || u.nivel < 2) return false;
            const discos = (u.objetos || []).filter(o => {
                const od = OBJETOS[o];
                return od && od.efecto && od.efecto.esDiscoUlti;
            });
            return discos.length === 0;
        });
        if (candidatosDisco.length > 0) {
            candidatosDisco.sort((a, b) => (b.nivel || 1) - (a.nivel || 1));
            const targetDisco = candidatosDisco[0];
            if (aplicarObjeto(targetDisco, "Disco Definitivo")) {
                enemyBaulObjetos.splice(idxDisco, 1);
                addConsoleMessage(`💿 ${rivalNombre()} equipó Disco Definitivo a ${targetDisco.pokemon.nombre} (prioridad)`, 'enemy');
                equipado = true;
            }
        }
    }

    // ============================================================
    // 2) Para cada Pokémon, intentar equipar sus recomendados
    // ============================================================
    for (let item of ordenPokemon) {
        let u = item.unidad;

        const objetosNormales = (u.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return !(od && od.efecto && od.efecto.esDiscoUlti);
        });
        const discosEquipados = (u.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return od && od.efecto && od.efecto.esDiscoUlti;
        });
        const tieneHuecoNormal = objetosNormales.length < 2;
        const tieneHuecoDisco = discosEquipados.length < 1 && u.nivel >= 2;

        if (!tieneHuecoNormal && !tieneHuecoDisco) continue;

        const recomendados = (typeof getObjetosRecomendados === 'function')
            ? getObjetosRecomendados(u.pokemon)
            : [];

        for (let nombreRec of recomendados) {
            const idxBaul = enemyBaulObjetos.indexOf(nombreRec);
            if (idxBaul === -1) continue;

            const objeto = OBJETOS[nombreRec];
            if (!objeto) continue;

            const esDisco = objeto.efecto && objeto.efecto.esDiscoUlti;
            if (esDisco && !tieneHuecoDisco) continue;
            if (!esDisco && !tieneHuecoNormal) continue;

            if (objeto.requerido) {
                let tieneTipo = false;
                if (u.pokemon.tipos) {
                    for (let tipo of u.pokemon.tipos) {
                        if (tipo === objeto.requerido) { tieneTipo = true; break; }
                    }
                }
                if (!tieneTipo) continue;
            }

                        // 🆕 FIX: no equipar el mismo objeto 2 veces al mismo Pokémon
            if (u.objetos && u.objetos.includes(nombreRec)) continue;

                        // 🆕 FIX: no equipar el mismo objeto 2 veces al mismo Pokémon
            if (u.objetos && u.objetos.includes(nombreRec)) continue;

            if (aplicarObjeto(u, nombreRec)) {
                enemyBaulObjetos.splice(idxBaul, 1);
                addConsoleMessage(`🤖 ${rivalNombre()} equipó ${nombreRec} a ${u.pokemon.nombre} (recomendado)`, 'enemy');
                aplicarSinergiasEnemigo();
                renderizar();
                equipado = true;
                break;
            }
        }
    }

    // ============================================================
    // 3) Fallback
    // ============================================================
    if (enemyBaulObjetos.length > 0) {
        for (let item of ordenPokemon) {
            let u = item.unidad;

            const objetosNormales = (u.objetos || []).filter(o => {
                const od = OBJETOS[o];
                return !(od && od.efecto && od.efecto.esDiscoUlti);
            });
            const discosEquipados = (u.objetos || []).filter(o => {
                const od = OBJETOS[o];
                return od && od.efecto && od.efecto.esDiscoUlti;
            });
            const tieneHuecoNormal = objetosNormales.length < 2;
            const tieneHuecoDisco = discosEquipados.length < 1 && u.nivel >= 2;

            if (!tieneHuecoNormal && !tieneHuecoDisco) continue;

            for (let j = enemyBaulObjetos.length - 1; j >= 0; j--) {
                const nombre = enemyBaulObjetos[j];
                const objeto = OBJETOS[nombre];
                if (!objeto) continue;

                const esDisco = objeto.efecto && objeto.efecto.esDiscoUlti;
                if (esDisco && !tieneHuecoDisco) continue;
                if (!esDisco && !tieneHuecoNormal) continue;

                if (objeto.requerido) {
                    let tieneTipo = false;
                    if (u.pokemon.tipos) {
                        for (let tipo of u.pokemon.tipos) {
                            if (tipo === objeto.requerido) { tieneTipo = true; break; }
                        }
                    }
                    if (!tieneTipo) continue;
                }

                                // 🆕 FIX: no equipar el mismo objeto 2 veces al mismo Pokémon
                if (u.objetos && u.objetos.includes(nombre)) continue;

                if (aplicarObjeto(u, nombre)) {
                    enemyBaulObjetos.splice(j, 1);
                    addConsoleMessage(`🤖 ${rivalNombre()} equipó ${nombre} a ${u.pokemon.nombre} (fallback)`, 'enemy');
                    aplicarSinergiasEnemigo();
                    renderizar();
                    equipado = true;
                    break;
                }
            }
        }
    }

    return equipado;
}

function enemyComprarObjetoExperto() {
    if (enemyCombatiendo) return false;
    if (enemyObjetoCompradoEstaRonda) return false;
    if (typeof enemyBaulObjetos === 'undefined' || enemyBaulObjetos.length >= CONFIG.MAX_BAUL) return false;
    if (!enemyObjetosEnTienda || enemyObjetosEnTienda.length === 0) return false;

    // 🆕 FIX v23 #32: solo considerar Chips de tipos de la ESTRATEGIA,
    // no de Pokémon sueltos. Chip Planta ya no se compra si Lorelei
    // no es Planta.
    function objetoEncajaConEstrategia(nombre) {
        const obj = OBJETOS[nombre];
        if (!obj) return false;

        const tipoObjeto = (obj.efecto && obj.efecto.tipoBonus)
            ? obj.efecto.tipoBonus
            : (obj.requerido || null);

        if (!tipoObjeto) return true;

        // 🆕 FIX v23 #32: solo considerar tipos de la ESTRATEGIA.
        if (!enemyEstrategia.tipos.includes(tipoObjeto)) {
            return false;
        }

        const tieneTipo = [...enemyBoard, ...enemyBanquillo].some(u =>
            u && u.pokemon && u.pokemon.tipos && u.pokemon.tipos.includes(tipoObjeto)
        );
        return tieneTipo;
    }

    function scoreObjeto(nombre) {
        const obj = OBJETOS[nombre];
        if (!obj) return -999;

        if (!objetoEncajaConEstrategia(nombre)) return -999;

        let score = 0;

        if (obj.efecto && obj.efecto.tipoBonus) {
            for (let u of [...enemyBoard, ...enemyBanquillo]) {
                if (u && u.pokemon.tipos && u.pokemon.tipos.includes(obj.efecto.tipoBonus)) {
                    score += 30;
                }
            }
        }

        if (obj.unico && enemyBaulObjetos.includes(nombre)) {
            score -= 50;
        }

        if (obj.efecto) {
            if (obj.efecto.damagePercent || obj.efecto.attackPercent || obj.efecto.spAttackPercent) {
                score += 10;
            }
            if (obj.efecto.hpBonus || obj.efecto.defense || obj.efecto.spDefense) {
                score += 8;
            }
            if (obj.efecto.regenPorSegundo || obj.efecto.escudoPorcentaje) {
                score += 12;
            }
        }

        return score;
    }

        let objetosPriorizados = [...enemyObjetosEnTienda].sort((a, b) => {
        return scoreObjeto(b) - scoreObjeto(a);
    });

    // 🆕 FIX 4: separar en 2 grupos:
    //   1. Chips de tipos de la ESTRATEGIA (útiles)
    //   2. Objetos genéricos (siempre útiles si el Pokémon puede equiparlos)
    // Chips de tipos que NO son de la estrategia → descartar SIEMPRE.
        const chipsUtiles = [];
    const objetosGenericos = [];

    for (let nombre of objetosPriorizados) {
        const obj = OBJETOS[nombre];
        if (!obj) continue;

        const esChip = obj.efecto && obj.efecto.tipoBonus;
        if (esChip) {
            // 🆕 FIX: Si es un Chip y NO es de su estrategia, se descarta SIEMPRE.
            if (enemyEstrategia.tipos.includes(obj.efecto.tipoBonus)) {
                const tieneTipo = [...enemyBoard, ...enemyBanquillo].some(u =>
                    u && u.pokemon && u.pokemon.tipos && u.pokemon.tipos.includes(obj.efecto.tipoBonus)
                );
                if (tieneTipo) chipsUtiles.push(nombre);
            }
        } else {
            // Objetos normales
            if (obj.requerido) {
                const tieneTipo = [...enemyBoard, ...enemyBanquillo].some(u =>
                    u && u.pokemon && u.pokemon.tipos && u.pokemon.tipos.includes(obj.requerido)
                );
                if (!tieneTipo) continue;
            }
            objetosGenericos.push(nombre);
        }
    }

    const listaFinal = [...chipsUtiles, ...objetosGenericos];

    if (listaFinal.length === 0) {
        console.log(`   🚫 ${rivalNombre()} no encontró objetos útiles (solo chips inútiles)`);
        return false;
    }

        const objetoElegido = listaFinal[0];
    enemyBaulObjetos.push(objetoElegido);
    const index = enemyObjetosEnTienda.indexOf(objetoElegido);
    if (index !== -1) enemyObjetosEnTienda.splice(index, 1);
    enemyObjetoCompradoEstaRonda = true;

    // 🆕 FIX: también guardar el objeto en el rival del torneo para el snapshot
    if (window.torneoRivales && window.rivalActual) {
        const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
        if (rivalEnTorneo) {
            if (!rivalEnTorneo.objetosAcumulados) rivalEnTorneo.objetosAcumulados = [];
            rivalEnTorneo.objetosAcumulados.push(objetoElegido);
        }
    }

    const esChipElegido = OBJETOS[objetoElegido].efecto && OBJETOS[objetoElegido].efecto.tipoBonus;
    if (esChipElegido) {
        addConsoleMessage(`🤖 ${rivalNombre()} compró ${objetoElegido} (CHIP de ${OBJETOS[objetoElegido].efecto.tipoBonus})`, 'enemy');
    } else {
        addConsoleMessage(`🤖 ${rivalNombre()} compró ${objetoElegido} (OBJETO)`, 'enemy');
    }

    // Equipar inmediatamente lo que acaba de comprar
    if (typeof enemyEquiparObjetos === 'function') {
        enemyEquiparObjetos();
    }

    return true;
}

// ============================================================
// 🆕 COMPRA DE OBJETO GARANTIZADA POR RONDA DE OBJETOS
// ============================================================
function enemyComprarObjetoGarantizado() {
    if (window.modoDosJugadores) return false;
    if (window.enRondaPvE === true) return false;
    if (enemyCombatiendo) return false;

    const esRondaObjetos = (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(ronda));
    if (!esRondaObjetos) return false;

    if (typeof enemyObjetoCompradoEstaRonda !== 'undefined' && enemyObjetoCompradoEstaRonda) {
        console.log(`   🚫 ${rivalNombre()} ya compró objeto esta ronda`);
        return false;
    }

    // 🆕 FIX: si el rival ya compró su objeto en avanzarRivalUnTurno
    // (torneo.js), no comprar OTRO aquí. Evita duplicados.
    if (window.rivalActual && window.torneoRivales) {
        const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
        if (rivalEnTorneo && rivalEnTorneo._objetoCompradoEstaRonda) {
            console.log(`   🚫 ${rivalNombre()} ya compró objeto en su turno de avance (torneo.js)`);
            return false;
        }
    }

    if (typeof enemyBaulObjetos === 'undefined' || !Array.isArray(enemyBaulObjetos)) return false;
    if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) {
        console.log(`   🚫 ${rivalNombre()} baúl lleno`);
        return false;
    }

    if (!enemyObjetosEnTienda || enemyObjetosEnTienda.length === 0) {
        if (typeof generarObjetosTienda === 'function') {
            enemyObjetosEnTienda = generarObjetosTienda();
            console.log(`   📦 ${rivalNombre()}: tienda de objetos generada (${enemyObjetosEnTienda.length} objetos)`);
        }
    }

    if (!enemyObjetosEnTienda || enemyObjetosEnTienda.length === 0) {
        console.log(`   ⚠️ ${rivalNombre()}: no hay objetos que comprar`);
        return false;
    }

    let mejorObjeto = null;
    let mejorScore = -Infinity;

    for (let nombre of enemyObjetosEnTienda) {
        const obj = OBJETOS[nombre];
        if (!obj) continue;

        let score = 0;

        if (obj.efecto && obj.efecto.tipoBonus) {
            if (enemyEstrategia && enemyEstrategia.tipos && enemyEstrategia.tipos.includes(obj.efecto.tipoBonus)) {
                score += 100;
            } else {
                score = -999; // 🆕 descartar chips que no son de la estrategia
            }
        }

        if (obj.efecto) {
            if (obj.efecto.damagePercent || obj.efecto.attackPercent || obj.efecto.spAttackPercent) score += 10;
            if (obj.efecto.hpBonus || obj.efecto.defense || obj.efecto.spDefense) score += 8;
            if (obj.efecto.regenPorSegundo || obj.efecto.escudoPorcentaje) score += 12;
        }

        if (obj.requerido) {
            const tieneTipo = [...enemyBoard, ...enemyBanquillo].some(u =>
                u && u.pokemon && u.pokemon.tipos && u.pokemon.tipos.includes(obj.requerido)
            );
            if (!tieneTipo) score = -999;
        }

        if (score > mejorScore) {
            mejorScore = score;
            mejorObjeto = nombre;
        }
    }

    if (!mejorObjeto || mejorScore <= -900) {
        console.log(`   ⚠️ ${rivalNombre()}: ningún objeto útil en la tienda (solo chips de otra estrategia)`);
        return false;
    }

        enemyBaulObjetos.push(mejorObjeto);
    const idx = enemyObjetosEnTienda.indexOf(mejorObjeto);
    if (idx !== -1) enemyObjetosEnTienda.splice(idx, 1);
    if (typeof enemyObjetoCompradoEstaRonda !== 'undefined') enemyObjetoCompradoEstaRonda = true;

    // 🆕 FIX: guardar el objeto en el rival del torneo para el snapshot
    if (window.torneoRivales && window.rivalActual) {
        const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
        if (rivalEnTorneo) {
            if (!rivalEnTorneo.objetosAcumulados) rivalEnTorneo.objetosAcumulados = [];
            rivalEnTorneo.objetosAcumulados.push(mejorObjeto);
        }
    }

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(`🤖 ${rivalNombre()} compró ${mejorObjeto} (ronda de objetos)`, 'enemy');
    }

    if (typeof enemyEquiparObjetos === 'function') {
        enemyEquiparObjetos();
    }

    return true;
}
