// ============================================================
// CLASE UNIDAD - REPRESENTA UNA UNIDAD EN EL JUEGO
// + BLINDAJE CONTRA NaN EN PROPIEDADES CRÍTICAS
// + FIX: regenPerSecond (sinergia Planta) separado de regenPorSegundo (objetos)
// + FIX: actualizarStats() NUNCA pone hp = maxHp por accidente
// + FIX CRÍTICO: primera inicialización usa hp = maxHp (evita barras negras)
// + FASE 2: sistema de movimiento activo (principal/secundario)
// + FASE 4: sistema de ulti (carga, lista, disparo)
// + ✨ SHINY: +10% a HP, Ataque y Ataque Especial (solo stats base)
// ============================================================

class Unidad {
    constructor(pokemon, nivel = 1, baseId = null, costeOriginal = null) {
        this.pokemon = { ...pokemon };
        this.nivel = nivel;
        this.baseId = baseId || pokemon.id;
        this.costeOriginal = costeOriginal !== null ? costeOriginal : pokemon.coste;
        this.muerto = false;

        // ✨ SHINY: se hereda del pokemon data
        this.esShiny = pokemon.shiny === true;

        // 🔢 FIX: contador de copias consumidas (para debug de fusiones)
        this.copiasConsumidas = 1;

        // 🎯 FASE 2: sistema de movimiento activo
        this.movimientoActivo = 'principal';
        this.movSecundarioDesbloqueado = false;

        // 🎯 FASE 4: sistema de ulti
        this.ultiCarga = 0;
        this.ultiLista = false;
        this.tieneDiscoUlti = false;

        // Bonificadores base
        this.bonusDamage = 1;
        this.bonusAttack = 1;
        this.bonusSpAttack = 1;
        this.bonusHp = 1;
        this.bonusHpFijo = 0;
        this.bonusDefense = 0;
        this.bonusSpDefense = 0;
        this.bonusAttackSpeed = 1;
        this.bonusDamageReduction = 1;
        this.bonusMoveDamage = 1;

        // Estadísticas básicas
        this.lifesteal = 0;
        this.extraMoveGauge = 0;
        this.meteorShower = false;
        this.revivePoints = 0;
        this.maxHpDamage = 0;
        this.moveMaxHpDamage = 0;
        this.grassyField = false;
        this.burnDamage = 0;
        this.lastStandActive = false;
        this.hasLastStand = false;
        this.critGuaranteed = false;
        this.areaDamage = false;
        this.giantWave = false;
        this.giantWaveBoosted = false;
        this.cleanse = false;

        // Veneno
        this.poisonInfinite = false;
        this.poisonStackable = false;
        this.poisonDamageMultiplier = 1;
        this.badlyPoison = false;
        this.badlyPoisonDamage = 0;
        this.fixedDamage = false;
        this.poisonStacks = [];

        // ===== DIVIDE DOLOR =====
        this.enlaceDolor = null;
        this._maxHpOriginalEnlace = null;

        // ===== TAUNT / SEÑUELO =====
        this.taunt = null;

        // ===== INTANGIBLE (no seleccionable como objetivo) =====
        this.inmuneObjetivo = false;

        // ===== GOLPE DOBLE (Psicocorte) =====
        this._golpeDoble = false;

        // ===== GOLPE BAJO (Absol) / SILENCIO (Canto Mortal) =====
        this._golpeBajo = null;
        this._silenciadoHasta = 0;

        // ===== VIENTO HIELO =====
        this.esquirlasHielo = 0;

        // ===== LLAMA EMBRUJADA =====
        this.bolasLlamaEmbrujada = 0;

        // ===== TELETRANSPORTE / MEGA-MEWTWO X =====
        this._teletransporteAtkBonus = 1;
        this._teletransporteSpAtkBonus = 1;
        this._teletransporteVelBonus = 1;
        this._teletransporteDefBonus = 0;
        this._teletransporteSpDefBonus = 0;
        this.spriteIdAlternativo = null;

        // ===== ENERGÍA =====
        this.energy = this.pokemon.startingEnergy || 0;
        this.energyGauge = this.pokemon.energyGauge || 70;
        this.energiaLista = false;

        // Objetos
        this.objetos = [];

        // Efectos de objetos
        this.contadorGolpes = 0;
        this.contadorCombo = 0;
        this.escudoActual = 0;
        this.tiempoEscudo = 0;
        this.tiempoRegen = 0;
        this.stacksDebilidad = 0;
        this.tiempoDebilidad = 0;

        // Sinergias
        this.fearAura = false;
        this.fearAuraAttackBonus = 0;
        this.shockStacks = 0;
        this.shockStacksBonus = 0;
        this.shockDamageMultiplier = 1;
        this.frostStacks = 0;
        this.frostDamageBonus = 0;
        this.frostReduceStats = false;
        this.frozen = false;
        this.frozenTimer = 0;

        // Fantasma
        this.ghostState = false;
        this.ghostTimer = 0;
        this.ghostActivo = false;
        this.ghostPermanent = false;
        this.ghostBonuses = { attackSpeed: 0, attackPercent: 0, spAttackPercent: 0, damageReduction: 0 };
        this.ghostActivationTime = 2;
        this.ghostIntervalo = 0;

        // Psíquico
        this.moveDamageStacks = 0;
        this.moveDamageMaxStacks = 10;

        // Volador
        this.windBarrierActive = false;
        this.windBarrierTimer = 0;
        this.windGustActive = false;
        this.windGustTimer = 0;
        this.whirlwindActive = false;
        this.isVolador = this.pokemon.tipos ? this.pokemon.tipos.includes("Volador") : false;

        // Especiales
        this.esZacian = false;
        this.esArticuno = false;

        // Estadísticas de combate
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.healingDone = 0;
        this.damageBlocked = 0;
        this.equipo = 'player';
        this.tipoAtaque = 'fisico';

        // ===== REGENERACIÓN (SINERGIA PLANTA - por segundo) =====
        this.regenPerSecond = 0;
        this._regenAccumulator = 0;

        // ===== REGENERACIÓN (OBJETOS - por intervalo) =====
        this.regenPorSegundo = 0;
        this.regenIntervalo = 3;
        this.regenTimer = 0;

        // ===== ESCUDO POR OBJETOS =====
        this.escudoPorcentaje = 0;
        this.escudoIntervalo = 5;
        this.escudoDuracion = 3;
        this.escudoTimer = 0;
        this.escudoActivo = false;

        // Propiedades de objetos (inicialización)
        this.cargaGolpes = 0;
        this.cargaDaño = 0;
        this.golpesAcumulados = 0;
        this.cargaActiva = false;
        this.maldicionDaño = 0;
        this.maldicionCuracion = 0;
        this.maldicionRadio = 0;
        this.reduccionDañoPorHP = false;
        this.reduccionMaxima = 0;
        this.reduceDefense = 0;
        this.reduceSpDefense = 0;
        this.duracionReduccion = 3;
        this.reduccionTimer = 0;
        this.expExtraDerrota = 0;
        this.metronomoPorAtaque = 0;
        this.metronomoMaximo = 20;
        this.metronomoStacks = 0;
        this.dañoPorcentajeMaxHP = 0;
        this.dañoPorcentajeMaxHPObjetivo = 0;
        this.dañoMaxHPIntervalo = 0.3;
        this.movimientoInicial = false;
        this.iraDaño = 0;
        this.iraVelocidad = 0;
        this.iraActiva = false;
        this.iraAliadosCaidos = 0;
        this.comboAtaques = 0;
        this.comboVelocidad = 0;
        this.comboDuracion = 6;
        this.comboContador = 0;
        this.comboActivo = false;
        this.comboTimer = 0;
        this.velocidadVsEscudo = 0;
        this.comboVsEscudoActivo = false;
        this.curacionEscudoBonus = 0;
        this.dañoReflejo = 0;
        this.reflejoIntervalo = 1;
        this.reflejoTimer = 0;
        this.invulnerablePorcentaje = 0;
        this.invulnerableDuracion = 2.5;
        this.invulnerableActivo = false;
        this.invulnerableUsado = false;
        this.debilidadStack = 0;
        this.debilidadMaxStacks = 5;
        this.debilidadDuracion = 4;
        this.debilidadStacks = 0;
        this.debilidadTimer = 0;
        this.inmuneImpedimentos = false;
        this.monedaExtra = 0;
        this.tieneChip = false;
        this.bonusTipo = null;
        this.bonusTipoExtra = 1;
        this.focusActivo = false;

        // ===== MARCA DE INICIALIZACIÓN =====
        this._inicializado = false;

        // Inicializar estadísticas
        this.actualizarStats();

        // 🔧 FIX: marcar como inicializada
        this._inicializado = true;
    }

