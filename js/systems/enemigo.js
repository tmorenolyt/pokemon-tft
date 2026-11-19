// ============================================================
// SISTEMA DE IA ENEMIGA - VERSIÓN HORIZONTAL 4×5
// ============================================================
// 🎯 COLOCACIÓN INICIAL (v3):
//   - Melee enemigo  → E3, luego E2, E4, F3, E1, E5, F2, F4...
//   - Backline enemigo → H3, luego H2, H4, G3, H1, H5, G2, G4...
//   - Se aprovecha el centro del tablero (fila 3)
//
// 🎯 MODELO LINEAL:
//   A(0) B(1) C(2) D(3) ‖ E(4) F(5) G(6) H(7)
//   D(3) y E(4) son adyacentes (distancia 1)
//
// 🆕 v23 FIXES (esta versión):
//   #29: intentarSustituirUnidadMalaDelTablero ya NO descarta a los
//        que encajan con la estrategia. Antes tenía un `continue`
//        que excluía a Phantump (Auxiliar) y Pikachu (At. Especial).
//   #30: umbral de swap en enemyMoverMejoresAlTablero +20 → +5.
//        Vulpix (BACK) puede sustituir a Pikachu (BACK).
//   #31: evaluarPokemon penaliza -100 si NO aporta tipo de la
//        estrategia (solo clase). Phantump baja, Vulpix sube.
//   #32: enemyComprarObjetoExperto solo compra Chips de tipos de
//        la ESTRATEGIA, no de Pokémon sueltos. Chip Planta ya no
//        se compra si Lorelei no es Planta.
//   #33: eliminado log redundante en intentarSustituir.
//
// 🆕 v22 FIXES:
//   #26: permitir swap por diferencia de utilidad >= 150 aunque
//        los roles no coincidan.
//   #27: penalizar -150 en enemyDecidirQueVender si no aporta tipo.
//   #28: no vender Pokémon que encajan si utilidad > 0.
//
// 🆕 v21 FIXES:
//   #22: permitir swap si aporta sinergia NUEVA aunque roles
//        no coincidan (Vulpix BACK por Arbok FRONT).
//   #23: Phantump deja de ser intocable si tiene Chip pero no
//        es clave de la estrategia.
//   #24: evaluarPokemon +50 si encaja, -150 si no encaja.
//
// 🆕 v20 FIXES:
//   #21: enemyEquiparObjetos reasigna objetos de Pokémon malos
//        a Pokémon buenos antes de vender.
//
// 🆕 v12 FIXES:
//   #1: Objetos devueltos al baúl al mover al banco / fusionar
//   #2: Bucle comprar/vender limitado a 1 pasada por ronda
//   #3: Bloqueo de compra si ya tiene 2★ y no hay 3 copias
//   #4: Estilo "late-game" (ahorrar + subir nivel antes de comprar)
//   #5: Más peso a los clave en evaluarPokemon (+80)
//   #6: No vender Pokémon clave de la estrategia
//   #7: Reset de flags de "ya movió/sustituyó esta ronda"
//   #9: Helpers _esPokemonClave / _tieneObjetoClave / _esIntocableEnTablero
//   #10: Priorizar en tablero el Pokémon con objeto clave
//   #11: No mover al banco Pokémon intocables
//   #12: Si un intocable va al banco, conserva sus objetos
//   #13: No vender Pokémon clave ni con objeto clave
//   #14: No sustituir Pokémon intocables
//   #15: No sustituir con el banquillo un intocable
//   #16: contarFrontline/Backline cuentan UNIDADES, no familias
//   #17: No vender Pokémon de coste ≥ 3 aunque no encajen
//   #18: Logs de Velo Aurora
//   #19: Noa ahorra oro en mid-game
//   #20: Priorizar reroll si hay clave en la tienda
// ============================================================

let enemyEstrategia = null;
let enemyObjetivos = [];
let enemyEstiloActual = "equilibrado";

// ============================================================
// HELPERS DE OBJETOS / CLAVE
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

// ============================================================
// HELPERS: ¿Es frontline o backline?
// ============================================================

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

// ============================================================
// CONTAR FAMILIAS DE UN TIPO/CLASE
// ============================================================

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

// ============================================================
// ¿LE FALTA POCO PARA ACTIVAR SINERGIA?
// ============================================================

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

// ============================================================
// COSTE OBJETIVO DEL RIVAL
// ============================================================

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

// ============================================================
// ¿EL RIVAL YA TIENE SUS POKÉMON CLAVE?
// ============================================================

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

// ============================================================
// CALCULAR URGENCIA DE SUBIR NIVEL
// ============================================================

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

// ============================================================
// ELEGIR ESTRATEGIA BASADA EN EL RIVAL ASIGNADO
// ============================================================

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

// ============================================================
// ELEGIR POKÉMON INICIAL PARA EL ENEMIGO
// ============================================================

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

// ============================================================
// ¿ES ÚTIL EL POKÉMON?
// ============================================================

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

// ============================================================
// CALCULAR BONUS POR SINERGIA DE TIPO
// ============================================================

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

// ============================================================
// EVALUAR POKÉMON
// ============================================================

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

// ============================================================
// DECIDIR QUÉ VENDER
// ============================================================

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

