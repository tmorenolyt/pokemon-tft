// ============================================================
// UI - PREVIEW DE SUBIDA DE NIVEL
// ============================================================
// Muestra, a la izquierda del +4 EXP, un botón con los iconos
// de lo que desbloqueas al subir de nivel:
//   - ⚪ Pokéball: si la siguiente subida da un slot extra
//   - 💿 Disco Definitivo: si la siguiente subida da un Disco
//   - ⭐ Estrella: si ya estás en nivel máximo
//   - ⬆️ Neutro: si no da nada relevante
//
// También se encarga de:
//   - Poner la clase .nivel-maximo al wrapper al llegar a nivel 8
//   - Deshabilitar el +4 XP al llegar a nivel 8
// ============================================================

(function () {
    'use strict';

    const TABLA_MAX_UNIDADES = {
        1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 6, 8: 6
    };

    let _tooltipActivo = null;
    let _nivelAnteriorVisto = -1;

    // ============================================================
    // Calcular qué se desbloquea al pasar del nivel actual al siguiente
    // ============================================================
    function calcularRecompensaSubida() {
        const nivelActual = (typeof nivelJugador !== 'undefined') ? Number(nivelJugador) : 1;
        const nivelMax = (typeof CONFIG !== 'undefined' && CONFIG.NIVEL_MAXIMO) ? CONFIG.NIVEL_MAXIMO : 8;
        const nivelSiguiente = Math.min(nivelActual + 1, nivelMax);

        if (nivelActual >= nivelMax) {
            return {
                esMaximo: true,
                daSlot: false,
                daDisco: false,
                slotsActuales: TABLA_MAX_UNIDADES[nivelActual] || 1,
                slotsSiguientes: TABLA_MAX_UNIDADES[nivelActual] || 1,
                nivelActual,
                nivelSiguiente
            };
        }

        const slotsActuales = TABLA_MAX_UNIDADES[nivelActual] || 1;
        const slotsSiguientes = TABLA_MAX_UNIDADES[nivelSiguiente] || 1;

        return {
            esMaximo: false,
            daSlot: slotsSiguientes > slotsActuales,
            daDisco: (nivelSiguiente === 5 || nivelSiguiente === 8),
            slotsActuales,
            slotsSiguientes,
            nivelActual,
            nivelSiguiente
        };
    }

    // ============================================================
    // Construir HTML de iconos del botón
    // ============================================================
    function construirIconosHTML(info) {
        if (info.esMaximo) return '<span class="preview-emoji" title="Nivel máximo">⭐</span>';

        const partes = [];
        if (info.daSlot) partes.push('<span class="preview-pokeball" title="+1 slot en el tablero"></span>');
        if (info.daDisco) partes.push('<span class="preview-disco" title="+1 Disco Definitivo">💿</span>');

        if (partes.length === 0) {
            return '<span class="preview-emoji" title="Subir de nivel">⬆️</span>';
        }
        return partes.join('');
    }

    // ============================================================
    // Construir HTML del tooltip flotante
    // ============================================================
    function construirTooltipHTML(info) {
        if (info.esMaximo) {
            return `
                <div class="tooltip-titulo">⭐ Nivel máximo</div>
                <div class="tooltip-linea"><span class="icono">🏆</span><span>Ya estás en el nivel máximo (${info.nivelActual}).</span></div>
            `;
        }

        let html = `<div class="tooltip-titulo">⬆️ Nivel ${info.nivelActual} → ${info.nivelSiguiente}</div>`;

        if (info.daSlot) {
            html += `<div class="tooltip-linea destacada"><span class="icono">⚪</span><span>+1 slot en el tablero (${info.slotsActuales} → ${info.slotsSiguientes})</span></div>`;
        } else {
            html += `<div class="tooltip-linea"><span class="icono">🛡️</span><span>Slots de tablero: ${info.slotsActuales} (sin cambios)</span></div>`;
        }

        if (info.daDisco) {
            html += `<div class="tooltip-linea destacada-dorada"><span class="icono">💿</span><span>+1 Disco Definitivo (desbloquea ULTI)</span></div>`;
        }

        return html;
    }

    // ============================================================
    // Actualizar iconos + tooltip del botón preview
    // ============================================================
    function actualizarBotonPreview() {
        const btn = document.getElementById('btnPreviewSubirNivel');
        const contenedor = document.getElementById('previewIconosSubirNivel');
        if (!btn || !contenedor) return;

        const info = calcularRecompensaSubida();

        contenedor.innerHTML = construirIconosHTML(info);
        btn.classList.toggle('sin-recompensa', !info.daSlot && !info.daDisco && !info.esMaximo);

        if (info.esMaximo) {
            btn.title = 'Nivel máximo alcanzado';
        } else {
            const partes = [];
            if (info.daSlot) partes.push('+1 slot en el tablero');
            if (info.daDisco) partes.push('+1 Disco Definitivo');
            if (partes.length === 0) partes.push('Subir de nivel');
            btn.title = `Subir a nivel ${info.nivelSiguiente}: ${partes.join(' + ')}`;
        }

        if (_tooltipActivo && _tooltipActivo.classList.contains('visible')) {
            const contenido = _tooltipActivo.querySelector('.tooltip-contenido');
            if (contenido) contenido.innerHTML = construirTooltipHTML(info);
        }
    }

    // ============================================================
    // Deshabilitar +4 XP al llegar a nivel máximo
    // ============================================================
    function actualizarBotonExpNivelMaximo() {
        const btn = document.getElementById('btnAdelantarNivel');
        if (!btn) return;

        const nivelActual = (typeof nivelJugador !== 'undefined') ? Number(nivelJugador) : 1;
        const nivelMax = (typeof CONFIG !== 'undefined' && CONFIG.NIVEL_MAXIMO) ? CONFIG.NIVEL_MAXIMO : 8;

        if (nivelActual >= nivelMax) {
            btn.disabled = true;
            btn.classList.add('btn-exp-max');
            btn.title = 'Nivel máximo alcanzado';
        } else {
            btn.disabled = false;
            btn.classList.remove('btn-exp-max');
            btn.title = '+4 EXP';
        }
    }

    // ============================================================
    // Clase .nivel-maximo al wrapper (barra visible, textos ocultos)
    // ============================================================
    function actualizarEstadoNivelMaximo() {
        const wrapper = document.querySelector('.nivel-exp-wrapper');
        if (wrapper) {
            const nivelActual = (typeof nivelJugador !== 'undefined') ? Number(nivelJugador) : 1;
            const nivelMax = (typeof CONFIG !== 'undefined' && CONFIG.NIVEL_MAXIMO) ? CONFIG.NIVEL_MAXIMO : 8;

            if (nivelActual >= nivelMax) {
                wrapper.classList.add('nivel-maximo');
            } else {
                wrapper.classList.remove('nivel-maximo');
            }
        }
        actualizarBotonExpNivelMaximo();
    }

    // ============================================================
    // Tooltip flotante
    // ============================================================
    function crearTooltip() {
        if (_tooltipActivo) return _tooltipActivo;
        const tip = document.createElement('div');
        tip.className = 'preview-tooltip-float';
        tip.innerHTML = '<div class="tooltip-contenido"></div>';
        document.body.appendChild(tip);
        _tooltipActivo = tip;
        return tip;
    }

    function posicionarTooltip(btn) {
        const tip = crearTooltip();
        const rect = btn.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();

        let top = rect.top - tipRect.height - 10;
        let left = rect.left + rect.width / 2 - tipRect.width / 2;

        if (top < 8) top = rect.bottom + 10;
        if (left < 8) left = 8;
        if (left + tipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tipRect.width - 8;
        }

        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
    }

    function mostrarTooltip(btn) {
        const tip = crearTooltip();
        const info = calcularRecompensaSubida();
        const contenido = tip.querySelector('.tooltip-contenido');
        if (contenido) contenido.innerHTML = construirTooltipHTML(info);

        tip.style.visibility = 'hidden';
        tip.classList.add('visible');
        tip.style.visibility = '';
        posicionarTooltip(btn);
    }

    function ocultarTooltip() {
        if (_tooltipActivo) _tooltipActivo.classList.remove('visible');
    }

    // ============================================================
    // Init
    // ============================================================
    function initPreviewSubirNivel() {
        const btn = document.getElementById('btnPreviewSubirNivel');
        if (!btn) {
            setTimeout(initPreviewSubirNivel, 200);
            return;
        }

        if (btn.dataset.previewEnganchado !== '1') {
            btn.dataset.previewEnganchado = '1';
            btn.addEventListener('mouseenter', () => mostrarTooltip(btn));
            btn.addEventListener('mouseleave', ocultarTooltip);
            btn.addEventListener('focus', () => mostrarTooltip(btn));
            btn.addEventListener('blur', ocultarTooltip);
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
            window.addEventListener('resize', () => {
                if (_tooltipActivo && _tooltipActivo.classList.contains('visible')) {
                    posicionarTooltip(btn);
                }
            });
        }

        actualizarEstadoNivelMaximo();
        actualizarBotonPreview();

        if (window._previewSubirNivelIntervalId) {
            clearInterval(window._previewSubirNivelIntervalId);
        }

        window._previewSubirNivelIntervalId = setInterval(() => {
            const nivelActual = (typeof nivelJugador !== 'undefined') ? Number(nivelJugador) : 1;
            if (nivelActual !== _nivelAnteriorVisto) {
                _nivelAnteriorVisto = nivelActual;
                actualizarEstadoNivelMaximo();
                actualizarBotonPreview();
            }
        }, 500);

        console.log('✅ previewSubirNivel.js: botón de preview inicializado');
    }

    window.initPreviewSubirNivel = initPreviewSubirNivel;
    window.actualizarBotonPreviewSubirNivel = actualizarBotonPreview;
    window.calcularRecompensaSubida = calcularRecompensaSubida;

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initPreviewSubirNivel, 250);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initPreviewSubirNivel, 250);
        });
    }

    console.log('✅ previewSubirNivel.js cargado');
})();