    // ============================================================
    // ===== SANEADOR: REPARA VALORES NaN / INVÁLIDOS =====
    // ============================================================

    _sanear() {
        if (typeof this.maxHp !== 'number' || isNaN(this.maxHp) || this.maxHp < 1) {
            const hpBase = Array.isArray(this.pokemon?.hp)
                ? (this.pokemon.hp[Math.min(this.nivel - 1, this.pokemon.hp.length - 1)] || 1000)
                : (this.pokemon?.hp || 1000);
            this.maxHp = Math.max(1, Math.floor(hpBase));
            console.warn(`🔧 Unidad._sanear(): maxHp inválido reparado para ${this.pokemon?.nombre || '???'}: ${this.maxHp}`);
        }

        if (typeof this.hp !== 'number' || isNaN(this.hp)) {
            this.hp = this.maxHp;
            console.warn(`🔧 Unidad._sanear(): hp inválido reparado para ${this.pokemon?.nombre || '???'}: ${this.hp}`);
        }

        this.hp = Math.max(0, Math.min(this.maxHp, this.hp));

        if (typeof this.ataque !== 'number' || isNaN(this.ataque) || this.ataque < 0) {
            this.ataque = 1;
        }
        if (typeof this.ataqueEspecial !== 'number' || isNaN(this.ataqueEspecial) || this.ataqueEspecial < 0) {
            this.ataqueEspecial = 1;
        }

        if (typeof this.defensa !== 'number' || isNaN(this.defensa) || this.defensa < 0) {
            this.defensa = 0;
        }
        if (typeof this.defensaEspecial !== 'number' || isNaN(this.defensaEspecial) || this.defensaEspecial < 0) {
            this.defensaEspecial = 0;
        }

        if (typeof this.velocidadAtaque !== 'number' || isNaN(this.velocidadAtaque) || this.velocidadAtaque <= 0) {
            this.velocidadAtaque = 0.7;
        }

        if (typeof this.energy !== 'number' || isNaN(this.energy)) {
            this.energy = 0;
        }
        if (typeof this.energyGauge !== 'number' || isNaN(this.energyGauge) || this.energyGauge <= 0) {
            this.energyGauge = 70;
        }

        if (typeof this.damageDealt !== 'number' || isNaN(this.damageDealt)) this.damageDealt = 0;
        if (typeof this.damageTaken !== 'number' || isNaN(this.damageTaken)) this.damageTaken = 0;
        if (typeof this.healingDone !== 'number' || isNaN(this.healingDone)) this.healingDone = 0;
        if (typeof this.damageBlocked !== 'number' || isNaN(this.damageBlocked)) this.damageBlocked = 0;

        if (typeof this.ultiCarga !== 'number' || isNaN(this.ultiCarga) || this.ultiCarga < 0) {
            this.ultiCarga = 0;
        }
        if (typeof this.ultiLista !== 'boolean') {
            this.ultiLista = false;
        }
        if (typeof this.tieneDiscoUlti !== 'boolean') {
            this.tieneDiscoUlti = false;
        }
        if (typeof this.esShiny !== 'boolean') {
            this.esShiny = false;
        }
    }

