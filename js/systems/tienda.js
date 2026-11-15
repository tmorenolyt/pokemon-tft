// ============================================================
// SISTEMA DE TIENDA - v10.2 (FIX OBJETOS EN FUSIÓN)
// ============================================================
// 🔴 FIX v2: Disco Definitivo EXCLUIDO de la tienda de objetos
// 🔴 FIX v3: unidadesPendientes con fuente única de verdad
// 🛡️ v4: blindaje contra auto-referencias (Umbreon → Umbreon)
// 🎬 v5: animación de evolución con setTimeout(50) tras renderizar()
// 🆕 v7: FIX — `colocarEnPrimerEspacioLibre` coloca primero
//        en el BANCO y, si el banco está lleno, en el TABLERO.
// ✨ v8: SHINY — getRandomPokemonPorNivel tira dado shiny.
// ✨ v9: SHINY — comprar() también fuerza esShiny al crear
//        la Unidad.
// 🔊 v10.1: SHINY — el sonido ya NO se reproduce aquí.
// 🆕 v10.2: FIX OBJETOS EN FUSIÓN — al comprar y fusionar,
//        se separan objetos normales de Discos Definitivos.
//        Se equipan primero los 2 normales y luego el disco.
//        Antes el disco contaba como objeto normal y se perdía
//        la Cuchara Peculiar al fusionar.
// ============================================================

function pokemonEn3Estrellas(pokemon) {
    for (let u of tablero) {
        if (u && u.pokemon.nombre === pokemon.nombre && u.nivel === 3) return true;
    }
    for (let u of banquillo) {
        if (u && u.pokemon.nombre === pokemon.nombre && u.nivel === 3) return true;
    }
    return false;
}

function pokemonBloqueadoPor3Estrellas(pokemon) {
    for (let p of TODOS_POKEMONS) {
        if (p.evolucion === pokemon.nombre) {
            if (pokemonEn3Estrellas(p)) return true;
        }
    }
    if (pokemon.evolucion) {
        let evolucionData = getPokemonPorNombre(pokemon.evolucion);
        if (evolucionData && pokemonEn3Estrellas(evolucionData)) return true;
        let evolActual = evolucionData;
        while (evolActual && evolActual.evolucion) {
            let nextEvol = getPokemonPorNombre(evolActual.evolucion);
            if (nextEvol && pokemonEn3Estrellas(nextEvol)) return true;
            evolActual = nextEvol;
        }
    }
    if (pokemonEn3Estrellas(pokemon)) return true;
    return false;
}

// ============================================================
// ✨ SHINY: getRandomPokemonPorNivel tira un dado por slot
// ============================================================

function getRandomPokemonPorNivel() {
    let odds = SHOP_ODDS[nivelJugador] || SHOP_ODDS[8];
    let intentos = 0;
    while (intentos < 100) {
        let rand = Math.random();
        let acum = 0;
        for (let coste = 1; coste <= 5; coste++) {
            acum += odds[coste];
            if (rand <= acum) {
                let disponibles = getPokemonPorCoste(coste).filter(p => {
                    if (getCopiasDisponibles(p) <= 0) return false;
                    if (pokemonBloqueadoPor3Estrellas(p)) return false;
                    if (p.base === false) return false;
                    if (p.esEspecial) return false;
                    if (p.id === 999) return false;
                    return true;
                });
                if (disponibles.length > 0) {
                    const elegido = { ...disponibles[Math.floor(Math.random() * disponibles.length)] };
                    if (typeof tirarDadoShiny === 'function' && tirarDadoShiny()) {
                        elegido.shiny = true;
                        if (typeof addConsoleMessage === 'function') {
                            addConsoleMessage(`✨ ¡${elegido.nombre} SHINY en la tienda! ✨`, 'success');
                        }
                    }
                    return elegido;
                }
                break;
            }
        }
        intentos++;
    }
    for (let coste = 1; coste <= 5; coste++) {
        let disponibles = getPokemonPorCoste(coste).filter(p => {
            if (getCopiasDisponibles(p) <= 0) return false;
            if (pokemonBloqueadoPor3Estrellas(p)) return false;
            if (p.base === false) return false;
            if (p.esEspecial) return false;
            if (p.id === 999) return false;
            return true;
        });
        if (disponibles.length > 0) {
            const elegido = { ...disponibles[0] };
            if (typeof tirarDadoShiny === 'function' && tirarDadoShiny()) {
                elegido.shiny = true;
            }
            return elegido;
        }
    }
    return { ...POKEMONS[0] };
}

