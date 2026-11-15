// ============================================================
// MODO CREATIVO - FASES A + B + C + D + LAYOUT MEJORADO
// + SELECTOR DE LADO PARA OBJETOS (JUGADOR / ENEMIGO)
// ============================================================

let panelCreativoAbierto = false;
let filtroCreative = {
    pokemonJugador: { texto: '', tipo: 'todos', coste: 'todos' },
    pokemonEnemigo: { texto: '', tipo: 'todos', coste: 'todos' },
    objetos: { texto: '', tipo: 'todos' }
};

// ⬅️ NUEVO: lado activo para objetos ('jugador' o 'enemigo')
let ladoObjetosActivo = 'jugador';

// ============================================================
// ABRIR / CERRAR PANEL
// ============================================================

function abrirPanelCreativo() {
    if (!window.modoCreativo) {
        addConsoleMessage('❌ El modo creativo no está activado', 'error');
        return;
    }
    
    let panel = document.getElementById('creativePanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'creativePanel';
        panel.className = 'creative-panel';
        panel.innerHTML = construirHtmlPanel();
        document.body.appendChild(panel);
        conectarEventosPanel();
    }
    
    panel.style.display = 'flex';
    panelCreativoAbierto = true;
    renderizarContenidoPanel();
}

function cerrarPanelCreativo() {
    const panel = document.getElementById('creativePanel');
    if (panel) panel.style.display = 'none';
    panelCreativoAbierto = false;
}

function togglePanelCreativo() {
    if (panelCreativoAbierto) {
        cerrarPanelCreativo();
    } else {
        abrirPanelCreativo();
    }
}

// ============================================================
// HTML DEL PANEL
// ============================================================

function construirHtmlPanel() {
        return `
        <div class="creative-modal">
            <div class="creative-header">
                <span class="creative-titulo">🧪 MODO CREATIVO - Laboratorio</span>
                <button class="creative-cerrar" id="creativeBtnCerrar">✕</button>
            </div>

            <!-- 🆕 SELECTOR DE RIVAL PARA LA IA -->
            <div class="creative-tabs" style="margin-top: 10px;">
                <select id="creativeSelectRival" class="creative-select" style="width: 100%; max-width: 300px; margin: 0 auto; display: block;">
                    <option value="">🤖 Rival Aleatorio (por defecto)</option>
                </select>
            </div>

            <div class="creative-tabs">
                <button class="creative-tab active" data-tab="pokemon">🐾 Mi Pokémon</button>
                <button class="creative-tab" data-tab="enemigo">👹 Enemigo</button>
                <button class="creative-tab" data-tab="objetos">📦 Objetos</button>
            </div>

            <div class="creative-contenido" id="creativeContenido">
                <!-- El contenido se rellena por JS -->
            </div>

            <div class="creative-acciones">
                <div class="creative-acciones-titulo">⚡ ACCIONES RÁPIDAS</div>
                <div class="creative-acciones-grid">
                    <button class="creative-btn" id="creativeBtn3Estrellas">⭐ Poner 3★</button>
                    <button class="creative-btn" id="creativeBtnLimpiar">🧹 Limpiar todo</button>
                    <button class="creative-btn" id="creativeBtnOro">💰 +100 oro</button>
                    <button class="creative-btn" id="creativeBtnNivelMax">⬆️ Nivel máximo</button>
                    <button class="creative-btn" id="creativeBtnRonda">🎲 Ronda +1</button>
                    <button class="creative-btn" id="creativeBtnReset">🗑️ Reset completo</button>
                </div>
            </div>

            <div class="creative-footer">
                <button class="creative-btn-combatir" id="creativeBtnCombatir">▶️ COMBATIR</button>
            </div>
        </div>
    `;
}

// ============================================================
// CONECTAR EVENTOS DEL PANEL
// ============================================================

