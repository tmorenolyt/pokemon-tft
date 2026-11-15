// ============================================================
// DATOS DE POKÉMON - TODOS LOS POKÉMON Y EVOLUCIONES
// ============================================================
// 🔧 v3: añadido campo `rangoAtaque` a TODOS los Pokémon
//   - rangoAtaque = distancia del ATAQUE BÁSICO (no del movimiento)
//   - Es independiente del `alcance` del movimiento especial
//   - Si un Pokémon no tiene rangoAtaque, se usa el alcance del
//     movimiento principal como fallback (comportamiento antiguo)
//
//   Rangos usados:
//     1 → melee (se pega al rival)
//     3 → mid-range
//     4 → ranged backline
//     5 → ranged largo (Sobble family)
// ============================================================

// ===== POKÉMON COSTE 1 =====
const POKEMONS_COSTE1 = [
    { id: 4, nombre: "Charmander", spriteId: 4, tipos: ["Fuego"], clase: "Atacante", rol: "frontline", hp: [850], ataque: [53], spAttack: [20], defense: 205, spDefense: 210, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 1, evolucion: "Charmeleon", base: true, rangoAtaque: 1 },
    { id: 25, nombre: "Pikachu", spriteId: 25, tipos: ["Eléctrico"], clase: "At. Especial", rol: "backline", hp: [550, 1050, 1900], ataque: [15, 25, 35], spAttack: [45, 65, 95], defense: 70, spDefense: 85, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 1, evolucion: null, base: true, rangoAtaque: 4 },
    { id: 1, nombre: "Bulbasaur", spriteId: 1, tipos: ["Planta", "Veneno"], clase: "Movimiento", rol: "backline", hp: [600], ataque: [20], spAttack: [55], defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 1, evolucion: "Ivysaur", base: true, rangoAtaque: 3 },
    { id: 557, nombre: "Dwebble", spriteId: 557, tipos: ["Roca"], clase: "Defensa", rol: "frontline", hp: [900], ataque: [45], spAttack: [20], defense: 320, spDefense: 270, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 1, evolucion: "Crustle", base: true, rangoAtaque: 1 },
    { id: 66, nombre: "Machop", spriteId: 66, tipos: ["Lucha"], clase: "Equilibrado", rol: "frontline", hp: [900], ataque: [50], spAttack: [20], defense: 190, spDefense: 200, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 1, evolucion: "Machoke", base: true, rangoAtaque: 1 },
    { id: 570, nombre: "Zorua", spriteId: 570, tipos: ["Siniestro"], clase: "Ágil", rol: "frontline", hp: [900], ataque: [50], spAttack: [20], defense: 195, spDefense: 195, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 1, evolucion: "Zoroark", base: true, rangoAtaque: 1 },
    { id: 845, nombre: "Cramorant", spriteId: 845, tipos: ["Agua"], clase: "Ágil", rol: "backline", hp: [600, 1050, 1850], ataque: [20, 30, 45], spAttack: [65, 95, 140], defense: 90, spDefense: 105, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 1, evolucion: null, base: true, rangoAtaque: 4 },
    { id: 183, nombre: "Marill", spriteId: 183, tipos: ["Agua", "Hada"], clase: "Equilibrado", rol: "frontline", hp: [900, 1620, 2930], ataque: [50, 75, 110], spAttack: [20, 30, 45], defense: 200, spDefense: 200, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 50, coste: 1, evolucion: "Azumarill", base: true, rangoAtaque: 1 },
    { id: 708, nombre: "Phantump", spriteId: 708, tipos: ["Planta", "Fantasma"], clase: "Auxiliar", rol: "frontline", hp: [950, 1650, 2950], ataque: [55, 75, 110], spAttack: [25, 30, 45], defense: 270, spDefense: 285, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 1, evolucion: "Trevenant", base: true, rangoAtaque: 1 },
    { id: 280, nombre: "Ralts", spriteId: 280, tipos: ["Psíquico"], clase: "At. Especial", rol: "backline", hp: [600], ataque: [20], spAttack: [55], defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 1, evolucion: "Kirlia", base: true, rangoAtaque: 4 },
    { id: 220, nombre: "Swinub", spriteId: 220, tipos: ["Hielo"], clase: "Defensa", rol: "frontline", hp: [900], ataque: [45], spAttack: [20], defense: 335, spDefense: 280, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 1, evolucion: "Piloswine", base: true, rangoAtaque: 1 },
    { id: 133, nombre: "Eevee", spriteId: 133, tipos: ["Eevee"], clase: "Equilibrado", rol: "frontline", hp: [750, 1350, 2400], ataque: [40, 60, 90], spAttack: [30, 45, 70], defense: 180, spDefense: 180, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 60, coste: 1, evolucion: null, base: true, rangoAtaque: 1 },
];

