// ============================================================
// SINERGIAS DE TIPO Y CLASE - DATOS + RENDER
// Archivo: js/data/sinergias.js
// VERSIÓN: v12
// CAMBIO: descripción de Hada actualizada con la mecánica de
//         HP escalable de Zacian (+25% HP aliados + 100 HP/hada)
// ============================================================

// ============================================================
// DATOS: TIPOS
// ============================================================
const TYPE_SYNERGIES = {
    "Fuego": {
        2: { attackPercent: 0.05, spAttackPercent: 0.05, attackSpeedPercent: 0.05, desc: "+5% Ataque, Atq Esp y Velocidad" },
        3: { attackPercent: 0.10, spAttackPercent: 0.10, attackSpeedPercent: 0.10, desc: "+10% Ataque, Atq Esp y Velocidad" },
        4: { attackPercent: 0.18, spAttackPercent: 0.18, attackSpeedPercent: 0.18, desc: "+18% Ataque, Atq Esp y Velocidad" },
        5: { attackPercent: 0.25, spAttackPercent: 0.25, attackSpeedPercent: 0.25, burnDamage: 0.03, desc: "+25% Atk/AtqEsp/Vel, QUEMADURA: 3% HP/s" },
        6: { attackPercent: 0.30, spAttackPercent: 0.30, attackSpeedPercent: 0.30, burnDamage: 0.03, lastStand: true, desc: "+30% Atk/AtqEsp/Vel, QUEMADURA 3% HP/s, ÚLTIMO ALIENTO al <20% HP" }
    },
    "Agua": {
        2: { attackPercent: 0.15, spAttackPercent: 0.15, desc: "+15% Ataque y Ataque Especial" },
        3: { attackPercent: 0.25, spAttackPercent: 0.25, desc: "+25% Ataque y Ataque Especial" },
        4: { attackPercent: 0.25, spAttackPercent: 0.25, defense: 220, spDefense: 220, desc: "+25% Atk/AtqEsp, +220 Def/DefEsp" },
        5: { attackPercent: 0.25, spAttackPercent: 0.25, defense: 220, spDefense: 220, giantWave: true, desc: "+25% Atk/AtqEsp, +220 Def/DefEsp, OLA GIGANTE" },
        6: { attackPercent: 0.25, spAttackPercent: 0.25, defense: 220, spDefense: 220, giantWave: true, giantWaveBoosted: true, cleanse: true, desc: "+25% Atk/AtqEsp, +220 Def/DefEsp, OLA GIGANTE POTENCIADA, LIMPIEZA EFECTOS" }
    },
    "Planta": {
        2: { hpBonus: 0.05, regenPercent: 0.01, revivePoints: 2, desc: "+5% HP, +1% HP/s, +2 puntos por aliado caído" },
        3: { hpBonus: 0.10, regenPercent: 0.02, revivePoints: 3, desc: "+10% HP, +2% HP/s, +3 puntos por aliado caído" },
        4: { hpBonus: 0.15, regenPercent: 0.03, revivePoints: 4, desc: "+15% HP, +3% HP/s, +4 puntos por aliado caído" },
        5: { hpBonus: 0.20, regenPercent: 0.04, revivePoints: 5, maxHpDamage: 0.01, moveMaxHpDamage: 0.10, desc: "+20% HP, +4% HP/s, +5 puntos, +1% MaxHP daño básico, +10% MaxHP movimiento" },
        6: { hpBonus: 0.25, regenPercent: 0.05, revivePoints: 6, maxHpDamage: 0.01, moveMaxHpDamage: 0.15, grassyField: true, desc: "+25% HP, +5% HP/s, +6 puntos, +1% MaxHP daño, +15% MaxHP movimiento, CAMPO DE HIERBA" }
    },
    "Eléctrico": {
        2: { shockStacks: 1, desc: "Cada golpe aplica 1 stack de SHOCK. 6 stacks → DAÑO ELÉCTRICO (8% HP)" },
        3: { shockStacks: 2, desc: "Cada golpe aplica 2 stacks de SHOCK. 6 stacks → DAÑO ELÉCTRICO (8% HP)" },
        4: { shockStacks: 2, shockDamageMultiplier: 2, desc: "Cada golpe aplica 2 stacks. DAÑO DE SHOCK +100% (16% HP)" }
    },
    "Psíquico": {
        2: { extraMoveGauge: 4, desc: "+4 energía por segundo para todos los aliados" },
        3: { extraMoveGauge: 6, desc: "+6 energía por segundo para todos los aliados" },
        4: { extraMoveGauge: 8, desc: "+8 energía por segundo para todos los aliados" },
        5: { extraMoveGauge: 8, moveAtStart: true, desc: "+8 energía/s. Pokémon Psíquico usan movimiento al inicio del combate" },
        6: { extraMoveGauge: 8, moveAtStart: true, moveDamageStack: 0.15, desc: "+8 energía/s. Movimiento inicial. +15% daño de movimiento por cada uso (máx 10)" }
    },
    "Siniestro": {
        2: { attackPercent: 0.08, spAttackPercent: 0.08, defenseReduction: 100, spDefenseReduction: 100, desc: "AURA DE MIEDO: -8% Atk/AtqEsp enemigo, -100 Def/DefEsp. Eliminar enemigos concede +1 stack." },
        3: { attackPercent: 0.12, spAttackPercent: 0.12, defenseReduction: 180, spDefenseReduction: 180, desc: "AURA DE MIEDO: -12% Atk/AtqEsp enemigo, -180 Def/DefEsp. x5→+10% Atk, x15→+20%, x25→+30%, x40→+40%, x60→+60%." },
        4: { attackPercent: 0.15, spAttackPercent: 0.15, defenseReduction: 0.50, spDefenseReduction: 0.50, defenseReductionFlat: 220, spDefenseReductionFlat: 220, desc: "AURA DE MIEDO: -15% Atk/AtqEsp enemigo, -50%+220 Def/DefEsp." },
        5: { attackPercent: 0.15, spAttackPercent: 0.15, defenseReduction: 0.60, spDefenseReduction: 0.60, defenseReductionFlat: 250, spDefenseReductionFlat: 250, desc: "AURA DE MIEDO: -15% Atk/AtqEsp enemigo, -60%+250 Def/DefEsp." },
        6: { attackPercent: 0.15, spAttackPercent: 0.15, defenseReduction: 0.60, spDefenseReduction: 0.60, defenseReductionFlat: 250, spDefenseReductionFlat: 250, desc: "AURA DE MIEDO: -15% Atk/AtqEsp enemigo, -60%+250 Def/DefEsp." }
    },
    "Hada": {
        2: { zacianStar: 1, desc: "Invoca a Zacian 1★ (no ocupa casilla)" },
        3: { zacianStar: 2, metalClaw: true, desc: "Invoca a Zacian 2★ + Garra Metál" },
        4: { zacianStar: 3, crowned: true, metalClaw: true, desc: "Invoca a Zacian 3★ Corona + Garra Metál" },
        5: { zacianStar: 3, crowned: true, metalClaw: true, drainCrown: true, desc: "Invoca a Zacian 3★ + Garra Metál + Corona Drenaje" },
        6: { zacianStar: 3, crowned: true, metalClaw: true, drainCrown: true, behemothBlade: true, desc: "Invoca a Zacian 3★ + Hoja Colosal + Corona Drenaje" }
    },
    "Fantasma": {
        2: { ghostAttackSpeed: 0.40, ghostAttackPercent: 0.40, ghostSpAttackPercent: 0.40, ghostDamageReduction: 0.50, ghostActivationTime: 2, desc: "Estado FANTASMA: +40% Vel/Atk/AtqEsp, -50% daño (2s sin daño)" },
        3: { ghostAttackSpeed: 0.50, ghostAttackPercent: 0.50, ghostSpAttackPercent: 0.50, ghostDamageReduction: 0.50, ghostActivationTime: 2, desc: "Estado FANTASMA: +50% Vel/Atk/AtqEsp, -50% daño (2s sin daño)" },
        4: { ghostAttackSpeed: 0.55, ghostAttackPercent: 0.55, ghostSpAttackPercent: 0.55, ghostDamageReduction: 0.50, ghostPermanent: true, ghostIntervalo: 5, desc: "Estado FANTASMA: +55% Vel/Atk/AtqEsp, -50% daño. Entra cada 5s, PERMANENTE" }
    },
    "Lucha": {
        2: { lifesteal: 0.25, attackSpeedPercent: 0.15, desc: "25% ROBOVIDA, +15% Velocidad de Ataque" },
        3: { lifesteal: 0.35, attackSpeedPercent: 0.20, desc: "35% ROBOVIDA, +20% Velocidad de Ataque" },
        4: { lifesteal: 0.40, attackSpeedPercent: 0.25, desc: "40% ROBOVIDA, +25% Velocidad de Ataque" },
        5: { lifesteal: 0.50, attackPercent: 3.40, critGuaranteed: true, desc: "50% ROBOVIDA, +340% Ataque, CRÍTICO ASEGURADO" },
        6: { lifesteal: 0.60, attackPercent: 3.40, areaDamage: true, critGuaranteed: true, desc: "60% ROBOVIDA, +340% Ataque, DAÑO EN ÁREA, CRÍTICO ASEGURADO" }
    },
    "Veneno": {
        2: { poisonInfinite: true, poisonStackable: true, desc: "Veneno INFINITO y ACUMULABLE" },
        3: { poisonInfinite: true, poisonStackable: true, poisonDamageMultiplier: 2, desc: "Veneno INFINITO, daño +100%" },
        4: { poisonInfinite: true, poisonStackable: true, poisonDamageMultiplier: 3.5, desc: "Veneno INFINITO, daño +250%" },
        5: { poisonInfinite: true, poisonStackable: true, poisonDamageMultiplier: 3.5, badlyPoison: true, badlyPoisonDamage: 280, desc: "Veneno INFINITO, +250% daño, VENENO GRAVE cada 2s (+280/s)" },
        6: { poisonInfinite: true, poisonStackable: true, poisonDamageMultiplier: 3.5, badlyPoison: true, badlyPoisonDamage: 280, fixedDamage: true, desc: "Veneno INFINITO, +250% daño, VENENO GRAVE frecuente, daño FIJO" }
    },
    "Hielo": {
        2: { frostDamage: 0.02, desc: "ESCARCHA: Cada stack +2% daño extra" },
        3: { frostDamage: 0.04, desc: "ESCARCHA: Cada stack +4% daño extra" },
        4: { frostDamage: 0.08, desc: "ESCARCHA: Cada stack +8% daño extra" },
        5: { frostDamage: 0.08, frostReduceStats: true, desc: "ESCARCHA: +8% daño/stack. Nevada reduce Atk/AtqEsp 10%" },
        6: { frostDamage: 0.08, frostReduceStats: true, articunoBlizzard: true, articunoTimer: 10, desc: "ESCARCHA: +8% daño/stack. Articuno usa Ventisca a los 10s" }
    },
    "Dragón": {
        2: { attackSpeedPercent: 0.10, desc: "+10% Velocidad de Ataque para TODOS los aliados" }
    },
    "Roca": {
        2: { spDefense: 320, desc: "+320 Defensa Especial para TODOS los aliados" }
    },
    "Normal": {
        1: { defense: 90, spDefense: 90, desc: "+90 Defensa y Defensa Especial para Pokémon Normal" }
    },
    "Volador": {
        2: { windBarrier: true, windBarrierInterval: 6, windBarrierDuration: 3, windBarrierReduction: 0.20, desc: "BARRERA DE VIENTO: -20% daño 3s cada 6s" },
        3: { windBarrier: true, windBarrierInterval: 6, windBarrierDuration: 3, windBarrierReduction: 0.20, windGust: true, windGustInterval: 6, windGustDuration: 3, windGustSpeed: 0.20, desc: "BARRERA DE VIENTO + RÁFAGA: +20% Vel 3s cada 6s" },
        4: { windBarrier: true, windBarrierInterval: 6, windBarrierDuration: 3, windBarrierReduction: 0.20, windGust: true, windGustInterval: 6, windGustDuration: 3, windGustSpeed: 0.20, whirlwind: true, desc: "BARRERA + RÁFAGA + REMOLINO: Daño y -40% Vel enemigo 3s" }
    },
    "Eevee": {
        2: { damagePercent: 0.15, desc: "Daño aumentado +15%" },
        3: { damagePercent: 0.15, damageReduction: 0.15, desc: "Daño +15% y Reducción de daño +15%" },
        4: { damagePercent: 0.15, damageReduction: 0.15, extraMoveGauge: 8, desc: "Daño +15%, Reducción +15% y +8 energía por ataque" },
        5: { damagePercent: 0.15, damageReduction: 0.15, extraMoveGauge: 8, moveDamagePercent: 0.45, desc: "+15% Daño/Reducción, +8 energía, +45% daño movimiento" },
        6: { damagePercent: 0.15, damageReduction: 0.15, extraMoveGauge: 8, moveDamagePercent: 0.45, meteorShower: true, desc: "Todo lo anterior + LLUVIA DE METEOROS" }
    },
    "Acero": {
        2: { inmuneImpedimentos: true, desc: "Inmunidad a efectos de impedimento (congelación, quemadura, veneno, parálisis, etc.)" }
    }
};

