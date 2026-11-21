// ============================================================
// UI - RENDERIZADO COMPLETO DEL JUEGO
// v8.7 - DOBLE CLICK PARA ABRIR CARTA
// ============================================================

const SPRITES_MIRAN_DERECHA = new Set([282, 150]);
function _spriteMiraDerecha(spriteId) { return SPRITES_MIRAN_DERECHA.has(Number(spriteId)); }
window.SPRITES_MIRAN_DERECHA = SPRITES_MIRAN_DERECHA;
window._spriteMiraDerecha = _spriteMiraDerecha;

function obtenerRangoAtaque(unidad) {
    if (!unidad || !unidad.pokemon) return 1;
    if (unidad.esZacian) return 1;
    if (typeof unidad.pokemon.rangoAtaque === 'number' && unidad.pokemon.rangoAtaque > 0) return unidad.pokemon.rangoAtaque;
    const movimientos = getMovimientosPokemon(unidad.pokemon.nombre);
    if (!movimientos || movimientos.length === 0) return 1;
    const movPrincipal = movimientos[0];
    const nombreLimpio = limpiarNombreMovimiento(movPrincipal.nombre);
    const info = getDescripcionMovimiento(nombreLimpio);
    if (!info || !info.alcance) return 1;
    const match = String(info.alcance).match(/(\d+)/);
    if (!match) return 1;
    return parseInt(match[1], 10);
}

function calcularDistanciaCasillas(idxA, idxB) {
    const cols = 4;
    return Math.abs(Math.floor(idxA / cols) - Math.floor(idxB / cols)) + Math.abs((idxA % cols) - (idxB % cols));
}

function estaEnRango(idxA, idxB, rango) {
    const cols = 4;
    const df = Math.abs(Math.floor(idxA / cols) - Math.floor(idxB / cols));
    const dc = Math.abs((idxA % cols) - (idxB % cols));
    if (rango <= 1) return Math.max(df, dc) <= 1;
    return (df + dc) <= rango;
}

function calcularDistanciaEntreTableros(indiceJugador, indiceEnemigo) {
    const cols = 4;
    const filaJugador = Math.floor(indiceJugador / cols);
    const colJugadorLocal = indiceJugador % cols;
    const filaEnemigo = Math.floor(indiceEnemigo / cols);
    const colEnemigoLocal = indiceEnemigo % cols;
    const colGlobalJugador = colJugadorLocal;
    const colGlobalEnemigo = 4 + colEnemigoLocal;
    return Math.abs(colGlobalJugador - colGlobalEnemigo) + Math.abs(filaJugador - filaEnemigo);
}

function estaEnRangoEntreTableros(indiceJugador, indiceEnemigo, rango) {
    const cols = 4;
    const filaJugador = Math.floor(indiceJugador / cols);
    const colJugadorLocal = indiceJugador % cols;
    const filaEnemigo = Math.floor(indiceEnemigo / cols);
    const colEnemigoLocal = indiceEnemigo % cols;
    const colGlobalJugador = colJugadorLocal;
    const colGlobalEnemigo = 4 + colEnemigoLocal;
    const df = Math.abs(filaJugador - filaEnemigo);
    const dc = Math.abs(colGlobalJugador - colGlobalEnemigo);
    if (rango <= 1) return Math.max(df, dc) <= 1;
    return (df + dc) <= rango;
}

// ✨ HOVER: resaltar las casillas EXACTAMENTE igual que al arrastrar el Pokémon,
//    reutilizando la misma lógica de colores de dragDrop.js.
function resaltarRangoHover(tipo, indice) {
    if (typeof combatiendo !== 'undefined' && combatiendo) return;
    if (typeof window.estaArrastrando === 'function' && window.estaArrastrando()) return;
    let unidad = null;
    if (tipo === 'tablero') unidad = tablero[indice];
    else if (tipo === 'enemigo') unidad = enemyBoard[indice];
    if (!unidad) return;
    if (typeof window.aplicarColoresDeSeleccion === 'function') {
        window.aplicarColoresDeSeleccion(tipo, indice, unidad, null, true);
    }
}

function limpiarResaltadoRango() {
    if (typeof window.estaArrastrando === 'function' && window.estaArrastrando()) return;
    if (typeof window.limpiarColoresDeSeleccion === 'function') {
        window.limpiarColoresDeSeleccion();
    }
}

// ============================================================
// 🎯 TOOLTIP DE OBJETOS (hover)
// ============================================================
// Tooltip flotante único que muestra el nombre + descripción de cualquier
// objeto con `data-objeto-nombre` (objetos equipados y del baúl).
(function initTooltipObjetos() {
    if (document.getElementById('tooltipObjetoFlotante')) return;
    const tip = document.createElement('div');
    tip.id = 'tooltipObjetoFlotante';
    tip.style.cssText = 'position:fixed;z-index:100000;pointer-events:none;display:none;background:#1a2236;border:1px solid #fbbf24;border-radius:8px;padding:8px 12px;max-width:240px;box-shadow:0 8px 25px rgba(0,0,0,0.5);';
    document.body.appendChild(tip);

    function posicionar(e) {
        const pad = 14;
        let x = e.clientX + pad;
        let y = e.clientY + pad;
        const w = tip.offsetWidth || 160;
        const h = tip.offsetHeight || 60;
        if (x + w > window.innerWidth) x = e.clientX - w - pad;
        if (y + h > window.innerHeight) y = e.clientY - h - pad;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
    }

    document.addEventListener('mouseover', function (e) {
        const el = e.target && e.target.closest ? e.target.closest('[data-objeto-nombre]') : null;
        if (!el || !window.OBJETOS) return;
        const nombre = el.getAttribute('data-objeto-nombre');
        const obj = window.OBJETOS[nombre];
        if (!obj) return;
        tip.innerHTML =
            `<div style="font-size:0.72rem;font-weight:700;color:#fbbf24;margin-bottom:3px;">${nombre}</div>` +
            `<div style="font-size:0.62rem;color:#93c5fd;line-height:1.4;">${obj.descripcion || ''}</div>` +
            (obj.requerido ? `<div style="font-size:0.58rem;color:#f87171;margin-top:3px;">🔒 Requiere: ${obj.requerido}</div>` : '');
        tip.style.display = 'block';
        posicionar(e);
    });

    document.addEventListener('mousemove', function (e) {
        if (tip.style.display === 'block') posicionar(e);
    });

    document.addEventListener('mouseout', function (e) {
        const el = e.target && e.target.closest ? e.target.closest('[data-objeto-nombre]') : null;
        if (el && e.relatedTarget && el.contains(e.relatedTarget)) return;
        tip.style.display = 'none';
    });
})();

function renderSpriteHtml(unidad, clasesExtra = '', ladoTablero = 'player') {
    const spriteId = unidad.spriteIdAlternativo || unidad.pokemon.spriteId;
    const esShiny = unidad.esShiny === true;
    const url = getSpriteUrl(spriteId, unidad.pokemon.nombre, esShiny);
    const urlFallbackShiny = getSpriteUrlFallback(spriteId, unidad.pokemon.nombre, true);
    const urlFallbackNormal = getSpriteUrlFallback(spriteId, unidad.pokemon.nombre, false);
    const urlFallback = getSpriteUrlOriginal(unidad);
    const escala = getSpriteScale(spriteId);
    const offsetX = getSpriteOffsetX(spriteId);
    const clases = `unit-sprite ${clasesExtra} ${esShiny ? 'shiny' : ''}`.trim();
    const miraDerecha = _spriteMiraDerecha(spriteId);
    let flip = ladoTablero === 'player' ? (miraDerecha ? 1 : -1) : (miraDerecha ? -1 : 1);
    // 👥 2P: con turno de J2 el tablero está espejado (J2 a la derecha),
    // así que invertimos la orientación del sprite para que mire al rival.
    if (window.modoDosJugadores && window.turnoJugador === 2) flip = -flip;

    // 🚫 FIX parpadeo: si ya conocemos el formato real del sprite (GIF o PNG),
    // emitimos la URL definitiva sin la cadena onerror que alternaba GIF→PNG en
    // cada re-render del tablero. Solo aplica a no-shiny (los shiny mantienen su
    // cadena de 4 pasos original para no romper el fallback shiny).
    const formato = (!esShiny && typeof formatoSpriteResuelto === 'function')
        ? formatoSpriteResuelto(spriteId, false)
        : null;

    let src = url;
    let onerrorAttr = '';

    if (formato === 'png') {
        // El sprite solo existe como PNG → URL directa, sin cadena de fallback.
        src = urlFallback;
    } else if (formato === 'gif') {
        // El sprite existe como GIF → URL directa, sin cadena de fallback.
        src = url;
    } else {
        // Formato aún no resuelto (o shiny) → mantener la cadena onerror original.
        const onerrorChain = esShiny
            ? `if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${urlFallbackShiny}';}
               else if(this.dataset.fb!=='2'){this.dataset.fb='2';this.src='${getSpriteUrl(spriteId, unidad.pokemon.nombre, false)}';}
               else if(this.dataset.fb!=='3'){this.dataset.fb='3';this.src='${urlFallback}';}
               else{this.style.display='none';}`
            : `if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${urlFallback}';}else{this.style.display='none';}`;
        onerrorAttr = ` onerror="${onerrorChain}"`;
    }

    return `<img class="${clases}" src="${src}" alt="${unidad.pokemon.nombre}${esShiny ? ' ✨' : ''}" draggable="false" style="--sprite-scale: ${escala}; --sprite-offset-x: ${offsetX}; --sprite-flip: ${flip}"${onerrorAttr}>`;
}

function renderEstrellasHtml(nivel) {
    if (!nivel || nivel < 1) return '';
    return `<span class="unit-stars-right"><img class="estrellas-img" src="${getEstrellasUrl(nivel)}" alt="${nivel}★" draggable="false"></span>`;
}

