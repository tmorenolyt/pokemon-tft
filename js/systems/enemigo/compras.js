// ============================================================
// ENEMIGO · COMPRAS
// Extraído de js/systems/enemigo.js (sin cambios de lógica).
// ============================================================

function enemyVerificarTodasLasFusiones() {
    // 🆕 FIX PvE: los monstruos nunca fusionan
    if (window.enRondaPvE === true) {
        return false;
    }

    // 🆕 FIX RONDA 2: no fusionar en ronda 2.
    // Queremos que el rival tenga 2 unidades en el tablero,
    // aunque sean repetidas. La fusión empieza en ronda 3.
    if (typeof fase !== 'undefined' && fase <= 2) {
        return false;
    }

    let fusionRealizada = false;
    let maxIter = 25;

    for (let iter = 0; iter < maxIter; iter++) {
        let fusionEnEstaIteracion = false;
        let todasLasUnidades = [];

        for (let i = 0; i < enemyBoard.length; i++) {
            if (enemyBoard[i] && !enemyBoard[i].esZacian) {
                todasLasUnidades.push({
                    unidad: enemyBoard[i], ubicacion: 'tablero', indice: i,
                    nombre: enemyBoard[i].pokemon.nombre, nivel: enemyBoard[i].nivel,
                    baseId: enemyBoard[i].baseId, costeOriginal: enemyBoard[i].costeOriginal,
                    objetos: enemyBoard[i].objetos ? [...enemyBoard[i].objetos] : [],
                    familia: getFamiliaEvolutivaEnemigo(enemyBoard[i].pokemon),
                    movimientoActivo: enemyBoard[i].movimientoActivo || 'principal'
                });
            }
        }
        for (let i = 0; i < enemyBanquillo.length; i++) {
            if (enemyBanquillo[i] && !enemyBanquillo[i].esZacian) {
                todasLasUnidades.push({
                    unidad: enemyBanquillo[i], ubicacion: 'banquillo', indice: i,
                    nombre: enemyBanquillo[i].pokemon.nombre, nivel: enemyBanquillo[i].nivel,
                    baseId: enemyBanquillo[i].baseId, costeOriginal: enemyBanquillo[i].costeOriginal,
                    objetos: enemyBanquillo[i].objetos ? [...enemyBanquillo[i].objetos] : [],
                    familia: getFamiliaEvolutivaEnemigo(enemyBanquillo[i].pokemon),
                    movimientoActivo: enemyBanquillo[i].movimientoActivo || 'principal'
                });
            }
        }

        let grupos = {};
        for (let item of todasLasUnidades) {
            let clave = `${item.familia}_${item.nivel}`;
            if (!grupos[clave]) grupos[clave] = [];
            grupos[clave].push(item);
        }

        let fusionEncontrada = false;
        for (let clave in grupos) {
            if (grupos[clave].length >= 3) {
                let items = grupos[clave].slice(0, 3);
                let primero = items[0];
                let original = primero.unidad;
                let nombreOriginal = original.pokemon.nombre;
                let nivelOriginal = original.nivel;
                let evol = original.pokemon.evolucion;
                let nuevoNivel = nivelOriginal + 1;
                let baseId = primero.baseId;
                let costeOriginal = primero.costeOriginal;
                let objetosFusion = [];
                let movActivo = primero.movimientoActivo || 'principal';

                for (let item of items) {
                    if (item.objetos && item.objetos.length > 0) {
                        for (let obj of item.objetos) {
                            if (!objetosFusion.includes(obj)) objetosFusion.push(obj);
                        }
                    }
                }

                let primerIndice = items[0].indice;
                let primerUbicacion = items[0].ubicacion;

                for (let item of items) {
                    if (item.ubicacion === 'tablero') enemyBoard[item.indice] = null;
                    else enemyBanquillo[item.indice] = null;
                }

                if (nuevoNivel > 3) {
                    for (let item of items) {
                        let nuevaUnidad = new Unidad(original.pokemon, nivelOriginal, baseId, costeOriginal);
                        if (nivelOriginal >= 2) nuevaUnidad.movSecundarioDesbloqueado = true;
                        nuevaUnidad.movimientoActivo = movActivo;
                        if (item.ubicacion === 'tablero') enemyBoard[item.indice] = nuevaUnidad;
                        else enemyBanquillo[item.indice] = nuevaUnidad;
                    }
                    continue;
                }

                let evolucionData = null;
                if (evol) evolucionData = getPokemonPorNombre(evol);
                if (!evolucionData) evolucionData = getPokemonPorNombre(nombreOriginal);
                if (!evolucionData) {
                    for (let item of items) {
                        let nuevaUnidad = new Unidad(original.pokemon, nivelOriginal, baseId, costeOriginal);
                        if (nivelOriginal >= 2) nuevaUnidad.movSecundarioDesbloqueado = true;
                        nuevaUnidad.movimientoActivo = movActivo;
                        if (item.ubicacion === 'tablero') enemyBoard[item.indice] = nuevaUnidad;
                        else enemyBanquillo[item.indice] = nuevaUnidad;
                    }
                    continue;
                }

                let nuevaUnidad = new Unidad(evolucionData, nuevoNivel, baseId, costeOriginal);

                if (nuevoNivel >= 2) {
                    nuevaUnidad.movSecundarioDesbloqueado = true;
                }
                nuevaUnidad.movimientoActivo = movActivo;

                if (objetosFusion.length > 0) {
                    for (let obj of objetosFusion) {
                        if (nuevaUnidad.objetos.length < 2 && !nuevaUnidad.objetos.includes(obj)) {
                            aplicarObjeto(nuevaUnidad, obj);
                        } else {
                            if (typeof enemyBaulObjetos !== 'undefined' && enemyBaulObjetos.length < CONFIG.MAX_BAUL) {
                                enemyBaulObjetos.push(obj);
                                addConsoleMessage(`📦 ${rivalNombre()}: ${obj} devuelto al baúl (no cabía en ${evolucionData.nombre})`, 'enemy');
                            }
                        }
                    }
                }

                if (primerUbicacion === 'tablero') {
                    enemyBoard[primerIndice] = nuevaUnidad;
                } else {
                    enemyBanquillo[primerIndice] = nuevaUnidad;
                }

                fusionEnEstaIteracion = true;
                fusionRealizada = true;
                addConsoleMessage(`🤖 ${rivalNombre()}: 2 ${nombreOriginal} (${nivelOriginal}★) + 1 nueva → ${evolucionData.nombre} (${nuevoNivel}★)`, 'enemy');

                fusionEncontrada = true;
                break;
            }
        }
        if (!fusionEncontrada) break;
    }

    return fusionRealizada;
}

