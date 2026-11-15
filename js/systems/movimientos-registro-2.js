// ============================================================
// MOVIMIENTOS - REGISTRO PARTE 2
// ============================================================

Object.assign(MOVIMIENTOS_REGISTRO, {
        "hoja-afilada": {
        nombre: "Hoja Afilada",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Hoja Afilada",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Hoja Afilada@leafeon', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GREEN, icono: 'mov:Hoja Afilada@leafeon', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🍃 ${atacante.pokemon.nombre} usa HOJA AFILADA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const escudo = Math.floor((atacante.ataque || 0) * 3.50);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: 'mov:Hoja Afilada', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 }); }, 150);
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hoja Afilada', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(74, 222, 128, 0.95)', 450);
            const NUM_HOJAS = 5;
            const DAÑO_HOJA = 0.30;
            let dañoTotalIda = 0;
            for (let i = 0; i < NUM_HOJAS; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    const dañoHoja = Math.max(1, Math.floor((atacante.ataque || 0) * DAÑO_HOJA));
                    dañoTotalIda += dañoHoja;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GREEN, icono: 'mov:Hoja Afilada', intensidad: 'soft', sizeIcono: 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoHoja, false);
                }, i * 100);
            }
            const tiempoVuelta = NUM_HOJAS * 100 + 300;
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(objetivoPrincipal, atacante, 'rgba(134, 239, 172, 0.95)', 400);
                for (let i = 0; i < NUM_HOJAS; i++) {
                    setTimeout(() => {
                        if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                        const dañoHojaVuelta = Math.max(1, Math.floor((atacante.ataque || 0) * DAÑO_HOJA));
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GREEN, icono: 'mov:Hoja Afilada', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        movAplicarDaño(atacante, objetivoPrincipal, dañoHojaVuelta, false);
                    }, i * 100);
                }
            }, tiempoVuelta);
            return true;
        }
    },

    "velocidad-extrema": {
        nombre: "Velocidad Extrema",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 99,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Velocidad Extrema",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Velocidad Extrema', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Velocidad Extrema', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💨 ${atacante.pokemon.nombre} usa VELOCIDAD EXTREMA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Velocidad Extrema', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.WHITE, icono: 'mov:Velocidad Extrema', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            enemigosVivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(255, 255, 255, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.WHITE, icono: 'mov:Velocidad Extrema', intensidad: 'strong', sizeIcono: 'large', duracionMs: 600 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        const defOriginal = enemigo.bonusDefense || 0;
                        const defBase = enemigo.pokemon.defense || 0;
                        const reduccion = Math.floor(defBase * 0.20);
                        enemigo.bonusDefense = defOriginal - reduccion;
                        enemigo.actualizarStats();
                        setTimeout(() => { if (enemigo.hp <= 0 || enemigo.muerto) return; enemigo.bonusDefense = defOriginal; enemigo.actualizarStats(); }, 3000);
                    }
                }, idx * 150);
            });
            const tiempoTotal = enemigosVivos.length * 150 + 200;
            setTimeout(() => {
                if (atacante.hp > 0 && !atacante.muerto) {
                    const curacion = Math.floor((atacante.ataque || 0) * 0.40);
                    if (curacion > 0) {
                        if (typeof movCurar === 'function') movCurar(atacante, curacion);
                        else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 });
                    }
                }
            }, tiempoTotal);
            return true;
        }
    },

    "cambiafuerza": {
        nombre: "Cambiafuerza",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Cambiafuerza",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Cambiafuerza', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Cambiafuerza', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa CAMBIAFUERZA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoPorGolpe = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.12));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Cambiafuerza', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 500);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Cambiafuerza', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            const NUM_GOLPES = 6;
            const REDUCCION_ENERGIA = 2;
            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Cambiafuerza', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoPorGolpe, false);
                    if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                        const energiaAntes = objetivoPrincipal.energy || 0;
                        objetivoPrincipal.energy = Math.max(0, energiaAntes - REDUCCION_ENERGIA);
                    }
                }, i * 200);
            }
            const tiempoTotal = NUM_GOLPES * 200 + 200;
            setTimeout(() => {
                if (atacante.hp > 0 && !atacante.muerto) {
                    const curacion = Math.floor((atacante.ataqueEspecial || 0) * 1.00);
                    if (curacion > 0) {
                        if (typeof movCurar === 'function') movCurar(atacante, curacion);
                        else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 });
                    }
                }
            }, tiempoTotal);
            return true;
        }
    },

    "sombra-vil": {
        nombre: "Sombra Vil",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Sombra Vil",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Sombra Vil', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Sombra Vil', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`👻 ${atacante.pokemon.nombre} usa SOMBRA VIL!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Sombra Vil', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(147, 51, 234, 0.95)', 500);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Sombra Vil', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);

                        if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                const defOriginal = objetivoPrincipal.bonusDefense || 0;
                const spDefOriginal = objetivoPrincipal.bonusSpDefense || 0;
                const defBase = objetivoPrincipal.pokemon.defense || 0;
                const spDefBase = objetivoPrincipal.pokemon.spDefense || objetivoPrincipal.pokemon.defense || 0;
                const reduccionDef = Math.floor(defBase * 0.20);
                const reduccionSpDef = Math.floor(spDefBase * 0.20);
                objetivoPrincipal.bonusDefense = defOriginal - reduccionDef;
                objetivoPrincipal.bonusSpDefense = spDefOriginal - reduccionSpDef;
                objetivoPrincipal.actualizarStats();

                objetivoPrincipal._sombraVilActiva = true;
                objetivoPrincipal._sombraVilFin = performance.now() + 8000;
                objetivoPrincipal._sombraVilDefOriginal = defOriginal;
                objetivoPrincipal._sombraVilSpDefOriginal = spDefOriginal;

                                // 🆕 FIX: activar los flags de debuff de defensas para que
                // renderEscudoRoto (render.js) pinte el escudo roto.
                const duracionSombraVil = 8;
                objetivoPrincipal._debuffDefensasFin = performance.now() + (duracionSombraVil * 1000);
                objetivoPrincipal._debuffDefensasPct = 0.20;
                objetivoPrincipal._debuffDefensasOriginal = {
                    def: objetivoPrincipal.defensa || 0,
                    spDef: objetivoPrincipal.defensaEspecial || 0
                };

                objetivoPrincipal._debuffDefFisica = true;
                objetivoPrincipal._debuffDefFisicaFin = performance.now() + (duracionSombraVil * 1000);
                objetivoPrincipal._debuffDefFisicaOriginal = objetivoPrincipal.defensa || 0;

                objetivoPrincipal._debuffDefEsp = true;
                objetivoPrincipal._debuffDefEspFin = performance.now() + (duracionSombraVil * 1000);
                objetivoPrincipal._debuffDefEspOriginal = objetivoPrincipal.defensaEspecial || 0;

                // 🆕 FIX: repintar el combate AHORA para que renderEscudoRoto()
                // pinte el icono al lado de la barra de vida inmediatamente.
                if (typeof renderizarCombate === 'function') {
                    renderizarCombate();
                }

                if (objetivoPrincipal._sombraVilIntervalId) {
                    clearInterval(objetivoPrincipal._sombraVilIntervalId);
                    objetivoPrincipal._sombraVilIntervalId = null;
                }

                const intervalo = setInterval(() => {
                    if (!objetivoPrincipal || objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) {
                        clearInterval(intervalo);
                        objetivoPrincipal._sombraVilIntervalId = null;
                        return;
                    }
                    if (performance.now() >= objetivoPrincipal._sombraVilFin) {
                        clearInterval(intervalo);
                        objetivoPrincipal._sombraVilIntervalId = null;
                        return;
                    }

                    if (typeof obtenerPosicionUnidadActual !== 'function') return;
                    const pos = obtenerPosicionUnidadActual(objetivoPrincipal);
                    if (!pos || !pos.elemento) return;

                    const yaTiene = pos.elemento.querySelector('.mov-effect-icon.icon-shadow');
                    if (!yaTiene && typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoPrincipal, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Sombra Vil',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 600,
                            persistente: true,
                            pulso: true,
                            claseExtra: 'icon-shadow'
                        });
                    }
                }, 400);

                objetivoPrincipal._sombraVilIntervalId = intervalo;

                                                setTimeout(() => {
                    if (!objetivoPrincipal) return;
                    objetivoPrincipal.bonusDefense = objetivoPrincipal._sombraVilDefOriginal;
                    objetivoPrincipal.bonusSpDefense = objetivoPrincipal._sombraVilSpDefOriginal;
                    objetivoPrincipal.actualizarStats();
                    objetivoPrincipal._sombraVilActiva = false;
                    objetivoPrincipal._sombraVilFin = 0;
                    objetivoPrincipal._sombraVilDefOriginal = null;
                    objetivoPrincipal._sombraVilSpDefOriginal = null;
                    if (objetivoPrincipal._sombraVilIntervalId) {
                        clearInterval(objetivoPrincipal._sombraVilIntervalId);
                        objetivoPrincipal._sombraVilIntervalId = null;
                    }

                    // 🆕 FIX: limpiar los flags de debuff de defensas para
                    // que renderEscudoRoto deje de pintar el escudo roto.
                    objetivoPrincipal._debuffDefensasFin = 0;
                    objetivoPrincipal._debuffDefensasPct = 0;
                    objetivoPrincipal._debuffDefensasOriginal = null;
                    objetivoPrincipal._debuffDefFisica = false;
                    objetivoPrincipal._debuffDefFisicaFin = 0;
                    objetivoPrincipal._debuffDefFisicaOriginal = null;
                    objetivoPrincipal._debuffDefEsp = false;
                    objetivoPrincipal._debuffDefEspFin = 0;
                    objetivoPrincipal._debuffDefEspOriginal = null;

                    // Repintar para que el icono desaparezca
                    if (typeof renderizarCombate === 'function') {
                        renderizarCombate();
                    }
                }, 8000);
            }
            return true;
        }
    },

    "ascuas": {
        nombre: "Ascuas",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Ascuas",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Ascuas', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Ascuas', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa ASCUAS!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Ascuas', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(251, 146, 60, 0.95)', 300);
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Ascuas', intensidad: 'strong', sizeIcono: 'large', duracionMs: 600 });
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            return true;
        }
    },

    "hidrobomba": {
        nombre: "Hidrobomba",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO_EN_LINEA,
        sonido: "Hidrobomba",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Hidrobomba', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Hidrobomba', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💧 ${atacante.pokemon.nombre} usa HIDROBOMBA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            let objetivoPrincipal = null;
            const casillaDelante = movCasillasEnLinea(origen, 'arriba', 1);
            if (casillaDelante.length > 0) {
                const uDelante = movUnidadEnPosicion(casillaDelante[0], enemigosVivos);
                if (uDelante) objetivoPrincipal = uDelante;
            }
            if (!objetivoPrincipal) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
                if (candidatos.length === 0) return false;
                candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                objetivoPrincipal = candidatos[0];
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.68));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hidrobomba', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(59, 130, 246, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.BLUE, icono: 'mov:Hidrobomba', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                if (!objetivoPrincipal.inmuneImpedimentos) {
                    movAplicarSlow(objetivoPrincipal, 1.00, 1.5, '(Inmovilizado por Hidrobomba)');
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.BLUE, icono: 'mov:Hidrobomba', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500, persistente: true, pulso: true, claseExtra: 'icon-water' }); }, 400);
                }
            }
            return true;
        }
    },

    "martillo-hielo": {
        nombre: "Martillo Hielo",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Martillo Hielo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Martillo Hielo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Martillo Hielo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔨 ${atacante.pokemon.nombre} usa MARTILLO HIELO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const origenObjetivo = movObtenerPosicionGlobal(objetivoPrincipal);
            const enemigosEnArea = [objetivoPrincipal];
            if (origenObjetivo) {
                const casillasArea = movCasillasEnArea(origenObjetivo, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Martillo Hielo', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 450);
            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Martillo Hielo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (!enemigo.inmuneImpedimentos) {
                            movAplicarSlow(enemigo, 0.20, 3, '(Martillo Hielo)');
                            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Martillo Hielo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-frost' }); }, 300);
                        }
                    }
                }, idx * 100);
            });
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Martillo Hielo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 900 }); }, 100);
            return true;
        }
    },

    "alarido": {
        nombre: "Alarido",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Alarido",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Alarido', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Alarido', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌙 ${atacante.pokemon.nombre} usa ALARIDO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;

            const escudo = Math.floor((atacante.ataque || 0) * 9.00);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
                setTimeout(() => {
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(atacante, {
                            color: MOV_COLOR.GRAY,
                            icono: 'mov:Alarido',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 1000
                        });
                    }
                }, 150);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Alarido', 0.4);
            const enemigosEnArea = [];
            const casillasArea = movCasillasEnArea(origen, 1);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
            }
            if (enemigosEnArea.length === 0) return true;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 0.138));
            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(107, 114, 128, 0.95)', 400);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Alarido', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Alarido', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-fear' }); }, 300);
                    }
                }, idx * 100);
            });
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Alarido', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1200, persistente: true, pulso: true, claseExtra: 'icon-fear' }); }, 400);
            return true;
        }
    },

    "ventisca": {
        nombre: "Ventisca",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Ventisca",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Ventisca', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Ventisca', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa VENTISCA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal1 = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.00));
            const dañoFinal2 = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.40));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Ventisca', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 500);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Ventisca', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal1, false);
                if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                    const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
                    if (origenObj) {
                        const origenAtk = movObtenerPosicionGlobal(atacante);
                        if (origenAtk) {
                            const dFila = Math.sign(origenObj.fila - origenAtk.fila);
                            const dCol = Math.sign(origenObj.col - origenAtk.col);
                            let nuevaFila = origenObj.fila;
                            let nuevaCol = origenObj.col;
                            if (Math.abs(origenObj.fila - origenAtk.fila) >= Math.abs(origenObj.col - origenAtk.col)) nuevaFila = origenObj.fila + dFila;
                            else nuevaCol = origenObj.col + dCol;
                            if (nuevaFila >= 0 && nuevaFila < FILAS_ARENA && nuevaCol >= 0 && nuevaCol < COLUMNAS_GLOBALES) {
                                const ocupada = contexto.enemigos.some(e => { if (e === objetivoPrincipal || !e || e.hp <= 0 || e.muerto) return false; const pe = movObtenerPosicionGlobal(e); return pe && pe.fila === nuevaFila && pe.col === nuevaCol; });
                                const ocupadaAliado = (contexto.aliados || []).some(a => { if (!a || a.hp <= 0 || a.muerto) return false; const pa = movObtenerPosicionGlobal(a); return pa && pa.fila === nuevaFila && pa.col === nuevaCol; });
                                if (!ocupada && !ocupadaAliado) {
                                    movSetPosicionGlobal(objetivoPrincipal, nuevaFila, nuevaCol);
                                    objetivoPrincipal._knockbackUntil = performance.now() + 1500;
                                    if (typeof renderizarCombate === 'function') renderizarCombate();
                                    if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(objetivoPrincipal);
                                }
                            }
                        }
                    }
                }
            }, 250);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                const posDestino = movObtenerPosicionGlobal(objetivoPrincipal);
                if (!posDestino) return;
                if (typeof movMarcarCasillaGlobal === 'function') movMarcarCasillaGlobal(posDestino.fila, posDestino.col, { duracionMs: 2400 });
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Ventisca', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200 });
                const enemigosEnTormenta = [objetivoPrincipal];
                const casillasTormenta = movCasillasEnArea(posDestino, 1);
                for (let c of casillasTormenta) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnTormenta.includes(u)) enemigosEnTormenta.push(u);
                }
                enemigosEnTormenta.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Ventisca', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        movAplicarDaño(atacante, enemigo, dañoFinal2, false);
                    }, idx * 100);
                });
            }, 600);
            return true;
        }
    },

    "voltiocambio": {
        nombre: "Voltiocambio",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_LEJANO,
        sonido: "Voltiocambio",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Voltiocambio', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Voltiocambio', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa VOLTIOCAMBIO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaChebyshev(atacante, b) - movDistanciaChebyshev(atacante, a));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.00));
            const enemigosEnCamino = [...enemigosVivos];
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Voltiocambio', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(250, 204, 21, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.YELLOW, icono: 'mov:Voltiocambio', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            let golpesConectados = 0;
            enemigosEnCamino.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(250, 204, 21, 0.85)', 300);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.YELLOW, icono: 'mov:Voltiocambio', intensidad: 'strong', sizeIcono: 'large', duracionMs: 600 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    if (enemigo.damageTaken >= 0) golpesConectados++;
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.YELLOW, icono: 'mov:Voltiocambio', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-spark' }); }, 250);
                    }
                }, idx * 100);
            });
            const tiempoTotal = enemigosEnCamino.length * 100 + 200;
            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) return;
                if (golpesConectados === 0) return;
                const bonusTotal = golpesConectados * 0.10;
                const velOriginal = atacante.bonusAttackSpeed || 1;
                atacante.bonusAttackSpeed = velOriginal * (1 + bonusTotal);
                atacante.actualizarStats();
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.YELLOW, icono: 'mov:Voltiocambio', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-haste' });
                setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusAttackSpeed = velOriginal; atacante.actualizarStats(); }, 5000);
            }, tiempoTotal);
            return true;
        }
    },

    "tajo-umbrio": {
        nombre: "Tajo Umbrío",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Tajo Umbrío",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Tajo Umbrío', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Tajo Umbrío', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌑 ${atacante.pokemon.nombre} usa TAJO UMBRÍO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal1 = Math.max(1, Math.floor((atacante.ataque || 0) * 2.00));
            const dañoFinal2 = Math.max(1, Math.floor((atacante.ataque || 0) * 2.20));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Tajo Umbrío', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(75, 85, 99, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Tajo Umbrío', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GRAY, icono: 'mov:Tajo Umbrío', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal1, false);
            }, 250);
            setTimeout(() => {
                const posAtk = movObtenerPosicionGlobal(atacante);
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                let enemigosEnCamino = [];

                if (posAtk && posObj && atacante.hp > 0 && !atacante.muerto) {
                    const df = Math.sign(posObj.fila - posAtk.fila);
                    const dc = Math.sign(posObj.col - posAtk.col);
                    let nuevaFila = posObj.fila;
                    let nuevaCol = posObj.col;
                    if (Math.abs(posObj.fila - posAtk.fila) >= Math.abs(posObj.col - posAtk.col)) nuevaFila = posObj.fila + df;
                    else nuevaCol = posObj.col + dc;
                    if (nuevaFila >= 0 && nuevaFila < FILAS_ARENA && nuevaCol >= 0 && nuevaCol < COLUMNAS_GLOBALES) {
                        const ocupadaEnemigo = contexto.enemigos.some(e => { if (!e || e === objetivoPrincipal || e.hp <= 0 || e.muerto) return false; const pe = movObtenerPosicionGlobal(e); return pe && pe.fila === nuevaFila && pe.col === nuevaCol; });
                        const ocupadaAliado = (contexto.aliados || []).some(a => { if (!a || a === atacante || a.hp <= 0 || a.muerto) return false; const pa = movObtenerPosicionGlobal(a); return pa && pa.fila === nuevaFila && pa.col === nuevaCol; });
                        if (!ocupadaEnemigo && !ocupadaAliado) {
                            movSetPosicionGlobal(atacante, nuevaFila, nuevaCol);
                            if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(atacante);
                            if (typeof renderizarCombate === 'function') renderizarCombate();
                        }
                    }
                }
                if (posAtk && posObj) {
                    const df = posObj.fila - posAtk.fila;
                    const dc = posObj.col - posAtk.col;
                    let dir;
                    if (Math.abs(df) >= Math.abs(dc)) dir = df < 0 ? 'arriba' : 'abajo';
                    else dir = dc < 0 ? 'izquierda' : 'derecha';
                    const casillasCamino = movCasillasEnLinea(posAtk, dir, 8);
                    for (let c of casillasCamino) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && u !== objetivoPrincipal && !enemigosEnCamino.includes(u)) enemigosEnCamino.push(u);
                    }
                }
                if (enemigosEnCamino.length === 0) return;
                enemigosEnCamino.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(75, 85, 99, 0.85)', 350);
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Tajo Umbrío', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        movAplicarDaño(atacante, enemigo, dañoFinal2, false);
                    }, idx * 120);
                });
            }, 450);
            const tiempoEjecucion = 450 + (enemigosVivos.length * 120) + 300;
            setTimeout(() => {
                let ejecutados = 0;
                for (let enemigo of enemigosVivos) {
                    if (enemigo.hp <= 0 || enemigo.muerto) continue;
                    const porcentajeHP = enemigo.hp / enemigo.maxHp;
                    if (porcentajeHP < 0.15) {
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Tajo Umbrío', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200 });
                        const dañoMortal = enemigo.hp;
                        enemigo.hp = 0;
                        enemigo.muerto = true;
                        enemigo.damageTaken += dañoMortal;
                        atacante.damageDealt += dañoMortal;
                        if (typeof actualizarCopiaEstadisticas === 'function') { actualizarCopiaEstadisticas(atacante, 'damageDealt', dañoMortal); actualizarCopiaEstadisticas(enemigo, 'damageTaken', dañoMortal); }
                        if (typeof obtenerPosicionUnidadActual === 'function') { const pos = obtenerPosicionUnidadActual(enemigo); if (pos && pos.elemento && typeof ocultarUnidadMuerta === 'function') ocultarUnidadMuerta(pos.elemento); }
                        ejecutados++;
                    }
                }
            }, tiempoEjecucion);
            return true;
        }
    },

    "senuelo": {
        nombre: "Señuelo",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Señuelo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Señuelo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Señuelo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`✨ ${atacante.pokemon.nombre} usa SEÑUELO!`);
            const escudo = Math.floor(atacante.maxHp * 0.40);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.WHITE, icono: 'mov:Señuelo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1000 }); }, 100);
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Señuelo', 0.4);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosCercanos = [];
            const origen = movObtenerPosicionGlobal(atacante);
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            if (enemigosCercanos.length === 0) return true;
            const DURACION_TAUNT = 3;
            enemigosCercanos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    enemigo.taunt = { atacante: atacante, duracion: DURACION_TAUNT, timer: 0 };
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(255, 255, 255, 0.95)', 400);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PINK, icono: 'mov:Señuelo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                    setTimeout(() => { if (enemigo.hp > 0 && !enemigo.muerto && typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PINK, icono: 'mov:Señuelo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-taunt' }); }, 300);
                }, idx * 100);
            });
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PINK, icono: 'mov:Señuelo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-taunt' }); }, 400);
            return true;
        }
    },

    "psicocarga": {
        nombre: "Psicocarga",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Psicocarga",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Psicocarga', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Psicocarga', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PSICOCARGA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Psicocarga', 0.4);
            const NUM_ORBES = 5;
            for (let i = 0; i < NUM_ORBES; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicocarga', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
                }, i * 120);
            }
            return true;
        }
    },

    "viento-hielo": {
        nombre: "Viento Hielo",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Viento Hielo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Viento Hielo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Viento Hielo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa VIENTO HIELO!`);
            if (typeof atacante.esquirlasHielo !== 'number') atacante.esquirlasHielo = 0;
            const esquirlasAntes = atacante.esquirlasHielo;
            atacante.esquirlasHielo = Math.min(atacante.esquirlasHielo + 2, 8);
            const esquirlasAhora = atacante.esquirlasHielo;
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Viento Hielo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.35));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Viento Hielo', 0.4);
            const NUM_ESQUIRLAS = esquirlasAhora;
            for (let i = 0; i < NUM_ESQUIRLAS; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Viento Hielo', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
                }, i * 100);
            }
            setTimeout(() => { atacante.esquirlasHielo = 0; }, NUM_ESQUIRLAS * 100 + 200);
            return true;
        }
    },

    "rizo-algodon": {
        nombre: "Rizo Algodón",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Rizo Algodón",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Rizo Algodón', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GREEN, icono: 'mov:Rizo Algodón', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌿 ${atacante.pokemon.nombre} usa RIZO ALGODÓN!`);
            
            if (typeof movAsegurarPosicionGlobal === 'function') {
                movAsegurarPosicionGlobal(atacante);
            }
            
            const escudoPropio = Math.floor((atacante.ataqueEspecial || 0) * 8.50);
            if (escudoPropio > 0) {
                atacante.escudoActual = (atacante.escudoActual || 0) + escudoPropio;
                
                if (!atacante._escudosTemporales) atacante._escudosTemporales = [];
                const escudoEntryPropio = { cantidad: escudoPropio, expira: Date.now() + 4000 };
                atacante._escudosTemporales.push(escudoEntryPropio);
                
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: 'mov:Rizo Algodón', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
                actualizarEscudoVisual(atacante);
                
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    const idx = atacante._escudosTemporales.indexOf(escudoEntryPropio);
                    if (idx !== -1) {
                        atacante._escudosTemporales.splice(idx, 1);
                        const eliminado = Math.min(atacante.escudoActual, escudoEntryPropio.cantidad);
                        atacante.escudoActual = Math.max(0, atacante.escudoActual - eliminado);
                        actualizarEscudoVisual(atacante);
                    }
                }, 4000);
            }
            
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Rizo Algodón', 0.4);
            
            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto && a !== atacante);
            
            if (typeof movAsegurarPosicionGlobal === 'function') {
                aliadosVivos.forEach(movAsegurarPosicionGlobal);
            }
            
            const aliadosCercanos = [];
            const origen = movObtenerPosicionGlobal(atacante);
            
            if (!origen) {
                log(`   ⚠️ No se pudo obtener la posición del atacante`);
                return true;
            }
            
            log(`   📍 Posición origen: fila ${origen.fila}, col ${origen.col}`);
            
            for (let aliado of aliadosVivos) {
                if (!aliado || aliado === atacante) continue;
                
                const pa = { fila: aliado._filaGlobal, col: aliado._colGlobal };
                if (typeof pa.fila !== 'number' || typeof pa.col !== 'number') continue;
                
                const df = Math.abs(pa.fila - origen.fila);
                const dc = Math.abs(pa.col - origen.col);
                
                const esAdyacente = Math.max(df, dc) === 1;
                
                log(`   📍 ${aliado.pokemon.nombre} en (${pa.fila},${pa.col}) → df=${df}, dc=${dc} ${esAdyacente ? '✅ adyacente' : '❌ fuera de rango'}`);
                
                if (esAdyacente) {
                    aliadosCercanos.push(aliado);
                }
            }
            
            if (aliadosCercanos.length === 0) {
                log(`   ⚠️ No hay aliados adyacentes para dar escudo`);
                return true;
            }
            
            const escudoAliado = Math.floor((atacante.ataqueEspecial || 0) * 5.00);
            if (escudoAliado > 0) {
                aliadosCercanos.forEach((aliado, idx) => {
                    setTimeout(() => {
                        if (aliado.hp <= 0 || aliado.muerto) return;
                        
                        if (!aliado._escudosTemporales) aliado._escudosTemporales = [];
                        const escudoEntry = { cantidad: escudoAliado, expira: Date.now() + 4000 };
                        aliado._escudosTemporales.push(escudoEntry);
                        
                        aliado.escudoActual = (aliado.escudoActual || 0) + escudoAliado;
                        
                        if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, aliado, 'rgba(74, 222, 128, 0.85)', 400);
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(aliado, { color: MOV_COLOR.GREEN, icono: 'mov:Rizo Algodón', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        actualizarEscudoVisual(aliado);
                        
                        setTimeout(() => {
                            if (aliado.hp <= 0 || aliado.muerto) return;
                            const i = aliado._escudosTemporales.indexOf(escudoEntry);
                            if (i !== -1) {
                                aliado._escudosTemporales.splice(i, 1);
                                const eliminado = Math.min(aliado.escudoActual, escudoEntry.cantidad);
                                aliado.escudoActual = Math.max(0, aliado.escudoActual - eliminado);
                                actualizarEscudoVisual(aliado);
                            }
                        }, 4000);
                    }, idx * 100);
                });
                
                log(`   🛡️ Escudo otorgado a ${aliadosCercanos.length} aliado(s) adyacente(s) (+${escudoAliado} c/u)`);
            }
            
            return true;
        }
    },

    "bomba-lodo": {
        nombre: "Bomba Lodo",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bomba Lodo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.VENOM, shape: null, icono: 'mov:Bomba Lodo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Lodo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`☠️ ${atacante.pokemon.nombre} usa BOMBA LODO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.60));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bomba Lodo', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(126, 34, 206, 0.95)', 500);
            const origenObjetivo = movObtenerPosicionGlobal(objetivoPrincipal);
            const enemigosEnArea = [objetivoPrincipal];
            if (origenObjetivo) {
                const casillasArea = movCasillasEnArea(origenObjetivo, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }
            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Lodo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, idx * 100);
            });
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (!objetivoPrincipal.inmuneImpedimentos) {
                    if (typeof movAplicarVeneno === 'function') movAplicarVeneno(objetivoPrincipal, 20, 5, atacante);
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Lodo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-poison' }); }, 300);
                }
                const defOriginal = objetivoPrincipal.defensa || 0;
                const spDefOriginal = objetivoPrincipal.defensaEspecial || 0;
                objetivoPrincipal.defensa = Math.max(0, defOriginal - 120);
                objetivoPrincipal.defensaEspecial = Math.max(0, spDefOriginal - 120);
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    objetivoPrincipal.defensa = defOriginal;
                    objetivoPrincipal.defensaEspecial = spDefOriginal;
                }, 5000);
            }, 150);
            return true;
        }
    },

    // ========================================================================
    // ===== MOVIMIENTOS SECUNDARIOS COSTE 2 =====
    // ========================================================================

    "giro-rapido": {
        nombre: "Giro Rápido",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Giro Rápido",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Giro Rápido', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Giro Rápido', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💫 ${atacante.pokemon.nombre} usa GIRO RÁPIDO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const defOriginal = atacante.bonusDefense || 0;
            const spDefOriginal = atacante.bonusSpDefense || 0;
            atacante.bonusDefense = defOriginal + 1500;
            atacante.bonusSpDefense = spDefOriginal + 1500;
            atacante.actualizarStats();
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusDefense = defOriginal; atacante.bonusSpDefense = spDefOriginal; atacante.actualizarStats(); }, 5000);
            const escudo = Math.floor(atacante.maxHp * 0.30);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Giro Rápido', 0.4);
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Giro Rápido', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
            const enemigosEnArea = [];
            const casillasArea = movCasillasEnArea(origen, 1);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.40));
            for (let u of enemigosEnArea) {
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(u, { color: MOV_COLOR.CYAN, icono: 'mov:Giro Rápido', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 }); }, 150);
                movAplicarDaño(atacante, u, dañoFinal, false);
            }
            return true;
        }
    },

    "picotazo-veneno": {
        nombre: "Picotazo Veneno",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Picotazo Veneno",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.VENOM, shape: null, icono: 'mov:Picotazo Veneno', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.VENOM, icono: 'mov:Picotazo Veneno', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`☠️ ${atacante.pokemon.nombre} usa PICOTAZO VENENO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Picotazo Veneno', 0.4);
            const objetivos = [];
            const copiaEnemigos = [...enemigosVivos];
            for (let i = 0; i < 3 && copiaEnemigos.length > 0; i++) {
                const idx = Math.floor(Math.random() * copiaEnemigos.length);
                objetivos.push(copiaEnemigos[idx]);
                copiaEnemigos.splice(idx, 1);
            }
            objetivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(168, 85, 247, 0.95)', 400);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.VENOM, icono: 'mov:Picotazo Veneno', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    if (!enemigo.inmuneImpedimentos) {
                        if (typeof movAplicarVeneno === 'function') movAplicarVeneno(enemigo, 30, 5, atacante);
                        const atkOriginal = enemigo.bonusAttack || 1;
                        const spAtkOriginal = enemigo.bonusSpAttack || 1;
                        enemigo.bonusAttack = atkOriginal * 0.70;
                        enemigo.bonusSpAttack = spAtkOriginal * 0.70;
                        enemigo.actualizarStats();
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            enemigo.bonusAttack = atkOriginal;
                            enemigo.bonusSpAttack = spAtkOriginal;
                            enemigo.actualizarStats();
                        }, 5000);
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.VENOM, icono: 'mov:Picotazo Veneno', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-poison' });
                    }
                }, idx * 250);
            });
            return true;
        }
    },

    "psicocorte": {
        nombre: "Psicocorte",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Psicocorte",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Psicocorte', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Psicocorte', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PSICOCORTE!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.20));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Psicocorte', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicocorte', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                const defOriginal = objetivoPrincipal.defensa || 0;
                const spDefOriginal = objetivoPrincipal.defensaEspecial || 0;
                objetivoPrincipal.defensa = Math.max(0, defOriginal - 120);
                objetivoPrincipal.defensaEspecial = Math.max(0, spDefOriginal - 120);
                setTimeout(() => { if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return; objetivoPrincipal.defensa = defOriginal; objetivoPrincipal.defensaEspecial = spDefOriginal; }, 4000);
            }
            atacante._golpeDoble = true;
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicocorte', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true, claseExtra: 'icon-haste' }); }, 300);
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante._golpeDoble = false; }, 4000);
            return true;
        }
    },

    "chuzos": {
        nombre: "Chuzos",
        tipo: MOV_TIPO.AREA,
        alcance: 8,
        area: 1,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Chuzos",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Chuzos', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Chuzos', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa CHUZOS!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const objetivoPrincipal = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            if (!objetivoPrincipal) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Chuzos', 0.4);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            if (posObj && typeof movMarcarCasillaGlobal === 'function') movMarcarCasillaGlobal(posObj.fila, posObj.col, { duracionMs: 2000 });
            const enemigosEnArea = [];
            if (posObj) {
                const casillasArea = movCasillasEnArea(posObj, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
                }
            }
            if (!enemigosEnArea.includes(objetivoPrincipal) && objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) enemigosEnArea.unshift(objetivoPrincipal);
            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Chuzos', intensidad: 'strong', sizeIcono: 'large', duracionMs: 800 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, idx * 100);
            });
            return true;
        }
    },

    "nitrocarga": {
        nombre: "Nitrocarga",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Nitrocarga",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Nitrocarga', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.ORANGE, icono: 'mov:Nitrocarga', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa NITROCARGA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Nitrocarga', 0.4);
            const copiaEnemigos = [...enemigosVivos];
            const BOLAS = 3;
            for (let i = 0; i < BOLAS; i++) {
                const idx = Math.floor(Math.random() * copiaEnemigos.length);
                const enemigo = copiaEnemigos[idx];
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.20));
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(251, 146, 60, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.ORANGE, icono: 'mov:Nitrocarga', intensidad: 'soft', sizeIcono: 'small', duracionMs: 500 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, i * 300);
            }
            const atacanteOrig = movObtenerPosicionGlobal(atacante);
            if (atacanteOrig) {
                const dCol = (atacante.equipo === 'player') ? 1 : -1;
                const nuevaCol = atacanteOrig.col + dCol;
                if (nuevaCol >= 0 && nuevaCol < COLUMNAS_GLOBALES) {
                    const ocupada = contexto.enemigos.some(e => { const pe = movObtenerPosicionGlobal(e); return pe && pe.fila === atacanteOrig.fila && pe.col === nuevaCol; });
                    const ocupadaAliado = (contexto.aliados || []).some(a => { const pa = movObtenerPosicionGlobal(a); return pa && pa.fila === atacanteOrig.fila && pa.col === nuevaCol; });
                    if (!ocupada && !ocupadaAliado) {
                        movSetPosicionGlobal(atacante, atacanteOrig.fila, nuevaCol);
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }
                }
            }
            return true;
        }
    },

    "hoja-aguda": {
        nombre: "Hoja Aguda",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Hoja Aguda",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Hoja Aguda', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GREEN, icono: 'mov:Hoja Aguda', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🍃 ${atacante.pokemon.nombre} usa HOJA AGUDA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hoja Aguda', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(74, 222, 128, 0.95)', 350);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            const enemigosEnArea = [];
            if (posObj) {
                const casillasArea = movCasillasEnArea(posObj, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
                }
            }
            if (!enemigosEnArea.includes(objetivoPrincipal) && objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) enemigosEnArea.unshift(objetivoPrincipal);
            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GREEN, icono: 'mov:Hoja Aguda', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, idx * 100);
            });
            return true;
        }
    },

    "a-bocajarro": {
        nombre: "A Bocajarro",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO_EN_LINEA,
        sonido: "A Bocajarro",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.RED, shape: null, icono: 'mov:A Bocajarro', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:A Bocajarro', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`👊 ${atacante.pokemon.nombre} usa A BOCAJARRO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('A Bocajarro', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(239, 68, 68, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.RED, icono: 'mov:A Bocajarro', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            const curacion = Math.floor((atacante.ataque || 0) * 2.00);
            if (curacion > 0 && atacante.hp > 0 && !atacante.muerto) {
                if (typeof movCurar === 'function') movCurar(atacante, curacion);
                else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 }); }, 250);
            }
            return true;
        }
    },

    "psiquico": {
        nombre: "Psíquico",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Psíquico",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Psíquico', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Psíquico', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PSÍQUICO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Psíquico', 0.4);
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Psíquico', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
            const enemigosEnArea = [];
            const casillasArea = movCasillasEnArea(origen, 1);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.60));
            for (let u of enemigosEnArea) {
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(u, { color: MOV_COLOR.PURPLE, icono: 'mov:Psíquico', intensidad: 'strong', sizeIcono: 'large', duracionMs: 800 }); }, 150);
                movAplicarDaño(atacante, u, dañoFinal, false);
                if (u.hp > 0 && !u.muerto && !u.inmuneImpedimentos) {
                    movAplicarSlow(u, 1.00, 1, '(Inmovilizado por Psíquico)');
                }
            }
            return true;
        }
    },

    "lluevehojas": {
        nombre: "Lluevehojas",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_LEJANO,
        sonido: "Lluevehojas",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Lluevehojas', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GREEN, icono: 'mov:Lluevehojas', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🍃 ${atacante.pokemon.nombre} usa LLUEVEHOJAS!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            let objetivoPrincipal = null;
            let maxDist = -1;
            for (let e of enemigosVivos) {
                const d = movDistanciaChebyshev(atacante, e);
                if (d > maxDist) { maxDist = d; objetivoPrincipal = e; }
            }
            if (!objetivoPrincipal) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.40));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Lluevehojas', 0.4);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            const enemigosEnCamino = enemigosVivos.filter(e => {
                const pe = movObtenerPosicionGlobal(e);
                return pe && pe.fila === posObj.fila;
            });
            const lista = enemigosEnCamino.length > 0 ? enemigosEnCamino : [objetivoPrincipal];
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(74, 222, 128, 0.95)', 450);
            lista.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GREEN, icono: 'mov:Lluevehojas', intensidad: 'strong', sizeIcono: 'large', duracionMs: 800 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, idx * 120);
            });
            return true;
        }
    },

    "patada-ignea": {
        nombre: "Patada Ígnea",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Patada Ígnea",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Patada Ígnea', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.ORANGE, icono: 'mov:Patada Ígnea', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa PATADA ÍGNEA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.50));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Patada Ígnea', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(251, 146, 60, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Patada Ígnea', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                if (typeof movAplicarReduccionDefensas === 'function') movAplicarReduccionDefensas(objetivoPrincipal, 0.25, 5);
            }
            return true;
        }
    },

    "martillo-colosal": {
        nombre: "Martillo Colosal",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Martillo Colosal",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Martillo Colosal', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Martillo Colosal', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔨 ${atacante.pokemon.nombre} usa MARTILLO COLOSAL!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
            const enemigosEnArea = [objetivoPrincipal];
            if (origenObj) {
                const casillasArea = movCasillasEnArea(origenObj, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.40));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Martillo Colosal', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(107, 114, 128, 0.95)', 450);
            setTimeout(() => {
                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Martillo Colosal', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }, idx * 100);
                });
            }, 350);
            return true;
        }
    },

    "mal-de-ojo": {
        nombre: "Mal de Ojo",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Mal de Ojo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Mal de Ojo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Mal de Ojo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`😈 ${atacante.pokemon.nombre} usa MAL DE OJO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const escudo = Math.floor((atacante.ataque || 0) * 6.50);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: '🛡️', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 });
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Mal de Ojo', 0.4);
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u) && u.hp > 0 && !u.muerto) enemigosCercanos.push(u);
                }
            }
            const DURACION = 3;
            enemigosCercanos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    enemigo.taunt = { atacante: atacante, duracion: DURACION, timer: 0 };
                    if (!enemigo.inmuneImpedimentos) movAplicarSlow(enemigo, 1.00, DURACION, '(Inmovilizado por Mal de Ojo)');
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PURPLE, icono: 'mov:Mal de Ojo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                    setTimeout(() => { if (enemigo.hp > 0 && !enemigo.muerto && typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PURPLE, icono: 'mov:Mal de Ojo', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-taunt' }); }, 300);
                }, idx * 100);
            });
            return true;
        }
    },

    "alud": {
        nombre: "Alud",
        tipo: MOV_TIPO.AREA,
        alcance: 8,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_FUERTE,
        sonido: "Alud",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Alud', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Alud', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa ALUD!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            let objetivoPrincipal = enemigosVivos[0];
            let maxSpAtk = -1;
            for (let e of enemigosVivos) {
                const spAtk = e.ataqueEspecial || 0;
                if (spAtk > maxSpAtk) { maxSpAtk = spAtk; objetivoPrincipal = e; }
            }
            if (!objetivoPrincipal) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.60));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Alud', 0.4);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            if (posObj && typeof movMarcarCasillaGlobal === 'function') movMarcarCasillaGlobal(posObj.fila, posObj.col, { duracionMs: 1500 });
            setTimeout(() => {
                const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
                const enemigosEnArea = [];
                if (origenObj) {
                    const casillasArea = movCasillasEnArea(origenObj, 1);
                    for (let c of casillasArea) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
                    }
                }
                if (!enemigosEnArea.includes(objetivoPrincipal) && objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) enemigosEnArea.unshift(objetivoPrincipal);
                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Alud', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        if (enemigo.hp > 0 && !enemigo.muerto && !enemigo.inmuneImpedimentos) {
                            movAplicarSlow(enemigo, 1.00, 1.5, '(Inmovilizado por Alud)');
                        }
                    }, idx * 100);
                });
            }, 600);
            return true;
        }
    },

    "voltio-cruel": {
        nombre: "Voltio Cruel",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Voltio Cruel",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Voltio Cruel', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Voltio Cruel', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa VOLTIO CRUEL!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Voltio Cruel', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(250, 204, 21, 0.95)', 400);
            const NUM_GOLPES = 3;
            const TOTAL = 1.60;
            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * (TOTAL / NUM_GOLPES)));
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.YELLOW, icono: 'mov:Voltio Cruel', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoGolpe, false);
                    if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                        const energiaAntes = objetivoPrincipal.energy || 0;
                        objetivoPrincipal.energy = Math.max(0, energiaAntes - 4);
                    }
                }, i * 250);
            }
            return true;
        }
    },

    "hidroariete": {
        nombre: "Hidroariete",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Hidroariete",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Hidroariete', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌊 ${atacante.pokemon.nombre} usa HIDROARIETE!`);
            const escudo = Math.floor((atacante.ataque || 0) * 4.50);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.BLUE, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            }
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.10));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hidroariete', 0.4);
            enemigosCercanos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, idx * 100);
            });
            return true;
        }
    },

    "luz-lunar": {
        nombre: "Luz Lunar",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Luz Lunar",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Luz Lunar', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Luz Lunar', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌙 ${atacante.pokemon.nombre} usa LUZ LUNAR!`);
            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            const curacionTotal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.80));
            const aliadosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, aliadosVivos);
                    if (u && !aliadosCercanos.includes(u)) aliadosCercanos.push(u);
                }
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Luz Lunar', 0.4);
            const objetivos = [...aliadosCercanos];
            if (!objetivos.includes(atacante)) objetivos.push(atacante);
            const NUM_TICKS = 3;
            const curaPorTick = Math.max(1, Math.floor(curacionTotal / NUM_TICKS));
            for (let i = 0; i < NUM_TICKS; i++) {
                setTimeout(() => {
                    for (let u of objetivos) {
                        if (u.hp <= 0 || u.muerto) continue;
                        if (typeof movCurar === 'function') movCurar(u, curaPorTick);
                        else u.hp = Math.min(u.maxHp, u.hp + curaPorTick);
                    }
                    if (i === 0 && typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PINK, icono: 'mov:Luz Lunar', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500 });
                    }
                }, i * 1000);
            }
            return true;
        }
    },

    "canto-mortal": {
        nombre: "Canto Mortal",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Canto Mortal",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Canto Mortal', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Canto Mortal', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🎵 ${atacante.pokemon.nombre} usa CANTO MORTAL!`);
            const defBase = atacante.defensa || 0;
            const spDefBase = atacante.defensaEspecial || 0;
            atacante.defensa = defBase + 2200;
            atacante.defensaEspecial = spDefBase + 2200;
            atacante.actualizarStats();
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.defensa = defBase; atacante.defensaEspecial = spDefBase; atacante.actualizarStats(); }, 6000);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.60));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Canto Mortal', 0.4);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    for (let enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Canto Mortal', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                }, i * 300);
            }
            enemigosCercanos.forEach((enemigo) => {
                if (enemigo.hp <= 0 || enemigo.muerto) return;
                enemigo._silenciadoHasta = performance.now() + 4000;
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Canto Mortal', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true, claseExtra: 'icon-poison' }); }, 300);
            });
            return true;
        }
    },

    "rayo-carga-zapdos": {
        nombre: "Rayo Carga",
        tipo: MOV_TIPO.AREA,
        alcance: 3,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Rayo Carga",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Rayo Carga', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa RAYO CARGA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const esJugador = atacante.equipo === 'player';
            const posAtk = movObtenerPosicionGlobal(atacante);
            const candidatos = enemigosVivos.filter(e => {
                if (movDistanciaChebyshev(atacante, e) > 3) return false;
                if (!posAtk) return true;
                const pe = movObtenerPosicionGlobal(e);
                if (!pe) return false;
                const dCol = esJugador ? (pe.col - posAtk.col) : (posAtk.col - pe.col);
                return dCol >= 0;
            });
            if (candidatos.length === 0) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.20));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Rayo Carga', 0.4);
            candidatos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(250, 204, 21, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (enemigo._spDefBaseRayo === undefined) enemigo._spDefBaseRayo = enemigo.defensaEspecial || 0;
                        enemigo._rayoCargaStacks = Math.min(4, (enemigo._rayoCargaStacks || 0) + 1);
                        enemigo.defensaEspecial = Math.max(0, Math.floor(enemigo._spDefBaseRayo * (1 - 0.20 * enemigo._rayoCargaStacks)));
                        enemigo.actualizarStats();
                        if (enemigo._rayoCargaResetTimer) clearTimeout(enemigo._rayoCargaResetTimer);
                        enemigo._rayoCargaResetTimer = setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            enemigo.defensaEspecial = enemigo._spDefBaseRayo;
                            enemigo._rayoCargaStacks = 0;
                            delete enemigo._spDefBaseRayo;
                            enemigo.actualizarStats();
                        }, 5000);
                    }
                }, idx * 100);
            });
            return true;
        }
    },

    // ============================================================
    // MOVIMIENTOS COSTE 4 - SECUNDARIOS
    // ============================================================

    "enfado": {
        nombre: "Enfado",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Enfado",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Enfado', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Enfado', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🐉 ${atacante.pokemon.nombre} usa ENFADO!`);
            const DURACION = 8;
            const velOriginal = atacante.bonusAttackSpeed || 1;
            atacante.bonusAttackSpeed = velOriginal * 1.40;
            const atkOriginal = atacante.bonusAttack || 1;
            atacante.bonusAttack = atkOriginal * 1.80;
            atacante.actualizarStats();
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Enfado', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Enfado', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.RED, icono: 'mov:Enfado', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true }); }, 400);
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusAttackSpeed = velOriginal; atacante.bonusAttack = atkOriginal; atacante.actualizarStats(); }, DURACION * 1000);
            return true;
        }
    },

    "acua-cola": {
        nombre: "Acua Cola",
        tipo: MOV_TIPO.LINEAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Acua Cola",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Acua Cola', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Acua Cola', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💧 ${atacante.pokemon.nombre} usa ACUA COLA!`);
            const esJugador = atacante.equipo === 'player';
            const dir = esJugador ? 'derecha' : 'izquierda';
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnCamino = [];
            if (origen) {
                const casillasLinea = movCasillasEnLinea(origen, dir, 8);
                for (const c of casillasLinea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnCamino.includes(u)) enemigosEnCamino.push(u);
                }
            }
            if (enemigosEnCamino.length === 0) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
                if (candidatos.length > 0) {
                    candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                    enemigosEnCamino.push(candidatos[0]);
                }
            }
            if (enemigosEnCamino.length === 0) return false;
            const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * 1.60));
            const curacion = Math.max(1, Math.floor((atacante.ataque || 0) * 1.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Acua Cola', 0.4);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    for (const enemigo of enemigosEnCamino) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Acua Cola', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 500 });
                        movAplicarDaño(atacante, enemigo, dañoGolpe, false);
                    }
                    if (typeof movCurar === 'function') movCurar(atacante, curacion);
                }, i * 250);
            }
            return true;
        }
    },

    "bola-sombra": {
        nombre: "Bola Sombra",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bola Sombra",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Bola Sombra', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Bola Sombra', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌑 ${atacante.pokemon.nombre} usa BOLA SOMBRA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
            if (candidatos.length === 0) return false;
            let obj = null;
            if (objetivo && candidatos.includes(objetivo)) obj = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); obj = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bola Sombra', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, obj, 'rgba(126, 34, 206, 0.95)', 400);
            setTimeout(() => {
                if (obj.hp <= 0 || obj.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(obj, { color: MOV_COLOR.PURPLE, icono: 'mov:Bola Sombra', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, obj, dañoFinal, false);
                if (obj.hp > 0 && !obj.muerto) {
                    const now = performance.now();
                    obj._curacionBloqueadaHasta = now + 4000;
                    obj._dañoAmplificadoHasta = now + 4000;
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(obj, { color: MOV_COLOR.PURPLE, icono: 'mov:Bola Sombra', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true }); }, 300);
                }
            }, 250);
            return true;
        }
    },

    "bostezo": {
        nombre: "Bostezo",
        tipo: MOV_TIPO.AREA,
        alcance: 2,
        area: 2,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bostezo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Bostezo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Bostezo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💤 ${atacante.pokemon.nombre} usa BOSTEZO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                for (const c of movCasillasEnArea(origen, 2)) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            if (enemigosCercanos.length === 0) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 2);
                if (candidatos.length > 0) {
                    candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                    enemigosCercanos.push(candidatos[0]);
                } else return false;
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bostezo', 0.4);
            enemigosCercanos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto || enemigo.inmuneImpedimentos) return;
                    movAplicarSlow(enemigo, 1.00, 3.5, '(Dormido por Bostezo)');
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PINK, icono: 'mov:Bostezo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3500, persistente: true, pulso: true }); }, 300);
                }, idx * 100);
            });
            return true;
        }
    },

    "vozarron": {
        nombre: "Vozarrón",
        tipo: MOV_TIPO.AREA,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Vozarrón",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Vozarrón', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Vozarrón', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`📢 ${atacante.pokemon.nombre} usa VOZARRÓN!`);
            if (typeof atacante._vozarronUsos !== 'number') atacante._vozarronUsos = 0;
            atacante._vozarronUsos += 1;
            const duracion = Math.min(1.5 + (atacante._vozarronUsos - 1) * 0.5, 2.5);
            const esJugador = atacante.equipo === 'player';
            const deltaCol = esJugador ? 1 : -1;
            const origen = movObtenerPosicionGlobal(atacante);
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.25));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Vozarrón', 0.4);
            function enemigosEnCono() {
                const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                const res = [];
                if (!origen) return res;
                for (let d = 1; d <= 3; d++) {
                    const col = origen.col + deltaCol * d;
                    for (const fila of [origen.fila - 1, origen.fila, origen.fila + 1]) {
                        const u = movUnidadEnPosicion({ fila, col }, enemigosVivos);
                        if (u && !res.includes(u)) res.push(u);
                    }
                }
                return res;
            }
            const numTicks = Math.max(1, Math.round(duracion / 0.5));
            for (let i = 0; i < numTicks; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    for (const enemigo of enemigosEnCono()) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PINK, icono: 'mov:Vozarrón', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                }, i * 500);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PINK, icono: 'mov:Vozarrón', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            return true;
        }
    },

    "tormenta-de-arena": {
        nombre: "Tormenta de Arena",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Tormenta de Arena",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Tormenta de Arena', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Tormenta de Arena', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🏜️ ${atacante.pokemon.nombre} usa TORMENTA DE ARENA!`);
            const DURACION = 3;
            const lsOriginal = atacante.lifesteal || 0;
            atacante.lifesteal = lsOriginal + 0.50;
            setTimeout(() => { if (atacante) atacante.lifesteal = lsOriginal; }, DURACION * 1000);
            const dañoTotal = Math.max(1, Math.floor((atacante.ataque || 0) * 0.65));
            const dañoPorTick = Math.max(1, Math.floor(dañoTotal / DURACION));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Tormenta de Arena', 0.4);
            for (let i = 0; i < DURACION; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                    const enemigosCercanos = [];
                    const or = movObtenerPosicionGlobal(atacante);
                    if (or) {
                        for (const c of movCasillasEnArea(or, 1)) {
                            const u = movUnidadEnPosicion(c, enemigosVivos);
                            if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                        }
                    }
                    for (const enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Tormenta de Arena', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoPorTick, false);
                    }
                }, i * 1000);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Tormenta de Arena', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            return true;
        }
    },

    // ============================================================
    // MOVIMIENTOS COSTE 5 - SECUNDARIOS
    // ============================================================

    "giro-fuego-ho-oh": {
        nombre: "Giro Fuego Ho-Oh",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Giro Fuego Ho-Oh",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Giro Fuego Ho-Oh', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego Ho-Oh', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa GIRO FUEGO HO-OH!`);
            const escudo = Math.floor(atacante.maxHp * 1.00);
            if (escudo > 0) {
                aplicarEscudoConFade(atacante, escudo);
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Giro Fuego Ho-Oh', 0.4);
            const DURACION = 3;
            const dañoTotal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.25));
            const dañoPorTick = Math.max(1, Math.floor(dañoTotal / DURACION));
            for (let i = 0; i < DURACION; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                    const or = movObtenerPosicionGlobal(atacante);
                    const enemigosCercanos = [];
                    if (or) {
                        for (const c of movCasillasEnArea(or, 1)) {
                            const u = movUnidadEnPosicion(c, enemigosVivos);
                            if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                        }
                    }
                    for (const enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego Ho-Oh', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoPorTick, false);
                    }
                }, i * 1000);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego Ho-Oh', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200 }); }, 100);
            return true;
        }
    },

    "psicoonda": {
        nombre: "Psicoonda",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Psicoonda",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Psicoonda', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Psicoonda', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PSICOONDA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const objetivoPrincipal = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.50));
            const dmgOrig = objetivoPrincipal.bonusDamage || 1;
            objetivoPrincipal.bonusDamage = dmgOrig * 0.80;
            objetivoPrincipal.actualizarStats();
            atacante.bonusDamageReduction = (atacante.bonusDamageReduction || 1) * 0.40;
            atacante.spriteIdAlternativo = "mega-mewtwo-x";
            atacante._teletransporteAtkBonus = 1.30;
            atacante._teletransporteSpAtkBonus = 1.30;
            atacante._teletransporteVelBonus = 2.00;
            atacante._teletransporteDefBonus = 400;
            atacante._teletransporteSpDefBonus = 400;
            atacante.actualizarStats();
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Psicoonda', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 450);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicoonda', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            }, 250);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicoonda', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200, persistente: false }); }, 100);
            return true;
        }
    },

    "rayo-carga-miraidon": {
        nombre: "Rayo Carga",
        tipo: MOV_TIPO.LINEAL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Rayo Carga",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Rayo Carga', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa RAYO CARGA!`);
            const esJugador = atacante.equipo === 'player';
            const dir = esJugador ? 'derecha' : 'izquierda';
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnLinea = [];
            if (origen) {
                for (const c of movCasillasEnLinea(origen, dir, 4)) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnLinea.includes(u)) enemigosEnLinea.push(u);
                }
            }
            if (enemigosEnLinea.length === 0) return false;
            enemigosEnLinea.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoActual = enemigosEnLinea[0];
            const dañoGolpe = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.35));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Rayo Carga', 0.4);
            function disparar() {
                if (atacante.hp <= 0 || atacante.muerto) return;
                if (objetivoActual.hp <= 0 || objetivoActual.muerto) return;
                for (const enemigo of enemigosEnLinea) {
                    if (enemigo.hp <= 0 || enemigo.muerto) continue;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(250, 204, 21, 0.95)', 300);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'soft', sizeIcono: 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, enemigo, dañoGolpe, false);
                }
                setTimeout(disparar, 400);
            }
            disparar();
            return true;
        }
    }
});