// ===== POKÉMON COSTE 2 =====
const POKEMONS_COSTE2 = [
    { id: 7, nombre: "Squirtle", spriteId: 7, tipos: ["Agua"], clase: "Auxiliar", rol: "frontline", hp: [1050], ataque: [25], spAttack: [55], defense: 280, spDefense: 335, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: "Wartortle", base: true, rangoAtaque: 1 },
    { id: 24, nombre: "Arbok", spriteId: 24, tipos: ["Veneno"], clase: "Defensa", rol: "frontline", hp: [1000, 1800, 3200], ataque: [25, 35, 50], spAttack: [60, 95, 140], defense: 260, spDefense: 320, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 60, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 937, nombre: "Ceruledge", spriteId: 937, tipos: ["Fuego", "Fantasma"], clase: "Equilibrado", rol: "frontline", hp: [950, 1750, 3200], ataque: [70, 110, 160], spAttack: [25, 35, 55], defense: 200, spDefense: 215, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 60, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 613, nombre: "Cubchoo", spriteId: 613, tipos: ["Hielo"], clase: "Auxiliar", rol: "frontline", hp: [1050], ataque: [55], spAttack: [25], defense: 285, spDefense: 330, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: "Beartic", base: true, rangoAtaque: 1 },
    { id: 653, nombre: "Fennekin", spriteId: 653, tipos: ["Fuego"], clase: "Movimiento", rol: "backline", hp: [700], ataque: [25], spAttack: [65], defense: 95, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Braixen", base: true, rangoAtaque: 4 },
    { id: 470, nombre: "Leafeon", spriteId: 470, tipos: ["Planta", "Eevee"], clase: "Atacante", rol: "frontline", hp: [1000, 1850, 3300], ataque: [55, 85, 130], spAttack: [25, 35, 50], defense: 215, spDefense: 180, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 448, nombre: "Lucario", spriteId: 448, tipos: ["Lucha", "Acero"], clase: "Atacante", rol: "frontline", hp: [1000, 1800, 3250], ataque: [60, 90, 135], spAttack: [25, 35, 50], defense: 200, spDefense: 200, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 50, energyGauge: 70, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 122, nombre: "Mr. Mime", spriteId: 122, tipos: ["Psíquico", "Hada"], clase: "Defensa", rol: "frontline", hp: [1000, 1800, 3200], ataque: [20, 35, 50], spAttack: [50, 75, 110], defense: 260, spDefense: 315, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 722, nombre: "Rowlet", spriteId: 722, tipos: ["Planta"], clase: "Atacante", rol: "backline", hp: [680], ataque: [70], spAttack: [25], defense: 105, spDefense: 100, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 2, evolucion: "Dartrix", base: true, rangoAtaque: 4 },
    { id: 813, nombre: "Scorbunny", spriteId: 813, tipos: ["Fuego"], clase: "Ágil", rol: "backline", hp: [700], ataque: [75], spAttack: [20], defense: 105, spDefense: 100, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 2, evolucion: "Raboot", base: true, rangoAtaque: 4 },
    { id: 958, nombre: "Tinkatuff", spriteId: 958, tipos: ["Hada", "Acero"], clase: "Atacante", rol: "frontline", hp: [990], ataque: [50], spAttack: [25], defense: 190, spDefense: 220, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Tinkaton", base: true, rangoAtaque: 1 },
    { id: 10103, nombre: "Vulpix", spriteId: 10103, tipos: ["Hielo"], clase: "At. Especial", rol: "backline", hp: [700], ataque: [25], spAttack: [60], defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Ninetales", base: true, rangoAtaque: 4 },
    { id: 807, nombre: "Zeraora", spriteId: 807, tipos: ["Eléctrico"], clase: "Equilibrado", rol: "frontline", hp: [1035, 1860, 3350], ataque: [60, 90, 135], spAttack: [25, 35, 55], defense: 205, spDefense: 220, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 197, nombre: "Umbreon", spriteId: 197, tipos: ["Siniestro", "Eevee"], clase: "Auxiliar", rol: "frontline", hp: [1050, 1900, 3450], ataque: [55, 80, 120], spAttack: [25, 35, 55], defense: 285, spDefense: 330, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: null, base: true, rangoAtaque: 1 },
];

// ===== POKÉMON COSTE 3 =====
const POKEMONS_COSTE3 = [
    { id: 829, nombre: "Gossifleur", spriteId: 829, tipos: ["Planta"], clase: "Auxiliar", rol: "frontline", hp: [1200], ataque: [25], spAttack: [60], defense: 260, spDefense: 315, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 3, evolucion: "Eldegoss", base: true, rangoAtaque: 1 },
    { id: 359, nombre: "Absol", spriteId: 359, tipos: ["Siniestro"], clase: "Ágil", rol: "frontline", hp: [1200, 2170, 5420], ataque: [70, 105, 160], spAttack: [25, 40, 60], defense: 200, spDefense: 190, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 50, energyGauge: 70, coste: 3, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 196, nombre: "Espeon", spriteId: 196, tipos: ["Psíquico", "Eevee"], clase: "At. Especial", rol: "backline", hp: [850, 1500, 3800], ataque: [30, 40, 65], spAttack: [80, 115, 175], defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 3, evolucion: null, base: true, rangoAtaque: 3 },
    { id: 471, nombre: "Glaceon", spriteId: 471, tipos: ["Hielo", "Eevee"], clase: "Ágil", rol: "backline", hp: [850, 1500, 3800], ataque: [30, 40, 65], spAttack: [80, 115, 175], defense: 105, spDefense: 95, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 3, evolucion: null, base: true, rangoAtaque: 4 },
    { id: 93, nombre: "Haunter", spriteId: 93, tipos: ["Fantasma", "Veneno"], clase: "At. Especial", rol: "frontline", hp: [900], ataque: [30], spAttack: [80], defense: 90, spDefense: 115, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 50, energyGauge: 70, coste: 3, evolucion: "Gengar", base: true, rangoAtaque: 1 },
    { id: 891, nombre: "Kubfu", spriteId: 891, tipos: ["Lucha"], clase: "Equilibrado", rol: "frontline", hp: [1150], ataque: [70], spAttack: [30], defense: 220, spDefense: 185, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 3, evolucion: "Urshifu", base: true, rangoAtaque: 1 },
    { id: 36, nombre: "Clefable", spriteId: 36, tipos: ["Hada"], clase: "Auxiliar", rol: "frontline", hp: [1250, 2250, 5630], ataque: [30, 45, 65], spAttack: [65, 100, 145], defense: 270, spDefense: 320, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 3, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 131, nombre: "Lapras", spriteId: 131, tipos: ["Agua", "Hielo"], clase: "Defensa", rol: "frontline", hp: [1250, 2250, 5630], ataque: [30, 45, 65], spAttack: [65, 100, 145], defense: 285, spDefense: 335, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 3, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 145, nombre: "Zapdos", spriteId: 145, tipos: ["Eléctrico", "Volador"], clase: "Movimiento", rol: "backline", hp: [850, 1500, 3800], ataque: [30, 45, 60], spAttack: [80, 115, 175], defense: 95, spDefense: 105, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 50, coste: 3, evolucion: null, base: true, rangoAtaque: 4 },
    { id: 816, nombre: "Sobble", spriteId: 816, tipos: ["Agua"], clase: "Movimiento", rol: "backline", hp: [850, 1550, 3800], ataque: [30], spAttack: [80], defense: 100, spDefense: 100, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 3, evolucion: "Drizzile", base: true, rangoAtaque: 5 },
];

// ===== POKÉMON COSTE 4 =====
const POKEMONS_COSTE4 = [
    { id: 248, nombre: "Tyranitar", spriteId: 248, tipos: ["Roca", "Siniestro"], clase: "Equilibrado", rol: "frontline", hp: [1400, 2500, 8800], ataque: [85, 130, 195], spAttack: [35, 50, 80], defense: 225, spDefense: 200, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 4, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 149, nombre: "Dragonite", spriteId: 149, tipos: ["Dragón", "Volador"], clase: "Ágil", rol: "backline", hp: [1400, 2500, 8800], ataque: [85, 130, 195], spAttack: [35, 50, 80], defense: 210, spDefense: 215, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 4, evolucion: null, base: true, rangoAtaque: 3 },
    { id: 130, nombre: "Gyarados", spriteId: 130, tipos: ["Agua", "Volador"], clase: "Atacante", rol: "frontline", hp: [1450, 2600, 8900], ataque: [85, 130, 195], spAttack: [35, 50, 80], defense: 200, spDefense: 225, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 70, coste: 4, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 720, nombre: "Hoopa", spriteId: 720, tipos: ["Psíquico", "Fantasma"], clase: "Movimiento", rol: "backline", hp: [1200, 2100, 7200], ataque: [40, 55, 85], spAttack: [95, 145, 220], defense: 95, spDefense: 135, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 4, evolucion: null, base: true, rangoAtaque: 4 },
    { id: 143, nombre: "Snorlax", spriteId: 143, tipos: ["Normal"], clase: "Defensa", rol: "frontline", hp: [1550, 2750, 9700], ataque: [75, 115, 175], spAttack: [35, 50, 75], defense: 280, spDefense: 340, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 4, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 700, nombre: "Sylveon", spriteId: 700, tipos: ["Hada", "Eevee"], clase: "At. Especial", rol: "backline", hp: [1150, 2050, 7100], ataque: [40, 55, 85], spAttack: [105, 155, 230], defense: 100, spDefense: 130, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 4, evolucion: null, base: true, rangoAtaque: 3 },
];

// ===== POKÉMON COSTE 5 =====
const POKEMONS_COSTE5 = [
    { id: 250, nombre: "Ho-Oh", spriteId: 250, tipos: ["Fuego", "Volador"], clase: "Auxiliar", rol: "frontline", hp: [2550, 5600, 16800], ataque: [100, 150, 225], spAttack: [50, 70, 130], defense: 290, spDefense: 350, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 90, coste: 5, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 150, nombre: "Mewtwo", spriteId: 150, tipos: ["Psíquico"], clase: "Atacante", rol: "frontline", hp: [2340, 5140, 15420], ataque: [110, 165, 250], spAttack: [60, 80, 140], defense: 210, spDefense: 230, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 60, energyGauge: 70, coste: 5, evolucion: null, base: true, rangoAtaque: 1 },
    { id: 1008, nombre: "Miraidon", spriteId: 1008, tipos: ["Eléctrico", "Dragón"], clase: "Movimiento", rol: "backline", hp: [2070, 4550, 13650], ataque: [45, 60, 95], spAttack: [130, 190, 285], defense: 140, spDefense: 140, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 60, coste: 5, evolucion: null, base: true, rangoAtaque: 4 },
];

// ============================================================
// ===== POKÉMON EVOLUCIONES (base: false) =====
// ============================================================
const POKEMONS_EVOLUCIONES = [
    // BULBASAUR FAMILIA
    { id: 2, nombre: "Ivysaur", spriteId: 2, tipos: ["Planta", "Veneno"], clase: "Movimiento", rol: "backline", hp: 1100, ataque: 30, spAttack: 85, defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Venusaur", base: false, rangoAtaque: 3 },
    { id: 3, nombre: "Venusaur", spriteId: 3, tipos: ["Planta", "Veneno"], clase: "Movimiento", rol: "backline", hp: 1950, ataque: 45, spAttack: 125, defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 4, evolucion: null, base: false, rangoAtaque: 3 },
    
    // CHARMANDER FAMILIA
    { id: 5, nombre: "Charmeleon", spriteId: 5, tipos: ["Fuego"], clase: "Atacante", rol: "frontline", hp: 1600, ataque: 79, spAttack: 30, defense: 205, spDefense: 210, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 2, evolucion: "Charizard", base: false, rangoAtaque: 1 },
    { id: 6, nombre: "Charizard", spriteId: 6, tipos: ["Fuego"], clase: "Atacante", rol: "frontline", hp: 2900, ataque: 120, spAttack: 45, defense: 205, spDefense: 210, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 4, evolucion: null, base: false, rangoAtaque: 1 },
    
    // SQUIRTLE FAMILIA
    { id: 8, nombre: "Wartortle", spriteId: 8, tipos: ["Agua"], clase: "Auxiliar", rol: "frontline", hp: 1900, ataque: 35, spAttack: 80, defense: 280, spDefense: 335, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: "Blastoise", base: false, rangoAtaque: 1 },
    { id: 9, nombre: "Blastoise", spriteId: 9, tipos: ["Agua"], clase: "Auxiliar", rol: "frontline", hp: 3450, ataque: 55, spAttack: 120, defense: 280, spDefense: 335, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 4, evolucion: null, base: false, rangoAtaque: 1 },
    
    // MACHOP FAMILIA
    { id: 67, nombre: "Machoke", spriteId: 67, tipos: ["Lucha"], clase: "Equilibrado", rol: "frontline", hp: 1620, ataque: 75, spAttack: 30, defense: 190, spDefense: 200, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 2, evolucion: "Machamp", base: false, rangoAtaque: 1 },
    { id: 68, nombre: "Machamp", spriteId: 68, tipos: ["Lucha"], clase: "Equilibrado", rol: "frontline", hp: 2930, ataque: 110, spAttack: 45, defense: 190, spDefense: 200, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 4, evolucion: null, base: false, rangoAtaque: 1 },
    
    // MARILL FAMILIA
    { id: 184, nombre: "Azumarill", spriteId: 184, tipos: ["Agua", "Hada"], clase: "Equilibrado", rol: "frontline", hp: {2:1620, 3:2930}, ataque: {2:75, 3:110}, spAttack: {2:30, 3:45}, defense: 200, spDefense: 200, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 50, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // SWINUB FAMILIA
    { id: 221, nombre: "Piloswine", spriteId: 221, tipos: ["Hielo"], clase: "Defensa", rol: "frontline", hp: 1650, ataque: 70, spAttack: 30, defense: 335, spDefense: 280, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: "Mamoswine", base: false, rangoAtaque: 1 },
    { id: 473, nombre: "Mamoswine", spriteId: 473, tipos: ["Hielo"], clase: "Defensa", rol: "frontline", hp: 3000, ataque: 105, spAttack: 45, defense: 335, spDefense: 280, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 4, evolucion: null, base: false, rangoAtaque: 1 },
    
    // RALTS FAMILIA
    { id: 281, nombre: "Kirlia", spriteId: 281, tipos: ["Psíquico"], clase: "At. Especial", rol: "backline", hp: 1100, ataque: 30, spAttack: 85, defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Gardevoir", base: false, rangoAtaque: 4 },
    { id: 282, nombre: "Gardevoir", spriteId: 282, tipos: ["Psíquico"], clase: "At. Especial", rol: "backline", hp: 1950, ataque: 45, spAttack: 125, defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 4, evolucion: null, base: false, rangoAtaque: 4 },
    
    // DWEBLE FAMILIA
    { id: 558, nombre: "Crustle", spriteId: 558, tipos: ["Roca"], clase: "Defensa", rol: "frontline", hp: {2:1600, 3:2850}, ataque: {2:65, 3:100}, spAttack: {2:30, 3:45}, defense: 320, spDefense: 270, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // ZORUA FAMILIA
    { id: 571, nombre: "Zoroark", spriteId: 571, tipos: ["Siniestro"], clase: "Ágil", rol: "frontline", hp: {2:1600, 3:2900}, ataque: {2:75, 3:110}, spAttack: {2:30, 3:45}, defense: 195, spDefense: 195, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // PHANTUMP FAMILIA
    { id: 709, nombre: "Trevenant", spriteId: 709, tipos: ["Planta", "Fantasma"], clase: "Auxiliar", rol: "frontline", hp: {2:1650, 3:2950}, ataque: {2:75, 3:110}, spAttack: {2:30, 3:45}, defense: 270, spDefense: 285, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // CUBCHOO FAMILIA
    { id: 614, nombre: "Beartic", spriteId: 614, tipos: ["Hielo"], clase: "Auxiliar", rol: "frontline", hp: {2:1900, 3:3450}, ataque: {2:80, 3:120}, spAttack: {2:35, 3:55}, defense: 285, spDefense: 330, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // FENNEKIN FAMILIA
    { id: 654, nombre: "Braixen", spriteId: 654, tipos: ["Fuego"], clase: "Movimiento", rol: "backline", hp: 1250, ataque: 35, spAttack: 95, defense: 95, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Delphox", base: false, rangoAtaque: 4 },
    { id: 655, nombre: "Delphox", spriteId: 655, tipos: ["Fuego", "Psíquico"], clase: "Movimiento", rol: "backline", hp: 2250, ataque: 55, spAttack: 145, defense: 95, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 4, evolucion: null, base: false, rangoAtaque: 4 },
    
    // ROWLET FAMILIA
    { id: 723, nombre: "Dartrix", spriteId: 723, tipos: ["Planta"], clase: "Atacante", rol: "backline", hp: 1220, ataque: 110, spAttack: 35, defense: 105, spDefense: 100, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 2, evolucion: "Decidueye", base: false, rangoAtaque: 4 },
    { id: 724, nombre: "Decidueye", spriteId: 724, tipos: ["Planta"], clase: "Atacante", rol: "backline", hp: 2250, ataque: 160, spAttack: 55, defense: 105, spDefense: 100, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 4, evolucion: null, base: false, rangoAtaque: 4 },
    
    // SCORBUNNY FAMILIA
    { id: 814, nombre: "Raboot", spriteId: 814, tipos: ["Fuego"], clase: "Ágil", rol: "backline", hp: 1250, ataque: 115, spAttack: 35, defense: 105, spDefense: 100, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 2, evolucion: "Cinderace", base: false, rangoAtaque: 4 },
    { id: 815, nombre: "Cinderace", spriteId: 815, tipos: ["Fuego"], clase: "Ágil", rol: "backline", hp: 2300, ataque: 170, spAttack: 55, defense: 105, spDefense: 100, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 10, energyGauge: 60, coste: 4, evolucion: null, base: false, rangoAtaque: 4 },
    
    // GOSSIFLEUR FAMILIA
    { id: 830, nombre: "Eldegoss", spriteId: 830, tipos: ["Planta"], clase: "Auxiliar", rol: "frontline", hp: {2:2150, 3:5450}, ataque: {2:40, 3:60}, spAttack: {2:90, 3:135}, defense: 260, spDefense: 315, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 80, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // HAUNTER FAMILIA
    { id: 94, nombre: "Gengar", spriteId: 94, tipos: ["Fantasma", "Veneno"], clase: "At. Especial", rol: "frontline", hp: {2:1550, 3:3900}, ataque: {2:40, 3:65}, spAttack: {2:115, 3:175}, defense: 90, spDefense: 115, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 50, energyGauge: 70, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // SOBBLE FAMILIA
    { id: 817, nombre: "Drizzile", spriteId: 817, tipos: ["Agua"], clase: "Movimiento", rol: "backline", hp: 1550, ataque: 40, spAttack: 115, defense: 100, spDefense: 100, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: "Inteleon", base: false, rangoAtaque: 5 },
    { id: 818, nombre: "Inteleon", spriteId: 818, tipos: ["Agua"], clase: "Movimiento", rol: "backline", hp: 3800, ataque: 65, spAttack: 175, defense: 100, spDefense: 100, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 4, evolucion: null, base: false, rangoAtaque: 5 },
    
    // KUBFU FAMILIA
    { id: 892, nombre: "Urshifu", spriteId: 892, tipos: ["Lucha"], clase: "Equilibrado", rol: "frontline", hp: {2:2150, 3:5370}, ataque: {2:105, 3:160}, spAttack: {2:45, 3:65}, defense: 220, spDefense: 185, attackSpeed: 0.9, critRate: 0.25, critDamage: 1.4, startingEnergy: 0, energyGauge: 70, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
    
    // VULPIX FAMILIA
    { id: 10104, nombre: "Ninetales", spriteId: 10104, tipos: ["Hielo"], clase: "At. Especial", rol: "backline", hp: {2:1250, 3:2200}, ataque: {2:35, 3:50}, spAttack: {2:95, 3:140}, defense: 90, spDefense: 110, attackSpeed: 0.7, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: null, base: false, rangoAtaque: 4 },
    
    // TINKATUFF FAMILIA
    { id: 959, nombre: "Tinkaton", spriteId: 959, tipos: ["Hada", "Acero"], clase: "Atacante", rol: "frontline", hp: {2:1800, 3:3250}, ataque: {2:80, 3:125}, spAttack: {2:35, 3:50}, defense: 190, spDefense: 220, attackSpeed: 0.8, critRate: 0.25, critDamage: 1.4, startingEnergy: 20, energyGauge: 50, coste: 2, evolucion: null, base: false, rangoAtaque: 1 },
];

// ============================================================
// ===== LISTA UNIFICADA =====
// ============================================================

const POKEMONS = [...POKEMONS_COSTE1, ...POKEMONS_COSTE2, ...POKEMONS_COSTE3, ...POKEMONS_COSTE4, ...POKEMONS_COSTE5];

const TODOS_POKEMONS = [...POKEMONS, ...POKEMONS_EVOLUCIONES];

// ============================================================
// ===== FUNCIONES DE UTILIDAD =====
// ============================================================

function getPokemonPorNombre(nombre) {
    return TODOS_POKEMONS.find(p => p.nombre === nombre) || null;
}

function getPokemonPorCoste(coste) {
    return POKEMONS.filter(p => p.coste === coste);
}

// ============================================================
// ===== DEBUG =====
// ============================================================


const conteoClases = {};
POKEMONS.forEach(p => {
    const clase = p.clase || 'SIN_CLASE';
    conteoClases[clase] = (conteoClases[clase] || 0) + 1;
});

const conteoRangos = {};
TODOS_POKEMONS.forEach(p => {
    const r = p.rangoAtaque || 'sin_definir';
    conteoRangos[r] = (conteoRangos[r] || 0) + 1;
});