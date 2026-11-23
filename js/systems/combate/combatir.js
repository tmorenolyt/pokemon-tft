// ============================================================
// COMBATE · COMBATIR
// Extraído de js/systems/combate.js (sin cambios de lógica).
// ============================================================

async function combatir() {
    if (!puedeCombatir()) return;
    let combateFinalizado = false;

    // 🧪 SANDBOX: en modo creativo el combate no debe avanzar ronda,
    // ni tocar oro/HP/torneo. Guardamos el estado para restaurarlo.
    const _esSandbox = window.modoCreativo === true;
    const _sandboxEstado = _esSandbox ? {
        vidaJugador, enemyHealth, oro, racha, victorias, experiencia,
        nivelJugador, fase, ronda, enemyLevel, enemyGold,
        enemyWinStreak, enemyLossStreak
    } : null;
    window.statsCombateEnVivo = { activo: true, jugadores: [], rivales: [] };

    // 👥 Recordar qué jugador (1 o 2) es el lado "jugador" en ESTE combate,
    // para que el panel de datos muestre J1 a la izquierda / J2 a la derecha
    // aunque luego `prepararTurnoDespuesDeCombate` haga el swap de estado.
    window._ultimoCombateJugadorEsJ2 = (window.modoDosJugadores === true && window.primerTurnoJugador === 2);

    try {
        bloquearEstadoCombate();
        if (typeof resetCambioMovimientoRonda === 'function') resetCambioMovimientoRonda();

        const btnPost = document.getElementById('btnPostCombate');
        if (btnPost) btnPost.style.display = 'inline-flex';

        if (seleccionado) {
            seleccionado = null;
            const btnVenderOld = document.getElementById('btnVender');
            if (btnVenderOld) btnVenderOld.style.display = 'none';
            document.querySelectorAll('.board-cell.selected, .bank-cell.selected').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.board-cell.drag-over, .bank-cell.drag-over').forEach(c => c.classList.remove('drag-over'));
        }
        if (objetoSeleccionado) objetoSeleccionado = null;

        let equipo = tablero.filter(u => u !== null && !u.esArticuno);
        if (equipo.length === 0) {
            addConsoleMessage("❌ No tienes Pokémon en el tablero! Compra uno primero.", 'error');
            liberarEstadoCombate();
            return;
        }
        if (enemyHealth <= 0) { mostrarVictoriaJuego(); liberarEstadoCombate(); return; }
        if (vidaJugador <= 0) { gameOver(); liberarEstadoCombate(); return; }

        iniciarAudio();
        addConsoleMessage("⚔️ ¡COMBATE INICIADO!", 'battle');
                if (typeof pausarMusicaPreparacion === 'function') {
            pausarMusicaPreparacion();
        } else if (typeof pausarFondoPreparacion === 'function') {
            // audioGestor.js ya no se usa (está comentado en index.html).
            pausarFondoPreparacion();
        }
        if (typeof reproducirMusicaCombate === 'function') {
            reproducirMusicaCombate();
        } else if (typeof playUISound === 'function') {
            playUISound('combate.mp3', 0.15);
        }

                aplicarSinergias();
        aplicarSinergiasEnemigo();

        // 🆕 FIX: Sincronizar Aura de Miedo al inicio del combate
        try {
            const sinergiasActuales = getSinergiasActivas();
            const nivelSiniestroJugador = (sinergiasActuales.types && sinergiasActuales.types["Siniestro"])
                ? sinergiasActuales.types["Siniestro"].nivel : 0;
            
            if (nivelSiniestroJugador < 2) {
                // El jugador NO tiene Siniestro activo → resetear AMBOS
                fearAuraStacks = 0;
                window.fearAuraStacks = 0;
            } else {
                // Siniestro activo → mantener los stacks existentes
                window.fearAuraStacks = fearAuraStacks;
            }

            // Sincronizar contador del enemigo
            const sinergiasEnemigo = (typeof getSinergiasActivasEnemigo === 'function')
                ? getSinergiasActivasEnemigo() : { types: {} };
            const nivelSiniestroEnemigo = (sinergiasEnemigo.types && sinergiasEnemigo.types["Siniestro"])
                ? sinergiasEnemigo.types["Siniestro"].nivel : 0;
            
            if (nivelSiniestroEnemigo < 2) {
                window.enemyFearAuraStacks = 0;
            }
        } catch (e) {
            console.warn('⚠️ Error sincronizando Aura de Miedo al inicio:', e);
        }

        if (typeof actualizarBordeLlamasCombate === 'function') actualizarBordeLlamasCombate();

        // Resetear estado de unidades enemigas
        for (let i = 0; i < enemyBoard.length; i++) {
            const u = enemyBoard[i];
            if (u) {
                u.damageDealt = 0; u.damageTaken = 0; u.healingDone = 0; u.damageBlocked = 0;
                u.equipo = 'enemy'; u.muerto = false;
                if (typeof u.hp !== 'number' || isNaN(u.hp) || u.hp <= 0) u.hp = u.maxHp || 1;
                u.metronomoBonus = 1; u.energiaLista = false;
                const coords = coordsDesdeIndice(i, 'enemy');
                u._indiceActual = i; u._indiceTablero = 'enemy';
                u._filaGlobal = coords._filaGlobal; u._colGlobal = coords._colGlobal;
                u.enlaceDolor = null; u.taunt = null; u.inmuneObjetivo = false;
                u.esquirlasHielo = 0; u._golpeDoble = false; u.dañoPorcentajeMaxHPObjetivo = 0;
                u.bolasLlamaEmbrujada = 0;
                u._teletransporteAtkBonus = 1; u._teletransporteSpAtkBonus = 1;
                u._teletransporteVelBonus = 1; u._teletransporteDefBonus = 0; u._teletransporteSpDefBonus = 0;
                u.spriteIdAlternativo = null; u.poisonStacks = []; u.critGuaranteed = false;
                u.escudoTimer = 0; u.escudoActivo = false; u.escudoActual = 0;
                u._regenAccumulator = 0; u.regenTimer = 0;
                u._deathLogged = false; u._reviviendo = false; u._regenLogged = false;
                u.ultiCarga = 0; u.ultiLista = false; u._ultiAvisada = false;
                u._ultiCargadaAntesDelAtaque = false; u._cooldownAtaque = 0; u._ultiDeInicioLanzada = false;
                if (u._hojaAfiladaIntervalId) { clearInterval(u._hojaAfiladaIntervalId); u._hojaAfiladaIntervalId = null; }
                u._hojaAfiladaActiva = false; u._hojaAfiladaFin = 0;
            }
        }
        for (let i = 0; i < tablero.length; i++) {
            if (tablero[i] && !tablero[i].esArticuno) {
                tablero[i]._ultiDeInicioLanzada = false;
                if (tablero[i]._hojaAfiladaIntervalId) { clearInterval(tablero[i]._hojaAfiladaIntervalId); tablero[i]._hojaAfiladaIntervalId = null; }
                tablero[i]._hojaAfiladaActiva = false; tablero[i]._hojaAfiladaFin = 0;
            }
        }
        for (let i = 0; i < enemyBoard.length; i++) {
            if (enemyBoard[i]) {
                enemyBoard[i]._ultiDeInicioLanzada = false;
                if (enemyBoard[i]._hojaAfiladaIntervalId) { clearInterval(enemyBoard[i]._hojaAfiladaIntervalId); enemyBoard[i]._hojaAfiladaIntervalId = null; }
                enemyBoard[i]._hojaAfiladaActiva = false; enemyBoard[i]._hojaAfiladaFin = 0;
            }
        }

        const _dispararUltisDeInicio = (unidad, aliados, enemigos) => {
            if (!unidad || !unidad.tieneDiscoUlti) return;
            const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[unidad.pokemon.nombre];
            if (!ultiData || !ultiData.esDeInicio) return;
            const nombreSlug = ultiData.id || ultiData.nombre
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                        const ultiFunc = window.ULTIS_REGISTRO && window.ULTIS_REGISTRO[nombreSlug];
            if (ultiFunc && typeof ultiFunc.ejecutar === 'function') {
                if (typeof aplicarFactorUlti === 'function') aplicarFactorUlti(unidad, nombreSlug, unidad.nivel);
                try {
                    // 🆕 GRITO DEL POKÉMON ANTES DE LA ULTI DE INICIO
                    const spriteIdGritoInicio = unidad.spriteIdAlternativo || unidad.pokemon.spriteId || unidad.pokemon.id;
                    if (typeof playPokemonCry === 'function' && spriteIdGritoInicio) {
                        try { playPokemonCry(spriteIdGritoInicio); } catch (e) {}
                    }

                    ultiFunc.ejecutar(unidad, null, { enemigos, aliados, esJugador: unidad.equipo === 'player' });
                    unidad._ultiDeInicioLanzada = true;
                    unidad.ultiLista = false;
                    unidad.ultiCarga = 0;
                    if (typeof addConsoleMessage === 'function') addConsoleMessage(`⚡ ${unidad.pokemon.nombre} activa su ULTIMATE de inicio`, 'battle');
                } catch (e) {
                    console.error('❌ Error lanzando ulti de inicio:', e);
                }
            }
        };

        // ==== Snapshots para stats ====
        equipoCompletoJugador = [];
        for (let i = 0; i < tablero.length; i++) {
            if (tablero[i] && !tablero[i].esArticuno) {
                let copia = new Unidad(tablero[i].pokemon, tablero[i].nivel, tablero[i].baseId, tablero[i].costeOriginal);
                copia.hp = tablero[i].hp; copia.maxHp = tablero[i].maxHp;
                copia.ataque = tablero[i].ataque; copia.ataqueEspecial = tablero[i].ataqueEspecial;
                copia.defensa = tablero[i].defensa; copia.defensaEspecial = tablero[i].defensaEspecial;
                copia.velocidadAtaque = tablero[i].velocidadAtaque;
                copia.energy = tablero[i].energy || 0; copia.energyGauge = tablero[i].energyGauge || 70;
                copia.damageDealt = 0; copia.damageTaken = 0; copia.healingDone = 0; copia.damageBlocked = 0;
                copia.objetos = tablero[i].objetos ? [...tablero[i].objetos] : [];
                copia.equipo = 'player'; copia.muerto = false; copia.metronomoBonus = 1; copia.energiaLista = false;
                copia.actualizarStats();
                copia.esZacian = tablero[i].esZacian || false;
                copia._indiceActual = i;
                equipoCompletoJugador.push(copia);
            }
        }
        equipoCompletoEnemigo = [];
        for (let i = 0; i < enemyBoard.length; i++) {
            if (enemyBoard[i]) {
                let copia = new Unidad(enemyBoard[i].pokemon, enemyBoard[i].nivel, enemyBoard[i].baseId, enemyBoard[i].costeOriginal);
                copia.hp = enemyBoard[i].hp; copia.maxHp = enemyBoard[i].maxHp;
                copia.ataque = enemyBoard[i].ataque; copia.ataqueEspecial = enemyBoard[i].ataqueEspecial;
                copia.defensa = enemyBoard[i].defensa; copia.defensaEspecial = enemyBoard[i].defensaEspecial;
                copia.velocidadAtaque = enemyBoard[i].velocidadAtaque;
                copia.energy = enemyBoard[i].energy || 0; copia.energyGauge = enemyBoard[i].energyGauge || 70;
                copia.damageDealt = 0; copia.damageTaken = 0; copia.healingDone = 0; copia.damageBlocked = 0;
                copia.objetos = enemyBoard[i].objetos ? [...enemyBoard[i].objetos] : [];
                copia.equipo = 'enemy'; copia.muerto = false; copia.metronomoBonus = 1; copia.energiaLista = false;
                copia.actualizarStats();
                copia.esZacian = enemyBoard[i].esZacian || false;
                copia._indiceActual = i;
                equipoCompletoEnemigo.push(copia);
            }
        }

        // ==== Clones de combate ====
        let jugadores = [], jugadoresIndices = [], rivales = [], rivalesIndices = [];
        window.jugadores = jugadores; window.rivales = rivales;
        window.jugadoresIndices = jugadoresIndices; window.rivalesIndices = rivalesIndices;

        for (let i = 0; i < tablero.length; i++) {
            if (!tablero[i] || tablero[i].esArticuno) continue;
            let n = tablero[i].clonarParaCombate();
            if (n.objetos && n.objetos.includes("Cuchara Peculiar") && n.reduceSpDefense === 0) {
                n.reduceSpDefense = 0.45; n.duracionReduccion = 3;
            }
            if (n.objetos && n.objetos.includes("Roca del Rey") && n.reduceDefense === 0) {
                n.reduceDefense = 0.45; n.duracionReduccion = 3;
            }
            n.damageDealt = 0; n.damageTaken = 0; n.healingDone = 0; n.damageBlocked = 0;
            n.muerto = false; n.equipo = 'player'; n.metronomoBonus = 1; n.energiaLista = false;
            n.energy = n.pokemon.startingEnergy || 0; n.critGuaranteed = false;
            n._regenAccumulator = 0; n.regenTimer = 0; n._deathLogged = false; n._reviviendo = false; n._regenLogged = false;
            n.ultiCarga = 0; n.ultiLista = false; n._ultiAvisada = false;
            n._ultiCargadaAntesDelAtaque = false; n._cooldownAtaque = 0; n._ultiDeInicioLanzada = false;
            n._hojaAfiladaIntervalId = null; n._hojaAfiladaActiva = false; n._hojaAfiladaFin = 0;
            n._iconoEscudoRotoFin = 0; n._iconoEscudoRotoTipo = null;
            n._iconoEscudoRotoIntervalId = null;
            const coords = coordsDesdeIndice(i, 'player');
            n._indiceActual = i; n._indiceTablero = 'player';
            n._filaGlobal = coords._filaGlobal; n._colGlobal = coords._colGlobal;
            n.enlaceDolor = null; n.taunt = null; n.inmuneObjetivo = false;
            n.esquirlasHielo = 0; n._golpeDoble = false; n.bolasLlamaEmbrujada = 0;
            n.spriteIdAlternativo = null; n.poisonStacks = [];
            n.escudoTimer = 0; n.escudoActivo = false;
            n.golpesAcumulados = 0; n.cargaActiva = false; n.reduccionTimer = 0; n.metronomoStacks = 0;
            n.iraActiva = false; n.iraAliadosCaidos = 0;
            n.comboContador = 0; n.comboActivo = false; n.comboTimer = 0; n.comboVsEscudoActivo = false;
            n.reflejoTimer = 0; n.invulnerableActivo = false; n.invulnerableUsado = false;
            n.debilidadStacks = 0; n.debilidadTimer = 0; n.focusActivo = false;
            n._maxHpOriginalEnlace = null; n._escudosTemporales = []; n._ultimoAtaque = 0;
            n.actualizarStats();
            jugadores.push(n); jugadoresIndices.push(i);
        }

        for (let i = 0; i < enemyBoard.length; i++) {
            if (!enemyBoard[i]) continue;
            let n = enemyBoard[i].clonarParaCombate();
            if (n.objetos && n.objetos.includes("Cuchara Peculiar") && n.reduceSpDefense === 0) {
                n.reduceSpDefense = 0.45; n.duracionReduccion = 3;
            }
            if (n.objetos && n.objetos.includes("Roca del Rey") && n.reduceDefense === 0) {
                n.reduceDefense = 0.45; n.duracionReduccion = 3;
            }
            n.damageDealt = 0; n.damageTaken = 0; n.healingDone = 0; n.damageBlocked = 0;
            n.muerto = false; n.equipo = 'enemy'; n.metronomoBonus = 1; n.energiaLista = false;
            n.energy = n.pokemon.startingEnergy || 0; n.critGuaranteed = false;
            n._regenAccumulator = 0; n.regenTimer = 0; n._deathLogged = false; n._reviviendo = false; n._regenLogged = false;
            n.ultiCarga = 0; n.ultiLista = false; n._ultiAvisada = false;
            n._ultiCargadaAntesDelAtaque = false; n._cooldownAtaque = 0; n._ultiDeInicioLanzada = false;
            n._hojaAfiladaIntervalId = null; n._hojaAfiladaActiva = false; n._hojaAfiladaFin = 0;
            n._iconoEscudoRotoFin = 0; n._iconoEscudoRotoTipo = null;
            n._iconoEscudoRotoIntervalId = null;
            const coords = coordsDesdeIndice(i, 'enemy');
            n._indiceActual = i; n._indiceTablero = 'enemy';
            n._filaGlobal = coords._filaGlobal; n._colGlobal = coords._colGlobal;
            n.enlaceDolor = null; n.taunt = null; n.inmuneObjetivo = false;
            n.esquirlasHielo = 0; n._golpeDoble = false; n.bolasLlamaEmbrujada = 0;
            n.spriteIdAlternativo = null; n.poisonStacks = [];
            n.escudoTimer = 0; n.escudoActivo = false;
            n.golpesAcumulados = 0; n.cargaActiva = false; n.reduccionTimer = 0; n.metronomoStacks = 0;
            n.iraActiva = false; n.iraAliadosCaidos = 0;
            n.comboContador = 0; n.comboActivo = false; n.comboTimer = 0; n.comboVsEscudoActivo = false;
            n.reflejoTimer = 0; n.invulnerableActivo = false; n.invulnerableUsado = false;
            n.debilidadStacks = 0; n.debilidadTimer = 0; n.focusActivo = false;
            n._maxHpOriginalEnlace = null; n._escudosTemporales = []; n._ultimoAtaque = 0;
            n.actualizarStats();
            rivales.push(n); rivalesIndices.push(i);
        }

        window.jugadores = jugadores; window.rivales = rivales;
        window.jugadoresIndices = jugadoresIndices; window.rivalesIndices = rivalesIndices;

        for (let j of jugadores) {
            if (j.movimientoInicial && j.energy < j.energyGauge) {
                j.energy = j.energyGauge; j.movimientoInicial = false;
                addConsoleMessage(`🦞 ${j.pokemon.nombre} usa movimiento al inicio (Garra Rápida)`, 'battle');
            }
        }
        for (let r of rivales) {
            if (r.movimientoInicial && r.energy < r.energyGauge) { r.energy = r.energyGauge; r.movimientoInicial = false; }
        }
        jugadores.forEach(j => { if (j.tieneDiscoUlti) _dispararUltisDeInicio(j, jugadores, rivales); });
        rivales.forEach(r => { if (r.tieneDiscoUlti) _dispararUltisDeInicio(r, rivales, jugadores); });

        if (typeof iniciarTimerArticuno === 'function') iniciarTimerArticuno();

        actualizarStatsEnVivo(jugadores, rivales);

        let tickCounter = 0;
        const MAX_TICKS = COMBAT_CONFIG.MAX_TICKS;
        const TICK_INTERVAL_BASE = COMBAT_CONFIG.TICK_INTERVAL;
        let duracion = 0;
        let ghostTimers = {};
        let windTimers = {};
        const tiempoInicioCombate = performance.now();
        const TIEMPO_OVERTIME = 29;
        const MULTIPLICADOR_OVERTIME = 3;
        const contadorHeader = document.getElementById('combateTimerHeader');
        const contadorHeaderValor = document.getElementById('combateTimerValor');
        if (contadorHeader) { contadorHeader.style.display = 'inline-flex'; contadorHeader.classList.remove('overtime'); }
        if (contadorHeaderValor) contadorHeaderValor.textContent = '0s';
        window._overtimeAnunciado = false;
        addConsoleMessage(`⚔️ ¡El combate comienza! (máx 90s)`, 'battle');

        // 🆕 FIX: contador de segundos independiente del bucle de combate.
        // El bucle usa setTimeout (que el navegador puede retrasar con lag/GC),
        // así que si el contador dependía solo de él se congelaba y luego saltaba.
        const _combatTimerInterval = setInterval(() => {
            const t = (performance.now() - tiempoInicioCombate) / 1000;
            const v = document.getElementById('combateTimerValor');
            if (v) v.textContent = Math.floor(t) + 's';
            const h = document.getElementById('combateTimerHeader');
            if (h) { if (t >= TIEMPO_OVERTIME) h.classList.add('overtime'); else h.classList.remove('overtime'); }
        }, 250);

        while (jugadores.length > 0 && rivales.length > 0 && tickCounter < MAX_TICKS) {
            const tiempoTranscurrido = (performance.now() - tiempoInicioCombate) / 1000;
            if (contadorHeaderValor) contadorHeaderValor.textContent = Math.floor(tiempoTranscurrido) + 's';
            const enOvertime = (tiempoTranscurrido >= TIEMPO_OVERTIME);
            if (contadorHeader) { if (enOvertime) contadorHeader.classList.add('overtime'); else contadorHeader.classList.remove('overtime'); }
            if (enOvertime && !window._overtimeAnunciado) {
                window._overtimeAnunciado = true;
                addConsoleMessage(`⏰ ¡OVERTIME! El combate se acelera x3`, 'battle');
            }
            const multiplicadorOvertime = enOvertime ? MULTIPLICADOR_OVERTIME : 1;
            const TICK_INTERVAL = TICK_INTERVAL_BASE / multiplicadorOvertime;
            const ATTACK_DELAY_ACTUAL = COMBAT_CONFIG.ATTACK_DELAY / multiplicadorOvertime;
            const MOVEMENT_DELAY_ACTUAL = COMBAT_CONFIG.MOVEMENT_DELAY / multiplicadorOvertime;
            tickCounter++;
            duracion += TICK_INTERVAL;

            // --- Escudos, regen, veneno, debilidad ---
            for (let j of jugadores) {
                if (j.hp <= 0 || j.muerto) continue;
                if (j.escudoPorcentaje > 0) {
                    j.escudoTimer += TICK_INTERVAL;
                    if (j.escudoTimer >= j.escudoIntervalo) {
                        j.escudoTimer = 0;
                        let escudo = Math.floor(j.maxHp * j.escudoPorcentaje);
                        j.escudoActual += escudo; j.escudoActivo = true;
                        setTimeout(() => { j.escudoActual = Math.max(0, j.escudoActual - escudo); j.escudoActivo = false; }, j.escudoDuracion * 1000);
                    }
                }
                procesarRegeneracion(j, TICK_INTERVAL);
                if (j.debilidadStack > 0 && j.debilidadStacks > 0) {
                    j.debilidadTimer += TICK_INTERVAL;
                    if (j.debilidadTimer >= j.debilidadDuracion) { j.debilidadStacks = Math.max(0, j.debilidadStacks - 1); j.debilidadTimer = 0; }
                }
                if (j.poisonStacks && j.poisonStacks.length > 0) procesarVeneno(j, TICK_INTERVAL);
            }
            for (let r of rivales) {
                if (r.hp <= 0 || r.muerto) continue;
                if (r.escudoPorcentaje > 0) {
                    r.escudoTimer += TICK_INTERVAL;
                    if (r.escudoTimer >= r.escudoIntervalo) {
                        r.escudoTimer = 0;
                        let escudo = Math.floor(r.maxHp * r.escudoPorcentaje);
                        r.escudoActual += escudo; r.escudoActivo = true;
                        setTimeout(() => { r.escudoActual = Math.max(0, r.escudoActual - escudo); r.escudoActivo = false; }, r.escudoDuracion * 1000);
                    }
                }
                procesarRegeneracion(r, TICK_INTERVAL);
                if (r.debilidadStack > 0 && r.debilidadStacks > 0) {
                    r.debilidadTimer += TICK_INTERVAL;
                    if (r.debilidadTimer >= r.debilidadDuracion) { r.debilidadStacks = Math.max(0, r.debilidadStacks - 1); r.debilidadTimer = 0; }
                }
                if (r.poisonStacks && r.poisonStacks.length > 0) procesarVeneno(r, TICK_INTERVAL);
            }

            // --- Taunts ---
            for (let j of jugadores) {
                if (j && j.taunt) {
                    j.taunt.timer += TICK_INTERVAL;
                    if (j.taunt.timer >= j.taunt.duracion || !j.taunt.atacante || j.taunt.atacante.hp <= 0 || j.taunt.atacante.muerto) j.taunt = null;
                }
            }
            for (let r of rivales) {
                if (r && r.taunt) {
                    r.taunt.timer += TICK_INTERVAL;
                    if (r.taunt.timer >= r.taunt.duracion || !r.taunt.atacante || r.taunt.atacante.hp <= 0 || r.taunt.atacante.muerto) r.taunt = null;
                }
            }

            // --- Fantasma ---
            for (let j of jugadores) {
                if (j && j.hp > 0 && !j.muerto && j.pokemon.tipos && j.pokemon.tipos.includes("Fantasma") && !j.ghostState && !j.ghostPermanent) {
                    const key = j.pokemon.id + '_' + jugadoresIndices[jugadores.indexOf(j)];
                    if (!ghostTimers[key]) ghostTimers[key] = 0;
                    ghostTimers[key] += TICK_INTERVAL;
                    if (ghostTimers[key] >= j.ghostActivationTime) { j.entrarGhost(); ghostTimers[key] = 0; }
                }
                if (j && j.hp > 0 && !j.muerto && j.pokemon.tipos && j.pokemon.tipos.includes("Fantasma") && j.ghostPermanent && !j.ghostState) {
                    j.entrarGhost();
                }
            }
            for (let r of rivales) {
                if (r && r.hp > 0 && !r.muerto && r.pokemon.tipos && r.pokemon.tipos.includes("Fantasma") && !r.ghostState && !r.ghostPermanent) {
                    const key = r.pokemon.id + '_' + rivalesIndices[rivales.indexOf(r)];
                    if (!ghostTimers[key]) ghostTimers[key] = 0;
                    ghostTimers[key] += TICK_INTERVAL;
                    if (ghostTimers[key] >= r.ghostActivationTime) { r.entrarGhost(); ghostTimers[key] = 0; }
                }
                if (r && r.hp > 0 && !r.muerto && r.pokemon.tipos && r.pokemon.tipos.includes("Fantasma") && r.ghostPermanent && !r.ghostState) {
                    r.entrarGhost();
                }
            }

            // --- Volador ---
            for (let j of jugadores) {
                if (j && j.hp > 0 && !j.muerto && j.isVolador) {
                    const sinergia = getSinergiasActivas().types["Volador"];
                    if (sinergia) {
                        const bonus = sinergia.bonus;
                        const key = j.pokemon.id + '_volador';
                        if (!windTimers[key]) windTimers[key] = { barrier: 0, gust: 0 };
                        if (bonus.windBarrier) {
                            windTimers[key].barrier += TICK_INTERVAL;
                            if (windTimers[key].barrier >= bonus.windBarrierInterval) {
                                j.windBarrierActive = true;
                                j.bonusDamageReduction *= (1 - bonus.windBarrierReduction);
                                j.actualizarStats();
                                setTimeout(() => { j.windBarrierActive = false; j.bonusDamageReduction /= (1 - bonus.windBarrierReduction); j.actualizarStats(); }, bonus.windBarrierDuration * 1000);
                                windTimers[key].barrier = 0;
                            }
                        }
                        if (bonus.windGust) {
                            windTimers[key].gust += TICK_INTERVAL;
                            if (windTimers[key].gust >= bonus.windGustInterval) {
                                j.windGustActive = true;
                                j.bonusAttackSpeed *= (1 + bonus.windGustSpeed);
                                j.actualizarStats();
                                setTimeout(() => { j.windGustActive = false; j.bonusAttackSpeed /= (1 + bonus.windGustSpeed); j.actualizarStats(); }, bonus.windGustDuration * 1000);
                                windTimers[key].gust = 0;
                            }
                        }
                    }
                }
            }
            for (let r of rivales) {
                if (r && r.hp > 0 && !r.muerto && r.isVolador) {
                    const sinergia = getSinergiasActivasEnemigo().types["Volador"];
                    if (sinergia) {
                        const bonus = sinergia.bonus;
                        const key = r.pokemon.id + '_volador_enemy';
                        if (!windTimers[key]) windTimers[key] = { barrier: 0, gust: 0 };
                        if (bonus.windBarrier) {
                            windTimers[key].barrier += TICK_INTERVAL;
                            if (windTimers[key].barrier >= bonus.windBarrierInterval) {
                                r.windBarrierActive = true;
                                r.bonusDamageReduction *= (1 - bonus.windBarrierReduction);
                                r.actualizarStats();
                                setTimeout(() => { r.windBarrierActive = false; r.bonusDamageReduction /= (1 - bonus.windBarrierReduction); r.actualizarStats(); }, bonus.windBarrierDuration * 1000);
                                windTimers[key].barrier = 0;
                            }
                        }
                        if (bonus.windGust) {
                            windTimers[key].gust += TICK_INTERVAL;
                            if (windTimers[key].gust >= bonus.windGustInterval) {
                                r.windGustActive = true;
                                r.bonusAttackSpeed *= (1 + bonus.windGustSpeed);
                                r.actualizarStats();
                                setTimeout(() => { r.windGustActive = false; r.bonusAttackSpeed /= (1 + bonus.windGustSpeed); r.actualizarStats(); }, bonus.windGustDuration * 1000);
                                windTimers[key].gust = 0;
                            }
                        }
                    }
                }
            }

            // --- Articuno ---
            if (articunoUnidad && articunoVisible && !articunoActivado) actualizarArticunoTimer();
            if (window.articunoEnemigoUnidad && !window.articunoEnemigoActivado) {
                window.articunoEnemigoTimer = (window.articunoEnemigoTimer || 0) + TICK_INTERVAL;
                if (window.articunoEnemigoTimer >= 10) {
                    window.articunoEnemigoActivado = true;
                    addConsoleMessage(`❄️ ¡ARTICUNO ENEMIGO usa VENTISCA!`, 'battle');
                    for (let jugador of jugadores) {
                        if (jugador && jugador.hp > 0 && !jugador.muerto) {
                            let damage = Math.floor(jugador.maxHp * 0.25) + Math.floor(jugador.hp * 0.08);
                            jugador.hp = Math.max(0, jugador.hp - damage);
                            jugador.damageTaken += damage;
                            actualizarCopiaEstadisticas(jugador, 'damageTaken', damage);
                            jugador.frozen = true; jugador.frozenRealInicio = performance.now();
                            jugador.frozenDuracion = 3; jugador.frozenTimer = 3;
                            let pos = obtenerPosicionUnidadActual(jugador);
                            mostrarEfectoImpacto(pos.x, pos.y, false, true);
                            mostrarNumeroDaño(pos.x, pos.y, damage, false);
                            if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, jugador.hp, jugador.maxHp, damage, jugador);
                        }
                    }
                    window.articunoEnemigoUnidad = null;
                }
            }

            // --- Movimiento ---
            let huboMovimiento = false;
            for (let j of jugadores) {
                if (j.hp <= 0 || j.muerto) continue;
                if (j._knockbackUntil && j._knockbackUntil > performance.now()) continue;
                let objetivoMovimiento = null;
                if (j.taunt && j.taunt.atacante && j.taunt.atacante.hp > 0 && !j.taunt.atacante.muerto) objetivoMovimiento = j.taunt.atacante;
                const listaObjetivos = objetivoMovimiento ? [objetivoMovimiento] : rivales;
                if (esPokemonMelee(j)) { if (moverMeleeHaciaEnemigo(j, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
                else { if (moverRangedHaciaEnemigo(j, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
            }
            for (let r of rivales) {
                if (r.hp <= 0 || r.muerto) continue;
                if (r._knockbackUntil && r._knockbackUntil > performance.now()) continue;
                let objetivoMovimiento = null;
                if (r.taunt && r.taunt.atacante && r.taunt.atacante.hp > 0 && !r.taunt.atacante.muerto) objetivoMovimiento = r.taunt.atacante;
                const listaObjetivos = objetivoMovimiento ? [objetivoMovimiento] : jugadores;
                if (esPokemonMelee(r)) { if (moverMeleeHaciaEnemigo(r, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
                else { if (moverRangedHaciaEnemigo(r, listaObjetivos, jugadores, rivales)) huboMovimiento = true; }
            }
            if (huboMovimiento) {
                renderizarCombate();
                await new Promise(r => setTimeout(r, MOVEMENT_DELAY_ACTUAL));
            }

            // --- Ataques ---
            let todos = [];
            for (let j of jugadores) {
                if (j && j.hp > 0 && !j.muerto) {
                    if (j.frozen) {
                        if (j.frozenRealInicio === undefined || j.frozenRealInicio === null) { j.frozenRealInicio = performance.now(); j.frozenDuracion = j.frozenDuracion || 3; }
                        const transcurridoFrozen = (performance.now() - j.frozenRealInicio) / 1000;
                        if (transcurridoFrozen >= j.frozenDuracion) { j.frozen = false; j.frozenRealInicio = null; j.frozenTimer = 0; }
                        else continue;
                    }
                    todos.push({ unidad: j, lado: 'player', vel: j.velocidadAtaque });
                }
            }
            for (let r of rivales) {
                if (r && r.hp > 0 && !r.muerto) {
                    if (r.frozen) {
                        if (r.frozenRealInicio === undefined || r.frozenRealInicio === null) { r.frozenRealInicio = performance.now(); r.frozenDuracion = r.frozenDuracion || 3; }
                        const transcurridoFrozen = (performance.now() - r.frozenRealInicio) / 1000;
                        if (transcurridoFrozen >= r.frozenDuracion) { r.frozen = false; r.frozenRealInicio = null; r.frozenTimer = 0; }
                        else continue;
                    }
                    todos.push({ unidad: r, lado: 'enemy', vel: r.velocidadAtaque });
                }
            }
            todos.sort((a, b) => (b.vel * 0.6) - (a.vel * 0.6));

            for (let at of todos) {
                if (at.unidad.hp <= 0 || at.unidad.muerto) continue;
                const ahora = performance.now();
                if (typeof at.unidad._ultimoAtaque === 'undefined') at.unidad._ultimoAtaque = 0;
                const velEfectiva = Math.min((at.unidad.velocidadAtaque || 0.7) * multiplicadorOvertime, 5.0);
                const cooldownMs = 1000 / Math.max(0.1, velEfectiva);
                const tiempoDesdeUltimoAtaque = ahora - at.unidad._ultimoAtaque;
                if (tiempoDesdeUltimoAtaque < cooldownMs) continue;
                at.unidad._ultiCargadaAntesDelAtaque = at.unidad.ultiLista || false;

                let objetivos = at.lado === 'player' ? rivales : jugadores;
                let vivos = objetivos.filter(o => o.hp > 0 && !o.muerto);
                if (vivos.length === 0) break;

                const esMelee = esPokemonMelee(at.unidad);
                const rangoAtacante = esMelee ? 1 : obtenerRangoAtaque(at.unidad);
                if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(at.unidad);

                let enRangoDeAtaque = vivos.filter(o => distanciaEnRango(at.unidad, o, rangoAtacante));
                if (at.unidad.taunt && at.unidad.taunt.atacante) {
                    const taunter = at.unidad.taunt.atacante;
                    if (taunter && taunter.hp > 0 && !taunter.muerto) {
                        enRangoDeAtaque = enRangoDeAtaque.includes(taunter) ? [taunter] : [];
                    }
                }
                if (enRangoDeAtaque.length === 0) continue;
                objetivos = enRangoDeAtaque;
                vivos = enRangoDeAtaque;

                let targetInfo = seleccionarObjetivoPrioridad(at.unidad, 0, objetivos, esMelee);
                let target = null;
                if (targetInfo) target = targetInfo.unidad;
                if (!target || objetivos.indexOf(target) === -1) target = vivos[Math.floor(Math.random() * vivos.length)];
                if (!target) continue;

                let pos = obtenerPosicionUnidadActual(target);
                let velocidadAtaqueOriginal = at.unidad.velocidadAtaque;
                if (at.unidad.velocidadVsEscudo > 0 && target.escudoActual > 0) {
                    at.unidad.velocidadAtaque *= (1 + at.unidad.velocidadVsEscudo);
                    if (!at.unidad.comboVsEscudoActivo) at.unidad.comboVsEscudoActivo = true;
                }

                let crit = at.unidad.critGuaranteed || (Math.random() < (at.unidad.pokemon.critRate || 0.25));
                if (crit && typeof playSonidoCritico === 'function') playSonidoCritico();

                let daño;
                let usarEspecial = at.unidad.ataqueEspecial > at.unidad.ataque;
                if (at.unidad.ultiTragamisilActiva) usarEspecial = true;
                let multiplicadorCrit = crit ? 1.5 : 1;
                // ⚠️ NO volver a multiplicar por bonusAttack: `at.unidad.ataque`
                // y `ataqueEspecial` ya incluyen bonusAttack/bonusSpAttack y
                // bonusDamage (Unidad.actualizarStats).
                let dañoExtraMaxHp = 0;
                let indiceMovimientoActivo = (at.unidad.movimientoActivo === 'secundario' && at.unidad.movSecundarioDesbloqueado) ? 1 : 0;

                if (at.unidad.objetos && at.unidad.objetos.includes("Metrónomo") && !usarEspecial) {
                    metronomoGlobalStacks = Math.min(metronomoGlobalStacks + 1, METRONOMO_MAXIMO);
                    let bonus = metronomoGlobalStacks * METRONOMO_BONUS_POR_ATAQUE;
                    let aliados = at.lado === 'player' ? jugadores : rivales;
                    for (let aliado of aliados) {
                        if (aliado && aliado.hp > 0 && !aliado.muerto) {
                            aliado.metronomoBonus = 1 + bonus;
                            aliado.bonusMoveDamage = (aliado.bonusMoveDamage || 1) * aliado.metronomoBonus;
                            aliado.actualizarStats();
                        }
                    }
                }
                if (at.unidad.metronomoBonus > 1) {
                    at.unidad.bonusMoveDamage = (at.unidad.bonusMoveDamage || 1) * at.unidad.metronomoBonus;
                    at.unidad.actualizarStats();
                }

                if (at.unidad.dañoPorcentajeMaxHP > 0 && !usarEspecial) dañoExtraMaxHp = Math.floor(at.unidad.maxHp * at.unidad.dañoPorcentajeMaxHP);
                if (at.unidad.dañoPorcentajeMaxHPObjetivo > 0 && !usarEspecial) dañoExtraMaxHp += Math.floor(target.maxHp * at.unidad.dañoPorcentajeMaxHPObjetivo);
                if (at.unidad.moveMaxHpDamage > 0 && usarEspecial) dañoExtraMaxHp = Math.floor(at.unidad.maxHp * at.unidad.moveMaxHpDamage);

                if (at.unidad.cargaGolpes > 0) {
                    at.unidad.golpesAcumulados++;
                    if (at.unidad.golpesAcumulados >= at.unidad.cargaGolpes) {
                        at.unidad.cargaActiva = true;
                        at.unidad.bonusDamage *= (1 + at.unidad.cargaDaño);
                        at.unidad.actualizarStats();
                        at.unidad.golpesAcumulados = 0;
                        setTimeout(() => { at.unidad.cargaActiva = false; at.unidad.bonusDamage /= (1 + at.unidad.cargaDaño); at.unidad.actualizarStats(); }, 3000);
                    }
                }
                if (at.unidad.comboAtaques > 0) {
                    at.unidad.comboContador++;
                    if (at.unidad.comboContador >= at.unidad.comboAtaques && !at.unidad.comboActivo) {
                        at.unidad.comboActivo = true;
                        at.unidad.bonusAttackSpeed *= (1 + at.unidad.comboVelocidad);
                        at.unidad.actualizarStats();
                        at.unidad.comboContador = 0;
                        setTimeout(() => { at.unidad.comboActivo = false; at.unidad.bonusAttackSpeed /= (1 + at.unidad.comboVelocidad); at.unidad.actualizarStats(); }, at.unidad.comboDuracion * 1000);
                    }
                }
                // 🆕 FIX: "Seguro Debilidad" es un objeto DEFENSIVO (reduce el daño
                // recibido y acumula stacks al ser golpeado, ver Unidad.recibirDaño).
                // Antes se mutaba bonusDamage del atacante en cada básico y nunca se
                // revertía, multiplicando su daño de forma exponencial. Eliminado.

                if (usarEspecial) {
                    let baseDamage = (at.unidad.ataqueEspecial * multiplicadorCrit) + dañoExtraMaxHp;
                    let reduccion = target.defensaEspecial / (target.defensaEspecial + (window.DEFENSA_K || 100));
                    daño = Math.max(1, Math.floor(baseDamage * (1 - reduccion)));
                    if (at.unidad.pokemon.tipos && at.unidad.pokemon.tipos.includes("Psíquico")) {
                        const sinergiaPsiquica = getSinergiasActivas().types["Psíquico"];
                        if (sinergiaPsiquica && sinergiaPsiquica.bonus.moveDamageStack) {
                            at.unidad.moveDamageStacks = Math.min(at.unidad.moveDamageStacks + 1, 10);
                            const bonus = at.unidad.moveDamageStacks * sinergiaPsiquica.bonus.moveDamageStack;
                            at.unidad.bonusMoveDamage = 1 + bonus;
                            at.unidad.actualizarStats();
                        }
                    }
                } else {
                    let baseDamage = (at.unidad.ataque * multiplicadorCrit) + dañoExtraMaxHp;
                    let reduccion = target.defensa / (target.defensa + (window.DEFENSA_K || 100));
                    daño = Math.max(1, Math.floor(baseDamage * (1 - reduccion)));
                }

                const hpAntes = target.hp;
                if (window.DEBUG_COMBATE_LOG) {
                    addConsoleMessage(
                        `⚔️ BÁSICO ${at.unidad.pokemon.nombre} → ${target.pokemon.nombre}: ${daño}` +
                        `${crit ? ' CRIT' : ''}${usarEspecial ? ' ESP' : ''} ` +
                        `(${Math.round(hpAntes)}→${Math.round(Math.max(0, hpAntes - daño))}/${target.maxHp} HP)`,
                        'battle'
                    );
                }

                if (at.unidad.ultiTragamisilActiva) daño = Math.floor(daño * at.unidad.ultiTragamisilDaño);
                at.unidad.velocidadAtaque = velocidadAtaqueOriginal;
                at.unidad.comboVsEscudoActivo = false;
                at.unidad.damageDealt += daño;
                actualizarCopiaEstadisticas(at.unidad, 'damageDealt', daño);

                let origenPos = obtenerPosicionUnidadActual(at.unidad);
                mostrarAnimacionAtaquePokemon(
                    { elemento: origenPos.elemento, unidad: at.unidad },
                    { x: pos.x, y: pos.y, elemento: pos.elemento, unidad: target },
                    daño, crit, at.unidad.areaDamage, usarEspecial, esMelee
                );

                if (at.unidad.ultiTragamisilActiva && origenPos.elemento && pos.elemento && typeof mostrarProyectilBasico === 'function') {
                    try {
                        const rO = origenPos.elemento.getBoundingClientRect();
                        const rD = pos.elemento.getBoundingClientRect();
                        const x1 = rO.left + rO.width / 2, y1 = rO.top + rO.height / 2;
                        const x2 = rD.left + rD.width / 2, y2 = rD.top + rD.height / 2;
                        const dx = x2 - x1, dy = y2 - y1;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const dur = Math.max(200, Math.min(500, dist * 0.6));
                        const proy = document.createElement('div');
                        proy.style.cssText = `position:fixed;left:${x1}px;top:${y1}px;width:32px;height:32px;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);filter:drop-shadow(0 0 10px rgba(34,211,238,0.95)) drop-shadow(0 0 20px rgba(34,211,238,0.6));`;
                        proy.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C 6 8, 8 14, 12 20 C 16 14, 18 8, 12 2 Z" fill="#67e8f9" stroke="#e0f2fe" stroke-width="1"/><circle cx="12" cy="11" r="3" fill="#cffafe" opacity="0.7"/></svg>`;
                        document.body.appendChild(proy);
                        const anim = proy.animate([
                            { transform: 'translate(-50%,-50%) scale(0.3)', opacity: 0 },
                            { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1, offset: 0.15 },
                            { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 1 }
                        ], { duration: dur, easing: 'cubic-bezier(0.3,0,0.7,1)', fill: 'forwards' });
                        anim.onfinish = () => { if (proy.parentNode) proy.remove(); };
                    } catch (e) {}
                } else if (!esMelee && origenPos.elemento && pos.elemento && typeof mostrarProyectilBasico === 'function') {
                    mostrarProyectilBasico(at.unidad, target, origenPos.elemento, pos.elemento);
                }

                if (at.unidad.esZacian && at.unidad.metalClaw && Math.random() < 0.3) {
                    let otrosObjetivos = vivos.filter(o => o !== target);
                    if (otrosObjetivos.length > 0) {
                        let segundoTarget = otrosObjetivos[Math.floor(Math.random() * otrosObjetivos.length)];
                        let posSegundo = obtenerPosicionUnidadActual(segundoTarget);
                        let dañoGarra = Math.floor(daño * 0.6);
                        at.unidad.damageDealt += dañoGarra;
                        actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoGarra);
                        segundoTarget.recibirDaño(dañoGarra, at.unidad);
                        mostrarNumeroDaño(posSegundo.x, posSegundo.y, dañoGarra, false);
                        animarUnidadDaño(posSegundo.elemento);
                        if (posSegundo.elemento) actualizarBarraVidaPokemon(posSegundo.elemento, segundoTarget.hp, segundoTarget.maxHp, dañoGarra, segundoTarget);
                    }
                }

                // ============================================================
                // 🛡️ ROCA DEL REY
                // ============================================================
                if (at.unidad.reduceDefense > 0) {
                    const yaTieneDebuffFisico = target._debuffDefFisica && performance.now() < target._debuffDefFisicaFin;
                    if (!yaTieneDebuffFisico) {
                        const defOriginal = target.defensa;
                        const defReducida = Math.max(0, Math.floor(defOriginal * (1 - at.unidad.reduceDefense)));
                        target._debuffDefFisica = true;
                        target._debuffDefFisicaFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                        target._debuffDefFisicaOriginal = defOriginal;
                        target.defensa = defReducida;
                    } else {
                        target._debuffDefFisicaFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                    }
                    if (typeof mostrarIconoEscudoRoto === 'function') mostrarIconoEscudoRoto(target, at.unidad.duracionReduccion, 'fisica');
                    if (typeof renderizarCombate === 'function') renderizarCombate();
                    if (target._debuffDefFisicaTimerId) clearTimeout(target._debuffDefFisicaTimerId);
                    target._debuffDefFisicaTimerId = setTimeout(() => {
                        if (!target || target.hp <= 0 || target.muerto) return;
                        target.defensa = target._debuffDefFisicaOriginal;
                        target._debuffDefFisica = false;
                        target._debuffDefFisicaFin = 0;
                        target._debuffDefFisicaOriginal = null;
                        target._debuffDefFisicaTimerId = null;
                        target._iconoEscudoRotoFin = 0;
                        target._iconoEscudoRotoTipo = null;
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }, at.unidad.duracionReduccion * 1000);
                }

                // ============================================================
                // 🛡️ CUCHARA PECULIAR
                // ============================================================
                if (at.unidad.reduceSpDefense > 0) {
                    const yaTieneDebuffEsp = target._debuffDefEsp && performance.now() < target._debuffDefEspFin;
                    if (!yaTieneDebuffEsp) {
                        const defEspOriginal = target.defensaEspecial;
                        const defEspReducida = Math.max(0, Math.floor(defEspOriginal * (1 - at.unidad.reduceSpDefense)));
                        target._debuffDefEsp = true;
                        target._debuffDefEspFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                        target._debuffDefEspOriginal = defEspOriginal;
                        target.defensaEspecial = defEspReducida;
                    } else {
                        target._debuffDefEspFin = performance.now() + (at.unidad.duracionReduccion * 1000);
                    }
                    if (typeof mostrarIconoEscudoRoto === 'function') mostrarIconoEscudoRoto(target, at.unidad.duracionReduccion, 'especial');
                    if (typeof renderizarCombate === 'function') renderizarCombate();
                    if (target._debuffDefEspTimerId) clearTimeout(target._debuffDefEspTimerId);
                    target._debuffDefEspTimerId = setTimeout(() => {
                        if (!target || target.hp <= 0 || target.muerto) return;
                        target.defensaEspecial = target._debuffDefEspOriginal;
                        target._debuffDefEsp = false;
                        target._debuffDefEspFin = 0;
                        target._debuffDefEspOriginal = null;
                        target._debuffDefEspTimerId = null;
                        target._iconoEscudoRotoFin = 0;
                        target._iconoEscudoRotoTipo = null;
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }, at.unidad.duracionReduccion * 1000);
                }

                // --- Veneno, maldición, muerte ---
                if (at.unidad.poisonInfinite && at.unidad.pokemon.tipos && at.unidad.pokemon.tipos.includes("Veneno") && target && target.hp > 0 && !target.muerto && !target.inmuneImpedimentos) {
                    const dañoVenenoBase = 20;
                    const duracion = at.unidad.poisonStackable ? 999 : 5;
                    if (!target.poisonStacks) target.poisonStacks = [];
                    target.poisonStacks.push({ daño: dañoVenenoBase, tiempoRestante: duracion, tick: 1 });
                }
                if (at.unidad.maldicionDaño > 0) {
                    target.maldicionObjetivo = at.unidad;
                    let dañoMaldicion = Math.floor(target.maxHp * at.unidad.maldicionDaño);
                    target.hp = Math.max(0, target.hp - dañoMaldicion);
                    target.damageTaken += dañoMaldicion;
                    actualizarCopiaEstadisticas(target, 'damageTaken', dañoMaldicion);
                    let curacionMaldicion = Math.floor(dañoMaldicion * at.unidad.maldicionCuracion);
                    at.unidad.healingDone += curacionMaldicion;
                    actualizarCopiaEstadisticas(at.unidad, 'healingDone', curacionMaldicion);
                    at.unidad.hp = Math.min(at.unidad.maxHp, at.unidad.hp + curacionMaldicion);
                    if (at.unidad.maldicionRadio > 0) {
                        let otros = objetivos.filter(o => o !== target && o.hp > 0 && !o.muerto);
                        for (let otro of otros) {
                            let dañoArea = Math.floor(otro.maxHp * at.unidad.maldicionDaño * 0.5);
                            otro.hp = Math.max(0, otro.hp - dañoArea);
                            otro.damageTaken += dañoArea;
                            actualizarCopiaEstadisticas(otro, 'damageTaken', dañoArea);
                        }
                    }
                }

                let murio = target.recibirDaño(daño, at.unidad);
                if (murio) {
                    target.muerto = true;
                    if (pos.elemento) ocultarUnidadMuerta(pos.elemento);
                    addConsoleMessage(`💀 ${target.pokemon.nombre} MURIÓ (recibió ${Math.round(target.damageTaken)} daño total)`, 'battle');
                }
                if (at.unidad._golpeDoble && !murio) {
                    at.unidad.damageDealt += daño;
                    actualizarCopiaEstadisticas(at.unidad, 'damageDealt', daño);
                    const murioDoble = target.recibirDaño(daño, at.unidad);
                    if (typeof mostrarNumeroDaño === 'function') mostrarNumeroDaño(pos.x, pos.y - 10, daño, crit, target.escudoActual > 0, usarEspecial);
                    animarUnidadDaño(pos.elemento);
                    if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, target.hp, target.maxHp, daño, target);
                    if (murioDoble) { target.muerto = true; if (pos.elemento) ocultarUnidadMuerta(pos.elemento); }
                }
                if (at.unidad.ultiTragamisilActiva && at.unidad.ultiTragamisilRebote && !murio) {
                    const otrosObjetivos = vivos.filter(o => o !== target && o.hp > 0 && !o.muerto);
                    if (otrosObjetivos.length > 0) {
                        let masCercano = null, distMin = Infinity;
                        if (typeof movObtenerPosicionGlobal === 'function') {
                            const posTarget = movObtenerPosicionGlobal(target);
                            for (let otro of otrosObjetivos) {
                                const posOtro = movObtenerPosicionGlobal(otro);
                                if (!posTarget || !posOtro) continue;
                                const d = Math.abs(posTarget.fila - posOtro.fila) + Math.abs(posTarget.col - posOtro.col);
                                if (d < distMin) { distMin = d; masCercano = otro; }
                            }
                        }
                        if (!masCercano) masCercano = otrosObjetivos[0];
                        if (masCercano) {
                            const dañoRebote = Math.floor(daño * 0.5);
                            const posRebote = obtenerPosicionUnidadActual(masCercano);
                            at.unidad.damageDealt += dañoRebote;
                            actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoRebote);
                            masCercano.recibirDaño(dañoRebote, at.unidad);
                            if (typeof mostrarNumeroDaño === 'function') mostrarNumeroDaño(posRebote.x, posRebote.y, dañoRebote, false);
                        }
                    }
                }
                if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, target.hp, target.maxHp, daño, target);

                if (target && target.esZacian) {
                    mostrarEfectoImpacto(pos.x, pos.y, crit, at.unidad.areaDamage);
                    mostrarNumeroDaño(pos.x, pos.y - 20, daño, crit);
                    actualizarBarrasZacian();
                }
                if (at.unidad.esZacian && at.unidad.drainCrown) {
                    let curacion = Math.floor(daño * 0.20);
                    at.unidad.hp = Math.min(at.unidad.maxHp, at.unidad.hp + curacion);
                    at.unidad.healingDone += curacion;
                    actualizarCopiaEstadisticas(at.unidad, 'healingDone', curacion);
                    actualizarBarrasZacian();
                }
                                                if (murio && at.unidad.fearAura) {
                    fearAuraStacks++;
                    window.fearAuraStacks = fearAuraStacks;
                    
                    // 🆕 FIX: log de diagnóstico para verificar que sube
                    if (window.DEBUG_COMBATE) {
                        console.log(`😨 fearAuraStacks++ → ${fearAuraStacks} (${at.unidad.pokemon.nombre} mató a ${target.pokemon.nombre})`);
                    }
                    
                    if (typeof actualizarCartaSinergia === 'function') {
                        setTimeout(() => actualizarCartaSinergia(), 100);
                    }
                }
                if (murio && at.lado === 'player') {
                    for (let aliado of jugadores) {
                        if (aliado !== at.unidad && aliado.iraDaño > 0 && !aliado.iraActiva) {
                            aliado.iraAliadosCaidos++;
                            aliado.iraActiva = true;
                            aliado.bonusDamage *= (1 + aliado.iraDaño);
                            aliado.bonusAttackSpeed *= (1 + aliado.iraVelocidad);
                            aliado.actualizarStats();
                        }
                    }
                }
                if (at.unidad.invulnerablePorcentaje > 0 && !at.unidad.invulnerableUsado && at.unidad.hp / at.unidad.maxHp < at.unidad.invulnerablePorcentaje) {
                    at.unidad.invulnerableActivo = true;
                    at.unidad.invulnerableUsado = true;
                    at.unidad.bonusDamageReduction *= 0.01;
                    at.unidad.actualizarStats();
                    setTimeout(() => { at.unidad.invulnerableActivo = false; at.unidad.bonusDamageReduction /= 0.01; at.unidad.actualizarStats(); }, at.unidad.invulnerableDuracion * 1000);
                }

                // --- Energía / ultis / movimientos ---
                let energiaGanada = 2 + Math.floor(Math.random() * 4);
                if (at.unidad.velocidadAtaque > 0.9) {
                    let bonusVelocidad = Math.floor((at.unidad.velocidadAtaque - 0.9) * 10);
                    energiaGanada += Math.min(bonusVelocidad, 4);
                } else if (at.unidad.velocidadAtaque < 0.6) {
                    energiaGanada = Math.max(1, energiaGanada - 1);
                }
                if (crit) energiaGanada += 3;
                if (at.unidad.extraMoveGauge > 0) energiaGanada += Math.floor(at.unidad.extraMoveGauge / 2);
                if (at.unidad.objetos) {
                    for (let obj of at.unidad.objetos) {
                        if (obj === "Pañuelo Elección") energiaGanada += 4;
                        if (obj === "Colgante Carga") energiaGanada += 2;
                    }
                }
                energiaGanada = Math.min(energiaGanada, 15);
                let nuevaEnergia = at.unidad.energy + energiaGanada;
                let ultiDisparada = false;

                const tieneDiscoReal = at.unidad.objetos && at.unidad.objetos.some(o => {
                    const obj = window.OBJETOS && window.OBJETOS[o];
                    return obj && obj.efecto && obj.efecto.esDiscoUlti;
                });
                const tieneDiscoVirtualZacian = at.unidad.esZacian && at.unidad.behemothBlade === true;
                if (!tieneDiscoReal && !tieneDiscoVirtualZacian && at.unidad.tieneDiscoUlti) {
                    at.unidad.tieneDiscoUlti = false;
                    at.unidad.ultiCarga = 0; at.unidad.ultiLista = false; at.unidad._ultiAvisada = false;
                }
                if (at.unidad.tieneDiscoUlti && at.unidad._ultiCargadaAntesDelAtaque) {
                    const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[at.unidad.pokemon.nombre];
                    if (ultiData) {
                        if (ultiData.esDeInicio && at.unidad._ultiDeInicioLanzada) {
                            at.unidad.ultiCarga = 0; at.unidad.ultiLista = false;
                        } else {
                            const nombreSlug = ultiData.id ? ultiData.id : ultiData.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                                                        const ultiFunc = window.ULTIS_REGISTRO && window.ULTIS_REGISTRO[nombreSlug];
                            if (ultiFunc && typeof ultiFunc.ejecutar === 'function') {
                                if (typeof aplicarFactorUlti === 'function') aplicarFactorUlti(at.unidad, nombreSlug, at.unidad.nivel);
                                try {
                                    const aliadosVivosUlti = (at.lado === 'player' ? jugadores : rivales).filter(u => u && u.hp > 0 && !u.muerto);
                                    const enemigosVivosUlti = (at.lado === 'player' ? rivales : jugadores).filter(u => u && u.hp > 0 && !u.muerto);

                                    // 🆕 GRITO DEL POKÉMON ANTES DE LA ULTI
                                    const spriteIdGrito = at.unidad.spriteIdAlternativo || at.unidad.pokemon.spriteId || at.unidad.pokemon.id;
                                    if (typeof playPokemonCry === 'function' && spriteIdGrito) {
                                        try { playPokemonCry(spriteIdGrito); } catch (e) {}
                                    }

                                    const resultado = ultiFunc.ejecutar(at.unidad, target, { enemigos: enemigosVivosUlti, aliados: aliadosVivosUlti, esJugador: at.lado === 'player' });
                                    if (resultado !== false) {
                                        ultiDisparada = true;
                                        at.unidad.ultiCarga = 0; at.unidad.ultiLista = false; at.unidad._ultiAvisada = false;
                                        addConsoleMessage(`⚡ ¡${at.unidad.pokemon.nombre} usa su ULTIMATE!`, 'battle');
                                    }
                                } catch (e) { console.error('❌ Error ejecutando ulti:', e); }
                            }
                        }
                    }
                }

                const tieneDiscoRealCarga = at.unidad.objetos && at.unidad.objetos.some(o => {
                    const obj = window.OBJETOS && window.OBJETOS[o];
                    return obj && obj.efecto && obj.efecto.esDiscoUlti;
                });
                const tieneDiscoVirtualZacianCarga = at.unidad.esZacian && at.unidad.behemothBlade === true;
                if (!tieneDiscoRealCarga && !tieneDiscoVirtualZacianCarga && at.unidad.tieneDiscoUlti) {
                    at.unidad.tieneDiscoUlti = false; at.unidad.ultiCarga = 0; at.unidad.ultiLista = false; at.unidad._ultiAvisada = false;
                }
                if (at.unidad.tieneDiscoUlti && !ultiDisparada && !at.unidad.ultiLista) {
                    const ultiDataCarga = window.ULTIS_POKEMON && window.ULTIS_POKEMON[at.unidad.pokemon.nombre];
                    const esDeInicioYaLanzada = ultiDataCarga && ultiDataCarga.esDeInicio && at.unidad._ultiDeInicioLanzada;
                    const hojaAfiladaActiva = at.unidad._hojaAfiladaActiva === true;
                    const tyranitarBerserkActivo = at.unidad._tyranitarBerserkActivo === true;
                    if (ultiDataCarga && ultiDataCarga.carga && !esDeInicioYaLanzada && !hojaAfiladaActiva && !tyranitarBerserkActivo) {
                        at.unidad.ultiCarga = Math.min(at.unidad.ultiCarga + 1, ultiDataCarga.carga);
                        if (at.unidad.ultiCarga >= ultiDataCarga.carga) {
                            at.unidad.ultiLista = true;
                            if (!at.unidad._ultiAvisada) { at.unidad._ultiAvisada = true; addConsoleMessage(`⚡ ${at.unidad.pokemon.nombre} tiene su ULTI lista!`, 'battle'); }
                        }
                        const posAtkCarga = obtenerPosicionUnidadActual(at.unidad);
                        if (posAtkCarga && posAtkCarga.elemento) {
                            const ultiFillEl = posAtkCarga.elemento.querySelector('.ulti-fill');
                            if (ultiFillEl) {
                                const pct = Math.min(100, (at.unidad.ultiCarga / ultiDataCarga.carga) * 100);
                                ultiFillEl.style.width = pct + '%';
                                if (at.unidad.ultiLista) {
                                    ultiFillEl.style.background = 'linear-gradient(90deg, #fbbf24, #fde68a, #fbbf24)';
                                    ultiFillEl.style.boxShadow = '0 0 12px rgba(251,191,36,0.9), 0 0 20px rgba(251,191,36,0.5)';
                                    ultiFillEl.style.animation = 'pulseUlti 1s ease-in-out infinite';
                                }
                            }
                        }
                    }
                }

                const silenciado = at.unidad._silenciadoHasta && performance.now() < at.unidad._silenciadoHasta;
                if (nuevaEnergia >= at.unidad.energyGauge && !ultiDisparada && !silenciado) {
                    let movimientoEjecutado = false;
                    if (typeof ejecutarMovimiento === 'function') {
                        try {
                            let indiceMov = 0, saltarMovimiento = false;
                            if (at.unidad.esZacian) {
                                const movZacian = at.unidad.zacianMovimiento || "basico";
                                if (movZacian === "basico") saltarMovimiento = true; else indiceMov = 0;
                            }
                            if (saltarMovimiento) {
                                movimientoEjecutado = true; at.unidad.energy = 0;
                            } else {
                                const aliadosVivos = (at.lado === 'player' ? jugadores : rivales).filter(u => u && u.hp > 0 && !u.muerto);
                                const enemigosVivos = (at.lado === 'player' ? rivales : jugadores).filter(u => u && u.hp > 0 && !u.muerto);
                                let indiceMovFinal = indiceMov;
                                if (indiceMov === 0 && at.unidad.movimientoActivo === 'secundario' && at.unidad.movSecundarioDesbloqueado) indiceMovFinal = indiceMovimientoActivo;
                                movimientoEjecutado = ejecutarMovimiento(at.unidad, target, indiceMovFinal, enemigosVivos, aliadosVivos);
                            }
                        } catch (err) { console.error("❌ Error en ejecutarMovimiento:", err); movimientoEjecutado = false; }
                    }
                    if (!movimientoEjecutado) {
                        let dañoExtra = Math.floor(at.unidad.ataqueEspecial * 0.6);
                        if (at.unidad.objetos) {
                            for (let obj of at.unidad.objetos) { if (obj === "Gafas Especiales") dañoExtra = Math.floor(dañoExtra * 1.4); }
                        }
                        addConsoleMessage(`💥 ${at.unidad.pokemon.nombre} usa MOVIMIENTO ESPECIAL! (+${dañoExtra} daño)`, 'battle');
                        at.unidad.damageDealt += dañoExtra;
                        actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoExtra);
                        mostrarNumeroDaño(pos.x, pos.y - 30, dañoExtra, true, target.escudoActual > 0, true);
                        animarUnidadDaño(pos.elemento);
                        let murioExtra = target.recibirDaño(dañoExtra, at.unidad);
                        if (murioExtra) { target.muerto = true; if (pos.elemento) ocultarUnidadMuerta(pos.elemento); }
                        if (pos.elemento) actualizarBarraVidaPokemon(pos.elemento, target.hp, target.maxHp, dañoExtra, target);
                    }
                    if (at.unidad.escudoAllyPorcentaje > 0) {
                        let aliados = at.lado === 'player' ? jugadores : rivales;
                        let aliadoMasDebil = aliados.filter(a => a && a.hp > 0 && !a.muerto && a !== at.unidad).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                        if (aliadoMasDebil) {
                            let escudo = Math.floor(at.unidad.maxHp * at.unidad.escudoAllyPorcentaje);
                            aliadoMasDebil.escudoActual = (aliadoMasDebil.escudoActual || 0) + escudo;
                            let posAliado = obtenerPosicionUnidadActual(aliadoMasDebil);
                            if (posAliado && posAliado.elemento) actualizarBarraVidaPokemon(posAliado.elemento, aliadoMasDebil.hp, aliadoMasDebil.maxHp, 0, aliadoMasDebil);
                        }
                    }
                    at.unidad.energy = 0;
                    at.unidad.energiaLista = false;
                    if (origenPos.elemento) {
                        let energyFill = origenPos.elemento.querySelector('.energy-fill');
                        if (energyFill) {
                            energyFill.classList.remove('full');
                            energyFill.style.transition = 'none';
                            energyFill.style.width = '100%';
                            energyFill.style.boxShadow = '0 0 20px rgba(255,255,255,0.85), 0 0 40px rgba(255,255,255,0.55)';
                            void energyFill.offsetWidth;
                            setTimeout(() => { energyFill.style.transition = 'width 0.35s ease, box-shadow 0.35s ease'; energyFill.style.width = '0%'; energyFill.style.boxShadow = ''; }, 200);
                        }
                    }
                    if (at.unidad.esZacian) actualizarBarrasZacian();
                } else {
                    at.unidad.energy = nuevaEnergia;
                    if (origenPos.elemento) actualizarBarraEnergia(origenPos.elemento, at.unidad.energy, at.unidad.energyGauge);
                    if (at.unidad.esZacian) actualizarBarrasZacian();
                }

                if (at.unidad.lifesteal > 0) {
                    let curacion = Math.floor(daño * at.unidad.lifesteal);
                    at.unidad.hp = Math.min(at.unidad.maxHp, at.unidad.hp + curacion);
                    at.unidad.healingDone += curacion;
                    actualizarCopiaEstadisticas(at.unidad, 'healingDone', curacion);
                    let posAtacante = obtenerPosicionUnidadActual(at.unidad);
                    if (posAtacante.elemento) actualizarBarraVidaPokemon(posAtacante.elemento, at.unidad.hp, at.unidad.maxHp, 0, at.unidad);
                    if (at.unidad.esZacian) actualizarBarrasZacian();
                }
                if (at.unidad.areaDamage) {
                    let otrosObjetivos = vivos.filter(o => o !== target);
                    for (let otro of otrosObjetivos) {
                        let dañoArea = Math.floor(daño * 0.5);
                        at.unidad.damageDealt += dañoArea;
                        actualizarCopiaEstadisticas(at.unidad, 'damageDealt', dañoArea);
                        let posOtro = obtenerPosicionUnidadActual(otro);
                        mostrarNumeroDaño(posOtro.x, posOtro.y, dañoArea, false, otro.escudoActual > 0, usarEspecial);
                        animarUnidadDaño(posOtro.elemento);
                        let murioOtro = otro.recibirDaño(dañoArea, at.unidad);
                        if (murioOtro) { otro.muerto = true; if (posOtro.elemento) ocultarUnidadMuerta(posOtro.elemento); }
                        if (posOtro.elemento) actualizarBarraVidaPokemon(posOtro.elemento, otro.hp, otro.maxHp, dañoArea, otro);
                    }
                }
                if (at.unidad.isVolador && !at.unidad.whirlwindActive) {
                    const sinergiaVolador = at.lado === 'player' ? getSinergiasActivas().types["Volador"] : getSinergiasActivasEnemigo().types["Volador"];
                    if (sinergiaVolador && sinergiaVolador.bonus.whirlwind) {
                        at.unidad.whirlwindActive = true;
                        let enemigos = at.lado === 'player' ? rivales : jugadores;
                        for (let enemy of enemigos) {
                            if (enemy && enemy.hp > 0 && !enemy.muerto) {
                                let damage = Math.floor(enemy.maxHp * 0.10);
                                at.unidad.damageDealt += damage;
                                actualizarCopiaEstadisticas(at.unidad, 'damageDealt', damage);
                                enemy.hp = Math.max(0, enemy.hp - damage);
                                enemy.damageTaken += damage;
                                actualizarCopiaEstadisticas(enemy, 'damageTaken', damage);
                                enemy.bonusAttackSpeed *= 0.60;
                                enemy.actualizarStats();
                                let posEnemy = obtenerPosicionUnidadActual(enemy);
                                mostrarEfectoImpacto(posEnemy.x, posEnemy.y, false, true);
                                mostrarNumeroDaño(posEnemy.x, posEnemy.y, damage, false);
                                if (enemy.hp <= 0) { enemy.muerto = true; if (posEnemy.elemento) ocultarUnidadMuerta(posEnemy.elemento); }
                                setTimeout(() => { enemy.bonusAttackSpeed /= 0.60; enemy.actualizarStats(); }, 3000);
                            }
                        }
                    }
                }

                at.unidad._ultimoAtaque = performance.now();
                actualizarBarrasZacian();
                // 🆕 Hit-stop: los críticos o golpes muy fuertes hacen una pausa breve
                // para que el impacto "pese" visualmente.
                const hitStopMs = (crit || daño >= 180) ? 45 : 0;
                await new Promise(r => setTimeout(r, (ATTACK_DELAY_ACTUAL * 1000) + hitStopMs));

                let jugadoresVivosCheck = jugadores.filter(j => j.hp > 0 && !j.muerto);
                let rivalesVivosCheck = rivales.filter(r => r.hp > 0 && !r.muerto);
                if (jugadoresVivosCheck.length === 0 || rivalesVivosCheck.length === 0) break;
            }

            // --- Burn ---
            if (tickCounter % 3 === 0) {
                for (let j of jugadores) {
                    if (j.hp > 0 && !j.muerto && j.burnDamage > 0) {
                        let dañoQuemadura = j.aplicarQuemadura(0.03);
                        let posJ = obtenerPosicionUnidadActual(j);
                        mostrarNumeroDaño(posJ.x, posJ.y - 30, dañoQuemadura, false, false, false, posJ.elemento || null);
                        if (posJ.elemento) actualizarBarraVidaPokemon(posJ.elemento, j.hp, j.maxHp, dañoQuemadura, j);
                        if (j.esZacian) actualizarBarrasZacian();
                        if (j.hp <= 0) { j.muerto = true; if (posJ.elemento) ocultarUnidadMuerta(posJ.elemento); }
                    }
                }
                for (let r of rivales) {
                    if (r.hp > 0 && !r.muerto && r.burnDamage > 0) {
                        let dañoQuemadura = r.aplicarQuemadura(0.03);
                        let posR = obtenerPosicionUnidadActual(r);
                        mostrarNumeroDaño(posR.x, posR.y - 30, dañoQuemadura, false, false, false, posR.elemento || null);
                        if (posR.elemento) actualizarBarraVidaPokemon(posR.elemento, r.hp, r.maxHp, dañoQuemadura, r);
                        if (r.hp <= 0) { r.muerto = true; if (posR.elemento) ocultarUnidadMuerta(posR.elemento); }
                    }
                }
            }

            if (tickCounter % COMBAT_CONFIG.STATS_REFRESH_TICKS === 0) actualizarStatsEnVivo(jugadores, rivales);

            for (let j of jugadores) {
                if (j.hp <= 0 && !j._deathLogged) {
                    j._deathLogged = true;
                    if (j.equipo === 'player' && typeof sumarSemillasPorCaido === 'function') sumarSemillasPorCaido(j, 'player');
                    j.ultiCarga = 0; j.ultiLista = false; j._ultiAvisada = false;
                }
            }
            for (let r of rivales) {
                if (r.hp <= 0 && !r._deathLogged) {
                    r._deathLogged = true;
                    if (window.modoDosJugadores && r.equipo === 'enemy' && typeof sumarSemillasPorCaido === 'function') sumarSemillasPorCaido(r, 'enemy');
                    r.ultiCarga = 0; r.ultiLista = false; r._ultiAvisada = false;
                }
            }

            let jugadoresVivos = jugadores.filter(j => j.hp > 0 && !j.muerto);
            let rivalesVivos = rivales.filter(r => r.hp > 0 && !r.muerto);
            if (jugadoresVivos.length === 0 || rivalesVivos.length === 0) {
                break;
            }
            await new Promise(r => setTimeout(r, TICK_INTERVAL * 1000));
        }

                // ==== Fin del combate ====
        const duracionReal = (performance.now() - tiempoInicioCombate) / 1000;
        addConsoleMessage(`⏱️ Combate terminado en ${duracionReal.toFixed(1)}s (tick=${tickCounter})`, 'battle');
        if (typeof ocultarTimerCombate === 'function') ocultarTimerCombate();
        clearInterval(_combatTimerInterval);
        actualizarStatsEnVivo(jugadores, rivales);
        if (window.statsCombateEnVivo) window.statsCombateEnVivo.activo = false;

        // ============================================================
        // 🆕 FIX PvE: detectar si es ronda PvE
        // ============================================================
        // `esPvE` se usa más abajo para:
        //   - aplicar recompensas PvE (aplicarRecompensasPvE)
        //   - saltarse la reducción de HP en PvE
        //   - saltarse mostrarReaccionEnemigo en PvE
        //   - pasar `esPvE` a ejecutarFinDeRonda(victoria, esPvE)
        //
        // Si esta línea falta, salta:
        //   ReferenceError: esPvE is not defined
        // ============================================================
        const esPvE = window.enRondaPvE === true;

        let victoria = false;
        let jugadoresVivosFinal = jugadores.filter(j => j.hp > 0 && !j.muerto);
        let rivalesVivosFinal = rivales.filter(r => r.hp > 0 && !r.muerto);
        if (jugadoresVivosFinal.length > 0 && rivalesVivosFinal.length === 0) {
            victoria = true;
        } else if (jugadoresVivosFinal.length === 0 && rivalesVivosFinal.length > 0) {
            victoria = false;
        } else if (jugadoresVivosFinal.length === 0 && rivalesVivosFinal.length === 0) {
            victoria = false;
        } else if (tickCounter >= MAX_TICKS) {
            victoria = jugadoresVivosFinal.length > rivalesVivosFinal.length;
        } else {
            victoria = jugadoresVivosFinal.length > 0;
        }

        for (let i = 0; i < equipoCompletoJugador.length; i++) {
            let copia = equipoCompletoJugador[i];
            let original = jugadores.find(j => j.pokemon.id === copia.pokemon.id && j.baseId === copia.baseId);
            if (original) {
                copia.damageDealt = original.damageDealt || 0;
                copia.damageTaken = original.damageTaken || 0;
                copia.healingDone = original.healingDone || 0;
                copia.damageBlocked = original.damageBlocked || 0;
                copia.hp = original.hp || 0;
                copia.muerto = original.muerto || false;
            }
        }
        for (let i = 0; i < equipoCompletoEnemigo.length; i++) {
            let copia = equipoCompletoEnemigo[i];
            let original = rivales.find(r => r.pokemon.id === copia.pokemon.id && r.baseId === copia.baseId);
            if (original) {
                copia.damageDealt = original.damageDealt || 0;
                copia.damageTaken = original.damageTaken || 0;
                copia.healingDone = original.healingDone || 0;
                copia.damageBlocked = original.damageBlocked || 0;
                copia.hp = original.hp || 0;
                copia.muerto = original.muerto || false;
            }
        }

                        let interes = getInteres();
        let rachaBonus = getRachaBonus();

        // 🆕 BALANCE TFT: daño base + 1 por unidad viva del ganador
        let daño;
        if (victoria) {
            daño = getDañoRealPorDerrota(jugadoresVivosFinal.length);
        } else {
            daño = getDañoRealPorDerrota(rivalesVivosFinal.length);
        }

        let ganancia = 5 + interes + (victoria ? 1 : 0) + rachaBonus;
        let gananciaReal = ganancia;
        if (fase <= 1) {
            gananciaReal = 0;
            addConsoleMessage(`💰 Ronda 1: sin recompensa de oro (fase de arranque)`, 'info');
        }
        if (victoria && fase > 1) {
            for (let j of jugadores) {
                if (j.monedaExtra > 0 && !j.muerto) {
                    gananciaReal += j.monedaExtra;
                    addConsoleMessage(`💎 ${j.pokemon.nombre} gana ${j.monedaExtra} moneda extra!`, 'buy');
                }
            }
        }
                // 🆕 GUARDAR RESULTADOS PARA EL RANKING
        window._ultimaVictoriaJugador = victoria;
        window._ultimoDanoRecibidoJugador = victoria ? 0 : daño;
        // ---------------------------------------

        oro += gananciaReal;
        if (window.modoDosJugadores && fase > 1) {
            const interesEnemigo = Math.min(3, Math.floor(enemyGold / 10));
            const rachaEnemigoNum = -racha;
            const rachaEnemigo = rachaEnemigoNum >= 5 ? 3 : rachaEnemigoNum >= 3 ? 2 : rachaEnemigoNum >= 2 ? 1 : rachaEnemigoNum <= -4 ? 2 : rachaEnemigoNum <= -2 ? 1 : 0;
            const ingresoEnemigo = 5 + interesEnemigo + (!victoria ? 1 : 0) + rachaEnemigo;
            enemyGold += ingresoEnemigo;
            addConsoleMessage(`👥 Enemigo: +${ingresoEnemigo}💰`, 'enemy');
        }

        // ============================================================
        // 🆕 FIX PvE: si es ronda PvE, delegar todo a pve.js
        // ============================================================
                if (esPvE) {
            // Aplicar recompensas del monstruo (oro, tiendas, HP si pierdes)
            if (typeof aplicarRecompensasPvE === 'function') {
                aplicarRecompensasPvE(fase, victoria);
            }

            // 🆕 FIX BUG 2: Resetear el flag de compra también en PvE.
            // Así al terminar la PvE y entrar en la siguiente ronda PvP,
            // la tienda de objetos (si toca) se abre correctamente.
            objetoCompradoEstaRonda = false;
            enemyObjetoCompradoEstaRonda = false;
            sonidoObjetosReproducido = false;

            // Limpiar el monstruo del tablero
            if (typeof limpiarMonstruoPvE === 'function') {
                limpiarMonstruoPvE();
            }

            // Comprobar game over por HP
            if (vidaJugador <= 0) {
                setTimeout(() => { gameOver(); playDerrotaSound(); }, 500);
                combateFinalizado = true;
                liberarEstadoCombate();
                return;
            }
        }

        if (zacianUnidad) {
            const zacianEnJuego = jugadores.find(j => j && j.esZacian);
            if (zacianEnJuego) {
                zacianUnidad.hp = zacianEnJuego.hp;
                zacianUnidad.energy = zacianEnJuego.energy || 0;
                actualizarBarrasZacian();
            } else {
                zacianUnidad.hp = 0; zacianUnidad.energy = 0; actualizarBarrasZacian();
                for (let i = 0; i < tablero.length; i++) { if (tablero[i] && tablero[i].esZacian) { tablero[i] = null; break; } }
                zacianUnidad = null; zacianNivel = 0;
            }
        }
        if (window.zacianEnemigoUnidad) {
            const zacianEnJuegoEnemigo = rivales.find(r => r && r.esZacian);
            if (zacianEnJuegoEnemigo) {
                window.zacianEnemigoUnidad.hp = zacianEnJuegoEnemigo.hp;
                window.zacianEnemigoUnidad.energy = zacianEnJuegoEnemigo.energy || 0;
            } else {
                window.zacianEnemigoUnidad.hp = 0; window.zacianEnemigoUnidad.energy = 0;
                for (let i = 0; i < enemyBoard.length; i++) { if (enemyBoard[i] && enemyBoard[i].esZacian) { enemyBoard[i] = null; break; } }
                window.zacianEnemigoUnidad = null;
            }
        }

                // ============================================================
        // FIN DE COMBATE - Delegar toda la coreografía al orquestador
        // ============================================================

                registrarEstadisticasCombate(jugadores, rivales, victoria, duracion);

        // 🆕 FIX: guardar el rival que acaba de combatir para que el
        // panel de datos lo muestre en la SIGUIENTE ronda (antes de
        // que empiece el combate nuevo).
        window.rivalAnterior = window.rivalActual
            ? {
                nombre: window.rivalActual.nombre,
                avatar: window.rivalActual.avatar,
                esMonstruo: window.rivalActual.esMonstruo || false
            }
            : null;

        try {
            if (typeof combateAudioActual !== 'undefined' && combateAudioActual) {
                combateAudioActual.pause(); combateAudioActual.currentTime = 0; combateAudioActual = null;
            }
            if (typeof uiAudioCache !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.UI_SOUND_URL) {
                const urlCombate = CONFIG.UI_SOUND_URL + 'combate.mp3';
                if (uiAudioCache[urlCombate]) { uiAudioCache[urlCombate].pause(); uiAudioCache[urlCombate].currentTime = 0; }
            }
        } catch (e) {}

        mostrarResultadoCombate(victoria, gananciaReal, daño, racha, function() {
            debugLogCombate("Overlay de combate cerrado");
        }, _esSandbox);

        if (window.modoDosJugadores) {
            // 👥 En 2P SIEMPRE hay un ganador visible → sonido de victoria.
            playVictoriaSound();
        } else if (victoria) {
            if (enemyHealth > 0) playVictoriaSound();
        } else {
            if (vidaJugador > 0) playDerrotaSound();
        }

        // 🧪 SANDBOX: en modo creativo no se avanza ronda, no se abre la
        // tienda y no se toca el torneo. Se restaura el estado y se deja
        // el mismo tablero para poder repetir el combate.
        if (_esSandbox) {
            await new Promise(r => setTimeout(r, 2200));

            if (_sandboxEstado) {
                vidaJugador = _sandboxEstado.vidaJugador;
                enemyHealth = _sandboxEstado.enemyHealth;
                oro = _sandboxEstado.oro;
                racha = _sandboxEstado.racha;
                victorias = _sandboxEstado.victorias;
                experiencia = _sandboxEstado.experiencia;
                nivelJugador = _sandboxEstado.nivelJugador;
                fase = _sandboxEstado.fase;
                ronda = _sandboxEstado.ronda;
                enemyLevel = _sandboxEstado.enemyLevel;
                enemyGold = _sandboxEstado.enemyGold;
                enemyWinStreak = _sandboxEstado.enemyWinStreak;
                enemyLossStreak = _sandboxEstado.enemyLossStreak;
            }

            window._ultimaVictoriaJugador = undefined;
            window._ultimoDanoRecibidoJugador = 0;
            window._ultimoRivalCombatido = null;

            document.body.classList.remove('celebrando');
            document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = ''; });
            document.querySelectorAll('.salto-victoria').forEach(cell => {
                cell.classList.remove('salto-victoria');
                cell.style.animationDelay = '';
            });

            if (typeof restaurarPosicionesOriginales === 'function') restaurarPosicionesOriginales();
            if (typeof aplicarSinergias === 'function') aplicarSinergias();
            if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
            if (typeof renderizar === 'function') renderizar();
            if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

            window.jugadores = null;
            window.rivales = null;
            window.jugadoresIndices = null;
            window.rivalesIndices = null;

            combateFinalizado = true;
            addConsoleMessage('🧪 Sandbox: combate terminado. Puedes repetirlo con los mismos equipos.', 'info');
            return;
        }

        if (window.rivalActual && window.rivalActual.nombre) {
            window._ultimoRivalCombatido = window.rivalActual.nombre;
        }

        if (!esPvE) {
            if (victoria) {
                enemyWinStreak = 0; enemyLossStreak++;
                racha = racha > 0 ? racha + 1 : 1;
                victorias++;
                enemyHealth = Math.max(0, enemyHealth - daño);
                addConsoleMessage(`🎉 VICTORIA! +${gananciaReal}💰 (${enemyHealth} HP enemigo)`, 'success');

                // 🆕 El resultado del rival se registra abajo, después del
                // if/else de victoria/derrota. Antes el bloque estaba dentro
                // del `if (victoria)` y su rama "el jugador perdió" era
                // inalcanzable: el rival nunca sumaba la victoria.
                                    } else {
                enemyLossStreak = 0; enemyWinStreak++;
                racha = racha < 0 ? racha - 1 : -1;
                vidaJugador = Math.max(0, vidaJugador - daño);
                addConsoleMessage(`💀 DERROTA! -${daño} HP (${vidaJugador} HP restantes)`, 'error');

                // 🆕 FIX: comprobar game over INMEDIATAMENTE tras restar HP
                // (bloque duplicado eliminado: gameOver() se disparaba dos veces)
                if (vidaJugador <= 0) {
                    addConsoleMessage(`💀 ¡GAME OVER! Has sido derrotado en ronda ${fase}`, 'error');
                    setTimeout(() => {
                        if (typeof gameOver === 'function') gameOver();
                    }, 500);
                }

                let expExtra = 0;
                for (let u of tablero) {
                    if (u && !u.esArticuno && u.objetos && u.objetos.includes("Huevo Suerte")) { expExtra = 2; break; }
                }
                if (expExtra > 0) {
                    experiencia += expExtra;
                    addConsoleMessage(`🥚 Huevo Suerte: +${expExtra} EXP extra por derrota!`, 'level');
                    checkSubirNivel();
                }
            }
        }

        // 🆕 FIX TORNEO: registrar el resultado del rival en el torneo.
        // Se hace fuera del if/else para que cuente tanto si ganas como si
        // pierdes. Antes la rama "el jugador perdió" estaba anidada dentro
        // del `if (victoria)` y nunca se ejecutaba.
        if (!esPvE && window.torneoRivales && window.rivalActual) {
            const rivalEnTorneo = window.torneoRivales.find(r => r.nombre === window.rivalActual.nombre);
            if (rivalEnTorneo) {
                if (victoria) {
                    // 🆕 Proteger contra un enemyHealth inválido: si no es un
                    // número, conservar el HP anterior en vez de dejar NaN
                    // (la fila del ranking se quedaba sin número/barra).
                    const hpFinal = Number(enemyHealth);
                    rivalEnTorneo.vida = Number.isFinite(hpFinal)
                        ? Math.max(0, hpFinal)
                        : rivalEnTorneo.vida;
                    if (rivalEnTorneo.vida <= 0) rivalEnTorneo.eliminado = true;
                    rivalEnTorneo.derrotas = (rivalEnTorneo.derrotas || 0) + 1;
                    rivalEnTorneo.racha = (rivalEnTorneo.racha || 0) < 0
                        ? (rivalEnTorneo.racha || 0) - 1
                        : -1;
                } else {
                    rivalEnTorneo.victorias = (rivalEnTorneo.victorias || 0) + 1;
                    rivalEnTorneo.racha = (rivalEnTorneo.racha || 0) > 0
                        ? (rivalEnTorneo.racha || 0) + 1
                        : 1;
                }

                // 🏅 Reflejar en el ranking el resultado de ESTE combate,
                // igual que se hace con los rivales simulados:
                //   - si el rival pierde: ✖ y el daño que se lleva (-X)
                //   - si el rival gana: ✔ y sin daño
                rivalEnTorneo._estadoRonda = victoria ? 'loss' : 'win';
                rivalEnTorneo._danoRonda = victoria ? daño : null;
            }
        }

        if (!esPvE && typeof mostrarReaccionEnemigo === 'function') {
            mostrarReaccionEnemigo(victoria);
        }

        // 🏆 Logros de combate (victorias, PvE, daño/curación, intocable...)
        if (typeof Logros !== 'undefined') {
            Logros.evento('combate_fin', {
                victoria: victoria,
                esPvE: esPvE,
                estadisticas: window.statsCombateEnVivo
            });
        }

        experiencia += 4;
        let coste = getExpNecesaria();
        while (experiencia >= coste && coste > 0 && nivelJugador < CONFIG.NIVEL_MAXIMO) {
            experiencia -= coste;
            nivelJugador++;
            coste = getExpNecesaria();
            playSonidoSubirNivel();
            addConsoleMessage(`⬆️ ¡NIVEL ${nivelJugador}! 🎉`, 'level');
            if (typeof Logros !== 'undefined') Logros.evento('nivel', { nivel: nivelJugador });
            if (Number(nivelJugador) === 5 || Number(nivelJugador) === 8) {
                if (typeof darDiscoDefinitivo === 'function') darDiscoDefinitivo();
            }
        }

        // 👥 Modo 2 jugadores: el jugador inactivo (lado enemigo) también
        // gana 4 XP por ronda y sube de nivel de forma equivalente.
        if (window.modoDosJugadores === true) {
            const primInactivo = window.primerTurnoJugador || 1;
            const numInactivo = (primInactivo === 1) ? 2 : 1;
            const nombreInactivo = (numInactivo === 1)
                ? (window.nombreJugador && String(window.nombreJugador).trim() ? window.nombreJugador : 'Jugador 1')
                : (window.nombreJugador2 && String(window.nombreJugador2).trim() ? window.nombreJugador2 : 'Jugador 2');

            enemyExperiencia += 4;
            let costeEnemy = (enemyLevel < CONFIG.NIVEL_MAXIMO) ? CONFIG.COSTES_NIVEL[enemyLevel - 1] : 0;
            while (enemyExperiencia >= costeEnemy && costeEnemy > 0 && enemyLevel < CONFIG.NIVEL_MAXIMO) {
                enemyExperiencia -= costeEnemy;
                enemyLevel++;
                costeEnemy = (enemyLevel < CONFIG.NIVEL_MAXIMO) ? CONFIG.COSTES_NIVEL[enemyLevel - 1] : 0;
                playSonidoSubirNivel();
                addConsoleMessage(`⬆️ ${nombreInactivo} ¡NIVEL ${enemyLevel}! 🎉`, 'level');

                // 💿 Disco Definitivo al llegar a nivel 5 u 8 (igual que el jugador activo)
                if (Number(enemyLevel) === 5 || Number(enemyLevel) === 8) {
                    if (typeof enemyBaulObjetos === 'undefined') enemyBaulObjetos = [];
                    if (enemyBaulObjetos.length >= CONFIG.MAX_BAUL) {
                        addConsoleMessage(`⚠️ ¡Baúl de ${nombreInactivo} lleno! El Disco Definitivo no cabe.`, 'error');
                    } else {
                        enemyBaulObjetos.push("Disco Definitivo");
                        addConsoleMessage(`💿 ${nombreInactivo} consiguió un DISCO DEFINITIVO! (Nivel ${enemyLevel})`, 'fusion');
                        if (typeof playSonidoEvolucion === 'function') playSonidoEvolucion();
                    }
                }
            }
        }

        fase++;
ronda = fase;
// 🆕 FIX: NO pintar el header aquí. El número de ronda se actualiza
//         cuando arranca la música de previa (reanudarFondoPreparacion
//         / reanudarMusicaPreparacion → actualizarContadorRondaVisual).
//         Mientras tanto el header sigue mostrando la ronda anterior.
// (nada de faseStatsNumEl aquí)

                // 🆕 FIX: ya no ocultamos el contador de ronda; debe estar siempre visible
        // if (typeof ocultarContadorRonda === 'function') ocultarContadorRonda();

                // 🆕 FIX: siempre resetear al empezar una ronda nueva,
        // no solo si fase > 2. Si no, la IA queda bloqueada para siempre
        // después de la ronda 2.
        if (fase !== 2) window.enemyComproEnRonda2 = false;
        if (!primerCombateRealizado) primerCombateRealizado = true;
        if (!enemyPrimerCombateRealizado) enemyPrimerCombateRealizado = true;

                // 👥 En 2P no hay rondas PvE: siempre PvP entre J1 y J2.
                const esPvEProximaRonda = (window.modoDosJugadores !== true
                    && typeof esRondaPvE === 'function'
                    && esRondaPvE(fase));
        if (esPvEProximaRonda) {
            // 🕒 El panel del rival anterior y sus Pokémon se quedan 2 s más
            //    en pantalla; después aparece el monstruo.
            if (typeof spawnearMonstruoPvEConRetraso === 'function') {
                spawnearMonstruoPvEConRetraso(fase, 2000);
            } else if (typeof spawnearMonstruoPvE === 'function') {
                spawnearMonstruoPvE(fase);
            }
        } else {
            if (typeof window.enRondaPvE !== 'undefined' && window.enRondaPvE === true) {
                if (typeof limpiarMonstruoPvE === 'function') limpiarMonstruoPvE();
            }
            if (typeof generarTiendaEnemigo === 'function') generarTiendaEnemigo();
        }

        enemyObjetoCompradoEstaRonda = false;
        objetoCompradoEstaRonda = false;
        sonidoObjetosReproducido = false;

        // 🆕 FIX: durante la celebración (5.5 s) y toda la orquestación de fin
        // de ronda NO se puede iniciar otro combate (antes el atajo "C" lo
        // permitía porque `combatiendo` ya era false). Se usa un flag propio
        // en lugar de mantener `combatiendo = true`, porque
        // `mostrarTiendaPostRonda()` no abre la tienda si sigue combatiendo.
        window._celebrandoFinRonda = true;
        if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

        if (typeof window.prepararTurnoDespuesDeCombate === 'function') window.prepararTurnoDespuesDeCombate(victoria);

        document.body.classList.add('celebrando');

        if (victoria) { if (typeof animarSaltoGanadoresJugador === 'function') animarSaltoGanadoresJugador(); }
        else { if (typeof animarSaltoGanadoresDerrota === 'function') animarSaltoGanadoresDerrota(); }

        document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = 'none'; });

        await new Promise(r => setTimeout(r, 5500));

        document.querySelectorAll('.salto-victoria').forEach(cell => { cell.classList.remove('salto-victoria'); cell.style.animationDelay = ''; });
        document.body.classList.remove('celebrando');

        document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = ''; });

        if (typeof restaurarPosicionesOriginales === 'function') restaurarPosicionesOriginales();
        else if (typeof renderizar === 'function') renderizar();

        // ============================================================
        // 🆕 ORQUESTADOR: toda la coreografía de fin de ronda
        // ============================================================
        await ejecutarFinDeRonda(victoria, esPvE);

        // 🆕 FIX: fin de la ventana de bloqueo. Si `ejecutarFinDeRonda` salió
        // antes de tiempo (game over, fin de torneo, 2P), este punto sigue
        // garantizando el desbloqueo.
        window._celebrandoFinRonda = false;
        if (typeof liberarEstadoCombate === 'function') liberarEstadoCombate();

        combateFinalizado = true;
        window.jugadores = null;
        window.rivales = null;
        window.jugadoresIndices = null;
        window.rivalesIndices = null;

        addConsoleMessage(victoria ? "🎉 ¡VICTORIA! 🎉" : "💀 ¡DERROTA! 💀", victoria ? 'success' : 'error');

    } catch (error) {
        console.error("❌ ERROR en combate:", error);
        addConsoleMessage(`❌ Error en combate: ${error.message}`, 'error');
        if (window.statsCombateEnVivo) window.statsCombateEnVivo.activo = false;
        liberarEstadoCombate();
        } finally {
        if (window.statsCombateEnVivo) window.statsCombateEnVivo.activo = false;
        try {
            if (typeof combateAudioActual !== 'undefined' && combateAudioActual) {
                combateAudioActual.pause(); combateAudioActual.currentTime = 0; combateAudioActual = null;
            }
        } catch (e) {}

        // 🆕 FIX: NO reactivar el botón aquí si el orquestador aún
        // está en curso. Lo hace el orquestador al final.
        if (!window._finRondaEnCurso) {
            document.getElementById("btnCombatirFijo").disabled = false;
            document.body.classList.remove('combatiendo');
            if (window.spritesCombate) window.spritesCombate.restaurar();
        }

        metronomoGlobalStacks = 0;
        if (typeof limpiarBordeLlamasCombate === 'function') limpiarBordeLlamasCombate();
        if (typeof movLimpiarQuemaduras === 'function') movLimpiarQuemaduras();
        try {
            const todasLasUnidades = [
                ...(window.jugadores || []),
                ...(window.rivales || []),
                ...tablero.filter(u => u),
                ...banquillo.filter(u => u),
                ...enemyBoard.filter(u => u),
                ...enemyBanquillo.filter(u => u)
            ];
            for (let u of todasLasUnidades) {
                if (u && u._hojaAfiladaIntervalId) {
                    clearInterval(u._hojaAfiladaIntervalId);
                    u._hojaAfiladaIntervalId = null;
                    u._hojaAfiladaActiva = false;
                    u._hojaAfiladaFin = 0;
                }
            }
        } catch (e) {}

        if (!combateFinalizado) {
            if (typeof restaurarPosicionesOriginales === 'function') restaurarPosicionesOriginales();
            else if (typeof renderizar === 'function') renderizar();
        }
    }
}
