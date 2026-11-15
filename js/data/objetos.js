// ============================================================
// DATOS DE OBJETOS - TODOS LOS OBJETOS DEL JUEGO
// ============================================================

// ===== OBJETOS =====
const OBJETOS = {
    "Moneda Amuleto": {
        emoji: "assets/icons/objetos/moneda-amuleto.png",
        descripcion: "Daño +20%. +30% Daño. Gana 1 moneda extra al ganar.",
        efecto: {
            damagePercent: 0.20,
            damagePercentExtra: 0.30,
            monedaExtra: 1
        },
        unico: true,
        puedeApilar: false
    },
    "Chaleco Asalto": {
        emoji: "assets/icons/objetos/chaleco-asalto.png",
        descripcion: "HP +800. Escudo = 32% HP Máx cada 5s por 3s.",
        efecto: {
            hpBonus: 800,
            escudoPorcentaje: 0.32,
            escudoIntervalo: 5,
            escudoDuracion: 3
        },
        unico: true,
        puedeApilar: false
    },
    "Barrera Auxiliar": {
        emoji: "assets/icons/objetos/barrera-auxiliar.png",
        descripcion: "HP +300, Def +100, Def Esp +100. Escudo = 18% HP al aliado.",
        efecto: {
            hpBonus: 300,
            defense: 100,
            spDefense: 100,
            escudoAllyPorcentaje: 0.18
        },
        unico: true,
        puedeApilar: false
    },
    "Colgante Carga": {
        emoji: "assets/icons/objetos/colgante-carga.png",
        descripcion: "Después de 12 daños: daño +80%.",
        efecto: {
            cargaGolpes: 12,
            cargaDaño: 0.80
        },
        unico: true,
        puedeApilar: false
    },
    "Pañuelo Elección": {
        emoji: "assets/icons/objetos/panuelo-eleccion.png",
        descripcion: "+8 energía por segundo.",
        efecto: {
            extraMoveGauge: 8
        },
        unico: true,
        puedeApilar: false
    },
    "Gafas Elección": {
        emoji: "assets/icons/objetos/gafas-eleccion.png",
        descripcion: "Daño de movimiento +60%.",
        efecto: {
            moveDamagePercent: 0.60
        },
        unico: true,
        puedeApilar: false
    },
    "Capa Furtiva": {
        emoji: "assets/icons/objetos/capa-furtiva.png",
        descripcion: "Vel Ataque +30%, Atk +10%, Atq Esp +10%. Inmune.",
        efecto: {
            attackSpeedPercent: 0.30,
            attackPercent: 0.10,
            spAttackPercent: 0.10,
            inmuneImpedimentos: true
        },
        unico: true,
        puedeApilar: false
    },
    "Brazalete Condena": {
        emoji: "assets/icons/objetos/brazalete-condena.png",
        descripcion: "Vel Ataque +30%. Maldice al enemigo (1% HP/s).",
        efecto: {
            attackSpeedPercent: 0.30,
            maldicionDaño: 0.01,
            maldicionCuracion: 0.30
        },
        unico: true,
        puedeApilar: false
    },
    "Incienso Condena": {
        emoji: "assets/icons/objetos/incienso-condena.png",
        descripcion: "HP +200, Def +150, Def Esp +150. Maldición en área.",
        efecto: {
            hpBonus: 200,
            defense: 150,
            spDefense: 150,
            maldicionRadio: 1,
            maldicionDaño: 0.01,
            maldicionCuracion: 0.30
        },
        unico: true,
        puedeApilar: false
    },
    "Corona Drenaje": {
        emoji: "assets/icons/objetos/corona-drenaje.png",
        descripcion: "Def +100, Def Esp +100, RoboVida +25%, Atk +10%, Atq Esp +10%.",
        efecto: {
            defense: 100,
            spDefense: 100,
            lifesteal: 0.25,
            attackPercent: 0.10,
            spAttackPercent: 0.10
        },
        unico: false,
        puedeApilar: false
    },
    "Cinta Focus": {
        emoji: "assets/icons/objetos/cinta-focus.png",
        descripcion: "Regen HP +45%, Daño +40%. +30% reducción al <20% HP.",
        efecto: {
            regenPercent: 0.45,
            damagePercent: 0.40,
            reduccionDañoPorHP: true,
            reduccionMaxima: 0.30
        },
        unico: true,
        puedeApilar: false
    },
    "Roca del Rey": {
        emoji: "assets/icons/objetos/roca-rey.png",
        descripcion: "Atk +10%, Vel Ataque +20%. Reduce Defensa 45% por 3s.",
        efecto: {
            attackPercent: 0.10,
            attackSpeedPercent: 0.20,
            reduceDefense: 0.45,
            duracionReduccion: 3
        },
        unico: true,
        puedeApilar: false
    },
    "Restos": {
        emoji: "assets/icons/objetos/restos.png",
        descripcion: "HP +580. Restaura 5% HP cada 3s.",
        efecto: {
            hpBonus: 580,
            regenPorSegundo: 0.05,
            regenIntervalo: 3
        },
        unico: true,
        puedeApilar: false
    },
    "Huevo Suerte": {
        emoji: "assets/icons/objetos/huevo-suerte.png",
        descripcion: "Reducción daño +20%/+30%. Gana 2 EXP extra al perder.",
        efecto: {
            damageReduction: 0.20,
            damageReductionExtra: 0.30,
            expExtraDerrota: 2
        },
        unico: true,
        puedeApilar: false
    },
    "Metrónomo": {
        emoji: "assets/icons/objetos/metronomo.png",
        descripcion: "Los aliados ganan +4% daño de movimiento por cada ataque básico (máx 20 stacks).",
        efecto: {
            metronomoGlobal: true,
            metronomoPorAtaque: 0.04,
            metronomoMaximo: 20
        },
        unico: true,
        puedeApilar: false
    },
    "Cinta Fuerte": {
        emoji: "assets/icons/objetos/cinta-fuerte.png",
        descripcion: "Vel Ataque +30%. Ataques básicos hacen 2% HP Máx extra.",
        efecto: {
            attackSpeedPercent: 0.30,
            dañoPorcentajeMaxHP: 0.02,
            dañoMaxHPIntervalo: 0.3
        },
        unico: true,
        puedeApilar: false
    },
    "Garra Rápida": {
        emoji: "assets/icons/objetos/garra-rapida.png",
        descripcion: "Daño movimiento +120%. Movimiento al inicio del combate.",
        efecto: {
            moveDamagePercent: 1.20,
            movimientoInicial: true
        },
        unico: true,
        puedeApilar: false
    },
    "Máscara de Ira": {
        emoji: "assets/icons/objetos/mascara-ira.png",
        descripcion: "Cuando aliado cae: +10% daño y +20% Vel Ataque.",
        efecto: {
            iraDaño: 0.10,
            iraVelocidad: 0.20
        },
        unico: true,
        puedeApilar: false
    },
    "Pañuelo Combo": {
        emoji: "assets/icons/objetos/panuelo-combo.png",
        descripcion: "3 ataques: +50% Vel Ataque 6s. +35% Vel contra escudos.",
        efecto: {
            comboAtaques: 3,
            comboVelocidad: 0.50,
            comboDuracion: 6,
            velocidadVsEscudo: 0.35
        },
        unico: true,
        puedeApilar: false
    },
    "Capucha Rescate": {
        emoji: "assets/icons/objetos/capucha-rescate.png",
        descripcion: "Def +150, Def Esp +150. +4 energía/s. Curaciones +30%.",
        efecto: {
            defense: 150,
            spDefense: 150,
            extraMoveGauge: 4,
            curacionEscudoBonus: 0.30
        },
        unico: true,
        puedeApilar: false
    },
    "Casco Dentado": {
        emoji: "assets/icons/objetos/casco-dentado.png",
        descripcion: "HP +300, Def +300. Daño = 2% HP Máx al recibir daño.",
        efecto: {
            hpBonus: 300,
            defense: 300,
            dañoReflejo: 0.02,
            reflejoIntervalo: 1
        },
        unico: true,
        puedeApilar: false
    },
    "Cuchara Peculiar": {
        emoji: "assets/icons/objetos/cuchara-peculiar.png",
        descripcion: "Atq Esp +10%, Vel Ataque +20%. Reduce Def Esp 45% por 3s.",
        efecto: {
            spAttackPercent: 0.10,
            attackSpeedPercent: 0.20,
            reduceSpDefense: 0.45,
            duracionReduccion: 3
        },
        unico: true,
        puedeApilar: false
    },
    "Bola de Humo": {
        emoji: "assets/icons/objetos/bola-humo.png",
        descripcion: "Vel Ataque +20%, Daño +10%. Invulnerable 2.5s al <50% HP.",
        efecto: {
            attackSpeedPercent: 0.20,
            damagePercent: 0.10,
            invulnerablePorcentaje: 0.50,
            invulnerableDuracion: 2.5
        },
        unico: true,
        puedeApilar: false
    },
    "Seguro Debilidad": {
        emoji: "assets/icons/objetos/seguro-debilidad.png",
        descripcion: "+5% daño y +5% reducción al recibir daño (x5, 4s).",
        efecto: {
            debilidadStack: 0.05,
            debilidadMaxStacks: 5,
            debilidadDuracion: 4
        },
        unico: true,
        puedeApilar: false
    },
    "Gafas Especiales": {
        emoji: "assets/icons/objetos/gafas-especiales.png",
        descripcion: "Ataque Especial +40%.",
        efecto: {
            spAttackPercent: 0.40
        },
        unico: false,
        puedeApilar: false
    },
    // ===== CHIPS =====
    "Chip Siniestro": {
        emoji: "assets/icons/objetos/chip-siniestro.png",
        descripcion: "Bonus tipo Siniestro +1. Solo Siniestro.",
        efecto: {
            tipoBonus: "Siniestro",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Siniestro"
    },
    "Chip Eevee": {
        emoji: "assets/icons/objetos/chip-eevee.png",
        descripcion: "Bonus tipo Eevee +1. Solo Eevee.",
        efecto: {
            tipoBonus: "Eevee",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Eevee"
    },
    "Chip Hada": {
        emoji: "assets/icons/objetos/chip-hada.png",
        descripcion: "Bonus tipo Hada +1. Solo Hada.",
        efecto: {
            tipoBonus: "Hada",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Hada"
    },
    "Chip Lucha": {
        emoji: "assets/icons/objetos/chip-lucha.png",
        descripcion: "Bonus tipo Lucha +1. Solo Lucha.",
        efecto: {
            tipoBonus: "Lucha",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Lucha"
    },
    "Chip Fuego": {
        emoji: "assets/icons/objetos/chip-fuego.png",
        descripcion: "Bonus tipo Fuego +1. Solo Fuego.",
        efecto: {
            tipoBonus: "Fuego",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Fuego"
    },
    "Chip Planta": {
        emoji: "assets/icons/objetos/chip-planta.png",
        descripcion: "Bonus tipo Planta +1. Solo Planta.",
        efecto: {
            tipoBonus: "Planta",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Planta"
    },
    "Chip Hielo": {
        emoji: "assets/icons/objetos/chip-hielo.png",
        descripcion: "Bonus tipo Hielo +1. Solo Hielo.",
        efecto: {
            tipoBonus: "Hielo",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Hielo"
    },
    "Chip Veneno": {
        emoji: "assets/icons/objetos/chip-veneno.png",
        descripcion: "Bonus tipo Veneno +1. Solo Veneno.",
        efecto: {
            tipoBonus: "Veneno",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Veneno"
    },
    "Chip Psíquico": {
        emoji: "assets/icons/objetos/chip-psiquico.png",
        descripcion: "Bonus tipo Psíquico +1. Solo Psíquico.",
        efecto: {
            tipoBonus: "Psíquico",
            bonusExtra: 1
        },
        unico: true,
        puedeApilar: false,
        requerido: "Psíquico"
    },
    
    // ============================================================
    // 🎯 FASE 4: DISCO DEFINITIVO (desbloquea ulti)
    // ============================================================
    "Disco Definitivo": {
        emoji: "assets/icons/objetos/disco-definitivo.png",
        descripcion: "Permite usar la ULTIMATE. Solo equipable en Pokémon 2★ o 3★. No se gasta.",
        efecto: {
            esDiscoUlti: true
        },
        unico: true,
        puedeApilar: false,
        // 🎯 No se puede tener más de 1 Disco por Pokémon
        maxPorUnidad: 1
    }
};

// ===== EXPONER OBJETOS GLOBALMENTE =====
window.OBJETOS = OBJETOS;