function conectarEventosPanel() {
    document.getElementById('creativeBtnCerrar')?.addEventListener('click', cerrarPanelCreativo);
    document.getElementById('creativeBtn3Estrellas')?.addEventListener('click', accionPoner3Estrellas);
    document.getElementById('creativeBtnLimpiar')?.addEventListener('click', accionLimpiarTodo);
    document.getElementById('creativeBtnOro')?.addEventListener('click', accionDarOro);
    document.getElementById('creativeBtnNivelMax')?.addEventListener('click', accionNivelMaximo);
    document.getElementById('creativeBtnRonda')?.addEventListener('click', accionAvanzarRonda);
    document.getElementById('creativeBtnReset')?.addEventListener('click', () => accionResetCompleto(false));
    document.getElementById('creativeBtnCombatir')?.addEventListener('click', accionCombatir);
    
        document.querySelectorAll('.creative-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.creative-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderizarContenidoPanel();
        });
    });

    // 🆕 RELLENAR Y CONECTAR SELECTOR DE RIVALES
    const selectRival = document.getElementById('creativeSelectRival');
    if (selectRival && typeof window.RIVALES_INFO !== 'undefined') {
        window.RIVALES_INFO.forEach(rival => {
            const opt = document.createElement('option');
            opt.value = rival.nombre;
            opt.textContent = `🎭 ${rival.nombre} (${rival.estrategia.descripcion})`;
            selectRival.appendChild(opt);
        });

        if (window._rivalForzado) {
            selectRival.value = window._rivalForzado;
        }

        selectRival.addEventListener('change', function() {
            const nombreRival = this.value;
            if (!nombreRival) {
                window._rivalForzado = null;
                if (typeof addConsoleMessage === 'function') addConsoleMessage(`🎲 Rival aleatorio para el próximo combate`, 'info');
                return;
            }

                        const rivalData = window.RIVALES_INFO.find(r => r.nombre === nombreRival);
            if (rivalData) {
                window._rivalForzado = nombreRival;
                window.rivalActual = rivalData;
                
                // 1. ACTUALIZAR INTERFAZ (Nombre y Avatar)
                const enemyNameEl = document.getElementById("enemyName");
                const enemyAvatarEl = document.getElementById("enemyAvatar");
                
                if (enemyNameEl) enemyNameEl.textContent = rivalData.nombre;
                if (enemyAvatarEl) {
                    enemyAvatarEl.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = `assets/avatars/rivales/${rivalData.avatar}.png`;
                    img.alt = rivalData.nombre;
                    img.onerror = function() { this.style.display = 'none'; enemyAvatarEl.textContent = '👤'; };
                    enemyAvatarEl.appendChild(img);
                }

                // 2. REINICIAR EQUIPO ENEMIGO
                if (typeof enemyBoard !== 'undefined' && typeof enemyBanquillo !== 'undefined') {
                    for (let i = 0; i < enemyBoard.length; i++) enemyBoard[i] = null;
                    for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;
                }

                // 3. APLICAR ESTRATEGIA Y TERRENO
                if (typeof enemyElegirEstrategia === 'function') enemyElegirEstrategia();
                if (typeof cambiarTerrenoPorRival === 'function') cambiarTerrenoPorRival(rivalData);

                // 4. GENERAR POKÉMON INICIAL PARA EL NUEVO RIVAL
                if (typeof elegirPokemonInicialEnemigo === 'function' && typeof Unidad !== 'undefined') {
                    let pokemonEnemigo = elegirPokemonInicialEnemigo();
                    if (pokemonEnemigo && typeof consumirDelPool === 'function') {
                        if (consumirDelPool(pokemonEnemigo.id)) {
                            const rolEnemigo = typeof rolColocacionDesdePokemonData === 'function' 
                                ? rolColocacionDesdePokemonData(pokemonEnemigo) 
                                : 'melee';
                            
                            const mejorPos = typeof obtenerIndiceColocacionInicial === 'function' 
                                ? obtenerIndiceColocacionInicial('enemy', rolEnemigo, 0) 
                                : 0;

                            const nuevaUnidad = new Unidad(pokemonEnemigo, 1, pokemonEnemigo.id, pokemonEnemigo.coste);
                            nuevaUnidad.equipo = 'enemy';
                            enemyBoard[mejorPos] = nuevaUnidad;
                            
                            // Quitar de la tienda enemiga si por lo que sea estaba ahí
                            if (typeof enemyTienda !== 'undefined') {
                                let idxTienda = enemyTienda.findIndex(p => p && p.id === pokemonEnemigo.id);
                                if (idxTienda !== -1) enemyTienda.splice(idxTienda, 1);
                            }

                            if (typeof addConsoleMessage === 'function') {
                                addConsoleMessage(`🎁 ${rivalData.nombre} empieza con ${pokemonEnemigo.nombre}`, 'enemy');
                            }
                        }
                    }
                }
                
                // 5. REFRESCAR EL TABLERO VISUALMENTE
                if (typeof renderizar === 'function') renderizar();

                if (typeof addConsoleMessage === 'function') {
                    addConsoleMessage(`🎭 Rival seleccionado: ${nombreRival} (${rivalData.estrategia.descripcion})`, 'enemy');
                }
            }
        });
    }
}

// ============================================================
// RENDERIZAR CONTENIDO SEGÚN LA PESTAÑA ACTIVA
// ============================================================

function renderizarContenidoPanel() {
    const contenedor = document.getElementById('creativeContenido');
    if (!contenedor) return;
    
    const tabActiva = document.querySelector('.creative-tab.active')?.dataset.tab || 'pokemon';
    
    if (tabActiva === 'pokemon') {
        contenedor.innerHTML = construirCatalogoPokemon('jugador');
        conectarEventosCatalogo('jugador');
    } else if (tabActiva === 'enemigo') {
        contenedor.innerHTML = construirCatalogoPokemon('enemigo');
        conectarEventosCatalogo('enemigo');
    } else if (tabActiva === 'objetos') {
        contenedor.innerHTML = construirCatalogoObjetos();
        conectarEventosCatalogoObjetos();
    }
}

