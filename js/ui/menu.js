// ============================================================
// MENÚ PRINCIPAL Y POKÉDEX (INTEGRACIÓN NUEVO DISEÑO)
// ============================================================

let pokedexAbierta = false;
let pokedexDetalleAbierto = false;
let pokedexModoShiny = false;   // ✨ detalle: ver forma shiny o normal
let nombreJugador = "Entrenador";
let avatarJugador = "rojo";
let nombreJugador2 = "Jugador 2";
let avatarJugador2 = "azul";
let colorBordeJ1 = "#4dd4f7";   // 🎨 color borde J1 (default cian)
let colorBordeJ2 = "#ff4d8d";   // 🎨 color borde J2 (default rosa)
let modoMenuSeleccionado = '1j';

// ===== COLORES DE BORDE DISPONIBLES =====
const COLORES_BORDE = [
    { id: 'cian',    valor: '#4dd4f7', nombre: 'Cian' },
    { id: 'rosa',    valor: '#ff4d8d', nombre: 'Rosa' },
    { id: 'rojo',    valor: '#ef4444', nombre: 'Rojo' },
    { id: 'naranja', valor: '#f97316', nombre: 'Naranja' },
    { id: 'dorado',  valor: '#fbbf24', nombre: 'Dorado' },
    { id: 'verde',   valor: '#34d399', nombre: 'Verde' },
    { id: 'azul',    valor: '#3b82f6', nombre: 'Azul' },
    { id: 'purpura', valor: '#a78bfa', nombre: 'Púrpura' },
    { id: 'blanco',  valor: '#e2e8f0', nombre: 'Blanco' },
];

// ===== LISTA DE AVATARES DISPONIBLES =====
const AVATARES_JUGADOR = [
    { id: "rojo",      nombre: "Rojo",      emoji: "🧢", archivo: "rojo.webp" },
    { id: "azul",      nombre: "Azul",      emoji: "👕", archivo: "azul.webp" },
    { id: "verde",     nombre: "Verde",     emoji: "🌿", archivo: "verde.webp" },
    { id: "amarillo",  nombre: "Amarillo",  emoji: "⚡", archivo: "amarillo.webp" },
    { id: "oro",       nombre: "Oro",       emoji: "🏆", archivo: "oro.webp" },
    { id: "plata",     nombre: "Plata",     emoji: "🥈", archivo: "plata.webp" },
    { id: "cristal",   nombre: "Cristal",   emoji: "💎", archivo: "cristal.webp" },
    { id: "rubi",      nombre: "Rubí",      emoji: "🔴", archivo: "rubi.webp" }
];

