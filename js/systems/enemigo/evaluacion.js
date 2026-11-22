// ============================================================
// ENEMIGO · EVALUACION
// Extraído de js/systems/enemigo.js (sin cambios de lógica).
// ============================================================

// 🆕 FIX #9: ¿Es un Pokémon clave para la estrategia?
function _esPokemonClave(unidad) {
    if (!unidad || !unidad.pokemon) return false;
    if (!enemyEstrategia || !enemyEstrategia.prioridad) return false;
    return enemyEstrategia.prioridad.includes(unidad.pokemon.nombre);
}

// 🆕 FIX #9: ¿Tiene un objeto clave (Chip de tipo o Disco)?
function _tieneObjetoClave(unidad) {
    if (!unidad || !unidad.objetos || unidad.objetos.length === 0) return false;
    return unidad.objetos.some(o => {
        const obj = OBJETOS[o];
        if (!obj || !obj.efecto) return false;
        return !!(obj.efecto.tipoBonus || obj.efecto.esDiscoUlti);
    });
}

// 🆕 FIX v12 #22: ¿Es base de una fusión pendiente?
function _esBaseDeFusionPendiente(unidad) {
    if (!unidad) return false;
    const nombre = unidad.pokemon.nombre;
    let copiasNivel1 = 0;
    let copiasNivel2 = 0;
    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        if (u.pokemon.nombre === nombre && u.nivel === 1) copiasNivel1++;
        if (u.pokemon.nombre === nombre && u.nivel === 2) copiasNivel2++;
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian) continue;
        if (u.pokemon.nombre === nombre && u.nivel === 1) copiasNivel1++;
        if (u.pokemon.nombre === nombre && u.nivel === 2) copiasNivel2++;
    }
    // 🆕 FIX: antes protegía solo con 2 copias. Ahora con 1 copia
    // también se protege si el Pokémon aporta a la estrategia.
    // Si no lo protegemos con 1 copia, la IA lo vende antes de
    // conseguir la 2ª y 3ª → NUNCA fusiona.
    if (copiasNivel1 >= 2 || copiasNivel2 >= 2) return true;

    // 🆕 Si tiene 1 copia 1★ y el Pokémon encaja con la estrategia,
    // protegerlo para que pueda llegar a 3.
    if (copiasNivel1 === 1 && enemyPokemonEncaja(unidad.pokemon)) return true;

    return false;
}

// 🆕 FIX v12 #21 + v21 #23: un Pokémon clave solo es intocable si es
// la ÚNICA copia viva de su familia en el tablero. Si tiene objeto
// clave pero NO es clave de la estrategia, tampoco es intocable.
function _esIntocableEnTablero(unidad) {
    if (!unidad) return false;

    const esClave = _esPokemonClave(unidad);
    const tieneObjetoClave = _tieneObjetoClave(unidad);

    // 🆕 FIX B: si NO aporta NINGÚN tipo de la estrategia y no tiene objeto clave,
    // NUNCA es intocable. Esto permite vender Glaceon (Hielo) en estrategia Planta,
    // o Phantump (Planta/Fantasma) en estrategia Hielo.
    let aportaTipo = false;
    if (unidad.pokemon.tipos && enemyEstrategia) {
        for (let t of unidad.pokemon.tipos) {
            if (enemyEstrategia.tipos.includes(t)) { aportaTipo = true; break; }
        }
    }
    if (!aportaTipo && !tieneObjetoClave) return false;

    // 🆕 FIX v21 #23: un Pokémon con objeto clave SOLO es intocable
    // si además es clave de la estrategia. Esto permite vender a
    // Phantump (no Hielo) aunque tenga un Chip.
    if (tieneObjetoClave && esClave) return true;
    if (!esClave) return false;

    const familia = getFamiliaEvolutivaEnemigo(unidad.pokemon);
    if (!familia) return true;

    let copiasFamiliaEnTablero = 0;
    for (let u of enemyBoard) {
        if (!u || u === unidad || u.esZacian || u.esArticuno) continue;
        if (u.muerto || u.hp <= 0) continue;
        if (getFamiliaEvolutivaEnemigo(u.pokemon) === familia) {
            copiasFamiliaEnTablero++;
        }
    }

    if (copiasFamiliaEnTablero >= 1) {
        if (_esBaseDeFusionPendiente(unidad)) return true;
        return false;
    }

    return true;
}

// ============================================================
// FUNCIÓN PARA OBTENER LA FAMILIA EVOLUTIVA
// ============================================================
function getFamiliaEvolutivaEnemigo(pokemon) {
    if (!pokemon) return null;
    let base = pokemon;
    let encontrado = true;
    let maxIter = 20;
    let iter = 0;
    while (encontrado && iter < maxIter) {
        encontrado = false;
        iter++;
        for (let p of TODOS_POKEMONS) {
            if (p.evolucion === base.nombre) {
                base = p;
                encontrado = true;
                break;
            }
        }
    }
    return base.nombre;
}

// ===== HELPER: Nombre del rival actual =====
function rivalNombre() {
    return (window.rivalActual && window.rivalActual.nombre)
        ? window.rivalActual.nombre.toUpperCase()
        : "ENEMIGO";
}

// ============================================================
// 🆕 FIX #3: Bloqueo de 3★ Y de 2★ sin copias para 3★
// ============================================================
function _enemyPokemonEn3Estrellas(pokemon) {
    if (!pokemon) return false;
    for (let u of enemyBoard) {
        if (u && !u.esZacian && u.pokemon.nombre === pokemon.nombre && u.nivel === 3) return true;
    }
    for (let u of enemyBanquillo) {
        if (u && !u.esZacian && u.pokemon.nombre === pokemon.nombre && u.nivel === 3) return true;
    }
    return false;
}

function _enemyPokemonBloqueadoPor3Estrellas(pokemon) {
    if (!pokemon) return false;

    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        if (u.nivel === 3) {
            let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
            let famP = getFamiliaEvolutivaEnemigo(pokemon);
            if (fam && famP && fam === famP) return true;
        }
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian) continue;
        if (u.nivel === 3) {
            let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
            let famP = getFamiliaEvolutivaEnemigo(pokemon);
            if (fam && famP && fam === famP) return true;
        }
    }

    if (_enemyPokemonEn3Estrellas(pokemon)) return true;

    return false;
}