function renderTraitsHtml(pokemon) {
    if (pokemon && pokemon.id === 999) return '';
    let html = '';
    if (pokemon.tipos && pokemon.tipos.length > 0) html += pokemon.tipos.map(t => `<span class="trait-icon">${getIconoTipo(t)}</span>`).join('');
    if (pokemon.clase) html += `<span class="trait-icon">${getIconoClase(pokemon.clase)}</span>`;
    return html;
}

function renderBadgeFrontBack(unidad) { return ''; }
function renderBadgeInvasor(unidad, ladoTablero) { return ''; }

function frostStacksHtml(stacks) {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `<span class="frost-dot${i < stacks ? ' filled' : ''}"></span>`;
    }
    return html;
}

function renderFrostStacks(unidad) {
    const stacks = (unidad && unidad.frostStacks) ? Math.min(unidad.frostStacks, 6) : 0;
    if (stacks <= 0) return '';
    return `<div class="frost-stacks">${frostStacksHtml(stacks)}</div>`;
}

function shockStacksHtml(stacks) {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `<span class="shock-dot${i < stacks ? ' filled' : ''}"></span>`;
    }
    return html;
}

function renderShockStacks(unidad) {
    const stacks = (unidad && unidad.shockStacks) ? Math.min(unidad.shockStacks, 6) : 0;
    if (stacks <= 0) return '';
    return `<div class="shock-stacks">${shockStacksHtml(stacks)}</div>`;
}

function actualizarFrostStacksVisual(elemento, unidad) {
    if (!elemento || !unidad) return;
    const stacks = Math.min(unidad.frostStacks || 0, 6);
    let container = elemento.querySelector('.frost-stacks');
    if (stacks <= 0) { if (container) container.remove(); return; }
    if (!container) { container = document.createElement('div'); container.className = 'frost-stacks'; elemento.appendChild(container); }
    container.innerHTML = frostStacksHtml(stacks);
}

function actualizarShockStacksVisual(elemento, unidad) {
    if (!elemento || !unidad) return;
    const stacks = Math.min(unidad.shockStacks || 0, 6);
    let container = elemento.querySelector('.shock-stacks');
    if (stacks <= 0) { if (container) container.remove(); return; }
    if (!container) { container = document.createElement('div'); container.className = 'shock-stacks'; elemento.appendChild(container); }
    container.innerHTML = shockStacksHtml(stacks);
}

function renderHPBar(unidad) {
    const hpPercent = unidad.maxHp > 0 ? (unidad.hp / unidad.maxHp) * 100 : 0;
    const hpClamped = Math.max(0, Math.min(100, hpPercent));
    let hpFillClass = 'hp-fill';
    if (hpPercent > 50) hpFillClass = 'hp-fill';
    else if (hpPercent > 25) hpFillClass = 'hp-fill medium';
    else if (hpPercent > 10) hpFillClass = 'hp-fill low';
    else hpFillClass = 'hp-fill critical';

    let escudoHtml = '';
    if (unidad.escudoActual > 0 && unidad.maxHp > 0) {
        const escudoPercent = Math.min(100 - hpPercent, (unidad.escudoActual / unidad.maxHp) * 100);
        if (escudoPercent > 0) escudoHtml = `<div class="hp-shield" style="left:${hpPercent}%;width:${escudoPercent}%;"></div>`;
    }

    const numSegments = Math.min(Math.max(4, Math.ceil(unidad.maxHp / 100)), 20);
    let segmentsHtml = '';
    for (let s = 0; s < numSegments; s++) segmentsHtml += `<div class="segment"></div>`;

    const teamClass = unidad.equipo === 'player' ? 'team-player' : 'team-enemy';
    return `<div class="unit-hp-container"><div class="unit-hp-bar tft-style ${teamClass}"><div class="${hpFillClass}" style="width:${hpClamped}%;"></div>${escudoHtml}<div class="hp-segments">${segmentsHtml}</div></div></div>`;
}

function renderEnergyBar(unidad) {
    const energyPercent = unidad.energyGauge > 0 ? (unidad.energy / unidad.energyGauge) * 100 : 0;
    const clamped = Math.max(0, Math.min(100, energyPercent));
    return `<div class="energy-bar"><div class="energy-fill" style="width:${clamped}%;"></div></div>`;
}

function renderUltiBar(unidad) {
    if (!unidad.tieneDiscoUlti) return '';
    const ultiData = window.ULTIS_POKEMON && window.ULTIS_POKEMON[unidad.pokemon.nombre];
    if (!ultiData || !ultiData.carga) return '';
    const cargaActual = unidad.ultiCarga || 0;
    const cargaMax = ultiData.carga;
    const porcentaje = Math.min(100, (cargaActual / cargaMax) * 100);
    const ultiLista = unidad.ultiLista || false;
    const colorFondo = ultiLista ? 'linear-gradient(90deg, #fbbf24, #fde68a, #fbbf24)' : 'linear-gradient(90deg, #facc15, #fde047, #facc15)';
    const glow = ultiLista ? 'box-shadow: 0 0 12px rgba(251, 191, 36, 0.9), 0 0 20px rgba(251, 191, 36, 0.5); animation: pulseUlti 1s ease-in-out infinite;' : '';
    return `<div class="ulti-bar" title="ULTI: ${ultiData.nombre} (${cargaActual}/${cargaMax})"><div class="ulti-fill" style="width:${porcentaje}%; background:${colorFondo}; ${glow}"></div></div>`;
}

function _renderSlotObjeto(obj, idx, data, tipoUnidad, indiceUnidad, claseSpan, claseImg, tamano, tamanoImg, esDisco) {
    const iconoHtml = (data.emoji && data.emoji.includes('.png'))
        ? `<img src="${data.emoji}" class="${claseImg}" alt="${obj}" draggable="false" style="width:${tamanoImg}px;height:${tamanoImg}px;object-fit:contain;display:block;">`
        : `<span style="font-size:${esDisco ? '0.9' : '0.7'}rem;">${data.emoji || (esDisco ? '💿' : '📦')}</span>`;
    const onclickStr = `event.stopPropagation(); if(!combatiendo && typeof desequiparObjeto === 'function') desequiparObjeto('${tipoUnidad}', ${indiceUnidad}, ${idx})`;
    const borderColor = esDisco ? 'rgba(251,191,36,0.6)' : 'rgba(251,191,36,0.3)';
    const bg = esDisco ? 'rgba(251,191,36,0.2)' : 'rgba(0,0,0,0.5)';
    return `<span class="${claseSpan}" data-objeto-index="${idx}" data-objeto-nombre="${obj}" onclick="${onclickStr}" style="display:inline-flex;align-items:center;justify-content:center;width:${tamano}px;height:${tamano}px;background:${bg};border:2px solid ${borderColor};border-radius:6px;cursor:grab;padding:2px;box-sizing:border-box;">${iconoHtml}</span>`;
}

function renderObjetosEquipados(unidad, tipoUnidad, indiceUnidad, esBanquillo = false) {
    if (unidad.esZacian && esBanquillo) return '';
    const tamano = esBanquillo ? 22 : 26;
    const tamanoImg = esBanquillo ? 16 : 20;
    const claseSpan = esBanquillo ? 'objeto-equipado-banquillo' : 'objeto-equipado-tablero';
    const claseImg = esBanquillo ? 'objeto-icon-banquillo' : 'objeto-icon-tablero';
    const normales = [];
    let discoIdx = -1;
    if (unidad.objetos) {
        unidad.objetos.forEach((obj, idx) => {
            const data = OBJETOS[obj];
            if (!data) return;
            if (data.efecto && data.efecto.esDiscoUlti) discoIdx = idx;
            else normales.push({ obj, idx, data });
        });
    }
    const slots = [];
    for (let i = 0; i < 2; i++) {
        if (i < normales.length) {
            const { obj, idx, data } = normales[i];
            slots.push(_renderSlotObjeto(obj, idx, data, tipoUnidad, indiceUnidad, claseSpan, claseImg, tamano, tamanoImg, false));
        } else {
            slots.push(`<span class="${claseSpan} vacio" data-objeto-index="-1" data-objeto-nombre="" style="display:inline-flex;align-items:center;justify-content:center;width:${tamano}px;height:${tamano}px;background:rgba(0,0,0,0.15);border:2px solid rgba(42,58,90,0.3);border-radius:6px;font-size:0.5rem;color:#4a6a8a;box-sizing:border-box;">▢</span>`);
        }
    }
    if (discoIdx !== -1) {
        const obj = unidad.objetos[discoIdx];
        const data = OBJETOS[obj];
        if (data) slots.push(_renderSlotObjeto(obj, discoIdx, data, tipoUnidad, indiceUnidad, claseSpan, claseImg, tamano, tamanoImg, true));
    } else {
        slots.push(`<span class="${claseSpan} vacio slot-ulti" data-objeto-index="-1" data-objeto-nombre="" title="Slot de ULTI (Disco Definitivo)" style="display:inline-flex;align-items:center;justify-content:center;width:${tamano}px;height:${tamano}px;background:rgba(0,0,0,0.25);border:2px dashed rgba(251,191,36,0.25);border-radius:6px;font-size:${esBanquillo ? '0.55' : '0.6'}rem;color:rgba(251,191,36,0.35);box-sizing:border-box;">💿</span>`);
    }
    return slots.join('');
}

function intentarEngancharDrag(cell, tipo, indice, unidad) {
    if (!unidad || typeof engancharDrag !== 'function' || typeof puedeArrastrar !== 'function' || !puedeArrastrar(tipo, indice)) return;
    engancharDrag(cell, tipo, indice);
}

