// ============================================================
// MAIN · RIVALES
// Extraído de js/main.js (sin cambios de lógica).
// ============================================================

function asignarRivalAleatorio() {
    if (window._rivalAsignadoUnaVez === true) {
        return;
    }
    window._rivalAsignadoUnaVez = true;
    asignarRivalAleatorioInmediato();
}

function asignarRivalAleatorioInmediato() {
    if (window._modoOnline) return; // online 1v1: sin rival IA
    const rivalAnterior = window.rivalActual ? { ...window.rivalActual } : null;

    // 🆕 Desactivar parejas de la ronda anterior ANTES de recalcular.
    // Se volverán a preparar al final de esta función con el nuevo rival.
    if (typeof desactivarParejasRanking === 'function') {
        desactivarParejasRanking();
    }

    if (window.torneoRivales && window.torneoRivales.length > 0 && !window._rivalForzado) {
        const vivos = window.torneoRivales.filter(r => !r.eliminado);

        // 🆕 FIX: llevar un registro de rivales ya combatidos para
        // no repetir hasta haber luchado contra todos los vivos.
        if (!window._rivalesYaCombatidos) window._rivalesYaCombatidos = [];

        // Filtrar los que ya hemos combatido (y siguen vivos)
        const noCombatidos = vivos.filter(r => !window._rivalesYaCombatidos.includes(r.nombre));

        let candidatos;
        if (noCombatidos.length > 0) {
            candidatos = noCombatidos;
        } else {
            window._rivalesYaCombatidos = [];
            candidatos = vivos;
        }

        // Evitar repetir el último rival combatido (por si acaso)
        if (candidatos.length > 1 && window._ultimoRivalCombatido) {
            const sinRepetir = candidatos.filter(r => r.nombre !== window._ultimoRivalCombatido);
            if (sinRepetir.length > 0) {
                candidatos = sinRepetir;
            }
        }

        if (candidatos.length > 0) {
            const elegidoTorneo = candidatos[Math.floor(Math.random() * candidatos.length)];

            // 🆕 FIX: marcar al elegido como combatido
            if (!window._rivalesYaCombatidos.includes(elegidoTorneo.nombre)) {
                window._rivalesYaCombatidos.push(elegidoTorneo.nombre);
            }

            rivalActual = {
                nombre: elegidoTorneo.nombre,
                avatar: elegidoTorneo.avatar,
                estrategia: elegidoTorneo.estrategia,
                frases: elegidoTorneo.frases
            };
            window.rivalActual = rivalActual;

            // 🆕 FIX TORNEO: enemyLevel lo controla restaurarEquipoRival() a partir
            // del nivel guardado del rival (no lo reseteamos aquí a mano).

            if (typeof enemyGold !== 'undefined') {
                enemyGold = (typeof elegidoTorneo.oro === 'number') ? elegidoTorneo.oro : 10;
            }

            if (typeof enemyHealth !== 'undefined') {
                enemyHealth = (typeof elegidoTorneo.vida === 'number') ? elegidoTorneo.vida : 50;
            }

            // 🆕 FIX: cargar la racha del rival desde el torneo
            if (typeof enemyWinStreak !== 'undefined' && typeof enemyLossStreak !== 'undefined') {
                const rachaTorneo = (typeof elegidoTorneo.racha === 'number') ? elegidoTorneo.racha : 0;
                if (rachaTorneo > 0) {
                    enemyWinStreak = rachaTorneo;
                    enemyLossStreak = 0;
                } else if (rachaTorneo < 0) {
                    enemyWinStreak = 0;
                    enemyLossStreak = Math.abs(rachaTorneo);
                } else {
                    enemyWinStreak = 0;
                    enemyLossStreak = 0;
                }
            }

            const enemyNameEl = document.getElementById("enemyName");
            const enemyAvatarEl = document.getElementById("enemyAvatar");
            if (enemyNameEl) enemyNameEl.textContent = rivalActual.nombre;
            if (enemyAvatarEl) {
                enemyAvatarEl.innerHTML = '';
                const img = document.createElement('img');
                img.src = `assets/avatars/rivales/${rivalActual.avatar}.webp`;
                img.alt = rivalActual.nombre;
                img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
                enemyAvatarEl.appendChild(img);
            }
                        if (typeof addConsoleMessage === 'function') {
                addConsoleMessage(`🎭 RIVAL DEL TORNEO: ${rivalActual.nombre} — ${rivalActual.estrategia.descripcion}`, 'enemy');
            }
            if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();

            // 🆕 FIX TORNEO: restaurar el equipo COMPLETO del rival
            //    (no solo 1 Pokémon inicial). Si es la primera vez que
            //    sale, restaurarEquipoRival genera el equipo completo a
            //    partir de su nivel.
            if (typeof restaurarEquipoRival === 'function') {
                restaurarEquipoRival(elegidoTorneo, `(entrando en ronda ${fase})`);
            } else {
                console.warn('⚠️ restaurarEquipoRival no está definida. ¿torneo.js v3 cargado?');
            }

                        // 🆕 FIX: si la ronda actual es de tienda de objetos, generar la tienda.
            //    En rondas de objetos NO se meten objetos iniciales al baúl
            //    (enemyBaulObjetos = []), solo se genera la tienda para que el
            //    rival compre 1. Así nunca se duplican objetos.
            if (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase)) {
                if (typeof generarObjetosTienda === 'function') {
                    enemyObjetosEnTienda = generarObjetosTienda();

                    // 🆕 FIX: si el rival ya compró su objeto en avanzarRivalUnTurno
                    // (torneo.js), marcamos enemyObjetoCompradoEstaRonda = true
                    // para que NO compre un segundo objeto al entrar al combate.
                    const rivalEnTorneoCheck = window.torneoRivales
                        ? window.torneoRivales.find(r => r.nombre === elegidoTorneo.nombre)
                        : null;

                    if (rivalEnTorneoCheck && rivalEnTorneoCheck._objetoCompradoEstaRonda) {
                        enemyObjetoCompradoEstaRonda = true;
                    } else {
                        enemyObjetoCompradoEstaRonda = false;
                    }
                }
            } else {
                enemyObjetosEnTienda = [];
                enemyObjetoCompradoEstaRonda = false;
            }

            // 🆕 FIX TORNEO: restaurar el equipo COMPLETO del rival
            //    (no solo 1 Pokémon inicial). Si es la primera vez que
            //    sale, restaurarEquipoRival genera el equipo completo a
            //    partir de su nivel.
                        if (typeof restaurarEquipoRival === 'function') {
                restaurarEquipoRival(elegidoTorneo, `(entrando en ronda ${fase})`);
            } else {
                console.warn('⚠️ restaurarEquipoRival no está definida. ¿torneo.js v3 cargado?');
            }

            // 🆕 Preparar parejas del ranking (solo si hay torneo real)
            if (window.torneoRivales && window.torneoRivales.length > 0) {
                if (typeof prepararParejasRanking === 'function') {
                    prepararParejasRanking();
                }
                if (typeof actualizarRankingTorneo === 'function') {
                    actualizarRankingTorneo();
                }
            }

            return;
        } else {
            // 🆕 FIX: no quedan rivales vivos en el torneo. No caer al
            // rival genérico "Rival"; marcar null para que ejecutarFinDeRonda
            // detecte el fin del torneo.
            rivalActual = null;
            window.rivalActual = null;
            return;
        }
    }

    const rivales = window.RIVALES_INFO || [];
    if (rivales.length === 0) { rivalActual = null; window.rivalActual = null; return; }

    let rivalElegido;

    if (window._rivalForzado) {
        rivalElegido = rivales.find(r => r.nombre === window._rivalForzado);
        if (rivalElegido) {
        } else {
            console.warn(`⚠️ Rival "${window._rivalForzado}" no encontrado, usando aleatorio`);
            rivalElegido = rivales[Math.floor(Math.random() * rivales.length)];
        }
    } else {
        rivalElegido = rivales[Math.floor(Math.random() * rivales.length)];
    }

    rivalActual = rivalElegido;
    window.rivalActual = rivalElegido;

    const enemyNameEl = document.getElementById("enemyName");
    const enemyAvatarEl = document.getElementById("enemyAvatar");
    if (!window._modoOnline) { // online: el panel rival es el jugador 2, no la IA
        if (enemyNameEl) enemyNameEl.textContent = rivalElegido.nombre;
        if (enemyAvatarEl) {
            enemyAvatarEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = `assets/avatars/rivales/${rivalElegido.avatar}.webp`;
            img.alt = rivalElegido.nombre;
            img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
            enemyAvatarEl.appendChild(img);
        }
    }
    if (typeof addConsoleMessage === 'function') addConsoleMessage(`🎭 RIVAL: ${rivalElegido.nombre} — ${rivalElegido.estrategia.descripcion}`, 'enemy');
    if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();

    // 🆕 FIX: objetos iniciales SOLO si NO es ronda de objetos
    if (typeof enemyBaulObjetos !== 'undefined' && Array.isArray(enemyBaulObjetos)) {
        enemyBaulObjetos = [];
        const esRondaObjetosActual = (!window._modoOnline && typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase));
        if (!window._modoOnline && !esRondaObjetosActual) {
            const objetosIniciales = Math.floor((fase - 1) / 3);
            const MAX_OBJETOS_INICIALES = 4;
            if (objetosIniciales > 0 && typeof generarObjetosTienda === 'function') {
                const total = Math.min(objetosIniciales, MAX_OBJETOS_INICIALES);
                for (let i = 0; i < total; i++) {
                    if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) break;
                    const objetosPosibles = generarObjetosTienda();
                    if (objetosPosibles.length > 0) {
                        const elegido = objetosPosibles[Math.floor(Math.random() * objetosPosibles.length)];
                        enemyBaulObjetos.push(elegido);
                    }
                }
            }
        }
    }

    // 🆕 FIX: si la ronda actual es de tienda de objetos, generar la tienda.
    if (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase)) {
        if (typeof generarObjetosTienda === 'function') {
            enemyObjetosEnTienda = generarObjetosTienda();
            enemyObjetoCompradoEstaRonda = false;
        }
    } else {
        enemyObjetosEnTienda = [];
        enemyObjetoCompradoEstaRonda = false;
    }
}