// 🆕 FIX #3b: bloqueo de 2★ sin copias para 3★
function _enemyPokemonBloqueadoPor2Estrellas(pokemon) {
    if (!pokemon) return false;

    const familia = getFamiliaEvolutivaEnemigo(pokemon);
    if (!familia) return false;

    let nivelMaximo = 0;
    let copiasEnEquipo = 0;

    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        if (getFamiliaEvolutivaEnemigo(u.pokemon) === familia) {
            nivelMaximo = Math.max(nivelMaximo, u.nivel);
            copiasEnEquipo++;
        }
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian) continue;
        if (getFamiliaEvolutivaEnemigo(u.pokemon) === familia) {
            nivelMaximo = Math.max(nivelMaximo, u.nivel);
            copiasEnEquipo++;
        }
    }

    if (nivelMaximo >= 2) {
        const copiasDisponibles = (typeof getCopiasDisponibles === 'function') ? getCopiasDisponibles(pokemon) : 0;
        if (copiasEnEquipo + copiasDisponibles < 3) return true;
    }

    return false;
}

function esPokemonFrontlineEnemigo(pokemon) {
    if (!pokemon) return false;

    const clase = pokemon.clase || '';
    if (pokemon.rol) return pokemon.rol === 'frontline';

    const clasesFrontline = ['Defensa', 'Equilibrado', 'Lucha'];
    if (clasesFrontline.includes(clase)) return true;

    const clasesBackline = ['At. Especial', 'Ágil', 'Auxiliar', 'Movimiento', 'Atacante'];
    if (clasesBackline.includes(clase)) return false;

    const hp = pokemon.hp || 0;
    const defensa = pokemon.defense || 0;
    if (hp > 1000 && defensa > 150) return true;
    if (hp < 800 || defensa < 100) return false;
    return defensa > 150;
}

// 🆕 FIX #16: contar UNIDADES (no familias)
function contarFrontlineEnEquipo() {
    let count = 0;
    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        if (esPokemonFrontlineEnemigo(u.pokemon)) count++;
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian) continue;
        if (esPokemonFrontlineEnemigo(u.pokemon)) count++;
    }
    return count;
}

// 🆕 FIX #16: contar UNIDADES (no familias)
function contarBacklineEnEquipo() {
    let count = 0;
    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        if (!esPokemonFrontlineEnemigo(u.pokemon)) count++;
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian) continue;
        if (!esPokemonFrontlineEnemigo(u.pokemon)) count++;
    }
    return count;
}

function contarFamiliasDelTipo(tipo) {
    let familias = new Set();
    for (let u of enemyBoard) {
        if (u && u.pokemon && !u.esZacian && u.pokemon.tipos && u.pokemon.tipos.includes(tipo)) {
            let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
            if (fam) familias.add(fam);
        }
    }
    for (let u of enemyBanquillo) {
        if (u && u.pokemon && !u.esZacian && u.pokemon.tipos && u.pokemon.tipos.includes(tipo)) {
            let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
            if (fam) familias.add(fam);
        }
    }
    return familias;
}

function contarFamiliasDeClase(clase) {
    let familias = new Set();
    for (let u of enemyBoard) {
        if (u && u.pokemon && !u.esZacian && u.pokemon.clase === clase) {
            let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
            if (fam) familias.add(fam);
        }
    }
    for (let u of enemyBanquillo) {
        if (u && u.pokemon && !u.esZacian && u.pokemon.clase === clase) {
            let fam = getFamiliaEvolutivaEnemigo(u.pokemon);
            if (fam) familias.add(fam);
        }
    }
    return familias;
}

function leFaltaEsteTipo(pokemon) {
    if (!pokemon || !pokemon.tipos) return false;

    for (let tipo of pokemon.tipos) {
        if (!enemyEstrategia.tipos.includes(tipo)) continue;

        let familiasActuales = contarFamiliasDelTipo(tipo);
        let familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);

        if (familiasActuales.has(familiaNueva)) continue;

        let synergy = TYPE_SYNERGIES[tipo];
        if (!synergy) continue;

        let niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);
        let countFuturo = familiasActuales.size + 1;

        for (let nivel of niveles) {
            if (countFuturo === nivel || countFuturo === nivel - 1) {
                return true;
            }
        }
    }
    return false;
}

function leFaltaEstaClase(pokemon) {
    if (!pokemon || !pokemon.clase) return false;

    let clase = pokemon.clase;
    if (!enemyEstrategia.clases.includes(clase)) return false;

    let familiasActuales = contarFamiliasDeClase(clase);
    let familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);

    if (familiasActuales.has(familiaNueva)) return false;

    let synergy = CLASS_SYNERGIES[clase];
    if (!synergy) return false;

    let niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);
    let countFuturo = familiasActuales.size + 1;

    for (let nivel of niveles) {
            if (countFuturo === nivel || countFuturo === nivel - 1) {
                return true;
            }
    }
    return false;
}

function calcularCosteObjetivoRival() {
    if (!enemyEstrategia) return { costeMedio: 2, nivelMinimo: 5, costeBajo: 1, costeAlto: 2 };

    let costesPrioridad = [];

    for (let p of TODOS_POKEMONS) {
        if (enemyEstrategia.prioridad && enemyEstrategia.prioridad.includes(p.nombre)) {
            costesPrioridad.push(p.coste);
        }
    }

    if (costesPrioridad.length === 0) {
        for (let p of TODOS_POKEMONS) {
            if (p.tipos) {
                for (let tipo of p.tipos) {
                    if (enemyEstrategia.tipos.includes(tipo)) {
                        costesPrioridad.push(p.coste);
                        break;
                    }
                }
            }
        }
    }

    if (costesPrioridad.length === 0) {
        return { costeMedio: 2, nivelMinimo: 5, costeBajo: 1, costeAlto: 2 };
    }

    let suma = costesPrioridad.reduce((a, b) => a + b, 0);
    let costeMedio = suma / costesPrioridad.length;
    let costeMax = Math.max(...costesPrioridad);
    let costeMin = Math.min(...costesPrioridad);

    let nivelMinimo = 4;
    if (costeMax >= 5) nivelMinimo = 7;
    else if (costeMax === 4) nivelMinimo = 6;
    else if (costeMax === 3) nivelMinimo = 4;
    else nivelMinimo = 3;

    return {
        costeMedio: costeMedio,
        nivelMinimo: nivelMinimo,
        costeBajo: costeMin,
        costeAlto: costeMax
    };
}

