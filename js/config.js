// ============================================================
// MITIGACIÓN POR DEFENSA
// daño = ataque × (1 − defensa / (defensa + DEFENSA_K))
// 100 = fórmula original; 300 = menos mitigación y combates más cortos.
// ============================================================
window.DEFENSA_K = 300;

// ============================================================
// CONFIGURACIÓN GLOBAL DEL JUEGO - v3 (POOL RESTA AL COMPRAR)
// ============================================================

const CONFIG = {
    NIVEL_MAXIMO: 8,
    TOTAL_CASILLAS: 20,
    BANQUILLO_MAXIMO: 8,
    MAX_BAUL: 8,
    COSTES_NIVEL: [4, 8, 20, 24, 36, 48, 60],
    VIDA_MAX_JUGADOR: 50,   // 🆕 vida máxima para la barra de HP

    // 🆕 POOL_LIMITS: copias totales por coste.
    // El pool RESTA al comprar y NO se recupera al fusionar.
    // Subidos para que Mewtwo 3★ sea posible (necesita 9 copias).
    //   1: 20 → 2× Venusaur 3★ (9+9) + 2 sobrantes
    //   2: 16 → 1× Blastoise 3★ (9) + 7 sobrantes
    //   3: 13 → 1× Absol 3★ (9) + 4 sobrantes
    //   4: 11 → 1× Dragonite 3★ (9) + 2 sobrantes
    //   5: 10 → 1× Mewtwo 3★ (9) + 1 sobrante ✅
    POOL_LIMITS: { 1: 20, 2: 16, 3: 13, 4: 11, 5: 10 },

    SPRITE_BASE_URL: "assets/sprites/pokemon/",
    SOUND_BASE_URL: "assets/sounds/",
    ICON_BASE_URL: "assets/icons/",
    CRY_BASE_URL: "assets/sounds/cries/",
    UI_SOUND_URL: "assets/sounds/ui/",

    SPRITE_EXTENSION_PREFERIDA: 'gif',
    SPRITE_EXTENSION_FALLBACK: 'png'
};

const SHOP_ODDS = {
    1: {1:1.00, 2:0.00, 3:0.00, 4:0.00, 5:0.00},
    2: {1:0.73, 2:0.27, 3:0.00, 4:0.00, 5:0.00},
    3: {1:0.65, 2:0.35, 3:0.00, 4:0.00, 5:0.00},
    4: {1:0.57, 2:0.40, 3:0.03, 4:0.00, 5:0.00},
    5: {1:0.40, 2:0.50, 3:0.10, 4:0.00, 5:0.00},
    6: {1:0.35, 2:0.40, 3:0.22, 4:0.03, 5:0.00},
    7: {1:0.24, 2:0.36, 3:0.30, 4:0.10, 5:0.02},
    8: {1:0.10, 2:0.20, 3:0.40, 4:0.26, 5:0.04}
};

window.DEBUG_SINERGIAS = false;
window.DEBUG_COMBATE = false;

// 🔇 Flags de depuración (por defecto APAGADOS en producción).
//    Actívalos en consola (F12):  window.DEBUG = true
//      o  window.DEBUG_COMBATE_LOG = true  para ver el spam de ataques básicos.
window.DEBUG = false;              // Flag maestro: habilita logs de TRAZA (spam).
window.DEBUG_COMBATE_LOG = false;  // Solo el spam "⚔️ BÁSICO …" de cada ataque básico.

function debugLog(...args) {
    if (window.DEBUG_SINERGIAS) console.log(...args);
}

function debugLogCombate(...args) {
    if (window.DEBUG_COMBATE) console.log(...args);
}

// Log genérico de traza: solo imprime cuando el flag maestro está activo.
function debugTrace(...args) {
    if (window.DEBUG) console.log(...args);
}

// ============================================================
// ICONOS DE TIPO / CLASE
// ============================================================

