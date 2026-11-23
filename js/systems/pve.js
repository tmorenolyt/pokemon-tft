// ============================================================
// SISTEMA PvE - v2 (FIX: renombrar variable global)
// ============================================================
// El bug era que `window.esRondaPvE` se usaba para DOS cosas:
//   1) Almacenar la FUNCIÓN `esRondaPvE(ronda)`
//   2) Almacenar el BOOLEANO "estamos en ronda PvE ahora"
//
// Al hacer `spawnearMonstruoPvE` → `window.esRondaPvE = true`,
// pisábamos la función. Después, `combatir()` llamaba a
// `esRondaPvE(6)` y fallaba porque era un booleano.
//
// SOLUCIÓN:
//   - `esRondaPvE(ronda)` se queda como función NORMAL (no global).
//   - `window.enRondaPvE` (nuevo) es el BOOLEANO de estado actual.
//   - `window.monstruoActual` sigue igual.
// ============================================================

// ============================================================
// DETECCIÓN DE RONDA PvE (función, NO variable)
// ============================================================
// Fórmula: ronda === 1 || (ronda >= 6 && (ronda - 6) % 6 === 0)
//   → 1, 6, 12, 18, 24, 30...
// ============================================================

function esRondaPvE(ronda) {
    const r = (typeof ronda === 'number') ? ronda : fase;
    const esRondaDeFormula = (r === 1) || (r >= 6 && (r - 6) % 6 === 0);
    if (!esRondaDeFormula) return false;

    // ⚠️ Si la ronda NO tiene monstruo configurado (p. ej. 24, 30, 36…, de
    //    MONSTRUOS_PVE solo existen 1, 6, 12 y 18), NO es una ronda PvE real:
    //    se juega como ronda PvP normal. Antes se consideraba PvE y por eso
    //    en la ronda 24 se podía perder sin que te quitaran HP (el daño PvE
    //    es 0) y sin monstruo con el que pelear.
    if (typeof MONSTRUOS_PVE !== 'undefined' && MONSTRUOS_PVE && !MONSTRUOS_PVE[r]) {
        return false;
    }

    return true;
}

// ============================================================
// ESTADO GLOBAL (solo el booleano, NO la función)
// ============================================================
window.enRondaPvE = false;
window.monstruoActual = null;

// ============================================================
// 💬 DIÁLOGO DE LA RONDA PvE (espera a que la tienda esté cerrada)
// ============================================================
// En las rondas 6, 12 y 18 la ronda siguiente empieza con la tienda
// ABIERTA (tienda post-ronda), así que el diálogo se quedaba debajo
// del overlay. Ahora se guarda como "pendiente" y sale en cuanto el
// jugador cierra la tienda (o enseguida si no hay tienda, como en la 1).
// ============================================================
window._dialogoPvEPendiente = null;
window._dialogoPvEInicio = 0;        // cuándo se generó el pendiente (ms)
window._dialogoPvEVioTienda = false; // ¿se llegó a abrir la tienda de la ronda?

function _tiendaEstaAbierta() {
    if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) return true;
    const ov = document.getElementById('tiendaOverlay');
    return !!(ov && (ov.classList.contains('visible') || ov.style.display === 'flex'));
}

function _intentarMostrarDialogoPvE() {
    const pend = window._dialogoPvEPendiente;
    if (!pend) return false;

    // Si el combate ya ha empezado, el diálogo de la ronda se descarta
    if (typeof combatiendo !== 'undefined' && combatiendo) {
        window._dialogoPvEPendiente = null;
        return false;
    }

    // Pantalla de victoria/derrota abierta o celebración de fin de ronda: esperar
    const ovCombate = document.getElementById('combatOverlay');
    if (ovCombate && ovCombate.classList.contains('active')) return false;
    if (window._celebrandoFinRonda === true) return false;

    // Tienda abierta: esperar (saldrá al cerrarla)
    if (_tiendaEstaAbierta()) {
        window._dialogoPvEVioTienda = true;
        return false;
    }

    // Margen para que la tienda post-ronda llegue a abrirse: si nunca se abrió
    // el diálogo sale pasados unos segundos igualmente. En la ronda 1 no hay
    // tienda nunca, así que el mensaje sale al segundo de empezar.
    const MS_ESPERA_TIENDA = (pend.ronda === 1) ? 900 : 3500;
    if (!window._dialogoPvEVioTienda &&
        (Date.now() - (window._dialogoPvEInicio || 0)) < MS_ESPERA_TIENDA) {
        return false;
    }

    if (typeof mostrarConsejoJugadorPvE !== 'function') return false;

    window._dialogoPvEPendiente = null;
    mostrarConsejoJugadorPvE(pend.frase, 6500);
    return true;
}

