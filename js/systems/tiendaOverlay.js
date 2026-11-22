// ============================================================
// TIENDA INDEPENDIENTE - v7.2 (FIX CANDADO)
// ============================================================
// v7.2:
//   - FIX: el botón de candado (#btnLockShopTienda) ahora se
//     clona y se le asigna un listener limpio. Antes podía
//     quedar sin listener si initTiendaIndependiente() se
//     llamaba más de una vez.
//   - FIX: logs de diagnóstico en el click del candado.
//
// v7.1:
//   - FIX: comprarDesdeTiendaIndependiente() distingue entre
//     compra normal y compra que fusiona. El bloque de fusión
//     está envuelto en `if (esFusion) { ... }`.
//   - FIX: si el banquillo está lleno, busca hueco en el tablero.
//     Si tampoco hay, fuerza una casilla temporal que la fusión
//     consumirá. Nunca se vende nada.
//   - FIX: si la fusión no se completa, la copia se devuelve al
//     pool y se reembolsa el oro.
//
// v7.0:
//   - abrirTienda() es async.
//   - Si hay un shiny NUEVO en la tienda, se reproduce
//     animarShinyTienda() ANTES de abrir la tienda normal.
//   - El sonido shiny lo reproduce animarShinyTienda().
// ============================================================

let tiendaAbierta = false;
let tiendaActualizada = false;
let modoTiendaObjetos = false;
let baulPanelAbierto = false;
let tiendaRonda2Comprada = false;
let rerollObjetosRonda3Usado = false;

// 🔊 SHINY: flag para que la animación/sonido solo ocurra 1 vez por tienda
let _shinyYaSonadoEstaTienda = false;

// ============================================================
// ===== ABRIR TIENDA =====
// ============================================================

async function abrirTienda(mostrarObjetos = false) {
    const overlay = document.getElementById('tiendaOverlay');
    if (!overlay) {
        console.error('❌ No se encontró #tiendaOverlay');
        return;
    }

    if (combatiendo) {
        addConsoleMessage('⛔ No puedes abrir la tienda durante el combate!', 'error');
        return;
    }

    if (fase <= 1) {
        addConsoleMessage('🛒 No hay tienda disponible en ronda 1', 'info');
        return;
    }

    if (fase === 2 && tiendaRonda2Comprada && !modoTiendaObjetos) {
        addConsoleMessage('🛒 Ya compraste tu pokémon. La tienda vuelve en la ronda 3.', 'info');
        return;
    }

    if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto) {
        if (typeof cerrarPanelDatosCombate === 'function') cerrarPanelDatosCombate();
    }
    if (typeof cartaAbierta !== 'undefined' && cartaAbierta) {
        if (typeof cerrarCarta === 'function') cerrarCarta();
    }

    if (window.DEBUG) console.log(`🛒 abrirTienda(mostrarObjetos=${mostrarObjetos})`);

    // Preparar tienda de Pokémon
    if (!tiendaBloqueada) {
        if (!tienda || tienda.length === 0 || (fase >= 3 && tienda.length < 4)) {
            generarTienda();
            _shinyYaSonadoEstaTienda = false;
        }
    } else if (!tienda || tienda.length === 0) {
        tienda = [];
        let numPokemon = (fase === 2) ? 3 : 4;
        for (let i = 0; i < numPokemon; i++) {
            tienda.push(getRandomPokemonPorNivel());
        }
        _shinyYaSonadoEstaTienda = false;
    }

    // ============================================================
    // DECIDIR MODO (objetos o pokémon)
    // ============================================================
    const esRondaObjetos = debeAparecerTiendaObjetos(ronda);
    let hayObjetos = objetosEnTienda && objetosEnTienda.length > 0;
    let yaCompro = objetoCompradoEstaRonda;

    if (esRondaObjetos && !hayObjetos && !yaCompro) {
        objetosEnTienda = generarObjetosTienda();
        hayObjetos = objetosEnTienda && objetosEnTienda.length > 0;
    }

    let usarModoObjetos = false;
    if (mostrarObjetos) usarModoObjetos = true;
    else if (esRondaObjetos && hayObjetos && !yaCompro) usarModoObjetos = true;

    modoTiendaObjetos = usarModoObjetos;


    // ============================================================
    // Validar el grid ANTES de mostrar el overlay
    // ============================================================
    const grid = document.getElementById('tiendaGridTienda');
    if (!grid) {
        console.error('❌ No se encontró #tiendaGridTienda');
        addConsoleMessage('❌ Error: no se encontró el grid de la tienda. Contacta con soporte.', 'error');
        return;
    }

    // ============================================================