// ============================================================
// DATOS: CLASES
// ============================================================
const CLASS_SYNERGIES = {
    "Equilibrado": {
        2: { damagePercent: 0.05, damageReduction: 0.10, desc: "+5% Daño y -10% daño recibido" },
        3: { damagePercent: 0.10, damageReduction: 0.15, desc: "+10% Daño y -15% daño recibido" },
        4: { damagePercent: 0.20, damageReduction: 0.25, desc: "+20% Daño y -25% daño recibido" }
    },
    "Atacante": {
        2: { attackPercent: 0.15, desc: "+15% Ataque" },
        3: { attackPercent: 0.25, desc: "+25% Ataque" },
        4: { attackPercent: 0.50, desc: "+50% Ataque" }
    },
    "At. Especial": {
        2: { spAttackPercent: 0.15, desc: "+15% Ataque Especial" },
        3: { spAttackPercent: 0.25, desc: "+25% Ataque Especial" },
        4: { spAttackPercent: 0.50, desc: "+50% Ataque Especial" }
    },
    "Movimiento": {
        2: { moveDamagePercent: 0.10, desc: "+10% Daño de movimiento" },
        3: { moveDamagePercent: 0.20, desc: "+20% Daño de movimiento" },
        4: { moveDamagePercent: 0.40, desc: "+40% Daño de movimiento" }
    },
    "Ágil": {
        2: { attackSpeedPercent: 0.20, desc: "+20% Velocidad de Ataque" },
        3: { attackSpeedPercent: 0.30, desc: "+30% Velocidad de Ataque" },
        4: { attackSpeedPercent: 0.60, desc: "+60% Velocidad de Ataque" }
    },
    "Defensa": {
        2: { defense: 160, spDefense: 160, desc: "+160 Defensa y Defensa Especial" },
        3: { defense: 320, spDefense: 320, desc: "+320 Defensa y Defensa Especial" },
        4: { defense: 640, spDefense: 640, desc: "+640 Defensa y Defensa Especial" }
    },
    "Auxiliar": {
        2: { hpBonus: 0.15, desc: "+15% HP" },
        3: { hpBonus: 0.25, desc: "+25% HP" },
        4: { hpBonus: 0.50, desc: "+50% HP" }
    }
};

