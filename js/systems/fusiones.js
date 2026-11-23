// ============================================================
// SISTEMA DE FUSIONES - VERIFICAR Y APLICAR FUSIONES
// ============================================================
// 🎯 FASE 2: desbloqueo del movimiento secundario al subir a 2★
// 🛡️ v2: blindaje contra auto-referencias (Umbreon → Umbreon)
// 🎬 v3: animación de evolución con setTimeout(50) tras renderizar()
// 🎬 v4: animación de evolución estilo Pokémon
// 🎬 v5: animarEvolucionPokemon recibe { pokemon, nivel, spriteId,
//        nombreOriginal, spriteIdOriginal }
// 🎬 v5.1: window._animacionEvolucionActiva guarda la promesa
// 🎬 v5.2: FIX — la animación se dispara SIEMPRE (tablero o banquillo).
// 🆕 v9: ANIMACIÓN 1 VEZ POR FAMILIA + NIVEL
// ✨ v10: SHINY — si alguna de las 3 copias era shiny, la
//          evolución es shiny (+10% HP/Atk/SpAtk, glow dorado)
// ✨ v11: SHINY en animación de evolución — se pasa `esShiny` a
//          animarEvolucionPokemon para que el sprite de la
//          animación sea shiny (no el normal).
// 🆕 v12: FIX DOBLE GRITO — el grito del Pokémon nuevo ya NO se
//          reproduce aquí. Lo reproduce animarEvolucionPokemon()
//          cuando se revela la evolución. Aquí suena el grito
//          del Pokémon ORIGINAL al empezar la animación.
// 🆕 v13: FIX OBJETOS — al fusionar, se separan objetos normales
//          de Discos Definitivos. Se equipan primero los 2
//          normales y luego el disco. Antes el disco contaba
//          como objeto normal y se perdía la Cuchara Peculiar.
// ============================================================

window.hitosYaAnimados = window.hitosYaAnimados || new Set();

function _hitoKey(nombrePokemon, nivel) {
    if (!nombrePokemon || typeof getFamiliaEvolutiva !== 'function') return null;
    const familia = getFamiliaEvolutiva({ nombre: nombrePokemon });
    if (!familia) return null;
    return `${familia}_${nivel}`;
}

function _hitoYaAnimado(nombrePokemon, nivel) {
    const key = _hitoKey(nombrePokemon, nivel);
    if (!key) return false;
    return window.hitosYaAnimados.has(key);
}

function _marcarHitoAnimado(nombrePokemon, nivel) {
    const key = _hitoKey(nombrePokemon, nivel);
    if (!key) return;
    window.hitosYaAnimados.add(key);
}

// ============================================================
// VERIFICAR TODAS LAS FUSIONES
// ============================================================