// ANIMACIÓN DE SHINY AL ABRIR LA TIENDA (EN PARALELO)
// ============================================================
// 🆕 La animación shiny NO bloquea la apertura de la tienda.
//    La tienda se abre YA y el overlay shiny se muestra encima.
//    Cuando la animación termina, la tienda ya está ahí.
// ============================================================
let pokemonShinyNuevo = null;
if (!usarModoObjetos && tienda && tienda.some(p => p && p.shiny)) {
    if (!_shinyYaSonadoEstaTienda) {
        _shinyYaSonadoEstaTienda = true;
        pokemonShinyNuevo = tienda.find(p => p && p.shiny);
    } else {
        console.log('🔇 Animación shiny ya reproducida para esta tienda');
    }
}

    // ============================================================
    // Mostrar overlay SOLO si el grid existe
    // ============================================================
    tiendaAbierta = true;
    overlay.style.display = 'flex';
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('tienda-abierta');

    if (usarModoObjetos) {
        document.body.classList.add('modo-objetos');
    } else {
        document.body.classList.remove('modo-objetos');
    }

    posicionarTienda();
    actualizarInfoTienda();

    // ============================================================
    // PINTAR DIRECTAMENTE
    // ============================================================
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gap = '0';
    grid.style.margin = '14px 0 16px';
    grid.style.width = '100%';
    grid.style.gridTemplateColumns = '';
    grid.style.maxWidth = '';

    if (usarModoObjetos) {
        // ====================================================
        // PINTAR OBJETOS
        // ====================================================
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '20px';
        grid.style.maxWidth = '820px';
        grid.style.margin = '14px auto 16px';

        // Banner: título + info de la ronda de objetos (sin fondo azul)
        const banner = document.createElement('div');
        banner.className = 'objeto-banner';
        banner.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 10px; color: #fbbf24; font-size: 0.9rem;';
        banner.innerHTML = `
            <div class="objeto-banner-title" style="font-size: 1.45rem; margin-bottom: 6px; font-weight: 800;">🎁 ¡Ronda de OBJETOS!</div>
            <div class="objeto-banner-sub" style="font-size: 0.8rem; color: #93c5fd;">Elige 1 objeto GRATIS para tu equipo</div>
            <div class="objeto-banner-note" style="font-size: 0.68rem; color: #6b8aaa; margin-top: 5px;">(Solo puedes comprar 1 objeto por ronda)</div>
        `;
        grid.appendChild(banner);

                // ============================================================
        // REROLL GRATIS DE OBJETOS — botón FIJO junto al avatar en la barra de
        // acciones (visible solo en modo objetos). Aquí solo actualizamos su
        // estado (activo / ya usado).
        // ============================================================
        const btnRerollObj = document.getElementById('btnRerollObjetos');
        if (btnRerollObj) {
            if (rerollObjetosRonda3Usado) {
                btnRerollObj.disabled = true;
                btnRerollObj.textContent = 'Reroll 0/1';
            } else {
                btnRerollObj.disabled = false;
                btnRerollObj.textContent = 'Reroll 1/1';
            }
        }

        objetosEnTienda.forEach((nombre) => {
            const obj = OBJETOS[nombre];
            if (!obj) return;

            const card = document.createElement('div');
            card.className = 'objeto-card';

            let iconoHtml = '';
            if (obj.emoji && obj.emoji.includes('.png')) {
                iconoHtml = `<img src="${obj.emoji}" class="objeto-icon" alt="${nombre}">`;
            } else {
                iconoHtml = `<span class="objeto-emoji">${obj.emoji || '📦'}</span>`;
            }

            card.innerHTML = `
                <div class="objeto-icon-wrap">${iconoHtml}</div>
                <div class="objeto-nombre">${nombre}</div>
                <div class="objeto-desc">${obj.descripcion || ''}</div>
                ${obj.requerido ? `<div class="objeto-requerido">🔒 Requiere: ${obj.requerido}</div>` : ''}
                <div class="objeto-gratis">✅ GRATIS</div>
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                comprarObjetoDesdeTienda(nombre);
            });

            grid.appendChild(card);
        });


    } else {
        // ====================================================
        // PINTAR POKÉMON
        // ====================================================

        const disponibles = tienda.filter(p => p !== null).length;

        const esTiendaRonda2 = (fase === 2 && !tiendaRonda2Comprada);

        if (esTiendaRonda2) {
            grid.style.gridTemplateColumns = '1fr';

            const wrapper = document.createElement('div');
            wrapper.id = 'tiendaWrapper';
            wrapper.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                width: 100%;
                justify-items: center;
            `;

            for (let idx = 0; idx < tienda.length; idx++) {
                const card = crearCartaTienda(tienda[idx], idx);
                wrapper.appendChild(card);
            }

            grid.appendChild(wrapper);
        } else {
            grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            grid.style.gap = '16px';

            for (let idx = 0; idx < tienda.length; idx++) {
                const card = crearCartaTienda(tienda[idx], idx);
                grid.appendChild(card);
            }
        }
    }

    actualizarBotonReroll();
    actualizarBotonCandado();
    actualizarInfoTienda();

    playButtonSound();

        if (usarModoObjetos) {
        addConsoleMessage(`📦 ¡TIENDA DE OBJETOS! (Ronda ${ronda}) - Compra 1 objeto GRATIS`, 'shop-objetos');
    } else {
        const disponibles = tienda ? tienda.filter(p => p !== null).length : 0;
        const estado = tiendaBloqueada ? '🔒 BLOQUEADA' : '🔓 LIBRE';
        addConsoleMessage(`🛒 Tienda de Pokémon abierta (${disponibles} disponibles) - ${estado}`, 'shop');
    }

    // ============================================================
    // 🆕 SHINY EN PARALELO + MÚSICA
    // ============================================================
    // La tienda ya está visible y pintada. Ahora:
    //   - Si hay shiny nuevo → lanzar animación (ella misma pausa
    //     y reanuda la música con el contador del gestor).
    //   - Si NO hay shiny → reanudar música YA (con el contador).
    // ============================================================
    if (pokemonShinyNuevo && typeof animarShinyTienda === 'function') {
        animarShinyTienda(pokemonShinyNuevo).catch(e => {
            console.warn('⚠️ Error en animarShinyTienda (paralelo):', e);
            if (typeof reanudarMusicaPreparacion === 'function') {
                reanudarMusicaPreparacion();
            }
        });
        console.log(`✨ Shiny ${pokemonShinyNuevo.nombre} animándose en paralelo (tienda ya abierta)`);
    } else {
        if (typeof reanudarMusicaPreparacion === 'function') {
            reanudarMusicaPreparacion();
        } else if (typeof reanudarFondoPreparacion === 'function') {
            reanudarFondoPreparacion();
        }
        if (window.DEBUG) console.log('🎵 Música de preparación REANUDADA (abrirTienda sin shiny)');
    }
}

// ============================================================
// ===== POSICIONAR TIENDA =====
// ============================================================

function posicionarTienda() {
    const playerBoard = document.querySelector('.board-wrapper-player');
    const enemyBoard = document.querySelector('.board-wrapper-enemy');
    const modal = document.querySelector('.tienda-modal');
    if (!playerBoard || !enemyBoard || !modal) return;

    const pRect = playerBoard.getBoundingClientRect();
    const eRect = enemyBoard.getBoundingClientRect();
    if (pRect.width <= 0 || eRect.width <= 0) return;

    // 👥 2P: los tableros pueden estar espejados (J2 a la derecha), así que
    // calculamos el ancho total del área de ambos tableros sin asumir orden.
    const left = Math.min(pRect.left, eRect.left);
    const right = Math.max(pRect.right, eRect.right);
    const width = right - left;

    modal.style.position = 'relative';
    modal.style.width = width + 'px';
    modal.style.maxWidth = 'none';
    modal.style.margin = '0';

    // 📐 Alto disponible real: desde el padding superior del overlay (100 px)
    // hasta justo encima de la barra de acciones. Antes era 56vh fijo y en
    // ventanas de 900-950 px (100 % de zoom) la tienda de objetos no cabía:
    // la fila del botón Reroll se salía por debajo del panel y se cortaba.
    const barraAcciones = document.querySelector('.action-bar');
    const barraTop = barraAcciones && barraAcciones.getBoundingClientRect().height > 0
        ? barraAcciones.getBoundingClientRect().top
        : window.innerHeight - 90;
    const altoDisponible = Math.floor(barraTop - 100 - 24);
    modal.style.maxHeight = Math.max(360, altoDisponible) + 'px';
}

