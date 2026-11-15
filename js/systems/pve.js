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
    if (r === 1) return true;
    if (r >= 6 && (r - 6) % 6 === 0) return true;
    return false;
}

// ============================================================
// ESTADO GLOBAL (solo el booleano, NO la función)
// ============================================================
window.enRondaPvE = false;
window.monstruoActual = null;

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
window.limpiarMonstruoPvE = limpiarMonstruoPvE;
window.aplicarRecompensasPvE = aplicarRecompensasPvE;
