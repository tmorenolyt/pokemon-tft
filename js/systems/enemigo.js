// ============================================================
// SISTEMA DE IA ENEMIGA - VERSIÓN HORIZONTAL 4×5
// ============================================================
// ⚠️ La IA está dividida por responsabilidades en js/systems/enemigo/:
//   · evaluacion.js → estrategia, evaluación de Pokémon y ventas
//   · tablero.js    → mover/colocar unidades
//   · objetos.js    → equipar y comprar objetos
//   · compras.js    → compras, fusiones, rerolls y limpieza de banco
// Este archivo conserva el estado compartido, upgradeEnemyTeam() y los exports.
// Los módulos se cargan ANTES que este archivo (ver index.html).
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


// ============================================================
// HELPERS: ¿Es frontline o backline?
// ============================================================


// ============================================================
// CONTAR FAMILIAS DE UN TIPO/CLASE
// ============================================================


// ============================================================
// ¿LE FALTA POCO PARA ACTIVAR SINERGIA?
// ============================================================


// ============================================================
// COSTE OBJETIVO DEL RIVAL
// ============================================================


// ============================================================
// ¿EL RIVAL YA TIENE SUS POKÉMON CLAVE?
// ============================================================


// ============================================================
// CALCULAR URGENCIA DE SUBIR NIVEL
// ============================================================


// ============================================================
// ELEGIR ESTRATEGIA BASADA EN EL RIVAL ASIGNADO
// ============================================================


// ============================================================
// ELEGIR POKÉMON INICIAL PARA EL ENEMIGO
// ============================================================


// ============================================================
// ¿ES ÚTIL EL POKÉMON?
// ============================================================


// ============================================================
// CALCULAR BONUS POR SINERGIA DE TIPO
// ============================================================


// ============================================================
// EVALUAR POKÉMON
// ============================================================


// ============================================================
// DECIDIR QUÉ VENDER
// ============================================================


// ============================================================
// 🧠 INTENTAR SUSTITUIR UNA UNIDAD MALA DEL TABLERO
// ============================================================
// 🆕 FIX v23 #29: ya NO se descarta a los que encajan con la
// estrategia. Antes había un `continue` que excluía a Phantump
// (Auxiliar) y Pikachu (At. Especial). Ahora se evalúan todos.
// ============================================================


window.intentarSustituirUnidadMalaDelTablero = intentarSustituirUnidadMalaDelTablero;

// ============================================================
// MOVER MEJORES AL TABLERO
// ============================================================


// ============================================================
// POSICIONAR UNIDADES INTELIGENTEMENTE
// ============================================================


// ============================================================
// EQUIPAR OBJETOS
// ============================================================


// ============================================================
// COMPRAR OBJETOS
// ============================================================


// ============================================================
// VERIFICAR FUSIONES DEL ENEMIGO
// ============================================================


// ============================================================
// COMPRAR POKÉMON
// ============================================================

window._comparteClaseConTipo = _comparteClaseConTipo;


// ============================================================
// 🆕 REROLL DEL ENEMIGO CON PRESUPUESTO RESERVADO
// ============================================================


window.enemyIntentarRerolls = enemyIntentarRerolls;
window.enemyEvaluarSiMereceReroll = enemyEvaluarSiMereceReroll;
window.enemyCalcularReservaMinimaReroll = enemyCalcularReservaMinimaReroll;

// ============================================================
// LIMPIAR DUPLICADOS EN BANQUILLO
// ============================================================


// ============================================================
// FLASH 3★ ENEMIGO
// ============================================================


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


window.enemyComprarObjetoGarantizado = enemyComprarObjetoGarantizado;


window.enemyIntentarRerolls = enemyIntentarRerolls;
window.enemyEvaluarSiMereceReroll = enemyEvaluarSiMereceReroll;
window.enemyCalcularReservaMinimaReroll = enemyCalcularReservaMinimaReroll;