function getRandomPokemonPorNivelEnemigo() {
    let odds = SHOP_ODDS[enemyLevel] || SHOP_ODDS[8];
    let intentos = 0;
    while (intentos < 100) {
        let rand = Math.random();
        let acum = 0;
        for (let coste = 1; coste <= 5; coste++) {
            acum += odds[coste];
            if (rand <= acum) {
                let disponibles = getPokemonPorCoste(coste).filter(p => {
                    if (getCopiasDisponibles(p) <= 0) return false;
                    if (p.base === false) return false;
                    if (p.esEspecial) return false;
                    if (p.id === 999) return false;
                    return true;
                });
                if (disponibles.length > 0) {
                    return { ...disponibles[Math.floor(Math.random() * disponibles.length)] };
                }
                break;
            }
        }
        intentos++;
    }
    for (let coste = 1; coste <= 5; coste++) {
        let disponibles = getPokemonPorCoste(coste).filter(p => {
            if (getCopiasDisponibles(p) <= 0) return false;
            if (p.base === false) return false;
            if (p.esEspecial) return false;
            if (p.id === 999) return false;
            return true;
        });
        if (disponibles.length > 0) return { ...disponibles[0] };
    }
    return { ...POKEMONS[0] };
}

function generarTienda() {
    if (fase <= 1) {
        tienda = [];
        console.log(`🛒 generarTienda: fase=${fase} → SIN tienda (ronda 1)`);
        return tienda;
    }

    let numPokemon = (fase === 2) ? 3 : 4;

    if (!tiendaBloqueada) {
        tienda = [];
        for (let i = 0; i < numPokemon; i++) {
            tienda.push(getRandomPokemonPorNivel());
        }
    } else {
        if (!tienda || tienda.length === 0) {
            tienda = [];
            for (let i = 0; i < numPokemon; i++) {
                tienda.push(getRandomPokemonPorNivel());
            }
        }
    }

    return tienda;
}

function generarTiendaEnemigo() {
    if (!enemyTiendaBloqueada) {
        enemyTienda = [];
        let numFichas = (fase === 2) ? 3 : 4;
        for (let i = 0; i < numFichas; i++) {
            enemyTienda.push(getRandomPokemonPorNivelEnemigo());
        }
    }
}

function generarObjetosTienda() {
    let objetosDisponibles = null;

    if (typeof OBJETOS !== 'undefined') {
        objetosDisponibles = OBJETOS;
    } else if (typeof window.OBJETOS !== 'undefined') {
        objetosDisponibles = window.OBJETOS;
    }

    if (!objetosDisponibles) {
        console.error('❌ OBJETOS no está definido. No se pueden generar objetos.');
        return [];
    }

    const listaObjetos = Object.keys(objetosDisponibles).filter(nombre => {
        const obj = objetosDisponibles[nombre];
        if (obj && obj.efecto && obj.efecto.esDiscoUlti) return false;
        return true;
    });

    if (listaObjetos.length === 0) return [];

    const seleccionados = [];
    const disponibles = [...listaObjetos];
    const cantidad = Math.min(3, disponibles.length);

    for (let i = 0; i < cantidad && disponibles.length > 0; i++) {
        const index = Math.floor(Math.random() * disponibles.length);
        seleccionados.push(disponibles[index]);
        disponibles.splice(index, 1);
    }

    return seleccionados;
}

function contarEspacioDisponible() {
    let tableroOcupado = tablero.filter(u => u !== null).length;
    let tableroMaximo = maxUnidadesTablero();
    let banquilloOcupado = banquillo.filter(u => u !== null).length;
    let banquilloMaximo = CONFIG.BANQUILLO_MAXIMO;

    return {
        tablero: { ocupado: tableroOcupado, maximo: tableroMaximo, libre: tableroMaximo - tableroOcupado },
        banquillo: { ocupado: banquilloOcupado, maximo: banquilloMaximo, libre: banquilloMaximo - banquilloOcupado },
        totalLibre: (tableroMaximo - tableroOcupado) + (banquilloMaximo - banquilloOcupado)
    };
}