function renderizarTableroJugador() {
    const grid = document.getElementById("playerBoard");
    if (!grid) return;
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(4, 1fr)";
    grid.style.maxWidth = "720px";

        for (let i = 0; i < tablero.length; i++) {
        const u = tablero[i];
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.tipo = 'tablero';
        cell.dataset.indice = i;
        cell.dataset.coord = getCoordenadaCasilla(i, 'player');

        if (u) {
            cell.classList.add('has-unit', 'team-player');
            if (u.esZacian) cell.classList.add('cost-5');
            else if (u.costeOriginal) cell.classList.add('cost-' + u.costeOriginal);
            if (u.poisonStacks && u.poisonStacks.length > 0) cell.classList.add('casilla-veneno');
            if (u._quemado || u.burnDamage > 0) cell.classList.add('casilla-quemadura');

            let spriteClases = '';
            if (u.frozen) spriteClases += ' frozen';
            if (u._quemado || u.burnDamage > 0) spriteClases += ' burn';

            const tieneDiscoEnObjetos = u.objetos && u.objetos.some(o => { const obj = window.OBJETOS && window.OBJETOS[o]; return obj && obj.efecto && obj.efecto.esDiscoUlti; });
            if (tieneDiscoEnObjetos !== u.tieneDiscoUlti) {
                u.tieneDiscoUlti = tieneDiscoEnObjetos;
                if (!tieneDiscoEnObjetos) { u.ultiCarga = 0; u.ultiLista = false; u._ultiAvisada = false; }
            }

            const objetosHtml = renderObjetosEquipados(u, 'tablero', i, false);
            const objetosContenedor = objetosHtml ? `<div class="objetos-equipados" style="display:flex;gap:4px;justify-content:center;align-items:center;position:relative;width:100%;padding:2px 4px;z-index:3;min-height:26px;margin-top:6px;">${objetosHtml}</div>` : '';

                        cell.innerHTML = `
                ${renderSpriteHtml(u, spriteClases, 'player')}
                <span class="unit-name ${u.esShiny ? 'shiny-name' : ''}">${u.pokemon.nombre}</span>
                <div class="unit-traits-left">${renderTraitsHtml(u.pokemon)}</div>
                ${renderHPBar(u)}
                ${renderEnergyBar(u)}
                ${renderUltiBar(u)}
                ${objetosContenedor}
                ${renderEstrellasHtml(u.nivel)}
                ${renderBadgeFrontBack(u)}
                ${renderFrostStacks(u)}
                ${renderShockStacks(u)}
                ${renderEscudoRoto(u)}
                ${renderIconoLlamarada(u)}
            `;

            // 🆕 DOBLE CLICK para abrir la carta (evita conflictos con drag)
            cell.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (combatiendo) return;
                if (e.target.closest('.objetos-equipados')) return;
                if (objetoSeleccionado) { equiparObjetoDesdeBaul(objetoSeleccionado.index, 'tablero', i); return; }
                if (tablero[i]) abrirCarta('tablero', i);
            });

            // ✨ HOVER: resaltar el rango de ataque al pasar el ratón
            cell.addEventListener('mouseenter', function () { resaltarRangoHover('tablero', i); });
            cell.addEventListener('mouseleave', function () { limpiarResaltadoRango(); });
        } else {
            cell.innerHTML = '<span style="font-size:1.2rem;opacity:0.15;">▢</span>';
            cell.style.cssText = 'font-size:0.8rem;color:#4a6a8a;background:transparent;border:2px solid #2a3a5a;box-shadow:none;';
            cell.addEventListener('click', function (e) { e.stopPropagation(); });
        }
                grid.appendChild(cell);
        intentarEngancharDrag(cell, 'tablero', i, u);

        // 🆕 FIX: volver a aplicar la zona activa si existe
        if (typeof _zonaActivaEn === 'function') {
            const coords = coordsDesdeIndice(i, 'player');
            const zona = _zonaActivaEn(coords._filaGlobal, coords._colGlobal);
            if (zona) {
                cell.classList.add('mov-zone-marcada', zona.clase);
                if (zona.parpadeo) {
                    cell.classList.add('mov-zone-parpadeo');
                }
            }
        }
    }
}

function renderizarBanquilloJugador() {
    const grid = document.getElementById("banquilloGrid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < banquillo.length; i++) {
        const u = banquillo[i];
        const cell = document.createElement('div');
        cell.className = 'bank-cell';
        cell.dataset.tipo = 'banquillo';
        cell.dataset.indice = i;

        if (u) {
            cell.classList.add('has-unit', 'team-player');
            if (u.esZacian) cell.classList.add('cost-5');
            else if (u.costeOriginal) cell.classList.add('cost-' + u.costeOriginal);
            cell.innerHTML = `
                ${renderSpriteHtml(u, '', 'player')}
                <span class="unit-name ${u.esShiny ? 'shiny-name' : ''}">${u.pokemon.nombre}</span>
                <div class="unit-traits-left">${renderTraitsHtml(u.pokemon)}</div>
                ${renderEstrellasHtml(u.nivel)}
            `;
            // 🆕 DOBLE CLICK para abrir la carta
            cell.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (combatiendo) return;
                if (objetoSeleccionado) { equiparObjetoDesdeBaul(objetoSeleccionado.index, 'banquillo', i); return; }
                if (banquillo[i]) abrirCarta('banquillo', i);
            });
        } else {
            cell.textContent = '▢';
            cell.style.cssText = 'font-size:0.8rem;opacity:0.2;color:#4a6a8a;background:transparent;';
            cell.addEventListener('click', function (e) { e.stopPropagation(); });
        }
        grid.appendChild(cell);
        intentarEngancharDrag(cell, 'banquillo', i, u);
    }
}

function renderizarTableroEnemigo() {
    const grid = document.getElementById("enemigoBoard");
    if (!grid) return;
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(4, 1fr)";
    grid.style.maxWidth = "720px";

        for (let i = 0; i < enemyBoard.length; i++) {
        const u = enemyBoard[i];
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.tipo = 'enemigo';
        cell.dataset.indice = i;
        cell.dataset.coord = getCoordenadaCasilla(i, 'enemy');

        if (u) {
            cell.classList.add('has-unit', 'team-enemy');
            if (u.esZacian) cell.classList.add('cost-5');
            else if (u.costeOriginal) cell.classList.add('cost-' + u.costeOriginal);
            if (u.poisonStacks && u.poisonStacks.length > 0) cell.classList.add('casilla-veneno');
            if (u._quemado || u.burnDamage > 0) cell.classList.add('casilla-quemadura');

            let spriteClases = '';
            if (u.frozen) spriteClases += ' frozen';
            if (u._quemado || u.burnDamage > 0) spriteClases += ' burn';

            const tieneDiscoEnObjetos = u.objetos && u.objetos.some(o => { const obj = window.OBJETOS && window.OBJETOS[o]; return obj && obj.efecto && obj.efecto.esDiscoUlti; });
            if (tieneDiscoEnObjetos !== u.tieneDiscoUlti) {
                u.tieneDiscoUlti = tieneDiscoEnObjetos;
                if (!tieneDiscoEnObjetos) { u.ultiCarga = 0; u.ultiLista = false; u._ultiAvisada = false; }
            }

            const objetosHtml = renderObjetosEquipados(u, 'enemigo', i, false);
            const objetosContenedor = objetosHtml ? `<div class="objetos-equipados" style="display:flex;gap:4px;justify-content:center;align-items:center;position:relative;width:100%;padding:2px 4px;z-index:3;min-height:26px;margin-top:6px;">${objetosHtml}</div>` : '';

                        cell.innerHTML = `
                ${renderSpriteHtml(u, spriteClases, 'enemy')}
                <span class="unit-name ${u.esShiny ? 'shiny-name' : ''}">${u.pokemon.nombre}</span>
                <div class="unit-traits-left">${renderTraitsHtml(u.pokemon)}</div>
                ${renderHPBar(u)}
                ${renderEnergyBar(u)}
                ${renderUltiBar(u)}
                ${objetosContenedor}
                ${renderEstrellasHtml(u.nivel)}
                ${renderBadgeFrontBack(u)}
                ${renderFrostStacks(u)}
                ${renderShockStacks(u)}
                ${renderEscudoRoto(u)}
                ${renderIconoLlamarada(u)}
            `;

            cell.style.cursor = 'pointer';
            // 🆕 DOBLE CLICK para abrir la carta
            cell.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (!window.modoCreativo || combatiendo) return;
                if (e.target.closest('.objetos-equipados')) return;
                if (objetoSeleccionado && objetoSeleccionado.lado === 'enemigo' && enemyBoard[i]) { equiparObjetoAEnemigo(objetoSeleccionado.index, 'enemigo', i); return; }
                if (enemyBoard[i]) abrirCarta('enemigo', i);
            });

        } else {
            cell.innerHTML = '<span style="font-size:1.2rem;opacity:0.15;">▢</span>';
            cell.style.cssText = 'font-size:0.8rem;color:#4a6a8a;background:transparent;border:2px solid #2a3a5a;box-shadow:none;cursor:default;';
            cell.addEventListener('click', function (e) { e.stopPropagation(); });
        }
                grid.appendChild(cell);
        intentarEngancharDrag(cell, 'enemigo', i, u);

        // 🆕 FIX: volver a aplicar la zona activa si existe
        if (typeof _zonaActivaEn === 'function') {
            const coords = coordsDesdeIndice(i, 'enemy');
            const zona = _zonaActivaEn(coords._filaGlobal, coords._colGlobal);
            if (zona) {
                cell.classList.add('mov-zone-marcada', zona.clase);
                if (zona.parpadeo) {
                    cell.classList.add('mov-zone-parpadeo');
                }
            }
        }
    }
}