// ============================================================
// LISTA COMPLETA DE RIVALES (Restaurada)
// ============================================================
const RIVALES_INFO = [
    {
        nombre: "Rival",
        avatar: "rival",
        estrategia: { tipos: [], clases: [], prioridad: [], estilo: "equilibrado", dificultad: 2, descripcion: "Sin estrategia fija" },
        frases: { lose: ["¡Bien jugado, entrenador!", "¡Esto no ha acabado!", "¡Volveré más fuerte!", "¡Increíble!", "¡Buena pelea!"], win: ["¡Ja! ¿Eso es todo?", "¡Aún te falta mucho!", "¡Entrena más!", "¡Buena suerte la próxima!", "¡Así se juega!"], lowHp: ["¡Uf! Eso ha estado cerca...", "¡Por los pelos!", "¡No contaba con eso!"], lastStand: ["¡Esta es mi última oportunidad!", "¡Lo daré todo!"], start: ["¡Prepárate!", "¡Allá voy!"], thinking: ["🤔 ...", "Hmm...", "¿Y ahora qué?"] }
    },
    {
        nombre: "Misty",
        avatar: "misty",
        estrategia: { tipos: ["Agua"], clases: ["Auxiliar", "At. Especial", "Atacante"], prioridad: ["Squirtle", "Wartortle", "Blastoise", "Marill", "Azumarill", "Cramorant", "Sobble", "Drizzile", "Inteleon", "Lapras", "Gyarados"], estilo: "defensivo", dificultad: 4, descripcion: "Agua pura - La líder del gimnasio de Celeste" },
        frases: { lose: ["¡Mis Pokémon de Agua...!", "¡No puede ser!", "¡Esto no queda así!", "¡El agua... ha fallado!", "¡Maldición!"], win: ["¡El agua siempre gana!", "¡Mis Pokémon son los mejores!", "¡Nadie derrota a Misty!", "¡Aprende de los mejores!", "¡El agua fluye con fuerza!"], lowHp: ["¡Casi me tienes!", "¡Mis Pokémon aguantan todo!", "¡El agua fluye, no se rompe!"], lastStand: ["¡Como líder de gimnasio, no me rindo!", "¡Mis Pokémon lucharán hasta el final!", "¡El agua me da fuerzas!"], start: ["¡Mis Pokémon de Agua te ahogarán!", "¡No subestimes el poder del agua!", "¡Que empiece la marea!"], thinking: ["🤔 El agua fluye...", "Hmm...", "¿Y si...?", "¡Concéntrate, Misty!", "Mis Pokémon me guían..."] }
    },
    {
        nombre: "Rojo",
        avatar: "rojo",
        estrategia: { tipos: ["Fuego", "Agua", "Planta"], clases: ["Atacante", "Equilibrado", "Auxiliar"], prioridad: ["Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Bulbasaur", "Ivysaur", "Venusaur", "Pikachu", "Snorlax", "Lapras"], estilo: "equilibrado", dificultad: 5, descripcion: "Campeón de Kanto - Equipo mixto y versátil" },
        frases: { lose: ["...", "Bien jugado.", "Hmph.", "Tienes talento.", "Buen combate."], win: ["Así se hace.", "El fuego lo quema todo.", "Sigue entrenando.", "...", "Eres fuerte, pero no lo suficiente."], lowHp: ["Interesante...", "Buen ataque.", "No está mal."], lastStand: ["...", "Aún puedo luchar.", "No me rendiré."], start: ["...", "Demuéstrame tu valía."], thinking: ["...", "🤔", "Hmm...", "..."] }
    },
    {
        nombre: "Bruno",
        avatar: "bruno",
        estrategia: { tipos: ["Lucha"], clases: ["Equilibrado", "Atacante", "Defensa"], prioridad: ["Machop", "Machoke", "Machamp", "Lucario", "Kubfu", "Urshifu", "Tyranitar", "Ceruledge", "Dragonite"], estilo: "defensivo", dificultad: 3, descripcion: "Lucha pura - Frontline brutal y aguante" },
        frases: { lose: ["¡Buena pelea!", "¡Tu fuerza es admirable!", "¡Has ganado con honor!", "¡Eres fuerte, entrenador!", "¡Buen combate!"], win: ["¡La fuerza lo es todo!", "¡Entrena más tu cuerpo!", "¡Así se lucha!", "¡Buena batalla!", "¡Mis Pokémon son pura fuerza!"], lowHp: ["¡Uf! ¡Buena fuerza!", "¡Casi me tumbas!", "¡Eres fuerte!"], lastStand: ["¡No me rendiré!", "¡Por la fuerza de mis Pokémon!", "¡Mi cuerpo aguanta todo!"], start: ["¡Que gane el más fuerte!", "¡Demuéstrame tu poder!", "¡A luchar!"], thinking: ["🤔 ¡Fuerza!", "Hmm...", "¡Concéntrate, Bruno!", "¿Y si...?"] }
    },
    {
        nombre: "Lance",
        avatar: "lance",
        estrategia: { tipos: ["Dragón", "Volador", "Movimiento"], clases: ["Movimiento", "Atacante", "Ágil"], prioridad: ["Dragonite", "Miraidon", "Zapdos", "Gyarados", "Hoopa", "Charizard"], estilo: "agresivo", dificultad: 4, descripcion: "Dragón/Volador - El Campeón de Kanto/Johto" },
        frases: { lose: ["¡Increíble!", "¡Nunca había visto algo así!", "¡Tienes el espíritu de un dragón!", "¡Me has sorprendido!", "¡Buen combate, entrenador!"], win: ["¡Los dragones son superiores!", "¡Arrodíllate ante el campeón!", "¡Nadie vence a Lance!", "¡Los dragones lo dominan todo!", "¡Aprende del campeón!"], lowHp: ["¡Increíble! ¡Casi me derrotas!", "¡Tu fuerza es la de un campeón!", "¡Me has pillado!"], lastStand: ["¡El campeón no se rinde!", "¡Mi dragón interior arde!", "¡Mis Pokémon lucharán hasta el final!"], start: ["¡Prepárate para el poder de los dragones!", "¡Nadie escapa del campeón!", "¡Que empiece el combate!"], thinking: ["🤔 El dragón despierta...", "Hmm...", "Los dragones... me guían.", "¡Concéntrate, Lance!"] }
    },
    {
        nombre: "N",
        avatar: "n",
        estrategia: { tipos: [], clases: [], prioridad: [], estilo: "caotico", dificultad: 4, descripcion: "Multi-tipo caótico - Impredecible" },
        frases: { lose: ["Los Pokémon... no son herramientas.", "Interesante...", "Escucho sus voces...", "Tienes un vínculo especial.", "Los Pokémon te aprecian."], win: ["Los Pokémon sufren por ti.", "Los liberaré a todos.", "No entiendes sus sentimientos.", "Sus voces me llaman."], lowHp: ["Puedo... escucharlos...", "Los Pokémon... luchan por ti.", "Es... increíble."], lastStand: ["Los Pokémon no se rendirán.", "Escucho sus gritos."], start: ["Los Pokémon... me hablan.", "¿Entiendes sus sentimientos?"], thinking: ["Los Pokémon... me hablan.", "🤔 ¿Qué harían ellos?", "Escucho sus voces...", "El vínculo... me guía."] }
    },
    {
        nombre: "Sabrina",
        avatar: "sabrina",
        estrategia: { tipos: ["Psíquico"], clases: ["At. Especial", "Movimiento", "Auxiliar"], prioridad: ["Ralts", "Kirlia", "Gardevoir", "Espeon", "Mr. Mime", "Hoopa", "Mewtwo"], estilo: "equilibrado", dificultad: 4, descripcion: "Psíquico puro - Maestra del Alto Mando" },
        frases: { lose: ["...Lo vi venir.", "Interesante.", "El futuro... cambia.", "Mis visiones no eran claras."], win: ["¡Lo sabía!", "¡Mi mente todo lo ve!", "El futuro está escrito.", "Nadie escapa de mi poder."], lowHp: ["¿Cómo...? No lo vi.", "El futuro... es incierto.", "¡Impresionante!"], lastStand: ["El futuro aún no está escrito.", "¡Mi mente resistirá!"], start: ["Lo vi en mis visiones.", "El futuro... te espera."], thinking: ["El futuro... cambia.", "Veo algo...", "🤔 Las visiones...", "Los hilos del destino..."] }
    },
    {
        nombre: "Lectro",
        avatar: "lectro",
        estrategia: { tipos: ["Eléctrico"], clases: ["At. Especial", "Movimiento", "Ágil"], prioridad: ["Pikachu", "Zeraora", "Zapdos", "Miraidon", "Hoopa", "Snorlax"], estilo: "agresivo", dificultad: 4, descripcion: "Eléctrico puro - Stacks de Shock y descargas masivas" },
        frases: { lose: ["¡Mis chispas...!", "¡No puede ser!", "¡Esto no queda así!", "¡Mi electricidad ha fallado!", "¡Buen combate, entrenador!"], win: ["¡La electricidad siempre gana!", "¡Nadie derrota a Lectro!", "¡Chispazo!", "¡Aprende de los mejores!", "¡Mis Pokémon brillan con más fuerza!"], lowHp: ["¡Casi me tienes!", "¡Mis Pokémon aguantan todo!", "¡La corriente no se agota!"], lastStand: ["¡Como Líder de Gimnasio, no me rindo!", "¡La electricidad me da fuerzas!", "¡Mis Pokémon lucharán hasta el final!"], start: ["¡Mis Pokémon te electrocutarán!", "¡Siente el poder del rayo!", "¡Que empiece la descarga!"], thinking: ["🤔 La electricidad fluye...", "Hmm...", "¿Y si...?", "¡Concéntrate, Lectro!", "Mis Pokémon me guían..."] }
    },
    {
        nombre: "Lorelei",
        avatar: "lorelei",
        estrategia: { tipos: ["Hielo"], clases: ["Defensa", "Auxiliar", "At. Especial"], prioridad: ["Swinub", "Piloswine", "Mamoswine", "Cubchoo", "Beartic", "Vulpix", "Ninetales", "Glaceon", "Lapras", "Snorlax"], estilo: "defensivo", dificultad: 4, descripcion: "Hielo puro - Escarcha, congelación y muros inamovibles" },
        frases: { lose: ["¡Mis Pokémon de Hielo...!", "¡No puede ser!", "¡Esto no queda así!", "¡Mi escarcha ha fallado!", "¡Buen combate, entrenador!"], win: ["¡El hielo siempre gana!", "¡Nadie derrota a Lorelei!", "¡Congelado!", "¡Aprende de los mejores!", "¡Mis Pokémon brillan con el frío!"], lowHp: ["¡Casi me tienes!", "¡Mis Pokémon aguantan todo!", "¡El hielo no se rompe fácilmente!"], lastStand: ["¡Como miembro del Alto Mando, no me rindo!", "¡Mis Pokémon lucharán hasta el final!", "¡El frío me da fuerzas!"], start: ["¡Mis Pokémon de Hielo te congelarán!", "¡Siente el poder de la escarcha!", "¡Que empiece la ventisca!"], thinking: ["🤔 El hielo es paciente...", "Hmm...", "¿Y si...?", "¡Concéntrate, Lorelei!", "Mis Pokémon me guían..."] }
    },
    {
        nombre: "Agatha",
        avatar: "agatha",
        estrategia: { tipos: ["Fantasma"], clases: ["At. Especial", "Movimiento", "Ágil"], prioridad: ["Phantump", "Trevenant", "Haunter", "Gengar", "Ceruledge", "Hoopa", "Espeon", "Mewtwo"], estilo: "agresivo", dificultad: 5, descripcion: "Fantasma/Psíquico - Estado Fantasma y daño espectral masivo" },
        frases: { lose: ["¡Mis fantasmas...!", "¡No me lo puedo creer!", "¡Esto no queda así!", "¡Mi oscuridad ha fallado!"], win: ["¡Los fantasmas no descansan!", "¡Nadie escapa de la oscuridad!", "¡Ja!", "¡Aprende de los veteranos!"], lowHp: ["¡Los fantasmas no mueren!", "¡Esto no ha acabado!", "¡La oscuridad me protege!"], lastStand: ["¡Como miembro del Alto Mando, no me rindo!", "¡Los fantasmas no descansan!"], start: ["¡Siente el poder de los fantasmas!", "¡La oscuridad te consumirá!"], thinking: ["🤔 Los fantasmas susurran...", "Hmm...", "¿Y si...?", "¡Concéntrate, Agatha!"] }
    },
    {
        nombre: "Koga",
        avatar: "koga",
        estrategia: { tipos: ["Veneno"], clases: ["Movimiento", "Defensa", "At. Especial"], prioridad: ["Bulbasaur", "Ivysaur", "Venusaur", "Arbok", "Haunter", "Gengar", "Swinub", "Piloswine", "Mamoswine", "Lapras", "Snorlax"], estilo: "agresivo", dificultad: 4, descripcion: "Veneno puro - Veneno infinito y daño prolongado" },
        frases: { lose: ["¡Mi veneno... ha fallado!", "¡No me lo puedo creer!", "¡Esto no es el final!", "¡Mis Pokémon...!", "¡Buen combate, entrenador!"], win: ["¡El veneno lo consume todo!", "¡Nadie escapa del veneno!", "¡Patético!", "¡Aprende de los ninjas!", "¡Mis Pokémon son letales!"], lowHp: ["¡El veneno aún corre por mis venas!", "¡Esto no ha acabado!", "¡La niebla me protege!"], lastStand: ["¡Como miembro del Alto Mando, no me rindo!", "¡El veneno me da fuerzas!", "¡Mis Pokémon lucharán hasta el final!"], start: ["¡Siente el poder del veneno!", "¡La niebla te consumirá!", "¡Que empiece el combate!"], thinking: ["🤔 El veneno actúa lento...", "Hmm...", "¿Y si...?", "¡Concéntrate, Koga!", "La niebla me guía..."] }
    },
    {
        nombre: "Erika",
        avatar: "erika",
        estrategia: { tipos: ["Planta"], clases: ["Movimiento", "Auxiliar", "Atacante"], prioridad: ["Bulbasaur", "Ivysaur", "Venusaur", "Phantump", "Trevenant", "Leafeon", "Rowlet", "Dartrix", "Decidueye", "Gossifleur", "Eldegoss", "Mewtwo"], estilo: "defensivo", dificultad: 4, descripcion: "Planta puro - Regeneración, semillas y campo de hierba" },
        frases: { lose: ["¡Mis flores...!", "¡No puede ser!", "¡Esto no queda así!", "¡Mi jardín ha sido pisoteado!", "¡Buen combate, entrenador!"], win: ["¡La naturaleza siempre gana!", "¡Nadie derrota a Erika!", "¡Mis flores te han vencido!", "¡Aprende de la naturaleza!", "¡Mis Pokémon florecen con fuerza!"], lowHp: ["¡Casi me tienes!", "¡Mis Pokémon aguantan todo!", "¡La naturaleza se regenera!"], lastStand: ["¡Como Líder de Gimnasio, no me rindo!", "¡Mis Pokémon lucharán hasta el final!", "¡La naturaleza me da fuerzas!"], start: ["¡Mis Pokémon de Planta te envolverán!", "¡Siente el poder de la naturaleza!", "¡Que empiece el combate!"], thinking: ["🤔 La naturaleza es paciente...", "Hmm...", "¿Y si...?", "¡Concéntrate, Erika!", "Mis flores me guían..."] }
    },
    {
        nombre: "Valerie",
        avatar: "valerie",
        estrategia: { tipos: ["Hada"], clases: ["Auxiliar", "At. Especial", "Defensa"], prioridad: ["Marill", "Azumarill", "Mr. Mime", "Tinkatuff", "Tinkaton", "Clefable", "Sylveon", "Miraidon"], estilo: "equilibrado", dificultad: 4, descripcion: "Hada puro - Invoca a Zacian y domina con magia feérica" },
        frases: { lose: ["¡Mis hadas...!", "¡No puede ser!", "¡Esto no queda así!", "¡La magia ha fallado!", "¡Buen combate, entrenador!"], win: ["¡La magia feérica siempre gana!", "¡Nadie derrota a Valerie!", "¡Mis hadas te han hechizado!", "¡Aprende de la magia!", "¡Mis Pokémon brillan con luz feérica!"], lowHp: ["¡Casi me tienes!", "¡Mis hadas aguantan todo!", "¡La magia me protege!"], lastStand: ["¡Como Líder de Gimnasio, no me rindo!", "¡Mis hadas lucharán hasta el final!", "¡La magia me da fuerzas!"], start: ["¡Mis hadas te hechizarán!", "¡Siente el poder de la magia feérica!", "¡Que empiece el hechizo!"], thinking: ["🤔 La magia fluye...", "Hmm...", "¿Y si...?", "¡Concéntrate, Valerie!", "Mis hadas me guían..."] }
    },
    {
        nombre: "Blaine",
        avatar: "blaine",
        estrategia: { tipos: ["Fuego"], clases: ["Atacante", "Ágil", "Movimiento"], prioridad: ["Charmander", "Charmeleon", "Charizard", "Fennekin", "Braixen", "Delphox", "Scorbunny", "Raboot", "Cinderace", "Ceruledge", "Ho-Oh"], estilo: "agresivo", dificultad: 4, descripcion: "Fuego puro - Quemaduras y daño masivo" },
        frases: { lose: ["¡Mis llamas...!", "¡No puede ser!", "¡Esto no queda así!", "¡Mi fuego ha fallado!", "¡Buen combate, entrenador!"], win: ["¡El fuego lo quema todo!", "¡Nadie derrota a Blaine!", "¡Chamuscado!", "¡Aprende del fuego!", "¡Mis Pokémon arden con fuerza!"], lowHp: ["¡Casi me tienes!", "¡Mis llamas aguantan todo!", "¡El fuego no se apaga fácilmente!"], lastStand: ["¡Como Líder de Gimnasio, no me rindo!", "¡Mis Pokémon lucharán hasta el final!", "¡El fuego me da fuerzas!"], start: ["¡Mis Pokémon de Fuego te quemarán!", "¡Siente el poder de las llamas!", "¡Que empiece el incendio!"], thinking: ["🤔 El fuego es impaciente...", "Hmm...", "¿Y si...?", "¡Concéntrate, Blaine!", "Mis llamas me guían..."] }
    },
    {
        nombre: "Karen",
        avatar: "karen",
        estrategia: { tipos: ["Siniestro"], clases: ["Ágil", "Auxiliar", "Equilibrado"], prioridad: ["Zorua", "Zoroark", "Umbreon", "Absol", "Tyranitar", "Crustle", "Dragonite"], estilo: "equilibrado", dificultad: 4, descripcion: "Siniestro puro - Aura de Miedo y daño oscuro" },
        frases: { lose: ["¡Mis Pokémon Siniestros...!", "¡No puede ser!", "¡Esto no queda así!", "¡La oscuridad ha fallado!", "¡Buen combate, entrenador!"], win: ["¡La oscuridad siempre gana!", "¡Nadie derrota a Karen!", "¡Teme la oscuridad!", "¡Aprende del lado oscuro!", "¡Mis Pokémon dominan la noche!"], lowHp: ["¡Casi me tienes!", "¡Mis Pokémon aguantan todo!", "¡La oscuridad me protege!"], lastStand: ["¡Como miembro del Alto Mando, no me rindo!", "¡Mis Pokémon lucharán hasta el final!", "¡La oscuridad me da fuerzas!"], start: ["¡Mis Pokémon Siniestros te consumirán!", "¡Siente el poder de la oscuridad!", "¡Que empiece la noche!"], thinking: ["🤔 La oscuridad es paciente...", "Hmm...", "¿Y si...?", "¡Concéntrate, Karen!", "Mis Pokémon me guían..."] }
    },
    {
        nombre: "Noa",
        avatar: "noa",
        estrategia: { tipos: ["Eevee"], clases: ["At. Especial", "Auxiliar", "Hada"], prioridad: ["Leafeon", "Umbreon", "Espeon", "Glaceon", "Sylveon", "Clefable"], estilo: "equilibrado", dificultad: 4, descripcion: "Eevee puro - Las Eeveelutions, versátiles y adaptables" },
        frases: { lose: ["¡Mis Eeveelutions...!", "¡No puede ser!", "¡Esto no queda así!", "¡Mi equipo ha fallado!", "¡Buen combate, entrenador!"], win: ["¡Las Eeveelutions siempre ganan!", "¡Nadie derrota a Noa!", "¡Mis Pokémon son los mejores!", "¡Aprende de las Eeveelutions!", "¡Mis Pokémon brillan con fuerza!"], lowHp: ["¡Casi me tienes!", "¡Mis Eeveelutions aguantan todo!", "¡La versatilidad me protege!"], lastStand: ["¡Como líder del Team Star, no me rindo!", "¡Mis Eeveelutions lucharán hasta el final!", "¡La amistad me da fuerzas!"], start: ["¡Mis Eeveelutions te mostrarán el poder de la evolución!", "¡Siente la versatilidad de mi equipo!", "¡Que empiece el combate!"], thinking: ["🤔 ¿Cuál es la mejor evolución...?", "Hmm...", "¿Y si...?", "¡Concéntrate, Noa!", "Mis Eeveelutions me guían..."] }
    },
    {
        nombre: "Winona",
        avatar: "winona",
        estrategia: { tipos: ["Volador"], clases: ["Atacante", "Ágil", "Movimiento"], prioridad: ["Zapdos", "Gyarados", "Dragonite", "Ho-Oh", "Mewtwo", "Miraidon"], estilo: "agresivo", dificultad: 4, descripcion: "Volador puro - Dominio aéreo y golpes desde el cielo" },
        frases: { lose: ["¡Mis Pokémon Voladores...!", "¡No puede ser!", "¡Esto no queda así!", "¡El viento ha fallado!", "¡Buen combate, entrenador!"], win: ["¡El cielo es mío!", "¡Nadie derrota a Winona!", "¡Dominio aéreo total!", "¡Aprende a volar!", "¡Mis Pokémon surcan los cielos!"], lowHp: ["¡Casi me tienes!", "¡Mis Pokémon aguantan todo!", "¡El viento me protege!"], lastStand: ["¡Como Líder de Gimnasio, no me rindo!", "¡Mis Pokémon lucharán hasta el final!", "¡El cielo me da fuerzas!"], start: ["¡Mis Pokémon Voladores te dominarán!", "¡Siente el poder del viento!", "¡Que empiece el vuelo!"], thinking: ["🤔 El viento cambia...", "Hmm...", "¿Y si...?", "¡Concéntrate, Winona!", "Mis Pokémon me guían..."] }
    }
];

