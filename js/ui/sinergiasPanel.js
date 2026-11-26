// ============================================================
// PANEL DE SINERGIAS — LISTA + DETALLE (estilo TFT)
// Archivo: js/ui/sinergiasPanel.js
// ------------------------------------------------------------
// Se abre al hacer clic en cualquier sinergia (tipo o clase) y
// muestra, a la izquierda, la lista completa con sus contadores y,
// a la derecha, el detalle de la sinergia seleccionada:
//   - bonus actual y escalado por niveles (2★ → 6★)
//   - campeones que tienen esa sinergia, resaltando los tuyos
//
// Reutiliza obtenerDatosSinergia() de sinergiaCarta.js, así que no
// duplica el cálculo de familias, chips ni niveles.
// ============================================================
(function () {
    'use strict';

    const ESTADO = {
        abierto: false,
        lado: 'player',
        seleccion: null,        // { nombre, esClase }
        el: null,
        listaEl: null,
        detalleEl: null,
        subtituloEl: null,
        pieEl: null,
        debounce: null,
        firma: ''
    };

    // ------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------
    function esc(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // s.icono / data.icono es un string con <img src="..."> o un emoji
    function iconoHTML(icono) {
        if (!icono) return '';
        const m = String(icono).match(/src="([^"]+)"/);
        if (m) return '<img src="' + m[1] + '" alt="" loading="lazy">';
        return '<span class="spl-emoji">' + esc(icono) + '</span>';
    }

    function sinergiasDelLado() {
        const todas = window.sinergiasActuales || {};
        const lista = todas[ESTADO.lado] || [];
        return Array.isArray(lista) ? lista : [];
    }

    // En escritorio el panel vive siempre visible (como el ranking): el
    // botón 📦 lo cambia por el baúl y ⚔️ lo vuelve a poner. En pantallas
    // pequeñas se mantiene el comportamiento de abrir/cerrar a mano.
    function autoPanel() {
        return window.innerWidth >= 761 && window.innerHeight >= 620;
    }

    function enPartida() {
        const j = document.getElementById('juegoContainer');
        if (!j) return false;
        const cs = window.getComputedStyle(j);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        return j.getBoundingClientRect().width > 0;
    }

    // El contenedor puede estar visible un instante antes de tener medidas
    // (transición de entrada): la clase de layout se aplica igual para no
    // enseñar ni un frame de la interfaz antigua.
    function juegoVisible() {
        const j = document.getElementById('juegoContainer');
        if (!j) return false;
        const cs = window.getComputedStyle(j);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
    }

    function actualizarClaseLayout() {
        // En escritorio el layout nuevo se aplica SIEMPRE (también con el
        // juego oculto en el menú, donde no afecta a nada porque todas las
        // reglas van dentro de #juegoContainer). Así, al darle a Jugar el
        // juego ya nace con la interfaz nueva: ni un frame de la antigua.
        const on = autoPanel();
        document.body.classList.toggle('tft-layout', on);
        return on;
    }

    // El panel va pegado a la izquierda, arrancando justo debajo del
    // panel del entrenador y terminando antes del banquillo: así no tapa
    // información ni impide arrastrar desde el banco.
    function aplicarGeometria() {
        const body = document.body;
        const quitar = function () {
            body.style.removeProperty('--spl-top');
            body.style.removeProperty('--spl-h');
        };

        // Clase estable de layout: no depende de si el panel de sinergias
        // o el baúl están abiertos, así al abrir datos de combate (o
        // cualquier otro panel) la interfaz NO vuelve a la antigua.
        if (!actualizarClaseLayout()) {
            quitar();
            return;
        }

        // Si aún no hay medidas (primer frame de la entrada), esperamos al
        // siguiente tick para calcular la geometría, pero la clase ya está.
        if (!enPartida()) { quitar(); return; }

        const col = document.querySelector('#juegoContainer .side-column-player');
        const traits = col ? col.querySelector('.traits-vertical') : null;
        if (!traits) { quitar(); return; }

        // El panel arranca bajo el panel del entrenador y llega hasta el
        // final de la columna, así queda alto y estrecho.
        const info = col.querySelector('.player-info-panel');
        const cr = col.getBoundingClientRect();
        const ir = info ? info.getBoundingClientRect() : traits.getBoundingClientRect();
        const top = Math.round(ir.bottom + 8);
        // Nunca más allá del borde visible de la ventana (la columna puede
        // ser más alta que la pantalla y el panel quedaría cortado).
        const fondo = Math.min(cr.bottom, window.innerHeight) - 8;
        const alto = Math.max(220, Math.round(fondo - top));

        body.style.setProperty('--spl-top', top + 'px');
        body.style.setProperty('--spl-h', alto + 'px');
    }

    // Mantiene el panel abierto mientras se juega en escritorio.
    function mantenerPanel() {
        // En la pantalla de resultados finales (victoria/derrota total) el
        // panel no debe aparecer.
        if (window._pantallaFinalAbierta) {
            if (ESTADO.abierto) cerrar();
            return;
        }
        if (!enPartida()) {
            // Si el contenedor está visible pero aún no tiene medidas
            // (primer frame de la entrada) NO cerramos: evitaría el
            // parpadeo abrir/cerrar. Solo se cierra fuera del juego.
            if (!juegoVisible()) {
                if (ESTADO.abierto) cerrar();
            }
            actualizarClaseLayout();
            return;
        }
        // En pantallas pequeñas se mantiene el abrir/cerrar manual.
        if (!autoPanel()) return;
        if (baulAbierto()) return;   // el baúl ocupa el mismo hueco
        aplicarGeometria();
        if (ESTADO.abierto) return;
        if (window.panelDatosCombateAbierto) return;
        abrir(null, false, 'player');
    }

    // Firma de la lista: evita re-renderizar (y perder el scroll/alineación)
    // cuando getSinergiasActivas() se llama muchas veces por segundo.
    function firmaLista() {
        return sinergiasDelLado().map(function (s) {
            return s.nombre + ':' + s.nivelActual + ':' + s.nivelMaximo + ':' + (s.activa ? 1 : 0);
        }).join('|');
    }

    function esClaseDe(s) {
        return s && s.tipo === 'clase';
    }

    // ------------------------------------------------------------
    // CREAR DOM (una sola vez)
    // ------------------------------------------------------------
    function crearPanel() {
        if (ESTADO.el) return;

        const overlay = document.createElement('div');
        overlay.id = 'panelSinergiasOverlay';
        overlay.className = 'spl-overlay';
        overlay.innerHTML = `
            <div class="spl-shell" role="dialog" aria-modal="true" aria-label="Sinergias">
                <div class="spl-list">
                    <div class="spl-head">
                        <div class="spl-head-ico">⚔️</div>
                        <div class="spl-title">
                            <b>SINERGIAS</b>
                            <span class="spl-sub">0 sinergias</span>
                        </div>
                        <button type="button" class="spl-close" aria-label="Cerrar sinergias">✕</button>
                    </div>
                    <div class="spl-rows"></div>
                    <div class="spl-foot"><span>Pulsa una sinergia</span><span class="spl-foot-count"><b>0</b> sinergias</span></div>
                </div>
                <div class="spl-detail"></div>
                <div class="spl-nv" id="splNuevaVerde"></div>
                <div class="spl-nv" id="splAuraMiedo"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        ESTADO.el = overlay;
        ESTADO.listaEl = overlay.querySelector('.spl-rows');
        ESTADO.detalleEl = overlay.querySelector('.spl-detail');
        ESTADO.subtituloEl = overlay.querySelector('.spl-sub');
        ESTADO.pieEl = overlay.querySelector('.spl-foot-count');

        overlay.addEventListener('click', function (e) {
            // En escritorio el panel vive siempre abierto (como el ranking),
            // así que un clic fuera no lo cierra.
            if (e.target === overlay && !autoPanel()) cerrar();
        });
        overlay.querySelector('.spl-close').addEventListener('click', cerrar);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && ESTADO.abierto && !autoPanel()) cerrar();
        });
    }

    // ------------------------------------------------------------
    // LISTA
    // ------------------------------------------------------------
    function renderLista() {
        if (!ESTADO.el) return;

        const lista = sinergiasDelLado();
        const activas = lista.filter(s => s.activa).length;
        const inactivas = lista.length - activas;

        ESTADO.el.querySelector('.spl-title b').textContent =
            ESTADO.lado === 'enemy' ? 'SINERGIAS RIVAL' : 'SINERGIAS';
        ESTADO.subtituloEl.textContent = lista.length + ' sinergias · ' + activas + ' activas';
        if (ESTADO.pieEl) ESTADO.pieEl.innerHTML = '<b>' + lista.length + '</b> sinergias';

        if (!lista.length) {
            ESTADO.listaEl.innerHTML = '<div class="spl-empty">⚔️ Sin sinergias todavía</div>';
            ESTADO.firma = '';
            renderDetalle();
            return;
        }

        let html = '';
        let separadorPuesto = false;

        lista.forEach(function (s) {
            if (!s.activa && !separadorPuesto && activas > 0) {
                html += '<div class="spl-sep">INACTIVAS · ' + inactivas + '</div>';
                separadorPuesto = true;
            }

            const sel = ESTADO.seleccion &&
                ESTADO.seleccion.nombre === s.nombre &&
                ESTADO.seleccion.esClase === esClaseDe(s);

            const max = Math.min(Math.max(s.nivelMaximo || 0, 1), 6);
            const n = Math.min(Math.max(s.nivelActual || 0, 0), max);
            let dots = '';
            for (let i = 0; i < max; i++) {
                dots += '<s class="' + (i < n ? 'f' : '') + '"></s>';
            }

            html += `
                <button type="button" class="spl-row ${s.activa ? 'on' : 'off'}${sel ? ' sel' : ''}" style="--c:${esc(s.color || '#fbbf24')}">
                    <span class="spl-row-ico">${iconoHTML(s.icono)}</span>
                    <span class="spl-row-txt">
                        <span class="spl-row-name">${esc(s.nombre)}</span>
                        <span class="spl-row-meta">
                            <span class="spl-row-dots">${dots}</span>
                            <span class="spl-row-count">${s.nivelActual || 0}<i>/${s.nivelMaximo || 0}</i></span>
                        </span>
                    </span>
                </button>`;
        });

        ESTADO.listaEl.innerHTML = html;

        // Asignar clicks recorriendo de nuevo la lista en orden
        let idx = 0;
        Array.prototype.forEach.call(ESTADO.listaEl.querySelectorAll('.spl-row'), function (btn) {
            const s = lista[idx++];
            if (!s) return;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                seleccionar(s.nombre, esClaseDe(s));
            });
        });

        // Dejar visible la fila seleccionada (la lista puede tener scroll)
        const filaSel = ESTADO.listaEl.querySelector('.spl-row.sel');
        if (filaSel) {
            const cajaLista = ESTADO.listaEl.getBoundingClientRect();
            const cajaFila = filaSel.getBoundingClientRect();
            const top = (cajaFila.top - cajaLista.top) + ESTADO.listaEl.scrollTop;
            const bottom = top + filaSel.offsetHeight;
            const visibleTop = ESTADO.listaEl.scrollTop;
            const visibleBottom = visibleTop + ESTADO.listaEl.clientHeight;
            if (top < visibleTop) {
                ESTADO.listaEl.scrollTop = Math.max(0, top - 4);
            } else if (bottom > visibleBottom) {
                ESTADO.listaEl.scrollTop = bottom - ESTADO.listaEl.clientHeight + 4;
            }
        }

        ESTADO.firma = firmaLista();
        renderDetalle();
    }

    // ------------------------------------------------------------
    // DETALLE
    // ------------------------------------------------------------
    function renderDetalle() {
        if (!ESTADO.detalleEl) return;

        if (!ESTADO.seleccion) {
            // Abierto desde el botón ⚔️: solo la lista, sin detalle
            ESTADO.detalleEl.style.display = 'none';
            ESTADO.detalleEl.innerHTML = '';
            ESTADO.detalleEl.style.marginTop = '0px';
            actualizarPanelesExtra();
            return;
        }

        const datos = (typeof obtenerDatosSinergia === 'function')
            ? obtenerDatosSinergia(ESTADO.seleccion.nombre, ESTADO.seleccion.esClase, ESTADO.lado)
            : null;

        if (!datos) {
            ESTADO.detalleEl.style.display = 'none';
            ESTADO.detalleEl.innerHTML = '';
            actualizarPanelesExtra();
            return;
        }

        ESTADO.detalleEl.style.display = '';

        const fila = sinergiasDelLado().find(function (s) {
            return s.nombre === datos.nombre && esClaseDe(s) === !!datos.esClase;
        });
        const activa = !!(fila && fila.activa);
        const nivelActivo = datos.nivelActivo || 0;

        const tiers = (datos.niveles || []).map(function (t) {
            const on = t.nivel === nivelActivo;
            return `<div class="spl-tier${on ? ' on' : ''}">
                <span class="spl-tier-n">${t.nivel} <s>★</s></span>
                <span class="spl-tier-d">${esc(t.desc)}</span>
                ${on ? '<span class="spl-tier-p">AHORA</span>' : ''}
            </div>`;
        }).join('');

        const champs = (datos.pokemons || []).map(function (p) {
            const spriteId = p.spriteId || p.id;
            const nivel = p.nivelPokemon > 1 ? `<span class="spl-champ-lvl">${p.nivelPokemon}★</span>` : '';
            const donde = p.activo
                ? (p.ubicacion === 'banquillo' ? ' · banquillo' : ' · tablero')
                : '';
            return `<div class="spl-champ ${p.activo ? 'own' : 'no'}" title="${esc(p.nombre + donde)}">
                <img src="assets/sprites/pokemon/${spriteId}.png" alt="${esc(p.nombre)}" loading="lazy"
                     onerror="this.style.display='none'">
                ${nivel}
            </div>`;
        }).join('');

        const next = (datos.niveles || []).find(function (t) { return !t.alcanzado; });
        let descPrincipal;
        if (nivelActivo > 0 && datos.bonusActivo) {
            descPrincipal = '<b>' + esc(datos.bonusActivo) + '</b>';
        } else if (next) {
            const faltan = Math.max(1, next.nivel - datos.nivelActual);
            descPrincipal = '<b>Sin bonus activo</b> · ' + (faltan === 1 ? 'falta 1' : 'faltan ' + faltan) + ' para nivel ' + next.nivel;
        } else {
            descPrincipal = '<b>Sin bonus activo</b>';
        }

        const propios = (datos.pokemons || []).filter(function (p) { return p.activo; }).length;
        const color = datos.color || '#fbbf24';

        ESTADO.detalleEl.innerHTML = `
            <div class="spl-d-head">
                <div class="spl-d-ico" style="--c:${esc(color)}">${iconoHTML(datos.icono)}</div>
                <div class="spl-d-title">
                    <b>${esc(datos.nombre)}</b>
                    <div class="spl-d-tags">
                        <span class="spl-tag lvl">Nivel ${datos.nivelActual} / ${datos.nivelMaximo}</span>
                        <span class="spl-tag ${activa ? 'on' : 'off'}">${activa ? 'Activa' : 'Inactiva'}</span>
                    </div>
                </div>
                <div class="spl-d-now">Ahora<b>${nivelActivo ? nivelActivo + '★' : '—'}</b></div>
            </div>

            <div class="spl-d-desc" style="--c:${esc(color)}">${descPrincipal}</div>

            <div class="spl-d-label">Escalado</div>
            <div class="spl-tiers">${tiers}</div>

            <div class="spl-d-label">Campeones con ${esc(datos.nombre)}</div>
            <div class="spl-champs">${champs || '<span class="spl-muted">Sin campeones disponibles.</span>'}</div>

            <div class="spl-d-foot">
                <span><b>${propios}</b> de <b>${(datos.pokemons || []).length}</b> campeones en tu equipo</span>
            </div>
        `;

        alinearDetalle();
        actualizarPanelesExtra();
    }

    // Paneles auxiliares del detalle (a su derecha, separación mínima):
    //  · Planta    → Semillas Revivir
    //  · Siniestro → Aura del Miedo
    function actualizarPanelesExtra() {
        const sel = ESTADO.seleccion;
        const abierto = !!ESTADO.abierto;
        const mt = (ESTADO.detalleEl && ESTADO.detalleEl.style.marginTop) || '0px';

        const nv = document.getElementById('splNuevaVerde');
        if (nv) {
            const esPlanta = !!(abierto && sel && !sel.esClase && sel.nombre === 'Planta' &&
                typeof window.construirPanelNuevaVerdeHTML === 'function');
            if (esPlanta) {
                nv.dataset.lado = ESTADO.lado;
                nv.innerHTML = window.construirPanelNuevaVerdeHTML(ESTADO.lado);
                nv.style.display = 'block';
                nv.style.marginTop = mt;
            } else {
                nv.style.display = 'none';
                nv.innerHTML = '';
            }
        }

        const am = document.getElementById('splAuraMiedo');
        if (am) {
            const esSiniestro = !!(abierto && sel && !sel.esClase && sel.nombre === 'Siniestro' &&
                typeof window.construirPanelAuraMiedoHTML === 'function');
            if (esSiniestro) {
                am.dataset.lado = ESTADO.lado;
                am.innerHTML = window.construirPanelAuraMiedoHTML(ESTADO.lado);
                am.style.display = 'block';
                am.style.marginTop = mt;
            } else {
                am.style.display = 'none';
                am.innerHTML = '';
            }
        }
    }

    // Coloca la tarjeta de detalle a la altura de la fila seleccionada
    function alinearDetalle() {
        const det = ESTADO.detalleEl;
        if (!det) return;
        det.style.marginTop = '0px';

        if (window.matchMedia('(max-width: 760px)').matches) return;

        // Alineación SÍNCRONA (forzando reflow). Con rAF/setTimeout la
        // tarjeta podía quedarse arriba si la pestaña estaba en segundo
        // plano o el navegador estrangulaba los timers.
        if (!ESTADO.el || !ESTADO.abierto) return;
        const fila = ESTADO.el.querySelector('.spl-row.sel');
        const shell = ESTADO.el.querySelector('.spl-shell');
        if (!fila || !shell) return;

        const top = fila.getBoundingClientRect().top - shell.getBoundingClientRect().top;
        const altoDet = det.offsetHeight; // fuerza layout
        const max = Math.max(0, shell.clientHeight - altoDet - 6);
        det.style.marginTop = Math.max(0, Math.min(top, max)) + 'px';

        // Si la tarjeta queda recortada por abajo, mover la flecha para
        // que siga apuntando a la fila seleccionada.
        const centroFila = fila.getBoundingClientRect().top + fila.offsetHeight / 2;
        const centroTarjeta = det.getBoundingClientRect().top;
        const alto = det.offsetHeight;
        const flecha = Math.max(16, Math.min(alto - 26, centroFila - centroTarjeta));
        det.style.setProperty('--arrow-top', flecha + 'px');

        // El panel de semillas acompaña al detalle a su misma altura.
        const nv = document.getElementById('splNuevaVerde');
        if (nv && nv.style.display !== 'none') nv.style.marginTop = det.style.marginTop;
    }

    // ------------------------------------------------------------
    // SELECCIÓN / APERTURA / CIERRE
    // ------------------------------------------------------------
    function seleccionar(nombre, esClase) {
        // Si ya estaba seleccionada, el segundo clic cierra el detalle
        // (pero deja el panel de la lista abierto).
        if (ESTADO.seleccion &&
            ESTADO.seleccion.nombre === nombre &&
            ESTADO.seleccion.esClase === !!esClase) {
            ESTADO.seleccion = null;
            Array.prototype.forEach.call(ESTADO.el.querySelectorAll('.spl-row'), function (btn) {
                btn.classList.remove('sel');
            });
            renderDetalle();
            return;
        }

        ESTADO.seleccion = { nombre: nombre, esClase: !!esClase };
        // Actualizar la marca de la fila sin rehacer toda la lista
        Array.prototype.forEach.call(ESTADO.el.querySelectorAll('.spl-row'), function (btn) {
            btn.classList.remove('sel');
        });
        const lista = sinergiasDelLado();
        const idx = lista.findIndex(function (s) {
            return s.nombre === nombre && esClaseDe(s) === !!esClase;
        });
        if (idx >= 0) {
            const filas = ESTADO.el.querySelectorAll('.spl-row');
            if (filas[idx]) filas[idx].classList.add('sel');
        }
        renderDetalle();
    }

    function abrir(nombre, esClase, lado) {
        lado = (lado === 'enemy') ? 'enemy' : 'player';

        // Cerrar carta de Pokémon / panel de datos como hacía la carta antigua
        if (typeof cartaAbierta !== 'undefined' && cartaAbierta && typeof cerrarCarta === 'function') {
            cerrarCarta();
        }
        if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto &&
            typeof cerrarPanelDatosCombate === 'function') {
            cerrarPanelDatosCombate();
        }

        // 🆕 Exclusividad: cerrar el baúl y el ranking al abrir sinergias
        cerrarBaul();
        document.body.classList.remove('mob-ranking-open', 'mob-traits-open');
        const rbtn = document.getElementById('mobRankingBtn');
        if (rbtn) rbtn.classList.remove('activo');

        // Si ya está abierto con la misma sinergia, se cierra (toggle).
        // En escritorio el panel no se cierra: sólo se oculta el detalle.
        if (ESTADO.abierto && ESTADO.lado === lado && ESTADO.seleccion &&
            ESTADO.seleccion.nombre === nombre && ESTADO.seleccion.esClase === !!esClase) {
            if (autoPanel()) {
                ESTADO.seleccion = null;
                if (ESTADO.el) {
                    Array.prototype.forEach.call(ESTADO.el.querySelectorAll('.spl-row'), function (btn) {
                        btn.classList.remove('sel');
                    });
                }
                renderDetalle();
            } else {
                cerrar();
            }
            return;
        }

        crearPanel();
        ESTADO.abierto = true;
        ESTADO.lado = lado;
        window.panelSinergiasAbierto = true;

        const lista = sinergiasDelLado();
        let seleccion = null;
        if (nombre) {
            const encontrada = lista.find(function (s) {
                return s.nombre === nombre && esClaseDe(s) === !!esClase;
            });
            if (encontrada) seleccion = { nombre: encontrada.nombre, esClase: esClaseDe(encontrada) };
        }
        // Si se abre desde el botón ⚔️ (nombre = null), NO se selecciona
        // ninguna sinergia: el detalle queda oculto hasta que el usuario
        // pulse un icono/fila concreto.
        ESTADO.seleccion = seleccion;

        aplicarGeometria();
        ESTADO.el.classList.add('open');
        document.body.classList.add('spl-abierto');
        const dockBtn = document.getElementById('btnDockSinergias');
        if (dockBtn) dockBtn.classList.add('activo');
        renderLista();
    }

    function cerrar() {
        if (!ESTADO.el) return;
        ESTADO.abierto = false;
        window.panelSinergiasAbierto = false;
        ESTADO.el.classList.remove('open');
        document.body.classList.remove('spl-abierto');
        const btn = document.getElementById('mobTraitsBtn');
        if (btn) btn.classList.remove('activo');
        const dock = document.getElementById('btnDockSinergias');
        if (dock) dock.classList.remove('activo');
    }

    // ------------------------------------------------------------
    // ACTUALIZACIÓN EN VIVO
    // (mostrarSinergiasConChips() la llama al recalcular sinergias)
    // ------------------------------------------------------------
    function actualizar() {
        if (!ESTADO.abierto) return;
        // Throttle (no reset del timer): si nos llaman cada frame, el
        // timeout debe poder ejecutarse igualmente.
        if (ESTADO.debounce) return;
        ESTADO.debounce = setTimeout(function () {
            ESTADO.debounce = null;
            if (!ESTADO.abierto) return;

            const lista = sinergiasDelLado();
            if (!lista.length) {
                if (!ESTADO.firma) return;
                ESTADO.seleccion = null;
                renderLista();
                return;
            }

            // Mantener la selección vacía si se abrió desde el botón ⚔️;
            // si la sinergia seleccionada desaparece, ocultar el detalle.
            if (ESTADO.seleccion && !lista.some(function (s) {
                return s.nombre === ESTADO.seleccion.nombre && esClaseDe(s) === ESTADO.seleccion.esClase;
            })) {
                ESTADO.seleccion = null;
            }

            // Nada cambió: no re-renderizar (evita parpadeo y saltos)
            if (firmaLista() === ESTADO.firma) return;

            renderLista();
        }, 120);
    }

    // ------------------------------------------------------------
    // API GLOBAL
    // ------------------------------------------------------------
    window.abrirPanelSinergias = abrir;
    window.cerrarPanelSinergias = cerrar;

    // Oculta sinergias y baúl al mostrar la pantalla de fin de partida.
    window.ocultarPanelesFinPartida = function () {
        window._pantallaFinalAbierta = true;
        if (ESTADO.abierto) cerrar();
        cerrarBaul();
    };
    window.actualizarPanelSinergias = actualizar;
    window.panelSinergiasAbierto = false;

    // ------------------------------------------------------------
    // DOCK ⚔️ / 📦 (arriba a la izquierda)
    // Solo un panel abierto a la vez, como en TFT.
    // ------------------------------------------------------------
    function abrirDesdeBoton() {
        // Abre la lista completa SIN seleccionar ninguna sinergia.
        // Si estaba abierto el baúl, ⚔️ lo cambia otra vez por sinergias.
        if (baulAbierto()) cerrarBaul();
        abrir(null, false, 'player');
    }

    // ---------------- BAÚL ----------------
    function layoutBaulMovil() {
        return window.matchMedia('(max-height: 700px) and (max-width: 1100px)').matches;
    }

    function baulAbierto() {
        return document.body.classList.contains('mob-baul-open') ||
            document.body.classList.contains('baul-flotante-open');
    }

    function cerrarBaul() {
        document.body.classList.remove('mob-baul-open', 'baul-flotante-open');
        const b = document.getElementById('btnDockBaul');
        if (b) b.classList.remove('activo');
        const mb = document.getElementById('mobBaulBtn');
        if (mb) mb.classList.remove('activo');
    }

    function abrirBaul(mostrar) {
        // Exclusividad: sinergias, datos de combate y ranking se cierran
        if (ESTADO.abierto) cerrar();
        if (window.panelDatosCombateAbierto && typeof window.cerrarPanelDatosCombate === 'function') {
            window.cerrarPanelDatosCombate();
        }
        document.body.classList.remove('mob-ranking-open', 'mob-traits-open');
        const rb = document.getElementById('mobRankingBtn');
        if (rb) rb.classList.remove('activo');

        document.body.classList.remove('mob-baul-open', 'baul-flotante-open');
        if (mostrar) {
            aplicarGeometria();
            document.body.classList.add(layoutBaulMovil() ? 'mob-baul-open' : 'baul-flotante-open');
        } else if (autoPanel() && enPartida()) {
            // Al cerrar el baúl vuelve la lista de sinergias (siempre visible).
            abrir(null, false, 'player');
        }

        const b = document.getElementById('btnDockBaul');
        if (b) b.classList.toggle('activo', !!mostrar);
        const mb = document.getElementById('mobBaulBtn');
        if (mb) mb.classList.toggle('activo', !!mostrar);
    }

    window.abrirBaulPanel = abrirBaul;
    window.cerrarBaulPanel = cerrarBaul;

    // Contador de objetos en el badge del 📦
    function actualizarBadgeBaul() {
        const grid = document.getElementById('objetosVerticalGrid');
        const badge = document.getElementById('btnDockBaulBadge');
        if (!grid || !badge) return;
        const n = grid.querySelectorAll('.objeto-slot-vertical[data-objeto-nombre]').length;
        badge.textContent = n;
        badge.style.display = n > 0 ? 'flex' : 'none';
    }

    function observarBaul() {
        const grid = document.getElementById('objetosVerticalGrid');
        if (!grid) return;
        if (!grid.dataset.badgeObs) {
            grid.dataset.badgeObs = '1';
            const mo = new MutationObserver(actualizarBadgeBaul);
            mo.observe(grid, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-objeto-nombre', 'style', 'class']
            });
        }
        actualizarBadgeBaul();
    }

    function bindDock() {
        const bs = document.getElementById('btnDockSinergias');
        if (bs && !bs.dataset.splBound) {
            bs.dataset.splBound = '1';
            bs.addEventListener('click', function (e) {
                e.preventDefault();
                // ⚔️ muestra siempre sinergias (en escritorio no se cierran).
                if (window.panelSinergiasAbierto && !baulAbierto() && !autoPanel()) cerrar();
                else abrirDesdeBoton();
            });
        }

        const bb = document.getElementById('btnDockBaul');
        if (bb && !bb.dataset.splBound) {
            bb.dataset.splBound = '1';
            bb.addEventListener('click', function (e) {
                e.preventDefault();
                abrirBaul(!baulAbierto());
            });
        }

        // 🏆 Ranking: muestra u oculta el panel del torneo
        const br = document.getElementById('btnDockRanking');
        if (br && !br.dataset.splBound) {
            br.dataset.splBound = '1';
            br.classList.add('activo');
            br.addEventListener('click', function (e) {
                e.preventDefault();
                const oculto = document.body.classList.toggle('ranking-oculto');
                br.classList.toggle('activo', !oculto);
            });
        }

        observarBaul();
        actualizarBadgeBaul();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindDock);
    } else {
        bindDock();
    }
    setTimeout(bindDock, 300);
    setTimeout(observarBaul, 1200);

    // Layout nuevo desde el primer momento (en escritorio); el juego
    // nace ya con la interfaz nueva al pulsar Jugar.
    actualizarClaseLayout();

    // Panel siempre visible como el ranking (sólo mientras se juega).
    setInterval(mantenerPanel, 700);
    setTimeout(mantenerPanel, 800);
    window.addEventListener('resize', function () { setTimeout(aplicarGeometria, 60); });

    // Evita el parpadeo de la interfaz antigua al entrar en partida:
    // en cuanto se muestra #juegoContainer aplicamos el layout nuevo
    // (clase tft-layout + panel) sin esperar al primer tick.
    (function observarEntradaPartida() {
        const juego = document.getElementById('juegoContainer');
        if (!juego || typeof MutationObserver === 'undefined') return;
        let pendiente = false;
        const aplicar = function () {
            if (pendiente) return;
            pendiente = true;
            Promise.resolve().then(function () {
                pendiente = false;
                // 1º la clase (aunque aún no haya medidas) para que no se
                // vea ni un frame de la interfaz antigua.
                if (!actualizarClaseLayout()) return;
                // Pantalla de fin de partida: no reabrir el panel.
                if (window._pantallaFinalAbierta) return;
                // En el menú (juego oculto) no se toca ningún panel.
                if (!juegoVisible()) return;
                aplicarGeometria();
                // 2º abrir el panel ya, sin esperar al tick de 700 ms.
                if (!ESTADO.abierto && !window.panelDatosCombateAbierto && !baulAbierto()) {
                    abrir(null, false, 'player');
                }
            });
        };
        const obs = new MutationObserver(aplicar);
        obs.observe(juego, { attributes: true, attributeFilter: ['style', 'class'] });
        obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    })();
})();
