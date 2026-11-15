// ============================================================
// DATOS DE MONSTRUOS PvE
// ============================================================
// Cada monstruo es una "Unidad" normal del juego, con la
// diferencia de que:
//   - no tiene estrategia, no compra, no sube de nivel
//   - su stats son fijas por ronda
//   - no toca enemyHealth (se vence en combate, punto)
//
// Las rondas PvE son: 1, 6, 12, 18 (cada 6 rondas)
// ============================================================

// ============================================================
// STATS BASE DE LOS 4 MONSTRUOS
// ============================================================

const POKEMON_MONSTRUOS = {

    // ============================================================
// RONDA 1 - AIPOM (2 unidades)
// ============================================================
aipom: {
    id: 190,                    // 🆕 antes 424
    nombre: 'Aipom Salvaje',    // 🆕 antes 'Ambipom Salvaje'
    spriteId: 190,              // 🆕 antes 424
    tipos: [],
    clase: 'Ágil',
    rol: 'frontline',
    hp: 250,
    ataque: 15,
    spAttack: 5,
    defense: 20,
    spDefense: 20,
    attackSpeed: 0.7,
    critRate: 0,
    critDamage: 1.0,
    startingEnergy: 0,
    energyGauge: 100,
    coste: 0,
    evolucion: null,
    rangoAtaque: 1,
    esEspecial: true,
    noEquiparObjetos: true
},

    // ============================================================
    // RONDA 6 - ARAQUANID
    // ============================================================
    // Medio. Tanque con escudo inicial. El jugador ya tiene 3-4 unidades.
            araquanid: {
        id: 752,
        nombre: 'Araquanid Salvaje',
        spriteId: 752,
        tipos: [],
        clase: 'Defensa',
        rol: 'backline',
        hp: 1200,
        ataque: 44,
        spAttack: 15,
        defense: 80,
        spDefense: 80,
        attackSpeed: 0.6,
        critRate: 0,
        critDamage: 1.0,
        startingEnergy: 0,
        energyGauge: 100,
        coste: 0,
        evolucion: null,
        rangoAtaque: 3,
        esEspecial: true,
        noEquiparObjetos: true
    },

    // ============================================================
    // RONDA 12 - DREDNAW
    // ============================================================
    // Difícil. Muro con daño sostenido. El jugador ya tiene 5-6 unidades.
            drednaw: {
        id: 834,
        nombre: 'Drednaw Salvaje',
        spriteId: 834,
        tipos: [],
        clase: 'Defensa',
        rol: 'backline',
        hp: 2500,
        ataque: 40,
        spAttack: 20,
        defense: 120,
        spDefense: 100,
        attackSpeed: 0.7,
        critRate: 0,
        critDamage: 1.0,
        startingEnergy: 0,
        energyGauge: 80,
        coste: 0,
        evolucion: null,
        rangoAtaque: 2,
        esEspecial: true,
        noEquiparObjetos: true
    },

    // ============================================================
    // RONDA 18 - REGIDRAGO (jefe final PvE)
    // ============================================================
    // Muy difícil. Atacante a distancia con escudo de dragón.
    // El jugador debería estar en nivel 7-8 con equipo completo.
    regidrago: {
        id: 895,
        nombre: 'Regidrago Salvaje',
        spriteId: 895,
        tipos: [],
        clase: 'At. Especial',
        rol: 'backline',
        hp: 4500,
        ataque: 50,
        spAttack: 80,
        defense: 150,
        spDefense: 200,
        attackSpeed: 0.8,
        critRate: 0,
        critDamage: 1.0,
        startingEnergy: 0,
        energyGauge: 100,
        coste: 0,
        evolucion: null,
        rangoAtaque: 3,
        esEspecial: true,
        noEquiparObjetos: true
    }

};