async function enemyComprarExperto() {
    if (enemyCombatiendo) return false;

        // 🆕 FIX: en ronda 2 solo se permite 1 compra (igual que el jugador)
        // 🆕 FIX: en ronda 2 solo se permite 1 compra (igual que el jugador)
    if (fase === 2 && window.enemyComproEnRonda2) {
        console.log(`   🚫 ${rivalNombre()} ya compró en ronda 2 → bloqueado`);
        return false;
    }

    if (!enemyTienda || enemyTienda.length === 0) {
        generarTiendaEnemigo();
        if (!enemyTienda || enemyTienda.length === 0) return false;
    }

    if (enemyEstiloActual === "late-game" && fase >= 5 && fase <= 8) {
        const tieneClave = rivalTienePokemonClave();
        const infoCoste = calcularCosteObjetivoRival();

        if (!tieneClave.tieneClave && infoCoste.costeAlto >= 3 && enemyGold < 25) {
            return false;
        }
    }

    if (enemyEstiloActual === "late-game" && fase >= 5 && fase <= 8) {
        const tieneClave = rivalTienePokemonClave();
        const infoCoste = calcularCosteObjetivoRival();

        if (!tieneClave.tieneClave && infoCoste.costeAlto >= 3) {
            const hayClaveEnTienda = enemyTienda.some(p =>
                p && enemyEstrategia.prioridad.includes(p.nombre) && p.coste >= 3
            );

            if (!hayClaveEnTienda) {
                return false;
            }
        }
    }

    if (enemyEstiloActual === "late-game" && fase >= 5 && fase <= 8) {
        const tieneClave = rivalTienePokemonClave();
        const infoCoste = calcularCosteObjetivoRival();

        if (!tieneClave.tieneClave && infoCoste.costeAlto >= 3 && enemyGold < 10) {
            const hayClaveEnTienda = enemyTienda.some(p =>
                p && enemyEstrategia.prioridad.includes(p.nombre) && p.coste >= 3
            );

            if (hayClaveEnTienda) {
                return false;
            }
        }
    }

    const esRondaTemprana = (fase <= 2);

        let espacioBanquillo = enemyBanquillo.filter(cell => cell === null).length;
    let espacioTablero = enemyBoard.filter(u => u !== null).length < maxEnemyUnits();
    let hayEspacio = espacioBanquillo > 0 || espacioTablero;

    // 🆕 FIX: si no hay espacio, vender en bucle hasta tener hueco (no solo 1 vez)
    if (!hayEspacio) {
        let intentosVenta = 0;
        while (!hayEspacio && intentosVenta < 4) {
            const vendidos = enemyDecidirQueVender();
            if (!vendidos) break;
            espacioBanquillo = enemyBanquillo.filter(cell => cell === null).length;
            espacioTablero = enemyBoard.filter(u => u !== null).length < maxEnemyUnits();
            hayEspacio = espacioBanquillo > 0 || espacioTablero;
            intentosVenta++;
        }
        if (!hayEspacio) return false;
    }

    let pokemonPriorizados = [];
    for (let p of enemyTienda) {
        if (!p) continue;
        if (enemyGold < p.coste) continue;

        if (_enemyPokemonBloqueadoPor3Estrellas(p)) continue;
        if (_enemyPokemonBloqueadoPor2Estrellas(p)) continue;

        let copiasDisponibles = getCopiasDisponibles(p);
        if (copiasDisponibles <= 0) continue;

                        // 🆕 FIX: en ronda 2, permitir cualquier Pokémon (aunque no sea útil)
        // y NO descartar por prioridad baja. El rival está OBLIGADO a
        // comprar 1 Pokémon en ronda 2 igual que el jugador.
        const esRonda2Forzada = (fase === 2);

        if (!esRonda2Forzada) {
            if (!esRondaTemprana && !enemyPokemonEsUtil(p) && !_comparteClaseConTipo(p)) continue;
        }

        let prioridad = evaluarPokemon(p);
        if (enemyPokemonEncaja(p)) prioridad += 30;

        // 🆕 En ronda 2 forzamos prioridad positiva SIEMPRE.
        if (esRonda2Forzada && prioridad < 0) prioridad = 10;
        else if (esRondaTemprana && prioridad < 0) prioridad = 10;

        pokemonPriorizados.push({ pokemon: p, prioridad: prioridad, index: enemyTienda.indexOf(p) });
    }

    pokemonPriorizados.sort((a, b) => b.prioridad - a.prioridad);

    if (fase <= 5) {
        pokemonPriorizados.sort((a, b) => {
            if (b.prioridad !== a.prioridad) return b.prioridad - a.prioridad;
            return a.pokemon.coste - b.pokemon.coste;
        });
    }

        if (pokemonPriorizados.length > 0) {
        let logStr = pokemonPriorizados.slice(0, 3).map(item =>
            `${item.pokemon.nombre}(${esPokemonFrontlineEnemigo(item.pokemon) ? 'F' : 'B'},${item.prioridad})`
        ).join(' | ');
        console.log(`   🛒 Tienda: ${logStr}`);
    }

    // 🆕 FIX: si la compra completaría una fusión, vender 1★ para hacer hueco
    // aunque no haya espacio natural. Es un bloque NUEVO (no sustituye nada).
    if (!hayEspacio) {
        let pokemonObjetivo = null;
        if (pokemonPriorizados.length > 0 && pokemonPriorizados[0] && pokemonPriorizados[0].pokemon) {
            pokemonObjetivo = pokemonPriorizados[0].pokemon;
        }

        if (pokemonObjetivo) {
            let copiasNivel1 = 0;
            for (let u of [...enemyBoard, ...enemyBanquillo]) {
                if (u && !u.esZacian && u.pokemon.nombre === pokemonObjetivo.nombre && u.nivel === 1) copiasNivel1++;
            }

            if (copiasNivel1 >= 2) {
                let vendido = false;
                for (let i = 0; i < enemyBanquillo.length; i++) {
                    if (enemyBanquillo[i] && enemyBanquillo[i].nivel === 1 && !enemyBanquillo[i].esZacian
                        && enemyBanquillo[i].pokemon.nombre !== pokemonObjetivo.nombre) {
                        _devolverObjetosAlBaulEnemigo(enemyBanquillo[i]);
                        let valor = enemyBanquillo[i].costeOriginal || 1;
                        enemyGold = Math.max(0, (enemyGold || 0) + valor);
                        enemyBanquillo[i] = null;
                        vendido = true;
                        break;
                    }
                }
                if (!vendido) {
                    for (let i = 0; i < enemyBoard.length; i++) {
                        if (enemyBoard[i] && enemyBoard[i].nivel === 1 && !enemyBoard[i].esZacian
                            && enemyBoard[i].pokemon.nombre !== pokemonObjetivo.nombre) {
                            _devolverObjetosAlBaulEnemigo(enemyBoard[i]);
                            let valor = enemyBoard[i].costeOriginal || 1;
                            enemyGold = Math.max(0, (enemyGold || 0) + valor);
                            enemyBoard[i] = null;
                            vendido = true;
                            break;
                        }
                    }
                }
                if (vendido) {
    // 🆕 FIX: actualizar espacioBanquillo y espacioTablero
    espacioBanquillo = enemyBanquillo.filter(cell => cell === null).length;
    espacioTablero = enemyBoard.filter(u => u !== null).length < maxEnemyUnits();
    hayEspacio = espacioBanquillo > 0 || espacioTablero;
    console.log(`   🆘 ${rivalNombre()}: vendió 1★ para hacer hueco y comprar ${pokemonObjetivo.nombre} (fusión)`);
}
            }
        }
    }

    const marcarCompraRonda2 = () => {
        if (fase === 2) {
            window.enemyComproEnRonda2 = true;
            console.log(`   ✅ ${rivalNombre()} ya compró en ronda 2 → bloqueado para más compras`);
        }
    };

    // 🆕 FIX A: si tiene oro de sobra y pocas unidades, comprar aunque sea relleno
    const totalUnidadesActuales = enemyBoard.filter(u => u).length + enemyBanquillo.filter(u => u).length;
    const maxUnitsActual = (typeof TABLA_MAX_UNIDADES !== 'undefined')
        ? (TABLA_MAX_UNIDADES[enemyLevel] || 1)
        : Math.min(enemyLevel, 6);
    const necesitaRelleno = totalUnidadesActuales < maxUnitsActual && enemyGold >= 20;

                for (let item of pokemonPriorizados) {
        // 🆕 FIX: en ronda 2, comprar CUALQUIER Pokémon (aunque la prioridad sea negativa)
        // para asegurar que cada rival tenga 2 Pokémon como el jugador.
        const esRondaDos = (fase === 2);

        if (!esRondaDos) {
            if (!esRondaTemprana && item.prioridad <= 0 && !necesitaRelleno) continue;

            // 🆕 FIX #35 + FIX A: descartar solo si NO necesita relleno
            if (item.prioridad < -50 && !necesitaRelleno) {
                console.log(`   🚫 ${item.pokemon.nombre} descartado (prioridad ${Math.round(item.prioridad)} < -50)`);
                continue;
            }
            if (item.prioridad < -200 && necesitaRelleno) {
                console.log(`   🚫 ${item.pokemon.nombre} descartado (prioridad ${Math.round(item.prioridad)} < -200, ni para relleno)`);
                continue;
            }
        } else {
            // 🆕 En ronda 2 el rival está OBLIGADO a comprar 1 Pokémon.
            // No filtramos por prioridad: cogemos el primero que se pueda comprar.
            console.log(`   🎯 [Ronda 2] ${item.pokemon.nombre} seleccionado por obligación (prioridad ${Math.round(item.prioridad)})`);
        }

        let p = item.pokemon;

        let copiasEnTablero = 0, copiasEnBanquillo = 0;
        let unidadesNivel1 = [];
        let unidadesNivel2 = [];

        for (let i = 0; i < enemyBoard.length; i++) {
            if (enemyBoard[i] && enemyBoard[i].pokemon.nombre === p.nombre && !enemyBoard[i].esZacian) {
                copiasEnTablero++;
                if (enemyBoard[i].nivel === 1) unidadesNivel1.push({ ubicacion: 'tablero', indice: i, unidad: enemyBoard[i] });
                else if (enemyBoard[i].nivel === 2) unidadesNivel2.push({ ubicacion: 'tablero', indice: i, unidad: enemyBoard[i] });
            }
        }
        for (let i = 0; i < enemyBanquillo.length; i++) {
            if (enemyBanquillo[i] && enemyBanquillo[i].pokemon.nombre === p.nombre && !enemyBanquillo[i].esZacian) {
                copiasEnBanquillo++;
                if (enemyBanquillo[i].nivel === 1) unidadesNivel1.push({ ubicacion: 'banquillo', indice: i, unidad: enemyBanquillo[i] });
                else if (enemyBanquillo[i].nivel === 2) unidadesNivel2.push({ ubicacion: 'banquillo', indice: i, unidad: enemyBanquillo[i] });
            }
        }

                let compraParaFusion = false;
        let nivelDeFusion = 0;
        let unidadesParaFusionLista = [];

        // 🆕 FIX RONDA 2: no fusionar automáticamente en ronda 2.
        // En ronda 2 queremos que el rival tenga 2 unidades en el tablero,
        // aunque sean repetidas. La fusión empieza en ronda 3.
        if (typeof fase !== 'undefined' && fase > 2) {
            if (unidadesNivel1.length >= 2) {
                compraParaFusion = true; nivelDeFusion = 1;
                unidadesParaFusionLista = unidadesNivel1.slice(0, 2);
            } else if (unidadesNivel2.length >= 2) {
                compraParaFusion = true; nivelDeFusion = 2;
                unidadesParaFusionLista = unidadesNivel2.slice(0, 2);
            }
        }

        if (compraParaFusion) {
            const rol = esPokemonFrontlineEnemigo(p) ? 'melee' : 'backline';

            let yaColocadas = 0;
            for (let i = 0; i < enemyBoard.length; i++) {
                const u = enemyBoard[i];
                if (!u || u.esZacian) continue;
                const rolU = esPokemonFrontlineEnemigo(u.pokemon) ? 'melee' : 'backline';
                if (rolU === rol) yaColocadas++;
            }

            let emptyBoard = obtenerIndiceColocacionInicial('enemy', rol, yaColocadas);

            if (emptyBoard === -1 || enemyBoard[emptyBoard] !== null) {
                emptyBoard = enemyBoard.findIndex(cell => cell === null);
            }

            const encajaDirecto = enemyPokemonEncaja(p);

            if (emptyBoard !== -1 && encajaDirecto && enemyBoard.filter(u => u !== null).length < maxEnemyUnits()) {
                if (consumirDelPool(p.id)) {
                    let nuevaUnidad = new Unidad(p, 1, p.id, p.coste);
                    enemyBoard[emptyBoard] = nuevaUnidad;
                    enemyGold -= p.coste;
                    enemyTienda.splice(item.index, 1);
                    enemyVerificarTodasLasFusiones();
                    enemyMoverMejoresAlTablero();
                    marcarCompraRonda2();
                    return true;
                }
            }
        }

        if (espacioBanquillo) {
            let banquilloIndex = enemyBanquillo.findIndex(cell => cell === null);
            if (banquilloIndex !== -1) {
                if (consumirDelPool(p.id)) {
                    let nuevaUnidad = new Unidad(p, 1, p.id, p.coste);
                    enemyBanquillo[banquilloIndex] = nuevaUnidad;
                    enemyGold -= p.coste;
                    enemyTienda.splice(item.index, 1);
                    enemyVerificarTodasLasFusiones();
                    enemyMoverMejoresAlTablero();
                    marcarCompraRonda2();
                    return true;
                }
            }
        }
    }

        let pokemonBaratos = enemyTienda
        .filter(p => {
            if (!p) return false;
            if (enemyGold < p.coste) return false;
            if (getCopiasDisponibles(p) <= 0) return false;
            if (!enemyPokemonEncaja(p)) return false;
            if (_enemyPokemonBloqueadoPor3Estrellas(p)) return false;
            if (_enemyPokemonBloqueadoPor2Estrellas(p)) return false;

            // 🆕 FIX #35: no comprar baratos con prioridad muy negativa
            const prio = evaluarPokemon(p);
            if (prio < -50) {
                return false;
            }

            return true;
        })
        .sort((a, b) => a.coste - b.coste);

        for (let p of pokemonBaratos) {
        if (consumirDelPool(p.id)) {
            let nuevaUnidad = new Unidad(p, 1, p.id, p.coste);
            let emptyBoard = enemyBoard.findIndex(cell => cell === null);
            if (emptyBoard !== -1 && enemyBoard.filter(u => u !== null).length < maxEnemyUnits()) {
                enemyBoard[emptyBoard] = nuevaUnidad;
                enemyGold -= p.coste;
                let idx = enemyTienda.indexOf(p);
                if (idx !== -1) enemyTienda.splice(idx, 1);
                marcarCompraRonda2();
                return true;
            }
            let banquilloIndex = enemyBanquillo.findIndex(cell => cell === null);
            if (banquilloIndex !== -1) {
                enemyBanquillo[banquilloIndex] = nuevaUnidad;
                enemyGold -= p.coste;
                let idx = enemyTienda.indexOf(p);
                if (idx !== -1) enemyTienda.splice(idx, 1);
                marcarCompraRonda2();
                return true;
            } else {
                devolverAlPool(p.id);
            }
        }
    }

    return false;
}