    // ============================================================
    // ===== CLONAR PARA COMBATE =====
    // ============================================================
    clonarParaCombate() {
        const copia = new Unidad(this.pokemon, this.nivel, this.baseId, this.costeOriginal);

        const excluir = new Set([
            'pokemon',
            'taunt',
            'enlaceDolor',
            '_inicializado',
        ]);

        for (let key in this) {
            if (excluir.has(key)) continue;

            const valor = this[key];

            if (Array.isArray(valor)) {
                copia[key] = valor.map(item => {
                    if (item !== null && typeof item === 'object') {
                        return { ...item };
                    }
                    return item;
                });
            }
            else if (valor !== null && typeof valor === 'object') {
                copia[key] = { ...valor };
            }
            else {
                copia[key] = valor;
            }
        }

        copia.taunt = null;
        copia.enlaceDolor = null;
        copia._inicializado = true;
        copia._sanear();

        return copia;
    }

    // ============================================================
    // ===== ACTUALIZAR ESTADÍSTICAS =====
    // ============================================================

    actualizarStats() {
        let hpStat = 0, ataqueStat = 0, spAtkStat = 0;

        if (typeof this.pokemon.hp === 'object' && !Array.isArray(this.pokemon.hp)) {
            hpStat = this.pokemon.hp[this.nivel] || Object.values(this.pokemon.hp)[0];
            ataqueStat = this.pokemon.ataque?.[this.nivel] || this.pokemon.ataque;
            spAtkStat = this.pokemon.spAttack?.[this.nivel] || this.pokemon.spAttack || ataqueStat;
        } else if (Array.isArray(this.pokemon.hp)) {
            let idx = this.nivel - 1;
            let hpArray = [...this.pokemon.hp];
            while (hpArray.length < 3) hpArray.push(hpArray[hpArray.length - 1]);
            let ataqueArray = Array.isArray(this.pokemon.ataque) ? [...this.pokemon.ataque] : [this.pokemon.ataque];
            while (ataqueArray.length < 3) ataqueArray.push(ataqueArray[ataqueArray.length - 1]);
            let spAtkArray = Array.isArray(this.pokemon.spAttack) ? [...this.pokemon.spAttack] : (this.pokemon.spAttack ? [this.pokemon.spAttack] : ataqueArray);
            while (spAtkArray.length < 3) spAtkArray.push(spAtkArray[spAtkArray.length - 1]);
            hpStat = hpArray[Math.min(idx, hpArray.length - 1)];
            ataqueStat = ataqueArray[Math.min(idx, ataqueArray.length - 1)];
            spAtkStat = spAtkArray[Math.min(idx, spAtkArray.length - 1)];
        } else {
            hpStat = this.pokemon.hp;
            ataqueStat = this.pokemon.ataque;
            spAtkStat = this.pokemon.spAttack || ataqueStat;
        }

        if (typeof hpStat !== 'number' || isNaN(hpStat) || hpStat <= 0) hpStat = 1000;
        if (typeof ataqueStat !== 'number' || isNaN(ataqueStat)) ataqueStat = 1;
        if (typeof spAtkStat !== 'number' || isNaN(spAtkStat)) spAtkStat = ataqueStat;

        let fearAttackBonus = this.fearAura ? this.fearAuraAttackBonus : 0;
        let hpBase = hpStat;
        if (typeof this.bonusHpFijo === 'number' && !isNaN(this.bonusHpFijo) && this.bonusHpFijo > 0) {
            hpBase += this.bonusHpFijo;
        }

        // ============================================================
        // ✨ SHINY: +10% a HP, Ataque y Ataque Especial (solo stats base)
        // ============================================================
        // Se aplica ANTES de bonusHp / bonusAttack / bonusSpAttack,
        // así el +10% se MULTIPLICA con sinergias y objetos.
        //
        //   statFinal = statBase × 1.10 (shiny) × bonusSinergia × bonusObjeto
        //
        // No se acumula entre renders porque siempre se lee de
        // this.pokemon (datos BASE, nunca modificados).
        // ============================================================
        const SHINY_BONUS = 1.10;
        const esShiny = this.esShiny === true;
        if (esShiny) {
            hpBase = Math.floor(hpBase * SHINY_BONUS);
            ataqueStat = Math.floor(ataqueStat * SHINY_BONUS);
            spAtkStat = Math.floor(spAtkStat * SHINY_BONUS);
        }

        let bonusHpValido = (typeof this.bonusHp === 'number' && !isNaN(this.bonusHp)) ? this.bonusHp : 1;
        const nuevoMaxHp = Math.max(1, Math.floor(hpBase * bonusHpValido));

        const yaInicializada = (this._inicializado === true);
        let hpActual = this.hp;
        const esHpInvalido = (typeof hpActual !== 'number' || isNaN(hpActual) || !isFinite(hpActual));

        if (!yaInicializada && esHpInvalido) {
            hpActual = nuevoMaxHp;
            this.maxHp = nuevoMaxHp;
            this.hp = nuevoMaxHp;
        } else if (esHpInvalido) {
            console.warn(`🔧 actualizarStats(): hp inválido en ${this.pokemon?.nombre || '???'}, tratando como 0`);
            hpActual = 0;
            this.maxHp = nuevoMaxHp;
            this.hp = 0;
        } else {
            let maxHpAnterior = this.maxHp;
            if (typeof maxHpAnterior !== 'number' || isNaN(maxHpAnterior) || maxHpAnterior <= 0) {
                maxHpAnterior = nuevoMaxHp;
            }

            if (nuevoMaxHp !== maxHpAnterior) {
                const porcentaje = hpActual / maxHpAnterior;
                const porcentajeValido = (!isNaN(porcentaje) && isFinite(porcentaje))
                    ? Math.max(0, Math.min(1, porcentaje))
                    : 1;
                this.maxHp = nuevoMaxHp;
                this.hp = Math.max(0, Math.min(nuevoMaxHp, Math.floor(nuevoMaxHp * porcentajeValido)));
            } else {
                this.maxHp = nuevoMaxHp;
                this.hp = Math.max(0, Math.min(hpActual, nuevoMaxHp));
            }
        }

        const telAtk = (typeof this._teletransporteAtkBonus === 'number' && !isNaN(this._teletransporteAtkBonus)) ? this._teletransporteAtkBonus : 1;
        const telSpAtk = (typeof this._teletransporteSpAtkBonus === 'number' && !isNaN(this._teletransporteSpAtkBonus)) ? this._teletransporteSpAtkBonus : 1;
        const telVel = (typeof this._teletransporteVelBonus === 'number' && !isNaN(this._teletransporteVelBonus)) ? this._teletransporteVelBonus : 1;
        const telDef = (typeof this._teletransporteDefBonus === 'number' && !isNaN(this._teletransporteDefBonus)) ? this._teletransporteDefBonus : 0;
        const telSpDef = (typeof this._teletransporteSpDefBonus === 'number' && !isNaN(this._teletransporteSpDefBonus)) ? this._teletransporteSpDefBonus : 0;

        const bonusAttackValido = (typeof this.bonusAttack === 'number' && !isNaN(this.bonusAttack)) ? this.bonusAttack : 1;
        const bonusSpAttackValido = (typeof this.bonusSpAttack === 'number' && !isNaN(this.bonusSpAttack)) ? this.bonusSpAttack : 1;
        const bonusDamageValido = (typeof this.bonusDamage === 'number' && !isNaN(this.bonusDamage)) ? this.bonusDamage : 1;
        const bonusAttackSpeedValido = (typeof this.bonusAttackSpeed === 'number' && !isNaN(this.bonusAttackSpeed) && this.bonusAttackSpeed > 0) ? this.bonusAttackSpeed : 1;

        const ataqueCalculado = Math.floor(ataqueStat * bonusAttackValido * bonusDamageValido * telAtk * (1 + fearAttackBonus));
        const spAtkCalculado = Math.floor(spAtkStat * bonusSpAttackValido * bonusDamageValido * telSpAtk * (1 + fearAttackBonus));

        this.ataque = (!isNaN(ataqueCalculado) && isFinite(ataqueCalculado)) ? ataqueCalculado : 1;
        this.ataqueEspecial = (!isNaN(spAtkCalculado) && isFinite(spAtkCalculado)) ? spAtkCalculado : 1;

        const defBase = (typeof this.pokemon.defense === 'number' && !isNaN(this.pokemon.defense)) ? this.pokemon.defense : 0;
        const spDefBase = (typeof (this.pokemon.spDefense || this.pokemon.defense) === 'number' && !isNaN(this.pokemon.spDefense || this.pokemon.defense))
            ? (this.pokemon.spDefense || this.pokemon.defense)
            : 0;
        const bonusDefValido = (typeof this.bonusDefense === 'number' && !isNaN(this.bonusDefense)) ? this.bonusDefense : 0;
        const bonusSpDefValido = (typeof this.bonusSpDefense === 'number' && !isNaN(this.bonusSpDefense)) ? this.bonusSpDefense : 0;

        this.defensa = Math.max(0, defBase + bonusDefValido + telDef);
        this.defensaEspecial = Math.max(0, spDefBase + bonusSpDefValido + telSpDef);

        const attackSpeedBase = (typeof this.pokemon.attackSpeed === 'number' && !isNaN(this.pokemon.attackSpeed)) ? this.pokemon.attackSpeed : 0.8;
        const velCalculada = attackSpeedBase * bonusAttackSpeedValido * telVel;
        this.velocidadAtaque = (!isNaN(velCalculada) && isFinite(velCalculada) && velCalculada > 0) ? velCalculada : 0.7;

        this.critDamage = (typeof this.pokemon.critDamage === 'number' && !isNaN(this.pokemon.critDamage)) ? this.pokemon.critDamage : 1.4;
        this.energyGauge = (typeof this.pokemon.energyGauge === 'number' && !isNaN(this.pokemon.energyGauge)) ? this.pokemon.energyGauge : 70;

        const atkTotal = this.ataque || 0;
        const spAtkTotal = this.ataqueEspecial || 0;
        this.tipoAtaque = atkTotal >= spAtkTotal ? 'fisico' : 'especial';

        if (typeof this.hp !== 'number' || isNaN(this.hp)) {
            if (!yaInicializada) {
                this.hp = (this.maxHp && this.maxHp > 0) ? this.maxHp : 0;
            } else {
                this.hp = 0;
            }
        }
        if (typeof this.maxHp !== 'number' || isNaN(this.maxHp) || this.maxHp < 1) {
            this.maxHp = nuevoMaxHp;
        }
        this.hp = Math.max(0, Math.min(this.maxHp, this.hp));
    }