// ============================================================
// CONFIGURACIÓN DE CADA RONDA PvE
// ============================================================
// unidades: array con { pokemon, indice, nivel, escudoInicial? }
//           indice = casilla del enemyBoard (0..19)
//           El tablero enemigo tiene 4 columnas (E, F, G, H) × 5 filas
//
//           ⚠️ IMPORTANTE: el índice se calcula como
//              indice = fila * 4 + columna
//           donde fila = 0..4 (de arriba a abajo) y columna = 0..3 (E=0, F=1, G=2, H=3)
//
//           MAPA VISUAL:
//           COLUMNA:    E    F    G    H
//           FILA 1:     0    1    2    3
//           FILA 2:     4    5    6    7
//           FILA 3:     8    9   10   11
//           FILA 4:    12   13   14   15
//           FILA 5:    16   17   18   19
//
// recompensas: oro, tiendaPokemon, tiendaObjetos
// danioSiPierdes: HP que pierde el jugador si no derrota al monstruo
// ============================================================

const MONSTRUOS_PVE = {

    // ============================================================
    // RONDA 1 - 2× AMBIPOM
    // ============================================================
    // Colocados en el centro del tablero enemigo (F3 y G3).
    // Si el jugador tiene su unidad en D (columna frontal),
    // están a 1-2 casillas de distancia, así que el combate
    // empieza enseguida.
    // ============================================================
    1: {
    nombre: 'Emboscada Aipom',          // 🆕 antes 'Emboscada Ambipom'
    descripcion: 'Dos Aipom salvajes bloquean el camino.',  // 🆕 antes 'Dos Ambipom salvajes bloquean el camino.'
    tipo: 'PvE',
    unidades: [
        { pokemon: 'aipom', indice: 8,  nivel: 1 },   // 🆕 antes 'ambipom'
        { pokemon: 'aipom', indice: 12, nivel: 1 }    // 🆕 antes 'ambipom'
    ],
    recompensas: {
        oro: 0,
        tiendaPokemon: true,
        cantidadPokemon: 3,
        tiendaObjetos: false
    },
    danioSiPierdes: 3
},

    // ============================================================
    // RONDA 6 - ARAQUANID
    // ============================================================
    // Colocado en el centro (G3).
    // Escudo inicial de 1000 HP para que aguante más.
    // ============================================================
        6: {
        nombre: 'Araquanid en su telaraña',
        descripcion: 'Una Araquanid gigante protege su territorio.',
        tipo: 'PvE',
                unidades: [
            { pokemon: 'araquanid', indice: 8, nivel: 1, escudoInicial: 300 }  // E3 (fila 3, col E, frente)
        ],
        recompensas: {
            oro: 5,
            tiendaPokemon: true,
            cantidadPokemon: 4,
            tiendaObjetos: true
        },
        danioSiPierdes: 5
    },

    // ============================================================
    // RONDA 12 - DREDNAW
    // ============================================================
    // Colocado en el centro (G3).
    // Escudo inicial de 2500 HP.
    // ============================================================
        12: {
        nombre: 'Drednaw el Devorador',
        descripcion: 'Drednaw emerge del pantano.',
        tipo: 'PvE',
                unidades: [
            { pokemon: 'drednaw', indice: 8, nivel: 1, escudoInicial: 600 }  // E3 (fila 3, col E, frente)
        ],
        recompensas: {
            oro: 5,
            tiendaPokemon: true,
            cantidadPokemon: 4,
            tiendaObjetos: true
        },
        danioSiPierdes: 8
    },

    // ============================================================
    // RONDA 18 - REGIDRAGO (jefe final)
    // ============================================================
    // Colocado en la esquina trasera (H3), lejos del jugador.
    // Escudo de dragón de 3000 HP.
    // El combate se alarga porque ataca desde lejos.
    // ============================================================
    18: {
        nombre: 'Regidrago, el Núcleo Dragón',
        descripcion: 'El guardián final del torneo PvE.',
        tipo: 'PvE',
                unidades: [
            { pokemon: 'regidrago', indice: 11, nivel: 1, escudoInicial: 1000 }  // H3 (fila 3, col H)
        ],
        recompensas: {
            oro: 5,
            tiendaPokemon: true,
            cantidadPokemon: 4,
            tiendaObjetos: true
        },
        danioSiPierdes: 12
    }

};

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.POKEMON_MONSTRUOS = POKEMON_MONSTRUOS;
window.MONSTRUOS_PVE = MONSTRUOS_PVE;