// Vigila la ronda hasta que la tienda se cierre (máx. 3 min)
function _vigilarDialogoPvE() {
    if (window._dialogoPvEInterval) {
        clearInterval(window._dialogoPvEInterval);
        window._dialogoPvEInterval = null;
    }
    const t0 = Date.now();
    window._dialogoPvEInterval = setInterval(() => {
        if (!window._dialogoPvEPendiente) {
            clearInterval(window._dialogoPvEInterval);
            window._dialogoPvEInterval = null;
            return;
        }
        if (Date.now() - t0 > 180000) {
            window._dialogoPvEPendiente = null;
            clearInterval(window._dialogoPvEInterval);
            window._dialogoPvEInterval = null;
            return;
        }
        try { _intentarMostrarDialogoPvE(); } catch (e) { }
    }, 250);
}

// ============================================================
// SPAWN CON RETRASO
// ============================================================
// Al entrar en una ronda PvE, el rival anterior (su panel y sus Pokémon)
// se queda unos segundos en pantalla y luego aparece el monstruo.
// ============================================================
window._spawnPvEPendiente = null;

function spawnearMonstruoPvEConRetraso(ronda, ms = 2000) {
    const r = (typeof ronda === 'number') ? ronda : fase;
    if (window._spawnPvEPendiente) {
        clearTimeout(window._spawnPvEPendiente);
        window._spawnPvEPendiente = null;
    }
    console.log(`⏳ PvE: el rival anterior se queda ${ms} ms en pantalla (ronda ${r})`);
    window._spawnPvEPendiente = setTimeout(() => {
        window._spawnPvEPendiente = null;
        try { spawnearMonstruoPvE(r); } catch (e) { }
    }, Math.max(0, ms));
}

// ============================================================
// SPAWN DEL MONSTRUO
// ============================================================

