// ============================================================
// PANEL DE USUARIO
// ------------------------------------------------------------
// Perfil con:
//   - Aparición: Arenas, Emotes, Personajes, Marcos, Efectos, Título
//   - Insignias: logros desbloqueados (hasta 4 en la tarjeta)
//   - Detalles: nombre, título y frases personal/victoria/derrota
// Guarda todo en localStorage['pktft_perfil_v1'].
// ============================================================
(function () {
    'use strict';

    if (window.PerfilUsuario) return;

    const CLAVE = 'pktft_perfil_v1';
    const MAX_INSIGNIAS = 4;
    const LIMITES = { nombre: 16, frase: 30, victoria: 50, derrota: 50 };

    const DEFECTOS = {
        nombre: 'Entrenador',
        avatar: 'rojo',
        titulo: 'Entrenador',
        frase: '¡Vamos a jugar!',
        victoria: '¡Victoria! ¡Eres un gran entrenador!',
        derrota: 'La próxima vez será mejor...',
        insignias: [],
        emote: '😀',
        efecto: 'ninguno',
        mapa: 'auto',
        colorBorde: '#4dd4f7'
    };

    const EMOTES = ['😀', '😎', '😉', '😤', '🤔', '😂', '😮', '🥳'];
    const EFECTOS = [
        { id: 'ninguno', nombre: 'Ninguno', icono: '🚫' },
        { id: 'dorado', nombre: 'Dorado', icono: '✨' },
        { id: 'cian', nombre: 'Cian', icono: '🔷' },
        { id: 'fuego', nombre: 'Fuego', icono: '🔥' }
    ];

    const SECCIONES = [
        { id: 'arenas', nombre: 'Arenas', icono: '🏔️' },
        { id: 'emotes', nombre: 'Emotes', icono: '😀' },
        { id: 'personajes', nombre: 'Personajes', icono: '🧑' },
        { id: 'marcos', nombre: 'Marcos', icono: '🔲' },
        { id: 'efectos', nombre: 'Efectos', icono: '✨' },
        { id: 'titulo', nombre: 'Título', icono: '👑' }
    ];

    let datos = cargar();
    let draft = null;
    let tabActiva = 'apariencia';
    let seccionActiva = 'arenas';
    let badgeDetalle = null;
    let overlay = null;
    let avisoTimer = null;
    let vistaPrevia = null;   // vista del menú a la que se vuelve ('menu' | 'seleccion')

    function $(id) { return document.getElementById(id); }

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function cargar() {
        const base = Object.assign({}, DEFECTOS);
        try {
            const raw = localStorage.getItem(CLAVE);
            if (!raw) return base;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return base;
            for (const k in base) {
                if (data[k] !== undefined && data[k] !== null) base[k] = data[k];
            }
            if (!Array.isArray(base.insignias)) base.insignias = [];
            return base;
        } catch (e) { return base; }
    }

    function guardarDatos() {
        try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { }
    }

    function logros() {
        try { return (window.Logros && Array.isArray(Logros.LOGROS)) ? Logros.LOGROS : []; }
        catch (e) { return []; }
    }

    function logroPorId(id) {
        const l = logros().find(x => x.id === id);
        return l || null;
    }

    function desbloqueado(id) {
        try { return !!(window.Logros && Logros.desbloqueado(id)); }
        catch (e) { return false; }
    }

    function mapas() {
        try { return (window.Logros && Array.isArray(Logros.MAPAS)) ? Logros.MAPAS : []; }
        catch (e) { return []; }
    }

    function mapaPorId(id) {
        return mapas().find(m => m.id === id) || null;
    }

    function mapaDesbloqueado(id) {
        try { return !!(window.Logros && Logros.mapaDesbloqueado(id)); }
        catch (e) { return id === 'auto' || id === 'pradera'; }
    }

    function mapaValido(id) {
        const m = mapaPorId(id);
        return !!(m && mapaDesbloqueado(m.id));
    }

    function avatares() {
        try { return Array.isArray(window.AVATARES_JUGADOR) ? window.AVATARES_JUGADOR : []; }
        catch (e) { return []; }
    }

    function avatarValido(id) {
        return avatares().some(a => a.id === id);
    }

    function colores() {
        try { return Array.isArray(window.COLORES_BORDE) ? window.COLORES_BORDE : []; }
        catch (e) { return []; }
    }

    function colorValido(v) {
        return /^#[0-9a-fA-F]{6}$/.test(String(v || ''));
    }

    function nivelInfo() {
        try { return Logros.xpInfo(); }
        catch (e) { return { nivel: 1, xp: 0, pct: 0 }; }
    }

    function opcionesTitulo() {
        const lista = ['Entrenador'];
        for (const l of logros()) {
            if (desbloqueado(l.id) && !lista.includes(l.nombre)) lista.push(l.nombre);
        }
        return lista;
    }

    function nombreActual() { return (draft && draft.nombre) || DEFECTOS.nombre; }
    function avatarActual() { return (draft && draft.avatar) || 'rojo'; }
    function tituloActual() { return (draft && draft.titulo) || 'Entrenador'; }
    function fraseActual() { return (draft && draft.frase) || DEFECTOS.frase; }
    function colorActual() { return (draft && draft.colorBorde) || '#4dd4f7'; }
    function efectoActual() { return (draft && draft.efecto) || 'ninguno'; }
    function emoteActual() { return (draft && draft.emote) || '😀'; }

    function insigniasValidas() {
        if (!draft || !Array.isArray(draft.insignias)) return [];
        return draft.insignias.filter(id => desbloqueado(id)).slice(0, MAX_INSIGNIAS);
    }

    // Retrato (solo la cara) del avatar seleccionado.
    function spriteAvatar(id) {
        const av = avatares().find(a => a.id === id) || avatares()[0];
        const base = av ? av.id : 'rojo';
        return `assets/avatars/jugador/${base}.webp`;
    }

    function fallbackAvatar(id) {
        const av = avatares().find(a => a.id === id) || avatares()[0];
        return `assets/avatars/jugador/${av ? av.id : 'rojo'}.png`;
    }

    function mostrarAviso(texto, ms) {
        const el = $('perfilAviso');
        if (el) el.textContent = texto || '';
        if (avisoTimer) clearTimeout(avisoTimer);
        if (texto) {
            avisoTimer = setTimeout(() => {
                const e = $('perfilAviso');
                if (e) e.textContent = '';
            }, ms || 2600);
        }
    }

    // ============================================================
    // ABRIR / CERRAR
    // ============================================================
    function abrir(tabInicial, seccionInicial) {
        datos = cargar();

        const nombre = String(window.nombreJugador || datos.nombre || DEFECTOS.nombre).trim().slice(0, LIMITES.nombre) || DEFECTOS.nombre;
        const avatar = avatarValido(datos.avatar) ? datos.avatar : (avatarValido(window.avatarJugador) ? window.avatarJugador : 'rojo');
        const color = colorValido(datos.colorBorde) ? datos.colorBorde
            : (colorValido(window.colorBordeJ1) ? window.colorBordeJ1 : DEFECTOS.colorBorde);
        let mapa = (window.Logros && typeof Logros.mapaSeleccionado === 'function') ? Logros.mapaSeleccionado() : datos.mapa;
        if (!mapaValido(mapa)) mapa = 'auto';

        let insignias = (Array.isArray(datos.insignias) ? datos.insignias : []).filter(id => desbloqueado(id)).slice(0, MAX_INSIGNIAS);
        if (insignias.length === 0) {
            insignias = logros().filter(l => desbloqueado(l.id)).slice(0, MAX_INSIGNIAS).map(l => l.id);
        }

        const opciones = opcionesTitulo();
        const titulo = opciones.includes(datos.titulo) ? datos.titulo : 'Entrenador';

        draft = {
            nombre: nombre,
            avatar: avatar,
            titulo: titulo,
            frase: String(datos.frase || DEFECTOS.frase).slice(0, LIMITES.frase),
            victoria: String(datos.victoria || DEFECTOS.victoria).slice(0, LIMITES.victoria),
            derrota: String(datos.derrota || DEFECTOS.derrota).slice(0, LIMITES.derrota),
            insignias: insignias,
            emote: EMOTES.includes(datos.emote) ? datos.emote : '😀',
            efecto: EFECTOS.some(e => e.id === datos.efecto) ? datos.efecto : 'ninguno',
            mapa: mapa,
            colorBorde: color
        };
        badgeDetalle = insignias[0] || (logros().find(l => desbloqueado(l.id)) || {}).id || null;

        tabActiva = tabInicial || 'apariencia';
        seccionActiva = seccionInicial || 'arenas';

        crearOverlay();
        render();
    }

    // ------------------------------------------------------------
    // El panel se integra como una vista más del menú (igual que
    // 1 JUGADOR / 2 JUGADORES). Solo se usa como overlay si el menú
    // no está visible (partida en curso).
    // ------------------------------------------------------------
    function menuVisible() {
        const menu = document.getElementById('menuPrincipal');
        if (!menu) return false;
        if (getComputedStyle(menu).display === 'none') return false;
        const juego = document.getElementById('juegoContainer');
        if (juego && getComputedStyle(juego).display !== 'none') return false;
        return true;
    }

    function activarVistaPerfil() {
        const vista = document.getElementById('vistaPerfil');
        if (!vista) return false;

        const yaActiva = vista.classList.contains('activa');
        if (!yaActiva) {
            const vSel = document.getElementById('vistaSeleccion');
            vistaPrevia = (vSel && vSel.classList.contains('activa')) ? 'seleccion' : 'menu';
        }

        // Si la Pokédex está abierta, se cierra: es otro overlay del menú.
        const pokedex = document.getElementById('pokedexOverlay');
        if (pokedex && pokedex.classList.contains('visible') && typeof window.cerrarPokedex === 'function') {
            try { window.cerrarPokedex(); } catch (e) { }
        }

        const vMenu = document.getElementById('vistaMenu');
        const vSel = document.getElementById('vistaSeleccion');
        if (vMenu) vMenu.classList.remove('activa');
        if (vSel) vSel.classList.remove('activa');
        vista.classList.add('activa');
        return true;
    }

    function restaurarVistaPrevia() {
        const vista = document.getElementById('vistaPerfil');
        const vMenu = document.getElementById('vistaMenu');
        const vSel = document.getElementById('vistaSeleccion');
        if (vista) vista.classList.remove('activa');

        if (vistaPrevia === 'seleccion' && vSel) {
            if (vMenu) vMenu.classList.remove('activa');
            vSel.classList.add('activa');
        } else if (vMenu) {
            if (vSel) vSel.classList.remove('activa');
            vMenu.classList.add('activa');
        }
        vistaPrevia = null;
    }

    function cerrar() {
        if (!overlay) return;
        const eraEmbed = overlay.__embed === true;
        overlay.remove();
        overlay = null;
        draft = null;
        if (avisoTimer) { clearTimeout(avisoTimer); avisoTimer = null; }
        if (eraEmbed) restaurarVistaPrevia();
    }

    function crearOverlay() {
        if (overlay) {
            if (overlay.__embed) activarVistaPerfil();
            return;
        }
        overlay = document.createElement('div');
        overlay.className = 'perfil-overlay';
        overlay.id = 'perfilOverlay';
        overlay.innerHTML = `
            <div class="perfil-modal" role="dialog" aria-modal="true" aria-label="Panel de Usuario">
                <header class="perfil-header">
                    <div class="perfil-brand">
                        <div class="perfil-ball" aria-hidden="true"></div>
                        <div class="perfil-brand-text">
                            <h1>PANEL DE USUARIO</h1>
                            <p>Personaliza tu perfil y estilo</p>
                        </div>
                    </div>
                    <div class="perfil-chip" id="perfilChip"></div>
                </header>
                <nav class="perfil-tabs" id="perfilTabs"></nav>
                <div class="perfil-body" id="perfilBody">
                    <aside class="perfil-side" id="perfilSide"></aside>
                    <main class="perfil-main" id="perfilMain"></main>
                    <aside class="perfil-preview" id="perfilPreview"></aside>
                </div>
                <footer class="perfil-footer">
                    <button type="button" class="perfil-btn" data-perfil-volver>← VOLVER</button>
                    <span class="perfil-aviso" id="perfilAviso"></span>
                    <button type="button" class="perfil-btn guardar" data-perfil-guardar>⚪ CONFIRMAR</button>
                </footer>
            </div>
        `;

        const contenedor = menuVisible()
            ? (document.getElementById('perfilEmbed') || document.getElementById('vistaPerfil'))
            : null;
        if (contenedor) {
            overlay.classList.add('perfil-embed');
            overlay.__embed = true;
            contenedor.appendChild(overlay);
            activarVistaPerfil();
        } else {
            document.body.appendChild(overlay);
        }

        overlay.addEventListener('click', onClick);
        overlay.addEventListener('input', onInput);
        overlay.addEventListener('change', onChange);
        document.addEventListener('keydown', onKey);
    }

    function onKey(e) {
        if (e.key === 'Escape' && overlay) {
            e.preventDefault();
            cerrar();
        }
    }

    function onClick(e) {
        if (e.target === overlay && !overlay.__embed) { cerrar(); return; }
        const btn = e.target.closest ? e.target.closest('button, [data-perfil-mapa], [data-perfil-avatar], [data-perfil-color], [data-perfil-titulo], [data-perfil-emote], [data-perfil-efecto], [data-perfil-badge], [data-perfil-badge-toggle]') : null;

        if (e.target.closest('[data-perfil-volver]')) { cerrar(); return; }

        if (e.target.closest('[data-perfil-guardar]')) { guardarCambios(); return; }

        const tabBtn = e.target.closest('[data-perfil-tab]');
        if (tabBtn) {
            tabActiva = tabBtn.getAttribute('data-perfil-tab');
            if (tabActiva === 'apariencia' && !SECCIONES.some(s => s.id === seccionActiva)) seccionActiva = 'arenas';
            render();
            return;
        }

        const secBtn = e.target.closest('[data-perfil-seccion]');
        if (secBtn) {
            seccionActiva = secBtn.getAttribute('data-perfil-seccion');
            tabActiva = 'apariencia';
            render();
            return;
        }

        const mapCard = e.target.closest('[data-perfil-mapa]');
        if (mapCard) {
            const id = mapCard.getAttribute('data-perfil-mapa');
            if (!mapaDesbloqueado(id)) {
                const m = mapaPorId(id);
                const l = (m && m.logro) ? logroPorId(m.logro) : null;
                mostrarAviso(l ? `🔒 Se desbloquea con «${l.nombre}»` : '🔒 Arena bloqueada');
                return;
            }
            draft.mapa = id;
            render();
            return;
        }

        const avCard = e.target.closest('[data-perfil-avatar]');
        if (avCard) {
            const id = avCard.getAttribute('data-perfil-avatar');
            if (avatarValido(id)) {
                draft.avatar = id;
                render();
            }
            return;
        }

        const colorCard = e.target.closest('[data-perfil-color]');
        if (colorCard) {
            const v = colorCard.getAttribute('data-perfil-color');
            if (colorValido(v)) {
                draft.colorBorde = v;
                render();
            }
            return;
        }

        const titleCard = e.target.closest('[data-perfil-titulo]');
        if (titleCard) {
            draft.titulo = titleCard.getAttribute('data-perfil-titulo');
            render();
            return;
        }

        const emoteCard = e.target.closest('[data-perfil-emote]');
        if (emoteCard) {
            draft.emote = emoteCard.getAttribute('data-perfil-emote');
            render();
            return;
        }

        const efectoCard = e.target.closest('[data-perfil-efecto]');
        if (efectoCard) {
            draft.efecto = efectoCard.getAttribute('data-perfil-efecto');
            render();
            return;
        }

        const badgeBtn = e.target.closest('[data-perfil-badge-toggle]');
        if (badgeBtn) {
            toggleBadge(badgeBtn.getAttribute('data-perfil-badge-toggle'));
            return;
        }

        const badgeCard = e.target.closest('[data-perfil-badge]');
        if (badgeCard) {
            const id = badgeCard.getAttribute('data-perfil-badge');
            if (!desbloqueado(id)) {
                mostrarAviso('🔒 Insignia bloqueada');
                return;
            }
            badgeDetalle = id;
            toggleBadge(id);
            return;
        }
    }

    function toggleBadge(id) {
        if (!id || !desbloqueado(id)) return;
        const idx = draft.insignias.indexOf(id);
        if (idx >= 0) {
            draft.insignias.splice(idx, 1);
        } else {
            if (draft.insignias.length >= MAX_INSIGNIAS) {
                mostrarAviso(`Máximo ${MAX_INSIGNIAS} insignias. Quita una para añadir otra.`);
                return;
            }
            draft.insignias.push(id);
        }
        badgeDetalle = id;
        render();
    }

    function onInput(e) {
        const t = e.target;
        if (!t || !t.id) return;
        if (t.id === 'perfilNombre') {
            draft.nombre = t.value.slice(0, LIMITES.nombre);
            actualizarContador('perfilContadorNombre', draft.nombre, LIMITES.nombre);
            refrescarPreview();
        } else if (t.id === 'perfilFrase') {
            draft.frase = t.value.slice(0, LIMITES.frase);
            actualizarContador('perfilContadorFrase', draft.frase, LIMITES.frase);
            refrescarPreview();
        } else if (t.id === 'perfilVictoria') {
            draft.victoria = t.value.slice(0, LIMITES.victoria);
            actualizarContador('perfilContadorVictoria', draft.victoria, LIMITES.victoria);
        } else if (t.id === 'perfilDerrota') {
            draft.derrota = t.value.slice(0, LIMITES.derrota);
            actualizarContador('perfilContadorDerrota', draft.derrota, LIMITES.derrota);
        }
    }

    function onChange(e) {
        if (e.target && e.target.id === 'perfilTituloSelect') {
            draft.titulo = e.target.value;
            refrescarPreview();
        }
    }

    function actualizarContador(id, valor, max) {
        const el = $(id);
        if (el) el.textContent = `${String(valor || '').length}/${max}`;
    }

    function refrescarPreview() {
        const p = $('perfilPreview');
        if (p) p.innerHTML = renderPreview();
        const chip = $('perfilChip');
        if (chip) chip.innerHTML = renderChip();
    }

    // ============================================================
    // RENDER
    // ============================================================
    function render() {
        if (!overlay || !draft) return;

        const chip = $('perfilChip');
        if (chip) chip.innerHTML = renderChip();

        const tabs = $('perfilTabs');
        if (tabs) {
            const lista = [
                { id: 'apariencia', nombre: 'Apariencia', icono: '👤' },
                { id: 'insignias', nombre: 'Insignias', icono: '🏅' },
                { id: 'detalles', nombre: 'Detalles', icono: '✏️' }
            ];
            tabs.innerHTML = lista.map(t => `
                <button type="button" class="perfil-tab ${tabActiva === t.id ? 'activa' : ''}" data-perfil-tab="${t.id}">
                    ${t.icono} ${t.nombre}
                </button>
            `).join('');
        }

        const body = $('perfilBody');
        if (body) body.classList.toggle('sin-side', tabActiva !== 'apariencia');

        const side = $('perfilSide');
        if (side) {
            if (tabActiva === 'apariencia') {
                side.innerHTML = `<div class="perfil-side-title">Opciones</div>` + SECCIONES.map(s => `
                    <button type="button" class="perfil-side-btn ${seccionActiva === s.id ? 'activa' : ''}" data-perfil-seccion="${s.id}">
                        <span class="perfil-side-icon">${s.icono}</span><span>${s.nombre}</span>
                    </button>
                `).join('');
            } else {
                side.innerHTML = '';
            }
        }

        const main = $('perfilMain');
        if (main) main.innerHTML = renderMain();

        const prev = $('perfilPreview');
        if (prev) prev.innerHTML = renderPreview();

        // Contadores de los campos de Detalles
        actualizarContador('perfilContadorNombre', draft.nombre, LIMITES.nombre);
        actualizarContador('perfilContadorFrase', draft.frase, LIMITES.frase);
        actualizarContador('perfilContadorVictoria', draft.victoria, LIMITES.victoria);
        actualizarContador('perfilContadorDerrota', draft.derrota, LIMITES.derrota);
    }

    function renderChip() {
        const info = nivelInfo();
        return `
            <img src="${spriteAvatar(avatarActual())}" alt="" onerror="this.style.display='none'">
            <div>
                <div class="perfil-chip-name">${esc(nombreActual())}</div>
                <div class="perfil-chip-level">Nv. ${info.nivel || 1}</div>
            </div>
        `;
    }

    function renderMain() {
        if (tabActiva === 'insignias') return renderInsignias();
        if (tabActiva === 'detalles') return renderDetalles();

        switch (seccionActiva) {
            case 'personajes': return renderPersonajes();
            case 'marcos': return renderMarcos();
            case 'emotes': return renderEmotes();
            case 'efectos': return renderEfectos();
            case 'titulo': return renderTitulos();
            case 'arenas':
            default: return renderArenas();
        }
    }

    function cabecera(titulo, sub) {
        return `<div class="perfil-main-head"><h2>${titulo}</h2><p>${sub}</p></div>`;
    }

    // ---------------- Arenas ----------------
    function renderArenas() {
        const lista = mapas();
        const cards = lista.map(m => {
            const ok = mapaDesbloqueado(m.id);
            const sel = draft.mapa === m.id;
            const lock = !ok;
            let req = '';
            if (lock && m.logro) {
                const l = logroPorId(m.logro);
                if (l) req = ` · 🔒 ${l.nombre}`;
            }
            return `
                <div class="perfil-map-card ${sel ? 'seleccionada' : ''} ${lock ? 'bloqueada' : ''}" data-perfil-mapa="${m.id}" title="${esc(m.nombre + req)}">
                    <div class="perfil-map-thumb" style="background-image:url('assets/backgrounds/${m.archivo}')"></div>
                    ${lock ? '<div class="perfil-map-lock">🔒</div>' : ''}
                    ${sel ? '<div class="perfil-map-check">✓</div>' : ''}
                    <div class="perfil-map-name"><span>${m.icono || '🗺️'}</span><span>${esc(m.nombre)}</span></div>
                </div>
            `;
        }).join('');
        return cabecera('Arenas', 'Elige el escenario donde jugarás tus partidas.') + `<div class="perfil-map-grid">${cards}</div>`;
    }

    // ---------------- Personajes ----------------
    function renderPersonajes() {
        const cards = avatares().map(a => `
            <div class="perfil-avatar-card ${draft.avatar === a.id ? 'seleccionada' : ''}" data-perfil-avatar="${a.id}" title="${esc(a.nombre)}">
                <img src="assets/avatars/jugador/${a.archivo}" alt="${esc(a.nombre)}" onerror="this.style.display='none'">
                <span>${esc(a.nombre)}</span>
            </div>
        `).join('');
        return cabecera('Personajes', 'Elige tu avatar de entrenador.') + `<div class="perfil-avatar-grid">${cards}</div>`;
    }

    // ---------------- Marcos ----------------
    function renderMarcos() {
        const cards = colores().map(c => `
            <div class="perfil-color-card ${draft.colorBorde === c.valor ? 'seleccionada' : ''}" data-perfil-color="${c.valor}" title="${esc(c.nombre)}">
                <div class="perfil-color-dot" style="background:${c.valor}"></div>
                <span>${esc(c.nombre)}</span>
            </div>
        `).join('');
        return cabecera('Marcos', 'Color del marco de tu tarjeta de perfil.') + `<div class="perfil-color-grid">${cards}</div>`;
    }

    // ---------------- Emotes ----------------
    function renderEmotes() {
        const cards = EMOTES.map(e => `
            <div class="perfil-emote-card ${draft.emote === e ? 'seleccionada' : ''}" data-perfil-emote="${e}">${e}</div>
        `).join('');
        return cabecera('Emotes', 'Emote que aparecerá en tu tarjeta de perfil.') + `<div class="perfil-emote-grid">${cards}</div>`;
    }

    // ---------------- Efectos ----------------
    function renderEfectos() {
        const cards = EFECTOS.map(e => `
            <div class="perfil-efecto-card ${draft.efecto === e.id ? 'seleccionada' : ''}" data-perfil-efecto="${e.id}">
                <span style="font-size:1.35rem;">${e.icono}</span>
                <span>${e.nombre}</span>
            </div>
        `).join('');
        return cabecera('Efectos', 'Aura alrededor de tu avatar en la tarjeta.') + `<div class="perfil-efecto-grid">${cards}</div>`;
    }

    // ---------------- Títulos ----------------
    function renderTitulos() {
        const opciones = opcionesTitulo();
        const cards = opciones.map(t => `
            <button type="button" class="perfil-title-option ${draft.titulo === t ? 'seleccionada' : ''}" data-perfil-titulo="${esc(t)}">
                <span>${t === 'Entrenador' ? '🎓' : '👑'}</span><span>${esc(t)}</span>
            </button>
        `).join('');
        return cabecera('Título', 'Se muestra debajo de tu nombre en el perfil.') + `<div class="perfil-title-grid">${cards}</div>`;
    }

    // ---------------- Insignias ----------------
    function renderInsignias() {
        const todos = logros();
        const seleccionadas = insigniasValidas();

        const cards = todos.map(l => {
            const ok = desbloqueado(l.id);
            const sel = seleccionadas.includes(l.id);
            return `
                <div class="perfil-badge-card ${ok ? '' : 'bloqueada'} ${sel ? 'seleccionada' : ''}" data-perfil-badge="${l.id}" title="${esc(l.nombre)}">
                    <div class="perfil-medal">${ok ? l.icono : '🔒'}</div>
                    <div class="perfil-badge-name">${esc(l.nombre)}</div>
                    ${sel ? '<div class="perfil-badge-check">✓</div>' : ''}
                </div>
            `;
        }).join('');

        const detalle = (badgeDetalle && logroPorId(badgeDetalle)) || logros().find(l => desbloqueado(l.id)) || logros()[0];
        let detalleHtml = '';
        if (detalle) {
            const ok = desbloqueado(detalle.id);
            const objetivo = Math.max(1, Number(detalle.objetivo) || 1);
            let valor = 0;
            try { valor = Logros.valor(detalle); } catch (e) { valor = 0; }
            const progreso = ok ? 'Conseguido' : (detalle.tipo === 'evento' ? 'Pendiente' : `${Math.min(valor, objetivo)} / ${objetivo}`);
            const seleccionada = seleccionadas.includes(detalle.id);
            detalleHtml = `
                <div class="perfil-badge-detail">
                    <div class="perfil-medal">${ok ? detalle.icono : '🔒'}</div>
                    <div class="perfil-badge-detail-info">
                        <div class="perfil-badge-detail-name">${esc(detalle.nombre)}</div>
                        <div class="perfil-badge-detail-desc">${esc(detalle.desc)}</div>
                        <div class="perfil-badge-detail-progress">${progreso} · +${detalle.xp || 0} XP</div>
                    </div>
                    ${ok ? `<button type="button" class="perfil-btn" data-perfil-badge-toggle="${detalle.id}">${seleccionada ? 'Quitar' : 'Seleccionar'}</button>` : ''}
                </div>
            `;
        }

        return cabecera('Insignias', `Muestra tus logros. Hasta ${MAX_INSIGNIAS} insignias en la tarjeta.`)
            + `<div class="perfil-badge-grid">${cards || '<div class="perfil-preview-empty">Aún no hay insignias.</div>'}</div>`
            + detalleHtml;
    }

    // ---------------- Detalles ----------------
    function renderDetalles() {
        const opciones = opcionesTitulo().map(t => `
            <option value="${esc(t)}" ${draft.titulo === t ? 'selected' : ''}>${esc(t)}</option>
        `).join('');

        return cabecera('Detalles', 'Personaliza tu información de perfil.')
            + `<div class="perfil-form">
                <div class="perfil-field">
                    <label for="perfilNombre">Nombre de entrenador</label>
                    <input id="perfilNombre" type="text" maxlength="${LIMITES.nombre}" value="${esc(draft.nombre)}" autocomplete="off" spellcheck="false">
                    <span class="perfil-counter" id="perfilContadorNombre">${String(draft.nombre).length}/${LIMITES.nombre}</span>
                </div>
                <div class="perfil-field">
                    <label for="perfilTituloSelect">Título</label>
                    <select id="perfilTituloSelect">${opciones}</select>
                </div>
                <div class="perfil-field">
                    <label for="perfilFrase">Frase personal</label>
                    <input id="perfilFrase" type="text" maxlength="${LIMITES.frase}" value="${esc(draft.frase)}" autocomplete="off" spellcheck="false">
                    <span class="perfil-counter" id="perfilContadorFrase">${String(draft.frase).length}/${LIMITES.frase}</span>
                </div>
                <div class="perfil-form-sep"></div>
                <div class="perfil-field">
                    <label for="perfilVictoria">🏆 Frase de victoria</label>
                    <input id="perfilVictoria" type="text" maxlength="${LIMITES.victoria}" value="${esc(draft.victoria)}" autocomplete="off" spellcheck="false">
                    <span class="perfil-counter" id="perfilContadorVictoria">${String(draft.victoria).length}/${LIMITES.victoria}</span>
                </div>
                <div class="perfil-field">
                    <label for="perfilDerrota">❌ Frase de derrota</label>
                    <input id="perfilDerrota" type="text" maxlength="${LIMITES.derrota}" value="${esc(draft.derrota)}" autocomplete="off" spellcheck="false">
                    <span class="perfil-counter" id="perfilContadorDerrota">${String(draft.derrota).length}/${LIMITES.derrota}</span>
                </div>
            </div>`;
    }

    // ============================================================
    // VISTA PREVIA
    // ============================================================
    function renderPreview() {
        if (tabActiva === 'insignias') return renderBadgePreview();
        if (tabActiva === 'apariencia' && seccionActiva === 'arenas') return renderMapPreview();
        return renderProfileCard();
    }

    function renderProfileCard() {
        const info = nivelInfo();
        const insignias = insigniasValidas();
        const medallas = [];
        for (let i = 0; i < MAX_INSIGNIAS; i++) {
            const l = insignias[i] ? logroPorId(insignias[i]) : null;
            medallas.push(l
                ? `<div class="perfil-medal" title="${esc(l.nombre)}">${l.icono}</div>`
                : `<div class="perfil-medal" style="opacity:.22;" title="Insignia vacía">·</div>`);
        }

        const efecto = efectoActual();
        const claseEfecto = efecto !== 'ninguno' ? `efecto-${efecto}` : '';

        return `
            <div class="perfil-profile-card" style="--perfil-marco:${colorActual()}">
                <div class="perfil-preview-level">Lv. ${info.nivel || 1}</div>
                <div class="perfil-preview-emote">${emoteActual()}</div>
                <div class="perfil-portrait ${claseEfecto}">
                    <img src="${spriteAvatar(avatarActual())}" alt="${esc(nombreActual())}" onerror="this.onerror=null;this.src='${fallbackAvatar(avatarActual())}'">
                </div>
                <div class="perfil-preview-name">${esc(nombreActual())}</div>
                <div class="perfil-preview-title">👑 ${esc(tituloActual())}</div>
                <div class="perfil-preview-badges">${medallas.join('')}</div>
                <div class="perfil-preview-phrase">${esc(fraseActual())}</div>
            </div>
        `;
    }

    function renderMapPreview() {
        const m = mapaPorId(draft.mapa) || mapaPorId('auto') || mapas()[0];
        if (!m) return `<div class="perfil-preview-empty">Sin arenas disponibles.</div>`;
        const l = m.logro ? logroPorId(m.logro) : null;
        const req = m.logro && !mapaDesbloqueado(m.id)
            ? `Se desbloquea con «${l ? l.nombre : m.logro}».`
            : (m.desc || 'Un escenario para tus partidas.');
        return `
            <div class="perfil-map-preview">
                <img src="assets/backgrounds/${m.archivo}" alt="${esc(m.nombre)}">
                <h3>${m.icono || '🗺️'} ${esc(m.nombre)}</h3>
                <p>${esc(req)}</p>
            </div>
        `;
    }

    function renderBadgePreview() {
        const l = (badgeDetalle && logroPorId(badgeDetalle)) || logros().find(x => desbloqueado(x.id)) || logros()[0];
        if (!l) return `<div class="perfil-preview-empty">Aún no hay insignias.</div>`;
        const ok = desbloqueado(l.id);
        const objetivo = Math.max(1, Number(l.objetivo) || 1);
        let valor = 0;
        try { valor = Logros.valor(l); } catch (e) { valor = 0; }
        const progreso = ok ? 'Conseguido' : (l.tipo === 'evento' ? 'Pendiente' : `${Math.min(valor, objetivo)} / ${objetivo}`);
        const enTarjeta = insigniasValidas().includes(l.id);
        return `
            <div class="perfil-badge-preview">
                <div class="perfil-medal">${ok ? l.icono : '🔒'}</div>
                <h3>${esc(l.nombre)}</h3>
                <p>${esc(l.desc)}</p>
                <p style="margin-top:8px;color:#fbbf24;font-weight:800;">${progreso} · +${l.xp || 0} XP</p>
                <p style="margin-top:4px;">${enTarjeta ? '✓ En tu tarjeta' : (ok ? 'Pulsa la insignia para mostrarla' : 'Todavía bloqueada')}</p>
            </div>
        `;
    }

    // ============================================================
    // GUARDAR
    // ============================================================
    function guardarCambios() {
        if (!draft) return;

        draft.nombre = String(draft.nombre || '').trim().slice(0, LIMITES.nombre) || DEFECTOS.nombre;
        draft.frase = String(draft.frase || '').trim().slice(0, LIMITES.frase) || DEFECTOS.frase;
        draft.victoria = String(draft.victoria || '').trim().slice(0, LIMITES.victoria) || DEFECTOS.victoria;
        draft.derrota = String(draft.derrota || '').trim().slice(0, LIMITES.derrota) || DEFECTOS.derrota;

        if (!avatarValido(draft.avatar)) draft.avatar = DEFECTOS.avatar;
        if (!colorValido(draft.colorBorde)) draft.colorBorde = DEFECTOS.colorBorde;
        if (!opcionesTitulo().includes(draft.titulo)) draft.titulo = 'Entrenador';
        draft.insignias = insigniasValidas();
        if (!EMOTES.includes(draft.emote)) draft.emote = '😀';
        if (!EFECTOS.some(e => e.id === draft.efecto)) draft.efecto = 'ninguno';
        if (!mapaValido(draft.mapa)) draft.mapa = 'auto';

        datos = JSON.parse(JSON.stringify(draft));
        guardarDatos();

        // Aplicar al menú/J1
        try {
            if (typeof window.aplicarPerfilJugador === 'function') {
                window.aplicarPerfilJugador({
                    nombre: draft.nombre,
                    avatar: draft.avatar,
                    colorBorde: draft.colorBorde
                });
            }
        } catch (e) { }

        // Aplicar arena
        try {
            if (window.Logros && typeof Logros.seleccionarMapa === 'function') {
                Logros.seleccionarMapa(draft.mapa);
            }
            if (window.LogrosUI && typeof LogrosUI.actualizarMapSelector === 'function') {
                LogrosUI.actualizarMapSelector();
            }
        } catch (e) { }

        render();
        mostrarAviso('✅ Cambios guardados');
    }

    // ============================================================
    // VÍNCULOS
    // ============================================================
    function bindBoton(id, tab, seccion) {
        const el = $(id);
        if (!el || el.__perfilBound) return;
        el.__perfilBound = true;
        el.addEventListener('click', (e) => {
            e.preventDefault();
            abrir(tab || 'apariencia', seccion || 'arenas');
        });
    }

    function bindPerfil() {
        bindBoton('btnPerfilMenu', 'apariencia', 'arenas');
        bindBoton('btnPerfilSeleccion', 'apariencia', 'arenas');
        bindBoton('profileCapsuleBtn', 'apariencia', 'arenas');
        bindBoton('selCapsuleBtn', 'apariencia', 'arenas');
        bindBoton('perfilCapsuleBtn2', 'apariencia', 'arenas');

        const perfilPokedex = document.querySelector('#pokedexOverlay button[title="Perfil"]');
        if (perfilPokedex && !perfilPokedex.__perfilBound) {
            perfilPokedex.__perfilBound = true;
            perfilPokedex.addEventListener('click', (e) => {
                e.preventDefault();
                abrir('apariencia', 'arenas');
            });
        }

        ['profileCapsuleBtn', 'selCapsuleBtn', 'perfilCapsuleBtn2'].forEach((id) => {
            const cap = $(id);
            if (!cap || cap.__perfilKey) return;
            cap.__perfilKey = true;
            cap.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    abrir('apariencia', 'arenas');
                }
            });
        });
    }

    window.PerfilUsuario = {
        abrir: abrir,
        cerrar: cerrar,
        datos: function () { return datos; },
        getFrase: function (tipo) {
            if (tipo === 'victoria') return datos.victoria || '';
            if (tipo === 'derrota') return datos.derrota || '';
            return datos.frase || '';
        },
        render: function () { if (overlay) render(); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindPerfil);
    } else {
        bindPerfil();
    }
    setTimeout(bindPerfil, 800);
})();
