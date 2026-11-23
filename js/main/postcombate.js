// ============================================================
// MAIN · POSTCOMBATE
// Extraído de js/main.js (sin cambios de lógica).
// ============================================================

function mostrarPostCombate() {
    if (!postCombateData) { addConsoleMessage("❌ No hay datos de combate disponibles", 'error'); return; }
    const overlay = document.getElementById('postCombateOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.classList.add('visible');

    const body = document.getElementById('postCombateBody');
    if (!body) return;
    const data = postCombateData;
    let html = '';

    html += `
        <div class="post-resumen" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:14px 20px;background:rgba(0,0,0,0.3);border-radius:14px;border:1px solid rgba(42,58,90,0.4);margin:0 auto 16px auto;max-width:480px;text-align:center;">
            <div class="stat"><span style="font-size:1.3rem;">⚔️</span><span style="font-size:1.3rem;font-weight:700;color:#ffffff;">${Math.round(data.totalDañoJugador || 0)}</span><span style="font-size:0.5rem;color:#6b8aaa;text-transform:uppercase;">Daño</span></div>
            <div class="stat"><span style="font-size:1.3rem;">🛡️</span><span style="font-size:1.3rem;font-weight:700;color:#ef4444;">${Math.round(data.totalDañoRecibido || 0)}</span><span style="font-size:0.5rem;color:#6b8aaa;text-transform:uppercase;">Recibido</span></div>
            <div class="stat"><span style="font-size:1.3rem;">💚</span><span style="font-size:1.3rem;font-weight:700;color:#4ade80;">${Math.round(data.totalCuracion || 0)}</span><span style="font-size:0.5rem;color:#6b8aaa;text-transform:uppercase;">Curaciones</span></div>
        </div>
    `;

    html += `<div class="post-filtros" style="display:flex;gap:8px;margin:0 auto 14px;justify-content:center;flex-wrap:wrap;max-width:400px;width:100%;">
        <button class="filtro-btn active-damage" onclick="cambiarFiltroPostCombate('damage')" id="filtroDamage">⚔️ DAÑO</button>
        <button class="filtro-btn" onclick="cambiarFiltroPostCombate('received')" id="filtroReceived">🛡️ RECIBIDO</button>
        <button class="filtro-btn" onclick="cambiarFiltroPostCombate('heal')" id="filtroHeal">💚 CURACIÓN</button>
    </div>`;

    html += `<div class="post-tabs" style="display:flex;gap:10px;margin:0 auto 14px;justify-content:center;max-width:400px;width:100%;">
        <button class="post-tab-btn active" data-tab="todos" onclick="cambiarTabPostCombate('todos')">🌍 TODOS</button>
        <button class="post-tab-btn" data-tab="jugador" onclick="cambiarTabPostCombate('jugador')">🛡️ MI EQUIPO</button>
        <button class="post-tab-btn" data-tab="enemigo" onclick="cambiarTabPostCombate('enemigo')">🗡️ ENEMIGO</button>
    </div>`;

    html += `
        <div id="filtroContenidoDamage" class="filtro-contenido active">
            <div class="post-tab-panel active" id="panel-todos-damage"><div class="post-lista" id="lista-todos-damage"></div></div>
            <div class="post-tab-panel" id="panel-jugador-damage" style="display:none;"><div class="post-lista" id="lista-jugador-damage"></div></div>
            <div class="post-tab-panel" id="panel-enemigo-damage" style="display:none;"><div class="post-lista" id="lista-enemigo-damage"></div></div>
        </div>
        <div id="filtroContenidoReceived" class="filtro-contenido" style="display:none;">
            <div class="post-tab-panel active" id="panel-todos-received"><div class="post-lista" id="lista-todos-received"></div></div>
            <div class="post-tab-panel" id="panel-jugador-received" style="display:none;"><div class="post-lista" id="lista-jugador-received"></div></div>
            <div class="post-tab-panel" id="panel-enemigo-received" style="display:none;"><div class="post-lista" id="lista-enemigo-received"></div></div>
        </div>
        <div id="filtroContenidoHeal" class="filtro-contenido" style="display:none;">
            <div class="post-tab-panel active" id="panel-todos-heal"><div class="post-lista" id="lista-todos-heal"></div></div>
            <div class="post-tab-panel" id="panel-jugador-heal" style="display:none;"><div class="post-lista" id="lista-jugador-heal"></div></div>
            <div class="post-tab-panel" id="panel-enemigo-heal" style="display:none;"><div class="post-lista" id="lista-enemigo-heal"></div></div>
        </div>
    `;

    body.innerHTML = html;
    renderizarListasPostCombate(data, 'damage');
    renderizarListasPostCombate(data, 'received');
    renderizarListasPostCombate(data, 'heal');
}

function renderizarListasPostCombate(data, filtro) {
    const todos = [...(data.statsJugadores || []), ...(data.statsRivales || [])];
    if (filtro === 'damage') todos.sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));
    else if (filtro === 'received') todos.sort((a, b) => (b.damageTaken || 0) - (a.damageTaken || 0));
    else if (filtro === 'heal') todos.sort((a, b) => (b.healingDone || 0) - (a.healingDone || 0));

    const jugadores = todos.filter(p => p.equipo === 'jugador');
    const rivales = todos.filter(p => p.equipo === 'enemigo');

    function renderizarLista(listaId, items, filtro) {
        const container = document.getElementById(listaId);
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="sin-datos" style="text-align:center;padding:20px;color:#6b8aaa;">No hay datos disponibles</div>';
            return;
        }
        const maxValor = Math.max(...items.map(p => {
            if (filtro === 'damage') return p.damageDealt || 0;
            if (filtro === 'received') return (p.damageTaken || 0) + (p.damageBlocked || 0);
            if (filtro === 'heal') return p.healingDone || 0;
            return 0;
        }), 1);
        let html = '';
        for (let p of items) {
            if (!p || !p.nombre) continue;
            const spriteUrl = getSpriteUrl(p.spriteId || p.id, p.nombre);
            const valor = filtro === 'damage' ? (p.damageDealt || 0) : filtro === 'received' ? (p.damageTaken || 0) : (p.healingDone || 0);
            const valorBlocked = filtro === 'received' ? (p.damageBlocked || 0) : 0;
            const porcentaje = maxValor > 0 ? (valor / maxValor) * 100 : 0;
            const porcentajeBlocked = maxValor > 0 ? (valorBlocked / maxValor) * 100 : 0;
            let color = '#fbbf24';
            let fillClass = 'damage-fill';
            if (filtro === 'damage') {
                if (p.tipoAtaque === 'especial') { color = '#3b82f6'; fillClass = 'damage-fill-especial'; }
                else { color = '#ef4444'; fillClass = 'damage-fill-fisico'; }
            } else if (filtro === 'received') { color = '#ef4444'; fillClass = 'recibido-fill'; }
            else if (filtro === 'heal') { color = '#4ade80'; fillClass = 'curacion-fill'; }
            const equipo = p.equipo === 'jugador' ? '🛡️' : '🗡️';
            const tipoIcono = p.tipoAtaque === 'especial' ? '🔮' : '⚔️';
            const estrellasImg = `<img class="estrellas-img" src="${getEstrellasUrl(p.nivel || 1)}" alt="${p.nivel || 1}★" draggable="false" style="height:24px;width:auto;object-fit:contain;image-rendering:auto;display:inline-block;vertical-align:middle;margin-left:6px;">`;

            html += `
                <div class="post-item" style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:2px;min-height:38px;">
                    <span style="font-size:0.8rem;">${equipo}</span>
                    <div class="sprite" style="width:28px;height:28px;flex-shrink:0;background:rgba(0,0,0,0.3);border-radius:4px;padding:2px;display:flex;align-items:center;justify-content:center;">
                        <img src="${spriteUrl}" alt="${p.nombre}" draggable="false" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">
                    </div>
                    <div class="info" style="flex:1;display:flex;flex-direction:column;min-width:0;">
                        <span class="nombre" style="font-size:0.7rem;font-weight:700;color:#ffffff;">${p.nombre}${estrellasImg}</span>
                        <span class="detalle" style="font-size:0.45rem;color:#6b8aaa;">
                            ${filtro === 'damage' ? `${tipoIcono} Daño: ${Math.round(p.damageDealt || 0)}` : ''}
                            ${filtro === 'received' ? `🛡️ Recibido: ${Math.round(p.damageTaken || 0)}${(p.damageBlocked || 0) > 0 ? ` · ⚪ Bloqueado: ${Math.round(p.damageBlocked)}` : ''}` : ''}
                            ${filtro === 'heal' ? `💚 Curaciones: ${Math.round(p.healingDone || 0)}` : ''}
                        </span>
                    </div>
                    ${filtro === 'received' && valorBlocked > 0 ? `
                    <div class="barra-container" style="width:80px;height:8px;background:#1a2236;border-radius:4px;overflow:hidden;flex-shrink:0;display:flex;">
                        <div class="fill ${fillClass}" style="width:${porcentaje}%;height:100%;background:${color};transition:width 0.8s ease;"></div>
                        <div class="fill escudo-fill" style="width:${porcentajeBlocked}%;height:100%;background:#e5e7eb;transition:width 0.8s ease;"></div>
                    </div>` : `
                    <div class="barra-container" style="width:80px;height:8px;background:#1a2236;border-radius:4px;overflow:hidden;flex-shrink:0;">
                        <div class="fill ${fillClass}" style="width:${porcentaje}%;height:100%;background:${color};border-radius:4px;transition:width 0.8s ease;"></div>
                    </div>`}
                    <span class="valor" style="font-size:0.7rem;font-weight:700;color:${color};min-width:40px;text-align:right;">${Math.round(valor)}</span>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    renderizarLista('lista-todos-' + filtro, todos, filtro);
    renderizarLista('lista-jugador-' + filtro, jugadores, filtro);
    renderizarLista('lista-enemigo-' + filtro, rivales, filtro);
}

function cambiarFiltroPostCombate(filtro) {
    document.querySelectorAll('.filtro-contenido').forEach(el => { el.style.display = 'none'; });
    const contenido = document.getElementById('filtroContenido' + filtro.charAt(0).toUpperCase() + filtro.slice(1));
    if (contenido) contenido.style.display = 'block';
    document.querySelectorAll('.filtro-btn').forEach(btn => { btn.style.background = 'rgba(255,255,255,0.05)'; btn.style.borderColor = '#2a3a5a'; btn.style.color = '#6b8aaa'; });
    const btnId = { 'damage': 'filtroDamage', 'received': 'filtroReceived', 'heal': 'filtroHeal' }[filtro];
    if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.style.background = filtro === 'heal' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)';
            btn.style.borderColor = filtro === 'heal' ? '#22c55e' : '#ef4444';
            btn.style.color = filtro === 'heal' ? '#4ade80' : '#ef4444';
        }
    }
}

function cambiarTabPostCombate(tab) {
    document.querySelectorAll('.post-tab-panel').forEach(p => { p.style.display = 'none'; });
    document.querySelectorAll('.post-tab-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.style.display = 'block';
    const btn = document.querySelector(`.post-tab-btn[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
}

function gameOver() {
    // 🏅 Posición final del jugador: se apunta el orden de eliminación para
    //    que el resumen final ordene a los eliminados por cuándo cayeron.
    try {
        window._registrarEliminacionesPendientes && window._registrarEliminacionesPendientes();
        if (!window._ordenEliminacionJugador) {
            window._contadorEliminaciones = (window._contadorEliminaciones || 0) + 1;
            window._ordenEliminacionJugador = window._contadorEliminaciones;
        }
    } catch (e) { }

    const overlayAntiguo = document.getElementById('gameOverOverlay');
    if (overlayAntiguo) {
        overlayAntiguo.classList.remove('visible');
        overlayAntiguo.style.display = 'none';
    }

    playDerrotaSound();
    addConsoleMessage('💀 GAME OVER! Has sido derrotado...', 'error');
    
    setTimeout(() => {
        if (typeof mostrarPantallaResultadosFinales === 'function') {
            mostrarPantallaResultadosFinales();
        }
    }, 2000);
}

function mostrarVictoriaJuego() {
    const overlayAntiguo = document.getElementById('gameOverOverlay');
    if (overlayAntiguo) {
        overlayAntiguo.classList.remove('visible');
        overlayAntiguo.style.display = 'none';
    }

    playVictoriaSound();
    addConsoleMessage('🏆 ¡VICTORIA TOTAL!', 'success');

    // 🏆 Si venimos del último combate del torneo, no dejar 2 s mostrando
    // el tablero/baúl del rival: la pantalla de victoria sale casi ya.
    setTimeout(() => {
        if (typeof mostrarPantallaResultadosFinales === 'function') {
            mostrarPantallaResultadosFinales();
        }
    }, window._torneoTerminado ? 150 : 2000);
}

function renderizarEstadisticasFinales() {
    const g = (typeof estadisticasGlobales !== 'undefined') ? estadisticasGlobales : null;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    if (g) {
        setText('statTotalDaño', Math.round(g.totalDaño || 0));
        setText('statTotalRecibido', Math.round(g.totalRecibido || 0));
        setText('statTotalCuracion', Math.round(g.totalCuracion || 0));
        setText('statVictorias', g.victorias || 0);
        setText('statRondas', g.rondas || 0);
        setText('statMVP', g.mvp ? g.mvp : '-');
        setText('statTopDaño', Math.round(g.topDaño || 0));
        setText('statTopRecibido', Math.round(g.topRecibido || 0));
    } else {
        ['statTotalDaño', 'statTotalRecibido', 'statTotalCuracion', 'statVictorias', 'statRondas', 'statMVP', 'statTopDaño', 'statTopRecibido'].forEach(id => setText(id, '0'));
    }

    const mejores = (g && g.mejoresPokemon) ? g.mejoresPokemon : [];
    const mejoresJugador = mejores.filter(p => p.equipo === 'jugador');

    if (mejoresJugador.length > 0) {
        let mvp = null;
        let mejorPunt = -1;
        let topD = 0;
        let topR = 0;
        for (let p of mejoresJugador) {
            const punt = (p.damageDealt || 0) + (p.healingDone || 0) * 0.5 + (p.damageBlocked || 0) * 0.3;
            if (punt > mejorPunt) { mejorPunt = punt; mvp = p; }
            if ((p.damageDealt || 0) > topD) topD = p.damageDealt || 0;
            if ((p.damageTaken || 0) > topR) topR = p.damageTaken || 0;
        }
        if (mvp) setText('statMVP', mvp.nombre);
        setText('statTopDaño', Math.round(topD));
        setText('statTopRecibido', Math.round(topR));
    }

    function renderizarListaFinal(listaId, items) {
        const cont = document.getElementById(listaId);
        if (!cont) return;
        if (!items || items.length === 0) {
            cont.innerHTML = '<div class="sin-datos" style="text-align:center;padding:20px;color:#6b8aaa;">No hay datos disponibles</div>';
            return;
        }
        const ordenados = items.slice().sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));
        const maxDaño = Math.max(...ordenados.map(p => p.damageDealt || 0), 1);
        let html = '';
        for (let p of ordenados) {
            if (!p || !p.nombre) continue;
            const spriteUrl = (typeof getSpriteUrl === 'function') ? getSpriteUrl(p.spriteId || p.id, p.nombre) : '';
            const estrellasImg = (typeof getEstrellasUrl === 'function') ? `<img class="estrellas-img" src="${getEstrellasUrl(p.nivel || 1)}" alt="${p.nivel || 1}★" draggable="false" style="height:20px;width:auto;object-fit:contain;display:inline-block;vertical-align:middle;margin-left:6px;">` : '';
            const equipo = p.equipo === 'jugador' ? '🛡️' : '🗡️';
            const porcentaje = maxDaño > 0 ? Math.min(100, ((p.damageDealt || 0) / maxDaño) * 100) : 0;
            const color = p.tipoAtaque === 'especial' ? '#3b82f6' : '#ef4444';
            html += `
                <div class="post-item" style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:2px;min-height:38px;">
                    <span style="font-size:0.8rem;">${equipo}</span>
                    <div class="sprite" style="width:28px;height:28px;flex-shrink:0;background:rgba(0,0,0,0.3);border-radius:4px;padding:2px;display:flex;align-items:center;justify-content:center;">
                        <img src="${spriteUrl}" alt="${p.nombre}" draggable="false" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">
                    </div>
                    <div class="info" style="flex:1;display:flex;flex-direction:column;min-width:0;">
                        <span class="nombre" style="font-size:0.7rem;font-weight:700;color:#ffffff;">${p.nombre}${estrellasImg}</span>
                        <span class="detalle" style="font-size:0.45rem;color:#6b8aaa;">⚔️ ${Math.round(p.damageDealt || 0)} · 🛡️ ${Math.round(p.damageTaken || 0)}${(p.damageBlocked || 0) > 0 ? ` · ⚪ ${Math.round(p.damageBlocked)}` : ''} · 💚 ${Math.round(p.healingDone || 0)}</span>
                    </div>
                    <div class="barra-container" style="width:80px;height:8px;background:#1a2236;border-radius:4px;overflow:hidden;flex-shrink:0;">
                        <div class="fill" style="width:${porcentaje}%;height:100%;background:${color};border-radius:4px;transition:width 0.8s ease;"></div>
                    </div>
                    <span class="valor" style="font-size:0.7rem;font-weight:700;color:${color};min-width:40px;text-align:right;">${Math.round(p.damageDealt || 0)}</span>
                </div>
            `;
        }
        cont.innerHTML = html;
    }

    renderizarListaFinal('finalTodosList', mejores);
    renderizarListaFinal('finalJugadorList', mejoresJugador);
    renderizarListaFinal('finalEnemigoList', mejores.filter(p => p.equipo === 'enemigo'));
}