function renderizarBanquilloEnemigo() {
    const grid = document.getElementById("enemyBanquilloGrid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < enemyBanquillo.length; i++) {
        const u = enemyBanquillo[i];
        const cell = document.createElement('div');
        cell.className = 'bank-cell';
        cell.dataset.tipo = 'enemigoBanquillo';
        cell.dataset.indice = i;

        if (u) {
            cell.classList.add('has-unit', 'team-enemy');
            if (u.esZacian) cell.classList.add('cost-5');
            else if (u.costeOriginal) cell.classList.add('cost-' + u.costeOriginal);
            cell.innerHTML = `
                ${renderSpriteHtml(u, '', 'enemy')}
                <span class="unit-name ${u.esShiny ? 'shiny-name' : ''}">${u.pokemon.nombre}</span>
                <div class="unit-traits-left">${renderTraitsHtml(u.pokemon)}</div>
                ${renderEstrellasHtml(u.nivel)}
            `;
            cell.style.cursor = 'pointer';
            // 🆕 DOBLE CLICK para abrir la carta
            cell.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (!window.modoCreativo || combatiendo) return;
                if (objetoSeleccionado && objetoSeleccionado.lado === 'enemigo' && enemyBanquillo[i]) { equiparObjetoAEnemigo(objetoSeleccionado.index, 'enemigoBanquillo', i); return; }
                if (enemyBanquillo[i]) abrirCarta('enemigoBanquillo', i);
            });
        } else {
            cell.textContent = '▢';
            cell.style.cssText = 'font-size:0.8rem;opacity:0.2;color:#4a6a8a;background:transparent;cursor:default;';
            cell.addEventListener('click', function (e) { e.stopPropagation(); });
        }
        grid.appendChild(cell);
        intentarEngancharDrag(cell, 'enemigoBanquillo', i, u);
    }
}

function renderizarTienda() {
    const grid = document.getElementById("tiendaGrid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let idx = 0; idx < tienda.length; idx++) {
        const p = tienda[idx];
        if (!p) continue;
        const card = document.createElement('div');
        card.className = 'shop-card cost-' + p.coste;
        const esShiny = p.shiny === true;
        if (esShiny) card.classList.add('shiny-card');
        const spriteUrl = getSpriteUrl(p.spriteId, p.nombre, esShiny);
        const escalaSprite = typeof getSpriteScale === 'function' ? getSpriteScale(p.spriteId) : 1;
        const offsetXSprite = typeof getSpriteOffsetX === 'function' ? getSpriteOffsetX(p.spriteId) : '0px';

        let copiasEnTablero = 0, copiasEnBanquillo = 0;
        for (let i = 0; i < tablero.length; i++) if (tablero[i] && tablero[i].pokemon.nombre === p.nombre) copiasEnTablero++;
        for (let i = 0; i < banquillo.length; i++) if (banquillo[i] && banquillo[i].pokemon.nombre === p.nombre) copiasEnBanquillo++;
        if (copiasEnTablero + copiasEnBanquillo >= 2) card.classList.add('fusion-ready');

        const monedaImg = `<img src="assets/icons/moneda.png" alt="💰" draggable="false" style="width:16px;height:16px;object-fit:contain;filter:drop-shadow(0 0 4px rgba(251,191,36,0.3));display:inline-block;vertical-align:middle;">`;
        card.innerHTML = `
            <img class="unit-sprite ${esShiny ? 'shiny' : ''}" src="${spriteUrl}" alt="${p.nombre}${esShiny ? ' ✨' : ''}" draggable="false" style="--sprite-scale: ${escalaSprite}; --sprite-offset-x: ${offsetXSprite}" onerror="this.style.display='none'">
            <div class="unit-cost">${monedaImg}<span class="cost-value">${p.coste}</span></div>
            <div class="unit-name ${esShiny ? 'shiny-name' : ''}">${p.nombre}</div>
            <div class="unit-traits-left">${renderTraitsHtml(p)}</div>
            <span class="unit-stars-right"><img class="estrellas-img" src="${getEstrellasUrl(1)}" alt="1★" draggable="false"></span>
        `;
        card.addEventListener('click', function (e) { e.stopPropagation(); comprar(p, idx); });
        grid.appendChild(card);
    }
}

function renderizarTiendaObjetos() {
    const shopObjetos = document.getElementById("shopObjetos");
    const tiendaObjetosGrid = document.getElementById("tiendaObjetosGrid");
    if (!shopObjetos || !tiendaObjetosGrid) return;
    if (objetosEnTienda.length > 0 && debeAparecerTiendaObjetos(ronda) && !objetoCompradoEstaRonda) {
        shopObjetos.style.display = 'block';
        tiendaObjetosGrid.innerHTML = "";
        const hint = document.getElementById("shopObjetosHint");
        if (hint) hint.textContent = `Compra 1 objeto (GRATIS) - Disponible`;
        objetosEnTienda.forEach(nombre => {
            const obj = OBJETOS[nombre];
            if (!obj) return;
            const card = document.createElement('div');
            card.className = 'objeto-card';
            let iconoHtml = '';
            if (obj.emoji && obj.emoji.includes('.png')) iconoHtml = `<img src="${obj.emoji}" class="objeto-icon" alt="${nombre}" draggable="false">`;
            else iconoHtml = obj.emoji || '📦';
            card.innerHTML = `
                <span class="objeto-emoji" style="font-size:2rem;">${iconoHtml}</span>
                <span class="objeto-nombre">${nombre}</span>
                <span class="objeto-comprado">✅ GRATIS</span>
                <div class="objeto-tooltip">
                    <span class="tooltip-titulo">${nombre}</span>
                    <span class="tooltip-desc">${obj.descripcion}</span>
                    ${obj.requerido ? `<span class="tooltip-requerido">🔒 Requiere: ${obj.requerido}</span>` : ''}
                </div>
            `;
            card.addEventListener('click', function (e) { e.stopPropagation(); comprarObjeto(nombre); });
            tiendaObjetosGrid.appendChild(card);
        });
        if (!sonidoObjetosReproducido) { playSonidoObjetos(); sonidoObjetosReproducido = true; addConsoleMessage('🔊 ¡TIENDA DE OBJETOS DISPONIBLE!', 'shop-objetos'); }
    } else {
        shopObjetos.style.display = 'none';
        sonidoObjetosReproducido = false;
    }
}

function renderizarUnidadesVirtuales() {
    if (!window.unidadesVirtuales || window.unidadesVirtuales.length === 0) return;
    const grid = document.getElementById("playerBoard");
    if (!grid) return;
    const celdasLibres = [];
    for (let i = 0; i < tablero.length; i++) if (tablero[i] === null) celdasLibres.push(i);
    window.unidadesVirtuales.forEach((unidadVirtual, idxVirtual) => {
        if (!unidadVirtual || !unidadVirtual.esArticuno) return;
        if (idxVirtual >= celdasLibres.length) return;
        const indiceCelda = celdasLibres[idxVirtual];
        const cellVirtual = grid.children[indiceCelda];
        if (!cellVirtual) return;
        cellVirtual.className = 'board-cell has-unit team-player cost-articuno';
        cellVirtual.classList.add('articuno-cell');
        cellVirtual.innerHTML = '';
        const spriteUrl = getSpriteUrl(144, "Articuno", false);
        const img = document.createElement('img');
        img.className = 'unit-sprite';
        img.src = spriteUrl;
        img.alt = "Articuno";
        img.setAttribute('draggable', 'false');
        img.onerror = function () { this.style.display = 'none'; };
        cellVirtual.appendChild(img);
        const nombre = document.createElement('span');
        nombre.className = 'unit-name';
        nombre.textContent = 'Articuno';
        cellVirtual.appendChild(nombre);
        const traits = document.createElement('div');
        traits.className = 'unit-traits-left';
        traits.innerHTML = `<span class="trait-icon">${getIconoTipo('Hielo')}</span><span class="trait-icon">${getIconoTipo('Volador')}</span>`;
        cellVirtual.appendChild(traits);
        const hpContainer = document.createElement('div');
        hpContainer.className = 'unit-hp-container';
        hpContainer.innerHTML = `<div class="unit-hp-bar tft-style team-player"><div class="hp-fill" style="width:100%;"></div><div class="hp-segments"><div class="segment"></div><div class="segment"></div><div class="segment"></div><div class="segment"></div></div></div>`;
        cellVirtual.appendChild(hpContainer);
        const energyBar = document.createElement('div');
        energyBar.className = 'energy-bar';
        energyBar.innerHTML = `<div class="energy-fill" style="width:0%;"></div>`;
        cellVirtual.appendChild(energyBar);
        const badge = document.createElement('div');
        badge.style.cssText = `position:absolute;top:2px;left:50%;transform:translateX(-50%);font-size:0.35rem;font-weight:700;padding:1px 6px;border-radius:4px;z-index:10;letter-spacing:0.5px;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;pointer-events:none;color:#67e8f9;background:rgba(0,0,0,0.7);border:1px solid rgba(103,232,249,0.4);text-shadow:0 0 10px rgba(103,232,249,0.4);">❄️ INVOCADO</div>`;
        cellVirtual.appendChild(badge);
        cellVirtual.style.cursor = 'default';
        cellVirtual.style.pointerEvents = 'none';
        cellVirtual.style.boxShadow = '0 0 40px rgba(103, 232, 249, 0.4), inset 0 0 40px rgba(103, 232, 249, 0.15)';
    });
}