function getIconoTipo(tipo) {
    const iconos = {
        "Fuego": "tipos/fuego.png",
        "Agua": "tipos/agua.png",
        "Planta": "tipos/planta.png",
        "Eléctrico": "tipos/electrico.png",
        "Psíquico": "tipos/psiquico.png",
        "Siniestro": "tipos/siniestro.png",
        "Hada": "tipos/hada.png",
        "Fantasma": "tipos/fantasma.png",
        "Lucha": "tipos/lucha.png",
        "Veneno": "tipos/veneno.png",
        "Hielo": "tipos/hielo.png",
        "Dragón": "tipos/dragon.png",
        "Roca": "tipos/roca.png",
        "Normal": "tipos/normal.png",
        "Volador": "tipos/volador.png",
        "Acero": "tipos/acero.png",
        "Eevee": "tipos/eevee.png"
    };

    if (iconos[tipo]) {
        return `<img src="${CONFIG.ICON_BASE_URL}${iconos[tipo]}" class="tipo-icon" alt="${tipo}" title="${tipo}">`;
    }

    const emojis = {
        "Fuego":"🔥", "Agua":"💧", "Planta":"🌿", "Eléctrico":"⚡",
        "Psíquico":"🧠", "Siniestro":"🌙", "Hada":"🎀", "Fantasma":"👻",
        "Lucha":"👊", "Veneno":"☠️", "Hielo":"❄️", "Dragón":"🐉",
        "Roca":"🪨", "Normal":"⚪", "Volador":"🪶", "Acero":"🔩",
        "Eevee":"🦊"
    };
    return emojis[tipo] || "⭐";
}

function getIconoClase(clase) {
    const iconos = {
        "Equilibrado": "clases/equilibrado.png",
        "Atacante": "clases/atacante.png",
        "At. Especial": "clases/at_especial.png",
        "Movimiento": "clases/movimiento.png",
        "Ágil": "clases/agil.png",
        "Defensa": "clases/defensa.png",
        "Auxiliar": "clases/auxiliar.png"
    };

    if (iconos[clase]) {
        return `<img src="${CONFIG.ICON_BASE_URL}${iconos[clase]}" class="clase-icon" alt="${clase}" title="${clase}">`;
    }

    const emojis = {
        "Equilibrado":"💪", "Atacante":"🥊", "At. Especial":"🎯",
        "Movimiento":"💥", "Ágil":"💫", "Defensa":"🛡️", "Auxiliar":"💛"
    };
    return emojis[clase] || "⭐";
}

// ============================================================
// ✨ SHINY - CONSTANTES Y HELPERS
// ============================================================

// Probabilidad de shiny por slot de tienda (1/512 ≈ 0.20%)
const SHINY_CHANCE = 1 / 512;
window.SHINY_CHANCE = SHINY_CHANCE;

function tirarDadoShiny() {
    return Math.random() < SHINY_CHANCE;
}
window.tirarDadoShiny = tirarDadoShiny;

// ============================================================
// 🖼️ SPRITES - AHORA CON PARÁMETRO esShiny
// ============================================================

function getSpriteUrl(spriteId, nombre, esShiny = false) {
    let idFinal = spriteId;
    if (nombre === "Vulpix") idFinal = 10103;
    else if (nombre === "Ninetales") idFinal = 10104;

    const carpeta = esShiny ? 'shiny/' : '';
    return `${CONFIG.SPRITE_BASE_URL}${carpeta}${idFinal}.${CONFIG.SPRITE_EXTENSION_PREFERIDA}`;
}

function getSpriteUrlFallback(spriteId, nombre, esShiny = false) {
    let idFinal = spriteId;
    if (nombre === "Vulpix") idFinal = 10103;
    else if (nombre === "Ninetales") idFinal = 10104;

    const carpeta = esShiny ? 'shiny/' : '';
    return `${CONFIG.SPRITE_BASE_URL}${carpeta}${idFinal}.${CONFIG.SPRITE_EXTENSION_FALLBACK}`;
}

function getSpriteUrlOriginal(unidad) {
    if (!unidad || !unidad.pokemon) return '';
    const spriteId = unidad.pokemon.spriteId || unidad.pokemon.id;
    const esShiny = unidad.esShiny === true;
    return getSpriteUrlFallback(spriteId, unidad.pokemon.nombre, esShiny);
}

function getSpriteScale(spriteId) {
    if (typeof SPRITE_SCALE === 'undefined') return 1;
    const key = String(spriteId);
    return SPRITE_SCALE[key] || 1;
}

function getSpriteOffsetX(spriteId) {
    if (typeof SPRITE_OFFSET_X === 'undefined') return '0px';
    const key = String(spriteId);
    return SPRITE_OFFSET_X[key] || '0px';
}

// ============================================================
// PRECARGA DE SPRITES + CACHÉ DE FORMATO (evita parpadeo GIF→PNG)
// ============================================================

