// ============================================================
// MOVIMIENTOS INFO - DATOS DE MOVIMIENTOS
// ============================================================

const movimientosInfo = {
    // ============================================================
    // COSTE 1
    // ============================================================

    // ===== BULBASAUR / IVYSAUR / VENUSAUR =====
    "Látigo Cepa": {
        descripcion: "Inflige un 390% de daño de Ataque Esp. hacia el oponente actual y reduce la Velocidad de Ataque de todos los enemigos en el camino un 30% durante 3 segundos.",
        alcance: "3 casillas",
        tipo: "Planta",
        efecto: "Reducción de Velocidad"
    },
    "Bomba Lodo": {
        descripcion: "Lanza una Bomba Lodo al rival actual que inflige un 260% de daño de Ataque Esp. al explotar. Envenena al objetivo y reduce su Defensa y Def. Esp. en 120. El veneno causa 20 de daño de Ataque Esp. por segundo durante 5 segundos.",
        alcance: "4 casillas",
        tipo: "Veneno",
        efecto: "Veneno"
    },

    // ===== CHARMANDER / CHARMELEON / CHARIZARD =====
        "Lanzallamas": {
        descripcion: "Inflige un 270% de daño de Ataque al oponente adyacente y reduce su Defensa y Def. Esp. un 30% durante 4 segundos.",
        alcance: "1 casilla",
        tipo: "Fuego",
        efecto: "Reducción de Defensa y Def. Esp."
    },
    "Puño Fuego": {
        descripcion: "Otorga un escudo equivalente al 420% del Ataque e inflige un 225% de daño de Ataque al oponente actual.",
        alcance: "1 casilla",
        tipo: "Fuego",
        efecto: "Potenciación"
    },

    // ===== CRAMORANT =====
    "Vendaval": {
        descripcion: "Desata una tormenta en la ubicación de un oponente al azar, infligiendo un 200% de daño de Ataque Esp. y lanzándolo por los aires durante 0.75 segundos.",
        alcance: "8 casillas",
        tipo: "Volador",
        efecto: "Reducción de Velocidad"
    },
    "Tajo Aéreo": {
        descripcion: "Lanza 5 Tajo Aéreo al objetivo actual. Cada uno inflige un 32% de daño de Ataque esp., reduciendo su Velocidad de Ataque un 30% y su Defensa y Def. Esp. en 100 durante 3 segundos.",
        alcance: "8 casillas",
        tipo: "Volador",
        efecto: "Crítico"
    },

    // ===== DWEBLE / CRUSTLE =====
    "Trampa Rocas": {
        descripcion: "Despliega un campo de rocas afiladas a su alrededor durante 3 segundos, infligiendo un 124% de daño de Ataque a los oponentes cercanos y restaurando un 15% de HP.",
        alcance: "1 casilla",
        tipo: "Roca",
        efecto: "Campo de daño"
    },
    "Tijera X": {
        descripcion: "Otorga 1500 de Defensa y Def. Esp. durante 5 segundos, luego ataca hacia adelante 3 veces infligiendo un 40% de daño de Ataque.",
        alcance: "1 casilla",
        tipo: "Bicho",
        efecto: "Reducción de Defensa"
    },

    // ===== MACHOP / MACHOKE / MACHAMP =====
    "Tajo Cruzado": {
        descripcion: "Inflige un 144% de daño de Ataque al oponente actual y aumenta su propia Velocidad de Ataque un 30% durante 4 segundos.",
        alcance: "1 casilla",
        tipo: "Lucha",
        efecto: "Crítico"
    },
    "Sumisión": {
        descripcion: "Agarra al oponente actual, inflige un 138% de daño de Ataque y luego lo azota contra el suelo, infligiendo un 138% de daño de Ataque al objetivo y a los enemigos adyacentes a 1 casilla de distancia.",
        alcance: "1 casilla",
        tipo: "Lucha",
        efecto: "Daño de retroceso"
    },

    // ===== MARILL / AZUMARILL =====
    "Torbellino": {
        descripcion: "Un torbellino rodea a Azumarill, infligiendo un 200% de daño de Ataque a los enemigos cercanos y restaurando HP equivalentes al 200% de su Ataque.",
        alcance: "1 casilla",
        tipo: "Agua",
        efecto: "Reducción de Defensa"
    },
    "Carantoña": {
        descripcion: "Inflige un 240% de daño de Ataque al objetivo actual e inmoviliza al rival. Mientras la habilidad esté activa, Azumarill no puede ser seleccionado como objetivo.",
        alcance: "1 casilla",
        tipo: "Hada",
        efecto: "Reducción de Ataque Especial"
    },

    // ===== PHANTUMP / TREVENANT =====
    "Divide Dolor": {
        descripcion: "Se enlaza al oponente, transfiriéndole un 15% del daño recibido. Mientras tanto, aumenta sus HP Máximos un 18% hasta el final de la ronda.",
        alcance: "1 casilla",
        tipo: "Normal",
        efecto: "Robo de vida"
    },
    "Asta Drenaje": {
        descripcion: "Empuja al oponente 2 casillas hacia atrás en la dirección actual, infligiendo un 35% de daño de Ataque, lanzándolo por los aires y restaurando un 15% de HP.",
        alcance: "1 casilla",
        tipo: "Planta",
        efecto: "Robo de vida"
    },

    // ===== PIKACHU =====
    "Bola Voltio": {
        descripcion: "Lanza una bola de electricidad al oponente actual, infligiendo un 620% de daño de Ataque esp.",
        alcance: "4 casillas",
        tipo: "Eléctrico",
        efecto: "Parálisis"
    },
    "Placaje Eléctrico": {
        descripcion: "Salta hacia el oponente, lanzándolo por los aires e infligiendo un 80% de daño de Ataque esp. 5 veces; luego, Pikachu regresa y aumenta la Velocidad de Ataque de todos los aliados un 20% durante 3 segundos.",
        alcance: "4 casillas",
        tipo: "Eléctrico",
        efecto: "Parálisis"
    },

    // ===== RALTS / KIRLIA / GARDEVOIR =====
    "Fuerza Lunar": {
        descripcion: "Dispara una bola mágica al oponente actual, infligiendo un 400% de daño de Ataque esp. e inmovilizándolo durante 1 segundo.",
        alcance: "4 casillas",
        tipo: "Hada",
        efecto: "Reducción de Ataque Especial"
    },
    "Premonición": {
        descripcion: "Despliega un círculo mágico sobre un oponente al azar que explota tras un instante, infligiendo un 350% de daño de Ataque esp. al objetivo y a los rivales circundantes.",
        alcance: "8 casillas",
        tipo: "Psíquico",
        efecto: "Crítico garantizado"
    },

    // ===== SWINUB / PILOSWINE / MAMOSWINE =====
    "Colmillo Hielo": {
        descripcion: "Aumenta la Defensa y Def. Esp. en 1500 durante 3 segundos. Congela al objetivo actual, lo eleva y lo azota contra el suelo, infligiendo un 144% de daño de Ataque.",
        alcance: "1 casilla",
        tipo: "Hielo",
        efecto: "Congelación"
    },
    "Terremoto": {
        descripcion: "Salta en el lugar, infligiendo un 46% de daño de Ataque y lanzando por los aires a los Pokémon rivales cercanos durante 1.5 segundos.",
        alcance: "1 casilla",
        tipo: "Tierra",
        efecto: "Daño en área + Reducción de Velocidad"
    },

    // ===== ZORUA / ZOROARK =====
    "Finta": {
        descripcion: "Ataca al oponente actual 4 veces, infligiendo un 80% de daño de Ataque.",
        alcance: "1 casilla",
        tipo: "Siniestro",
        efecto: "Ignora defensas"
    },
    "Garra Umbría": {
        descripcion: "Inflige un 280% de daño de Ataque al objetivo actual y lo lanza por los aires.",
        alcance: "1 casilla",
        tipo: "Fantasma",
        efecto: "Robo de estadísticas"
    },

    // ===== EEVEE =====
    "Ataque Rápido": {
        descripcion: "Inflige un 100% de daño de Ataque al oponente actual. Golpea primero (prioridad).",
        alcance: "1 casilla",
        tipo: "Normal",
        efecto: "Prioridad"
    },
    "Meteoros": {
        descripcion: "Lanza estrellas al oponente actual, infligiendo un 150% de daño de Ataque Esp. Nunca falla.",
        alcance: "4 casillas",
        tipo: "Normal",
        efecto: "Daño garantizado"
    },

    // ============================================================
    // COSTE 2
    // ============================================================

    // ===== ARBOK =====
    "Bomba Ácida": {
        descripcion: "Inflige un 80% de daño de Ataque esp. hacia adelante y envenena al enemigo durante 5 segundos, causando 30 de daño de Ataque esp. por segundo. Restaura un 38% de HP.",
        alcance: "1 casilla",
        tipo: "Veneno",
        efecto: "Veneno"
    },
    "Picotazo Veneno": {
        descripcion: "Lanza 3 agujas venenosas a enemigos al azar, envenenándolos durante 5 segundos (30 de daño de Ataque esp. por segundo) y reduciendo tanto el Ataque como el Ataque esp. un 30% durante 5 segundos.",
        alcance: "8 casillas",
        tipo: "Veneno",
        efecto: "Veneno grave"
    },

    // ===== CERULEDGE =====
    "Espada Lamento": {
        descripcion: "Inflige un 220% de daño de Ataque en un cono frontal y restaura HP equivalente al 50% del daño infligido.",
        alcance: "1 casilla",
        tipo: "Fuego",
        efecto: "Aumento de Velocidad"
    },
    "Psicocorte": {
        descripcion: "Inflige un 120% de daño de Ataque y reduce la Defensa y Def. Esp. del objetivo en 120. Los ataques básicos se potencian y golpean dos veces durante 4 segundos.",
        alcance: "8 casilla",
        tipo: "Psíquico",
        efecto: "Reducción de Defensa Especial"
    },

    // ===== CUBCHOO / BEARTIC =====
    "Nieve Polvo": {
        descripcion: "Inflige un 80% de daño de Ataque en un cono frontal y otorga un 60% de reducción de daño durante 4 segundos.",
        alcance: "1 casilla",
        tipo: "Hielo",
        efecto: "Reducción de Velocidad"
    },
    "Chuzos": {
        descripcion: "Fija como objetivo a un enemigo al azar, infligiendo un 280% de daño de Ataque en área y generando un chuzo en su ubicación.",
        alcance: "8 casillas",
        tipo: "Hielo",
        efecto: "Congelación"
    },

    // ===== FENNEKIN / BRAIXEN / DELPHOX =====
    "Giro Fuego": {
        descripcion: "Lanza un vórtice ígneo a los pies del oponente que, tras un breve retraso, inflige un 130% de daño de Ataque esp. e inmoviliza al rival durante 1.5 segundos.",
        alcance: "4 casillas",
        tipo: "Fuego",
        efecto: "Quemadura"
    },
    "Nitrocarga": {
        descripcion: "Dispara 3 bolas de fuego y salta a una casilla adyacente. Cada bola de fuego fija como objetivo a un Pokémon enemigo al azar, infligiendo un 120% de daño de Ataque esp.",
        alcance: "4 casillas",
        tipo: "Fuego",
        efecto: "Confusión"
    },

    // ===== LEAFEON =====
    "Hoja Afilada": {
        descripcion: "Otorga un escudo equivalente al 350% del Ataque, lanza 5 hojas hacia adelante y luego las atrae de vuelta. Cada hoja inflige un 30% de daño de Ataque.",
        alcance: "1 casilla",
        tipo: "Planta",
        efecto: "Crítico"
    },
    "Hoja Aguda": {
        descripcion: "Salta detrás del objetivo actual y gira, infligiendo un 280% de daño de Ataque a los enemigos circundantes.",
        alcance: "1 casilla",
        tipo: "Planta",
        efecto: "Reducción de Defensa Especial"
    },

    // ===== LUCARIO =====
    "Velocidad Extrema": {
        descripcion: "Inflige un 100% de daño de Ataque una vez a cada oponente en el campo y restaura HP equivalente al 40% del Ataque. Cada golpe también cuenta como un ataque básico.",
        alcance: "1 casilla",
        tipo: "Normal",
        efecto: "Reducción de Defensa"
    },
    "A Bocajarro": {
        descripcion: "Inflige un 200% de daño de Ataque a los enemigos situados enfrente y restaura HP equivalente al 200% del Ataque.",
        alcance: "1 casilla",
        tipo: "Lucha",
        efecto: "Aumento de Ataque"
    },

    // ===== MR. MIME =====
    "Cambiafuerza": {
        descripcion: "Se enlaza al oponente actual, inflige continuamente un 12% de daño de Ataque esp. y restaura HP equivalente al 100% del Ataque esp. Cada golpe reduce la barra de movimientos del rival en 2 puntos.",
        alcance: "1 casilla",
        tipo: "Psíquico",
        efecto: "Reducción de Ataque"
    },
    "Psíquico": {
        descripcion: "Genera un campo de fuerza a su alrededor que inflige un 160% de daño de Ataque esp. a los oponentes en su interior. Luego detona el área, inmovilizándolos durante 1 segundo.",
        alcance: "1 casilla",
        tipo: "Psíquico",
        efecto: "Aumento de Ataque"
    },

    // ===== ROWLET / DARTRIX / DECIDUEYE =====
    "Sombra Vil": {
        descripcion: "Lanza un ataque de sombra al oponente más cercano, infligiendo un 180% de daño de Ataque y reduciendo la Defensa y Def. Esp. un 20% durante 8 segundos.",
        alcance: "4 casillas",
        tipo: "Fantasma",
        efecto: "Reducción de Defensa Especial"
    },
    "Lluevehojas": {
        descripcion: "Lanza una tormenta hacia el oponente más lejano, infligiendo un 240% de daño de Ataque a todos los enemigos en el camino.",
        alcance: "8 casillas",
        tipo: "Planta",
        efecto: "Reducción de Defensa Especial"
    },

    // ===== SCORBUNNY / RABOOT / CINDERACE =====
    "Ascuas": {
        descripcion: "Lanza una chispa al oponente actual, infligiendo un 200% de daño de Ataque.",
        alcance: "4 casillas",
        tipo: "Fuego",
        efecto: "Prioridad"
    },
    "Patada Ígnea": {
        descripcion: "Se desplaza hacia el objetivo y le da una patada, infligiendo un 150% de daño de Ataque y reduciendo la Defensa y Def. Esp. un 25% durante 5 segundos; luego, regresa a su posición original.",
        alcance: "4 casillas",
        tipo: "Fuego",
        efecto: "Daño de retroceso"
    },

    // ===== SQUIRTLE / WARTORTLE / BLASTOISE =====
    "Hidrobomba": {
        descripcion: "Dispara un cañón de agua, infligiendo un 168% de daño de Ataque esp. al oponente de enfrente e inmovilizándolo durante 1.5 segundos.",
        alcance: "1 casilla",
        tipo: "Agua",
        efecto: "Reducción de Velocidad"
    },
    "Giro Rápido": {
        descripcion: "Entra en un estado de giro, infligiendo un 40% de daño de Ataque esp. a los enemigos circundantes, aumentando la Defensa y Def. Esp. en 1500, y otorgando un escudo equivalente al 30% de sus propios HP.",
        alcance: "1 casilla",
        tipo: "Normal",
        efecto: "Limpieza"
    },

    // ===== TINKATUFF / TINKATON =====
    "Martillo Hielo": {
        descripcion: "Inflige un 180% de daño de Ataque al objetivo actual y a su área circundante de 1 casilla. Evita la recuperación de la barra de movimientos y reduce la Velocidad de Ataque un 20% durante 3 segundos.",
        alcance: "1 casilla",
        tipo: "Hielo",
        efecto: "Crítico"
    },
    "Martillo Colosal": {
        descripcion: "Tras cargarse, inflige un 240% de daño de Ataque al objetivo actual y a su área circundante de 1 casilla.",
        alcance: "1 casilla",
        tipo: "Acero",
        efecto: "Crítico"
    },

    // ===== UMBREON =====
    "Alarido": {
        descripcion: "Otorga un escudo equivalente al 900% del Ataque e inflige un 13.8% de daño de Ataque a los oponentes cercanos.",
        alcance: "1 casilla",
        tipo: "Siniestro",
        efecto: "Reducción de Defensa"
    },

    "Mal de Ojo": {
        descripcion: "Otorga un escudo equivalente al 650% del Ataque, provoca a los enemigos cercanos y los inmoviliza.",
        alcance: "1 casilla",
        tipo: "Siniestro",
        efecto: "Reducción de Defensa"
    },

    // ===== VULPIX / NINETALES =====
    "Ventisca": {
        descripcion: "Lanza Ventisca al oponente actual, empujándolo 1 casilla e infligiendo un 100% de daño de Ataque esp. Luego, se forma una tormenta de nieve en el destino que inflige un 240% de daño de Ataque esp.",
        alcance: "8 casillas",
        tipo: "Hielo",
        efecto: "Congelación en área"
    },
    "Alud": {
        descripcion: "Fija como objetivo al oponente con el mayor Ataque esp. usando Alud, creando un muro de hielo. Tras un instante, el muro se derrumba, infligiendo un 260% de daño de Ataque esp. a los enemigos cercanos e inmovilizándolos durante 1.5 segundos.",
        alcance: "8 casillas",
        tipo: "Hielo",
        efecto: "Congelación en área"
    },

    // ===== ZERAORA =====
    "Voltiocambio": {
        descripcion: "Se desplaza rápidamente detrás del oponente más lejano y regresa, infligiendo un 100% de daño de Ataque a todos los enemigos en el camino. Cada golpe aumenta la Velocidad de Ataque un 10% durante 5 segundos.",
        alcance: "8 casillas",
        tipo: "Eléctrico",
        efecto: "Aumento de Velocidad"
    },
    "Voltio cruel": {
        descripcion: "Se abalanza sobre el oponente y ataca 3 veces, infligiendo un total de 160% de daño de Ataque. Cada golpe reduce la energía de movimiento del rival en 4 puntos.",
        alcance: "1 casilla",
        tipo: "Eléctrico",
        efecto: "Aumento de Velocidad"
    },

    // ============================================================
    // COSTE 3
    // ============================================================

    // ===== ABSOL =====
    "Tajo Umbrío": {
        descripcion: "Se desplaza en arco, infligiendo un 200%/200%/600% de daño de Ataque. Luego se desplaza detrás del oponente más cercano, infligiendo un 220%/220%/660% de daño de Ataque a los rivales en el camino. Elimina instantáneamente a los Pokémon enemigos con menos del 15% de HP.",
        alcance: "1 casilla",
        tipo: "Siniestro",
        efecto: "Crítico"
    },

    "Golpe Bajo": {
        descripcion: "Adopta una postura defensiva y fija como objetivo al oponente con menos HP, reduciendo el daño recibido un 50% durante este tiempo. Si recibe el impacto de un ataque enemigo, se desplaza hacia el objetivo fijado, infligiendo un 550%/550%/1650% de daño de Ataque e inmovilizándolo durante 1 segundo. Si no recibe daño durante este tiempo, inflige un 450%/450%/1350% de daño de Ataque al objetivo fijado.",
        alcance: "8 casillas",
        tipo: "Siniestro",
        efecto: "Crítico"
    },

    // ===== CLEFABLE =====
    "Señuelo": {
        descripcion: "Obtiene un escudo equivalente al 40%/40%/120% de sus HP y provoca a los oponentes circundantes.",
        alcance: "1 casilla",
        tipo: "Normal",
        efecto: "Robo de vida"
    },

    "Luz Lunar": {
        descripcion: "Se restaura a sí mismo y a los aliados circundantes HP equivalentes al 80%/80%/240% de su Ataque esp. durante 3 segundos.",
        alcance: "1 casilla",
        tipo: "Normal",
        efecto: "Robo de vida"
    },

    // ===== ESPEON =====
    "Psicocarga": {
        descripcion: "Dispara 5 orbes al enemigo actual. Los orbes viajan una distancia e infligen un 100%/100%/300% de daño de Ataque esp. a quienes impacten.",
        alcance: "3 casillas",
        tipo: "Psíquico",
        efecto: "Robo de vida"
    },

    "Premonición": {
        descripcion: "Dispara una energía psíquica al objetivo actual que explota poco después, infligiendo un 210%/210%/630% de daño de Ataque esp. a este y a los enemigos circundantes a 2 casillas de distancia, y reduce su Velocidad de Ataque un 10%/10%/30% durante 1.5 segundos.",
        alcance: "3 casillas",
        tipo: "Psíquico",
        efecto: "Robo de vida"
    },

    // ===== GLACEON =====
    "Viento Hielo": {
        descripcion: "Obtiene 2 Esquirlas de Hielo (máx. 8) y luego las dispara al oponente actual. Cada Esquirla de Hielo inflige un 135%/135%/405% de daño de Ataque esp.",
        alcance: "4 casillas",
        tipo: "Hielo",
        efecto: "Congelación en área"
    },
    "Carámbano": {
        descripcion: "Obtiene 2 Esquirlas de Hielo (máx. 8) y luego las activa todas de forma secuencial, disparándolas en dirección al oponente actual; atraviesan a los rivales e infligen un 150%/150%/450% de daño de Ataque esp. a los oponentes golpeados.",
        alcance: "4 casillas",
        tipo: "Hielo",
        efecto: "Congelación en área"
    },

   // ===== GOSSIFLEUR / ELDEGOSS =====
    "Rizo Algodón": {
        descripcion: "Otorga escudos equivalentes al 850%/850%/2550% y 500%/500%/1500% del Ataque esp. a sí mismo y a los aliados cercanos durante 4 segundos.",
        alcance: "1 casilla",
        tipo: "Planta",
        efecto: "Robo de vida"
    },
    "Ciclón de Hojas": {
        descripcion: "Inflige un 300%/300%/900% de daño de Ataque esp. y empuja a los enemigos en línea recta, y aumenta la Velocidad de Ataque de los aliados un 30%/30%/90% durante 3 segundos en su trayectoria.",
        alcance: "1 casilla",
        tipo: "Planta",
        efecto: "Robo de vida"
    },

    // ===== HAUNTER / GENGAR =====
    "Bomba Lodo": {
        descripcion: "Lanza lodo al oponente actual, infligiendo un 400%/400%/1200% de daño de Ataque esp. en un área de 3 casillas. Los oponentes alcanzados quedan envenenados, sufriendo 40/40/120 de daño de Ataque esp. por segundo durante 5 segundos.",
        alcance: "8 casillas",
        tipo: "Veneno",
        efecto: "Veneno"
    },
    "Comesueños": {
        descripcion: "Lanza una onda de sueño hacia el oponente actual que causa un breve efecto de sueño al impactar. Gengar aparece de inmediato cerca del rival, infligiendo un 200%/200%/600% de daño de Ataque esp. y un 40%/40%/80% de los HP restantes como daño de Ataque esp. adicional.",
        alcance: "8 casillas",
        tipo: "Psíquico",
        efecto: "Robo de vida"
    },

    // ===== KUBFU / URSHIFU =====
    "Azote Torrencial": {
        descripcion: "Inflige 3 golpes de 130%/130%/330% de daño de Ataque al oponente. El tercer golpe es un impacto crítico garantizado y empuja al oponente al acertar.",
        alcance: "1 casilla",
        tipo: "Agua",
        efecto: "Daño puro"
    },
    "Hidroariete": {
        descripcion: "Obtiene un escudo equivalente al 450%/450%/900% de su Ataque e inflige un 210%/210%/630% de daño de Ataque a los oponentes circundantes.",
        alcance: "1 casilla",
        tipo: "Agua",
        efecto: "Reducción de Defensa"
    },

    // ===== LAPRAS =====
    "Hidropulso": {
        descripcion: "Lanza 3 olas de agua; cada una inflige un 100%/100%/300% de daño de Ataque esp. a los enemigos cercanos y cura a sí mismo y a los aliados un 360%/360%/1080% del Ataque esp.",
        alcance: "1 casilla",
        tipo: "Agua",
        efecto: "Daño puro"
    },
    "Canto Mortal": {
        descripcion: "Aumenta la Defensa y Def. Esp. en 2200. Canta 3 veces, infligiendo en cada ocasión un 60%/60%/180% de daño de Ataque esp. Los enemigos alcanzados no pueden usar movimientos durante 4 segundos.",
        alcance: "1 casilla",
        tipo: "Agua",
        efecto: "Reducción de Defensa"
    },

    // ===== SOBBLE / DRIZZILE / INTELEON =====
    "Pistola Agua": {
        descripcion: "Dispara un proyectil de agua al oponente más lejano que puede golpear a otros Pokémon rivales en su trayecto, infligiendo un 530%/530%/1590% de daño de Ataque esp. a repartir entre todos los oponentes afectados.",
        alcance: "8 casillas",
        tipo: "Agua",
        efecto: "Reducción de Velocidad"
    },
    "Hidroariete": {
        descripcion: "Lanza 8 proyectiles de agua al oponente con los HP actuales más altos, infligiendo un 40%/40%/120% de daño de Ataque esp. más un 2.5% adicional de los HP máximos del rival como daño.",
        alcance: "5 casillas",
        tipo: "Agua",
        efecto: "Reducción de Velocidad"
    },

    // ===== ZAPDOS =====
    "Bola Voltio": {
        descripcion: "Lanza una bola hacia adelante que inflige un 120%/120%/360% de daño de Ataque esp. La bola explota al llegar a su destino o al impactar a un oponente, infligiendo múltiples golpes a los rivales circundantes para un total de 360%/360%/1080% de daño de Ataque esp.",
        alcance: "4 casillas",
        tipo: "Eléctrico",
        efecto: "Reducción de Velocidad"
    },
    "Rayo Carga": {
        descripcion: "Barre un área de 120° al frente, infligiendo un 220%/220%/660% de daño de Ataque esp. a los Pokémon rivales y reduciendo su Def. Esp. un 20% al impactar, acumulándose hasta 4 veces.",
        alcance: "3 casillas",
        tipo: "Eléctrico",
        efecto: "Reducción de Velocidad"
    },

    // ============================================================
    // COSTE 4
    // ============================================================

    // ===== DRAGONITE =====
    "Danza Dragón": {
        descripcion: "Se reposiciona hacia un lado, aumentando su Velocidad de Ataque un 40%/40%/200%, y los ataques básicos se convierten en ataques básicos potenciados, infligiendo un 5%/5%/50% adicional de los HP máximos del oponente como daño durante 5 segundos.",
        alcance: "3 casillas",
        tipo: "Dragón",
        efecto: "Crítico"
    },
    "Enfado": {
        descripcion: "El alcance de ataque pasa a ser 1 y la Velocidad de Ataque aumenta un 40%/40%/300% durante 8 segundos. Los ataques básicos infligen un 180%/180%/2500% de daño de Ataque en área.",
        alcance: "3 casillas",
        tipo: "Dragón",
        efecto: "Crítico"
    },

    // ===== GYARADOS =====
    "Bote": {
        descripcion: "Tras una breve carga, salta hacia un oponente al azar, infligiendo un 380%/380%/3800% de daño de Ataque en área y lanzando al rival por los aires.",
        alcance: "3 casillas",
        tipo: "Volador",
        efecto: "Crítico"
    },
    "Acua Cola": {
        descripcion: "Realiza tres golpes de Acua Cola, infligiendo un 160%/160%/1600% de daño de Ataque a los oponentes en su camino y restaurando con cada golpe HP equivalentes al 180% de su Ataque.",
        alcance: "3 casillas",
        tipo: "Agua",
        efecto: "Crítico"
    },

    // ===== HOOPA =====
    "Truco": {
        descripcion: "Un Anillo Interdimensional sigue a un Pokémon aliado al azar, otorgándole un escudo equivalente al 650%/650%/6500% de su Ataque esp. y aumentando su barra de movimientos en 4/4/40 puntos por segundo durante 5 segundos; cuando Hoopa realiza un ataque básico, replica un ataque básico desde el Anillo Interdimensional.",
        alcance: "3 casillas",
        tipo: "Psíquico",
        efecto: "Crítico"
    },
    "Bola Sombra": {
        descripcion: "Lanza una Bola Sombra a un oponente, infligiendo un 100%/100%/1000% de daño de Ataque esp., reduciendo su recuperación de HP un 100% y provocando que reciba un 20%/20%/200% de daño adicional durante 4 segundos.",
        alcance: "3 casillas",
        tipo: "Fantasma",
        efecto: "Crítico"
    },

    // ===== SNORLAX =====
    "Descanso": {
        descripcion: "Se duerme y restaura HP equivalentes al 190%/190%/1900% de su Ataque. Aumenta la Defensa y Def. Esp. en 2200/2200/9999 mientras duerme.",
        alcance: "1 casilla",
        tipo: "Psíquico",
        efecto: "Crítico"
    },
    "Bostezo": {
        descripcion: "Lanza somnolencia a varios Pokémon rivales cercanos, causando una inmovilización de 3.5 segundos al impactar.",
        alcance: "2 casillas",
        tipo: "Normal",
        efecto: "Crítico"
    },

    // ===== SYLVEON =====
    "Llama Embrujada": {
        descripcion: "Genera 4 bolas de fuego que se disparan de forma secuencial a los oponentes, infligiendo un 45%/45%/450% de daño de Ataque esp. más un 3%/3%/30% adicional de los HP del rival como daño de Ataque esp. Usar el movimiento de nuevo añade 2 bolas de fuego más, hasta un máximo de 8.",
        alcance: "3 casillas",
        tipo: "Fuego",
        efecto: "Crítico"
    },
    "Vozarrón": {
        descripcion: "Ruge continuamente en cono, infligiendo un 25%/25%/250% de daño de Ataque esp. Al usarse de nuevo, se extiende la duración del movimiento 0.5 segundos adicionales, desde un inicio de 1.5 segundos hasta un máximo de 2.5 segundos.",
        alcance: "3 casillas",
        tipo: "Normal",
        efecto: "Crítico"
    },

    // ===== TYRANITAR =====
    "Roca Afilada": {
        descripcion: "Inflige un 150%/150%/1500% de daño de Ataque en el área frontal y lanza por los aires a los oponentes que estén cerca. El área de impacto del ataque alterna entre 3 alcances distintos.",
        alcance: "1 casilla",
        tipo: "Roca",
        efecto: "Crítico"
    },
    "Tormenta de Arena": {
        descripcion: "Una tormenta de arena rodea a Tyranitar, infligiendo continuamente un 65%/65%/650% de daño de Ataque a los oponentes circundantes, mientras obtiene un 50% de Robo de Vida durante 3 segundos.",
        alcance: "1 casilla",
        tipo: "Roca",
        efecto: "Crítico"
    },

    // ============================================================
    // COSTE 5
    // ============================================================

    // ===== HO-OH =====
    "Llama Reavivadora": {
        descripcion: "Regresa a 1/1/5 Pokémon aliados al campo de batalla. Si no hay ningún Pokémon aliado eliminado, restaura un 45%/45%/100% de HP al aliado con menos HP.",
        alcance: "8 casillas",
        tipo: "Normal",
        efecto: "Crítico"
    },
    "Giro Fuego Ho-Oh": {
        descripcion: "Genera un Giro Fuego centrado en sí mismo, obteniendo un gran escudo, infligiendo daño continuo a los oponentes circundantes y compartiendo simultáneamente el 70% del daño recibido por todos los Pokémon aliados. Inflige un total de 225%/225%/2250% de daño de Ataque a los rivales dentro del vórtice.",
        alcance: "1 casilla",
        tipo: "Fuego",
        efecto: "Crítico"
    },

    // ===== MEWTWO =====
    "Teletransporte": {
        descripcion: "Se teletransporta hacia el oponente más lejano y luego megaevoluciona a Mega-Mewtwo X. El Ataque aumenta un 30%/30%/300%, la Velocidad de Ataque aumenta un 100%/100%/200%, y la Defensa y Def. Esp. aumentan en 400/400/4000 hasta el final de la ronda; además, los ataques son impactos críticos garantizados durante 5 segundos.",
        alcance: "8 casillas",
        tipo: "Psíquico",
        efecto: "Confusión"
    },

    "Psicoonda": {
        descripcion: "Lanza una onda psíquica a un oponente al azar, infligiendo un 250%/250%/2500% de daño de Ataque, reduciendo el daño del rival un 20% hasta el final de la ronda y obteniendo un 60% de reducción de daño durante este tiempo. Luego megaevoluciona a Mega-Mewtwo X; el Ataque aumenta un 30%/30%/300%, la Velocidad de Ataque aumenta un 100%/100%/200%, y la Defensa y Def. Esp. aumentan en 400/400/4000 hasta el final de la ronda.",
        alcance: "8 casillas",
        tipo: "Psíquico",
        efecto: "Confusión"
    },

    // ===== MIRAIDON =====
    "Cometa Draco": {
        descripcion: "Lanza continuamente 5 meteoros, infligiendo un 170%/170%/1700% de daño de Ataque esp. en área a oponentes al azar e inmovilizándolos.",
        alcance: "8 casillas",
        tipo: "Dragón",
        efecto: "Reducción de Defensa Especial"
    },
    "Rayo Carga": {
        descripcion: "Usa continuamente Rayo Carga en línea recta hacia adelante, infligiendo un 35%/35%/350% de daño de Ataque esp. hasta que el objetivo actual sea eliminado, momento en el que el movimiento se detiene.",
        alcance: "4 casillas",
        tipo: "Eléctrico",
        efecto: "Parálisis"
    },

    // ============================================================
    // ESPECIALES
    // ============================================================

    // ===== ZACIAN =====
    "Garra Metal": {
        descripcion: "Inflige un 365% de daño en línea recta.",
        alcance: "2 casillas",
        tipo: "Acero",
        efecto: "Daño aumentado contra escudos"
    },

    "Tajo Supremo": {
        descripcion: "Inflige un 550% de daño a todos los oponentes.",
        alcance: "2 casillas",
        tipo: "Acero",
        efecto: "Daño aumentado contra escudos"
    },

    // ===== ARTICUNO =====
    // Ventisca (ya existe)
    // Tajo Aéreo (ya existe)
};

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.movimientosInfo = movimientosInfo;

console.log("✅ movimientosInfo.js cargado -", Object.keys(movimientosInfo).length, "movimientos disponibles");