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
    // 🔁 El pid se guarda por pestaña (sessionStorage): así al recargar
    //    (p. ej. tras la revancha) se mantiene el mismo jugador y no da
    //    "sala llena". Cada pestaña nueva genera uno distinto.
    let pid = (params.get('pid') || '').trim();
    if (!pid && sala) {
        try { pid = (sessionStorage.getItem('pktft_pid_' + sala) || '').trim(); } catch (e) { }
    }
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
        let vivas = 0;
        try { vivas = (typeof tablero !== 'undefined' ? tablero : []).filter(u => u && !u.muerto).length; } catch (e) { }
        try { fetch('/api/roundEnd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: sala, pid, hp, won: (window._ultimaVictoriaJugador === true), vivas }) }); } catch (e) { }
        setStatus('⌛ Esperando a que el rival termine la ronda…');
    }

    // ============================================================
    // 🤖 EQUIPO DE UNA IA EN EL TORNEO ONLINE (determinista por semilla)
    // ============================================================
    function _rng(seed) {
        let a = (seed || 1) >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function construirEquipoIA(nivel, seed) {
        const rnd = _rng(seed);
        const pool = (typeof POKEMONS !== 'undefined' && Array.isArray(POKEMONS)) ? POKEMONS.filter(p => p && p.base !== false) : [];
        if (!pool.length) return [];

        const n = Math.max(1, Math.min(4, 1 + Math.floor((nivel || 2) / 2)));
        const nivelUnidad = (nivel >= 5) ? 2 : 1;   // a partir de nivel 5 la IA lleva 2★
        const elegidos = [];
        const usados = new Set();
        const costeMax = Math.max(1, Math.min(5, 1 + Math.floor((nivel || 2) / 2)));

        let intentos = 0;
        while (elegidos.length < n && intentos < 120) {
            intentos++;
            const p = pool[Math.floor(rnd() * pool.length)];
            if (!p || usados.has(p.nombre)) continue;
            if ((p.coste || 1) > costeMax) continue;
            usados.add(p.nombre);
            elegidos.push(p);
        }

        // Posiciones: melees delante (fila 0), ranged detrás (fila 3)
        const front = [0, 1, 2, 3];
        const back = [12, 13, 14, 15];
        let iF = 0, iB = 0;
        const snap = [];
        elegidos.forEach(p => {
            const esFront = (p.rol === 'frontline');
            const pos = esFront ? front[iF++ % 4] : back[iB++ % 4];
            snap.push({ nombre: p.nombre, nivel: nivelUnidad, baseId: p.id, costeOriginal: p.coste, objetos: [], pos });
        });
        return snap;
    }

    window.construirEquipoIA = construirEquipoIA;

    function resolverRonda(msg) {
        // ✅ Ya ha empezado la partida online (permite el diálogo de ronda)
        window._rondaOnlineEmpezada = true;

        // 👁️ Espectador: no juega, solo espera (el ranking se va actualizando)
        if (window._modoSpectador) {
            _combateEnCursoLocal = false;
            setStatus('👁️ Eliminado · espectando la partida');
            return;
        }

        estadoOnline = 'combat';
        _combateEnCursoLocal = true;
        try { const b = document.getElementById('btnCombatirFijo'); if (b) b.disabled = true; } catch (e) { }
        window._ultimoAmigoBoardStr = null;
        const pids = msg.players || [];
        const otro = pids.find(x => x !== pid);
        try { if (typeof cerrarTienda === 'function') cerrarTienda(); } catch (e) { }
        // (En online no forzamos los candados de compra: dejamos que la tienda
        //  se abra normal en ronda 2/objetos. puedeCombatir ya está anulado.)
        // 🏆 ¿Contra quién juegas esta ronda? (torneo de 8)
        const asig = (msg.asignaciones && msg.asignaciones[pid]) ? msg.asignaciones[pid] : null;

        if (msg.roundType !== 'pve' && asig && asig.tipo === 'ia') {
            // 🤖 Contra una IA del torneo: carga su equipo y pelea en vivo
            const equipoIA = construirEquipoIA(asig.nivel || 2, asig.seed || 1);
            cargarEnemigo(equipoIA);
            try {
                window.rivalActual = { nombre: asig.nombre, avatar: asig.avatar, esMonstruo: false };
                const nEl = document.getElementById('enemyName'); if (nEl) nEl.textContent = asig.nombre;
                if (typeof renderizar === 'function') renderizar();
            } catch (e) { }
            setStatus('⚔️ Combate contra ' + asig.nombre + ' (IA)');
        } else if (msg.roundType === 'pvp') {
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
        // Partida online nueva: hasta que se resuelva la 1ª ronda no hay diálogos
        window._rondaOnlineEmpezada = false;

        // Entrar a la sala (dispara el reinicio de marcador de partida en el servidor)
        try { fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: sala, pid, name: nombreActual() }) }); } catch (e) { }
        if (es) es.close();

        // 🎬 Al entrar en la partida online: mensaje de la ronda 1 al segundo
        try {
            setTimeout(() => {
                try {
                    if (window._dialogoIntroOnlineMostrado) return;
                    window._dialogoIntroOnlineMostrado = true;
                    const cfg = (typeof MONSTRUOS_PVE !== 'undefined') ? MONSTRUOS_PVE[1] : null;
                    if (cfg && cfg.descripcion && typeof mostrarConsejoJugadorPvE === 'function') {
                        window._rondaOnlineEmpezada = true;   // ya se está jugando
                        mostrarConsejoJugadorPvE(cfg.descripcion, 6000);
                    }
                } catch (e) { }
            }, 1000);
        } catch (e) { }

        es = new EventSource('/api/events?room=' + encodeURIComponent(sala) + '&pid=' + encodeURIComponent(pid));
        es.onmessage = (ev) => {
            let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
            if (msg.type === 'state') {
                const otros = (msg.players || []).filter(p => p.pid !== pid);
                amigo = otros[0] || null; window._amigo = amigo;

                // 🏆 Torneo online (2 humanos + 6 IA): pintar ranking de 8
                window._torneoOnline = msg.torneo || null;
                try { pintarRankingTorneoOnline(msg.torneo); } catch (e) { }

                // 👁️ ¿Estoy eliminado? → modo espectador
                try {
                    const yo = msg.torneo && (msg.torneo.participantes || []).find(p => p.id === pid);
                    const eliminado = !!(yo && yo.eliminado);
                    window._modoSpectador = eliminado;
                    if (eliminado !== window._modoEspectadorActivo) {
                        window._modoEspectadorActivo = eliminado;
                        aplicarModoEspectador(eliminado);
                    }
                } catch (e) { }

                actualizarPanel();
                // Mostrar el tablero del amigo en vivo SOLO en rondas PvP (en PvE va el monstruo)
                if (estadoOnline === 'prep' && !esPvERonda() && amigo && Array.isArray(amigo.board) && amigo.board.length) {
                    const sig = JSON.stringify(amigo.board);
                    if (sig !== window._ultimoAmigoBoardStr) {
                        window._ultimoAmigoBoardStr = sig;
                        cargarEnemigo(amigo.board); // actualiza el rival al comprar/mover
                    }
                }
            } else if (msg.type === 'torneoFin') {
                try { mostrarFinTorneoOnline(msg.posiciones); } catch (e) { }
            } else if (msg.type === 'torneoReset') {
                // 🔄 El rival (o tú) ha pedido revancha → recargar y volver a la sala
                try { location.reload(); } catch (e) { }
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

                // 🏆 Logro online (una vez por partida)
                if (typeof Logros !== 'undefined') {
                    Logros.evento('online_fin', {
                        gane: gane === true,
                        empate: empate,
                        partida: (sala || '') + ':' + Date.now()
                    });
                }
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

    // ============================================================
    // 🏆 RANKING DEL TORNEO ONLINE (2 humanos + 6 IA = 8)
    // ============================================================
    function pintarRankingTorneoOnline(torneo) {
        const panel = document.getElementById('rankingTorneo');
        if (!panel) return;
        if (!torneo || !Array.isArray(torneo.participantes)) { panel.style.display = 'none'; return; }

        const vivos = torneo.participantes.filter(p => !p.eliminado).sort((a, b) => b.hp - a.hp);
        const muertos = torneo.participantes.filter(p => p.eliminado).sort((a, b) => b.hp - a.hp);
        const lista = vivos.concat(muertos);
        const maxHp = torneo.maxHp || 50;

        const miPar = (torneo.parejas || []).find(par => Array.isArray(par) && par.includes(pid));
        const rivalId = miPar ? miPar.find(x => x !== pid) : null;

        let html = '<div class="ranking-header">🏆 RANKING <span style="font-size:.6rem;color:#8fb0d6;">R' + (torneo.ronda || 1) + '</span></div>';

        lista.forEach((p, i) => {
            const esYo = p.id === pid;
            const esRival = p.id === rivalId;
            const clases = ['ranking-item', esYo ? 'jugador' : '', p.eliminado ? 'eliminado' : '', esRival ? 'pareja-activa' : ''].join(' ');
            const pct = Math.max(0, Math.min(100, (Math.max(0, p.hp) / maxHp) * 100));
            const carpeta = (p.tipo === 'humano') ? 'jugador' : 'rivales';
            const estrellita = (p.tipo === 'ia') ? ' 🤖' : '';
            html += `
                <div class="${clases}" title="${_esc(p.nombre)}${estrellita}">
                    <div class="ranking-pos">${i + 1}</div>
                    <div class="ranking-avatar-wrap">
                        <img class="ranking-avatar" src="assets/avatars/${carpeta}/${p.avatar}.webp" onerror="this.style.display='none'">
                        <span class="ranking-nivel">${p.nivel || 1}</span>
                    </div>
                    <div class="ranking-info">
                        <div class="ranking-nombre">${_esc(p.nombre)}${estrellita}</div>
                        <div class="ranking-hp-row">
                            <span class="ranking-hp-valor">${Math.max(0, p.hp)}</span>
                            <div class="ranking-hp-bar"><div class="ranking-hp-fill" style="width:${pct}%"></div></div>
                        </div>
                    </div>
                </div>`;
        });

        panel.innerHTML = html;
        panel.style.display = '';
    }
    window.pintarRankingTorneoOnline = pintarRankingTorneoOnline;

    // ============================================================
    // 👁️ MODO ESPECTADOR + FIN DE TORNEO (opción A)
    // ============================================================
    function aplicarModoEspectador(on) {
        try {
            let b = document.getElementById('spectatorBanner');
            if (on) {
                if (!b) {
                    b = document.createElement('div');
                    b.id = 'spectatorBanner';
                    b.style.cssText = 'position:fixed;top:54px;left:50%;transform:translateX(-50%);z-index:100400;background:rgba(80,10,20,.95);border:1px solid #ef4444;border-radius:12px;padding:8px 16px;color:#ffe3e6;font-weight:800;font-family:Inter,system-ui,sans-serif;font-size:.8rem;box-shadow:0 8px 24px rgba(0,0,0,.5);';
                    b.textContent = '💀 Eliminado · modo espectador';
                    document.body.appendChild(b);
                }
                const btn = document.getElementById('btnCombatirFijo');
                if (btn) { btn.disabled = true; btn.style.opacity = '.45'; }
                window.puedeCombatir = function () { return false; };

                // 📱 En móvil, abrir el ranking desplegable para poder seguirlo
                try {
                    if (window.matchMedia('(max-height: 700px) and (max-width: 1100px)').matches) {
                        document.body.classList.add('mob-ranking-open');
                    }
                } catch (e) { }
            } else {
                if (b) b.remove();
            }
        } catch (e) { }
    }

    // Sinergias (tipos + clases) a partir de un equipo del resumen
    function _sinergiasDeEquipo(equipo) {
        const tipos = {}, clases = {};
        (equipo || []).forEach(it => {
            const d = (typeof getPokemonPorNombre === 'function') ? getPokemonPorNombre(it.nombre) : null;
            (it.tipos || (d && d.tipos) || []).forEach(t => tipos[t] = (tipos[t] || 0) + 1);
            const cl = it.clase || (d && d.clase) || '';
            if (cl) clases[cl] = (clases[cl] || 0) + 1;
        });
        const out = {};
        Object.keys(tipos).forEach(t => { if (tipos[t] >= 2) out[t] = { nivel: tipos[t], esClase: false }; });
        Object.keys(clases).forEach(c => { if (clases[c] >= 2) out[c] = { nivel: clases[c], esClase: true }; });
        return out;
    }

    // 🏆 Pantalla final del torneo online: igual que la del 1J
    //    (posición · entrenador · equipo con estrellas y objetos · sinergias)
    function mostrarFinTorneoOnline(posiciones) {
        try {
            const overlay = document.getElementById('pantallaResultadosFinales');
            const lista = document.getElementById('resultadosLista');
            const titulo = document.getElementById('resultadosTitulo');
            const tiempoEl = document.getElementById('resultadosTiempo');
            if (!overlay || !lista) return;

            if (titulo) { titulo.textContent = '🏆 TORNEO FINALIZADO'; titulo.style.color = '#fbbf24'; }
            if (tiempoEl) tiempoEl.textContent = '';

            // Limpiar cosas que molestarían encima del resumen
            try { const b = document.getElementById('spectatorBanner'); if (b) b.remove(); } catch (e) { }
            try { document.body.classList.remove('mob-ranking-open'); } catch (e) { }
            try { if (typeof cerrarComicBubble === 'function') cerrarComicBubble(true); } catch (e) { }
            try { document.querySelectorAll('.comic-bubble').forEach(el => el.remove()); } catch (e) { }

            lista.innerHTML = '';

            (posiciones || []).forEach(p => {
                const fila = document.createElement('div');
                fila.className = `fila-resultado pos-${p.pos} ${p.id === pid ? 'es-jugador' : ''}`;

                let rango = String(p.pos);
                if (p.pos === 1) rango = '🥇';
                else if (p.pos === 2) rango = '🥈';
                else if (p.pos === 3) rango = '🥉';

                // Equipo: los humanos mandan su tablero; las IA se generan con su semilla
                const equipo = (p.tipo === 'humano')
                    ? (Array.isArray(p.board) ? p.board : [])
                    : construirEquipoIA(p.nivel || 2, p.seed || 1);

                let equipoHtml = '';
                equipo.forEach(it => {
                    const d = (typeof getPokemonPorNombre === 'function') ? getPokemonPorNombre(it.nombre) : null;
                    if (!d) return;
                    const sprite = (typeof getSpriteUrl === 'function') ? getSpriteUrl(it.spriteId || d.spriteId, it.nombre) : '';
                    const estrellas = (typeof getEstrellasUrl === 'function') ? getEstrellasUrl(it.nivel || 1) : '';

                    const objetos = Array.isArray(it.objetos) ? it.objetos : [];
                    let objetosHtml = '';
                    if (objetos.length) {
                        const iconos = objetos.map(nombreObj => {
                            const od = (typeof OBJETOS !== 'undefined') ? OBJETOS[nombreObj] : null;
                            const src = (od && od.emoji && String(od.emoji).includes('.png')) ? od.emoji : null;
                            return src
                                ? `<img class="objeto-final-icon" src="${src}" alt="${_esc(nombreObj)}" title="${_esc(nombreObj)}" draggable="false" onerror="this.style.display='none'">`
                                : `<span class="objeto-final-emoji" title="${_esc(nombreObj)}">📦</span>`;
                        }).join('');
                        objetosHtml = `<div class="objetos-final">${iconos}</div>`;
                    }

                    equipoHtml += `<div class="unidad-final" title="${_esc(it.nombre)}">
                        <img src="${sprite}" onerror="this.style.display='none'">
                        ${estrellas ? `<img class="estrellas-final" src="${estrellas}">` : ''}
                        ${objetosHtml}
                    </div>`;
                });
                if (!equipoHtml) equipoHtml = `<span style="font-size:.7rem;color:#6b8aaa;font-style:italic;">Sin equipo</span>`;

                // Sinergias (todas)
                const sin = _sinergiasDeEquipo(equipo);
                let sinergiasHtml = '';
                Object.keys(sin).map(k => ({ nombre: k, nivel: sin[k].nivel, esClase: sin[k].esClase }))
                    .sort((a, b) => b.nivel - a.nivel)
                    .forEach(s => {
                        let icono = '';
                        try { icono = s.esClase ? getIconoClase(s.nombre) : getIconoTipo(s.nombre); } catch (e) { icono = ''; }
                        sinergiasHtml += `<div class="sinergia-icono-final" title="${_esc(s.nombre)}">${icono}<span class="lvl">${s.nivel}</span></div>`;
                    });

                fila.innerHTML = `
                    <div class="rango-badge pos-${p.pos}">${rango}</div>
                    <div class="info-entrenador">
                        <img src="assets/avatars/${p.tipo === 'humano' ? 'jugador' : 'rivales'}/${p.avatar}.webp" onerror="this.style.display='none'">
                        <div style="display:flex; flex-direction:column;">
                            <span class="nombre">${_esc(p.nombre)}${p.tipo === 'ia' ? ' 🤖' : ''}</span>
                        </div>
                    </div>
                    <div class="equipo-final">${equipoHtml}</div>
                    <div class="sinergias-final">${sinergiasHtml}</div>
                `;
                lista.appendChild(fila);
            });

            // 🔄 Botón de revancha (reinicia el torneo en la misma sala)
            try {
                const footer = overlay.querySelector('.resultados-footer');
                if (footer && !document.getElementById('btnRevanchaOnline')) {
                    const br = document.createElement('button');
                    br.id = 'btnRevanchaOnline';
                    br.textContent = '🔄 REVANCHA';
                    br.onclick = function () {
                        try {
                            br.disabled = true;
                            br.textContent = '⏳ Reiniciando…';
                            fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: sala }) });
                        } catch (e) { }
                    };
                    footer.appendChild(br);
                }
            } catch (e) { }

            overlay.style.display = 'flex';
        } catch (e) { }
    }

    window.aplicarModoEspectador = aplicarModoEspectador;
    window.mostrarFinTorneoOnline = mostrarFinTorneoOnline;

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
                        <img src="assets/avatars/jugador/${jugador.avatar}.webp" onerror="this.style.display='none'">
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
        const src = 'assets/avatars/jugador/' + av + '.webp';
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
        // 🏆 El ranking del torneo online se pinta desde el estado del servidor
        const rk = document.getElementById('rankingTorneo');
        if (rk && !window._torneoOnline) rk.style.display = 'none';
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
        try { sessionStorage.setItem('pktft_pid_' + sala, pid); } catch (e) { }
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
