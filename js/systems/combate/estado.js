// ============================================================
// COMBATE · ESTADO
// Extraído de js/systems/combate.js (sin cambios de lógica).
// ============================================================

function puedeInteractuar() {
    if (combatiendo) {
        addConsoleMessage("⛔ No puedes hacer eso durante el combate!", 'error');
        return false;
    }
    return true;
}

function puedeCombatir() {
    if (combatiendo) {
        addConsoleMessage("⛔ Ya hay un combate en curso!", 'error');
        return false;
    }
    // 🆕 FIX: bloquear si el orquestador de fin de ronda está en curso
    if (window._finRondaEnCurso) {
        addConsoleMessage("⏳ Espera a que termine la ronda actual...", 'info');
        return false;
    }
    // 🆕 FIX: bloquear también durante la celebración previa al fin de ronda
    // (`combatiendo` ya es false, pero la ronda todavía no ha terminado).
    if (window._celebrandoFinRonda) {
        addConsoleMessage("⏳ Espera a que termine la ronda actual...", 'info');
        return false;
    }
    if (window.modoDosJugadores) return true;
    if (fase === 2 && !tiendaRonda2Comprada) {
        addConsoleMessage(`❌ ¡Debes comprar 1 pokémon en la ronda 2 antes de combatir!`, 'error');
        return false;
    }
    const tiendaActiva = debeAparecerTiendaObjetos(ronda);
    const hayObjetosEnTienda = objetosEnTienda && objetosEnTienda.length > 0;
    const yaCompro = objetoCompradoEstaRonda;
    if (tiendaActiva && hayObjetosEnTienda && !yaCompro) {
        addConsoleMessage(`❌ ¡Debes comprar un objeto antes de combatir! (Ronda de objetos ${ronda})`, 'error');
        return false;
    }
    return true;
}

function bloquearEstadoCombate() {
    combatiendo = true;
    enemyCombatiendo = true;
    document.getElementById("btnCombatirFijo").disabled = true;
    document.body.classList.add('combatiendo');
    // 🎞️ En móvil, sprites estáticos mientras dura el combate (menos CPU)
    if (window.spritesCombate) window.spritesCombate.estaticos();
    const btnPost = document.getElementById('btnPostCombate');
    if (btnPost) {
        btnPost.disabled = false;
        btnPost.style.display = 'flex';
        btnPost.style.visibility = 'visible';
        btnPost.style.opacity = '1';
    }
    document.querySelectorAll('.salto-victoria').forEach(cell => {
        cell.classList.remove('salto-victoria');
        cell.style.animationDelay = '';
    });
    debugLogCombate("🔒 Estado de combate BLOQUEADO");
    metronomoGlobalStacks = 0;
}

function liberarEstadoCombate() {
    combatiendo = false;
    enemyCombatiendo = false;
    document.getElementById('btnCombatirFijo').disabled = false;
    document.body.classList.remove('combatiendo');
    if (window.spritesCombate) window.spritesCombate.restaurar();
    const btnPost = document.getElementById('btnPostCombate');
    if (btnPost) {
        btnPost.disabled = false;
        btnPost.style.display = 'flex';
        btnPost.style.visibility = 'visible';
        btnPost.style.opacity = '1';
    }
    debugLogCombate("🔓 Estado de combate LIBERADO");
    metronomoGlobalStacks = 0;
}

function restaurarPosicionesOriginales() {
    debugLogCombate("🔄 Restaurando posiciones originales de las unidades...");
    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i]) {
            if (tablero[i].esArticuno) continue;
            const coords = coordsDesdeIndice(i, 'player');
            tablero[i]._indiceActual  = i;
            tablero[i]._indiceTablero = 'player';
            tablero[i]._filaGlobal    = coords._filaGlobal;
            tablero[i]._colGlobal     = coords._colGlobal;
            tablero[i]._meleeMoveCooldown = 0;
            tablero[i]._haAvanzadoFrontal = false;
            if (typeof tablero[i].hp !== 'number' || isNaN(tablero[i].hp) || tablero[i].hp <= 0) {
                tablero[i].hp = tablero[i].maxHp || 1;
            }
            tablero[i].muerto = false;
        }
    }
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i]) {
            const coords = coordsDesdeIndice(i, 'enemy');
            enemyBoard[i]._indiceActual  = i;
            enemyBoard[i]._indiceTablero = 'enemy';
            enemyBoard[i]._filaGlobal    = coords._filaGlobal;
            enemyBoard[i]._colGlobal     = coords._colGlobal;
            enemyBoard[i]._meleeMoveCooldown = 0;
            enemyBoard[i]._haAvanzadoFrontal = false;
            if (typeof enemyBoard[i].hp !== 'number' || isNaN(enemyBoard[i].hp) || enemyBoard[i].hp <= 0) {
                enemyBoard[i].hp = enemyBoard[i].maxHp || 1;
            }
            enemyBoard[i].muerto = false;
        }
    }
    window.jugadores = null;
    window.rivales = null;
    window.jugadoresIndices = null;
    window.rivalesIndices = null;
    renderizar();
    debugLogCombate("✅ Posiciones restauradas correctamente");
}