function enemyCalcularReservaMinimaReroll() {
    // 🆕 FIX: si tiene muchísimo oro, no reservar nada.
    // Si está buscando fusiones, reservar poco.
    if (enemyGold >= 50) return 0;
    if (enemyGold >= 30) return 5;
    return 10;
}

function enemyEvaluarSiMereceReroll() {
    if (!enemyEstrategia) return null;

    const prioridad = enemyEstrategia.prioridad || [];

    // 🆕 FIX: PRIORIDAD MÁXIMA — buscar la 2ª o 3ª copia de un Pokémon
    // que ya tenemos en el equipo (completar fusión).
    const nombresEncontrados = {};
    for (let u of [...enemyBoard, ...enemyBanquillo]) {
        if (!u || u.esZacian) continue;
        if (u.nivel !== 1) continue;
        const n = u.pokemon.nombre;
        nombresEncontrados[n] = (nombresEncontrados[n] || 0) + 1;
    }

    for (let nombre in nombresEncontrados) {
        if (nombresEncontrados[nombre] === 2) {
            const hayEnTienda = enemyTienda.some(p => p && p.nombre === nombre);
            if (hayEnTienda) {
                return `¡COMPRAR ${nombre} EN TIENDA! (completa fusión 2★)`;
            }
            return `buscar 3er ${nombre} (fusión 2★)`;
        }
        if (nombresEncontrados[nombre] === 1) {
            const hayEnTienda = enemyTienda.some(p => p && p.nombre === nombre);
            if (hayEnTienda) {
                return `¡COMPRAR ${nombre} EN TIENDA! (2ª copia)`;
            }
        }
    }

    // 🆕 FIX 1: si en la tienda NO hay NINGÚN Pokémon del tipo de la estrategia,
    // y tenemos menos de 4 del tipo en el equipo, reroll urgente.
    const hayTipoEnTienda = enemyTienda.some(p =>
        p && p.tipos && p.tipos.some(t => enemyEstrategia.tipos.includes(t))
    );
    let unidadesDelTipo = 0;
    for (let u of [...enemyBoard, ...enemyBanquillo]) {
        if (!u || u.esZacian || u.esArticuno) continue;
        if (u.pokemon.tipos && u.pokemon.tipos.some(t => enemyEstrategia.tipos.includes(t))) {
            unidadesDelTipo++;
        }
    }
    if (!hayTipoEnTienda && unidadesDelTipo < 4) {
        return `buscar ${enemyEstrategia.tipos.join('/')} (${unidadesDelTipo} en equipo, 0 en tienda)`;
    }

    for (let nombreClave of prioridad) {
        let copiasNivel1 = 0;
        let copiasNivel2 = 0;

        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            if (u.pokemon.nombre === nombreClave) {
                if (u.nivel === 1) copiasNivel1++;
                else if (u.nivel === 2) copiasNivel2++;
            }
        }
        for (let u of enemyBanquillo) {
            if (!u || u.esZacian) continue;
            if (u.pokemon.nombre === nombreClave) {
                if (u.nivel === 1) copiasNivel1++;
                else if (u.nivel === 2) copiasNivel2++;
            }
        }

        if (copiasNivel1 === 2) {
            return `buscar 3er ${nombreClave} (fusión 2★)`;
        }
        if (copiasNivel2 === 2) {
            return `buscar 3er ${nombreClave} 2★ (fusión 3★)`;
        }
    }

        // 🆕 FIX 2 v2: si tiene 2 copias 1★ de CUALQUIER Pokémon, reroll
    // para buscar la 3ª. Antes se exigía que además encajara con la
    // estrategia, así que las fusiones de Pokémon "off-strategy" nunca
    // se buscaban. Ahora SÍ: una fusión a 2★ es siempre buena.
    const familiasEnProceso = new Set();
    for (let u of [...enemyBoard, ...enemyBanquillo]) {
        if (!u || u.esZacian) continue;
        if (u.nivel !== 1) continue;
        const nombre = u.pokemon.nombre;
        if (familiasEnProceso.has(nombre)) continue;
        let copias1 = 0;
        for (let v of [...enemyBoard, ...enemyBanquillo]) {
            if (v && !v.esZacian && v.pokemon.nombre === nombre && v.nivel === 1) copias1++;
        }
        if (copias1 === 2) {
            return `buscar 3er ${nombre} (fusión 2★)`;
        }
        familiasEnProceso.add(nombre);
    }

    let hayAlgoUtil = false;
    for (let p of enemyTienda) {
        if (!p) continue;
        if (enemyGold < p.coste) continue;
        if (getCopiasDisponibles(p) <= 0) continue;
        if (!enemyPokemonEncaja(p) && !enemyPokemonEsUtil(p)) continue;
        if (_enemyPokemonBloqueadoPor3Estrellas(p)) continue;
        if (_enemyPokemonBloqueadoPor2Estrellas(p)) continue;
        hayAlgoUtil = true;
        break;
    }
    if (!hayAlgoUtil) {
        return 'tienda sin opciones útiles';
    }

    return null;
}