function renderizar() {
    aplicarSinergias();
    renderizarTableroJugador();
    renderizarUnidadesVirtuales();
    renderizarBanquilloJugador();
    renderizarTienda();
    renderizarTiendaObjetos();
    renderizarTableroEnemigo();
    renderizarBanquilloEnemigo();
    actualizarBarrasZacian();
    actualizarInfoJugador();
    actualizarInfoEnemigo();
        const faseStats = document.getElementById("faseStats");
    const faseStatsNum = document.getElementById("faseStatsNum");
    if (faseStatsNum) {
        faseStatsNum.textContent = fase;
    } else if (faseStats) {
        faseStats.innerHTML = `Ronda <span id="faseStatsNum">${fase}</span>`;
    }
    // 🆕 FIX: asegurar que el badge siempre está visible
    if (faseStats) {
        faseStats.style.display = 'inline-flex';
        faseStats.style.opacity = '1';
        faseStats.style.transform = 'scale(1)';
    }
    aplicarSinergiasEnemigo();
    actualizarBadgeBaul();
    if (typeof actualizarVisibilidadBotonTienda === 'function') actualizarVisibilidadBotonTienda();
    if (baulPanelAbierto) renderizarBaulPanel();
    if (typeof cartaSinergiaAbierta !== 'undefined' && cartaSinergiaAbierta && typeof actualizarCartaSinergia === 'function') actualizarCartaSinergia();
    actualizarObjetosVerticales('jugador');
    actualizarObjetosVerticales('enemigo');
    if (window.postCombateData) {
        const btnPost = document.getElementById('btnPostCombate');
        if (btnPost) { btnPost.style.display = 'flex'; btnPost.style.visibility = 'visible'; btnPost.style.opacity = '1'; btnPost.disabled = false; }
    }
    if (typeof refrescarDragObjetosEquipados === 'function') refrescarDragObjetosEquipados();
}

function renderizarTablero(lado, unidades) {
    if (!unidades) return;
    const gridId = lado === 'player' ? 'playerBoard' : 'enemigoBoard';
    const grid = document.getElementById(gridId);
    if (!grid) return;

    // 🔑 Preservar los <img> de sprite existentes para no reiniciar la animación
    // del GIF (lo que provocaba el parpadeo "desaparece/aparece" en cada re-render).
    const spritesPrevios = new Map();
    for (const cell of Array.from(grid.children)) {
        const key = cell.dataset && cell.dataset.spriteUid;
        if (key) {
            const img = cell.querySelector ? cell.querySelector('.unit-sprite') : null;
            if (img) spritesPrevios.set(key, img);
        }
    }

    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '10px';
    grid.style.maxWidth = '720px';
    grid.style.margin = '0 auto';
    grid.style.alignItems = 'start';
    const totalSlots = TOTAL_CASILLAS_LADO;
    const unidadPorIndice = new Map();
    for (let u of unidades) {
        if (!u || u.muerto || u.hp <= 0) continue;
        if (typeof movAsegurarPosicionGlobal === 'function') movAsegurarPosicionGlobal(u);
        const fila = u._filaGlobal;
        const col = u._colGlobal;
        if (typeof fila !== 'number' || typeof col !== 'number') continue;
        const ladoVisual = (col <= 3) ? 'player' : 'enemy';
        if (ladoVisual !== lado) continue;
        let indiceLocal = lado === 'player' ? fila * COLUMNAS_ARENA + col : fila * COLUMNAS_ARENA + (col - 4);
        if (indiceLocal < 0 || indiceLocal >= totalSlots) continue;
        if (unidadPorIndice.has(indiceLocal)) { for (let j = 0; j < totalSlots; j++) { if (!unidadPorIndice.has(j)) { unidadPorIndice.set(j, u); break; } } }
        else unidadPorIndice.set(indiceLocal, u);
    }
            for (let i = 0; i < totalSlots; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.tipo = lado === 'player' ? 'tablero' : 'enemigo';
        cell.dataset.indice = i;
        cell.dataset.coord = (typeof getCoordenadaCasilla === 'function') ? getCoordenadaCasilla(i, lado) : `${i}`;

        const unidad = unidadPorIndice.get(i) || null;

        if (unidad && !unidad.muerto && unidad.hp > 0) {
            cell.classList.add('has-unit');
            cell.classList.add(unidad.equipo === 'player' ? 'team-player' : 'team-enemy');
            if (unidad.esZacian) cell.classList.add('cost-5');
            else if (unidad.costeOriginal) cell.classList.add('cost-' + unidad.costeOriginal);
            else if (unidad.pokemon && unidad.pokemon.coste) cell.classList.add('cost-' + unidad.pokemon.coste);
            if (unidad.poisonStacks && unidad.poisonStacks.length > 0) cell.classList.add('casilla-veneno');
            if (unidad._quemado || unidad.burnDamage > 0) cell.classList.add('casilla-quemadura');
            const tipoUnidadParaObjetos = (lado === 'player') ? 'tablero' : 'enemigo';
            let objetosHtml = '';
            if (!unidad.esZacian && !unidad.noEquiparObjetos) objetosHtml = renderObjetosEquipados(unidad, tipoUnidadParaObjetos, i, false);
            else if (unidad.esZacian) objetosHtml = renderObjetosEquipados(unidad, tipoUnidadParaObjetos, i, false);
            const objetosContenedor = objetosHtml ? `<div class="objetos-equipados" style="display:flex;gap:4px;justify-content:center;align-items:center;position:relative;width:100%;padding:2px 4px;z-index:3;min-height:26px;margin-top:6px;">${objetosHtml}</div>` : '';
                        cell.innerHTML = `
                ${renderSpriteHtml(unidad, '', unidad.equipo === 'player' ? 'player' : 'enemy')}
                <span class="unit-name ${unidad.esShiny ? 'shiny-name' : ''}">${unidad.pokemon.nombre}</span>
                <div class="unit-traits-left">${unidad.pokemon ? renderTraitsHtml(unidad.pokemon) : ''}</div>
                ${renderHPBar(unidad)}
                ${renderEnergyBar(unidad)}
                ${renderUltiBar(unidad)}
                ${objetosContenedor}
                ${renderEstrellasHtml(unidad.nivel || 1)}
                ${renderBadgeFrontBack(unidad)}
                ${renderEscudoRoto(unidad)}
                ${renderIconoLlamarada(unidad)}
            `;

            // 🔑 Asignar identificador estable y reutilizar el <img> anterior para
            // que el GIF no se reinicie (evita que el sprite parpadee en combate).
            if (unidad._spriteUid === undefined) {
                unidad._spriteUid = (window._spriteUidCounter = (window._spriteUidCounter || 0) + 1);
            }
            const spriteKey = unidad._spriteUid + ':' + (unidad.spriteIdAlternativo || (unidad.pokemon ? unidad.pokemon.spriteId : '')) + ':' + (unidad.esShiny ? 1 : 0);
            cell.dataset.spriteUid = spriteKey;
            const imgPrevio = spritesPrevios.get(spriteKey);
            if (imgPrevio && !imgPrevio.isConnected) {
                imgPrevio.classList.remove('faint-fade-out', 'recall-suck');
                imgPrevio.style.opacity = '';
                imgPrevio.style.filter = '';
                imgPrevio.style.transform = '';
                const imgNuevo = cell.querySelector('.unit-sprite');
                if (imgNuevo) imgNuevo.replaceWith(imgPrevio);
            }
        } else {
            cell.classList.add('vacia');
            cell.innerHTML = '<span style="font-size:1.2rem;opacity:0.15;">▢</span>';
            cell.style.cssText = 'font-size:0.8rem;color:#4a6a8a;background:transparent;border:2px solid #2a3a5a;';
        }
                grid.appendChild(cell);

        // 🆕 FIX: volver a aplicar la zona activa si existe
        if (typeof _zonaActivaEn === 'function') {
            const coords = coordsDesdeIndice(i, lado === 'player' ? 'player' : 'enemy');
            const zona = _zonaActivaEn(coords._filaGlobal, coords._colGlobal);
            if (zona) {
                cell.classList.add('mov-zone-marcada', zona.clase);
                if (zona.parpadeo) {
                    cell.classList.add('mov-zone-parpadeo');
                }
            }
        }
    }
}

function moverUnidad(origenTipo, origenIdx, destinoTipo, destinoIdx) {
    if (combatiendo) {
        if (origenTipo !== 'banquillo' || destinoTipo !== 'banquillo') {
            addConsoleMessage("⛔ Durante el combate solo puedes reorganizar el banquillo.", 'error');
            if (typeof renderizarBanquilloJugadorDuranteCombate === 'function') renderizarBanquilloJugadorDuranteCombate();
            return;
        }
    } else if (!puedeInteractuar()) return;

    const esEnemigo = origenTipo.startsWith('enemigo') || destinoTipo.startsWith('enemigo');
    if (esEnemigo && !window.modoCreativo) { addConsoleMessage('❌ Solo puedes mover enemigos en modo creativo', 'error'); return; }

    const origenJugador = origenTipo === 'tablero' || origenTipo === 'banquillo';
    const destinoJugador = destinoTipo === 'tablero' || destinoTipo === 'banquillo';
    const origenEnemigo = origenTipo === 'enemigo' || origenTipo === 'enemigoBanquillo';
    const destinoEnemigo = destinoTipo === 'enemigo' || destinoTipo === 'enemigoBanquillo';

    if ((origenJugador && destinoEnemigo) || (origenEnemigo && destinoJugador)) { addConsoleMessage('❌ No puedes cruzar unidades entre tableros', 'error'); renderizar(); return; }

    let listaOrigen, listaDestino;
    if (origenTipo === 'tablero') listaOrigen = tablero;
    else if (origenTipo === 'banquillo') listaOrigen = banquillo;
    else if (origenTipo === 'enemigo') listaOrigen = enemyBoard;
    else if (origenTipo === 'enemigoBanquillo') listaOrigen = enemyBanquillo;

    if (destinoTipo === 'tablero') listaDestino = tablero;
    else if (destinoTipo === 'banquillo') listaDestino = banquillo;
    else if (destinoTipo === 'enemigo') listaDestino = enemyBoard;
    else if (destinoTipo === 'enemigoBanquillo') listaDestino = enemyBanquillo;

    let unidadOrigen = listaOrigen[origenIdx];
    let unidadDestino = listaDestino[destinoIdx];

    if (!unidadOrigen) { renderizar(); return; }
    if (unidadOrigen.esZacian && destinoTipo === 'banquillo') { addConsoleMessage(`❌ ¡Zacian no puede moverse al banquillo! Solo puede estar en el tablero.`, 'error'); renderizar(); return; }

    if (!window.modoCreativo && origenTipo === 'banquillo' && destinoTipo === 'tablero' && !unidadDestino) {
        if (tablero.filter(u => u !== null).length >= maxUnidadesTablero()) { addConsoleMessage(`❌ ¡Tablero lleno! Máximo ${maxUnidadesTablero()} unidades (nivel ${nivelJugador})`, 'error'); renderizar(); return; }
    }

    const destinoEsBanco = (destinoTipo === 'banquillo' || destinoTipo === 'enemigoBanquillo');
    const origenEsBanco = (origenTipo === 'banquillo' || origenTipo === 'enemigoBanquillo');
    const ladoOrigen = (origenTipo === 'enemigo' || origenTipo === 'enemigoBanquillo') ? 'enemigo' : 'jugador';
    const ladoDestino = (destinoTipo === 'enemigo' || destinoTipo === 'enemigoBanquillo') ? 'enemigo' : 'jugador';

    if (destinoEsBanco && unidadOrigen.objetos && unidadOrigen.objetos.length > 0) {
        if (typeof autoDevolverObjetosAlBaul === 'function') autoDevolverObjetosAlBaul(unidadOrigen, ladoDestino);
    }
    if (origenEsBanco && unidadDestino && unidadDestino.objetos && unidadDestino.objetos.length > 0) {
        if (typeof autoDevolverObjetosAlBaul === 'function') autoDevolverObjetosAlBaul(unidadDestino, ladoOrigen);
    }

    let unidadDestinoGuardada = unidadDestino;
    listaOrigen[origenIdx] = null;
    listaDestino[destinoIdx] = null;
    listaDestino[destinoIdx] = unidadOrigen;
    listaOrigen[origenIdx] = unidadDestinoGuardada;

    document.querySelectorAll('.selected').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    playButtonSound();

    if (!combatiendo) {
        aplicarSinergias();
        if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
        verificarTodasLasFusiones();
    }

    renderizar();
    if (unidadDestinoGuardada) addConsoleMessage(`🔄 ${unidadOrigen.pokemon.nombre} ↔ ${unidadDestinoGuardada.pokemon.nombre} intercambiados`, 'move');
    else addConsoleMessage(`✅ ${unidadOrigen.pokemon.nombre} movido correctamente`, 'move');
}