// Caché del formato resuelto por sprite (gif | png) según sea shiny o no.
// Cada sprite se resuelve una sola vez al arrancar, de modo que render.js
// pueda emitir directamente la URL correcta sin la cadena onerror que
// provocaba el parpadeo (GIF roto → PNG) en cada re-render del tablero.
const SPRITE_FORMATO_CACHE = {};
window.SPRITE_FORMATO_CACHE = SPRITE_FORMATO_CACHE;

function claveSprite(spriteId, esShiny) {
    return (esShiny ? 's:' : 'n:') + spriteId;
}

function formatoSpriteResuelto(spriteId, esShiny) {
    return SPRITE_FORMATO_CACHE[claveSprite(spriteId, esShiny)] || null;
}
window.formatoSpriteResuelto = formatoSpriteResuelto;

function _probarFormatoSprite(spriteId, esShiny) {
    const carpeta = esShiny ? 'shiny/' : '';
    const base = CONFIG.SPRITE_BASE_URL + carpeta + spriteId;
    const key = claveSprite(spriteId, esShiny);
    const img = new Image();
    img.onload = function () { SPRITE_FORMATO_CACHE[key] = 'gif'; };
    img.onerror = function () {
        // El GIF no existe → probamos el PNG de fallback
        const img2 = new Image();
        img2.onload = function () { SPRITE_FORMATO_CACHE[key] = 'png'; };
        img2.onerror = function () { SPRITE_FORMATO_CACHE[key] = 'png'; };
        img2.src = base + '.' + CONFIG.SPRITE_EXTENSION_FALLBACK;
    };
    img.src = base + '.' + CONFIG.SPRITE_EXTENSION_PREFERIDA;
}

function precargarSprites() {
    if (typeof document === 'undefined') return;
    if (typeof TODOS_POKEMONS === 'undefined') return;

    const spriteIds = new Set();
    for (let p of TODOS_POKEMONS) {
        if (p.spriteId) spriteIds.add(p.spriteId);
    }

    for (let id of spriteIds) {
        _probarFormatoSprite(id, false);
    }

    if (spriteIds.size > 0) {
        console.log(`🎬 Precargando y resolviendo formato de ${spriteIds.size} sprite(s)`);
    }
}

window.precargarSprites = precargarSprites;

// ============================================================
// ESTRELLAS
// ============================================================

function getEstrellasUrl(nivel) {
    if (nivel <= 1) return `${CONFIG.ICON_BASE_URL}estrellas/rank1.png`;
    if (nivel === 2) return `${CONFIG.ICON_BASE_URL}estrellas/rank2.png`;
    return `${CONFIG.ICON_BASE_URL}estrellas/rank3.png`;
}

function getPokemonPorNombre(nombre) {
    return TODOS_POKEMONS.find(p => p.nombre === nombre) || null;
}

function getPokemonPorCoste(coste) {
    return POKEMONS.filter(p => p.coste === coste);
}

function getFamiliaEvolutiva(pokemon) {
    if (!pokemon) return null;
    let base = pokemon;
    let encontrado = true;
    let maxIter = 20;
    let iter = 0;
    while (encontrado && iter < maxIter) {
        encontrado = false;
        iter++;
        for (let p of TODOS_POKEMONS) {
            if (p.evolucion === base.nombre) {
                base = p;
                encontrado = true;
                break;
            }
        }
    }
    return base.nombre;
}

function getTodosLosTiposYClases(unidad) {
    let tipos = unidad.pokemon.tipos || [];
    let clases = unidad.pokemon.clase ? [unidad.pokemon.clase] : [];
    return { tipos, clases };
}

// ============================================================
// TIENDA DE OBJETOS + RONDAS PvE
// ============================================================
// Rondas PvE (monstruos): 1, 6, 12, 18, 24, 30...
//   Fórmula: r === 1 || (r >= 6 && (r - 6) % 6 === 0)
//
// Rondas con tienda de objetos + tienda Pokémon + oro (PvP): 3, 9, 15, 21, 27...
//   Fórmula: r >= 3 && (r - 3) % 6 === 0
//
// El resto de rondas PvP: solo tienda de Pokémon + oro normal.
// ============================================================

const RONDAS_PVE = [1, 6, 12, 18, 24, 30, 36, 42];

