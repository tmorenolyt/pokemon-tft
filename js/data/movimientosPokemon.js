// ============================================================
// MOVIMIENTOS DE POKÉMON
// ============================================================
// `nombre`    → lo que se ve en la carta (único para el registro)
// `iconoKey`  → (opcional) clave para el PNG si el nombre se
//               repite entre Pokémon (ej: "Bomba Lodo 2")
// `tipo`      → tipo del movimiento
// ============================================================

const MOVIMIENTOS_POKEMON = {
    // ===== COSTE 1 =====
    "Bulbasaur": [
        { nombre: "Látigo Cepa", tipo: "Planta" },
        { nombre: "Bomba Lodo", tipo: "Veneno" }
    ],
    "Ivysaur": [
        { nombre: "Látigo Cepa", tipo: "Planta" },
        { nombre: "Bomba Lodo", tipo: "Veneno" }
    ],
    "Venusaur": [
        { nombre: "Látigo Cepa", tipo: "Planta" },
        { nombre: "Bomba Lodo", tipo: "Veneno" }
    ],
    "Charmander": [
        { nombre: "Lanzallamas", tipo: "Fuego" },
        { nombre: "Puño Fuego", tipo: "Fuego" }
    ],
    "Charmeleon": [
        { nombre: "Lanzallamas", tipo: "Fuego" },
        { nombre: "Puño Fuego", tipo: "Fuego" }
    ],
    "Charizard": [
        { nombre: "Lanzallamas", tipo: "Fuego" },
        { nombre: "Puño Fuego", tipo: "Fuego" }
    ],
    "Cramorant": [
        { nombre: "Vendaval", tipo: "Volador" },
        { nombre: "Tajo Aéreo", tipo: "Volador" }
    ],
    "Dwebble": [
        { nombre: "Trampa Rocas", tipo: "Roca" },
        { nombre: "Tijera X", tipo: "Bicho" }
    ],
    "Machop": [
        { nombre: "Tajo Cruzado", tipo: "Lucha" },
        { nombre: "Sumisión", tipo: "Lucha" }
    ],
    "Machoke": [
        { nombre: "Tajo Cruzado", tipo: "Lucha" },
        { nombre: "Sumisión", tipo: "Lucha" }
    ],
    "Machamp": [
        { nombre: "Tajo Cruzado", tipo: "Lucha" },
        { nombre: "Sumisión", tipo: "Lucha" }
    ],
    "Marill": [
        { nombre: "Torbellino", tipo: "Agua" },
        { nombre: "Carantoña", tipo: "Hada" }
    ],
    "Azumarill": [
        { nombre: "Torbellino", tipo: "Agua" },
        { nombre: "Carantoña", tipo: "Hada" }
    ],
    "Phantump": [
        { nombre: "Divide Dolor", tipo: "Normal" },
        { nombre: "Asta Drenaje", tipo: "Planta" }
    ],
    "Trevenant": [
        { nombre: "Divide Dolor", tipo: "Normal" },
        { nombre: "Asta Drenaje", tipo: "Planta" }
    ],
    "Pikachu": [
        { nombre: "Bola Voltio", tipo: "Eléctrico" },
        { nombre: "Placaje Eléctrico", tipo: "Eléctrico" }
    ],
    "Ralts": [
        { nombre: "Fuerza Lunar", tipo: "Hada" },
        { nombre: "Premonición", tipo: "Psíquico" }
    ],
    "Kirlia": [
        { nombre: "Fuerza Lunar", tipo: "Hada" },
        { nombre: "Premonición", tipo: "Psíquico" }
    ],
    "Gardevoir": [
        { nombre: "Fuerza Lunar", tipo: "Hada" },
        { nombre: "Premonición", tipo: "Psíquico" }
    ],
    "Crustle": [
        { nombre: "Trampa Rocas", tipo: "Roca" },
        { nombre: "Tijera X", tipo: "Bicho" }
    ],
    "Swinub": [
        { nombre: "Colmillo Hielo", tipo: "Hielo" },
        { nombre: "Terremoto", tipo: "Tierra" }
    ],
    "Piloswine": [
        { nombre: "Colmillo Hielo", tipo: "Hielo" },
        { nombre: "Terremoto", tipo: "Tierra" }
    ],
    "Mamoswine": [
        { nombre: "Colmillo Hielo", tipo: "Hielo" },
        { nombre: "Terremoto", tipo: "Tierra" }
    ],
    "Zorua": [
        { nombre: "Finta", tipo: "Siniestro" },
        { nombre: "Garra Umbría", tipo: "Fantasma" }
    ],
    "Zoroark": [
        { nombre: "Finta", tipo: "Siniestro" },
        { nombre: "Garra Umbría", tipo: "Fantasma" }
    ],
    "Eevee": [
        { nombre: "Ataque Rápido", tipo: "Normal" },
        { nombre: "Meteoros", tipo: "Normal" }
    ],

    // ===== COSTE 2 =====
    "Arbok": [
        { nombre: "Bomba Ácida", tipo: "Veneno" },
        { nombre: "Picotazo Veneno", tipo: "Veneno" }
    ],
    "Ceruledge": [
        { nombre: "Espada Lamento", tipo: "Fuego" },
        { nombre: "Psicocorte", tipo: "Psíquico" }
    ],
    "Cubchoo": [
        { nombre: "Nieve Polvo", tipo: "Hielo" },
        { nombre: "Chuzos", tipo: "Hielo" }
    ],
    "Beartic": [
        { nombre: "Nieve Polvo", tipo: "Hielo" },
        { nombre: "Chuzos", tipo: "Hielo" }
    ],
    "Fennekin": [
        { nombre: "Giro Fuego", tipo: "Fuego" },
        { nombre: "Nitrocarga", tipo: "Fuego" }
    ],
    "Braixen": [
        { nombre: "Giro Fuego", tipo: "Fuego" },
        { nombre: "Nitrocarga", tipo: "Fuego" }
    ],
    "Delphox": [
        { nombre: "Giro Fuego", tipo: "Fuego" },
        { nombre: "Nitrocarga", tipo: "Fuego" }
    ],
    "Leafeon": [
        { nombre: "Hoja Afilada", tipo: "Planta" },
        { nombre: "Hoja Aguda", tipo: "Planta" }
    ],
    "Lucario": [
        { nombre: "Velocidad Extrema", tipo: "Normal" },
        { nombre: "A Bocajarro", tipo: "Lucha" }
    ],
    "Mr. Mime": [
        { nombre: "Cambiafuerza", tipo: "Psíquico" },
        { nombre: "Psíquico", tipo: "Psíquico" }
    ],
    "Rowlet": [
        { nombre: "Sombra Vil", tipo: "Fantasma" },
        { nombre: "Lluevehojas", tipo: "Planta" }
    ],
    "Dartrix": [
        { nombre: "Sombra Vil", tipo: "Fantasma" },
        { nombre: "Lluevehojas", tipo: "Planta" }
    ],
    "Decidueye": [
        { nombre: "Sombra Vil", tipo: "Fantasma" },
        { nombre: "Lluevehojas", tipo: "Planta" }
    ],
    "Scorbunny": [
        { nombre: "Ascuas", tipo: "Fuego" },
        { nombre: "Patada Ígnea", tipo: "Fuego" }
    ],
    "Raboot": [
        { nombre: "Ascuas", tipo: "Fuego" },
        { nombre: "Patada Ígnea", tipo: "Fuego" }
    ],
    "Cinderace": [
        { nombre: "Ascuas", tipo: "Fuego" },
        { nombre: "Patada Ígnea", tipo: "Fuego" }
    ],
    "Squirtle": [
        { nombre: "Hidrobomba", tipo: "Agua" },
        { nombre: "Giro Rápido", tipo: "Normal" }
    ],
    "Wartortle": [
        { nombre: "Hidrobomba", tipo: "Agua" },
        { nombre: "Giro Rápido", tipo: "Normal" }
    ],
    "Blastoise": [
        { nombre: "Hidrobomba", tipo: "Agua" },
        { nombre: "Giro Rápido", tipo: "Normal" }
    ],
    "Tinkatuff": [
        { nombre: "Martillo Hielo", tipo: "Hielo" },
        { nombre: "Martillo Colosal", tipo: "Acero" }
    ],
    "Tinkaton": [
        { nombre: "Martillo Hielo", tipo: "Hielo" },
        { nombre: "Martillo Colosal", tipo: "Acero" }
    ],
    "Umbreon": [
        { nombre: "Alarido", tipo: "Siniestro" },
        { nombre: "Mal de Ojo", tipo: "Siniestro" }
    ],
    "Vulpix": [
        { nombre: "Ventisca", tipo: "Hielo" },
        { nombre: "Alud", tipo: "Hielo" }
    ],
    "Ninetales": [
        { nombre: "Ventisca", tipo: "Hielo" },
        { nombre: "Alud", tipo: "Hielo" }
    ],
    "Zeraora": [
        { nombre: "Voltiocambio", tipo: "Eléctrico" },
        { nombre: "Voltio Cruel", tipo: "Eléctrico" }
    ],

    // ===== COSTE 3 =====
    "Absol": [
        { nombre: "Tajo Umbrío", tipo: "Siniestro" },
        { nombre: "Golpe Bajo", tipo: "Siniestro" }
    ],
    "Clefable": [
        { nombre: "Señuelo", tipo: "Normal" },
        { nombre: "Luz Lunar", tipo: "Normal" }
    ],
    "Espeon": [
        { nombre: "Psicocarga", tipo: "Psíquico" },
        { nombre: "Premonición", iconoKey: "Premonición 2", tipo: "Psíquico" }
    ],
    "Glaceon": [
        { nombre: "Viento Hielo", tipo: "Hielo" },
        { nombre: "Carámbano", tipo: "Hielo" }
    ],
    "Gossifleur": [
        { nombre: "Rizo Algodón", tipo: "Planta" },
        { nombre: "Ciclón de Hojas", tipo: "Planta" }
    ],
    "Eldegoss": [
        { nombre: "Rizo Algodón", tipo: "Planta" },
        { nombre: "Ciclón de Hojas", tipo: "Planta" }
    ],
    "Haunter": [
        { nombre: "Bomba Lodo", iconoKey: "Bomba Lodo 2", tipo: "Veneno" },
        { nombre: "Comesueños", tipo: "Psíquico" }
    ],
    "Gengar": [
        { nombre: "Bomba Lodo", iconoKey: "Bomba Lodo 2", tipo: "Veneno" },
        { nombre: "Comesueños", tipo: "Psíquico" }
    ],
    "Kubfu": [
        { nombre: "Azote Torrencial", tipo: "Agua" },
        { nombre: "Hidroariete", tipo: "Agua" }
    ],
    "Urshifu": [
        { nombre: "Azote Torrencial", tipo: "Agua" },
        { nombre: "Hidroariete", tipo: "Agua" }
    ],
    "Lapras": [
        { nombre: "Hidropulso", tipo: "Agua" },
        { nombre: "Canto Mortal", tipo: "Normal" }
    ],
    "Sobble": [
        { nombre: "Pistola Agua", tipo: "Agua" },
        { nombre: "Hidroariete", iconoKey: "Hidroariete 2", tipo: "Agua" }
    ],
    "Drizzile": [
        { nombre: "Pistola Agua", tipo: "Agua" },
        { nombre: "Hidroariete", iconoKey: "Hidroariete 2", tipo: "Agua" }
    ],
    "Inteleon": [
        { nombre: "Pistola Agua", tipo: "Agua" },
        { nombre: "Hidroariete", iconoKey: "Hidroariete 2", tipo: "Agua" }
    ],
    "Zapdos": [
        { nombre: "Bola Voltio", iconoKey: "Bola Voltio 2", tipo: "Eléctrico" },
        { nombre: "Rayo Carga", tipo: "Eléctrico" }
    ],

    // ===== COSTE 4 =====
    "Dragonite": [
        { nombre: "Danza Dragón", tipo: "Dragón" },
        { nombre: "Enfado", tipo: "Dragón" }
    ],
    "Gyarados": [
        { nombre: "Bote", tipo: "Volador" },
        { nombre: "Acua Cola", tipo: "Agua" }
    ],
    "Hoopa": [
        { nombre: "Truco", tipo: "Psíquico" },
        { nombre: "Bola Sombra", tipo: "Fantasma" }
    ],
    "Snorlax": [
        { nombre: "Descanso", tipo: "Psíquico" },
        { nombre: "Bostezo", tipo: "Normal" }
    ],
    "Sylveon": [
        { nombre: "Llama Embrujada", tipo: "Fuego" },
        { nombre: "Vozarrón", tipo: "Normal" }
    ],
    "Tyranitar": [
        { nombre: "Roca Afilada", tipo: "Roca" },
        { nombre: "Tormenta de Arena", tipo: "Roca" }
    ],

    // ===== COSTE 5 =====
    "Ho-Oh": [
        { nombre: "Llama Reavivadora", tipo: "Fuego" },
        { nombre: "Giro Fuego Ho-Oh", tipo: "Fuego" }
    ],
    "Mewtwo": [
        { nombre: "Teletransporte", tipo: "Psíquico" },
        { nombre: "Psicoonda", tipo: "Psíquico" }
    ],
    "Miraidon": [
        { nombre: "Cometa Draco", tipo: "Dragón" },
        { nombre: "Rayo Carga", iconoKey: "Rayo Carga 2", tipo: "Eléctrico" }
    ],

    // ===== ESPECIALES =====
    // 🆕 Zacian: ambos movimientos son Garra Metál (repetido)
    //    La ulti (Tajo Supremo) va en ULTIS_POKEMON, no aquí
    "Zacian": [
        { nombre: "Garra Metal", tipo: "Acero" },
        { nombre: "Garra Metal", tipo: "Acero" }
    ],
    "Articuno": [
        { nombre: "Ventisca", tipo: "Hielo" },
        { nombre: "Tajo Aéreo", tipo: "Volador" }
    ]
};

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.MOVIMIENTOS_POKEMON = MOVIMIENTOS_POKEMON;
