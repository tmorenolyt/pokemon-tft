// ============================================================
// CARTA DE SINERGIA - MODAL CENTRADO (v3.4)
// ============================================================
// v3.4: FIX AURA DE MIEDO — sincronización real con window.fearAuraStacks
//       y window.enemyFearAuraStacks. Si el jugador NO tiene Siniestro
//       ≥ 2 activo, se resetean ambos contadores antes de renderizar
//       para que el panel nunca muestre un valor congelado.
// ============================================================

let cartaSinergiaAbierta = false;
let cartaSinergiaData = null;

// ===== VERIFICAR SINERGIAS DISPONIBLES =====
function verificarSinergiasDisponibles() {
    console.log('📋 TIPOS DISPONIBLES:', Object.keys(TYPE_SYNERGIES || {}));
    console.log('📋 CLASES DISPONIBLES:', Object.keys(CLASS_SYNERGIES || {}));
}

// ===== COLORES POR TIPO =====
const COLORES_TIPO = {
    "Fuego": "#ff6b35",
    "Agua": "#4fc3f7",
    "Planta": "#66bb6a",
    "Eléctrico": "#ffd54f",
    "Psíquico": "#ce93d8",
    "Siniestro": "#78909c",
    "Hada": "#f48fb1",
    "Fantasma": "#9575cd",
    "Lucha": "#ef5350",
    "Veneno": "#ab47bc",
    "Hielo": "#80deea",
    "Dragón": "#7e57c2",
    "Roca": "#a1887f",
    "Normal": "#bdbdbd",
    "Volador": "#90caf9",
    "Acero": "#90a4ae",
    "Eevee": "#ffab91"
};

// ============================================================
// FORMATEAR DESCRIPCIÓN (párrafos + destacados)
// ============================================================

function formatearDescripcion(descripcion) {
    if (!descripcion || descripcion.trim() === '') {
        return '<p class="carta-descripcion-vacio">Sin descripción disponible.</p>';
    }

    const parrafos = descripcion.split(/\n\s*\n/);

    const formatearParrafo = (texto) => {
        return texto.replace(/\*\*(.+?)\*\*/g, '<span class="destacado">$1</span>');
    };

    return parrafos
        .map(p => `<p>${formatearParrafo(p.trim())}</p>`)
        .join('');
}

