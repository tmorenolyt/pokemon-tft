// ============================================================
// SISTEMA DE OBJETOS - COMPLETO CON GESTIÓN DE BANQUILLO
// v3.5 - FIX: maxHp ya NO se infla al equipar/desequipar objetos.
//
//   - aplicarObjeto() YA NO toca unidad.maxHp / unidad.hp.
//     Solo suma el hpBonus a unidad.bonusHpFijo.
//   - actualizarStats() (Unidad.js) recalcula maxHp a partir
//     de bonusHpFijo. Es la ÚNICA fuente de verdad.
//   - recalcularEfectosObjetos() resetea bonusHpFijo = 0 al
//     inicio y lo reconstruye desde los objetos restantes.
//
//   Resultado:
//     · Equipas Chaleco Asalto (+800) → maxHp += 800 (vía bonusHpFijo)
//     · Desequipas → bonusHpFijo = 0 → maxHp -= 800
//     · Vuelves a equipar → maxHp += 800 (no acumula)
//
// v3.4 - NUEVO: autoDevolverObjetosAlBaul() para cuando una
//        unidad entra al banco (swap tablero ↔ banco).
// v3.3 - FIX: recalcularEfectosObjetos ahora resetea TODOS los flags
//        derivados de objetos (regenPorSegundo, escudoPorcentaje,
//        lifesteal, maldicionDaño, etc.), no solo movimientoInicial
//        y tieneDiscoUlti.
// v3.2 - FIX: recalcularEfectosObjetos resetea tieneDiscoUlti + barra ulti
// v3.1 - FIX: recalcular movimientoInicial al desequipar
// ============================================================