// ============================================================
// NAVEGACIÓN ENTRE VISTAS
// ============================================================
function abrirSeleccion(modo) {
    modoMenuSeleccionado = modo;
    window._iniciarTutorial1j = false;

    const btnTutorialSeleccion = document.getElementById('btnTutorial1j');
    if (btnTutorialSeleccion) {
        btnTutorialSeleccion.style.display = (modo === '1j') ? 'inline-flex' : 'none';
    }

    const titulo = document.getElementById('selTituloModo');
    const subtitulo = document.getElementById('selSubtituloModo');
    const panelJ2 = document.getElementById('panelJ2');
    const vsCenter = document.getElementById('vsCenter');

    if (modo === '1j') {
        titulo.textContent = '1 JUGADOR';
        subtitulo.textContent = 'Selecciona tu avatar y tu nombre';
        if (panelJ2) panelJ2.classList.add('oculto');
        if (vsCenter) vsCenter.classList.add('oculto');
    } else {
        titulo.textContent = '1 JUGADOR VS 2 JUGADORES';
        subtitulo.textContent = 'Selecciona tu avatar y tu nombre';
        if (panelJ2) panelJ2.classList.remove('oculto');
        if (vsCenter) vsCenter.classList.remove('oculto');
    }

    document.getElementById('vistaMenu').classList.remove('activa');
    document.getElementById('vistaSeleccion').classList.add('activa');

    if (typeof playButtonSound === 'function') playButtonSound();
}

function volverAlMenu() {
    document.getElementById('vistaSeleccion').classList.remove('activa');
    document.getElementById('vistaMenu').classList.add('activa');

    // 🗺️ El menú principal siempre muestra un mapa desbloqueado
    // (el elegido o Pradera), nunca el último terreno de una partida.
    if (window.LogrosUI && typeof LogrosUI.actualizarMapSelector === 'function') {
        LogrosUI.actualizarMapSelector();
    }

    if (typeof playButtonSound === 'function') playButtonSound();
}

