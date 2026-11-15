// ============================================================
// DRAG & DROP DE OBJETOS - v3 (FIX índice DOM vs índice real)
// ============================================================
// v3:
//   - FIX: refrescarDragObjetosEquipados ahora lee el nombre e
//     índice REALES del dataset del icono (data-objeto-nombre,
//     data-objeto-index) en vez de usar el índice del DOM.
//     Antes, con huecos (1 objeto normal + disco), el índice
//     del DOM no coincidía con unidad.objetos[] y el disco
//     quedaba sin enganchar. Al pulsarlo, el pointerdown
//     burbujeaba a la celda y dragDrop.js arrastraba el Pokémon.
//   - FIX: solo se enganchan iconos con :not(.vacio) y
//     :not(.slot-ulti.vacio) para no crear listeners inútiles.
//   - FIX: no se llama e.preventDefault() en el pointerdown
//     del icono (rompía el click de desequipar en algunos casos).
//   - FIX: guard adicional con closest('.objetos-equipados') en
//     initDragObjetos() para bloquear el drag nativo.
//
// v2:
//   - Guards `e.target.closest` en initDragObjetos()
//   - Selector de lado (jugador/enemigo) en creativePanel
// ============================================================

(function () {
    'use strict';

    // ------------------------------------------------------------
    // ESTADO DEL DRAG DE OBJETO
    // ------------------------------------------------------------
    const dragObjState = {
        activo: false,
        nombre: null,
        lado: null,
        origen: null,
        indexBaul: null,
        tipoUnidadOrigen: null,
        indiceUnidadOrigen: null,
        indexObjetoEquipado: null,
        slotOrigen: null,
        fantasma: null,
        offsetX: 0,
        offsetY: 0,
        startX: 0,
        startY: 0,
        umbralSuperado: false,
        pointerId: null,
    };

    const UMBRAL_DRAG = 6;

    // ------------------------------------------------------------
    // OBTENER LA LISTA DE BAÚL SEGÚN LADO
    // ------------------------------------------------------------
    function getBaul(lado) {
        if (lado === 'jugador') {
            return (typeof baulObjetos !== 'undefined') ? baulObjetos : [];
        } else {
            return (typeof enemyBaulObjetos !== 'undefined') ? enemyBaulObjetos : [];
        }
    }

    // ------------------------------------------------------------
    // ¿EL OBJETO ES COMPATIBLE CON ESTA UNIDAD?
    // ------------------------------------------------------------
    function puedeEquiparObjeto(unidad, nombreObjeto) {
        if (!unidad || !unidad.pokemon) return false;

        if (unidad.esZacian || unidad.noEquiparObjetos) return false;
        if (unidad.objetos && unidad.objetos.includes(nombreObjeto)) return false;

        const objeto = (typeof OBJETOS !== 'undefined') ? OBJETOS[nombreObjeto] : null;
        if (!objeto) return false;

        const esDisco = objeto.efecto && objeto.efecto.esDiscoUlti;
        const objetosNormales = (unidad.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return !(od && od.efecto && od.efecto.esDiscoUlti);
        });
        const discosEquipados = (unidad.objetos || []).filter(o => {
            const od = OBJETOS[o];
            return od && od.efecto && od.efecto.esDiscoUlti;
        });

        if (esDisco) {
            if (unidad.nivel < 2) return false;
            if (discosEquipados.length >= 1) return false;
        } else {
            if (objetosNormales.length >= 2) return false;
        }

        if (objeto.requerido) {
            let tieneTipo = false;
            if (unidad.pokemon.tipos && Array.isArray(unidad.pokemon.tipos)) {
                for (let tipo of unidad.pokemon.tipos) {
                    if (tipo === objeto.requerido) {
                        tieneTipo = true;
                        break;
                    }
                }
            }
            if (!tieneTipo) return false;
        }

        return true;
    }

    // ------------------------------------------------------------
    // ¿ES DESTINO VÁLIDO PARA EL OBJETO?
    // ------------------------------------------------------------
    function esDestinoObjetoValido(unidad, nombreObjeto, ladoOrigen, tipoDestino) {
        if (!unidad) return false;

        const origenJugador = ladoOrigen === 'jugador';
        const destinoJugador = tipoDestino === 'tablero' || tipoDestino === 'banquillo';
        const destinoEnemigo = tipoDestino === 'enemigo' || tipoDestino === 'enemigoBanquillo';

        if (origenJugador && destinoEnemigo) return false;
        if (!origenJugador && destinoJugador) return false;

        return puedeEquiparObjeto(unidad, nombreObjeto);
    }

    // ------------------------------------------------------------
    // OBTENER UNIDAD DE UNA CELDA
    // ------------------------------------------------------------
    function obtenerUnidadDeCelda(tipo, indice) {
        if (tipo === 'tablero') return tablero[indice] || null;
        if (tipo === 'banquillo') return banquillo[indice] || null;
        if (tipo === 'enemigo') return enemyBoard[indice] || null;
        if (tipo === 'enemigoBanquillo') return enemyBanquillo[indice] || null;
        return null;
    }

    // ------------------------------------------------------------
    // ¿ESTÁ EL CURSOR SOBRE EL BAÚL?
    // ------------------------------------------------------------
    function estaCursorSobreBaul(e, lado) {
        const gridId = (lado === 'jugador') ? 'objetosVerticalGrid' : 'objetosVerticalGridEnemigo';
        const grid = document.getElementById(gridId);
        if (!grid) return false;

        const rect = grid.getBoundingClientRect();
        return (
            e.clientX >= rect.left - 10 &&
            e.clientX <= rect.right + 10 &&
            e.clientY >= rect.top - 10 &&
            e.clientY <= rect.bottom + 10
        );
    }

    // ------------------------------------------------------------
    // CREAR FANTASMA DEL OBJETO
    // ------------------------------------------------------------
    function crearFantasmaObjeto(nombreObjeto, e) {
        const ghost = document.createElement('div');
        ghost.className = 'drag-objeto-ghost';

        const objeto = (typeof OBJETOS !== 'undefined') ? OBJETOS[nombreObjeto] : null;

        let iconoHtml = '';
        if (objeto && objeto.emoji && objeto.emoji.includes('.png')) {
            iconoHtml = `<img class="ghost-objeto-icon" src="${objeto.emoji}" alt="${nombreObjeto}" draggable="false" onerror="this.style.display='none'">`;
        } else {
            iconoHtml = `<span class="ghost-objeto-icon-emoji">${(objeto && objeto.emoji) || '📦'}</span>`;
        }

        ghost.innerHTML = `
            ${iconoHtml}
            <span class="ghost-objeto-nombre">${nombreObjeto}</span>
        `;

        document.body.appendChild(ghost);

        dragObjState.offsetX = ghost.offsetWidth / 2;
        dragObjState.offsetY = ghost.offsetHeight / 2;
        ghost.style.left = (e.clientX - dragObjState.offsetX) + 'px';
        ghost.style.top = (e.clientY - dragObjState.offsetY) + 'px';

        dragObjState.fantasma = ghost;

        document.body.classList.add('dragging-objeto-active');
    }

    // ------------------------------------------------------------
    // PINTAR UNIDADES COMPATIBLES / INCOMPATIBLES + BAÚL
    // ------------------------------------------------------------
    function aplicarColoresObjeto(nombreObjeto, lado) {
        limpiarColoresObjeto();

        const selectorJugador = '#playerBoard .board-cell, #banquilloGrid .bank-cell';
        const selectorEnemigo = '#enemigoBoard .board-cell, #enemyBanquilloGrid .bank-cell';
        const selector = (lado === 'jugador') ? selectorJugador : selectorEnemigo;

        document.querySelectorAll(selector).forEach(cell => {
            const tipo = cell.dataset.tipo;
            const indice = parseInt(cell.dataset.indice, 10);
            if (isNaN(indice)) return;

            const unidad = obtenerUnidadDeCelda(tipo, indice);
            if (!unidad) return;

            if (dragObjState.origen === 'unidad' &&
                dragObjState.tipoUnidadOrigen === tipo &&
                dragObjState.indiceUnidadOrigen === indice) {
                return;
            }

            if (puedeEquiparObjeto(unidad, nombreObjeto)) {
                cell.classList.add('drag-objeto-valido');
            } else {
                cell.classList.add('drag-objeto-invalido');
            }
        });

        const gridId = (lado === 'jugador') ? 'objetosVerticalGrid' : 'objetosVerticalGridEnemigo';
        const gridBaul = document.getElementById(gridId);
        if (gridBaul) {
            gridBaul.classList.add('drag-objeto-baul-valido');
        }
    }

    function limpiarColoresObjeto() {
        document.querySelectorAll('.drag-objeto-valido, .drag-objeto-invalido').forEach(c => {
            c.classList.remove('drag-objeto-valido');
            c.classList.remove('drag-objeto-invalido');
        });

        document.querySelectorAll('.drag-objeto-baul-valido, .drag-objeto-baul-hover').forEach(g => {
            g.classList.remove('drag-objeto-baul-valido');
            g.classList.remove('drag-objeto-baul-hover');
        });
    }

    // ------------------------------------------------------------
    // RESALTAR CELDA / BAÚL BAJO EL CURSOR
    // ------------------------------------------------------------
    function resaltarCeldaDestinoObjeto(e, nombreObjeto, lado) {
        document.querySelectorAll('.drag-objeto-hover').forEach(c => c.classList.remove('drag-objeto-hover'));
        document.querySelectorAll('.drag-objeto-baul-hover').forEach(g => g.classList.remove('drag-objeto-baul-hover'));

        if (dragObjState.fantasma) dragObjState.fantasma.style.display = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (dragObjState.fantasma) dragObjState.fantasma.style.display = '';

        if (estaCursorSobreBaul(e, lado)) {
            const gridId = (lado === 'jugador') ? 'objetosVerticalGrid' : 'objetosVerticalGridEnemigo';
            const gridBaul = document.getElementById(gridId);
            if (gridBaul) gridBaul.classList.add('drag-objeto-baul-hover');
            return;
        }

        const cell = el && typeof el.closest === 'function' ? el.closest('.board-cell, .bank-cell') : null;
        if (!cell) return;

        const tipo = cell.dataset.tipo;
        const indice = parseInt(cell.dataset.indice, 10);
        if (isNaN(indice)) return;

        const unidad = obtenerUnidadDeCelda(tipo, indice);
        if (!unidad) return;

        if (dragObjState.origen === 'unidad' &&
            dragObjState.tipoUnidadOrigen === tipo &&
            dragObjState.indiceUnidadOrigen === indice) {
            return;
        }

        if (esDestinoObjetoValido(unidad, nombreObjeto, lado, tipo)) {
            cell.classList.add('drag-objeto-hover');
        }
    }

    // ------------------------------------------------------------
    // INICIAR DRAG DE OBJETO DESDE EL BAÚL
    // ------------------------------------------------------------
    function onPointerDownObjetoDesdeBaul(e, nombre, lado, indexBaul, slot) {
        if (e.button !== undefined && e.button !== 0) return;

        if (typeof objetoSeleccionado !== 'undefined' && objetoSeleccionado) {
            objetoSeleccionado = null;
            if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales();
            if (typeof actualizarObjetosVerticalesEnemigo === 'function') actualizarObjetosVerticalesEnemigo();
        }

        dragObjState.activo = true;
        dragObjState.nombre = nombre;
        dragObjState.lado = lado;
        dragObjState.origen = 'baul';
        dragObjState.indexBaul = indexBaul;
        dragObjState.tipoUnidadOrigen = null;
        dragObjState.indiceUnidadOrigen = null;
        dragObjState.indexObjetoEquipado = null;
        dragObjState.slotOrigen = slot;
        dragObjState.startX = e.clientX;
        dragObjState.startY = e.clientY;
        dragObjState.umbralSuperado = false;
        dragObjState.pointerId = e.pointerId;

        window.addEventListener('pointermove', onPointerMoveObjeto);
        window.addEventListener('pointerup', onPointerUpObjeto);
        window.addEventListener('pointercancel', onPointerUpObjeto);
    }

    // ------------------------------------------------------------
    // INICIAR DRAG DE OBJETO EQUIPADO
    // ------------------------------------------------------------
    function onPointerDownObjetoEquipado(e, nombre, lado, tipoUnidad, indiceUnidad, indexObjeto, slotIcono) {
        if (e.button !== undefined && e.button !== 0) return;

        if (typeof objetoSeleccionado !== 'undefined' && objetoSeleccionado) {
            objetoSeleccionado = null;
            if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales();
            if (typeof actualizarObjetosVerticalesEnemigo === 'function') actualizarObjetosVerticalesEnemigo();
        }

        dragObjState.activo = true;
        dragObjState.nombre = nombre;
        dragObjState.lado = lado;
        dragObjState.origen = 'unidad';
        dragObjState.indexBaul = null;
        dragObjState.tipoUnidadOrigen = tipoUnidad;
        dragObjState.indiceUnidadOrigen = indiceUnidad;
        dragObjState.indexObjetoEquipado = indexObjeto;
        dragObjState.slotOrigen = slotIcono;
        dragObjState.startX = e.clientX;
        dragObjState.startY = e.clientY;
        dragObjState.umbralSuperado = false;
        dragObjState.pointerId = e.pointerId;

        window.addEventListener('pointermove', onPointerMoveObjeto);
        window.addEventListener('pointerup', onPointerUpObjeto);
        window.addEventListener('pointercancel', onPointerUpObjeto);
    }

    // ------------------------------------------------------------
    // MOVER
    // ------------------------------------------------------------
    function onPointerMoveObjeto(e) {
        if (!dragObjState.activo) return;
        if (dragObjState.pointerId !== null && e.pointerId !== dragObjState.pointerId) return;

        const dx = e.clientX - dragObjState.startX;
        const dy = e.clientY - dragObjState.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!dragObjState.umbralSuperado && dist < UMBRAL_DRAG) return;

        if (!dragObjState.umbralSuperado) {
            dragObjState.umbralSuperado = true;
            crearFantasmaObjeto(dragObjState.nombre, e);
            if (dragObjState.slotOrigen) {
                dragObjState.slotOrigen.classList.add('drag-objeto-origen');
            }
            aplicarColoresObjeto(dragObjState.nombre, dragObjState.lado);
            e.preventDefault();
        }

        if (dragObjState.fantasma) {
            dragObjState.fantasma.style.left = (e.clientX - dragObjState.offsetX) + 'px';
            dragObjState.fantasma.style.top = (e.clientY - dragObjState.offsetY) + 'px';
        }

        resaltarCeldaDestinoObjeto(e, dragObjState.nombre, dragObjState.lado);
    }

    // ------------------------------------------------------------
    // SOLTAR
    // ------------------------------------------------------------
    function onPointerUpObjeto(e) {
        if (!dragObjState.activo) return;

        window.removeEventListener('pointermove', onPointerMoveObjeto);
        window.removeEventListener('pointerup', onPointerUpObjeto);
        window.removeEventListener('pointercancel', onPointerUpObjeto);

        const superoUmbral = dragObjState.umbralSuperado;

        if (dragObjState.fantasma) dragObjState.fantasma.remove();
        if (dragObjState.slotOrigen) dragObjState.slotOrigen.classList.remove('drag-objeto-origen');
        document.querySelectorAll('.drag-objeto-hover').forEach(c => c.classList.remove('drag-objeto-hover'));
        document.querySelectorAll('.drag-objeto-baul-hover').forEach(g => g.classList.remove('drag-objeto-baul-hover'));
        limpiarColoresObjeto();

        document.body.classList.remove('dragging-objeto-active');

        if (!superoUmbral) {
            resetEstadoObjeto();
            return;
        }

        const nombre = dragObjState.nombre;
        const lado = dragObjState.lado;
        const origen = dragObjState.origen;
        const indexBaul = dragObjState.indexBaul;
        const tipoOrigen = dragObjState.tipoUnidadOrigen;
        const indiceOrigen = dragObjState.indiceUnidadOrigen;
        const indexObjetoEquipado = dragObjState.indexObjetoEquipado;

        // === ¿SOLTADO SOBRE EL BAÚL? ===
        if (estaCursorSobreBaul(e, lado)) {
            if (origen === 'unidad') {
                bloquearClickSiguiente();
                try {
                    devolverObjetoAlBaul(lado, tipoOrigen, indiceOrigen, indexObjetoEquipado);
                } catch (err) {
                    console.error('❌ Error al devolver objeto al baúl:', err);
                }
            }
            resetEstadoObjeto();
            return;
        }

        // === ¿SOLTADO SOBRE UNA UNIDAD? ===
        const elDestino = document.elementFromPoint(e.clientX, e.clientY);
        const cellDestino = elDestino && typeof elDestino.closest === 'function'
            ? elDestino.closest('.board-cell, .bank-cell')
            : null;

        if (cellDestino) {
            const tipoDestino = cellDestino.dataset.tipo;
            const indiceDestino = parseInt(cellDestino.dataset.indice, 10);

            if (!isNaN(indiceDestino)) {
                const unidadDestino = obtenerUnidadDeCelda(tipoDestino, indiceDestino);

                const esMismaUnidad = (origen === 'unidad' &&
                                       tipoOrigen === tipoDestino &&
                                       indiceOrigen === indiceDestino);

                if (unidadDestino && !esMismaUnidad &&
                    esDestinoObjetoValido(unidadDestino, nombre, lado, tipoDestino)) {

                    bloquearClickSiguiente();

                    try {
                        if (origen === 'baul') {
                            if (lado === 'jugador') {
                                if (typeof equiparObjetoDesdeBaul === 'function') {
                                    equiparObjetoDesdeBaul(indexBaul, tipoDestino, indiceDestino);
                                }
                            } else {
                                if (typeof equiparObjetoAEnemigo === 'function') {
                                    equiparObjetoAEnemigo(indexBaul, tipoDestino, indiceDestino);
                                }
                            }
                        } else {
                            transferirObjetoEntreUnidades(
                                lado,
                                tipoOrigen, indiceOrigen, indexObjetoEquipado,
                                tipoDestino, indiceDestino
                            );
                        }
                    } catch (err) {
                        console.error('❌ Error al soltar objeto:', err);
                    }
                }
            }
        }

        resetEstadoObjeto();
    }

    // ------------------------------------------------------------
    // TRANSFERIR OBJETO ENTRE UNIDADES
    // ------------------------------------------------------------
    function transferirObjetoEntreUnidades(lado, tipoOrigen, indiceOrigen, indexObjeto, tipoDestino, indiceDestino) {
        const unidadOrigen = obtenerUnidadDeCelda(tipoOrigen, indiceOrigen);
        const unidadDestino = obtenerUnidadDeCelda(tipoDestino, indiceDestino);

        if (!unidadOrigen || !unidadDestino) return;
        if (!unidadOrigen.objetos || indexObjeto >= unidadOrigen.objetos.length) return;

        const nombreObjeto = unidadOrigen.objetos[indexObjeto];

        if (!puedeEquiparObjeto(unidadDestino, nombreObjeto)) {
            console.warn('⚠️ Destino no compatible, cancelando transferencia');
            return;
        }

        unidadOrigen.objetos.splice(indexObjeto, 1);
        if (typeof recalcularEfectosObjetos === 'function') {
            recalcularEfectosObjetos(unidadOrigen);
        } else if (typeof unidadOrigen.actualizarStats === 'function') {
            unidadOrigen.actualizarStats();
        }

        if (typeof aplicarObjeto === 'function') {
            aplicarObjeto(unidadDestino, nombreObjeto);
        }

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(`📦 ${nombreObjeto} transferido de ${unidadOrigen.pokemon.nombre} → ${unidadDestino.pokemon.nombre}`, 'move');
        }

        if (typeof playUISound === 'function') {
            playUISound('click.mp3', 0.2);
        }

        if (typeof aplicarSinergias === 'function') aplicarSinergias();
        if (lado === 'enemigo' && typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
        if (typeof renderizar === 'function') renderizar();
    }

    // ------------------------------------------------------------
    // DEVOLVER OBJETO AL BAÚL (desde unidad)
    // ------------------------------------------------------------
    function devolverObjetoAlBaul(lado, tipoUnidad, indiceUnidad, indexObjeto) {
        const unidad = obtenerUnidadDeCelda(tipoUnidad, indiceUnidad);
        if (!unidad) return;
        if (!unidad.objetos || indexObjeto >= unidad.objetos.length) return;

        const baul = getBaul(lado);
        const maxBaul = (typeof CONFIG !== 'undefined' && CONFIG.MAX_BAUL) ? CONFIG.MAX_BAUL : 8;

        if (baul.length >= maxBaul) {
            if (typeof addConsoleMessage === 'function') {
                addConsoleMessage(`❌ Baúl lleno! No se puede devolver el objeto.`, 'error');
            }
            return;
        }

        const nombreObjeto = unidad.objetos[indexObjeto];

        unidad.objetos.splice(indexObjeto, 1);
        if (typeof recalcularEfectosObjetos === 'function') {
            recalcularEfectosObjetos(unidad);
        } else if (typeof unidad.actualizarStats === 'function') {
            unidad.actualizarStats();
        }

        baul.push(nombreObjeto);

        if (typeof addConsoleMessage === 'function') {
            addConsoleMessage(`🔄 ${nombreObjeto} devuelto al baúl desde ${unidad.pokemon.nombre}`, 'move');
        }

        if (typeof playUISound === 'function') {
            playUISound('click.mp3', 0.2);
        }

        if (typeof aplicarSinergias === 'function') aplicarSinergias();
        if (lado === 'enemigo' && typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
        if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul();
        if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales();
        if (typeof actualizarObjetosVerticalesEnemigo === 'function') actualizarObjetosVerticalesEnemigo();
        if (typeof renderizar === 'function') renderizar();
    }

    // ------------------------------------------------------------
    // EVITAR CLICK DESPUÉS DE DRAG
    // ------------------------------------------------------------
    function bloquearClickSiguiente() {
        const handler = function (e) {
            e.stopPropagation();
            e.preventDefault();
            window.removeEventListener('click', handler, true);
        };
        window.addEventListener('click', handler, true);
        setTimeout(() => window.removeEventListener('click', handler, true), 350);
    }

    // ------------------------------------------------------------
    // RESET
    // ------------------------------------------------------------
    function resetEstadoObjeto() {
        dragObjState.activo = false;
        dragObjState.nombre = null;
        dragObjState.lado = null;
        dragObjState.origen = null;
        dragObjState.indexBaul = null;
        dragObjState.tipoUnidadOrigen = null;
        dragObjState.indiceUnidadOrigen = null;
        dragObjState.indexObjetoEquipado = null;
        dragObjState.slotOrigen = null;
        dragObjState.fantasma = null;
        dragObjState.offsetX = 0;
        dragObjState.offsetY = 0;
        dragObjState.startX = 0;
        dragObjState.startY = 0;
        dragObjState.umbralSuperado = false;
        dragObjState.pointerId = null;
        document.body.classList.remove('dragging-objeto-active');
    }

    // ------------------------------------------------------------
    // ENGANCHAR DRAG A UN SLOT DEL BAÚL
    // ------------------------------------------------------------
    function engancharDragObjeto(slot, nombre, lado, indexBaul) {
        if (!slot) return;
        if (slot.dataset.dragObjetoEnganchado === '1') return;
        slot.dataset.dragObjetoEnganchado = '1';

        slot.addEventListener('pointerdown', function (e) {
            if (!nombre) return;
            onPointerDownObjetoDesdeBaul(e, nombre, lado, indexBaul, slot);
        });
    }

    // ------------------------------------------------------------
    // ENGANCHAR DRAG A UN ICONO DE OBJETO EQUIPADO
    // ------------------------------------------------------------
    function engancharDragObjetoEquipado(icono, nombre, lado, tipoUnidad, indiceUnidad, indexObjeto) {
        if (!icono) return;
        if (icono.dataset.dragObjetoEqEnganchado === '1') return;
        icono.dataset.dragObjetoEqEnganchado = '1';

        icono.addEventListener('pointerdown', function (e) {
            // 🛡️ Evitar que el drag de la UNIDAD se dispare al pulsar el objeto
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            // ❌ v3: NO llamar e.preventDefault() aquí. Rompía el click
            // de desequipar en algunos navegadores.

            if (!nombre) return;
            onPointerDownObjetoEquipado(e, nombre, lado, tipoUnidad, indiceUnidad, indexObjeto, icono);
        });
    }

    // ============================================================
    // 📦 REFRESCAR DRAGS DE OBJETOS EQUIPADOS
    // ============================================================
    // v3: lee el nombre e índice REALES del dataset del icono.
    //     Antes usaba el índice del DOM, que no coincidía con
    //     unidad.objetos[] cuando había huecos (1 normal + disco).
    // ============================================================
    function _refrescarUnaCelda(cell, tipoCelda, indice) {
        const unidad = obtenerUnidadDeCelda(tipoCelda, indice);
        if (!unidad || !unidad.objetos || unidad.objetos.length === 0) return;

        // Solo iconos con datos reales de objeto (no vacíos, no slot-ulti vacío)
        const selectorIconos = tipoCelda === 'tablero' || tipoCelda === 'enemigo'
            ? '.objeto-equipado-tablero:not(.vacio)'
            : '.objeto-equipado-banquillo:not(.vacio)';

        cell.querySelectorAll(selectorIconos).forEach((icono) => {
            // Saltar el slot de ULTI vacío
            if (icono.classList.contains('slot-ulti') && icono.classList.contains('vacio')) return;

            const nombre = icono.dataset.objetoNombre;
            const objIdxRaw = icono.dataset.objetoIndex;
            const objIdx = (objIdxRaw !== undefined) ? parseInt(objIdxRaw, 10) : -1;

            // Si el dataset no tiene la info, intentar sacarla por fallback
            // (por compatibilidad con renders antiguos sin data-attributes)
            if (!nombre || isNaN(objIdx) || objIdx < 0) {
                return;
            }

            // Verificar que el objeto realmente existe en la unidad
            if (!unidad.objetos[objIdx] || unidad.objetos[objIdx] !== nombre) {
                // El índice no cuadra: buscar por nombre la primera coincidencia
                const idxReal = unidad.objetos.indexOf(nombre);
                if (idxReal === -1) return;
                icono.removeAttribute('onclick');
                icono.style.cursor = 'grab';
                engancharDragObjetoEquipado(icono, nombre, 
                    (tipoCelda === 'enemigo' || tipoCelda === 'enemigoBanquillo') ? 'enemigo' : 'jugador',
                    tipoCelda, indice, idxReal);
                return;
            }

            icono.removeAttribute('onclick');
            icono.style.cursor = 'grab';

            engancharDragObjetoEquipado(icono, nombre,
                (tipoCelda === 'enemigo' || tipoCelda === 'enemigoBanquillo') ? 'enemigo' : 'jugador',
                tipoCelda, indice, objIdx);
        });
    }

    function refrescarDragObjetosEquipados() {
        // --- Tablero jugador ---
        document.querySelectorAll('#playerBoard .board-cell').forEach(cell => {
            const idx = parseInt(cell.dataset.indice, 10);
            if (isNaN(idx)) return;
            _refrescarUnaCelda(cell, 'tablero', idx);
        });

        // --- Banquillo jugador ---
        document.querySelectorAll('#banquilloGrid .bank-cell').forEach(cell => {
            const idx = parseInt(cell.dataset.indice, 10);
            if (isNaN(idx)) return;
            _refrescarUnaCelda(cell, 'banquillo', idx);
        });

        // --- Tablero enemigo (solo modo creativo) ---
        document.querySelectorAll('#enemigoBoard .board-cell').forEach(cell => {
            const idx = parseInt(cell.dataset.indice, 10);
            if (isNaN(idx)) return;
            _refrescarUnaCelda(cell, 'enemigo', idx);
        });

        // --- Banquillo enemigo (solo modo creativo) ---
        document.querySelectorAll('#enemyBanquilloGrid .bank-cell').forEach(cell => {
            const idx = parseInt(cell.dataset.indice, 10);
            if (isNaN(idx)) return;
            _refrescarUnaCelda(cell, 'enemigoBanquillo', idx);
        });
    }

    // ------------------------------------------------------------
    // INIT
    // ------------------------------------------------------------
    function initDragObjetos() {
        console.log('📦 DragDrop de Objetos inicializado (v3 - FIX índice real)');

        document.addEventListener('dragstart', function (e) {
            if (!e.target || typeof e.target.closest !== 'function') return;

            if (e.target.closest('.objeto-slot-vertical, .drag-objeto-ghost, .objetos-equipados, .objeto-equipado-tablero, .objeto-equipado-banquillo')) {
                e.preventDefault();
                return false;
            }
        }, true);

        document.addEventListener('selectstart', function (e) {
            if (!e.target || typeof e.target.closest !== 'function') return;

            if (e.target.closest('.objeto-slot-vertical, .drag-objeto-ghost, .objetos-equipados, .objeto-equipado-tablero, .objeto-equipado-banquillo')) {
                e.preventDefault();
                return false;
            }
        }, true);
    }

    // ------------------------------------------------------------
    // EXPONER GLOBALMENTE
    // ------------------------------------------------------------
    window.initDragObjetos = initDragObjetos;
    window.engancharDragObjeto = engancharDragObjeto;
    window.engancharDragObjetoEquipado = engancharDragObjetoEquipado;
    window.refrescarDragObjetosEquipados = refrescarDragObjetosEquipados;

    console.log('✅ dragObjetos.js cargado (v3 - FIX índice real de objetos)');
})();