// ============================================================
// ===== CERRAR TIENDA =====
// ============================================================

function cerrarTienda() {
    const overlay = document.getElementById('tiendaOverlay');
    if (!overlay) return;

    tiendaAbierta = false;
    modoTiendaObjetos = false;
    overlay.classList.remove('visible');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modo-objetos');
    document.body.classList.remove('tienda-abierta');

    renderizar();

    // 💬 Si la ronda es PvE y su diálogo estaba esperando a que cerraras
    //    la tienda, sale ahora mismo.
    if (typeof window.mostrarDialogoPvEPendiente === 'function') {
        setTimeout(() => {
            try { window.mostrarDialogoPvEPendiente(); } catch (e) { }
        }, 400);
    }
}

function toggleTienda() {
    if (fase <= 1) {
        addConsoleMessage('🛒 No hay tienda disponible en ronda 1', 'info');
        return;
    }

    if (fase === 2 && tiendaRonda2Comprada && !tiendaAbierta) {
        addConsoleMessage('🛒 Ya compraste tu pokémon. La tienda vuelve en la ronda 3.', 'info');
        return;
    }

    if (tiendaAbierta) {
        cerrarTienda();
    } else {
        abrirTienda(false);
    }
}

// ============================================================
// ===== INFO TIENDA =====
// ============================================================

function actualizarInfoTienda() {
    const oroEl = document.getElementById('tiendaOro');
    const tituloTienda = document.querySelector('.tienda-header h2');

    if (oroEl) oroEl.textContent = oro;

    if (tituloTienda) {
        if (modoTiendaObjetos) {
            tituloTienda.innerHTML = `📦 TIENDA DE OBJETOS`;
        } else {
            const lockIcon = tiendaBloqueada ? '🔒' : '🔓';
            tituloTienda.innerHTML = `🛒 TIENDA ${lockIcon}`;
        }
    }

    actualizarPorcentajesTienda();
}

function actualizarPorcentajesTienda() {
    let odds = SHOP_ODDS[nivelJugador] || SHOP_ODDS[8];
    const porcentajes = {
        1: Math.round(odds[1] * 100),
        2: Math.round(odds[2] * 100),
        3: Math.round(odds[3] * 100),
        4: Math.round(odds[4] * 100),
        5: Math.round(odds[5] * 100)
    };

    const chance1 = document.getElementById('tiendaChance1');
    const chance2 = document.getElementById('tiendaChance2');
    const chance3 = document.getElementById('tiendaChance3');
    const chance4 = document.getElementById('tiendaChance4');
    const chance5 = document.getElementById('tiendaChance5');

    if (chance1) chance1.textContent = porcentajes[1] + '%';
    if (chance2) chance2.textContent = porcentajes[2] + '%';
    if (chance3) chance3.textContent = porcentajes[3] + '%';
    if (chance4) chance4.textContent = porcentajes[4] + '%';
    if (chance5) chance5.textContent = porcentajes[5] + '%';
}

// ============================================================
// ===== CARTAS DE POKÉMON (CON SHINY MINIMALISTA) =====
// ============================================================

function crearCartaTienda(p, idx) {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.dataset.index = idx;

    if (p && p !== null) {
        card.classList.add('cost-' + p.coste);
        if (p.shiny) card.classList.add('shiny-card');

        const esShiny = p.shiny === true;
        const spriteUrl = getSpriteUrl(p.spriteId, p.nombre, esShiny);
        const escalaSprite = typeof getSpriteScale === 'function' ? getSpriteScale(p.spriteId) : 1;
        const offsetXSprite = typeof getSpriteOffsetX === 'function' ? getSpriteOffsetX(p.spriteId) : '0px';

        let starsHtml = '';
        let traitsHtml = '';
        if (p.tipos && p.tipos.length > 0) {
            traitsHtml += p.tipos.map(t => `<span class="trait-icon">${getIconoTipo(t)}</span>`).join('');
        }
        if (p.clase) {
            traitsHtml += `<span class="trait-icon">${getIconoClase(p.clase)}</span>`;
        }

        // 🔥 FUSIÓN: solo cuenta copias de NIVEL 1 (las que se fusionan al
        //    comprar otra de 1★). Antes se contaban por nombre sin mirar el
        //    nivel, así que dos copias 2★ marcaban la carta como "¡Evoluciona!"
        //    aunque comprarla no fusionara nada.
        let copiasNivel1Tienda = 0;
        if (tablero) {
            for (let i = 0; i < tablero.length; i++) {
                const u = tablero[i];
                if (u && u.pokemon && u.pokemon.nombre === p.nombre && u.nivel === 1 && !u.esZacian) copiasNivel1Tienda++;
            }
        }
        if (banquillo) {
            for (let i = 0; i < banquillo.length; i++) {
                const u = banquillo[i];
                if (u && u.pokemon && u.pokemon.nombre === p.nombre && u.nivel === 1 && !u.esZacian) copiasNivel1Tienda++;
            }
        }
        let fusionReady = (copiasNivel1Tienda >= 2);

        if (fusionReady) {
            card.classList.add('fusion-ready');
        }

        if (fusionReady) {
            const evoluciona = !!(p.evolucion);
            const texto = evoluciona ? '¡Evoluciona!' : '¡Mejora!';
            starsHtml = `<span class="unit-stars-right fusion-stars-right">
                <span class="fusion-texto">${texto}</span>
                <img class="fusion-stars-img" src="${getEstrellasUrl(2)}" alt="2★" draggable="false">
            </span>`;
        } else {
            starsHtml = `<span class="unit-stars-right"><img class="estrellas-img" src="${getEstrellasUrl(1)}" alt="1★"></span>`;
        }

        let copiasDisponibles = getCopiasDisponibles(p);
        let sinCopias = copiasDisponibles <= 0;
        if (sinCopias) {
            card.style.opacity = '0.5';
            card.style.cursor = 'not-allowed';
        }

        const monedaImg = `<img src="assets/icons/moneda.png" alt="💰" style="width: 26px; height: 26px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.3)); flex-shrink: 0; display: inline-block; vertical-align: middle;">`;

        card.innerHTML = `
            <div class="shop-card-key" title="Atajo: ${idx + 1}">${idx + 1}</div>
            <div class="unit-traits-left">${traitsHtml}</div>
            ${starsHtml}
            <img class="unit-sprite ${esShiny ? 'shiny' : ''}" src="${spriteUrl}" alt="${p.nombre}${esShiny ? ' ✨' : ''}" style="--sprite-scale: ${escalaSprite}; --sprite-offset-x: ${offsetXSprite}" onerror="this.style.display='none'">
            <div class="unit-cost">
                ${monedaImg}
                <span class="cost-value">${p.coste}</span>
            </div>
            <div class="unit-name ${esShiny ? 'shiny-name' : ''}">${p.nombre}${sinCopias ? ' ❌' : ''}</div>
            ${sinCopias ? '<div style="font-size:0.5rem;color:#ef4444;margin-top:4px;position:relative;z-index:1;">Sin copias</div>' : ''}
        `;

        card.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sinCopias) {
                addConsoleMessage(`❌ No quedan copias de ${p.nombre}!`, 'error');
                return;
            }
            comprarDesdeTiendaIndependiente(p, idx);
        });
    } else {
        card.className = 'shop-card shop-card-empty';
        card.innerHTML = `
            <div style="font-size:2rem; color:#4a6a8a; opacity:0.5;">▢</div>
            <div style="font-size:0.6rem; color:#4a6a8a; margin-top:6px; opacity:0.5;">VACÍO</div>
        `;
        card.style.cursor = 'default';
    }

    return card;
}

