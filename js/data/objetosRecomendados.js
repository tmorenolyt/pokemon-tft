// ============================================================
// OBJETOS RECOMENDADOS POR POKÉMON - v2
// ============================================================
// Lista de objetos óptimos por Pokémon, en orden de prioridad.
// La IA del enemigo (enemyEquiparObjetos) consulta esta lista
// antes de equipar un objeto del baúl.
//
// Reglas:
//   - 4 objetos por Pokémon (el 1º es el más deseado).
//   - Si el 1º no está en el baúl, prueba el 2º, luego el 3º, etc.
//   - Si ninguno está, cae al comportamiento genérico
//     (primer objeto del baúl que quepa).
//   - Los Chips (Chip Fuego, etc.) NO se listan aquí porque
//     la IA ya los asigna por `requerido` (solo a su tipo).
//   - Zacian (no equipa objetos) y Articuno (virtual) NO se listan.
//   - Las evoluciones heredan los objetos del Pokémon base.
//
// Criterios usados (resumen):
//   - Atacante físico   → Cinta Fuerte, Roca del Rey, Brazalete Condena, Colgante Carga
//   - At. Especial      → Cuchara Peculiar, Gafas Especiales, Gafas de Elección, Pañuelo Elección
//   - Tanque / Defensa  → Restos, Incienso Condena, Casco Dentado, Capucha Rescate
//   - Auxiliar          → Capucha Rescate, Pañuelo Elección, Incienso Condena, Restos
//   - Ágil / Movimiento → Cinta Fuerte, Colgante Carga, Brazalete Condena, Pañuelo Combo
//   - Pokémon de HP alto→ Restos, Capucha Rescate, Incienso Condena, Casco Dentado
//   - Disco Definitivo se equipa aparte (solo a 2★+, 1 por Pokémon)
//
// ⚠️ Los objetos deben existir en OBJETOS (js/data/objetos.js).
// ============================================================