    aplicarBonus(bonus) {
        if (!bonus) return;
        if (bonus.damagePercent) this.bonusDamage *= (1 + bonus.damagePercent);
        if (bonus.attackPercent) this.bonusAttack *= (1 + bonus.attackPercent);
        if (bonus.spAttackPercent) this.bonusSpAttack *= (1 + bonus.spAttackPercent);
        if (bonus.hpBonus) this.bonusHp *= (1 + bonus.hpBonus);
        if (bonus.defense) this.bonusDefense += bonus.defense;
        if (bonus.spDefense) this.bonusSpDefense += bonus.spDefense;
        if (bonus.attackSpeedPercent) this.bonusAttackSpeed *= (1 + bonus.attackSpeedPercent);
        if (bonus.damageReduction) this.bonusDamageReduction = 1 - bonus.damageReduction;
        if (bonus.lifesteal) this.lifesteal = bonus.lifesteal;
        if (bonus.extraMoveGauge) this.extraMoveGauge = bonus.extraMoveGauge;
        if (bonus.moveDamagePercent) this.bonusMoveDamage = (this.bonusMoveDamage || 1) * (1 + bonus.moveDamagePercent);
        if (bonus.meteorShower) this.meteorShower = true;
        if (bonus.regenPercent) this.regenPerSecond = bonus.regenPercent;
        if (bonus.revivePoints) this.revivePoints = bonus.revivePoints;
        if (bonus.maxHpDamage) this.maxHpDamage = bonus.maxHpDamage;
        if (bonus.moveMaxHpDamage) this.moveMaxHpDamage = bonus.moveMaxHpDamage;
        if (bonus.grassyField) this.grassyField = true;
        if (bonus.burnDamage) this.burnDamage = bonus.burnDamage;
        if (bonus.lastStand) this.hasLastStand = true;
        if (bonus.critGuaranteed) this.critGuaranteed = true;
        if (bonus.areaDamage) this.areaDamage = true;
        if (bonus.giantWave) this.giantWave = true;
        if (bonus.giantWaveBoosted) this.giantWaveBoosted = true;
        if (bonus.cleanse) this.cleanse = true;
        if (bonus.poisonInfinite) this.poisonInfinite = true;
        if (bonus.poisonStackable) this.poisonStackable = true;
        if (bonus.poisonDamageMultiplier) this.poisonDamageMultiplier = bonus.poisonDamageMultiplier;
        if (bonus.badlyPoison) this.badlyPoison = true;
        if (bonus.badlyPoisonDamage) this.badlyPoisonDamage = bonus.badlyPoisonDamage;
        if (bonus.fixedDamage) this.fixedDamage = true;
        this.actualizarStats();
    }