// ============================================================
// COLORES POR TIPO Y CLASE
// ============================================================
const COLORES_TIPO_CHIP = {
    "Fuego": "#ff6b35", "Agua": "#4fc3f7", "Planta": "#66bb6a",
    "Eléctrico": "#ffd54f", "Psíquico": "#ce93d8", "Siniestro": "#78909c",
    "Hada": "#f48fb1", "Fantasma": "#9575cd", "Lucha": "#ef5350",
    "Veneno": "#ab47bc", "Hielo": "#80deea", "Dragón": "#7e57c2",
    "Roca": "#a1887f", "Normal": "#bdbdbd", "Volador": "#90caf9",
    "Acero": "#90a4ae", "Eevee": "#ffab91"
};

const COLORES_CLASE_CHIP = {
    "Equilibrado": "#efdfaf", "Atacante": "#efdfaf", "At. Especial": "#efdfaf",
    "Movimiento": "#efdfaf", "Ágil": "#efdfaf", "Defensa": "#efdfaf",
    "Auxiliar": "#efdfaf"
};

// ============================================================
// MOSTRAR SINERGIAS CON CHIPS
// ============================================================
function mostrarSinergiasConChips(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.style.cssText = '';
    container.innerHTML = '';

    const lado = (elementId === 'enemySinergiasTitulo') ? 'enemy' : 'player';
    const unidades = (lado === 'enemy') ? enemyBoard : tablero;

    let todosTipos = new Set();
    let todasClases = new Set();

    for (let u of unidades) {
        if (!u) continue;
        if (u.esZacian) continue;
        if (u.pokemon.tipos) u.pokemon.tipos.forEach(t => todosTipos.add(t));
        if (u.pokemon.clase) todasClases.add(u.pokemon.clase);
    }

    let tipoCountBase = {};
    for (let tipo of todosTipos) {
        let count = 0;
        let familiasProcesadas = new Set();
        for (let u of unidades) {
            if (!u) continue;
            if (u.esZacian) continue;
            let familia = getFamiliaEvolutiva(u.pokemon);
            if (!familia || familiasProcesadas.has(familia)) continue;
            if (u.pokemon.tipos && u.pokemon.tipos.includes(tipo)) {
                familiasProcesadas.add(familia);
                count++;
            }
        }
        tipoCountBase[tipo] = count;
    }

    let chipBonuses = {};
    for (let u of unidades) {
        if (!u) continue;
        if (u.esZacian) continue;
        if (u.objetos && u.objetos.length > 0) {
            for (let objNombre of u.objetos) {
                const objeto = OBJETOS[objNombre];
                if (objeto && objeto.efecto && objeto.efecto.tipoBonus) {
                    const tipoBonus = objeto.efecto.tipoBonus;
                    const bonusExtra = objeto.efecto.bonusExtra || 1;
                    if (!chipBonuses[tipoBonus]) chipBonuses[tipoBonus] = 0;
                    chipBonuses[tipoBonus] += bonusExtra;
                }
            }
        }
    }

    let sinergiasLista = [];

    for (let tipo of todosTipos) {
        let nivelBase = tipoCountBase[tipo] || 0;
        let bonusChip = chipBonuses[tipo] || 0;
        let nivelActual = nivelBase + bonusChip;
        let synergy = TYPE_SYNERGIES[tipo];

        if (!synergy) continue;

        let niveles = Object.keys(synergy).map(Number).sort((a, b) => b - a);
        let nivelMaximo = niveles[0] || 0;
        let estaActiva = false;
        let desc = "";

        for (let nivel of niveles) {
            if (nivelActual >= nivel) {
                estaActiva = true;
                desc = synergy[nivel].desc || "";
                break;
            }
        }

        if (!estaActiva) {
            let nivelesAsc = Object.keys(synergy).map(Number).sort((a, b) => a - b);
            let proximoNivel = nivelesAsc.find(n => n > nivelActual);
            if (proximoNivel !== undefined) {
                desc = `⚡ Faltan ${proximoNivel - nivelActual} para nivel ${proximoNivel}`;
            }
        }

        if (estaActiva && tipo === "Siniestro" && nivelActual >= 2) {
            desc += ` | 😨 ${fearAuraStacks} stacks`;
        }

        sinergiasLista.push({
            icono: getIconoTipo(tipo),
            nombre: tipo,
            nivelActual: nivelActual,
            bonusChip: bonusChip,
            nivelMaximo: nivelMaximo,
            desc: desc,
            activa: estaActiva,
            tipo: 'tipo',
            color: COLORES_TIPO_CHIP[tipo] || '#fbbf24'
        });
    }

    for (let clase of todasClases) {
        let nivelActual = 0;
        let familiasProcesadas = new Set();
        for (let u of unidades) {
            if (!u) continue;
            if (u.esZacian) continue;
            let familia = getFamiliaEvolutiva(u.pokemon);
            if (!familia || familiasProcesadas.has(familia)) continue;
            if (u.pokemon.clase === clase) {
                familiasProcesadas.add(familia);
                nivelActual++;
            }
        }

        let synergy = CLASS_SYNERGIES[clase];
        if (!synergy) continue;

        let niveles = Object.keys(synergy).map(Number).sort((a, b) => b - a);
        let nivelMaximo = niveles[0] || 0;
        let estaActiva = false;
        let desc = "";

        for (let nivel of niveles) {
            if (nivelActual >= nivel) {
                estaActiva = true;
                desc = synergy[nivel].desc || "";
                break;
            }
        }

        if (!estaActiva) {
            let nivelesAsc = Object.keys(synergy).map(Number).sort((a, b) => a - b);
            let proximoNivel = nivelesAsc.find(n => n > nivelActual);
            if (proximoNivel !== undefined) {
                desc = `⚡ Faltan ${proximoNivel - nivelActual} para nivel ${proximoNivel}`;
            }
        }

        sinergiasLista.push({
            icono: getIconoClase(clase),
            nombre: clase,
            nivelActual: nivelActual,
            bonusChip: 0,
            nivelMaximo: nivelMaximo,
            desc: desc,
            activa: estaActiva,
            tipo: 'clase',
            color: COLORES_CLASE_CHIP[clase] || '#fbbf24'
        });
    }

    sinergiasLista.sort((a, b) => {
        const activaA = a.activa ? 0 : 1;
        const activaB = b.activa ? 0 : 1;
        if (activaA !== activaB) return activaA - activaB;

        const pesoA = (a.tipo === 'tipo') ? 0 : 1;
        const pesoB = (b.tipo === 'tipo') ? 0 : 1;
        if (pesoA !== pesoB) return pesoA - pesoB;

        return a.nombre.localeCompare(b.nombre);
    });

    // 🆕 El panel de sinergias necesita la lista ya calculada (sin duplicar
    // el conteo de familias, chips y niveles).
    window.sinergiasActuales = window.sinergiasActuales || {};
    window.sinergiasActuales[lado] = sinergiasLista;

    if (sinergiasLista.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#4a6a8a;font-size:0.6rem;padding:6px 0;">⚔️ Sin sinergias</div>';
        if (window.panelSinergiasAbierto && typeof window.actualizarPanelSinergias === 'function') {
            window.actualizarPanelSinergias();
        }
        return;
    }

    for (let s of sinergiasLista) {
        const item = crearItemSinergiaGrid(s, lado);
        container.appendChild(item);
    }

    // 🆕 Si el panel de sinergias está abierto, refrescarlo con los datos nuevos
    if (window.panelSinergiasAbierto && typeof window.actualizarPanelSinergias === 'function') {
        window.actualizarPanelSinergias();
    }

    // 🆕 Clic en cualquier parte del panel de sinergias (no solo en un icono)
    // abre el panel grande. Así es mucho más fácil de descubrir/usar.
    const wrap = container.closest ? container.closest('.traits-vertical') : null;
    if (wrap && !wrap.dataset.splAbrir) {
        wrap.dataset.splAbrir = '1';
        wrap.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('.trait-item')) return;
            if (typeof window.abrirPanelSinergias !== 'function') return;
            const lista = (window.sinergiasActuales && window.sinergiasActuales[lado]) || [];
            if (!lista.length) return;
            // Abrir la lista sin seleccionar ninguna sinergia
            window.abrirPanelSinergias(null, false, lado);
        });
    }
}