// ============================================================
// 🧠 INTENTAR SUSTITUIR UNA UNIDAD MALA DEL TABLERO
// ============================================================
// 🆕 FIX v23 #29: ya NO se descarta a los que encajan con la
// estrategia. Antes había un `continue` que excluía a Phantump
// (Auxiliar) y Pikachu (At. Especial). Ahora se evalúan todos.
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
            mostrarReaccionPensando(1500);
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
                mostrarComicBubble(ancla, frase, 1500, 'win');
            }
        }, 400);
    }

    return true;
}

window.intentarSustituirUnidadMalaDelTablero = intentarSustituirUnidadMalaDelTablero;

// ============================================================
// MOVER MEJORES AL TABLERO
// ============================================================

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

// ============================================================
// POSICIONAR UNIDADES INTELIGENTEMENTE
// ============================================================

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

// ============================================================
// EQUIPAR OBJETOS
// ============================================================

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

// ============================================================
// COMPRAR OBJETOS
// ============================================================

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
// VERIFICAR FUSIONES DEL ENEMIGO
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

// ============================================================
// COMPRAR POKÉMON
// ============================================================

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
window._comparteClaseConTipo = _comparteClaseConTipo;

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

// ============================================================
// 🆕 REROLL DEL ENEMIGO CON PRESUPUESTO RESERVADO
// ============================================================

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

window.enemyIntentarRerolls = enemyIntentarRerolls;
window.enemyEvaluarSiMereceReroll = enemyEvaluarSiMereceReroll;
window.enemyCalcularReservaMinimaReroll = enemyCalcularReservaMinimaReroll;

// ============================================================
// LIMPIAR DUPLICADOS EN BANQUILLO
// ============================================================

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