function rivalTienePokemonClave() {
    if (!enemyEstrategia || !enemyEstrategia.prioridad) {
        return { tieneClave: false, tieneCosteBajo: 0 };
    }

    let tieneClave = false;
    let tieneCosteBajo = 0;

    for (let u of enemyBoard) {
        if (!u || u.esZacian) continue;
        if (enemyEstrategia.prioridad.includes(u.pokemon.nombre)) {
            if (u.pokemon.coste >= 3) tieneClave = true;
            else tieneCosteBajo++;
        }
    }
    for (let u of enemyBanquillo) {
        if (!u || u.esZacian) continue;
        if (enemyEstrategia.prioridad.includes(u.pokemon.nombre)) {
            if (u.pokemon.coste >= 3) tieneClave = true;
            else tieneCosteBajo++;
        }
    }

    return { tieneClave, tieneCosteBajo };
}

function calcularNecesidadDeSubirNivel() {
    let info = calcularCosteObjetivoRival();
    let tieneClave = rivalTienePokemonClave();

    let urgencia = 0;

    if (!tieneClave.tieneClave && info.costeAlto >= 3) {
        urgencia += 5;
    }

    if (tieneClave.tieneCosteBajo >= 2 && !tieneClave.tieneClave) {
        urgencia += 3;
    }

    if (tieneClave.tieneClave) {
        urgencia -= 3;
    }

    if (enemyLevel < info.nivelMinimo && fase >= 4) {
        urgencia += 2 + (info.nivelMinimo - enemyLevel);
    }

    if (enemyGold >= 20) urgencia += 2;

    if (enemyEstiloActual === "agresivo") urgencia += 2;
    if (enemyEstiloActual === "economico") urgencia -= 1;

    return Math.max(0, urgencia);
}

function enemyElegirEstrategia() {
    if (window.modoDosJugadores) return;

    // 🆕 FIX PvE: en ronda PvE no hay estrategia que elegir
    if (window.enRondaPvE === true) {
    console.log("👾 Ronda PvE: la IA no actúa (monstruo estático)");
    return;
}

    console.log("🤖 enemyElegirEstrategia() llamada");

    let rivalActualInfo = window.rivalActual;

    if (rivalActualInfo && rivalActualInfo.estrategia) {
        const est = rivalActualInfo.estrategia;

        if (est.estilo === "caotico") {
            console.log(`🎲 ${rivalActualInfo.nombre} es caótico → estrategia aleatoria`);
            enemyEstrategia = elegirEstrategiaAleatoria();
            enemyEstiloActual = "caotico";
            addConsoleMessage(`🎭 ${rivalActualInfo.nombre}: ¡Estrategia sorpresa! ${enemyEstrategia.tipos.join('+').toUpperCase()}`, 'enemy');
        }
        else if (!est.tipos || est.tipos.length === 0) {
            console.log(`🎲 ${rivalActualInfo.nombre} sin tipos → aleatoria`);
            enemyEstrategia = elegirEstrategiaAleatoria();
            enemyEstiloActual = est.estilo || "equilibrado";
            addConsoleMessage(`🎭 ${rivalActualInfo.nombre}: Estrategia ${enemyEstrategia.tipos.join('+').toUpperCase()}`, 'enemy');
        }
        else {
            enemyEstrategia = {
                nombre: est.tipos.join('/'),
                tipos: [...est.tipos],
                clases: [...est.clases],
                prioridad: [...est.prioridad]
            };
            enemyEstiloActual = est.estilo || "equilibrado";
            addConsoleMessage(`🎭 ${rivalActualInfo.nombre}: Estrategia ${enemyEstrategia.tipos.join('+').toUpperCase()} (${est.descripcion})`, 'enemy');
            console.log(`🎯 ${rivalActualInfo.nombre} usa: ${enemyEstrategia.tipos.join('+')} | Estilo: ${enemyEstiloActual}`);
        }
    } else {
        console.log("⚠️ No hay rival asignado, usando estrategia aleatoria");
        enemyEstrategia = elegirEstrategiaAleatoria();
        enemyEstiloActual = "equilibrado";
        addConsoleMessage(`🤖 ENEMIGO: Estrategia aleatoria: ${enemyEstrategia.nombre.toUpperCase()}`, 'enemy');
    }

    enemyObjetivos = [];
    for (let p of TODOS_POKEMONS) {
        if (p.tipos) {
            for (let tipo of p.tipos) {
                if (enemyEstrategia.tipos.includes(tipo) && !enemyObjetivos.includes(p.nombre)) {
                    enemyObjetivos.push(p.nombre);
                }
            }
        }
    }
    enemyObjetivos.sort((a, b) => {
        let aPrio = enemyEstrategia.prioridad.includes(a) ? 1 : 0;
        let bPrio = enemyEstrategia.prioridad.includes(b) ? 1 : 0;
        return bPrio - aPrio;
    });
    enemyObjetivos = enemyObjetivos.slice(0, 15);

    console.log(`📋 Objetivos: ${enemyObjetivos.slice(0, 8).join(', ')}...`);
}