function contarCopiasPokemon(nombrePokemon) {
    let copias = [];
    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i] && tablero[i].pokemon.nombre === nombrePokemon && !tablero[i].esZacian) {
            copias.push({ ubicacion: 'tablero', indice: i, unidad: tablero[i] });
        }
    }
    for (let i = 0; i < banquillo.length; i++) {
        if (banquillo[i] && banquillo[i].pokemon.nombre === nombrePokemon && !banquillo[i].esZacian) {
            copias.push({ ubicacion: 'banquillo', indice: i, unidad: banquillo[i] });
        }
    }
    return copias;
}

function colocarEnPrimerEspacioLibre(unidad) {
    if (unidad.esZacian) {
        for (let i = 0; i < tablero.length; i++) {
            if (tablero[i] === null) {
                if (tablero.filter(u => u !== null).length < maxUnidadesTablero()) {
                    tablero[i] = unidad;
                    addConsoleMessage(`📍 ${unidad.pokemon.nombre} colocado en tablero posición ${i+1}`, 'info');
                    return true;
                }
            }
        }
        addConsoleMessage(`❌ No hay espacio en el tablero para Zacian!`, 'error');
        return false;
    }

    for (let i = 0; i < banquillo.length; i++) {
        if (banquillo[i] === null) {
            banquillo[i] = unidad;
            addConsoleMessage(`📍 ${unidad.pokemon.nombre} colocado en banquillo posición ${i+1}`, 'info');
            return true;
        }
    }

    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i] === null) {
            if (tablero.filter(u => u !== null).length < maxUnidadesTablero()) {
                tablero[i] = unidad;
                addConsoleMessage(`📍 ${unidad.pokemon.nombre} colocado en tablero posición ${i+1}`, 'info');
                return true;
            }
        }
    }

    return false;
}

function procesarUnidadesPendientes() {
    if (!window.unidadesPendientes || window.unidadesPendientes.length === 0) {
        return 0;
    }

    let colocadas = 0;
    let pendientesRestantes = [];

    for (let unidad of window.unidadesPendientes) {
        if (!unidad) continue;

        let colocado = false;

        let libreBanco = banquillo.findIndex(x => x === null);
        if (libreBanco !== -1) {
            banquillo[libreBanco] = unidad;
            colocado = true;
            colocadas++;
            addConsoleMessage(`📍 ${unidad.pokemon.nombre} colocado en banquillo posición ${libreBanco + 1} (pendiente)`, 'info');
        }

        if (!colocado && tablero.filter(u => u !== null).length < maxUnidadesTablero()) {
            let libre = tablero.findIndex(x => x === null);
            if (libre !== -1) {
                tablero[libre] = unidad;
                colocado = true;
                colocadas++;
                addConsoleMessage(`📍 ${unidad.pokemon.nombre} colocado en tablero posición ${libre + 1} (pendiente)`, 'info');
            }
        }

        if (!colocado) {
            pendientesRestantes.push(unidad);
        }
    }

    window.unidadesPendientes = pendientesRestantes;
    unidadesPendientes = pendientesRestantes;

    if (colocadas > 0) {
        addConsoleMessage(`✅ ${colocadas} unidad(es) pendiente(s) colocada(s) tras la fusión`, 'success');
        if (typeof verificarTodasLasFusiones === 'function') {
            verificarTodasLasFusiones();
        }
    }

    return colocadas;
}

function resetCambioMovimientoRonda() {
    window.cambioMovimientoUsadoEstaRonda = false;
    console.log('🎯 Cambio de movimiento por ronda reseteado');
}

