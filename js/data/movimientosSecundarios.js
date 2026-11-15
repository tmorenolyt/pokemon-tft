// ============================================================
// MOVIMIENTOS SECUNDARIOS POR POKÉMON
// ============================================================
// Cada Pokémon tiene 2 movimientos:
//   - Principal: vive en movimientosPokemon.js (índice 0)
//   - Secundario: vive AQUÍ
//
// El secundario se desbloquea al subir a 2★.
//
// `nombre`    → lo que se ve en la carta
// `iconoKey`  → (opcional) clave para el PNG si el nombre se
//               repite entre Pokémon
// `tipo`      → tipo del movimiento
// ============================================================

const MOVIMIENTOS_SECUNDARIOS = {
    // ============================================================
    // ===== COSTE 1 =====
    // ============================================================
    "Bulbasaur": { nombre: "Bomba Lodo", tipo: "Veneno" },
    "Ivysaur": { nombre: "Bomba Lodo", tipo: "Veneno" },
    "Venusaur": { nombre: "Bomba Lodo", tipo: "Veneno" },
    
    "Charmander": { nombre: "Puño Fuego", tipo: "Fuego" },
    "Charmeleon": { nombre: "Puño Fuego", tipo: "Fuego" },
    "Charizard": { nombre: "Puño Fuego", tipo: "Fuego" },
    
    "Pikachu": { nombre: "Placaje Eléctrico", tipo: "Eléctrico" },
    
    "Dwebble": { nombre: "Tijera X", tipo: "Bicho" },
    "Crustle": { nombre: "Tijera X", tipo: "Bicho" },
    
    "Machop": { nombre: "Sumisión", tipo: "Lucha" },
    "Machoke": { nombre: "Sumisión", tipo: "Lucha" },
    "Machamp": { nombre: "Sumisión", tipo: "Lucha" },
    
    "Zorua": { nombre: "Garra Umbría", tipo: "Fantasma" },
    "Zoroark": { nombre: "Garra Umbría", tipo: "Fantasma" },

    "Eevee": { nombre: "Meteoros", tipo: "Normal" },
    
    "Cramorant": { nombre: "Tajo Aéreo", tipo: "Volador" },
    
    "Marill": { nombre: "Carantoña", tipo: "Hada" },
    "Azumarill": { nombre: "Carantoña", tipo: "Hada" },
    
    "Phantump": { nombre: "Asta Drenaje", tipo: "Planta" },
    "Trevenant": { nombre: "Asta Drenaje", tipo: "Planta" },
    
    "Ralts": { nombre: "Premonición", tipo: "Psíquico" },
    "Kirlia": { nombre: "Premonición", tipo: "Psíquico" },
    "Gardevoir": { nombre: "Premonición", tipo: "Psíquico" },
    
    "Swinub": { nombre: "Terremoto", tipo: "Tierra" },
    "Piloswine": { nombre: "Terremoto", tipo: "Tierra" },
    "Mamoswine": { nombre: "Terremoto", tipo: "Tierra" },

    // ============================================================
    // ===== COSTE 2 =====
    // ============================================================
    "Squirtle": { nombre: "Giro Rápido", tipo: "Normal" },
    "Wartortle": { nombre: "Giro Rápido", tipo: "Normal" },
    "Blastoise": { nombre: "Giro Rápido", tipo: "Normal" },
    
    "Arbok": { nombre: "Picotazo Veneno", tipo: "Veneno" },
    
    "Ceruledge": { nombre: "Psicocorte", tipo: "Psíquico" },
    
    "Cubchoo": { nombre: "Chuzos", tipo: "Hielo" },
    "Beartic": { nombre: "Chuzos", tipo: "Hielo" },
    
    "Fennekin": { nombre: "Nitrocarga", tipo: "Fuego" },
    "Braixen": { nombre: "Nitrocarga", tipo: "Fuego" },
    "Delphox": { nombre: "Nitrocarga", tipo: "Fuego" },
    
    "Leafeon": { nombre: "Hoja Aguda", tipo: "Planta" },
    
    "Lucario": { nombre: "A Bocajarro", tipo: "Lucha" },
    
    "Mr. Mime": { nombre: "Psíquico", tipo: "Psíquico" },
    
    "Rowlet": { nombre: "Lluevehojas", tipo: "Planta" },
    "Dartrix": { nombre: "Lluevehojas", tipo: "Planta" },
    "Decidueye": { nombre: "Lluevehojas", tipo: "Planta" },
    
    "Scorbunny": { nombre: "Patada Ígnea", tipo: "Fuego" },
    "Raboot": { nombre: "Patada Ígnea", tipo: "Fuego" },
    "Cinderace": { nombre: "Patada Ígnea", tipo: "Fuego" },
    
    "Tinkatuff": { nombre: "Martillo Colosal", tipo: "Acero" },
    "Tinkaton": { nombre: "Martillo Colosal", tipo: "Acero" },
    
    "Vulpix": { nombre: "Alud", tipo: "Hielo" },
    "Ninetales": { nombre: "Alud", tipo: "Hielo" },
    
    "Zeraora": { nombre: "Voltio Cruel", tipo: "Eléctrico" },
    
    "Umbreon": { nombre: "Mal de Ojo", tipo: "Siniestro" },

    // ============================================================
    // ===== COSTE 3 =====
    // ============================================================
    "Gossifleur": { nombre: "Ciclón de Hojas", tipo: "Planta" },
    "Eldegoss": { nombre: "Ciclón de Hojas", tipo: "Planta" },
    
    "Absol": { nombre: "Golpe Bajo", tipo: "Siniestro" },
    
    "Espeon": { nombre: "Premonición", iconoKey: "Premonición 2", tipo: "Psíquico" },
    
    "Glaceon": { nombre: "Carámbano", tipo: "Hielo" },
    
    "Haunter": { nombre: "Comesueños", tipo: "Psíquico" },
    "Gengar": { nombre: "Comesueños", tipo: "Psíquico" },
    
    "Kubfu": { nombre: "Hidroariete", tipo: "Agua" },
    "Urshifu": { nombre: "Hidroariete", tipo: "Agua" },
    
    "Clefable": { nombre: "Luz Lunar", tipo: "Normal" },
    
    "Lapras": { nombre: "Canto Mortal", tipo: "Agua" },
    
    "Zapdos": { nombre: "Rayo Carga", tipo: "Eléctrico" },
    
    "Sobble": { nombre: "Hidroariete", iconoKey: "Hidroariete 2", tipo: "Agua" },
    "Drizzile": { nombre: "Hidroariete", iconoKey: "Hidroariete 2", tipo: "Agua" },
    "Inteleon": { nombre: "Hidroariete", iconoKey: "Hidroariete 2", tipo: "Agua" },

    // ============================================================
    // ===== COSTE 4 =====
    // ============================================================
    "Tyranitar": { nombre: "Tormenta de Arena", tipo: "Roca" },
    
    "Dragonite": { nombre: "Enfado", tipo: "Dragón" },
    
    "Gyarados": { nombre: "Acua Cola", tipo: "Agua" },
    
    "Hoopa": { nombre: "Bola Sombra", tipo: "Fantasma" },
    
    "Snorlax": { nombre: "Bostezo", tipo: "Normal" },
    
    "Sylveon": { nombre: "Vozarrón", tipo: "Normal" },

    // ============================================================
    // ===== COSTE 5 =====
    // ============================================================
    "Ho-Oh": { nombre: "Giro Fuego Ho-Oh", tipo: "Fuego" },
    
    "Mewtwo": { nombre: "Psicoonda", tipo: "Psíquico" },
    
    "Miraidon": { nombre: "Rayo Carga", iconoKey: "Rayo Carga 2", tipo: "Eléctrico" },

    // ============================================================
    // ===== ESPECIALES =====
    // ============================================================
    "Zacian": { nombre: "Garra Metal", tipo: "Acero" },
    "Articuno": { nombre: "Tajo Aéreo", tipo: "Volador" }
};

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.MOVIMIENTOS_SECUNDARIOS = MOVIMIENTOS_SECUNDARIOS;

console.log("✅ movimientosSecundarios.js cargado -", Object.keys(MOVIMIENTOS_SECUNDARIOS).length, "Pokémon con secundario");