// ============================================================
// CREAR ITEM DE SINERGIA
// ============================================================
function crearItemSinergiaGrid(s, lado = 'player') {
    const item = document.createElement('div');
    const esActiva = s.activa;

    item.className = 'trait-item' + (esActiva ? ' active' : ' inactive');

    if (s.color) {
        item.style.setProperty('--trait-color', s.color);
    }

    const nombreSinergia = s.nombre;
    const esClase = (s.tipo === 'clase');
    const estado = esActiva ? '✅ Activa' : '⛔ Inactiva';
    item.title = `${s.nombre} (${s.nivelActual}/${s.nivelMaximo}) - ${estado}${s.desc ? ' — ' + s.desc : ''}`;

    item.addEventListener('click', function(e) {
        e.stopPropagation();

        // 🆕 Nuevo panel lista + detalle (también para sinergias inactivas)
        if (typeof window.abrirPanelSinergias === 'function') {
            window.abrirPanelSinergias(nombreSinergia, esClase, lado);
            return;
        }

        // Fallback: comportamiento antiguo (solo activas, carta modal)
        if (!esActiva) return;
        if (typeof abrirCartaSinergia === 'function') {
            if (window.cartaSinergiaAbierta && window.cartaSinergiaData &&
                window.cartaSinergiaData.nombre === nombreSinergia &&
                window.cartaSinergiaData.esClase === esClase &&
                window.cartaSinergiaData.lado === lado) {
                if (typeof cerrarCartaSinergia === 'function') {
                    cerrarCartaSinergia();
                }
                return;
            }
            abrirCartaSinergia(nombreSinergia, esClase, lado);
        }
    });

    const contador = document.createElement('span');
    contador.className = 'trait-count';
    contador.textContent = s.nivelActual;
    item.appendChild(contador);

    const iconoWrapper = document.createElement('div');
    iconoWrapper.className = 'trait-icon-img';
    iconoWrapper.style.display = 'flex';
    iconoWrapper.style.alignItems = 'center';
    iconoWrapper.style.justifyContent = 'center';
    iconoWrapper.style.width = '32px';
    iconoWrapper.style.height = '32px';

    let iconoHtml = s.icono;

    iconoHtml = iconoHtml.replace(/class="tipo-icon"/, 'class="trait-icon-img"');
    iconoHtml = iconoHtml.replace(/class="clase-icon"/, 'class="trait-icon-img"');
    iconoHtml = iconoHtml.replace(/\sstyle="[^"]*"/g, '');

    if (iconoHtml.trim().startsWith('<img')) {
        const temp = document.createElement('div');
        temp.innerHTML = iconoHtml;
        const img = temp.querySelector('img');
        if (img) {
            img.className = 'trait-icon-img';
            img.removeAttribute('style');
            item.appendChild(img);
        } else {
            iconoWrapper.innerHTML = iconoHtml;
            item.appendChild(iconoWrapper);
        }
    } else {
        const emoji = document.createElement('div');
        emoji.className = 'trait-icon-emoji';
        emoji.textContent = iconoHtml;
        item.appendChild(emoji);
    }

    const circulos = document.createElement('div');
    circulos.className = 'trait-circles';

    const maxCirculos = Math.min(s.nivelMaximo, 6);
    const nivelActual = Math.min(s.nivelActual, maxCirculos);

    for (let i = 1; i <= maxCirculos; i++) {
        const circle = document.createElement('span');
        circle.className = 'circle' + (i <= nivelActual ? ' filled' : '');
        circulos.appendChild(circle);
    }
    item.appendChild(circulos);

    return item;
}