// ============================================================
// FLASH 3★ ENEMIGO
// ============================================================

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

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

        async function upgradeEnemyTeam() {
    if (window.modoDosJugadores) return;
    if (window._modoOnline) return; // 🆕 online 1v1: sin IA que compre/suba

    // 🆕 FIX: Asegurar Disco Definitivo si es nivel 5+
    if (enemyLevel >= 5) {
        if (!enemyBaulObjetos) enemyBaulObjetos = []; // Asegurar que existe

        // 💿 FIX: máximo de discos según nivel (1 a nivel 5-7, 2 a nivel 8)
        const _maxD = (typeof maxDiscosPorNivelEquipo === 'function') ? maxDiscosPorNivelEquipo(enemyLevel) : (enemyLevel >= 8 ? 2 : 1);
        const _cntD = ((typeof contarDiscosEnUnidades === 'function') ? contarDiscosEnUnidades([...enemyBoard, ...enemyBanquillo]) : 0)
            + enemyBaulObjetos.filter(o => o === "Disco Definitivo").length;
        if (_cntD >= _maxD) {
            // Ya tiene el máximo: no dar más discos.
            enemyBaulObjetos = enemyBaulObjetos.filter((o, i, arr) => o !== "Disco Definitivo" || arr.indexOf(o) === i);
        }

        let tieneDiscoEnBaul = enemyBaulObjetos.includes("Disco Definitivo");
        let tieneDiscoEquipado = [...enemyBoard, ...enemyBanquillo].some(u => 
            u && u.objetos && u.objetos.some(o => {
                const obj = window.OBJETOS && window.OBJETOS[o];
                return obj && obj.efecto && obj.efecto.esDiscoUlti;
            })
        );

        if (!tieneDiscoEnBaul && !tieneDiscoEquipado && _cntD < _maxD) {
            if (enemyBaulObjetos.length < CONFIG.MAX_BAUL) {
                enemyBaulObjetos.push("Disco Definitivo");
                if (typeof addConsoleMessage === 'function') {
                    addConsoleMessage(`💿 ${rivalNombre()} recibió un DISCO DEFINITIVO en el baúl (Nivel ${enemyLevel})`, 'enemy');
                }
            } else {
                const idxGenerico = enemyBaulObjetos.findIndex(nombre => {
                    const obj = OBJETOS[nombre];
                    if (!obj) return false;
                    if (obj.efecto && obj.efecto.esDiscoUlti) return false;
                    if (obj.efecto && obj.efecto.tipoBonus && enemyEstrategia && enemyEstrategia.tipos.includes(obj.efecto.tipoBonus)) return false;
                    return true;
                });
                if (idxGenerico !== -1) {
                    enemyBaulObjetos.splice(idxGenerico, 1);
                    enemyBaulObjetos.push("Disco Definitivo");
                    if (typeof addConsoleMessage === 'function') {
                        addConsoleMessage(`💿 ${rivalNombre()} vendió un objeto para hacer sitio al DISCO DEFINITIVO`, 'enemy');
                    }
                }
            }
        }

        // ⭐ Persistir el Disco en el rival (objetosAcumulados) para que no se
        // pierda al cambiar de rival y aparezca en su baúl aunque no tenga 2★.
        try {
            if (window.rivalActual && Array.isArray(window.torneoRivales)) {
                const _rv = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
                if (_rv) {
                    if (!_rv.objetosAcumulados) _rv.objetosAcumulados = [];
                    if (!_rv.objetosAcumulados.includes("Disco Definitivo")) _rv.objetosAcumulados.push("Disco Definitivo");
                }
            }
        } catch (e) {}
    }

    // 🆕 FIX PvE: en ronda PvE, el "enemigo" es un monstruo estático.
    // No compra, no sube nivel, no se mueve. La IA no actúa.
    if (window.enRondaPvE === true) {
        console.log("👾 Ronda PvE: upgradeEnemyTeam() ignorada (monstruo estático)");
        return;
    }

    console.log("🤖 upgradeEnemyTeam() INICIADA");
    console.log(`🤖 enemyHealth: ${enemyHealth}, fase: ${fase}, enemyGold: ${enemyGold}, enemyLevel: ${enemyLevel}`);

    if (enemyCombatiendo || enemyHealth <= 0) return;

    window._rivalPensandoMostradoEstaRonda = false;
    window._rivalYaSustituyoEstaRonda = false;
    window._rivalYaRerolleoEstaRonda = false;

    if (!enemyEstrategia) {
        enemyElegirEstrategia();
    }
    if (!enemyEstrategia) {
        enemyEstrategia = elegirEstrategiaAleatoria();
    }

    console.log(`🤖 Estrategia: ${enemyEstrategia.nombre} | Estilo: ${enemyEstiloActual}`);

        enemyLimpiarDuplicadosBanquillo();

    // 🆕 FIX: NO vender antes de comprar. Antes la IA vendía 2 veces
    // al empezar la ronda y se deshacía de las copias que necesitaba
    // para fusionar. Ahora solo vende si el banquillo está lleno,
    // y se hace después de comprar (ver más abajo).
    const banquilloLleno = enemyBanquillo.filter(u => u !== null).length >= CONFIG.BANQUILLO_MAXIMO;
    if (banquilloLleno) {
        enemyDecidirQueVender();
    }

        if (fase <= 2) {
        addConsoleMessage(`🤖 ${rivalNombre()}: sin ingresos en ronda ${fase}`, 'enemy');
        // 🆕 FIX: en ronda 2 el rival NO debe gastar oro en rerolls ni refuerzos.
        // Solo compra 1 Pokémon (igual que el jugador) y se queda con el resto.
    } else {
        let ingresoBase = 5;
        let interesEnemigo = Math.min(3, Math.floor(enemyGold / 10));
        let rachaBonusEnemigo = 0;
        if (enemyWinStreak >= 5) rachaBonusEnemigo = 3;
        else if (enemyWinStreak >= 3) rachaBonusEnemigo = 2;
        else if (enemyWinStreak >= 2) rachaBonusEnemigo = 1;
        else if (enemyLossStreak >= 4) rachaBonusEnemigo = 2;
        else if (enemyLossStreak >= 2) rachaBonusEnemigo = 1;

        let nivelBonus = Math.max(0, nivelJugador - enemyLevel) * 2;

        let bonusEstilo = 0;
        if (enemyEstiloActual === "economico") bonusEstilo = 1;
        else if (enemyEstiloActual === "agresivo") bonusEstilo = -1;

        let ingresoTotal = ingresoBase + interesEnemigo + rachaBonusEnemigo + nivelBonus + bonusEstilo;

        addConsoleMessage(`🤖 ${rivalNombre()}: +${ingresoTotal}💰`, 'enemy');
        enemyGold += ingresoTotal;
    }

            if (debeAparecerTiendaObjetos(ronda) && enemyObjetosEnTienda.length > 0) {
        enemyComprarObjetoExperto();
    }

    // 🆕 FIX: equipar objetos DESPUÉS de comprar (no antes), para que
    //    el objeto recién comprado se equipe en la misma ronda.
    if (typeof enemyEquiparObjetos === 'function') {
        enemyEquiparObjetos();
    }

    let nivelCoste = CONFIG.COSTES_NIVEL[enemyLevel - 1] || 4;
    let unidadesEnTablero = enemyBoard.filter(u => u !== null).length;
    let maxUnits = (typeof TABLA_MAX_UNIDADES !== 'undefined')
        ? (TABLA_MAX_UNIDADES[enemyLevel] || 1)
        : Math.min(enemyLevel, 6);
    let unidadesEnBanquillo = enemyBanquillo.filter(u => u !== null).length;

    if (fase === 2 && enemyLevel < 2) {
        enemyLevel = 2;
        addConsoleMessage(`🎭 ${rivalNombre()} sube a NIVEL 2 (gratis en ronda 2)`, 'enemy');
        actualizarInfoEnemigo();
        if (!enemyTiendaBloqueada) generarTiendaEnemigo();
    }

        // 🆕 FIX v2: el rival activo TAMBIÉN paga por subir de nivel.
    // Usa la misma economía que avanzarRivalUnTurno (torneo.js):
    //   - Coste exacto de CONFIG.COSTES_NIVEL.
    //   - Solo sube si tiene equipo completo (4+ unidades) o va muy justo de nivel.
    //   - Nunca sube gratis por estilo "late-game".
    {
        const nivelMaxRival = (typeof CONFIG !== 'undefined' && CONFIG.NIVEL_MAXIMO) ? CONFIG.NIVEL_MAXIMO : 8;
        let guardiaSubidaActivo = 0;

        while (guardiaSubidaActivo < 3 && enemyLevel < nivelMaxRival) {
            guardiaSubidaActivo++;

            const costeSubida = (typeof _costeSubirNivelRival === 'function')
                ? _costeSubirNivelRival(enemyLevel)
                : (CONFIG.COSTES_NIVEL[enemyLevel - 1] || 0);

            if (costeSubida <= 0) break;
            if (enemyGold < costeSubida) break;

            // 🆕 FIX: "equipo completo" = tablero LLENO (maxUnits), no 4 unidades totales.
// Así el rival con tablero a medias NO sube (le falta llenar el tablero).
const vivosEnTableroActivo = enemyBoard.filter(u => u && !u.esZacian).length;
const maxUnitsActivo = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[enemyLevel])
    ? TABLA_MAX_UNIDADES[enemyLevel]
    : 3;
const equipoCompleto = vivosEnTableroActivo >= maxUnitsActivo;

            // O si está en ronda >= 6 y le sobra oro suficiente (ahorro)
            const puedeAhorrar = fase >= 6 && enemyGold >= costeSubida + 10;

            // O si va muy retrasado de nivel respecto a la ronda
            const nivelEsperado = Math.min(nivelMaxRival, Math.floor(fase / 3) + 1);
            const vaRetrasado = enemyLevel < nivelEsperado;

            if (!equipoCompleto && !puedeAhorrar && !vaRetrasado) break;

            enemyGold -= costeSubida;
            enemyLevel++;
            addConsoleMessage(`🎭 ${rivalNombre()} sube a NIVEL ${enemyLevel} (-${costeSubida}💰)`, 'enemy');
            actualizarInfoEnemigo();
            if (!enemyTiendaBloqueada) generarTiendaEnemigo();

            // 🆕 Disco Definitivo al llegar a 5 u 8 (solo si hay 2★)
            if (enemyLevel === 5 || enemyLevel === 8) {
                const tieneAlguna2Estrellas = [...enemyBoard, ...enemyBanquillo]
                    .some(u => u && !u.esZacian && !u.esArticuno && u.nivel >= 2);

                if (typeof enemyBaulObjetos === 'undefined') enemyBaulObjetos = [];

                if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) {
                    const idxGenerico = enemyBaulObjetos.findIndex(nombre => {
                        const obj = OBJETOS[nombre];
                        if (!obj) return false;
                        if (obj.efecto && obj.efecto.esDiscoUlti) return false;
                        if (obj.efecto && obj.efecto.tipoBonus && enemyEstrategia && enemyEstrategia.tipos.includes(obj.efecto.tipoBonus)) return false;
                        return true;
                    });
                    if (idxGenerico !== -1) {
                        enemyBaulObjetos.splice(idxGenerico, 1);
                    }
                }

                const _maxD2 = (typeof maxDiscosPorNivelEquipo === 'function') ? maxDiscosPorNivelEquipo(enemyLevel) : (enemyLevel >= 8 ? 2 : 1);
                const _cntD2 = ((typeof contarDiscosEnUnidades === 'function') ? contarDiscosEnUnidades([...enemyBoard, ...enemyBanquillo]) : 0)
                    + enemyBaulObjetos.filter(o => o === "Disco Definitivo").length;
                if (tieneAlguna2Estrellas
                    && _cntD2 < _maxD2
                    && !enemyBaulObjetos.includes("Disco Definitivo")
                    && enemyBaulObjetos.length < CONFIG.MAX_BAUL) {
                    enemyBaulObjetos.push("Disco Definitivo");
                    addConsoleMessage(`💿 ${rivalNombre()} consiguió un DISCO DEFINITIVO! (Nivel ${enemyLevel})`, 'enemy');
                }
            }
        }
    }

            // 🆕 FIX v2: ELIMINADA la subida por oro sobrante.
    // El rival ya no sube de nivel solo por tener 50+💰.
    // La subida la controla el bloque de arriba (con equipo completo
    // o ahorro), y el resto del oro se gasta en comprar/rerollear.

    let infoCoste = calcularCosteObjetivoRival();
    let urgenciaSubir = calcularNecesidadDeSubirNivel();
    let tieneClave = rivalTienePokemonClave();

    console.log(`   📊 Rival busca coste ${infoCoste.costeMedio.toFixed(1)} (min: ${infoCoste.costeBajo}, max: ${infoCoste.costeAlto})`);
    console.log(`   📊 Nivel mínimo recomendado: ${infoCoste.nivelMinimo}`);
    console.log(`   📊 Tiene clave: ${tieneClave.tieneClave ? 'SÍ' : 'NO'} | Coste bajo: ${tieneClave.tieneCosteBajo}`);
    console.log(`   📊 Urgencia subir nivel: ${urgenciaSubir}`);

    let condicionesSubir = 0;
    if (unidadesEnTablero >= maxUnits) condicionesSubir++;
    if (unidadesEnBanquillo >= 3) condicionesSubir++;
    if (enemyWinStreak >= 2) condicionesSubir++;
    if (enemyGold >= nivelCoste + 10) condicionesSubir++;
    if (unidadesEnBanquillo >= 4 && enemyLevel < 6) condicionesSubir += 2;
    if (unidadesEnBanquillo >= 3 && unidadesEnTablero < maxUnits - 1) condicionesSubir += 2;

    if (fase >= 3 && enemyLevel < 3) condicionesSubir += 2;
    if (fase >= 6 && enemyLevel < 4) condicionesSubir += 2;
    if (fase >= 10 && enemyLevel < 5) condicionesSubir += 2;

    condicionesSubir += Math.floor(urgenciaSubir / 2);

    if (enemyEstiloActual === "agresivo") condicionesSubir += 2;
    else if (enemyEstiloActual === "economico") condicionesSubir -= 1;

    let quiereSubirNivel = false;
    if (enemyLevel < infoCoste.nivelMinimo && !tieneClave.tieneClave && fase >= 3) {
        quiereSubirNivel = true;
        console.log(`   🔥 ${rivalNombre()} QUIERE subir a nivel ${infoCoste.nivelMinimo}`);
    }

        // 🆕 FIX v2: la subida de nivel del rival activo YA NO es gratis.
    // Este bloque solo decide SI merece la pena subir (urgencia),
    // pero el pago lo hace el bloque de arriba (CAMBIO 1).
    // Aquí solo forzamos una subida extra si la urgencia es MUY alta
    // y aún no ha subido en el bloque de arriba.
    if (fase > 2 && enemyLevel < CONFIG.NIVEL_MAXIMO) {
        const nivelEsperadoRonda = Math.min(CONFIG.NIVEL_MAXIMO, Math.floor(fase / 3) + 1);
        const vaMuyRetrasado = enemyLevel < nivelEsperadoRonda - 1;

        // Solo forzamos subida si:
        //   - Va muy retrasado de nivel (2+ niveles por debajo de la ronda)
        //   - Y tiene equipo completo (4+ unidades)
        //   - Y le sobra oro después de pagar
        // 🆕 FIX: "equipo completo" = tablero LLENO (maxUnits), no 4 unidades totales.
const vivosEnTableroActivo = enemyBoard.filter(u => u && !u.esZacian).length;
const maxUnitsActivo = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[enemyLevel])
    ? TABLA_MAX_UNIDADES[enemyLevel]
    : 3;
