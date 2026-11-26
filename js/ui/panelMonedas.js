// ============================================================
// PANELES DE MONEDAS (AHORRO) — 5 casillas verticales
// Archivo: js/ui/panelMonedas.js
// ------------------------------------------------------------
// - Jugador: columna de 5 casillas junto a su banco.
// - Rival: mismo panel; para que quepa, el banco del rival se corre
//   a la derecha (ancho del panel + 8 px de hueco) y el panel ocupa
//   el sitio que deja libre. En ventanas estrechas el panel se hace
//   algo más fino (CSS) para caber entre el tablero y el ranking.
// Cada casilla muestra una moneda y se ilumina por cada 10 de oro
// ahorrado (máx. 5). La cabecera muestra el oro actual.
// Es solo informativo: no intercepta clics ni arrastres.
// ============================================================
(function () {
    'use strict';

    const SLOTS = 5;
    const ORO_POR_MONEDA = 10;
    const firmas = { jugador: '', rival: '' };

    function enJuego() {
        const j = document.getElementById('juegoContainer');
        if (!j) return false;
        const cs = window.getComputedStyle(j);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        return j.getBoundingClientRect().width > 0;
    }

    function crearSlots(gridId, clave) {
        const grid = document.getElementById(gridId);
        if (!grid || grid.dataset.listo === '1') return;
        let html = '';
        for (let i = 0; i < SLOTS; i++) {
            html += '<div class="coin-slot" data-i="' + i + '">' +
                '<img src="assets/icons/moneda.png" alt="" draggable="false">' +
                '</div>';
        }
        grid.innerHTML = html;
        grid.dataset.listo = '1';
        firmas[clave] = '';
    }

    // Lee el oro del panel correspondiente. Devuelve null si no es un
    // número (p. ej. "∞" en las rondas PvE).
    function oroDe(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const txt = String(el.textContent).replace(/[^\d]/g, '');
        if (!txt) return null;
        const n = parseInt(txt, 10);
        return Number.isFinite(n) ? Math.max(0, n) : null;
    }

    // Oro del rival: número, o "∞" en las rondas PvE (salvaje sin economía).
    function totalRival() {
        const el = document.getElementById('enemyGoldInfo');
        if (!el) return null;
        const txt = String(el.textContent).trim();
        if (!txt) return null;
        if (/\u221e|inf/i.test(txt)) return '\u221e';
        const n = parseInt(txt.replace(/[^\d]/g, ''), 10);
        return Number.isFinite(n) ? Math.max(0, n) : null;
    }

    function ocultar(panelId) {
        const p = document.getElementById(panelId);
        if (p) p.style.display = 'none';
    }

    function pintar(panelId, totalId, clave, total, x, y) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.style.display = 'flex';
        panel.style.left = Math.round(x) + 'px';
        panel.style.top = Math.round(y) + 'px';

        const totalEl = document.getElementById(totalId);
        if (totalEl) totalEl.textContent = total;

        const numerico = typeof total === 'number' && Number.isFinite(total);
        const encendidas = numerico
            ? Math.max(0, Math.min(SLOTS, Math.floor(total / ORO_POR_MONEDA)))
            : 0;
        const firma = encendidas + ':' + total;
        if (firma === firmas[clave]) return;
        firmas[clave] = firma;

        const slots = panel.querySelectorAll('.coin-slot');
        Array.prototype.forEach.call(slots, function (slot, i) {
            slot.classList.toggle('on', i < encendidas);
            slot.title = (i + 1) * ORO_POR_MONEDA + ' de oro ahorrado';
        });
    }

    // ---------------- JUGADOR ----------------
    function actualizarJugador() {
        const panelId = 'panelMonedas';
        if (!document.getElementById(panelId)) return;

        if (!document.body.classList.contains('tft-layout') || !enJuego()) {
            ocultar(panelId);
            return;
        }

        const bank = document.querySelector('#juegoContainer .side-column-player .bank-container-player');
        const board = document.querySelector('#juegoContainer .board-wrapper-player');
        if (!bank) { ocultar(panelId); return; }

        const rb = bank.getBoundingClientRect();
        const rboard = board ? board.getBoundingClientRect() : null;
        const izquierda = Math.round(rb.right) + 8;

        if (rb.right <= 0 || (rboard && izquierda + 85 > rboard.left - 4)) {
            ocultar(panelId);
            return;
        }

        const total = oroDe('playerGoldInfo');
        if (total === null) { ocultar(panelId); return; }

        pintar(panelId, 'coinPanelTotal', 'jugador', total, izquierda, rb.top);
    }

    // ---------------- RIVAL ----------------
    function actualizarRival() {
        const panelId = 'panelMonedasRival';
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const body = document.body;
        const apagar = function () {
            ocultar(panelId);
            body.classList.remove('enemy-coin-on');
        };

        if (!body.classList.contains('tft-layout') || !enJuego()) { apagar(); return; }

        const col = document.querySelector('#juegoContainer .side-column-enemy');
        const bank = document.querySelector('#juegoContainer .side-column-enemy .bank-container-enemy');
        const board = document.querySelector('#juegoContainer .board-wrapper-enemy');
        const rank = document.getElementById('rankingTorneo');
        if (!col || !bank || !board || !rank) { apagar(); return; }

        const rc = col.getBoundingClientRect();
        const rb = bank.getBoundingClientRect();
        const rboard = board.getBoundingClientRect();
        const rr = rank.getBoundingClientRect();
        const rankVisible = rr.width > 0 && window.getComputedStyle(rank).display !== 'none';
        // Si el ranking está oculto (botón 🏆), hay vía libre hasta el borde.
        const limiteDerecho = rankVisible ? rr.left : (window.innerWidth - 8);

        // El banco parte de left:0 dentro de su columna; al activar la
        // clase se desplaza el ancho del panel + 4 px y el panel ocupa
        // su hueco.
        const panelW = Math.round(parseFloat(window.getComputedStyle(panel).width)) || 85;
        const shiftRival = panelW + 4;
        const originalLeft = Math.round(rc.left);
        const huecoPanel = originalLeft >= Math.round(rboard.right) + 4;
        const huecoBanco = (limiteDerecho - (originalLeft + 85 + shiftRival)) >= 2;

        const total = totalRival();
        if (total === null || !huecoPanel || !huecoBanco) { apagar(); return; }

        body.classList.add('enemy-coin-on');
        body.style.setProperty('--enemy-bank-shift', shiftRival + 'px');
        pintar(panelId, 'coinPanelTotalRival', 'rival', total, originalLeft, rb.top);
    }

    function actualizar() {
        crearSlots('coinPanelGrid', 'jugador');
        crearSlots('coinPanelGridRival', 'rival');
        actualizarJugador();
        actualizarRival();
    }

    function iniciar() {
        actualizar();
        setInterval(actualizar, 350);
        window.addEventListener('resize', function () { setTimeout(actualizar, 80); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
    setTimeout(iniciar, 1200);
})();