function spawnearMonstruoPvE(ronda) {
    const r = (typeof ronda === 'number') ? ronda : fase;
    const config = MONSTRUOS_PVE[r];

    if (!config) {
        console.warn(`⚠️ spawnearMonstruoPvE: no hay configuración para ronda ${r}`);
        window.enRondaPvE = false;
        window.monstruoActual = null;
        return null;
    }

    console.log(`👾 Spawneando monstruo PvE para ronda ${r}: ${config.nombre}`);

    // 1) Limpiar tablero enemigo
    for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
    for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;
    if (typeof enemyBaulObjetos !== 'undefined') enemyBaulObjetos = [];

    // 2) Spawnear cada unidad
    let unidadesSpawneadas = 0;

    for (let u of config.unidades) {
        const data = POKEMON_MONSTRUOS[u.pokemon];
        if (!data) {
            console.warn(`⚠️ Monstruo "${u.pokemon}" no encontrado en POKEMON_MONSTRUOS`);
            continue;
        }

        const pokemonData = { ...data };
        const unidad = new Unidad(pokemonData, u.nivel || 1, pokemonData.id, 0);
        unidad.equipo = 'enemy';
        unidad.esMonstruo = true;
        unidad.noEquiparObjetos = true;
        unidad.esZacian = false;
        unidad.esArticuno = false;

        if (u.escudoInicial && u.escudoInicial > 0) {
            unidad.escudoActual = u.escudoInicial;
        }

        const indice = (typeof u.indice === 'number' && u.indice >= 0 && u.indice < enemyBoard.length)
            ? u.indice : 12;
        enemyBoard[indice] = unidad;
        unidadesSpawneadas++;

        const coord = (typeof getCoordenadaCasilla === 'function') ? getCoordenadaCasilla(indice, 'enemy') : indice;
        console.log(`👾 PvE: ${pokemonData.nombre} colocado en enemyBoard[${indice}] = ${coord}`);

        if (typeof coordsDesdeIndice === 'function') {
            const coords = coordsDesdeIndice(indice, 'enemy');
            unidad._filaGlobal = coords._filaGlobal;
            unidad._colGlobal  = coords._colGlobal;
            unidad._indiceTablero = 'enemy';
            unidad._indiceActual  = indice;
        }
    }

    if (unidadesSpawneadas === 0) {
        console.error(`❌ spawnearMonstruoPvE: no se pudo spawnear NINGUNA unidad para ronda ${r}`);
        window.enRondaPvE = false;
        window.monstruoActual = null;
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(`❌ Error: no se pudo invocar al monstruo de la ronda ${r}`, 'error');
        }
        return null;
    }

    // 3) Configurar rivalActual
    const primerMonstruo = enemyBoard.find(u => u && u.esMonstruo);
    const tipos = primerMonstruo ? (primerMonstruo.pokemon.tipos || []) : [];
    const clase = primerMonstruo ? (primerMonstruo.pokemon.clase || '') : '';

    window.rivalActual = {
        nombre: config.nombre,
        avatar: 'monstruo',
        esMonstruo: true,
        rondaPvE: r,
        estrategia: {
            tipos: tipos,
            clases: clase ? [clase] : [],
            prioridad: [],
            descripcion: config.descripcion
        },
        frases: {
            win: ['...'],
            lose: ['...'],
            thinking: ['...']
        }
    };

        // 4) Resetear stats visuales del enemigo (para que no muestre datos del PvP anterior)
    if (typeof enemyLevel !== 'undefined') enemyLevel = 1;

    // 🆕 FIX BUG "rivales con 100 HP": el monstruo NO usa enemyHealth.
    // En render.js se muestra como "∞" porque rivalActual.esMonstruo === true.
    // Al NO tocar enemyHealth aquí, el valor del torneo (50) no se pisa
    // y el panel de info del enemigo no se rompe al entrar al primer rival real.
    // (No asignar enemyHealth = 100)

    // 5) 🆕 FIX CLAVE: usar `window.enRondaPvE` (NO `window.esRondaPvE`)
    window.enRondaPvE = true;
    window.monstruoActual = config;

    // 🗺️ Aplicar el terreno propio del monstruo en cuanto aparece
    // (Drednaw → pantano, Regidrago → regidrago). También cubre el spawn
    // retrasado de las rondas PvE que no son la primera.
    if (typeof aplicarTerrenoActual === 'function') {
        aplicarTerrenoActual(window.rivalActual);
    } else if (typeof cambiarTerrenoPorRival === 'function') {
        cambiarTerrenoPorRival(window.rivalActual);
    }

    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(
            `👾 RONDA ${r} PvE: ${config.nombre} (${unidadesSpawneadas} unidad${unidadesSpawneadas !== 1 ? 'es' : ''})`,
            'battle'
        );
        addConsoleMessage(`   📖 ${config.descripcion}`, 'info');
    }

    // 6) Renderizar
    if (typeof renderizar === 'function') {
        renderizar();
    }

    // 7) 💬 Tu personaje dice la descripción de la ronda, pero SOLO cuando
    //    la tienda de la ronda esté cerrada (en la 1 no hay tienda y sale ya).
    //    ⛔ Nunca en el menú (antes de darle a JUGAR) ni en online antes de
    //       que empiece la primera ronda.
    let _juegoVisible = true;
    try {
        const _m = document.getElementById('menuPrincipal');
        _juegoVisible = !_m || getComputedStyle(_m).display === 'none';
    } catch (e) { }
    const _onlineListo = (window._modoOnline !== true) || (window._rondaOnlineEmpezada === true);

    if (typeof mostrarConsejoJugadorPvE === 'function'
        && window.modoDosJugadores !== true
        && window._consejoPvEMostrado !== r
        && config.descripcion
        && _juegoVisible
        && _onlineListo) {
        window._consejoPvEMostrado = r;
        window._dialogoPvEPendiente = { frase: config.descripcion, ronda: r };
        window._dialogoPvEInicio = Date.now();
        window._dialogoPvEVioTienda = false;
        setTimeout(() => { try { _intentarMostrarDialogoPvE(); } catch (e) { } }, 1200);
        _vigilarDialogoPvE();
    }

    console.log(`✅ Monstruo spawneado. window.enRondaPvE = ${window.enRondaPvE}`);
    return config;
}