// ============================================================
// 🆕 HELPER: genera un equipo placeholder para un rival del torneo
// ============================================================
function generarEquipoPlaceholderRival(rival) {
    const tiposRival = (rival.estrategia && rival.estrategia.tipos) ? rival.estrategia.tipos : [];
    const nivelRival = rival.nivel || 1;

    // 🆕 FIX TORNEO: apuntar al MÁXIMO del nivel, no al mínimo.
    // Un rival de nivel 8 debe entrar con 6 unidades, no con 5.
    const maxSlot = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[nivelRival])
        ? TABLA_MAX_UNIDADES[nivelRival]
        : 3;
    const minUnidades = maxSlot;

    const tablero = new Array(20).fill(null);

    // 1) Pokémon inicial (coste 1, del tipo del rival si se puede)
    const candidatosInicial = (typeof POKEMONS_COSTE1 !== 'undefined' ? POKEMONS_COSTE1 : []).filter(p =>
        p.base !== false && (!tiposRival.length || (p.tipos && p.tipos.some(t => tiposRival.includes(t))))
    );
    const pokeInicial = candidatosInicial.length > 0
        ? candidatosInicial[Math.floor(Math.random() * candidatosInicial.length)]
        : (typeof POKEMONS_COSTE1 !== 'undefined' ? POKEMONS_COSTE1 : [])[0];

    let colocados = 0;
    let oroGastado = 0;

    if (pokeInicial && pokeInicial.id) {
        const u = new Unidad(pokeInicial, 1, pokeInicial.id, pokeInicial.coste || 1);
        u.equipo = 'enemy';
        tablero[8] = u;  // E3 (frente)
        colocados = 1;
        // 🆕 NO se descuenta el coste del inicial: es "gratis" como el del jugador
    }

    // 2) Rellenar hasta llegar a minUnidades
    let pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p =>
        p.base !== false && p.coste <= 2 &&
        (!tiposRival.length || (p.tipos && p.tipos.some(t => tiposRival.includes(t))))
    );

    if (pool.length === 0) {
        pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => p.base !== false && p.coste <= 2);
    }
    if (pool.length === 0) {
        pool = (typeof POKEMONS !== 'undefined' ? POKEMONS : []).filter(p => p.base !== false);
    }

    // Oro simulado del rival (por defecto 10 como el jugador en ronda 1)
    let oroRival = (typeof rival.oro === 'number' && !isNaN(rival.oro)) ? rival.oro : 10;
    // 🆕 FIX TORNEO: si el rival es de nivel alto y no tiene oro, darle un mínimo
    if (nivelRival >= 5 && oroRival < 20) oroRival = 20;
    if (nivelRival >= 7 && oroRival < 40) oroRival = 40;

    for (let i = 0; i < tablero.length && colocados < minUnidades; i++) {
        if (tablero[i] !== null) continue;
        if (i === 8) continue;

        // 🆕 FIX TORNEO: umbral de oro mínimo a 1 (antes 2)
        if (oroRival < 1) break;

        const p = pool[Math.floor(Math.random() * pool.length)];
        if (!p) break;
        if (oroRival < p.coste) continue;

        const u = new Unidad(p, 1, p.id, p.coste);
        u.equipo = 'enemy';
        tablero[i] = u;
        colocados++;
        oroGastado += (p.coste || 1);
        oroRival -= (p.coste || 1);
    }

    // 🆕 Devolver cuánto oro ha gastado para que el caller lo descuente
    return {
        tablero: tablero,
        banquillo: new Array(8).fill(null),
        oroGastado: oroGastado
    };
}