// ============================================================
// CONSTRUIR GRID DE AVATARES
// ============================================================
function construirAvatarGridEn(containerId, avatarSeleccionado, onSelect) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';

    for (let avatar of AVATARES_JUGADOR) {
        const option = document.createElement('div');
        option.className = 'menu-avatar-option';
        option.dataset.avatarId = avatar.id;
        option.title = avatar.nombre;

        if (avatar.id === avatarSeleccionado) option.classList.add('selected');

        const img = document.createElement('img');
        img.src = `assets/avatars/jugador/${avatar.archivo}`;
        img.alt = avatar.nombre;
        img.draggable = false;
        img.onerror = function () {
            this.style.display = 'none';
            if (!option.querySelector('.avatar-emoji')) {
                const emoji = document.createElement('span');
                emoji.className = 'avatar-emoji';
                emoji.textContent = avatar.emoji;
                option.appendChild(emoji);
            }
        };
        option.appendChild(img);

        option.addEventListener('click', function () {
            grid.querySelectorAll('.menu-avatar-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            onSelect(avatar.id);

            const displayId = containerId === 'menuAvatarGrid' ? 'avatarDisplay1' : 'avatarDisplay2';
            const display = document.getElementById(displayId);
            if (display) {
                display.src = `assets/avatars/jugador/${avatar.archivo}`;
                display.style.display = 'block';
            }

            const esJugador1 = (containerId === 'menuAvatarGrid');
            const characterImgId = esJugador1 ? 'characterImage1' : 'characterImage2';
            const characterImg = document.getElementById(characterImgId);
            if (characterImg) {
                // avatar.archivo es "rojo.webp" (no .png): quitar CUALQUIER
                // extensión. Antes quedaba "rojofull.webp.webp" y daba 404.
                const nombreSinExtension = avatar.archivo.replace(/\.[^.]+$/, '');
                characterImg.onerror = function () {
                    this.onerror = null;
                    this.src = `assets/avatars/personajes/${nombreSinExtension}full.png`;
                };
                characterImg.src = `assets/avatars/personajes/${nombreSinExtension}full.webp`;
                characterImg.alt = avatar.nombre;
            }

            if (esJugador1) {
                const footerAvatar = document.getElementById('footerAvatar');
                if (footerAvatar) {
                    footerAvatar.innerHTML = '';
                    const footerImg = document.createElement('img');
                    footerImg.src = `assets/avatars/jugador/${avatar.archivo}`;
                    footerImg.alt = avatar.nombre;
                    footerImg.style.width = '100%';
                    footerImg.style.height = '100%';
                    footerImg.style.objectFit = 'cover';
                    footerImg.style.borderRadius = '50%';
                    footerImg.onerror = function() {
                        this.style.display = 'none';
                        footerAvatar.textContent = avatar.emoji;
                    };
                    footerAvatar.appendChild(footerImg);
                }
            }

            if (typeof playButtonSound === 'function') playButtonSound();
        });

        grid.appendChild(option);
    }
}

function construirAvatarGrid(avatarSeleccionado) {
    construirAvatarGridEn('menuAvatarGrid', avatarSeleccionado, function (id) {
        avatarJugador = id;
        window.avatarJugador = avatarJugador;
        try { localStorage.setItem('avatarJugador', avatarJugador); } catch (e) {}
    });
}

function construirAvatarGrid2(avatarSeleccionado) {
    construirAvatarGridEn('menuAvatarGrid2', avatarSeleccionado, function (id) {
        avatarJugador2 = id;
        window.avatarJugador2 = avatarJugador2;
        try { localStorage.setItem('avatarJugador2', avatarJugador2); } catch (e) {}
    });
}

// ============================================================
// 🎨 COLOR DE BORDE (selector de jugadores)
// ============================================================
function hexToRgbTriplet(hex) {
    if (typeof hex !== 'string') return '77, 212, 247';
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length !== 6) return '77, 212, 247';
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return '77, 212, 247';
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
window.hexToRgbTriplet = hexToRgbTriplet;

function aplicarColoresBorde() {
    const c1 = (typeof colorBordeJ1 === 'string' ? colorBordeJ1 : '#4dd4f7');
    const c2 = (typeof colorBordeJ2 === 'string' ? colorBordeJ2 : '#ff4d8d');
    const root = document.documentElement;
    if (root) {
        root.style.setProperty('--borde-j1-rgb', hexToRgbTriplet(c1));
        root.style.setProperty('--borde-j2-rgb', hexToRgbTriplet(c2));
    }
}
window.aplicarColoresBorde = aplicarColoresBorde;

function construirColorGrid(containerId, colorSeleccionado, onSelect) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    for (let c of COLORES_BORDE) {
        const opt = document.createElement('div');
        opt.className = 'menu-color-option';
        opt.style.background = c.valor;
        opt.title = c.nombre;
        if (c.valor.toLowerCase() === String(colorSeleccionado).toLowerCase()) opt.classList.add('selected');
        opt.addEventListener('click', function () {
            grid.querySelectorAll('.menu-color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            onSelect(c.valor);
            if (typeof playButtonSound === 'function') playButtonSound();
        });
        grid.appendChild(opt);
    }
}

function construirColorGrid1(sel) {
    construirColorGrid('menuColorGrid', sel, function (valor) {
        colorBordeJ1 = valor;
        window.colorBordeJ1 = valor;
        try { localStorage.setItem('colorBordeJ1', valor); } catch (e) {}
        aplicarColoresBorde();
    });
}

function construirColorGrid2(sel) {
    construirColorGrid('menuColorGrid2', sel, function (valor) {
        colorBordeJ2 = valor;
        window.colorBordeJ2 = valor;
        try { localStorage.setItem('colorBordeJ2', valor); } catch (e) {}
        aplicarColoresBorde();
    });
}

// ============================================================
// 🆕 FIX: conecta los botones del header de la Pokédex
// (📖 Pokédex y ⚙️ Ajustes) de forma idempotente.
// - Si los botones ya existen en el HTML, solo engancha listeners
//   si no los tenían ya (dataset.wired).
// - Si no existen, los crea.
// ============================================================
function conectarBotonesHeaderPokedex(overlay) {
    if (!overlay) return;

    const headerPokedex = overlay.querySelector('.menu-header');
    if (!headerPokedex) return;

    // 1) Si no hay .top-actions, lo creamos
    let topActions = headerPokedex.querySelector('.top-actions');
    if (!topActions) {
        topActions = document.createElement('div');
        topActions.className = 'top-actions';
        topActions.innerHTML = `
            <button class="menu-icon-btn" title="Perfil">👤</button>
            <button class="menu-icon-btn" title="Pokédex" id="btnCompendioPokedex">📖</button>
            <button class="menu-icon-btn" title="Ajustes" id="btnAjustesMenuPokedex">⚙️</button>
        `;
        headerPokedex.appendChild(topActions);
    }

    // 2) Perfil (sin acción por ahora)
    const btnPerfil = topActions.querySelector('button[title="Perfil"]');
    if (btnPerfil && btnPerfil.dataset.wired !== '1') {
        btnPerfil.dataset.wired = '1';
        btnPerfil.addEventListener('click', (e) => {
            e.preventDefault();
        });
    }

    // 3) 📖 Pokédex (refresca la lista si ya estamos dentro)
    const btnCompendio = topActions.querySelector('#btnCompendioPokedex')
        || topActions.querySelector('button[title="Pokédex"]');
    if (btnCompendio && btnCompendio.dataset.wired !== '1') {
        btnCompendio.dataset.wired = '1';
        btnCompendio.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof renderizarPokedex === 'function') renderizarPokedex();
        });
    }

    // 4) ⚙️ Ajustes
    const btnAjustes = topActions.querySelector('#btnAjustesMenuPokedex')
        || topActions.querySelector('button[title="Ajustes"]');
    if (btnAjustes && btnAjustes.dataset.wired !== '1') {
        btnAjustes.dataset.wired = '1';
        btnAjustes.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.abrirAjustes === 'function') {
                window.abrirAjustes();
            } else {
                console.warn('⚠️ window.abrirAjustes no está definida (¿ajustes.js no cargó?)');
            }
        });
    }
}

// ============================================================
// 🏷️ VERSIÓN DESPLEGADA (para saber si se ha actualizado)
// ============================================================
function initVersionBadge() {
    const el = document.getElementById('appVersion');
    if (!el) return;
    let yaIniciado = false;
    if (el.dataset.iniciado === '1') yaIniciado = true;
    el.dataset.iniciado = '1';

    async function refrescar() {
        // Abriendo index.html con doble clic (file://) no hay servidor: el fetch
        // a /api/version provocaba errores CORS en consola. Ahí no se consulta.
        if (location.protocol === 'file:') {
            el.textContent = 'v0.2.0 · local';
            el.title = 'Abierto como archivo local: la versión del servidor no está disponible.';
            return;
        }
        try {
            const r = await fetch('/api/version', { cache: 'no-store' });
            const d = await r.json();
            const clave = (d.commit || '') + '|' + (d.version || '');
            let prev = null;
            try { prev = localStorage.getItem('pktft_version'); } catch (e) { }
            const nueva = !!(prev && prev !== clave);
            try { localStorage.setItem('pktft_version', clave); } catch (e) { }

            const arranque = d.bootedAt ? new Date(d.bootedAt).toLocaleString('es-ES') : '—';
            el.textContent = `v${d.version || '?'} · ${d.commit || 'dev'}${nueva ? ' · 🆕 ACTUALIZADO' : ''}`;
            el.title =
                `Versión: ${d.version || '?'}\n` +
                `Commit: ${d.commit || 'dev'}${d.branch ? ' (' + d.branch + ')' : ''}\n` +
                `Servidor arrancado: ${arranque}\n` +
                `Entorno: ${d.env || '?'}\n\n` +
                'Pulsa para comprobar si hay una versión nueva.';
            el.classList.toggle('nueva', nueva);
            if (nueva) console.log(`🆕 Nueva versión desplegada: v${d.version} (${d.commit})`);
        } catch (e) {
            el.textContent = 'versión no disponible (servidor apagado)';
            el.title = String(e && e.message || e);
        }
    }

    el.addEventListener('click', async () => {
        const txt = el.textContent;
        el.textContent = 'comprobando…';
        await refrescar();
        setTimeout(() => { if (el.textContent === 'comprobando…') el.textContent = txt; }, 1500);
    });

    refrescar();
    // Re-comprobar al volver a la pestaña (útil tras desplegar)
    if (!yaIniciado) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') refrescar();
        });
    }
}