const equipoCompleto = vivosEnTableroActivo >= maxUnitsActivo;
        const costeSubida = (typeof _costeSubirNivelRival === 'function')
            ? _costeSubirNivelRival(enemyLevel)
            : (CONFIG.COSTES_NIVEL[enemyLevel - 1] || 0);

        if (vaMuyRetrasado && equipoCompleto && costeSubida > 0
            && enemyGold >= costeSubida + 10) {
            enemyGold -= costeSubida;
            enemyLevel++;
            addConsoleMessage(`🎭 ${rivalNombre()} sube a NIVEL ${enemyLevel} (-${costeSubida}💰, iba retrasado)`, 'enemy');
            actualizarInfoEnemigo();
            if (!enemyTiendaBloqueada) generarTiendaEnemigo();
            enemyPosicionarUnidadesInteligente();

            if (enemyLevel === 5 || enemyLevel === 8) {
                if (typeof enemyBaulObjetos === 'undefined') enemyBaulObjetos = [];

                if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) {
                    const idxGenerico = enemyBaulObjetos.findIndex(nombre => {
                        const obj = OBJETOS[nombre];
                        if (!obj) return false;
                        if (obj.efecto && obj.efecto.esDiscoUlti) return false;
                        if (obj.efecto && obj.efecto.tipoBonus && enemyEstrategia && enemyEstrategia.tipos.includes(obj.efecto.tipoBonus)) return false;
                        return true;
                    });
                    if (idxGenerico !== -1) {
                        enemyBaulObjetos.splice(idxGenerico, 1);
                    }
                }

                const tieneAlguna2Estrellas = [...enemyBoard, ...enemyBanquillo]
                    .some(u => u && !u.esZacian && !u.esArticuno && u.nivel >= 2);

                const _maxD3 = (typeof maxDiscosPorNivelEquipo === 'function') ? maxDiscosPorNivelEquipo(enemyLevel) : (enemyLevel >= 8 ? 2 : 1);
                const _cntD3 = ((typeof contarDiscosEnUnidades === 'function') ? contarDiscosEnUnidades([...enemyBoard, ...enemyBanquillo]) : 0)
                    + enemyBaulObjetos.filter(o => o === "Disco Definitivo").length;
                if (tieneAlguna2Estrellas
                    && _cntD3 < _maxD3
                    && enemyBaulObjetos.length < CONFIG.MAX_BAUL
                    && !enemyBaulObjetos.includes("Disco Definitivo")) {
                    enemyBaulObjetos.push("Disco Definitivo");
                    addConsoleMessage(`💿 ${rivalNombre()} consiguió un DISCO DEFINITIVO! (Nivel ${enemyLevel})`, 'enemy');
                }
            }
        }
    }

        enemyDecidirQueVender();

    // 🆕 FIX: en ronda 2, forzar 1 compra para que cada rival tenga 2 Pokémon
    if (fase === 2 && !window.enemyComproEnRonda2) {
        console.log(`   🎯 ${rivalNombre()}: forzando compra en ronda 2...`);
        const comproForzado = await enemyComprarExperto();
        if (comproForzado) {
            console.log(`   ✅ ${rivalNombre()}: compró en ronda 2 (oro restante: ${enemyGold})`);
        } else {
            console.log(`   ⚠️ ${rivalNombre()}: no pudo comprar en ronda 2 (tienda vacía o sin oro)`);
        }
    }