function cambiarMovimientoActivo(unidad, nuevoActivo) {
    if (!unidad) return false;

    if (unidad.nivel < 2) {
        addConsoleMessage(`❌ ${unidad.pokemon.nombre} necesita ser 2★ para cambiar de movimiento`, 'error');
        return false;
    }

    if (!unidad.movSecundarioDesbloqueado && unidad.nivel >= 2) {
        unidad.movSecundarioDesbloqueado = true;
    }

    if (!unidad.movSecundarioDesbloqueado) {
        addConsoleMessage(`❌ ${unidad.pokemon.nombre} no tiene el secundario desbloqueado`, 'error');
        return false;
    }

    if (window.cambioMovimientoUsadoEstaRonda) {
        addConsoleMessage(`❌ Ya has usado el cambio de movimiento esta ronda`, 'error');
        return false;
    }

    if (unidad.movimientoActivo === nuevoActivo) {
        addConsoleMessage(`ℹ️ ${unidad.pokemon.nombre} ya está usando ese movimiento`, 'info');
        return false;
    }

    unidad.movimientoActivo = nuevoActivo;
    window.cambioMovimientoUsadoEstaRonda = true;

    let nombreMov;
    if (nuevoActivo === 'secundario') {
        const sec = window.MOVIMIENTOS_SECUNDARIOS && window.MOVIMIENTOS_SECUNDARIOS[unidad.pokemon.nombre];
        nombreMov = sec ? sec.nombre : '???';
    } else {
        const movs = typeof getMovimientosPokemon === 'function' ? getMovimientosPokemon(unidad.pokemon.nombre) : null;
        nombreMov = movs && movs[0] ? movs[0].nombre : '???';
    }

    addConsoleMessage(`🎯 ${unidad.pokemon.nombre} ahora usa ${nombreMov} (${nuevoActivo})`, 'success');

    return true;
}