// ============================================================
// ===== BOTONES =====
// ============================================================

function actualizarBotonReroll() {
    const btn = document.getElementById('btnRefrescarTienda');
    if (!btn) return;

    if (fase <= 2 || modoTiendaObjetos) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.style.filter = 'grayscale(1)';
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.filter = 'none';
    }
}

function actualizarBotonCandado() {
    const btn = document.getElementById('btnLockShopTienda');
    if (!btn) return;

    if (fase <= 2) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.style.filter = 'grayscale(1)';
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.filter = 'none';
    }

    // 🆕 Actualizar el icono según el estado
    const icono = btn.querySelector('.lock-icon');
    if (icono) {
        if (tiendaBloqueada) {
            icono.textContent = '🔒';
            btn.classList.add('locked');
        } else {
            icono.textContent = '🔓';
            btn.classList.remove('locked');
        }
    }
}

// ============================================================
// ===== REROLL DE OBJETOS =====
// ============================================================

function rerollObjetosGratis() {
    // 🆕 Reroll de objetos: SOLO en rondas PvP con tienda de objetos.
    //    En rondas PvE nunca hay reroll gratis.
    const esRondaPvEActual = (typeof esRondaPvE === 'function' && esRondaPvE(ronda));
    if (esRondaPvEActual) {
        addConsoleMessage(`❌ El reroll de objetos no está disponible en rondas PvE`, 'error');
        return;
    }

    const esRondaObjetos = (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(ronda));
    if (!esRondaObjetos) {
        addConsoleMessage(`❌ El reroll de objetos solo está disponible en rondas con tienda de objetos`, 'error');
        return;
    }

    if (rerollObjetosRonda3Usado) {
        addConsoleMessage(`❌ Ya usaste el reroll gratuito de objetos`, 'error');
        return;
    }

    if (!modoTiendaObjetos) {
        addConsoleMessage(`❌ No estás en la tienda de objetos`, 'error');
        return;
    }

    objetosEnTienda = generarObjetosTienda();
    rerollObjetosRonda3Usado = true;

    playButtonSound();
    addConsoleMessage(`🔄 ¡Objetos renovados!`, 'shop-objetos');

    abrirTienda(true);
}

// ============================================================
// ===== COMPRAR OBJETO =====
// ============================================================

function comprarObjetoDesdeTienda(nombreObjeto) {
    if (!puedeInteractuar()) return;
    if (combatiendo) return;

    const objeto = OBJETOS[nombreObjeto];
    if (!objeto) return;

    if (objetoCompradoEstaRonda) {
        addConsoleMessage(`❌ Ya compraste un objeto en esta ronda`, 'error');
        return;
    }

    if (baulObjetos.length >= CONFIG.MAX_BAUL) {
        addConsoleMessage(`❌ Baúl de objetos lleno!`, 'error');
        return;
    }

        baulObjetos.push(nombreObjeto);
    const index = objetosEnTienda.indexOf(nombreObjeto);
    if (index !== -1) objetosEnTienda.splice(index, 1);
    objetoCompradoEstaRonda = true;

    addConsoleMessage(`📦 ${nombreObjeto} comprado! (GRATIS) → OBJETOS`, 'buy');
    playBuySound();
    actualizarBadgeBaul();

    if (typeof actualizarObjetosVerticales === 'function') {
        setTimeout(() => actualizarObjetosVerticales(), 100);
    }

        setTimeout(() => {
        const overlay = document.getElementById('tiendaOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
            overlay.style.display = 'none';
        }
        tiendaAbierta = false;
        modoTiendaObjetos = false;
        document.body.style.overflow = '';
        document.body.classList.remove('modo-objetos');
        // Al cerrar desde la compra también hay que quitar esta clase, si no
        // la barra de acciones se queda con el fondo sólido de "tienda abierta".
        document.body.classList.remove('tienda-abierta');

        // 🆕 FIX: NO resetear objetoCompradoEstaRonda ni vaciar
        //    objetosEnTienda aquí. La ronda sigue en curso: si el
        //    jugador intenta reabrir la tienda, debe salir en modo
        //    Pokémon (o directamente no dejarle comprar más objetos).
        //    El reset del flag se hace al EMPEZAR la siguiente ronda,
        //    no al comprar.
        // objetoCompradoEstaRonda = false;   ← NO tocar
        // objetosEnTienda = [];              ← NO tocar
        // sonidoObjetosReproducido = false;  ← NO tocar

        addConsoleMessage(`🛒 ¡Objeto comprado! Abre la tienda de Pokémon cuando quieras.`, 'shop');
        renderizar();

        // 📱 En móvil, abrir solo la tira del baúl para que se vea el objeto
        //    recién comprado sin tener que pulsar 📦 (en escritorio no
        //    existe el botón y la función no hace nada).
        if (typeof window.abrirBaulMovil === 'function') {
            setTimeout(() => window.abrirBaulMovil(), 150);
        }
    }, 400);
}