function actualizarObjetosVerticales(lado = 'jugador') {
    const esEnemigo = lado === 'enemigo';
    const gridId = esEnemigo ? 'objetosVerticalGridEnemigo' : 'objetosVerticalGrid';
    const lista = esEnemigo ? (typeof enemyBaulObjetos !== 'undefined' ? enemyBaulObjetos : []) : baulObjetos;
    const colorBorde = esEnemigo ? '#ef4444' : '#fbbf24';
    const colorBg = esEnemigo ? 'rgba(239, 68, 68, 0.08)' : 'rgba(251, 191, 36, 0.08)';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    const maxSlots = 8;
    for (let i = 0; i < maxSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'objeto-slot-vertical';
        slot.dataset.index = i;
        slot.style.cssText = `width:44px;height:44px;min-width:44px;min-height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:2px;box-sizing:border-box;overflow:hidden;transition:all 0.3s ease;border:2px solid #2a3a5a;background:rgba(0,0,0,0.2);color:#4a6a8a;font-size:0.8rem;cursor:default;`;
        if (i < lista.length) {
            const nombre = lista[i];
            const objeto = OBJETOS[nombre];
            slot.style.border = `2px solid ${colorBorde}`;
            slot.style.background = colorBg;
            slot.style.cursor = 'pointer';
            slot.style.color = '#ffffff';
            let imagenUrl = '';
            if (objeto && objeto.emoji && objeto.emoji.includes('.png')) imagenUrl = objeto.emoji;
            if (imagenUrl) {
                slot.style.backgroundImage = `url('${imagenUrl}')`;
                slot.style.backgroundSize = 'contain';
                slot.style.backgroundPosition = 'center';
                slot.style.backgroundRepeat = 'no-repeat';
                slot.innerHTML = '';
            } else {
                slot.innerHTML = objeto ? objeto.emoji || '📦' : '📦';
                slot.style.fontSize = '1.4rem';
                slot.style.lineHeight = '1';
                slot.style.textAlign = 'center';
            }
            slot.dataset.objetoNombre = nombre;
            slot.onclick = function (e) {
                e.stopPropagation();
                if (combatiendo) { addConsoleMessage('⛔ No puedes equipar objetos durante el combate!', 'error'); return; }
                const idx = parseInt(this.dataset.index);
                const ladoObjeto = esEnemigo ? 'enemigo' : 'jugador';
                if (objetoSeleccionado && objetoSeleccionado.index === idx && objetoSeleccionado.lado === ladoObjeto) {
                    objetoSeleccionado = null;
                    actualizarObjetosVerticales(lado);
                    addConsoleMessage(`🔓 Objeto ${esEnemigo ? 'enemigo ' : ''}deseleccionado`, 'info');
                    return;
                }
                objetoSeleccionado = { index: idx, nombre: lista[idx], lado: ladoObjeto };
                actualizarObjetosVerticales(lado);
                addConsoleMessage(`🔍 Seleccionado "${lista[idx]}" (${esEnemigo ? 'ENEMIGO' : 'JUGADOR'}). Haz clic en un Pokémon ${esEnemigo ? 'enemigo' : 'aliado'} para equiparlo.`, 'info');
            };
            if (objetoSeleccionado && objetoSeleccionado.index === i && objetoSeleccionado.lado === (esEnemigo ? 'enemigo' : 'jugador')) slot.style.border = '3px solid #4ade80';
            if (typeof engancharDragObjeto === 'function') engancharDragObjeto(slot, nombre, lado, i);
        } else slot.innerHTML = '▢';
        grid.appendChild(slot);
    }
}

function actualizarObjetosVerticalesEnemigo() { actualizarObjetosVerticales('enemigo'); }
function renderizarBanquilloJugadorDuranteCombate() { renderizarBanquilloJugador(); }

function equiparObjetoAEnemigo(indexBaul, tipoUnidad, idxUnidad) {
    if (combatiendo) { addConsoleMessage('⛔ No puedes equipar objetos durante el combate', 'error'); return; }
    if (typeof enemyBaulObjetos === 'undefined' || indexBaul >= enemyBaulObjetos.length) { addConsoleMessage('❌ Objeto no encontrado en el baúl enemigo', 'error'); return; }
    const nombreObjeto = enemyBaulObjetos[indexBaul];
    let unidad = tipoUnidad === 'enemigo' ? enemyBoard[idxUnidad] : enemyBanquillo[idxUnidad];
    if (!unidad) { addConsoleMessage('❌ No hay unidad enemiga en esa posición', 'error'); return; }
    if (unidad.esZacian || unidad.noEquiparObjetos) { addConsoleMessage(`❌ Zacian no puede equipar objetos manualmente!`, 'error'); return; }
    if (typeof aplicarObjeto === 'function') {
        if (aplicarObjeto(unidad, nombreObjeto)) {
            enemyBaulObjetos.splice(indexBaul, 1);
            objetoSeleccionado = null;
            addConsoleMessage(`✅ ${nombreObjeto} equipado a ${unidad.pokemon.nombre} (ENEMIGO)`, 'success');
            if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
            if (typeof renderizar === 'function') renderizar();
            if (typeof actualizarObjetosVerticalesEnemigo === 'function') actualizarObjetosVerticalesEnemigo();
        }
    }
}

function actualizarEscudoVisual(unidad) {
    if (!unidad) return;
    const pos = (typeof obtenerPosicionUnidadActual === 'function') ? obtenerPosicionUnidadActual(unidad) : null;
    if (!pos || !pos.elemento) return;
    const barraHP = pos.elemento.querySelector('.unit-hp-bar');
    if (!barraHP) return;
    const maxHp = unidad.maxHp || 1;
    const hpActual = Math.max(0, unidad.hp || 0);
    const escudo = Math.max(0, unidad.escudoActual || 0);
    const hpPercent = Math.min(100, (hpActual / maxHp) * 100);
    const escudoPercent = Math.min(100 - hpPercent, (escudo / maxHp) * 100);
    let escudoEl = barraHP.querySelector('.hp-shield');
    if (escudo > 0 && escudoPercent > 0) {
        if (!escudoEl) {
            escudoEl = document.createElement('div');
            escudoEl.className = 'hp-shield';
            const segments = barraHP.querySelector('.hp-segments');
            if (segments) barraHP.insertBefore(escudoEl, segments);
            else barraHP.appendChild(escudoEl);
        }
        escudoEl.style.left = hpPercent + '%';
        escudoEl.style.width = escudoPercent + '%';
    } else {
        if (escudoEl) escudoEl.remove();
    }
}

