// ============================================================
// DRAG & DROP ESTILO SOLITARIO - v19 (FIX drag de objetos)
// ============================================================
// v19:
//   - FIX: el pointerdown sobre el CONTENEDOR de objetos equipados
//     (.objetos-equipados) ya NO arrastra el Pokémon. Antes, si
//     pulsabas en el hueco/padding entre iconos, el evento burbujeaba
//     a la celda y dragDrop.js arrastraba la unidad.
//   - FIX: se ignoran también los pointerdown dentro de
//     .objetos-equipados aunque el target sea el contenedor.
//
// v18:
//   - SHINY en el fantasma del drag
//   - El sprite de la celda origen mira a la DERECHA durante el drag
// ============================================================

(function () {
    'use strict';

    const AZUL       = '#67bed9';
    const AZUL_RGB   = '103, 190, 217';
    const BEIGE      = '#e1d0ab';
    const BEIGE_RGB  = '225, 208, 171';
    const ROJO       = '#ef4444';
    const ROJO_RGB   = '239, 68, 68';

    const RANGO_CUBRE_TODO = 11;

    const dragState = {
        activo: false,
        tipoOrigen: null,
        indiceOrigen: null,
        unidad: null,
        celdaOrigen: null,
        fantasma: null,
        offsetX: 0,
        offsetY: 0,
        startX: 0,
        startY: 0,
        umbralSuperado: false,
        pointerId: null,
        coloresAplicados: false,
        indiceHover: null,
    };

    const UMBRAL_DRAG = 6;

    // ============================================================
    // HELPERS
    // ============================================================

    function _spriteMiraDerechaSafe(spriteId) {
        if (typeof window._spriteMiraDerecha === 'function') {
            try {
                return window._spriteMiraDerecha(spriteId);
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    function _getSpriteScaleSafe(spriteId) {
        if (typeof getSpriteScale === 'function') {
            try { return getSpriteScale(spriteId); } catch (e) {}
        }
        return 1;
    }

    function _getSpriteOffsetXSafe(spriteId) {
        if (typeof getSpriteOffsetX === 'function') {
            try { return getSpriteOffsetX(spriteId); } catch (e) {}
        }
        return '0px';
    }

    function puedeArrastrar(tipo, indice) {
        if (typeof combatiendo !== 'undefined' && combatiendo) {
            return tipo === 'banquillo';
        }
        if (tipo === 'enemigo' || tipo === 'enemigoBanquillo') {
            return !!window.modoCreativo;
        }
        return tipo === 'tablero' || tipo === 'banquillo';
    }

    function obtenerUnidadDe(tipo, indice) {
        if (tipo === 'tablero') return tablero[indice] || null;
        if (tipo === 'banquillo') return banquillo[indice] || null;
        if (tipo === 'enemigo') return enemyBoard[indice] || null;
        if (tipo === 'enemigoBanquillo') return enemyBanquillo[indice] || null;
        return null;
    }

    function esDestinoValido(tipoOrigen, tipoDestino) {
        const origenJugador = tipoOrigen === 'tablero' || tipoOrigen === 'banquillo';
        const destinoJugador = tipoDestino === 'tablero' || tipoDestino === 'banquillo';
        const origenEnemigo = tipoOrigen === 'enemigo' || tipoOrigen === 'enemigoBanquillo';
        const destinoEnemigo = tipoDestino === 'enemigo' || tipoDestino === 'enemigoBanquillo';

        if ((origenJugador && destinoEnemigo) || (origenEnemigo && destinoJugador)) {
            return false;
        }
        if (destinoEnemigo && !window.modoCreativo) {
            return false;
        }
        return true;
    }

    function bloquearClicksGlobales(ms) {
        if (document.body.dataset.dragBlockClicks === '1') return;
        document.body.dataset.dragBlockClicks = '1';

        const blocker = function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        };

        document.addEventListener('click', blocker, true);
        document.addEventListener('pointerup', blocker, true);
        document.addEventListener('mouseup', blocker, true);
        document.addEventListener('pointerdown', blocker, true);

        setTimeout(() => {
            document.removeEventListener('click', blocker, true);
            document.removeEventListener('pointerup', blocker, true);
            document.removeEventListener('mouseup', blocker, true);
            document.removeEventListener('pointerdown', blocker, true);
            delete document.body.dataset.dragBlockClicks;
        }, ms);
    }

    window.bloquearClicksGlobales = bloquearClicksGlobales;

    function aplicarColoresDeSeleccion(tipoOrigen, indiceOrigen, unidad, indiceHover) {
        if (indiceHover === undefined) indiceHover = null;

        limpiarColoresDeSeleccion();

        const indiceBase = (indiceHover !== null) ? indiceHover : indiceOrigen;

        if (tipoOrigen === 'tablero') {
            let rango = 1;
            if (typeof obtenerRangoAtaque === 'function') {
                rango = obtenerRangoAtaque(unidad);
            }

            const rangoCubreTodo = (rango >= RANGO_CUBRE_TODO);

            document.querySelectorAll('#playerBoard .board-cell').forEach((cell, i) => {
                if (i === indiceBase) return;

                let enRango = rangoCubreTodo;
                if (!rangoCubreTodo && typeof estaEnRango === 'function') {
                    enRango = estaEnRango(indiceBase, i, rango);
                }

                if (enRango) {
                    cell.style.setProperty('border', '3px solid ' + BEIGE, 'important');
                    cell.style.setProperty('box-shadow',
                        '0 0 25px rgba(' + BEIGE_RGB + ', 0.5), inset 0 0 25px rgba(' + BEIGE_RGB + ', 0.12)',
                        'important');
                } else {
                    cell.style.setProperty('border', '3px solid ' + AZUL, 'important');
                    cell.style.setProperty('box-shadow',
                        '0 0 25px rgba(' + AZUL_RGB + ', 0.4), inset 0 0 25px rgba(' + AZUL_RGB + ', 0.10)',
                        'important');
                }
            });

            document.querySelectorAll('#enemigoBoard .board-cell').forEach((cell, i) => {
                let enRango = rangoCubreTodo;
                if (!rangoCubreTodo && typeof estaEnRangoEntreTableros === 'function') {
                    enRango = estaEnRangoEntreTableros(indiceBase, i, rango);
                }

                if (enRango) {
                    cell.style.setProperty('border', '3px solid ' + BEIGE, 'important');
                    cell.style.setProperty('box-shadow',
                        '0 0 25px rgba(' + BEIGE_RGB + ', 0.5), inset 0 0 25px rgba(' + BEIGE_RGB + ', 0.12)',
                        'important');
                } else {
                    cell.style.removeProperty('border');
                    cell.style.removeProperty('box-shadow');
                }
            });

            document.querySelectorAll('#banquilloGrid .bank-cell').forEach(cell => {
                cell.style.setProperty('border', '3px solid ' + AZUL, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 20px rgba(' + AZUL_RGB + ', 0.3), inset 0 0 20px rgba(' + AZUL_RGB + ', 0.08)',
                    'important');
            });
        }

        if (tipoOrigen === 'banquillo') {
            document.querySelectorAll('#playerBoard .board-cell').forEach(cell => {
                cell.style.setProperty('border', '3px solid ' + AZUL, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 25px rgba(' + AZUL_RGB + ', 0.5), inset 0 0 25px rgba(' + AZUL_RGB + ', 0.12)',
                    'important');
            });
            document.querySelectorAll('#banquilloGrid .bank-cell').forEach(cell => {
                cell.style.setProperty('border', '3px solid ' + AZUL, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 20px rgba(' + AZUL_RGB + ', 0.3), inset 0 0 20px rgba(' + AZUL_RGB + ', 0.08)',
                    'important');
            });
            document.querySelectorAll('#enemigoBoard .board-cell, #enemyBanquilloGrid .bank-cell').forEach(cell => {
                cell.style.removeProperty('border');
                cell.style.removeProperty('box-shadow');
            });
        }

        if (tipoOrigen === 'enemigo') {
            document.querySelectorAll('#enemigoBoard .board-cell').forEach((cell, i) => {
                if (i === indiceBase) return;
                cell.style.setProperty('border', '3px solid ' + ROJO, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 25px rgba(' + ROJO_RGB + ', 0.4), inset 0 0 25px rgba(' + ROJO_RGB + ', 0.10)',
                    'important');
            });
            document.querySelectorAll('#enemyBanquilloGrid .bank-cell').forEach(cell => {
                cell.style.setProperty('border', '3px solid ' + ROJO, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 20px rgba(' + ROJO_RGB + ', 0.3), inset 0 0 20px rgba(' + ROJO_RGB + ', 0.08)',
                    'important');
            });
            document.querySelectorAll('#playerBoard .board-cell, #banquilloGrid .bank-cell').forEach(cell => {
                cell.style.removeProperty('border');
                cell.style.removeProperty('box-shadow');
                cell.style.removeProperty('background');
            });
        }

        if (tipoOrigen === 'enemigoBanquillo') {
            document.querySelectorAll('#enemigoBoard .board-cell').forEach(cell => {
                cell.style.setProperty('border', '3px solid ' + ROJO, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 25px rgba(' + ROJO_RGB + ', 0.5), inset 0 0 25px rgba(' + ROJO_RGB + ', 0.12)',
                    'important');
            });
            document.querySelectorAll('#enemyBanquilloGrid .bank-cell').forEach(cell => {
                cell.style.setProperty('border', '3px solid ' + ROJO, 'important');
                cell.style.setProperty('box-shadow',
                    '0 0 20px rgba(' + ROJO_RGB + ', 0.3), inset 0 0 20px rgba(' + ROJO_RGB + ', 0.08)',
                    'important');
            });
        }

        dragState.coloresAplicados = true;
    }

    function limpiarColoresDeSeleccion() {
        document.querySelectorAll(
            '#playerBoard .board-cell, #enemigoBoard .board-cell, ' +
            '#banquilloGrid .bank-cell, #enemyBanquilloGrid .bank-cell'
        ).forEach(cell => {
            cell.style.removeProperty('border');
            cell.style.removeProperty('box-shadow');
        });
        dragState.coloresAplicados = false;
    }

    function posicionarBotonVenderDrag() {
        const actionBar = document.querySelector('.action-bar');
        if (!actionBar) return;

        const rect = actionBar.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const separacion = 6;

        const btn = document.getElementById('btnVenderDrag');
        if (btn && btn.style.display !== 'none') {
            const anchoBtn = btn.offsetWidth || 90;
            const altoBtn  = btn.offsetHeight || 54;
            let left = rect.left - anchoBtn - separacion;
            let top;
            if (left < 8) {
                left = Math.max(8, rect.left);
                top = Math.max(8, rect.top - altoBtn - 8);
            } else {
                top = rect.top + (rect.height - altoBtn) / 2;
            }
            btn.style.left = left + 'px';
            btn.style.top  = top + 'px';
        }

        // 🆕 Botón vender duplicado (a la derecha de la barra de acciones)
        const btn2 = document.getElementById('btnVenderDrag2');
        if (btn2 && btn2.style.display !== 'none') {
            const anchoBtn2 = btn2.offsetWidth || 90;
            const altoBtn2  = btn2.offsetHeight || 54;
            btn2.style.left = (rect.right + separacion) + 'px';
            btn2.style.top  = (rect.top + (rect.height - altoBtn2) / 2) + 'px';
        }
    }

    function mostrarBotonVenderDrag(tipoOrigen, unidad) {
        const btn = document.getElementById('btnVenderDrag');
        const btn2 = document.getElementById('btnVenderDrag2');
        if (!btn) return;

        const esJugador = tipoOrigen === 'tablero' || tipoOrigen === 'banquillo';
        const esVendible = esJugador && unidad && !unidad.esZacian;

        if (!esVendible) {
            btn.style.display = 'none';
            if (btn2) btn2.style.display = 'none';
            return;
        }

        const costeBase = unidad.costeOriginal || (unidad.pokemon && unidad.pokemon.coste) || 1;
        let multiplicador = 1;
        if (unidad.nivel === 2) multiplicador = 3;
        else if (unidad.nivel === 3) multiplicador = 9;

        const precio = costeBase * multiplicador;

        const precioEl = document.getElementById('venderDragPrecio');
        if (precioEl) precioEl.textContent = precio;
        const precioEl2 = document.getElementById('venderDragPrecio2');
        if (precioEl2) precioEl2.textContent = precio;

        btn.style.display = 'flex';
        btn.classList.remove('drag-hover');
        btn.classList.remove('drag-invalido');
        if (btn2) {
            btn2.style.display = 'flex';
            btn2.classList.remove('drag-hover');
            btn2.classList.remove('drag-invalido');
        }

        posicionarBotonVenderDrag();
    }

    function ocultarBotonVenderDrag() {
        const btn = document.getElementById('btnVenderDrag');
        const btn2 = document.getElementById('btnVenderDrag2');
        if (btn) {
            btn.style.display = 'none';
            btn.classList.remove('drag-hover');
            btn.classList.remove('drag-invalido');
        }
        if (btn2) {
            btn2.style.display = 'none';
            btn2.classList.remove('drag-hover');
            btn2.classList.remove('drag-invalido');
        }
    }

    function getBotonVenderSobre(e) {
        const ids = ['btnVenderDrag', 'btnVenderDrag2'];
        for (const id of ids) {
            const btn = document.getElementById(id);
            if (!btn || btn.style.display === 'none') continue;
            const rect = btn.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                return btn;
            }
        }
        return null;
    }

    // ============================================================
    // crearFantasma
    // ============================================================

    function crearFantasma(unidad, e) {
        const celdaOrigen = dragState.celdaOrigen;

        let anchoFantasma = 90;
        let altoFantasma = 105;

        if (celdaOrigen) {
            const rect = celdaOrigen.getBoundingClientRect();
            anchoFantasma = Math.max(80, Math.min(180, rect.width * 1.05));
            altoFantasma  = Math.max(90, Math.min(200, rect.height * 1.05));
        }

        const costeOriginal = unidad.costeOriginal || (unidad.pokemon && unidad.pokemon.coste) || 1;
        const claseCoste = unidad.esZacian ? 'cost-5' : ('cost-' + costeOriginal);

        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost ' + claseCoste;

        ghost.style.width = anchoFantasma + 'px';
        ghost.style.height = altoFantasma + 'px';

        const spriteId = unidad.spriteIdAlternativo || (unidad.pokemon && unidad.pokemon.spriteId) || 0;

        const esShinyGhost = unidad.esShiny === true;

        const spriteUrl = (typeof getSpriteUrl === 'function')
            ? getSpriteUrl(spriteId, unidad.pokemon.nombre, esShinyGhost)
            : '';

        const escalaGhost = _getSpriteScaleSafe(spriteId);
        const offsetXGhost = _getSpriteOffsetXSafe(spriteId);

        const miraDerechaGhost = _spriteMiraDerechaSafe(spriteId);
        const flipGhost = miraDerechaGhost ? 1 : -1;

        const transformGhost = `translateX(${offsetXGhost}) scaleX(${flipGhost}) scale(${escalaGhost})`;

        let estrellasHtml = '';
        if (unidad.nivel >= 1 && typeof getEstrellasUrl === 'function') {
            estrellasHtml = '<img class="ghost-estrellas" src="' + getEstrellasUrl(unidad.nivel) + '" alt="' + unidad.nivel + '★" draggable="false">';
        }

        let traitsHtml = '';
        if (unidad.pokemon.tipos && unidad.pokemon.tipos.length > 0 && typeof getIconoTipo === 'function') {
            traitsHtml += unidad.pokemon.tipos.map(t => '<span class="ghost-trait">' + getIconoTipo(t) + '</span>').join('');
        }
        if (unidad.pokemon.clase && typeof getIconoClase === 'function') {
            traitsHtml += '<span class="ghost-trait">' + getIconoClase(unidad.pokemon.clase) + '</span>';
        }

        const claseShinyGhost = esShinyGhost ? ' shiny' : '';
        const sufijoShiny = esShinyGhost ? ' ✨' : '';

        ghost.innerHTML =
            '<div class="ghost-traits-top">' + traitsHtml + '</div>' +
            estrellasHtml +
            '<img class="ghost-sprite' + claseShinyGhost + '" src="' + spriteUrl + '" alt="' + unidad.pokemon.nombre + sufijoShiny + '" draggable="false" style="transform: ' + transformGhost + ' !important; -webkit-transform: ' + transformGhost + ' !important; --sprite-flip: ' + flipGhost + '; --sprite-scale: ' + escalaGhost + '; --sprite-offset-x: ' + offsetXGhost + ';" onerror="this.style.display=\'none\'">' +
            '<span class="ghost-name">' + unidad.pokemon.nombre + sufijoShiny + '</span>';

        document.body.appendChild(ghost);

        dragState.offsetX = ghost.offsetWidth / 2;
        dragState.offsetY = ghost.offsetHeight / 2;
        ghost.style.left = (e.clientX - dragState.offsetX) + 'px';
        ghost.style.top = (e.clientY - dragState.offsetY) + 'px';

        dragState.fantasma = ghost;

        document.body.classList.add('dragging-active');

        if (dragState.celdaOrigen) {
            const spriteOrigen = dragState.celdaOrigen.querySelector('.unit-sprite');
            if (spriteOrigen) {
                const spriteIdOrigen = unidad.spriteIdAlternativo || (unidad.pokemon && unidad.pokemon.spriteId) || 0;
                const miraDerechaOrigen = _spriteMiraDerechaSafe(spriteIdOrigen);
                const flipOrigen = miraDerechaOrigen ? 1 : -1;
                const offsetXOrigen = _getSpriteOffsetXSafe(spriteIdOrigen);
                const escalaOrigen = _getSpriteScaleSafe(spriteIdOrigen);

                spriteOrigen.style.setProperty('--sprite-drag-flip', flipOrigen);
                spriteOrigen.style.setProperty('--sprite-drag-offset-x', offsetXOrigen);
                spriteOrigen.style.setProperty('--sprite-drag-scale', escalaOrigen);
                spriteOrigen.classList.add('sprite-drag-derecha');
            }
        }

        mostrarBotonVenderDrag(dragState.tipoOrigen, unidad);
    }

    function resaltarCeldaDestino(e) {
        document.querySelectorAll('.drag-over-valida, .drag-over-invalida').forEach(c => {
            c.classList.remove('drag-over-valida');
            c.classList.remove('drag-over-invalida');
        });

        if (dragState.fantasma) dragState.fantasma.style.display = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (dragState.fantasma) dragState.fantasma.style.display = '';

        const cell = el && el.closest('.board-cell, .bank-cell');

        if (!cell) {
            if (dragState.tipoOrigen === 'tablero' && dragState.indiceHover !== null) {
                dragState.indiceHover = null;
                aplicarColoresDeSeleccion(
                    dragState.tipoOrigen,
                    dragState.indiceOrigen,
                    dragState.unidad,
                    null
                );
            }
            return;
        }

        const tipoDestino = cell.dataset.tipo;
        const indiceDestino = parseInt(cell.dataset.indice, 10);

        if (isNaN(indiceDestino)) return;

        if (tipoDestino === 'tablero' && dragState.tipoOrigen === 'tablero') {
            if (dragState.indiceHover !== indiceDestino) {
                dragState.indiceHover = indiceDestino;
                aplicarColoresDeSeleccion(
                    dragState.tipoOrigen,
                    dragState.indiceOrigen,
                    dragState.unidad,
                    indiceDestino
                );
            }
        }

        if (tipoDestino === dragState.tipoOrigen && indiceDestino === dragState.indiceOrigen) {
            return;
        }

        if (esDestinoValido(dragState.tipoOrigen, tipoDestino)) {
            cell.classList.add('drag-over-valida');
        } else {
            cell.classList.add('drag-over-invalida');
        }
    }

    function onPointerDown(e, tipo, indice, cell) {
        if (e.button !== undefined && e.button !== 0) return;

        // ============================================================
        // 🆕 FIX v19: ignorar pointerdown sobre CUALQUIER cosa dentro
        // de .objetos-equipados (iconos, huecos, padding del contenedor).
        // Antes solo se ignoraba si el target era el icono exacto,
        // así que pulsar en el hueco entre iconos arrastraba el Pokémon.
        // ============================================================
        if (e.target && typeof e.target.closest === 'function' &&
            e.target.closest('.objetos-equipados, .objeto-equipado-tablero, .objeto-equipado-banquillo')) {
            return;
        }

        if (typeof objetoSeleccionado !== 'undefined' && objetoSeleccionado) return;

        const unidad = obtenerUnidadDe(tipo, indice);
        if (!unidad) return;

        dragState.activo = true;
        dragState.tipoOrigen = tipo;
        dragState.indiceOrigen = indice;
        dragState.unidad = unidad;
        dragState.celdaOrigen = cell;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        dragState.umbralSuperado = false;
        dragState.pointerId = e.pointerId;
        dragState.coloresAplicados = false;
        dragState.indiceHover = null;

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(e) {
        if (!dragState.activo) return;
        if (dragState.pointerId !== null && e.pointerId !== dragState.pointerId) return;

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!dragState.umbralSuperado && dist < UMBRAL_DRAG) return;

        if (!dragState.umbralSuperado) {
            dragState.umbralSuperado = true;
            crearFantasma(dragState.unidad, e);
            if (dragState.celdaOrigen) {
                dragState.celdaOrigen.classList.add('drag-origen');
            }
            aplicarColoresDeSeleccion(
                dragState.tipoOrigen,
                dragState.indiceOrigen,
                dragState.unidad,
                null
            );
            e.preventDefault();
        }

        if (dragState.fantasma) {
            dragState.fantasma.style.left = (e.clientX - dragState.offsetX) + 'px';
            dragState.fantasma.style.top = (e.clientY - dragState.offsetY) + 'px';
        }

        const btnVenderSobre = getBotonVenderSobre(e);

        if (btnVenderSobre) {
            btnVenderSobre.classList.add('drag-hover');
            const otroId = btnVenderSobre.id === 'btnVenderDrag' ? 'btnVenderDrag2' : 'btnVenderDrag';
            const otro = document.getElementById(otroId);
            if (otro) otro.classList.remove('drag-hover');
            document.querySelectorAll('.drag-over-valida, .drag-over-invalida').forEach(c => {
                c.classList.remove('drag-over-valida');
                c.classList.remove('drag-over-invalida');
            });
            if (dragState.coloresAplicados && dragState.tipoOrigen === 'tablero') {
                if (dragState.indiceHover !== null) {
                    dragState.indiceHover = null;
                    aplicarColoresDeSeleccion(
                        dragState.tipoOrigen,
                        dragState.indiceOrigen,
                        dragState.unidad,
                        null
                    );
                }
            }
        } else {
            const btnVender = document.getElementById('btnVenderDrag');
            const btnVender2 = document.getElementById('btnVenderDrag2');
            if (btnVender) btnVender.classList.remove('drag-hover');
            if (btnVender2) btnVender2.classList.remove('drag-hover');
            resaltarCeldaDestino(e);
        }
    }

    function onPointerUp(e) {
        if (!dragState.activo) return;

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        const superoUmbral = dragState.umbralSuperado;

        if (superoUmbral) {
            bloquearClicksGlobales(250);
        }

        if (dragState.fantasma) dragState.fantasma.remove();
        if (dragState.celdaOrigen) dragState.celdaOrigen.classList.remove('drag-origen');
        document.querySelectorAll('.drag-over-valida, .drag-over-invalida').forEach(c => {
            c.classList.remove('drag-over-valida');
            c.classList.remove('drag-over-invalida');
        });

        if (dragState.coloresAplicados) {
            limpiarColoresDeSeleccion();
        }

        document.body.classList.remove('dragging-active');

        if (!superoUmbral) {
            resetEstado();
            return;
        }

        if (getBotonVenderSobre(e)) {
            const tipoOrigen = dragState.tipoOrigen;
            const indiceOrigen = dragState.indiceOrigen;

            if (tipoOrigen === 'tablero' || tipoOrigen === 'banquillo') {
                const unidad = obtenerUnidadDe(tipoOrigen, indiceOrigen);
                if (unidad && !unidad.esZacian && typeof vender === 'function') {
                    ocultarBotonVenderDrag();
                    document.body.classList.remove('dragging-active');

                    try {
                        vender(tipoOrigen, indiceOrigen);
                    } catch (err) {
                        console.error('❌ Error al vender por drag:', err);
                    }

                    resetEstado();
                    return;
                }
            }
        }

        const elDestino = document.elementFromPoint(e.clientX, e.clientY);
        const cellDestino = elDestino ? elDestino.closest('.board-cell, .bank-cell') : null;

        if (cellDestino) {
            const tipoDestino = cellDestino.dataset.tipo;
            const indiceDestino = parseInt(cellDestino.dataset.indice, 10);

            if (!isNaN(indiceDestino) &&
                esDestinoValido(dragState.tipoOrigen, tipoDestino) &&
                !(tipoDestino === dragState.tipoOrigen && indiceDestino === dragState.indiceOrigen)) {

                const tipoOrigen = dragState.tipoOrigen;
                const indiceOrigen = dragState.indiceOrigen;

                try {
                    if (typeof moverUnidad === 'function') {
                        moverUnidad(tipoOrigen, indiceOrigen, tipoDestino, indiceDestino);

                        setTimeout(() => {
                            const celdaNueva = document.querySelector(
                                '.board-cell[data-tipo="' + tipoDestino + '"][data-indice="' + indiceDestino + '"], ' +
                                '.bank-cell[data-tipo="' + tipoDestino + '"][data-indice="' + indiceDestino + '"]'
                            );
                            if (celdaNueva) {
                                celdaNueva.classList.add('drag-dropping');
                                setTimeout(() => celdaNueva.classList.remove('drag-dropping'), 300);
                            }
                        }, 10);
                    }
                } catch (err) {
                    console.error('❌ Error al soltar en drag:', err);
                }
            }
        }

        resetEstado();
    }

    function resetEstado() {
        if (dragState.celdaOrigen) {
            const spriteOrigen = dragState.celdaOrigen.querySelector('.unit-sprite');
            if (spriteOrigen) {
                spriteOrigen.classList.remove('sprite-drag-derecha');
                spriteOrigen.style.removeProperty('--sprite-drag-flip');
                spriteOrigen.style.removeProperty('--sprite-drag-offset-x');
                spriteOrigen.style.removeProperty('--sprite-drag-scale');
            }
        }

        dragState.activo = false;
        dragState.tipoOrigen = null;
        dragState.indiceOrigen = null;
        dragState.unidad = null;
        dragState.celdaOrigen = null;
        dragState.fantasma = null;
        dragState.offsetX = 0;
        dragState.offsetY = 0;
        dragState.startX = 0;
        dragState.startY = 0;
        dragState.umbralSuperado = false;
        dragState.pointerId = null;
        dragState.coloresAplicados = false;
        dragState.indiceHover = null;
        document.body.classList.remove('dragging-active');

        ocultarBotonVenderDrag();
    }

    function engancharDrag(cell, tipo, indice) {
        if (!cell) return;
        if (cell.dataset.dragEnganchado === '1') return;
        cell.dataset.dragEnganchado = '1';

        cell.addEventListener('pointerdown', function (e) {
            onPointerDown(e, tipo, indice, cell);
        });
    }

    function initDragDrop() {
        console.log('🎴 DragDrop estilo Solitario inicializado (v19 - FIX drag de objetos)');

        document.addEventListener('dragstart', function (e) {
            const dentroDeCelda = e.target.closest('.board-cell, .bank-cell, .drag-ghost');
            if (dentroDeCelda) {
                e.preventDefault();
                return false;
            }
        }, true);

        document.addEventListener('dragover', function (e) {
            const dentroDeCelda = e.target.closest('.board-cell, .bank-cell');
            if (dentroDeCelda) {
                e.preventDefault();
            }
        }, true);

        document.addEventListener('drop', function (e) {
            const dentroDeCelda = e.target.closest('.board-cell, .bank-cell');
            if (dentroDeCelda) {
                e.preventDefault();
            }
        }, true);

        document.addEventListener('selectstart', function (e) {
            const dentroDeCelda = e.target.closest('.board-cell, .bank-cell, .drag-ghost');
            if (dentroDeCelda) {
                e.preventDefault();
                return false;
            }
        }, true);

        const btnVender = document.getElementById('btnVenderDrag');
        if (btnVender) {
            btnVender.addEventListener('pointerdown', function (e) {
                e.stopPropagation();
            });
            btnVender.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });
        }

        window.addEventListener('resize', function () {
            posicionarBotonVenderDrag();
        });

        window.addEventListener('scroll', function () {
            posicionarBotonVenderDrag();
        }, { passive: true });
    }

    window.initDragDrop = initDragDrop;
    window.puedeArrastrar = puedeArrastrar;
    window.engancharDrag = engancharDrag;
    window.ocultarBotonVenderDrag = ocultarBotonVenderDrag;
    window.posicionarBotonVenderDrag = posicionarBotonVenderDrag;
    // Reutilizados por el resaltado al pasar el ratón (hover sobre un Pokémon).
    window.aplicarColoresDeSeleccion = aplicarColoresDeSeleccion;
    window.limpiarColoresDeSeleccion = limpiarColoresDeSeleccion;
    window.estaArrastrando = function () { return dragState.activo; };

    console.log('✅ dragDrop.js cargado (v19 - FIX drag de objetos)');
})();