function esRondaPvEConfig(rondaParam) {
    const r = (typeof rondaParam === 'number') ? rondaParam : fase;
    if (r === 1) return true;
    if (r >= 6 && (r - 6) % 6 === 0) return true;
    return false;
}

function esRondaTiendaObjetosConfig(rondaParam) {
    const r = (typeof rondaParam === 'number') ? rondaParam : fase;
    
    // Ronda 1: sin tienda de objetos
    if (r === 1) return false;
    
    // 🆕 FIX PUNTO 3: Las rondas PvE (6, 12, 18, 24...) NO tienen tienda de objetos.
    // La tienda sale en la ronda SIGUIENTE (7, 13, 19, 25...).
    if (r >= 6 && (r - 6) % 6 === 0) return false;
    
    // Rondas PvP con tienda de objetos: 3, 7, 9, 13, 15, 19, 21, 25...
    if (r >= 3 && (r - 3) % 6 === 0) return true;   // 3, 9, 15, 21...
    if (r >= 7 && (r - 7) % 6 === 0) return true;   // 7, 13, 19, 25...
    
    return false;
}

// Alias para no romper el código existente que llama a debeAparecerTiendaObjetos()
function debeAparecerTiendaObjetos(rondaParam) {
    return esRondaTiendaObjetosConfig(rondaParam);
}

// ============================================================
// MAX UNIDADES
// ============================================================

const TABLA_MAX_UNIDADES = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 6, 8: 6
};

function maxUnidadesTablero() {
    let maximo = TABLA_MAX_UNIDADES[nivelJugador] || 1;
    let tieneZacian = false;
    for (let u of tablero) {
        if (u && u.esZacian) { tieneZacian = true; break; }
    }
    if (tieneZacian) return maximo + 1;
    return maximo;
}

function getExpNecesaria() {
    if (nivelJugador >= CONFIG.NIVEL_MAXIMO) return 0;
    return CONFIG.COSTES_NIVEL[nivelJugador - 1];
}

function maxEnemyUnits() {
    let maximo = TABLA_MAX_UNIDADES[enemyLevel] || 1;
    let tieneZacianEnemigo = false;
    for (let u of enemyBoard) {
        if (u && u.esZacian) { tieneZacianEnemigo = true; break; }
    }
    if (tieneZacianEnemigo) return maximo + 1;
    return maximo;
}

function getInteres() {
    return Math.min(3, Math.floor(oro / 10));
}

function getRachaBonus() {
    return racha >= 5 ? 3 : (racha >= 3 ? 2 : (racha >= 2 ? 1 : (racha <= -4 ? 2 : (racha <= -2 ? 1 : 0))));
}

// ============================================================
// DAÑO POR DERROTA - MODELO POR TRAMOS
// ============================================================
// Daño total = BASE_DE_LA_RONDA + nº de unidades vivas del ganador
//
// Base por tramos de ronda (tabla acordada):
//   Ronda 1-9    → +2   (3 vivos = 5 HP)
//   Ronda 10-12  → +3   (3 vivos = 6 HP)
//   Ronda 13-19  → +4   (3 vivos = 7 HP)
//   Ronda 20     → +5   (3 vivos = 8 HP)
//   Ronda 21+    → +7   (3 vivos = 10 HP)
//
// Extra: +1 HP por CADA Pokémon vivo del ganador.
// Rondas PvE en 1J: nadie pierde HP.
// ============================================================

function getDañoBasePorRonda(ronda) {
    const r = (typeof ronda === 'number') ? ronda : fase;
    if (r >= 21) return 7;
    if (r >= 20) return 5;
    if (r >= 13) return 4;
    if (r >= 10) return 3;
    return 2;
}

// ============================================================
// 💿 DISCOS DEFINITIVOS POR EQUIPO (espejo del jugador: nivel 5 y 8)
// ============================================================
function maxDiscosPorNivelEquipo(nivel) {
    const n = Number(nivel) || 1;
    if (n >= 8) return 2;   // nivel 8 → 2º disco
    if (n >= 5) return 1;   // nivel 5 → 1er disco
    return 0;
}

function contarDiscosEnUnidades(unidades) {
    let n = 0;
    for (const u of (unidades || [])) {
        if (!u || !Array.isArray(u.objetos)) continue;
        for (const o of u.objetos) {
            const od = (typeof OBJETOS !== 'undefined') ? OBJETOS[o] : null;
            if (od && od.efecto && od.efecto.esDiscoUlti) n++;
        }
    }
    return n;
}