// ============================================================
// INICIALIZAR MENÚ
// ============================================================
function initMenu() {
    console.log("📋 Inicializando menú principal...");
    try { initVersionBadge(); } catch (e) { console.warn('No se pudo iniciar el badge de versión', e); }

    const menu = document.getElementById('menuPrincipal');
    const juego = document.getElementById('juegoContainer');

    if (menu) menu.style.display = 'flex';
    if (juego) juego.style.display = 'none';

    // Botones de modo
    document.getElementById('btnModo1j')?.addEventListener('click', () => abrirSeleccion('1j'));
    document.getElementById('btnModo2j')?.addEventListener('click', () => {
        if (typeof window.mostrarEleccion2J === 'function') window.mostrarEleccion2J();
        else abrirSeleccion('2j');
    });
    document.getElementById('btnVolverMenu')?.addEventListener('click', volverAlMenu);

    document.getElementById('btnModoCreativo')?.addEventListener('click', () => {
        // ⛶ Pantalla completa (dentro del gesto de usuario)
        if (typeof window.activarPantallaCompleta === 'function') window.activarPantallaCompleta();
        window.modoDosJugadores = false;
        window.turnoJugador = 1;
        if (typeof window.actualizarInterfazTurno === 'function') window.actualizarInterfazTurno();
        if (menu) menu.style.display = 'none';
        if (juego) juego.style.display = 'block';
        // 🔆 Evitar que la pantalla del móvil se apague durante la partida
        if (typeof window.activarPantallaSiempre === 'function') window.activarPantallaSiempre();
        if (typeof init === 'function') init();
        setTimeout(() => { if (typeof initModoCreativo === 'function') initModoCreativo(); }, 500);
    });

    // Inputs
    const inputNombre = document.getElementById('inputNombreJugador');
    const inputNombre2 = document.getElementById('inputNombreJugador2');
    const charCount1 = document.getElementById('charCount1');
    const charCount2 = document.getElementById('charCount2');

    try {
        const nombreGuardado = localStorage.getItem('nombreJugador');
        if (nombreGuardado && nombreGuardado.trim() !== '') nombreJugador = nombreGuardado.trim();
        const nombreGuardado2 = localStorage.getItem('nombreJugador2');
        if (nombreGuardado2 && nombreGuardado2.trim() !== '') nombreJugador2 = nombreGuardado2.trim();
    } catch (e) {}

    if (inputNombre) {
        inputNombre.value = nombreJugador;
        if (charCount1) charCount1.textContent = `${nombreJugador.length} / 16`;
        inputNombre.addEventListener('input', function () {
            const valor = this.value.trim();
            nombreJugador = valor !== '' ? valor : "Entrenador";
            window.nombreJugador = nombreJugador;
            if (charCount1) charCount1.textContent = `${this.value.length} / 16`;
            try { localStorage.setItem('nombreJugador', nombreJugador); } catch (e) {}
            const footerName = document.getElementById('footerName');
            if (footerName) footerName.textContent = nombreJugador;
        });
    }

    if (inputNombre2) {
        inputNombre2.value = nombreJugador2;
        if (charCount2) charCount2.textContent = `${nombreJugador2.length} / 16`;
        inputNombre2.addEventListener('input', function () {
            const valor = this.value.trim();
            nombreJugador2 = valor !== '' ? valor : "Jugador 2";
            window.nombreJugador2 = nombreJugador2;
            if (charCount2) charCount2.textContent = `${this.value.length} / 16`;
            try { localStorage.setItem('nombreJugador2', nombreJugador2); } catch (e) {}
        });
    }

    window.nombreJugador = nombreJugador;
    window.nombreJugador2 = nombreJugador2;

    // Avatares
    try {
        const avatarGuardado = localStorage.getItem('avatarJugador');
        if (avatarGuardado && AVATARES_JUGADOR.some(a => a.id === avatarGuardado)) avatarJugador = avatarGuardado;
        const avatarGuardado2 = localStorage.getItem('avatarJugador2');
        if (avatarGuardado2 && AVATARES_JUGADOR.some(a => a.id === avatarGuardado2)) avatarJugador2 = avatarGuardado2;
    } catch (e) {}

    window.avatarJugador = avatarJugador;
    window.avatarJugador2 = avatarJugador2;
    construirAvatarGrid(avatarJugador);
    construirAvatarGrid2(avatarJugador2);

    // 🎨 Colores de borde
    try {
        const c1 = localStorage.getItem('colorBordeJ1');
        if (c1) colorBordeJ1 = c1;
        const c2 = localStorage.getItem('colorBordeJ2');
        if (c2) colorBordeJ2 = c2;
    } catch (e) {}
    window.colorBordeJ1 = colorBordeJ1;
    window.colorBordeJ2 = colorBordeJ2;
    construirColorGrid1(colorBordeJ1);
    construirColorGrid2(colorBordeJ2);
    aplicarColoresBorde();

    // Avatar grande inicial y Footer
    const display1 = document.getElementById('avatarDisplay1');
    const footerAvatar = document.getElementById('footerAvatar');
    const av1 = AVATARES_JUGADOR.find(a => a.id === avatarJugador);

    if (display1) {
        if (av1) display1.src = `assets/avatars/jugador/${av1.archivo}`;
    }

    // Imagen grande (cuerpo completo) del avatar guardado, no la de Rojo/Azul.
    const character1 = document.getElementById('characterImage1');
    if (character1 && av1) {
        character1.onerror = function () {
            this.onerror = null;
            this.src = `assets/avatars/personajes/${av1.id}full.png`;
        };
        character1.src = `assets/avatars/personajes/${av1.id}full.webp`;
        character1.alt = av1.nombre;
    }

    if (footerAvatar) {
        const av = AVATARES_JUGADOR.find(a => a.id === avatarJugador);
        if (av) {
            footerAvatar.innerHTML = '';
            const footerImg = document.createElement('img');
            footerImg.src = `assets/avatars/jugador/${av.archivo}`;
            footerImg.alt = av.nombre;
            footerImg.style.width = '100%';
            footerImg.style.height = '100%';
            footerImg.style.objectFit = 'cover';
            footerImg.style.borderRadius = '50%';
            footerImg.onerror = function() {
                this.style.display = 'none';
                footerAvatar.textContent = av.emoji;
            };
            footerAvatar.appendChild(footerImg);
        }
    }

    const display2 = document.getElementById('avatarDisplay2');
    const av2 = AVATARES_JUGADOR.find(a => a.id === avatarJugador2);
    if (display2) {
        if (av2) display2.src = `assets/avatars/jugador/${av2.archivo}`;
    }
    const character2 = document.getElementById('characterImage2');
    if (character2 && av2) {
        character2.onerror = function () {
            this.onerror = null;
            this.src = `assets/avatars/personajes/${av2.id}full.png`;
        };
        character2.src = `assets/avatars/personajes/${av2.id}full.webp`;
        character2.alt = av2.nombre;
    }

    const footerName = document.getElementById('footerName');
    if (footerName) footerName.textContent = nombreJugador;

    // Botón ¡LISTO!
    const btnJugar = document.getElementById('btnJugar');
    if (btnJugar) {
        btnJugar.addEventListener('click', function (e) {
            e.preventDefault();

            // ⛶ Pantalla completa (debe pedirse dentro del gesto de usuario)
            if (typeof window.activarPantallaCompleta === 'function') window.activarPantallaCompleta();

            const esTutorial1j = (window._iniciarTutorial1j === true && modoMenuSeleccionado === '1j');
            window._iniciarTutorial1j = false;

            if (inputNombre) {
                const valor = inputNombre.value.trim();
                nombreJugador = valor !== '' ? valor : "Entrenador";
                window.nombreJugador = nombreJugador;
            }
            if (inputNombre2) {
                const valor2 = inputNombre2.value.trim();
                nombreJugador2 = valor2 !== '' ? valor2 : "Jugador 2";
                window.nombreJugador2 = nombreJugador2;
            }

            window.avatarJugador = avatarJugador;
            window.avatarJugador2 = avatarJugador2;

            const es2P = (modoMenuSeleccionado === '2j');
            console.log(`🎮 Iniciando partida (modo ${es2P ? '2 JUGADORES' : '1 JUGADOR'})`);

            if (menu) menu.style.display = 'none';
            if (juego) juego.style.display = 'block';

            // 🔆 Evitar que la pantalla del móvil se apague durante la partida
            if (typeof window.activarPantallaSiempre === 'function') window.activarPantallaSiempre();

            if (es2P) {
                window.modoDosJugadores = true;
                if (typeof init === 'function') init();
                setTimeout(() => {
                    if (typeof window.iniciarModoDosJugadores === 'function') window.iniciarModoDosJugadores();
                }, 300);
            } else {
                window.modoDosJugadores = false;
                window.turnoJugador = 1;
                if (typeof window.actualizarInterfazTurno === 'function') window.actualizarInterfazTurno();
                if (typeof init === 'function') init();

                if (esTutorial1j) {
                    setTimeout(function () {
                        if (typeof window.iniciarTutorial1j === 'function') {
                            window.iniciarTutorial1j();
                        }
                    }, 600);
                }
            }

            if (typeof playButtonSound === 'function') playButtonSound();
        });
    }

    // 🎓 Botón Tutorial (solo 1 jugador)
    const btnTutorial1j = document.getElementById('btnTutorial1j');
    if (btnTutorial1j) {
        btnTutorial1j.addEventListener('click', function (e) {
            e.preventDefault();
            window._iniciarTutorial1j = true;
            const btn = document.getElementById('btnJugar');
            if (btn) btn.click();
        });
    }

    // Pokédex
    const btnPokedex = document.getElementById('btnCompendio');
    if (btnPokedex) btnPokedex.addEventListener('click', function (e) { e.preventDefault(); abrirPokedex(); });

    // 🆕 Ajustes del menú principal
    const btnAjustesMenu = document.getElementById('btnAjustesMenu');
    if (btnAjustesMenu) {
        btnAjustesMenu.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.abrirAjustes === 'function') {
                window.abrirAjustes();
            }
        });
    }

    // 🆕 Botones del header de la vista de selección
    const btnPokedexSeleccion = document.getElementById('btnCompendioSeleccion');
    if (btnPokedexSeleccion) {
        btnPokedexSeleccion.addEventListener('click', function (e) {
            e.preventDefault();
            abrirPokedex();
        });
    }

    const btnAjustesSeleccion = document.getElementById('btnAjustesMenuSeleccion');
    if (btnAjustesSeleccion) {
        btnAjustesSeleccion.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.abrirAjustes === 'function') {
                window.abrirAjustes();
            }
        });
    }
    document.getElementById('btnCerrarPokedex')?.addEventListener('click', cerrarPokedex);
    document.getElementById('pokedexOverlay')?.addEventListener('click', function (e) { if (e.target === this) cerrarPokedex(); });

    const btnVolverDetalle = document.getElementById('btnPokedexDetalleVolver');
    if (btnVolverDetalle) btnVolverDetalle.addEventListener('click', cerrarPokedexDetalle);
    const btnCerrarDetalle = document.getElementById('btnPokedexDetalleCerrar');
    if (btnCerrarDetalle) btnCerrarDetalle.addEventListener('click', function() { cerrarPokedexDetalle(); cerrarPokedex(); });
    document.getElementById('pokedexDetalleOverlay')?.addEventListener('click', function(e) { if (e.target === this) cerrarPokedexDetalle(); });

    document.getElementById('pokedexFiltroTexto')?.addEventListener('input', renderizarPokedex);
    document.getElementById('pokedexFiltroTipo')?.addEventListener('change', renderizarPokedex);
    document.getElementById('pokedexFiltroCoste')?.addEventListener('change', renderizarPokedex);
    document.getElementById('pokedexFiltroEstado')?.addEventListener('change', renderizarPokedex);

    console.log("✅ Menú inicializado correctamente");
}