function aplicarObjeto(unidad, objetoNombre) {
    const objeto = OBJETOS[objetoNombre];
    if (!objeto) return false;
    
    // ============================================================
    // ===== SOLO ZACIAN NO PUEDE EQUIPAR OBJETOS MANUALMENTE =====
    // ============================================================
    if (unidad.esZacian || unidad.noEquiparObjetos) {
        addConsoleMessage(`❌ Zacian no puede equipar objetos manualmente!`, 'error');
        return false;
    }
    
         // ============================================================
    // 🎯 FASE 4: DISCO DEFINITIVO - Solo 2★ o 3★
    // ============================================================
    if (objeto.efecto && objeto.efecto.esDiscoUlti) {
        if (unidad.nivel < 2) {
            addConsoleMessage(`❌ ${unidad.pokemon.nombre} necesita ser 2★ o 3★ para equipar el Disco Definitivo`, 'error');
            return false;
        }

        // 🆕 FIX: exigir también que el EQUIPO (lado del jugador/rival)
        // esté al menos en nivel 5. Bloquea Discos en nivel 4.
        const esEnemigo = (unidad.equipo === 'enemy');
        const nivelEquipo = esEnemigo
            ? (typeof enemyLevel !== 'undefined' ? enemyLevel : 1)
            : (typeof nivelJugador !== 'undefined' ? nivelJugador : 1);

        if (nivelEquipo < 5) {
            addConsoleMessage(`❌ El Disco Definitivo requiere nivel de equipo 5+ (actual: ${nivelEquipo})`, 'error');
            return false;
        }

        // (la comprobación de "ya tiene Disco" se hace más abajo)
    }
    
    if (!unidad.objetos) unidad.objetos = [];
    
    // 🎯 3 slots: 2 objetos normales + 1 Disco Definitivo (independiente)
    const esDisco = objeto.efecto && objeto.efecto.esDiscoUlti;
    const objetosNormales = unidad.objetos.filter(o => {
        const od = OBJETOS[o];
        return !(od && od.efecto && od.efecto.esDiscoUlti);
    });
    const discosEquipados = unidad.objetos.filter(o => {
        const od = OBJETOS[o];
        return od && od.efecto && od.efecto.esDiscoUlti;
    });
    
    if (esDisco) {
        // El Disco va al 3er slot, no cuenta con los 2 normales
        if (discosEquipados.length >= 1) {
            addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene un Disco Definitivo equipado`, 'error');
            return false;
        }
    } else {
        // Objetos normales: límite 2
        if (objetosNormales.length >= 2) {
            addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene 2 objetos equipados`, 'error');
            return false;
        }
    }
    
    if (unidad.objetos.includes(objetoNombre)) {
        addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene ${objetoNombre}`, 'error');
        return false;
    }
    
    if (objeto.requerido) {
        let tieneTipo = false;
        for (let tipo of unidad.pokemon.tipos) {
            if (tipo === objeto.requerido) tieneTipo = true;
        }
        if (!tieneTipo) {
            addConsoleMessage(`❌ ${unidad.pokemon.nombre} no puede equipar ${objetoNombre} (requiere tipo ${objeto.requerido})`, 'error');
            return false;
        }
    }
    
    const efecto = objeto.efecto;
    
    // Estadísticas básicas
    if (efecto.damagePercent) unidad.bonusDamage = (unidad.bonusDamage || 1) * (1 + efecto.damagePercent);
    if (efecto.damagePercentExtra) unidad.bonusDamage = (unidad.bonusDamage || 1) * (1 + efecto.damagePercentExtra);
    if (efecto.attackPercent) unidad.bonusAttack = (unidad.bonusAttack || 1) * (1 + efecto.attackPercent);
    if (efecto.spAttackPercent) unidad.bonusSpAttack = (unidad.bonusSpAttack || 1) * (1 + efecto.spAttackPercent);
    if (efecto.attackSpeedPercent) unidad.bonusAttackSpeed = (unidad.bonusAttackSpeed || 1) * (1 + efecto.attackSpeedPercent);
    
    // Defensa
    if (efecto.defense) unidad.bonusDefense = (unidad.bonusDefense || 0) + efecto.defense;
    if (efecto.spDefense) unidad.bonusSpDefense = (unidad.bonusSpDefense || 0) + efecto.spDefense;
    
    // ============================================================
    // 🆕 FIX v3.5: HP - SOLO sumar a bonusHpFijo.
    // NO tocar maxHp/hp aquí. actualizarStats() recalcula maxHp
    // a partir de bonusHpFijo. Tocar maxHp aquí duplicaba el HP
    // (suma en aplicarObjeto + suma en actualizarStats).
    // ============================================================
    if (efecto.hpBonus) {
        unidad.bonusHpFijo = (unidad.bonusHpFijo || 0) + efecto.hpBonus;
    }
    
    // Efectos especiales
    if (efecto.lifesteal) unidad.lifesteal = (unidad.lifesteal || 0) + efecto.lifesteal;
    if (efecto.extraMoveGauge) unidad.extraMoveGauge = (unidad.extraMoveGauge || 0) + efecto.extraMoveGauge;
    if (efecto.moveDamagePercent) unidad.bonusMoveDamage = (unidad.bonusMoveDamage || 1) * (1 + efecto.moveDamagePercent);
    if (efecto.damageReduction) unidad.bonusDamageReduction = (unidad.bonusDamageReduction || 1) * (1 - efecto.damageReduction);
    if (efecto.damageReductionExtra) unidad.bonusDamageReduction = (unidad.bonusDamageReduction || 1) * (1 - efecto.damageReductionExtra);
    if (efecto.regenPercent) unidad.regenPercent = (unidad.regenPercent || 0) + efecto.regenPercent;
    
    // Guardar efectos para combate
    if (efecto.escudoPorcentaje) {
        unidad.escudoPorcentaje = efecto.escudoPorcentaje;
        unidad.escudoIntervalo = efecto.escudoIntervalo || 5;
        unidad.escudoDuracion = efecto.escudoDuracion || 3;
    }
    if (efecto.escudoAllyPorcentaje) unidad.escudoAllyPorcentaje = efecto.escudoAllyPorcentaje;
    if (efecto.cargaGolpes) {
        unidad.cargaGolpes = efecto.cargaGolpes;
        unidad.cargaDaño = efecto.cargaDaño || 0.80;
    }
    if (efecto.maldicionDaño) {
        unidad.maldicionDaño = efecto.maldicionDaño;
        unidad.maldicionCuracion = efecto.maldicionCuracion || 0.30;
        unidad.maldicionRadio = efecto.maldicionRadio || 0;
    }
    if (efecto.reduccionDañoPorHP) {
        unidad.reduccionDañoPorHP = true;
        unidad.reduccionMaxima = efecto.reduccionMaxima || 0.30;
    }
    if (efecto.reduceDefense) {
        unidad.reduceDefense = efecto.reduceDefense;
        unidad.duracionReduccion = efecto.duracionReduccion || 3;
    }
    if (efecto.reduceSpDefense) {
        unidad.reduceSpDefense = efecto.reduceSpDefense;
        unidad.duracionReduccion = efecto.duracionReduccion || 3;
    }
    if (efecto.regenPorSegundo) {
        unidad.regenPorSegundo = efecto.regenPorSegundo;
        unidad.regenIntervalo = efecto.regenIntervalo || 3;
    }
    if (efecto.expExtraDerrota) unidad.expExtraDerrota = efecto.expExtraDerrota;
    if (efecto.metronomoPorAtaque) {
        unidad.metronomoPorAtaque = efecto.metronomoPorAtaque;
        unidad.metronomoMaximo = efecto.metronomoMaximo || 20;
    }
    if (efecto.dañoPorcentajeMaxHP) {
        unidad.dañoPorcentajeMaxHP = efecto.dañoPorcentajeMaxHP;
        unidad.dañoMaxHPIntervalo = efecto.dañoMaxHPIntervalo || 0.3;
    }
    
    // 🔴 FIX v3.1: Garra Rápida - activar movimientoInicial
    if (efecto.movimientoInicial) unidad.movimientoInicial = true;
    
    if (efecto.iraDaño) {
        unidad.iraDaño = efecto.iraDaño;
        unidad.iraVelocidad = efecto.iraVelocidad || 0.20;
    }
    if (efecto.comboAtaques) {
        unidad.comboAtaques = efecto.comboAtaques;
        unidad.comboVelocidad = efecto.comboVelocidad || 0.50;
        unidad.comboDuracion = efecto.comboDuracion || 6;
    }
    if (efecto.velocidadVsEscudo) unidad.velocidadVsEscudo = efecto.velocidadVsEscudo;
    if (efecto.curacionEscudoBonus) unidad.curacionEscudoBonus = efecto.curacionEscudoBonus;
    if (efecto.dañoReflejo) {
        unidad.dañoReflejo = efecto.dañoReflejo;
        unidad.reflejoIntervalo = efecto.reflejoIntervalo || 1;
    }
    if (efecto.invulnerablePorcentaje) {
        unidad.invulnerablePorcentaje = efecto.invulnerablePorcentaje;
        unidad.invulnerableDuracion = efecto.invulnerableDuracion || 2.5;
    }
    if (efecto.debilidadStack) {
        unidad.debilidadStack = efecto.debilidadStack;
        unidad.debilidadMaxStacks = efecto.debilidadMaxStacks || 5;
        unidad.debilidadDuracion = efecto.debilidadDuracion || 4;
    }
    if (efecto.inmuneImpedimentos) unidad.inmuneImpedimentos = true;
    if (efecto.monedaExtra) unidad.monedaExtra = efecto.monedaExtra;
    
    if (efecto.tipoBonus) {
        unidad.tieneChip = true;
        unidad.bonusTipo = efecto.tipoBonus;
        unidad.bonusTipoExtra = efecto.bonusExtra || 1;
    }
    
    unidad.objetos.push(objetoNombre);
    
    // 🔴 FIX v3.2: recalcular TODOS los flags derivados de objetos
    // (movimientoInicial, tieneDiscoUlti, regenPorSegundo, bonusHpFijo, etc.)
    recalcularEfectosObjetos(unidad);
    
    addConsoleMessage(`✅ ${objetoNombre} equipado a ${unidad.pokemon.nombre}`, 'success');
    return true;
}

// ============================================================
// ===== DEVOLVER OBJETOS AL BAÚL =====
// ============================================================

function devolverObjetosAlBaul(unidad) {
    if (!unidad || !unidad.objetos || unidad.objetos.length === 0) return false;
    
    let objetosDevueltos = 0;
    for (let obj of unidad.objetos) {
        if (baulObjetos.length < CONFIG.MAX_BAUL) {
            baulObjetos.push(obj);
            objetosDevueltos++;
        } else {
            addConsoleMessage(`⚠️ Baúl lleno! No se pudo devolver ${obj}`, 'error');
        }
    }
    unidad.objetos = [];
    unidad.actualizarStats();
    
    if (objetosDevueltos > 0) {
        addConsoleMessage(`📦 ${objetosDevueltos} objetos devueltos al baúl`, 'move');
        actualizarBadgeBaul();
    }
    return objetosDevueltos > 0;
}

// ============================================================
// ===== DEVOLVER OBJETOS AL BAÚL (VERSIÓN PARA VENDER) =====
// ============================================================

function devolverObjetosAlBaulVenta(unidad) {
    if (!unidad || !unidad.objetos || unidad.objetos.length === 0) return false;
    
    let objetosDevueltos = 0;
    for (let obj of unidad.objetos) {
        if (baulObjetos.length < CONFIG.MAX_BAUL) {
            baulObjetos.push(obj);
            objetosDevueltos++;
        } else {
            addConsoleMessage(`⚠️ Baúl lleno! No se pudo devolver ${obj}`, 'error');
        }
    }
    unidad.objetos = [];
    unidad.actualizarStats();
    
    if (objetosDevueltos > 0) {
        addConsoleMessage(`📦 ${objetosDevueltos} objetos devueltos al baúl (venta)`, 'sell');
        actualizarBadgeBaul();
    }
    return objetosDevueltos > 0;
}

// ============================================================
// 🆕 AUTO-DEVOLVER OBJETOS AL BAÚL (CUANDO ENTRA AL BANCO)
// ============================================================

function autoDevolverObjetosAlBaul(unidad, lado = 'jugador') {
    if (!unidad) return 0;
    if (unidad.esZacian || unidad.esArticuno || unidad.noEquiparObjetos) return 0;
    if (!unidad.objetos || unidad.objetos.length === 0) return 0;

    const esEnemigo = (lado === 'enemigo');
    const baul = esEnemigo
        ? (typeof enemyBaulObjetos !== 'undefined' ? enemyBaulObjetos : [])
        : baulObjetos;
    const maxBaul = (typeof CONFIG !== 'undefined' && CONFIG.MAX_BAUL) ? CONFIG.MAX_BAUL : 8;

    let devueltos = 0;
    let perdidos = 0;

    for (let obj of unidad.objetos) {
        if (baul.length < maxBaul) {
            baul.push(obj);
            devueltos++;
        } else {
            perdidos++;
        }
    }

    unidad.objetos = [];

    if (typeof recalcularEfectosObjetos === 'function') {
        recalcularEfectosObjetos(unidad);
    } else if (typeof unidad.actualizarStats === 'function') {
        unidad.actualizarStats();
    }

    if (typeof addConsoleMessage === 'function') {
        if (devueltos > 0) {
            addConsoleMessage(
                `📦 ${devueltos} objeto(s) devuelto(s) al baúl (${unidad.pokemon.nombre} → banco)`,
                'move'
            );
        }
        if (perdidos > 0) {
            addConsoleMessage(
                `⚠️ Baúl lleno, ${perdidos} objeto(s) perdido(s)`,
                'error'
            );
        }
    }

    if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul();

    if (esEnemigo) {
        if (typeof actualizarObjetosVerticalesEnemigo === 'function') {
            actualizarObjetosVerticalesEnemigo();
        }
    } else {
        if (typeof actualizarObjetosVerticales === 'function') {
            actualizarObjetosVerticales();
        }
    }

    return devueltos;
}

// ============================================================
// ===== RECALCULAR FLAGS DE OBJETOS =====
// ============================================================
// 🔴 v3.5: Al desequipar/transferir un objeto, hay que recalcular
// TODOS los flags derivados de objetos. Antes solo se reseteaban
// movimientoInicial y tieneDiscoUlti, lo que dejaba "pegados"
// efectos como regenPorSegundo (Restos), escudoPorcentaje (Chaleco
// Asalto), lifesteal (Corona Drenaje), maldicionDaño (Brazalete/
// Incienso Condena), etc.
//
// 🆕 v3.5: AÑADIDO bonusHpFijo. Se resetea a 0 al inicio y se
// reconstruye sumando hpBonus de los objetos restantes. Esto
// permite que actualizarStats() recalcule maxHp sin acumular.
//
// Los multiplicativos (bonusAttack, bonusDamage, bonusSpAttack,
// bonusHp, bonusDefense, bonusSpDefense, bonusAttackSpeed,
// bonusDamageReduction, bonusMoveDamage) NO se resetean aquí
// porque los gestiona aplicarSinergias() con su bloque
// objetosGuardados, que reconstruye todo desde cero en cada render.
// ============================================================

function recalcularEfectosObjetos(unidad) {
    if (!unidad) return;
    
    // --- Flags de "tiene X equipado" ---
    unidad.movimientoInicial = false;
    unidad.tieneDiscoUlti = false;
    unidad.reduccionDañoPorHP = false;
    unidad.inmuneImpedimentos = false;
    unidad.tieneChip = false;
    
    // 🆕 FIX v3.5: resetear bonusHpFijo para que actualizarStats()
    // no acumule HP. Se reconstruye abajo desde los objetos restantes.
    unidad.bonusHpFijo = 0;
    
    // --- Efectos con valor simple ---
    unidad.regenPorSegundo = 0;
    unidad.regenIntervalo = 3;
    unidad.regenTimer = 0;
    
    unidad.escudoPorcentaje = 0;
    unidad.escudoIntervalo = 5;
    unidad.escudoDuracion = 3;
    unidad.escudoTimer = 0;
    unidad.escudoAllyPorcentaje = 0;
    
    unidad.lifesteal = 0;
    unidad.maldicionDaño = 0;
    unidad.maldicionCuracion = 0;
    unidad.maldicionRadio = 0;
    
    unidad.cargaGolpes = 0;
    unidad.cargaDaño = 0;
    
    unidad.reduceDefense = 0;
    unidad.reduceSpDefense = 0;
    unidad.duracionReduccion = 3;
    
    unidad.expExtraDerrota = 0;
    unidad.monedaExtra = 0;
    
    unidad.metronomoPorAtaque = 0;
    unidad.metronomoMaximo = 20;
    
    unidad.dañoPorcentajeMaxHP = 0;
    unidad.dañoMaxHPIntervalo = 0.3;
    
    unidad.iraDaño = 0;
    unidad.iraVelocidad = 0;
    
    unidad.comboAtaques = 0;
    unidad.comboVelocidad = 0;
    unidad.comboDuracion = 6;
    
    unidad.velocidadVsEscudo = 0;
    unidad.curacionEscudoBonus = 0;
    
    unidad.dañoReflejo = 0;
    unidad.reflejoIntervalo = 1;
    
    unidad.invulnerablePorcentaje = 0;
    unidad.invulnerableDuracion = 2.5;
    
    unidad.debilidadStack = 0;
    unidad.debilidadMaxStacks = 5;
    unidad.debilidadDuracion = 4;
    
    unidad.bonusTipo = null;
    unidad.bonusTipoExtra = 1;
    
    // ============================================================
    // Recorrer los objetos restantes y reactivar lo que corresponda
    // ============================================================
    if (unidad.objetos && unidad.objetos.length > 0) {
        for (let objNombre of unidad.objetos) {
            const objData = OBJETOS[objNombre];
            if (!objData || !objData.efecto) continue;
            const ef = objData.efecto;
            
            // 🆕 FIX v3.5: reconstruir bonusHpFijo desde los objetos
            if (ef.hpBonus) {
                unidad.bonusHpFijo = (unidad.bonusHpFijo || 0) + ef.hpBonus;
            }
            
            if (ef.movimientoInicial) unidad.movimientoInicial = true;
            if (ef.esDiscoUlti) unidad.tieneDiscoUlti = true;
            if (ef.reduccionDañoPorHP) {
                unidad.reduccionDañoPorHP = true;
                unidad.reduccionMaxima = ef.reduccionMaxima || 0.30;
            }
            if (ef.inmuneImpedimentos) unidad.inmuneImpedimentos = true;
            if (ef.tipoBonus) {
                unidad.tieneChip = true;
                unidad.bonusTipo = ef.tipoBonus;
                unidad.bonusTipoExtra = ef.bonusExtra || 1;
            }
            
            if (ef.regenPorSegundo) {
                unidad.regenPorSegundo = ef.regenPorSegundo;
                unidad.regenIntervalo = ef.regenIntervalo || 3;
            }
            if (ef.escudoPorcentaje) {
                unidad.escudoPorcentaje = ef.escudoPorcentaje;
                unidad.escudoIntervalo = ef.escudoIntervalo || 5;
                unidad.escudoDuracion = ef.escudoDuracion || 3;
            }
            if (ef.escudoAllyPorcentaje) unidad.escudoAllyPorcentaje = ef.escudoAllyPorcentaje;
            if (ef.lifesteal) unidad.lifesteal = ef.lifesteal;
            if (ef.maldicionDaño) {
                unidad.maldicionDaño = ef.maldicionDaño;
                unidad.maldicionCuracion = ef.maldicionCuracion || 0.30;
                unidad.maldicionRadio = ef.maldicionRadio || 0;
            }
            if (ef.cargaGolpes) {
                unidad.cargaGolpes = ef.cargaGolpes;
                unidad.cargaDaño = ef.cargaDaño || 0.80;
            }
            if (ef.reduceDefense) {
                unidad.reduceDefense = ef.reduceDefense;
                unidad.duracionReduccion = ef.duracionReduccion || 3;
            }
            if (ef.reduceSpDefense) {
                unidad.reduceSpDefense = ef.reduceSpDefense;
                unidad.duracionReduccion = ef.duracionReduccion || 3;
            }
            if (ef.expExtraDerrota) unidad.expExtraDerrota = ef.expExtraDerrota;
            if (ef.monedaExtra) unidad.monedaExtra = ef.monedaExtra;
            if (ef.metronomoPorAtaque) {
                unidad.metronomoPorAtaque = ef.metronomoPorAtaque;
                unidad.metronomoMaximo = ef.metronomoMaximo || 20;
            }
            if (ef.dañoPorcentajeMaxHP) {
                unidad.dañoPorcentajeMaxHP = ef.dañoPorcentajeMaxHP;
                unidad.dañoMaxHPIntervalo = ef.dañoMaxHPIntervalo || 0.3;
            }
            if (ef.iraDaño) {
                unidad.iraDaño = ef.iraDaño;
                unidad.iraVelocidad = ef.iraVelocidad || 0.20;
            }
            if (ef.comboAtaques) {
                unidad.comboAtaques = ef.comboAtaques;
                unidad.comboVelocidad = ef.comboVelocidad || 0.50;
                unidad.comboDuracion = ef.comboDuracion || 6;
            }
            if (ef.velocidadVsEscudo) unidad.velocidadVsEscudo = ef.velocidadVsEscudo;
            if (ef.curacionEscudoBonus) unidad.curacionEscudoBonus = ef.curacionEscudoBonus;
            if (ef.dañoReflejo) {
                unidad.dañoReflejo = ef.dañoReflejo;
                unidad.reflejoIntervalo = ef.reflejoIntervalo || 1;
            }
            if (ef.invulnerablePorcentaje) {
                unidad.invulnerablePorcentaje = ef.invulnerablePorcentaje;
                unidad.invulnerableDuracion = ef.invulnerableDuracion || 2.5;
            }
            if (ef.debilidadStack) {
                unidad.debilidadStack = ef.debilidadStack;
                unidad.debilidadMaxStacks = ef.debilidadMaxStacks || 5;
                unidad.debilidadDuracion = ef.debilidadDuracion || 4;
            }
        }
    }
    
    // 🔧 Si se quedó sin Disco, resetear la barra de ulti
    if (!unidad.tieneDiscoUlti) {
        unidad.ultiCarga = 0;
        unidad.ultiLista = false;
        unidad._ultiAvisada = false;
        unidad._ultiCargadaAntesDelAtaque = false;
    }
    
    unidad.actualizarStats();
    console.log(`🔧 recalcularEfectosObjetos: ${unidad.pokemon.nombre} → movimientoInicial=${unidad.movimientoInicial}, tieneDiscoUlti=${unidad.tieneDiscoUlti}, regenPorSegundo=${unidad.regenPorSegundo}, bonusHpFijo=${unidad.bonusHpFijo}, maxHp=${unidad.maxHp}`);
}

// ============================================================
// FUNCIONES EXISTENTES
// ============================================================

function comprarObjeto(nombreObjeto) {
    if (!puedeInteractuar()) return;
    const objeto = OBJETOS[nombreObjeto];
    if (!objeto) {
        addConsoleMessage(`❌ Objeto ${nombreObjeto} no existe`, 'error');
        return;
    }
    if (objetoCompradoEstaRonda) {
        addConsoleMessage(`❌ Ya compraste un objeto en esta ronda`, 'error');
        return;
    }
    if (baulObjetos.length >= CONFIG.MAX_BAUL) {
        addConsoleMessage(`❌ Baúl de objetos lleno!`, 'error');
        return;
    }
    baulObjetos.push(nombreObjeto);
    const index = objetosEnTienda.indexOf(nombreObjeto);
    if (index !== -1) objetosEnTienda.splice(index, 1);
    objetoCompradoEstaRonda = true;
    document.getElementById('shopObjetos').style.display = 'none';
    addConsoleMessage(`🛒 Compraste ${nombreObjeto} (GRATIS) → OBJETOS`, 'buy');
    playBuySound();
    actualizarBadgeBaul();
    renderizar();
}

function desequiparObjeto(tipoUnidad, idxUnidad, indexObjeto) {
    if (!puedeInteractuar()) return;
    if (baulObjetos.length >= CONFIG.MAX_BAUL) {
        addConsoleMessage(`❌ Baúl de objetos lleno!`, 'error');
        return;
    }
    let unidad = tipoUnidad === 'tablero' ? tablero[idxUnidad] : banquillo[idxUnidad];
    if (!unidad) {
        addConsoleMessage(`❌ No hay Pokémon en esa posición`, 'error');
        return;
    }
    
    if (unidad.esZacian || unidad.noEquiparObjetos) {
        return false;
    }
    
    if (!unidad.objetos || indexObjeto >= unidad.objetos.length) {
        addConsoleMessage(`❌ Objeto no encontrado`, 'error');
        return;
    }
    const nombreObjeto = unidad.objetos[indexObjeto];
    unidad.objetos.splice(indexObjeto, 1);
    
    // 🔴 FIX v3.5: recalcular efectos de objetos (incluye maxHp vía bonusHpFijo)
    recalcularEfectosObjetos(unidad);
    
    baulObjetos.push(nombreObjeto);
    addConsoleMessage(`🔄 ${nombreObjeto} desequipado de ${unidad.pokemon.nombre} → OBJETOS`, 'move');
    aplicarSinergias();
    renderizar();
    actualizarBadgeBaul();
}

// ============================================================
// FUNCIONES PARA MANEJAR OBJETOS AL MOVER/VENDER UNIDADES
// ============================================================

function manejarObjetosAlMoverUnidad(unidadOrigen, destinoTipo) {
    if (destinoTipo === 'banquillo' && unidadOrigen && unidadOrigen.objetos && unidadOrigen.objetos.length > 0) {
        return devolverObjetosAlBaul(unidadOrigen);
    }
    return false;
}

function manejarObjetosAlVenderUnidad(unidad) {
    if (unidad && unidad.objetos && unidad.objetos.length > 0) {
        return devolverObjetosAlBaulVenta(unidad);
    }
    return false;
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.recalcularEfectosObjetos = recalcularEfectosObjetos;
window.autoDevolverObjetosAlBaul = autoDevolverObjetosAlBaul;

console.log("✅ objetos.js (systems) v3.5 cargado - FIX maxHp NO se infla");
console.log("🔧 aplicarObjeto() ya NO toca maxHp/hp. Solo suma a bonusHpFijo.");
console.log("🔧 recalcularEfectosObjetos() resetea bonusHpFijo = 0 y lo reconstruye.");
console.log("🔧 actualizarStats() (Unidad.js) recalcula maxHp desde bonusHpFijo.");
console.log("   → Equipar Chaleco Asalto: 600 → 1400");
console.log("   → Desequipar: 1400 → 600");
console.log("   → Volver a equipar: 600 → 1400 (NO 2200)");