function getDañoPorDerrota() {
    const base = getDañoBasePorRonda(fase);
    // Si la ronda es PvE, el daño es 0.
    // 👥 En 2P no hay rondas PvE (PvP puro): nunca devolvemos 0 por esto.
    if (window.modoDosJugadores !== true && typeof esRondaPvE === 'function' && esRondaPvE(fase)) {
        return 0;
    }
    return base;
}

function getDañoRealPorDerrota(unidadesVivasGanador, ronda) {
    const r = (typeof ronda === 'number') ? ronda : fase;
    const es2P = (window.modoDosJugadores === true);

    // Rondas PvE: nadie pierde HP (en 2P no hay PvE, así que no aplica).
    if (!es2P && typeof esRondaPvE === 'function' && esRondaPvE(r)) {
        return 0;
    }

    const base = getDañoBasePorRonda(r);

    const vivas = Math.max(0, Math.floor(unidadesVivasGanador || 0));

    // +1 por CADA unidad viva del ganador (sistema chino)
    const dañoTotal = base + vivas;

    // Cap de seguridad: nunca más de 20 HP de golpe
    return Math.min(dañoTotal, 20);
}

window.getDañoBasePorRonda = getDañoBasePorRonda;
window.getDañoPorDerrota = getDañoPorDerrota;
window.getDañoRealPorDerrota = getDañoRealPorDerrota;
window.maxDiscosPorNivelEquipo = maxDiscosPorNivelEquipo;
window.contarDiscosEnUnidades = contarDiscosEnUnidades;

function calcularFearAuraBonus(stacks) {
    if (stacks >= 60) return 0.60;
    if (stacks >= 40) return 0.40;
    if (stacks >= 25) return 0.30;
    if (stacks >= 15) return 0.20;
    if (stacks >= 5) return 0.10;
    return 0;
}

function contarHadasEnTablero() {
    let count = 0;
    for (let u of tablero) {
        if (!u || u.esZacian || u.esArticuno) continue;
        if (u.pokemon.tipos && u.pokemon.tipos.includes("Hada")) count++;
        if (u.objetos && u.objetos.length > 0) {
            for (let objNombre of u.objetos) {
                const objeto = OBJETOS[objNombre];
                if (objeto && objeto.efecto && objeto.efecto.tipoBonus === "Hada") {
                    count += objeto.efecto.bonusExtra || 1;
                }
            }
        }
    }
    return count;
}

// ============================================================
// ICONOS DE OBJETOS
// ============================================================

const ICONOS_OBJETOS = "assets/icons/objetos/";

function getIconoObjeto(nombre) {
    const archivos = {
        "Moneda Amuleto": "moneda-amuleto.png",
        "Chaleco Asalto": "chaleco-asalto.png",
        "Barrera Auxiliar": "barrera-auxiliar.png",
        "Colgante Carga": "colgante-carga.png",
        "Pañuelo Elección": "panuelo-eleccion.png",
        "Gafas Elección": "gafas-eleccion.png",
        "Capa Furtiva": "capa-furtiva.png",
        "Brazalete Condena": "brazalete-condena.png",
        "Incienso Condena": "incienso-condena.png",
        "Corona Drenaje": "corona-drenaje.png",
        "Cinta Focus": "cinta-focus.png",
        "Roca del Rey": "roca-rey.png",
        "Restos": "restos.png",
        "Huevo Suerte": "huevo-suerte.png",
        "Metrónomo": "metronomo.png",
        "Cinta Fuerte": "cinta-fuerte.png",
        "Garra Rápida": "garra-rapida.png",
        "Máscara de Ira": "mascara-ira.png",
        "Pañuelo Combo": "panuelo-combo.png",
        "Capucha Rescate": "capucha-rescate.png",
        "Casco Dentado": "casco-dentado.png",
        "Cuchara Peculiar": "cuchara-peculiar.png",
        "Bola de Humo": "bola-humo.png",
        "Seguro Debilidad": "seguro-debilidad.png",
        "Gafas Especiales": "gafas-especiales.png",
        "Chip Siniestro": "chip-siniestro.png",
        "Chip Eevee": "chip-eevee.png",
        "Chip Hada": "chip-hada.png",
        "Chip Lucha": "chip-lucha.png",
        "Chip Fuego": "chip-fuego.png",
        "Chip Planta": "chip-planta.png",
        "Chip Hielo": "chip-hielo.png",
        "Chip Veneno": "chip-veneno.png",
        "Chip Psíquico": "chip-psiquico.png"
    };
    const archivo = archivos[nombre] || "default.png";
    return `${ICONOS_OBJETOS}${archivo}`;
}