    entrarGhost() {
        if (this.ghostState) return;
        this.ghostState = true;
        this.ghostActivo = true;
        this.ghostTimer = 0;
        const bonus = this.ghostBonuses || { attackSpeed: 0, attackPercent: 0, spAttackPercent: 0, damageReduction: 0 };
        this.bonusAttackSpeed *= (1 + (bonus.attackSpeed || 0));
        this.bonusAttack *= (1 + (bonus.attackPercent || 0));
        this.bonusSpAttack *= (1 + (bonus.spAttackPercent || 0));
        const reduccion = (typeof bonus.damageReduction === 'number' && !isNaN(bonus.damageReduction)) ? bonus.damageReduction : 0;
        this.bonusDamageReduction *= (1 - Math.min(reduccion, 0.95));
        this.actualizarStats();
        if (!this.esZacian && !this.esArticuno) {
            if (typeof addConsoleMessage === 'function') {
                addConsoleMessage(`👻 ${this.pokemon.nombre} entra en estado FANTASMA!`, 'info');
            }
        }
    }

    salirGhost() {
        if (!this.ghostState || this.ghostPermanent) return;
        this.ghostState = false;
        this.ghostActivo = false;
        const bonus = this.ghostBonuses || { attackSpeed: 0, attackPercent: 0, spAttackPercent: 0, damageReduction: 0 };
        const divisorAS = (1 + (bonus.attackSpeed || 0));
        const divisorAtk = (1 + (bonus.attackPercent || 0));
        const divisorSpAtk = (1 + (bonus.spAttackPercent || 0));
        const divisorDR = (1 - Math.min(bonus.damageReduction || 0, 0.95));

        if (divisorAS > 0) this.bonusAttackSpeed /= divisorAS;
        if (divisorAtk > 0) this.bonusAttack /= divisorAtk;
        if (divisorSpAtk > 0) this.bonusSpAttack /= divisorSpAtk;
        if (divisorDR > 0) this.bonusDamageReduction /= divisorDR;
        this.actualizarStats();
    }