// ============================================================
// POKÉDEX (Restaurada)
// ============================================================
function abrirPokedex() {
    const overlay = document.getElementById('pokedexOverlay');
    if (!overlay) return;

    // Ocultar menú principal y selección
    const vistaMenu = document.getElementById('vistaMenu');
    const vistaSeleccion = document.getElementById('vistaSeleccion');
    if (vistaMenu) vistaMenu.classList.remove('activa');
    if (vistaSeleccion) vistaSeleccion.classList.remove('activa');

    // 🆕 FIX: conectar SIEMPRE los botones del header de la Pokédex
    conectarBotonesHeaderPokedex(overlay);

    // Mostrar Pokédex
    overlay.classList.add('visible');
    pokedexAbierta = true;
    renderizarPokedex();
    document.body.style.overflow = 'hidden';
}

function cerrarPokedex() {
    const overlay = document.getElementById('pokedexOverlay');
    if (!overlay) return;
    pokedexAbierta = false;
    overlay.classList.remove('visible');
    document.body.style.overflow = '';

    // Volver al menú principal
    const vistaMenu = document.getElementById('vistaMenu');
    const vistaSeleccion = document.getElementById('vistaSeleccion');
    if (vistaMenu) vistaMenu.classList.add('activa');
    if (vistaSeleccion) vistaSeleccion.classList.remove('activa');
}

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function renderizarPokedex() {
    const grid = document.getElementById('pokedexGrid');
    const contador = document.getElementById('pokedexContador');
    const filtroTexto = document.getElementById('pokedexFiltroTexto');
    const filtroTipo = document.getElementById('pokedexFiltroTipo');
    const filtroCoste = document.getElementById('pokedexFiltroCoste');
    const filtroEstado = document.getElementById('pokedexFiltroEstado');

    // 📖 Progreso de la Pokédex (registrados / vistos / total)
    const progEl = document.getElementById('pokedexProgreso');
    if (progEl && typeof Pokedex !== 'undefined') {
        const c = Pokedex.contar();
        progEl.textContent = `✅ ${c.comprados} registrados · 👁 ${c.vistos} vistos / ${c.total}`
            + (c.shinies > 0 ? ` · ✨ ${c.shinies} shiny` : '');
    }

    if (!grid) return;

    const texto = filtroTexto ? filtroTexto.value.toLowerCase() : '';
    const tipoSeleccionado = filtroTipo ? filtroTipo.value : 'todos';
    const costeSeleccionado = filtroCoste ? filtroCoste.value : 'todos';

    let pokemons = (typeof POKEMONS !== 'undefined') ? [...POKEMONS] : [];

    if (pokemons.length === 0) {
        grid.innerHTML = `<div class="pokedex-vacio">⚠️ Los datos de Pokémon no están disponibles</div>`;
        return;
    }

    const tipoNormalizado = normalizarTexto(tipoSeleccionado);
    const estadoSeleccionado = filtroEstado ? filtroEstado.value : 'todos';

    pokemons = pokemons.filter(p => {
        const estadoP = (typeof Pokedex !== 'undefined') ? Pokedex.estadoDe(p.nombre) : 'comprado';
        if (estadoSeleccionado === 'comprados' && estadoP !== 'comprado') return false;
        if (estadoSeleccionado === 'vistos' && estadoP !== 'visto') return false;
        if (estadoSeleccionado === 'no-vistos' && estadoP !== 'no-visto') return false;
        if (texto && !p.nombre.toLowerCase().includes(texto)) return false;
        if (tipoSeleccionado !== 'todos') {
            let coincide = false;
            if (p.tipos && Array.isArray(p.tipos)) {
                for (let t of p.tipos) if (normalizarTexto(t) === tipoNormalizado) { coincide = true; break; }
            }
            if (!coincide && p.clase && normalizarTexto(p.clase) === tipoNormalizado) coincide = true;
            if (!coincide) return false;
        }
        if (costeSeleccionado !== 'todos' && p.coste !== parseInt(costeSeleccionado)) return false;
        return true;
    });

    if (pokemons.length === 0) {
        grid.innerHTML = `<div class="pokedex-vacio">🔍 No se encontraron Pokémon con esos filtros</div>`;
        if (contador) contador.textContent = '0 Pokémon';
        return;
    }

    pokemons.sort((a, b) => {
        if (a.coste !== b.coste) return a.coste - b.coste;
        return a.nombre.localeCompare(b.nombre);
    });

    if (contador) contador.textContent = `${pokemons.length} Pokémon`;
    grid.innerHTML = '';

    pokemons.forEach(p => {
        const card = document.createElement('div');
        const coste = p.coste || 1;
        const estadoP = (typeof Pokedex !== 'undefined') ? Pokedex.estadoDe(p.nombre) : 'comprado';
        card.className = `pokedex-card cost-${coste} ${estadoP}`;
        const nombreMostrar = estadoP === 'no-visto' ? '???' : p.nombre;

        // ✨ Si has comprado la versión shiny, la ficha usa su sprite shiny.
        const esShinyP = estadoP === 'comprado'
            && typeof Pokedex !== 'undefined'
            && typeof Pokedex.tieneShiny === 'function'
            && Pokedex.tieneShiny(p.nombre);

        const spriteUrl = typeof getSpriteUrl === 'function' ? getSpriteUrl(p.spriteId, p.nombre, esShinyP) : '';
        const escalaSprite = typeof getSpriteScale === 'function' ? getSpriteScale(p.spriteId) : 1;
        const offsetXSprite = typeof getSpriteOffsetX === 'function' ? getSpriteOffsetX(p.spriteId) : '0px';

        let tiposHtml = '';
        if (p.tipos) {
            tiposHtml = p.tipos.map(t => {
                const icon = typeof getIconoTipo === 'function' ? getIconoTipo(t) : t;
                return `<span class="pokedex-tipo-icon" title="${t}">${icon}</span>`;
            }).join('');
        }
        if (p.clase) {
            const icon = typeof getIconoClase === 'function' ? getIconoClase(p.clase) : p.clase;
            tiposHtml += `<span class="pokedex-tipo-icon" title="${p.clase}">${icon}</span>`;
        }

        const costeHtml = `
            <div class="pokedex-card-coste">
                <img src="assets/icons/moneda.png" alt="💰" draggable="false">
                ${coste}
            </div>
        `;

        const estrellasHtml = typeof getEstrellasUrl === 'function'
            ? `<img class="pokedex-card-stars" src="${getEstrellasUrl(1)}" alt="1★" draggable="false">`
            : '';

        let evolucionHtml = '';
        if (p.evolucion) evolucionHtml = `<div class="pokedex-card-evolucion">➜ ${p.evolucion}</div>`;

        card.innerHTML = `
            <div class="pokedex-card-tipos">${tiposHtml}</div>
            ${costeHtml}
            ${esShinyP ? '<div class="pokedex-card-shiny" title="Shiny registrado">✨</div>' : ''}
            <img class="pokedex-card-sprite" src="${spriteUrl}" alt="${p.nombre}" draggable="false" style="--sprite-scale: ${escalaSprite}; --sprite-offset-x: ${offsetXSprite}" onerror="this.style.display='none';">
            <div class="pokedex-card-nombre">${nombreMostrar}</div>
            ${estrellasHtml}
            ${evolucionHtml}
            <div class="pokedex-card-estado ${estadoP}" title="${estadoP === 'comprado' ? 'Registrado' : (estadoP === 'visto' ? 'Visto en combate' : 'No visto')}">${estadoP === 'comprado' ? '✅' : (estadoP === 'visto' ? '👁' : '❓')}</div>
        `;

        card.title = estadoP === 'comprado'
            ? `${p.nombre} (Coste ${coste})${esShinyP ? ' · ✨ Shiny' : ''}`
            : (estadoP === 'visto' ? `${p.nombre} · Visto (sin datos)` : '??? · No visto');
        card.addEventListener('click', function () {
            abrirPokedexDetalle(p);
            if (typeof playButtonSound === 'function') playButtonSound();
        });

        grid.appendChild(card);
    });
}