function comprar(pokemon, idx) {
    if (!puedeInteractuar()) return;

    if (oro < pokemon.coste) {
        addConsoleMessage(`💰 Oro insuficiente! Necesitas ${pokemon.coste}💰`, 'error');
        return;
    }

    if (pokemonBloqueadoPor3Estrellas(pokemon)) {
        addConsoleMessage(`❌ ${pokemon.nombre} ya no está disponible`, 'error');
        return;
    }

    if (pokemon.evolucion) {
        let evolucionData = getPokemonPorNombre(pokemon.evolucion);
        if (evolucionData && pokemonEn3Estrellas(evolucionData)) {
            addConsoleMessage(`❌ Ya tienes ${evolucionData.nombre} 3★!`, 'error');
            return;
        }
    }

    if (pokemonEn3Estrellas(pokemon)) {
        addConsoleMessage(`❌ Ya tienes ${pokemon.nombre} 3★!`, 'error');
        return;
    }

    let copiasDisponibles = getCopiasDisponibles(pokemon);
    if (copiasDisponibles <= 0) {
        addConsoleMessage(`❌ No quedan copias de ${pokemon.nombre}!`, 'error');
        return;
    }

    const esShinyCompra = pokemon.shiny === true;

    let copiasExistentes = contarCopiasPokemon(pokemon.nombre);
    let copiasNivel1 = copiasExistentes.filter(c => c.unidad.nivel === 1);
    let copiasNivel2 = copiasExistentes.filter(c => c.unidad.nivel === 2);

    let esFusion = false;
    let nivelFusion = 0;
    let copiasParaFusion = [];

    if (copiasNivel1.length >= 2) {
        esFusion = true;
        nivelFusion = 1;
        copiasParaFusion = copiasNivel1.slice(0, 2);
        addConsoleMessage(`🔀 Detectada fusión: ${pokemon.nombre} 1★ x${copiasNivel1.length + 1} → ${pokemon.evolucion || pokemon.nombre} 2★`, 'info');
    }

    if (esFusion) {
        if (!consumirDelPool(pokemon.id)) {
            addConsoleMessage(`❌ No hay copias disponibles de ${pokemon.nombre} en el pool`, 'error');
            return;
        }

        let primeraCopia = copiasParaFusion[0];
        let original = primeraCopia.unidad;
        let nombreOriginal = original.pokemon.nombre;
        let evol = original.pokemon.evolucion;
        let nuevoNivel = nivelFusion + 1;
        let baseId = original.baseId;
        let costeOriginal = original.costeOriginal;

        let movimientoActivoOriginal = original.movimientoActivo || 'principal';

        const eraShiny = copiasParaFusion.some(c => c.unidad.esShiny === true) || esShinyCompra;

        let objetosFusion = [];
        for (let item of copiasParaFusion) {
            if (item.unidad.objetos && item.unidad.objetos.length > 0) {
                for (let obj of item.unidad.objetos) {
                    if (!objetosFusion.includes(obj)) objetosFusion.push(obj);
                }
            }
        }

        let evolucionData = null;
        if (evol) evolucionData = getPokemonPorNombre(evol);
        if (!evolucionData) evolucionData = getPokemonPorNombre(nombreOriginal);

        if (!evolucionData) {
            addConsoleMessage(`❌ Error al obtener datos de evolución para ${nombreOriginal}`, 'error');
            devolverAlPool(pokemon.id);
            return;
        }

        let nuevaUnidadFusionada = new Unidad(evolucionData, nuevoNivel, baseId, costeOriginal);

        let copiasTotales = copiasParaFusion.reduce((sum, item) => {
            return sum + (item.unidad.copiasConsumidas || 1);
        }, 0) + 1;
        nuevaUnidadFusionada.copiasConsumidas = copiasTotales;

        if (nuevoNivel >= 2) {
            nuevaUnidadFusionada.movSecundarioDesbloqueado = true;
        }

        nuevaUnidadFusionada.movimientoActivo = movimientoActivoOriginal;

        if (eraShiny) {
            nuevaUnidadFusionada.esShiny = true;
            nuevaUnidadFusionada.pokemon.shiny = true;
            nuevaUnidadFusionada.actualizarStats();
            addConsoleMessage(`✨ ¡${evolucionData.nombre} ${nuevoNivel}★ es SHINY! ✨`, 'success');
        }

        if (objetosFusion.length > 0) {
            // 🆕 FIX v10.2: separar objetos normales de discos
            const normalesFusion = [];
            const discosFusion = [];
            for (let obj of objetosFusion) {
                const data = OBJETOS[obj];
                if (!data) continue;
                if (data.efecto && data.efecto.esDiscoUlti) discosFusion.push(obj);
                else normalesFusion.push(obj);
            }

            let equipadosNormales = 0;
            for (let obj of normalesFusion) {
                if (equipadosNormales >= 2) break;
                if (!nuevaUnidadFusionada.objetos.includes(obj)) {
                    if (aplicarObjeto(nuevaUnidadFusionada, obj)) equipadosNormales++;
                }
            }

            for (let obj of discosFusion) {
                if (!nuevaUnidadFusionada.objetos.includes(obj)) {
                    aplicarObjeto(nuevaUnidadFusionada, obj);
                }
            }
        }

        let primerIndice = primeraCopia.indice;
        let primerUbicacion = primeraCopia.ubicacion;

        for (let item of copiasParaFusion) {
            if (item.ubicacion === 'tablero') tablero[item.indice] = null;
            else if (item.ubicacion === 'banquillo') banquillo[item.indice] = null;
        }

        if (primerUbicacion === 'tablero') {
            tablero[primerIndice] = nuevaUnidadFusionada;
        } else {
            banquillo[primerIndice] = nuevaUnidadFusionada;
        }

        oro -= pokemon.coste;
        tienda.splice(idx, 1);

        if (evolucionData && evolucionData.id) {
            playPokemonCry(evolucionData.id);
        } else {
            playSonidoEvolucion();
        }

        const esAutoReferencia = (evol === nombreOriginal);
        const esEvolucionReal = evol && !esAutoReferencia && evolucionData && evolucionData.nombre !== nombreOriginal;

        let mensaje = '';
        if (esEvolucionReal) {
            mensaje = `✅ EVOLUCIÓN: 2 ${nombreOriginal} (${nivelFusion}★) + 1 nueva → ${evolucionData.nombre} (${nuevoNivel}★)`;
        } else {
            mensaje = `✅ MEJORA: 2 ${nombreOriginal} (${nivelFusion}★) + 1 nueva → ${nombreOriginal} (${nuevoNivel}★)`;
        }
        if (eraShiny) {
            mensaje += ' ✨ SHINY';
        }
        addConsoleMessage(mensaje, 'fusion');
        playFusionSound();

        if (nuevoNivel === 3 && typeof mostrarFlash3EstrellasJugador === 'function') {
            mostrarFlash3EstrellasJugador(evolucionData.nombre || nombreOriginal);
        }

        verificarTodasLasFusiones();

        if (typeof procesarUnidadesPendientes === 'function') {
            procesarUnidadesPendientes();
        }

        renderizar();

        if (primerUbicacion === 'tablero' && typeof mostrarAnimacionSubidaEstrella === 'function') {
            setTimeout(() => {
                const cellFinal = document.querySelector(`#playerBoard .board-cell:nth-child(${primerIndice + 1})`);
                if (cellFinal && cellFinal.querySelector('.unit-sprite')) {
                    mostrarAnimacionSubidaEstrella(cellFinal, esEvolucionReal ? 'evolucion' : 'mejora');
                }
            }, 50);
        }

        if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') {
            renderizarTiendaIndependiente();
        }
        return;
    }

    let espacio = contarEspacioDisponible();

    if (espacio.totalLibre <= 0) {
        let vaAFusionar = (copiasNivel1.length >= 2) || (copiasNivel2.length >= 2);

        if (!vaAFusionar && pokemon.evolucion) {
            let copiasEvo = contarCopiasPokemon(pokemon.evolucion);
            let copiasEvoNivel1 = copiasEvo.filter(c => c.unidad.nivel === 1);
            let copiasEvoNivel2 = copiasEvo.filter(c => c.unidad.nivel === 2);
            if (copiasEvoNivel1.length >= 2 || copiasEvoNivel2.length >= 2) {
                vaAFusionar = true;
            }
        }

        if (!vaAFusionar) {
            let copiasMismoNivel1 = 0;
            let copiasMismoNivel2 = 0;
            for (let c of copiasExistentes) {
                if (c.unidad.nivel === 1) copiasMismoNivel1++;
                else if (c.unidad.nivel === 2) copiasMismoNivel2++;
            }
            if (copiasMismoNivel1 >= 2 || copiasMismoNivel2 >= 2) {
                vaAFusionar = true;
            }
        }

        if (!vaAFusionar) {
            addConsoleMessage(`❌ No hay espacio en tablero ni banquillo para ${pokemon.nombre}!`, 'error');
            return;
        }

        if (!consumirDelPool(pokemon.id)) {
            addConsoleMessage(`❌ No hay copias disponibles de ${pokemon.nombre} en el pool`, 'error');
            return;
        }

        let nuevaPendiente = new Unidad(pokemon, 1, pokemon.id, pokemon.coste);

        if (esShinyCompra) {
            nuevaPendiente.esShiny = true;
            nuevaPendiente.pokemon.shiny = true;
            nuevaPendiente.actualizarStats();
        }

        if (!window.unidadesPendientes) window.unidadesPendientes = [];
        window.unidadesPendientes.push(nuevaPendiente);
        unidadesPendientes = window.unidadesPendientes;

        oro -= pokemon.coste;
        tienda.splice(idx, 1);

        if (pokemon && pokemon.id) {
            playPokemonCry(pokemon.id);
        } else {
            playBuySound();
        }

        addConsoleMessage(`🔀 ${pokemon.nombre} comprado y guardado como pendiente (fusión en curso)`, 'info');

        verificarTodasLasFusiones();

        if (typeof procesarUnidadesPendientes === 'function') {
            procesarUnidadesPendientes();
        }

        renderizar();
        if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') {
            renderizarTiendaIndependiente();
        }
        return;
    }

    if (!consumirDelPool(pokemon.id)) {
        addConsoleMessage(`❌ No hay copias disponibles de ${pokemon.nombre} en el pool`, 'error');
        return;
    }

    let nueva = new Unidad(pokemon, 1, pokemon.id, pokemon.coste);

    if (esShinyCompra) {
        nueva.esShiny = true;
        nueva.pokemon.shiny = true;
        nueva.actualizarStats();
    }

    let colocado = colocarEnPrimerEspacioLibre(nueva);

    if (colocado) {
        oro -= pokemon.coste;
        tienda.splice(idx, 1);

        if (pokemon && pokemon.id) {
            playPokemonCry(pokemon.id);
        } else {
            playBuySound();
        }

        if (esShinyCompra) {
            addConsoleMessage(`✨ ¡${pokemon.nombre} SHINY comprado! ✨`, 'success');
        } else {
            addConsoleMessage(`🛒 ${pokemon.nombre} comprado! (${pokemon.coste}💰)`, 'buy');
        }

        verificarTodasLasFusiones();
        if (!primerCombateRealizado && tablero.some(u => u !== null)) {
            primerCombateRealizado = true;
            addConsoleMessage("✅ ¡Pokémon seleccionado! Ahora puedes combatir.", 'success');
        }
        renderizar();
        if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') {
            renderizarTiendaIndependiente();
        }
    } else {
        devolverAlPool(pokemon.id);
        addConsoleMessage(`❌ No hay espacio!`, 'error');
    }
}