// ============================================================
// ===== COMPRAR POKÉMON =====
// ============================================================

async function comprarDesdeTiendaIndependiente(pokemon, idx) {
    if (!puedeInteractuar()) return;
    if (combatiendo) return;

    if (fase === 2 && tiendaRonda2Comprada) {
        addConsoleMessage(`🛒 Ya compraste tu pokémon en la ronda 2.`, 'error');
        return;
    }

    // 🆕 FIX: Usamos el índice original que nos pasa la tienda.
    // Ya NO hacemos 'findIndex' ni 'splice', dejamos el null en el array.
    if (!tienda[idx] || tienda[idx].id !== pokemon.id) return;

    if (oro < pokemon.coste) {
        addConsoleMessage(`💰 Oro insuficiente! Necesitas ${pokemon.coste}💰`, 'error');
        return;
    }

    if (pokemonBloqueadoPor3Estrellas(pokemon)) {
        addConsoleMessage(`❌ ${pokemon.nombre} ya no está disponible`, 'error');
        return;
    }

    if (getCopiasDisponibles(pokemon) <= 0) {
        addConsoleMessage(`❌ No quedan copias de ${pokemon.nombre}!`, 'error');
        return;
    }

    const esShinyCompra = pokemon.shiny === true;

    // Contar copias nivel 1
    let copiasNivel1 = [];
    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i] && tablero[i].pokemon.nombre === pokemon.nombre && !tablero[i].esZacian && tablero[i].nivel === 1) {
            copiasNivel1.push({ ubicacion: 'tablero', indice: i, unidad: tablero[i] });
        }
    }
    for (let i = 0; i < banquillo.length; i++) {
        if (banquillo[i] && banquillo[i].pokemon.nombre === pokemon.nombre && !banquillo[i].esZacian && banquillo[i].nivel === 1) {
            copiasNivel1.push({ ubicacion: 'banquillo', indice: i, unidad: banquillo[i] });
        }
    }

    let esFusion = (copiasNivel1.length >= 2);

    if (esFusion) {
        if (!consumirDelPool(pokemon.id)) return;

        let libreBanquillo = banquillo.findIndex(c => c === null);
        let ubicacionTemporal = null;

        if (libreBanquillo !== -1) {
            ubicacionTemporal = { tipo: 'banquillo', indice: libreBanquillo };
        } else {
            const maxTab = (typeof maxUnidadesTablero === 'function') ? maxUnidadesTablero() : 4;
            const ocupadasTab = tablero.filter(u => u !== null).length;

            if (ocupadasTab < maxTab) {
                const libreTab = tablero.findIndex(c => c === null);
                if (libreTab !== -1) {
                    ubicacionTemporal = { tipo: 'tablero', indice: libreTab };
                }
            } else {
                const forzado = tablero.findIndex(c => c === null);
                if (forzado !== -1) {
                    ubicacionTemporal = { tipo: 'tablero', indice: forzado, forzado: true };
                    addConsoleMessage(`⚠️ Tablero lleno, colocando ${pokemon.nombre} temporalmente para fusionar`, 'info');
                }
            }
        }

        if (!ubicacionTemporal) {
            devolverAlPool(pokemon.id);
            addConsoleMessage(`❌ No hay ninguna casilla libre para fusionar`, 'error');
            return;
        }

        let nuevaCopia = new Unidad(pokemon, 1, pokemon.id, pokemon.coste);

        if (esShinyCompra) {
            nuevaCopia.esShiny = true;
            nuevaCopia.pokemon.shiny = true;
            nuevaCopia.actualizarStats();
        }

        if (ubicacionTemporal.tipo === 'banquillo') banquillo[ubicacionTemporal.indice] = nuevaCopia;
        else tablero[ubicacionTemporal.indice] = nuevaCopia;

        oro -= pokemon.coste;
        tienda[idx] = null; // 🆕 FIX: Dejar null en el array

        if (esShinyCompra) addConsoleMessage(`✨ ¡${pokemon.nombre} SHINY comprado! ✨ (Fusión en curso)`, 'success');
        else addConsoleMessage(`🛒 ${pokemon.nombre} comprado! (${pokemon.coste}💰) - Fusión en curso`, 'buy');
        playBuySound();

        verificarTodasLasFusiones();
        if (typeof procesarUnidadesPendientes === 'function') procesarUnidadesPendientes();

        const siguenColocadas = (
            (ubicacionTemporal.tipo === 'banquillo' && banquillo[ubicacionTemporal.indice] === nuevaCopia) ||
            (ubicacionTemporal.tipo === 'tablero' && tablero[ubicacionTemporal.indice] === nuevaCopia)
        );

        if (siguenColocadas && ubicacionTemporal.forzado) {
            if (ubicacionTemporal.tipo === 'banquillo') banquillo[ubicacionTemporal.indice] = null;
            else tablero[ubicacionTemporal.indice] = null;

            devolverAlPool(pokemon.id);
            oro += pokemon.coste;

            addConsoleMessage(`⚠️ La fusión no se completó. ${pokemon.nombre} devuelto a la tienda.`, 'error');
            renderizar();
            if (tiendaAbierta) abrirTienda(false);
            return;
        }

        // 🆕 FIX: Solo ocultar la tarjeta en el DOM
        const grid = document.getElementById('tiendaGridTienda');
        if (grid) {
            const wrapper = document.getElementById('tiendaWrapper');
            let cartaDom = wrapper ? wrapper.querySelector(`.shop-card[data-index="${idx}"]`) : grid.querySelector(`.shop-card[data-index="${idx}"]`);

            if (cartaDom) {
                cartaDom.className = 'shop-card shop-card-empty';
                cartaDom.innerHTML = `
                    <div style="font-size:2rem; color:#4a6a8a; opacity:0.5;">▢</div>
                    <div style="font-size:0.6rem; color:#4a6a8a; margin-top:6px; opacity:0.5;">VACÍO</div>
                `;
                cartaDom.style.cursor = 'default';
                cartaDom.onclick = null;
            }
        }

        renderizar();

        await new Promise(r => setTimeout(r, 80));
        if (typeof window._animacionEvolucionActiva !== 'undefined' && window._animacionEvolucionActiva) {
            try { await window._animacionEvolucionActiva; } catch (e) {}
        }

        const fusionEnTablero = copiasNivel1.some(c => c.ubicacion === 'tablero');
        if (fusionEnTablero) cerrarTienda();

        return;
    }

    // COMPRA NORMAL
    let espacioBanquillo = banquillo.some(u => u === null);
    let espacioTablero = tablero.filter(u => u !== null).length < maxUnidadesTablero();

    if (!espacioBanquillo && !espacioTablero) {
        addConsoleMessage(`❌ No hay espacio!`, 'error');
        return;
    }

    if (!consumirDelPool(pokemon.id)) return;

    let nueva = new Unidad(pokemon, 1, pokemon.id, pokemon.coste);

    if (esShinyCompra) {
        nueva.esShiny = true;
        nueva.pokemon.shiny = true;
        nueva.actualizarStats();
    }

    let ubicado = false;

    if (espacioBanquillo) {
        let libre = banquillo.findIndex(x => x === null);
        if (libre !== -1) { banquillo[libre] = nueva; ubicado = true; }
    }
    if (!ubicado && espacioTablero) {
        let libre = tablero.findIndex(x => x === null);
        if (libre !== -1) { tablero[libre] = nueva; ubicado = true; }
    }

    if (ubicado) {
        oro -= pokemon.coste;
        tienda[idx] = null; // 🆕 FIX: Dejar null en el array

        if (pokemon.id) playPokemonCry(pokemon.id);
        else playBuySound();

        verificarTodasLasFusiones();
        
        // 🆕 FIX: Solo ocultar la tarjeta en el DOM
        const grid = document.getElementById('tiendaGridTienda');
        if (grid) {
            const wrapper = document.getElementById('tiendaWrapper');
            let cartaDom = wrapper ? wrapper.querySelector(`.shop-card[data-index="${idx}"]`) : grid.querySelector(`.shop-card[data-index="${idx}"]`);

            if (cartaDom) {
                cartaDom.className = 'shop-card shop-card-empty';
                cartaDom.innerHTML = `
                    <div style="font-size:2rem; color:#4a6a8a; opacity:0.5;">▢</div>
                    <div style="font-size:0.6rem; color:#4a6a8a; margin-top:6px; opacity:0.5;">VACÍO</div>
                `;
                cartaDom.style.cursor = 'default';
                cartaDom.onclick = null;
            }
        }
        
        renderizar();

        if (esShinyCompra) addConsoleMessage(`✨ ¡${pokemon.nombre} SHINY comprado! ✨`, 'success');
        else addConsoleMessage(`🛒 ${pokemon.nombre} comprado! (${pokemon.coste}💰)`, 'buy');

        if (fase === 2 && !tiendaRonda2Comprada) {
            tiendaRonda2Comprada = true;
            addConsoleMessage(`✅ ¡Pokémon comprado! Tienda cerrada hasta ronda 3`, 'success');
            cerrarTienda();
        }
    } else {
        devolverAlPool(pokemon.id);
        addConsoleMessage(`❌ No hay espacio!`, 'error');
    }
}