function verificarTodasLasFusiones() {
    // ===== ELIMINAR COPIAS BASE CUANDO HAY 3 ESTRELLAS =====
    function eliminarCopiasBaseSiEvolucion3Estrellas() {
        let cambios = false;
        for (let i = 0; i < tablero.length; i++) {
            let u = tablero[i];
            if (u && u.nivel === 3) {
                if (u.esZacian) continue;

                let familia3Estrellas = getFamiliaEvolutiva(u.pokemon);
                if (!familia3Estrellas) continue;

                for (let j = 0; j < banquillo.length; j++) {
                    let b = banquillo[j];
                    if (!b || b.esZacian) continue;
                    if (b === u) continue;
                    if (b.pokemon.nombre === u.pokemon.nombre && b.nivel === 3) continue;

                    let familiaB = getFamiliaEvolutiva(b.pokemon);
                    if (familiaB === familia3Estrellas) {
                        let costeBase = b.costeOriginal || b.pokemon.coste || 1;
                        let multiplicador = b.nivel === 3 ? 9 : (b.nivel === 2 ? 3 : 1);
                        let valor = costeBase * multiplicador;
                        oro += valor;
                        devolverAlPool(b.baseId, b.nivel === 3 ? 9 : (b.nivel === 2 ? 3 : 1));
                        addConsoleMessage(`💸 Vendiste ${b.pokemon.nombre} (${b.nivel}★) por ${valor}💰 - Ya tienes ${u.pokemon.nombre} 3★`, 'sell');
                        banquillo[j] = null;
                        cambios = true;
                    }
                }

                for (let j = 0; j < tablero.length; j++) {
                    let t = tablero[j];
                    if (!t || t.esZacian) continue;
                    if (t === u) continue;
                    if (t.pokemon.nombre === u.pokemon.nombre && t.nivel === 3) continue;

                    let familiaT = getFamiliaEvolutiva(t.pokemon);
                    if (familiaT === familia3Estrellas) {
                        let costeBase = t.costeOriginal || t.pokemon.coste || 1;
                        let multiplicador = t.nivel === 3 ? 9 : (t.nivel === 2 ? 3 : 1);
                        let valor = costeBase * multiplicador;
                        oro += valor;
                        devolverAlPool(t.baseId, t.nivel === 3 ? 9 : (t.nivel === 2 ? 3 : 1));
                        addConsoleMessage(`💸 Vendiste ${t.pokemon.nombre} (${t.nivel}★) por ${valor}💰 - Ya tienes ${u.pokemon.nombre} 3★`, 'sell');
                        tablero[j] = null;
                        cambios = true;
                    }
                }
            }
        }
        return cambios;
    }

    eliminarCopiasBaseSiEvolucion3Estrellas();
    let fusionRealizada = false;
    let animacionesFusion = [];
    let maxIter = 20;
    let iteracionesUsadas = 0;
    let fusionesRealizadas = 0;

    for (let iter = 0; iter < maxIter; iter++) {
        iteracionesUsadas = iter + 1;
        let fusionEnEstaIteracion = false;
        let todasLasUnidades = [];

        for (let i = 0; i < tablero.length; i++) {
            if (tablero[i] && !tablero[i].esZacian) {
                todasLasUnidades.push({
                    unidad: tablero[i],
                    ubicacion: 'tablero',
                    indice: i,
                    nombre: tablero[i].pokemon.nombre,
                    nivel: tablero[i].nivel,
                    baseId: tablero[i].baseId,
                    costeOriginal: tablero[i].costeOriginal,
                    objetos: tablero[i].objetos ? [...tablero[i].objetos] : [],
                    familia: getFamiliaEvolutiva(tablero[i].pokemon),
                    esShiny: tablero[i].esShiny === true
                });
            }
        }
        for (let i = 0; i < banquillo.length; i++) {
            if (banquillo[i] && !banquillo[i].esZacian) {
                todasLasUnidades.push({
                    unidad: banquillo[i],
                    ubicacion: 'banquillo',
                    indice: i,
                    nombre: banquillo[i].pokemon.nombre,
                    nivel: banquillo[i].nivel,
                    baseId: banquillo[i].baseId,
                    costeOriginal: banquillo[i].costeOriginal,
                    objetos: banquillo[i].objetos ? [...banquillo[i].objetos] : [],
                    familia: getFamiliaEvolutiva(banquillo[i].pokemon),
                    esShiny: banquillo[i].esShiny === true
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

                for (let item of items) {
                    if (item.objetos && item.objetos.length > 0) {
                        for (let obj of item.objetos) {
                            if (!objetosFusion.includes(obj)) objetosFusion.push(obj);
                        }
                    }
                }

                let primerIndice = items[0].indice;
                let primerUbicacion = items[0].ubicacion;
                let movimientoActivoOriginal = original.movimientoActivo || 'principal';

                const eraShiny = items.some(item => item.esShiny === true);

                for (let item of items) {
                    if (item.ubicacion === 'tablero') {
                        tablero[item.indice] = null;
                    } else {
                        banquillo[item.indice] = null;
                    }
                }

                if (nuevoNivel > 3) {
                    for (let item of items) {
                        let nuevaUnidad = new Unidad(original.pokemon, nivelOriginal, baseId, costeOriginal);
                        if (objetosFusion.length > 0) {
                            // 🆕 FIX v13: separar objetos normales de discos
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
                                if (!nuevaUnidad.objetos.includes(obj)) {
                                    if (aplicarObjeto(nuevaUnidad, obj)) equipadosNormales++;
                                }
                            }
                            for (let obj of discosFusion) {
                                if (!nuevaUnidad.objetos.includes(obj)) {
                                    aplicarObjeto(nuevaUnidad, obj);
                                }
                            }
                        }
                        if (nivelOriginal >= 2) {
                            nuevaUnidad.movSecundarioDesbloqueado = true;
                        }
                        nuevaUnidad.movimientoActivo = movimientoActivoOriginal;

                        if (eraShiny) {
                            nuevaUnidad.esShiny = true;
                            nuevaUnidad.pokemon.shiny = true;
                            nuevaUnidad.actualizarStats();
                        }

                        if (item.ubicacion === 'tablero') tablero[item.indice] = nuevaUnidad;
                        else banquillo[item.indice] = nuevaUnidad;
                    }
                    continue;
                }

                let evolucionData = null;
                if (evol) {
                    evolucionData = getPokemonPorNombre(evol);
                }
                if (!evolucionData) {
                    evolucionData = getPokemonPorNombre(nombreOriginal);
                }
                if (!evolucionData) {
                    for (let item of items) {
                        let nuevaUnidad = new Unidad(original.pokemon, nivelOriginal, baseId, costeOriginal);
                        if (objetosFusion.length > 0) {
                            // 🆕 FIX v13: separar objetos normales de discos
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
                                if (!nuevaUnidad.objetos.includes(obj)) {
                                    if (aplicarObjeto(nuevaUnidad, obj)) equipadosNormales++;
                                }
                            }
                            for (let obj of discosFusion) {
                                if (!nuevaUnidad.objetos.includes(obj)) {
                                    aplicarObjeto(nuevaUnidad, obj);
                                }
                            }
                        }
                        if (nivelOriginal >= 2) {
                            nuevaUnidad.movSecundarioDesbloqueado = true;
                        }
                        nuevaUnidad.movimientoActivo = movimientoActivoOriginal;

                        if (eraShiny) {
                            nuevaUnidad.esShiny = true;
                            nuevaUnidad.pokemon.shiny = true;
                            nuevaUnidad.actualizarStats();
                        }

                        if (item.ubicacion === 'tablero') tablero[item.indice] = nuevaUnidad;
                        else banquillo[item.indice] = nuevaUnidad;
                    }
                    continue;
                }

                let nuevaUnidad = new Unidad(evolucionData, nuevoNivel, baseId, costeOriginal);

                if (nuevoNivel >= 2) {
                    nuevaUnidad.movSecundarioDesbloqueado = true;
                }

                nuevaUnidad.movimientoActivo = movimientoActivoOriginal;

                if (eraShiny) {
                    nuevaUnidad.esShiny = true;
                    nuevaUnidad.pokemon.shiny = true;
                    nuevaUnidad.actualizarStats();
                    addConsoleMessage(`✨ ¡${evolucionData.nombre} ${nuevoNivel}★ es SHINY! ✨`, 'success');
                }

                if (objetosFusion.length > 0) {
                    // 🆕 FIX v13: separar objetos normales de discos
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
                        if (!nuevaUnidad.objetos.includes(obj)) {
                            if (aplicarObjeto(nuevaUnidad, obj)) {
                                equipadosNormales++;
                                addConsoleMessage(`📦 Objeto ${obj} preservado en ${evolucionData.nombre}`, 'success');
                            }
                        }
                    }

                    for (let obj of discosFusion) {
                        if (!nuevaUnidad.objetos.includes(obj)) {
                            if (aplicarObjeto(nuevaUnidad, obj)) {
                                addConsoleMessage(`💿 Disco ${obj} preservado en ${evolucionData.nombre}`, 'success');
                            }
                        }
                    }
                }

                let ubicado = false;

                if (primerUbicacion === 'tablero') {
                    if (tablero[primerIndice] === null) {
                        let unidadesEnTablero = tablero.filter(u => u !== null).length;
                        let maxUnidades = maxUnidadesTablero();
                        if (unidadesEnTablero < maxUnidades) {
                            tablero[primerIndice] = nuevaUnidad;
                            ubicado = true;
                        }
                    }
                } else {
                    if (banquillo[primerIndice] === null) {
                        banquillo[primerIndice] = nuevaUnidad;
                        ubicado = true;
                    }
                }

                if (!ubicado) {
                    let libreTablero = tablero.findIndex(cell => cell === null);
                    let unidadesEnTablero = tablero.filter(u => u !== null).length;
                    let maxUnidades = maxUnidadesTablero();

                    if (libreTablero !== -1 && unidadesEnTablero < maxUnidades) {
                        tablero[libreTablero] = nuevaUnidad;
                        ubicado = true;
                        primerUbicacion = 'tablero';
                        primerIndice = libreTablero;
                    } else {
                        let libreBanquillo = banquillo.findIndex(cell => cell === null);
                        if (libreBanquillo !== -1) {
                            banquillo[libreBanquillo] = nuevaUnidad;
                            ubicado = true;
                            primerUbicacion = 'banquillo';
                            primerIndice = libreBanquillo;
                        }
                    }
                }

                if (!ubicado) {
                    let vendido = false;
                    for (let i = 0; i < banquillo.length; i++) {
                        if (banquillo[i] && banquillo[i].nivel === 1 && (!banquillo[i].objetos || banquillo[i].objetos.length === 0) && !banquillo[i].esZacian) {
                            if (banquillo[i].pokemon.nombre === nombreOriginal) continue;
                            let valor = banquillo[i].costeOriginal || banquillo[i].pokemon.coste || 1;
                            oro += valor;
                            devolverAlPool(banquillo[i].baseId, 1);
                            addConsoleMessage(`💸 Vendiste automáticamente ${banquillo[i].pokemon.nombre} para hacer espacio`, 'sell');
                            banquillo[i] = null;
                            vendido = true;
                            break;
                        }
                    }
                    if (!vendido) {
                        for (let i = 0; i < tablero.length; i++) {
                            if (tablero[i] && tablero[i].nivel === 1 && (!tablero[i].objetos || tablero[i].objetos.length === 0) && !tablero[i].esZacian) {
                                if (tablero[i].pokemon.nombre === nombreOriginal) continue;
                                let valor = tablero[i].costeOriginal || tablero[i].pokemon.coste || 1;
                                oro += valor;
                                devolverAlPool(tablero[i].baseId, 1);
                                addConsoleMessage(`💸 Vendiste automáticamente ${tablero[i].pokemon.nombre} del tablero para hacer espacio`, 'sell');
                                tablero[i] = null;
                                vendido = true;
                                break;
                            }
                        }
                    }

                    if (vendido) {
                        let libreTablero2 = tablero.findIndex(cell => cell === null);
                        let unidadesEnTablero2 = tablero.filter(u => u !== null).length;
                        let maxUnidades2 = maxUnidadesTablero();

                        if (libreTablero2 !== -1 && unidadesEnTablero2 < maxUnidades2) {
                            tablero[libreTablero2] = nuevaUnidad;
                            ubicado = true;
                            primerUbicacion = 'tablero';
                            primerIndice = libreTablero2;
                        } else {
                            let libreBanquillo2 = banquillo.findIndex(cell => cell === null);
                            if (libreBanquillo2 !== -1) {
                                banquillo[libreBanquillo2] = nuevaUnidad;
                                ubicado = true;
                                primerUbicacion = 'banquillo';
                                primerIndice = libreBanquillo2;
                            }
                        }
                    }
                }

                if (ubicado) {
                    fusionEnEstaIteracion = true;
                    fusionRealizada = true;
                    fusionesRealizadas++;

                    const esAutoReferencia = (evol === nombreOriginal);
                    const esEvolucionReal = evol && !esAutoReferencia && evolucionData && evolucionData.nombre !== nombreOriginal;

                    const spriteIdOrig = original.pokemon.spriteId || original.pokemon.id;
                    const spriteIdNuevo = evolucionData.spriteId || evolucionData.id;

                    const hitoYaAnimado = _hitoYaAnimado(nombreOriginal, nuevoNivel);

                    console.log('🎬 fusiones.js → datos para animación:', {
                        ubicacion: primerUbicacion,
                        indice: primerIndice,
                        nombreOriginal: nombreOriginal,
                        spriteIdOriginal: spriteIdOrig,
                        nombreNuevo: evolucionData.nombre,
                        spriteIdNuevo: spriteIdNuevo,
                        esEvolucionReal: esEvolucionReal,
                        sonDistintos: spriteIdOrig !== spriteIdNuevo,
                        nuevoNivel: nuevoNivel,
                        hitoYaAnimado: hitoYaAnimado,
                        eraShiny: eraShiny
                    });

                    if (spriteIdOrig === spriteIdNuevo) {
                        console.warn('⚠️ fusiones.js: spriteIdOriginal === spriteIdNuevo, el flicker no se verá');
                    }

                    const debeAnimar = esEvolucionReal && spriteIdOrig !== spriteIdNuevo && !hitoYaAnimado;

                    if (debeAnimar) {
                        animacionesFusion.push({
                            ubicacion: primerUbicacion,
                            indice: primerIndice,
                            tipo: 'evolucion',
                            pokemon: evolucionData,
                            nivel: nuevoNivel,
                            spriteId: spriteIdNuevo,
                            nombreOriginal: nombreOriginal,
                            spriteIdOriginal: spriteIdOrig,
                            esShiny: eraShiny
                        });
                        _marcarHitoAnimado(nombreOriginal, nuevoNivel);
                        console.log(`🎬 fusiones.js: ANIMACIÓN (nuevoNivel=${nuevoNivel}, hitoYaAnimado=${hitoYaAnimado}, esShiny=${eraShiny})`);
                    } else {
                        console.log(`🎬 fusiones.js: SIN animación (nuevoNivel=${nuevoNivel}, hitoYaAnimado=${hitoYaAnimado}, esEvolucionReal=${esEvolucionReal})`);

                        if (evolucionData && evolucionData.id && typeof playPokemonCry === 'function') {
                            try {
                                playPokemonCry(evolucionData.id);
                            } catch (e) {
                                console.warn('⚠️ Error reproduciendo grito fallback:', e);
                            }
                        } else if (typeof playSonidoEvolucion === 'function') {
                            playSonidoEvolucion();
                        }
                    }

                    let mensaje = '';
                    if (esEvolucionReal) {
                        mensaje = `✅ EVOLUCIÓN: 3 ${nombreOriginal} (${nivelOriginal}★) → ${evolucionData.nombre} (${nuevoNivel}★)`;
                    } else {
                        mensaje = `✅ MEJORA: 3 ${nombreOriginal} (${nivelOriginal}★) → ${nombreOriginal} (${nuevoNivel}★)`;
                    }
                    if (eraShiny) {
                        mensaje += ' ✨ SHINY';
                    }
                    addConsoleMessage(mensaje, 'fusion');
                    playFusionSound();

                    if (nuevoNivel === 3) {
                        mostrarFlash3EstrellasJugador(evolucionData.nombre || nombreOriginal);
                        // ⭐ Logro: primera unidad 3★ / 5 en una partida / coste 5
                        if (typeof Logros !== 'undefined') {
                            Logros.evento('fusion', {
                                nivel: 3,
                                coste: Number(costeOriginal) || 0,
                                nombre: evolucionData.nombre || nombreOriginal
                            });
                        }
                    }
                } else {
                    for (let item of items) {
                        let fallback = new Unidad(original.pokemon, nivelOriginal, baseId, costeOriginal);
                        if (objetosFusion.length > 0) {
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
                                if (!fallback.objetos.includes(obj)) {
                                    if (aplicarObjeto(fallback, obj)) equipadosNormales++;
                                }
                            }
                            for (let obj of discosFusion) {
                                if (!fallback.objetos.includes(obj)) {
                                    aplicarObjeto(fallback, obj);
                                }
                            }
                        }
                        if (nivelOriginal >= 2) {
                            fallback.movSecundarioDesbloqueado = true;
                        }
                        fallback.movimientoActivo = movimientoActivoOriginal;

                        if (eraShiny) {
                            fallback.esShiny = true;
                            fallback.pokemon.shiny = true;
                            fallback.actualizarStats();
                        }

                        if (item.ubicacion === 'tablero') tablero[item.indice] = fallback;
                        else banquillo[item.indice] = fallback;
                    }
                    addConsoleMessage(`❌ No se pudo completar la fusión de ${evolucionData.nombre}`, 'error');
                }

                fusionEncontrada = true;
                break;
            }
        }
        if (!fusionEncontrada) break;
    }

    eliminarCopiasBaseSiEvolucion3Estrellas();

    if (fusionRealizada) {
        renderizar();

        if (animacionesFusion.length > 0) {
            window._animacionEvolucionActiva = new Promise(async (resolveAnim) => {
                await new Promise(r => setTimeout(r, 50));

                for (let ev of animacionesFusion) {
                    const selectorCelda = (ev.ubicacion === 'banquillo')
                        ? `#banquilloGrid .bank-cell:nth-child(${ev.indice + 1})`
                        : `#playerBoard .board-cell:nth-child(${ev.indice + 1})`;
                    const cell = document.querySelector(selectorCelda);

                    if (ev.tipo === 'evolucion' && typeof animarEvolucionPokemon === 'function') {
                        console.log('🎬 fusiones.js: LLAMANDO a animarEvolucionPokemon');
                        console.log('   → ubicacion:', ev.ubicacion);
                        console.log('   → indice:', ev.indice);
                        console.log('   → pokemon:', ev.pokemon ? ev.pokemon.nombre : 'NULL');
                        console.log('   → nivel:', ev.nivel);
                        console.log('   → spriteId:', ev.spriteId);
                        console.log('   → nombreOriginal:', ev.nombreOriginal);
                        console.log('   → spriteIdOriginal:', ev.spriteIdOriginal);
                        console.log('   → esShiny:', ev.esShiny);

                        if (ev.pokemon) {
                            try {
                                await animarEvolucionPokemon({
                                    pokemon: ev.pokemon,
                                    nivel: ev.nivel,
                                    spriteId: ev.spriteId,
                                    nombreOriginal: ev.nombreOriginal,
                                    spriteIdOriginal: ev.spriteIdOriginal,
                                    esShiny: ev.esShiny
                                });
                                console.log('✅ fusiones.js: animarEvolucionPokemon completado');
                            } catch (err) {
                                console.error('❌ fusiones.js: error en animarEvolucionPokemon:', err);
                            }
                        }
                    } else if (cell && cell.querySelector('.unit-sprite') && typeof mostrarAnimacionSubidaEstrella === 'function') {
                        console.log('⭐ fusiones.js: LLAMANDO a mostrarAnimacionSubidaEstrella');
                        mostrarAnimacionSubidaEstrella(cell, ev.tipo);
                    }
                }

                window._animacionEvolucionActiva = null;
                resolveAnim();
            });
        }

        if (typeof actualizarCartaSinergia === 'function') {
            actualizarCartaSinergia();
        }
    }

    if (fusionRealizada) {
        console.log(`🔄 verificarTodasLasFusiones: ${iteracionesUsadas} iteraciones, ${fusionesRealizadas} fusiones realizadas`);
    }

    return fusionRealizada;
}

