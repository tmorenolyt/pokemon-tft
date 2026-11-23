// ============================================================
// MAIN · CARTA
// Extraído de js/main.js (sin cambios de lógica).
// ============================================================

function getMovimientosPokemon(nombre) {
    if (window.MOVIMIENTOS_POKEMON && window.MOVIMIENTOS_POKEMON[nombre]) return window.MOVIMIENTOS_POKEMON[nombre];
    return [{ nombre: "⚔️ Ataque Rápido", tipo: "⚪ Normal" }, { nombre: "💥 Golpe Fuerte", tipo: "⚪ Normal" }];
}

function getDescripcionMovimiento(nombreMovimiento, iconoKey) {
    // Las variantes comparten nombre visible pero tienen iconoKey propio
    // ("Bola Voltio 2", "Bomba Lodo 2"...). Se busca primero la variante.
    if (iconoKey && window.movimientosInfo && window.movimientosInfo[iconoKey]) return window.movimientosInfo[iconoKey];
    if (window.movimientosInfo && window.movimientosInfo[nombreMovimiento]) return window.movimientosInfo[nombreMovimiento];
    return null;
}

function limpiarNombreMovimiento(nombre) {
    if (!nombre) return '';
    return nombre.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim();
}

function seleccionarMovimientoCarta(index) {
    movimientoSeleccionadoIndex = index;
    const movimientoItems = document.querySelectorAll('.carta-movimiento-item');
    movimientoItems.forEach((item, idx) => {
        if (idx === index) item.classList.add('seleccionado');
        else item.classList.remove('seleccionado');
    });
    actualizarDescripcionMovimiento();
    playButtonSound();
}

function actualizarDescripcionMovimiento() {
    if (!cartaUnidadActual) return;
    const pokemon = cartaUnidadActual.pokemon;
    const movimientos = getMovimientosPokemon(pokemon.nombre);
    if (movimientoSeleccionadoIndex >= movimientos.length) movimientoSeleccionadoIndex = 0;
    const movimiento = movimientos[movimientoSeleccionadoIndex];
    if (!movimiento) return;
    const nombreLimpio = limpiarNombreMovimiento(movimiento.nombre);
    const descData = getDescripcionMovimiento(nombreLimpio, movimiento.iconoKey);
    const descripcionContainer = document.getElementById('cartaDescripcionContainer');
    if (descripcionContainer && descData) {
        const claveIcono = movimiento.iconoKey || nombreLimpio;
        const iconoHtml = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(claveIcono, 24) : getIconoTipo(descData.tipo);
        descripcionContainer.innerHTML = `
            <div class="carta-descripcion-nombre">
                <span class="mov-icono">${iconoHtml}</span>
                ${nombreLimpio}
                <span class="tipo-label">${getIconoTipo(descData.tipo)} ${descData.tipo}</span>
            </div>
            <div class="carta-descripcion-texto">${descData.descripcion}</div>
            <div class="carta-descripcion-range">
                <span class="range-label">📏 ALCANCE</span>
                <span class="range-icon">➜</span>
                <span class="range-text">${descData.alcance}</span>
            </div>
        `;
    } else if (descripcionContainer) {
        descripcionContainer.innerHTML = `<div class="carta-descripcion-vacio"><span class="icono">❓</span>Sin descripción disponible</div>`;
    }
}