    // ============================================================
    // ===== RECIBIR DAÑO (BLINDADO CONTRA NaN) =====
    // ============================================================

    recibirDaño(cantidad, atacante = null) {
        if (typeof cantidad !== 'number' || isNaN(cantidad) || !isFinite(cantidad) || cantidad <= 0) {
            return this.hp === 0;
        }

        let dañoReal = cantidad;

        if (this.bonusDamageReduction && this.bonusDamageReduction > 0 && this.bonusDamageReduction < 1) {
            dañoReal = dañoReal * this.bonusDamageReduction;
        }

        if (this._dañoAmplificadoHasta && performance.now() < this._dañoAmplificadoHasta) {
            dañoReal = dañoReal * 1.20;
        }

        if (this.reduccionDañoPorHP && (this.hp / this.maxHp) < 0.20) {
            let reduccion = this.reduccionMaxima || 0.30;
            dañoReal = dañoReal * (1 - reduccion);
            if (!this.focusActivo) {
                this.focusActivo = true;
                if (typeof addConsoleMessage === 'function') {
                    addConsoleMessage(`🧘 ${this.pokemon.nombre} activa Cinta Focus (reducción ${reduccion*100}%)`, 'battle');
                }
            }
        }

        if (this.debilidadStack > 0 && this.debilidadStacks > 0) {
            let reduccion = this.debilidadStacks * this.debilidadStack;
            dañoReal = dañoReal * (1 - Math.min(reduccion, 0.25));
        }

        if (this.debilidadStack > 0 && this.debilidadStacks < this.debilidadMaxStacks) {
            this.debilidadStacks = Math.min(this.debilidadStacks + 1, this.debilidadMaxStacks);
            this.debilidadTimer = 0;
        }

        // ❄️ Giro Fuego de Ho-Oh: el 70% del daño de los aliados se comparte
        // con Ho-Oh durante los 3 s del vórtice (el aliado recibe el 30%).
        if (!this._recibiendoCompartido && dañoReal > 0) {
            const hooh = (typeof buscarHoOhGiroFuego === 'function') ? buscarHoOhGiroFuego(this) : null;
            if (hooh && hooh !== this) {
                const compartido = Math.floor(dañoReal * 0.7);
                if (compartido > 0) {
                    dañoReal -= compartido;
                    this._recibiendoCompartido = true;
                    try { hooh.recibirDaño(compartido, atacante); } catch (e) { }
                    this._recibiendoCompartido = false;
                }
            }
        }

        if (this.escudoActual > 0) {
            let dañoEscudo = Math.min(this.escudoActual, dañoReal);
            this.escudoActual -= dañoEscudo;
            dañoReal -= dañoEscudo;
            this.damageBlocked += dañoEscudo;
            if (dañoReal <= 0) {
                if (this.esZacian && window.zacianUnidad) {
                    window.zacianUnidad.hp = this.hp;
                    window.zacianUnidad.energy = this.energy;
                }
                return this.hp === 0;
            }
        }

        if (!isFinite(dañoReal) || isNaN(dañoReal)) dañoReal = 0;

        this.hp = Math.max(0, this.hp - dañoReal);

        if (isNaN(this.hp)) {
            console.warn(`🔧 recibirDaño(): hp se volvió NaN en ${this.pokemon.nombre}, reparando`);
            this.hp = 0;
        }

        this.damageTaken += dañoReal;

        if (dañoReal > 0 && typeof actualizarCopiaEstadisticas === 'function') {
            actualizarCopiaEstadisticas(this, 'damageTaken', dañoReal);
        }

        if (this._golpeBajo && this._golpeBajo.activo && !this._golpeBajo.golpeado && dañoReal > 0) {
            this._golpeBajo.golpeado = true;
        }

        if (this.dañoReflejo > 0 && atacante && atacante.hp > 0) {
            let dañoReflejado = Math.floor(this.maxHp * this.dañoReflejo);
            if (isFinite(dañoReflejado) && !isNaN(dañoReflejado) && dañoReflejado > 0) {
                atacante.hp = Math.max(0, atacante.hp - dañoReflejado);
                atacante.damageTaken += dañoReflejado;
            }
        }

        if (atacante && atacante.pokemon.tipos && atacante.pokemon.tipos.includes("Eléctrico") && atacante.shockStacksBonus > 0) {
            if (!this.inmuneImpedimentos) {
                this.shockStacks += atacante.shockStacksBonus;
                if (typeof actualizarShockStacksVisual === 'function' && typeof obtenerPosicionUnidadActual === 'function') {
                    const posShock = obtenerPosicionUnidadActual(this);
                    if (posShock && posShock.elemento) actualizarShockStacksVisual(posShock.elemento, this);
                }
                if (this.shockStacks >= 6) {
                    let shockDamage = Math.floor(this.maxHp * 0.08 * (atacante.shockDamageMultiplier || 1));
                    if (isFinite(shockDamage) && !isNaN(shockDamage) && shockDamage > 0) {
                        this.hp = Math.max(0, this.hp - shockDamage);
                        this.damageTaken += shockDamage;
                        atacante.damageDealt = (atacante.damageDealt || 0) + shockDamage;
                        if (typeof actualizarCopiaEstadisticas === 'function') {
                            actualizarCopiaEstadisticas(this, 'damageTaken', shockDamage);
                            actualizarCopiaEstadisticas(atacante, 'damageDealt', shockDamage);
                        }
                        if (typeof obtenerPosicionUnidadActual === 'function') {
                            const pos = obtenerPosicionUnidadActual(this);
                            if (pos && typeof mostrarNumeroDaño === 'function') {
                                mostrarNumeroDaño(pos.x, pos.y - 20, shockDamage, false);
                            }
                        }
                    }
                    if (typeof obtenerPosicionUnidadActual === 'function' && typeof mostrarRayoShock === 'function') {
                        const posRayo = obtenerPosicionUnidadActual(this);
                        if (posRayo) mostrarRayoShock(posRayo.x, posRayo.y, posRayo.elemento);
                    }
                    this.shockStacks = 0;
                }
            }
        }

        if (atacante && atacante.pokemon.tipos && atacante.pokemon.tipos.includes("Hielo") && atacante.frostDamageBonus > 0) {
            if (!this.inmuneImpedimentos) {
                this.frostStacks = Math.min(this.frostStacks + 1, 6);
                if (typeof actualizarFrostStacksVisual === 'function' && typeof obtenerPosicionUnidadActual === 'function') {
                    const posFrost = obtenerPosicionUnidadActual(this);
                    if (posFrost && posFrost.elemento) actualizarFrostStacksVisual(posFrost.elemento, this);
                }
                if (this.frostStacks >= 6) {
                    let damagePercent = 0.04 + (this.frostStacks * atacante.frostDamageBonus);
                    let damage = Math.floor(this.maxHp * damagePercent);
                    if (isFinite(damage) && !isNaN(damage) && damage > 0) {
                        this.hp = Math.max(0, this.hp - damage);
                        this.damageTaken += damage;
                        atacante.damageDealt = (atacante.damageDealt || 0) + damage;
                        if (typeof actualizarCopiaEstadisticas === 'function') {
                            actualizarCopiaEstadisticas(this, 'damageTaken', damage);
                            actualizarCopiaEstadisticas(atacante, 'damageDealt', damage);
                        }
                        if (typeof obtenerPosicionUnidadActual === 'function') {
                            const pos = obtenerPosicionUnidadActual(this);
                            if (pos && typeof mostrarNumeroDaño === 'function') {
                                mostrarNumeroDaño(pos.x, pos.y - 20, damage, false);
                            }
                        }
                    }
                    if (typeof obtenerPosicionUnidadActual === 'function' && typeof mostrarNevadaHielo === 'function') {
                        const posNieve = obtenerPosicionUnidadActual(this);
                        if (posNieve) mostrarNevadaHielo(posNieve.x, posNieve.y, posNieve.elemento);
                    }
                    this.frozen = true;
                    this.frozenRealInicio = performance.now();
                    this.frozenDuracion = 0.6;
                    this.frozenTimer = 0.6;
                    this.frostStacks = 0;
                }
            }
        }

        if (this.hasLastStand && !this.lastStandActive && this.hp / this.maxHp < 0.2) {
            this.lastStandActive = true;
            this.bonusAttack *= 1.3;
            this.bonusSpAttack *= 1.3;
            this.bonusAttackSpeed *= 1.3;
            this.bonusDamageReduction *= 0.5;
            this.actualizarStats();
            if (typeof addConsoleMessage === 'function') {
                addConsoleMessage(`🔥 ${this.pokemon.nombre} activa ÚLTIMO ALIENTO!`, 'info');
            }
        }

        if (this.enlaceDolor && this.enlaceDolor.activo && this.enlaceDolor.objetivo) {
            const objetivoEnlace = this.enlaceDolor.objetivo;

            if (objetivoEnlace && objetivoEnlace.hp > 0 && !objetivoEnlace.muerto) {
                const dañoTransferido = Math.floor(dañoReal * this.enlaceDolor.porcentaje);

                if (dañoTransferido > 0 && isFinite(dañoTransferido) && !isNaN(dañoTransferido)) {
                    objetivoEnlace.hp = Math.max(0, objetivoEnlace.hp - dañoTransferido);
                    objetivoEnlace.damageTaken += dañoTransferido;

                    if (typeof actualizarCopiaEstadisticas === 'function') {
                        actualizarCopiaEstadisticas(objetivoEnlace, 'damageTaken', dañoTransferido);
                    }

                    if (typeof obtenerPosicionUnidadActual === 'function') {
                        const posObj = obtenerPosicionUnidadActual(objetivoEnlace);
                        if (posObj) {
                            if (typeof mostrarNumeroDaño === 'function') {
                                mostrarNumeroDaño(posObj.x, posObj.y, dañoTransferido, false);
                            }
                            if (posObj.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                                actualizarBarraVidaPokemon(
                                    posObj.elemento,
                                    objetivoEnlace.hp,
                                    objetivoEnlace.maxHp,
                                    dañoTransferido
                                );
                            }
                        }
                    }

                    if (objetivoEnlace.hp <= 0) {
                        objetivoEnlace.muerto = true;
                        if (typeof obtenerPosicionUnidadActual === 'function') {
                            const posM = obtenerPosicionUnidadActual(objetivoEnlace);
                            if (posM && posM.elemento && typeof ocultarUnidadMuerta === 'function') {
                                ocultarUnidadMuerta(posM.elemento);
                            }
                        }
                    }
                }
            } else {
                this.enlaceDolor.activo = false;
            }
        }

        if (this.esZacian && window.zacianUnidad) {
            window.zacianUnidad.hp = this.hp;
            window.zacianUnidad.energy = this.energy;
            setTimeout(() => {
                if (typeof actualizarBarrasZacian === 'function') actualizarBarrasZacian();
            }, 50);
        }

        if (this.hp <= 0) {
    this.muerto = true;
    this.hp = 0;

    // 🆕 Limpiar fade de escudo si existe
    if (this._fadeEscudoId) {
        clearInterval(this._fadeEscudoId);
        this._fadeEscudoId = null;
    }

    if (this.enlaceDolor) {
        this.enlaceDolor.activo = false;
    }

    if (this.taunt) {
        this.taunt = null;
    }
}
        return this.hp === 0;
    }