function cerrarPokedexDetalle() {
    const overlay = document.getElementById('pokedexDetalleOverlay');
    if (overlay) overlay.classList.remove('visible');
    pokedexDetalleAbierto = false;
}

function construirPokedexDetalleBloqueado(pokemon, estado) {
    const visto = estado === 'visto';
    const nombre = visto ? pokemon.nombre : '???';
    const spriteUrl = (visto && typeof getSpriteUrl === 'function')
        ? getSpriteUrl(pokemon.spriteId, pokemon.nombre)
        : '';
    return `
        <div class="pokedex-detalle-bloqueado ${estado}">
            ${spriteUrl ? `<img class="pokedex-detalle-sprite-bloqueado" src="${spriteUrl}" alt="${nombre}" draggable="false">` : ''}
            <div class="pokedex-detalle-bloqueado-icono">${visto ? '👁' : '❓'}</div>
            <h2>${nombre}</h2>
            <p>${visto
                ? 'Visto en combate. Aún no lo has registrado: compra este Pokémon en la tienda para ver sus datos.'
                : 'Todavía no lo has visto. Aparecerá aquí cuando lo veas en combate o lo compres.'}</p>
        </div>
    `;
}

function abrirPokedexDetalle(pokemon) {
    if (!pokemon) return;
    const overlay = document.getElementById('pokedexDetalleOverlay');
    const body = document.getElementById('pokedexDetalleBody');
    if (!overlay || !body) return;

    const estadoP = (typeof Pokedex !== 'undefined') ? Pokedex.estadoDe(pokemon.nombre) : 'comprado';
    if (estadoP !== 'comprado') {
        body.innerHTML = construirPokedexDetalleBloqueado(pokemon, estadoP);
        overlay.classList.add('visible');
        pokedexDetalleAbierto = true;
        return;
    }

    let formaBase = pokemon;
    if (typeof TODOS_POKEMONS !== 'undefined') {
        let iteraciones = 0;
        while (iteraciones < 10) {
            iteraciones++;
            let padre = TODOS_POKEMONS.find(p => p.evolucion === formaBase.nombre);
            if (!padre) break;
            formaBase = padre;
        }
    }
    window._pokedexDetalleBase = formaBase;
    window._pokedexDetalleNivel = 1;
    pokedexModoShiny = (typeof Pokedex !== 'undefined' && typeof Pokedex.tieneShiny === 'function')
        ? Pokedex.tieneShiny(formaBase.nombre)
        : false;

    body.innerHTML = construirPokedexDetalleHtml(formaBase, 1);
    overlay.classList.add('visible');
    pokedexDetalleAbierto = true;
    engacharEventosDetalle(formaBase);
}

function engacharEventosDetalle(pokemonBase) {
    const body = document.getElementById('pokedexDetalleBody');
    if (!body) return;
    body.querySelectorAll('.pokedex-detalle-star-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const nivel = parseInt(this.dataset.nivel);
            if (isNaN(nivel)) return;
            const base = window._pokedexDetalleBase || pokemonBase;
            window._pokedexDetalleNivel = nivel;
            body.innerHTML = construirPokedexDetalleHtml(base, nivel);
            engacharEventosDetalle(base);
            if (typeof playButtonSound === 'function') playButtonSound();
        });
    });

    // ✨ Alternar entre la forma normal y la shiny (solo si la has comprado)
    const shinyBtn = body.querySelector('.pokedex-detalle-shiny-toggle');
    if (shinyBtn) {
        shinyBtn.addEventListener('click', function () {
            const base = window._pokedexDetalleBase || pokemonBase;
            const nivel = window._pokedexDetalleNivel || 1;
            pokedexModoShiny = !pokedexModoShiny;
            body.innerHTML = construirPokedexDetalleHtml(base, nivel);
            engacharEventosDetalle(base);
            if (typeof playButtonSound === 'function') playButtonSound();
        });
    }
}