async function enemyIntentarRerolls() {
    if (window.modoDosJugadores) return 0;
    if (enemyCombatiendo) return 0;
            // 🆕 FIX: no hacer rerolls en ronda 1 ni en ronda 2 (economía justa)
    if (fase <= 2) return 0;

        const COSTE_REROLL = 2;

    // 🆕 FIX: rerolls dinámicos según oro y si está buscando fusión
    let MAX_REROLLS_POR_RONDA = 2;
    if (enemyGold >= 50) MAX_REROLLS_POR_RONDA = 8;
    else if (enemyGold >= 30) MAX_REROLLS_POR_RONDA = 5;
    else if (enemyGold >= 20) MAX_REROLLS_POR_RONDA = 3;

    // 🆕 Y si está buscando una fusión concreta, permitir muchos más
    let buscaFusion = false;
    const nombresContados = {};
    for (let u of [...enemyBoard, ...enemyBanquillo]) {
        if (!u || u.esZacian) continue;
        if (u.nivel !== 1) continue;
        const n = u.pokemon.nombre;
        nombresContados[n] = (nombresContados[n] || 0) + 1;
        if (nombresContados[n] >= 2) buscaFusion = true;
    }
    if (buscaFusion) MAX_REROLLS_POR_RONDA = Math.max(MAX_REROLLS_POR_RONDA, 6);

    let rerollsHechos = 0;

    const reservaMinima = enemyCalcularReservaMinimaReroll();

    while (rerollsHechos < MAX_REROLLS_POR_RONDA) {
        const oroDisponible = enemyGold - reservaMinima;
        if (oroDisponible < COSTE_REROLL) {
            break;
        }

        const motivo = enemyEvaluarSiMereceReroll();
        if (!motivo) {
            break;
        }

        enemyGold -= COSTE_REROLL;
        // ⭐ Sesgo: si tiene pares/tríos a medio hacer, forzar que la tienda los ofrezca
        try { window._enemyTiendaForzarNombre = (typeof _enemyElegirEspecieSesgo === 'function') ? _enemyElegirEspecieSesgo([...(enemyBoard || []), ...(enemyBanquillo || [])]) : null; } catch (e) { window._enemyTiendaForzarNombre = null; }
        generarTiendaEnemigo();
        rerollsHechos++;

        addConsoleMessage(
            `🎲 ${rivalNombre()} reroll (${motivo}) -${COSTE_REROLL}💰 [${enemyGold}💰]`,
            'enemy'
        );

        let compro = false;
        let intentos = 0;
        while (intentos < 3 && !compro) {
            compro = await enemyComprarExperto();
            intentos++;
            if (compro) {
                enemyMoverMejoresAlTablero();
                enemyVerificarTodasLasFusiones();
            }
        }

        if (!compro) {
            break;
        }
    }

    if (rerollsHechos > 0) {
        addConsoleMessage(
            `🎲 ${rivalNombre()} hizo ${rerollsHechos} reroll(s) esta ronda (oro restante: ${enemyGold}💰)`,
            'enemy'
        );
    }

    return rerollsHechos;
}