function refrescarTienda() {
    if (!puedeInteractuar()) return;

    if (tiendaBloqueada) {
        addConsoleMessage(`🔒 Tienda BLOQUEADA! Desbloquéala para hacer reroll`, 'info');
        return;
    }

    if (oro >= 2) {
        oro -= 2;
        generarTienda();
        playButtonSound();
        addConsoleMessage(`🔄 Tienda actualizada! -2💰`, 'shop');
        renderizar();
        if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') {
            renderizarTiendaIndependiente();
        }
    } else {
        addConsoleMessage(`💰 Oro insuficiente! Necesitas 2💰`, 'error');
    }
}

function toggleLockTienda() {
    if (fase <= 2) {
        addConsoleMessage(`🔒 No puedes bloquear la tienda todavía (disponible desde ronda 3)`, 'info');
        return;
    }

    tiendaBloqueada = !tiendaBloqueada;

    try {
        localStorage.setItem('tiendaBloqueada', JSON.stringify(tiendaBloqueada));
    } catch (e) {}

    const btnLockTienda = document.getElementById('btnLockShopTienda');
    if (btnLockTienda) {
        if (tiendaBloqueada) {
            btnLockTienda.classList.add('locked');
            btnLockTienda.innerHTML = '<span class="lock-icon">🔒</span>';
            btnLockTienda.title = '🔒 Tienda bloqueada - Los Pokémon se mantienen';
        } else {
            btnLockTienda.classList.remove('locked');
            btnLockTienda.innerHTML = '<span class="lock-icon">🔓</span>';
            btnLockTienda.title = '🔓 Tienda libre - Se regenera cada ronda';
        }
    }

    const tituloTienda = document.querySelector('.tienda-header h2');
    if (tituloTienda) {
        const lockIcon = tiendaBloqueada ? '🔒' : '🔓';
        tituloTienda.innerHTML = `🛒 TIENDA ${lockIcon} <small>⏱️ Ronda ${ronda}</small>`;
    }

    if (tiendaBloqueada) {
        addConsoleMessage(`🔒 Tienda BLOQUEADA - Los Pokémon se mantendrán entre rondas`, 'info');
    } else {
        addConsoleMessage(`🔓 Tienda DESBLOQUEADA - Los Pokémon se renovarán cada ronda`, 'info');
    }

    playButtonSound();
    renderizar();
    if (tiendaAbierta && typeof renderizarTiendaIndependiente === 'function') {
        renderizarTiendaIndependiente();
    }
}

function calcularValorVenta(unidad) {
    if (!unidad) return 0;

    let costeBase = unidad.costeOriginal || unidad.pokemon.coste || 1;
    let multiplicador = 1;
    if (unidad.nivel === 1) multiplicador = 1;
    else if (unidad.nivel === 2) multiplicador = 3;
    else if (unidad.nivel === 3) multiplicador = 9;

    return costeBase * multiplicador;
}

// 🆕 FIX: exponer getRandomPokemonPorNivelEnemigo para que torneo.js
// pueda generar una tienda temporal para los rivales no activos
// en la ronda 2 (y que compren su 2º Pokémon).
window.getRandomPokemonPorNivelEnemigo = getRandomPokemonPorNivelEnemigo;


window.procesarUnidadesPendientes = procesarUnidadesPendientes;
window.resetCambioMovimientoRonda = resetCambioMovimientoRonda;
window.cambiarMovimientoActivo = cambiarMovimientoActivo;