// ============================================================
// LIMPIAR EL MONSTRUO AL TERMINAR LA RONDA
// ============================================================

function limpiarMonstruoPvE() {
    console.log('🧹 Limpiando monstruo PvE');

    for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
    for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;

    // 🆕 FIX: usar el booleano, NO la función
    window.enRondaPvE = false;
    window.monstruoActual = null;

    // Permite que el diálogo vuelva a salir en la próxima ronda PvE
    window._consejoPvEMostrado = null;
    window._dialogoPvEPendiente = null;
    window._dialogoPvEVioTienda = false;
}

// ============================================================
// RECOMPENSAS DEL MONSTRUO
// ============================================================

function aplicarRecompensasPvE(ronda, victoria) {
    const r = (typeof ronda === 'number') ? ronda : fase;
    const config = MONSTRUOS_PVE[r];
    if (!config) return;

    if (!victoria) {
        const danio = config.danioSiPierdes || 5;
        vidaJugador = Math.max(0, vidaJugador - danio);
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(
                `💀 ${config.nombre} te ha vencido. -${danio} HP (${vidaJugador} restantes)`,
                'error'
            );
        }
        return;
    }

    const recompensas = config.recompensas || {};

        // 🆕 FIX PUNTO 4: Las rondas PvE NO dan oro extra.
    // El oro del combate ya se gestiona en combatir().
    // (Si quieres que SÍ den oro, descomenta las 3 líneas de abajo)
    // if (recompensas.oro && recompensas.oro > 0) {
    //     oro += recompensas.oro;
    //     if (typeof addConsoleMessage === 'function') {
    //         addConsoleMessage(`💰 +${recompensas.oro} oro por derrotar a ${config.nombre}`, 'success');
    //     }
    // }

        // 🆕 FIX PUNTO 3: En PvE NO se da tienda de objetos al jugador.
    // La tienda de objetos aparecerá en la SIGUIENTE ronda (7, 13, 19...).
    // Pero el rival SÍ recibe un objeto (simulando que lo ganó).
    if (recompensas.tiendaObjetos) {
        // NO generar objetosEnTienda aquí — se generará en la ronda siguiente
        // cuando la config lo permita (7, 13, 19...).

        // 🆕 FIX PUNTO 2: El rival SÍ recibe un objeto aleatorio.
        if (typeof enemyObjetosEnTienda !== 'undefined' && typeof enemyBaulObjetos !== 'undefined') {
            const objetosPosibles = generarObjetosTienda();
            if (objetosPosibles.length > 0 && enemyBaulObjetos.length < CONFIG.MAX_BAUL) {
                const idx = Math.floor(Math.random() * objetosPosibles.length);
                const objetoElegido = objetosPosibles[idx];
                enemyBaulObjetos.push(objetoElegido);
                if (typeof addConsoleMessage === 'function') {
                    addConsoleMessage(`🤖 Rival consiguió ${objetoElegido} (PvE)`, 'enemy');
                }
            }
        }
    }

    if (recompensas.tiendaPokemon) {
        const cantidad = recompensas.cantidadPokemon || 4;
        if (typeof tienda !== 'undefined') {
            tienda = [];
            for (let i = 0; i < cantidad; i++) {
                tienda.push(getRandomPokemonPorNivel());
            }
        }
        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(`🛒 ¡TIENDA de ${cantidad} Pokémon disponible!`, 'shop');
        }
    }
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================
// ⚠️ NO exponer `window.esRondaPvE` como función. La función queda
//    accesible como `esRondaPvE` (scope global del script).
//    El estado booleano vive en `window.enRondaPvE`.
// ============================================================

window.esRondaPvE = esRondaPvE;  // ← La función (para usarla desde otros scripts)
// ⚠️ PERO NO la volvemos a pisar con booleanos. El estado va en `window.enRondaPvE`.

window.spawnearMonstruoPvE = spawnearMonstruoPvE;
window.spawnearMonstruoPvEConRetraso = spawnearMonstruoPvEConRetraso;
window.limpiarMonstruoPvE = limpiarMonstruoPvE;
// 💬 Se llama al cerrar la tienda para que el diálogo de la ronda salga al momento
window.mostrarDialogoPvEPendiente = _intentarMostrarDialogoPvE;
window.aplicarRecompensasPvE = aplicarRecompensasPvE;
