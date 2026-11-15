// ============================================================
// FACTORES DE ESCALA DE SPRITES (por altura real del Pokémon)
// ============================================================
// Los sprites (GIF pixel-art) tienen tamaños nativos muy distintos
// entre sí. Aquí escalamos cada uno en proporción a su ALTURA real
// en metros, de modo que un Pokémon grande se vea grande y uno
// pequeño se vea pequeño, sin desbordar la casilla del tablero.
//
// Fórmula: escala ≈ altura (m), con topes [0.6, 1.3] para que
// ningún sprite quede diminuto o desborde la celda.
// ============================================================

const SPRITE_SCALE = {
    "1": 0.7,      // Bulbasaur (0.7 m)
    "2": 1.0,      // Ivysaur (1.0 m)
    "3": 1.3,      // Venusaur (2.0 m)
    "4": 0.7,      // Charmander (0.6 m) — un pelín más grande
    "5": 0.9,      // Charmeleon (1.1 m) — reducido, se veía muy grande
    "6": 1.3,      // Charizard (1.7 m)
    "7": 0.6,      // Squirtle (0.5 m)
    "8": 1.0,      // Wartortle (1.0 m)
    "9": 1.3,      // Blastoise (1.6 m)
    "24": 1.3,     // Arbok (3.5 m)
    "24a": 1.0,    // (variante sin uso en el juego)
    "25": 0.7,     // Pikachu (0.4 m)
    "36": 1.3,     // Clefable (1.3 m)
    "66": 0.8,     // Machop (0.8 m)
    "67": 1.3,     // Machoke (1.5 m)
    "68": 1.3,     // Machamp (1.6 m)
    "93": 1.3,     // Haunter (1.6 m)
    "94": 1.3,     // Gengar (1.5 m)
    "122": 1.3,    // Mr. Mime (1.3 m)
    "130": 1.3,    // Gyarados (6.5 m)
    "131": 1.3,    // Lapras (2.5 m)
    "133": 0.8,    // Eevee (0.3 m)
    "143": 1.3,    // Snorlax (2.1 m)
    "144": 1.3,    // Articuno (1.7 m)
    "145": 1.4,    // Zapdos (1.6 m) — sprite con mucho aire lateral, compensado
    "149": 1.3,    // Dragonite (2.2 m)
    "150": 1.2,    // Mewtwo (2.0 m) — 1.2 para que no se corte la cabeza en el banco
    "183": 0.6,    // Marill (0.4 m)
    "184": 1.0,    // Azumarill (0.8 m) — un pelín más grande
    "196": 0.9,    // Espeon (0.9 m)
    "197": 1.0,    // Umbreon (1.0 m)
    "220": 0.6,    // Swinub (0.4 m)
    "221": 1.1,    // Piloswine (1.1 m)
    "248": 1.3,    // Tyranitar (2.0 m)
    "250": 1.55,   // Ho-Oh (3.8 m) — subido de 1.4 a 1.55
    "280": 0.6,    // Ralts (0.4 m)
    "281": 0.8,    // Kirlia (0.8 m)
    "282": 1.3,    // Gardevoir (1.6 m)
    "359": 1.2,    // Absol (1.2 m)
    "448": 1.2,    // Lucario (1.2 m)
    "470": 1.0,    // Leafeon (1.0 m)
    "471": 0.8,    // Glaceon (0.8 m)
    "473": 1.3,    // Mamoswine (2.5 m)
    "557": 0.6,    // Dwebble (0.3 m)
    "558": 1.3,    // Crustle (1.4 m)
    "570": 0.7,    // Zorua (0.7 m)
    "571": 1.3,    // Zoroark (1.6 m)
    "613": 0.6,    // Cubchoo (0.5 m)
    "614": 1.3,    // Beartic (2.6 m)
    "653": 0.6,    // Fennekin (0.4 m)
    "654": 1.0,    // Braixen (1.0 m)
    "655": 1.3,    // Delphox (1.5 m)
    "700": 1.0,    // Sylveon (1.0 m)
    "708": 0.6,    // Phantump (0.4 m)
    "709": 1.3,    // Trevenant (1.5 m)
    "720": 0.8,    // Hoopa (0.5 m) — un pelín más grande
    "722": 0.6,    // Rowlet (0.3 m)
    "723": 0.7,    // Dartrix (0.7 m)
    "724": 1.3,    // Decidueye (1.6 m)
    "807": 1.3,    // Zeraora (1.5 m)
    "813": 0.8,    // Scorbunny (0.3 m) — un pelín más grande (sprite alto)
    "814": 0.9,    // Raboot (0.6 m) — un pelín más grande para progresión Scorbunny < Raboot
    "815": 1.3,    // Cinderace (1.4 m)
    "816": 0.6,    // Sobble (0.3 m)
    "817": 0.7,    // Drizzile (0.7 m)
    "818": 1.3,    // Inteleon (1.9 m)
    "829": 0.6,    // Gossifleur (0.4 m)
    "830": 0.8,    // Eldegoss (0.5 m) — más grande
    "845": 0.8,    // Cramorant (0.8 m)
    "888": 1.3,    // Zacian (2.8 m)
    "891": 0.8,    // Kubfu (0.6 m) — un pelín más grande
    "892": 1.3,    // Urshifu (1.9 m)
    "937": 1.3,    // Ceruledge (1.6 m)
    "958": 0.7,    // Tinkatuff (0.7 m)
    "959": 1.3,    // Tinkaton (0.7 m) — sprite ancho (martillo) compensado para que no se vea diminuto
    "1008": 1.3,   // Miraidon (3.5 m)
    "10103": 0.6,  // Vulpix Alola (0.6 m)
    "10104": 1.1,  // Ninetales Alola (1.1 m)
    "mega-mewtwo-x": 1.3,
};

// ============================================================
// DESPLAZAMIENTO HORIZONTAL POR SPRITE
// ============================================================
// Algunos GIF animados dejan el sprite descentrado ópticamente
// (por el recorte/animación). Aquí ajustamos un pequeño
// desplazamiento horizontal en % del ancho del sprite para
// compensar. Valores positivos = mover a la derecha.
// ============================================================

const SPRITE_OFFSET_X = {
    "150": "23%",  // Mewtwo — el GIF animado lo deja descentrado a la izquierda
};

window.SPRITE_SCALE = SPRITE_SCALE;
window.SPRITE_OFFSET_X = SPRITE_OFFSET_X;