// ============================================================
// CATÁLOGO DE POKÉMON (jugador o enemigo)
// ============================================================

function construirCatalogoPokemon(destino) {
    const filtro = filtroCreative[destino === 'jugador' ? 'pokemonJugador' : 'pokemonEnemigo'];
    
    const todos = (typeof TODOS_POKEMONS !== 'undefined' && TODOS_POKEMONS.length > 0)
        ? TODOS_POKEMONS
        : (typeof POKEMONS !== 'undefined' ? POKEMONS : []);
    
    let lista = todos.filter(p => {
        if (filtro.texto && !p.nombre.toLowerCase().includes(filtro.texto.toLowerCase())) return false;
        if (filtro.coste !== 'todos' && p.coste !== parseInt(filtro.coste)) return false;
        if (filtro.tipo !== 'todos') {
            const coincideTipo = p.tipos && p.tipos.some(t => t === filtro.tipo);
            const coincideClase = p.clase === filtro.tipo;
            if (!coincideTipo && !coincideClase) return false;
        }
        return true;
    });
    
    lista.sort((a, b) => {
        if ((a.coste || 0) !== (b.coste || 0)) return (a.coste || 0) - (b.coste || 0);
        return a.nombre.localeCompare(b.nombre);
    });
    
    const listaActual = destino === 'jugador' ? tablero : enemyBoard;
    const banquilloActual = destino === 'jugador' ? banquillo : enemyBanquillo;
    const maxUnidades = destino === 'jugador' 
        ? (typeof maxUnidadesTablero === 'function' ? maxUnidadesTablero() : 6)
        : (typeof maxEnemyUnits === 'function' ? maxEnemyUnits() : 6);
    
    // 🆕 Sinergias ordenadas alfabéticamente (ignorando tildes)
    const TIPOS_ORDENADOS = ['Fuego','Agua','Planta','Eléctrico','Psíquico','Siniestro','Hada','Fantasma','Lucha','Veneno','Hielo','Dragón','Roca','Normal','Volador','Acero','Eevee']
        .slice()
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    const CLASES_ORDENADAS = ['Equilibrado','Atacante','At. Especial','Movimiento','Ágil','Defensa','Auxiliar']
        .slice()
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    let html = `
        <div class="creative-catalogo-header">
            <input type="text" class="creative-input" id="creativeBuscar-${destino}" 
                   placeholder="🔍 Buscar Pokémon..." 
                   value="${filtro.texto}">
            <select class="creative-select" id="creativeTipo-${destino}">
                <option value="todos">⚔️ Todas las sinergias</option>
                <optgroup label="Tipos">
                    ${TIPOS_ORDENADOS.map(t => 
                        `<option value="${t}" ${filtro.tipo === t ? 'selected' : ''}>${t}</option>`
                    ).join('')}
                </optgroup>
                <optgroup label="Clases">
                    ${CLASES_ORDENADAS.map(c => 
                        `<option value="${c}" ${filtro.tipo === c ? 'selected' : ''}>${c}</option>`
                    ).join('')}
                </optgroup>
            </select>
            <select class="creative-select" id="creativeCoste-${destino}">
                <option value="todos">💰 Todos los costes</option>
                ${[1,2,3,4,5].map(c => 
                    `<option value="${c}" ${filtro.coste == c ? 'selected' : ''}>⭐ Coste ${c}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="creative-estado">
            <span>📍 Tablero: <strong>${listaActual.filter(u => u).length}/${maxUnidades}</strong></span>
            <span>🎒 Banco: <strong>${banquilloActual.filter(u => u).length}/${CONFIG.BANQUILLO_MAXIMO}</strong></span>
            <span>📊 Resultados: <strong>${lista.length}</strong></span>
        </div>
        
        <div class="creative-grid" id="creativeGrid-${destino}">
    `;
    
    if (lista.length === 0) {
        html += `<div class="creative-vacio">No hay Pokémon que coincidan con los filtros</div>`;
    } else {
        for (let p of lista) {
            const spriteId = p.spriteId || p.id;
            const spriteUrl = typeof getSpriteUrl === 'function' 
                ? getSpriteUrl(spriteId, p.nombre) 
                : '';
            const escalaSprite = typeof getSpriteScale === 'function' ? getSpriteScale(spriteId) : 1;
            const offsetXSprite = typeof getSpriteOffsetX === 'function' ? getSpriteOffsetX(spriteId) : '0px';
            const coste = p.coste || 1;
            
            let tiposHtml = '';
            if (p.tipos) {
                tiposHtml = p.tipos.map(t => {
                    const icon = typeof getIconoTipo === 'function' ? getIconoTipo(t) : t;
                    return `<span class="creative-tipo-icon" title="${t}">${icon}</span>`;
                }).join('');
            }
            if (p.clase) {
                const icon = typeof getIconoClase === 'function' ? getIconoClase(p.clase) : p.clase;
                tiposHtml += `<span class="creative-tipo-icon" title="${p.clase}">${icon}</span>`;
            }
            
            html += `
                <div class="creative-card cost-${coste}" data-nombre="${p.nombre}" data-destino="${destino}">
                    <div class="creative-card-tipos">${tiposHtml}</div>
                    <div class="creative-card-coste">💰 ${coste}</div>
                    <img class="creative-card-sprite" src="${spriteUrl}" alt="${p.nombre}" style="--sprite-scale: ${escalaSprite}; --sprite-offset-x: ${offsetXSprite}" onerror="this.style.display='none'">
                    <div class="creative-card-nombre">${p.nombre}</div>
                </div>
            `;
        }
    }
    
    html += `</div>`;
    return html;
}

function conectarEventosCatalogo(destino) {
    const filtroKey = destino === 'jugador' ? 'pokemonJugador' : 'pokemonEnemigo';
    const input = document.getElementById(`creativeBuscar-${destino}`);
    const selectTipo = document.getElementById(`creativeTipo-${destino}`);
    const selectCoste = document.getElementById(`creativeCoste-${destino}`);
    const grid = document.getElementById(`creativeGrid-${destino}`);
    
    if (input) {
        input.addEventListener('input', function() {
            filtroCreative[filtroKey].texto = this.value;
            renderizarContenidoPanel();
        });
    }
    if (selectTipo) {
        selectTipo.addEventListener('change', function() {
            filtroCreative[filtroKey].tipo = this.value;
            renderizarContenidoPanel();
        });
    }
    if (selectCoste) {
        selectCoste.addEventListener('change', function() {
            filtroCreative[filtroKey].coste = this.value;
            renderizarContenidoPanel();
        });
    }
    
    if (grid) {
        grid.querySelectorAll('.creative-card').forEach(card => {
            card.addEventListener('click', function() {
                const nombre = this.dataset.nombre;
                creativeAñadirPokemon(nombre, destino);
            });
        });
    }
}

// ============================================================
// AÑADIR POKÉMON AL TABLERO
// ============================================================

function creativeAñadirPokemon(nombrePokemon, destino) {
    if (combatiendo) {
        addConsoleMessage('⛔ No puedes añadir Pokémon durante el combate', 'error');
        return;
    }
    
    const data = (typeof TODOS_POKEMONS !== 'undefined' ? TODOS_POKEMONS : POKEMONS)
        .find(p => p.nombre === nombrePokemon);
    
    if (!data) {
        addConsoleMessage(`❌ No se encontró ${nombrePokemon}`, 'error');
        return;
    }
    
    const listaTablero = destino === 'jugador' ? tablero : enemyBoard;
    const listaBanquillo = destino === 'jugador' ? banquillo : enemyBanquillo;
    const maxUnidades = destino === 'jugador' 
        ? (typeof maxUnidadesTablero === 'function' ? maxUnidadesTablero() : 6)
        : (typeof maxEnemyUnits === 'function' ? maxEnemyUnits() : 6);
    
    let hueco = -1;
    const ocupadasTablero = listaTablero.filter(u => u).length;
    
    if (ocupadasTablero < maxUnidades) {
        hueco = listaTablero.findIndex(x => x === null);
    }
    
        // 🆕 FIX: si el Pokémon es una evolución (base: false), forzar nivel 2★
    // para evitar que las fusiones salten niveles (Charmeleon 1★ → Charizard 2★).
    // Los Pokémon base siguen entrando a 1★ como antes.
    const esEvolucion = (data.base === false);
    const nivelInicial = esEvolucion ? 2 : 1;

    if (hueco === -1) {
        hueco = listaBanquillo.findIndex(x => x === null);
        if (hueco === -1) {
            addConsoleMessage(`❌ No hay espacio en tablero ni banquillo`, 'error');
            return;
        }
        const unidad = new Unidad(data, nivelInicial, data.id, data.coste);
        unidad.equipo = destino === 'jugador' ? 'player' : 'enemy';
        if (nivelInicial >= 2) {
            unidad.movSecundarioDesbloqueado = true;
        }
        listaBanquillo[hueco] = unidad;
        addConsoleMessage(`✅ ${nombrePokemon} ${nivelInicial}★ añadido al banquillo (${destino})`, 'success');
    } else {
        const unidad = new Unidad(data, nivelInicial, data.id, data.coste);
        unidad.equipo = destino === 'jugador' ? 'player' : 'enemy';
        if (nivelInicial >= 2) {
            unidad.movSecundarioDesbloqueado = true;
        }
        listaTablero[hueco] = unidad;
        addConsoleMessage(`✅ ${nombrePokemon} ${nivelInicial}★ añadido al tablero (${destino})`, 'success');
    }
    
    if (destino === 'jugador') {
        if (typeof aplicarSinergias === 'function') aplicarSinergias();
    } else {
        if (typeof aplicarSinergiasEnemigo === 'function') aplicarSinergiasEnemigo();
    }
    
    if (typeof renderizar === 'function') renderizar();
    renderizarContenidoPanel();
}

// ============================================================
// CATÁLOGO DE OBJETOS - CON SELECTOR DE LADO
// ============================================================

function construirCatalogoObjetos() {
    const filtro = filtroCreative.objetos;
    const todos = (typeof OBJETOS !== 'undefined') ? Object.keys(OBJETOS) : [];
    
    let lista = todos.filter(nombre => {
        if (filtro.texto && !nombre.toLowerCase().includes(filtro.texto.toLowerCase())) return false;
        if (filtro.tipo !== 'todos') {
            const obj = OBJETOS[nombre];
            if (filtro.tipo === 'chips' && !nombre.startsWith('Chip')) return false;
            if (filtro.tipo === 'normales' && nombre.startsWith('Chip')) return false;
            if (filtro.tipo === 'unico' && !obj.unico) return false;
        }
        return true;
    });
    
    lista.sort((a, b) => a.localeCompare(b));
    
    // ⬅️ Info de ambos baúles
    const baulJugadorCount = (typeof baulObjetos !== 'undefined') ? baulObjetos.length : 0;
    const baulEnemigoCount = (typeof enemyBaulObjetos !== 'undefined') ? enemyBaulObjetos.length : 0;
    const maxBaul = CONFIG.MAX_BAUL || 8;
    
    let html = `
        <div class="creative-catalogo-header">
            <input type="text" class="creative-input" id="creativeBuscar-objetos" 
                   placeholder="🔍 Buscar objeto..." 
                   value="${filtro.texto}">
            <select class="creative-select" id="creativeTipo-objetos">
                <option value="todos">📦 Todos los objetos</option>
                <option value="normales" ${filtro.tipo === 'normales' ? 'selected' : ''}>🎁 Objetos normales</option>
                <option value="chips" ${filtro.tipo === 'chips' ? 'selected' : ''}>🧩 Chips de tipo</option>
                <option value="unico" ${filtro.tipo === 'unico' ? 'selected' : ''}>⭐ Únicos</option>
            </select>
        </div>
        
        <!-- ⬅️ SELECTOR DE LADO -->
        <div class="creative-lado-selector">
            <div class="creative-lado-titulo">🎯 ¿A quién le das el objeto?</div>
            <div class="creative-lado-botones">
                <button class="creative-lado-btn ${ladoObjetosActivo === 'jugador' ? 'active jugador' : ''}" 
                        data-lado="jugador">
                    🛡️ JUGADOR
                    <span class="creative-lado-contador">${baulJugadorCount}/${maxBaul}</span>
                </button>
                <button class="creative-lado-btn ${ladoObjetosActivo === 'enemigo' ? 'active enemigo' : ''}" 
                        data-lado="enemigo">
                    🗡️ ENEMIGO
                    <span class="creative-lado-contador">${baulEnemigoCount}/${maxBaul}</span>
                </button>
            </div>
        </div>
        
        <div class="creative-estado">
            <span>🛡️ Baúl jugador: <strong>${baulJugadorCount}/${maxBaul}</strong></span>
            <span>🗡️ Baúl enemigo: <strong>${baulEnemigoCount}/${maxBaul}</strong></span>
            <span>📊 Resultados: <strong>${lista.length}</strong></span>
        </div>
        
        <div class="creative-grid creative-grid-objetos" id="creativeGrid-objetos">
    `;
    
    if (lista.length === 0) {
        html += `<div class="creative-vacio">No hay objetos que coincidan con los filtros</div>`;
    } else {
        for (let nombre of lista) {
            const obj = OBJETOS[nombre];
            
            let iconoHtml = '';
            if (obj.emoji && obj.emoji.includes('.png')) {
                iconoHtml = `<img src="${obj.emoji}" class="creative-objeto-icon" alt="${nombre}" onerror="this.style.display='none'">`;
            } else {
                iconoHtml = `<span class="creative-objeto-emoji">${obj.emoji || '📦'}</span>`;
            }
            
            // ⬅️ Clase según el lado activo
            const ladoClass = ladoObjetosActivo === 'jugador' ? 'lado-jugador' : 'lado-enemigo';
            
            html += `
                <div class="creative-objeto-card ${ladoClass}" data-nombre="${nombre}" title="${obj.descripcion || ''}">
                    ${iconoHtml}
                    <div class="creative-objeto-nombre">${nombre}</div>
                </div>
            `;
        }
    }
    
    html += `</div>`;
    return html;
}

function conectarEventosCatalogoObjetos() {
    const input = document.getElementById('creativeBuscar-objetos');
    const selectTipo = document.getElementById('creativeTipo-objetos');
    const grid = document.getElementById('creativeGrid-objetos');
    
    // ⬅️ Botones del selector de lado
    document.querySelectorAll('.creative-lado-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            ladoObjetosActivo = this.dataset.lado;
            addConsoleMessage(`🎯 Objetos ahora van al baúl: ${ladoObjetosActivo.toUpperCase()}`, 'info');
            renderizarContenidoPanel();
        });
    });
    
    if (input) {
        input.addEventListener('input', function() {
            filtroCreative.objetos.texto = this.value;
            renderizarContenidoPanel();
        });
    }
    if (selectTipo) {
        selectTipo.addEventListener('change', function() {
            filtroCreative.objetos.tipo = this.value;
            renderizarContenidoPanel();
        });
    }
    
    if (grid) {
        grid.querySelectorAll('.creative-objeto-card').forEach(card => {
            card.addEventListener('click', function() {
                const nombre = this.dataset.nombre;
                creativeAñadirObjeto(nombre, ladoObjetosActivo);
            });
        });
    }
}

// ============================================================
// AÑADIR OBJETO AL BAÚL (jugador o enemigo)
// ============================================================

function creativeAñadirObjeto(nombreObjeto, lado) {
    if (combatiendo) {
        addConsoleMessage('⛔ No puedes añadir objetos durante el combate', 'error');
        return;
    }
    
    const maxBaul = CONFIG.MAX_BAUL || 8;
    
    if (lado === 'jugador') {
        if (typeof baulObjetos === 'undefined') {
            addConsoleMessage('❌ baulObjetos no está definido', 'error');
            return;
        }
        if (baulObjetos.length >= maxBaul) {
            addConsoleMessage(`❌ Baúl del jugador lleno (${maxBaul} objetos máximo)`, 'error');
            return;
        }
        baulObjetos.push(nombreObjeto);
        addConsoleMessage(`✅ ${nombreObjeto} → Baúl JUGADOR`, 'success');
        
        if (typeof actualizarBadgeBaul === 'function') actualizarBadgeBaul();
        if (typeof actualizarObjetosVerticales === 'function') actualizarObjetosVerticales();
    } else {
        if (typeof enemyBaulObjetos === 'undefined') {
            addConsoleMessage('❌ enemyBaulObjetos no está definido', 'error');
            return;
        }
        if (enemyBaulObjetos.length >= maxBaul) {
            addConsoleMessage(`❌ Baúl del enemigo lleno (${maxBaul} objetos máximo)`, 'error');
            return;
        }
        enemyBaulObjetos.push(nombreObjeto);
        addConsoleMessage(`✅ ${nombreObjeto} → Baúl ENEMIGO`, 'success');
        
        if (typeof actualizarObjetosVerticalesEnemigo === 'function') actualizarObjetosVerticalesEnemigo();
    }
    
    if (typeof renderizar === 'function') renderizar();
    renderizarContenidoPanel();
}

// ============================================================
// ACCIONES RÁPIDAS
// ============================================================

function accionPoner3Estrellas() {
    if (combatiendo) {
        addConsoleMessage('⛔ No puedes hacer esto durante el combate', 'error');
        return;
    }
    
    let count = 0;
    
    function procesarLista(lista) {
        for (let i = 0; i < lista.length; i++) {
            if (lista[i] && !lista[i].esZacian) {
                let unidadActual = lista[i];
                for (let n = unidadActual.nivel; n < 3; n++) {
                    const evolucion = unidadActual.pokemon.evolucion;
                    if (evolucion) {
                        const evolData = getPokemonPorNombre(evolucion);
                        if (evolData) {
                            const nueva = new Unidad(evolData, n + 1, unidadActual.baseId, unidadActual.costeOriginal);
                            nueva.objetos = [...(unidadActual.objetos || [])];
                            nueva.equipo = unidadActual.equipo;
                            lista[i] = nueva;
                            unidadActual = nueva;
                        } else {
                            unidadActual.nivel = n + 1;
                            unidadActual.actualizarStats();
                        }
                    } else {
                        unidadActual.nivel = n + 1;
                        unidadActual.actualizarStats();
                    }
                }
                count++;
            }
        }
    }
    
    procesarLista(tablero);
    procesarLista(banquillo);
    procesarLista(enemyBoard);
    procesarLista(enemyBanquillo);
    
    aplicarSinergias();
    aplicarSinergiasEnemigo();
    renderizar();
    renderizarContenidoPanel();
    addConsoleMessage(`⭐ ${count} unidades puestas a 3★`, 'success');
}

function accionLimpiarTodo() {
    if (combatiendo) {
        addConsoleMessage('⛔ No puedes hacer esto durante el combate', 'error');
        return;
    }
    
    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i] && !tablero[i].esZacian) tablero[i] = null;
    }
    for (let i = 0; i < banquillo.length; i++) banquillo[i] = null;
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i] && !enemyBoard[i].esZacian) enemyBoard[i] = null;
    }
    for (let i = 0; i < enemyBanquillo.length; i++) enemyBanquillo[i] = null;
    
    aplicarSinergias();
    aplicarSinergiasEnemigo();
    renderizar();
    renderizarContenidoPanel();
    addConsoleMessage('🧹 Tableros limpiados', 'success');
}

function accionDarOro() {
    oro += 100;
    if (typeof enemyGold !== 'undefined') enemyGold += 100;
    
    actualizarInfoJugador();
    actualizarInfoEnemigo();
    renderizarContenidoPanel();
    addConsoleMessage(`💰 +100 oro (total: ${oro})`, 'success');
}

function accionNivelMaximo() {
    nivelJugador = CONFIG.NIVEL_MAXIMO;
    if (typeof enemyLevel !== 'undefined') enemyLevel = CONFIG.NIVEL_MAXIMO;
    experiencia = 0;
    
    actualizarInfoJugador();
    actualizarInfoEnemigo();
    renderizarContenidoPanel();
    addConsoleMessage(`⬆️ Nivel máximo (${nivelJugador})`, 'success');
}

function accionAvanzarRonda() {
    fase++;
    ronda = fase;
    document.getElementById('faseStats').innerHTML = `Ronda ${fase}`;
    
    if (!tiendaBloqueada) {
        generarTienda();
    }
    generarTiendaEnemigo();
    
    renderizar();
    renderizarContenidoPanel();
    addConsoleMessage(`🎲 Ronda avanzada a ${fase}`, 'success');
}

function accionResetCompleto(forzar = false) {
    const sinConfirmar = (forzar === true);
    if (!sinConfirmar && !confirm('¿Resetear TODO el estado del juego? (tableros, oro, nivel, ronda)')) return;
    if (typeof combatiendo !== 'undefined' && combatiendo) {
        addConsoleMessage('⏳ Espera a que termine el combate para resetear', 'info');
        return;
    }

    oro = 100;
    nivelJugador = 1;
    experiencia = 0;
    fase = 1;
    ronda = 1;
    vidaJugador = 50;
    racha = 0;
    victorias = 0;

    if (typeof enemyGold !== 'undefined') enemyGold = 100;
    if (typeof enemyLevel !== 'undefined') enemyLevel = 1;
    if (typeof enemyHealth !== 'undefined') enemyHealth = 50;
    if (typeof enemyWinStreak !== 'undefined') enemyWinStreak = 0;
    if (typeof enemyLossStreak !== 'undefined') enemyLossStreak = 0;
    if (typeof primerCombateRealizado !== 'undefined') primerCombateRealizado = false;
    if (typeof enemyPrimerCombateRealizado !== 'undefined') enemyPrimerCombateRealizado = false;

    // Devolver objetos al baúl antes de limpiar (incluye Zacian/Articuno)
    for (let i = 0; i < tablero.length; i++) {
        if (tablero[i] && !tablero[i].esZacian && !tablero[i].esArticuno) {
            if (typeof autoDevolverObjetosAlBaul === 'function') autoDevolverObjetosAlBaul(tablero[i], 'jugador');
        }
        tablero[i] = null;
    }
    for (let i = 0; i < banquillo.length; i++) {
        if (banquillo[i] && !banquillo[i].esZacian && !banquillo[i].esArticuno) {
            if (typeof autoDevolverObjetosAlBaul === 'function') autoDevolverObjetosAlBaul(banquillo[i], 'jugador');
        }
        banquillo[i] = null;
    }
    for (let i = 0; i < enemyBoard.length; i++) {
        if (enemyBoard[i] && !enemyBoard[i].esZacian && !enemyBoard[i].esArticuno) {
            if (typeof autoDevolverObjetosAlBaul === 'function') autoDevolverObjetosAlBaul(enemyBoard[i], 'enemigo');
        }
        enemyBoard[i] = null;
    }
    for (let i = 0; i < enemyBanquillo.length; i++) {
        if (enemyBanquillo[i] && !enemyBanquillo[i].esZacian && !enemyBanquillo[i].esArticuno) {
            if (typeof autoDevolverObjetosAlBaul === 'function') autoDevolverObjetosAlBaul(enemyBanquillo[i], 'enemigo');
        }
        enemyBanquillo[i] = null;
    }

    baulObjetos = [];
    if (typeof enemyBaulObjetos !== 'undefined') enemyBaulObjetos = [];
    tienda = [];
    if (typeof enemyTienda !== 'undefined') enemyTienda = [];
    if (typeof objetosEnTienda !== 'undefined') objetosEnTienda = [];
    if (typeof enemyObjetosEnTienda !== 'undefined') enemyObjetosEnTienda = [];
    if (typeof tiendaRonda2Comprada !== 'undefined') tiendaRonda2Comprada = false;
    if (typeof objetoCompradoEstaRonda !== 'undefined') objetoCompradoEstaRonda = false;
    if (typeof enemyObjetoCompradoEstaRonda !== 'undefined') enemyObjetoCompradoEstaRonda = false;

    window._ultimaVictoriaJugador = undefined;
    window._ultimoDanoRecibidoJugador = 0;
    window._ultimoRivalCombatido = null;
    window.fearAuraStacks = 0;
    window.enemyFearAuraStacks = 0;

    // Limpiar invocaciones especiales
    if (typeof zacianUnidad !== 'undefined') zacianUnidad = null;
    if (typeof articunoUnidad !== 'undefined') articunoUnidad = null;
    if (typeof zacianNivel !== 'undefined') zacianNivel = 0;
    if (typeof articunoActivado !== 'undefined') articunoActivado = false;
    if (typeof articunoVisible !== 'undefined') articunoVisible = false;
    window.zacianEnemigoUnidad = null;
    window.articunoEnemigoUnidad = null;
    const zc = document.getElementById('zacianContainer');
    if (zc) zc.style.display = 'none';
    const ac = document.getElementById('articunoContainer');
    if (ac) ac.style.display = 'none';

    // Quitar restos visuales del último combate
    const cov = document.getElementById('combatOverlay');
    if (cov) { cov.style.display = 'none'; cov.className = 'combat-overlay'; }
    const post = document.getElementById('postCombateOverlay');
    if (post) { post.classList.remove('visible'); post.style.display = 'none'; }
    document.body.classList.remove('celebrando', 'combatiendo');
    document.querySelectorAll('.board-cell.muerto').forEach(cell => { cell.style.display = ''; });

    aplicarSinergias();
    aplicarSinergiasEnemigo();
    renderizar();
    renderizarContenidoPanel();
    if (typeof actualizarInfoJugador === 'function') actualizarInfoJugador();
    if (typeof actualizarInfoEnemigo === 'function') actualizarInfoEnemigo();
    if (typeof actualizarContadorRondaVisual === 'function') actualizarContadorRondaVisual();
    addConsoleMessage('🗑️ Sandbox reiniciado: tableros, oro, objetos y nivel a cero.', 'success');
}

// 🧪 Botón RESET del sandbox: sin confirm para poder repetir rápido.
window.resetSandbox = function() { accionResetCompleto(true); };


function accionCombatir() {
    if (combatiendo) {
        addConsoleMessage('⛔ Ya hay un combate en curso', 'error');
        return;
    }
    
    if (tablero.filter(u => u).length === 0) {
        addConsoleMessage('❌ No tienes Pokémon en el tablero', 'error');
        return;
    }
    
    cerrarPanelCreativo();
    setTimeout(() => {
        if (typeof combatir === 'function') combatir();
    }, 300);
}

// ============================================================
// INICIALIZAR MODO CREATIVO
// ============================================================

function initModoCreativo() {
    console.log('🧪 Inicializando modo creativo...');
    
    window.modoCreativo = true;

    // 🧪 Mostrar el botón RESET solo en sandbox
    const btnResetSandbox = document.getElementById('btnResetSandbox');
    if (btnResetSandbox) btnResetSandbox.style.display = 'inline-flex';

    // 🧪 En creativo el ranking del torneo no pinta nada
    const rankingCreativo = document.getElementById('rankingTorneo');
    if (rankingCreativo) rankingCreativo.style.display = 'none';

            // 🆕 FIX: forzar el terreno creativo al entrar en Modo Creativo.
    // Usamos la función centralizada para que quede coherente.
    if (typeof window.aplicarTerrenoActual === 'function') {
        window.aplicarTerrenoActual(window.rivalActual);
    } else {
        document.body.style.setProperty('--terreno-actual', `url('../assets/backgrounds/terreno-creativo.png')`);
    }
    console.log('🎨 Terreno forzado a creativo (Modo Creativo)');
    
    abrirPanelCreativo();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F1' && window.modoCreativo) {
            e.preventDefault();
            togglePanelCreativo();
        }
    });
    
    addConsoleMessage('🧪 MODO CREATIVO ACTIVADO - Pulsa F1 para abrir el panel', 'success');
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.abrirPanelCreativo = abrirPanelCreativo;
window.cerrarPanelCreativo = cerrarPanelCreativo;
window.togglePanelCreativo = togglePanelCreativo;
window.initModoCreativo = initModoCreativo;
window.creativeAñadirObjeto = creativeAñadirObjeto;
