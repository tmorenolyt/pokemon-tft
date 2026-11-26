// ============================================================
// UI DE LOGROS + SELECTOR DE MAPAS
// ------------------------------------------------------------
// Panel de logros (🏆), selector de mapas (🗺️), toasts de
// desbloqueo y barra de XP del perfil.
// ============================================================
(function () {
    'use strict';

    if (!window.Logros) return;

    const $ = id => document.getElementById(id);
    let categoriaActiva = 'todos';
    let overlayLogros = null;
    let overlayMapas = null;

    // ------------------------------------------------------------
    // PERFIL / XP
    // ------------------------------------------------------------
    function actualizarPerfilUI() {
        const info = Logros.xpInfo();
        document.querySelectorAll('#menuPrincipal .profile-level').forEach(el => {
            el.textContent = 'Nv. ' + info.nivel;
        });
        document.querySelectorAll('#menuPrincipal .profile-capsule .xp-bar-fill').forEach(el => {
            el.style.width = info.pct.toFixed(1) + '%';
        });
        document.querySelectorAll('#menuPrincipal .profile-capsule .xp-text').forEach(el => {
            el.textContent = Math.round(info.enNivel) + ' / ' + Math.round(info.necesario) + ' XP';
        });
    }

    // ------------------------------------------------------------
    // MAPA SELECCIONADO
    // ------------------------------------------------------------
    function aplicarFondoMapa() {
        // El MENÚ PRINCIPAL conserva siempre su fondo original (Pradera).
        // El mapa elegido se aplica solo dentro de la partida, desde
        // aplicarTerrenoActual(); así un desbloqueo a mitad de combate
        // tampoco cambia el terreno de la arena.
        const juego = document.getElementById('juegoContainer');
        if (juego && getComputedStyle(juego).display !== 'none') return;

        // OJO: la variable se usa dentro de css/base.css, así que la URL
        // relativa debe ser ../assets (igual que el valor por defecto).
        // Con 'assets/...' el navegador la resolvía como /css/assets/... (404).
        document.body.style.setProperty('--terreno-actual', "url('../assets/backgrounds/terreno.webp')");
    }

    function actualizarMapSelector() {
        const id = Logros.mapaSeleccionado();
        const m = Logros.getMapa(id) || Logros.getMapa('auto');
        const thumb = $('mapSelectorThumb');
        if (thumb) thumb.style.backgroundImage = "url('assets/backgrounds/" + m.archivo + "')";
        const nombre = $('mapSelectorName');
        if (nombre) {
            const alt = Logros.mapaAlternando() && id !== 'auto';
            nombre.textContent = m.nombre + (alt ? ' 🔁' : '');
        }
        aplicarFondoMapa();
    }

    function refrescar() {
        actualizarPerfilUI();
        actualizarMapSelector();
        if (overlayLogros) renderLogrosPanel();
        if (overlayMapas) renderMapasPanel();
    }

    // ------------------------------------------------------------
    // HELPERS DE OVERLAY
    // ------------------------------------------------------------
    function crearOverlay(id) {
        let ov = document.getElementById(id);
        if (!ov) {
            ov = document.createElement('div');
            ov.id = id;
            ov.className = 'logros-overlay';
            document.body.appendChild(ov);
        }
        return ov;
    }

    function cerrar(ov) {
        if (!ov) return;
        ov.remove();
        if (ov === overlayLogros) overlayLogros = null;
        if (ov === overlayMapas) overlayMapas = null;
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // ------------------------------------------------------------
    // PANEL DE LOGROS
    // ------------------------------------------------------------
    function abrirLogrosPanel() {
        if (overlayLogros) return;
        overlayLogros = crearOverlay('logrosOverlay');
        renderLogrosPanel();
        overlayLogros.addEventListener('click', e => {
            if (e.target === overlayLogros || e.target.closest('[data-cerrar-logros]')) {
                cerrar(overlayLogros);
                return;
            }
            const tab = e.target.closest('[data-cat]');
            if (tab) {
                categoriaActiva = tab.getAttribute('data-cat');
                renderLogrosPanel();
            }
        });
    }

    function renderLogrosPanel() {
        if (!overlayLogros) return;
        const total = Logros.LOGROS.length;
        const hechos = Logros.totalDesbloqueados();
        const pct = total > 0 ? (hechos / total) * 100 : 0;
        const info = Logros.xpInfo();

        const tabs = Logros.CATEGORIAS.map(c => {
            const activa = c.id === categoriaActiva ? ' activa' : '';
            return '<button type="button" class="logros-tab' + activa + '" data-cat="' + c.id + '">' +
                c.icono + ' ' + esc(c.nombre) + '</button>';
        }).join('');

        const lista = Logros.LOGROS.filter(l => categoriaActiva === 'todos' || l.cat === categoriaActiva);

        const cards = lista.map(l => {
            const ok = Logros.desbloqueado(l.id);
            const objetivo = Math.max(1, Number(l.objetivo) || 1);
            const valor = Math.min(objetivo, Logros.valor(l));
            const p = ok ? 100 : Math.min(100, (valor / objetivo) * 100);
            const mapa = l.mapa ? Logros.getMapa(l.mapa) : null;
            const progresoTexto = ok
                ? 'Conseguido'
                : (l.tipo === 'evento' ? 'Pendiente' : valor + ' / ' + objetivo);
            return '' +
                '<div class="logro-card ' + (ok ? 'desbloqueado' : 'bloqueado') + '">' +
                    '<div class="logro-card-top">' +
                        '<span class="logro-card-icon">' + l.icono + '</span>' +
                        '<span class="logro-card-nombre">' + esc(l.nombre) + '</span>' +
                        (ok ? '<span class="logro-card-check">✓</span>' : '') +
                    '</div>' +
                    '<div class="logro-card-desc">' + esc(l.desc) + '</div>' +
                    '<div class="logro-card-progress"><div class="logro-card-progress-fill" style="width:' + p.toFixed(1) + '%"></div></div>' +
                    '<div class="logro-card-foot">' +
                        '<span>' + progresoTexto + '</span>' +
                        '<span class="logro-card-xp">+' + l.xp + ' XP</span>' +
                    '</div>' +
                    (mapa ? '<div class="logro-card-mapa ' + (Logros.mapaDesbloqueado(mapa.id) ? 'ok' : '') + '">🗺️ ' + esc(mapa.nombre) + '</div>' : '') +
                '</div>';
        }).join('');

        overlayLogros.innerHTML = '' +
            '<div class="logros-modal">' +
                '<div class="logros-header">' +
                    '<div>' +
                        '<div class="logros-titulo">🏆 LOGROS</div>' +
                        '<div class="logros-subtitulo">' + hechos + ' / ' + total + ' desbloqueados · Nv. ' + info.nivel + '</div>' +
                    '</div>' +
                    '<button type="button" class="logros-cerrar" data-cerrar-logros aria-label="Cerrar">✕</button>' +
                '</div>' +
                '<div class="logros-barra"><div class="logros-barra-fill" style="width:' + pct.toFixed(1) + '%"></div></div>' +
                '<div class="logros-tabs">' + tabs + '</div>' +
                '<div class="logros-grid">' + cards + '</div>' +
            '</div>';
    }

    // ------------------------------------------------------------
    // SELECTOR DE MAPAS
    // ------------------------------------------------------------
    function abrirMapasPanel() {
        if (overlayMapas) return;
        overlayMapas = crearOverlay('mapasOverlay');
        renderMapasPanel();
        overlayMapas.addEventListener('click', e => {
            if (e.target === overlayMapas || e.target.closest('[data-cerrar-mapas]')) {
                cerrar(overlayMapas);
                return;
            }
            const card = e.target.closest('[data-mapa]');
            if (!card) return;
            const id = card.getAttribute('data-mapa');
            if (card.classList.contains('bloqueado')) return;
            if (Logros.seleccionarMapa(id)) {
                actualizarMapSelector();
                // Si estamos dentro de una partida, aplicar el cambio al instante.
                const juego = document.getElementById('juegoContainer');
                if (juego && getComputedStyle(juego).display !== 'none' && typeof aplicarTerrenoActual === 'function') {
                    aplicarTerrenoActual(window.rivalActual);
                }
                cerrar(overlayMapas);
            }
        });
    }

    function renderMapasPanel() {
        if (!overlayMapas) return;
        const sel = Logros.mapaSeleccionado();
        const cards = Logros.MAPAS.map(m => {
            const ok = Logros.mapaDesbloqueado(m.id);
            const activo = sel === m.id;
            const logro = m.logro ? Logros.getLogro(m.logro) : null;
            const objetivo = logro ? Math.max(1, Number(logro.objetivo) || 1) : 0;
            const valor = logro ? Math.min(objetivo, Logros.valor(logro)) : 0;
            const req = logro
                ? (ok ? '✓ Desbloqueado' : '🔒 ' + esc(logro.nombre) + ' · ' + valor + '/' + objetivo)
                : ((m.desc ? esc(m.desc) + ' · ' : '') + (m.siempreDesbloqueado ? '✓ Siempre disponible' : '✓ Disponible'));
            return '' +
                '<div class="mapa-card ' + (ok ? 'disponible' : 'bloqueado') + (activo ? ' seleccionado' : '') + '" data-mapa="' + m.id + '">' +
                    '<div class="mapa-thumb" style="background-image:url(\'assets/backgrounds/' + m.archivo + '\')">' +
                        (m.auto ? '<span class="mapa-emoji">🎲</span>' : '') +
                        (ok ? '' : '<span class="mapa-candado">🔒</span>') +
                        (activo ? '<span class="mapa-actual">✓</span>' : '') +
                    '</div>' +
                    '<div class="mapa-nombre">' + m.icono + ' ' + esc(m.nombre) + '</div>' +
                    '<div class="mapa-req">' + req + '</div>' +
                '</div>';
        }).join('');

        const desbloqueados = Logros.MAPAS.filter(m => Logros.mapaDesbloqueado(m.id)).length;
        const esAuto = sel === 'auto';
        const alternar = Logros.mapaAlternando() && !esAuto;

        overlayMapas.innerHTML = '' +
            '<div class="logros-modal mapas-modal">' +
                '<div class="logros-header">' +
                    '<div>' +
                        '<div class="logros-titulo">🗺️ MAPAS</div>' +
                        '<div class="logros-subtitulo">' + desbloqueados + ' / ' + Logros.MAPAS.length + ' disponibles · Elige el escenario de tus partidas</div>' +
                    '</div>' +
                    '<button type="button" class="logros-cerrar" data-cerrar-mapas aria-label="Cerrar">✕</button>' +
                '</div>' +
                '<label class="mapa-alternar' + (esAuto ? ' deshabilitado' : '') + '" title="Tu mapa en las rondas impares; el del rival en las pares">' +
                    '<input type="checkbox" id="mapaAlternarToggle"' + (alternar ? ' checked' : '') + (esAuto ? ' disabled' : '') + '>' +
                    '<span class="mapa-alternar-txt">🔁 Alternar con el mapa del rival</span>' +
                    '<span class="mapa-alternar-hint">' + (esAuto ? 'Automático ya usa el del rival' : 'Tu mapa en rondas impares · rival en pares') + '</span>' +
                '</label>' +
                '<div class="mapas-grid">' + cards + '</div>' +
            '</div>';

        const toggle = document.getElementById('mapaAlternarToggle');
        if (toggle) {
            toggle.addEventListener('change', () => {
                Logros.setAlternarMapa(toggle.checked);
                const juego = document.getElementById('juegoContainer');
                if (juego && getComputedStyle(juego).display !== 'none' && typeof aplicarTerrenoActual === 'function') {
                    aplicarTerrenoActual(window.rivalActual);
                }
            });
        }
    }

    // ------------------------------------------------------------
    // TOASTS
    // ------------------------------------------------------------
    const colaToasts = [];
    let toastActivo = false;

    function encolarToast(logro) {
        colaToasts.push(logro);
        procesarToasts();
    }

    function procesarToasts() {
        if (toastActivo || colaToasts.length === 0) return;
        const logro = colaToasts.shift();
        toastActivo = true;

        const mapa = logro.mapa ? Logros.getMapa(logro.mapa) : null;
        const el = document.createElement('div');
        el.className = 'logro-toast';
        el.innerHTML = '' +
            '<div class="logro-toast-icono">' + logro.icono + '</div>' +
            '<div class="logro-toast-texto">' +
                '<div class="logro-toast-eyebrow">¡LOGRO DESBLOQUEADO!</div>' +
                '<div class="logro-toast-nombre">' + esc(logro.nombre) + '</div>' +
                '<div class="logro-toast-xp">+' + logro.xp + ' XP</div>' +
                (mapa ? '<div class="logro-toast-mapa">🗺️ Nuevo mapa: ' + esc(mapa.nombre) + '</div>' : '') +
            '</div>';
        document.body.appendChild(el);

        try { if (typeof playUISound === 'function') playUISound('levelup.mp3', 0.35); } catch (e) { }

        setTimeout(() => {
            if (el && el.parentNode) el.remove();
            toastActivo = false;
            setTimeout(procesarToasts, 250);
        }, 3400);
    }

    function onDesbloqueo(nuevos) {
        actualizarPerfilUI();
        actualizarMapSelector();
        if (overlayLogros) renderLogrosPanel();
        if (overlayMapas) renderMapasPanel();
        for (const l of nuevos) encolarToast(l);
    }

    // ------------------------------------------------------------
    // BOTONES / INIT
    // ------------------------------------------------------------
    function bind(id, fn) {
        const el = $(id);
        if (el && !el.__logrosBound) {
            el.__logrosBound = true;
            el.addEventListener('click', e => { e.preventDefault(); fn(); });
        }
    }

    function init() {
        if (!window.Logros) return;
        Logros.init();
        // Recupera logros ya cumplidos (p. ej. progreso de Pokédex de
        // partidas anteriores) sin llenar la pantalla de toasts.
        Logros.comprobar(true);
        actualizarPerfilUI();
        actualizarMapSelector();

        // 👤 El perfil y la cápsula los abre el Panel de Usuario (perfilPanel.js).
        // La arena se elige en el Panel de Usuario (pestaña Apariencia → Arenas),
        // así que ya no hay selector de mapa en las pantallas de 1J / 2J.
        bind('btnLogros', abrirLogrosPanel);
        bind('btnLogrosSeleccion', abrirLogrosPanel);
        bind('btnLogrosPerfil', abrirLogrosPanel);

        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            if (overlayMapas) cerrar(overlayMapas);
            else if (overlayLogros) cerrar(overlayLogros);
        });
    }

    window.LogrosUI = {
        init,
        refrescar,
        onDesbloqueo,
        abrirLogrosPanel,
        abrirMapasPanel,
        actualizarPerfilUI,
        actualizarMapSelector,
        aplicarFondoMapa
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