// ============================================================
// ===== REFRESCAR TIENDA =====
// ============================================================

function refrescarTiendaIndependiente() {
    if (!puedeInteractuar()) return;
    if (combatiendo) return;
    if (modoTiendaObjetos) {
        addConsoleMessage(`❌ Primero compra un objeto`, 'error');
        return;
    }
    if (fase <= 2) {
        addConsoleMessage(`🔒 Reroll disponible desde ronda 3`, 'info');
        return;
    }
    if (tiendaBloqueada) {
        addConsoleMessage(`🔒 Tienda bloqueada`, 'info');
        return;
    }

    if (oro >= 2) {
        oro -= 2;
        generarTienda();
        tiendaActualizada = true;
        _shinyYaSonadoEstaTienda = false;
        playButtonSound();
        addConsoleMessage(`🔄 Tienda actualizada! -2💰`, 'shop');
        abrirTienda(false);
        renderizar();
    } else {
        addConsoleMessage(`💰 Oro insuficiente!`, 'error');
    }
}

function cerrarTiendaYCombatir() {
    if (modoTiendaObjetos && !objetoCompradoEstaRonda) {
        addConsoleMessage(`📦 Primero compra un objeto`, 'error');
        return;
    }
    cerrarTienda();
    setTimeout(() => {
        if (typeof combatir === 'function') combatir();
    }, 300);
}

// ============================================================
// ===== POST-RONDA =====
// ============================================================