// ============================================================
// MODELO HORIZONTAL 4×5 LINEAL
// ============================================================

const COLUMNAS_ARENA = 4;
const FILAS_ARENA = 5;
const TOTAL_CASILLAS_LADO = COLUMNAS_ARENA * FILAS_ARENA;
const COLUMNAS_GLOBALES = COLUMNAS_ARENA * 2;
const TOTAL_FILAS_GLOBALES = FILAS_ARENA;

const LETRAS_JUGADOR = ['A', 'B', 'C', 'D'];
const LETRAS_ENEMIGO = ['E', 'F', 'G', 'H'];

function coordsDesdeIndice(indice, lado) {
    const filaLocal = Math.floor(indice / COLUMNAS_ARENA);
    const colLocal  = indice % COLUMNAS_ARENA;

    if (lado === 'player') {
        return { _filaGlobal: filaLocal, _colGlobal: colLocal };
    } else {
        return { _filaGlobal: filaLocal, _colGlobal: 4 + colLocal };
    }
}

function indiceDesdeCoords(_filaGlobal, _colGlobal) {
    if (_filaGlobal < 0 || _filaGlobal >= FILAS_ARENA) return null;
    if (_colGlobal < 0 || _colGlobal >= COLUMNAS_GLOBALES) return null;

    if (_colGlobal <= 3) {
        return { lado: 'player', indice: _filaGlobal * COLUMNAS_ARENA + _colGlobal };
    } else {
        return { lado: 'enemy', indice: _filaGlobal * COLUMNAS_ARENA + (_colGlobal - 4) };
    }
}

function indiceLocalDesdeCoords(_filaGlobal, _colGlobal, lado) {
    if (_filaGlobal < 0 || _filaGlobal >= FILAS_ARENA) return -1;

    if (lado === 'player') {
        if (_colGlobal < 0 || _colGlobal > 3) return -1;
        return _filaGlobal * COLUMNAS_ARENA + _colGlobal;
    } else {
        if (_colGlobal < 4 || _colGlobal > 7) return -1;
        return _filaGlobal * COLUMNAS_ARENA + (_colGlobal - 4);
    }
}

function distanciaManhattanGlobal(a, b) {
    if (!a || !b) return Infinity;
    const fa = (typeof a._filaGlobal === 'number') ? a._filaGlobal : 0;
    const ca = (typeof a._colGlobal  === 'number') ? a._colGlobal  : 0;
    const fb = (typeof b._filaGlobal === 'number') ? b._filaGlobal : 0;
    const cb = (typeof b._colGlobal  === 'number') ? b._colGlobal  : 0;
    return Math.abs(fa - fb) + Math.abs(ca - cb);
}

function distanciaChebyshevGlobal(a, b) {
    if (!a || !b) return Infinity;
    const fa = (typeof a._filaGlobal === 'number') ? a._filaGlobal : 0;
    const ca = (typeof a._colGlobal  === 'number') ? a._colGlobal  : 0;
    const fb = (typeof b._filaGlobal === 'number') ? b._filaGlobal : 0;
    const cb = (typeof b._colGlobal  === 'number') ? b._colGlobal  : 0;
    return Math.max(Math.abs(fa - fb), Math.abs(ca - cb));
}

function casillaValidaGlobal(_filaGlobal, _colGlobal) {
    return _filaGlobal >= 0 && _filaGlobal < FILAS_ARENA &&
           _colGlobal  >= 0 && _colGlobal  < COLUMNAS_GLOBALES;
}

function ladoDesdeColGlobal(_colGlobal) {
    return (_colGlobal <= 3) ? 'player' : 'enemy';
}

function inicializarCoordsGlobales(unidad, indice, lado) {
    if (!unidad) return;
    if (typeof unidad._filaGlobal === 'number' && typeof unidad._colGlobal === 'number') return;
    const coords = coordsDesdeIndice(indice, lado);
    unidad._filaGlobal = coords._filaGlobal;
    unidad._colGlobal  = coords._colGlobal;
    unidad._indiceTablero = lado;
    unidad._indiceActual  = indice;
}