function abrirCarta(tipo, indice) {
    if (typeof cartaSinergiaAbierta !== 'undefined' && cartaSinergiaAbierta) {
        if (typeof cerrarCartaSinergia === 'function') cerrarCartaSinergia();
    }
    if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto) {
        if (typeof cerrarPanelDatosCombate === 'function') cerrarPanelDatosCombate();
    }

    let unidad = null;
    if (tipo === 'tablero') unidad = tablero[indice];
    else if (tipo === 'banquillo') unidad = banquillo[indice];
    else if (tipo === 'enemigo') unidad = enemyBoard[indice];
    else if (tipo === 'enemigoBanquillo') unidad = enemyBanquillo[indice];
    if (!unidad) { addConsoleMessage('❌ No hay Pokémon en esa posición', 'error'); return; }

    cartaUnidadActual = unidad;
    cartaTipoUbicacion = tipo;
    cartaIndiceUbicacion = indice;
    cartaAbierta = true;
    movimientoSeleccionadoIndex = 0;

    const panel = document.getElementById('cartaPanel');
    if (!panel) return;
    const pokemon = unidad.pokemon;
    const nivelUnidad = unidad.nivel || 1;
    const secundarioDesbloqueado = unidad.movSecundarioDesbloqueado || (nivelUnidad >= 2);

    // ==========================================
    // CONSTRUIR HTML DE LA CARTA
    // ==========================================

    // 1. Cabecera
    let estrellasHtml = `<img src="${getEstrellasUrl(nivelUnidad)}" alt="${nivelUnidad}★" draggable="false" style="height: 28px; vertical-align: middle; margin-left: 2px;">`;
    let nombreMostrar = (unidad.esShiny ? '✨ ' : '') + pokemon.nombre;
    const costeNum = unidad.costeOriginal || pokemon.coste || 1;

    let html = `
        <div class="carta-header">
            <div style="display:flex; align-items:center; gap:8px;">
                <h2 class="carta-nombre">${nombreMostrar}</h2>
                ${estrellasHtml}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div class="carta-coste">
                    <img src="assets/icons/moneda.png" alt="💰" draggable="false" style="width:24px;height:24px;object-fit:contain;">
                    ${costeNum}
                </div>
                <button class="carta-cerrar" onclick="cerrarCarta()" title="Cerrar (Esc)">✕</button>
            </div>
        </div>
    `;

    // 2. Tipos
    html += `<div class="carta-tipos-clase">`;
    if (pokemon.tipos) {
        pokemon.tipos.forEach(tipoNom => {
            const colorFondo = getColorTipo(tipoNom);
            html += `<span class="carta-tipo" data-tipo="${tipoNom}" style="background-color:${colorFondo}; color:${tipoNom === 'Veneno' || tipoNom === 'Siniestro' ? '#fff' : '#000'}">
                ${getIconoTipo(tipoNom)} ${tipoNom}
            </span>`;
        });
    }
    if (pokemon.clase) {
        html += `<span class="carta-clase-integrada" style="background: rgba(0,0,0,0.4); color: #fff; border: 1px solid #4a6a8a;">
            ${getIconoClase(pokemon.clase)} ${pokemon.clase}
        </span>`;
    }
    html += `</div>`;

    // 3. Stats Grid
    let hpVal = unidad.maxHp || pokemon.hp || 0;
    let ataqueVal = unidad.ataque || pokemon.ataque || 0;
    let spAtkVal = unidad.ataqueEspecial || pokemon.spAttack || 0;
    let defensaVal = unidad.defensa || pokemon.defense || 0;
    let spDefensaVal = unidad.defensaEspecial || pokemon.spDefense || 0;
    let velocidadVal = unidad.velocidadAtaque || pokemon.attackSpeed || 0.8;
    let rangoVal = (typeof obtenerRangoAtaque === 'function') ? obtenerRangoAtaque(unidad) : 1;
    let critVal = ((pokemon.critRate || 0.25) * 100).toFixed(0) + '%';

    html += `
        <div class="carta-stats">
            <div class="carta-stat"><span class="stat-icon">❤️</span><span class="stat-value">${Math.round(hpVal)}</span><span class="stat-label">PS</span></div>
            <div class="carta-stat"><span class="stat-icon">⚔️</span><span class="stat-value">${Math.round(ataqueVal)}</span><span class="stat-label">Ataque</span></div>
            <div class="carta-stat"><span class="stat-icon">🔮</span><span class="stat-value">${Math.round(spAtkVal)}</span><span class="stat-label">At. Esp.</span></div>
            <div class="carta-stat"><span class="stat-icon">💨</span><span class="stat-value">${Math.round(velocidadVal * 100) / 100}</span><span class="stat-label">Vel. Ataque</span></div>
            <div class="carta-stat"><span class="stat-icon">🛡️</span><span class="stat-value">${Math.round(defensaVal)}</span><span class="stat-label">Defensa</span></div>
            <div class="carta-stat"><span class="stat-icon">✨</span><span class="stat-value">${Math.round(spDefensaVal)}</span><span class="stat-label">Def. Esp.</span></div>
            <div class="carta-stat"><span class="stat-icon">🎯</span><span class="stat-value">${rangoVal}</span><span class="stat-label">Rango</span></div>
            <div class="carta-stat"><span class="stat-icon">💥</span><span class="stat-value">${critVal}</span><span class="stat-label">Crítico</span></div>
        </div>
    `;

    // 4. Movimientos
    const movimientos = getMovimientosPokemon(pokemon.nombre);
    const principalData = movimientos[0];
    const secundarioData = window.MOVIMIENTOS_SECUNDARIOS && window.MOVIMIENTOS_SECUNDARIOS[pokemon.nombre];
    
    // Función auxiliar para pintar un movimiento
    const pintarMovimiento = (movData, esSecundario) => {
        if (!movData) return '';
        const nombreLimpio = limpiarNombreMovimiento(movData.nombre);
        const descData = getDescripcionMovimiento(nombreLimpio, movData.iconoKey);
        const claveIcono = movData.iconoKey || nombreLimpio;
        const iconoHtml = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(claveIcono, 28) : getIconoTipo(descData ? descData.tipo : 'Normal');
        
        const esActivo = (esSecundario ? unidad.movimientoActivo === 'secundario' : unidad.movimientoActivo === 'principal');
        const tags = descData ? `<span class="move-tag energy">⚡ Energía</span><span class="move-tag">🎯 ${descData.alcance}</span>` : '';
        
        const estaBloqueado = esSecundario && !secundarioDesbloqueado;
        
        const botonHtml = estaBloqueado 
            ? `<button class="btn-activar-move" disabled>🔒 Requiere 2★ para usar</button>`
            : `<button class="btn-activar-move" 
                        onclick="activarMovimientoDesdeCarta('${esSecundario ? 'secundario' : 'principal'}')"
                        ${esActivo ? 'disabled' : ''}>
                    ${esActivo ? '✓ Movimiento Activo' : '⭐ Usar este movimiento'}
                </button>`;

        return `
            <div class="move-content ${movimientoSeleccionadoIndex === (esSecundario ? 1 : 0) ? 'viewing' : ''}" id="content-mov-${esSecundario ? 'sec' : 'princ'}">
                <div class="move-header">
                    <div class="move-title">
                        <div class="move-icon">${iconoHtml}</div>
                        <div class="move-name">${nombreLimpio}</div>
                    </div>
                    <div class="move-tags">${tags}</div>
                </div>
                <div class="move-desc">${descData ? descData.descripcion : 'Sin descripción disponible.'}</div>
                ${botonHtml}
            </div>
        `;
    };

    html += `
        <div class="moves-section">
                        <div class="move-tabs">
                                <div class="move-tab ${movimientoSeleccionadoIndex === 0 ? 'viewing' : ''} ${unidad.movimientoActivo === 'principal' ? 'is-active-move' : ''}" 
                     onclick="viewMove('principal')">
                    <span>⚔️ Principal</span>
                </div>
                <div class="move-tab ${movimientoSeleccionadoIndex === 1 ? 'viewing' : ''} ${unidad.movimientoActivo === 'secundario' ? 'is-active-move' : ''}" 
                     onclick="viewMove('secundario')">
                    <span>🔥 Secundario</span>
                </div>
            </div>
                        ${pintarMovimiento(principalData, false)}
            ${pintarMovimiento(secundarioData, true)}
        </div>
    `;

    // 5. Ulti (Definitiva)
    const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[pokemon.nombre];
    const tieneDisco = unidad.tieneDiscoUlti || false;
    const ultiLista = unidad.ultiLista || false;
    const estaBloqueada = !tieneDisco || !ultiData;
    const estaCargando = !estaBloqueada && !ultiLista;
    
    let ultiClase = estaBloqueada ? 'locked' : (ultiLista ? 'ready' : '');
    let ultiStatusText = estaBloqueada ? '🔒 BLOQUEADA' : (ultiLista ? '¡LISTA!' : 'CARGANDO...');
    let discoClase = estaBloqueada ? 'locked-disk' : '';
    let iconoUlti = ultiData && typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(ultiData.iconoKey || ultiData.nombre, 28) : '⚡';

    if (ultiData) {
        html += `
            <div class="ulti-wrapper">
                <div class="ulti-header-title">⚡ DEFINITIVA</div>
                <div class="ulti-box ${ultiClase}" id="ulti-box">
                    <div class="ulti-content">
                        <div class="ulti-name-row">
                            <span class="ulti-name">${ultiData.nombre}</span>
                            <span class="ulti-status-text">${ultiStatusText}</span>
                        </div>
                        <div class="ulti-desc">${ultiData.descripcion}</div>
                        <div class="ulti-bar-wrapper">
                            <div class="ulti-bar-container"><div class="ulti-bar-fill" style="width: ${ultiLista ? '100%' : (estaBloqueada ? '0%' : ((unidad.ultiCarga || 0) / ultiData.carga * 100) + '%')}"></div></div>
                            <span class="ulti-bar-text">${unidad.ultiCarga || 0}/${ultiData.carga}</span>
                        </div>
                    </div>
                    <div class="ulti-icon-container">
                        <div class="disco-badge ${discoClase}" title="${estaBloqueada ? 'Requiere Disco Definitivo' : 'Disco Definitivo equipado'}">💿</div>
                        <div class="ulti-icon">${iconoUlti}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // 6. Objetos Equipados
    const objetosNormales = [];
    let discoIdx = -1;
    if (unidad.objetos) {
        unidad.objetos.forEach((obj, idx) => {
            const data = OBJETOS[obj];
            if (!data) return;
            if (data.efecto && data.efecto.esDiscoUlti) discoIdx = idx;
            else objetosNormales.push({ obj, data });
        });
    }

    html += `<div class="carta-objetos">`;
    // 2 slots normales
    for (let i = 0; i < 2; i++) {
        if (i < objetosNormales.length) {
            const { obj, data } = objetosNormales[i];
            const iconoHtml = (data.emoji && data.emoji.includes('.png')) ? `<img src="${data.emoji}" class="objeto-icon">` : data.emoji || '📦';
            html += `<div class="carta-objeto-item ocupado" title="${obj}: ${data.descripcion}">${iconoHtml}</div>`;
        } else {
            html += `<div class="carta-objeto-item vacio">▢</div>`;
        }
    }
    // Slot Disco
    if (discoIdx !== -1) {
        const data = OBJETOS[unidad.objetos[discoIdx]];
        const iconoHtml = (data.emoji && data.emoji.includes('.png')) ? `<img src="${data.emoji}" class="objeto-icon">` : data.emoji || '💿';
        html += `<div class="carta-objeto-item ocupado" style="border-color:#fbbf24;" title="${data.descripcion}">${iconoHtml}</div>`;
    } else {
        html += `<div class="carta-objeto-item vacio" title="Slot de ULTI">💿</div>`;
    }
    html += `</div>`;

    // Inyectar HTML
    const contenido = panel.querySelector('.carta-contenido');
    if (contenido) {
        contenido.innerHTML = html;
    } else {
        panel.innerHTML = `<div class="carta-contenido">${html}</div>`;
    }

    panel.style.display = 'flex';
    panel.classList.add('visible');

    // Click fuera para cerrar y reenviar click
    panel.onclick = function(e) {
        if (e.target !== panel) return;
        const x = e.clientX;
        const y = e.clientY;
        cerrarCarta();
        panel.style.pointerEvents = 'none';
        panel.style.display = 'none';
        const elementoDebajo = document.elementFromPoint(x, y);
        panel.style.pointerEvents = '';
        panel.style.display = 'none';
        if (!elementoDebajo) return;
        const celda = elementoDebajo.closest('.board-cell, .bank-cell');
        if (celda) {
            const tipo = celda.dataset.tipo;
            const indice = parseInt(celda.dataset.indice, 10);
            let tieneUnidad = false;
            if (tipo === 'tablero') tieneUnidad = !!(tablero[indice]);
            else if (tipo === 'banquillo') tieneUnidad = !!(banquillo[indice]);
            else if (tipo === 'enemigo') tieneUnidad = !!(enemyBoard[indice]);
            else if (tipo === 'enemigoBanquillo') tieneUnidad = !!(enemyBanquillo[indice]);
            if (tieneUnidad && !isNaN(indice) && typeof abrirCarta === 'function') {
                setTimeout(() => abrirCarta(tipo, indice), 10);
            }
        }
    };
}

function cerrarCarta() {
    const panel = document.getElementById('cartaPanel');
    if (!panel) return;
    cartaAbierta = false;
    cartaUnidadActual = null;
    cartaTipoUbicacion = null;
    cartaIndiceUbicacion = null;
    panel.style.display = 'none';
    panel.classList.remove('visible');
    panel.onclick = null;
}

function actualizarBotonVenderCarta() {
    const btnVender = document.getElementById('cartaBtnVender');
    if (btnVender) btnVender.style.display = 'none';
}

function seleccionarUnidad(tipo, idx) { return; }

function abrirCartaPorDobleClic(tipo, idx) { abrirCarta(tipo, idx); }

function vender(tipo, idx) {
    if (!puedeInteractuar()) return;
    let u = tipo === 'tablero' ? tablero[idx] : banquillo[idx];
    if (!u) return;
    if (u.esZacian) { addConsoleMessage(`❌ ¡Zacian no se puede vender!`, 'error'); return; }
    if (typeof manejarObjetosAlVenderUnidad === 'function') manejarObjetosAlVenderUnidad(u);
    let costeBase = u.costeOriginal || u.pokemon.coste || 1;
    let multiplicador = 1;
    if (u.nivel === 1) multiplicador = 1;
    else if (u.nivel === 2) multiplicador = 3;
    else if (u.nivel === 3) multiplicador = 9;
    let valor = costeBase * multiplicador;
    addConsoleMessage(`💸 Vendiste ${u.pokemon.nombre} (${u.nivel}★) por ${valor}💰`, 'sell');
    oro += valor;
    let copiasADevolver = u.nivel === 3 ? 9 : (u.nivel === 2 ? 3 : 1);
    devolverAlPool(u.baseId, copiasADevolver);
    if (tipo === 'tablero') tablero[idx] = null;
    else banquillo[idx] = null;
    playSellSound();
    aplicarSinergias();
    verificarTodasLasFusiones();
    renderizar();
    actualizarBadgeBaul();
}

function equiparObjetoDesdeBaul(indexBaul, tipoUnidad, idxUnidad) {
    if (!puedeInteractuar()) return;
    if (indexBaul >= baulObjetos.length) return;
    const nombreObjeto = baulObjetos[indexBaul];
    let unidad = tipoUnidad === 'tablero' ? tablero[idxUnidad] : banquillo[idxUnidad];
    if (!unidad) return;
    if (unidad.esZacian || unidad.noEquiparObjetos) { addConsoleMessage(`❌ Zacian no puede equipar objetos manualmente!`, 'error'); return; }

    const objeto = OBJETOS[nombreObjeto];
    if (objeto) {
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
            if (unidad.nivel < 2) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} necesita ser 2★ o 3★ para equipar el Disco Definitivo`, 'error'); return; }
            if (discosEquipados.length >= 1) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene un Disco Definitivo equipado`, 'error'); return; }
        } else {
            if (objetosNormales.length >= 2) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} ya tiene 2 objetos equipados`, 'error'); return; }
            if (objeto.requerido) {
                const tieneTipo = unidad.pokemon.tipos && Array.isArray(unidad.pokemon.tipos) && unidad.pokemon.tipos.includes(objeto.requerido);
                if (!tieneTipo) { addConsoleMessage(`❌ ${unidad.pokemon.nombre} no puede equipar ${nombreObjeto} (requiere tipo ${objeto.requerido})`, 'error'); return; }
            }
        }
    }

    if (aplicarObjeto(unidad, nombreObjeto)) {
        baulObjetos.splice(indexBaul, 1);
        objetoSeleccionado = null;
        aplicarSinergias();
        renderizar();
        actualizarBadgeBaul();
    }
}