function mostrarTiendaPostRonda() {
    if (combatiendo) return;

    const overlay = document.getElementById('combatOverlay');
    if (overlay && overlay.classList.contains('active')) {
        setTimeout(mostrarTiendaPostRonda, 500);
        return;
    }

    if (tiendaAbierta) {
        // 🆕 FIX: si la tienda que quedó abierta NO es la que toca en esta
        // ronda (p. ej. sigue abierta la tienda de Pokémon de la ronda
        // anterior y ahora toca la de OBJETOS), se cierra para reabrirla
        // en el modo correcto. Antes se salía aquí y la tienda de objetos
        // no aparecía nunca si el jugador había dejado la tienda abierta.
        try {
            const _tocaObjetos = (typeof debeAparecerTiendaObjetos === 'function' && debeAparecerTiendaObjetos(ronda));
            if (!(_tocaObjetos && !objetoCompradoEstaRonda && !modoTiendaObjetos)) return;
            if (typeof cerrarTienda === 'function') cerrarTienda();
        } catch (e) { return; }
    }
    if (fase <= 1) return;
    if (fase === 2 && tiendaRonda2Comprada) return;

    // 🆕 FIX: en rondas PvE la tienda también debe regenerarse y abrirse igual
    // que en PvP. Antes se salía aquí si el monstruo PvE seguía vivo, lo que
    // dejaba la tienda con la última tienda de la ronda anterior (sin actualizar).
    console.log("🛒 mostrarTiendaPostRonda()");

    if (!tiendaBloqueada) {
        generarTienda();
        tiendaActualizada = false;
        _shinyYaSonadoEstaTienda = false;
        addConsoleMessage('🔄 Tienda regenerada (nueva ronda)', 'shop');
    } else if (!tienda || tienda.length === 0) {
        tienda = [];
        let numPokemon = (fase === 2) ? 3 : 4;
        for (let i = 0; i < numPokemon; i++) {
            tienda.push(getRandomPokemonPorNivel());
        }
        _shinyYaSonadoEstaTienda = false;
    }

        const esRondaObjetos = debeAparecerTiendaObjetos(ronda);
    let yaCompro = objetoCompradoEstaRonda;

    // 🆕 FIX: si la tienda de objetos es de una ronda anterior
    // (window._rondaObjetosGenerada !== ronda), regenerarla.
    // Esto evita que la tienda de la ronda 7 se quede pegada en la 9.
    const rondaObjetosCambio = (window._rondaObjetosGenerada !== ronda);

    if (esRondaObjetos && !yaCompro && (rondaObjetosCambio || !objetosEnTienda || objetosEnTienda.length === 0)) {
        objetosEnTienda = generarObjetosTienda();
        window._rondaObjetosGenerada = ronda;
    }

    const hayObjetos = objetosEnTienda && objetosEnTienda.length > 0;
    const mostrarObjetos = esRondaObjetos && hayObjetos && !yaCompro;

            setTimeout(() => {
        if (combatiendo) return;
        if (tiendaAbierta) return;
        abrirTienda(mostrarObjetos);
    }, 0); // 🆕 1 segundo antes → 0ms (instantáneo)
}

// ============================================================
// ===== BAÚL =====
// ============================================================

function abrirBaulPanel() {
    const panel = document.getElementById('baulPanel');
    if (!panel || baulObjetos.length === 0 || combatiendo) return;
    if (tiendaAbierta) cerrarTienda();

    baulPanelAbierto = true;
    panel.style.display = 'block';
    renderizarBaulPanel();
    document.body.style.overflow = 'hidden';
    playButtonSound();
}

function cerrarBaulPanel() {
    const panel = document.getElementById('baulPanel');
    if (!panel) return;
    baulPanelAbierto = false;
    panel.style.display = 'none';
    document.body.style.overflow = '';
    objetoSeleccionado = null;
}

function toggleBaulPanel() {
    if (baulPanelAbierto) cerrarBaulPanel();
    else abrirBaulPanel();
}