function elegirEstrategiaAleatoria() {
    const estrategias = [
        { nombre: 'Planta', tipos: ['Planta'], clases: ['Movimiento', 'Auxiliar', 'Atacante'], prioridad: ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Rowlet', 'Dartrix', 'Decidueye', 'Phantump', 'Trevenant', 'Gossifleur', 'Eldegoss', 'Leafeon'] },
        { nombre: 'Agua', tipos: ['Agua'], clases: ['Auxiliar', 'Defensa', 'Atacante'], prioridad: ['Squirtle', 'Wartortle', 'Blastoise', 'Marill', 'Azumarill', 'Sobble', 'Drizzile', 'Inteleon', 'Lapras', 'Gyarados', 'Cramorant'] },
        { nombre: 'Fuego', tipos: ['Fuego'], clases: ['Atacante', 'Ágil', 'Movimiento'], prioridad: ['Charmander', 'Charmeleon', 'Charizard', 'Fennekin', 'Braixen', 'Delphox', 'Scorbunny', 'Raboot', 'Cinderace', 'Ceruledge'] },
        { nombre: 'Lucha', tipos: ['Lucha'], clases: ['Equilibrado', 'Atacante'], prioridad: ['Machop', 'Machoke', 'Machamp', 'Lucario', 'Kubfu', 'Urshifu'] },
        { nombre: 'Hada', tipos: ['Hada'], clases: ['Auxiliar', 'At. Especial'], prioridad: ['Marill', 'Azumarill', 'Tinkatuff', 'Tinkaton', 'Clefable', 'Mr. Mime', 'Sylveon'] },
        { nombre: 'Siniestro', tipos: ['Siniestro'], clases: ['Ágil', 'Auxiliar'], prioridad: ['Zorua', 'Zoroark', 'Umbreon', 'Absol', 'Tyranitar'] },
        { nombre: 'Psíquico', tipos: ['Psíquico'], clases: ['At. Especial', 'Movimiento'], prioridad: ['Ralts', 'Kirlia', 'Gardevoir', 'Espeon', 'Mr. Mime', 'Hoopa'] },
        { nombre: 'Hielo', tipos: ['Hielo'], clases: ['Defensa', 'Auxiliar'], prioridad: ['Swinub', 'Piloswine', 'Mamoswine', 'Cubchoo', 'Beartic', 'Vulpix', 'Ninetales', 'Glaceon', 'Lapras'] },
        { nombre: 'Eléctrico', tipos: ['Eléctrico'], clases: ['At. Especial', 'Ágil'], prioridad: ['Pikachu', 'Zeraora', 'Zapdos', 'Miraidon'] },
        { nombre: 'Fantasma', tipos: ['Fantasma'], clases: ['Movimiento', 'At. Especial'], prioridad: ['Phantump', 'Trevenant', 'Haunter', 'Gengar', 'Ceruledge', 'Hoopa'] },
        { nombre: 'Roca', tipos: ['Roca'], clases: ['Defensa', 'Equilibrado'], prioridad: ['Dwebble', 'Crustle', 'Tyranitar'] },
        { nombre: 'Acero', tipos: ['Acero'], clases: ['Defensa', 'Atacante'], prioridad: ['Lucario', 'Tinkatuff', 'Tinkaton'] },
        { nombre: 'Veneno', tipos: ['Veneno'], clases: ['Movimiento', 'Defensa'], prioridad: ['Arbok', 'Ivysaur', 'Venusaur', 'Haunter', 'Gengar'] }
    ];

    return estrategias[Math.floor(Math.random() * estrategias.length)];
}

function elegirPokemonInicialEnemigo() {
    const baseCoste1 = (typeof POKEMONS_COSTE1 !== 'undefined' ? POKEMONS_COSTE1 : [])
        .filter(p => p && p.base !== false && !p.esEspecial && p.id !== 999);

    if (baseCoste1.length === 0) return null;

    if (!window.rivalActual || !window.rivalActual.estrategia) {
        return baseCoste1[Math.floor(Math.random() * baseCoste1.length)];
    }

    const estrategia = window.rivalActual.estrategia;
    const tiposEstrategia = estrategia.tipos || [];
    const prioridadEstrategia = estrategia.prioridad || [];

    if (prioridadEstrategia.length > 0) {
        const candidatosPrioridad = baseCoste1.filter(p =>
            prioridadEstrategia.includes(p.nombre)
        );
        if (candidatosPrioridad.length > 0) {
            return candidatosPrioridad[Math.floor(Math.random() * candidatosPrioridad.length)];
        }
    }

    if (tiposEstrategia.length > 0) {
        const candidatosTipo = baseCoste1.filter(p =>
            p.tipos && p.tipos.some(t => tiposEstrategia.includes(t))
        );
        if (candidatosTipo.length > 0) {
            return candidatosTipo[Math.floor(Math.random() * candidatosTipo.length)];
        }
    }

    return baseCoste1[Math.floor(Math.random() * baseCoste1.length)];
}

function enemyPokemonEsUtil(pokemon) {
    if (!pokemon) return false;
    if (!enemyEstrategia) enemyElegirEstrategia();
    if (!enemyEstrategia) return false;

    if (pokemon.tipos) {
        for (let tipo of pokemon.tipos) {
            if (enemyEstrategia.tipos.includes(tipo)) return true;
        }
    }
    if (pokemon.clase && enemyEstrategia.clases.includes(pokemon.clase)) return true;
    if (enemyObjetivos.includes(pokemon.nombre)) return true;

    let totalUnidades = enemyBoard.filter(u => u !== null).length + enemyBanquillo.filter(u => u !== null).length;
    if (totalUnidades < 3) return true;
    if (pokemon.coste >= 4) return true;

    for (let u of enemyBoard) {
        if (u && u.pokemon.evolucion === pokemon.nombre) return true;
    }
    for (let u of enemyBanquillo) {
        if (u && u.pokemon.evolucion === pokemon.nombre) return true;
    }

    let copias = 0;
    for (let u of enemyBoard) {
        if (u && u.pokemon.nombre === pokemon.nombre) copias++;
    }
    for (let u of enemyBanquillo) {
        if (u && u.pokemon.nombre === pokemon.nombre) copias++;
    }
    if (copias >= 1) return true;

    return false;
}

function enemyPokemonEncaja(pokemon) {
    if (!pokemon) return false;
    if (!enemyEstrategia) enemyElegirEstrategia();
    if (!enemyEstrategia) return false;

    if (pokemon.tipos) {
        for (let tipo of pokemon.tipos) {
            if (enemyEstrategia.tipos.includes(tipo)) return true;
        }
    }
    if (pokemon.clase && enemyEstrategia.clases.includes(pokemon.clase)) return true;
    if (enemyObjetivos.includes(pokemon.nombre)) return true;
    return false;
}

function calcularBonusSinergiaTipo(pokemon) {
    if (!pokemon || !pokemon.tipos) return 0;

    let bonus = 0;

    for (let tipo of pokemon.tipos) {
        if (!enemyEstrategia.tipos.includes(tipo)) continue;

        let familiasDelTipo = contarFamiliasDelTipo(tipo);
        let familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);

        if (familiasDelTipo.has(familiaNueva)) continue;

        let familiaEnTablero = false;
        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            if (getFamiliaEvolutivaEnemigo(u.pokemon) === familiaNueva) {
                familiaEnTablero = true;
                break;
            }
        }
        if (familiaEnTablero) continue;

        let countFuturo = familiasDelTipo.size + 1;

        let synergy = TYPE_SYNERGIES[tipo];
        if (!synergy) continue;
        let niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);

        for (let nivel of niveles) {
            if (countFuturo === nivel) {
                let bonusPorNivel = nivel * 40;
                bonus += bonusPorNivel;
                if (nivel === 2) bonus += 30;
                if (nivel === 3) bonus += 80;
                if (nivel === 4) bonus += 120;
                if (nivel >= 5) bonus += 150;
                break;
            }
        }

        if (countFuturo >= 2) {
            bonus += 20;
        }
    }

    return bonus;
}