const OBJETOS_RECOMENDADOS = {

    // ============================================================
    // ===== COSTE 1 =====
    // ============================================================

    // Charmander → Charizard (Fuego, Atacante, frontline)
    "Charmander":   ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Charmeleon":   ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Charizard":    ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Bulbasaur → Venusaur (Planta/Veneno, Movimiento, backline)
    "Bulbasaur":    ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Ivysaur":      ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Venusaur":     ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],

    // Pikachu (Eléctrico, At. Especial, backline)
    "Pikachu":      ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],

    // Dwebble → Crustle (Roca, Defensa, frontline)
    "Dwebble":      ["Restos", "Incienso Condena", "Capucha Rescate", "Casco Dentado"],
    "Crustle":      ["Restos", "Incienso Condena", "Capucha Rescate", "Casco Dentado"],

    // Machop → Machamp (Lucha, Equilibrado, frontline)
    "Machop":       ["Restos", "Incienso Condena", "Casco Dentado", "Roca del Rey"],
    "Machoke":      ["Restos", "Incienso Condena", "Casco Dentado", "Roca del Rey"],
    "Machamp":      ["Restos", "Incienso Condena", "Casco Dentado", "Roca del Rey"],

    // Zorua → Zoroark (Siniestro, Ágil, frontline)
    "Zorua":        ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Zoroark":      ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Cramorant (Agua, Ágil, backline)
    "Cramorant":    ["Cuchara Peculiar", "Gafas Especiales", "Colgante Carga", "Pañuelo Combo"],

    // Marill → Azumarill (Agua/Hada, Equilibrado, frontline)
    "Marill":       ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Azumarill":    ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Phantump → Trevenant (Planta/Fantasma, Auxiliar, frontline)
    "Phantump":     ["Capucha Rescate", "Restos", "Incienso Condena", "Casco Dentado"],
    "Trevenant":    ["Capucha Rescate", "Restos", "Incienso Condena", "Casco Dentado"],

    // Ralts → Gardevoir (Psíquico, At. Especial, backline)
    "Ralts":        ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Kirlia":       ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Gardevoir":    ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],

    // Swinub → Mamoswine (Hielo, Defensa, frontline)
    "Swinub":       ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Piloswine":    ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Mamoswine":    ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Eevee (Eevee, Equilibrado, frontline)
    "Eevee":        ["Restos", "Incienso Condena", "Casco Dentado", "Cinta Fuerte"],

    // ============================================================
    // ===== COSTE 2 =====
    // ============================================================

    // Squirtle → Blastoise (Agua, Auxiliar, frontline)
    "Squirtle":     ["Capucha Rescate", "Restos", "Incienso Condena", "Casco Dentado"],
    "Wartortle":    ["Capucha Rescate", "Restos", "Incienso Condena", "Casco Dentado"],
    "Blastoise":    ["Capucha Rescate", "Restos", "Incienso Condena", "Casco Dentado"],

    // Arbok (Veneno, Defensa, frontline)
    "Arbok":        ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Ceruledge (Fuego/Fantasma, Equilibrado, frontline)
    "Ceruledge":    ["Roca del Rey", "Cinta Fuerte", "Brazalete Condena", "Capa Furtiva"],

    // Cubchoo → Beartic (Hielo, Auxiliar, frontline)
    "Cubchoo":      ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],
    "Beartic":      ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Fennekin → Delphox (Fuego, Movimiento, backline)
    "Fennekin":     ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Braixen":      ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Delphox":      ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],

    // Leafeon (Planta/Eevee, Atacante, frontline)
    "Leafeon":      ["Restos", "Incienso Condena", "Casco Dentado", "Barrera Auxiliar"],

    // Lucario (Lucha/Acero, Atacante, frontline)
    "Lucario":      ["Brazalete Condena", "Colgante Carga", "Seguro Debilidad", "Roca del Rey"],

    // Mr. Mime (Psíquico/Hada, Defensa, frontline)
    "Mr. Mime":     ["Restos", "Capucha Rescate", "Incienso Condena", "Casco Dentado"],

    // Rowlet → Decidueye (Planta, Atacante, backline)
    "Rowlet":       ["Colgante Carga", "Cinta Fuerte", "Brazalete Condena", "Pañuelo Combo"],
    "Dartrix":      ["Colgante Carga", "Cinta Fuerte", "Brazalete Condena", "Pañuelo Combo"],
    "Decidueye":    ["Colgante Carga", "Cinta Fuerte", "Brazalete Condena", "Pañuelo Combo"],

    // Scorbunny → Cinderace (Fuego, Ágil, backline)
    "Scorbunny":    ["Roca del Rey", "Cinta Fuerte", "Pañuelo Combo", "Colgante Carga"],
    "Raboot":       ["Roca del Rey", "Cinta Fuerte", "Pañuelo Combo", "Colgante Carga"],
    "Cinderace":    ["Roca del Rey", "Cinta Fuerte", "Pañuelo Combo", "Colgante Carga"],

    // Tinkatuff → Tinkaton (Hada/Acero, Atacante, frontline)
    "Tinkatuff":    ["Roca del Rey", "Cinta Fuerte", "Brazalete Condena", "Capa Furtiva"],
    "Tinkaton":     ["Roca del Rey", "Cinta Fuerte", "Brazalete Condena", "Capa Furtiva"],

    // Vulpix → Ninetales (Hielo, At. Especial, backline)
    "Vulpix":       ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],
    "Ninetales":    ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Pañuelo Elección"],

    // Zeraora (Eléctrico, Equilibrado, frontline)
    "Zeraora":      ["Restos", "Capucha Rescate", "Incienso Condena", "Casco Dentado"],

    // Umbreon (Siniestro/Eevee, Auxiliar, frontline)
    "Umbreon":      ["Restos", "Capucha Rescate", "Incienso Condena", "Casco Dentado"],

    // ============================================================
    // ===== COSTE 3 =====
    // ============================================================

    // Gossifleur → Eldegoss (Planta, Auxiliar, frontline)
    "Gossifleur":   ["Capucha Rescate", "Pañuelo Elección", "Incienso Condena", "Restos"],
    "Eldegoss":     ["Capucha Rescate", "Pañuelo Elección", "Incienso Condena", "Restos"],

    // Absol (Siniestro, Ágil, frontline)
    "Absol":        ["Pañuelo Elección", "Brazalete Condena", "Cinta Fuerte", "Roca del Rey"],

    // Espeon (Psíquico/Eevee, At. Especial, backline)
    "Espeon":       ["Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección", "Colgante Carga"],

    // Glaceon (Hielo/Eevee, Ágil, backline)
    "Glaceon":      ["Cuchara Peculiar", "Cinta Fuerte", "Colgante Carga", "Pañuelo Elección"],

    // Haunter → Gengar (Fantasma/Veneno, At. Especial, frontline)
    "Haunter":      ["Gafas de Elección", "Gafas Especiales", "Cuchara Peculiar", "Colgante Carga"],
    "Gengar":       ["Gafas de Elección", "Gafas Especiales", "Cuchara Peculiar", "Colgante Carga"],

    // Kubfu → Urshifu (Lucha, Equilibrado, frontline)
    "Kubfu":        ["Corona Drenaje", "Capa Furtiva", "Colgante Carga", "Seguro Debilidad"],
    "Urshifu":      ["Corona Drenaje", "Capa Furtiva", "Colgante Carga", "Seguro Debilidad"],

    // Clefable (Hada, Auxiliar, frontline)
    "Clefable":     ["Capucha Rescate", "Pañuelo Elección", "Incienso Condena", "Restos"],

    // Lapras (Agua/Hielo, Defensa, frontline)
    "Lapras":       ["Capucha Rescate", "Pañuelo Elección", "Restos", "Incienso Condena"],

    // Zapdos (Eléctrico/Volador, Movimiento, backline)
    "Zapdos":       ["Pañuelo Elección", "Cuchara Peculiar", "Gafas Especiales", "Gafas de Elección"],

    // Sobble → Inteleon (Agua, Movimiento, backline)
    "Sobble":       ["Gafas de Elección", "Gafas Especiales", "Cuchara Peculiar", "Colgante Carga"],
    "Drizzile":     ["Gafas de Elección", "Gafas Especiales", "Cuchara Peculiar", "Colgante Carga"],
    "Inteleon":     ["Gafas de Elección", "Gafas Especiales", "Cuchara Peculiar", "Colgante Carga"],

    // ============================================================
    // ===== COSTE 4 =====
    // ============================================================

    // Tyranitar (Roca/Siniestro, Equilibrado, frontline)
    "Tyranitar":    ["Corona Drenaje", "Roca del Rey", "Seguro Debilidad", "Brazalete Condena"],

    // Dragonite (Dragón/Volador, Ágil, backline)
    "Dragonite":    ["Colgante Carga", "Brazalete Condena", "Pañuelo Combo", "Roca del Rey"],

    // Gyarados (Agua/Volador, Atacante, frontline)
    "Gyarados":     ["Corona Drenaje", "Capa Furtiva", "Colgante Carga", "Seguro Debilidad"],

    // Hoopa (Psíquico/Fantasma, Movimiento, backline)
    "Hoopa":        ["Cuchara Peculiar", "Cinta Fuerte", "Gafas Especiales", "Gafas de Elección"],

    // Snorlax (Normal, Defensa, frontline)
    "Snorlax":      ["Capucha Rescate", "Incienso Condena", "Restos", "Casco Dentado"],

    // Sylveon (Hada/Eevee, At. Especial, backline)
    "Sylveon":      ["Colgante Carga", "Gafas Especiales", "Gafas de Elección", "Cuchara Peculiar"],

    // ============================================================
    // ===== COSTE 5 =====
    // ============================================================

    // Ho-Oh (Fuego/Volador, Auxiliar, frontline)
    "Ho-Oh":        ["Restos", "Pañuelo Elección", "Capucha Rescate", "Incienso Condena"],

    // Mewtwo (Psíquico, Atacante, frontline)
    "Mewtwo":       ["Corona Drenaje", "Barrera Auxiliar", "Colgante Carga", "Seguro Debilidad"],

    // Miraidon (Eléctrico/Dragón, Movimiento, backline)
    "Miraidon":     ["Gafas de Elección", "Gafas Especiales", "Cuchara Peculiar", "Colgante Carga"]

};

// ============================================================
// FUNCIÓN DE CONSULTA
// ============================================================

function getObjetosRecomendados(pokemon) {
    if (!pokemon) return [];

    // 1) Por nombre concreto
    if (OBJETOS_RECOMENDADOS[pokemon.nombre]) {
        return OBJETOS_RECOMENDADOS[pokemon.nombre];
    }

    // 2) No está listado → [] (la IA cae al comportamiento genérico)
    return [];
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.OBJETOS_RECOMENDADOS = OBJETOS_RECOMENDADOS;
window.getObjetosRecomendados = getObjetosRecomendados;
