// ============================================================
// UI - AJUSTES (⚙️)
// ============================================================
// Modal de ajustes con:
//   - Slider de volumen de música
//   - Slider de volumen de efectos
//   - Botón "Volver al menú principal"
//
// Los volúmenes se aplican en tiempo real y se guardan en
// localStorage para que persistan entre partidas.
// ============================================================

// ============================================================
// ESTADO
// ============================================================
let ajustesAbiertos = false;

// Valores por defecto
const VOLUMEN_MUSICA_DEFAULT = 50;
const VOLUMEN_EFECTOS_DEFAULT = 50;

// ============================================================
// INICIALIZAR
// ============================================================
function initAjustes() {
    console.log('⚙️ Inicializando ajustes...');

    const overlay = document.getElementById('ajustesOverlay');
    const btnAjustes = document.getElementById('btnAjustes');
    const btnCerrar = document.getElementById('btnCerrarAjustes');
    const btnVolverMenu = document.getElementById('btnVolverMenuAjustes');
    const sliderMusica = document.getElementById('sliderVolumenMusica');
    const sliderEfectos = document.getElementById('sliderVolumenEfectos');
    const valorMusica = document.getElementById('valorVolumenMusica');
    const valorEfectos = document.getElementById('valorVolumenEfectos');

    if (!overlay || !btnAjustes || !sliderMusica || !sliderEfectos) {
        console.warn('⚠️ ajustes.js: faltan elementos en el DOM');
        return;
    }

    // ============================================================
    // Cargar volúmenes guardados
    // ============================================================
    let volMusica = VOLUMEN_MUSICA_DEFAULT;
    let volEfectos = VOLUMEN_EFECTOS_DEFAULT;

    try {
        const m = localStorage.getItem('volumenMusica');
        if (m !== null && !isNaN(parseFloat(m))) volMusica = parseFloat(m);
        const e = localStorage.getItem('volumenEfectos');
        if (e !== null && !isNaN(parseFloat(e))) volEfectos = parseFloat(e);
    } catch (err) {}

    sliderMusica.value = volMusica;
    sliderEfectos.value = volEfectos;
    valorMusica.textContent = volMusica + '%';
    valorEfectos.textContent = volEfectos + '%';

    // Aplicar al audio
    aplicarVolumenMusica(volMusica);
    aplicarVolumenEfectos(volEfectos);

    // ============================================================
    // Abrir / cerrar
    // ============================================================
    btnAjustes.addEventListener('click', function (e) {
        e.stopPropagation();
        abrirAjustes();
    });

    if (btnCerrar) {
        btnCerrar.addEventListener('click', function (e) {
            e.stopPropagation();
            cerrarAjustes();
        });
    }

    // Click fuera del modal cierra
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            cerrarAjustes();
        }
    });

    // ESC cierra
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && ajustesAbiertos) {
            cerrarAjustes();
            e.preventDefault();
        }
    });

    // ============================================================
    // Sliders
    // ============================================================
    sliderMusica.addEventListener('input', function () {
        const val = parseInt(this.value, 10);
        valorMusica.textContent = val + '%';
        aplicarVolumenMusica(val);
        try { localStorage.setItem('volumenMusica', val); } catch (err) {}
    });

    sliderEfectos.addEventListener('input', function () {
        const val = parseInt(this.value, 10);
        valorEfectos.textContent = val + '%';
        aplicarVolumenEfectos(val);
        try { localStorage.setItem('volumenEfectos', val); } catch (err) {}
    });

    // ============================================================
    // Volver al menú principal
    // ============================================================
    if (btnVolverMenu) {
        btnVolverMenu.addEventListener('click', function (e) {
            e.stopPropagation();
            volverAlMenuDesdeAjustes();
        });
    }

    console.log('✅ Ajustes inicializados');
}

// ============================================================
// ABRIR / CERRAR
// ============================================================
function abrirAjustes() {
    const overlay = document.getElementById('ajustesOverlay');
    if (!overlay) return;

    // Cerrar otros modales si están abiertos
    if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) {
        if (typeof cerrarTienda === 'function') cerrarTienda();
    }
    if (typeof cartaAbierta !== 'undefined' && cartaAbierta) {
        if (typeof cerrarCarta === 'function') cerrarCarta();
    }
    if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto) {
        if (typeof cerrarPanelDatosCombate === 'function') cerrarPanelDatosCombate();
    }
    if (typeof cartaSinergiaAbierta !== 'undefined' && cartaSinergiaAbierta) {
        if (typeof cerrarCartaSinergia === 'function') cerrarCartaSinergia();
    }

    ajustesAbiertos = true;
    overlay.style.display = 'flex';

    if (typeof playButtonSound === 'function') playButtonSound();
}

function cerrarAjustes() {
    const overlay = document.getElementById('ajustesOverlay');
    if (!overlay) return;
    ajustesAbiertos = false;
    overlay.style.display = 'none';
}

// ============================================================
// APLICAR VOLÚMENES
// ============================================================
// La música de preparación (fondoPreparacionAudio) está en main.js
// Los efectos (uiAudioCache, combateAudioActual, etc.) también.
// Aquí tocamos las variables globales que existan.

