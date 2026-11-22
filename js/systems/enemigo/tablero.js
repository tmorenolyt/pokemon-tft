// ============================================================
// ENEMIGO · TABLERO
// Extraído de js/systems/enemigo.js (sin cambios de lógica).
// ============================================================

function intentarSustituirUnidadMalaDelTablero(maxUnits) {
    if (fase <= 2) return false;
    if (window._rivalYaSustituyoEstaRonda) return false;

    let peorTablero = null;
    let peorUtilidad = Infinity;

          for (let i = 0; i < enemyBoard.length; i++) {
        let u = enemyBoard[i];
        if (!u || u.esZacian) continue;
        if (u.nivel > 1) continue;
        // 🆕 FIX v23 #29: ELIMINADO el `continue` que excluía a los
        // que encajan con la estrategia. Ahora se evalúan todos.

        if (_esIntocableEnTablero(u)) continue;

        // 🆕 FIX v24: NO sustituir si es base de una fusión pendiente.
        // Antes Rojo sustituía Marill→Ceruledge→Marill→Ceruledge en bucle
        // y nunca completaba la fusión a 2★.
        if (typeof _esBaseDeFusionPendiente === 'function' && _esBaseDeFusionPendiente(u)) continue;

        // 🆕 FIX v24: NO sustituir si es base de una fusión pendiente
        // (ej: Charmander con otra copia en banco esperando la 3ª).
        // Antes Erika vendía su 2ª copia y se quedaba con 1 unidad.
        if (_esBaseDeFusionPendiente(u)) continue;

        let utilidad = evaluarPokemon(u.pokemon);

        let esInicialAleatoria = true;
        if (enemyEstrategia.prioridad && enemyEstrategia.prioridad.includes(u.pokemon.nombre)) {
            esInicialAleatoria = false;
        }
        if (enemyObjetivos.includes(u.pokemon.nombre)) {
            esInicialAleatoria = false;
        }
        if (esInicialAleatoria) utilidad -= 80;

        if (!enemyPokemonEncaja(u.pokemon)) {
            utilidad -= 100;
        }

        if (utilidad < peorUtilidad) {
            peorUtilidad = utilidad;
            peorTablero = { index: i, unidad: u };
        }
    }

    if (!peorTablero) {
        // 🆕 FIX #34: no hay nada que sustituir, marcar como intentado
        window._rivalYaSustituyoEstaRonda = true;
        return false;
    }

    let mejorBanco = null;
    let mejorPrioridad = -Infinity;

    for (let i = 0; i < enemyBanquillo.length; i++) {
        let u = enemyBanquillo[i];
        if (!u || u.esZacian) continue;
        if (!enemyPokemonEncaja(u.pokemon)) continue;

        let prioridad = evaluarPokemon(u.pokemon);
        if (prioridad > mejorPrioridad) {
            mejorPrioridad = prioridad;
            mejorBanco = { index: i, unidad: u };
        }
    }

    if (!mejorBanco) {
        // 🆕 FIX #34: no hay nada que meter, marcar como intentado
        window._rivalYaSustituyoEstaRonda = true;
        return false;
    }

        // 🆕 FIX 3: umbral 5 → 150. Antes cualquier Pokémon del banco sustituía
    // a uno del tablero aunque fuera peor, y la IA vendía su equipo cada ronda.
    // Con 150, solo se sustituye si el del banco es MUCHO mejor.
    const UMBRAL_SUSTITUCION = 150;

    if (mejorPrioridad <= peorUtilidad + UMBRAL_SUSTITUCION) {
        return false;
    }

        const famVendida = getFamiliaEvolutivaEnemigo(peorTablero.unidad.pokemon);
    const famSubida = getFamiliaEvolutivaEnemigo(mejorBanco.unidad.pokemon);
    if (famVendida && famSubida && famVendida === famSubida) {
        // 🆕 FIX #34: misma familia, no swapear, marcar como intentado
        window._rivalYaSustituyoEstaRonda = true;
        return false;
    }

    if (!window._rivalPensandoMostradoEstaRonda) {
        if (typeof mostrarReaccionPensando === 'function') {
            mostrarReaccionPensando(2500);
        }
        window._rivalPensandoMostradoEstaRonda = true;
    }

    const unidadVendida = peorTablero.unidad;
    const unidadSubida = mejorBanco.unidad;

    const esFrontVendida = esPokemonFrontlineEnemigo(unidadVendida.pokemon);
    const esFrontSubida = esPokemonFrontlineEnemigo(unidadSubida.pokemon);

    let aportaSinergiaNuevaVulpix = false;
    if (unidadSubida.pokemon.tipos) {
        for (let tipo of unidadSubida.pokemon.tipos) {
            if (!enemyEstrategia.tipos.includes(tipo)) continue;
            let familiasDelTipo = contarFamiliasDelTipo(tipo);
            let familiaNueva = getFamiliaEvolutivaEnemigo(unidadSubida.pokemon);
            if (!familiasDelTipo.has(familiaNueva)) {
                let familiaEnTablero = false;
                for (let u of enemyBoard) {
                    if (!u || u.esZacian) continue;
                    if (getFamiliaEvolutivaEnemigo(u.pokemon) === familiaNueva) {
                        familiaEnTablero = true;
                        break;
                    }
                }
                if (!familiaEnTablero) {
                    aportaSinergiaNuevaVulpix = true;
                    break;
                }
            }
        }
    }

    const diferenciaUtilidad = mejorPrioridad - peorUtilidad;
    const UMBRAL_DIFERENCIA_ROL = 150;

    if (esFrontVendida !== esFrontSubida && !aportaSinergiaNuevaVulpix && diferenciaUtilidad < UMBRAL_DIFERENCIA_ROL) {
        console.log(`🛡️ ${rivalNombre()}: no se sustituye ${unidadVendida.pokemon.nombre} (${esFrontVendida ? 'FRONT' : 'BACK'}) por ${unidadSubida.pokemon.nombre} (${esFrontSubida ? 'FRONT' : 'BACK'}) — roles distintos y diferencia insuficiente (${Math.round(diferenciaUtilidad)} < ${UMBRAL_DIFERENCIA_ROL})`);
        // 🆕 FIX #34: marcar como "ya intentado" para no reintentar en bucle
        window._rivalYaSustituyoEstaRonda = true;
        return false;
    }

    if (esFrontVendida !== esFrontSubida) {
        if (aportaSinergiaNuevaVulpix) {
            console.log(`✅ ${rivalNombre()}: ${unidadSubida.pokemon.nombre} (${esFrontSubida ? 'FRONT' : 'BACK'}) sustituye a ${unidadVendida.pokemon.nombre} (${esFrontVendida ? 'FRONT' : 'BACK'}) porque aporta sinergia nueva`);
        } else {
            console.log(`✅ ${rivalNombre()}: ${unidadSubida.pokemon.nombre} (${esFrontSubida ? 'FRONT' : 'BACK'}) sustituye a ${unidadVendida.pokemon.nombre} (${esFrontVendida ? 'FRONT' : 'BACK'}) porque es mucho mejor (${Math.round(diferenciaUtilidad)} >= ${UMBRAL_DIFERENCIA_ROL})`);
        }
    }

    _devolverObjetosAlBaulEnemigo(unidadVendida);

    let valor = unidadVendida.costeOriginal * (unidadVendida.nivel === 3 ? 9 : (unidadVendida.nivel === 2 ? 3 : 1));
    enemyGold = Math.max(0, (enemyGold || 0) + valor);
    devolverAlPool(unidadVendida.baseId, unidadVendida.nivel === 3 ? 9 : (unidadVendida.nivel === 2 ? 3 : 1));

    addConsoleMessage(`🤖 ${rivalNombre()} está pensando en vender a ${unidadVendida.pokemon.nombre}...`, 'enemy');
    addConsoleMessage(`🤖 ${rivalNombre()} vendió ${unidadVendida.pokemon.nombre} del TABLERO (no encaja con ${enemyEstrategia.nombre}, utilidad ${Math.round(peorUtilidad)}) para meter a ${unidadSubida.pokemon.nombre}`, 'enemy');

    enemyBoard[peorTablero.index] = unidadSubida;
    enemyBanquillo[mejorBanco.index] = null;

    if (typeof enemyPosicionarUnidadesInteligente === 'function') {
        enemyPosicionarUnidadesInteligente();
    }

    window._rivalYaSustituyoEstaRonda = true;
    if (typeof mostrarComicBubble === 'function' && typeof obtenerFraseComic === 'function') {
        setTimeout(() => {
            const panel = document.getElementById('enemyInfoPanel');
            if (panel) {
                const ancla = panel.querySelector('.player-info-header') || panel;
                const frase = obtenerFraseComic('win');
                const nomRival = (typeof _nombreRivalComic === 'function')
                    ? _nombreRivalComic()
                    : 'Rival';
                mostrarComicBubble(ancla, frase, 2500, 'win', nomRival);
            }
        }, 400);
    }

    return true;
}