function renderizarBaulPanel() {
    const grid = document.getElementById('baulPanelGrid');
    const contador = document.getElementById('baulPanelContador');
    if (!grid) return;

    if (contador) contador.textContent = `${baulObjetos.length}/${CONFIG.MAX_BAUL || 4}`;

    grid.innerHTML = '';

    for (let i = 0; i < (CONFIG.MAX_BAUL || 4); i++) {
        const item = document.createElement('div');
        item.className = 'baul-panel-item';
        item.dataset.index = i;

        if (i < baulObjetos.length) {
            const nombre = baulObjetos[i];
            const objeto = OBJETOS[nombre];

            if (objeto) {
                item.classList.add('has-objeto');

                let iconoHtml = '';
                if (objeto.emoji && objeto.emoji.includes('.png')) {
                    iconoHtml = `<img src="${objeto.emoji}" class="objeto-icon-grande" alt="${nombre}">`;
                } else {
                    iconoHtml = `<span style="font-size:2rem;">${objeto.emoji || '📦'}</span>`;
                }

                item.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;">
                        ${iconoHtml}
                        <span class="objeto-nombre-item">${nombre}</span>
                    </div>
                `;

                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!puedeInteractuar() || combatiendo) return;
                    objetoSeleccionado = { index: i, nombre: nombre };
                    renderizarBaulPanel();
                });
            }
        } else {
            item.classList.add('vacio');
            item.innerHTML = `<span style="font-size:1.2rem;opacity:0.2;">▢</span>`;
        }

        grid.appendChild(item);
    }
}

function actualizarBadgeBaul() {
    const btn = document.getElementById('btnBaulFlotante');
    if (!btn) return;

    const contadorTienda = document.getElementById('baulCantidadTienda');
    if (contadorTienda) contadorTienda.textContent = baulObjetos.length;

    const badge = btn.querySelector('.badge-baul');
    if (baulObjetos.length > 0) {
        btn.style.display = 'flex';
        if (badge) { badge.textContent = baulObjetos.length; badge.style.display = 'flex'; }
    } else {
        btn.style.display = 'none';
        if (badge) badge.style.display = 'none';
        if (baulPanelAbierto) cerrarBaulPanel();
    }
}

// ============================================================
// ===== VISIBILIDAD BOTONES =====
// ============================================================

function actualizarVisibilidadBotonTienda() {
    const btnAbrirAccion = document.getElementById('btnAbrirTiendaAccion');
    const btnAdelantar = document.getElementById('btnAdelantarNivel');

    if (fase <= 1) {
        if (btnAbrirAccion) { btnAbrirAccion.disabled = true; btnAbrirAccion.style.opacity = '0.4'; }
        if (btnAdelantar) { btnAdelantar.disabled = true; btnAdelantar.style.opacity = '0.4'; }
        return;
    }

    if (fase === 2) {
        if (tiendaRonda2Comprada) {
            if (btnAbrirAccion) { btnAbrirAccion.disabled = true; btnAbrirAccion.style.opacity = '0.4'; }
        } else {
            if (btnAbrirAccion) { btnAbrirAccion.disabled = false; btnAbrirAccion.style.opacity = '1'; }
        }
        if (btnAdelantar) { btnAdelantar.disabled = true; btnAdelantar.style.opacity = '0.4'; }
        return;
    }

    if (btnAbrirAccion) { btnAbrirAccion.disabled = false; btnAbrirAccion.style.opacity = '1'; }
    if (btnAdelantar) { btnAdelantar.disabled = false; btnAdelantar.style.opacity = '1'; }
}

// ============================================================
// ===== INICIALIZAR =====
// ============================================================

function initTiendaIndependiente() {
    console.log('🛒 Inicializando tienda independiente...');

    tiendaBloqueada = false;
    try { localStorage.setItem('tiendaBloqueada', JSON.stringify(false)); } catch (e) {}

    const btnAbrir = document.getElementById('btnAbrirTienda');
    if (btnAbrir) {
        btnAbrir.addEventListener('click', (e) => {
            e.stopPropagation();
            if (combatiendo) return;
            toggleTienda();
        });
    }

    const btnCerrar = document.getElementById('btnCerrarTienda');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => {
            e.stopPropagation();
            cerrarTienda();
        });
    }

    const overlay = document.getElementById('tiendaOverlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarTienda();
            }
        });
    }

    // ============================================================
    // 🆕 FIX CANDADO: clonar el botón para eliminar listeners viejos
    //    y asignar uno limpio con logs de diagnóstico.
    // ============================================================
    const btnLockTienda = document.getElementById('btnLockShopTienda');
    if (btnLockTienda) {
        const nuevoLock = btnLockTienda.cloneNode(true);
        btnLockTienda.parentNode.replaceChild(nuevoLock, btnLockTienda);

        nuevoLock.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            console.log(`🔒 Click en candado. fase=${fase}, tiendaBloqueada=${tiendaBloqueada}`);

            if (fase <= 2) {
                if (typeof addConsoleMessage === 'function') {
                    addConsoleMessage(`🔒 El bloqueo de tienda está disponible desde la ronda 3`, 'info');
                }
                return;
            }

            if (typeof toggleLockTienda === 'function') {
                toggleLockTienda();
                actualizarBotonCandado();
            } else {
                console.error('❌ toggleLockTienda no está definida. ¿tienda.js cargó bien?');
                if (typeof addConsoleMessage === 'function') {
                    addConsoleMessage(`❌ Error: no se pudo bloquear la tienda`, 'error');
                }
            }
        });
    }

    // 🆕 Reroll de objetos: cablear el botón fijo (junto al avatar).
    const btnRerollObjeto = document.getElementById('btnRerollObjetos');
    if (btnRerollObjeto) {
        const nuevoReroll = btnRerollObjeto.cloneNode(true);
        btnRerollObjeto.parentNode.replaceChild(nuevoReroll, btnRerollObjeto);
        nuevoReroll.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (typeof rerollObjetosGratis === 'function') rerollObjetosGratis();
        });
    }

    document.addEventListener('click', (e) => {
        if (tiendaAbierta) {
            const overlay = document.getElementById('tiendaOverlay');
            const modal = overlay ? overlay.querySelector('.tienda-modal') : null;

            if (e.target.closest('#btnCombatirFijo')) {
                cerrarTienda();
                return;
            }
            if (e.target.closest('#btnAdelantarNivel') || e.target.closest('.action-bar')) return;

            const clickEnTienda = modal && modal.contains(e.target);
            const clickEnBotonTienda = e.target.closest('#btnAbrirTienda') ||
                                       e.target.closest('#btnAbrirTiendaAccion') ||
                                       e.target.closest('.btn-tienda');

            if (!clickEnTienda && !clickEnBotonTienda) {
                cerrarTienda();
            }
        }
    });

    const btnReroll = document.getElementById('btnRefrescarTienda');
    if (btnReroll) {
        const nuevoBoton = btnReroll.cloneNode(true);
        btnReroll.parentNode.replaceChild(nuevoBoton, btnReroll);

        nuevoBoton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            refrescarTiendaIndependiente();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tiendaAbierta) {
            cerrarTienda();
            e.preventDefault();
        }
        if (e.key === 'Escape' && baulPanelAbierto) {
            cerrarBaulPanel();
            e.preventDefault();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
        if (typeof ajustesAbiertos !== 'undefined' && ajustesAbiertos) return;
        if (typeof baulPanelAbierto !== 'undefined' && baulPanelAbierto) return;

        // Solo dentro de la partida (no en el menú)
        const juego = document.getElementById('juegoContainer');
        if (!juego || juego.style.display === 'none') return;

        const key = (e.key || '').toLowerCase();

        // 1-4: comprar la carta de Pokémon de esa posición
        if (/^[1-9]$/.test(key)) {
            if (!tiendaAbierta || combatiendo || modoTiendaObjetos) return;
            const idx = parseInt(key, 10) - 1;
            const p = (typeof tienda !== 'undefined') ? tienda[idx] : null;
            if (!p) return;
            if (typeof comprarDesdeTiendaIndependiente === 'function') {
                comprarDesdeTiendaIndependiente(p, idx);
                e.preventDefault();
            }
            return;
        }

        // E: comprar +4 EXP
        if (key === 'e') {
            if (typeof adelantarNivel === 'function') {
                adelantarNivel();
                e.preventDefault();
            }
            return;
        }

        // B (o T) abre/cierra la tienda
        if (key === 'b' || key === 't') {
            if (!combatiendo) {
                toggleTienda();
                e.preventDefault();
            }
            return;
        }

        // R hace reroll solo con la tienda abierta
        if (key === 'r') {
            if (!tiendaAbierta || combatiendo) return;
            refrescarTiendaIndependiente();
            e.preventDefault();
            return;
        }

        // D abre/cierra el panel de datos
        if (key === 'd') {
            if (tiendaAbierta) return;
            if (typeof cartaAbierta !== 'undefined' && cartaAbierta) return;
            if (typeof window.togglePanelDatosCombate === 'function') {
                window.togglePanelDatosCombate();
                e.preventDefault();
            }
            return;
        }

        // C combate; si la tienda está abierta, la cierra y combate
        if (key === 'c') {
            if (combatiendo) return;
            if (window.modoDosJugadores) return; // en 2P se usa PASAR TURNO
            if (tiendaAbierta) {
                if (typeof cerrarTiendaYCombatir === 'function') cerrarTiendaYCombatir();
                e.preventDefault();
                return;
            }
            if (typeof cartaAbierta !== 'undefined' && cartaAbierta) return;
            if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto) return;
            if (typeof combatir === 'function') combatir();
            e.preventDefault();
        }
    });

    window.addEventListener('resize', () => {
        if (tiendaAbierta) posicionarTienda();
    });

    setTimeout(() => {
        if (!tienda || tienda.length === 0) generarTienda();
    }, 300);

    console.log('✅ Tienda v7.2 inicializada - FIX candado + FIX fusión sin hueco');
}

// Alias para compatibilidad
function renderizarTiendaIndependiente(forzarRender = false) {
    if (!tiendaAbierta && !forzarRender) return;
    abrirTienda(modoTiendaObjetos);
}