// 🆕 ACTUALIZAR INFO JUGADOR
function actualizarInfoJugador() {
    const enTablero = tablero.filter(u => u !== null).length;
    const maxEnTablero = maxUnidadesTablero();

    const playerBoardCount = document.getElementById('playerBoardCount');
    const playerBoardMax = document.getElementById('playerBoardMax');
    if (playerBoardCount) playerBoardCount.textContent = enTablero;
    if (playerBoardMax) playerBoardMax.textContent = maxEnTablero;

    const capsule = document.getElementById('bankCapsulePlayer');
    if (capsule) {
        capsule.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div');
            ball.className = 'p-ball' + (i < enTablero ? ' filled' : '');
            capsule.appendChild(ball);
        }
    }

    const header = document.getElementById('bankHeaderPlayer');
    if (header) {
        header.classList.toggle('is-full', enTablero >= maxEnTablero);
    }

    const hpDisplay = document.getElementById("playerHealthDisplay");
    if (hpDisplay) hpDisplay.innerHTML = `${vidaJugador}`;

    const oroBtn = document.getElementById('tiendaOroBtn');
    if (oroBtn) oroBtn.textContent = oro;

    const playerStreakEl = document.getElementById('playerStreakInfo');
    const playerStreakIconEl = document.getElementById('playerStreakIcon');
    const playerStreakValEl = document.getElementById('playerStreakValueInfo');
    if (playerStreakEl && playerStreakIconEl && playerStreakValEl) {
        let icono = '🤝', clase = 'racha-cero', texto = '0';
        if (racha > 0) { icono = '🏆'; clase = 'racha-positiva'; texto = `+${racha}`; }
        else if (racha < 0) { icono = '💀'; clase = 'racha-negativa'; texto = `${racha}`; }
        playerStreakIconEl.textContent = icono;
        playerStreakValEl.textContent = texto;
        playerStreakEl.classList.remove('racha-positiva', 'racha-negativa', 'racha-cero');
        playerStreakEl.classList.add(clase);
    }

    actualizarExpBar();
    const levelDisplay = document.getElementById("levelNumber");
    if (levelDisplay) levelDisplay.innerHTML = nivelJugador;
    updateShopChances();
    actualizarBotonVenderCarta();

    const playerHealthDisplayInfo = document.getElementById("playerHealthDisplayInfo");
    if (playerHealthDisplayInfo) playerHealthDisplayInfo.innerHTML = `${vidaJugador}`;

        const playerHealthBarInfo = document.getElementById("playerHealthBarInfo");
    if (playerHealthBarInfo) {
        // 🆕 FIX: usar la vida MÁXIMA del jugador (50), no 100 hardcodeado.
        // Antes con 50 HP iniciales la barra arrancaba al 50%.
        const vidaMaxJugador = (typeof CONFIG !== 'undefined' && CONFIG.VIDA_MAX_JUGADOR) ? CONFIG.VIDA_MAX_JUGADOR : 50;
        const porcentajeHP = Math.max(0, Math.min(100, (vidaJugador / vidaMaxJugador) * 100));
        playerHealthBarInfo.style.width = `${porcentajeHP}%`;
    }

    const playerLevelInfo = document.getElementById("playerLevelInfo");
    if (playerLevelInfo) playerLevelInfo.textContent = nivelJugador;

    const playerGoldInfo = document.getElementById("playerGoldInfo");
    if (playerGoldInfo) playerGoldInfo.textContent = oro;

    // 🛒 Oro dentro de la tienda (la barra de acciones queda tapada en móvil)
    const tiendaOroEl = document.getElementById('tiendaOro');
    if (tiendaOroEl) tiendaOroEl.textContent = oro;

    const enemyLevelNumberCheck = document.getElementById("enemyLevelNumber");
    if (enemyLevelNumberCheck && typeof enemyLevel !== 'undefined') enemyLevelNumberCheck.textContent = enemyLevel;

    const playerNameEl = document.getElementById("playerName");
    const playerAvatarEl = document.getElementById("playerAvatar");
    let nombreMostrar = (typeof window.nombreJugador !== 'undefined' && window.nombreJugador) ? window.nombreJugador : "Entrenador";
    let avatarMostrar = (typeof window.avatarJugador !== 'undefined' && window.avatarJugador) ? window.avatarJugador : "rojo";
    let carpetaMostrar = 'jugador';

    if (typeof window._identidadJugador === 'function') {
        const ident = window._identidadJugador('player');
        nombreMostrar = ident.nombre;
        avatarMostrar = ident.avatar;
        carpetaMostrar = ident.carpeta;
    }

    if (playerNameEl) playerNameEl.textContent = nombreMostrar;

        if (playerAvatarEl) {
        const srcNuevo = `assets/avatars/${carpetaMostrar}/${avatarMostrar}.png`;
        const imgActual = playerAvatarEl.querySelector('img');
        if (!imgActual) {
            const img = document.createElement('img');
            img.src = srcNuevo;
            img.alt = "Avatar";
            img.onerror = function() { this.style.display = 'none'; if (!playerAvatarEl.textContent.trim()) playerAvatarEl.textContent = '🧢'; };
            playerAvatarEl.innerHTML = '';
            playerAvatarEl.appendChild(img);
        } else if (!imgActual.getAttribute('src').endsWith(`/${avatarMostrar}.png`)) {
            imgActual.src = srcNuevo;
            imgActual.style.display = 'block';
        }
    }

    // 🆕 FIX: refrescar el ranking del torneo cada vez que cambia el panel del jugador.
    // Esto cubre subidas de nivel desde +4 XP, desde la tienda, o cualquier otra vía.
    if (typeof actualizarRankingTorneo === 'function') {
        try { actualizarRankingTorneo(); } catch (e) {}
    }
}

// 🆕 ACTUALIZAR INFO ENEMIGO
function actualizarInfoEnemigo() {
    // ============================================================
    // 🆕 FIX PvE: si es ronda PvE, mostrar datos del monstruo
    // ============================================================
    if (window.rivalActual && window.rivalActual.esMonstruo) {
        const enemyNameEl = document.getElementById("enemyName");
        const enemyAvatarEl = document.getElementById("enemyAvatar");
        const enemyHealthDisplayInfo = document.getElementById("enemyHealthDisplayInfo");
        const enemyHealthBarInfo = document.getElementById("enemyHealthBarInfo");

        if (enemyNameEl) enemyNameEl.textContent = window.rivalActual.nombre;

        // Avatar: usar el sprite del monstruo
        if (enemyAvatarEl) {
            const primerMonstruo = enemyBoard.find(u => u && u.esMonstruo);
            if (primerMonstruo) {
                const srcSprite = typeof getSpriteUrl === 'function'
                    ? getSpriteUrl(primerMonstruo.pokemon.spriteId, primerMonstruo.pokemon.nombre)
                    : '';
                if (srcSprite) {
                    const imgActual = enemyAvatarEl.querySelector('img');
                    if (!imgActual || !imgActual.src.includes(String(primerMonstruo.pokemon.spriteId))) {
                        enemyAvatarEl.innerHTML = '';
                        const img = document.createElement('img');
                        img.src = srcSprite;
                        img.alt = primerMonstruo.pokemon.nombre;
                        img.onerror = function () { this.style.display = 'none'; enemyAvatarEl.textContent = '👾'; };
                        enemyAvatarEl.appendChild(img);
                    }
                } else {
                    enemyAvatarEl.textContent = '👾';
                }
            } else {
                enemyAvatarEl.textContent = '👾';
            }
        }

                // El monstruo no tiene HP de torneo → mostrar ∞
        if (enemyHealthDisplayInfo) enemyHealthDisplayInfo.textContent = '∞';
        if (enemyHealthBarInfo) {
            // 🆕 FIX: forzar width 0 antes de ocultar el contenedor.
            // Si no, al volver a PvP la barra hereda un width inválido
            // (200%) y se ve como si el rival tuviera 100 HP.
            enemyHealthBarInfo.style.width = '0%';
            const contenedorBarra = enemyHealthBarInfo.parentElement;
            if (contenedorBarra) contenedorBarra.style.display = 'none';
        }

        // Ocultar racha del monstruo
        const enemyStreakEl = document.getElementById('enemyStreakInfo');
        if (enemyStreakEl) enemyStreakEl.style.display = 'none';

        // Nivel del monstruo: 1 siempre
        const enemyLevelInfo = document.getElementById('enemyLevelInfo');
        if (enemyLevelInfo) enemyLevelInfo.textContent = '1';

        const enemyGoldInfo = document.getElementById('enemyGoldInfo');
        if (enemyGoldInfo) enemyGoldInfo.textContent = '∞';

        // Contador del banco enemigo: vacío (el monstruo no tiene banco)
        const enemyBoardCount = document.getElementById('enemyBoardCount');
        const enemyBoardMax = document.getElementById('enemyBoardMax');
        const monstruosVivos = enemyBoard.filter(u => u && u.esMonstruo).length;
        if (enemyBoardCount) enemyBoardCount.textContent = monstruosVivos;
        if (enemyBoardMax) enemyBoardMax.textContent = monstruosVivos;

        // 🎯 FIX: en PvE el contador siempre está "lleno" (vivos == total),
        // así el número sale en blanco y no en naranja.
        const headerEnemy = document.getElementById('bankHeaderEnemy');
        if (headerEnemy) headerEnemy.classList.add('is-full');

        return;  // No ejecutar la lógica PvP normal
    }

        // ============================================================
    // Lógica PvP normal
    // ============================================================
    // Restaurar visibilidad de la barra de vida y racha por si
    // venimos de una ronda PvE anterior
    // 🆕 FIX: reutilizamos la variable ya declarada en el bloque PvE
    // (declarada con `const` al inicio de la función).
    const enemyHealthBarInfoPvP = document.getElementById("enemyHealthBarInfo");
    if (enemyHealthBarInfoPvP) {
        const contenedorBarra = enemyHealthBarInfoPvP.parentElement;
        if (contenedorBarra) contenedorBarra.style.display = '';
    }
    const enemyStreakEl = document.getElementById('enemyStreakInfo');
    if (enemyStreakEl) enemyStreakEl.style.display = '';

    const enTableroEnemy = enemyBoard.filter(u => u !== null).length;
    const maxEnTableroEnemy = maxEnemyUnits();

    const enemyBoardCount = document.getElementById('enemyBoardCount');
    const enemyBoardMax = document.getElementById('enemyBoardMax');
    if (enemyBoardCount) enemyBoardCount.textContent = enTableroEnemy;
    if (enemyBoardMax) enemyBoardMax.textContent = maxEnTableroEnemy;

    const capsuleEnemy = document.getElementById('bankCapsuleEnemy');
    if (capsuleEnemy) {
        capsuleEnemy.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div');
            ball.className = 'p-ball' + (i < enTableroEnemy ? ' filled' : '');
            capsuleEnemy.appendChild(ball);
        }
    }

    const headerEnemy = document.getElementById('bankHeaderEnemy');
    if (headerEnemy) {
        headerEnemy.classList.toggle('is-full', enTableroEnemy >= maxEnTableroEnemy);
    }

    const enemyHealthDisplay = document.getElementById("enemyHealthDisplay");
    if (enemyHealthDisplay) enemyHealthDisplay.innerHTML = `${Math.max(0, enemyHealth)}`;
    const enemyGoldValue = document.getElementById("enemyGoldValue");
    if (enemyGoldValue) enemyGoldValue.textContent = enemyGold;
    const enemyLevelNumber = document.getElementById("enemyLevelNumber");
    if (enemyLevelNumber) enemyLevelNumber.textContent = enemyLevel;

    const enemyHealthDisplayInfo = document.getElementById("enemyHealthDisplayInfo");
    if (enemyHealthDisplayInfo) enemyHealthDisplayInfo.innerHTML = `${Math.max(0, enemyHealth)}`;

                        if (enemyHealthBarInfoPvP) {
        // 🆕 FIX: usar la vida MÁXIMA del enemigo (50), no 100 hardcodeado.
        const vidaMaxEnemigo = (typeof CONFIG !== 'undefined' && CONFIG.VIDA_MAX_JUGADOR) ? CONFIG.VIDA_MAX_JUGADOR : 50;
        const porcentajeHP = Math.max(0, Math.min(100, (enemyHealth / vidaMaxEnemigo) * 100));
        enemyHealthBarInfoPvP.style.width = `${porcentajeHP}%`;
    }

    const enemyLevelInfo = document.getElementById("enemyLevelInfo");
    if (enemyLevelInfo) enemyLevelInfo.textContent = enemyLevel;

    const enemyGoldInfo = document.getElementById("enemyGoldInfo");
    if (enemyGoldInfo) enemyGoldInfo.textContent = enemyGold;

    if (window.modoDosJugadores && typeof window._identidadJugador === 'function') {
        const ident = window._identidadJugador('enemy');
        const enemyNameEl = document.getElementById("enemyName");
        const enemyAvatarEl = document.getElementById("enemyAvatar");
        if (enemyNameEl) enemyNameEl.textContent = ident.nombre;
        if (enemyAvatarEl) {
            const srcNuevo = `assets/avatars/${ident.carpeta}/${ident.avatar}.png`;
            const imgActual = enemyAvatarEl.querySelector('img');
            if (!imgActual) {
                const img = document.createElement('img');
                img.src = srcNuevo;
                img.alt = ident.nombre;
                img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
                enemyAvatarEl.innerHTML = '';
                enemyAvatarEl.appendChild(img);
            } else if (!imgActual.getAttribute('src').endsWith(`/${ident.avatar}.png`)) {
                imgActual.src = srcNuevo;
                imgActual.style.display = 'block';
            }
        }
    }

        // 🆕 FIX: reutilizamos enemyStreakEl ya declarada arriba
    const enemyStreakIconEl = document.getElementById('enemyStreakIcon');
    const enemyStreakValEl = document.getElementById('enemyStreakValueInfo');
    if (enemyStreakEl && enemyStreakIconEl && enemyStreakValEl) {
        let rachaEnemigo = window.modoDosJugadores ? -racha : (enemyWinStreak || 0) - (enemyLossStreak || 0);
        let iconoEnemigo = '🤝', claseEnemigo = 'racha-cero', textoEnemigo = '0';
        if (rachaEnemigo > 0) { iconoEnemigo = '🏆'; claseEnemigo = 'racha-positiva'; textoEnemigo = `+${rachaEnemigo}`; }
        else if (rachaEnemigo < 0) { iconoEnemigo = '💀'; claseEnemigo = 'racha-negativa'; textoEnemigo = `${rachaEnemigo}`; }
        enemyStreakIconEl.textContent = iconoEnemigo;
        enemyStreakValEl.textContent = textoEnemigo;
        enemyStreakEl.classList.remove('racha-positiva', 'racha-negativa', 'racha-cero');
        enemyStreakEl.classList.add(claseEnemigo);
    }
}