function mostrarFlash3EstrellasJugador(nombrePokemon) {
    if (typeof addConsoleMessage === 'function') {
        addConsoleMessage(`⭐⭐⭐ ¡¡¡TIENES UN POKÉMON 3★!!! (${nombrePokemon})`, 'battle');
    }

    if (typeof playSonidoEvolucion === 'function') {
        playSonidoEvolucion();
    }

    const overlay = document.getElementById('combatOverlay');
    if (overlay) {
        const estadoAnterior = {
            className: overlay.className,
            background: overlay.style.background,
            display: overlay.style.display
        };

        overlay.className = 'combat-overlay active';
        overlay.style.display = 'flex';
        overlay.style.background = 'radial-gradient(circle, rgba(255,215,0,0.6), rgba(59,130,246,0.3))';

        const tableroEl = document.getElementById('playerBoard');
        if (tableroEl) {
            tableroEl.style.transition = 'transform 0.15s ease';
            tableroEl.style.transform = 'translateX(-6px)';
            setTimeout(() => tableroEl.style.transform = 'translateX(6px)', 100);
            setTimeout(() => tableroEl.style.transform = 'translateX(-4px)', 200);
            setTimeout(() => tableroEl.style.transform = 'translateX(4px)', 300);
            setTimeout(() => {
                tableroEl.style.transform = 'translateX(0)';
                tableroEl.style.transition = '';
            }, 400);
        }

        setTimeout(() => {
            overlay.className = estadoAnterior.className;
            overlay.style.background = estadoAnterior.background;
            overlay.style.display = estadoAnterior.display || 'none';
        }, 1500);
    }
}

// ============================================================
// 🆕 RESET DEL SET DE HITOS ANIMADOS
// ============================================================
function resetHitosYaAnimados() {
    window.hitosYaAnimados = new Set();
    console.log('🎬 resetHitosYaAnimados: Set limpiado');
}

window.verificarTodasLasFusiones = verificarTodasLasFusiones;
window.mostrarFlash3EstrellasJugador = mostrarFlash3EstrellasJugador;
window.resetHitosYaAnimados = resetHitosYaAnimados;
