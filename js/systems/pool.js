// ============================================================
// SISTEMA DE POOL - v3 (CONTADOR DE COMPRAS)
// ============================================================
// El pool resta 1 copia CADA VEZ que compras un Pokémon.
// No se "recupera" al fusionar: las copias compradas se gastan
// para siempre (como en TFT real).
//
// - comprar() → consumirDelPool() → poolDisponible--
// - fusionar() → NO toca el pool (ya se gastó al comprar)
// - vender() → devolverAlPool() → poolDisponible++ (opcional)
//
// El pool es GLOBAL (jugador + enemigo comparten).
// ============================================================

let poolDisponible = {};
let poolTotal = {};

function inicializarPool() {
    for (let p of TODOS_POKEMONS) {
        let limite = CONFIG.POOL_LIMITS[p.coste] || 9;
        poolDisponible[p.id] = limite;
        poolTotal[p.id] = limite;
    }
    console.log("🎯 Pool inicializado correctamente (contador de compras)");
    console.log(`   Límites: coste 1=${CONFIG.POOL_LIMITS[1]}, 2=${CONFIG.POOL_LIMITS[2]}, 3=${CONFIG.POOL_LIMITS[3]}, 4=${CONFIG.POOL_LIMITS[4]}, 5=${CONFIG.POOL_LIMITS[5]}`);
}

// ============================================================
// CONSUMIR DEL POOL (al comprar)
// ============================================================
function consumirDelPool(pokemonId, cantidad = 1) {
    if (typeof pokemonId !== 'number' || isNaN(pokemonId) || pokemonId <= 0) {
        return false;
    }
    if (typeof cantidad !== 'number' || isNaN(cantidad) || cantidad <= 0) {
        return false;
    }

    if (typeof poolDisponible[pokemonId] !== 'number' || isNaN(poolDisponible[pokemonId])) {
        console.warn(`⚠️ consumirDelPool: id ${pokemonId} no inicializado en el pool. Ignorando.`);
        return false;
    }

    if (poolDisponible[pokemonId] >= cantidad) {
        poolDisponible[pokemonId] -= cantidad;
        return true;
    }

    return false;
}

// ============================================================
// DEVOLVER AL POOL (al vender)
// ============================================================
function devolverAlPool(pokemonId, cantidad = 1) {
    if (typeof poolDisponible[pokemonId] !== 'number' || isNaN(poolDisponible[pokemonId])) {
        console.warn(`⚠️ devolverAlPool: id ${pokemonId} no inicializado en el pool. Ignorando.`);
        return;
    }
    if (typeof cantidad !== 'number' || isNaN(cantidad) || cantidad <= 0) {
        return;
    }
    let limite = (typeof poolTotal[pokemonId] === 'number' && !isNaN(poolTotal[pokemonId]))
        ? poolTotal[pokemonId]
        : (CONFIG.POOL_LIMITS[1] || 9);
    poolDisponible[pokemonId] = Math.min(poolDisponible[pokemonId] + cantidad, limite);
}

// ============================================================
// COPIAS DISPONIBLES (para mostrar en la tienda)
// ============================================================
function getCopiasDisponibles(pokemon) {
    if (!pokemon || !pokemon.id) return 0;
    const id = pokemon.id;
    if (typeof poolDisponible[id] !== 'number' || isNaN(poolDisponible[id])) {
        return 0;
    }
    return Math.max(0, poolDisponible[id]);
}

// ============================================================
// CONTAR COPIAS EN JUEGO (informativo, no se usa para el pool)
// ============================================================
function contarCopiasEnJuego(pokemonId, ignorarUnidad = null, ignorarEnemigo = false) {
    let count = 0;
    for (let u of tablero) {
        if (u && u.pokemon.id === pokemonId && u !== ignorarUnidad) count++;
    }
    for (let u of banquillo) {
        if (u && u.pokemon.id === pokemonId && u !== ignorarUnidad) count++;
    }
    if (!ignorarEnemigo) {
        for (let u of enemyBoard) {
            if (u && u.pokemon.id === pokemonId) count++;
        }
        for (let u of enemyBanquillo) {
            if (u && u.pokemon.id === pokemonId) count++;
        }
    }
    return count;
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================
window.poolDisponible = poolDisponible;
window.poolTotal = poolTotal;
window.inicializarPool = inicializarPool;
window.consumirDelPool = consumirDelPool;
window.devolverAlPool = devolverAlPool;
window.getCopiasDisponibles = getCopiasDisponibles;
window.contarCopiasEnJuego = contarCopiasEnJuego;