// ===== NORMALIZAR NOMBRE =====
function normalizarNombre(nombre) {
    if (!nombre) return '';
    return nombre.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== BUSCAR SINERGIA POR NOMBRE =====
function buscarSinergia(nombre, esClase = false) {
    if (esClase) {
        for (let key of Object.keys(CLASS_SYNERGIES)) {
            if (normalizarNombre(key) === normalizarNombre(nombre) || key === nombre) {
                return { key: key, data: CLASS_SYNERGIES[key], esClase: true };
            }
        }
        return null;
    } else {
        for (let key of Object.keys(TYPE_SYNERGIES)) {
            if (normalizarNombre(key) === normalizarNombre(nombre) || key === nombre) {
                return { key: key, data: TYPE_SYNERGIES[key], esClase: false };
            }
        }
        return null;
    }
}

// ===== ABRIR CARTA DE SINERGIA =====
function abrirCartaSinergia(tipo, esClase = false, lado = 'player') {
    // 🆕 Cerrar la carta de Pokémon si está abierta (solo un modal a la vez)
    if (typeof cartaAbierta !== 'undefined' && cartaAbierta) {
        if (typeof cerrarCarta === 'function') {
            cerrarCarta();
        }
    }

    // 🆕 Cerrar el panel de datos si está abierto
    if (typeof panelDatosCombateAbierto !== 'undefined' && panelDatosCombateAbierto) {
        if (typeof cerrarPanelDatosCombate === 'function') {
            cerrarPanelDatosCombate();
        }
    }

    let sinergiaData = obtenerDatosSinergia(tipo, esClase, lado);
    if (!sinergiaData) {
        addConsoleMessage(`❌ No se encontró la sinergia: ${tipo}`, 'error');
        return;
    }

    cartaSinergiaData = sinergiaData;
    cartaSinergiaAbierta = true;

    let panel = document.getElementById('cartaSinergiaPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'cartaSinergiaPanel';
        document.body.appendChild(panel);
    }

    renderizarCartaSinergia(panel, sinergiaData);
    panel.style.display = 'flex';
    panel.style.animation = 'none';
    void panel.offsetWidth;
    panel.style.animation = 'sinergiaModalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';

    playButtonSound();
}

// ===== ACTUALIZAR CARTA DE SINERGIA =====
function actualizarCartaSinergia() {
    if (!cartaSinergiaAbierta || !cartaSinergiaData) return;

    let panel = document.getElementById('cartaSinergiaPanel');
    if (!panel) return;

    let lado = cartaSinergiaData.lado || 'player';
    let nuevaData = obtenerDatosSinergia(cartaSinergiaData.nombre, cartaSinergiaData.esClase, lado);
    if (!nuevaData) return;

    cartaSinergiaData = nuevaData;
    renderizarCartaSinergia(panel, nuevaData);
}

// ===== CERRAR CARTA DE SINERGIA =====
function cerrarCartaSinergia() {
    const panel = document.getElementById('cartaSinergiaPanel');
    if (!panel) return;
    cartaSinergiaAbierta = false;
    cartaSinergiaData = null;
    panel.style.display = 'none';
    panel.onclick = null;
}

// ===== FAMILIA EVOLUTIVA =====
function obtenerFamiliaEvolutiva(nombrePokemon) {
    let pokemonData = null;
    for (let p of TODOS_POKEMONS) {
        if (p.nombre === nombrePokemon) {
            pokemonData = p;
            break;
        }
    }
    if (!pokemonData) return null;
    return getFamiliaEvolutiva(pokemonData);
}

function obtenerTodosDeFamilia(nombreBase) {
    let familia = obtenerFamiliaEvolutiva(nombreBase);
    if (!familia) return [nombreBase];
    let resultados = [];
    for (let p of TODOS_POKEMONS) {
        if (getFamiliaEvolutiva(p) === familia) {
            resultados.push(p.nombre);
        }
    }
    return resultados;
}

function obtenerCadenaEvolutiva(nombreBase) {
    let evoluciones = [nombreBase];
    let actual = nombreBase;
    let maxIter = 20, iter = 0;
    while (iter < maxIter) {
        iter++;
        let encontrado = false;
        for (let ev of TODOS_POKEMONS) {
            if (ev.evolucion === actual) {
                evoluciones.push(ev.nombre);
                actual = ev.nombre;
                encontrado = true;
                break;
            }
        }
        if (!encontrado) break;
    }
    return evoluciones;
}

// ===== OBTENER DATOS DE LA SINERGIA =====
function obtenerDatosSinergia(tipo, esClase = false, lado = 'player') {
    const sinergiaEncontrada = buscarSinergia(tipo, esClase);
    if (!sinergiaEncontrada) return null;

    const tipoReal = sinergiaEncontrada.key;
    const synergy = sinergiaEncontrada.data;
    const esClaseReal = sinergiaEncontrada.esClase;

    const listaTablero = (lado === 'enemy') ? enemyBoard : tablero;
    const listaBanquillo = (lado === 'enemy') ? enemyBanquillo : banquillo;

    let icono = '', nombre = tipoReal, niveles = [];
    let nivelActual = 0, nivelMaximo = 0, bonusActivo = '', nivelActivo = 0;
    let pokemons = [], color = '#fbbf24', chipBonus = 0;
    let todosPokemonsConSinergia = [];

    if (esClaseReal) {
        icono = getIconoClase(tipoReal);
        color = '#e1d4a3';

        const keys = Object.keys(synergy).map(Number).sort((a, b) => a - b);
        nivelMaximo = keys[keys.length - 1] || 0;

        let count = 0;
        let pokemonsProcesados = new Set();
        for (let u of listaTablero) {
            if (!u) continue;
            if (pokemonsProcesados.has(u.pokemon.nombre)) continue;
            if (u.pokemon.clase === tipoReal) {
                pokemonsProcesados.add(u.pokemon.nombre);
                count++;
            }
        }
        nivelActual = count;

        nivelActivo = 0;
        bonusActivo = 'Sin bonus activo';
        for (let i = keys.length - 1; i >= 0; i--) {
            if (nivelActual >= keys[i]) {
                nivelActivo = keys[i];
                bonusActivo = synergy[keys[i]].desc || '';
                break;
            }
        }

        for (let nivel of keys) {
            niveles.push({ nivel, desc: synergy[nivel].desc || '', alcanzado: nivelActual >= nivel });
        }

        for (let p of POKEMONS) {
            if (p.clase === tipoReal) todosPokemonsConSinergia.push(p);
        }

    } else {
        icono = getIconoTipo(tipoReal);
        color = COLORES_TIPO[tipoReal] || '#fbbf24';

        const keys = Object.keys(synergy).map(Number).sort((a, b) => a - b);
        nivelMaximo = keys[keys.length - 1] || 0;

        let count = 0;
        let familiasProcesadas = new Set();
        for (let u of listaTablero) {
            if (!u) continue;
            let familia = getFamiliaEvolutiva(u.pokemon);
            if (!familia || familiasProcesadas.has(familia)) continue;
            let pokemonBase = getPokemonPorNombre(familia);
            if (pokemonBase && pokemonBase.tipos && pokemonBase.tipos.includes(tipoReal)) {
                familiasProcesadas.add(familia);
                count++;
            }
        }

        chipBonus = 0;
        for (let u of listaTablero) {
            if (!u) continue;
            if (u.objetos && u.objetos.length > 0) {
                for (let objNombre of u.objetos) {
                    const objeto = OBJETOS[objNombre];
                    if (objeto && objeto.efecto && objeto.efecto.tipoBonus === tipoReal) {
                        chipBonus += objeto.efecto.bonusExtra || 1;
                    }
                }
            }
        }
        nivelActual = count + chipBonus;

        nivelActivo = 0;
        bonusActivo = 'Sin bonus activo';
        for (let i = keys.length - 1; i >= 0; i--) {
            if (nivelActual >= keys[i]) {
                nivelActivo = keys[i];
                bonusActivo = synergy[keys[i]].desc || '';
                break;
            }
        }

        for (let nivel of keys) {
            niveles.push({ nivel, desc: synergy[nivel].desc || '', alcanzado: nivelActual >= nivel });
        }

        for (let p of POKEMONS) {
            if (p.tipos && p.tipos.includes(tipoReal)) todosPokemonsConSinergia.push(p);
        }
    }

    // ===== MAPAS CON ÍNDICE =====
    let pokemonEnTablero = new Map();
    let pokemonEnBanquillo = new Map();

    for (let i = 0; i < listaTablero.length; i++) {
        let u = listaTablero[i];
        if (u) {
            pokemonEnTablero.set(u.pokemon.nombre, {
                nivel: u.nivel || 1,
                unidad: u,
                indice: i
            });
        }
    }

    for (let i = 0; i < listaBanquillo.length; i++) {
        let u = listaBanquillo[i];
        if (u) {
            pokemonEnBanquillo.set(u.pokemon.nombre, {
                nivel: u.nivel || 1,
                unidad: u,
                indice: i
            });
        }
    }

    for (let p of todosPokemonsConSinergia) {
        let enTablero = false;
        let enBanquillo = false;
        let nivelPokemon = 0;
        let ubicacion = 'ninguno';
        let pokemonEncontrado = null;
        let activo = false;
        let indiceReal = -1;
        let tipoUbicacion = '';

        if (pokemonEnTablero.has(p.nombre)) {
            const info = pokemonEnTablero.get(p.nombre);
            enTablero = true;
            activo = true;
            nivelPokemon = info.nivel;
            ubicacion = 'tablero';
            pokemonEncontrado = info.unidad;
            indiceReal = info.indice;
            tipoUbicacion = 'tablero';
        }

        if (!enTablero && !enBanquillo) {
            let todosDeFamilia = obtenerTodosDeFamilia(p.nombre);
            for (let nombreFamilia of todosDeFamilia) {
                if (nombreFamilia === p.nombre) continue;
                if (pokemonEnTablero.has(nombreFamilia)) {
                    const info = pokemonEnTablero.get(nombreFamilia);
                    activo = true;
                    ubicacion = 'familia';
                    enTablero = true;
                    indiceReal = info.indice;
                    tipoUbicacion = 'tablero';
                    pokemonEncontrado = info.unidad;
                    break;
                }
            }
        }

        if (!enTablero && !enBanquillo && pokemonEnBanquillo.has(p.nombre)) {
            const info = pokemonEnBanquillo.get(p.nombre);
            enBanquillo = true;
            activo = true;
            nivelPokemon = info.nivel;
            ubicacion = 'banquillo';
            pokemonEncontrado = info.unidad;
            indiceReal = info.indice;
            tipoUbicacion = 'banquillo';
        }

        if (!enTablero && !enBanquillo) {
            let todosDeFamilia = obtenerTodosDeFamilia(p.nombre);
            for (let nombreFamilia of todosDeFamilia) {
                if (nombreFamilia === p.nombre) continue;
                if (pokemonEnBanquillo.has(nombreFamilia)) {
                    const info = pokemonEnBanquillo.get(nombreFamilia);
                    enBanquillo = true;
                    activo = true;
                    ubicacion = 'banquillo';
                    indiceReal = info.indice;
                    tipoUbicacion = 'banquillo';
                    nivelPokemon = info.nivel;
                    pokemonEncontrado = info.unidad;
                    break;
                }
            }
        }

        let claseTablero = enTablero ? 'en-tablero' : (enBanquillo && activo ? 'en-banquillo' : 'no-disponible');

        pokemons.push({
            ...p,
            enTablero,
            enBanquillo,
            activo,
            nivelPokemon,
            ubicacion,
            coste: p.coste || 1,
            nombreReal: pokemonEncontrado ? pokemonEncontrado.pokemon.nombre : p.nombre,
            claseTablero,
            indiceReal,
            tipoUbicacion
        });
    }

    pokemons.sort((a, b) => {
        if (a.coste !== b.coste) return (a.coste || 1) - (b.coste || 1);
        if (a.activo && !b.activo) return -1;
        if (!a.activo && b.activo) return 1;
        return a.nombre.localeCompare(b.nombre);
    });

    return {
        tipo: tipoReal,
        esClase: esClaseReal,
        icono,
        nombre,
        color,
        nivelActual,
        nivelMaximo,
        bonusActivo,
        nivelActivo,
        niveles,
        pokemons,
        count: todosPokemonsConSinergia.length,
        chipBonus,
        lado
    };
}

// ============================================================
// 🆕 RENDERIZAR CARTA DE SINERGIA - MODAL CENTRADO Y COMPACTO
// ============================================================

function renderizarCartaSinergia(panel, data) {
    if (!data) return;

    const color = data.color || '#fbbf24';
    const esClase = data.esClase || false;
    const lado = data.lado || 'player';

    // ==== Estilos del overlay (contenedor) - SIN BLUR ====
    panel.className = '';
    panel.style.cssText = '';
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.width = '100vw';
    panel.style.height = '100vh';
    panel.style.background = 'transparent';
    panel.style.zIndex = '99998';
    panel.style.display = 'flex';
    panel.style.alignItems = 'center';
    panel.style.justifyContent = 'center';
    panel.style.padding = '20px';
    panel.style.overflow = 'auto';

    // ==== Click en el fondo cierra Y reenvía al elemento debajo ====
    panel.onclick = function (e) {
        if (e.target !== panel) return;

        const x = e.clientX;
        const y = e.clientY;

        cerrarCartaSinergia();

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

    const COSTE_COLORS = {
        1: { bg: 'linear-gradient(145deg, #49636a, #3a5258)', border: '#5a7a82' },
        2: { bg: 'linear-gradient(145deg, #336192, #264a75)', border: '#4a7aaa' },
        3: { bg: 'linear-gradient(145deg, #7d4695, #66357a)', border: '#9a5ab5' },
        4: { bg: 'linear-gradient(145deg, #c27647, #a86035)', border: '#da8a5a' },
        5: { bg: 'linear-gradient(145deg, #cea343, #b88a2a)', border: '#e8b85a' }
    };

    // ==== HTML del modal ====
    let html = `
        <div class="sinergia-modal" onclick="event.stopPropagation();">
            <div class="sinergia-modal-header">
                <div class="sinergia-modal-titulo">
                    <span class="sinergia-modal-icono">${data.icono}</span>
                    <span class="sinergia-modal-nombre">${data.nombre.toUpperCase()}</span>
                    ${lado === 'enemy' ? '<span class="sinergia-modal-lado-enemigo">ENEMIGO</span>' : ''}
                </div>
                <button class="sinergia-modal-cerrar" onclick="cerrarCartaSinergia()" title="Cerrar (Esc)">✕</button>
            </div>

            <div class="sinergia-modal-body">
                <div class="sinergia-modal-descripcion">
                    ${formatearDescripcion(DESCRIPCIONES_SINERGIA[data.nombre])}
                </div>

                <div class="sinergia-modal-seccion-titulo">🐾 POKÉMON</div>
                <div class="sinergia-modal-grid">
    `;

    for (let p of data.pokemons) {
        const coste = p.coste || 1;
        const spriteUrl = getSpriteUrl(p.spriteId, p.nombre);

        const indiceTablero = (p.indiceReal !== undefined) ? p.indiceReal : -1;
        const tipoEncontrado = p.tipoUbicacion || '';

        let tieneEvolucion = false;
        for (let ev of TODOS_POKEMONS) {
            if (ev.evolucion === p.nombre) {
                tieneEvolucion = true;
                break;
            }
        }
        let nombreMostrar = tieneEvolucion ? p.nombre + ' ➜' : p.nombre;

        const costeData = COSTE_COLORS[coste] || COSTE_COLORS[1];

        let borderColor = costeData.border;
        let bgColor = costeData.bg;
        let cursor = 'default';
        let opacity = 1;
        let onclickAttr = '';

        if (p.enTablero && indiceTablero !== -1) {
            borderColor = '#ffffff';
            cursor = 'pointer';
            onclickAttr = `onclick="event.stopPropagation(); abrirCarta('${lado === 'enemy' ? 'enemigo' : 'tablero'}', ${indiceTablero});"`;
        } else if (p.enBanquillo && indiceTablero !== -1) {
            borderColor = '#a78bfa';
            cursor = 'pointer';
            onclickAttr = `onclick="event.stopPropagation(); abrirCarta('${lado === 'enemy' ? 'enemigoBanquillo' : 'banquillo'}', ${indiceTablero});"`;
        } else if (!p.enTablero && !p.enBanquillo && p.activo) {
            borderColor = '#ffffff';
        } else {
            opacity = 0.35;
            bgColor = 'rgba(0,0,0,0.15)';
            borderColor = 'transparent';
        }

        html += `
            <div class="sinergia-modal-card" ${onclickAttr} style="
                background:${bgColor};
                border-color:${borderColor};
                cursor:${cursor};
                opacity:${opacity};
            ">
                <span class="sinergia-modal-coste">💰 ${coste}</span>
                <img src="${spriteUrl}" alt="${p.nombre}" draggable="false"
                     onerror="this.style.display='none'">
                <span class="sinergia-modal-pokemon-nombre">${nombreMostrar}</span>
            </div>
        `;
    }

    html += `
                </div>

                <div class="sinergia-modal-seccion-titulo">📊 NIVELES</div>
                <div class="sinergia-modal-niveles">
    `;

    for (let nivel of data.niveles) {
        const alcanzado = nivel.alcanzado || false;
        const isActive = alcanzado && nivel.nivel === data.nivelActivo;

        html += `
            <div class="sinergia-modal-nivel ${isActive ? 'activo' : ''} ${alcanzado ? 'alcanzado' : ''}">
                <span class="sinergia-modal-nivel-num">Nv ${nivel.nivel}</span>
                <span class="sinergia-modal-nivel-desc">${nivel.desc}</span>
                <span class="sinergia-modal-nivel-check">${alcanzado ? (isActive ? '▶' : '✅') : '◻'}</span>
            </div>
        `;
    }

    html += `</div>`;

    // Panel de Semillas Revivir (solo Planta, tipo)
    if (data.nombre === "Planta" && !data.esClase) {
        html += `<div id="nuevaVerdeContainer" data-lado="${lado}"></div>`;
    }

    // 🆕 Panel de Aura de Miedo (solo Siniestro, tipo)
    if (data.nombre === "Siniestro" && !data.esClase) {
        html += `<div id="auraMiedoContainer" data-lado="${lado}"></div>`;
    }

    html += `</div></div>`;

    panel.innerHTML = html;

    if (data.nombre === "Planta" && !data.esClase) {
        setTimeout(() => {
            if (typeof refrescarPanelNuevaVerde === 'function') {
                refrescarPanelNuevaVerde(lado);
            }
        }, 0);
    }

    // 🆕 Refrescar el panel de Siniestro (FORZADO)
    if (data.nombre === "Siniestro" && !data.esClase) {
        setTimeout(() => {
            if (typeof refrescarPanelAuraMiedo === 'function') {
                refrescarPanelAuraMiedo(lado);
            } else {
                console.warn("⚠️ refrescarPanelAuraMiedo no está definida");
            }
        }, 10);
    }
}

// ===== INICIALIZAR =====
function initCartaSinergia() {
    verificarSinergiasDisponibles();

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && cartaSinergiaAbierta) {
            cerrarCartaSinergia();
            e.preventDefault();
        }
    });
}

window.abrirCartaSinergia = abrirCartaSinergia;
window.cerrarCartaSinergia = cerrarCartaSinergia;
window.actualizarCartaSinergia = actualizarCartaSinergia;
window.obtenerDatosSinergia = obtenerDatosSinergia;
window.renderizarCartaSinergia = renderizarCartaSinergia;
window.cartaSinergiaAbierta = cartaSinergiaAbierta;
window.cartaSinergiaData = cartaSinergiaData;
window.initCartaSinergia = initCartaSinergia;


if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initCartaSinergia();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        initCartaSinergia();
    });
}