function calcularBonusSinergiaClase(pokemon) {
    if (!pokemon || !pokemon.clase) return 0;

    let bonus = 0;
    let clase = pokemon.clase;

    if (!enemyEstrategia.clases.includes(clase)) return 0;

    let familiasDeClase = contarFamiliasDeClase(clase);
    let familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);

    if (familiasDeClase.has(familiaNueva)) return 0;

    let countFuturo = familiasDeClase.size + 1;

    let synergy = CLASS_SYNERGIES[clase];
    if (!synergy) return 0;
    let niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);

    for (let nivel of niveles) {
        if (countFuturo === nivel) {
            let bonusPorNivel = nivel * 25;
            bonus += bonusPorNivel;
            if (nivel === 2) bonus += 20;
            if (nivel === 3) bonus += 50;
            if (nivel >= 4) bonus += 80;
            break;
        }
    }

    return bonus;
}

function evaluarPokemon(pokemon) {
    if (!pokemon) return 0;
    let prioridad = 0;
    if (!enemyEstrategia) enemyElegirEstrategia();

    if (pokemon.coste === 1) {
        let familia = getFamiliaEvolutivaEnemigo(pokemon);
        let yaTieneEvolucion = false;

        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            if (u.pokemon.coste >= 2 && getFamiliaEvolutivaEnemigo(u.pokemon) === familia) {
                yaTieneEvolucion = true;
                break;
            }
        }
        if (!yaTieneEvolucion) {
            for (let u of enemyBanquillo) {
                if (!u || u.esZacian) continue;
                if (u.pokemon.coste >= 2 && getFamiliaEvolutivaEnemigo(u.pokemon) === familia) {
                    yaTieneEvolucion = true;
                    break;
                }
            }
        }

        if (yaTieneEvolucion) {
            prioridad -= 80;
            console.log(`   ⚠️ ${pokemon.nombre} -80 (ya tienes evolución de su familia)`);
        }
    }

    let familiaP = getFamiliaEvolutivaEnemigo(pokemon);
    if (familiaP) {
        let yaTiene3Estrellas = false;
        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            if (u.nivel === 3 && getFamiliaEvolutivaEnemigo(u.pokemon) === familiaP) {
                yaTiene3Estrellas = true;
                break;
            }
        }
        if (!yaTiene3Estrellas) {
            for (let u of enemyBanquillo) {
                if (!u || u.esZacian) continue;
                if (u.nivel === 3 && getFamiliaEvolutivaEnemigo(u.pokemon) === familiaP) {
                    yaTiene3Estrellas = true;
                    break;
                }
            }
        }

        if (yaTiene3Estrellas) {
            prioridad -= 500;
            console.log(`   ❌ ${pokemon.nombre} -500 (ya tienes 3★ de su familia)`);
        }
    }

    if (pokemon.tipos) {
        for (let tipo of pokemon.tipos) {
            if (enemyEstrategia.tipos.includes(tipo)) {
                prioridad += 80;
                let count = 0;
                for (let u of enemyBoard) {
                    if (u && u.pokemon.tipos && u.pokemon.tipos.includes(tipo)) count++;
                }
                for (let u of enemyBanquillo) {
                    if (u && u.pokemon.tipos && u.pokemon.tipos.includes(tipo)) count++;
                }
                if (count >= 2) prioridad += 30;
                if (count >= 3) prioridad += 20;
            }
        }
    }

    if (pokemon.clase && enemyEstrategia.clases.includes(pokemon.clase)) {
        prioridad += 20;
    }

    if (pokemon.clase && enemyEstrategia.clases.includes(pokemon.clase)) {
        const clase = pokemon.clase;
        const familiasActuales = contarFamiliasDeClase(clase);
        const familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);

        if (!familiasActuales.has(familiaNueva)) {
            const countFuturo = familiasActuales.size + 1;
            const synergy = CLASS_SYNERGIES[clase];
            if (synergy) {
                const niveles = Object.keys(synergy).map(Number).sort((a, b) => a - b);
                for (let nivel of niveles) {
                    if (countFuturo === nivel) {
                        prioridad += 80;
                        console.log(`   🎯 ${pokemon.nombre} activaría clase ${clase} nivel ${nivel} (+80)`);
                        break;
                    }
                }
            }
        }
    }

    prioridad += calcularBonusSinergiaTipo(pokemon);
    prioridad += calcularBonusSinergiaClase(pokemon);

    if (enemyEstrategia.prioridad && enemyEstrategia.prioridad.includes(pokemon.nombre)) {
        prioridad += 80;
    }
    if (enemyObjetivos.includes(pokemon.nombre)) prioridad += 25;

            const familiaPropia = getFamiliaEvolutivaEnemigo(pokemon);
    if (familiaPropia) {
        let copiasFamiliaEnTablero = 0;
        let copiasFamiliaEnBanquillo = 0;
        let esEvolucionDeLoQueHay = false;
        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            if (getFamiliaEvolutivaEnemigo(u.pokemon) === familiaPropia) {
                copiasFamiliaEnTablero++;
                if (pokemon.evolucion === u.pokemon.nombre || pokemon.nombre === u.pokemon.evolucion) {
                    esEvolucionDeLoQueHay = true;
                }
            }
        }
        for (let u of enemyBanquillo) {
            if (!u || u.esZacian) continue;
            if (getFamiliaEvolutivaEnemigo(u.pokemon) === familiaPropia) {
                copiasFamiliaEnBanquillo++;
                if (pokemon.evolucion === u.pokemon.nombre || pokemon.nombre === u.pokemon.evolucion) {
                    esEvolucionDeLoQueHay = true;
                }
            }
        }

        let copiasNivel1 = 0;
        let copiasNivel2 = 0;
        for (let u of enemyBoard) {
            if (u && !u.esZacian && u.pokemon.nombre === pokemon.nombre) {
                if (u.nivel === 1) copiasNivel1++;
                else if (u.nivel === 2) copiasNivel2++;
            }
        }
        for (let u of enemyBanquillo) {
            if (u && !u.esZacian && u.pokemon.nombre === pokemon.nombre) {
                if (u.nivel === 1) copiasNivel1++;
                else if (u.nivel === 2) copiasNivel2++;
            }
        }

        // 🆕 Prioridad MÁXIMA para completar fusiones
        // (esto empuja a la IA a comprar la 3ª copia, no a comprar
        //  un Pokémon distinto que "aporta sinergia nueva")
        if (copiasNivel2 >= 2) {
            prioridad += 800;
            console.log(`   🔥🔥 ${pokemon.nombre} +800 (completa fusión a 3★)`);
        } else if (copiasNivel1 >= 2) {
            prioridad += 700;
            console.log(`   🔥 ${pokemon.nombre} +700 (completa fusión a 2★)`);
        } else if (copiasNivel1 === 1) {
            prioridad += 400;
            console.log(`   ✨ ${pokemon.nombre} +400 (2ª copia para fusión)`);
        } else if (copiasNivel2 === 1) {
            prioridad += 300;
            console.log(`   ✨ ${pokemon.nombre} +300 (busca 2ª copia para 3★)`);
        } else if (copiasFamiliaEnTablero >= 1 && !esEvolucionDeLoQueHay) {
            prioridad -= 100;
            console.log(`   ⚠️ ${pokemon.nombre} -100 (familia ${familiaPropia} ya en tablero)`);
        }
    }

    let aportaSinergiaNueva = false;

    if (pokemon.tipos) {
        for (let tipo of pokemon.tipos) {
            if (!enemyEstrategia.tipos.includes(tipo)) continue;
            let familiasDelTipo = contarFamiliasDelTipo(tipo);
            let familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);
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
                    aportaSinergiaNueva = true;
                    break;
                }
            }
        }
    }

    if (!aportaSinergiaNueva && pokemon.clase && enemyEstrategia.clases.includes(pokemon.clase)) {
        let familiasDeClase = contarFamiliasDeClase(pokemon.clase);
        let familiaNueva = getFamiliaEvolutivaEnemigo(pokemon);
        if (!familiasDeClase.has(familiaNueva)) {
            let familiaEnTablero = false;
            for (let u of enemyBoard) {
                if (!u || u.esZacian) continue;
                if (getFamiliaEvolutivaEnemigo(u.pokemon) === familiaNueva) {
                    familiaEnTablero = true;
                    break;
                }
            }
            if (!familiaEnTablero) {
                aportaSinergiaNueva = true;
            }
        }
    }

    if (aportaSinergiaNueva) {
        prioridad += 100;
        console.log(`   ✨ ${pokemon.nombre} +100 (aporta sinergia nueva)`);
    }

            let copias = 0;
    for (let u of enemyBoard) {
        if (u && u.pokemon.nombre === pokemon.nombre) copias++;
    }
    for (let u of enemyBanquillo) {
        if (u && u.pokemon.nombre === pokemon.nombre) copias++;
    }
    // 🆕 FIX: subir MUCHO el bonus por copias. Antes +150/+75, ahora +400/+600
    // para que la IA priorice completar fusiones aunque el Pokémon no
    // aporte tipo. Sin esto, la penalización -200 del tipo anula el bonus
    // y la IA nunca compra la 3ª copia.
    if (copias >= 2) prioridad += 600;   // ← antes 150, ahora 600
    else if (copias >= 1) prioridad += 400;   // ← antes 75, ahora 400

    if (pokemon.evolucion) {
        for (let u of enemyBoard) {
            if (u && u.pokemon.nombre === pokemon.evolucion) {
                prioridad += 40;
                break;
            }
        }
    }

    if (enemyEstiloActual === "agresivo") {
        if (pokemon.coste >= 4) prioridad += 30;
        if (pokemon.coste >= 5) prioridad += 40;
    } else if (enemyEstiloActual === "economico" || enemyEstiloActual === "defensivo") {
        if (pokemon.coste === 1) prioridad += 20;
        if (pokemon.coste === 2) prioridad += 15;
        if (pokemon.coste >= 5) prioridad -= 20;
    } else if (enemyEstiloActual === "late-game") {
        if (pokemon.coste >= 4) prioridad += 40;
        if (pokemon.coste >= 5) prioridad += 60;
        if (pokemon.coste === 1) prioridad -= 10;
    } else {
        if (pokemon.coste >= 4) prioridad += 20;
        if (pokemon.coste >= 5) prioridad += 30;
    }

    let totalUnidades = enemyBoard.filter(u => u !== null).length + enemyBanquillo.filter(u => u !== null).length;
    if (totalUnidades < 4) prioridad += 20;

    if (leFaltaEsteTipo(pokemon)) {
        prioridad += 100;
        console.log(`   🔥 ${pokemon.nombre} le falta poco para activar tipo (+100)`);
    }
    if (leFaltaEstaClase(pokemon)) {
        prioridad += 40;
        console.log(`   🔥 ${pokemon.nombre} le falta poco para activar clase (+40)`);
    }

    // 🆕 FIX v21 #24: premiar encaje con la estrategia (+50) y penalizar
    // el no-encaje (-150).
    if (enemyPokemonEncaja(pokemon)) {
        prioridad += 50;
    } else {
        prioridad -= 150;
    }

        // 🆕 FIX v23 #31: penalizar si NO aporta NINGÚN tipo de la estrategia
    // (solo aporta por clase). Phantump (Planta/Fantasma) en Lorelei
    // (Hielo) no aporta tipo. Vulpix (Hielo) sí. Arbok (Veneno) NO.
    let aportaTipoEstrategia = false;
    if (pokemon.tipos) {
        for (let tipo of pokemon.tipos) {
            if (enemyEstrategia.tipos.includes(tipo)) {
                aportaTipoEstrategia = true;
                break;
            }
        }
    }
    if (!aportaTipoEstrategia) {
        prioridad -= 100;
        console.log(`   ⚠️ ${pokemon.nombre} -100 (no aporta tipo ${enemyEstrategia.tipos.join('/')})`);
    }

    // 🆕 FIX 2: si NO aporta tipo pero SÍ comparte CLASE con algún Pokémon
    // del tipo que ya tenemos, darle +80 (sinergia de clase).
    // Ej: Lectro tiene Pikachu (At. Especial). Magnezone (At. Especial) → +80.
    if (!aportaTipoEstrategia && pokemon.clase) {
        let claseCompartidaConTipo = false;
        for (let u of [...enemyBoard, ...enemyBanquillo]) {
            if (!u || u.esZacian || u.esArticuno) continue;
            if (!u.pokemon.clase || u.pokemon.clase !== pokemon.clase) continue;
            if (!u.pokemon.tipos) continue;
            for (let t of u.pokemon.tipos) {
                if (enemyEstrategia.tipos.includes(t)) { claseCompartidaConTipo = true; break; }
            }
            if (claseCompartidaConTipo) break;
        }
        if (claseCompartidaConTipo) {
            prioridad += 80;
            console.log(`   🤝 ${pokemon.nombre} +80 (comparte clase ${pokemon.clase} con tu ${enemyEstrategia.tipos.join('/')})`);
        }
    }

        if (pokemon.coste >= 3) {
        // 🆕 FIX: Nivel mínimo más alto para costes 5. Si no llega, penalización enorme.
        let nivelMinimoPorCoste = { 1: 1, 2: 1, 3: 4, 4: 6, 5: 8 };
        let nivelMin = nivelMinimoPorCoste[pokemon.coste] || 1;

        if (enemyLevel < nivelMin) {
            let multiplicador = (pokemon.coste === 5) ? 50 : 15;
            let penalizacion = (nivelMin - enemyLevel) * multiplicador;
            prioridad -= penalizacion;
            console.log(`   ⚠️ ${pokemon.nombre} (coste ${pokemon.coste}) -${penalizacion} (nivel ${enemyLevel} < ${nivelMin})`);
        }
    }

    if (fase <= 5) {
        if (pokemon.coste === 1) prioridad += 30;
        if (pokemon.coste === 2) prioridad += 20;
        if (pokemon.coste >= 4) prioridad -= 50;
    }

    if (fase >= 6 && enemyLevel >= 6) {
        if (pokemon.coste >= 4) prioridad += 40;
        if (pokemon.coste >= 5) prioridad += 60;
    }

    const conteoFront = contarFrontlineEnEquipo();
    const conteoBack = contarBacklineEnEquipo();
    const esFront = esPokemonFrontlineEnemigo(pokemon);

    if (conteoBack === 0 && !esFront) {
        prioridad += 200;
    }
    if (esFront && conteoFront >= 4) {
        prioridad -= 100;
    }
    if (!esFront && conteoBack >= 3) {
        prioridad -= 40;
    }
    if (esFront && conteoFront === 0) {
        prioridad += 60;
    }

    return prioridad;
}

