// ============================================================
// AMISTOSO ONLINE 1v1 (Fase 2) - rondas sincronizadas con "ambos Listo"
// - Empiezas con 1 y juegas normal (tienda, oro, niveles, PvE).
// - COMBATIR = "Listo": cuando AMBOS estáis listos, se resuelve la ronda.
// - Rondas PvP: peleas contra el tablero de tu amigo.
// - Rondas PvE: contra el monstruo (como siempre).
// Entrada: menú -> 2 JUGADORES -> Online (por código).
// ============================================================
(function () {
    const params = new URLSearchParams(location.search);
    let sala = (params.get('amistoso') || '').trim().toUpperCase();
    let pid = (params.get('pid') || '').trim();
    let es = null, amigo = null, syncTimer = null;
    let estadoOnline = 'prep'; // prep | waiting | combat | ended
    let origCombatir = null;
    let _rondaPveAsegurada = -1;
    let _combateEnCursoLocal = false; // evita lanzar 2 combates en la misma ronda

    function serializarTablero() {
        const out = [];
        if (typeof tablero === 'undefined' || !tablero) return out;
        for (let i = 0; i < tablero.length; i++) {
            const u = tablero[i];
            if (!u || u.esArticuno) continue;
            out.push({ pos: i, nombre: u.pokemon.nombre, nivel: u.nivel || 1, baseId: u.baseId, costeOriginal: u.costeOriginal, spriteId: u.pokemon.spriteId, objetos: (u.objetos || []).slice() });
        }
        return out;
    }
    function cargarEnemigo(snap) {
        if (typeof enemyBoard === 'undefined' || !enemyBoard) return false;
        for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
        for (const item of (snap || [])) {
            const data = (typeof getPokemonPorNombre === 'function') ? getPokemonPorNombre(item.nombre) : null;
            if (!data) continue;
            let u;
            try { u = new Unidad(data, item.nivel || 1, item.baseId || data.id, item.costeOriginal || data.coste); } catch (e) { continue; }
            u.equipo = 'enemy';
            try { if (u.actualizarStats) u.actualizarStats(); } catch (e) { }
            if (Array.isArray(item.objetos) && typeof aplicarObjeto === 'function') item.objetos.forEach(o => { try { aplicarObjeto(u, o); } catch (e) { } });
            // 🪞 Espejar columnas: el tablero del amigo está en A-D (col 0-3);
            // como enemigo debe verse reflejado (su col 0 -> H, su col 3 -> E).
            const rawPos = Math.max(0, Math.min(19, item.pos | 0));
            const _fila = Math.floor(rawPos / 4), _colLocal = rawPos % 4;
            const pos = _fila * 4 + (3 - _colLocal);
            if (enemyBoard[pos]) { const libre = enemyBoard.findIndex(x => !x); if (libre >= 0) enemyBoard[libre] = u; else break; }
            else enemyBoard[pos] = u;
        }
        try { if (typeof renderizar === 'function') renderizar(); } catch (e) { }
        return true;
    }

    function nombreActual() { return (window.nombreJugador || 'Jugador'); }
    function avatarActual() { return (window.avatarJugador || 'rojo'); }
    function hpActual() { return (typeof vidaJugador !== 'undefined') ? vidaJugador : null; }
    function esPvERonda() { return (typeof esRondaPvE === 'function' && typeof fase !== 'undefined') ? esRondaPvE(fase) : false; }

    // ---------- Sync ----------
    function enviarEstado() {
        try {
            fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room: sala, pid, name: nombreActual(), avatar: avatarActual(), hp: hpActual(), nivel: (typeof nivelJugador !== 'undefined' ? nivelJugador : null), racha: (typeof racha !== 'undefined' ? racha : null), oro: (typeof oro !== 'undefined' ? oro : null), round: (typeof fase !== 'undefined' ? fase : null), board: serializarTablero() }) });
        } catch (e) { }
    }
    function iniciarSync() { if (syncTimer) clearInterval(syncTimer); enviarEstado(); syncTimer = setInterval(enviarEstado, 1000); }

    function enviarReady() {
        try { fetch('/api/ready', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: sala, pid, team: serializarTablero() }) }); } catch (e) { }
    }

    // ---------- COMBATIR = Listo ----------
    function hookCombatir() {
        if (window._amistosoCombatirWrapped) return;
        if (typeof window.combatir !== 'function') return;
        window._amistosoCombatirWrapped = true;
        origCombatir = window.combatir;
        window.combatir = function () {
            if (!window._modoOnline) return origCombatir.apply(this, arguments);
            if (estadoOnline === 'combat') {
                // Ya se está resolviendo la ronda: ignorar clics extra del botón.
                if (_combateEnCursoLocal) return;
                return origCombatir.apply(this, arguments); // combatir de verdad
            }
            if (estadoOnline === 'ended') { setStatus('La partida ha terminado.'); return; }
            // estado prep/waiting -> mandar "Listo", no pelear
            estadoOnline = 'waiting';
            enviarReady();
            setStatus('✅ Listo. Esperando a que tu amigo también esté listo…');
        };
    }

    // Al repintar el panel enemigo (comprar/rerollear), re-aplicar al instante los datos del amigo
    function hookInfoEnemigo() {
        if (window._amistosoInfoWrapped) return;
        if (typeof window.actualizarInfoEnemigo !== 'function') return;
        window._amistosoInfoWrapped = true;
        const orig = window.actualizarInfoEnemigo;
        window.actualizarInfoEnemigo = function () {
            try { orig.apply(this, arguments); } catch (e) { }
            if (window._modoOnline && !esPvERonda() && amigo) { try { actualizarPanel(); } catch (e) { } }
        };
    }

    function finalizarRonda() {
        estadoOnline = 'waiting';
        _combateEnCursoLocal = false;
        const hp = (typeof vidaJugador !== 'undefined') ? vidaJugador : null;
        try { fetch('/api/roundEnd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: sala, pid, hp, won: (window._ultimaVictoriaJugador === true) }) }); } catch (e) { }
        setStatus('⌛ Esperando a que el rival termine la ronda…');
    }

    function resolverRonda(msg) {
        estadoOnline = 'combat';
        _combateEnCursoLocal = true;
        try { const b = document.getElementById('btnCombatirFijo'); if (b) b.disabled = true; } catch (e) { }
        window._ultimoAmigoBoardStr = null;
        const pids = msg.players || [];
        const otro = pids.find(x => x !== pid);
        try { if (typeof cerrarTienda === 'function') cerrarTienda(); } catch (e) { }
        // (En online no forzamos los candados de compra: dejamos que la tienda
        //  se abra normal en ronda 2/objetos. puedeCombatir ya está anulado.)
        if (msg.roundType === 'pvp') {
            cargarEnemigo((msg.boards && msg.boards[otro]) || []);
            setStatus('⚔️ Combate contra ' + (amigo && amigo.name ? amigo.name : 'tu amigo'));
        } else {
            // PvE: el monstruo ya lo pone el juego para la ronda; solo spawnear si falta
            try {
                const hayMonstruo = (typeof enemyBoard !== 'undefined' && enemyBoard) ? enemyBoard.some(u => u && u.esMonstruo) : false;
                if (!hayMonstruo && typeof spawnearMonstruoPvE === 'function') spawnearMonstruoPvE(msg.round);
            } catch (e) { }
            setStatus('👾 Ronda PvE: combate contra el monstruo');
        }
        setTimeout(() => {
            try { if (origCombatir) origCombatir(); } catch (e) { }
            const iv = setInterval(() => {
                const sigue = (typeof combatiendo !== 'undefined' && combatiendo) || window._finRondaEnCurso || window._celebrandoFinRonda;
                if (!sigue) { clearInterval(iv); finalizarRonda(); }
            }, 600);
        }, 350);
    }

    // ---------- SSE ----------
    function conectar() {
        // Entrar a la sala (dispara el reinicio de marcador de partida en el servidor)
        try { fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: sala, pid, name: nombreActual() }) }); } catch (e) { }
        if (es) es.close();
        es = new EventSource('/api/events?room=' + encodeURIComponent(sala) + '&pid=' + encodeURIComponent(pid));
        es.onmessage = (ev) => {
            let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
            if (msg.type === 'state') {
                const otros = (msg.players || []).filter(p => p.pid !== pid);
                amigo = otros[0] || null; window._amigo = amigo;
                actualizarPanel();
                // Mostrar el tablero del amigo en vivo SOLO en rondas PvP (en PvE va el monstruo)
                if (estadoOnline === 'prep' && !esPvERonda() && amigo && Array.isArray(amigo.board) && amigo.board.length) {
                    const sig = JSON.stringify(amigo.board);
                    if (sig !== window._ultimoAmigoBoardStr) {
                        window._ultimoAmigoBoardStr = sig;
                        cargarEnemigo(amigo.board); // actualiza el rival al comprar/mover
                    }
                }
            } else if (msg.type === 'resolve') {
                resolverRonda(msg);
            } else if (msg.type === 'nextRound') {
                estadoOnline = 'prep';
                _combateEnCursoLocal = false;
                window._ultimoAmigoBoardStr = null;
                // Sincronizar la ronda del cliente con la del servidor (PvE/PvP bien)
                try { if (typeof msg.round === 'number') { fase = msg.round; ronda = msg.round; } } catch (e) { }
                // HP autoritativa del servidor (la misma en ambos clientes)
                try {
                    if (Array.isArray(msg.hp)) {
                        const mio = msg.hp.find(h => h && h.pid === pid);
                        if (mio && typeof mio.hp === 'number') { vidaJugador = mio.hp; }
                    }
                } catch (e) { }
                if (typeof msg.round === 'number') setStatus('Ronda ' + msg.round + ': prepara y pulsa COMBATIR (Listo).');
                else setStatus('Prepara y pulsa COMBATIR (Listo).');
                // Asegurar que la tienda de la ronda nueva se abra en AMBOS clientes.
                // (Si el flujo local ya la abrió, esto no hace nada.)
                setTimeout(() => { asegurarTiendaDeRonda(); }, 700);
                setTimeout(() => { asegurarTiendaDeRonda(); }, 3000);
                setTimeout(() => { asegurarTiendaDeRonda(); }, 9000);
            } else if (msg.type === 'matchEnd') {
                estadoOnline = 'ended';
                _combateEnCursoLocal = false;
                const empate = (msg.winner == null);
                const gane = (msg.winner === pid);
                setStatus(empate ? '🤝 Empate / fin de partida' : (gane ? '🏆 ¡GANASTE la partida!' : '💀 Has perdido la partida.'));
                mostrarResultadosFinalesOnline(msg.hp, { empate: empate, ronda: msg.round, gane: gane });
            }
        };
    }

    // ---------- UI ----------
    function panel() {
        let el = document.getElementById('amistosoPanel');
        if (!el) {
            el = document.createElement('div');
            el.id = 'amistosoPanel';
            el.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:99998;background:rgba(15,23,42,.96);border:1px solid #2a4066;border-radius:12px;padding:12px;color:#e6eefc;font-family:Inter,system-ui,sans-serif;font-size:13px;max-width:260px;box-shadow:0 8px 30px rgba(0,0,0,.4);';
            document.body.appendChild(el);
        }
        el.innerHTML = `
            <div style="font-weight:800;color:#7fd4ff;margin-bottom:6px;">🌐 Amistoso 1v1</div>
            <div style="margin-bottom:4px;">Ronda <b id="amistosoRonda">1</b> · Sala <b style="letter-spacing:1px">${sala}</b></div>
            <div style="display:flex;gap:10px;margin:6px 0;">
                <div style="flex:1;text-align:center;"><div style="font-size:.72rem;color:#8fb0d6;">TÚ</div><div id="amistosoMiHp" style="font-weight:800;color:#4ade80;">—</div></div>
                <div style="flex:1;text-align:center;"><div style="font-size:.72rem;color:#8fb0d6;">VS</div></div>
                <div style="flex:1;text-align:center;"><div id="amistosoAmigoNombre" style="font-size:.72rem;color:#8fb0d6;">AMIGO</div><div id="amistosoAmigoHp" style="font-weight:800;color:#f87171;">—</div></div>
            </div>
            <div id="amistosoStatus" style="color:#8fb0d6;margin:6px 0;font-size:.78rem;">Conectando…</div>
        `;
        setInterval(actualizarPanel, 1200);
    }
    function setStatus(t) { const s = document.getElementById('amistosoStatus'); if (s) s.textContent = t; }

    function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    function mostrarFinPartida(gane, hpArr, opts) {
        try {
            opts = opts || {};
            const empate = (opts.empate === true);
            let m = document.getElementById('finPartidaOverlay'); if (m) m.remove();
            m = document.createElement('div'); m.id = 'finPartidaOverlay';
            m.style.cssText = 'position:fixed;inset:0;z-index:120000;background:rgba(5,10,20,.94);display:flex;align-items:center;justify-content:center;';
            const mio = (Array.isArray(hpArr) ? hpArr : []).find(h => h && h.pid === pid) || {};
            const otro = (Array.isArray(hpArr) ? hpArr : []).find(h => h && h.pid !== pid) || {};
            const miNombre = (window.nombreJugador || 'Tú');
            const suNombre = (amigo && amigo.name) || 'Tu amigo';
            const miHp = (mio.hp != null ? mio.hp : '-');
            const suHp = (otro.hp != null ? otro.hp : '-');
            const titulo = empate ? '🤝 EMPATE' : (gane ? '🏆 ¡VICTORIA!' : '💀 DERROTA');
            const color = empate ? '#fbbf24' : (gane ? '#4ade80' : '#f87171');
            const miPuesto = empate ? '—' : (gane ? '🥇 1º' : '🥈 2º');
            const suPuesto = empate ? '—' : (gane ? '🥈 2º' : '🥇 1º');
            const rondaTxt = (typeof opts.ronda === 'number') ? ` · Ronda ${opts.ronda}` : '';
            m.innerHTML = `
              <div style="background:#0f172a;border:1px solid #2a4066;border-radius:18px;padding:28px;max-width:520px;width:92%;color:#e6eefc;font-family:Inter,system-ui,sans-serif;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6);">
                <h2 style="margin:0 0 4px;font-size:1.9rem;color:${color};">${titulo}</h2>
                <p style="color:#8fb0d6;margin:0 0 18px;">Fin de la partida${rondaTxt}</p>
                <div style="display:flex;justify-content:space-around;gap:12px;margin-bottom:20px;">
                  <div style="flex:1;background:#0b1626;border:1px solid #2a4066;border-radius:12px;padding:12px;">
                    <div style="font-size:.78rem;color:#8fb0d6;">${miPuesto}</div>
                    <div style="font-weight:800;margin:2px 0;">${_esc(miNombre)}</div>
                    <div style="color:#4ade80;font-weight:700;">${miHp} HP</div>
                  </div>
                  <div style="flex:1;background:#0b1626;border:1px solid #2a4066;border-radius:12px;padding:12px;">
                    <div style="font-size:.78rem;color:#8fb0d6;">${suPuesto}</div>
                    <div style="font-weight:800;margin:2px 0;">${_esc(suNombre)}</div>
                    <div style="color:#f87171;font-weight:700;">${suHp} HP</div>
                  </div>
                </div>
                <button id="finVolver" style="background:linear-gradient(180deg,#2f6bd8,#1f4fa8);border:none;color:#fff;border-radius:10px;padding:12px 22px;font-weight:700;cursor:pointer;">🏠 Volver al menú</button>
              </div>`;
            document.body.appendChild(m);
            const b = document.getElementById('finVolver'); if (b) b.onclick = () => location.reload();
        } catch (e) { }
    }
    // 🏆 Pantalla de RESULTADOS FINALES (posiciones 1º/2º) al terminar la partida online.
    // Reutiliza el overlay clásico (pantallaResultadosFinales) con los 2 jugadores reales.
    function mostrarResultadosFinalesOnline(hpArr, opts) {
        opts = opts || {};
        try {
            const overlay = document.getElementById('pantallaResultadosFinales');
            const lista = document.getElementById('resultadosLista');
            const titulo = document.getElementById('resultadosTitulo');
            const tiempoEl = document.getElementById('resultadosTiempo');
            if (!overlay || !lista) { mostrarFinPartida(opts.gane === true, hpArr, opts); return; }

            try { if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta && typeof cerrarTienda === 'function') cerrarTienda(); } catch (e) { }
            try { const ap = document.getElementById('amistosoPanel'); if (ap) ap.style.display = 'none'; } catch (e) { }

            const hpDe = function (p) {
                const x = (Array.isArray(hpArr) ? hpArr : []).find(h => h && h.pid === p);
                return (x && typeof x.hp === 'number') ? x.hp : null;
            };

            const equipoLocal = (typeof tablero !== 'undefined' && tablero ? tablero : [])
                .filter(u => u && !u.esArticuno)
                .map(u => ({ nombre: u.pokemon.nombre, nivel: u.nivel || 1, spriteId: u.pokemon.spriteId, tipos: u.pokemon.tipos || [], clase: u.pokemon.clase || '' }));

            const equipoAmigo = (amigo && Array.isArray(amigo.board) ? amigo.board : []).map(function (it) {
                let d = null; try { d = (typeof getPokemonPorNombre === 'function') ? getPokemonPorNombre(it.nombre) : null; } catch (e) { }
                return { nombre: it.nombre, nivel: it.nivel || 1, spriteId: it.spriteId || (d && d.spriteId), tipos: (d && d.tipos) || [], clase: (d && d.clase) || '' };
            });

            const jugadores = [
                { yo: true, nombre: (window.nombreJugador || 'Tú'), avatar: (window.avatarJugador || 'rojo'), hp: hpDe(pid), equipo: equipoLocal },
                { yo: false, nombre: (amigo && amigo.name) || 'Tu amigo', avatar: (amigo && amigo.avatar) || 'rojo', hp: hpDe(amigo ? amigo.pid : null), equipo: equipoAmigo }
            ];

            jugadores.sort(function (a, b) {
                const ha = (typeof a.hp === 'number') ? a.hp : -1;
                const hb = (typeof b.hp === 'number') ? b.hp : -1;
                if (ha !== hb) return hb - ha;
                return a.yo ? -1 : 1;
            });

            const miPos = jugadores.findIndex(j => j.yo) + 1;
            if (titulo) {
                if (opts.empate) { titulo.textContent = '🤝 EMPATE'; titulo.style.color = '#fbbf24'; }
                else if (miPos === 1) { titulo.textContent = '🏆 ¡VICTORIA TOTAL!'; titulo.style.color = '#fbbf24'; }
                else { titulo.textContent = `#${miPos} Lugar`; titulo.style.color = '#e2e8f0'; }
            }
            if (tiempoEl) tiempoEl.textContent = (typeof opts.ronda === 'number') ? `⏱️ Ronda ${opts.ronda}` : 'Fin de partida';

            function sinergiasDe(equipo) {
                const tipos = {}, clases = {};
                (equipo || []).forEach(u => {
                    (u.tipos || []).forEach(t => tipos[t] = (tipos[t] || 0) + 1);
                    if (u.clase) clases[u.clase] = (clases[u.clase] || 0) + 1;
                });
                const out = {};
                Object.keys(tipos).forEach(t => { if (tipos[t] >= 2) out[t] = { nivel: tipos[t], esClase: false }; });
                Object.keys(clases).forEach(c => { if (clases[c] >= 2) out[c] = { nivel: clases[c], esClase: true }; });
                return out;
            }

            lista.innerHTML = '';
            jugadores.forEach(function (jugador, index) {
                const pos = index + 1;
                const fila = document.createElement('div');
                fila.className = `fila-resultado pos-${pos} ${jugador.yo ? 'es-jugador' : ''}`;

                let rangoHtml = pos.toString();
                if (opts.empate) rangoHtml = '—';
                else if (pos === 1) rangoHtml = '🥇';
                else if (pos === 2) rangoHtml = '🥈';
                else if (pos === 3) rangoHtml = '🥉';

                let equipoHtml = '';
                (jugador.equipo || []).forEach(function (u) {
                    const spriteUrl = (typeof getSpriteUrl === 'function') ? getSpriteUrl(u.spriteId, u.nombre) : '';
                    const estrellas = (typeof getEstrellasUrl === 'function') ? `<img class="estrellas-final" src="${getEstrellasUrl(u.nivel || 1)}">` : '';
                    equipoHtml += `<div class="unidad-final" title="${u.nombre}"><img src="${spriteUrl}" onerror="this.style.display='none'">${estrellas}</div>`;
                });
                if (!equipoHtml) equipoHtml = `<span style="font-size:0.7rem;color:#6b8aaa;font-style:italic;">Sin equipo</span>`;

                let sinergiasHtml = '';
                const sin = sinergiasDe(jugador.equipo);
                Object.keys(sin).map(key => ({ nombre: key, nivel: sin[key].nivel, esClase: sin[key].esClase }))
                    .sort((a, b) => b.nivel - a.nivel)
                    .forEach(function (s) {
                        let icono = '';
                        try { icono = s.esClase ? getIconoClase(s.nombre) : getIconoTipo(s.nombre); } catch (e) { icono = ''; }
                        sinergiasHtml += `<div class="sinergia-icono-final" title="${s.nombre}">${icono}<span class="lvl">${s.nivel}</span></div>`;
                    });

                fila.innerHTML = `
                    <div class="rango-badge pos-${pos}">${rangoHtml}</div>
                    <div class="info-entrenador">
                        <img src="assets/avatars/jugador/${jugador.avatar}.png" onerror="this.style.display='none'">
                        <div style="display:flex; flex-direction:column;">
                            <span class="nombre">${_esc(jugador.nombre)}</span>
                        </div>
                    </div>
                    <div class="equipo-final">${equipoHtml}</div>
                    <div class="sinergias-final">${sinergiasHtml}</div>
                `;
                lista.appendChild(fila);
            });

            overlay.style.display = 'flex';

            const btnVolver = document.getElementById('btnResultadosVolverMenu');
            if (btnVolver) {
                const nuevoBtn = btnVolver.cloneNode(true);
                btnVolver.parentNode.replaceChild(nuevoBtn, btnVolver);
                nuevoBtn.addEventListener('click', () => { overlay.style.display = 'none'; location.reload(); });
            }
        } catch (e) {
            try { mostrarFinPartida(opts.gane === true, hpArr, opts); } catch (e2) { }
        }
    }

    // Abre la tienda que toca en la ronda actual (objetos o Pokémon) si el
    // flujo normal no la ha abierto. Se llama al recibir 'nextRound'.
    function asegurarTiendaDeRonda() {
        try {
            if (typeof fase === 'undefined' || fase <= 1) return;
            if (typeof combatiendo !== 'undefined' && combatiendo) return;
            if (typeof _finRondaEnCurso !== 'undefined' && window._finRondaEnCurso) return;
            if (typeof _celebrandoFinRonda !== 'undefined' && window._celebrandoFinRonda) return;

            if (window._tiendaForzadaRonda === fase) return;

            const esRondaObjetos = (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase));
            const yaCompro = (typeof objetoCompradoEstaRonda !== 'undefined' && objetoCompradoEstaRonda);
            let mostrarObjetos = false;

            if (esRondaObjetos && !yaCompro) {
                // Regenerar los objetos si son de otra ronda o no hay
                const tocaRegenerar = (typeof objetosEnTienda === 'undefined' || !Array.isArray(objetosEnTienda) || objetosEnTienda.length === 0 || window._rondaObjetosGenerada !== fase);
                if (tocaRegenerar && typeof generarObjetosTienda === 'function') {
                    objetosEnTienda = generarObjetosTienda();
                    window._rondaObjetosGenerada = fase;
                    if (typeof rerollObjetosRonda3Usado !== 'undefined') rerollObjetosRonda3Usado = false;
                }
                mostrarObjetos = Array.isArray(objetosEnTienda) && objetosEnTienda.length > 0;
                if (mostrarObjetos && window._avisoObjetosRonda !== fase) {
                    window._avisoObjetosRonda = fase;
                    try { if (typeof addConsoleMessage === 'function') addConsoleMessage(`🎁 ¡Ronda ${fase} de OBJETOS! Elige 1 objeto GRATIS`, 'shop-objetos'); } catch (e) { }
                }
            }

            // Si ya está abierta: dejarla solo si está en el modo correcto.
            if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) {
                if (!!modoTiendaObjetos === !!mostrarObjetos) { window._tiendaForzadaRonda = fase; return; }
                try { if (typeof cerrarTienda === 'function') cerrarTienda(); } catch (e) { }
            }

            if (typeof abrirTienda === 'function') {
                abrirTienda(mostrarObjetos);
                window._tiendaForzadaRonda = fase;
            }
        } catch (e) { }
    }

    // En PvE se debe ver el MONSTRUO, no el tablero del rival
    function asegurarMonstruoPve() {
        if (!esPvERonda()) { _rondaPveAsegurada = -1; return; }
        if (typeof fase === 'undefined') return;
        if (_rondaPveAsegurada === fase) return;
        let hay = false;
        try { hay = (typeof enemyBoard !== 'undefined' && enemyBoard) ? enemyBoard.some(u => u && u.esMonstruo) : false; } catch (e) { }
        if (!hay) {
            try { for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null; } catch (e) { }
            try { if (typeof spawnearMonstruoPvE === 'function') spawnearMonstruoPvE(fase); } catch (e) { }
            try { if (typeof renderizar === 'function') renderizar(); } catch (e) { }
        }
        _rondaPveAsegurada = fase;
    }

    function pintarAvatarEnemigo(av) {
        const ea = document.getElementById('enemyAvatar');
        if (!ea || !av) return;
        const src = 'assets/avatars/jugador/' + av + '.png';
        const img = ea.querySelector('img');
        if (img && img.getAttribute('src') === src) return;
        ea.innerHTML = '';
        const im = document.createElement('img');
        im.src = src; im.alt = 'Amigo';
        im.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
        im.onerror = function () { this.style.display = 'none'; ea.textContent = '🧢'; };
        ea.appendChild(im);
    }

    let _ultimaFirmaBaul = null;
    function refrescarBaulPropio() {
        try {
            const firma = (typeof baulObjetos !== 'undefined' && Array.isArray(baulObjetos)) ? baulObjetos.join('|') : '';
            if (firma === _ultimaFirmaBaul) return;
            _ultimaFirmaBaul = firma;
            if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales('jugador');
        } catch (e) { }
    }

    function actualizarPanel() {
        const rk = document.getElementById('rankingTorneo'); if (rk) rk.style.display = 'none';
        refrescarBaulPropio();
        // Online: el baúl enemigo no debe tener objetos (no hay IA rival)
        try { if (window._modoOnline && typeof enemyBaulObjetos !== 'undefined' && Array.isArray(enemyBaulObjetos) && enemyBaulObjetos.length > 0) { enemyBaulObjetos = []; if (typeof renderizar === 'function') renderizar(); } } catch (e) { }
        const rondaEl = document.getElementById('amistosoRonda'); if (rondaEl && typeof fase !== 'undefined') rondaEl.textContent = fase;
        const miHp = document.getElementById('amistosoMiHp'); if (miHp) miHp.textContent = (typeof vidaJugador !== 'undefined' ? vidaJugador : '—') + ' HP';
        const nomEl = document.getElementById('amistosoAmigoNombre'); if (nomEl) nomEl.textContent = amigo ? ((amigo.name || 'Amigo')).toUpperCase() : 'AMIGO';
        const hpEl = document.getElementById('amistosoAmigoHp'); if (hpEl) hpEl.textContent = (amigo && typeof amigo.hp === 'number') ? (amigo.hp + ' HP') : '—';
        // Nombre + avatar REAL de tu amigo en el panel rival
        if (!esPvERonda() && amigo) {
            const en = document.getElementById('enemyName'); if (en) en.textContent = amigo.name || 'Amigo';
            if (amigo.avatar) pintarAvatarEnemigo(amigo.avatar);
            if (typeof amigo.nivel === 'number') { const lv = document.getElementById('enemyLevelInfo'); if (lv) lv.textContent = amigo.nivel; }
            if (typeof amigo.oro === 'number') { const g = document.getElementById('enemyGoldInfo'); if (g) g.textContent = amigo.oro; }
        } else if (esPvERonda() && typeof actualizarInfoEnemigo === 'function') {
            // PvE: mostrar el nombre/foto del monstruo (no el jugador)
            try { actualizarInfoEnemigo(); } catch (e) { }
        }
        // Contador del banco rival = nivel/máximo de tu amigo (solo PvP; en PvE manda el monstruo)
        if (!esPvERonda() && amigo && typeof amigo.nivel === 'number') {
            try { if (typeof enemyLevel !== 'undefined') enemyLevel = amigo.nivel; } catch (e) { }
            const maxU = (typeof maxEnemyUnits === 'function') ? maxEnemyUnits() : amigo.nivel;
            const cnt = (typeof enemyBoard !== 'undefined' && enemyBoard) ? enemyBoard.filter(Boolean).length : (Array.isArray(amigo.board) ? amigo.board.length : 0);
            const ebMax = document.getElementById('enemyBoardMax'); if (ebMax) ebMax.textContent = maxU;
            const ebCount = document.getElementById('enemyBoardCount'); if (ebCount) ebCount.textContent = cnt;
            const hdr = document.getElementById('bankHeaderEnemy'); if (hdr) { if (cnt >= maxU) hdr.classList.add('is-full'); else hdr.classList.remove('is-full'); }
        }
        // Racha del rival = racha real de tu amigo (solo PvP)
        if (!esPvERonda() && amigo && typeof amigo.racha === 'number') {
            const rEl = document.getElementById('enemyStreakInfo');
            const rIcon = document.getElementById('enemyStreakIcon');
            const rVal = document.getElementById('enemyStreakValueInfo');
            if (rEl) rEl.style.display = '';
            if (rIcon && rVal) {
                const r = amigo.racha;
                let ic = '🤝', cl = 'racha-cero', tx = '0';
                if (r > 0) { ic = '🏆'; cl = 'racha-positiva'; tx = '+' + r; }
                else if (r < 0) { ic = '💀'; cl = 'racha-negativa'; tx = '' + r; }
                rIcon.textContent = ic; rVal.textContent = tx;
                rEl.classList.remove('racha-positiva', 'racha-negativa', 'racha-cero'); rEl.classList.add(cl);
            }
        }
        // ❤️ HP correcta en los paneles (vida de PARTIDA, no la de la IA)
        try {
            if (typeof vidaJugador !== 'undefined') {
                const ph = document.getElementById('playerHealthDisplayInfo'); if (ph) ph.textContent = vidaJugador;
                const pb = document.getElementById('playerHealthBarInfo'); if (pb) pb.style.width = Math.max(0, Math.min(100, (vidaJugador / 50) * 100)) + '%';
            }
            if (typeof oro !== 'undefined') { const pg = document.getElementById('playerGoldInfo'); if (pg) pg.textContent = oro; }
            if (!esPvERonda() && amigo && typeof amigo.hp === 'number') {
                const eh = document.getElementById('enemyHealthDisplayInfo'); if (eh) eh.textContent = amigo.hp;
                const eb = document.getElementById('enemyHealthBarInfo'); if (eb) eb.style.width = Math.max(0, Math.min(100, (amigo.hp / 50) * 100)) + '%';
            }
            // Evitar 'victoria' falsa por enemyHealth de la IA
            if (typeof enemyHealth !== 'undefined') enemyHealth = 50;
        } catch (e) { }
        // Botón COMBATIR -> LISTO en online
        const btn = document.getElementById('btnCombatirFijo');
        if (btn) {
            const spans = btn.querySelectorAll('span');
            const label = (estadoOnline === 'waiting') ? 'ESPERANDO…' : (estadoOnline === 'combat' ? 'COMBATE…' : (estadoOnline === 'ended' ? 'FIN' : 'LISTO'));
            if (spans[1]) spans[1].textContent = label;
        }
        // Aviso persistente si toca comprar objeto y no se ha comprado
        try {
            if (estadoOnline === 'prep' && typeof fase !== 'undefined' && fase > 1
                && typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(fase)
                && !objetoCompradoEstaRonda && !tiendaAbierta) {
                setStatus(`🎁 Ronda ${fase}: te falta comprar tu OBJETO gratis (botón Tienda)`);
            }
        } catch (e) { }
        // En PvE: monstruo (no tablero del rival)
        asegurarMonstruoPve();
    }

    // ---------- Entrada ----------
    function iniciar(salaArg) {
        sala = (salaArg || '').trim().toUpperCase();
        if (!sala) return;
        if (!pid) pid = 'p' + Math.random().toString(36).slice(2, 8);
        window._modoOnline = true;
        // En online el "combate" lo gobierna el handshake (ambos Listo),
        // así que no necesitamos los candados de puedeCombatir (ronda 2 / objetos).
        try { window.puedeCombatir = function () { return true; }; } catch (e) { }
        estadoOnline = 'prep';
        panel(); conectar(); iniciarSync(); hookCombatir(); hookInfoEnemigo();
        const rk = document.getElementById('rankingTorneo'); if (rk) rk.style.display = 'none';
        setStatus('Conectado. Prepara tu tablero y pulsa COMBATIR (Listo).');
    }

    window.mostrarEleccion2J = function () {
        let m = document.getElementById('eleccion2j'); if (m) m.remove();
        m = document.createElement('div'); m.id = 'eleccion2j';
        m.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(5,10,20,.72);display:flex;align-items:center;justify-content:center;';
        m.innerHTML = `<div style="background:#0f172a;border:1px solid #2a4066;border-radius:16px;padding:22px;max-width:420px;width:90%;color:#e6eefc;font-family:Inter,system-ui,sans-serif;">
            <h3 style="margin:0 0 6px;">⚔️ 2 JUGADORES</h3>
            <p style="color:#8fb0d6;font-size:.85rem;margin:0 0 16px;">¿Cómo queréis jugar?</p>
            <button id="e2jLocal" style="width:100%;margin-bottom:10px;background:linear-gradient(180deg,#2f6bd8,#1f4fa8);border:none;color:#fff;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;">🖥️ Local (misma pantalla)</button>
            <button id="e2jOnline" style="width:100%;background:linear-gradient(180deg,#16a34a,#15803d);border:none;color:#fff;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;">🌐 Online (por código)</button>
            <div id="e2jCodeWrap" style="display:none;margin-top:12px;">
                <input id="e2jCode" placeholder="Código de sala (ej. PATO)" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a4066;background:#0b1626;color:#fff;margin-bottom:8px;" />
                <button id="e2jGo" style="width:100%;background:#2f6bd8;border:none;color:#fff;border-radius:8px;padding:10px;font-weight:700;cursor:pointer;">Entrar a la sala</button>
            </div>
            <button id="e2jCancel" style="width:100%;margin-top:10px;background:transparent;border:1px solid #2a4066;color:#9fb6d4;border-radius:8px;padding:8px;cursor:pointer;">Cancelar</button>
        </div>`;
        document.body.appendChild(m);
        document.getElementById('e2jCancel').onclick = () => m.remove();
        document.getElementById('e2jLocal').onclick = () => { m.remove(); if (typeof abrirSeleccion === 'function') abrirSeleccion('2j'); };
        document.getElementById('e2jOnline').onclick = () => { document.getElementById('e2jCodeWrap').style.display = 'block'; };
        document.getElementById('e2jGo').onclick = () => {
            const code = (document.getElementById('e2jCode').value || '').trim().toUpperCase() || 'SALA';
            m.remove();
            window.amistoso.iniciar(code);
            if (typeof abrirSeleccion === 'function') abrirSeleccion('1j');
        };
    };

    window.amistoso = { iniciar, serializarTablero, cargarEnemigo };

    if (sala) {
        const go = () => iniciar(sala);
        if (document.readyState === 'complete') go();
        else window.addEventListener('load', go);
    }
})();