function actualizarExpBar() {
    let coste = getExpNecesaria();
    let porcentaje = coste > 0 ? (experiencia / coste) * 100 : 100;
    const expBarFill = document.getElementById("expBarFill");
    if (expBarFill) expBarFill.style.width = `${porcentaje}%`;
    const expActual = document.getElementById("expActual");
    if (expActual) expActual.textContent = experiencia;
    const expMax = document.getElementById("expMax");
    if (expMax) expMax.textContent = coste;
    const levelNumber = document.getElementById("levelNumber");
    if (levelNumber) levelNumber.textContent = nivelJugador;
}

function updateShopChances() {
    let odds = SHOP_ODDS[nivelJugador] || SHOP_ODDS[8];
    const porcentajes = { 1: Math.round(odds[1] * 100), 2: Math.round(odds[2] * 100), 3: Math.round(odds[3] * 100), 4: Math.round(odds[4] * 100), 5: Math.round(odds[5] * 100) };
    const chance1 = document.getElementById('tiendaChance1'); if (chance1) chance1.textContent = porcentajes[1] + '%';
    const chance2 = document.getElementById('tiendaChance2'); if (chance2) chance2.textContent = porcentajes[2] + '%';
    const chance3 = document.getElementById('tiendaChance3'); if (chance3) chance3.textContent = porcentajes[3] + '%';
    const chance4 = document.getElementById('tiendaChance4'); if (chance4) chance4.textContent = porcentajes[4] + '%';
    const chance5 = document.getElementById('tiendaChance5'); if (chance5) chance5.textContent = porcentajes[5] + '%';
}

// EXPONER GLOBALMENTE
window.equiparObjetoAEnemigo = equiparObjetoAEnemigo;
window.renderizarTablero = renderizarTablero;
window.renderizarBanquilloJugadorDuranteCombate = renderizarBanquilloJugadorDuranteCombate;
window.obtenerRangoAtaque = obtenerRangoAtaque;
window.calcularDistanciaCasillas = calcularDistanciaCasillas;
window.calcularDistanciaEntreTableros = calcularDistanciaEntreTableros;
window.estaEnRango = estaEnRango;
window.estaEnRangoEntreTableros = estaEnRangoEntreTableros;
window.getSpriteUrlOriginal = getSpriteUrlOriginal;
window.actualizarObjetosVerticales = actualizarObjetosVerticales;
window.actualizarObjetosVerticalesEnemigo = actualizarObjetosVerticalesEnemigo;
window.renderizarTableroJugador = renderizarTableroJugador;
window.renderizarBanquilloJugador = renderizarBanquilloJugador;
window.renderizarTableroEnemigo = renderizarTableroEnemigo;
window.renderizarBanquilloEnemigo = renderizarBanquilloEnemigo;
window.actualizarFrostStacksVisual = actualizarFrostStacksVisual;
window.actualizarShockStacksVisual = actualizarShockStacksVisual;
window.actualizarEscudoVisual = actualizarEscudoVisual;
window.actualizarInfoJugador = actualizarInfoJugador;
window.actualizarInfoEnemigo = actualizarInfoEnemigo;
// ============================================================
// 🆕 ICONO DE ESCUDO ROTO (Defensa reducida)
// ============================================================
function renderEscudoRoto(unidad) {
    if (!unidad) return '';

    const ahora = performance.now();
    const tieneFisico = unidad._debuffDefFisica && unidad._debuffDefFisicaFin > ahora;
    const tieneEspecial = unidad._debuffDefEsp && unidad._debuffDefEspFin > ahora;

    if (!tieneFisico && !tieneEspecial) return '';

    let color = '#ef4444';
    if (tieneFisico && tieneEspecial) color = '#a855f7';
    else if (tieneEspecial) color = '#a855f7';

        return `
        <div class="icon-def-down-render" style="
            position: absolute;
            top: 24px;
            right: 4px;
            width: 24px;
            height: 24px;
            pointer-events: none;
            z-index: 5;
            filter: drop-shadow(0 0 5px ${color});
            animation: pulseEscudoRoto 1.2s ease-in-out infinite;
        ">
            <img src="assets/icons/efectos/escudo-roto.png"
                 alt="defensa reducida"
                 draggable="false"
                 style="width:100%;height:100%;object-fit:contain;display:block;"
                 onerror="this.style.display='none';this.parentElement.textContent='🛡️';this.parentElement.style.fontSize='18px';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';this.parentElement.style.color='${color}';">
        </div>
    `;
}

window.renderEscudoRoto = renderEscudoRoto;

(function agregarKeyframeEscudoRoto() {
    if (document.getElementById('keyframe-escudo-roto')) return;
    const style = document.createElement('style');
    style.id = 'keyframe-escudo-roto';
    style.textContent = `
        @keyframes pulseEscudoRoto {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50%      { transform: scale(1.15); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================================
// 🆕 ICONO DE LLAMARADA PERSISTENTE (4s)
// ============================================================
function renderIconoLlamarada(unidad) {
    if (!unidad) return '';

    const ahora = performance.now();
    if (!unidad._iconoLlamaradaFin || unidad._iconoLlamaradaFin <= ahora) return '';

    const iconoHtml = (typeof getIconoMovimientoHtml === 'function')
        ? getIconoMovimientoHtml('Llamarada', 28)
        : '🔥';

    return `
        <div class="icon-llamarada-render" style="
            position: absolute;
            bottom: 22px;
            right: 6px;
            width: 28px;
            height: 28px;
            pointer-events: none;
            z-index: 70;
            filter: drop-shadow(0 0 5px rgba(251, 146, 60, 1));
            animation: pulseLlamarada 0.9s ease-in-out infinite;
            line-height: 1;
        ">
            ${iconoHtml}
        </div>
    `;
}

window.renderIconoLlamarada = renderIconoLlamarada;

(function agregarKeyframeLlamarada() {
    if (document.getElementById('keyframe-llamarada')) return;
    const style = document.createElement('style');
    style.id = 'keyframe-llamarada';
    style.textContent = `
        @keyframes pulseLlamarada {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50%      { transform: scale(1.15); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();