function ocultarUnidadMuerta(elemento) {
    if (!elemento || !elemento.style) return;
    try {
        // 🆕 Desvanecimiento al caer: destello + fade + partículas
        if (typeof efectoFaintDesaparicion === 'function') efectoFaintDesaparicion(elemento);
        const sprite = elemento.querySelector ? elemento.querySelector('.unit-sprite') : null;
        if (sprite && sprite.classList) sprite.classList.add('faint-fade-out');
        elemento.style.pointerEvents = 'none';
        let hpBar = elemento.querySelector('.unit-hp-bar');
        if (hpBar && hpBar.style) hpBar.style.opacity = '0';
        let energyBar = elemento.querySelector('.energy-bar');
        if (energyBar && energyBar.style) energyBar.style.opacity = '0';
        let nameEl = elemento.querySelector('.unit-name');
        if (nameEl && nameEl.style) nameEl.style.opacity = '0';
        let traitsEl = elemento.querySelector('.unit-traits-left');
        if (traitsEl && traitsEl.style) traitsEl.style.opacity = '0';
        if (elemento.classList) elemento.classList.add('muerto');
        setTimeout(() => {
            if (!elemento || !elemento.isConnected) return;
            elemento.classList.remove('has-unit', 'team-player', 'team-enemy', 'muerto', 'casilla-veneno', 'casilla-quemadura');
            Array.from(elemento.classList).filter(c => c.startsWith('cost-')).forEach(c => elemento.classList.remove(c));
            elemento.innerHTML = '';
            elemento.style.opacity = '';
            elemento.style.transform = '';
            elemento.style.filter = '';
            elemento.style.pointerEvents = '';
        }, 560);
    } catch (e) {
        console.warn('⚠️ ocultarUnidadMuerta: elemento ya no existe en el DOM');
    }
}

function restaurarUnidad(elemento) {
    if (!elemento || !elemento.style) return;
    try {
        elemento.style.transition = 'opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease';
        elemento.style.opacity = '1';
        elemento.style.transform = 'scale(1)';
        elemento.style.filter = 'grayscale(0)';
        elemento.style.pointerEvents = '';
        let hpBar = elemento.querySelector('.unit-hp-bar');
        if (hpBar && hpBar.style) hpBar.style.opacity = '1';
        let energyBar = elemento.querySelector('.energy-bar');
        if (energyBar && energyBar.style) energyBar.style.opacity = '1';
        let nameEl = elemento.querySelector('.unit-name');
        if (nameEl && nameEl.style) nameEl.style.opacity = '1';
        let traitsEl = elemento.querySelector('.unit-traits-left');
        if (traitsEl && traitsEl.style) traitsEl.style.opacity = '1';
        let sprite = elemento.querySelector('.unit-sprite');
        if (sprite && sprite.style) {
            sprite.style.filter = 'grayscale(0) brightness(1)';
            sprite.style.opacity = '1';
        }
        if (sprite && sprite.classList) sprite.classList.remove('recall-suck', 'faint-fade-out');
        if (elemento.classList) elemento.classList.remove('muerto');
        if (elemento.classList) elemento.classList.add('restaurando');
        setTimeout(() => {
            if (elemento && elemento.classList) elemento.classList.remove('restaurando');
        }, 500);
    } catch (e) {
        console.warn('⚠️ restaurarUnidad: elemento ya no existe en el DOM');
    }
}

function restaurarTodasUnidades() {
    debugLogCombate("🔄 Restaurando todas las unidades visualmente...");
    if (document.body.classList.contains('celebrando')) {
        return;
    }
    try {
        document.querySelectorAll(
            '#playerBoard .board-cell, #enemigoBoard .board-cell, ' +
            '#banquilloGrid .bank-cell, #enemyBanquilloGrid .bank-cell'
        ).forEach(cell => {
            restaurarUnidad(cell);
            cell.classList.remove('salto-victoria');
            cell.style.animationDelay = '';
        });
    } catch (e) {
        console.warn('⚠️ restaurarTodasUnidades: error controlado');
    }
}
