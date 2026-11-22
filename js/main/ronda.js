// ============================================================
// MAIN · RONDA
// Extraído de js/main.js (sin cambios de lógica).
// ============================================================

// ============================================================
// 🆕 CONTADOR DE RONDA - OCULTAR / MOSTRAR
// ============================================================
function ocultarContadorRonda() {
    // 🆕 FIX: el contador de ronda debe estar SIEMPRE visible.
    // En vez de ocultarlo, solo hacemos un pequeño "pop" cuando cambia la ronda.
    if (window.modoDosJugadores) return;
    const badge = document.querySelector('.round-badge-tienda');
    if (!badge) return;
    badge.style.display = 'inline-flex';
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function mostrarContadorRonda() {
    if (window.modoDosJugadores) return;
    const badge = document.querySelector('.round-badge-tienda');
    if (!badge) return;
    badge.style.display = 'inline-flex';
    badge.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    void badge.offsetWidth;
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ejecutarFinDeRonda(victoria, esPvE) {
    if (window._finRondaEnCurso) {
        console.warn('⚠️ ejecutarFinDeRonda ya en curso, ignorando llamada');
        return;
    }
    window._finRondaEnCurso = true;

    // 🆕 FIX TORNEO: capturar la ronda que acaba de terminar ANTES de
    // asignar el rival de la siguiente. Si no, la simulación excluye al
    // rival nuevo y hace pelear dos veces al que acaba de combatir.
    // `_ultimoRivalCombatido` lo fija combate.js antes de subir `fase`,
    // así que sigue siendo válido aunque la próxima ronda sea PvE.
    const rivalRondaTerminada = window._ultimoRivalCombatido
        ? { nombre: window._ultimoRivalCombatido }
        : (window.rivalActual ? { nombre: window.rivalActual.nombre } : null);
    const parejasRondaTerminada = (window._parejasRanking || []).map(p => p.slice());

    // 🆕 FIX: si el jugador ha muerto, no seguir con la ronda.
    if (typeof vidaJugador === 'number' && vidaJugador <= 0) {
        console.log('💀 Jugador muerto, terminando partida...');
        if (typeof gameOver === 'function') gameOver();
        window._finRondaEnCurso = false;
        return;
    }

    // 🆕 FIX: usar la SIGUIENTE ronda (nuevaRondaEsPvE), no el combate
    // que acaba de terminar (esPvE). Si la ronda 1 fue PvE pero la 2
    // es PvP, hay que asignar rival igualmente.
    // 👥 En 2P no hay PvE ni torneo: se gestiona aparte.
    const es2PFinRonda = (window.modoDosJugadores === true);
    const nuevaRondaEsPvE = (!es2PFinRonda && typeof esRondaPvE === 'function' && esRondaPvE(fase));

    // 🆕 FIX CRÍTICO: declarar rondaRecienTerminadaEsPvE ANTES de usarla.
    const rondaRecienTerminadaEsPvE = (!es2PFinRonda && esPvE === true);


    try {
        // 🆕 FIX: solapar overlay y bocadillo.
        await esperar(Math.max(TIEMPOS_FIN_RONDA.RESULTADO_MS, TIEMPOS_FIN_RONDA.BOCADILLO_MS));

        if (es2PFinRonda) {
            // 👥 2P: no se toca el torneo, no se spawnea PvE y no se
            // simulan rivales. Solo se abre la tienda del jugador activo.
            if (typeof mostrarTiendaPostRonda === 'function') mostrarTiendaPostRonda();
            if (typeof renderizar === 'function') renderizar();
            if (typeof reanudarFondoPreparacion === 'function') reanudarFondoPreparacion();
            if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();
            return;
        }

        if (!nuevaRondaEsPvE) {
            // 1) Devolver objetos de las unidades del rival anterior al baúl
            if (typeof autoDevolverObjetosAlBaul === 'function') {
                for (let i = 0; i < enemyBoard.length; i++) {
                    if (enemyBoard[i] && enemyBoard[i].objetos && enemyBoard[i].objetos.length > 0) {
                        try { autoDevolverObjetosAlBaul(enemyBoard[i], 'enemigo'); } catch (e) {}
                    }
                }
                for (let i = 0; i < enemyBanquillo.length; i++) {
                    if (enemyBanquillo[i] && enemyBanquillo[i].objetos && enemyBanquillo[i].objetos.length > 0) {
                        try { autoDevolverObjetosAlBaul(enemyBanquillo[i], 'enemigo'); } catch (e) {}
                    }
                }
            }

            // 2) Limpiar tablero, banquillo, baúl y tienda del rival anterior
            for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
            for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;
            if (typeof enemyBaulObjetos !== 'undefined') enemyBaulObjetos = [];
            if (typeof enemyObjetosEnTienda !== 'undefined') enemyObjetosEnTienda = [];
            if (typeof enemyObjetoCompradoEstaRonda !== 'undefined') enemyObjetoCompradoEstaRonda = false;

            // 3) Entrar al NUEVO rival (asignarRivalAleatorioInmediato ya
            //    restaura el equipo completo con restaurarEquipoRival,
            //    mete los objetos iniciales en enemyBaulObjetos y genera
            //    la tienda si la ronda es de objetos).
            if (typeof asignarRivalAleatorioInmediato === 'function') {
                asignarRivalAleatorioInmediato();
            }
            // 🆕 FIX: si el torneo ya terminó (sin rivales vivos), finalizar
            // en vez de seguir la ronda con un rival genérico / null.
            if (window.torneoRivales && window.torneoRivales.length > 0
                && typeof comprobarFinTorneo === 'function'
                && comprobarFinTorneo()) {
                return;
            }
            if (typeof cambiarTerrenoPorRival === 'function' && window.rivalActual) {
                cambiarTerrenoPorRival(window.rivalActual);
            }
            if (typeof reanudarMusicaPreparacion === 'function') {
                reanudarMusicaPreparacion();
            } else if (typeof reanudarFondoPreparacion === 'function') {
                reanudarFondoPreparacion();
            }

            await esperar(TIEMPOS_FIN_RONDA.CAMBIO_RIVAL_MS);

            // 4) 🆕 El equipo ya lo restauró asignarRivalAleatorioInmediato()
            //    (llamado en el paso 3). Aquí solo renderizamos para que
            //    se vea actualizado antes de la IA.
            if (typeof renderizar === 'function') renderizar();
            await esperar(TIEMPOS_FIN_RONDA.RESET_TABLERO_MS);
        }

        // 🆕 FIX: upgradeEnemyTeam hace que el rival compre Pokémon,
        //    suba de nivel, fusione y equipe objetos del baúl.
        if (!nuevaRondaEsPvE && typeof upgradeEnemyTeam === 'function') {
            await upgradeEnemyTeam();
            await esperar(TIEMPOS_FIN_RONDA.IA_MS);
        }

        // 🆕 FIX: compra de objeto GARANTIZADA en rondas de tienda de objetos.
        if (!nuevaRondaEsPvE && typeof enemyComprarObjetoGarantizado === 'function') {
            enemyComprarObjetoGarantizado();
        }

        // 🆕 FIX ECONOMÍA: En rondas PvE los rivales NO combaten entre sí
        // y NO ganan oro (igual que el jugador en la ronda 1).
                if (rondaRecienTerminadaEsPvE) {
            // 🆕 FIX v5: en ronda PvE los rivales TAMBIÉN ganan su recompensa.
            // No descansan: todos se llevan oro + objeto, igual que el jugador.

            // 1) Simular "victoria contra el monstruo" para todos los rivales vivos.
            //    NADIE pierde HP. Todos ganan oro, racha y posible subida de nivel.
            if (typeof simularCombatesPvE === 'function') {
                // 🆕 FIX: usar el rival de la ronda terminada (el monstruo),
                // no el que se acaba de asignar para la ronda siguiente.
                // En PvE el monstruo no está en torneoRivales, así que no
                // se excluye a nadie y todos los rivales cobran su premio.
                simularCombatesPvE(fase - 1, rivalRondaTerminada);
            }

            // 2) Objeto aleatorio de recompensa (igual que antes).
            // 3) Asegurar equipo inicial si no lo tiene.
            if (window.torneoRivales && window.torneoRivales.length > 0) {
                for (let rival of window.torneoRivales) {
                    if (rival.eliminado) continue;

                                        // 🆕 FIX: en la ronda PvE 1 (arranque) NO se da objeto a nadie.
                    // Solo se da a partir de la ronda 6 (la primera PvE "real").
                    // Así los rivales no acumulan objetos gratis en la ronda 1.
                    const rondaPvEActual = fase - 1;  // la que acaba de terminar
                    const esPvEArranque = (rondaPvEActual <= 1);

                    if (!esPvEArranque && typeof OBJETOS !== 'undefined' && typeof generarObjetosTienda === 'function') {
                        const objetosPosibles = generarObjetosTienda();
                        if (objetosPosibles.length > 0) {
                            // 🆕 FIX: no dar chips de tipos ajenos a la estrategia del rival.
                            const tiposRival = (rival.estrategia && rival.estrategia.tipos) || [];
                            const objetosFiltrados = objetosPosibles.filter(nombre => {
                                const obj = OBJETOS[nombre];
                                if (!obj) return false;
                                if (obj.efecto && obj.efecto.tipoBonus) {
                                    return tiposRival.includes(obj.efecto.tipoBonus);
                                }
                                return true; // objetos normales: siempre válidos
                            });
                            if (objetosFiltrados.length > 0) {
                                const objetoElegido = objetosFiltrados[Math.floor(Math.random() * objetosFiltrados.length)];
                                if (!rival.objetosAcumulados) rival.objetosAcumulados = [];
                                rival.objetosAcumulados.push(objetoElegido);
                            }
                        }
                    } else if (esPvEArranque) {
                    }

                    const tieneEquipoPrev = rival._equipoGuardado && rival._equipoGuardado.tablero && rival._equipoGuardado.tablero.some(Boolean);
                    if (!tieneEquipoPrev && typeof generarEquipoPlaceholderRival === 'function') {
                        if (!rival.nivel || rival.nivel < 2) {
                            rival.nivel = 2;
                        }
                        if (typeof rival.oro !== 'number') rival.oro = 10;

                        const equipoGen = generarEquipoPlaceholderRival(rival);
                        rival._equipoGuardado = {
                            tablero: equipoGen.tablero,
                            banquillo: equipoGen.banquillo
                        };

                        if (typeof equipoGen.oroGastado === 'number' && equipoGen.oroGastado > 0) {
                            rival.oro = Math.max(0, rival.oro - equipoGen.oroGastado);
                        }
                    }
                }
            }
        } else if (typeof simularCombatesRivales === 'function') {
            // 🆕 FIX: la ronda que acaba de terminar es PvP, así que se
            // simula SIEMPRE, aunque la siguiente ronda sea PvE. Antes se
            // saltaba cuando `nuevaRondaEsPvE` era true y los rivales
            // perdían una ronda entera de combate.
            simularCombatesRivales(rivalRondaTerminada, parejasRondaTerminada);
        }

                // 🆕 FIX: NO limpiar los estados del ranking aquí.
        // Los ✔ / ✖ / -X se mantienen visibles durante varios segundos
        // después de la ronda para que el jugador los vea, incluido el
        // suyo propio. Se limpian en el timeout de 5s de abajo.
        //
        // 🆕 Mantener las parejas visibles durante toda la ronda.
        // Se desactivarán al inicio de la SIGUIENTE ronda (cuando
        // asignarRivalAleatorioInmediato() recalcule las parejas).
        // Así el ranking muestra "Tú vs Valerie / Erika vs Rojo / ..."
        // hasta que empiece la ronda 3.
        if (typeof actualizarRankingTorneo === 'function') actualizarRankingTorneo();
        await esperar(TIEMPOS_FIN_RONDA.TORNEO_MS);

        // 🆕 Después de unos segundos, ocultar los ✔ / ✖ / -X de los rivales
        // y también los del jugador (solo los visuales; los datos de vida
        // y el daño ya están aplicados en el HP de cada uno).
        setTimeout(() => {
            window._ultimaVictoriaJugador = undefined;
            window._ultimoDanoRecibidoJugador = 0;
            if (window.torneoRivales) {
                window.torneoRivales.forEach(r => {
                    r._estadoRonda = null;
                    r._danoRonda = null;
                });
            }
            if (typeof actualizarRankingTorneo === 'function') actualizarRankingTorneo();
        }, 5000); // 5 segundos visibles

        if (typeof comprobarFinTorneo === 'function') {
            if (comprobarFinTorneo()) {
                return;
            }
        }

        if (typeof mostrarContadorRonda === 'function') mostrarContadorRonda();
        await esperar(TIEMPOS_FIN_RONDA.TIENDA_DELAY_MS);

        // 🆕 FIX: llamar SIEMPRE a mostrarTiendaPostRonda, aunque la tienda
        // esté abierta.
                        if (typeof mostrarTiendaPostRonda === 'function') {
            // 🆕 FIX: Si acabamos de terminar PvE, esperamos un poco y abrimos la tienda.
            // El monstruo ya ha sido limpiado en combatir().
            if (rondaRecienTerminadaEsPvE) {
                setTimeout(() => {
                    if (typeof mostrarTiendaPostRonda === 'function') {
                        mostrarTiendaPostRonda(true);
                    }
                }, 0); // 🆕 1 segundo antes → 0ms (instantáneo en PvE)
            } else {
                mostrarTiendaPostRonda(true);
            }
        }

        if (typeof renderizar === 'function') renderizar();

        if (typeof reanudarFondoPreparacion === 'function') {
            reanudarFondoPreparacion();
        }

        if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

        // ============================================================
        // 🆕 SNAPSHOT de TODOS los rivales vivos al final de la ronda
        // ============================================================
        if (window.torneoRivales) {

            // 1) Snapshot del rival ACTIVO (SIEMPRE, PvE o PvP)
            if (window.rivalActual) {
                const rivalActivo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
                if (rivalActivo) {
                    rivalActivo.vida = Math.max(0, enemyHealth);
                    rivalActivo.oro = enemyGold;
                    rivalActivo.nivel = enemyLevel;
                    rivalActivo.racha = (enemyWinStreak || 0) - (enemyLossStreak || 0);
                    rivalActivo.eliminado = rivalActivo.vida <= 0;
                    rivalActivo._equipoGuardado = {
                        tablero: enemyBoard.map(u => u ? u.clonarParaCombate() : null),
                        banquillo: enemyBanquillo.map(u => u ? u.clonarParaCombate() : null)
                    };

                                        // 🆕 FIX v2: NO volcar enemyBaulObjetos a rival.objetosAcumulados.
                    //    El baúl enemigo se resetea al entrar al siguiente rival
                    //    (asignarRivalAleatorioInmediato → enemyBaulObjetos = []),
                    //    así que volcarlo aquí hacía que los objetos se DUPLICARAN
                    //    entre rondas (1 en el baúl + 1 en objetosAcumulados = 2).
                    //    Ahora los objetos equipados se guardan en _equipoGuardado
                    //    (con los objetos dentro de cada unidad), y los NO equipados
                    //    se pierden al cambiar de rival (que es lo correcto: el rival
                    //    se lleva su equipo, no deja objetos sueltos).

                                        const totalU = (enemyBoard.filter(Boolean).length + enemyBanquillo.filter(Boolean).length);
                    const estrellas = {};
                    for (let u of [...enemyBoard, ...enemyBanquillo]) {
                        if (!u || u.esZacian || u.esArticuno) continue;
                        estrellas[u.nivel || 1] = (estrellas[u.nivel || 1] || 0) + 1;
                    }
                    const resumenEstrellas = Object.keys(estrellas).sort().map(k => `${estrellas[k]}×${k}★`).join(' ');
                }
            }

                       // 2) 🆕 FIX TORNEO: TODOS los rivales vivos avanzan un turno
            //    (nivel, equipo completo, fusiones, objetos).
            //    El rival activo ya lo procesó upgradeEnemyTeam durante el combate.
            if (!rondaRecienTerminadaEsPvE && typeof avanzarRivalUnTurno === 'function') {
                for (const r of window.torneoRivales) {
                    if (r.eliminado) continue;
                    if (window.rivalActual && r.nombre === window.rivalActual.nombre) continue;
                    avanzarRivalUnTurno(r);
                }
            }

                                    // 3) 🆕 FORZAR FUSIONES DE TODOS LOS RIVALES VIVOS
            //    🆕 FIX: ya NO se toca el tablero/banquillo global del
            //    jugador. forzarFusionesRival(rival) trabaja sobre una
            //    copia local de rival._equipoGuardado.
            if (!rondaRecienTerminadaEsPvE) {
                if (window.torneoRivales && typeof forzarFusionesRival === 'function') {
                    for (const r of window.torneoRivales) {
                        if (r.eliminado) continue;
                        try { forzarFusionesRival(r); } catch (e) { console.error('Error forzando fusión de', r.nombre, e); }
                    }
                }
            }
        }

    } finally {
        // 🆕 FIX: el contador de ronda SIEMPRE debe quedar visible al terminar la ronda
        if (typeof mostrarContadorRonda === 'function') {
            mostrarContadorRonda();
        }
        window._finRondaEnCurso = false;
    }
}

function checkSubirNivel() {
    let coste = getExpNecesaria();
    while (experiencia >= coste && coste > 0 && Number(nivelJugador) < CONFIG.NIVEL_MAXIMO) {
        experiencia -= coste;
        nivelJugador = Number(nivelJugador) + 1;
        coste = getExpNecesaria();
        playSonidoSubirNivel();
        addConsoleMessage(`⬆️ ¡NIVEL ${nivelJugador}! 🎉`, 'level');
        if (Number(nivelJugador) === 5 || Number(nivelJugador) === 8) {
            if (typeof darDiscoDefinitivo === 'function') darDiscoDefinitivo();
        }
    }
    actualizarInfoJugador();

    // 🆕 FIX: actualizar el ranking del torneo cuando sube de nivel el jugador
    if (typeof actualizarRankingTorneo === 'function') {
        actualizarRankingTorneo();
    }
}

function adelantarNivel() {
    if (!puedeInteractuar()) return;
    if (fase <= 1) { addConsoleMessage(`🔒 +4 EXP no disponible en ronda 1`, 'info'); return; }
    if (fase === 2) { addConsoleMessage(`🔒 +4 EXP disponible desde ronda 3`, 'info'); return; }

    if (Number(nivelJugador) < CONFIG.NIVEL_MAXIMO && oro >= 4) {
        oro -= 4;
        experiencia += 4;
        checkSubirNivel();
        actualizarInfoJugador();
        if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') renderizarTiendaIndependiente(false);
        else renderizar();
        playButtonSound();
        addConsoleMessage(`⬆️ +4 EXP (${experiencia}/${getExpNecesaria()})`, 'level');
    } else if (Number(nivelJugador) >= CONFIG.NIVEL_MAXIMO) {
        addConsoleMessage(`⭐ ¡Ya estás en nivel máximo!`, 'info');
    } else {
        addConsoleMessage(`💰 Oro insuficiente! Necesitas 4💰`, 'error');
    }
}

// ============================================================
// 🆕 FIX: pintar el nº de ronda cuando arranca la música de previa
// ============================================================
function actualizarContadorRondaVisual() {
    const faseStatsNumEl = document.getElementById("faseStatsNum");
    const faseStatsEl = document.getElementById("faseStats");

    if (faseStatsNumEl) {
        if (faseStatsNumEl.textContent !== String(fase)) {
            faseStatsNumEl.textContent = fase;
            faseStatsNumEl.classList.remove('ronda-pop');
            void faseStatsNumEl.offsetWidth;
            faseStatsNumEl.classList.add('ronda-pop');
            setTimeout(() => faseStatsNumEl.classList.remove('ronda-pop'), 650);
        }
    } else if (faseStatsEl) {
        faseStatsEl.innerHTML = `Ronda <span id="faseStatsNum">${fase}</span>`;
    }
    if (faseStatsEl) {
        faseStatsEl.style.display = 'inline-flex';
        faseStatsEl.style.opacity = '1';
        faseStatsEl.style.transform = 'scale(1)';
    }
}