// ============================================================
// DESCRIPCIONES DE SINERGIAS
// ============================================================
const DESCRIPCIONES_SINERGIA = {

    "Fuego": "Los Pokémon de Tipo Fuego ganan **daño aumentado** y aplican **quemaduras** al golpear con sus ataques básicos.\n\nLa quemadura inflige un **1% de los HP máximos** del oponente por segundo (no acumulable entre varios Pokémon de Fuego) y reduce su **curación un 30%**.\n\nLa primera vez que los HP de un Pokémon de Fuego caen por debajo del **50%**, todos los aliados de Tipo Fuego ganan **Ataque, Atq. Esp. y Velocidad de Ataque** aumentados.",

    "Agua": "Los Pokémon de Tipo Agua ganan **Ataque, Atq. Esp., Defensa y Def. Esp.** según el nivel de la sinergia.\n\nA niveles altos desatan **Olas Gigantes** que arrastran a los enemigos, y con la sinergia al máximo obtienen **Limpieza de Efectos** negativos al inicio de cada ronda.",

    "Planta": "Los Pokémon de Tipo Planta ganan **HP máximo** y **regeneran vida cada segundo**.\n\nCada aliado caído genera **Semillas Revivir** (+1 extra si el caído es de Tipo Planta). Las Semillas se acumulan sin límite y se canjean por recompensas en el panel de la sinergia.\n\nA niveles altos, sus ataques básicos y movimientos infligen **daño basado en el HP máximo** del objetivo.",

    "Eléctrico": "Los Pokémon de Tipo Eléctrico aplican **stacks de Shock** con cada golpe.\n\nAl alcanzar **6 stacks**, el objetivo recibe una **descarga masiva** que le inflige un **8% de sus HP máximos** como daño de Atq. Esp.\n\nCon la sinergia al máximo, el daño del Shock se **duplica** y aplica **2 stacks por golpe**.",

    "Psíquico": "Los Pokémon de Tipo Psíquico otorgan **energía extra por segundo** a todos los aliados, acelerando el uso de sus movimientos.\n\nA niveles altos, los Pokémon Psíquicos **usan su movimiento al inicio del combate** y acumulan **daño de movimiento** adicional con cada uso.",

    "Siniestro": "Los Pokémon de Tipo Siniestro proyectan un **Aura de Miedo** permanente que reduce el **Ataque y el Atq. Esp.** de todos los enemigos, además de reducir su **Defensa y Def. Esp.**.\n\nCada enemigo eliminado otorga **1 stack** al Aura. Al alcanzar **5 / 15 / 25 / 40 / 60 stacks**, el Aura gana **+10% / +20% / +30% / +40% / +60%** de potencia adicional.",

    "Hada": "Los Pokémon de Tipo Hada invocan a **Zacian** en el campo de batalla para que los ayude.\n\nLa **estrella de Zacian** y sus habilidades (**Garra Metál, Corona Drenaje, Tajo Supremo**) dependen del nivel de la sinergia.\n\nCada Pokémon de Tipo Hada aumenta las **estadísticas de Zacian** un **+5%**.\n\nAdemás, el **HP de Zacian** aumenta según la vitalidad de tu equipo: recibe un **+25% del HP máximo total de todos los aliados** en el tablero y **+100 HP extra por cada Hada** presente. Cuanto más resistente sea tu equipo, más fuerte será Zacian. ⚔️",

    "Fantasma": "Si los Pokémon de Tipo Fantasma **no reciben daño durante 2 segundos**, entran en **Estado Fantasma**.\n\nMientras están en ese estado, ganan **Velocidad de Ataque, Ataque y Atq. Esp.**, y reciben **-50% de daño**. El estado se elimina inmediatamente al recibir daño.\n\nCon la sinergia al máximo, el Estado Fantasma es **permanente** y se reactiva cada **5 segundos**.",

    "Lucha": "Los Pokémon de Tipo Lucha ganan **Robo de Vida** y **Velocidad de Ataque** aumentadas.\n\nCon la sinergia al máximo, además ganan un **+340% de Ataque**, sus ataques son **críticos garantizados** y golpean en **área**.",

    "Veneno": "Los movimientos de los Pokémon de Tipo Veneno **envenenan** a los oponentes al impactar.\n\nEl veneno es **infinito** y **acumulable**: el daño por segundo de cada stack se multiplica según el nivel de la sinergia.\n\nA niveles altos, aplican **Veneno Grave** (daño fijo adicional cada 2 segundos) y su daño se vuelve **fijo**, ignorando defensas.",

    "Hielo": "Los Pokémon de Tipo Hielo aplican **Escarcha** con sus ataques básicos: cada stack hace que el oponente reciba **daño adicional** (+2% / +4% / +8% por stack según nivel).\n\nAl acumular **6 stacks**, activan un efecto de **Nevada** que **congela al oponente durante 0.6 segundos** y le inflige un **4% de sus HP máximos** como daño de Atq. Esp.\n\nCon la sinergia al máximo, **Articuno aparece a los 10 segundos** y usa Ventisca sobre todos los enemigos.",

    "Dragón": "Los Pokémon de Tipo Dragón otorgan **+10% de Velocidad de Ataque** a **todos los aliados** (no solo a los de Tipo Dragón).",

    "Roca": "Todos los Pokémon aliados ganan **+320 de Defensa Especial**.",

    "Normal": "Los Pokémon de Tipo Normal ganan **+90 de Defensa y Defensa Especial**.",

    "Volador": "Los Pokémon de Tipo Volador obtienen efectos beneficiosos periódicos según el nivel.\n\n**Barrera de Viento**: -20% de daño recibido durante 3s cada 6s.\n\n**Ráfaga**: +20% de Velocidad durante 3s cada 6s.\n\n**Remolino**: inflige daño y reduce -40% la Velocidad de los enemigos durante 3s.",

    "Eevee": "Los Pokémon Eevee ganan **daño, reducción de daño y energía** adicionales según el nivel.\n\nA niveles altos, desatan una **Lluvia de Meteoros** que golpea a todos los enemigos al inicio del combate.",

    "Acero": "Los Pokémon de Tipo Acero ganan **inmunidad total** a los efectos de impedimento: **congelación, quemadura, veneno, parálisis, inmovilización** y cualquier otro efecto negativo que restrinja sus acciones.",

    "Equilibrado": "Los Pokémon Equilibrados ganan **daño aumentado** y **reducción de daño recibido**.\n\nA niveles altos, se convierten en luchadores muy resistentes que aguantan el frente mientras siguen haciendo daño.",

    "Atacante": "Los Pokémon Atacantes ganan un gran **bonus de Ataque físico**.\n\nA niveles altos, sus ataques básicos pueden duplicar o incluso triplicar el daño base.",

    "At. Especial": "Los Pokémon de Ataque Especial ganan un gran **bonus de Ataque Especial**.\n\nA niveles altos, sus movimientos especiales se vuelven devastadores, ideales para eliminar enemigos a distancia.",

    "Movimiento": "Los Pokémon de Movimiento ganan un gran **bonus de daño de movimiento**.\n\nA niveles altos, sus habilidades especiales (no los ataques básicos) pueden hacer más del doble de daño del normal.",

    "Ágil": "Los Pokémon Ágiles ganan un gran **bonus de Velocidad de Ataque**.\n\nA niveles altos, atacan tan rápido que pueden encadenar varios ataques básicos antes de que el enemigo responda una vez.",

    "Defensa": "Los Pokémon Defensivos ganan un gran **bonus de Defensa y Defensa Especial**.\n\nA niveles altos, se convierten en auténticos muros que absorben grandes cantidades de daño por ronda.",

    "Auxiliar": "Los Pokémon Auxiliares ganan un gran **bonus de HP máximo**.\n\nA niveles altos, pueden superar los **50% de HP extra**, convirtiéndose en las unidades más resistentes del equipo."
};

// ============================================================
// LOG DE CARGA
// ============================================================