// 🆕 Función para cambiar el fondo de la arena según el rival
// ============================================================
// 🆕 FUNCIÓN CENTRALIZADA PARA APLICAR EL TERRENO
// ============================================================
// Decide el terreno según el modo:
//   - Modo Creativo → SIEMPRE terreno-creativo.png
//   - Modo 1J/Torneo → terreno según el rival (o terreno-salvaje en PvE)
//   - Modo 2J → terreno según el rival (igual que 1J)
//
// Esta función es la ÚNICA que toca --terreno-actual.
// Cualquier otro sitio que quiera cambiar el terreno debe llamar aquí.
// ============================================================
function aplicarTerrenoActual(rival) {
    // 🆕 MODO CREATIVO: siempre el mismo fondo, sin cambios
    if (window.modoCreativo === true) {
        document.body.style.setProperty('--terreno-actual', `url('../assets/backgrounds/terreno-creativo.webp')`);
        const arena = document.querySelector('.arena-row');
        if (arena) arena.style.backgroundImage = 'none';
        return;
    }

    // 🗺️ MAPA ELEGIDO: si el jugador ha desbloqueado y elegido un mapa,
    // se respeta en todas las rondas (PvP y PvE). "Automático" devuelve
    // null y se mantiene el comportamiento original por rival.
    if (typeof Logros !== 'undefined' && typeof Logros.mapaActual === 'function') {
        const mapaElegido = Logros.mapaActual();
        if (mapaElegido && mapaElegido.archivo) {
            document.body.style.setProperty('--terreno-actual', `url('../assets/backgrounds/${mapaElegido.archivo}')`);
            const arena = document.querySelector('.arena-row');
            if (arena) arena.style.backgroundImage = 'none';
            return;
        }
    }

    // --- Modo normal (1J / 2J / Torneo) ---
    let tipoPrincipal = 'default';
    if (rival && rival.estrategia && rival.estrategia.tipos && rival.estrategia.tipos.length > 0) {
        tipoPrincipal = rival.estrategia.tipos[0].toLowerCase();
    }

    tipoPrincipal = tipoPrincipal.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (window.enRondaPvE === true || (rival && rival.esMonstruo)) {
        tipoPrincipal = 'salvaje';
    }

    const terrenosDisponibles = ['fuego', 'agua', 'planta', 'electrico', 'psiquico', 'siniestro', 'hada', 'fantasma', 'lucha', 'veneno', 'hielo', 'dragon', 'roca', 'volador', 'acero', 'eevee', 'salvaje'];

    let urlFinal;
    let nombreLog;

    if (terrenosDisponibles.includes(tipoPrincipal)) {
        urlFinal = `url('../assets/backgrounds/terreno-${tipoPrincipal}.webp')`;
        nombreLog = tipoPrincipal;
    } else {
        urlFinal = `url('../assets/backgrounds/terreno.webp')`;
        nombreLog = 'default';
    }

    document.body.style.setProperty('--terreno-actual', urlFinal);

    const arena = document.querySelector('.arena-row');
    if (arena) arena.style.backgroundImage = 'none';
}

// 🆕 Alias para no romper el código existente que llama a cambiarTerrenoPorRival
function cambiarTerrenoPorRival(rival) {
    aplicarTerrenoActual(rival);
}