function enemyDecidirQueVender() {
    if (fase <= 2) return false;

    let vendidos = 0;

    // ============================================================
    // 0) Vender copias de familias con 3★
    // ============================================================
    {
        const familiasCon3Star = new Set();
        for (let u of enemyBoard) {
            if (!u || u.esZacian) continue;
            if (u.nivel === 3) {
                const fam = getFamiliaEvolutivaEnemigo(u.pokemon);
                if (fam) familiasCon3Star.add(fam);
            }
        }
        for (let u of enemyBanquillo) {
            if (!u || u.esZacian) continue;
            if (u.nivel === 3) {
                const fam = getFamiliaEvolutivaEnemigo(u.pokemon);
                if (fam) familiasCon3Star.add(fam);
            }
        }

        if (familiasCon3Star.size > 0) {
            for (let i = 0; i < enemyBanquillo.length; i++) {
                let u = enemyBanquillo[i];
                if (!u || u.esZacian) continue;
                if (u.nivel >= 3) continue;
                const fam = getFamiliaEvolutivaEnemigo(u.pokemon);
                if (!fam || !familiasCon3Star.has(fam)) continue;

                _devolverObjetosAlBaulEnemigo(u);

                let valor = u.costeOriginal * (u.nivel === 3 ? 9 : (u.nivel === 2 ? 3 : 1));
                enemyGold = Math.max(0, (enemyGold || 0) + valor);
                devolverAlPool(u.baseId, u.nivel === 3 ? 9 : (u.nivel === 2 ? 3 : 1));

                addConsoleMessage(`🤖 ${rivalNombre()} vendió ${u.pokemon.nombre} (${u.nivel}★) del banco — ya tiene 3★ de la familia`, 'enemy');

                enemyBanquillo[i] = null;
                vendidos++;
            }
        }

        if (familiasCon3Star.size > 0) {
            for (let i = 0; i < enemyBoard.length; i++) {
                let u = enemyBoard[i];
                if (!u || u.esZacian) continue;
                if (u.nivel >= 3) continue;
                const fam = getFamiliaEvolutivaEnemigo(u.pokemon);
                if (!fam || !familiasCon3Star.has(fam)) continue;

                _devolverObjetosAlBaulEnemigo(u);

                let valor = u.costeOriginal * (u.nivel === 3 ? 9 : (u.nivel === 2 ? 3 : 1));
                enemyGold = Math.max(0, (enemyGold || 0) + valor);
                devolverAlPool(u.baseId, u.nivel === 3 ? 9 : (u.nivel === 2 ? 3 : 1));

                addConsoleMessage(`🤖 ${rivalNombre()} vendió ${u.pokemon.nombre} (${u.nivel}★) del TABLERO — ya tiene 3★ de la familia`, 'enemy');

                enemyBoard[i] = null;
                vendidos++;
            }
        }
    }

    // ============================================================
    // 1) VENDER DEL BANQUILLO (con protección frontline y clave)
    // ============================================================
    let unidadesEnBanco = enemyBanquillo.filter(u => u !== null);

    if (unidadesEnBanco.length > 0) {
        let conteoFrontTablero = 0;
        for (let u of enemyBoard) {
            if (u && !u.esZacian && esPokemonFrontlineEnemigo(u.pokemon)) conteoFrontTablero++;
        }
        let conteoFrontBanco = 0;
        for (let u of enemyBanquillo) {
            if (u && !u.esZacian && esPokemonFrontlineEnemigo(u.pokemon)) conteoFrontBanco++;
        }

        let peoresPokemon = [];

                for (let i = 0; i < enemyBanquillo.length; i++) {
            let u = enemyBanquillo[i];
            if (!u) continue;

            // 🆕 FIX: las unidades 2★ y 3★ NUNCA se venden.
            // Un 2★ es mucho más valioso que un 1★, aunque no encaje
            // con la estrategia. Solo se venden 1★.
            if (u.nivel >= 2) continue;
            if (u.esZacian) continue;

            if (_esPokemonClave(u)) continue;
            if (_tieneObjetoClave(u)) continue;
            if (u.pokemon.coste >= 3) continue;
            if (_esPokemonClave(u) && u.pokemon.coste <= 2) continue;
            if (_esBaseDeFusionPendiente(u)) continue;

            let utilidad = evaluarPokemon(u.pokemon);

            // 🆕 FIX v22 #27: penalizar si no aporta TIPO
            let aportaTipo = false;
            if (u.pokemon.tipos) {
                for (let tipo of u.pokemon.tipos) {
                    if (enemyEstrategia.tipos.includes(tipo)) { aportaTipo = true; break; }
                }
            }
            if (!aportaTipo) {
                utilidad -= 150;
                console.log(`   ⚠️ ${u.pokemon.nombre} -150 (no aporta tipo ${enemyEstrategia.tipos.join('/')})`);
            }

            peoresPokemon.push({ index: i, unidad: u, utilidad: utilidad });
        }

        peoresPokemon.sort((a, b) => a.utilidad - b.utilidad);

        for (let item of peoresPokemon) {
            let noEncaja = !enemyPokemonEncaja(item.unidad.pokemon);

            const esFrontline = esPokemonFrontlineEnemigo(item.unidad.pokemon);
            if (esFrontline && conteoFrontTablero === 0 && conteoFrontBanco <= 1) {
                continue;
            }

            // 🆕 FIX v22 #28: no vender Pokémon que encajan si utilidad > 0
            if (!noEncaja && unidadesEnBanco.length < 4) continue;
            if (!noEncaja && item.utilidad > 0) continue;

            _devolverObjetosAlBaulEnemigo(item.unidad);

            let valor = item.unidad.costeOriginal * item.unidad.nivel;
            enemyGold = Math.max(0, (enemyGold || 0) + valor);
            devolverAlPool(item.unidad.baseId, item.unidad.nivel === 3 ? 9 : (item.unidad.nivel === 2 ? 3 : 1));

            if (noEncaja) {
                addConsoleMessage(`🤖 ${rivalNombre()} vendió ${item.unidad.pokemon.nombre} (no encaja con ${enemyEstrategia.nombre})`, 'enemy');
            } else {
                addConsoleMessage(`🤖 ${rivalNombre()} vendió ${item.unidad.pokemon.nombre} (utilidad: ${item.utilidad})`, 'enemy');
            }

            enemyBanquillo[item.index] = null;
            unidadesEnBanco--;
            vendidos++;
        }
    }

    // ============================================================
    // 2) VENDER DEL TABLERO SI ESTÁ LLENO
    // ============================================================
    if (vendidos === 0) {
        let maxUnits = (typeof TABLA_MAX_UNIDADES !== 'undefined')
            ? (TABLA_MAX_UNIDADES[enemyLevel] || 1)
            : Math.min(enemyLevel, 6);
        let unidadesTablero = enemyBoard.filter(u => u !== null && !u.esZacian);
        let tableroLleno = (unidadesTablero.length >= maxUnits);

                if (tableroLleno) {
            let conteoFrontTablero = 0;
            for (let u of enemyBoard) {
                if (!u || u.esZacian) continue;
                if (esPokemonFrontlineEnemigo(u.pokemon)) conteoFrontTablero++;
            }

            let peoresDelTablero = [];

                        for (let i = 0; i < enemyBoard.length; i++) {
                let u = enemyBoard[i];
                if (!u || u.esZacian) continue;

                // 🆕 FIX: las unidades 2★ y 3★ NUNCA se venden del tablero.
                if (u.nivel > 1) continue;

                if (_esPokemonClave(u)) continue;
                if (_tieneObjetoClave(u)) continue;
                if (u.pokemon.coste >= 3) continue;

                // 🆕 FIX v24: NO vender si es base de una fusión pendiente
                // (ej: Charmander con otra copia en banco esperando la 3ª).
                if (_esBaseDeFusionPendiente(u)) continue;

                let utilidad = evaluarPokemon(u.pokemon);

                if (!enemyPokemonEncaja(u.pokemon)) {
                    utilidad -= 200;
                }

                let esInicialAleatoria = true;
                if (enemyEstrategia.prioridad && enemyEstrategia.prioridad.includes(u.pokemon.nombre)) {
                    esInicialAleatoria = false;
                }
                if (enemyObjetivos.includes(u.pokemon.nombre)) {
                    esInicialAleatoria = false;
                }
                if (esInicialAleatoria) utilidad -= 50;

                peoresDelTablero.push({ index: i, unidad: u, utilidad: utilidad });
            }

            peoresDelTablero.sort((a, b) => a.utilidad - b.utilidad);

                        for (let item of peoresDelTablero) {
                let noEncaja = !enemyPokemonEncaja(item.unidad.pokemon);

                const esFrontline = esPokemonFrontlineEnemigo(item.unidad.pokemon);
                if (esFrontline && conteoFrontTablero <= 1) {
                    continue;
                }

                const tableroQuedaria = enemyBoard.filter(u => u !== null && !u.esZacian).length - 1;
                if (tableroQuedaria < 2) {
                    continue;
                }

                // 🆕 FIX v24: NUNCA dejar al rival con menos de 2 unidades
                // en el tablero (antes Erika vendía Charmander y se quedaba
                // con 1 sola unidad, perdiendo combates por incomparecencia).
                const tableroQuedaria2 = enemyBoard.filter(u => u !== null && !u.esZacian).length - 1;
                if (tableroQuedaria2 < 2) {
                    console.log(`🛡️ ${rivalNombre()}: no se vende ${item.unidad.pokemon.nombre} (dejaría el tablero con ${tableroQuedaria2} unidad)`);
                    continue;
                }

                if (noEncaja && item.utilidad < -50) {
                    _devolverObjetosAlBaulEnemigo(item.unidad);

                    let valor = item.unidad.costeOriginal * item.unidad.nivel;
                    enemyGold = Math.max(0, (enemyGold || 0) + valor);
                    devolverAlPool(item.unidad.baseId, item.unidad.nivel === 3 ? 9 : (item.unidad.nivel === 2 ? 3 : 1));

                    addConsoleMessage(`🤖 ${rivalNombre()} vendió ${item.unidad.pokemon.nombre} del TABLERO (no encaja con ${enemyEstrategia.nombre})`, 'enemy');

                    enemyBoard[item.index] = null;
                    vendidos++;
                    break;
                }
            }
        }
    }

    return vendidos > 0;
}

function _comparteClaseConTipo(pokemon) {
    if (!pokemon || !pokemon.clase || !enemyEstrategia) return false;
    for (let u of [...enemyBoard, ...enemyBanquillo]) {
        if (!u || u.esZacian || u.esArticuno) continue;
        if (u.pokemon.clase !== pokemon.clase) continue;
        if (!u.pokemon.tipos) continue;
        for (let t of u.pokemon.tipos) {
            if (enemyEstrategia.tipos.includes(t)) return true;
        }
    }
    return false;
}