function construirPokedexDetalleHtml(p, nivelSeleccionado = 1) {
    function resolverFormaParaNivel(formaBase, nivel) {
        if (!formaBase) return formaBase;
        if (nivel <= 1) return formaBase;
        let actual = formaBase;
        for (let i = 1; i < nivel; i++) {
            if (!actual.evolucion) break;
            const siguiente = (typeof getPokemonPorNombre === 'function')
                ? getPokemonPorNombre(actual.evolucion)
                : (typeof TODOS_POKEMONS !== 'undefined' ? TODOS_POKEMONS.find(x => x.nombre === actual.evolucion) : null);
            if (!siguiente) break;
            actual = siguiente;
        }
        return actual;
    }

    const formaMostrada = resolverFormaParaNivel(p, nivelSeleccionado);
    const coste = formaMostrada.coste || p.coste || 1;
    const nivel = nivelSeleccionado;

    const spriteId = formaMostrada.spriteId || formaMostrada.id;

    // ✨ Forma shiny (si la familia tiene shiny registrado y existe el sprite)
    const shinyRegistrado = (typeof Pokedex !== 'undefined' && typeof Pokedex.tieneShiny === 'function')
        ? Pokedex.tieneShiny(p.nombre)
        : false;
    const shinyDisponible = (typeof tieneSpriteShiny === 'function')
        ? tieneSpriteShiny(spriteId, formaMostrada.nombre)
        : true;
    const esShiny = pokedexModoShiny && shinyRegistrado && shinyDisponible;

    const spriteUrl = typeof getSpriteUrl === 'function' ? getSpriteUrl(spriteId, formaMostrada.nombre, esShiny) : '';

    function getStatValue(stat, nivel) {
        if (stat === null || stat === undefined) return 0;
        if (Array.isArray(stat)) {
            const idx = Math.min(nivel - 1, stat.length - 1);
            const val = stat[idx];
            return (typeof val === 'number' && !isNaN(val)) ? val : 0;
        }
        if (typeof stat === 'object') {
            if (stat[nivel] !== undefined) return stat[nivel];
            const keys = Object.keys(stat).map(Number).sort((a, b) => a - b);
            for (let k of keys) { if (k >= nivel) return stat[k]; }
            return stat[keys[keys.length - 1]] || 0;
        }
        return (typeof stat === 'number' && !isNaN(stat)) ? stat : 0;
    }

    const hp = getStatValue(formaMostrada.hp, nivel);
    const ataque = getStatValue(formaMostrada.ataque, nivel);
    const spAttack = getStatValue(formaMostrada.spAttack, nivel);
    const defensa = formaMostrada.defense || 0;
    const spDefensa = formaMostrada.spDefense || 0;
    const velocidad = formaMostrada.attackSpeed || 0.8;

    let tiposHtml = '';
    if (formaMostrada.tipos) {
        tiposHtml = formaMostrada.tipos.map(t => {
            const icon = typeof getIconoTipo === 'function' ? getIconoTipo(t) : t;
            return `<div class="pokedex-detalle-badge-tipo">${icon} ${t}</div>`;
        }).join('');
    }

    let claseHtml = '';
    if (formaMostrada.clase) {
        const icon = typeof getIconoClase === 'function' ? getIconoClase(formaMostrada.clase) : formaMostrada.clase;
        claseHtml = `<div class="pokedex-detalle-badge-clase">${icon} ${formaMostrada.clase}</div>`;
    }

    let evolucionHtml = '';
    if (formaMostrada.evolucion) evolucionHtml = `<div class="pokedex-detalle-evolucion">🔄 Evoluciona a ${formaMostrada.evolucion}</div>`;
    else evolucionHtml = `<div class="pokedex-detalle-evolucion" style="color:#6b8aaa;border-color:rgba(107,138,170,0.3);">✦ Forma final</div>`;

    let starsSelectorHtml = `<div class="pokedex-detalle-stars-selector"><span class="pokedex-detalle-stars-label">Nivel</span>`;
    [1, 2, 3].forEach(n => {
        const activo = (n === nivel) ? 'active' : '';
        const estrellasUrl = typeof getEstrellasUrl === 'function' ? getEstrellasUrl(n) : '';
        starsSelectorHtml += `
            <button class="pokedex-detalle-star-btn ${activo}" data-nivel="${n}">
                ${estrellasUrl ? `<img src="${estrellasUrl}" alt="${n}★" draggable="false">` : ''}
                ${n}★
            </button>
        `;
    });
    starsSelectorHtml += `</div>`;

        const movimientos = typeof getMovimientosPokemon === 'function' ? getMovimientosPokemon(formaMostrada.nombre) : [];
    let movPrincipal = movimientos[0] || null;
    let movSecundario = (typeof MOVIMIENTOS_SECUNDARIOS !== 'undefined' && MOVIMIENTOS_SECUNDARIOS[formaMostrada.nombre]) ? MOVIMIENTOS_SECUNDARIOS[formaMostrada.nombre] : null;
    let movimientosHtml = '';

    if (movPrincipal) {
        const iconoHtml = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(movPrincipal.iconoKey || movPrincipal.nombre, 36) : '⚔️';
        const tipoIcon = typeof getIconoTipo === 'function' ? getIconoTipo(movPrincipal.tipo) : '';

        // 🆕 Descripción del movimiento
        const nombreLimpio = typeof limpiarNombreMovimiento === 'function' ? limpiarNombreMovimiento(movPrincipal.nombre) : movPrincipal.nombre;
        const descData = typeof getDescripcionMovimiento === 'function' ? getDescripcionMovimiento(nombreLimpio, movPrincipal.iconoKey) : null;
        const descripcionHtml = descData && descData.descripcion
            ? `<div class="mov-desc">${descData.descripcion}</div>`
            : `<div class="mov-desc mov-desc-vacia">Sin descripción disponible.</div>`;
        const alcanceHtml = descData && descData.alcance
            ? `<div class="mov-alcance">📏 ${descData.alcance}</div>`
            : '';

        movimientosHtml += `
            <div class="pokedex-detalle-movimiento principal" data-mov-nombre="${movPrincipal.nombre}" data-mov-id="${movPrincipal.iconoKey || movPrincipal.nombre}">
                <div class="mov-icono">${iconoHtml}</div>
                <div class="mov-info">
                    <div class="mov-nombre">${movPrincipal.nombre}</div>
                    <div class="mov-tipo">${tipoIcon} ${movPrincipal.tipo || ''}</div>
                    ${descripcionHtml}
                    ${alcanceHtml}
                </div>
                <div class="mov-badge">PRINCIPAL</div>
            </div>
        `;
    }
    if (movSecundario) {
        const iconoHtml = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(movSecundario.iconoKey || movSecundario.nombre, 36) : '⚔️';
        const tipoIcon = typeof getIconoTipo === 'function' ? getIconoTipo(movSecundario.tipo) : '';

        // 🆕 Descripción del movimiento
        const nombreLimpio = typeof limpiarNombreMovimiento === 'function' ? limpiarNombreMovimiento(movSecundario.nombre) : movSecundario.nombre;
        const descData = typeof getDescripcionMovimiento === 'function' ? getDescripcionMovimiento(nombreLimpio, movSecundario.iconoKey) : null;
        const descripcionHtml = descData && descData.descripcion
            ? `<div class="mov-desc">${descData.descripcion}</div>`
            : `<div class="mov-desc mov-desc-vacia">Sin descripción disponible.</div>`;
        const alcanceHtml = descData && descData.alcance
            ? `<div class="mov-alcance">📏 ${descData.alcance}</div>`
            : '';

        movimientosHtml += `
            <div class="pokedex-detalle-movimiento secundario" data-mov-nombre="${movSecundario.nombre}" data-mov-id="${movSecundario.iconoKey || movSecundario.nombre}">
                <div class="mov-icono">${iconoHtml}</div>
                <div class="mov-info">
                    <div class="mov-nombre">${movSecundario.nombre}</div>
                    <div class="mov-tipo">${tipoIcon} ${movSecundario.tipo || ''}</div>
                    ${descripcionHtml}
                    ${alcanceHtml}
                </div>
                <div class="mov-badge">2★</div>
            </div>
        `;
    }
    if (!movimientosHtml) movimientosHtml = `<div class="pokedex-vacio" style="grid-column:1/-1;">Sin movimientos registrados</div>`;

    const ulti = (typeof ULTIS_POKEMON !== 'undefined' && ULTIS_POKEMON[formaMostrada.nombre]) ? ULTIS_POKEMON[formaMostrada.nombre] : null;
    let ultiHtml = '';
    if (ulti) {
        const iconoUlti = typeof getIconoMovimientoHtml === 'function' ? getIconoMovimientoHtml(ulti.iconoKey || ulti.nombre, 48) : '⚡';
        let metaHtml = '';
        if (ulti.carga) metaHtml += `<span class="item">⚡ ${ulti.carga} ataques</span>`;
        if (ulti.alcance) metaHtml += `<span class="item">📏 ${ulti.alcance} casillas</span>`;
        if (ulti.esDeInicio) metaHtml += `<span class="item">🚀 Al inicio</span>`;
        ultiHtml = `<div class="pokedex-detalle-seccion-titulo">⚡ ULTIMATE</div><div class="pokedex-detalle-ulti"><div class="ulti-icono">${iconoUlti}</div><div class="ulti-info"><div class="ulti-nombre">${ulti.nombre}</div><div class="ulti-desc">${ulti.descripcion || 'Sin descripción'}</div><div class="ulti-meta">${metaHtml}</div></div></div>`;
    } else {
        ultiHtml = `<div class="pokedex-detalle-seccion-titulo">⚡ ULTIMATE</div><div class="pokedex-detalle-ulti" style="opacity:0.5;"><div class="ulti-icono">⚡</div><div class="ulti-info"><div class="ulti-nombre">Sin ulti registrada</div></div></div>`;
    }

    const estrellasUrl = typeof getEstrellasUrl === 'function' ? getEstrellasUrl(nivel) : '';
    const escalaSprite = typeof getSpriteScale === 'function' ? getSpriteScale(spriteId) : 1;
    const offsetXSprite = typeof getSpriteOffsetX === 'function' ? getSpriteOffsetX(spriteId) : '0px';

    return `
        <div class="pokedex-detalle-cabecera cost-${coste}${esShiny ? ' shiny' : ''}">
            <div class="pokedex-detalle-sprite-wrapper"><img class="pokedex-detalle-sprite" src="${spriteUrl}" alt="${formaMostrada.nombre}" draggable="false" style="--sprite-scale: ${escalaSprite}; --sprite-offset-x: ${offsetXSprite}" onerror="this.style.display='none';"></div>
            <div class="pokedex-detalle-info">
                <div class="pokedex-detalle-nombre">${formaMostrada.nombre}</div>
                <div class="pokedex-detalle-subinfo"><span class="item"><img src="assets/icons/moneda.png" alt="💰" draggable="false"> Coste ${coste}</span>${estrellasUrl ? `<span class="item"><img src="${estrellasUrl}" alt="${nivel}★" draggable="false"> Nivel ${nivel}★</span>` : ''}${esShiny ? '<span class="item pokedex-detalle-shiny-tag">✨ Shiny</span>' : ''}</div>
                <div class="pokedex-detalle-badges">${tiposHtml}${claseHtml}</div>
                ${(shinyRegistrado && shinyDisponible) ? `<button type="button" class="pokedex-detalle-shiny-toggle${esShiny ? ' activo' : ''}">${esShiny ? '🎨 Ver forma normal' : '✨ Ver forma shiny'}</button>` : ''}
            </div>
            ${evolucionHtml}
        </div>
        ${starsSelectorHtml}
        <div class="pokedex-detalle-stats">
            <div class="pokedex-detalle-stat"><span class="stat-label">❤️ HP</span><span class="stat-value">${Math.round(hp || 0)}</span></div>
            <div class="pokedex-detalle-stat"><span class="stat-label">⚔️ Ataque</span><span class="stat-value">${Math.round(ataque || 0)}</span></div>
            <div class="pokedex-detalle-stat"><span class="stat-label">🔮 Atq. Esp</span><span class="stat-value">${Math.round(spAttack || 0)}</span></div>
            <div class="pokedex-detalle-stat"><span class="stat-label">🛡️ Defensa</span><span class="stat-value">${Math.round(defensa)}</span></div>
            <div class="pokedex-detalle-stat"><span class="stat-label">🛡️ Def. Esp</span><span class="stat-value">${Math.round(spDefensa)}</span></div>
            <div class="pokedex-detalle-stat"><span class="stat-label">💨 Vel. Ataque</span><span class="stat-value">${Math.round(velocidad * 10) / 10}</span></div>
        </div>
        <div class="pokedex-detalle-seccion-titulo">🎯 MOVIMIENTOS</div>
        <div class="pokedex-detalle-movimientos">${movimientosHtml}</div>
        ${ultiHtml}
    `;
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMenu();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initMenu, 50);
    });
}

// ===== EXPONER GLOBALMENTE =====
window.RIVALES_INFO = RIVALES_INFO;
window.AVATARES_JUGADOR = AVATARES_JUGADOR;
window.abrirPokedex = abrirPokedex;
window.cerrarPokedex = cerrarPokedex;
window.renderizarPokedex = renderizarPokedex;
window.abrirPokedexDetalle = abrirPokedexDetalle;
window.cerrarPokedexDetalle = cerrarPokedexDetalle;
window.abrirSeleccion = abrirSeleccion;
window.volverAlMenu = volverAlMenu;
window.conectarBotonesHeaderPokedex = conectarBotonesHeaderPokedex;