function enemyLimpiarDuplicadosBanquillo() {
    let nombresEnBanquillo = {};
    for (let i = 0; i < enemyBanquillo.length; i++) {
        if (enemyBanquillo[i]) {
            let nombre = enemyBanquillo[i].pokemon.nombre;
            if (!nombresEnBanquillo[nombre]) nombresEnBanquillo[nombre] = [];
            nombresEnBanquillo[nombre].push(i);
        }
    }

    let vendidos = 0;
    for (let nombre in nombresEnBanquillo) {
        let indices = nombresEnBanquillo[nombre];
        if (indices.length > 2) {
            let sobrantes = indices.slice(2);
            for (let idx of sobrantes) {
                let unidad = enemyBanquillo[idx];
                if (unidad) {
                    _devolverObjetosAlBaulEnemigo(unidad);

                    let valor = unidad.costeOriginal * unidad.nivel;
                    enemyGold = Math.max(0, (enemyGold || 0) + valor);
                    devolverAlPool(unidad.baseId, unidad.nivel === 3 ? 9 : (unidad.nivel === 2 ? 3 : 1));
                    enemyBanquillo[idx] = null;
                    vendidos++;
                }
            }
        }
    }
    return vendidos > 0;
}

function mostrarFlash3EstrellasEnemigo(nombresPokemon) {
    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(`⭐⭐⭐ ¡¡¡${rivalNombre()} TIENE ${nombresPokemon.length} POKÉMON 3★!!! (${nombresPokemon.join(', ')})`, 'battle');
    }
    if (typeof playSonidoEvolucion === 'function') playSonidoEvolucion();

    const overlay = document.getElementById('combatOverlay');
    if (overlay) {
        const estadoAnterior = {
            className: overlay.className,
            background: overlay.style.background,
            display: overlay.style.display
        };
        overlay.className = 'combat-overlay active';
        overlay.style.display = 'flex';
        overlay.style.background = 'radial-gradient(circle, rgba(255,215,0,0.6), rgba(255,0,0,0.3))';

        const tableroEnemigo = document.getElementById('enemigoBoard');
        if (tableroEnemigo) {
            tableroEnemigo.style.transition = 'transform 0.15s ease';
            tableroEnemigo.style.transform = 'translateX(-6px)';
            setTimeout(() => tableroEnemigo.style.transform = 'translateX(6px)', 100);
            setTimeout(() => tableroEnemigo.style.transform = 'translateX(-4px)', 200);
            setTimeout(() => tableroEnemigo.style.transform = 'translateX(4px)', 300);
            setTimeout(() => {
                tableroEnemigo.style.transform = 'translateX(0)';
                tableroEnemigo.style.transition = '';
            }, 400);
        }

        setTimeout(() => {
            overlay.className = estadoAnterior.className;
            overlay.style.background = estadoAnterior.background;
            overlay.style.display = estadoAnterior.display || 'none';
        }, 1500);
    }
}