function getColorTipo(tipo) {
    const colores = {
        "Fuego": "#fb923c", "Agua": "#38bdf8", "Planta": "#4ade80",
        "Eléctrico": "#facc15", "Psíquico": "#c084fc", "Siniestro": "#475569",
        "Hada": "#f472b6", "Fantasma": "#a78bfa", "Lucha": "#f87171",
        "Veneno": "#c084fc", "Hielo": "#67e8f9", "Dragón": "#818cf8",
        "Roca": "#a16207", "Normal": "#9ca3af", "Volador": "#93c5fd",
        "Acero": "#94a3b8", "Eevee": "#fb923c"
    };
    return colores[tipo] || "#e2e8f0";
}

function viewMove(tipo) {
    const tabPrinc = document.querySelector('.move-tab:nth-child(1)');
    const tabSec = document.querySelector('.move-tab:nth-child(2)');
    const contentPrinc = document.getElementById('content-mov-princ');
    const contentSec = document.getElementById('content-mov-sec');

    if (tipo === 'principal') {
        if (tabPrinc) tabPrinc.classList.add('viewing');
        if (tabSec) tabSec.classList.remove('viewing');
        if (contentPrinc) contentPrinc.classList.add('viewing');
        if (contentSec) contentSec.classList.remove('viewing');
    } else {
        if (tabSec) tabSec.classList.add('viewing');
        if (tabPrinc) tabPrinc.classList.remove('viewing');
        if (contentSec) contentSec.classList.add('viewing');
        if (contentPrinc) contentPrinc.classList.remove('viewing');
    }
    movimientoSeleccionadoIndex = (tipo === 'principal') ? 0 : 1;
}

function activarMovimientoDesdeCarta(nuevoActivo) {
    if (!cartaUnidadActual) return;
    const unidad = cartaUnidadActual;

    if (unidad.movimientoActivo === nuevoActivo) return;
    if (unidad.nivel < 2 || !unidad.movSecundarioDesbloqueado) {
        addConsoleMessage(`❌ ${unidad.pokemon.nombre} necesita ser 2★ para cambiar de movimiento`, 'error');
        return;
    }

    if (typeof cambiarMovimientoActivo === 'function') {
        const exito = cambiarMovimientoActivo(unidad, nuevoActivo);
        if (exito) {
            abrirCarta(cartaTipoUbicacion, cartaIndiceUbicacion);
            if (typeof renderizar === 'function') renderizar();
        }
    }
}