function aplicarVolumenMusica(porcentaje) {
    // Factor de escala: el slider marca más de lo que suena.
    //   Slider 50% → volumen real 0.15 (un poco más bajo que antes)
    //   Slider 100% → volumen real 0.30
    const FACTOR_MUSICA = 0.30;
    const volSlider = Math.max(0, Math.min(1, porcentaje / 100));
    const vol = volSlider * FACTOR_MUSICA;

    // Música de preparación
    if (typeof fondoPreparacionAudio !== 'undefined' && fondoPreparacionAudio) {
        fondoPreparacionAudio.volume = vol;
    }

    // Música de evolución (si suena)
    if (typeof _evolucionAudioActual !== 'undefined' && _evolucionAudioActual) {
        _evolucionAudioActual.volume = vol * 0.9;
    }

    // Música de VICTORIA / DERROTA (también es música de ronda)
    const volResultado = Math.min(1, vol * 1.5);
    if (typeof _victoriaAudioActual !== 'undefined' && _victoriaAudioActual) {
        _victoriaAudioActual.volume = volResultado;
    }
    if (typeof _derrotaAudioActual !== 'undefined' && _derrotaAudioActual) {
        _derrotaAudioActual.volume = volResultado;
    }

    // 🆕 Música de combate (combate.mp3)
    //    Aquí el factor 0.18 ya está incluido en el volumen base
    if (typeof combateAudioActual !== 'undefined' && combateAudioActual) {
        combateAudioActual.volume = vol * 0.9;
    }

    // 🆕 También el audio cacheado de combate.mp3
    if (typeof uiAudioCache !== 'undefined' && uiAudioCache) {
        const urlCombate = (typeof CONFIG !== 'undefined' && CONFIG.UI_SOUND_URL)
            ? CONFIG.UI_SOUND_URL + 'combate.mp3'
            : null;
        if (urlCombate && uiAudioCache[urlCombate]) {
            uiAudioCache[urlCombate].volume = vol * 0.9;
        }
    }

    // Guardar el volumen real (no el del slider) para futuros audios
    window._volumenMusicaActual = vol;
    window._volumenMusicaSlider = volSlider;
}

function aplicarVolumenEfectos(porcentaje) {
    const vol = Math.max(0, Math.min(1, porcentaje / 100));

        // Audios de UI ya cacheados
    if (typeof uiAudioCache !== 'undefined' && uiAudioCache) {
        // 🆕 Excluir combate.mp3 (lo controla el slider de música)
        const urlCombate = (typeof CONFIG !== 'undefined' && CONFIG.UI_SOUND_URL)
            ? CONFIG.UI_SOUND_URL + 'combate.mp3'
            : null;

        for (let url in uiAudioCache) {
            if (url === urlCombate) continue;  // 🆕 saltar la música de combate

            if (uiAudioCache[url] && uiAudioCache[url].volume !== undefined) {
                if (uiAudioCache[url].volume > 0) {
                    uiAudioCache[url].volume = vol;
                }
            }
        }
    }

        // Audios de movimientos cacheados
    if (typeof movimientoAudioCache !== 'undefined' && movimientoAudioCache) {
        for (let url in movimientoAudioCache) {
            if (movimientoAudioCache[url] && movimientoAudioCache[url].volume !== undefined) {
                if (movimientoAudioCache[url].volume > 0) {
                    movimientoAudioCache[url].volume = vol * 0.4;
                }
            }
        }
    }

    // Guardar el volumen para futuros audios de efectos
    window._volumenEfectosActual = vol;
}

// ============================================================
// VOLVER AL MENÚ PRINCIPAL (Vista de Tarjetas)
// ============================================================
function volverAlMenuDesdeAjustes() {
    if (!confirm('¿Seguro que quieres volver al menú principal? Perderás el progreso de la partida actual.')) {
        return;
    }

    cerrarAjustes();

    const menu = document.getElementById('menuPrincipal');
    const juego = document.getElementById('juegoContainer');

    if (menu) menu.style.display = 'flex';
    if (juego) juego.style.display = 'none';

    // 🆕 Forzar la vista de MENÚ PRINCIPAL (tarjetas), no la de selección
    const vistaMenu = document.getElementById('vistaMenu');
    const vistaSeleccion = document.getElementById('vistaSeleccion');
    if (vistaMenu) vistaMenu.classList.add('activa');
    if (vistaSeleccion) vistaSeleccion.classList.remove('activa');

    if (typeof detenerCronometroPartida === 'function') {
        detenerCronometroPartida();
    }

    if (typeof reiniciarJuego === 'function') {
        reiniciarJuego();
    }

    // 🗺️ Restaurar el fondo del menú a un mapa desbloqueado
    if (window.LogrosUI && typeof LogrosUI.actualizarMapSelector === 'function') {
        LogrosUI.actualizarMapSelector();
    }

    if (typeof resetMusicaPreparacion === 'function') {
    resetMusicaPreparacion();
} else if (typeof pausarFondoPreparacion === 'function') {
    pausarFondoPreparacion();
}
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================
window.initAjustes = initAjustes;
window.abrirAjustes = abrirAjustes;
window.cerrarAjustes = cerrarAjustes;
window.aplicarVolumenMusica = aplicarVolumenMusica;
window.aplicarVolumenEfectos = aplicarVolumenEfectos;

// ============================================================
// AUTO-INIT
// ============================================================
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAjustes, 100);
} else {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initAjustes, 100);
    });
}