function enemyMoverMejoresAlTablero() {
    // 🆕 FIX PvE: en ronda PvE, no hay nada que mover
    if (window.enRondaPvE === true) {
    return false;
}

    let maxUnits = (typeof TABLA_MAX_UNIDADES !== 'undefined')
        ? (TABLA_MAX_UNIDADES[enemyLevel] || 1)
        : Math.min(enemyLevel, 6);
    let unidadesEnTablero = enemyBoard.filter(u => u !== null && !u.esZacian).length;

    // ============================================================
    // 🆕 FIX #41a: mover sobrantes por prioridad (si los hay)
    // ============================================================
    if (unidadesEnTablero > maxUnits) {
        console.log(`⚠️ ${rivalNombre()} tiene ${unidadesEnTablero} unidades pero el máximo es ${maxUnits}. Moviendo las de menor prioridad al banquillo...`);

        let unidadesConPrioridad = [];
        for (let i = 0; i < enemyBoard.length; i++) {
            let u = enemyBoard[i];
            if (!u || u.esZacian) continue;
            let prioridad = evaluarPokemon(u.pokemon);
            if (!enemyPokemonEncaja(u.pokemon)) prioridad -= 200;

            if (_esIntocableEnTablero(u)) prioridad += 99999;

            unidadesConPrioridad.push({ index: i, unidad: u, prioridad: prioridad });
        }
        unidadesConPrioridad.sort((a, b) => a.prioridad - b.prioridad);

        let sobrantes = unidadesEnTablero - maxUnits;
        for (let item of unidadesConPrioridad) {
            if (sobrantes <= 0) break;

            if (_esIntocableEnTablero(item.unidad)) {
                continue;
            }

            let hueco = enemyBanquillo.findIndex(c => c === null);
            if (hueco !== -1) {
                _devolverObjetosAlBaulEnemigo(item.unidad, 'al mover al banco');
                enemyBanquillo[hueco] = item.unidad;
                enemyBoard[item.index] = null;
                sobrantes--;
                addConsoleMessage(`📦 ${rivalNombre()}: Movió ${item.unidad.pokemon.nombre} al banquillo (peor prioridad: ${Math.round(item.prioridad)})`, 'enemy');
            } else {
                _devolverObjetosAlBaulEnemigo(item.unidad);
                let valor = item.unidad.costeOriginal * item.unidad.nivel;
                enemyGold = Math.max(0, (enemyGold || 0) + valor);
                devolverAlPool(item.unidad.baseId, item.unidad.nivel === 3 ? 9 : (item.unidad.nivel === 2 ? 3 : 1));
                enemyBoard[item.index] = null;
                sobrantes--;
                addConsoleMessage(`💸 ${rivalNombre()}: Vendió ${item.unidad.pokemon.nombre} (tablero lleno, banquillo lleno)`, 'enemy');
            }
        }

        if (sobrantes > 0) {
            console.log(`⚠️ ${rivalNombre()}: todos los sobrantes son intocables, forzando movimiento/venta`);
            for (let item of unidadesConPrioridad) {
                if (sobrantes <= 0) break;
                let hueco = enemyBanquillo.findIndex(c => c === null);
                if (hueco !== -1) {
                    enemyBanquillo[hueco] = item.unidad;
                    enemyBoard[item.index] = null;
                    sobrantes--;
                    addConsoleMessage(`📦 ${rivalNombre()}: Movió ${item.unidad.pokemon.nombre} al banquillo (intocable, conserva objetos)`, 'enemy');
                } else {
                    _devolverObjetosAlBaulEnemigo(item.unidad);
                    let valor = item.unidad.costeOriginal * item.unidad.nivel;
                    enemyGold = Math.max(0, (enemyGold || 0) + valor);
                    devolverAlPool(item.unidad.baseId, item.unidad.nivel === 3 ? 9 : (item.unidad.nivel === 2 ? 3 : 1));
                    enemyBoard[item.index] = null;
                    sobrantes--;
                    addConsoleMessage(`💸 ${rivalNombre()}: Vendió ${item.unidad.pokemon.nombre} (sobrante, banquillo lleno)`, 'enemy');
                }
            }
        }

        unidadesEnTablero = enemyBoard.filter(u => u !== null && !u.esZacian).length;
    }

    // ============================================================
    // 🆕 FIX #41b: si el tablero está lleno, comparar con el banquillo
    // 🆕 FIX v23 #30: umbral +20 → +5
    // ============================================================
    if (unidadesEnTablero >= maxUnits) {
        let tableroConPrioridad = [];
        for (let i = 0; i < enemyBoard.length; i++) {
            let u = enemyBoard[i];
            if (!u || u.esZacian) continue;
            let prioridad = evaluarPokemon(u.pokemon);
            if (!enemyPokemonEncaja(u.pokemon)) prioridad -= 200;
            tableroConPrioridad.push({ index: i, unidad: u, prioridad: prioridad });
        }
        tableroConPrioridad.sort((a, b) => a.prioridad - b.prioridad);

        let bancoConPrioridad = [];
        for (let i = 0; i < enemyBanquillo.length; i++) {
            let u = enemyBanquillo[i];
            if (!u || u.esZacian) continue;
            let prioridad = evaluarPokemon(u.pokemon);
            if (enemyPokemonEncaja(u.pokemon)) prioridad += 200;
            bancoConPrioridad.push({ index: i, unidad: u, prioridad: prioridad });
        }
        bancoConPrioridad.sort((a, b) => b.prioridad - a.prioridad);

        if (bancoConPrioridad.length > 0 && tableroConPrioridad.length > 0) {
            let mejorBanco = bancoConPrioridad[0];
            let peorTablero = tableroConPrioridad[0];

                                    if (_esIntocableEnTablero(peorTablero.unidad)) {
                console.log(`🛡️ ${rivalNombre()}: ${peorTablero.unidad.pokemon.nombre} es intocable, no se sustituye`);
                // 🆕 FIX #34: marcar como intentado para no reintentar en bucle
                window._rivalYaSustituyoEstaRonda = true;
            } else if (typeof _esBaseDeFusionPendiente === 'function' && _esBaseDeFusionPendiente(peorTablero.unidad)) {
                // 🆕 FIX v24: no sustituir si está en fusión pendiente
                // (evita bucles Marill→Ceruledge→Marill→Ceruledge)
                window._rivalYaSustituyoEstaRonda = true;
                        // 🆕 FIX 3b: umbral +5 → +80. Antes cualquier Pokémon del banco
            // sustituía a uno del tablero aunque fuera peor.
            } else if (mejorBanco.prioridad > peorTablero.prioridad + 80) {
                const esFrontPeor = esPokemonFrontlineEnemigo(peorTablero.unidad.pokemon);
                const esFrontMejor = esPokemonFrontlineEnemigo(mejorBanco.unidad.pokemon);

                let aportaSinergiaNuevaMejor = false;
                if (mejorBanco.unidad.pokemon.tipos) {
                    for (let tipo of mejorBanco.unidad.pokemon.tipos) {
                        if (!enemyEstrategia.tipos.includes(tipo)) continue;
                        let familiasDelTipo = contarFamiliasDelTipo(tipo);
                        let familiaNueva = getFamiliaEvolutivaEnemigo(mejorBanco.unidad.pokemon);
                        if (!familiasDelTipo.has(familiaNueva)) {
                            let familiaEnTablero = false;
                            for (let u of enemyBoard) {
                                if (!u || u.esZacian) continue;
                                if (getFamiliaEvolutivaEnemigo(u.pokemon) === familiaNueva) {
                                    familiaEnTablero = true;
                                    break;
                                }
                            }
                            if (!familiaEnTablero) {
                                aportaSinergiaNuevaMejor = true;
                                break;
                            }
                        }
                    }
                }

                                if (esFrontPeor !== esFrontMejor && !aportaSinergiaNuevaMejor) {
                    console.log(`🛡️ ${rivalNombre()}: no se cambia ${mejorBanco.unidad.pokemon.nombre} (${esFrontMejor ? 'FRONT' : 'BACK'}) por ${peorTablero.unidad.pokemon.nombre} (${esFrontPeor ? 'FRONT' : 'BACK'}) — roles distintos`);
                    // 🆕 FIX #34: marcar como intentado para no reintentar en bucle
                    window._rivalYaSustituyoEstaRonda = true;
                } else {
                    if (esFrontPeor !== esFrontMejor && aportaSinergiaNuevaMejor) {
                        console.log(`✅ ${rivalNombre()}: ${mejorBanco.unidad.pokemon.nombre} (${esFrontMejor ? 'FRONT' : 'BACK'}) sustituye a ${peorTablero.unidad.pokemon.nombre} (${esFrontPeor ? 'FRONT' : 'BACK'}) porque aporta sinergia nueva`);
                    }
                    let temp = enemyBoard[peorTablero.index];
                    enemyBoard[peorTablero.index] = enemyBanquillo[mejorBanco.index];
                    enemyBanquillo[mejorBanco.index] = temp;
                    addConsoleMessage(`🔄 ${rivalNombre()}: ${mejorBanco.unidad.pokemon.nombre} (prioridad ${Math.round(mejorBanco.prioridad)}) sustituye a ${peorTablero.unidad.pokemon.nombre} (prioridad ${Math.round(peorTablero.prioridad)})`, 'enemy');
                    unidadesEnTablero = enemyBoard.filter(u => u !== null && !u.esZacian).length;

                    if (esFrontPeor !== esFrontMejor && typeof enemyPosicionarUnidadesInteligente === 'function') {
                        enemyPosicionarUnidadesInteligente();
                    }
                }
            }
        }
    }

    let infoEnTablero = {};
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i]) {
            let nombre = enemyBoard[i].pokemon.nombre;
            if (!infoEnTablero[nombre]) infoEnTablero[nombre] = { count: 0, mejorNivel: 0 };
            infoEnTablero[nombre].count++;
            if (enemyBoard[i].nivel > infoEnTablero[nombre].mejorNivel) {
                infoEnTablero[nombre].mejorNivel = enemyBoard[i].nivel;
            }
        }
    }

    let familiasTipoEnTablero = {};
    let familiasClaseEnTablero = {};

    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
        if (!fam) continue;

        if (u.pokemon.tipos) {
            for (let tipo of u.pokemon.tipos) {
                if (!familiasTipoEnTablero[tipo]) familiasTipoEnTablero[tipo] = new Set();
                familiasTipoEnTablero[tipo].add(fam);
            }
        }
        if (u.pokemon.clase) {
            if (!familiasClaseEnTablero[u.pokemon.clase]) familiasClaseEnTablero[u.pokemon.clase] = new Set();
            familiasClaseEnTablero[u.pokemon.clase].add(fam);
        }
    }

    let candidatos = [];
    for (let i = 0; i < enemyBanquillo.length; i++) {
        let u = enemyBanquillo[i];
        if (!u) continue;
        if (u.esZacian) continue;

        let nombre = u.pokemon.nombre;
        let familia = getFamiliaEvolutivaEnemigo(u.pokemon);
        let infoNombre = infoEnTablero[nombre] || { count: 0, mejorNivel: 0 };

        let familiaYaEnTablero = false;
        if (u.pokemon.tipos) {
            for (let tipo of u.pokemon.tipos) {
                if (familiasTipoEnTablero[tipo] && familiasTipoEnTablero[tipo].has(familia)) {
                    familiaYaEnTablero = true;
                    break;
                }
            }
        }
        if (!familiaYaEnTablero && u.pokemon.clase) {
            if (familiasClaseEnTablero[u.pokemon.clase] && familiasClaseEnTablero[u.pokemon.clase].has(familia)) {
                familiaYaEnTablero = true;
            }
        }

        if (familiaYaEnTablero && u.nivel === 1 && !enemyPokemonEncaja(u.pokemon)) {
            let copiasEnBanquillo = 0;
            for (let j = 0; j < enemyBanquillo.length; j++) {
                if (enemyBanquillo[j] && enemyBanquillo[j].pokemon.nombre === nombre) copiasEnBanquillo++;
            }
            if (copiasEnBanquillo < 3) {
                continue;
            }
        }

        let prioridad = evaluarPokemon(u.pokemon);
        if (enemyPokemonEncaja(u.pokemon)) prioridad += 200;

        let activaSinergia = false;

        if (!familiaYaEnTablero) {
            if (u.pokemon.tipos) {
                for (let tipo of u.pokemon.tipos) {
                    if (!enemyEstrategia.tipos.includes(tipo)) continue;
                    if (!familiasTipoEnTablero[tipo]) familiasTipoEnTablero[tipo] = new Set();
                    let countFuturo = familiasTipoEnTablero[tipo].size + 1;
                    let synergy = TYPE_SYNERGIES[tipo];
                    if (synergy) {
                        let niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);
                        for (let nivel of niveles) {
                            if (countFuturo === nivel) {
                                prioridad += nivel * 60;
                                if (nivel === 2) prioridad += 50;
                                if (nivel === 3) prioridad += 100;
                                if (nivel >= 4) prioridad += 150;
                                activaSinergia = true;
                                console.log(`   🎯 ${nombre} activaría ${tipo} nivel ${nivel} en tablero`);
                                break;
                            }
                        }
                    }
                }
            }

            if (u.pokemon.clase) {
                let clase = u.pokemon.clase;
                if (enemyEstrategia.clases.includes(clase)) {
                    if (!familiasClaseEnTablero[clase]) familiasClaseEnTablero[clase] = new Set();
                    let countFuturo = familiasClaseEnTablero[clase].size + 1;
                    let synergy = CLASS_SYNERGIES[clase];
                    if (synergy) {
                        let niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);
                        for (let nivel of niveles) {
                            if (countFuturo === nivel) {
                                prioridad += nivel * 35;
                                if (nivel === 2) prioridad += 30;
                                if (nivel === 3) prioridad += 60;
                                activaSinergia = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (infoNombre.count >= 1) {
            prioridad -= 50;
        }

        if (u.nivel >= 2) prioridad += 20;
        if (u.nivel === 3) prioridad += 50;

        candidatos.push({
            index: i,
            unidad: u,
            prioridad: prioridad,
            nombre: nombre,
            familia: familia,
            activaSinergia: activaSinergia,
            familiaYaEnTablero: familiaYaEnTablero
        });
    }

    candidatos.sort((a, b) => b.prioridad - a.prioridad);

    let movidos = 0;
    for (let candidato of candidatos) {
        if (enemyBoard.filter(u => u !== null).length >= maxUnits) break;

        let nombre = candidato.nombre;
        let infoNombre = infoEnTablero[nombre] || { count: 0, mejorNivel: 0 };
        let familia = candidato.familia;

        if (infoNombre.count >= 1 && candidato.unidad.nivel < 2) continue;
        if (infoNombre.count >= 2) continue;
        if (candidato.familiaYaEnTablero && candidato.unidad.nivel === 1) continue;

        let esFront = esPokemonFrontlineEnemigo(candidato.unidad.pokemon);

        const rolCand = esFront ? 'melee' : 'backline';
        const columnasValidas = esFront ? [4, 5, 6] : [7, 6, 5];

        let posLibre = -1;

        let yaColocadasCand = 0;
        for (let i = 0; i < enemyBoard.length; i++) {
            const u = enemyBoard[i];
            if (!u || u.esZacian) continue;
            const rolU = esPokemonFrontlineEnemigo(u.pokemon) ? 'melee' : 'backline';
            if (rolU === rolCand) yaColocadasCand++;
        }

        const idxPatron = obtenerIndiceColocacionInicial('enemy', rolCand, yaColocadasCand);
        if (idxPatron !== -1 && idxPatron !== null && enemyBoard[idxPatron] === null) {
            const colGlobalPatron = (idxPatron % COLUMNAS_ARENA) + 4;
            if (columnasValidas.includes(colGlobalPatron)) {
                posLibre = idxPatron;
            }
        }

        if (posLibre === -1) {
            for (let col of columnasValidas) {
                for (let fila = 0; fila < FILAS_ARENA; fila++) {
                    const idx = fila * COLUMNAS_ARENA + (col - 4);
                    if (enemyBoard[idx] === null) { posLibre = idx; break; }
                }
                if (posLibre !== -1) break;
            }
        }

        if (posLibre === -1) {
            console.log(`⚠️ ${rivalNombre()}: no hay hueco ${esFront ? 'frontline' : 'backline'} para ${candidato.unidad.pokemon.nombre}, se queda en banco`);
            continue;
        }

        enemyBoard[posLibre] = candidato.unidad;
        enemyBanquillo[candidato.index] = null;

        if (!infoEnTablero[nombre]) infoEnTablero[nombre] = { count: 0, mejorNivel: 0 };
        infoEnTablero[nombre].count++;
        if (candidato.unidad.nivel > infoEnTablero[nombre].mejorNivel) {
            infoEnTablero[nombre].mejorNivel = candidato.unidad.nivel;
        }

        if (candidato.unidad.pokemon.tipos) {
            for (let tipo of candidato.unidad.pokemon.tipos) {
                if (!familiasTipoEnTablero[tipo]) familiasTipoEnTablero[tipo] = new Set();
                familiasTipoEnTablero[tipo].add(familia);
            }
        }
        if (candidato.unidad.pokemon.clase) {
            let clase = candidato.unidad.pokemon.clase;
            if (!familiasClaseEnTablero[clase]) familiasClaseEnTablero[clase] = new Set();
            familiasClaseEnTablero[clase].add(familia);
        }

        movidos++;

        let emoji = candidato.activaSinergia ? '🔥' : '🤖';
        addConsoleMessage(`${emoji} ${rivalNombre()}: Movió ${candidato.unidad.pokemon.nombre} (${esFront ? 'FRONT' : 'BACK'}) al tablero${candidato.activaSinergia ? ' ¡SINERGIA!' : ''}`, 'enemy');
    }
    return movidos > 0;
}

function enemyPosicionarUnidadesInteligente() {
    if (window.modoDosJugadores) return;
    if (enemyCombatiendo) return;

    // 🆕 FIX PvE: en ronda PvE, los monstruos se quedan donde
    // spawnearMonstruoPvE() los puso. La IA no los reordena.
    if (window.enRondaPvE === true) {
    console.log("👾 Ronda PvE: enemyPosicionarUnidadesInteligente() ignorada");
    return;
}

    let maxUnits = (typeof TABLA_MAX_UNIDADES !== 'undefined')
        ? (TABLA_MAX_UNIDADES[enemyLevel] || 1)
        : Math.min(enemyLevel, 6);
    let unidades = enemyBoard.filter(u => u !== null);
    let unidadesEnBanquillo = enemyBanquillo.filter(u => u !== null);

    if (unidades.length < maxUnits && unidadesEnBanquillo.length > 0) {
        enemyMoverMejoresAlTablero();
        unidades = enemyBoard.filter(u => u !== null);
    }
    if (unidades.length === 0) return;

    let nombresEnTablero = {};
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i]) {
            let nombre = enemyBoard[i].pokemon.nombre;
            if (!nombresEnTablero[nombre]) nombresEnTablero[nombre] = [];
            nombresEnTablero[nombre].push(i);
        }
    }

    for (let nombre in nombresEnTablero) {
        let indices = nombresEnTablero[nombre];
        if (indices.length > 1) {
            let mejorIndice = indices[0];
            let mejorPuntuacion = -Infinity;

            for (let idx of indices) {
                const u = enemyBoard[idx];
                if (!u) continue;
                let puntuacion = 0;
                puntuacion += (u.nivel || 1) * 1000;
                puntuacion += (u.objetos ? u.objetos.length * 100 : 0);

                if (_esIntocableEnTablero(u)) {
                    puntuacion += 5000;
                }

                if (puntuacion > mejorPuntuacion) {
                    mejorPuntuacion = puntuacion;
                    mejorIndice = idx;
                }
            }

            for (let idx of indices) {
                if (idx !== mejorIndice) {
                    let unidad = enemyBoard[idx];
                    if (unidad) {
                        if (unidad.esZacian) continue;

                        let libre = enemyBanquillo.findIndex(cell => cell === null);
                        if (libre !== -1) {
                            if (!_esIntocableEnTablero(unidad)) {
                                _devolverObjetosAlBaulEnemigo(unidad, 'al mover al banco');
                            }

                            enemyBanquillo[libre] = unidad;
                            enemyBoard[idx] = null;
                        } else {
                            _devolverObjetosAlBaulEnemigo(unidad);
                            let valor = unidad.costeOriginal * unidad.nivel;
                            enemyGold = Math.max(0, (enemyGold || 0) + valor);
                            devolverAlPool(unidad.baseId, unidad.nivel === 3 ? 9 : (unidad.nivel === 2 ? 3 : 1));
                            enemyBoard[idx] = null;
                        }
                    }
                }
            }
        }
    }

        let melees = [];
    let ranged = [];

    for (let u of enemyBoard) {
        if (!u) continue;
        if (u.esZacian) {
            melees.push(u);
            continue;
        }
        if (esPokemonFrontlineEnemigo(u.pokemon)) {
            melees.push(u);
        } else {
            ranged.push(u);
        }
    }

    // ============================================================
    // 🆕 FIX RONDA 3+: evitar repetidos en el tablero.
    // A partir de ronda 3, si hay 2 copias del mismo Pokémon en
    // el tablero y hay una alternativa en el banquillo, mover
    // una copia al banco y subir la alternativa.
    // En ronda 2 NO se aplica (se permite 2vs2 con repetidos).
    // ============================================================
        if (typeof fase !== 'undefined' && fase >= 3) {
        const conteoEspecies = {};
        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            const nombre = u.pokemon.nombre;
            conteoEspecies[nombre] = (conteoEspecies[nombre] || 0) + 1;
        }

        // 🆕 FIX: no diversificar si el tablero NO está lleno.
        // La prioridad es LLENAR el tablero, no tener especies únicas.
        // Antes, si el tablero tenía 2/3 y el banco 1, esta función
        // bajaba el del tablero al banco para "diversificar" y dejaba
        // el tablero con 1/3. Por eso Misty se quedaba con 2/3.
        const maxSlotDiversidad = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[enemyLevel])
            ? TABLA_MAX_UNIDADES[enemyLevel]
            : 3;
        const vivosDiversidad = enemyBoard.filter(u => u && !u.esZacian).length;
        const tableroLlenoParaDiversificar = vivosDiversidad >= maxSlotDiversidad;

        if (!tableroLlenoParaDiversificar) {
            console.log(`🛡️ ${rivalNombre()}: tablero incompleto (${vivosDiversidad}/${maxSlotDiversidad}), se omite diversificación`);
        } else {
        for (let nombre in conteoEspecies) {
            if (conteoEspecies[nombre] < 2) continue;

            let copiasEnTablero = [];
            for (let i = 0; i < enemyBoard.length; i++) {
                if (enemyBoard[i] && !enemyBoard[i].esZacian && enemyBoard[i].pokemon.nombre === nombre) {
                    copiasEnTablero.push({ index: i, unidad: enemyBoard[i] });
                }
            }
            if (copiasEnTablero.length < 2) continue;

            copiasEnTablero.sort((a, b) => (a.unidad.nivel || 1) - (b.unidad.nivel || 1));
            const copiaAMover = copiasEnTablero[0];

            let alternativaEncontrada = null;
            for (let i = 0; i < enemyBanquillo.length; i++) {
                const u = enemyBanquillo[i];
                if (!u || u.esZacian) continue;
                if (conteoEspecies[u.pokemon.nombre] && conteoEspecies[u.pokemon.nombre] > 0) continue;
                if (!enemyPokemonEncaja(u.pokemon)) continue;

                alternativaEncontrada = { index: i, unidad: u };
                break;
            }

            if (!alternativaEncontrada) continue;

            const bancoIdxLibre = enemyBanquillo.findIndex(c => c === null);
            if (bancoIdxLibre === -1) continue;

            const unidadCopia = copiaAMover.unidad;
            const unidadAlternativa = alternativaEncontrada.unidad;
            const indexAlternativa = alternativaEncontrada.index;

            enemyBoard[copiaAMover.index] = null;
            enemyBanquillo[indexAlternativa] = null;

            enemyBoard[copiaAMover.index] = unidadAlternativa;
            enemyBanquillo[indexAlternativa] = unidadCopia;

                        conteoEspecies[nombre] = (conteoEspecies[nombre] || 1) - 1;
            conteoEspecies[unidadAlternativa.pokemon.nombre] = (conteoEspecies[unidadAlternativa.pokemon.nombre] || 0) + 1;

            console.log(`🔀 ${rivalNombre()}: diversidad ronda ${fase} → ${unidadAlternativa.pokemon.nombre} al tablero, ${unidadCopia.pokemon.nombre} al banco`);
        }
        }  // 🆕 cierre del `else` (tableroLlenoParaDiversificar)
    }

    function calcularFuerza(u) {
        if (!u) return 0;
        let nivel = u.nivel || 1;
        let coste = u.costeOriginal || (u.pokemon && u.pokemon.coste) || 1;
        let hp = u.maxHp || 0;
        let atk = (u.ataque || 0) + (u.ataqueEspecial || 0);
        return nivel * 1000 + coste * 100 + hp + atk;
    }

    melees.sort((a, b) => calcularFuerza(b) - calcularFuerza(a));
    ranged.sort((a, b) => calcularFuerza(b) - calcularFuerza(a));

    let nuevoBoard = Array(TOTAL_CASILLAS_LADO).fill(null);

    const patronMeleeEnemigo = _PATRONES_COLOCACION.enemy.melee;
    for (let i = 0; i < melees.length; i++) {
        const coord = patronMeleeEnemigo[i];
        if (!coord) break;
        const r = getIndiceDesdeCoordenada(coord);
        if (r && r.indice >= 0 && nuevoBoard[r.indice] === null) {
            nuevoBoard[r.indice] = melees[i];
        }
    }

    for (let u of melees) {
        if (nuevoBoard.includes(u)) continue;

        const colsFrontales = [4, 5, 6];
        let libre = -1;
        for (let col of colsFrontales) {
            for (let fila = 0; fila < FILAS_ARENA; fila++) {
                const idx = fila * COLUMNAS_ARENA + (col - 4);
                if (nuevoBoard[idx] === null) { libre = idx; break; }
            }
            if (libre !== -1) break;
        }

        if (libre === -1) {
            console.log(`⚠️ ${rivalNombre()}: no hay hueco frontal para ${u.pokemon.nombre}, se queda en banco`);
            continue;
        }
        nuevoBoard[libre] = u;
    }

    const patronBackEnemigo = _PATRONES_COLOCACION.enemy.backline;
    for (let i = 0; i < ranged.length; i++) {
        const coord = patronBackEnemigo[i];
        if (!coord) break;
        const r = getIndiceDesdeCoordenada(coord);
        if (r && r.indice >= 0 && nuevoBoard[r.indice] === null) {
            nuevoBoard[r.indice] = ranged[i];
        }
    }

    for (let u of ranged) {
        if (nuevoBoard.includes(u)) continue;

        const colsTraseras = [7, 6, 5];
        let libre = -1;
        for (let col of colsTraseras) {
            for (let fila = 0; fila < FILAS_ARENA; fila++) {
                const idx = fila * COLUMNAS_ARENA + (col - 4);
                if (nuevoBoard[idx] === null) { libre = idx; break; }
            }
            if (libre !== -1) break;
        }

        if (libre === -1) {
            console.log(`⚠️ ${rivalNombre()}: no hay hueco backline para ${u.pokemon.nombre}, se queda en banco`);
            continue;
        }
        nuevoBoard[libre] = u;
    }

    let cambios = 0;
    for (let i = 0; i < TOTAL_CASILLAS_LADO; i++) {
        if (enemyBoard[i] !== nuevoBoard[i]) {
            enemyBoard[i] = nuevoBoard[i];
            cambios++;
        }
    }

    for (let i = 0; i < enemyBoard.length; i++) {
        let u = enemyBoard[i];
        if (!u) continue;
        if (typeof coordsDesdeIndice === 'function') {
            const coords = coordsDesdeIndice(i, 'enemy');
            u._filaGlobal = coords._filaGlobal;
            u._colGlobal  = coords._colGlobal;
            u._indiceTablero = 'enemy';
            u._indiceActual  = i;
        }
    }

    if (cambios > 0) {
        console.log(`🎯 ${rivalNombre()}: reposicionado (${melees.length} melees, ${ranged.length} ranged)`);
        renderizar();
    }
}