// 🆕 FIX: comprobar fusiones ANTES de comprar por si ya tiene 3 copias.
    if (typeof enemyVerificarTodasLasFusiones === 'function') {
        enemyVerificarTodasLasFusiones();
    }

            // 🆕 FIX v2: el rival activo SIEMPRE guarda 10💰 de reserva.
    //   - Con 10-19💰: NO gasta (ahorra para subir de nivel).
    //   - Con 20-29💰: gasta 1 compra por turno (moderado).
    //   - Con 30+💰: gasta agresivamente (hasta maxCompras).
    const RESERVA_MINIMA_ACTIVO = 10;

    let comprasConsecutivas = 0;
    let maxCompras = 30;
    if (fase <= 2) maxCompras = 1;
    else if (enemyEstiloActual === "economico") maxCompras = 15;

    // Umbral de compras según cuánto oro tenga por encima de la reserva
    function _umbralComprasActivo() {
        const oroDisponible = enemyGold - RESERVA_MINIMA_ACTIVO;
        if (oroDisponible <= 0) return 0;
        if (oroDisponible < 10) return 0;               // 10-19 total → no compra
        if (oroDisponible < 20) return 1;               // 20-29 total → 1 compra
        return maxCompras;                              // 30+ total → agresivo
    }

    let totalUnidades = unidadesEnTablero + unidadesEnBanquillo;

    while (comprasConsecutivas < _umbralComprasActivo() && enemyGold >= 3 && totalUnidades < 14) {
        // 🆕 FIX: excepción para fusiones (siempre merecen la pena)
        const hayFusionPendiente = (() => {
            const todas = [...enemyBoard, ...enemyBanquillo];
            for (let u of todas) {
                if (!u || u.esZacian) continue;
                if (u.nivel !== 1) continue;
                let copias = 0;
                for (let v of todas) {
                    if (v && !v.esZacian && v.pokemon.nombre === u.pokemon.nombre && v.nivel === 1) copias++;
                }
                if (copias === 2) return true;
            }
            return false;
        })();

        // Si no hay fusión pendiente y no puede gastar según el umbral, parar
        if (!hayFusionPendiente && comprasConsecutivas >= _umbralComprasActivo()) break;
        if (hayFusionPendiente && (enemyGold - RESERVA_MINIMA_ACTIVO) < 1) break;

        let compro = await enemyComprarExperto();
        if (compro) {
            comprasConsecutivas++;
            totalUnidades = enemyBoard.filter(u => u !== null).length + enemyBanquillo.filter(u => u !== null).length;
            await new Promise(r => setTimeout(r, 30));
            enemyMoverMejoresAlTablero();
            enemyVerificarTodasLasFusiones();
        } else {
            break;
        }
    }

    await enemyIntentarRerolls();
    window._rivalYaRerolleoEstaRonda = true;

            enemyEquiparObjetos();
    enemyMoverMejoresAlTablero();

        // 🆕 FIX: comprobar fusiones ANTES de intentar sustituir.
    // Si tiene 3 copias en el banquillo, fusionarlas antes de
    // que intentarSustituir se lleve la unidad al tablero o la venda.
    if (typeof enemyVerificarTodasLasFusiones === 'function') {
        enemyVerificarTodasLasFusiones();
    }

    intentarSustituirUnidadMalaDelTablero(Math.min(enemyLevel, 6));

    enemyPosicionarUnidadesInteligente();
    enemyVerificarTodasLasFusiones();

    enemyDecidirQueVender();
    enemyLimpiarDuplicadosBanquillo();

    enemyMoverMejoresAlTablero();

    // 🆕 FIX: volver a equipar objetos al final. Si en algún paso de arriba
    //    (vender, fusionar, sustituir) algún Pokémon con objeto se ha ido,
    //    su objeto ha vuelto al baúl y hay que reequiparlo en otra unidad.
    if (typeof enemyEquiparObjetos === 'function') {
        enemyEquiparObjetos();
    }

                // 🆕 FIX v2: SEGUNDA PASADA de equipado. La primera pasada puede
    // haber dejado objetos sin equipar porque:
    //   - Los Pokémon con hueco no eran compatibles (requerido).
    //   - Los objetos se compraron DESPUÉS del primer equipado.
    //   - Algunos Pokémon se movieron/vendieron y liberaron hueco.
    // Una segunda pasada recoge esos objetos huérfanos y los equipa
    // en cualquier Pokémon que aún tenga hueco.
    // 🆕 Y una TERCERA pasada para casos extremos (muchos objetos
    // acumulados + muchas fusiones en la misma ronda).
    if (typeof enemyEquiparObjetos === 'function') {
        enemyEquiparObjetos();
        enemyEquiparObjetos();
    }

        totalUnidades = enemyBoard.filter(u => u !== null).length + enemyBanquillo.filter(u => u !== null).length;
    if (fase > 2 && totalUnidades < 4 && enemyGold > 3) {
        for (let i = 0; i < 4; i++) {
            if (enemyGold > 3) {
                let compro = await enemyComprarExperto();
                if (compro) {
                    enemyMoverMejoresAlTablero();
                    enemyVerificarTodasLasFusiones();
                }
            }
        }
        enemyMoverMejoresAlTablero();
    }

        // Si aún así se queda corto (tienda vacía o sin oro), vender basura
    // y volver a intentar con lo que quede en la tienda.
    const unidadesActuales = enemyBoard.filter(u => u !== null && !u.esZacian).length
                      + enemyBanquillo.filter(u => u !== null && !u.esZacian).length;

    // 🆕 FIX: minUnidadesEsperadas no estaba definida → ReferenceError.
    // Lo calculamos aquí: el máximo de unidades que puede tener el rival
    // según su nivel (misma tabla que usa el resto del juego).
    const minUnidadesEsperadas = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[enemyLevel])
        ? TABLA_MAX_UNIDADES[enemyLevel]
        : 1;

    if (unidadesActuales < minUnidadesEsperadas && enemyGold < 3) {
        console.log(`   🆘 ${rivalNombre()}: sin oro para relleno (${enemyGold}💰). Vendiendo unidades malas...`);
        enemyDecidirQueVender();
    }

    // ============================================================
    // 🆕 FIX v24: SUBIR BANCO AL TABLERO ANTES DE GUARDAR
    // ============================================================
    // Si el tablero no está lleno y hay Pokémon en el banco,
    // subir los mejores para que el equipo guardado tenga el
    // tablero completo. Esto arregla el caso de Bruno: tenía
    // 2 en tablero + Machop en banco → debe subir Machop.
    // ============================================================
    {
        const maxSlotActivo = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[enemyLevel])
            ? TABLA_MAX_UNIDADES[enemyLevel]
            : 3;
        let vivosActivo = enemyBoard.filter(u => u && !u.esZacian).length;

        let guardiaSubida = 0;
        while (vivosActivo < maxSlotActivo && guardiaSubida < 8) {
            guardiaSubida++;

            // Elegir el mejor del banco (mayor utilidad)
            let mejorBanco = null;
            let mejorUtilidad = -Infinity;
            let mejorIndice = -1;

            for (let i = 0; i < enemyBanquillo.length; i++) {
                const u = enemyBanquillo[i];
                if (!u || u.esZacian || u.esArticuno) continue;
                const utilidad = evaluarPokemon(u.pokemon);
                if (utilidad > mejorUtilidad) {
                    mejorUtilidad = utilidad;
                    mejorBanco = u;
                    mejorIndice = i;
                }
            }

            if (!mejorBanco) break;

            // Buscar hueco en tablero
            const huecoTablero = enemyBoard.findIndex(c => c === null);
            if (huecoTablero === -1) break;

            // Mover del banco al tablero
            enemyBoard[huecoTablero] = mejorBanco;
            enemyBanquillo[mejorIndice] = null;
            vivosActivo++;

            addConsoleMessage(`📤 ${rivalNombre()}: sube ${mejorBanco.pokemon.nombre} del banco al tablero (${vivosActivo}/${maxSlotActivo})`, 'enemy');
        }

        // Reposicionar si se han movido unidades
        if (vivosActivo > 0 && typeof enemyPosicionarUnidadesInteligente === 'function') {
            enemyPosicionarUnidadesInteligente();
        }
    }

            // 🆕 FIX: guardar el equipo del rival para que el Modo Espía lo muestre
    // y sincronizar nivel, oro, vida y racha en el ranking.
    if (window.rivalActual) {
        const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
        if (rivalEnTorneo) {
            rivalEnTorneo._equipoGuardado = {
                tablero: enemyBoard.map(u => u),
                banquillo: enemyBanquillo.map(u => u)
            };
            rivalEnTorneo.nivel = enemyLevel;
            rivalEnTorneo.oro = enemyGold;
            rivalEnTorneo.vida = enemyHealth;
            rivalEnTorneo.racha = (enemyWinStreak || 0) - (enemyLossStreak || 0);
            rivalEnTorneo.eliminado = enemyHealth <= 0;
            console.log(`💾 Equipo guardado para ${rivalEnTorneo.nombre} (${enemyBoard.filter(u => u).length} en tablero, nivel ${enemyLevel}, HP ${enemyHealth})`);
        }
    }

        // 🆕 FIX RONDA 2: garantizar que el rival tenga AL MENOS 2 unidades
    // en el tablero, igual que el jugador. Si compró 1 Pokémon pero lo
    // dejó en el banquillo, lo subimos al tablero.
    if (fase === 2) {
        const maxTab2 = (typeof TABLA_MAX_UNIDADES !== 'undefined' && TABLA_MAX_UNIDADES[enemyLevel])
            ? TABLA_MAX_UNIDADES[enemyLevel]
            : (enemyLevel >= 2 ? 2 : 1);

        let unidadesEnTablero = enemyBoard.filter(u => u !== null && !u.esZacian).length;

        // 1) Si hay unidades en el banquillo, subirlas al tablero hasta llegar a 2
        while (unidadesEnTablero < Math.min(2, maxTab2)) {
            const idxBanco = enemyBanquillo.findIndex(u => u !== null && !u.esZacian);
            if (idxBanco === -1) break;

            const idxTablero = enemyBoard.findIndex(c => c === null);
            if (idxTablero === -1) break;

            enemyBoard[idxTablero] = enemyBanquillo[idxBanco];
            enemyBanquillo[idxBanco] = null;
            unidadesEnTablero++;
            console.log(`🎯 [Ronda 2] ${enemyBoard[idxTablero].pokemon.nombre} subido del banquillo al tablero (forzado)`);
        }

        // 2) Si aún así hay menos de 2 en el tablero (porque no compró),
        // forzar una compra directa de lo primero que haya en la tienda.
        if (unidadesEnTablero < Math.min(2, maxTab2) && enemyTienda && enemyTienda.length > 0) {
            for (let p of enemyTienda) {
                if (!p) continue;
                if (enemyGold < p.coste) continue;
                if (typeof consumirDelPool !== 'function' || !consumirDelPool(p.id)) continue;

                const nueva = new Unidad(p, 1, p.id, p.coste);
                nueva.equipo = 'enemy';

                const idxTablero = enemyBoard.findIndex(c => c === null);
                if (idxTablero === -1) {
                    if (typeof devolverAlPool === 'function') devolverAlPool(p.id);
                    continue;
                }

                enemyBoard[idxTablero] = nueva;
                enemyGold -= p.coste;
                const idxT = enemyTienda.indexOf(p);
                if (idxT !== -1) enemyTienda.splice(idxT, 1);
                unidadesEnTablero++;

                addConsoleMessage(`🎯 ${rivalNombre()} compró ${p.nombre} en ronda 2 (forzado, ${enemyGold}💰 restantes)`, 'enemy');
                console.log(`🎯 [Ronda 2] ${p.nombre} comprado y colocado en tablero (forzado)`);

                if (unidadesEnTablero >= Math.min(2, maxTab2)) break;
            }
        }

        console.log(`🎯 [Ronda 2] Rival termina con ${unidadesEnTablero} unidad(es) en el tablero (máx ${maxTab2})`);
    }

    aplicarSinergiasEnemigo();
    actualizarInfoEnemigo();
    renderizar();
    if (!enemyTiendaBloqueada && enemyPrimerCombateRealizado) generarTiendaEnemigo();

    let unidadesFinales = enemyBoard.filter(u => u !== null).length;
    let estrellas = { 1: 0, 2: 0, 3: 0 };
    let nombres3Estrellas = [];
    for (let u of enemyBoard) {
        if (u) {
            if (u.nivel === 1) estrellas[1]++;
            else if (u.nivel === 2) estrellas[2]++;
            else if (u.nivel === 3) { estrellas[3]++; nombres3Estrellas.push(u.pokemon.nombre); }
        }
    }
    for (let u of enemyBanquillo) {
        if (u) {
            if (u.nivel === 1) estrellas[1]++;
            else if (u.nivel === 2) estrellas[2]++;
            else if (u.nivel === 3) { estrellas[3]++; nombres3Estrellas.push(u.pokemon.nombre); }
        }
    }

    let conteoFront = contarFrontlineEnEquipo();
    let conteoBack = contarBacklineEnEquipo();

        // 🆕 FIX v24: separar tablero y banco en el log para no confundir
    const tableroCount = enemyBoard.filter(u => u !== null && !u.esZacian).length;
    const bancoCount = enemyBanquillo.filter(u => u !== null && !u.esZacian).length;
            const tableroCountActivo = enemyBoard.filter(u => u !== null && !u.esZacian).length;
    const bancoCountActivo = enemyBanquillo.filter(u => u !== null && !u.esZacian).length;
    let mensaje = `🎭 ${rivalNombre()}: TABLERO ${tableroCountActivo} · BANCO ${bancoCountActivo} | Nivel ${enemyLevel} | 💰${enemyGold} | Estrategia: ${enemyEstrategia.nombre} | Estilo: ${enemyEstiloActual} | Front: ${conteoFront} | Back: ${conteoBack}`;
    if (estrellas[3] > 0) mensaje += ` | ⭐⭐⭐ ${estrellas[3]}×3★`;
    else if (estrellas[2] > 0) mensaje += ` | ⭐⭐ ${estrellas[2]}×2★`;
    else mensaje += ` | ⭐ ${estrellas[1]}×1★`;

    addConsoleMessage(mensaje, 'enemy');

    if (estrellas[3] > 0) {
        mostrarFlash3EstrellasEnemigo(nombres3Estrellas);
    }

    console.log(`✅ upgradeEnemyTeam() FINALIZADA | enemyGold=${enemyGold}, enemyLevel=${enemyLevel}`);
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================
window.upgradeEnemyTeam = upgradeEnemyTeam;
window.enemyElegirEstrategia = enemyElegirEstrategia;
window.enemyPosicionarUnidadesInteligente = enemyPosicionarUnidadesInteligente;
window.enemyComprarExperto = enemyComprarExperto;
window.enemyEquiparObjetos = enemyEquiparObjetos;
window.enemyVerificarTodasLasFusiones = enemyVerificarTodasLasFusiones;
window.enemyMoverMejoresAlTablero = enemyMoverMejoresAlTablero;
window.enemyDecidirQueVender = enemyDecidirQueVender;
window.enemyLimpiarDuplicadosBanquillo = enemyLimpiarDuplicadosBanquillo;
window.intentarSustituirUnidadMalaDelTablero = intentarSustituirUnidadMalaDelTablero;
window.contarFrontlineEnEquipo = contarFrontlineEnEquipo;
window.contarBacklineEnEquipo = contarBacklineEnEquipo;
window.esPokemonFrontlineEnemigo = esPokemonFrontlineEnemigo;
window.mostrarFlash3EstrellasEnemigo = mostrarFlash3EstrellasEnemigo;
window.elegirEstrategiaAleatoria = elegirEstrategiaAleatoria;
window.calcularCosteObjetivoRival = calcularCosteObjetivoRival;
window.rivalTienePokemonClave = rivalTienePokemonClave;
window.calcularNecesidadDeSubirNivel = calcularNecesidadDeSubirNivel;
window.rivalNombre = rivalNombre;
window.getFamiliaEvolutivaEnemigo = getFamiliaEvolutivaEnemigo;
window.elegirPokemonInicialEnemigo = elegirPokemonInicialEnemigo;
window._enemyPokemonEn3Estrellas = _enemyPokemonEn3Estrellas;
window._enemyPokemonBloqueadoPor3Estrellas = _enemyPokemonBloqueadoPor3Estrellas;
window._enemyPokemonBloqueadoPor2Estrellas = _enemyPokemonBloqueadoPor2Estrellas;
window._esPokemonClave = _esPokemonClave;
window._tieneObjetoClave = _tieneObjetoClave;
window._esIntocableEnTablero = _esIntocableEnTablero;
window._esBaseDeFusionPendiente = _esBaseDeFusionPendiente;

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

window.enemyComprarObjetoGarantizado = enemyComprarObjetoGarantizado;


window.enemyIntentarRerolls = enemyIntentarRerolls;
window.enemyEvaluarSiMereceReroll = enemyEvaluarSiMereceReroll;
window.enemyCalcularReservaMinimaReroll = enemyCalcularReservaMinimaReroll;
