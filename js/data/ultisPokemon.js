// ============================================================
// ULTIS POR POKÉMON
// ============================================================
// Cada Pokémon tiene una ULTI que:
//   - Se desbloquea al subir a 2★ + equipar Disco Definitivo
//   - Se carga con ataques básicos (5 por defecto, pero varía)
//   - Se dispara automáticamente cuando la barra está llena
//
// ⚠️ TODAS las descripciones están EN ESPAÑOL.
//
// 📌 CAMPOS:
//   nombre     → lo que se ve en la UI ("Hoja Afilada")
//   id         → slug para buscar en ULTIS_REGISTRO
//   iconoKey   → clave para buscar el PNG en MOVIMIENTO_ICONS
//   esDeInicio → true si se dispara 1 vez al inicio del combate
//   carga      → ataques básicos para cargar la ulti
//   alcance    → casillas de alcance
//   descripcion→ texto en español
//
// 📌 ESTRUCTURA: las familias evolutivas comparten la misma ulti.
//
// 🆕 v3: añadida ulti de Zacian (Tajo Supremo) como invocación
//         especial. Zacian no equipa Disco Definitivo: usa
//         el campo `behemothBlade` como "disco virtual".
// ============================================================

const ULTIS_FAMILIAS = {

    // ============================================================
    // ===== COSTE 1 =====
    // ============================================================

    // ===== FAMILIA BULBASAUR =====
    "Bulbasaur, Ivysaur, Venusaur": {
        nombre: "Rayo Solar",
        id: "rayo-solar",
        carga: 5,
        alcance: 8,
        descripcion: "Tras 5 ataques básicos, carga brevemente y dispara en la dirección del oponente actual, infligiendo 460% de daño de Ataque Esp."
    },

    // ===== FAMILIA CHARMANDER =====
    "Charmander, Charmeleon, Charizard": {
        nombre: "Llamarada",
        id: "llamarada-charmander",
        iconoKey: "Llamarada",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, lanza una gran explosión de fuego a los pies del oponente actual, infligiendo 200% de daño de Ataque en un área amplia y reduciendo Defensa y Def. Esp. en 120."
    },

    // ===== CRAMORANT =====
    "Cramorant": {
        nombre: "Tragamisil",
        id: "tragamisil",
        carga: 6,
        alcance: 8,
        descripcion: "Tras 6 ataques básicos, durante los próximos 4 segundos los ataques básicos infligen 175% de daño de Ataque Esp. y rebotan una vez. Además, otorga +30% de Velocidad de Ataque y aumenta mucho el alcance de ataque."
    },

    // ===== FAMILIA DWEBLE =====
    "Dwebble, Crustle": {
        nombre: "Remolino Pétreo",
        id: "remolino-petreo",
        carga: 7,
        alcance: 1,
        descripcion: "Tras 7 ataques básicos, aumenta su Defensa y Def. Esp. en 1500 y se rodea de piedras, infligiendo 36% de daño de Ataque a los oponentes cercanos."
    },

    // ===== EEVEE =====
    "Eevee": {
        nombre: "Refuerzo",
        id: "refuerzo",
        iconoKey: "Refuerzo",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, Eevee refuerza al aliado más fuerte: durante 8 segundos, ese aliado gana +25% de Ataque, +25% de Atq. Esp. y +10% de Velocidad de Ataque. Si no hay otro aliado vivo, se refuerza a sí mismo. Además, Eevee inflige 120% de daño de Ataque a los enemigos adyacentes."
    },

    // ===== FAMILIA MACHOP =====
    "Machop, Machoke, Machamp": {
        nombre: "Somanta Épica",
        id: "somanta-epica",
        carga: 4,
        alcance: 1,
        descripcion: "Tras 4 ataques básicos, desata un ataque poderoso que inflige 260% de daño de Ataque e inmoviliza al objetivo durante 2 segundos."
    },

    // ===== FAMILIA MARILL =====
    "Marill, Azumarill": {
        nombre: "Acua Cola",
        id: "acua-cola",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, ataca al objetivo 3 veces. Cada golpe inflige 120% de daño de Ataque y restaura HP equivalente al 75% del Ataque. Cuantos más objetivos golpee, más HP restaura."
    },

    // ===== PHANTUMP / TREVENANT =====
    "Phantump, Trevenant": {
        nombre: "Bosquridad Espectral",
        id: "bosquridad-espectral",
        carga: 7,
        alcance: 1,
        descripcion: "Cada 7 segundos, inflige daño en área alrededor del objetivo. Según el número de oponentes golpeados, gana un escudo equivalente al 180% del Ataque y aplica debuffs."
    },

    // ===== PIKACHU =====
    "Pikachu": {
        nombre: "Trueno",
        id: "trueno",
        carga: 6,
        alcance: 4,
        descripcion: "Cada 6 segundos, usa Trueno sobre el oponente actual. El objetivo y todos los oponentes en un radio de 1 casilla reciben 110% de daño de Ataque Esp. 4 veces."
    },

    // ===== FAMILIA RALTS =====
    "Ralts, Kirlia, Gardevoir": {
        nombre: "Psicocarga",
        id: "psicocarga",
        carga: 8,
        alcance: 8,
        descripcion: "Tras 8 ataques básicos, lanza 3 bombas a oponentes aleatorios, infligiendo 235% de daño de Ataque Esp. a ellos y a los oponentes circundantes. Los oponentes golpeados también pierden 4 puntos de barra de energía."
    },

    // ===== FAMILIA SWINUB =====
    "Swinub, Piloswine, Mamoswine": {
        nombre: "Planca Corpulenta",
        id: "planca-corpulenta",
        carga: 6,
        alcance: 1,
        descripcion: "Cada 6 segundos, gana un escudo equivalente al 36% de sus HP, golpea el suelo, lanza por los aires a los oponentes en un radio de 2 casillas durante 1.5 segundos e inflige 48% de daño de Ataque."
    },

    // ===== FAMILIA ZORUA =====
    "Zorua, Zoroark": {
        nombre: "Pulso Medianoche",
        id: "pulso-medianoche",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, inflige 145% de daño de Ataque 3 veces a los oponentes adyacentes en un radio de 1 casilla y recupera HP equivalente al 650% del Ataque."
    },

    // ============================================================
    // ===== COSTE 2 =====
    // ============================================================

    // ===== ARBOK =====
    "Arbok": {
        nombre: "Deslumbrar",
        id: "deslumbrar",
        carga: 8,
        alcance: 3,
        descripcion: "Cada 8 segundos, inmoviliza a los enemigos en un cono frontal durante 1 segundo y reduce su Ataque y Atq. Esp. un 40% durante 5 segundos. Otorga a Arbok un 50% de reducción de daño durante el uso."
    },

    // ===== CERULEDGE =====
    "Ceruledge": {
        nombre: "Espadazo Espectral",
        id: "espadazo-espectral",
        carga: 6,
        alcance: 3,
        descripcion: "Tras 6 ataques básicos, se abalanza hacia el objetivo, infligiendo 300% de daño de Ataque a los enemigos en la trayectoria e inmovilizándolos durante 1 segundo."
    },

    // ===== FAMILIA CUBCHOO =====
    "Cubchoo, Beartic": {
        nombre: "Paisaje Nevado",
        id: "paisaje-nevado",
        esDeInicio: true,
        carga: 1,
        alcance: 8,
        descripcion: "Se activa una vez al inicio del combate. Otorga a los aliados cercanos +100 Defensa y Def. Esp. y un escudo."
    },

    // ===== FAMILIA FENNEKIN =====
    "Fennekin, Braixen, Delphox": {
        nombre: "Llamarada",
        id: "llamarada-fennekin",
        iconoKey: "Llamarada 2",
        carga: 8,
        alcance: 4,
        descripcion: "Tras 8 ataques básicos, dispara una ráfaga de fuego hacia el oponente actual, infligiendo 246% de daño de Ataque Esp. a quienes estén en su camino. El camino luego explota, infligiendo otros 246% de daño de Ataque Esp. a los golpeados."
    },

    // ===== LEAFEON =====
    "Leafeon": {
        nombre: "Cuchilla Solar",
        id: "cuchilla-solar",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, inflige 356% de daño de Ataque en línea recta. Restaura 55.2% de HP por cada enemigo eliminado."
    },

    // ===== LUCARIO =====
    "Lucario": {
        nombre: "Ataque Óseo",
        id: "ataque-oseo",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, ataca continuamente a los enemigos con un hueso, infligiendo 115% de daño repetidamente. El golpe final lanza el hueso, luego carga hacia su posición e inflige otros 115% de daño a los enemigos cercanos."
    },

    // ===== MR. MIME =====
    "Mr. Mime": {
        nombre: "Pasen y Vean",
        id: "pasen-y-vean",
        carga: 6,
        alcance: 1,
        descripcion: "Cada 6 segundos, crea un círculo mágico a su alrededor. El círculo explota, infligiendo 345% de daño de Ataque Esp., reduciendo la Velocidad de Ataque un 30% y provocando a todos los enemigos dentro."
    },

    // ===== FAMILIA ROWLET =====
    "Rowlet, Dartrix, Decidueye": {
        nombre: "Hoja Afilada",
        id: "hoja-afilada-rowlet",
        iconoKey: "Hoja Afilada 2",
        carga: 7,
        alcance: 8,
        descripcion: "Tras 7 ataques básicos, aumenta su Velocidad de Ataque un 20%, y sus ataques básicos disparan un proyectil adicional a otro oponente durante 8 segundos. Además, inflige daño en línea recta a varios enemigos."
    },

    // ===== FAMILIA SCORBUNNY =====
    "Scorbunny, Raboot, Cinderace": {
        nombre: "Amago",
        id: "amago",
        carga: 5,
        alcance: 4,
        descripcion: "Tras 5 ataques básicos, entra en un estado de guardia breve y aumenta su Velocidad de Ataque un 30% durante 4 segundos. Cada 5 ataques básicos también lanza una bola de fuego al objetivo y a los enemigos cercanos, infligiendo 180% de daño de Ataque. Cuanto menos HP tenga el objetivo, mayor es el daño."
    },

    // ===== FAMILIA SQUIRTLE =====
    "Squirtle, Wartortle, Blastoise": {
        nombre: "Salpicar",
        id: "salpicar",
        carga: 7,
        alcance: 1,
        descripcion: "Cada 7 segundos, libera un chorro de agua en su posición, infligiendo 144% de daño de Ataque Esp. total a los enemigos cercanos y curando a sí mismo y a los aliados un 42% de sus HP máximos."
    },

    // ===== FAMILIA TINKATUFF =====
    "Tinkatuff, Tinkaton": {
        nombre: "Besito y a Mimir",
        id: "besito-y-a-mimir",
        carga: 7,
        alcance: 1,
        descripcion: "Tras 7 ataques básicos, salta al aire y aterriza sobre un oponente aleatorio, infligiendo 320% de daño de Ataque e inmovilizándolo durante 2 segundos. Sus ataques básicos se vuelven potenciados, dañando a todos los enemigos cercanos."
    },

    // ===== UMBREON =====
    "Umbreon": {
        nombre: "Pirueta del Eclipse",
        id: "pirueta-del-eclipse",
        carga: 5,
        alcance: 1,
        descripcion: "Cada 5 segundos, obtiene un escudo equivalente al 600% de su Ataque, roba el 100% de los escudos de un área amplia de Pokémon enemigos e inflige 80% de daño de Ataque."
    },

    // ===== FAMILIA VULPIX =====
    "Vulpix, Ninetales": {
        nombre: "Velo Aurora",
        id: "velo-aurora",
        esDeInicio: true,
        carga: 1,
        alcance: 8,
        descripcion: "Lanza Velo Aurora al inicio del combate. Los Pokémon aliados dentro del alcance reciben un 25% de reducción de daño y un 25% de aumento de Velocidad de Ataque hasta el final de la ronda."
    },

    // ===== ZERAORA =====
    "Zeraora": {
        nombre: "Chispazo",
        id: "chispazo",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, inflige 95% de daño de Ataque a los enemigos cercanos y restaura HP equivalente al 50% del daño infligido."
    },

    // ============================================================
    // ===== COSTE 3 =====
    // ============================================================

    // ===== ABSOL =====
    "Absol": {
        nombre: "Cercenador Umbrío",
        id: "cercenador-umbrio",
        carga: 7,
        alcance: 1,
        descripcion: "Tras 7 ataques básicos, realiza 5 golpes de 58% de daño de Ataque en un área amplia frente a él, y luego lanza cuchillas que infligen 120%/120%/360% de daño de Ataque. No puede recibir daño durante el movimiento, pero pierde un 10% de sus HP al terminar. Elimina instantáneamente a los rivales con menos del 30% de HP."
    },

    // ===== CLEFABLE =====
    "Clefable": {
        nombre: "Beso Drenaje",
        id: "beso-drenaje",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, usa varios Besos Drenaje, infligiendo 80%/80%/240% de daño de Ataque Esp. a los rivales en un radio de 2 casillas y generando un corazón curativo. El corazón vuela automáticamente al aliado con menos HP, restaurando un 350%/350%/1050% del Ataque Esp. de Clefable como HP."
    },

    // ===== ESPEON =====
    "Espeon": {
        nombre: "Poder Reserva",
        id: "poder-reserva",
        carga: 5,
        alcance: 4,
        descripcion: "Tras 5 ataques básicos, inflige 15 golpes de 45%/45%/135% de daño de Ataque Esp. a Pokémon rivales aleatorios."
    },

    // ===== GLACEON =====
    "Glaceon": {
        nombre: "Campo Glacial",
        id: "campo-glacial",
        carga: 5,
        alcance: 4,
        descripcion: "Tras 5 ataques básicos, inflige 220%/220%/660% de daño de Ataque Esp. a los rivales en un área en forma de rombo frente a él, congelándolos durante 1.5 segundos y aumentando el daño que reciben un 10%/10%/30%."
    },

    // ===== FAMILIA GOSSIFLEUR =====
    "Gossifleur, Eldegoss": {
        nombre: "Danza Pelusa",
        id: "danza-pelusa",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, golpea el suelo, infligiendo 100%/100%/300% de daño de Ataque Esp. a los enemigos adyacentes y retrocediéndolos, además de restaurar HP equivalente al 600%/600%/1800% de su Ataque Esp. a sí mismo y a los aliados adyacentes."
    },

    // ===== FAMILIA HAUNTER =====
    "Haunter, Gengar": {
        nombre: "Sobresalto",
        id: "sobresalto",
        carga: 6,
        alcance: 8,
        descripcion: "Tras 6 ataques básicos, se vuelve invisible y reaparece inmediatamente junto al enemigo más lejano, infligiendo 250%/250%/750% de daño de Ataque Esp. a los rivales circundantes y envenenándolos, causando 40/40/120 de daño de Ataque Esp. por segundo durante 5 segundos."
    },

    // ===== FAMILIA KUBFU =====
    "Kubfu, Urshifu": {
        nombre: "Torrente Furioso",
        id: "torrente-furioso",
        carga: 8,
        alcance: 8,
        descripcion: "Cada 8 ataques básicos, el patrón de ataque básico de Urshifu cambia. Se transforma de ataque básico a ataque básico potenciado, y luego a Golpe Torrencial, con el último golpe infligiendo daño en área."
    },

    // ===== LAPRAS =====
    "Lapras": {
        nombre: "A Todo Lapras",
        id: "a-todo-lapras",
        carga: 5,
        alcance: 1,
        descripcion: "Tras 5 ataques básicos, crea una ola que inflige 90%/90%/270% de daño de Ataque Esp. y empuja a los enemigos. Otorga a Lapras un escudo equivalente al 36%/36%/108% de sus HP durante 5 segundos."
    },

    // ===== FAMILIA SOBBLE =====
    "Sobble, Drizzile, Inteleon": {
        nombre: "Aguijón Letal",
        id: "aguijon-letal",
        carga: 4,
        alcance: 5,
        descripcion: "Tras 4 ataques básicos, se reposiciona rápidamente a la esquina izquierda o derecha, ganando 50 puntos de energía de movimiento, y hace que su siguiente movimiento sea un impacto crítico garantizado."
    },

    // ===== ZAPDOS =====
    "Zapdos": {
        nombre: "Rayo",
        id: "rayo-zapdos",
        iconoKey: "Rayo",
        carga: 3,
        alcance: 8,
        descripcion: "Tras 3 ataques básicos, usa Descarga. La electricidad viaja entre todos los rivales, infligiendo 65%/65%/195% de daño de Ataque Esp. Cada rival solo recibe daño una vez."
    },

    // ============================================================
    // ===== COSTE 4 =====
    // ============================================================

    // ===== DRAGONITE =====
    "Dragonite": {
        nombre: "Salto Sideral",
        id: "salto-sideral",
        carga: 7,
        alcance: 8,
        descripcion: "Tras 7 ataques básicos, gana un escudo equivalente al 550% de su Ataque, carga y salta al aire para golpear a un oponente aleatorio. Al aterrizar, inflige 280% de daño de Ataque y lanza por los aires a los oponentes en un radio de 2 casillas. A 3★, el alcance aumenta y hace caer meteoros continuamente."
    },

    // ===== GYARADOS =====
    "Gyarados": {
        nombre: "Chapuzón del Dragón",
        id: "chapuzon-del-dragon",
        carga: 6,
        alcance: 3,
        descripcion: "Tras 6 ataques básicos, Gyarados se sumerge bajo el agua, nada hacia un oponente aleatorio y emerge, lanzando por los aires a los oponentes en el área e infligiendo 480% de daño de Ataque. Además, los oponentes son dispersados a posiciones aleatorias."
    },

    // ===== HOOPA =====
    "Hoopa": {
        nombre: "Portal Desatado",
        id: "portal-desatado",
        carga: 4,
        alcance: 3,
        descripcion: "Tras 4 ataques básicos, genera Agujeros Dimensionales a los pies de todos los aliados, teletransportándoles Bayas. Cada Baya otorga uno de los siguientes efectos: restaura 15% de HP, restaura 15 puntos de energía, o aumenta Ataque y Atq. Esp. un 25% durante 4 segundos."
    },

    // ===== SNORLAX =====
    "Snorlax": {
        nombre: "Remolón sin Parangón",
        id: "remolon-sin-parangon",
        carga: 7,
        alcance: 1,
        descripcion: "Cada 7 segundos, aumenta sus HP máximos un 10%, se duerme e inflige 500% de daño de Ataque a una gran área de oponentes, lanzándolos por los aires. Después, restaura un 5% de sus HP máximos cada 0.5 segundos durante 5 segundos. A 3★, también realiza 2 rodadas consecutivas mientras duerme, infligiendo gran daño en área."
    },

    // ===== SYLVEON =====
    "Sylveon": {
        nombre: "Donaire Feérico",
        id: "donaire-feerico",
        carga: 8,
        alcance: 8,
        descripcion: "Cada 8 segundos, salta al aire y desciende, infligiendo 165% de daño de Atq. Esp. a los oponentes en un radio de 2 casillas y restaurando un 25% de sus propios HP. Sylveon luego refresca su barra de movimiento. A 3★, el alcance aumenta a 4 casillas y el movimiento se puede usar inmediatamente tras eliminar a un oponente."
    },

    // ===== TYRANITAR =====
    "Tyranitar": {
        nombre: "Cólera Titánica",
        id: "colera-titanica",
        carga: 3,
        alcance: 1,
        descripcion: "Tras 3 ataques básicos, entra en estado de berserk. Sus ataques básicos se convierten en daño en área, se reduce su alcance a 1 casilla, se garantizan impactos críticos y su velocidad de ataque aumenta un 80%. No puede ser inmovilizado mientras está enfurecido. A 3★, gana un +250% adicional de velocidad de ataque, sus ataques básicos son críticos garantizados y su alcance aumenta."
    },

    // ============================================================
    // ===== COSTE 5 =====
    // ============================================================

    // ===== HO-OH =====
    "Ho-Oh": {
        nombre: "Viento Afín",
        id: "viento-afin",
        esDeInicio: true,
        carga: 1,
        alcance: 8,
        descripcion: "Al inicio del combate, bate sus alas creando un viento fuerte que aumenta la Velocidad de Ataque de todos los aliados un 30% y reduce la Velocidad de Ataque de todos los oponentes un 30%, hasta el final de la ronda."
    },

    // ===== MEWTWO =====
    "Mewtwo": {
        nombre: "Espacio Raro",
        id: "espacio-raro",
        carga: 8,
        alcance: 3,
        descripcion: "Tras 8 ataques básicos, instala un Espacio Raro en el campo, aumentando el límite de energía de movimiento de todos los oponentes en 50 durante 5 segundos."
    },

    // ===== MIRAIDON =====
    "Miraidon": {
        nombre: "Motor Hadrónico",
        id: "motor-hadronico",
        carga: 5,
        alcance: 8,
        descripcion: "Cada 5 segundos, aumenta el daño de movimiento de todos los aliados un 15%, y todos los oponentes son aturdidos periódicamente durante 1 segundo."
    },

    // ============================================================
    // ===== ESPECIALES =====
    // ============================================================

    // ===== ZACIAN (INVOCACIÓN ESPECIAL) =====
    // 🆕 No equipa Disco Definitivo: usa `behemothBlade` (Hada nivel 6)
    //    como "disco virtual" para desbloquear la ulti.
    "Zacian": {
        nombre: "Tajo Supremo",
        id: "tajo-supremo-zacian",
        iconoKey: "Tajo Supremo",
        carga: 5,
        alcance: 99,
        descripcion: "Tras 5 ataques básicos, Zacian desata TAJO SUPREMO sobre TODOS los enemigos del tablero, infligiendo 550% de daño de Ataque. El daño aumenta un 50% adicional contra enemigos con escudo."
    }
};

// ============================================================
// CONSTRUIR EL OBJETO FINAL (expansión de familias)
// ============================================================

const ULTIS_POKEMON = {};

for (let clave in ULTIS_FAMILIAS) {
    const ulti = ULTIS_FAMILIAS[clave];
    const nombres = clave.split(',').map(n => n.trim());
    for (let nombre of nombres) {
        ULTIS_POKEMON[nombre] = ulti;
    }
}

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.ULTIS_FAMILIAS = ULTIS_FAMILIAS;
window.ULTIS_POKEMON = ULTIS_POKEMON;