function setCoordsGlobales(unidad, _filaGlobal, _colGlobal) {
    if (!unidad) return false;
    if (!casillaValidaGlobal(_filaGlobal, _colGlobal)) return false;

    unidad._filaGlobal = _filaGlobal;
    unidad._colGlobal  = _colGlobal;

    const lado = ladoDesdeColGlobal(_colGlobal);
    const indiceLocal = indiceLocalDesdeCoords(_filaGlobal, _colGlobal, lado);

    unidad._indiceTablero = lado;
    unidad._indiceActual  = indiceLocal;

    return true;
}

function getCoordenadaCasilla(indice, lado = 'player') {
    const fila = Math.floor(indice / COLUMNAS_ARENA) + 1;
    const col = indice % COLUMNAS_ARENA;
    const letras = (lado === 'enemy') ? LETRAS_ENEMIGO : LETRAS_JUGADOR;
    return letras[col] + fila;
}

function getIndiceDesdeCoordenada(coord) {
    if (!coord || coord.length < 2) return -1;
    const letra = coord[0].toUpperCase();
    const fila = parseInt(coord.slice(1), 10);
    if (isNaN(fila) || fila < 1 || fila > FILAS_ARENA) return -1;

    let col = LETRAS_JUGADOR.indexOf(letra);
    let lado = 'player';
    if (col === -1) {
        col = LETRAS_ENEMIGO.indexOf(letra);
        lado = 'enemy';
    }
    if (col === -1) return -1;
    return { indice: (fila - 1) * COLUMNAS_ARENA + col, lado };
}

const _PATRONES_COLOCACION = {
    player: {
        melee: [
            'D3', 'D2', 'D4', 'D1', 'D5',
            'C3', 'C2', 'C4', 'C1', 'C5',
            'B3', 'B2', 'B4', 'B1', 'B5',
            'A3', 'A2', 'A4', 'A1', 'A5'
        ],
        backline: [
            'A3', 'A2', 'A4', 'A1', 'A5',
            'B3', 'B2', 'B4', 'B1', 'B5',
            'C3', 'C2', 'C4', 'C1', 'C5',
            'D3', 'D2', 'D4', 'D1', 'D5'
        ]
    },
    enemy: {
        melee: [
    'E3', 'E2', 'E4', 'E1', 'E5',
    'F3', 'F2', 'F4', 'F1', 'F5',
    'G3', 'G2', 'G4', 'G1', 'G5'
    // 🆕 FIX v16: quitadas las H (traseras). Un melee nunca va a H.
],
        backline: [
    'H3', 'H2', 'H4', 'H1', 'H5',
    'G3', 'G2', 'G4', 'G1', 'G5',
    'F3', 'F2', 'F4', 'F1', 'F5'
    // 🆕 FIX v16: quitadas las E (frontales). Un backline nunca va a E.
]
    }
};

function obtenerIndiceColocacionInicial(lado, rol, yaColocadas) {
    const patrones = _PATRONES_COLOCACION[lado];
    if (!patrones) return 0;

    const lista = patrones[rol] || patrones.melee;
    if (yaColocadas < lista.length) {
        const coord = lista[yaColocadas];
        const r = getIndiceDesdeCoordenada(coord);
        if (r && r.indice >= 0) return r.indice;
    }

    const listaTablero = (lado === 'player') ? tablero : enemyBoard;
    if (Array.isArray(listaTablero)) {
        const libre = listaTablero.findIndex(x => x === null);
        if (libre !== -1) return libre;
    }
    return 0;
}

function rolColocacionDesdePokemonData(pokemon) {
    if (!pokemon) return 'melee';

    if (pokemon.rol === 'frontline') return 'melee';
    if (pokemon.rol === 'backline') return 'backline';

    const clase = pokemon.clase || '';
    const clasesFrontline = ['Defensa', 'Equilibrado', 'Lucha'];
    if (clasesFrontline.includes(clase)) return 'melee';

    const clasesBackline = ['At. Especial', 'Ágil', 'Auxiliar', 'Movimiento', 'Atacante'];
    if (clasesBackline.includes(clase)) return 'backline';

    return 'melee';
}

window.obtenerIndiceColocacionInicial = obtenerIndiceColocacionInicial;
window.rolColocacionDesdePokemonData = rolColocacionDesdePokemonData;
window._PATRONES_COLOCACION = _PATRONES_COLOCACION;

// ============================================================
// LOGS
// ============================================================