    // ============================================================
    // ===== APLICAR QUEMADURA =====
    // ============================================================
    aplicarQuemadura(porcentaje) {
        if (typeof porcentaje !== 'number' || isNaN(porcentaje) || porcentaje <= 0) return 0;
        if (typeof this.maxHp !== 'number' || isNaN(this.maxHp)) return 0;

        let dañoQuemadura = Math.floor(this.maxHp * porcentaje);
        if (isNaN(dañoQuemadura) || !isFinite(dañoQuemadura) || dañoQuemadura < 0) dañoQuemadura = 0;

        this.hp = Math.max(0, this.hp - dañoQuemadura);
        if (isNaN(this.hp)) this.hp = 0;

        this.damageTaken += dañoQuemadura;

        if (dañoQuemadura > 0 && typeof actualizarCopiaEstadisticas === 'function') {
            actualizarCopiaEstadisticas(this, 'damageTaken', dañoQuemadura);
        }

        if (this.hp <= 0) this.muerto = true;
        return dañoQuemadura;
    }

    // ============================================================
    // ===== CURAR (BLINDADO CONTRA NaN) =====
    // ============================================================

    curar(cantidad = null) {
        if (typeof this.maxHp !== 'number' || isNaN(this.maxHp) || this.maxHp < 1) {
            console.warn(`🔧 curar(): maxHp inválido en ${this.pokemon.nombre}, reparando`);
            this._sanear();
        }
        if (typeof this.hp !== 'number' || isNaN(this.hp)) {
            console.warn(`🔧 curar(): hp inválido en ${this.pokemon.nombre}, reparando`);
            this._sanear();
        }

        let curacionBase;
        let esCuracionCompleta = (cantidad === null || cantidad === undefined);

        if (esCuracionCompleta) {
            curacionBase = this.maxHp - this.hp;
        } else {
            if (typeof cantidad !== 'number' || isNaN(cantidad) || !isFinite(cantidad)) {
                return 0;
            }
            curacionBase = Math.min(cantidad, this.maxHp - this.hp);
        }

        if (typeof curacionBase !== 'number' || isNaN(curacionBase) || curacionBase < 0) {
            return 0;
        }

        let curacionFinal = curacionBase;
        if (this.curacionEscudoBonus && this.curacionEscudoBonus > 0) {
            curacionFinal = Math.floor(curacionBase * (1 + this.curacionEscudoBonus));
        }

        if (isNaN(curacionFinal) || !isFinite(curacionFinal)) curacionFinal = curacionBase;

        if (this._curacionBloqueadaHasta && performance.now() < this._curacionBloqueadaHasta) {
            return 0;
        }

        this.hp += curacionFinal;

        if (isNaN(this.hp)) {
            console.warn(`🔧 curar(): hp resultó NaN en ${this.pokemon.nombre}, reparando`);
            this.hp = this.maxHp;
        }

        this.hp = Math.min(this.hp, this.maxHp);

        if (cantidad !== null && cantidad !== undefined) {
            this.healingDone += curacionFinal;
        }

        return curacionFinal;
    }
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================
window.Unidad = Unidad;

// Busca un Ho-Oh aliado con Giro Fuego activo (para compartir daño).
function buscarHoOhGiroFuego(unidad) {
    if (!unidad) return null;
    const ahora = performance.now();
    let lista = null;
    try {
        if (typeof tablero !== 'undefined' && tablero && tablero.includes(unidad)) lista = tablero;
        else if (typeof enemyBoard !== 'undefined' && enemyBoard && enemyBoard.includes(unidad)) lista = enemyBoard;
    } catch (e) { }
    if (!lista) return null;
    for (const u of lista) {
        if (u && u !== unidad && u.hp > 0 && !u.muerto && u._giroFuegoHasta > ahora) return u;
    }
    return null;
}
window.buscarHoOhGiroFuego = buscarHoOhGiroFuego;
